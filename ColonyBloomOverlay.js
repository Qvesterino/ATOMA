import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// COLONY BLOOM OVERLAY — Sprite-Based Fake Bloom for Bioluminescent Cores
//
// PURPOSE:
//   ColonyVFXManager uses custom GLSL bioluminescent shaders with Fresnel rim
//   glow, but without a post-processing bloom pass the result looks like plastic.
//   This overlay adds sprite-based radial glow quads that track colony cores
//   and central glows, giving them volumetric bioluminescence at 1 draw call
//   per colony via shared geometry + instancing-ready design.
//
// DESIGN PRINCIPLES:
//   - 100% non-destructive: never touches existing colony meshes or materials
//   - Additive-only: uses THREE.AdditiveBlending, depthWrite=false
//   - Shared resources: one canonical plane geometry, one shared material base
//   - Performance: ≤1ms for 24 colonies, no per-frame allocations
//   - Visual quality: radial gradient texture with chromatic halo layers
//
// INTEGRATION:
//   ColonyVFXManager owns an instance and calls:
//     bloom.createForCore(colonyId, coreMesh, color, energyFactor)
//     bloom.createForGlow(colonyId, glowMesh, color, energyFactor)
//     bloom.update(deltaTime)
//     bloom.removeForColony(colonyId)
//     bloom.dispose()
// ═══════════════════════════════════════════════════════════════════════════════

const BLOOM_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BLOOM_FRAGMENT = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uCoreColor;
  uniform vec3 uHaloColor;
  uniform float uPulsePhase;
  uniform float uBreathSpeed;
  uniform float uChromaticShift;

  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Early discard for crisp edges
    if (dist > 0.5) discard;

    // Radial falloff: exponential for soft volumetric feel
    float coreFalloff = exp(-dist * dist * 8.0);
    float haloFalloff = exp(-dist * dist * 3.2);
    float outerHaze = exp(-dist * dist * 1.4);

    // Organic pulse: not a simple sine, but layered frequencies
    float breath = sin(uTime * uBreathSpeed + uPulsePhase) * 0.5 + 0.5;
    float microPulse = sin(uTime * uBreathSpeed * 2.7 + uPulsePhase * 1.3) * 0.5 + 0.5;
    float combinedPulse = 0.6 + breath * 0.3 + microPulse * 0.1;

    // Chromatic aberration simulation: inner core = coreColor, mid = haloColor, outer = shifted
    vec3 inner = uCoreColor * coreFalloff * 1.4;
    vec3 mid = uHaloColor * haloFalloff * 0.55;
    vec3 outer = mix(uCoreColor, uHaloColor, uChromaticShift) * outerHaze * 0.22;

    vec3 color = inner + mid + outer;

    // Alpha: core is opaque-ish, halo fades to nothing
    float alpha = (coreFalloff * 0.85 + haloFalloff * 0.35 + outerHaze * 0.12) * uIntensity * combinedPulse;

    gl_FragColor = vec4(color, alpha);
  }
