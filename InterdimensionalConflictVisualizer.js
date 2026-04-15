/**
 * InterdimensionalConflictVisualizer.js
 * ============================================================================
 * EPIC ORGANIC INTERDIMENSIONAL CONFLICT VISUALIZATION
 *
 * VIZUÁLNY FILM:
 * Organické, bio-luminescentné time-space rifty vznikajúce z konfliktu
 * medzi harmonic hubmi. Živé, tekuté portálové žiary pulzujúci životom.
 *
 * FÁZY KONFLIKTU:
 * 1. DETECTION: Jemné, nervové pulzy na halách, farebné dotyky
 * 2. ESCALATION: Organický portálový lúč sa formuje, intenzita rastie
 * 3. EXPLOSION: Masívny bio-luminescentný výbuch, rift sa otvorí
 * 4. RESIDUE: Zostatkové "zvyšky", pomalé rozplynutie v čase
 *
 * FARBY:
 * - Harmony: neónovo-modrá/cyán (0.2, 0.8, 1.0)
 * - Dominant: zlatá/žltá (1.0, 0.8, 0.2)
 * - Conflict: fialová/ružová (0.8, 0.3, 0.6)
 * - Rift: neonová zmes všetkých (chromatic distortion)
 *
 * ARCHITEKTÚRA:
 * ✅ Organické portálové lúče (sin wave, plynulé prechody)
 * ✅ Time-space rift particles (spadajú cez dimenzie)
 * ✅ Bio-luminescentné halá modifikácie
 * ✅ Fázový build-up systém
 * ✅ Performance-friendly (laptop + browser)
 * ✅ Deterministické (žiadna náhoda)
 * ✅ Čisto vizuálne (žiaden gameplay vplyv)
 *
 * TECHNIKY:
 * - Custom shader materiály pre organické efekty
 * - Particle pool pre efektívne častice
 * - Sin wave animácie pre "tekutý" pohyb
 * - Chromatic aberration pre time-space distorziu
 * - Gradientné prechody farieb
 * - Additive blending pre glow
 * - Soft fade out pre residues
 * ============================================================================
 */

import * as THREE from 'three';

/**
 * Konfiguračné konštanty
 */
const CONFLICT_PHASES = {
  DETECTION: {
    name: 'detection',
    threshold: 0.1,           // Minimálna intenzita pre detekciu
    haloPulseIntensity: 0.15, // Jemné pulzy na hale
    colorTint: 0.2,          // Jemný farebný nádech
    duration: 2.0,           // Trvanie fázy pred eskaláciou
    particleRate: 0,          // Žiadne častice ešte
    portalIntensity: 0.0      // Portal sa ešte neukazuje
  },
  ESCALATION: {
    name: 'escalation',
    threshold: 0.3,           // Intenzita pre eskaláciu
    haloPulseIntensity: 0.4,  // Silnejšie pulzy
    colorTint: 0.5,          // Výraznejšie farby
    duration: 4.0,           // Trvanie eskalácie
    particleRate: 2,         // Pomalý particle spawn
    portalIntensity: 0.3,    // Portal sa formuje
    portalGrowthSpeed: 0.4   // Rýchlosť rastu portálu
  },
  EXPLOSION: {
    name: 'explosion',
    threshold: 0.7,           // Intenzita pre výbuch
    haloPulseIntensity: 1.0,  // Maximálne pulzy
    colorTint: 1.0,          // Plné farby
    duration: 1.5,           // Krátky výbuch
    particleRate: 15,        // Masívny particle burst
    portalIntensity: 1.0,    // Plný portal
    shockwave: true          // Shockwave effect
  },
  RESIDUE: {
    name: 'residue',
    threshold: 0.4,           // Intenzita kedy residue začína
    haloPulseIntensity: 0.2,  // Slabé pulzy
    colorTint: 0.3,          // Vyblednuté farby
    duration: 6.0,           // Dlhé rozplynutie
    particleRate: 0.5,       // Zvyškové častice
    portalIntensity: 0.2,    // Portal mizne
    fadeSpeed: 0.15          // Rýchlosť fade out
  }
};

/**
 * Paleta farieb (RGB 0-1)
 */
const CONFLICT_COLORS = {
  harmony: { r: 0.2, g: 0.8, b: 1.0 },      // Neónovo-modrá/cyán
  dominant: { r: 1.0, g: 0.8, b: 0.2 },    // Zlatá/žltá
  conflict: { r: 0.8, g: 0.3, b: 0.6 },    // Fialová/ružová
  rift: { r: 0.5, g: 0.5, b: 1.0 },        // Rift blue-purple
  white: { r: 1.0, g: 1.0, b: 1.0 }        // White hot core
};

