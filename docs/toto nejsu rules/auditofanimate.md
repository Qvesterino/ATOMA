RAF Ownership Summary

Single authoritative RAF: main.js (lines 7463-7466) schedules AtomaGame.animate() recursively; AtomaGame created at main.js (lines 14090-14091).
Render ownership: FrameScheduler instantiated and registers runRenderTick on visual layer at main.js (lines 2964-2969); renderer.render only called inside runRenderTick (main.js (lines 9443-9510)).
FrameScheduler execution: frameScheduler.tick(deltaTime) invoked once per RAF near end of animate (main.js (lines 9180-9183)), which drives both runVisualOverlayTick and runRenderTick cadence (visual layer target ~30 Hz).
Frame timing sources: frameClock.tick at main.js (lines 7468-7475), delta clamped via clock.getDelta() at main.js (lines 7483-7485) feeds all per-frame work and FrameScheduler.
One-Frame Call Graph
Order | Callsite | Category | Runs at | Notes (why 60/30/10/2)
1 | main.js:7463-7466 | REQUIRED | rAF (~60) | StartFrame validator + schedule next RAF.
2 | main.js:7468-7485 | REQUIRED | rAF | FrameClock tick, delta clamp, time accumulation.
3 | main.js:7487-7512 | REQUIRED | rAF | Camera/player update + polish packs (motion-coupled).
4 | main.js:7514-7530 | REQUIRED | rAF | World stability/shake/pulse enforcement.
5 | main.js:7532-7569 | REQUIRED | rAF | Active world, visual/cinematic upgrades, sigma/quantum nodes, hazards.
6 | main.js:7572-7615 | REQUIRED | rAF (UI sub-steps 10 Hz) | AI nodes update + spawning; node UI/undo throttled to 0.1s; relax metrics 1s.
7 | main.js:7618-7633 | REQUIRED | rAF | Tier-1 link corruption/harmony + SimulationEffectOrchestrator hub via safeTick.
8 | main.js:7634-7720 | CANDIDATE | rAF | Aura modulation, dynamic link colors/quality/degradation/collapse, shell size authority, particle emission scaling/bridges (visual metrics; could run 30 Hz).
9 | main.js:7726-7773 | CANDIDATE | rAF | Synergy visual pulse/time elasticity/resonance/harmonic coupling (interpretive visuals; 30 Hz acceptable).
10 | main.js:7775-7794 | CANDIDATE | rAF | Audio synergy state transitions (stateful, not motion; 30 Hz ok).
11 | main.js:7797-7833 | REQUIRED | rAF (some 1s guards) | Echo trails + material mutation check (1s) + property lock safety every frame.
12 | main.js:7835-7872 | CANDIDATE | rAF (some already throttled) | NodeInspectOverlay, metrics visual FX, world/input/node editor/metrics/personality runtimes (UI/analytics; fits 30/10 Hz).
13 | main.js:7881-7952 | CANDIDATE | rAF | Personality visual pipeline + perf scaler/monitor/transition (mood semantics; 30 Hz).
14 | main.js:7954-8030 | CANDIDATE | rAF | Archetype aura/color/shader mode + link personality/bonus/resonance FX (interpretive visuals; 30 Hz).
15 | main.js:8033-8076 | CANDIDATE | rAF | Resonance feedback, chain reactions, cascade FX bridge (semantic event propagation; 30 Hz).
16 | main.js:8078-8094 | REQUIRED | rAF | Wave interference engine (visual motion field; likely needs frame-rate continuity).
17 | main.js:8100-8170 | REQUIRED | rAF | Pulse/wave gating, boundary interactions, fatigue/specialization (motion-coupled wave pipeline).
18 | main.js:8173-8212 | CANDIDATE | rAF | Wave shader packs/time accumulators (GPU uniform time; 30 Hz workable).
19 | main.js:8215-8314 | CANDIDATE | rAF | Wave particle emitter + cascade emission/color/density (VFX; 30 Hz).
20 | main.js:8317-8346 | CANDIDATE | rAF | Influence attenuation/reflection/standing wave visuals (visual-only; 30 Hz).
21 | main.js:8365-8408 | REQUIRED | rAF | Harmonic healing/audio particles + cascade acceleration + micro/pulse intersections (coupled to current network state).
22 | main.js:8414-8451 | CANDIDATE | rAF | Neural link visuals + personality/world personality/micro-events/mythic rituals (semantics/mood; 30 Hz).
23 | main.js:8453-8474 | CANDIDATE | rAF/5 Hz | Ritual orchestration; mythic glyph scan at 5 Hz + update (already throttled).
24 | main.js:8495-8570 | CANDIDATE | rAF | Glyph systems stack and messaging; procedural meaning engine (semantic visuals; 30 Hz).
25 | main.js:8571-8581 | REQUIRED | rAF | LinkingSystem update + UI refresh (graph state/motion).
26 | main.js:8588-8595 | CANDIDATE | ~3s | LinkCorrelationEngine.tick already slow (non-frame-critical).
27 | main.js:8598-8643 | MIXED | rAF | Hit proxy (interaction-critical → REQUIRED); link priority decay + T2/T4 visual integrations (CANDIDATE 30 Hz).
28 | main.js:8645-8663 | CANDIDATE | rAF | Phase5 multi-network visuals/cascade visuals (visual layer; 30 Hz).
29 | main.js:8666-8696 | CANDIDATE | rAF | Node hierarchy bridge + evolution/legendary systems (progression visuals; 30 Hz).
30 | main.js:8698-8760 | MIXED | rAF | World events/weather/camera FX (camera FX motion-coupled → REQUIRED; rest visual → CANDIDATE 30 Hz).
31 | main.js:8763-8801 | MIXED | rAF | Ambient entities/memory/quantum illusions/colonies/dream depth (visual mood → CANDIDATE 30 Hz); mobility pack update (movement → REQUIRED).
32 | main.js:8803-8882 | CANDIDATE | rAF | Node/link visual packs & moods (pure VFX; 30 Hz).
33 | main.js:8893-8909 | CANDIDATE | rAF | Consciousness layer + poetry engine (semantic; 10-30 Hz).
34 | main.js:8911-8956 | CANDIDATE | rAF | UI 3.1 components (emotional feed, nodeLinking UI) – UI, not motion; 30 Hz.
35 | main.js:8959-8976 | CANDIDATE | rAF | Primary node UI aura/top bar (UI; 30 Hz).
36 | main.js:8979-8992 | REQUIRED | rAF | Node visual freeze + link debug visuals (safety/diagnostic).
37 | main.js:8995-9000 | REQUIRED | rAF | Hard interaction authority safety net.
38 | main.js:9003-9177 | CANDIDATE | rAF | Regional equilibrium/cascading ruptures/topology learning/glyph generation/harmonic cycles/modulators (interpretive world mood; 10-30 Hz).
39 | main.js:9180-9183 | REQUIRED | visual layer (~30) | FrameScheduler.tick executes registered visual-layer functions (including runRenderTick + runVisualOverlayTick).
40 | main.js:9185-9186 | REQUIRED | rAF | updateValidator endFrame bookkeeping.

