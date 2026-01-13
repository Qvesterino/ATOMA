/**
 * VISUAL OVERLAY AUDIT SYSTEM
 * 
 * Monitors and reports all visual overlays attached to nodes.
 * Ensures only authorized layers render and no opaque discs obscure node geometry.
 * 
 * RULES ENFORCED:
 * - No opaque filled geometry allowed on nodes
 * - Only wireframe or low-opacity helpers permitted
 * - All overlays must be tagged with userData.visualLayer
 * - Single source of truth per visual authority
 * 
 * CONSOLE API:
 * - visualOverlayAudit.scanAllNodes() → Report all overlays
 * - visualOverlayAudit.getNodeOverlays(node) → Details for specific node
 * - visualOverlayAudit.reportStats() → Summary statistics
 * - visualOverlayAudit.enableStrictMode(bool) → Enforce overlay rules
 */

export class VisualOverlayAuditSystem {
  constructor(scene) {
    this.scene = scene;
    this.registeredLayers = new Map(); // node → [layer info]
    this.violations = [];
    this.stats = {
      totalNodes: 0,
      nodesWithOverlays: 0,
      totalOverlayMeshes: 0,
      opaqueCount: 0,
      wireframeCount: 0,
      helperCount: 0
    };
    this.strictMode = false;
    this.allowedLayers = [
      'SELECTION_HIGHLIGHT',
      'GLYPH_LAYER',
      'PERSONALITY_HELPER',
      'CORRUPTION_INDICATOR',
      'STRESS_INDICATOR',
      'LINK_ENDPOINT'
    ];
    
    console.log('✓ Visual Overlay Audit System initialized');
  }
  
  /**
   * Register an authorized visual layer for a node
   */
  registerLayer(node, layerName, meshes = []) {
    if (!node || !node.userData) return;
    
    const nodeId = node.userData.index || node.uuid;
    if (!this.registeredLayers.has(nodeId)) {
      this.registeredLayers.set(nodeId, []);
    }
    
    this.registeredLayers.get(nodeId).push({
      name: layerName,
      meshCount: meshes.length,
      timestamp: performance.now()
    });
  }
  
  /**
   * Scan all nodes for visual overlays
   */
  scanAllNodes() {
    this.violations = [];
    this.stats = {
      totalNodes: 0,
      nodesWithOverlays: 0,
      totalOverlayMeshes: 0,
      opaqueCount: 0,
      wireframeCount: 0,
      helperCount: 0
    };
    
    const nodes = this.scene.children.filter(obj => obj.userData?.isNode);
    this.stats.totalNodes = nodes.length;
    
    for (const node of nodes) {
      this.scanNode(node);
    }
    
    return this.generateReport();
  }
  
  /**
   * Scan a specific node for overlays
   */
  scanNode(node) {
    if (!node || !node.userData?.isNode) return null;
    
    const nodeId = node.userData.index || node.uuid;
    const overlays = [];
    
    // Check direct children
    for (const child of node.children) {
      const info = this.analyzeOverlayMesh(child);
      if (info) {
        overlays.push(info);
        
        // Update stats
        if (info.isOpaque) {
          this.stats.opaqueCount++;
          this.violations.push({
            nodeId,
            layerName: info.layerName,
            issue: 'OPAQUE_FILLED_MESH',
            opacity: info.opacity,
            geometry: info.geometryType
          });
        } else if (info.isWireframe) {
          this.stats.wireframeCount++;
        } else {
          this.stats.helperCount++;
        }
      }
    }
    
    if (overlays.length > 0) {
      this.stats.nodesWithOverlays++;
      this.stats.totalOverlayMeshes += overlays.length;
      return {
        nodeId,
        category: node.userData.category,
        overlays
      };
    }
    
    return null;
  }
  
  /**
   * Analyze a mesh to determine if it's a problematic overlay
   */
  analyzeOverlayMesh(mesh) {
    if (!mesh || !mesh.isMesh) return null;
    
    const material = mesh.material;
    const geometry = mesh.geometry;
    
    if (!material || !geometry) return null;
    
    const isOpaque = material.opacity > 0.5 && !material.wireframe;
    const isWireframe = material.wireframe === true;
    const geometryType = geometry.constructor.name;
    
    // Skip core geometry (solid icosahedron, octahedron, etc at origin)
    const isCore = this.isCoreGeometry(mesh, geometry);
    if (isCore) return null;
    
    // Flag opaque filled planes/circles/discs
    if (isOpaque && (
      geometryType === 'PlaneGeometry' ||
      geometryType === 'CircleGeometry' ||
      geometryType === 'IcosahedronGeometry'
    )) {
      return {
        layerName: mesh.userData?.visualLayer || 'UNKNOWN_LAYER',
        isOpaque: true,
        isWireframe: false,
        opacity: material.opacity,
        geometryType: geometryType,
        size: this.estimateMeshSize(mesh)
      };
    }
    
    // Wireframe outlines are OK
    if (isWireframe) {
      return {
        layerName: mesh.userData?.visualLayer || 'OUTLINE',
        isOpaque: false,
        isWireframe: true,
        opacity: material.opacity,
        geometryType: geometryType,
        size: this.estimateMeshSize(mesh)
      };
    }
    
    // Low-opacity helpers are OK
    if (material.opacity <= 0.5) {
      return {
        layerName: mesh.userData?.visualLayer || 'HELPER',
        isOpaque: false,
        isWireframe: false,
        opacity: material.opacity,
        geometryType: geometryType,
        size: this.estimateMeshSize(mesh)
      };
    }
    
    return null;
  }
  
