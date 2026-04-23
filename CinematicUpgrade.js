import * as THREE from 'three';

/**
 * CinematicUpgrade - Premium Cinematic Visual Enhancement Layer
 *
 * This is the HIGH-tier visual upgrade that adds effects ON TOP of
 * VisualUpgradeSuperpack (MEDIUM tier). It does NOT duplicate the
 * superpack's volumetric lights, fog, or camera aura.
 *
 * Unique effects provided:
 * - Floating dust field (camera-proximate orbiting particles)
 * - Holographic edge glow (camera-attached cinematic halo)
 * - Real post-processing parameter modulation (bloom, vignette, chromatic)
 * - Metrics-reactive color temperature and exposure
 * - Smooth fade transitions when toggled
 *
 * Performance: All per-frame allocations are cached.
 */
function collectDescendants(root, predicate, out = []) {
  if (!root) return out;
  if (predicate(root)) out.push(root);
  if (root.children && root.children.length) {
    for (const child of root.children) {
      collectDescendants(child, predicate, out);
    }
  }
  return out;
}

export class CinematicUpgrade {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Cached vectors — zero per-frame allocations
    this._vec3a = new THREE.Vector3();
    this._vec3b = new THREE.Vector3();

    // Effect containers (only unique effects, no duplication with Superpack)
    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.sharedTextures = {};
    this.time = 0;

    // Smooth fade
    this._fadeOpacity = 1;
    this._targetOpacity = 1;
    this._fadeSpeed = 2.5; // opacity units per second

    // Metrics reactivity (smoothed)
    this._metrics = {
      harmony: 0.5,
      corruption: 0,
      synergy: 0.5,
      stability: 0.5
    };

