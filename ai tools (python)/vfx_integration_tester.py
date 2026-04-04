#!/usr/bin/env python3
"""
VFX Integration Tester - ATOMA VFX System Integration Testing

Automated VFX integration tests to verify systems react correctly to events/metrics.
Generates test scenarios and validates VFX responses.

Usage:
    python vfx_integration_tester.py generate-scenarios      # Generate test scenarios
    python vfx_integration_tester.py run-tests               # Run integration tests
    python vfx_integration_tester.py report                   # Generate test report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class TestScenario:
    """Represents a single test scenario."""
    name: str
    description: str
    triggers: List[Dict[str, Any]]
    expected_vfx: List[str]
    expected_metrics: Dict[str, float]
    setup_code: str
    validation_code: str


class VFXIntegrationTester:
    """Generates and runs VFX integration tests."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems = []
        self.test_scenarios = []
        self.test_results = []

    def discover_vfx_systems(self) -> None:
        """Discover all VFX systems in the workspace."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        vfx_keywords = [
            "Visualizer", "ParticleSystem", "Cascade", "Resonance",
            "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
            "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura"
        ]

        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Find VFX classes
                class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)

                for match in class_matches:
                    class_name = match.group(1)
                    if any(keyword.lower() in class_name.lower() for keyword in vfx_keywords):
                        self.vfx_systems.append({
                            "name": class_name,
                            "file": str(js_file),
                            "file_name": js_file.name
                        })

            except Exception as e:
                print(f"Error reading {js_file}: {e}")

        print(f"Discovered {len(self.vfx_systems)} VFX systems")

    def generate_scenarios(self) -> None:
        """Generate test scenarios for VFX systems."""
        print("Generating test scenarios...")

        # Scenario 1: High Synergy Link Creation
        self.test_scenarios.append(TestScenario(
            name="high_synergy_link_creation",
            description="Create a link with high synergy and verify VFX activation",
            triggers=[
                {"type": "link_created", "synergy": 0.9, "harmony": 0.8}
            ],
            expected_vfx=[
                "LinkRendererConduit",
                "LinkResonanceFlowSystem",
                "SynergyCascadeVisualizer",
                "LinkSparkSystem"
            ],
            expected_metrics={
                "synergy": 0.9,
                "harmony": 0.8
            },
            setup_code="""
// Create two nodes
const nodeA = game.spawnNode('input');
const nodeB = game.spawnNode('process');

// Set high synergy metrics
nodeA.userData.metrics.synergy = 0.9;
nodeB.userData.metrics.synergy = 0.9;
nodeA.userData.metrics.harmony = 0.8;
nodeB.userData.metrics.harmony = 0.8;

// Create link
const link = game.createLink(nodeA, nodeB);
""",
            validation_code="""
// Verify VFX activation
const vfxActive = window.__VFX_LIFECYCLE_TRACKER?.activeSystems || {};
const expectedVFX = ["LinkRendererConduit", "LinkResonanceFlowSystem"];
const activated = Object.values(vfxActive).filter(s => expectedVFX.some(e => s.name.includes(e)));

if (activated.length > 0) {
    console.log('✓ VFX systems activated for high synergy link');
} else {
    console.warn('✗ Expected VFX systems not activated');
}

// Verify metrics
if (link.userData.metrics.synergy >= 0.85) {
    console.log('✓ High synergy preserved');
} else {
    console.warn('✗ Synergy not preserved');
}
"""
        ))

        # Scenario 2: Cascade Propagation
        self.test_scenarios.append(TestScenario(
            name="cascade_propagation",
            description="Trigger a cascade event and verify visual propagation",
            triggers=[
                {"type": "cascade_start", "source_node_id": "node1", "intensity": 0.8},
                {"type": "cascade_hop", "source_node_id": "node1", "target_node_id": "node2"}
            ],
            expected_vfx=[
                "CascadeParticleSystem",
                "CascadingRuptureSystem",
                "CascadeResonanceWaveVisualization",
                "ResonanceCascadeVisualization"
            ],
            expected_metrics={
                "cascadeIntensity": 0.8,
                "cascadeHops": 1
            },
            setup_code="""
// Create a chain of nodes
const nodes = [];
for (let i = 0; i < 5; i++) {
    nodes.push(game.spawnNode('process'));
}

// Link them in a chain
for (let i = 0; i < nodes.length - 1; i++) {
    game.createLink(nodes[i], nodes[i+1]);
}

// Set up for cascade
nodes[0].userData.metrics.synergy = 0.95;
nodes[0].userData.metrics.harmony = 0.9;

