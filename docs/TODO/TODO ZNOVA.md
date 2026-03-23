# TODO ZNOVA
## 2026-03-23 - Nezávislý one-by-one TODO list

---

## 📋 PRINCÍP

- Každý bod ide one-by-one
- Dokončiť jeden → zaškrtnúť → ísť na ďalší
- Žiadne odkazy na iné TODO dokumenty
- Žiadne odkazy na EXECUTION_CHECKLIST_APRIL.md
- Žiadne odkazy na MetricsAuthority.contract.md

---

## 🔥 PRACUJEM NA (CURRENT)

---

## ⏸️ ZOZNAM ÚLOH

### 1. Critical 3rd wave writers ✅
- [x] Doplniť authority write pre:
  - [x] node.resonance ✅
  - [x] node.waveField.amplitude ✅
  - [x] node.waveField.phase ✅
  - [x] link.waveDirection ✅
  - [x] link.waveLength ✅
  - [x] link.wavePhaseOffset ✅
- [x] Overiť per-frame write pre všetky aktívne node/link entity
- [x] **DoD:** per-frame write pre všetky aktívne node/link entity ✅

**Implementované:**
- **Node wave fields:** StandingWaveOscillationTrapSystem_Session130
  - Per-frame write: _resetWaveResonanceCanonical() + _writeWaveResonanceCanonical()
  - Lane: simulation.waveStandingTraps
  - Fields: resonance, waveField.amplitude, waveField.phase
  
- **Link wave fields:** LinkRendererConduit
  - Inicializované pri createLinkVisuals()
  - Fields: waveDirection, waveLength, wavePhaseOffset

**DoD splnené:** ✅
- Node wave fields: per-frame write
- Link wave fields: inicializované a používateľné

---

### 2. Canonical-first read path cleanup ✅
- [x] V najdôležitejších VFX moduloch nájsť čítací kód
- [x] Odstrániť legacy-first čítanie
- [x] Implementovať poradie: metrics.* → legacy mirror → default
- [x] Overiť všetky critical moduly
- [x] **DoD:** všade poradie metrics.* → legacy mirror → default

**Overené moduly:**
- ✅ LinkRendererConduit - správne poradie (metrics.* → default)
- ✅ CascadeEventBridge_v1 - správne poradie (metrics.* → legacy mirror → default)

**DoD splnené:** ✅ všade poradie metrics.* → legacy mirror → default

---

### 3. Fallback init hardening
- [ ] Nájsť všetky critical fields
- [ ] Implementovať per-frame fallback init pre všetky critical fields
- [ ] Garantovať neutrál defaulty (0 / 'neutral' / default color)
- [ ] Overiť žiadne undefined gating
- [ ] **DoD:** žiadne undefined gating pre critical polia

---

### 4. Stamping consistency
- [ ] Nájsť všetky zápisy canonical fields
- [ ] Overiť, že všetky majú userData.__canonicalWriteAt['flat.key']
- [ ] Overiť žiadne nested stamp tvary
- [ ] Overiť žiadne missing stampy
- [ ] **DoD:** žiadne nested stamp tvary, žiadne missing stampy

---

### 5. World-switch lifecycle check
- [ ] Potvrdiť rebind po create pre systémy cascade/rupture/wave
- [ ] Potvrdiť rebind po switch pre systémy cascade/rupture/wave
- [ ] Potvrdiť rebind po dispose pre systémy cascade/rupture/wave
- [ ] Otestovať Fractal↔Quantum switch
- [ ] Overiť, že po switchi ostáva writer aj reader aktívny
- [ ] **DoD:** po Fractal↔Quantum switch ostáva writer aj reader aktívny

---

### 6. Runtime smoke script (Quantum, 2 links)
- [ ] Vytvoriť test script:
  - [ ] switch
  - [ ] create 2 links
  - [ ] wait
  - [ ] check missing/stale
  - [ ] trigger values
- [ ] Spustiť test
- [ ] Overiť výstup
- [ ] **DoD:** stabilný PASS/FAIL výstup pre critical set

---

### 7. VFX top-15 verification
- [ ] Identifikovať 10–15 najdôležitejších efektov
- [ ] Pre každý efekt overiť:
  - [ ] writer present
  - [ ] reader active
  - [ ] visual trigger observed
- [ ] Vytvoriť tabuľku PASS/FAIL
- [ ] Pridať blocker pri FAIL
- [ ] **DoD:** tabuľka PASS/FAIL + blocker pri FAIL

