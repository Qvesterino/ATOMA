/**
 * SEMANTIC GLYPH AI 5.0 - INTELLIGENT VISUAL NODE COMMUNICATION (SAFE EDITION)
 * 
 * Makes glyphs visually express what each node is 'doing' or 'thinking' by reacting to:
 * - Node metrics (synergy, harmony, stability, corruption, clarity, load)
 * - Node roles/tags in userData
 * - Recent events (links created, rituals, world events, cluster membership)
 * 
 * STRICT SAFE RULES:
 * - NO modifications to gameplay, physics, collisions, or createNode()
 * - Only read data; never write node behavior changes
 * - All changes purely visual: glyph animation, shape, opacity, color
 * - No new post-processing, no volumetrics, no camera changes
 * - Performance budget: < 1ms/frame for semantic updates
 * 
 * SEMANTIC STATES (maps to visual patterns):
 * 1. FOCUSED/ANALYZING - High clarity, low corruption, analytics role
 * 2. OVERLOADED/STRESSED - High load, stability, many recent links
 * 3. CALM/IDLE - Low load, stable, no recent events
 * 4. EXPLORING/CONNECTING - Recently created new links
 * 5. LEADER/HUB - High link degree vs average
 * 6. CONFLICT/DUALITY - Harmony and corruption both high
 * 7. SYNCHRONIZED CLUSTER - Shared clusterMembershipID + high synergy
 * 
 * IMPLEMENTATION:
 * - Reads existing metrics/userData (zero new gameplay logic)
 * - Non-destructive glyph adjustments via transforms/materials
 * - Reuses pooled meshes for tiny helper geometries
 * - Updates glyphs after Layer 4.0 in render loop
 */

import * as THREE from 'three';
import { VisualLayerEnforcementIntegrationHelpers as IntegrationHelpers } from './VisualLayerEnforcementIntegrationHelpers.js';

export class SemanticGlyphAI {
  constructor(scene, worldRoot, glyphLayer4System, enforcementGate = null) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.glyphLayer4 = glyphLayer4System;
    this.enforcementGate = enforcementGate;  // Optional enforcement gate
    const attachRoot = worldRoot || scene;
    
    // Semantic state tracking per node
    this.semanticState = new Map();  // nodeId → { state, parameters, timers }
    
    // Event history (temporal, fades over time)
    this.eventHistory = new Map();   // nodeId → { justLinked, justRitual, justAscended, clusterSync }
    
    // Visual effect helper meshes (pooled)
    this.helperMeshes = {
      crownRings: [],        // Thin rings for leader/hub effect
      scanLines: [],         // Vertical sweep lines for focused effect
      flickerDots: [],       // Tiny orbiting dots for exploring effect
      linkLines: [],         // Thin connectors for exploring effect
      splitDividers: []      // Center lines for duality effect
    };
    
    // Helper container (keeps scene clean)
    this.helperContainer = new THREE.Group();
    this.helperContainer.userData.isSemanticHelper = true;
    this.helperContainer.name = 'SemanticGlyphAI_Helpers';
    attachRoot.add(this.helperContainer);
    this.root = this.helperContainer;
    
    // Configuration
    this.config = {
      focusedAnimSpeedMultiplier: 1.8,
      overloadedWobbleAmplitude: 0.015,
      overloadedPulseSpeed: 2.0,
      idleRotationReduction: 0.2,
      exploringOrbSpeed: 1.5,
      exploringFadeTime: 3000,  // ms
      leaderHaloCount: 8,        // Radial pulses
      crownThickness: 0.02,
      dualitySplitSpeed: 0.5,
      clusterSyncDuration: 2000, // ms
      eventFadeDuration: 2000    // ms
    };
    
    // Metrics state for caching
    this.lastMetricsRead = new Map();  // nodeId → metrics cache
    
    // Performance tracking
    this.stats = {
      nodesProcessed: 0,
      statesApplied: 0,
      helperMeshesActive: 0,
      frameTime: 0
    };
    
    // Enable/disable flag
    this.enabled = true;
    
    // Phase B pilot: low-frequency semantic interpretation gating (visual interpolation remains per-frame)
    this.interpretationInterval = 0.25; // ~4 Hz for semantic decisions
    this.interpretationAccumulator = 0;

