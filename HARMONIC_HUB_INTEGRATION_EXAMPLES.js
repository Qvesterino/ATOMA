/**
 * HARMONIC_HUB_INTEGRATION_EXAMPLES.js
 * ============================================================================
 * Practical examples showing how to use the harmonic hub phase synchronization
 * system in your game code.
 * 
 * Copy-paste these into your game to test and debug harmonic hubs.
 */

// ============================================================================
// EXAMPLE 1: Basic Hub Monitoring
// ============================================================================

function example_basicMonitoring(gameState) {
    console.log('=== EXAMPLE 1: Basic Hub Monitoring ===\n');
    
    // Find all nodes with harmonic controllers
    const hubNodes = gameState.nodes.filter(n => n.harmonicController && n.harmonicController.isActive);
    
    console.log(`Found ${hubNodes.length} active harmonic hubs\n`);
    
    for (const node of hubNodes) {
        const controller = node.harmonicController;
        const time = performance.now() * 0.001;
        const debug = controller.getDebugInfo(time);
        
        console.log(`Hub: ${node.id}`);
        console.log(`  Harmonic Mode: ${debug.harmonicMode}`);
        console.log(`  Link Count: ${debug.linkCount}`);
        console.log(`  Sync Strength: ${(debug.hubStrength * 100).toFixed(0)}%`);
        console.log(`  Hub Phase: ${(debug.hubPhase * 180 / Math.PI).toFixed(1)}°\n`);
    }
}

// ============================================================================
// EXAMPLE 2: Watch Hub State Changes in Real-Time
// ============================================================================

function example_watchHubInRealTime(gameState, nodeId) {
    console.log('=== EXAMPLE 2: Watch Hub in Real-Time ===\n');
    
    const node = gameState.nodes.find(n => n.id === nodeId);
    if (!node || !node.harmonicController) {
        console.warn(`Node ${nodeId} not found or has no harmonic controller`);
        return;
    }
    
    const controller = node.harmonicController;
    let lastMode = '';
    let updateCount = 0;
    
    const watchInterval = setInterval(() => {
        const time = performance.now() * 0.001;
        const debug = controller.getDebugInfo(time);
        
        // Show when mode changes
        if (debug.harmonicMode !== lastMode) {
            console.log(`[${updateCount}] Mode changed: ${lastMode} → ${debug.harmonicMode}`);
            lastMode = debug.harmonicMode;
        }
        
        // Show phase offsets (in degrees for readability)
        const offsets = debug.phaseOffsets
            .map(p => (p * 180 / Math.PI).toFixed(0) + '°')
            .join(' | ');
        
        console.log(`[${updateCount}] Strength: ${(debug.hubStrength * 100).toFixed(0)}% | Phases: ${offsets}`);
        
        updateCount++;
        
        // Stop after 10 updates
        if (updateCount >= 10) {
            clearInterval(watchInterval);
            console.log('\nWatch complete.');
        }
    }, 200);
}

// ============================================================================
// EXAMPLE 3: Test Harmonic Mode Transition
// ============================================================================

