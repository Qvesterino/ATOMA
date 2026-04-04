#!/usr/bin/env python3
"""
Event Flow Tracer - ATOMA Runtime Event Flow Visualization

Traces event flow through the system in runtime.
Generates timeline visualization and detects event storms.

Usage:
    python event_flow_tracer.py generate-tracer          # Generate event tracer
    python event_flow_tracer.py analyze-events           # Analyze event patterns
    python event_flow_tracer.py report                   # Generate flow report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict, Counter


class EventFlowAnalyzer:
    """Analyzes event patterns and flow."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.event_patterns = []
        self.event_chains = []

    def analyze_events(self) -> None:
        """Analyze event patterns in the codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for event patterns...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Found {len(self.event_patterns)} event patterns")
        self._detect_event_chains()

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for event patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            # Find emit patterns
            emit_pattern = r'(\w+)\.emit\([\'"]([^\'"]+)[\'"]'
            for line_num, line in enumerate(lines, 1):
                matches = re.finditer(emit_pattern, line)
                for match in matches:
                    bus_name = match.group(1)
                    event_name = match.group(2)

                    # Find what triggers this emit
                    trigger = self._find_trigger_context(lines, line_num - 1)

                    self.event_patterns.append({
                        "type": "emit",
                        "bus": bus_name,
                        "event": event_name,
                        "file": str(file_path),
                        "file_name": file_path.name,
                        "line": line_num,
                        "trigger": trigger
                    })

            # Find subscribe patterns
            subscribe_pattern = r'(\w+)\.on\([\'"]([^\'"]+)[\'"]\s*,\s*([^)]+)\)'
            for line_num, line in enumerate(lines, 1):
                matches = re.finditer(subscribe_pattern, line)
                for match in matches:
                    bus_name = match.group(1)
                    event_name = match.group(2)
                    handler = match.group(3)

                    # Find what the handler does
                    handler_action = self._find_handler_action(lines, line_num - 1)

                    self.event_patterns.append({
                        "type": "subscribe",
                        "bus": bus_name,
                        "event": event_name,
                        "handler": handler,
                        "file": str(file_path),
                        "file_name": file_path.name,
                        "line": line_num,
                        "action": handler_action
                    })

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _find_trigger_context(self, lines: List[str], line_idx: int) -> str:
        """Find what triggers an event emit."""
        # Look backwards for conditionals, function calls, etc.
        context_lines = []
        for i in range(max(0, line_idx - 3), min(len(lines), line_idx + 1)):
            line = lines[i].strip()
            if line and not line.startswith('//') and not line.startswith('*'):
                context_lines.append(line)

        return ' '.join(context_lines)[-100:] if context_lines else "unknown"

    def _find_handler_action(self, lines: List[str], line_idx: int) -> str:
        """Find what a handler function does."""
        # Look for the handler function definition
        for i in range(line_idx, min(len(lines), line_idx + 10)):
            if 'function' in lines[i] or '=>' in lines[i]:
                # Extract first few lines of the function
                action_lines = []
                for j in range(i, min(len(lines), i + 5)):
                    line = lines[j].strip()
                    if line and not line.startswith('//'):
                        action_lines.append(line)
                    if line.endswith('}') or line.startswith('}'):
                        break
                return ' '.join(action_lines)[:100]

        return "unknown"

    def _detect_event_chains(self) -> None:
        """Detect event chains (A emits B, B emits C, etc.)."""
        # Build event graph
        emits = defaultdict(list)  # event -> list of files that emit it
        triggers = defaultdict(list)  # event -> list of events it triggers

        for pattern in self.event_patterns:
            if pattern["type"] == "emit":
                emits[pattern["event"]].append(pattern["file"])

        # Find chains by looking for handlers that emit other events
        for pattern in self.event_patterns:
            if pattern["type"] == "subscribe":
                event = pattern["event"]
                action = pattern["action"].lower()

                # Check if handler emits another event
                for other_event in emits:
                    if other_event.lower() in action or f".emit('{other_event}')" in action:
                        self.event_chains.append({
                            "source": event,
                            "target": other_event,
                            "via": pattern["file_name"],
                            "line": pattern["line"]
                        })

        print(f"Detected {len(self.event_chains)} event chains")

    def generate_tracer_code(self) -> str:
        """Generate runtime event tracer code."""
        return f"""
// === EVENT FLOW TRACER ===
// Generated: {datetime.now().isoformat()}

class EventFlowTracer {{
    constructor() {{
        this.eventLog = [];
        this.eventChains = [];
        this.eventCounts = new Map();
        this.startTime = performance.now();
        this.activeChains = new Map();
        this.stormThreshold = 50; // Events per second
        this.stormDetectionWindow = 1000; // ms

        this._setupTracing();
        this._startStormDetection();
    }}

