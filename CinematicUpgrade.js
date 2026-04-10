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
    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.sharedTextures = {};
    this.time = 0;
  }
  
  /**
   * Apply cinematic enhancements
   */
  initialize() {
    this.createVolumetricLighting();
    this.createAtmosphericLayers();
    this.createFloatingDustField();
    this.createHolographicEdgeGlow();
  }

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
  
  /**
   * Create soft volumetric lighting cones
   */
  createVolumetricLighting() {
    const lightPositions = [
      { pos: new THREE.Vector3(50, 40, 30), color: 0x00ffff, intensity: 0.15 },
      { pos: new THREE.Vector3(-50, 35, -40), color: 0xff00ff, intensity: 0.12 },
      { pos: new THREE.Vector3(0, 50, -60), color: 0xff99ff, intensity: 0.1 }
    ];

    const glowTexture = this._createRadialGradientTexture('volumetricGlow', [
      [0.0, 0xffffff, 0.95],
      [0.18, 0xffffff, 0.72],
      [0.45, 0xffffff, 0.28],
      [1.0, 0xffffff, 0.0]
    ]);

    const coneGeometry = new THREE.ConeGeometry(1, 1, 32, 1, true);
    const coreGeometry = new THREE.SphereGeometry(1, 16, 16);

    const createLightMaterial = (color, opacity) => new THREE.MeshBasicMaterial({
      color,
      map: glowTexture || null,
      alphaMap: glowTexture || null,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });

    const createLayer = (role, scale, color, opacity, rotationZ = 0) => {
      const mesh = new THREE.Mesh(coneGeometry, createLightMaterial(color, opacity));
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = rotationZ;
      mesh.userData = {
        role,
        baseScale: new THREE.Vector3(scale[0], scale[1], scale[2]),
        baseOpacity: opacity
      };
      return mesh;
    };
    
    lightPositions.forEach(light => {
      const lightGroup = new THREE.Group();
      lightGroup.position.copy(light.pos);
      lightGroup.renderOrder = 12;
      lightGroup.userData = {
        basePosition: light.pos.clone(),
        pulseSpeed: 0.45 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        driftRadius: 1.5 + Math.random() * 1.5,
        driftHeight: 0.8 + Math.random() * 0.6
      };

      const outerCone = createLayer('outerCone', [34, 86, 34], light.color, light.intensity * 0.18, Math.PI / 7);
      const bloomCone = createLayer('bloomCone', [26, 68, 26], 0xffffff, light.intensity * 0.14, -Math.PI / 10);
      const innerCone = createLayer('innerCone', [16, 46, 16], light.color, light.intensity * 0.3, Math.PI / 12);

      const core = new THREE.Mesh(
        coreGeometry,
        new THREE.MeshBasicMaterial({
          color: light.color,
          transparent: true,
          opacity: light.intensity * 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          toneMapped: false
        })
      );
      core.scale.set(0.9, 0.9, 0.9);
      core.userData = {
        role: 'core',
        baseScale: new THREE.Vector3(0.9, 0.9, 0.9),
        baseOpacity: light.intensity * 0.9
      };

      const haloRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.05, 8, 32),
        new THREE.MeshBasicMaterial({
          color: light.color,
          transparent: true,
          opacity: light.intensity * 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          toneMapped: false
        })
      );
      haloRing.rotation.x = Math.PI / 2;
      haloRing.userData = {
        role: 'haloRing',
        baseScale: new THREE.Vector3(1, 1, 1),
        baseOpacity: light.intensity * 0.12
      };

      lightGroup.add(outerCone);
      lightGroup.add(bloomCone);
      lightGroup.add(innerCone);
      lightGroup.add(haloRing);
      lightGroup.add(core);

      this.scene.add(lightGroup);
      this.volumetricLights.push(lightGroup);
    });
  }
  
  /**
   * Create 3-layer atmospheric fog system
   */
  createAtmosphericLayers() {
    const mistTexture = this._createRadialGradientTexture('atmosphereMist', [
      [0.0, 0xffffff, 0.24],
      [0.35, 0xffffff, 0.16],
      [0.72, 0xffffff, 0.05],
      [1.0, 0xffffff, 0.0]
    ], 512);

    const layers = [
      {
        name: 'groundMist',
        height: 1,
        color: new THREE.Color(0xd4a5ff),
        opacity: 0.12,
        size: 250,
        followFactor: 0.92,
        driftRadius: 4.5,
        pulseSpeed: 0.22
      },
      {
        name: 'midHaze',
        height: 25,
        color: new THREE.Color(0xccb5ff),
        opacity: 0.08,
        size: 300,
        followFactor: 0.56,
        driftRadius: 8.5,
        pulseSpeed: 0.16
      },
      {
        name: 'distantGlow',
        height: 50,
        color: new THREE.Color(0xffffee),
        opacity: 0.05,
        size: 350,
        followFactor: 0.22,
        driftRadius: 12.5,
        pulseSpeed: 0.11
      }
    ];
    
    layers.forEach(layer => {
      const geometry = new THREE.PlaneGeometry(layer.size, layer.size);
      const material = new THREE.MeshBasicMaterial({
        color: layer.color,
        map: mistTexture || null,
        alphaMap: mistTexture || null,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false
      });
      
      const plane = new THREE.Mesh(geometry, material);
      plane.position.y = layer.height;
      plane.rotation.x = -Math.PI / 2;
      plane.userData = {
        layer: layer.name,
        baseOpacity: layer.opacity,
        pulseSpeed: layer.pulseSpeed,
        followFactor: layer.followFactor,
        driftRadius: layer.driftRadius,
        driftSpeed: 0.05 + Math.random() * 0.03,
        driftPhase: Math.random() * Math.PI * 2,
        baseHeight: layer.height
      };
      plane.renderOrder = 5;
      
      this.scene.add(plane);
      this.atmosphericLayers.push(plane);
    });
  }

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

    const dustColors = [0xffffff, 0xbefcff, 0xe9d8ff, 0xfff0fb];
    const dustCount = 28;
    const cameraPosition = this.camera?.position || new THREE.Vector3();

    for (let index = 0; index < dustCount; index++) {
      const color = dustColors[index % dustColors.length];
      const material = new THREE.SpriteMaterial({
        map: dustTexture || null,
        color,
        transparent: true,
        opacity: 0.14 + Math.random() * 0.12,
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
      sprite.scale.setScalar(0.45 + Math.random() * 0.95);
      sprite.userData = {
        orbitPhase: Math.random() * Math.PI * 2,
        orbitRadius: 18 + Math.random() * 26,
        orbitHeight: (Math.random() - 0.5) * 18,
        orbitSpeed: 0.015 + Math.random() * 0.03,
        pulseSpeed: 0.8 + Math.random() * 0.7,
        verticalDrift: 1.1 + Math.random() * 1.4,
        baseScale: 0.45 + Math.random() * 0.95,
        baseOpacity: material.opacity,
        phaseOffset: Math.random() * Math.PI * 2
      };

      this.scene.add(sprite);
      this.dustParticles.push(sprite);
    }
  }
  
  /**
   * Create holographic edge glow effect
   */
  createHolographicEdgeGlow() {
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
    glowGroup.position.set(0, 0, -2.8);
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

    glowGroup.add(centralGlow);
    glowGroup.add(violetHalo);
    glowGroup.add(cyanSplit);

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
      sprites: [centralGlow, violetHalo, cyanSplit]
    };
  }
  
  /**
   * Update cinematic effects
   */
  update(deltaTime) {
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;

    this.time += deltaTime;

    const cameraPosition = this.camera?.position || new THREE.Vector3();

    // Update volumetric lights pulsing and drift
    this.volumetricLights.forEach(lightGroup => {
      const pulse = Math.sin(this.time * lightGroup.userData.pulseSpeed + lightGroup.userData.phase) * 0.5 + 0.5;
      const driftX = Math.sin(this.time * 0.18 + lightGroup.userData.phase) * lightGroup.userData.driftRadius;
      const driftY = Math.cos(this.time * 0.14 + lightGroup.userData.phase * 0.7) * lightGroup.userData.driftHeight;
      const driftZ = Math.sin(this.time * 0.16 + lightGroup.userData.phase * 1.3) * (lightGroup.userData.driftRadius * 0.65);

      lightGroup.position.set(
        lightGroup.userData.basePosition.x + driftX,
        lightGroup.userData.basePosition.y + driftY,
        lightGroup.userData.basePosition.z + driftZ
      );

      lightGroup.rotation.x = Math.sin(this.time * 0.08 + lightGroup.userData.phase) * 0.035;
      lightGroup.rotation.y = Math.cos(this.time * 0.1 + lightGroup.userData.phase) * 0.05;
      lightGroup.rotation.z = Math.sin(this.time * 0.12 + lightGroup.userData.phase) * 0.08;

      lightGroup.children.forEach(child => {
        if (!child.material) return;

        if (child.userData?.role === 'innerCone') {
          const baseScale = child.userData.baseScale;
          const scalePulse = 0.98 + pulse * 0.05;
          child.scale.set(baseScale.x * scalePulse, baseScale.y * scalePulse, baseScale.z * scalePulse);
          child.material.opacity = child.userData.baseOpacity * (0.86 + pulse * 0.35);
          child.rotation.z += deltaTime * 0.12;
        }

        if (child.userData?.role === 'bloomCone') {
          const baseScale = child.userData.baseScale;
          const scalePulse = 0.98 + pulse * 0.03;
          child.scale.set(baseScale.x * scalePulse, baseScale.y * scalePulse, baseScale.z * scalePulse);
          child.material.opacity = child.userData.baseOpacity * (0.72 + pulse * 0.28);
          child.rotation.z -= deltaTime * 0.08;
        }

        if (child.userData?.role === 'outerCone') {
          const baseScale = child.userData.baseScale;
          const scalePulse = 0.99 + pulse * 0.025;
          child.scale.set(baseScale.x * scalePulse, baseScale.y * scalePulse, baseScale.z * scalePulse);
          child.material.opacity = child.userData.baseOpacity * (0.78 + pulse * 0.24);
        }

        if (child.userData?.role === 'haloRing') {
          const baseScale = child.userData.baseScale;
          const scalePulse = 0.95 + pulse * 0.08;
          child.scale.set(baseScale.x * scalePulse, baseScale.y * scalePulse, baseScale.z * scalePulse);
          child.material.opacity = child.userData.baseOpacity * (0.8 + pulse * 0.35);
          child.rotation.y += deltaTime * 0.18;
        }

        if (child.userData?.role === 'core') {
          const baseScale = child.userData.baseScale;
          const scalePulse = 0.92 + pulse * 0.12;
          child.scale.set(baseScale.x * scalePulse, baseScale.y * scalePulse, baseScale.z * scalePulse);
          child.material.opacity = child.userData.baseOpacity * (0.72 + pulse * 0.34);
        }
      });
    });
    
    // Update atmospheric layers
    this.atmosphericLayers.forEach(layer => {
      const pulse = Math.sin(this.time * layer.userData.pulseSpeed + layer.userData.driftPhase) * 0.5 + 0.5;
      layer.position.x = cameraPosition.x * layer.userData.followFactor + Math.cos(this.time * layer.userData.driftSpeed + layer.userData.driftPhase) * layer.userData.driftRadius;
      layer.position.z = cameraPosition.z * layer.userData.followFactor + Math.sin(this.time * layer.userData.driftSpeed * 0.9 + layer.userData.driftPhase * 1.2) * layer.userData.driftRadius;
      layer.rotation.z = Math.sin(this.time * 0.02 + layer.userData.driftPhase) * 0.012;
      layer.scale.setScalar(0.985 + pulse * 0.03);
      layer.material.opacity = layer.userData.baseOpacity * (0.68 + pulse * 0.38);
    });

    // Update floating dust field around the camera
    this.dustParticles.forEach(particle => {
      const phase = particle.userData.orbitPhase + this.time * particle.userData.orbitSpeed;
      const pulse = Math.sin(this.time * particle.userData.pulseSpeed + particle.userData.phaseOffset) * 0.5 + 0.5;
      const radius = particle.userData.orbitRadius + Math.sin(this.time * 0.33 + particle.userData.phaseOffset) * 2.2;
      const height = particle.userData.orbitHeight + Math.cos(this.time * 0.28 + particle.userData.phaseOffset) * particle.userData.verticalDrift;

      particle.position.x = cameraPosition.x + Math.cos(phase) * radius;
      particle.position.y = cameraPosition.y + height;
      particle.position.z = cameraPosition.z + Math.sin(phase) * radius;
      particle.material.opacity = particle.userData.baseOpacity * (0.42 + pulse * 0.58);
      particle.scale.setScalar(particle.userData.baseScale * (0.65 + pulse * 0.65));
      particle.material.rotation = phase * 0.25;
    });

    // Update camera halo glow
    if (this.edgeGlowPass?.group) {
      const glowPhase = this.edgeGlowPass.group.userData?.phase ?? 0;
      const haloPulse = Math.sin(this.time * 0.42 + glowPhase) * 0.5 + 0.5;
      this.edgeGlowPass.group.position.z = -2.8 - haloPulse * 0.14;
      this.edgeGlowPass.group.rotation.z = Math.sin(this.time * 0.1 + glowPhase) * 0.02;

      this.edgeGlowPass.sprites.forEach((sprite, index) => {
        const spritePulse = Math.sin(this.time * (0.55 + index * 0.12) + sprite.userData.phase) * 0.5 + 0.5;
        const baseScale = sprite.userData.baseScale;
        sprite.material.opacity = sprite.userData.baseOpacity * (0.7 + spritePulse * 0.3);
        sprite.scale.set(
          baseScale.x * (0.95 + haloPulse * 0.1),
          baseScale.y * (0.95 + haloPulse * 0.1),
          baseScale.z
        );
        sprite.material.rotation = Math.sin(this.time * 0.1 + index) * 0.06;
      });
    }
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
    this.volumetricLights.forEach(lightGroup => {
      this.scene.remove(lightGroup);
      this._disposeObject3D(lightGroup);
    });
    
    this.atmosphericLayers.forEach(layer => {
      this.scene.remove(layer);
      this._disposeObject3D(layer);
    });

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
    
    this.volumetricLights = [];
    this.atmosphericLayers = [];
    this.dustParticles = [];
    this.edgeGlowPass = null;
    this.sharedTextures = {};
  }
}
