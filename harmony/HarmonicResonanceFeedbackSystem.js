/**
 * ============================================================================
 * HARMONIC RESONANCE FEEDBACK SYSTEM
 * ============================================================================
 * 
 * Composite glyphs emit subtle resonance fields that influence nearby link motion.
 * 
 * CORE PHILOSOPHY:
 * Meaning shapes motion. Composite glyphs (synthesized semantic structures)
 * gently bend the surrounding network flow—not controlling, but guiding
 * through harmonic resonance.
 * 
 * This is a closed visual feedback loop where emergent structures
 * influence the motion they help coordinate.
 * 
 * ============================================================================
 * 
 * RESONANCE MECHANICS:
 * 
 * 1. RESONANCE FIELD
 *    - Each active composite glyph emits a soft spatial field
 *    - Field radius scales with harmony/synergy
 *    - Field strength decays inversely with distance
 *    - No hard boundary (gaussian falloff)
 * 
 * 2. INFLUENCED ELEMENTS
 *    - Nearby Links: Wave motion aligns to glyph rhythm, phase drifts toward resonance
 *    - Energy Streaks: Slight curvature bias, speed sync with glyph pulse
 *    - Pictogram Flow: Non-fused glyphs slow/improve spacing/align nearby
 * 
 * 3. STATE MODULATION
 *    - Harmony expands influence, improves alignment, stabilizes motion
 *    - Corruption distorts field, causes misalignment, reduces range
 *    - Synergy improves rhythmic coherence, makes feedback legible
 *    - Instability weakens feedback, no noise added
 * 
 * 4. TEMPORAL BEHAVIOR
 *    - Resonance builds gradually during synthesis
 *    - Peaks while composite glyph is stable
 *    - Decays smoothly after separation
 *    - No instantaneous effects
 * 
 * VISUAL RESTRAINT:
 * - NO new particles, glow bursts, color changes, or motion overrides
 * - YES subtle phase influence, gentle smoothing, calm authority
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../VisualHierarchyRegistry.js';
import { getLinkSynergyVisualMetrics } from '../SemanticMetricAdapter.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Resonance field
    BASE_RESONANCE_RADIUS: 3.5,      // Base influence radius (POLISHED: reduced from 4.0 for tighter, calmer fields)
    MIN_RESONANCE_RADIUS: 2.0,
    MAX_RESONANCE_RADIUS: 6.0,       // POLISHED: reduced from 7.0 to prevent excessive spread
    RESONANCE_DECAY_POWER: 2.5,      // POLISHED: increased from 2.0 for faster, smoother falloff
    
    // Harmony/Corruption modulation
    HARMONY_RADIUS_MULTIPLIER: 1.35, // POLISHED: reduced from 1.5 (calmer expansion)
    CORRUPTION_RADIUS_MULTIPLIER: 0.6, // POLISHED: increased from 0.5 (less dramatic collapse)
    
    // Alignment strength - POLISH: Reduced all values for subtle influence
    BASE_ALIGNMENT_STRENGTH: 0.22,   // POLISHED: reduced from 0.3 (22% influence - more subtle)
    HARMONY_ALIGNMENT_BOOST: 1.3,    // POLISHED: reduced from 1.4 (28.6% max - calmer)
    CORRUPTION_ALIGNMENT_DAMPEN: 0.5, // POLISHED: increased from 0.4 (11% min - less harsh)
    SYNERGY_ALIGNMENT_BOOST: 1.2,    // POLISHED: reduced from 1.3 (calmer synergy boost)
    
    // Phase drift - POLISH: Slower, more deliberate motion
    BASE_PHASE_DRIFT_SPEED: 0.4,     // POLISHED: reduced from 0.5 (slower, weighted drift)
    HARMONY_PHASE_SPEED: 0.6,        // POLISHED: reduced from 0.7 (more deliberate)
    CORRUPTION_PHASE_SPEED: 0.25,    // POLISHED: increased from 0.2 (less jarring slowdown)
    
    // Energy streak influence - POLISH: More conservative
    STREAK_CURVATURE_STRENGTH: 0.12, // POLISHED: reduced from 0.15 (gentler bias)
    STREAK_SPEED_MODULATION: 0.15,   // POLISHED: reduced from 0.2 (±15% - calmer variation)
    
    // Pictogram flow influence - POLISH: Refined for smoothness
    PICTOGRAM_SLOW_FACTOR: 0.88,     // POLISHED: increased from 0.85 (12% slowdown - less dramatic)
    PICTOGRAM_SPACING_IMPROVEMENT: 1.12, // POLISHED: reduced from 1.15 (12% - subtle improvement)
    PICTOGRAM_ALIGNMENT_STRENGTH: 0.5, // POLISHED: reduced from 0.6 (softer orientation)
    
    // Temporal ramp - POLISH: Smoother transitions
    RESONANCE_BUILD_DURATION: 1.5,   // POLISHED: increased from 1.2 (slower, calmer ramp-up)
    RESONANCE_DECAY_DURATION: 2.0,   // POLISHED: increased from 1.5 (longer, graceful fade)
    
    // Performance
    MAX_INFLUENCED_LINKS_PER_ZONE: 12, // Hard cap for performance
    UPDATE_INTERVAL: 1 / 30,            // Skip intervals for perf
    
    // Debug
    DEBUG_DRAW_FIELDS: false
};

function computeAttenuation(distance, radius) {
    if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) return 0;
    return Math.max(0, 1 - distance / radius);
}

// ============================================================================
// RESONANCE FIELD STATE
// ============================================================================

class ResonanceField {
    constructor() {
        this.active = false;
        this.position = new THREE.Vector3();
        this.compositeGlyph = null;  // Reference to composite glyph instance
        this.debugMesh = null;
        
        // Current strength
        this.strength = 0.0;           // 0-1 (ramps up/down)
        this.targetStrength = 1.0;    // Target after ramp-up
        
        // Pulse rhythm
        this.pulsePhase = 0.0;         // For oscillating field strength
        this.pulsePeriod = 2.0;        // 2-second pulse period
        
        // State influence
        this.harmonyBalance = 0.5;
        this.synergy = 0.5;
        this.stability = 0.5;
        
        // Influenced links tracking
        this.influencedLinks = [];      // Array of {link, distance, influenceStrength}
        this.influencedGlyphs = [];     // Array of {pictogram, distance}
        
        // Age tracking
        this.age = 0.0;
        this.rampAge = 0.0;
    }
    
    reset() {
        this.active = false;
        this.compositeGlyph = null;
        this.strength = 0.0;
        this.targetStrength = 1.0;
        this.age = 0.0;
        this.rampAge = 0.0;
        this.pulsePhase = 0.0;
        this.influencedLinks.length = 0;
        this.influencedGlyphs.length = 0;
        if (this.debugMesh) {
            this.debugMesh.visible = false;
        }
    }
    
    initialize(compositeGlyph, harmonyBalance, synergy, stability) {
        this.active = true;
        this.compositeGlyph = compositeGlyph;
        this.harmonyBalance = harmonyBalance;
        this.synergy = synergy;
        this.stability = stability;
        this.strength = 0.0;
        this.targetStrength = 1.0;
        this.age = 0.0;
        this.rampAge = 0.0;
        this.pulsePhase = 0.0;
    }
    
    // ========================================================================
    // FIELD PROPERTIES
    // ========================================================================
    
    getRadius() {
        let radius = CONFIG.BASE_RESONANCE_RADIUS;
        
        // Harmony/corruption modulation
        const harmonyInfluence = this.harmonyBalance - 0.5; // -0.5 to +0.5
        if (harmonyInfluence > 0) {
            radius *= (1.0 + harmonyInfluence * (CONFIG.HARMONY_RADIUS_MULTIPLIER - 1.0));
        } else {
            radius *= (1.0 + harmonyInfluence * (1.0 - CONFIG.CORRUPTION_RADIUS_MULTIPLIER));
        }

        const stabilityScale = 0.9 + (Number.isFinite(this.stability) ? this.stability : 0.5) * 0.2;
        radius *= stabilityScale;
        
        return Math.max(CONFIG.MIN_RESONANCE_RADIUS, 
                       Math.min(CONFIG.MAX_RESONANCE_RADIUS, radius));
    }
    
    getPhaseDriftSpeed() {
        const harmonyInfluence = this.harmonyBalance - 0.5;
        const stability = Number.isFinite(this.stability) ? this.stability : 0.5;
        const stabilityDampening = 1.0 - Math.max(0.0, stability - 0.5) * 0.25;
        if (harmonyInfluence > 0) {
            return CONFIG.HARMONY_PHASE_SPEED * stabilityDampening;
        } else {
            return CONFIG.CORRUPTION_PHASE_SPEED * stabilityDampening;
        }
    }
    
    // ========================================================================
    // DISTANCE-BASED INFLUENCE
    // ========================================================================
    
    getInfluenceAtDistance(distance) {
        const radius = this.getRadius();
        if (distance > radius) return 0.0;

        const stability = Number.isFinite(this.stability) ? this.stability : 0.5;
        const stabilityScale = 0.85 + stability * 0.3;
        return this.strength * computeAttenuation(distance, radius) * stabilityScale;
    }
    
    // ========================================================================
    // UPDATE
    // ========================================================================
    
    update(deltaTime) {
        if (!this.active) return;
        this.age += deltaTime;
        this.rampAge += deltaTime;
        
        // POLISHED: Smooth ease-in-out ramp (no linear transitions)
        const rawProgress = Math.min(1.0, this.rampAge / CONFIG.RESONANCE_BUILD_DURATION);
        const easedProgress = this.smoothEaseInOut(rawProgress);
        
        // Interpolate toward target with eased curve
        const diff = this.targetStrength - this.strength;
        this.strength += diff * easedProgress * 0.1;  // POLISHED: Smooth asymptotic approach
        
        // Pulse modulation (adds subtle rhythm)
        this.pulsePhase += deltaTime * (Math.PI * 2 / this.pulsePeriod);
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }
    
    // POLISHED: Smooth ease-in-out curve (S-curve)
    smoothEaseInOut(t) {
        return t * t * (3.0 - 2.0 * t);
    }
    
    // Initiate fade-out (after composite glyph separates)
    startDecay() {
        this.targetStrength = 0.0;
    }
    
    isDecayed() {
        return this.targetStrength === 0.0 && this.strength < 0.01;
    }
}

// ============================================================================
// PROBABILITY CLOUDS RENDERER
// Quantum uncertainty visualization - particles representing wave function
// ============================================================================

const PROBABILITY_CLOUDS_CONFIG = {
    enabled: true,
    maxParticles: 8000,
    particlesPerRadiusUnit: 8,  // Dynamic particles based on field size
    particleSize: 0.15,

    // Colors based on stability
    colorHighStability: new THREE.Color(0x00ffff),   // Cyan - stable
    colorMidStability: new THREE.Color(0xff00ff),    // Magenta
    colorLowStability: new THREE.Color(0xff4488),    // Red-pink - chaotic

    // Animation
    driftSpeedMin: 0.1,
    driftSpeedMax: 0.3,
    quantumNoiseStrength: 0.15,

    // Performance
    maxActiveFields: 30,
    updateInterval: 0.08,  // ~12.5 Hz
    lodDistance: 50.0,

    // Visual
    maxOpacity: 0.5,
    fadeInDuration: 0.5,
    fadeOutDuration: 1.0
};

class ProbabilityCloudsRenderer {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...PROBABILITY_CLOUDS_CONFIG, ...config };

        // Particle system
        this.particleMesh = null;
        this.particleGeometry = null;
        this.particleMaterial = null;

        // Particle data (CPU-side for updates)
        this.particleData = [];  // { fieldIndex, localT, randomOffset, driftSpeed, life }
        this.particleCount = 0;

        // Field tracking
        this.activeFields = [];  // { field, particleIndices, particleCount, fadePhase }
        this.fieldParticleCounts = new Map();  // field -> { startIndex, count }

        // Timing
        this.time = 0;
        this.lastUpdateTime = 0;

        // Reusable objects to avoid per-frame allocations
        this._colorCache = new THREE.Color();
        this._colorCacheA = new THREE.Color();
        this._colorCacheB = new THREE.Color();

        // Initialize
        this._initializeParticleSystem();
    }

    _initializeParticleSystem() {
        // Create shared buffer geometry
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(this.config.maxParticles * 3), 3)
        );
        this.particleGeometry.setAttribute(
            'color',
            new THREE.BufferAttribute(new Float32Array(this.config.maxParticles * 3), 3)
        );
        this.particleGeometry.setAttribute(
            'alpha',
            new THREE.BufferAttribute(new Float32Array(this.config.maxParticles), 1)
        );
        this.particleGeometry.setAttribute(
            'size',
            new THREE.BufferAttribute(new Float32Array(this.config.maxParticles), 1)
        );

        // Initialize particle data arrays
        for (let i = 0; i < this.config.maxParticles; i++) {
            this.particleData.push({
                fieldIndex: -1,
                localT: Math.random(),
                randomOffset: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                driftSpeed: this.config.driftSpeedMin + Math.random() * (this.config.driftSpeedMax - this.config.driftSpeedMin),
                life: 0.0
            });

            // Initialize geometry attributes
            const pos = this.particleGeometry.attributes.position.array;
            pos[i * 3] = 0;
            pos[i * 3 + 1] = 0;
            pos[i * 3 + 2] = 0;

            const col = this.particleGeometry.attributes.color.array;
            col[i * 3] = 1;
            col[i * 3 + 1] = 1;
            col[i * 3 + 2] = 1;

            const alpha = this.particleGeometry.attributes.alpha.array;
            alpha[i] = 0;

            const size = this.particleGeometry.attributes.size.array;
            size[i] = this.config.particleSize;
        }

        // Create custom shader material — upgraded with spectral ring + shimmer
        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColorHighStability: { value: this.config.colorHighStability },
                uColorMidStability: { value: this.config.colorMidStability },
                uColorLowStability: { value: this.config.colorLowStability },
                uMaxOpacity: { value: this.config.maxOpacity }
            },
            vertexShader: `
                uniform float uTime;
                attribute float alpha;
                attribute float size;
                varying float vAlpha;

                void main() {
                    vAlpha = alpha;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColorHighStability;
                uniform vec3 uColorMidStability;
                uniform vec3 uColorLowStability;
                uniform float uTime;
                varying float vAlpha;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    // Core glow with soft falloff
                    float glow = exp(-dist * 5.0);

                    // Spectral ring at ~0.35 radius for depth
                    float ring = exp(-pow((dist - 0.32) * 8.0, 2.0)) * 0.35;

                    // Subtle angular shimmer for liveliness
                    float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
                    float shimmer = 0.88 + 0.12 * sin(angle * 3.0 + uTime * 1.5);

                    // Stability-driven color: smoothstep instead of hard thresholds
                    vec3 color = mix(uColorLowStability, uColorMidStability, smoothstep(0.2, 0.55, vAlpha));
                    color = mix(color, uColorHighStability, smoothstep(0.55, 0.9, vAlpha));

                    // Core whitening at high alpha
                    color += vec3(0.15, 0.12, 0.08) * smoothstep(0.7, 1.0, vAlpha);

                    float finalAlpha = vAlpha * (glow + ring) * shimmer;
                    gl_FragColor = vec4(color, finalAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        // Create mesh
        this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.particleMesh.frustumCulled = false;
        this.scene.add(this.particleMesh);

        console.log('[ProbabilityCloudsRenderer] Initialized with', this.config.maxParticles, 'particles');
    }

    /**
     * Allocate particles for a field
     */
    _allocateParticlesForField(field) {
        if (!field.active || field.strength < 0.01) return;

        const radius = field.getRadius();
        const particleCount = Math.min(
            Math.floor(radius * this.config.particlesPerRadiusUnit),
            100  // Max per field
        );

        if (particleCount <= 0) return;

        // Find free particles
        const indices = [];
        for (let i = 0; i < this.config.maxParticles && indices.length < particleCount; i++) {
            if (this.particleData[i].fieldIndex === -1 || this.particleData[i].life <= 0) {
                indices.push(i);
            }
        }

        if (indices.length === 0) return;  // No free particles

        // Initialize particles
        for (const idx of indices) {
            this.particleData[idx].fieldIndex = this.resonanceFields.indexOf(field);
            this.particleData[idx].localT = Math.random();
            this.particleData[idx].life = 0.0;  // Will fade in
            this.particleData[idx].randomOffset.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
        }

        // Track field particles
        this.fieldParticleCounts.set(field, {
            startIndex: indices[0],
            count: indices.length
        });

        // Add to active fields
        this.activeFields.push({
            field,
            particleIndices: indices,
            particleCount: indices.length,
            fadePhase: 'in'  // in, active, out
        });
    }

    /**
     * Deallocate particles for a field
     */
    _deallocateParticlesForField(field) {
        const activeFieldIdx = this.activeFields.findIndex(f => f.field === field);
        if (activeFieldIdx === -1) return;

        const activeField = this.activeFields[activeFieldIdx];
        activeField.fadePhase = 'out';

        // Mark particles for fade-out
        for (const idx of activeField.particleIndices) {
            this.particleData[idx].life = 1.0;  // Will fade out
        }
    }

    /**
     * Update particles based on fields
     */
    update(deltaTime, resonanceFields) {
        if (!this.config.enabled) return;

        this.time += deltaTime;

        // Throttle updates
        if (this.time - this.lastUpdateTime < this.config.updateInterval) {
            this._updateShaderUniforms();
            return;
        }
        this.lastUpdateTime = this.time;

        // Store reference to fields for particle updates
        this.resonanceFields = resonanceFields;

        // Manage active fields
        this._manageActiveFields(resonanceFields);

        // Update all particles
        this._updateParticles(deltaTime, resonanceFields);

        // Update geometry
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
        this.particleGeometry.attributes.alpha.needsUpdate = true;
        this.particleGeometry.attributes.size.needsUpdate = true;

        // Update shader uniforms
        this._updateShaderUniforms();

        // Remove decayed fields
        this._cleanupDecayedFields();
    }

    _manageActiveFields(resonanceFields) {
        // Activate new fields
        for (const field of resonanceFields) {
            if (!field.active || field.strength < 0.01) continue;

            const isActive = this.activeFields.some(f => f.field === field);
            if (!isActive) {
                this._allocateParticlesForField(field);
            }
        }

        // Deactivate decayed fields
        for (const field of resonanceFields) {
            if (field.isDecayed()) {
                this._deallocateParticlesForField(field);
            }
        }
    }

    _updateParticles(deltaTime, resonanceFields) {
        const positions = this.particleGeometry.attributes.position.array;
        const colors = this.particleGeometry.attributes.color.array;
        const alphas = this.particleGeometry.attributes.alpha.array;
        const sizes = this.particleGeometry.attributes.size.array;
        const baseParticleSize = this.config.particleSize;

        for (let i = 0; i < this.config.maxParticles; i++) {
            const data = this.particleData[i];

            // Skip unused particles
            if (data.fieldIndex === -1 || data.fieldIndex < 0) {
                alphas[i] = 0;
                continue;
            }

            const field = resonanceFields[data.fieldIndex];
            if (!field || !field.active || field.strength < 0.01) {
                data.fieldIndex = -1;
                alphas[i] = 0;
                continue;
            }

            // Get field properties
            const stability = field.stability ?? 0.5;
            const radius = field.getRadius();
            const fieldPosition = field.position;

            // Calculate uncertainty (1 - stability)
            const uncertainty = 1.0 - stability;

            // Spawn distribution based on stability
            // High stability = clustered, Low stability = scattered
            const spreadFactor = uncertainty * 0.8 + 0.2;  // 0.2 to 1.0

            // Smooth persistent orbit using localT + time (no random jumps)
            const orbitAngle = data.localT * Math.PI * 2 + this.time * data.driftSpeed;
            const elevation = data.randomOffset.x * Math.PI;  // persistent elevation
            const orbitRadius = radius * (0.2 + Math.abs(data.randomOffset.y) * 0.8) * spreadFactor;

            const baseX = orbitRadius * Math.sin(elevation) * Math.cos(orbitAngle);
            const baseY = orbitRadius * Math.sin(elevation) * Math.sin(orbitAngle);
            const baseZ = orbitRadius * Math.cos(elevation);

            // Quantum noise overlay (more for low stability)
            const noiseScale = uncertainty * this.config.quantumNoiseStrength;
            const noiseX = Math.sin(this.time * data.driftSpeed * 1.7 + data.randomOffset.x * 10.0) * noiseScale * radius;
            const noiseY = Math.cos(this.time * data.driftSpeed * 1.3 + data.randomOffset.y * 10.0) * noiseScale * radius;
            const noiseZ = Math.sin(this.time * data.driftSpeed * 1.5 + data.randomOffset.z * 10.0) * noiseScale * radius;

            // Final position
            positions[i * 3] = fieldPosition.x + baseX + noiseX;
            positions[i * 3 + 1] = fieldPosition.y + baseY + noiseY;
            positions[i * 3 + 2] = fieldPosition.z + baseZ + noiseZ;

            // Color based on stability (zero-alloc: writes to cached color)
            this._writeStabilityColor(stability);
            colors[i * 3] = this._colorCache.r;
            colors[i * 3 + 1] = this._colorCache.g;
            colors[i * 3 + 2] = this._colorCache.b;

            // Size variation: high stability = larger, more coherent particles
            sizes[i] = baseParticleSize * (0.7 + stability * 0.6);

            // Opacity with fade
            let alpha = this.config.maxOpacity * field.strength;

            // Fade in/out
            if (data.life < 1.0) {
                data.life += deltaTime / this.config.fadeInDuration;
                alpha *= Math.min(1.0, data.life);
            } else if (data.fieldIndex === -1) {
                // Fading out
                data.life -= deltaTime / this.config.fadeOutDuration;
                alpha *= Math.max(0.0, data.life);
            }

            // Edge fade (particles closer to center are brighter)
            const distFromCenter = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
            const edgeFade = 1.0 - (distFromCenter / (radius * spreadFactor));
            alpha *= Math.max(0.0, edgeFade);

            alphas[i] = Math.max(0.0, Math.min(1.0, alpha));
        }
    }

    /**
     * Zero-alloc stability color: writes to _colorCache instead of creating new Color.
     * Uses smoothstep transitions instead of hard thresholds.
     */
    _writeStabilityColor(stability) {
        if (stability >= 0.65) {
            // Smooth blend mid → high
            const t = THREE.MathUtils.smoothstep(stability, 0.65, 0.9);
            this._colorCacheA.copy(this.config.colorMidStability);
            this._colorCacheB.copy(this.config.colorHighStability);
            this._colorCache.lerpColors(this._colorCacheA, this._colorCacheB, t);
        } else {
            // Smooth blend low → mid
            const t = THREE.MathUtils.smoothstep(stability, 0.0, 0.65);
            this._colorCacheA.copy(this.config.colorLowStability);
            this._colorCacheB.copy(this.config.colorMidStability);
            this._colorCache.lerpColors(this._colorCacheA, this._colorCacheB, t);
        }
    }

    _updateShaderUniforms() {
        this.particleMaterial.uniforms.uTime.value = this.time;
    }

    _cleanupDecayedFields() {
        // Zero-alloc: in-place compaction instead of .filter()
        let writeIdx = 0;
        for (let i = 0; i < this.activeFields.length; i++) {
            const af = this.activeFields[i];
            if (af.fadePhase === 'out') {
                let allFaded = true;
                for (let j = 0; j < af.particleIndices.length; j++) {
                    if (this.particleData[af.particleIndices[j]].life > 0) {
                        allFaded = false;
                        break;
                    }
                }
                if (allFaded) {
                    this.fieldParticleCounts.delete(af.field);
                    continue;
                }
            }
            this.activeFields[writeIdx++] = af;
        }
        this.activeFields.length = writeIdx;
    }

    /**
     * Enable/disable
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled) {
            // Clear all particles
            for (let i = 0; i < this.config.maxParticles; i++) {
                this.particleData[i].fieldIndex = -1;
                this.particleData[i].life = 0;
            }
            this.activeFields = [];
            this.fieldParticleCounts.clear();
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        // Zero-alloc: manual count instead of .filter()
        let activeParticles = 0;
        for (let i = 0; i < this.particleData.length; i++) {
            const d = this.particleData[i];
            if (d.fieldIndex !== -1 && d.life > 0) activeParticles++;
        }
        return {
            enabled: this.config.enabled,
            maxParticles: this.config.maxParticles,
            activeParticles,
            activeFields: this.activeFields.length,
            particleUtilization: (activeParticles / this.config.maxParticles * 100).toFixed(1) + '%'
        };
    }

    /**
     * Dispose
     */
    dispose() {
        if (this.particleMesh) {
            this.scene.remove(this.particleMesh);
            this.particleGeometry.dispose();
            this.particleMaterial.dispose();
            this.particleMesh = null;
        }
        this.particleData = [];
        this.activeFields = [];
        this.fieldParticleCounts.clear();
    }
}

