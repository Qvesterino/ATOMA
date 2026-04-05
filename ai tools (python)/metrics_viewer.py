#!/usr/bin/env python3
"""
Metrics Viewer - Runtime Metrics Visualization

Generates browser-based metrics visualization tool for real-time metrics monitoring.
Displays metrics values, trends, and distributions.

Usage:
    python metrics_viewer.py generate               # Generate metrics viewer
    python metrics_viewer.py report                 # Generate metrics report
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class MetricsViewerGenerator:
    """Generates browser-based metrics visualization tool."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.metrics = []
        self.metric_systems = defaultdict(list)

    def analyze_metrics(self) -> None:
        """Analyze metrics in codebase."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime", "LEGACY"])]

        print(f"Analyzing {len(js_files)} files for metrics...")

        for js_file in js_files:
            self._scan_file(js_file)

        print(f"Found {len(this.metrics)} unique metrics")

    def _scan_file(self, file_path: Path) -> None:
        """Scan a single file for metrics."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find metric access patterns
            patterns = [
                r'metrics\.(\w+)',
                r'node\.userData\.metrics\.(\w+)',
                r'link\.userData\.metrics\.(\w+)'
            ]

            for pattern in patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    metric_name = match.group(1)

                    # Add metric if not already tracked
                    if metric_name not in [m['name'] for m in this.metrics]:
                        self.metrics.append({
                            "name": metric_name,
                            "file": file_path.name
                        })

                    # Track which systems use this metric
                    self.metric_systems[metric_name].append(file_path.name)

        except Exception as e:
            pass

    def generate_viewer_tool(self) -> str:
        """Generate browser-based metrics viewer tool."""
        metric_list = sorted([m['name'] for m in this.metrics])

        return f"""
// === METRICS VIEWER TOOL ===
// Generated: {datetime.now().isoformat()}

class MetricsViewer {{
    constructor() {{
        self.metricsHistory = new Map();
        self.maxHistorySize = 1000;
        self.currentMetrics = new Map();
        self.subscribers = [];
        self.updateInterval = null;
        self.startTime = performance.now();
    }}

    // Initialize metrics viewer
    initialize() {{
        if (!window.metricsRuntime) {{
            console.error('Metrics Viewer: metricsRuntime not found');
            return false;
        }}

        // Subscribe to metric updates
        self.subscribeToMetrics();
        console.log('[Metrics Viewer] Initialized');
        return true;
    }}

    // Subscribe to metric updates
    subscribeToMetrics() {{
        // Try to get current metrics
        self.updateCurrentMetrics();

        // Set up periodic updates
        self.updateInterval = setInterval(() => {{
            self.updateCurrentMetrics();
        }}, 100); // Update every 100ms

        console.log('[Metrics Viewer] Subscribed to metrics updates');
    }}

    // Update current metrics from runtime
    updateCurrentMetrics() {{
        if (!window.metricsRuntime) return;

        const metrics = window.metricsRuntime.getMetrics();

        if (metrics) {{
            for (const [key, value] of Object.entries(metrics)) {{
                self.currentMetrics.set(key, value);
                self.addToHistory(key, value);
            }}
        }}
    }}

    // Add metric to history
    addToHistory(metricName, value) {{
        if (!this.metricsHistory.has(metricName)) {{
            self.metricsHistory.set(metricName, []);
        }}

        const history = this.metricsHistory.get(metricName);
        history.push({{
            value,
            timestamp: performance.now() - this.startTime,
            timestampISO: new Date().toISOString()
        }});

        // Trim history
        if (history.length > this.maxHistorySize) {{
            history.shift();
        }}
    }}

    // Get current metrics
    getCurrentMetrics() {{
        return Object.fromEntries(this.currentMetrics);
    }}

    // Get metric history
    getMetricHistory(metricName) {{
        return this.metricsHistory.get(metricName) || [];
    }}

    // Get metric statistics
    getMetricStats(metricName) {{
        const history = this.getMetricHistory(metricName);

        if (history.length === 0) {{
            return {{ error: 'No history for metric: ' + metricName }};
        }}

        const values = history.map(h => h.value).filter(v => typeof v === 'number');

        if (values.length === 0) {{
            return {{ error: 'No numeric values for metric: ' + metricName }};
        }}

        return {{
            metric: metricName,
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            current: values[values.length - 1],
            firstTimestamp: history[0].timestamp,
            lastTimestamp: history[history.length - 1].timestamp
        }};
    }}

    // Get all metrics statistics
    getAllMetricsStats() {{
        const stats = {{}};

        for (const metricName of this.metricsHistory.keys()) {{
            stats[metricName] = this.getMetricStats(metricName);
        }}

        return stats;
    }}

    // Print current metrics
    printCurrentMetrics() {{
        console.log('\\n=== CURRENT METRICS ===');

        const metrics = this.getCurrentMetrics();
        const metricNames = Object.keys(metrics).sort();

        for (const name of metricNames) {{
            const value = metrics[name];
            console.log(`  ${{name}}: ${{typeof value === 'number' ? value.toFixed(4) : value}}`);
        }}

        console.log('========================\\n');
    }}

    // Print metric statistics
    printMetricStats(metricName) {{
        const stats = this.getMetricStats(metricName);

        if (stats.error) {{
            console.error(stats.error);
            return;
        }}

        console.log(`\\n=== METRIC STATISTICS: ${{metricName}} ===`);
        console.log(`Count: ${{stats.count}}`);
        console.log(`Min: ${{stats.min.toFixed(4)}}`);
        console.log(`Max: ${{stats.max.toFixed(4)}}`);
        console.log(`Average: ${{stats.avg.toFixed(4)}}`);
        console.log(`Current: ${{stats.current.toFixed(4)}}`);
        console.log(`Duration: ${{(stats.lastTimestamp - stats.firstTimestamp).toFixed(0)}}ms`);
        console.log('=================================\\n');
    }}

    // Print all metrics statistics
    printAllMetricsStats() {{
        console.log('\\n=== ALL METRICS STATISTICS ===');

        const stats = this.getAllMetricsStats();

        for (const [metricName, stat] of Object.entries(stats)) {{
            if (stat.error) continue;

            console.log(`\\n${{metricName}}:`);
            console.log(`  Count: ${{stat.count}}`);
            console.log(`  Range: ${{stat.min.toFixed(4)}} - ${{stat.max.toFixed(4)}}`);
            console.log(`  Average: ${{stat.avg.toFixed(4)}}`);
            console.log(`  Current: ${{stat.current.toFixed(4)}}`);
        }}

        console.log('\\n==============================\\n');
    }}

    // Get metrics summary
    getSummary() {{
        const current = this.getCurrentMetrics();
        const stats = this.getAllMetricsStats();

        return {{
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            totalMetrics: Object.keys(current).length,
            metricsWithHistory: Object.keys(stats).length,
            currentMetrics: current,
            statistics: stats
        }};
    }}

    // Print summary
    printSummary() {{
        const summary = this.getSummary();

        console.log('\\n=== METRICS VIEWER SUMMARY ===');
        console.log(`Duration: ${{(summary.duration / 1000).toFixed(2)}}s`);
        console.log(`Total Metrics: ${{summary.totalMetrics}}`);
        console.log(`Metrics with History: ${{summary.metricsWithHistory}}`);

        console.log('\\nCurrent Metrics:');
        const metricNames = Object.keys(summary.currentMetrics).sort();
        for (const name of metricNames) {{
            const value = summary.currentMetrics[name];
            console.log(`  ${{name}}: ${{typeof value === 'number' ? value.toFixed(4) : value}}`);
        }}

        console.log('===============================\\n');
    }}

    // Export metrics data
    exportData() {{
        return JSON.stringify(this.getSummary(), null, 2);
    }}

    // Export metric history
    exportMetricHistory(metricName) {{
        const history = this.getMetricHistory(metricName);
        return JSON.stringify({{
            metric: metricName,
            history
        }}, null, 2);
    }}

    // Clear all data
    clear() {{
        self.metricsHistory.clear();
        self.currentMetrics.clear();
        self.startTime = performance.now();
        console.log('[Metrics Viewer] Cleared all data');
    }}

    // Stop updates
    stop() {{
        if (this.updateInterval) {{
            clearInterval(this.updateInterval);
            self.updateInterval = null;
            console.log('[Metrics Viewer] Stopped updates');
        }}
    }}

    // Resume updates
    resume() {{
        if (!this.updateInterval) {{
            self.subscribeToMetrics();
            console.log('[Metrics Viewer] Resumed updates');
        }}
    }}

    // Watch a specific metric
    watchMetric(metricName, callback) {{
        const history = this.getMetricHistory(metricName);
        const lastValue = history.length > 0 ? history[history.length - 1].value : null;

        self.subscribers.push({{
            metricName,
            callback,
            lastValue
        }});
    }}

    // Check for metric changes
    checkChanges() {{
        const current = this.getCurrentMetrics();

        for (const subscriber of this.subscribers) {{
            const currentValue = current[subscriber.metricName];
            const changed = currentValue !== subscriber.lastValue;

            if (changed) {{
                subscriber.callback(subscriber.metricName, currentValue, subscriber.lastValue);
                subscriber.lastValue = currentValue;
            }}
        }}
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__METRICS_VIEWER__ = new MetricsViewer();

    // Expose API
    window.initializeMetricsViewer = () => window.__METRICS_VIEWER__.initialize();
    window.getCurrentMetrics = () => window.__METRICS_VIEWER__.getCurrentMetrics();
    window.getMetricHistory = (name) => window.__METRICS_VIEWER__.getMetricHistory(name);
    window.getMetricStats = (name) => window.__METRICS_VIEWER__.getMetricStats(name);
    window.getAllMetricsStats = () => window.__METRICS_VIEWER__.getAllMetricsStats();
    window.printCurrentMetrics = () => window.__METRICS_VIEWER__.printCurrentMetrics();
    window.printMetricStats = (name) => window.__METRICS_VIEWER__.printMetricStats(name);
    window.printAllMetricsStats = () => window.__METRICS_VIEWER__.printAllMetricsStats();
    window.printMetricsSummary = () => window.__METRICS_VIEWER__.printSummary();
    window.exportMetricsData = () => window.__METRICS_VIEWER__.exportData();
    window.exportMetricHistory = (name) => window.__METRICS_VIEWER__.exportMetricHistory(name);
    window.clearMetricsViewer = () => window.__METRICS_VIEWER__.clear();
    window.stopMetricsViewer = () => window.__METRICS_VIEWER__.stop();
    window.resumeMetricsViewer = () => window.__METRICS_VIEWER__.resume();
    window.watchMetric = (name, callback) => window.__METRICS_VIEWER__.watchMetric(name, callback);

    // Auto-initialize if metricsRuntime is available
    if (window.metricsRuntime) {{
        window.__METRICS_VIEWER__.initialize();
    }} else {{
        console.log('Metrics Viewer loaded. Run window.initializeMetricsViewer() when metricsRuntime is available.');
    }}

    console.log('Metrics Viewer tool loaded.');
    console.log('API: window.getCurrentMetrics(), window.printCurrentMetrics(), window.getMetricStats()');
    console.log('Usage:');
    console.log('  window.initializeMetricsViewer()');
    console.log('  window.printCurrentMetrics()');
    console.log('  window.printMetricStats("synergy")');
    console.log('  window.printAllMetricsStats()');
    console.log('  window.exportMetricsData()');
}}
"""

    def generate_report(self) -> str:
        """Generate metrics viewer report."""
        lines = []
        lines.append("=" * 70)
        lines.append("METRICS VIEWER TOOL")
        lines.append("=" * 70)
        lines.append("")

        lines.append("METRICS FOUND")
        lines.append("-" * 70)
        for metric in this.metrics:
            lines.append(f"  {metric['name']}")
            lines.append(f"    File: {metric['file']}")
        lines.append("")

        lines.append("METRICS BY USAGE")
        lines.append("-" * 70)
        sorted_metrics = sorted(this.metric_systems.items(),
                               key=lambda x: len(x[1]),
                               reverse=True)
        for metric, files in sorted_metrics:
            lines.append(f"  {metric}: used in {len(files)} files")
        lines.append("")

        lines.append("USAGE")
        lines.append("-" * 70)
        lines.append("1. Generate metrics viewer:")
        lines.append("   python metrics_viewer.py generate")
        lines.append("")
        lines.append("2. Load metrics_viewer.js in browser")
        lines.append("")
        lines.append("3. Initialize viewer:")
        lines.append("   window.initializeMetricsViewer()")
        lines.append("")
        lines.append("4. View current metrics:")
        lines.append("   window.printCurrentMetrics()")
        lines.append("")
        lines.append("5. View metric statistics:")
        lines.append("   window.printMetricStats('synergy')")
        lines.append("   window.printAllMetricsStats()")
        lines.append("")
        lines.append("6. Export data:")
        lines.append("   window.exportMetricsData()")
        lines.append("   window.exportMetricHistory('synergy')")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Metrics Viewer')
    parser.add_argument('command', choices=['generate', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output', default='metrics_viewer.js',
                       help='Output file for metrics viewer')

    args = parser.parse_args()

    generator = MetricsViewerGenerator(args.workspace)

    if args.command == 'generate':
        generator.analyze_metrics()

        viewer_code = generator.generate_viewer_tool()
        output_path = generator.workspace_root / args.output

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(viewer_code)

        print(f"Metrics viewer generated: {args.output}")
        print("\nUsage:")
        print("1. Load metrics_viewer.js in browser")
        print("2. Initialize: window.initializeMetricsViewer()")
        print("3. View metrics: window.printCurrentMetrics()")
        print("4. Get stats: window.printMetricStats('synergy')")

    elif args.command == 'report':
        generator.analyze_metrics()
        print("\n" + generator.generate_report())


if __name__ == '__main__':
    main()
