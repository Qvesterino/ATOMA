import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../VisualHierarchyRegistry.js';
import { projectHudMetrics } from '../SemanticMetricAdapter.js';
import { LinkPointFXBase } from '../LinkPointFXBase.js';

function getAtomaVisualDebugMode() {
    const mode = (typeof window !== 'undefined' && window.__ATOMA_VISUAL_DEBUG_MODE__)
        || globalThis.__ATOMA_VISUAL_DEBUG_MODE__
        || 'all';
    return `${mode}`.toLowerCase();
}

/**
 * ============================================================================
 * HEALING PARTICLE SYSTEM (Session 136)
 * ============================================================================
 * 
 * Visual enhancement layer for network repair.
 * Renders enhanced particle trails for healing waves and scar dissipation sparkles.
 * 
 * Design:
 * - GPU-driven particle motion via custom shaders
 * - Single draw call (THREE.Points) with circular buffer
 * - Zero per-frame allocation
 * - State-responsive (Harmony/Corruption modulation)
 * 
 * Capabilities:
 * 1. Healing Trails: Follow wave paths (hooked to healing system)
 * 2. Scar Sparkles: Emit from fading resonance scars
 * 
 * ============================================================================
 */

// ATOMA_HEALING_SESSION136_v2: Upgraded shaders — circular glow, hot core, shimmer,
// reduced hypercube chaos, smoothstep fade, size decay, color evolution

const SPARKLE_VERTEX_SHADER = `
uniform float uTime;
uniform float uScale;
uniform float uForceRedParticles;
attribute float birthTime;
attribute float lifetime;
attribute vec3 velocity;
attribute float size;
attribute vec3 color;
attribute float layer;
varying vec3 vColor;
varying float vAlpha;
varying float vLayer;
varying float vProgress;

void main() {
    float age = uTime - birthTime;
    
    // Cull inactive/dead particles
    if (age < 0.0 || age > lifetime) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }
    
    // Normalized life progress (0.0 to 1.0)
    float progress = age / lifetime;
    vProgress = progress;
    
    // Physics: velocity with drag deceleration + gentle rise
    float drag = 1.0 / (1.0 + age * 1.5);
    vec3 pos = position + velocity * age * drag;
    pos.y += 0.15 * age * age; // Gentle upward drift

    // 4D hypercube stereographic projection (ATOMA_HEALING_SESSION136_v2: reduced to 35%)
    float layerNorm = (layer / 15.0) * 2.0 - 1.0;
    float driveTime = uTime * 0.65 + layer * 0.4;
    float c0 = cos(driveTime);
    float s0 = sin(driveTime);
    float c1 = cos(driveTime * 1.4 + 1.3);
    float s1 = sin(driveTime * 1.4 + 1.3);

    vec4 pos4 = vec4(pos, layerNorm);
    vec4 rotated;
    rotated.x = pos4.x * c0 - pos4.w * s0;
    rotated.w = pos4.x * s0 + pos4.w * c0;
    rotated.y = pos4.y * c1 - pos4.z * s1;
    rotated.z = pos4.y * s1 + pos4.z * c1;

    float denom = 1.0 - rotated.w;
    denom = max(denom, 0.15);
    vec3 hyperPos = rotated.xyz / denom;

    // Reduced hypercube blend: 86% → 35% for calmer, more readable healing motion
    vec3 finalPos = mix(pos, hyperPos * 0.65, 0.35);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size:衰减 with lifetime + breathing pulse + layer shimmer
    float lifeDecay = 1.0 - progress * 0.4; // Shrink to 60% at end of life
    float sizePulse = 1.0 + 0.18 * sin(uTime * 3.5 + layer * 0.5);
    float breathe = 1.0 + 0.06 * sin(uTime * 1.8 + birthTime * 2.0);
    gl_PointSize = size * uScale * sizePulse * lifeDecay * breathe * (300.0 / -mvPosition.z);
    
    // Smoothstep fade in/out (ATOMA_HEALING_SESSION136_v2)
    float fadeIn = smoothstep(0.0, 0.08, progress);
    float fadeOut = 1.0 - smoothstep(0.5, 1.0, progress);
    float alpha = fadeIn * fadeOut;
    
    vAlpha = alpha;
    vLayer = layer / 15.0;
    
    // SACRED_POLISH: Color evolution — sacred spectral cycling over lifetime
    // Evolves from base → sacred gold → celestial teal → mystic violet shimmer
    vec3 sacredGold = vec3(1.0, 0.84, 0.0);
    vec3 celestialTeal = vec3(0.25, 0.88, 0.82);
    vec3 mysticViolet = vec3(0.58, 0.35, 0.92);
    float sacredPhase = progress * 0.4;
    vec3 sacredTarget = mix(sacredGold, celestialTeal, smoothstep(0.0, 0.5, sacredPhase));
    sacredTarget = mix(sacredTarget, mysticViolet, smoothstep(0.5, 1.0, sacredPhase) * 0.3);
    vec3 evolvedColor = mix(color, sacredTarget, progress * 0.45);
    // Sacred spectral shimmer per layer
    evolvedColor = mix(evolvedColor, celestialTeal, 0.15 + 0.15 * sin(uTime * 0.8 + layer));
    if (uForceRedParticles > 0.5) {
        evolvedColor = vec3(1.0, 0.0, 0.0);
    }
    vColor = evolvedColor;
}
`;

