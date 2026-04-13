import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

// Typed array safety helpers (local-only)
function isValidTypedArray(arr) {
  return !!(arr && arr.buffer && typeof arr.byteLength === 'number' && arr.byteLength > 0);
}

function isValidBufferAttrArray(attr) {
  const arr = attr && attr.array;
  return isValidTypedArray(arr);
}

const __edgesOffenders = new Set();

function logEdgeOffender(ctx = {}, reason, details = {}) {
  const meshUUID = ctx.meshUUID || 'noMesh';
  const geoUUID = ctx.geoUUID || ctx.geometry?.uuid || 'noGeo';
  const key = `${meshUUID}|${geoUUID}|${reason}`;
  if (__edgesOffenders.has(key)) return;
  __edgesOffenders.add(key);

  // Toggle window.__ATOMA_DEBUG_EDGES = true to reveal offender details (rate-limited per mesh)
  if (window?.__ATOMA_DEBUG_EDGES === true) {
    console.warn('[EdgeVFX][Offender]', reason, {
      meshName: ctx.meshName || 'unnamed',
      meshUUID,
      geoUUID,
      sourceTag: ctx.sourceTag,
      ...details
    });
  }
}

/**
 * ATOMA Visual Upgrade Superpack
 * 8 Complete Enhancement Packs - 100% Safe, Non-Destructive
 * All layers added ON TOP of existing environment
 */

function safeEdgesGeometry(geometry, ctx = {}) {
  if (!geometry || !(geometry.isBufferGeometry || geometry instanceof THREE.BufferGeometry)) {
    logEdgeOffender(ctx, 'missingGeometry', {
      drawRange: geometry?.drawRange
    });
    return null;
  }

  const posAttr = geometry.attributes?.position;
  if (!isValidBufferAttrArray(posAttr) || posAttr.array.length < 6) {
    logEdgeOffender(ctx, 'missingPositions', {
      posLength: posAttr?.array?.length || 0
    });
    return null;
  }

  for (let i = 0; i < posAttr.array.length; i++) {
    if (!Number.isFinite(posAttr.array[i])) {
      logEdgeOffender(ctx, 'invalidPosition', {
        value: posAttr.array[i],
        idx: i,
        posLength: posAttr.array.length
      });
      return null;
    }
  }

  const indexAttr = geometry.index;
  if (indexAttr && !isValidTypedArray(indexAttr.array)) {
    logEdgeOffender(ctx, 'invalidIndex', {
      indexLength: indexAttr?.array?.length || 0
    });
    return null;
  }
  if (indexAttr && indexAttr.array?.length === 0) {
    logEdgeOffender(ctx, 'emptyIndex', {});
    return null;
  }

  const src = geometry.clone();
  const drawRange = geometry.drawRange;
  if (drawRange && (!Number.isFinite(drawRange.count) || drawRange.count <= 0)) {
    const count = src.attributes?.position?.count || (posAttr.array.length / 3);
    src.setDrawRange(0, count);
  }

  const edges = new THREE.EdgesGeometry(src);
  src.dispose();

  const edgePos = edges.attributes?.position;
  if (!isValidBufferAttrArray(edgePos) || edgePos.array.length === 0) {
    logEdgeOffender(ctx, 'edgesEmpty', {
      drawRange: edges.drawRange,
      posLength: edgePos?.array?.length || 0
    });
    edges.dispose();
    return null;
  }

  for (let i = 0; i < edgePos.array.length; i++) {
    if (!Number.isFinite(edgePos.array[i])) {
      logEdgeOffender(ctx, 'edgesNaN', {
        value: edgePos.array[i],
        idx: i,
        length: edgePos.array.length
      });
      edges.dispose();
      return null;
    }
  }

  return edges;
}

export class VisualUpgradeSuperpack {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.root = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.time = 0;
        this._timeOrigin = undefined;
        this._lastVisualTime = undefined;

        // Cached vectors — zero per-frame allocations
        this._vec3a = new THREE.Vector3();
        this._vec3b = new THREE.Vector3();
        this._vec3c = new THREE.Vector3();

        // Pack components
        this.volumetricLights = [];
        this.atmosphericLayers = [];
        this.edgeGlowObjects = [];
        this.distortionZones = [];
        this.rifts = [];
        this.particles = [];
        this.cameraAura = null;
        this.sharedTextures = {};
        this.postEffects = {
            bloom: null,
            vignette: null,
            chromatic: null,
            shimmer: null
        };
        this._applied = false;

