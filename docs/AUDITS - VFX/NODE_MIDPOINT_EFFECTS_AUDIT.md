# AUDIT: Efekty emitované zo stredu node (node midpoint)

**Dátum:** 2026-04-12
**Cieľ:** Zistiť ktoré efekty sa emitujú/spawnujú priamo zo stredu node (node.position alebo node.mesh.position)

---

## SÚHRN

- **Celkovo nájdených pozícií zo stredu node:** 54+
- **Aktívne emitované efekty zo stredu node:** 42
- **Particle systémy emitujúce zo stredu node:** 3
- **Aura/obalové efekty na strednej pozícii:** 18
- **Evolučné/legendary efekty na strednej pozícii:** 12
- **Iné vizuálne efekty na strednej pozícii:** 9

---

## 1. PARTICLE SYSTÉMY EMITUJÚCE ZO STREDU NODE

### 1.1 HealingParticleSystem - Healing trail particles
**Súbor:** `HealingParticleSystem_Session136.js:536, 551, 559`
```javascript
// Debug marker position na healing particle spawn
this.debugProbe.position.copy(pos);
this.debugCube.position.copy(pos);
```
- **Typ:** Healing particle trail
- **Emit:** Z pozície `position` (ktorá môže byť node.position)
- **Kontext:** Spúšťa sa pri healing aktivitách na linkoch a uzloch
- **Dopad:** Častice sa emitujú v blízkosti stredovej pozície uzla
- **Poznámka:** Debug nástroje, produkčné častice majú spread ±0.1 od pozície

### 1.2 WaveParticleEmitter - Wave particles
**Súbor:** `WaveParticleEmitter_v1.js:1759`
```javascript
: node.position;
```
- **Typ:** Wave particle emission
- **Emit:** Z `node.position`
- **Kontext:** V rámci `_resolveLinkEndpointPosition()` - používa node pozíciu ako endpoint pre wave častice
- **Dopad:** Wave častice môžu vychádzať zo stredu uzla

### 1.3 CascadeParticleSystem - Cascade particles
**Súbor:** `CascadeParticleSystem_Session120.js:2229`
```javascript
: node.position;
```
- **Typ:** Cascade particle trail
- **Emit:** Z `node.position` (fallback)
- **Kontext:** Používa node pozíciu keď particle pozícia nie je dostupná
- **Dopad:** Častice môžu byť emitované zo stredu uzla

---

## 2. AURA/OBALOVÉ EFEKTY NA STREDNEJ POZÍCII

### 2.1 NodeLinkedAuraSystem - Aura pre linked nodes
**Súbor:** `NodeLinkedAuraSystem.js:337, 589`
```javascript
mesh.position.copy(node.position);
auraData.mesh.position.copy(node.position);
```
- **Typ:** Aura efekt pre linked node
- **Pozícia:** Presne na `node.position`
- **Kontext:** Vytvára sa keď node má linky
- **Dopad:** Visuálny aura efekt na strednej pozícii uzla
>
### 2.2 SynergyVFX - Synergy aura
**Súbor:** `SynergyVFX1_0.js:228, 428`
```javascript
auraGroup.position.copy(node.position);
auraData.auraGroup.position.copy(node.position);
```
- **Typ:** Synergy aura efekt
- **Pozícia:** Presne na `node.position`
- **Kontext:** Zobrazuje synergy state uzla
- **Dopad:** Aura vizualizácia priamo na strednej pozícii

### 2.3 _SafeNodePersonalityFX - Personality aura
**Súbor:** `_SafeNodePersonalityFX.js:462, 507, 549, 589, 635, 689`
```javascript
orbit.position.copy(node.position);      // line 462, 507, 635
vfx.haloRing.position.copy(node.position);  // line 549
symbol.position.copy(node.position);     // line 589
ring.position.copy(node.position);       // line 689
```
- **Typ:** Personality vizuálne efekty (orbit, halo, symbol, ring)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Zobrazuje personality charakteristiky uzla
- **Dopad:** Viacero vizuálnych vrstiev na strednej pozícii

