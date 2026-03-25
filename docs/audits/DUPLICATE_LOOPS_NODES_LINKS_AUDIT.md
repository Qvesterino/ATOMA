# STATIC AUDIT – DUPLICITNÉ LOOPY NAD NODES/LINKS

**Dátum:** 2026-03-25  
**Autor:** Static Analysis  
**Cieľ:** Identifikovať vizuálne systémy, ktoré iterujú nad nodes/links bez priameho renderu

---

## METODOLOGIA

Audit prebiehal nasledovne:
1. Hľadanie vzorov: `for (node of nodes)`, `for (link of links)`, `for (const ... of ...)`
2. Analýza každého nájdeného systému:
   - či v loope mení geometry / attributes → **RENDER** (OK)
   - alebo len počíta hodnoty → **COMPUTE-ONLY** (PROBLÉM)
3. Označenie systémov bez geometry.attributes.*, mesh.*, shader uniform update

---

## VÝSLETKY AUDITU

### 1. SynergyBonusVisualization_v1.js ✗ COMPUTE-ONLY

**Súbor:** `SynergyBonusVisualization_v1.js`  
**Metóda:** `update(deltaTime, allLinks)`  
**Loop:** `for (const link of allLinks)`

**Čo robí v loope:**
- Číta `link.userData.synergy.synergyNorm`
- Vypočíta `pulseStrength`, `chromaShift`, `resonanceRipples`
- Píše do `link.userData.visualMetrics.synergyBonus`

**Render operácie:**
- ❌ Žiadne geometry.attributes.* updates
- ❌ Žiadne mesh.* operácie
- ❌ Žiadne shader uniform updates

**Záver:** Tento systém je čisto výpočtový. Neposkytuje žiadnu vizuálnu spätnú väzbu priamo v loope. Výsledky sa používajú inými systémami.

---

### 2. HarmonicResonanceFeedbackSystem.js ✗ COMPUTE-ONLY

**Súbor:** `HarmonicResonanceFeedbackSystem.js`  
**Metóda:** `findInfluencedElements(field, pictogramsArray, linkingSystem)`  
**Loop:** `for (let pictogram of pictogramsArray)`

**Čo robí v loope:**
- Číta `pictogram.link` a pozície
- Vypočíta vzdialenosť od resonance field
- Vypočíta influence strength
- Filtruje a triedi kandidátov

**Render operácie:**
- ❌ Žiadne geometry.attributes.* updates
- ❌ Žiadne mesh.* operácie
- ❌ Žiadne shader uniform updates

**Záver:** Systém iteruje nad pictograms (ktoré majú linky) ale nepoužíva tento loop na render. Iba vypočíta influence a pripraví dáta pre `applyLinkInfluence()` a `applyPictogramInfluence()`.

---

### 3. AnimatedLinkFlow.js ✓ RENDER

**Súbor:** `AnimatedLinkFlow.js`  
**Metóda:** `animate(deltaTime, time)`  
**Loop:** `for (const flowState of this.activeFlows)`

**Čo robí v loope:**
- Aktualizuje pozície particle mesh-ov
- Mení rotácie (quaternion)
- Aktualizuje material properties (emissiveIntensity, opacity)
- Mení scale mesh-ov

**Render operácie:**
- ✅ `packet.mesh.position.copy(point)` - priame geometry update
- ✅ `packet.mesh.quaternion.setFromRotationMatrix(matrix)` - transform update
- ✅ `packet.material.emissiveIntensity = ...` - material update
- ✅ `packet.mesh.scale.setScalar(...)` - geometry update

**Záver:** Legitímny vizuálny systém s priamym renderom.

---

### 4. LinkRendererConduit.js ✓ RENDER

**Súbor:** `LinkRendererConduit.js`  
**Metóda:** `updateAll(links, deltaTime, time)` a `update(link, ...)`  
**Loop:** `for (const link of list)` a per-link processing

**Čo robí v loope:**
- Aktualizuje wave metrics
- Aktualizuje strand geometries
- Aktualizuje shader uniforms
- Mení material properties
- Aktualizuje particle systémy

**Render operácie:**
- ✅ `mesh.geometry.dispose()` + new geometry - geometry rebuild
- ✅ `material.uniforms.uTime.value = ...` - shader updates
- ✅ `material.uniforms.uCorruption.value = ...` - shader updates
- ✅ `material.uniforms.uLocalLoad.value = ...` - shader updates
- ✅ `mesh.position.copy(...)` - transform updates

