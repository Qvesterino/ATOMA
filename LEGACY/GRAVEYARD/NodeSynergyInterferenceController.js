import * as THREE from 'three';

/**
 * NodeSynergyInterferenceController
 * ============================================================================
 * Manages synergy wave interference at a node where multiple links connect.
 * 
 * PHILOSOPHY:
 * Links connected to the same node create harmonic interference patterns.
 * Constructive interference (low phase variance) creates synchronized, energized visuals.
 * Destructive interference (high phase variance) creates dampened, scattered visuals.
 * 
 * The controller is purely visual—no gameplay logic coupling.
 * 
 * PHYSICS METAPHOR:
 * - Each link carries a synergy "wave" with phase, frequency, amplitude
 * - At the node junction, these waves interact
 * - The resulting interference affects all connected links' visuals
 * - Harmony strengthens constructive interference
 * - Corruption increases phase variance (encourages destructive interference)
 * - Instability weakens feedback strength
 */
export class NodeSynergyInterferenceController {
    constructor(node) {
        this.node = node;
        this.connectedLinks = []; // Array of { link, direction ('in'|'out') }
        
        // Computed interference state
        this.averagePhase = 0;
        this.phaseVariance = 0;
        this.combinedAmplitude = 1.0;
        this.interferenceFactor = 1.0; // 0.0-1.5 range
        this.syncBias = 0.0; // How strongly links sync to node rhythm
        
        // Configuration
        this.config = {
            minLinksForInterference: 2,      // Need at least 2 links to compute interference
            varianceThreshold: 0.5,           // Variance above which we see destructive effects
            harmonySyncBoost: 0.3,            // How much harmony boosts syncBias
            corruptionVarianceScale: 1.5,     // How much corruption increases variance
            instabilityFeedbackDamp: 0.6,     // How much instability reduces feedback
        };
        
        // Temporal smoothing for interference effects (low-pass filter)
        this.interferenceSmoothing = 0.15; // 0-1, higher = more smoothing
        this.targetInterferenceFactor = 1.0;
        this.targetSyncBias = 0.0;
        
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
     * Update interference computation based on connected links
     */
    update(harmony = 1.0, corruption = 0.0, instability = 0.0) {
        if (this.connectedLinks.length < this.config.minLinksForInterference) {
            // Not enough links for meaningful interference
            this.targetInterferenceFactor = 1.0;
            this.targetSyncBias = 0.0;
        } else {
            // Collect synergy data from all connected links
            const linkData = this.collectLinkSynergyData();
            
            // Compute interference metrics
            this.computeInterference(linkData, harmony, corruption, instability);
        }

        // Smooth transitions to new interference state
        this.averagePhase = this.smoothPhase(this.averagePhase);
        this.interferenceFactor += (this.targetInterferenceFactor - this.interferenceFactor) * this.interferenceSmoothing;
        this.syncBias += (this.targetSyncBias - this.syncBias) * this.interferenceSmoothing;

        // Clamp values
        this.interferenceFactor = Math.max(0.0, Math.min(1.5, this.interferenceFactor));
        this.syncBias = Math.max(0.0, Math.min(1.0, this.syncBias));
    }

    /**
     * Collect synergy state from all connected links
     */
    collectLinkSynergyData() {
        const data = this.connectedLinks
            .map(cl => {
                const link = cl.link;
                const state = link.group?.userData?.conduitState;
                if (!state) return null;

                const adapter = state.visualStateAdapter;
                const visualState = adapter ? adapter.getVisualState() : {};
                
                // Extract phase and frequency info
                const synergyPhase = visualState.synergyPhase || 0;
                const synergyLevel = visualState.synergyLevel ?? 0.5;
                const frequency = 1.0 + synergyLevel; // Frequency ranges 1.0-2.0 based on synergy

                return {
                    link: link,
                    phase: synergyPhase,
                    frequency: frequency,
                    amplitude: 0.6 + synergyLevel * 0.4, // Amplitude 0.6-1.0
                    synergy: synergyLevel,
                };
            })
            .filter(d => d !== null);

        return data;
    }

    /**
     * Compute interference metrics
     */
    computeInterference(linkData, harmony, corruption, instability) {
        if (linkData.length === 0) {
            this.targetInterferenceFactor = 1.0;
            this.targetSyncBias = 0.0;
            return;
        }

        // === 1. COMPUTE AVERAGE PHASE (Circular Mean) ===
        // Use sin/cos to properly average circular phases
        let sinSum = 0, cosSum = 0;
        linkData.forEach(d => {
            sinSum += Math.sin(d.phase);
            cosSum += Math.cos(d.phase);
        });
        sinSum /= linkData.length;
        cosSum /= linkData.length;
        
        this.averagePhase = Math.atan2(sinSum, cosSum);

        // === 2. COMPUTE PHASE VARIANCE (Circular Variance) ===
        // Measures how scattered the phases are (0 = perfect coherence, 1 = random)
        let varianceSum = 0;
        linkData.forEach(d => {
            const phaseDiff = this.angleDifference(d.phase, this.averagePhase);
            varianceSum += Math.sin(phaseDiff * 0.5) ** 2;
        });
        let phaseVariance = varianceSum / linkData.length;

        // === 3. APPLY HARMONY & CORRUPTION MODIFIERS ===
        // Harmony reduces apparent variance (more coherent perception)
        phaseVariance *= (1.0 - harmony * 0.3);
        
        // Corruption increases variance (creates destructive interference)
        phaseVariance *= (1.0 + corruption * this.config.corruptionVarianceScale);
        
        // Clamp variance
        phaseVariance = Math.max(0, Math.min(1, phaseVariance));
        this.phaseVariance = phaseVariance;

        // === 4. COMPUTE COMBINED AMPLITUDE ===
        // Average amplitude of all connected links
        const avgAmplitude = linkData.reduce((sum, d) => sum + d.amplitude, 0) / linkData.length;
        this.combinedAmplitude = avgAmplitude;

        // === 5. DERIVE INTERFERENCE FACTOR ===
        // Constructive interference (low variance) pushes toward 1.5
        // Destructive interference (high variance) pushes toward 0.5
        const coherence = 1.0 - phaseVariance; // Inverted: 1.0 = perfect coherence
        this.targetInterferenceFactor = 0.75 + (coherence * 0.75); // Maps 0.75 -> 1.5

        // === 6. COMPUTE SYNC BIAS ===
        // How strongly connected links should align to node rhythm
        // Affected by harmony, weakened by instability
        const baseSyncBias = coherence * (0.4 + linkData.length * 0.15); // More links = stronger bias
        this.targetSyncBias = baseSyncBias * (1.0 + harmony * this.config.harmonySyncBoost) * (1.0 - instability * this.config.instabilityFeedbackDamp);
        this.targetSyncBias = Math.max(0, Math.min(1, this.targetSyncBias));
    }

    /**
     * Get interference feedback for a specific link
     * Returns { interferenceFactor, syncBias, averagePhase }
     */
    getInterferenceFeedback() {
        return {
            interferenceFactor: this.interferenceFactor,
            syncBias: this.syncBias,
            averagePhase: this.averagePhase,
            phaseVariance: this.phaseVariance,
            combinedAmplitude: this.combinedAmplitude,
            linkCount: this.connectedLinks.length,
        };
    }

    /**
     * Get debugging/visualization info
     */
    getDebugInfo() {
        return {
            nodeId: this.node.id || 'unknown',
            connectedLinkCount: this.connectedLinks.length,
            averagePhase: this.averagePhase,
            phaseVariance: this.phaseVariance,
            interferenceFactor: this.interferenceFactor,
            syncBias: this.syncBias,
            combinedAmplitude: this.combinedAmplitude,
        };
    }

    /**
     * Utility: Compute circular (angular) difference between two phases
     */
    angleDifference(angle1, angle2) {
        let diff = angle1 - angle2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return Math.abs(diff);
    }

    /**
     * Utility: Smooth phase wrapping (handle circular nature)
     */
    smoothPhase(currentPhase) {
        // Keep phase in -π to π range for numerical stability
        while (currentPhase > Math.PI) currentPhase -= Math.PI * 2;
        while (currentPhase < -Math.PI) currentPhase += Math.PI * 2;
        return currentPhase;
    }

    /**
     * Set configuration parameters
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Dispose/cleanup
     */
    dispose() {
        this.connectedLinks = [];
    }
}