/**
 * Particle pre konfliktové efekty
 */
class ConflictParticle {
  constructor(position, velocity, color, lifetime, type = 'rift') {
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.color = new THREE.Color(color.r, color.g, color.b);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.type = type; // 'rift', 'burst', 'residue'
    this.size = Math.random() * 0.15 + 0.05;
    this.rotationSpeed = (Math.random() - 0.5) * 2.0;
    this.rotation = 0;
  }

  update(deltaTime) {
    this.lifetime -= deltaTime;

    // Gravity/rift effect
    if (this.type === 'rift') {
      this.velocity.y -= 0.5 * deltaTime; // Fall through rift
      this.velocity.x += (Math.random() - 0.5) * 0.2 * deltaTime; // Chaos
      this.velocity.z += (Math.random() - 0.5) * 0.2 * deltaTime;
    } else if (this.type === 'burst') {
      this.velocity.y += 0.3 * deltaTime; // Rise up
      this.velocity.multiplyScalar(0.98); // Drag
    } else if (this.type === 'residue') {
      this.velocity.multiplyScalar(0.95); // Heavy drag
    }

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.rotation += this.rotationSpeed * deltaTime;

    return this.lifetime > 0;
  }

  getAlpha() {
    return Math.max(0, this.lifetime / this.maxLifetime);
  }
}

/**
 * Portal beam - organický lúč medzi hubmi v konflikte
 */
class PortalBeam {
  constructor(hubA, hubB) {
    this.hubA = hubA;
    this.hubB = hubB;
    this.mesh = null;
    this.material = null;
    this.intensity = 0.0;
    this.phase = 0.0;
    this.frequency = 2.0;
    this.amplitude = 0.15;
    this.dominance = 0.0; // -1 (hubB dominates) to +1 (hubA dominates)

    this._createBeam();
  }

