#!/usr/bin/env python3
"""
Metric Naming Consistency - ATOMA Metric Naming Validation

Validates metric naming conventions across the codebase.
Identifies non-canonical metrics and naming inconsistencies.

Usage:
    python metric_naming_consistency.py scan              # Scan for naming issues
    python metric_naming_consistency.py report            # Generate consistency report
    python metric_naming_consistency.py fix-suggestions   # Suggest fixes
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from datetime import datetime
from collections import defaultdict


class MetricNamingConsistencyChecker:
    """Checks metric naming consistency."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.canonical_metrics = ['synergy', 'harmony', 'stability', 'corruption', 'loadPressure']
        self.metric_usages = []
        self.naming_issues = []

    def scan_directory(self) -> None:
        """Scan all JS files for metric usage."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} files for metric usage...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(self.metric_usages)} metric usages")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single file for metric usage."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Find metric access patterns
                patterns = [
                    r'(\w+)\.metrics\.(\w+)',  # obj.metrics.metricName
                    r'userData\.metrics\.(\w+)',  # userData.metrics.metricName
                    r'metrics\.(\w+)'  # metrics.metricName
                ]

                for pattern in patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        if match.lastindex == 2:
                            obj = match.group(1)
                            metric = match.group(2)
                        else:
                            obj = "unknown"
                            metric = match.group(1)

                        self.metric_usages.append({
                            "metric": metric,
                            "object": obj,
                            "file": str(file_path),
                            "file_name": file_path.name,
                            "line": line_num,
                            "code": line.strip()
                        })

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def check_consistency(self) -> Dict[str, Any]:
        """Check metric naming consistency."""
        analysis = {
            "canonical_metrics": {},
            "non_canonical_metrics": {},
            "shadow_metrics": {},
            "inconsistencies": []
        }

        # Group by metric name
        by_metric = defaultdict(list)
        for usage in self.metric_usages:
            by_metric[usage["metric"]].append(usage)

        # Check canonical metrics
        for metric in self.canonical_metrics:
            if metric in by_metric:
                usages = by_metric[metric]
                # Check for case inconsistencies
                case_variants = set(u["metric"] for u in usages if u["metric"] != metric)

                analysis["canonical_metrics"][metric] = {
                    "usage_count": len(usages),
                    "case_variants": list(case_variants),
                    "consistent": len(case_variants) == 0
                }

                if case_variants:
                    analysis["inconsistencies"].append({
                        "type": "case_inconsistency",
                        "canonical": metric,
                        "variants": list(case_variants),
                        "usage_count": len(usages)
                    })

        # Check non-canonical metrics
        for metric, usages in by_metric.items():
            if metric not in self.canonical_metrics:
                # Check if it's a variant of a canonical metric
                similar_canonical = self._find_similar_canonical(metric)

                if similar_canonical:
                    analysis["shadow_metrics"][metric] = {
                        "similar_to": similar_canonical,
                        "usage_count": len(usages),
                        "should_use": similar_canonical
                    }
                else:
                    analysis["non_canonical_metrics"][metric] = {
                        "usage_count": len(usages),
                        "first_seen": usages[0]["file_name"]
                    }

        return analysis

    def _find_similar_canonical(self, metric: str) -> str:
        """Find if a metric is a variant of a canonical metric."""
        metric_lower = metric.lower()

        for canonical in self.canonical_metrics:
            canonical_lower = canonical.lower()

            # Check for case differences
            if metric_lower == canonical_lower:
                return canonical

            # Check for common variations
            if (metric_lower in [canonical_lower + "level", canonical_lower + "norm",
                                canonical_lower + "normalized", canonical_lower + "value"]):
                return canonical

            # Check for common prefixes/suffixes
            if canonical_lower in metric_lower or metric_lower in canonical_lower:
                if len(metric_lower) < len(canonical_lower) + 5:  # Not too long
                    return canonical

        return None

    def generate_fix_suggestions(self) -> List[Dict[str, Any]]:
        """Generate suggestions for fixing naming issues."""
        suggestions = []
        analysis = self.check_consistency()

        # Suggest fixes for case inconsistencies
        for metric, data in analysis["canonical_metrics"].items():
            if not data["consistent"]:
                for variant in data["case_variants"]:
                    suggestions.append({
                        "type": "case_correction",
                        "current": variant,
                        "suggested": metric,
                        "reason": f"Non-canonical case, should use '{metric}'",
                        "files_affected": self._get_files_using_metric(variant)
                    })

        # Suggest fixes for shadow metrics
        for metric, data in analysis["shadow_metrics"].items():
            suggestions.append({
                "type": "use_canonical",
                "current": metric,
                "suggested": data["should_use"],
                "reason": f"Variant of canonical metric '{data['should_use']}'",
                "files_affected": self._get_files_using_metric(metric)
            })

        # Suggest action for non-canonical metrics
        for metric, data in analysis["non_canonical_metrics"].items():
            if data["usage_count"] > 5:
                suggestions.append({
                    "type": "review_non_canonical",
                    "current": metric,
                    "suggested": None,
                    "reason": f"Heavily used non-canonical metric ({data['usage_count']} usages) - consider documenting or migrating",
                    "files_affected": self._get_files_using_metric(metric)
                })

        return suggestions

    def _get_files_using_metric(self, metric: str) -> List[str]:
        """Get files using a specific metric."""
        return sorted(list(set(u["file_name"] for u in self.metric_usages if u["metric"] == metric)))

    def generate_report(self) -> str:
        """Generate naming consistency report."""
        analysis = self.check_consistency()
        suggestions = self.generate_fix_suggestions()

        lines = []
        lines.append("=" * 70)
        lines.append("METRIC NAMING CONSISTENCY REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Total Metric Usages: {len(self.metric_usages)}")
        lines.append(f"Canonical Metrics: {len(analysis['canonical_metrics'])}")
        lines.append(f"Shadow Metrics: {len(analysis['shadow_metrics'])}")
        lines.append(f"Non-Canonical Metrics: {len(analysis['non_canonical_metrics'])}")
        lines.append(f"Inconsistencies Found: {len(analysis['inconsistencies'])}")
        lines.append("")

        # Canonical metrics
        lines.append("CANONICAL METRICS")
        lines.append("-" * 70)
        for metric in self.canonical_metrics:
            if metric in analysis["canonical_metrics"]:
                data = analysis["canonical_metrics"][metric]
                status = "✓" if data["consistent"] else "⚠️"
                lines.append(f"{status} {metric}:")
                lines.append(f"  Usage Count: {data['usage_count']}")

                if not data["consistent"]:
                    lines.append(f"  Case Variants: {', '.join(data['case_variants'])}")
            else:
                lines.append(f"  {metric}: No usage found")
        lines.append("")

        # Shadow metrics
        if analysis["shadow_metrics"]:
            lines.append("SHADOW METRICS (Should use canonical)")
            lines.append("-" * 70)
            for metric, data in analysis["shadow_metrics"].items():
                lines.append(f"{metric} → {data['should_use']}")
                lines.append(f"  Usage: {data['usage_count']} times")
            lines.append("")

        # Non-canonical metrics
        if analysis["non_canonical_metrics"]:
            lines.append("NON-CANONICAL METRICS")
            lines.append("-" * 70)
            for metric, data in sorted(analysis["non_canonical_metrics"].items(),
                                      key=lambda x: x[1]["usage_count"], reverse=True)[:10]:
                lines.append(f"{metric}:")
                lines.append(f"  Usage: {data['usage_count']} times")
                lines.append(f"  First seen: {data['first_seen']}")
            lines.append("")

        # Suggestions
        if suggestions:
            lines.append("FIX SUGGESTIONS")
            lines.append("-" * 70)
            for suggestion in suggestions[:15]:
                lines.append(f"\n[{suggestion['type'].replace('_', ' ').title()}]")
                lines.append(f"  Current: {suggestion['current']}")
                if suggestion["suggested"]:
                    lines.append(f"  Suggested: {suggestion['suggested']}")
                lines.append(f"  Reason: {suggestion['reason']}")
                if suggestion["files_affected"]:
                    files = suggestion['files_affected'][:3]
                    if len(suggestion['files_affected']) > 3:
                        files.append(f"... and {len(suggestion['files_affected']) - 3} more")
                    lines.append(f"  Files: {', '.join(files)}")
        else:
            lines.append("\n✓ All metric names are consistent!")

        # Best practices
        lines.append("\n")
        lines.append("BEST PRACTICES")
        lines.append("-" * 70)
        lines.append("1. Use canonical metric names: synergy, harmony, stability, corruption, loadPressure")
        lines.append("2. Use correct case (camelCase for property access)")
        lines.append("3. Avoid creating shadow metrics unless necessary")
        lines.append("4. Document any custom metrics used outside the canonical set")
        lines.append("5. Consider migrating frequently used non-canonical metrics to canonical")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Metric Naming Consistency Checker')
    parser.add_argument('command', choices=['scan', 'report', 'fix-suggestions'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    checker = MetricNamingConsistencyChecker(args.workspace)

    if args.command == 'scan':
        checker.scan_directory()
        print(f"\nScanned {len(checker.metric_usages)} metric usages")

        # Show summary
        analysis = checker.check_consistency()
        print(f"\nCanonical Metrics: {len(analysis['canonical_metrics'])}")
        print(f"Shadow Metrics: {len(analysis['shadow_metrics'])}")
        print(f"Non-Canonical Metrics: {len(analysis['non_canonical_metrics'])}")

    elif args.command == 'report':
        checker.scan_directory()
        report = checker.generate_report()

        if args.output == 'json':
            data = {
                "metric_usages": checker.metric_usages,
                "consistency": checker.check_consistency(),
                "suggestions": checker.generate_fix_suggestions(),
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

    elif args.command == 'fix-suggestions':
        checker.scan_directory()
        suggestions = checker.generate_fix_suggestions()

        print("FIX SUGGESTIONS:\n")
        for suggestion in suggestions:
            print(f"[{suggestion['type'].replace('_', ' ').title()}]")
            print(f"  Current: {suggestion['current']}")
            if suggestion["suggested"]:
                print(f"  Suggested: {suggestion['suggested']}")
            print(f"  Reason: {suggestion['reason']}")
            print()


if __name__ == '__main__':
    main()
