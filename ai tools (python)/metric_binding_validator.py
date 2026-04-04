#!/usr/bin/env python3
"""
Metric Binding Validator - ATOMA Documentation Validation Tool

Validates metric bindings in VFX documentation against actual code.
Finds ghost metrics (documented but not read) and undocumented reads.

Usage:
    python metric_binding_validator.py validate              # Validate bindings
    python metric_binding_validator.py scan-docs             # Scan documentation
    python metric_binding_validator.py report                # Generate validation report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from collections import defaultdict
from datetime import datetime


class DocumentationParser:
    """Parses VFX documentation to extract metric bindings."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.documented_bindings: Dict[str, List[str]] = defaultdict(list)  # vfx_system -> [metrics]
        self.vfx_files = []

    def scan_documentation(self) -> None:
        """Scan VFX documentation files."""
        # Look for VFX documentation
        doc_files = [
            self.workspace_root / "docs" / "audits" / "VIZUALNE EFEKTY VFX.md",
            self.workspace_root / "VIZUALNE EFEKTY VFX.md",
            self.workspace_root / "docs" / "VFX_EMERGENT_AUDIT_REPORT.md"
        ]

        for doc_file in doc_files:
            if doc_file.exists():
                print(f"Scanning documentation: {doc_file}")
                self._parse_vfx_document(doc_file)

        print(f"Found {len(self.documented_bindings)} VFX systems in documentation")

    def _parse_vfx_document(self, doc_path: Path) -> None:
        """Parse a VFX documentation file."""
        try:
            with open(doc_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Pattern to find VFX sections
            # Look for sections like: ### 1.1. LinkResonanceFlowSystem_Session124.js
            section_pattern = r'(?:###?\s*)?(?:\d+\.)+\s*(\w+(?:_\w+)*)\.js'
            sections = re.finditer(section_pattern, content)

            current_system = None
            lines = content.split('\n')

            # Build line-based parsing
            for line_num, line in enumerate(lines):
                section_match = re.search(r'(?:###?\s*)?(?:\d+\.)+\s*(\w+(?:_\w+)*)\.js', line)
                if section_match:
                    current_system = section_match.group(1)
                    self.vfx_files.append(current_system)
                    continue

                # Look for metric references
                if current_system:
                    # Pattern: metric names in backticks or plain text
                    metric_patterns = [
                        r'`([a-zA-Z]+)`',  # metrics in backticks
                        r'(synergy|harmony|stability|corruption|loadPressure)',  # direct metric names
                    ]

                    for pattern in metric_patterns:
                        matches = re.finditer(pattern, line)
                        for match in matches:
                            metric = match.group(1).lower()
                            canonical_metrics = {'synergy', 'harmony', 'stability', 'corruption', 'loadpressure'}
                            if metric in canonical_metrics or any(cm in metric for cm in canonical_metrics):
                                # Normalize metric name
                                metric = metric.replace('loadpressure', 'loadPressure')
                                if metric not in self.documented_bindings[current_system]:
                                    self.documented_bindings[current_system].append(metric)

        except Exception as e:
            print(f"Error parsing {doc_path}: {e}")


class MetricBindingValidator:
    """Validates metric bindings against documentation."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.doc_parser = DocumentationParser(workspace_root)
        self.actual_metrics: Dict[str, Set[str]] = defaultdict(set)  # vfx_system -> {metrics}
        self.issues: List[Dict[str, Any]] = []

    def validate(self) -> Dict[str, Any]:
        """Run full validation."""
        print("Starting metric binding validation...")

        # Step 1: Scan documentation
        self.doc_parser.scan_documentation()

        # Step 2: Scan actual code
        print("\nScanning actual code for metric usage...")
        self._scan_code_for_metrics()

        # Step 3: Compare and find issues
        print("\nComparing documentation with actual code...")
        self._find_issues()

        # Step 4: Generate report
        return self._generate_validation_report()

    def _scan_code_for_metrics(self) -> None:
        """Scan code for actual metric usage."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        for js_file in js_files:
            self._scan_file_for_metrics(js_file)

        print(f"Scanned {len(js_files)} files, found metrics in {len(self.actual_metrics)} systems")

    def _scan_file_for_metrics(self, file_path: Path) -> None:
        """Scan a single file for metric usage."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Extract class name from file
            class_name = file_path.stem

            # Find metric access patterns
            lines = content.split('\n')
            for line_num, line in enumerate(lines, 1):
                self._find_metric_accesses(str(file_path), class_name, line, lines)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def _find_metric_accesses(self, file_path: str, class_name: str,
                             line: str, all_lines: List[str]) -> None:
        """Find metric access patterns."""
        # Pattern: something.metrics.metricName
        patterns = [
            r'(\w+(?:\.\w+)*)\.metrics\.(\w+)',
            r'userData\.metrics\.(\w+)',
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                if match.lastindex == 2:
                    metric_name = match.group(2)
                else:
                    metric_name = match.group(1)

                # Normalize metric name
                metric_name = metric_name.replace('loadPressure', 'loadPressure')

                # Only track canonical metrics
                canonical_metrics = {'synergy', 'harmony', 'stability', 'corruption', 'loadPressure'}
                if metric_name.lower() in canonical_metrics:
                    self.actual_metrics[class_name].add(metric_name)

    def _find_issues(self) -> None:
        """Find validation issues."""
        documented_systems = set(self.doc_parser.documented_bindings.keys())
        actual_systems = set(self.actual_metrics.keys())

        # Ghost metrics: documented but not found in code
        for system, documented_metrics in self.doc_parser.documented_bindings.items():
            actual = self.actual_metrics.get(system, set())

            for metric in documented_metrics:
                if metric not in actual:
                    self.issues.append({
                        "type": "ghost_metric",
                        "system": system,
                        "metric": metric,
                        "severity": "medium",
                        "description": f"Metric '{metric}' documented for '{system}' but not found in code"
                    })

        # Undocumented reads: found in code but not documented
        for system, actual_metrics_set in self.actual_metrics.items():
            documented = self.doc_parser.documented_bindings.get(system, [])

            for metric in actual_metrics_set:
                if metric not in documented:
                    self.issues.append({
                        "type": "undocumented_read",
                        "system": system,
                        "metric": metric,
                        "severity": "low",
                        "description": f"Metric '{metric}' used in '{system}' but not documented"
                    })

        # Undocumented systems: have metrics but not in documentation
        for system in actual_systems - documented_systems:
            self.issues.append({
                "type": "undocumented_system",
                "system": system,
                "metric_count": len(self.actual_metrics[system]),
                "severity": "medium",
                "description": f"System '{system}' uses {len(self.actual_metrics[system])} metrics but not documented"
            })

        # Dead documentation: documented but no metrics found in code
        for system in documented_systems - actual_systems:
            if self.doc_parser.documented_bindings[system]:
                self.issues.append({
                    "type": "dead_documentation",
                    "system": system,
                    "documented_metrics": self.doc_parser.documented_bindings[system],
                    "severity": "low",
                    "description": f"System '{system}' documented with metrics but none found in code"
                })

    def _generate_validation_report(self) -> Dict[str, Any]:
        """Generate validation report."""
        report = {
            "summary": {
                "total_documented_systems": len(self.doc_parser.documented_bindings),
                "total_actual_systems": len(self.actual_metrics),
                "total_issues": len(self.issues),
                "ghost_metrics": sum(1 for i in self.issues if i["type"] == "ghost_metric"),
                "undocumented_reads": sum(1 for i in self.issues if i["type"] == "undocumented_read"),
                "undocumented_systems": sum(1 for i in self.issues if i["type"] == "undocumented_system"),
                "dead_documentation": sum(1 for i in self.issues if i["type"] == "dead_documentation")
            },
            "documented_bindings": dict(self.doc_parser.documented_bindings),
            "actual_metrics": {k: list(v) for k, v in self.actual_metrics.items()},
            "issues": self.issues,
            "validation_time": datetime.now().isoformat()
        }

        return report

    def generate_text_report(self) -> str:
        """Generate text format report."""
        report = self._generate_validation_report()

        lines = []
        lines.append("=" * 70)
        lines.append("METRIC BINDING VALIDATION REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 70)
        summary = report["summary"]
        lines.append(f"Documented Systems: {summary['total_documented_systems']}")
        lines.append(f"Actual Systems: {summary['total_actual_systems']}")
        lines.append(f"Total Issues: {summary['total_issues']}")
        lines.append(f"  - Ghost Metrics: {summary['ghost_metrics']}")
        lines.append(f"  - Undocumented Reads: {summary['undocumented_reads']}")
        lines.append(f"  - Undocumented Systems: {summary['undocumented_systems']}")
        lines.append(f"  - Dead Documentation: {summary['dead_documentation']}")
        lines.append("")

        # Documented bindings
        lines.append("DOCUMENTED METRIC BINDINGS")
        lines.append("-" * 70)
        for system, metrics in sorted(report["documented_bindings"].items()):
            lines.append(f"\n{system}:")
            lines.append(f"  {', '.join(metrics)}")

        # Actual metrics
        lines.append("\n")
        lines.append("ACTUAL METRIC USAGE IN CODE")
        lines.append("-" * 70)
        for system, metrics in sorted(report["actual_metrics"].items()):
            lines.append(f"\n{system}:")
            lines.append(f"  {', '.join(sorted(metrics))}")

        # Issues
        if report["issues"]:
            lines.append("\n")
            lines.append("VALIDATION ISSUES")
            lines.append("-" * 70)

            # Group issues by type
            issues_by_type = defaultdict(list)
            for issue in report["issues"]:
                issues_by_type[issue["type"]].append(issue)

            for issue_type, issues in sorted(issues_by_type.items()):
                lines.append(f"\n{issue_type.replace('_', ' ').title()} ({len(issues)})")
                for issue in issues:
                    lines.append(f"  [{issue['severity'].upper()}] {issue['system']}")
                    if 'metric' in issue:
                        lines.append(f"    Metric: {issue['metric']}")
                    lines.append(f"    {issue['description']}")
        else:
            lines.append("\n")
            lines.append("No issues found! Documentation matches code perfectly. ✅")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)

        if summary['ghost_metrics'] > 0:
            lines.append("1. Remove ghost metrics from documentation or implement them in code")

        if summary['undocumented_reads'] > 0:
            lines.append("2. Document all metric reads in VIZUALNE EFEKTY VFX.md")

        if summary['undocumented_systems'] > 0:
            lines.append("3. Add documentation for systems using metrics")

        if summary['dead_documentation'] > 0:
            lines.append("4. Remove or update dead documentation entries")

        if summary['total_issues'] == 0:
            lines.append("Documentation is up to date! No action needed.")

        return "\n".join(lines)

    def generate_html_report(self) -> str:
        """Generate HTML format report."""
        report = self._generate_validation_report()
        summary = report["summary"]

        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Metric Binding Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #9C27B0; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #9C27B0; }
        .summary-card h3 { margin: 0 0 10px 0; color: #9C27B0; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
        .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .issue.high { border-left-color: #f44336; background: #ffebee; }
        .issue.medium { border-left-color: #ff9800; background: #fff3e0; }
        .issue.low { border-left-color: #4CAF50; background: #e8f5e9; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; margin: 2px; }
        .badge.synergy { background: #e3f2fd; color: #1976D2; }
        .badge.harmony { background: #e8f5e9; color: #388E3C; }
        .badge.stability { background: #fff3e0; color: #F57C00; }
        .badge.corruption { background: #ffebee; color: #c62828; }
        .badge.loadPressure { background: #f3e5f5; color: #7B1FA2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Metric Binding Validation Report</h1>

        <div class="summary">
            <div class="summary-card">
                <h3>Documented Systems</h3>
                <div class="value">{total_documented_systems}</div>
            </div>
            <div class="summary-card">
                <h3>Actual Systems</h3>
                <div class="value">{total_actual_systems}</div>
            </div>
            <div class="summary-card">
                <h3>Total Issues</h3>
                <div class="value">{total_issues}</div>
            </div>
            <div class="summary-card" style="border-left-color: #ff9800;">
                <h3>Ghost Metrics</h3>
                <div class="value">{ghost_metrics}</div>
            </div>
            <div class="summary-card" style="border-left-color: #4CAF50;">
                <h3>Undocumented Reads</h3>
                <div class="value">{undocumented_reads}</div>
            </div>
        </div>

        <h2>📖 Documented Metric Bindings</h2>
        {documented_html}

        <h2>💻 Actual Metric Usage</h2>
        {actual_html}

        <h2>⚠️ Validation Issues</h2>
        {issues_html}
    </div>
</body>
</html>
"""

        # Documented bindings HTML
        documented_html = ""
        for system, metrics in sorted(report["documented_bindings"].items()):
            badges = " ".join(f'<span class="badge {m}">{m}</span>' for m in metrics)
            documented_html += f"""
            <div style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 3px;">
                <strong>{system}</strong><br>
                {badges}
            </div>
            """

        # Actual metrics HTML
        actual_html = ""
        for system, metrics in sorted(report["actual_metrics"].items()):
            badges = " ".join(f'<span class="badge {m}">{m}</span>' for m in sorted(metrics))
            actual_html += f"""
            <div style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 3px;">
                <strong>{system}</strong><br>
                {badges}
            </div>
            """

        # Issues HTML
        issues_html = ""
        if report["issues"]:
            for issue in report["issues"]:
                issues_html += f"""
                <div class="issue {issue['severity']}">
                    <strong>{issue['type'].replace('_', ' ').title()}</strong>
                    <p>{issue['description']}</p>
                    <p><em>System: {issue['system']}</em></p>
                </div>
                """
        else:
            issues_html = "<p>No issues found! Documentation matches code perfectly. ✅</p>"

        return html.format(
            total_documented_systems=summary['total_documented_systems'],
            total_actual_systems=summary['total_actual_systems'],
            total_issues=summary['total_issues'],
            ghost_metrics=summary['ghost_metrics'],
            undocumented_reads=summary['undocumented_reads'],
            documented_html=documented_html,
            actual_html=actual_html,
            issues_html=issues_html
        )


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Metric Binding Validator')
    parser.add_argument('command', choices=['validate', 'scan-docs', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json', 'html'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    validator = MetricBindingValidator(args.workspace)

    if args.command == 'validate':
        report = validator.validate()

        if args.output == 'json':
            print(json.dumps(report, indent=2))
        elif args.output == 'html':
            html = validator.generate_html_report()
            if args.file:
                with open(args.file, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"HTML report saved to {args.file}")
            else:
                print(html)
        else:
            print(validator.generate_text_report())

    elif args.command == 'scan-docs':
        validator.doc_parser.scan_documentation()
        print(f"\nFound {len(validator.doc_parser.documented_bindings)} documented systems:")
        for system, metrics in sorted(validator.doc_parser.documented_bindings.items()):
            print(f"  {system}: {', '.join(metrics)}")

    elif args.command == 'report':
        validator.validate()
        html = validator.generate_html_report()

        output_file = args.file or 'metric_binding_validation_report.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"HTML report saved to {output_file}")


if __name__ == '__main__':
    main()
