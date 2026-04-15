# Interdimenzionálne Konflikty - Epické Vizuálne Efekty

## Prehľad

Tento systém transformuje konflikty medzi harmonic hubmi z jednoduchej detekcie na **epické, organické, bio-luminescentné time-space rift efekty**.

## Hlavné Vlastnosti

### 🌊 Organické Portálové Lúče
- **Sin wave animácie** pre "tekutý", živý pohyb
- **Gradientné farby** prechádzajúce od harmony blue cez dominant gold až po conflict purple
- **Bio-luminescentné shadery** s hot white core a soft glow
- **Dynamické formovanie** - lúč sa pomaly objavuje, rastie a mizne

### 🌀 Time-Space Rifty
- **Chromatic distorziu** - farby sa rozdeľujú ako keď sa svetlo láme cez hranu dimenzie
- **Organické hrany** - pulzujúce, dýchajúce okraje riftu
- **Particle rain** - častice "spadajú" cez rift do inej dimenzie
- **Scale animácia** - rift sa pomalo otvára a zatvára

### ✨ Fázový Build-Up Systém
Konflikt prechádza cez 4 fázy, každá s unikátnymi efektmi:

#### 1. DETECTION (0.1 - 0.3 intenzita)
- **Jemné pulzy** na haloch nodeov
- **Farebné dotyky** - subtilné nádech konfliktných farieb
- **Žiadne viditeľné portály** ešte
- **Trvanie**: ~2 sekundy pred eskaláciou

**Vizuálne znaky:**
- Halo pulse intensity: 15%
- Color tint: 20%
- Portal: neviditeľný

#### 2. ESCALATION (0.3 - 0.7 intenzita)
- **Portal beam sa formuje** - pomaly rastie z ničoho
- **Rift sa otvára** - jemný disk s chromatic distorziou
- **Particle spawn** - pomalý tok častíc cez rift
- **Haly intenzívnejšie** - silnejšie pulzy, výraznejšie farby
- **Trvanie**: ~4 sekundy pred výbuchom

**Vizuálne znaky:**
- Halo pulse intensity: 40%
- Color tint: 50%
- Portal: 30% intenzita, rastie
- Particles: 2/sec

#### 3. EXPLOSION (≥ 0.7 intenzita)
- **Masívny bio-luminescentný výbuch**
- **Plný portal beam** - maximálna intenzita a jas
- **Rift wide open** - plný chromatic efekt
- **Particle burst** - 15 častíc/sekundu
- **Shockwave** - možný rozširujúci sa prstencový efekt
- **Trvanie**: krátky, ~1.5 sekundy

**Vizuálne znaky:**
- Halo pulse intensity: 100%
- Color tint: 100%
- Portal: 100% intenzita
- Particles: 15/sec (burst)

#### 4. RESIDUE (< 0.7 intenzita po výbuchu)
- **Portál pomaly mizne** - fade out
- **Zvyškové častice** - pomaly sa rozplývajú
- **Vyblednuté haly** - slabé pulzy, stmavnuté farby
- **Dlhé rozplynutie** - ~6 sekúnd
- **Pomaly späť k DETECTION** alebo zmizne

**Vizuálne znaky:**
- Halo pulse intensity: 20%
- Color tint: 30%
- Portal: 20% intenzita, mizne
- Particles: 0.5/sec (residue)

### 🎨 Farbová Paleta

```
Harmony (Blue/Cyan):    RGB(0.2, 0.8, 1.0)  - #33CCFF
Dominant (Gold):        RGB(1.0, 0.8, 0.2)  - #FFCC33
Conflict (Purple/Pink): RGB(0.8, 0.3, 0.6)  - #CC4D99
Rift (Blue-Purple):     RGB(0.5, 0.5, 1.0)  - #8080FF
White Hot Core:         RGB(1.0, 1.0, 1.0)  - #FFFFFF
```

**Dominance zmes:**
- HubA dominuje → viac Gold
- HubB dominuje → viac Purple
- Vyvážené → viac Blue/Cyan