function example_testModeTransition(gameState) {
    console.log('=== EXAMPLE 3: Test Harmonic Mode Transitions ===\n');
    
    // Create a test node
    const testNode = { id: 'test-hub', harmonicController: null };
    
    // Mock harmonic controller
    const mockController = {
        getHarmonicMode(linkCount) {
            if (linkCount <= 2) return 'mirrored';
            if (linkCount <= 4) return 'standing-wave';
            return 'orbital';
        },
        getHarmonicPhaseOffset(linkIndex, linkCount, time) {
            const mode = this.getHarmonicMode(linkCount);
            if (mode === 'mirrored') {
                return linkIndex % 2 === 0 ? 0 : Math.PI;
            }
            if (mode === 'standing-wave') {
                const angleStep = (Math.PI * 2) / Math.max(3, linkCount);
                return linkIndex * angleStep;
            }
            const orbitSpeed = 0.3;
            const orbitRadius = Math.PI * 0.5;
            const angleStep = (Math.PI * 2) / Math.max(5, linkCount);
            const baseAngle = linkIndex * angleStep;
            const orbitPhase = time * orbitSpeed + baseAngle;
            return orbitRadius * Math.sin(orbitPhase);
        }
    };
    
    testNode.harmonicController = mockController;
    
    // Test each link count
    console.log('Testing harmonic modes:\n');
    
    for (let linkCount = 1; linkCount <= 7; linkCount++) {
        const mode = mockController.getHarmonicMode(linkCount);
        console.log(`${linkCount} links → Mode: ${mode}`);
        
        // Show phase offsets
        const offsets = [];
        for (let i = 0; i < linkCount; i++) {
            const offset = mockController.getHarmonicPhaseOffset(i, linkCount, 0);
            offsets.push((offset * 180 / Math.PI).toFixed(0) + '°');
        }
        console.log(`  Offsets: ${offsets.join(' | ')}\n`);
    }
}

// ============================================================================
// EXAMPLE 4: Analyze Sync Quality
// ============================================================================

function example_analyzeSyncQuality(gameState) {
    console.log('=== EXAMPLE 4: Analyze Sync Quality ===\n');
    
    const hubNodes = gameState.nodes.filter(n => n.harmonicController && n.harmonicController.isActive);
    
    if (hubNodes.length === 0) {
        console.log('No active hubs found.');
        return;
    }
    
    for (const node of hubNodes) {
        const controller = node.harmonicController;
        const time = performance.now() * 0.001;
        const debug = controller.getDebugInfo(time);
        
        // Calculate phase coherence (how well-aligned the phases are)
        const phaseOffsets = debug.phaseOffsets;
        let sinSum = 0, cosSum = 0;
        for (const phase of phaseOffsets) {
            sinSum += Math.sin(phase);
            cosSum += Math.cos(phase);
        }
        sinSum /= phaseOffsets.length;
        cosSum /= phaseOffsets.length;
        const meanResultant = Math.sqrt(sinSum * sinSum + cosSum * cosSum);
        const coherence = meanResultant; // 0 (chaotic) to 1 (perfectly aligned)
        
        // Assess quality
        let quality = 'Unknown';
        if (coherence > 0.8) quality = '✓ Excellent';
        else if (coherence > 0.5) quality = '◐ Good';
        else quality = '✗ Poor';
        
        console.log(`Hub: ${node.id}`);
        console.log(`  Quality: ${quality}`);
        console.log(`  Coherence: ${(coherence * 100).toFixed(0)}%`);
        console.log(`  Mode: ${debug.harmonicMode}`);
        console.log(`  Strength: ${(debug.hubStrength * 100).toFixed(0)}%\n`);
    }
}

// ============================================================================
// EXAMPLE 5: Watch Orbital Mode Rotation
// ============================================================================

function example_watchOrbitalRotation(gameState, nodeId, durationSeconds = 5) {
    console.log(`=== EXAMPLE 5: Watch Orbital Mode Rotation (${durationSeconds}s) ===\n`);
    
    const node = gameState.nodes.find(n => n.id === nodeId);
    if (!node || !node.harmonicController) {
        console.warn(`Node ${nodeId} not found`);
        return;
    }
    
    const controller = node.harmonicController;
    const startTime = performance.now();
    const duration = durationSeconds * 1000;
    let frameCount = 0;
    
    console.log('Orbital phase progression:\n');
    
    const watchInterval = setInterval(() => {
        const elapsed = Math.min(performance.now() - startTime, duration);
        const time = elapsed * 0.001;
        const progress = elapsed / duration;
        const debug = controller.getDebugInfo(time);
        
        if (debug.harmonicMode !== 'orbital') {
            console.log('⚠️ Hub switched out of orbital mode');
            clearInterval(watchInterval);
            return;
        }
        
        frameCount++;
        const offsets = debug.phaseOffsets
            .map(p => (p * 180 / Math.PI).toFixed(0) + '°')
            .join(' | ');
        
        console.log(`[${(progress * 100).toFixed(0)}%] ${offsets}`);
        
        if (elapsed >= duration) {
            clearInterval(watchInterval);
            console.log(`\n✓ Orbit watch complete (${frameCount} samples)`);
        }
    }, 200);
}

