import * as THREE from 'three';
import { CognitiveHorizonPlane } from './CognitiveHorizonPlane.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * ============================================================================
 * MAP REFERENCE PLANE FACTORY (Session 112+)
 * ============================================================================
 * Universal system for creating reference planes for all maps.
 * 
 * ARCHITECTURE:
 * - Planes are resolved from map.referencePlane config property
 * - Factory creates appropriate plane type at runtime
 * - No hardcoded map name/ID checks
 * - Falls back to safe default if plane undefined
 * - Provides clear console logging for debugging
 * 
 * SUPPORTED PLANE TYPES:
 * - "dream_plane": Cognitive horizon for dream-like environments
 * - "quantum_plane": Probabilistic surface for quantum spaces
 * - "logic_plane": Structured grid for computational environments
 * - "void_plane": Minimal reference for abstract spaces
 * - undefined/missing: Falls back to "void_plane"
 */

export class MapReferencePlaneFactory {
  /**
   * Create a reference plane for a map
 * @param {string} planeType - Type of plane from map.referencePlane
 * @param {THREE.Object3D} parent - Target attachment root (worldRoot)
 * @param {THREE.Camera} camera - Camera for optional shader uniforms
 * @param {Object} options - Additional configuration
 * @returns {Object} Reference plane instance
 */
  static createPlane(planeType, parent, camera, options = {}) {
    const normalizedType = (planeType || 'void_plane').toLowerCase();
    
    switch (normalizedType) {
      case 'dream_plane':
        return this.createDreamPlane(parent, camera, options);
      
      case 'quantum_plane':
        return this.createQuantumPlane(parent, camera, options);
      
      case 'logic_plane':
        return this.createLogicPlane(parent, camera, options);
      
      case 'void_plane':
        return this.createVoidPlane(parent, camera, options);
      
      default:
        console.warn(
          `[MapReferencePlaneFactory] Unknown plane type: "${planeType}". Falling back to void_plane.`
        );
        return this.createVoidPlane(parent, camera, options);
    }
  }
  
  /**
   * Create dream plane (cognitive horizon)
   * - Semi-transparent with wave motion
   * - Deep blue to teal gradients
   * - Subtle procedural grid
   * - Soft glow near horizon
   */
  static createDreamPlane(parent, camera, options = {}) {
    const config = {
      size: 300,
      segments: 128,
      waveSpeed: 0.08,
      waveAmplitude: 0.02,
      opacity: 0.25,
      gridOpacity: 0.08,
      ...options
    };
    
    const plane = new CognitiveHorizonPlane(parent, camera);
    plane.setConfig(config);
    plane.userData = { 
      type: 'dream_plane',
      description: 'Cognitive horizon for dream-like environments'
    };
    
    return plane;
  }
  
  /**
   * Create quantum plane
   * - Probabilistic surface appearance
   * - Purple to cyan gradients
   * - Faster wave motion
   * - Uncertainty-like shimmer effect
   */
  static createQuantumPlane(parent, camera, options = {}) {
    const config = {
      size: 300,
      segments: 128,
      waveSpeed: 0.15,        // Faster wave motion
      waveAmplitude: 0.04,    // More pronounced waves
      opacity: 0.20,          // More transparent
      gridOpacity: 0.12,      // Stronger grid
      ...options
    };
    
    // Use CognitiveHorizonPlane with quantum config
    const plane = new CognitiveHorizonPlane(parent, camera);
    plane.setConfig(config);
    
    // Modify colors for quantum aesthetic
    if (plane.materials.horizon && plane.materials.horizon.uniforms) {
      plane.materials.horizon.uniforms.baseColor.value = new THREE.Color(0x2d1b4e);
      plane.materials.horizon.uniforms.horizonColor.value = new THREE.Color(0x4d2b7e);
    }
    
    plane.userData = { 
      type: 'quantum_plane',
      description: 'Probabilistic surface for quantum spaces'
    };
    
    return plane;
  }
  
  /**
   * Create logic plane
   * - Structured grid appearance
   * - Cyan to blue gradients
   * - Mechanical precision
   * - Minimal wave motion
   */
  static createLogicPlane(parent, camera, options = {}) {
    const config = {
      size: 300,
      segments: 256,         // Higher resolution for grid precision
      waveSpeed: 0.02,       // Very slow waves
      waveAmplitude: 0.01,   // Minimal distortion
      opacity: 0.15,         // More transparent
      gridOpacity: 0.25,     // Strong grid presence
      ...options
    };
    
    const plane = new CognitiveHorizonPlane(parent, camera);
    plane.setConfig(config);
    
    // Modify colors for logic aesthetic
    if (plane.materials.horizon && plane.materials.horizon.uniforms) {
      plane.materials.horizon.uniforms.baseColor.value = new THREE.Color(0x0a2a4a);
      plane.materials.horizon.uniforms.horizonColor.value = new THREE.Color(0x1a4a7a);
    }
    
    plane.userData = { 
      type: 'logic_plane',
      description: 'Structured grid for computational environments'
    };
    
    return plane;
  }
  
