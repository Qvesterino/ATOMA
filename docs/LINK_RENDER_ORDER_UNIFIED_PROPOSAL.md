# LINK RENDER ORDER UNIFIED PROPOSAL
## Rozšírenie VisualHierarchyRegistry o Link vizuály

**Vytvorené:** 2026-03-02  
**Princíp:** Link vizuály by mali byť súčasť VisualHierarchyRegistry

---

## 🎯 ARCHITEKTÚRA: Centralizovaný Hierarchy

### VisualHierarchyRegistry (existuje!)

**Súbor:** `D:\ATOMA_CLEAN\VisualHierarchyRegistry.js`

**Current Layers (Node vizuály):**
```
AURA_BACKGROUND  -100  ← Rezervované pre budúce efekty
AURA            -1    ← Halos, ambient polia (za všetkým)
CORE              0    ← Hlavná geometria uzlov
ARCHETYPE         1    ← Extreme/archetype geometria
EVOLUTION        50    ← Evolučné vizuály, personality
FX               100   ← Particles, pulses, tranzientné efekty
DEBUG            200   ← Debug overlayy
```

### Navrhované Link Layers (nové!)

**Princíp:** Linky sú medzi ARCHETYPE (1) a EVOLUTION (50), teda rozsah 2-49

```javascript
static LAYER_LINK_SKIN = 'LINK_SKIN';
static LAYER_LINK_STRANDS = 'LINK_STRANDS';
static LAYER_LINK_DIRECTIONAL = 'LINK_DIRECTIONAL';
static LAYER_LINK_PULSE = 'LINK_PULSE';
static LAYER_LINK_ARCS = 'LINK_ARCS';
static LAYER_LINK_SPARKS = 'LINK_SPARKS';
static LAYER_LINK_BEADS = 'LINK_BEADS';
static LAYER_LINK_IMPACTS = 'LINK_IMPACTS';
static LAYER_LINK_PARTICLES = 'LINK_PARTICLES';
```

**Rozsah 2-49:**
```
LINK_SKIN           2   ← Link aura (za lankom)
LINK_STRANDS         3   ← Opletané lano (hlavná geometria)
LINK_DIRECTIONAL    10   ← Smerné pruhy (nad strands)
LINK_PULSE          11   ← Pulzujúci kruh (nad directional)
LINK_ARCS           12   ← Elektrické iskry (nad pulse)
LINK_SPARKS         13   ← Iskrý (nad arcs)
LINK_BEADS          14   ← Korálky putujúce po lanku
LINK_IMPACTS        15   ← Dopadové efekty (dočasné)
LINK_PARTICLES      20   ← Ambient particle efekty
```

---

## 🔧 IMPLEMENTÁCIA

### Krok 1: Rozšíriť VisualHierarchyRegistry.js

**Pridať do static LAYERS objektu:**

```javascript
// VisualHierarchyRegistry.js, v LAYERS objekt

// === LINK VISUALS (Between ARCHETYPE=1 and EVOLUTION=50) ===
LINK_SKIN: {
  id: 'LINK_SKIN',
  name: 'Link Skin Aura',
  renderOrder: 2,
  description: 'Link atmosphere aura behind rope geometry',
  opacity: { min: 0.05, max: 0.15 },
  blending: 'additive'
},
LINK_STRANDS: {
  id: 'LINK_STRANDS',
  name: 'Link Strands (Rope)',
  renderOrder: 3,
  description: 'Braided rope geometry - main link structure',
  opacity: { min: 0.8, max: 1.0 },
  blending: 'normal'
},
LINK_DIRECTIONAL: {
  id: 'LINK_DIRECTIONAL',
  name: 'Directional Streaks',
  renderOrder: 10,
  description: 'Flow visualization along links',
  opacity: { min: 0.3, max: 0.9 },
  blending: 'normal'
},
LINK_PULSE: {
  id: 'LINK_PULSE',
  name: 'Pulse Ring',
  renderOrder: 11,
  description: 'Energy carrier ring traveling along link',
  opacity: { min: 0.4, max: 1.0 },
  blending: 'additive'
},
LINK_ARCS: {
  id: 'LINK_ARCS',
  name: 'Arc Discharges',
  renderOrder: 12,
  description: 'Electric sparks triggered by pulse ring',
  opacity: { min: 0.6, max: 1.0 },
  blending: 'additive'
},
LINK_SPARKS: {
  id: 'LINK_SPARKS',
  name: 'Link Sparks',
  renderOrder: 13,
  description: 'Micro-friction and tension indicators',
  opacity: { min: 0.2, max: 0.8 },
  blending: 'additive'
},
LINK_BEADS: {
  id: 'LINK_BEADS',
  name: 'Link Beads',
  renderOrder: 14,
  description: 'Traveling particles along links',
  opacity: { min: 0.6, max: 1.0 },
  blending: 'normal'
},
LINK_IMPACTS: {
  id: 'LINK_IMPACTS',
  name: 'Link Impacts',
  renderOrder: 15,
  description: 'Transient hit effects at nodes',
  opacity: { min: 0.3, max: 1.0 },
  blending: 'additive'
},
LINK_PARTICLES: {
  id: 'LINK_PARTICLES',
  name: 'Link Particles (Trail/Healing/Corruption)',
  renderOrder: 20,
  description: 'Ambient particle effects along links',
  opacity: { min: 0.2, max: 0.8 },
  blending: 'additive'
}
```

**Pridať na začiatok súboru (static konštanty):**

