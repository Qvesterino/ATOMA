#!/usr/bin/env python3
"""
VFX Memory Tracker - ATOMA Memory Leak Detection for VFX Systems

Identifies memory leaks in VFX systems by tracking object creation/destruction.
Monitors Three.js geometries, materials, and custom VFX objects.

Usage:
    python vfx_memory_tracker.py generate-tracker       # Generate memory tracker
    python vfx_memory_tracker.py analyze-vfx            # Analyze VFX memory patterns
    python vfx_memory_tracker.py report                 # Generate memory report
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Set
from datetime import datetime
from collections import defaultdict


class VFXMemoryAnalyzer:
    """Analyzes VFX memory patterns and potential leaks."""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.vfx_systems = []
        self.memory_patterns = []
        self.pool_usage = []

    def analyze_vfx(self) -> None:
        """Analyze VFX systems for memory patterns."""
        js_files = list(self.workspace_root.rglob("*.js"))
        js_files = [f for f in js_files if not any(skip in str(f)
                     for skip in ["node_modules", ".git", "agent_runtime"])]

        print(f"Analyzing {len(js_files)} files for VFX memory patterns...")

        for js_file in js_files:
            self._analyze_file(js_file)

        print(f"Analyzed {len(self.vfx_systems)} VFX systems")
        print(f"Found {len(self.memory_patterns)} memory patterns")
        print(f"Found {len(self.pool_usage)} pool usage patterns")

    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single file for VFX memory patterns."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            lines = content.split('\n')

            # Find VFX systems
            vfx_keywords = [
                "Visualizer", "ParticleSystem", "Cascade", "Resonance",
                "Wave", "Harmonic", "Synergy", "Corruption", "Rupture",
                "Trail", "Spark", "Bead", "Pulse", "Glow", "Aura"
            ]

            class_matches = re.finditer(r'class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{', content)
            for match in class_matches:
                class_name = match.group(1)

                if any(keyword.lower() in class_name.lower() for keyword in vfx_keywords):
                    self.vfx_systems.append({
                        "name": class_name,
                        "file": str(file_path),
                        "file_name": file_path.name
                    })

                    # Analyze memory patterns in this class
                    self._analyze_memory_patterns(content, class_name, lines)

        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _analyze_memory_patterns(self, content: str, class_name: str, lines: List[str]) -> None:
        """Analyze memory patterns in a VFX system."""
        # Find geometry/material creation
        geometry_patterns = [
            r'new\s+(?:THREE\.)?(\w+Geometry)\(',
            r'new\s+(?:THREE\.)?(\w+BufferGeometry)\(',
            r'createGeometry\(\)',
            r'generateGeometry\(\)'
        ]

        material_patterns = [
            r'new\s+(?:THREE\.)?(\w+Material)\(',
            r'createMaterial\(\)',
            r'generateMaterial\(\)'
        ]

        # Find cleanup patterns
        cleanup_patterns = [
            r'\.dispose\(\)',
            r'geometry\.dispose',
            r'material\.dispose',
            r'removeFromScene',
            r'cleanup\(\)',
            r'destroy\(\)',
            r'shutdown\(\)'
        ]

        # Find pool patterns
        pool_patterns = [
            r'pool\s*[=\[]',
            r'objectPool\s*[=:]',
            r'particlePool\s*[=:]',
            r'getInstance\(\)',
            r'returnInstance\(\)',
            r'recycle\(\)'
        ]

        # Scan for patterns
        for line_num, line in enumerate(lines, 1):
            # Geometry creation
            for pattern in geometry_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    geometry_type = match.group(1) if match.lastindex > 0 else "Unknown"
                    self.memory_patterns.append({
                        "system": class_name,
                        "type": "geometry_creation",
                        "geometry_type": geometry_type,
                        "line": line_num,
                        "has_dispose": self._check_has_dispose(content, class_name)
                    })

            # Material creation
            for pattern in material_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    material_type = match.group(1) if match.lastindex > 0 else "Unknown"
                    self.memory_patterns.append({
                        "system": class_name,
                        "type": "material_creation",
                        "material_type": material_type,
                        "line": line_num,
                        "has_dispose": self._check_has_dispose(content, class_name)
                    })

            # Pool usage
            for pattern in pool_patterns:
                if re.search(pattern, line):
                    self.pool_usage.append({
                        "system": class_name,
                        "pattern": pattern,
                        "line": line_num
                    })

    def _check_has_dispose(self, content: str, class_name: str) -> bool:
        """Check if a class has dispose/cleanup methods."""
        # Look for dispose/cleanup in the class
        class_pattern = rf'class\s+{re.escape(class_name)}\s*(?:extends\s+\w+)?\s*\{{'

        match = re.search(class_pattern, content)
        if not match:
            return False

        # Find class body
        brace_count = 0
        class_body_start = match.end()
        class_body = ""

        for i in range(class_body_start, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    class_body = content[class_body_start:i]
                    break

        # Check for dispose methods
        dispose_keywords = ['dispose', 'cleanup', 'destroy', 'shutdown', 'teardown']
        for keyword in dispose_keywords:
            if f'{keyword}(' in class_body:
                return True

        return False

    def generate_tracker_code(self) -> str:
        """Generate runtime memory tracker code."""
        return f"""
