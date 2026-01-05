import * as THREE from 'three';

/**
 * QuantumNode - QUANTUM Layer representation
 * Smooth central orb surrounded by holographic rings
 * Represents: superposition, wavefields, uncertainty
 */
export class QuantumNode {
  constructor(position = new THREE.Vector3(0, 0, 0), scale = 1.0) {
    this.position = position;
    this.scale = scale;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    
    // Animation state
    this.time = 0;
    this.orbitPhases = [];
    this.particleSystem = null;
    
    this.create();
  }
  
  /**
   * Create the complete Quantum Node
   */
  create() {
    // Central glowing sphere
    this.createCentralOrb();
    
    // Holographic rings at different angles
    this.createHolographicRings();
    
    // Particle filaments connecting the rings
    this.createParticleFilaments();
    
    // Optional distorted torus for instability
    this.createDistortionTorus();
  }
  
  /**
   * Create the central glowing energy sphere
   */
  createCentralOrb() {
    const geometry = new THREE.IcosahedronGeometry(0.5 * this.scale, 4);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x7744ff,
      emissive: 0x5533cc,
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 1.0
    });
    
    this.orb = new THREE.Mesh(geometry, material);
    this.group.add(this.orb);
    
    // Glowing point light at center
    const orbLight = new THREE.PointLight(0x7744ff, 1.0, 4 * this.scale);
    orbLight.position.copy(this.orb.position);
    this.group.add(orbLight);
    this.orbLight = orbLight;
    
    // Additional violet light for mystique
    const ambientGlow = new THREE.PointLight(0xaa66ff, 0.5, 3 * this.scale);
    ambientGlow.position.copy(this.orb.position);
    this.group.add(ambientGlow);
  }
  
  /**
   * Create holographic rings rotating at different angles
   */
  createHolographicRings() {
    const ringCount = 5;
    this.rings = [];
    
    const ringRadii = [
      0.75 * this.scale,
      1.0 * this.scale,
      1.3 * this.scale,
      1.6 * this.scale,
      1.2 * this.scale
    ];
    
    const rotationAxes = [
      { axis: 'x', angle: Math.PI / 3 },
      { axis: 'y', angle: 0 },
      { axis: 'z', angle: Math.PI / 2.5 },
      { axis: 'x', angle: Math.PI / 1.8 },
      { axis: 'y', angle: Math.PI / 4 }
    ];
    
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(
        ringRadii[i],
        0.06 * this.scale,
        16,
        48
      );
      
      // Gradient-like material with transparency
      const material = new THREE.MeshStandardMaterial({
        color: 0x5544ff,
        emissive: 0x7766ff,
        metalness: 0.5,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7 - i * 0.08
      });
      
      const ring = new THREE.Mesh(ringGeometry, material);
      
      // Apply rotation based on axis
      const axis = rotationAxes[i];
      if (axis.axis === 'x') {
        ring.rotation.x = axis.angle;
      } else if (axis.axis === 'y') {
        ring.rotation.y = axis.angle;
      } else {
        ring.rotation.z = axis.angle;
      }
      
      ring.userData = {
        rotationAxis: axis.axis,
        baseAngle: axis.angle,
        speed: 0.4 + i * 0.15,
        direction: i % 2 === 0 ? 1 : -1,
        originalOpacity: material.opacity
      };
      
      this.rings.push(ring);
      this.orbitPhases.push(Math.random() * Math.PI * 2);
      this.group.add(ring);
    }
  }
  
  /**
   * Create particle filaments connecting the rings
   */
  createParticleFilaments() {
    const filamentCount = 20;
    this.filaments = [];
    
    for (let i = 0; i < filamentCount; i++) {
      // Create line geometry for filament
      const geometry = new THREE.BufferGeometry();
      
      // Random connection between two rings
      const ringA = Math.floor(Math.random() * this.rings.length);
      const ringB = (ringA + 1 + Math.floor(Math.random() * 2)) % this.rings.length;
      
      const radiusA = this.rings[ringA].geometry.parameters.radius;
      const radiusB = this.rings[ringB].geometry.parameters.radius;
      
      const angleA = Math.random() * Math.PI * 2;
      const angleB = Math.random() * Math.PI * 2;
      
      const posA = new THREE.Vector3(
        Math.cos(angleA) * radiusA,
        Math.sin(angleA) * radiusA * 0.5,
        Math.sin(angleA) * radiusA
      );
      
      const posB = new THREE.Vector3(
        Math.cos(angleB) * radiusB,
        Math.sin(angleB) * radiusB * 0.5,
        Math.sin(angleB) * radiusB
      );
      
      const vertices = new Float32Array([
        posA.x, posA.y, posA.z,
        posB.x, posB.y, posB.z
      ]);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      
      const material = new THREE.LineBasicMaterial({
        color: 0x7755ff,
        emissive: 0x6644ff,
        transparent: true,
        opacity: 0.4,
        linewidth: 1
      });
      
      const line = new THREE.Line(geometry, material);
      
      line.userData = {
        ringA: ringA,
        ringB: ringB,
        angleA: angleA,
        angleB: angleB,
        radiusA: radiusA,
        radiusB: radiusB,
        pulse: Math.random() * Math.PI * 2
      };
      
      this.filaments.push(line);
      this.group.add(line);
    }
  }
  
  /**
   * Create distorted torus for instability effect
   */
  createDistortionTorus() {
    const geometry = new THREE.TorusGeometry(
      0.65 * this.scale,
      0.12 * this.scale,
      16,
      48
    );
    
    // Modify vertices for distortion
    const positions = geometry.attributes.position;
    this.distortionOffsets = new Float32Array(positions.array.length);
    
    for (let i = 0; i < positions.array.length; i += 3) {
      this.distortionOffsets[i] = (Math.random() - 0.5) * 0.1 * this.scale;
      this.distortionOffsets[i + 1] = (Math.random() - 0.5) * 0.1 * this.scale;
      this.distortionOffsets[i + 2] = (Math.random() - 0.5) * 0.1 * this.scale;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4433aa,
      emissive: 0x6644ff,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.5
    });
    
    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = Math.PI / 6;
    torus.rotation.z = Math.PI / 4;
    
    torus.userData = {
      distortionAmount: 0.02,
      distortionSpeed: 2.0,
      originalPositions: new Float32Array(positions.array)
    };
    
    this.distortionTorus = torus;
    this.group.add(torus);
  }
  
  /**
   * Update animation state
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Pulse the central orb
    const pulseFactor = 0.5 + 0.5 * Math.sin(this.time * 2.0);
    this.orb.scale.setScalar(1.0 + pulseFactor * 0.15);
    
    // Update orbital light intensity
    this.orbLight.intensity = 0.7 + pulseFactor * 0.5;
    
    // Update ring opacities - probabilistic wavering
    this.rings.forEach((ring, index) => {
      // Rotate each ring
      const data = ring.userData;
      const rotationAmount = data.speed * deltaTime * data.direction;
      
      if (data.rotationAxis === 'x') {
        ring.rotation.x += rotationAmount;
      } else if (data.rotationAxis === 'y') {
        ring.rotation.y += rotationAmount;
      } else {
        ring.rotation.z += rotationAmount;
      }
      
      // Vary opacity for uncertainty effect
      const opacityWaver = Math.sin(this.time * 1.5 + this.orbitPhases[index]) * 0.2;
      ring.material.opacity = data.originalOpacity + opacityWaver;
    });
    
    // Update filament pulses
    this.filaments.forEach((filament) => {
      const data = filament.userData;
      const pulse = Math.sin(this.time + data.pulse) * 0.3 + 0.5;
      filament.material.opacity = pulse * 0.6;
    });
    
    // Animate distortion torus
    if (this.distortionTorus) {
      const data = this.distortionTorus.userData;
      const positions = this.distortionTorus.geometry.attributes.position;
      
      for (let i = 0; i < positions.array.length; i += 3) {
        positions.array[i] = data.originalPositions[i] + 
          this.distortionOffsets[i] * Math.sin(this.time * data.distortionSpeed + i);
        positions.array[i + 1] = data.originalPositions[i + 1] + 
          this.distortionOffsets[i + 1] * Math.sin(this.time * data.distortionSpeed + i + 1);
        positions.array[i + 2] = data.originalPositions[i + 2] + 
          this.distortionOffsets[i + 2] * Math.sin(this.time * data.distortionSpeed + i + 2);
      }
      
      positions.needsUpdate = true;
      
      // Slow rotation
      this.distortionTorus.rotation.x += 0.1 * deltaTime;
      this.distortionTorus.rotation.z += 0.15 * deltaTime;
    }
    
    // Wobble the entire node slightly for uncertainty
    const wobble = Math.sin(this.time * 0.7) * 0.02 * this.scale;
    this.group.position.y = this.position.y + wobble;
  }
  
  /**
   * Get the THREE.Group for scene integration
   */
  getGroup() {
    return this.group;
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
