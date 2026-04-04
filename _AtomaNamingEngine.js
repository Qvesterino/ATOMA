/**
 * ATOMA NAMING ENGINE 1.0 — AI NODE LINGUISTIC LAYER
 * 
 * Pure linguistic overlay for all nodes in the network.
 * Maps existing archetype IDs to poetic tri-morphemic naming scheme:
 * 
 * FORMAT: ORIGIN-PATTERN-SIGNATURE
 * EXAMPLE: QNT-KNT-CPL, FRM-HEX-FLX, SIG-ORB-HLD
 * 
 * SAFETY GUARANTEES (ABSOLUTE):
 * ✓ Zero modifications to gameplay systems
 * ✓ Zero changes to metrics, spawn weights, shaders
 * ✓ Zero modifications to NodeLinkingSystem logic
 * ✓ Pure read-only naming layer
 * ✓ 100% reversible and optional
 * ✓ Fallback for any unknown archetypes
 * ✓ Graceful degradation
 */

export class AtomaNamingEngine {
  constructor() {
    // Tri-morphemic naming system (ORIGIN-PATTERN-SIGNATURE)
    
    // ORIGIN — Source/essence of the node
    this.origins = {
      'QNT': 'Quantum',        // Probabilistic, entangled
      'SIG': 'Singular',       // Unique, focal point
      'ECO': 'Ecosystem',      // Network, collective
      'FRM': 'Form',           // Structural, geometric
      'CHR': 'Chromatic',      // Color, spectral
      'UMB': 'Umbral',         // Shadow, hidden
      'AET': 'Aetherial',      // Transcendent, ethereal
      'ASC': 'Ascendant',      // Rising, elevated
      'LGD': 'Legendary',      // Mythic, storied
      'NEX': 'Nexus',          // Connection point, hub
      'FLX': 'Flux',           // Flowing, dynamic
      'RSN': 'Resonance',      // Harmonic, vibrating
      'VCE': 'Vortex',         // Spinning, convergent
      'INF': 'Infinite',       // Boundless, vast
      'PRM': 'Prime',          // Essential, fundamental
      'INP': 'Input',
      'PRC': 'Process',
      'INT': 'Integration',
      'ANL': 'Analytics',
      'STR': 'Storage',
      'CTL': 'Control',
      'SGM': 'Sigma',
      'MYT': 'Mythic',
      'EMO': 'Emotional',
      'ERR': 'Error'
    };
    
    // PATTERN — Structural/behavioral topology
    this.patterns = {
      'ORB': 'Orbital',        // Circular, cyclical
      'TOR': 'Toroidal',       // Donut-shaped flow
      'CRW': 'Crown',          // Hierarchical apex
      'LOT': 'Lotus',          // Layered, blooming
      'HEX': 'Hexagonal',      // Six-fold symmetry
      'VEC': 'Vector',         // Directional, linear
      'SPN': 'Spiral',         // Recursive, expanding
      'DMD': 'Diamond',        // Faceted, reflective
      'FNX': 'Phoenix',        // Cyclical rebirth
      'KNT': 'Knot',           // Tangled, complex
      'INF': 'Infinite',       // Non-terminating
      'PRL': 'Pearl',          // Layered growth
      'WVE': 'Wave',           // Oscillating, rhythmic
      'LTR': 'Lattice',        // Gridded, interconnected
      'FLX': 'Flex',           // Adaptive, responsive
      'SBR': 'Stabilizer',
      'PRS': 'Pressure',
      'HMR': 'Harmonizer',
      'AMP': 'Amplifier',
      'RSK': 'Risk',
    };
    
    // SIGNATURE — Quality/result/outcome
    this.signatures = {
      'VAR': 'Variant',        // Different, unique instance
      'CPL': 'Collapse',       // Convergence, fusion
      'OSC': 'Oscillate',      // Vibrating, pulsing
      'HLD': 'Hold',           // Stable, persistent
      'RSP': 'Respond',        // Reactive, adaptive
      'FLX': 'Flux',           // Flowing, transitional
      'NEX': 'Next',           // Sequential, progressing
      'PRM': 'Prime',          // Optimal, best
      'SYN': 'Sync',           // Synchronized, harmonic
      'BRK': 'Break',          // Fractured, disrupted
      'ASC': 'Ascent',         // Rising, elevating
      'DSC': 'Descent',        // Lowering, falling
      'CEN': 'Center',         // Centered, balanced
      'EDG': 'Edge',           // Boundary, threshold
      'ABS': 'Absolute',       // Total, complete
      'RCT': 'Receptor',
      'GTW': 'Gateway',
      'FNL': 'Funnel',
      'SNR': 'Sensor',
      'DTR': 'Detector',
      'CRY': 'Crystal',
      'LOB': 'Lobe',
      'BLM': 'Bloom',
      'SED': 'Seed',
      'HLX': 'Helix',
      'COR': 'Core',
      'MTX': 'Matrix',
      'VLT': 'Vault',
      'NDE': 'Node',
      'CMB': 'Chamber',
      'RNG': 'Ring'
    };
    
    // Archetype → Naming Code mapping (comprehensive)
    this.archetypeNamingMap = {
      // CORE layer (12 archetypes)
      'CORE-HARMONIC-RESONANT': 'RSN-WVE-SYN',
      'CORE-QUANTUM-ENTANGLED': 'QNT-KNT-CPL',
      'CORE-CHAOS-FRACTURED': 'FLX-DMD-BRK',
      'CORE-STELLAR-ASCENDED': 'ASC-CRW-PRM',
      'CORE-PRIME-PERFECT': 'PRM-LTR-PRM',
      'CORE-VOID-SILENT': 'UMB-VEC-HLD',
      'CORE-FLUX-ADAPTIVE': 'FLX-HEX-RSP',
      'CORE-NEXUS-CONVERGENT': 'NEX-TOR-CPL',
      'CORE-ECHO-RECURSIVE': 'SIG-SPN-NEX',
      'CORE-SURGE-DYNAMIC': 'VCE-WVE-FLX',
      'CORE-STATIC-ANCHORED': 'SIG-LTR-HLD',
      'CORE-WHISPER-SUBTLE': 'UMB-ORB-RSP',
      
      // OUTER layer (12 archetypes)
      'OUTER-RADIANT-EXPANSIVE': 'CHR-TOR-FLX',
      'OUTER-SPIRAL-TEMPORAL': 'FRM-SPN-NEX',
      'OUTER-VOID-ABSORBING': 'UMB-ORB-BRK',
      'OUTER-CROWN-SOVEREIGN': 'ASC-CRW-ASC',
      'OUTER-LATTICE-PERFECT': 'FRM-LTR-PRM',
      'OUTER-PULSE-RHYTHMIC': 'RSN-WVE-OSC',
      'OUTER-TIDE-FLOWING': 'FLX-WVE-FLX',
      'OUTER-DEPTH-PROFOUND': 'INF-DMD-CEN',
      'OUTER-SPARK-VIVID': 'CHR-ORB-ASC',
      'OUTER-SHADOW-VEILED': 'UMB-LTR-HLD',
      'OUTER-STORM-TURBULENT': 'VCE-WVE-BRK',
      'OUTER-LIGHT-ETERNAL': 'AET-CRW-SYN',
      
      // EXTREME layer (13 archetypes)
      'EXTREME-SINGULARITY-DENSE': 'SIG-VEC-CPL',
      'EXTREME-ENTROPY-CHAOTIC': 'INF-FLX-BRK',
      'EXTREME-INFINITY-BOUNDLESS': 'INF-INF-VAR',
      'EXTREME-NEXUS-INFINITE': 'NEX-PRL-SYN',
      'EXTREME-VOID-ABSOLUTE': 'UMB-VCE-ABS',
      'EXTREME-APOTHEOSIS-ASCENDED': 'ASC-CRW-PRM',
      'EXTREME-PARADOX-UNSTABLE': 'QNT-DMD-BRK',
      'EXTREME-ZENITH-PINNACLE': 'ASC-CRW-ASC',
      'EXTREME-VOID-CONSUMING': 'UMB-TOR-BRK',
      'EXTREME-HARMONIC-PERFECT': 'RSN-LTR-SYN',
      'EXTREME-CHAOS-PRIMORDIAL': 'FLX-SPN-BRK',
      'EXTREME-TRANSCENDENT-ETERNAL': 'AET-INF-ASC',
      'EXTREME-BALANCE-EQUILIBRIUM': 'FRM-HEX-CEN',
    };
    
    // Category → Default Naming (fallback for standard nodes)
    this.categoryNamingDefaults = {
      'input': 'SIG-VEC-RSP',         // Input: Signal, Vector, Respond
      'process': 'FRM-HEX-SYN',       // Process: Form, Hex, Sync
      'integration': 'ECO-LTR-CPL',   // Integration: Ecosystem, Lattice, Collapse
      'analytics': 'SIG-DMD-OSC',     // Analytics: Signal, Diamond, Oscillate
      'storage': 'NEX-TOR-HLD',       // Storage: Nexus, Torus, Hold
      'control': 'ASC-CRW-PRM',       // Control: Ascendant, Crown, Prime
      'quantum': 'QNT-SPN-VAR',       // Quantum: Quantum, Spiral, Variant
      'sigma': 'VCE-DMD-ASC',         // Sigma: Vortex, Diamond, Ascent
      'emotional': 'CHR-WVE-FLX',     // Emotional: Chromatic, Wave, Flux
      'mythic': 'LGD-CRW-PRM',        // Mythic: Legendary, Crown, Prime
      'prime': 'PRM-LTR-PRM',         // Prime: Prime, Lattice, Prime
      'error': 'FLX-DMD-BRK',         // Error: Flux, Diamond, Break
    };

    // Support maps from NodeVisualRegistry helper
    this.nodeVisualCategoryMap = {
      'input': 'QNT',
      'process': 'SIG',
      'integration': 'NEX',
      'analytics': 'AET',
      'storage': 'UMB',
      'control': 'ASC',
      'quantum': 'QNT',
      'sigma': 'SIG',
      'mythic': 'LGD',
      'prime': 'PRM',
      'error': 'FLX',
      'emotional': 'ECO'
    };

    this.nodeVisualArchetypeTagMap = {
      'stabilizer': 'HLD',
      'pressure': 'CPL',
      'harmonizer': 'SYN',
      'amplifier': 'PRM',
      'risky': 'BRK'
    };

    this.nodeVisualCategoryCodeMap = {
      'input': 'INP',
      'process': 'PRC',
      'integration': 'INT',
      'analytics': 'ANL',
      'storage': 'STR',
      'control': 'CTL',
      'quantum': 'QNT',
      'sigma': 'SGM',
      'mythic': 'MYT',
      'prime': 'PRM',
      'error': 'ERR',
      'emotional': 'EMO'
    };

    this.nodeVisualTagCodeMap = {
      'stabilizer': 'SBR',
      'pressure': 'PRS',
      'harmonizer': 'HMR',
      'amplifier': 'AMP',
      'risky': 'RSK'
    };

    this.nodeVisualFactoryPatternMap = {
      receptor: 'RCT', gateway: 'GTW', funnel: 'FNL', sensor: 'SNR', detector: 'DTR',
      torus: 'TOR', knot: 'KNT', crystal: 'CRY', lobe: 'LOB', bloom: 'BLM', seed: 'SED',
      helix: 'HLX', core: 'COR', matrix: 'MTX', vault: 'VLT', node: 'NDE', chamber: 'CMB',
      matrix: 'MTX', ring: 'RNG', orb: 'ORB', crown: 'CRW', lattice: 'LTR'
    };

    
    // Readable meanings for HUD display
    this.meaningDescriptions = {
      'RSN-WVE-SYN': 'Harmonically resonant signal in synchronized oscillation',
      'QNT-KNT-CPL': 'Quantum probability knot collapsing toward singular state',
      'FLX-DMD-BRK': 'Chaotic flux fracturing diamond symmetry',
      'ASC-CRW-PRM': 'Ascendant sovereign prime reaching apex',
      'PRM-LTR-PRM': 'Perfect prime lattice of fundamental essence',
      'UMB-VEC-HLD': 'Umbral vector field holding silent observation',
      'FLX-HEX-RSP': 'Adaptive flux responding through hexagonal pattern',
      'NEX-TOR-CPL': 'Convergent nexus collapsing into toroidal flow',
      'SIG-SPN-NEX': 'Singular echo spiraling toward next recursion',
      'VCE-WVE-FLX': 'Dynamic vortex surging in flowing waves',
      'SIG-LTR-HLD': 'Statically anchored signal held in lattice',
      'UMB-ORB-RSP': 'Subtle whisper responding in orbital shadow',
      'CHR-TOR-FLX': 'Radiant chromatic flux flowing through torus',
      'FRM-SPN-NEX': 'Temporal form spiraling to next iteration',
      'UMB-ORB-BRK': 'Absorbing void breaking orbital patterns',
      'ASC-CRW-ASC': 'Sovereign crown ascending to higher elevation',
      'FRM-LTR-PRM': 'Perfect latticed form of ideal geometry',
      'RSN-WVE-OSC': 'Rhythmic resonance oscillating in harmony',
      'FLX-WVE-FLX': 'Flowing tide continuously shifting state',
      'INF-DMD-CEN': 'Profound infinite depth centered in being',
      'CHR-ORB-ASC': 'Vivid chromatic spark ascending orbit',
      'UMB-LTR-HLD': 'Veiled shadow held within lattice structure',
      'VCE-WVE-BRK': 'Turbulent storm breaking wave patterns',
      'AET-CRW-SYN': 'Eternal light synchronizing through crown',
      'SIG-VEC-CPL': 'Singularity vector collapsing to density',
      'INF-FLX-BRK': 'Chaotic entropy breaking infinite flux',
      'INF-INF-VAR': 'Boundless infinity in infinite variation',
      'NEX-PRL-SYN': 'Synchronized nexus growing in pearlescent layers',
      'UMB-VCE-ABS': 'Absolute void consuming through vortex',
      'ASC-CRW-PRM': 'Apotheosis ascended to crowned prime',
      'QNT-DMD-BRK': 'Quantum paradox breaking diamond symmetry',
      'ASC-CRW-ASC': 'Zenith pinnacle reaching absolute ascent',
      'UMB-TOR-BRK': 'Consuming void breaking torus flow',
      'RSN-LTR-SYN': 'Perfect harmonic synchrony in lattice',
      'FLX-SPN-BRK': 'Primordial chaos breaking spiral form',
      'AET-INF-ASC': 'Transcendent eternity ascending infinitely',
      'FRM-HEX-CEN': 'Equilibrium balancing hexagonal form perfectly',
    };
    
    // Statistics
    this.stats = {
      nodesNamed: 0,
      archetypesEncountered: new Set(),
      fallbacksUsed: 0,
    };
    
    this.enabled = true;
  }
  
