#!/usr/bin/env python3
"""
VFX Lifecycle Tracker - ATOMA VFX System Monitoring Tool

Tracks VFX system activation/deactivation and identifies zombie systems.
Generates instrumentation code for runtime tracking.

Usage:
    python vfx_lifecycle_tracker.py analyze                 # Analyze VFX systems
    python vfx_lifecycle_tracker.py generate-instrumentation  # Generate tracking code
    python vfx_lifecycle_tracker.py report                  # Generate lifecycle report
"""

import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Any
from datetime import datetime


class VFXSystem:
    """Represents a VFX system found in code."""

    def __init__(self, file_path: str, class_name: str, system_type: str):
        self.file_path = file_path
        self.class_name = class_name
        self.system_type = system_type  # 'Visualizer', 'ParticleSystem', 'Cascade', etc.
        self.constructor_line = None
        self.destructor_line = None
        self.update_method_line = None
        self.has_instrumentation = False
        self.instantiation_points = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file": self.file_path,
            "class_name": self.class_name,
            "system_type": self.system_type,
            "constructor_line": self.constructor_line,
            "destructor_line": self.destructor_line,
            "update_method_line": self.update_method_line,
            "has_instrumentation": self.has_instrumentation,
            "instantiation_points": self.instantiation_points
        }


class VFXLifecycleTracker:
    """Tracks VFX system lifecycle and generates instrumentation."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems: List[VFXSystem] = []
        self.vfx_keywords = [
            "Visualizer", "ParticleSystem", "Cascade", "Resonance",
            "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
            "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura",
            "Flux", "Emitter", "Renderer", "System"
        ]

    def analyze_directory(self, directory: str = None) -> None:
        """Analyze all JS files for VFX systems."""
        if directory is None:
            directory = self.workspace_root

        js_files = list(Path(directory).rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} JavaScript files for VFX systems...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.vfx_systems)} VFX systems")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single JS file for VFX systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find VFX classes
            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)

            for match in class_matches:
                class_name = match.group(1)
                start_pos = match.start()

                # Check if it's a VFX system
                if self._is_vfx_system(class_name):
                    system_type = self._classify_system_type(class_name)

                    # Find the class body
                    brace_count = 0
                    class_body_start = match.end()
                    for i in range(class_body_start, len(content)):
                        if content[i] == '{':
                            brace_count += 1
                        elif content[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                class_body = content[class_body_start:i]
                                break

                    vfx_system = VFXSystem(str(file_path), class_name, system_type)
                    vfx_system.constructor_line = self._find_line_number(content, match.start())

                    # Find constructor
                    constructor_match = re.search(r'constructor\s*\([^)]*\)\s*\{', class_body)
                    if constructor_match:
                        vfx_system.constructor_line += self._find_line_number(class_body, constructor_match.start())

                    # Find destructor/cleanup method
                    destructor_match = re.search(
                        r'(dispose|cleanup|destroy|shutdown|teardown)\s*\([^)]*\)\s*\{',
                        class_body
                    )
                    if destructor_match:
                        vfx_system.destructor_line = vfx_system.constructor_line + self._find_line_number(
                            class_body, destructor_match.start()
                        )

                    # Find update method
                    update_match = re.search(r'update\s*\([^)]*\)\s*\{', class_body)
                    if update_match:
                        vfx_system.update_method_line = vfx_system.constructor_line + self._find_line_number(
                            class_body, update_match.start()
                        )

                    # Check for existing instrumentation
                    vfx_system.has_instrumentation = 'VFX_LIFECYCLE_TRACKER' in class_body or \
                                                        '__VFX_TRACK' in class_body

                    self.vfx_systems.append(vfx_system)

            # Find instantiation points for all systems
            self._find_instantiation_points(str(file_path), content)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _is_vfx_system(self, class_name: str) -> bool:
        """Check if class name indicates a VFX system."""
        for keyword in self.vfx_keywords:
            if keyword.lower() in class_name.lower():
                return True
        return False

    def _classify_system_type(self, class_name: str) -> str:
        """Classify the VFX system type."""
        class_name_lower = class_name.lower()
        for keyword in self.vfx_keywords:
            if keyword.lower() in class_name_lower:
                return keyword
        return "Unknown"

    def _find_line_number(self, content: str, pos: int) -> int:
        """Find line number for a position in content."""
        return content[:pos].count('\n') + 1

    def _find_instantiation_points(self, file_path: str, content: str) -> None:
        """Find where VFX systems are instantiated."""
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Pattern: new VFXSystemName(...)
            for system in self.vfx_systems:
                if system.file_path == file_path:
                    pattern = rf'new\s+{re.escape(system.class_name)}\s*\('
                    if re.search(pattern, line):
                        system.instantiation_points.append({
                            "file": file_path,
                            "line": line_num,
                            "code": line.strip()
                        })

    def find_instantiation_in_main(self) -> Dict[str, List[Dict]]:
        """Find VFX instantiations in main.js and other entry points."""
        instantiations = defaultdict(list)

        entry_points = [
            "main.js",
            "index.js",
            "Game.js",
            "World.js"
        ]

        for entry_point in entry_points:
            entry_path = self.workspace_root / entry_point
            if entry_path.exists():
                with open(entry_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                lines = content.split('\n')
                for line_num, line in enumerate(lines, 1):
                    # Find new VFXSystem(...) patterns
                    matches = re.finditer(r'new\s+(\w+[A-Z]\w*)\s*\(', line)
                    for match in matches:
                        class_name = match.group(1)
                        if self._is_vfx_system(class_name):
                            instantiations[entry_point].append({
                                "class_name": class_name,
                                "line": line_num,
                                "code": line.strip()
                            })

        return dict(instantiations)

    def generate_instrumentation_code(self, system: VFXSystem) -> str:
        """Generate instrumentation code for a VFX system."""
        return f"""
