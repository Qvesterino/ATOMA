/**
 * HarmonicHubDebugger
 * ============================================================================
 * Console utilities for testing and visualizing harmonic hub phase synchronization
 * 
 * Usage:
 *   const debugger = new HarmonicHubDebugger(gameState);
 *   debugger.watchHub(nodeId);
 *   debugger.showModeTransition();
 *   debugger.analyzeSync();
 */

export class HarmonicHubDebugger {
    constructor(gameState) {
        this.gameState = gameState;
        this.watchingHubs = new Map();
        this.modeHistory = [];
    }

    /**
     * Find a hub by node ID
     */
    findHub(nodeId) {
        if (!this.gameState || !this.gameState.nodes) return null;
        const node = this.gameState.nodes.find(n => n.id === nodeId);
        return node?.harmonicController || null;
    }

    /**
     * Get all active hubs
     */
    getAllHubs() {
        if (!this.gameState || !this.gameState.nodes) return [];
        return this.gameState.nodes
            .filter(n => n.harmonicController && n.harmonicController.isActive)
            .map(n => ({
                nodeId: n.id,
                controller: n.harmonicController,
            }));
    }

    /**
     * Watch a hub and log changes
     */
    watchHub(nodeId, logInterval = 500) {
        const hub = this.findHub(nodeId);
        if (!hub) {
            console.warn(`[HarmonicDebug] Hub not found: ${nodeId}`);
            return;
        }

        const watchId = `watch_${nodeId}`;
        if (this.watchingHubs.has(watchId)) {
            clearInterval(this.watchingHubs.get(watchId));
        }

        let lastMode = '';
        let lastStrength = -1;

        const interval = setInterval(() => {
            const time = performance.now() * 0.001;
            const debug = hub.getDebugInfo(time);

            // Log mode changes
            if (debug.harmonicMode !== lastMode) {
                console.log(`%c[HARMONIC] Mode Change: ${lastMode} → ${debug.harmonicMode}`, 
                    'color: #00ff00; font-weight: bold');
                lastMode = debug.harmonicMode;
            }

            // Log strength changes
            if (Math.abs(debug.hubStrength - lastStrength) > 0.1) {
                console.log(`%c[HARMONIC] Strength: ${debug.hubStrength.toFixed(2)} (${this._strengthBar(debug.hubStrength)})`, 
                    this._strengthColor(debug.hubStrength));
                lastStrength = debug.hubStrength;
            }

            // Show phase offsets in degrees
            const offsets = debug.phaseOffsets
                .map(p => (p * 180 / Math.PI).toFixed(0) + '°')
                .join(' | ');
            console.log(`%c  Phases: ${offsets}`, 'color: #888');
        }, logInterval);

        this.watchingHubs.set(watchId, interval);
        console.log(`[HarmonicDebug] Watching hub: ${nodeId} (update every ${logInterval}ms)`);
    }

    /**
     * Stop watching a hub
     */
    stopWatchingHub(nodeId) {
        const watchId = `watch_${nodeId}`;
        const interval = this.watchingHubs.get(watchId);
        if (interval) {
            clearInterval(interval);
            this.watchingHubs.delete(watchId);
            console.log(`[HarmonicDebug] Stopped watching: ${nodeId}`);
        }
    }

    /**
     * Stop watching all hubs
     */
    stopWatchingAll() {
        for (const [key, interval] of this.watchingHubs.entries()) {
            clearInterval(interval);
        }
        this.watchingHubs.clear();
        console.log('[HarmonicDebug] Stopped watching all hubs');
    }

