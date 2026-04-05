#!/usr/bin/env python3
"""
VFX Dead Code Detector - ATOMA Unused VFX System Detection

Identifies VFX systems that are never activated, never instantiated,
or have methods that are never called.

Usage:
    python vfx_dead_code_detector.py scan                  # Scan for dead code
    python vfx_dead_code_detector.py report                 # Generate dead code report
    python vfx_dead_code_detector.py suggest-cleanup        # Suggest cleanup actions
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from datetime import datetime
from collections import defaultdict


class VFXDeadCodeDetector:
    """Detects unused VFX systems and dead code."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_classes = []
        self.instantiation_map = defaultdict(list)
        self.method_usage_map = defaultdict(set)
        self.import_map = defaultdict(set)
        self.export_map = defaultdict(set)

    def scan_directory(self) -> None:
        """Scan all JS files for VFX dead code."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} files for VFX dead code...")

        # Pass 1: Find all VFX classes and their methods
        for js_file in js_files:
            self._find_vfx_classes(js_file)

        # Pass 2: Find instantiations and usage
        for js_file in js_files:
            self._find_usage(js_file)

        print(f"Found {len(self.vfx_classes)} VFX classes")
        print(f"Found {len(self.instantiation_map)} instantiations")

    def _find_vfx_classes(self, file_path: Path) -> None:
        """Find VFX classes and their methods."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            vfx_keywords = [
                "Visualizer", "ParticleSystem", "Cascade", "Resonance",
                "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
                "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura"
            ]

            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)

            for match in class_matches:
                class_name = match.group(1)

                if any(keyword.lower() in class_name.lower() for keyword in vfx_keywords):
                    # Extract class body
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

                    # Find methods in this class
                    methods = self._extract_methods(class_body, class_name)
                    exports = self._find_exports(content, class_name)

                    self.vfx_classes.append({
                        "name": class_name,
                        "file": str(file_path),
                        "file_name": file_path.name,
                        "methods": methods,
                        "exports": exports,
                        "is_exported": len(exports) > 0
                    })

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def _extract_methods(self, class_body: str, class_name: str) -> List[Dict[str, Any]]:
        """Extract method definitions from class body."""
        methods = []

        # Find all method definitions
        method_pattern = r'(\w+)\s*\([^)]*\)\s*\{'
        matches = re.finditer(method_pattern, class_body)

        for match in matches:
            method_name = match.group(1)

            # Skip if it's a constructor or obvious property
            if method_name in ['constructor', 'get', 'set']:
                continue

            # Find method body
            method_start = match.end()
            brace_count = 0
            method_body = ""

            for i in range(method_start, len(class_body)):
                if class_body[i] == '{':
                    brace_count += 1
                elif class_body[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        method_body = class_body[method_start:i]
                        break

            methods.append({
                "name": method_name,
                "full_name": f"{class_name}.{method_name}",
                "body": method_body,
                "is_called": False
            })

        return methods

    def _find_exports(self, content: str, class_name: str) -> List[str]:
        """Find export statements for this class."""
        exports = []

        # Find export statements
        export_patterns = [
            rf'export\s+(?:default\s+)?{re.escape(class_name)}',
            rf'export\s*{{\s*{re.escape(class_name)}\s*}}',
            rf'module\.exports\s*=\s*{re.escape(class_name)}',
            rf'exports\.{re.escape(class_name)}\s*='
        ]

        for pattern in export_patterns:
            if re.search(pattern, content):
                exports.append("export")

        return exports

    def _find_usage(self, file_path: Path) -> None:
        """Find instantiations and method calls."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Find instantiations: new VFXClassName(...)
                for vfx_class in self.vfx_classes:
                    class_name = vfx_class["name"]
                    pattern = rf'new\s+{re.escape(class_name)}\s*\('

                    if re.search(pattern, line):
                        self.instantiation_map[class_name].append({
                            "file": str(file_path),
                            "file_name": file_path.name,
                            "line": line_num,
                            "code": line.strip()
                        })

                # Find method calls: vfxClass.method()
                for vfx_class in self.vfx_classes:
                    for method in vfx_class["methods"]:
                        method_name = method["name"]
                        pattern = rf'\b{re.escape(vfx_class["name"])}\.\s*{re.escape(method_name)}\s*\('

                        if re.search(pattern, line):
                            self.method_usage_map[method["full_name"]].add(str(file_path))

                # Find imports
                for vfx_class in self.vfx_classes:
                    class_name = vfx_class["name"]

                    # ES6 imports
                    import_pattern = rf'import\s+{{[^}}]*\b{re.escape(class_name)}\b[^}}]*}}\s+from'
                    if re.search(import_pattern, line):
                        self.import_map[class_name].add(str(file_path))

                    # CommonJS requires
                    require_pattern = rf'require\([^)]*{re.escape(class_name)}[^)]*\)'
                    if re.search(require_pattern, line):
                        self.import_map[class_name].add(str(file_path))

        except Exception as e:
            print(f"Error scanning {file_path} for usage: {e}")

    def detect_dead_code(self) -> Dict[str, Any]:
        """Detect dead code patterns."""
        dead_code = {
            "never_instantiated": [],
            "never_imported": [],
            "unused_exports": [],
            "unused_methods": [],
            "commented_out": []
        }

        # Never instantiated
        for vfx_class in self.vfx_classes:
            class_name = vfx_class["name"]

            if class_name not in self.instantiation_map:
                dead_code["never_instantiated"].append({
                    "class": class_name,
                    "file": vfx_class["file_name"],
                    "has_exports": vfx_class["is_exported"]
                })

            # Never imported
            if class_name not in self.import_map:
                dead_code["never_imported"].append({
                    "class": class_name,
                    "file": vfx_class["file_name"],
                    "is_exported": vfx_class["is_exported"]
                })

            # Unused exports
            if vfx_class["is_exported"] and class_name not in self.import_map:
                dead_code["unused_exports"].append({
                    "class": class_name,
                    "file": vfx_class["file_name"]
                })

        # Unused methods
        for vfx_class in self.vfx_classes:
            for method in vfx_class["methods"]:
                method_full_name = method["full_name"]

                if method_full_name not in self.method_usage_map:
                    # Skip common lifecycle methods
                    if method["name"] not in ['update', 'render', 'dispose', 'cleanup', 'init', 'start']:
                        dead_code["unused_methods"].append({
                            "method": method_full_name,
                            "class": vfx_class["name"],
                            "file": vfx_class["file_name"]
                        })

        return dead_code

    def find_commented_code(self) -> List[Dict[str, Any]]:
        """Find commented out VFX code."""
        commented = []

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

                lines = content.split('\n')

                for line_num, line in enumerate(lines, 1):
                    # Check if line is commented
                    if line.strip().startswith('//') or line.strip().startswith('*'):
                        # Check for VFX keywords in comments
                        for keyword in vfx_keywords:
                            if keyword.lower() in line.lower():
                                commented.append({
                                    "file": str(js_file),
                                    "file_name": js_file.name,
                                    "line": line_num,
                                    "content": line.strip()
                                })
                                break

            except Exception as e:
                print(f"Error scanning {js_file} for comments: {e}")

        return commented

    def generate_cleanup_suggestions(self) -> List[Dict[str, Any]]:
        """Generate cleanup suggestions for dead code."""
        suggestions = []
        dead_code = self.detect_dead_code()

        # Suggestions for never instantiated classes
        for item in dead_code["never_instantiated"]:
            if item["has_exports"]:
                suggestions.append({
                    "type": "remove_unused_export",
                    "class": item["class"],
                    "file": item["file"],
                    "reason": "Class is exported but never imported or instantiated",
                    "action": "Remove export statement or document external usage"
                })
            else:
                suggestions.append({
                    "type": "remove_dead_class",
                    "class": item["class"],
                    "file": item["file"],
                    "reason": "Class is never instantiated and not exported",
                    "action": "Remove the class entirely"
                })

        # Suggestions for unused methods
        for item in dead_code["unused_methods"][:10]:  # Limit to 10
            suggestions.append({
                "type": "remove_unused_method",
                "method": item["method"],
                "class": item["class"],
                "file": item["file"],
                "reason": "Method is never called",
                "action": "Remove method or add to API documentation"
            })

        return suggestions

    def generate_report(self) -> str:
        """Generate dead code detection report."""
        dead_code = self.detect_dead_code()
        commented = self.find_commented_code()
        suggestions = self.generate_cleanup_suggestions()

        lines = []
        lines.append("=" * 70)
        lines.append("VFX DEAD CODE DETECTION REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"VFX Classes Analyzed: {len(self.vfx_classes)}")
        lines.append(f"Never Instantiated: {len(dead_code['never_instantiated'])}")
        lines.append(f"Never Imported: {len(dead_code['never_imported'])}")
        lines.append(f"Unused Exports: {len(dead_code['unused_exports'])}")
        lines.append(f"Unused Methods: {len(dead_code['unused_methods'])}")
        lines.append(f"Commented Code Blocks: {len(commented)}")
        lines.append("")

        # Never instantiated
        if dead_code["never_instantiated"]:
            lines.append("NEVER INSTANTIATED CLASSES")
            lines.append("-" * 70)
            for item in dead_code["never_instantiated"]:
                export_status = " (exported)" if item["has_exports"] else ""
                lines.append(f"  ⚠️ {item['class']}{export_status}")
                lines.append(f"     File: {item['file']}")
            lines.append("")

        # Unused methods
        if dead_code["unused_methods"]:
            lines.append("UNUSED METHODS (Top 20)")
            lines.append("-" * 70)
            for item in dead_code["unused_methods"][:20]:
                lines.append(f"  ⚠️ {item['method']}")
                lines.append(f"     File: {item['file']}")
            lines.append("")

        # Commented code
        if commented:
            lines.append("COMMENTED VFX CODE")
            lines.append("-" * 70)
            for item in commented[:10]:
                lines.append(f"  // {item['content']}")
                lines.append(f"     {item['file_name']}:{item['line']}")
            lines.append("")

        # Cleanup suggestions
        if suggestions:
            lines.append("CLEANUP SUGGESTIONS")
            lines.append("-" * 70)
            for suggestion in suggestions[:15]:
                lines.append(f"\n[{suggestion['type'].replace('_', ' ').title()}]")
                lines.append(f"  Target: {suggestion.get('class', suggestion.get('method', 'unknown'))}")
                lines.append(f"  File: {suggestion['file']}")
                lines.append(f"  Reason: {suggestion['reason']}")
                lines.append(f"  Action: {suggestion['action']}")
        else:
            lines.append("\n✓ No cleanup needed - all VFX code appears active")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Dead Code Detector')
    parser.add_argument('command', choices=['scan', 'report', 'suggest-cleanup'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    detector = VFXDeadCodeDetector(args.workspace)

    if args.command == 'scan':
        detector.scan_directory()
        print("\n" + detector.generate_report())

    elif args.command == 'report':
        detector.scan_directory()
        report = detector.generate_report()

        if args.output == 'json':
            data = {
                "dead_code": detector.detect_dead_code(),
                "commented": detector.find_commented_code(),
                "suggestions": detector.generate_cleanup_suggestions(),
                "scan_time": datetime.now().isoformat()
            }
            print(json.dumps(data, indent=2))
        else:
            if args.file:
                with open(args.file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"Report saved to {args.file}")
            else:
                print(report)

    elif args.command == 'suggest-cleanup':
        detector.scan_directory()
        suggestions = detector.generate_cleanup_suggestions()

        print(f"Found {len(suggestions)} cleanup suggestions:\n")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"{i}. [{suggestion['type'].replace('_', ' ').title()}]")
            print(f"   Target: {suggestion.get('class', suggestion.get('method', 'unknown'))}")
            print(f"   Action: {suggestion['action']}")
            print(f"   Reason: {suggestion['reason']}")
            print()


if __name__ == '__main__':
    main()
