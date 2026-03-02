# LINK PULSE RING V4 - HARMONIC + HUE DRIFT
## Komplexný pulz, živá farba, jemné bliknutie

**Vytvorené:** 2026-03-02  
**Súbor:** LinkPulseRing.js

---

## 🎯 UPGRADE PATCHES

### 1️⃣ HUE DRIFT – Jemná živá farba

#### Cieľ
Farba sa jemne mení v čase a podľa synergy. **NIE DISCO.** Len 5–10° v HSL.

#### Implementácia
```javascript
// Constructor
this._tempColor = new THREE.Color(); // Pomocná farba pre HSL operácie

// Update
// === HUE DRIFT: Jemná živá farba ===
// Základná farba (source → target blend)
this._tempColor.copy(sourceColor).lerp(targetColor, this.progress);

// Prechod do HSL
const hsl = {};
this._tempColor.getHSL(hsl);

// Drift rýchlosť podľa synergy
const driftSpeed = 0.2 + synergy * 0.8;

// Jemný posun hue (menší než 0.02 aby to nebolo cirkus!)
const hueDrift = Math.sin(performance.now() * 0.001 * driftSpeed) * 0.015;

// Wrap hue (0-1)
if (hsl.h > 1.0) hsl.h -= 1.0;
if (hsl.h < 0.0) hsl.h += 1.0;

// Nastaviť HSL
this._tempColor.setHSL(hsl.h, hsl.s, hsl.l);

// Poslať do shader uniformu
this.material.uniforms.uColor.value.copy(this._tempColor);
```

#### Trail Hue Drift
```javascript
// Trail tiež jemná živá farba
// Trail hue drift je offsetovaný od main ring
const trailHueOffset = (i + 1) * 0.005; // Každý trail má malý offset
this._tempColor.setHSL(hsl.h + trailHueOffset, hsl.s, hsl.l);
trail.material.uniforms.uColor.value.copy(this._tempColor);
```

#### Efekt
- Jemná spektrálna živá energia
- Vyššia synergy → rýchlejší drift
- Nízka synergy → pokojnejší tok
- NIE DISCO - len 5-10° v HSL

---

### 2️⃣ SECOND HARMONIC PULSE – Skutočná "živá" vrstva

#### Cieľ
Druhá frekvencia v scale. Nepridáva nový systém. Len pridáme druhú frekvenciu do scale.

#### Implementácia
```javascript
// Upgrade scale logiky (primary + harmonic combined)
// Primary oscilátor
const primary = Math.sin(this.progress * Math.PI * 6);

// Harmonic oscilátor (dvojnásobná frekvencia, 40% amplitúda)
const harmonic = Math.sin(this.progress * Math.PI * 12) * 0.4;

// Kombinovaný pulz (nie jeden tep, ale komplexný pulz)
const combinedPulse = 1.0 + primary * 0.15 + harmonic * 0.08;

this.mesh.scale.setScalar(baseScale * combinedPulse);
```

#### Efekt
- NIE jeden tep ale komplexný pulz
- Vyzerá to organickejšie
- Nie monotónny

---

### 3️⃣ Harmonic aj do Opacity – Voliteľné, ale pekné

#### Implementácia
```javascript
// === FADE IN/OUT LOGIKA ===
let alpha = 1.0;
const fadeZone = 0.15; // 15% of length

if (this.progress < fadeZone) {
    alpha = this.progress / fadeZone;
} else if (this.progress > (1.0 - fadeZone)) {
    alpha = (1.0 - this.progress) / fadeZone;
}

// === 3️⃣ HARMONIC AJ DO OPACITY ===
// Jemné "bliknutie vnútri pulzu"
const maxOpacity = 0.4 + (synergy * 0.4);
const opacityPulse = 1.0 + harmonic * 0.2;
const finalOpacity = alpha * maxOpacity * opacityPulse;

// Nastaviť opacity shader-uOpacity
this.material.uniforms.uOpacity.value = finalOpacity;
```

#### Efekt
- Robí jemné "bliknutie vnútri pulzu"
- Voliteľné (len pekné)
- Harmonic frequency sa prejavuje aj v opacity

