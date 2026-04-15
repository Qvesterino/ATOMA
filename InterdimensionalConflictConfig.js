/**
 * InterdimensionalConflictConfig.js
 * ============================================================================
 * KONFIGURAČNÝ TEMPLATE PRE CUSTOMIZÁCIU
 *
 * Tento súbor obsahuje všetky konfiguračné hodnoty ktoré môžete upraviť
 * prispôsobiť vizuálny štýl interdimenzionálnych konfliktov.
 *
 * POUŽITIE:
 * 1. Skopírujte tento súbor
 * 2. Premenujte na napr. MyConflictConfig.js
 * 3. Upravte hodnoty podľa vašich potrieb
 * 4. Importujte v main.js a predojte ako options
 *
 * PRÍKLAD:
 * import { setupInterdimensionalConflictIntegration } from './InterdimensionalConflictIntegration.js';
 * import myConflictConfig from './MyConflictConfig.js';
 *
 * setupInterdimensionalConflictIntegration(game, myConflictConfig);
 * ============================================================================
 */

export default {
  // ============================================================================
  // ZÁKLADNÉ NASTAVENIA
  // ============================================================================

  // Zapnúť/vypnúť celý systém
  enabled: true,

  // Debug mód (podrobný logging v konzole)
  debugMode: false,

  // Maximálny počet častíc (performance tuning)
  // Laptop: 200-300, Desktop: 500-800
  maxParticles: 500,

  // ============================================================================
  // FARBY (RGB 0-1)
  // ============================================================================

  colors: {
    // Harmony - modrá/cyán pre zdravé huby
    harmony: { r: 0.2, g: 0.8, b: 1.0 },

    // Dominant - zlatá/žltá pre víťazného huba
    dominant: { r: 1.0, g: 0.8, b: 0.2 },

    // Conflict - fialová/ružová pre konfliktnú energiu
    conflict: { r: 0.8, g: 0.3, b: 0.6 },

    // Rift - blue-purple pre time-space efekty
    rift: { r: 0.5, g: 0.5, b: 1.0 },

    // White - hot white core pre maximálnu intenzitu
    white: { r: 1.0, g: 1.0, b: 1.0 }
  },

  // ============================================================================
  // FÁZY KONFLIKTU
  // ============================================================================

  phases: {
    // ------------------------------------------------------------------------
    // FÁZA 1: DETECTION
    // Prvé známky konfliktu - jemné pulzy, farebné dotyky
    // ------------------------------------------------------------------------
    detection: {
      // Minimálna intenzita pre vstup do tejto fázy
      threshold: 0.1,

      // Intenzita pulzov na halo (0-1)
      haloPulseIntensity: 0.15,

      // Farebný nádech na halo (0-1)
      colorTint: 0.2,

      // Trvanie fázy pred eskaláciou (sekundy)
      duration: 2.0,

      // Rýchlosť spawnovania častíc (častice/sekundu)
      particleRate: 0,

      // Intenzita portálového lúča (0-1)
      portalIntensity: 0.0,

      // Rýchlosť rastu portálu (ak sa formuje)
      portalGrowthSpeed: 0.0
    },

    // ------------------------------------------------------------------------
    // FÁZA 2: ESCALATION
    // Konflikt sa zosilňuje - portal sa formuje, rift sa otvára
    // ------------------------------------------------------------------------
    escalation: {
      // Intenzita pre vstup do tejto fázy
      threshold: 0.3,

      // Silnejšie pulzy
      haloPulseIntensity: 0.4,

      // Výraznejšie farby
      colorTint: 0.5,

      // Trvanie eskalácie pred výbuchom
      duration: 4.0,

      // Pomalý particle spawn
      particleRate: 2,

      // Portal sa formuje
      portalIntensity: 0.3,

      // Rýchlosť rastu portálu
      portalGrowthSpeed: 0.4
    },

    // ------------------------------------------------------------------------
    // FÁZA 3: EXPLOSION
    // Maximalný konflikt - masívny výbuch, plný portal
    // ------------------------------------------------------------------------
    explosion: {
      // Intenzita pre výbuch
      threshold: 0.7,

      // Maximálne pulzy
      haloPulseIntensity: 1.0,

      // Plné farby
      colorTint: 1.0,

      // Krátky výbuch
      duration: 1.5,

      // Masívny particle burst
      particleRate: 15,

      // Plný portal
      portalIntensity: 1.0,

      // Shockwave efekt
      shockwave: true
    },

    // ------------------------------------------------------------------------
    // FÁZA 4: RESIDUE
    // Zvyšky po výbuchu - pomalé rozplynutie
    // ------------------------------------------------------------------------
    residue: {
      // Intenzita pre residue fázu
      threshold: 0.4,

      // Slabé pulzy
      haloPulseIntensity: 0.2,

      // Vyblednuté farby
      colorTint: 0.3,

      // Dlhé rozplynutie
      duration: 6.0,

      // Zvyškové častice
      particleRate: 0.5,

      // Portal mizne
      portalIntensity: 0.2,

      // Rýchlosť fade out
      fadeSpeed: 0.15
    }
  },

  // ============================================================================
  // PORTAL BEAM NASTAVENIA
  // ============================================================================

  portalBeam: {
    // Počet segmentov lúča ( vyššie = hladšie, viac GPU)
    segments: 32,

    // Polomer lúča (relatívne k vzdialenosti medzi hubmi)
    radius: 0.08,

    // Frekvencia sin wave animácie (vyššie = rýchlejšie "tekutie")
    waveFrequency: 2.0,

    // Amplitúda sin wave (vyššie = viac "organické")
    waveAmplitude: 0.15,

    // Počet strán lúča pre radial gradient
    sides: 6
  },

  // ============================================================================
  // RIFT EFFECT NASTAVENIA
  // ============================================================================

  riftEffect: {
    // Počet segmentov disku (vyššie = okrúhlejší)
    segments: 32,

    // Základný polomer riftu
    baseRadius: 1.0,

    // Maximálny scale (vo výbuchu)
    maxScale: 2.5,

    // Frekvencia okrajovej animácie
    edgeWaveFrequency: 20.0,

    // Amplitúda okrajovej animácie
    edgeWaveAmplitude: 0.05,

    // Rýchlosť chromatic distorzie
    chromaticSpeed: 4.0,

    // Sila chromatic distorzie
    chromaticStrength: 0.02
  },

  // ============================================================================
  // PARTICLE SYSTEM NASTAVENIA
  // ============================================================================

  particles: {
    // Maximálna veľkosť častice
    maxSize: 0.15,

    // Minimálna veľkosť častice
    minSize: 0.05,

    // Rýchlosť rotácie (radiány/sekundu)
    rotationSpeed: 2.0,

    // Gravitácia pre rift particles (nížšie = pomalšie pád)
    riftGravity: 0.5,

    // Chaos faktor pre rift particles (vyššie = viac náhodnosti)
    riftChaos: 0.2,

    // Vzostupná rýchlosť pre burst particles
    burstRiseSpeed: 0.3,

    // Drag faktor pre burst particles (nižšie = viac drift)
    burstDrag: 0.98,

    // Drag faktor pre residue particles (nižšie = pomalšie zastavenie)
    residueDrag: 0.95
  },

  // ============================================================================
  // PERFORMANCE NASTAVENIA
  // ============================================================================

  performance: {
    // Znížiť kvalitu ak je FPS pod touto hodnotou
    fpsThreshold: 30,

    // Ako často kontrolovať FPS (sekundy)
    fpsCheckInterval: 2.0,

    // Znížiť počet častíc o tento percent pri low FPS
    particleReductionFactor: 0.5,

    // Znížiť počet segmentov pri low FPS
    segmentReduction: 16
  },

  // ============================================================================
  // AUDIO NASTAVENIA (BUDÚCNA FUNKCIONALITA)
  // ============================================================================

  audio: {
    // Zapnúť audio efekty
    enabled: false,

    // Hlasitosť (0-1)
    volume: 0.5,

    // Zvuk pre každú fázu
    sounds: {
      detection: null,  // Cesta k audio súboru
      escalation: null,
      explosion: null,
      residue: null
    }
  }
};