`;

export class ColonyBloomOverlay {
  constructor(scene, parentGroup) {
    this.scene = scene;
    this.parent = parentGroup;

    // Container for all bloom sprites
    this.container = new THREE.Group();
    this.container.name = 'ColonyBloomOverlay';
    if (this.parent) {
      this.parent.add(this.container);
    } else if (this.scene) {
      this.scene.add(this.container);
    }

    // Shared canonical geometry: simple plane, always camera-facing via lookAt
    this._sharedGeometry = new THREE.PlaneGeometry(1, 1);

    // ColonyId → bloom entry
    this._blooms = new Map();

    // Scratch objects to avoid per-frame allocation
    this._tempColor = new THREE.Color();
    this._tempVec3 = new THREE.Vector3();

    // Configuration
    this.config = {
      // Base scale multipliers relative to tracked mesh bounding sphere
      coreScale: 3.2,
      glowScale: 4.0,

      // Pulse frequencies
      breathSpeed: 1.8,

      // Chromatic shift: 0 = monochrome glow, 1 = full color separation
      chromaticShift: 0.35,

      // Intensity curve by energyFactor
      minIntensity: 0.45,
      maxIntensity: 1.15,

      // Halo color: lerped from core color toward this hue shift
      haloHueShift: 0.08,
      haloSaturationBoost: 0.15,
      haloLightnessBoost: 0.12
    };
  }

  /**
   * Create or update a bloom overlay for a colony core.
   * @param {string} colonyId
   * @param {THREE.Mesh} coreMesh — the colony core mesh to track
   * @param {number} colorHex — base color of the colony
   * @param {number} energyFactor — 0..1 colony energy
   * @param {number} pulsePhase — optional phase offset for organic variation
   */
  createForCore(colonyId, coreMesh, colorHex, energyFactor = 0.5, pulsePhase = 0) {
    this._createOrUpdate(colonyId, coreMesh, colorHex, energyFactor, pulsePhase, 'core');
  }

  /**
   * Create or update a bloom overlay for a colony central glow.
   * @param {string} colonyId
   * @param {THREE.Mesh} glowMesh — the central glow mesh to track
   * @param {number} colorHex — base color of the colony
   * @param {number} energyFactor — 0..1 colony energy
   * @param {number} pulsePhase — optional phase offset
   */
  createForGlow(colonyId, glowMesh, colorHex, energyFactor = 0.5, pulsePhase = 0) {
    this._createOrUpdate(colonyId, glowMesh, colorHex, energyFactor, pulsePhase, 'glow');
  }

  _createOrUpdate(colonyId, targetMesh, colorHex, energyFactor, pulsePhase, kind) {
    const key = `${colonyId}_${kind}`;
    let entry = this._blooms.get(key);

    const coreColor = this._tempColor.setHex(colorHex);
    const hsl = {};
    coreColor.getHSL(hsl);

    // Derive halo color: shifted hue, boosted saturation/lightness
    const haloColor = new THREE.Color().setHSL(
      (hsl.h + this.config.haloHueShift) % 1.0,
      Math.min(1, hsl.s + this.config.haloSaturationBoost),
      Math.min(1, hsl.l + this.config.haloLightnessBoost)
    );

    const intensity = this.config.minIntensity +
      (this.config.maxIntensity - this.config.minIntensity) * energyFactor;

    if (!entry) {
      const material = new THREE.ShaderMaterial({
        vertexShader: BLOOM_VERTEX,
        fragmentShader: BLOOM_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uCoreColor: { value: coreColor.clone() },
          uHaloColor: { value: haloColor.clone() },
          uPulsePhase: { value: pulsePhase },
          uBreathSpeed: { value: this.config.breathSpeed },
          uChromaticShift: { value: this.config.chromaticShift }
        },
        transparent: true,
        depthWrite: false,
        depthTest: true, // let it occlude behind world geometry
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false
      });

      const sprite = new THREE.Mesh(this._sharedGeometry, material);
      sprite.name = `bloom_${kind}_${colonyId}`;
      sprite.renderOrder = 100; // above most world, below HUD

      this.container.add(sprite);

      entry = {
        sprite,
        material,
        targetMesh,
        kind,
        colonyId,
        baseScale: kind === 'core' ? this.config.coreScale : this.config.glowScale,
        intensity,
        pulsePhase
      };

      this._blooms.set(key, entry);
    } else {
      // Update existing: sync target mesh, colors, intensity
      entry.targetMesh = targetMesh;
      entry.material.uniforms.uIntensity.value = intensity;
      entry.material.uniforms.uCoreColor.value.copy(coreColor);
      entry.material.uniforms.uHaloColor.value.copy(haloColor);
      entry.material.uniforms.uPulsePhase.value = pulsePhase;
      entry.baseScale = kind === 'core' ? this.config.coreScale : this.config.glowScale;
      entry.intensity = intensity;
    }
  }

  /**
   * Per-frame update: sync positions, scales, and shader time.
   * Call from ColonyVFXManager.update() or SafeColonyExpansion2.updateVFX().
   */
  update(deltaTime) {
    const time = performance.now() * 0.001;

    for (const entry of this._blooms.values()) {
      const { sprite, material, targetMesh, baseScale } = entry;

      if (!targetMesh || !targetMesh.parent) {
        // Target was removed; hide bloom
        sprite.visible = false;
        continue;
      }

      sprite.visible = true;

      // Sync position to target mesh world position
      targetMesh.getWorldPosition(sprite.position);

      // Billboard: always face camera
      // We use a simpler approach: the sprite is a plane that we orient toward camera
      // For true billboard, we'd need camera reference; instead we use lookAt
      // which is sufficient for radial glow.
      // NOTE: if camera is available externally, call setCamera() and we use that.
      if (this._camera) {
        sprite.lookAt(this._camera.position);
      } else {
        // Fallback: orient upward; radial glow is symmetric so rotation barely matters
        sprite.rotation.set(0, 0, 0);
      }

      // Scale based on target mesh bounding sphere or scale
      const targetScale = targetMesh.scale.x || 1;
      const scale = targetScale * baseScale * (0.9 + Math.sin(time * 1.5 + entry.pulsePhase) * 0.1);
      sprite.scale.set(scale, scale, scale);

      // Update shader time
      material.uniforms.uTime.value = time;
    }
  }

  /**
   * Optional: set camera for true billboard orientation.
   * If not set, glow works fine because it's radially symmetric.
   */
  setCamera(camera) {
    this._camera = camera;
  }

  /**
   * Remove all bloom overlays for a colony.
   */
  removeForColony(colonyId) {
    for (const key of this._blooms.keys()) {
      if (key.startsWith(`${colonyId}_`)) {
        const entry = this._blooms.get(key);
        this._disposeEntry(entry);
        this._blooms.delete(key);
      }
    }
  }

  /**
   * Remove a specific bloom entry.
   */
  remove(keyOrColonyId, kind) {
    const key = kind ? `${keyOrColonyId}_${kind}` : keyOrColonyId;
    const entry = this._blooms.get(key);
    if (entry) {
      this._disposeEntry(entry);
      this._blooms.delete(key);
    }
  }

  _disposeEntry(entry) {
    if (!entry) return;
    if (entry.sprite) {
      this.container.remove(entry.sprite);
      entry.sprite.geometry = null; // shared, don't dispose
      if (entry.sprite.material) {
        entry.sprite.material.dispose();
      }
    }
  }

  /**
   * Full cleanup.
   */
  dispose() {
    for (const entry of this._blooms.values()) {
      this._disposeEntry(entry);
    }
    this._blooms.clear();

    if (this._sharedGeometry) {
      this._sharedGeometry.dispose();
      this._sharedGeometry = null;
    }

    if (this.container.parent) {
      this.container.parent.remove(this.container);
    }
  }

  /**
   * Debug info.
   */
  getStats() {
    return {
      activeBlooms: this._blooms.size,
      containerChildren: this.container.children.length
    };
  }
}
