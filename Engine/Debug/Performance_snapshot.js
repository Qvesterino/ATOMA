
// === PERFORMANCE SNAPSHOT TOOL ===
// Generated: 2026-04-04T21:52:55.183623

class PerformanceSnapshot {
    constructor() {
        this.snapshots = [];
        this.currentSnapshot = null;
        this.monitoringActive = false;
        this.monitorInterval = null;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.frameTimes = [];
        this.fpsHistory = [];
    }

    // Take a single performance snapshot
    takeSnapshot(label = null) {
        const now = performance.now();

        this.currentSnapshot = {
            timestamp: now,
            timestampISO: new Date().toISOString(),
            relativeTime: now - this.startTime,
            label: label || `Snapshot ${this.snapshots.length + 1}`,
            fps: this.calculateFPS(),
            frameTime: this.calculateFrameTime(),
            memory: this.getMemoryInfo(),
            rendering: this.getRenderingInfo(),
            scene: this.getSceneInfo(),
            systems: this.getSystemsInfo()
        };

        this.snapshots.push(this.currentSnapshot);
        this.frameTimes = []; // Clear frame times after snapshot
        this.fpsHistory = []; // Clear FPS history

        console.log('[Performance Snapshot] Snapshot taken:', this.currentSnapshot.label);
        return this.currentSnapshot;
    }

    // Calculate current FPS
    calculateFPS() {
        if (this.fpsHistory.length === 0) return 0;
        const avgFrameTime = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    // Calculate current frame time
    calculateFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }

    // Get memory info
    getMemoryInfo() {
        if (performance.memory) {
            return {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return { error: 'Memory API not available' };
    }

    // Get rendering info
    getRenderingInfo() {
        if (!window.renderer) return { error: 'Renderer not available' };

        return {
            renders: window.renderer.info.render.calls,
            triangles: window.renderer.info.render.triangles,
            points: window.renderer.info.render.points,
            lines: window.renderer.info.render.lines,
            programs: window.renderer.info.programs?.length || 0,
            geometries: window.renderer.info.memory.geometries,
            textures: window.renderer.info.memory.textures
        };
    }

    // Get scene info
    getSceneInfo() {
        const info = { totalObjects: 0, types: {} };

        if (window.scene) {
            window.scene.traverse((obj) => {
                info.totalObjects++;
                const type = obj.type;
                info.types[type] = (info.types[type] || 0) + 1;
            });
        }

        return info;
    }

    // Get systems info
    getSystemsInfo() {
        const systems = [];

        // Check for common ATOMA systems
        const systemChecks = [
            { name: 'MetricsRuntime', check: () => !!window.metricsRuntime },
            { name: 'FrameScheduler', check: () => !!window.frameScheduler },
            { name: 'NodeLinkingSystem', check: () => !!window.nodeLinkingSystem },
            { name: 'LinkRendererConduit', check: () => window.activeLinks?.length >= 0 },
            { name: 'VisualHierarchyRegistry', check: () => !!window.visualHierarchyRegistry }
        ];

        for (const { name, check } of systemChecks) {
            systems.push({ name, active: check() });
        }

        return systems;
    }

    // Start continuous monitoring
    startMonitoring(intervalMs = 1000) {
        if (this.monitoringActive) {
            console.warn('[Performance Snapshot] Monitoring already active');
            return;
        }

        this.monitoringActive = true;
        this.monitorInterval = setInterval(() => {
            this.takeSnapshot(`Auto ${this.snapshots.length + 1}`);
        }, intervalMs);

        console.log(`[Performance Snapshot] Started monitoring (interval: ${intervalMs}ms)`);
    }

    // Stop continuous monitoring
    stopMonitoring() {
        if (!this.monitoringActive) return;

        clearInterval(this.monitorInterval);
        this.monitoringActive = false;
        this.monitorInterval = null;

        console.log('[Performance Snapshot] Stopped monitoring');
    }

    // Compare two snapshots
    compareSnapshots(snapshot1, snapshot2) {
        if (!snapshot1 || !snapshot2) {
            console.error('[Performance Snapshot] Cannot compare - missing snapshots');
            return null;
        }

        const comparison = {
            timeDelta: snapshot2.timestamp - snapshot1.timestamp,
            fpsDelta: snapshot2.fps - snapshot1.fps,
            frameTimeDelta: snapshot2.frameTime - snapshot1.frameTime,
            objectCountDelta: snapshot2.scene.totalObjects - snapshot1.scene.totalObjects
        };

        // Memory delta if available
        if (snapshot1.memory.usedJSHeapSize && snapshot2.memory.usedJSHeapSize) {
            const mem1 = parseFloat(snapshot1.memory.usedJSHeapSize);
            const mem2 = parseFloat(snapshot2.memory.usedJSHeapSize);
            comparison.memoryDelta = mem2 - mem1;
        }

        return comparison;
    }

    // Get performance summary
    getSummary() {
        if (this.snapshots.length === 0) {
            return { error: 'No snapshots taken' };
        }

        const fpsValues = this.snapshots.map(s => s.fps).filter(v => v > 0);
        const frameTimeValues = this.snapshots.map(s => s.frameTime).filter(v => v > 0);

        return {
            totalSnapshots: this.snapshots.length,
            duration: this.snapshots[this.snapshots.length - 1].relativeTime,
            fps: {
                avg: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length || 0,
                min: Math.min(...fpsValues) || 0,
                max: Math.max(...fpsValues) || 0
            },
            frameTime: {
                avg: frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length || 0,
                min: Math.min(...frameTimeValues) || 0,
                max: Math.max(...frameTimeValues) || 0
            },
            firstSnapshot: this.snapshots[0],
            lastSnapshot: this.snapshots[this.snapshots.length - 1]
        };
    }

    // Print summary
    printSummary() {
        const summary = this.getSummary();

        if (summary.error) {
            console.error(summary.error);
            return;
        }

        console.log('\n=== PERFORMANCE SUMMARY ===');
        console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
        console.log(`Snapshots: ${summary.totalSnapshots}`);

        console.log('\nFPS:');
        console.log(`  Average: ${summary.fps.avg.toFixed(1)}`);
        console.log(`  Min: ${summary.fps.min.toFixed(1)}`);
        console.log(`  Max: ${summary.fps.max.toFixed(1)}`);

        console.log('\nFrame Time (ms):');
        console.log(`  Average: ${summary.frameTime.avg.toFixed(2)}`);
        console.log(`  Min: ${summary.frameTime.min.toFixed(2)}`);
        console.log(`  Max: ${summary.frameTime.max.toFixed(2)}`);

        console.log('===========================\n');
    }

    // Export all snapshots
    exportSnapshots() {
        return {
            timestamp: new Date().toISOString(),
            summary: this.getSummary(),
            snapshots: this.snapshots
        };
    }

    // Clear all snapshots
    clear() {
        this.snapshots = [];
        this.currentSnapshot = null;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.frameTimes = [];
        this.fpsHistory = [];

        console.log('[Performance Snapshot] Cleared all snapshots');
    }

    // Track frame (call this in animation loop)
    trackFrame() {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }

        this.fpsHistory.push(frameTime);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }

        this.frameCount++;
    }
}