// === VFX MEMORY TRACKER ===
// Generated: {datetime.now().isoformat()}

class VFXMemoryTracker {{
    constructor() {{
        self.objectRegistry = new Map(); // id -> object info
        self.snapshots = [];
        self.leakedObjects = [];
        self.objectCounter = 0;
        self.enabled = true;
        self.thresholds = {{
            geometryLeak: 100,  // More than 100 geometries = leak
            materialLeak: 100,  // More than 100 materials = leak
            meshLeak: 500,      // More than 500 meshes = leak
            memoryLeak: 50 * 1024 * 1024  // 50MB threshold
        }};

        self._setupTracking();
        self._startLeakDetection();
    }}

    _setupTracking() {{
        // Wrap THREE.Object3D constructor
        if (typeof THREE !== 'undefined' && THREE.Object3D) {{
            const originalObject3D = THREE.Object3D;
            const self = this;

            THREE.Object3D = function() {{
                const obj = originalObject3D.apply(this, arguments);
                self._trackObject(obj, 'Object3D');
                return obj;
            }};

            THREE.Object3D.prototype = originalObject3D.prototype;
            THREE.Object3D.prototype.constructor = THREE.Object3D;
        }}

        // Wrap THREE.BufferGeometry
        if (typeof THREE !== 'undefined' && THREE.BufferGeometry) {{
            const originalBufferGeometry = THREE.BufferGeometry;
            const self = this;

            THREE.BufferGeometry = function() {{
                const geom = originalBufferGeometry.apply(this, arguments);
                self._trackObject(geom, 'BufferGeometry');
                return geom;
            }};

            THREE.BufferGeometry.prototype = originalBufferGeometry.prototype;
            THREE.BufferGeometry.prototype.constructor = THREE.BufferGeometry;

            // Wrap dispose
            const originalDispose = THREE.BufferGeometry.prototype.dispose;
            THREE.BufferGeometry.prototype.dispose = function() {{
                self._untrackObject(this.uuid, 'BufferGeometry');
                return originalDispose.call(this);
            }};
        }}

        // Wrap THREE.Material
        if (typeof THREE !== 'undefined' && THREE.Material) {{
            const originalMaterial = THREE.Material;
            const self = this;

            THREE.Material = function() {{
                const mat = originalMaterial.apply(this, arguments);
                self._trackObject(mat, 'Material');
                return mat;
            }};

            THREE.Material.prototype = originalMaterial.prototype;
            THREE.Material.prototype.constructor = THREE.Material;

            // Wrap dispose
            const originalDispose = THREE.Material.prototype.dispose;
            THREE.Material.prototype.dispose = function() {{
                self._untrackObject(this.uuid, 'Material');
                return originalDispose.call(this);
            }};
        }}

        console.log('[Memory Tracker] Tracking enabled');
    }}

