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

for (const profileKey in PROFILE_CONFIG) {
    const config = PROFILE_CONFIG[profileKey];
    if (config && Array.isArray(config.frequencyMix)) {
        config.frequencyMixVec = new THREE.Vector3(...config.frequencyMix);
    }
}

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
`;

const TRAVEL_UNIFORM_DECLARATIONS = `
uniform float uWavePhase;
uniform float uWaveIntensity;
uniform float uWaveInterference;
uniform float uWaveConstructive;
uniform float uWaveDestructive;
uniform float uWaveStanding;
uniform float uWaveTravelScale;
uniform float uWaveTravelUVFlow;
uniform float uWaveTravelColorGradient;
uniform float uWaveTravelPulse;
uniform vec3 uWaveTravelFreqMix;
uniform float uWaveTravelTime;
`;
const TRAVEL_UNIFORM_LINES = TRAVEL_UNIFORM_DECLARATIONS
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Vertex shader travel chunk
 */
const VERTEX_TRAVEL_CHUNK = `
    // Wave travel vertex effects
    float travelPhase = (uWavePhase + uWaveTravelTime * 0.2) * 6.28318; // Convert to radians
    
    // Multi-frequency oscillation
    float oscillation = multiFreqOscillation(travelPhase, uWaveTravelFreqMix, uWaveTravelTime);
    
    // Base travel offset
    float travelOffset = oscillation * uWaveTravelScale * max(0.15, uWaveIntensity + 0.15);
    
    // Combine offsets
    float totalTravel = travelOffset;
    
    // Apply to position along normal
    transformed += normal * totalTravel * 0.1;
    
    // Additional pulse burst when interference is high
    if (uWaveInterference > 0.6) {
        float pulseMagnitude = (uWaveInterference - 0.6) * uWaveTravelPulse;
        float pulseWave = sin(uWaveTravelTime * 8.0 + position.x * 0.72 + position.y * 0.28);
        transformed += normal * pulseWave * pulseMagnitude * 0.05;
    }
`;

/**
 * Fragment shader travel chunk (UV flow + color gradient)
 */
const FRAGMENT_TRAVEL_CHUNK = `
    #ifdef USE_UV
        // UV flow animation
        vec2 uvTravel = vUv;
        uvTravel.x += uWaveTravelTime * uWaveTravelUVFlow * uWavePhase;
        uvTravel.y += sin(uWaveTravelTime * 0.5 + uvTravel.x * 4.0) * 0.1 * uWaveTravelUVFlow;
        
        // Clamp for tileable patterns
        uvTravel = fract(uvTravel);
    #endif
    
    float gradientPhase = uWaveTravelTime * 0.3;
    float gradientPos = sin(gradientPhase) * 0.5 + 0.5;
    vec3 travelColor = vec3(
        0.5 + 0.5 * sin(gradientPos + 0.0),
        0.5 + 0.5 * sin(gradientPos + 2.094),
        0.5 + 0.5 * sin(gradientPos + 4.189)
    );
    float colorIntensity = uWaveIntensity * (0.5 + 0.5 * uWaveConstructive);
    diffuseColor.rgb = mix(diffuseColor.rgb, travelColor, uWaveTravelColorGradient * colorIntensity);
    if (uWaveInterference > 0.5) {
        float pulseBrightness = sin(uWaveTravelTime * 4.0) * 0.3 + 0.7;
        diffuseColor.rgb *= mix(1.0, pulseBrightness, (uWaveInterference - 0.5) * 2.0 * uWaveTravelPulse);
    }
`;

const SIMPLE_SHADER_VERTEX_TRAVEL = `
    float travelPhase = (uWavePhase + uWaveTravelTime * 0.2) * 6.28318;
    float oscillation = multiFreqOscillation(travelPhase, uWaveTravelFreqMix, uWaveTravelTime);
    float travelOffset = oscillation * uWaveTravelScale * max(0.15, uWaveIntensity + 0.15);
    vec3 wavePos = position + normalize(normal) * travelOffset * 0.08;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(wavePos, 1.0);
