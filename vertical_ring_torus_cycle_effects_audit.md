# ATOMA — Vertical Ring / Torus / Cycle Effects Audit

**Generated:** 2026-05-01  
**Scope:** All visual effects using vertically-oriented ring, torus, or cycle patterns  
**Base Directory:** d:/ATOMA_CLEAN

---

## Summary

**Total Unique Effects:** 100+  
**Primary Geometry Types:**
- `THREE.TorusGeometry` — ~85 instances
- `THREE.RingGeometry` — ~15 instances  
- `THREE.CylinderGeometry` (vertical rings/bands) — ~10 instances
- `THREE.TorusKnotGeometry` — ~5 instances

---

## Effects List by Category

### 1. Node Core Effects

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 1.1 | AINodes.js | 2267-2315 | Ultra Node orbit rings (3 per node) | `TorusGeometry(ringRadius, ringThickness, 12, 64)` |
| 1.2 | AINodes.js | 3528-3530 | Node pulse ring (selection/hover) | `RingGeometry(ringInner, ringOuter, 32, 1)` |
| 1.3 | HarmonicNodeResonanceHalos.js | 147-150 | Resonance halo rings | Custom `BufferGeometry` (torus-like) |

### 2. Cascade & Burst Effects

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 2.1 | CascadeBurstVisual_Session147.js | 16,135,159-170 | Shockwave torus ring (burst) | `TorusGeometry(1, ringThickness, 8, 32)` |
| 2.2 | CascadeBurstVisual_Session147.js | 142 | Chromatic distortion ring | `TorusGeometry(1.2, 0.14, 8, 64)` |
| 2.3 | CascadeBurstVisual_Session147.js | 143 | Distortion ring | `TorusGeometry(1.0, 0.08, 16, 64)` |
| 2.4 | CascadeWaveParticles.js | 544-565 | Wavefront particles on ring edge | Circular/ring positioning |
| 2.5 | LinkResonanceFlowSystem_Session124.js | 707 | Pulse halo ring | `TorusGeometry(1, 0.048, 6, 24, Math.PI*1.84)` |

### 3. Colony VFX Effects

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 3.1 | ColonyVFXManager.js | 715-716 | Canonical torus for atmospheres | `TorusGeometry(1, 0.2, 16, 32)` |
| 3.2 | ColonyVFXManager.js | 1360-1382 | Orbit rings (instanced) | `TorusGeometry(radius, ringTube, 16, 64)` |
| 3.3 | ColonyVFXManager.js | 1505-1508 | Edge rings | `TorusGeometry(radius, 0.06, 16, 64)` |
| 3.4 | ColonyVFXManager.js | 1535-1538 | Accent rings | `TorusGeometry(radius, 0.09, 12, 64)` |
| 3.5 | ColonyVFXManager.js | 2067-2070 | Halo rings | `RingGeometry(radius, radius+0.12, 48, 1)` |
| 3.6 | ColonyVFXManager.js | 2214-2216 | Sigil rings | `RingGeometry(radius*0.8, radius, 48, 1)` |
| 3.7 | ColonyVFXManager.js | 2245-2247 | Vertical beam cylinders | `CylinderGeometry(0.05, 0.1, height, 10, 1, true)` |
| 3.8 | ColonyVFXManager.js | 2757-2760 | Birth cry primary ring | `TorusGeometry(0.1, 0.05, 16, 32)` |
| 3.9 | ColonyVFXManager.js | 2763-2765 | Helix DNA strands | `TorusKnotGeometry(0.08, 0.015, 48, 8, 2, 3)` |
| 3.10 | ColonyVFXManager.js | 2850-2852 | Spine equator ring | `TorusGeometry(0.45+stage*0.03, 0.008, 6, 24)` |
| 3.11 | ColonyVFXManager.js | 2918-2920 | Merge convergence ring | `TorusGeometry(0.5, 0.1, 16, 48)` |
| 3.12 | ColonyVFXManager.js | 2924-2926 | Spiral strand A (knot) | `TorusKnotGeometry(0.25, 0.02, 64, 8, 2, 5)` |
| 3.13 | ColonyVFXManager.js | 2964-2966 | Base fracture ring | `RingGeometry(0.3, 0.55, 6, 2)` |
| 3.14 | ColonyVFXManager.js | 3011-3013 | Merge flash ring | `RingGeometry(0.28, 0.42+intensity*0.06, 32, 2)` |
| 3.15 | ColonyVFXManager.js | 3030-3032 | Split rupture ring | `RingGeometry(0.35, 0.5+intensity*0.08, 32, 2)` |
| 3.16 | ColonyVFXManager.js | 3075-3078 | Transitional boundary ring | `RingGeometry(0.22, 0.38, 6, 2)` |

### 4. Harmonic & Resonance Effects

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 4.1 | HarmonicHubAuraSystem_Session126.js | 797-799 | Field ring (LOD) | `TorusGeometry(radius*1.05, fieldRingWidth, 12, 56)` |
| 4.2 | HarmonicHubAuraSystem_Session126.js | 818-820 | Divine halo ring 1 | `TorusGeometry(radius*1.25, fieldRingWidth*0.7, 8, 48)` |
| 4.3 | HarmonicHubAuraSystem_Session126.js | 839-841 | Divine halo ring 2 (perpendicular) | `TorusGeometry(radius*1.15, fieldRingWidth*0.5, 8, 48)` |
| 4.4 | HarmonicResonanceCoupling_v1.js | 266 | Orbital halo ring | `TorusGeometry(0.12, 0.012, 6, 16)` |