// === VFX LIFECYCLE TRACKER INSTRUMENTATION ===
// System: {system.class_name}
// File: {Path(system.file_path).name}
// Generated: {datetime.now().isoformat()}

const __VFX_TRACK_{system.class_name.upper()}_ID = '{system.class_name}_{datetime.now().timestamp()}';

// Track system activation
if (!window.__VFX_LIFECYCLE_TRACKER) {{
    window.__VFX_LIFECYCLE_TRACKER = {{
        activeSystems: new Map(),
        eventLog: [],

        registerSystem(id, name, source) {{
            const systemData = {{
                id,
                name,
                source,
                activatedAt: performance.now(),
                deactivatedAt: null,
                duration: null,
                triggerEvents: []
            }};
            self.activeSystems.set(id, systemData);
            self.eventLog.push({{
                type: 'activate',
                systemId: id,
                systemName: name,
                timestamp: performance.now(),
                source
            }});
            console.log(`[VFX Tracker] Activated: ${{name}} from ${{source}}`);
        }},

        unregisterSystem(id) {{
            if (this.activeSystems.has(id)) {{
                const systemData = this.activeSystems.get(id);
                systemData.deactivatedAt = performance.now();
                systemData.duration = systemData.deactivatedAt - systemData.activatedAt;
                self.activeSystems.delete(id);
                self.eventLog.push({{
                    type: 'deactivate',
                    systemId: id,
                    timestamp: performance.now(),
                    duration: systemData.duration
                }});
                console.log(`[VFX Tracker] Deactivated: ${{systemData.name}} (duration: ${{systemData.duration.toFixed(2)}}ms)`);
            }}
        }},

        logEvent(systemId, eventType, data = {{}}) {{
            if (this.activeSystems.has(systemId)) {{
                const systemData = this.activeSystems.get(systemId);
                systemData.triggerEvents.push({{
                    type: eventType,
                    timestamp: performance.now(),
                    data
                }});
            }}
        }},

        getStatus() {{
            return {{
                active: Array.from(this.activeSystems.values()),
                log: this.eventLog,
                zombieSystems: this.findZombieSystems()
            }};
        }},

        findZombieSystems() {{
            // Systems active for more than 60 seconds without deactivate
            const now = performance.now();
            return Array.from(this.activeSystems.values()).filter(s =>
                (now - s.activatedAt) > 60000
            );
        }}
    }};
}}

