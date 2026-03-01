**Executive Summary**
- Link creation, ownership, and cleanup are centralized in `NodeLinkingSystem.js`; all link groups are added to the scene there and removed there.  
- Runtime visuals are layered inside `LinkRendererConduit` (core rope + pulse + beads/sparks/trails/aura/corruption/healing/directional streaks); most layers update every frame from the NodeLinkingSystem update loop.  
- Metrics feeding visuals: per-link `link.userData.synergy/corruption/quality/load` plus node metrics (for thickness/load, corruption spread) and some global live metrics fallbacks.  
- Authority is multi-layered but routed through a single per-frame call chain; risk comes from many sub‑systems mutating materials in series and several legacy/optional add‑ons (corruption transmission, wave bridges, thickness, trails).  
- Disposal is mostly centralized (NodeLinkingSystem.removeLink → conduit dispose + scene.remove), but orphan risk remains for optional add-ons not registered with the conduit.

---

### Step 1 — Link Creation Map
| Step | File | Function | Responsibility | Attaches to Scene? |
| --- | --- | --- | --- | --- |
| 1 | `NodeLinkingSystem.js` | `createLink()` | Instantiate link object + `link.group`, set userData, register indexes | Yes (`this.scene.add(link.group)`) |
| 2 | `LinkRendererConduit.js` | `registerLink(link)` | Build conduit geometry, materials, child visual layers, set variant locks | No (returns group already under link) |
| 3 | `NodeLinkingSystem.js` | `initializeLinkSynergyColor()` / `initializeParticleSynergyColors()` | Initial color based on metrics | Already attached |
| 4 | `NodeLinkingSystem.js` | `thicknessSystem.registerLinkCurve()` | Thickness visuals setup | Uses existing link group |
| 5 | `NodeLinkingSystem.js` | `flowSystem.registerLinkFlow()` (Animated flow) | Optional flow/particle layer init | Uses existing link group |

---

### Step 2 — Link Visual Layer Map
| Visual Layer | File | Owner System | Per-frame? | Uses deltaTime? | Reads Metrics? |
| --- | --- | --- | --- | --- | --- |
| Conduit rope geometry | `LinkRendererConduit.js` | LinkRendererConduit | Yes | Yes | link positions |
| Pulse ring / energy wave | `LinkRendererConduit.js` (PulseRing, EnergyWave) | Conduit | Yes | Yes | link load/synergy |
| Beads | `LinkBeadSystem.js` via Conduit | Conduit | Yes | Yes | link traffic/synergy (via userData) |
| Sparks | `LinkSparkSystem.js` | Conduit | Yes | Yes | traffic/synergy |
| Trails | `LinkTrailParticleSystem.js` | Conduit | Yes | Yes | traffic/load |
| Aura (shader) | `shaders/LinkAuraShader.js` via Conduit | Conduit | Yes | Yes | link stress/load |
| Directional streaks | `LinkDirectionalStreaks.js` | Conduit | Yes | Yes | synergy/flow |
| Corruption overlay | `LinkCorruptionSpreadAnimator.js`, `LinkCorruptionParticleSystem.js` | Conduit | Yes | Yes | link/user corruption |
| Healing particles | `LinkHealingParticleSystem.js` | Conduit | Yes | Yes | corruption inverse |
| Thickness | `DynamicThicknessSystem` (via NodeLinkingSystem) | Thickness system | Yes | Yes | load / quality |
| Wave / shader bridge | `LinkEnergyWave.js`, `waveShaderBridge` (inside Conduit) | Conduit | Yes | Yes | load/synergy |
| Trails/Beads Debug | `LinkBeadTrailSystem.js` | Conduit | Yes | Yes | traffic |

---

### Step 3 — Update Authority Map
| System | Update Entry | File | Frequency | Scheduler Controlled? |
| --- | --- | --- | --- | --- |
| NodeLinkingSystem | `update(deltaTime)` | `NodeLinkingSystem.js` | Every frame (main loop) | Yes (FrameScheduler/main.js) |
| LinkRendererConduit | `update(link, dt, time)` called from NodeLinkingSystem | `LinkRendererConduit.js` | Per-link per-frame | Through NodeLinkingSystem |
| ThicknessSystem | `updateLinkThickness()` | `NodeLinkingSystem.js` | Per-frame | Through NodeLinkingSystem |
| Corruption Transmission | `updateTransmission(dt)` | `LinkCorruptionTransmission_v1.js` | Per-frame (if enabled) | Called from NodeLinkingSystem |
| Flow/Emission | `flowSystem.update(link, dt)` | `NodeLinkingSystem.js` | Per-frame | Via NodeLinkingSystem |
| Misc FX (pulses, glows) | `updateLinkAnimations()` / `updateLinkVFXEffects()` | `NodeLinkingSystem.js` | Per-frame | Via NodeLinkingSystem |

Double-update risk: low—single entry point in NodeLinkingSystem; optional debug/rAF snippets exist but are gated.

---

