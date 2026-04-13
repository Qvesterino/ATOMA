# AUDIT: Efekty emitované na strednej pozícii linku (link midpoint)

**Dátum:** 2026-04-12
**Cieľ:** Zistiť ktoré efekty sa emitujú/spawnujú na strednej pozícii linku (midpoint medzi source a target node)

---

## SÚHRN

- **Celkovo nájdených výskytov midpointu:** 58+
- **Aktívne spawnované efekty na midpointe:** 18
- **Particle systémy používajúce midpoint:** 3
- **Wave systémy používajúce midpoint:** 6
- **LOD a logické systémy:** 12
- **Vizuálne efekty na midpointe:** 9
- **Systémové/geometrické použitie:** 14

---

## 1. PARTICLE SYSTÉMY EMITUJÚCE NA MIDPOINTE

### 1.1 LinkTrailParticleSystem - Trail visibility boost
**Súbor:** `LinkTrailParticleSystem.js:687`
```javascript
const randomProgress = Math.random();
const emitPos = curve.getPointAt(randomProgress, this._emitPosScratch);
// Nie je priamy spawn na midpointe, ale častice môžu byť emitované kdekoľvek
```
- **Typ:** Particle trail systém
- **Emit:** Náhodne pozdĺž krivky (nie fixný midpoint)
- **Midpoint vplyv:** Častice sú najjasnejšie pri progress 0.5 (stred) cez opacity moduláciu
- **Dopad:** Vizuálny "echo" efekt - maximum jasnosti v strede linku
- **Typ:** Derivovaná pozícia (opacity modulácia, nie fyzický spawn)

### 1.2 LinkCorruptionParticleSystem - Corruption particles s biasom
**Súbor:** `LinkCorruptionParticleSystem.js:409-424`
```javascript
// Pick a point on the curve - bias toward higher corruption node
let t = Math.random();
const nodeA = link.sourceNode || link.nodeA || link.source;
const nodeB = link.targetNode || link.nodeB || link.target;
const corruptionA = this._readNodeCorruption(nodeA);
const corruptionB = this._readNodeCorruption(nodeB);
const totalNodeCorruption = corruptionA + corruptionB;

if (totalNodeCorruption > 0.2 && Math.random() < 0.7) {
  const bias = corruptionB / totalNodeCorruption;
  t = THREE.MathUtils.lerp(t, bias, 0.6);
}

const pos = link.curve.getPointAt(t);
```
- **Typ:** Corruption častice
- **Emit:** Náhodne pozdĺž krivky s biasom smerom ku korupčnému uzlu
- **Midpoint vplyv:** Častice môžu byť emitované v blízkosti midpointu ak je rovnaká corruption
- **Dopad:** Korupčné častice sú viac skoncentrované pri korupčnom uzle
- **Typ:** Derivovaná pozícia (bias toward corruption, nie fixný midpoint)

### 1.3 CascadeParticleSystem - Cascade trail midpoint
**Súbor:** `CascadeParticleSystem_Session120.js:896, 2243`
```javascript
this._tmpMidpoint.copy(sourcePos).add(targetPos).multiplyScalar(0.5);
```
- **Typ:** Cascade particle systém
- **Použitie:** LOD výpočty a konflikt detekcia v regiónoch
- **Dopad:** Používa midpoint pre logiku, nie priamy spawn
- **Typ:** Logické použitie (nie vizuálny spawn)

---

## 2. RECOVERY A RUPTURE EFEKTY NA MIDPOINTE

### 2.1 HarmonicRecoveryVisualSystem - Recovery zóny
**Súbor:** `HarmonicRecoveryVisualSystem_Session138.js:531, 738`
```javascript
const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
// Recovery zóny sú spawnované priamo na strede linku
this.recoveringZones.push({
  active: true,
  pos: center,
  linkId: linkId,
  startNode: endpoints.startNode,
  endNode: endpoints.endNode,
  life: 0,
  startTime: now,
  maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
  waveMeshIdx: -1,
  lastStitchTime: now,
  waveOnly: true,
  linkYaw: linkYaw
});
```
- **Typ:** Recovery zóna (wave efekt)
- **Pozícia:** Presne na midpointe linku
- **Kontext:** Spúšťa sa pri harmonic recovery na linkoch
- **Dopad:** Vizuálny recovery efekt na strednej pozícii linku
- **Typ:** Priamy spawn z midpointu