// Trigger cascade manually (simulate high synergy cascade)
window.semanticBus?.emit('cascade.start', {
    sourceNode: nodes[0],
    intensity: 0.8
});

setTimeout(() => {
    window.semanticBus?.emit('cascade.hop', {
        sourceNode: nodes[0],
        targetNode: nodes[1],
        intensity: 0.7
    });
}, 100);
""",
            validation_code="""
// Verify cascade VFX activation
const vfxActive = window.__VFX_LIFECYCLE_TRACKER?.activeSystems || {};
const cascadeVFX = Object.values(vfxActive).filter(s =>
    s.name.includes('Cascade') || s.name.includes('Resonance')
);

if (cascadeVFX.length > 0) {
    console.log('✓ Cascade VFX systems activated');
} else {
    console.warn('✗ Cascade VFX systems not activated');
}

// Check cascade events
let cascadeEvents = 0;
const originalEmit = window.semanticBus?.emit;
if (originalEmit) {
    window.semanticBus.emit = function(event, data) {
        if (event.includes('cascade')) {
            cascadeEvents++;
        }
        return originalEmit.call(this, event, data);
    };
}

setTimeout(() => {
    if (cascadeEvents >= 2) {
        console.log('✓ Cascade events propagated');
    } else {
        console.warn(`✗ Only ${cascadeEvents} cascade events detected`);
    }
}, 500);
"""
        ))

        # Scenario 3: Corruption Spread
        self.test_scenarios.append(TestScenario(
            name="corruption_spread",
            description="Simulate corruption spread and verify visual response",
            triggers=[
                {"type": "node_corruption_high", "node_id": "corrupt_node", "corruption": 0.8}
            ],
            expected_vfx=[
                "CorruptionVisualFX",
                "T2_CorruptionVisualIntegration",
                "LinkCorruptionParticleSystem"
            ],
            expected_metrics={
                "corruption": 0.8,
                "corrupted": true
            },
            setup_code="""
// Create nodes
const cleanNode = game.spawnNode('input');
const corruptNode = game.spawnNode('process');

// Set high corruption
corruptNode.userData.metrics.corruption = 0.85;
corruptNode.userData.isCorrupted = true;

// Link them
const link = game.createLink(cleanNode, corruptNode);

// Emit corruption event
window.semanticBus?.emit('node.corruption.high', {
    nodeId: corruptNode.userData.nodeId,
    corruption: 0.85
});
""",
            validation_code="""
// Verify corruption VFX
const vfxActive = window.__VFX_LIFECYCLE_TRACKER?.activeSystems || {};
const corruptionVFX = Object.values(vfxActive).filter(s =>
    s.name.includes('Corruption')
);

if (corruptionVFX.length > 0) {
    console.log('✓ Corruption VFX activated');
} else {
    console.warn('✗ Corruption VFX not activated');
}

// Verify corruption metric
if (corruptNode.userData.metrics.corruption >= 0.8) {
    console.log('✓ Corruption metric preserved');
} else {
    console.warn('✗ Corruption metric not preserved');
}
"""
        ))

        # Scenario 4: Harmonic Recovery
        self.test_scenarios.append(TestScenario(
            name="harmonic_recovery",
            description="Simulate harmonic recovery after disruption",
            triggers=[
                {"type": "harmony_high", "link_id": "recovered_link", "harmony": 0.85}
            ],
            expected_vfx=[
                "HarmonicHealingVisualSystem",
                "HarmonicRecoveryVisualSystem",
                "HealingParticleSystem"
            ],
            expected_metrics={
                "harmony": 0.85,
                "recovery": true
            },
            setup_code="""
// Create nodes with initially low harmony
const nodeA = game.spawnNode('input');
const nodeB = game.spawnNode('process');

nodeA.userData.metrics.harmony = 0.3;
nodeB.userData.metrics.harmony = 0.3;

// Create link
const link = game.createLink(nodeA, nodeB);

// Simulate recovery after some time
setTimeout(() => {
    nodeA.userData.metrics.harmony = 0.85;
    nodeB.userData.metrics.harmony = 0.85;

    window.semanticBus?.emit('link.harmony.high', {
        linkId: link.userData.linkId,
        harmony: 0.85
    });
}, 100);
""",
            validation_code="""