// Auto-load in browser
if (typeof window !== 'undefined') {
    window.__PERFORMANCE_SNAPSHOT__ = new PerformanceSnapshot();

    // Expose API
    window.takeSnapshot = (label) => window.__PERFORMANCE_SNAPSHOT__.takeSnapshot(label);
    window.startMonitoring = (interval) => window.__PERFORMANCE_SNAPSHOT__.startMonitoring(interval);
    window.stopMonitoring = () => window.__PERFORMANCE_SNAPSHOT__.stopMonitoring();
    window.compareSnapshots = (s1, s2) => window.__PERFORMANCE_SNAPSHOT__.compareSnapshots(s1, s2);
    window.printPerformanceSummary = () => window.__PERFORMANCE_SNAPSHOT__.printSummary();
    window.exportPerformanceSnapshots = () => window.__PERFORMANCE_SNAPSHOT__.exportSnapshots();
    window.clearPerformanceSnapshots = () => window.__PERFORMANCE_SNAPSHOT__.clear();
    window.trackPerformanceFrame = () => window.__PERFORMANCE_SNAPSHOT__.trackFrame();

    // Auto-track frames if possible
    if (window.requestAnimationFrame) {
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, function(timestamp) {
                if (window.__PERFORMANCE_SNAPSHOT__) {
                    window.__PERFORMANCE_SNAPSHOT__.trackFrame();
                }
                return callback(timestamp);
            });
        };
    }

    console.log('Performance Snapshot tool loaded.');
    console.log('API: window.takeSnapshot(), window.startMonitoring(), window.printPerformanceSummary()');
    console.log('Usage:');
    console.log('  window.takeSnapshot("Before test")');
    console.log('  // ... run test ...');
    console.log('  window.takeSnapshot("After test")');
    console.log('  window.printPerformanceSummary()');
    console.log('\nAuto-monitoring:');
    console.log('  window.startMonitoring(1000)  // 1 second interval');
    console.log('  // ... wait ...');
    console.log('  window.stopMonitoring()');
    console.log('  window.printPerformanceSummary()');
}