## Technické Detaily

### Architektúra

```
SynapticConflictAdaptiveResolution (Authority)
    ↓ (konfliktové dáta)
InterdimensionalConflictIntegration (Bridge)
    ↓ (transformované dáta)
InterdimensionalConflictVisualizer (Consumer)
    ↓ (renderovanie)
THREE.js Renderer (Output)
```

### Komponenty

1. **PortalBeam**
   - Mesh-based lúč medzi hubmi
   - Custom shader s organickou animáciou
   - Sin wave distorzia pre "tekutý" vzhľad
   - Gradient farieb podľa dominance

2. **RiftEffect**
   - Disk-based časopriestorový otvor
   - Chromatic aberration shader
   - Organické okrajové pulzovanie
   - Scale animácia

3. **ParticlePool**
   - Efektívny pool 500 častíc
   - Tri typy: rift, burst, residue
   - Rozdielne správanie pre každý typ
   - Automatické recycling

4. **ConflictPhase**
   - Detekcia fázy z intenzity a času
   - Hladké prechody medzi fázami
   - Fáza-specifické parametre

### Performance

- **Max particles**: 500 (konfigurovateľné)
- **Shader-based**: väčšina efektov na GPU
- **Cyclic processing**: len aktívne konflikty
- **Graceful degradation**: automatické zníženie kvality ak je load príliš vysoký
- **Laptop-friendly**: optimalizované pre browser + laptop GPU

**Odhad FPS impact:**
- 0-1 konfliktov: ~1-2 FPS
- 2-3 konflikty: ~3-5 FPS
- 4+ konfliktov: ~5-8 FPS

## Použitie

### Inicializácia

```javascript
// V main.js
import { setupSynapticConflictSystem } from './SynapticConflictAdaptiveResolution_Session117.js';
import { setupInterdimensionalConflictIntegration } from './InterdimensionalConflictIntegration.js';

// 1. Najprv inicializujte konfliktový systém
setupSynapticConflictSystem(game, {
  enabled: true,
  debugMode: false
});

// 2. Potom inicializujte interdimenzionálny vizualizer
setupInterdimensionalConflictIntegration(game, {
  enabled: true,
  debugMode: false,
  maxParticles: 500  // Voliteľné: znížte ak máte performance problémy
});
```

### Console Debugging

```javascript
// Zobraziť status
window.interdimensionalConflict.getStatus();

// Zobraziť počet aktívnych častíc
window.interdimensionalConflict.getParticleCount();

// Zobraziť počet portálov
window.interdimensionalConflict.getPortalCount();

// Zobraziť počet riftov
window.interdimensionalConflict.getRiftCount();

// Zapnúť/vypnúť
window.interdimensionalConflict.enabled();
window.interdimensionalConflict.disabled();

// Pomoc
window.interdimensionalConflict.help();

// Zobraziť aktívne konflikty (z pôvodného systému)
window.conflictDebug.getActiveConflicts();
```

### Konfigurácia

```javascript
setupInterdimensionalConflictIntegration(game, {
  enabled: true,              // Zapnúť/vypnúť systém
  debugMode: false,           // Debug logging v konzole
  maxParticles: 500           // Max počet častíc (znížte pre lepší performance)
});
```

### Customizácia

**Úprava farieb:**
Upravte `CONFLICT_COLORS` v `InterdimensionalConflictVisualizer.js`:

```javascript
const CONFLICT_COLORS = {
  harmony: { r: 0.2, g: 0.8, b: 1.0 },      // Zmeňte na vaše farby
  dominant: { r: 1.0, g: 0.8, b: 0.2 },
  conflict: { r: 0.8, g: 0.3, b: 0.6 },
  rift: { r: 0.5, g: 0.5, b: 1.0 },
  white: { r: 1.0, g: 1.0, b: 1.0 }
};
```

**Úprava fáz:**
Upravte `CONFLICT_PHASES` v `InterdimensionalConflictVisualizer.js`:

