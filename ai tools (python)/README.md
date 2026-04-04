# ATOMA AI Tools - Python Analysis Suite

A complete collection of 22 Python tools for analyzing, validating, testing, optimizing, and monitoring ATOMA's metric system, VFX pipeline, event architecture, and runtime performance.

---

## 📊 Overview

These tools provide comprehensive automated analysis of ATOMA's codebase:

### Core Capabilities
- **Metric Analysis:** Trace flows, validate thresholds, check naming consistency
- **Event System:** Map events, detect orphan/dead handlers, trace runtime flow
- **VFX Analysis:** Track lifecycle, profile performance, detect leaks, generate docs
- **Testing:** Automated integration tests, lifecycle tests, manual event emission
- **Optimization:** LOD tuning, particle budget optimization, dead code removal
- **Monitoring:** Performance snapshots, health checks, metrics visualization

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Dependencies: (none required for basic tools, optional for advanced features)

### Basic Usage

```bash
cd "ai tools (python)"

# Quick status check
python vfx_quick_status.py scan

# Analyze metric flow
python metric_flow_tracer.py scan

# Map semantic events
python semantic_event_mapper.py scan

# Validate documentation
python metric_binding_validator.py validate
```

---

## 📦 All Tools (22/22 Complete)

### Phase 1: Core Analysis (5 tools)
1. ✅ **metric_flow_tracer.py** - Complete metric flow analysis
2. ✅ **semantic_event_mapper.py** - Event system mapping
3. ✅ **vfx_lifecycle_tracker.py** - VFX lifecycle tracking
4. ✅ **vfx_performance_profiler.py** - Performance profiling
5. ✅ **metric_binding_validator.py** - Documentation validation

### Phase 2: Testing & Quality (5 tools)
6. ✅ **vfx_integration_tester.py** - Automated VFX integration tests
7. ✅ **link_lifecycle_tester.py** - Complete link VFX lifecycle testing
8. ✅ **event_flow_tracer.py** - Runtime event flow visualization
9. ✅ **vfx_memory_tracker.py** - Memory leak detection
10. ✅ **vfx_dead_code_detector.py** - Detects unused VFX systems

### Phase 3: Optimization (7 tools)
11. ✅ **metric_threshold_analyzer.py** - Analyzes metric threshold configurations
12. ✅ **lod_tuner.py** - Automatic LOD threshold tuning
13. ✅ **particle_budget_analyzer.py** - Particle pool budget analysis
14. ✅ **vfx_docs_generator.py** - Auto-generates VFX documentation
15. ✅ **metric_naming_consistency.py** - Validates metric naming conventions
16. ✅ **geometry_leak_detector.py** - Three.js geometry/material leak detection
17. ✅ **cascade_emulation.py** - Cascade event emulation

### Phase 4: Quick Utilities (5 tools)
18. ✅ **vfx_quick_status.py** - Fast VFX status overview
19. ✅ **event_emitter.py** - Manual event emission for testing
20. ✅ **performance_snapshot.py** - Quick performance snapshots
21. ✅ **vfx_health_check.py** - VFX system health check
22. ✅ **metrics_viewer.py** - Runtime metrics visualization

**Total:** 22/22 tools (100%) 🎉

---

## 📊 Tool Categories

### Analysis Tools (9)
- metric_flow_tracer.py - Metric flow analysis
- semantic_event_mapper.py - Event system mapping
- metric_threshold_analyzer.py - Threshold analysis
- metric_naming_consistency.py - Naming validation
- vfx_docs_generator.py - Documentation generation
- metric_binding_validator.py - Documentation validation
- vfx_lifecycle_tracker.py - Lifecycle tracking
- vfx_quick_status.py - Quick status overview

### Testing Tools (6)
- vfx_integration_tester.py - Integration tests
- link_lifecycle_tester.py - Lifecycle tests
- event_flow_tracer.py - Event flow testing
- vfx_memory_tracker.py - Memory leak testing
- geometry_leak_detector.py - Geometry leak testing
- event_emitter.py - Manual event testing

### Optimization Tools (4)
- vfx_performance_profiler.py - Performance profiling
- lod_tuner.py - LOD optimization
- particle_budget_analyzer.py - Particle pool optimization
- vfx_dead_code_detector.py - Dead code removal

