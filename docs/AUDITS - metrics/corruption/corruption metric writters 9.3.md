Corruption metric writers (project‑wide, code files only)

Canonical writer
- `LinkCorruptionTransmission_v1.js`  
  - `updateLinkVisualsForLevel()` line ~2965: `link.userData.corruptionLevel = level` (also sets visual tint).  
  - `setLinkCorruption(link, level)` line ~3252 (and its dev API at ~3790) feeds the above; this is the only runtime writer of link corruption state in the active pipeline.

Additional writers (runtime)
- `HarmonyStabilizationSystem_v1.js`  
  - `applyHealPulse()` line ~221, `stabilizeNode()` line ~466, `resetCorruption()` line ~483, zone/pulse helpers lines ~562, ~751, ~1051: write `node.userData.corruption` (healing/cleanup).
- `PHASE5_CorruptionBridge_v1.js`  
  - `applyCorruptionToNetwork()` lines ~230, ~252: add/subtract `node.userData.corruption` during inter‑network transfer.
- `PHASE5_NetworkSynchronization_v1.js`  
  - `resolveMetricConflict()` line ~303: clamps `node.userData.corruption` to [0,1] when syncing networks.
- `NodeLinkingSystem.js`  
  - `_applyCorruptionToNode()` line ~5760: writes `child.userData.corruptionLevel` on node submeshes (visual state only).
- `LinkCorruptionTransmission_v1.js`  
  - Same canonical system also marks `link.userData.corruptionVisualState` and `link.userData.visualIntensity` (visual bookkeeping) plus sets `targetNode.userData.corruptionSurgeTime` (line ~2246) during cascade events.

Debug / demo / legacy writers
- `EXAMPLES/*` (e.g., `LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js` lines ~298, 382–408; `HARMONY_STABILIZATION_v1_EXAMPLES.js` lines ~62, 420): manually poke `link.userData.corruptionLevel` or `node.userData.corruption` for demos.
- `T4004_HARMONY_HEALING_TEST_RUNNER.js` lines ~157–174, 365: sets node/link corruption for tests.
- `docs/AUDITS` snippets (non-runtime) plus archived “METRIC_AUTHORIRY_VISUAL_COMPOSER” markdown set corruption for illustration.
- `CorruptionVisualFX_v1.js` / `CorruptionVisualIntegrationPatch_v1.js`: clamp and write `node.userData.gameplay.corruptionLevel` inside a visual-only FX bridge (legacy visual adapter).

Metric property variants observed
- Link: `link.userData.corruptionLevel` (canonical), occasional `link.userData.corruption` in examples.  
- Node: `node.userData.corruption` (gameplay), `node.userData.gameplay.corruptionLevel` (legacy visual FX), `child.userData.corruptionLevel` (visual deformation).  
- No active writer to `link.corruption`/`link.corruptionLevel` top-level fields.

Potential conflicts / duplicates
- Link corruption has a single active writer (LinkCorruptionTransmission_v1); other link writes are demo/test only → no runtime conflict.
- Node corruption is written by multiple gameplay systems (HarmonyStabilization, Phase5 CorruptionBridge, Phase5 NetworkSynchronization); they all target `node.userData.corruption`, so ordering/priority could conflict if run concurrently.
- Visual adapter `_applyCorruptionToNode` uses `child.userData.corruptionLevel` (visual only) and doesn’t affect the canonical node metric but shares the “corruptionLevel” name, which can be confused with link metric if read generically.

Architecture map (current)
node.corruption (written by HarmonyStabilization / Phase5 bridge/sync)
   ↓ (feeds)
LinkCorruptionTransmission_v1 (canonical link corruption writer)
   ↓
link.userData.corruptionLevel
   ↓
Corruption visuals (SpreadAnimator, ParticleSystem, visual tint) reading the link metric

Summary
1️⃣ Canonical corruption writer: LinkCorruptionTransmission_v1 (`setLinkCorruption` → `link.userData.corruptionLevel`).  
2️⃣ Additional writers: HarmonyStabilizationSystem_v1; PHASE5_CorruptionBridge_v1; PHASE5_NetworkSynchronization_v1; visual `_applyCorruptionToNode` (node child meshes); demo/test scripts.  
3️⃣ Property variants: link.userData.corruptionLevel (canonical), link.userData.corruption (demo); node.userData.corruption (gameplay), node.userData.gameplay.corruptionLevel (legacy visual), child.userData.corruptionLevel (visual).  
4️⃣ Conflicts: only node-side has multiple writers; link-side is single-source. Ensure consumers read `link.userData.corruptionLevel` as the authoritative link metric and avoid mixing node visual `corruptionLevel` with link metric.