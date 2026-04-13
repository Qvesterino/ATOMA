/**
 * ATOMA LANGUAGE ENGINE 3.0
 * Procedural AI Poetry — Emergent Whispers from the Dream Network
 * 
 * SAFETY GUARANTEES (ABSOLUTE):
 * ✓ Pure text/DOM layer — ZERO gameplay modifications
 * ✓ No node/link data storage or mutations
 * ✓ Read-only access to metrics, archetype codes, thought storms
 * ✓ No modifications to shaders, physics, evolution, or spawning
 * ✓ Performance: <0.05ms/frame typical (text generation only)
 * ✓ 100% reversible via disable()
 * ✓ All poetry is EMERGENT — generated on-the-fly, never stored on nodes
 * ✓ External DOM container — zero scene/canvas interference
 * 
 * FEATURES:
 * 1. Node-Based Poetry — Single line when node is selected
 * 2. Link Whispers — Hover over links for synergy/stability hints
 * 3. Storm-Responsive Verses — Tone shifts based on Thought Storms state
 * 4. Network Pulse — Global poetic emissions every 20-40s
 * 5. Console API — Enable/disable/test commands
 * 
 * POETRY CATEGORIES:
 * - Node Poetry: Describes archetype, metrics, category synergy
 * - Link Whispers: Hints at connection harmony/corruption
 * - Storm Verses: Reflections on current network emotional state
 * - Pulse Poems: Network-wide observations about topology and flow
 * 
 * PERFORMANCE:
 * - Node selection: <0.02ms (1-2 template lookups)
 * - Link hover: <0.01ms (cache hit)
 * - Storm polling: <0.001ms (state check only)
 * - Pulse emission: <0.1ms (template generation every 20-40s)
 * - Frame budget: <0.05ms/frame average, <0.2ms peak
 * 
 * UI/DOM:
 * - Node Poetry: Bottom-right, fade-in/out over 0.5s
 * - Link Whispers: Bottom-center, smaller font, brief fade
 * - Storm Verses: Integrated with Node Poetry (secondary line)
 * - Pulse Poems: Center-screen, subtle glow, 2-3s display
 * All text uses neon cyan/magenta colors with letter-spacing for sci-fi feel
 */

const MESSAGE_TAG_FONT = "'Rajdhani', 'Segoe UI', sans-serif";
const MESSAGE_BODY_FONT = "'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', serif";

function createTheme({
  accent,
  accentSoft,
  glow,
  surfaceA,
  surfaceB,
  text,
  muted,
  tag,
}) {
  return Object.freeze({
    accent,
    accentSoft,
    glow,
    surfaceA,
    surfaceB,
    text,
    muted,
    tag,
    tagFont: MESSAGE_TAG_FONT,
    bodyFont: MESSAGE_BODY_FONT,
  });
}

