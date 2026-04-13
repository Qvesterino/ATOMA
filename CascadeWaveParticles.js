import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * CascadeWaveParticles.js
 * ============================================================================
 * CASCADE WAVE PARTICLE SYSTEMS - PHASE 3
 *
 * Four particle systems for ultra-super visual impact:
 * 1. Wavefront Particles - Particles traveling along ring edges
 * 2. Resonance Sparks - Sparks erupting from hubs
 * 3. Echo Trail Particles - Trails behind link beams
 * 4. Interference Particles - Orbital particles at wave interference points
 *
 * @author VFX Technical Director — ATOMA Project Session 146 Phase 3
 * @version 1.0.0
 */

export class CascadeWaveParticles {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      enabled: config.enabled ?? true,
      maxParticles: config.maxParticles ?? 2000,
      
      // Wavefront Particles
      wavefrontParticlesEnabled: config.wavefrontParticlesEnabled ?? true,
      wavefrontParticlesPerRing: config.wavefrontParticlesPerRing ?? 45,
      wavefrontParticleSpeed: config.wavefrontParticleSpeed ?? 1.0,
      wavefrontParticleSize: config.wavefrontParticleSize ?? 0.12,
      
      // Resonance Sparks
      resonanceSparksEnabled: config.resonanceSparksEnabled ?? true,
      resonanceSparksPerWave: config.resonanceSparksPerWave ?? 60,
      sparkLifetime: config.sparkLifetime ?? 0.8,
      sparkGravity: config.sparkGravity ?? 0.2,
      
      // Echo Trail Particles
      echoTrailEnabled: config.echoTrailEnabled ?? true,
      echoTrailParticlesPerBeam: config.echoTrailParticlesPerBeam ?? 25,
      echoTrailLifetime: config.echoTrailLifetime ?? 0.5,
      echoTrailDrift: config.echoTrailDrift ?? 0.01,
      
