import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

/**
 * ============================================================================
 * COGNITIVE HORIZON PLANE (Session 112)
 * ============================================================================
 * A semi-transparent dream-like reference plane that provides spatial context
 * without being a physical terrain.
 * 
 * VISUAL DESIGN:
 * - Subtle procedural grid/lattice pattern
 * - Slow energy waves across surface
 * - Soft glow gradients toward horizon
 * - Very faint node reflections
 * - Deep blue to teal with cyan/violet hints
 * - Semi-transparent, minimal emissive
 * 
 * FUNCTIONAL ROLE:
 * - Provides scale and orientation
 * - Anchors nodes in shared dream-space
 * - Never visually competes with nodes
 * - Feels like collective subconscious surface
 */

export class CognitiveHorizonPlane {
  constructor(parent, camera) {
    this.parent = parent;
    this.camera = camera;
    this.time = 0;
    this._timeOrigin = undefined;
    
    // Plane configuration
    this.config = {
      size: 300,
      segments: 128,
      distortion: 0.15,
      waveSpeed: 0.08,
      waveAmplitude: 0.02,
      opacity: 0.25,
      emissiveIntensity: 0.1,
      gridOpacity: 0.08,
      reflectionOpacity: 0.05
    };
    
    // Create materials
    this.materials = this.createMaterials();
    
    // Create plane
    this.planeGroup = new THREE.Group();
    this.createHorizonPlane();
    this.createGridOverlay();
    this.createGlowGradient();
    
    this.parent.add(this.planeGroup);
  }
  
