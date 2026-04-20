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
  constructor(scene, options = {}) {
    this.scene = scene;

    // UNIFIED CLEANUP CONTRACT - Track all created objects
    this._createdObjects = [];

    this.frameScheduler = options.frameScheduler;
    this.semanticBus = options.semanticBus || globalThis?.semanticBus;

    this.config = {
      enabled: options.config?.enabled ?? true,
      maxParticles: options.config?.maxParticles ?? 2000,

      // Wavefront Particles
      wavefrontParticlesEnabled: options.config?.wavefrontParticlesEnabled ?? true,
      wavefrontParticlesPerRing: options.config?.wavefrontParticlesPerRing ?? 45,
      wavefrontParticleSpeed: options.config?.wavefrontParticleSpeed ?? 1.0,
      wavefrontParticleSize: options.config?.wavefrontParticleSize ?? 0.12,

      // Resonance Sparks
      resonanceSparksEnabled: options.config?.resonanceSparksEnabled ?? true,
      resonanceSparksPerWave: options.config?.resonanceSparksPerWave ?? 60,
      sparkLifetime: options.config?.sparkLifetime ?? 0.8,
      sparkGravity: options.config?.sparkGravity ?? 0.2,

      // Echo Trail Particles
      echoTrailEnabled: options.config?.echoTrailEnabled ?? true,
      echoTrailParticlesPerBeam: options.config?.echoTrailParticlesPerBeam ?? 25,
      echoTrailLifetime: options.config?.echoTrailLifetime ?? 0.5,
      echoTrailDrift: options.config?.echoTrailDrift ?? 0.01,

      // Interference Particles
      interferenceParticlesEnabled: options.config?.interferenceParticlesEnabled ?? true,
      interferenceParticlesPerHub: options.config?.interferenceParticlesPerHub ?? 35,
      interferenceOrbitSpeed: options.config?.interferenceOrbitSpeed ?? 0.8,
      interferenceOrbitRadius: options.config?.interferenceOrbitRadius ?? 1.2
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

    // Semantic event handlers
    this._semanticBus = null;
    this._semanticHandlers = null;

    this._initParticleSystems();
    this.bindSemanticEvents();
  }
  
  _initParticleSystems() {
    // Create particle geometry (quad)
    this._particleGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    
    // EPIC AETHER RINGS OF ETERNITY SHADER (ATM_AETHER_RINGS_v2)
    this._particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x4a0e4e) }, // Void purple base
        uInfluence: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uInfluence;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        // Fractal iteration for Mandelbrot-inspired patterns
        vec2 mandelbrot(vec2 z, vec2 c) {
          return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        }

        float fractalField(vec2 pos, float time) {
          vec2 z = vec2(0.0);
          vec2 c = pos * 2.0 - 1.0 + sin(time * 0.5) * 0.1;
          float iterations = 0.0;
          const int maxIter = 8;

          for(int i = 0; i < maxIter; i++) {
            z = mandelbrot(z, c);
            if(length(z) > 2.0) break;
            iterations += 1.0;
          }

          return iterations / float(maxIter);
        }

        // Quantum foam effect
        float quantumFoam(vec2 uv, float time) {
          float noise = 0.0;
          float scale = 8.0;
          for(int i = 0; i < 3; i++) {
            vec2 p = uv * scale + time * 0.3 * float(i + 1);
            noise += sin(p.x) * cos(p.y) / scale;
            scale *= 2.0;
          }
          return noise * 0.5 + 0.5;
        }

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);

          // Reality tear distortions
          float tear = sin(uTime * 3.0 + dist * 20.0) * 0.1;
          vec2 distortedUv = vUv + center * tear;

          // Fractal ring structure
          float fractal = fractalField(distortedUv, uTime);
          float ringPattern = sin(dist * 15.0 - uTime * 2.0) * 0.5 + 0.5;

          // Quantum tunneling effect
          float quantum = quantumFoam(vUv, uTime);
          float tunnel = exp(-dist * dist * 8.0) * quantum;

          // Dimensional rift
          float rift = exp(-abs(dist - 0.3) * 20.0) * sin(uTime * 4.0 + fractal * 10.0);

          // Energy tendrils reaching to infinity
          float tendrils = 0.0;
          for(float i = 0.0; i < 5.0; i++) {
            float angle = atan(center.y, center.x) + i * 1.2566; // 72 degrees
            float radial = sin(angle * 3.0 + uTime * 2.0) * 0.5 + 0.5;
            tendrils += exp(-abs(dist - radial * 0.4) * 15.0) * (1.0 - dist);
          }

          // Combine effects
          float core = tunnel + rift + tendrils * 0.3;
          float halo = exp(-dist * dist * 2.0) * 0.4;

          // Iridescent spectral colors
          vec3 spectralColor = vec3(
            0.5 + 0.5 * sin(uTime + fractal * 6.28),
            0.5 + 0.5 * sin(uTime + 2.094 + fractal * 6.28), // 120 degrees
            0.5 + 0.5 * sin(uTime + 4.188 + fractal * 6.28)  // 240 degrees
          );

          vec3 finalColor = mix(uColor, spectralColor, core * uInfluence);
          finalColor += vec3(1.0, 1.0, 0.8) * rift * 0.5; // White energy bursts

          float alpha = (core + halo) * uInfluence * (0.6 + quantum * 0.4);

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
      customProgramCacheKey: () => 'ATM_AETHER_RINGS_v2'
    });
    
    // Divine Essence Fragments Material
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
        
        float flowerOfLife(vec2 uv, float time) {
          float pattern = 0.0;
          // Central circle
          float center = exp(-length(uv) * 20.0);
          pattern += center;
          // Surrounding circles for Flower of Life
          for(int i = 0; i < 6; i++) {
            float angle = float(i) * 1.0472; // 60 degrees
            vec2 offset = vec2(cos(angle), sin(angle)) * 0.3;
            float circle = exp(-length(uv - offset) * 20.0);
            pattern += circle * 0.7;
          }
          // Additional layers
          for(int i = 0; i < 12; i++) {
            float angle = float(i) * 0.5236; // 30 degrees
            vec2 offset = vec2(cos(angle), sin(angle)) * 0.6;
            float circle = exp(-length(uv - offset) * 15.0);
            pattern += circle * 0.3;
          }
          return pattern;
        }
        
        float crystalFacet(vec2 uv, float time) {
          // Hexagonal crystal pattern
          float angle = atan(uv.y, uv.x);
          float radius = length(uv);
          // Hexagonal distance
          float hexAngle = angle / (3.14159 / 3.0);
          float hexRadius = radius * cos(mod(hexAngle, 1.0) - 0.5);
          float crystal = exp(-hexRadius * hexRadius * 30.0);
          // Facet edges
          float facet = sin(hexAngle * 6.0) * 0.5 + 0.5;
          crystal += facet * exp(-radius * radius * 10.0) * 0.2;
          return crystal;
        }
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Sacred geometry overlay
          float sacred = flowerOfLife(center, uTime) * uLifetime;
          
          // Crystal structure
          float crystal = crystalFacet(center, uTime) * (0.8 + sin(uTime * 3.0) * 0.2);
          
          // Holographic layers
          float hologram = 0.0;
          for(float i = 1.0; i <= 3.0; i++) {
            float layer = sin(uTime * 2.0 / i + dist * 10.0 / i) * 0.5 + 0.5;
            hologram += layer / i;
          }
          hologram *= 0.3;
          
          // Divine essence core
          float core = exp(-dist * dist * 25.0) * (1.0 + hologram);
          
          // Color evolution (gold to white divine)
          vec3 divineColor = mix(uColor, vec3(1.0, 1.0, 0.9), core);
          vec3 finalColor = divineColor + vec3(0.8, 0.6, 0.2) * sacred * 0.5;
          
          float alpha = (core + sacred + crystal * 0.5) * uLifetime;
          
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
      customProgramCacheKey: () => 'ATM_DIVINE_ESSENCE_v2'
    });
    
    // Whispering Echoes of the Ancients Material
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
        
        float ghostForm(vec2 uv, float time) {
          // Flowing robe shape
          float robe = 1.0 - abs(uv.x) * 2.0; // Vertical drape
          robe *= exp(-abs(uv.y + 0.2) * 4.0); // Bottom drape
          // Flowing motion
          robe += sin(uv.x * 10.0 + time * 2.0) * 0.1 * robe;
          return robe;
        }
        
        float ancientScript(vec2 uv, float time) {
          // Procedural glyph generation using noise
          float script = 0.0;
          float scale = 20.0;
          vec2 p = uv * scale;
          // Layer multiple frequencies
          for(int i = 0; i < 3; i++) {
            float freq = float(i + 1) * 2.0;
            script += sin(p.x * freq + time) * cos(p.y * freq + time * 0.7) / freq;
          }
          script = script * 0.5 + 0.5;
          // Make it glyph-like with thresholding
          script = smoothstep(0.3, 0.7, script);
          return script;
        }
        
        float memoryFragment(vec2 uv, float time) {
          // Floating symbols
          float fragment = 0.0;
          for(int i = 0; i < 5; i++) {
            vec2 offset = vec2(sin(float(i) * 1.2566 + time), cos(float(i) * 1.2566 + time)) * 0.3;
            float symbol = exp(-length(uv - offset) * 15.0);
            fragment += symbol;
          }
          return fragment;
        }
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          
          // Ghost form
          float ghost = ghostForm(center, uTime);
          
          // Ancient script overlay
          float script = ancientScript(center, uTime) * uLifetime;
          
          // Memory fragments
          float memory = memoryFragment(center, uTime) * (0.5 + uLifetime * 0.5);
          
          // Temporal distortion
          float distortion = sin(dist * 20.0 - uTime * 3.0) * 0.1;
          vec2 distortedUv = center + vec2(distortion);
          
          // Soft glow
          float glow = exp(-length(distortedUv) * length(distortedUv) * 8.0);
          
          // Color mixing
          vec3 ghostColor = mix(uColor, vec3(0.8, 0.9, 1.0), ghost);
          vec3 finalColor = ghostColor + vec3(0.2, 0.3, 0.5) * script;
          
          float alpha = (glow + ghost * 0.5 + memory * 0.3) * uLifetime;
          
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
      customProgramCacheKey: () => 'ATM_WHISPERING_ECHOES_v2'
    });
    
    // Harmonic Convergence Orbs Material
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
        
        float probabilityWave(vec2 uv, float time, float freq) {
          float wave = sin(length(uv) * freq - time * freq * 0.5) * 0.5 + 0.5;
          return wave;
        }
        
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          
          // Multi-reality layers
          float reality1 = probabilityWave(center, uTime, 10.0);
          float reality2 = probabilityWave(center, uTime * 1.3, 15.0);
          float reality3 = probabilityWave(center, uTime * 0.7, 8.0);
          
          // Layer opacity
          float layer1 = reality1 * exp(-dist * dist * 5.0);
          float layer2 = reality2 * exp(-dist * dist * 3.0) * 0.7;
          float layer3 = reality3 * exp(-dist * dist * 7.0) * 0.5;
          
          // Quantum superposition - multiple states visible
          float superposition = max(max(layer1, layer2), layer3);
          
          // Convergence core
          float core = exp(-dist * dist * 20.0);
          
          // Reality bridge connections
          float bridges = 0.0;
          for(int i = 0; i < 6; i++) {
            float bridgeAngle = float(i) * 1.0472;
            float bridge = exp(-abs(angle - bridgeAngle) * 5.0) * exp(-dist * 2.0);
            bridges += bridge;
          }
          
          // Color based on dominant reality
          vec3 color1 = uColor; // base
          vec3 color2 = vec3(0.8, 0.2, 0.8); // purple
          vec3 color3 = vec3(0.2, 0.8, 0.8); // cyan
          
          vec3 finalColor = color1 * layer1 + color2 * layer2 + color3 * layer3;
          finalColor = normalize(finalColor) * length(finalColor); // normalize mix
          finalColor += vec3(1.0) * core * 0.5;
          
          float alpha = (superposition + core + bridges * 0.2) * uIntensity;
          
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
      customProgramCacheKey: () => 'ATM_HARMONIC_CONVERGENCE_v2'
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
      particle.mesh.material.uniforms.uInfluence.value = influence;
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
      particle.mesh.material.uniforms.uInfluence.value = particle.influence * lifetimeRatio;
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
