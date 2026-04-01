import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { projectHudMetrics } from './SemanticMetricAdapter.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

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

const SPARKLE_VERTEX_SHADER = `
uniform float uTime;
uniform float uScale;
attribute float birthTime;
attribute float lifetime;
attribute vec3 velocity;
attribute float size;
attribute vec3 color;
attribute float layer;
varying vec3 vColor;
varying float vAlpha;
varying float vLayer;

void main() {
    float age = uTime - birthTime;
    
    // Cull inactive/dead particles
    if (age < 0.0 || age > lifetime) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Move outside clip space
        return;
    }
    
    // Normalized life progress (0.0 to 1.0)
    float progress = age / lifetime;
    
    // Physics: Simple linear velocity + slight rise
    vec3 pos = position + velocity * age;
    pos.y += 0.2 * age * age; // Gentle upward drift

    // 4D hypercube stereographic projection
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

    // Blend between base and hypercube to keep continuity
    vec3 finalPos = mix(pos, hyperPos * 0.65, 0.86);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation with layer-dependent pulsation
    float sizePulse = 1.0 + 0.35 * sin(uTime * 4.0 + layer * 0.5);
    gl_PointSize = size * uScale * sizePulse * (300.0 / -mvPosition.z);
    
    // Fade in/out, preserved as pop effect
    float alpha = 1.0;
    if (progress < 0.1) alpha = progress * 10.0;
    else alpha = 1.0 - ((progress - 0.1) / 0.9);
    
    vAlpha = alpha;
    vLayer = layer / 15.0;
    vColor = mix(color, vec3(0.35, 0.9, 1.0), 0.35 + 0.35 * sin(uTime * 0.8 + layer));
}
`;

const SPARKLE_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;
varying float vLayer;

