#!/usr/bin/env python3
"""
Link Lifecycle Tester - ATOMA Link VFX Lifecycle Testing

Tests complete link VFX stack from creation to destruction.
Verifies all link VFX systems activate and clean up properly.

Usage:
    python link_lifecycle_tester.py generate-tests       # Generate lifecycle tests
    python link_lifecycle_tester.py analyze-stack         # Analyze link VFX stack
    python link_lifecycle_tester.py report                # Generate analysis report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from datetime import datetime


class LinkVFXStackAnalyzer:
    """Analyzes the complete link VFX stack."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.link_vfx_systems = []
        self.link_events = []
        self.lifecycle_hooks = []

    def analyze_stack(self) -> None:
        """Analyze all link-related VFX systems."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for link VFX systems...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.link_vfx_systems)} link VFX systems")
        print(f"Found {len(self.link_events)} link events")
        print(f"Found {len(self.lifecycle_hooks)} lifecycle hooks")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for link VFX systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find link VFX systems
            link_vfx_keywords = [
                "Link", "Strand", "Bead", "Spark", "Trail", "Pulse",
                "Resonance", "Cascade", "Glow", "Arc", "Aura", "Flow"
            ]

            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)
            for match in class_matches:
                class_name = match.group(1)

                if any(keyword.lower() in class_name.lower() for keyword in link_vfx_keywords):
                    self.link_vfx_systems.append({
                        "name": class_name,
                        "file": str(file_path),
                        "file_name": file_path.name,
                        "type": self._classify_link_vfx_type(class_name)
                    })

            # Find link events
            link_event_patterns = [
                r"link\.created",
                r"link\.removed",
                r"link\.destroyed",
                r"link\.harmony\.",
                r"link\.corruption\.",
                r"link:collapsed",
                r"link:harmonicLock"
            ]

            for pattern in link_event_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    self.link_events.append({
                        "event": match.group(0),
                        "file": str(file_path),
                        "line": content[:match.start()].count('\n') + 1
                    })

            # Find lifecycle hooks (onLinkCreated, onLinkRemoved, etc.)
            lifecycle_patterns = [
                r"onLinkCreated",
                r"onLinkRemoved",
                r"onLinkDestroyed",
                r"handleLinkCreated",
                r"handleLinkRemoved",
                r"registerLink",
                r"unregisterLink"
            ]

            for pattern in lifecycle_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    self.lifecycle_hooks.append({
                        "hook": match.group(0),
                        "file": str(file_path),
                        "line": content[:match.start()].count('\n') + 1
                    })

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _classify_link_vfx_type(self, class_name: str) -> str:
        """Classify the type of link VFX system."""
        name_lower = class_name.lower()

        if "strand" in name_lower or "skin" in name_lower:
            return "core_visual"
        elif "bead" in name_lower:
            return "bead_system"
        elif "spark" in name_lower:
            return "particle_system"
        elif "trail" in name_lower:
            return "particle_trail"
        elif "pulse" in name_lower:
            return "pulse_effect"
        elif "glow" in name_lower:
            return "glow_effect"
        elif "arc" in name_lower or "discharge" in name_lower:
            return "arc_effect"
        elif "resonance" in name_lower:
            return "resonance_effect"
        elif "cascade" in name_lower:
            return "cascade_effect"
        elif "corruption" in name_lower:
            return "corruption_effect"
        elif "healing" in name_lower:
            return "healing_effect"
        else:
            return "other"

    def generate_lifecycle_test(self) -> str:
        """Generate comprehensive link lifecycle test."""
        vfx_systems_list = json.dumps([s["name"] for s in self.link_vfx_systems], indent=2)

        return f"""
// === LINK LIFECYCLE TEST ===
// Generated: {datetime.now().isoformat()}

const EXPECTED_LINK_VFX_SYSTEMS = {vfx_systems_list};

class LinkLifecycleTester {{
    constructor() {{
        self.testNodes = [];
        self.testLinks = [];
        self.vfxActivationLog = [];
        self.cleanupLog = [];
        self.memoryLeaks = [];

        self._setupVFXTracking();
    }}