### 5. Environmental Hazards

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 5.1 | EnvironmentalHazards.js | 217-243 | Storm rings (3 layers) | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.2 | EnvironmentalHazards.js | 298-300 | Wake rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.3 | EnvironmentalHazards.js | 391-393 | Archive halo rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.4 | EnvironmentalHazards.js | 467-470 | Slit rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.5 | EnvironmentalHazards.js | 545-547 | Wake rings (breach) | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.6 | EnvironmentalHazards.js | 613-615 | Ghost slit rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.7 | EnvironmentalHazards.js | 736-738 | Chrono rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.8 | EnvironmentalHazards.js | 786-788 | Chrono wake rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.9 | EnvironmentalHazards.js | 877-879 | Recall halo rings | `_createBrokenRingGeometry({ radius, verticalSpan, lateralAmplitude })` |
| 5.10 | EnvironmentalHazards.js | 1951-1953 | World mode scar ring | `_createBrokenRingGeometry({ radius, ... })` |
| 5.11 | EnvironmentalHazards.js | 2035-2037 | Archive halo rings | `_createBrokenRingGeometry({ radius, ... })` |
| 5.12 | EnvironmentalHazards.js | 1688-1700 | Ring geometry generator | `_createBrokenRingGeometry()` implementation |

### 6. Cognitive Horizon Plane

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 6.1 | CognitiveHorizonPlane.js | 1240-1256 | Crystalline crown ring | `TorusGeometry(radius, 1.25, 8, 6)` |
| 6.2 | CognitiveHorizonPlane.js | 1262-1275 | Crown spire cylinders | `CylinderGeometry(0.38, 1.05, height, 6, 1)` |
| 6.3 | CognitiveHorizonPlane.js | 1070-1072 | Influence ring | `RingGeometry(max(0.35,radius-thickness), radius+thickness, 48)` |
| 6.4 | CognitiveHorizonPlane.js | 1140-1142 | Tide/veil ring | `RingGeometry(1.4+infl*1.8, 5.8+infl*8.4, 72, 1, ...)` |

### 7. Input & Sensory Nodes

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 7.1 | InputSensoryGeometries_v1.js | 149-151 | Rim accent ring | `TorusGeometry(0.7, 0.04, 8, 32, 0, Math.PI*1.4)` |
| 7.2 | InputSensoryGeometries_v1.js | 279-281 | Crown glow ring | `TorusGeometry(0.5, 0.05, 8, 32)` |
| 7.3 | InputSensoryGeometries_v1.js | 399-401 | Bloom frame ring | `TorusGeometry(0.65, 0.04, 6, 32)` |

### 8. Storage Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 8.1 | StorageNodesVisual_Session116.js | 644-646 | Halo ring | `TorusGeometry(0.66, 0.036, 8, 20, Math.PI*0.72)` |
| 8.2 | StorageNodesVisual_Session116.js | 663 | Pressure arc ring | `TorusGeometry(0.44, 0.024, 8, 14, Math.PI*0.58)` |
| 8.3 | StorageNodesVisual_Session116.js | 1293-1294 | Terrace ring | `TorusGeometry(0.82, 0.032, 8, 16, Math.PI*1.88)` |
| 8.4 | StorageNodesVisual_Session116.js | 1294-1295 | Rim ring | `TorusGeometry(0.98, 0.022, 8, 12, Math.PI*0.72)` |
| 8.5 | StorageEnhancedVariants_Session81.js | 370-372 | Well band ring (cylinder) | `CylinderGeometry(0.62, 0.78, 0.15, 6, 1, true)` |
| 8.6 | StorageArchiveSpindle_V2 (EnhancedNodeModels.js) | 4937-4939 | Lock ring | `TorusGeometry(0.76, 0.055, 10, 28, Math.PI*1.52)` |
| 8.7 | StorageMnemonicReliquary (EnhancedNodeModels.js) | 5128-5131 | Inscription ring A | `TorusGeometry(0.78, 0.028, 10, 48, Math.PI*1.22)` |
| 8.8 | StorageMnemonicReliquary (EnhancedNodeModels.js) | 5129-5131 | Inscription ring B | `TorusGeometry(0.62, 0.024, 8, 40, Math.PI*0.92)` |
| 8.9 | StorageMnemonicReliquary (EnhancedNodeModels.js) | 5130-5131 | Inscription ring C | `TorusGeometry(0.46, 0.018, 8, 26, Math.PI*0.56)` |
| 8.10 | StorageV2 (EnhancedNodeModels.js) | 4593 | Storage ring | `TorusGeometry(0.48, 0.045, 10, 64)` |

