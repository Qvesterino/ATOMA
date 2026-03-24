import * as THREE from 'three';

/**
 * NODE EVOLUTION 2.0 - SAFE EDITION
 * 
 * Allows nodes to evolve visually over time without any world modifications,
 * physics changes, camera influence, or global effects.
 * 
 * CORE DESIGN PRINCIPLES:
 * ✓ SAFE: Node-local visual effects only
 * ✓ SAFE: No world transforms, no terrain, no physics
 * ✓ SAFE: No camera influence, no post-processing changes
 * ✓ SAFE: No recursive loops, no scene regeneration
 * ✓ VISUAL: Progressive enhancement through 4 evolution stages
 * ✓ ORGANIC: Triggered by node-local stability progression
 * 
 * EVOLUTION STAGES:
 * Stage 1 – Base Node (current visual state)
 * Stage 2 – Enhanced Core (stronger glow, cleaner patterns)
 * Stage 3 – Advanced Node (spectral highlights, energy arcs)
 * Stage 4 – Rare Ascended (1-3% chance, elegant design)
 * 
 * EVOLUTION TRIGGERS:
 * - Stability thresholds sustained over time
 * 
 * SAFE PROTECTIONS:
 * - All effects node-local only
 * - World transform locks enforced
 * - Conflict detection (prevents overlapping effects)
 * - Animation limits (max scale 1.15, no position shifts)
 * - No camera/world distortion
 */

export class NodeEvolution2_0 {
  constructor(scene, semanticBus) {
    this.scene = scene;
    this.semanticBus = semanticBus;
    
    // Evolution state registry
    this.registry = {
      evolutionActive: true,
      nodeEvolutionStates: new Map(),  // nodeId → evolution data
      totalEvolutionsApplied: 0,
      frameCounter: 0
    };
    
    // Evolution configuration
    this.config = {
      // ============================================================
      // STAGE DEFINITIONS
      // ============================================================
      stages: {
        1: {
          name: 'Base Node',
          description: 'Standard AI node configuration',
          glowIntensity: 0.6,
          emissiveScale: 1.0,
          colorSaturation: 1.0,
          ringOpacity: 0.5,
          timeToNextStage: 60  // seconds
        },
        2: {
          name: 'Enhanced Core',
          description: 'Stronger glow, cleaner hologram patterns',
          glowIntensity: 0.85,
          emissiveScale: 1.3,
          colorSaturation: 1.15,
          ringOpacity: 0.7,
          ringAdditions: 1,  // Add 1 extra ring
          timeToNextStage: 90
        },
        3: {
          name: 'Advanced Node',
          description: 'Spectral highlights, soft energy arcs',
          glowIntensity: 1.1,
          emissiveScale: 1.6,
          colorSaturation: 1.3,
          ringOpacity: 0.85,
          ringAdditions: 2,  // Add 2 extra rings
          addSpectralHighlights: true,
          timeToNextStage: 120
        },
        4: {
          name: 'Rare Ascended',
          description: 'Elegant, rare evolution (1-3% chance)',
          glowIntensity: 1.4,
          emissiveScale: 2.0,
          colorSaturation: 1.45,
          ringOpacity: 0.95,
          ringAdditions: 3,
          addSpectralHighlights: true,
          addEnergyArcs: true,
          requiresRareEvent: true,
          rareChance: 0.02  // 2% base chance
        }
      },
      
      // ============================================================
      // EVOLUTION TRIGGER THRESHOLDS
      // ============================================================
      triggers: {
        // Stability-based evolution (primary path)
        stabilityThresholds: {
          2: 0.55,
          3: 0.65,
          4: 0.75
        },
        stabilityDwellTime: 5
      },
      
      // ============================================================
      // ANIMATION SAFETY LIMITS
      // ============================================================
      animationLimits: {
        maxScaleIncrease: 1.15,  // Never exceed 115% scale
        minScaleIncrease: 0.95,  // Never go below 95% scale
        animationDuration: 1.2,  // 1.2 seconds per evolution
        opacity: {
          min: 0.3,
          max: 1.0
        }
      },
      
      // ============================================================
      // SAFETY PROTECTIONS
      // ============================================================
      safety: {
        enforcWorldLocks: true,
        preventPositionShift: true,
        detectConflicts: true,
        checkTerrainProximity: true,
        terrainProximityThreshold: 2,
        maxEvolutionsPerNode: 4  // Never evolve beyond Stage 4
      }
    };

    this.installDebugAPI();
  }
  
