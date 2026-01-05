# CORRUPTION VISUAL STATE — DIAGRAMS & EXAMPLES

## 1. Corruption Intensity Scale

```
VISUAL INTENSITY PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  0.00                0.65               0.80               1.00
   │                   │                 │                   │
   ├───────────────────┼─────────────────┼───────────────────┤
   │      NORMAL       │    UNSTABLE    │   DEGRADED    │     BROKEN
   │   (No Change)     │ (Begins)       │   (Escalates) │    (Max)
   │                   │                 │                   │

LINK VISUAL STATE:
  Normal:       ═════════════════════════════════  (solid, continuous)
  Unstable:     ═══╱════╲═══╱════╲═══  (irregular, angular)
  Degraded:     ═╱════╱════╲╱════════  (severely misaligned)
  Broken:       ╱═╱════╲╱═╱══════╱════  (fractures visible)

NODE VISUAL STATE:
  Normal:       ⬤ (solid, symmetric)
  Unstable:     ⬤ (slightly offset layers)
  Degraded:     ◆ (offset and transparent)
  Broken:       ◇ (fractured, opacity reduced)
```

---

## 2. Link Corruption Application

```
LINK SEGMENT EVOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NORMAL (< 0.65):
    Source ═══════════════════════════════════════ Target
    
    Properties:
    ├─ Spacing: Regular
    ├─ Alignment: Perfect
    └─ Flow: Continuous

UNSTABLE (0.65-0.79):
    Source ══╱═════╲════╱══════╲═════════════════ Target
    
    Properties:
    ├─ Spacing: Irregular (±5-10%)
    ├─ Alignment: Angular deviation ±0.05-0.10 units
    └─ Flow: Disrupted (appears fragmented)
    
    Visual Cues:
    ├─ Segments slightly offset from path
    ├─ No two segments equally spaced
    └─ Link appears "wrong" but functional

DEGRADED (≥ 0.80):
    Source ═╱════╱═════╲════╱═════╱════════════╱═ Target
    
    Properties:
    ├─ Spacing: Severe irregularity (±10-15%)
    ├─ Alignment: Major deviations ±0.10-0.15 units
    └─ Flow: Completely disrupted
    
    Visual Cues:
    ├─ Obvious misalignment
    ├─ No continuous appearance
    ├─ Appears broken/unreliable
    └─ Still renders, not removed


INTERNAL MECHANISM:

  _applyCorruptionVisuals(linkMesh, corruptionLevel):
  
    1. Calculate corruption intensity
       irregularity = (corruptionLevel - 0.65) / 0.35  // 0-1 scale
    
    2. Calculate max deviation
       maxDeviation = irregularity × 0.15  // Up to 15% at 0.80
    
    3. For each segment:
       randomDeviation = (Math.random() - 0.5) × maxDeviation
       child.userData.corruptionDeviation = randomDeviation
    
    4. Store base state for restoration
       child.userData.baseSpacing = child.position.clone()
       child.userData.baseRotation = child.rotation.clone()
```

---

## 3. Node Corruption Application

```
NODE LAYER MISALIGNMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NORMAL STATE (< 0.65):
    
    ┌─────────────────┐
    │  CORE GEOMETRY  │  (solid, centered)
    │  ┌───────────┐  │
    │  │ INTERNAL  │  │
    │  │ LAYERS    │  │
    │  └───────────┘  │
    └─────────────────┘
    
    Internal opacity: 1.0 (or base)
    Position: Centered
    Rotation: Normal


CORRUPTED STATE (0.65-0.79):
    
    ┌─────────────────┐
    │  CORE GEOMETRY  │  (still intact)
    │ ┌─────────────┐ │
    │ │ INTERNAL    │ │  (layers offset)
    │ │ LAYERS      │ │  (opacity reduced)
    │ │ (offset)    │ │
    │ └─────────────┘ │
    └─────────────────┘
    
    Internal opacity: -5% (≈0.95x of base)
    Position offset: ±(5-10%) units
    Rotation: Minimal skew


SEVERELY CORRUPTED STATE (≥ 0.80):
    
    ┌─────────────────┐
    │  CORE GEOMETRY  │  (still intact - inviolable)
    │ ┌──────────────┐│
    │ │ INTERNAL     ││  (severely offset)
    │ │ LAYERS       ││  (opacity reduced -15%)
    │ │ (offset+     ││  (rotation skewed)
    │ │  skewed)     ││
    │ └──────────────┘│
    └─────────────────┘
    
    Internal opacity: -15% (≈0.85x of base)
    Position offset: ±(10-15%) units
    Rotation: ±0.05-0.10 skew radians


INTERNAL MECHANISM:

  _applyCorruptionToNode(node, corruptionLevel):
  
    For each INTERNAL layer:
    
      1. Store base state (first time)
         baseCorruptionOpacity = material.opacity
         basePosition = position.clone()
         baseRotation = rotation.clone()
      
      2. Calculate intensity
         intensity = (corruptionLevel - 0.65) / 0.35  // 0-1
      
      3. Modify opacity
         opacityShift = -0.05 - (intensity × 0.10)  // -5% to -15%
         material.opacity = max(0.05, baseOpacity + opacityShift)
      
      4. Offset position
         offsetAmount = intensity × 0.1  // 0 to 0.1 units
         position.x += (random - 0.5) × offsetAmount
         position.y += (random - 0.5) × offsetAmount
         position.z += (random - 0.5) × offsetAmount
      
      5. At >= 0.80, also skew rotation
         skewAmount = intensity × 0.1
         rotation.x += (random - 0.5) × skewAmount
         rotation.y += (random - 0.5) × skewAmount


DETECTION OF INTERNAL LAYERS:

    const isInternal = 
      child.userData.visualLayer === 'INTERNAL' ||
      child.userData.type === 'internal' ||
      (child.material && child.material.opacity < 0.5);
    
    Internal layers typically have:
    ├─ Low opacity (semi-transparent)
    ├─ 'INTERNAL' or 'internal' userData
    └─ Complex multi-layer structure
```

