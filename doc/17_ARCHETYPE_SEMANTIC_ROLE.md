ARCHETYPE-SEMANTIC-ROLE AUDIT REPORT
PHASE: READ ONLY ANALYSIS
STEP 1 — ARCHETYPE USAGE SEARCH
Search Term	Results Count	Key Files
node.archetype	1	_VisualLockDiagnostics.js (diagnostic only)
archetypeKey	47	AINodes.js, UniqueSpawnRegistry.js, SafeMetricsDNAIntegration1_0.js, _SafeNodeArchetypesPack.js, _RareNodeSpawner.js
archetypeType	14	_SafeNodeArchetypesPack.js, NodePersonality2_0.js, main.js
getArchetype	61	Multiple visual/integration systems, AINodes.js, ArchetypeVisualDifferentiationSystem_v1.js
applyArchetype	27	ArchetypeVisualIntegrationPatch_v1.js, _ExtremeAINodePack.js, _SafeNodeArchetypesPack.js
STEP 2 — GAMEPLAY DEPENDENCIES
✅ METRICS IMPACT (HIGH)
File: SafeMetricsDNAIntegration1_0.js

Archetype determines initial node metrics:
synergy (0-1)
harmony (0-1)
stability (0-1)
corruption (0-1)
loadPressure (0-1)
USAGE TYPE: GAMEPLAY
Stored as immutable snapshot at spawn-time: node.userData.archetypeMetrics
✅ LINK SYNERGY IMPACT (HIGH)
File: ArchetypeGameplayEffects_v1.js

computeLinkSynergy() calculates link behavior based on archetypes:
synergyScore (0-1)
throughputMultiplier
stabilityImpact
chaosChance
Tag-based compatibility system (harmony, chaos, prime, quantum, sigma)
USAGE TYPE: GAMEPLAY
✅ SPAWN LOGIC IMPACT (HIGH)
File: AINodes.js

UNIQUE SPAWN ENFORCEMENT: UniqueSpawnRegistry prevents duplicate archetype spawns
Archetypes like MYTHIC, PRIME, ERROR, EXTREME are single-instance
Duplicate spawn attempts trigger upgrade pulse on existing node instead
USAGE TYPE: GAMEPLAY
✅ EVOLUTION SYSTEM (HIGH)
File: ArchetypeGameplayEffects_v1.js

Dynamic archetype evolution based on gameplay state:
High chaos exposure → evolve to chaos archetype
High harmony + stability → evolve to prime/mythic
Corruption cleansing → revert to stable archetype
Triggers via evolveNodeToArchetype() → switchArchetype()
USAGE TYPE: GAMEPLAY
❌ PROPAGATION LOGIC (NONE FOUND)
No direct archetype-based propagation logic detected.

⚠️ LINK BEHAVIOR (VISUAL ONLY)
Files: ArchetypeNeuralLinkVis_v1.js, ArchetypeColorPaletteSystem_v1.js

Archetype affects link visual colors and rendering
No gameplay logic impact
USAGE TYPE: VISUAL
❌ PRIORITY/SCORING (NONE FOUND)
No archetype-based priority or scoring systems detected.

❌ CAPACITY/LIMITS (NONE FOUND)
No archetype-based capacity or limit constraints detected.

STEP 3 — ARCHETYPE → CATEGORY MAPPING
File: AINodes.js (lines ~280-340)

Complete Mapping Table (49 archetypes):

