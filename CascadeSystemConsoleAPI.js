/**
 * ============================================================================
 * CASCADE SYSTEM CONSOLE API
 * ============================================================================
 * 
 * Provides console commands for managing cascading rupture and node failure systems.
 * 
 * USAGE:
 * - Enable cascades: game.enableCascades()
 * - Disable cascades: game.disableCascades()
 * - Enable failures: game.enableNodeFailure()
 * - Disable failures: game.disableNodeFailure()
 * - Check status: game.cascadeStatus()
 * - Force cascade: game.triggerCascade(nodeIndex)
 * 
 * ============================================================================
 */

export function setupCascadeSystemConsoleAPI(game) {
    if (!game) {
        console.warn('[CascadeAPI] No game instance provided');
        return;
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    game.enableCascades = () => {
        if (!game.cascadingRuptures) {
            console.warn('[CascadeAPI] Cascading rupture system not initialized');
            return;
        }
        game.cascadingRuptures.enable();
        console.log('[CascadeAPI] ✅ Cascading ruptures ENABLED');
        console.log('[CascadeAPI] Network ruptures can now propagate across regions');
    };

    game.disableCascades = () => {
        if (!game.cascadingRuptures) {
            console.warn('[CascadeAPI] Cascading rupture system not initialized');
            return;
        }
        game.cascadingRuptures.disable();
        console.log('[CascadeAPI] ❌ Cascading ruptures DISABLED');
    };

    game.enableNodeFailure = () => {
        if (!game.criticalNodeFailure) {
            console.warn('[CascadeAPI] Critical node failure system not initialized');
            return;
        }
        game.criticalNodeFailure.enable();
        console.log('[CascadeAPI] ✅ Node failure ENABLED');
        console.log('[CascadeAPI] Critical nodes will sever links after countdown');
    };

    game.disableNodeFailure = () => {
        if (!game.criticalNodeFailure) {
            console.warn('[CascadeAPI] Critical node failure system not initialized');
            return;
        }
        game.criticalNodeFailure.disable();
        console.log('[CascadeAPI] ❌ Node failure DISABLED');
    };

    game.enableBothCascadeSystems = () => {
        game.enableCascades();
        game.enableNodeFailure();
        console.log('[CascadeAPI] 🔥 Both cascade systems ENABLED - Network can collapse');
    };

    game.disableBothCascadeSystems = () => {
        game.disableCascades();
        game.disableNodeFailure();
        console.log('[CascadeAPI] 🛡️  Both cascade systems DISABLED - Network protected');
    };

    // ========================================================================
    // STATUS
    // ========================================================================

    game.cascadeStatus = () => {
        console.log('='.repeat(60));
        console.log('CASCADE SYSTEM STATUS');
        console.log('='.repeat(60));

        if (game.cascadingRuptures) {
            console.log(`Cascading Ruptures: ${game.cascadingRuptures.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
            if (game.cascadingRuptures.enabled) {
                const activeCascades = game.cascadingRuptures.activeCascades.filter(c => c.active).length;
                console.log(`  Active cascades: ${activeCascades}`);
            }
        } else {
            console.log('Cascading Ruptures: ❓ NOT INITIALIZED');
        }

        if (game.criticalNodeFailure) {
            console.log(`Node Failure: ${game.criticalNodeFailure.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
            if (game.criticalNodeFailure.enabled) {
                const failingNodes = game.criticalNodeFailure.getActiveFailureNodes();
                const isolatedCount = game.criticalNodeFailure.isolatedNodes.size;
                console.log(`  Nodes in failure countdown: ${failingNodes.length}`);
                console.log(`  Isolated nodes: ${isolatedCount}`);
            }
        } else {
            console.log('Node Failure: ❓ NOT INITIALIZED');
        }

        console.log('='.repeat(60));
    };

    // ========================================================================
    // MANUAL TRIGGERS (for testing)
    // ========================================================================

    game.triggerCascade = (nodeIndex) => {
        if (!game.cascadingRuptures) {
            console.warn('[CascadeAPI] Cascading rupture system not initialized');
            return;
        }

        if (!game.cascadingRuptures.enabled) {
            console.warn('[CascadeAPI] Cascading ruptures disabled - enable first');
            return;
        }

        if (!game.aiNodes || !game.aiNodes.nodes) {
            console.warn('[CascadeAPI] No nodes available');
            return;
        }

        const nodes = game.aiNodes.nodes;
        if (nodeIndex === undefined || nodeIndex < 0 || nodeIndex >= nodes.length) {
            console.warn(`[CascadeAPI] Invalid node index. Use 0-${nodes.length - 1}`);
            return;
        }

        const node = nodes[nodeIndex];
        const time = performance.now() / 1000;

        game.cascadingRuptures.initiateCascade(node, time);
        console.log(`[CascadeAPI] ⚡ Cascade triggered from node ${nodeIndex} (${node.uuid.slice(0, 8)})`);
    };

    game.listCriticalNodes = () => {
        if (!game.aiNodes || !game.aiNodes.nodes) {
            console.warn('[CascadeAPI] No nodes available');
            return;
        }

        const nodes = game.aiNodes.nodes;
        const criticalNodes = [];

        nodes.forEach((node, index) => {
            const stability = node.userData?.metrics?.stability ?? 1.0;
            const corruption = node.userData?.corruption ?? 0.0;
            
            if (stability <= 0.3 && corruption >= 0.6) {
                criticalNodes.push({
                    index,
                    uuid: node.uuid.slice(0, 8),
                    stability: stability.toFixed(2),
                    corruption: corruption.toFixed(2)
                });
            }
        });

        if (criticalNodes.length === 0) {
            console.log('[CascadeAPI] No critical nodes detected');
        } else {
            console.log('[CascadeAPI] Critical nodes found:');
            console.table(criticalNodes);
        }
    };

    // ========================================================================
    // QUICK HELP
    // ========================================================================

    game.cascadeHelp = () => {
        console.log('='.repeat(60));
        console.log('CASCADE SYSTEM CONSOLE COMMANDS');
        console.log('='.repeat(60));
        console.log('');
        console.log('ENABLE/DISABLE:');
        console.log('  game.enableCascades()          - Enable rupture propagation');
        console.log('  game.disableCascades()         - Disable rupture propagation');
        console.log('  game.enableNodeFailure()       - Enable link severing');
        console.log('  game.disableNodeFailure()      - Disable link severing');
        console.log('  game.enableBothCascadeSystems() - Enable both');
        console.log('  game.disableBothCascadeSystems() - Disable both');
        console.log('');
        console.log('STATUS:');
        console.log('  game.cascadeStatus()           - Show current status');
        console.log('  game.listCriticalNodes()       - List nodes near failure');
        console.log('');
        console.log('TESTING:');
        console.log('  game.triggerCascade(nodeIndex) - Force cascade from node');
        console.log('');
        console.log('PICTOGRAMS:');
        console.log('  game.enablePictograms()        - Enable link pictograms');
        console.log('  game.disablePictograms()       - Disable link pictograms');
        console.log('  game.enableFusion()            - Enable glyph fusion');
        console.log('  game.disableFusion()           - Disable glyph fusion');
        console.log('  game.pictogramStatus()         - Show pictogram & fusion status');
        console.log('');
        console.log('HELP:');
        console.log('  game.cascadeHelp()             - Show this help');
        console.log('='.repeat(60));
    };

    // ========================================================================
    // PICTOGRAM CONTROLS
    // ========================================================================

    game.enablePictograms = () => {
        if (!game.linkSemanticPictograms) {
            console.warn('[CascadeAPI] Pictogram system not initialized');
            return;
        }
        game.linkSemanticPictograms.enable();
        console.log('[CascadeAPI] ✅ Link pictograms ENABLED');
    };

    game.disablePictograms = () => {
        if (!game.linkSemanticPictograms) {
            console.warn('[CascadeAPI] Pictogram system not initialized');
            return;
        }
        game.linkSemanticPictograms.disable();
        console.log('[CascadeAPI] ❌ Link pictograms DISABLED');
    };

    game.pictogramStatus = () => {
        if (!game.linkSemanticPictograms) {
            console.log('Link Pictograms: ❓ NOT INITIALIZED');
            return;
        }

        const active = game.linkSemanticPictograms.pictograms.filter(p => p.active).length;
        const fusionStatus = game.linkSemanticPictograms.getFusionStatus();
        
        console.log('='.repeat(60));
        console.log('LINK PICTOGRAM STATUS');
        console.log('='.repeat(60));
        console.log(`Pictograms: ${game.linkSemanticPictograms.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`Active pictograms: ${active} / ${game.linkSemanticPictograms.pictograms.length}`);
        console.log('');
        console.log('GLYPH FUSION:');
        console.log(`Active fusions: ${fusionStatus.activeFusions} / ${fusionStatus.maxFusions}`);
        console.log(`Composite glyphs: ${fusionStatus.compositeGlyphsActive}`);
        console.log('='.repeat(60));
    };

    // ========================================================================
    // FUSION CONTROLS
    // ========================================================================

    game.enableFusion = () => {
        if (!game.linkSemanticPictograms) {
            console.warn('[CascadeAPI] Pictogram system not initialized');
            return;
        }
        game.linkSemanticPictograms.enableFusion();
        console.log('[CascadeAPI] ✅ Glyph fusion ENABLED');
    };

    game.disableFusion = () => {
        if (!game.linkSemanticPictograms) {
            console.warn('[CascadeAPI] Pictogram system not initialized');
            return;
        }
        game.linkSemanticPictograms.disableFusion();
        console.log('[CascadeAPI] ❌ Glyph fusion DISABLED');
    };

    // ========================================================================
    // INITIALIZATION MESSAGE
    // ========================================================================

    console.log('[CascadeAPI] Console commands available. Type game.cascadeHelp() for info');
}