// ============================================================================
// EXAMPLE 6: Get Phase Offset for Specific Link
// ============================================================================

function example_getLinkPhaseOffset(gameState, nodeId, linkIndex) {
    console.log('=== EXAMPLE 6: Get Link Phase Offset ===\n');
    
    const node = gameState.nodes.find(n => n.id === nodeId);
    if (!node || !node.harmonicController) {
        console.warn(`Node ${nodeId} not found`);
        return;
    }
    
    const controller = node.harmonicController;
    const time = performance.now() * 0.001;
    
    const linkCount = controller.connectedLinks.length;
    const mode = controller.getHarmonicMode(linkCount);
    const phaseOffset = controller.getHarmonicPhaseOffset(linkIndex, linkCount, time);
    
    console.log(`Hub: ${nodeId}`);
    console.log(`  Mode: ${mode}`);
    console.log(`  Link Count: ${linkCount}`);
    console.log(`  Link Index: ${linkIndex}`);
    console.log(`  Phase Offset: ${(phaseOffset * 180 / Math.PI).toFixed(1)}° (${phaseOffset.toFixed(3)} rad)`);
    
    // Get feedback for this link
    const feedback = controller.getSyncFeedbackWithTime(linkIndex, time);
    console.log(`\nSync Feedback:`);
    console.log(`  Target Phase: ${(feedback.syncTargetPhase * 180 / Math.PI).toFixed(1)}°`);
    console.log(`  Sync Strength: ${(feedback.syncStrength * 100).toFixed(0)}%`);
    console.log(`  Harmonic Mode: ${feedback.harmonicMode}`);
}

// ============================================================================
// EXAMPLE 7: Compare Hub States
// ============================================================================

function example_compareHubStates(gameState) {
    console.log('=== EXAMPLE 7: Compare All Hub States ===\n');
    
    const hubNodes = gameState.nodes.filter(n => n.harmonicController && n.harmonicController.isActive);
    
    if (hubNodes.length === 0) {
        console.log('No active hubs found.');
        return;
    }
    
    // Create comparison table
    const data = hubNodes.map(node => {
        const controller = node.harmonicController;
        const time = performance.now() * 0.001;
        const debug = controller.getDebugInfo(time);
        
        return {
            nodeId: node.id,
            mode: debug.harmonicMode,
            links: debug.linkCount,
            strength: (debug.hubStrength * 100).toFixed(0),
            phase: (debug.hubPhase * 180 / Math.PI).toFixed(1),
        };
    });
    
    // Sort by mode
    data.sort((a, b) => a.mode.localeCompare(b.mode));
    
    console.table(data);
}

// ============================================================================
// EXAMPLE 8: Simulate Hub Activation/Deactivation
// ============================================================================

function example_simulateHubActivation(gameState, nodeId, harmony, corruption, instability) {
    console.log('=== EXAMPLE 8: Simulate Hub Activation ===\n');
    
    const node = gameState.nodes.find(n => n.id === nodeId);
    if (!node || !node.harmonicController) {
        console.warn(`Node ${nodeId} not found`);
        return;
    }
    
    const controller = node.harmonicController;
    
    console.log('Simulating update with state:');
    console.log(`  Harmony: ${harmony}`);
    console.log(`  Corruption: ${corruption}`);
    console.log(`  Instability: ${instability}\n`);
    
    // Manually call update to see if hub activates
    controller.update(harmony, corruption, instability);
    
    const time = performance.now() * 0.001;
    const debug = controller.getDebugInfo(time);
    
    console.log('Result:');
    console.log(`  Active: ${debug.isActive ? '✓ Yes' : '✗ No'}`);
    console.log(`  Mode: ${debug.harmonicMode}`);
    console.log(`  Strength: ${(debug.hubStrength * 100).toFixed(0)}%`);
    
    // Check activation conditions
    const avgSynergy = debug.linkCount > 0 ? 0.5 : 0; // Mock value
    console.log(`\nActivation checks:`);
    console.log(`  Links >= 3: ${debug.linkCount >= 3 ? '✓' : '✗'}`);
    console.log(`  Harmony > corruption × 1.2: ${harmony > corruption * 1.2 ? '✓' : '✗'}`);
    console.log(`  Instability < 0.4: ${instability < 0.4 ? '✓' : '✗'}`);
}

