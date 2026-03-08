import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkPulseWaveInjector } from './LinkPulseWaveInjector.js';
import { LinkPulsePhaseSync } from './LinkPulsePhaseSync.js';
import LinkStreakColorDynamics from './LinkStreakColorDynamics_Session115.js';

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
            streakWidthBase: 0.05,      // Thicker ribbon for reliable readability
            streakLengthMin: 0.12,      // Min visible length on curve (0-1)
            streakLengthMax: 0.35,      // Max visible length on curve (0-1)
            streakCountMin: 3,          // Min active streaks
            streakCountMax: 7,          // Max active streaks
            speedBaseMin: 0.6,          // Synergy multiplier range (min)
            speedBaseMax: 1.6,          // Synergy multiplier range (max)
            segmentsPerStreak: 12,      // Ribbon resolution (low for perf)
            harmonyBoost: 0.15,         // Emissive intensity from harmony
            corruptionDesaturation: 0.4, // Color desaturation from corruption
            instabilityDampen: 0.7,     // Opacity scaling from instability
            activationThreshold: 2,     // Min active links for streak visibility (was 3, now 2)
        };
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._vec3_2 = new THREE.Vector3();
        this._color = new THREE.Color();
        this._hsl = {};
        
        // Pulse wave injection system
        this.pulseInjector = new LinkPulseWaveInjector();
        
        // Color dynamics system (NEW - Session 115)
        this.colorDynamics = new LinkStreakColorDynamics({
            enabled: true,
            debugMode: false
        });
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
            depthWrite: true,
            depthTest: true,
            side: THREE.DoubleSide,
            fog: false
        });
        
        // Create geometry once (buffered, reused)
        const geometry = new THREE.BufferGeometry();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const directionalOrder = VisualHierarchyRegistry.getRenderOrder('LINK_DIRECTIONAL');
        mesh.renderOrder = directionalOrder;
        linkGroup.add(mesh);
        
        // Streak state arrays (allocated once, reused)
        const baseStreakCount = this.config.streakCountMax;
        const streaks = {
            mesh: mesh,
            material: material,
            geometry: geometry,
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
            streaks.offsets[i] = ((i / baseStreakCount) + (rng01 * 0.18)) % 1.0; // Distributed coverage along the full link
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
     * @param {number} specialization - Link specialization bias (-1 to +1, optional) for color dynamics
     */
    update(linkGroup, curve, deltaTime, synergy = 0.5, harmony = 1.0, corruption = 0.0, instability = 0.0, baseColor = null, targetColor = null, link = null, time = 0, specialization = 0) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        if (!curve) return; // Defensive: no curve, skip
        
        const state = linkGroup.userData.conduitState;
        const streaks = state.directionalStreaks;
        
        if (!streaks || !streaks.ages || !streaks.geometry || !streaks.material) return; // Not initialized or arrays not ready
        
        const frameSegments = state.strandSegments || Math.max(20, Math.floor((curve.getLength?.() || 10) * 8));
        const frames = curve.computeFrenetFrames(frameSegments, false);
        
        // Store link reference for pulse injection
        if (link) {
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
        
        // Synergy controls speed and count
        const synergyVisual = Math.max(0.7, synergy);
        const speedMultiplier = this.config.speedBaseMin + (synergyVisual * (this.config.speedBaseMax - this.config.speedBaseMin));
        const activeStreakCount = Math.ceil(this.config.streakCountMin + (synergyVisual * (this.config.streakCountMax - this.config.streakCountMin)));
        
        // Harmony controls length and brightness
        const baseLength =
            this.config.streakLengthMin +
            (harmony * (this.config.streakLengthMax - this.config.streakLengthMin));

        const lengthScale = THREE.MathUtils.clamp(baseLength, 0.12, 0.22);// Cap streak span to prevent visual detachment
        const harmonyBrightness = 0.6 + (harmony * this.config.harmonyBoost);
        
        // Corruption adds phase jitter but not speed randomness
        const jitterAmount = corruption * 0.15; // Subtle lateral jitter
        const desaturation = corruption * this.config.corruptionDesaturation;
        
        // Instability effects - DISABLED per user request
        // Opacity multipliers and suppressed flags removed
        const instabilityFactor = 1.0; // Full lifetime (no shortening)
        const suppressionThreshold = 0; // No suppression
        
        // --- UPDATE EACH STREAK ---
        const positions = [];
        const indices = [];
        let vertexCursor = 0;
        const corridorRadius = this._computeCorridorRadius(state);
        const maxCenterStep = Math.max(0.6, corridorRadius * 3.0);
        const maxEdgeStep = Math.max(0.8, corridorRadius * 3.5);
        
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
            streaks.speeds[i] = speedMultiplier * 0.8; // 0.8 is base speed factor
            
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
            const streakStart = Math.max(0, streaks.offsets[i] - lengthScale);
            const streakEnd = Math.min(1.0, streaks.offsets[i] + lengthScale);
            
            const segmentsInStreak = Math.max(
            6,
            Math.floor(this.config.segmentsPerStreak * (streakEnd - streakStart))
            );
            
            let previousPairStart = -1;
            let previousCenter = null;
            let previousTop = null;
            let previousBottom = null;
            
            for (let j = 0; j <= segmentsInStreak; j++) {
                const t = streakStart + ((j / segmentsInStreak) * (streakEnd - streakStart));
                
                // Sample curve point
                const pointOnCurve = curve.getPointAt(Math.max(0, Math.min(1, t)));
                if (!this._isFiniteVector(pointOnCurve)) {
                    previousPairStart = -1;
                    previousCenter = null;
                    previousTop = null;
                    previousBottom = null;
                    continue;
                }
                
                const idx = Math.min(frameSegments, Math.max(0, Math.round(t * frameSegments)));

                // Tangent for orientation (approximate via nearby points)
                const tangent = this._sampleCurveTangent(curve, t, frames.tangents?.[idx]);
                if (!this._isFiniteVector(tangent)) {
                    previousPairStart = -1;
                    previousCenter = null;
                    previousTop = null;
                    previousBottom = null;
                    continue;
                }
                
                // Create ribbon width variation (thinner at edges, thicker in middle)
                const ribbonProgress = j / segmentsInStreak;
                let widthFactor = Math.pow(Math.sin(ribbonProgress * Math.PI), 1.6);
                widthFactor = Math.max(0.35, widthFactor); // Never too thin, but narrower
                
                // Keep streak centered on the main spline, but require a stable width axis.
                const perpendicular = this._getStableRibbonNormal(frames, idx, tangent);
                if (!perpendicular) {
                    previousPairStart = -1;
                    previousCenter = null;
                    previousTop = null;
                    previousBottom = null;
                    continue;
                }
                
                // --- PULSE WAVE EFFECTS ---
                // Check if any pulse waves affect this streak position
                const pulseEffect = this.pulseInjector.getStreakPulseEffect(
                    t,  // Position on curve (0-1)
                    pulseEffectData?.positions || [],
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
        const v1 = this._clampVertexToCorridor(
            pointOnCurve.clone().addScaledVector(perpendicular, ribbonWidth * 0.5),
            pointOnCurve,
            corridorRadius
        );
        
        // --- GUARD: Skip invalid v1 vertices ---
        if (!Number.isFinite(v1.x) || !Number.isFinite(v1.y) || !Number.isFinite(v1.z)) {
            continue;
        }
        
        // Bottom edge
        const v2 = this._clampVertexToCorridor(
            pointOnCurve.clone().addScaledVector(perpendicular, -ribbonWidth * 0.5),
            pointOnCurve,
            corridorRadius
        );
        
        // --- GUARD: Skip invalid v2 vertices ---
        if (!Number.isFinite(v2.x) || !Number.isFinite(v2.y) || !Number.isFinite(v2.z)) {
            continue;
        }
        
        const pairStart = vertexCursor;
        positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        vertexCursor += 2;

        if (
            previousPairStart >= 0 &&
            previousCenter &&
            previousTop &&
            previousBottom &&
            pointOnCurve.distanceTo(previousCenter) <= maxCenterStep &&
            v1.distanceTo(previousTop) <= maxEdgeStep &&
            v2.distanceTo(previousBottom) <= maxEdgeStep
        ) {
            const a = previousPairStart;
            const b = previousPairStart + 1;
            const c = pairStart;
            const d = pairStart + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }

        previousPairStart = pairStart;
        previousCenter = pointOnCurve.clone();
        previousTop = v1.clone();
        previousBottom = v2.clone();
        }
        }
        
        // --- UPDATE GEOMETRY BUFFER ---
        this._updateGeometryBuffer(streaks, positions, indices, activeStreakCount, harmony, corruption, desaturation, baseColor, targetColor, pulseEffectData, synergy, specialization);
        
        // --- UPDATE MATERIAL WITH PULSE EFFECTS ---
        if (streaks.material) {
            let baseBrightness = harmonyBrightness;
            let baseOpacity = 0.92 * (1.0 - (instability * 0.15));

            // Apply pulse effects to material
            if (pulseEffectData && pulseEffectData.hasPulse) {
                baseBrightness += pulseEffectData.intensityBoost;
                baseOpacity *= pulseEffectData.alphaBoost;
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
    _sampleCurveTangent(curve, t, fallbackTangent = null) {
        const delta = 0.001;
        const p1 = curve.getPointAt(Math.max(0, t - delta));
        const p2 = curve.getPointAt(Math.min(1, t + delta));
        const tangent = p2.clone().sub(p1);
        if (tangent.lengthSq() > 1e-8) {
            return tangent.normalize();
        }
        if (fallbackTangent && this._isFiniteVector(fallbackTangent) && fallbackTangent.lengthSq() > 1e-8) {
            return fallbackTangent.clone().normalize();
        }
        return null;
    }

    /**
     * Update geometry buffer in-place (no allocations)
     * Applies color dynamics based on harmony and specialization
     * @private
     */
    _updateGeometryBuffer(streaks, vertices, indices, activeStreakCount, harmony, corruption, desaturation, baseColor, targetColor, pulseEffectData = null, synergy = 0.5, specialization = 0) {
        if (!streaks || !streaks.geometry || !Array.isArray(vertices) || !Array.isArray(indices)) return;
        if (vertices.length === 0 || indices.length === 0) {
            this._clearGeometryBuffer(streaks.geometry);
            return;
        }

        // Log vertex count for debugging (throttled)
        if (typeof window !== 'undefined') {
            this._vertexLogTime = this._vertexLogTime || 0;
            this._vertexLogTime = this._vertexLogTime || 0;
            this._vertexLogTime++;
            if (this._vertexLogTime % 60 === 0) { // Every ~1 second at 60fps
                console.log('[DirectionalStreaks] Vertices:', vertices.length, 'activeStreaks:', activeStreakCount);
            }
        }

        // Convert vertices array to Float32Array
        const positions = new Float32Array(vertices.length);
        for (let i = 0; i < vertices.length; i++) {
            positions[i] = vertices[i];
        }

        // Remove old buffer if exists
        if (streaks.geometry.getAttribute('position')) {
            streaks.geometry.deleteAttribute('position');
        }

        // Add position buffer
        streaks.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Remove old indices if exist
        if (streaks.geometry.getIndex()) {
            streaks.geometry.setIndex(null);
        }

        // Add index buffer
        if (indices.length > 0) {
            streaks.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        }
        streaks.geometry.computeBoundingSphere();
        streaks.geometry.computeBoundingBox();

        // Update material color with state (ENHANCED: Session 115 color dynamics)
        if (streaks.material) {
            if (!streaks?.material?.color || !streaks?.material?.emissive) return;
            let color = (baseColor && baseColor.isColor) ? baseColor.clone() : new THREE.Color(0x00ff88);

            // Lerp toward target if provided
            if (targetColor && targetColor.isColor) {
                color.lerp(targetColor, 0.3);
            }

            // === NEW (Session 115): Apply color dynamics based on harmony + specialization ===
            // This computes dynamic colors considering:
            // - Harmony: brightness and saturation
            // - Specialization: hue shifts (warm for excitatory, cool for inhibitory)
            // - Corruption: desaturation and color noise
            // - Synergy: intensity modulation
            const dynamicColor = this.colorDynamics.computeStreakColor(
                color,
                harmony,           // 0-1
                specialization,    // -1 to +1
                corruption,        // 0-1
                synergy            // 0-1
            );
            color.copy(dynamicColor);

            // Apply pulse saturation boost (on top of color dynamics)
            if (pulseEffectData && pulseEffectData.hasPulse && pulseEffectData.saturation > 0) {
                color.getHSL(this._hsl);
                this._hsl.s = Math.min(1.0, this._hsl.s + pulseEffectData.saturation);
                color.setHSL(this._hsl.h, this._hsl.s, this._hsl.l);
            }

            streaks.material.color.copy(color);
            streaks.material.emissive.copy(color);
        }
    }

    _computeCorridorRadius(state) {
        const activeRadius = Number.isFinite(state?.activeRadius) ? state.activeRadius : 0.12;
        return THREE.MathUtils.clamp((activeRadius * 2.25) + 0.08, 0.18, 0.55);
    }

    _getStableRibbonNormal(frames, idx, tangent) {
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

            const axis = candidate.clone().addScaledVector(tangent, -candidate.dot(tangent));
            if (axis.lengthSq() > 1e-8) {
                return axis.normalize();
            }
        }

        const fallbackUp = Math.abs(tangent.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const axis = fallbackUp.addScaledVector(tangent, -fallbackUp.dot(tangent));
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
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
    }

    /**
     * Dispose streaks (cleanup)
     * @private
     */
    dispose(streaks) {
        if (!streaks) return;
        
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
