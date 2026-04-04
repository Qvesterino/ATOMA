#!/usr/bin/env python3
"""
Metric Flow Tracer - ATOMA Metric Analysis Tool

Traces complete metric flow from source to VFX consumers.
Identifies metric readers, dependency graphs, and potential issues.

Usage:
    python metric_flow_tracer.py scan                    # Scan and analyze metrics
    python metric_flow_tracer.py scan --output json      # Output JSON format
    python metric_flow_tracer.py report                  # Generate HTML report
    python metric_flow_tracer.py validate                # Validate against documentation
"""

import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Any
from datetime import datetime


class MetricAccessPattern:
    """Represents a single metric access pattern in code."""

    def __init__(self, file_path: str, line: int, pattern: str, context: str = ""):
        self.file_path = file_path
        self.line = line
        self.pattern = pattern  # e.g., "link.userData.metrics.synergy"
        self.context = context  # Surrounding code context
        self.access_type = self._classify_access_type(pattern)

    def _classify_access_type(self, pattern: str) -> str:
        """Classify the access type: read, write, or mixed."""
        if "=" in pattern and not "==":
            return "write"
        elif "+=" in pattern or "-=" in pattern:
            return "write"
        else:
            return "read"

    def extract_metric_name(self) -> str:
        """Extract metric name from pattern (e.g., 'synergy' from 'userData.metrics.synergy')."""
        parts = self.pattern.split(".")
        for i, part in enumerate(parts):
            if part == "metrics" and i + 1 < len(parts):
                return parts[i + 1]
        return "unknown"

    def extract_source_object(self) -> str:
        """Extract source object (e.g., 'link', 'node', 'link.source')."""
        parts = self.pattern.split(".")
        if "metrics" in parts:
            idx = parts.index("metrics")
            if idx > 0:
                return ".".join(parts[:idx])
        return "unknown"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file": self.file_path,
            "line": self.line,
            "pattern": self.pattern,
            "access_type": self.access_type,
            "metric": self.extract_metric_name(),
            "source": self.extract_source_object(),
            "context": self.context[:100] if self.context else ""
        }


class VFXSystemIdentifier:
    """Identifies VFX systems and their metric usage."""

    VFX_KEYWORDS = [
        "VisualSystem", "Visualizer", "ParticleSystem", "Cascade",
        "Resonance", "Wave", "Harmonic", "Synergy", "Corruption",
        "Rupture", "Trail", "Spark", "Bead", "Pulse", "Glow",
        "Aura", "Flux", "Emitter", "Renderer"
    ]

    def __init__(self):
        self.vfx_systems = {}

    def classify_file(self, file_path: str, content: str) -> str:
        """Classify file as VFX system or other."""
        file_name = Path(file_path).name

        # Check filename patterns
        for keyword in self.VFX_KEYWORDS:
            if keyword.lower() in file_name.lower():
                return f"VFX_{file_name}"

        # Check class declarations
        class_matches = re.findall(r'class\s+(\w+)\s*{', content)
        for class_name in class_matches:
            for keyword in self.VFX_KEYWORDS:
                if keyword.lower() in class_name.lower():
                    return f"VFX_{class_name}"

        return "Other"