    _setupVFXTracking() {{
        // Track VFX system activation
        const originalCreate = THREE.Object3D.prototype.add;
        THREE.Object3D.prototype.add = function(child) {{
            if (child.userData && child.userData.vfxSystem) {{
                window.__LINK_LIFECYCLE_TESTER__.vfxActivationLog.push({{
                    system: child.userData.vfxSystem,
                    timestamp: performance.now(),
                    action: 'created'
                }});
                console.log(`[VFX] ${{child.userData.vfxSystem}} created`);
            }}
            return originalCreate.call(this, child);
        }};

        // Track VFX system cleanup
        const originalDispose = THREE.Object3D.prototype.dispose;
        THREE.Object3D.prototype.dispose = function() {{
            if (this.userData && this.userData.vfxSystem) {{
                window.__LINK_LIFECYCLE_TESTER__.cleanupLog.push({{
                    system: this.userData.vfxSystem,
                    timestamp: performance.now(),
                    action: 'disposed'
                }});
                console.log(`[VFX] ${{this.userData.vfxSystem}} disposed`);
            }}
            return originalDispose.call(this);
        }};
    }}

    async runCompleteLifecycleTest() {{
        console.log('=== LINK LIFECYCLE TEST STARTED ===');

        try {{
            // Phase 1: Create nodes
            console.log('\\nPhase 1: Creating nodes...');
            await this._createTestNodes();

            // Phase 2: Create link
            console.log('\\nPhase 2: Creating link...');
            await this._createTestLink();

            // Phase 3: Verify VFX activation
            console.log('\\nPhase 3: Verifying VFX activation...');
            await this._verifyVFXActivation();

            // Phase 4: Simulate link activity
            console.log('\\nPhase 4: Simulating link activity...');
            await this._simulateLinkActivity();

            // Phase 5: Update metrics
            console.log('\\nPhase 5: Updating metrics...');
            await this._updateLinkMetrics();

            // Phase 6: Destroy link
            console.log('\\nPhase 6: Destroying link...');
            await this._destroyLink();

            // Phase 7: Verify cleanup
            console.log('\\nPhase 7: Verifying cleanup...');
            await this._verifyCleanup();

            // Phase 8: Check for memory leaks
            console.log('\\nPhase 8: Checking for memory leaks...');
            await this._checkMemoryLeaks();

            // Final cleanup
            await this._cleanup();

            self.printSummary();
            return this.generateReport();

        }} catch (error) {{
            console.error('Test failed:', error);
            await this._cleanup();
            throw error;
        }}
    }}

    async _createTestNodes() {{
        const nodeA = window.game?.spawnNode('input');
        const nodeB = window.game?.spawnNode('process');

        if (!nodeA || !nodeB) {{
            throw new Error('Failed to create test nodes');
        }}

        nodeA.position.set(-10, 0, 0);
        nodeB.position.set(10, 0, 0);

        nodeA.userData.metrics = {{
            synergy: 0.8,
            harmony: 0.7,
            stability: 0.9,
            corruption: 0.1,
            loadPressure: 0.3
        }};

        nodeB.userData.metrics = {{
            synergy: 0.8,
            harmony: 0.7,
            stability: 0.9,
            corruption: 0.1,
            loadPressure: 0.3
        }};

        self.testNodes.push(nodeA, nodeB);
        console.log('✓ Test nodes created');
    }}

    async _createTestLink() {{
        if (this.testNodes.length < 2) {{
            throw new Error('Not enough nodes to create link');
        }}

        const link = window.game?.createLink(this.testNodes[0], this.testNodes[1]);

        if (!link) {{
            throw new Error('Failed to create test link');
        }}

        link.userData.metrics = {{
            synergy: 0.85,
            harmony: 0.75,
            stability: 0.9,
            corruption: 0.05,
            loadPressure: 0.25
        }};

        self.testLinks.push(link);
        console.log('✓ Test link created');

        // Wait for VFX to initialize
        await this.sleep(500);
    }}

    async _verifyVFXActivation() {{
        const activeVFX = this._getActiveVFXSystems();

        console.log(`Active VFX systems: ${{activeVFX.length}}`);

        if (activeVFX.length === 0) {{
            console.warn('✗ No VFX systems activated');
            return;
        }}

        const expectedCount = EXPECTED_LINK_VFX_SYSTEMS.length;
        const actualCount = activeVFX.length;

        console.log(`Expected: ${{expectedCount}}, Actual: ${{actualCount}}`);

        const missing = EXPECTED_LINK_VFX_SYSTEMS.filter(exp =>
            !activeVFX.some(act => act.includes(exp))
        );

        if (missing.length > 0) {{
            console.warn('Missing VFX systems:', missing);
        }} else {{
            console.log('✓ All expected VFX systems activated');
        }}

        console.log('Active systems:', activeVFX);
    }}