### Monitoring Tools (3)
- performance_snapshot.py - Performance monitoring
- vfx_health_check.py - Health check
- metrics_viewer.py - Metrics visualization

---

## 🎯 Common Workflows

### Workflow 1: Full System Analysis
```bash
# 1. Quick status
python vfx_quick_status.py scan

# 2. Analyze metric flow
python metric_flow_tracer.py report

# 3. Map events
python semantic_event_mapper.py report

# 4. Track VFX lifecycle
python vfx_lifecycle_tracker.py report

# 5. Profile performance
python vfx_performance_profiler.py report

# 6. Validate documentation
python metric_binding_validator.py report
```

### Workflow 2: Integration Testing
```bash
# 1. Generate integration test scenarios
python vfx_integration_tester.py generate-scenarios

# 2. Generate lifecycle test
python link_lifecycle_tester.py generate-tests

# 3. Generate event emitter
python event_emitter.py generate

# 4. Load tests in browser
# - vfx_integration_test_runner.js
# - link_lifecycle_test.js
# - event_emitter.js

# 5. Run tests
# In browser:
#   await window.runVFXIntegrationTests()
#   await window.runLinkLifecycleTest()
#   window.emitCascadeStart(node, 0.8)
```

### Workflow 3: Performance Optimization
```bash
# 1. Profile performance
python vfx_performance_profiler.py generate-profiler

# 2. Analyze particle budgets
python particle_budget_analyzer.py analyze

# 3. Tune LOD thresholds
python lod_tuner.py generate-tests

# 4. Check for geometry leaks
python geometry_leak_detector.py analyze

# 5. Remove dead code
python vfx_dead_code_detector.py scan
```

### Workflow 4: Memory Management
```bash
# 1. Track memory leaks
python vfx_memory_tracker.py generate-tracker

# 2. Detect geometry leaks
python geometry_leak_detector.py analyze

# 3. Review dead code
python vfx_dead_code_detector.py scan

# 4. Run health check
python vfx_health_check.py generate
```

### Workflow 5: Documentation & Validation
```bash
# 1. Generate VFX docs
python vfx_docs_generator.py generate-docs

# 2. Validate metric naming
python metric_naming_consistency.py scan

# 3. Check metric thresholds
python metric_threshold_analyzer.py analyze

# 4. Validate documentation
python metric_binding_validator.py validate
```

### Workflow 6: Runtime Monitoring
```bash
# 1. Generate monitoring tools
python performance_snapshot.py generate
python vfx_health_check.py generate
python metrics_viewer.py generate

# 2. Load in browser
# - performance_snapshot.js
# - vfx_health_check.js
# - metrics_viewer.js

# 3. Initialize
# In browser:
#   window.initializeMetricsViewer()

# 4. Monitor
#   window.takeSnapshot('Before')
#   window.runVFXHealthCheck()
#   window.printCurrentMetrics()
#   window.takeSnapshot('After')
#   window.printPerformanceSummary()
```

---

## 📊 Output Files

### Python Scripts (22 files)
All in `ai tools (python)/` directory

### Browser Scripts (10 files)
Generated by tools:
- `vfx_integration_test_runner.js` - Integration test runner
- `link_lifecycle_test.js` - Lifecycle test runner
- `event_flow_tracer.js` - Event flow tracer
- `vfx_memory_tracker.js` - Memory tracker
- `lod_tuner.js` - LOD tuner
- `cascade_emulator.js` - Cascade emulator
- `event_emitter.js` - Event emitter
- `performance_snapshot.js` - Performance snapshot tool
- `vfx_health_check.js` - Health check tool
- `metrics_viewer.js` - Metrics viewer

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

### Common Output Locations
- `*_report.html` - HTML reports
- `*_data.json` - JSON exports
- `*_test_runner.js` - Browser test scripts
- `*.js` - Generated browser tools
- `VFX_DOCUMENTATION.md` - Auto-generated VFX docs

---

## 🧪 Browser Runtime API