### 2.2 ResonanceRuptureVisualSystem - Resonance scars
**Súbor:** `ResonanceRuptureVisualSystem_Session133.js:982, 1378, 1413, 1569, 1800`
```javascript
const scarCenter = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
scarMesh.mesh.position.copy(scarCenter);

// Iné výskyty:
const center = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);  // line 1378
center.copy(startPos).add(endPos).multiplyScalar(0.5);  // line 1413
const center = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);  // line 1569
return new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5);  // line 1800
```
- **Typ:** Resonance scar efekt
- **Pozícia:** Presne na midpointe linku
- **Kontext:** Spúšťa sa pri resonance rupture eventoch
- **Dopad:** Scar vizualizácia na strednej pozícii linku, orientovaná pozdĺž linku
- **Rozmery:** Škálované podľa dĺžky linku (X = 0.8 * linkLength, Y = 0.1 * linkLength)
- **Typ:** Priamy spawn z midpointu

---

## 3. WAVE SYSTÉMY POUŽÍVAJÚCE MIDPOINT

### 3.1 WaveParticleEmitter - Wave particles
**Súbor:** `WaveParticleEmitter_v1.js:1230`
```javascript
return this._tmpLinkMidpoint.copy(sourcePos).add(targetPos).multiplyScalar(0.5);
// Metóda: _resolveLinkMidpoint()
```
- **Typ:** Wave particle emitter
- **Použitie:** Metóda na získanie stredu linku pre wave emisie
- **Kontext:** Wave častice môžu byť emitované z midpointu
- **Dopad:** Wave emisie môžu vychádzať zo stredu linku
- **Typ:** Priamy výpočet midpointu (použitý pre wave emisie)

### 3.2 LinkResonanceFlowSystem - Resonance flow
**Súbor:** `LinkResonanceFlowSystem_Session124.js:1996`
```javascript
this._scratchVecA.copy(nodeA.position).add(nodeB.position).multiplyScalar(0.5)
```
- **Typ:** Resonance flow vizualizácia
- **Použitie:** LOD výpočty - vzdialenosť kamery od stredu linku
- **Kontext:** Používa midpoint pre LOD logiku
- **Dopad:** LOD rozhodnutia založené na vzdialenosti od midpointu
- **Typ:** Logické použitie (LOD)

### 3.3 WaveInterferenceEngine - Wave interference
**Súbor:** `WaveInterferenceEngine_v1.js:79`
```javascript
.multiplyScalar(0.5)
// Používa midpoint pre wave interference výpočty
```
- **Typ:** Wave interference engine
- **Použitie:** Wave interference výpočty
- **Kontext:** Používa midpoint pre interference logiku
- **Dopad:** Interference patterny vypočítané zo stredu linku
- **Typ:** Logické použitie (interference)

### 3.4 WaveInterferencePatternSystem - Wave patterns
**Súbor:** `WaveInterferencePatternSystem_Session132.js:326, 421`
```javascript
? new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)  // line 326
? new THREE.Vector3().addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5)  // line 421
```
- **Typ:** Wave interference pattern systém
- **Použitie:** Wave interference patterns
- **Kontext:** Používa midpoint pre wave pattern výpočty
- **Dopad:** Patterny vypočítané zo stredu linku
- **Typ:** Logické použitie (pattern výpočty)

### 3.5 HarmonicResonanceFeedbackSystem - Resonance feedback
**Súbor:** `HarmonicResonanceFeedbackSystem.js:980`
```javascript
return new THREE.Vector3().addVectors(endpoints.startPos, endpoints.endPos).multiplyScalar(0.5);
```
- **Typ:** Harmonic resonance feedback
- **Použitie:** Resonance feedback výpočty
- **Kontext:** Používa midpoint pre resonance logiku
- **Dopad:** Feedback signály vypočítané zo stredu linku
- **Typ:** Logické použitie (feedback)