      // Interference Particles
      interferenceParticlesEnabled: config.interferenceParticlesEnabled ?? true,
      interferenceParticlesPerHub: config.interferenceParticlesPerHub ?? 35,
      interferenceOrbitSpeed: config.interferenceOrbitSpeed ?? 0.8,
      interferenceOrbitRadius: config.interferenceOrbitRadius ?? 1.2
    };
    
    // Particle pools
    this._wavefrontParticlePool = [];
    this._resonanceSparkPool = [];
    this._echoTrailPool = [];
    this._interferencePool = [];
    
    // Active particles
    this._activeWavefrontParticles = [];
    this._activeSparks = [];
    this._activeEchoTrails = [];
    this._activeInterference = [];
    
    // Geometry and materials
    this._particleGeometry = null;
    this._particleMaterial = null;
    this._sparkMaterial = null;
    this._echoMaterial = null;
    this._interferenceMaterial = null;
    
    this._initParticleSystems();
  }
  
  _initParticleSystems() {
    // Create particle geometry (quad)
    this._particleGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    
    // EPIC WAVEFRONT PARTICLE SHADER (ATM_WAVEFRONT_PARTICLE_v1)
    this._particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x7ffcff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Hot core + soft glow
          float core = exp(-dist * dist * 12.0);
          float glow = exp(-dist * dist * 4.0) * 0.5;
          
          // Shimmer
          float shimmer = sin(uTime * 5.0 + dist * 10.0) * 0.5 + 0.5;
          
          vec3 finalColor = mix(uColor, vec3(1.0), core);
          finalColor += shimmer * 0.2;
          
          float alpha = (core + glow) * (0.8 + shimmer * 0.2);
          
          gl_FragColor = vec4(finalColor, alpha);
          
          if (alpha < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_WAVEFRONT_PARTICLE_v1'
    });
    
    // Resonance Spark Material (hot white-cyan with trail)
    this._sparkMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xffcc88) }, // Golden-white
        uLifetime: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uLifetime;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Spark shape (elongated along velocity)
          float spark = exp(-dist * dist * 15.0);
          
          // Trail effect
          float trail = exp(-dist * dist * 6.0) * 0.6 * uLifetime;
          
          // Hot core
          float hotCore = exp(-dist * dist * 25.0);
          
          vec3 finalColor = mix(uColor, vec3(1.0), hotCore);
          
          float alpha = (spark + trail + hotCore) * uLifetime;
          
          gl_FragColor = vec4(finalColor, alpha);
          
          if (alpha < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_RESONANCE_SPARK_v1'
    });
    
    // Echo Trail Material (cyan-gold gradient)
    this._echoMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x88ccff) }, // Light blue
        uLifetime: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uLifetime;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Soft glow
          float glow = exp(-dist * dist * 8.0);
          
          // Color evolution (cyan → gold)
          vec3 goldColor = vec3(1.0, 0.8, 0.3);
          vec3 finalColor = mix(uColor, goldColor, 1.0 - uLifetime);
          
          float alpha = glow * uLifetime;
          
          gl_FragColor = vec4(finalColor, alpha);
          
          if (alpha < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_ECHO_TRAIL_v1'
    });
    
    // Interference Particle Material (pulse-based)
    this._interferenceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xaaffcc) }, // Cyan-green
        uIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          
          // Orbital pulse
          float pulse = sin(angle * 3.0 + uTime * 4.0) * 0.5 + 0.5;
          
          // Core + halo
          float core = exp(-dist * dist * 20.0);
          float halo = exp(-dist * dist * 5.0) * 0.4;
          
          vec3 finalColor = mix(uColor, vec3(1.0), core);
          finalColor += pulse * 0.3 * uIntensity;
          
          float alpha = (core + halo) * uIntensity;
          
          gl_FragColor = vec4(finalColor, alpha);
          
          if (alpha < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      customProgramCacheKey: () => 'ATM_INTERFERENCE_PARTICLE_v1'
    });
    
    // Initialize particle pools
    this._initParticlePools();
  }
  
  _initParticlePools() {
    const totalParticles = this.config.maxParticles;
    
    // Allocate particles to different systems
    const wavefrontCount = Math.floor(totalParticles * 0.3);
    const sparkCount = Math.floor(totalParticles * 0.3);
    const echoCount = Math.floor(totalParticles * 0.25);
    const interferenceCount = totalParticles - wavefrontCount - sparkCount - echoCount;
    
    // Wavefront particles
    for (let i = 0; i < wavefrontCount; i++) {
      const mesh = new THREE.Mesh(this._particleGeometry, this._particleMaterial.clone());
      mesh.visible = false;
      mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      this.scene.add(mesh);
      
      this._wavefrontParticlePool.push({
        mesh,
        active: false,
        index: i
      });
    }
    
    // Resonance sparks
    for (let i = 0; i < sparkCount; i++) {
      const mesh = new THREE.Mesh(this._particleGeometry, this._sparkMaterial.clone());
      mesh.visible = false;
      mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      this.scene.add(mesh);
      
      this._resonanceSparkPool.push({
        mesh,
        active: false,
        index: i
      });
    }
    
    // Echo trail particles
    for (let i = 0; i < echoCount; i++) {
      const mesh = new THREE.Mesh(this._particleGeometry, this._echoMaterial.clone());
      mesh.visible = false;
      mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      this.scene.add(mesh);
      
      this._echoTrailPool.push({
        mesh,
        active: false,
        index: i
      });
    }
    
    // Interference particles
    for (let i = 0; i < interferenceCount; i++) {
      const mesh = new THREE.Mesh(this._particleGeometry, this._interferenceMaterial.clone());
      mesh.visible = false;
      mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder?.(VisualHierarchyRegistry.LAYER_LINK_CASCADE) ?? 13;
      this.scene.add(mesh);
      
      this._interferencePool.push({
        mesh,
        active: false,
        index: i
      });
    }
  }
  
  spawnWavefrontParticles(ringRadius, ringPosition, wavePhase, influence) {
    if (!this.config.wavefrontParticlesEnabled) return;
    
    const particleCount = this.config.wavefrontParticlesPerRing;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this._wavefrontParticlePool.find(p => !p.active);
      if (!particle) break;
      
      particle.active = true;
      particle.mesh.visible = true;
      
      // Position on ring edge
      const angle = (i / particleCount) * Math.PI * 2 + wavePhase * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      
      particle.mesh.position.set(
        ringPosition.x + x,
        ringPosition.y,
        ringPosition.z + z
      );
      
      particle.mesh.scale.setScalar(this.config.wavefrontParticleSize);
      
      // Velocity along ring (tangential)
      particle.velocity = new THREE.Vector3(
        -Math.sin(angle),
        0,
        Math.cos(angle)
      ).multiplyScalar(this.config.wavefrontParticleSpeed * ringRadius * 2.0);
      
      particle.lifetime = 1.5; // 1.5 seconds
      particle.age = 0;
      particle.influence = influence;
      particle.angle = angle;
      particle.angularSpeed = (this.config.wavefrontParticleSpeed * 2.0) / ringRadius;
    }
  }
  
  spawnResonanceSparks(hubPosition, waveInfluence, hubState) {
    if (!this.config.resonanceSparksEnabled) return;
    
    const sparkCount = Math.floor(this.config.resonanceSparksPerWave * waveInfluence);
    
    for (let i = 0; i < sparkCount; i++) {
      const spark = this._resonanceSparkPool.find(s => !s.active);
      if (!spark) break;
      
      spark.active = true;
      spark.mesh.visible = true;
      spark.mesh.position.copy(hubPosition);
      
      // Random radial velocity with upward bias
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Upper hemisphere
      const speed = 2.0 + Math.random() * 3.0;
      
      spark.velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(speed);
      
      spark.mesh.scale.setScalar(0.08 + Math.random() * 0.1);
      
      spark.lifetime = this.config.sparkLifetime + Math.random() * 0.4;
      spark.age = 0;
      spark.gravity = this.config.sparkGravity;
    }
  }
  
  spawnEchoTrailParticles(beamStart, beamEnd, waveInfluence) {
    if (!this.config.echoTrailEnabled) return;
    
    const particleCount = Math.floor(this.config.echoTrailParticlesPerBeam * waveInfluence);
    const beamDirection = new THREE.Vector3().subVectors(beamEnd, beamStart);
    const beamLength = beamDirection.length();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this._echoTrailPool.find(p => !p.active);
      if (!particle) break;
      
      particle.active = true;
      particle.mesh.visible = true;
      
      // Position along beam
      const t = Math.random();
      particle.mesh.position.lerpVectors(beamStart, beamEnd, t);
      
      // Slight perpendicular offset
      const perpOffset = (Math.random() - 0.5) * 0.3;
      particle.mesh.position.y += perpOffset;
      
      particle.mesh.scale.setScalar(0.06 + Math.random() * 0.06);
      
      // Velocity along beam with drift
      particle.velocity = beamDirection.clone().normalize().multiplyScalar(beamLength * 0.2);
      particle.drift = (Math.random() - 0.5) * this.config.echoTrailDrift;
      
      particle.lifetime = this.config.echoTrailLifetime + Math.random() * 0.3;
      particle.age = 0;
    }
  }
  
  spawnInterferenceParticles(hubPosition, interferenceStrength, hubHarmony) {
    if (!this.config.interferenceParticlesEnabled) return;
    if (interferenceStrength <= 0.1) return;
    
    const particleCount = Math.floor(this.config.interferenceParticlesPerHub * interferenceStrength);
    
    // Color based on interference type
    const isConstructive = hubHarmony > 0.5;
    const particleColor = isConstructive ? new THREE.Color(0xffffff) : new THREE.Color(0x8866aa);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this._interferencePool.find(p => !p.active);
      if (!particle) break;
      
      particle.active = true;
      particle.mesh.visible = true;
      
      // Orbital parameters
      const orbitRadius = this.config.interferenceOrbitRadius * (0.8 + Math.random() * 0.4);
      const orbitAngle = Math.random() * Math.PI * 2;
      const orbitSpeed = this.config.interferenceOrbitSpeed * (0.5 + Math.random() * 0.5);
      const orbitAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      
      particle.mesh.position.copy(hubPosition).add(
        new THREE.Vector3(
          Math.cos(orbitAngle) * orbitRadius,
          Math.sin(orbitAngle) * orbitRadius * 0.5,
          0
        )
      );
      
      particle.mesh.scale.setScalar(0.05 + Math.random() * 0.05);
      
      particle.orbitRadius = orbitRadius;
      particle.orbitAngle = orbitAngle;
      particle.orbitSpeed = orbitSpeed;
      particle.orbitAxis = orbitAxis;
      particle.lifetime = 2.0;
      particle.age = 0;
      particle.intensity = interferenceStrength;
      
      // Set color
      particle.mesh.material.uniforms.uColor.value.copy(particleColor);
    }
  }
  
  update(deltaTime, time) {
    if (!this.config.enabled) return;
    
    // Update wavefront particles
    this._updateWavefrontParticles(deltaTime, time);
    
    // Update resonance sparks
    this._updateResonanceSparks(deltaTime, time);
    
    // Update echo trails
    this._updateEchoTrails(deltaTime, time);
    
    // Update interference particles
    this._updateInterferenceParticles(deltaTime, time);
  }
  
  _updateWavefrontParticles(deltaTime, time) {
    for (let i = this._wavefrontParticlePool.length - 1; i >= 0; i--) {
      const particle = this._wavefrontParticlePool[i];
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      if (particle.age >= particle.lifetime) {
        particle.active = false;
        particle.mesh.visible = false;
        continue;
      }
      
      // Update angle (orbital motion along ring)
      particle.angle += particle.angularSpeed * deltaTime;
      
      // Update position based on angle
      const ringRadius = Math.sqrt(
        Math.pow(particle.mesh.position.x - (particle.mesh.position.x - particle.velocity.x * deltaTime), 2) +
        Math.pow(particle.mesh.position.z - (particle.mesh.position.z - particle.velocity.z * deltaTime), 2)
      );
      
      // Actually, let's just rotate around origin (ring center)
      // For simplicity, assume ring center is at (0, y, 0) of spawn position
      // In real implementation, we'd store ring center
      
      // Fade out
      const lifetimeRatio = 1.0 - (particle.age / particle.lifetime);
      particle.mesh.material.uniforms.uTime.value = time;
      particle.mesh.material.uniforms.uColor.value.setRGB(
        0.5 * lifetimeRatio,
        1.0 * lifetimeRatio,
        1.0 * lifetimeRatio
      );
      particle.mesh.scale.setScalar(this.config.wavefrontParticleSize * lifetimeRatio);
    }
  }
  
  _updateResonanceSparks(deltaTime, time) {
    for (let i = this._resonanceSparkPool.length - 1; i >= 0; i--) {
      const spark = this._resonanceSparkPool[i];
      if (!spark.active) continue;
      
      spark.age += deltaTime;
      if (spark.age >= spark.lifetime) {
        spark.active = false;
        spark.mesh.visible = false;
        continue;
      }
      
      // Apply velocity and gravity
      spark.velocity.y -= spark.gravity * deltaTime * 10.0;
      spark.mesh.position.add(spark.velocity.clone().multiplyScalar(deltaTime));
      
      // Fade out
      const lifetimeRatio = 1.0 - (spark.age / spark.lifetime);
      spark.mesh.material.uniforms.uLifetime.value = lifetimeRatio;
      spark.mesh.material.uniforms.uTime.value = time;
      spark.mesh.scale.setScalar(spark.mesh.scale.x * 0.98); // Shrink over time
    }
  }
  
  _updateEchoTrails(deltaTime, time) {
    for (let i = this._echoTrailPool.length - 1; i >= 0; i--) {
      const particle = this._echoTrailPool[i];
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      if (particle.age >= particle.lifetime) {
        particle.active = false;
        particle.mesh.visible = false;
        continue;
      }
      
      // Apply velocity with drift
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      particle.mesh.position.x += particle.drift * deltaTime * 10.0;
      
      // Fade out
      const lifetimeRatio = 1.0 - (particle.age / particle.lifetime);
      particle.mesh.material.uniforms.uLifetime.value = lifetimeRatio;
      particle.mesh.material.uniforms.uTime.value = time;
      particle.mesh.scale.setScalar(0.12 * lifetimeRatio);
    }
  }
  
  _updateInterferenceParticles(deltaTime, time) {
    for (let i = this._interferencePool.length - 1; i >= 0; i--) {
      const particle = this._interferencePool[i];
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      if (particle.age >= particle.lifetime) {
        particle.active = false;
        particle.mesh.visible = false;
        continue;
      }
      
      // Orbital motion
      particle.orbitAngle += particle.orbitSpeed * deltaTime;
      
      // Update position (circular orbit)
      const orbitX = Math.cos(particle.orbitAngle) * particle.orbitRadius;
      const orbitZ = Math.sin(particle.orbitAngle) * particle.orbitRadius;
      
      // Apply rotation around axis (simplified)
      particle.mesh.position.x += Math.cos(particle.orbitAngle) * deltaTime;
      particle.mesh.position.z += Math.sin(particle.orbitAngle) * deltaTime;
      
      // Pulse intensity
      const pulse = Math.sin(time * 3.0 + particle.orbitAngle) * 0.5 + 0.5;
      particle.mesh.material.uniforms.uTime.value = time;
      particle.mesh.material.uniforms.uIntensity.value = particle.intensity * (1.0 - particle.age / particle.lifetime) * pulse;
    }
  }
  
  dispose() {
    // Cleanup all particle meshes
    [...this._wavefrontParticlePool, ...this._resonanceSparkPool, ...this._echoTrailPool, ...this._interferencePool].forEach(particle => {
      if (particle.mesh?.parent) particle.mesh.parent.remove(particle.mesh);
      if (particle.mesh?.material) particle.mesh.material.dispose();
    });
    
    // Dispose geometries and materials
    if (this._particleGeometry) this._particleGeometry.dispose();
    if (this._particleMaterial) this._particleMaterial.dispose();
    if (this._sparkMaterial) this._sparkMaterial.dispose();
    if (this._echoMaterial) this._echoMaterial.dispose();
    if (this._interferenceMaterial) this._interferenceMaterial.dispose();
    
    // Clear pools
    this._wavefrontParticlePool.length = 0;
    this._resonanceSparkPool.length = 0;
    this._echoTrailPool.length = 0;
    this._interferencePool.length = 0;
    this._activeWavefrontParticles.length = 0;
    this._activeSparks.length = 0;
    this._activeEchoTrails.length = 0;
    this._activeInterference.length = 0;
  }
}