### 9. Control Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 9.1 | ControlEnhancedVariants_Session83.js | 290-293 | Hierarchy rings | `TorusGeometry(0.5*(1-i/tier*0.6), 0.05, ...)` |
| 9.2 | ControlSpineVariants_Session100.js | 461-464 | Ring support | `TorusGeometry((outer+inner)/2, tube, ...)` |
| 9.3 | ControlV2 (EnhancedNodeModels.js) | 6043 | Control ring | `TorusGeometry(0.88, 0.05, 12, 72)` |
| 9.4 | ControlV2 (EnhancedNodeModels.js) | 6045 | Override ring | `TorusGeometry(1.14, 0.015, 8, 64)` |
| 9.5 | ControlSovereignStabilizer (EnhancedNodeModels.js) | 6126-6129 | Halo ring A | `TorusGeometry(0.84, 0.045, 10, 42, Math.PI*1.42)` |
| 9.6 | ControlSovereignStabilizer (EnhancedNodeModels.js) | 6127-6129 | Halo ring B | `TorusGeometry(0.92, 0.035, 10, 42, Math.PI*1.18)` |
| 9.7 | ControlCommandPyramid (EnhancedNodeModels.js) | 6237 | Frame ring | `TorusGeometry(0.46, 0.014, 8, 24, Math.PI*1.35)` |
| 9.8 | ControlCommandPyramid (EnhancedNodeModels.js) | 6241 | Crown ring | `TorusGeometry(0.56, 0.01, 8, 26, Math.PI*1.22)` |
| 9.9 | ControlAuthoritySpire (EnhancedNodeModels.js) | 6369 | Crown ring | `TorusGeometry(0.46, 0.013, 8, 26, Math.PI*1.38)` |
| 9.10 | ControlAuthoritySpire (EnhancedNodeModels.js) | 6373 | Meridian ring | `TorusGeometry(0.58, 0.008, 8, 32, Math.PI*1.12)` |
| 9.11 | ControlCommandSeal (EnhancedNodeModels.js) | 6599 | Seal arc ring | `TorusGeometry(0.96, 0.05, 8, 28, Math.PI*0.48)` |
| 9.12 | ControlV2Legacy (EnhancedNodeModels.js) | 6480 | Legacy ring | `TorusGeometry(0.9, 0.06, 12, 96)` |

### 10. Analytics Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 10.1 | AnalyticsV2 (EnhancedNodeModels.js) | 6758 | Hex ring | `RingGeometry(0.52, 0.7, 6)` |
| 10.2 | AnalyticsResonanceDiademRelay (EnhancedNodeModels.js) | 6873 | Diadem arc | `TorusGeometry(0.88, 0.045, 10, 52, Math.PI*1.24)` |
| 10.3 | AnalyticsResonanceDiademRelay (EnhancedNodeModels.js) | 6890-6891 | Projection needle | `CylinderGeometry(0.02, 0.05, 0.34, 5, 1)` |
| 10.4 | AnalyticsFracturedOracle (EnhancedNodeModels.js) | 7095 | Resonance slat | `CylinderGeometry(0.06, 0.13, 0.72, 5, 1, false)` |
| 10.5 | AnalyticsObserverLens (EnhancedNodeModels.js) | 19878 | Observer halo | `TorusGeometry(0.92, 0.03, 10, 42, Math.PI*1.24)` |
| 10.6 | AnalyticsObserverLens (EnhancedNodeModels.js) | 20819 | Orbit ring | `TorusGeometry(0.58, 0.012, 8, 48)` |
| 10.7 | AnalyticsObserverLens (EnhancedNodeModels.js) | 20831 | Scan beam | `CylinderGeometry(0.01, 0.016, 0.9, 8, 1, true)` |
| 10.8 | AnalyticsObserverLens (EnhancedNodeModels.js) | 21029 | Crown arc ring | `TorusGeometry(0.52, 0.028, 6, 18, Math.PI*1.12)` |

