// ATOMA Configuration - Node-Space Chamber

export const CONFIG = {
  // Player settings
  player: {
    moveSpeed: 12,  // 200% of original 6 (6 * 2 = 12)
    jumpForce: 10,
    gravity: 20,
    eyeHeight: 1.6
  },
  
  // Chamber colors - minimal neon-tech palette
  colors: {
    background: 0x0a0a0a,   // Charcoal black
    primary: 0x00ccdd,      // Soft cyan
    secondary: 0x6633cc,    // Violet
    accent: 0x00aa99,       // Teal
    matte: 0x1a1a1a,        // Dark matte surface
    fog: 0x0f0f12,          // Very dark fog
    singularity: 0x00ddff   // Center glow
  },
  
  // Fog settings - subtle volumetric
  fog: {
    near: 30,
    far: 80
  },
  
  // Lighting - calm and analytical
  lighting: {
    ambientIntensity: 0.15,
    coreIntensity: 0.4
  },
  
  // Chamber dimensions
  chamber: {
    radius: 40,
    height: 30,
    coreHeight: 8
  },
  
  // Singularity settings
  singularity: {
    radius: 1.2,
    glowIntensity: 0.3,
    rippleSpeed: 0.5,
    rippleCount: 3
  },
  
  // Node settings - fewer, more purposeful
  nodes: {
    count: 12,
    minDistance: 8,
    maxDistance: 25,
    minHeight: 3,
    maxHeight: 12
  },
  
  // Particle drift - very low density
  particles: {
    count: 120,
    size: 0.08,
    speed: 0.15
  },
  
  // Platform settings
  platforms: {
    count: 6,
    width: 4,
    depth: 0.15,
    edgeThickness: 0.05
  },

  // ============================================================================
  // SESSION B.3.A: TRANSMISSION PASS KILL SWITCH
  // ============================================================================
  rendering: {
    DISABLE_TRANSMISSION_PASS: true // When true, zeroes MeshPhysicalMaterial.transmission at startup
  },

  // ============================================================================
  // SESSION 99: STABILIZATION FEATURE FLAGS
  // ============================================================================
  
  // FEATURE: Node Aura Visuals (Session 99 Stabilization)
  // When false: All node-related aura systems (halos, fields) are disabled
  // This removes large translucent discs that can obscure node identity
  // Benefit: Ensures node cores and shells are always fully readable
  // Impact: Visual only, gameplay unaffected, reversible
  features: {
    ENABLE_NODE_AURAS: true,  // DISABLED for visual stabilization (Session 99)
    
    // FEATURE: Node Spawn Validation (Session 99 Task 2)
    // When true: Only nodes defined in enhancedNodeModel can spawn
    // When false: Spawn validation is permissive (legacy behavior)
    ENFORCE_NODE_MODEL_SOURCE: true  // ENABLED for source-of-truth enforcement
  },
  
  debug: {
    // ============================================================================
    // PHASE D.4: WAVE INTERFERENCE ENGINE DEBUG TRIGGER
    // ============================================================================
    // When true: WaveInterferenceEngine receives NODE_SPAWN events
    // When false: Engine is 100% dormant (zero impact)
    // This is a pilot trigger for testing wave interference system
    DEBUG_WAVE_ENGINE: false
  },
  
  // ============================================================================
  // CRITICAL STABILIZATION: VISUAL AUTHORITY LOCKS (node-only)
  // ============================================================================
  
  visuals: {
    // NODE VISUAL AUTHORITY LOCK
    // - Prevents linking, events, personality, metrics, automation from modifying node appearance
    // - Blocks: opacity, scale, color, emissive, visibility mutations
    // - Effect: Stable node appearance before/after linking
    LOCK_NODE_VISUALS: false,
    
    // NODE INTERACTION AUTHORITY
    // - Raycasting targets invisible interaction meshes ONLY
    // - Visual meshes never participate in raycasts
    // - Effect: Reliable clicking on all nodes, all categories
    LOCK_INTERACTION: false, // CHANGED FROM true TO FALSE - UNBLOCK INTERACTION
    
    // PARTICLE SANITY MODE
    PARTICLE_BOUNDS_CHECK: false,
    
    // VISUAL FREEZE MODE COMPATIBILITY
    // - Freeze mode ONLY blocks updates, NEVER mutates visuals
    // - No hiding meshes, no opacity changes, no visibility changes
    // - Effect: Safe freeze/unfreeze without visual artifacts
    FREEZE_MODE_SAFE: false
  },
};
