import * as THREE from 'three';

/**
 * TEMPORAL EVENT EFFECTS
 * 
 * Safe, purely visual effects triggered on temporal milestones.
 * Completely non-intrusive:
 * - No camera movement
 * - No geometry distortion
 * - No physics changes
 * - Auto-disables if conflicts detected
 */

export class TemporalEventEffects {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.enabled = true;
    this.metricBus = this._resolveMetricBus();
    
    // Epoch color shift
    this.epochShiftMaxIntensity = 0.08; // 8% color shift
    this.originalBackgroundColor = this.scene.background ? this.scene.background.clone() : null;
    
    // Temporal envelopes (attack / crest / release)
    this.effects = {
      epoch: {
        state: 'idle',
        elapsed: 0,
        durations: { attack: 0.4, crest: 0.6, release: 2.0 },
        intensity: 0
      },
      aeon: {
        state: 'idle',
        elapsed: 0,
        durations: { attack: 0.4, crest: 0.6, release: 2.0 },
        intensity: 0
      },
      hologram: {
        state: 'idle',
        elapsed: 0,
        durations: { attack: 0.8, crest: 1.2, release: 3.0 },
        intensity: 0
      }
    };

    this.aeonPulseGlyphs = [];
    this.neuralHolograms = [];
    this.temporalOverlayRoot = new THREE.Group();
    this.temporalOverlayRoot.name = 'TemporalEventEffects_TemporalOverlayRoot';
    this.temporalOverlayRoot.frustumCulled = false;
    this.scene.add(this.temporalOverlayRoot);

    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'TemporalEventEffects_EventOverlayGroup';
    this.overlayGroup.frustumCulled = false;
    this.temporalOverlayRoot.add(this.overlayGroup);

    this.hologramGroup = new THREE.Group();
    this.hologramGroup.name = 'TemporalEventEffects_NeuralHolograms';
    this.hologramGroup.frustumCulled = false;
    this.temporalOverlayRoot.add(this.hologramGroup);

    this.camera = this._resolveCamera();
    this.aeonOverlay = null;
    this.hologramShaderMaterial = null;

    this.temporalEventPresets = {
      epoch: {
        overlayColor: 0xe8fbff,
        glyphTypes: ['ring'],
        baseScale: 0.38,
        speedScale: 0.03,
        duration: 3.8
      },
      aeon: {
        overlayColor: 0xb8fff2,
        glyphTypes: ['crown', 'seal', 'thinPulseLine'],
        baseScale: 0.48,
        speedScale: 0.1,
        duration: 2.4
      },
      hologram: {
        planeCount: 8,
        radius: 12.0,
        height: 8.0,
        baseOpacity: 0.15,
        refractionStrength: 0.3,
        color: 0x88ddff,
        duration: 4.2
      }
    };

    this.pendingMetricTemporalEvents = {
      newEpoch: false,
      newAeon: false,
      neuralHologram: false,
    };