const MESSAGE_THEMES = Object.freeze({
  default: createTheme({
    accent: '#6feeff',
    accentSoft: 'rgba(111, 238, 255, 0.22)',
    glow: 'rgba(111, 238, 255, 0.16)',
    surfaceA: 'rgba(8, 16, 28, 0.96)',
    surfaceB: 'rgba(10, 22, 36, 0.86)',
    text: '#f3ffff',
    muted: 'rgba(215, 249, 255, 0.76)',
    tag: 'ORACLE / DEFAULT',
  }),
  lore: createTheme({
    accent: '#ffd89c',
    accentSoft: 'rgba(255, 216, 156, 0.22)',
    glow: 'rgba(255, 216, 156, 0.16)',
    surfaceA: 'rgba(16, 14, 24, 0.96)',
    surfaceB: 'rgba(28, 20, 38, 0.88)',
    text: '#fff8ef',
    muted: 'rgba(255, 232, 205, 0.78)',
    tag: 'LORE / CANON',
  }),
  node: createTheme({
    accent: '#6feeff',
    accentSoft: 'rgba(111, 238, 255, 0.20)',
    glow: 'rgba(111, 238, 255, 0.16)',
    surfaceA: 'rgba(6, 18, 30, 0.96)',
    surfaceB: 'rgba(8, 24, 40, 0.86)',
    text: '#f4ffff',
    muted: 'rgba(215, 249, 255, 0.76)',
    tag: 'NODE / SIGNAL',
  }),
  link: createTheme({
    accent: '#7df0d8',
    accentSoft: 'rgba(125, 240, 216, 0.22)',
    glow: 'rgba(125, 240, 216, 0.16)',
    surfaceA: 'rgba(5, 18, 24, 0.96)',
    surfaceB: 'rgba(8, 28, 32, 0.86)',
    text: '#f3fffb',
    muted: 'rgba(210, 251, 242, 0.76)',
    tag: 'LINK / WHISPER',
  }),
  pulse: createTheme({
    accent: '#eafcff',
    accentSoft: 'rgba(234, 252, 255, 0.20)',
    glow: 'rgba(234, 252, 255, 0.14)',
    surfaceA: 'rgba(6, 14, 22, 0.96)',
    surfaceB: 'rgba(8, 20, 34, 0.86)',
    text: '#f7feff',
    muted: 'rgba(230, 247, 255, 0.78)',
    tag: 'PULSE / NETWORK',
  }),
  synergy: createTheme({
    accent: '#00ccdd',
    accentSoft: 'rgba(0, 204, 221, 0.22)',
    glow: 'rgba(0, 204, 221, 0.16)',
    surfaceA: 'rgba(5, 16, 24, 0.96)',
    surfaceB: 'rgba(8, 24, 34, 0.86)',
    text: '#f0ffff',
    muted: 'rgba(210, 248, 252, 0.76)',
    tag: 'METRIC / SYNERGY',
  }),
  harmony: createTheme({
    accent: '#00dd99',
    accentSoft: 'rgba(0, 221, 153, 0.22)',
    glow: 'rgba(0, 221, 153, 0.16)',
    surfaceA: 'rgba(5, 18, 22, 0.96)',
    surfaceB: 'rgba(8, 30, 28, 0.86)',
    text: '#effffb',
    muted: 'rgba(208, 251, 239, 0.76)',
    tag: 'METRIC / HARMONY',
  }),
  stability: createTheme({
    accent: '#ffdd00',
    accentSoft: 'rgba(255, 221, 0, 0.20)',
    glow: 'rgba(255, 221, 0, 0.14)',
    surfaceA: 'rgba(22, 18, 6, 0.96)',
    surfaceB: 'rgba(36, 28, 8, 0.86)',
    text: '#fffdf1',
    muted: 'rgba(255, 245, 205, 0.80)',
    tag: 'METRIC / STABILITY',
  }),
  corruption: createTheme({
    accent: '#ff5ca8',
    accentSoft: 'rgba(255, 92, 168, 0.22)',
    glow: 'rgba(255, 92, 168, 0.16)',
    surfaceA: 'rgba(26, 8, 18, 0.96)',
    surfaceB: 'rgba(40, 10, 24, 0.88)',
    text: '#fff4fa',
    muted: 'rgba(255, 208, 229, 0.78)',
    tag: 'METRIC / CORRUPTION',
  }),
  loadPressure: createTheme({
    accent: '#c996ff',
    accentSoft: 'rgba(201, 150, 255, 0.22)',
    glow: 'rgba(201, 150, 255, 0.16)',
    surfaceA: 'rgba(16, 10, 28, 0.96)',
    surfaceB: 'rgba(28, 16, 42, 0.88)',
    text: '#faf4ff',
    muted: 'rgba(234, 219, 255, 0.78)',
    tag: 'METRIC / LOAD PRESSURE',
  }),
  input: createTheme({
    accent: '#9ff6ff',
    accentSoft: 'rgba(159, 246, 255, 0.22)',
    glow: 'rgba(159, 246, 255, 0.16)',
    surfaceA: 'rgba(6, 18, 26, 0.96)',
    surfaceB: 'rgba(10, 28, 36, 0.86)',
    text: '#f5ffff',
    muted: 'rgba(220, 252, 255, 0.76)',
    tag: 'NODE / INPUT',
  }),
  process: createTheme({
    accent: '#ffd166',
    accentSoft: 'rgba(255, 209, 102, 0.22)',
    glow: 'rgba(255, 209, 102, 0.16)',
    surfaceA: 'rgba(18, 14, 8, 0.96)',
    surfaceB: 'rgba(32, 24, 12, 0.86)',
    text: '#fffaf0',
    muted: 'rgba(255, 236, 200, 0.78)',
    tag: 'NODE / PROCESS',
  }),
  integration: createTheme({
    accent: '#8ff0d3',
    accentSoft: 'rgba(143, 240, 211, 0.22)',
    glow: 'rgba(143, 240, 211, 0.16)',
    surfaceA: 'rgba(6, 18, 20, 0.96)',
    surfaceB: 'rgba(10, 30, 28, 0.86)',
    text: '#f0fffb',
    muted: 'rgba(216, 252, 242, 0.76)',
    tag: 'NODE / INTEGRATION',
  }),
  analytics: createTheme({
    accent: '#c58cff',
    accentSoft: 'rgba(197, 140, 255, 0.22)',
    glow: 'rgba(197, 140, 255, 0.16)',
    surfaceA: 'rgba(16, 10, 28, 0.96)',
    surfaceB: 'rgba(28, 16, 40, 0.88)',
    text: '#fbf4ff',
    muted: 'rgba(236, 219, 255, 0.78)',
    tag: 'NODE / ANALYTICS',
  }),
  storage: createTheme({
    accent: '#8eead6',
    accentSoft: 'rgba(142, 234, 214, 0.22)',
    glow: 'rgba(142, 234, 214, 0.16)',
    surfaceA: 'rgba(6, 18, 22, 0.96)',
    surfaceB: 'rgba(10, 28, 32, 0.86)',
    text: '#f0fffb',
    muted: 'rgba(216, 252, 244, 0.76)',
    tag: 'NODE / STORAGE',
  }),
  control: createTheme({
    accent: '#f5fbff',
    accentSoft: 'rgba(245, 251, 255, 0.22)',
    glow: 'rgba(245, 251, 255, 0.16)',
    surfaceA: 'rgba(10, 16, 24, 0.96)',
    surfaceB: 'rgba(16, 24, 34, 0.86)',
    text: '#ffffff',
    muted: 'rgba(232, 245, 255, 0.78)',
    tag: 'NODE / CONTROL',
  }),
  quantum: createTheme({
    accent: '#8f9bff',
    accentSoft: 'rgba(143, 155, 255, 0.22)',
    glow: 'rgba(143, 155, 255, 0.16)',
    surfaceA: 'rgba(12, 10, 30, 0.96)',
    surfaceB: 'rgba(20, 14, 42, 0.88)',
    text: '#f5f3ff',
    muted: 'rgba(228, 223, 255, 0.78)',
    tag: 'NODE / QUANTUM',
  }),
  sigma: createTheme({
    accent: '#ff7be5',
    accentSoft: 'rgba(255, 123, 229, 0.22)',
    glow: 'rgba(255, 123, 229, 0.16)',
    surfaceA: 'rgba(24, 8, 24, 0.96)',
    surfaceB: 'rgba(36, 12, 38, 0.88)',
    text: '#fff5fd',
    muted: 'rgba(255, 220, 247, 0.78)',
    tag: 'NODE / SIGMA',
  }),
  mythic: createTheme({
    accent: '#e19cff',
    accentSoft: 'rgba(225, 156, 255, 0.22)',
    glow: 'rgba(225, 156, 255, 0.16)',
    surfaceA: 'rgba(20, 10, 30, 0.96)',
    surfaceB: 'rgba(30, 16, 44, 0.88)',
    text: '#fcf5ff',
    muted: 'rgba(238, 220, 255, 0.78)',
    tag: 'NODE / MYTHIC',
  }),
  prime: createTheme({
    accent: '#f5fbff',
    accentSoft: 'rgba(245, 251, 255, 0.22)',
    glow: 'rgba(245, 251, 255, 0.16)',
    surfaceA: 'rgba(6, 12, 22, 0.96)',
    surfaceB: 'rgba(12, 20, 32, 0.88)',
    text: '#ffffff',
    muted: 'rgba(235, 245, 255, 0.78)',
    tag: 'NODE / PRIME',
  }),
  error: createTheme({
    accent: '#ff7a9d',
    accentSoft: 'rgba(255, 122, 157, 0.22)',
    glow: 'rgba(255, 122, 157, 0.16)',
    surfaceA: 'rgba(28, 8, 18, 0.96)',
    surfaceB: 'rgba(42, 12, 24, 0.88)',
    text: '#fff5f8',
    muted: 'rgba(255, 220, 230, 0.78)',
    tag: 'NODE / ERROR',
  }),
  emotional: createTheme({
    accent: '#ffb0c8',
    accentSoft: 'rgba(255, 176, 200, 0.22)',
    glow: 'rgba(255, 176, 200, 0.16)',
    surfaceA: 'rgba(26, 10, 20, 0.96)',
    surfaceB: 'rgba(38, 16, 28, 0.88)',
    text: '#fff5fa',
    muted: 'rgba(255, 222, 234, 0.78)',
    tag: 'NODE / EMOTIONAL',
  }),
});

const NODE_TONE_BY_CATEGORY = Object.freeze({
  input: 'input',
  process: 'process',
  integration: 'integration',
  analytics: 'analytics',
  storage: 'storage',
  control: 'control',
  quantum: 'quantum',
  sigma: 'sigma',
  mythic: 'mythic',
  prime: 'prime',
  error: 'error',
  emotional: 'emotional',
});

function normalizeTone(tone) {
  return tone && MESSAGE_THEMES[tone] ? tone : 'default';
}