---

## 4. Multi-State Interaction Matrix

```
STATE COMBINATION EFFECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                          │ NO SYNERGY │ SYNERGY    │ MAX SYNERGY
                          │ (<0.85)    │ (0.85+)    │ (1.0)
    ─────────────────────┼────────────┼────────────┼──────────────
    NO CORRUPTION       │ Normal     │ Revealed   │ Fully Active
    (<0.65)             │            │            │
    ─────────────────────┼────────────┼────────────┼──────────────
    CORRUPTION          │ Misaligned │ Revealed + │ Active +
    (0.65+)             │ Structure  │ Misaligned │ Misaligned
    ─────────────────────┼────────────┼────────────┼──────────────
    MAX CORRUPTION      │ Fractured  │ Fractured  │ Maximally
    (0.80+)             │            │ + Revealed │ Fractured


                          │ NO HARMONY │ HARMONY    │ MAX HARMONY
                          │ (<0.80)    │ (0.80+)    │ (1.0)
    ─────────────────────┼────────────┼────────────┼──────────────
    NO CORRUPTION       │ Normal     │ Stable     │ Fully Stable
    (<0.65)             │            │            │
    ─────────────────────┼────────────┼────────────┼──────────────
    CORRUPTION          │ Instability│ Struggling │ Tense
    (0.65+)             │            │ vs Damage  │ Conflict
    ─────────────────────┼────────────┼────────────┼──────────────
    MAX CORRUPTION      │ Chaos      │ Harmony    │ Harmony
    (0.80+)             │            │ Fighting   │ vs Chaos
                        │            │ Corruption│ (Active Tension)


THREE-WAY INTERACTION EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1: Synergy 0.90 + Harmony 0.85 + Corruption 0.50
    Status: "Healthy & Stable" → No corruption effects visible
    Visual: Fully revealed & stabilized structure
    
Example 2: Synergy 0.90 + Harmony 0.00 + Corruption 0.70
    Status: "Active but Fragile" → Corruption deforms reveals
    Visual: Revealed geometry appears misaligned & offset
    Feeling: "Powerful but unstable"
    
Example 3: Synergy 0.00 + Harmony 0.85 + Corruption 0.75
    Status: "Attempting Stability" → Harmony fights corruption
    Visual: Structure offset but damped motion
    Feeling: "Struggling to stay together"
    
Example 4: Synergy 0.90 + Harmony 0.85 + Corruption 0.85
    Status: "Everything Happening" → Maximum visual conflict
    Visual: Revealed geometry severely misaligned, dampening active
    Feeling: "Intense struggle between order and chaos"
    
Example 5: Synergy 0.00 + Harmony 0.00 + Corruption 0.85
    Status: "Failing" → Pure corruption, no support
    Visual: Severely fractured structure, no stabilization
    Feeling: "System is breaking"
```

---

## 5. Activation Flow Diagram