const SPARKLE_FRAGMENT_SHADER = `
uniform float uForceRedParticles;
varying vec3 vColor;
varying float vAlpha;
varying float vLayer;
varying float vProgress;

void main() {
    // ATOMA_HEALING_SESSION136_v2: Circular soft glow particle
    vec2 uv = gl_PointCoord.xy - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    
    // Multi-lobe glow: hot core + inner glow + soft halo
    float hotCore = 1.0 - smoothstep(0.0, 0.12, dist);
    float innerGlow = 1.0 - smoothstep(0.05, 0.30, dist);
    float softHalo = 1.0 - smoothstep(0.15, 0.50, dist);
    
    // Combine: hot core is white, inner glow is colored, halo is soft
    vec3 coreColor = mix(vColor, vec3(1.0, 1.0, 1.0), 0.85); // Near-white hot center
    vec3 glowColor = vColor * 1.3;
    vec3 haloColor = vColor * 0.6;
    
    vec3 finalColor = coreColor * hotCore * 2.0
                    + glowColor * innerGlow * 0.8
                    + haloColor * softHalo * 0.3;
    
    // Shimmer: subtle energy sparkle
    float shimmer = 0.92 + 0.08 * sin(vProgress * 20.0 + dist * 15.0);
    finalColor *= shimmer;
    
    // SACRED_POLISH: Sacred spectral layer tint — sacred gold → celestial teal
    vec3 layerTint = mix(vec3(1.0, 0.84, 0.4), vec3(0.25, 0.88, 0.82), vLayer);
    bool isForcedRed = (uForceRedParticles > 0.5);
    if (!isForcedRed) {
        finalColor += layerTint * 0.15 * softHalo;
    } else {
        finalColor = vec3(1.0, 0.0, 0.0);
    }
    
    // Alpha from glow shape + lifetime fade
    float glowAlpha = hotCore * 1.0 + innerGlow * 0.6 + softHalo * 0.2;
    
    gl_FragColor = vec4(finalColor, vAlpha * glowAlpha);
}
`;