    /**
     * Display detailed info for a hub
     */
    showHubInfo(nodeId) {
        const hub = this.findHub(nodeId);
        if (!hub) {
            console.warn(`[HarmonicDebug] Hub not found: ${nodeId}`);
            return;
        }

        const time = performance.now() * 0.001;
        const debug = hub.getDebugInfo(time);
        const sync = hub.getSyncFeedback();

        console.group(`%c[HARMONIC] Hub: ${nodeId}`, 'color: #00ffff; font-weight: bold');
        
        console.log('%cActivation State:', 'font-weight: bold');
        console.log(`  Active: ${debug.isActive ? '✓' : '✗'}`);
        console.log(`  Link Count: ${debug.linkCount}`);
        
        console.log('%cHarmonic Mode:', 'font-weight: bold');
        console.log(`  Mode: ${debug.harmonicMode}`);
        console.log(`  Phase Offsets: ${debug.phaseOffsets.map(p => (p * 180 / Math.PI).toFixed(0) + '°').join(', ')}`);
        
        console.log('%cHub State:', 'font-weight: bold');
        console.log(`  Phase: ${(debug.hubPhase * 180 / Math.PI).toFixed(1)}°`);
        console.log(`  Frequency: ${debug.hubFrequency.toFixed(2)}x`);
        console.log(`  Strength: ${debug.hubStrength.toFixed(2)} ${this._strengthBar(debug.hubStrength)}`);
        
        console.groupEnd();
    }

    /**
     * Show harmonic mode based on link count
     */
    showModeReference() {
        console.group('%c[HARMONIC] Mode Reference', 'color: #ffaa00; font-weight: bold');
        
        console.log('%c2 Links: MIRRORED', 'color: #00ff00');
        console.log('  Pattern: Push-pull oscillation (0° and 180°)');
        console.log('  Visual: Energy alternates between two links');
        
        console.log('%c3-4 Links: STANDING WAVE', 'color: #00ff00');
        console.log('  Pattern: Evenly spaced phases (120° or 90°)');
        console.log('  Visual: Energy cascades in sequence');
        
        console.log('%c5+ Links: ORBITAL', 'color: #00ff00');
        console.log('  Pattern: Sinusoidal drift around hub phase');
        console.log('  Visual: Smooth orbital dance (~20s period)');
        
        console.groupEnd();
    }

    /**
     * Show all active hubs
     */
    showActiveHubs() {
        const hubs = this.getAllHubs();
        
        if (hubs.length === 0) {
            console.log('[HarmonicDebug] No active hubs found');
            return;
        }

        console.group(`%c[HARMONIC] Active Hubs (${hubs.length})`, 'color: #00ff00; font-weight: bold');
        
        for (const { nodeId, controller } of hubs) {
            const time = performance.now() * 0.001;
            const debug = controller.getDebugInfo(time);
            console.log(`%c${nodeId}`, 'color: #ffaa00; font-weight: bold');
            console.log(`  Mode: ${debug.harmonicMode} | Links: ${debug.linkCount} | Strength: ${(debug.hubStrength * 100).toFixed(0)}%`);
        }
        
        console.groupEnd();
    }

    /**
     * Analyze sync quality for all hubs
     */
    analyzeSyncQuality() {
        const hubs = this.getAllHubs();
        
        if (hubs.length === 0) {
            console.log('[HarmonicDebug] No active hubs to analyze');
            return;
        }

        console.group('%c[HARMONIC] Sync Quality Analysis', 'color: #ffaa00; font-weight: bold');
        
        for (const { nodeId, controller } of hubs) {
            const time = performance.now() * 0.001;
            const debug = controller.getDebugInfo(time);
            
            // Calculate phase variance
            const phaseOffsets = debug.phaseOffsets;
            const variance = this._calculatePhaseVariance(phaseOffsets);
            const quality = Math.max(0, 1 - variance);
            
            const qualityColor = quality > 0.8 ? '#00ff00' : quality > 0.5 ? '#ffff00' : '#ff0000';
            const qualityLabel = quality > 0.8 ? 'Excellent' : quality > 0.5 ? 'Good' : 'Poor';
            
            console.log(`%c${nodeId}: ${qualityLabel}`, `color: ${qualityColor}; font-weight: bold`);
            console.log(`  Variance: ${variance.toFixed(3)} | Quality: ${(quality * 100).toFixed(0)}%`);
            console.log(`  Strength: ${debug.hubStrength.toFixed(2)}`);
        }
        
        console.groupEnd();
    }

