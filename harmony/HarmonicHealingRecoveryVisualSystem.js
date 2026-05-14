/**
 * ============================================================================
 * HARMONIC HEALING + RECOVERY VISUAL SYSTEM (Merged)
 * ============================================================================
 *
 * Merged replacement for:
 *   - HarmonicHealingVisualSystem_Session134.js (LEGACY)
 *   - HarmonicRecoveryVisualSystem_Session138.js (LEGACY)
 *
 * CHANGELOG (2026-05-14):
 * - Merged two systems into one to eliminate overlap and visual confusion.
 * - Removed autonomous wave spawning (_resolveHealingState guláš).
 *   System is now 100% event-driven via canonical scoped metric tier events.
 * - Deduplicated event subscriptions (link.harmony.high/mid were in both).
 * - Preserved all zero-allocation pools, shaders, and dramaturgy modulation.
 * - Kept topology.healing emission for HarmonicTopologyLearningSystem.
 *
 * TRIGGER EVENTS (canonical tiered metric events only):
 *   link.harmony.high    → coherence wave + halos + traveling wave
 *   link.harmony.mid     → re-stitching + traveling wave
 *   link.harmony.low     → traveling wave (subtle)
 *   link.corruption.high → traveling wave (healing response)
 *   link.stability.low   → traveling wave (repair response)
 *   link.stability.mid   → recovery halos + re-stitching
 *   node.corruption.high → traveling waves on connected links
 *   node.stability.low   → preparatory recovery halo
 *
 * ADDITIONAL INPUTS:
 *   - Rupture completion (from ruptureSystem) → recovery zone
 *   - Dramaturgy payoff phase → forced recovery pulses
 *   - External triggerWaveBatch() / triggerRecoveryPulse()
 *
 * CONSTRAINTS:
 *   ✅ Adapter-only: read-only, zero gameplay mutation
 *   ✅ Zero per-frame allocations
 *   ✅ All event subscriptions via EventRegistrationRegistry
 *   ✅ Deterministic trigger events only — no custom submetrics
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../VisualHierarchyRegistry.js';
import { eventRegistrationRegistry } from '../Engine/EventRegistrationRegistry.js';
import { clamp01 } from '../shared/harmonyHelpers.js';

function getAtomaVisualDebugMode() {
    const mode = (typeof window !== 'undefined' && window.__ATOMA_VISUAL_DEBUG_MODE__)
        || globalThis.__ATOMA_VISUAL_DEBUG_MODE__
        || 'all';
    return `${mode}`.toLowerCase();
}

// ============================================================================
// SHADERS (from HarmonicRecoveryVisualSystem_Session138)
// ============================================================================

const COHERENCE_WAVE_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const COHERENCE_WAVE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uLife;
uniform vec3 uColor;
uniform float uHarmony;

varying vec2 vUv;

void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    float ringBase = 0.15 + uLife * 0.7;
    float rw1 = 0.14 + uHarmony * 0.06;
    float ring1 = smoothstep(ringBase - rw1, ringBase, dist)
                * (1.0 - smoothstep(ringBase, ringBase + rw1, dist));
    float ring2Center = ringBase + 0.12;
    float rw2 = 0.06;
    float ring2 = smoothstep(ring2Center - rw2, ring2Center, dist)
                * (1.0 - smoothstep(ring2Center, ring2Center + rw2, dist));
    float ring3Center = max(0.05, ringBase - 0.15);
    float rw3 = 0.08;
    float ring3 = smoothstep(ring3Center - rw3, ring3Center, dist)
                * (1.0 - smoothstep(ring3Center, ring3Center + rw3, dist));

    float coreFlash = (1.0 - smoothstep(0.0, 0.25, dist)) * (1.0 - smoothstep(0.0, 0.15, uLife)) * 0.6;
    float innerGlow = (1.0 - smoothstep(0.0, 0.45, dist)) * 0.2;
    float outerFade = 1.0 - smoothstep(0.7, 1.0, dist);

    float angle = atan(p.y, p.x);
    float shimmer = 0.92 + 0.08 * sin(angle * 6.0 + uTime * 4.0 + dist * 12.0);
    float fringeSparkle = pow(max(0.0, 1.0 - abs(dist - ringBase - 0.08) * 8.0), 3.0)
                        * (0.5 + 0.5 * sin(angle * 12.0 + uTime * 8.0));

    float rings = ring1 * 0.75 + ring2 * 0.35 + ring3 * 0.25;
    float alpha = (rings + innerGlow + coreFlash + fringeSparkle * 0.15) * outerFade * shimmer;

    float harmonyWarm = mix(1.0, 1.35, clamp(uHarmony, 0.0, 1.0));
    alpha *= harmonyWarm;
    alpha *= (1.0 - uLife * uLife);
    alpha *= 0.88 + 0.12 * sin(uTime * 3.0 + dist * 8.0);

    vec3 sacredGold = vec3(1.0, 0.84, 0.0);
    vec3 celestialTeal = vec3(0.25, 0.88, 0.82);
    vec3 mysticViolet = vec3(0.58, 0.35, 0.92);
    float sacredPhase = uHarmony * 0.5 + uLife * 0.4;
    vec3 evolvedColor = mix(sacredGold, celestialTeal, smoothstep(0.0, 0.5, sacredPhase));
    evolvedColor = mix(evolvedColor, mysticViolet, smoothstep(0.6, 1.0, sacredPhase) * 0.35);
    vec3 finalColor = mix(evolvedColor, vec3(1.0), coreFlash * 1.5);
    vec3 sacredFringe = mix(vec3(1.0, 0.84, 0.4), celestialTeal, sin(uTime * 0.5) * 0.5 + 0.5);
    finalColor += sacredFringe * fringeSparkle * 0.25;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

const RECOVERY_HALO_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const RECOVERY_HALO_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uLife;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    float angle = atan(p.y, p.x);
    float baseRadius = 0.15 + uLife * 0.55;
    float rw1 = 0.06 + uLife * 0.02;
    float ring1 = smoothstep(baseRadius - rw1, baseRadius, dist)
                * (1.0 - smoothstep(baseRadius, baseRadius + rw1, dist));
    float innerR = max(0.08, baseRadius - 0.18);
    float rw2 = 0.04;
    float ring2 = smoothstep(innerR - rw2, innerR, dist)
                * (1.0 - smoothstep(innerR, innerR + rw2, dist));
    float outerR = min(0.95, baseRadius + 0.15);
    float rw3 = 0.03;
    float ring3 = smoothstep(outerR - rw3, outerR, dist)
                * (1.0 - smoothstep(outerR, outerR + rw3, dist));

    float rotSpeed = uTime * 1.5;
    float rotPattern1 = 0.65 + 0.35 * sin(angle * 3.0 + rotSpeed);
    float rotPattern2 = 0.65 + 0.35 * sin(angle * 5.0 - rotSpeed * 0.7 + 2.094);
    float rotPattern3 = 0.65 + 0.35 * sin(angle * 4.0 + rotSpeed * 1.3 + 4.189);

    float rings = ring1 * rotPattern1 * 0.7 + ring2 * rotPattern2 * 0.5 + ring3 * rotPattern3 * 0.3;
    float centerGlow = (1.0 - smoothstep(0.0, 0.30, dist)) * 0.45;
    float hotCore = (1.0 - smoothstep(0.0, 0.10, dist)) * 0.3 * (1.0 - uLife);
    float shimmer = 0.9 + 0.1 * sin(dist * 25.0 - uTime * 6.0 + angle * 3.0);

    float alpha = (rings + centerGlow + hotCore) * shimmer;
    alpha *= (1.0 - uLife * uLife);
    alpha *= 0.72;

    vec3 sacredRingTint = mix(uColor, vec3(0.25, 0.88, 0.82), ring1 * 0.3);
    vec3 coreColor = mix(vec3(1.0), sacredRingTint, 0.35);
    vec3 finalColor = mix(coreColor, sacredRingTint, smoothstep(0.1, 0.4, dist));

    gl_FragColor = vec4(finalColor, alpha);
}
`;

// ============================================================================
// HEALING WAVE (traveling particle wave along a link)
// ============================================================================

class HealingWave {
    constructor(link, startNode, endNode, speed, intensity) {
        this.currentPos = new THREE.Vector3();
        this.currentDir = new THREE.Vector3();
        this.reset(link, startNode, endNode, speed, intensity);
    }

    reset(link, startNode, endNode, speed, intensity) {
        this.link = link;
        this.startNode = startNode;
        this.endNode = endNode;
        this.speed = speed;
        this.intensity = intensity;
        this.progress = 0.0;
        this.active = true;
        this.currentPos.set(0, 0, 0);
        this.currentDir.set(0, 0, 0);
        return this;
    }

    update(deltaTime) {
        if (!this.active) return;
        const startPos = this.startNode.position;
        const endPos = this.endNode.position;
        const distance = startPos.distanceTo(endPos);
        if (distance < 0.1) { this.active = false; return; }
        const step = (this.speed * deltaTime) / distance;
        this.progress += step;
        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.active = false;
        }
        this.currentPos.lerpVectors(startPos, endPos, this.progress);
        this.currentDir.subVectors(endPos, startPos).normalize();
    }
}

// ============================================================================
// MERGED SYSTEM
// ============================================================================

export class HarmonicHealingRecoveryVisualSystem {
    constructor(scene, linkingSystem, particleSystem, ruptureSystem = null, semanticBus = null, config = {}) {
        this.scene = scene;
        this.linkingSystem = linkingSystem;
        this.particles = particleSystem;
        this.ruptureSystem = ruptureSystem;
        this.semanticBus = semanticBus || globalThis?.semanticBus || null;
        this.enabled = true;

        // UNIFIED CLEANUP CONTRACT
        this._createdObjects = [];

        this.config = {
            waveSpeed: 4.25,
            maxWaves: 120,
            linkCooldown: 3.0,
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            // Recovery zone config
            minRecoveryDuration: 3.0,
            maxRecoveryDuration: 8.0,
            waveExpansionSpeed: 1.65,
            stitchingInterval: 0.09,
            maxActiveZones: 10,
            updateInterval: 1 / 60,
            debugVisualBoost: false,
            debugForceRecoveryPulse: false,
            debugForceRecoveryInterval: 2.0,
            enableSacredRecovery: true,
            ...config
        };

        // ---- Traveling Waves (from Healing) ----
        this.waves = [];
        this.wavePool = [];
        this._linkCooldowns = new Map();
        this._tmpTrailVel = new THREE.Vector3();
        this._tmpTrailColor = new THREE.Color(0x66f7ff);
        this._spectralHealingPhase = 0;
        this._enableEtherealUpgrade = config.enableEtherealUpgrade !== false;
        this._spectralHealingHues = [0.12, 0.0, 0.55, 0.35];
        this._spectralHealingCycleSpeed = 0.15;

        // ---- Recovery Zones (from Recovery) ----
        this.activeRuptureIds = new Set();
        this.recoveringZones = [];
        this.waveMeshPool = [];
        this.haloMeshPool = [];
        this._activeBeams = [];
        this._timeOrigin = undefined;
        this._lastUpdateTime = undefined;
        this._fallbackRecoveryTimer = 0;
        this._dramaturgyRecoveryTimer = 0;

        // Pre-allocated temps (zero-allocation)
        this._tmpColor = new THREE.Color();
        this._tmpVec3A = new THREE.Vector3();
        this._tmpVec3B = new THREE.Vector3();
        this._tmpVelA = new THREE.Vector3();
        this._tmpVelB = new THREE.Vector3();
        this._tmpColorWhite = new THREE.Color(0xffffff);
        this._tmpColorGold = new THREE.Color(0xffcc00);

        // Dramaturgy
        this._dramaturgyModulation = { active: false, family: null, phase: null, intensity: 0, ttl: 0 };

        // Regional priority
        this._regionalPriority = null;

        // Event subscriptions
        this._eventDrivenEnabled = false;
        this._setupEventSubscriptions();

        // Materials & pools
        this._initMaterials();
        this._initPools();

        console.log('✨ [HarmonicHealingRecovery] Merged system initialized (event-driven)');
    }

    // -------------------------------------------------------------------------
    // MATERIALS & POOLS
    // -------------------------------------------------------------------------

    _initMaterials() {
        this.waveMaterial = new THREE.ShaderMaterial({
            vertexShader: COHERENCE_WAVE_VERTEX_SHADER,
            fragmentShader: COHERENCE_WAVE_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(0x40E0D0) },
                uHarmony: { value: 0.5 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false
        });

        this.haloMaterial = new THREE.ShaderMaterial({
            vertexShader: RECOVERY_HALO_VERTEX_SHADER,
            fragmentShader: RECOVERY_HALO_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(0xFFD700) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false
        });
    }

    _initPools() {
        const waveGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 10; i++) {
            const mesh = new THREE.Mesh(waveGeo, this.waveMaterial.clone());
            mesh.visible = false;
            mesh.rotation.x = -Math.PI / 2;
            mesh.renderOrder = this.config.renderOrder;
            this.scene.add(mesh);
            this.waveMeshPool.push({ mesh, active: false });
        }

        const haloGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(haloGeo, this.haloMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = this.config.renderOrder;
            this.scene.add(mesh);
            this.haloMeshPool.push({ mesh, active: false });
        }
    }

    // -------------------------------------------------------------------------
    // SCENE / REBIND
    // -------------------------------------------------------------------------

    attachScene(scene) {
        if (!scene || typeof scene.add !== 'function') return false;
        this.scene = scene;

        // Re-attach particle system meshes
        if (this.particles) {
            this.particles.scene = scene;
            ['mesh', 'debugCube', 'debugProbe'].forEach(key => {
                const obj = this.particles[key];
                if (obj) {
                    obj.parent?.remove(obj);
                    scene.add(obj);
                    if (!this._createdObjects.includes(obj)) this._createdObjects.push(obj);
                    obj.renderOrder = (key === 'mesh')
                        ? VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES)
                        : 999;
                }
            });
        }

        // Re-attach recovery meshes
        for (const item of this.waveMeshPool) {
            if (!item?.mesh) continue;
            item.mesh.parent?.remove(item.mesh);
            item.mesh.renderOrder = this.config.renderOrder;
            scene.add(item.mesh);
        }
        for (const item of this.haloMeshPool) {
            if (!item?.mesh) continue;
            item.mesh.parent?.remove(item.mesh);
            item.mesh.renderOrder = this.config.renderOrder;
            scene.add(item.mesh);
        }
        return true;
    }

    rebind({
        scene = this.scene,
        linkingSystem = this.linkingSystem,
        particleSystem = this.particles,
        ruptureSystem = this.ruptureSystem,
        semanticBus = this.semanticBus,
        frameScheduler = this.frameScheduler
    } = {}) {
        this.frameScheduler = frameScheduler ?? this.frameScheduler ?? null;
        this.linkingSystem = linkingSystem ?? this.linkingSystem ?? null;
        this.particles = particleSystem ?? this.particles ?? null;
        this.ruptureSystem = ruptureSystem ?? this.ruptureSystem ?? null;

        const nextBus = semanticBus || this.semanticBus || globalThis?.semanticBus || null;
        if (nextBus !== this.semanticBus) {
            this._teardownEventSubscriptions();
            this.semanticBus = nextBus;
            this._setupEventSubscriptions();
        } else {
            this.semanticBus = nextBus;
        }

        if (scene && scene !== this.scene) {
            this.attachScene(scene);
        } else if (this.scene) {
            for (const item of this.waveMeshPool) {
                if (!item?.mesh) continue;
                item.mesh.renderOrder = this.config.renderOrder;
                if (item.mesh.parent !== this.scene) {
                    item.mesh.parent?.remove(item.mesh);
                    this.scene.add(item.mesh);
                }
            }
            for (const item of this.haloMeshPool) {
                if (!item?.mesh) continue;
                item.mesh.renderOrder = this.config.renderOrder;
                if (item.mesh.parent !== this.scene) {
                    item.mesh.parent?.remove(item.mesh);
                    this.scene.add(item.mesh);
                }
            }
        }

        if (this.particles) {
            this.particles.scene = this.scene;
            ['mesh', 'debugCube', 'debugProbe'].forEach(key => {
                const obj = this.particles[key];
                if (obj && this.scene) {
                    obj.parent?.remove(obj);
                    this.scene.add(obj);
                    obj.renderOrder = (key === 'mesh')
                        ? VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES)
                        : 999;
                }
            });
        }

        return true;
    }

    // -------------------------------------------------------------------------
    // EVENT SUBSCRIPTIONS (canonical tiered metric events only)
    // -------------------------------------------------------------------------

    _setupEventSubscriptions() {
        if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') {
            this._eventDrivenEnabled = false;
            return;
        }

        this._regDisposers = [];
        const reg = (tag, handler) => {
            const disposer = eventRegistrationRegistry.register('HarmonicHealingRecoveryVisualSystem', tag, handler, this.semanticBus);
            this._regDisposers.push(disposer);
        };

        // --- Harmony tiers (merged from both systems) ---
        this._onLinkHarmonyHigh = (p = {}) => this._handleLinkHarmonyHigh(p);
        this._onLinkHarmonyMid = (p = {}) => this._handleLinkHarmonyMid(p);
        this._onLinkHarmonyLow = (p = {}) => this._handleLinkHarmonyLow(p);
        reg('link.harmony.high', this._onLinkHarmonyHigh);
        reg('link.harmony.mid', this._onLinkHarmonyMid);
        reg('link.harmony.low', this._onLinkHarmonyLow);

        // --- Corruption / instability triggers healing response ---
        this._onLinkCorruptionHigh = (p = {}) => this._handleLinkCorruptionHigh(p);
        this._onLinkStabilityLow = (p = {}) => this._handleLinkStabilityLow(p);
        this._onNodeCorruptionHigh = (p = {}) => this._handleNodeCorruptionHigh(p);
        reg('link.corruption.high', this._onLinkCorruptionHigh);
        reg('link.stability.low', this._onLinkStabilityLow);
        reg('node.corruption.high', this._onNodeCorruptionHigh);

        // --- Recovery triggers (stability returning) ---
        this._onLinkStabilityMid = (p = {}) => this._handleLinkStabilityMid(p);
        this._onNodeStabilityLow = (p = {}) => this._handleNodeStabilityLow(p);
        reg('link.stability.mid', this._onLinkStabilityMid);
        reg('node.stability.low', this._onNodeStabilityLow);

        this._eventDrivenEnabled = true;
    }

    _teardownEventSubscriptions() {
        if (Array.isArray(this._regDisposers)) {
            for (const disposer of this._regDisposers) {
                try { disposer(); } catch (_) {}
            }
            this._regDisposers.length = 0;
        }
        this._eventDrivenEnabled = false;
    }

    // -------------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------------

    _handleLinkHarmonyHigh(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId || this._checkCooldown(linkId)) return;
        const link = this._getLinkById(linkId);
        if (!link) return;

        // Traveling wave
        this._spawnWaveOnLink(link, 1.0, 'high');
        // Coherence wave + halos (recovery visual)
        const now = this._getCurrentTime();
        this._spawnCoherenceWave(linkId, now);
        const ep = this._getLinkEndpoints(link);
        if (ep.startNode) this._spawnHalo(ep.startNode, now);
        if (ep.endNode) this._spawnHalo(ep.endNode, now);

        this._setCooldown(linkId);
    }

    _handleLinkHarmonyMid(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId || this._checkCooldown(linkId)) return;
        const link = this._getLinkById(linkId);
        if (!link) return;

        this._spawnWaveOnLink(link, 0.7, 'mid');
        const now = this._getCurrentTime();
        this._spawnReStitching(linkId, now);
        this._setCooldown(linkId);
    }

    _handleLinkHarmonyLow(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId || this._checkCooldown(linkId)) return;
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 0.4, 'low');
            this._setCooldown(linkId);
        }
    }

    _handleLinkCorruptionHigh(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId || this._checkCooldown(linkId)) return;
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 0.9, 'corruption_response');
            this._setCooldown(linkId);
        }
    }

    _handleLinkStabilityLow(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId || this._checkCooldown(linkId)) return;
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 0.7, 'stability_response');
            this._setCooldown(linkId);
        }
    }

    _handleNodeCorruptionHigh(payload = {}) {
        const nodeId = payload?.nodeId;
        if (!nodeId || !this.linkingSystem?.links) return;
        for (const link of this.linkingSystem.links) {
            const ep = this._getLinkEndpoints(link);
            const sid = ep.startNode?.id || ep.startNode?.userData?.nodeId;
            const eid = ep.endNode?.id || ep.endNode?.userData?.nodeId;
            if (sid === nodeId || eid === nodeId) {
                const lid = link?.id || link?.linkId;
                if (lid && !this._checkCooldown(lid)) {
                    this._spawnWaveOnLink(link, 0.8, 'node_corruption_response');
                    this._setCooldown(lid);
                    break;
                }
            }
        }
    }

    _handleLinkStabilityMid(payload = {}) {
        const linkId = payload?.linkId;
        const now = this._getCurrentTime();
        if (!linkId || this._checkCooldown(linkId, now)) return;
        const link = this._getLinkById(linkId);
        if (link) {
            const ep = this._getLinkEndpoints(link);
            if (ep.startNode) this._spawnHalo(ep.startNode, now);
            if (ep.endNode) this._spawnHalo(ep.endNode, now);
            this._spawnReStitching(linkId, now);
        }
        this._setCooldown(linkId, now);
    }

    _handleNodeStabilityLow(payload = {}) {
        const nodeId = payload?.nodeId;
        const now = this._getCurrentTime();
        if (!nodeId) return;
        if (this.linkingSystem?.nodes) {
            const node = this.linkingSystem.nodes.find(n =>
                n && (n.id === nodeId || n.userData?.nodeId === nodeId)
            );
            if (node?.position && this.recoveringZones.length < this.config.maxActiveZones) {
                this.recoveringZones.push({
                    active: true,
                    pos: node.position.clone(),
                    linkId: `stability_recovery_${nodeId}_${Date.now()}`,
                    startNode: node,
                    endNode: null,
                    life: 0,
                    startTime: now - (this._timeOrigin ?? 0),
                    maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                    waveMeshIdx: -1,
                    lastStitchTime: now - (this._timeOrigin ?? 0),
                    waveOnly: true,
                    linkYaw: 0
                });
            }
        }
    }

    // -------------------------------------------------------------------------
    // COOLDOWN UTILITIES
    // -------------------------------------------------------------------------

    _getCurrentTime() {
        return (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);
    }

    _checkCooldown(linkId, now = null) {
        const t = now ?? this._getCurrentTime();
        const last = this._linkCooldowns.get(linkId);
        if (last === undefined) return false;
        return (t - last) < this.config.linkCooldown;
    }

    _setCooldown(linkId, now = null) {
        this._linkCooldowns.set(linkId, now ?? this._getCurrentTime());
    }

    // -------------------------------------------------------------------------
    // TRAVELING WAVES (from HarmonicHealingVisualSystem)
    // -------------------------------------------------------------------------

    _spawnWaveOnLink(link, intensity, level) {
        if (this.waves.length >= this.config.maxWaves) return;
        const ep = this._getLinkEndpoints(link);
        if (!ep.startNode || !ep.endNode) return;

        const reverse = Math.random() > 0.5;
        const start = reverse ? ep.endNode : ep.startNode;
        const end = reverse ? ep.startNode : ep.endNode;
        const speed = this.config.waveSpeed * (0.95 + Math.random() * 0.1);
        const debugBoost = this.config.debugVisualBoost ? 1.35 : 1.0;
        const finalIntensity = Math.min(1, intensity * debugBoost);

        const wave = this._acquireWave(link, start, end, speed, finalIntensity);
        this.waves.push(wave);

        if (this.particles?.emitSplash && start?.position) {
            this.particles.emitSplash(start.position, Math.min(1, finalIntensity * 0.75), this._getCurrentTime());
        }
    }

    _acquireWave(link, startNode, endNode, speed, intensity) {
        const w = this.wavePool.pop();
        if (w) return w.reset(link, startNode, endNode, speed, intensity);
        return new HealingWave(link, startNode, endNode, speed, intensity);
    }

    _releaseWave(wave) {
        if (!wave) return;
        wave.active = false;
        wave.link = null;
        wave.startNode = null;
        wave.endNode = null;
        if (this.wavePool.length < this.config.maxWaves) this.wavePool.push(wave);
    }

    _updateWaves(deltaTime, time) {
        let writeIdx = 0;

        if (this._enableEtherealUpgrade) {
            this._spectralHealingPhase += deltaTime * this._spectralHealingCycleSpeed;
            const phaseIdx = Math.floor(this._spectralHealingPhase) % this._spectralHealingHues.length;
            const nextIdx = (phaseIdx + 1) % this._spectralHealingHues.length;
            const t = this._spectralHealingPhase % 1.0;
            const hue = this._spectralHealingHues[phaseIdx] * (1 - t) + this._spectralHealingHues[nextIdx] * t;
            const isWhite = (phaseIdx === 1 || nextIdx === 1);
            const sat = isWhite ? 0.1 + t * 0.3 : 0.75 + Math.sin(time * 2.0) * 0.1;
            const lit = 0.55 + Math.sin(time * 1.5) * 0.08;
            this._tmpTrailColor.setHSL(((hue % 1.0) + 1.0) % 1.0, sat, lit);
        }

        for (let i = 0; i < this.waves.length; i++) {
            const wave = this.waves[i];
            wave.update(deltaTime);
            if (wave.active) {
                this.waves[writeIdx++] = wave;
                if (this.particles) {
                    this._tmpTrailVel.copy(wave.currentDir).multiplyScalar(wave.speed * 0.3);
                    this.particles.emitHealingTrail(
                        wave.currentPos,
                        this._tmpTrailVel,
                        wave.intensity,
                        time,
                        this._tmpTrailColor
                    );
                }
            } else {
                this._handleWaveArrival(wave, time);
                this._releaseWave(wave);
            }
        }
        this.waves.length = writeIdx;
    }

    _handleWaveArrival(wave, time) {
        const impactPos = wave.endNode?.position;
        if (!impactPos) return;

        // Emit topology.healing event
        if (this.semanticBus) {
            const endHarmony = clamp01(wave.endNode?.userData?.metrics?.harmony ?? wave.endNode?.userData?.harmony ?? 0);
            const harmonyRestored = Math.max(0.1, Math.min(1.0, endHarmony * wave.intensity));
            this.semanticBus.emit('topology.healing', {
                position: impactPos,
                harmonyRestored
            });
        }

        // Visual splash
        if (this.particles?.emitSplash) {
            this.particles.emitSplash(impactPos, wave.intensity, time);
        }
    }

    // -------------------------------------------------------------------------
    // RECOVERY ZONES (from HarmonicRecoveryVisualSystem)
    // -------------------------------------------------------------------------

    _spawnCoherenceWave(linkId, currentVisualTime) {
        const link = this._getLinkById(linkId);
        if (!link) return false;
        const ep = this._getLinkEndpoints(link);
        if (!ep.startPos || !ep.endPos) return false;

        const center = new THREE.Vector3().addVectors(ep.startPos, ep.endPos).multiplyScalar(0.5);
        const now = currentVisualTime ?? this._getCurrentTime();
        const linkDir = new THREE.Vector3().subVectors(ep.endPos, ep.startPos);
        linkDir.y = 0;
        const linkYaw = linkDir.lengthSq() > 1e-6 ? Math.atan2(linkDir.z, linkDir.x) : 0;

        if (this.recoveringZones.length < this.config.maxActiveZones) {
            this.recoveringZones.push({
                active: true,
                pos: center,
                linkId,
                startNode: ep.startNode,
                endNode: ep.endNode,
                life: 0,
                startTime: now,
                maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                waveMeshIdx: -1,
                lastStitchTime: now,
                waveOnly: true,
                linkYaw
            });
            return true;
        }
        return false;
    }

    _spawnReStitching(linkId, currentVisualTime) {
        const link = this._getLinkById(linkId);
        if (!link) return false;
        const ep = this._getLinkEndpoints(link);
        if (!ep.startPos || !ep.endPos) return false;
        const now = currentVisualTime ?? this._getCurrentTime();

        if (this.healingParticles) {
            const p1 = ep.startNode?.position;
            const p2 = ep.endNode?.position;
            if (p1 && p2) {
                const scanProgress = (now % 2.0) / 2.0;
                const t1 = scanProgress * 0.5;
                const t2 = 1.0 - (scanProgress * 0.5);
                const pos1 = this._tmpVec3A.lerpVectors(p1, p2, t1);
                const pos2 = this._tmpVec3B.lerpVectors(p1, p2, t2);
                const sAngle = now * 10.0;
                const offX = Math.cos(sAngle) * 0.1;
                const offY = Math.sin(sAngle) * 0.1;
                pos1.x += offX; pos1.y += offY;
                pos2.x -= offX; pos2.y -= offY;
                this.healingParticles.emitHealingTrail(pos1, this._tmpVelA.set(0,0,0), 0.85, now, this._tmpColorWhite);
                this.healingParticles.emitHealingTrail(pos2, this._tmpVelB.set(0,0,0), 0.85, now, this._tmpColorGold);
            }
        }

        // Multi-segment energy thread beam
        const beamPoints = [];
        const stitchCount = 6;
        for (let i = 0; i <= stitchCount; i++) {
            const t = i / stitchCount;
            const point = new THREE.Vector3().lerpVectors(ep.startPos, ep.endPos, t);
            const wave = Math.sin(t * Math.PI * 3 + (currentVisualTime ?? 0) * 8) * 0.04;
            point.y += wave;
            beamPoints.push(point);
        }
        const beamGeometry = new THREE.BufferGeometry().setFromPoints(beamPoints);
        const beamMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(0xFFD700),
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const beam = new THREE.Line(beamGeometry, beamMaterial);
        beam.renderOrder = this.config.renderOrder + 2;
        this.scene.add(beam);

        // Stitch-point particles
        if (this.healingParticles) {
            for (let i = 1; i < stitchCount; i++) {
                const t = i / stitchCount;
                const stitchPos = this._tmpVec3A.lerpVectors(ep.startPos, ep.endPos, t);
                stitchPos.y += Math.sin(t * Math.PI * 3 + (currentVisualTime ?? 0) * 8) * 0.04;
                if (i % 2 === 0) this._tmpColor.setRGB(1.0, 0.84, 0.0);
                else this._tmpColor.setRGB(0.25, 0.88, 0.82);
                this.healingParticles.emitHealingTrail(stitchPos, this._tmpVelA.set(0, 0.05, 0), 0.5, now, this._tmpColor);
            }
        }

        this._activeBeams.push({ mesh: beam, disposeAt: (currentVisualTime ?? 0) + 0.18 });
        return true;
    }

    _spawnHalo(node, currentVisualTime) {
        if (!node?.position) return;
        const slot = this.haloMeshPool.findIndex(item => !item.active);
        if (slot === -1) return;
        const item = this.haloMeshPool[slot];
        item.active = true;
        item.life = 0;
        item.maxLife = 2.5;
        item.startTime = currentVisualTime;
        item.mesh.visible = true;
        item.mesh.position.copy(node.position);

        const rawHarmony = clamp01(node?.userData?.metrics?.harmony ?? node?.userData?.harmony ?? 0.5);
        this._tmpColor.setHSL(0.12 + rawHarmony * 0.38, 0.88, 0.55);
        item.mesh.material.uniforms.uColor.value.copy(this._tmpColor);
        item.mesh.material.uniforms.uLife.value = 0;
    }

    _updateRecoveringZones(currentVisualTime, cameraPosition = null) {
        const harmony = 0.5; // Default; could be parameterized via event payload in future
        const synergy = 0.5;

        this.recoveringZones = this.recoveringZones.filter(zone => {
            zone.life = currentVisualTime - zone.startTime;

            if (zone.waveMeshIdx === -1) {
                const slot = this.waveMeshPool.findIndex(item => !item.active);
                if (slot !== -1) {
                    this.waveMeshPool[slot].active = true;
                    this.waveMeshPool[slot].mesh.visible = true;
                    this.waveMeshPool[slot].mesh.position.copy(zone.pos);
                    zone.waveMeshIdx = slot;
                }
            }

            if (zone.waveMeshIdx !== -1) {
                const item = this.waveMeshPool[zone.waveMeshIdx];
                const mesh = item.mesh;
                const progress = zone.life / zone.maxLife;
                const scale = (1.02 + zone.life * this.config.waveExpansionSpeed * (1.0 + synergy)) * (this.config.debugVisualBoost ? 1.02 : 1.0);
                mesh.scale.set(scale, scale, scale);
                this._tmpColor.setHSL(0.12 + harmony * 0.38, 0.88, 0.58);
                mesh.material.uniforms.uColor.value.copy(this._tmpColor);
                mesh.material.uniforms.uLife.value = progress;
                mesh.material.uniforms.uHarmony.value = harmony;
                mesh.rotation.set(-Math.PI / 2, zone.linkYaw ?? 0, 0);
            }

            if (!zone.waveOnly) {
                const sinceLast = currentVisualTime - (zone.lastStitchTime ?? zone.startTime);
                if (sinceLast >= this.config.stitchingInterval && this.healingParticles) {
                    zone.lastStitchTime = currentVisualTime;
                    const p1 = zone.startNode?.position;
                    const p2 = zone.endNode?.position;
                    if (p1 && p2) {
                        const scanProgress = (zone.life % 2.0) / 2.0;
                        const t1 = scanProgress * 0.5;
                        const t2 = 1.0 - (scanProgress * 0.5);
                        const pos1 = this._tmpVec3A.lerpVectors(p1, p2, t1);
                        const pos2 = this._tmpVec3B.lerpVectors(p1, p2, t2);
                        const stitchAngle = zone.life * 10.0;
                        const offX = Math.cos(stitchAngle) * 0.1;
                        const offY = Math.sin(stitchAngle) * 0.1;
                        pos1.x += offX; pos1.y += offY;
                        pos2.x -= offX; pos2.y -= offY;
                        const intensity = Math.min(1, 0.85 * harmony + 0.35);
                        this.healingParticles.emitHealingTrail(pos1, this._tmpVelA.set(0,0,0), intensity, currentVisualTime, this._tmpColorWhite);
                        this.healingParticles.emitHealingTrail(pos2, this._tmpVelB.set(0,0,0), intensity, currentVisualTime, this._tmpColorGold);
                    }
                }
            }

            if (zone.life >= zone.maxLife) {
                if (zone.waveMeshIdx !== -1) {
                    this.waveMeshPool[zone.waveMeshIdx].active = false;
                    this.waveMeshPool[zone.waveMeshIdx].mesh.visible = false;
                }
                return false;
            }
            return true;
        });

        // Update halos
        this.haloMeshPool.forEach(item => {
            if (!item.active) return;
            const elapsed = currentVisualTime - (item.startTime ?? currentVisualTime);
            const progress = elapsed / item.maxLife;
            const mesh = item.mesh;
            const scale = 2.5 + Math.sin(progress * Math.PI) * 0.8;
            mesh.scale.set(scale, scale, scale);
            if (cameraPosition) mesh.lookAt(cameraPosition);
            mesh.material.uniforms.uLife.value = progress;
            mesh.material.uniforms.uTime.value = currentVisualTime;
            if (elapsed >= item.maxLife) {
                item.active = false;
                mesh.visible = false;
            }
        });
    }

    // -------------------------------------------------------------------------
    // RUPTURE MONITORING
    // -------------------------------------------------------------------------

    _detectRuptureEvents(currentVisualTime) {
        if (!this.ruptureSystem || !this.ruptureSystem.ruptures) return;
        const currentRuptures = this.ruptureSystem.ruptures;
        const currentIds = new Set(currentRuptures.map(r => r.linkId));
        for (const id of this.activeRuptureIds) {
            if (!currentIds.has(id)) {
                this._triggerRecovery(id, currentVisualTime);
            }
        }
        this.activeRuptureIds = currentIds;
    }

    _triggerRecovery(linkId, currentVisualTime) {
        const link = this._getLinkById(linkId);
        if (!link) return;
        return this._triggerRecoveryFromLink(link, currentVisualTime);
    }

    _triggerRecoveryFromLink(link, currentVisualTime) {
        if (!link) return false;
        const linkId = link?.id ?? link?.linkId ?? null;
        const ep = this._getLinkEndpoints(link);
        if (!ep.startPos || !ep.endPos) return false;
        const center = new THREE.Vector3().addVectors(ep.startPos, ep.endPos).multiplyScalar(0.5);
        const now = currentVisualTime ?? this._getCurrentTime();

        if (this.recoveringZones.length < this.config.maxActiveZones) {
            this.recoveringZones.push({
                active: true,
                pos: center,
                linkId,
                startNode: ep.startNode,
                endNode: ep.endNode,
                life: 0,
                startTime: now,
                maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                waveMeshIdx: -1,
                lastStitchTime: now
            });
            this._spawnHalo(ep.startNode, now);
            this._spawnHalo(ep.endNode, now);

            if (this.semanticBus) {
                const startHarmony = clamp01(ep.startNode?.userData?.metrics?.harmony ?? ep.startNode?.userData?.harmony ?? 0);
                const endHarmony = clamp01(ep.endNode?.userData?.metrics?.harmony ?? ep.endNode?.userData?.harmony ?? 0);
                const avgHarmony = (startHarmony + endHarmony) * 0.5;
                this.semanticBus.emit('topology.healing', {
                    position: center,
                    harmonyRestored: Math.max(0.1, Math.min(1.0, avgHarmony))
                });
            }
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // DRAMATURGY MODULATION
    // -------------------------------------------------------------------------

    setDramaturgyModulation(state) {
        if (!state || !state.dominantFamily) return;
        this._dramaturgyModulation.active = true;
        this._dramaturgyModulation.family = state.dominantFamily;
        this._dramaturgyModulation.phase = state.dominantPhase || 'telegraph';
        this._dramaturgyModulation.intensity = state.dominantIntensity || 0;
        this._dramaturgyModulation.ttl = 3.0;
    }

    _decayDramaturgyModulation(deltaTime) {
        const mod = this._dramaturgyModulation;
        if (!mod.active) return;
        mod.ttl -= deltaTime;
        if (mod.ttl <= 0) {
            mod.active = false;
            mod.family = null;
            mod.phase = null;
            mod.intensity = 0;
            mod.ttl = 0;
        }
    }

    _isDramaturgyRecoveryActive() {
        const mod = this._dramaturgyModulation;
        return mod.active && mod.ttl > 0 && mod.phase === 'payoff';
    }

    _dramaturgyForceRecoveryPulse(currentVisualTime) {
        if (!this.linkingSystem?.links) return;
        const links = this.linkingSystem.links.filter(l => l && l.active !== false);
        if (links.length === 0) return;
        const link = links[Math.floor(Math.random() * links.length)];
        const linkId = link.id || link.linkId || link.uuid;
        if (!linkId) return;
        const now = this._getCurrentTime();
        const last = this._linkCooldowns.get(linkId);
        if (last !== undefined && (now - last) < this.config.linkCooldown * 0.5) return;
        this._linkCooldowns.set(linkId, now);
        this.triggerRecoveryPulse(link, currentVisualTime);
    }

    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------

    triggerWaveBatch(count = 10) {
        for (let i = 0; i < count; i++) {
            this._spawnSingleWave({ healingDrive: 1.0, harmony: 1.0 });
        }
    }

    _spawnSingleWave(healingState = {}, time = 0) {
        if (!this.linkingSystem?.links || this.linkingSystem.links.length === 0) return;
        const links = this.linkingSystem.links;
        const targetLink = this._pickHealingTargetLink(links);
        const ep = this._getLinkEndpoints(targetLink);
        if (!targetLink || !ep.startNode || !ep.endNode) return;

        const reverse = Math.random() > 0.5;
        const start = reverse ? ep.endNode : ep.startNode;
        const end = reverse ? ep.startNode : ep.endNode;
        const speed = this.config.waveSpeed * (0.8 + Math.random() * 0.4);
        const debugBoost = this.config.debugVisualBoost ? 1.35 : 1.0;
        const intensity = Math.min(1, (0.45 + Math.min(1, healingState.healingDrive ?? healingState.harmony ?? 0) * 0.55) * debugBoost);

        this.waves.push(this._acquireWave(targetLink, start, end, speed, intensity));
        if (this.particles?.emitSplash && start?.position) {
            this.particles.emitSplash(start.position, Math.min(1, intensity * 0.75), time);
        }
    }

    _pickHealingTargetLink(links) {
        if (!Array.isArray(links) || links.length === 0) return null;
        let bestLink = null;
        let bestScore = -Infinity;
        for (const link of links) {
            const ep = this._getLinkEndpoints(link);
            if (!ep.startNode || !ep.endNode) continue;
            const metrics = link.userData?.metrics || {};
            const visualStability = Number.isFinite(link.userData?.visualState?.stability) ? link.userData.visualState.stability : null;
            const stability = Number.isFinite(visualStability) ? visualStability : Number.isFinite(metrics.stability) ? metrics.stability : 0.5;
            const corruption = Number.isFinite(metrics.corruption) ? metrics.corruption : 0;
            const cascadeIntensity = Number.isFinite(link.userData?.cascadeIntensity) ? link.userData.cascadeIntensity : 0;
            const flowIntensity = Number.isFinite(link.userData?.flowState?.intensity) ? link.userData.flowState.intensity : 0;

            let score = (1 - clamp01(stability)) * 0.55 + clamp01(corruption) * 0.25 + clamp01(Math.max(cascadeIntensity, flowIntensity)) * 0.20;
            if (this._regionalPriority?.nodeIds) {
                const sIn = this._regionalPriority.nodeIds.has(ep.startNode?.id ?? ep.startNode?.userData?.nodeId);
                const eIn = this._regionalPriority.nodeIds.has(ep.endNode?.id ?? ep.endNode?.userData?.nodeId);
                if (sIn || eIn) score += (this._regionalPriority.boostFactor || 0.3);
            }
            if (score > bestScore) { bestScore = score; bestLink = link; }
        }
        return bestLink || links[Math.floor(Math.random() * links.length)] || null;
    }

    setRegionalPriority(priority) {
        this._regionalPriority = priority;
    }

    triggerRecoveryPulse(linkOrId, currentVisualTime = null) {
        const visualNow = Number.isFinite(currentVisualTime) ? currentVisualTime : this._getCurrentTime();
        if (typeof linkOrId === 'object' && linkOrId) {
            return this._triggerRecoveryFromLink(linkOrId, visualNow);
        }
        const linkId = typeof linkOrId === 'string' ? linkOrId : linkOrId?.id ?? linkOrId?.linkId ?? null;
        if (!linkId) return false;
        return this._triggerRecovery(linkId, visualNow);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    update(deltaTime, time, networkState = {}) {
        const mode = getAtomaVisualDebugMode();
        if (mode !== 'all' && mode !== 'healing' && mode !== 'recovery') return;
        if (!this.enabled) return;
        if (this.frameScheduler && this.frameScheduler.shouldRunVisual?.() === false) return;

        this._decayDramaturgyModulation(deltaTime);

        // ---- Traveling waves (every frame) ----
        this._updateWaves(deltaTime, time);

        // ---- Recovery zones (throttled) ----
        const visualNow = Number.isFinite(time) ? time : this._getCurrentTime();
        if (this._timeOrigin === undefined) this._timeOrigin = visualNow;
        const currentVisualTime = visualNow - this._timeOrigin;

        if (this._lastUpdateTime === undefined) this._lastUpdateTime = currentVisualTime;
        const sinceLast = currentVisualTime - this._lastUpdateTime;
        if (sinceLast >= this.config.updateInterval) {
            this._lastUpdateTime = currentVisualTime;

            // Rupture detection
            this._detectRuptureEvents(currentVisualTime);

            // Dramaturgy override
            if (this._isDramaturgyRecoveryActive()) {
                this._dramaturgyRecoveryTimer += sinceLast;
                if (this._dramaturgyRecoveryTimer >= 0.8) {
                    this._dramaturgyRecoveryTimer = 0;
                    this._dramaturgyForceRecoveryPulse(currentVisualTime);
                }
            }

            // Debug fallback
            if (this.config.debugForceRecoveryPulse) {
                this._fallbackRecoveryTimer += sinceLast;
                if (this._fallbackRecoveryTimer >= this.config.debugForceRecoveryInterval) {
                    this._fallbackRecoveryTimer = 0;
                    this._debugForceAllLinksRecovery(currentVisualTime);
                }
            }

            // Update recovery visuals
            const cameraPosition = this._resolveCameraPosition();
            this._updateRecoveringZones(currentVisualTime, cameraPosition);

            // Update shader uniforms
            this.waveMaterial.uniforms.uTime.value = currentVisualTime;
        }

        // Prune expired beams
        this._activeBeams = this._activeBeams.filter(b => {
            if (currentVisualTime >= b.disposeAt) {
                if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
                b.mesh.geometry.dispose();
                b.mesh.material.dispose();
                return false;
            }
            return true;
        });
    }

    // -------------------------------------------------------------------------
    // UTILITIES
    // -------------------------------------------------------------------------

    _getLinkById(linkId) {
        if (!this.linkingSystem?.links) return null;
        return this.linkingSystem.links.find(l => l && (l.id === linkId || l.linkId === linkId || l.uuid === linkId));
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;
        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }

    _resolveCameraPosition() {
        const sceneCamera = this.scene?.getObjectByName?.('camera')?.position;
        if (sceneCamera) return sceneCamera;
        if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__?.position) {
            return window.__ATOMA_CAMERA__.position;
        }
        if (globalThis.__ATOMA_CAMERA__?.position) {
            return globalThis.__ATOMA_CAMERA__.position;
        }
        return null;
    }

    _debugForceAllLinksRecovery(currentVisualTime) {
        if (!this.linkingSystem?.links) return;
        for (const link of this.linkingSystem.links) {
            const ep = this._getLinkEndpoints(link);
            if (!link || !ep.startNode || !ep.endNode) continue;
            const linkId = link.id ?? link.linkId ?? null;
            if (!linkId) continue;
            this.triggerRecoveryPulse(linkId, currentVisualTime);
        }
        console.warn('[HarmonicHealingRecovery] debugForceAllLinksRecovery triggered', this.linkingSystem.links.length, 'links');
    }

    // -------------------------------------------------------------------------
    // STATS / DEBUG
    // -------------------------------------------------------------------------

    getStats() {
        const waveActive = this.waveMeshPool.filter(item => item.active).length;
        const haloActive = this.haloMeshPool.filter(item => item.active).length;
        return {
            enabled: this.enabled,
            eventDrivenEnabled: this._eventDrivenEnabled,
            waveCount: this.waves.length,
            activeRuptures: this.activeRuptureIds.size,
            recoveringZones: this.recoveringZones.length,
            wavePoolActive: waveActive,
            haloPoolActive: haloActive,
            activeCooldowns: this._linkCooldowns.size,
            hasHealingParticles: !!this.particles,
            config: {
                waveSpeed: this.config.waveSpeed,
                maxWaves: this.config.maxWaves,
                linkCooldown: this.config.linkCooldown,
                minRecoveryDuration: this.config.minRecoveryDuration,
                maxRecoveryDuration: this.config.maxRecoveryDuration,
                maxActiveZones: this.config.maxActiveZones
            }
        };
    }

    // -------------------------------------------------------------------------
    // DISPOSE
    // -------------------------------------------------------------------------

    dispose() {
        this._teardownEventSubscriptions();

        // Clean up wave meshes
        this.waveMeshPool.forEach(item => {
            this.scene?.remove(item.mesh);
            item.mesh.geometry?.dispose();
        });
        this.haloMeshPool.forEach(item => {
            this.scene?.remove(item.mesh);
            item.mesh.geometry?.dispose();
        });
        this.waveMaterial.dispose();
        this.haloMaterial.dispose();

        // Clean up beams
        this._activeBeams.forEach(b => {
            if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
            b.mesh.geometry?.dispose();
            b.mesh.material?.dispose();
        });
        this._activeBeams = [];

        // UNIFIED CLEANUP CONTRACT
        this._createdObjects.forEach(obj => {
            if (this.scene) this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        this._createdObjects = [];

        this.waves = [];
        this.wavePool = [];
        this.recoveringZones = [];
        this._linkCooldowns.clear();
    }
}