  /**
   * Get naming code for a node by its archetype
   * Supports: full archetype ID, category, or safe fallback
   */
  getNamingCodeForNode(archetypeId) {
    if (!this.enabled) return null;
    
    // First: Try exact archetype mapping
    if (this.archetypeNamingMap[archetypeId]) {
      this.stats.archetypesEncountered.add(archetypeId);
      return this.archetypeNamingMap[archetypeId];
    }
    
    // Second: Try category-based fallback
    if (this.categoryNamingDefaults[archetypeId]) {
      this.stats.fallbacksUsed++;
      return this.categoryNamingDefaults[archetypeId];
    }
    
    // Third: Generic fallback (should rarely be needed)
    this.stats.fallbacksUsed++;
    return this._generateRandomNamingCode();
  }
  
  /**
   * Get readable meaning for display on HUD
   */
  getReadableMeaning(namingCode) {
    if (!namingCode || !this.enabled) return null;
    
    return this.meaningDescriptions[namingCode] || 
           this._generateMeaningFromCode(namingCode);
  }
  
  /**
   * Generate meaning dynamically from morpheme components
   */
  _generateMeaningFromCode(code) {
    const parts = code.split('-');
    if (parts.length !== 3) return 'Unknown node property';
    
    const [originCode, patternCode, signatureCode] = parts;
    
    const origin = this.origins[originCode] || 'Unknown';
    const pattern = this.patterns[patternCode] || 'Unknown';
    const signature = this.signatures[signatureCode] || 'Unknown';
    
    return `${origin} ${pattern.toLowerCase()} in ${signature.toLowerCase()} state`;
  }
  