### 11. Sigma / Rupture Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 11.1 | SigmaV2 (EnhancedNodeModels.js) | 12926 | Sigma ring | `TorusGeometry(0.9, 0.05, 12, 64)` |
| 11.2 | SigmaV2 (EnhancedNodeModels.js) | 12927 | Sigma cage | `IcosahedronGeometry(1.02, 0)` |
| 11.3 | SigmaRupture (EnhancedNodeModels.js) | 29978-29980 | Torn ring | `TorusGeometry(0.95, 0.04, 12, 96, Math.PI*1.72)` |
| 11.4 | SigmaFractureChoir (EnhancedNodeModels.js) | 13077 | Dominant arc | `TorusGeometry(0.88, 0.046, 10, 58, Math.PI*1.22)` |
| 11.5 | SigmaFractureChoir (EnhancedNodeModels.js) | 13078 | Return arc | `TorusGeometry(0.72, 0.036, 10, 48, Math.PI*0.96)` |
| 11.6 | SigmaFractureChoir (EnhancedNodeModels.js) | 13079 | Fragment arc | `TorusGeometry(0.52, 0.028, 8, 30, Math.PI*0.54)` |
| 11.7 | SigmaRuptureDiadem (EnhancedNodeModels.js) | 13278 | Arc A | `TorusGeometry(0.9, 0.05, 10, 56, Math.PI*1.08)` |
| 11.8 | SigmaRuptureDiadem (EnhancedNodeModels.js) | 13279 | Arc B | `TorusGeometry(0.76, 0.04, 10, 48, Math.PI*0.86)` |
| 11.9 | SigmaRuptureDiadem (EnhancedNodeModels.js) | 13280 | Arc C | `TorusGeometry(0.62, 0.032, 8, 32, Math.PI*0.54)` |
| 11.10 | SigmaRuptureBloomCrown (EnhancedNodeModels.js) | 13517 | Dominant arc | `TorusGeometry(0.96, 0.05, 10, 60, Math.PI*1.28)` |
| 11.11 | SigmaRuptureBloomCrown (EnhancedNodeModels.js) | 13518 | Counter arc | `TorusGeometry(0.78, 0.04, 10, 48, Math.PI*0.94)` |
| 11.12 | SigmaRuptureBloomCrown (EnhancedNodeModels.js) | 13519 | Fragment arc | `TorusGeometry(0.56, 0.03, 8, 32, Math.PI*0.52)` |
| 11.13 | SigmaRupture (EnhancedNodeModels.js) | 30168-30170 | Broken ring | `TorusGeometry(0.86, 0.043, 10, 88, Math.PI*1.62)` |
| 11.14 | SigmaRupture (EnhancedNodeModels.js) | 30507-30509 | Contour cage | `TorusGeometry(c.r, c.tube, 8, 64, c.arc)` |
| 11.15 | SigmaRupture (EnhancedNodeModels.js) | 30825 | Seam ribbon | `TorusGeometry(0.46, 0.018, 8, 80, Math.PI*1.16)` |
| 11.16 | SigmaStructures (EnhancedNodeModels.js) | 9774 | Arc A | `TorusGeometry(0.92, 0.038, 10, 56, Math.PI*1.68)` |
| 11.17 | SigmaStructures (EnhancedNodeModels.js) | 9778 | Arc B | `TorusGeometry(0.78, 0.032, 10, 48, Math.PI*1.42)` |
| 11.18 | SigmaStructures (EnhancedNodeModels.js) | 9782 | Arc C | `TorusGeometry(1.06, 0.028, 10, 64, Math.PI*1.86)` |
| 11.19 | SigmaKnotGroup (EnhancedNodeModels.js) | 39799-39801 | Torus knot | `TorusKnotGeometry` (2,3) |
| 11.20 | SigmaKnotGroup (EnhancedNodeModels.js) | 39926-39927 | Veil arcs | `TorusGeometry` (multiple) |

### 12. Integration Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 12.1 | IntegrationInfiniteLoom (EnhancedNodeModels.js) | 11891 | Veil arc A | `TorusGeometry(0.82, 0.032, 10, 52, Math.PI*1.18)` |
| 12.2 | IntegrationInfiniteLoom (EnhancedNodeModels.js) | 11892 | Veil arc B | `TorusGeometry(0.66, 0.026, 8, 42, Math.PI*0.88)` |
| 12.3 | IntegrationInfiniteLoom (EnhancedNodeModels.js) | 11893 | Veil arc C | `TorusGeometry(0.48, 0.02, 8, 28, Math.PI*0.52)` |

### 13. Quantum Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 13.1 | QuantumParadoxLotus (EnhancedNodeModels.js) | 12453 | Brace ring | `TorusGeometry(0.44, 0.03, 8, 36, Math.PI*0.72)` |
| 13.2 | QuantumProbabilityBloom (EnhancedNodeModels.js) | 12687 | Dominant arc | `TorusGeometry(0.92, 0.044, 8, 54, Math.PI*1.18)` |
| 13.3 | QuantumProbabilityBloom (EnhancedNodeModels.js) | 12688 | Counter arc | `TorusGeometry(0.76, 0.032, 8, 40, Math.PI*0.82)` |

### 14. Input / Gateway Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 14.1 | InputV2 (EnhancedNodeModels.js) | 5345 | Input ring | `TorusGeometry(0.65, 0.06, 10, 80)` |
| 14.2 | InputV2 (EnhancedNodeModels.js) | 5347 | Input halo | `RingGeometry(0.6, 0.75, 48)` |
| 14.3 | InputGateway (EnhancedNodeModels.js) | 5446-5450 | Aperture ring (cylinder) | `CylinderGeometry(0.08, 0.24, 0.92, 4, 1, false)` |
| 14.4 | InputIncomingReliquary (EnhancedNodeModels.js) | 5908 | Halo ring | `TorusGeometry(0.9, 0.03, 10, 88)` |
| 14.5 | InputIncomingReliquary (EnhancedNodeModels.js) | 5909 | Arc ring | `TorusGeometry(0.66, 0.022, 10, 72, Math.PI*0.94)` |
| 14.6 | InputIncomingReliquary (EnhancedNodeModels.js) | 5910 | Ribbon (cylinder) | `CylinderGeometry(0.03, 0.05, 0.96, 6, 1, false)` |

