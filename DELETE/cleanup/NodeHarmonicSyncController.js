import * as THREE from 'three';

/**
 * NodeHarmonicSyncController
 * ============================================================================
 * Manages harmonic synchronization for multiple links connected to a node.
 * 
 * PHILOSOPHY:
 * Healthy nodes with multiple active links act as harmonic hubs that gently
 * synchronize the phase of connected links. This creates a visible "breathing"
 * network effect where energy flows coherently through hub nodes.
 * 
 * Synchronization strength depends on:
 * - Link count (more links = stronger effect)
 * - Average synergy (higher synergy = stronger sync)
 * - Harmony vs corruption balance
 * - Overall instability level
 * 
 * Links are never hard-locked to hub phase; they interpolate gradually,
 * creating smooth, organic phase alignment.
 */
export class NodeHarmonicSyncController {
    constructor(node) {
        this.node = node;
        this.connectedLinks = []; // Array of { link, direction }
        
        // Hub synchronization state
        this.hubPhase = 0;
        this.hubFrequency = 1.0;
        this.hubStrength = 0.0; // 0-1 range
        this.isActive = false; // True when sync conditions are met
        
        // Harmonic mode data
        this.currentLinkData = []; // Current link phase/frequency data
        
        // Configuration
        this.config = {
            // Hub activation conditions
            minLinksForHub: 3,              // Minimum connected links
            minAverageSynergy: 0.5,         // Minimum average synergy
            harmonyCorruptionRatio: 1.2,   // Harmony must be 1.2x corruption
            maxInstability: 0.4,             // Max instability for sync
            
            // Sync strength modifiers
            synergyStrengthScale: 0.4,      // How much synergy affects sync strength
            harmonyStrengthBoost: 0.3,      // Harmony boost to sync strength
            instabilityDamping: 0.5,        // How much instability reduces sync
            linkCountBoost: 0.1,            // Strength increase per link above minimum
            
            // Phase interpolation
            phaseInterpolationRate: 0.08,   // 0-1, higher = faster convergence
            frequencyInterpolationRate: 0.05, // Gentler frequency adjustment
        };
        
        // Temporal smoothing for hub properties
        this.targetHubPhase = 0;
        this.targetHubFrequency = 1.0;
        this.targetHubStrength = 0.0;
        
        // Math cache
        this._vec3 = new THREE.Vector3();
    }

    /**
     * Register a link as connected to this node
     */
    addConnectedLink(link, direction = 'in') {
        const existing = this.connectedLinks.find(cl => cl.link === link);
        if (!existing) {
            this.connectedLinks.push({ link, direction });
        }
    }

    /**
     * Unregister a link
     */
    removeConnectedLink(link) {
        this.connectedLinks = this.connectedLinks.filter(cl => cl.link !== link);
    }

    /**
     * Update hub synchronization state
     */
    update(harmony = 1.0, corruption = 0.0, instability = 0.0) {
        // Clamp inputs
        harmony = Math.max(0, Math.min(1, harmony));
        corruption = Math.max(0, Math.min(1, corruption));
        instability = Math.max(0, Math.min(1, instability));

        // Check hub activation conditions
        this.checkActivationConditions(harmony, corruption, instability);

        if (this.isActive) {
            // Collect link data and compute hub properties
            const linkData = this.collectLinkData();
            this.computeHubProperties(linkData, harmony, corruption, instability);
        } else {
            // Inactive hub decays to neutral state
            this.targetHubPhase = 0;
            this.targetHubFrequency = 1.0;
            this.targetHubStrength = 0.0;
        }

        // Smooth transitions to new hub state
        this.hubPhase = this.lerpPhase(this.hubPhase, this.targetHubPhase, this.config.phaseInterpolationRate);
        this.hubFrequency += (this.targetHubFrequency - this.hubFrequency) * this.config.frequencyInterpolationRate;
        this.hubStrength += (this.targetHubStrength - this.hubStrength) * 0.1;

        // Clamp values
        this.hubPhase = this.normalizePhase(this.hubPhase);
        this.hubFrequency = Math.max(0.5, Math.min(2.0, this.hubFrequency));
        this.hubStrength = Math.max(0.0, Math.min(1.0, this.hubStrength));
    }

    /**
     * Check if hub synchronization conditions are met
     */
    checkActivationConditions(harmony, corruption, instability) {
        // Must have minimum number of links
        if (this.connectedLinks.length < this.config.minLinksForHub) {
            this.isActive = false;
            return;
        }

        // Harmony must outweigh corruption
        if (harmony < corruption * this.config.harmonyCorruptionRatio) {
            this.isActive = false;
            return;
        }

        // Instability must be low
        if (instability > this.config.maxInstability) {
            this.isActive = false;
            return;
        }

        // Collect average synergy
        const linkData = this.collectLinkData();
        if (linkData.length === 0) {
            this.isActive = false;
            return;
        }

        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        
        // Average synergy must meet threshold
        if (avgSynergy < this.config.minAverageSynergy) {
            this.isActive = false;
            return;
        }

        // All conditions met
        this.isActive = true;
    }

    /**
     * Collect synergy data from all connected links
     */
    collectLinkData() {
        const data = this.connectedLinks
            .map(cl => {
                const link = cl.link;
                const state = link.group?.userData?.conduitState;
                if (!state) return null;

                const adapter = state.visualStateAdapter;
                const visualState = adapter ? adapter.getVisualState() : {};
                
                const synergyPhase = visualState.synergyPhase || 0;
                const synergyLevel = visualState.synergyLevel ?? 0.5;
                const frequency = 1.0 + synergyLevel * 0.5; // Frequency 1.0-1.5

                return {
                    link: link,
                    phase: synergyPhase,
                    frequency: frequency,
                    synergy: synergyLevel,
                    adapter: adapter,
                };
            })
            .filter(d => d !== null);

        return data;
    }

