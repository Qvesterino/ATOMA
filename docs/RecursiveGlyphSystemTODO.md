# Recursive / Link Glyph Systems – TODO (follow-up)

## 1) Visual presence verification
- Capture short video/console log proving LinkGlyphFlow + LinkedGlyphMessaging3_0 packets are visible after world switch.
- Check FrameScheduler stats: confirm IDs `linkGlyphFlow`, `linkedGlyphMessaging`, `recursiveGlyphMessaging`, `recursiveGlyphSignalSystem` registered on layer `visual` (30 Hz) and not double-run in SystemRegistry.

## 2) Enable/disable toggles
- Expose quick debug toggles (window) to flip each system and print current state.
- Verify no other module auto-disables them (search for `setEnabled(false)` calls).

## 3) Cleanup on world switch
- Add dispose/clear for all four systems when world is destroyed/unloaded (containers removed from scene, pools cleared, scheduler unregister).
- Ensure re-init on new world re-registers to FrameScheduler.

## 4) Metrics feed sanity
- Confirm each system reads current metrics/frameState (synergy/harmony/load/corruption/stability) after metrics cache changes.
- If any use legacy `link.traffic` only, update to cached metrics injection point.

## 5) Performance guardrails
- Measure frame cost at 200 links (FrameScheduler visual 30 Hz); add lightweight `debugPerf()` to log last frame time per system.
- Consider optional per-system throttling if spikes appear (config gate).

## 6) Visual alignment with Conduit
- Verify packet paths use anchored link curves (same start/end as Conduit after anchor fix).
- Avoid z-fighting with strands/skin: check renderOrder/material blending; adjust if needed.

## 7) Logging & diagnostics
- On init: single concise console line per system with layer/cadence.
- On failure: warn once if metrics/link arrays missing.

## 8) Documentation update
- Add a short “Glyph Visual Stack” section to PER_FRAME_AUDIT.md or a new README linking the four systems, their cadence, and debug controls.

## 9) Nice-to-have (optional)
- Hook pictogram color palette to category colors for clarity.
- Burst-on-unlink effect for messaging packets (reuse Conduit dissolve if cheap).