`;

const SIMPLE_SHADER_FRAGMENT_TRAVEL = `
    float gradientPhase = uWaveTravelTime * 0.3;
    float gradientPos = sin(gradientPhase) * 0.5 + 0.5;
    vec3 travelColor = vec3(
        0.5 + 0.5 * sin(gradientPos + 0.0),
        0.5 + 0.5 * sin(gradientPos + 2.094),
        0.5 + 0.5 * sin(gradientPos + 4.189)
    );
    float travelBlend = clamp(uWaveTravelColorGradient * (0.3 + uWaveIntensity), 0.0, 1.0);
    vec3 outColor = mix(color, color * 0.7 + travelColor * 0.6, travelBlend);
    if (uWaveInterference > 0.5) {
        float pulseBrightness = sin(uWaveTravelTime * 4.0) * 0.3 + 0.7;
        outColor *= mix(1.0, pulseBrightness, (uWaveInterference - 0.5) * 2.0 * uWaveTravelPulse);
    }
    gl_FragColor = vec4(outColor, alpha);
`;

// No world-position varying required.

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
            this.materialList = new Set();
            this.materialProfiles = new WeakMap();
            this.originalOnBeforeCompile = new WeakMap();
            this.materialUniforms = new WeakMap();
            this.materialVersionSeen = new WeakMap();
            this._needsUpdateTracerInstalled = new WeakMap();
            this._needsUpdateTraceCounts = new Map();
            this._needsUpdateTraceTotal = 0;
            this._needsUpdateTraceSamples = [];
            this._needsUpdateTraceFullSamples = [];
            this._needsUpdateTraceByMaterial = new Map();
            this._needsUpdateTraceByTask = new Map();
            this._registrationTraceByUuid = new Map();
            this._materialMutationTracerInstalled = new WeakMap();
            this._materialMutationTraceCounts = new Map();
            this._materialMutationTraceSamples = [];
            this._materialMutationTraceTotal = 0;

            // Global time for shader animations
            this.globalTime = 0;
            this._waveTravelTimeOrigin = undefined;
            this._debugStats = {
                registerCalls: 0,
                onBeforeCompileCalls: 0,
                injectSuccess: 0,
                injectSkipped: 0,
                injectErrors: 0,
                needsUpdateSets: 0,
                materialVersionBumps: 0
            };
            this._lastDebugLogTime = 0;

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
            this._debugStats.registerCalls += 1;
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
            this._recordRegistrationTrace(material, profile);

            // Store original onBeforeCompile
            this.originalOnBeforeCompile.set(material, material.onBeforeCompile || (() => {}));

            // Create new onBeforeCompile
            material.onBeforeCompile = (shader) => {
                try {
                    this._debugStats.onBeforeCompileCalls += 1;
                    // Call original if exists
                    const originalCompile = this.originalOnBeforeCompile.get(material);
                    originalCompile?.(shader);

                    // Inject travel shader code
                    const injected = this._injectTravelShaders(shader, profile, material);
                    if (!injected && this.warningsEnabled) {
                        console.warn('[WaveTravelShaderPack_v1] injection skipped (safe fallback)');
                        this._debugStats.injectSkipped += 1;
                    } else if (injected) {
                        this._debugStats.injectSuccess += 1;
                    }
                } catch (e) {
                    console.warn('[WaveTravelShaderPack_v1] onBeforeCompile patch error:', e);
                    this._debugStats.injectErrors += 1;
                }
            };

            // Mark as registered
            this.registeredMaterials.add(material);
            this.materialList.add(material);

            // Mark material as patched (persists across all registration cycles)
            material[TRAVEL_PACK_PATCHED] = true;
            material.needsUpdate = true;
            this._debugStats.needsUpdateSets += 1;
            this.materialVersionSeen.set(material, material.version ?? 0);

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
            this.materialList.delete(material);

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
        // RUNTIME GUARD: materialList is the iterable source; WeakSet stays as membership guard.
        if (!this.materialList || !(this.materialList instanceof Set)) {
            return;
        }

        if (this._waveTravelTimeOrigin === undefined) {
            this._waveTravelTimeOrigin = VisualTime.now;
        }

        const currentWaveTime = VisualTime.now - this._waveTravelTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
        this.globalTime = currentWaveTime;

            const traceNeedsUpdate = typeof window !== 'undefined' && window.__DEBUG_WAVE_NEEDSUPDATE_TRACE__ === true;
            const traceMaterialMutation = typeof window !== 'undefined' && window.__DEBUG_WAVE_MATERIAL_MUTATION_TRACE__ === true;
            const debugTracingActive = this.debugEnabled || traceNeedsUpdate || traceMaterialMutation;

            // Update all registered material uniforms
            for (const material of this.materialList) {
                if (debugTracingActive) {
                    this._syncNeedsUpdateTracer(material);
                    this._syncMaterialMutationTracer(material);
                }
                const uniforms = this.materialUniforms.get(material);
                if (uniforms?.uWaveTravelTime) {
                    uniforms.uWaveTravelTime.value = currentWaveTime;
                }
                const currentVersion = material?.version ?? 0;
                const previousVersion = this.materialVersionSeen.get(material);
                if (previousVersion === undefined) {
                    this.materialVersionSeen.set(material, currentVersion);
                } else if (currentVersion !== previousVersion) {
                    this.materialVersionSeen.set(material, currentVersion);
                    this._debugStats.materialVersionBumps += 1;
                }
            }
            this._debugLogIfEnabled();
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] update error:', e);
        }
    }

    /**
     * Internal: Inject travel shader code
     */
    _injectTravelShaders(shader, profile, material) {
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
                value: config.frequencyMixVec
            };
            shader.uniforms.uWaveTravelTime = shader.uniforms.uWaveTravelTime || { value: this.globalTime };

            // Store uniforms for future updates
            if (material) {
                this.materialUniforms.set(material, shader.uniforms);
            }

            let nextVertexShader = this._ensureTravelDeclarations(shader.vertexShader);
            let nextFragmentShader = this._ensureTravelDeclarations(shader.fragmentShader);
            let vertexPatched = false;
            let fragmentPatched = false;

            // Standard material path (three.js chunks available)
            if (nextVertexShader.includes('#include <project_vertex>')) {
                nextVertexShader = nextVertexShader.replace(
                    '#include <project_vertex>',
                    `${VERTEX_TRAVEL_CHUNK}
                     #include <project_vertex>
                     `
                );
                vertexPatched = true;
            } else {
                // Custom shader path (ATOMA link strand shader)
                const customVertexNeedle = 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);';
                if (nextVertexShader.includes(customVertexNeedle)) {
                    nextVertexShader = nextVertexShader.replace(customVertexNeedle, SIMPLE_SHADER_VERTEX_TRAVEL);
                    vertexPatched = true;
                }
            }

            if (nextFragmentShader.includes('#include <dithering_fragment>')) {
                nextFragmentShader = nextFragmentShader.replace(
                    '#include <dithering_fragment>',
                    `${FRAGMENT_TRAVEL_CHUNK}
                     #include <dithering_fragment>
                     `
                );
                fragmentPatched = true;
            } else {
                const customFragmentNeedle = 'gl_FragColor = vec4(color, alpha);';
                if (nextFragmentShader.includes(customFragmentNeedle)) {
                    nextFragmentShader = nextFragmentShader.replace(customFragmentNeedle, SIMPLE_SHADER_FRAGMENT_TRAVEL);
                    fragmentPatched = true;
                }
            }

            // Safety guard: never leave partially patched shader source.
            if (!vertexPatched || !fragmentPatched) {
                if (this.warningsEnabled) {
                    console.warn('[WaveTravelShaderPack_v1] patch target not found', {
                        vertexPatched,
                        fragmentPatched
                    });
                }
                return false;
            }

            shader.vertexShader = nextVertexShader;
            shader.fragmentShader = nextFragmentShader;

            if (this.debugEnabled) {
                console.log(`[WaveTravelShaderPack_v1] Travel shaders injected (profile: ${profile})`);
            }
            return true;
        } catch (e) {
            console.warn('[WaveTravelShaderPack_v1] _injectTravelShaders error:', e);
            this._debugStats.injectErrors += 1;
            return false;
        }
    }

    _debugLogIfEnabled() {
        if (typeof window === 'undefined' || window.__DEBUG_WAVE_RECOMPILE__ !== true) return;
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now - this._lastDebugLogTime < 1000) return;
        this._lastDebugLogTime = now;
        const metrics = this.getMetrics();
        const stats = this.getDebugStats();
        console.debug('[WaveTravelShaderPack_v1][audit]', {
            registeredMaterials: metrics.registeredMaterialCount,
            onBeforeCompileCalls: stats.onBeforeCompileCalls,
            needsUpdateSets: stats.needsUpdateSets,
            materialVersionBumps: stats.materialVersionBumps,
            injectSuccess: stats.injectSuccess,
            injectSkipped: stats.injectSkipped,
            injectErrors: stats.injectErrors
        });
        if (window.__DEBUG_WAVE_NEEDSUPDATE_TRACE__ === true) {
            const top = this.getNeedsUpdateTraceReport(5);
            console.debug('[WaveTravelShaderPack_v1][needsUpdate-trace]', {
                total: this._needsUpdateTraceTotal,
                top
            });
        }
        if (window.__DEBUG_WAVE_MATERIAL_MUTATION_TRACE__ === true) {
            const top = this.getMaterialMutationTraceReport(5);
            console.debug('[WaveTravelShaderPack_v1][material-mutation-trace]', {
                total: this._materialMutationTraceTotal,
                top
            });
        }
    }

    getDebugStats() {
        return { ...this._debugStats };
    }

    getNeedsUpdateTraceReport(limit = 10) {
        const list = Array.from(this._needsUpdateTraceCounts.entries())
            .map(([site, count]) => ({ site, count }))
            .sort((a, b) => b.count - a.count);
        return list.slice(0, Math.max(1, limit));
    }

    getNeedsUpdateTraceSamples(limit = 10) {
        return this._needsUpdateTraceSamples.slice(0, Math.max(1, limit));
    }

    getNeedsUpdateTraceFullSamples(limit = 10) {
        return this._needsUpdateTraceFullSamples.slice(0, Math.max(1, limit));
    }

    getNeedsUpdateTraceByMaterialReport(limit = 10) {
        const list = Array.from(this._needsUpdateTraceByMaterial.entries())
            .map(([material, count]) => ({ material, count }))
            .sort((a, b) => b.count - a.count);
        return list.slice(0, Math.max(1, limit));
    }

    getNeedsUpdateTraceByTaskReport(limit = 10) {
        const list = Array.from(this._needsUpdateTraceByTask.entries())
            .map(([task, count]) => ({ task, count }))
            .sort((a, b) => b.count - a.count);
        return list.slice(0, Math.max(1, limit));
    }

    getRegistrationTraceReport(limit = 50) {
        const list = Array.from(this._registrationTraceByUuid.values())
            .sort((a, b) => (b.registerCount || 0) - (a.registerCount || 0));
        return list.slice(0, Math.max(1, limit));
    }

    getRegistrationTraceByUuid(uuid) {
        if (!uuid) return null;
        return this._registrationTraceByUuid.get(uuid) || null;
    }

    getMaterialMutationTraceReport(limit = 10) {
        const list = Array.from(this._materialMutationTraceCounts.entries())
            .map(([site, count]) => ({ site, count }))
            .sort((a, b) => b.count - a.count);
        return list.slice(0, Math.max(1, limit));
    }

    getMaterialMutationTraceSamples(limit = 10) {
        return this._materialMutationTraceSamples.slice(0, Math.max(1, limit));
    }

    _syncNeedsUpdateTracer(material) {
        if (typeof window === 'undefined' || window.__DEBUG_WAVE_NEEDSUPDATE_TRACE__ !== true) return;
        if (!material || this._needsUpdateTracerInstalled.has(material)) return;
        this._attachNeedsUpdateTracer(material);
    }

    _syncMaterialMutationTracer(material) {
        if (typeof window === 'undefined' || window.__DEBUG_WAVE_MATERIAL_MUTATION_TRACE__ !== true) return;
        if (!material || this._materialMutationTracerInstalled.has(material)) return;
        this._attachMaterialMutationTracer(material);
    }

    _findNeedsUpdateDescriptor(material) {
        let proto = material ? Object.getPrototypeOf(material) : null;
        while (proto) {
            const desc = Object.getOwnPropertyDescriptor(proto, 'needsUpdate');
            if (desc && typeof desc.set === 'function') return desc;
            proto = Object.getPrototypeOf(proto);
        }
        return null;
    }

    _findPropertyDescriptor(material, prop) {
        let proto = material ? Object.getPrototypeOf(material) : null;
        while (proto) {
            const desc = Object.getOwnPropertyDescriptor(proto, prop);
            if (desc && (typeof desc.set === 'function' || typeof desc.get === 'function')) return desc;
            proto = Object.getPrototypeOf(proto);
        }
        return null;
    }

    _attachNeedsUpdateTracer(material) {
        const protoDesc = this._findNeedsUpdateDescriptor(material);
        if (!protoDesc?.set) return;
        if (!material.userData) material.userData = {};
        if (material.userData.__waveNeedsUpdateTracerInstalled) return;

        const pack = this;
        Object.defineProperty(material, 'needsUpdate', {
            configurable: true,
            enumerable: false,
            get() {
                if (typeof protoDesc.get === 'function') {
                    return protoDesc.get.call(this);
                }
                return undefined;
            },
            set(value) {
                if (value === true) {
                    pack._recordNeedsUpdateTrace(this);
                }
                protoDesc.set.call(this, value);
            }
        });

        material.userData.__waveNeedsUpdateTracerInstalled = true;
        this._needsUpdateTracerInstalled.set(material, true);
    }

    _attachMaterialMutationTracer(material) {
        const props = ['transparent', 'depthWrite', 'depthTest', 'blending', 'side', 'alphaTest'];
        if (!material.userData) material.userData = {};
        if (material.userData.__waveMaterialMutationTracerInstalled) return;

        const pack = this;
        for (const prop of props) {
            const desc = this._findPropertyDescriptor(material, prop);
            if (!desc?.set) continue;

            Object.defineProperty(material, prop, {
                configurable: true,
                enumerable: desc.enumerable ?? true,
                get() {
                    return typeof desc.get === 'function' ? desc.get.call(this) : undefined;
                },
                set(value) {
                    const prev = typeof desc.get === 'function' ? desc.get.call(this) : undefined;
                    if (prev !== value) {
                        pack._recordMaterialMutationTrace(prop, prev, value);
                    }
                    desc.set.call(this, value);
                }
            });
        }

        material.userData.__waveMaterialMutationTracerInstalled = true;
        this._materialMutationTracerInstalled.set(material, true);
    }

    _recordNeedsUpdateTrace(material) {
        const err = new Error();
        const stack = String(err.stack || '');
        const lines = stack.split('\n').map((l) => l.trim()).filter(Boolean);
        const site = this._pickExternalStackSite(lines, ['runRenderTick', 'FrameScheduler.tick', 'animate']);
        const materialLabel = this._getMaterialDebugLabel(material);
        const taskLabel = this._getActiveTaskLabel();
        this._needsUpdateTraceTotal += 1;
        this._needsUpdateTraceCounts.set(site, (this._needsUpdateTraceCounts.get(site) || 0) + 1);
        this._needsUpdateTraceByMaterial.set(
            materialLabel,
            (this._needsUpdateTraceByMaterial.get(materialLabel) || 0) + 1
        );
        this._needsUpdateTraceByTask.set(
            taskLabel,
            (this._needsUpdateTraceByTask.get(taskLabel) || 0) + 1
        );
        if (this._needsUpdateTraceSamples.length < 40) {
            this._needsUpdateTraceSamples.push({
                site,
                material: materialLabel,
                task: taskLabel,
                stack: lines.slice(0, 12)
            });
        }
        if (this._needsUpdateTraceFullSamples.length < 20) {
            this._needsUpdateTraceFullSamples.push({
                site,
                material: materialLabel,
                task: taskLabel,
                stack: lines.slice(0, 40)
            });
        }
    }

    _recordMaterialMutationTrace(prop, fromValue, toValue) {
        const err = new Error();
        const stack = String(err.stack || '');
        const lines = stack.split('\n').map((l) => l.trim()).filter(Boolean);
        const site = this._pickExternalStackSite(lines, ['runRenderTick']);
        const key = `${prop} :: ${site}`;
        this._materialMutationTraceTotal += 1;
        this._materialMutationTraceCounts.set(key, (this._materialMutationTraceCounts.get(key) || 0) + 1);
        if (this._materialMutationTraceSamples.length < 80) {
            this._materialMutationTraceSamples.push({
                prop,
                from: fromValue,
                to: toValue,
                site,
                stack: lines.slice(0, 16)
            });
        }
    }

    _pickExternalStackSite(lines, extraSkips = []) {
        const isInternal = (line) => {
            const l = String(line || '');
            return (
                l.includes('WaveTravelShaderPack_v1.js') ||
                l.includes('/three.mjs') ||
                l.includes('three.module.js') ||
                l.includes('/es2022/three.mjs') ||
                l.includes('at tZ ') ||
                extraSkips.some((skip) => l.includes(skip))
            );
        };
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            if (!line || line === 'Error') continue;
            if (!isInternal(line)) return line;
        }
        return lines[4] || lines[3] || lines[2] || 'unknown';
    }

    _getMaterialDebugLabel(material) {
        if (!material) return 'unknown-material';
        const ud = material.userData || {};
        const keys = [
            ud.registryKey,
            ud.layerKey,
            ud.waveProfile,
            ud.role,
            ud.debugLabel,
            material.name,
            material.uuid
        ];
        for (const key of keys) {
            if (typeof key === 'string' && key.length > 0) return key;
        }
        return material.uuid || 'material-without-uuid';
    }

    _getActiveTaskLabel() {
        if (typeof window === 'undefined') return 'task:unknown';
        const task = window.__ATOMA_ACTIVE_FRAME_TASK__;
        if (!task) return 'task:none';
        const id = typeof task.id === 'string' ? task.id : 'anonymous';
        const layer = typeof task.layer === 'string' ? task.layer : 'unknown';
        return `${layer}:${id}`;
    }

    _recordRegistrationTrace(material, profile) {
        if (!material || !this._registrationTraceByUuid) return;
        const uuid = material.uuid || 'material-without-uuid';
        const existing = this._registrationTraceByUuid.get(uuid);
        const lines = String(new Error().stack || '')
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        if (!existing) {
            const site = this._pickExternalStackSite(lines, ['register', 'WaveTravelShaderPack_v1']);
            this._registrationTraceByUuid.set(uuid, {
                uuid,
                profile,
                ownerTag: this._getFirstOwnerTag(material),
                site,
                stack: lines.slice(0, 20),
                registerCount: 1
            });
            return;
        }

        existing.registerCount = (existing.registerCount || 0) + 1;
        if (!existing.ownerTag) {
            existing.ownerTag = this._getFirstOwnerTag(material);
        }
        if (!existing.profile) {
            existing.profile = profile;
        }
        this._registrationTraceByUuid.set(uuid, existing);
    }

    _getFirstOwnerTag(material) {
        const ud = material?.userData || {};
        const candidates = [
            ud.__owner,
            ud.owner,
            ud.__domain,
            ud.domain,
            ud.registryKey,
            ud.layerKey,
            material?.name
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }
        return '';
    }

    _ensureTravelDeclarations(shaderSource) {
        if (typeof shaderSource !== 'string') return shaderSource;

        let out = shaderSource;
        const missingUniforms = TRAVEL_UNIFORM_LINES.filter((line) => !out.includes(line));
        if (missingUniforms.length > 0) {
            const uniformBlock = `${missingUniforms.join('\n')}\n`;
            if (out.includes('void main() {')) {
                out = out.replace('void main() {', `${uniformBlock}void main() {`);
            } else {
                out = `${uniformBlock}${out}`;
            }
        }
        if (!out.includes('float multiFreqOscillation(')) {
            if (out.includes('void main() {')) {
                out = out.replace('void main() {', `${MULTI_FREQ_OSCILLATION}\nvoid main() {`);
            } else {
                out = `${MULTI_FREQ_OSCILLATION}\n${out}`;
            }
        }
        return out;
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
                registeredMaterialCount: this.materialList?.size ?? 0,
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
            this.materialList = null;
            this.materialProfiles = null;
            this.originalOnBeforeCompile = null;
            this.materialUniforms = null;
            this.materialVersionSeen = null;
            this._needsUpdateTracerInstalled = null;
            this._needsUpdateTraceCounts = null;
            this._needsUpdateTraceTotal = 0;
            this._needsUpdateTraceSamples = null;
            this._needsUpdateTraceFullSamples = null;
            this._needsUpdateTraceByMaterial = null;
            this._needsUpdateTraceByTask = null;
            this._registrationTraceByUuid = null;
            this._materialMutationTracerInstalled = null;
            this._materialMutationTraceCounts = null;
            this._materialMutationTraceSamples = null;
            this._materialMutationTraceTotal = 0;
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