void main() {
    // Debug-friendly square particle shape with hard readable edges.
    vec2 p = abs(gl_PointCoord.xy - vec2(0.5));
    float d = max(p.x, p.y);
    if (d > 0.5) discard;

    float boxGlow = 1.0 - smoothstep(0.18, 0.5, d);
    float edgeGlow = smoothstep(0.48, 0.36, d);

    // Hypercube layer color shift
    vec3 layerTint = mix(vec3(0.95, 0.65, 1.0), vec3(0.15, 1.0, 0.9), vLayer);
    vec3 boosted = (vColor + layerTint * 0.8) * (1.25 + edgeGlow * 0.75);

    gl_FragColor = vec4(boosted, vAlpha * boxGlow);
}
`;

export class HealingParticleSystem_Session136 {
    constructor(scene, resonanceRuptureSystem, audioSystem, config = {}) {
        this.scene = scene;
        this.resonanceRupture = resonanceRuptureSystem;
        this.audioSystem = audioSystem; // Integration: Audio System
        
        this.config = {
            maxParticles: 3500,
            sparkleRate: 1.15,     // Sparkles per scar per second; keeps scars readable without over-spawning
            baseLifetime: 2.0,
            baseSize: 0.24,
            trailDensity: 5,       // Particles per unit distance
            lodDistance: 100,
            debugVisualBoost: true,
            debugForceRedParticles: true,
            debugExtremeSpawnIndicator: false, // temporary debug mode for huge cube
            debugSpawnProbe: true,
            debugSpawnLogs: true,
            ...config
        };
        
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
        }

        if (this.config.debugExtremeSpawnIndicator && this.debugCube && this.scene && this.debugCube.parent !== this.scene) {
            this.scene.add(this.debugCube);
        }

        if (this.config.debugSpawnProbe && this.debugProbe && this.scene && this.debugProbe.parent !== this.scene) {
            this.scene.add(this.debugProbe);
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
                    uScale: { value: this.config.debugVisualBoost ? 1.75 : 1.0 }
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: false
            })
            : new THREE.ShaderMaterial({
            vertexShader: SPARKLE_VERTEX_SHADER,
            fragmentShader: SPARKLE_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: this.config.debugVisualBoost ? 1.75 : 1.0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.mesh = new THREE.Points(this.geometry, this.material);
        this.mesh.frustumCulled = false; // Always update (particles move)
        this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
        if (this.pointFXBase) {
            this.pointFXBase.ensureAttached(this.mesh);
        } else {
            this.scene.add(this.mesh);
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
        }

        if (this.config.debugSpawnProbe) {
            this.debugProbe = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 10, 10),
                new THREE.MeshBasicMaterial({
                    color: 0xff4d7d,
                    transparent: true,
                    opacity: 0.92,
                    depthWrite: false,
                    depthTest: false
                })
            );
            this.debugProbe.visible = false;
            this.debugProbe.renderOrder = 999;
            this.scene.add(this.debugProbe);
        }
    }
    
    /**
     * Spawn a single particle
     */
    spawnParticle(pos, vel, color, size, life, startTime) {
        const i = this.particleIndex;
        
        // Update attributes at current index
        this.geometry.attributes.position.setXYZ(i, pos.x, pos.y, pos.z);
        this.geometry.attributes.velocity.setXYZ(i, vel.x, vel.y, vel.z);
        this.geometry.attributes.color.setXYZ(i, color.r, color.g, color.b);
        this.geometry.attributes.birthTime.setX(i, startTime);
        this.geometry.attributes.lifetime.setX(i, life);
        this.geometry.attributes.size.setX(i, size);

        // Hypercube layer index 0..15
        const layerIndex = Math.floor(Math.random() * 16);
        this.geometry.attributes.layer.setX(i, layerIndex);
        
        // Mark for update
        this.geometry.attributes.position.needsUpdate = true; // Optimization: set ranges?
        this.geometry.attributes.velocity.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.birthTime.needsUpdate = true;
        this.geometry.attributes.lifetime.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.layer.needsUpdate = true;
        
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
        
        // Random point on scar mesh (plane)
        // Scar is scaled by link length (x) and width (y)
        const scale = mesh.scale;
        const randX = (Math.random() - 0.5) * scale.x;
        const randY = (Math.random() - 0.5) * scale.y;
        
        // Local to World
        const localPos = new THREE.Vector3(randX, randY, 0);
        localPos.applyMatrix4(mesh.matrixWorld);
        
        // Gentle drift velocity (upward + outward)
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            0.2 + Math.random() * 0.3, // Upward bias
            (Math.random() - 0.5) * 0.2
        );
        
        // Color: Warm white/gold or forced red for debug.
        const color = this.config.debugForceRedParticles
            ? new THREE.Color(0xff0000)
            : new THREE.Color(1.0, 0.95, 0.8);
        if (!this.config.debugForceRedParticles && (state?.harmonyFlow ?? 0) > 0.6) {
            color.setHex(0x00ffff); // Neon cyan tint for high harmony
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
        
        // Elongated appearance is simulated by velocity streaking in perception
        // or we could use specific textures. For Points, we rely on density.
        
        const color = this.config.debugForceRedParticles ? new THREE.Color(0xff0000) : (colorOverride instanceof THREE.Color ? colorOverride : new THREE.Color(0x66f7ff)); // experimental red override
        const size = this.config.baseSize * (0.18 + normalizedIntensity * 0.8); // Slightly smaller particles for clean trails
        const life = 0.5 + normalizedIntensity * 0.8; // Shorter lifetimes for faster motion
        
        // Throttle debug log to max once per 30 seconds
        if (!this.lastDebugLogTime) {
            this.lastDebugLogTime = 0;
        }
        if (this.config.debugSpawnLogs && time - this.lastDebugLogTime >= 30) {
            console.error('[HealingParticleSystem DEBUG] emitHealingTrail spawned at', position.toArray(), 'intensity', normalizedIntensity, 'time', time);
            this.lastDebugLogTime = time;
        }

        // Add slight spread
        const spread = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        const pos = position.clone().add(spread);
        
        // Trail follows incoming velocity for more readable motion
        const vel = velocity.clone().multiplyScalar(0.7);

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

        const particleCount = Math.max(8, Math.floor(14 * normalizedIntensity)); // Burst size based on intensity
        
        for (let i = 0; i < particleCount; i++) {
            // Random direction in sphere
            const dir = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            // Speed variation
            const speed = 2.0 + Math.random() * 3.0; 
            const vel = dir.multiplyScalar(speed * normalizedIntensity);

            // Color: Golden/Cyan burst, optionally forced red for debug.
            const color = this.config.debugForceRedParticles
                ? new THREE.Color(0xff0000)
                : new THREE.Color(1.0, 0.15, 0.95); // Neon magenta base
            if (!this.config.debugForceRedParticles && Math.random() > 0.5) {
                color.setHex(0x00ffff); // Cyan accents
            }

            const size = this.config.baseSize * (1.1 + Math.random() * 1.2);
            const life = 0.5 + Math.random() * 0.5;

            // Start exactly at position
            this.spawnParticle(position.clone(), vel, color, size, life, time);
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
