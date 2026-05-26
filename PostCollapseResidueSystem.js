/**
 * ============================================================================
 * POST-COLLAPSE RESIDUE SYSTEM v1.0
 * ============================================================================
 *
 * RESPONSIBILITY:
 * Own the lifecycle of fracture residue zones left behind after link collapse.
 *
 * DESIGN PHILOSOPHY:
 * - Collapse is not just unlink — it leaves a scar.
 * - The zone stays risky for a short duration.
 * - Re-linking the same nodes requires a deliberate recovery choice.
 * - The collapse changes the player's decision map for 10–20 seconds.
 *
 * LIFECYCLE:
 * 1. link:collapsed → spawn residue zone at link midpoint
 * 2. Every tick → decay riskLevel, update visual, check expiry
 * 3. Expiry → remove visual, emit network:fractureResidueExpired
 * 4. link.created between same node pair → check residue, apply recovery mode
 *
 * RECOVERY MODES:
 * - cleanRebuild: lower penalties, requires conditions
 * - dangerousReconnect: always available, high immediate strain
 *
 * INTEGRATION:
 * const residueSystem = new PostCollapseResidueSystem({ scene, semanticBus, linkingSystem });
 * residueSystem.onLinkCollapsed(payload);
 *
 * ============================================================================
 */

import * as THREE from 'three';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Residue lifetime (ms)
  RESIDUE_DURATION_MS: 16000,
  FRESH_DURATION_MS: 6000,
  COOLING_DURATION_MS: 6000,
  FADING_DURATION_MS: 4000,

  // Recovery mode penalties (applied as multipliers of riskLevel)
  CLEAN_REBUILD_CORRUPTION_PENALTY: 0.12,
  CLEAN_REBUILD_STABILITY_PENALTY: 0.08,
  DANGEROUS_RECONNECT_CORRUPTION_PENALTY: 0.38,
  DANGEROUS_RECONNECT_STABILITY_PENALTY: 0.22,
  DANGEROUS_RECONNECT_IMMEDIATE_STRAIN: 0.45,

  // Clean rebuild conditions
  CLEAN_REBUILD_MAX_RISK: 0.5,
  CLEAN_REBUILD_MIN_NODE_STABILITY: 0.35,

  // Visual
  RING_RADIUS: 1.8,
  RING_SEGMENTS: 56,
  RING_GAP_EVERY: 8,
  RING_OPACITY_FRESH: 0.09,
  RING_OPACITY_FADE: 0.02,
  SEAM_OPACITY_FRESH: 0.075,
  SEAM_OPACITY_FADE: 0.015,
  SHARD_COUNT: 12,
  SHARD_OPACITY_FRESH: 0.18,
  SHARD_OPACITY_FADE: 0.04,

  // Performance
  MAX_CONCURRENT_RESIDUES: 16,
  LOD_DISTANCE: 60,
};

// ============================================================================
// RESIDUE ZONE STATE
// ============================================================================

class ResidueZone {
  constructor(id, sourceNodeId, targetNodeId, position, createdAt) {
    this.id = id;
    this.sourceNodeId = sourceNodeId;
    this.targetNodeId = targetNodeId;
    this.position = position.clone();
    this.createdAt = createdAt;
    this.expiresAt = createdAt + CONFIG.RESIDUE_DURATION_MS;
    this.riskLevel = 1.0;
    this.stage = 'fresh';
    this.visualRef = null;
    this.active = true;
  }

  update(now) {
    if (!this.active) return false;

    const elapsed = now - this.createdAt;
    const total = CONFIG.RESIDUE_DURATION_MS;
    const progress = Math.min(1, Math.max(0, elapsed / total));

    // Risk decays non-linearly: stays high longer, then drops
    this.riskLevel = Math.pow(1 - progress, 1.4);

    if (elapsed < CONFIG.FRESH_DURATION_MS) {
      this.stage = 'fresh';
    } else if (elapsed < CONFIG.FRESH_DURATION_MS + CONFIG.COOLING_DURATION_MS) {
      this.stage = 'cooling';
    } else {
      this.stage = 'fading';
    }

    if (now >= this.expiresAt) {
      this.active = false;
      return true; // expired
    }
    return false;
  }
}

// ============================================================================
// POST COLLAPSE RESIDUE SYSTEM
// ============================================================================