### 3.6 ResonanceCascadeVisualization - Cascade visualization
**Súbor:** `ResonanceCascadeVisualization_Session117B.js:591, 1084`
```javascript
_getLinkMidpoint(link) {
  // Metóda na získanie stredu linku
}
const midpoint = this._getLinkMidpoint(link);
```
- **Typ:** Resonance cascade vizualizácia
- **Použitie:** Cascade vizualizácie
- **Kontext:** Používa midpoint pre cascade logiku
- **Dopad:** Cascade efekty môžu byť positionované na midpointe
- **Typ:** Logické/Vizuálne použitie

---

## 4. SYNERGY A CASCADE EFEKTY NA MIDPOINTE

### 4.1 SynergyCascadeVisualizer - Cascade vizualizácie
**Súbor:** `SynergyCascadeVisualizer.js:872, 1001, 1790, 2357`
```javascript
const midpoint = (sourcePosition && targetPosition)
  ? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)
  : null;  // line 872

? new THREE.Vector3().addVectors(startPosition, targetPosition).multiplyScalar(0.5)  // line 1001
return new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);  // line 1790
? new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5)  // line 2357
```
- **Typ:** Synergy cascade vizualizácie
- **Použitie:** Cascade spawn context a anchor pozície
- **Kontext:** Používa midpoint pre cascade efekty
- **Dopad:** Cascade efekty môžu byť spawnované na midpointe
- **Anchor logika:** `anchor = midpoint` ak nie je iná pozícia definovaná
- **Typ:** Priamy výpočet midpointu (použitý pre anchor)

### 4.2 PHASE5_CascadeVisuals - Cascade propagation
**Súbor:** `PHASE5_CascadeVisuals.js:626`
```javascript
return sourcePosition.clone().add(targetPosition).multiplyScalar(0.5);
```
- **Typ:** PHASE5 cascade vizualizácie
- **Použitie:** Cascade propagation
- **Kontext:** Používa midpoint pre cascade logiku
- **Dopad:** Cascade efekty môžu byť positionované na midpointe
- **Typ:** Priamy výpočet midpointu

### 4.3 SynergyCascadeFXBridge - Cascade FX bridge
**Súbor:** `SynergyCascadeFXBridge_v1.js:419, 693`
```javascript
? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)  // line 419
? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)  // line 693
```
- **Typ:** Cascade FX bridge
- **Použitie:** Cascade FX prepojenie
- **Kontext:** Používa midpoint pre cascade bridge logiku
- **Dopad:** Cascade efekty prepojené cez midpoint
- **Typ:** Priamy výpočet midpointu

### 4.4 SynergyVFX - Synergy efekty
**Súbor:** `SynergyVFX1_0.js:511`
```javascript
const midpoint = sourcePos.clone().add(targetPos).multiplyScalar(0.5);
```
- **Typ:** Synergy VFX
- **Použitie:** Synergy efekty
- **Kontext:** Používa midpoint pre synergy logiku
- **Dopad:** Synergy efekty môžu byť positionované na midpointe
- **Typ:** Priamy výpočet midpointu

---

## 5. LIGHT/DECORATION OBJEKTY NA MIDPOINTE

### 5.1 LinkEnergyRingSystem - Energy ring burst
**Súbor:** `LinkEnergyRingSystem.js:1220`
```javascript
emitRing(position, color, time, family = 'mythic', context = {}, lodLevel = 0) {
  burst.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE');
  burst.frustumCulled = false;
  burst.position.copy(position);
  burst.userData.family = family;
  burst.userData.context = context || {};

  this.rings.push(burst);
  this.scene.add(burst);
}
```
- **Typ:** Energy ring burst (Mythic/Fracture/Cathedral)
- **Pozícia:** Zadaná pozícia (často midpoint)
- **Kontext:** Spúšťa sa pri energy events na linkoch
- **Dopad:** Ring burst efekt na pozícii (často midpoint)
- **Typ:** Priamy spawn na pozícii (može byť midpoint)