  /**
   * Estimate mesh footprint size
   */
  estimateMeshSize(mesh) {
    if (!mesh.geometry) return 0;
    
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box) return 0;
    
    const size = box.getSize(new THREE.Vector3());
    return Math.max(size.x, size.y, size.z);
  }
  
  /**
   * Determine if mesh is part of core node geometry (not overlay)
   */
  isCoreGeometry(mesh, geometry) {
    // Core geometry meshes are typically large and centered at origin
    const geometryType = geometry.constructor.name;
    
    if (mesh.userData?.visualLayer === 'CORE') return true;
    if (mesh.userData?.visualLayer === 'IDENTITY_LAYER') return true;
    
    // Edge geometries are OK (they're decorative but small)
    if (geometry.constructor.name === 'EdgesGeometry') return true;
    
    return false;
  }
  
  /**
   * Get overlays for a specific node
   */
  getNodeOverlays(node) {
    if (!node || !node.userData?.isNode) return null;
    return this.scanNode(node);
  }
  
  /**
   * Generate audit report
   */
  generateReport() {
    return {
      timestamp: performance.now(),
      summary: {
        totalNodes: this.stats.totalNodes,
        nodesWithOverlays: this.stats.nodesWithOverlays,
        totalOverlayMeshes: this.stats.totalOverlayMeshes,
        opaqueViolations: this.stats.opaqueCount,
        wireframeOutlines: this.stats.wireframeCount,
        helperGeometry: this.stats.helperCount
      },
      violations: this.violations,
      status: this.violations.length === 0 ? 'CLEAN' : 'VIOLATIONS_DETECTED'
    };
  }
  
  /**
   * Report statistics
   */
  reportStats() {
    this.scanAllNodes();
    
    console.group('✓ VISUAL OVERLAY AUDIT REPORT');
    console.log('Total Nodes:', this.stats.totalNodes);
    console.log('Nodes with Overlays:', this.stats.nodesWithOverlays);
    console.log('Total Overlay Meshes:', this.stats.totalOverlayMeshes);
    console.log('');
    console.log('Breakdown:');
    console.log('  Wireframe Outlines (OK):', this.stats.wireframeCount);
    console.log('  Helper Geometry (OK):', this.stats.helperCount);
    console.log('  OPAQUE VIOLATIONS:', this.stats.opaqueCount);
    
    if (this.violations.length > 0) {
      console.group('⚠ Violations Found:');
      for (const v of this.violations) {
        console.warn(`Node ${v.nodeId}: ${v.layerName} (${v.geometry}, opacity=${v.opacity.toFixed(2)})`);
      }
      console.groupEnd();
    } else {
      console.log('✓ No opaque overlays detected');
    }
    
    console.groupEnd();
    
    return this.stats;
  }
  
  /**
   * Enable strict enforcement mode
   */
  enableStrictMode(enabled) {
    this.strictMode = enabled;
    console.log(this.strictMode ? '🔒 STRICT MODE: Enforcing overlay rules' : '✓ Strict mode disabled');
  }
  
  /**
   * Validate overlay before rendering
   */
  validateOverlay(mesh, layerName) {
    if (!this.strictMode) return true;
    
    if (!this.allowedLayers.includes(layerName)) {
      console.warn(`❌ Unregistered layer: ${layerName}`);
      return false;
    }
    
    // Enforce no opaque filled geometry
    if (mesh.material?.opacity > 0.5 && !mesh.material?.wireframe) {
      const geometryType = mesh.geometry?.constructor.name;
      if (['PlaneGeometry', 'CircleGeometry'].includes(geometryType)) {
        console.error(`❌ FORBIDDEN: Opaque ${geometryType} overlay (opacity=${mesh.material.opacity})`);
        return false;
      }
    }
    
    return true;
  }
}

// Export console API
if (typeof window !== 'undefined') {
  window.setupVisualOverlayAuditAPI = function(auditSystem) {
    window.visualOverlayAudit = {
      scanAllNodes: () => {
        const report = auditSystem.scanAllNodes();
        console.log('Scan complete:', report);
        return report;
      },
      getNodeOverlays: (node) => auditSystem.getNodeOverlays(node),
      reportStats: () => auditSystem.reportStats(),
      enableStrictMode: (b) => auditSystem.enableStrictMode(b),
      validateOverlay: (mesh, layer) => auditSystem.validateOverlay(mesh, layer)
    };
    
    console.log('✓ Visual Overlay Audit API available: window.visualOverlayAudit');
  };
}