// ============================================================================
// EXAMPLE 9: Export Hub Data for Analysis
// ============================================================================

function example_exportHubData(gameState) {
    console.log('=== EXAMPLE 9: Export Hub Data ===\n');
    
    const hubNodes = gameState.nodes.filter(n => n.harmonicController && n.harmonicController.isActive);
    
    const exportData = hubNodes.map(node => {
        const controller = node.harmonicController;
        const time = performance.now() * 0.001;
        const debug = controller.getDebugInfo(time);
        
        return {
            nodeId: node.id,
            timestamp: new Date().toISOString(),
            harmonicMode: debug.harmonicMode,
            linkCount: debug.linkCount,
            hubPhase: debug.hubPhase,
            hubFrequency: debug.hubFrequency,
            hubStrength: debug.hubStrength,
            phaseOffsets: debug.phaseOffsets.map(p => p * 180 / Math.PI), // In degrees
        };
    });
    
    // Convert to JSON for export
    const json = JSON.stringify(exportData, null, 2);
    console.log(json);
    
    // Return for copying
    return exportData;
}

// ============================================================================
// EXAMPLE 10: Auto-Config Based on Network Size
// ============================================================================

function example_autoConfigureHubs(gameState) {
    console.log('=== EXAMPLE 10: Auto-Configure Hubs ===\n');
    
    const hubNodes = gameState.nodes.filter(n => n.harmonicController);
    const totalHubs = hubNodes.length;
    
    console.log(`Total hubs: ${totalHubs}`);
    
    // Adjust configuration based on network size
    for (const node of hubNodes) {
        const controller = node.harmonicController;
        
        let config = {};
        
        // For large networks, make hubs easier to activate
        if (totalHubs > 20) {
            config.minLinksForHub = 2;
            config.minAverageSynergy = 0.4;
            config.synergyStrengthScale = 0.5;
        }
        
        // For small networks, require more health
        if (totalHubs < 5) {
            config.minLinksForHub = 3;
            config.minAverageSynergy = 0.6;
        }
        
        if (Object.keys(config).length > 0) {
            controller.setConfig(config);
            console.log(`${node.id}: Applied config`, config);
        }
    }
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const HarmonicHubExamples = {
    basicMonitoring: example_basicMonitoring,
    watchHubInRealTime: example_watchHubInRealTime,
    testModeTransition: example_testModeTransition,
    analyzeSyncQuality: example_analyzeSyncQuality,
    watchOrbitalRotation: example_watchOrbitalRotation,
    getLinkPhaseOffset: example_getLinkPhaseOffset,
    compareHubStates: example_compareHubStates,
    simulateHubActivation: example_simulateHubActivation,
    exportHubData: example_exportHubData,
    autoConfigureHubs: example_autoConfigureHubs,
};

// Make available in console for quick testing
if (typeof window !== 'undefined') {
    window.HarmonicHubExamples = HarmonicHubExamples;
}

// ============================================================================
// QUICK START IN CONSOLE
// ============================================================================
// 
// Once imported, use like this:
//
// HarmonicHubExamples.basicMonitoring(gameState);
// HarmonicHubExamples.watchHubInRealTime(gameState, 'n:123');
// HarmonicHubExamples.testModeTransition(gameState);
// HarmonicHubExamples.analyzeSyncQuality(gameState);
// HarmonicHubExamples.compareHubStates(gameState);
//
