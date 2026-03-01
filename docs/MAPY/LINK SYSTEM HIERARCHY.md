# 🔗 LINK SYSTEM HIERARCHY — CLEAN ARCHITECTURE

**Dátum:** 2026-03-01
**Verzia:** 1.0
**Autor:** ATOMA Resident Engineer

---

## 📌 PREHLAD

Tento dokument definuje čistú hierarchiu link systémov v ATOMA. Všetky systémy sú klasifikované podľa ich úlohy, autority a závislostí.

---

## 🏗️ HIERARCHICKÁ ŠTRUKTÚRA

```
┌─────────────────────────────────────────────────┐
│          LINK SYSTEM HIERARCHY                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  L1 — CORE LINKING ENGINE                        │
│     └─ NodeLinkingSystem (CORE ENGINE)           │
│         ├─ createLink()                            │
│         ├─ removeLink()                            │
│         ├─ update()                                │
│         └─ Správa všetkých liniek               │
│                                                 │
│  L2 — UI/SELECTION WRAPPER                       │
│     └─ NodeLinking2_3 (UI WRAPPER)            │
│         ├─ Double-click detekcia                   │
│         ├─ RMB firewall                              │
│         ├─ Multi-selection                            │
│         └─ Volá L1 metódy                         │
│                                                 │
│  L3 — LINK VISUALS (11 systémov)            │
│     ├─ legendaryLinkFX                           │
│     ├─ evolvingLinkFX                            │
│     ├─ linkGlyphFlow                             │
│     ├─ linkedGlyphSync                            │
│     ├─ linkedGlyphMessaging                       │
│     ├─ extremeLinkVisuals                         │
│     ├─ extremeLinkVisuals4                        │
│     ├─ neuralCurveLinkVisuals                     │
│     ├─ neuralLinkVis                              │
│     └─ linkVisualMoodSystem                      │
│                                                 │
│  L4 — LINK METRICS (8 systémov)              │
│     ├─ linkSemanticMetricsBridge                 │
│     ├─ linkMetricsSanityGuard                  │
│     ├─ linkQualityCalculator                    │
│     ├─ linkDegradationSystem                     │
│     ├─ linkCollapseSystem                         │
│     ├─ linkHistoryTracker                        │
│     └─ linkCorrelationEngine                      │
│                                                 │
│  L5 — LINK QUALITY & AI (5 systémov)         │
│     ├─ linkRecommendationAI                    │
│     ├─ linkAutomationEngine                       │
│     ├─ linkQualityPredictor                       │
│     ├─ linkQualityFeedbackLoop                    │
│     └─ linkMLRecommendationEngine                │
│                                                 │
│  L6 — LINK PROTECTION (4 systémy)              │
│     ├─ linkEligibilityGate                       │
│     ├─ dynamicLinkColorSystem                    │
│     ├─ linkAuraSystem                             │
│     └─ linkCorruptionTransmission                │
│                                                 │
│  L7 — SEMANTIC & SPECIAL (3 systémy)          │
│     ├─ linkSemanticPictograms                    │
│     ├─ harmonicResonanceCoupling               │
│     └─ userAcceptanceTracker                    │
│                                                 │
│  L8 — LINK REPAIR (2 systémy)                   │
│     ├─ nodeLinkerRepairLayer                    │
│     └─ safeNodeUnlinking                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 DETAILY PRE KAŽDÚ ÚROVEŇ

### **L1 — CORE LINKING ENGINE**

#### **NodeLinkingSystem.js**
- **Účel:** CORE LINKING ENGINE
- **Inicializácia:** main.js (riadok 5536)
- **Instance:** `this.linkingSystem`
- **Hlavné metódy:**
  - `createLink(sourceNode, targetNode)` — vytvorí nový link
  - `removeLink(link)` — odstráni link
  - `update(deltaTime, time)` — update loop

**Autorita:**
- Final authority pre všetky link operácie
- Správa link index: `this.links`, `this.linksByNode`

**Závislosti:**
- Scene, Camera, Renderer, AINodes
- LinkRendererConduit (vizualizácia)

---

### **L2 — UI/SELECTION WRAPPER**

#### **NodeLinking2_3.js**
- **Účel:** UI/SELECTION WRAPPER (nie replacement)
- **Inicializácia:** main.js (riadok 10617)
- **Instance:** `this.nodeLinking`
- **Hlavné metódy:**
  - `update(deltaTime)` — UI update loop
  - `handleMouseDown()` — LMB/RMB handling
  - `handleDoubleClick()` — Double-click detekcia
  - `handleMultiSelect()` — Multi-selection

**Autorita:**
- UI handling a selection
- Volá L1 metódy (createLink/removeLink)

**Závislosti:**
- Scene, Camera, Renderer, SelectionCore
- NodeLinkingSystem (CORE ENGINE)

---

### **L3 — LINK VISUALS (11 systémov)**

#### **Legendary Link Effects**
- **legendaryLinkFX** — Legendary link vizualizácie (v4)
- **Instance:** `this.legendaryLinkFX`
- **Aktualizácia:** LegendaryLinkVisualPack3.js

#### **Evolving Link Effects**
- **evolvingLinkFX** — Dynamic link morphing (v2)
- **Instance:** `this.evolvingLinkFX`
- **Aktualizácia:** _EvolvingLinkFX2_0.js

#### **Glyph Systémy**
- **linkGlyphFlow** — Link glyph flow
- **linkedGlyphSync** — Glyph synchronization
- **linkedGlyphMessaging** — Glyph messaging
- **Instances:** `this.linkGlyphFlow`, `this.linkedGlyphSync`, `this.linkedGlyphMessaging`
- **Aktualizácia:** _LinkGlyphFlow.js, _LinkedGlyphSynchronization1_0.js, _LinkedGlyphMessaging3_0.js

#### **Extreme Link Visuals**
- **extremeLinkVisuals** — Extreme visual pack v3
- **extremeLinkVisuals4** — Extreme visual pack v4
- **Instances:** `this.extremeLinkVisuals`, `this.extremeLinkVisuals4`
- **Aktualizácia:** _ExtremeLinkVisualPack3.js, _ExtremeLinkVisuals4_0.js

#### **Neural & Mood Systems**
- **neuralCurveLinkVisuals** — Neural curve vizualizácie
- **neuralLinkVis** — Archetype neural vizualizácie
- **linkVisualMoodSystem** — Visual mood (calm/premium/intense)
- **Instances:** `this.neuralCurveLinkVisuals`, `this.neuralLinkVis`, `this.linkVisualMoodSystem`
- **Aktualizácia:** _NeuralCurveLinkVisuals.js, ArchetypeNeuralLinkVis_v1.js, LinkVisualMoodSystem.js

**Autorita:**
- LinkRendererConduit správa všetky vizualizácie
- Všetky systémy sú vizualne nezávislé
- Update volaný každý frame

---

### **L4 — LINK METRICS (8 systémov)**

#### **Semantic Metrics**
- **linkSemanticMetricsBridge** — Semantic metrics
- **Instance:** `this.linkSemanticMetricsBridge`
- **Aktualizácia:** LinkSemanticMetricsBridge_v1.js

#### **Sanity Guard**
- **linkMetricsSanityGuard** — Sanity guard
- **Instance:** `this.linkMetricsSanityGuard`
- **Aktualizácia:** LinkMetricsSanityGuard_v1.js

#### **Quality Calculator**
- **linkQualityCalculator** — Quality calculator
- **Instance:** `this.linkQualityCalculator`
- **Aktualizácia:** LinkQualityCalculator.js

#### **Degradation & Collapse**
- **linkDegradationSystem** — Degradation
- **linkCollapseSystem** — Collapse
- **Instances:** `this.linkDegradationSystem`, `this.linkCollapseSystem`
- **Aktualizácia:** LinkDegradationSystem.js, LinkCollapseSystem.js

#### **History & Correlation**
- **linkHistoryTracker** — History tracking
- **linkCorrelationEngine** — Correlation engine
- **Instances:** `this.linkHistoryTracker`, `this.linkCorrelationEngine`
- **Aktualizácia:** LinkHistoryTracker1_0.js, LinkCorrelationEngine1_0.js

#### **Metrics Bridge**
- **linkMetricsToVisualBridge** — Metrics to visual bridge
- **Instance:** `this.linkMetricsToVisualBridge`
- **Aktualizácia:** LinkMetricsToVisualBridge_v1.js

**Autorita:**
- Všetky systémy čítajú metriky
- Všetky systémy sú analyticky nezávislé
- Update volaný každý frame

---

### **L5 — LINK QUALITY & AI (5 systémov)**

#### **Recommendation Engines**
- **linkRecommendationAI** — Recommendation engine (v1)
- **linkMLRecommendationEngine** — ML recommendations
- **Instances:** `this.linkRecommendationAI`, `this.linkMLRecommendationEngine`
- **Aktualizácia:** LinkRecommendationAI1_0.js, LinkMLRecommendationEngine1_0.js

#### **Automation & Prediction**
- **linkAutomationEngine** — Automation engine
- **linkQualityPredictor** — Quality prediction
- **linkQualityFeedbackLoop** — Feedback loop
- **Instances:** `this.linkAutomationEngine`, `this.linkQualityPredictor`, `this.linkQualityFeedbackLoop`
- **Aktualizácia:** LinkAutomationEngine1_0.js, LinkQualityPredictor1_0.js, LinkQualityFeedbackLoop1_0.js

#### **User Acceptance**
- **userAcceptanceTracker** — User acceptance tracking
- **Instance:** `this.userAcceptanceTracker`
- **Aktualizácia:** NodeLinkingSystem.js (vnútorný)

**Autorita:**
- AI/ML systémy odporúčajú kvality liniek
- Všetky systémy sú nezávislé
- Update volaný každý frame

---

### **L6 — LINK PROTECTION (4 systémy)**

#### **Eligibility Gate**
- **linkEligibilityGate** — Eligibility gate
- **Instance:** `this.linkEligibilityGate`
- **Aktualizácia:** LinkEligibilityGate_v1.js (setupLinkEligibilityGate)

#### **Dynamic Visuals**
- **dynamicLinkColorSystem** — Dynamic color
- **linkAuraSystem** — Link auras
- **Instances:** `this.dynamicLinkColorSystem`, `this.linkAuraSystem`
- **Aktualizácia:** DynamicLinkColorSystem.js, NodeLinkedAuraSystem.js

#### **Debug Mode**
- **linkDebugMode** — Debug mode
- **Instance:** `this.linkDebugMode`
- **Aktualizácia:** LinkDebugMode_v1.js (setupLinkDebugMode)

#### **Corruption**
- **linkCorruptionTransmission** — Corruption spread
- **Instance:** `this.linkCorruptionTransmission`
- **Aktualizácia:** LinkCorruptionTransmission_v1.js

**Autorita:**
- Protection systémy chránia linky
- Debug systém monitoruje linky
- Update volaný každý frame

---

### **L7 — SEMANTIC & SPECIAL (3 systémy)**

#### **Semantic Pictograms**
- **linkSemanticPictograms** — Pictograms s fusion
- **Instance:** `this.linkSemanticPictograms`
- **Aktualizácia:** LinkSemanticPictogramSystem_WithFusion.js

#### **Harmonic Resonance**
- **harmonicResonanceCoupling** — Harmonic resonance
- **Instance:** `this.harmonicResonanceCoupling`
- **Aktualizácia:** HarmonicResonanceCoupling_v1.js

#### **User Tracking**
- **userAcceptanceTracker** — User acceptance
- **Instance:** `this.userAcceptanceTracker`
- **Aktualizácia:** NodeLinkingSystem.js (vnútorný)

**Autorita:**
- Semantic systémy dopĺňujú linky
- Tracking systémy monitorujú používateľa
- Update volaný každý frame

---

### **L8 — LINK REPAIR (2 systémy)**

#### **Repair Layer**
- **nodeLinkerRepairLayer** — Repair layer
- **Instance:** `this.nodeLinkerRepairLayer`
- **Aktualizácia:** NodeLinker2_RepairLayer1_0.js

#### **Safe Unlinking**
- **safeNodeUnlinking** — Safe unlinking
- **Instance:** `this.safeNodeUnlinking`
- **Aktualizácia:** _SafeNodeUnlinking3_3.js

**Autorita:**
- Repair systémy opravujú poškodené linky
- Safe unlinking zabezpečuje čisté odstránenie
- Update volaný každý frame

---

## 📈 SUMMARY

### **Počet systémov na úroveň:**
- **L1:** 1 (Core Engine)
- **L2:** 1 (UI Wrapper)
- **L3:** 11 (Visuals)
- **L4:** 8 (Metrics)
- **L5:** 5 (Quality & AI)
- **L6:** 4 (Protection)
- **L7:** 3 (Semantic & Special)
- **L8:** 2 (Repair)

**CELKOM:** **35 aktívnych link systémov**

---

## 🎯 DÔLEŽITÉ OBSERVÁCIE

### **1. NodeLinkingSystem nie je legacy**
- ✅ CORE LINKING ENGINE
- ✅ Správa všetkých liniek
- ✅ Hlavné metódy: createLink, removeLink, update

### **2. NodeLinking2_3 nie je replacement**
- ✅ UI/SELECTION WRAPPER
- ✅ Volá NodeLinkingSystem.createLink/removeLink
- ✅ Správa UI interakcie

### **3. Všetky systémy sú aktívne**
- ✅ 35 systémov inicializovaných
- ✅ Všetky používajú sa
- ✅ Žiadne nepoužívané systémy

---

## 📋 CHECKLIST HIERARCHIE

**Core Linking:**
- [x] NodeLinkingSystem (L1) — CORE ENGINE
- [x] NodeLinking2_3 (L2) — UI WRAPPER

**Link Visuals (11):**
- [x] legendaryLinkFX
- [x] evolvingLinkFX
- [x] linkGlyphFlow
- [x] linkedGlyphSync
- [x] linkedGlyphMessaging
- [x] extremeLinkVisuals
- [x] extremeLinkVisuals4
- [x] neuralCurveLinkVisuals
- [x] neuralLinkVis
- [x] linkVisualMoodSystem

**Link Metrics (8):**
- [x] linkSemanticMetricsBridge
- [x] linkMetricsSanityGuard
- [x] linkQualityCalculator
- [x] linkDegradationSystem
- [x] linkCollapseSystem
- [x] linkHistoryTracker
- [x] linkCorrelationEngine
- [x] linkMetricsToVisualBridge

**Link Quality & AI (5):**
- [x] linkRecommendationAI
- [x] linkAutomationEngine
- [x] linkQualityPredictor
- [x] linkQualityFeedbackLoop
- [x] linkMLRecommendationEngine

**Link Protection (4):**
- [x] linkEligibilityGate
- [x] dynamicLinkColorSystem
- [x] linkAuraSystem
- [x] linkCorruptionTransmission

**Semantic & Special (3):**
- [x] linkSemanticPictograms
- [x] harmonicResonanceCoupling
- [x] userAcceptanceTracker

**Link Repair (2):**
- [x] nodeLinkerRepairLayer
- [x] safeNodeUnlinking

---

## 🚨 PREDPOKLADANÉ NEPOUŽÍVANÉ SYSTÉMY

### **1. NeonLinkVisuals.js**
- ❌ Nikdy inicializovaný
- ✅ Len fallback reference: `"this.neonLinkVisuals || null"`
- ⚠️ **ODSTRÁNIŤ** (nevyužitý kód)

### **2. EnhancedNodeModelLinkState.js**
- ❌ DISABLED v main.js
- ✅ Komentár: `"// DISABLED: this.enhancedNodeModelLinkState = new EnhancedNodeModelLinkState();"`
- ⚠️ **ODSTRÁNIŤ** (dead code)

---

## 🔮 DOPORUČENÉ AKCIE

### **Odstránenie nepoužívaných systémov:**
1. NeonLinkVisuals.js — neinicializovaný
2. EnhancedNodeModelLinkState.js — disabled

### **Zachovanie aktívnych systémov:**
- Všetkých 35 systémov je aktívnych a používaných
- NodeLinkingSystem + NodeLinking2_3 sú komplementárne
- Všetky vizualizácie a metriky sú aktívne

---

## 📝 ZÁVER

**Link hierarchia je teraz:**

1. **Jasná a čistá** — 8 úrovní s jasným zámierom
2. **Dokumentovaná** — všetky systémy a ich úlohy
3. **Pochopená** — NodeLinkingSystem a NodeLinking2_3 sú komplementárne
4. **Správna** — žiadne nesprávne predpoklady o legacy

**35 aktívnych link systémov** je pripravených na ďalšiu prácu.

---

**Dokument vytvorený:** 2026-03-01
**Verzia:** 1.0
**Status:** COMPLETED