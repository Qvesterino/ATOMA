#!/usr/bin/env python3
"""
Performance Snapshot - Quick Performance Snapshots

Generates browser-based performance snapshot tool for quick performance checks.
Measures FPS, frame time, and system health.

Usage:
    python performance_snapshot.py generate           # Generate snapshot tool
    python performance_snapshot.py report             # Generate performance report
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime


class PerformanceSnapshotGenerator:
    """Generates browser-based performance snapshot tool."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        this.vfx_systems = []

    def analyze_vfx_systems(self) -> None:
        """Analyze VFX systems for performance monitoring."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime", "LEGACY"])]

        print(f"Analyzing {len(js_files)} files for VFX systems...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.vfx_systems)} VFX systems to monitor")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single file for VFX systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find VFX classes
            pattern = r'class\s+(\w*(?:Visual|System|FX|Particle|Renderer|Tracker|Manager|Emitter|Animator))\s*\{'
            matches = re.finditer(pattern, content, re.IGNORECASE)

            for match in matches:
                name = match.group(1)

                # Check if it's a VFX system
                if self._is_vfx_system(name, content):
                    this.vfx_systems.append({
                        "name": name,
                        "file": file_path.name
                    })

        except Exception as e:
            pass  # Silent for quick scan

    def _is_vfx_system(self, name: str, content: str) -> bool:
        """Quick check if it's an actual VFX system."""
        vfx_keywords = ['visual', 'vfx', 'particle', 'render', 'mesh', 'geometry',
                       'material', 'shader', 'three', 'scene', 'camera', 'light']

        content_lower = content.lower()
        has_keyword = any(kw in content_lower for kw in vfx_keywords)
        has_vfx_in_name = any(kw in name.lower() for kw in ['visual', 'vfx', 'fx', 'particle', 'render'])

        return has_keyword and (has_vfx_in_name or 'System' in name or 'Manager' in name)

    def generate_snapshot_tool(self) -> str:
        """Generate browser-based performance snapshot tool."""
        system_names = [s['name'] for s in this.vfx_systems]

        return f"""
// === PERFORMANCE SNAPSHOT TOOL ===
// Generated: {datetime.now().isoformat()}

class PerformanceSnapshot {{
    constructor() {{
        this.snapshots = [];
        this.currentSnapshot = null;
        this.monitoringActive = false;
        this.monitorInterval = null;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.frameTimes = [];
        this.fpsHistory = [];
    }}

    // Take a single performance snapshot
    takeSnapshot(label = null) {{
        const now = performance.now();

        this.currentSnapshot = {{
            timestamp: now,
            timestampISO: new Date().toISOString(),
            relativeTime: now - this.startTime,
            label: label || `Snapshot ${{this.snapshots.length + 1}}`,
            fps: this.calculateFPS(),
            frameTime: this.calculateFrameTime(),
            memory: this.getMemoryInfo(),
            rendering: this.getRenderingInfo(),
            scene: this.getSceneInfo(),
            systems: this.getSystemsInfo()
        }};

        this.snapshots.push(this.currentSnapshot);
        this.frameTimes = []; // Clear frame times after snapshot
        this.fpsHistory = []; // Clear FPS history

        console.log('[Performance Snapshot] Snapshot taken:', this.currentSnapshot.label);
        return this.currentSnapshot;
    }}

    // Calculate current FPS
    calculateFPS() {{
        if (this.fpsHistory.length === 0) return 0;
        const avgFrameTime = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }}

    // Calculate current frame time
    calculateFrameTime() {{
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }}

    // Get memory info
    getMemoryInfo() {{
        if (performance.memory) {{
            return {{
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            }};
        }}
        return {{ error: 'Memory API not available' }};
    }}

    // Get rendering info
    getRenderingInfo() {{
        if (!window.renderer) return {{ error: 'Renderer not available' }};

        return {{
            renders: window.renderer.info.render.calls,
            triangles: window.renderer.info.render.triangles,
            points: window.renderer.info.render.points,
            lines: window.renderer.info.render.lines,
            programs: window.renderer.info.programs?.length || 0,
            geometries: window.renderer.info.memory.geometries,
            textures: window.renderer.info.memory.textures
        }};
    }}

    // Get scene info
    getSceneInfo() {{
        const info = {{ totalObjects: 0, types: {{}} }};

        if (window.scene) {{
            window.scene.traverse((obj) => {{
                info.totalObjects++;
                const type = obj.type;
                info.types[type] = (info.types[type] || 0) + 1;
            }});
        }}

        return info;
    }}

    // Get systems info
    getSystemsInfo() {{
        const systems = [];

        // Check for common ATOMA systems
        const systemChecks = [
            {{ name: 'MetricsRuntime', check: () => !!window.metricsRuntime }},
            {{ name: 'FrameScheduler', check: () => !!window.frameScheduler }},
            {{ name: 'NodeLinkingSystem', check: () => !!window.nodeLinkingSystem }},
            {{ name: 'LinkRendererConduit', check: () => window.activeLinks?.length >= 0 }},
            {{ name: 'VisualHierarchyRegistry', check: () => !!window.visualHierarchyRegistry }}
        ];

        for (const {{ name, check }} of systemChecks) {{
            systems.push({{ name, active: check() }});
        }}

        return systems;
    }}

    // Start continuous monitoring
    startMonitoring(intervalMs = 1000) {{
        if (this.monitoringActive) {{
            console.warn('[Performance Snapshot] Monitoring already active');
            return;
        }}

        this.monitoringActive = true;
        this.monitorInterval = setInterval(() => {{
            this.takeSnapshot(`Auto ${{this.snapshots.length + 1}}`);
        }}, intervalMs);

        console.log(`[Performance Snapshot] Started monitoring (interval: ${{intervalMs}}ms)`);
    }}

    // Stop continuous monitoring
    stopMonitoring() {{
        if (!this.monitoringActive) return;

        clearInterval(this.monitorInterval);
        this.monitoringActive = false;
        this.monitorInterval = null;

        console.log('[Performance Snapshot] Stopped monitoring');
    }}

    // Compare two snapshots
    compareSnapshots(snapshot1, snapshot2) {{
        if (!snapshot1 || !snapshot2) {{
            console.error('[Performance Snapshot] Cannot compare - missing snapshots');
            return null;
        }}

        const comparison = {{
            timeDelta: snapshot2.timestamp - snapshot1.timestamp,
            fpsDelta: snapshot2.fps - snapshot1.fps,
            frameTimeDelta: snapshot2.frameTime - snapshot1.frameTime,
            objectCountDelta: snapshot2.scene.totalObjects - snapshot1.scene.totalObjects
        }};

        // Memory delta if available
        if (snapshot1.memory.usedJSHeapSize && snapshot2.memory.usedJSHeapSize) {{
            const mem1 = parseFloat(snapshot1.memory.usedJSHeapSize);
            const mem2 = parseFloat(snapshot2.memory.usedJSHeapSize);
            comparison.memoryDelta = mem2 - mem1;
        }}

        return comparison;
    }}

    // Get performance summary
    getSummary() {{
        if (this.snapshots.length === 0) {{
            return {{ error: 'No snapshots taken' }};
        }}

        const fpsValues = this.snapshots.map(s => s.fps).filter(v => v > 0);
        const frameTimeValues = this.snapshots.map(s => s.frameTime).filter(v => v > 0);

        return {{
            totalSnapshots: this.snapshots.length,
            duration: this.snapshots[this.snapshots.length - 1].relativeTime,
            fps: {{
                avg: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length || 0,
                min: Math.min(...fpsValues) || 0,
                max: Math.max(...fpsValues) || 0
            }},
            frameTime: {{
                avg: frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length || 0,
                min: Math.min(...frameTimeValues) || 0,
                max: Math.max(...frameTimeValues) || 0
            }},
            firstSnapshot: this.snapshots[0],
            lastSnapshot: this.snapshots[this.snapshots.length - 1]
        }};
    }}

    // Print summary
    printSummary() {{
        const summary = this.getSummary();

        if (summary.error) {{
            console.error(summary.error);
            return;
        }}

        console.log('\\n=== PERFORMANCE SUMMARY ===');
        console.log(`Duration: ${{(summary.duration / 1000).toFixed(2)}}s`);
        console.log(`Snapshots: ${{summary.totalSnapshots}}`);

        console.log('\\nFPS:');
        console.log(`  Average: ${{summary.fps.avg.toFixed(1)}}`);
        console.log(`  Min: ${{summary.fps.min.toFixed(1)}}`);
        console.log(`  Max: ${{summary.fps.max.toFixed(1)}}`);

        console.log('\\nFrame Time (ms):');
        console.log(`  Average: ${{summary.frameTime.avg.toFixed(2)}}`);
        console.log(`  Min: ${{summary.frameTime.min.toFixed(2)}}`);
        console.log(`  Max: ${{summary.frameTime.max.toFixed(2)}}`);

        console.log('===========================\\n');
    }}

    // Export all snapshots
    exportSnapshots() {{
        return {{
            timestamp: new Date().toISOString(),
            summary: this.getSummary(),
            snapshots: this.snapshots
        }};
    }}

    // Clear all snapshots
    clear() {{
        this.snapshots = [];
        this.currentSnapshot = null;
        this.startTime = performance.now();
        this.frameCount = 0;
        this.frameTimes = [];
        this.fpsHistory = [];

        console.log('[Performance Snapshot] Cleared all snapshots');
    }}

    // Track frame (call this in animation loop)
    trackFrame() {{
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > 60) {{
            this.frameTimes.shift();
        }}

        this.fpsHistory.push(frameTime);
        if (this.fpsHistory.length > 60) {{
            this.fpsHistory.shift();
        }}

        this.frameCount++;
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
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
    if (window.requestAnimationFrame) {{
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {{
            return originalRAF.call(window, function(timestamp) {{
                if (window.__PERFORMANCE_SNAPSHOT__) {{
                    window.__PERFORMANCE_SNAPSHOT__.trackFrame();
                }}
                return callback(timestamp);
            }});
        }};
    }}

    console.log('Performance Snapshot tool loaded.');
    console.log('API: window.takeSnapshot(), window.startMonitoring(), window.printPerformanceSummary()');
    console.log('Usage:');
    console.log('  window.takeSnapshot("Before test")');
    console.log('  // ... run test ...');
    console.log('  window.takeSnapshot("After test")');
    console.log('  window.printPerformanceSummary()');
    console.log('\\nAuto-monitoring:');
    console.log('  window.startMonitoring(1000)  // 1 second interval');
    console.log('  // ... wait ...');
    console.log('  window.stopMonitoring()');
    console.log('  window.printPerformanceSummary()');
}}
"""

    def generate_report(self) -> str:
        """Generate performance monitoring report."""
        lines = []
        lines.append("=" * 70)
        lines.append("PERFORMANCE SNAPSHOT TOOL")
        lines.append("=" * 70)
        lines.append("")

        lines.append("VFX SYSTEMS MONITORED")
        lines.append("-" * 70)
        for system in this.vfx_systems:
            lines.append(f"  {system['name']}")
            lines.append(f"    File: {system['file']}")
        lines.append("")

        lines.append("USAGE")
        lines.append("-" * 70)
        lines.append("1. Generate snapshot tool:")
        lines.append("   python performance_snapshot.py generate")
        lines.append("")
        lines.append("2. Load performance_snapshot.js in browser")
        lines.append("")
        lines.append("3. Take single snapshot:")
        lines.append("   window.takeSnapshot('Before VFX')")
        lines.append("   // ... trigger VFX ...")
        lines.append("   window.takeSnapshot('After VFX')")
        lines.append("")
        lines.append("4. Auto-monitoring:")
        lines.append("   window.startMonitoring(1000)  // 1s interval")
        lines.append("   // ... wait ...")
        lines.append("   window.stopMonitoring()")
        lines.append("")
        lines.append("5. View results:")
        lines.append("   window.printPerformanceSummary()")
        lines.append("   window.exportPerformanceSnapshots()")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Performance Snapshot')
    parser.add_argument('command', choices=['generate', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', default='performance_snapshot.js',
                       help='Output file for snapshot tool')

    args = parser.parse_args()

    generator = PerformanceSnapshotGenerator(args.workspace)

    if args.command == 'generate':
        generator.analyze_vfx_systems()

        snapshot_code = generator.generate_snapshot_tool()
        output_path = generator.workspace_root / args.output

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(snapshot_code)

        print(f"Performance snapshot tool generated: {args.output}")
        print("\nUsage:")
        print("1. Load performance_snapshot.js in browser")
        print("2. Take snapshot: window.takeSnapshot('Test')")
        print("3. Or auto-monitor: window.startMonitoring(1000)")
        print("4. View results: window.printPerformanceSummary()")

    elif args.command == 'report':
        generator.analyze_vfx_systems()
        print("\n" + generator.generate_report())


if __name__ == '__main__':
    main()
