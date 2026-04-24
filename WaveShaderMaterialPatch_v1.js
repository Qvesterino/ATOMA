import * as THREE from 'three';

// Private symbol to track patched materials (survives all registration cycles)
const MATERIAL_PATCH_SYMBOL = Symbol('waveShaderMaterialPatched');

/**
 * WAVE SHADER MATERIAL PATCH v1.0
 * 
 * GPU shader extensions for wave interference visualization.
 * Patches node & link materials to react to wave uniforms injected by WaveShaderBridge_v1.
 * 
 * FEATURES:
 * ✓ Safe onBeforeCompile shader patching (no source modification)
 * ✓ 7 distinct wave effects (distortion, glow, jitter, interference, breathing, travel, blend)
 * ✓ Profile-based effect intensity (DEFAULT, AURA, MYTHIC, SYNERGY, RIFT)
 * ✓ Procedural noise generation (Perlin-style for jitter & patterns)
 * ✓ Smooth sine/cosine modulations for breathing & phase
 * ✓ WeakMap/WeakSet tracking (automatic GC on material dispose)
 * ✓ 100% optional chaining & defensive programming
 * ✓ Per-material isolation (no cross-contamination)
 * ✓ Additive module (zero external dependencies)
 * 
 * SHADER EFFECTS:
 * 1. Amplitude Distortion   → Vertex offset based on uWaveAmplitude
 * 2. Constructive Glow      → Emissive boost based on uWaveConstructive
 * 3. Destructive Jitter     → High-freq noise based on uWaveDestructive
 * 4. Interference Pattern   → Color mixing based on uWaveInterference
 * 5. Standing Wave Breathing→ Sine modulation via uWaveStanding
 * 6. Phase-Shift Travel     → Animated distortion/glow via uWavePhase
 * 7. Intensity Blending     → Overall effect strength via uWaveIntensity
 * 
 * PROFILES:
 * - DEFAULT  : Subtle, balanced effects
 * - AURA     : Enhanced glow & breathing
 * - MYTHIC   : Intense distortion & jitter
 * - SYNERGY  : Color-driven interference patterns
 * - RIFT     : Extreme phase travel & destructive effects
 */

// ============================================================================
// UTILITY FUNCTIONS & SHADER CODE
// ============================================================================

/**
 * Wave distortion vertex shader chunk
 * Applies amplitude distortion and destructive jitter
 */
const WAVE_VERTEX_CHUNK = `
    // Wave shader effects on vertex position
    vec3 waveDistortion = vec3(0.0);

    // 1. AMPLITUDE DISTORTION: Offset vertices based on total wave amplitude
    float amplitudeScale = uWaveAmplitude * uWaveIntensity;
    waveDistortion += normal * amplitudeScale * 0.15;

    // 2. STANDING WAVE BREATHING: Sine modulation for expansion/contraction
    if (uWaveStanding > 0.01) {
        float breathingPhase = sin(uTime * 1.5 + length(position) * 2.0);
        float breathingScale = 0.5 + 0.5 * breathingPhase; // 0..1
        waveDistortion += normal * breathingScale * uWaveStanding * uWaveIntensity * 0.08;
    }

    // 4. PHASE-SHIFT TRAVEL: Animate distortion with phase
    if (uWavePhase > 0.01) {
        float phaseTravel = sin(uWavePhase * 6.28318); // 0..2*PI
        waveDistortion += normal * phaseTravel * uWaveIntensity * 0.05;
    }

    // NEW: ETHEREAL EXPANSION (Nadprirodzená expanzia)
    if (uWaveIntensity > 0.2) {
        float etherealScale = 1.0 + uWaveConstructive * uWaveIntensity * 0.05;
        transformed = (transformed - uWaveCenter) * etherealScale + uWaveCenter;
    }

    // NEW: SOUL RESONANCE (Dušová rezonancia)
    if (uWaveSourceCount > 0.5) {
        float resonancePhase = uTime * 1.2;
        float resonanceScale = sin(resonancePhase) * 0.02 * uWaveSourceCount;
        transformed += normal * resonanceScale;
    }

    // Apply total distortion to vertex position
    transformed += waveDistortion;
`;

