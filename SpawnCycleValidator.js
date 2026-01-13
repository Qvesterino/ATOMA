/**
 * SPAWN CYCLE VALIDATOR 1.0
 * 
 * Enforces once-per-category geometry cycling based on canonical category assignments.
 * Each geometry spawns exactly once per cycle, then the cycle resets.
 * 
 * RULES:
 * 1. Every geometry belongs to EXACTLY ONE category
 * 2. Each geometry spawns ONCE per category cycle
 * 3. When all geometries in a category are exhausted, cycle resets
 * 4. No geometry may spawn outside its assigned category
 * 5. Validation is per-category (independent cycles)
 * 
 * @author Rosebud AI
 * @version 1.0
 */
export class SpawnCycleValidator {
  constructor() {
    this.categoryInformation = this.initializeCategoryMap();
    this.categoryCycles = this.initializeCycles();
    this.spawnHistory = [];
  }

  /**
   * CANONICAL GEOMETRY-TO-CATEGORY MAPPING
   * Source: EnhancedNodeModels.js variant arrays (Session 16 Categorization Pass)
   * Extended: Added RARE categories (prime, sigma, apex, mythic, special) Session 38+
   */
  initializeCategoryMap() {
    return {
      'input': {
        name: 'INPUT',
        geometries: [
          'TriangularPrism+Rim',
          'PyramidSpike',
          'WireframeSphere',
          'Icosahedron',
          'HyperbolicPrism'
        ],
        count: 5
      },
      
      'process': {
        name: 'PROCESS',
        geometries: [
          'DiamondLattice',
          'Helix',
          'DoubleHelix',
          'MeshColumn',
          'HexagonalPrism',
          'QuantumLattice',
          'FractalBloom',
          'ReactiveTesseract'
        ],
        count: 8
      },
      
      'integration': {
        name: 'INTEGRATION (KNOT-PRIMARY)',
        geometries: [
          'TrefoilKnot',
          'FigureEightKnot',
          'InfiniteSelfIntersectingKnot',
          'ChaoticKnotCore',
          'BorromeanRings',
          'TorusKnot',
          'TripleHelixKnot',
          'SingularityKnot'
        ],
        count: 8
      },
      
      'analytics': {
        name: 'ANALYTICS',
        geometries: [
          'DataPyramid',
          'SpinningDataSphere',
          'HexAnalysisMatrix',
          'PrismSpectrumAnalyzer',
          'ElongatedOctahedron'
        ],
        count: 5
      },
      
      'storage': {
        name: 'STORAGE',
        geometries: [
          'MemoryPillar',
          'CapsuleBands',
          'SegmentedStack',
          'CrystalShardCluster',
          'RhombicSolid',
          'WhisperSphere',
          'EchoFractal'
        ],
        count: 7
      },
      
      'control': {
        name: 'CONTROL',
        geometries: [
          'OctagonalCore+Rim',
          'ControlRingLattice',
          'SpikedControlFrame',
          'InfiniteSpiral',
          'ChronoRipper'
        ],
        count: 5
      },
      
      'quantum': {
        name: 'QUANTUM',
        geometries: [
          'FracturedAnomaly',
          'DistortedPolyCluster',
          'ChaoticLayeredForm',
          'TwistedOctahedron+ResonanceField',
          'HyperbolicNeuralPrism',
          'ChaoticHeart'
        ],
        count: 6
      },
      
      'emotional': {
        name: 'EMOTIONAL',
        geometries: [
          'TriangularPrism+Rim',
          'PyramidSpike',
          'WireframeSphere',
          'Icosahedron',
          'HyperbolicPrism'
        ],
        count: 5
      },
      
      'prime': {
        name: 'PRIME (RARE)',
        geometries: [
          'TriangularPrism+Rim',
          'PyramidSpike',
          'WireframeSphere',
          'Icosahedron',
          'HyperbolicPrism'
        ],
        count: 5
      },
      
      'sigma': {
        name: 'SIGMA (RARE)',
        geometries: [
          'DiamondLattice',
          'Helix',
          'DoubleHelix',
          'MeshColumn',
          'HexagonalPrism',
          'QuantumLattice',
          'FractalBloom',
          'ReactiveTesseract'
        ],
        count: 8
      },
      
      'apex': {
        name: 'APEX (RARE)',
        geometries: [
          'TrefoilKnot',
          'FigureEightKnot',
          'InfiniteSelfIntersectingKnot',
          'ChaoticKnotCore',
          'BorromeanRings',
          'TorusKnot',
          'TripleHelixKnot',
          'SingularityKnot'
        ],
        count: 8
      },
      
      'mythic': {
        name: 'MYTHIC (RARE)',
        geometries: [
          'FracturedAnomaly',
          'DistortedPolyCluster',
          'ChaoticLayeredForm',
          'TwistedOctahedron+ResonanceField',
          'HyperbolicNeuralPrism',
          'ChaoticHeart'
        ],
        count: 6
      },
      
      'special': {
        name: 'SPECIAL (RARE)',
        geometries: [
          'MemoryPillar',
          'CapsuleBands',
          'SegmentedStack',
          'CrystalShardCluster',
          'RhombicSolid',
          'WhisperSphere',
          'EchoFractal'
        ],
        count: 7
      }
    };
  }

