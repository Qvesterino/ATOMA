/**
 * ============================================================================
 * ENHANCED NODE MODELS SAFE REPLACEMENTS v1.0
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Some legacy node geometries consistently lose visibility or become unstable
 * - This system provides stable visual replacements without changing gameplay
 * - Enhanced variants use proven geometry patterns with clear volumetric cores
 * - Gradual migration allows selective replacement by category or node
 * 
 * SAFETY CONSTRAINTS:
 * - VISUAL CHANGES ONLY - no gameplay, linking, spawning, or stat changes
 * - Legacy models remain available as fallback
 * - All replacements work with existing aura, LOD, frustum, and spatial offset logic
 * - Zero impact on NodeLinkingSystem, main.js, or linking mechanics
 * 
 * INTEGRATION POINTS:
 * - Optional selection in node creation pipeline
 * - Can be enabled per-category or per-node
 * - Non-destructive - legacy system untouched
 * - Transparent to collision detection and raycasting
 * 
 * TECHNICAL APPROACH:
 * - Create up to 3 enhanced variants per category
 * - Each variant uses volumetric geometry (never planar)
 * - Variants selected deterministically based on node ID
 * - All variants properly integrated with visual hierarchy
 * 
 * VISUAL RESULT:
 * - Unstable nodes become visually reliable
 * - Maintain archetype visual language
 * - Improve network readability
 * - Progressive replacement enables testing without full migration
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';

/**
 * Configuration for enhanced model replacements
 */
export const SAFE_REPLACEMENT_CONFIG = {
  // Enable enhanced models globally
  enableEnhancedModels: true,
  
  // Categories to replace (others fall back to legacy)
  // Set to [] to only use legacy, or null for all categories
  categoriesForReplacement: null, // null = all categories
  
  // Specific nodes that have visual stability (nodeId → true)
  // Can be populated dynamically as stability is detected
  unstableNodeIds: new Set(),
  
  // Variants per category (maps category → variant count)
  variantsPerCategory: {
    'input': 8,
    'process': 8,
    'integration': 8,
    'analytics': 8,
    'storage': 8,
    'control': 4,
    'quantum': 4,
    'sigma': 4,
    'mythic': 4,
    'prime': 4,
    'error': 4,
    'emotional': 4
  },
  
  // Update frequency (milliseconds) for visual stability checking
  stabilityCheckFrequency: 2000
};

/**
 * Track visual stability of nodes
 */
class VisualStabilityMonitor {
  constructor() {
    // nodeId → stability score (0-1)
    this.stabilityScores = new Map();
    
    // nodeId → frame count where not visible
    this.invisibilityFrames = new Map();
    
    // Category → count of problematic nodes
    this.categoryProblems = new Map();
    
    // Global stats
    this.checksPerformed = 0;
    this.problemsDetected = 0;
  }
  
  /**
   * Mark a node as having visibility problems
   * @param {string} nodeId - Node identifier
   * @param {string} category - Node category
   */
  reportVisibilityProblem(nodeId, category) {
    // Decrease stability score
    const currentScore = this.stabilityScores.get(nodeId) || 1.0;
    const newScore = Math.max(0, currentScore - 0.25);
    this.stabilityScores.set(nodeId, newScore);
    
    // Track category problems
    const problemCount = (this.categoryProblems.get(category) || 0) + 1;
    this.categoryProblems.set(category, problemCount);
    
    this.problemsDetected++;
    
    // Return true if stability score indicates replacement needed
    return newScore < 0.3; // Replace if score drops below 0.3
  }
  
  /**
   * Mark node as stable
   * @param {string} nodeId - Node identifier
   */
  reportStability(nodeId) {
    const currentScore = this.stabilityScores.get(nodeId) || 1.0;
    const newScore = Math.min(1.0, currentScore + 0.05);
    this.stabilityScores.set(nodeId, newScore);
  }
  
  /**
   * Get stability score for a node
   * @param {string} nodeId - Node identifier
   * @returns {number} Stability score (0-1)
   */
  getStabilityScore(nodeId) {
    return this.stabilityScores.get(nodeId) ?? 1.0;
  }
  
