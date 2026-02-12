/**
 * VISUAL LAYER ENFORCEMENT GATE
 * 
 * Global enforcement authority for node-related visual attachments.
 * Acts as a central approval checkpoint BEFORE any node visual meshes
 * are added to the scene or node group.
 * 
 * Prevents invalid visual layers from obscuring node identity while
 * preserving all valid, compliant visual systems.
 * 
 * CORE PRINCIPLE:
 * No node-related visual mesh may be added to the scene
 * without explicit approval from this gate.
 * 
 * SESSION 92: Visual Layer Hierarchy Authority
 */

export class VisualLayerEnforcementGate {
  constructor() {
    this.mode = 'DEV'; // 'DEV' | 'STRICT' | 'PROD'
    this.enabled = true;
    
    // Layer hierarchy from Session 92 (canonical)
    this.layerHierarchy = {
      'DEBUG_OVERLAY': { priority: 10, maxOpacity: 0.8, allowedGeometry: ['Lines', 'Text', 'Markers'] },
      'SELECTION_HIGHLIGHT': { priority: 9, maxOpacity: 0.75, allowedGeometry: ['Wireframe'] },
      'FOCUS_RING': { priority: 8, maxOpacity: 0.9, allowedGeometry: ['LineLoop', 'Wireframe'] },
      'STRESS_INDICATOR': { priority: 7, maxOpacity: 0.4, allowedGeometry: ['Particles', 'Lines'] },
      'STATE_GLYPH': { priority: 6, maxOpacity: 0.5, allowedGeometry: ['Rings', 'Lines', 'Spheres', 'Particles'] },
      'GLYPH_LAYER': { priority: 5, maxOpacity: 0.7, allowedGeometry: ['Planes', 'Lines', 'Particles', 'Custom'] },
      'AURA_LAYER': { priority: 4, maxOpacity: 0.6, allowedGeometry: ['Particles', 'Spheres'] },
      'SHELL_OUTLINE': { priority: 3, maxOpacity: 1.0, allowedGeometry: ['Mesh', 'Icosphere'] },
      'EDGE_GLOW': { priority: 2, maxOpacity: 0.8, allowedGeometry: ['LineSegments'] },
      'CORE_GEOMETRY': { priority: 1, maxOpacity: 1.0, allowedGeometry: ['Mesh'] }
    };
    
    // Forbidden geometry patterns for specific layers
    this.forbiddenPatterns = {
      'PERSONALITY': ['PlaneGeometry', 'CircleGeometry', 'DiscGeometry'],
      'STATE': ['PlaneGeometry', 'CircleGeometry', 'DiscGeometry'],
      'STRESS': ['PlaneGeometry', 'CircleGeometry'],
      'CORRUPTION': ['PlaneGeometry', 'CircleGeometry', 'DiscGeometry']
    };
    
    // Allowed categories (from Session 92 - currently universal)
    this.allowedCategories = new Set([
      'input', 'process', 'analytics', 'storage', 'control', 'integration',
      'emotional', 'quantum', 'sigma', 'outer', 'extreme', 'legendary',
      'mythic', 'prime', 'error'
    ]);
    
    // Opacity bounds per layer type
    this.opacityBounds = {
      'AURA_LAYER': { min: 0.0, max: 0.6 },
      'GLYPH_LAYER': { min: 0.0, max: 0.7 },
      'STATE_GLYPH': { min: 0.0, max: 0.5 },
      'STRESS_INDICATOR': { min: 0.0, max: 0.4 },
      'EDGE_GLOW': { min: 0.0, max: 0.8 },
      'SELECTION_HIGHLIGHT': { min: 0.0, max: 0.75 },
      'FOCUS_RING': { min: 0.0, max: 0.9 },
      'DEBUG_OVERLAY': { min: 0.0, max: 0.8 }
    };
    
    // Statistics
    this.stats = {
      totalCheckpoints: 0,
      approvalsGranted: 0,
      approvalsDenied: 0,
      violations: [],
      modeChangeCount: 0
    };
    
    // Violation log (last 100)
    this.violationLog = [];
    this.maxViolationLogSize = 100;
    
    console.log('✓ Visual Layer Enforcement Gate initialized (mode: ' + this.mode + ')');
  }
  
