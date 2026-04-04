#!/usr/bin/env python3
"""
LOD Tuner - ATOMA Automatic LOD Threshold Tuning

Automatically tunes LOD thresholds based on performance and visual quality metrics.
Tests different LOD configurations and suggests optimal values.

Usage:
    python lod_tuner.py analyze                 # Analyze current LOD implementation
    python lod_tuner.py generate-tests          # Generate LOD testing code
    python lod_tuner.py report                 # Generate LOD analysis report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime


class LODTuner:
    """Analyzes and tunes LOD (Level of Detail) thresholds."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.lod_systems = []
        self.lod_thresholds = []
        this.lod_distances = []

    def analyze_lod(self) -> None:
        """Analyze LOD implementation in the codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for LOD implementation...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.lod_systems)} LOD systems")
        print(f"Found {len(self.lod_thresholds)} threshold definitions")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for LOD patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Find LOD-related code
                self._find_lod_patterns(line, line_num, str(file_path), file_path.name, content, line_num - 1)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _find_lod_patterns(self, line: str, line_num: int, file_path: str,
                           file_name: str, content: str, line_idx: int) -> None:
        """Find LOD patterns in a line."""
        # Look for LOD keywords
        lod_keywords = ['lod', 'LOD', 'distance', 'far', 'near', 'tier', 'level']

        if any(keyword.lower() in line.lower() for keyword in lod_keywords):
            # Extract LOD class/function if in class definition
            class_match = re.search(r'class\s+(\w*LOD\w*|\w*Lod\w*|\w*Lod\w*)', line)
            if class_match:
                self.lod_systems.append({
                    "name": class_match.group(1),
                    "file": file_path,
                    "file_name": file_name,
                    "line": line_num
                })

            # Extract distance thresholds
            distance_patterns = [
                r'(?:distance|far|near|tier|level)\s*>\s*([\d.]+)',
                r'(?:distance|far|near|tier|level)\s*>=\s*([\d.]+)',
                r'(?:distance|far|near|tier|level)\s*<\s*([\d.]+)',
                r'(?:distance|far|near|tier|level)\s*<=\s*([\d.]+)',
                r'([\d.]+)\s*<\s*(?:distance|far)',
                r'([\d.]+)\s*>\s*(?:distance|near)'
            ]

            for pattern in distance_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    value = float(match.group(1))

                    # Try to determine if this is far/near threshold
                    threshold_type = self._classify_threshold(line, value)

                    self.lod_thresholds.append({
                        "value": value,
                        "type": threshold_type,
                        "file": file_path,
                        "file_name": file_name,
                        "line": line_num,
                        "code": line.strip()
                    })

    def _classify_threshold(self, line: str, value: float) -> str:
        """Classify a threshold as near, far, or tier."""
        line_lower = line.lower()

        if 'near' in line_lower or 'close' in line_lower or 'low' in line_lower:
            return "near"
        elif 'far' in line_lower or 'distant' in line_lower or 'high' in line_lower:
            return "far"
        elif 'tier' in line_lower or 'level' in line_lower:
            return "tier"
        else:
            # Try to infer from value
            if value < 50:
                return "near"
            elif value > 100:
                return "far"
            else:
                return "tier"

    def generate_testing_code(self) -> str:
        """Generate LOD testing code for runtime tuning."""
        # Calculate suggested thresholds based on current analysis
        near_thresholds = [t["value"] for t in self.lod_thresholds if t["type"] == "near"]
        far_thresholds = [t["value"] for t in self.lod_thresholds if t["type"] == "far"]

        suggested_near = 30.0  # Default
        suggested_mid = 60.0
        suggested_far = 120.0

        if near_thresholds:
            suggested_near = min(near_thresholds)
        if far_thresholds:
            suggested_far = max(far_thresholds)

        return f"""
// === LOD TUNING TESTER ===
// Generated: {datetime.now().isoformat()}