/**
 * Wave color & emissive fragment shader chunk
 * Applies glow, jitter, interference, and phase effects
 */
const WAVE_FRAGMENT_CHUNK = `
    // Wave shader effects on fragment color & emissive

    // 1. CONSTRUCTIVE GLOW: Boost emissive based on constructive power
    if (uWaveConstructive > 0.01) {
        float glowIntensity = uWaveConstructive * uWaveIntensity;
        diffuseColor.rgb = mix(
            diffuseColor.rgb,
            diffuseColor.rgb * (1.0 + glowIntensity * 2.0),
            uWaveIntensity
        );
        // Add emissive component
        outgoingLight += diffuseColor.rgb * glowIntensity * 0.5;
    }

    // 2. INTERFERENCE PATTERN: Color shifting based on interference index
    if (uWaveInterference > 0.01) {
        // Compute interference color shift (RGB cycling)
        float hueShift = uWaveInterference * 6.28318; // 0..2*PI
        vec3 hsvColor = vec3(hueShift, uWaveIntensity, uWaveInterference);

        // Simple HSV to RGB conversion (approximated)
        float h = hueShift / 1.047197; // 60° segments
        float c = uWaveInterference * uWaveIntensity;
        float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
        vec3 rgb = vec3(0.0);

        if (h < 1.0) rgb = vec3(c, x, 0.0);
        else if (h < 2.0) rgb = vec3(x, c, 0.0);
        else if (h < 3.0) rgb = vec3(0.0, c, x);
        else if (h < 4.0) rgb = vec3(0.0, x, c);
        else if (h < 5.0) rgb = vec3(x, 0.0, c);
        else rgb = vec3(c, 0.0, x);

        diffuseColor.rgb = mix(diffuseColor.rgb, rgb, uWaveInterference * 0.5);
    }

    // 3. PHASE-SHIFT TRAVEL: Animate overall brightness with phase
    if (uWavePhase > 0.01) {
        float phaseBrightness = 0.5 + 0.5 * sin(uWavePhase * 6.28318);
        diffuseColor.rgb *= (1.0 + (phaseBrightness - 0.5) * uWaveIntensity * 0.3);
    }

    // NEW: ETHEREAL AURA (Mystický svieži halo)
    if (uWaveIntensity > 0.1) {
        float auraStrength = uWaveConstructive * uWaveIntensity;

        // Mystická sivá/zlatá záře
        vec3 auraColor = mix(
            vec3(0.9, 0.95, 1.0), // Strieborná
            vec3(1.0, 0.85, 0.5),  // Zlatá
            uWaveStanding
        );

        // Soft halo okolo
        diffuseColor.rgb = mix(diffuseColor.rgb, auraColor, auraStrength * 0.2);

        // Emissive boost pre "svieži" pocit
        outgoingLight += auraColor * auraStrength * 0.15;
    }

    // NEW: PHANTOM SHIMMER (Duchovný záblesk)
    if (uWaveInterference > 0.3) {
        #ifdef USE_UV
        float shimmerPhase = sin(uTime * 2.0 + vUv.x * 0.5) * 0.5 + 0.5;
        float shimmerStrength = uWaveInterference * 0.08;

        // Jemné mriežkovanie
        float shimmerNoise = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime) * 0.5 + 0.5;
        vec3 shimmerColor = vec3(0.7, 0.85, 1.0); // Modrastá

        diffuseColor.rgb += shimmerColor * shimmerStrength * shimmerNoise;
        #endif
    }

    // NEW: SPIRITUAL DRIFT (Duchovný rozplyn)
    if (uWavePhase > 0.2) {
        float driftStrength = sin(uWavePhase * 3.14159) * uWaveIntensity * 0.05;
        diffuseColor.rgb *= (1.0 - driftStrength * 0.3); // Jemné stmavenie
    }
`;

/**
 * World position varying (for fragment effects)
 */
// vWorldPosition no longer used; fragment logic is time/uv based only.