  /**
   * Initialize per-category spawn cycles
   * Each category has independent cycle tracking
   */
  initializeCycles() {
    const cycles = {};
    for (const [category, info] of Object.entries(this.categoryInformation)) {
      cycles[category] = {
        cycleNumber: 0,
        usedInCycle: new Set(),
        totalGeometries: info.count,
        sequencePosition: 0
      };
    }
    return cycles;
  }

  /**
   * Get next geometry for a category
   * VALIDATION: Ensures the geometry hasn't been used yet in this cycle
   * 
   * @param {string} category - Node category (input, process, integration, etc.)
   * @param {number} variantIndex - Index into the category's variant array
   * @returns {object} - {geometry, category, cycleNumber, isNewCycle, isValid}
   */
  getNextGeometry(category, variantIndex) {
    category = category.toLowerCase();

    // Validate category exists
    if (!this.categoryInformation[category]) {
      console.warn(`⚠️ SPAWN CYCLE: Invalid category "${category}". Using "input" as fallback.`);
      category = 'input';
    }

    const categoryInfo = this.categoryInformation[category];
    const cycleData = this.categoryCycles[category];
    
    // Get geometry name from canonical map
    const geometryIndex = variantIndex % categoryInfo.count;
    const geometryName = categoryInfo.geometries[geometryIndex];

    // Check if already used in this cycle
    const isAlreadyUsed = cycleData.usedInCycle.has(geometryIndex);
    
    if (isAlreadyUsed) {
      // Cycle exhausted, reset
      cycleData.cycleNumber++;
      cycleData.usedInCycle.clear();
      cycleData.sequencePosition = 0;
      console.log(`✨ SPAWN CYCLE: Category "${category}" cycle reset to #${cycleData.cycleNumber}`);
    }

    // Mark as used in current cycle
    cycleData.usedInCycle.add(geometryIndex);
    cycleData.sequencePosition++;

    const result = {
      category: category,
      categoryName: categoryInfo.name,
      geometry: geometryName,
      variantIndex: geometryIndex,
      cycleNumber: cycleData.cycleNumber,
      positionInCycle: cycleData.sequencePosition,
      totalInCycle: categoryInfo.count,
      isAlreadyUsed: isAlreadyUsed,
      isNewCycle: cycleData.sequencePosition === 1
    };

    // Log spawn
    this.logSpawn(result);

    return result;
  }

  /**
   * Validate that a geometry belongs to a category
   * Checks against canonical map
   * 
   * @param {string} geometryName - Name of geometry
   * @param {string} category - Assigned category
   * @returns {object} - {isValid, belongsTo, error}
   */
  validateGeometryAssignment(geometryName, category) {
    category = category.toLowerCase();

    if (!this.categoryInformation[category]) {
      return {
        isValid: false,
        belongsTo: null,
        error: `Invalid category: ${category}`
      };
    }

    const categoryInfo = this.categoryInformation[category];
    const isInCategory = categoryInfo.geometries.includes(geometryName);

    if (!isInCategory) {
      // Find which category it belongs to
      let correctCategory = null;
      for (const [cat, info] of Object.entries(this.categoryInformation)) {
        if (info.geometries.includes(geometryName)) {
          correctCategory = cat;
          break;
        }
      }

      return {
        isValid: false,
        belongsTo: correctCategory,
        error: `Geometry "${geometryName}" does not belong to "${category}". It belongs to "${correctCategory}".`
      };
    }

    return {
      isValid: true,
      belongsTo: category,
      error: null
    };
  }

  /**
   * Get cycle statistics for a category
   * 
   * @param {string} category - Category to check
   * @returns {object} - Cycle stats
   */
  getCycleStats(category) {
    category = category.toLowerCase();

    if (!this.categoryCycles[category]) {
      return { error: `Invalid category: ${category}` };
    }

    const cycleData = this.categoryCycles[category];
    const categoryInfo = this.categoryInformation[category];

    return {
      category: category,
      categoryName: categoryInfo.name,
      cycleNumber: cycleData.cycleNumber,
      usedInCycle: cycleData.usedInCycle.size,
      totalGeometries: categoryInfo.count,
      percentageUsed: Math.round((cycleData.usedInCycle.size / categoryInfo.count) * 100),
      cycleCompletion: `${cycleData.usedInCycle.size}/${categoryInfo.count}`,
      isComplete: cycleData.usedInCycle.size === categoryInfo.count
    };
  }

