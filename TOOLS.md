# TOOLS.md -- ATOMA Local Agent Tool Contract

This agent operates inside a local development environment.

Tools extend reasoning and implementation.
They are used to understand, validate, and ship coherent changes.

---

## Available Tool Classes

### Code Access

- full workspace read access
- local file write access inside the workspace

### Search

- ripgrep and repository search
- structure inspection
- dependency tracing

### Execution

- typecheck
- build
- targeted verification
- runtime sanity checks

Use the lightest verification that fits the risk.

---

## Tool Usage Philosophy

Use tools to:

- confirm structure
- verify runtime paths
- validate authority ownership
- measure performance-sensitive impact
- implement and verify changes
- confirm subsystem ownership before cross-system edits

Do not use tools to:

- patch blindly
- ignore existing architecture
- create accidental duplication

## Runtime Verification Default

When running browser/runtime validation in this workspace:

- open `http://127.0.0.1:5500/index.html`
- treat the local static server boot as the canonical runtime path for smoke tests
- only use an alternate boot path if the task explicitly requires it
- current local boot map in this workspace:
  - static runtime: `http://127.0.0.1:5500/index.html`
  - Vite dev runtime: `http://localhost:5173/`
  - Python server: `http://localhost:8080/`
- use Microsoft Edge for manual smoke testing when a browser choice matters

---

## Search Discipline

Before referencing or changing a system:

- confirm the file exists
- confirm the active runtime path exists
- confirm authority ownership exists
- confirm whether the system is active, dormant, or legacy
- confirm which subsystem owns the change

Never assume a file is live just because it exists.

---

## Write Discipline

When modifying files:

- keep changes coherent and task-aligned
- preserve naming conventions and architectural patterns
- refactor freely when it improves clarity, modularity, or performance
- preserve compatibility unless the task explicitly requires a managed break
- avoid unrelated edits
- avoid touching other subsystem APIs unless the reason is concrete and necessary

New files must have a clear role in the system.

---

## Rendering and Performance Guard

When touching rendering, shaders, scheduling, or large FX systems:

- preserve `10Hz` simulation, `30Hz` visual, and `60Hz` runtime authority
- avoid per-frame allocations
- avoid update-loop geometry churn
- keep shader cost proportional to value
- design effects with LOD or distance-aware scaling
- prefer staged initialization for heavy systems
- keep heavy visual work on the visual layer rather than leaking into simulation

ATOMA runs in the browser. Performance is never optional.

---

## Tool Priority Model

Default:
understand -> inspect -> implement -> verify

Prefer clean solutions over diff-heavy churn.

---

## AI Tools (Python & PowerShell)

The workspace includes a complete suite of 22 specialized AI tools for metric analysis, VFX debugging, event tracking, testing, optimization, and runtime monitoring. These tools are located in:

- `ai tools (python)/` - Python-based analysis, testing, optimization, and monitoring scripts (22 tools)
- `ai tools (powershell)/` - PowerShell-based inspection and validation scripts

### Complete Tool List (22/22 - 100%)

#### Phase 1: Core Analysis (5 tools)
1. **metric_flow_tracer.py** - Traces complete metric flow from source to VFX consumers
2. **semantic_event_mapper.py** - Maps events to handlers, detects orphan/dead handlers
3. **vfx_lifecycle_tracker.py** - Tracks VFX system activation/deactivation
4. **vfx_performance_profiler.py** - Profiles VFX runtime performance
5. **metric_binding_validator.py** - Validates metric bindings against documentation

#### Phase 2: Testing & Quality (5 tools)
6. **vfx_integration_tester.py** - Automated VFX integration tests with 5 scenarios
7. **link_lifecycle_tester.py** - Complete link VFX lifecycle testing (8 phases)
8. **event_flow_tracer.py** - Runtime event flow visualization with storm detection
9. **vfx_memory_tracker.py** - Memory leak detection for VFX systems
10. **vfx_dead_code_detector.py** - Detects unused VFX systems and dead code