// Add instrumentation to constructor
"""

    def generate_report(self) -> str:
        """Generate lifecycle analysis report."""
        instantiations = self.find_instantiation_in_main()

        lines = []
        lines.append("=" * 70)
        lines.append("VFX LIFECYCLE TRACKER ANALYSIS REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Total VFX Systems Found: {len(self.vfx_systems)}")
        lines.append(f"Systems with Instrumentation: {sum(1 for s in self.vfx_systems if s.has_instrumentation)}")
        lines.append(f"Systems without Instrumentation: {sum(1 for s in self.vfx_systems if not s.has_instrumentation)}")
        lines.append("")

        # Instantiation in entry points
        lines.append("VFX SYSTEMS INSTANTIATED IN ENTRY POINTS")
        lines.append("-" * 70)
        for entry_point, inst_list in instantiations.items():
            if inst_list:
                lines.append(f"\n{entry_point}:")
                for inst in inst_list:
                    lines.append(f"  Line {inst['line']}: {inst['class_name']}")
                    lines.append(f"    {inst['code']}")
        lines.append("")

        # System details
        lines.append("VFX SYSTEMS DETAILS")
        lines.append("-" * 70)
        for system in sorted(self.vfx_systems, key=lambda s: s.class_name):
            lines.append(f"\n{system.class_name} ({system.system_type})")
            lines.append(f"  File: {Path(system.file_path).name}")
            lines.append(f"  Constructor: Line {system.constructor_line}")
            if system.destructor_line:
                lines.append(f"  Destructor: Line {system.destructor_line}")
            else:
                lines.append(f"  Destructor: NOT FOUND - potential memory leak!")
            if system.update_method_line:
                lines.append(f"  Update: Line {system.update_method_line}")
            lines.append(f"  Instrumentation: {'✓' if system.has_instrumentation else '✗'}")
            if system.instantiation_points:
                lines.append(f"  Instantiations: {len(system.instantiation_points)}")
            else:
                lines.append(f"  Instantiations: NOT FOUND - potential dead code!")

        # Issues
        lines.append("\n")
        lines.append("POTENTIAL ISSUES")
        lines.append("-" * 70)

        issues = []

        # Systems without destructor
        for system in self.vfx_systems:
            if not system.destructor_line:
                issues.append({
                    "type": "missing_destructor",
                    "system": system.class_name,
                    "severity": "high",
                    "description": f"System '{system.class_name}' has no destructor - potential memory leak"
                })

        # Systems without instantiation
        for system in self.vfx_systems:
            if not system.instantiation_points:
                issues.append({
                    "type": "missing_instantiation",
                    "system": system.class_name,
                    "severity": "medium",
                    "description": f"System '{system.class_name}' is never instantiated - potential dead code"
                })

        # Systems without instrumentation
        for system in self.vfx_systems:
            if not system.has_instrumentation:
                issues.append({
                    "type": "missing_instrumentation",
                    "system": system.class_name,
                    "severity": "low",
                    "description": f"System '{system.class_name}' has no lifecycle instrumentation"
                })

        for issue in issues:
            lines.append(f"\n[{issue['severity'].upper()}] {issue['type']}")
            lines.append(f"  {issue['description']}")
            if 'system' in issue:
                lines.append(f"  System: {issue['system']}")

        if not issues:
            lines.append("\nNo issues found!")

        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)
        lines.append("1. Add dispose/cleanup methods to systems without destructors")
        lines.append("2. Remove or document systems that are never instantiated")
        lines.append("3. Add lifecycle instrumentation to all active VFX systems")
        lines.append("4. Implement automatic cleanup on world switch/node removal")
        lines.append("5. Add VFX pool cleanup to world destruction")

        return "\n".join(lines)

    def export_to_json(self, output_file: str = "vfx_lifecycle_data.json") -> None:
        """Export analysis data to JSON."""
        data = {
            "scan_time": datetime.now().isoformat(),
            "total_systems": len(self.vfx_systems),
            "systems": [s.to_dict() for s in self.vfx_systems],
            "instantiations": self.find_instantiation_in_main()
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"Data exported to {output_file}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Lifecycle Tracker')
    parser.add_argument('command', choices=['analyze', 'generate-instrumentation', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--system', help='Specific VFX system to instrument')
    parser.add_argument('--output', help='Output file for report/instrumentation')

    args = parser.parse_args()

    tracker = VFXLifecycleTracker(args.workspace)

    if args.command == 'analyze':
        tracker.analyze_directory()
        print("\n" + tracker.generate_report())

    elif args.command == 'generate-instrumentation':
        tracker.analyze_directory()

        if args.system:
            # Generate instrumentation for specific system
            system = next((s for s in tracker.vfx_systems if s.class_name == args.system), None)
            if system:
                code = tracker.generate_instrumentation_code(system)
                output_file = args.output or f"{system.class_name}_instrumentation.js"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(code)
                print(f"Instrumentation code generated for {system.class_name} -> {output_file}")
            else:
                print(f"System '{args.system}' not found")
        else:
            # Generate instrumentation for all systems
            for system in tracker.vfx_systems:
                if not system.has_instrumentation:
                    code = tracker.generate_instrumentation_code(system)
                    output_file = f"{system.class_name}_instrumentation.js"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(code)
                    print(f"Generated: {output_file}")

    elif args.command == 'report':
        tracker.analyze_directory()
        report = tracker.generate_report()

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output}")
        else:
            print(report)

        tracker.export_to_json()


if __name__ == '__main__':
    main()
