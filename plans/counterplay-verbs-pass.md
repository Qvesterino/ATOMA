# Counterplay Verbs Pass — Implementation Plan

## Problem Statement

Hráč má dnes dva verbá — `reinforce` a `reroute` — ale oba sú príliš mäkké, príliš permanentné a príliš málo situational. `reinforce` sa dá spamovať takmer bez cooldownu. `reroute` dáva polovičný relief bez viditeľného payoffu. A `abandon` (odstránenie linky) je len fallback, nie legitímna stratégia.

Cieľ: urobiť z toho tri ťažké, čitateľné rozhodnutia:
- **Zachrániť** (reinforce)
- **Obísť** (reroute)
- **Obetovať** (abandon)

---

## 1. Analýza existujúceho stavu

### Reinforce (`NetworkTensionRuntime_v1.tryReinforceCorridor`)
- Trigger: klik na existujúci link
- Efekt: `strain *= 0.64`, `overloadRisk *= 0.7`, `hotspotWeight *= 0.76`
- Trvanie: 5200 ms, Cooldown: 5400 ms
- Cost: `-harmony 0.008`, `+loadPressure 0.018`
- Recovery: `+stability 0.015`, `-corruption 0.008`
- **Problém:** Trvanie a cooldown sú takmer rovnaké → spamovateľné. Cost je nízky. Nie je gatované na reálne ohrozené linky.

### Reroute (`NetworkTensionRuntime_v1.noteLinkCreated`)
- Trigger: vytvorenie nového linku vedľa hotspotu
- Efekt: `hotspotWeight *= (1 - 0.5) = 0.5`, `overloadRisk *= max(0.52, 0.5 + 0.12) = 0.62`
- Trvanie: 4600 ms (quantum 3600, desert 5200)
- Recovery: `+stability 0.012`, `-corruption 0.008`, `-loadPressure 0.005`
- **Problém:** Relief scale 0.5 je príliš slabý. Hráč nevidí okamžitý payoff. Žiadna direct integrácia do hold gate.

### Abandon (implicitný — `NodeLinkingSystem.removeLink`)
- Trigger: klik na existujúci link keď tension runtime nie je dostupný
- Efekt: link sa odstráni, nič viac
- **Problém:** Žiadny bonus za vedome obetovanie koridoru. Hráč je potrestaný, nie odmenený.

---

## 2. Navrhované zmeny

### 2.1 Reinforce — "Zachrániť"

**Zmeny:**
1. **Situational gating:** Reinforce je dostupné len ak link má `hotspotWeight >= hotspotThreshold * 0.85` ALEBO `strain >= releaseThreshold * 0.9`. Inak sa vráti `reason: 'not-threatened'`.
2. **Kratšie trvanie:** Znížiť `reinforceDurationMs` z 5200 na 3200 ms (quantum 2800, desert 3800).
3. **Vyšší cost:** Zvýšiť `reinforceHarmonyCost` z 0.008 na 0.018 a pridať `reinforceStabilityCost: 0.012`.
4. **Post-decay fatigue:** Po vypršaní reinforce sa na 1.5 sekundy aplikuje `strain *= 1.15` (fatigue spike). To zabráni spamu.
5. **Cooldown zvýšenie:** `reinforceCooldownMs` z 5400 na 8200 ms.
6. **Visual feedback:** Emitovať `network:corridorReinforced` event pre VFX systémy.

**Nové profily:**
```javascript
reinforceDurationMs: 3200,      // was 5200
reinforceCooldownMs: 8200,      // was 5400
reinforceStrainScale: 0.58,     // was 0.64 (slightly weaker)
reinforceOverloadScale: 0.65,     // was 0.7
reinforceRecoveryImpulse: 0.012, // was 0.015 (weaker)
reinforceHarmonyCost: 0.018,     // was 0.008
reinforceStabilityCost: 0.012,   // NEW
reinforceLoadCost: 0.022,        // was 0.018
```

### 2.2 Reroute — "Obísť"

**Zmeny:**
1. **Vyšší relief scale:** `rerouteReliefScale` z 0.5 na 0.72 (quantum 0.78, desert 0.65).
2. **Immediate hold gate impact:** Keď `noteLinkCreated` úspešne relieves critical hotspot, emitovať `network:hotspotRelieved` event. `VisualNetworkTimeElasticity_v1` ho konzumuje a okamžite re-evaluuje rewind gate.
3. **Visual feedback:** Emitovať `network:corridorRerouted` event. Link, ktorý bol relieved, dostane `userData.rerouteReliefVisual = true` na 800 ms (pre VFX).
4. **Trvanie:** Zvýšiť `rerouteDurationMs` z 4600 na 5800 ms (quantum 4800, desert 6400).
5. **Recovery boost:** `rerouteRecoveryImpulse.stability` z 0.012 na 0.018.

**Nové profily:**
```javascript
rerouteDurationMs: 5800,         // was 4600
rerouteReliefScale: 0.72,        // was 0.5
rerouteRecoveryImpulse: 0.018,   // was 0.012
```

### 2.3 Abandon — "Obetovať"