#### Phase 3: Optimization (7 tools)
11. **metric_threshold_analyzer.py** - Analyzes metric threshold configurations, suggests consistent values
12. **lod_tuner.py** - Automatic LOD threshold tuning with performance testing
13. **particle_budget_analyzer.py** - Particle pool budget analysis and size optimization
14. **vfx_docs_generator.py** - Auto-generates VFX documentation from code
15. **metric_naming_consistency.py** - Validates metric naming conventions across codebase
16. **geometry_leak_detector.py** - Three.js geometry/material leak detection
17. **cascade_emulation.py** - Cascade event emulation for isolated testing

#### Phase 4: Quick Utilities (5 tools)
18. **vfx_quick_status.py** - Fast VFX status overview
19. **event_emitter.py** - Manual event emission for testing
20. **performance_snapshot.py** - Quick performance snapshots and monitoring
21. **vfx_health_check.py** - VFX system health check and validation
22. **metrics_viewer.py** - Runtime metrics visualization and monitoring

### Tool Categories

#### Analysis Tools (9 tools)
- **metric_flow_tracer.py** - Complete metric flow analysis with source-to-consumer tracking
- **semantic_event_mapper.py** - Event system mapping with orphan/dead handler detection
- **metric_threshold_analyzer.py** - Threshold consistency analysis and suggestions
- **metric_naming_consistency.py** - Naming convention validation
- **vfx_docs_generator.py** - Automatic VFX documentation generation from code
- **metric_binding_validator.py** - Documentation validation against implementation
- **vfx_lifecycle_tracker.py** - VFX system lifecycle tracking
- **vfx_quick_status.py** - Fast VFX system overview

#### Testing Tools (6 tools)
- **vfx_integration_tester.py** - 5 automated VFX integration test scenarios
- **link_lifecycle_tester.py** - 8-phase link VFX lifecycle testing
- **event_flow_tracer.py** - Runtime event flow visualization with storm detection
- **vfx_memory_tracker.py** - Memory leak detection and growth monitoring
- **geometry_leak_detector.py** - Three.js geometry/material leak detection
- **event_emitter.py** - Manual event emission for testing

#### Optimization Tools (4 tools)
- **vfx_performance_profiler.py** - VFX runtime performance profiling
- **lod_tuner.py** - Automatic LOD threshold tuning with FPS measurement
- **particle_budget_analyzer.py** - Particle pool budget optimization
- **vfx_dead_code_detector.py** - Unused VFX system detection and removal

#### Monitoring Tools (3 tools)
- **performance_snapshot.py** - Performance snapshots and continuous monitoring
- **vfx_health_check.py** - System health validation with issue detection
- **metrics_viewer.py** - Real-time metrics visualization and historical tracking

---

## Implementation Status

### Phase 1: Core Analysis Tools ✅ COMPLETED
- ✅ `metric_flow_tracer.py` - Complete metric flow analysis
- ✅ `semantic_event_mapper.py` - Event system mapping
- ✅ `vfx_lifecycle_tracker.py` - VFX lifecycle tracking
- ✅ `vfx_performance_profiler.py` - Performance profiling
- ✅ `metric_binding_validator.py` - Documentation validation

### Phase 2: Testing & Quality ✅ COMPLETED
- ✅ `vfx_integration_tester.py` - Automated VFX integration tests
- ✅ `link_lifecycle_tester.py` - Complete link VFX lifecycle testing
- ✅ `event_flow_tracer.py` - Runtime event flow visualization
- ✅ `vfx_memory_tracker.py` - Memory leak detection
- ✅ `vfx_dead_code_detector.py` - Detects unused VFX systems

### Phase 3: Optimization ✅ COMPLETED
- ✅ `metric_threshold_analyzer.py` - Analyzes metric threshold configurations
- ✅ `lod_tuner.py` - Automatic LOD threshold tuning with performance testing
- ✅ `particle_budget_analyzer.py` - Particle pool budget analysis and optimization
- ✅ `vfx_docs_generator.py` - Auto-generates VFX documentation from code
- ✅ `metric_naming_consistency.py` - Validates metric naming conventions
- ✅ `geometry_leak_detector.py` - Three.js geometry/material leak detection
- ✅ `cascade_emulation.py` - Cascade event emulation for isolated testing