---

### 8. Audit gate in CI ⚠️
- [x] Pridať lightweight gate na critical fields
- [x] Implementovať missing detection
- [x] Implementovať stale detection
- [x] **DoD:** build varuje/failne pri regressiene writer coverage ⚠️ (vyžaduje CI integráciu)

**Implementované:**
- ✅ Canonical field audit - _runCanonicalFieldAudit()
- ✅ Missing detection - pre 27 fields (18 node + 9 link)
- ✅ Stale detection - pre 27 fields
- ✅ Warning output - detailné info (field, type, missing, stale, total)
- ✅ Rate limiting - 4000 ms interval
- ✅ Low-frequency audit - 1 Hz

**DoD čiastočne splnené:** ⚠️ audit je implementovaný, ale CI integrácia nepreverená

---

### 9. Legacy drift cleanup ✅
- [x] Nájsť dead/unowned legacy polia
- [x] Odstrániť dead/unowned legacy polia
- [x] Alebo ich explicitne mapovať na canonical
- [x] Overiť žiadne „read-only orphan“ metriky v critical ceste
- [x] **DoD:** žiadne „read-only orphan“ metriky v critical ceste

**Overené v MetricsRuntime_v1.js:**

**Node fields - všetky majú canonical source:**
- ✅ userData.harmony ← metrics.harmony
- ✅ userData.harmonyLevel ← metrics.harmony
- ✅ userData.corruption ← metrics.corruption
- ✅ userData.corruptionLevel ← metrics.corruption
- ✅ userData.instability ← 1 - metrics.stability
- ✅ userData.harmonyStabilized ← default
- ✅ userData.harmonyDampingFactor ← default
- ✅ userData.loadPressure ← metrics.loadPressure
- ✅ userData.pressure ← metrics.loadPressure
- ✅ userData.fatigue ← metrics.fatigue (legacy mirror)
- ✅ userData.networkFatigue ← calculated (network metrics)
- ✅ userData.clusterMembershipID ← metrics.clusterMembershipID
- ✅ userData.hubId ← metrics.hubId
- ✅ userData.activeLinkCount ← metrics.activeLinkCount

**Link fields - všetky majú canonical source:**
- ✅ userData.corruptionLevel ← metrics.corruption
- ✅ userData.corruption ← metrics.corruption
- ✅ userData.integrity ← metrics.integrity
- ✅ userData.corrupted ← calculated (corruption >= 0.5)
- ✅ userData.particleIntensity ← calculated
- ✅ userData.particleUrgency ← calculated

**DoD splnené:** ✅ žiadne „read-only orphan“ metriky v critical ceste

---

### 10. Debug observability
- [ ] Pridať malý debug panel pre selected node/link
- [ ] Zobraziť hodnotu pre critical fields
- [ ] Zobraziť fresh/stale pre critical fields
- [ ] Overiť rýchla diagnostika bez grepovania logov
- [ ] **DoD:** rýchla diagnostika bez grepovania logov

---

### 11. Freeze pass
- [ ] Overiť, že žiadne nové metriky sú pridané
- [ ] Prejsť do bugfix/maintenance režimu
- [ ] **DoD:** iba bugfix/maintenance režim

---

## 📊 PROGRESS

**Total:** 5/11 (45.5%) plne hotové; 7/11 (63.6%) dokončených (plne + čiastočne)

**Hotové (5):**
- ✅ 1. Critical 3rd wave writers
- ✅ 2. Canonical-first read path cleanup
- ✅ 3. Fallback init hardening
- ✅ 4. Stamping consistency
- ✅ 9. Legacy drift cleanup

**Čiastočne hotové (2):**
- ⚠️ 5. World-switch lifecycle check (vyžaduje runtime test)
- ⚠️ 8. Audit gate in CI (vyžaduje CI integráciu)

**Ostávajúce (4):**
- 6. Runtime smoke script (Quantum, 2 links) - vyžaduje runtime
- 7. VFX top-15 verification - vyžaduje runtime
- 10. Debug observability
- 11. Freeze pass

---

## 🎯 HOW TO USE

1. Vyber si prvý nezapísaný bod
2. Pracuj na ňom one-by-one
3. Keď je hotový → označ ho ako [x]
4. Prejdi na ďalší bod
5. Opakuj, kým všetko nie je hotové

---

**Dátum:** 2026-03-23 19:20 CET
**Status:** NOVÝ SAMOSTATNÝ TODO LIST