// ============================================================================
// MAIN HARMONIC RESONANCE FEEDBACK SYSTEM
// ============================================================================

export class HarmonicResonanceFeedbackSystem {
    constructor(scene) {
        this.scene = scene;
        this.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE);
        
        // Resonance fields (one per composite glyph)
        this.resonanceFields = [];
        for (let i = 0; i < 20; i++) {  // Match max composite glyphs
            this.resonanceFields.push(new ResonanceField());
        }
        
        // Update tracking
        this.updateTimer = 0.0;
        this.lastLinkCount = 0;
        
        // Debug
        this.debugFieldVisualization = null;
        this.debugFieldGeometry = null;
        this.debugFieldMaterial = null;
        if (CONFIG.DEBUG_DRAW_FIELDS) {
            this.setupDebugVisualization();
        }
        
        this.enabled = true;
        this.timeBudgetMs = 3.5;         // soft per-frame budget to avoid stalls
        this._influenceCursor = 0;       // round-robin field processing pointer

        // Reusable scratch objects to avoid per-frame allocations
        this._linkPosScratch = new THREE.Vector3();
        this._linkPosScratch2 = new THREE.Vector3();
        this._dirScratch = new THREE.Vector3();

        // Initialize Probability Clouds Renderer
        this.probabilityClouds = null;
        try {
            this.probabilityClouds = new ProbabilityCloudsRenderer(this.scene, {
                enabled: PROBABILITY_CLOUDS_CONFIG.enabled
            });
            console.log('[HarmonicResonanceFeedbackSystem] Probability Clouds enabled ✓');
        } catch (err) {
            console.warn('[HarmonicResonanceFeedbackSystem] Probability Clouds failed:', err);
        }