const LOD_TUNING_CONFIG = {{
    // Current thresholds
    current: {{
        near: {suggested_near},
        mid: {suggested_mid},
        far: {suggested_far}
    }},

    // Test configurations
    testConfigs: [
        {{ near: 20, mid: 50, far: 100,  label: 'Aggressive' }},
        {{ near: 30, mid: 60, far: 120, label: 'Balanced' }},
        {{ near: 40, mid: 80, far: 150, label: 'Conservative' }},
        {{ near: 25, mid: 55, far: 110, label: 'Balanced+' }},
        {{ near: 35, mid: 70, far: 130, label: 'Conservative+' }}
    ],

    // Test scenarios
    scenarios: [
        {{ name: 'Static Camera', nodeCount: 50, linkCount: 40 }},
        {{ name: 'Moderate Camera', nodeCount: 100, linkCount: 80 }},
        {{ name: 'Active Camera', nodeCount: 200, linkCount: 160 }},
        {{ name: 'High Load', nodeCount: 500, linkCount: 400 }}
    ]
}};

class LODTuner {{
    constructor() {{
        this.results = [];
        this.camera = window.game?.camera;
        this.scene = window.game?.scene;
        this.renderer = window.game?.renderer;
    }}

    async runAllTests() {{
        console.log('=== LOD TUNING TESTS STARTED ===');

        for (const config of LOD_TUNING_CONFIG.testConfigs) {{
            console.log(`\\nTesting: ${{config.label}}`);
            await this.testConfiguration(config);
        }}

        this.printSummary();
        return this.generateRecommendations();
    }}

    async testConfiguration(config) {{
        const configResults = {{
            config: config,
            scenarioResults: []
        }};

        // Apply configuration
        this.applyLODConfig(config);

        // Test each scenario
        for (const scenario of LOD_TUNING_CONFIG.scenarios) {{
            const result = await this.testScenario(scenario);
            configResults.scenarioResults.push(result);
        }}

        this.results.push(configResults);
        return configResults;
    }}

    async testScenario(scenario) {{
        console.log(`  Scenario: ${{scenario.name}} (${{scenario.nodeCount}} nodes, ${{scenario.linkCount}} links)`);

        // Create test scene
        await this.setupTestScene(scenario);

        // Measure performance
        const perfBefore = this.measurePerformance();

        // Move camera through different distances
        const perfByDistance = await this.testCameraMovement();

        // Measure performance after
        const perfAfter = this.measurePerformance();

        // Cleanup
        await this.cleanupTestScene();

        return {{
            scenario: scenario,
            perfBefore,
            perfAfter,
            perfByDistance,
            avgFPS: (perfBefore.fps + perfAfter.fps) / 2,
            avgFrameTime: (perfBefore.frameTime + perfAfter.frameTime) / 2
        }};
    }}

    async setupTestScene(scenario) {{
        // Create test nodes and links
        // This depends on your game API
        console.log(`    Creating ${{scenario.nodeCount}} nodes...`);

        for (let i = 0; i < scenario.nodeCount; i++) {{
            const node = window.game?.spawnNode('process');
            if (node) {{
                node.position.set(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                );
            }}
        }}

        // Create links
        console.log(`    Creating ${{scenario.linkCount}} links...`);
        // Link creation logic here

        // Wait for VFX to initialize
        await this.sleep(500);
    }}

    async testCameraMovement() {{
        const perfByDistance = [];

        // Test at different distances
        const distances = [20, 40, 60, 80, 100, 120, 150, 200];

        for (const distance of distances) {{
            // Move camera to this distance
            if (this.camera) {{
                this.camera.position.z = distance;
                this.camera.lookAt(0, 0, 0);
            }}

            // Wait for LOD to update
            await this.sleep(100);

            // Measure performance
            const perf = this.measurePerformance();

            perfByDistance.push({{
                distance,
                fps: perf.fps,
                frameTime: perf.frameTime,
                drawCalls: perf.drawCalls
            }});

            console.log(`      Distance ${{distance}}: ${{perf.fps.toFixed(1)}} FPS`);
        }}

        return perfByDistance;
    }}

