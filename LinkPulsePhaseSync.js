import * as THREE from 'three';

/**
 * LinkPulsePhaseSync
 * ============================================================================
 * Harmonic hub synchronization for directional energy stream pulse phases.
 * 
 * SYSTEM BEHAVIOR:
 * - Harmonic hubs (nodes with 3+ healthy links) synchronize pulse phases
 * - Connected links pulse in phase-locked rhythm
 * - Synchronization strength scales with harmony, synergy, and hub activation
 * - Corruption/instability cause phase desynchronization (beat patterns)
 * - Visual effect: coherent energy flow vs. chaotic interference
 * 
 * ARCHITECTURE:
 * - Per-hub pulse phase synchronization state
 * - Per-link phase offset from hub
 * - Smooth phase interpolation (no snapping)
 * - Zero per-frame allocations
 * 
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay logic changes
 * ✅ Safe material updates only
 * ✅ Zero per-frame allocations
 */
export class LinkPulsePhaseSync {
    constructor() {
        this.config = {
            // Synchronization strength
            baseStrength: 0.6,              // Base sync influence (0-1)
            harmonyBoost: 0.4,              // Harmony increases strength
            corruptionDamping: 0.8,         // Corruption reduces strength
            instabilityDamping: 0.6,        // Instability reduces strength
            synergyBoost: 0.3,              // Synergy increases strength
            
            // Phase interpolation
            phaseInterpolationRate: 0.12,   // Speed of phase adjustment (0-1)
            frequencyInterpolationRate: 0.08, // Speed of frequency adjustment
            
            // Phase offset per link direction
            outLinkPhaseOffset: 0.0,        // Output links phase offset
            inLinkPhaseOffset: Math.PI,     // Input links phase offset (opposite)
            
            // Beat pattern from desynchronization
            beatIntensity: 0.3,             // How strong beat patterns appear
            beatFrequency: 1.0,             // Oscillation frequency of beats
        };
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._hsl = {};
    }

    /**
     * Initialize pulse phase sync for a link connected to a hub
     * 
     * @param {THREE.Group} linkGroup - Link visual group
     * @param {Object} link - Link data
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {Object} hubController - NodeHarmonicSyncController (if part of hub)
     * @param {Object} collapseController - HarmonicHubCollapseController (if part of hub)
     */
    initializeForLink(linkGroup, link, sourceNode, targetNode, hubController = null, collapseController = null) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        
        const state = linkGroup.userData.conduitState;
        
