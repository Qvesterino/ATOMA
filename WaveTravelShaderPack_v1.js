import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

// Private symbol to track patched materials (survives all registration cycles)
const TRAVEL_PACK_PATCHED = Symbol('waveTravelPackPatched');

/**
 * WAVE TRAVEL SHADER PACK v1.0
 * 
 * GPU shader extensions for traveling-wave motion effects.
 * Adds vertex displacement, UV flow, color gradients, and pulse bursts
 * driven by wave uniforms from WaveShaderBridge_v1.
 * 
 * FEATURES:
 * ✓ 5 motion profiles (LINEAR, SINE, PULSE, INTERFERENCE, RIFT)
 * ✓ Multi-frequency oscillation (low/mid/high bands)
 * ✓ Vertex travel offset via uWavePhase
 * ✓ UV flow animation based on wave phase
 * ✓ Color gradient shift along geometry
 * ✓ Pulse burst on high interference
 * ✓ Rift chaotic motion (destructive interference)
 * ✓ Safe onBeforeCompile injection (no source modification)
 * ✓ WeakMap tracking + automatic GC
 * ✓ 100% optional chaining & try-catch defensive code
 * ✓ Per-material isolation (no cross-contamination)
 * 
 * PROFILES:
 * - TRAVEL_LINEAR   : Smooth linear motion along phase
 * - TRAVEL_SINE     : Sine wave oscillation (breathing)
 * - TRAVEL_PULSE    : Sharp pulse bursts with echo
 * - TRAVEL_INTERFERENCE : Multi-frequency interference patterns
 * - TRAVEL_RIFT     : Chaotic destructive interference motion
 */

// ============================================================================
// PROFILE CONFIGURATIONS
// ============================================================================

const PROFILE_CONFIG = {
    TRAVEL_LINEAR: {
        name: 'Linear Travel',
        vertexTravel: 0.08,         // Vertex offset scale
        uvFlow: 0.4,                // UV animation speed
        colorGradient: 0.6,         // Color shift intensity
        pulseStrength: 0.2,         // Pulse effect power
        frequencyMix: [1.0, 0.0, 0.0], // [low, mid, high]
        chaotic: 0.0                // Chaos/randomness
    },
    TRAVEL_SINE: {
        name: 'Sine Wave',
        vertexTravel: 0.12,
        uvFlow: 0.6,
        colorGradient: 0.7,
        pulseStrength: 0.3,
        frequencyMix: [0.6, 0.3, 0.1],
        chaotic: 0.05
    },
    TRAVEL_PULSE: {
        name: 'Pulse Burst',
        vertexTravel: 0.18,
        uvFlow: 0.8,
        colorGradient: 0.9,
        pulseStrength: 0.8,
        frequencyMix: [0.3, 0.4, 0.3],
        chaotic: 0.1
    },
    TRAVEL_INTERFERENCE: {
        name: 'Interference',
        vertexTravel: 0.15,
        uvFlow: 0.5,
        colorGradient: 0.8,
        pulseStrength: 0.4,
        frequencyMix: [0.33, 0.33, 0.34],
        chaotic: 0.15
    },
    TRAVEL_RIFT: {
        name: 'Rift Chaos',
        vertexTravel: 0.25,
        uvFlow: 1.0,
        colorGradient: 1.0,
        pulseStrength: 0.6,
        frequencyMix: [0.2, 0.3, 0.5],
        chaotic: 0.5
    }
};

// ============================================================================
// SHADER CODE CHUNKS
// ============================================================================

/**
 * Multi-frequency oscillation shader function
 */
const MULTI_FREQ_OSCILLATION = `
// Multi-frequency oscillation blending
float multiFreqOscillation(float phase, vec3 freqMix, float time) {
    float lowFreq = sin(phase * 2.0 + time * 0.5) * 0.5 + 0.5;      // Slow
    float midFreq = sin(phase * 6.0 + time * 2.0) * 0.3 + 0.3;       // Medium
    float highFreq = sin(phase * 18.0 + time * 6.0) * 0.2 + 0.2;     // Fast
    return lowFreq * freqMix.x + midFreq * freqMix.y + highFreq * freqMix.z;
}

// Chaotic noise for rift motion
float chaoticNoise(vec3 pos, float time, float intensity) {
    float chaos = sin(pos.x * 3.1 + time) * 0.5;
    chaos += sin(pos.y * 2.7 + time * 1.3) * 0.3;
    chaos += sin(pos.z * 4.3 + time * 0.7) * 0.2;
    return chaos * intensity;
}
`;

/**
 * Vertex shader travel chunk
 */