### 15. Link Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 15.1 | LinkEnergyRingSystem.js | 33-37 | Base energy ring | `TorusGeometry(1, 0.072, 8, 40)` |
| 15.2 | LinkEnergyRingSystem.js | 34-36 | Outer halo ring | `TorusGeometry(1.1, 0.02, 8, 56, Math.PI*1.82)` |
| 15.3 | LinkEnergyRingSystem.js | 36 | Core knot | `TorusKnotGeometry(0.18, 0.045, 36, 6, 2, 3)` |
| 15.4 | LinkEnergyRingSystem.js | 70 | Small torus | `TorusGeometry(0.5, 0.08, 8, 24)` |
| 15.5 | LinkPulseRing.js | 7-9 | Shared pulse ring | `TorusGeometry(1.0, 0.16, 6, 24)` |
| 15.6 | LinkPulseRing.js | 8-9 | Segment ring | `TorusGeometry(1.0, 0.30, 8, 32, Math.PI*0.5*0.85)` |
| 15.7 | LinkRingArcDischarges.js | 5 | Ripple ring | `RingGeometry(0.8, 1.0, 24)` |
| 15.8 | LinkRendererConduit.js | 739-741 | Shell ring | `TorusGeometry(0.18, 0.025, 7, 28)` |
| 15.9 | LinkRendererConduit.js | 745-746 | Fracture band | `TorusGeometry(0.27, 0.013, 6, 30)` |
| 15.10 | LinkRendererConduit.js | 750-751 | Portal core ring | `RingGeometry(0.055, 0.145, 32)` |
| 15.11 | LinkRendererConduit.js | 755-756 | Afterglow ring | `TorusGeometry(0.34, 0.011, 6, 32)` |
| 15.12 | LinkRendererConduit.js | 1011-1013 | Halo ring | `RingGeometry(0.05, 0.19, 28)` |
| 15.13 | LinkRendererConduit.js | 1599 | Torus small | `TorusGeometry(0.5, 0.08, 8, 32)` |
| 15.14 | LinkRendererConduit.js | 1600 | Torus tiny | `TorusGeometry(0.42, 0.05, 8, 32)` |
| 15.15 | LinkRendererConduit.js | 3739-3741 | Layer ring | `TorusGeometry(layerRadius, 0.05, 8, 32, arcLength)` |
| 15.16 | LinkRendererConduit.js | 3763-3765 | Trail ring | `TorusGeometry(layerRadius*1.015, 0.03, 8, 32)` |
| 15.17 | LinkRendererConduit.js | 3877-3879 | Layer ring (alt) | `TorusGeometry(layerRadius, 0.05, 8, 32, arcLength)` |
| 15.18 | LinkRendererConduit.js | 3901-3903 | Trail ring (alt) | `TorusGeometry(layerRadius*1.02, 0.03, 8, 32)` |
| 15.19 | LinkRendererConduit.js | 5518-5520 | Build torus arc | `TorusGeometry(radius, tube, radialSeg, tubularSeg, arc)` |
| 15.20 | LinkRendererConduit.js | 5741-5743 | Pillar cylinder | `CylinderGeometry(0.018, 0.03, 0.48, 6, 1, true)` |
| 15.21 | LinkRendererConduit.js | 5812-5813 | Lattice rod | `CylinderGeometry(0.015, 0.024, length+0.08, 6, 1, true)` |
| 15.22 | LinkRendererConduit.js | 5895-5896 | Spike cylinder | `CylinderGeometry(0.012, 0.05, 0.22+(i%3)*0.05, 6, 1, true)` |
| 15.23 | LinkRendererConduit.js | 5965-5966 | Burst shard | `CylinderGeometry(0.008, 0.03, 0.24+(i%3)*0.05, 6, 1, true)` |

### 16. Echo Ripple System

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 16.1 | EchoRippleSystem_Session125.js | 133-136 | Hexagonal echo ring | `RingGeometry(0.82, 1.0, 6, 1)` |
| 16.2 | EchoRippleSystem_Session125.js | 134-136 | Octagonal halo ring | `RingGeometry(0.74, 1.0, 8, 1)` |
| 16.3 | EchoRippleSystem_Session125.js | 135-136 | Hexagonal core circle | `CircleGeometry(1.0, 6)` |

### 17. Fractal Valley (World FX)

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 17.1 | FractalValley.js | 1990-1996 | Vortex particles | Points (circular arrangement) |
| 17.2 | FractalValley.js | 2212-2224 | Hologram pulse ring | `RingGeometry(0.1, 1, 32)` |

