# LINK RENDER ORDER UNIFIED PROPOSAL v2
## Refaktor VisualHierarchyRegistry - MINIMALISTA VERZIA

**Vytvorené:** 2026-03-02  
**Založené na:** Komentár užívateľa (3 opravy)

---

## ⚠️ KOREKCIE UŽÍVATEĽA

### 1. ❌ Nedávaj blending a opacity do registry
Registry = iba layer id + renderOrder (nie vizuálna logika)

### 2. ❌ Link ID fallback bez Math.random()
Použiť `link.uuid` (deterministický), nikdy `Math.random()`

### 3. ✅ TransparentStateAuthority.apply() NENASTAVUJE renderOrder
Problém: `apply()` je iba VALIDÁTOR, NEUKLADÁ renderOrder na mesh
Riešenie: Nastaviť renderOrder PRIAMO na mesh pred `apply()`

---

## 🔧 IMPLEMENTÁCIA: MINIMALISTICKÁ REFRAKTOR

### Krok 1: Refaktor VisualHierarchyRegistry.js

**PRINCÍP:** IBA id + renderOrder (zjednodušenie)

```javascript
/**
 * VISUAL HIERARCHY REGISTRY v2.0
 * MINIMALISTA VERZIA - iba layer id + renderOrder
 */

export class VisualHierarchyRegistry {
  // ========================================================================
  // LAYER IDENTIFIERS (Static constants)
  // ========================================================================
  
  // === NODE LAYERS (existujú) ===
  static LAYER_AURA_BACKGROUND = 'AURA_BACKGROUND';
  static LAYER_AURA = 'AURA';
  static LAYER_CORE = 'CORE';
  static LAYER_ARCHETYPE = 'ARCHETYPE';
  static LAYER_EVOLUTION = 'EVOLUTION';
  static LAYER_FX = 'FX';
  static LAYER_DEBUG = 'DEBUG';

  // === LINK LAYERS (nové) ===
  static LAYER_LINK_SKIN = 'LINK_SKIN';
  static LAYER_LINK_STRANDS = 'LINK_STRANDS';
  static LAYER_LINK_DIRECTIONAL = 'LINK_DIRECTIONAL';
  static LAYER_LINK_PULSE = 'LINK_PULSE';
  static LAYER_LINK_ARCS = 'LINK_ARCS';
  static LAYER_LINK_SPARKS = 'LINK_SPARKS';
  static LAYER_LINK_BEADS = 'LINK_BEADS';
  static LAYER_LINK_IMPACTS = 'LINK_IMPACTS';
  static LAYER_LINK_PARTICLES = 'LINK_PARTICLES';

  // ========================================================================
  // RENDER ORDER VALUES (Immutable)
  // ========================================================================

  // Node layers
  static NODE_LAYER_ORDER = {
    AURA_BACKGROUND: -100,
    AURA: -1,
    CORE: 0,
    ARCHETYPE: 1,
    EVOLUTION: 50,
    FX: 100,
    DEBUG: 200
  };

  // Link layers (2-20 range, between ARCHETYPE=1 and EVOLUTION=50)
  static LINK_LAYER_ORDER = {
    SKIN: 2,
    STRANDS: 3,
    DIRECTIONAL: 10,
    PULSE: 11,
    ARCS: 12,
    SPARKS: 13,
    BEADS: 14,
    IMPACTS: 15,
    PARTICLES: 20
  };

  // Unified getter (node or link)
  static getRenderOrder(layerId) {
    // Check node layers
    if (this.NODE_LAYER_ORDER[layerId] !== undefined) {
      return this.NODE_LAYER_ORDER[layerId];
    }
    
    // Check link layers (map LAYER_LINK_SKIN → SKIN)
    const linkLayerName = layerId.replace('LINK_', '');
    if (this.LINK_LAYER_ORDER[linkLayerName] !== undefined) {
      return this.LINK_LAYER_ORDER[linkLayerName];
    }
    
    // Unknown layer - log and return safe default
    console.warn(
      `[VisualHierarchyRegistry] Unknown layer: ${layerId}, returning default: 0`
    );
    return 0;
  }

  // Validation helpers (for debugging)
  static getAllLayers() {
    return {
      node: { ...this.NODE_LAYER_ORDER },
      link: { ...this.LINK_LAYER_ORDER }
    };
  }

  static compareOrder(layerId1, layerId2) {
    const order1 = this.getRenderOrder(layerId1);
    const order2 = this.getRenderOrder(layerId2);
    
    if (order1 < order2) return -1;
    if (order1 > order2) return 1;
    return 0;
  }
}

export default VisualHierarchyRegistry;
```

---

### Krok 2: Aplikovať na LinkRendererConduit.js