```javascript
// VisualHierarchyRegistry.js, hneď po existing LAYER konštantách

static LAYER_LINK_SKIN = 'LINK_SKIN';
static LAYER_LINK_STRANDS = 'LINK_STRANDS';
static LAYER_LINK_DIRECTIONAL = 'LINK_DIRECTIONAL';
static LAYER_LINK_PULSE = 'LINK_PULSE';
static LAYER_LINK_ARCS = 'LINK_ARCS';
static LAYER_LINK_SPARKS = 'LINK_SPARKS';
static LAYER_LINK_BEADS = 'LINK_BEADS';
static LAYER_LINK_IMPACTS = 'LINK_IMPACTS';
static LAYER_LINK_PARTICLES = 'LINK_PARTICLES';
```

---

### Krok 2: Upraviť LinkRendererConduit.js

**Pridať import:**

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
```

**Opraviť strand renderOrder:**

```javascript
// Predtým (riadok ~220):
TransparentStateAuthority.apply(mesh, 'link', { renderOrder: 10, ... });

// Potom:
TransparentStateAuthority.apply(mesh, 'link', {
  renderOrder: VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS', 3),
  ...
});
```

**Opraviť skin renderOrder:**

```javascript
// Predtým (riadok ~280):
TransparentStateAuthority.apply(skinMesh, 'link', { renderOrder: 9, ... });

// Potom:
TransparentStateAuthority.apply(skinMesh, 'link', {
  renderOrder: VisualHierarchyRegistry.getRenderOrder('LINK_SKIN', 2),
  ...
});
```

**Opraviť impact renderOrder:**

```javascript
// Predtým (riadok ~480):
TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: 40, ... });

// Potom:
TransparentStateAuthority.apply(mesh, 'additive', {
  renderOrder: VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS', 15),
  ...
});
```

**Opraviť link ID fallback (riadok ~340):**

```javascript
// Predtým:
const linkIdHash = (link.id || 'default').split('').reduce(...);

// Potom:
const linkIdHash = (link.id || link.uuid || `link-${Math.random().toString(36).substr(2, 9)}`)
  .split('')
  .reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```

---

### Krok 3: Upraviť LinkDirectionalStreaks.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Predtým (riadok ~120):
mesh.renderOrder = 11;

// Potom:
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_DIRECTIONAL', 10);
```

---

### Krok 4: Upraviť LinkPulseRing.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Predtým (riadok ~45):
this.mesh.renderOrder = 11;

// Potom:
this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE', 11);
```

---

### Krok 5: Upraviť LinkRingArcDischarges.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Predtým (riadok ~80):
line.renderOrder = 12;

// Potom:
line.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_ARCS', 12);
```

---

### Krok 6: Upraviť LinkSparkSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Predtým (riadok ~60):
this.points.renderOrder = 12;

// Potom:
this.points.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SPARKS', 13);
```

---

### Krok 7: Upraviť LinkBeadSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Predtým (riadok ~240):
mesh.renderOrder = 120;

// Potom:
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_BEADS', 14);
```

---

### Krok 8: Upraviť LinkTrailParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Pridať po vytvorení poolGroup (riadok ~120):
this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES', 20);
```

---

### Krok 9: Upraviť LinkHealingParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Pridať po vytvorení poolGroup (riadok ~65):
this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES', 20);
```

---

### Krok 10: Upraviť LinkCorruptionParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Pridať renderOrder na particle meshes v _createNewParticle():
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES', 20);

// Alebo nastaviť na poolGroup ak existuje:
this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES', 20);
```

---

## ✅ VÝHODNOSŤ TOHTO RIEŠENIA

### vs. Samostatný LinkRenderOrder.js súbor

| Aspekt | LinkRenderOrder.js (samostatný) | VisualHierarchyRegistry (centralizovaný) |
|---------|-----------------------------------|--------------------------------------|
| **Konflikty** | Možné ak sa prepínu rozsahy | ❌ Žiadne - centralizovaný |
| **Správovanie** | Dva súbory na údržbu | ✅ Jeden súbor na všetko |
| **Discoverability** | Treba pamätať dva súbory | ✅ Všetko na jednom mieste |
| **Konzistencia** | Riziko rozdielnych hodnôt | ✅ Jednotný systém |
| **Rozšírenie** | Treba pridávať na dvoch miestach | ✅ Pridávať na jednom mieste |

### Hierarchie po fixe

```
Node Layers:
  AURA_BACKGROUND    -100
  AURA               -1
  CORE                0
  ARCHETYPE           1
  ↓ (gap: 2-9 reserved for future)
Link Layers:
  LINK_SKIN           2
  LINK_STRANDS         3
  [rezervované 4-9]
  LINK_DIRECTIONAL    10
  LINK_PULSE          11
  LINK_ARCS           12
  LINK_SPARKS         13
  LINK_BEADS          14
  LINK_IMPACTS        15
  [rezervované 16-19]
  LINK_PARTICLES      20
Node Layers (pokračovanie):
  EVOLUTION           50
  FX                 100
  DEBUG              200
```

---

## 📋 CHECKLIST

- [ ] **Krok 1:** Rozšíriť VisualHierarchyRegistry.js o 9 Link layers
- [ ] **Krok 2:** Upraviť LinkRendererConduit.js (4 zmeny + ID fallback)
- [ ] **Krok 3-10:** Upraviť ostatných 7 súborov s LinkRenderOrder

- [ ] **Test:** Načítať hru (žiadne chyby)
- [ ] **Test:** Overiť vizuálne rozmiestnenie (Node vs Link vs FX)
- [ ] **Test:** Overiť deterministické renderovanie

---

## 🔗 REFERENCES

- `VisualHierarchyRegistry.js` – Centralizovaný renderOrder systém
- `LINK_EXECUTION_LAYER_AUDIT.md` – Original audit
- `LINK_RENDER_ORDER_FIX_PROPOSAL.md` – Predchádzajúci návrh (samostatný súbor)

---

**Odporúčanie:** Použiť toto centralizované riešenie namiesto samostatného LinkRenderOrder.js.
