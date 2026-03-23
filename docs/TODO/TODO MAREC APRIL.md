1. Critical 3rd wave writers (bez nových súborov)
Doplniť authority write pre:
node.resonance, node.waveField.amplitude, node.waveField.phase,
link.waveDirection, link.waveLength, link.wavePhaseOffset.
DoD: per-frame write pre všetky aktívne node/link entity.

2. Canonical-first read path cleanup
V najdôležitejších VFX moduloch odstrániť legacy-first čítanie.
DoD: všade poradie metrics.* -> legacy mirror -> default.

3. Fallback init hardening
Pri každom canonical passe garantovať neutrál defaulty (0 / 'neutral' / default color).
DoD: žiadne undefined gating pre critical polia.

4. Stamping consistency
Overiť, že všetky nové/používané polia majú userData.__canonicalWriteAt['flat.key'].
DoD: žiadne nested stamp tvary, žiadne missing stampy.

5. World-switch lifecycle check
Potvrdiť rebind po create/switch/dispose pre systémy cascade/rupture/wave.
DoD: po Fractal↔Quantum switch ostáva writer aj reader aktívny.

6. Runtime smoke script (Quantum, 2 links)
Automatizovať test:
switch -> create 2 links -> wait -> check missing/stale + trigger values.
DoD: stabilný PASS/FAIL výstup pre critical set.

7. VFX top-15 verification
Pre 10–15 najdôležitejších efektov potvrdiť:
writer present + reader active + visual trigger observed.
DoD: tabuľka PASS/FAIL + blocker pri FAIL.

8. Audit gate v CI
Pridať lightweight gate na critical fields (missing/stale).
DoD: build varuje/failne pri regressione writer coverage.

9. Legacy drift cleanup
Odstrániť dead/unowned legacy polia alebo ich explicitne mapovať na canonical.
DoD: žiadne „read-only orphan“ metriky v critical ceste.

10. Debug observability
Pridať malý debug panel pre selected node/link:
hodnota + fresh/stale pre critical polia.
DoD: rýchla diagnostika bez grepovania logov.

11. Freeze pass 
Po dosiahnutí stability (0 critical missing/stale na Quantum smoke) zastaviť pridávanie nových metrík.
DoD: iba bugfix/maintenance režim.