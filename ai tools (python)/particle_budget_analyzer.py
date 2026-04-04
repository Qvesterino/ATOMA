#!/usr/bin/env python3
"""
Particle Budget Analyzer - ATOMA Particle Pool Budget Analysis

Analyzes particle system pools and budgets.
Suggests optimal pool sizes based on actual usage patterns.

Usage:
    python particle_budget_analyzer.py analyze              # Analyze particle systems
    python particle_budget_analyzer.py report               # Generate budget report
    python particle_budget_analyzer.py suggest             # Suggest pool sizes
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class ParticleBudgetAnalyzer:
    """Analyzes particle system budgets and pool usage."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.particle_systems = []
        this.pool_definitions = []

    def analyze_particle_systems(self) -> None:
        """Analyze all particle systems in the codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for particle systems...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.particle_systems)} particle systems")
        print(f"Found {len(self.pool_definitions)} pool definitions")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for particle systems."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            # Find particle system classes
            class_matches = re.finditer(r'class\s+(\w*Particle\w*|\w*Particles\w*)\s*(?:extends\s+\w+)?\s*\{', content)

            for match in class_matches:
                class_name = match.group(1)
                self.particle_systems.append({
                    "name": class_name,
                    "file": str(file_path),
                    "file_name": file_path.name
                })

            # Find pool definitions
            for line_num, line in enumerate(lines, 1):
                self._find_pool_definitions(line, line_num, str(file_path), file_path.name)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _find_pool_definitions(self, line: str, line_num: int, file_path: str, file_name: str) -> None:
        """Find particle pool size definitions."""
        # Look for pool size patterns
        pool_patterns = [
            r'maxParticles\s*[=:]\s*(\d+)',
            r'poolSize\s*[=:]\s*(\d+)',
            r'maxCount\s*[=:]\s*(\d+)',
            r'particleCount\s*[=:]\s*(\d+)',
            r'pool\s*[=\[]\s*[{\[]?(\d+)',
            r'new\s+(?:THREE\.)?Points\([^,]*,\s*(\d+)',  // THREE.Points(count)
            r'new\s+(?:THREE\.)?BufferGeometry\([^,]*,\s*(\d+)',  // BufferGeometry with vertex count
        ]

        for pattern in pool_patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                pool_size = int(match.group(1))

                # Try to determine what type of pool this is
                pool_type = self._classify_pool(line)

                self.pool_definitions.append({
                    "size": pool_size,
                    "type": pool_type,
                    "file": file_path,
                    "file_name": file_name,
                    "line": line_num,
                    "code": line.strip()
                })

    def _classify_pool(self, line: str) -> str:
        """Classify the type of particle pool."""
        line_lower = line.lower()

        if 'spark' in line_lower or 'sparks' in line_lower:
            return "spark"
        elif 'trail' in line_lower or 'trails' in line_lower:
            return "trail"
        elif 'bead' in line_lower or 'beads' in line_lower:
            return "bead"
        elif 'burst' in line_lower:
            return "burst"
        elif 'cascade' in line_lower:
            return "cascade"
        elif 'healing' in line_lower:
            return "healing"
        elif 'corruption' in line_lower:
            return "corruption"
        elif 'wave' in line_lower:
            return "wave"
        elif 'resonance' in line_lower:
            return "resonance"
        elif 'point' in line_lower or 'points' in line_lower:
            return "point"
        elif 'mesh' in line_lower:
            return "mesh"
        else:
            return "generic"

    def analyze_budgets(self) -> Dict[str, Any]:
        """Analyze particle budgets and usage patterns."""
        analysis = {
            "systems": {},
            "pools": {},
            "totals": {},
            "recommendations": []
        }

        # Group pools by type
        pools_by_type = defaultdict(list)
        for pool in self.pool_definitions:
            pools_by_type[pool["type"]].append(pool)

        # Analyze each pool type
        for pool_type, pools in pools_by_type.items():
            sizes = [p["size"] for p in pools]

            analysis["pools"][pool_type] = {
                "count": len(pools),
                "total_size": sum(sizes),
                "min_size": min(sizes),
                "max_size": max(sizes),
                "avg_size": sum(sizes) / len(sizes),
                "sizes": sizes
            }

            # Check for oversized pools
            max_reasonable = self._get_max_reasonable_size(pool_type)
            oversized = [p for p in pools if p["size"] > max_reasonable]

            if oversized:
                analysis["recommendations"].append({
                    "type": "oversized_pool",
                    "pool_type": pool_type,
                    "count": len(oversized),
                    "max_size": max(sizes),
                    "recommended_max": max_reasonable,
                    "files": list(set(p["file_name"] for p in oversized))
                })

        # Calculate totals
        analysis["totals"] = {
            "total_pools": len(self.pool_definitions),
            "total_particles": sum(p["size"] for p in self.pool_definitions),
            "total_types": len(pools_by_type),
            "max_pool_size": max(p["size"] for p in self.pool_definitions) if self.pool_definitions else 0
        }

        return analysis

    def _get_max_reasonable_size(self, pool_type: str) -> int:
        """Get the maximum reasonable size for a pool type."""
        reasonable_sizes = {
            "spark": 200,
            "trail": 500,
            "bead": 300,
            "burst": 500,
            "cascade": 1000,
            "healing": 400,
            "corruption": 600,
            "wave": 800,
            "resonance": 400,
            "point": 1000,
            "mesh": 100,
            "generic": 500
        }

        return reasonable_sizes.get(pool_type, 500)

    def generate_suggestions(self) -> List[Dict[str, Any]]:
        """Generate pool size suggestions."""
        suggestions = []
        budgets = self.analyze_budgets()

        # Suggest pool sizes based on analysis
        for pool_type, data in budgets["pools"].items():
            max_reasonable = self._get_max_reasonable_size(pool_type)

            # Suggest size based on average, capped at reasonable max
            suggested_size = min(int(data["avg_size"] * 1.2), max_reasonable)

            if data["max_size"] > max_reasonable:
                suggestions.append({
                    "pool_type": pool_type,
                    "current_max": data["max_size"],
                    "current_avg": int(data["avg_size"]),
                    "suggested_size": suggested_size,
                    "reason": f"Current max ({data['max_size']}) exceeds reasonable limit ({max_reasonable})",
                    "potential_savings": data["max_size"] - suggested_size
                })
            elif data["avg_size"] < suggested_size * 0.5:
                suggestions.append({
                    "pool_type": pool_type,
                    "current_max": data["max_size"],
                    "current_avg": int(data["avg_size"]),
                    "suggested_size": suggested_size,
                    "reason": f"Average usage ({int(data['avg_size'])}) is much lower than capacity ({data['max_size']})",
                    "potential_savings": 0,  # No actual savings, just optimization
                    "action": "reduce_pool_size"
                })

        return suggestions

    def generate_report(self) -> str:
        """Generate particle budget analysis report."""
        budgets = self.analyze_budgets()
        suggestions = self.generate_suggestions()

        lines = []
        lines.append("=" * 70)
        lines.append("PARTICLE BUDGET ANALYSIS REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Particle Systems: {len(self.particle_systems)}")
        lines.append(f"Pool Definitions: {budgets['totals']['total_pools']}")
        lines.append(f"Total Particles (Theoretical Max): {budgets['totals']['total_particles']}")
        lines.append(f"Pool Types: {budgets['totals']['total_types']}")
        lines.append(f"Largest Single Pool: {budgets['totals']['max_pool_size']}")
        lines.append("")

        # Pools by type
        lines.append("POOL BREAKDOWN BY TYPE")
        lines.append("-" * 70)
        for pool_type, data in budgets["pools"].items():
            lines.append(f"\n{pool_type.upper()}:")
            lines.append(f"  Count: {data['count']}")
            lines.append(f"  Total Size: {data['total_size']}")
            lines.append(f"  Min: {data['min_size']}")
            lines.append(f"  Max: {data['max_size']}")
            lines.append(f"  Avg: {int(data['avg_size'])}")

            # Check if oversized
            max_reasonable = self._get_max_reasonable_size(pool_type)
            if data["max_size"] > max_reasonable:
                lines.append(f"  ⚠️ OVERSIZED (max reasonable: {max_reasonable})")
            else:
                lines.append(f"  ✓ Within reasonable limits")

        # Suggestions
        if suggestions:
            lines.append("\n")
            lines.append("OPTIMIZATION SUGGESTIONS")
            lines.append("-" * 70)
            for suggestion in suggestions:
                lines.append(f"\n{suggestion['pool_type'].upper()}:")
                lines.append(f"  Current Max: {suggestion['current_max']}")
                lines.append(f"  Current Avg: {suggestion['current_avg']}")
                lines.append(f"  Suggested: {suggestion['suggested_size']}")
                lines.append(f"  Reason: {suggestion['reason']}")
                if suggestion.get("potential_savings", 0) > 0:
                    lines.append(f"  Potential Savings: {suggestion['potential_savings']} particles")

                if suggestion.get("action") == "reduce_pool_size":
                    lines.append(f"  Action: Consider reducing pool size to {suggestion['suggested_size']}")
        else:
            lines.append("\n")
            lines.append("✓ All pools are within reasonable size limits")

        # Particle systems
        if self.particle_systems:
            lines.append("\n")
            lines.append("PARTICLE SYSTEMS")
            lines.append("-" * 70)
            for system in self.particle_systems[:10]:
                lines.append(f"  {system['name']} ({system['file_name']})")

            if len(self.particle_systems) > 10:
                lines.append(f"  ... and {len(self.particle_systems) - 10} more")

        # Memory estimation
        lines.append("\n")
        lines.append("MEMORY ESTIMATION")
        lines.append("-" * 70)

        # Estimate memory usage (rough estimate)
        # Assuming ~100 bytes per particle (position, color, size, age, velocity, etc.)
        total_particles = budgets['totals']['total_particles']
        estimated_mb = (total_particles * 100) / (1024 * 1024)

        lines.append(f"Estimated Particle Memory: ~{estimated_mb:.2f} MB")
        lines.append("Note: This is a rough estimate. Actual memory usage depends on:")
        lines.append("  - Number of active particles (vs pool size)")
        lines.append("  - Particle data structure complexity")
        lines.append("  - Buffer vs array implementation")
        lines.append("  - Shared geometries/materials")

        # Best practices
        lines.append("\n")
        lines.append("BEST PRACTICES")
        lines.append("-" * 70)
        lines.append("1. Use object pooling to avoid GC")
        lines.append("2. Cap pool sizes based on actual usage")
        lines.append("3. Implement LOD to reduce particle count at distance")
        lines.append("4. Reuse geometries and materials where possible")
        lines.append("5. Use typed arrays for better memory efficiency")
        lines.append("6. Consider GPU particle systems for high counts")
        lines.append("7. Implement cleanup for inactive particles")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Particle Budget Analyzer')
    parser.add_argument('command', choices=['analyze', 'report', 'suggest'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    analyzer = ParticleBudgetAnalyzer(args.workspace)

    if args.command == 'analyze':
        analyzer.analyze_particle_systems()
        print("\n" + analyzer.generate_report())

    elif args.command == 'report':
        analyzer.analyze_particle_systems()
        report = analyzer.generate_report()

        if args.output == 'json':
            data = {
                "particle_systems": analyzer.particle_systems,
                "pool_definitions": analyzer.pool_definitions,
                "budgets": analyzer.analyze_budgets(),
                "suggestions": analyzer.generate_suggestions(),
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

    elif args.command == 'suggest':
        analyzer.analyze_particle_systems()
        suggestions = analyzer.generate_suggestions()

        print("POOL SIZE SUGGESTIONS:\n")
        for suggestion in suggestions:
            print(f"{suggestion['pool_type'].upper()}: {suggestion['suggested_size']}")
            print(f"  Current: {suggestion['current_max']}")
            print(f"  Reason: {suggestion['reason']}")
            if suggestion.get("potential_savings", 0) > 0:
                print(f"  Savings: {suggestion['potential_savings']} particles")
            print()


if __name__ == '__main__':
    main()
