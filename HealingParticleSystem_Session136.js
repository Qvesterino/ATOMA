import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { projectHudMetrics } from './SemanticMetricAdapter.js';

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
varying vec3 vColor;
varying float vAlpha;

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
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = size * uScale * (300.0 / -mvPosition.z);
    
    // Fade in/out
    float alpha = 1.0;
    if (progress < 0.1) alpha = progress * 10.0;
    else alpha = 1.0 - ((progress - 0.1) / 0.9);
    
    vAlpha = alpha;
    vColor = color;
}
`;

const SPARKLE_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;

void main() {
    // Debug-friendly square particle shape with hard readable edges.
    vec2 p = abs(gl_PointCoord.xy - vec2(0.5));
    float d = max(p.x, p.y);
    if (d > 0.5) discard;

    float boxGlow = 1.0 - smoothstep(0.18, 0.5, d);
    float edgeGlow = smoothstep(0.48, 0.36, d);
    vec3 boosted = vColor * (1.35 + edgeGlow * 0.65);

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
            ...config
        };
        
        // Pools & State
        this.particleIndex = 0;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.enabled = true;
        
        // Internal tracking
        this.lastUpdateTime = 0;
        this.accumulatedTime = 0;
        this.scarEmissions = new Map(); // scarId -> accumulated emission
        
        this.setup();
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
        
        // Fill with default invisible values
        birthTimes.fill(-1000);
        
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('birthTime', new THREE.BufferAttribute(birthTimes, 1).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1).setUsage(THREE.DynamicDrawUsage));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
        
        this.material = new THREE.ShaderMaterial({
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
        
        this.scene.add(this.mesh);
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
        
        // Mark for update
        this.geometry.attributes.position.needsUpdate = true; // Optimization: set ranges?
        this.geometry.attributes.velocity.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.birthTime.needsUpdate = true;
        this.geometry.attributes.lifetime.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        
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
        
        // Color: Warm white/gold
        const color = new THREE.Color(1.0, 0.95, 0.8);
        if ((state?.harmonyFlow ?? 0) > 0.6) color.setHex(0x00ffff); // Neon cyan tint for high harmony
        
        const lifetime = this.config.baseLifetime * (0.8 + Math.random() * 0.4);
        const size = this.config.baseSize * (0.85 + Math.random() * 0.3);
        
        this.spawnParticle(localPos, vel, color, size, lifetime, time);
    }
    
    /**
     * Public API: Emit a healing trail particle
     * To be called by HarmonicHealingVisualSystem
     */
    emitHealingTrail(position, velocity, intensity, time) {
        if (!this.enabled) return;

        const normalizedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
        
        // Elongated appearance is simulated by velocity streaking in perception
        // or we could use specific textures. For Points, we rely on density.
        
        const color = new THREE.Color(0x66f7ff); // Electric cyan
        const size = this.config.baseSize * (1.2 + normalizedIntensity * 0.9);
        const life = 0.7 + normalizedIntensity * 0.7; // Stronger waves = longer-lived traces
        
        // Add slight spread
        const spread = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        const pos = position.clone().add(spread);
        
        // Trail stays roughly in place or drags behind?
        // "Trails must follow the exact wave path" -> Stationary particles fading out,
        // effectively tracing the line.
        const vel = new THREE.Vector3(0,0,0); 
        
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

            // Color: Golden/Cyan burst
            const color = new THREE.Color(1.0, 0.15, 0.95); // Neon magenta base
            if (Math.random() > 0.5) color.setHex(0x00ffff); // Cyan accents

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
            this.scene.remove(this.mesh);
            this.geometry.dispose();
            this.material.dispose();
        }
        this.scarEmissions.clear();
        this.enabled = false;
    }
}
