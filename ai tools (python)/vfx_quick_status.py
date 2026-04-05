#!/usr/bin/env python3
"""
VFX Quick Status - Fast VFX Status Overview

Provides quick overview of VFX system status without full analysis.
Perfect for rapid status checks.

Usage:
    python vfx_quick_status.py scan           # Scan VFX systems
    python vfx_quick_status.py summary        # Quick summary
    python vfx_quick_status.py list           # List all VFX systems
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class VFXQuickStatus:
    """Quick VFX status overview."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems = []
        self.metric_access = defaultdict(list)
        self.event_subscriptions = defaultdict(list)

    def scan_vfx_systems(self) -> None:
        """Quick scan for VFX systems."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime", "LEGACY"])]

        print(f"Scanning {len(js_files)} files for VFX systems...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.vfx_systems)} VFX systems")

    def _scan_file(self, file_path: Path) -> None:
        """Quick scan a single file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find VFX classes (faster pattern)
            vfx_patterns = [
                r'class\s+(\w*(?:Visual|System|FX|Particle|Renderer|Tracker|Manager|Emitter|Animator))\s*\{',
                r'function\s+(\w*(?:Visual|System|FX|Particle|Renderer|Tracker|Manager|Emitter|Animator))\s*\(',
                r'var\s+(\w*(?:Visual|System|FX|Particle|Renderer|Tracker|Manager|Emitter|Animator))\s*='
            ]

            for pattern in vfx_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    name = match.group(1)

                    # Filter for actual VFX systems
                    if self._is_vfx_system(name, content):
                        # Quick count of metric access
                        metric_count = len(re.findall(r'metrics\.\w+', content))
                        event_count = len(re.findall(r'on\(\s*[\'"]\w+[\'"]\s*\)', content))

                        self.vfx_systems.append({
                            "name": name,
                            "file": file_path.name,
                            "metric_access": metric_count,
                            "event_subscriptions": event_count
                        })

                        # Track metric access
                        metrics = re.findall(r'metrics\.(\w+)', content)
                        for metric in metrics:
                            self.metric_access[metric].append(name)

                        # Track event subscriptions
                        events = re.findall(r'on\(\s*[\'"](\w+)[\'"]\s*\)', content)
                        for event in events:
                            self.event_subscriptions[event].append(name)

        except Exception as e:
            pass  # Silent for quick scan

    def _is_vfx_system(self, name: str, content: str) -> bool:
        """Quick check if it's an actual VFX system."""
        # Must have VFX-related keywords
        vfx_keywords = [
            'visual', 'vfx', 'particle', 'render', 'mesh', 'geometry',
            'material', 'shader', 'three', 'scene', 'camera', 'light',
            'cascade', 'resonance', 'corruption', 'healing', 'wave',
            'spark', 'trail', 'bead', 'glow', 'pulse', 'burst'
        ]

        content_lower = content.lower()
        name_lower = name.lower()

        # Check if name or content has VFX keywords
        has_keyword = any(kw in content_lower for kw in vfx_keywords)
        has_vfx_in_name = any(kw in name_lower for kw in ['visual', 'vfx', 'fx', 'particle', 'render'])

        return has_keyword and (has_vfx_in_name or 'System' in name or 'Manager' in name)

    def get_quick_summary(self) -> Dict[str, Any]:
        """Get quick status summary."""
        return {
            "total_vfx_systems": len(this.vfx_systems),
            "unique_metrics": len(this.metric_access),
            "unique_events": len(this.event_subscriptions),
            "top_metric_users": sorted(
                [(metric, len(systems)) for metric, systems in this.metric_access.items()],
                key=lambda x: x[1],
                reverse=True
            )[:5],
            "top_event_users": sorted(
                [(event, len(systems)) for event, systems in this.event_subscriptions.items()],
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }

    def generate_status_report(self) -> str:
        """Generate quick status report."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX QUICK STATUS")
        lines.append("=" * 70)
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")

        # Summary
        summary = self.get_quick_summary()
        lines.append("SUMMARY")
        lines.append("-" * 70)
        lines.append(f"VFX Systems: {summary['total_vfx_systems']}")
        lines.append(f"Unique Metrics Used: {summary['unique_metrics']}")
        lines.append(f"Unique Events: {summary['unique_events']}")
        lines.append("")

        # Top metrics
        if summary['top_metric_users']:
            lines.append("TOP METRICS (by usage count)")
            lines.append("-" * 70)
            for metric, count in summary['top_metric_users']:
                lines.append(f"  {metric}: used by {count} systems")
            lines.append("")

        # Top events
        if summary['top_event_users']:
            lines.append("TOP EVENTS (by subscription count)")
            lines.append("-" * 70)
            for event, count in summary['top_event_users']:
                lines.append(f"  {event}: subscribed by {count} systems")
            lines.append("")

        # System list
        lines.append("VFX SYSTEMS")
        lines.append("-" * 70)
        for system in sorted(this.vfx_systems, key=lambda x: x['name']):
            lines.append(f"  {system['name']}")
            lines.append(f"    File: {system['file']}")
            if system['metric_access'] > 0:
                lines.append(f"    Metrics: {system['metric_access']} access points")
            if system['event_subscriptions'] > 0:
                lines.append(f"    Events: {system['event_subscriptions']} subscriptions")
            lines.append("")

        # Quick checks
        lines.append("QUICK CHECKS")
        lines.append("-" * 70)

        # Check for systems without metric access
        no_metrics = [s for s in this.vfx_systems if s['metric_access'] == 0]
        if no_metrics:
            lines.append(f"⚠️  Systems without metric access: {len(no_metrics)}")
            for system in no_metrics[:5]:  # Show first 5
                lines.append(f"    - {system['name']}")
        else:
            lines.append("✓ All VFX systems access metrics")

        # Check for systems without event subscriptions
        no_events = [s for s in this.vfx_systems if s['event_subscriptions'] == 0]
        if no_events:
            lines.append(f"⚠️  Systems without event subscriptions: {len(no_events)}")
            for system in no_events[:5]:  # Show first 5
                lines.append(f"    - {system['name']}")
        else:
            lines.append("✓ All VFX systems subscribe to events")

        return "\n".join(lines)

    def list_systems(self) -> str:
        """List all VFX systems."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX SYSTEMS LIST")
        lines.append("=" * 70)
        lines.append("")

        for system in sorted(this.vfx_systems, key=lambda x: x['name']):
            lines.append(f"{system['name']}")
            lines.append(f"  File: {system['file']}")
            lines.append(f"  Metric Access: {system['metric_access']}")
            lines.append(f"  Event Subscriptions: {system['event_subscriptions']}")
            lines.append("")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Quick Status')
    parser.add_argument('command', choices=['scan', 'summary', 'list'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text', help='Output format')
    parser.add_argument('--file', help='Save report to file')

    args = parser.parse_args()

    status = VFXQuickStatus(args.workspace)

    if args.command == 'scan':
        status.scan_vfx_systems()
        print("\n" + status.generate_status_report())

    elif args.command == 'summary':
        status.scan_vfx_systems()
        summary = status.get_quick_summary()

        print("\nVFX Quick Status Summary:")
        print(f"  VFX Systems: {summary['total_vfx_systems']}")
        print(f"  Metrics Used: {summary['unique_metrics']}")
        print(f"  Events: {summary['unique_events']}")

        if args.output == 'json':
            import json
            print("\n" + json.dumps(summary, indent=2))

    elif args.command == 'list':
        status.scan_vfx_systems()
        print("\n" + status.list_systems())


if __name__ == '__main__':
    main()
