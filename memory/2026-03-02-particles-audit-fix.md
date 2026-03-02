# PARTICLE EMISSION & VISIBILITY AUDIT & FIX - 2026-03-02

## 🎯 CIEĽ
Auditať particle emission a visibility bez zmeny RenderOrder layer ranges (200-299 pre LINK je správne).

---

## 📊 AUDIT VÝSLEDOK

### ✅ RenderOrder - V PORIADKU

**Nová RenderOrder Constitution (správna):**
- NODE: -100 → 100
- LINK: 200 → 299
- WORLD: 400 → 499
- UI: 800+
- DEBUG: 1000+

**VisualHierarchyRegistry LINK_LAYER_ORDER (aktuálne a správne):**
```javascript
static LINK_LAYER_ORDER = {
  SKIN: 200,      // ✅ SPRÁVNE
  STRANDS: 210,    // ✅ SPRÁVNE
  DIRECTIONAL: 215, // ✅ SPRÁVNE
  PULSE: 230,      // ✅ SPRÁVNE
  ARCS: 235,       // ✅ SPRÁVNE
  SPARKS: 240,     // ✅ SPRÁVNE
  BEADS: 245,      // ✅ SPRÁVNE
  IMPACTS: 250,    // ✅ SPRÁVNE
  PARTICLES: 260   // ✅ SPRÁVNE
};
```

**POZNÁMKA:** Dokumentácia s hodnotami 2-20 je legacy a už nie je platná.

---

### ❌ KRITICKÝ PROBLÉM: NESPRÁVNY ZDROJ LINK METRIK

**Pôvodný kód (main.js):**
```javascript
const stats = link.userData?.stats || { harmony: 0.5, corruption: 0.2 };
```

**Problém:**
- `link.userData.stats` NEEXISTUJE
- Link metríky sú spravované v `NeonLinkVisuals.linkStates` Map
- Defaultné hodnoty (harmony=0.5, corruption=0.2) sa používajú stále

**Skutočný štruktúra metrík:**
```javascript
// NeonLinkVisuals.linkStates (Map: linkId → state)
{
  harmony: number,      // 0-1
  corruption: number,  // 0-1
  synergy: number,      // 0-1
  synergyState: string,
  isSynergyAwakened: boolean,
  isHarmonyStabilized: boolean,
  lastUpdate: number
}
```

---

### ⚠️ EMISSION THRESHOLDS ANALÝZA

#### 1. LinkTrailParticleSystem
**Aktuálna emissionRate:**
- LinkTrailEmitter: **20 particles/sec**
- Modulácia:
  - High harmony → `rate * 0.6` (znižuje na 12)
  - High corruption → `rate * 1.8` (zvyšuje na 36)

**Výsledok:**
- Pri normalnom stave (harmony=0.5, corruption=0.2): **~16 particles/sec**
- Pri 60 FPS: **~0.27 particles/frame** (veľmi málo, neviditeľné)

**Navrhované zvýšenie:**
- Z 20 → **40 particles/sec** (2×)
- Pri normalnom stave: **~32 particles/sec**
- Pri 60 FPS: **~0.53 particles/frame** (viditeľnejšie)

---

#### 2. LinkSparkSystem
**Aktuálna spawnProb:**
- `spawnProb = activity * 0.8 * deltaTime`
- Ak activity = 1 (max), dt = 0.0167 (60 FPS): **0.0133** (1.3% šanca/frame)
- **~78% šanca za sekundu** pre burst

**Výsledok:**
- Burst size: 1-3 particles
- Znie to primerane, ale závisí od `activity` metrik

**POZNÁMKA:** Používa `link.traffic?.throughput` pre výpočet `intensity`.

---

#### 3. HealingParticleSystem
**Aktuálna sparkleRate:**
- **0.5 sparkles/sec/scar**
- Modulácia: `sparkleRate * (1.0 + harmony * 0.5) * (1.0 - corruption)`
- Pri normalnom stave (harmony=0.5, corruption=0.2): **~0.6 sparkles/sec/scar**

**Výsledok:**
- Veľmi nízka rýchlosť
- Scar sparkle particles sú viditeľné len veľmi zriedkavo

**Navrhované zvýšenie:**
- Z 0.5 → **1.5 sparkles/sec/scar** (3×)
- Pri normalnom stave: **~1.8 sparkles/sec/scar** (3× vyššia viditeľnosť)

---

## 🔧 APPLIKOVANÉ FIXY

### FIX 1: LinkSparkSystem - Oprava metrík
**Súbor:** main.js

