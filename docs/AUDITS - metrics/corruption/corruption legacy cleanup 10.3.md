SECTION 1 — ACTIVE FILES
- None of the listed legacy corruption modules are currently imported, instantiated, or scheduled. No active usages found.

SECTION 2 — PARTIAL FILES
- None identified for these specific files.

SECTION 3 — SAFE TO REMOVE (LEGACY / UNUSED)
- CorruptionVisualFX_v1.js — not imported anywhere; no instantiation; no scheduler hook.
- CorruptionDesaturationIntegrationPatch.js — only imports CorruptionDrivenAuraDesaturationSystem; not imported or instantiated elsewhere.
- CorruptionDrivenAuraDesaturationSystem.js (LEGACY/aura) — only referenced inside the integration patch; no runtime imports.
- NodeCorruptionAuraDegradation.js (LEGACY/aura) — only referenced by legacy NodeAuraSystem_v1; NodeAuraSystem_v1 not imported in current runtime.
- LinkCorruptionTransmissionIntegrationPatch_v1.js — integration helper; not imported in runtime code (only in example files).

All five are unused in the current runtime and can be considered SAFE TO REMOVE (or left archived).


---
ATOMA — Archive unused corruption visual packs

Goal
Remove unused legacy corruption systems to reduce project surface area.

Files to archive


CorruptionDesaturationIntegrationPatch.js
CorruptionDrivenAuraDesaturationSystem.js
NodeCorruptionAuraDegradation.js
LinkCorruptionTransmissionIntegrationPatch_v1.js

---

Action

Move these files to:

/LEGACY/corruption/

Do not delete them.

---

Ensure

No imports remain in runtime code.

---

Result

Cleaner corruption subsystem and smaller code surface.