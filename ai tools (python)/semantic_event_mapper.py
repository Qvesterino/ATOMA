#!/usr/bin/env python3
"""
Semantic Event Mapper - ATOMA Event System Analysis Tool

Maps semantic events to handlers and vice versa.
Identifies orphan events, dead handlers, and event coverage.

Usage:
    python semantic_event_mapper.py scan                    # Scan and analyze events
    python semantic_event_mapper.py scan --output json      # Output JSON format
    python semantic_event_mapper.py report                  # Generate HTML report
    python semantic_event_mapper.py validate                # Validate event coverage
"""

import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Any
from datetime import datetime


class EventPattern:
    """Represents a single event pattern (emit or subscribe)."""

    def __init__(self, file_path: str, line: int, pattern_type: str,
                 event_name: str, context: str = ""):
        self.file_path = file_path
        self.line = line
        self.pattern_type = pattern_type  # 'emit' or 'subscribe'
        self.event_name = event_name
        self.context = context

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file": self.file_path,
            "line": self.line,
            "type": self.pattern_type,
            "event": self.event_name,
            "context": self.context[:100] if self.context else ""
        }


class SemanticEventMapper:
    """Maps semantic events to handlers and analyzes coverage."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.emits: List[EventPattern] = []
        self.subscribes: List[EventPattern] = []
        self.event_bus_names = ['semanticBus', 'eventBus', 'bus', 'ATOMA_BUS']

    def scan_directory(self, directory: str = None) -> None:
        """Scan all JS files for event patterns."""
        if directory is None:
            directory = self.workspace_root

        js_files = list(Path(directory).rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Scanning {len(js_files)} JavaScript files for events...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(self.emits)} emit patterns")
        print(f"Found {len(self.subscribes)} subscribe patterns")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single JS file for event patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')
            for line_num, line in enumerate(lines, 1):
                self._find_emit_patterns(str(file_path), line_num, line, lines)
                self._find_subscribe_patterns(str(file_path), line_num, line, lines)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def _find_emit_patterns(self, file_path: str, line_num: int,
                          line: str, all_lines: List[str]) -> None:
        """Find event emit patterns."""
        # Patterns for emit
        patterns = [
            r'(\w+)\.emit\([\'"]([^\'"]+)[\'"]',  # bus.emit('event.name')
            r'(\w+)\.emit\(["\']([^"\']+)["\']',  # bus.emit("event.name")
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                bus_name = match.group(1)
                if bus_name in self.event_bus_names or "Bus" in bus_name:
                    event_name = match.group(2)

                    # Get context
                    context_start = max(0, line_num - 2)
                    context_end = min(len(all_lines), line_num + 1)
                    context = '\n'.join(all_lines[context_start:context_end])

                    self.emits.append(EventPattern(
                        file_path=file_path,
                        line=line_num,
                        pattern_type='emit',
                        event_name=event_name,
                        context=context
                    ))

    def _find_subscribe_patterns(self, file_path: str, line_num: int,
                                 line: str, all_lines: List[str]) -> None:
        """Find event subscribe patterns."""
        # Patterns for subscribe
        patterns = [
            r'(\w+)\.on\([\'"]([^\'"]+)[\'"]',  # bus.on('event.name', handler)
            r'(\w+)\.subscribe\([\'"]([^\'"]+)[\'"]',  # bus.subscribe('event.name', handler)
            r'(\w+)\.once\([\'"]([^\'"]+)[\'"]',  # bus.once('event.name', handler)
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                bus_name = match.group(1)
                if bus_name in self.event_bus_names or "Bus" in bus_name:
                    event_name = match.group(2)

                    # Get context
                    context_start = max(0, line_num - 2)
                    context_end = min(len(all_lines), line_num + 1)
                    context = '\n'.join(all_lines[context_start:context_end])

                    self.subscribes.append(EventPattern(
                        file_path=file_path,
                        line=line_num,
                        pattern_type='subscribe',
                        event_name=event_name,
                        context=context
                    ))

    def build_event_map(self) -> Dict[str, Any]:
        """Build comprehensive event map."""
        event_map = {
            "events": {},
            "emitters": {},
            "subscribers": {},
            "summary": {}
        }

        # Build event → emits/subscribes mapping
        for emit in self.emits:
            event = emit.event_name
            if event not in event_map["events"]:
                event_map["events"][event] = {
                    "emit_count": 0,
                    "subscribe_count": 0,
                    "emitters": set(),
                    "subscribers": set(),
                    "orphan": True,
                    "dead_handler": True
                }

            event_map["events"][event]["emit_count"] += 1
            event_map["events"][event]["emitters"].add(f"{Path(emit.file_path).name}:{emit.line}")

        for subscribe in self.subscribes:
            event = subscribe.event_name
            if event not in event_map["events"]:
                event_map["events"][event] = {
                    "emit_count": 0,
                    "subscribe_count": 0,
                    "emitters": set(),
                    "subscribers": set(),
                    "orphan": True,
                    "dead_handler": True
                }

            event_map["events"][event]["subscribe_count"] += 1
            event_map["events"][event]["subscribers"].add(f"{Path(subscribe.file_path).name}:{subscribe.line}")

        # Update orphan and dead_handler flags
        for event_data in event_map["events"].values():
            event_data["orphan"] = event_data["subscribe_count"] == 0
            event_data["dead_handler"] = event_data["emit_count"] == 0

        # Convert sets to lists
        for event_data in event_map["events"].values():
            event_data["emitters"] = sorted(list(event_data["emitters"]))
            event_data["subscribers"] = sorted(list(event_data["subscribers"]))

        # Build emitter → events mapping
        for emit in self.emits:
            file_name = Path(emit.file_path).name
            if file_name not in event_map["emitters"]:
                event_map["emitters"][file_name] = set()
            event_map["emitters"][file_name].add(emit.event_name)

        for emitter, events in event_map["emitters"].items():
            event_map["emitters"][emitter] = sorted(list(events))

        # Build subscriber → events mapping
        for subscribe in self.subscribes:
            file_name = Path(subscribe.file_path).name
            if file_name not in event_map["subscribers"]:
                event_map["subscribers"][file_name] = set()
            event_map["subscribers"][file_name].add(subscribe.event_name)

        for subscriber, events in event_map["subscribers"].items():
            event_map["subscribers"][subscriber] = sorted(list(events))

        # Summary
        event_map["summary"] = {
            "total_events": len(event_map["events"]),
            "total_emits": len(self.emits),
            "total_subscribes": len(self.subscribes),
            "orphan_events": sum(1 for e in event_map["events"].values() if e["orphan"]),
            "dead_handlers": sum(1 for e in event_map["events"].values() if e["dead_handler"]),
            "scan_time": datetime.now().isoformat()
        }

        return event_map

    def find_issues(self, event_map: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find event system issues."""
        issues = []

        # Orphan events (emitted but never subscribed)
        for event, data in event_map["events"].items():
            if data["orphan"]:
                issues.append({
                    "type": "orphan_event",
                    "event": event,
                    "emit_count": data["emit_count"],
                    "emitters": data["emitters"],
                    "severity": "medium",
                    "description": f"Event '{event}' is emitted {data['emit_count']} times but never subscribed"
                })

        # Dead handlers (subscribed but never emitted)
        for event, data in event_map["events"].items():
            if data["dead_handler"]:
                issues.append({
                    "type": "dead_handler",
                    "event": event,
                    "subscribe_count": data["subscribe_count"],
                    "subscribers": data["subscribers"],
                    "severity": "high",
                    "description": f"Event '{event}' is subscribed {data['subscribe_count']} times but never emitted"
                })

        # Over-emitted events (potential event storms)
        for event, data in event_map["events"].items():
            if data["emit_count"] > 20:
                issues.append({
                    "type": "over_emitted_event",
                    "event": event,
                    "emit_count": data["emit_count"],
                    "severity": "medium",
                    "description": f"Event '{event}' emitted {data['emit_count']} times - potential event storm"
                })

        # Over-subscribed events (potential performance issue)
        for event, data in event_map["events"].items():
            if data["subscribe_count"] > 10:
                issues.append({
                    "type": "over_subscribed_event",
                    "event": event,
                    "subscribe_count": data["subscribe_count"],
                    "severity": "low",
                    "description": f"Event '{event}' has {data['subscribe_count']} subscribers - consider aggregation"
                })

        return issues

    def generate_report(self, output_format: str = "text") -> str:
        """Generate analysis report."""
        event_map = self.build_event_map()
        issues = self.find_issues(event_map)

        if output_format == "json":
            return json.dumps({
                "event_map": event_map,
                "issues": issues
            }, indent=2)

        elif output_format == "html":
            return self._generate_html_report(event_map, issues)

        else:  # text
            return self._generate_text_report(event_map, issues)

    def _generate_text_report(self, event_map: Dict, issues: List[Dict]) -> str:
        """Generate text format report."""
        lines = []
        lines.append("=" * 60)
        lines.append("SEMANTIC EVENT MAPPER REPORT")
        lines.append("=" * 60)
        lines.append("")

        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 60)
        summary = event_map["summary"]
        lines.append(f"Total Events: {summary['total_events']}")
        lines.append(f"Total Emits: {summary['total_emits']}")
        lines.append(f"Total Subscribes: {summary['total_subscribes']}")
        lines.append(f"Orphan Events: {summary['orphan_events']}")
        lines.append(f"Dead Handlers: {summary['dead_handlers']}")
        lines.append("")

        # Events breakdown
        lines.append("EVENTS BREAKDOWN")
        lines.append("-" * 60)
        for event, data in sorted(event_map["events"].items()):
            status = ""
            if data["orphan"]:
                status = " [ORPHAN]"
            elif data["dead_handler"]:
                status = " [DEAD]"

            lines.append(f"\n{event}{status}")
            lines.append(f"  Emits: {data['emit_count']}")
            lines.append(f"  Subscribes: {data['subscribe_count']}")
            if data["emitters"]:
                lines.append(f"  Emitters: {', '.join(data['emitters'][:3])}")
            if data["subscribers"]:
                lines.append(f"  Subscribers: {', '.join(data['subscribers'][:3])}")

        # Issues
        if issues:
            lines.append("\n")
            lines.append("ISSUES FOUND")
            lines.append("-" * 60)
            for issue in issues:
                lines.append(f"\n[{issue['severity'].upper()}] {issue['type']}")
                lines.append(f"  {issue['description']}")
                if 'event' in issue:
                    lines.append(f"  Event: {issue['event']}")
        else:
            lines.append("\n")
            lines.append("No issues found!")

        return "\n".join(lines)

    def _generate_html_report(self, event_map: Dict, issues: List[Dict]) -> str:
        """Generate HTML format report."""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Semantic Event Mapper Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #2196F3; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; }
        .summary-card h3 { margin: 0 0 10px 0; color: #2196F3; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
        .event-card { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .event-card.orphan { border-left: 4px solid #ff9800; background: #fff3e0; }
        .event-card.dead { border-left: 4px solid #f44336; background: #ffebee; }
        .event-card h3 { color: #2196F3; margin-top: 0; }
        .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .issue.high { border-left-color: #f44336; background: #ffebee; }
        .issue.medium { border-left-color: #ff9800; background: #fff3e0; }
        .issue.low { border-left-color: #4CAF50; background: #e8f5e9; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; }
        .badge.orphan { background: #ff9800; color: white; }
        .badge.dead { background: #f44336; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 Semantic Event Mapper Report</h1>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Events</h3>
                <div class="value">{total_events}</div>
            </div>
            <div class="summary-card">
                <h3>Total Emits</h3>
                <div class="value">{total_emits}</div>
            </div>
            <div class="summary-card">
                <h3>Total Subscribes</h3>
                <div class="value">{total_subscribes}</div>
            </div>
            <div class="summary-card" style="border-left-color: #ff9800;">
                <h3>Orphan Events</h3>
                <div class="value">{orphan_events}</div>
            </div>
            <div class="summary-card" style="border-left-color: #f44336;">
                <h3>Dead Handlers</h3>
                <div class="value">{dead_handlers}</div>
            </div>
        </div>

        <h2>📡 Events Breakdown</h2>
        {events_html}

        <h2>⚠️ Issues Found</h2>
        {issues_html}

        <h2>🏭 Emitters</h2>
        {emitters_html}

        <h2>👂 Subscribers</h2>
        {subscribers_html}
    </div>
</body>
</html>
"""

        summary = event_map["summary"]

        # Events HTML
        events_html = ""
        for event, data in sorted(event_map["events"].items()):
            card_class = ""
            badges = ""

            if data["orphan"]:
                card_class = "orphan"
                badges += '<span class="badge orphan">ORPHAN</span>'
            if data["dead_handler"]:
                card_class = "dead"
                badges += '<span class="badge dead">DEAD HANDLER</span>'

            events_html += f"""
            <div class="event-card {card_class}">
                <h3>{event} {badges}</h3>
                <p><strong>Emits:</strong> {data['emit_count']} | <strong>Subscribes:</strong> {data['subscribe_count']}</p>
                <p><strong>Emitters:</strong> {', '.join(data['emitters'][:3])}{'...' if len(data['emitters']) > 3 else ''}</p>
                <p><strong>Subscribers:</strong> {', '.join(data['subscribers'][:3])}{'...' if len(data['subscribers']) > 3 else ''}</p>
            </div>
            """

        # Issues HTML
        issues_html = ""
        for issue in issues:
            issues_html += f"""
            <div class="issue {issue['severity']}">
                <strong>{issue['type'].replace('_', ' ').title()}</strong>
                <p>{issue['description']}</p>
            </div>
            """

        if not issues:
            issues_html = "<p>No issues found! ✅</p>"

        # Emitters HTML
        emitters_html = """
        <table>
            <tr>
                <th>Emitter</th>
                <th>Events Emitted</th>
            </tr>
        """

        for emitter, events in sorted(event_map["emitters"].items()):
            events_str = ', '.join(events[:5])
            if len(events) > 5:
                events_str += f" ... and {len(events) - 5} more"

            emitters_html += f"""
            <tr>
                <td>{emitter}</td>
                <td>{events_str}</td>
            </tr>
            """

        emitters_html += "</table>"

        # Subscribers HTML
        subscribers_html = """
        <table>
            <tr>
                <th>Subscriber</th>
                <th>Events Subscribed</th>
            </tr>
        """

        for subscriber, events in sorted(event_map["subscribers"].items()):
            events_str = ', '.join(events[:5])
            if len(events) > 5:
                events_str += f" ... and {len(events) - 5} more"

            subscribers_html += f"""
            <tr>
                <td>{subscriber}</td>
                <td>{events_str}</td>
            </tr>
            """

        subscribers_html += "</table>"

        return html.format(
            total_events=summary['total_events'],
            total_emits=summary['total_emits'],
            total_subscribes=summary['total_subscribes'],
            orphan_events=summary['orphan_events'],
            dead_handlers=summary['dead_handlers'],
            events_html=events_html,
            issues_html=issues_html,
            emitters_html=emitters_html,
            subscribers_html=subscribers_html
        )


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Semantic Event Mapper')
    parser.add_argument('command', choices=['scan', 'report', 'validate'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json', 'html'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    mapper = SemanticEventMapper(args.workspace)

    if args.command == 'scan':
        mapper.scan_directory()
        report = mapper.generate_report(args.output)

        if args.file:
            with open(args.file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.file}")
        else:
            print(report)

    elif args.command == 'report':
        mapper.scan_directory()
        report = mapper.generate_report('html')

        output_file = args.file or 'event_map_report.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"HTML report saved to {output_file}")

    elif args.command == 'validate':
        mapper.scan_directory()
        event_map = mapper.build_event_map()
        issues = mapper.find_issues(event_map)

        print(f"Validation complete. Found {len(issues)} issues:")
        for issue in issues:
            print(f"  [{issue['severity'].upper()}] {issue['type']}: {issue['description']}")


if __name__ == '__main__':
    main()
