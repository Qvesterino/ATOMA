# T3-002 — System Initialization Order Documentation

## Mandatory Initialization Dependency Mapping

```
ComputeSynergyScore
 → NodeLinkingSystem
   → LinkQualityFeedback
     → LinkCorruptionTransmission_v1
       → HarmonyStabilizationSystem_v1
```

---

## Initialization Order (Constructor/init() Sequence)

### TIER 1: CORE DATA & NODES (must-init-first)

1. **AINodes.js**
   - Initialized in: `constructor()`
   - Type: Gameplay system (node pool)
   - Hard dependency: Scene, camera
   - Must init before: LinkingSystem, all gameplay systems

2. **NodeLinkingSystem.js**
   - Initialized in: `constructor(scene, camera, renderer, aiNodes)`
   - Type: Core linking system
   - Hard dependency: aiNodes (must exist first)
   - Must init before: ComputeSynergyScore, LinkQualityFeedback, LinkCorruptionTransmission

---

### TIER 2: SYNERGY & LINKING FEEDBACK (depends on linking)

3. **ComputeSynergyScore2_1.js** (wrapper)
   - Initialized in: `constructor(options)`
   - Type: Calculation system (reads link state)
   - Hard dependency: None (stateless calculator)
   - Must init before: LinkQualityFeedback, gameplay systems that consume synergy
   - Note: Wraps ComputeSynergyScore2_0 — must not modify original

4. **LinkQualityFeedbackLoop1_0.js**
   - Initialized in: `constructor(linkingSystem)`
   - Type: Feedback system (reads/tracks links)
   - Hard dependency: NodeLinkingSystem (optional but recommended)
   - Must init before: LinkCorruptionTransmission, HarmonyStabilizationSystem
   - Init location: main.js after NodeLinkingSystem

---

### TIER 3: GAMEPLAY MECHANICS (depends on quality feedback)

5. **LinkCorruptionTransmission_v1.js**
   - Initialized in: `constructor(aiNodes, linkSystem, debugMode)`
   - Type: Gameplay system (active propagation)
   - Hard dependency: aiNodes, linkSystem (NodeLinkingSystem)
   - Must init before: HarmonyStabilizationSystem
   - Init location: main.js, called during init phase
   - Frame update: Yes — `.update(deltaTime)` called per frame

6. **HarmonyStabilizationSystem_v1.js**
   - Initialized in: `constructor(aiNodes, linkSystem, debugMode)`
   - Type: Gameplay system (active healing/stabilization)
   - Hard dependency: aiNodes, linkSystem (NodeLinkingSystem)
   - Must init before: All visual consumers
   - Init location: main.js, called during init phase
   - Frame update: Yes — `.update(deltaTime)` called per frame

---

### TIER 4: VISUAL SYSTEMS (depends on gameplay state)

7. **NodeVisuals4_0.js** (ExtremeNodePack)
   - Initialized in: `constructor(scene)`
   - Type: Visual system (reads node state, applies visuals)
   - Hard dependency: Scene, aiNodes (for node references)
   - Must init before: Renderer setup completion
   - Init location: main.js before render loop
   - Frame update: Yes — `.update(deltaTime)` called per frame

8. **Renderer** (THREE.js WebGLRenderer)
   - Initialized in: Application constructor
   - Type: Graphics output
   - Hard dependency: Canvas, scene, camera
   - Must init after: All visual systems configured
   - Note: Last initialization before animate loop starts

---

## Initialization Dependency Diagram

```
Application Constructor
│
├─ Scene, Camera, Renderer
│
├─ AINodes ✓ (MUST FIRST)
│  │
│  └─ NodeLinkingSystem ✓ (DEPENDS ON AINodes)
│     │
│     ├─ ComputeSynergyScore2_1 (stateless, can go anywhere)
│     ├─ LinkQualityFeedbackLoop1_0 (depends on NodeLinkingSystem)
│     │  │
│     │  ├─ LinkCorruptionTransmission_v1 ✓ (TIER 3)
│     │  └─ HarmonyStabilizationSystem_v1 ✓ (TIER 3)
│     │
│     └─ Visual Systems (depend on above)
│        ├─ NodeVisuals4_0 (ExtremeNodePack)
│        ├─ T2_CorruptionVisualIntegration_v1
│        └─ T2_HarmonyVisualConsumer_v1
│
└─ Renderer ✓ (MUST LAST, after visuals)
```

---

## Hard Constraints (MUST NOT VIOLATE)

| Constraint | Reason |
|-----------|--------|
| AINodes before NodeLinkingSystem | Linking system needs node pool |
| NodeLinkingSystem before ComputeSynergyScore | Synergy reads link state |
| LinkQualityFeedback before LinkCorruptionTransmission | Quality feedback affects transmission rates |
| LinkCorruptionTransmission before HarmonyStabilizationSystem | Corruption must exist to heal |
| HarmonyStabilizationSystem before visual consumers | Visual systems read harmony state |
| All systems before Renderer startup | Renderer must see initialized scene |

---

## Initialization Rules (Enforced)

- **No circular dependencies**: Each system initialized exactly once
- **One-directional flow**: Tier N depends only on Tier N-1 and lower
- **No forward references**: Systems cannot reference uninitialized dependencies
- **Safe fallbacks**: Null checks for optional dependencies (e.g., linkingSystem in LinkQualityFeedback)

---

## Constructor vs. init() Pattern

| System | Constructor | init() | Location |
|--------|-------------|--------|----------|
| ComputeSynergyScore | ✓ Config only | — | main.js |
| NodeLinkingSystem | ✓ Full init | — | constructor |
| LinkQualityFeedback | ✓ Full init | — | constructor |
| LinkCorruptionTransmission | ✓ Full init | — | main.js init() |
| HarmonyStabilizationSystem | ✓ Full init | — | main.js init() |
| NodeVisuals4_0 | ✓ Full init | — | constructor |
| Renderer | ✓ Full init | — | constructor |

---

## Verification Checklist

- [ ] AINodes initialized in constructor before NodeLinkingSystem
- [ ] NodeLinkingSystem initialized with valid aiNodes reference
- [ ] ComputeSynergyScore2_1 instantiated before synergy consumers
- [ ] LinkQualityFeedback has valid linkingSystem reference
- [ ] LinkCorruptionTransmission initialized before HarmonyStabilizationSystem
- [ ] HarmonyStabilizationSystem references both aiNodes and linkSystem
- [ ] NodeVisuals4_0 initialized with valid scene reference
- [ ] Renderer initialized last, after all scene content configured
- [ ] No circular init calls between systems
- [ ] All .update() methods called in frame loop in correct order

---

## Frame Update Order (see T3-003)

All systems listed above also have frame update calls — refer to T3-003 for exact update sequence.

