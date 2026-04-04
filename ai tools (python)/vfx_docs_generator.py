#!/usr/bin/env python3
"""
VFX Docs Generator - ATOMA VFX Documentation Generator

Automatically generates VFX documentation from code.
Updates VIZUALNE EFEKTY VFX.md based on actual implementation.

Usage:
    python vfx_docs_generator.py scan                 # Scan VFX systems
    python vfx_docs_generator.py generate-docs        # Generate documentation
    python vfx_docs_generator.py sync                # Sync docs with code
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


class VFXDocsGenerator:
    """Generates VFX documentation from code."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems = []
        self.documentation_data = {}

    def scan_vfx_systems(self) -> None:
        """Scan all VFX systems in the codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} files for VFX systems...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.vfx_systems)} VFX systems")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for VFX systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find VFX classes
            vfx_keywords = [
                "Visualizer", "ParticleSystem", "Cascade", "Resonance",
                "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
                "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura",
                "Flux", "Emitter", "Renderer", "System"
            ]

            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)

            for match in class_matches:
                class_name = match.group(1)

                if any(keyword.lower() in class_name.lower() for keyword in vfx_keywords):
                    # Extract class information
                    class_info = self._extract_class_info(class_name, content, match.start(), file_path)

                    if class_info:
                        self.vfx_systems.append(class_info)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _extract_class_info(self, class_name: str, content: str,
                            start_pos: int, file_path: Path) -> Optional[Dict[str, Any]]:
        """Extract comprehensive information about a VFX class."""
        # Find class body
        brace_count = 0
        class_body_start = start_pos + len(class_name) + 7  # Skip "class " and class_name
        class_body = ""

        for i in range(start_pos, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    class_body = content[start_pos:i]
                    break

        if not class_body:
            return None

        # Extract information
        class_info = {
            "name": class_name,
            "file": str(file_path),
            "file_name": file_path.name,
            "type": self._classify_vfx_type(class_name),
            "description": self._extract_description(class_body),
            "methods": self._extract_methods(class_body, class_name),
            "scene_additions": self._extract_scene_additions(class_body),
            "metrics_used": self._extract_metrics_used(class_body),
            "events_subscribed": self._extract_events_subscribed(class_body),
            "events_emitted": self._extract_events_emitted(class_body),
            "performance_notes": self._extract_performance_notes(class_body)
        }

        return class_info

    def _classify_vfx_type(self, class_name: str) -> str:
        """Classify the VFX system type."""
        name_lower = class_name.lower()

        type_map = {
            "cascade": "CASCADE VFX",
            "resonance": "RESONANCE VFX",
            "wave": "WAVES",
            "particle": "PARTICLES",
            "synergy": "SYNERGY VFX",
            "harmonic": "HARMONY VFX",
            "corruption": "CORRUPTION VFX",
            "trail": "PARTICLES",
            "spark": "PARTICLES",
            "bead": "LINK VISUAL VFX",
            "pulse": "LINK VISUAL VFX",
            "glow": "LINK VISUAL VFX",
            "aura": "LINK VISUAL VFX",
            "emitter": "PARTICLES"
        }

        for keyword, vfx_type in type_map.items():
            if keyword in name_lower:
                return vfx_type

        return "OTHER"

    def _extract_description(self, class_body: str) -> str:
        """Extract description from comments."""
        # Look for JSDoc or comments at the start of the class
        lines = class_body.split('\n')

        description_lines = []
        for i, line in enumerate(lines[:10]):
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('*'):
                desc = stripped.lstrip('/*')
                if desc and not desc.startswith('@'):
                    description_lines.append(desc)
            elif description_lines:
                break  # Stop at first non-comment line

        return ' '.join(description_lines) if description_lines else "No description found"

    def _extract_methods(self, class_body: str, class_name: str) -> List[str]:
        """Extract public methods from the class."""
        methods = []

        # Find method definitions
        method_pattern = r'(\w+)\s*\([^)]*\)\s*\{'

        matches = re.finditer(method_pattern, class_body)
        for match in matches:
            method_name = match.group(1)

            # Skip if it's a constructor or obvious property
            if method_name in ['constructor', 'get', 'set']:
                continue

            methods.append(method_name)

        return methods

    def _extract_scene_additions(self, class_body: str) -> List[str]:
        """Extract scene additions (geometries, materials, etc.)."""
        additions = []

        # Look for scene.add, this.scene.add, THREE.Mesh, THREE.Points, etc.
        patterns = [
            r'(?:scene|this\.scene)\.add\(([^)]+)\)',
            r'new\s+(?:THREE\.)?(\w+(?:Geometry|Material|Mesh|Points|Group))',
            r'this\.(\w+)\s*=\s*new\s+(?:THREE\.)?(\w+)'
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, class_body)
            for match in matches:
                if match.lastindex > 0:
                    if match.group(1).startswith('Geometry') or match.group(1).startswith('Material'):
                        additions.append(f"THREE.{match.group(1)}")
                    elif match.group(1) in ['Mesh', 'Points', 'Group', 'Line', 'Sprite']:
                        additions.append(f"THREE.{match.group(1)}")
                    elif 'Mesh' in class_body[match.start():match.start()+50]:
                        additions.append("THREE.Mesh")

        return list(set(additions))

    def _extract_metrics_used(self, class_body: str) -> List[str]:
        """Extract metrics used by the VFX system."""
        metrics_found = set()

        # Look for metric access patterns
        metric_patterns = [
            r'\.metrics\.(\w+)',
            r'userData\.metrics\.(\w+)'
        ]

        for pattern in metric_patterns:
            matches = re.finditer(pattern, class_body)
            for match in matches:
                metric = match.group(1)
                if metric in ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']:
                    metrics_found.add(metric)

        return sorted(list(metrics_found))

    def _extract_events_subscribed(self, class_body: str) -> List[str]:
        """Extract events the system subscribes to."""
        events_found = set()

        # Look for semanticBus.on, subscribe, etc.
        patterns = [
            r'(?:semanticBus|eventBus|bus)\.on\([\'"]([^\'"]+)[\'"]',
            r'(?:semanticBus|eventBus|bus)\.subscribe\([\'"]([^\'"]+)[\'"]'
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, class_body)
            for match in matches:
                events_found.add(match.group(1))

        return sorted(list(events_found))

    def _extract_events_emitted(self, class_body: str) -> List[str]:
        """Extract events the system emits."""
        events_found = set()

        # Look for semanticBus.emit
        pattern = r'(?:semanticBus|eventBus|bus)\.emit\([\'"]([^\'"]+)[\'"]'

        matches = re.finditer(pattern, class_body)
        for match in matches:
            events_found.add(match.group(1))

        return sorted(list(events_found))

    def _extract_performance_notes(self, class_body: str) -> List[str]:
        """Extract performance-related notes."""
        notes = []

        # Look for performance-related comments
        perf_keywords = ['performance', 'optimize', 'slow', 'expensive', 'cost', 'budget']

        lines = class_body.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in perf_keywords):
                # Extract the comment
                comment_match = re.search(r'//\s*(.*)', line)
                if comment_match:
                    notes.append(comment_match.group(1).strip())

        return notes[:3]  # Limit to 3 notes

    def generate_documentation(self) -> str:
        """Generate VFX documentation in markdown format."""
        # Group systems by type
        by_type = defaultdict(list)
        for system in self.vfx_systems:
            by_type[system["type"]].append(system)

        lines = []
        lines.append("# VIZUALNE EFEKTY VFX")
        lines.append("")
        lines.append(f"**Generated:** {datetime.now().isoformat()}")
        lines.append(f"**Total Systems:** {len(self.vfx_systems)}")
        lines.append("")

        # Generate documentation for each type
        for vfx_type in ["RESONANCE VFX", "CASCADE VFX", "WAVES", "PARTICLES",
                          "SYNERGY VFX", "HARMONY VFX", "CORRUPTION VFX",
                          "LINK VISUAL VFX", "OTHER"]:

            if vfx_type not in by_type:
                continue

            systems = by_type[vfx_type]
            section_num = len([t for t in by_type if list(by_type.keys()).index(t) < list(by_type.keys()).index(vfx_type)]) + 1

            lines.append(f"## {section_num}. {vfx_type}")
            lines.append("")

            for system in sorted(systems, key=lambda s: s["name"]):
                lines.append(f"### {system['name']}.js")
                lines.append("")
                lines.append(f"**Type:** 🎨 GEOMETRY/MESH EMITTER")
                lines.append("")
                lines.append(f"**File:** {system['file_name']}")
                lines.append("")

                # Description
                lines.append("**What it Does:**")
                if system["description"] != "No description found":
                    lines.append(system["description"])
                else:
                    lines.append(f"VFX system for {system['type'].lower()} effects.")
                lines.append("")

                # Scene Additions
                if system["scene_additions"]:
                    lines.append("**Scene Additions:**")
                    for addition in system["scene_additions"]:
                        lines.append(f"- {addition}")
                    lines.append("")

                # Methods
                if system["methods"]:
                    lines.append("**Key Methods:**")
                    for method in system["methods"][:5]:
                        lines.append(f"- {method}()")
                    if len(system["methods"]) > 5:
                        lines.append(f"- ... and {len(system['methods']) - 5} more")
                    lines.append("")

                # Metrics Used
                if system["metrics_used"]:
                    lines.append("**Metrics Read:**")
                    for metric in system["metrics_used"]:
                        lines.append(f"- {metric}")
                    lines.append("")

                # Events
                if system["events_subscribed"]:
                    lines.append("**Events Subscribed:**")
                    for event in system["events_subscribed"]:
                        lines.append(f"- {event}")
                    lines.append("")

                if system["events_emitted"]:
                    lines.append("**Events Emitted:**")
                    for event in system["events_emitted"]:
                        lines.append(f"- {event}")
                    lines.append("")

                # Performance Notes
                if system["performance_notes"]:
                    lines.append("**Performance Notes:**")
                    for note in system["performance_notes"]:
                        lines.append(f"- {note}")
                    lines.append("")

                lines.append("---")
                lines.append("")

        # Add summary section
        lines.append("## SUMMARY")
        lines.append("")
        lines.append(f"Total VFX Systems Documented: {len(self.vfx_systems)}")
        lines.append("")

        # Count by type
        type_counts = defaultdict(int)
        for system in self.vfx_systems:
            type_counts[system["type"]] += 1

        lines.append("Systems by Type:")
        for vfx_type, count in sorted(type_counts.items()):
            lines.append(f"- {vfx_type}: {count}")
        lines.append("")

        return "\n".join(lines)

    def generate_sync_report(self) -> str:
        """Generate a sync report comparing code with existing docs."""
        # Try to read existing documentation
        doc_path = self.workspace_root / "docs" / "audits" / "VIZUALNE EFEKTY VFX.md"

        if not doc_path.exists():
            doc_path = self.workspace_root / "VIZUALNE EFEKTY VFX.md"

        if not doc_path.exists():
            return "No existing documentation found. This will be a new document."

        try:
            with open(doc_path, 'r', encoding='utf-8', errors='ignore') as f:
                existing_docs = f.read()

            # Find documented systems
            documented_systems = set()
            pattern = r'###\s*(\w+\.js)'

            matches = re.finditer(pattern, existing_docs)
            for match in matches:
                documented_systems.add(match.group(1))

            # Compare with scanned systems
            scanned_systems = set(s["name"] + ".js" for s in self.vfx_systems)

            # Find differences
            new_systems = scanned_systems - documented_systems
            removed_systems = documented_systems - scanned_systems
            common_systems = scanned_systems & documented_systems

            lines = []
            lines.append("DOCUMENTATION SYNC REPORT")
            lines.append("=" * 70)
            lines.append("")
            lines.append(f"Documented Systems: {len(documented_systems)}")
            lines.append(f"Scanned Systems: {len(scanned_systems)}")
            lines.append(f"Common Systems: {len(common_systems)}")
            lines.append(f"New Systems: {len(new_systems)}")
            lines.append(f"Removed Systems: {len(removed_systems)}")
            lines.append("")

            if new_systems:
                lines.append("NEW SYSTEMS (Not in docs):")
                for system in sorted(new_systems):
                    lines.append(f"  + {system}")
                lines.append("")

            if removed_systems:
                lines.append("REMOVED SYSTEMS (In docs but not in code):")
                for system in sorted(removed_systems):
                    lines.append(f"  - {system}")
                lines.append("")

            if not new_systems and not removed_systems:
                lines.append("✓ Documentation is up to date!")

            return "\n".join(lines)

        except Exception as e:
            return f"Error reading existing documentation: {e}"


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Docs Generator')
    parser.add_argument('command', choices=['scan', 'generate-docs', 'sync'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', default='VFX_DOCUMENTATION.md',
                       help='Output file for documentation')

    args = parser.parse_args()

    generator = VFXDocsGenerator(args.workspace)

    if args.command == 'scan':
        generator.scan_vfx_systems()
        print(f"\nFound {len(generator.vfx_systems)} VFX systems")

        # Print summary
        type_counts = defaultdict(int)
        for system in generator.vfx_systems:
            type_counts[system["type"]] += 1

        print("\nSystems by type:")
        for vfx_type, count in sorted(type_counts.items()):
            print(f"  {vfx_type}: {count}")

    elif args.command == 'generate-docs':
        generator.scan_vfx_systems()

        docs = generator.generate_documentation()

        output_path = generator.workspace_root / args.output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(docs)

        print(f"Documentation generated: {args.output}")
        print(f"Systems documented: {len(generator.vfx_systems)}")

    elif args.command == 'sync':
        generator.scan_vfx_systems()
        report = generator.generate_sync_report()
        print(report)


if __name__ == '__main__':
    main()