    /**
     * Compute hub properties from connected links
     */
    computeHubProperties(linkData, harmony, corruption, instability) {
        if (linkData.length === 0) {
            this.isActive = false;
            return;
        }

        // === 1. COMPUTE HUB PHASE (Circular Mean) ===
        let sinSum = 0, cosSum = 0;
        linkData.forEach(d => {
            sinSum += Math.sin(d.phase);
            cosSum += Math.cos(d.phase);
        });
        sinSum /= linkData.length;
        cosSum /= linkData.length;
        
        this.targetHubPhase = Math.atan2(sinSum, cosSum);

        // === 2. COMPUTE HUB FREQUENCY (Weighted by Synergy) ===
        let freqSum = 0, synergySum = 0;
        linkData.forEach(d => {
            freqSum += d.frequency * d.synergy;
            synergySum += d.synergy;
        });
        this.targetHubFrequency = synergySum > 0 ? freqSum / synergySum : 1.0;

        // === 3. COMPUTE HUB STRENGTH ===
        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        
        // Base strength from synergy
        let strength = avgSynergy * this.config.synergyStrengthScale;
        
        // Harmony boost
        strength += harmony * this.config.harmonyStrengthBoost;
        
        // Instability damping
        strength *= (1.0 - instability * this.config.instabilityDamping);
        
        // Link count boost (more links = stronger hub)
        const extraLinks = Math.max(0, linkData.length - this.config.minLinksForHub);
        strength += extraLinks * this.config.linkCountBoost;
        
        // Clamp and store
        this.targetHubStrength = Math.max(0, Math.min(1.0, strength));
        
        // === 4. STORE LINK DATA FOR HARMONIC MODES ===
        this.currentLinkData = linkData;
    }

    /**
     * Get harmonic mode based on number of active links
     * Deterministic pattern that creates coherent visual rhythms
     * 
     * @param {number} linkCount - Number of active connected links
     * @returns {string} One of: 'mirrored', 'standing-wave', 'orbital'
     */
    getHarmonicMode(linkCount) {
        if (linkCount <= 2) return 'mirrored';     // Push-pull oscillation
        if (linkCount <= 4) return 'standing-wave'; // 120° offsets (3-4 links)
        return 'orbital';                           // Slow rotation around hub phase
    }

    /**
     * Compute phase offset for a link based on harmonic mode
     * 
     * @param {number} linkIndex - Index of the link in connected links array
     * @param {number} linkCount - Total number of active connected links
     * @param {number} time - Current time (for orbital mode)
     * @returns {number} Phase offset in radians
     */
    getHarmonicPhaseOffset(linkIndex, linkCount, time = 0) {
        const mode = this.getHarmonicMode(linkCount);
        
        if (mode === 'mirrored') {
            // 2 links: alternate between 0 and π (push-pull)
            return linkIndex % 2 === 0 ? 0 : Math.PI;
        }
        
        if (mode === 'standing-wave') {
            // 3-4 links: 120° spacing (standing wave pattern)
            // Links spread around circle in 120° increments
            const angleStep = (Math.PI * 2) / Math.max(3, linkCount);
            return linkIndex * angleStep;
        }
        
        // orbital mode: slow orbital rotation around hub phase
        // Links orbit around hubPhase with gentle motion
        const orbitSpeed = 0.3; // Radians per second
        const orbitRadius = Math.PI * 0.5; // Orbit radius (half circle)
        const angleStep = (Math.PI * 2) / Math.max(5, linkCount);
        const baseAngle = linkIndex * angleStep;
        
        // Orbital motion: phase drifts around hub
        const orbitPhase = time * orbitSpeed + baseAngle;
        return orbitRadius * Math.sin(orbitPhase);
    }

    /**
     * Get synchronization feedback for a link
     */
    getSyncFeedback(linkIndex = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, 0);
        
        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
        };
    }
    
    /**
     * Get synchronization feedback with time-dependent harmonic mode
     */
    getSyncFeedbackWithTime(linkIndex = 0, time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, time);
        
        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
            time: time,
        };
    }

    /**
     * Get debugging info
     */
    getDebugInfo(time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        
        // Get phase offsets for all links in current harmonic mode
        const phaseOffsets = [];
        for (let i = 0; i < linkCount; i++) {
            phaseOffsets.push(this.getHarmonicPhaseOffset(i, linkCount, time));
        }
        
        return {
            nodeId: this.node.id || 'unknown',
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffsets: phaseOffsets,
            hubPhase: this.hubPhase,
            hubFrequency: this.hubFrequency,
            hubStrength: this.hubStrength,
        };
    }

    /**
     * Utility: Linear interpolation for circular phase
     */
    lerpPhase(current, target, t) {
        // Handle phase wrap-around
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        return current + diff * t;
    }

    /**
     * Utility: Normalize phase to -π to π range
     */
    normalizePhase(phase) {
        while (phase > Math.PI) phase -= Math.PI * 2;
        while (phase < -Math.PI) phase += Math.PI * 2;
        return phase;
    }

    /**
     * Set configuration
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Dispose
     */
    dispose() {
        this.connectedLinks = [];
    }
}