        // Pulse sync state
        state.pulsePhaseSyncState = {
            hubController: hubController,
            collapseController: collapseController,
            sourceNode: sourceNode,
            targetNode: targetNode,
            currentPhaseOffset: 0.0,
            targetPhaseOffset: 0.0,
            currentFrequencyScale: 1.0,
            targetFrequencyScale: 1.0,
            beatAmplitude: 0.0,
            isHubSync: !!hubController,
            hasCollapseController: !!collapseController,
        };
    }

    /**
     * Update pulse phase synchronization for a link
     * Called every frame from LinkRendererConduit.update
     * 
     * @param {THREE.Group} linkGroup - Link visual group
     * @param {Object} pulseWaveInjector - The pulse wave injector system
     * @param {number} deltaTime - Frame delta
     * @param {number} synergy - Synergy level (0-1)
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} instability - Instability level (0-1)
     * @param {number} time - Current time
     */
    update(linkGroup, pulseWaveInjector, deltaTime, synergy = 0.5, harmony = 1.0, corruption = 0.0, instability = 0.0, time = 0) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        
        const state = linkGroup.userData.conduitState;
        const syncState = state.pulsePhaseSyncState;
        
        if (!syncState || !syncState.hubController) return; // Not part of a hub
        
        const hubController = syncState.hubController;
        
        // If hub is not active, gradually decouple
        if (!hubController.isActive) {
            this._decouplePhase(syncState, deltaTime);
            return;
        }
        
        // Compute synchronization strength
        const syncStrength = this._computeSyncStrength(
            harmony,
            corruption,
            instability,
            synergy,
            hubController
        );
        
        // === HARMONIC MODE PHASE OFFSET ===
        // Get the link's index in the hub's connected links array
        const linkIndex = hubController.connectedLinks.findIndex(cl => cl.link === state.link);
        const linkCount = hubController.connectedLinks.length;
        
        // Get phase offset from harmonic mode pattern
        const harmonicPhaseOffset = linkIndex >= 0 
            ? hubController.getHarmonicPhaseOffset(linkIndex, linkCount, time)
            : 0;
        
        // Determine phase offset based on link direction
        const directionOffset = syncState.sourceNode === hubController.node ? 0.0 : Math.PI;
        
        // Compute target phase offset with harmonic mode + desynchronization beat
        const beatModulation = this._computeBeatModulation(
            time,
            corruption,
            instability
        );
        
        syncState.targetPhaseOffset = directionOffset + harmonicPhaseOffset + beatModulation;
        syncState.targetFrequencyScale = 1.0 + (syncStrength * 0.3); // Subtle frequency lock
        syncState.harmonicMode = hubController.getHarmonicMode(linkCount);
        
        // Smooth phase interpolation
        syncState.currentPhaseOffset += (syncState.targetPhaseOffset - syncState.currentPhaseOffset) * 
                                        this.config.phaseInterpolationRate;
        
        syncState.currentFrequencyScale += (syncState.targetFrequencyScale - syncState.currentFrequencyScale) * 
                                           this.config.frequencyInterpolationRate;
        
        // Store for pulse injection
        syncState.syncStrength = syncStrength;
        syncState.beatAmplitude = Math.abs(beatModulation);
    }

    /**
     * Apply phase synchronization to injected pulses
     * Modulates pulse phase when injecting into synchronized links
     * 
     * @param {Array} pulseArray - Active pulses array from pulseWaves.activeWaves
     * @param {Object} linkGroup - Link visual group
     * @param {number} harmony - Harmony level
     * @returns {Array} Modified pulse array with phase adjustments
     */
    applySyncToPulses(pulseArray, linkGroup, harmony = 1.0) {
        if (!linkGroup || !linkGroup.userData.conduitState) return pulseArray;
        
        const state = linkGroup.userData.conduitState;
        const syncState = state.pulsePhaseSyncState;
        
        if (!syncState || !syncState.isHubSync || !pulseArray || pulseArray.length === 0) {
            return pulseArray;
        }
        
        // Apply phase offset to all pulses
        // This shifts pulse timing based on hub synchronization
        const phaseShift = syncState.currentPhaseOffset * (syncState.syncStrength || 0.5);
        
        for (const pulse of pulseArray) {
            // Shift pulse age by phase
            pulse.phaseSyncOffset = phaseShift;
            
            // Beat pattern creates intensity modulation
            if (syncState.beatAmplitude > 0.1) {
                pulse.beatModulation = Math.sin(pulse.age * Math.PI * 2 * this.config.beatFrequency) * 
                                      syncState.beatAmplitude * this.config.beatIntensity;
            }
        }
        
        return pulseArray;
    }

    /**
     * Get phase-adjusted pulse effect for streak rendering
     * Applies hub synchronization to visual effects
     * 
     * @param {Object} baseEffect - Base pulse effect from injector
     * @param {Object} linkGroup - Link visual group
     * @param {number} time - Current time
     * @returns {Object} Phase-adjusted effect
     */
    getPhaseAdjustedEffect(baseEffect, linkGroup, time = 0) {
        if (!baseEffect) return null;
        
        if (!linkGroup || !linkGroup.userData.conduitState) return baseEffect;
        
        const state = linkGroup.userData.conduitState;
        const syncState = state.pulsePhaseSyncState;
        
        if (!syncState || !syncState.isHubSync) {
            return baseEffect;
        }
        
        // Apply beat modulation to intensity
        const beatFactor = 1.0 + (syncState.beatAmplitude * 0.5); // -50% to +50%
        
        const adjustedEffect = {
            ...baseEffect,
            intensityBoost: baseEffect.intensityBoost * beatFactor,
            alphaBoost: baseEffect.alphaBoost * beatFactor,
            thicknessBoost: baseEffect.thicknessBoost * beatFactor,
            // Coherent saturation boost from sync
            saturation: baseEffect.saturation + (syncState.syncStrength * 0.2),
        };
        
        return adjustedEffect;
    }

    /**
     * Apply phase collapse effects from overload state
     * Modulates phase offsets and frequency when hub is collapsing
     * 
     * @param {Object} syncState - Sync state object
     * @param {number} linkIndex - Link index in hub
     * @param {number} linkCount - Total links in hub
     * @param {number} time - Current time
     */
    applyCollapseEffects(syncState, linkIndex, linkCount, time = 0) {
        if (!syncState || !syncState.collapseController) return;
        
        const collapseController = syncState.collapseController;
        const collapseEffect = collapseController.getPhaseCollapseEffect(linkIndex, linkCount, time);
        
        // Apply phase deviation (links drift away from hub phase)
        syncState.collapsePhaseDeviation = collapseEffect.phaseDeviation;
        syncState.collapsePhaseNoise = collapseEffect.phaseNoise;
        syncState.destabilization = collapseEffect.destabilization;
        
        // Reduce sync strength as collapse increases
        const syncReduction = collapseEffect.destabilization * 0.8;
        syncState.syncStrength = Math.max(0, (syncState.syncStrength || 0.5) * (1.0 - syncReduction));
        
        // Introduce frequency instability
        const frequencyJitter = collapseEffect.destabilization * 0.3;
        syncState.targetFrequencyScale += (Math.random() - 0.5) * frequencyJitter;
    }

    /**
     * Register a harmonic hub for a node
     * Called from NodeHarmonicManager when hub becomes active
     * 
     * @param {Object} node - Hub node
     * @param {Object} hubController - NodeHarmonicSyncController
     * @param {Object} collapseController - HarmonicHubCollapseController (optional)
     * @param {Array} connectedLinks - Links connected to hub
     */
    registerHubNode(node, hubController, collapseController = null, connectedLinks = []) {
        if (!node) return;
        
        // Store hub reference for all connected links
        for (const linkData of connectedLinks) {
            const link = linkData.link;
            if (!link || !link.group) continue;
            
            const state = link.group.userData.conduitState;
            if (state && state.pulsePhaseSyncState) {
                state.pulsePhaseSyncState.hubController = hubController;
                state.pulsePhaseSyncState.collapseController = collapseController;
                state.pulsePhaseSyncState.isHubSync = true;
                state.pulsePhaseSyncState.hasCollapseController = !!collapseController;
            }
        }
    }

    /**
     * Unregister a harmonic hub for a node
     * Called when hub deactivates
     * 
     * @param {Object} node - Former hub node
     * @param {Array} connectedLinks - Links that were connected
     */
    unregisterHubNode(node, connectedLinks = []) {
        if (!node) return;
        
        // Gradually decouple all connected links
        for (const linkData of connectedLinks) {
            const link = linkData.link;
            if (!link || !link.group) continue;
            
            const state = link.group.userData.conduitState;
            if (state && state.pulsePhaseSyncState) {
                // Mark for gradual decoupling (will happen over several frames)
                state.pulsePhaseSyncState.decoupleFactor = 0.0;
            }
        }
    }

    /**
     * Compute synchronization strength based on state
     * @private
     */
    _computeSyncStrength(harmony, corruption, instability, synergy, hubController) {
        if (!hubController || !hubController.isActive) return 0.0;
        
        // Base strength from hub controller
        let strength = this.config.baseStrength * hubController.hubStrength;
        
        // Harmony boost (max +40%)
        strength *= (1.0 + harmony * this.config.harmonyBoost);
        
        // Synergy boost (max +30%)
        strength *= (1.0 + synergy * this.config.synergyBoost);
        
        // Corruption damping (up to -80%)
        strength *= (1.0 - (corruption * this.config.corruptionDamping));
        
        // Instability damping (up to -60%)
        strength *= (1.0 - (instability * this.config.instabilityDamping));
        
        return Math.max(0.0, Math.min(1.0, strength));
    }

    /**
     * Compute beat pattern from desynchronization
     * Creates visual "wobble" when network is unstable
     * @private
     */
    _computeBeatModulation(time, corruption, instability) {
        if (corruption < 0.2 && instability < 0.3) return 0.0; // Below threshold
        
        // Desync amount increases with corruption/instability
        const desyncAmount = (corruption * 0.4) + (instability * 0.3);
        
        // Beat pattern: slow oscillation
        const beatPattern = Math.sin(time * Math.PI * 0.5) * desyncAmount * 0.5;
        
        // Add faster jitter for high instability
        const jitter = Math.sin(time * Math.PI * 3.0) * instability * 0.15;
        
        return beatPattern + jitter;
    }

    /**
     * Gradually decouple a link from hub sync
     * @private
     */
    _decouplePhase(syncState, deltaTime) {
        if (!syncState) return;
        
        // Smoothly return to neutral phase
        const decoupleRate = 0.05;
        syncState.currentPhaseOffset *= (1.0 - decoupleRate);
        syncState.currentFrequencyScale += (1.0 - syncState.currentFrequencyScale) * decoupleRate;
        syncState.beatAmplitude *= (1.0 - decoupleRate);
    }
}
