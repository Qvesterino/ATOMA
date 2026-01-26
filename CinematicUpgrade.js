import * as THREE from 'three';

/**
 * CinematicUpgrade - Non-destructive Cinematic Visual Enhancement
 * Adds volumetric lighting, atmospheric effects, and color grading
 * WITHOUT modifying terrain, materials, or base environment
 */
export class CinematicUpgrade {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    this.volumetricLights = [];
    this.atmosphericLayers = [];
    this.edgeGlowPass = null;
    this.time = 0;
  }
  
  /**
   * Apply cinematic enhancements
   */
  initialize() {
    this.createVolumetricLighting();
    this.createAtmosphericLayers();
    this.createHolographicEdgeGlow();
  }
  
  /**
   * Create soft volumetric lighting cones
   */
  createVolumetricLighting() {
    const lightPositions = [
      { pos: new THREE.Vector3(50, 40, 30), color: 0x00ffff, intensity: 0.15 },
      { pos: new THREE.Vector3(-50, 35, -40), color: 0xff00ff, intensity: 0.12 },
      { pos: new THREE.Vector3(0, 50, -60), color: 0xff99ff, intensity: 0.1 }
    ];
    
    lightPositions.forEach(light => {
      // Create volumetric light cone
      const coneGeometry = new THREE.ConeGeometry(40, 80, 32, 32);
      
      // Custom material for volumetric effect
      const coneMaterial = new THREE.MeshStandardMaterial({
        color: light.color,
        transparent: true,
        opacity: light.intensity * 0.3,
        blending: THREE.AdditiveBlending,
        emissive: light.color,
        emissiveIntensity: light.intensity * 0.2,
        side: THREE.BackSide,
        wireframe: false
      });
      
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.copy(light.pos);
      cone.rotation.x = Math.PI / 2;
      cone.userData = {
        baseOpacity: light.intensity * 0.3,
        pulseSpeed: 0.5 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2
      };
      
      this.scene.add(cone);
      this.volumetricLights.push(cone);
    });
  }
  
  /**
   * Create 3-layer atmospheric fog system
   */
  createAtmosphericLayers() {
    const layers = [
      {
        name: 'groundMist',
        height: 1,
        color: new THREE.Color(0xd4a5ff),
        opacity: 0.08,
        size: 250
      },
      {
        name: 'midHaze',
        height: 25,
        color: new THREE.Color(0xccb5ff),
        opacity: 0.05,
        size: 300
      },
      {
        name: 'distantGlow',
        height: 50,
        color: new THREE.Color(0xffffee),
        opacity: 0.03,
        size: 350
      }
    ];
    
    layers.forEach(layer => {
      const geometry = new THREE.PlaneGeometry(layer.size, layer.size);
      const material = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false
      });
      
      const plane = new THREE.Mesh(geometry, material);
      plane.position.y = layer.height;
      plane.rotation.x = -Math.PI / 2;
      plane.userData = {
        layer: layer.name,
        baseOpacity: layer.opacity,
        pulseSpeed: 0.3
      };
      
      this.scene.add(plane);
      this.atmosphericLayers.push(plane);
    });
  }
  
  /**
   * Create holographic edge glow effect
   */
  createHolographicEdgeGlow() {
    // This is applied via material emission boost based on viewing angle
    // No additional geometry needed - works through existing materials
    
    // Create a subtle fresnel effect overlay
    const glowPass = {
      enabled: true,
      fresnelStrength: 0.3,
      glowColors: {
        cyan: 0x00ffff,
        violet: 0xaa99ff,
        magenta: 0xff00ff
      }
    };
    
    this.edgeGlowPass = glowPass;
  }
  
  /**
   * Update cinematic effects
   */
  update(deltaTime) {
    this.time += deltaTime;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Update volumetric lights pulsing
    this.volumetricLights.forEach(light => {
      const pulse = Math.sin(this.time * light.userData.pulseSpeed + light.userData.phase) * 0.5 + 0.5;
      light.material.opacity = light.userData.baseOpacity * (0.6 + pulse * 0.4);
      light.material.emissiveIntensity = pulse * 0.15;
    });
    
    // Update atmospheric layers
    this.atmosphericLayers.forEach(layer => {
      const pulse = Math.sin(this.time * layer.userData.pulseSpeed) * 0.5 + 0.5;
      layer.material.opacity = layer.userData.baseOpacity * (0.7 + pulse * 0.3);
    });
  }
  
  /**
   * Apply color grading to scene (post-processing simulation)
   */
  applyColorGrading(renderer) {
    // Cinematic color grading parameters
    const toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = 1.1;
    
    // Color balance adjustments
    const colorBalance = {
      shadows: new THREE.Vector3(1.0, 0.95, 1.05),      // Slight cyan in shadows
      midtones: new THREE.Vector3(1.0, 1.0, 1.0),       // Neutral
      highlights: new THREE.Vector3(1.05, 0.95, 0.95)   // Slight magenta in highlights
    };
    
    return colorBalance;
  }
  
  /**
   * Enhance bloom effect (post-processing)
   */
  getBloomSettings() {
    return {
      strength: 0.8,
      threshold: 0.2,
      radius: 0.4
    };
  }
  
  /**
   * Get exposure stabilization values
   */
  getExposureSettings() {
    return {
      baseExposure: 1.0,
      adaptationRate: 0.1,
      minExposure: 0.8,
      maxExposure: 1.3
    };
  }
  
  /**
   * Get depth-based fog layering
   */
  getDepthFogSettings() {
    return {
      near: 0.1,
      far: 200,
      color: 0xf0d8e8,
      density: 0.004,
      layers: [
        { distance: 50, opacity: 0.1, color: 0xf5e5f0 },
        { distance: 100, opacity: 0.2, color: 0xf0d8e8 },
        { distance: 150, opacity: 0.35, color: 0xe8c8e0 }
      ]
    };
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.volumetricLights.forEach(light => {
      this.scene.remove(light);
      light.geometry.dispose();
      light.material.dispose();
    });
    
    this.atmosphericLayers.forEach(layer => {
      this.scene.remove(layer);
      layer.geometry.dispose();
      layer.material.dispose();
    });
    
    this.volumetricLights = [];
    this.atmosphericLayers = [];
  }
}
