## ATOMA Node Metrics Write Audit

Report date: 2026-02-24 (static, read-only). Scope limited to writes that mutate `node.userData.metrics` or its fields. VisualDerivedMetrics (visualMetrics) is excluded because it no longer writes canonical metrics.

### Search commands (ripgrep)
- `rg -n "userData\\.metrics\\s*=" .` → code hits in SafeMetricsDNAIntegration1_0.js, src/metrics/NodeMetricEngine.js, _MythicNodeCreation.js; remaining hits are docs.
- `rg -n "userData\\.metrics\\." .` → only doc comment references.
- `rg -n "Object\\.assign\\(.*userData\\.metrics" .` and `\\.assign\\(` → no code hits.
- `rg -n "\\.metrics\\s*=\\s*\\{" .` → same set as first command.
- `rg -n "ensureMetrics\\b|initNodeMetrics\\b|attachMetrics\\b|applyMetricCompatibility\\b|relaxNodeMetrics\\b|applyArchetypeClamp\\b" .` → AINodes.js call sites, NodeMetricEngine helpers, MetricsRuntime_v1 relax/equalize, MetricCompatibilityLayer, SafeMetricsDNAIntegration1_0.

### Executive Summary
- Canonical, allowed writers: **SafeMetricsDNAIntegration1_0** (spawn snapshot), **NodeMetricEngine** (init + event impulses), **MetricsRuntime_v1** (fixed 10 Hz relax/equalize).
- High-risk writers now gated: **_MythicNodeCreation.js** metrics overwrite only if `__ALLOW_LEGACY_MYTHIC_METRICS__ === true`.
- Compatibility layer is fill-only; `initNodeMetrics` is allocation-only; `onNodeSpawn` skips DNA nodes. Spawn pipeline now single-writer (DNA first).
- Per-frame writes to `metrics`: **none** found; MetricsRuntime_v1 runs fixed-tick (10 Hz). VisualDerivedMetrics is read-only.

### All metric WRITE sites
| File:Line | Function / Context | Write type | Tick model | Authority | Notes |
| --- | --- | --- | --- | --- | --- |
| SafeMetricsDNAIntegration1_0.js:171-197 | `attachMetrics` | FULL OVERWRITE | SPAWN (once) | CANONICAL | Writes archetype snapshot and replaces `node.userData.metrics` with normalized DNA values. |
| MetricCompatibilityLayer.js:16-48 | `applyMetricCompatibility` | COMPAT FILL / MERGE | SPAWN (AINodes) | SUSPECT | Creates `metrics` if missing, copies legacy fields (synergy/harmony/stability/corruption/loadPressure) and inverse-energy mapping. |
| src/metrics/NodeMetricEngine.js:31-45 | `applyArchetypeClamp` | FIELD MUTATION (clamp) | EVENT/INIT (after each adjust) | CANONICAL | Clamps all metric fields to 0..1 (writes back). |
| src/metrics/NodeMetricEngine.js:48-56 | `ensureMetrics` | COMPAT FILL | INIT/EVENT | CANONICAL | No-op when metrics already exist; allocates defaults only when missing. |
| src/metrics/NodeMetricEngine.js:66-68 | `initNodeMetrics` | COMPAT FILL | SPAWN | CANONICAL | Allocates defaults only if metrics absent. |
| src/metrics/NodeMetricEngine.js:73-80 | `onNodeSpawn` | FIELD MUTATION (clamp only) | SPAWN | CANONICAL | Skips when `_isMetricSnapshot` present; no blending toward defaults. |
| src/metrics/NodeMetricEngine.js:87-107 | `onLinkCreated` | FIELD MUTATION | EVENT (link create) | CANONICAL | Adjusts synergy/harmony/loadPressure/corruption; archetype clamp. |
| src/metrics/NodeMetricEngine.js:115-125 | `onLinkRemoved` | FIELD MUTATION | EVENT (link remove) | CANONICAL | Adjusts synergy/harmony/loadPressure; archetype clamp. |
| src/metrics/NodeMetricEngine.js:132-139 | `onOverload` | FIELD MUTATION | EVENT (overload) | CANONICAL | Adjusts loadPressure/corruption/stability; archetype clamp. |
| MetricsRuntime_v1.js:210-227 | fixed-step relax | FIELD MUTATION | FIXED-TICK (10 Hz) | CANONICAL | Moves metrics toward `archetypeMetrics`; clamps to 0..1. |
| MetricsRuntime_v1.js:230-249 | link equalize | FIELD MUTATION | FIXED-TICK (10 Hz) | CANONICAL | Equalizes synergy/harmony across links (bidirectional). |
| AINodes.js:3750-3771 | spawn pipeline | SPECIAL SPAWN | SPAWN | CANONICAL/SUSPECT | New order: DNA attach (full snapshot), compatibility fill-only, init defaults if missing, onNodeSpawn only for non-DNA nodes. |
| _MythicNodeCreation.js:801-808 | `spawnMythicNode?` block | FULL OVERWRITE | UNKNOWN (manual) | GATED | Metrics overwrite now conditional on `__ALLOW_LEGACY_MYTHIC_METRICS__ === true`; default path skips overwrite. |