export class HealingParticleSystem_Session136 {
    constructor(scene, resonanceRuptureSystem, audioSystem, config = {}) {
        this.scene = scene;
        this.resonanceRupture = resonanceRuptureSystem;
        
        // UNIFIED CLEANUP CONTRACT - Track all created objects
        this._createdObjects = [];
        this.audioSystem = audioSystem; // Integration: Audio System
        
        this.config = {
            maxParticles: 3500,
            sparkleRate: 1.15,     // Sparkles per scar per second
            baseLifetime: 1.8,     // ATOMA_HEALING_SESSION136_v2: slightly snappier
            baseSize: 0.32,        // ATOMA_HEALING_SESSION136_v2: boosted 0.24→0.32
            trailDensity: 5,       // Particles per unit distance
            lodDistance: 100,
            debugVisualBoost: false,
            debugForceRedParticles: false,
            debugExtremeSpawnIndicator: false,
            debugSpawnProbe: false,
            debugSpawnLogs: false,
            enableSacredHealingPolish: true, // SACRED_POLISH: master switch for sacred spectral palette
            ...config
        };
        
        // ATOMA_HEALING_SESSION136_v2: Pre-allocated temp objects (zero per-frame allocation)
        this._tmpVec3A = new THREE.Vector3();
        this._tmpVec3B = new THREE.Vector3();
        this._tmpColor = new THREE.Color();
        
        // Pools & State
        this.particleIndex = 0;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.enabled = true;
        this.debugCube = null;
        this.debugCubeVisible = false;
        this.debugProbe = null;
        this.debugProbeHideAt = 0;
        this.pointFXBase = new LinkPointFXBase(this.scene, {
            renderLayer: VisualHierarchyRegistry?.LAYER_LINK_PARTICLES ?? 'LINK_PARTICLES',
            preset: 'healing',
            capacity: this.config.maxParticles,
            textureKind: 'healing'
        });
        
        // Internal tracking
        this.lastUpdateTime = 0;
        this.accumulatedTime = 0;
        this.scarEmissions = new Map(); // scarId -> accumulated emission
        
        this.setup();
    }

    _ensureMeshAttached() {
        if (this.pointFXBase && this.mesh) {
            this.pointFXBase.ensureAttached(this.mesh);
        } else if (this.mesh && this.scene && this.mesh.parent !== this.scene) {
            this.scene.add(this.mesh);
            this._createdObjects.push(this.mesh);  // UNIFIED CLEANUP CONTRACT
        }

        if (this.config.debugExtremeSpawnIndicator && this.debugCube && this.scene && this.debugCube.parent !== this.scene) {
            this.scene.add(this.debugCube);
            this._createdObjects.push(this.debugCube);  // UNIFIED CLEANUP CONTRACT
        }

        if (this.config.debugSpawnProbe && this.debugProbe && this.scene && this.debugProbe.parent !== this.scene) {
            this.scene.add(this.debugProbe);
            this._createdObjects.push(this.debugProbe);  // UNIFIED CLEANUP CONTRACT
        }
    }
    
