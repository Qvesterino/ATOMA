# Quick Start: Interdimenzionálne Konflikty

## ⚡ Rýchla Inštalácia (5 minút)

### Krok 1: Pridaj importy do main.js

```javascript
// Na začiatok main.js (alebo kde máte ostatné importy)
import { setupSynapticConflictSystem } from './SynapticConflictAdaptiveResolution_Session117.js';
import { setupInterdimensionalConflictIntegration } from './InterdimensionalConflictIntegration.js';
```

### Krok 2: Inicializujte systémy

```javascript
// V inicializačnej časti main.js (po tom čo máte game.scene a game.aiNodes)

// 1. Najprv konfliktový systém (detekcia/logika)
setupSynapticConflictSystem(game, {
  enabled: true,
  debugMode: false
});

// 2. Potom interdimenzionálny vizualizer (efekty)
setupInterdimensionalConflictIntegration(game, {
  enabled: true,
  debugMode: false,
  maxParticles: 500  // Znížte na 300 ak máte laptop s slabším GPU
});
```

### Krok 3: Hotovo! 🎉

Systém je teraz aktívny. Keď sa dva harmonic huby dostanú do konfliktu, uvidíte:

- **DETECTION:** Jemné pulzy na haloch
- **ESCALATION:** Organický portálový lúč sa formuje
- **EXPLOSION:** Masívny bio-luminescentný výbuch
- **RESIDUE:** Zvyškové efekty pomaly miznú

## 🎮 Otestovanie

### Metóda 1: Počkať na prirodzený konflikt

Keď sa dva harmonic huby priblížia k sebe a majú rozdielne fázy, konflikt sa vytvorí automaticky.

### Metóda 2: Force konflikt cez console

```javascript
// Zistite ID dvoch harmonic hubov
const hubs = game.aiNodes.nodes.filter(n => n.userData?.category?.toLowerCase().includes('hub'));
console.log('Hubs:', hubs.map(h => h.id || h.uuid));

// Force konflikt (ak systém podporuje manual trigger)
// Toto závisí od vašej implementácie SynapticConflictAdaptiveResolution
```

### Metóda 3: Debug API

```javascript
// Skontrolujte či systém beží
window.interdimensionalConflict.getStatus();

// Zobrazte aktívne konflikty
window.conflictDebug.getActiveConflicts();
```

## 🔧 Konfigurácia pre Rôzne Scenáre

### Scenár A: Laptop s Integrovanou Grafikou

```javascript
setupInterdimensionalConflictIntegration(game, {
  enabled: true,
  debugMode: false,
  maxParticles: 200  // Nízky počet pre stabilný 60 FPS
});
```

### Scenár B: Desktop s Dedicated GPU

```javascript
setupInterdimensionalConflictIntegration(game, {
  enabled: true,
  debugMode: false,
  maxParticles: 800  // Vysoký počet pre epické efekty
});
```

### Scenár C: Debugging/Vývoj

```javascript
setupInterdimensionalConflictIntegration(game, {
  enabled: true,
  debugMode: true,   // Podrobný logging
  maxParticles: 100  // Málo častíc pre čistejší výstup
});
```

### Scenár D: Subtílne Efekty

```javascript
// Úprava threshold v InterdimensionalConflictVisualizer.js
const CONFLICT_PHASES = {
  DETECTION: {
    threshold: 0.3,  // Vyšší threshold = menej konfliktov
    // ...
  }
};
```

## 🐛 Troubleshooting

### Problém: Nič sa deje, žiadne efekty

**Krok 1:** Skontrolujte či systém beží
```javascript
window.interdimensionalConflict.getStatus();
```

**Krok 2:** Skontrolujte či sú konflikty detekované
```javascript
window.conflictDebug.getActiveConflicts();
```

**Krok 3:** Ak žiadne konflikty:
- Skontrolujte či máte harmonic hubs v sieti
- Skontrolujte či sa huby priblížili k sebe
- Skontrolujte či majú rozdielne fázy

### Problém: FPS drop

**Riešenie 1:** Znížte počet častíc
```javascript
// V setupInterdimensionalConflictIntegration
maxParticles: 200  // Namiesto 500
```

**Riešenie 2:** Vypnite debug mód
```javascript
debugMode: false  // Debug logging stojí FPS
```

**Riešenie 3:** Znížte konfliktové thresholdy
```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_PHASES = {
  DETECTION: {
    threshold: 0.4,  // Vyšší = menej konfliktov
    // ...
  }
};
```

### Problém: Efekty vyzerajú príliš silno/slabo

**Riešenie:** Upravte intenzity fáz
```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_PHASES = {
  ESCALATION: {
    portalIntensity: 0.2,  // Znížte na 0.1 pre slabšie efekty
    // ...
  },
  EXPLOSION: {
    portalIntensity: 0.7,  // Znížte na 0.5 pre menej dramatický výbuch
    // ...
  }
};
```

### Problém: Farby nie sú správne

**Riešenie:** Skontrolujte RGB hodnoty
```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_COLORS = {
  harmony: { r: 0.2, g: 0.8, b: 1.0 },  // Musí byť 0-1, nie 0-255
  // ...
};
```

## 🎨 Rýchle Customizácie

### Zmeniť farby na Zeleno-Červené