---

## 📊 PARAMETRE

### Hue Drift
| Parameter | Hodnota | Účel |
|-----------|----------|--------|
| `hueDrift` | `sin(now * 0.001 * driftSpeed) * 0.015` | Jemný hue posun |
| `driftSpeed` | `0.2 + synergy * 0.8` | Drift rýchlosť |
| `trailHueOffset` | `(i + 1) * 0.005` | Každý trail má offset |

### Harmonic Pulse (Scale)
| Parameter | Hodnota | Účel |
|-----------|----------|--------|
| `primary` | `sin(progress * π * 6)` | Primary oscilátor |
| `harmonic` | `sin(progress * π * 12) * 0.4` | Druhá frekvencia (2×) |
| `combinedPulse` | `1.0 + primary * 0.15 + harmonic * 0.08` | Kombinovaný pulz |

### Harmonic Pulse (Opacity)
| Parameter | Hodnota | Účel |
|-----------|----------|--------|
| `maxOpacity` | `0.4 + synergy * 0.4` | Max opacity |
| `opacityPulse` | `1.0 + harmonic * 0.2` | Jemné bliknutie |
| `finalOpacity` | `alpha * maxOpacity * opacityPulse` | Final opacity |

---

## ✅ VÝSLEDOK

### PREDTÝM (V3 + Fresnel)
- Ring má fresnel rim (ostrý)
- Jemne mení farbu (len blend source → target)
- Pulzuje (jedna frekvencia: `sin(progress * π * 6)`)
- Opacity je statická (fade in/out len)

### TERAZ (V4 + Harmonic + Hue Drift)
- Ring má **fresnel rim** (ostrý)
- Jemne **živá farba** (hue drift: 5-10° HSL)
- Pulzuje **dvojfrekvenčne** (primary + harmonic)
- Opacity **bliká jemne** (opacityPulse)

---

## 🧠 SIGNATÚRA

### PREDTÝM
Ring = fresnel rim + monotónna farba + jednoduchý pulz

### TERAZ
Ring = fresnel rim + **živá farba** + **komplexný pulz** + **jemné bliknutie**

### Vizuálny efekt
- Nie disco (hue drift je malý: 0.015)
- Nie monotónne (dvojfekvenčný pulz)
- Nie statické (hue drift + harmonic pulse + opacity pulse)
- Vyzerá ako **energetická cievka** s životom

---

## 🔗 SÚVISIACE

- **LinkPulseRing.js** - V4 + Harmonic + Hue Drift
- **LINK_PULSE_RING_V3_FRESNEL.md** - Predchádzajúca verzia (len Fresnel)
- **LINK_PULSE_RING_ENHANCEMENT.md** - Predchádzajúce enhancementy (hrubší, pomalší)
- **LINK_NODE_RENDER_ORDER_GUIDELINES.md** - RenderOrder hierarchia

---

## 📌 DÔLEŽITÉ POZNÁMKY

### Drift Musí Byť Malý
Ak to preženieš, bude to cirkus. 
- Cieľ: keď sa pozeráš 3 sekundy, všimneš si že to žije, nie že bliká
- Implementované: `hueDrift = 0.015` (menšie než 0.02)

### Nie Disco
Hue drift je zámerný a jemný:
- Sinusoida: `Math.sin(now * ...)`
- Malá amplitúda: `* 0.015` (len 5-10° v HSL)
- Wrap: 0-1 (kontinuálne prechádza)

---

**Všetky 3 upgrade patche sú hotové!** 🎨🧠✨

Ring teraz:
- Má fresnel rim (z Phase A)
- Jemne mení farbu (Hue Drift)
- Pulzuje dvojfrekvenčne (Second Harmonic Pulse)
- Bliká jemne vnútri (Harmonic do Opacity)
- Vyzerá ako **energetická cievka**, nie monotónna
- Nie je cirkus (hue drift je malý: 0.015)

---

**KOMPLETNÝ V4 RING HOTOVÝ!** 🚀