    setup() {
        // Attributes
        const particleCount = this.config.maxParticles;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const birthTimes = new Float32Array(particleCount);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const layers = new Float32Array(particleCount);
        
        // Fill with default invisible values
        birthTimes.fill(-1000);
        
        this.geometry = this.pointFXBase?.createGeometry
            ? this.pointFXBase.createGeometry({
                velocity: { itemSize: 3 },
                color: { itemSize: 3 },
                birthTime: { itemSize: 1 },
                lifetime: { itemSize: 1 },
                size: { itemSize: 1 },
                layer: { itemSize: 1 }
            })
            : new THREE.BufferGeometry();

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('birthTime', new THREE.BufferAttribute(birthTimes, 1).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('layer', new THREE.BufferAttribute(layers, 1).setUsage(THREE.DynamicDrawUsage));

        this.material = this.pointFXBase?.createMaterial
            ? this.pointFXBase.createMaterial({
                vertexShader: SPARKLE_VERTEX_SHADER,
                fragmentShader: SPARKLE_FRAGMENT_SHADER,
                uniforms: {
                    uTime: { value: 0 },
                    uScale: { value: this.config.debugVisualBoost ? 1.75 : 1.0 },
                    uForceRedParticles: { value: this.config.debugForceRedParticles ? 1.0 : 0.0 }
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                toneMapped: false,    // ATOMA_HEALING_SESSION136_v2: HDR brightness
                vertexColors: false
            })
            : new THREE.ShaderMaterial({
            vertexShader: SPARKLE_VERTEX_SHADER,
            fragmentShader: SPARKLE_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: this.config.debugVisualBoost ? 1.75 : 1.0 },
                uForceRedParticles: { value: this.config.debugForceRedParticles ? 1.0 : 0.0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false        // ATOMA_HEALING_SESSION136_v2: HDR brightness
        });
        
        // ATOMA_HEALING_SESSION136_v2: Shader program cache key
        if (this.material && typeof this.material.customProgramCacheKey === 'undefined') {
            this.material.customProgramCacheKey = () => 'ATOMA_HEALING_SESSION136_v2';
        }
        
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.frustumCulled = false; // Always update (particles move)
        this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
        if (this.pointFXBase) {
            this.pointFXBase.ensureAttached(this.mesh);
        } else {
            this.scene.add(this.mesh);
            this._createdObjects.push(this.mesh);  // UNIFIED CLEANUP CONTRACT
        }

        // Temporary debug indicator: huge red cube per emit
        if (this.config.debugExtremeSpawnIndicator) {
            this.debugCube = new THREE.Mesh(
                new THREE.BoxGeometry(80, 80, 80),
                new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false })
            );
            this.debugCube.visible = true;
            this.debugCube.renderOrder = 999;
            this.scene.add(this.debugCube);
            this._createdObjects.push(this.debugCube);  // UNIFIED CLEANUP CONTRACT
        }

        if (this.config.debugSpawnProbe) {
            this.debugProbe = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.25, 0), // Sacred geometry probe
                new THREE.MeshBasicMaterial({
                    color: 0xff4d7d,
                    transparent: true,
                    opacity: 0.92,
                    depthWrite: false,
                    depthTest: false,
                    flatShading: true
                })
            );
            this.debugProbe.visible = false;
            this.debugProbe.renderOrder = 999;
            this.scene.add(this.debugProbe);
            this._createdObjects.push(this.debugProbe);  // UNIFIED CLEANUP CONTRACT
        }
    }
    
    /**
     * Spawn a single particle
     */
    spawnParticle(pos, vel, color, size, life, startTime) {
        const i = this.particleIndex;
        const attrs = this.geometry.attributes;
        
        // Update attributes at current index
        attrs.position.setXYZ(i, pos.x, pos.y, pos.z);
        attrs.velocity.setXYZ(i, vel.x, vel.y, vel.z);
        attrs.color.setXYZ(i, color.r, color.g, color.b);
        attrs.birthTime.setX(i, startTime);
        attrs.lifetime.setX(i, life);
        attrs.size.setX(i, size);

        // Hypercube layer index 0..15
        attrs.layer.setX(i, (Math.random() * 16) | 0);
        
        // ATOMA_HEALING_SESSION136_v2: Single needsUpdate flag per attribute
        attrs.position.needsUpdate = true;
        attrs.velocity.needsUpdate = true;
        attrs.color.needsUpdate = true;
        attrs.birthTime.needsUpdate = true;
        attrs.lifetime.needsUpdate = true;
        attrs.size.needsUpdate = true;
        attrs.layer.needsUpdate = true;
        
        // Advance circular buffer
        this.particleIndex = (this.particleIndex + 1) % this.config.maxParticles;
    }
    
    /**
     * Update loop
     */
    update(deltaTime, time, networkState, camera) {
        const mode = getAtomaVisualDebugMode();
        if (mode !== 'all' && mode !== 'healing') return;
        if (!this.mesh) return;
        if (!this.enabled) return;

        this._ensureMeshAttached();
        
        // Keep debug cube visible and always on top for confirmation
        if (this.config.debugExtremeSpawnIndicator && this.debugCube) {
            this.debugCube.visible = true;
            if (!this.debugCube.visible) this.debugCube.visible = true;
            // keep at origin if no emit yet
            if (this.debugCube.position.length() < 0.001) {
                this.debugCube.position.set(0, 0, 0);
            }
        }

        if (this.config.debugSpawnProbe && this.debugProbe && this.debugProbe.visible && time >= this.debugProbeHideAt) {
            this.debugProbe.visible = false;
        }

        // Update uniforms
        this.material.uniforms.uTime.value = time;
        if (this.material.uniforms.uForceRedParticles) {
            this.material.uniforms.uForceRedParticles.value = this.config.debugForceRedParticles ? 1.0 : 0.0;
        }
        this.lastUpdateTime = time;
        const canonicalState = projectHudMetrics(networkState || {});
        
        // 1. Process Scars (Sparkles)
        if (this.resonanceRupture && this.resonanceRupture.resonanceScars) {
            this._processScars(deltaTime, time, canonicalState, camera);
        }
        
        // Note: Healing Trails are handled via external calls to emitHealingTrail()
        // since we are an adapter system waiting for the healing system.
    }
    
    /**
     * Process resonance scars to emit sparkles
     */
    _processScars(deltaTime, time, state, camera) {
        const scars = this.resonanceRupture.resonanceScars;
        if (!Array.isArray(scars) || scars.length === 0) {
            this.scarEmissions.clear();
            return;
        }

        const clamp01 = (value) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return 0;
            return Math.max(0, Math.min(1, numeric));
        };
        
        // Modulation based on state
        const harmony = clamp01(state?.harmonyFlow ?? 0.5);
        const corruption = clamp01(state?.corruptionLevel ?? 0);
        
        // Higher harmony = coherent sparkles
        // Higher corruption = suppressed sparkles
        const emissionRate = this.config.sparkleRate * (1.0 + harmony * 0.5) * (1.0 - corruption);
        const currentScarIds = new Set();
        
        scars.forEach(scar => {
            const scarId = scar.linkId;
            currentScarIds.add(scarId);
            let acc = this.scarEmissions.get(scarId) || 0;
            acc += emissionRate * deltaTime * scar.intensity; // Scale by scar intensity
            
            while (acc >= 1.0) {
                this._emitScarSparkle(scar, time, state);
                acc -= 1.0;
            }
            
            this.scarEmissions.set(scarId, acc);
        });

        for (const scarId of this.scarEmissions.keys()) {
            if (!currentScarIds.has(scarId)) {
                this.scarEmissions.delete(scarId);
            }
        }
        
        // Safety: keep the map bounded even if scars churn faster than the loop prunes them.
        if (this.scarEmissions.size > this.config.maxParticles) {
            this.scarEmissions.clear();
        }
    }
    
    /**
     * Emit a single sparkle from a scar
     */
    _emitScarSparkle(scar, time, state) {
        const mesh = scar?.mesh?.mesh;
        if (!mesh) return;
        
        // ATOMA_HEALING_SESSION136_v2: Zero-allocation spawning using pre-allocated temps
        const scale = mesh.scale;
        const randX = (Math.random() - 0.5) * scale.x;
        const randY = (Math.random() - 0.5) * scale.y;
        
        // Local to World (reuse _tmpVec3A)
        const localPos = this._tmpVec3A.set(randX, randY, 0);
        localPos.applyMatrix4(mesh.matrixWorld);
        
        // Gentle drift velocity (upward + outward, reuse _tmpVec3B)
        const vel = this._tmpVec3B.set(
            (Math.random() - 0.5) * 0.2,
            0.2 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.2
        );
        
        // Color: Warm white/gold or forced red for debug (reuse _tmpColor)
        const color = this._tmpColor;
        if (this.config.debugForceRedParticles) {
            color.setHex(0xff0000);
        } else if ((state?.harmonyFlow ?? 0) > 0.6) {
            // SACRED_POLISH: Celestial teal for high harmony
            color.setRGB(0.25, 0.88, 0.82);
        } else {
            // SACRED_POLISH: Sacred gold
            color.setRGB(1.0, 0.84, 0.0);
        }
        
        const lifetime = this.config.baseLifetime * (0.8 + Math.random() * 0.4);
        const size = this.config.baseSize * (0.85 + Math.random() * 0.3);
        
        this.spawnParticle(localPos, vel, color, size, lifetime, time);
    }
    
    /**
     * Public API: Emit a healing trail particle
     * To be called by HarmonicHealingVisualSystem
     */
    emitHealingTrail(position, velocity, intensity, time, colorOverride = null) {
        if (!this.enabled) return;

        const normalizedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
        
        // ATOMA_HEALING_SESSION136_v2: Zero-allocation color handling
        const color = this._tmpColor;
        if (this.config.debugForceRedParticles) {
            color.setHex(0xff0000);
        } else if (colorOverride instanceof THREE.Color) {
            color.copy(colorOverride);
        } else {
            // SACRED_POLISH: Celestial teal-gold
            color.setRGB(0.35, 0.90, 0.82);
        }
        const size = this.config.baseSize * (0.18 + normalizedIntensity * 0.8);
        const life = 0.5 + normalizedIntensity * 0.8;
        
        // Throttle debug log to max once per 30 seconds
        if (!this.lastDebugLogTime) {
            this.lastDebugLogTime = 0;
        }
        if (this.config.debugSpawnLogs && time - this.lastDebugLogTime >= 30) {
            console.error('[HealingParticleSystem DEBUG] emitHealingTrail spawned at', position.toArray(), 'intensity', normalizedIntensity, 'time', time);
            this.lastDebugLogTime = time;
        }

        // ATOMA_HEALING_SESSION136_v2: Zero-allocation position + spread (reuse _tmpVec3A)
        const pos = this._tmpVec3A.copy(position);
        pos.x += (Math.random() - 0.5) * 0.1;
        pos.y += (Math.random() - 0.5) * 0.1;
        pos.z += (Math.random() - 0.5) * 0.1;
        
        // Trail follows incoming velocity (reuse _tmpVec3B)
        const vel = this._tmpVec3B.copy(velocity).multiplyScalar(0.7);

        // debugging log already throttled above; no repeated logs here
        if (this.config.debugSpawnProbe && this.debugProbe) {
            this.debugProbe.position.copy(pos);
            this.debugProbe.scale.setScalar(0.65 + normalizedIntensity * 0.85);
            this.debugProbe.visible = true;
            this.debugProbeHideAt = time + 0.55;
        }

        if (this.config.debugExtremeSpawnIndicator) {
            if (this.debugCube) {
                this.debugCube.position.copy(pos);
                this.debugCube.scale.set(40 + (normalizedIntensity * 30), 40 + (normalizedIntensity * 30), 40 + (normalizedIntensity * 30));
                this.debugCube.visible = true;
                this.debugCubeVisible = true;
            }
        }
        
        this.spawnParticle(pos, vel, color, size, life, time);
    }

    /**
     * Public API: Emit a splash burst at a specific location
     */
    emitSplash(position, intensity, time) {
        if (!this.enabled) return;

        const normalizedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));

        // Trigger Audio (Harmonic Healing Tone)
        if (this.audioSystem && this.audioSystem.triggerHealingTone) {
            this.audioSystem.triggerHealingTone(position, normalizedIntensity);
        }

        const particleCount = Math.max(8, Math.floor(14 * normalizedIntensity));
        const color = this._tmpColor;
        
        for (let i = 0; i < particleCount; i++) {
            // ATOMA_HEALING_SESSION136_v2: Zero-allocation random direction (reuse _tmpVec3B)
            const dir = this._tmpVec3B.set(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            const speed = 2.0 + Math.random() * 3.0;
            dir.multiplyScalar(speed * normalizedIntensity);

            // SACRED_POLISH: Sacred healing palette (sacred gold / celestial teal / spectral white-gold)
            if (this.config.debugForceRedParticles) {
                color.setHex(0xff0000);
            } else if (Math.random() > 0.6) {
                color.setRGB(0.25, 0.88, 0.82);   // Celestial teal accent
            } else if (Math.random() > 0.4) {
                color.setRGB(1.0, 0.84, 0.0);      // Sacred gold
            } else {
                color.setRGB(1.0, 0.94, 0.82);     // Spectral white-gold highlight
            }

            const size = this.config.baseSize * (1.1 + Math.random() * 1.2);
            const life = 0.5 + Math.random() * 0.5;

            // ATOMA_HEALING_SESSION136_v2: Reuse _tmpVec3A for position
            this.spawnParticle(this._tmpVec3A.copy(position), dir, color, size, life, time);
        }

        // DESIGN: Convergence ring — expanding ring of particles at splash point
        // Creates a dramatic "healing pulse" ring at high intensity
        if (normalizedIntensity > 0.5) {
            const ringParticleCount = Math.floor(8 + normalizedIntensity * 10);
            const ringRadius = 0.3 + normalizedIntensity * 0.5;
            for (let i = 0; i < ringParticleCount; i++) {
                const angle = (i / ringParticleCount) * Math.PI * 2;
                const ringDir = this._tmpVec3B.set(
                    Math.cos(angle) * ringRadius,
                    0.1 + Math.random() * 0.15,
                    Math.sin(angle) * ringRadius
                ).normalize();

                const speed = 1.5 + normalizedIntensity * 2.0;
                ringDir.multiplyScalar(speed);

                // Ring particles are brighter — white-cyan
                // SACRED_POLISH: Ring particles — spectral white-gold / celestial teal
                if (!this.config.debugForceRedParticles) {
                    const ringHue = Math.random();
                    if (ringHue > 0.5) {
                        color.setRGB(1.0, 0.94, 0.82);   // Spectral white-gold
                    } else {
                        color.setRGB(0.25, 0.88, 0.82);   // Celestial teal
                    }
                } else {
                    color.setHex(0xff0000);
                }

                const ringSize = this.config.baseSize * (0.8 + normalizedIntensity * 0.6);
                const ringLife = 0.35 + normalizedIntensity * 0.3;

                this.spawnParticle(this._tmpVec3A.copy(position), ringDir, color, ringSize, ringLife, time);
            }
        }
    }

    getStats() {
        const birthTimes = this.geometry?.attributes?.birthTime?.array;
        const lifetimes = this.geometry?.attributes?.lifetime?.array;
        let activeParticles = 0;

        if (birthTimes && lifetimes) {
            const now = Number.isFinite(this.lastUpdateTime) ? this.lastUpdateTime : 0;
            for (let i = 0; i < birthTimes.length; i++) {
                const birth = birthTimes[i];
                const life = lifetimes[i];
                if (birth >= 0 && life > 0 && now >= birth && (now - birth) <= life) {
                    activeParticles++;
                }
            }
        }

        return {
            enabled: this.enabled,
            particleCount: this.config.maxParticles,
            activeParticles,
            particleIndex: this.particleIndex,
            lastUpdateTime: this.lastUpdateTime,
            scarEmissionTargets: this.scarEmissions.size,
            config: {
                maxParticles: this.config.maxParticles,
                sparkleRate: this.config.sparkleRate,
                baseLifetime: this.config.baseLifetime,
                baseSize: this.config.baseSize,
                trailDensity: this.config.trailDensity,
                lodDistance: this.config.lodDistance
            }
        };
    }
    
    dispose() {
        if (this.mesh) {
            if (this.pointFXBase?.disposePointCloud) {
                this.pointFXBase.disposePointCloud(this.mesh);
            } else {
                this.scene.remove(this.mesh);
                this.geometry.dispose();
                this.material.dispose();
            }
        }
        this.pointFXBase = null;
        this.scarEmissions.clear();
        this.enabled = false;
    }
}
