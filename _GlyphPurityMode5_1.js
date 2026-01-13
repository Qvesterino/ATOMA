/**
 * GLYPH PURITY MODE 5.1 — MINIMAL ATMOSPHERIC GLYPHS
 * 
 * Enforces absolute visual purity:
 * - ONLY designed glyphs from our custom library
 * - NO fallback shapes, NO debug primitives, NO auto-geometry
 * - NO hexagons, NO squares, NO cones unless explicitly defined
 * - If node has no defined glyph → displays nothing (silence is elegant)
 * 
 * STRICT SAFETY:
 * - NO modifications to createNode(), updateNode(), AINodes.js
 * - NO gameplay/physics changes
 * - NO node lifecycle modifications
 * - Pure visual enforcement layer
 * - < 0.5ms per update cost
 * 
 * PURITY LEVELS:
 * 0 = OFF (legacy behavior allowed)
 * 1 = MODERATE (warn on fallbacks, still display)
 * 2 = STRICT (remove fallbacks silently)
 * 3 = PURE (ONLY designed glyphs, nothing else)
 * 
 * DEFAULT: PURE (level 3)
 */

import * as THREE from 'three';

export class GlyphPurityMode5_1 {
  constructor(scene) {
    this.scene = scene;
    
    // Purity enforcement level
    this.purityLevel = 3; // PURE mode by default
    
    // Purity flags
    this.enabled = true;
    this.autoCleanup = true;
    this.validateOnAttach = true;
    
    // Statistics
    this.stats = {
      fallbacksDetected: 0,
      fallbacksRemoved: 0,
      unauthorizedShapes: 0,
      unknownGlyphsEncountered: 0,
      lastPurityCheckTime: 0,
      totalChecksRun: 0
    };
    
    // List of approved glyph components (ONLY these are allowed)
    this.approvedComponents = new Set([
      // Consciousness glyphs
      'consciousnessHex',
      'consciousnessCore',
      
      // Evolution glyphs
      'evolutionDiamond',
      'evolutionSquares',
      'evoPrism',
      
      // Personality glyphs
      'personalityMarker',
      'harmonyLotus',
      'corruptionTorus',
      'instabilityTetra',
      'clarityOctahedron',
      'synergyIco',
      
      // State glyphs
      'ascendedRing',
      'mythicTri',
      'ritualEclipse',
      'clusterWeb',
      
      // Procedural glyphs
      'proceduralConsciousness',
      'proceduralInstability',
      'proceduralSynergy',
      'proceduralCorruption',
      'proceduralHarmony',
      
      // Core glyphs
      'coreMarker',
      'evolutionRing',
      
      // Link flow packets
      'linkPacket',
      'packetMesh',
      
      // Semantic glyphs
      'semanticMeaning',
      
      // Fusion components
      'glyphFusion',
      'fusionLayer'
    ]);
    
    // List of FORBIDDEN shapes (auto-removed on detection)
    this.forbiddenPatterns = [
      /hex/i,
      /hexagon/i,
      /fallback/i,
      /legacy/i,
      /debug/i,
      /cone/i,
      /primitive/i,
      /placeholder/i,
      /temporary/i,
      /auto.?shape/i
    ];
    
    // Forbidden userData flags
    this.forbiddenFlags = [
      'isFallback',
      'isPlaceholder',
      'isDebug',
      'isLegacy',
      'isAuto',
      'isTemporary',
      'noDelete'
    ];
    
    console.log('✓ Glyph Purity Mode 5.1 initialized (PURE mode)');
  }

  /**
   * Check if a mesh component is authorized
   */
  isAuthorizedComponent(mesh) {
    if (!mesh || !mesh.userData) return false;
    
    const component = mesh.userData.glyphComponent;
    if (!component) return false;
    
    return this.approvedComponents.has(component);
  }

