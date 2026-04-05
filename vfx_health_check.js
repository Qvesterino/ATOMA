
// === VFX HEALTH CHECK TOOL ===
// Generated: 2026-04-04T21:52:44.523376

class VFXHealthCheck {
    constructor() {
        this.healthResults = [];
        this.systems = [];
        this.issues = [];
    }

    // Run full health check
    runCheck() {
        console.log('\n=== VFX HEALTH CHECK ===\n');

        // Check core systems
        this.checkCoreSystems();

        // Check renderer
        this.checkRenderer();

        // Check scene
        this.checkScene();

        // Check performance
        this.checkPerformance();

        // Check memory
        this.checkMemory();

        // Print summary
        this.printSummary();

        return this.getHealthReport();
    }

    // Check core systems
    checkCoreSystems() {
        console.log('Checking Core Systems...');

        const coreSystems = [
            { name: 'MetricsRuntime', ref: window.metricsRuntime, required: true },
            { name: 'FrameScheduler', ref: window.frameScheduler, required: true },
            { name: 'NodeLinkingSystem', ref: window.nodeLinkingSystem, required: true },
            { name: 'VisualHierarchyRegistry', ref: window.visualHierarchyRegistry, required: true },
            { name: 'LinkRendererConduit', ref: window.linkRendererConduit, required: false }
        ];

        for (const system of coreSystems) {
            const status = system.ref ? '✓ OK' : (system.required ? '✗ MISSING' : '⚠️  OPTIONAL');
            const result = {
                category: 'Core Systems',
                check: system.name,
                status: system.ref ? 'ok' : (system.required ? 'error' : 'warning'),
                message: system.ref ? 'Available' : 'Not found' + (system.required ? ' (Required)' : ' (Optional)')
            };

            this.healthResults.push(result);
            this.systems.push({ ...system, available: !!system.ref });

            console.log(`  ${status} ${system.name}`);
        }

        console.log('');
    }

    // Check renderer
    checkRenderer() {
        console.log('Checking Renderer...');

        if (!window.renderer) {
            const result = {
                category: 'Renderer',
                check: 'Renderer availability',
                status: 'error',
                message: 'Renderer not found'
            };
            this.healthResults.push(result);
            console.log('  ✗ Renderer not found');
            return;
        }

        console.log(`  ✓ Renderer available`);

        // Check renderer info
        const info = window.renderer.info;
        console.log(`  - Render calls: ${info.render.calls}`);
        console.log(`  - Triangles: ${info.render.triangles}`);
        console.log(`  - Points: ${info.render.points}`);
        console.log(`  - Programs: ${info.programs?.length || 0}`);

        // Check memory
        const memory = window.renderer.info.memory;
        console.log(`  - Geometries: ${memory.geometries}`);
        console.log(`  - Textures: ${memory.textures}`);

        // Check for potential memory leaks
        if (memory.geometries > 1000) {
            const result = {
                category: 'Renderer',
                check: 'Geometry count',
                status: 'warning',
                message: `High geometry count: ${memory.geometries}`
            };
            this.healthResults.push(result);
            this.issues.push(result);
            console.log(`  ⚠️  High geometry count: ${memory.geometries}`);
        }

        if (memory.textures > 500) {
            const result = {
                category: 'Renderer',
                check: 'Texture count',
                status: 'warning',
                message: `High texture count: ${memory.textures}`
            };
            this.healthResults.push(result);
            this.issues.push(result);
            console.log(`  ⚠️  High texture count: ${memory.textures}`);
        }

        console.log('');
    }

    // Check scene
    checkScene() {
        console.log('Checking Scene...');

        if (!window.scene) {
            const result = {
                category: 'Scene',
                check: 'Scene availability',
                status: 'error',
                message: 'Scene not found'
            };
            this.healthResults.push(result);
            console.log('  ✗ Scene not found');
            return;
        }

        console.log(`  ✓ Scene available`);

        // Count objects
        let objectCount = 0;
        let meshCount = 0;
        let particleCount = 0;

        window.scene.traverse((obj) => {
            objectCount++;
            if (obj.isMesh) meshCount++;
            if (obj.isPoints) particleCount++;
        });

        console.log(`  - Total objects: ${objectCount}`);
        console.log(`  - Meshes: ${meshCount}`);
        console.log(`  - Particles: ${particleCount}`);

        const result = {
            category: 'Scene',
            check: 'Scene structure',
            status: 'ok',
            message: `${objectCount} objects ({meshCount} meshes, ${particleCount} particles)`
        };
        this.healthResults.push(result);

        console.log('');
    }