    /**
     * Test harmonic mode transitions
     */
    testModeTransitions(nodeId) {
        const hub = this.findHub(nodeId);
        if (!hub) {
            console.warn(`[HarmonicDebug] Hub not found: ${nodeId}`);
            return;
        }

        console.group('%c[HARMONIC] Mode Transition Test', 'color: #ff00ff; font-weight: bold');

        // Test each link count
        for (let linkCount = 1; linkCount <= 7; linkCount++) {
            const mode = hub.getHarmonicMode(linkCount);
            
            // Generate phase offsets
            const offsets = [];
            for (let i = 0; i < linkCount; i++) {
                const offset = hub.getHarmonicPhaseOffset(i, linkCount, 0);
                offsets.push((offset * 180 / Math.PI).toFixed(0) + '°');
            }
            
            console.log(`%c${linkCount} links: ${mode}`, 'color: #00ff00; font-weight: bold');
            console.log(`  Offsets: ${offsets.join(' | ')}`);
        }

        console.groupEnd();
    }

    /**
     * Watch orbital mode rotation
     */
    watchOrbitalRotation(nodeId, duration = 5000) {
        const hub = this.findHub(nodeId);
        if (!hub) {
            console.warn(`[HarmonicDebug] Hub not found: ${nodeId}`);
            return;
        }

        const startTime = performance.now();
        const endTime = startTime + duration;
        let frameCount = 0;

        console.group('%c[HARMONIC] Orbital Rotation Watch (5s)', 'color: #00ffff; font-weight: bold');

        const interval = setInterval(() => {
            const elapsed = Math.min(performance.now() - startTime, duration);
            const time = elapsed * 0.001; // Convert to seconds
            const progress = elapsed / duration;

            const debug = hub.getDebugInfo(time);
            if (debug.harmonicMode !== 'orbital') {
                console.log('⚠️ Not in orbital mode');
                clearInterval(interval);
                return;
            }

            frameCount++;
            const offsets = debug.phaseOffsets
                .map(p => (p * 180 / Math.PI).toFixed(0) + '°')
                .join(' | ');

            console.log(`[${(progress * 100).toFixed(0)}%] ${offsets}`);

            if (elapsed >= duration) {
                clearInterval(interval);
                console.log(`%cOrbit cycle complete (${frameCount} frames)`, 'color: #00ff00; font-weight: bold');
                console.groupEnd();
            }
        }, 200);
    }

    /**
     * Utility: Calculate phase variance
     */
    _calculatePhaseVariance(phaseOffsets) {
        if (phaseOffsets.length === 0) return 0;
        
        // Calculate circular variance
        let sinSum = 0, cosSum = 0;
        for (const phase of phaseOffsets) {
            sinSum += Math.sin(phase);
            cosSum += Math.cos(phase);
        }
        sinSum /= phaseOffsets.length;
        cosSum /= phaseOffsets.length;
        
        const meanResultant = Math.sqrt(sinSum * sinSum + cosSum * cosSum);
        return 1 - meanResultant; // Variance: 0 (perfect coherence) to 1 (chaos)
    }

    /**
     * Utility: Strength color coding
     */
    _strengthColor(strength) {
        if (strength > 0.7) return 'color: #00ff00; font-weight: bold';
        if (strength > 0.4) return 'color: #ffff00; font-weight: bold';
        return 'color: #ff6600; font-weight: bold';
    }

    /**
     * Utility: Strength bar visualization
     */
    _strengthBar(strength) {
        const filled = Math.round(strength * 10);
        const empty = 10 - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    }
}

// Export as global for console access
if (typeof window !== 'undefined') {
    window.HarmonicHubDebugger = HarmonicHubDebugger;
}