Hotspots / Suspicious

Render cadence locked to FrameScheduler visual layer (main.js (lines 2964-2969), main.js (lines 9180-9183), main.js (lines 9443-9510)): render runs only when visual accumulator hits 1/30s while rest of animate runs every RAF; ensure 30 Hz is intentional and not starving motion.
Large semantic/mood stacks run every RAF (e.g., personality pipeline main.js (lines 7881-8030), glyph/meaning main.js (lines 8495-8570), regional topology main.js (lines 9003-9177)): mostly interpretive/visual; prime candidates for lower Hz to shed per-frame cost.
UI dual-path: HUD visual overlays are on FrameScheduler (visual layer) via runVisualOverlayTick registration (main.js (lines 2964-2969), invoked via main.js (lines 9180-9183)) while other UI (emotionalFeed/nodeLinking/primary HUD) still run every RAF (main.js (lines 8911-8976)), potentially duplicating UI workload outside scheduler cadence.
Additional rAFs exist but are event/test scoped (e.g., selection pulses in NodeLinkingSystem.js (lines 1031-1067), console/test animators in CorruptionDesaturationIntegrationPatch.js (lines 355-374)); none run continuously alongside main loop.
Next Best 3 Patch Candidates

Personality/meaning/semantic visuals stack (main.js (lines 7881-8030), main.js (lines 8495-8570), main.js (lines 9003-9177)): move to FrameScheduler simulation/background layers (10–30 Hz) since they interpret mood/state rather than drive motion.
Cascade/wave VFX pipeline (main.js (lines 8215-8314) plus wave shader packs main.js (lines 8173-8212)): shift to visual layer scheduling (~30 Hz) to cut per-frame VFX cost without impacting core motion.
UI/metrics runtime updates (main.js (lines 7835-7872), main.js (lines 8911-8976)): align with FrameScheduler.visual cadence to avoid parallel UI paths and reduce DOM work frequency.
