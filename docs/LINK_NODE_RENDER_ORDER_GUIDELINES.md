# LINK & NODE RENDER ORDER GUIDELINES
## Current Stav v2.0 - Obmedzenia a Bezpečnosť

**Vytvorené:** 2026-03-02  
**Verzia:** VisualHierarchyRegistry v2.0  
**Rozhodnutie:** ZACHOVAŤ current stav, Node vizuály < 2

---

## 🎯 PRINCÍP: STRETovÝ Systém

RenderOrder funguje ako **PRIORITA** zobrazovania:
- **Nižšie** = ZOBRAZENÝ VZADU
- **Vyššie** = ZOBRAZENÝ VPREDU

Aby sme zabránili stretom, používame **stretový systém**:

```
Priestor A: Node vizuály                   (nižšie priority)
Priestor B: Link vizuály                    (stredná priority)
Priestor C: Node vysoko-level efekty      (vyššia priority)
```

---

## 📊 CURRENT HIERARCHIA (v2.0)

```
PRIESTOR A: NODE VIZUÁLY (< 2)
├─ AURA_BACKGROUND  -100  ← Rezervované pre background efekty
├─ AURA             -1    ← Halos, ambient polia
├─ CORE               0    ← Hlavná geometria uzlov
└─ ARCHETYPE          1    ← Extreme/archetype geometria

PRIESTOR B: LINK VIZUÁLY (2-20)
├─ LINK_SKIN          2    ← Link aura za lankom
├─ LINK_STRANDS        3    ← Opletané lano (hlavná geometria)
├─ [rezervované 4-9]        ← Rezervované pre future
├─ LINK_DIRECTIONAL    10   ← Smerné pruhy
├─ LINK_PULSE          11   ← Pulzujúci kruh
├─ LINK_ARCS           12   ← Elektrické iskry
├─ LINK_SPARKS         13   ← Iskrý
├─ LINK_BEADS          14   ← Korálky putujúce po lanku
├─ LINK_IMPACTS        15   ← Dopadové efekty
├─ [rezervované 16-19]       ← Rezervované pre future
└─ LINK_PARTICLES      20   ← Ambient particle efekty

PRIESTOR C: NODE VYSOKO-LEVEL EFEKTY (> 20)
├─ EVOLUTION          50   ← Evolučné vizuály, personality
├─ FX                 100  ← Particles, pulses, tranzientné efekty
└─ DEBUG              200  ← Debug overlayy
```

---

## ⚠️ PRVIDLO: NODE < 2 < LINKS

### Povinné pravidlo pre vývojári

```
AK POUŽÍVAŠ NODE VIZUÁL:
  MUSÍ BYŤ renderOrder < 2
  
  (pokiaľ je nad ARCHETYPE=1 a nižšie ako EVOLUTION=50)
```

### Výnimky (povolené)

**NIE POVOLNÉ** používať renderOrder v rozsahu 2-20 pre Node vizuály!

Tento rozsah je **vyhradený** pre Link vizuály.

### Ako dosiahnuť < 2

Ak Node vizuál potrebuje byť "nad ARCHETYPE":

1. **Použiť rezervované priestory** (ak sú dostupné):
   - 2-5: Pre rezervované na future
   - 6-9: Pre rezervované na future

2. **Alebo použiť EVOLUTION (50)**:
   - Pre vysoko-level efekty
   - Personality overlays
   - Corruption/drift effects

---

## 🔍 WHY TOTO PRVIDLO?

### Dôvod: Bezpečnosť a Deterministika

**1. Predchádzanie stretom:**
- Linky majú vyhradený rozsah 2-20
- Node vizuály majú rozsah < 2
- Žiadne prekrytie → deterministické poradie

**2. Budúcnosť:**
- Linky môžu expandovať v rámci 2-20
- Node vizuály môžu expandovať v rámci 2-5 (ak sa uvoľnia)
- Stretové priestory sú definované a jasné

**3. Backward kompatibilita:**
- Súčasná hierarchia sa nemení
- Žiadna potreba refactoru Node vizuálov
- Link systémy majú jasný rozsah

---

## ✅ VALIDÁCIA

### Pre Node vývojári

