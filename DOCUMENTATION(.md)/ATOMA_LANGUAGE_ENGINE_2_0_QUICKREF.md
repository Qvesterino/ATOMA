# ATOMA LANGUAGE ENGINE 2.0 — QUICK REFERENCE

**Quick Links:** [Full Readme](ATOMA_LANGUAGE_ENGINE_2_0_README.md) | [Delivery Report](ATOMA_LANGUAGE_ENGINE_2_0_DELIVERY_REPORT.md)

---

## ⚡ 30-SECOND SUMMARY

The Language Engine converts archetype codes (e.g., `QNT-ORB-HLD`) into human-readable names and phrases.

- **Pure Text Layer** — Zero gameplay impact
- **Deterministic** — Same input = same output always
- **Fast** — <0.01ms cache hits, <0.15ms lookups
- **Safe** — Fully reversible, read-only access

---

## 📚 MORPHEME QUICK LOOKUP

### ORIGINS (10)
QNT=Quantum | SIG=Signal | ECO=Echo | FRM=Fractal | CHR=Chaotic | UMB=Umbra | AET=Aether | ASC=Ascended | LGD=Legend | NEX=Nexus

### PATTERNS (11)
ORB=Orb | TOR=Torus | CRW=Crown | LOT=Lotus | HEX=Hexagon | VEC=Vector | SPN=Spine | DMD=Diamond | INF=Infinite | FNX=Fenix | KNOT=Knot

### SIGNATURES (10)
VAR=Variable | CPL=Coupled | OSC=Oscillating | HLD=Holding | RSP=Responsive | FLX=Flexible | NEX=Nexus | PRM=Primal | SYN=Synthetic | BRK=Breaking

---

## 🎯 CORE API (5 Main Methods)

### 1. Get Short Label
```javascript
engine.getShortLabel('QNT-ORB-HLD')
// → "Quantum Orb Holding"
```

### 2. Get Full Name
```javascript
engine.getFullName('FRM-INF-VAR')
// → "Fractal Infinite of Volatile Change"
```

### 3. Get Info
```javascript
engine.getArchetypeInfo('ECO-TOR-FLX')
// → Complete metadata object
```

### 4. Get Node Sentence
```javascript
engine.getSentenceForNode('SIG-VEC-RSP')
// → "A signal vector responsively directs network flow."
```

### 5. Get Link Phrase
```javascript
engine.getNetworkPhraseForLink('QNT-ORB-HLD', 'SIG-VEC-RSP')
// → "quantum→signal: quantum signal convergence channel"
```

---

## 💻 CONSOLE API

Access via `window.lang.*`:

```javascript
lang.info(code)              // Full info for code
lang.label(code)             // Short label
lang.fullname(code)          // Full poetic name
lang.phrase(code, metrics)   // Descriptive sentence
lang.link(src, tgt, metrics) // Link description
lang.stats()                 // Cache statistics
lang.queryByOrigin(code)     // Find all with origin
lang.queryByPattern(code)    // Find all with pattern
lang.queryBySignature(code)  // Find all with signature
```

---

## 🔗 COMMON ARCHETYPE CODES

### Base (6)
| Code | Name | Use |
|------|------|-----|
| QNT-ORB-HLD | Input | Data ingestion |
| SIG-VEC-RSP | Process | Transformation |
| NEX-ORB-CPL | Integration | Coordination |
| AET-HEX-SYN | Analytics | Analysis |
| UMB-ORB-HLD | Storage | Retention |
| ASC-CRW-PRM | Control | Governance |

### Special (3)
| Code | Name | Use |
|------|------|-----|
| SIG-CRW-NEX | Sigma | Hub (3-5 links) |
| QNT-HEX-VAR | Quantum | Probabilistic |
| ECO-TOR-FLX | Emotional | Personality |

### Visual (5 Notable)
| Code | Name |
|------|------|
| DMD-VEC-SYN | Crystal |
| ECO-TOR-OSC | Harmonic |
| AET-CRW-BRK | Solar |
| ECO-ORB-RSP | Echo |
| FRM-INF-VAR | Fractal |

### Legendary (5)
| Code | Name |
|------|------|
| LGD-TOR-SYN | AURORA |
| LGD-INF-VAR | FRACTAL |
| LGD-ORB-PRM | SINGULARITY |
| LGD-CRW-RSP | SIGMA_PRIME |
| LGD-CRW-SYN | QUANTUM_CROWN |

---

## 🚀 IN-CODE USAGE

### Initialize
```javascript
import { AtomaLanguageEngine2_0 } from './_AtomaLanguageEngine2_0.js';
const engine = new AtomaLanguageEngine2_0();
```

### HUD Display
```javascript
const code = 'FRM-LOT-BRK';
const label = engine.getShortLabel(code);        // "Fractal Lotus Breaking"
const meaning = engine.getFullName(code);        // "Fractal Lotus of Metamorphic Transformation"
hudPanel.innerHTML = `<div>${label}</div><div>${meaning}</div>`;
```