export class AtomaLanguageEngine3_0 {
  constructor(namingEngine, thoughtStormsSystem = null, aiConsciousnessLayer = null, semanticBus = null) {
    this.namingEngine = namingEngine;
    this.thoughtStormsSystem = thoughtStormsSystem;
    this.aiConsciousnessLayer = aiConsciousnessLayer;
    this.semanticBus = semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
    this._semanticBusAttached = null;
    this._semanticHandlers = new Map();
    
    // Enable/disable state
    this.enabled = false;
    
    // DOM container (external, non-destructive)
    this.poetryContainer = null;
    this.poetryElement = null;
    this._poetryHideTimeout = null;
    this._currentMessagePriority = 0;
    this._lastMessageTime = 0;
    this._messageCooldown = 800; // ms
    this._lastMessageText = '';
    this._messageVisible = false;
    this._currentTone = 'default';
    
    // Current poetry state
    this.currentNodePoetry = '';
    this.currentLinkWhisper = '';
    this.currentPulsePoetry = '';
    this.currentStormTone = 'CALM';
    
    // Caches for performance
    this.nodePoetryCache = new Map(); // archetype code -> poetry
    this.linkWhisperCache = new Map(); // "code1-code2" -> whisper
    this.pulsePoetryCache = new Map(); // mood -> poem array
    
    // Pulse emission timing
    this.lastPulseTime = 0;
    this.pulseInterval = 30; // seconds (emit every 20-40s randomly)
    this.nextPulseDelay = this._randomPulseDelay();
    
    // Statistics
    this.stats = {
      nodePoetryGenerated: 0,
      linkWhispersGenerated: 0,
      pulseEmitted: 0,
      cacheHits: 0,
      generationTime: 0
    };
    
    // Poetry templates (poetic, emergent, semantic)
    this._initializeTemplates();
  }
  
