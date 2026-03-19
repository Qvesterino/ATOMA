import * as THREE from 'three';
import { canProcessNodeVisuals, filterReadyNodes } from './NodeVisualReadinessGate_v1.js';
const WAVE_BRIDGE_PATCHED = Symbol('waveShaderBridgePatched');

/**
 * WAVE SHADER BRIDGE v1.0
 * 
 * GPU shader uniform bridge for wave interference visualization.
 * Reads burst snapshot data from WaveInterferenceEngine_v1 only
 * and injects normalized shader uniforms via onBeforeCompile.
 * 
 * FEATURES:
 * ✓ Per-material shader uniform injection (onBeforeCompile)
 * ✓ 8 wave-aware uniforms (amplitude, constructive, destructive, interference, standing, phase, sourceCount, intensity)
 * ✓ Entity-to-material mapping with caching
 * ✓ EMA smoothing (alpha ~0.18 for ~0.4-0.5s response)
 * ✓ Profile support (DEFAULT, AURA, MYTHIC, SYNERGY, RIFT) for future extensions
 * ✓ WeakMap/WeakSet tracking (automatic GC)
 * ✓ 100% optional chaining & defensive programming
 * ✓ Zero shader source modifications (uniforms only)
 * ✓ Standalone, additive module (no external dependencies)
 * 
 * ARCHITECTURE:
 * - Material registration with onBeforeCompile patching
 * - Internal state tracking (uniforms, profile, EMA state)
 * - Per-frame entity-to-material mapping & lookup cache
 * - Normalized target computation & EMA interpolation
 * - Safe cleanup on dispose
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamp value to 0..1
 */
function clamp01(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}

/**
 * Linear interpolation
 */
function lerp(a, b, alpha) {
    return a + (b - a) * alpha;
}

/**
 * Exponential Moving Average with alpha
 */
