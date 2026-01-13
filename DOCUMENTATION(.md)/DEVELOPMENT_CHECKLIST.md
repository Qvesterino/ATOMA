# PHASE 3b VISUAL METRICS REFACTOR - DEVELOPMENT CHECKLIST

**Version:** 1.0  
**Status:** READY FOR EXECUTION  
**Target:** Week 1–4 of development  
**Owner:** Senior Engineer (Lucy)  

---

## EXECUTIVE CHECKLIST

- [ ] **Phase 3b Initiated** - Management approval received
- [ ] **Team Setup** - Development environment ready
- [ ] **Baseline Metrics Collected** - Performance before refactor documented
- [ ] **Week 1–4 Completed** - All refactoring done
- [ ] **Testing Suite Passed** - 100% test coverage achieved
- [ ] **Staging Deployment** - Successfully deployed to staging
- [ ] **Production Deployment** - Successfully deployed to production
- [ ] **Post-Launch Monitoring** - Metrics stable, no regressions

---

## WEEK 1: CRITICAL PATH - SYNERGY SYSTEMS

### Day 1: Setup & Planning
- [ ] Create development branch: `phase-3b-vfx-refactor`
- [ ] Set up performance baseline measurement
- [ ] Document current metric sources for all systems
- [ ] Create VFXMetricsValidationSuite.js template
- [ ] Review LinkQualityCalculator API one more time
- [ ] Document scale conversion rules (0–1 ↔ 0–100)

### Day 1–2: ComputeSynergyScore2_0 Wrapper

**File: ComputeSynergyScore2_0.js**

- [ ] Create wrapper function `computeSynergyScore(link)`
- [ ] Read from `link.userData.quality.score`
- [ ] Convert 0–100 to 0–1 range
- [ ] Map quality to tier {low, medium, high, critical}
  - [ ] Quality 0–39 → "low"
  - [ ] Quality 40–64 → "medium"
  - [ ] Quality 65–84 → "high"
  - [ ] Quality 85–100 → "critical"
- [ ] Maintain backward-compatible output format
- [ ] Add console.warn if new quality metric missing
- [ ] Keep old implementation as reference
- [ ] Write unit tests for wrapper
  - [ ] Test all 4 quality tiers
  - [ ] Test edge cases (0, 50, 100)
  - [ ] Test missing quality data (fallback)
  - [ ] Test output format compatibility

### Day 2–3: LinkGlowSynergyEngine Refactor

**File: LinkGlowSynergyEngine1_0.js**

- [ ] Update `getSynergyScore()` function
  - [ ] Remove 5-level fallback chain
  - [ ] Add single source: `link.userData.quality.score`
  - [ ] Normalize to 0–1 range
  - [ ] Add fallback to 0.5 only
- [ ] Update `updateLinkGlow()` method
  - [ ] Read new synergy source
  - [ ] Apply visual mapping (color, intensity, speed)
  - [ ] Test with all 4 quality tiers
- [ ] Test glow transitions
  - [ ] High quality (85+) → bright glow
  - [ ] Stable quality (65–84) → medium glow
  - [ ] Weak quality (40–64) → dim glow
  - [ ] Critical quality (0–39) → red pulsing
- [ ] Verify performance (< 0.2ms per link)
- [ ] Check for console errors/warnings

### Day 3–4: Update All ComputeSynergyScore2_0 Consumers

**Search for and update all modules that use ComputeSynergyScore2_0:**

- [ ] Scan codebase: `grep -r "computeSynergyScore"`
- [ ] List all modules found:
  - [ ] Module 1: _________________________________
  - [ ] Module 2: _________________________________
  - [ ] Module 3: _________________________________
  - [ ] Module 4: _________________________________
- [ ] For each module:
  - [ ] Identify current usage pattern
  - [ ] Convert to LinkQualityCalculator
  - [ ] Test integration
  - [ ] Verify visual output