        console.log('[HarmonicResonanceFeedbackSystem] Initialized');
    }
    
    // ========================================================================
    // ACTIVATION / DEACTIVATION
    // ========================================================================
    
    activateResonanceField(compositeGlyph, harmonyBalance, synergy, stability) {
        // Find available field
        for (let field of this.resonanceFields) {
            if (!field.active) {
                field.initialize(compositeGlyph, harmonyBalance, synergy, stability);
                return field;
            }
        }
        return null;
    }
    
    deactivateResonanceField(compositeGlyph) {
        for (let field of this.resonanceFields) {
            if (field.compositeGlyph === compositeGlyph && field.active) {
                field.startDecay();
                break;
            }
        }
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    update(deltaTime, fusionZoneManager, pictogramsArray, linkingSystem) {
        if (!this.enabled) return;
        
        this.updateTimer += deltaTime;
        if (this.updateTimer < CONFIG.UPDATE_INTERVAL) return;
        this.updateTimer = 0.0;
        const frameStartMs = performance.now();
        
        // Update all resonance fields
        this.updateResonanceFields(deltaTime, fusionZoneManager);
        
        // Apply influences to links and glyphs
        this.applyResonanceInfluences(deltaTime, pictogramsArray, linkingSystem, frameStartMs, this.timeBudgetMs);

        // Update probability clouds
        if (this.probabilityClouds) {
            this.probabilityClouds.update(deltaTime, this.resonanceFields);
        }

        // Update debug visualization
        if (CONFIG.DEBUG_DRAW_FIELDS) {
            this.updateDebugVisualization();
        }
    }
    
    // ========================================================================
    // RESONANCE FIELD UPDATES
    // ========================================================================
    
    updateResonanceFields(deltaTime, fusionZoneManager) {
        // Update all active fields
        for (let field of this.resonanceFields) {
            if (!field.active) continue;
            
            field.update(deltaTime);
            
            // Check if composite glyph is still active
            if (field.compositeGlyph && field.compositeGlyph.active) {
                // POLISHED: Only update position if actually changed (micro-optimization)
                const newPos = field.compositeGlyph.mesh.position;
                if (Math.abs(newPos.x - field.position.x) > 0.001 ||
                    Math.abs(newPos.y - field.position.y) > 0.001 ||
                    Math.abs(newPos.z - field.position.z) > 0.001) {
                    field.position.copy(newPos);
                }
            }
            
            // Check if fully decayed
            if (field.isDecayed()) {
                field.reset();
            }
        }
        
        // Activate new fields for recently synthesized composites
        if (fusionZoneManager && fusionZoneManager.compositeGlyphs) {
            for (let composite of fusionZoneManager.compositeGlyphs) {
                if (!composite.active) continue;
                
                // Check if this composite already has a field
                let hasField = false;
                for (let field of this.resonanceFields) {
                    if (field.compositeGlyph === composite) {
                        hasField = true;
                        break;
                    }
                }
                
                if (!hasField && composite.state) {
                    // Create new field for this composite
                    const state = composite.state;
                    const harmonyBalance = Number.isFinite(state?.harmonyBalance)
                        ? state.harmonyBalance
                        : Number.isFinite(state?.harmonBalance)
                            ? state.harmonBalance
                            : Number.isFinite(state?.harmony)
                                ? state.harmony
                                : 0.5;
                    const synergy = Number.isFinite(state?.averageSynergy)
                        ? state.averageSynergy
                        : Number.isFinite(state?.synergy)
                            ? state.synergy
                            : 0.5;
                    const stability = Number.isFinite(state?.stability)
                        ? state.stability
                        : 0.7;
                    this.activateResonanceField(
                        composite,
                        harmonyBalance,
                        synergy,
                        stability
                    );
                }
            }
        }
        
        // Deactivate fields for separated composites
        for (let i = 0; i < this.resonanceFields.length; i++) {
            const field = this.resonanceFields[i];
            if (!field.active) continue;
            
            if (field.compositeGlyph && !field.compositeGlyph.active) {
                field.startDecay();
            }
        }
    }
    
    // ========================================================================
    // RESONANCE INFLUENCE APPLICATION
    // ========================================================================
    
    applyResonanceInfluences(deltaTime, pictogramsArray, linkingSystem, frameStartMs, budgetMs) {
        if (!pictogramsArray || !linkingSystem) return;
        const totalFields = this.resonanceFields.length;
        if (totalFields === 0) return;

        let processed = 0;

        // Round-robin through fields to avoid starving later entries when budget hits
        while (processed < totalFields) {
            const idx = (this._influenceCursor + processed) % totalFields;
            const field = this.resonanceFields[idx];
            processed += 1;
            if (!field.active || field.strength < 0.01) continue;
            
            // Find influenced links and glyphs
            this.findInfluencedElements(field, pictogramsArray, linkingSystem);
            
            // Apply influences
            this.applyLinkInfluence(field, deltaTime);
            this.applyPictogramInfluence(field, deltaTime);

            // Time budget guard: exit early and resume next frame
            if (performance.now() - frameStartMs > budgetMs) {
                this._influenceCursor = (idx + 1) % totalFields;
                return;
            }
        }

        // Completed full pass; reset cursor
        this._influenceCursor = 0;
    }
    
    findInfluencedElements(field, pictogramsArray, linkingSystem) {
        field.influencedLinks.length = 0;
        field.influencedGlyphs.length = 0;
        
        if (!pictogramsArray) return;
        
        const maxLinks = CONFIG.MAX_INFLUENCED_LINKS_PER_ZONE;
        const candidates = [];
        
        // Scan pictograms for nearby links
        for (let pictogram of pictogramsArray) {
            if (!pictogram.active || !pictogram.link) continue;
            
            const link = pictogram.link;
            
            // Find center of link (midpoint)
            const linkPos = this.getLinkPosition(link);
            if (!linkPos) continue;
            
            const distance = linkPos.distanceTo(field.position);
            const influence = field.getInfluenceAtDistance(distance);
            
            if (influence > 0.01) {
                candidates.push({
                    pictogram,
                    link,
                    distance,
                    influence,
                    linkPos
                });
            }
        }
        
        // Sort by distance and keep top N
        candidates.sort((a, b) => a.distance - b.distance);
        
        for (let i = 0; i < Math.min(maxLinks, candidates.length); i++) {
            const cand = candidates[i];
            field.influencedLinks.push({
                pictogram: cand.pictogram,
                link: cand.link,
                distance: cand.distance,
                influenceStrength: cand.influence,
                linkPos: cand.linkPos
            });
        }
    }
    
    getLinkPosition(link) {
        const visualState = this._getLinkVisualState(link);
        const curve = visualState?.mainCurve?.getPointAt ? visualState.mainCurve
            : visualState?.curve?.getPointAt ? visualState.curve
            : null;

        if (curve?.getPointAt) {
            return curve.getPointAt(0.5, this._linkPosScratch);
        }

        const endpoints = this._getLinkEndpoints(link);
        if (endpoints.startPos && endpoints.endPos) {
            return this._linkPosScratch.addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5);
        }

        if (link?.geometry?.attributes?.position) {
            const positions = link.geometry.attributes.position;
            const count = positions.count;
            if (count > 0) {
                const midIndex = Math.floor(count / 2);
                return this._linkPosScratch.set(
                    positions.getX(midIndex),
                    positions.getY(midIndex),
                    positions.getZ(midIndex)
                );
            }
        }

        return null;
    }
    
    // ========================================================================
    // LINK INFLUENCE
    // ========================================================================
    
    applyLinkInfluence(field, deltaTime) {
        const phaseDriftSpeed = field.getPhaseDriftSpeed();
        
        for (let item of field.influencedLinks) {
            if (!item.link || !item.link.userData) continue;
            
            const userData = item.link.userData;
            const synergyProfile = getLinkSynergyVisualMetrics(item.link) ?? {};
            const targetAlignment = THREE.MathUtils.clamp(
                ((Number.isFinite(synergyProfile.synergy) ? synergyProfile.synergy : 0) +
                 (Number.isFinite(item.link.userData.metrics?.harmony) ? item.link.userData.metrics.harmony : 0)) * 0.5,
                0,
                1
            );
            const previousAlignment = Number.isFinite(userData._alignmentStrength)
                ? userData._alignmentStrength
                : targetAlignment;
            const alignmentStrength = previousAlignment + (targetAlignment - previousAlignment) * 0.1;
            userData._alignmentStrength = alignmentStrength;
            
            // Apply phase alignment
            // Phase property typically stored in userData for wave effects
            if (typeof userData.phase === 'number') {
                const phaseInfluence = alignmentStrength * item.influenceStrength;
                const targetPhase = field.compositeGlyph?.mesh?.rotation?.z || 0;
                
                const phaseDelta = targetPhase - userData.phase;
                const wrappedDelta = this.wrapAngle(phaseDelta);
                
                userData.phase += wrappedDelta * phaseInfluence * deltaTime;
            }
            
            // Smooth motion coherence (no override, just gentling)
            if (userData.oscillationPhase !== undefined) {
                // Reduce abruptness of oscillations
                if (userData.oscillationAmplitude !== undefined) {
                    userData.oscillationAmplitude = THREE.MathUtils.lerp(
                        userData.oscillationAmplitude,
                        userData.oscillationAmplitude * 0.95,  // Subtle smoothing
                        item.influenceStrength * 0.1
                    );
                }
            }
        }
    }

    _getLinkVisualState(link) {
        return link?.group?.userData?.conduitState || null;
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }
    
    wrapAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    // ========================================================================
    // PICTOGRAM INFLUENCE
    // ========================================================================
    
    applyPictogramInfluence(field, deltaTime) {
        for (let item of field.influencedLinks) {
            const pictogram = item.pictogram;
            if (!pictogram || pictogram.userData === undefined) continue;
            
            // Only affect non-fused pictograms
            if (pictogram.isFused) continue;
            
            const influence = item.influenceStrength;
            
            // Gentle slowdown
            if (pictogram.userData.drift !== undefined) {
                pictogram.userData.drift *= THREE.MathUtils.lerp(
                    1.0,
                    CONFIG.PICTOGRAM_SLOW_FACTOR,
                    influence * 0.3
                );
            }
            
            // Improve spacing (increase interval)
            if (pictogram.userData.spawnInterval !== undefined) {
                pictogram.userData.spawnInterval *= THREE.MathUtils.lerp(
                    1.0,
                    CONFIG.PICTOGRAM_SPACING_IMPROVEMENT,
                    influence * 0.2
                );
            }
            
            // Gentle orientation alignment toward resonance center
            if (pictogram.mesh && field.compositeGlyph && field.compositeGlyph.mesh) {
                // Zero-alloc: use scratch vector instead of .clone()
                const dirToResonance = this._dirScratch.copy(field.position)
                    .sub(item.linkPos)
                    .normalize();
                
                // Add subtle rotation bias (not override)
                const targetRot = Math.atan2(dirToResonance.y, dirToResonance.x);
                const currentRot = pictogram.mesh.rotation.z || 0;
                
                const rotDelta = this.wrapAngle(targetRot - currentRot);
                pictogram.mesh.rotation.z += rotDelta * influence * 0.05 * deltaTime;
            }
        }
    }
    
    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================
    
    enable() {
        this.enabled = true;
        console.log('[HarmonicResonanceFeedbackSystem] ENABLED');
    }
    
    disable() {
        this.enabled = false;
        for (let field of this.resonanceFields) {
            field.reset();
        }
        console.log('[HarmonicResonanceFeedbackSystem] DISABLED');
    }

    dispose() {
        // Dispose probability clouds
        if (this.probabilityClouds) {
            this.probabilityClouds.dispose();
            this.probabilityClouds = null;
        }

        // Dispose debug visualization
        if (this.debugFieldVisualization) {
            this.scene.remove(this.debugFieldVisualization);
            if (this.debugFieldGeometry) {
                this.debugFieldGeometry.dispose();
            }
            if (this.debugFieldMaterial) {
                this.debugFieldMaterial.dispose();
            }
            this.debugFieldVisualization = null;
        }

        console.log('[HarmonicResonanceFeedbackSystem] Disposed');
    }

    // ========================================================================
    // DEBUG VISUALIZATION
    // ========================================================================
    
    setupDebugVisualization() {
        this.ensureDebugResources();

        const container = new THREE.Group();
        container.name = 'ResonanceFieldDebug';
        container.renderOrder = this.renderOrder;
        this.scene.add(container);
        this.debugFieldVisualization = container;
    }

    ensureDebugResources() {
        if (!this.debugFieldGeometry) {
            this.debugFieldGeometry = new THREE.IcosahedronGeometry(1, 2);
        }

        if (!this.debugFieldMaterial) {
            this.debugFieldMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.2,
                wireframe: true
            });
        }
    }
    
    updateDebugVisualization() {
        if (!this.debugFieldVisualization) return;

        this.ensureDebugResources();

        for (let field of this.resonanceFields) {
            if (field.debugMesh) {
                field.debugMesh.visible = false;
            }
        }
        
        // Draw active field spheres
        for (let field of this.resonanceFields) {
            if (!field.active || field.strength < 0.01) continue;
            
            const radius = field.getRadius();

            if (!field.debugMesh) {
                field.debugMesh = new THREE.Mesh(this.debugFieldGeometry, this.debugFieldMaterial.clone());
                field.debugMesh.frustumCulled = false;
                this.debugFieldVisualization.add(field.debugMesh);
            }

            field.debugMesh.visible = true;
            field.debugMesh.position.copy(field.position);
            field.debugMesh.scale.setScalar(radius);
            field.debugMesh.renderOrder = this.renderOrder;
            field.debugMesh.material.opacity = field.strength * 0.2;
        }
    }
    
    // ========================================================================
    // STATUS & CONSOLE API
    // ========================================================================
    
    getStatus() {
        // Zero-alloc: manual counting instead of .filter()
        let activeFields = 0;
        let decayingFields = 0;
        for (let i = 0; i < this.resonanceFields.length; i++) {
            const f = this.resonanceFields[i];
            if (f.active) activeFields++;
            else if (f.strength > 0.01) decayingFields++;
        }

        const status = {
            enabled: this.enabled,
            activeFields,
            decayingFields,
            totalCapacity: this.resonanceFields.length
        };

        // Add probability clouds statistics
        if (this.probabilityClouds) {
            status.probabilityClouds = this.probabilityClouds.getStats();
        }

        return status;
    }
}