  /**
   * MAIN ENFORCEMENT CHECKPOINT
   * Called before any node-related visual is attached
   */
  canAttach(request) {
    if (request?.mesh?.userData?.isHitProxy) return true;
    if (!this.enabled) return true;
    
    this.stats.totalCheckpoints++;
    
    // Validate request structure
    if (!this._validateRequest(request)) {
      return this._handleViolation(request, 'INVALID_REQUEST_STRUCTURE', 'Request missing required fields');
    }
    
    // Check 1: Is the node category allowed?
    if (!this._checkCategoryAllowed(request)) {
      return this._handleViolation(request, 'INVALID_CATEGORY', 
        `Category "${request.nodeCategory}" not in allowed list`);
    }
    
    // Check 2: Is this layer defined in hierarchy?
    if (!this._checkLayerExists(request)) {
      return this._handleViolation(request, 'UNKNOWN_LAYER', 
        `Layer "${request.layerType}" not defined in hierarchy`);
    }
    
    // Check 3: FORBIDDEN - Filled discs/planes for certain contexts
    if (this._isForbiddenFilledGeometry(request)) {
      return this._handleViolation(request, 'FORBIDDEN_FILLED_GEOMETRY', 
        `Cannot use ${request.geometryType} for ${request.layerType}`);
    }
    
    // Check 4: Is opacity within bounds?
    if (!this._checkOpacityBounds(request)) {
      return this._handleViolation(request, 'OPACITY_OUT_OF_BOUNDS', 
        `Opacity ${request.opacity} exceeds limit of ${this.opacityBounds[request.layerType]?.max}`);
    }
    
    // Check 5: FORBIDDEN - Layers that change node size
    if (this._wouldChangeNodeSize(request)) {
      return this._handleViolation(request, 'SIZE_MODIFICATION_ATTEMPTED', 
        'Layers cannot modify node world-space size');
    }
    
    // Check 6: Is this geometry type allowed for this layer?
    if (!this._checkGeometryAllowed(request)) {
      return this._handleViolation(request, 'GEOMETRY_NOT_ALLOWED_FOR_LAYER', 
        `${request.geometryType} not allowed for layer "${request.layerType}"`);
    }
    
    // Check 7: Would this conflict with higher-priority layer?
    if (this._wouldConflictWithHigherPriority(request)) {
      return this._handleViolation(request, 'LAYER_PRIORITY_CONFLICT', 
        'Higher-priority layer already active; cannot attach conflicting layer');
    }
    
    // Check 8: FORBIDDEN - Opacity that would obscure core
    if (this._wouldOccludeCore(request)) {
      return this._handleViolation(request, 'CORE_OCCLUSION_ATTEMPTED', 
        `Opacity ${request.opacity} would obscure core geometry`);
    }
    
    // All checks passed
    this.stats.approvalsGranted++;
    return true;
  }
  
  /**
   * Validate request has required fields
   */
  _validateRequest(request) {
    if (!request) return false;
    
    const required = ['nodeId', 'nodeCategory', 'layerType', 'geometryType', 'opacity'];
    return required.every(field => field in request);
  }
  
  /**
   * Check 1: Category allowed?
   */
  _checkCategoryAllowed(request) {
    return this.allowedCategories.has(request.nodeCategory);
  }
  
  /**
   * Check 2: Layer defined?
   */
  _checkLayerExists(request) {
    return request.layerType in this.layerHierarchy;
  }
  