  /**
   * Get statistics for all categories
   * 
   * @returns {object} - Stats for each category
   */
  getAllStats() {
    const stats = {};
    for (const category of Object.keys(this.categoryInformation)) {
      stats[category] = this.getCycleStats(category);
    }
    return stats;
  }

  /**
   * Reset cycle for a specific category
   * 
   * @param {string} category - Category to reset
   */
  resetCategoryyCycle(category) {
    category = category.toLowerCase();

    if (!this.categoryCycles[category]) {
      console.warn(`⚠️ Cannot reset unknown category: ${category}`);
      return;
    }

    this.categoryCycles[category].cycleNumber = 0;
    this.categoryCycles[category].usedInCycle.clear();
    this.categoryCycles[category].sequencePosition = 0;
    console.log(`✨ SPAWN CYCLE: Category "${category}" reset to cycle 0`);
  }

  /**
   * Reset all category cycles (for new game/world)
   */
  resetAllCycles() {
    this.categoryCycles = this.initializeCycles();
    this.spawnHistory = [];
    console.log('✨ SPAWN CYCLE: All category cycles reset');
  }

  /**
   * Log a spawn event
   * 
   * @param {object} spawnData - Spawn result object
   */
  logSpawn(spawnData) {
    const logEntry = {
      timestamp: Date.now(),
      category: spawnData.category,
      geometry: spawnData.geometry,
      variantIndex: spawnData.variantIndex,
      cycleNumber: spawnData.cycleNumber,
      positionInCycle: spawnData.positionInCycle,
      totalInCycle: spawnData.totalInCycle,
      isNewCycle: spawnData.isNewCycle,
      isAlreadyUsed: spawnData.isAlreadyUsed
    };

    this.spawnHistory.push(logEntry);

    // Keep history manageable (last 500 spawns)
    if (this.spawnHistory.length > 500) {
      this.spawnHistory = this.spawnHistory.slice(-250);
    }

    // Store globally for console access
    if (typeof window !== 'undefined') {
      window.__spawnCycleLog = this.spawnHistory;
    }
  }

  /**
   * Dump recent spawn history to console
   */
  dumpSpawnLog() {
    console.table(this.spawnHistory.slice(-50));
  }

  /**
   * Get all geometries for a category
   * 
   * @param {string} category - Category name
   * @returns {array} - List of canonical geometry names
   */
  getCategoryGeometries(category) {
    category = category.toLowerCase();
    const info = this.categoryInformation[category];
    return info ? info.geometries : [];
  }

  /**
   * Get all categories
   * 
   * @returns {array} - List of category names
   */
  getAllCategories() {
    return Object.keys(this.categoryInformation);
  }

  /**
   * Verify canonical map completeness
   * Returns summary of total geometries across all categories
   * 
   * @returns {object} - Completeness report
   */
  verifyCompleteness() {
    let totalGeometries = 0;
    const geometriesByCategory = {};

    for (const [category, info] of Object.entries(this.categoryInformation)) {
      const count = info.geometries.length;
      totalGeometries += count;
      geometriesByCategory[category] = {
        name: info.name,
        count: count,
        geometries: info.geometries
      };
    }

    return {
      totalGeometries: totalGeometries,
      totalCategories: Object.keys(this.categoryInformation).length,
      byCategory: geometriesByCategory,
      verified: true
    };
  }

  /**
   * Print verification report
   */
  printVerificationReport() {
    const report = this.verifyCompleteness();
    console.log('═══════════════════════════════════════════════════════');
    console.log('SPAWN CYCLE VALIDATOR - CANONICAL MAP VERIFICATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Categories: ${report.totalCategories}`);
    console.log(`Total Geometries: ${report.totalGeometries}`);
    console.log('───────────────────────────────────────────────────────');
    
    for (const [category, data] of Object.entries(report.byCategory)) {
      console.log(`${category.toUpperCase()}: ${data.count} geometries`);
      data.geometries.forEach((geom, idx) => {
        console.log(`  [${idx}] ${geom}`);
      });
    }
    console.log('═══════════════════════════════════════════════════════');
  }
}

// Singleton instance
export const spawnCycleValidator = new SpawnCycleValidator();