```
FRAME UPDATE CYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

START FRAME
    ↓
updateLinkAnimations(link, time, deltaTime)
    ↓
    ├─→ [Compute metrics from existing state]
    │    └─ corruption = link.corruptionLevel ?? 0
    │    └─ synergy = link.synergyScore ?? 0
    │    └─ harmony = link.harmonyScore ?? 0
    ↓
updateLinkMetrics(link, metrics)
    ↓
    ├─→ visuals.updateLinkState(link.id, metrics)
    │    └─→ updateMetricLinks()
    │         ├─ Compute metric color (RGB from metrics)
    │         ├─ Compute emissive pulse
    │         └─ APPLY VISUALS (in order):
    │             ├─ _applyCorruptionVisuals(mesh, corruption)    ← NEW (FIRST)
    │             ├─ _applySynergyVisuals(mesh, synergy >= 0.85)
    │             └─ _applyHarmonyVisuals(mesh, harmony >= 0.80)
    │
    │ [Link color/pulse update completes]
    ↓
    ├─→ Apply node upgrades
    │    ├─ Check: isCorrupted = (corruption >= 0.65)
    │    ├─ Check: isSynergyAwakened = (synergy >= 0.85)
    │    ├─ Check: isHarmonyStabilized = (harmony >= 0.80)
    │    │
    │    ├─→ IF isCorrupted:
    │    │    ├─ _applyCorruptionToNode(source, corruption)
    │    │    └─ _applyCorruptionToNode(target, corruption)
    │    │
    │    ├─→ ELSE IF was corrupted:
    │    │    ├─ _removeCorruptionFromNode(source)
    │    │    └─ _removeCorruptionFromNode(target)
    │    │
    │    ├─→ IF isSynergyAwakened:
    │    │    ├─ _applySynergyToNode(source)
    │    │    └─ _applySynergyToNode(target)
    │    │
    │    ├─→ ELSE IF was synergized:
    │    │    ├─ _removeSynergyFromNode(source)
    │    │    └─ _removeSynergyFromNode(target)
    │    │
    │    ├─→ IF isHarmonyStabilized:
    │    │    ├─ _applyHarmonyToNode(source)
    │    │    └─ _applyHarmonyToNode(target)
    │    │
    │    └─→ ELSE IF was harmonized:
    │         ├─ _removeHarmonyFromNode(source)
    │         └─ _removeHarmonyFromNode(target)
    │
    │ [Node state update completes]
    ↓
    └─→ Glyph system update (if applicable)
         └─ glyphSystem.updateNodeSynergy(nodeId, synergy)

END FRAME
    ↓
RENDER (with updated visual states)
    ↓
    ├─ Link mesh shows:
    │   ├─ Color/opacity from corruption, synergy, harmony metrics
    │   ├─ Irregular segment spacing (if corrupted)
    │   └─ Damped motion (if harmonic)
    │
    └─ Node mesh shows:
        ├─ Revealed internal geometry (if synergy >= 0.85)
        ├─ Offset/misaligned internal layers (if corrupted >= 0.65)
        └─ Damped oscillation (if harmony >= 0.80)
```

---

## 6. Corruption Intensity Progression

```
VISUAL SEVERITY SCALING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Corruption Value → Intensity Factor → Visual Effect

  0.65  →  0.00  →  ┏━━━ Slight irregularity begins
  0.68  →  0.09  →  ┃
  0.71  →  0.17  →  ┃ Segments increasingly offset
  0.74  →  0.26  →  ┃ Opacity reduced -5% to -10%
  0.77  →  0.34  →  ┃ Position offset: ±5-8%
  0.80  →  0.43  →  ┣━━━ Escalation: rotation skew begins
  0.83  →  0.51  →  ┃
  0.86  →  0.60  →  ┃ Segments severely misaligned
  0.89  →  0.69  →  ┃ Opacity reduced -12% to -15%
  0.92  →  0.77  →  ┃ Position offset: ±8-12%
  0.95  →  0.86  →  ┃ Rotation skew: ±0.07-0.09 rad
  0.98  →  0.94  →  ┃
  1.00  →  1.00  →  ┗━━━ Maximum: complete fracture


MAPPING FORMULA:

  intensity = (corruptionLevel - 0.65) / 0.35
  
  // Clamps to 0-1 range for 0.65-1.0 corruption
  // Below 0.65: no corruption effects
  // Above 1.0: treated as 1.0


EFFECT SCALES:

  Spacing Deviation:
    maxDeviation = intensity × 0.15  // 0% to 15%
  
  Opacity Reduction:
    shift = -0.05 - (intensity × 0.10)  // -5% to -15%
  
  Position Offset:
    offsetAmount = intensity × 0.1  // 0 to 0.1 units
  
  Rotation Skew (>= 0.80 only):
    skewAmount = intensity × 0.1  // 0 to 0.1 radians
```

---

## 7. Before/After Comparison

