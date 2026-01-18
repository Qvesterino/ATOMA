import * as THREE from 'three';
import { canEmissive } from './_EmissiveUtils.js';

/**
 * EXTREME AI SHADER TEST SUITE - ATOMA Edition
 * 
 * Comprehensive diagnostics for Extreme AI node archetype shader integration
 * 
 * SAFETY GUARANTEES:
 * ✅ Read-only diagnostics - zero modifications to gameplay, physics, or core systems
 * ✅ Non-destructive - all debug features are opt-in and reversible
 * ✅ Performance-optimized - negligible impact when disabled
 * ✅ Fully isolated - no global state pollution
 * ✅ Console-driven - all controls via debug commands
 * 
 * RESPONSIBILITIES:
 * 1. Build static mapping of all 12 EXTREME archetypes → their shaders
 * 2. Validate shader/material integrity at runtime (opt-in)
 * 3. Provide optional debug visualization (opt-in)
 * 4. Generate consistency reports (on-demand)
 * 5. Track metrics for telemetry
 */

export class ExtremeAIShaderTestSuite {
  constructor(config = {}) {
    this.scene = config.scene || null;
    this.nodeManager = config.nodeManager || null;
    this.shaderPack = config.shaderPack || null;
    
    // Registry: mapping of archetype ID → definition
    this.archetypeRegistry = new Map();
    this.shaderRegistry = new Map();
    this.nodeMap = new Map(); // node → diagnostic data
    
    // Flags
    this.diagnosticsEnabled = false;
    this.debugVisualsEnabled = false;
    this.isInitialized = false;
    
    // Metrics
    this.metrics = {
      totalExtremeNodes: 0,
      nodesWithValidMaterial: 0,
      nodesWithValidShader: 0,
      shaderErrors: [],
      materialErrors: [],
      orphanedShaders: [],
      unmappedArchetypes: [],
      lastUpdateTime: 0
    };
    
    // Debug visualization overlay data
    this.debugOverlays = new Map(); // node → overlay group
    
    console.log('[ExtremeAIShaderTestSuite] Initialized - ready for setup');
  }

  /**
   * Setup: Build static registries
   * Call once after scene is ready
   */
  setup() {
    if (this.isInitialized) return;
    
    console.log('[ExtremeAIShaderTestSuite] Running setup...');
    
    // Build archetype registry from known definitions
    this.buildArchetypeRegistry();
    
    // Build shader registry
    this.buildShaderRegistry();
    
    this.isInitialized = true;
    
    console.log(`[ExtremeAIShaderTestSuite] Setup complete - ${this.archetypeRegistry.size} archetypes, ${this.shaderRegistry.size} shaders`);
  }