```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_COLORS = {
  harmony: { r: 0.2, g: 1.0, b: 0.3 },    // Zelená
  dominant: { r: 1.0, g: 0.8, b: 0.2 },    // Zlatá
  conflict: { r: 1.0, g: 0.2, b: 0.2 },    // Červená
  rift: { r: 0.5, g: 0.3, b: 0.5 },        // Fialová
  white: { r: 1.0, g: 1.0, b: 1.0 }
};
```

### Spomaliť build-up

```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_PHASES = {
  DETECTION: {
    duration: 4.0,  // Zväčšte z 2.0 na 4.0
    // ...
  },
  ESCALATION: {
    duration: 6.0,  // Zväčšte z 4.0 na 6.0
    // ...
  }
};
```

### Zrýchliť výbuch

```javascript
const CONFLICT_PHASES = {
  EXPLOSION: {
    duration: 0.8,  // Znížte z 1.5 na 0.8
    // ...
  }
};
```

## 📊 Performance Monitoring

```javascript
// Periodické kontroly v console
setInterval(() => {
  window.interdimensionalConflict.getStatus();
}, 5000); // Každých 5 sekúnd

// Alebo manualne v console
window.interdimensionalConflict.getParticleCount();
window.interdimensionalConflict.getPortalCount();
window.interdimensionalConflict.getRiftCount();
```

## 🔍 Debug Tips

### Zobraziť všetky konflikty s detailmi

```javascript
window.conflictDebug.getActiveConflicts().forEach(conflict => {
  console.log(`Conflict: ${conflict.hash}`);
  console.log(`  Intensity: ${conflict.intensity.toFixed(2)}`);
  console.log(`  State: ${conflict.state}`);
  console.log(`  Dominance: ${conflict.dominanceDirection.toFixed(2)}`);
});
```

### Sledovať špecifický konflikt

```javascript
// Získajte hash konfliktu
const conflicts = window.conflictDebug.getActiveConflicts();
if (conflicts.length > 0) {
  const hash = conflicts[0].hash;
  console.log('Watching conflict:', hash);

  // Sledujte zmeny
  setInterval(() => {
    const conflict = window.conflictDebug.getActiveConflicts().find(c => c.hash === hash);
    if (conflict) {
      console.log(`Intensity: ${conflict.intensity.toFixed(2)}, State: ${conflict.state}`);
    }
  }, 1000);
}
```

### Vypnúť/zapnúť systém za behu

```javascript
// Vypnúť
window.interdimensionalConflict.disabled();

// Zapnúť
window.interdimensionalConflict.enabled();
```

## 🚀 Advanced Tips

### Tipy pre najlepší vizuálny výsledok

1. **Nepreháňte to s počtom častíc** - menej ale kvalitnejších je viac
2. **Nechajte priestor pre iné efekty** - ATOMA má veľa vizuálnych systémov
3. **Testujte na rôznych monitoroch** - rôzne jas a kontrast
4. **Pozrite si v akom fáze sú konflikty** - rôzne fázy = rôzna intenzita
5. **Nastavte threshold spravne** - príliš nízky = príliš veľa konfliktov

### Optimalizácie pre laptop

1. **Znížte maxParticles na 200-300**
2. **Zvýšte CONFLICT_PHASES.DETECTION.threshold na 0.3-0.4**
3. **Vypnite debugMode**
4. **Znížte resolution shaderov (ak to podporujú)**

### Vytvoriť vlastnú fázu

```javascript
// V InterdimensionalConflictVisualizer.js
const CONFLICT_PHASES = {
  // ... existujúce fázy ...

  // Pridajte vlastnú fázu
  PRE_EXPLOSION: {
    name: 'pre_explosion',
    threshold: 0.6,
    haloPulseIntensity: 0.7,
    colorTint: 0.8,
    duration: 1.0,
    particleRate: 8,
    portalIntensity: 0.7,
    portalGrowthSpeed: 1.0,
    shockwave: false
  }
};
```

## 📝 Kontrolný Zoznam

Pred spustením:

- [ ] Importy pridané do main.js
- [ ] setupSynapticConflictSystem volaný
- [ ] setupInterdimensionalConflictIntegration volaný
- [ ] maxParticles nastavené podľa hardware
- [ ] debugMode vypnutý pre production
- [ ] Konflikty sa detekujú (window.conflictDebug.getActiveConflicts())
- [ ] Efekty sa renderujú (window.interdimensionalConflict.getStatus())

## 🎞️ Očakávaný Výsledok

Keď všetko funguje správne, uvidíte:

1. **Jemné pulzy** na haloch keď sa huby priblížia (DETECTION)
2. **Organický lúč** sa pomalo formuje medzi hubmi (ESCALATION)
3. **Bio-luminescentný výbuch** s particles keď konflikt dosiahne maximum (EXPLOSION)
4. **Zvyškové efekty** ktoré pomaly miznú (RESIDUE)

Farby by mali byť:
- **Modrá/Cyán** pre harmonické huby
- **Zlatá** pre dominujúci hub
- **Fialová/Ružová** pre konfliktnú energiu
- **Chromatické** pre rift efekty

---

**Hotovo! Užívajte si epické interdimenzionálne konflikty! 🌀✨**
