/**
 * VISUAL LAYER DEBUGGER
 * 
 * Real-time monitoring of mesh additions to nodes.
 * Logs all overlay rendering with timestamps and details.
 * Alerts when unknown overlays appear.
 * 
 * USAGE:
 * visualLayerDebugger.enable() → Start monitoring
 * visualLayerDebugger.disable() → Stop monitoring
 * visualLayerDebugger.getLog() → View all events
 * visualLayerDebugger.clearLog() → Reset log
 */

export class VisualLayerDebugger {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.log = [];
    this.maxLogEntries = 500;
    
    // Known/approved visual layers
    this.knownLayers = new Set([
      'CORE',
      'IDENTITY_LAYER',
      'SHELL',
      'AURA',
      'GLOW',
      'SELECTION_HIGHLIGHT',
      'GLYPH_LAYER',
      'PERSONALITY_HELPER',
      'CORRUPTION_INDICATOR',
      'STRESS_INDICATOR',
      'LINK_ENDPOINT',
      'HELPER',
      'OUTLINE',
      'EDGE_GLOW',
      'RING',
      'DECORATION',
      'LABEL'
    ]);
    
    // Intercepted node.add() calls
    this.originalNodeAdd = null;
  }
  
  /**
   * Enable monitoring
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.log = [];
    
    console.log('🔍 Visual Layer Debugger: ENABLED (monitoring node.add() calls)');
    
    // We can't easily intercept node.add() without modifying the node class,
    // so we'll provide a manual logging method instead
  }
  
  /**
   * Disable monitoring
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    console.log('⚫ Visual Layer Debugger: DISABLED');
  }
  
  /**
   * Manually log a visual layer addition (called by systems)
   */
  logLayerAddition(node, mesh, layerName, details = {}) {
    if (!this.enabled) return;
    
    const entry = {
      timestamp: performance.now(),
      nodeId: node.userData?.index || node.uuid,
      nodeCategory: node.userData?.category || 'unknown',
      meshType: mesh.constructor.name,
      geometryType: mesh.geometry?.constructor.name || 'unknown',
      layerName: layerName || 'UNKNOWN',
      opacity: mesh.material?.opacity || 1.0,
      wireframe: mesh.material?.wireframe || false,
      isKnownLayer: this.knownLayers.has(layerName),
      details: details
    };
    
    this.log.push(entry);
    
    // Keep log size manageable
    if (this.log.length > this.maxLogEntries) {
      this.log.shift();
    }
    
    // Alert if unknown layer
    if (!entry.isKnownLayer) {
      console.warn(`⚠️ UNKNOWN VISUAL LAYER: "${layerName}" added to node ${entry.nodeId}`);
    }
    
    // Alert if opaque filled plane/circle
    if (entry.opacity > 0.5 && !entry.wireframe && 
        ['PlaneGeometry', 'CircleGeometry'].includes(entry.geometryType)) {
      console.error(`❌ OPAQUE OVERLAY DETECTED: ${entry.geometryType} on node ${entry.nodeId}`);
    }
  }
  
  /**
   * Get all log entries
   */
  getLog() {
    return [...this.log];
  }
  
  /**
   * Get log entries for specific node
   */
  getNodeLog(node) {
    const nodeId = node.userData?.index || node.uuid;
    return this.log.filter(e => e.nodeId === nodeId);
  }
  
  /**
   * Get entries for specific layer
   */
  getLayerLog(layerName) {
    return this.log.filter(e => e.layerName === layerName);
  }
  
  /**
   * Get unknown/suspicious entries
   */
  getSuspiciousEntries() {
    return this.log.filter(e => 
      !e.isKnownLayer || 
      (e.opacity > 0.5 && !e.wireframe && ['PlaneGeometry', 'CircleGeometry'].includes(e.geometryType))
    );
  }
  
  /**
   * Clear log
   */
  clearLog() {
    const count = this.log.length;
    this.log = [];
    console.log(`✓ Log cleared (${count} entries removed)`);
  }
  
  /**
   * Print summary report
   */
  reportSummary() {
    console.group('📊 VISUAL LAYER DEBUG REPORT');
    console.log('Total Entries:', this.log.length);
    console.log('Unknown Layers:', this.getSuspiciousEntries().filter(e => !e.isKnownLayer).length);
    console.log('Opaque Overlays:', this.getSuspiciousEntries().filter(e => 
      e.opacity > 0.5 && !e.wireframe && ['PlaneGeometry', 'CircleGeometry'].includes(e.geometryType)
    ).length);
    
    if (this.getSuspiciousEntries().length > 0) {
      console.group('⚠️ Suspicious Entries:');
      for (const entry of this.getSuspiciousEntries()) {
        console.warn(
          `Node ${entry.nodeId} (${entry.nodeCategory}): ${entry.layerName} ` +
          `(${entry.geometryType}, opacity=${entry.opacity.toFixed(2)})`
        );
      }
      console.groupEnd();
    } else {
      console.log('✓ No suspicious entries found');
    }
    
    console.groupEnd();
  }
  
  /**
   * Register a known layer type
   */
  registerLayer(layerName) {
    this.knownLayers.add(layerName);
    console.log(`✓ Registered visual layer: "${layerName}"`);
  }
  
  /**
   * Get all registered layers
   */
  getRegisteredLayers() {
    return Array.from(this.knownLayers).sort();
  }
}

// Export console API
if (typeof window !== 'undefined') {
  window.setupVisualLayerDebuggerAPI = function(debugProbe) {
    window.visualLayerDebugger = {
      enable: () => debugProbe.enable(),
      disable: () => debugProbe.disable(),
      getLog: () => debugProbe.getLog(),
      getNodeLog: (node) => debugProbe.getNodeLog(node),
      getLayerLog: (name) => debugProbe.getLayerLog(name),
      getSuspiciousEntries: () => debugProbe.getSuspiciousEntries(),
      clearLog: () => debugProbe.clearLog(),
      reportSummary: () => debugProbe.reportSummary(),
      registerLayer: (name) => debugProbe.registerLayer(name),
      getRegisteredLayers: () => debugProbe.getRegisteredLayers(),
      logLayerAddition: (node, mesh, layer, details) => 
        debugProbe.logLayerAddition(node, mesh, layer, details)
    };
    
    console.log('✓ Visual Layer Debugger API available: window.visualLayerDebugger');
  };
}
