#!/usr/bin/env python3
"""
Event Emitter - Manual Event Emission for Testing

Generates browser-based event emitter for manual testing of event handlers.
Allows emitting specific events with custom data.

Usage:
    python event_emitter.py generate             # Generate event emitter
    python event_emitter.py list-events          # List available events
    python event_emulator.py report              # Generate event report
"""

import os
import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class EventEmitterGenerator:
    """Generates browser-based event emitter for testing."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        this.semantic_events = []
        this.event_handlers = defaultdict(list)

    def analyze_events(self) -> None:
        """Analyze available events in codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime", "LEGACY"])]

        print(f"Analyzing {len(js_files)} files for events...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.semantic_events)} unique events")
        print(f"Found {sum(len(handlers) for handlers in this.event_handlers.values())} event handlers")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single file for events."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find event emission patterns
            emit_patterns = [
                r'emit\s*\(\s*[\'"](\w+)[\'"]',
                r'fire\s*\(\s*[\'"](\w+)[\'"]',
                r'trigger\s*\(\s*[\'"](\w+)[\'"]',
                r'semanticBus\.emit\s*\(\s*[\'"](\w+)[\'"]',
                r'eventBus\.emit\s*\(\s*[\'"](\w+)[\'"]'
            ]

            for pattern in emit_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    event_name = match.group(1)
                    if event_name not in [e['name'] for e in this.semantic_events]:
                        this.semantic_events.append({
                            "name": event_name,
                            "file": file_path.name
                        })

            # Find event subscription patterns
            on_patterns = [
                r'on\s*\(\s*[\'"](\w+)[\'"]',
                r'addEventListener\s*\(\s*[\'"](\w+)[\'"]',
                r'subscribe\s*\(\s*[\'"](\w+)[\'"]'
            ]

            for pattern in on_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    event_name = match.group(1)
                    this.event_handlers[event_name].append(file_path.name)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def generate_emitter(self) -> str:
        """Generate browser-based event emitter."""
        events_list = sorted([e['name'] for e in this.semantic_events])

        return f"""
// === EVENT EMITTER FOR MANUAL TESTING ===
// Generated: {datetime.now().isoformat()}

class ManualEventEmitter {{
    constructor() {{
        this.eventLog = [];
        this.emittedEvents = new Map();
        this.startTime = performance.now();
    }}

    // Emit a specific event with custom data
    emit(eventName, eventData = {{}}) {{
        if (!window.semanticBus) {{
            console.error('Semantic bus not found. Make sure semanticBus is available.');
            return false;
        }}

        const timestamp = performance.now() - this.startTime;

        const eventEntry = {{
            eventName,
            eventData,
            timestamp,
            timestampISO: new Date().toISOString()
        }};

        this.eventLog.push(eventEntry);

        // Track emission count
        const count = this.emittedEvents.get(eventName) || 0;
        this.emittedEvents.set(eventName, count + 1);

        // Emit to semantic bus
        try {{
            window.semanticBus.emit(eventName, eventData);
            console.log(`[Event Emitter] Emitted: ${{eventName}}`, eventData);
            return true;
        }} catch (error) {{
            console.error(`[Event Emitter] Error emitting ${{eventName}}:`, error);
            return false;
        }}
    }}

    // Emit cascade events
    emitCascadeStart(sourceNode, intensity = 0.8) {{
        return this.emit('cascade.start', {{
            sourceNode,
            intensity
        }});
    }}

    emitCascadeHop(sourceNode, targetNode, intensity = 0.8) {{
        return this.emit('cascade.hop', {{
            sourceNode,
            targetNode,
            intensity
        }});
    }}

    emitCascadeEnd(finalNode, totalHops) {{
        return this.emit('cascade.end', {{
            finalNode,
            totalHops
        }});
    }}

    // Emit link events
    emitLinkCreated(link) {{
        return this.emit('link.created', {{
            link,
            sourceNodeId: link.sourceNode?.userData?.nodeId,
            targetNodeId: link.targetNode?.userData?.nodeId
        }});
    }}

    emitLinkRemoved(link) {{
        return this.emit('link.removed', {{
            link,
            sourceNodeId: link.sourceNode?.userData?.nodeId,
            targetNodeId: link.targetNode?.userData?.nodeId
        }});
    }}

    // Emit node events
    emitNodeSelected(node) {{
        return this.emit('node.selected', {{
            node,
            nodeId: node.userData?.nodeId
        }});
    }}

    emitNodeDeselected(node) {{
        return this.emit('node.deselected', {{
            node,
            nodeId: node.userData?.nodeId
        }});
    }}

    // Emit corruption events
    emitCorruptionSpread(sourceNode, intensity = 0.5) {{
        return this.emit('corruption.spread', {{
            sourceNode,
            intensity
        }});
    }}

    emitCorruptionHeal(node, intensity = 0.5) {{
        return this.emit('corruption.heal', {{
            node,
            intensity
        }});
    }}

    // Emit resonance events
    emitResonancePulse(link, intensity = 0.8) {{
        return this.emit('resonance.pulse', {{
            link,
            intensity
        }});
    }}

    // Emit wave events
    emitWaveBirth(position) {{
        return this.emit('wave.birth', {{
            position
        }});
    }}

    emitWaveCollision(wave1, wave2) {{
        return this.emit('wave.collision', {{
            wave1,
            wave2
        }});
    }}

    // Get event log
    getEventLog() {{
        return this.eventLog.map(log => ({{
            ...log,
            relativeTime: log.timestamp.toFixed(2) + 'ms'
        }}));
    }}

    // Get emission statistics
    getStatistics() {{
        return {{
            totalEmitted: this.eventLog.length,
            uniqueEvents: this.emittedEvents.size,
            eventsByType: Object.fromEntries(this.emittedEvents),
            duration: performance.now() - this.startTime
        }};
    }}

    // Print event timeline
    printTimeline() {{
        console.log('\\n=== EVENT EMISSION TIMELINE ===');

        for (const event of this.eventLog) {{
            const timeStr = event.timestamp.toFixed(2) + 'ms';
            console.log(`[${{timeStr}}] ${{event.eventName}}`, event.eventData);
        }}

        console.log('===========================\\n');
    }}

    // Print statistics
    printStatistics() {{
        const stats = this.getStatistics();

        console.log('\\n=== EVENT EMISSION STATISTICS ===');
        console.log(`Total Emitted: ${{stats.totalEmitted}}`);
        console.log(`Unique Events: ${{stats.uniqueEvents}}`);
        console.log(`Duration: ${{stats.duration.toFixed(2)}}ms`);

        console.log('\\nEvents by Type:');
        for (const [eventName, count] of Object.entries(stats.eventsByType)) {{
            console.log(`  ${{eventName}}: ${{count}}`);
        }}

        console.log('==================================\\n');
    }}

    // Export event data
    exportData() {{
        return {{
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            eventLog: this.getEventLog(),
            statistics: this.getStatistics()
        }};
    }}

    // Clear event log
    clear() {{
        this.eventLog = [];
        this.emittedEvents.clear();
        this.startTime = performance.now();
        console.log('[Event Emitter] Cleared');
    }}

    // Available events in codebase
    getAvailableEvents() {{
        return {json.dumps(events_list)};
    }}

    // List available events
    listAvailableEvents() {{
        console.log('\\n=== AVAILABLE EVENTS ===');
        const events = this.getAvailableEvents();

        for (const event of events) {{
            console.log(`  - ${{event}}`);
        }}

        console.log('=========================\\n');
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__EVENT_EMITTER__ = new ManualEventEmitter();

    // Expose API
    window.emitEvent = (eventName, data) => {{
        return window.__EVENT_EMITTER__.emit(eventName, data);
    }};

    // Cascade events
    window.emitCascadeStart = (node, intensity) => {{
        return window.__EVENT_EMITTER__.emitCascadeStart(node, intensity);
    }};

    window.emitCascadeHop = (source, target, intensity) => {{
        return window.__EVENT_EMITTER__.emitCascadeHop(source, target, intensity);
    }};

    window.emitCascadeEnd = (node, hops) => {{
        return window.__EVENT_EMITTER__.emitCascadeEnd(node, hops);
    }};

    // Link events
    window.emitLinkCreated = (link) => {{
        return window.__EVENT_EMITTER__.emitLinkCreated(link);
    }};

    window.emitLinkRemoved = (link) => {{
        return window.__EVENT_EMITTER__.emitLinkRemoved(link);
    }};

    // Node events
    window.emitNodeSelected = (node) => {{
        return window.__EVENT_EMITTER__.emitNodeSelected(node);
    }};

    window.emitNodeDeselected = (node) => {{
        return window.__EVENT_EMITTER__.emitNodeDeselected(node);
    }};

    // Corruption events
    window.emitCorruptionSpread = (node, intensity) => {{
        return window.__EVENT_EMITTER__.emitCorruptionSpread(node, intensity);
    }};

    window.emitCorruptionHeal = (node, intensity) => {{
        return window.__EVENT_EMITTER__.emitCorruptionHeal(node, intensity);
    }};

    // Resonance events
    window.emitResonancePulse = (link, intensity) => {{
        return window.__EVENT_EMITTER__.emitResonancePulse(link, intensity);
    }};

    // Wave events
    window.emitWaveBirth = (position) => {{
        return window.__EVENT_EMITTER__.emitWaveBirth(position);
    }};

    window.emitWaveCollision = (wave1, wave2) => {{
        return window.__EVENT_EMITTER__.emitWaveCollision(wave1, wave2);
    }};

    // Utility functions
    window.getEventLog = () => window.__EVENT_EMITTER__.getEventLog();
    window.printEventTimeline = () => window.__EVENT_EMITTER__.printTimeline();
    window.getEventStatistics = () => window.__EVENT_EMITTER__.getStatistics();
    window.printEventStatistics = () => window.__EVENT_EMITTER__.printStatistics();
    window.exportEventData = () => window.__EVENT_EMITTER__.exportData();
    window.clearEventLog = () => window.__EVENT_EMITTER__.clear();
    window.listAvailableEvents = () => window.__EVENT_EMITTER__.listAvailableEvents();

    console.log('Event Emitter loaded.');
    console.log('API: window.emitEvent(), window.emitCascadeStart(), window.emitLinkCreated(), etc.');
    console.log('Examples:');
    console.log('  window.emitEvent("cascade.start", {{ sourceNode: node, intensity: 0.8 }})');
    console.log('  window.emitLinkCreated(link)');
    console.log('  window.listAvailableEvents()');
    console.log('  window.printEventTimeline()');
}}
"""

    def list_events(self) -> str:
        """List all available events."""
        lines = []
        lines.append("=" * 70)
        lines.append("AVAILABLE EVENTS")
        lines.append("=" * 70)
        lines.append("")

        # Group events by category
        categories = {
            "Cascade": [e for e in this.semantic_events if 'cascade' in e['name'].lower()],
            "Link": [e for e in this.semantic_events if 'link' in e['name'].lower()],
            "Node": [e for e in this.semantic_events if 'node' in e['name'].lower()],
            "Corruption": [e for e in this.semantic_events if 'corruption' in e['name'].lower()],
            "Resonance": [e for e in this.semantic_events if 'resonance' in e['name'].lower()],
            "Wave": [e for e in this.semantic_events if 'wave' in e['name'].lower()],
            "Other": []
        }

        # Categorize events
        for event in this.semantic_events:
            categorized = False
            for category in categories:
                if category != "Other" and event in categories[category]:
                    categorized = True
                    break
            if not categorized:
                categories["Other"].append(event)

        # Print by category
        for category, events in categories.items():
            if events:
                lines.append(f"{category} Events:")
                for event in sorted(events, key=lambda x: x['name']):
                    handler_count = len(this.event_handlers.get(event['name'], []))
                    lines.append(f"  {event['name']} ({handler_count} handlers)")
                lines.append("")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Event Emitter')
    parser.add_argument('command', choices=['generate', 'list-events', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', default='event_emitter.js',
                       help='Output file for emitter')

    args = parser.parse_args()

    generator = EventEmitterGenerator(args.workspace)

    if args.command == 'list-events':
        generator.analyze_events()
        print("\n" + generator.list_events())

    elif args.command == 'generate':
        generator.analyze_events()

        emitter_code = generator.generate_emitter()
        output_path = generator.workspace_root / args.output

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(emitter_code)

        print(f"Event emitter generated: {args.output}")
        print("\nUsage:")
        print("1. Load event_emitter.js in browser")
        print("2. Emit events: window.emitEvent('cascade.start', { sourceNode: node })")
        print("3. Or use shortcuts: window.emitCascadeStart(node, 0.8)")
        print("4. List available: window.listAvailableEvents()")
        print("5. View timeline: window.printEventTimeline()")

    elif args.command == 'report':
        generator.analyze_events()

        print("\nEvent Analysis Report:")
        print(f"  Unique Events: {len(generator.semantic_events)}")
        print(f"  Total Handlers: {sum(len(h) for h in generator.event_handlers.values())}")

        print("\nTop Events (by handler count):")
        sorted_events = sorted(generator.event_handlers.items(),
                              key=lambda x: len(x[1]),
                              reverse=True)[:10]
        for event, handlers in sorted_events:
            print(f"  {event}: {len(handlers)} handlers")


if __name__ == '__main__':
    main()