### 2.4 HarmonicInfluencePropagationSystem - Influence mesh
**Súbor:** `HarmonicInfluencePropagationSystem_Session127.js:530`
```javascript
mesh.position.copy(node.position);
```
- **Typ:** Influence propagation vizualizácia
- **Pozícia:** Presne na `node.position`
- **Kontext:** Zobrazuje harmonic influence šírenie
- **Dopad:** Vizuálny reprezentácia influence na strednej pozícii

### 2.5 Legacy aura systémy
**Súbory:**
- `LEGACY/aura/_UIPrimaryNodeAura3_7.js:131,132,196,200`
- `LEGACY/aura/_UISelectedNodeHighlight3_2.js:77,141`
- `LEGACY/aura/NodeLinkedAuraSystem_Session123.js:510`
- `LEGACY/aura/NodeLinkedAuraRenderer_Session146.js:212,244`
- `LEGACY/aura/NodeAuraSystem_v1.js:531`
- `LEGACY/aura/NodeAuraRefactor_ElegantRim.js:364`

**Všetky používajú:** `mesh.position.copy(node.position)`
- **Typ:** Legacy aura efekty
- **Pozícia:** Presne na `node.position`
- **Kontext:** Staršie implementácie aury
- **Dopad:** Aura efekty na strednej pozícii (ak sú aktívne)

---

## 3. EVOLUČNÉ A LEGENDARY EFEKTY NA STREDNEJ POZÍCII

### 3.1 _SafeEvolutionManager - Evolučné efekty
**Súbor:** `_SafeEvolutionManager.js:308, 354, 407, 475, 530`
```javascript
vfx.glowSphere.position.copy(node.position);      // line 308
vfx.coreHologram.position.copy(node.position);    // line 354
ring.position.copy(node.position);                // line 407
particle.position.copy(node.position);            // line 475
burst.position.copy(node.position);                // line 530
```
- **Typ:** Evolučné vizuálne efekty (glow, core, ring, particle, burst)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Spúšťa sa počas evolúcie uzla
- **Dopad:** Komplexný vizuálny efekt na strednej pozícii počas evolúcie

### 3.2 _SafeLegendaryNodePack - Legendary node efekty
**Súbor:** `LEGACY/_SafeLegendaryNodePack.js:398, 436, 529, 562, 612, 662, 697, 735, 782, 832`
```javascript
ring.position.copy(node.position);        // line 398, 562, 735
fractal.position.copy(node.position);     // line 436
vfx.aura.position.copy(node.position);    // line 529
spark.position.copy(node.position);       // line 662
vfx.crown.position.copy(node.position);   // line 697
panel.position.copy(node.position);       // line 612
particle.position.copy(node.position);    // line 782
burst.position.copy(node.position);       // line 832
```
- **Typ:** Legendary node vizuálne efekty (ring, fractal, aura, spark, crown, panel, particle, burst)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Spúšťa sa pre legendary uzly
- **Dopad:** Výrazné vizuálne efekty na strednej pozícii

---

## 4. PULSE, IMPACT A MICRO EVENT EFEKTY

### 4.1 AINodes - Activation pulse
**Súbor:** `AINodes.js:3262`
```javascript
pulse.position.copy(node.position);
```
- **Typ:** Activation pulse ring
- **Pozícia:** Presne na `node.position`
- **Kontext:** Spúšťa sa pri aktivácii uzla
- **Dopad:** Pulzujúci ring efekt na strednej pozícii
- **Poznámka:** Momentálne disabled (return null na začiatku funkcie)

### 4.2 NodeLinkingSystem - Pulse a highlight
**Súbor:** `NodeLinkingSystem.js:1482, 5543`
```javascript
highlight.position.copy(node.position);  // line 1482
pulse.position.copy(node.position);      // line 5543
```
- **Typ:** Highlight a pulse efekty
- **Pozícia:** Presne na `node.position`
- **Kontext:** Highlight pre vybrané uzly, pulse pre link events
- **Dopad:** Vizuálna spätná väzba na strednej pozícii