    // Check performance
    checkPerformance() {
        console.log('Checking Performance...');

        // Check FPS
        if (window.__PERFORMANCE_SNAPSHOT__) {
            const snapshot = window.__PERFORMANCE_SNAPSHOT__.currentSnapshot;
            if (snapshot && snapshot.fps > 0) {
                console.log(`  ✓ FPS: ${snapshot.fps.toFixed(1)}`);
                console.log(`  - Frame time: ${snapshot.frameTime.toFixed(2)}ms`);

                const status = snapshot.fps >= 30 ? 'ok' : (snapshot.fps >= 20 ? 'warning' : 'error');
                const result = {
                    category: 'Performance',
                    check: 'FPS',
                    status,
                    message: `${snapshot.fps.toFixed(1)} FPS ({snapshot.frameTime.toFixed(2)}ms per frame)`
                };
                this.healthResults.push(result);

                if (status !== 'ok') {
                    this.issues.push(result);
                }
            }
        } else {
            console.log('  ⚠️  Performance snapshot not available');
        }

        console.log('');
    }

    // Check memory
    checkMemory() {
        console.log('Checking Memory...');

        if (performance.memory) {
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
            const percent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);

            console.log(`  ✓ Used: ${used} MB / ${total} MB`);
            console.log(`  - Limit: ${limit} MB (${percent}%)`);

            const status = percent < 80 ? 'ok' : (percent < 90 ? 'warning' : 'error');
            const result = {
                category: 'Memory',
                check: 'Heap usage',
                status,
                message: `${used} MB / ${limit} MB ({percent}%)`
            };
            this.healthResults.push(result);

            if (status !== 'ok') {
                this.issues.push(result);
            }
        } else {
            console.log('  ⚠️  Memory API not available');
        }

        console.log('');
    }

    // Get health report
    getHealthReport() {
        const ok = this.healthResults.filter(r => r.status === 'ok').length;
        const warnings = this.healthResults.filter(r => r.status === 'warning').length;
        const errors = this.healthResults.filter(r => r.status === 'error').length;

        return {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.healthResults.length,
                ok,
                warnings,
                errors,
                overallStatus: errors > 0 ? 'error' : (warnings > 0 ? 'warning' : 'ok')
            },
            results: this.healthResults,
            systems: this.systems,
            issues: this.issues
        };
    }

    // Print summary
    printSummary() {
        const report = this.getHealthReport();

        console.log('=== HEALTH CHECK SUMMARY ===');
        console.log(`Total checks: ${report.summary.total}`);
        console.log(`✓ OK: ${report.summary.ok}`);
        console.log(`⚠️  Warnings: ${report.summary.warnings}`);
        console.log(`✗ Errors: ${report.summary.errors}`);

        const statusEmoji = report.summary.overallStatus === 'ok' ? '✓' :
                          (report.summary.overallStatus === 'warning' ? '⚠️' : '✗');
        console.log(`\nOverall Status: ${statusEmoji} ${report.summary.overallStatus.toUpperCase()}`);

        if (this.issues.length > 0) {
            console.log('\nIssues Found:');
            for (const issue of this.issues) {
                console.log(`  - [${issue.category}] ${issue.message}`);
            }
        }

        console.log('==========================\n');
    }

    // Export report
    exportReport() {
        return JSON.stringify(this.getHealthReport(), null, 2);
    }

    // Clear results
    clear() {
        this.healthResults = [];
        this.systems = [];
        this.issues = [];
        console.log('[VFX Health Check] Cleared');
    }
}

// Auto-load in browser
if (typeof window !== 'undefined') {
    window.__VFX_HEALTH_CHECK__ = new VFXHealthCheck();

    // Expose API
    window.runVFXHealthCheck = () => window.__VFX_HEALTH_CHECK__.runCheck();
    window.getVFXHealthReport = () => window.__VFX_HEALTH_CHECK__.getHealthReport();
    window.exportVFXHealthReport = () => window.__VFX_HEALTH_CHECK__.exportReport();
    window.clearVFXHealthCheck = () => window.__VFX_HEALTH_CHECK__.clear();

    console.log('VFX Health Check tool loaded.');
    console.log('API: window.runVFXHealthCheck(), window.getVFXHealthReport()');
    console.log('Usage:');
    console.log('  window.runVFXHealthCheck()');
    console.log('  window.exportVFXHealthReport()');
}
