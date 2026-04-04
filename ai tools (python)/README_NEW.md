# ATOMA AI Tools - Python Analysis Suite

A collection of Python tools for analyzing, validating, and optimizing ATOMA's metric system, VFX pipeline, and event architecture.

---

## 📊 Overview

These tools provide automated analysis of ATOMA's codebase to:
- Trace metric flows from source to consumers
- Map semantic events to handlers
- Track VFX system lifecycle and performance
- Validate documentation against implementation
- Identify potential issues and optimization opportunities

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Dependencies: (none required for basic tools, optional for advanced features)

### Basic Usage

```bash
cd "ai tools (python)"

# Analyze metric flow
python metric_flow_tracer.py scan

# Map semantic events
python semantic_event_mapper.py scan

# Track VFX lifecycle
python vfx_lifecycle_tracker.py analyze

# Profile VFX performance
python vfx_performance_profiler.py analyze

# Validate metric bindings
python metric_binding_validator.py validate
```

---

## 📦 Available Tools

### Phase 1: Core Analysis (5 tools)
- ✅ metric_flow_tracer.py - Complete metric flow analysis
- ✅ semantic_event_mapper.py - Event system mapping
- ✅ vfx_lifecycle_tracker.py - VFX lifecycle tracking
- ✅ vfx_performance_profiler.py - Performance profiling
- ✅ metric_binding_validator.py - Documentation validation

### Phase 2: Testing & Quality (5 tools)
- ✅ vfx_integration_tester.py - Automated VFX integration tests
- ✅ link_lifecycle_tester.py - Complete link VFX lifecycle testing
- ✅ event_flow_tracer.py - Runtime event flow visualization
- ✅ vfx_memory_tracker.py - Memory leak detection
- ✅ vfx_dead_code_detector.py - Detects unused VFX systems

### Phase 3: Optimization (7 tools)
- ✅ metric_threshold_analyzer.py - Analyzes metric threshold configurations
- ✅ lod_tuner.py - Automatic LOD threshold tuning
- ✅ particle_budget_analyzer.py - Particle pool budget analysis
- ✅ vfx_docs_generator.py - Auto-generates VFX documentation
- ✅ metric_naming_consistency.py - Validates metric naming conventions
- ✅ geometry_leak_detector.py - Three.js geometry/material leak detection
- ✅ cascade_emulation.py - Cascade event emulation

**Total:** 17/22 tools completed (77%)

---

## 📊 Tool Categories

### Analysis Tools
- metric_flow_tracer.py - Metric flow analysis
- semantic_event_mapper.py - Event system mapping
- metric_threshold_analyzer.py - Threshold analysis
- metric_naming_consistency.py - Naming validation
- vfx_docs_generator.py - Documentation generation

### Testing Tools
- vfx_integration_tester.py - Integration tests
- link_lifecycle_tester.py - Lifecycle tests
- event_flow_tracer.py - Event flow testing
- vfx_memory_tracker.py - Memory leak testing
- geometry_leak_detector.py - Geometry leak testing
- cascade_emulation.py - Cascade event testing

### Optimization Tools
- vfx_performance_profiler.py - Performance profiling
- lod_tuner.py - LOD optimization
- particle_budget_analyzer.py - Particle pool optimization
- vfx_dead_code_detector.py - Dead code removal

### Tracking Tools
- vfx_lifecycle_tracker.py - Lifecycle tracking
- metric_binding_validator.py - Documentation validation

---

## 🎯 Common Workflows

### Workflow 1: Full System Analysis
```bash
# 1. Analyze metric flow
python metric_flow_tracer.py report

# 2. Map events
python semantic_event_mapper.py report

# 3. Track VFX lifecycle
python vfx_lifecycle_tracker.py report

# 4. Profile performance
python vfx_performance_profiler.py report

# 5. Validate documentation
python metric_binding_validator.py report
```

### Workflow 2: Integration Testing
```bash
# 1. Generate integration test scenarios
python vfx_integration_tester.py generate-scenarios

# 2. Generate lifecycle test
python link_lifecycle_tester.py generate-tests

# 3. Load tests in browser
# - vfx_integration_test_runner.js
# - link_lifecycle_test.js

# 4. Run tests
# In browser: await window.runVFXIntegrationTests()
# In browser: await window.runLinkLifecycleTest()
```

### Workflow 3: Performance Optimization
```bash
# 1. Profile performance
python vfx_performance_profiler.py generate-profiler

# 2. Analyze particle budgets
python particle_budget_analyzer.py analyze

# 3. Tune LOD thresholds
python lod_tuner.py generate-tests

# 4. Apply optimizations
```

### Workflow 4: Memory Management
```bash
# 1. Track memory leaks
python vfx_memory_tracker.py generate-tracker

# 2. Detect geometry leaks
python geometry_leak_detector.py analyze

# 3. Review dead code
python vfx_dead_code_detector.py scan

# 4. Clean up
```

### Workflow 5: Documentation Sync
```bash
# 1. Generate VFX docs
python vfx_docs_generator.py generate-docs

# 2. Validate metric naming
python metric_naming_consistency.py scan

# 3. Check metric thresholds
python metric_threshold_analyzer.py analyze

# 4. Sync and validate
```

---

## 📊 Output Files

Tools generate various output files:

| Tool | Text Output | JSON Output | HTML Report | Browser Script |
|------|-------------|-------------|-------------|----------------|
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

**Common output locations:**
- `*_report.html` - HTML reports
- `*_data.json` - JSON exports
- `*_test_runner.js` - Browser test scripts
- `VFX_DOCUMENTATION.md` - Auto-generated docs

---

## 📧 Support

For issues or questions about these tools:
1. Check this README first
2. Review tool-specific help: `python tool.py --help`
3. Check output logs for error messages
4. Consult ATOMA documentation in `docs/` folder

---

**Last Updated:** 2026-04-04
**Version:** Phase 3 Complete (17/22 tools - 77%)