```javascript
// Predtým ako nastavíš renderOrder na Node vizuál:

import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// 1. Zistiť renderOrder
const renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN'); // Príklad: 2

// 2. Overiť či je < 2
if (renderOrder >= 2 && renderOrder < 50) {
  console.error(
    '[NODE VISUAL] ILLEGAL renderOrder!',
    `Value ${renderOrder} is reserved for Link visuals (2-20)`,
    'Node visuals must be < 2 (between ARCHETYPE=1 and EVOLUTION=50)'
  );
  throw new Error('Illegal renderOrder for Node visual');
}

// 3. Pokračovať s nastavením
mesh.renderOrder = renderOrder;
```

### Pre Link vývojári

```javascript
// Link vizuály automaticky používajú 2-20
// Treba sa uistiť, že nepoužívajú < 2

import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS'); // 3

// Overiť či je v rozsahu 2-20
if (renderOrder < 2 || renderOrder > 20) {
  console.error(
    '[LINK VISUAL] ILLEGAL renderOrder!',
    `Value ${renderOrder} is outside Link range (2-20)`,
    'Link visuals must be between 2 and 20'
  );
  throw new Error('Illegal renderOrder for Link visual');
}

mesh.renderOrder = renderOrder;
```

---

## 🚫 ZAKAZANÉ ROZSAHY

| Rozsah | Použiteľ | Kategoría |
|---------|-----------|-----------|
| < -100 | ❌ Nie | Pod AURA_BACKGROUND |
| -100 to -1 | ✅ Áno | Node background efektory |
| -1 to 0 | ✅ Áno | Node aura → core |
| 0 to 1 | ✅ Áno | Node core → archetype |
| **2 to 20** | ✅ **LINK ONLY** | **Link vizuály (vyhradené)** |
| 21 to 49 | ⚠️ REZERVOVANÉ | Future expansion |
| 50 to 99 | ✅ Áno | Node evolution |
| 100 to 199 | ✅ Áno | FX efekty |
| > 200 | ❌ Nie | Nad DEBUG |

---

## 📋 CHECKLIST PRE VÝVOJ

### Keď pridávaš Node vizuál:

- [ ] Je vizuál pre Node (nie Link)?
- [ ] Bude zobrazený "nad ARCHETYPE" (1)?
- [ ] Ak ÁNO → Použiť renderOrder < 2 ALEBO ≥ 50
- [ ] Validovať pravidlo < 2 pre nad-ARCHETYPE efekty

### Keď pridávaš Link vizuál:

- [ ] Je vizuál pre Link (nie Node)?
- [ ] Bude zobrazený "nad LINK_SKIN" (2)?
- [ ] Použiť renderOrder v rozsahu 2-20
- [ ] Validovať pravidlo 2-20

### Keď upravuješ VisualHierarchyRegistry:

- [ ] Zachovávať Node < 2 pravidlo
- [ ] Zachovávať Link 2-20 pravidlo
- [ ] Rezervované rozsahy zostať rezervované (21-49)
- [ ] Aktualizovať túto dokumentáciu pri zmenách

---

## 🔗 REFERENCES

- `VisualHierarchyRegistry.js` (v2.0) - Centralizovaný renderOrder systém
- `LINK_EXECUTION_LAYER_AUDIT.md` - Original audit
- `LINK_RENDER_ORDER_GAP_ANALYSIS.md` - Analýza stretových priestorov
- `LINK_RENDER_ORDER_UNIFIED_PROPOSAL_V2.md` - Refaktor v2.0

---

## 📌 POZNÁMKA PRE BUDÚCNOSŤ

Ak v budúcnosti potrebuješ expandovať priestory:

**1. Pre Node vizuály:**
- Rezervované 2-5 môžu byť uvoľnené (potom Linky treba posunúť)
- Alebo použiť 6-9 (je stále < 20)

**2. Pre Link vizuály:**
- 21-49 sú rezervované pre future
- Ale treba upraviť pravidlo na 2-49

**3. Pre Node vysoko-level:**
- 26-49 môžu byť použité pre evolution overlays
- Ale treba aktualizovať pravidlo

---

**Dôležité:** Pravidlo "NODE < 2 < LINKS" je **CORE CONSTRAINT** pre deterministické renderovanie. Zmeny musia byť zvážené a dokumentované.