const VERTEX_TRAVEL_CHUNK = `
    // Wave travel vertex effects
    float travelPhase = uWavePhase * 6.28318; // Convert to radians
    
    // Multi-frequency oscillation
    float oscillation = multiFreqOscillation(travelPhase, uWaveTravelFreqMix, time);
    
    // Base travel offset
    float travelOffset = oscillation * uWaveTravelScale * uWaveIntensity;
    
    // Chaotic component
    float chaos = chaoticNoise(position, time, uWaveTravelChaos);
    
    // Combine offsets
    float totalTravel = travelOffset + chaos * 0.5;
    
    // Apply to position along normal
    transformed += normal * totalTravel * 0.1;
    
    // Additional pulse burst when interference is high
    if (uWaveInterference > 0.6) {
        float pulseMagnitude = (uWaveInterference - 0.6) * uWaveTravelPulse;
        float pulseWave = sin(time * 8.0 + length(position));
        transformed += normal * pulseWave * pulseMagnitude * 0.05;
    }
`;

/**
 * Fragment shader travel chunk (UV flow + color gradient)
 */
const FRAGMENT_TRAVEL_CHUNK = `
    // UV flow animation
    vec2 uvTravel = vUv;
    uvTravel.x += time * uWaveTravelUVFlow * uWavePhase;
    uvTravel.y += sin(time * 0.5 + uvTravel.x * 4.0) * 0.1 * uWaveTravelUVFlow;
    
    // Clamp for tileable patterns
    uvTravel = fract(uvTravel);
    
    // Color gradient shift along geometry (using world position)
    float gradientPhase = dot(vWorldPosition, vec3(0.5)) * 0.5 + time * 0.3;
    float gradientPos = sin(gradientPhase) * 0.5 + 0.5;
    
    // Interference color cycling
    vec3 travelColor = vec3(
        0.5 + 0.5 * sin(gradientPos + 0.0),
        0.5 + 0.5 * sin(gradientPos + 2.094),  // +120°
        0.5 + 0.5 * sin(gradientPos + 4.189)   // +240°
    );
    
    // Modulate by wave intensity and constructive power
    float colorIntensity = uWaveIntensity * (0.5 + 0.5 * uWaveConstructive);
    diffuse.rgb = mix(diffuse.rgb, travelColor, uWaveTravelColorGradient * colorIntensity);
    
    // Pulse brightness modulation on high interference
    if (uWaveInterference > 0.5) {
        float pulseBrightness = sin(time * 4.0 + length(vWorldPosition)) * 0.3 + 0.7;
        diffuse.rgb *= mix(1.0, pulseBrightness, (uWaveInterference - 0.5) * 2.0 * uWaveTravelPulse);
    }
`;

/**
 * World position varying (shared with bridge)
 */
const WORLD_POSITION_VARYING = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    #ifdef USE_VERTEX_SHADER
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
    #endif