**Nový koncept:** Keď hráč vedome odstráni link, ktorý je hotspot ALEBO chokepoint, dostane strategický bonus.

**Implementácia:**
1. **V `NodeLinkingSystem.attemptLink`:** Keď hráč klikne na existujúci link a tension runtime je dostupný, NEodstrániť link okamžite. Namiesto toho:
   - Ak link má `hotspotWeight >= hotspotThreshold` ALEBO `chokepointScore >= chokepointCriticalThreshold * 0.85`, ponúknuť `abandon` flow.
   - `abandon` flow = odstránenie linku + okamžitý bonus.
2. **Abandon bonus:**
   - Všetky linky v rovnakom komponente dostanú `loadPressure -= 0.08` (redistribúcia)
   - Zdrojový a cieľový node dostanú `stability += 0.06`, `corruption -= 0.04`
   - Emitovať `network:corridorAbandoned` event
   - Clear `chokepoint-fragile` rewind block reason pre tento komponent
3. **Hint layer:** Pridať hint `abandonSacrifice` s textom: "Corridor sacrificed. Core lattice relieved."
4. **Cooldown:** Abandon má 4000 ms cooldown na komponente (nie na linku), aby sa nedal spamovať.

**Nová metóda v `NetworkTensionRuntime_v1`:**
```javascript
tryAbandonCorridor(link) {
  // Check if link is actually threatened
  // Apply bonuses to component
  // Emit event
  // Return { applied, reason, bonuses }
}
```

### 2.4 Hold Gate Integrácia

**Zmeny v `VisualNetworkTimeElasticity_v1`:**
1. Pridať listener na `network:hotspotRelieved` a `network:corridorAbandoned`.
2. Pri `hotspotRelieved`: Ak relieved link bol súčasťou `tension-critical` block reason, okamžite re-evaluovať gate.
3. Pri `corridorAbandoned`: Ak abandoned link bol súčasťou `chokepoint-fragile` block reason, okamžite clearovať tento reason pre daný komponent.
4. Pridať `abandonGraceDuration: 2.0` sekundy — po abadone sa hold gate neblokuje na chokepoint dôvody.

### 2.5 Hint Layer

**Nové hinty v `GameplayHintLayer`:**
```javascript
abandonSacrifice: {
  text: (ctx) => `Corridor ${ctx.corridorLabel} sacrificed. Core lattice relieved.`,
  durationMs: 4200,
  priority: 13,
  variant: 'warning'
},
reinforceUnavailable: {
  text: 'Corridor not threatened enough to reinforce.',
  durationMs: 2800,
  priority: 14,
  variant: 'default'
},
rerouteSuccess: {
  text: (ctx) => `Reroute opened. Hotspot ${ctx.hotspotLabel} cooling.`,
  durationMs: 3800,
  priority: 13,
  variant: 'default'
}
```

---

## 3. Súbory na úpravu

| Súbor | Akcia | Riadky (est.) |
|-------|-------|---------------|
| `NetworkTensionRuntime_v1.js` | Upraviť profily, reinforce gating, post-decay fatigue, abandon metóda | ~80 |
| `NodeLinkingSystem.js` | Upraviť `attemptLink` pre abandon flow | ~40 |
| `VisualNetworkTimeElasticity_v1.js` | Pridať event listenery pre hotspotRelieved/corridorAbandoned | ~30 |
| `HUD/GameplayHintLayer.js` | Pridať 3 nové hinty | ~25 |
| `main.js` | Wire abandon event do semantic bus | ~10 |
| `tests/GameplayLoopChecks.js` | Pridať testy pre reinforce gating, reroute relief, abandon bonus | ~60 |

---

## 4. Success Criteria

- [ ] Reinforce je dostupné len na reálne ohrozených linkoch (>85% hotspot threshold)
- [ ] Reinforce trvá max 3.2s a má 8.2s cooldown — nie je spamovateľné
- [ ] Po reinforce sa objaví 1.5s fatigue spike (viditeľný v metrikách)
- [ ] Reroute dáva >=72% relief (viditeľné okamžite v hotspot weight)
- [ ] Reroute na critical hotspot okamžite re-evaluuje hold gate
- [ ] Abandon na hotspot/chokepoint link dáva component-wide load relief
- [ ] Abandon clearuje chokepoint-fragile rewind block reason
- [ ] Hráč vidí hint pri každom z troch verbov
- [ ] Testy prechádzajú: reinforce gating, reroute relief, abandon bonus

---

## 5. Prečo toto je high-leverage

Toto nepridáva nové tlačidlá ani nové systémy. **Mení existujúce verbá tak, aby mali ťažké, čitateľné trade-offy.**

- Reinforce = drahý, dočasný save. Hráč musí rozhodnúť, či stojí za to.
- Reroute = investícia do novej cesty, ktorá okamžite otvára hold gate.
- Abandon = bolestivá, ale legitímna stratégia. Hráč sa učí, že niekedy je lepšie niečo stratiť.

Toto je AAA-tier feel: nie viac featureov, ale **ťažšie rozhodnutia s čitateľnými dôsledkami**.
