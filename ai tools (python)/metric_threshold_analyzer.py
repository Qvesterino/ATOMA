#!/usr/bin/env python3
"""
Metric Threshold Analyzer - ATOMA Metric Threshold Configuration Analysis

Analyzes all metric threshold configurations and identifies inconsistencies.
Suggests consistent default values across systems.

Usage:
    python metric_threshold_analyzer.py analyze               # Analyze thresholds
    python metric_threshold_analyzer.py report                # Generate threshold report
    python metric_threshold_analyzer.py suggest              # Suggest consistent thresholds
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
from collections import defaultdict


class MetricThresholdAnalyzer:
    """Analyzes metric threshold configurations."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.thresholds = []
        self.canonical_metrics = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']
        self.comparison_operators = ['>=', '>', '<=', '<', '==', '!=', '===', '!==']

    def analyze_directory(self) -> None:
        """Analyze all JS files for metric thresholds."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for metric thresholds...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.thresholds)} threshold patterns")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for metric thresholds."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Look for metric threshold patterns
                for metric in self.canonical_metrics:
                    self._find_metric_thresholds(metric, line, line_num, str(file_path), file_path.name)

                # Also look for common metric variable names
                self._find_threshold_patterns(line, line_num, str(file_path), file_path.name)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _find_metric_thresholds(self, metric: str, line: str, line_num: int,
                                file_path: str, file_name: str) -> None:
        """Find thresholds for a specific metric."""
        # Pattern: metric > value, metric >= value, etc.
        patterns = [
            rf'{re.escape(metric)}\s*(>=|>|<=|<|===|==|!==|!=)\s*([\d.]+)',
            rf'([\d.]+)\s*(>=|>|<=|<|===|==|!==|!=)\s*{re.escape(metric)}',
            rf'{re.escape(metric)}\s*>=\s*([\d.]+)\s*\|\|\s*{re.escape(metric)}\s*<=\s*([\d.]+)',  # Range
            rf'{re.escape(metric)}\s*>\s*([\d.]+)\s*&&\s*{re.escape(metric)}\s*<\s*([\d.]+)',  # Range
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                threshold = self._extract_threshold(match, metric, line, line_num, file_path, file_name)
                if threshold:
                    self.thresholds.append(threshold)

    def _find_threshold_patterns(self, line: str, line_num: int,
                                 file_path: str, file_name: str) -> None:
        """Find general threshold patterns."""
        # Look for config objects with thresholds
        if 'threshold' in line.lower() or 'Threshold' in line:
            # Try to extract threshold definition
            threshold_pattern = r'(\w+)\s*:\s*([\d.]+)\s*,?\s*//\s*(\w+)'
            matches = re.finditer(threshold_pattern, line)

            for match in matches:
                value = float(match.group(2))
                context = match.group(3) if match.lastindex > 2 else "unknown"

                # Try to guess which metric this applies to
                metric = self._guess_metric_from_context(context)

                if metric:
                    self.thresholds.append({
                        "metric": metric,
                        "operator": "=",
                        "value": value,
                        "context": context,
                        "file": file_path,
                        "file_name": file_name,
                        "line": line_num,
                        "code": line.strip()
                    })

    def _guess_metric_from_context(self, context: str) -> str:
        """Guess which metric a threshold applies to from context."""
        context_lower = context.lower()

        for metric in self.canonical_metrics:
            if metric.lower() in context_lower:
                return metric

        return None

    def _extract_threshold(self, match: re.Match, metric: str, line: str,
                          line_num: int, file_path: str, file_name: str) -> Dict[str, Any]:
        """Extract threshold information from regex match."""
        groups = match.groups()

        # Determine if it's a range or single comparison
        if len(groups) >= 3 and groups[0] in self.comparison_operators:
            # Single comparison: metric >= value
            return {
                "metric": metric,
                "operator": groups[0],
                "value": float(groups[1]),
                "file": file_path,
                "file_name": file_name,
                "line": line_num,
                "code": line.strip(),
                "type": "single"
            }
        elif len(groups) >= 4:
            # Range: metric >= value1 && metric <= value2
            return {
                "metric": metric,
                "operator": "range",
                "value_min": float(groups[0]) if groups[0].replace('.', '').isdigit() else None,
                "value_max": float(groups[1]) if groups[1].replace('.', '').isdigit() else None,
                "file": file_path,
                "file_name": file_name,
                "line": line_num,
                "code": line.strip(),
                "type": "range"
            }

        return None

    def analyze_consistency(self) -> Dict[str, Any]:
        """Analyze threshold consistency across systems."""
        analysis = {
            "metrics": {},
            "inconsistencies": [],
            "recommendations": []
        }

        # Group thresholds by metric
        by_metric = defaultdict(list)
        for threshold in self.thresholds:
            metric = threshold["metric"]
            by_metric[metric].append(threshold)

        # Analyze each metric
        for metric in self.canonical_metrics:
            if metric not in by_metric:
                continue

            thresholds = by_metric[metric]

            # Extract single comparison values
            single_values = []
            for t in thresholds:
                if t["type"] == "single" and t["operator"] in [">=", ">", "==", "==="]:
                    single_values.append(t["value"])

            if single_values:
                # Find min, max, median, mode
                single_values_sorted = sorted(single_values)
                min_val = single_values_sorted[0]
                max_val = single_values_sorted[-1]
                median_val = single_values_sorted[len(single_values_sorted) // 2]

                # Find mode (most common value)
                from collections import Counter
                value_counts = Counter(single_values)
                mode_val = value_counts.most_common(1)[0][0] if value_counts else None

                # Check for inconsistencies
                inconsistencies = []
                if max_val - min_val > 0.5:  # More than 0.5 difference
                    inconsistencies.append(f"Value range too wide: {min_val} - {max_val}")

                if len(set(single_values)) > 5:
                    inconsistencies.append(f"Too many distinct values: {len(set(single_values))}")

                analysis["metrics"][metric] = {
                    "count": len(single_values),
                    "min": min_val,
                    "max": max_val,
                    "median": median_val,
                    "mode": mode_val,
                    "distinct_values": len(set(single_values)),
                    "inconsistencies": inconsistencies
                }

                # Add to global inconsistencies
                if inconsistencies:
                    analysis["inconsistencies"].append({
                        "metric": metric,
                        "issues": inconsistencies,
                        "range": f"{min_val} - {max_val}",
                        "median": median_val,
                        "mode": mode_val
                    })

        return analysis

    def generate_suggestions(self) -> List[Dict[str, Any]]:
        """Generate suggestions for consistent thresholds."""
        suggestions = []
        consistency = self.analyze_consistency()

        # Suggest consistent values based on mode
        for metric, data in consistency["metrics"].items():
            if data["mode"] is not None:
                suggestions.append({
                    "metric": metric,
                    "recommended_value": data["mode"],
                    "current_range": f"{data['min']} - {data['max']}",
                    "distinct_values": data["distinct_values"],
                    "usage_count": data["count"],
                    "rationale": f"Most commonly used value ({data['count']} occurrences)"
                })
            else:
                # No single values found, suggest default based on metric
                default_values = {
                    "synergy": 0.75,
                    "harmony": 0.7,
                    "stability": 0.8,
                    "corruption": 0.5,
                    "loadPressure": 0.7
                }

                suggestions.append({
                    "metric": metric,
                    "recommended_value": default_values.get(metric, 0.7),
                    "current_range": "No single comparison thresholds found",
                    "distinct_values": 0,
                    "usage_count": 0,
                    "rationale": "Suggested default based on metric type"
                })

        return suggestions

    def generate_report(self) -> str:
        """Generate threshold analysis report."""
        consistency = self.analyze_consistency()
        suggestions = self.generate_suggestions()

        lines = []
        lines.append("=" * 70)
        lines.append("METRIC THRESHOLD ANALYSIS REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Total Threshold Patterns Found: {len(self.thresholds)}")
        lines.append(f"Metrics with Thresholds: {len(consistency['metrics'])}")
        lines.append(f"Inconsistencies Detected: {len(consistency['inconsistencies'])}")
        lines.append("")

        # Metric breakdown
        lines.append("METRIC THRESHOLD BREAKDOWN")
        lines.append("-" * 70)
        for metric in self.canonical_metrics:
            if metric in consistency["metrics"]:
                data = consistency["metrics"][metric]
                lines.append(f"\n{metric.upper()}:")
                lines.append(f"  Count: {data['count']}")
                lines.append(f"  Range: {data['min']} - {data['max']}")
                lines.append(f"  Median: {data['median']}")
                lines.append(f"  Mode: {data['mode']}")
                lines.append(f"  Distinct Values: {data['distinct_values']}")

                if data["inconsistencies"]:
                    lines.append("  ⚠️ Inconsistencies:")
                    for issue in data["inconsistencies"]:
                        lines.append(f"    - {issue}")
                else:
                    lines.append("  ✓ Consistent")
        else:
            lines.append(f"\n{metric.upper()}: No thresholds found")

        # Inconsistencies
        if consistency["inconsistencies"]:
            lines.append("\n")
            lines.append("INCONSISTENCIES DETECTED")
            lines.append("-" * 70)
            for inc in consistency["inconsistencies"]:
                lines.append(f"\n{inc['metric'].upper()}:")
                lines.append(f"  Range: {inc['range']}")
                lines.append(f"  Median: {inc['median']}")
                lines.append(f"  Mode: {inc['mode']}")
                lines.append("  Issues:")
                for issue in inc["issues"]:
                    lines.append(f"    - {issue}")

        # Suggestions
        if suggestions:
            lines.append("\n")
            lines.append("RECOMMENDED THRESHOLD VALUES")
            lines.append("-" * 70)
            for suggestion in suggestions:
                lines.append(f"\n{suggestion['metric'].upper()}:")
                lines.append(f"  Recommended: {suggestion['recommended_value']}")
                lines.append(f"  Current: {suggestion['current_range']}")
                lines.append(f"  Rationale: {suggestion['rationale']}")

        # Usage examples
        lines.append("\n")
        lines.append("CONSISTENT USAGE EXAMPLES")
        lines.append("-" * 70)
        lines.append("// High synergy threshold")
        lines.append("if (link.userData.metrics.synergy >= 0.75) {")
        lines.append("  // Trigger high-synergy visual")
        lines.append("}")
        lines.append("")
        lines.append("// Corruption warning threshold")
        lines.append("if (node.userData.metrics.corruption > 0.5) {")
        lines.append("  // Show corruption warning")
        lines.append("}")
        lines.append("")
        lines.append("// Stability range check")
        lines.append("if (node.userData.metrics.stability >= 0.7 && node.userData.metrics.stability <= 0.95) {")
        lines.append("  // Node is in stable range")
        lines.append("}")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Metric Threshold Analyzer')
    parser.add_argument('command', choices=['analyze', 'report', 'suggest'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    analyzer = MetricThresholdAnalyzer(args.workspace)

    if args.command == 'analyze':
        analyzer.analyze_directory()
        print("\n" + analyzer.generate_report())

    elif args.command == 'report':
        analyzer.analyze_directory()
        report = analyzer.generate_report()

        if args.output == 'json':
            data = {
                "thresholds": analyzer.thresholds,
                "consistency": analyzer.analyze_consistency(),
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
        analyzer.analyze_directory()
        suggestions = analyzer.generate_suggestions()

        print("RECOMMENDED THRESHOLD VALUES:\n")
        for suggestion in suggestions:
            print(f"{suggestion['metric'].upper()}: {suggestion['recommended_value']}")
            print(f"  {suggestion['rationale']}")
            print()


if __name__ == '__main__':
    main()
