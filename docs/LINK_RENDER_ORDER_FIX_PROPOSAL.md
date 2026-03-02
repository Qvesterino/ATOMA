# LINK RENDER ORDER FIX PROPOSAL
## Konkrétny návrh na deterministické link vizuály

**Vytvorené:** 2026-03-02  
**Založené na:** LINK_EXECUTION_LAYER_AUDIT.md

---

## 🎯 RIEŠENIE: Jednotný RenderOrder Systém

### Krok 1: Vytvoriť konštantný súbor

**Nový súbor:** `D:\ATOMA_CLEAN\LinkRenderOrder.js`

```javascript
/**
 * LINK RENDER ORDER CONSTANTS
 * Jednotný renderOrder pre všetky link vizuálne vrstvy
 * 
 * Pravidlá:
 * - Vždy o 1 vyššie ako predchádzajúca vrstva
 * - Žiadne duplicity
 * - Strop na 20 (nič nad holografické elementy)
 */

export const LINK_RENDER_ORDER = {
  // === ZÁKLADNÉ VRSTVY ===
  SKIN_AURA: 9,              // Atmosférická aura za lankom
  STRANDS: 10,              // Opletané lano (hlavná geometria)
  
  // === FLOW VRSTVY (nad lankom) ===
  DIRECTIONAL_STREAKS: 11,    // Smerné pruhy (nad strands)
  PULSE_RING: 12,            // Pulzujúci kruh (nad streaks)
  ARC_DISCHARGES: 13,        // Elektrické iskry (nad ring)
  
  // === PARTICLE VRSTVY (nad flow) ===
  SPARKS: 14,               // Iskrý (nad arcs)
  BEADS: 15,                 // Korálky putujúce po lanku
  IMPACTS: 16,               // Dopadové efekty (dočasné)
  
  // === AMBIENT PARTICLES ===
  TRAIL_PARTICLES: 17,       // Stopové particle efekty
  HEALING_PARTICLES: 17,      // Liečivé particle efekty (rovnaký level ako trail)
  CORRUPTION_PARTICLES: 17,   // Korupčné particle efekty (rovnaký level ako trail)
};

export default LINK_RENDER_ORDER;
```

---

### Krok 2: Upraviť LinkRendererConduit.js

**Súbor:** `D:\ATOMA_CLEAN\LinkRendererConduit.js`

#### 2a Pridať import na začiatok

```javascript
// Pridať hneď po ostatných importoch
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 2b Upraviť strand renderOrder (riadok ~220)

```javascript
// Predtým:
TransparentStateAuthority.apply(mesh, 'link', { renderOrder: 10, ... });

// Potom:
TransparentStateAuthority.apply(mesh, 'link', { renderOrder: LINK_RENDER_ORDER.STRANDS, ... });
```

#### 2c Upraviť skin renderOrder (riadok ~280)

```javascript
// Predtým:
TransparentStateAuthority.apply(skinMesh, 'link', { renderOrder: 9, ... });

// Potom:
TransparentStateAuthority.apply(skinMesh, 'link', { renderOrder: LINK_RENDER_ORDER.SKIN_AURA, ... });
```

#### 2d Upraviť impact renderOrder (riadok ~480)

```javascript
// Predtým:
TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: 40, ... });

// Potom:
TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: LINK_RENDER_ORDER.IMPACTS, ... });
```

#### 2e Opraviť link ID fallback (riadok ~340)

```javascript
// Predtým:
const linkIdHash = (link.id || 'default').split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);

// Potom:
const linkIdHash = (link.id || link.uuid || `fallback-${Math.random().toString(36).substr(2, 9)}`)
  .split('')
  .reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```

---

### Krok 3: Upraviť LinkDirectionalStreaks.js

**Súbor:** `D:\ATOMA_CLEAN\LinkDirectionalStreaks.js`

#### 3a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 3b Upraviť renderOrder (riadok ~120)

```javascript
// Predtým:
mesh.renderOrder = 11; // Slightly above strands

// Potom:
mesh.renderOrder = LINK_RENDER_ORDER.DIRECTIONAL_STREAKS;
```

---

### Krok 4: Upraviť LinkPulseRing.js

**Súbor:** `D:\ATOMA_CLEAN\LinkPulseRing.js`

#### 4a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 4b Upraviť renderOrder (riadok ~45)

```javascript
// Predtým:
this.mesh.renderOrder = 11; // Render on top of strands (10)

// Potom:
this.mesh.renderOrder = LINK_RENDER_ORDER.PULSE_RING;
```

---

### Krok 5: Upraviť LinkRingArcDischarges.js

**Súbor:** `D:\ATOMA_CLEAN\LinkRingArcDischarges.js`

#### 5a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 5b Upraviť renderOrder (riadok ~80)

```javascript
// Predtým:
line.renderOrder = 12; // Above ring (11)

// Potom:
line.renderOrder = LINK_RENDER_ORDER.ARC_DISCHARGES;
```

---

### Krok 6: Upraviť LinkSparkSystem.js

**Súbor:** `D:\ATOMA_CLEAN\LinkSparkSystem.js`

#### 6a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 6b Upraviť renderOrder (riadok ~60)

```javascript
// Predtým:
this.points.renderOrder = 12; // Above strands (10) and directional streaks (11)

