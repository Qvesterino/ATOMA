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
        this.camera = camera;
        this.renderer = renderer;

        this.time = 0;
        this._timeOrigin = undefined;
        this._lastVisualTime = undefined;

        // Pack components
        this.volumetricLights = [];
        this.atmosphericLayers = [];
        this.edgeGlowObjects = [];
        this.distortionZones = [];
        this.rifts = [];
        this.particles = [];
        this.postEffects = {
            bloom: null,
            vignette: null,
            chromatic: null,
            shimmer: null
        };
    }

    /**
     * ROTATION SAFETY: Ensures any object with a rotation always has a valid order
     */
    ensureRotationOrder(obj) {
        if (obj && obj.rotation && typeof obj.rotation.order !== "string") {
            obj.rotation.order = "XYZ";
        }
    }

    /**
     * Apply ALL enhancement packs
     */
    applyFullUpgrade() {
        this.applyVolumetricLightPack();
        this.applyAmbientFogPack();
        this.applyHolographicEdgeGlowPack();
        this.applyCinematicColorGradingPack();
        this.applyNeonDreamPostfxPack();
        this.applyQuantumDistortionPack();
        this.applySigmaRiftVisualPack();
        this.applyDreamParticlesPack();
    }

    // ============================================================
    // PACK 1: SOFT VOLUMETRIC LIGHT PACK
    // ============================================================
    applyVolumetricLightPack() {
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
            // Create volumetric cone with soft edges
            const geometry = new THREE.ConeGeometry(config.size, config.size * 2, 32, 32);

            const material = new THREE.MeshStandardMaterial({
                color: config.color,
                emissive: config.color,
                emissiveIntensity: config.intensity * 0.3,
                transparent: true,
                opacity: config.intensity * 0.25,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                wireframe: false,
                fog: false
            });

            const cone = new THREE.Mesh(geometry, material);
            cone.position.copy(config.pos);
            // FIX: Safe rotation assignment from Vector3 config
            cone.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            cone.userData = {
                baseOpacity: config.intensity * 0.25,
                pulseSpeed: 0.4 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                baseColor: config.color
            };

            this.scene.add(cone);
            this.volumetricLights.push(cone);

            // Add subtle light rays effect
            const rayGeometry = new THREE.PlaneGeometry(config.size * 0.8, config.size * 1.5);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: config.intensity * 0.15,
                blending: THREE.AdditiveBlending,
                fog: false
            });

            const rays = new THREE.Mesh(rayGeometry, rayMaterial);
            rays.position.copy(config.pos);
            // FIX: Safe rotation assignment from Vector3 config
            rays.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z, "XYZ");
            rays.rotation.x -= Math.PI / 6;

            this.scene.add(rays);
            this.volumetricLights.push(rays);
        });
    }

    // ============================================================
    // PACK 2: AMBIENT FOG + DEPTH LAYERING PACK
    // ============================================================
    applyAmbientFogPack() {
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
                transparent: true,
                opacity: layer.opacity,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                fog: false
            });

            const plane = new THREE.Mesh(geometry, material);
            plane.position.y = layer.height;
            plane.rotation.x = -Math.PI / 2;
            plane.userData = {
                layer: layer.name,
                baseOpacity: layer.opacity,
                pulseSpeed: layer.speed,
                phase: Math.random() * Math.PI * 2
            };

            this.scene.add(plane);
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
            fog: false
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
                    // FIX: Safe rotation from quaternion — never copy Euler order
                    if (child.quaternion) {
                        wireframe.rotation.setFromQuaternion(child.quaternion, "XYZ");
                    }
                    wireframe.scale.copy(child.scale);
                    wireframe.userData = {
                        linkedMesh: child,
                        baseOpacity: 0.3,
                        fresnel: true
                    };

                    this.scene.add(wireframe);
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
        this.renderer.toneMappingExposure = 1.15;

        // Store color grading parameters
        this.colorGrading = {
            tealMagentaBalance: {
                shadows: new THREE.Vector3(0.95, 0.9, 1.1),  // Cyan in shadows
                midtones: new THREE.Vector3(1.0, 1.0, 1.0),  // Neutral
                highlights: new THREE.Vector3(1.1, 0.9, 1.0) // Magenta in highlights
            },
            contrast: 1.1,
            saturation: 1.05,
            brightness: 0.95
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

            this.scene.add(distortionMesh);
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

            this.scene.add(rift);
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

            this.scene.add(glowField);
            this.rifts.push(glowField);
        });
    }

    // ============================================================
    // PACK 8: DREAM PARTICLES PACK
    // ============================================================
    applyDreamParticlesPack() {
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
                size: system.size,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.4,
                fog: true
            });

            const points = new THREE.Points(geometry, material);
            points.userData = {
                velocities: velocities,
                bounds: 150,
                system: system
            };

            this.scene.add(points);
            this.particles.push(points);
        });
    }

    /**
     * Update all effects each frame
     */
    update(deltaTime) {

        if (this._timeOrigin === undefined) {
            this._timeOrigin = VisualTime.now; // Phase 2A: VisualTime canonical clock (behavior-preserving)
        }
        const currentTime = VisualTime.now - this._timeOrigin;
        const visualDelta = this._lastVisualTime === undefined
            ? 0
            : Math.max(0, currentTime - this._lastVisualTime);
        this._lastVisualTime = currentTime;
        this.time = currentTime;

        // GLOBAL SAFETY: Ensure all animated objects have valid rotation order
        this.edgeGlowObjects.forEach(o => this.ensureRotationOrder(o));
        this.distortionZones.forEach(o => this.ensureRotationOrder(o));
        this.rifts.forEach(o => this.ensureRotationOrder(o));
        this.particles.forEach(o => this.ensureRotationOrder(o));
        this.volumetricLights.forEach(o => this.ensureRotationOrder(o));
        this.atmosphericLayers.forEach(o => this.ensureRotationOrder(o));

        // Update volumetric lights
        this.volumetricLights.forEach(light => {
            if (!light.userData.pulseSpeed) return;

            const pulse = Math.sin(this.time * light.userData.pulseSpeed + light.userData.phase) * 0.5 + 0.5;
            light.material.opacity = light.userData.baseOpacity * (0.5 + pulse * 0.5);

            if (light.material.emissive) {
                light.material.emissiveIntensity = pulse * 0.3;
            }

            // Gentle rotation
            light.rotation.y += visualDelta * 0.02;
        });

        // Update atmospheric layers
        this.atmosphericLayers.forEach(layer => {
            const pulse = Math.sin(this.time * layer.userData.pulseSpeed + layer.userData.phase) * 0.5 + 0.5;
            layer.material.opacity = layer.userData.baseOpacity * (0.6 + pulse * 0.4);

            // Gentle drift
            layer.position.z += Math.sin(this.time * layer.userData.pulseSpeed) * 0.01;
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
                rift.material.opacity = rift.userData.baseOpacity * (0.5 + pulse * 0.5);
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

            // Fresnel effect based on camera angle
            if (glow.material && this.camera) {
                const cameraDir = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDir);
                const surfaceNormal = new THREE.Vector3(0, 1, 0);

                const fresnel = Math.abs(cameraDir.dot(surfaceNormal));
                glow.material.opacity = glow.userData.baseOpacity * (0.2 + fresnel * 0.8);
            }
        });
    }

    /**
     * Get renderer settings for post-processing
     */
    getRendererSettings() {
        return {
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            outputColorSpace: THREE.SRGBColorSpace
        };
    }

    /**
     * Cleanup all effects
     */
    dispose() {
        const cleanupArray = (arr) => {
            arr.forEach(obj => {
                this.scene.remove(obj);
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            arr.length = 0;
        };

        cleanupArray(this.volumetricLights);
        cleanupArray(this.atmosphericLayers);
        cleanupArray(this.edgeGlowObjects);
        cleanupArray(this.distortionZones);
        cleanupArray(this.rifts);
        cleanupArray(this.particles);
    }
}