    _trackObject(obj, type) {{
        if (!this.enabled) return;

        const objectId = obj.uuid || `obj_${{this.objectCounter++}}`;
        const info = {{
            id: objectId,
            type: type,
            created: performance.now(),
            disposed: false,
            stackTrace: this._getStackTrace(3),
            userData: obj.userData || {{}}
        }};

        self.objectRegistry.set(objectId, info);
    }}

    _untrackObject(objectId, type) {{
        if (!this.enabled) return;

        const info = this.objectRegistry.get(objectId);
        if (info) {{
            info.disposed = true;
            info.disposedAt = performance.now();
            info.lifetime = info.disposedAt - info.created;
        }}
    }}

    _getStackTrace(skipFrames = 0) {{
        const stack = new Error().stack;
        if (!stack) return 'unknown';

        const lines = stack.split('\\n').slice(skipFrames + 2);
        return lines.slice(0, 3).join('\\n');
    }}

    _startLeakDetection() {{
        setInterval(() => {{
            self._detectLeaks();
        }}, 5000); // Check every 5 seconds
    }}

    _detectLeaks() {{
        const snapshot = this._createSnapshot();
        self.snapshots.push(snapshot);

        // Keep only last 10 snapshots
        if (this.snapshots.length > 10) {{
            self.snapshots.shift();
        }}

        // Compare with previous snapshot
        if (this.snapshots.length >= 2) {{
            const prev = this.snapshots[this.snapshots.length - 2];
            const current = this.snapshots[this.snapshots.length - 1];

            self._checkForGrowth(prev, current);
        }}
    }}

    _createSnapshot() {{
        const counts = {{
            geometries: 0,
            materials: 0,
            meshes: 0,
            active: 0,
            disposed: 0,
            timestamp: performance.now()
        }};

        self.objectRegistry.forEach(info => {{
            if (info.type === 'BufferGeometry') {{
                counts.geometries++;
            }} else if (info.type === 'Material') {{
                counts.materials++;
            }} else if (info.type === 'Object3D') {{
                counts.meshes++;
            }}

            if (info.disposed) {{
                counts.disposed++;
            }} else {{
                counts.active++;
            }}
        }});

        return counts;
    }}

    _checkForGrowth(prev, current) {{
        const timeDiff = (current.timestamp - prev.timestamp) / 1000; // seconds

        const geometryGrowth = current.geometries - prev.geometries;
        const materialGrowth = current.materials - prev.materials;
        const meshGrowth = current.meshes - prev.meshes;

        if (geometryGrowth > 10) {{
            console.warn(`⚠️ Geometry growth: +${{geometryGrowth}} in ${{timeDiff.toFixed(1)}}s`);
            self._reportSuspects('BufferGeometry');
        }}

        if (materialGrowth > 10) {{
            console.warn(`⚠️ Material growth: +${{materialGrowth}} in ${{timeDiff.toFixed(1)}}s`);
            self._reportSuspects('Material');
        }}

        if (meshGrowth > 50) {{
            console.warn(`⚠️ Mesh growth: +${{meshGrowth}} in ${{timeDiff.toFixed(1)}}s`);
        }}
    }}

    _reportSuspects(type) {{
        const suspects = [];

        self.objectRegistry.forEach(info => {{
            if (info.type === type && !info.disposed) {{
                const age = performance.now() - info.created;
                if (age > 10000) {{  // Older than 10 seconds
                    suspects.push({{
                        id: info.id,
                        age: (age / 1000).toFixed(1) + 's',
                        stack: info.stackTrace.split('\\n')[0]
                    }});
                }}
            }}
        }});

        if (suspects.length > 0) {{
            console.log(`Suspect ${type} objects (not disposed >10s):`);
            suspects.slice(0, 5).forEach(s => {{
                console.log(`  ${{s.id}} (age: ${{s.age}})`);
                console.log(`    Created at: ${{s.stack}}`);
            }});
        }}
    }}