  /**
   * Create custom shader materials for the horizon
   */
  createMaterials() {
    // Main horizon plane material with wave distortion
    const horizonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveAmplitude: { value: this.config.waveAmplitude },
        waveSpeed: { value: this.config.waveSpeed },
        baseColor: { value: new THREE.Color(0x0a3a52) },
        horizonColor: { value: new THREE.Color(0x1a5a7a) },
        grayScale: { value: 1.0 },
        cameraDistance: { value: 1.0 }
      },
      vertexShader: `
        uniform float time;
        uniform float waveAmplitude;
        uniform float waveSpeed;
        
        varying float vDistance;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          // Wave distortion (very subtle)
          float wave1 = sin(position.x * 0.03 + time * waveSpeed) * 0.5;
          float wave2 = cos(position.z * 0.03 + time * waveSpeed * 0.7) * 0.5;
          float wave3 = sin((position.x + position.z) * 0.02 + time * waveSpeed * 0.5) * 0.5;
          
          vec3 displaced = position;
          displaced.y += (wave1 + wave2 + wave3) * waveAmplitude;
          
          // Distance from center (for horizon fade)
          vDistance = length(position.xz) / 150.0;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 horizonColor;
        uniform float grayScale;
        
        varying float vDistance;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Fade gradient from center to horizon
          float centerFade = smoothstep(0.0, 1.0, vDistance);
          
          // Blend colors based on distance
          vec3 color = mix(baseColor, horizonColor, centerFade);
          
          // Add very subtle grid pattern in the distance
          float gridX = mod(vPosition.x * 0.15, 1.0);
          float gridZ = mod(vPosition.z * 0.15, 1.0);
          float grid = smoothstep(0.48, 0.5, gridX) + smoothstep(0.48, 0.5, gridZ);
          grid = grid * 0.03 * (1.0 - centerFade); // Grid fades away near camera
          
          color += grid * vec3(0.0, 0.3, 0.4); // Subtle cyan tint
          
          // Horizon glow (very subtle)
          float horizonGlow = smoothstep(1.0, 0.7, centerFade) * 0.08;
          color += horizonGlow * horizonColor * 0.5;
          
          // Opacity varies with distance
          float opacity = mix(0.15, 0.35, centerFade);
          
          gl_FragColor = vec4(color, opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    // Grid overlay material (subtle lattice)
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        gridOpacity: { value: this.config.gridOpacity }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          vPosition = position;
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float gridOpacity;
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          // Procedural grid pattern
          float gridScale = 0.08;
          float gridX = mod(vPosition.x * gridScale, 1.0);
          float gridZ = mod(vPosition.z * gridScale, 1.0);
          
          // Smooth lines
          float lineX = smoothstep(0.48, 0.5, gridX);
          float lineZ = smoothstep(0.48, 0.5, gridZ);
          float grid = max(lineX, lineZ);
          
          // Fade grid with distance
          float distanceFade = smoothstep(150.0, 0.0, vDistance);
          grid *= distanceFade;
          
          // Cyan-ish grid color
          vec3 gridColor = vec3(0.0, 0.4, 0.5);
          
          float opacity = grid * gridOpacity * 0.6;
          
          gl_FragColor = vec4(gridColor, opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    // Glow gradient material (soft horizon glow)
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
        varying float vDistance;
        
        void main() {
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float vDistance;
        
        void main() {
          // Glow only near horizon
          float glow = smoothstep(150.0, 50.0, vDistance) * 0.15;
          
          gl_FragColor = vec4(glowColor, glow);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    return {
      horizon: horizonMaterial,
      grid: gridMaterial,
      glow: glowMaterial
    };
  }
  
  /**
   * Create the main horizon plane
   */
  createHorizonPlane() {
    // ========== DEBUG: MASSIVE PLANE FOR VISIBILITY ==========
    const DEBUG_SIZE = 500; // EXTREMELY LARGE for debugging
    const DEBUG_SEGMENTS = 32; // Reduced for perf
    const DEBUG_Y_POSITION = -10; // CLEARLY BELOW camera/nodes
    
    const geometry = new THREE.PlaneGeometry(
      DEBUG_SIZE,
      DEBUG_SIZE,
      DEBUG_SEGMENTS,
      DEBUG_SEGMENTS
    );
    
    // Apply subtle vertex distortion
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Subtle curvature toward horizon
      const distance = Math.sqrt(x * x + z * z) / (DEBUG_SIZE * 0.5);
      const curve = Math.pow(distance, 2) * 0.08; // Very subtle curve
      
      positions.setY(i, -curve);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // DEBUG: Use ultra-obvious material temporarily
    const debugMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff, // MAGENTA - impossible to miss
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      wireframe: false
    });
    
    const plane = new THREE.Mesh(geometry, debugMaterial);
    plane.rotation.x = -Math.PI / 2; // Explicit flat rotation
    plane.position.y = DEBUG_Y_POSITION; // Clearly below
    plane.userData = { 
      isCognitiveHorizon: true,
      isDebugPlane: true
    };
    plane.renderOrder = -200; // Render far behind everything
    plane.layers.set(0); // Default layer
    
    console.log(`[DEBUG PLANE] Horizon plane created`);
    console.log(`[DEBUG PLANE] Size: ${DEBUG_SIZE}x${DEBUG_SIZE}`);
    console.log(`[DEBUG PLANE] Position: (0, ${DEBUG_Y_POSITION}, 0)`);
    console.log(`[DEBUG PLANE] Rotation: (${plane.rotation.x.toFixed(3)}, ${plane.rotation.y.toFixed(3)}, ${plane.rotation.z.toFixed(3)})`);
    console.log(`[DEBUG PLANE] Material: color=0xff00ff opacity=0.5 transparent=true`);
    console.log(`[DEBUG PLANE] Geometry vertices: ${geometry.attributes.position.count}`);
    
    this.planeGroup.add(plane);
    this.horizonPlane = plane;
    
    console.log(`[DEBUG PLANE] ✓ Added to planeGroup`);
    console.log(`[DEBUG PLANE] PlaneGroup children: ${this.planeGroup.children.length}`);
  }
  
  /**
   * Create subtle grid overlay
   */
  createGridOverlay() {
    const geometry = new THREE.PlaneGeometry(
      this.config.size,
      this.config.size,
      this.config.segments,
      this.config.segments
    );
    
    const grid = new THREE.Mesh(geometry, this.materials.grid);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -0.49; // Slightly above horizon plane
    grid.userData = { isGridOverlay: true };
    grid.renderOrder = -199;
    
    this.planeGroup.add(grid);
    this.gridMesh = grid;
  }
  
  /**
   * Create glow gradient effect
   */
  createGlowGradient() {
    const geometry = new THREE.PlaneGeometry(
      this.config.size,
      this.config.size,
      32,
      32
    );
    
    const glow = new THREE.Mesh(geometry, this.materials.glow);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.48; // Slightly above grid
    glow.userData = { isGlowGradient: true };
    glow.renderOrder = -198;
    
    this.planeGroup.add(glow);
    this.glowMesh = glow;
  }
  
  /**
   * Animate the horizon plane
   */
  animate(deltaTime, time) {
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    this.time = currentTime;

    // Update horizon shader uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.time.value = currentTime;
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
    }
    
    // Update grid shader uniforms
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.time.value = currentTime;
    }
    
    // Very subtle rotation for dreamlike quality
    const slowRotation = currentTime * 0.005; // Extremely slow
    this.planeGroup.rotation.z = slowRotation;
  }
  
  /**
   * Update configuration
   */
  setConfig(configUpdate) {
    Object.assign(this.config, configUpdate);
    
    // Update uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
    }
    
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.gridOpacity.value = this.config.gridOpacity;
    }
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * React to nearby nodes (slight glow intensification)
   */
  reactToNodes(nodes, influenceRadius = 30) {
    if (!nodes || nodes.length === 0) return;
    
    // Find nodes within influence radius
    let maxInfluence = 0;
    
    for (const node of nodes) {
      if (!node.position) continue;
      
      const distance = Math.sqrt(
        node.position.x ** 2 + node.position.z ** 2
      );
      
      if (distance < influenceRadius) {
        const influence = 1 - (distance / influenceRadius);
        maxInfluence = Math.max(maxInfluence, influence);
      }
    }
    
    // Modulate wave amplitude based on nearby node activity
    const targetAmplitude = 0.02 + maxInfluence * 0.03;
    this.config.waveAmplitude += (targetAmplitude - this.config.waveAmplitude) * 0.05;
    
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    if (this.horizonPlane) {
      this.horizonPlane.geometry.dispose();
    }
    if (this.gridMesh) {
      this.gridMesh.geometry.dispose();
    }
    if (this.glowMesh) {
      this.glowMesh.geometry.dispose();
    }
    
    for (const material of Object.values(this.materials)) {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    }
  }
}

/**
 * Console API for debugging and live parameter adjustment
 */
export function setupCognitiveHorizonConsoleAPI(horizonPlane) {
  window.CognitiveHorizonDebug = {
    /**
     * Get current configuration
     */
    getConfig() {
      return horizonPlane.getConfig();
    },
    
    /**
     * Update configuration
     */
    setConfig(configUpdate) {
      horizonPlane.setConfig(configUpdate);
      console.log('🌊 Cognitive Horizon config updated:', configUpdate);
    },
    
    /**
     * Set wave speed
     */
    setWaveSpeed(speed) {
      horizonPlane.setConfig({ waveSpeed: speed });
      console.log(`🌊 Wave speed: ${speed}`);
    },
    
    /**
     * Set wave amplitude
     */
    setWaveAmplitude(amplitude) {
      horizonPlane.setConfig({ waveAmplitude: amplitude });
      console.log(`🌊 Wave amplitude: ${amplitude}`);
    },
    
    /**
     * Set opacity
     */
    setOpacity(opacity) {
      horizonPlane.setConfig({ opacity });
      console.log(`🌊 Opacity: ${opacity}`);
    },
    
    /**
     * Set grid opacity
     */
    setGridOpacity(gridOpacity) {
      horizonPlane.setConfig({ gridOpacity });
      console.log(`🌊 Grid opacity: ${gridOpacity}`);
    },
    
    /**
     * Enable/disable wave animation
     */
    enableWaves(enabled) {
      horizonPlane.setConfig({ waveSpeed: enabled ? 0.08 : 0 });
      console.log(`🌊 Waves ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    /**
     * Reset to defaults
     */
    reset() {
      horizonPlane.setConfig({
        waveSpeed: 0.08,
        waveAmplitude: 0.02,
        opacity: 0.25,
        gridOpacity: 0.08
      });
      console.log('🌊 Cognitive Horizon reset to defaults');
    }
  };
  
  console.log('🌊 Cognitive Horizon Console API ready: window.CognitiveHorizonDebug');
}
