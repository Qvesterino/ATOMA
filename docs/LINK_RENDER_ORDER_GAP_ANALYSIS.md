# LINK RENDER ORDER GAP ANALYSIS
## Konflikt s Node visual evolúciou?

**Vytvorené:** 2026-03-02  
**Problém:** Linky (2-20) môžu "stlačiť" node vizuály ak nemajú dostatok priestoru

---

## 🔍 AKO FUNGUJE RENDERORDER

RenderOrder NIE JE priestor (X/Y/Z), ale **PRIORITA** zobrazovania:

- **NIŽŠIE hodnota** = ZOBRAZENÝ SKÔR (vzadu)
- **VYŠŠIA hodnota** = ZOBRAZENÝ NAKONIEC (vpredu)

**Príklad:**
```
AURA (-1)    ← zobrazí sa NAJVÝCHODNEJ (vzadu)
CORE (0)      ← zobrazí sa nad AURA
ARCHETYPE (1)  ← zobrazí sa nad CORE
LINK_SKIN (2) ← zobrazí sa nad ARCHETYPE ← LINKY VYHRADUJÚ PRIESTOR
EVOLUTION (50) ← zobrazí sa nad všetkým linkami (veľká medzera)
```

---

## ⚠️ PROBLÉM: STRETové PRIESTORY

### Current hierarchia (po KROKU 1)

```
Node:   AURA -100, AURA -1, CORE 0, ARCHETYPE 1
Link:    SKIN 2, STRANDS 3, DIRECTIONAL 10, PULSE 11, ARCS 12, SPARKS 13, BEADS 14, IMPACTS 15, PARTICLES 20
Node:   EVOLUTION 50, FX 100, DEBUG 200
```

### Konflikt scenár

**1. Node personality overlays:**
- Sú nad ARCHETYPE (1)
- Ale linky (2-20) sú "priamo nad" ARCHETYPE
- Ak je personality overlay renderOrder = 2, bude **rovnaká ako LINK_SKIN**
- Result: Visual flicker (nezistiteľné poradie)

**2. Node corruption effects:**
- Sú okolo CORE (0)
- Ale LINK_SKIN (2) je "priamo nad" CORE
- Ak je corruption overlay renderOrder = 2, bude **rovnaká ako LINK_SKIN**

**3. Node evolution transitions:**
- Sú medzi ARCHETYPE (1) a EVOLUTION (50)
- Linky (2-20) sú v tomto rozsahu
- Ak je evolution transition renderOrder = 10, bude **rovnaká ako LINK_DIRECTIONAL**

---

## ✅ NAVRHované RIEŠENIE: REZERVované Stretové Priestory

### Princíp
Vytvoriť **stretové zóny** medzi Node a Link layers:

```
Node:   AURA -100, AURA -1, CORE 0, ARCHETYPE 1

[STRETová ZÓNA 1: Node personality overlays]
NODE_PERSONALITY  2-5

[STRETová ZÓNA 2: Node corruption/drift effects]
NODE_CORRUPTION    6-9

[LINK ZÓNA: Link vizuály]
LINK_SKIN          10
LINK_STRANDS        11
LINK_DIRECTIONAL    15
LINK_PULSE          16
LINK_ARCS           17
LINK_SPARKS         18
LINK_BEADS          19
LINK_IMPACTS        20
LINK_PARTICLES      25

[STRETová ZÓNA 3: Node evolution transitions]
NODE_EVOLUTION_LOW 26-30
NODE_EVOLUTION_HIGH 31-40

Node:   EVOLUTION 50, FX 100, DEBUG 200
```

### Výhody

1. **Oddelené priestory** pre node a link vizuály
2. **Priestor na expandovanie** - každá kategória má rezervovanú zónu
3. **Jednoduché rozšírenie** - nové node vizuály môžu použiť stretové zóny
4. **Deterministické** - žiadne kolízie

### Nevýhody

1. **Menšie číslovanie** - Linky sú teraz 10-25 (namiesto 2-20)
2. **Zmena hierarchie** - treba prispôsobiť súčasný kód

---

## 🔧 IMPLEMENTÁCIA: VisualHierarchyRegistry v3.0

### Zmena v VisualHierarchyRegistry.js