### 5.2 LinkSparkSystem - Spark particles s Bezier
**Súbor:** `LinkSparkSystem.js:19-20, 58-59`
```javascript
uniform vec3 uMid;  // Control point pre Bezier krivku (stred linku)

vec3 getBezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
  float oneMinusT = 1.0 - t;
  return oneMinusT * oneMinusT * p0 +
         2.0 * oneMinusT * t * p1 +
         t * t * p2;
}

vec3 curvePos = getBezierPoint(uStart, uMid, uEnd, aT);
vec3 tangent = normalize(getBezierTangent(uStart, uMid, uEnd, aT));
```
- **Typ:** Spark particle systém
- **Použitie:** Quadratic Bezier krivka s kontrolným bodom v strede
- **Kontext:** Sparks putujú pozdĺž krivky definovanej start-mid-end
- **Dopad:** Stred slúži ako control point pre krivku (ovplyvňuje trajektóriu)
- **Typ:** Derivovaná pozícia (control point pre Bezier)

---

## 6. MICRO EVENT EFEKTY NA MIDPOINTE

### 6.1 _NodeMicroEvents - Harmony flash a chaos spark
**Súbor:** `_NodeMicroEvents.js:844, 872`
```javascript
// Harmony flash
const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
beam.position.copy(midpoint);
beam.lookAt(node2.position);
beam.rotateX(Math.PI / 2);

// Chaos spark
const midpoint = new THREE.Vector3().addVectors(node1.position, node2.position).multiplyScalar(0.5);
spark.position.copy(midpoint);
spark.lookAt(node2.position);
spark.rotateX(Math.PI / 2);
```
- **Typ:** Harmony flash beam a chaos spark
- **Pozícia:** Presne na midpointe
- **Kontext:** Micro event efekty medzi uzlami
- **Dopad:** Beam/spark vizualizácia na strednej pozícii linku, orientovaná pozdĺž linku
- **Rozmery:** Škálované podľa dĺžky linku
- **Typ:** Priamy spawn z midpointu

---

## 7. LOD A LOGIKA SYSTEMS

### 7.1 LinkRendererConduit - LOD výpočty
**Súbor:** `LinkRendererConduit.js:2454, 5051`
```javascript
this._lodMidpoint.copy(start).add(end).multiplyScalar(0.5);
const level = controller.getLODLevel(this._lodMidpoint);

// Iné použitie:
rod.position.copy(v.clone().multiplyScalar(0.5));  // line 5051
```
- **Typ:** Link rendering conduit
- **Použitie:** LOD výpočty vzdialenosti
- **Kontext:** Používa midpoint pre LOD rozhodnutia
- **Dopad:** LOD level založený na vzdialenosti od midpointu
- **Typ:** Logické použitie (LOD)

### 7.2 NodeLinkingSystem - Link creation
**Súbor:** `NodeLinkingSystem.js:5454`
```javascript
const midPos = startPos.clone().add(endPos).multiplyScalar(0.5);
```
- **Typ:** Node linking system
- **Použitie:** Link creation
- **Kontext:** Používa midpoint pri vytváraní liniek
- **Dopad:** Midpoint použitý pri link initialization
- **Typ:** Logické použitie (creation)

### 7.3 TopologyBiasVisualization - Topology vizualizácia
**Súbor:** `TopologyBiasVisualizationLayer.js:669`
```javascript
const midpoint = sourcePos.add(targetPos).multiplyScalar(0.5);
```
- **Typ:** Topology bias vizualizácia
- **Použitie:** Topology výpočty
- **Kontext:** Používa midpoint pre topology logiku
- **Dopad:** Topology efekty môžu byť positionované na midpointe
- **Typ:** Logické/Vizuálne použitie

---

## 8. INÉ GEOMETRICKÉ/SYSTÉMOVÉ POUŽITIA

### 8.1 EnhancedNodeModels - Bridge a tether
**Súbor:** `EnhancedNodeModels.js:28716, 36407, 24217`
```javascript
bridge.position.copy(from).add(to).multiplyScalar(0.5);  // line 28716
tetherScratch.mid.copy(tetherScratch.anchor).add(tetherScratch.target).multiplyScalar(0.5);  // line 36407
bridgeGroup.position.copy(start).add(end).multiplyScalar(0.5);  // line 24217
```
- **Typ:** Node model geometry
- **Použitie:** Bridge a tether positioning
- **Kontext:** Geometrické objekty na strednej pozícii
- **Dopad:** Vizuálne prepojenia na midpointe
- **Typ:** Geometrické použitie