// Potom:
this.points.renderOrder = LINK_RENDER_ORDER.SPARKS;
```

---

### Krok 7: Upraviť LinkBeadSystem.js

**Súbor:** `D:\ATOMA_CLEAN\LinkBeadSystem.js`

#### 7a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 7b Upraviť renderOrder (riadok ~240)

```javascript
// Predtým:
mesh.renderOrder = 120; // draw over rope strands, below sparks

// Potom:
mesh.renderOrder = LINK_RENDER_ORDER.BEADS;
```

---

### Krok 8: Upraviť LinkTrailParticleSystem.js

**Súbor:** `D:\ATOMA_CLEAN\LinkTrailParticleSystem.js`

#### 8a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 8b Nastaviť renderOrder na poolGroup (riadok ~120)

```javascript
// Pridať po vytvorení poolGroup:
this.poolGroup.renderOrder = LINK_RENDER_ORDER.TRAIL_PARTICLES;
```

---

### Krok 9: Upraviť LinkHealingParticleSystem.js

**Súbor:** `D:\ATOMA_CLEAN\LinkHealingParticleSystem.js`

#### 9a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 9b Nastaviť renderOrder na poolGroup (riadok ~65)

```javascript
// Pridať po vytvorení poolGroup:
this.poolGroup.renderOrder = LINK_RENDER_ORDER.HEALING_PARTICLES;
```

---

### Krok 10: Upraviť LinkCorruptionParticleSystem.js

**Súbor:** `D:\ATOMA_CLEAN\LinkCorruptionParticleSystem.js`

#### 10a Pridať import

```javascript
import { LINK_RENDER_ORDER } from './LinkRenderOrder.js';
```

#### 10b Nastaviť renderOrder na poolGroup (riadok ~40)

```javascript
// Predtým (toto súbor nemal, treba pridať):
// Pridať po vytvorení poolGroup (hneď po line ~40):
// this.poolGroup = new THREE.Group();
// this.poolGroup.renderOrder = LINK_RENDER_ORDER.CORRUPTION_PARTICLES;

// Alebo rovno v update metóde kde sa pridávajú particles do sceny:
particle.mesh.renderOrder = LINK_RENDER_ORDER.CORRUPTION_PARTICLES;
```

---

## 📋 CHECKLIST PRE APLIKÁCIU

### Príprava
- [ ] Vytvoriť nový súbor `D:\ATOMA_CLEAN\LinkRenderOrder.js`
- [ ] Skontrolovať či všetky konštanty sú unikátne

### Aplikovanie zmien
- [ ] LinkRendererConduit.js: Pridať import LINK_RENDER_ORDER
- [ ] LinkRendererConduit.js: Opraviť strand renderOrder (10)
- [ ] LinkRendererConduit.js: Opraviť skin renderOrder (9)
- [ ] LinkRendererConduit.js: Opraviť impact renderOrder (16)
- [ ] LinkRendererConduit.js: Opraviť link ID fallback
- [ ] LinkDirectionalStreaks.js: Pridať import a opraviť renderOrder (11)
- [ ] LinkPulseRing.js: Pridať import a opraviť renderOrder (12)
- [ ] LinkRingArcDischarges.js: Pridať import a opraviť renderOrder (13)
- [ ] LinkSparkSystem.js: Pridať import a opraviť renderOrder (14)
- [ ] LinkBeadSystem.js: Pridať import a opraviť renderOrder (15)
- [ ] LinkTrailParticleSystem.js: Pridať import a nastaviť renderOrder (17)
- [ ] LinkHealingParticleSystem.js: Pridať import a nastaviť renderOrder (17)
- [ ] LinkCorruptionParticleSystem.js: Pridať import a nastaviť renderOrder (17)

### Testovanie
- [ ] Načítať hru (žiadne chyby v konzole)
- [ ] Skontrolovať či všetky vrstvy sú viditeľné
- [ ] Skontrolovať či žiadne konflikty v renderOrder
- [ ] Overiť deterministické renderovanie (rovnaké poradie každý frame)
- [ ] Overiť link ID unikátnosť (žiadne duplicity v hash)

---

## ✅ OČAKÁVANÝ VÝSLEDOK

Pred fixom:
- RenderOrder: 9, 10, 11, 11, 12, 12, 40, 120, 500 (chaotické)
- Konflikty: Pulse Ring vs Directional Streaks, Arc Discharges vs Sparks
- Link ID: Fallback na "default" → hash kolízie

Po fixe:
- RenderOrder: 9, 10, 11, 12, 13, 14, 15, 16, 17 (deterministické)
- Žiadne konflikty: Každá vrstva má unikátne číslo
- Link ID: Unikátne fallbacky → deterministické vizuály

---

## 🚀 RÝCHLE RIEŠENIE (Ak chceš urgentný fix)

Ak chceš vykonať túto zmenu teraz, môžem začať s Krokom 1 (vytvorenie LinkRenderOrder.js) a potom postupne upravovať všetky súbory.

Stačí napísať: **"CHCEM FIX"** a začnem.