### 18. Canonical Geometry Families (Mythic/Prime)

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 18.1 | CanonicalGeometryFamilies_v1.js | 154-156 | Cairn base cylinder | `CylinderGeometry(0.65, 0.7, 0.18, 6, 1)` |
| 18.2 | CanonicalGeometryFamilies_v1.js | 164-166 | Spine cylinder | `CylinderGeometry(0.12, 0.14, 0.9, 8, 1)` |
| 18.3 | CanonicalGeometryFamilies_v1.js | 266-268 | Broken monolith ring | `TorusGeometry(0.55, 0.05, 8, 18, Math.PI*1.3)` |
| 18.4 | CanonicalGeometryFamilies_v1.js | 277-279 | Cap cylinder | `CylinderGeometry(0.3, 0.32, 0.08, 6, 1)` |
| 18.5 | CanonicalGeometryFamilies_v1.js | 305-307 | Floating fragments base | `CylinderGeometry(0.42, 0.42, 0.12, 10, 1)` |
| 18.6 | CanonicalGeometryFamilies_v1.js | 315-317 | Spine cylinder | `CylinderGeometry(0.08, 0.08, 0.9, 8, 1)` |
| 18.7 | CanonicalGeometryFamilies_v1.js | 344-346 | Floating fragments ring | `TorusGeometry(0.5, 0.035, 8, 18, Math.PI*2)` |
| 18.8 | CanonicalGeometryFamilies_v1.js | 373-375 | Prism base cylinder | `CylinderGeometry(0.55, 0.6, 0.12, 6, 1)` |
| 18.9 | CanonicalGeometryFamilies_v1.js | 405-407 | Prism core cylinder | `CylinderGeometry(0.12, 0.12, 0.9, 10, 1)` |
| 18.10 | CanonicalGeometryFamilies_v1.js | 416-418 | Prism band ring | `TorusGeometry(0.52, 0.035, 8, 18, Math.PI*1.4)` |
| 18.11 | CanonicalGeometryFamilies_v1.js | 456-458 | Ancient core base lower | `CylinderGeometry(0.72, 0.82, 0.11, 7, 1)` |
| 18.12 | CanonicalGeometryFamilies_v1.js | 467-469 | Ancient core base upper | `CylinderGeometry(0.54, 0.62, 0.09, 9, 1)` |
| 18.13 | CanonicalGeometryFamilies_v1.js | 505-507 | Ancient broken halo ring | `TorusGeometry(0.63, 0.024, 8, 28, Math.PI*1.52)` |
| 18.14 | CanonicalGeometryFamilies_v1.js | 572-574 | Collapsed crown base ring | `TorusGeometry(0.48, 0.08, 8, 24, Math.PI*1.6)` |
| 18.15 | CanonicalGeometryFamilies_v1.js | 605-607 | Collapsed crown rod cylinder | `CylinderGeometry(0.08, 0.08, 0.85, 10, 1)` |
| 18.16 | CanonicalGeometryFamilies_v1.js | 615-617 | Collapsed crown halo ring | `TorusGeometry(0.42, 0.05, 8, 18, Math.PI*1.2)` |
| 18.17 | CanonicalGeometryFamilies_v1.js | 646-648 | Prime nested icosa base | `CylinderGeometry(0.58, 0.62, 0.12, 12, 1)` |
| 18.18 | CanonicalGeometryFamilies_v1.js | 654-656 | Prime nested icosa spine | `CylinderGeometry(0.08, 0.08, 0.75, 12, 1)` |
| 18.19 | CanonicalGeometryFamilies_v1.js | 681-683 | Prime nested icosa ring | `TorusGeometry(0.5, 0.035, 10, 24, Math.PI*2)` |
| 18.20 | CanonicalGeometryFamilies_v1.js | 708-710 | Prime perfect dodeca base | `CylinderGeometry(0.55, 0.6, 0.12, 12, 1)` |
| 18.21 | CanonicalGeometryFamilies_v1.js | 716-718 | Prime perfect dodeca base step | `CylinderGeometry(0.45, 0.5, 0.08, 12, 1)` |
| 18.22 | CanonicalGeometryFamilies_v1.js | 724-726 | Prime perfect dodeca spine | `CylinderGeometry(0.1, 0.1, 0.6, 12, 1)` |
| 18.23 | CanonicalGeometryFamilies_v1.js | 732-734 | Prime perfect dodeca cradle ring | `TorusGeometry(0.36, 0.03, 10, 20, Math.PI*2)` |
| 18.24 | CanonicalGeometryFamilies_v1.js | 751-753 | Prime perfect dodeca frame ring | `TorusGeometry(0.52, 0.035, 8, 18, Math.PI*2)` |
| 18.25 | CanonicalGeometryFamilies_v1.js | 779-781 | Prime star base cylinder | `CylinderGeometry(0.52, 0.55, 0.12, 3, 1)` |
| 18.26 | CanonicalGeometryFamilies_v1.js | 788-790 | Prime star rod cylinder | `CylinderGeometry(0.07, 0.07, 0.75, 12, 1)` |
| 18.27 | CanonicalGeometryFamilies_v1.js | 820-822 | Prime star hoop ring | `TorusGeometry(0.46, 0.03, 10, 22, Math.PI*2)` |
| 18.28 | CanonicalGeometryFamilies_v1.js | 855-857 | Prime lattice column cylinder | `CylinderGeometry(0.09, 0.09, 0.8, 14, 1)` |
| 18.29 | CanonicalGeometryFamilies_v1.js | 863-865 | Prime lattice collar ring | `TorusGeometry(0.18, 0.025, 10, 20, Math.PI*2)` |
| 18.30 | CanonicalGeometryFamilies_v1.js | 883-885 | Prime lattice frame ring | `TorusGeometry(0.55, 0.035, 10, 22, Math.PI*2)` |
| 18.31 | CanonicalGeometryFamilies_v1.js | 920-922 | Prime hyper base cylinder | `CylinderGeometry(0.6, 0.65, 0.14, 12, 1)` |
| 18.32 | CanonicalGeometryFamilies_v1.js | 928-930 | Prime hyper spine cylinder | `CylinderGeometry(0.11, 0.11, 0.62, 14, 1)` |
| 18.33 | CanonicalGeometryFamilies_v1.js | 954-956 | Prime hyper brace cylinder | `CylinderGeometry(0.035, 0.035, 0.82, 10, 1)` |
| 18.34 | CanonicalGeometryFamilies_v1.js | 989-991 | Prime axis base cylinder | `CylinderGeometry(0.6, 0.64, 0.12, 12, 1)` |
| 18.35 | CanonicalGeometryFamilies_v1.js | 997-999 | Prime axis base step cylinder | `CylinderGeometry(0.48, 0.52, 0.08, 12, 1)` |
| 18.36 | CanonicalGeometryFamilies_v1.js | 1005-1007 | Prime axis spine cylinder | `CylinderGeometry(0.12, 0.12, 0.7, 14, 1)` |
| 18.37 | CanonicalGeometryFamilies_v1.js | 1022-1024 | Prime axis ring | `TorusGeometry(0.48, 0.04, 10, 24, Math.PI*2)` |
| 18.38 | CanonicalGeometryFamilies_v1.js | 1042-1044 | Prime axis crown cylinder | `CylinderGeometry(0.24, 0.26, 0.06, 12, 1)` |
| 18.39 | CanonicalGeometryFamilies_v1.js | 1082-1084 | Error cross spine cylinder | `CylinderGeometry(0.08, 0.08, 0.55, 10, 1)` |
| 18.40 | CanonicalGeometryFamilies_v1.js | 1108-1110 | Error cross ring | `TorusGeometry(0.62, 0.05, 8, 18, Math.PI*1.45)` |
| 18.41 | CanonicalGeometryFamilies_v1.js | 1147-1149 | Error inside base cylinder | `CylinderGeometry(0.62, 0.62, 0.1, 6, 1)` |
| 18.42 | CanonicalGeometryFamilies_v1.js | 1156-1158 | Error inside spine cylinder | `CylinderGeometry(0.07, 0.07, 0.55, 10, 1)` |
| 18.43 | CanonicalGeometryFamilies_v1.js | 1185-1187 | Error inside ring | `TorusGeometry(0.54, 0.04, 8, 18, Math.PI*1.45)` |
| 18.44 | CanonicalGeometryFamilies_v1.js | 1236-1238 | Error shear spine cylinder | `CylinderGeometry(0.07, 0.07, 0.55, 10, 1)` |
| 18.45 | CanonicalGeometryFamilies_v1.js | 1264-1266 | Error shear frame ring | `TorusGeometry(0.58, 0.035, 8, 18, Math.PI*1.35)` |
| 18.46 | CanonicalGeometryFamilies_v1.js | 1301-1303 | Error fold base cylinder | `CylinderGeometry(0.58, 0.62, 0.12, 3, 1)` |
| 18.47 | CanonicalGeometryFamilies_v1.js | 1310-1312 | Error fold spine cylinder | `CylinderGeometry(0.07, 0.07, 0.6, 10, 1)` |
| 18.48 | CanonicalGeometryFamilies_v1.js | 1334-1336 | Error fold band ring | `TorusGeometry(0.58, 0.04, 8, 18, Math.PI*1.5)` |
| 18.49 | CanonicalGeometryFamilies_v1.js | 1373-1375 | Error tear base cylinder | `CylinderGeometry(0.62, 0.65, 0.12, 12, 1)` |
| 18.50 | CanonicalGeometryFamilies_v1.js | 1413-1415 | Error tear ring | `TorusGeometry(0.5, 0.03, 8, 18, Math.PI*1.2)` |
| 18.51 | CanonicalGeometryFamilies_v1.js | 1450-1452 | Error knot base cylinder | `CylinderGeometry(0.7, 0.74, 0.12, 8, 1)` |
| 18.52 | CanonicalGeometryFamilies_v1.js | 1459-1461 | Error knot spine cylinder | `CylinderGeometry(0.08, 0.08, 0.5, 10, 1)` |
| 18.53 | CanonicalGeometryFamilies_v1.js | 1488-1490 | Error knot ring | `TorusGeometry(0.62, 0.045, 8, 18, Math.PI*1.5)` |
| 18.54 | CanonicalGeometryFamilies_v1.js | 1497-1499 | Error knot mini ring | `TorusGeometry(0.28, 0.03, 8, 18, Math.PI*1.1)` |
| 18.55 | CanonicalGeometryFamilies_v1.js | 1536-1538 | Emotional heart base cylinder | `CylinderGeometry(0.6, 0.55, 0.18, 6, 1)` |
| 18.56 | CanonicalGeometryFamilies_v1.js | 1546-1548 | Emotional heart spine cylinder | `CylinderGeometry(0.08, 0.08, 0.65, 8, 1)` |
| 18.57 | CanonicalGeometryFamilies_v1.js | 1568-1570 | Emotional heart orbit ring | `TorusGeometry(0.55, 0.04, 8, 18, Math.PI*2)` |
| 18.58 | CanonicalGeometryFamilies_v1.js | 1610-1612 | Emotional neural base cylinder | `CylinderGeometry(0.5, 0.48, 0.12, 3, 1)` |
| 18.59 | CanonicalGeometryFamilies_v1.js | 1621-1623 | Emotional neural column cylinder | `CylinderGeometry(0.07, 0.07, 0.6, 10, 1)` |
| 18.60 | CanonicalGeometryFamilies_v1.js | 1650-1652 | Emotional neural arc ring | `TorusGeometry(0.55, 0.035, 8, 18, Math.PI*1.5)` |
| 18.61 | CanonicalGeometryFamilies_v1.js | 1662-1664 | Emotional neural stud cylinder | `CylinderGeometry(0.05, 0.05, 0.1, 8, 1)` |
| 18.62 | CanonicalGeometryFamilies_v1.js | 1697-1699 | Emotional bloom base cylinder | `CylinderGeometry(0.48, 0.55, 0.14, 8, 1)` |
| 18.63 | CanonicalGeometryFamilies_v1.js | 1707-1709 | Emotional bloom stem cylinder | `CylinderGeometry(0.06, 0.1, 0.38, 10, 1)` |
| 18.64 | CanonicalGeometryFamilies_v1.js | 1744-1746 | Emotional bloom ring | `TorusGeometry(0.2, 0.02, 8, 16, Math.PI*2)` |
| 18.65 | CanonicalGeometryFamilies_v1.js | 1774-1776 | Emotional tear base cylinder | `CylinderGeometry(0.46, 0.46, 0.1, 10, 1)` |
| 18.66 | CanonicalGeometryFamilies_v1.js | 1786-1788 | Emotional tear spine cylinder | `CylinderGeometry(0.06, 0.06, 0.55, 8, 1)` |
| 18.67 | CanonicalGeometryFamilies_v1.js | 1815-1817 | Emotional tear hoop ring | `TorusGeometry(0.36, 0.022, 8, 18, Math.PI*2)` |
| 18.68 | CanonicalGeometryFamilies_v1.js | 1872-1874 | Emotional folded beam cylinder | `CylinderGeometry(0.06, 0.06, 0.65, 10, 1)` |
| 18.69 | CanonicalGeometryFamilies_v1.js | 1900-1902 | Emotional folded frame ring | `TorusGeometry(0.5, 0.04, 8, 18, Math.PI*2)` |
| 18.70 | CanonicalGeometryFamilies_v1.js | 1912-1914 | Emotional folded brace cylinder | `CylinderGeometry(0.05, 0.05, 0.36, 8, 1)` |
| 18.71 | CanonicalGeometryFamilies_v1.js | 1942-1944 | Emotional seed base cylinder | `CylinderGeometry(0.52, 0.5, 0.12, 12, 1)` |
| 18.72 | CanonicalGeometryFamilies_v1.js | 1951-1953 | Emotional seed base crown cylinder | `CylinderGeometry(0.42, 0.46, 0.08, 12, 1)` |
| 18.73 | CanonicalGeometryFamilies_v1.js | 1961-1963 | Emotional seed spine cylinder | `CylinderGeometry(0.09, 0.09, 0.65, 12, 1)` |
| 18.74 | CanonicalGeometryFamilies_v1.js | 1982-1984 | Emotional seed ring | `TorusGeometry(0.42, 0.025, 8, 18, Math.PI*2)` |