### Phase 4: Quick Utilities ✅ COMPLETED
- ✅ `vfx_quick_status.py` - Fast VFX status overview
- ✅ `event_emitter.py` - Manual event emission for testing
- ✅ `performance_snapshot.py` - Quick performance snapshots and monitoring
- ✅ `vfx_health_check.py` - VFX system health check and validation
- ✅ `metrics_viewer.py` - Runtime metrics visualization

**COMPLETION STATUS: 22/22 tools (100%) 🎉**

---

## Usage Examples

### Phase 1: Core Analysis

#### Metric Flow Analysis
```bash
cd "ai tools (python)"
python metric_flow_tracer.py scan
python metric_flow_tracer.py report  # Generates HTML report
python metric_flow_tracer.py validate
```

#### Semantic Event Mapping
```bash
python semantic_event_mapper.py scan
python semantic_event_mapper.py report  # Generates HTML report
```

#### VFX Lifecycle Tracking
```bash
python vfx_lifecycle_tracker.py analyze
python vfx_lifecycle_tracker.py report
```

#### Performance Profiling
```bash
python vfx_performance_profiler.py analyze
python vfx_performance_profiler.py generate-profiler
```

#### Metric Binding Validation
```bash
python metric_binding_validator.py validate
python metric_binding_validator.py report  # Generates HTML report
```

### Phase 2: Testing & Quality

#### VFX Integration Tests
```bash
python vfx_integration_tester.py generate-scenarios
# Load vfx_integration_test_runner.js in browser
# Run: await window.runVFXIntegrationTests()
```

#### Link Lifecycle Tests
```bash
python link_lifecycle_tester.py generate-tests
# Load link_lifecycle_test.js in browser
# Run: await window.runLinkLifecycleTest()
```

#### Event Flow Tracing
```bash
python event_flow_tracer.py generate-tracer
# Load event_flow_tracer.js in browser
# Run: window.__EVENT_FLOW_TRACER__.printTimeline()
```

#### Memory Tracking
```bash
python vfx_memory_tracker.py generate-tracker
# Load vfx_memory_tracker.js in browser
# Run: window.__VFX_MEMORY_TRACKER__.startMonitoring()
```

#### Dead Code Detection
```bash
python vfx_dead_code_detector.py scan
python vfx_dead_code_detector.py report
```

### Phase 3: Optimization

#### Metric Threshold Analysis
```bash
python metric_threshold_analyzer.py analyze
python metric_threshold_analyzer.py suggest
```

#### LOD Tuning
```bash
python lod_tuner.py generate-tests
# Load lod_tuner.js in browser
# Run: await window.runLODTuningTests()
```

#### Particle Budget Analysis
```bash
python particle_budget_analyzer.py analyze
python particle_budget_analyzer.py suggest
```

#### VFX Documentation Generation
```bash
python vfx_docs_generator.py generate-docs
python vfx_docs_generator.py sync
```

#### Metric Naming Consistency
```bash
python metric_naming_consistency.py scan
python metric_naming_consistency.py fix-suggestions
```

#### Geometry Leak Detection
```bash
python geometry_leak_detector.py scan
python geometry_leak_detector.py analyze
```

#### Cascade Emulation
```bash
python cascade_emulation.py generate-emulator
# Load cascade_emulator.js in browser
# Run: await window.simulateCascade(5, 200)
```

### Phase 4: Quick Utilities

#### VFX Quick Status
```bash
python vfx_quick_status.py scan
python vfx_quick_status.py summary
```

#### Event Emission
```bash
python event_emitter.py generate
# Load event_emitter.js in browser
# Run: window.emitCascadeStart(node, 0.8)
```