  _createBeam() {
    // Create tube geometry
    const path = new THREE.CatmullRomCurve3([
      this.hubA.position,
      this.hubB.position.clone().add(this.hubA.position).multiplyScalar(0.5),
      this.hubB.position
    ]);

    const geometry = new THREE.TubeGeometry(path, 32, 0.08, 8, false);

    // Organic bio-luminescent shader
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uDominance: { value: 0.0 },
        uColorA: { value: new THREE.Color(CONFLICT_COLORS.harmony.r, CONFLICT_COLORS.harmony.g, CONFLICT_COLORS.harmony.b) },
        uColorB: { value: new THREE.Color(CONFLICT_COLORS.dominant.r, CONFLICT_COLORS.dominant.g, CONFLICT_COLORS.dominant.b) },
        uConflictColor: { value: new THREE.Color(CONFLICT_COLORS.conflict.r, CONFLICT_COLORS.conflict.g, CONFLICT_COLORS.conflict.b) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uDominance;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDistFromCenter;

        void main() {
          vUv = uv;
          vPosition = position;

          // Sin wave distortion for organic movement
          float wave = sin(position.x * 3.0 + uTime * 2.0) * 0.1 +
                       sin(position.y * 2.5 + uTime * 1.8) * 0.1 +
                       sin(position.z * 3.5 + uTime * 2.3) * 0.1;

          vec3 distortedPosition = position + normal * wave * uIntensity;

          // Distance from center of beam (for radial gradient)
          float angle = atan(vPosition.y, vPosition.x);
          vDistFromCenter = abs(sin(angle * 6.0)); // 6-sided beam

          gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uDominance;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uConflictColor;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDistFromCenter;

        void main() {
          // Radial gradient (bright center, soft edges)
          float radialDist = abs(vUv.y - 0.5) * 2.0;
          float core = exp(-radialDist * radialDist * 8.0);
          float glow = exp(-radialDist * radialDist * 3.0) * 0.5;

          // Organic pulsing
          float pulse = sin(uTime * 3.0 + vUv.x * 10.0) * 0.5 + 0.5;
          float pulse2 = sin(uTime * 5.0 + vUv.x * 15.0) * 0.5 + 0.5;

          // Color blending based on dominance
          vec3 baseColor = mix(uColorA, uColorB, uDominance * 0.5 + 0.5);
          baseColor = mix(baseColor, uConflictColor, uIntensity * 0.3);

          // Add hot white core at high intensity
          vec3 hotCore = vec3(1.0) * core * uIntensity * 0.5;

          // Combine
          vec3 finalColor = baseColor * (glow + core * 0.5) * (0.8 + pulse * 0.2);
          finalColor += hotCore;

          // Shimmer
          float shimmer = sin(uTime * 8.0 + vUv.x * 20.0) * 0.1 + 0.9;
          finalColor *= shimmer;

          float alpha = (core + glow) * uIntensity * (0.7 + pulse2 * 0.3);

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
      customProgramCacheKey: () => 'ATM_CONFLICT_PORTAL_BEAM_v1'
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.visible = false;
  }

  update(deltaTime, intensity, dominance, time) {
    this.intensity = intensity;
    this.dominance = dominance;
    this.phase += deltaTime * this.frequency;

    // Update uniforms
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uDominance.value = dominance;

    // Update geometry (hubs might move)
    this.mesh.visible = intensity > 0.01;

    if (this.mesh.visible) {
      const path = new THREE.CatmullRomCurve3([
        this.hubA.position,
        this.hubB.position.clone().add(this.hubA.position).multiplyScalar(0.5),
        this.hubB.position
      ]);

      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.TubeGeometry(path, 32, 0.08, 8, false);
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
}

/**
 * Rift effect - time-space opening
 */
class RiftEffect {
  constructor(position) {
    this.position = position.clone();
    this.mesh = null;
    this.material = null;
    this.intensity = 0.0;
    this.scale = 0.0;

    this._createRift();
  }

  _createRift() {
    // Flat disc geometry
    const geometry = new THREE.CircleGeometry(1.0, 32);

    // Rift shader with chromatic distortion
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uScale: { value: 0.0 },
        uColor: { value: new THREE.Color(CONFLICT_COLORS.rift.r, CONFLICT_COLORS.rift.g, CONFLICT_COLORS.rift.b) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uScale;
        varying vec2 vUv;

        void main() {
          vUv = uv;

          // Organic edge distortion
          float dist = distance(uv, vec2(0.5));
          float wave = sin(dist * 20.0 - uTime * 3.0) * 0.05 * dist;

          vec3 pos = position;
          pos.x += wave;
          pos.y += wave;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * uScale, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          float dist = distance(vUv, vec2(0.5));

          // Radial gradient (bright center, dark edges)
          float core = exp(-dist * dist * 16.0);
          float glow = exp(-dist * dist * 4.0) * 0.5;

          // Chromatic distortion
          float rDist = dist + sin(uTime * 4.0) * 0.02;
          float gDist = dist + sin(uTime * 4.0 + 1.0) * 0.02;
          float bDist = dist + sin(uTime * 4.0 + 2.0) * 0.02;

          float rCore = exp(-rDist * rDist * 16.0);
          float gCore = exp(-gDist * gDist * 16.0);
          float bCore = exp(-bDist * bDist * 16.0);

          // Organic pulsing
          float pulse = sin(uTime * 5.0 + dist * 10.0) * 0.5 + 0.5;

          vec3 finalColor;
          finalColor.r = uColor.r * rCore * uIntensity;
          finalColor.g = uColor.g * gCore * uIntensity;
          finalColor.b = uColor.b * bCore * uIntensity;

          finalColor += vec3(1.0) * core * 0.3 * pulse * uIntensity;

          float alpha = (core + glow) * uIntensity * (0.6 + pulse * 0.4);

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
      customProgramCacheKey: () => 'ATM_CONFLICT_RIFT_v1'
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.x = -Math.PI / 2; // Face up
    this.mesh.visible = false;
  }

  update(deltaTime, intensity, scale, time) {
    this.intensity = intensity;
    this.scale = scale;

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uScale.value = scale;

    this.mesh.visible = intensity > 0.01;
    this.mesh.scale.setScalar(scale);
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
}

/**
 * Particle pool pre efektívne spravovanie častíc
 */
class ParticlePool {
  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.activeParticles = [];
  }

  spawn(position, velocity, color, lifetime, type = 'rift') {
    if (this.activeParticles.length >= this.maxParticles) {
      return null; // Pool full
    }

    const particle = new ConflictParticle(position, velocity, color, lifetime, type);
    this.activeParticles.push(particle);
    return particle;
  }

  update(deltaTime) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      if (!particle.update(deltaTime)) {
        this.activeParticles.splice(i, 1);
      }
    }
  }

  getActiveCount() {
    return this.activeParticles.length;
  }

  clear() {
    this.activeParticles = [];
  }
}

/**
 * Exportované konštanty pre použitie v iných moduloch
 */
export { CONFLICT_PHASES, CONFLICT_COLORS };

/**
 * Hlavný vizualizačný systém pre konflikty
 */
export class InterdimensionalConflictVisualizer {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled ?? true;
    this.debugMode = options.debugMode ?? false;

    // Portal beams
    this.portalBeams = new Map(); // hubPairHash → PortalBeam

    // Rift effects
    this.riftEffects = new Map(); // hubPairHash → RiftEffect

    // Particle system
    this.particlePool = new ParticlePool(options.maxParticles ?? 500);
    this.particleMaterial = null;

    // Conflict state tracking
    this.conflictStates = new Map(); // hubPairHash → { phase, phaseTime, intensity, dominance }

    // Time tracking
    this.totalTime = 0;

    // Initialize particle material
    this._initParticleMaterial();

    console.log('[InterdimensionalConflict] Initialized ✓');
  }

  _initParticleMaterial() {
    // Bio-luminescent particle shader
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 }
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
        varying vec2 vUv;

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);

          // Hot core + soft glow
          float core = exp(-dist * dist * 12.0);
          float glow = exp(-dist * dist * 4.0) * 0.5;

          // Organic shimmer
          float shimmer = sin(uTime * 6.0 + dist * 8.0) * 0.5 + 0.5;

          vec3 finalColor = vec3(1.0) * (core + glow);
          finalColor += shimmer * 0.15;

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
      customProgramCacheKey: () => 'ATM_CONFLICT_PARTICLE_v1'
    });
  }