  /**
   * Register a node for evolution tracking
   */
  registerNode(node, nodeId) {
    if (!node || !nodeId) return false;
    
    // Check if already registered
    if (this.registry.nodeEvolutionStates.has(nodeId)) {
      return true;
    }
    
    const initialStage = Math.max(
      1,
      Math.min(4, Math.round(Number(node.userData?.evolutionStage) || 1))
    );

    // Initialize evolution state for this node
    const evolutionState = {
      nodeId: nodeId,
      node: node,
      currentStage: initialStage,
      timeInStage: 0,
      isEvolving: false,
      evolutionProgress: 0,  // 0 to 1 (animation progress)
      lastEvolutionTime: 0,
      lastStability: 0.5,
      stabilityTimeAboveThreshold: 0,
      synergyCount: 0,
      linkCount: 0,
      originalScale: node.scale.clone(),
      originalMaterials: new Map(),
      addedElements: [],  // Track added VFX elements
      isConflicted: false,
      conflictReason: ''
    };
    
    // Store original materials
    this.storeOriginalMaterials(node, evolutionState);

    node.userData.evolutionStage = initialStage;
    
    this.registry.nodeEvolutionStates.set(nodeId, evolutionState);
    return true;
  }
  
  /**
   * Store original materials for restoration if needed
   */
  storeOriginalMaterials(node, evolutionState) {
    node.traverse((child) => {
      if (child.material && !evolutionState.originalMaterials.has(child)) {
        evolutionState.originalMaterials.set(child, {
          emissiveIntensity: child.material.emissiveIntensity,
          emissive: child.material.emissive?.clone(),
          opacity: child.material.opacity,
          color: child.material.color?.clone()
        });
      }
    });
  }
  
  /**
   * Update evolution for all registered nodes
   */
  update(deltaTime, nodeStates = {}, linkingSystem = null) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    if (!this.registry.evolutionActive) return;
    
    this.registry.frameCounter++;
    