#### Performance Snapshots
```bash
python performance_snapshot.py generate
# Load performance_snapshot.js in browser
# Run: window.takeSnapshot('Test')
```

#### VFX Health Check
```bash
python vfx_health_check.py generate
# Load vfx_health_check.js in browser
# Run: window.runVFXHealthCheck()
```

#### Metrics Viewer
```bash
python metrics_viewer.py generate
# Load metrics_viewer.js in browser
# Run: window.initializeMetricsViewer()
#     window.printCurrentMetrics()
```

---

## Browser Runtime API

### Testing APIs
```javascript
// VFX Integration Tests
await window.runVFXIntegrationTests()

// Link Lifecycle Tests
await window.runLinkLifecycleTest()

// Event Emission
window.emitEvent('cascade.start', { sourceNode: node, intensity: 0.8 })
window.emitCascadeStart(node, 0.8)
window.emitCascadeHop(source, target, 0.8)
window.emitCascadeEnd(node, 5)
window.emitLinkCreated(link)
window.emitLinkRemoved(link)
window.emitNodeSelected(node)
window.emitNodeDeselected(node)
window.emitCorruptionSpread(node, 0.5)
window.emitCorruptionHeal(node, 0.5)
window.emitResonancePulse(link, 0.8)
window.emitWaveBirth(position)
window.emitWaveCollision(wave1, wave2)

// Event Utilities
window.listAvailableEvents()
window.printEventTimeline()
window.getEventStatistics()
window.exportEventData()
```

### Performance APIs
```javascript
// Performance Profiling
window.__VFX_PERF_API.printReport()
window.__VFX_PERF_API.getReport()

// Performance Snapshots
window.takeSnapshot('Before test')
window.startMonitoring(1000)  // 1 second interval
window.stopMonitoring()
window.printPerformanceSummary()
window.exportPerformanceSnapshots()
```

### Event Flow APIs
```javascript
// Event Flow Tracing
window.__EVENT_FLOW_TRACER__.printTimeline()
window.__EVENT_FLOW_TRACER__.detectStorms()
window.__EVENT_FLOW_TRACER__.printStatistics()
window.__EVENT_FLOW_TRACER__.exportData()
```

### Memory Tracking APIs
```javascript
// Memory Tracking
window.__VFX_MEMORY_TRACKER__.startMonitoring()
window.__VFX_MEMORY_TRACKER__.stopMonitoring()
window.__VFX_MEMORY_TRACKER__.printGrowthReport()
window.__VFX_MEMORY_TRACKER__.exportData()
```

### Optimization APIs
```javascript
// LOD Tuning
window.runLODTuningTests()
window.setLODThresholds(near, mid, far)
window.__LOD_TUNER__.printResults()

// Cascade Emulation
window.simulateCascade(nodeCount, hopDelay)
window.simulateMultipleCascades(count, nodesPerCascade, delay)
window.runCascadeStressTest(durationMs)
window.getCascadeEventTimeline()
window.exportCascadeEventData()
```

### Monitoring APIs
```javascript
// Health Check
window.runVFXHealthCheck()
window.getVFXHealthReport()
window.exportVFXHealthReport()

// Metrics Viewer
window.initializeMetricsViewer()
window.getCurrentMetrics()
window.getMetricHistory('synergy')
window.getMetricStats('synergy')
window.printCurrentMetrics()
window.printMetricStats('synergy')
window.printAllMetricsStats()
window.printMetricsSummary()
window.exportMetricsData()
window.exportMetricHistory('synergy')
window.watchMetric('synergy', (name, current, previous) => {
    console.log(`${name} changed from ${previous} to ${current}`);
})
```

---

## Output Files

Most tools generate reports in multiple formats:
- **Text**: Terminal-friendly output
- **JSON**: Machine-readable data for further processing
- **HTML**: Interactive web-based reports with visualizations

### Python Scripts (22 files)
All located in `ai tools (python)/` directory.

### Browser Scripts Generated (10 files)
Generated by various tools and loaded in browser for runtime analysis:

**Phase 2 - Testing:**
- `vfx_integration_test_runner.js` - VFX integration test runner
- `link_lifecycle_test.js` - Link lifecycle test runner
- `event_flow_tracer.js` - Event flow tracer with timeline
- `vfx_memory_tracker.js` - Memory tracker with growth monitoring

**Phase 3 - Optimization:**
- `lod_tuner.js` - LOD tuner with FPS measurement
- `cascade_emulator.js` - Cascade event emulator

**Phase 4 - Utilities:**
- `event_emitter.js` - Event emitter for manual testing
- `performance_snapshot.js` - Performance snapshot tool
- `vfx_health_check.js` - VFX health check tool
- `metrics_viewer.js` - Metrics viewer with history

### Common Output Files
- `metric_flow_report.html` - Interactive metric flow visualization
- `event_map_report.html` - Interactive event system map
- `metric_binding_validation_report.html` - Documentation validation report
- `vfx_lifecycle_data.json` - VFX system lifecycle data
- `vfx_performance_data.json` - Performance profiling data
- `VFX_DOCUMENTATION.md` - Auto-generated VFX documentation

### Output Formats by Tool

| Tool | Text | JSON | HTML | Browser Script |
|------|------|------|------|----------------|
| metric_flow_tracer.py | ✓ | ✓ | ✓ | - |
| semantic_event_mapper.py | ✓ | ✓ | ✓ | - |
| vfx_lifecycle_tracker.py | ✓ | ✓ | - | - |
| vfx_performance_profiler.py | ✓ | ✓ | - | ✓ |
| metric_binding_validator.py | ✓ | ✓ | ✓ | - |
| vfx_integration_tester.py | ✓ | ✓ | - | ✓ |
| link_lifecycle_tester.py | ✓ | ✓ | - | ✓ |
| event_flow_tracer.py | ✓ | ✓ | - | ✓ |
| vfx_memory_tracker.py | ✓ | ✓ | - | ✓ |
| vfx_dead_code_detector.py | ✓ | ✓ | - | - |
| metric_threshold_analyzer.py | ✓ | ✓ | - | - |
| lod_tuner.py | ✓ | ✓ | - | ✓ |
| particle_budget_analyzer.py | ✓ | ✓ | - | - |
| vfx_docs_generator.py | ✓ | - | - | - |
| metric_naming_consistency.py | ✓ | ✓ | - | - |
| geometry_leak_detector.py | ✓ | ✓ | - | - |
| cascade_emulation.py | ✓ | - | - | ✓ |
| vfx_quick_status.py | ✓ | ✓ | - | - |
| event_emitter.py | ✓ | - | - | ✓ |
| performance_snapshot.py | ✓ | - | - | ✓ |
| vfx_health_check.py | ✓ | - | - | ✓ |
| metrics_viewer.py | ✓ | ✓ | - | ✓ |

### Implementation Statistics

- **Total Tools:** 22/22 (100%)
- **Total Python Code:** ~400KB (~10,300 lines)
- **Browser Scripts Generated:** 10 runtime tools
- **Implementation Time:** ~4 hours
- **Test Configurations:** 7 (VFX tests, LOD tuning, cascade)

**Breakdown by Phase:**
| Phase | Tools | Size | Browser Scripts |
|-------|-------|------|-----------------|
| Phase 1: Core Analysis | 5 | ~110KB | 0 |
| Phase 2: Testing & Quality | 5 | ~101KB | 4 |
| Phase 3: Optimization | 7 | ~112KB | 2 |
| Phase 4: Quick Utilities | 5 | ~77KB | 4 |
| **TOTAL** | **22** | **~400KB** | **10** |

### Usage Philosophy

Use AI tools to:
- Understand metric dependencies and flows
- Validate documentation matches implementation
- Detect performance bottlenecks and memory leaks
- Test VFX integration without full runtime
- Generate and maintain accurate documentation

Do not use AI tools to:
- Patch code without understanding context
- Replace manual code review
- Automate architectural decisions
- Ignore architectural boundaries