### Link VFX metric READ sites (beads/sparks/conduits)
Focus on systems that read node metrics (canonical or derived) for link visuals:

| File | Metrics read | Source field | Frequency | Notes |
| --- | --- | --- | --- | --- |
| ComputeSynergyScore2_1.js | harmonyNorm, stabilityNorm, corruptionNorm, energyNorm | `node.userData.visualMetrics` | Per call (link scoring) | Visual synergy scoring uses visualMetrics; falls back when missing. |
| LinkGlowSynergyEngine_v2.js | harmonyNorm, stabilityNorm, corruptionNorm, energyNorm | `visualMetrics` | Per-frame | Link glow intensity/color. |
| VisualMetricModel_v1.js | Reads `node.userData.metrics` (canonical) to build visualMetrics | canonical→visual | Per-frame | Produces visualMetrics consumed by link VFX/shaders. |
| CoreMetricsViewModel.js | stability/harmony/corruption/loadPressure | visualMetrics | Fixed/refresh | Aggregates for overlays; not gameplay. |
| NeonLinkVisuals.js (and other link visual packs flagged in brightness audit) | synergy/load/harmony (varies) | link.synergy or derived visuals | Per-frame | Mostly uses link-level fields, not node metrics; included for awareness. |
| LinkRendererConduit.js | load/intensity | link data | Per-frame | Uses link traffic; no node metrics. |

### Conflicts & duplicates
- Spawn path now single-writer: DNA snapshot is the only overwrite; compatibility/init/onNodeSpawn are guarded to avoid post-DNA mutation.
- Legacy/manual writer: `_MythicNodeCreation.js` now gated off by default.
- Fixed-tick vs event: MetricsRuntime_v1 equalization + NodeMetricEngine event impulses still both mutate synergy/harmony; acceptable by design but remains dual-writer during runtime.

### Call-path notes (how writes are reached)
- **Spawn path (AINodes.spawnNode)**: DNA attach → compatibility (fill-only) → init defaults if missing → onNodeSpawn only when no DNA snapshot. Line refs: AINodes.js 3750-3771.
- **Link events (NodeLinkingSystem)**: on link create/remove, calls NodeMetricEngine `onLinkCreated` / `onLinkRemoved` (writes metrics). Callers at NodeLinkingSystem.js ~3414, ~3493, ~6001.
- **Overload events**: systems invoking `onOverload` mutate metrics (event-driven).
- **Fixed tick**: `MetricsRuntime_v1.update` runs at 10 Hz; relaxes metrics to archetype and equalizes synergy/harmony across links.
- **Manual/legacy**: `_MythicNodeCreation.js` overwrite gated by `__ALLOW_LEGACY_MYTHIC_METRICS__`.

### Recommended next patch plan (minimal, safe)
1) **Consolidate spawn authority**: Move DNA snapshot first, then apply compatibility only for missing keys, skip default nudging when DNA present; document single writer.
2) **Guard against legacy/manual writes**: Disable or gate `_MythicNodeCreation` metrics assignment behind a feature flag or remove schema-mismatched fields.
3) **Explicit registry of writers**: Add a lightweight assertion/telemetry (non-mutating) to flag new per-frame writes to `userData.metrics`.
4) **Route link VFX to visual layer**: Encourage link visual systems to use `visualMetrics`/snapshots instead of canonical metrics to reduce contention.