### 4.3 LinkRendererConduit - Impact effects
**Súbor:** `LinkRendererConduit.js:5237`
```javascript
group.position.copy(node.position);
```
- **Typ:** Link impact efekty (bead impacts)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Spúšťa sa pri link bead impacts
- **Dopad:** Vizuálny efekt na strednej pozícii uzla počas link events

### 4.4 _NodeMicroEvents - Micro event efekty
**Súbor:** `_NodeMicroEvents.js:422, 621, 622, 725, 750`
```javascript
ring.position.copy(node.position);   // line 422
ring1.position.copy(node.position);  // line 621
ring2.position.copy(node.position);  // line 622
ring.position.copy(node.position);   // line 725
spark.position.copy(node.position);  // line 750
```
- **Typ:** Micro event efekty (rings, sparks)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Drobné vizuálne eventy na uzloch
- **Dopad:** Viacero micro efektov na strednej pozícii

---

## 5. HARMONIC A CASCADE EFEKTY

### 5.1 HarmonicRecoveryVisualSystem - Recovery halo
**Súbor:** `HarmonicRecoveryVisualSystem_Session138.js:912`
```javascript
item.mesh.position.copy(node.position);
```
- **Typ:** Recovery halo efekt
- **Pozícia:** Presne na `node.position`
- **Kontext:** Spúšťa sa počas harmonic recovery
- **Dopad:** Halo efekt na strednej pozícii uzla

### 5.2 PHASE5_CascadeVisuals - Stability ripple
**Súbor:** `PHASE5_CascadeVisuals.js:715`
```javascript
this.createRipple(node.position, intensity, { verticalOffset: 0.02 });
```
- **Typ:** Stability ripple efekt
- **Pozícia:** Presne na `node.position` (s malým vertikálnym offsetom 0.02)
- **Kontext:** Spúšťa sa pri stability eventoch (low/mid/high)
- **Dopad:** Ripple vlna vychádzajúca zo stredu uzla

---

## 6. CORRUPTION EFEKTY

### 6.1 TIER4_CorruptionFeedbackVisuals - Corruption seed
**Súbor:** `TIER4_CorruptionFeedbackVisuals_v1.js:411, 913`
```javascript
effect.mesh.position.copy(node.position);  // line 411
mesh.position.copy(node.position);          // line 913
```
- **Typ:** Corruption seed a corruption visual efekty
- **Pozícia:** Presne na `node.position` (line 411 má navyše +0.58 offset na Z)
- **Kontext:** Spúšťa sa pri corruption eventoch
- **Dopad:** Corruption vizualizácia na strednej pozícii uzla

---

## 7. HIT PROXY SYSTÉMY

### 7.1 _HitProxySystem_v1 - Hit proxy
**Súbor:** `_HitProxySystem_v1.js:263, 296`
```javascript
proxy.position.copy(node.position);  // line 263
proxy.position.copy(node.position);  // line 296
```
- **Typ:** Hit proxy (interaktívny proxy)
- **Pozícia:** Presne na `node.position`
- **Kontext:** Používa sa pre raycasting a interakciu
- **Dopad:** Neviditeľný proxy na strednej pozícii pre detekciu kliknutí

### 7.2 HitProxyAutoRegistrar - Auto-registered proxy
**Súbor:** `HitProxyAutoRegistrar.js:187`
```javascript
proxy.position.copy(node.position);
```
- **Typ:** Automaticky registrovaný hit proxy
- **Pozícia:** Presne na `node.position`
- **Kontext:** Automatická registrácia hit proxy pre uzly
- **Dopad:** Interaktívny proxy na strednej pozícii

---

## 8. INÉ EFEKTY