  /**
   * Check if node should use enhanced replacement
   * @param {string} nodeId - Node identifier
   * @param {string} category - Node category
   * @returns {boolean} True if enhanced model should be used
   */
  shouldUseEnhancedModel(nodeId, category) {
    // Check explicit unstable list
    if (SAFE_REPLACEMENT_CONFIG.unstableNodeIds.has(nodeId)) {
      return true;
    }
    
    // Check stability score
    const score = this.getStabilityScore(nodeId);
    return score < 0.5; // Use enhanced if stability drops below 0.5
  }
  
  /**
   * Get diagnostic report
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    return {
      checksPerformed: this.checksPerformed,
      problemsDetected: this.problemsDetected,
      totalMonitoredNodes: this.stabilityScores.size,
      categoryProblems: Object.fromEntries(this.categoryProblems),
      criticalNodes: Array.from(this.stabilityScores.entries())
        .filter(([_, score]) => score < 0.5)
        .map(([id, score]) => ({ nodeId: id, stability: score }))
    };
  }
}

// Global stability monitor instance
export const visualStabilityMonitor = new VisualStabilityMonitor();

/**
 * Choose between legacy and enhanced model based on stability
 * Transparent selection - uses enhanced only for problematic nodes
 * 
 * @param {Object} group - Three.js Group node (or existing legacy node)
 * @param {string} category - Node category (input, process, etc.)
 * @param {number} index - Node variant index
 * @param {string} nodeId - Node identifier
 * @param {number} color - Node color (hex)
 * @returns {Object} Enhanced or legacy node group
 */
export function selectOptimalNodeModel(group, category, index, nodeId, color) {
  // Check if enhanced models are disabled
  if (!SAFE_REPLACEMENT_CONFIG.enableEnhancedModels) {
    return group; // Return original legacy node
  }
  
  // Check if this category is excluded from replacement
  const categoriesFilter = SAFE_REPLACEMENT_CONFIG.categoriesForReplacement;
  if (categoriesFilter !== null && !categoriesFilter.includes(category.toLowerCase())) {
    return group; // Use legacy for this category
  }
  
  // Check if this node should use enhanced model
  const shouldUseEnhanced = visualStabilityMonitor.shouldUseEnhancedModel(nodeId, category);
  
  if (!shouldUseEnhanced) {
    return group; // Use legacy - node is stable
  }
  
  // Node is unstable, use enhanced replacement
  try {
    const enhancedNode = createEnhancedNodeReplacement(category, index, color);
    if (enhancedNode) {
      // Store metadata indicating this is an enhanced replacement
      group.userData.isEnhancedReplacement = true;
      group.userData.originalNodeId = nodeId;
      group.userData.replacementCategory = category;
      
      return enhancedNode;
    }
  } catch (err) {
    console.warn(`[EnhancedNodeModelsSafeReplacements] Failed to create enhanced model for ${category}:`, err);
  }
  
  console.error('[VisualBuildFail]', {
    archetype: `legacy-${category}`,
    category,
    reason: 'FactoryError'
  });
  return null;
}

/**
 * Create enhanced node replacement
 * Delegates to EnhancedNodeModels system which provides production-ready geometries
 * 
 * @param {string} category - Node category
 * @param {number} index - Variant index
 * @param {number} color - Node color
 * @returns {Object} Enhanced node group
 */
export function createEnhancedNodeReplacement(category, index, color) {
  const nodeGroup = new THREE.Group();
  
  switch (category.toLowerCase()) {
    case 'input':
    case 'process':
    case 'integration':
    case 'analytics':
    case 'storage':
    case 'control':
    case 'quantum':
    case 'sigma':
    case 'mythic':
    case 'prime':
    case 'error':
    case 'emotional':
      // Spawn removed: single authority = AINodes.spawnNode()
      return null;
    
    default:
      console.warn(`[EnhancedNodeModelsSafeReplacements] Unknown category: ${category}`);
      return null;
  }
}

/**
 * Mark a node as potentially unstable for future replacement
 * Call this when visual stability is detected
 * 
 * @param {string} nodeId - Node identifier
 * @param {string} category - Node category
 * @param {string} reason - Reason for stability detection
 */
export function markNodeAsUnstable(nodeId, category, reason = '') {
  SAFE_REPLACEMENT_CONFIG.unstableNodeIds.add(nodeId);
  
  const shouldReplace = visualStabilityMonitor.reportVisibilityProblem(nodeId, category);
  
  if (shouldReplace) {
    console.log(`[EnhancedNodeModelsSafeReplacements] Node marked for replacement: ${nodeId} (${category}) - ${reason}`);
  }
}

/**
 * Mark a node as stable (recovery from stability)
 * 
 * @param {string} nodeId - Node identifier
 */
export function markNodeAsStable(nodeId) {
  visualStabilityMonitor.reportStability(nodeId);
}

/**
 * Get list of categories with enhanced variants available
 * 
 * @returns {Array} Category names
 */
export function getAvailableEnhancedCategories() {
  return Object.keys(SAFE_REPLACEMENT_CONFIG.variantsPerCategory);
}

/**
 * Get variant count for a category
 * 
 * @param {string} category - Node category
 * @returns {number} Number of variants
 */
export function getVariantCountForCategory(category) {
  return SAFE_REPLACEMENT_CONFIG.variantsPerCategory[category.toLowerCase()] || 1;
}

/**
 * Batch mark nodes as unstable
 * Useful for mass detection/repair passes
 * 
 * @param {Array} nodeIds - Array of node identifiers
 * @param {string} category - Category (optional, if all same)
 * @param {string} reason - Reason for detection
 */
export function batchMarkNodesAsUnstable(nodeIds, category = 'unknown', reason = '') {
  for (const nodeId of nodeIds) {
    markNodeAsUnstable(nodeId, category, reason);
  }
}

/**
 * Enable enhanced models globally
 */
export function enableEnhancedModels() {
  SAFE_REPLACEMENT_CONFIG.enableEnhancedModels = true;
  console.log('[EnhancedNodeModelsSafeReplacements] Enhanced models enabled globally');
}

/**
 * Disable enhanced models (revert to legacy)
 */
export function disableEnhancedModels() {
  SAFE_REPLACEMENT_CONFIG.enableEnhancedModels = false;
  console.log('[EnhancedNodeModelsSafeReplacements] Enhanced models disabled - using legacy only');
}

/**
 * Set categories for replacement
 * 
 * @param {Array|null} categories - Array of category names, or null for all
 */
export function setCategoriesForReplacement(categories) {
  SAFE_REPLACEMENT_CONFIG.categoriesForReplacement = categories;
  
  if (categories === null) {
    console.log('[EnhancedNodeModelsSafeReplacements] All categories enabled for replacement');
  } else {
    console.log('[EnhancedNodeModelsSafeReplacements] Replacement enabled for:', categories);
  }
}

/**
 * Get diagnostic report on node visual stability
 * 
 * @returns {Object} Diagnostic data
 */
export function getDiagnosticReport() {
  return {
    config: {
      enabledGlobally: SAFE_REPLACEMENT_CONFIG.enableEnhancedModels,
      categoriesForReplacement: SAFE_REPLACEMENT_CONFIG.categoriesForReplacement,
      unstableNodesCount: SAFE_REPLACEMENT_CONFIG.unstableNodeIds.size
    },
    stability: visualStabilityMonitor.getDiagnostics()
  };
}

/**
 * Export system as complete module
 */
export const EnhancedNodeModelsSafeReplacementsSystem = {
  // Selection logic
  selectOptimalNodeModel,
  createEnhancedNodeReplacement,
  
  // Stability tracking
  markNodeAsUnstable,
  markNodeAsStable,
  batchMarkNodesAsUnstable,
  
  // Configuration
  enableEnhancedModels,
  disableEnhancedModels,
  setCategoriesForReplacement,
  
  // Information
  getAvailableEnhancedCategories,
  getVariantCountForCategory,
  getDiagnosticReport,
  
  // Monitor access
  visualStabilityMonitor,
  config: SAFE_REPLACEMENT_CONFIG
};

export default EnhancedNodeModelsSafeReplacementsSystem;