  /**
   * Hash function pre hub pair
   */
  _getHubPairHash(hubA, hubB) {
    const idA = hubA.userData?.id || hubA.id || hubA.uuid || 'unknown';
    const idB = hubB.userData?.id || hubB.id || hubB.uuid || 'unknown';
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  }

  /**
   * Get conflict phase based on intensity and time
   */
  _getConflictPhase(intensity, state) {
    if (!state) {
      state = { phase: CONFLICT_PHASES.DETECTION, phaseTime: 0 };
    }

    // Phase transitions
    if (state.phase === CONFLICT_PHASES.DETECTION) {
      if (intensity >= CONFLICT_PHASES.ESCALATION.threshold) {
        return { phase: CONFLICT_PHASES.ESCALATION, phaseTime: 0 };
      }
    } else if (state.phase === CONFLICT_PHASES.ESCALATION) {
      if (intensity >= CONFLICT_PHASES.EXPLOSION.threshold) {
        return { phase: CONFLICT_PHASES.EXPLOSION, phaseTime: 0 };
      } else if (intensity < CONFLICT_PHASES.DETECTION.threshold) {
        return { phase: CONFLICT_PHASES.RESIDUE, phaseTime: 0 };
      }
    } else if (state.phase === CONFLICT_PHASES.EXPLOSION) {
      if (state.phaseTime >= CONFLICT_PHASES.EXPLOSION.duration) {
        return { phase: CONFLICT_PHASES.RESIDUE, phaseTime: 0 };
      }
    } else if (state.phase === CONFLICT_PHASES.RESIDUE) {
      if (intensity >= CONFLICT_PHASES.ESCALATION.threshold) {
        return { phase: CONFLICT_PHASES.ESCALATION, phaseTime: 0 };
      } else if (state.phaseTime >= CONFLICT_PHASES.RESIDUE.duration) {
        return { phase: CONFLICT_PHASES.DETECTION, phaseTime: 0 };
      }
    }

    return state;
  }

