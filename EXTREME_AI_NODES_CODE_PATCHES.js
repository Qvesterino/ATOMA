/**
 * EXTREME AI NODES — READY-TO-APPLY CODE PATCHES
 * 
 * Copy these patches into AINodes.js at the specified locations
 * Each patch is self-contained and marked with line numbers
 */

// ════════════════════════════════════════════════════════════════════════════
// PATCH 1: Constructor Addition (line ~10, after super/initialization)
// ════════════════════════════════════════════════════════════════════════════

/*
LOCATION: AINodes.js, constructor(), after line: this.nodeCategories = [...]

ADD THIS:

  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.nodes = [];
    this.connections = [];
    this.activationDistance = 8;
    this.connectionDistance = 15;
    
    // 6 node categories with 4 variants each
    this.nodeCategories = ['input', 'process', 'integration', 'analytics', 'storage', 'control'];
    
    // PATCH 1: Add EXTREME category constant
    this.extremeNodeCategory = 'extreme';
    
    // Special multi-output node types (10% chance of appearing)
    this.specialNodeTypes = ['sigma', 'quantum', 'emotional'];
    
    this.activeNodes = new Set();
    this.nodeCounter = 0; // For variant selection
  }
*/

// ════════════════════════════════════════════════════════════════════════════
// PATCH 2: Color Scheme Addition (line ~406, in getLayerColorScheme())
// ════════════════════════════════════════════════════════════════════════════

/*
LOCATION: AINodes.js, getLayerColorScheme() method

FIND THIS:
  const schemes = {
    'input': { primary: 0x00dddd, secondary: 0x0099ff },      // Cyan
    'process': { primary: 0x0066ff, secondary: 0x3399ff },    // Blue
    'integration': { primary: 0xaa00ff, secondary: 0xdd66ff },// Violet
    'analytics': { primary: 0xff00ff, secondary: 0xff66ff },  // Magenta
    'storage': { primary: 0x00ddaa, secondary: 0x00ffdd },    // Teal
    'control': { primary: 0xffaa00, secondary: 0xffdd33 },    // Amber
    'quantum': { primary: 0x4400ff, secondary: 0xaa66ff },    // Indigo
    'sigma': { primary: 0x00ff00, secondary: 0x66ff66 }       // Green
  };

CHANGE TO:
*/

const schemes = {
  'input': { primary: 0x00dddd, secondary: 0x0099ff },      // Cyan
  'process': { primary: 0x0066ff, secondary: 0x3399ff },    // Blue
  'integration': { primary: 0xaa00ff, secondary: 0xdd66ff },// Violet
  'analytics': { primary: 0xff00ff, secondary: 0xff66ff },  // Magenta
  'storage': { primary: 0x00ddaa, secondary: 0x00ffdd },    // Teal
  'control': { primary: 0xffaa00, secondary: 0xffdd33 },    // Amber
  'quantum': { primary: 0x4400ff, secondary: 0xaa66ff },    // Indigo
  'sigma': { primary: 0x00ff00, secondary: 0x66ff66 },      // Green
  'extreme': { primary: 0xff00ff, secondary: 0xff66ff }     // PATCH 2: Magenta for EXTREME
};

// ════════════════════════════════════════════════════════════════════════════
// PATCH 3: initializeNodeSpawning() Config Update (line ~848-870)
// ════════════════════════════════════════════════════════════════════════════

/*
LOCATION: AINodes.js, initializeNodeSpawning() method

FIND THIS:
  this.spawningConfig = {
    timeSpawnInterval: timeSpawnInterval,
    nextTimeSpawn: Date.now() + (timeSpawnInterval.min + Math.random() * (timeSpawnInterval.max - timeSpawnInterval.min)),
    lastLinkTime: 0,
    linkSpawnCooldown: 5000,
    lastNetworkCheck: Date.now(),
    networkCheckInterval: 10000,
    maxNodesTarget: 50,
    spawnThreshold: 0.7,
    rareMaterializeChance: 0.15
  };

CHANGE TO:
*/

this.spawningConfig = {
  timeSpawnInterval: timeSpawnInterval,
  nextTimeSpawn: Date.now() + (timeSpawnInterval.min + Math.random() * (timeSpawnInterval.max - timeSpawnInterval.min)),
  lastLinkTime: 0,
  linkSpawnCooldown: 5000,
  lastNetworkCheck: Date.now(),
  networkCheckInterval: 10000,
  maxNodesTarget: 50,
  spawnThreshold: 0.7,
  rareMaterializeChance: 0.15,
  
  // PATCH 3: EXTREME node spawning config
  extremeNodeChance: 0.06,      // 6% chance when spawn triggered
  extremeMaxSpawned: 5,          // Max 5 concurrent extreme nodes
  extremeNodeTypes: []           // Will be populated by registerExtremeNodeTypes()
};

// ════════════════════════════════════════════════════════════════════════════
// PATCH 4: spawnNode() Category Selection (line ~953-962)
// ════════════════════════════════════════════════════════════════════════════

/*
LOCATION: AINodes.js, spawnNode() method

FIND THIS:
  spawnNode(category = null, position = null) {
    // Default category or random
    if (!category) {
      const isRare = Math.random() < this.spawningConfig.rareMaterializeChance;
      if (isRare) {
        category = this.specialNodeTypes[Math.floor(Math.random() * this.specialNodeTypes.length)];
      } else {
        category = this.nodeCategories[Math.floor(Math.random() * this.nodeCategories.length)];
      }
    }

CHANGE THE CATEGORY SELECTION LOGIC TO:
*/