    async _simulateLinkActivity() {{
        // Simulate data flow
        for (let i = 0; i < 5; i++) {{
            await this.sleep(100);
            // Update link activity
            if (this.testLinks[0]) {{
                self.testLinks[0].userData.activity = 0.5 + Math.random() * 0.5;
            }}
        }}

        console.log('✓ Link activity simulated');
    }}

    async _updateLinkMetrics() {{
        if (this.testLinks[0]) {{
            // Update metrics to trigger VFX responses
            self.testLinks[0].userData.metrics.synergy = 0.95;
            self.testLinks[0].userData.metrics.harmony = 0.85;

            // Emit metric update event
            window.semanticBus?.emit('link.metrics.updated', {{
                linkId: this.testLinks[0].userData.linkId,
                metrics: this.testLinks[0].userData.metrics
            }});

            await this.sleep(300);
            console.log('✓ Link metrics updated');
        }}
    }}

    async _destroyLink() {{
        if (this.testLinks.length === 0) {{
            console.warn('No links to destroy');
            return;
        }}

        const link = this.testLinks[0];

        // Emit link removed event
        window.semanticBus?.emit('link.removed', {{
            linkId: link.userData.linkId,
            sourceId: link.source.userData.nodeId,
            targetId: link.target.userData.nodeId
        }});

        // Remove link (implementation depends on your API)
        if (window.game?.removeLink) {{
            window.game.removeLink(link);
        }}

        self.testLinks.shift();
        await this.sleep(500);
        console.log('✓ Link destroyed');
    }}

    async _verifyCleanup() {{
        const disposedVFX = this.cleanupLog.filter(log => log.action === 'disposed');

        console.log(`Disposed VFX systems: ${{disposedVFX.length}}`);

        if (disposedVFX.length === 0) {{
            console.warn('✗ No VFX systems disposed - potential memory leak');
        }} else {{
            console.log('✓ VFX systems cleaned up');
            console.log('Disposed systems:', disposedVFX.map(l => l.system));
        }}
    }}

    async _checkMemoryLeaks() {{
        // Check for lingering objects
        const lingeringObjects = this._findLingeringObjects();

        if (lingeringObjects.length > 0) {{
            console.warn('⚠️ Potential memory leaks detected:');
            lingeringObjects.forEach(obj => {{
                console.log(`  - ${{obj.type}}: ${{obj.count}} instances`);
            }});
            self.memoryLeaks = lingeringObjects;
        }} else {{
            console.log('✓ No memory leaks detected');
        }}
    }}

    _getActiveVFXSystems() {{
        // Collect active VFX systems from the scene
        const systems = [];
        const scene = window.game?.scene;

        if (scene) {{
            scene.traverse((child) => {{
                if (child.userData && child.userData.vfxSystem) {{
                    systems.push(child.userData.vfxSystem);
                }}
            }});
        }}

        return [...new Set(systems)]; // Remove duplicates
    }}

