# Link Pictogram Systems — Static Audit
Date: 2026-03-01  
Status: Reference map (static)

## Bootstrap / Orchestration
- `main.js` → `setupLinkGlyphFlow()` — vytvorí LinkGlyphFlow a registruje na FrameScheduler.visual (30 Hz).  
- `main.js` → `setupLinkedGlyphMessaging()` — vytvorí LinkedGlyphMessaging3_0 a registruje na FrameScheduler.visual (30 Hz).  
- `main.js` → `setupRecursiveGlyphMessaging()` — vytvorí RecursiveGlyphMessaging4_0 a registruje na FrameScheduler.visual (30 Hz).  
- `main.js` → `setupRecursiveGlyphSignalSystem()` — vytvorí RecursiveGlyphSignalSystem a registruje na FrameScheduler.visual (30 Hz).  

FrameScheduler cadence: visual layer @ 30 Hz; SystemRegistry položky pre tieto ID sú disable, aby sa nespúšťali dvojmo.

## Creation / Containers
- **LinkGlyphFlow**: `_LinkGlyphFlow.js`; kontajner `LinkGlyphFlow_Packets`; per-link registry, pooled geometries/materials; enabled=true.  
- **LinkedGlyphMessaging3_0**: `_LinkedGlyphMessaging3_0.js`; kontajner `LinkedGlyphMessaging_Messages`; message pool; enabled=true.  
- **RecursiveGlyphMessaging4_0**: `_RecursiveGlyphMessaging4_0.js`; kontajner `RecursiveGlyphMessaging_Chains`; enabled=true.  
- **RecursiveGlyphSignalSystem**: `_RecursiveGlyphSignalSystem.js`; kontajner `RecursiveGlyphSignalSystem_Container`; enabled=true; podporuje `setFrameScheduler()`.  

## Roles (1–2 vety)
- **LinkGlyphFlow** — malé glyph packety (7 tvarov) putujú po linkovej krivke A→B; farba/tvar podľa semantic state; čistý vizuál.  
- **LinkedGlyphMessaging3_0** — mini‑glyph slová/frázy ako „správy“ po linku; nesú stav/kontext uzlov; môžu vyvolať odpoveď.  
- **RecursiveGlyphMessaging4_0** — rekurzívne reťazce významov (loop/branch), world‑level overlay; používa link/node dáta, nie per‑link init.  
- **RecursiveGlyphSignalSystem** — krátke signal glyph pingy (attention/activation); ľahký overlay.  

## Known Dependencies
- Potrebujú: `semanticGlyphAI` (flow/messaging), `linkingSystem` (links), `aiNodes` (node refs).  
- Registrované na FrameScheduler.visual cez `registerVisualGlyphSchedulers()` v `main.js`.  
- Enabled default true; runtime toggles: `toggleLinkGlyphFlow`, `toggleMessaging`, `toggleRecursiveChains`, `toggleRecursiveGlyphSignals`.  

## Integrácia vs LinkRendererConduit
- Neboli vytvorené Conduitom; sú world‑level overlay. Čítajú link curves/metrics, no Conduit materiály nemenia.  
- Ak vizuály chýbajú, skontroluj link IDs/curve anchoring a runtime toggles, nie Conduit.  

## Quick Checks
- Konzola pri štarte: logy pre Link Glyph Flow, Linked Glyph Messaging 3.0, Recursive Glyph Messaging 4.0, Recursive Glyph Signal System.  
- FrameScheduler stats: ID `linkGlyphFlow`, `linkedGlyphMessaging`, `recursiveGlyphMessaging`, `recursiveGlyphSignalSystem` na vrstve `visual`.  
- Scene graph obsahuje vyššie menované kontajnery.  

## Not in scope
- `LinkStateVisualLanguageIntegration.js` ostáva orphan/disabled; nie je súčasťou aktuálneho pictogram stacku.  

---

## Semantic Pictogram Stack (library-based)
- `LinkPictogramLibrary.js`: procedurálne geometrie + material helper pre semantic pictogramy (harmony/corruption/synergy/instability/healing/standing-wave).
- `LinkSemanticPictogramSystem.js`: základný spawner ikon nad linkami; pool ~4/link, driftuje po linku, mapuje link metriky na typ; cadence ~30 Hz (CONFIG.UPDATE_INTERVAL).
- `LinkSemanticPictogramSystem_Enhanced.js`: vrstvy (signal/modulator/memory), parallax/morphing, kontextové flow; tiež ~30 Hz, viac behaviorálnych knobov.
- `LinkSemanticPictogramSystem_WithFusion.js`: wrapper nad Enhanced + `GlyphFusionZoneManager` + `CompositeGlyphGenerator`; pridáva fúziu glyphov pri konvergenciách; forwarduje enable/disable na base.

Orchestration (static):
- Žiadny z týchto štyroch nie je bootstrapovaný v `main.js` ani FrameSchedulerom – aktuálne sú orphan, kým ich explicitne nevytvoríme/nezaregistrujeme.

Roles (1–2 vety):
- **Library** — dodá tvary; sama nerenderuje.  
- **Base System** — pár ikon nad linkom, typ podľa metrík, jednoduchý drift/fade.  
- **Enhanced** — tri vrstvy, morphing, parallax, kontextové spomalenie/oscillácie.  
- **WithFusion** — Enhanced + fusion zóny a kompozitné glyphy pri zhustených uzloch.  

Follow-up:
- Ak ich chceme použiť, treba bootstrap (init + scheduler) a cleanup pri world switch; posúdiť vizuálnu redundanciu s LinkGlyphFlow/LinkedGlyphMessaging.  