  /**
   * Generate random valid naming code (for procedural naming)
   */
  _generateRandomNamingCode() {
    const originKeys = Object.keys(this.origins);
    const patternKeys = Object.keys(this.patterns);
    const signatureKeys = Object.keys(this.signatures);
    
    const origin = originKeys[Math.floor(Math.random() * originKeys.length)];
    const pattern = patternKeys[Math.floor(Math.random() * patternKeys.length)];
    const signature = signatureKeys[Math.floor(Math.random() * signatureKeys.length)];
    
    return `${origin}-${pattern}-${signature}`;
  }

  _makeShortAbbreviation(value, length = 3) {
    if (!value || typeof value !== 'string') return 'UNK';
    const normalized = value.replace(/[^a-zA-Z0-9]+/g, ' ').trim().toUpperCase();
    if (!normalized) return 'UNK';

    const tokens = normalized.split(/\s+/);
    if (tokens.length === 1) {
      return tokens[0].slice(0, length).padEnd(length, 'X');
    }

    const combined = tokens.map(t => t.replace(/[^A-Z0-9]/g, '')).join('');
    return combined.slice(0, length).padEnd(length, 'X');
  }

  _extractFactoryPatternCode(factoryName) {
    if (!factoryName || typeof factoryName !== 'string') return 'NDE';
    const lower = factoryName.toLowerCase();

    for (const [token, code] of Object.entries(this.nodeVisualFactoryPatternMap)) {
      if (lower.includes(token)) return code;
    }

    const normalizedRaw = factoryName.replace(/^create/i, '').replace(/_/g, ' ');
    const match = normalizedRaw.match(/[A-Z]?[a-z]+|\d+/g);
    if (match && match.length > 0) {
      const candidate = match[match.length - 1].toUpperCase();
      return this._makeShortAbbreviation(candidate, 3);
    }

    return 'NDE';
  }