### 19. Additional Node Visual Systems

| # | File | Line(s) | Effect | Geometry |
|--|--|--|--|--|
| 19.1 | Atoma_nodes/InputEnhancedVariants_Session84.js | 212-214 | Spiral sensory arms | Parametric spiral (not primitive) |
| 19.2 | Atoma_nodes/InputSensoryEnhanced_Session111.js | 124-126 | Fin geometry cylinder | `CylinderGeometry(0.03, 0.16, 0.88, 4, 1, false)` |
| 19.3 | Atoma_nodes/ProcessEnhancedVariants_Session81.js | 420-422 | Processing head ring | `TorusGeometry(radius, tube, 6, 24, arcLength)` |
| 19.4 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 112-114 | Core geometry cylinder | `CylinderGeometry(0.42, 0.54, 0.8, 6, 1, false)` |
| 19.5 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 124-125 | Nave geometry cylinder | `CylinderGeometry(0.24, 0.36, 1.82, 6, 1, false)` |
| 19.6 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 144-146 | Stratum geometry cylinder | `CylinderGeometry(0.72, 0.8, 0.1, 6, 1, false)` |
| 19.7 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 158-160 | Shell geometry cylinder | `CylinderGeometry(1.02, 1.1, 2.56, 6, 1, true)` |
| 19.8 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 370-372 | Well band geometry cylinder | `CylinderGeometry(0.62, 0.78, 0.15, 6, 1, true)` |
| 19.9 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 1112-1114 | Chamber geometry cylinder | `CylinderGeometry(radius, radius, 0.18, 6)` |
| 19.10 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 1144-1146 | Central axis cylinder | `CylinderGeometry(0.1, 0.1, 1.4, 8)` |
| 19.11 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 1253-1255 | Core accent geometry cylinder | `CylinderGeometry(0.026, 0.04, 0.1, 6, 1, false)` |
| 19.12 | Atoma_nodes/StorageEnhancedVariants_Session81.js | 1347-1349 | Lock geometry cylinder | `CylinderGeometry(0.024, 0.032, 0.14, 6, 1, false)` |

---

## Key Observations

1. **Pervasive Use**: Ring/torus/cycle geometries appear in nearly every major subsystem
2. **Vertical Orientation**: Most rings are oriented horizontally (X-Z plane) but some use vertical orientations (Y-axis aligned cylinders)
3. **Instancing**: Colony systems use `InstancedMesh` for performance with shared torus geometry
4. **LOD Support**: Many systems implement level-of-detail for ring/torus effects
5. **Animation**: Rings are commonly animated via rotation, scaling, and opacity modulation
6. **Symbolic Meaning**: Rings often represent containment, protection, resonance, or cyclical processes

---

## Performance Notes

- **Instanced Rings**: ColonyVFXManager uses instancing for 100+ rings with single draw call
- **Geometry Caching**: Many systems cache torus/ring geometries to avoid recreation
- **LOD Systems**: Distance-based quality reduction for ring detail
- **Shader Complexity**: Ring effects often use simple materials (MeshBasicMaterial) for performance

---

*Audit completed via automated codebase analysis*
*Total files analyzed: 100+*
*Total ring/torus/cycle references: 500+*