  /**
   * Spawn particles based on phase and intensity
   */
  _spawnParticles(center, phase, intensity, dominance, deltaTime) {
    const particleRate = phase.particleRate * intensity;
    const particlesToSpawn = Math.floor(particleRate * deltaTime * 60); // Normalize to 60fps

    for (let i = 0; i < particlesToSpawn; i++) {
      let color;
      let type;
      let velocity;

      if (phase === CONFLICT_PHASES.EXPLOSION) {
        // Burst particles
        color = CONFLICT_COLORS.dominant;
        type = 'burst';
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2.0,
          Math.random() * 1.5,
          (Math.random() - 0.5) * 2.0
        );
      } else if (phase === CONFLICT_PHASES.ESCALATION) {
        // Rift particles
        color = CONFLICT_COLORS.rift;
        type = 'rift';
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          -Math.random() * 0.5,
          (Math.random() - 0.5) * 0.3
        );
      } else {
        // Residue particles
        color = CONFLICT_COLORS.conflict;
        type = 'residue';
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );
      }

      const lifetime = type === 'burst' ? 1.5 : type === 'rift' ? 2.0 : 3.0;
      const spawnPos = center.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ));

      this.particlePool.spawn(spawnPos, velocity, color, lifetime, type);
    }
  }

  /**
   * Update conflict visualization
   */
  update(deltaTime, conflictRegions) {
    if (!this.enabled) return;

    this.totalTime += deltaTime;

    // Update particles
    this.particlePool.update(deltaTime);

    // Update each conflict region
    for (const [hash, region] of conflictRegions) {
      const { intensity, dominanceDirection, hub1, hub2, state } = region;

      if (intensity < CONFLICT_PHASES.DETECTION.threshold) {
        continue; // Too weak to visualize
      }

      // Get or create conflict state
      let conflictState = this.conflictStates.get(hash);
      conflictState = this._getConflictPhase(intensity, conflictState);
      conflictState.phaseTime += deltaTime;
      this.conflictStates.set(hash, conflictState);

      const phase = conflictState.phase;

      // Get or create portal beam
      let portalBeam = this.portalBeams.get(hash);
      if (!portalBeam && (phase === CONFLICT_PHASES.ESCALATION || phase === CONFLICT_PHASES.EXPLOSION)) {
        portalBeam = new PortalBeam(hub1, hub2);
        this.scene.add(portalBeam.mesh);
        this.portalBeams.set(hash, portalBeam);
      }

      // Update portal beam
      if (portalBeam) {
        const beamIntensity = phase.portalIntensity * intensity;
        const beamDominance = dominanceDirection;

        portalBeam.update(deltaTime, beamIntensity, beamDominance, this.totalTime);

        // Remove beam if too weak
        if (beamIntensity < 0.01 && phase === CONFLICT_PHASES.DETECTION) {
          this.scene.remove(portalBeam.mesh);
          portalBeam.dispose();
          this.portalBeams.delete(hash);
        }
      }

      // Get or create rift effect
      let riftEffect = this.riftEffects.get(hash);
      const center = region.centerPos || hub1.position.clone().add(hub2.position).multiplyScalar(0.5);

      if (!riftEffect && (phase === CONFLICT_PHASES.ESCALATION || phase === CONFLICT_PHASES.EXPLOSION)) {
        riftEffect = new RiftEffect(center);
        this.scene.add(riftEffect.mesh);
        this.riftEffects.set(hash, riftEffect);
      }

      // Update rift effect
      if (riftEffect) {
        const riftIntensity = phase.portalIntensity * intensity;
        const riftScale = 0.5 + intensity * 1.5;

        riftEffect.update(deltaTime, riftIntensity, riftScale, this.totalTime);

        // Remove rift if too weak
        if (riftIntensity < 0.01 && phase === CONFLICT_PHASES.DETECTION) {
          this.scene.remove(riftEffect.mesh);
          riftEffect.dispose();
          this.riftEffects.delete(hash);
        }
      }

      // Spawn particles
      this._spawnParticles(center, phase, intensity, dominanceDirection, deltaTime);

      // Update node visuals (halo pulsing, color tinting)
      this._updateNodeVisuals(hub1, phase, intensity, dominanceDirection);
      this._updateNodeVisuals(hub2, phase, intensity, -dominanceDirection);
    }

    // Cleanup removed conflicts
    this._cleanupConflicts(conflictRegions);
  }

  /**
   * Update node visuals (halo pulsing, color tinting)
   */
  _updateNodeVisuals(node, phase, intensity, dominance) {
    if (!node || !node.userData) return;

    // Store conflict data on node
    node.userData.conflictPulseIntensity = phase.haloPulseIntensity * intensity;
    node.userData.conflictColorTint = phase.colorTint * intensity;

    // Color mixing based on dominance
    let tintColor;
    if (dominance > 0.3) {
      tintColor = CONFLICT_COLORS.dominant;
    } else if (dominance < -0.3) {
      tintColor = CONFLICT_COLORS.conflict;
    } else {
      tintColor = CONFLICT_COLORS.harmony;
    }

    node.userData.conflictTintRGB = tintColor;
  }

  /**
   * Cleanup removed conflicts
   */
  _cleanupConflicts(activeRegions) {
    const activeHashes = new Set(activeRegions.keys());

    // Remove inactive portal beams
    for (const [hash, beam] of this.portalBeams) {
      if (!activeHashes.has(hash)) {
        this.scene.remove(beam.mesh);
        beam.dispose();
        this.portalBeams.delete(hash);
      }
    }

    // Remove inactive rift effects
    for (const [hash, rift] of this.riftEffects) {
      if (!activeHashes.has(hash)) {
        this.scene.remove(rift.mesh);
        rift.dispose();
        this.riftEffects.delete(hash);
      }
    }

    // Remove inactive conflict states
    for (const hash of this.conflictStates.keys()) {
      if (!activeHashes.has(hash)) {
        this.conflictStates.delete(hash);
      }
    }
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Dispose portal beams
    for (const [hash, beam] of this.portalBeams) {
      this.scene.remove(beam.mesh);
      beam.dispose();
    }
    this.portalBeams.clear();

    // Dispose rift effects
    for (const [hash, rift] of this.riftEffects) {
      this.scene.remove(rift.mesh);
      rift.dispose();
    }
    this.riftEffects.clear();

    // Dispose particle material
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }

    // Clear particles
    this.particlePool.clear();

    console.log('[InterdimensionalConflict] Disposed');
  }

  /**
   * Setup console API
   */
  setupConsoleAPI() {
    window.interdimensionalConflict = {
      enabled: () => {
        this.enabled = true;
        console.log('✓ Interdimensional Conflict enabled');
      },
      disabled: () => {
        this.enabled = false;
        console.log('✓ Interdimensional Conflict disabled');
      },
      getParticleCount: () => {
        console.log(`Active particles: ${this.particlePool.getActiveCount()}/${this.particlePool.maxParticles}`);
      },
      getPortalCount: () => {
        console.log(`Active portal beams: ${this.portalBeams.size}`);
      },
      getRiftCount: () => {
        console.log(`Active rift effects: ${this.riftEffects.size}`);
      },
      getStatus: () => {
        console.log(`
Interdimensional Conflict Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Active Conflicts: ${this.conflictStates.size}
  Portal Beams: ${this.portalBeams.size}
  Rift Effects: ${this.riftEffects.size}
  Active Particles: ${this.particlePool.getActiveCount()}/${this.particlePool.maxParticles}
  Total Time: ${this.totalTime.toFixed(1)}s
        `);
      },
      help: () => {
        console.log(`
Interdimensional Conflict Console API:
  interdimensionalConflict.enabled()           - Enable system
  interdimensionalConflict.disabled()          - Disable system
  interdimensionalConflict.getParticleCount()  - Show particle count
  interdimensionalConflict.getPortalCount()    - Show portal count
  interdimensionalConflict.getRiftCount()      - Show rift count
  interdimensionalConflict.getStatus()         - Show full status
  interdimensionalConflict.help()              - Show this help
        `);
      }
    };

    console.log('[InterdimensionalConflict] Debug API: window.interdimensionalConflict');
  }
}