export class PostCollapseResidueSystem {
  constructor(options = {}) {
    this.scene = options.scene || null;
    this.semanticBus = options.semanticBus || null;
    this.linkingSystem = options.linkingSystem || null;
    this.config = { ...CONFIG, ...(options.config || {}) };

    this.residues = new Map(); // id → ResidueZone
    this.residueRoot = null;
    this._eventDisposers = [];
    this._sequence = 0;

    this._initVisualRoot();
    this._bindEvents();
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  dispose() {
    for (const disposer of this._eventDisposers) {
      if (typeof disposer === 'function') disposer();
    }
    this._eventDisposers = [];

    for (const residue of this.residues.values()) {
      this._disposeResidueVisual(residue);
    }
    this.residues.clear();

    if (this.residueRoot) {
      this.residueRoot.parent?.remove(this.residueRoot);
      this._disposeObjectTree(this.residueRoot);
      this.residueRoot = null;
    }
  }

  _initVisualRoot() {
    if (!this.scene) return;
    this.residueRoot = new THREE.Group();
    this.residueRoot.name = 'PostCollapseResidueRoot';
    this.scene.add(this.residueRoot);
  }

  _bindEvents() {
    if (!this.semanticBus) return;

    const register = (tag, handler) => {
      const disposer = eventRegistrationRegistry.register(
        'PostCollapseResidueSystem', tag, handler, this.semanticBus
      );
      this._eventDisposers.push(disposer);
    };

    register('link:collapsed', (payload) => {
      this.onLinkCollapsed(payload);
    });

    register('link.created', (payload) => {
      this.onLinkCreated(payload);
    });
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  onLinkCollapsed(payload) {
    const link = payload?.link;
    if (!link) return;

    const sourceNodeId = this._resolveNodeId(link.source);
    const targetNodeId = this._resolveNodeId(link.target);
    if (!sourceNodeId || !targetNodeId) return;

    // Prevent duplicate residue for same pair while one is active
    const pairKey = this._pairKey(sourceNodeId, targetNodeId);
    for (const existing of this.residues.values()) {
      if (this._pairKey(existing.sourceNodeId, existing.targetNodeId) === pairKey && existing.active) {
        return;
      }
    }

    // Enforce max concurrent
    if (this.residues.size >= this.config.MAX_CONCURRENT_RESIDUES) {
      this._evictOldestResidue();
    }

    const position = this._computeMidpoint(link);
    const now = Date.now();
    const id = `residue.${sourceNodeId}-${targetNodeId}-${now}`;
    const residue = new ResidueZone(id, sourceNodeId, targetNodeId, position, now);

    this.residues.set(id, residue);
    this._spawnResidueVisual(residue);

    this._emit('network:fractureResidueCreated', {
      residueId: id,
      sourceNodeId,
      targetNodeId,
      position: { x: position.x, y: position.y, z: position.z },
      riskLevel: residue.riskLevel,
      stage: residue.stage,
      createdAt: now,
      expiresAt: residue.expiresAt,
    });
  }

  onLinkCreated(payload) {
    const link = payload?.link;
    if (!link) return;

    const sourceNodeId = this._resolveNodeId(link.source);
    const targetNodeId = this._resolveNodeId(link.target);
    if (!sourceNodeId || !targetNodeId) return;

    const pairKey = this._pairKey(sourceNodeId, targetNodeId);
    let activeResidue = null;
    for (const residue of this.residues.values()) {
      if (this._pairKey(residue.sourceNodeId, residue.targetNodeId) === pairKey && residue.active) {
        activeResidue = residue;
        break;
      }
    }

    if (!activeResidue || activeResidue.riskLevel <= 0.2) return;

    // Determine recovery mode
    const mode = this._selectRecoveryMode(link, activeResidue);
    const risk = activeResidue.riskLevel;

    if (mode === 'cleanRebuild') {
      link.userData.recoveryMode = 'cleanRebuild';
      link.userData.corruptionPenalty = this.config.CLEAN_REBUILD_CORRUPTION_PENALTY * risk;
      link.userData.stabilityPenalty = this.config.CLEAN_REBUILD_STABILITY_PENALTY * risk;
      link.userData.immediateStrain = 0;
    } else {
      link.userData.recoveryMode = 'dangerousReconnect';
      link.userData.corruptionPenalty = this.config.DANGEROUS_RECONNECT_CORRUPTION_PENALTY * risk;
      link.userData.stabilityPenalty = this.config.DANGEROUS_RECONNECT_STABILITY_PENALTY * risk;
      link.userData.immediateStrain = this.config.DANGEROUS_RECONNECT_IMMEDIATE_STRAIN * risk;
    }

    this._emit('network:recoveryModeChosen', {
      mode,
      residueId: activeResidue.id,
      sourceNodeId,
      targetNodeId,
      riskLevel: risk,
      penalties: {
        corruption: link.userData.corruptionPenalty,
        stability: link.userData.stabilityPenalty,
        immediateStrain: link.userData.immediateStrain,
      },
    });
  }

  update(deltaTime) {
    const now = Date.now();
    const expired = [];

    for (const [id, residue] of this.residues) {
      const didExpire = residue.update(now);
      if (this.residueRoot) {
        this._updateResidueVisual(residue, deltaTime);
      }

      if (didExpire) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      const residue = this.residues.get(id);
      if (residue) {
        this._disposeResidueVisual(residue);
        this.residues.delete(id);
        this._emit('network:fractureResidueExpired', {
          residueId: id,
          sourceNodeId: residue.sourceNodeId,
          targetNodeId: residue.targetNodeId,
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  getResidueForPair(sourceNodeId, targetNodeId) {
    const pairKey = this._pairKey(sourceNodeId, targetNodeId);
    for (const residue of this.residues.values()) {
      if (this._pairKey(residue.sourceNodeId, residue.targetNodeId) === pairKey && residue.active) {
        return residue;
      }
    }
    return null;
  }

  getResiduesNear(position, radius) {
    const results = [];
    const r2 = radius * radius;
    for (const residue of this.residues.values()) {
      if (!residue.active) continue;
      const dx = residue.position.x - position.x;
      const dy = residue.position.y - position.y;
      const dz = residue.position.z - position.z;
      if (dx * dx + dy * dy + dz * dz <= r2) {
        results.push(residue);
      }
    }
    return results;
  }

  getActiveResidueCount() {
    let count = 0;
    for (const r of this.residues.values()) {
      if (r.active) count++;
    }
    return count;
  }

  getDebugSnapshot() {
    return {
      activeResidues: this.getActiveResidueCount(),
      totalTracked: this.residues.size,
      residues: Array.from(this.residues.values()).map(r => ({
        id: r.id,
        sourceNodeId: r.sourceNodeId,
        targetNodeId: r.targetNodeId,
        riskLevel: parseFloat(r.riskLevel.toFixed(3)),
        stage: r.stage,
        secondsRemaining: Math.max(0, Math.round((r.expiresAt - Date.now()) / 1000)),
      })),
    };
  }

  // --------------------------------------------------------------------------
  // Recovery Mode Selection
  // --------------------------------------------------------------------------

  _selectRecoveryMode(link, residue) {
    const source = link.source;
    const target = link.target;

    const srcStability = source?.userData?.metrics?.stability ?? source?.userData?.stability ?? 1;
    const tgtStability = target?.userData?.metrics?.stability ?? target?.userData?.stability ?? 1;
    const minStability = Math.min(srcStability, tgtStability);

    // Clean rebuild only available when risk is moderate and nodes are stable enough
    if (residue.riskLevel <= this.config.CLEAN_REBUILD_MAX_RISK &&
        minStability >= this.config.CLEAN_REBUILD_MIN_NODE_STABILITY) {
      return 'cleanRebuild';
    }

    return 'dangerousReconnect';
  }

  // --------------------------------------------------------------------------
  // Visuals
  // --------------------------------------------------------------------------

  _spawnResidueVisual(residue) {
    if (!this.residueRoot) return;

    const group = new THREE.Group();
    group.position.copy(residue.position);
    group.name = `ResidueZone_${residue.id}`;

    // Broken ring
    const ringGeo = this._createBrokenRingGeometry({
      radius: this.config.RING_RADIUS,
      segments: this.config.RING_SEGMENTS,
      gapEvery: this.config.RING_GAP_EVERY,
      gapLength: 1,
      radialJitter: this.config.RING_RADIUS * 0.05,
      yJitter: this.config.RING_RADIUS * 0.018,
    });
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: this.config.RING_OPACITY_FRESH,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.LineSegments(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.userData.baseOpacity = ringMat.opacity;
    group.add(ring);

    // Veil seam
    const seamGeo = new THREE.PlaneGeometry(
      this.config.RING_RADIUS * 0.52,
      this.config.RING_RADIUS * 1.12,
      8, 8
    );
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xff6644,
      transparent: true,
      opacity: this.config.SEAM_OPACITY_FRESH,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.rotation.y = 0.18;
    seam.userData.baseOpacity = seamMat.opacity;
    group.add(seam);

    // Shard particles
    const shardCount = this.config.SHARD_COUNT;
    const shardGeo = new THREE.BufferGeometry();
    const shardPositions = new Float32Array(shardCount * 3);
    for (let i = 0; i < shardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.config.RING_RADIUS * (0.3 + Math.random() * 0.7);
      shardPositions[i * 3] = Math.cos(angle) * r;
      shardPositions[i * 3 + 1] = (Math.random() - 0.5) * this.config.RING_RADIUS * 0.3;
      shardPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    shardGeo.setAttribute('position', new THREE.BufferAttribute(shardPositions, 3));
    const shardMat = new THREE.PointsMaterial({
      color: 0xff8866,
      size: this.config.RING_RADIUS * 0.012,
      transparent: true,
      opacity: this.config.SHARD_OPACITY_FRESH,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shards = new THREE.Points(shardGeo, shardMat);
    shards.userData.baseOpacity = shardMat.opacity;
    group.add(shards);

    this.residueRoot.add(group);
    residue.visualRef = group;
  }

  _updateResidueVisual(residue, deltaTime) {
    if (!residue.visualRef) return;

    const group = residue.visualRef;
    const t = Date.now();
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0015 + residue.createdAt * 0.0001);

    // Stage-based color and opacity
    let targetColor, targetOpacityMul;
    if (residue.stage === 'fresh') {
      targetColor = new THREE.Color(0xff4444);
      targetOpacityMul = 1.0;
    } else if (residue.stage === 'cooling') {
      targetColor = new THREE.Color(0xff8844);
      targetOpacityMul = 0.6 + pulse * 0.2;
    } else {
      targetColor = new THREE.Color(0xccaa88);
      targetOpacityMul = 0.25 + pulse * 0.1;
    }

    const fadeProgress = 1 - residue.riskLevel;
    const opacityMul = targetOpacityMul * (1 - fadeProgress * 0.8);

    group.children.forEach(child => {
      if (!child.material) return;
      const baseOpacity = child.userData.baseOpacity || 0.05;
      child.material.opacity = baseOpacity * opacityMul;

      if (child.material.color && targetColor) {
        child.material.color.lerp(targetColor, 0.02);
      }
    });

    // Slow rotation
    group.rotation.y += deltaTime * 0.08;

    // Scale pulse
    const scalePulse = 1.0 + pulse * 0.04 * residue.riskLevel;
    group.scale.setScalar(scalePulse);
  }

  _disposeResidueVisual(residue) {
    if (!residue.visualRef) return;
    const group = residue.visualRef;
    group.parent?.remove(group);
    this._disposeObjectTree(group);
    residue.visualRef = null;
  }

  _evictOldestResidue() {
    let oldest = null;
    let oldestTime = Infinity;
    for (const residue of this.residues.values()) {
      if (residue.createdAt < oldestTime) {
        oldestTime = residue.createdAt;
        oldest = residue;
      }
    }
    if (oldest) {
      this._disposeResidueVisual(oldest);
      this.residues.delete(oldest.id);
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  _resolveNodeId(node) {
    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.uuid ?? null;
  }

  _pairKey(a, b) {
    // Canonical ordering so A-B and B-A match
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  _computeMidpoint(link) {
    const src = link.source?.position || new THREE.Vector3();
    const tgt = link.target?.position || new THREE.Vector3();
    return new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5);
  }

  _emit(tag, payload) {
    if (!this.semanticBus?.emit) return;
    this.semanticBus.emit(tag, { ...payload, source: 'PostCollapseResidueSystem', timestamp: Date.now() });
  }

  _createBrokenRingGeometry({ radius, segments, gapEvery, gapLength, radialJitter, yJitter }) {
    const positions = [];
    for (let i = 0; i < segments; i++) {
      const isGap = (i % gapEvery) < gapLength;
      if (isGap) continue;
      const angle = (i / segments) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * (radialJitter || 0);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * (yJitter || 0);
      positions.push(x, y, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }

  _disposeObjectTree(obj) {
    if (!obj) return;
    obj.traverse?.((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose?.());
        } else {
          child.material.dispose?.();
        }
      }
    });
  }
}
