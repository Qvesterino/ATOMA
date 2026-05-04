import * as THREE from 'three';
import { LinkPulsePhaseSync } from './LinkPulsePhaseSync.js';
import { LinkCascadePulseManager } from './LinkCascadePulseManager.js';

/**
 * LinkPulseWaveInjector
 * ============================================================================
 * Node-driven pulse waves that propagate through directional energy streaks.
 * 
 * SYSTEM BEHAVIOR:
 * - Nodes periodically emit energy pulses
 * - Pulses travel along all connected links from source to target
 * - Visual effects: brightness, thickness, color saturation boosts
 * - Fully deterministic (no randomness in emission)
 * - Zero gameplay impact
 * 
 * ARCHITECTURE:
 * - Per-node pulse tracking (age, phase, emission interval)
 * - Per-link pulse state (current position, influence)
 * - Visual effect multipliers applied to streak rendering
 * - All state cached in link conduit userData
 * 
 * CONSTRAINTS:
 * ✅ No per-frame allocations
 * ✅ Read-only from node/link state
 * ✅ Safe material updates only (emissiveIntensity, color HSL)
 * ✅ Graceful fallback if data missing
 */
export class LinkPulseWaveInjector {
    constructor() {
        // Pulse phase sync system
        this.phaseSync = new LinkPulsePhaseSync();
        
        // Cascade pulse propagation system
        this.cascadeManager = new LinkCascadePulseManager();
        
        this.config = {
            // Pulse timing
            pulseIntervalBase: 2.0,         // Base seconds between pulses
            pulseDurationBase: 0.8,         // Pulse wave duration (seconds)
            
            // Pulse motion
            pulseSpeedBase: 2.0,            // Units per second base speed
            pulseTaperWidth: 0.15,          // Pulse width as fraction of link length
            
            // Visual effects
            intensityAmplification: 1.5,    // Emissive intensity multiplier when pulse hits
            thicknessAmplification: 1.3,    // Streak width multiplier at peak
            colorSaturation: 0.3,           // Additional saturation during pulse
            alphaBoost: 0.4,                // Alpha multiplier boost
            
            // State modulation
            synergySpeedMultiplier: 2.0,    // Max speed boost from synergy
            harmonyWidth: 1.2,              // Width boost from harmony
            corruptionPhaseShift: 0.3,      // Phase wobble from corruption
            stabilityAmplitude: 0.6,      // Amplitude damping from stability
        };
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._hsl = {};
    }

    /**
     * Initialize pulse tracking for a link
     * Called once per link
     * 
     * @param {THREE.Group} linkGroup - Link visual group
     * @param {Object} link - Link data object
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {Object} hubController - Harmonic hub controller (if any)
     */
    initializePulseTracking(linkGroup, link, sourceNode = null, targetNode = null, hubController = null) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        
        const state = linkGroup.userData.conduitState;
        state.link = link;
        
        // Per-link pulse state
        state.pulseWaves = state.pulseWaves || {
            activeWaves: [],  // Array of { age, duration, strength, phase }
        };
        
        // Per-node pulse emission state (keyed by node id)
        // Will be populated as pulses are injected
        state.pulseEmitters = state.pulseEmitters || {};
        