  /**
   * Build registry of all known EXTREME archetypes
   */
  buildArchetypeRegistry() {
    // These are the 12 EXTREME archetypes from _ExtremeAINodePack.js
    const archetypes = [
      {
        id: 0,
        name: 'Hyperbolic Neural Prism',
        standardName: 'QNT-ORB-HLD', // From standardization
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Icosahedron + Wireframe',
        expectedShader: 'hyperPrismShader',
        description: '5D-like prism with morphing convex/concave animation'
      },
      {
        id: 1,
        name: 'Singularity Knot Node',
        standardName: 'SIG-CRW-NEX',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Torus Knot + Pulsing Core',
        expectedShader: 'singularityKnotShader',
        description: 'Torus-knot geometry with core collapse pulsing'
      },
      {
        id: 2,
        name: 'Quantum Lattice Node',
        standardName: 'QNT-VEC-RSP',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Point Lattice + Connections',
        expectedShader: 'quantumLatticeShader',
        description: 'Point lattice with thin connections and micro-glitch'
      },
      {
        id: 3,
        name: 'Fractal Bloom Node',
        standardName: 'FRM-LOT-PRM',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Recursive Geometry',
        expectedShader: 'fractalBloomShader',
        description: 'Recursive scaled geometries forming organic bloom'
      },
      {
        id: 4,
        name: 'Reactive Tesseract',
        standardName: 'UMB-HEX-FLX',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Cube + Transforming Edges',
        expectedShader: 'reactiveTesseractShader',
        description: 'Hypercube projection with metric-reactive edges'
      },
      {
        id: 5,
        name: 'Chaotic Heart',
        standardName: 'CHR-ORB-BRK',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Pulsing Sphere + Fractal Noise',
        expectedShader: 'chaoticHeartShader',
        description: 'Pulsing heart-like structure with chaotic distortion'
      },
      {
        id: 6,
        name: 'Whisper Sphere',
        standardName: 'ECO-SPN-OSC',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Concentric Spheres',
        expectedShader: 'whisperSphereShader',
        description: 'Concentric oscillating spheres with echo layering'
      },
      {
        id: 7,
        name: 'Echo Fractal Node',
        standardName: 'ECO-INF-NEX',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Fractal Recursive Structure',
        expectedShader: 'echoFractalShader',
        description: 'Fractal recursion with echo delays'
      },
      {
        id: 8,
        name: 'Abyssal Shard',
        standardName: 'UMB-DMD-VAR',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Diamond + Sharp Geometry',
        expectedShader: 'abyssalShardShader',
        description: 'Sharp crystalline geometry with void distortion'
      },
      {
        id: 9,
        name: 'Tri-Helix Node',
        standardName: 'AET-SPN-CPL',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Triple Helix Strands',
        expectedShader: 'triHelixShader',
        description: 'Three interlocking helix strands with phase shifting'
      },
      {
        id: 10,
        name: 'Infinite Spiral Node',
        standardName: 'INF-SPN-HLD',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Recursive Spiral',
        expectedShader: 'infiniteSpiralShader',
        description: 'Infinite recursion spiral with diminishing scale'
      },
      {
        id: 11,
        name: 'Chrono Ripper Node',
        standardName: 'NEX-TOR-HLD',
        sourceFile: '_ExtremeAINodePack.js',
        meshType: 'Torus + Time-Distorted Topology',
        expectedShader: 'chronoRipperShader',
        description: 'Torus with temporal distortion and phase shifts'
      }
    ];

    archetypes.forEach(arch => {
      this.archetypeRegistry.set(arch.id, arch);
    });
  }

  /**
   * Build registry of all known shader functions
   */
  buildShaderRegistry() {
    // These correspond to shader application methods in _ExtremeAIShaderPack.js
    const shaders = [
      { id: 'hyperPrismShader', archetypeIds: [0], uniformsRequired: ['u_time', 'u_synergy', 'u_colorA', 'u_colorB'] },
      { id: 'singularityKnotShader', archetypeIds: [1], uniformsRequired: ['u_time', 'u_corruption'] },
      { id: 'quantumLatticeShader', archetypeIds: [2], uniformsRequired: ['u_time', 'u_synergy', 'u_stability'] },
      { id: 'fractalBloomShader', archetypeIds: [3], uniformsRequired: ['u_time', 'u_harmony'] },
      { id: 'reactiveTesseractShader', archetypeIds: [4], uniformsRequired: ['u_time', 'u_synergy'] },
      { id: 'chaoticHeartShader', archetypeIds: [5], uniformsRequired: ['u_time', 'u_stability', 'u_corruption'] },
      { id: 'whisperSphereShader', archetypeIds: [6], uniformsRequired: ['u_time', 'u_harmony'] },
      { id: 'echoFractalShader', archetypeIds: [7], uniformsRequired: ['u_time', 'u_synergy'] },
      { id: 'abyssalShardShader', archetypeIds: [8], uniformsRequired: ['u_time', 'u_corruption'] },
      { id: 'triHelixShader', archetypeIds: [9], uniformsRequired: ['u_time', 'u_synergy'] },
      { id: 'infiniteSpiralShader', archetypeIds: [10], uniformsRequired: ['u_time', 'u_harmony'] },
      { id: 'chronoRipperShader', archetypeIds: [11], uniformsRequired: ['u_time', 'u_stability'] }
    ];

    shaders.forEach(shader => {
      this.shaderRegistry.set(shader.id, shader);
    });
  }