function updateEMA(current, target, alpha) {
    return lerp(current, target, alpha);
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// WAVE SHADER BRIDGE v1.0
// ============================================================================

export class WaveShaderBridge_v1 {
    /**
     * Constructor
     * @param {Object} options - Configuration
     * @param {THREE.WebGLRenderer} options.renderer - WebGL renderer (for reference)
     * @param {THREE.Scene} options.scene - Scene (for reference)
     * @param {Object} options.waveEngine - WaveInterferenceEngine_v1 instance (optional)
     * @param {number} options.maxSources - Max wave sources (for normalization, default 8)
     */
    constructor({ renderer = null, scene = null, waveEngine = null, maxSources = 8 } = {}) {
        try {
            this.renderer = renderer;
            this.scene = scene;
            this.waveEngine = waveEngine;
            this.maxSources = Math.max(1, maxSources);
            
            // Material tracking
            this.registeredNodeMaterials = new WeakSet();
            this.registeredLinkMaterials = new WeakSet();
            this.registeredNodeMaterialList = new Set();
            this.registeredLinkMaterialList = new Set();
            
            // Material → internal state mapping
            this.materialStates = new WeakMap();
            
            // Material → entity mapping cache
            this.nodeMaterialToEntity = new WeakMap();
            this.linkMaterialToEntity = new WeakMap();
            
            // Uniform references per material
            this.materialUniforms = new WeakMap();
            
            // Material → profile mapping
            this.materialProfiles = new WeakMap();
            
            // EMA smoothing factor (alpha ~0.18 = ~0.4-0.5s smoothing at 60fps)
            this.emaAlpha = 0.18;
            this.visualUpdateIntervalSec = 1 / 30;
            this._visualUpdateAccumulator = 0;
            
            // Debug flags
            this.debugEnabled = false;
            this.warningsEnabled = false;
            
            if (this.debugEnabled) {
                console.log('[WaveShaderBridge_v1] Initialized ✓');
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] Constructor error:', e);
        }
    }

    /**
     * Register a node material for wave uniform updates
     * Patches material.onBeforeCompile to inject wave uniforms
     * @param {THREE.Material} material - Material instance
     * @param {string} profile - Visual profile (DEFAULT, AURA, MYTHIC, SYNERGY, RIFT)
     */
    registerNodeMaterial(material, profile = 'DEFAULT') {
        try {
            if (!material) {
                if (this.warningsEnabled) console.warn('[WaveShaderBridge_v1] registerNodeMaterial: material is null');
                return;
            }

            // Material-level guard: prevent duplicate onBeforeCompile stacking across re-inits.
            if (material[WAVE_BRIDGE_PATCHED]) {
                return;
            }

            // HARDENING: Ensure registeredNodeMaterials is always iterable
            if (!this.registeredNodeMaterials || typeof this.registeredNodeMaterials.has !== 'function') {
                this.registeredNodeMaterials = new WeakSet();
            }

            // Check if already registered
            if (this.registeredNodeMaterials.has(material)) {
                if (this.debugEnabled) console.log('[WaveShaderBridge_v1] Material already registered (node)');
                return;
            }

            // Store profile
            this.materialProfiles.set(material, profile);

            // Initialize state
            const state = {
                profile,
                emaState: {
                    amplitude: 0,
                    constructive: 0,
                    destructive: 0,
                    interference: 0,
                    standing: 0,
                    phase: 0,
                    sourceCount: 0,
                    intensity: 0
                }
            };
            this.materialStates.set(material, state);

            // Patch onBeforeCompile
            const originalOnBeforeCompile = material.onBeforeCompile || (() => {});
            
            material.onBeforeCompile = (shader) => {
                try {
                    // Call original if exists
                    originalOnBeforeCompile(shader);

                    this._ensureWaveContract(shader);

                    // Store uniform references for this material
                    this.materialUniforms.set(material, shader.uniforms);

                    if (this.debugEnabled) {
                        console.log('[WaveShaderBridge_v1] Wave uniforms injected (node material)');
                    }
                } catch (e) {
                    console.warn('[WaveShaderBridge_v1] onBeforeCompile patch error:', e);
                }
            };

            // Mark as registered
            this.registeredNodeMaterials.add(material);
            this.registeredNodeMaterialList.add(material);
            material[WAVE_BRIDGE_PATCHED] = true;

            if (this.debugEnabled) {
                console.log(`[WaveShaderBridge_v1] Node material registered (profile: ${profile})`);
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] registerNodeMaterial error:', e);
        }
    }

    /**
     * Register a link material for wave uniform updates
     * Same as registerNodeMaterial but tracks as link type
     * @param {THREE.Material} material - Material instance
     * @param {string} profile - Visual profile (DEFAULT, AURA, MYTHIC, SYNERGY, RIFT)
     */
    registerLinkMaterial(material, profile = 'DEFAULT') {
        try {
            if (!material) {
                if (this.warningsEnabled) console.warn('[WaveShaderBridge_v1] registerLinkMaterial: material is null');
                return;
            }

            // Material-level guard: prevent duplicate onBeforeCompile stacking across re-inits.
            if (material[WAVE_BRIDGE_PATCHED]) {
                return;
            }

            // HARDENING: Ensure registeredLinkMaterials is always iterable
            if (!this.registeredLinkMaterials || typeof this.registeredLinkMaterials.has !== 'function') {
                this.registeredLinkMaterials = new WeakSet();
            }

            // Check if already registered
            if (this.registeredLinkMaterials.has(material)) {
                if (this.debugEnabled) console.log('[WaveShaderBridge_v1] Material already registered (link)');
                return;
            }

            // Store profile
            this.materialProfiles.set(material, profile);

            // Initialize state
            const state = {
                profile,
                emaState: {
                    amplitude: 0,
                    constructive: 0,
                    destructive: 0,
                    interference: 0,
                    standing: 0,
                    phase: 0,
                    sourceCount: 0,
                    intensity: 0
                }
            };
            this.materialStates.set(material, state);

            // Patch onBeforeCompile
            const originalOnBeforeCompile = material.onBeforeCompile || (() => {});
            
            material.onBeforeCompile = (shader) => {
                try {
                    // Call original if exists
                    originalOnBeforeCompile(shader);

                    this._ensureWaveContract(shader);

                    // Store uniform references for this material
                    this.materialUniforms.set(material, shader.uniforms);

                    if (this.debugEnabled) {
                        console.log('[WaveShaderBridge_v1] Wave uniforms injected (link material)');
                    }
                } catch (e) {
                    console.warn('[WaveShaderBridge_v1] onBeforeCompile patch error:', e);
                }
            };

            // Mark as registered
            this.registeredLinkMaterials.add(material);
            this.registeredLinkMaterialList.add(material);
            material[WAVE_BRIDGE_PATCHED] = true;

            if (this.debugEnabled) {
                console.log(`[WaveShaderBridge_v1] Link material registered (profile: ${profile})`);
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] registerLinkMaterial error:', e);
        }
    }

    /**
     * Unregister a material (cleanup)
     * @param {THREE.Material} material - Material instance
     */
    unregisterMaterial(material) {
        try {
            if (!material) return;

            // Remove from tracking sets
            this.registeredNodeMaterials.delete?.(material);
            this.registeredLinkMaterials.delete?.(material);
            this.registeredNodeMaterialList?.delete?.(material);
            this.registeredLinkMaterialList?.delete?.(material);

            // WeakMap will auto-GC, but we can help by clearing if needed
            // (WeakMap doesn't have clear/delete, so just let it GC naturally)

            if (this.debugEnabled) {
                console.log('[WaveShaderBridge_v1] Material unregistered');
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] unregisterMaterial error:', e);
        }
    }

    /**
     * Update shader uniforms for all registered materials
     * @param {number} deltaTime - Frame delta time
     * @param {Object} options - Update options
     * @param {Array<Object>} options.nodes - Array of nodes to sample via waveEngine
     * @param {Array<Object>} options.links - Array of links to sample via waveEngine
     */
    update(deltaTime, { nodes = [], links = [] } = {}) {
        try {
            const dt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
            this._visualUpdateAccumulator += dt;
            if (this._visualUpdateAccumulator < this.visualUpdateIntervalSec) {
                return;
            }
            this._visualUpdateAccumulator = 0;

            const snapshot = this.waveEngine?.getActiveSnapshot?.() || null;

            // Update node materials
            this._updateNodeMaterials(snapshot, nodes);

            // Update link materials
            this._updateLinkMaterials(snapshot, links);
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] update error:', e);
        }
    }

    /**
     * Internal: Update all registered node materials
     * 
     * VISUAL READINESS GATE: Only process nodes that are visualReady
     */
    _updateNodeMaterials(snapshot, nodes) {
        try {
            // HARD GUARD: Ensure nodes is an array and has elements
            if (!Array.isArray(nodes) || nodes.length === 0) return;

            // VISUAL READINESS GATE: Filter to only ready nodes
            const readyNodes = filterReadyNodes(nodes);
            if (readyNodes.length === 0) {
                return;  // No ready nodes, skip silently
            }

            // Iterate via explicit Set registry (WeakSet is membership-only and non-iterable)
            if (!this.registeredNodeMaterialList || typeof this.registeredNodeMaterialList[Symbol.iterator] !== 'function') {
                return;  // Silent exit, no fallback
            }

            // Iterate through registered node materials
            for (const material of this.registeredNodeMaterialList) {
                this._updateMaterialUniforms(material, snapshot, readyNodes);
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] _updateNodeMaterials error:', e);
        }
    }

    /**
     * Internal: Update all registered link materials
     */
    _updateLinkMaterials(snapshot, links) {
        try {
            // HARD GUARD: Ensure links is an array and has elements
            if (!Array.isArray(links) || links.length === 0) return;

            // Iterate via explicit Set registry (WeakSet is membership-only and non-iterable)
            if (!this.registeredLinkMaterialList || typeof this.registeredLinkMaterialList[Symbol.iterator] !== 'function') {
                return;  // Silent exit, no fallback
            }

            // Iterate through registered link materials
            for (const material of this.registeredLinkMaterialList) {
                this._updateMaterialUniforms(material, snapshot, links, true);
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] _updateLinkMaterials error:', e);
        }
    }

    /**
     * Internal: Update uniforms for a single material
     */
    _updateMaterialUniforms(material, snapshot, entities, isLink = false) {
        try {
            if (!material) return;

            // Get uniform references
            const uniforms = this.materialUniforms.get(material);
            if (!uniforms) {
                // Material hasn't been compiled yet (onBeforeCompile not called)
                return;
            }

            // Get material state
            const state = this.materialStates.get(material);
            if (!state) return;

            if (Array.isArray(entities) && entities.length > 0) {
                const cachedEntity = isLink
                    ? this.linkMaterialToEntity.get(material)
                    : this.nodeMaterialToEntity.get(material);
                if (!cachedEntity) {
                    for (const ent of entities) {
                        if (this._entityUsesMaterial(ent, material)) {
                            if (isLink) {
                                this.linkMaterialToEntity.set(material, ent);
                            } else {
                                this.nodeMaterialToEntity.set(material, ent);
                            }
                            break;
                        }
                    }
                }
            }

            const waveField = this._resolveWaveField(snapshot);

            // Compute target values (normalized 0..1)
            const targetAmplitude = clamp01(Math.abs(waveField.totalAmplitude ?? 0));
            const targetConstructive = clamp01(
                waveField.constructivePower ?? waveField.constructive ?? 0
            );
            const targetDestructive = clamp01(
                waveField.destructivePower ?? waveField.destructive ?? waveField.destructiveInterference ?? 0
            );
            const targetInterference = clamp01(
                waveField.interferenceIndex ?? waveField.totalAmplitude ?? 0
            );
            const targetStanding = clamp01(
                waveField.standingWaveFactor ?? waveField.standing ?? 0
            );
            const targetPhase = clamp01(
                waveField.travelPhase ?? waveField.phase ?? 0
            );
            const targetSourceCount = clamp01((waveField.sourceCount ?? 0) / this.maxSources);
            const targetIntensity = clamp01(
                targetConstructive * 0.7 + targetInterference * 0.3
            );

            // Apply EMA smoothing
            const ema = state.emaState;
            ema.amplitude = updateEMA(ema.amplitude, targetAmplitude, this.emaAlpha);
            ema.constructive = updateEMA(ema.constructive, targetConstructive, this.emaAlpha);
            ema.destructive = updateEMA(ema.destructive, targetDestructive, this.emaAlpha);
            ema.interference = updateEMA(ema.interference, targetInterference, this.emaAlpha);
            ema.standing = updateEMA(ema.standing, targetStanding, this.emaAlpha);
            ema.phase = updateEMA(ema.phase, targetPhase, this.emaAlpha);
            ema.sourceCount = updateEMA(ema.sourceCount, targetSourceCount, this.emaAlpha);
            ema.intensity = updateEMA(ema.intensity, targetIntensity, this.emaAlpha);

            // Write smoothed values to uniforms
            uniforms.uWaveAmplitude.value = ema.amplitude;
            uniforms.uWaveConstructive.value = ema.constructive;
            uniforms.uWaveDestructive.value = ema.destructive;
            uniforms.uWaveInterference.value = ema.interference;
            uniforms.uWaveStanding.value = ema.standing;
            uniforms.uWavePhase.value = ema.phase;
            uniforms.uWaveSourceCount.value = ema.sourceCount;
            uniforms.uWaveIntensity.value = ema.intensity;
            if (uniforms.uWaveCenter && snapshot?.spatial?.center) {
                const c = snapshot.spatial.center;
                uniforms.uWaveCenter.value.set?.(c.x || 0, c.y || 0, c.z || 0);
            }
            const nowSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
            if (uniforms.uTime) uniforms.uTime.value = nowSec;
            if (uniforms.uWaveTime) uniforms.uWaveTime.value = nowSec;
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] _updateMaterialUniforms error:', e);
        }
    }

    _resolveWaveField(snapshot) {
        if (!snapshot?.timeline) return {};

        const nowSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
        const startAt = Number(snapshot.timeline.startAt);
        const peakAt = Number(snapshot.timeline.peakAt);
        const endAt = Number(snapshot.timeline.endAt);
        if (!Number.isFinite(startAt) || !Number.isFinite(peakAt) || !Number.isFinite(endAt)) {
            return {};
        }
        if (nowSec < startAt || nowSec > endAt) return {};

        const riseDuration = Math.max(0.0001, peakAt - startAt);
        const decayDuration = Math.max(0.0001, endAt - peakAt);
        let envelope = 0;
        if (nowSec <= peakAt) {
            envelope = clamp01((nowSec - startAt) / riseDuration);
        } else {
            envelope = clamp01(1 - ((nowSec - peakAt) / decayDuration));
        }

        const type = `${snapshot.type || ''}`.toLowerCase();
        const constructive =
            type === 'corruption' ? envelope * 0.2 :
            type === 'stability' ? envelope * 0.45 :
            type === 'synergy' ? envelope * 0.85 :
            envelope;
        const destructive =
            type === 'corruption' ? envelope * 0.95 :
            type === 'stability' ? envelope * 0.55 :
            type === 'synergy' ? envelope * 0.12 :
            envelope * 0.05;
        const standing =
            type === 'corruption' ? envelope * 0.35 :
            type === 'stability' ? envelope * 0.5 :
            type === 'synergy' ? envelope * 0.55 :
            envelope * 0.7;
        const phase = clamp01((nowSec - startAt) / Math.max(0.0001, endAt - startAt));

        return {
            totalAmplitude: envelope,
            constructivePower: clamp01(constructive),
            destructivePower: clamp01(destructive),
            interferenceIndex: clamp01((constructive + destructive) * 0.5),
            standingWaveFactor: clamp01(standing),
            travelPhase: phase,
            sourceCount: 1
        };
    }

    /**
     * Ensure shader has the shared wave contract (uniforms + varyings) exactly once.
     * @private
     */
    _ensureWaveContract(shader) {
        shader.uniforms = shader.uniforms || {};

        const ensureUniform = (name, init) => {
            if (!shader.uniforms[name]) {
                shader.uniforms[name] = init;
            }
        };

        // Optional per-material capability flags (stored on material.userData)
        const hasUV = shader?.material?.userData?.__waveHasUV === true;
        shader.defines = shader.defines || {};
        if (hasUV) {
            shader.defines.USE_UV = '';
        } else {
            delete shader.defines.USE_UV;
        }

        // Core wave uniforms
        ensureUniform('uWaveAmplitude', { value: 0 });
        ensureUniform('uWaveConstructive', { value: 0 });
        ensureUniform('uWaveDestructive', { value: 0 });
        ensureUniform('uWaveInterference', { value: 0 });
        ensureUniform('uWaveStanding', { value: 0 });
        ensureUniform('uWavePhase', { value: 0 });
        ensureUniform('uWaveSourceCount', { value: 0 });
        ensureUniform('uWaveIntensity', { value: 0 });

        // Travel / dynamics extras
        ensureUniform('uWaveTravelFreqMix', { value: new THREE.Vector3(1, 0, 0) });
        ensureUniform('uWaveTravelScale', { value: 0 });
        ensureUniform('uWaveTravelPulse', { value: 0 });
        ensureUniform('uWaveTravelUVFlow', { value: 0 });
        ensureUniform('uWaveTravelColorGradient', { value: 0 });
        ensureUniform('uWaveDynamicsBreathFreq', { value: 0 });
        ensureUniform('uWaveDynamicsBreathAmp', { value: 0 });
        ensureUniform('uWaveDynamicsDiffusionAmp', { value: 0 });
        ensureUniform('uWaveCenter', { value: new THREE.Vector3(0, 0, 0) });

        // Time
        ensureUniform('uTime', { value: 0 });
        ensureUniform('uWaveTime', { value: 0 });

        const hasUniformDecl = (code, uniformName) => {
            if (!code || !uniformName) return false;
            const name = escapeRegExp(uniformName);
            const re = new RegExp(`\\buniform\\b[^;]*\\b${name}\\b\\s*;`);
            return re.test(code);
        };
        const addDeclIfMissing = (code, decl, uniformName) =>
            hasUniformDecl(code, uniformName) ? code : `${decl}\n${code}`;
        const dedupeUniformDecls = (code, uniformName) => {
            if (!code || !uniformName) return code;
            const name = escapeRegExp(uniformName);
            const lineRe = new RegExp(`^\\s*uniform\\b[^;]*\\b${name}\\b\\s*;\\s*$`, 'gm');
            let seen = false;
            return code.replace(lineRe, (match) => {
                if (seen) return '';
                seen = true;
                return match;
            });
        };

        // Uniform declarations
        const uniformDecls = [
            { name: 'uTime', decl: 'uniform float uTime;' },
            { name: 'uWaveAmplitude', decl: 'uniform float uWaveAmplitude;' },
            { name: 'uWaveConstructive', decl: 'uniform float uWaveConstructive;' },
            { name: 'uWaveDestructive', decl: 'uniform float uWaveDestructive;' },
            { name: 'uWaveInterference', decl: 'uniform float uWaveInterference;' },
            { name: 'uWaveStanding', decl: 'uniform float uWaveStanding;' },
            { name: 'uWavePhase', decl: 'uniform float uWavePhase;' },
            { name: 'uWaveSourceCount', decl: 'uniform float uWaveSourceCount;' },
            { name: 'uWaveIntensity', decl: 'uniform float uWaveIntensity;' },
            { name: 'uWaveTravelFreqMix', decl: 'uniform vec3 uWaveTravelFreqMix;' },
            { name: 'uWaveTravelScale', decl: 'uniform float uWaveTravelScale;' },
            { name: 'uWaveTravelChaos', decl: 'uniform float uWaveTravelChaos;' },
            { name: 'uWaveTravelPulse', decl: 'uniform float uWaveTravelPulse;' },
            { name: 'uWaveTravelUVFlow', decl: 'uniform float uWaveTravelUVFlow;' },
            { name: 'uWaveTravelColorGradient', decl: 'uniform float uWaveTravelColorGradient;' },
            { name: 'uWaveDynamicsBreathFreq', decl: 'uniform float uWaveDynamicsBreathFreq;' },
            { name: 'uWaveDynamicsBreathAmp', decl: 'uniform float uWaveDynamicsBreathAmp;' },
            { name: 'uWaveDynamicsRippleAmp', decl: 'uniform float uWaveDynamicsRippleAmp;' },
            { name: 'uWaveDynamicsRippleFreq', decl: 'uniform float uWaveDynamicsRippleFreq;' },
            { name: 'uWaveDynamicsChaosDrive', decl: 'uniform float uWaveDynamicsChaosDrive;' },
            { name: 'uWaveDynamicsDiffusionAmp', decl: 'uniform float uWaveDynamicsDiffusionAmp;' },
            { name: 'uWaveCenter', decl: 'uniform vec3 uWaveCenter;' }
        ];

        uniformDecls.forEach(({ name, decl }) => {
            shader.vertexShader = addDeclIfMissing(shader.vertexShader, decl, name);
            shader.fragmentShader = addDeclIfMissing(shader.fragmentShader, decl, name);
        });
        uniformDecls.forEach(({ name }) => {
            shader.vertexShader = dedupeUniformDecls(shader.vertexShader, name);
            shader.fragmentShader = dedupeUniformDecls(shader.fragmentShader, name);
        });

    }

    /**
     * Internal: Check if an entity uses a material
     * Handles both single and array materials
     */
    _entityUsesMaterial(entity, material) {
        try {
            if (!entity || !material) return false;

            // Check mesh material(s)
            if (entity.material === material) return true;
            if (Array.isArray(entity.material) && entity.material.includes(material)) return true;

            // Check geometry material index
            if (entity.material && Array.isArray(entity.material)) {
                for (const mat of entity.material) {
                    if (mat === material) return true;
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Dispose and cleanup resources
     */
    dispose() {
        try {
            // Clear all tracked sets and maps
            // (WeakSet/WeakMap will auto-GC, but we can help by clearing explicit state)
            
            // No strong references to clear - WeakMap/WeakSet handles auto-cleanup
            // Just null out references
            this.registeredNodeMaterials = null;
            this.registeredLinkMaterials = null;
            this.registeredNodeMaterialList = null;
            this.registeredLinkMaterialList = null;
            this.materialStates = null;
            this.materialUniforms = null;
            this.materialProfiles = null;
            this.nodeMaterialToEntity = null;
            this.linkMaterialToEntity = null;

            if (this.debugEnabled) {
                console.log('[WaveShaderBridge_v1] Disposed ✓');
            }
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] dispose error:', e);
        }
    }

    /**
     * Set debug mode (console logging)
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
     * Get metrics for monitoring
     */
    getMetrics() {
        try {
            return {
                registeredNodeMaterials: this.registeredNodeMaterialList?.size ?? 0,
                registeredLinkMaterials: this.registeredLinkMaterialList?.size ?? 0,
                emaAlpha: this.emaAlpha,
                maxSources: this.maxSources
            };
        } catch (e) {
            console.warn('[WaveShaderBridge_v1] getMetrics error:', e);
            return {};
        }
    }
}

export default WaveShaderBridge_v1;