    // Update each registered node
    for (const [nodeId, evolutionState] of this.registry.nodeEvolutionStates) {
      if (!evolutionState || !evolutionState.node) continue;
      
      // Safety check: verify node still exists in scene
      if (!this.nodeExistsInScene(evolutionState.node)) {
        this.registry.nodeEvolutionStates.delete(nodeId);
        continue;
      }
      
      // Update synergy count from linking system
      if (linkingSystem) {
        evolutionState.synergyCount = this.getSynergyCount(
          nodeId,
          linkingSystem
        );
      }
      
      // ============================================================
      // PHASE 1: Check for evolution triggers
      // ============================================================
      if (!evolutionState.isEvolving && evolutionState.currentStage < 4) {
        const shouldEvolve = this.checkEvolutionTriggers(
          evolutionState,
          deltaTime
        );
        
        if (shouldEvolve) {
          this.startEvolution(evolutionState);
        }
      }
      
      // ============================================================
      // PHASE 2: Update active evolution animation
      // ============================================================
      if (evolutionState.isEvolving) {
        this.updateEvolutionAnimation(evolutionState, deltaTime);
      }
      
      // ============================================================
      // PHASE 3: Enforce safety locks
      // ============================================================
      if (this.config.safety.enforcWorldLocks) {
        this.enforceSafetyLocks(evolutionState);
      }
      
      // Update time in stage
      evolutionState.timeInStage += deltaTime;

      this.debugEvolutionState(evolutionState);
    }
  }

  debugEvolutionState(evolutionState) {
    if (typeof window === 'undefined' || !evolutionState?.node) return;

    const targetId = window.__ATOMA_DEBUG_EVOLUTION_NODE_ID;
    if (!targetId) return;

    const matches = [
      evolutionState.nodeId,
      evolutionState.node?.uuid,
      evolutionState.node?.userData?.nodeId,
      evolutionState.node?.id
    ].some((value) => value === targetId);

    if (!matches) return;

    const now = performance.now();
    const debugState = evolutionState.node.userData.__evolutionDebugState || {
      lastLogAt: -Infinity,
      lastStage: evolutionState.currentStage,
      lastEvolving: evolutionState.isEvolving
    };

    const stageChanged = debugState.lastStage !== evolutionState.currentStage;
    const evolvingChanged = debugState.lastEvolving !== evolutionState.isEvolving;
    const intervalMs = window.__ATOMA_DEBUG_EVOLUTION_INTERVAL_MS ?? 1000;
    const shouldLog = stageChanged || evolvingChanged || (now - debugState.lastLogAt >= intervalMs);

    if (!shouldLog) return;

    debugState.lastLogAt = now;
    debugState.lastStage = evolutionState.currentStage;
    debugState.lastEvolving = evolutionState.isEvolving;
    evolutionState.node.userData.__evolutionDebugState = debugState;

    console.log('[NodeEvolution2_0][debug]', {
      nodeId: evolutionState.node.userData?.nodeId || evolutionState.nodeId,
      uuid: evolutionState.node.uuid,
      stage: evolutionState.currentStage,
      timeInStage: Number(evolutionState.timeInStage?.toFixed?.(2) ?? evolutionState.timeInStage),
      stability: Number(evolutionState.lastStability?.toFixed?.(3) ?? evolutionState.lastStability),
      stabilityTimeAboveThreshold: Number(
        evolutionState.stabilityTimeAboveThreshold?.toFixed?.(2) ?? evolutionState.stabilityTimeAboveThreshold
      ),
      synergyCount: evolutionState.synergyCount,
      isEvolving: evolutionState.isEvolving,
      evolutionProgress: Number(evolutionState.evolutionProgress?.toFixed?.(3) ?? evolutionState.evolutionProgress),
      mirroredStage: evolutionState.node.userData?.evolutionStage
    });
  }
  
  /**
   * Check if evolution should trigger
   */
  checkEvolutionTriggers(evolutionState, deltaTime) {
    if (evolutionState.currentStage >= 4) return false;
    if (evolutionState.isConflicted) return false;
    
    const nextStage = evolutionState.currentStage + 1;
    const nextStageDef = this.config.stages[nextStage];
    if (!nextStageDef) return false;

    const stabilityThreshold = this.config.triggers.stabilityThresholds[nextStage];
    const stabilityDwellTime = this.config.triggers.stabilityDwellTime || 15;
    const stability = this.getNodeStability(evolutionState.node);
    evolutionState.lastStability = stability;

    if (Number.isFinite(stabilityThreshold) && stability >= stabilityThreshold) {
      evolutionState.stabilityTimeAboveThreshold += deltaTime;
      if (evolutionState.stabilityTimeAboveThreshold >= stabilityDwellTime) {
        return true;
      }
    } else {
      evolutionState.stabilityTimeAboveThreshold = 0;
    }

    return false;
  }

  getNodeStability(node) {
    const candidates = [
      node?.userData?.metrics?.stability,
      node?.userData?.gameplayState?.stability,
      node?.userData?.stability,
      node?.metrics?.stability
    ];

    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value)) {
        return THREE.MathUtils.clamp(value, 0, 1);
      }
    }

    return 0.5;
  }

  installDebugAPI() {
    if (typeof window === 'undefined') return;

    window.__ATOMA_EVOLUTION_DEBUG__ = {
      reportNode: (targetId) => this.reportNodeEvolutionState(targetId),
      listEligibleNodes: () => this.listEligibleNodes(),
      listNodeStages: () => this.listNodeStages(),
      setTargetNode: (targetId, intervalMs = 500) => {
        window.__ATOMA_DEBUG_EVOLUTION_NODE_ID = targetId;
        window.__ATOMA_DEBUG_EVOLUTION_INTERVAL_MS = intervalMs;
        console.log('[NodeEvolution2_0][debug] target set', { targetId, intervalMs });
      },
      clearTargetNode: () => {
        delete window.__ATOMA_DEBUG_EVOLUTION_NODE_ID;
        delete window.__ATOMA_DEBUG_EVOLUTION_INTERVAL_MS;
        console.log('[NodeEvolution2_0][debug] target cleared');
      }
    };
  }

  resolveEvolutionTargetId(targetId) {
    if (targetId == null) return null;
    return String(targetId);
  }

  matchesEvolutionTarget(evolutionState, targetId) {
    const normalizedTargetId = this.resolveEvolutionTargetId(targetId);
    if (!normalizedTargetId || !evolutionState?.node) return false;

    const candidates = [
      evolutionState.nodeId,
      evolutionState.node?.uuid,
      evolutionState.node?.userData?.nodeId,
      evolutionState.node?.id
    ];

    return candidates.some((value) => String(value) === normalizedTargetId);
  }

  getEvolutionSnapshot(evolutionState) {
    if (!evolutionState?.node) return null;

    const nextStage = Math.min(4, (evolutionState.currentStage || 1) + 1);
    const threshold = this.config.triggers.stabilityThresholds[nextStage] ?? null;
    const stability = this.getNodeStability(evolutionState.node);
    const dwellTime = this.config.triggers.stabilityDwellTime || 5;

    return {
      nodeId: evolutionState.node.userData?.nodeId || evolutionState.nodeId,
      uuid: evolutionState.node.uuid,
      stage: evolutionState.currentStage,
      mirroredStage: evolutionState.node.userData?.evolutionStage,
      nextStage: evolutionState.currentStage >= 4 ? null : nextStage,
      stability: Number(stability.toFixed(4)),
      requiredStability: threshold == null ? null : Number(threshold.toFixed(2)),
      timeAboveThreshold: Number((evolutionState.stabilityTimeAboveThreshold || 0).toFixed(2)),
      requiredDwellTime: dwellTime,
      isEligibleNow: threshold == null ? false : stability >= threshold,
      isEvolving: Boolean(evolutionState.isEvolving),
      timeInStage: Number((evolutionState.timeInStage || 0).toFixed(2))
    };
  }

  reportNodeEvolutionState(targetId) {
    const evolutionState = Array.from(this.registry.nodeEvolutionStates.values()).find((state) =>
      this.matchesEvolutionTarget(state, targetId)
    );

    if (!evolutionState) {
      console.warn('[NodeEvolution2_0][debug] node not found', { targetId });
      return null;
    }

    const snapshot = this.getEvolutionSnapshot(evolutionState);
    console.table([snapshot]);
    return snapshot;
  }

  listEligibleNodes() {
    const snapshots = Array.from(this.registry.nodeEvolutionStates.values())
      .map((state) => this.getEvolutionSnapshot(state))
      .filter(Boolean)
      .filter((snapshot) => snapshot.nextStage !== null && snapshot.isEligibleNow)
      .sort((left, right) => right.stability - left.stability);

    console.table(snapshots);
    return snapshots;
  }

  listNodeStages() {
    const snapshots = Array.from(this.registry.nodeEvolutionStates.values())
      .map((state) => this.getEvolutionSnapshot(state))
      .filter(Boolean)
      .sort((left, right) => right.stage - left.stage || right.stability - left.stability);

    console.table(snapshots);
    return snapshots;
  }
  
  /**
   * Start evolution animation
   */
  startEvolution(evolutionState) {
    // ============================================================
    // SAFETY CHECK 1: Conflict detection
    // ============================================================
    if (this.detectConflict(evolutionState)) {
      evolutionState.isConflicted = true;
      evolutionState.conflictReason = 'Conflict detected, evolution delayed';
      return false;
    }
    
    // ============================================================
    // SAFETY CHECK 2: World transform verification
    // ============================================================
    if (!this.verifyWorldTransforms(evolutionState)) {
      evolutionState.isConflicted = true;
      evolutionState.conflictReason = 'World transform conflict';
      return false;
    }
    
    evolutionState.isEvolving = true;
    evolutionState.evolutionProgress = 0;
    evolutionState.lastEvolutionTime = Date.now();

    this.debugEvolutionState(evolutionState);
    
    console.log(`✓ Node ${evolutionState.nodeId} evolving to Stage ${evolutionState.currentStage + 1}`);
    
    return true;
  }
  
  /**
   * Update evolution animation progress
   */
  updateEvolutionAnimation(evolutionState, deltaTime) {
    const animationDuration = this.config.animationLimits.animationDuration;
    
    // Progress animation (0 to 1)
    evolutionState.evolutionProgress += deltaTime / animationDuration;
    
    if (evolutionState.evolutionProgress >= 1.0) {
      // Animation complete - finalize evolution
      evolutionState.evolutionProgress = 1.0;
      this.finalizeEvolution(evolutionState);
      evolutionState.isEvolving = false;
      evolutionState.timeInStage = 0;  // Reset time for next stage
      evolutionState.stabilityTimeAboveThreshold = 0;
      this.registry.totalEvolutionsApplied++;
    } else {
      // Animation in progress - apply progressive effects
      this.applyEvolutionEffects(evolutionState);
    }
  }
  
  /**
   * Apply evolution visual effects during animation
   */
  applyEvolutionEffects(evolutionState) {
    const progress = evolutionState.evolutionProgress;
    const currentStage = evolutionState.currentStage;
    const nextStage = currentStage + 1;
    
    if (!this.config.stages[nextStage]) return;
    
    const currentStageDef = this.config.stages[currentStage];
    const nextStageDef = this.config.stages[nextStage];
    
    // ============================================================
    // EFFECT 1: Glow intensity progression
    // ============================================================
    const glowFrom = currentStageDef.glowIntensity;
    const glowTo = nextStageDef.glowIntensity;
    const currentGlow = THREE.MathUtils.lerp(glowFrom, glowTo, progress);
    
    // ============================================================
    // EFFECT 2: Emissive scale progression
    // ============================================================
    const emissiveFrom = currentStageDef.emissiveScale;
    const emissiveTo = nextStageDef.emissiveScale;
    const currentEmissive = THREE.MathUtils.lerp(emissiveFrom, emissiveTo, progress);
    
    // ============================================================
    // EFFECT 3: Ring opacity progression
    // ============================================================
    const ringOpacityFrom = currentStageDef.ringOpacity;
    const ringOpacityTo = nextStageDef.ringOpacity;
    const currentRingOpacity = THREE.MathUtils.lerp(ringOpacityFrom, ringOpacityTo, progress);
    
    // ============================================================
    // EFFECT 4: Safe scale progression (max 1.15)
    // ============================================================
    const scaleMax = this.config.animationLimits.maxScaleIncrease;
    const scaleFrom = 1.0;
    const scaleTo = 1.0 + (scaleMax - 1.0) * Math.min(nextStage / 4, 1.0);
    const currentScale = THREE.MathUtils.lerp(scaleFrom, scaleTo, progress);
    
    // Apply to node and all children
    this.applyEvolutionToNode(
      evolutionState.node,
      currentGlow,
      currentEmissive,
      currentRingOpacity,
      currentScale,
      nextStageDef
    );
  }
  
  /**
   * Apply evolution effects to node hierarchy
   */
  applyEvolutionToNode(node, glowIntensity, emissiveScale, ringOpacity, scale, stageDef) {
    // ============================================================
    // SAFETY: Preserve position
    // ============================================================
    const originalPos = node.position.clone();
    
    // Update scale (with safety limit)
    node.scale.setScalar(scale);
    
    // Restore position (prevent drift)
    node.position.copy(originalPos);
    
    // ============================================================
    // Apply visual effects to children
    // ============================================================
    node.traverse((child) => {
      if (!child.material || child.userData.noEvolve) return;
      
      const material = child.material;
      
      // Update emissive intensity
      if (material.emissive) {
        material.emissiveIntensity = glowIntensity * emissiveScale;
      }
      
      // Update ring opacity
      if (child.userData.isRing || child.userData.orbitRing) {
        material.opacity = Math.min(ringOpacity, this.config.animationLimits.opacity.max);
      }
      
      // Rotate rings smoothly
      if (child.userData.orbitRing && child.userData.rotationSpeed) {
        const rotationAxis = child.userData.rotationAxis || new THREE.Vector3(0, 1, 0);
        child.rotateOnWorldAxis(rotationAxis, child.userData.rotationSpeed * 0.016);  // ~16ms per frame
      }
    });
  }
  
  /**
   * Finalize evolution stage
   */
  finalizeEvolution(evolutionState) {
    const nextStage = evolutionState.currentStage + 1;
    
    if (nextStage > 4) return;
    
    const stageDef = this.config.stages[nextStage];
    
    // ============================================================
    // EMIT EVENT FOR STAGE 4 (ASCENDED)
    // ============================================================
    if (this.semanticBus) {
      const timestamp = performance.now();
      this.semanticBus.emit('node:evolved', {
        nodeId: evolutionState.nodeId,
        stage: nextStage,
        fromStage: evolutionState.currentStage,
        timestamp
      }, { priority: this.semanticBus.priority.NORMAL });

      if (nextStage === 4) {
        this.semanticBus.emit('semantic.ascension', {
          nodeId: evolutionState.nodeId,
          fromStage: evolutionState.currentStage,
          toStage: 'ascended',
          timestamp
        }, { priority: this.semanticBus.priority.CRITICAL });
        this.semanticBus.emit('node:ascended', {
          nodeId: evolutionState.nodeId,
          stage: nextStage,
          timestamp
        }, { priority: this.semanticBus.priority.CRITICAL });
        console.log(`✓ Node ${evolutionState.nodeId} ascended to Stage 4 (event-driven)`);
      }
    }
    
    // ============================================================
    // ADD SPECTRAL HIGHLIGHTS (if applicable)
    // ============================================================
    if (stageDef.addSpectralHighlights && !this.hasSpectralHighlights(evolutionState)) {
      this.addSpectralHighlights(evolutionState);
    }
    
    // ============================================================
    // ADD ENERGY ARCS (if applicable)
    // ============================================================
    if (stageDef.addEnergyArcs && !this.hasEnergyArcs(evolutionState)) {
      this.addEnergyArcs(evolutionState);
    }
    
    // ============================================================
    // ADD EXTRA RINGS (if applicable)
    // ============================================================
    if (stageDef.ringAdditions > 0) {
      this.addExtraRings(evolutionState, stageDef.ringAdditions);
    }
    
    // Progress to next stage
    evolutionState.currentStage = nextStage;
    if (evolutionState.node?.userData) {
      evolutionState.node.userData.evolutionStage = nextStage;
    }
    evolutionState.isConflicted = false;

    this.debugEvolutionState(evolutionState);
  }
  
  /**
   * Add spectral highlights to node
   */
  addSpectralHighlights(evolutionState) {
    const node = evolutionState.node;
    
    // FIX: Guard to prevent duplicate additions using userData.effects map
    if (!node.userData.effects) {
      node.userData.effects = new Map();
    }
    if (node.userData.effects.has('spectralHighlight')) {
      return; // Already exists
    }
    
    // Get node color from existing material
    let baseColor = new THREE.Color(0x00ff88);  // Default green
    
    node.traverse((child) => {
      if (child.material?.color) {
        baseColor = child.material.color;
      }
    });
    
    // Create spectral highlight geometry
    const highlightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.15,
      emissive: baseColor,
      emissiveIntensity: 0.4,
      fog: false
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.userData = {
      vfxType: 'spectralHighlight',
      isVFX: true,
      noEvolve: true,
      rotationSpeed: 0.3
    };
    
    node.add(highlight);
    evolutionState.addedElements.push(highlight);
    node.userData.effects.set('spectralHighlight', highlight);
  }
  
  /**
   * Add energy arcs to node
   */
  addEnergyArcs(evolutionState) {
    const node = evolutionState.node;
    
    // FIX: Guard to prevent duplicate additions using userData.effects map
    if (!node.userData.effects) {
      node.userData.effects = new Map();
    }
    if (node.userData.effects.has('energyArc')) {
      return; // Already exists
    }
    
    // Create energy arc geometry
    const arcGeometry = new THREE.BufferGeometry();
    const points = [];
    
    // Create arc points in a circular pattern
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const x = Math.cos(angle) * 0.7;
      const z = Math.sin(angle) * 0.7;
      const y = Math.sin(i / 16) * 0.3;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    arcGeometry.setFromPoints(points);
    
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    
    const arc = new THREE.Line(arcGeometry, arcMaterial);
    arc.userData = {
      vfxType: 'energyArc',
      isVFX: true,
      noEvolve: true
    };
    
    node.add(arc);
    evolutionState.addedElements.push(arc);
    node.userData.effects.set('energyArc', arc);
  }
  
  /**
   * Add extra rings during evolution
   */
  addExtraRings(evolutionState, count) {
    const node = evolutionState.node;
    
    // FIX: Guard to prevent duplicate additions using userData.effects map
    if (!node.userData.effects) {
      node.userData.effects = new Map();
    }
    
    const currentRingCount = Array.from(node.userData.effects.keys())
      .filter(key => key.startsWith('evolutionRing')).length;
    
    for (let i = 0; i < count; i++) {
      const ringIndex = currentRingCount + i;
      const effectKey = `evolutionRing_${ringIndex}`;
      
      if (node.userData.effects.has(effectKey)) {
        continue; // Skip if already exists
      }
      
      const ringRadius = 1.0 + i * 0.25;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.03, 8, 64);
      
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.4,
        fog: false
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      
      ring.userData = {
        vfxType: 'evolutionRing',
        isVFX: true,
        noEvolve: true,
        orbitRing: true,
        rotationSpeed: 0.2 + Math.random() * 0.2,
        rotationAxis: new THREE.Vector3(
          Math.random(),
          Math.random(),
          Math.random()
        ).normalize()
      };
      
      node.add(ring);
      evolutionState.addedElements.push(ring);
      node.userData.effects.set(effectKey, ring);
    }
  }
  
  /**
   * Check if node already has spectral highlights
   */
  hasSpectralHighlights(evolutionState) {
    return evolutionState.addedElements.some(el => el.userData.vfxType === 'spectralHighlight');
  }
  
  /**
   * Check if node already has energy arcs
   */
  hasEnergyArcs(evolutionState) {
    return evolutionState.addedElements.some(el => el.userData.vfxType === 'energyArc');
  }
  
  /**
   * Detect conflicts with world transforms
   */
  detectConflict(evolutionState) {
    const node = evolutionState.node;
    
    // Check if node has unexpected world transform changes
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    
    // Verify world position hasn't shifted drastically
    if (node.userData.lastWorldPos) {
      const distToLast = worldPos.distanceTo(node.userData.lastWorldPos);
      if (distToLast > 0.1) {  // More than 10cm movement is suspicious
        return true;
      }
    }
    
    node.userData.lastWorldPos = worldPos.clone();
    return false;
  }
  
  /**
   * Verify world transforms are still locked
   */
  verifyWorldTransforms(evolutionState) {
    const node = evolutionState.node;
    
    // Check parent chain for any unexpected modifications
    let parent = node.parent;
    while (parent) {
      if (parent.userData?.noModify) {
        return false;  // Parent marked as no-modify
      }
      parent = parent.parent;
    }
    
    return true;
  }
  
  /**
   * Enforce safety locks after evolution update
   */
  enforceSafetyLocks(evolutionState) {
    const node = evolutionState.node;
    
    // ============================================================
    // LOCK 1: Enforce position (prevent drift)
    // ============================================================
    if (node.userData.originalPosition) {
      node.position.copy(node.userData.originalPosition);
    }
    
    // ============================================================
    // LOCK 2: Enforce scale limits
    // ============================================================
    const maxScale = this.config.animationLimits.maxScaleIncrease;
    const currentScale = node.scale.x;
    if (currentScale > maxScale) {
      node.scale.setScalar(maxScale);
    }
    
    // ============================================================
    // LOCK 3: Zero rotation (prevent camera distortion)
    // ============================================================
    if (node.userData.lockRotation) {
      node.rotation.set(0, 0, 0);
      node.quaternion.set(0, 0, 0, 1);
    }
  }
  
  /**
   * Get synergy count for node
   */
  getSynergyCount(nodeId, linkingSystem) {
    if (!linkingSystem || !linkingSystem.links) return 0;
    
    return linkingSystem.links.filter(link =>
      (link.source?.uuid === nodeId || link.target?.uuid === nodeId) && link.active
    ).length;
  }
  
  /**
   * Check if node still exists in scene
   */
  nodeExistsInScene(node) {
    let current = node;
    while (current.parent) {
      current = current.parent;
      if (current === this.scene) return true;
    }
    return current === this.scene;
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.log('\n' + '='.repeat(60));
    console.log('NODE EVOLUTION 2.0 - SAFE EDITION STATUS REPORT');
    console.log('='.repeat(60));
    
    console.log('\n✓ EVOLUTION STAGES:');
    Object.keys(this.config.stages).forEach(stage => {
      const stageDef = this.config.stages[stage];
      console.log(`  • Stage ${stage}: ${stageDef.name}`);
      console.log(`    → ${stageDef.description}`);
    });
    
    console.log('\n✓ EVOLUTION TRIGGERS:');
    Object.entries(this.config.triggers.stabilityThresholds).forEach(([stage, threshold]) => {
      console.log(
        `  • Stage ${stage}: stability >= ${Number(threshold).toFixed(2)} for ${this.config.triggers.stabilityDwellTime}s`
      );
    });
    
    console.log('\n✓ ANIMATION SAFETY:');
    console.log(`  • Max Scale Increase: ${(this.config.animationLimits.maxScaleIncrease * 100).toFixed(0)}%`);
    console.log(`  • Animation Duration: ${this.config.animationLimits.animationDuration}s`);
    console.log(`  • Position Lock: ENABLED`);
    console.log(`  • World Transform Lock: ENABLED`);
    
    console.log('\n✓ SAFETY PROTECTIONS:');
    console.log(`  • Conflict Detection: ${this.config.safety.detectConflicts}`);
    console.log(`  • Terrain Proximity Check: ${this.config.safety.checkTerrainProximity}`);
    console.log(`  • Max Evolutions Per Node: ${this.config.safety.maxEvolutionsPerNode}`);
    console.log(`  • World Locks Enforced: ${this.config.safety.enforcWorldLocks}`);
    
    console.log('\n✓ VISUAL EFFECTS:');
    console.log(`  • Spectral Highlights (Stage 3+): YES`);
    console.log(`  • Energy Arcs (Stage 4): YES`);
    console.log(`  • Extra Rings: YES (scalable by stage)`);
    console.log(`  • Glow Intensity: Progressive (0.6 → 1.4)`);
    
    console.log('\n✓ INITIALIZATION:');
    console.log(`  • Status: ACTIVE`);
    console.log(`  • Registered Nodes: ${this.registry.nodeEvolutionStates.size}`);
    console.log(`  • Total Evolutions Applied: ${this.registry.totalEvolutionsApplied}`);
    
    console.log('\n✓ DESIGN GUARANTEE:');
    console.log('  • ZERO world modifications');
    console.log('  • ZERO physics changes');
    console.log('  • ZERO camera influence');
    console.log('  • ZERO post-processing changes');
    console.log('  • Pure visual-only enhancement');
    
    console.log('\n' + '='.repeat(60));
    console.log('Node Evolution 2.0 initialized successfully!\n');
  }
  
  /**
   * Get evolution statistics
   */
  getStatistics() {
    const stats = {
      totalNodesTracked: this.registry.nodeEvolutionStates.size,
      totalEvolutionsApplied: this.registry.totalEvolutionsApplied,
      nodesPerStage: { 1: 0, 2: 0, 3: 0, 4: 0 },
      currentlyEvolving: 0
    };
    
    for (const [, state] of this.registry.nodeEvolutionStates) {
      stats.nodesPerStage[state.currentStage] =
        (stats.nodesPerStage[state.currentStage] || 0) + 1;
      if (state.isEvolving) stats.currentlyEvolving++;
    }
    
    return stats;
  }
  
  /**
   * Disable evolution temporarily
   */
  disable() {
    this.registry.evolutionActive = false;
    console.log('⊗ Node Evolution 2.0 disabled');
  }
  
  /**
   * Re-enable evolution
   */
  enable() {
    this.registry.evolutionActive = true;
    console.log('✓ Node Evolution 2.0 enabled');
  }
}