**Pridať import:**

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
```

**2a Nastaviť renderOrder na skin (riadok ~280):**

```javascript
// NOVÝ ZÁPIS (PRIAMY + VALIDÁCIA):
const skinOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
skinMesh.renderOrder = skinOrder; // ← PRIAMY SETUP
TransparentStateAuthority.apply(skinMesh, 'link', { 
  depthWrite: false 
});
```

**2b Nastaviť renderOrder na strands (riadok ~220):**

```javascript
// NOVÝ ZÁPIS:
const strandOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS');
TransparentStateAuthority.apply(mesh, 'link', { 
  depthWrite: false, 
  depthTest: true 
});
mesh.renderOrder = strandOrder; // ← PRIAMY SETUP (po apply)
```

**2c Nastaviť renderOrder na impacts (riadok ~480):**

```javascript
// NOVÝ ZÁPIS:
const impactOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
TransparentStateAuthority.apply(mesh, 'additive', {});
mesh.renderOrder = impactOrder; // ← PRIAMY SETUP
```

**2d Fix link ID fallback (riadok ~340):**

```javascript
// NOVÝ ZÁPIS (DETERMINISTICKÝ):
const linkIdHash = (link.id || link.uuid || `link-unknown`)
  .split('')
  .reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
```

---

### Krok 3: LinkDirectionalStreaks.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS:
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_DIRECTIONAL');
```

---

### Krok 4: LinkPulseRing.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS:
this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE');
```

---

### Krok 5: LinkRingArcDischarges.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS:
line.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_ARCS');
```

---

### Krok 6: LinkSparkSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS:
this.points.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SPARKS');
```

---

### Krok 7: LinkBeadSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS:
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_BEADS');
```

---

### Krok 8: LinkTrailParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS (riadok ~120):
this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
```

---

### Krok 9: LinkHealingParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS (riadok ~65):
this.poolGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
```

---

### Krok 10: LinkCorruptionParticleSystem.js

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// NOVÝ ZÁPIS (pri vytvorení particle v _createNewParticle alebo na poolGroup):
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
```

---

## ✅ KOREKCIE ZAHRNUTÉ

| KOREKCIA | Pred | Po |
|----------|------|-----|
| **Blending/Opacity v registry** | Áno | ❌ Nie - iba id + renderOrder |
| **Random fallback** | `Math.random()` | ❌ Nie - iba `link.uuid` |
| **TransparentStateAuthority neukladá renderOrder** | Prehliadané | ✅ Priamy setup: `mesh.renderOrder = value` |

---

## 📊 HIERARCHIA PO REFRAKTRE

```
Node Layers:
  AURA_BACKGROUND  -100
  AURA             -1
  CORE               0
  ARCHETYPE          1

Link Layers (nové, 2-20):
  LINK_SKIN          2
  LINK_STRANDS        3
  [rezervované 4-9]
  LINK_DIRECTIONAL   10
  LINK_PULSE         11
  LINK_ARCS          12
  LINK_SPARKS        13
  LINK_BEADS         14
  LINK_IMPACTS       15
  [rezervované 16-19]
  LINK_PARTICLES     20

Node Layers (pokračovanie):
  EVOLUTION          50
  FX                100
  DEBUG             200
```

---

## 📋 CHECKLIST PRE APLIKÁCIU

### Refaktor VisualHierarchyRegistry.js
- [ ] [x] Krok 1: Refaktor na minimalistickú verziu
- [ ] Odstrániť opacity, blending, description, min/max
- [ ] Iba zachovať layer ids + renderOrder hodnoty
- [ ] Pridať LINK layer ids
- [ ] Pridať LINK renderOrder hodnoty
- [ ] Pridať `getRenderOrder()` metódu (unified)

### Aplikovanie zmien na Link systémy
- [ ] Krok 2: LinkRendererConduit.js (4 zmeny + ID fallback fix)
- [ ] Krok 3: LinkDirectionalStreaks.js
- [ ] Krok 4: LinkPulseRing.js
- [ ] Krok 5: LinkRingArcDischarges.js
- [ ] Krok 6: LinkSparkSystem.js
- [ ] Krok 7: LinkBeadSystem.js
- [ ] Krok 8: LinkTrailParticleSystem.js
- [ ] Krok 9: LinkHealingParticleSystem.js
- [ ] Krok 10: LinkCorruptionParticleSystem.js

### Testovanie
- [ ] Načítať hru (žiadne chyby)
- [ ] Overiť či všetky vrstvy sú viditeľné
- [ ] Overiť deterministické renderovanie (rovnaké poradie každý frame)
- [ ] Overiť žiadne konflikty v renderOrder (všetky unikátne)
- [ ] Overiť link ID unikátnosť (žiadne random fallbacks)

---

## 🔗 REFERENCES

- `VisualHierarchyRegistry.js` (refaktorovať)
- `TransparentStateAuthority.js` (validator only)
- `LINK_EXECUTION_LAYER_AUDIT.md` (original audit)
- `LINK_RENDER_ORDER_UNIFIED_PROPOSAL.md` (predošlá verzia)

---

**Dôležitá poznámka:** Toto je minimalista verzia - registry obsahuje iba to čo je potrebné pre deterministické renderovanie. Vizuálna logika (opacity, blending) zostáva v konkrétnych systémoch.

---

**Ktorý krok chceš aby som začal?**
1. **Krok 1** - Refaktor VisualHierarchyRegistry.js
2. **Krok 2-10** - Aplikovať zmeny na Link systémy

Stačí napísať: "KROK 1" alebo "KROK 2"