### Day 4–5: Week 1 Integration Testing

- [ ] Run VFXMetricsValidationSuite.testMetricSources()
- [ ] Run VFXMetricsValidationSuite.testScaleConsistency()
- [ ] Run VFXMetricsValidationSuite.testNoRedundancy()
- [ ] Manual testing: All links displaying correctly
  - [ ] High-quality links bright
  - [ ] Low-quality links dim
  - [ ] Transitions smooth
- [ ] Performance check
  - [ ] Frame rate maintained at 60 FPS
  - [ ] No frame rate drops during metric updates
  - [ ] Memory usage stable
- [ ] Console verification
  - [ ] No errors
  - [ ] No warnings about missing metrics
  - [ ] Info logging working

### Week 1 Completion Criteria
- [ ] ✅ ComputeSynergyScore2_0 fully wrapped
- [ ] ✅ LinkGlowSynergyEngine uses new source
- [ ] ✅ All consumers updated to use new metrics
- [ ] ✅ All tests passing (Week 1 scope)
- [ ] ✅ Visual effects render correctly
- [ ] ✅ Performance maintained
- [ ] ✅ Code review approved
- [ ] ✅ Ready for Week 2

---

## WEEK 2: HIGH PRIORITY - METRICS CALCULATOR & VFX

### Day 1: CoreMetricsCalculator Refactor

**File: CoreMetricsCalculator.js**

- [ ] Create new `aggregateMetrics()` method
  - [ ] Average node quality scores
  - [ ] Average node stability values
  - [ ] Average node harmony values
  - [ ] Average node instability values
  - [ ] Average node corruption values
  - [ ] Average node load ratios (multiply by 100)
- [ ] Remove legacy computation methods:
  - [ ] ~~computeStability()~~
  - [ ] ~~computeHarmony()~~
  - [ ] ~~computeInstability()~~
  - [ ] ~~computeCorruption()~~
  - [ ] ~~computeNetworkLoad()~~
- [ ] Update `update()` to call `aggregateMetrics()`
- [ ] Add quality distribution counting:
  - [ ] Count Prime (quality >= 85)
  - [ ] Count Stable (65 <= quality < 85)
  - [ ] Count Weak (40 <= quality < 65)
  - [ ] Count Critical (quality < 40)
- [ ] Verify output format unchanged
  - [ ] Same property names
  - [ ] Same value ranges
  - [ ] Backward compatible
- [ ] Add safeguards for empty node list
- [ ] Test with various node counts
  - [ ] [ ] 10 nodes
  - [ ] [ ] 100 nodes
  - [ ] [ ] 1000 nodes (stress test)

### Day 1–2: SynergyVFX Systems Update

**Files: SynergyVFX1_0.js, SynergyHighways1_0.js, SynergyHighways2_0.js**

#### SynergyVFX1_0.js
- [ ] Update metric source in `registerLink()`
  - [ ] Read `link.userData.quality.score`
  - [ ] Normalize to 0–1
  - [ ] Remove implicit synergyStrength dependency
- [ ] Update `update()` method
  - [ ] Use new metric source for all links
  - [ ] Verify glow updates correctly
  - [ ] Check trail animation

#### SynergyHighways1_0.js
- [ ] Update visibility threshold
  - [ ] Change from `synergyStrength > 0.7` 
  - [ ] To `linkQuality > 70` (on 0–100 scale)
- [ ] Update thickness mapping
  - [ ] Use normalized quality (0–1)
  - [ ] Apply to ribbon width
- [ ] Test visibility thresholds
  - [ ] High quality links → thick highways
  - [ ] Low quality links → no highways

#### SynergyHighways2_0.js
- [ ] Same changes as SynergyHighways1_0.js
- [ ] [ ] Verify consistency between v1 and v2
- [ ] [ ] Check for any API differences

### Day 2–3: LinkAutomationEngine Update