    _findLingeringObjects() {{
        // Look for objects that should have been cleaned up
        const lingering = [];
        const scene = window.game?.scene;

        if (!scene) return lingering;

        // Count different types of objects
        const typeCounts = {{}};
        scene.traverse((child) => {{
            if (child.userData && child.userData.linkId) {{
                const type = child.type || 'unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            }}
        }});

        Object.entries(typeCounts).forEach(([type, count]) => {{
            if (count > 10) {{  // Threshold for potential leak
                lingering.push({{ type, count }});
            }}
        }});

        return lingering;
    }}

    async _cleanup() {{
        // Clean up test nodes
        for (const node of this.testNodes) {{
            if (window.game?.removeNode) {{
                window.game.removeNode(node);
            }}
        }}

        self.testNodes = [];
        self.testLinks = [];

        console.log('✓ Test cleanup complete');
    }}

    sleep(ms) {{
        return new Promise(resolve => setTimeout(resolve, ms));
    }}

    printSummary() {{
        console.log('\\n=== TEST SUMMARY ===');
        console.log(`VFX Activated: ${{this.vfxActivationLog.length}}`);
        console.log(`VFX Disposed: ${{this.cleanupLog.length}}`);
        console.log(`Memory Leaks: ${{this.memoryLeaks.length}}`);

        if (this.memoryLeaks.length === 0 && this.cleanupLog.length > 0) {{
            console.log('\\n🎉 Lifecycle test PASSED - No memory leaks!');
        }} else {{
            console.log('\\n⚠️ Lifecycle test ISSUES detected');
        }}
    }}

    generateReport() {{
        return {{
            timestamp: new Date().toISOString(),
            vfxActivated: this.vfxActivationLog.length,
            vfxDisposed: this.cleanupLog.length,
            memoryLeaks: this.memoryLeaks,
            passed: this.memoryLeaks.length === 0 && this.cleanupLog.length > 0,
            activationLog: this.vfxActivationLog,
            cleanupLog: this.cleanupLog
        }};
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__LINK_LIFECYCLE_TESTER__ = new LinkLifecycleTester();

    window.runLinkLifecycleTest = async () => {{
        return await window.__LINK_LIFECYCLE_TESTER__.runCompleteLifecycleTest();
    }};

    console.log('Link Lifecycle Tester loaded.');
    console.log('Run: await window.runLinkLifecycleTest()');
}}
"""

    def generate_analysis_report(self) -> str:
        """Generate analysis report."""
        lines = []
        lines.append("=" * 70)
        lines.append("LINK VFX STACK ANALYSIS")
        lines.append("=" * 70)
        lines.append("")

        # Group VFX systems by type
        by_type = {}
        for system in self.link_vfx_systems:
            vfx_type = system["type"]
            if vfx_type not in by_type:
                by_type[vfx_type] = []
            by_type[vfx_type].append(system)

        lines.append(f"Total Link VFX Systems: {len(self.link_vfx_systems)}")
        lines.append(f"Total Link Events: {len(self.link_events)}")
        lines.append(f"Total Lifecycle Hooks: {len(self.lifecycle_hooks)}")
        lines.append("")

        lines.append("VFX SYSTEMS BY TYPE")
        lines.append("-" * 70)
        for vfx_type, systems in sorted(by_type.items()):
            lines.append(f"\n{vfx_type.upper()}:")
            for system in systems:
                lines.append(f"  - {system['name']} ({system['file_name']})")

        lines.append("\n")
        lines.append("LINK EVENTS")
        lines.append("-" * 70)
        for event in sorted(self.link_events, key=lambda e: e["event"]):
            lines.append(f"  {event['event']} - {event['file_name']}:{event['line']}")

        lines.append("\n")
        lines.append("LIFECYCLE HOOKS")
        lines.append("-" * 70)
        for hook in sorted(self.lifecycle_hooks, key=lambda h: h["hook"]):
            lines.append(f"  {hook['hook']} - {hook['file_name']}:{hook['line']}")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)

        if len(by_type.get("core_visual", [])) == 0:
            lines.append("⚠️ No core visual systems found - links may not render")

        if len(by_type.get("particle_system", [])) == 0:
            lines.append("⚠️ No particle systems found - links may lack visual feedback")

        if len(self.lifecycle_hooks) == 0:
            lines.append("⚠️ No lifecycle hooks found - VFX may not clean up properly")

        if len(self.link_events) == 0:
            lines.append("⚠️ No link events found - VFX may not activate on link changes")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Link Lifecycle Tester')
    parser.add_argument('command', choices=['generate-tests', 'analyze-stack', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output-test', default='link_lifecycle_test.js',
                       help='Output file for test script')
    parser.add_argument('--output-report', help='Output file for analysis report')

    args = parser.parse_args()

    tester = LinkVFXStackAnalyzer(args.workspace)

    if args.command == 'analyze-stack':
        tester.analyze_stack()
        print("\n" + tester.generate_analysis_report())

    elif args.command == 'generate-tests':
        tester.analyze_stack()

        # Generate and save test
        test_code = tester.generate_lifecycle_test()
        output_path = tester.workspace_root / args.output_test

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(test_code)

        print(f"Lifecycle test generated: {args.output_test}")
        print("\nUsage:")
        print("1. Load link_lifecycle_test.js in browser")
        print("2. Run: await window.runLinkLifecycleTest()")
        print("3. Check console for results")

    elif args.command == 'report':
        tester.analyze_stack()
        report = tester.generate_analysis_report()

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output_report}")
        else:
            print(report)


if __name__ == '__main__':
    main()
