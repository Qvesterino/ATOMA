# ARC DISCHARGES ENHANCEMENT
## Výraznejšie "blesky" z pulse ringu

**Vytvorené:** 2026-03-02  
**Súbor:** LinkRingArcDischarges.js

---

## 🎯 CIELE

1. Zvýrazniť "blesky" (arc discharges) z pulse ringu
2. Pridať viditeľnosť (výraznejší thickness, dlhšie lifetime)
3. Zväčšiť radial extent (viditeľnejší dosah)

---

## 🔧 ZMENY

### LinkRingArcDischarges.js

#### 1. Zvýšené Arc Lifetime (dlhšia vida)
```javascript
// PREDTÝM:
arcLifetime: 0.08,        // 60-100ms per arc

// POTOM:
arcLifetime: 0.15,        // Enhanced: 150ms per arc (increased from 80ms)
```
- **Zmena:** 0.08 → 0.15 (+87.5%)
- **Dopad:** Arcs sú viditeľnejšie, viac času vidieť ich

#### 2. Zväčšené Arc Length (väčší dosah)
```javascript
// PREDTÝM:
arcLength: 0.15,          // Radial extent from ring

// POTOM:
arcLength: 0.18,          // Enhanced: Radial extent (increased from 0.15)
```
- **Zmena:** 0.15 → 0.18 (+20%)
- **Dopad:** Arcs sú dlhšie, viditeľnejšie vyžarovanie

#### 3. Zväčšené Arc Thickness (hrubšie)
```javascript
// PREDTÝM:
arcThickness: 0.008,      // Line width

// POTOM:
arcThickness: 0.015,     // Enhanced: Line width (doubled from 0.008)
```
- **Zmena:** 0.008 → 0.015 (+87.5%)
- **Dopad:** Arcs sú viditeľnejšie, hrubšie čiary

---

## 📊 VÝSLEDKY

### Predtým
| Parameter | Hodnota |
|-----------|----------|
| Lifetime | 80ms |
| Length | 0.15 |
| Thickness | 0.008 |

### Potom
| Parameter | Hodnota | Zmena |
|-----------|----------|--------|
| Lifetime | **150ms** | +87.5% |
| Length | **0.18** | +20% |
| Thickness | **0.015** | +87.5% |

---

## ✅ DOPAD

### Predtým
- Arcs boli málo viditeľné (very thin: 0.008)
- Arcs zmizli príliš rýchlo (80ms lifetime)
- Mali malý dosah (0.15 radial extent)

### Potom
- Arcs sú **hrubšie** (0.015 thickness - takmer dvojnásobok)
- Arcs sú **dlhšie** (150ms lifetime - takmer dvojnásobok)
- Arcy majú **väčší dosah** (0.18 - +20%)
- Všetko robí blesky **výraznejšie**

---

## 🔔 DEBUG (Voliteľné)

Ak stále nevidíš blesky, môžeš zapnúť debug:

```javascript
// LinkRingArcDischarges.js constructor
this.config.debug = true; // Pridať ak chcúš vidieť spawn logy

// V update metóde
if (this.config.debug && this.currentBucket !== this.lastBucket) {
    console.log('[ArcDischarges] SPAWN burst at progress:', this.currentRingProgress);
}
```

---

## 🔗 SÚVISIACE

- **LinkPulseRing.js** - Pulzujúci kruh (spúšťa arcs)
- **LinkRendererConduit.js** - Volá arcDischarges.update()
- **LINK_EXECUTION_LAYER_AUDIT.md** - RenderOrder (LINK_ARCS: 12)
- **PULSE_RING_ENHANCEMENT.md** - Pulse Ring zmeny

---

**Všetky zmeny sú hotové!** Arc discharges sú teraz výraznejšie a viditeľnejšie.