/*
spawnNode(category = null, position = null) {
  // Default category or random
  if (!category) {
    const roll = Math.random();
    
    // PATCH 4A: EXTREME node selection (6% chance)
    if (roll < this.spawningConfig.extremeNodeChance && 
        this.spawningConfig.extremeNodeTypes && 
        this.spawningConfig.extremeNodeTypes.length > 0) {
      // Check if we haven't exceeded max concurrent extreme nodes
      const extremeCount = this.nodes.filter(n => n.userData.category === this.extremeNodeCategory).length;
      if (extremeCount < this.spawningConfig.extremeMaxSpawned) {
        category = this.extremeNodeCategory;
      }
    }
    
    // If extreme not selected, fall back to standard selection
    if (!category) {
      const isRare = Math.random() < this.spawningConfig.rareMaterializeChance;
      if (isRare) {
        category = this.specialNodeTypes[Math.floor(Math.random() * this.specialNodeTypes.length)];
      } else {
        category = this.nodeCategories[Math.floor(Math.random() * this.nodeCategories.length)];
      }
    }
  }
  
  // Find safe position or use provided
  const spawnPos = position || this.findSafeSpawnLocation();
  
  // Create node
  // PATCH 4B: Mark EXTREME nodes as "special" for proper VFX treatment
  const isSpecial = this.specialNodeTypes.includes(category) || category === this.extremeNodeCategory;
  const newNode = this.createNode(category, spawnPos, this.nodes.length, isSpecial);
  this.nodes.push(newNode);
  
  // ... REST OF METHOD UNCHANGED - continue with materialize animation and linking

// ════════════════════════════════════════════════════════════════════════════
// PATCH 5: New Method - registerExtremeNodeTypes() (add after initializeNodeSpawning)
// ════════════════════════════════════════════════════════════════════════════

/*
LOCATION: AINodes.js, after initializeNodeSpawning() method (around line ~875)

ADD THIS NEW METHOD:

/**
 * PATCH 5: Register available extreme node archetypes
 * Call this to enable EXTREME node spawning
 * Safe: can be called anytime, fully compatible with shader pack
 */
// registerExtremeNodeTypes(extremeNodePack = null) {
//   if (!this.spawningConfig) {
//     this.initializeNodeSpawning();
//   }
//   
//   // If extremeNodePack provided, store reference for potential shader application
//   if (extremeNodePack) {
//     this.extremeNodePack = extremeNodePack;
//   }
//   
//   // Flag that EXTREME nodes are enabled
//   this.spawningConfig.extremeNodeTypes = ['extreme']; // Identifier for extreme category
//   
//   console.log('[AINodes] EXTREME node category registered and enabled for spawning');
// }
//*/

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION POINTS IN main.js
// ════════════════════════════════════════════════════════════════════════════

/*
IN main.js constructor/setup, after this.aiNodes is created:

// Initialize node spawning
this.aiNodes.initializeNodeSpawning();

// INTEGRATION 1: Enable EXTREME nodes (add this line)
this.aiNodes.registerExtremeNodeTypes(this.extremeAINodePack || null);

---

If using the shader pack, after attachExtremeShaderPackToGame(this):

// INTEGRATION 2: Ensure shader pack works with EXTREME nodes
if (this.extremeAIShaderPack && this.aiNodes) {
  this.aiNodes.registerExtremeNodeTypes();
}

---

When manually spawning nodes with special effects:

// INTEGRATION 3: Apply full effects to EXTREME node
if (this.extremeAINodePack) {
  this.extremeAINodePack.applyArchetype(newNode, this.scene);
  
  // Optional: register with shader pack
  if (this.extremeAIShaderPack) {
    this.extremeAIShaderPack.registerNode(newNode);
  }
  
  // Optional: register with evolution system
  if (this.extremeEvolution3) {
    this.extremeEvolution3.registerNode(newNode);
  }
}
*/

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY OF CHANGES
// ════════════════════════════════════════════════════════════════════════════

/*
PATCH 1: Add 1 line to constructor
  - this.extremeNodeCategory = 'extreme';

PATCH 2: Add 1 line to getLayerColorScheme()
  - 'extreme': { primary: 0xff00ff, secondary: 0xff66ff }

PATCH 3: Add 3 lines to spawningConfig
  - extremeNodeChance: 0.06
  - extremeMaxSpawned: 5
  - extremeNodeTypes: []

PATCH 4: Modify spawnNode() category selection (~12 lines)
  - Add EXTREME node chance roll
  - Check max concurrent limit
  - Mark EXTREME as special

PATCH 5: Add registerExtremeNodeTypes() method
  - New method (~15 lines)
  - Enables EXTREME spawning

TOTAL: ~5 files modified, ~30 lines added, ~10 lines modified

NO DELETIONS NEEDED - All patches are additive!
*/

// ════════════════════════════════════════════════════════════════════════════
// TESTING COMMANDS
// ════════════════════════════════════════════════════════════════════════════

/*
After integration, test with these browser console commands:

// Check if EXTREME is registered
game.aiNodes.spawningConfig.extremeNodeTypes

// Manual spawn EXTREME node
if (window.__ALLOW_EXTERNAL_SPAWN__ !== true) {
  console.warn('[SpawnAuthority] External spawn blocked');
} else {
  spawnAuthority.spawn(game.aiNodes, 'extreme')
}

// Check node count by category
const stats = game.aiNodes.getActiveNodeInfo();
console.log(stats)

// Check all nodes
game.aiNodes.nodes.forEach(n => console.log(n.userData.category, n.userData.index))

// Enable shader pack on all nodes
game.aiNodes.nodes.forEach(n => {
  if (n.userData.category === 'extreme' && game.extremeAIShaderPack) {
    game.extremeAIShaderPack.registerNode(n);
  }
})
*/