**File: LinkAutomationEngine1_0.js**

- [ ] Replace `computeSynergyScore()` calls
  - [ ] Old: `synergyData.score > 0.7`
  - [ ] New: `linkQuality > 70`
- [ ] Update link creation logic
  - [ ] Only create links between quality nodes
  - [ ] Threshold: quality > 70 (or configurable)
- [ ] Update link removal logic
  - [ ] Remove links below quality threshold
  - [ ] Threshold: quality < 30 (or configurable)
- [ ] Test link lifecycle
  - [ ] Links created at right quality level
  - [ ] Links removed at right quality level
  - [ ] No flicker (links created/removed repeatedly)

### Day 3–4: Additional VFX Systems

**Other modules that may use synergy metrics:**

- [ ] Search for: `synergyStrength` in all files
- [ ] Search for: `synergyScore` in all files
- [ ] Search for: `synergyTier` in all files
- [ ] Update found modules:
  - [ ] Module: _________________________________ 
    - [ ] Change: _______________________________
    - [ ] Test: _________________________________
  - [ ] Module: _________________________________
    - [ ] Change: _______________________________
    - [ ] Test: _________________________________

### Day 4–5: Week 2 Integration Testing

- [ ] Run VFXMetricsValidationSuite.testMetricSources()
- [ ] Run VFXMetricsValidationSuite.testNoRedundancy()
- [ ] Run VFXMetricsValidationSuite.testPerformance()
- [ ] Manual testing: CoreMetricsCalculator
  - [ ] Displays correct average quality
  - [ ] Distribution counts accurate
  - [ ] Stability/harmony averages reasonable
- [ ] Manual testing: Link automation
  - [ ] Links created between good nodes
  - [ ] Links removed between bad nodes
  - [ ] Network topology reasonable
- [ ] Manual testing: SynergyVFX
  - [ ] Highways visible for good links
  - [ ] Highways invisible for bad links
  - [ ] Visual intensity matches quality

### Week 2 Completion Criteria
- [ ] ✅ CoreMetricsCalculator fully refactored
- [ ] ✅ All SynergyVFX systems updated
- [ ] ✅ LinkAutomationEngine using new metrics
- [ ] ✅ All tests passing (Week 1–2 scope)
- [ ] ✅ Performance maintained/improved
- [ ] ✅ Code review approved
- [ ] ✅ Ready for Week 3

---

## WEEK 3: MEDIUM PRIORITY - DISPLAYS & EVENTS

### Day 1–2: CoreMetricsHUD Update

**File: CoreMetricsHUD.js**

- [ ] Add node quality display section
- [ ] Display average node quality
  - [ ] Calculate from all nodes
  - [ ] Update every frame
  - [ ] Format as percentage
- [ ] Display quality distribution
  - [ ] Show Prime count
  - [ ] Show Stable count
  - [ ] Show Weak count
  - [ ] Show Critical count
- [ ] Add visual indicators
  - [ ] Color code by distribution balance
  - [ ] Show trend (improving/degrading)
- [ ] Update HUD layout
  - [ ] Integrate new node quality section
  - [ ] Keep existing network metrics
  - [ ] Ensure readable layout
- [ ] Test display updates
  - [ ] Updates every frame
  - [ ] No lag
  - [ ] Values reasonable

### Day 2–3: MetricReactiveWorldEvents Verification

**File: MetricReactiveWorldEvents.js**

- [ ] Verify event triggers work with new metrics
  - [ ] Test with new metric values
  - [ ] Check synergy thresholds
  - [ ] Check harmony thresholds
  - [ ] Check instability thresholds
  - [ ] Check corruption thresholds
- [ ] Identify threshold adjustments needed
  - [ ] Compare old metric distribution
  - [ ] Compare new metric distribution
  - [ ] Adjust if significantly different