  /**
   * Check 3: FORBIDDEN - Filled discs for state/personality?
   */
  _isForbiddenFilledGeometry(request) {
    const layer = request.layerType.toLowerCase();
    
    // Rule 1: No filled discs/planes for personality or state visualization
    if ((layer.includes('personality') || layer.includes('state') || 
         layer.includes('stress') || layer.includes('corruption')) &&
        ['PlaneGeometry', 'CircleGeometry', 'DiscGeometry'].includes(request.geometryType)) {
      return true;
    }
    
    // Extra check: Any layer with "glyph" or "symbol" shouldn't be a filled plane covering core
    if ((layer.includes('glyph') || layer.includes('symbol')) &&
        request.geometryType === 'PlaneGeometry' &&
        request.opacity > 0.5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check 4: Opacity within bounds?
   */
  _checkOpacityBounds(request) {
    const bounds = this.opacityBounds[request.layerType];
    
    // Some layers don't have strict bounds
    if (!bounds) return true;
    
    return request.opacity >= bounds.min && request.opacity <= bounds.max;
  }
  
  /**
   * Check 5: FORBIDDEN - Would change node size?
   */
  _wouldChangeNodeSize(request) {
    // Rule: Only NodeShellSizeAuthority can control shell size
    // Any other system trying to scale node geometry = violation
    
    // If explicitly marked as size-modifying
    if (request.modifiesNodeSize === true) {
      return true;
    }
    
    // If geometry type is something that might scale the node
    // (This is a heuristic; actual size changes caught by authority system)
    if (['ScalingPlane', 'ResizingMesh', 'DynamicGeometry'].includes(request.geometryType)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check 6: Geometry allowed for this layer?
   */
  _checkGeometryAllowed(request) {
    const layer = this.layerHierarchy[request.layerType];
    if (!layer) return false;
    
    // Get the base geometry type (remove "Geometry" suffix for matching)
    const geometryBase = request.geometryType.replace('Geometry', '');
    
    // Some geometries are always OK
    if (['Lines', 'Particles', 'Wireframe', 'Text'].includes(geometryBase)) {
      return true;
    }
    
    // Check against allowed list for this layer
    return layer.allowedGeometry.some(allowed => 
      geometryBase.toLowerCase().includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(geometryBase.toLowerCase())
    );
  }
  
  /**
   * Check 7: Conflict with higher-priority layer?
   */
  _wouldConflictWithHigherPriority(request) {
    // This would require knowing what's currently active on the node
    // For now, we'll allow it and let conflict resolution handle it
    // (Higher-priority layers will override at render time)
    
    // Future: Could track active layers per node
    return false;
  }
  
  /**
   * Check 8: FORBIDDEN - Would obscure core?
   */
  _wouldOccludeCore(request) {
    // Rule: Core must always be visible (opacity > 0.9 covering core = violation)
    
    // If this layer is explicitly NOT the core and has high opacity + covers core
    if (request.layerType !== 'CORE_GEOMETRY' && 
        request.opacity > 0.9 &&
        request.coversCore === true) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle a violation
   */
  _handleViolation(request, violationType, reason) {
    this.stats.approvalsDenied++;
    
    const violation = {
      timestamp: performance.now(),
      nodeId: request.nodeId,
      nodeCategory: request.nodeCategory,
      layerType: request.layerType,
      geometryType: request.geometryType,
      opacity: request.opacity,
      violationType: violationType,
      reason: reason,
      sourceSystem: request.sourceSystem || 'UNKNOWN'
    };
    
    this.violationLog.push(violation);
    if (this.violationLog.length > this.maxViolationLogSize) {
      this.violationLog.shift();
    }
    
    this.stats.violations.push(violation);
    
    // Mode-specific behavior
    if (this.mode === 'DEV') {
      console.warn(`⚠️ [Visual Gate] VIOLATION (DEV MODE - ALLOWED): ${violationType}`, {
        nodeId: request.nodeId,
        layer: request.layerType,
        reason: reason
      });
      return true; // Allow in DEV mode
    } else if (this.mode === 'STRICT') {
      console.error(`❌ [Visual Gate] BLOCKED: ${violationType}`, {
        nodeId: request.nodeId,
        layer: request.layerType,
        reason: reason
      });
      return false; // Block in STRICT mode
    } else if (this.mode === 'PROD') {
      // Silent in production
      return false; // Block silently
    }
    
    return false;
  }
  
  /**
   * Report a violation manually
   */
  reportViolation(details) {
    const violation = {
      timestamp: performance.now(),
      ...details
    };
    
    this.violationLog.push(violation);
    if (this.violationLog.length > this.maxViolationLogSize) {
      this.violationLog.shift();
    }
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      mode: this.mode,
      enabled: this.enabled,
      totalCheckpoints: this.stats.totalCheckpoints,
      approvalsGranted: this.stats.approvalsGranted,
      approvalsDenied: this.stats.approvalsDenied,
      denialRate: this.stats.totalCheckpoints > 0 
        ? (this.stats.approvalsDenied / this.stats.totalCheckpoints * 100).toFixed(2) + '%'
        : '0%',
      recentViolations: this.violationLog.slice(-10)
    };
  }
  
  /**
   * Get violation log
   */
  getViolationLog() {
    return [...this.violationLog];
  }
  
  /**
   * Clear violation log
   */
  clearViolationLog() {
    const count = this.violationLog.length;
    this.violationLog = [];
    console.log(`✓ Violation log cleared (${count} entries removed)`);
  }
  
  /**
   * Set enforcement mode
   */
  setMode(mode) {
    if (!['DEV', 'STRICT', 'PROD'].includes(mode)) {
      console.error('Invalid mode:', mode);
      return false;
    }
    
    this.mode = mode;
    this.stats.modeChangeCount++;
    
    const modeDescriptions = {
      'DEV': 'Allow + warn',
      'STRICT': 'Block + warn',
      'PROD': 'Silent block'
    };
    
    console.log(`✓ Visual Gate mode changed to: ${mode} (${modeDescriptions[mode]})`);
    return true;
  }
  
  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }
  
  /**
   * Enable/disable gate
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(enabled ? '✓ Visual Gate ENABLED' : '⚠️ Visual Gate DISABLED');
  }
  
  /**
   * Register a new layer type (for custom layers)
   */
  registerLayer(layerName, config) {
    if (layerName in this.layerHierarchy) {
      console.warn(`Layer "${layerName}" already registered`);
      return false;
    }
    
    this.layerHierarchy[layerName] = {
      priority: config.priority || 5,
      maxOpacity: config.maxOpacity || 0.7,
      allowedGeometry: config.allowedGeometry || ['Custom']
    };
    
    if (config.opacityBounds) {
      this.opacityBounds[layerName] = config.opacityBounds;
    }
    
    console.log(`✓ Registered custom layer: "${layerName}"`);
    return true;
  }
  
  /**
   * Generate comprehensive report
   */
  generateReport() {
    const totalViolations = this.violationLog.length;
    const violationsByType = {};
    const violationsByNode = {};
    const violationsByLayer = {};
    
    for (const v of this.violationLog) {
      violationsByType[v.violationType] = (violationsByType[v.violationType] || 0) + 1;
      violationsByNode[v.nodeId] = (violationsByNode[v.nodeId] || 0) + 1;
      violationsByLayer[v.layerType] = (violationsByLayer[v.layerType] || 0) + 1;
    }
    
    return {
      mode: this.mode,
      enabled: this.enabled,
      stats: this.getStats(),
      summary: {
        totalViolations: totalViolations,
        violationsByType: violationsByType,
        violationsByNode: violationsByNode,
        violationsByLayer: violationsByLayer
      },
      recentViolations: this.violationLog.slice(-20)
    };
  }
}

// ============================================================================
// CONSOLE API SETUP
// ============================================================================

if (typeof window !== 'undefined') {
  window.setupVisualLayerEnforcementGateAPI = function(gate) {
    window.visualLayerGate = {
      // Core API
      canAttach: (request) => gate.canAttach(request),
      reportViolation: (details) => gate.reportViolation(details),
      
      // Statistics
      getStats: () => {
        const stats = gate.getStats();
        console.log('📊 VISUAL LAYER GATE STATISTICS');
        console.table({
          'Mode': stats.mode,
          'Enabled': stats.enabled,
          'Total Checkpoints': stats.totalCheckpoints,
          'Approvals Granted': stats.approvalsGranted,
          'Approvals Denied': stats.approvalsDenied,
          'Denial Rate': stats.denialRate
        });
        return stats;
      },
      
      // Violation management
      getViolationLog: () => gate.getViolationLog(),
      clearViolationLog: () => gate.clearViolationLog(),
      getRecentViolations: (count = 10) => gate.violationLog.slice(-count),
      
      // Mode control
      setMode: (mode) => gate.setMode(mode),
      getMode: () => gate.getMode(),
      
      // Gate control
      enable: () => gate.setEnabled(true),
      disable: () => gate.setEnabled(false),
      isEnabled: () => gate.enabled,
      
      // Custom layers
      registerLayer: (name, config) => gate.registerLayer(name, config),
      
      // Reporting
      generateReport: () => {
        const report = gate.generateReport();
        console.log('📋 VISUAL LAYER GATE REPORT');
        console.log('Mode:', report.mode);
        console.log('Enabled:', report.enabled);
        console.log('Stats:', report.stats);
        console.log('Summary:', report.summary);
        if (report.recentViolations.length > 0) {
          console.warn('Recent Violations:');
          console.table(report.recentViolations);
        }
        return report;
      }
    };
    
    console.log('✓ Visual Layer Enforcement Gate API available: window.visualLayerGate');
  };
}