    takeSnapshot(label = null) {{
        const snapshot = this._createSnapshot();
        if (label) {{
            snapshot.label = label;
        }}
        self.snapshots.push(snapshot);
        return snapshot;
    }}

    getReport() {{
        const current = this._createSnapshot();
        const disposed = Array.from(this.objectRegistry.values()).filter(i => i.disposed);

        // Find potential leaks
        const potentialLeaks = [];
        self.objectRegistry.forEach(info => {{
            if (!info.disposed) {{
                const age = performance.now() - info.created;
                if (age > 30000) {{  // Older than 30 seconds
                    potentialLeaks.push(info);
                }}
            }}
        }});

        return {{
            timestamp: new Date().toISOString(),
            current,
            totalCreated: this.objectRegistry.size,
            totalDisposed: disposed.length,
            potentialLeaks: potentialLeaks.length,
            leakSuspects: potentialLeaks.slice(0, 20).map(info => ({{
                id: info.id,
                type: info.type,
                age: ((performance.now() - info.created) / 1000).toFixed(1) + 's',
                stack: info.stackTrace
            }})),
            snapshots: this.snapshots
        }};
    }}

    printReport() {{
        const report = this.getReport();

        console.log('\\n=== VFX MEMORY REPORT ===');
        console.log(`Active Objects: ${{report.current.active}}`);
        console.log(`Disposed Objects: ${{report.totalDisposed}}`);
        console.log(`Total Created: ${{report.totalCreated}}`);
        console.log(`Potential Leaks: ${{report.potentialLeaks}}`);

        console.log('\\n--- Current Counts ---');
        console.log(`Geometries: ${{report.current.geometries}}`);
        console.log(`Materials: ${{report.current.materials}}`);
        console.log(`Meshes: ${{report.current.meshes}}`);

        if (report.potentialLeaks > 0) {{
            console.log('\\n⚠️ POTENTIAL MEMORY LEAKS');
            report.leakSuspects.forEach(leak => {{
                console.log(`  [${{leak.type}}] ${{leak.id}} (age: ${{leak.age}})`);
                console.log(`    Created: ${{leak.stack.split('\\n')[0]}}`);
            }});
        }} else {{
            console.log('\\n✓ No memory leaks detected');
        }}

        console.log('=============================\\n');
    }}

    exportData() {{
        return this.getReport();
    }}

    reset() {{
        self.objectRegistry.clear();
        self.snapshots = [];
        self.leakedObjects = [];
        console.log('[Memory Tracker] Reset');
    }}
}}