  /**
   * Check if a mesh name matches forbidden patterns
   */
  isForbiddenMesh(mesh) {
    if (!mesh) return false;
    
    // Check name patterns
    const meshName = mesh.name || '';
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(meshName)) {
        return true;
      }
    }
    
    // Check userData flags
    if (mesh.userData) {
      for (const flag of this.forbiddenFlags) {
        if (mesh.userData[flag] === true) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Safely dispose mesh resources
   */
  disposeMesh(mesh) {
    if (!mesh) return;
    
    try {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            if (mat && mat.dispose) mat.dispose();
          });
        } else {
          if (mesh.material.dispose) mesh.material.dispose();
        }
      }
    } catch (error) {
      if (this.purityLevel >= 2) {
        console.warn(`⚠ Error disposing mesh ${mesh.name}:`, error);
      }
    }
  }

  /**
   * MAIN: Purify scene by removing all unauthorized glyphs
   * Returns count of removed meshes
   */
  purifyScene() {
    if (!this.enabled) return 0;
    
    const startTime = performance.now();
    const toRemove = [];
    let unauthorizedCount = 0;
    let fallbackCount = 0;
    
    // Traverse scene to find forbidden meshes
    this.scene.traverse((child) => {
      // Skip system objects
      if (!child.userData || child.userData.isSystemObject) return;
      if (child instanceof THREE.Camera || child instanceof THREE.Light) return;
      
      // Check if mesh is forbidden
      if (this.isForbiddenMesh(child)) {
        toRemove.push(child);
        fallbackCount++;
        return;
      }
      
      // If purity is PURE, ONLY allow approved components
      if (this.purityLevel === 3) {
        // Skip groups and empty objects (they're containers)
        if (child.children && child.children.length > 0) {
          return;
        }
        
        // If it's a mesh without approved component → remove it
        if (child.isMesh && !this.isAuthorizedComponent(child)) {
          toRemove.push(child);
          unauthorizedCount++;
        }
      }
    });
    
    // Remove all unauthorized meshes
    toRemove.forEach((mesh) => {
      try {
        // Dispose resources
        this.disposeMesh(mesh);
        
        // Remove from scene
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        
        this.stats.fallbacksRemoved++;
        
        if (this.purityLevel >= 1) {
          console.log(`🧹 Removed unauthorized glyph: ${mesh.name}`);
        }
        
      } catch (error) {
        console.warn(`⚠ Error removing mesh ${mesh.name}:`, error);
      }
    });
    
    const elapsed = performance.now() - startTime;
    this.stats.lastPurityCheckTime = elapsed;
    this.stats.fallbacksDetected += fallbackCount;
    this.stats.unauthorizedShapes += unauthorizedCount;
    this.stats.totalChecksRun++;
    
    return toRemove.length;
  }

  /**
   * Validate a glyph attachment before it happens
   * Returns true if glyph should be allowed
   */
  validateGlyphAttachment(glyphGroup) {
    if (!this.validateOnAttach || this.purityLevel < 2) return true;
    
    if (!glyphGroup || !glyphGroup.userData) return false;
    
    // Check if glyph has an approved component
    let hasApprovedComponent = false;
    
    glyphGroup.traverse((child) => {
      if (child.userData && this.isAuthorizedComponent(child)) {
        hasApprovedComponent = true;
      }
    });
    
    if (!hasApprovedComponent && this.purityLevel === 3) {
      this.stats.unknownGlyphsEncountered++;
      
      if (this.purityLevel >= 2) {
        console.warn(`⚠ Attempting to attach glyph without approved components: ${glyphGroup.name}`);
      }
      
      return false;
    }
    
    return true;
  }

  /**
   * Set purity level (0-3)
   */
  setPurityLevel(level) {
    if (level < 0 || level > 3) {
      console.warn(`⚠ Invalid purity level: ${level}. Valid range: 0-3`);
      return;
    }
    
    this.purityLevel = level;
    
    const levelNames = ['OFF', 'MODERATE', 'STRICT', 'PURE'];
    console.log(`✓ Purity Mode set to ${levelNames[level]} (level ${level})`);
    
    // Auto-purify on level increase
    if (level > 0) {
      const removed = this.purifyScene();
      if (removed > 0) {
        console.log(`✓ Purification pass removed ${removed} unauthorized glyphs`);
      }
    }
  }

  /**
   * Enable/disable purity enforcement
   */
  setPurityEnabled(enabled) {
    this.enabled = enabled;
    console.log(`✓ Glyph Purity Mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get comprehensive purity report
   */
  getPurityReport() {
    return {
      enabled: this.enabled,
      purityLevel: this.purityLevel,
      levelName: ['OFF', 'MODERATE', 'STRICT', 'PURE'][this.purityLevel],
      stats: { ...this.stats },
      totalUnauthorized: this.stats.unauthorizedShapes + this.stats.unknownGlyphsEncountered
    };
  }

  /**
   * Print detailed purity report
   */
  printPurityReport() {
    const report = this.getPurityReport();
    
    console.group('🎨 Glyph Purity Mode 5.1 Report');
    console.log(`Status: ${report.enabled ? '✓ ENABLED' : '✗ DISABLED'}`);
    console.log(`Purity Level: ${report.levelName} (${report.purityLevel})`);
    console.log('Statistics:');
    console.log(`  Fallbacks Detected: ${report.stats.fallbacksDetected}`);
    console.log(`  Fallbacks Removed: ${report.stats.fallbacksRemoved}`);
    console.log(`  Unauthorized Shapes: ${report.stats.unauthorizedShapes}`);
    console.log(`  Unknown Glyphs: ${report.stats.unknownGlyphsEncountered}`);
    console.log(`  Total Checks: ${report.stats.totalChecksRun}`);
    console.log(`  Last Check Time: ${report.stats.lastPurityCheckTime.toFixed(2)}ms`);
    console.log(`  Total Unauthorized: ${report.totalUnauthorized}`);
    console.groupEnd();
  }

  /**
   * List all approved glyph components
   */
  printApprovedComponents() {
    console.group('✓ Approved Glyph Components');
    const components = Array.from(this.approvedComponents).sort();
    components.forEach(comp => {
      console.log(`  • ${comp}`);
    });
    console.log(`Total: ${components.length} approved components`);
    console.groupEnd();
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      fallbacksDetected: 0,
      fallbacksRemoved: 0,
      unauthorizedShapes: 0,
      unknownGlyphsEncountered: 0,
      lastPurityCheckTime: 0,
      totalChecksRun: 0
    };
  }

  /**
   * Validate entire scene integrity
   */
  validateSceneIntegrity() {
    const issues = [];
    let validGlyphCount = 0;
    let invalidGlyphCount = 0;
    
    this.scene.traverse((child) => {
      if (!child.userData || child.userData.isSystemObject) return;
      if (child instanceof THREE.Camera || child instanceof THREE.Light) return;
      
      if (child.isMesh) {
        if (this.isForbiddenMesh(child)) {
          issues.push(`FORBIDDEN: ${child.name}`);
          invalidGlyphCount++;
        } else if (this.isAuthorizedComponent(child)) {
          validGlyphCount++;
        } else if (this.purityLevel === 3) {
          issues.push(`UNAUTHORIZED: ${child.name}`);
          invalidGlyphCount++;
        }
      }
    });
    
    return {
      valid: validGlyphCount,
      invalid: invalidGlyphCount,
      issues: issues,
      isPure: invalidGlyphCount === 0
    };
  }

  /**
   * Print scene integrity validation
   */
  printIntegrityReport() {
    const report = this.validateSceneIntegrity();
    
    console.group('🔍 Scene Integrity Report');
    console.log(`Valid Glyphs: ${report.valid}`);
    console.log(`Invalid Glyphs: ${report.invalid}`);
    console.log(`Scene is Pure: ${report.isPure ? '✓ YES' : '✗ NO'}`);
    
    if (report.issues.length > 0) {
      console.log('Issues Found:');
      report.issues.forEach(issue => {
        console.log(`  ⚠ ${issue}`);
      });
    }
    console.groupEnd();
  }
}