    this._setupMetricTriggers();
    this._initializeHologramShader();
  }

  _initializeHologramShader() {
    this.hologramShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        opacity: { value: 0.0 },
        refractionStrength: { value: 0.3 },
        hologramColor: { value: new THREE.Color(0x88ddff) },
        cameraPosition: { value: new THREE.Vector3() },
        hologramCenter: { value: new THREE.Vector3() },
        hologramRadius: { value: 12.0 },
        hologramHeight: { value: 8.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vViewDirection;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;

          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          vViewDirection = viewDirection;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform float refractionStrength;
        uniform vec3 hologramColor;
        uniform vec3 cameraPosition;
        uniform vec3 hologramCenter;
        uniform float hologramRadius;
        uniform float hologramHeight;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vViewDirection;

        // Noise functions for organic hologram patterns
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          // Distance from hologram center
          vec3 centerToPos = vWorldPosition - hologramCenter;
          float horizontalDist = length(centerToPos.xz);
          float verticalDist = abs(centerToPos.y);

          // Falloff based on distance
          float radiusFalloff = 1.0 - smoothstep(0.0, hologramRadius, horizontalDist);
          float heightFalloff = 1.0 - smoothstep(0.0, hologramHeight * 0.5, verticalDist);
          float totalFalloff = radiusFalloff * heightFalloff;

          // Fresnel for edge glow
          float fresnel = 1.0 - abs(dot(vViewDirection, vNormal));
          fresnel = pow(fresnel, 2.0);

          // Animated interference patterns
          vec2 noisePos = vWorldPosition.xz * 0.1 + time * 0.2;
          float pattern1 = fbm(noisePos);
          float pattern2 = fbm(noisePos * 1.5 + time * 0.1);

          // Neural network-inspired patterns
          float neuralPattern = sin(horizontalDist * 0.5 + time * 2.0) *
                               cos(verticalDist * 0.8 - time * 1.5) * 0.5 + 0.5;

          // Combine patterns
          float hologramIntensity = (pattern1 * 0.4 + pattern2 * 0.3 + neuralPattern * 0.3) * totalFalloff;

          // Refraction effect
          vec3 refractedColor = hologramColor;
          refractedColor += vec3(0.2, 0.1, 0.3) * fresnel * refractionStrength;

          // Depth scattering
          float depth = length(vWorldPosition - cameraPosition);
          float depthFade = 1.0 / (1.0 + depth * 0.01);

          // Final color with all effects
          vec3 finalColor = refractedColor * hologramIntensity * depthFade;
          float finalOpacity = opacity * hologramIntensity * fresnel * 0.8;

          gl_FragColor = vec4(finalColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }
  
  /**
   * Update temporal effects
   */
  update(deltaTime, temporalEvents) {
    if (!this.enabled) return;
    const mergedTemporalEvents = {
      newEpoch: Boolean(temporalEvents?.newEpoch || this.pendingMetricTemporalEvents.newEpoch),
      newAeon: Boolean(temporalEvents?.newAeon || this.pendingMetricTemporalEvents.newAeon),
      neuralHologram: Boolean(temporalEvents?.neuralHologram || this.pendingMetricTemporalEvents.neuralHologram),
    };

    if (mergedTemporalEvents.newEpoch) {
      this.triggerEpochShift();
      this.pendingMetricTemporalEvents.newEpoch = false;
    }
    if (mergedTemporalEvents.newAeon) {
      this.triggerAeonPulse();
      this.pendingMetricTemporalEvents.newAeon = false;
    }
    if (mergedTemporalEvents.neuralHologram) {
      this.triggerNeuralHologram();
      this.pendingMetricTemporalEvents.neuralHologram = false;
    }

    const activeEpoch = this.effects.epoch.state !== 'idle';
    const activeAeon = this.effects.aeon.state !== 'idle';
    const activeHologram = this.effects.hologram.state !== 'idle';
    if (!mergedTemporalEvents.newEpoch && !mergedTemporalEvents.newAeon && !mergedTemporalEvents.neuralHologram && !activeEpoch && !activeAeon && !activeHologram) return;

    this.updateEpochShift(deltaTime);
    this.updateAeonPulse(deltaTime);
    this.updateNeuralHologram(deltaTime);
    this.updateOverlayTransforms();
  }
  
  /**
   * Trigger epoch transition
   */
  triggerEpochShift() {
    this._startEnvelope('epoch');
  }
  
  /**
   * Update epoch transition
   */
  updateEpochShift(deltaTime) {
    const envelope = this.effects.epoch;
    if (envelope.state === 'idle') return;

    this._updateEnvelope(envelope, deltaTime);
    if (envelope.state === 'idle') {
      if (this.originalBackgroundColor && this.scene.background) {
        this.scene.background.copy(this.originalBackgroundColor);
      }
      this._removeEpochOverlay();
      return;
    }

    const intensity = envelope.intensity * this.epochShiftMaxIntensity;
    const phase = envelope.state === 'attack'
      ? envelope.elapsed / envelope.durations.attack
      : envelope.state === 'crest'
        ? 1.0
        : Math.max(0, 1 - (envelope.elapsed - envelope.durations.attack - envelope.durations.crest) / envelope.durations.release);

    const shiftedColor = this.originalBackgroundColor?.clone() || new THREE.Color(0x071820);
    shiftedColor.r = Math.min(1.0, shiftedColor.r + intensity * 0.2);
    shiftedColor.g = Math.min(1.0, shiftedColor.g + intensity * 0.35);
    shiftedColor.b = Math.min(1.0, shiftedColor.b + intensity * 0.65);
    if (this.scene.background) {
      this.scene.background.copy(shiftedColor);
    }

    this._updateEpochOverlay(intensity, phase);
  }
  
  /**
   * Trigger aeon pulse effect
   */
  triggerAeonPulse() {
    this._startEnvelope('aeon');
    this.createAeonGlyphs();
    this._ensureAeonOverlay();
  }
  
  /**
   * Create aeon glyph particles as camera-facing sprites
   */
  createAeonGlyphs() {
    try {
      this._cleanupAeonGlyphs();
      const preset = this.temporalEventPresets.aeon;
      const depth = -1.4;

      for (let i = 0; i < preset.glyphTypes.length; i++) {
        const type = preset.glyphTypes[i];
        const size = 28 + Math.random() * 20;
        const sprite = this._createGlyphSprite(type, size, preset.overlayColor);
        const offsetX = (i - 1.5) * 0.32 + (Math.random() - 0.5) * 0.1;
        const offsetY = 0.14 + Math.random() * 0.15;
        const basePosition = new THREE.Vector3(offsetX, offsetY, depth);

        sprite.position.copy(basePosition);
        sprite.scale.setScalar(preset.baseScale + size * 0.005);
        sprite.material.opacity = 0.0;
        this.overlayGroup.add(sprite);

        this.aeonPulseGlyphs.push({
          sprite,
          type,
          basePosition,
          baseScale: preset.baseScale + size * 0.005,
          offset: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3((Math.random() - 0.5) * preset.speedScale, -0.04 - Math.random() * 0.04, 0),
          age: 0,
          duration: preset.duration,
          baseOpacity: 0.7 + Math.random() * 0.18,
          rotationSpeed: (Math.random() - 0.5) * 1.5
        });
      }
    } catch (error) {
      console.warn('Error creating aeon glyphs:', error);
    }
  }
  
  /**
   * Update aeon pulse effect
   */
  updateAeonPulse(deltaTime) {
    const envelope = this.effects.aeon;
    if (envelope.state === 'idle') return;

    this._updateEnvelope(envelope, deltaTime);
    this.updateAeonGlyphs(deltaTime, envelope.intensity);
    this._updateAeonOverlay(envelope.intensity, envelope.state);

    if (envelope.state === 'idle') {
      this._cleanupAeonGlyphs();
      this._removeAeonOverlay();
    }
  }
  
  /**
   * Update aeon glyph particles
   */
  updateAeonGlyphs(deltaTime, intensity) {
    if (this.aeonPulseGlyphs.length === 0) return;

    const nextGlyphs = [];
    for (const glyph of this.aeonPulseGlyphs) {
      glyph.age += deltaTime;
      glyph.offset.addScaledVector(glyph.velocity, deltaTime * intensity);
      this._applyGlyphEnvelope(glyph, intensity, deltaTime);

      if (glyph.age < glyph.duration && glyph.sprite.material.opacity > 0.02) {
        nextGlyphs.push(glyph);
      } else {
        this._disposeSprite(glyph.sprite);
      }
    }
    this.aeonPulseGlyphs = nextGlyphs;
  }

  /**
   * Trigger neural hologram projection
   */
  triggerNeuralHologram() {
    this._startEnvelope('hologram');
    this.createNeuralHolograms();
  }

  /**
   * Create volumetric neural holograms
   */
  createNeuralHolograms() {
    try {
      this._cleanupNeuralHolograms();
      const preset = this.temporalEventPresets.hologram;

      // Get camera position for hologram placement
      const cameraPos = this.camera ? this.camera.position.clone() : new THREE.Vector3(0, 5, 10);
      const hologramCenter = cameraPos.clone().add(new THREE.Vector3(0, 2, -8));

      // Create multiple intersecting planes for volumetric effect
      for (let i = 0; i < preset.planeCount; i++) {
        const angle = (i / preset.planeCount) * Math.PI * 2;
        const heightOffset = (i - preset.planeCount * 0.5) * (preset.height / preset.planeCount);

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(preset.radius * 2, preset.height);

        // Position and rotate the plane
        const plane = new THREE.Mesh(geometry, this.hologramShaderMaterial.clone());
        plane.position.copy(hologramCenter);
        plane.position.y += heightOffset;

        // Rotate around Y axis for volumetric effect
        plane.rotation.y = angle;

        // Slight X rotation for more intersection
        plane.rotation.x = Math.sin(angle * 2) * 0.2;

        // Set shader uniforms
        plane.material.uniforms.hologramCenter.value.copy(hologramCenter);
        plane.material.uniforms.hologramRadius.value = preset.radius;
        plane.material.uniforms.hologramHeight.value = preset.height;
        plane.material.uniforms.hologramColor.value.setHex(preset.color);
        plane.material.uniforms.opacity.value = 0.0;

        plane.renderOrder = 20 + i; // Ensure proper layering
        plane.frustumCulled = false;

        this.hologramGroup.add(plane);

        this.neuralHolograms.push({
          mesh: plane,
          basePosition: hologramCenter.clone(),
          heightOffset: heightOffset,
          rotationAngle: angle,
          age: 0,
          duration: preset.duration,
          baseOpacity: preset.baseOpacity
        });
      }
    } catch (error) {
      console.warn('Error creating neural holograms:', error);
    }
  }

  /**
   * Update neural hologram effect
   */
  updateNeuralHologram(deltaTime) {
    const envelope = this.effects.hologram;
    if (envelope.state === 'idle') return;

    this._updateEnvelope(envelope, deltaTime);
    this.updateNeuralHolograms(deltaTime, envelope.intensity);

    if (envelope.state === 'idle') {
      this._cleanupNeuralHolograms();
    }
  }

  /**
   * Update individual neural holograms
   */
  updateNeuralHolograms(deltaTime, intensity) {
    if (this.neuralHolograms.length === 0) return;

    // Update camera position in shader
    if (this.camera) {
      this.neuralHolograms.forEach(hologram => {
        hologram.mesh.material.uniforms.cameraPosition.value.copy(this.camera.position);
      });
    }

    // Update shader time
    this.neuralHolograms.forEach(hologram => {
      hologram.mesh.material.uniforms.time.value += deltaTime;
      hologram.mesh.material.uniforms.opacity.value = hologram.baseOpacity * intensity;
    });

    // Animate hologram positions slightly
    this.neuralHolograms.forEach((hologram, index) => {
      hologram.age += deltaTime;

      // Subtle floating motion
      const floatOffset = Math.sin(hologram.age * 0.5 + index * 0.3) * 0.5;
      hologram.mesh.position.y = hologram.basePosition.y + hologram.heightOffset + floatOffset;

      // Very subtle rotation
      hologram.mesh.rotation.y = hologram.rotationAngle + Math.sin(hologram.age * 0.2) * 0.05;
    });
  }

  /**
   * Clean up neural holograms
   */
  _cleanupNeuralHolograms() {
    this.neuralHolograms.forEach(hologram => {
      if (hologram.mesh) {
        this.hologramGroup.remove(hologram.mesh);
        hologram.mesh.geometry.dispose();
        hologram.mesh.material.dispose();
      }
    });
    this.neuralHolograms = [];
  }

  /**
   * Start a common temporal envelope
   */
  _startEnvelope(name) {
    const envelope = this.effects[name];
    if (!envelope) return;
    envelope.state = 'attack';
    envelope.elapsed = 0;
    envelope.intensity = 0;
  }

  _applyGlyphEnvelope(glyph, intensity, deltaTime) {
    if (!glyph || !glyph.sprite) return;
    glyph.sprite.material.opacity = glyph.baseOpacity * intensity;
    const scale = glyph.baseScale * (1 + intensity * 0.55);
    glyph.sprite.scale.setScalar(scale);
    glyph.sprite.material.rotation += deltaTime * glyph.rotationSpeed;
    glyph.sprite.position.copy(glyph.basePosition).add(glyph.offset);
  }

  _updateEnvelope(envelope, deltaTime) {
    envelope.elapsed += deltaTime;
    const { attack, crest, release } = envelope.durations;
    const total = attack + crest + release;

    if (envelope.elapsed < attack) {
      envelope.state = 'attack';
      envelope.intensity = envelope.elapsed / attack;
    } else if (envelope.elapsed < attack + crest) {
      envelope.state = 'crest';
      envelope.intensity = 1;
    } else if (envelope.elapsed < total) {
      envelope.state = 'release';
      envelope.intensity = 1 - ((envelope.elapsed - attack - crest) / release);
    } else {
      envelope.state = 'idle';
      envelope.intensity = 0;
    }
  }

  _resolveCamera() {
    if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__) return window.__ATOMA_CAMERA__;
    if (typeof globalThis !== 'undefined' && globalThis.__ATOMA_CAMERA__) return globalThis.__ATOMA_CAMERA__;
    return null;
  }
  
  _createGlyphSprite(type, size, colorHex) {
    const canvas = document.createElement('canvas');
    const dimension = 128;
    canvas.width = dimension;
    canvas.height = dimension;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dimension, dimension);

    const color = new THREE.Color(colorHex || 0x99e1ff);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const radial = ctx.createRadialGradient(dimension / 2, dimension / 2, 4, dimension / 2, dimension / 2, dimension / 2);
    radial.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
    radial.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.22)`);
    radial.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, dimension, dimension);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = dimension / 2;
    const cy = dimension / 2;
    const radius = dimension * 0.22;

    switch (type) {
      case 'ring':
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'crown':
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.9, cy + radius * 0.2);
        ctx.lineTo(cx - radius * 0.45, cy - radius * 0.3);
        ctx.lineTo(cx - radius * 0.15, cy + radius * 0.05);
        ctx.lineTo(cx + radius * 0.15, cy - radius * 0.3);
        ctx.lineTo(cx + radius * 0.45, cy + radius * 0.05);
        ctx.lineTo(cx + radius * 0.9, cy - radius * 0.3);
        ctx.lineTo(cx + radius * 0.9, cy + radius * 0.25);
        ctx.lineTo(cx - radius * 0.9, cy + radius * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx - radius * 0.45, cy - radius * 0.3, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(cx + radius * 0.45, cy - radius * 0.3, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'seal':
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'thinPulseLine':
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - radius * 1.1, cy);
        ctx.lineTo(cx - radius * 0.3, cy);
        ctx.lineTo(cx - radius * 0.1, cy - radius * 0.35);
        ctx.lineTo(cx + radius * 0.1, cy + radius * 0.25);
        ctx.lineTo(cx + radius * 0.8, cy);
        ctx.stroke();
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(cx - radius * 0.3, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + radius * 0.8, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(colorHex || 0x99e1ff)
    });
    return new THREE.Sprite(material);
  }

  _updateEpochOverlay(intensity, phase) {
    if (intensity <= 0) return;
    if (!this.epochOverlay) {
      this.epochOverlay = this._createEpochOverlay();
      this.overlayGroup.add(this.epochOverlay);
    }

    const preset = this.temporalEventPresets.epoch;
    this.epochOverlay.material.color.setHex(preset.overlayColor);
    this.epochOverlay.material.opacity = Math.min(0.18, intensity * 0.22);
    const scale = 2.5 + phase * 0.9;
    this.epochOverlay.scale.set(scale, scale, 1);
  }

  _createEpochOverlay() {
    const canvas = document.createElement('canvas');
    const dimension = 256;
    canvas.width = dimension;
    canvas.height = dimension;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, dimension, dimension);
    const cx = dimension / 2;
    const cy = dimension / 2;
    const outer = dimension * 0.35;
    const inner = dimension * 0.28;

    const gradient = ctx.createRadialGradient(cx, cy, inner * 0.7, cx, cy, outer);
    gradient.addColorStop(0, 'rgba(232, 251, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(232, 251, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimension, dimension);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 0.05, -1.3);
    sprite.scale.set(2.4, 2.4, 1);
    return sprite;
  }

  _removeEpochOverlay() {
    if (!this.epochOverlay) return;
    this._disposeSprite(this.epochOverlay);
    this.epochOverlay = null;
  }

  _ensureAeonOverlay() {
    if (this.aeonOverlay) return;
    this.aeonOverlay = this._createAeonOverlay();
    this.overlayGroup.add(this.aeonOverlay);
  }

  _updateAeonOverlay(intensity, state) {
    if (!this.aeonOverlay) return;
    this.aeonOverlay.material.opacity = Math.min(0.38, intensity * 0.45);
    const scale = 1.6 + (state === 'attack' ? intensity * 0.4 : 0.65);
    this.aeonOverlay.scale.set(scale, scale, 1);
    this.aeonOverlay.material.color.setHex(0xffffff);
  }

  _removeAeonOverlay() {
    if (!this.aeonOverlay) return;
    this._disposeSprite(this.aeonOverlay);
    this.aeonOverlay = null;
  }

  _createAeonOverlay() {
    const canvas = document.createElement('canvas');
    const dimension = 256;
    canvas.width = dimension;
    canvas.height = dimension;
    const ctx = canvas.getContext('2d');

    const cx = dimension / 2;
    const cy = dimension / 2;
    const outer = dimension * 0.35;
    const inner = dimension * 0.16;

    const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(0, 0, dimension, dimension);

    ctx.strokeStyle = 'rgba(128, 95, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(184, 255, 242, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - outer * 0.7, cy);
    ctx.lineTo(cx - outer * 0.2, cy - outer * 0.5);
    ctx.lineTo(cx, cy + outer * 0.15);
    ctx.lineTo(cx + outer * 0.2, cy - outer * 0.5);
    ctx.lineTo(cx + outer * 0.7, cy);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 0.05, -1.25);
    sprite.scale.set(1.8, 1.8, 1);
    return sprite;
  }

  updateOverlayTransforms() {
    if (!this.temporalOverlayRoot) return;
    if (!this.camera) {
      this.camera = this._resolveCamera();
    }
    if (!this.camera) return;

    this.temporalOverlayRoot.position.copy(this.camera.position);
    this.temporalOverlayRoot.quaternion.copy(this.camera.quaternion);
  }

  _cleanupAeonGlyphs() {
    for (const glyph of this.aeonPulseGlyphs) {
      this._disposeSprite(glyph.sprite);
    }
    this.aeonPulseGlyphs = [];
  }

  _disposeSprite(sprite) {
    if (!sprite) return;
    if (sprite.material) {
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    }
    if (sprite.parent) {
      sprite.parent.remove(sprite);
    }
  }

  /**
   * Enable temporal effects
   */
  enable() {
    this.enabled = true;
    if (this.overlayGroup) {
      this.overlayGroup.visible = true;
    }
  }
  
  /**
   * Disable temporal effects
   */
  disable() {
    this.enabled = false;
    
    if (this.originalBackgroundColor && this.scene.background) {
      this.scene.background.copy(this.originalBackgroundColor);
    }
    if (this.overlayGroup) {
      this.overlayGroup.visible = false;
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    this.disable();
    this._cleanupAeonGlyphs();
    this._cleanupNeuralHolograms();
    this._removeEpochOverlay();
    if (this.overlayGroup && this.overlayGroup.parent) {
      this.overlayGroup.parent.remove(this.overlayGroup);
    }
    if (this.temporalOverlayRoot && this.temporalOverlayRoot.parent) {
      this.temporalOverlayRoot.parent.remove(this.temporalOverlayRoot);
    }
    this.overlayGroup = null;
    this.temporalOverlayRoot = null;
    this.camera = null;
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupMetricTriggers() {
    this._subscribeMetricTag('global.harmony.high', () => {
      this.pendingMetricTemporalEvents.newEpoch = true;
    });
    this._subscribeMetricTag('global.synergy.high', () => {
      this.pendingMetricTemporalEvents.newAeon = true;
    });
  }

  _subscribeMetricTag(eventName, handler) {
    const bus = this.metricBus;
    if (!bus || !eventName || typeof handler !== 'function') return;

    if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe(eventName, handler);
    }
  }
}
