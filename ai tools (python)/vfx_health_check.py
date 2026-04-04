#!/usr/bin/env python3
"""
VFX Health Check - VFX System Health Check

Generates browser-based health check tool for VFX system validation.
Checks system status, dependencies, and common issues.

Usage:
    python vfx_health_check.py generate             # Generate health check tool
    python vfx_health_check.py report               # Generate health report
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class VFXHealthCheckGenerator:
    """Generates browser-based VFX health check tool."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        this.vfx_systems = []
        this.dependencies = defaultdict(list)
        this.common_issues = []

    def analyze_vfx_systems(self) -> None:
        """Analyze VFX systems and dependencies."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime", "LEGACY"])]

        print(f"Analyzing {len(js_files)} files for VFX systems...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.vfx_systems)} VFX systems")

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

                if self._is_vfx_system(name, content):
                    # Extract dependencies
                    deps = self._extract_dependencies(content)

                    this.vfx_systems.append({
                        "name": name,
                        "file": file_path.name,
                        "dependencies": deps
                    })

                    # Track dependencies
                    for dep in deps:
                        this.dependencies[dep].append(name)

                    # Check for common issues
                    issues = self._check_common_issues(name, content)
                    if issues:
                        this.common_issues.extend(issues)

        except Exception as e:
            pass

    def _is_vfx_system(self, name: str, content: str) -> bool:
        """Quick check if it's an actual VFX system."""
        vfx_keywords = ['visual', 'vfx', 'particle', 'render', 'mesh', 'geometry',
                       'material', 'shader', 'three', 'scene', 'camera', 'light']

        content_lower = content.lower()
        has_keyword = any(kw in content_lower for kw in vfx_keywords)
        has_vfx_in_name = any(kw in name.lower() for kw in ['visual', 'vfx', 'fx', 'particle', 'render'])

        return has_keyword and (has_vfx_in_name or 'System' in name or 'Manager' in name)

    def _extract_dependencies(self, content: str) -> List[str]:
        """Extract dependencies from content."""
        deps = []

        # Find import statements
        import_patterns = [
            r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',
            r'import.*from\s+[\'"]([^\'"]+)[\'"]'
        ]

        for pattern in import_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                dep = match.group(1)
                if not dep.startswith('.') and not dep.startswith('/'):
                    deps.append(dep.split('/')[-1])

        return list(set(deps))

    def _check_common_issues(self, name: str, content: str) -> List[Dict[str, str]]:
        """Check for common VFX issues."""
        issues = []

        # Check for missing dispose
        if 'dispose' not in content and ('geometry' in content.lower() or 'material' in content.lower()):
            issues.append({{
                "system": name,
                "type": "missing_dispose",
                "message": f"{name} uses geometries/materials but may not call dispose()"
            }})

        # Check for console.error in production code
        if 'console.error' in content and '!window.__DEBUG' not in content and 'DEBUG_ONLY' not in content:
            issues.append({{
                "system": name,
                "type": "unconditional_error",
                "message": f"{name} has unconditional console.error calls"
            }})

        # Check for missing scene attachment
        if 'scene.add' not in content and 'scene = ' in content:
            issues.append({{
                "system": name,
                "type": "missing_scene_attach",
                "message": f"{name} may not attach objects to scene"
            }})

        return issues

    def generate_health_check_tool(self) -> str:
        """Generate browser-based health check tool."""
        return f"""
// === VFX HEALTH CHECK TOOL ===
// Generated: {datetime.now().isoformat()}

class VFXHealthCheck {{
    constructor() {{
        this.healthResults = [];
        this.systems = [];
        this.issues = [];
    }}

    // Run full health check
    runCheck() {{
        console.log('\\n=== VFX HEALTH CHECK ===\\n');

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
    }}

    // Check core systems
    checkCoreSystems() {{
        console.log('Checking Core Systems...');

        const coreSystems = [
            {{ name: 'MetricsRuntime', ref: window.metricsRuntime, required: true }},
            {{ name: 'FrameScheduler', ref: window.frameScheduler, required: true }},
            {{ name: 'NodeLinkingSystem', ref: window.nodeLinkingSystem, required: true }},
            {{ name: 'VisualHierarchyRegistry', ref: window.visualHierarchyRegistry, required: true }},
            {{ name: 'LinkRendererConduit', ref: window.linkRendererConduit, required: false }}
        ];

        for (const system of coreSystems) {{
            const status = system.ref ? '✓ OK' : (system.required ? '✗ MISSING' : '⚠️  OPTIONAL');
            const result = {{
                category: 'Core Systems',
                check: system.name,
                status: system.ref ? 'ok' : (system.required ? 'error' : 'warning'),
                message: system.ref ? 'Available' : 'Not found' + (system.required ? ' (Required)' : ' (Optional)')
            }};

            this.healthResults.push(result);
            this.systems.push({{ ...system, available: !!system.ref }});

            console.log(`  ${{status}} ${{system.name}}`);
        }}

        console.log('');
    }}

    // Check renderer
    checkRenderer() {{
        console.log('Checking Renderer...');

        if (!window.renderer) {{
            const result = {{
                category: 'Renderer',
                check: 'Renderer availability',
                status: 'error',
                message: 'Renderer not found'
            }};
            this.healthResults.push(result);
            console.log('  ✗ Renderer not found');
            return;
        }}

        console.log(`  ✓ Renderer available`);

        // Check renderer info
        const info = window.renderer.info;
        console.log(`  - Render calls: ${{info.render.calls}}`);
        console.log(`  - Triangles: ${{info.render.triangles}}`);
        console.log(`  - Points: ${{info.render.points}}`);
        console.log(`  - Programs: ${{info.programs?.length || 0}}`);

        // Check memory
        const memory = window.renderer.info.memory;
        console.log(`  - Geometries: ${{memory.geometries}}`);
        console.log(`  - Textures: ${{memory.textures}}`);

        // Check for potential memory leaks
        if (memory.geometries > 1000) {{
            const result = {{
                category: 'Renderer',
                check: 'Geometry count',
                status: 'warning',
                message: `High geometry count: ${{memory.geometries}}`
            }};
            this.healthResults.push(result);
            this.issues.push(result);
            console.log(`  ⚠️  High geometry count: ${{memory.geometries}}`);
        }}

        if (memory.textures > 500) {{
            const result = {{
                category: 'Renderer',
                check: 'Texture count',
                status: 'warning',
                message: `High texture count: ${{memory.textures}}`
            }};
            this.healthResults.push(result);
            this.issues.push(result);
            console.log(`  ⚠️  High texture count: ${{memory.textures}}`);
        }}

        console.log('');
    }}

    // Check scene
    checkScene() {{
        console.log('Checking Scene...');

        if (!window.scene) {{
            const result = {{
                category: 'Scene',
                check: 'Scene availability',
                status: 'error',
                message: 'Scene not found'
            }};
            this.healthResults.push(result);
            console.log('  ✗ Scene not found');
            return;
        }}

        console.log(`  ✓ Scene available`);

        // Count objects
        let objectCount = 0;
        let meshCount = 0;
        let particleCount = 0;

        window.scene.traverse((obj) => {{
            objectCount++;
            if (obj.isMesh) meshCount++;
            if (obj.isPoints) particleCount++;
        }});

        console.log(`  - Total objects: ${{objectCount}}`);
        console.log(`  - Meshes: ${{meshCount}}`);
        console.log(`  - Particles: ${{particleCount}}`);

        const result = {{
            category: 'Scene',
            check: 'Scene structure',
            status: 'ok',
            message: `${{objectCount}} objects ({{meshCount}} meshes, ${{particleCount}} particles)`
        }};
        this.healthResults.push(result);

        console.log('');
    }}

    // Check performance
    checkPerformance() {{
        console.log('Checking Performance...');

        // Check FPS
        if (window.__PERFORMANCE_SNAPSHOT__) {{
            const snapshot = window.__PERFORMANCE_SNAPSHOT__.currentSnapshot;
            if (snapshot && snapshot.fps > 0) {{
                console.log(`  ✓ FPS: ${{snapshot.fps.toFixed(1)}}`);
                console.log(`  - Frame time: ${{snapshot.frameTime.toFixed(2)}}ms`);

                const status = snapshot.fps >= 30 ? 'ok' : (snapshot.fps >= 20 ? 'warning' : 'error');
                const result = {{
                    category: 'Performance',
                    check: 'FPS',
                    status,
                    message: `${{snapshot.fps.toFixed(1)}} FPS ({{snapshot.frameTime.toFixed(2)}}ms per frame)`
                }};
                this.healthResults.push(result);

                if (status !== 'ok') {{
                    this.issues.push(result);
                }}
            }}
        }} else {{
            console.log('  ⚠️  Performance snapshot not available');
        }}

        console.log('');
    }}

    // Check memory
    checkMemory() {{
        console.log('Checking Memory...');

        if (performance.memory) {{
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
            const percent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);

            console.log(`  ✓ Used: ${{used}} MB / ${{total}} MB`);
            console.log(`  - Limit: ${{limit}} MB (${{percent}}%)`);

            const status = percent < 80 ? 'ok' : (percent < 90 ? 'warning' : 'error');
            const result = {{
                category: 'Memory',
                check: 'Heap usage',
                status,
                message: `${{used}} MB / ${{limit}} MB ({{percent}}%)`
            }};
            this.healthResults.push(result);

            if (status !== 'ok') {{
                this.issues.push(result);
            }}
        }} else {{
            console.log('  ⚠️  Memory API not available');
        }}

        console.log('');
    }}

    // Get health report
    getHealthReport() {{
        const ok = this.healthResults.filter(r => r.status === 'ok').length;
        const warnings = this.healthResults.filter(r => r.status === 'warning').length;
        const errors = this.healthResults.filter(r => r.status === 'error').length;

        return {{
            timestamp: new Date().toISOString(),
            summary: {{
                total: this.healthResults.length,
                ok,
                warnings,
                errors,
                overallStatus: errors > 0 ? 'error' : (warnings > 0 ? 'warning' : 'ok')
            }},
            results: this.healthResults,
            systems: this.systems,
            issues: this.issues
        }};
    }}

    // Print summary
    printSummary() {{
        const report = this.getHealthReport();

        console.log('=== HEALTH CHECK SUMMARY ===');
        console.log(`Total checks: ${{report.summary.total}}`);
        console.log(`✓ OK: ${{report.summary.ok}}`);
        console.log(`⚠️  Warnings: ${{report.summary.warnings}}`);
        console.log(`✗ Errors: ${{report.summary.errors}}`);

        const statusEmoji = report.summary.overallStatus === 'ok' ? '✓' :
                          (report.summary.overallStatus === 'warning' ? '⚠️' : '✗');
        console.log(`\\nOverall Status: ${{statusEmoji}} ${{report.summary.overallStatus.toUpperCase()}}`);

        if (this.issues.length > 0) {{
            console.log('\\nIssues Found:');
            for (const issue of this.issues) {{
                console.log(`  - [${{issue.category}}] ${{issue.message}}`);
            }}
        }}

        console.log('==========================\\n');
    }}

    // Export report
    exportReport() {{
        return JSON.stringify(this.getHealthReport(), null, 2);
    }}

    // Clear results
    clear() {{
        this.healthResults = [];
        this.systems = [];
        this.issues = [];
        console.log('[VFX Health Check] Cleared');
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
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
}}
"""

    def generate_report(self) -> str:
        """Generate health check report."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX HEALTH CHECK TOOL")
        lines.append("=" * 70)
        lines.append("")

        lines.append("VFX SYSTEMS ANALYZED")
        lines.append("-" * 70)
        for system in this.vfx_systems:
            lines.append(f"  {system['name']}")
            lines.append(f"    File: {system['file']}")
            if system['dependencies']:
                lines.append(f"    Dependencies: {', '.join(system['dependencies'][:5])}")
        lines.append("")

        lines.append("COMMON ISSUES DETECTED")
        lines.append("-" * 70)
        if this.common_issues:
            for issue in this.common_issues[:10]:  # Show first 10
                lines.append(f"  [{issue['system']}] {issue['message']}")
        else:
            lines.append("  No common issues detected")
        lines.append("")

        lines.append("USAGE")
        lines.append("-" * 70)
        lines.append("1. Generate health check tool:")
        lines.append("   python vfx_health_check.py generate")
        lines.append("")
        lines.append("2. Load vfx_health_check.js in browser")
        lines.append("")
        lines.append("3. Run health check:")
        lines.append("   window.runVFXHealthCheck()")
        lines.append("")
        lines.append("4. Export report:")
        lines.append("   window.exportVFXHealthReport()")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Health Check')
    parser.add_argument('command', choices=['generate', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', default='vfx_health_check.js',
                       help='Output file for health check tool')

    args = parser.parse_args()

    generator = VFXHealthCheckGenerator(args.workspace)

    if args.command == 'generate':
        generator.analyze_vfx_systems()

        health_check_code = generator.generate_health_check_tool()
        output_path = generator.workspace_root / args.output

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(health_check_code)

        print(f"VFX health check tool generated: {args.output}")
        print("\nUsage:")
        print("1. Load vfx_health_check.js in browser")
        print("2. Run health check: window.runVFXHealthCheck()")
        print("3. Export report: window.exportVFXHealthReport()")

    elif args.command == 'report':
        generator.analyze_vfx_systems()
        print("\n" + generator.generate_report())


if __name__ == '__main__':
    main()