`;

// ============================================================================
// WAVE TRAVEL SHADER PACK v1.0
// ============================================================================

export class WaveTravelShaderPack_v1 {
    /**
     * Constructor
     * @param {Object} options - Configuration
     * @param {boolean} options.enableDebug - Console logging
     * @param {boolean} options.enableWarnings - Warning logs
     */
    constructor({ enableDebug = false, enableWarnings = false } = {}) {
        try {
            this.debugEnabled = enableDebug;
            this.warningsEnabled = enableWarnings;

            // Track registered materials
            this.registeredMaterials = new WeakSet();
            this.materialProfiles = new WeakMap();
            this.originalOnBeforeCompile = new WeakMap();
            this.materialUniforms = new WeakMap();

            // Global time for shader animations
            this.globalTime = 0;
            this._waveTravelTimeOrigin = undefined;

            if (this.debugEnabled) {
                console.log('[WaveTravelShaderPack_v1] Initialized ✓');
            }
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] Constructor error:', e);
        }
    }

    /**
     * Register a material for travel wave effects
     * @param {THREE.Material} material - Material to register
     * @param {string} profile - Profile (TRAVEL_LINEAR, TRAVEL_SINE, TRAVEL_PULSE, TRAVEL_INTERFERENCE, TRAVEL_RIFT)
     */
    register(material, profile = 'TRAVEL_LINEAR') {
        try {
            if (!material) {
                if (this.warningsEnabled) console.warn('[WaveTravelShaderPack_v1] register: material is null');
                return false;
            }

            // Material-level guard: prevent duplicate shader recompilation
            if (material[TRAVEL_PACK_PATCHED]) return false;

            // Check if already registered
            if (this.registeredMaterials.has(material)) {
                if (this.debugEnabled) console.log('[WaveTravelShaderPack_v1] Material already registered');
                return false;
            }

            // Validate profile
            if (!PROFILE_CONFIG[profile]) {
                if (this.warningsEnabled) console.warn(`[WaveTravelShaderPack_v1] Unknown profile: ${profile}, using TRAVEL_LINEAR`);
                profile = 'TRAVEL_LINEAR';
            }

            // Store profile
            this.materialProfiles.set(material, profile);

            // Store original onBeforeCompile
            this.originalOnBeforeCompile.set(material, material.onBeforeCompile || (() => {}));

            // Create new onBeforeCompile
            material.onBeforeCompile = (shader) => {
                try {
                    // Call original if exists
                    const originalCompile = this.originalOnBeforeCompile.get(material);
                    originalCompile?.(shader);

                    // Inject travel shader code
                    this._injectTravelShaders(shader, profile);
                } catch (e) {
                    console.warn('[WaveTravelShaderPack_v1] onBeforeCompile patch error:', e);
                }
            };

            // Mark as registered
            this.registeredMaterials.add(material);

            // Mark material as patched (persists across all registration cycles)
            material[TRAVEL_PACK_PATCHED] = true;

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Material registered (profile: ${profile})`);
            }

            return true;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] register error:', e);
            return false;
        }
    }

    /**
     * Unregister a material
     * @param {THREE.Material} material - Material to unregister
     */
    unregister(material) {
        try {
            if (!material || !this.registeredMaterials.has(material)) {
                return false;
            }

            // Restore original onBeforeCompile
            const original = this.originalOnBeforeCompile.get(material);
            material.onBeforeCompile = original;

            // Remove from tracking
            this.registeredMaterials.delete?.(material);

            if (this.debugEnabled) {
                console.log('[WaveTravelShaderPack_v1] Material unregistered');
            }

            return true;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] unregister error:', e);
            return false;
        }
    }

    /**
     * Change profile for a registered material
     * @param {THREE.Material} material - Material instance
     * @param {string} profile - New profile
     */
    setProfile(material, profile = 'TRAVEL_LINEAR') {
        try {
            if (!this.registeredMaterials.has(material)) {
                if (this.warningsEnabled) console.warn('[WaveTravelShaderPack_v1] setProfile: material not registered');
                return false;
            }

            // Validate profile
            if (!PROFILE_CONFIG[profile]) {
                if (this.warningsEnabled) console.warn(`[WaveTravelShaderPack_v1] Unknown profile: ${profile}`);
                return false;
            }

            // Update profile
            this.materialProfiles.set(material, profile);

            // Force shader recompilation on next render
            material.needsUpdate = true;

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Profile changed to: ${profile}`);
            }

            return true;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] setProfile error:', e);
            return false;
        }
    }

    /**
     * Update per-frame (advances global time for animations)
     * @param {number} deltaTime - Frame delta time
     */
    update(deltaTime) {
        try {
        // RUNTIME GUARD: Ensure registeredMaterials is valid and iterable
        if (!this.registeredMaterials || 
            (!Array.isArray(this.registeredMaterials) && !(this.registeredMaterials instanceof Set))) {
            return;
        }

        if (this._waveTravelTimeOrigin === undefined) {
            this._waveTravelTimeOrigin = VisualTime.now;
        }

        const currentWaveTime = VisualTime.now - this._waveTravelTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
        this.globalTime = currentWaveTime;

            // Update all registered material uniforms
            for (const material of this.registeredMaterials) {
                const uniforms = this.materialUniforms.get(material);
                if (uniforms?.uWaveTravelTime) {
                    uniforms.uWaveTravelTime.value = currentWaveTime;
                }
            }
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] update error:', e);
        }
    }

    /**
     * Internal: Inject travel shader code
     */
    _injectTravelShaders(shader, profile) {
        try {
            const config = PROFILE_CONFIG[profile] || PROFILE_CONFIG.TRAVEL_LINEAR;

            // Ensure core uniforms exist
            shader.uniforms = shader.uniforms || {};
            shader.uniforms.uWavePhase = shader.uniforms.uWavePhase || { value: 0 };
            shader.uniforms.uWaveIntensity = shader.uniforms.uWaveIntensity || { value: 0 };
            shader.uniforms.uWaveInterference = shader.uniforms.uWaveInterference || { value: 0 };
            shader.uniforms.uWaveConstructive = shader.uniforms.uWaveConstructive || { value: 0 };
            shader.uniforms.uWaveDestructive = shader.uniforms.uWaveDestructive || { value: 0 };
            shader.uniforms.uWaveStanding = shader.uniforms.uWaveStanding || { value: 0 };

            // Add travel-specific uniforms
            shader.uniforms.uWaveTravelScale = shader.uniforms.uWaveTravelScale || { value: config.vertexTravel };
            shader.uniforms.uWaveTravelUVFlow = shader.uniforms.uWaveTravelUVFlow || { value: config.uvFlow };
            shader.uniforms.uWaveTravelColorGradient = shader.uniforms.uWaveTravelColorGradient || { value: config.colorGradient };
            shader.uniforms.uWaveTravelPulse = shader.uniforms.uWaveTravelPulse || { value: config.pulseStrength };
            shader.uniforms.uWaveTravelFreqMix = shader.uniforms.uWaveTravelFreqMix || {
                value: new THREE.Vector3(...config.frequencyMix)
            };
            shader.uniforms.uWaveTravelChaos = shader.uniforms.uWaveTravelChaos || { value: config.chaotic };
            shader.uniforms.uWaveTravelTime = shader.uniforms.uWaveTravelTime || { value: this.globalTime };

            // Store uniforms for future updates
            this.materialUniforms.set(shader.material || {}, shader.uniforms);

            // Inject multi-frequency function and chaos function
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                 ${MULTI_FREQ_OSCILLATION}
                 `
            );

            // Inject world position varying
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                 ${WORLD_POSITION_VARYING}
                 `
            );

            // Inject vertex travel effects
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `${VERTEX_TRAVEL_CHUNK}
                 #include <project_vertex>
                 `
            );

            // Inject fragment travel effects
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `${FRAGMENT_TRAVEL_CHUNK}
                 #include <dithering_fragment>
                 `
            );

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Travel shaders injected (profile: ${profile})`);
            }
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] _injectTravelShaders error:', e);
        }
    }

    /**
     * Register multiple materials at once
     * @param {Array<THREE.Material>} materials - Materials to register
     * @param {string} profile - Profile for all materials
     */
    registerBatch(materials, profile = 'TRAVEL_LINEAR') {
        try {
            if (!Array.isArray(materials)) {
                if (this.warningsEnabled) console.warn('[WaveTravelShaderPack_v1] registerBatch: materials is not an array');
                return 0;
            }

            let count = 0;
            for (const material of materials) {
                if (this.register(material, profile)) {
                    count++;
                }
            }

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Batch registered ${count}/${materials.length} materials`);
            }

            return count;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] registerBatch error:', e);
            return 0;
        }
    }

    /**
     * Unregister multiple materials
     * @param {Array<THREE.Material>} materials - Materials to unregister
     */
    unregisterBatch(materials) {
        try {
            if (!Array.isArray(materials)) {
                if (this.warningsEnabled) console.warn('[WaveTravelShaderPack_v1] unregisterBatch: materials is not an array');
                return 0;
            }

            let count = 0;
            for (const material of materials) {
                if (this.unregister(material)) {
                    count++;
                }
            }

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Batch unregistered ${count}/${materials.length} materials`);
            }

            return count;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] unregisterBatch error:', e);
            return 0;
        }
    }

    /**
     * Check if material is registered
     * @param {THREE.Material} material - Material to check
     */
    isRegistered(material) {
        return this.registeredMaterials?.has?.(material) ?? false;
    }

    /**
     * Get profile for material
     * @param {THREE.Material} material - Material instance
     */
    getProfile(material) {
        try {
            return this.materialProfiles.get(material) || 'TRAVEL_LINEAR';
        } catch (e) {
            return 'TRAVEL_LINEAR';
        }
    }

    /**
     * Get metrics
     */
    getMetrics() {
        try {
            return {
                registeredMaterialCount: this.registeredMaterials?.size ?? 0,
                globalTime: this.globalTime,
                profiles: Object.keys(PROFILE_CONFIG)
            };
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] getMetrics error:', e);
            return {};
        }
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        try {
            this.registeredMaterials = null;
            this.materialProfiles = null;
            this.originalOnBeforeCompile = null;
            this.materialUniforms = null;
            this.globalTime = 0;

            if (this.debugEnabled) {
                console.log('[WaveTravelShaderPack_v1] Disposed ✓');
            }
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] dispose error:', e);
        }
    }

    /**
     * Set debug mode
     */
    setDebugEnabled(enabled) {
        this.debugEnabled = !!enabled;
    }

    /**
     * Set warnings enabled
     */
    setWarningsEnabled(enabled) {
        this.warningsEnabled = !!enabled;
    }

    /**
     * Get all available profiles
     */
    static listProfiles() {
        return Object.keys(PROFILE_CONFIG);
    }

    /**
     * Get profile configuration
     * @param {string} profile - Profile name
     */
    static getProfileConfig(profile = 'TRAVEL_LINEAR') {
        return PROFILE_CONFIG[profile] || PROFILE_CONFIG.TRAVEL_LINEAR;
    }
}

export default WaveTravelShaderPack_v1;