class MetricFlowTracer:
    """Main tracer for metric flow analysis."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.metric_accesses: List[MetricAccessPattern] = []
        self.vfx_identifier = VFXSystemIdentifier()
        self.file_categories: Dict[str, str] = {}
        self._canonical_metrics = {
            "synergy", "harmony", "stability", "corruption", "loadPressure"
        }

    def scan_directory(self, directory: str = None) -> None:
        """Scan all JS files in directory."""
        if directory is None:
            directory = self.workspace_root

        js_files = list(Path(directory).rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} JavaScript files...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(self.metric_accesses)} metric access patterns")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single JS file for metric access patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Classify file
            self.file_categories[str(file_path)] = self.vfx_identifier.classify_file(
                str(file_path), content
            )

            # Find metric access patterns
            lines = content.split('\n')
            for line_num, line in enumerate(lines, 1):
                self._find_metric_accesses(str(file_path), line_num, line, lines)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def _find_metric_accesses(self, file_path: str, line_num: int,
                            line: str, all_lines: List[str]) -> None:
        """Find metric access patterns in a line."""
        # Pattern: something.metrics.metricName or userData.metrics.metricName
        patterns = [
            r'(\w+(?:\.\w+)*)\.metrics\.(\w+)',  # direct metrics access
            r'userData\.metrics\.(\w+)',  # userData.metrics.*
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                full_match = match.group(0) if match.lastindex == 2 else f"userData.metrics.{match.group(1)}"

                # Get context (previous line + current line + next line)
                context_start = max(0, line_num - 2)
                context_end = min(len(all_lines), line_num + 1)
                context = '\n'.join(all_lines[context_start:context_end])

                access = MetricAccessPattern(
                    file_path=file_path,
                    line=line_num,
                    pattern=full_match,
                    context=context
                )
                self.metric_accesses.append(access)

    def build_dependency_graph(self) -> Dict[str, Any]:
        """Build dependency graph of metrics to readers."""
        graph = {
            "metrics": {},
            "systems": {},
            "summary": {}
        }

        # Build metric → readers mapping
        for access in self.metric_accesses:
            metric = access.extract_metric_name()
            if metric == "unknown":
                continue

            if metric not in graph["metrics"]:
                graph["metrics"][metric] = {
                    "readers": set(),
                    "access_count": 0,
                    "access_types": Counter(),
                    "sources": set()
                }

            system = self.file_categories.get(access.file_path, "Other")
            graph["metrics"][metric]["readers"].add(system)
            graph["metrics"][metric]["access_count"] += 1
            graph["metrics"][metric]["access_types"][access.access_type] += 1

            source = access.extract_source_object()
            if source != "unknown":
                graph["metrics"][metric]["sources"].add(source)

        # Convert sets to lists for JSON serialization
        for metric_data in graph["metrics"].values():
            metric_data["readers"] = list(metric_data["readers"])
            metric_data["sources"] = list(metric_data["sources"])
            metric_data["access_types"] = dict(metric_data["access_types"])

        # Build system → metrics mapping
        system_metrics = defaultdict(set)
        for access in self.metric_accesses:
            metric = access.extract_metric_name()
            if metric != "unknown":
                system = self.file_categories.get(access.file_path, "Other")
                system_metrics[system].add(metric)

        for system, metrics in system_metrics.items():
            graph["systems"][system] = {
                "metrics": list(metrics),
                "metric_count": len(metrics)
            }

        # Build summary
        graph["summary"] = {
            "total_metrics": len(graph["metrics"]),
            "total_systems": len(graph["systems"]),
            "total_accesses": len(self.metric_accesses),
            "scan_time": datetime.now().isoformat()
        }

        return graph

    def find_issues(self, graph: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find potential issues with metric usage."""
        issues = []

        # 1. Orphan metrics (defined but never read)
        for metric, data in graph["metrics"].items():
            if data["access_count"] == 0:
                issues.append({
                    "type": "orphan_metric",
                    "metric": metric,
                    "severity": "low",
                    "description": f"Metric '{metric}' is never accessed"
                })

        # 2. Over-accessed metrics (potential duplication)
        for metric, data in graph["metrics"].items():
            if data["access_count"] > 50:
                issues.append({
                    "type": "over_accessed_metric",
                    "metric": metric,
                    "access_count": data["access_count"],
                    "severity": "medium",
                    "description": f"Metric '{metric}' accessed {data['access_count']} times - potential duplication"
                })

        # 3. Write-only metrics
        for metric, data in graph["metrics"].items():
            if data["access_types"].get("write", 0) > 0 and data["access_types"].get("read", 0) == 0:
                issues.append({
                    "type": "write_only_metric",
                    "metric": metric,
                    "severity": "high",
                    "description": f"Metric '{metric}' is written but never read - dead code?"
                })

        # 4. Non-canonical metrics
        for metric in graph["metrics"]:
            if metric not in self._canonical_metrics:
                issues.append({
                    "type": "non_canonical_metric",
                    "metric": metric,
                    "severity": "low",
                    "description": f"Metric '{metric}' is not in canonical set: {self._canonical_metrics}"
                })

        # 5. Systems with no metric access
        for system, data in graph["systems"].items():
            if system.startswith("VFX_") and data["metric_count"] == 0:
                issues.append({
                    "type": "vfx_without_metrics",
                    "system": system,
                    "severity": "medium",
                    "description": f"VFX system '{system}' has no metric access"
                })

        return issues

    def generate_report(self, output_format: str = "text") -> str:
        """Generate analysis report."""
        graph = self.build_dependency_graph()
        issues = self.find_issues(graph)

        if output_format == "json":
            return json.dumps({
                "graph": graph,
                "issues": issues
            }, indent=2)

        elif output_format == "html":
            return self._generate_html_report(graph, issues)

        else:  # text
            return self._generate_text_report(graph, issues)

    def _generate_text_report(self, graph: Dict, issues: List[Dict]) -> str:
        """Generate text format report."""
        lines = []
        lines.append("=" * 60)
        lines.append("METRIC FLOW ANALYSIS REPORT")
        lines.append("=" * 60)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 60)
        summary = graph["summary"]
        lines.append(f"Total Metrics: {summary['total_metrics']}")
        lines.append(f"Total Systems: {summary['total_systems']}")
        lines.append(f"Total Accesses: {summary['total_accesses']}")
        lines.append("")

        # Metrics breakdown
        lines.append("METRICS BREAKDOWN")
        lines.append("-" * 60)
        for metric, data in sorted(graph["metrics"].items()):
            lines.append(f"\n{metric}:")
            lines.append(f"  Access Count: {data['access_count']}")
            lines.append(f"  Readers: {', '.join(data['readers'][:5])}")
            if len(data['readers']) > 5:
                lines.append(f"    ... and {len(data['readers']) - 5} more")
            lines.append(f"  Access Types: {data['access_types']}")

        # Issues
        if issues:
            lines.append("\n")
            lines.append("ISSUES FOUND")
            lines.append("-" * 60)
            for issue in issues:
                lines.append(f"\n[{issue['severity'].upper()}] {issue['type']}")
                lines.append(f"  {issue['description']}")
                if 'metric' in issue:
                    lines.append(f"  Metric: {issue['metric']}")
                if 'system' in issue:
                    lines.append(f"  System: {issue['system']}")
        else:
            lines.append("\n")
            lines.append("No issues found!")

        return "\n".join(lines)

    def _generate_html_report(self, graph: Dict, issues: List[Dict]) -> str:
        """Generate HTML format report."""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Metric Flow Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; }
        .summary-card h3 { margin: 0 0 10px 0; color: #4CAF50; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-card { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric-card h3 { color: #2196F3; margin-top: 0; }
        .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .issue.high { border-left-color: #f44336; background: #ffebee; }
        .issue.medium { border-left-color: #ff9800; background: #fff3e0; }
        .issue.low { border-left-color: #4CAF50; background: #e8f5e9; }
        .tag { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin: 2px; }
        .tag.read { background: #e3f2fd; color: #1976D2; }
        .tag.write { background: #ffebee; color: #c62828; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Metric Flow Analysis Report</h1>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Metrics</h3>
                <div class="value">{total_metrics}</div>
            </div>
            <div class="summary-card">
                <h3>Total Systems</h3>
                <div class="value">{total_systems}</div>
            </div>
            <div class="summary-card">
                <h3>Total Accesses</h3>
                <div class="value">{total_accesses}</div>
            </div>
            <div class="summary-card">
                <h3>Issues Found</h3>
                <div class="value">{issues_count}</div>
            </div>
        </div>

        <h2>📊 Metrics Breakdown</h2>
        {metrics_html}

        <h2>⚠️ Issues Found</h2>
        {issues_html}

        <h2>🔗 Systems Overview</h2>
        {systems_html}
    </div>
</body>
</html>
"""

        # Summary data
        summary = graph["summary"]
        metrics_html = ""

        for metric, data in sorted(graph["metrics"].items()):
            tags = ""
            for access_type, count in data["access_types"].items():
                tags += f'<span class="tag {access_type}">{access_type}: {count}</span>'

            metrics_html += f"""
            <div class="metric-card">
                <h3>{metric}</h3>
                <p><strong>Access Count:</strong> {data['access_count']}</p>
                <p><strong>Access Types:</strong> {tags}</p>
                <p><strong>Readers:</strong> {', '.join(data['readers'][:5])}{'...' if len(data['readers']) > 5 else ''}</p>
                <p><strong>Source Objects:</strong> {', '.join(data['sources'][:3])}</p>
            </div>
            """

        issues_html = ""
        for issue in issues:
            issues_html += f"""
            <div class="issue {issue['severity']}">
                <strong>{issue['type'].replace('_', ' ').title()}</strong>
                <p>{issue['description']}</p>
            </div>
            """

        systems_html = """
        <table>
            <tr>
                <th>System</th>
                <th>Metrics Used</th>
                <th>Count</th>
            </tr>
        """

        for system, data in sorted(graph["systems"].items()):
            metrics = ', '.join(data['metrics'][:5])
            if len(data['metrics']) > 5:
                metrics += f" ... and {len(data['metrics']) - 5} more"

            systems_html += f"""
            <tr>
                <td>{system}</td>
                <td>{metrics}</td>
                <td>{data['metric_count']}</td>
            </tr>
            """

        systems_html += "</table>"

        return html.format(
            total_metrics=summary['total_metrics'],
            total_systems=summary['total_systems'],
            total_accesses=summary['total_accesses'],
            issues_count=len(issues),
            metrics_html=metrics_html,
            issues_html=issues_html if issues else "<p>No issues found! ✅</p>",
            systems_html=systems_html
        )


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Metric Flow Tracer')
    parser.add_argument('command', choices=['scan', 'report', 'validate'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json', 'html'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    tracer = MetricFlowTracer(args.workspace)

    if args.command == 'scan':
        tracer.scan_directory()
        report = tracer.generate_report(args.output)

        if args.file:
            with open(args.file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.file}")
        else:
            print(report)

    elif args.command == 'report':
        tracer.scan_directory()
        report = tracer.generate_report('html')

        output_file = args.file or 'metric_flow_report.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"HTML report saved to {output_file}")

    elif args.command == 'validate':
        tracer.scan_directory()
        graph = tracer.build_dependency_graph()
        issues = tracer.find_issues(graph)

        print(f"Validation complete. Found {len(issues)} issues:")
        for issue in issues:
            print(f"  [{issue['severity'].upper()}] {issue['type']}: {issue['description']}")


if __name__ == '__main__':
    main()