### Context-Aware Phrase
```javascript
const metrics = { synergy: 0.9, instability: 0.1 };
const phrase = engine.getSentenceForNode('SIG-VEC-RSP', metrics);
// "A signal vector harmoniously directs network flow."
```

### Link Analysis
```javascript
const linkPhrase = engine.getNetworkPhraseForLink(
  'QNT-ORB-HLD',
  'SIG-VEC-RSP',
  { harmony: 0.8 }
);
// "quantum→signal: quantum signal convergence flow"
```

---

## ⚡ PERFORMANCE TIPS

1. **Cache Hits** — Repeated calls are <0.01ms (use results in loops)
2. **First Call Penalty** — First query takes ~0.05-0.15ms (expected)
3. **Query Methods** — No caching (by design), iterate whole registry
4. **Metrics Optional** — Can omit metrics for baseline phrase

---

## 🎮 INTEGRATION CHECKLIST

- ✅ Created `_AtomaLanguageEngine2_0.js`
- ✅ Added import to `main.js`
- ✅ Initialized in `AtomaGame` constructor
- ✅ Setup console API in `setupLanguageEngine()`
- ✅ Integrated into `NodeInspectOverlay1_0.js`
- ✅ HUD displays code, label, and meaning

---

## 🔍 DEBUG COMMANDS

```javascript
// In browser console:

// Inspect a specific archetype
lang.info('AET-CRW-BRK')

// Get all Quantum nodes
lang.queryByOrigin('QNT')

// Get all Oscillating nodes
lang.queryBySignature('OSC')

// Get all Lotus patterns
lang.queryByPattern('LOT')

// View performance stats
lang.stats()

// Get poetic description
lang.fullname('UMB-DMD-PRM')

// Get link relationship
lang.link('QNT-ORB-HLD', 'NEX-ORB-CPL')
```

---

## 🎯 REAL-WORLD EXAMPLES

### Example 1: Node Selection Tooltip
```javascript
const selectedNode = selectedObject;
const code = inferArchetypeCode(selectedNode.userData.category);
const label = engine.getShortLabel(code);
const desc = engine.getSentenceForNode(code);

tooltip.innerHTML = `
  <strong>${label}</strong><br>
  <em>${desc}</em>
`;
```

### Example 2: Link Inspection
```javascript
const sourceCode = sourceNode.userData.archetypeCode || inferCode(sourceNode);
const targetCode = targetNode.userData.archetypeCode || inferCode(targetNode);
const linkDesc = engine.getNetworkPhraseForLink(sourceCode, targetCode);

console.log(`Link: ${linkDesc}`);
// "quantum→signal: quantum signal convergence channel"
```

### Example 3: Archetype Discovery
```javascript
// Find all "stable holding" nodes
const holdingNodes = engine.queryBySignature('HLD');
console.log(`Found ${holdingNodes.length} stable nodes`);
holdingNodes.forEach(arch => {
  console.log(`  - ${arch.code}: ${engine.getShortLabel(arch.code)}`);
});
```

---

## ⚠️ IMPORTANT NOTES

1. **Archetype Code Required** — Methods need valid codes (e.g., `QNT-ORB-HLD`)
2. **Fallback Behavior** — Unknown codes return safe defaults
3. **Metrics Optional** — Provide metrics for more context-aware phrases
4. **No Randomness** — Always deterministic, safe for UI updates
5. **Read-Only** — Never modifies node data or game state

---

## 📊 ALL 49 ARCHETYPES

```
BASE: QNT-ORB-HLD, SIG-VEC-RSP, NEX-ORB-CPL, AET-HEX-SYN, UMB-ORB-HLD, ASC-CRW-PRM
SPECIAL: SIG-CRW-NEX, QNT-HEX-VAR, ECO-TOR-FLX
VISUAL: NEX-ORB-HLD, DMD-VEC-SYN, ECO-TOR-OSC, AET-CRW-BRK, ECO-ORB-RSP, 
        FRM-INF-VAR, QNT-HEX-SYN, UMB-ORB-PRM, AET-DMD-SYN, NEX-VEC-CPL, ASC-CRW-BRK
EXTREME: DMD-VEC-RSP, SIG-KNOT-OSC, QNT-HEX-SYN, FRM-LOT-BRK, AET-CRW-RSP,
         CHR-ORB-VAR, ECO-ORB-FLX, ECO-INF-OSC, UMB-DMD-PRM, FRM-SPN-VAR, INF-FNX-OSC, CHR-VEC-BRK
SAFE: QNT-LOT-OSC, FRM-SPN-VAR, ECO-TOR-FLX, FRM-SPN-CPL, AET-DMD-SYN,
      UMB-VEC-RSP, AET-LOT-BRK, NEX-DMD-VAR, SIG-FNX-FLX, CHR-SPN-HLD, AET-CRW-BRK, LGD-CRW-SYN
LEGENDARY: LGD-TOR-SYN, LGD-INF-VAR, LGD-ORB-PRM, LGD-CRW-RSP, LGD-CRW-SYN
```

---

**ATOMA Language Engine 2.0 — Quick Reference**  
*For complete API details, see ATOMA_LANGUAGE_ENGINE_2_0_README.md*
