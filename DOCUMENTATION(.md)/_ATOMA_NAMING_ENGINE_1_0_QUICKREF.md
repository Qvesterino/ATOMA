# ATOMA NAMING ENGINE 1.0 — QUICK REFERENCE

## TL;DR
- ✅ **Tri-morfémový naming:** ORIGIN-PATTERN-SIGNATURE (QNT-KNT-CPL)
- ✅ **49+ archetypy mapované** na poétické mená
- ✅ **Bezpečne:** Iba čítanie, žiadne gameplay zmeny
- ✅ **Console API:** name.show(), name.random(), name.archetypes()

---

## Morfémové Codes

### ORIGINS (Esencia)
QNT, SIG, ECO, FRM, CHR, UMB, AET, ASC, LGD, NEX, FLX, RSN, VCE, INF, PRM

### PATTERNS (Topológia)
ORB, TOR, CRW, LOT, HEX, VEC, SPN, DMD, FNX, KNT, INF, PRL, WVE, LTR, FLX

### SIGNATURES (Kvalita)
VAR, CPL, OSC, HLD, RSP, FLX, NEX, PRM, SYN, BRK, ASC, DSC, CEN, EDG, ABS

---

## Príklady Mien

| Archetype | Naming Code | Meaning |
|-----------|------------|---------|
| CORE-HARMONIC-RESONANT | RSN-WVE-SYN | Harmonic resonance synchronized |
| CORE-QUANTUM-ENTANGLED | QNT-KNT-CPL | Quantum knot collapsing |
| EXTREME-TRANSCENDENT-ETERNAL | AET-INF-ASC | Transcendent eternity ascending |
| MYTHIC (fallback) | LGD-CRW-PRM | Legendary crowned prime |
| input (fallback) | SIG-VEC-RSP | Signal vector responding |

---

## Console API

```javascript
name.show(0)              // Node #0 naming code + meaning
name.random()             // Generate random code
name.archetypes()         // All archetype → code mappings
name.reference()          // Full morpheme table
name.stats()              // Statistics
name.enable()             // Turn on
name.disable()            // Turn off
```

---

## Node Data (Added)

Každý nod automaticky dostane:
```javascript
node.userData.namingCode     // "QNT-KNT-CPL"
node.userData.namingMeaning  // "Quantum probability..."
```

---

## File Locations

- **System:** `_AtomaNamingEngine.js` (1000+ lines)
- **Integration:** AINodes.js (import + property assignment)
- **Console:** main.js (setupAtomaNamingConsoleAPI)
- **Docs:** `_ATOMA_NAMING_ENGINE_1_0_README.md`

---

## Safety

✅ Zero gameplay changes
✅ Read-only naming layer  
✅ No metric modifications
✅ Pure text properties
✅ 100% reversible

---

*ATOMA Naming Engine 1.0 — Tri-Morphemic Poetry for AI Nodes*