### 8.2 AnimatedLinkFlow - Animated flow
**Súbor:** `AnimatedLinkFlow.js:228`
```javascript
const mid = start.clone().add(end).multiplyScalar(0.5);
```
- **Typ:** Animated link flow
- **Použitie:** Flow animation
- **Kontext:** Používa midpoint pre flow logiku
- **Dopad:** Flow efekty môžu byť positionované na midpointe
- **Typ:** Vizuálne použitie

### 8.3 NeonLinkVisuals - Neon visuals
**Súbor:** `NeonLinkVisuals.js:1022`
```javascript
mid.multiplyScalar(0.5);
```
- **Typ:** Neon link visuals
- **Použitie:** Neon vizualizácie
- **Kontext:** Používa midpoint pre neon logiku
- **Dopad:** Neon efekty môžu byť positionované na midpointe
- **Typ:** Vizuálne použitie

### 8.4 _SafeLegendaryLinkFX - Legendary link FX
**Súbor:** `_SafeLegendaryLinkFX.js:909`
```javascript
midpoint.addVectors(sourcePos, targetPos).multiplyScalar(0.5);
```
- **Typ:** Legendary link FX
- **Použitie:** Legendary vizuálne efekty
- **Kontext:** Používa midpoint pre legendary FX
- **Dopad:** Legendary efekty môžu byť positionované na midpointe
- **Typ:** Vizuálne použitie

### 8.5 Legacy aura systémy
**Súbory:**
- `LEGACY/aura/shaders/LinkAuraSystem_v1.js:568`
- `LEGACY/aura/LinkAuraSystem_v1.js:553`
- `LEGACY/_NeuralCurveLinkVisuals.js:148`
- `LEGACY/SynergyHighways1_0.js:349`

**Všetky používajú:** `multiplyScalar(0.5)` pre midpoint výpočet
- **Typ:** Legacy link vizualizácie
- **Použitie:** Staršie link vizualizačné systémy
- **Kontext:** Používajú midpoint pre legacy logiku
- **Dopad:** Legacy efekty môžu byť positionované na midpointe
- **Typ:** Legacy vizuálne použitie

---

## 9. ROZDELENIE PODĽA TYPU POUŽITIA MIDPOINTU

### 9.1 Priamy spawn z midpointu (vizuálne efekty)
1. **HarmonicRecoveryVisualSystem_Session138** - Recovery zóny (2 výskyty)
2. **ResonanceRuptureVisualSystem_Session133** - Resonance scars (5 výskytov)
3. **_NodeMicroEvents** - Harmony flash a chaos spark (2 výskyty)
4. **LinkEnergyRingSystem** - Energy ring burst (1 výskyt, conditional)

### 9.2 Derivovaná pozícia (control point/modulácia)
1. **LinkTrailParticleSystem** - Trail visibility modulácia (opacity boost pri 0.5)
2. **LinkCorruptionParticleSystem** - Bias toward corruption node (nie fixný midpoint)
3. **LinkSparkSystem** - Bezier control point (stred ovplyvňuje trajektóriu)

### 9.3 Logické použitie (nie vizuálny spawn)
1. **LinkRendererConduit** - LOD výpočty (2 výskyty)
2. **CascadeParticleSystem_Session120** - Conflict detection (2 výskyty)
3. **LinkResonanceFlowSystem_Session124** - LOD výpočty
4. **WaveInterferenceEngine_v1** - Wave interference výpočty
5. **WaveInterferencePatternSystem_Session132** - Wave pattern výpočty (2 výskyty)
6. **HarmonicResonanceFeedbackSystem** - Resonance feedback výpočty
7. **ResonanceCascadeVisualization_Session117B** - Cascade vizualizácie
8. **NodeLinkingSystem** - Link creation
9. **TopologyBiasVisualizationLayer** - Topology výpočty