**Záver:** Kanonický link renderer - priamy render.

---

## SHRNUÝ PREHĽAD

| Súbor | Loop Target | Typ | Vysvetlenie |
|--------|--------------|------|--------------|
| SynergyBonusVisualization_v1.js | links | COMPUTE-ONLY | Počíta visual metrics, neprenderuje |
| HarmonicResonanceFeedbackSystem.js | pictogramsArray | COMPUTE-ONLY | Počíta influence, neprenderuje |
| AnimatedLinkFlow.js | activeFlows | RENDER | Aktualizuje flow mesh-ov |
| LinkRendererConduit.js | links | RENDER | Hlavný link renderer |

## ANALÝZA PROBLÉMOVÝCH SYSTÉMOV

### SynergyBonusVisualization_v1.js

**Problém:**
- Iteruje nad všetkými links každý frame
- Len počíta a píše do `userData.visualMetrics`
- Tieto dáta musia byť prečítané iným systémom (napr. LinkRendererConduit)
- Vytvára duplicitnú prácu: compute vs read

**Možné riešenie:**
- Presunúť výpočet do 10Hz scheduleru (menej častý)
- Alebo integrovať priamo do LinkRendererConduit (common pass)
- Alebo cacheovať výsledky a len aktualizovať pri zmene

### HarmonicResonanceFeedbackSystem.js

**Problém:**
- Iteruje nad `pictogramsArray` v `findInfluencedElements()`
- Len počíta influence strength a pripravuje dáta
- Vlastný render sa deje v `applyLinkInfluence()` a `applyPictogramInfluence()`
- Vytvára separáciu: nájdi → preprava → aplikuj

**Možné riešenie:**
- Integrovať výpočet influence priamo do update loopu
- Alebo batchovať výpočty pre všetky fields naraz

## POROVNANIE S LINKRENDERERCONDUIT

LinkRendererConduit už iteruje nad všetkými links v `updateAll()`:

```javascript
for (const link of list) {
    this._canonicalWriteLinkWaveMetrics(link);
    // ... per-link update
}
```

Toto znamená:
- SynergyBonusVisualization_v1 robí **druhý** loop nad rovnakým zoznamom links
- HarmonicResonanceFeedbackSystem robí **indirectný** loop nad pictograms (ktoré majú links)

## DOPORUČENIA

### Priorita 1: SynergyBonusVisualization_v1.js

**Zlúčenie do LinkRendererConduit:**
- Pridať synergy bonus výpočet do existujúceho loopu
- Eliminovať duplicitnú iteráciu
- Priame použitie v shader uniforms bez intermediárneho `visualMetrics`

### Priorita 2: HarmonicResonanceFeedbackSystem.js

**Optimalizácia influence výpočtu:**
- Redukovať počet loop-ov nad pictograms
- Alebo batchovať výpočet influence pre viacero fields naraz

## PERFORMANCE IMPACT

**Odhad:** S 1500+ links:

1. SynergyBonusVisualization_v1:
   - 1500 iterácií/frame (60 Hz = 90,000 iterácií/sek)
   - Iba compute operations
   - ~1ms podľa vlastných measurements

2. HarmonicResonanceFeedbackSystem:
   - Zavislé od počtu active fields
   - Max 20 fields × 12 pictograms = 240 operácií
   - ~3.5ms budget

3. LinkRendererConduit:
   - 1500 iterácií/frame
   - Full render operations
   - Dominantný čas

**Potenciálna úspora:**
- Zlúčenie SynergyBonusVisualization do LinkRendererConduit → -1ms
- Optimalizácia HarmonicResonanceFeedback → -2ms

## ZÁVER

Nájdené **2 systémy** s duplicitnými loops nad nodes/links:

1. **SynergyBonusVisualization_v1.js** - COMPUTE-ONLY loop nad links
2. **HarmonicResonanceFeedbackSystem.js** - COMPUTE-ONLY loop nad pictograms

Obe systémy iterujú nad entitami len pre výpočet, nie pre priamy render. Toto vytvára duplicitnú prácu, ktorá by mohla byť zlúčená do existujúcich render loops (LinkRendererConduit).

**Odporúčanie:** Integrovať tieto výpočty do kanonických update loops pre zníženie overheadu.