  /**
   * Create void plane
   * - Minimal reference surface
   * - Very subtle grid
   * - Almost invisible unless looking for it
   * - Lowest visual impact
   */
  static createVoidPlane(parent, camera, options = {}) {
    const config = {
      size: 300,
      segments: 64,          // Lower resolution for performance
      waveSpeed: 0.01,       // Almost static
      waveAmplitude: 0.005,  // Nearly imperceptible waves
      opacity: 0.08,         // Very transparent
      gridOpacity: 0.03,     // Barely visible grid
      ...options
    };
    
    const plane = new CognitiveHorizonPlane(parent, camera);
    plane.setConfig(config);
    
    // Modify colors for void aesthetic
    if (plane.materials.horizon && plane.materials.horizon.uniforms) {
      plane.materials.horizon.uniforms.baseColor.value = new THREE.Color(0x050a15);
      plane.materials.horizon.uniforms.horizonColor.value = new THREE.Color(0x0a1a2a);
    }
    
    plane.userData = { 
      type: 'void_plane',
      description: 'Minimal reference for abstract spaces'
    };
    
    return plane;
  }
  
  /**
   * Get all available plane types
   */
  static getAvailablePlaneTypes() {
    return [
      'dream_plane',
      'quantum_plane',
      'logic_plane',
      'void_plane'
    ];
  }
  
  /**
   * Get plane type description
   */
  static getPlaneDescription(planeType) {
    const descriptions = {
      'dream_plane': 'Cognitive horizon for dream-like environments',
      'quantum_plane': 'Probabilistic surface for quantum spaces',
      'logic_plane': 'Structured grid for computational environments',
      'void_plane': 'Minimal reference for abstract spaces'
    };
    
    return descriptions[planeType] || 'Unknown plane type';
  }
}

/**
 * Initialize reference plane for a map
 * Call this during map creation to set up the reference plane
 * 
 * @param {THREE.Scene} scene - Target scene (for logging)
 * @param {THREE.Object3D} parent - Attachment parent (worldRoot)
 * @param {THREE.Camera} camera - Camera
 * @param {string} planeType - Type from map.referencePlane
 * @param {Object} options - Additional configuration
 * @returns {Object} Reference plane instance
 */
export function initMapReferencePlane(scene, parent, camera, planeType, options = {}) {
  console.log(`\n[REFERENCE PLANE INIT] Initializing plane type: ${planeType}`);
  console.log(`[REFERENCE PLANE INIT] Scene children before: ${scene.children.length}`);
  
  const plane = MapReferencePlaneFactory.createPlane(planeType, parent || scene, camera, options);
  
  console.log(`[REFERENCE PLANE INIT] Scene children after: ${scene.children.length}`);
  
  if (plane && plane.planeGroup) {
    console.log(`[REFERENCE PLANE INIT] ✓ Plane group created successfully`);
    console.log(`[REFERENCE PLANE INIT] Plane group position: (${plane.planeGroup.position.x}, ${plane.planeGroup.position.y}, ${plane.planeGroup.position.z})`);
    console.log(`[REFERENCE PLANE INIT] Plane group scale: (${plane.planeGroup.scale.x}, ${plane.planeGroup.scale.y}, ${plane.planeGroup.scale.z})`);
    console.log(`[REFERENCE PLANE INIT] Plane group rotation: (${plane.planeGroup.rotation.x.toFixed(3)}, ${plane.planeGroup.rotation.y.toFixed(3)}, ${plane.planeGroup.rotation.z.toFixed(3)})`);
  console.log(`[REFERENCE PLANE INIT] Plane group children: ${plane.planeGroup.children.length}`);
  applyReferencePlaneRenderOrder(plane);
  } else {
    console.error(`[REFERENCE PLANE INIT] ✗ ERROR: Plane creation failed or planeGroup is undefined`);
  }
  
  return plane;
}

function applyReferencePlaneRenderOrder(plane) {
  if (!plane || !plane.planeGroup || typeof plane.planeGroup.traverse !== 'function') return;
  const worldBackground = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND);
  const worldOverlay = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);

  plane.planeGroup.traverse((node) => {
    if (!node || (!node.isMesh && !node.isPoints && !node.isSprite)) return;
    if (node.renderOrder !== null && node.renderOrder !== undefined && node.renderOrder !== 0) return;

    const material = node.material;
    let isTransparent = false;
    let hasDepthWrite = true;

    if (Array.isArray(material)) {
      isTransparent = material.some((m) => m?.transparent || (typeof m?.opacity === 'number' && m.opacity < 1));
      hasDepthWrite = material.every((m) => m?.depthWrite !== false);
    } else {
      isTransparent = material?.transparent || (typeof material?.opacity === 'number' && material.opacity < 1);
      hasDepthWrite = material?.depthWrite !== false;
    }

    node.renderOrder = isTransparent && !hasDepthWrite ? worldOverlay : worldBackground;
  });
}

/**
 * Console API for reference plane debugging
 */
export function setupMapReferencePlaneDebugAPI() {
  window.MapReferencePlaneDebug = {
    /**
     * Get available plane types
     */
    getAvailablePlaneTypes() {
      return MapReferencePlaneFactory.getAvailablePlaneTypes();
    },
    
    /**
     * Get description for a plane type
     */
    getPlaneDescription(planeType) {
      return MapReferencePlaneFactory.getPlaneDescription(planeType);
    },
    
    /**
     * List all plane types with descriptions
     */
    listPlanes() {
      const types = MapReferencePlaneFactory.getAvailablePlaneTypes();
      return types.map(type => ({
        type,
        description: MapReferencePlaneFactory.getPlaneDescription(type)
      }));
    }
  };
  
  console.log('📍 Map Reference Plane Debug API ready: window.MapReferencePlaneDebug');
}
