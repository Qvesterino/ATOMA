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

    // Budget caps
    this.maxDustParticles = 72; // Max floating dust particles

    // Effect containers (only unique effects, no duplication with Superpack)
    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.lensStack = null;
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

    this._worldContext = {
      consciousnessState: null,
      worldMoodState: null,
      networkState: null,
      liveMetrics: null,
      worldMacroState: 'DORMANT',
      macroProfile: null
    };
    this._macroState = 'DORMANT';
    this._macroProfile = null;

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
    this.createCinematicLensStack();
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

  _createCinematicMaskTexture(textureKey, kind, size = 256) {
    if (this.sharedTextures[textureKey]) {
      return this.sharedTextures[textureKey];
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cx = size * 0.5;
    const cy = size * 0.5;
    ctx.clearRect(0, 0, size, size);

    if (kind === 'anamorphicStreak') {
      const line = ctx.createLinearGradient(0, cy, size, cy);
      line.addColorStop(0, 'rgba(255,255,255,0)');
      line.addColorStop(0.32, 'rgba(255,255,255,0.08)');
      line.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      line.addColorStop(0.68, 'rgba(255,255,255,0.08)');
      line.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = line;
      ctx.fillRect(0, cy - size * 0.065, size, size * 0.13);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.32);
      core.addColorStop(0, 'rgba(255,255,255,0.7)');
      core.addColorStop(0.55, 'rgba(255,255,255,0.16)');
      core.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, size, size);
    } else if (kind === 'lensGhost') {
      const ring = ctx.createRadialGradient(cx, cy, size * 0.15, cx, cy, size * 0.5);
      ring.addColorStop(0, 'rgba(255,255,255,0)');
      ring.addColorStop(0.42, 'rgba(255,255,255,0.45)');
      ring.addColorStop(0.55, 'rgba(255,255,255,0.1)');
      ring.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = ring;
      ctx.fillRect(0, 0, size, size);
    } else if (kind === 'nearMote') {
      const mote = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
      mote.addColorStop(0, 'rgba(255,255,255,1)');
      mote.addColorStop(0.18, 'rgba(255,255,255,0.72)');
      mote.addColorStop(0.5, 'rgba(255,255,255,0.18)');
      mote.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = mote;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4;
        const r = size * (i % 2 === 0 ? 0.45 : 0.38);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
      haze.addColorStop(0, 'rgba(255,255,255,0.86)');
      haze.addColorStop(0.36, 'rgba(255,255,255,0.24)');
      haze.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, size, size);
    }

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
        nearDustRatio: 0.28,
        haloOpacity: 0.86,
        haloScale: 0.94,
        haloDepth: -2.85,
        haloAccentOpacity: 0,
        haloAccentScale: 1,
        lensOpacity: 0.18,
        lensScale: 0.82,
        lensStreakOpacity: 0.16,
        bloomStrength: 0.9,
        bloomThreshold: 0.28,
        bloomRadius: 0.38,
        vignetteStrength: 0.18,
        chromaticStrength: 0.0003
      },
      MEDIUM: {
        rendererExposure: 1.0,
        dustCount: 34,
        dustOpacity: 0.17,
        dustScale: 1.0,
        nearDustRatio: 0.34,
        haloOpacity: 0.98,
        haloScale: 1.0,
        haloDepth: -2.7,
        haloAccentOpacity: 0,
        haloAccentScale: 1,
        lensOpacity: 0.28,
        lensScale: 0.94,
        lensStreakOpacity: 0.24,
        bloomStrength: 1.02,
        bloomThreshold: 0.2,
        bloomRadius: 0.48,
        vignetteStrength: 0.22,
        chromaticStrength: 0.00045
      },
      HIGH: {
        rendererExposure: 1.14,
        dustCount: 56,
        dustOpacity: 0.26,
        dustScale: 1.28,
        nearDustRatio: 0.42,
        haloOpacity: 1.35,
        haloScale: 1.12,
        haloDepth: -2.05,
        haloAccentOpacity: 1.8,
        haloAccentScale: 1.6,
        lensOpacity: 0.52,
        lensScale: 1.18,
        lensStreakOpacity: 0.48,
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
    if (this.lensStack) {
      this.lensStack.position.z = this._qualityProfile.haloDepth + 0.12;
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
    const deepDustTexture = this._createRadialGradientTexture('dustField', [
      [0.0, 0xffffff, 0.9],
      [0.2, 0xffffff, 0.42],
      [0.55, 0xffffff, 0.08],
      [1.0, 0xffffff, 0.0]
    ], 128);
    const nearDustTexture = this._createCinematicMaskTexture('nearLensMote', 'nearMote', 128);
    const ghostDustTexture = this._createCinematicMaskTexture('deepLensGhostMote', 'lensGhost', 128);

    const profile = this._qualityProfile || this._getQualityProfile(this.qualityTier);
    const dustColors = [0xffffff, 0xbefcff, 0xe9d8ff, 0xfff0fb];
    const dustCount = Math.min(this.maxDustParticles, profile.dustCount);
    const nearStart = Math.max(0, Math.floor(dustCount * (1 - profile.nearDustRatio)));
    const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);

    for (let index = 0; index < dustCount; index++) {
      const isNear = index >= nearStart;
      const color = dustColors[index % dustColors.length];
      const texture = isNear
        ? nearDustTexture || deepDustTexture
        : (index % 3 === 0 ? ghostDustTexture || deepDustTexture : deepDustTexture);
      const material = new THREE.SpriteMaterial({
        map: texture || null,
        color,
        transparent: true,
        opacity: isNear ? 0.74 + Math.random() * 0.5 : 0.46 + Math.random() * 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        fog: false,
        toneMapped: false
      });

      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 18;
      sprite.position.set(
        cameraPosition.x + (Math.random() - 0.5) * (isNear ? 32 : 86),
        cameraPosition.y + (Math.random() - 0.4) * (isNear ? 18 : 34),
        cameraPosition.z + (Math.random() - 0.5) * (isNear ? 32 : 86)
      );
      sprite.scale.setScalar((isNear ? 0.72 + Math.random() * 1.2 : 0.34 + Math.random() * 0.82) * profile.dustScale);
      sprite.userData = {
        bucket: isNear ? 'nearLensMote' : 'deepParallaxDust',
        orbitPhase: Math.random() * Math.PI * 2,
        orbitRadius: isNear ? 6 + Math.random() * 14 : 22 + Math.random() * 34,
        orbitHeight: (Math.random() - 0.5) * (isNear ? 10 : 22),
        orbitSpeed: (isNear ? 0.028 : 0.011) + Math.random() * (isNear ? 0.034 : 0.024),
        pulseSpeed: (isNear ? 1.0 : 0.58) + Math.random() * 0.72,
        verticalDrift: (isNear ? 0.8 : 1.4) + Math.random() * 1.4,
        baseScale: sprite.scale.x,
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
  // UNIQUE EFFECT: HIGH-TIER CAMERA LENS STACK
  // ============================================================

  createCinematicLensStack() {
    if (this.lensStack) return;

    const profile = this._qualityProfile || this._getQualityProfile(this.qualityTier);
    const streakTexture = this._createCinematicMaskTexture('cinematicAnamorphicStreak', 'anamorphicStreak', 256);
    const ghostTexture = this._createCinematicMaskTexture('cinematicLensGhost', 'lensGhost', 256);
    const moteTexture = this._createCinematicMaskTexture('cinematicNearMote', 'nearMote', 128);

    const group = new THREE.Group();
    group.name = 'CinematicLensStack';
    group.position.set(0, 0, profile.haloDepth + 0.12);
    group.renderOrder = 10000;
    group.userData = {
      phase: Math.random() * Math.PI * 2
    };

    const makeSprite = (texture, color, opacity, scale, offset, role) => {
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
      sprite.scale.set(scale[0], scale[1], 1);
      sprite.position.set(offset[0], offset[1], offset[2]);
      sprite.userData = {
        role,
        baseOpacity: opacity,
        baseScale: new THREE.Vector3(scale[0], scale[1], 1),
        basePosition: new THREE.Vector3(offset[0], offset[1], offset[2]),
        phase: Math.random() * Math.PI * 2
      };
      group.add(sprite);
      return sprite;
    };

    makeSprite(streakTexture, 0xfff0d0, 0.12, [7.8, 0.42, 1], [0, 0.03, 0], 'primaryStreak');
    makeSprite(streakTexture, 0x69f7ff, 0.08, [5.4, 0.26, 1], [-0.24, -0.14, 0], 'cyanSplit');
    makeSprite(streakTexture, 0xff8be8, 0.055, [4.9, 0.22, 1], [0.28, 0.18, 0], 'violetSplit');
    makeSprite(ghostTexture, 0xffd700, 0.09, [1.2, 1.2, 1], [-0.68, 0.28, 0], 'goldGhost');
    makeSprite(ghostTexture, 0x9466eb, 0.07, [0.82, 0.82, 1], [0.72, -0.22, 0], 'violetGhost');
    makeSprite(moteTexture, 0xffffff, 0.11, [0.18, 0.18, 1], [-0.34, -0.32, 0], 'nearMote');
    makeSprite(moteTexture, 0x9fffff, 0.08, [0.13, 0.13, 1], [0.38, 0.34, 0], 'nearMote');

    if (this.camera) {
      this.camera.add(group);
    } else {
      this.scene.add(group);
    }

    this.lensStack = group;
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

  setWorldContext(context = {}) {
    const normalized = context && typeof context === 'object' ? context : {};
    const worldContext = normalized.worldContext && typeof normalized.worldContext === 'object'
      ? normalized.worldContext
      : normalized;
    const macroState = String(
      normalized.macroState
      || normalized.worldMacroState
      || worldContext.macroState
      || worldContext.worldMacroState
      || worldContext.consciousnessState?.worldMacroState
      || worldContext.consciousnessState?.macroState
      || 'DORMANT'
    ).toUpperCase();
    const macroProfile = normalized.macroProfile && typeof normalized.macroProfile === 'object'
      ? normalized.macroProfile
      : worldContext.macroProfile || null;

    this._worldContext = {
      consciousnessState: worldContext.consciousnessState || normalized.consciousnessState || null,
      worldMoodState: worldContext.worldMoodState || normalized.worldMoodState || null,
      networkState: worldContext.networkState || normalized.networkState || null,
      liveMetrics: worldContext.liveMetrics || normalized.liveMetrics || normalized.metrics || null,
      worldMacroState: macroState,
      macroState,
      macroProfile: macroProfile ? { ...macroProfile } : null
    };
    this._macroState = macroState;
    this._macroProfile = macroProfile ? { ...macroProfile } : null;

    return {
      macroState: this._macroState,
      macroProfile: this._macroProfile ? { ...this._macroProfile } : null,
      worldContext: { ...this._worldContext }
    };
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
      if (this.lensStack) this.lensStack.visible = true;
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
        if (this.lensStack) this.lensStack.visible = false;
        return; // Skip rest of update when invisible
      } else {
        this.dustParticles.forEach(p => { p.visible = true; });
        if (this.edgeGlowPass?.group) this.edgeGlowPass.group.visible = true;
        if (this.lensStack) this.lensStack.visible = true;
      }
    }

    const fade = this._fadeOpacity;
    const quality = this._qualityProfile || this._getQualityProfile(this.qualityTier);
    const macroProfile = this._macroProfile || {};
    const macroState = this._macroState || 'DORMANT';
    const macroMasterScale = Number(macroProfile.masterScale) || 1;
    const macroVolumetricScale = Number(macroProfile.volumetricScale) || 1;
    const macroFogScale = Number(macroProfile.fogScale) || 1;
    const macroDistortionScale = Number(macroProfile.distortionScale) || 1;
    const macroRiftScale = Number(macroProfile.riftScale) || 1;
    const macroParticleScale = Number(macroProfile.particleScale) || 1;
    const macroCameraAuraScale = Number(macroProfile.cameraAuraScale) || 1;
    const baseHazeStrength = Number(quality.hazeStrength) || 0.06;

    // --- Metrics-driven parameters ---
    const { harmony, corruption, synergy, stability } = this._metrics;
    const pulseMultiplier = 1 + (1 - stability) * 0.3; // faster with instability
    const harmonyLift = THREE.MathUtils.clamp(harmony * 0.42 + synergy * 0.34, 0, 0.76);
    const corruptionSplit = THREE.MathUtils.clamp(corruption * 0.82 + (1 - stability) * 0.36, 0, 1.08);
    const revelationBoost = macroState === 'REVELATION' ? 0.24 : macroState === 'COMMUNION' ? 0.14 : 0;

    // --- Renderer exposure modulation ---
    if (this._renderer) {
      const targetExposure = THREE.MathUtils.clamp(
        this._baseExposure * macroMasterScale + synergy * 0.1 + harmony * 0.045 - corruption * 0.055,
        0.72,
        1.66
      );
      this._renderer.toneMappingExposure += (targetExposure - this._renderer.toneMappingExposure) * 0.02;
    }

    // --- Post-processing parameter modulation ---
    if (this._postProcessing?.updateParams) {
      this._postProcessing.updateParams({
        strength: quality.bloomStrength * macroVolumetricScale + synergy * 0.4,
        threshold: THREE.MathUtils.clamp(
          quality.bloomThreshold + corruption * 0.1 - (macroVolumetricScale - 1) * 0.035,
          0.08,
          0.95
        ),
        exposure: THREE.MathUtils.clamp(
          this._baseExposure * macroMasterScale + synergy * 0.1 + harmony * 0.045 - corruption * 0.055,
          0.72,
          1.66
        ),
        radius: quality.bloomRadius * macroRiftScale + revelationBoost * 0.12,
        vignetteStrength: quality.vignetteStrength * macroCameraAuraScale + corruption * 0.13,
        chromaticStrength: quality.chromaticStrength * macroDistortionScale + corruptionSplit * 0.00115,
        hazeStrength: baseHazeStrength * macroFogScale + (1 - stability) * 0.01
      });
    }

    // --- Camera position (cached vector, zero allocation) ---
    const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);

    // --- Update floating dust field ---
    this.dustParticles.forEach(particle => {
      const phase = particle.userData.orbitPhase + this.time * particle.userData.orbitSpeed * pulseMultiplier;
      const pulse = Math.sin(this.time * particle.userData.pulseSpeed + particle.userData.phaseOffset) * 0.5 + 0.5;
      const isNear = particle.userData.bucket === 'nearLensMote';
      const radius = particle.userData.orbitRadius + Math.sin(this.time * (isNear ? 0.48 : 0.33) + particle.userData.phaseOffset) * (isNear ? 1.1 : 2.2);
      const height = particle.userData.orbitHeight + Math.cos(this.time * 0.28 + particle.userData.phaseOffset) * particle.userData.verticalDrift;

      particle.position.x = cameraPosition.x + Math.cos(phase) * radius;
      particle.position.y = cameraPosition.y + height;
      particle.position.z = cameraPosition.z + Math.sin(phase) * radius;
      particle.material.opacity = particle.userData.baseOpacity * macroParticleScale * (isNear ? quality.lensOpacity : quality.dustOpacity) * (0.42 + pulse * 0.58) * fade;
      particle.scale.setScalar(particle.userData.baseScale * quality.dustScale * macroParticleScale * (isNear ? 0.74 + pulse * 0.78 : 0.65 + pulse * 0.65));
      particle.material.rotation = phase * (isNear ? 0.42 : 0.25);
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
        const accentBoost = sprite.userData.accent ? quality.haloAccentOpacity + revelationBoost : 1;
        const scaleBoost = sprite.userData.accent ? quality.haloAccentScale : quality.haloScale;
        const macroHaloScale = scaleBoost * macroCameraAuraScale;
        sprite.material.opacity = sprite.userData.baseOpacity * quality.haloOpacity * accentBoost * macroCameraAuraScale * (0.7 + spritePulse * 0.3 + harmonyLift * 0.12) * fade;
        sprite.scale.set(
          baseScale.x * macroHaloScale * (0.95 + haloPulse * 0.1),
          baseScale.y * macroHaloScale * (0.95 + haloPulse * 0.1),
          baseScale.z
        );
        sprite.material.rotation = Math.sin(this.time * 0.1 + index) * 0.06;
      });
    }

    // --- Update premium lens stack ---
    if (this.lensStack) {
      const lensPhase = this.lensStack.userData?.phase ?? 0;
      const lensPulse = Math.sin(this.time * 0.38 + lensPhase) * 0.5 + 0.5;
      const splitPulse = 0.72 + corruptionSplit * 0.16 + lensPulse * 0.12;
      this.lensStack.position.z = quality.haloDepth + 0.12 - lensPulse * 0.08;
      this.lensStack.rotation.z = Math.sin(this.time * 0.07 + lensPhase) * 0.018;

      this.lensStack.children.forEach((sprite, index) => {
        const role = sprite.userData.role || 'lens';
        const rolePulse = Math.sin(this.time * (0.44 + index * 0.08) + sprite.userData.phase) * 0.5 + 0.5;
        const baseScale = sprite.userData.baseScale;
        const isStreak = role.includes('Streak') || role.includes('Split');
        const isGhost = role.includes('Ghost');
        const isMote = role === 'nearMote';
        const roleOpacity = isStreak
          ? quality.lensStreakOpacity
          : isGhost
            ? quality.lensOpacity * 0.72
            : quality.lensOpacity * 0.52;
        const corruptionBoost = role.includes('violet') ? 1 + corruptionSplit * 0.42 : 1;
        const harmonyBoost = role.includes('gold') || role === 'primaryStreak' ? 1 + harmonyLift * 0.28 + revelationBoost : 1;
        const scaleBoost = quality.lensScale * macroCameraAuraScale * (isStreak ? 1 + harmonyLift * 0.08 : 1 + rolePulse * 0.08);

        sprite.material.opacity = sprite.userData.baseOpacity * roleOpacity * corruptionBoost * harmonyBoost * (0.58 + rolePulse * 0.42) * fade;
        sprite.scale.set(
          baseScale.x * scaleBoost * (isStreak ? splitPulse : 1),
          baseScale.y * scaleBoost * (isMote ? 0.86 + rolePulse * 0.36 : 0.94 + rolePulse * 0.12),
          1
        );
        if (sprite.userData.basePosition) {
          sprite.position.x = sprite.userData.basePosition.x + Math.sin(this.time * 0.21 + index) * 0.018;
          sprite.position.y = sprite.userData.basePosition.y + Math.cos(this.time * 0.19 + index) * 0.014;
        }
        sprite.material.rotation = Math.sin(this.time * 0.11 + index) * (isStreak ? 0.035 : 0.09);
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

    if (this.edgeGlowPass?.group) {
      if (this.edgeGlowPass.group.parent) {
        this.edgeGlowPass.group.parent.remove(this.edgeGlowPass.group);
      } else {
        this.scene.remove(this.edgeGlowPass.group);
      }
      this._disposeObject3D(this.edgeGlowPass.group);
    }

    if (this.lensStack) {
      if (this.lensStack.parent) {
        this.lensStack.parent.remove(this.lensStack);
      } else {
        this.scene.remove(this.lensStack);
      }
      this._disposeObject3D(this.lensStack);
    }

    Object.values(this.sharedTextures).forEach(texture => {
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
    });

    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.lensStack = null;
    this.sharedTextures = {};
  }
}