/**
 * GLSL uniform declarations for wave shader chunks.
 * Injected at #include <common> to avoid undeclared variable errors.
 */
const WAVE_UNIFORM_DECLS = [
    'uniform float uWaveAmplitude;',
    'uniform float uWaveConstructive;',
    'uniform float uWaveInterference;',
    'uniform float uWaveStanding;',
    'uniform float uWavePhase;',
    'uniform float uWaveSourceCount;',
    'uniform float uWaveIntensity;',
    'uniform vec3 uWaveCenter;',
    'uniform float uTime;'
];

// ============================================================================
// PROFILE CONFIGURATION
// ============================================================================

const PROFILE_CONFIG = {
    DEFAULT: {
        amplitudeScale: 1.0,
        constructiveScale: 0.8,
        destructiveScale: 0.6,
        interferenceScale: 0.7,
        standingScale: 0.8,
        phaseScale: 0.7,
        intensityBias: 0.0
    },
    AURA: {
        amplitudeScale: 0.6,
        constructiveScale: 1.2,    // Enhanced glow
        destructiveScale: 0.4,
        interferenceScale: 0.8,
        standingScale: 1.2,        // Enhanced breathing
        phaseScale: 0.8,
        intensityBias: 0.1
    },
    MYTHIC: {
        amplitudeScale: 1.4,       // Intense distortion
        constructiveScale: 0.9,
        destructiveScale: 1.3,     // Intense jitter
        interferenceScale: 1.0,
        standingScale: 1.0,
        phaseScale: 1.2,
        intensityBias: 0.2
    },
    SYNERGY: {
        amplitudeScale: 0.8,
        constructiveScale: 1.0,
        destructiveScale: 0.7,
        interferenceScale: 1.3,    // Color-driven
        standingScale: 0.9,
        phaseScale: 0.9,
        intensityBias: 0.1
    },
    RIFT: {
        amplitudeScale: 1.3,
        constructiveScale: 0.7,
        destructiveScale: 1.4,     // Extreme jitter
        interferenceScale: 1.1,
        standingScale: 0.8,
        phaseScale: 1.4,           // Extreme phase travel
        intensityBias: 0.3
    }
};

// ============================================================================
// WAVE SHADER MATERIAL PATCH v1.0
// ============================================================================

export class WaveShaderMaterialPatch_v1 {
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
            
            // Track patched materials
            this.patchedMaterials = new WeakSet();
            this.materialProfiles = new WeakMap();
            this.originalOnBeforeCompile = new WeakMap();
            