        // Smooth fade
        this._fadeOpacity = 1;
        this._targetOpacity = 1;
        this._fadeSpeed = 2.5;

        // Metrics reactivity (smoothed)
        this._metrics = {
            harmony: 0.5,
            corruption: 0,
            synergy: 0.5,
            stability: 0.5
        };
    }

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

    /**
     * ROTATION SAFETY: Ensures any object with a rotation always has a valid order
     */
    ensureRotationOrder(obj) {
        if (obj && obj.rotation && typeof obj.rotation.order !== "string") {
            obj.rotation.order = "XYZ";
        }
    }

    _toRgba(color, alpha) {
        const rgb = new THREE.Color(color);
        return `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${alpha})`;
    }

    _createRadialGradientTexture(cacheKey, stops, size = 256) {
        if (this.sharedTextures[cacheKey]) {
            return this.sharedTextures[cacheKey];
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

        this.sharedTextures[cacheKey] = texture;
        return texture;
    }

    _disposeObject3D(object3D) {
        if (!object3D) return;

        object3D.traverse(child => {
            if (child.geometry && typeof child.geometry.dispose === 'function') {
                child.geometry.dispose();
            }

            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
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
     * Apply ALL enhancement packs
     */
    applyFullUpgrade() {
        if (this._applied) return;
        this._applied = true;

        this.applyVolumetricLightPack();
        this.applyAmbientFogPack();
        this.applyCinematicColorGradingPack();
        this.applyNeonDreamPostfxPack();
        this.applyQuantumDistortionPack();
        this.applySigmaRiftVisualPack();
        this.applyDreamParticlesPack();
        this.applyCinematicCameraAuraPack();
    }

    // ============================================================
    // PACK 1: SOFT VOLUMETRIC LIGHT PACK
    // ============================================================
    applyVolumetricLightPack() {
        const glowTexture = this._createRadialGradientTexture('vsuVolumetricGlow', [
            [0.0, 0xffffff, 1.0],
            [0.16, 0xffffff, 0.84],
            [0.42, 0xffffff, 0.28],
            [1.0, 0xffffff, 0.0]
        ], 256);

        const lightConfigs = [
            {
                pos: new THREE.Vector3(60, 50, 40),
                color: 0x00ffff,
                intensity: 0.12,
                size: 50,
                rotation: new THREE.Vector3(0.3, 0.2, 0)
            },
            {
                pos: new THREE.Vector3(-60, 45, -50),
                color: 0xff00ff,
                intensity: 0.1,
                size: 45,
                rotation: new THREE.Vector3(-0.2, -0.3, 0)
            },
            {
                pos: new THREE.Vector3(0, 55, -70),
                color: 0xff99ff,
                intensity: 0.09,
                size: 48,
                rotation: new THREE.Vector3(0.1, 0, 0.2)
            },
            {
                pos: new THREE.Vector3(-40, 40, 50),
                color: 0x99ffff,
                intensity: 0.08,
                size: 40,
                rotation: new THREE.Vector3(-0.15, 0.25, 0)
            }
        ];

        lightConfigs.forEach(config => {
            const geometry = new THREE.ConeGeometry(config.size, config.size * 2, 32, 32);
            const motionSeed = Math.random() * Math.PI * 2;
            const motion = {
                basePosition: config.pos.clone(),
                baseRotation: {
                    x: config.rotation.x,
                    y: config.rotation.y,
                    z: config.rotation.z
                },
                tint: new THREE.Color(config.color),
                phase: motionSeed,
                pulseSpeed: 0.35 + Math.random() * 0.25,
                driftSpeed: 0.08 + Math.random() * 0.05,
                driftRadius: 0.9 + Math.random() * 1.4,
                driftHeight: 0.5 + Math.random() * 0.6,
                spinSpeed: 0.008 + Math.random() * 0.012,
                scalePulse: 0.035 + Math.random() * 0.03
            };

            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                map: glowTexture || null,
                alphaMap: glowTexture || null,
                transparent: true,
                opacity: config.intensity * 0.22,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const cone = new THREE.Mesh(geometry, material);
            cone.position.copy(config.pos);
            cone.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            cone.renderOrder = 10;
            cone.userData = {
                kind: 'volumetricCone',
                baseOpacity: config.intensity * 0.22,
                baseScale: 1,
                color: config.color,
                ...motion
            };

            this.root.add(cone);
            this.volumetricLights.push(cone);

            const rayGeometry = new THREE.PlaneGeometry(config.size * 0.8, config.size * 1.5);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                map: glowTexture || null,
                alphaMap: glowTexture || null,
                transparent: true,
                opacity: config.intensity * 0.12,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                fog: false,
                toneMapped: false
            });

            const rays = new THREE.Mesh(rayGeometry, rayMaterial);
            rays.position.copy(config.pos);
            rays.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            rays.rotation.x -= Math.PI / 6;
            rays.renderOrder = 11;
            rays.userData = {
                kind: 'volumetricRays',
                baseOpacity: config.intensity * 0.12,
                baseScale: 1,
                color: config.color,
                baseRotation: {
                    x: config.rotation.x - Math.PI / 6,
                    y: config.rotation.y,
                    z: config.rotation.z
                },
                ...motion
            };

            this.root.add(rays);
            this.volumetricLights.push(rays);

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(config.size * 0.14, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: config.color,
                    map: glowTexture || null,
                    alphaMap: glowTexture || null,
                    transparent: true,
                    opacity: config.intensity * 0.55,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    fog: false,
                    toneMapped: false
                })
            );
            core.position.copy(config.pos);
            core.renderOrder = 12;
            core.userData = {
                kind: 'volumetricCore',
                baseOpacity: config.intensity * 0.55,
                baseScale: 1,
                color: config.color,
                ...motion
            };

            this.root.add(core);
            this.volumetricLights.push(core);
        });
    }

    // ============================================================
    // PACK 2: AMBIENT FOG + DEPTH LAYERING PACK
    // ============================================================
    applyAmbientFogPack() {
        const mistTexture = this._createRadialGradientTexture('vsuFogMist', [
            [0.0, 0xffffff, 0.24],
            [0.32, 0xffffff, 0.16],
            [0.68, 0xffffff, 0.05],
            [1.0, 0xffffff, 0.0]
        ], 512);

        const fogLayers = [
            {
                name: 'groundMist',
                height: 0.5,
                color: 0xf0d8e8,
                opacity: 0.12,
                size: 300,
                speed: 0.2
            },
            {
                name: 'midHaze',
                height: 30,
                color: 0xe8c0d8,
                opacity: 0.08,
                size: 350,
                speed: 0.15
            },
            {
                name: 'distantGlow',
                height: 60,
                color: 0xffffff,
                opacity: 0.05,
                size: 400,
                speed: 0.1
            },
            {
                name: 'horizonFade',
                height: 80,
                color: 0xf5e8ff,
                opacity: 0.03,
                size: 500,
                speed: 0.05
            }
        ];

        fogLayers.forEach(layer => {
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
                pulseSpeed: layer.speed,
                phase: Math.random() * Math.PI * 2,
                followFactor: layer.height < 10 ? 0.95 : layer.height < 40 ? 0.55 : 0.25,
                driftRadius: layer.size * 0.01,
                driftSpeed: 0.02 + Math.random() * 0.02,
                wobble: 0.01 + Math.random() * 0.01,
                basePosition: new THREE.Vector3(0, layer.height, 0)
            };
            plane.renderOrder = 4;

            this.root.add(plane);
            this.atmosphericLayers.push(plane);
        });
    }

    // ============================================================
    // PACK 3: HOLOGRAPHIC EDGE GLOW PACK
    // ============================================================
    applyHolographicEdgeGlowPack() {
        // Create edge glow overlays for scene geometry
        const edgeGlowMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            linewidth: 1.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            toneMapped: false
        });

        // Scan scene for geometric objects and add edge glows
        this.scene.traverse(child => {
            if (child.isMesh && child.geometry && !child.userData.isVolumetric) {
                // Skip certain objects
                if (child.name.includes('Particle') || child.name.includes('particle')) return;

                try {
                    const ctx = {
                        meshName: child.name,
                        meshUUID: child.uuid,
                        geoUUID: child.geometry?.uuid,
                        sourceTag: 'VSU.applyHolographicEdgeGlowPack'
                    };
                    const edges = safeEdgesGeometry(child.geometry, ctx);
                    if (!edges) return;
                    const wireframe = new THREE.LineSegments(edges, edgeGlowMaterial);
                    wireframe.position.copy(child.position);
                    if (child.quaternion) {
                        wireframe.rotation.setFromQuaternion(child.quaternion, "XYZ");
                    }
                    wireframe.scale.copy(child.scale);
                    wireframe.renderOrder = 20;
                    wireframe.userData = {
                        linkedMesh: child,
                        baseOpacity: 0.3,
                        fresnel: true,
                        pulsePhase: Math.random() * Math.PI * 2,
                        baseScale: child.scale.clone()
                    };

                    this.root.add(wireframe);
                    this.edgeGlowObjects.push(wireframe);
                } catch (e) {
                    // Skip geometries that can't be converted to edges
                }
            }
        });
    }

    // ============================================================
    // PACK 4: CINEMATIC COLOR GRADING PACK
    // ============================================================
    applyCinematicColorGradingPack() {
        // Apply tone mapping and color grading
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Store color grading parameters
        this.colorGrading = {
            tealMagentaBalance: {
                shadows: new THREE.Vector3(0.96, 0.92, 1.08),  // Cyan in shadows
                midtones: new THREE.Vector3(1.0, 1.0, 1.0),  // Neutral
                highlights: new THREE.Vector3(1.06, 0.94, 0.98) // Magenta in highlights
            },
            contrast: 1.06,
            saturation: 1.0,
            brightness: 0.92
        };
    }

    // ============================================================
    // PACK 5: NEON DREAM POSTFX PACK
    // ============================================================
    applyNeonDreamPostfxPack() {
        // Bloom parameters for neon glow
        this.postEffects.bloom = {
            strength: 1.2,
            threshold: 0.2,
            radius: 0.5
        };

        // Subtle chromatic aberration
        this.postEffects.chromatic = {
            enabled: true,
            amount: 0.002,
            frequency: 0.3
        };

        // Vignette for atmosphere
        this.postEffects.vignette = {
            enabled: true,
            darkness: 0.4,
            offset: 0.3
        };

        // Shimmer effect in luminous regions
        this.postEffects.shimmer = {
            enabled: true,
            intensity: 0.08,
            frequency: 2.0,
            scale: 1.0
        };
    }

    // ============================================================
    // PACK 6: QUANTUM DISTORTION PACK
    // ============================================================
    applyQuantumDistortionPack() {
        const distortionZones = [
            { pos: new THREE.Vector3(30, 10, -30), radius: 20, intensity: 0.08 },
            { pos: new THREE.Vector3(-40, 8, 40), radius: 18, intensity: 0.07 },
            { pos: new THREE.Vector3(0, 15, 0), radius: 25, intensity: 0.06 }
        ];

        distortionZones.forEach(zone => {
            // Create distortion effect through shader overlay
            const geometry = new THREE.IcosahedronGeometry(zone.radius, 3);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0,
                emissive: 0x00ffff,
                emissiveIntensity: zone.intensity * 0.1,
                wireframe: false,
                fog: false
            });

            const distortionMesh = new THREE.Mesh(geometry, material);
            distortionMesh.position.copy(zone.pos);
            distortionMesh.userData = {
                radius: zone.radius,
                intensity: zone.intensity,
                frequency: 1.5 + Math.random() * 1.0,
                phase: Math.random() * Math.PI * 2,
                type: 'distortionZone'
            };

            this.root.add(distortionMesh);
            this.distortionZones.push(distortionMesh);
        });
    }

    // ============================================================
    // PACK 7: SIGMA RIFT VISUAL PACK
    // ============================================================
    applySigmaRiftVisualPack() {
        const riftConfigs = [
            { pos: new THREE.Vector3(50, 20, 50), color: 0x00ff88, scale: 1.0 },
            { pos: new THREE.Vector3(-50, 25, -50), color: 0x00dd99, scale: 0.9 },
            { pos: new THREE.Vector3(0, 30, -60), color: 0x00ffaa, scale: 0.8 }
        ];

        riftConfigs.forEach(config => {
            // Create fracture-like rift visual
            const geometry = new THREE.IcosahedronGeometry(15 * config.scale, 4);
            const material = new THREE.LineBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.15,
                linewidth: 1,
                blending: THREE.AdditiveBlending,
                fog: false
            });

            // Convert to wireframe
            const ctx = {
                meshName: 'sigmaRift',
                meshUUID: null,
                geoUUID: geometry?.uuid,
                sourceTag: 'VSU.applySigmaRiftVisualPack'
            };
            const edges = safeEdgesGeometry(geometry, ctx);
            if (!edges) return;
            const rift = new THREE.LineSegments(edges, material);
            rift.position.copy(config.pos);
            rift.userData = {
                baseOpacity: 0.1,
                pulseSpeed: 0.3,
                phase: Math.random() * Math.PI * 2,
                color: config.color,
                type: 'sigmaRift'
            };

            this.root.add(rift);
            this.rifts.push(rift);

            // Add glow field around rift
            const glowGeometry = new THREE.SphereGeometry(20 * config.scale, 16, 16);
            const glowMaterial = new THREE.MeshStandardMaterial({
                color: config.color,
                emissive: config.color,
                emissiveIntensity: 0.15,
                transparent: true,
                opacity: 0.05,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                fog: false
            });

            const glowField = new THREE.Mesh(glowGeometry, glowMaterial);
            glowField.position.copy(config.pos);
            glowField.userData = {
                baseOpacity: 0.05,
                pulseSpeed: 0.25,
                phase: Math.random() * Math.PI * 2,
                type: 'riftGlow'
            };

            this.root.add(glowField);
            this.rifts.push(glowField);
        });
    }

    // ============================================================
    // PACK 8: DREAM PARTICLES PACK
    // ============================================================
    applyDreamParticlesPack() {
        const particleTexture = this._createRadialGradientTexture('vsuDreamParticle', [
            [0.0, 0xffffff, 0.9],
            [0.2, 0xffffff, 0.45],
            [0.55, 0xffffff, 0.08],
            [1.0, 0xffffff, 0.0]
        ], 128);

        const particleSystems = [
            {
                count: 200,
                height: new THREE.Vector2(5, 40),
                color: 0xffc8dd,
                speed: 0.008,
                size: 0.12
            },
            {
                count: 150,
                height: new THREE.Vector2(20, 60),
                color: 0xffb8d8,
                speed: 0.006,
                size: 0.08
            },
            {
                count: 100,
                height: new THREE.Vector2(40, 80),
                color: 0xffffff,
                speed: 0.004,
                size: 0.06
            }
        ];

        particleSystems.forEach(system => {
            const geometry = new THREE.BufferGeometry();

            const positions = new Float32Array(system.count * 3);
            const velocities = new Float32Array(system.count * 3);

            for (let i = 0; i < system.count; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 300;
                positions[i * 3 + 1] = system.height.x + Math.random() * (system.height.y - system.height.x);
                positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

                velocities[i * 3] = (Math.random() - 0.5) * system.speed;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * system.speed * 0.5;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * system.speed;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

            const material = new THREE.PointsMaterial({
                color: system.color,
                map: particleTexture || null,
                alphaMap: particleTexture || null,
                size: system.size * 1.55,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.52,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                fog: true,
                toneMapped: false
            });

            const points = new THREE.Points(geometry, material);
            points.userData = {
                velocities: velocities,
                bounds: 150,
                system: system
            };

            this.root.add(points);
            this.particles.push(points);
        });
    }

    // ============================================================
    // PACK 9: CAMERA CINEMATIC AURA PACK
    // ============================================================
    applyCinematicCameraAuraPack() {
        if (this.cameraAura) return;

        const auraTexture = this._createRadialGradientTexture('vsuCameraAura', [
            [0.0, 0xffffff, 1.0],
            [0.16, 0xffffff, 0.8],
            [0.42, 0xffffff, 0.26],
            [1.0, 0xffffff, 0.0]
        ], 512);

        const auraGroup = new THREE.Group();
        auraGroup.name = 'VisualSuperpackCameraAura';
        auraGroup.renderOrder = 9999;
        auraGroup.position.set(0, 0, -1.85);
        auraGroup.userData = {
            pulsePhase: Math.random() * Math.PI * 2,
            driftPhase: Math.random() * Math.PI * 2
        };

        const makeAuraSprite = (color, opacity, scaleX, scaleY, offsetX, offsetY) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: auraTexture || null,
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                fog: false,
                toneMapped: false
            }));

            sprite.scale.set(scaleX, scaleY, 1);
            sprite.position.set(offsetX, offsetY, 0);
            sprite.userData = {
                baseOpacity: opacity,
                baseScale: new THREE.Vector3(scaleX, scaleY, 1),
                phase: Math.random() * Math.PI * 2
            };

            return sprite;
        };

        auraGroup.add(makeAuraSprite(0x8fffff, 0.16, 3.1, 3.1, 0.0, 0.0));
        auraGroup.add(makeAuraSprite(0xffa6f0, 0.1, 4.6, 3.2, 0.18, -0.08));
        auraGroup.add(makeAuraSprite(0x69f7ff, 0.08, 6.8, 1.2, -0.24, 0.12));
        auraGroup.add(makeAuraSprite(0xffffff, 0.055, 9.6, 0.72, 0.0, 0.0));

        if (this.camera) {
            this.camera.add(auraGroup);
        } else {
            this.root.add(auraGroup);
        }

        this.cameraAura = auraGroup;
    }

    /**
     * Update all effects each frame
     */
    update(deltaTime) {
        if (this.frameScheduler?.shouldRunVisual?.() === false) return;

        if (this._timeOrigin === undefined) {
            this._timeOrigin = VisualTime.now; // Phase 2A: VisualTime canonical clock (behavior-preserving)
        }
        const currentTime = VisualTime.now - this._timeOrigin;
        const visualDelta = this._lastVisualTime === undefined
            ? 0
            : Math.max(0, currentTime - this._lastVisualTime);
        this._lastVisualTime = currentTime;
        this.time = currentTime;
        const cameraPosition = this.camera?.position || this._vec3a.set(0, 0, 0);
        const cameraDirection = this._vec3b.set(0, 0, 0);

        if (this.camera) {
            this.camera.getWorldDirection(cameraDirection);
        }

        // --- Smooth fade interpolation ---
        if (Math.abs(this._fadeOpacity - this._targetOpacity) > 0.001) {
            const fadeDir = this._targetOpacity > this._fadeOpacity ? 1 : -1;
            this._fadeOpacity += fadeDir * this._fadeSpeed * deltaTime;
            this._fadeOpacity = Math.max(0, Math.min(1, this._fadeOpacity));

            if (this._fadeOpacity <= 0) {
                const hide = obj => { obj.visible = false; };
                this.volumetricLights.forEach(hide);
                this.atmosphericLayers.forEach(hide);
                this.edgeGlowObjects.forEach(hide);
                this.distortionZones.forEach(hide);
                this.rifts.forEach(hide);
                this.particles.forEach(hide);
                if (this.cameraAura) this.cameraAura.visible = false;
                return; // Skip rest of update when invisible
            } else {
                const show = obj => { obj.visible = true; };
                this.volumetricLights.forEach(show);
                this.atmosphericLayers.forEach(show);
                this.edgeGlowObjects.forEach(show);
                this.distortionZones.forEach(show);
                this.rifts.forEach(show);
                this.particles.forEach(show);
                if (this.cameraAura) this.cameraAura.visible = true;
            }
        }

        const fade = this._fadeOpacity;

        // --- Metrics-driven parameters ---
        const { harmony, corruption, synergy, stability } = this._metrics;
        const pulseMultiplier = 1 + (1 - stability) * 0.25;

        // GLOBAL SAFETY: Ensure all animated objects have valid rotation order
        this.edgeGlowObjects.forEach(o => this.ensureRotationOrder(o));
        this.distortionZones.forEach(o => this.ensureRotationOrder(o));
        this.rifts.forEach(o => this.ensureRotationOrder(o));
        this.particles.forEach(o => this.ensureRotationOrder(o));
        this.volumetricLights.forEach(o => this.ensureRotationOrder(o));
        this.atmosphericLayers.forEach(o => this.ensureRotationOrder(o));

        // Update volumetric lights
        this.volumetricLights.forEach(light => {
            if (!light.userData?.pulseSpeed) return;

            const phase = light.userData.phase || 0;
            const pulse = Math.sin(this.time * light.userData.pulseSpeed + phase) * 0.5 + 0.5;
            const driftX = Math.cos(this.time * light.userData.driftSpeed + phase) * light.userData.driftRadius;
            const driftY = Math.sin(this.time * light.userData.driftSpeed * 0.75 + phase * 0.7) * light.userData.driftHeight;
            const driftZ = Math.sin(this.time * light.userData.driftSpeed * 0.9 + phase * 1.3) * (light.userData.driftRadius * 0.6);

            if (light.userData.basePosition) {
                light.position.set(
                    light.userData.basePosition.x + driftX,
                    light.userData.basePosition.y + driftY,
                    light.userData.basePosition.z + driftZ
                );
            }

            if (light.userData.baseRotation) {
                light.rotation.set(
                    light.userData.baseRotation.x + Math.sin(this.time * 0.08 + phase) * 0.04,
                    light.userData.baseRotation.y + this.time * light.userData.spinSpeed,
                    light.userData.baseRotation.z + Math.cos(this.time * 0.09 + phase) * 0.06,
                    "XYZ"
                );
            }

            if (light.userData.baseScale) {
                const scalePulse = 1 + pulse * light.userData.scalePulse;
                light.scale.setScalar(scalePulse);
            }

            light.material.opacity = light.userData.baseOpacity * (0.55 + pulse * 0.45) * fade;

            if (light.material?.color && light.userData?.tint) {
                const tint = 0.96 + pulse * 0.06;
                light.material.color.setRGB(
                    THREE.MathUtils.clamp(light.userData.tint.r * tint, 0, 1),
                    THREE.MathUtils.clamp(light.userData.tint.g * tint, 0, 1),
                    THREE.MathUtils.clamp(light.userData.tint.b * tint, 0, 1)
                );
            }

            light.rotation.x += visualDelta * 0.01;
        });

        // Update atmospheric layers
        this.atmosphericLayers.forEach(layer => {
            const pulse = Math.sin(this.time * layer.userData.pulseSpeed + layer.userData.phase) * 0.5 + 0.5;
            const driftX = Math.cos(this.time * layer.userData.driftSpeed + layer.userData.phase) * layer.userData.driftRadius;
            const driftZ = Math.sin(this.time * layer.userData.driftSpeed * 0.9 + layer.userData.phase * 1.2) * layer.userData.driftRadius;
            const driftY = Math.sin(this.time * layer.userData.pulseSpeed * 0.5 + layer.userData.phase) * layer.userData.wobble;

            layer.position.x = cameraPosition.x * layer.userData.followFactor + driftX;
            layer.position.y = layer.userData.basePosition.y + driftY;
            layer.position.z = cameraPosition.z * layer.userData.followFactor + driftZ;
            layer.rotation.z = Math.sin(this.time * 0.02 + layer.userData.phase) * 0.01;
            layer.scale.setScalar(0.985 + pulse * 0.03);
            layer.material.opacity = layer.userData.baseOpacity * (0.65 + pulse * 0.35) * fade;
        });

        // Update distortion zones
        this.distortionZones.forEach(zone => {
            const pulse = Math.sin(this.time * zone.userData.frequency + zone.userData.phase) * 0.5 + 0.5;
            zone.material.emissiveIntensity = pulse * zone.userData.intensity * 0.2;

            // Rotating distortion
            zone.rotation.x += visualDelta * 0.1;
            zone.rotation.y += visualDelta * 0.15;
            zone.rotation.z += visualDelta * 0.08;
        });

        // Update rifts
        this.rifts.forEach(rift => {
            if (!rift.userData.pulseSpeed) return;

            const pulse = Math.sin(this.time * rift.userData.pulseSpeed + rift.userData.phase) * 0.5 + 0.5;

            if (rift.material.opacity !== undefined) {
                rift.material.opacity = rift.userData.baseOpacity * (0.5 + pulse * 0.5) * fade;
            }

            if (rift.material.emissiveIntensity !== undefined) {
                rift.material.emissiveIntensity = pulse * 0.2;
            }

            // Fractal motion
            rift.rotation.x += visualDelta * 0.05;
            rift.rotation.z += visualDelta * 0.08;
        });

        // Update dream particles
        this.particles.forEach(system => {
            const geom = system?.geometry;
            const posAttr = geom?.attributes?.position;
            const positions = posAttr?.array;
            const velocities = system?.userData?.velocities;
            const bounds = system?.userData?.bounds;

            if (!isValidBufferAttrArray(posAttr)) return;
            if (!isValidTypedArray(velocities)) return;
            if (!Number.isFinite(bounds)) return;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Wrap around with smooth transition
                if (Math.abs(positions[i]) > bounds) {
                    positions[i] = -positions[i];
                    velocities[i] = -velocities[i];
                }
                if (Math.abs(positions[i + 2]) > bounds) {
                    positions[i + 2] = -positions[i + 2];
                    velocities[i + 2] = -velocities[i + 2];
                }
            }

            posAttr.needsUpdate = true;

            const systemPulse = Math.sin(this.time * (0.35 + system.userData.system.speed * 20) + system.id) * 0.5 + 0.5;
            if (system.material) {
                system.material.opacity = (0.3 + systemPulse * 0.18) * fade;
            }
            system.rotation.y += visualDelta * 0.01;
            system.scale.setScalar(0.98 + systemPulse * 0.03);
        });

        // Update edge glows to follow linked meshes
        this.edgeGlowObjects.forEach(glow => {
            if (!glow.userData || !glow.userData.linkedMesh) return;

            const mesh = glow.userData.linkedMesh;

            // Position
            if (mesh.position) {
                glow.position.copy(mesh.position);
            }

            // ⚠ SAFE ROTATION SYNC (bez undefined Euler.order)
            if (mesh.quaternion) {
                // Preferujeme quaternion – obídeme setFromEuler úplne
                glow.quaternion.copy(mesh.quaternion);
            } else if (mesh.rotation) {
                const srcRot = mesh.rotation;
                const safeOrder = srcRot.order || 'XYZ'; // fallback, ak je order undefined
                glow.rotation.set(srcRot.x, srcRot.y, srcRot.z, safeOrder);
            }

            // Scale
            if (mesh.scale) {
                glow.scale.copy(mesh.scale);
            }

            if (glow.userData?.baseScale) {
                const pulse = Math.sin(this.time * 0.7 + glow.userData.pulsePhase) * 0.5 + 0.5;
                glow.scale.multiplyScalar(0.985 + pulse * 0.03);
            }

            // Fresnel effect based on camera angle
            if (glow.material && this.camera) {
                const surfaceNormal = this._vec3c.set(0, 1, 0);

                const fresnel = Math.abs(cameraDirection.dot(surfaceNormal));
                const distance = this.camera.position.distanceTo(mesh.position || glow.position);
                const distanceFactor = THREE.MathUtils.clamp(1 - distance / 260, 0.25, 1);
                glow.material.opacity = glow.userData.baseOpacity * (0.18 + fresnel * 0.82) * distanceFactor * fade;
            }
        });

        // Update camera aura
        if (this.cameraAura) {
            const auraPhase = this.cameraAura.userData.pulsePhase || 0;
            const auraPulse = Math.sin(this.time * 0.4 + auraPhase) * 0.5 + 0.5;

            this.cameraAura.position.set(0, 0, -1.85 - auraPulse * 0.12);
            this.cameraAura.rotation.z = Math.sin(this.time * 0.08 + this.cameraAura.userData.driftPhase) * 0.03;

            this.cameraAura.children.forEach((sprite, index) => {
                const spritePulse = Math.sin(this.time * (0.5 + index * 0.09) + sprite.userData.phase) * 0.5 + 0.5;
                const baseScale = sprite.userData.baseScale;
                sprite.material.opacity = sprite.userData.baseOpacity * (0.62 + spritePulse * 0.38) * fade;
                sprite.scale.set(
                    baseScale.x * (0.94 + auraPulse * 0.08),
                    baseScale.y * (0.94 + auraPulse * 0.08),
                    1
                );
                sprite.material.rotation = Math.sin(this.time * 0.12 + index) * 0.12;
            });
        }
    }

    /**
     * Toggle visibility with smooth fade transition
     */
    setVisible(visible) {
        this._targetOpacity = visible ? 1 : 0;
        if (visible) {
            // Immediately make objects visible so fade-in is visible
            const show = obj => { obj.visible = true; };
            this.volumetricLights.forEach(show);
            this.atmosphericLayers.forEach(show);
            this.edgeGlowObjects.forEach(show);
            this.distortionZones.forEach(show);
            this.rifts.forEach(show);
            this.particles.forEach(show);
            if (this.cameraAura) this.cameraAura.visible = true;
        }
    }

    /**
     * Check if effects are targeted to be visible
     */
    isVisible() {
        return this._targetOpacity > 0;
    }

    /**
     * Get renderer settings for post-processing
     */
    getRendererSettings() {
        return {
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace
        };
    }

    /**
     * Cleanup all effects
     */
    dispose() {
        const cleanupArray = (arr) => {
            arr.forEach(obj => {
                if (obj.parent) {
                    obj.parent.remove(obj);
                } else {
                    this.scene.remove(obj);
                }
                this._disposeObject3D(obj);
            });
            arr.length = 0;
        };

        cleanupArray(this.volumetricLights);
        cleanupArray(this.atmosphericLayers);
        cleanupArray(this.edgeGlowObjects);
        cleanupArray(this.distortionZones);
        cleanupArray(this.rifts);
        cleanupArray(this.particles);

        if (this.cameraAura) {
            if (this.cameraAura.parent) {
                this.cameraAura.parent.remove(this.cameraAura);
            } else {
                this.scene.remove(this.cameraAura);
            }
            this._disposeObject3D(this.cameraAura);
            this.cameraAura = null;
        }

        Object.values(this.sharedTextures).forEach(texture => {
            if (texture && typeof texture.dispose === 'function') {
                texture.dispose();
            }
        });

        this.sharedTextures = {};
        this._applied = false;
    }
}