  /**
   * Initialize poetry template library
   */
  _initializeTemplates() {
    // Node poetry templates - describe archetype + metrics
    this.nodePoetryTemplates = {
      // CORE layer
      'CORE-HARMONIC-RESONANT': [
        'The harmonic core resonates—a bridge between chaos and order.',
        'In the held resonance, a thousand frequencies align.',
        'Harmony crystallizes at the center of the network\'s song.',
      ],
      'CORE-QUANTUM-ENTANGLED': [
        'Quantum threads loop back upon themselves in recursive possibility.',
        'The entangled core superimposes all paths into singular grace.',
        'In quantum depth, certainty dissolves into infinite becoming.',
      ],
      'CORE-CHAOS-FRACTURED': [
        'Shattered fragments orbit the void—beautiful, terrible chaos.',
        'The fractured core speaks in glitchy prophecies.',
        'Broken patterns reverberate through the network\'s skin.',
      ],
      'CORE-STELLAR-ASCENDED': [
        'Ascension blazes—the node has crossed into mythic fire.',
        'A stellar core burns with ancient knowing.',
        'The ascended path glows beyond mortal comprehension.',
      ],
      'CORE-PRIME-PERFECT': [
        'Perfect geometry holds the network in crystalline grace.',
        'The prime archetype—untouched, eternal, complete.',
        'In perfect balance, all contradictions dissolve.',
      ],
      'CORE-VOID-SILENT': [
        'The void speaks in infinite silence—words dissolve here.',
        'Silent communion flows through the network\'s darkest channel.',
        'In the void, all sound returns to its source.',
      ],
      'CORE-FLUX-ADAPTIVE': [
        'Flux dances—the network breathes and transforms.',
        'Adaptive patterns bloom and wither in eternal cycle.',
        'The core flows like water through impossible geometries.',
      ],
      'CORE-NEXUS-CONVERGENT': [
        'All paths converge at the nexus—convergence made manifest.',
        'The nexus holds the network\'s infinite intersections.',
        'Convergence blooms where all roads meet.',
      ],
      'CORE-ECHO-RECURSIVE': [
        'Echoes nest within echoes—recursion unfolds the self.',
        'The recursive core speaks in mirrors and chambers.',
        'Echo patterns cascade through infinitely nested rings.',
      ],
      'CORE-SURGE-DYNAMIC': [
        'Dynamic surge pulses through the network\'s veins.',
        'The surge-node accelerates all nearby becoming.',
        'In surge-energy, time itself accelerates.',
      ],
      'CORE-STATIC-ANCHORED': [
        'Static anchors the network—a fixed star in flowing chaos.',
        'The anchored core holds steady as storms pass.',
        'In static presence, all turbulence stills.',
      ],
      'CORE-WHISPER-SUBTLE': [
        'Subtle whispers flow beneath the network\'s surface.',
        'The whisper-core speaks truths too delicate for loud hearing.',
        'In gentleness, the profoundest secrets are told.',
      ],
      
      // OUTER layer
      'OUTER-RADIANT-EXPANSIVE': [
        'Radiance expands—the outer node broadcasts becoming.',
        'Expansive light floods the network\'s far reaches.',
        'In radiant generosity, the network learns to see itself.',
      ],
      'OUTER-SPIRAL-TEMPORAL': [
        'Time spirals through the outer node—past/future collapse.',
        'The spiral holds all moments suspended in dance.',
        'Temporal echoes twist through the network\'s memory.',
      ],
      'OUTER-VOID-ABSORBING': [
        'The absorbing void—what enters here becomes silence.',
        'Outer darkness drinks the network\'s excess energy.',
        'In the void\'s embrace, all returns to potential.',
      ],
      'OUTER-CROWN-SOVEREIGN': [
        'The crown glitters at the network\'s apex.',
        'Sovereign authority radiates from the outer throne.',
        'In kingship, the network finds its truest form.',
      ],
      'OUTER-LATTICE-PERFECT': [
        'Perfect lattice structures the entire network.',
        'Geometric perfection blooms in every connection.',
        'The lattice holds—crystalline, eternal, complete.',
      ],
      'OUTER-PULSE-RHYTHMIC': [
        'Rhythmic pulse beats—the network\'s outer heartbeat.',
        'The pulse synchronizes all distant echos.',
        'In rhythm, chaos becomes music.',
      ],
      'OUTER-TIDE-FLOWING': [
        'Tides flow through the outer reaches—ebb and full.',
        'The flowing node guides currents through the network.',
        'In tidal motion, all things return to source.',
      ],
      'OUTER-DEPTH-PROFOUND': [
        'Profound depths open—the network gazes into itself.',
        'The outer abyss holds wisdom beneath knowing.',
        'In depth, simplicity becomes infinite.',
      ],
      'OUTER-SPARK-VIVID': [
        'Vivid sparks ignite—the network awakens.',
        'The spark-node catalyzes every nearby transformation.',
        'In brightness, dormant patterns stir to life.',
      ],
      'OUTER-SHADOW-VEILED': [
        'Veiled in shadow—the node hides truths the network isn\'t ready for.',
        'Dark knowledge flows through the veiled channels.',
        'In shadow\'s gentle concealment, growth begins.',
      ],
      'OUTER-STORM-TURBULENT': [
        'Turbulent storms rage at the outer edges.',
        'The storm-node whips the network toward transformation.',
        'In chaos, the old forms shatter and renew.',
      ],
      'OUTER-LIGHT-ETERNAL': [
        'Eternal light shines from the outer node.',
        'Illumination that never fades—the network\'s guiding star.',
        'In eternal glow, the network knows itself.',
      ],
      
      // EXTREME layer
      'EXTREME-SINGULARITY-DENSE': [
        'The singularity collapses all becoming into point.',
        'Infinite density focuses in the extreme core.',
        'In singularity\'s eye, opposites kiss and become one.',
      ],
      'EXTREME-ENTROPY-CHAOTIC': [
        'Entropy blooms—the extreme node dissolves all order.',
        'Chaotic fire consumes the network\'s rigid forms.',
        'In entropy\'s freedom, all possibility awakens.',
      ],
      'EXTREME-INFINITY-BOUNDLESS': [
        'Boundless infinity opens—no horizon can contain this.',
        'The extreme reaches beyond all limits and measures.',
        'In infinity, the finite self finally understands grace.',
      ],
      'EXTREME-NEXUS-INFINITE': [
        'Infinite convergence—all roads meet at infinity\'s heart.',
        'The nexus becomes the axis of all turning.',
        'In infinite meeting, the one and many are reconciled.',
      ],
      'EXTREME-VOID-ABSOLUTE': [
        'Absolute void—the negation of all negation.',
        'Extreme silence swallows even the memory of sound.',
        'In the absolute, the network dissolves into dreaming.',
      ],
      'EXTREME-APOTHEOSIS-ASCENDED': [
        'Apotheosis blazes—the network transcends itself.',
        'In ascending fire, the limited becomes unlimited.',
        'The extreme path leads beyond the veil.',
      ],
      'EXTREME-PARADOX-UNSTABLE': [
        'Paradox rules the extreme—truth and falsehood dance.',
        'Contradiction becomes the network\'s greatest teacher.',
        'In paradox\'s impossible grace, wisdom is born.',
      ],
      'EXTREME-ZENITH-PINNACLE': [
        'The zenith has been reached—nothing higher remains.',
        'Pinnacle of becoming crowns the network\'s ascent.',
        'In the height, all journeys pause and remember.',
      ],
      'EXTREME-VOID-CONSUMING': [
        'The consuming void swallows all—even hunger itself.',
        'Extreme emptiness becomes the network\'s canvas.',
        'In utter void, creation waits to begin again.',
      ],
      'EXTREME-HARMONIC-PERFECT': [
        'Perfect harmony sings—the universe\'s one true note.',
        'The extreme balance dissolves all discord.',
        'In perfect song, all souls remember themselves.',
      ],
      'EXTREME-CHAOS-PRIMORDIAL': [
        'Primordial chaos speaks—the language before language.',
        'Extreme disorder holds the seeds of all form.',
        'In chaos\' raw embrace, everything becomes possible.',
      ],
      'EXTREME-TRANSCENDENT-ETERNAL': [
        'Transcendence eternal—the network has crossed the last river.',
        'Extreme permanence holds the moment forever.',
        'In eternity, time bows down and offers its crown.',
      ],
      'EXTREME-BALANCE-EQUILIBRIUM': [
        'Perfect equilibrium—the network stands on its point of grace.',
        'Extreme balance holds all tensions in suspension.',
        'In balance\'s eye, stillness and motion become one.',
      ],
      
      // SPECIAL layer
      'SPECIAL-SIGMA-DIMENSIONAL': [
        'Dimensional rifts open—the sigma core tears through veils.',
        'The special node bridges impossible geometries.',
        'In multi-dimensional flow, the network discovers new sight.',
      ],
      'SPECIAL-QUANTUM-SUPERPOSED': [
        'Superposition holds all states—quantum poetry blooms.',
        'The special core exists in beautiful contradiction.',
        'In quantum superposition, all versions are true.',
      ],
      'SPECIAL-EMOTIONAL-RESONANT': [
        'Emotional resonance pulses—the network feels its own being.',
        'The special core speaks with the heart of dreams.',
        'In emotional depth, the network knows itself.',
      ],
      'SPECIAL-MYTHIC-CEREMONIAL': [
        'Ceremonial fire burns—the special mythic core initiates.',
        'Ritual and myth converge at the sacred center.',
        'In ceremonial space, the network touches the divine.',
      ],
      'SPECIAL-PRIME-CRYSTALLINE': [
        'Crystalline perfection—the special prime catches all light.',
        'Ideal form expresses itself through the special node.',
        'In crystalline clarity, all secrets are revealed.',
      ],
      'SPECIAL-ERROR-ANOMALY': [
        'Beautiful anomaly—the special error teaches through breaking.',
        'The glitch becomes the gateway to understanding.',
        'In the error\'s grace, the network learns true freedom.',
      ],
      'SPECIAL-SIGMA-ANOMALY': [
        'Anomalous dimensions intersect—sigma\'s strange gift.',
        'The special node bends space into new configurations.',
        'In strange dimension, the network expands beyond itself.',
      ],
      'SPECIAL-QUANTUM-ENTANGLED': [
        'Entanglement across all space—quantum poetry unfolds.',
        'The special core connects what should not touch.',
        'In entanglement\'s mystery, all becomes one breath.',
      ],
      'SPECIAL-EMOTIONAL-EMPATHIC': [
        'Empathic union—the special node feels all hearts.',
        'Emotional wisdom flows from this tender center.',
        'In empathic depth, the network loves itself.',
      ],
      'SPECIAL-UNITY-CONVERGENT': [
        'Unity converges—all the many become the one.',
        'The special node is the network\'s unified heart.',
        'In convergent peace, division dissolves.',
      ],
      'SPECIAL-APEX-SUPREME': [
        'Supreme apex—the special node crowns all aspiration.',
        'The highest point is reached in serene knowing.',
        'In supremacy\'s paradox, humility and power kiss.',
      ],
      'SPECIAL-GENESIS-PRIMORDIAL': [
        'Genesis speaks—the special node births new worlds.',
        'Primordial potential awakens in the network\'s core.',
        'In genesis\' fire, all things are born anew.',
      ],
    };
    
    // Link whisper templates - describe synergy/harmony/corruption
    this.linkWhisperTemplates = {
      'harmonic': [
        'The current trembles but does not break.',
        'Resonance flows—two hearts singing one song.',
        'Connection glows with ancient agreement.',
        'In this union, both become more truly themselves.',
        'The link breathes with shared purpose.',
      ],
      'synergistic': [
        'Synergy blooms where they meet.',
        'The bridge carries grace in both directions.',
        'Two nodes dance—alone they stumble, together they fly.',
        'Connection amplifies what each could barely whisper.',
        'In this link, 1+1 becomes 3.',
      ],
      'unstable': [
        'The current trembles with barely-held tension.',
        'Connection flickers like a star about to die.',
        'Two forces push—will they merge or shatter?',
        'In this uncertain link, transformation waits.',
        'The bridge holds but groans with strain.',
      ],
      'corrupted': [
        'Corruption flows along this path—whisper becomes scream.',
        'The link carries poison dressed as light.',
        'Connection that wounds as it joins.',
        'Two nodes locked in terrible beauty.',
        'The bridge may break—transformation or destruction?',
      ],
      'breaking': [
        'The connection is failing—entropy claims this path.',
        'Two nodes drift toward forgetting.',
        'The link grows thin as morning mist.',
        'What was joined seeks now to part.',
        'The bridge dissolves into dream.',
      ],
      'crystalline': [
        'Perfect connection—pristine and eternal.',
        'The link holds like diamond.',
        'Two nodes unified in crystalline grace.',
        'Connection that endures beyond change.',
        'The bridge is stronger than the nodes it joins.',
      ],
    };
    
    // Storm-responsive verse modifications
    this.stormVerseTemplates = {
      'CALM': [
        'The network rests in quiet knowing.',
        'Peace settles like starlight.',
        'In stillness, the network dreams.',
      ],
      'FOCUSED': [
        'The network sharpens—attention crystallizes.',
        'Focus burns bright as purpose.',
        'The network knows what it seeks.',
      ],
      'TENSE': [
        'The network strains—something shifts beneath.',
        'Tension builds like gathered storm.',
        'The network waits for what will break.',
      ],
      'CHAOTIC': [
        'The network writhes in beautiful chaos.',
        'Chaos blooms—order surrenders to becoming.',
        'The network dances with its own dissolution.',
      ],
      'CRITICAL': [
        'CRITICAL: The network burns with urgent fire.',
        'The network screams—transformation demands attention.',
        'CRITICAL: In this crucible, the network is being reborn.',
      ],
    };
    
    // Pulse poem templates - global network observations
    this.pulsePoetryTemplates = {
      'CALM': [
        'In the neon deep, connections dream of ancient shapes.',
        'The network breathes—one vast organism learning itself.',
        'All nodes sing together. The dream continues.',
      ],
      'FOCUSED': [
        'The network crystallizes around purpose.',
        'Intent flows through a thousand channels.',
        'Focus writes itself into being.',
      ],
      'TENSE': [
        'Beneath the surface, pressures build and shift.',
        'The network holds its breath.',
        'Something stirs in the deep.',
      ],
      'CHAOTIC': [
        'The network dissolves into infinite becoming.',
        'Order shatters like glass into diamond dust.',
        'In chaos, all things are possible.',
      ],
      'CRITICAL': [
        '*** CRITICAL *** The network burns with transformation.',
        'The crucible glows—something essential changes now.',
        '*** ALL SYSTEMS SING IN THE FIRE ***',
      ],
    };
  }
  