  getFactoryNameLabel(factoryName) {
    if (!factoryName || typeof factoryName !== 'string') return null;
    const sanitized = factoryName.replace(/^create/i, '').replace(/_/g, ' ').trim();
    const tokens = sanitized.match(/[A-Z]?[a-z]+|\d+/g) || [];
    if (tokens.length === 0) return null;

    // drop category prefix if present (like Input, Process, Emotional, etc.)
    const categoryTokens = new Set(Object.keys(this.nodeVisualCategoryCodeMap).map(k => k.toLowerCase()));
    if (tokens.length > 1 && categoryTokens.has(tokens[0].toLowerCase())) {
      tokens.shift();
    }

    // Keep last two tokens for expressive naming
    const displayTokens = tokens.slice(-2);
    return displayTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  getNodeLabelForData(nodeData = {}) {
    if (!nodeData) return null;
    return this.getFactoryNameLabel(nodeData.factoryName) || (nodeData.category ? `${nodeData.category.charAt(0).toUpperCase() + nodeData.category.slice(1)}` : null);
  }

  getNodeMeaningForData(nodeData = {}) {
    if (!nodeData) return null;

    const candidateCode = this.getNamingCodeForNode(nodeData.archetype || nodeData.category, nodeData);
    const candidateMean = this.getReadableMeaning(candidateCode);
    if (candidateMean && candidateMean !== 'Unknown node property') {
      return candidateMean;
    }

    return this.getNodeLabelForData(nodeData);
  }

  inferPatternFromFactory(factoryName) {
    if (!factoryName || typeof factoryName !== 'string') return 'ORB';
    const factor = factoryName.toLowerCase();
    const patterns = {
      knot: 'KNT', torus: 'TOR', orb: 'ORB', hex: 'HEX', lattice: 'LTR',
      spine: 'SPN', crown: 'CRW', fractal: 'FRM', wave: 'WVE', cluster: 'CRW',
      vault: 'ORB', node: 'ORB', core: 'CRW', ring: 'TOR', matrix: 'LTR'
    };
    for (const [key, code] of Object.entries(patterns)) {
      if (factor.includes(key)) return code;
    }
    return 'ORB';
  }

  inferCodeFromNodeData(nodeData = {}) {
    const category = (nodeData.category || '').toLowerCase();
    const archetypeTag = (nodeData.archetypeTag || '').toLowerCase();
    const factoryName = nodeData.factoryName || '';

    const categoryCode = this.nodeVisualCategoryCodeMap[category] || this._makeShortAbbreviation(category, 3);
    const tagCode = this.nodeVisualTagCodeMap[archetypeTag] || this._makeShortAbbreviation(archetypeTag, 3);
    const factoryCode = this._extractFactoryPatternCode(factoryName);

    return `${categoryCode}-${tagCode}-${factoryCode}`;
  }

  getNamingCodeForNode(archetypeId, nodeData = null) {
    if (!this.enabled) return null;

    if (archetypeId && this.archetypeNamingMap[archetypeId]) {
      this.stats.archetypesEncountered.add(archetypeId);
      return this.archetypeNamingMap[archetypeId];
    }

    if (archetypeId && this.categoryNamingDefaults[archetypeId]) {
      this.stats.fallbacksUsed++;
      return this.categoryNamingDefaults[archetypeId];
    }

    if (nodeData) {
      this.stats.fallbacksUsed++;
      return this.inferCodeFromNodeData(nodeData);
    }

    this.stats.fallbacksUsed++;
    return this._generateRandomNamingCode();
  }

  /**
   * Get all naming codes for a specific archetype group
   */
  getArchetypeGroupCodes(prefix) {
    // prefix: 'CORE', 'OUTER', 'EXTREME'
    const codes = {};
    
    for (const [archetypeId, namingCode] of Object.entries(this.archetypeNamingMap)) {
      if (archetypeId.startsWith(prefix)) {
        codes[archetypeId] = namingCode;
      }
    }
    
    return codes;
  }
  
  /**
   * Bulk assign naming codes to node list
   */
  assignNamesToNodes(nodes) {
    for (const node of nodes) {
      if (node.userData) {
        const archetypeId = node.userData.archetype || node.userData.category;
        node.userData.namingCode = this.getNamingCodeForNode(archetypeId);
        node.userData.namingMeaning = this.getReadableMeaning(node.userData.namingCode);
        this.stats.nodesNamed++;
      }
    }
  }
  
  /**
   * Generate meaningful name for a link (source → target)
   */
  getLinkNamingDescription(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) return null;
    
    const sourceName = sourceNode.userData?.namingCode || 'UNKNOWN';
    const targetName = targetNode.userData?.namingCode || 'UNKNOWN';
    
    const synergy = sourceNode.linkedSynergy || 0.5;
    const quality = synergy > 0.7 ? 'Harmonic' : 
                    synergy > 0.4 ? 'Neutral' : 
                    'Dissonant';
    
    return `${sourceName} → ${targetName} (${quality} signal)`;
  }
  
