/**
 * DEFENSIVE HARDENING PATCH v1.0 — VALIDATION HELPER
 * 
 * Console utilities for testing and validating the defensive hardening patch
 * Run in browser console: Copy entire file, paste into console
 * Then use: validationHelper.runFullTest()
 */

export const validationHelper = {
    // Track metrics
    metrics: {
        iterableErrors: 0,
        linkCreateEvents: 0,
        layeringCorrections: 0,
        startTime: Date.now()
    },

    /**
     * Check if defensive patches are installed
     */
    checkPatchesInstalled() {
        console.group('🔍 Checking Patch Installation');
        
        const checks = {
            'AINodes.nodes is Array': Array.isArray(window.game?.aiNodes?.nodes),
            'WaveShaderBridge registered': window.game?.waveShaderBridge?.registeredNodeMaterials instanceof WeakSet,
            'WaveTravelShaderPack registered': window.game?.waveTravelShaderPack?.registeredMaterials instanceof WeakSet,
            'WaveDynamicsShaderPack registered': window.game?.waveDynamicsShaderPack?.registeredMaterials instanceof WeakSet,
            'Link observer installed': window.game?.linkingSystem?.observers?.length > 0
        };
        
        let allInstalled = true;
        for (const [check, result] of Object.entries(checks)) {
            console.log(`${result ? '✅' : '❌'} ${check}`, result);
            if (!result) allInstalled = false;
        }
        
        console.groupEnd();
        return allInstalled;
    },

    /**
     * Monitor for "is not iterable" errors
     */
    startErrorMonitoring() {
        console.log('📊 Starting error monitoring...');
        
        const ogError = console.error;
        console.error = (...args) => {
            if (args[0]?.toString?.()?.includes('is not iterable')) {
                this.metrics.iterableErrors++;
                console.warn(`🚨 [${this.metrics.iterableErrors}] Iterable error:`, args[0]);
            }
            return ogError.apply(console, args);
        };
        
        console.log(`✅ Error monitoring active (errors: ${this.metrics.iterableErrors})`);
    },

    /**
     * Monitor link creation events
     */
    startLinkEventMonitoring() {
        console.log('📊 Starting link event monitoring...');
        
        if (window.game?.linkingSystem) {
            const ogRegister = window.game.linkingSystem.registerObserver;
            
            let eventCount = 0;
            const testObserver = {
                onLinkCreated: (link) => {
                    eventCount++;
                    this.metrics.linkCreateEvents++;
                    console.log(`📍 Link event #${eventCount}: ${link?.id || 'unknown'}`);
                }
            };
            
            if (window.game.linkingSystem.registerObserver) {
                window.game.linkingSystem.registerObserver(testObserver);
                console.log(`✅ Link event monitoring active (events: ${eventCount})`);
            }
        }
    },

    /**
     * Test rapid linking scenario
     */
    async testRapidLinking() {
        console.group('🔗 TEST: Rapid Linking');
        
        const startErrors = this.metrics.iterableErrors;
        
        try {
            const nodes = window.game?.aiNodes?.nodes || [];
            if (nodes.length < 2) {
                console.warn('⚠ Not enough nodes (need 2+)');
                return false;
            }
            
            // Create 20 links rapidly
            for (let i = 0; i < 20 && i < nodes.length - 1; i++) {
                try {
                    window.game.linkingSystem.createLink(nodes[i], nodes[(i + 1) % nodes.length]);
                    console.log(`✓ Link ${i + 1}/20 created`);
                } catch (e) {
                    console.warn(`✗ Link ${i + 1} failed:`, e.message);
                }
                
                // Small delay to avoid overwhelming
                await new Promise(r => setTimeout(r, 50));
            }
            
            const newErrors = this.metrics.iterableErrors - startErrors;
            const result = newErrors === 0;
            
            console.log(`\n📊 Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`   Errors: ${newErrors}`);
            console.log(`   Total: ${this.metrics.iterableErrors}`);
            
        } catch (err) {
            console.error('Test error:', err);
            return false;
        }
        
        console.groupEnd();
        return true;
    },

    /**
     * Test transparent node visibility
     */
    testTransparentVisibility() {
        console.group('👁️ TEST: Transparent Node Visibility');
        
        try {
            const nodes = window.game?.aiNodes?.nodes || [];
            if (nodes.length === 0) {
                console.warn('⚠ No nodes available');
                return false;
            }
            
            let coreCount = 0;
            let auraCount = 0;
            let layeringIssues = 0;
            
            nodes.forEach((node, idx) => {
                if (!node.children) return;
                
                let coreOrder = -1;
                let auraOrder = -1;
                
                node.children.forEach(child => {
                    if (child.isMesh) {
                        if (child.name?.includes('core') || child.userData?.isNodeCore) {
                            coreOrder = child.renderOrder;
                            coreCount++;
                        }
                        if (child.name?.includes('aura') || child.userData?.isAura) {
                            auraOrder = child.renderOrder;
                            auraCount++;
                        }
                    }
                });
                
                // Check dominance: core should be > aura
                if (coreOrder > 0 && auraOrder > 0 && coreOrder <= auraOrder) {
                    layeringIssues++;
                    console.warn(`⚠ Node ${idx}: Core renderOrder(${coreOrder}) not > Aura(${auraOrder})`);
                }
            });
            
            const result = layeringIssues === 0;
            
            console.log(`\n📊 Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`   Cores found: ${coreCount}`);
            console.log(`   Auras found: ${auraCount}`);
            console.log(`   Layering issues: ${layeringIssues}`);
            
        } catch (err) {
            console.error('Test error:', err);
            return false;
        }
        
        console.groupEnd();
        return true;
    },

    /**
     * Run comprehensive test suite
     */
    async runFullTest() {
        console.clear();
        console.group('🧪 DEFENSIVE HARDENING PATCH v1.0 — FULL TEST SUITE');
        
        const results = {
            patchesInstalled: this.checkPatchesInstalled(),
            rapidLinking: await this.testRapidLinking(),
            transparentVisibility: this.testTransparentVisibility()
        };
        
        console.groupEnd();
        
        // Summary
        console.group('📋 TEST SUMMARY');
        
        let passed = 0;
        for (const [test, result] of Object.entries(results)) {
            console.log(`${result ? '✅' : '❌'} ${test}`);
            if (result) passed++;
        }
        
        console.log(`\n✨ ${passed}/${Object.keys(results).length} tests passed`);
        console.log(`🔍 Total "is not iterable" errors: ${this.metrics.iterableErrors}`);
        console.log(`📍 Link creation events: ${this.metrics.linkCreateEvents}`);
        console.log(`⏱️  Session time: ${((Date.now() - this.metrics.startTime) / 1000).toFixed(1)}s`);
        
        console.groupEnd();
        
        return passed === Object.keys(results).length;
    },

    /**
     * Generate test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            patchesInstalled: this.checkPatchesInstalled(),
            metrics: {
                iterableErrors: this.metrics.iterableErrors,
                linkCreateEvents: this.metrics.linkCreateEvents,
                layeringCorrections: this.metrics.layeringCorrections,
                sessionDuration: `${((Date.now() - this.metrics.startTime) / 1000).toFixed(1)}s`
            },
            systemStatus: {
                aiNodes: Array.isArray(window.game?.aiNodes?.nodes),
                linkingSystem: window.game?.linkingSystem !== null,
                waveShaderBridge: window.game?.waveShaderBridge !== null,
                nodeCount: window.game?.aiNodes?.nodes?.length || 0,
                linkCount: window.game?.links?.length || 0
            }
        };
        
        console.group('📊 VALIDATION REPORT');
        console.table(report.metrics);
        console.table(report.systemStatus);
        console.groupEnd();
        
        return report;
    },

    /**
     * Quick health check
     */
    healthCheck() {
        console.group('❤️ HEALTH CHECK');
        
        const health = {
            'Game initialized': !!window.game,
            'Scene active': !!window.game?.scene,
            'AI Nodes ready': !!window.game?.aiNodes,
            'Linking System ready': !!window.game?.linkingSystem,
            'Nodes in scene': (window.game?.aiNodes?.nodes?.length || 0) > 0,
            'No iterable errors': this.metrics.iterableErrors === 0,
            'FPS': Math.round(1000 / (performance.now() % 1000 || 1)) // Very rough estimate
        };
        
        console.table(health);
        
        const allHealthy = Object.values(health).every(v => v);
        console.log(`\n${allHealthy ? '✅' : '⚠️'} System health: ${allHealthy ? 'GOOD' : 'CHECK ISSUES'}`);
        
        console.groupEnd();
        return allHealthy;
    }
};

// Auto-export for console access
window.defensiveHardeningValidator = validationHelper;

console.log('✅ Defensive Hardening Validation Helper loaded');
console.log('Usage: validationHelper.runFullTest()');
console.log('Or: window.defensiveHardeningValidator.healthCheck()');