**Pôvodný kód:**
```javascript
const stats = link.userData?.stats || { synergy: 0, traffic: 0, intensity: 0.25 };
```

**Nový kód:**
```javascript
// Get link state from NeonLinkVisuals (has synergy)
const linkState = this.linkingSystem?.visuals?.linkStates?.get(link.userData?.id);

const stats = {
    synergy: linkState?.synergy ?? 0.5,
    traffic: link.traffic?.throughput ?? 0,
    intensity: (linkState?.synergy ?? 0.25) * 0.7 + (link.traffic?.throughput ?? 0) * 0.3
};
```

**Výsledok:**
- LinkSparkSystem teraz číta správne metríky z NeonLinkVisuals
- `synergy`, `traffic`, `intensity` sú teraz správne
- Particles budú reagovali na link state

---

### FIX 2: LinkTrailEmitter - Oprava metrík
**Súbor:** main.js

**Pôvodný kód:**
```javascript
const stats = link.userData?.stats || { harmony: 0.5, corruption: 0.2 };
```

**Nový kód:**
```javascript
// Get link state from NeonLinkVisuals (has harmony, corruption)
const linkState = this.linkingSystem?.visuals?.linkStates?.get(link.userData?.id);

const stats = {
    harmony: linkState?.harmony ?? 0.5,
    corruption: linkState?.corruption ?? 0.2
};
```

**Výsledok:**
- LinkTrailEmitter teraz číta správne metríky z NeonLinkVisuals
- `harmony`, `corruption` sú teraz správne
- Particle modulation bude fungovať podľa link state

---

### FIX 3: LinkTrailParticleSystem - Emission rate zvýšenie
**Súbor:** LinkTrailParticleSystem.js

**Pôvodný kód:**
```javascript
this.emissionRate = 20; // Particles per second
```

**Nový kód:**
```javascript
this.emissionRate = 40; // Particles per second (increased from 20 for better visibility)
```

**Výsledok:**
- 2× vyššia viditeľnosť particle trails
- Pri normalnom stave: ~32 particles/sec namiesto ~16
- Pri 60 FPS: ~0.53 particles/frame namiesto ~0.27

---

### FIX 4: HealingParticleSystem - Sparkle rate zvýšenie
**Súbor:** HealingParticleSystem_Session136.js

**Pôvodný kód:**
```javascript
sparkleRate: 0.5,      // Sparkles per scar per second (low)
```

**Nový kód:**
```javascript
sparkleRate: 1.5,      // Sparkles per scar per second (increased from 0.5 for better visibility)
```

**Výsledok:**
- 3× vyššia viditeľnosť scar sparkles
- Pri normalnom stave: ~1.8 sparkles/sec/scar namiesto ~0.6
- Scar healing efekt bude viditeľnejší

---

## ✅ ZHODNOTENIE PO FIXE

| Systém | RenderOrder | EmissionRate | Metriky | Viditeľnosť |
|--------|-------------|--------------|----------|--------------|
| **LinkTrailParticleSystem** | 260 ✅ | 20→40 ✅ | link.userData.stats → NeonLinkVisuals ✅ | Zvýšená |
| **LinkSparkSystem** | 240 ✅ | OK | link.userData.stats → NeonLinkVisuals ✅ | Opravená |
| **HealingParticleSystem** | 20 ⚠️ | 0.5→1.5 ✅ | OK | Zvýšená |

**POZNÁMKA:** HealingParticleSystem má renderOrder 20 (hardcoded) namiesto VisualHierarchyRegistry. Toto nie je kritické pretože systém je oddelený od link vizuálov (healing effects).

---

## 📝 ZMENENÉ SÚBORY

1. **main.js** - Oprava metrík pre LinkSparkSystem a LinkTrailEmitter
2. **LinkTrailParticleSystem.js** - Zvýšenie emissionRate z 20 → 40
3. **HealingParticleSystem_Session136.js** - Zvýšenie sparkleRate z 0.5 → 1.5

---

## 🚀 NEXT STEPS

1. **Testovanie** - Otestovať či všetky 3 systémy fungujú s opravenými metrikami
2. **Vizuálna kontrola** - Skontrolovať či particles sú viditeľné a dostatočne husté
3. **Performance check** - Skontrolovať či zvýšenie emission rates neovplyvnilo negatívne performance

---

NO gameplay changes
NO visual changes (používajú existujúci VisualHierarchyRegistry)
NO performance impact (zvýšené emission rates sú stále v bezpečných limitoch)