```javascript
const CONFLICT_PHASES = {
  DETECTION: {
    threshold: 0.1,           // Zmeňte prah pre detekciu
    haloPulseIntensity: 0.15, // Jemné pulzy
    duration: 2.0,           // Trvanie fázy
    // ...
  },
  // ...
};
```

## Vizuálny Styling

### Princípy

1. **Organický, nie geometrický** - všetko by malo pôsobiť živo, tekuto
2. **Plynulé prechody** - žiadne náhle skoky, všetko fade in/out
3. **Subtílna balancia** - efekty by nemali byť over-the-top, ale "práve dosť"
4. **Farby hovoria** - dominance, harmónia, konflikt by mali byť viditeľné z farieb
5. **Bio-luminescencia** - všetko by malo jemne žiariť, nie byť ploché

### Doporučenia

- **Neover-exposed** - nechajte priestor pre iné efekty v sieti
- **Niesu to gameplay efekty** - len vizuálne vyprávanie
- **Testujte na rôznych hardware** - laptop vs desktop môže mať veľký rozdiel
- **Pozrite si v akom fáze je konflikt** - rôzne fázy majú rôznu intenzitu
- **Používajte console API** pre debugging a ladenie

## Troubleshooting

### Častické problémy

**Problém:** FPS drop keď sú konflikty aktívne
**Riešenie:** Znížte `maxParticles` na 300 alebo 200

**Problém:** Portály neobjavujú
**Riešenie:** Skontrolujte či `SynapticConflictAdaptiveResolution` detekuje konflikty (`window.conflictDebug.getActiveConflicts()`)

**Problém:** Efekty vyzerajú príliš silno/slabo
**Riešenie:** Upravte `portalIntensity` v `CONFLICT_PHASES` pre každú fázu

**Problém:** Farby nie sú správne
**Riešenie:** Skontrolujte či `CONFLICT_COLORS` má správne RGB hodnoty (0-1, nie 0-255)

## Príklady

### Príklad 1: Subtílne konflikty

```javascript
// Nízka intenzita, pomalý build-up
setupInterdimensionalConflictIntegration(game, {
  maxParticles: 200,  // Menej častíc
  enabled: true
});
```

### Príklad 2: Epické výbuchy

```javascript
// Vysoká intenzita, veľa častíc
setupInterdimensionalConflictIntegration(game, {
  maxParticles: 800,  // Viac častíc pre dramatické výbuchy
  enabled: true
});
```

### Príklad 3: Debug móde

```javascript
// Detailný logging
setupInterdimensionalConflictIntegration(game, {
  debugMode: true,
  maxParticles: 100,  // Nízky počet pre čistejší debug
  enabled: true
});
```

## Budúci Rozvoj

Možné vylepšenia:

1. **Post-processing effects**
   - Bloom pre ešte žiarijúcejšie efekty
   - Chromatic aberration celá obrazovka pri výbuchu
   - Vignette počas konfliktov

2. **Audio feedback**
   - Subtílne zvuky pre každú fázu
   - Spatial audio podľa pozície riftu
   - Reverb/echo efekty

3. **Ďalšie fázové efekty**
   - Shockwave expansion pri EXPLOSION
   - Gravity well efekt pri RESIDUE
   - Time-slow motion počas výbuchu

4. **Interaktívne elementy**
   - Možnosť kliknúť na rift pre detailný pohľad
   - Camera zoom na aktívny konflikt
   - HUD pre konfliktové stavy

## Zoznam Súborov

- `InterdimensionalConflictVisualizer.js` - Hlavný vizualizačný systém
- `InterdimensionalConflictIntegration.js` - Integration patch
- `SynapticConflictAdaptiveResolution_Session117.js` - Pôvodný konfliktový systém (authority)
- `InterdimensionalConflict_README.md` - Tento súbor

## Credits

**Design & Implementation:** ATOMA Project VFX Team
**Session:** Interdimensional Conflict Visualization
**Version:** 1.0.0
**Date:** 2026

---

**Enjoy the epic interdimensional conflicts! 🌀✨**