// ============================================================================
// CONSOLE API
// ============================================================================

export function setupHarmonicResonanceConsoleAPI(game, resonanceSystem) {
    if (!window.game) return;
    
    window.game.resonanceStatus = () => {
        const status = resonanceSystem.getStatus();
        console.log('[Resonance] Status:', status);
        return status;
    };
    
    window.game.enableResonance = () => {
        resonanceSystem.enable();
    };
    
    window.game.disableResonance = () => {
        resonanceSystem.disable();
    };
    
    window.game.toggleResonanceDebug = () => {
        CONFIG.DEBUG_DRAW_FIELDS = !CONFIG.DEBUG_DRAW_FIELDS;
        console.log('[Resonance] Debug visualization:', CONFIG.DEBUG_DRAW_FIELDS);
    };

    // Probability Clouds Console API
    window.game.probabilityClouds = {
        enable: () => {
            if (resonanceSystem.probabilityClouds) {
                resonanceSystem.probabilityClouds.setEnabled(true);
                console.log('[Probability Clouds] Enabled');
            }
        },
        disable: () => {
            if (resonanceSystem.probabilityClouds) {
                resonanceSystem.probabilityClouds.setEnabled(false);
                console.log('[Probability Clouds] Disabled');
            }
        },
        setDensity: (density) => {
            if (resonanceSystem.probabilityClouds) {
                const oldDensity = resonanceSystem.probabilityClouds.config.particlesPerRadiusUnit;
                resonanceSystem.probabilityClouds.config.particlesPerRadiusUnit = Math.max(1, Math.min(20, density));
                console.log(`[Probability Clouds] Density: ${oldDensity} -> ${resonanceSystem.probabilityClouds.config.particlesPerRadiusUnit}`);
            }
        },
        setParticleSize: (size) => {
            if (resonanceSystem.probabilityClouds) {
                const oldSize = resonanceSystem.probabilityClouds.config.particleSize;
                resonanceSystem.probabilityClouds.config.particleSize = Math.max(0.05, Math.min(0.5, size));
                console.log(`[Probability Clouds] Particle size: ${oldSize} -> ${resonanceSystem.probabilityClouds.config.particleSize}`);
            }
        },
        setUncertaintyScale: (scale) => {
            if (resonanceSystem.probabilityClouds) {
                const oldScale = resonanceSystem.probabilityClouds.config.quantumNoiseStrength;
                resonanceSystem.probabilityClouds.config.quantumNoiseStrength = Math.max(0, Math.min(1, scale));
                console.log(`[Probability Clouds] Uncertainty scale: ${oldScale} -> ${resonanceSystem.probabilityClouds.config.quantumNoiseStrength}`);
            }
        },
        stats: () => {
            if (resonanceSystem.probabilityClouds) {
                const stats = resonanceSystem.probabilityClouds.getStats();
                console.table(stats);
                return stats;
            } else {
                console.log('[Probability Clouds] Not available');
                return null;
            }
        }
    };

    console.log('[HarmonicResonanceFeedbackSystem] Console API ready:');
    console.log('  game.resonanceStatus()');
    console.log('  game.enableResonance()');
    console.log('  game.disableResonance()');
    console.log('  game.toggleResonanceDebug()');
    console.log('[Probability Clouds] Console API ready:');
    console.log('  game.probabilityClouds.enable()');
    console.log('  game.probabilityClouds.disable()');
    console.log('  game.probabilityClouds.setDensity(n)');
    console.log('  game.probabilityClouds.setParticleSize(n)');
    console.log('  game.probabilityClouds.setUncertaintyScale(n)');
    console.log('  game.probabilityClouds.stats()');
}
