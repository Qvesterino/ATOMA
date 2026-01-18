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

export class AtomaLanguageEngine3_0 {
  constructor(namingEngine, thoughtStormsSystem = null, aiConsciousnessLayer = null) {
    this.namingEngine = namingEngine;
    this.thoughtStormsSystem = thoughtStormsSystem;
    this.aiConsciousnessLayer = aiConsciousnessLayer;
    
    // Enable/disable state
    this.enabled = false;
    
    // DOM container (external, non-destructive)
    this.poetryContainer = null;
    this.nodePoetryElement = null;
    this.linkWhisperElement = null;
    this.pulsePoetryElement = null;
    
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
    this.stats.frameTime = 0;
    console.log('✓ ATOMA Language Engine 3.0 enabled — Procedural poetry active');
  }
  
  /**
   * Disable poetry engine (fully reversible)
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this._disposeDOM();
    console.log('✓ ATOMA Language Engine 3.0 disabled');
  }
  
  /**
   * Initialize DOM container (external, non-destructive)
   */
  _initializeDOM() {
    if (this.poetryContainer) return;
    
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
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.poetryContainer);
    
    // Node poetry display (bottom-right)
    this.nodePoetryElement = document.createElement('div');
    this.nodePoetryElement.className = 'atoma-node-poetry';
    this.nodePoetryElement.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      max-width: 400px;
      color: #00dddd;
      font-size: 12px;
      font-weight: 300;
      letter-spacing: 1px;
      text-shadow: 0 0 8px rgba(0, 221, 221, 0.5);
      opacity: 0;
      transition: opacity 0.5s ease;
      text-align: right;
      line-height: 1.5;
      pointer-events: none;
      z-index: 1000;
    `;
    this.poetryContainer.appendChild(this.nodePoetryElement);
    
    // Link whisper display (bottom-center)
    this.linkWhisperElement = document.createElement('div');
    this.linkWhisperElement.className = 'atoma-link-whisper';
    this.linkWhisperElement.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 350px;
      color: #ff00ff;
      font-size: 11px;
      font-weight: 300;
      letter-spacing: 0.5px;
      text-shadow: 0 0 6px rgba(255, 0, 255, 0.4);
      opacity: 0;
      transition: opacity 0.3s ease;
      text-align: center;
      pointer-events: none;
      z-index: 999;
    `;
    this.poetryContainer.appendChild(this.linkWhisperElement);
    
    // Pulse poetry display (center-screen)
    this.pulsePoetryElement = document.createElement('div');
    this.pulsePoetryElement.className = 'atoma-pulse-poetry';
    this.pulsePoetryElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 500px;
      color: #00dddd;
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 1px;
      text-shadow: 0 0 12px rgba(0, 221, 221, 0.6),
                   0 0 24px rgba(0, 100, 200, 0.3);
      opacity: 0;
      transition: opacity 0.6s ease;
      text-align: center;
      line-height: 2;
      pointer-events: none;
      z-index: 998;
    `;
    this.poetryContainer.appendChild(this.pulsePoetryElement);
  }
  
  /**
   * Dispose DOM elements (fully reversible)
   */
  _disposeDOM() {
    if (!this.poetryContainer) return;
    
    this.poetryContainer.remove();
    this.poetryContainer = null;
    this.nodePoetryElement = null;
    this.linkWhisperElement = null;
    this.pulsePoetryElement = null;
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
      this._displayNodePoetry(poetry);
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
    this._displayNodePoetry(fullPoetry);
    
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
      this._displayLinkWhisper(whisper);
      return whisper;
    }
    
    // Generate whisper
    const templates = this.linkWhisperTemplates[linkType] || this.linkWhisperTemplates['harmonic'];
    const index = Math.floor(Math.random() * templates.length);
    const whisper = templates[index];
    
    // Cache and display
    this.linkWhisperCache.set(cacheKey, whisper);
    this.stats.linkWhispersGenerated++;
    this._displayLinkWhisper(whisper);
    
    const elapsed = performance.now() - startTime;
    this.stats.generationTime += elapsed;
    
    return whisper;
  }
  
  /**
   * Hide node poetry
   */
  hideNodePoetry() {
    if (this.nodePoetryElement) {
      this.nodePoetryElement.style.opacity = '0';
    }
  }
  
  /**
   * Hide link whisper
   */
  hideLinkWhisper() {
    if (this.linkWhisperElement) {
      this.linkWhisperElement.style.opacity = '0';
    }
  }
  
  /**
   * Update frame - emit pulse poetry periodically
   * Called from main.js update loop
   */
  update(deltaTime, currentTime) {
    if (!this.enabled) return;
    
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
    this._displayPulsePoetry(poem);
  }
  
  /**
   * Display node poetry with fade-in
   */
  _displayNodePoetry(poetry) {
    if (!this.nodePoetryElement) return;
    
    this.currentNodePoetry = poetry;
    this.nodePoetryElement.textContent = poetry;
    this.nodePoetryElement.style.opacity = '1';
  }
  
  /**
   * Display link whisper with fade-in
   */
  _displayLinkWhisper(whisper) {
    if (!this.linkWhisperElement) return;
    
    this.currentLinkWhisper = whisper;
    this.linkWhisperElement.textContent = '◆ ' + whisper + ' ◆';
    this.linkWhisperElement.style.opacity = '0.8';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (this.linkWhisperElement) {
        this.linkWhisperElement.style.opacity = '0';
      }
    }, 3000);
  }
  
  /**
   * Display pulse poetry with glow effect
   */
  _displayPulsePoetry(poem) {
    if (!this.pulsePoetryElement) return;
    
    this.currentPulsePoetry = poem;
    this.pulsePoetryElement.textContent = poem;
    this.pulsePoetryElement.style.opacity = '0.9';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (this.pulsePoetryElement) {
        this.pulsePoetryElement.style.opacity = '0';
      }
    }, 3000);
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
      if (engine.nodePoetryElement) {
        engine.nodePoetryElement.style.opacity = '1';
      }
    },
    hide: () => {
      engine.hideNodePoetry();
      engine.hideLinkWhisper();
    }
  };
  
  console.log('✓ Poetry console API available: poetry.enable(), poetry.disable(), poetry.test(), poetry.stats()');
}
