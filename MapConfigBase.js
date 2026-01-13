/**
 * ============================================================================
 * MAP CONFIG BASE (Session 112+)
 * ============================================================================
 * Base configuration structure for all maps.
 * 
 * Every map must define:
 * - mapId: Unique identifier
 * - theme: Visual theme/category
 * - referencePlane: Type of reference plane to create
 * 
 * Reference planes are created at runtime, not hardcoded per map.
 */

export const MapConfigBase = {
  /**
   * Dream Desert configuration
   * Theme: Surreal, peaceful, dream-like
   * Reference plane: Cognitive horizon with gentle waves
   */
  DreamDesert: {
    mapId: 'dream_desert',
    theme: 'dream',
    referencePlane: 'dream_plane',
    description: 'AI Subconscious Environment - Surreal, peaceful, geometric desertscape'
  },
  
  /**
   * Quantum Island configuration
   * Theme: Probabilistic, uncertain, quantum-like
   * Reference plane: Probabilistic surface with faster waves
   */
  QuantumIsland: {
    mapId: 'quantum_island',
    theme: 'quantum',
    referencePlane: 'quantum_plane',
    description: 'Quantum probability space - Uncertain, superposition-like landscape'
  },
  
  /**
   * Fractal Valley configuration
   * Theme: Recursive, mathematical, self-similar
   * Reference plane: Logic plane with strong grid
   */
  FractalValley: {
    mapId: 'fractal_valley',
    theme: 'fractal',
    referencePlane: 'logic_plane',
    description: 'Recursive mathematical space - Self-similar, fractal geometry'
  },
  
  /**
   * Memory Lane configuration
   * Theme: Data-driven, procedural, memory-like
   * Reference plane: Logic plane for structured recall
   */
  MemoryLane: {
    mapId: 'memory_lane',
    theme: 'memory',
    referencePlane: 'logic_plane',
    description: 'Memory storage corridor - Data architecture, procedural landscape'
  },
  
  /**
   * Sigma Rift Chamber configuration
   * Theme: Anomalous, glitchy, reality-warping
   * Reference plane: Void plane (minimal, almost invisible)
   */
  SigmaRiftChamber: {
    mapId: 'sigma_rift_chamber',
    theme: 'anomaly',
    referencePlane: 'void_plane',
    description: 'Reality-warping anomaly space - Glitchy, unstable, dreamlike'
  },
  
  /**
   * Default Chamber configuration
   * Theme: Neutral, foundational
   * Reference plane: Void plane (safe fallback)
   */
  DefaultChamber: {
    mapId: 'default_chamber',
    theme: 'neutral',
    referencePlane: 'void_plane',
    description: 'Foundation chamber - Neutral space for node interaction'
  }
};

/**
 * Get map configuration by map ID or name
 * @param {string} mapIdOrName - Map identifier or class name
 * @returns {Object} Map configuration
 */
export function getMapConfig(mapIdOrName) {
  // Try direct key lookup (e.g., "DreamDesert")
  if (MapConfigBase[mapIdOrName]) {
    return MapConfigBase[mapIdOrName];
  }
  
  // Try matching by mapId (e.g., "dream_desert")
  for (const [key, config] of Object.entries(MapConfigBase)) {
    if (config.mapId === mapIdOrName) {
      return config;
    }
  }
  
  // Fallback to default
  console.warn(
    `[MapConfigBase] Unknown map: "${mapIdOrName}". Using default chamber config.`
  );
  return MapConfigBase.DefaultChamber;
}

/**
 * Get all map configurations
 */
export function getAllMapConfigs() {
  return Object.entries(MapConfigBase).map(([key, config]) => ({
    className: key,
    ...config
  }));
}