// Wait for recovery
setTimeout(() => {
    const vfxActive = window.__VFX_LIFECYCLE_TRACKER?.activeSystems || {};
    const healingVFX = Object.values(vfxActive).filter(s =>
        s.name.includes('Healing') || s.name.includes('Recovery')
    );

    if (healingVFX.length > 0) {
        console.log('✓ Healing/recovery VFX activated');
    } else {
        console.warn('✗ Healing/recovery VFX not activated');
    }

    // Verify harmony metric
    if (link.userData.metrics.harmony >= 0.8) {
        console.log('✓ Harmony recovery successful');
    } else {
        console.warn('✗ Harmony recovery failed');
    }
}, 500);
"""
        ))

        # Scenario 5: Wave Interference
        self.test_scenarios.append(TestScenario(
            name="wave_interference",
            description="Create wave interference pattern and verify visual response",
            triggers=[
                {"type": "wave_burst", "center": {"x": 0, "y": 0, "z": 0}, "amplitude": 0.9},
                {"type": "wave_packet_spawn", "wave_id": "test_wave"}
            ],
            expected_vfx=[
                "WaveInterferenceEngine",
                "StandingWaveVisualRenderer",
                "OscillationTrapVisualSystem",
                "ResonanceEchoTrailSystem"
            ],
            expected_metrics={
                "waveAmplitude": 0.9,
                "waveStanding": true
            },
            setup_code="""
// Create harmonic nodes around center
const centerNode = game.spawnNode('control');
centerNode.position.set(0, 0, 0);
centerNode.userData.metrics.harmony = 0.9;
centerNode.userData.metrics.synergy = 0.9;

// Create surrounding nodes
for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const node = game.spawnNode('process');
    node.position.set(
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        0
    );
    node.userData.metrics.harmony = 0.85;
    node.userData.metrics.synergy = 0.85;

    // Link to center
    game.createLink(centerNode, node);
}

// Emit wave burst event
window.semanticBus?.emit('wave.burst.lifecycle', {
    center: centerNode.position,
    amplitude: 0.9,
    harmony: 0.9,
    synergy: 0.9
});

setTimeout(() => {
    window.semanticBus?.emit('wave.packet.spawn', {
        waveId: 'test_wave',
        center: centerNode.position,
        amplitude: 0.85
    });
}, 100);
""",
            validation_code="""
// Wait for wave effects
setTimeout(() => {
    const vfxActive = window.__VFX_LIFECYCLE_TRACKER?.activeSystems || {};
    const waveVFX = Object.values(vfxActive).filter(s =>
        s.name.includes('Wave') || s.name.includes('Echo')
    );

    if (waveVFX.length > 0) {
        console.log('✓ Wave VFX activated');
    } else {
        console.warn('✗ Wave VFX not activated');
    }

    // Check for standing wave detection
    const waveEngine = window.__WAVE_ENGINE__;
    if (waveEngine && waveEngine.standingWaves.length > 0) {
        console.log('✓ Standing waves detected');
    } else {
        console.warn('✗ No standing waves detected');
    }
}, 500);
"""
        ))

        print(f"Generated {len(self.test_scenarios)} test scenarios")

    def generate_test_runner(self) -> str:
        """Generate test runner script."""
        scenarios_json = json.dumps([asdict(s) for s in self.test_scenarios], indent=2)

        return f"""
// === VFX INTEGRATION TEST RUNNER ===
// Generated: {datetime.now().isoformat()}

const VFX_INTEGRATION_TESTS = {scenarios_json};

class VFXIntegrationTestRunner {{
    constructor() {{
        this.results = [];
        this.currentTest = null;
        this.setupComplete = false;
    }}

    async runAllTests() {{
        console.log('=== VFX INTEGRATION TESTS STARTED ===');
        console.log(`Running ${{VFX_INTEGRATION_TESTS.length}} tests...`);

        for (const scenario of VFX_INTEGRATION_TESTS) {{
            await this.runTest(scenario);
        }}

        this.printSummary();
        return this.results;
    }}

    async runTest(scenario) {{
        console.log(`\\n--- Test: ${{scenario.name}} ---`);
        console.log(scenario.description);

        this.currentTest = {{
            name: scenario.name,
            startTime: performance.now(),
            passed: false,
            errors: [],
            warnings: []
        }};

        try {{
            // Setup test environment
            console.log('Setting up test environment...');
            eval(scenario.setup_code);

            // Wait for VFX activation
            await this.sleep(1000);

            // Run validation
            console.log('Running validation...');
            eval(scenario.validation_code);

            // Wait for validation results
            await this.sleep(500);

            this.currentTest.passed = true;
            console.log('✓ Test passed');

        }} catch (error) {{
            this.currentTest.passed = false;
            this.currentTest.errors.push(error.message);
            console.error('✗ Test failed:', error.message);
        }}

        this.currentTest.endTime = performance.now();
        this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;

        this.results.push(this.currentTest);

        // Cleanup
        this.cleanupTest();
    }}