/**
 * Integration function pre main.js
 */
export function setupInterdimensionalConflictSystem(game, options = {}) {
  try {
    const visualizer = new InterdimensionalConflictVisualizer(
      game.scene,
      {
        enabled: true,
        debugMode: false,
        maxParticles: 500,
        ...options
      }
    );

    // Setup console debugging
    visualizer.setupConsoleAPI();

    // Register with frame scheduler
    if (game.frameScheduler?.register) {
      if (game.frameScheduler?.isRegistered?.('visual.interdimensionalConflict')) {
        game.frameScheduler.unregister('visual.interdimensionalConflict');
      }

      game.frameScheduler.register('visual', (dt) => {
        if (!visualizer.enabled) return;

        // Get conflict regions from SynapticConflictAdaptiveResolution
        const conflictSystem = game.synapticConflict;
        if (!conflictSystem) return;

        const activeRegions = [];
        for (const [hash, region] of conflictSystem.conflictRegions) {
          if (region.intensity > CONFLICT_PHASES.DETECTION.threshold) {
            activeRegions.push([hash, region]);
          }
        }

        visualizer.update(dt, new Map(activeRegions));
      }, 'visual.interdimensionalConflict');
    }

    game.interdimensionalConflictVisualizer = visualizer;
    console.log('[InterdimensionalConflict] System initialized ✓');

    return visualizer;
  } catch (err) {
    console.warn('[InterdimensionalConflict] Failed to initialize:', err);
    return null;
  }
}
