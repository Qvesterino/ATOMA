#!/usr/bin/env python3
"""
VFX Performance Profiler - ATOMA VFX Performance Analysis Tool

Profiles VFX runtime performance and identifies expensive systems.
Adds performance.now() wrappers and provides runtime API.

Usage:
    python vfx_performance_profiler.py analyze               # Analyze VFX systems
    python vfx_performance_profiler.py generate-profiler      # Generate profiler code
    python vfx_performance_profiler.py report                 # Generate performance report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime


class VFXPerformanceProfiler:
    """Profiles VFX system performance and generates instrumentation."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems = []

    def analyze_directory(self, directory: str = None) -> None:
        """Analyze all JS files for VFX systems with update methods."""
        if directory is None:
            directory = self.workspace_root

        js_files = list(Path(directory).rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} JavaScript files for VFX update methods...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.vfx_systems)} VFX systems with update methods")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single JS file for VFX systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find VFX classes
            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)

            for match in class_matches:
                class_name = match.group(1)

                if self._is_vfx_system(class_name):
                    # Find the class body
                    brace_count = 0
                    class_body_start = match.end()
                    class_body = ""
                    for i in range(class_body_start, len(content)):
                        if content[i] == '{':
                            brace_count += 1
                        elif content[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                class_body = content[class_body_start:i]
                                break

                    # Find update method
                    update_match = re.search(r'update\s*\(([^)]*)\)\s*\{', class_body)
                    if update_match:
                        update_params = update_match.group(1)
                        update_body = self._extract_method_body(class_body, update_match.end())

                        self.vfx_systems.append({
                            "file_path": str(file_path),
                            "class_name": class_name,
                            "update_params": update_params,
                            "update_body": update_body,
                            "has_profiler": 'VFX_PERFORMANCE_PROFILER' in class_body or '__PERF_TRACK' in class_body
                        })

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _is_vfx_system(self, class_name: str) -> bool:
        """Check if class name indicates a VFX system."""
        vfx_keywords = [
            "Visualizer", "ParticleSystem", "Cascade", "Resonance",
            "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
            "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura",
            "Flux", "Emitter", "Renderer"
        ]
        class_name_lower = class_name.lower()
        return any(keyword.lower() in class_name_lower for keyword in vfx_keywords)

    def _extract_method_body(self, class_body: str, start_pos: int) -> str:
        """Extract the body of a method starting at position."""
        brace_count = 0
        body_start = start_pos
        body_end = body_start

        for i in range(body_start, len(class_body)):
            if class_body[i] == '{':
                brace_count += 1
            elif class_body[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    body_end = i + 1
                    break

        return class_body[body_start:body_end]

    def generate_profiler_code(self, system: Dict) -> str:
        """Generate profiler instrumentation code for a VFX system."""
        class_name = system["class_name"]
        update_params = system["update_params"]
        original_body = system["update_body"]

        # Extract the body content (excluding braces)
        inner_body = original_body.strip()[1:-1].strip()

        return f"""
// === VFX PERFORMANCE PROFILER INSTRUMENTATION ===
// System: {class_name}
// File: {Path(system['file_path']).name}
// Generated: {datetime.now().isoformat()}

// Initialize performance tracker
if (!window.__VFX_PERF_PROFILER) {{
    window.__VFX_PERF_PROFILER = {{
        systems: {{}},
        frameTime: 0,
        frameCount: 0,
        startTime: performance.now(),

        startFrame() {{
            this.frameTime = performance.now();
        }},

        endFrame() {{
            const frameDuration = performance.now() - this.frameTime;
            this.frameCount++;

            // Log frame stats every 60 frames
            if (this.frameCount % 60 === 0) {{
                const totalTime = performance.now() - this.startTime;
                const avgFrame = totalTime / this.frameCount;
                console.log(`[VFX Perf] Frame ${{this.frameCount}}: ${{frameDuration.toFixed(2)}}ms (avg: ${{avgFrame.toFixed(2)}}ms)`);
            }}
        }},

        trackSystem(systemId, duration, context = {{}}) {{
            if (!this.systems[systemId]) {{
                this.systems[systemId] = {{
                    name: systemId,
                    samples: [],
                    totalTime: 0,
                    maxTime: 0,
                    minTime: Infinity,
                    avgTime: 0,
                    callCount: 0,
                    contexts: {{}}
                }};
            }}

            const stats = this.systems[systemId];
            stats.samples.push(duration);
            stats.totalTime += duration;
            stats.maxTime = Math.max(stats.maxTime, duration);
            stats.minTime = Math.min(stats.minTime, duration);
            stats.avgTime = stats.totalTime / stats.samples.length;
            stats.callCount++;

            // Track context-specific stats
            const contextKey = Object.keys(context).join(',');
            if (!stats.contexts[contextKey]) {{
                stats.contexts[contextKey] = {{
                    samples: [],
                    totalTime: 0,
                    count: 0
                }};
            }}
            stats.contexts[contextKey].samples.push(duration);
            stats.contexts[contextKey].totalTime += duration;
            stats.contexts[contextKey].count++;

            // Warn if expensive
            if (duration > 3.0) {{
                console.warn(`[VFX Perf] EXPENSIVE: ${{systemId}} took ${{duration.toFixed(2)}}ms`, context);
            }}
        }},

        getReport() {{
            const report = {{
                summary: {{
                    totalSystems: Object.keys(this.systems).length,
                    totalTime: performance.now() - this.startTime,
                    frameCount: this.frameCount,
                    avgFrameTime: (performance.now() - this.startTime) / this.frameCount
                }},
                systems: []
            }};

            for (const [id, stats] of Object.entries(this.systems)) {{
                const stdDev = Math.sqrt(
                    stats.samples.reduce((sum, val) => sum + Math.pow(val - stats.avgTime, 2), 0) / stats.samples.length
                );

                report.systems.push({{
                    id,
                    name: stats.name,
                    callCount: stats.callCount,
                    totalTime: stats.totalTime.toFixed(2),
                    avgTime: stats.avgTime.toFixed(2),
                    maxTime: stats.maxTime.toFixed(2),
                    minTime: stats.minTime.toFixed(2),
                    stdDev: stdDev.toFixed(2),
                    percentageOfFrame: ((stats.avgTime / report.summary.avgFrameTime) * 100).toFixed(1),
                    expensive: stats.avgTime > 3.0,
                    contexts: Object.fromEntries(
                        Object.entries(stats.contexts).map(([key, ctx]) => [
                            key,
                            {{
                                avgTime: (ctx.totalTime / ctx.count).toFixed(2),
                                count: ctx.count
                            }}
                        ])
                    )
                }});
            }}

            // Sort by avg time (descending)
            report.systems.sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));

            return report;
        }},

        printReport() {{
            const report = this.getReport();

            console.log('\\n=== VFX PERFORMANCE REPORT ===');
            console.log(`Total Systems: ${{report.summary.totalSystems}}`);
            console.log(`Total Time: ${{report.summary.totalTime.toFixed(0)}}ms`);
            console.log(`Frame Count: ${{report.summary.frameCount}}`);
            console.log(`Avg Frame Time: ${{report.summary.avgFrameTime.toFixed(2)}}ms`);

            console.log('\\n--- System Performance ---');
            for (const sys of report.systems) {{
                const status = sys.expensive ? '⚠️ EXPENSIVE' : '✓';
                console.log(`${{status}} ${{sys.name}}:`);
                console.log(`  Avg: ${{sys.avgTime}}ms (${{sys.percentageOfFrame}}% of frame)`);
                console.log(`  Max: ${{sys.maxTime}}ms | Min: ${{sys.minTime}}ms | StdDev: ${{sys.stdDev}}ms`);
                console.log(`  Calls: ${{sys.callCount}} | Total: ${{sys.totalTime}}ms`);
            }}

            console.log('\\n--- Expensive Systems (>3ms) ---');
            const expensive = report.systems.filter(s => s.expensive);
            if (expensive.length === 0) {{
                console.log('None! 🎉');
            }} else {{
                for (const sys of expensive) {{
                    console.log(`⚠️ ${{sys.name}}: ${{sys.avgTime}}ms avg (${{sys.percentageOfFrame}}% of frame)`);
                }}
            }}

            console.log('===============================\\n');

            return report;
        }},

        reset() {{
            this.systems = {{}};
            this.frameCount = 0;
            this.startTime = performance.now();
            console.log('[VFX Perf] Profiler reset');
        }}
    }};
}}

// Wrap the update method
"""

    def generate_instrumented_update(self, system: Dict) -> str:
        """Generate instrumented update method."""
        class_name = system["class_name"]
        update_params = system["update_params"]
        original_body = system["update_body"]

        # Extract the body content (excluding braces)
        inner_body = original_body.strip()[1:-1].strip()

        return f"""
    update({update_params}) {{
        const __PERF_START = performance.now();
        const __PERF_CONTEXT = {{}};

        // Original update body
        {inner_body}

        const __PERF_DURATION = performance.now() - __PERF_START;
        window.__VFX_PERF_PROFILER?.trackSystem('{class_name}', __PERF_DURATION, __PERF_CONTEXT);
    }}
"""

    def generate_profiler_injector(self) -> str:
        """Generate global profiler injector script."""
        return """
// === VFX PERFORMANCE PROFILER GLOBAL INJECTOR ===
// Add this to main.js or early in initialization

(function() {
    // Initialize profiler on window load
    window.addEventListener('load', () => {
        if (!window.__VFX_PERF_PROFILER) {
            console.log('[VFX Perf] Initializing performance profiler...');
            // Profiler will be initialized by instrumented systems
        }
    });

    // Expose profiler API globally
    window.__VFX_PERF_API = {
        getReport: () => window.__VFX_PERF_PROFILER?.getReport(),
        printReport: () => window.__VFX_PERF_PROFILER?.printReport(),
        reset: () => window.__VFX_PERF_PROFILER?.reset(),
        getSystemStats: (systemId) => window.__VFX_PERF_PROFILER?.systems[systemId]
    };

    // Keyboard shortcut: Ctrl+Shift+P to print report
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            console.log('[VFX Perf] Printing performance report...');
            window.__VFX_PERF_API.printReport();
        }
    });

    // Console command
    console.log('[VFX Perf] API available: window.__VFX_PERF_API');
    console.log('[VFX Perf] Keyboard shortcut: Ctrl+Shift+P for report');
})();
"""

    def generate_report(self) -> str:
        """Generate performance analysis report."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX PERFORMANCE PROFILER ANALYSIS")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Total VFX Systems with update(): {len(self.vfx_systems)}")
        lines.append(f"Systems with Profiler: {sum(1 for s in self.vfx_systems if s['has_profiler'])}")
        lines.append(f"Systems without Profiler: {sum(1 for s in self.vfx_systems if not s['has_profiler'])}")
        lines.append("")

        # System details
        lines.append("VFX SYSTEMS WITH UPDATE METHODS")
        lines.append("-" * 70)
        for system in sorted(self.vfx_systems, key=lambda s: s['class_name']):
            profiler_status = "✓" if system['has_profiler'] else "✗"
            lines.append(f"\n{system['class_name']}")
            lines.append(f"  File: {Path(system['file_path']).name}")
            lines.append(f"  Update Params: {system['update_params']}")
            lines.append(f"  Has Profiler: {profiler_status}")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)
        lines.append("1. Add profiler instrumentation to all VFX update methods")
        lines.append("2. Target systems with >3ms average frame time for optimization")
        lines.append("3. Correlate performance with entity counts (nodes/links/particles)")
        lines.append("4. Implement LOD/throttling for expensive systems")
        lines.append("5. Use Ctrl+Shift+P in browser to print runtime performance report")
        lines.append("")
        lines.append("USAGE:")
        lines.append("  1. Run: python vfx_performance_profiler.py generate-profiler")
        lines.append("  2. Copy generated instrumentation to your VFX systems")
        lines.append("  3. Run ATOMA and trigger VFX activity")
        lines.append("  4. Press Ctrl+Shift+P or call window.__VFX_PERF_API.printReport()")
        lines.append("  5. Review report and optimize expensive systems")

        return "\n".join(lines)

    def export_to_json(self, output_file: str = "vfx_performance_data.json") -> None:
        """Export analysis data to JSON."""
        data = {
            "scan_time": datetime.now().isoformat(),
            "total_systems": len(self.vfx_systems),
            "systems": self.vfx_systems
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"Data exported to {output_file}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Performance Profiler')
    parser.add_argument('command', choices=['analyze', 'generate-profiler', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--system', help='Specific VFX system to profile')
    parser.add_argument('--output', help='Output file for code/report')

    args = parser.parse_args()

    profiler = VFXPerformanceProfiler(args.workspace)

    if args.command == 'analyze':
        profiler.analyze_directory()
        print("\n" + profiler.generate_report())

    elif args.command == 'generate-profiler':
        profiler.analyze_directory()

        # Generate global injector
        injector_code = profiler.generate_profiler_injector()
        injector_file = args.output or "vfx_perf_injector.js"
        with open(injector_file, 'w', encoding='utf-8') as f:
            f.write(injector_code)
        print(f"Global injector generated: {injector_file}")

        # Generate instrumentation for systems
        if args.system:
            system = next((s for s in profiler.vfx_systems if s['class_name'] == args.system), None)
            if system:
                profiler_code = profiler.generate_profiler_code(system)
                instrumented_update = profiler.generate_instrumented_update(system)

                base_name = system['class_name']
                profiler_file = f"{base_name}_profiler.js"
                update_file = f"{base_name}_update_instrumented.js"

                with open(profiler_file, 'w', encoding='utf-8') as f:
                    f.write(profiler_code)
                print(f"Profiler code generated: {profiler_file}")

                with open(update_file, 'w', encoding='utf-8') as f:
                    f.write(instrumented_update)
                print(f"Instrumented update generated: {update_file}")
            else:
                print(f"System '{args.system}' not found")
        else:
            # Generate for all systems without profiler
            for system in profiler.vfx_systems:
                if not system['has_profiler']:
                    profiler_code = profiler.generate_profiler_code(system)
                    instrumented_update = profiler.generate_instrumented_update(system)

                    base_name = system['class_name']
                    profiler_file = f"{base_name}_profiler.js"
                    update_file = f"{base_name}_update_instrumented.js"

                    with open(profiler_file, 'w', encoding='utf-8') as f:
                        f.write(profiler_code)

                    with open(update_file, 'w', encoding='utf-8') as f:
                        f.write(instrumented_update)

                    print(f"Generated: {profiler_file}, {update_file}")

    elif args.command == 'report':
        profiler.analyze_directory()
        report = profiler.generate_report()

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output}")
        else:
            print(report)

        profiler.export_to_json()


if __name__ == '__main__':
    main()