    measurePerformance() {{
        if (!this.renderer) {{
            return {{ fps: 0, frameTime: 0, drawCalls: 0 }};
        }}

        const info = this.renderer.info;
        return {{
            fps: Math.round(1000 / (this.renderer.info.render.frame || 16)),
            frameTime: this.renderer.info.render.frame || 16,
            drawCalls: info.render.calls || 0
        }};
    }}

    async cleanupTestScene() {{
        // Remove test nodes and links
        // This depends on your game API
        await this.sleep(100);
    }}

    applyLODConfig(config) {{
        // Apply LOD configuration to all LOD systems
        // This depends on your LOD API
        console.log(`    Applying LOD: near=${{config.near}}, mid=${{config.mid}}, far=${{config.far}}`);

        if (window.game?.lodSystem) {{
            window.game.lodSystem.setThresholds(config.near, config.mid, config.far);
        }}
    }}

    sleep(ms) {{
        return new Promise(resolve => setTimeout(resolve, ms));
    }}

    printSummary() {{
        console.log('\\n=== LOD TUNING SUMMARY ===');

        for (const result of this.results) {{
            const avgFPS = result.scenarioResults.reduce((sum, s) => sum + s.avgFPS, 0) / result.scenarioResults.length;
            const avgFrameTime = result.scenarioResults.reduce((sum, s) => sum + s.avgFrameTime, 0) / result.scenarioResults.length;

            console.log(`\\n${{result.config.label}}:`);
            console.log(`  Avg FPS: ${{avgFPS.toFixed(1)}}`);
            console.log(`  Avg Frame Time: ${{avgFrameTime.toFixed(2)}}ms`);
        }}
    }}