// Auto-load in browser
if (typeof window !== 'undefined') {{
    window.__VFX_MEMORY_TRACKER__ = new VFXMemoryTracker();

    // Expose API
    window.takeMemorySnapshot = (label) => window.__VFX_MEMORY_TRACKER__.takeSnapshot(label);
    window.getMemoryReport = () => window.__VFX_MEMORY_TRACKER__.getReport();
    window.printMemoryReport = () => window.__VFX_MEMORY_TRACKER__.printReport();
    window.resetMemoryTracker = () => window.__VFX_MEMORY_TRACKER__.reset();

    console.log('VFX Memory Tracker loaded.');
    console.log('API: window.printMemoryReport(), window.getMemoryReport()');
}}
"""

    def generate_analysis_report(self) -> str:
        """Generate memory analysis report."""
        lines = []
        lines.append("=" * 70)
        lines.append("VFX MEMORY ANALYSIS")
        lines.append("=" * 70)
        lines.append("")

        # Count patterns by type
        geometry_creations = [p for p in self.memory_patterns if p["type"] == "geometry_creation"]
        material_creations = [p for p in self.memory_patterns if p["type"] == "material_creation"]

        # Count systems without dispose
        systems_without_dispose = set(p["system"] for p in self.memory_patterns if not p["has_dispose"])

        lines.append(f"VFX Systems Analyzed: {len(self.vfx_systems)}")
        lines.append(f"Geometry Creations: {len(geometry_creations)}")
        lines.append(f"Material Creations: {len(material_creations)}")
        lines.append(f"Pool Usage Patterns: {len(self.pool_usage)}")
        lines.append("")

        # Most resource-heavy systems
        resource_counts = defaultdict(int)
        for pattern in self.memory_patterns:
            resource_counts[pattern["system"]] += 1

        lines.append("SYSTEMS BY RESOURCE CREATION")
        lines.append("-" * 70)
        for system, count in sorted(resource_counts.items(), key=lambda x: -x[1])[:10]:
            lines.append(f"  {system}: {count} resources")

        lines.append("\n")
        lines.append("GEOMETRY TYPES")
        lines.append("-" * 70)
        geometry_types = Counter(p["geometry_type"] for p in geometry_creations)
        for geom_type, count in geometry_types.most_common():
            lines.append(f"  {geom_type}: {count}")

        lines.append("\n")
        lines.append("MATERIAL TYPES")
        lines.append("-" * 70)
        material_types = Counter(p["material_type"] for p in material_creations)
        for mat_type, count in material_types.most_common():
            lines.append(f"  {mat_type}: {count}")

        lines.append("\n")
        lines.append("POTENTIAL MEMORY LEAKS")
        lines.append("-" * 70)

        if systems_without_dispose:
            lines.append("⚠️ Systems without dispose/cleanup methods:")
            for system in sorted(systems_without_dispose):
                lines.append(f"  - {system}")
        else:
            lines.append("✓ All systems have dispose/cleanup methods")

        lines.append("\n")
        lines.append("POOL USAGE")
        lines.append("-" * 70)
        if self.pool_usage:
            pool_systems = defaultdict(int)
            for pool in self.pool_usage:
                pool_systems[pool["system"]] += 1

            for system, count in sorted(pool_systems.items(), key=lambda x: -x[1]):
                lines.append(f"  {system}: {count} pool patterns")
        else:
            lines.append("  No pool usage patterns detected")

        # Recommendations
        lines.append("\n")
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 70)

        if len(geometry_creations) > len(self.pool_usage) * 2:
            lines.append("⚠️ Many geometry creations without pooling - consider object pooling")

        if len(material_creations) > 50:
            lines.append("⚠️ Many material creations - consider material sharing/reuse")

        if systems_without_dispose:
            lines.append("⚠️ Add dispose/cleanup methods to systems without them")

        lines.append("✓ Use memory tracker in runtime to detect actual leaks")
        lines.append("✓ Take snapshots before/after VFX operations")
        lines.append("✓ Monitor growth over time with periodic checks")

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='VFX Memory Tracker')
    parser.add_argument('command', choices=['generate-tracker', 'analyze-vfx', 'report'],
                       help='Command to run')
    parser.add_argument('--workspace', default='..',
                       help='Workspace root directory (default: ..)')
    parser.add_argument('--output-tracker', default='vfx_memory_tracker.js',
                       help='Output file for tracker script')
    parser.add_argument('--output-report', help='Output file for analysis report')

    args = parser.parse_args()

    analyzer = VFXMemoryAnalyzer(args.workspace)

    if args.command == 'analyze-vfx':
        analyzer.analyze_vfx()
        print("\n" + analyzer.generate_analysis_report())

    elif args.command == 'generate-tracker':
        analyzer.analyze_vfx()

        tracker_code = analyzer.generate_tracker_code()
        output_path = analyzer.workspace_root / args.output_tracker

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(tracker_code)

        print(f"Memory tracker generated: {args.output_tracker}")
        print("\nUsage:")
        print("1. Load vfx_memory_tracker.js in browser")
        print("2. Trigger VFX operations")
        print("3. Run: window.printMemoryReport()")
        print("4. Take snapshots: window.takeMemorySnapshot('before')")

    elif args.command == 'report':
        analyzer.analyze_vfx()
        report = analyzer.generate_analysis_report()

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {args.output_report}")
        else:
            print(report)


if __name__ == '__main__':
    main()