- [ ] Test all event types
  - [ ] Synergy events (Coherence Wave, Unity Pulse)
  - [ ] Harmony events (Calm Bloom, Ascension)
  - [ ] Instability events (Distortion, Spiral)
  - [ ] Corruption events (Shadow Flicker, Umbra Echo)
  - [ ] Load events (Overlink Glow, Surge)
  - [ ] Temporal events (Cycle/Epoch/Aeon)
- [ ] Visual effects rendering
  - [ ] All effects visible
  - [ ] Timing correct
  - [ ] Intensity appropriate

### Day 3–4: NodePersonality Integration Design

**File: NodePersonality2_0.js**

- [ ] Document personality modifier system
  - [ ] Current: -1 to +1 scale
  - [ ] New: delta to apply to 0–100 metrics
- [ ] Design modifier application
  - [ ] Scale factor: 10 (±1.0 → ±10 points)
  - [ ] Clamp final values to [0, 100]
  - [ ] Test with various modifiers
- [ ] Create `getAdjustedMetrics()` function
- [ ] Test personality integration
  - [ ] High personality harmony → higher stability
  - [ ] Low personality harmony → lower stability
  - [ ] All modifiers working correctly
- [ ] Document for future implementation

### Day 4–5: Week 3 Integration Testing

- [ ] Run VFXMetricsValidationSuite.testColorConsistency()
- [ ] Manual testing: CoreMetricsHUD
  - [ ] Node quality displayed
  - [ ] Distribution counts accurate
  - [ ] Updates smooth
- [ ] Manual testing: MetricReactiveWorldEvents
  - [ ] All event types trigger correctly
  - [ ] Visual effects rendered
  - [ ] Timing/intensity appropriate
- [ ] End-to-end system test
  - [ ] Spawn nodes
  - [ ] Create links
  - [ ] Observe metrics update
  - [ ] Observe VFX respond
  - [ ] Observe events trigger
- [ ] Performance check (full week 1–3 suite)
  - [ ] Average frame time < 2ms metrics
  - [ ] Max frame time < 5ms
  - [ ] 60 FPS maintained

### Week 3 Completion Criteria
- [ ] ✅ CoreMetricsHUD displaying node quality
- [ ] ✅ MetricReactiveWorldEvents verified
- [ ] ✅ NodePersonality integration designed
- [ ] ✅ All tests passing (Week 1–3 scope)
- [ ] ✅ Visual effects working correctly
- [ ] ✅ Performance optimal
- [ ] ✅ Code review approved
- [ ] ✅ Ready for Week 4

---

## WEEK 4: POLISH & OPTIMIZATION

### Day 1–2: Color Palette Unification

**All VFX systems:**

- [ ] Create QUALITY_COLORS constant
  - [ ] Critical (0–39): Red (0xff4444)
  - [ ] Weak (40–64): Orange (0xffaa00)
  - [ ] Stable (65–84): Cyan (0x00ccdd)
  - [ ] Prime (85–100): Green (0x00ff88)
- [ ] Apply to LinkGlowSynergyEngine
  - [ ] Link colors match quality
  - [ ] Smooth transitions
- [ ] Apply to SynergyVFX1_0
  - [ ] Glow colors match quality
  - [ ] Aura colors match quality
- [ ] Apply to SynergyHighways
  - [ ] Highway colors match link quality
- [ ] Apply to MetricReactiveWorldEvents
  - [ ] Event colors match metric thresholds
- [ ] Test color consistency
  - [ ] Same quality → same color across systems
  - [ ] Color scheme readable
  - [ ] Color-blind friendly (optional)

### Day 2–3: Intensity/Brightness Unification

**All visual systems:**

- [ ] Create INTENSITY_CURVE function
  - [ ] Score 0–100 → intensity 0–1
  - [ ] Curve: smooth, responsive
  - [ ] Formula: 1.0 + 0.5 * sin(π * norm - π/2)
- [ ] Apply to link glows
  - [ ] High quality → high intensity
  - [ ] Low quality → low intensity