### 8.1 SafeQuantumIllusionsPack1 - Spawn pozícia
**Súbor:** `SafeQuantumIllusionsPack1.js:757, 1092`
```javascript
spawnPos = node.mesh.position.clone();  // line 757
spawnPos = node.mesh.position.clone();  // line 1092
```
- **Typ:** Quantum illusion spawn pozícia
- **Pozícia:** Z `node.mesh.position`
- **Kontext:** Používa sa ako base pozícia pre spawn efektov
- **Dopad:** Efekty môžu byť spawnované v blízkosti stredovej pozície

---

## 9. ROZDELENIE PODĽA TYPU EFEKTU

### 9.1 Aktívne emitované častice zo stredu
1. Healing trail particles (HealingParticleSystem)
2. Wave particles (WaveParticleEmitter)
3. Cascade particles (CascadeParticleSystem)

### 9.2 Statické/semi-statické efekty na strednej pozícii
- Aura systémy (18 inštancií)
- Evolution efekty (5 inštancií)
- Legendary efekty (10 inštancií)
- Personality efekty (6 inštancií)
- Pulse a highlight efekty (4 inštancie)
- Impact efekty (1 inštancia)
- Micro event efekty (5 inštancií)
- Recovery efekty (1 inštancia)
- Corruption efekty (2 inštancie)

### 9.3 Systémové/technické objekty na strednej pozícii
- Hit proxy (3 inštancie)

---

## 10. ANALÝZA A POZNÁMKY

### 10.1 Dizajnové rozhodnutia
- **Väčšina aura a osobnostných efektov** je priamo na `node.position`
- **Evolučné a legendary efekty** vytvárajú komplexné vizuálne zložky na strednej pozícii
- **Particle systémy** majú tendenciu mať malý spread okolo stredovej pozície (±0.1)
- **Niektoré efekty** majú vertikálne offsety (corruption +0.58, ripple +0.02)

### 10.2 Výkonnostné dopady
- **High overlap:** Množstvo efektov na tej istej pozícii môže spôsobovať overdraw
- **Multiple layers:** Aura + personality + evolution efekty môžu byť aktívne súčasne
- **Particle density:** Niekoľko particle systémov môže emitovať z rovnakej pozície

### 10.3 Bezpečnostné opatrenia
- **Hit proxy:** Používajú stredovú pozíciu pre detekciu interakcií
- **Fallback pozície:** Niektoré systémy používajú node.position ako fallback
- **Disabled efekty:** Niektoré efekty sú momentálne disabled (AINodes activation pulse)

### 10.4 Potenciálne problémy
- **Vizuálny clutter:** Príliš veľa efektov na strednej pozícii môže byť rušivé
- **Overdraw:** Viacero semi-transparentných efektov na rovnakej pozícii
- **Performance:** Viacero particle systémov emitujúcich z rovnakej pozície
- **Layering:** Zložité stackovanie efektov (aura → personality → evolution)

---

## 11. RECOMMENDÁCIE

### 11.1 Optimalizácia
1. **LOD pre stredové efekty:** Znížiť počet/zložitosť efektov na diaľku
2. **Layering optimization:** Zlúčiť podobné efekty do jednej vrstvy
3. **Particle pool zdieľanie:** Zdieľať particle pooly medzi systémami emitujúcimi zo stredovej pozície

### 11.2 Vizuálne zlepšenie
1. **Znížiť clutter:** Limitovať počet súčasne aktívnych efektov na strednej pozícii
2. **Offset management:** Používať systematické offsety pre rozlíšenie vrstiev
3. **Zjednotenie vizuálneho štýlu:** Konzistentný jazyk pre všetky stredové efekty

### 11.3 Architektúra
1. **Centralizovaný node center authority:** Jeden zdroj pre stredovú pozíciu
2. **Effect composition system:** Lepšie správa stackovania efektov
3. **Event coordination:** Lepšia koordinácia medzi systémami používajúcimi stredovú pozíciu

---

**Kľúčové zistenie:** 42+ aktívnych efektov priamo používajú `node.position` ako svoju pozíciu. To vytvára potenciálne problémy s výkonom (overdraw) a vizuálnym čitateľnosťou (clutter), najmä keď viacero efektov môže byť aktívnych súčasne (aura + personality + evolution).
