# REBIND ANALÝZA - WORLD SWITCH
## 2026-03-23 17:35 CET

---

## ℹ️ PROBLÉM: Neoverené rebind po world switchi

**Fáza:** C bod 13  
**Priorita:** Low  
**Súbor:** main.js, HarmonyStabilizationSystem_v1.js, ParticleSemanticDensityAdapter_Session121.js, LinkRendererConduit.js

---

## 📊 ANALÝZA

### ✅ Systémy, ktoré majú rebind() a volajú sa po world switchi:

**1. CascadeEventBridge_v1.js** ✅
- Má rebind() metódu
- Volá sa v `_rebindWorldLifecycleSystems()` v main.js
- Volá sa po: loadWorld(), createWorld()
- **Status:** ✅ IMPLEMENTOVANÉ

**2. ResonanceRuptureVisualSystem_Session133.js** ✅
- Má rebind() metódu
- Volá sa v `_rebindWorldLifecycleSystems()` v main.js
- Volá sa po: loadWorld(), createWorld()
- **Status:** ✅ IMPLEMENTOVANÉ

**3. StandingWaveOscillationTrapSystem_Session130.js** ✅
- Má rebind() metódu
- Volá sa v `_rebindWorldLifecycleSystems()` v main.js
- Volá sa po: loadWorld(), createWorld()
- **Status:** ✅ IMPLEMENTOVANÉ

---

### ❌ Systémy, ktoré NEMAJÚ rebind() metódu:

**1. HarmonyStabilizationSystem_v1.js** ❌
- Nemá rebind() metódu
- Nemá ani dispose() metódu
- Inicializuje sa v setupHarmonyStabilization() v main.js
- Používa: this.aiNodes, this.linkingSystem, this.semanticBus
- **Riziko:** Ak sa po world switchi menia aiNodes/linkingSystem, systém bude mať zastarané referencie

**2. ParticleSemanticDensityAdapter_Session121.js** ❌
- Má dispose() metódu, ale NEMÁ rebind() metódu
- Inicializuje sa v setupParticleSemanticDensity() v main.js
- Používa: links, conflictSystem, cascadeSystem
- **Riziko:** Ak sa po world switchi menia links, systém bude mať zastarané referencie

**3. LinkRendererConduit.js** ❌
- Má dispose() metódu, ale NEMÁ rebind() metódu
- Inicializuje sa v LinkRendererConduit konštruktore
- Používa: this.linkSystem, this.semanticBus, atď.
- **Riziko:** Ak sa po world switchi menia linkSystem, systém bude mať zastarané referencie

---

## 📝 NAVRH RIEŠENIA

### Možnosť 1: Pridať rebind() metódy do chýbajúcich systémov

**HarmonyStabilizationSystem_v1.js**
```javascript
rebind({ linkingSystem, aiNodes, semanticBus }) {
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.semanticBus = semanticBus;
}
```

**ParticleSemanticDensityAdapter_Session121.js**
```javascript
rebind({ links, conflictSystem, cascadeSystem }) {
    this.links = links;
    this.conflictSystem = conflictSystem;
    this.cascadeSystem = cascadeSystem;
}
```

**LinkRendererConduit.js**
```javascript
rebind({ linkSystem, semanticBus, waveEngine, aiNodes }) {
    this.linkSystem = linkSystem;
    this.semanticBus = semanticBus;
    this.waveEngine = waveEngine;
    this.aiNodes = aiNodes;
}
```

### Možnosť 2: Pridať volania do `_rebindWorldLifecycleSystems()` v main.js

```javascript
_rebindWorldLifecycleSystems({
    linkingSystem = this.nodeLinkingSystem ?? this.linkingSystem ?? this.nodeLinking ?? null,
    aiNodes = this.aiNodes ?? null,
    semanticBus = this.semanticBus ?? null,
    frameScheduler = this.frameScheduler ?? null
} = {}) {
    // Existing rebinds (cascadeEventBridge, resonanceRupture, standingWaveTrap)
    // ...

    // New rebinds
    if (this.harmonyStabilizationSystem && typeof this.harmonyStabilizationSystem.rebind === 'function') {
        this.harmonyStabilizationSystem.rebind({
            linkingSystem,
            aiNodes,
            semanticBus
        });
    }

    if (this.particleSemanticDensity && typeof this.particleSemanticDensity.rebind === 'function') {
        this.particleSemanticDensity.rebind({
            links: this.links || this.linkingSystem?.links,
            conflictSystem: null,
            cascadeSystem: this.cascadeEventBridge
        });
    }

    if (this.linkRendererConduit && typeof this.linkRendererConduit.rebind === 'function') {
        this.linkRendererConduit.rebind({
            linkSystem: this.linkingSystem,
            semanticBus,
            waveEngine: this.waveInterferenceEngine,
            aiNodes
        });
    }
}
```

---

## ⚠️ RIZIKÁ

Ak sa rebind() neimplementuje:
1. **Stale references:** Systémy budú čítať starej referencie po world switchi
2. **Undefined errors:** Čítačky môžu vrátiť undefined alebo null
3. **Visual glitches:** Vizuálne efekty môžu fungovať nesprávne
4. **Memory leaks:** Systémy môžu držať referencie na zmiznuté objekty

---

## 🎯 RECOMMENDED ACTION

**Implementovať rebind() metódy pre:**
1. HarmonyStabilizationSystem_v1.js
2. ParticleSemanticDensityAdapter_Session121.js
3. LinkRendererConduit.js

**Pridať volania do `_rebindWorldLifecycleSystems()` v main.js:**
- Po create world (s null hodnotami pre dispose)
- Po load world (s novými hodnotami)

---

## 📊 STATUS

| Systém | Má rebind() | Volá sa po switchi | Status |
|----------|--------------|---------------------|---------|
| CascadeEventBridge_v1 | ✅ | ✅ | ✅ OK |
| ResonanceRuptureVisualSystem_Session133 | ✅ | ✅ | ✅ OK |
| StandingWaveOscillationTrapSystem_Session130 | ✅ | ✅ | ✅ OK |
| HarmonyStabilizationSystem_v1 | ❌ | ❌ | ⚠️ PROBLÉM |
| ParticleSemanticDensityAdapter_Session121 | ❌ | ❌ | ⚠️ PROBLÉM |
| LinkRendererConduit | ❌ | ❌ | ⚠️ PROBLÉM |

**Celkový status:** 3/6 systémov má rebind() (50%)

---

## 📝 NOTES

- main.js má `_rebindWorldLifecycleSystems()` metódu, ale nie je kompletná
- loadWorld() volá `_rebindWorldLifecycleSystems()` s plnými parametrami
- createWorld() volá `_rebindWorldLifecycleSystems()` s null linkingSystem/aiNodes/semanticBus (pre dispose)
- To je správny behavior

---

**Dátum:** 2026-03-23 17:35 CET
**Analýza vykonaná:** Manual code review v main.js a relevantných systémoch
**Počet problémov:** 3 systémy bez rebind() metódy
**Priorita fixu:** Medium (po implementovaní stamping je to low)