this.extremeArchetypes = {
  // CORE layer (12 archetypes)
  'CORE-HARMONIC-RESONANT': 'process',
  'CORE-QUANTUM-ENTANGLED': 'quantum',
  'CORE-CHAOS-FRACTURED': 'error',
  'CORE-STELLAR-ASCENDED': 'mythic',
  'CORE-PRIME-PERFECT': 'prime',
  'CORE-VOID-SILENT': 'control',
  'CORE-FLUX-ADAPTIVE': 'integration',
  'CORE-NEXUS-CONVERGENT': 'storage',
  'CORE-ECHO-RECURSIVE': 'analytics',
  'CORE-SURGE-DYNAMIC': 'input',
  'CORE-STATIC-ANCHORED': 'storage',
  'CORE-WHISPER-SUBTLE': 'integration',
  
  // OUTER layer (12 archetypes)
  'OUTER-RADIANT-EXPANSIVE': 'input',
  'OUTER-SPIRAL-TEMPORAL': 'analytics',
  'OUTER-VOID-ABSORBING': 'error',
  'OUTER-CROWN-SOVEREIGN': 'mythic',
  'OUTER-LATTICE-PERFECT': 'prime',
  'OUTER-PULSE-RHYTHMIC': 'control',
  'OUTER-TIDE-FLOWING': 'integration',
  'OUTER-DEPTH-PROFOUND': 'storage',
  'OUTER-SPARK-VIVID': 'process',
  'OUTER-SHADOW-VEILED': 'analytics',
  'OUTER-STORM-TURBULENT': 'error',
  'OUTER-LIGHT-ETERNAL': 'mythic',
  
  // EXTREME layer (13 archetypes)
  'EXTREME-SINGULARITY-DENSE': 'prime',
  'EXTREME-ENTROPY-CHAOTIC': 'error',
  'EXTREME-INFINITY-BOUNDLESS': 'mythic',
  'EXTREME-NEXUS-INFINITE': 'process',
  'EXTREME-VOID-ABSOLUTE': 'error',
  'EXTREME-APOTHEOSIS-ASCENDED': 'mythic',
  'EXTREME-PARADOX-UNSTABLE': 'error',
  'EXTREME-ZENITH-PINNACLE': 'prime',
  'EXTREME-VOID-CONSUMING': 'error',
  'EXTREME-HARMONIC-PERFECT': 'prime',
  'EXTREME-CHAOS-PRIMORDIAL': 'error',
  'EXTREME-TRANSCENDENT-ETERNAL': 'mythic',
  'EXTREME-BALANCE-EQUILIBRIUM': 'integration',
  
  // SPECIAL layer (12 archetypes)
  'SPECIAL-SIGMA-DIMENSIONAL': 'sigma',
  'SPECIAL-QUANTUM-SUPERPOSED': 'quantum',
  'SPECIAL-EMOTIONAL-RESONANT': 'emotional',
  'SPECIAL-MYTHIC-CEREMONIAL': 'mythic',
  'SPECIAL-PRIME-CRYSTALLINE': 'prime',
  'SPECIAL-ERROR-ANOMALY': 'error',
  'SPECIAL-SIGMA-ANOMALY': 'sigma',
  'SPECIAL-QUANTUM-ENTANGLED': 'quantum',
  'SPECIAL-EMOTIONAL-EMPATHIC': 'emotional',
  'SPECIAL-UNITY-CONVERGENT': 'integration',
  'SPECIAL-APEX-SUPREME': 'control',
  'SPECIAL-GENESIS-PRIMORDIAL': 'input'
};
STEP 4 — RUNTIME MUTABILITY
✅ RUNTIME MUTABLE (HIGH RISK)
Mechanisms:

switchArchetype() - Available on AINodes instance
evolveNodeToArchetype() - Gameplay-triggered evolution
forceArchetypeEvolution() - Debug API
Evolution Triggers (from ArchetypeGameplayEffects_v1.js):

High chaos exposure + low stability → EXTREME-ENTROPY-CHAOTIC
High harmony exposure + high stability → EXTREME-PRIME-ASCENDED
Long-term corruption with prime/harmony neighbors → CORE-PRIME-PERFECT (cleansing)
High quantum weirdness + low stability → SPECIAL-SIGMA-QUANTUM
Not Immutable After Spawn

FINAL SUMMARY
ARCHETYPE ROLE:
MIXED (HIGH RISK)
Classification Breakdown:

GAMEPLAY: ✅ Metrics, Link Synergy, Spawn Authority, Evolution System
VISUAL: ✅ Shaders, Colors, Auras, Neural Links
MIXED: ⚠️ Same property used for both gameplay AND visuals
GAMEPLAY SYSTEMS USING ARCHETYPE
Metrics DNA System (SafeMetricsDNAIntegration1_0.js)

Determines initial node statistics
Immutable snapshot stored at spawn
Archetype Gameplay Effects (ArchetypeGameplayEffects_v1.js)

Computes link synergy between nodes
Manages chaos/corruption propagation
Triggers archetype evolution based on gameplay state
Spawn Authority (AINodes.js + UniqueSpawnRegistry.js)

Enforces single-instance for unique archetypes
Prevents duplicate spawns of MYTHIC, PRIME, ERROR, EXTREME
Evolution System (ArchetypeGameplayEffects_v1.js)

Dynamic archetype switching based on gameplay conditions
Influences network stability and corruption dynamics
RUNTIME MUTATION PRESENCE
Status: ✅ RUNTIME MUTABLE

Mechanisms:

aiNodes.switchArchetype(node, newArchetype)
evolveNodeToArchetype(node, targetArchetype)
Automatic evolution triggered by gameplay events
Risk Assessment: HIGH

Archetype mutations affect both visuals AND gameplay metrics
Evolution can change node behavior mid-session
Single-instance enforcement can be bypassed during evolution
RECOMMENDATIONS
Separate Visual vs Gameplay Identity: Consider splitting archetype into:

archetypeVisual (for shaders, colors, auras)
archetypeGameplay (for metrics, synergy, evolution)
Evolution Guards: Add confirmation or delay for critical archetype changes

Single-Instance Consistency: Ensure evolution updates UniqueSpawnRegistry

Audit Trail: Track archetype mutations for debugging

END OF AUDIT