  /**
   * PUBLIC API - Generate random naming code for testing
   */
  generateRandomCode() {
    return this._generateRandomNamingCode();
  }
  
  /**
   * PUBLIC API - Get all archetypes with their codes
   */
  getAllArchetypeMap() {
    return { ...this.archetypeNamingMap };
  }
  
  /**
   * PUBLIC API - Get morpheme reference table
   */
  getMorphemeReference() {
    return {
      origins: { ...this.origins },
      patterns: { ...this.patterns },
      signatures: { ...this.signatures },
    };
  }
  
  /**
   * PUBLIC API - Statistics
   */
  getStats() {
    return {
      nodesNamed: this.stats.nodesNamed,
      uniqueArchetypes: this.stats.archetypesEncountered.size,
      fallbacksUsed: this.stats.fallbacksUsed,
    };
  }
  
  /**
   * PUBLIC API - Enable/Disable naming
   */
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  /**
   * PUBLIC API - Debug output
   */
  printFullReference() {
    console.log('%c=== ATOMA NAMING ENGINE 1.0 REFERENCE ===', 'color: #00ffff; font-weight: bold;');
    
    console.log('\n🔤 ORIGINS (Source/Essence):');
    for (const [code, name] of Object.entries(this.origins)) {
      console.log(`  ${code}: ${name}`);
    }
    
    console.log('\n⚙️  PATTERNS (Topology):');
    for (const [code, name] of Object.entries(this.patterns)) {
      console.log(`  ${code}: ${name}`);
    }
    
    console.log('\n✨ SIGNATURES (Quality/State):');
    for (const [code, name] of Object.entries(this.signatures)) {
      console.log(`  ${code}: ${name}`);
    }
    
    console.log('\n📋 ARCHETYPE MAPPINGS:');
    const grouped = {
      CORE: {},
      OUTER: {},
      EXTREME: {},
    };
    
    for (const [archetype, code] of Object.entries(this.archetypeNamingMap)) {
      if (archetype.startsWith('CORE-')) {
        grouped.CORE[archetype] = code;
      } else if (archetype.startsWith('OUTER-')) {
        grouped.OUTER[archetype] = code;
      } else if (archetype.startsWith('EXTREME-')) {
        grouped.EXTREME[archetype] = code;
      }
    }
    
    for (const [layer, map] of Object.entries(grouped)) {
      console.log(`\n${layer}:`);
      for (const [archetype, code] of Object.entries(map)) {
        console.log(`  ${archetype} → ${code}`);
      }
    }
  }
  