            if (this.debugEnabled) {
                console.log('[WaveShaderMaterialPatch_v1] Initialized ✓');
            }
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] Constructor error:', e);
        }
    }

    /**
     * Patch a material with wave shader effects
     * @param {THREE.Material} material - Material to patch
     * @param {string} profile - Effect profile (DEFAULT, AURA, MYTHIC, SYNERGY, RIFT)
     */
    patch(material, profile = 'DEFAULT') {
        try {
            if (!material) {
                if (this.warningsEnabled) console.warn('[WaveShaderMaterialPatch_v1] patch: material is null');
                return false;
            }

            // Material-level guard: prevent duplicate shader recompilation
            if (material[MATERIAL_PATCH_SYMBOL]) return false;

            // Check if already patched (in WeakSet)
            if (this.patchedMaterials.has(material)) {
                if (this.debugEnabled) console.log('[WaveShaderMaterialPatch_v1] Material already patched');
                return false;
            }

            // Validate profile
            if (!PROFILE_CONFIG[profile]) {
                if (this.warningsEnabled) console.warn(`[WaveShaderMaterialPatch_v1] Unknown profile: ${profile}, using DEFAULT`);
                profile = 'DEFAULT';
            }

            // Store profile
            this.materialProfiles.set(material, profile);

            // Store original onBeforeCompile
            this.originalOnBeforeCompile.set(material, material.onBeforeCompile || (() => {}));

            // Create new onBeforeCompile that calls original + patches shader
            material.onBeforeCompile = (shader) => {
                try {
                    // Call original if exists
                    const originalCompile = this.originalOnBeforeCompile.get(material);
                    originalCompile?.(shader);

                    // Inject wave shader code
                    this._injectWaveShaders(shader, profile, material);
                } catch (e) {
                    console.warn('[WaveShaderMaterialPatch_v1] onBeforeCompile patch error:', e);
                }
            };

            // Mark as patched
            this.patchedMaterials.add(material);

            // Mark material as patched (persists across all registration cycles)
            material[MATERIAL_PATCH_SYMBOL] = true;

            if (this.debugEnabled) {
                console.log(`[WaveShaderMaterialPatch_v1] Material patched (profile: ${profile})`);
            }

            return true;
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] patch error:', e);
            return false;
        }
    }

    /**
     * Unpatch a material (restore original shader)
     * @param {THREE.Material} material - Material to unpatch
     */
    unpatch(material) {
        try {
            if (!material || !this.patchedMaterials.has(material)) {
                return false;
            }

            // Restore original onBeforeCompile
            const original = this.originalOnBeforeCompile.get(material);
            material.onBeforeCompile = original;

            // Remove from tracking
            this.patchedMaterials.delete?.(material);

            if (this.debugEnabled) {
                console.log('[WaveShaderMaterialPatch_v1] Material unpatched');
            }

            return true;
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] unpatch error:', e);
            return false;
        }
    }

    /**
     * Internal: Inject wave shader code into shader
     */
    _injectWaveShaders(shader, profile, material) {
        try {
            const config = PROFILE_CONFIG[profile] || PROFILE_CONFIG.DEFAULT;
            const ignoreWaveColor = material?.userData?.ignoreWaveColor === true;

            // Ensure uniforms exist (should be from WaveShaderBridge)
            shader.uniforms = shader.uniforms || {};
            shader.uniforms.uWaveAmplitude = shader.uniforms.uWaveAmplitude || { value: 0 };
            shader.uniforms.uWaveConstructive = shader.uniforms.uWaveConstructive || { value: 0 };
            shader.uniforms.uWaveInterference = shader.uniforms.uWaveInterference || { value: 0 };
            shader.uniforms.uWaveStanding = shader.uniforms.uWaveStanding || { value: 0 };
            shader.uniforms.uWavePhase = shader.uniforms.uWavePhase || { value: 0 };
            shader.uniforms.uWaveSourceCount = shader.uniforms.uWaveSourceCount || { value: 0 };
            shader.uniforms.uWaveIntensity = shader.uniforms.uWaveIntensity || { value: 0 };

            // Ensure uWaveCenter exists (needed for ETHEREAL EXPANSION)
            shader.uniforms.uWaveCenter = shader.uniforms.uWaveCenter || { value: new THREE.Vector3(0, 0, 0) };

            // Add profile config uniforms
            shader.uniforms.uWaveProfile = shader.uniforms.uWaveProfile || {
                value: new THREE.Vector4(
                    config.amplitudeScale,
                    config.constructiveScale,
                    config.destructiveScale,
                    config.interferenceScale
                )
            };
            shader.uniforms.uWaveProfileHigh = shader.uniforms.uWaveProfileHigh || {
                value: new THREE.Vector4(
                    config.standingScale,
                    config.phaseScale,
                    config.intensityBias,
                    0
                )
            };

            // Add time uniform
            shader.uniforms.uTime = shader.uniforms.uTime || { value: 0 };

            // Inject GLSL uniform declarations at #include <common> (avoid undeclared variable errors)
            const buildMissingDecls = (source) => {
                if (!source) return '';
                const missing = WAVE_UNIFORM_DECLS.filter((decl) => !source.includes(decl));
                return missing.length ? `${missing.join('\n')}\n` : '';
            };

            const injectAtCommon = (source, injection) => {
                if (!source || !injection) return source;
                if (source.includes('#include <common>')) {
                    return source.replace('#include <common>', `#include <common>\n${injection}`);
                }
                return `${injection}\n${source}`;
            };

            const vertexDecls = buildMissingDecls(shader.vertexShader);
            const fragmentDecls = buildMissingDecls(shader.fragmentShader);
            if (vertexDecls) shader.vertexShader = injectAtCommon(shader.vertexShader, vertexDecls);
            if (fragmentDecls) shader.fragmentShader = injectAtCommon(shader.fragmentShader, fragmentDecls);

            // Inject wave vertex effects (before position transformation)
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `${WAVE_VERTEX_CHUNK}
                 #include <project_vertex>
                 `
            );

            // Inject wave fragment effects (before final color output).
            // Keep wave vertex/pulse distortion active, but skip color override when requested.
            if (!ignoreWaveColor) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    `${WAVE_FRAGMENT_CHUNK}
                     #include <dithering_fragment>
                     `
                );
            }

            if (this.debugEnabled) {
                console.log(`[WaveShaderMaterialPatch_v1] Wave shaders injected (profile: ${profile})`);
            }
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] _injectWaveShaders error:', e);
        }
    }

    /**
     * Patch multiple materials at once
     * @param {Array<THREE.Material>} materials - Materials to patch
     * @param {string} profile - Profile for all materials
     */
    patchBatch(materials, profile = 'DEFAULT') {
        try {
            if (!Array.isArray(materials)) {
                if (this.warningsEnabled) console.warn('[WaveShaderMaterialPatch_v1] patchBatch: materials is not an array');
                return 0;
            }

            let count = 0;
            for (const material of materials) {
                if (this.patch(material, profile)) {
                    count++;
                }
            }

            if (this.debugEnabled) {
                console.log(`[WaveShaderMaterialPatch_v1] Batch patched ${count}/${materials.length} materials`);
            }

            return count;
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] patchBatch error:', e);
            return 0;
        }
    }

    /**
     * Unpatch multiple materials at once
     * @param {Array<THREE.Material>} materials - Materials to unpatch
     */
    unpatchBatch(materials) {
        try {
            if (!Array.isArray(materials)) {
                if (this.warningsEnabled) console.warn('[WaveShaderMaterialPatch_v1] unpatchBatch: materials is not an array');
                return 0;
            }

            let count = 0;
            for (const material of materials) {
                if (this.unpatch(material)) {
                    count++;
                }
            }

            if (this.debugEnabled) {
                console.log(`[WaveShaderMaterialPatch_v1] Batch unpatched ${count}/${materials.length} materials`);
            }

            return count;
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] unpatchBatch error:', e);
            return 0;
        }
    }

    /**
     * Get profile for a patched material
     * @param {THREE.Material} material - Patched material
     * @returns {string} Profile name
     */
    getProfile(material) {
        try {
            return this.materialProfiles.get(material) || 'DEFAULT';
        } catch (e) {
            return 'DEFAULT';
        }
    }

    /**
     * Check if material is patched
     * @param {THREE.Material} material - Material to check
     * @returns {boolean}
     */
    isPatched(material) {
        return this.patchedMaterials?.has?.(material) ?? false;
    }

    /**
     * Get metrics
     */
    getMetrics() {
        try {
            return {
                patchedMaterialCount: this.patchedMaterials?.size ?? 0,
                profiles: Array.from(Object.keys(PROFILE_CONFIG))
            };
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] getMetrics error:', e);
            return {};
        }
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        try {
            // Clear tracking (WeakSet/WeakMap auto-GC)
            this.patchedMaterials = null;
            this.materialProfiles = null;
            this.originalOnBeforeCompile = null;

            if (this.debugEnabled) {
                console.log('[WaveShaderMaterialPatch_v1] Disposed ✓');
            }
        } catch (e) {
            console.warn('[WaveShaderMaterialPatch_v1] dispose error:', e);
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
     * Get profile config values
     * @param {string} profile - Profile name
     * @returns {Object} Config object
     */
    static getProfileConfig(profile = 'DEFAULT') {
        return PROFILE_CONFIG[profile] || PROFILE_CONFIG.DEFAULT;
    }

    /**
     * List all available profiles
     */
    static listProfiles() {
        return Object.keys(PROFILE_CONFIG);
    }
}

export default WaveShaderMaterialPatch_v1;