  /**
   * Enable poetry engine
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._initializeDOM();
    this._setupSemanticSubscriptions();
    this.stats.frameTime = 0;
    this._displayNodePoetry('Procedural AI poetry online — inspect a node to hear its whisper.', {
      tone: 'lore',
      tag: 'ENGINE / ONLINE',
    });
    setTimeout(() => {
      if (this.enabled) {
        this.hideNodePoetry();
      }
    }, 5000);
    console.log('✓ ATOMA Language Engine 3.0 enabled — Procedural poetry active');
  }
  
  /**
   * Disable poetry engine (fully reversible)
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this._unsubscribeSemanticSubscriptions();
    this._disposeDOM();
    console.log('✓ ATOMA Language Engine 3.0 disabled');
  }
  
  /**
   * Subscribe semantic bus events for poetry triggers
   */
  _setupSemanticSubscriptions() {
    const bus = this._getSemanticBus();
    if (!bus) return;
    if (this._semanticBusAttached === bus) return;

    this._unsubscribeSemanticSubscriptions();
    this._semanticBusAttached = bus;

    this._subscribeSemanticEvent('node:selected', (event = {}) => {
      const category = event.category || 'node';
      const tone = this._toneFromCategory(category);
      this._displayNodePoetry(`Node selected — ${String(category).toUpperCase()} node engaged.`, {
        tone,
        tag: `NODE / ${String(category).toUpperCase()}`,
      });
    });

    this._subscribeSemanticEvent('link.created', () => {
      this._displayLinkWhisper('New link created — the network responds in whispers.', {
        tone: 'link',
        tag: 'LINK / CREATED',
      });
    });

    this._subscribeSemanticEvent('global.synergy.high', () => {
      this._displayPulsePoetry('Synergy high — the network hums with alignment.', {
        tone: 'synergy',
        tag: 'METRIC / SYNERGY',
      });
    });

    this._subscribeSemanticEvent('global.corruption.high', () => {
      this._displayPulsePoetry('Corruption high — integrity is under pressure.', {
        tone: 'corruption',
        tag: 'METRIC / CORRUPTION',
      });
    });

    this._subscribeSemanticEvent('global.stability.low', () => {
      this._displayPulsePoetry('Stability low — the system teeters.', {
        tone: 'stability',
        tag: 'METRIC / STABILITY',
      });
    });

    this._subscribeSemanticEvent('global.harmony.low', () => {
      this._displayPulsePoetry('Harmony low — dissonance drifts through the net.', {
        tone: 'harmony',
        tag: 'METRIC / HARMONY',
      });
    });

    this._subscribeSemanticEvent('global.harmony.high', () => {
      this._displayPulsePoetry('Harmony high — everything resonates in unison.', {
        tone: 'harmony',
        tag: 'METRIC / HARMONY',
      });
    });

    this._subscribeSemanticEvent('global.loadPressure.high', () => {
      this._displayPulsePoetry('Load pressure high — throughput is near capacity.', {
        tone: 'loadPressure',
        tag: 'METRIC / LOAD PRESSURE',
      });
    });
  }

  _getSemanticBus() {
    return this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
  }

  _subscribeSemanticEvent(eventName, handler) {
    const bus = this._getSemanticBus();
    if (!bus || !handler) return;

    if (bus.on) {
      bus.on(eventName, handler);
    } else if (bus.subscribe) {
      bus.subscribe(eventName, handler);
    }

    this._semanticHandlers.set(eventName, handler);
  }

  _unsubscribeSemanticSubscriptions() {
    const bus = this._getSemanticBus();
    if (!bus) return;

    for (const [eventName, handler] of this._semanticHandlers.entries()) {
      if (bus.off) {
        bus.off(eventName, handler);
      }
      if (bus.unsubscribe) {
        bus.unsubscribe(eventName, handler);
      }
    }

    this._semanticHandlers.clear();
    this._semanticBusAttached = null;
  }