    _setupTracing() {{
        // Wrap semanticBus.emit
        if (window.semanticBus) {{
            const originalEmit = window.semanticBus.emit;
            window.semanticBus.emit = (event, data) => {{
                this._logEvent('emit', event, data);
                return originalEmit.call(window.semanticBus, event, data);
            }};
        }}

        // Wrap semanticBus.on
        if (window.semanticBus) {{
            const originalOn = window.semanticBus.on;
            window.semanticBus.on = (event, handler) => {{
                this._logEvent('subscribe', event, {{ handler: handler.name || 'anonymous' }});
                return originalOn.call(window.semanticBus, event, handler);
            }};
        }}

        console.log('[Event Tracer] Tracing enabled');
    }}

    _logEvent(type, event, data) {{
        const timestamp = performance.now() - this.startTime;

        this.eventLog.push({{
            type,
            event,
            timestamp,
            data: this._sanitizeData(data)
        }});

        this.eventCounts.set(event, (this.eventCounts.get(event) || 0) + 1);

        // Detect chains
        this._detectChain(event, type);
    }}

    _sanitizeData(data) {{
        // Remove circular references and limit size
        if (!data) return {{}};

        const sanitized = {{}};
        const keys = Object.keys(data).slice(0, 5); // Limit to 5 keys

        for (const key of keys) {{
            const value = data[key];
            if (typeof value === 'object' && value !== null) {{
                sanitized[key] = '[object]';
            }} else if (typeof value === 'function') {{
                sanitized[key] = '[function]';
            }} else {{
                sanitized[key] = String(value).substring(0, 50);
            }}
        }}

        return sanitized;
    }}

    _detectChain(event, type) {{
        if (type !== 'emit') return;

        // Check if this event was triggered by another recent event
        const recentEvents = this.eventLog.filter(log =>
            log.type === 'emit' &&
            log.timestamp > performance.now() - this.startTime - 100
        );

        if (recentEvents.length > 0) {{
            const previousEvent = recentEvents[recentEvents.length - 2];
            if (previousEvent && previousEvent.event !== event) {{
                this.eventChains.push({{
                    from: previousEvent.event,
                    to: event,
                    timestamp: performance.now() - this.startTime,
                    delay: (performance.now() - this.startTime) - previousEvent.timestamp
                }});
            }}
        }}
    }}

    _startStormDetection() {{
        setInterval(() => {{
            this._detectEventStorm();
        }}, this.stormDetectionWindow);
    }}

    _detectEventStorm() {{
        const now = performance.now() - this.startTime;
        const windowStart = now - this.stormDetectionWindow;

        const recentEvents = this.eventLog.filter(log =>
            log.type === 'emit' &&
            log.timestamp >= windowStart
        );

        if (recentEvents.length > this.stormThreshold) {{
            this._reportStorm(recentEvents, now);
        }}
    }}

    _reportStorm(events, timestamp) {{
        const eventCounts = {{}};
        events.forEach(e => {{
            eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
        }});

        const topEvents = Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        console.warn(`\\n⚠️ EVENT STORM DETECTED at ${{timestamp.toFixed(0)}}ms`);
        console.warn(`Events in last ${{this.stormDetectionWindow}}ms: ${{events.length}}`);
        console.warn('Top events:', topEvents);
        console.warn('---\\n');
    }}

    getTimeline(eventFilter = null) {{
        let events = this.eventLog;

        if (eventFilter) {{
            events = events.filter(log => log.event.includes(eventFilter));
        }}

        return events.map(log => ({{
            ...log,
            relativeTime: log.timestamp.toFixed(2) + 'ms'
        }}));
    }}

    getEventCounts() {{
        return Object.fromEntries(
            Array.from(this.eventCounts.entries())
                .sort((a, b) => b[1] - a[1])
        );
    }}

    getEventChains() {{
        // Group and count chains
        const chainCounts = new Map();

        this.eventChains.forEach(chain => {{
            const key = `${{chain.from}} -> ${{chain.to}}`;
            chainCounts.set(key, (chainCounts.get(key) || 0) + 1);
        }});

        return Object.fromEntries(
            Array.from(chainCounts.entries())
                .sort((a, b) => b[1] - a[1])
        );
    }}

    generateFlowVisualization() {{
        const chains = this.getEventChains();
        const nodes = new Set();
        const links = [];

        Object.entries(chains).forEach(([chain, count]) => {{
            const [from, to] = chain.split(' -> ');
            nodes.add(from);
            nodes.add(to);
            links.push({{ source: from, target: to, count }});
        }});

        return {{
            nodes: Array.from(nodes),
            links,
            summary: {{
                totalNodes: nodes.size,
                totalLinks: links.length,
                totalEvents: this.eventLog.length,
                uniqueEvents: this.eventCounts.size
            }}
        }};
    }}

    printReport() {{
        const duration = performance.now() - this.startTime;
        const eventCounts = this.getEventCounts();
        const chains = this.getEventChains();

        console.log('\\n=== EVENT FLOW REPORT ===');
        console.log(`Duration: ${{duration.toFixed(0)}}ms`);
        console.log(`Total Events: ${{this.eventLog.length}}`);
        console.log(`Unique Events: ${{Object.keys(eventCounts).length}}`);
        console.log(`Event Chains: ${{Object.keys(chains).length}}`);

        console.log('\\n--- Top 10 Events ---');
        const topEvents = Object.entries(eventCounts).slice(0, 10);
        topEvents.forEach(([event, count]) => {{
            console.log(`  ${{event}}: ${{count}}`);
        }});

        if (Object.keys(chains).length > 0) {{
            console.log('\\n--- Top 10 Event Chains ---');
            const topChains = Object.entries(chains).slice(0, 10);
            topChains.forEach(([chain, count]) => {{
                console.log(`  ${{chain}}: ${{count}}`);
            }});
        }}

        console.log('\\n===============================\\n');
    }}