    // Reusable color objects (avoid per-frame allocations)
    this._colorCache = {
      stressedStart: new THREE.Color(0xFF8800),
      stressedEnd: new THREE.Color(0xFF3333),
      clusterSync: new THREE.Color(0x84FFE6),
      temp: new THREE.Color() // Temp lerp target
    };

    this.initializeHelperMeshPools();

    // Runtime integrity check: single-fire mismatch log
    this._integrityLogged = false;
  }
  
  /**
   * Safe helper mesh attachment with enforcement
   */
  _safeAttachHelperMesh(helperMesh, node, layerType) {
    if (!helperMesh) return false;
    
    // Create enforcement request
    const request = IntegrationHelpers.createVisualAttachmentRequest({
      nodeId: node.userData?.id || node.uuid,
      nodeCategory: node.userData?.category || 'unknown',
      layerType: layerType,
      geometryType: 'Lines',  // Most helper meshes are lines or particles
      opacity: helperMesh.material?.opacity || 0.5,
      sourceSystem: 'SemanticGlyphAI',
      description: `Semantic helper: ${layerType}`
    });
    
    // Check approval before attaching
    if (this.enforcementGate && !this.enforcementGate.canAttach(request)) {
      return false;
    }
    
    // Make visible (was pooled and hidden)
    helperMesh.visible = true;
    return true;
  }
  
  /**
   * Initialize pooled helper meshes for reuse
   */
  initializeHelperMeshPools() {
    // Crown rings (thin toroid circles for leader effect)
    for (let i = 0; i < 12; i++) {
      const ringGeom = new THREE.TorusGeometry(0.08, 0.005, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.userData.isSemanticHelper = true;
      ring.visible = false;
      this.helperMeshes.crownRings.push(ring);
      this.helperContainer.add(ring); // CRITICAL: Attach to scene graph
    }

    // Scan lines (vertical swooping lines for focused effect)
    for (let i = 0; i < 6; i++) {
      const lineGeom = new THREE.PlaneGeometry(0.02, 0.3);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x00F2FF,
        transparent: true,
        opacity: 0.4,
        fog: false
      });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.visible = false;
      this.helperMeshes.scanLines.push(line);
      this.helperContainer.add(line); // CRITICAL: Attach to scene graph
    }

    // Flicker dots (tiny orbiting particles for exploring effect)
    for (let i = 0; i < 16; i++) {
      const dotGeom = new THREE.SphereGeometry(0.01, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x00FFAA,
        transparent: true,
        opacity: 0.8,
        fog: false
      });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.userData.isSemanticHelper = true;
      dot.visible = false;
      this.helperMeshes.flickerDots.push(dot);
      this.helperContainer.add(dot); // CRITICAL: Attach to scene graph
    }

    // Link lines (thin connectors to link directions)
    for (let i = 0; i < 8; i++) {
      const lineGeom = new THREE.BufferGeometry();
      const positions = new Float32Array([
        0, 0, 0,
        0.15, 0, 0
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00FFAA,
        transparent: true,
        opacity: 0.6,
        fog: false,
        linewidth: 1
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.visible = false;
      this.helperMeshes.linkLines.push(line);
      this.helperContainer.add(line); // CRITICAL: Attach to scene graph
    }

    // Split dividers (center line for duality effect)
    for (let i = 0; i < 4; i++) {
      const lineGeom = new THREE.BufferGeometry();
      const positions = new Float32Array([
        0, -0.3, 0,
        0, 0.3, 0
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xFF00FF,
        transparent: true,
        opacity: 0.7,
        fog: false,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.userData.isSemanticHelper = true;
      line.visible = false;
      this.helperMeshes.splitDividers.push(line);
      this.helperContainer.add(line); // CRITICAL: Attach to scene graph
    }
  }
  
  /**
   * Main update loop - call after Glyph Layer 4.0
   * dt: delta time in seconds
   * nodes: array of all AI nodes
   */
  update(dt, nodes) {
    if (!this.enabled) return;
    const targetNodes = this.hoverTarget ? [this.hoverTarget] : nodes;
    if (!targetNodes || targetNodes.length === 0) return;

    const startTime = performance.now();

    // Phase B pilot: accumulate time for semantic interpretation (visual interpolation remains per-frame)
    this.interpretationAccumulator += dt;
    const shouldInterpret = this.interpretationAccumulator >= this.interpretationInterval;

    // Decay event history
    this.decayEventHistory(dt);

    // Process each node
    this.stats.nodesProcessed = targetNodes.length;
    let statesApplied = 0;

    for (const node of targetNodes) {
      if (!node || !node.userData) continue;
      if (!node.userData.nodeId) {
        continue; // Skip nodes without canonical nodeId (silent)
      }
      
      const nodeId = node.userData.nodeId;
      
      // Read semantic context from node
      const context = this.readSemanticContext(node);
      
      // Phase B pilot: semantic computation gated; visuals always applied
      let state = this.semanticState.get(nodeId);
      if (shouldInterpret || !state) {
        state = this.computeSemanticState(context, nodeId);
        if (state) {
          this.semanticState.set(nodeId, state);
          statesApplied++;
        }
      }
      
      if (state) {
        // Visual interpolation remains per-frame
        this.applySemanticVisualsToNode(node, nodeId, state, dt);
      }
    }
    
    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
    }

    this.stats.statesApplied = statesApplied;
    this.stats.frameTime = performance.now() - startTime;

    // Lightweight runtime integrity check (single-fire log on mismatch)
    if (!this._integrityLogged && this.glyphLayer4?.fusionRegistry) {
      const fusionCount = this.glyphLayer4.fusionRegistry.size;
      const nodeCount = window.game?.aiNodes?.nodes?.length || 0;
      if (fusionCount !== nodeCount) {
        this._integrityLogged = true;
        console.error('[SemanticGlyphAI] Integrity mismatch: fusionRegistry.size !== aiNodes.nodes.length', {
          fusionCount,
          nodeCount,
          missing: nodeCount - fusionCount
        });
      }
    }
  }
  
  /**
   * Decay event history timers
   */
  decayEventHistory(dt) {
    const dtMs = dt * 1000;
    
    for (const [nodeId, events] of this.eventHistory) {
      if (events.justLinked) {
        events.justLinked -= dtMs;
        if (events.justLinked <= 0) events.justLinked = null;
      }
      if (events.justRitual) {
        events.justRitual -= dtMs;
        if (events.justRitual <= 0) events.justRitual = null;
      }
      if (events.justAscended) {
        events.justAscended -= dtMs;
        if (events.justAscended <= 0) events.justAscended = null;
      }
      if (events.clusterSync) {
        events.clusterSync -= dtMs;
        if (events.clusterSync <= 0) events.clusterSync = null;
      }
      
      // Remove entry if all expired
      if (!events.justLinked && !events.justRitual && !events.justAscended && !events.clusterSync) {
        this.eventHistory.delete(nodeId);
      }
    }
  }
  
  /**
   * Adapt canonical metrics (0-1 or 0-100) to the 0-100 semantic scale
   */
  adaptCanonicalToSemantic(canonical = {}) {
    const values = {
      synergy: canonical.synergy ?? 0,
      harmony: canonical.harmony ?? 0,
      stability: canonical.stability ?? 0,
      corruption: canonical.corruption ?? 0,
      load: canonical.loadPressure ?? 0
    };

    // Detect scale: if any above 1 → assume already 0-100
    const maxVal = Math.max(...Object.values(values));
    const scaleFactor = maxVal > 1 ? 1 : 100;

    return {
      synergy: values.synergy * scaleFactor,
      harmony: values.harmony * scaleFactor,
      stability: values.stability * scaleFactor,
      corruption: values.corruption * scaleFactor,
      load: values.load * scaleFactor
    };
  }

  /**
   * Read semantic context from node using canonical metrics only
   */
  readSemanticContext(node) {
    const userData = node.userData || {};

    // Canonical per-node metrics: prefer top-level canonical fields
    const canonical = {
      synergy: userData.synergy,
      harmony: userData.harmony,
      stability: userData.stability,
      corruption: userData.corruption,
      loadPressure: userData.loadPressure
    };

    const metrics = this.adaptCanonicalToSemantic(canonical);
    
    const context = {
      category: userData.category || 'unknown',
      role: userData.role || 'generic',
      tags: userData.tags || [],
      isSpecial: userData.isSpecial || false,
      
      // Metrics (0-100 scale)
      synergy: metrics.synergy,
      harmony: metrics.harmony,
      corruption: metrics.corruption,
      stability: metrics.stability,
      load: metrics.load,
      
      // Network state
      linkDegree: userData.linkDegree ?? 0,
      clusterMembershipID: userData.clusterMembershipID ?? null,
      
      // Event flags (read-only)
      ascended: userData.ascended || false,
      mythic: userData.mythic || false,
      
      // Position for layout calculations
      position: node.position.clone()
    };
    
    return context;
  }
  
  /**
   * Compute semantic state based on context
   * Returns state object with type and parameters
   */
  computeSemanticState(context, nodeId) {
    // Check for recent events
    const events = this.eventHistory.get(nodeId) || {};
    
    let stateType = 'neutral';
    let parameters = {};
    
    // PRIORITY 1: Check for recent events overriding base states
    if (events.clusterSync) {
      stateType = 'cluster-sync';
      parameters.syncAmount = Math.max(0, events.clusterSync / this.config.clusterSyncDuration);
    }
    // PRIORITY 2: Link events
    else if (events.justLinked) {
      stateType = 'exploring';
      parameters.exploreAmount = Math.max(0, events.justLinked / this.config.exploringFadeTime);
    }
    // PRIORITY 3: Base states (metric-driven)
    else if (this.isConflicted(context)) {
      stateType = 'conflict';
      parameters.conflictStrength = Math.min(1, Math.abs(context.harmony - context.corruption) / 100);
    }
    else if (this.isLeader(context)) {
      stateType = 'leader';
      parameters.hubDegree = Math.min(1, context.linkDegree / 5); // Normalized
    }
    else if (this.isOverloaded(context)) {
      stateType = 'stressed';
      parameters.stressLevel = Math.min(1, (context.load + context.stability) / 200);
    }
    else if (this.isFocused(context)) {
      stateType = 'focused';
      parameters.focusStrength = Math.min(1, context.synergy / 100);
    }
    else if (this.isCalm(context)) {
      stateType = 'calm';
      parameters.calmness = 1;
    }
    else {
      stateType = 'neutral';
    }
    
    return {
      type: stateType,
      parameters: parameters,
      context: context,
      eventFlags: events
    };
  }
  
  /**
   * State detection predicates
   */
  isFocused(context) {
    return context.synergy > 75 && context.corruption < 25 && 
           (context.tags.includes('analytics') || context.role === 'analyzer');
  }
  
  isOverloaded(context) {
    return context.load > 60 || (context.stability > 70 && context.harmony < 30);
  }
  
  isCalm(context) {
    return context.load < 30 && context.stability < 20 && context.corruption < 15;
  }
  
  isLeader(context) {
    return context.linkDegree >= 4 || 
           (context.tags.includes('hub') || context.role === 'router' || context.role === 'gateway');
  }
  
  isConflicted(context) {
    const harmonyCorruptionDiff = Math.abs(context.harmony - context.corruption);
    return context.harmony > 40 && context.corruption > 40 && harmonyCorruptionDiff < 30;
  }
  
  /**
   * Apply semantic visual effects to node's glyph
   */
  applySemanticVisualsToNode(node, nodeId, state, dt) {
    // Get the glyph fusion for this node from Layer 4.0
    const fusion = this.glyphLayer4?.fusionRegistry?.get(nodeId);
    if (!fusion || !fusion.layers) return;
    
    const { type, parameters } = state;
    
    // Apply state-specific visual adjustments
    switch (type) {
      case 'focused':
        this.applyFocusedEffect(fusion, parameters, nodeId, dt);
        break;
      case 'stressed':
        this.applyStressedEffect(fusion, parameters, nodeId, dt);
        break;
      case 'calm':
        this.applyCalmEffect(fusion, parameters, nodeId, dt);
        break;
      case 'exploring':
        this.applyExploringEffect(fusion, parameters, nodeId, dt);
        break;
      case 'leader':
        this.applyLeaderEffect(fusion, parameters, nodeId, dt);
        break;
      case 'conflict':
        this.applyConflictEffect(fusion, parameters, nodeId, dt);
        break;
      case 'cluster-sync':
        this.applyClusterSyncEffect(fusion, parameters, nodeId, dt);
        break;
      default:
        this.applyNeutralEffect(fusion, parameters, nodeId, dt);
    }
  }
  
  /**
   * FOCUSED/ANALYZING - High clarity, sharp animations
   */
  applyFocusedEffect(fusion, parameters, nodeId, dt) {
    const { focusStrength } = parameters;
    
    // Sharpen/increase rotation speed of core glyph
    if (fusion.layers.core) {
      const core = fusion.layers.core;
      // Increase rotation animation speed
      if (!core.userData.semanticRotSpeed) core.userData.semanticRotSpeed = 1;
      core.userData.semanticRotSpeed = THREE.MathUtils.lerp(
        core.userData.semanticRotSpeed,
        1 + focusStrength * this.config.focusedAnimSpeedMultiplier,
        0.1
      );
      
      // Increase core opacity slightly
      if (core.material) {
        core.material.opacity = THREE.MathUtils.lerp(
          core.material.opacity,
          0.95 + focusStrength * 0.15,
          0.1
        );
      }
    }
    
    // Add scan-line sweep effect
    this.addScanLineEffect(fusion, nodeId, focusStrength);
  }
  
  /**
   * OVERLOADED/STRESSED - Wobble, pulsing, orange shift
   */
  applyStressedEffect(fusion, parameters, nodeId, dt) {
    const { stressLevel } = parameters;
    
    if (fusion.layers.core) {
      const core = fusion.layers.core;
      
      // Add wobble to edges
      if (!core.userData.wobblePhase) core.userData.wobblePhase = 0;
      core.userData.wobblePhase += dt * 3;
      
      const wobbleAmount = Math.sin(core.userData.wobblePhase) * this.config.overloadedWobbleAmplitude * stressLevel;
      if (core.scale) {
        core.scale.x = 1 + wobbleAmount;
        core.scale.z = 1 - wobbleAmount * 0.5;
      }
      
      // Pulse opacity faster
      if (!core.userData.pulsePhase) core.userData.pulsePhase = 0;
      core.userData.pulsePhase += dt * this.config.overloadedPulseSpeed;
      
      const pulseAmount = 0.5 + Math.sin(core.userData.pulsePhase) * 0.3;
      if (core.material) {
        core.material.opacity = THREE.MathUtils.lerp(core.material.opacity, pulseAmount, 0.15);

        // Shift color toward orange/red (reuse cached colors, no allocation)
        const targetColor = this._colorCache.temp;
        targetColor.copy(this._colorCache.stressedStart).lerp(
          this._colorCache.stressedEnd,
          stressLevel
        );
        if (core.material.color) {
          core.material.color.lerp(targetColor, stressLevel * 0.05);
        }
      }
    }
  }
  
  /**
   * CALM/IDLE - Slow breathing, minimal rotation
   */
  applyCalmEffect(fusion, parameters, nodeId, dt) {
    if (fusion.layers.core) {
      const core = fusion.layers.core;
      
      // Reduce rotation speed dramatically
      if (!core.userData.semanticRotSpeed) core.userData.semanticRotSpeed = 1;
      core.userData.semanticRotSpeed = THREE.MathUtils.lerp(
        core.userData.semanticRotSpeed,
        this.config.idleRotationReduction,
        0.05
      );
      
      // Gentle breathing scale oscillation
      if (!core.userData.breathPhase) core.userData.breathPhase = 0;
      core.userData.breathPhase += dt * 0.5;
      
      const breathAmount = 1 + Math.sin(core.userData.breathPhase) * 0.05;
      if (core.scale) {
        core.scale.setScalar(breathAmount);
      }
      
      // Dim glow slightly
      if (core.material) {
        core.material.opacity = THREE.MathUtils.lerp(core.material.opacity, 0.7, 0.05);
      }
    }
  }
  
  /**
   * EXPLORING/CONNECTING - Flickering orbit dots, fading connection lines
   */
  applyExploringEffect(fusion, parameters, nodeId, dt) {
    const { exploreAmount } = parameters;
    
    if (fusion.group) {
      // Create/update flickering orbiting dots along fake link directions
      this.updateExploringOrbits(fusion.group, nodeId, exploreAmount, dt);
    }
  }
  
  /**
   * LEADER/HUB - Crown halo, radial pulses
   */
  applyLeaderEffect(fusion, parameters, nodeId, dt) {
    const { hubDegree } = parameters;
    
    if (fusion.group) {
      // Add crown ring effect
      this.updateLeaderCrown(fusion.group, nodeId, hubDegree, dt);
    }
  }
  
  /**
   * CONFLICT/DUALITY - Split coloring, center pulse
   */
  applyConflictEffect(fusion, parameters, nodeId, dt) {
    const { conflictStrength } = parameters;
    
    if (fusion.layers.core && fusion.layers.personality) {
      // Split-color effect between two halves
      if (!fusion.userData.splitPhase) fusion.userData.splitPhase = 0;
      fusion.userData.splitPhase += dt * this.config.dualitySplitSpeed;
      
      const splitAmount = Math.sin(fusion.userData.splitPhase);
      
      // Rotation split: left/right halves rotate in opposite directions
      if (fusion.layers.core) {
        fusion.layers.core.rotation.z = splitAmount * 0.1 * conflictStrength;
      }
      
      // Add center divider line
      this.addSplitDivider(fusion.group || fusion, nodeId, conflictStrength);
    }
  }
  
  /**
   * CLUSTER-SYNC - Synchronized scale pulses
   */
  applyClusterSyncEffect(fusion, parameters, nodeId, dt) {
    const { syncAmount } = parameters;
    
    if (fusion.layers.core) {
      const core = fusion.layers.core;
      
      // Strong synchronized pulse
      if (!core.userData.syncPhase) core.userData.syncPhase = 0;
      core.userData.syncPhase += dt * 3;
      
      const pulseAmount = 1 + Math.sin(core.userData.syncPhase) * 0.15 * syncAmount;
      if (core.scale) {
        core.scale.setScalar(pulseAmount);
      }

      // Flash color (cluster color typically mint/cyan, reuse cached color)
      if (core.material) {
        if (core.material.color) {
          core.material.color.lerp(this._colorCache.clusterSync, syncAmount * 0.1);
        }
        core.material.opacity = THREE.MathUtils.lerp(
          core.material.opacity,
          1,
          syncAmount * 0.15
        );
      }
    }
  }
  
  /**
   * NEUTRAL - No special effects
   */
  applyNeutralEffect(fusion, parameters, nodeId, dt) {
    // Reset any special effects
    if (fusion.layers.core && fusion.layers.core.userData) {
      fusion.layers.core.userData.semanticRotSpeed = 1;
      fusion.layers.core.userData.wobblePhase = 0;
      fusion.layers.core.userData.pulsePhase = 0;
      fusion.layers.core.userData.breathPhase = 0;
    }
  }
  
  /**
   * Add scan-line sweep effect for focused state
   */
  addScanLineEffect(fusion, nodeId, intensity) {
    // Reuse scan line helper meshes
    const scanLine = this.helperMeshes.scanLines[nodeId % this.helperMeshes.scanLines.length];
    if (!scanLine) return;
    
    if (!fusion.userData.scanPhase) fusion.userData.scanPhase = 0;
    fusion.userData.scanPhase = (fusion.userData.scanPhase + 0.02) % 1;
    
    scanLine.visible = intensity > 0.3;
    if (scanLine.visible && fusion.group) {
      scanLine.position.copy(fusion.group.position);
      scanLine.position.y += (fusion.userData.scanPhase - 0.5) * 0.4;
      scanLine.material.opacity = intensity * 0.6;
    }
  }
  
  /**
   * Update flickering orbits for exploring state
   */
  updateExploringOrbits(glyphGroup, nodeId, exploreAmount, dt) {
    const count = Math.min(4, Math.ceil(exploreAmount * 8));
    
    for (let i = 0; i < count; i++) {
      const dot = this.helperMeshes.flickerDots[(nodeId + i) % this.helperMeshes.flickerDots.length];
      if (!dot) continue;
      
      dot.visible = true;
      
      // Orbit around glyph in random directions
      if (!dot.userData.orbitPhase) dot.userData.orbitPhase = Math.random() * Math.PI * 2;
      dot.userData.orbitPhase += this.config.exploringOrbSpeed * 0.02;
      
      const orbitRadius = 0.15 + Math.sin(dot.userData.orbitPhase) * 0.05;
      const angle = dot.userData.orbitPhase + (i / count) * Math.PI * 2;
      
      dot.position.copy(glyphGroup.position);
      dot.position.x += Math.cos(angle) * orbitRadius;
      dot.position.z += Math.sin(angle) * orbitRadius;
      
      dot.material.opacity = exploreAmount * (0.5 + Math.sin(dot.userData.orbitPhase * 3) * 0.4);
    }
  }
  
  /**
   * Update crown halo for leader state
   */
  updateLeaderCrown(glyphGroup, nodeId, hubDegree, dt) {
    const pulseCount = Math.min(8, Math.ceil(this.config.leaderHaloCount * hubDegree));
    
    for (let i = 0; i < pulseCount; i++) {
      const ring = this.helperMeshes.crownRings[(nodeId + i) % this.helperMeshes.crownRings.length];
      if (!ring) continue;
      
      ring.visible = true;
      
      // Radial pulse/rotation
      if (!ring.userData.pulsePhase) ring.userData.pulsePhase = (i / pulseCount) * Math.PI * 2;
      ring.userData.pulsePhase += 0.02;
      
      const angle = ring.userData.pulsePhase;
      const pulse = 1 + Math.sin(ring.userData.pulsePhase * 2) * 0.3;
      
      ring.position.copy(glyphGroup.position);
      ring.position.x += Math.cos(angle) * 0.1 * pulse;
      ring.position.z += Math.sin(angle) * 0.1 * pulse;
      
      ring.material.opacity = 0.4 + Math.sin(ring.userData.pulsePhase * 3) * 0.3;
    }
  }
  
  /**
   * Add split divider line for conflict state
   */
  addSplitDivider(target, nodeId, intensity) {
    const divider = this.helperMeshes.splitDividers[nodeId % this.helperMeshes.splitDividers.length];
    if (!divider) return;
    
    divider.visible = intensity > 0.2;
    if (divider.visible) {
      const targetPos = target.position || target.group?.position;
      if (targetPos) {
        divider.position.copy(targetPos);
      }
      divider.material.opacity = intensity * 0.7;
    }
  }
  
  /**
   * Mark a node as having just created links (event API)
   */
  recordLinkCreated(nodeId) {
    if (!this.eventHistory.has(nodeId)) {
      this.eventHistory.set(nodeId, {});
    }
    this.eventHistory.get(nodeId).justLinked = this.config.eventFadeDuration;
    this.interpretationAccumulator = this.interpretationInterval; // Phase B pilot: force immediate semantic refresh
  }
  
  /**
   * Mark a node as having completed a ritual (event API)
   */
  recordRitualCompleted(nodeId) {
    if (!this.eventHistory.has(nodeId)) {
      this.eventHistory.set(nodeId, {});
    }
    this.eventHistory.get(nodeId).justRitual = this.config.eventFadeDuration;
    this.interpretationAccumulator = this.interpretationInterval; // Phase B pilot: force immediate semantic refresh
  }
  
  /**
   * Mark a node as having ascended (event API)
   */
  recordAscended(nodeId) {
    if (!this.eventHistory.has(nodeId)) {
      this.eventHistory.set(nodeId, {});
    }
    this.eventHistory.get(nodeId).justAscended = this.config.eventFadeDuration;
    this.interpretationAccumulator = this.interpretationInterval; // Phase B pilot: force immediate semantic refresh
  }
  
  /**
   * Mark cluster for synchronized effect (event API)
   */
  recordClusterSync(clusterMemberIds) {
    const syncDuration = this.config.clusterSyncDuration;
    for (const nodeId of clusterMemberIds) {
      if (!this.eventHistory.has(nodeId)) {
        this.eventHistory.set(nodeId, {});
      }
      this.eventHistory.get(nodeId).clusterSync = syncDuration;
    }
    this.interpretationAccumulator = this.interpretationInterval; // Phase B pilot: force immediate semantic refresh
  }

  // hashNodePosition no longer used; canonical nodeId required
  
  /**
   * Disable semantic updates
   */
  disable() {
    this.enabled = false;
  }
  
  /**
   * Enable semantic updates
   */
  enable() {
    this.enabled = true;
    this.interpretationAccumulator = this.interpretationInterval; // Phase B pilot: reevaluate semantics immediately on enable
  }

  setHoverTarget(node) {
    this.hoverTarget = node || null;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clear meshes
    for (const meshArray of Object.values(this.helperMeshes)) {
      for (const mesh of meshArray) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      }
    }
    
    // Remove helper container
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
    
    // Clear maps
    this.semanticState.clear();
    this.eventHistory.clear();
    this.lastMetricsRead.clear();
    this.interpretationAccumulator = 0; // Phase B pilot: reset gating on dispose
  }
}
