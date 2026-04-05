#!/usr/bin/env python3
"""
Geometry Leak Detector - ATOMA Three.js Geometry/Material Leak Detection

Specialized detector for Three.js geometry and material memory leaks.
Analyzes disposal patterns and identifies potential issues.

Usage:
    python geometry_leak_detector.py scan                # Scan for geometry/material usage
    python geometry_leak_detector.py analyze             # Analyze disposal patterns
    python geometry_leak_detector.py report              # Generate leak detection report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class GeometryLeakDetector:
    """Detects Three.js geometry and material leaks."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.geometry_creations = []
        self.material_creations = []
        self.disposals = []

    def scan_directory(self) -> None:
        """Scan all JS files for geometry/material usage."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} files for geometry/material usage...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.geometry_creations)} geometry creations")
        print(f"Found {len(this.material_creations)} material creations")
        print(f"Found {len(this.disposals)} disposals")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single file for geometry/material patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Find geometry creations
                self._find_geometry_creations(line, line_num, str(file_path), file_path.name)

                # Find material creations
                self._find_material_creations(line, line_num, str(file_path), file_path.name)

                # Find disposals
                self._find_disposals(line, line_num, str(file_path), file_path.name)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def _find_geometry_creations(self, line: str, line_num: int,
                                file_path: str, file_name: str) -> None:
        """Find geometry creation patterns."""
        patterns = [
            r'new\s+(?:THREE\.)?(\w*(?:Geometry|BufferGeometry))\s*\(',
            r'createGeometry\s*\(\)',
            r'generateGeometry\s*\(\)',
            r'buildGeometry\s*\(\)'
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                geom_type = match.group(1) if match.lastindex > 0 else "Unknown"

                self.geometry_creations.append({
                    "type": geom_type,
                    "file": file_path,
                    "file_name": file_name,
                    "line": line_num,
                    "code": line.strip(),
                    "has_dispose": self._check_has_dispose_in_scope(line, line_num)
                })

    def _find_material_creations(self, line: str, line_num: int,
                                 file_path: str, file_name: str) -> None:
        """Find material creation patterns."""
        patterns = [
            r'new\s+(?:THREE\.)?(\w*(?:Material|ShaderMaterial))\s*\(',
            r'createMaterial\s*\(\)',
            r'generateMaterial\s*\(\)',
            r'buildMaterial\s*\(\)'
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                mat_type = match.group(1) if match.lastindex > 0 else "Unknown"

                self.material_creations.append({
                    "type": mat_type,
                    "file": file_path,
                    "file_name": file_name,
                    "line": line_num,
                    "code": line.strip(),
                    "has_dispose": self._check_has_dispose_in_scope(line, line_num)
                })

    def _find_disposals(self, line: str, line_num: int,
                       file_path: str, file_name: str) -> None:
        """Find dispose method calls."""
        patterns = [
            r'(\w+)\.dispose\s*\(\)',
            r'geometry\.dispose\s*\(\)',
            r'material\.dispose\s*\(\)',
            r'texture\.dispose\s*\(\)'
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                obj = match.group(1) if match.lastindex > 0 else "geometry/material"

                self.disposals.append({
                    "object": obj,
                    "file": file_path,
                    "file_name": file_name,
                    "line": line_num,
                    "code": line.strip()
                })

    def _check_has_dispose_in_scope(self, line: str, line_num: int) -> bool:
        """Check if there's a dispose call in the same scope (simplified check)."""
        # This is a simplified check - in a real implementation, you'd need to parse the AST
        return "dispose" in line or "cleanup" in line or "destroy" in line

    def analyze_disposal_patterns(self) -> Dict[str, Any]:
        """Analyze disposal patterns and potential leaks."""
        analysis = {
            "geometries": {},
            "materials": {},
            "leak_candidates": []
        }

        # Group geometries by type
        geom_by_type = defaultdict(list)
        for geom in this.geometry_creations:
            geom_by_type[geom["type"]].append(geom)

        # Group materials by type
        mat_by_type = defaultdict(list)
        for mat in this.material_creations:
            mat_by_type[mat["type"]].append(mat)

        # Analyze geometries
        for geom_type, geoms in geom_by_type.items():
            with_dispose = sum(1 for g in geoms if g["has_dispose"])
            without_dispose = len(geoms) - with_dispose

            analysis["geometries"][geom_type] = {
                "total": len(geoms),
                "with_dispose": with_dispose,
                "without_dispose": without_dispose,
                "disposal_ratio": with_dispose / len(geoms) if geoms else 0
            }

            # Check for potential leaks
            if without_dispose > 0:
                analysis["leak_candidates"].append({
                    "type": "geometry",
                    "object_type": geom_type,
                    "count": without_dispose,
                    "reason": "No dispose method found in scope"
                })

        # Analyze materials
        for mat_type, mats in mat_by_type.items():
            with_dispose = sum(1 for m in mats if m["has_dispose"])
            without_dispose = len(mats) - with_dispose

            analysis["materials"][mat_type] = {
                "total": len(mats),
                "with_dispose": with_dispose,
                "without_dispose": without_dispose,
                "disposal_ratio": with_dispose / len(mats) if mats else 0
            }

            # Check for potential leaks
            if without_dispose > 0:
                analysis["leak_candidates"].append({
                    "type": "material",
                    "object_type": mat_type,
                    "count": without_dispose,
                    "reason": "No dispose method found in scope"
                })

        return analysis

    def generate_leak_report(self) -> str:
        """Generate leak detection report."""
        analysis = self.analyze_disposal_patterns()

        lines = []
        lines.append("=" * 70)
        lines.append("THREE.JS GEOMETRY/MATERIAL LEAK DETECTION REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Geometry Creations: {len(this.geometry_creations)}")
        lines.append(f"Material Creations: {len(this.material_creations)}")
        lines.append(f"Dispose Calls Found: {len(this.disposals)}")
        lines.append(f"Potential Leak Candidates: {len(analysis['leak_candidates'])}")
        lines.append("")

        # Geometry analysis
        lines.append("GEOMETRY ANALYSIS")
        lines.append("-" * 70)
        for geom_type, data in analysis["geometries"].items():
            disposal_status = "✓" if data["disposal_ratio"] >= 0.8 else "⚠️"
            lines.append(f"{disposal_status} {geom_type}:")
            lines.append(f"  Total: {data['total']}")
            lines.append(f"  With Dispose: {data['with_dispose']}")
            lines.append(f"  Without Dispose: {data['without_dispose']}")
            lines.append(f"  Disposal Ratio: {data['disposal_ratio']:.1%}")
            lines.append("")

        # Material analysis
        lines.append("MATERIAL ANALYSIS")
        lines.append("-" * 70)
        for mat_type, data in analysis["materials"].items():
            disposal_status = "✓" if data["disposal_ratio"] >= 0.8 else "⚠️"
            lines.append(f"{disposal_status} {mat_type}:")
            lines.append(f"  Total: {data['total']}")
            lines.append(f"  With Dispose: {data['with_dispose']}")
            lines.append(f"  Without Dispose: {data['without_dispose']}")
            lines.append(f"  Disposal Ratio: {data['disposal_ratio']:.1%}")
            lines.append("")

        # Leak candidates
        if analysis["leak_candidates"]:
            lines.append("POTENTIAL LEAK CANDIDATES")
            lines.append("-" * 70)
            for candidate in analysis["leak_candidates"]:
                lines.append(f"\n{candidate['type'].upper()}: {candidate['object_type']}")
                lines.append(f"  Count: {candidate['count']}")
                lines.append(f"  Reason: {candidate['reason']}")
        else:
            lines.append("\n✓ No obvious leak candidates found")

        # Best practices
        lines.append("\n")
        lines.append("BEST PRACTICES FOR THREE.JS MEMORY MANAGEMENT")
        lines.append("-" * 70)
        lines.append("1. Always call dispose() on geometries and materials when no longer needed")
        lines.append("2. Use object pooling for frequently created/destroyed objects")
        lines.append("3. Share geometries and materials where possible")
        lines.append("4. Dispose textures embedded in materials")
        lines.append("5. Remove objects from scene before disposing")
        lines.append("6. Use render groups to manage object lifecycle")
        lines.append("7. Implement proper cleanup in dispose/destroy methods")

        # Common patterns
        lines.append("\n")
        lines.append("COMMON DISPOSAL PATTERNS")
        lines.append("-" * 70)
        lines.append("// Proper geometry disposal:")
        lines.append("geometry.dispose();")
        lines.append("")
        lines.append("// Proper material disposal:")
        lines.append("material.dispose();")
        lines.append("if (material.map) material.map.dispose();")
        lines.append("")
        lines.append("// Full object cleanup:")
        lines.append("mesh.geometry.dispose();")
        lines.append("mesh.material.dispose();")
        lines.append("scene.remove(mesh);")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Geometry Leak Detector')
    parser.add_argument('command', choices=['scan', 'analyze', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    detector = GeometryLeakDetector(args.workspace)

    if args.command == 'scan':
        detector.scan_directory()

        # Show summary
        print(f"\nGeometry Creations: {len(detector.geometry_creations)}")
        print(f"Material Creations: {len(detector.material_creations)}")
        print(f"Dispose Calls: {len(detector.disposals)}")

    elif args.command == 'analyze':
        detector.scan_directory()
        analysis = detector.analyze_disposal_patterns()

        print(f"\nGeometries: {len(detector.geometry_creations)}")
        print(f"Materials: {len(detector.material_creations)}")
        print(f"Leak Candidates: {len(analysis['leak_candidates'])}")

        if analysis["leak_candidates"]:
            print("\nPotential Leaks:")
            for candidate in analysis["leak_candidates"]:
                print(f"  {candidate['type']}: {candidate['object_type']} ({candidate['count']} instances)")

    elif args.command == 'report':
        detector.scan_directory()
        report = detector.generate_leak_report()

        if args.output == 'json':
            data = {
                "geometry_creations": detector.geometry_creations,
                "material_creations": detector.material_creations,
                "disposals": detector.disposals,
                "analysis": detector.analyze_disposal_patterns(),
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


if __name__ == '__main__':
    main()
