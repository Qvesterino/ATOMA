import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkPulseWaveInjector } from './LinkPulseWaveInjector.js';
import LinkStreakColorDynamics from './LinkStreakColorDynamics_Session115.js';
import { LinkDirectionalGradientPolish } from './LinkDirectionalGradientPolish.js';

/**
 * LinkDirectionalStreaks
 * ============================================================================
 * Pure visual layer: Directional energy ribbons traveling along link curves.
 * 
 * DESIGN CONSTRAINTS (CRITICAL):
 * ✅ Adapter-only: No gameplay logic changes
 * ✅ Zero per-frame allocations: All buffers cached and reused
 * ✅ No new materials per frame: Safe uniform updates only
 * ✅ No particle systems: Static ribbon geometry with animated sampling
 * ✅ Reads-only from link state: Never modifies gameplay data
 * 
 * VISUAL BEHAVIOR:
 * - Thin luminous ribbons travel source → target along link curve
 * - Each ribbon: fade-in → glide → fade-out (not looping)
 * - Embedded within/above braided strands
 * - Never occlude nodes or detach from curve
 * 
 * STATE MAPPINGS:
 * - Synergy: controls speed (0.6x–1.6x), count (3–7), motion smoothness
 * - Harmony: controls brightness, length smoothness, emissive intensity boost
 * - Corruption: desaturation, phase jitter, color shift
 * - Instability: lifetime shortening, occasional suppression
 * 
 * ARCHITECTURE:
 * - One BufferGeometry per link (cached, reused)
 * - One material per link (additive blending, emissive-only)
 * - Per-streak state arrays: offsets[], speeds[], lengths[], phases[]
 * - Update loop: advance offsets → sample curve → rebuild buffers in-place
 */
export class LinkDirectionalStreaks {
    constructor(scene) {
        this.scene = scene;
        
        this.config = {
            streakWidthBase: 0.10,      // Thicker ribbon for reliable readability
            streakLengthMin: 0.12,      // Min visible length on curve (0-1)
            streakLengthMax: 0.55,      // Max visible length on curve (0-1)
            streakCountMin: 5,          // Min active streaks
            streakCountMax: 10,          // Max active streaks
            speedBaseMin: 0.6,          // Synergy multiplier range (min)
            speedBaseMax: 1.6,          // Synergy multiplier range (max)
            segmentsPerStreak: 12,      // Ribbon resolution (low for perf)
            harmonyBoost: 0.08,         // Keep harmony modulation subtle to avoid white blowout
            corruptionDesaturation: 0.4, // Color desaturation from corruption
            instabilityDampen: 0.7,     // Opacity scaling from instability
            activationThreshold: 2,     // Min active links for streak visibility (was 3, now 2)
        };
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._vec3_2 = new THREE.Vector3();
        this._color = new THREE.Color();
        this._hsl = {};
        this._defaultStreakColor = new THREE.Color(0x00ff88);

        // Hot-path ribbon caches
        this._ribbonPoint = new THREE.Vector3();
        this._ribbonPoint2 = new THREE.Vector3();
        this._ribbonTangent = new THREE.Vector3();
        this._ribbonTangent2 = new THREE.Vector3();
        this._ribbonCrossAxis = new THREE.Vector3();
        this._ribbonNormal = new THREE.Vector3();
        this._ribbonFallbackUp = new THREE.Vector3();
        this._ribbonPreviousCenter = new THREE.Vector3();
        this._ribbonPreviousTop = new THREE.Vector3();
        this._ribbonPreviousBottom = new THREE.Vector3();
        this._ribbonV1 = new THREE.Vector3();
        this._ribbonV2 = new THREE.Vector3();
        this._ribbonV3 = new THREE.Vector3();
        this._ribbonV4 = new THREE.Vector3();
        
        // Pulse wave injection system
        this.pulseInjector = new LinkPulseWaveInjector();
        
        // Color dynamics system (NEW - Session 115)
        this.colorDynamics = new LinkStreakColorDynamics({
            enabled: true,
            debugMode: false
        });

        this.gradientPolish = new LinkDirectionalGradientPolish();

        // Reusable geometry buffers to avoid per-frame allocations.
        const maxStreaks = this.config.streakCountMax;
        const maxSegmentsPerStreak = Math.max(6, this.config.segmentsPerStreak);
        const maxVerticesPerStreak = (maxSegmentsPerStreak + 1) * 4;
        const maxIndicesPerStreak = Math.max(0, maxSegmentsPerStreak * 12);
        this._geometryBufferCapacity = {
            maxStreaks,
            maxSegmentsPerStreak,
            maxVertices: maxStreaks * maxVerticesPerStreak,
            maxIndices: maxStreaks * maxIndicesPerStreak
        };
        this._positionsBuffer = new Float32Array(this._geometryBufferCapacity.maxVertices * 3);
        this._indicesBuffer = new Uint32Array(this._geometryBufferCapacity.maxIndices);
    }