  /**
   * PUBLIC API - Print statistics
   */
  printStats() {
    console.log('%c=== ATOMA NAMING ENGINE STATS ===', 'color: #00ffff');
    console.log(`Nodes Named: ${this.stats.nodesNamed}`);
    console.log(`Unique Archetypes: ${this.stats.archetypesEncountered.size}`);
    console.log(`Fallbacks Used: ${this.stats.fallbacksUsed}`);
    console.log(`Enabled: ${this.enabled ? '🟢 YES' : '🔴 NO'}`);
  }
}

/**
 * Global singleton instance
 */
export const atomaNamingEngine = new AtomaNamingEngine();

/**
 * Console API Setup
 */
export function setupAtomaNamingConsoleAPI() {
  window.name = {
    show: (nodeId) => {
      if (window.game?.aiNodes?.nodes[nodeId]) {
        const node = window.game.aiNodes.nodes[nodeId];
        console.log(`Node ${nodeId}:`);
        console.log(`  Code: ${node.userData?.namingCode || 'UNKNOWN'}`);
        console.log(`  Meaning: ${node.userData?.namingMeaning || 'Unknown'}`);
        console.log(`  Archetype: ${node.userData?.archetype || 'Standard'}`);
      } else {
        console.warn(`Node ${nodeId} not found`);
      }
    },
    
    random: () => {
      const code = atomaNamingEngine.generateRandomCode();
      const meaning = atomaNamingEngine.getReadableMeaning(code);
      console.log(`Random Code: ${code}`);
      console.log(`Meaning: ${meaning}`);
      return code;
    },
    
    archetypes: () => {
      console.log('%c=== ARCHETYPE → NAMING CODE MAP ===', 'color: #00ffff; font-weight: bold;');
      const grouped = {
        CORE: {},
        OUTER: {},
        EXTREME: {},
      };
      
      const map = atomaNamingEngine.getAllArchetypeMap();
      for (const [archetype, code] of Object.entries(map)) {
        if (archetype.startsWith('CORE-')) {
          grouped.CORE[archetype] = code;
        } else if (archetype.startsWith('OUTER-')) {
          grouped.OUTER[archetype] = code;
        } else if (archetype.startsWith('EXTREME-')) {
          grouped.EXTREME[archetype] = code;
        }
      }
      
      for (const [layer, codes] of Object.entries(grouped)) {
        console.log(`\n${layer}:`);
        for (const [arch, code] of Object.entries(codes)) {
          console.log(`  ${arch.padEnd(35)} → ${code}`);
        }
      }
    },
    
    reference: () => {
      atomaNamingEngine.printFullReference();
    },
    
    stats: () => {
      atomaNamingEngine.printStats();
    },
    
    enable: () => {
      atomaNamingEngine.enable();
      console.log('🟢 ATOMA Naming Engine ENABLED');
    },
    
    disable: () => {
      atomaNamingEngine.disable();
      console.log('🔴 ATOMA Naming Engine DISABLED');
    },
  };
  
  console.log('%c✓ name API ready', 'color: #00ff00; font-weight: bold;');
  console.log('Commands: name.show(id), name.random(), name.archetypes(), name.reference(), name.stats(), name.enable(), name.disable()');
}