- [ ] Apply to node auras
  - [ ] High quality → bright aura
  - [ ] Low quality → dim aura
- [ ] Apply to pulse speeds
  - [ ] High quality → fast pulse
  - [ ] Low quality → slow pulse
- [ ] Test intensity consistency
  - [ ] Smooth transitions
  - [ ] Responsive to metric changes
  - [ ] Visually pleasing

### Day 3–4: Performance Optimization

- [ ] Profile current performance
  - [ ] Measure per-component time
  - [ ] Identify bottlenecks
- [ ] Implement metric caching
  - [ ] Cache node quality reads
  - [ ] Cache link quality reads
  - [ ] Invalidate once per frame
- [ ] Optimize aggregation
  - [ ] Batch metric calculations
  - [ ] Minimize object allocations
  - [ ] Reuse temporary arrays
- [ ] Benchmark optimization
  - [ ] Average frame time < 2ms
  - [ ] Max frame time < 5ms
  - [ ] 60 FPS stable
- [ ] Memory profiling
  - [ ] No memory leaks
  - [ ] Garbage collection reasonable
  - [ ] Memory usage stable

### Day 4–5: Final Validation & Documentation

**Automated Testing:**
- [ ] Run full VFXMetricsValidationSuite
  - [ ] testMetricSources() ✅
  - [ ] testScaleConsistency() ✅
  - [ ] testNoRedundancy() ✅
  - [ ] testColorConsistency() ✅
  - [ ] testPerformance() ✅

**Manual Testing:**
- [ ] Spawn 100 nodes
  - [ ] All nodes have metrics ✅
  - [ ] Metrics reasonable ✅
  - [ ] VFX rendering ✅
- [ ] Create 500 links
  - [ ] All links have quality ✅
  - [ ] Colors appropriate ✅
  - [ ] Performance maintained ✅
- [ ] Observe system over 10 minutes
  - [ ] No crashes ✅
  - [ ] No memory leaks ✅
  - [ ] Metrics remain consistent ✅
  - [ ] Frame rate stable ✅

**Documentation:**
- [ ] Update all VFX module headers
  - [ ] Document new metric sources
  - [ ] Update integration examples
- [ ] Create VFXMETRICS_INTEGRATION_GUIDE.md
  - [ ] How to read metrics
  - [ ] Color/intensity mapping
  - [ ] Scale normalization rules
- [ ] Create VFXMETRICS_TROUBLESHOOTING.md
  - [ ] Common issues
  - [ ] Debug procedures
  - [ ] Performance profiling
- [ ] Update README
  - [ ] Phase 3b metrics architecture
  - [ ] Integration changes
  - [ ] Migration notes

**Code Review:**
- [ ] All code reviewed
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Ready for production

### Week 4 Completion Criteria
- [ ] ✅ Color palette unified
- [ ] ✅ Intensity mapping unified
- [ ] ✅ Performance optimized
- [ ] ✅ All tests passing (100% coverage)
- [ ] ✅ Documentation complete
- [ ] ✅ Code review approved
- [ ] ✅ Ready for staging deployment

---

## DEPLOYMENT & POST-LAUNCH

### Pre-Deployment Verification
- [ ] All Week 1–4 items completed
- [ ] Full test suite passing
- [ ] Performance benchmarks met
- [ ] Code review approved
- [ ] Staging tests successful
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full test suite (automated)
- [ ] Run manual testing suite
- [ ] Monitor metrics for 1 hour
- [ ] Check for any issues
- [ ] Approve for production

### Production Deployment
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Monitor metrics closely (first hour)
- [ ] Check for user-reported issues
- [ ] Verify performance optimal
- [ ] Send deployment notification

### Post-Launch Monitoring (First Week)
- [ ] Day 1: Verify all systems working
  - [ ] Metrics computing correctly
  - [ ] VFX rendering normally
  - [ ] No console errors