### Testing APIs
```javascript
// Integration tests
await window.runVFXIntegrationTests()
await window.runLinkLifecycleTest()

// Event emission
window.emitEvent('cascade.start', { sourceNode: node })
window.emitCascadeStart(node, 0.8)
window.emitLinkCreated(link)
window.listAvailableEvents()
window.printEventTimeline()
```

### Performance APIs
```javascript
// Performance profiling
window.__VFX_PERF_API.printReport()

// Performance snapshots
window.takeSnapshot('Test')
window.startMonitoring(1000)
window.stopMonitoring()
window.printPerformanceSummary()
```

### Monitoring APIs
```javascript
// Health check
window.runVFXHealthCheck()
window.exportVFXHealthReport()

// Metrics viewer
window.initializeMetricsViewer()
window.printCurrentMetrics()
window.printAllMetricsStats()
window.exportMetricsData()
```

### Event Flow APIs
```javascript
// Event tracing
window.__EVENT_FLOW_TRACER__.printTimeline()
window.__EVENT_FLOW_TRACER__.detectStorms()
```

### Memory Tracking APIs
```javascript
// Memory tracking
window.__VFX_MEMORY_TRACKER__.startMonitoring()
window.__VFX_MEMORY_TRACKER__.printGrowthReport()
```

---

## 📚 Tool Documentation

### Phase 1: Core Analysis
- **metric_flow_tracer.py** - Traces complete metric flow from source to VFX consumers
- **semantic_event_mapper.py** - Maps semantic events to handlers, detects orphan/dead handlers
- **vfx_lifecycle_tracker.py** - Tracks VFX system activation/deactivation
- **vfx_performance_profiler.py** - Profiles VFX runtime performance
- **metric_binding_validator.py** - Validates metric bindings against documentation

### Phase 2: Testing & Quality
- **vfx_integration_tester.py** - Automated VFX integration tests with 5 scenarios
- **link_lifecycle_tester.py** - Complete link VFX lifecycle testing (8 phases)
- **event_flow_tracer.py** - Runtime event flow visualization with storm detection
- **vfx_memory_tracker.py** - Memory leak detection for VFX systems
- **vfx_dead_code_detector.py** - Detects unused VFX systems and dead code

### Phase 3: Optimization
- **metric_threshold_analyzer.py** - Analyzes metric threshold configurations
- **lod_tuner.py** - Automatic LOD threshold tuning with performance testing
- **particle_budget_analyzer.py** - Particle pool budget analysis and size optimization
- **vfx_docs_generator.py** - Auto-generates VFX documentation from code
- **metric_naming_consistency.py** - Validates metric naming conventions
- **geometry_leak_detector.py** - Three.js geometry/material leak detection
- **cascade_emulation.py** - Cascade event emulation for isolated testing

### Phase 4: Quick Utilities
- **vfx_quick_status.py** - Fast VFX status overview
- **event_emitter.py** - Manual event emission for testing
- **performance_snapshot.py** - Quick performance snapshots
- **vfx_health_check.py** - VFX system health check
- **metrics_viewer.py** - Runtime metrics visualization

---

## 📈 Implementation Statistics

- **Total Tools:** 22/22 (100%)
- **Total Python Code:** ~400KB (~10,300 lines)
- **Browser Scripts Generated:** 10 runtime tools
- **Implementation Time:** ~4 hours
- **Test Configurations:** 7 (VFX tests, LOD tuning, cascade)

### Breakdown by Phase
| Phase | Tools | Size | Browser Scripts |
|-------|-------|------|-----------------|
| Phase 1: Core Analysis | 5 | ~110KB | 0 |
| Phase 2: Testing & Quality | 5 | ~101KB | 4 |
| Phase 3: Optimization | 7 | ~112KB | 2 |
| Phase 4: Quick Utilities | 5 | ~77KB | 4 |
| **TOTAL** | **22** | **~400KB** | **10** |

---

## 📧 Support

For issues or questions about these tools:
1. Check this README first
2. Review tool-specific help: `python tool.py --help`
3. Check output logs for error messages
4. Consult ATOMA documentation in `docs/` folder
5. Review Phase implementation summaries for detailed information

---

**Last Updated:** 2026-04-04
**Version:** Complete (22/22 tools - 100%) 🎉