        // Initialize pulse phase sync for harmonic hubs
        if (sourceNode && targetNode) {
            this.phaseSync.initializeForLink(linkGroup, link, sourceNode, targetNode, hubController);
        }
    }

    /**
     * Inject a pulse wave from a source node into all connected links
     * Called when a node should emit a pulse
     * 
     * @param {Object} sourceNode - Source node
     * @param {Array} connectedLinks - Links connected to this node
     * @param {number} time - Current time (for deterministic phasing)
     * @param {Object} hubController - Hub controller if node is harmonic hub
     * @param {Map} nodeControllers - All node controllers (for cascade)
     */
    injectNodePulse(sourceNode, connectedLinks, time = 0, hubController = null, nodeControllers = null) {
        if (!sourceNode || !connectedLinks || connectedLinks.length === 0) return;
        
        // Extract node energy/activity (read-only, safe fallbacks)
        const nodeEnergy = sourceNode.energy ?? sourceNode.activityLevel ?? sourceNode.synergy ?? 0.5;
        const pulseDuration = this.config.pulseDurationBase * (0.8 + nodeEnergy * 0.4); // Scale with energy
        
        // Emit cascade pulse if source is a harmonic hub
        if (hubController && hubController.isActive && nodeControllers) {
            this.cascadeManager.emitCascadePulse(
                sourceNode,
                hubController,
                nodeControllers,
                time
            );
        }
        
        // Inject into each connected link
        for (const link of connectedLinks) {
            if (!link.group || !link.group.userData.conduitState) continue;
            
            const state = link.group.userData.conduitState;
            
            // Ensure pulse wave array exists
            if (!state.pulseWaves) {
                state.pulseWaves = { activeWaves: [] };
            }
            
            // Create new pulse wave
            const pulseWave = {
                age: 0,
                duration: pulseDuration,
                nodeEnergy: nodeEnergy,
                sourceIsOrigin: link.source === sourceNode, // Direction check
                injectionTime: time,
            };
            
            state.pulseWaves.activeWaves.push(pulseWave);
        }
    }

    /**
     * Update all active pulses for a link
     * Called every frame from LinkRendererConduit.update
     * 
     * @param {THREE.Group} linkGroup - Link visual group
     * @param {THREE.QuadraticBezierCurve3} curve - Link curve
     * @param {number} deltaTime - Frame delta
     * @param {number} synergy - Synergy level (0-1)
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} stability - Stability level (0-1)
     * @param {number} time - Current time
     * @returns {Object} Pulse effect data for visual application
     */
    update(linkGroup, curve, deltaTime, synergy = 0.5, harmony = 1.0, corruption = 0.0, stability = 0.0, time = 0) {
        if (!linkGroup || !linkGroup.userData.conduitState || !curve) return null;
        
        const state = linkGroup.userData.conduitState;
        const pulseWaves = state.pulseWaves;
        
        if (!pulseWaves || !pulseWaves.activeWaves) return null;
        
        // Update all active pulse waves
        const activePulses = [];
        
        for (let i = pulseWaves.activeWaves.length - 1; i >= 0; i--) {
            const pulse = pulseWaves.activeWaves[i];
            pulse.age += deltaTime;
            
            // Remove expired pulses
            if (pulse.age >= pulse.duration) {
                pulseWaves.activeWaves.splice(i, 1);
                continue;
            }
            
            activePulses.push(pulse);
        }
        
        // Compute aggregate pulse effect
        let baseEffect = null;
        if (activePulses.length > 0) {
            baseEffect = this._computePulseEffect(
                activePulses,
                curve,
                synergy,
                harmony,
                corruption,
                stability
            );
        }
        
        return baseEffect;
    }
    
    /**
     * Update cascade pulse propagation
     * Called from scene update loop after all pulses updated
     * 
     * @param {number} deltaTime - Frame delta
     * @param {number} time - Current time
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} stability - Stability level (0-1)
     * @param {number} synergy - Synergy level (0-1)
     * @param {Map} nodeControllers - All node controllers
     * @param {Array} links - All link objects
     */
    updateCascadePropagation(deltaTime, time, harmony = 1.0, corruption = 0.0, stability = 0.0, synergy = 0.5, nodeControllers = null, links = []) {
        this.cascadeManager.update(
            deltaTime,
            time,
            harmony,
            corruption,
            stability,
            synergy,
            nodeControllers,
            links
        );
    }
    
    /**
     * Build hub network for cascade propagation
     * Called when hubs change
     * 
     * @param {Map} nodeControllers - All node controllers
     */
    buildCascadeNetwork(nodeControllers) {
        this.cascadeManager.buildHubNetwork(nodeControllers);
    }
    
    /**
     * Register link for cascade state tracking
     * 
     * @param {Object} link - Link object
     */
    registerLinkForCascade(link) {
        this.cascadeManager.registerLinkForCascade(link);
    }
    
    /**
     * Unregister link from cascade tracking
     * 
     * @param {Object} link - Link object
     */
    unregisterLinkForCascade(link) {
        this.cascadeManager.unregisterLinkForCascade(link);
    }

    /**
     * Compute visual effect multipliers from all active pulses
     * @private
     */
    _computePulseEffect(activePulses, curve, synergy, harmony, corruption, stability) {
        if (!activePulses || activePulses.length === 0) return null;
        
        // Pulse speed scales with synergy
        const speedMultiplier = 1.0 + (synergy * this.config.synergySpeedMultiplier);
        
        // Accumulate effects from all active pulses
        let maxIntensityBoost = 0;
        let maxThicknessBoost = 0;
        let maxAlphaBoost = 0;
        let maxSaturation = 0;
        let pulsePositionInfluence = [];
        
        for (const pulse of activePulses) {
            const phase = pulse.age / pulse.duration;
            
            // Pulse travels along curve
            const pulsePosition = this._computePulsePosition(
                phase,
                pulse.sourceIsOrigin,
                speedMultiplier
            );
            
            // Compute influence falloff (Gaussian around pulse position)
            // Position is normalized (0-1 along curve)
            const peakInfluence = this._computePulseInfluence(
                phase,
                pulse.nodeEnergy,
                harmony,
                corruption,
                stability
            );
            
            pulsePositionInfluence.push({
                position: pulsePosition,
                influence: peakInfluence,
                saturation: pulse.nodeEnergy * this.config.colorSaturation,
            });
            
            // Track max effects
            maxIntensityBoost = Math.max(maxIntensityBoost, peakInfluence * this.config.intensityAmplification);
            maxThicknessBoost = Math.max(maxThicknessBoost, peakInfluence * this.config.thicknessAmplification);
            maxAlphaBoost = Math.max(maxAlphaBoost, peakInfluence * this.config.alphaBoost);
            maxSaturation = Math.max(maxSaturation, pulse.nodeEnergy * this.config.colorSaturation);
        }
        
        return {
            intensityBoost: maxIntensityBoost,
            thicknessBoost: maxThicknessBoost,
            alphaBoost: maxAlphaBoost,
            saturation: maxSaturation,
            positions: pulsePositionInfluence, // For streak-level effects
            hasPulse: activePulses.length > 0,
        };
    }

    /**
     * Compute normalized position (0-1) of pulse along curve
     * @private
     */
    _computePulsePosition(phase, sourceIsOrigin, speedMultiplier) {
        // Pulse travels from 0 (source) to 1 (target) with wraparound
        let position = phase * speedMultiplier;
        
        // Clamp to 0-1 range (pulse can exceed curve length)
        position = position % 1.0;
        
        if (!sourceIsOrigin) {
            // Pulse travels backward (from target to source)
            position = 1.0 - position;
        }
        
        return Math.max(0, Math.min(1, position));
    }

    /**
     * Compute pulse influence (amplitude) based on state
     * @private
     */
    _computePulseInfluence(phase, nodeEnergy, harmony, corruption, stability) {
        // Bell curve over pulse lifetime
        const bellCurve = Math.sin(phase * Math.PI); // 0 → 1 → 0
        
        // Base influence from node energy
        let influence = nodeEnergy * bellCurve;
        
        // Harmony smooths and widens pulse
        influence *= (0.8 + harmony * 0.4);
        
        // Corruption causes phase wobble (mild amplitude variation)
        const corruptionWobble = 1.0 + Math.sin(phase * Math.PI * 3 + corruption * 5) * corruption * this.config.corruptionPhaseShift;
        influence *= corruptionWobble;
        
        // Stability attenuates amplitude
        influence *= (1.0 - (stability * this.config.stabilityAmplitude));
        
        return Math.max(0, influence);
    }

    /**
     * Get pulse effect at specific position along link
     * For streak-level pulse intersection detection
     * 
     * @param {number} streakPosition - Normalized position on link (0-1)
     * @param {Array} pulsePositions - Pulse position influence array
     * @param {number} harmony - Harmony level
     * @param {THREE.Group} linkGroup - Link visual group (for phase sync)
     * @param {number} time - Current time
     * @param {Object} link - Link object (for cascade effects)
     * @returns {Object} Effect multipliers for this position
     */
    getStreakPulseEffect(streakPosition, pulsePositions, harmony = 1.0, linkGroup = null, time = 0, link = null) {
        if (!pulsePositions || pulsePositions.length === 0) {
            return { intensity: 1.0, thickness: 1.0, alpha: 1.0, saturation: 0 };
        }
        
        const taperWidth = this.config.pulseTaperWidth * (0.7 + harmony * 0.5); // Harmony widens pulse
        let maxIntensity = 0;
        let maxThickness = 0;
        let saturation = 0;
        
        for (const pulse of pulsePositions) {
            // Gaussian falloff from pulse position
            const distance = Math.abs(streakPosition - pulse.position);
            const falloff = Math.exp(-Math.pow(distance / taperWidth, 2) * 3.0);
            
            const effect = pulse.influence * falloff;
            
            maxIntensity = Math.max(maxIntensity, effect * this.config.intensityAmplification);
            maxThickness = Math.max(maxThickness, effect * this.config.thicknessAmplification);
            saturation = Math.max(saturation, pulse.saturation);
        }
        
        let effect = {
            intensity: 1.0 + maxIntensity,
            thickness: 1.0 + (maxThickness - 1.0) * 0.5, // Subtle thickness boost
            alpha: 1.0 + maxIntensity * 0.3,
            saturation: saturation,
        };
        
        // Apply harmonic hub phase synchronization if present
        if (linkGroup && this.phaseSync.hasRuntimeWork(linkGroup)) {
            effect = this.phaseSync.getPhaseAdjustedEffect(effect, linkGroup, time) || effect;
        }
        
        // Apply cascade pulse effects if link has active cascades
        if (link) {
            const cascadeEffect = this.cascadeManager.getLinkCascadeEffect(link, time);
            if (cascadeEffect.cascadeActive) {
                effect = {
                    intensity: effect.intensity * cascadeEffect.intensity,
                    thickness: effect.thickness * cascadeEffect.thickness,
                    alpha: effect.alpha * cascadeEffect.alpha,
                    saturation: effect.saturation + cascadeEffect.saturation,
                };
            }
        }
        
        return effect;
    }

    /**
     * Clear all pulses for a link (cleanup)
     * @private
     */
    clearPulses(linkGroup) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        const state = linkGroup.userData.conduitState;
        if (state.pulseWaves) {
            state.pulseWaves.activeWaves = [];
        }
    }
}