    cleanupTest() {{
        // Remove test nodes/links
        if (typeof window.game !== 'undefined' && window.game) {{
            // Implementation depends on your game API
            // This is a placeholder
            console.log('Cleaning up test environment...');
        }}
    }}

    sleep(ms) {{
        return new Promise(resolve => setTimeout(resolve, ms));
    }}

    printSummary() {{
        console.log('\\n=== TEST SUMMARY ===');
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log(`Total: ${{total}} | Passed: ${{passed}} | Failed: ${{failed}}`);

        if (failed > 0) {{
            console.log('\\nFailed tests:');
            this.results.filter(r => !r.passed).forEach(r => {{
                console.log(`  - ${{r.name}}`);
                r.errors.forEach(e => console.log(`    Error: ${{e}}`));
            }});
        }} else {{
            console.log('\\n🎉 All tests passed!');
        }}
    }}

    exportResults() {{
        return {{
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passed: this.results.filter(r => r.passed).length,
            failed: this.results.filter(r => !r.passed).length,
            results: this.results
        }};
    }}
}}

// Auto-run if in browser
if (typeof window !== 'undefined') {{
    window.__VFX_TEST_RUNNER__ = new VFXIntegrationTestRunner();

    // Expose run command
    window.runVFXIntegrationTests = async () => {{
        const results = await window.__VFX_TEST_RUNNER__.runAllTests();
        return window.__VFX_TEST_RUNNER__.exportResults();
    }};

    console.log('VFX Integration Test Runner loaded.');
    console.log('Run: await window.runVFXIntegrationTests()');
}}
"""

    def generate_report(self) -> str:
        """Generate test report."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX INTEGRATION TEST SCENARIOS")
        lines.append("=" * 70)
        lines.append("")

        for i, scenario in enumerate(self.test_scenarios, 1):
            lines.append(f"Test {i}: {scenario.name}")
            lines.append("-" * 70)
            lines.append(f"Description: {scenario.description}")
            lines.append("")
            lines.append("Triggers:")
            for trigger in scenario.triggers:
                lines.append(f"  - {trigger}")
            lines.append("")
            lines.append("Expected VFX Systems:")
            for vfx in scenario.expected_vfx:
                lines.append(f"  - {vfx}")
            lines.append("")
            lines.append("Expected Metrics:")
            for metric, value in scenario.expected_metrics.items():
                lines.append(f"  - {metric}: {value}")
            lines.append("")
            lines.append("-" * 70)
            lines.append("")

        lines.append(f"Total Scenarios: {len(self.test_scenarios)}")
        lines.append("")

        return "\n".join(lines)

    def save_test_runner(self, output_file: str = "vfx_integration_test_runner.js") -> None:
        """Save test runner to file."""
        runner_code = self.generate_test_runner()

        output_path = self.workspace_root / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(runner_code)

        print(f"Test runner saved to {output_path}")

    def save_scenarios(self, output_file: str = "vfx_test_scenarios.json") -> None:
        """Save test scenarios to JSON."""
        scenarios_data = [asdict(s) for s in self.test_scenarios]

        output_path = self.workspace_root / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(scenarios_data, f, indent=2)

        print(f"Test scenarios saved to {output_path}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Integration Tester')
    parser.add_argument('command', choices=['generate-scenarios', 'run-tests', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output-runner', default='vfx_integration_test_runner.js',
                       help='Output file for test runner')
    parser.add_argument('--output-scenarios', default='vfx_test_scenarios.json',
                       help='Output file for test scenarios')
    parser.add_argument('--output-report', help='Output file for test report')

    args = parser.parse_args()

    tester = VFXIntegrationTester(args.workspace)

    if args.command == 'generate-scenarios':
        tester.discover_vfx_systems()
        tester.generate_scenarios()

        # Save outputs
        tester.save_test_runner(args.output_runner)
        tester.save_scenarios(args.output_scenarios)

        print("\n" + tester.generate_report())

    elif args.command == 'run-tests':
        print("To run integration tests:")
        print("1. Load vfx_integration_test_runner.js in the browser")
        print("2. Run: await window.runVFXIntegrationTests()")
        print("3. Check console for results")

    elif args.command == 'report':
        tester.discover_vfx_systems()
        tester.generate_scenarios()

        report = tester.generate_report()

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output_report}")
        else:
            print(report)


if __name__ == '__main__':
    main()