### 9.4 Anchor/Context pre cascade/synergy efekty
1. **SynergyCascadeVisualizer** - Cascade anchor (4 výskyty)
2. **PHASE5_CascadeVisuals** - Cascade propagation
3. **SynergyCascadeFXBridge_v1** - Cascade FX bridge (2 výskyty)
4. **SynergyVFX1_0** - Synergy efekty
5. **ResonanceCascadeVisualization_Session117B** - Cascade visualization

### 9.5 Geometrické positioning
1. **EnhancedNodeModels** - Bridge a tether (3 výskyty)
2. **AnimatedLinkFlow** - Flow animation
3. **NeonLinkVisuals** - Neon visuals
4. **_SafeLegendaryLinkFX** - Legendary FX
5. **Legacy aura systémy** - Staršie vizualizácie (4 výskyty)

---

## 10. ANALÝZA A POZNÁMKY

### 10.1 Dizajnové rozhodnutia
- **Recovery a rupture efekty** sú explicitne pozicionované na midpointe
- **Particle systémy** používajú midpoint skôr ako modulačný bod než fixný spawn point
- **Wave a resonance systémy** používajú midpoint pre výpočty a LOD
- **Cascade a synergy systémy** používajú midpoint ako anchor/default pozíciu

### 10.2 Výkonnostné dopady
- **Lokálna koncentrácia:** Niekoľko systémov môže mať efekty na tom istom midpointe
- **LOD optimalizácia:** Väčšina systémov používá midpoint pre LOD rozhodnutia
- **Overdraw:** Recovery zóny, scars a energy rings môžu byť aktívne súčasne na midpointe

### 10.3 Vizuálne charakteristiky
- **Orientácia:** Efekty na midpointe sú obvykle orientované pozdĺž linku
- **Škálovanie:** Veľkosť efektov je často závislá na dĺžke linku
- **Layering:** Viacero efektov môže byť aktívnych na rovnom midpointe (recovery + scar + energy ring)

### 10.4 Potenciálne problémy
- **Vizuálny clutter na linkoch:** Príliš veľa efektov na midpointoch
- **Overlap:** Recovery zóny, scars, a cascade efekty môžu byť aktívne súčasne
- **LOD konzistencia:** Nie všetky systémy používajú midpoint pre LOD rovnako
- **Anchor konflikty:** Viacero systémov používa midpoint ako anchor

---

## 11. RECOMMENDÁCIE

### 11.1 Optimalizácia
1. **Centralizovaný midpoint cache:** Jeden zdroj pre midpoint výpočty na linku
2. **LOD konzistencia:** Zjednotiť LOD výpočty založené na midpointe
3. **Effect stacking limit:** Limitovať počet súčasne aktívnych efektov na midpointe
4. **Zdieľané pooly:** Zdieľať resource pooly pre efekty na midpointoch

### 11.2 Vizuálne zlepšenie
1. **Offset management:** Používať systematické offsety pre rozlíšenie vrstiev
2. **Zníženie clutteru:** Limitovať počet súčasne aktívnych efektov na midpointe
3. **Konzistentná orientácia:** Zjednotiť orientáciu efektov na midpointoch
4. **Zjednotené škálovanie:** Konzistentný prístup k škálovaniu efektov podľa dĺžky linku

### 11.3 Architektúra
1. **Midpoint authority:** Jeden centralizovaný systém pre midpoint výpočty
2. **Effect composition:** Lepšia správa stackovania efektov na midpointoch
3. **Event coordination:** Lepšia koordinácia medzi systémami používajúcimi midpoint
4. **Anchor management:** Centralizovaný anchor management pre cascade/synergy efekty

---

**Kľúčové zistenie:** 18 aktívnych efektov priamo používa midpoint linku pre vizuálne efekty (recovery zóny, scars, energy rings, micro events). Ďalších 40+ výskytov je logických/geometrických použítí (LOD, výpočty, anchor positioning). Hlavné riziká sú vizuálny clutter keď viacero efektov beží súčasne na tom istom midpointe a potenciálny overdraw zo semi-transparentných vrstiev.