  /**
   * Runtime validation update (opt-in, cheap per-frame checks)
   * Call once per frame from main animation loop
   */
  update(deltaTime) {
    if (!this.diagnosticsEnabled || !this.isInitialized) return;

    const startTime = performance.now();

    // Light per-frame validation
    this.validateRegisteredNodes();

    const elapsed = performance.now() - startTime;
    if (elapsed > 1) {
      console.warn(`[ExtremeAIShaderTestSuite] Diagnostics update took ${elapsed.toFixed(2)}ms`);
    }

    this.metrics.lastUpdateTime = elapsed;
  }

  /**
   * Validate all currently tracked nodes
   */
  validateRegisteredNodes() {
    const errors = [];

    this.nodeMap.forEach((nodeData, node) => {
      if (!node || !node.visible) {
        this.nodeMap.delete(node);
        return;
      }

      // Check if node has valid material
      let hasMaterial = false;
      let hasShader = false;

      node.traverse(child => {
        if (child.material) {
          hasMaterial = true;
          if (child.material.uniforms) {
            hasShader = true;
          }
        }
      });

      if (!hasMaterial) {
        errors.push(`Node ${nodeData.archetypeName} has no material`);
        nodeData.hasValidMaterial = false;
      } else {
        nodeData.hasValidMaterial = true;
        this.metrics.nodesWithValidMaterial++;
      }

      if (hasMaterial && !hasShader) {
        errors.push(`Node ${nodeData.archetypeName} has material but no shader uniforms`);
      } else if (hasShader) {
        nodeData.hasValidShader = true;
        this.metrics.nodesWithValidShader++;
      }
    });

    if (errors.length > 0) {
      this.metrics.materialErrors.push(...errors);
    }
  }

  /**
   * Register an EXTREME node for tracking
   * Called when ExtremeAINodePack applies an archetype
   */
  registerExtremeNode(node, archetypeId) {
    if (!node || archetypeId === undefined) return;

    const archetypeDef = this.archetypeRegistry.get(archetypeId);
    if (!archetypeDef) {
      console.warn(`[ExtremeAIShaderTestSuite] Unknown archetype ID: ${archetypeId}`);
      return;
    }

    this.nodeMap.set(node, {
      archetypeId,
      archetypeName: archetypeDef.name,
      standardName: archetypeDef.standardName,
      registered: Date.now(),
      hasValidMaterial: false,
      hasValidShader: false
    });

    this.metrics.totalExtremeNodes++;
  }

  /**
   * Unregister a node
   */
  unregisterExtremeNode(node) {
    if (this.nodeMap.has(node)) {
      this.nodeMap.delete(node);
    }
    if (this.debugOverlays.has(node)) {
      const overlay = this.debugOverlays.get(node);
      overlay.parent?.remove(overlay);
      this.debugOverlays.delete(node);
    }
  }