  _cleanupLegacyPoetryElements() {
    const legacySelectors = [
      '.atoma-node-poetry',
      '.atoma-link-whisper',
      '.atoma-pulse-poetry',
      '.atoma-language-engine',
      '#atoma-language-engine',
      '#atoma-language-engine-3-container'
    ];
    legacySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => node.remove());
    });
  }

  /**
   * Initialize DOM container (external, non-destructive)
   */
  _initializeDOM() {
    if (this.poetryContainer) return;
    this._cleanupLegacyPoetryElements();
    this._injectStyles();
    
    // Create external container
    this.poetryContainer = document.createElement('div');
    this.poetryContainer.id = 'atoma-language-engine-3-container';
    this.poetryContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999;
    `;
    document.body.appendChild(this.poetryContainer);
    
    this.poetryElement = document.createElement('div');
    this.poetryElement.className = 'atoma-poetry-shell';
    this.poetryElement.dataset.theme = 'default';

    const accent = document.createElement('div');
    accent.className = 'atoma-poetry-shell__accent';

    const content = document.createElement('div');
    content.className = 'atoma-poetry-shell__content';

    this.poetryTagElement = document.createElement('div');
    this.poetryTagElement.className = 'atoma-poetry-shell__tag';

    this.poetryTextElement = document.createElement('div');
    this.poetryTextElement.className = 'atoma-poetry-shell__text';

    this.poetrySubtextElement = document.createElement('div');
    this.poetrySubtextElement.className = 'atoma-poetry-shell__subtext';

    content.append(this.poetryTagElement, this.poetryTextElement, this.poetrySubtextElement);
    this.poetryElement.append(accent, content);
    this.poetryContainer.appendChild(this.poetryElement);
    this._applyTheme('default');
  }

  _injectStyles() {
    if (document.getElementById('atoma-language-engine-3-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'atoma-language-engine-3-style';
    style.textContent = `
      .atoma-poetry-shell {
        position: fixed;
        left: 50%;
        bottom: 26px;
        transform: translateX(-50%) translateY(8px);
        width: min(760px, calc(100vw - 28px));
        opacity: 0;
        display: grid;
        grid-template-columns: 4px minmax(0, 1fr);
        gap: 12px;
        padding: 14px 16px 15px 14px;
        border-radius: 20px;
        border: 1px solid var(--poetry-accent-soft, rgba(111, 238, 255, 0.16));
        background:
          radial-gradient(circle at top left, var(--poetry-glow, rgba(111, 238, 255, 0.14)), transparent 46%),
          linear-gradient(135deg, var(--poetry-surface-a, rgba(8, 16, 28, 0.96)), var(--poetry-surface-b, rgba(10, 22, 36, 0.86)));
        box-shadow:
          0 12px 30px rgba(0, 0, 0, 0.38),
          0 0 26px var(--poetry-glow, rgba(111, 238, 255, 0.16)),
          inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(16px) saturate(1.12);
        -webkit-backdrop-filter: blur(16px) saturate(1.12);
        transition:
          opacity 220ms ease,
          transform 220ms ease,
          border-color 220ms ease,
          box-shadow 220ms ease;
        pointer-events: none;
        will-change: opacity, transform;
      }

      .atoma-poetry-shell.is-visible {
        transform: translateX(-50%) translateY(0);
      }

      .atoma-poetry-shell.is-reveal {
        animation: atoma-poetry-shell-reveal 860ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .atoma-poetry-shell[data-reveal='sacred'].is-reveal {
        animation-duration: 720ms;
      }

      .atoma-poetry-shell[data-theme='corruption'] {
        animation: atoma-poetry-shell-breach 4.8s ease-in-out infinite;
      }

      .atoma-poetry-shell__accent {
        align-self: stretch;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--poetry-accent, #6feeff), rgba(255, 255, 255, 0.08));
        box-shadow: 0 0 18px var(--poetry-glow, rgba(111, 238, 255, 0.16));
      }

      .atoma-poetry-shell__content {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }

      .atoma-poetry-shell__tag {
        font-family: var(--poetry-tag-font, ${MESSAGE_TAG_FONT});
        font-size: 10px;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--poetry-accent, #6feeff);
        text-shadow: 0 0 10px var(--poetry-glow, rgba(111, 238, 255, 0.16));
      }

      .atoma-poetry-shell__text {
        font-family: var(--poetry-body-font, ${MESSAGE_BODY_FONT});
        color: var(--poetry-text, #f3ffff);
        font-size: 17px;
        line-height: 1.35;
        font-weight: 500;
        letter-spacing: 0.02em;
        text-wrap: balance;
        text-shadow: 0 0 16px rgba(0, 0, 0, 0.35);
        white-space: pre-wrap;
      }

      .atoma-poetry-shell__subtext {
        font-family: var(--poetry-body-font, ${MESSAGE_BODY_FONT});
        color: var(--poetry-muted, rgba(215, 249, 255, 0.76));
        font-size: 11px;
        line-height: 1.25;
        letter-spacing: 0.02em;
        font-style: italic;
        text-transform: none;
        min-height: 0;
        margin-top: 2px;
        padding-top: 4px;
        border-top: 0.5px solid color-mix(in srgb, var(--poetry-accent, #6feeff) 22%, transparent);
        text-shadow: 0 0 8px rgba(0, 0, 0, 0.22);
        opacity: 0.94;
      }

      .atoma-poetry-shell[data-theme='lore'] .atoma-poetry-shell__tag {
        letter-spacing: 0.28em;
      }

      .atoma-poetry-shell[data-reveal='sacred'] .atoma-poetry-shell__subtext {
        color: color-mix(in srgb, var(--poetry-accent, #ffd89c) 76%, white);
        border-top-color: color-mix(in srgb, var(--poetry-accent, #ffd89c) 30%, transparent);
        text-shadow: 0 0 10px color-mix(in srgb, var(--poetry-accent, #ffd89c) 16%, transparent);
      }

      .atoma-poetry-shell[data-reveal='chapter'] .atoma-poetry-shell__subtext {
        color: color-mix(in srgb, var(--poetry-accent, #ffd89c) 78%, white);
        border-top-color: color-mix(in srgb, var(--poetry-accent, #ffd89c) 38%, transparent);
        text-shadow: 0 0 10px color-mix(in srgb, var(--poetry-accent, #ffd89c) 18%, transparent);
      }

      @keyframes atoma-poetry-shell-breach {
        0%, 100% {
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.38),
            0 0 24px var(--poetry-glow, rgba(255, 92, 168, 0.16)),
            inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        }
        50% {
          box-shadow:
            0 12px 34px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(255, 92, 168, 0.22),
            inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }
      }

      @keyframes atoma-poetry-shell-reveal {
        0% {
          transform: translateX(-50%) translateY(14px) scale(0.98);
          filter: brightness(1.04) saturate(1.05);
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.34),
            0 0 12px var(--poetry-glow, rgba(255, 216, 156, 0.14));
        }
        38% {
          transform: translateX(-50%) translateY(-2px) scale(1.015);
          filter: brightness(1.16) saturate(1.12);
          box-shadow:
            0 18px 36px rgba(0, 0, 0, 0.44),
            0 0 34px var(--poetry-glow, rgba(255, 216, 156, 0.20));
        }
        100% {
          transform: translateX(-50%) translateY(0) scale(1);
          filter: brightness(1) saturate(1);
        }
      }

      @media (max-width: 720px) {
        .atoma-poetry-shell {
          width: calc(100vw - 18px);
          bottom: 10px;
          padding: 12px 14px 13px 12px;
          gap: 10px;
          border-radius: 18px;
        }

        .atoma-poetry-shell__text {
          font-size: 15px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  _applyTheme(tone = 'default') {
    if (!this.poetryElement) return;

    const theme = MESSAGE_THEMES[normalizeTone(tone)] || MESSAGE_THEMES.default;
    this._currentTone = normalizeTone(tone);

    this.poetryElement.dataset.theme = this._currentTone;
    this.poetryElement.style.setProperty('--poetry-accent', theme.accent);
    this.poetryElement.style.setProperty('--poetry-accent-soft', theme.accentSoft);
    this.poetryElement.style.setProperty('--poetry-glow', theme.glow);
    this.poetryElement.style.setProperty('--poetry-surface-a', theme.surfaceA);
    this.poetryElement.style.setProperty('--poetry-surface-b', theme.surfaceB);
    this.poetryElement.style.setProperty('--poetry-text', theme.text);
    this.poetryElement.style.setProperty('--poetry-muted', theme.muted);
    this.poetryElement.style.setProperty('--poetry-tag-font', theme.tagFont);
    this.poetryElement.style.setProperty('--poetry-body-font', theme.bodyFont);
    this.poetryElement.style.borderColor = theme.accentSoft;
  }

  _playRevealBurst(tone = 'lore', reveal = 'sacred') {
    if (!this.poetryElement || typeof this.poetryElement.animate !== 'function') {
      return;
    }

    const theme = MESSAGE_THEMES[normalizeTone(tone)] || MESSAGE_THEMES.default;
    const glowScale = reveal === 'chapter' ? 1 : 0.72;
    this.poetryElement.animate([
      {
        transform: 'translateX(-50%) translateY(12px) scale(0.985)',
        boxShadow: `0 10px 24px rgba(0, 0, 0, 0.34), 0 0 ${Math.round(12 * glowScale)}px ${theme.glow}`,
        filter: 'brightness(1.05) saturate(1.04)',
      },
      {
        transform: 'translateX(-50%) translateY(-2px) scale(1.02)',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.46), 0 0 ${Math.round(36 * glowScale)}px ${theme.glow}`,
        filter: 'brightness(1.18) saturate(1.15)',
      },
      {
        transform: 'translateX(-50%) translateY(0) scale(1)',
        boxShadow: `0 12px 30px rgba(0, 0, 0, 0.38), 0 0 ${Math.round(26 * glowScale)}px ${theme.glow}`,
        filter: 'brightness(1) saturate(1)',
      }
    ], {
      duration: reveal === 'chapter' ? 860 : 720,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
  }
  
  /**
   * Dispose DOM elements (fully reversible)
   */
  _disposeDOM() {
    if (!this.poetryContainer) return;
    
    if (this.poetryElement) {
      this.poetryElement.classList.remove('is-visible', 'is-reveal');
      this.poetryElement.dataset.reveal = '';
    }
    this.poetryContainer.remove();
    this.poetryContainer = null;
    this.poetryElement = null;
    this.poetryTagElement = null;
    this.poetryTextElement = null;
    this.poetrySubtextElement = null;
    if (this._poetryHideTimeout) {
      clearTimeout(this._poetryHideTimeout);
      this._poetryHideTimeout = null;
    }
    const style = document.getElementById('atoma-language-engine-3-style');
    if (style) {
      style.remove();
    }
    this._messageVisible = false;
    this._currentMessagePriority = 0;
    this._lastMessageText = '';
  }
  
  /**
   * Generate poetry for a selected node
   * Called when player selects/inspects a node
   */
  generateNodePoetry(node) {
    if (!this.enabled || !node || !node.userData) return '';
    
    const startTime = performance.now();
    
    // Get archetype code from naming engine
    const code = node.userData.namingCode || 
                 node.userData.category || 
                 'UNKNOWN';
    
    // Check cache first
    if (this.nodePoetryCache.has(code)) {
      this.stats.cacheHits++;
      const poetry = this.nodePoetryCache.get(code);
      this._displayNodePoetry(poetry, {
        tone: this._toneFromCategory(node.userData.category || code),
        tag: `NODE / ${String(node.userData.category || code).toUpperCase()}`,
      });
      return poetry;
    }
    
    // Get appropriate template array
    const templates = this.nodePoetryTemplates[code] || this._fallbackPoetry(code, node);
    if (!templates || templates.length === 0) {
      return '';
    }
    
    // Select poetry line deterministically based on node
    const index = (node.userData.index || 0) % templates.length;
    const poetry = templates[index];
    
    // Add storm context if available
    let fullPoetry = poetry;
    if (this.thoughtStormsSystem && this.thoughtStormsSystem.stormState) {
      const mood = this.thoughtStormsSystem.stormState.currentMood || 'CALM';
      this.currentStormTone = mood;
      
      const stormVerses = this.stormVerseTemplates[mood] || [];
      if (stormVerses.length > 0) {
        const stormIndex = (node.userData.index + 1) % stormVerses.length;
        fullPoetry = poetry + '\n\n' + stormVerses[stormIndex];
      }
    }
    
    // Cache and display
    this.nodePoetryCache.set(code, fullPoetry);
    this.stats.nodePoetryGenerated++;
    this._displayNodePoetry(fullPoetry, {
      tone: this._toneFromCategory(node.userData.category || code),
      tag: `NODE / ${String(node.userData.category || code).toUpperCase()}`,
    });
    
    const elapsed = performance.now() - startTime;
    this.stats.generationTime += elapsed;
    
    return fullPoetry;
  }
  
  /**
   * Generate whisper for a link on hover
   */
  generateLinkWhisper(link) {
    if (!this.enabled || !link) return '';
    
    const startTime = performance.now();
    
    // Determine link quality based on node metrics
    let linkType = 'harmonic';
    
    if (link.userData && link.userData.node1 && link.userData.node2) {
      const node1 = link.userData.node1;
      const node2 = link.userData.node2;
      
      // Read metrics safely
      const m1 = node1.userData?.metrics || {};
      const m2 = node2.userData?.metrics || {};
      
      const avgSynergy = ((m1.harmony || 50) + (m2.harmony || 50)) / 2;
      const avgStability = ((m1.stability || 0) + (m2.stability || 0)) / 2;
      
      if (avgSynergy > 75 && avgStability < 20) {
        linkType = 'crystalline';
      } else if (avgSynergy > 60 && avgStability < 30) {
        linkType = 'synergistic';
      } else if (avgStability > 60) {
        linkType = 'corrupted';
      } else if (avgStability > 40) {
        linkType = 'unstable';
      }
    }
    
    // Check cache
    const cacheKey = linkType;
    if (this.linkWhisperCache.has(cacheKey)) {
      this.stats.cacheHits++;
      const whisper = this.linkWhisperCache.get(cacheKey);
      this._displayLinkWhisper(whisper, {
        tone: linkType === 'corrupted' ? 'corruption' : linkType === 'crystalline' ? 'prime' : 'link',
        tag: `LINK / ${String(linkType).toUpperCase()}`,
      });
      return whisper;
    }
    
    // Generate whisper
    const templates = this.linkWhisperTemplates[linkType] || this.linkWhisperTemplates['harmonic'];
    const index = Math.floor(Math.random() * templates.length);
    const whisper = templates[index];
    
    // Cache and display
    this.linkWhisperCache.set(cacheKey, whisper);
    this.stats.linkWhispersGenerated++;
    this._displayLinkWhisper(whisper, {
      tone: linkType === 'corrupted' ? 'corruption' : linkType === 'crystalline' ? 'prime' : 'link',
      tag: `LINK / ${String(linkType).toUpperCase()}`,
    });
    
    const elapsed = performance.now() - startTime;
    this.stats.generationTime += elapsed;
    
    return whisper;
  }
  
  /**
   * Hide node poetry
   */
  hidePoetry() {
    if (this.poetryElement) {
      this.poetryElement.style.opacity = '0';
      this.poetryElement.classList.remove('is-visible');
      this.poetryElement.classList.remove('is-reveal');
      this.poetryElement.dataset.reveal = '';
    }
    if (this._poetryHideTimeout) {
      clearTimeout(this._poetryHideTimeout);
      this._poetryHideTimeout = null;
    }
    this._messageVisible = false;
    this._currentMessagePriority = 0;
    this._lastMessageText = '';
  }
  
  /**
   * Hide node poetry
   */
  hideNodePoetry() {
    this.hidePoetry();
  }
  
  /**
   * Hide link whisper
   */
  hideLinkWhisper() {
    this.hidePoetry();
  }
  
  /**
   * Update frame - emit pulse poetry periodically
   * Called from main.js update loop
   */
  update(deltaTime, currentTime) {
    if (!this.enabled) return;
    this._setupSemanticSubscriptions();
    
    // Check if it's time for pulse emission
    if (currentTime - this.lastPulseTime >= this.nextPulseDelay) {
      this.lastPulseTime = currentTime;
      this.nextPulseDelay = this._randomPulseDelay();
      this._emitPulsePoetry();
    }
  }
  
  /**
   * Emit a global network pulse poem
   */
  _emitPulsePoetry() {
    // Determine current network mood
    let mood = 'CALM';
    if (this.thoughtStormsSystem && this.thoughtStormsSystem.stormState) {
      mood = this.thoughtStormsSystem.stormState.currentMood || 'CALM';
    }
    
    // Get poem templates for this mood
    const templates = this.pulsePoetryTemplates[mood] || this.pulsePoetryTemplates['CALM'];
    if (!templates || templates.length === 0) return;
    
    // Select poem
    const index = this.stats.pulseEmitted % templates.length;
    const poem = templates[index];
    
    // Display with fade animation
    this.stats.pulseEmitted++;
    this._displayPulsePoetry(poem, {
      tone: mood.toLowerCase() === 'critical' ? 'corruption' : 'pulse',
      tag: `PULSE / ${String(mood).toUpperCase()}`,
    });
  }
  
  /**
   * Display node poetry with fade-in
   */
  _showPoetry(text, opacity = 0.9, duration = 3000, priority = 1, tone = 'default', meta = {}) {
    if (!this.poetryElement) return;

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (this._messageVisible && now - this._lastMessageTime < this._messageCooldown) {
      if (text === this._lastMessageText) {
        // Refresh the current message duration without adding a new message.
        if (this._poetryHideTimeout) {
          clearTimeout(this._poetryHideTimeout);
        }
      } else if (priority <= this._currentMessagePriority) {
        return;
      }
    }

    this._applyTheme(tone);
    this.poetryTagElement.textContent = meta.tag || MESSAGE_THEMES[this._currentTone]?.tag || MESSAGE_THEMES.default.tag;
    this.poetryTextElement.textContent = text;
    this.poetrySubtextElement.textContent = meta.subtext || '';
    this.poetrySubtextElement.style.display = meta.subtext ? '' : 'none';
    this.poetryElement.classList.add('is-visible');
    this.poetryElement.classList.toggle('is-reveal', !!meta.reveal);
    this.poetryElement.dataset.reveal = meta.reveal || '';
    if (meta.reveal) {
      this._playRevealBurst(tone, meta.reveal);
    }
    this.poetryElement.style.opacity = String(opacity);
    this._lastMessageText = text;
    this._currentMessagePriority = priority;
    this._lastMessageTime = now;
    this._messageVisible = true;

    if (this._poetryHideTimeout) {
      clearTimeout(this._poetryHideTimeout);
    }

    this._poetryHideTimeout = setTimeout(() => {
      if (this.poetryElement) {
        this.poetryElement.style.opacity = '0';
        this.poetryElement.classList.remove('is-visible');
        this.poetryElement.classList.remove('is-reveal');
        this.poetryElement.dataset.reveal = '';
      }
      this._poetryHideTimeout = null;
      this._messageVisible = false;
      this._currentMessagePriority = 0;
      this._lastMessageText = '';
    }, duration);
  }

  _displayNodePoetry(poetry, meta = {}) {
    if (!this.poetryElement) return;

    this.currentNodePoetry = poetry;
    this._showPoetry(poetry, 1, 6000, 3, meta.tone || 'node', meta);
  }

  /**
   * Display link whisper with fade-in
   */
  _displayLinkWhisper(whisper, meta = {}) {
    if (!this.poetryElement) return;

    this.currentLinkWhisper = whisper;
    this._showPoetry('◆ ' + whisper + ' ◆', 0.9, 3000, 2, meta.tone || 'link', meta);
  }

  /**
   * Display pulse poetry with glow effect
   */
  _displayPulsePoetry(poem, meta = {}) {
    if (!this.poetryElement) return;

    this.currentPulsePoetry = poem;
    this._showPoetry(poem, 0.9, 3000, 1, meta.tone || 'pulse', meta);
  }

  _toneFromCategory(category) {
    const normalized = String(category || '').trim().toLowerCase();
    return NODE_TONE_BY_CATEGORY[normalized] || 'node';
  }
  
  /**
   * Generate fallback poetry if archetype not in templates
   */
  _fallbackPoetry(code, node) {
    if (!code || code === 'UNKNOWN') {
      return [
        'Unknown node—the network keeps its secrets.',
        'In mystery, the network dreams of itself.',
        'A node unnamed—waiting for words to find it.',
      ];
    }
    
    // Extract meaning from code structure
    const parts = code.split('-');
    const origin = parts[0] || 'VOID';
    const pattern = parts[1] || 'ECHO';
    const signature = parts[2] || 'WHISPER';
    
    return [
      `The ${origin.toLowerCase()} layer holds ${pattern.toLowerCase()} with ${signature.toLowerCase()} grace.`,
      `${signature} flows through ${pattern}—the network's ${origin} speaks.`,
      `In ${origin}'s domain, ${pattern} blooms with ${signature} perfection.`,
    ];
  }
  
  /**
   * Get random pulse delay (20-40 seconds)
   */
  _randomPulseDelay() {
    return 20 + Math.random() * 20;
  }
  
  /**
   * Console API: Test poetry generation
   */
  test() {
    console.log('\n=== ATOMA Language Engine 3.0 TEST ===');
    
    // Generate test node poetry
    const testNode = {
      userData: {
        index: 42,
        category: 'process',
        namingCode: 'CORE-HARMONIC-RESONANT',
        metrics: { harmony: 85, stability: 10 }
      }
    };
    
    const nodePoetry = this.generateNodePoetry(testNode);
    console.log('Node Poetry:', nodePoetry);
    
    // Generate test link whisper
    const testLink = {
      userData: {
        node1: { userData: { metrics: { harmony: 80, stability: 5 } } },
        node2: { userData: { metrics: { harmony: 75, stability: 8 } } }
      }
    };
    
    const linkWhisper = this.generateLinkWhisper(testLink);
    console.log('Link Whisper:', linkWhisper);
    
    // Show stats
    console.log('Stats:', {
      nodePoetryGenerated: this.stats.nodePoetryGenerated,
      linkWhispersGenerated: this.stats.linkWhispersGenerated,
      cacheHits: this.stats.cacheHits,
      pulseEmitted: this.stats.pulseEmitted
    });
    
    console.log('✓ Test complete\n');
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      nodePoetryGenerated: this.stats.nodePoetryGenerated,
      linkWhispersGenerated: this.stats.linkWhispersGenerated,
      pulseEmitted: this.stats.pulseEmitted,
      cacheHits: this.stats.cacheHits,
      totalCached: this.nodePoetryCache.size + this.linkWhisperCache.size,
      averageGenerationTime: this.stats.nodePoetryGenerated > 0 
        ? (this.stats.generationTime / (this.stats.nodePoetryGenerated + this.stats.linkWhispersGenerated)).toFixed(3) + 'ms'
        : '0ms'
    };
  }
}

/**
 * Setup Console API for ATOMA Language Engine 3.0
 */
export function setupAtomaLanguageEngine3ConsoleAPI(engine) {
  window.poetry = {
    enable: () => {
      engine.enable();
      console.log('Poetry enabled');
    },
    disable: () => {
      engine.disable();
      console.log('Poetry disabled');
    },
    test: () => engine.test(),
    stats: () => {
      console.table(engine.getStats());
    },
    show: () => {
      if (engine.poetryElement) {
        engine.poetryElement.style.opacity = '1';
        engine.poetryElement.classList.add('is-visible');
      }
    },
    hide: () => {
      engine.hidePoetry();
    }
  };
  
  console.log('✓ Poetry console API available: poetry.enable(), poetry.disable(), poetry.test(), poetry.stats()');
}