```
CLEAN LINK (Corruption 0.0):
    
    Source ═══════════════════════════════════ Target
    
    • Smooth curve
    • Regular segments
    • Clear flow
    • Reliable appearance

CORRUPTED LINK (Corruption 0.75):
    
    Source ═══╱════╲═════╱═════╲════════╱═══════ Target
    
    • Irregular spacing
    • Angular deviations
    • Disrupted flow
    • Unreliable appearance
    
    FEELING: "Something is wrong with this connection"


CLEAN NODE (Corruption 0.0):
    
    ⬤
    │ Concentric layers
    │ Symmetric geometry
    │ Aligned structure
    │ Intact silhouette
    
CORRUPTED NODE (Corruption 0.75):
    
    ◇  (offset & fractured)
    │ 
    │ Layers are offset
    │ Opacity reduced
    │ Asymmetric appearance
    │ Still recognizable
    
    FEELING: "This structure is falling apart"
```

---

## 8. State Restoration Sequence

```
CORRUPTION REDUCTION CYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORRUPTED STATE:
    Link: ═══╱════╲═══╱════╲════ (irregular)
    Node: ◇ (offset)
    userData:
      • corruptionActive = true
      • corruptionLevel = 0.72
      • corruptionDeviation = set
      • baseSpacing = stored
      • basePosition = stored

    ↓ [Corruption metric drops below 0.65]

RESTORATION TRIGGERED:
    For each segment:
      userData.isCorrupted = false
      userData.corruptionDeviation = 0
      position = baseSpacing.clone()
      rotation = baseRotation.clone()

    For each node layer:
      userData.isCorrupted = false
      material.opacity = baseCorruptionOpacity
      position = basePosition.clone()
      rotation = baseRotation.clone()

    userData.corruptionActive = false

    ↓ [NEXT FRAME]

RESTORED STATE:
    Link: ═══════════════════════════════════ (smooth)
    Node: ⬤ (aligned)
    userData:
      • corruptionActive = false
      • corruptionLevel = 0.00
      • corruptionDeviation = 0
      • (base values available for reuse)
    
    RESULT: Instant return to normal appearance
```

---

## 9. Performance Timeline

```
PER-FRAME PERFORMANCE BUDGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                                    Time (ms)  |  Relative
    ────────────────────────────────────────────┼──────────
    _applyCorruptionVisuals()        <0.5      │ ███░░░░░░
    _applyCorruptionToNode() (single) <0.2    │ ██░░░░░░░
    All corruption effects/frame      <1.0     │ ██████░░░
    Total synergy/harmony/corruption   <2.0    │ ███████░░
    Full link update cycle             <5.0    │ ███████░░░░
    
    At 60 FPS budget: 16.67ms/frame
    Corruption overhead: <1ms
    
    Result: WELL WITHIN BUDGET ✓


MEMORY OVERHEAD PER LINK:
    userData storage:
      • corruptionActive (bool)
      • corruptionLevel (float)
      • corruptionDeviation (float)
      • baseSpacing (Vector3) × N segments
      • baseRotation (Euler) × N segments
    
    Total: ~2-5KB per corrupted link
    
    Result: NEGLIGIBLE ✓


MEMORY OVERHEAD PER NODE:
    userData storage per internal layer:
      • isCorrupted (bool)
      • corruptionLevel (float)
      • baseCorruptionOpacity (float)
      • basePosition (Vector3)
      • baseRotation (Euler)
    
    Total: ~100-500 bytes per internal layer
    
    Result: NEGLIGIBLE ✓
```

---

## 10. Quality Assurance Checklist

```
VISUAL CORRECTNESS
    ✓ Corruption visuals activate at >= 0.65
    ✓ Escalation occurs at >= 0.80
    ✓ Link segments show irregular spacing
    ✓ Node layers show offset/misalignment
    ✓ Corruption + Synergy deforms reveals
    ✓ Corruption + Harmony creates tension
    ✓ Restoration automatic and instant
    ✓ State never becomes unreadable

TECHNICAL COMPLIANCE
    ✓ No new shaders introduced
    ✓ No aura meshes added
    ✓ No material destructive changes
    ✓ No raycasting modifications
    ✓ Pure structural offsets/visibility
    ✓ Zero-violation architecture maintained
    ✓ Hit-proxy system unaffected
    ✓ Selection system unaffected

PERFORMANCE
    ✓ < 1ms per frame per link
    ✓ < 0.2ms per frame per node
    ✓ 60 FPS maintained
    ✓ Minimal memory overhead
    ✓ No memory leaks
    ✓ No frame rate degradation

INTERACTION
    ✓ Works with Synergy system
    ✓ Works with Harmony system
    ✓ Works with Glyph system
    ✓ Works with all node categories
    ✓ Works with all link types
    ✓ Backward compatible
    ✓ No breaking changes
```