    generateRecommendations() {{
        // Find best configuration
        const scoredConfigs = this.results.map(result => {{
            const avgFPS = result.scenarioResults.reduce((sum, s) => sum + s.avgFPS, 0) / result.scenarioResults.length;
            const fpsVariance = Math.sqrt(
                result.scenarioResults.reduce((sum, s) => sum + Math.pow(s.avgFPS - avgFPS, 2), 0) / result.scenarioResults.length
            );

            return {{
                config: result.config,
                avgFPS,
                fpsVariance,
                score: avgFPS - (fpsVariance * 0.5)  // Prefer stable high FPS
            }};
        }});

        // Sort by score
        scoredConfigs.sort((a, b) => b.score - a.score);

        const best = scoredConfigs[0];
        const secondBest = scoredConfigs[1];

        const recommendations = {{
            recommended: best.config,
            alternative: secondBest?.config,
            reasoning: {{
                best: `Highest stable FPS (${{best.avgFPS.toFixed(1)}} with variance ${{best.fpsVariance.toFixed(1)}})`,
                alternative: secondBest ? `Alternative with similar performance (${{secondBest.avgFPS.toFixed(1)}} FPS)` : 'No alternative'
            }},
            allResults: scoredConfigs
        }};

        console.log('\\n=== RECOMMENDATIONS ===');
        console.log(`Best Configuration: ${{recommendations.recommended.label}}`);
        console.log(`  Near: ${{recommendations.recommended.near}}`);
        console.log(`  Mid: ${{recommendations.recommended.mid}}`);
        console.log(`  Far: ${{recommendations.recommended.far}}`);
        console.log(`  Reason: ${{recommendations.reasoning.best}}`);

        if (recommendations.alternative) {{
            console.log(`\\nAlternative: ${{recommendations.alternative.label}}`);
            console.log(`  Reason: ${{recommendations.reasoning.alternative}}`);
        }}

        return recommendations;
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__LOD_TUNER__ = new LODTuner();

    // Expose API
    window.runLODTuningTests = async () => {{
        return await window.__LOD_TUNER__.runAllTests();
    }};

    window.setLODThresholds = (near, mid, far) => {{
        window.__LOD_TUNER__.applyLODConfig({{ near, mid, far }});
    }};

    console.log('LOD Tuner loaded.');
    console.log('Run: await window.runLODTuningTests()');
}}
"""

    def generate_report(self) -> str:
        """Generate LOD analysis report."""
        lines = []
        lines.append("=" * 70)
        lines.append("LOD (LEVEL OF DETAIL) ANALYSIS REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"LOD Systems Found: {len(self.lod_systems)}")
        lines.append(f"Threshold Definitions: {len(self.lod_thresholds)}")
        lines.append("")

        # LOD Systems
        if self.lod_systems:
            lines.append("LOD SYSTEMS")
            lines.append("-" * 70)
            for system in self.lod_systems:
                lines.append(f"  {system['name']}")
                lines.append(f"    File: {system['file_name']}:{system['line']}")
            lines.append("")

        # Thresholds by type
        lines.append("THRESHOLDS BY TYPE")
        lines.append("-" * 70)

        by_type = defaultdict(list)
        for threshold in self.lod_thresholds:
            by_type[threshold["type"]].append(threshold)

        for threshold_type in ["near", "mid", "tier", "far"]:
            if threshold_type in by_type:
                values = [t["value"] for t in by_type[threshold_type]]
                lines.append(f"\n{threshold_type.upper()}:")
                lines.append(f"  Count: {len(values)}")
                lines.append(f"  Min: {min(values):.1f}")
                lines.append(f"  Max: {max(values):.1f}")
                lines.append(f"  Avg: {sum(values)/len(values):.1f}")
                lines.append(f"  Values: {', '.join(f'{v:.1f}' for v in sorted(set(values)))}")
            else:
                lines.append(f"\n{threshold_type.upper()}: No thresholds defined")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)

        # Calculate suggested values
        near_values = [t["value"] for t in self.lod_thresholds if t["type"] == "near"]
        far_values = [t["value"] for t in self.lod_thresholds if t["type"] == "far"]

        suggested_near = 30.0
        suggested_mid = 60.0
        suggested_far = 120.0

        if near_values:
            suggested_near = min(near_values)
        if far_values:
            suggested_far = max(far_values)

        lines.append("Based on current analysis, suggested LOD thresholds:")
        lines.append(f"  Near (High Detail): {suggested_near:.1f} units")
        lines.append(f"  Mid (Medium Detail): {suggested_mid:.1f} units")
        lines.append(f"  Far (Low Detail): {suggested_far:.1f} units")
        lines.append("")
        lines.append("These thresholds balance visual quality with performance.")

        # Usage
        lines.append("\n")
        lines.append("USAGE")
        lines.append("-" * 70)
        lines.append("1. Generate LOD testing code:")
        lines.append("   python lod_tuner.py generate-tests")
        lines.append("")
        lines.append("2. Load lod_tuner.js in browser")
        lines.append("")
        lines.append("3. Run tuning tests:")
        lines.append("   await window.runLOD_TUNING_tests()")
        lines.append("")
        lines.append("4. Apply recommended thresholds to your LOD system")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='LOD Tuner')
    parser.add_argument('command', choices=['analyze', 'generate-tests', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output-test', default='lod_tuner.js',
                       help='Output file for LOD tester')
    parser.add_argument('--output-report', help='Output file for analysis report')

    args = parser.parse_args()

    tuner = LODTuner(args.workspace)

    if args.command == 'analyze':
        tuner.analyze_lod()
        print("\n" + tuner.generate_report())

    elif args.command == 'generate-tests':
        tuner.analyze_lod()

        test_code = tuner.generate_testing_code()
        output_path = tuner.workspace_root / args.output_test

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(test_code)

        print(f"LOD tester generated: {args.output_test}")
        print("\nUsage:")
        print("1. Load lod_tuner.js in browser")
        print("2. Run: await window.runLODTuningTests()")
        print("3. Apply recommended thresholds")

    elif args.command == 'report':
        tuner.analyze_lod()
        report = tuner.generate_report()

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output_report}")
        else:
            print(report)


if __name__ == '__main__':
    main()