    exportData() {{
        return {{
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            eventLog: this.eventLog,
            eventCounts: Object.fromEntries(this.eventCounts),
            eventChains: this.eventChains,
            flowVisualization: this.generateFlowVisualization()
        }};
    }}

    reset() {{
        this.eventLog = [];
        this.eventChains = [];
        this.eventCounts.clear();
        this.startTime = performance.now();
        console.log('[Event Tracer] Reset');
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__EVENT_FLOW_TRACER__ = new EventFlowTracer();

    // Expose API
    window.getEventTimeline = (filter) => window.__EVENT_FLOW_TRACER__.getTimeline(filter);
    window.getEventCounts = () => window.__EVENT_FLOW_TRACER__.getEventCounts();
    window.getEventChains = () => window.__EVENT_FLOW_TRACER__.getEventChains();
    window.printEventFlowReport = () => window.__EVENT_FLOW_TRACER__.printReport();
    window.exportEventFlowData = () => window.__EVENT_FLOW_TRACER__.exportData();

    console.log('Event Flow Tracer loaded.');
    console.log('API: window.getEventTimeline(), window.getEventCounts(), window.printEventFlowReport()');
}}
"""

    def generate_analysis_report(self) -> str:
        """Generate event flow analysis report."""
        lines = []
        lines.append("=" * 70)
        lines.append("EVENT FLOW ANALYSIS")
        lines.append("=" * 70)
        lines.append("")

        # Count event types
        emit_events = [e for e in self.event_patterns if e["type"] == "emit"]
        subscribe_events = [e for e in self.event_patterns if e["type"] == "subscribe"]

        # Most emitted events
        emit_counts = Counter(e["event"] for e in emit_events)
        most_emitted = emit_counts.most_common(10)

        # Most subscribed events
        subscribe_counts = Counter(e["event"] for e in subscribe_events)
        most_subscribed = subscribe_counts.most_common(10)

        lines.append(f"Total Event Patterns: {len(self.event_patterns)}")
        lines.append(f"  - Emits: {len(emit_events)}")
        lines.append(f"  - Subscribes: {len(subscribe_events)}")
        lines.append(f"  - Event Chains: {len(self.event_chains)}")
        lines.append("")

        lines.append("MOST EMITTED EVENTS (Top 10)")
        lines.append("-" * 70)
        for event, count in most_emitted:
            lines.append(f"  {event}: {count} emits")

        lines.append("\n")
        lines.append("MOST SUBSCRIBED EVENTS (Top 10)")
        lines.append("-" * 70)
        for event, count in most_subscribed:
            lines.append(f"  {event}: {count} subscribers")

        lines.append("\n")
        lines.append("EVENT CHAINS DETECTED")
        lines.append("-" * 70)
        if self.event_chains:
            # Group and count chains
            chain_counts = defaultdict(int)
            for chain in self.event_chains:
                key = f"{chain['source']} -> {chain['target']}"
                chain_counts[key] += 1

            for chain, count in sorted(chain_counts.items(), key=lambda x: -x[1])[:10]:
                lines.append(f"  {chain}: {count} occurrences")
        else:
            lines.append("  No event chains detected")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)

        if len(emit_events) > len(subscribe_events) * 2:
            lines.append("⚠️ Many more emits than subscribes - check for orphan events")

        if len(self.event_chains) > 50:
            lines.append("⚠️ Many event chains - consider simplifying event flow")

        for event, count in most_emitted:
            if count > 20:
                lines.append(f"⚠️ Event '{event}' emitted {count} times - potential event storm")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Event Flow Tracer')
    parser.add_argument('command', choices=['generate-tracer', 'analyze-events', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output-tracer', default='event_flow_tracer.js',
                       help='Output file for tracer script')
    parser.add_argument('--output-report', help='Output file for analysis report')

    args = parser.parse_args()

    analyzer = EventFlowAnalyzer(args.workspace)

    if args.command == 'analyze-events':
        analyzer.analyze_events()
        print("\n" + analyzer.generate_analysis_report())

    elif args.command == 'generate-tracer':
        analyzer.analyze_events()

        tracer_code = analyzer.generate_tracer_code()
        output_path = analyzer.workspace_root / args.output_tracer

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(tracer_code)

        print(f"Event tracer generated: {args.output_tracer}")
        print("\nUsage:")
        print("1. Load event_flow_tracer.js in browser")
        print("2. Trigger events in ATOMA")
        print("3. Run: window.printEventFlowReport()")
        print("4. Export: window.exportEventFlowData()")

    elif args.command == 'report':
        analyzer.analyze_events()
        report = analyzer.generate_analysis_report()

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output_report}")
        else:
            print(report)


if __name__ == '__main__':
    main()