    // Post-processing integration
    this._renderer = null;
    this._postProcessing = null;
    this._baseExposure = 0.98;
    this.nodeShadersEnabled = true;
    this.qualityTier = 'HIGH';
    this._qualityProfile = this._getQualityProfile(this.qualityTier);
  }

  /**
   * Apply cinematic enhancements (unique effects only)
   */
  initialize() {
    this.createFloatingDustField();
    this.createHolographicEdgeGlow();
    this._syncNodeShaderVisibility();
  }

  // ============================================================
  // TEXTURE HELPERS
  // ============================================================

  _toRgba(color, alpha) {
    const rgb = new THREE.Color(color);
    return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${alpha})`;
  }

  _createRadialGradientTexture(textureKey, stops, size = 256) {
    if (this.sharedTextures[textureKey]) {
      return this.sharedTextures[textureKey];
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const gradient = context.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.02,
      size * 0.5,
      size * 0.5,
      size * 0.5
    );

    stops.forEach(([offset, color, alpha]) => {
      gradient.addColorStop(offset, this._toRgba(color, alpha));
    });

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    this.sharedTextures[textureKey] = texture;
    return texture;
  }

  _disposeObject3D(object3D) {
    if (!object3D) return;

    object3D.traverse((child) => {
      if (child.geometry && typeof child.geometry.dispose === 'function') {
        child.geometry.dispose();
      }

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (material && typeof material.dispose === 'function') {
            material.dispose();
          }
        });
      } else if (child.material && typeof child.material.dispose === 'function') {
        child.material.dispose();
      }
    });
  }

  _syncNodeShaderVisibility() {
    const enabled = this._targetOpacity > 0 && this.nodeShadersEnabled !== false;

    if (typeof window !== 'undefined') {
      window.ATOMA_VFX_ENABLE_HOLOGRAM_SHELL = enabled;
      window.ATOMA_VFX_ENABLE_NODE_EDGE_GLOW = enabled;
    }

    const shells = collectDescendants(
      this.scene,
      (child) => child?.isMesh === true && (
        child.userData?.isHologramShell === true ||
        child.userData?.isNeonEdgeGlow === true
      )
    );

    shells.forEach((shell) => {
      shell.visible = enabled;
    });

    return enabled;
  }

  _getQualityProfile(level = 'HIGH') {
    const normalized = typeof level === 'string' ? level.toUpperCase() : 'HIGH';

    const profiles = {
      LOW: {
        rendererExposure: 0.94,
        dustCount: 24,
        dustOpacity: 0.1,
        dustScale: 0.9,
        haloOpacity: 0.86,
        haloScale: 0.94,
        haloDepth: -2.85,
        haloAccentOpacity: 0,
        haloAccentScale: 1,
        bloomStrength: 0.9,
        bloomThreshold: 0.28,
        bloomRadius: 0.38,
        vignetteStrength: 0.18,
        chromaticStrength: 0.0003
      },
      MEDIUM: {
        rendererExposure: 1.0,
        dustCount: 30,
        dustOpacity: 0.15,
        dustScale: 1.0,
        haloOpacity: 0.98,
        haloScale: 1.0,
        haloDepth: -2.7,
        haloAccentOpacity: 0,
        haloAccentScale: 1,
        bloomStrength: 1.02,
        bloomThreshold: 0.2,
        bloomRadius: 0.48,
        vignetteStrength: 0.22,
        chromaticStrength: 0.00045
      },
      HIGH: {
        rendererExposure: 1.14,
        dustCount: 40,
        dustOpacity: 0.22,
        dustScale: 1.2,
        haloOpacity: 1.35,
        haloScale: 1.12,
        haloDepth: -2.05,
        haloAccentOpacity: 1.8,
        haloAccentScale: 1.6,
        bloomStrength: 1.2,
        bloomThreshold: 0.14,
        bloomRadius: 0.62,
        vignetteStrength: 0.28,
        chromaticStrength: 0.00095
      }
    };

    return profiles[normalized] || profiles.HIGH;
  }

  setQualityTier(level = 'HIGH') {
    const normalized = typeof level === 'string' ? level.toUpperCase() : 'HIGH';
    if (normalized === 'LOW') {
      this.qualityTier = 'LOW';
    } else if (normalized === 'MEDIUM') {
      this.qualityTier = 'MEDIUM';
    } else {
      this.qualityTier = 'HIGH';
    }

    this._qualityProfile = this._getQualityProfile(this.qualityTier);

    if (this._renderer) {
      this._baseExposure = this._qualityProfile.rendererExposure;
      this._renderer.toneMappingExposure = this._baseExposure;
    }

    if (this.edgeGlowPass?.group) {
      this.edgeGlowPass.group.position.z = this._qualityProfile.haloDepth;
    }

    return this.qualityTier;
  }

  // ============================================================
  // UNIQUE EFFECT: FLOATING DUST FIELD
  // ============================================================

  /**
   * Create a subtle floating dust field around the camera
   */
  createFloatingDustField() {
    const dustTexture = this._createRadialGradientTexture('dustField', [
      [0.0, 0xffffff, 0.9],
      [0.2, 0xffffff, 0.42],
      [0.55, 0xffffff, 0.08],
      [1.0, 0xffffff, 0.0]
    ], 128);

    const profile = this._qualityProfile || this._getQualityProfile(this.qualityTier);
    const dustColors = [0xffffff, 0xbefcff, 0xe9d8ff, 0xfff0fb];
    const dustCount = profile.dustCount;
    const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);

    for (let index = 0; index < dustCount; index++) {
      const color = dustColors[index % dustColors.length];
      const material = new THREE.SpriteMaterial({
        map: dustTexture || null,
        color,
        transparent: true,
        opacity: profile.dustOpacity * (0.82 + Math.random() * 0.56),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false
      });

      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 18;
      sprite.position.set(
        cameraPosition.x + (Math.random() - 0.5) * 70,
        cameraPosition.y + (Math.random() - 0.4) * 30,
        cameraPosition.z + (Math.random() - 0.5) * 70
      );
      sprite.scale.setScalar((0.45 + Math.random() * 0.95) * profile.dustScale);
      sprite.userData = {
        orbitPhase: Math.random() * Math.PI * 2,
        orbitRadius: 18 + Math.random() * 26,
        orbitHeight: (Math.random() - 0.5) * 18,
        orbitSpeed: 0.015 + Math.random() * 0.03,
        pulseSpeed: 0.8 + Math.random() * 0.7,
        verticalDrift: 1.1 + Math.random() * 1.4,
        baseScale: (0.45 + Math.random() * 0.95) * profile.dustScale,
        baseOpacity: material.opacity,
        phaseOffset: Math.random() * Math.PI * 2
      };

      this.scene.add(sprite);
      this.dustParticles.push(sprite);
    }
  }

  // ============================================================
  // UNIQUE EFFECT: HOLOGRAPHIC EDGE GLOW (camera-attached)
  // ============================================================

  /**
   * Create holographic edge glow effect attached to camera
   */
  createHolographicEdgeGlow() {
    const profile = this._qualityProfile || this._getQualityProfile(this.qualityTier);
    const haloTexture = this._createRadialGradientTexture('edgeHalo', [
      [0.0, 0xffffff, 0.0],
      [0.28, 0xffffff, 0.0],
      [0.42, 0xffffff, 0.95],
      [0.56, 0xffffff, 0.22],
      [0.74, 0xffffff, 0.0],
      [1.0, 0xffffff, 0.0]
    ], 256);

    const auraTexture = this._createRadialGradientTexture('edgeAura', [
      [0.0, 0xffffff, 0.6],
      [0.25, 0xffffff, 0.24],
      [0.75, 0xffffff, 0.05],
      [1.0, 0xffffff, 0.0]
    ], 256);

    const glowGroup = new THREE.Group();
    glowGroup.name = 'CinematicEdgeGlow';
    glowGroup.position.set(0, 0, profile.haloDepth);
    glowGroup.renderOrder = 9999;
    glowGroup.userData = {
      phase: Math.random() * Math.PI * 2
    };

    const makeSprite = (texture, color, opacity, scale, offset) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture || null,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false
      }));
      sprite.scale.set(scale[0], scale[1], scale[2]);
      sprite.position.set(offset[0], offset[1], offset[2]);
      sprite.userData = {
        baseOpacity: opacity,
        baseScale: new THREE.Vector3(scale[0], scale[1], scale[2]),
        phase: Math.random() * Math.PI * 2
      };
      return sprite;
    };

    const centralGlow = makeSprite(auraTexture, 0x8fffff, 0.14, [2.6, 2.6, 1], [0, 0, 0]);
    const violetHalo = makeSprite(haloTexture, 0xffa6f0, 0.1, [2.0, 2.0, 1], [0.12, -0.08, 0]);
    const cyanSplit = makeSprite(auraTexture, 0x69f7ff, 0.08, [1.5, 1.5, 1], [-0.16, 0.1, 0]);
    const outerBloom = makeSprite(auraTexture, 0xffffff, 0.08, [10.6, 10.6, 1], [0, 0, 0]);
    outerBloom.userData.accent = true;

    glowGroup.add(centralGlow);
    glowGroup.add(violetHalo);
    glowGroup.add(cyanSplit);
    glowGroup.add(outerBloom);

    if (this.camera) {
      this.camera.add(glowGroup);
    } else {
      this.scene.add(glowGroup);
    }

    this.edgeGlowPass = {
      enabled: true,
      fresnelStrength: 0.3,
      glowColors: {
        cyan: 0x00ffff,
        violet: 0xaa99ff,
        magenta: 0xff00ff
      },
      group: glowGroup,
      sprites: [centralGlow, violetHalo, cyanSplit, outerBloom]
    };
  }

  // ============================================================
  // POST-PROCESSING INTEGRATION
  // ============================================================

  /**
   * Apply color grading to renderer and store reference
   */
  applyColorGrading(renderer) {
    this._renderer = renderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._baseExposure = (this._qualityProfile || this._getQualityProfile(this.qualityTier)).rendererExposure;
    renderer.toneMappingExposure = this._baseExposure;
  }

  /**
   * Connect to the shared post-processing pipeline for real effect modulation
   */
  setPostProcessing(pipeline) {
    this._postProcessing = pipeline;
  }

  // ============================================================
  // METRICS REACTIVITY
  // ============================================================

  /**
   * Receive live metrics from the game loop.
   * Expected shape: { harmony, corruption, synergy, stability } (all 0..1)
   */
  setMetrics(metrics) {
    if (!metrics) return;
    if (metrics.harmony !== undefined) this._metrics.harmony = metrics.harmony;
    if (metrics.corruption !== undefined) this._metrics.corruption = metrics.corruption;
    if (metrics.synergy !== undefined) this._metrics.synergy = metrics.synergy;
    if (metrics.stability !== undefined) this._metrics.stability = metrics.stability;
  }

  // ============================================================
  // VISIBILITY WITH SMOOTH FADE
  // ============================================================

  /**
   * Toggle visibility with smooth fade transition
   */
  setVisible(visible) {
    this._targetOpacity = visible ? 1 : 0;
    this._syncNodeShaderVisibility();
    if (visible) {
      // Immediately make objects visible so fade-in is visible
      this.dustParticles.forEach(p => { p.visible = true; });
      if (this.edgeGlowPass?.group) this.edgeGlowPass.group.visible = true;
    }
  }

  /**
   * Check if effects are targeted to be visible
   */
  isVisible() {
    return this._targetOpacity > 0;
  }

  setNodeShadersEnabled(enabled = true) {
    this.nodeShadersEnabled = !!enabled;
    this._syncNodeShaderVisibility();
    return this.nodeShadersEnabled;
  }

  // ============================================================
  // UPDATE LOOP
  // ============================================================

  /**
   * Update cinematic effects with metrics reactivity and smooth fade
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;

    this.time += deltaTime;

    // --- Smooth fade interpolation ---
    if (Math.abs(this._fadeOpacity - this._targetOpacity) > 0.001) {
      const direction = this._targetOpacity > this._fadeOpacity ? 1 : -1;
      this._fadeOpacity += direction * this._fadeSpeed * deltaTime;
      this._fadeOpacity = Math.max(0, Math.min(1, this._fadeOpacity));

      // Hide objects when fully faded out
      if (this._fadeOpacity <= 0) {
        this.dustParticles.forEach(p => { p.visible = false; });
        if (this.edgeGlowPass?.group) this.edgeGlowPass.group.visible = false;
        return; // Skip rest of update when invisible
      } else {
        this.dustParticles.forEach(p => { p.visible = true; });
        if (this.edgeGlowPass?.group) this.edgeGlowPass.group.visible = true;
      }
    }

    const fade = this._fadeOpacity;
  const quality = this._qualityProfile || this._getQualityProfile(this.qualityTier);

    // --- Metrics-driven parameters ---
    const { harmony, corruption, synergy, stability } = this._metrics;
    const pulseMultiplier = 1 + (1 - stability) * 0.3; // faster with instability

    // --- Renderer exposure modulation ---
    if (this._renderer) {
      const targetExposure = this._baseExposure + synergy * 0.08 - corruption * 0.06;
      this._renderer.toneMappingExposure += (targetExposure - this._renderer.toneMappingExposure) * 0.02;
    }

    // --- Post-processing parameter modulation ---
    if (this._postProcessing?.updateParams) {
      this._postProcessing.updateParams({
        strength: quality.bloomStrength + synergy * 0.4,
        threshold: quality.bloomThreshold + corruption * 0.1,
        vignetteStrength: quality.vignetteStrength + corruption * 0.15,
        chromaticStrength: quality.chromaticStrength + (1 - stability) * 0.001
      });
    }

    // --- Camera position (cached vector, zero allocation) ---
    const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);

    // --- Update floating dust field ---
    this.dustParticles.forEach(particle => {
      const phase = particle.userData.orbitPhase + this.time * particle.userData.orbitSpeed * pulseMultiplier;
      const pulse = Math.sin(this.time * particle.userData.pulseSpeed + particle.userData.phaseOffset) * 0.5 + 0.5;
      const radius = particle.userData.orbitRadius + Math.sin(this.time * 0.33 + particle.userData.phaseOffset) * 2.2;
      const height = particle.userData.orbitHeight + Math.cos(this.time * 0.28 + particle.userData.phaseOffset) * particle.userData.verticalDrift;

      particle.position.x = cameraPosition.x + Math.cos(phase) * radius;
      particle.position.y = cameraPosition.y + height;
      particle.position.z = cameraPosition.z + Math.sin(phase) * radius;
      particle.material.opacity = particle.userData.baseOpacity * quality.dustOpacity * (0.42 + pulse * 0.58) * fade;
      particle.scale.setScalar(particle.userData.baseScale * quality.dustScale * (0.65 + pulse * 0.65));
      particle.material.rotation = phase * 0.25;
    });

    // --- Update camera halo glow ---
    if (this.edgeGlowPass?.group) {
      const glowPhase = this.edgeGlowPass.group.userData?.phase ?? 0;
      const haloPulse = Math.sin(this.time * 0.42 + glowPhase) * 0.5 + 0.5;
      this.edgeGlowPass.group.position.z = quality.haloDepth - haloPulse * 0.14;
      this.edgeGlowPass.group.rotation.z = Math.sin(this.time * 0.1 + glowPhase) * 0.02;

      this.edgeGlowPass.sprites.forEach((sprite, index) => {
        const spritePulse = Math.sin(this.time * (0.55 + index * 0.12) + sprite.userData.phase) * 0.5 + 0.5;
        const baseScale = sprite.userData.baseScale;
        const accentBoost = sprite.userData.accent ? quality.haloAccentOpacity : 1;
        const scaleBoost = sprite.userData.accent ? quality.haloAccentScale : quality.haloScale;
        sprite.material.opacity = sprite.userData.baseOpacity * quality.haloOpacity * accentBoost * (0.7 + spritePulse * 0.3) * fade;
        sprite.scale.set(
          baseScale.x * scaleBoost * (0.95 + haloPulse * 0.1),
          baseScale.y * scaleBoost * (0.95 + haloPulse * 0.1),
          baseScale.z
        );
        sprite.material.rotation = Math.sin(this.time * 0.1 + index) * 0.06;
      });
    }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  /**
   * Cleanup all effects
   */
  dispose() {
    this.dustParticles.forEach(particle => {
      this.scene.remove(particle);
      this._disposeObject3D(particle);
    });

    if (this.edgeGlowPass?.group && this.camera?.remove) {
      this.camera.remove(this.edgeGlowPass.group);
      this._disposeObject3D(this.edgeGlowPass.group);
    }

    Object.values(this.sharedTextures).forEach(texture => {
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
    });

    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.sharedTextures = {};
  }
}