### Step 4 — Metric Dependency Map
| Visual System | Metric Source | Direct Read? | Derived? |
| --- | --- | --- | --- |
| Conduit color/thickness | `link.userData.synergy`, `link.userData.loadPressure/traffic` | Yes | Derived blends |
| Corruption overlay | `link.userData.corruption` | Yes | - |
| Aura / stress visuals | `link.userData.stress/loadPressure` | Yes | Derived from load |
| Beads/Sparks/Trails | `link.userData.synergy`, traffic counts | Yes | Traffic-derived |
| ThicknessSystem | `link.userData.quality`, `metrics.loadPressure` | Yes | Uses load→linewidth |
| Corruption transmission FX | `node.userData.corruption`, `link.userData.corruption` | Yes | infection state |
| Wave/energy bridges | `link.userData.synergy/load` | Yes | Used for shader uniforms |
| Healing particles | `link.userData.corruption` (inverse) | Yes | - |
| HUD bridges (selection) | `link.userData.synergy` | Yes | - |
| Global fallbacks | `__ATOMA_LIVE_METRICS__` (rare) | Yes (HUD) | Derived |

---

### Step 5 — Scene Attachment & Root Map
| Component | Attached By | File | Root Group | Removal Owner |
| --- | --- | --- | --- | --- |
| Link group | `createLink()` | `NodeLinkingSystem.js` | `link.group` added to `scene` | `NodeLinkingSystem.removeLink` |
| Conduit visuals | `registerLink()` | `LinkRendererConduit.js` | Children of `link.group` | `conduitRenderer.disposeLinkVisuals()` via NodeLinkingSystem |
| Beads/Sparks/Trails/Aura/etc. | Conduit during register | `LinkRendererConduit.js` | Under `link.group` | Conduit dispose |
| Thickness data | Thickness system register | `NodeLinkingSystem.js` | Uses existing group | thickness unregister |
| Flow system | Flow register | `NodeLinkingSystem.js` | Under link group | flowSystem.removeLinkFlow |
| Selection/hover glows | NodeLinkingSystem | `NodeLinkingSystem.js` | Added under scene or link group | NodeLinkingSystem.dispose/removeLink |
| Optional FX patches | Various integration files | Mixed | Often under link.group | Mixed; some risk of orphan |

---

### Step 6 — Lifecycle Map
LINK CREATED → `NodeLinkingSystem.createLink` → `link.group` built & attached → visuals registered (`LinkRendererConduit`, thickness, flow) → link indexed → per-frame updates (`updateLinkCurve`, conduit update, flow, thickness, VFX) → metric-driven mutations (synergy/load/corruption) → unlink/remove event → `removeLink` calls flow/thickness unregister + conduit dispose → `scene.remove(link.group)` → `link.group.traverse(dispose)` → link removed from indexes → GC eligible.

Risks:
- Optional integrations (debug snippets, external FX packs) may add children without registering dispose hooks (orphan risk).
- Corruption transmission uses its own per-frame update; if disabled mid-run, residue state may stay in userData.

---

### Step 7 — Visual Lock / Policy Interference Map
| System | Guard Type | Effect | Frame Cost |
| --- | --- | --- | --- |
| `TransparentStateAuthority` (Conduit) | Material flag freeze | Prevents blend/depth changes post-setup | Minimal |
| Variant lock (`freezeMaterialFlags`) | Locks transparency/depth props | Avoids external mutation | Minimal |
| VisualAuthorityGuard (elsewhere) | Guarded writes on core materials | Blocks unauthorized visual edits | Minimal |
| Config flags (`LOCK_LINK_VISUALS`, debug env) | Can skip visual mutation blocks | Branch only |

---

### Step 8 — Link Visual Flow Diagram (text)
LINK CREATION EVENT  
→ `NodeLinkingSystem.createLink()` (build link, add `link.group` to scene, register indexes)  
→ `LinkRendererConduit.registerLink` (conduit geometry, pulse/energy wave, beads, sparks, trails, aura, corruption/healing FX, streaks; variant locks)  
→ Thickness/Flow systems register (linewidth, pulse/flow particles)  
→ Per-frame `NodeLinkingSystem.update`: update link curve positions → conduit `update(link, dt, time)` → thickness update → flow/emission update → corruption transmission update (if enabled) → VFX animations  
→ Metric reads (synergy/load/corruption/quality) drive colors, opacity, thickness, particle rates  
→ Unlink/remove → `removeLink` → flow/thickness unregister → conduit dispose → scene.remove(link.group) → dispose geometries/materials → indexes cleared.

Hot spots:
- Many visual sublayers mutate materials sequentially each frame (ordering sensitivity).
- Corruption transmission writes link/user corruption while visuals also read it.

---

### Step 9 — Architecture Classification
**Classification:** Multi-layered with shared authority (moderate risk).  
Rationale: creation/removal centralized; updates funneled through NodeLinkingSystem, but numerous sub-systems (conduit + thickness + flow + corruption FX) mutate link visuals each frame and rely on shared userData metrics. Variant/material locks mitigate but do not fully eliminate ordering conflicts or orphan risk from optional integrations.

---

No file changes were made.