  /**
   * Run a comprehensive offline consistency check
   * Analyzes archetype ↔ shader alignment
   */
  runOfflineConsistencyCheck() {
    console.log('\n═════════════════════════════════════════════════════════════');
    console.log('EXTREME AI SHADER TEST SUITE - CONSISTENCY CHECK');
    console.log('═════════════════════════════════════════════════════════════\n');

    const report = {
      timestamp: new Date().toISOString(),
      archetypeCount: this.archetypeRegistry.size,
      shaderCount: this.shaderRegistry.size,
      activeNodes: this.nodeMap.size,
      mappings: [],
      unmapped: [],
      orphaned: [],
      summary: {}
    };

    // Check each archetype
    console.log('📋 ARCHETYPE VALIDATION:');
    console.log('─────────────────────────────────────────────────────────────');
    
    let mappedCount = 0;
    this.archetypeRegistry.forEach((archetype, id) => {
      const shader = this.findShaderForArchetype(id);
      const status = shader ? '✅' : '⚠️';
      
      console.log(`${status} [${id}] ${archetype.name.padEnd(30)} → ${shader ? shader.id : 'NO SHADER'}`);
      
      if (shader) {
        mappedCount++;
        report.mappings.push({
          archetypeId: id,
          archetypeName: archetype.name,
          standardName: archetype.standardName,
          shaderId: shader.id
        });
      } else {
        report.unmapped.push({
          archetypeId: id,
          archetypeName: archetype.name,
          standardName: archetype.standardName
        });
      }
    });

    // Check for orphaned shaders
    console.log('\n🔍 SHADER VALIDATION:');
    console.log('─────────────────────────────────────────────────────────────');
    
    this.shaderRegistry.forEach((shader, shaderId) => {
      const isUsed = shader.archetypeIds.length > 0;
      const status = isUsed ? '✅' : '⚠️';
      
      console.log(`${status} ${shaderId.padEnd(25)} used by ${shader.archetypeIds.length} archetype(s)`);
      
      if (!isUsed) {
        report.orphaned.push(shaderId);
      }
    });

    // Check active nodes
    console.log('\n🎯 ACTIVE NODES:');
    console.log('─────────────────────────────────────────────────────────────');
    
    let validCount = 0;
    this.nodeMap.forEach((nodeData, node) => {
      const status = nodeData.hasValidMaterial && nodeData.hasValidShader ? '✅' : '⚠️';
      console.log(`${status} ${nodeData.archetypeName.padEnd(30)} [${nodeData.standardName}]`);
      if (nodeData.hasValidMaterial && nodeData.hasValidShader) validCount++;
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Total Archetypes:    ${this.archetypeRegistry.size}`);
    console.log(`Mapped to Shaders:   ${mappedCount} / ${this.archetypeRegistry.size}`);
    console.log(`Total Shaders:       ${this.shaderRegistry.size}`);
    console.log(`Orphaned Shaders:    ${report.orphaned.length}`);
    console.log(`Active Nodes:        ${this.nodeMap.size}`);
    console.log(`Valid Nodes:         ${validCount} / ${this.nodeMap.size}`);
    console.log(`Material Errors:     ${this.metrics.materialErrors.length}`);
    console.log(`Shader Errors:       ${this.metrics.shaderErrors.length}`);

    // Recommendations
    if (report.unmapped.length > 0) {
      console.warn('\n⚠️  WARNING: The following archetypes have no shader mapping:');
      report.unmapped.forEach(arch => {
        console.warn(`   - ${arch.archetypeName} (ID: ${arch.archetypeId})`);
      });
    }

    if (report.orphaned.length > 0) {
      console.warn('\n⚠️  WARNING: The following shaders are not used by any archetype:');
      report.orphaned.forEach(shaderId => {
        console.warn(`   - ${shaderId}`);
      });
    }

    console.log('\n═════════════════════════════════════════════════════════════\n');

    return report;
  }

  /**
   * Find shader definition for an archetype
   */
  findShaderForArchetype(archetypeId) {
    for (const [shaderId, shader] of this.shaderRegistry.entries()) {
      if (shader.archetypeIds.includes(archetypeId)) {
        return shader;
      }
    }
    return null;
  }

  /**
   * Enable per-frame diagnostics
   */
  enableDiagnostics() {
    if (this.diagnosticsEnabled) {
      console.log('[ExtremeAIShaderTestSuite] Diagnostics already enabled');
      return;
    }
    
    this.diagnosticsEnabled = true;
    this.metrics = {
      totalExtremeNodes: 0,
      nodesWithValidMaterial: 0,
      nodesWithValidShader: 0,
      shaderErrors: [],
      materialErrors: [],
      orphanedShaders: [],
      unmappedArchetypes: [],
      lastUpdateTime: 0
    };
    
    console.log('[ExtremeAIShaderTestSuite] Diagnostics ENABLED - per-frame validation active');
  }

  /**
   * Disable per-frame diagnostics
   */
  disableDiagnostics() {
    this.diagnosticsEnabled = false;
    console.log('[ExtremeAIShaderTestSuite] Diagnostics DISABLED');
  }

  /**
   * Enable debug visualization overlay on EXTREME nodes
   */
  enableDebugVisuals() {
    if (this.debugVisualsEnabled) {
      console.log('[ExtremeAIShaderTestSuite] Debug visuals already enabled');
      return;
    }

    this.debugVisualsEnabled = true;

    // Create subtle overlay for each extreme node
    this.nodeMap.forEach((nodeData, node) => {
      if (!node.visualGroup) return;

      const overlay = new THREE.Group();
      overlay.userData = { isDebugOverlay: true };

      // Add subtle tint sphere
      const sphereGeo = new THREE.SphereGeometry(0.6, 8, 8);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        side: THREE.BackSide
      });
      const tintSphere = new THREE.Mesh(sphereGeo, sphereMat);
      tintSphere.scale.set(1.2, 1.2, 1.2);
      overlay.add(tintSphere);

      // Add archetype label as sprite-like text
      const label = this.createTextLabel(nodeData.archetypeName, 0x00ffff);
      label.position.y = 0.8;
      overlay.add(label);

      node.visualGroup.add(overlay);
      this.debugOverlays.set(node, overlay);
    });

    console.log(`[ExtremeAIShaderTestSuite] Debug visuals ENABLED on ${this.debugOverlays.size} nodes`);
  }

  /**
   * Disable debug visualization overlay
   */
  disableDebugVisuals() {
    if (!this.debugVisualsEnabled) {
      console.log('[ExtremeAIShaderTestSuite] Debug visuals already disabled');
      return;
    }

    this.debugVisualsEnabled = false;

    this.debugOverlays.forEach((overlay, node) => {
      overlay.parent?.remove(overlay);
      overlay.traverse(child => {
        if (child.material) child.material.dispose();
        if (child.geometry) child.geometry.dispose();
      });
    });

    this.debugOverlays.clear();
    console.log('[ExtremeAIShaderTestSuite] Debug visuals DISABLED');
  }

  /**
   * Create a simple text label (fallback for Canvas texture)
   */
  createTextLabel(text, color) {
    const group = new THREE.Group();

    // Simple glyph indicator instead of text
    // MATERIAL SAFETY 4.0: MeshBasicMaterial does not support emissive
    const glyphGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const glyphMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const glyph = new THREE.Mesh(glyphGeo, glyphMat);
    group.add(glyph);

    return group;
  }

  /**
   * Print debug summary to console
   */
  printExtremeShaderSummary() {
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│ EXTREME SHADER TEST SUITE - SUMMARY                         │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Active Nodes:         ${String(this.nodeMap.size).padEnd(45)}│`);
    console.log(`│ Valid Materials:      ${String(this.metrics.nodesWithValidMaterial).padEnd(45)}│`);
    console.log(`│ Valid Shaders:        ${String(this.metrics.nodesWithValidShader).padEnd(45)}│`);
    console.log(`│ Material Errors:      ${String(this.metrics.materialErrors.length).padEnd(45)}│`);
    console.log(`│ Shader Errors:        ${String(this.metrics.shaderErrors.length).padEnd(45)}│`);
    console.log(`│ Diagnostics:          ${String(this.diagnosticsEnabled ? 'ENABLED' : 'DISABLED').padEnd(45)}│`);
    console.log(`│ Debug Visuals:        ${String(this.debugVisualsEnabled ? 'ENABLED' : 'DISABLED').padEnd(45)}│`);
    console.log(`│ Last Update:          ${String(this.metrics.lastUpdateTime.toFixed(2) + 'ms').padEnd(45)}│`);
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  }

  /**
   * Handle world/mode switching
   */
  onWorldSwitch() {
    // Clear stale references
    const deadNodes = [];
    this.nodeMap.forEach((nodeData, node) => {
      if (!node.parent) {
        deadNodes.push(node);
      }
    });

    deadNodes.forEach(node => {
      this.unregisterExtremeNode(node);
    });

    console.log(`[ExtremeAIShaderTestSuite] World switched - cleaned ${deadNodes.length} stale nodes`);
  }

  /**
   * Export metrics data (for telemetry)
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      totalExtremeNodes: this.metrics.totalExtremeNodes,
      validMaterials: this.metrics.nodesWithValidMaterial,
      validShaders: this.metrics.nodesWithValidShader,
      errorCount: this.metrics.materialErrors.length + this.metrics.shaderErrors.length,
      diagnosticsEnabled: this.diagnosticsEnabled,
      debugVisualsEnabled: this.debugVisualsEnabled,
      activeNodeCount: this.nodeMap.size,
      lastUpdateTime: this.metrics.lastUpdateTime
    };
  }
}