    /**
     * Initialize streaks for a single link
     * Called once per link in LinkRendererConduit.createLinkVisuals
     * 
     * @param {THREE.Group} linkGroup - The link visual group
     * @param {number} linkIdHash - Stable hash for deterministic randomization
     * @param {Object} link - Link data (for pulse tracking)
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {Object} hubController - Harmonic hub controller (if any)
     */
    initialize(linkGroup, linkIdHash = 0, link = null, sourceNode = null, targetNode = null, hubController = null) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        
        const state = linkGroup.userData.conduitState;
        
        // Initialize pulse tracking for this link
        if (link && sourceNode && targetNode) {
            this.pulseInjector.initializePulseTracking(linkGroup, link, sourceNode, targetNode, hubController);
        }
        
        // Create material once (cached, reused)
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            emissive: 0x00ff88,           // Bright green glow
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            fog: false
        });
        
        // Create geometry once (buffered, reused)
        const geometry = new THREE.BufferGeometry();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        const directionalOrder = VisualHierarchyRegistry.getRenderOrder('LINK_DIRECTIONAL');
        mesh.renderOrder = directionalOrder;
        linkGroup.add(mesh);
        
        // Streak state arrays (allocated once, reused)
        const baseStreakCount = this.config.streakCountMax;
        const streaks = {
            mesh: mesh,
            material: material,
            geometry: geometry,
            linkId: link?.id ?? null,
            count: baseStreakCount,
            offsets: new Float32Array(baseStreakCount),      // Position on curve (0-1)
            speeds: new Float32Array(baseStreakCount),       // Units per second
            lengths: new Float32Array(baseStreakCount),      // Visible length (0-1)
            phases: new Float32Array(baseStreakCount),       // Life phase (0-1)
            lifetimes: new Float32Array(baseStreakCount),    // Total lifetime (seconds)
            ages: new Float32Array(baseStreakCount),         // Current age (seconds)
            // Corruption jitter per streak (stable noise)
            jitterPhases: new Float32Array(baseStreakCount),
            // Instability suppression flags
            suppressed: new Uint8Array(baseStreakCount),
        };
        
        // Initialize per-streak parameters (deterministic based on hash)
        for (let i = 0; i < baseStreakCount; i++) {
            const rng = Math.sin(linkIdHash * 12.9898 + i * 78.233) * 43758.5453; // Deterministic hash
            const rng01 = rng - Math.floor(rng);
            streaks.offsets[i] = THREE.MathUtils.clamp(0.2 + ((i / baseStreakCount) * 0.6) + (rng01 * 0.05), 0.2, 0.8);
            streaks.phases[i] = streaks.offsets[i];
            streaks.speeds[i] = 0.8;           // Default, will scale with synergy
            streaks.lengths[i] = 0.15;         // Default, will scale with harmony
            streaks.lifetimes[i] = 2.0;        // Default, will scale with instability
            streaks.ages[i] = (i / baseStreakCount) * streaks.lifetimes[i]; // Stagger starts
            streaks.jitterPhases[i] = rng * Math.PI * 2;
            streaks.suppressed[i] = 0;
        }
        
        // Store in link state
        state.directionalStreaks = streaks;
    }

    /**
     * Update streaks for a single link
     * Called every frame in LinkRendererConduit.update
     * 
     * @param {THREE.Group} linkGroup - The link visual group
     * @param {THREE.QuadraticBezierCurve3} curve - The link curve
     * @param {number} deltaTime - Frame delta
     * @param {number} synergy - Synergy level (0-1)
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} instability - Instability level (0-1)
     * @param {THREE.Color} baseColor - Link base color
     * @param {THREE.Color} targetColor - Link target color (optional)
     * @param {Object} link - Link data object (for pulse injection)
     * @param {number} time - Current time
     * @param {number|Object} specialization - Link specialization bias (-1 to +1), or conduit frameState/options payload
     */
    update(linkGroup, curve, deltaTime, synergy = 0.5, harmony = 1.0, corruption = 0.0, instability = 0.0, baseColor = null, targetColor = null, link = null, time = 0, specialization = 0) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        if (!curve) return; // Defensive: no curve, skip
        
        const state = linkGroup.userData.conduitState;
        const streaks = state.directionalStreaks;
        const options = (specialization && typeof specialization === 'object') ? specialization : null;
        const geometryState = options?.geometry || null;
        const resolvedSpecialization = typeof specialization === 'number'
            ? specialization
            : (typeof options?.specialization === 'number' ? options.specialization : 0);
        
        if (!streaks || !streaks.ages || !streaks.geometry || !streaks.material) return; // Not initialized or arrays not ready
        
        const frameSegments = geometryState?.segments || state.__cachedFrenetSegments || state.strandSegments || Math.max(20, Math.floor((curve.getLength?.() || 10) * 8));
        const frames = geometryState?.frames || state.__cachedFrenetFrames || null;
        if (!frames) return;
        
        // Store link reference for pulse injection
        if (link) {
            state.link = link;
            state.linkReference = link;
        }
        
        // Update pulse waves for this link
        const pulseEffectData = this.pulseInjector.update(
            linkGroup,
            curve,
            deltaTime,
            synergy,
            harmony,
            corruption,
            instability
        );
        
        // Update harmonic hub phase synchronization
        if (link && link.source && link.target) {
            this.pulseInjector.phaseSync.update(
                linkGroup,
                this.pulseInjector,
                deltaTime,
                synergy,
                harmony,
                corruption,
                instability,
                time
            );
        }
        
        // --- COMPUTE STATE-DRIVEN PARAMETERS ---
        let gradientSample = null;
        if (this.gradientPolish && link?.id) {
            this.gradientPolish._computeLinkGradient({
                id: link.id,
                synergy,
                harmony,
                corruption,
                instability,
                active: true,
                mesh: streaks.mesh
            });
            gradientSample = this.gradientPolish.getGradientAtT(link.id, 0.35);
        }
        
        // Synergy controls speed and count
        const synergyVisual = Math.max(0.7, synergy);
        const speedMultiplier = this.config.speedBaseMin + (synergyVisual * (this.config.speedBaseMax - this.config.speedBaseMin));
        const activeStreakCount = Math.ceil(this.config.streakCountMin + (synergyVisual * (this.config.streakCountMax - this.config.streakCountMin)));
        
        // Harmony controls length and brightness
        const curveLength = curve.getLength ? curve.getLength() : 10;

        const physicalLength = THREE.MathUtils.clamp(curveLength * 0.08, 0.8, 3.0);

        const lengthScale = physicalLength / curveLength;// Cap streak span to prevent visual detachment
        const harmonyBrightness = 0.6 + (harmony * this.config.harmonyBoost);
        
        // Corruption adds phase jitter but not speed randomness
        const jitterAmount = corruption * 0.15; // Subtle lateral jitter
        const desaturation = corruption * this.config.corruptionDesaturation;
        
        // Instability effects - DISABLED per user request
        // Opacity multipliers and suppressed flags removed
        const instabilityFactor = 1.0; // Full lifetime (no shortening)
        const suppressionThreshold = 0; // No suppression
        
        // --- UPDATE EACH STREAK ---
        let vertexCursor = 0;
        let indexCursor = 0;
        const corridorRadius = this._computeCorridorRadius(state);
        const maxCenterStep = Math.max(0.6, corridorRadius * 3.0);
        const maxEdgeStep = Math.max(0.8, corridorRadius * 3.5);
        const pointOnCurve = this._ribbonPoint;
        const pointOnCurve2 = this._ribbonPoint2;
        const tangent = this._ribbonTangent;
        const tangent2 = this._ribbonTangent2;
        const crossAxis = this._ribbonCrossAxis;
        const perpendicular = this._ribbonNormal;
        const previousCenter = this._ribbonPreviousCenter;
        const previousTop = this._ribbonPreviousTop;
        const previousBottom = this._ribbonPreviousBottom;
        const v1 = this._ribbonV1;
        const v2 = this._ribbonV2;
        const v3 = this._ribbonV3;
        const v4 = this._ribbonV4;
        const pulsePositions = pulseEffectData?.positions || null;
        
        // Cap at actual streak count
        const streakCountToProcess = Math.min(activeStreakCount, streaks.count);
        
        for (let i = 0; i < streakCountToProcess; i++) {
            // Advance age
            streaks.ages[i] += deltaTime;
            
            // Compute lifetime for this streak
            const baseLifetime = 2.0;
            const scaledLifetime = baseLifetime * instabilityFactor;
            
            // Restart if expired
            if (streaks.ages[i] >= scaledLifetime) {
                streaks.ages[i] = 0;
                streaks.offsets[i] = (streaks.offsets[i] + (0.22 + (i / Math.max(1, streakCountToProcess)) * 0.18)) % 1.0;
            }
            
            // Compute life phase (0-1)
            streaks.phases[i] = streaks.ages[i] / scaledLifetime;
            
            // Update speed (no randomness, clean synergy-driven motion)
            streaks.speeds[i] = speedMultiplier * 0.45; // 0.8 is base speed factor
            
            // Advance offset along curve
            streaks.offsets[i] += (streaks.speeds[i] * deltaTime);
            
            // Wrap if exceeded curve
            if (streaks.offsets[i] > 1.0) {
                streaks.offsets[i] -= 1.0;
            }
            
            // Compute visibility (fade-in, stay, fade-out)
            const phase = streaks.phases[i];
            let opacity = 1.0;
            
            if (phase < 0.15) {
                // Fade in (0 → 1)
                opacity = phase / 0.15;
            } else if (phase > 0.85) {
                // Fade out (1 → 0)
                opacity = (1.0 - phase) / 0.15;
            }
            
            // Instability suppression - DISABLED per user request
            // streaks.suppressed[i] remains 0 (no suppression)
            // No instability damping applied
            
            // Apply overall instability damping - DISABLED
            // opacity *= (1.0 - (instability * this.config.instabilityDampen));
            
            // --- BUILD RIBBON GEOMETRY ---
            // Sample curve at streak offset ± length
            let streakStart = streaks.offsets[i] - lengthScale;
            let streakEnd = streaks.offsets[i] + lengthScale;

            if (streakStart < 0) streakStart += 1.0;
            if (streakEnd > 1.0) streakEnd -= 1.0;
            
            const segmentsInStreak = Math.max(
            6,
            Math.floor(this.config.segmentsPerStreak * (streakEnd - streakStart))
            );
            
            let previousPairStart = -1;
            let previousPairValid = false;
            
            for (let j = 0; j <= segmentsInStreak; j++) {
                const t = streakStart + ((j / segmentsInStreak) * (streakEnd - streakStart));
                
                // Sample curve point
                curve.getPointAt(Math.max(0, Math.min(1, t)), pointOnCurve);
                if (!this._isFiniteVector(pointOnCurve)) {
                    previousPairStart = -1;
                    previousPairValid = false;
                    continue;
                }
                
                const idx = Math.min(frameSegments, Math.max(0, Math.round(t * frameSegments)));

                // Tangent for orientation (approximate via nearby points)
                const tangentResult = this._sampleCurveTangent(curve, t, frames.tangents?.[idx], tangent);
                if (!this._isFiniteVector(tangentResult)) {
                    previousPairStart = -1;
                    previousPairValid = false;
                    continue;
                }
                
                // Create ribbon width variation (thinner at edges, thicker in middle)
                const ribbonProgress = j / segmentsInStreak;
                let widthFactor = Math.pow(Math.sin(ribbonProgress * Math.PI), 1.6);
                widthFactor = Math.max(0.35, widthFactor); // Never too thin, but narrower
                
                // Keep streak centered on the main spline, but require a stable width axis.
                const perpendicularResult = this._getStableRibbonNormal(frames, idx, tangentResult, perpendicular);
                if (!perpendicularResult) {
                    previousPairStart = -1;
                    previousPairValid = false;
                    continue;
                }
                crossAxis.crossVectors(tangentResult, perpendicularResult).normalize();
                if (!this._isFiniteVector(crossAxis) || crossAxis.lengthSq() <= 1e-8) {
                    previousPairStart = -1;
                    previousPairValid = false;
                    continue;
                }
                
                // --- PULSE WAVE EFFECTS ---
                // Check if any pulse waves affect this streak position
                const pulseEffect = this.pulseInjector.getStreakPulseEffect(
                    t,  // Position on curve (0-1)
                    pulsePositions,
                    harmony,
                    linkGroup,  // For harmonic hub phase sync
                    time,
                    link  // For cascade pulse effects
                );
                
        // Build quad (two vertices per curve point)
        let ribbonWidth = (this.config.streakWidthBase * widthFactor);
        ribbonWidth *= pulseEffect.thickness; // Apply pulse thickness boost
        ribbonWidth = THREE.MathUtils.clamp(ribbonWidth, 0.01, corridorRadius * 0.85);
        
        // Top edge
        v1.copy(pointOnCurve).addScaledVector(perpendicularResult, ribbonWidth * 0.5);
        this._clampVertexToCorridor(v1, pointOnCurve, corridorRadius);
        
        // --- GUARD: Skip invalid v1 vertices ---
        if (!Number.isFinite(v1.x) || !Number.isFinite(v1.y) || !Number.isFinite(v1.z)) {
            continue;
        }
        
        // Bottom edge
        v2.copy(pointOnCurve).addScaledVector(perpendicularResult, -ribbonWidth * 0.5);
        this._clampVertexToCorridor(v2, pointOnCurve, corridorRadius);
        
        // --- GUARD: Skip invalid v2 vertices ---
        if (!Number.isFinite(v2.x) || !Number.isFinite(v2.y) || !Number.isFinite(v2.z)) {
            continue;
        }
        
        v3.copy(pointOnCurve).addScaledVector(crossAxis, ribbonWidth * 0.36);
        this._clampVertexToCorridor(v3, pointOnCurve, corridorRadius);
        v4.copy(pointOnCurve).addScaledVector(crossAxis, -ribbonWidth * 0.36);
        this._clampVertexToCorridor(v4, pointOnCurve, corridorRadius);

            const pairStart = vertexCursor;
            this._writeVertexTriplet(vertexCursor, v1, v2, v3, v4);
        vertexCursor += 4;

        if (
            previousPairStart >= 0 &&
            previousPairValid &&
            pointOnCurve.distanceTo(previousCenter) <= maxCenterStep &&
            v1.distanceTo(previousTop) <= maxEdgeStep &&
            v2.distanceTo(previousBottom) <= maxEdgeStep
        ) {
            const a = previousPairStart;
            const b = previousPairStart + 1;
            const c = pairStart;
            const d = pairStart + 1;
            const a2 = previousPairStart + 2;
            const b2 = previousPairStart + 3;
            const c2 = pairStart + 2;
            const d2 = pairStart + 3;

            indexCursor = this._writeQuadIndices(indexCursor, a, b, c, d, a2, b2, c2, d2);
        }

        previousPairStart = pairStart;
        previousPairValid = true;
        previousCenter.copy(pointOnCurve);
        previousTop.copy(v1);
        previousBottom.copy(v2);
        }
        }
        
        // --- UPDATE GEOMETRY BUFFER ---
        this._updateGeometryBuffer(streaks, vertexCursor, indexCursor, activeStreakCount, harmony, corruption, desaturation, baseColor, targetColor, pulseEffectData, synergy, resolvedSpecialization, gradientSample);
        
        // --- UPDATE MATERIAL WITH PULSE EFFECTS ---
        if (streaks.material) {
            let baseBrightness = harmonyBrightness;
            let baseOpacity = 0.22 * (1.0 - (instability * 0.15));

            // Apply pulse effects to material
            if (pulseEffectData && pulseEffectData.hasPulse) {
                baseBrightness += pulseEffectData.intensityBoost;
                baseOpacity *= pulseEffectData.alphaBoost;
            }
            if (gradientSample) {
                baseBrightness += gradientSample.emissiveBoost || 0;
            }

            streaks.material.emissiveIntensity = baseBrightness;
            streaks.material.opacity = baseOpacity;

            // Log opacity for debugging (throttled to 1 per second)
            if (typeof window !== 'undefined') {
                this._streakOpacityLogTime = this._streakOpacityLogTime || 0;
                this._streakOpacityLogTime += deltaTime;
                if (this._streakOpacityLogTime > 1.0) {
                    console.log('[DirectionalStreaks] Opacity:', baseOpacity.toFixed(3), 'instability:', instability.toFixed(3), 'harmony:', harmony.toFixed(3), 'synergy:', synergy.toFixed(3));
                    this._streakOpacityLogTime = 0;
                }
            }
        }
    }
    
    /**
     * Inject a pulse from a node into this link's streaks
     * Called from LinkRendererConduit when a node emits a pulse
     * 
     * @param {THREE.Group} linkGroup - Link visual group
     * @param {Object} sourceNode - Node emitting the pulse
     */
    injectNodePulse(linkGroup, sourceNode) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        const state = linkGroup.userData.conduitState;
        
        // Get link object from state (it's stored during update)
        if (state.linkReference) {
            this.pulseInjector.injectNodePulse(sourceNode, [state.linkReference]);
        }
    }

    /**
     * Compute curve tangent at parameter t (approximate)
     * @private
     */
    _sampleCurveTangent(curve, t, fallbackTangent = null, out = null) {
        const delta = 0.001;
        const p1 = this._ribbonPoint;
        const p2 = this._ribbonPoint2;
        curve.getPointAt(Math.max(0, t - delta), p1);
        curve.getPointAt(Math.min(1, t + delta), p2);
        const tangent = out || this._ribbonTangent;
        tangent.copy(p2).sub(p1);
        if (tangent.lengthSq() > 1e-8) {
            return tangent.normalize();
        }
        if (fallbackTangent && this._isFiniteVector(fallbackTangent) && fallbackTangent.lengthSq() > 1e-8) {
            return tangent.copy(fallbackTangent).normalize();
        }
        return null;
    }

    /**
     * Update geometry buffer in-place (no allocations)
     * Applies color dynamics based on harmony and specialization
     * @private
     */
    _updateGeometryBuffer(streaks, vertexCount, indexCount, activeStreakCount, harmony, corruption, desaturation, baseColor, targetColor, pulseEffectData = null, synergy = 0.5, specialization = 0, gradientSample = null) {
        if (!streaks || !streaks.geometry || !this._positionsBuffer || !this._indicesBuffer) return;
        if (vertexCount === 0 || indexCount === 0) {
            this._clearGeometryBuffer(streaks.geometry);
            return;
        }

        let positionAttribute = streaks.geometry.getAttribute('position');
        if (!positionAttribute || positionAttribute.array !== this._positionsBuffer) {
            positionAttribute = new THREE.BufferAttribute(this._positionsBuffer, 3);
            streaks.geometry.setAttribute('position', positionAttribute);
        }

        let indexAttribute = streaks.geometry.getIndex();
        if (!indexAttribute || indexAttribute.array !== this._indicesBuffer) {
            indexAttribute = new THREE.BufferAttribute(this._indicesBuffer, 1);
            streaks.geometry.setIndex(indexAttribute);
        }

        positionAttribute.needsUpdate = true;
        indexAttribute.needsUpdate = true;
        streaks.geometry.setDrawRange(0, indexCount);

        // Update material color with state (ENHANCED: Session 115 color dynamics)
        if (streaks.material) {
            if (!streaks?.material?.color || !streaks?.material?.emissive) return;
            const colorState = streaks.__colorState || (streaks.__colorState = {
                baseHex: -1,
                targetHex: -1,
                harmonyKey: -1,
                corruptionKey: -1,
                synergyKey: -1,
                specializationKey: -1,
                gradientBrightnessKey: -1,
                gradientSaturationKey: -1,
                pulseSaturationKey: -1
            });

            const resolvedBaseColor = (baseColor && baseColor.isColor) ? baseColor : this._defaultStreakColor;
            const resolvedTargetColor = (targetColor && targetColor.isColor) ? targetColor : null;
            const baseHex = resolvedBaseColor.getHex();
            const targetHex = resolvedTargetColor ? resolvedTargetColor.getHex() : -1;
            const colorCacheScale = 120;
            const harmonyKey = Math.round(harmony * colorCacheScale);
            const corruptionKey = Math.round(corruption * colorCacheScale);
            const synergyKey = Math.round(synergy * colorCacheScale);
            const specializationKey = Math.round((specialization + 1.0) * colorCacheScale);
            const gradientBrightnessKey = Math.round((gradientSample?.brightness ?? 1.0) * colorCacheScale);
            const gradientSaturationKey = Math.round((gradientSample?.saturation ?? 1.0) * colorCacheScale);
            const pulseSaturationKey = Math.round((pulseEffectData?.saturation ?? 0) * colorCacheScale);
            const colorDirty =
                colorState.baseHex !== baseHex ||
                colorState.targetHex !== targetHex ||
                colorState.harmonyKey !== harmonyKey ||
                colorState.corruptionKey !== corruptionKey ||
                colorState.synergyKey !== synergyKey ||
                colorState.specializationKey !== specializationKey ||
                colorState.gradientBrightnessKey !== gradientBrightnessKey ||
                colorState.gradientSaturationKey !== gradientSaturationKey ||
                colorState.pulseSaturationKey !== pulseSaturationKey;

            if (colorDirty) {
                let color = this._color;
                color.copy(resolvedBaseColor);

                // Lerp toward target if provided
                if (resolvedTargetColor) {
                    color.lerp(resolvedTargetColor, 0.3);
                }

                // === NEW (Session 115): Apply color dynamics based on harmony + specialization ===
                const dynamicColor = this.colorDynamics.computeStreakColor(
                    color,
                    harmony,
                    specialization,
                    corruption,
                    synergy
                );
                color.copy(dynamicColor);

                if (gradientSample) {
                    color.multiplyScalar(gradientSample.brightness || 1.0);
                    color.getHSL(this._hsl);
                    this._hsl.s = THREE.MathUtils.clamp(this._hsl.s * (gradientSample.saturation || 1.0), 0, 1);
                    color.setHSL(this._hsl.h, this._hsl.s, this._hsl.l);
                }

                // Apply pulse saturation boost (on top of color dynamics)
                if (pulseEffectData && pulseEffectData.hasPulse && pulseEffectData.saturation > 0) {
                    color.getHSL(this._hsl);
                    this._hsl.s = Math.min(1.0, this._hsl.s + pulseEffectData.saturation);
                    color.setHSL(this._hsl.h, this._hsl.s, this._hsl.l);
                }

                streaks.material.color.copy(color);
                streaks.material.emissive.copy(color);

                colorState.baseHex = baseHex;
                colorState.targetHex = targetHex;
                colorState.harmonyKey = harmonyKey;
                colorState.corruptionKey = corruptionKey;
                colorState.synergyKey = synergyKey;
                colorState.specializationKey = specializationKey;
                colorState.gradientBrightnessKey = gradientBrightnessKey;
                colorState.gradientSaturationKey = gradientSaturationKey;
                colorState.pulseSaturationKey = pulseSaturationKey;
            }
        }
    }

    _computeCorridorRadius(state) {
        const activeRadius = Number.isFinite(state?.activeRadius) ? state.activeRadius : 0.12;
        return THREE.MathUtils.clamp((activeRadius * 2.25) + 0.08, 0.18, 0.55);
    }

    _getStableRibbonNormal(frames, idx, tangent, out = null) {
        const candidates = [
            frames?.normals?.[idx],
            frames?.normals?.[idx - 1],
            frames?.normals?.[idx + 1],
            frames?.binormals?.[idx],
            frames?.binormals?.[idx - 1],
            frames?.binormals?.[idx + 1]
        ];

        for (const candidate of candidates) {
            if (!this._isFiniteVector(candidate) || candidate.lengthSq() <= 1e-8) {
                continue;
            }

            const axis = out || this._ribbonNormal;
            axis.copy(candidate).addScaledVector(tangent, -candidate.dot(tangent));
            if (axis.lengthSq() > 1e-8) {
                return axis.normalize();
            }
        }

        const fallbackUp = this._ribbonFallbackUp;
        fallbackUp.set(Math.abs(tangent.y) < 0.9 ? 0 : 1, Math.abs(tangent.y) < 0.9 ? 1 : 0, 0);
        const axis = out || this._ribbonNormal;
        axis.copy(fallbackUp).addScaledVector(tangent, -fallbackUp.dot(tangent));
        if (axis.lengthSq() > 1e-8) {
            return axis.normalize();
        }

        return null;
    }

    _clampVertexToCorridor(vertex, center, corridorRadius) {
        const drift = this._vec3.copy(vertex).sub(center);
        const driftLength = drift.length();

        if (driftLength > corridorRadius && driftLength > 1e-8) {
            drift.multiplyScalar(corridorRadius / driftLength);
            vertex.copy(center).add(drift);
        }

        return vertex;
    }

    _isFiniteVector(vec) {
        return !!vec &&
            Number.isFinite(vec.x) &&
            Number.isFinite(vec.y) &&
            Number.isFinite(vec.z);
    }

    _clearGeometryBuffer(geometry) {
        if (!geometry) return;
        if (geometry.getAttribute('position')) {
            geometry.deleteAttribute('position');
        }
        if (geometry.getIndex()) {
            geometry.setIndex(null);
        }
        geometry.setDrawRange(0, 0);
    }

    _writeVertexTriplet(baseVertexIndex, v1, v2, v3, v4) {
        const base = baseVertexIndex * 3;
        this._positionsBuffer[base] = v1.x;
        this._positionsBuffer[base + 1] = v1.y;
        this._positionsBuffer[base + 2] = v1.z;
        this._positionsBuffer[base + 3] = v2.x;
        this._positionsBuffer[base + 4] = v2.y;
        this._positionsBuffer[base + 5] = v2.z;
        this._positionsBuffer[base + 6] = v3.x;
        this._positionsBuffer[base + 7] = v3.y;
        this._positionsBuffer[base + 8] = v3.z;
        this._positionsBuffer[base + 9] = v4.x;
        this._positionsBuffer[base + 10] = v4.y;
        this._positionsBuffer[base + 11] = v4.z;
    }

    _writeQuadIndices(cursor, a, b, c, d, a2, b2, c2, d2) {
        this._indicesBuffer[cursor++] = a;
        this._indicesBuffer[cursor++] = b;
        this._indicesBuffer[cursor++] = c;
        this._indicesBuffer[cursor++] = b;
        this._indicesBuffer[cursor++] = d;
        this._indicesBuffer[cursor++] = c;
        this._indicesBuffer[cursor++] = a2;
        this._indicesBuffer[cursor++] = b2;
        this._indicesBuffer[cursor++] = c2;
        this._indicesBuffer[cursor++] = b2;
        this._indicesBuffer[cursor++] = d2;
        this._indicesBuffer[cursor++] = c2;
        return cursor;
    }

    /**
     * Dispose streaks (cleanup)
     * @private
     */
    dispose(streaks) {
        if (!streaks) return;

        if (this.gradientPolish && streaks.linkId) {
            this.gradientPolish.linkGradients.delete(streaks.linkId);
        }
        
        if (streaks.geometry) {
            streaks.geometry.dispose();
        }
        
        if (streaks.material) {
            streaks.material.dispose();
        }
        
        if (streaks.mesh && streaks.mesh.parent) {
            streaks.mesh.parent.remove(streaks.mesh);
        }
    }
}