```javascript
/**
 * VISUAL HIERARCHY REGISTRY v3.0
 * STRETové ZÓNY pre oddelenie Node a Link vizuálov
 */

export class VisualHierarchyRegistry {
  // ========================================================================
  // NODE LAYER IDENTIFIERS (existing)
  // ========================================================================
  
  static LAYER_AURA_BACKGROUND = 'AURA_BACKGROUND';
  static LAYER_AURA = 'AURA';
  static LAYER_CORE = 'CORE';
  static LAYER_ARCHETYPE = 'ARCHETYPE';
  static LAYER_EVOLUTION = 'EVOLUTION';
  static LAYER_FX = 'FX';
  static LAYER_DEBUG = 'DEBUG';

  // ========================================================================
  // NEW: NODE STRET LAYER IDENTIFIERS
  // ========================================================================
  
  static LAYER_NODE_PERSONALITY = 'NODE_PERSONALITY';
  static LAYER_NODE_CORRUPTION = 'NODE_CORRUPTION';
  static LAYER_NODE_EVOLUTION_LOW = 'NODE_EVOLUTION_LOW';
  static LAYER_NODE_EVOLUTION_HIGH = 'NODE_EVOLUTION_HIGH';

  // ========================================================================
  // LINK LAYER IDENTIFIERS (existing)
  // ========================================================================
  
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
  // NODE RENDER ORDER VALUES (expanded with stretch zones)
  // ========================================================================

  static NODE_LAYER_ORDER = {
    // Base node layers
    AURA_BACKGROUND: -100,
    AURA: -1,
    CORE: 0,
    ARCHETYPE: 1,

    // Stretch zone 1: Node personality overlays (2-5)
    PERSONALITY_OVERLAY_1: 2,
    PERSONALITY_OVERLAY_2: 3,
    PERSONALITY_OVERLAY_3: 4,
    PERSONALITY_OVERLAY_4: 5,

    // Stretch zone 2: Node corruption/drift effects (6-9)
    NODE_CORRUPTION_1: 6,
    NODE_CORRUPTION_2: 7,
    NODE_CORRUPTION_3: 8,
    NODE_CORRUPTION_4: 9,

    // High-level node layers
    EVOLUTION: 50,
    FX: 100,
    DEBUG: 200
  };

  // ========================================================================
  // LINK RENDER ORDER VALUES (shifted to 10-25 range)
  // ========================================================================

  static LINK_LAYER_ORDER = {
    SKIN: 10,
    STRANDS: 11,
    DIRECTIONAL: 15,
    PULSE: 16,
    ARCS: 17,
    SPARKS: 18,
    BEADS: 19,
    IMPACTS: 20,
    PARTICLES: 25
  };

  // ========================================================================
  // STRET ZONE HELPER (for node visuals that need "gap" space)
  // ========================================================================

  /**
   * Get renderOrder for a node visual in a specific stretch zone
   * 
   * @param {string} zone - 'PERSONALITY' or 'CORRUPTION'
   * @param {number} index - Sub-index within zone (0-3)
   * @returns {number} renderOrder value
   * 
   * @example
   *   // Personality overlay 1 (lowest in personality zone)
   *   const order1 = VisualHierarchyRegistry.getStretchOrder('PERSONALITY', 0); // Returns 2
   *   
   *   // Personality overlay 4 (highest in personality zone)
   *   const order4 = VisualHierarchyRegistry.getStretchOrder('PERSONALITY', 3); // Returns 5
   *   
   *   // Corruption overlay 1
   *   const corr1 = VisualHierarchyRegistry.getStretchOrder('CORRUPTION', 0); // Returns 6
   */
  static getStretchOrder(zone, index) {
    if (zone === 'PERSONALITY') {
      return 2 + Math.min(3, Math.max(0, index));
    }
    
    if (zone === 'CORRUPTION') {
      return 6 + Math.min(3, Math.max(0, index));
    }
    
    console.warn(`[VisualHierarchyRegistry] Unknown stretch zone: ${zone}`);
    return 0;
  }

  // Updated getRenderOrder() to support stretch zones
  static getRenderOrder(layerId) {
    // Check node layers first
    if (this.NODE_LAYER_ORDER[layerId] !== undefined) {
      return this.NODE_LAYER_ORDER[layerId];
    }
    
    // Check stretch zones
    if (layerId === 'NODE_PERSONALITY') {
      return this.getStretchOrder('PERSONALITY', 0); // Default: first personality slot
    }
    if (layerId === 'NODE_CORRUPTION') {
      return this.getStretchOrder('CORRUPTION', 0); // Default: first corruption slot
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

  // ... rest of methods unchanged ...
}
```

---

## 📊 HIERARCHIA PO NAVRHU

```
Node:   AURA_BACKGROUND -100, AURA -1, CORE 0, ARCHETYPE 1

[Stret Zone 1: Node Personality Overlays (2-5)]
        PERSONALITY_OVERLAY_1 2, OVERLAY_2 3, OVERLAY_3 4, OVERLAY_4 5

[Stret Zone 2: Node Corruption/Drift Effects (6-9)]
        NODE_CORRUPTION_1 6, _2 7, _3 8, _4 9

[Link Zone (10-25)]
        LINK_SKIN 10
        LINK_STRANDS 11
        [rezervované 12-14]
        LINK_DIRECTIONAL 15
        LINK_PULSE 16
        LINK_ARCS 17
        LINK_SPARKS 18
        LINK_BEADS 19
        LINK_IMPACTS 20
        [rezervované 21-24]
        LINK_PARTICLES 25

[Stret Zone 3: Node Evolution Transitions (26-40)]
        (pre rezervované pre future evolution overlays)
        EVOLUTION 50

Node:   FX 100, DEBUG 200
```

---

## 📋 CHECKLIST

- [ ] Rozhodnúť: POUŽIŤ STRETové ZÓNY alebo ZACHOVAŤ CURRENT (2-20)?
- [ ] Ak STRETové ZÓNY:
  - [ ] Refaktor VisualHierarchyRegistry.js v3.0
  - [ ] Pridať NODE_PERSONALITY, NODE_CORRUPTION ids
  - [ ] Posunúť Link values 2-20 → 10-25
  - [ ] Pridať getStretchOrder() metódu
  - [ ] Aplikovať zmeny na LinkRendererConduit.js
  - [ ] Aplikovať zmeny na ostatných Link systémoch

- [ ] Ak ZACHOVAŤ CURRENT:
  - [ ] Dokumentovať že Node vizuály by mali použiť renderOrder < 2
  - [ ] Overiť či žiadny node vizuál používa 2-20

---

**Otázka na rozhodnutie:**

1. **POUŽIŤ STRETové ZÓNY** (v3.0) - bezpečnejšie, ale zložitejšie
2. **ZACHOVAŤ CURRENT** (v2.0) - jednoduchšie, ale môže byť stretov

Ktorý smer chceš? Stačí napísať: "STRET" alebo "CURRENT"