// ============================================================================
// PRED-DEFINOVANÉ PROFILY
// ============================================================================

export const PROFILES = {
  // Profil pre laptop s integrovanou grafikou
  LAPTOP_INTEGRATED: {
    enabled: true,
    debugMode: false,
    maxParticles: 200,
    phases: {
      detection: { ... }.detection,
      escalation: { particleRate: 1, ... }.escalation,
      explosion: { particleRate: 8, ... }.explosion,
      residue: { ... }.residue
    },
    portalBeam: {
      segments: 24,
      ... }.portalBeam,
    riftEffect: {
      segments: 24,
      ... }.riftEffect
    },

  // Profil pre desktop s dedicated GPU
  DESKTOP_DISCRETE: {
    enabled: true,
    debugMode: false,
    maxParticles: 800,
    phases: {
      detection: { ... }.detection,
      escalation: { particleRate: 3, ... }.escalation,
      explosion: { particleRate: 20, ... }.explosion,
      residue: { ... }.residue
    },
    portalBeam: {
      segments: 48,
      ... }.portalBeam,
    riftEffect: {
      segments: 48,
      ... }.riftEffect
    },

  // Profil pre debugging
  DEBUG: {
    enabled: true,
    debugMode: true,
    maxParticles: 100,
    phases: {
      detection: { ... }.detection,
      escalation: { ... }.escalation,
      explosion: { ... }.explosion,
      residue: { ... }.residue
    }
  },

  // Profil pre subtílne efekty
  SUBTLE: {
    enabled: true,
    debugMode: false,
    maxParticles: 300,
    phases: {
      detection: {
        threshold: 0.2,
        haloPulseIntensity: 0.1,
        colorTint: 0.1,
        ... }.detection,
      escalation: {
        threshold: 0.4,
        haloPulseIntensity: 0.3,
        colorTint: 0.3,
        particleRate: 1,
        portalIntensity: 0.2,
        ... }.escalation,
      explosion: {
        threshold: 0.8,
        haloPulseIntensity: 0.8,
        colorTint: 0.8,
        particleRate: 10,
        portalIntensity: 0.8,
        ... }.explosion,
      residue: {
        ... }.residue
      }
    }
  },

  // Profil pre dramatické efekty
  DRAMATIC: {
    enabled: true,
    debugMode: false,
    maxParticles: 1000,
    phases: {
      detection: {
        threshold: 0.05,
        haloPulseIntensity: 0.2,
        colorTint: 0.3,
        ... }.detection,
      escalation: {
        threshold: 0.25,
        haloPulseIntensity: 0.5,
        colorTint: 0.6,
        particleRate: 3,
        portalIntensity: 0.4,
        ... }.escalation,
      explosion: {
        threshold: 0.6,
        haloPulseIntensity: 1.0,
        colorTint: 1.0,
        particleRate: 25,
        portalIntensity: 1.0,
        shockwave: true,
        ... }.explosion,
      residue: {
        duration: 8.0,
        ... }.residue
      }
    }
  }
};

// ============================================================================
// POUŽITIE V MAIN.JS
// ============================================================================

/*
// Príklad 1: Použiť default config
import config from './InterdimensionalConflictConfig.js';
setupInterdimensionalConflictIntegration(game, config);

// Príklad 2: Použiť profil
import { PROFILES } from './InterdimensionalConflictConfig.js';
setupInterdimensionalConflictIntegration(game, PROFILES.LAPTOP_INTEGRATED);

// Príklad 3: Custom config s profilom ako základom
import { PROFILES } from './InterdimensionalConflictConfig.js';

const myConfig = {
  ...PROFILES.DESKTOP_DISCRETE,
  colors: {
    ...PROFILES.DESKTOP_DISCRETE.colors,
    harmony: { r: 0.1, g: 0.9, b: 0.5 }  // Custom zelená
  },
  maxParticles: 600  // Mierne znížené
};

setupInterdimensionalConflictIntegration(game, myConfig);
*/