- [ ] Day 2–3: Stability checks
  - [ ] No regressions reported
  - [ ] Performance stable
  - [ ] Memory usage normal
- [ ] Day 4–7: Extended monitoring
  - [ ] All systems stable
  - [ ] Collect user feedback
  - [ ] Plan Phase 3c enhancements

---

## SUCCESS METRICS

### Technical Metrics
- [ ] ✅ Zero duplicate metric computations
- [ ] ✅ All metrics from single sources only
- [ ] ✅ Scale consistency across all systems
- [ ] ✅ Performance: average < 2ms per frame
- [ ] ✅ Performance: max < 5ms per frame
- [ ] ✅ Frame rate: stable 60 FPS
- [ ] ✅ Memory: no leaks, stable usage

### Quality Metrics
- [ ] ✅ 100% of tests passing
- [ ] ✅ 0% console errors
- [ ] ✅ 0% console warnings (production)
- [ ] ✅ Code review approved
- [ ] ✅ Documentation complete

### Visual Metrics
- [ ] ✅ Color palette unified
- [ ] ✅ Intensity mapping consistent
- [ ] ✅ VFX rendering correctly
- [ ] ✅ Visual feedback responsive
- [ ] ✅ No visual glitches reported

### Business Metrics
- [ ] ✅ No user-facing regressions
- [ ] ✅ Development completed on time
- [ ] ✅ No unplanned delays
- [ ] ✅ Team productivity maintained

---

## NOTES FOR DEVELOPER

### Important Reminders
1. **Always verify metric sources** - Check that you're reading from the new Phase 3 systems
2. **Test scale conversions** - Carefully verify 0–100 ↔ 0–1 conversions
3. **Maintain backward compatibility** - Keep output formats same where possible
4. **Document changes** - Update file headers with new metric sources
5. **Test edge cases** - Empty node lists, missing data, extreme values
6. **Profile performance** - Measure before/after refactor
7. **Commit frequently** - Save work regularly, clear git history

### Common Pitfalls to Avoid
- ❌ Mixing 0–1 and 0–100 scales without conversion
- ❌ Forgetting null safety checks for missing userData
- ❌ Not testing with large node counts
- ❌ Introducing new redundant metric computations
- ❌ Changing visual output unintentionally
- ❌ Performance regressions from inefficient lookups
- ❌ Breaking backward compatibility accidentally

### Debug Hints
- **Metric value looks wrong?** Check if it's being read from the right source
- **Visual effect not updating?** Verify metric source is being updated in update loop
- **Performance slow?** Profile to find bottleneck (likely redundant lookups)
- **Scale mismatch?** Convert explicitly (divide/multiply by 100) with clear comment
- **Color not showing?** Check if using unified color palette

### Helpful Commands
```bash
# Find all uses of a metric
grep -r "synergyScore" src/

# Find all metric source locations
grep -r "userData.metrics" src/

# Profile performance
console: window.game.profileMetrics()

# Validate all metrics
console: window.game.validateMetrics()

# Run test suite
console: new VFXMetricsValidationSuite().runAll()
```

---

## SIGN-OFF

**Checklist Author:** Audit Team  
**Implementation Planner:** Senior Engineer  
**Status:** READY FOR EXECUTION  

**Estimated Effort:** 120 hours (1 engineer)  
**Estimated Timeline:** 4 weeks  
**Risk Level:** Medium  

**GO/NO-GO DECISION:** ✅ **GO**

---

END OF DEVELOPMENT CHECKLIST

For questions or clarifications, refer to:
- VISUAL_METRICS_AUDIT_REPORT.md (analysis)
- VISUAL_SYSTEM_RISK_MATRIX.md (risk assessment)
- REFACTOR_PREPARATION_PLAN.md (detailed implementation)
- VISUAL_METRIC_MAPPING_TABLE.txt (metric cross-reference)
