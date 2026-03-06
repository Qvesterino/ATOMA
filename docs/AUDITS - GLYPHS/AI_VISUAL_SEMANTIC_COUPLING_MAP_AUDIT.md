# ATOMA – AI–VISUAL SEMANTIC COUPLING MAP AUDIT
**PHASE:** READ-ONLY  
**MODE:** NO FILE MODIFICATIONS  
**DATE:** 2026-02-28  
**SCOPE:** Complete AI-Visual coupling authority mapping

---

## EXECUTIVE SUMMARY

ATOMA exhibits **HIGHLY COUPLED** AI-visual systems with **mixed authority patterns**. The architecture shows:

- **STATE-BASED SEMANTIC LAYER**: Well-defined semantic state structures (archetypeEvolution, mythicEvolution)
- **BOTH STATE-BASED AND DIRECT MUTATION**: Some systems write state only, others mutate materials directly
- **FRAGMENTED VISUAL AUTHORITY**: Multiple visual systems read and mutate the same properties
- **EVENT + FRAME COUPLING**: Rituals use events, glyph systems use per-frame mutations
- **LOW CIRCULAR RISK**: Semantic systems are generally unidirectional (metrics → semantic → visual)
- **ARCHETYPE SYSTEM AS SEMANTIC HUB**: ArchetypeAscensionCurves_v1 is central to visual coupling

**CLASSIFICATION:** **STATE-BASED BUT FRAGMENTED**

---

## STEP 1 — AI SYSTEM INVENTORY

| AI System | File | Primary Responsibility | Mutates Visuals Directly? |
|-----------|------|------------------------|---------------------------|
| ArchetypeAscensionCurves_v1 | ArchetypeAscensionCurves_v1.js | Personality-based ascension curves, archetype evolution | NO (writes userData.archetypeEvolution only) |
| MythicEvolutionFX_v1 | MythicEvolutionFX_v1.js | Quality-based evolution tiers | NO (writes userData.mythicEvolution only) |
| SemanticGlyphAI | _SemanticGlyphAI.js | Semantic glyph behavior, focus states | YES (mutates material.opacity, semanticRotSpeed) |
| ProceduralMeaningEngine | _ProceduralMeaningEngine.js | Procedural glyph generation | YES (mutates material.opacity) |
| MythicRitualController | _MythicRitualController.js | Rare ritual event system | YES (mutates material.emissiveIntensity, world visuals) |
| RecursiveGlyphSignalSystem | _RecursiveGlyphSignalSystem.js | Recursive glyph messaging | YES (mutates material.opacity) |
| LinkedGlyphMessaging | _LinkedGlyphMessaging3_0.js | Inter-glyph message packets | YES (mutates material.opacity) |
| ArchetypeColorPaletteSystem | ArchetypeColorPaletteSystem_v1.js | Archetype-driven color mapping | NO (reads archetypeEvolution, injects shader uniforms) |
| ArchetypeAuraEnhancement | ArchetypeAuraEnhancement_v1.js | Archetype-driven aura modifications | NO (reads archetypeEvolution) |
| ArchetypeShaderModes | ArchetypeShaderModes_v1.js | Archetype shader mode selection | NO (reads archetypeEvolution) |
| LinkPersonalityStateMachine | LinkPersonalityStateMachine_v1.js | Link personality evolution | NO (reads archetypeEvolution, writes link.userData) |
| NetworkRituals | NetworkRituals_v1.js | Network-wide ritual coordination | YES (mutates visual state) |

---

## STEP 2 — COUPLING TYPE MAP

| AI System | Writes To | Visual Dependency | Direct or Indirect? | Data Structure |
|-----------|-----------|-------------------|---------------------|----------------|
| ArchetypeAscensionCurves_v1 | node.userData.archetypeEvolution | None (pure data) | Indirect | archetypeId, ascensionModified, ascensionMultiplier, tierBoost |
| MythicEvolutionFX_v1 | node.userData.mythicEvolution | None (pure data) | Indirect | ascensionRaw, ascensionSmoothed, tier, ascensionModified |
| SemanticGlyphAI | core.material.opacity, core.userData.semanticRotSpeed | THREE.js materials directly | Direct | Material mutations + userData fields |
| ProceduralMeaningEngine | child.material.opacity | THREE.js materials directly | Direct | Material mutations |
| MythicRitualController | node.material.emissiveIntensity, scene.background, scene.fog | THREE.js materials directly | Direct | Material mutations, scene state |
| RecursiveGlyphSignalSystem | mesh.material.opacity | THREE.js materials directly | Direct | Material mutations |
| LinkedGlyphMessaging | packet.mesh.material.opacity | THREE.js materials directly | Direct | Material mutations |
| ArchetypeColorPaletteSystem | Shader uniforms (onBeforeCompile) | Reads archetypeEvolution, writes uniforms | Indirect (via shaders) | Shader uniform injection |
| ArchetypeAuraEnhancement | Aura enhancement state | Reads archetypeEvolution | Indirect | Enhancement state objects |
| ArchetypeShaderModes | Shader mode selection | Reads archetypeEvolution | Indirect | Shader mode state |
| LinkPersonalityStateMachine | link.userData | Reads archetypeEvolution | Indirect | Link userData |
| NetworkRituals | Visual state objects | Ritual state | Direct + Indirect | Mixed |

---

## STEP 3 — VISUAL READER MAP

| Visual System | Reads Semantic State? | Reads Archetype? | Reads AI Intent? | Per-frame? | File |
|---------------|----------------------|------------------|-----------------|------------|------|
| ArchetypeVisualProfiles | No | YES | No | No | ArchetypeVisualProfiles_v1.js |
| ArchetypeVisualDifferentiationSystem | No | YES | No | No | ArchetypeVisualDifferentiationSystem_v1.js |
| ArchetypeVisualTransitionEngine | No | YES | No | No | ArchetypeVisualTransitionEngine_v2.js |
| ArchetypeNeuralLinkVis | No | YES | No | No | ArchetypeNeuralLinkVis_v1.js |
| NodeShaderActivation | No | YES | No | No | NodeShaderActivation_v1.js |
| ResonanceFeedback | YES | YES | No | No | ResonanceFeedback_v1.js |
| RitualVisualOrchestrator | No | No | YES | YES | RitualVisualOrchestrator.js |
| GlyphLayer4_MultiFusion | YES | No | No | YES | _GlyphLayer4_MultiFusion.js |
| SemanticGlyphAI | YES | No | No | YES | _SemanticGlyphAI.js |
| RecursiveGlyphSignalSystem | YES | No | No | YES | _RecursiveGlyphSignalSystem.js |
| LinkedGlyphMessaging | YES | No | No | YES | _LinkedGlyphMessaging3_0.js |
| AuraModulationSystem | YES | No | No | YES | AuraModulationSystem.js |
| NodeVisualStateBinder | YES | No | No | YES | NodeVisualStateBinder.js |
| VisualHierarchyCorrectionSystem | YES | No | No | YES | _VisualHierarchyCorrectionSystem_v1.js |

---

## STEP 4 — MUTATION AUTHORITY MAP

### MATERIAL PROPERTY AUTHORITY

| Property | Written By | File | Overwrites? | Conflict Risk? | Notes |
|----------|------------|------|-------------|----------------|-------|
| **material.opacity** | SemanticGlyphAI | _SemanticGlyphAI.js | YES | MEDIUM | Per-frame lerp |
| **material.opacity** | ProceduralMeaningEngine | _ProceduralMeaningEngine.js | YES | MEDIUM | Per-frame lerp |
| **material.opacity** | RecursiveGlyphSignalSystem | _RecursiveGlyphSignalSystem.js | YES | MEDIUM | Per-frame lerp |
| **material.opacity** | LinkedGlyphMessaging | _LinkedGlyphMessaging3_0.js | YES | MEDIUM | Per-frame fade |
| **material.opacity** | MythicRitualController | _MythicRitualController.js | YES | MEDIUM | Ritual phase-based lerp |
| **material.emissiveIntensity** | MythicRitualController | _MythicRitualController.js | YES | LOW | Ritual boost only |
| **material.color** | ArchetypeColorPaletteSystem | ArchetypeColorPaletteSystem_v1.js | NO | NONE | Shader uniform only |
| **scene.background** | MythicRitualController | _MythicRitualController.js | YES | LOW | Ritual-specific, restored on end |
| **scene.fog.color** | MythicRitualController | _MythicRitualController.js | YES | LOW | Ritual-specific, restored on end |

### USERDATA STATE AUTHORITY

| Property | Written By | File | Read By Multiple Systems? |
|----------|------------|------|---------------------------|
| **node.userData.archetypeEvolution** | ArchetypeAscensionCurves_v1 | ArchetypeAscensionCurves_v1.js | YES (15+ readers) |
| **node.userData.mythicEvolution** | MythicEvolutionFX_v1 | MythicEvolutionFX_v1.js | YES (10+ readers) |
| **node.userData.semanticRotSpeed** | SemanticGlyphAI | _SemanticGlyphAI.js | NO |
| **link.userData.mythicEvolution** | LinkPersonalityStateMachine | LinkPersonalityStateMachine_v1.js | YES |
| **link.userData.personalityState** | NetworkRituals | NetworkRituals_v1.js | YES |

### CONFLICT ANALYSIS

**HIGH CONFLICT RISK:**
- `material.opacity` has 5+ direct writers (SemanticGlyphAI, ProceduralMeaningEngine, RecursiveGlyphSignalSystem, LinkedGlyphMessaging, MythicRitualController)
- All use per-frame lerp operations
- No central authority or coordination

**LOW CONFLICT RISK:**
- `archetypeEvolution` has single writer (ArchetypeAscensionCurves_v1)
- `mythicEvolution` has single writer (MythicEvolutionFX_v1)
- Ritual visual mutations are temporary and self-contained

---

## STEP 5 — EVENT VS FRAME COUPLING MAP

| Coupling Type | File | Frequency | Deterministic? | Semantic State Used |
|---------------|------|-----------|----------------|---------------------|
| **FRAME-BASED** | _SemanticGlyphAI.js | 60fps | YES | semanticRotSpeed, focus state |
| **FRAME-BASED** | _ProceduralMeaningEngine.js | 60fps | YES | intensity, flicker |
| **FRAME-BASED** | _RecursiveGlyphSignalSystem.js | 60fps | YES | signal state |
| **FRAME-BASED** | _LinkedGlyphMessaging3_0.js | 60fps | YES | packet progress |
| **FRAME-BASED** | ArchetypeAscensionCurves_v1.js | 60fps | YES | archetypeEvolution |
| **FRAME-BASED** | ArchetypeColorPaletteSystem_v1.js | 60fps | YES | archetypeEvolution |
| **EVENT-BASED** | _MythicRitualController.js | Rare (45s cooldown) | YES | worldMood, ritual type |
| **EVENT-BASED** | NetworkRituals_v1.js | Rare | YES | network state |
| **STATE-BASED** | ArchetypeVisualProfiles_v1.js | On archetype change | YES | archetypeEvolution |
| **STATE-BASED** | ArchetypeShaderModes_v1.js | On archetype change | YES | archetypeEvolution |

### TIMING CHARACTERISTICS

**CONTINUOUS COUPLING (per-frame):**
- All glyph semantic systems (SemanticGlyphAI, ProceduralMeaningEngine, Recursive systems)
- Archetype evolution systems
- Aura modulation systems
- Visual state binders

**DISCRETE COUPLING (event/state-driven):**
- Ritual systems (rare, dramatic)
- Archetype assignment (on spawn)
- Shader mode changes (on archetype change)

---

## STEP 6 — CIRCULAR DEPENDENCY MAP

### DETECTED CYCLES

| Cycle Detected | Systems Involved | Risk Level | Description |
|----------------|------------------|------------|-------------|
| **NONE DETECTED** | N/A | N/A | AI systems are unidirectional |

### FLOW ANALYSIS

**UNIDIRECTIONAL FLOW:**
```
RAW METRICS
    ↓
AI INTERPRETATION (ArchetypeAscensionCurves_v1, MythicEvolutionFX_v1)
    ↓
SEMANTIC STATE (userData.archetypeEvolution, userData.mythicEvolution)
    ↓
VISUAL READERS (ArchetypeColorPaletteSystem, Aura systems, etc.)
    ↓
SHADER UNIFORMS / MATERIAL MUTATIONS
    ↓
SCREEN OUTPUT
```

**NO FEEDBACK LOOPS:**
- AI systems do not read visual state
- Visual systems do not write back to semantic state
- Metrics are not derived from visual state

**EXCEPTION - POTENTIAL INDIRECT CYCLE:**
```
Ritual modifies world visuals (sky, fog)
    ↓
Player perception changes
    ↓
WorldPersonalityController worldMood updates
    ↓
Future ritual triggers affected
```
- **RISK LEVEL:** LOW
- **NOTES:** This is intended gameplay feedback, not a technical bug

---

## STEP 7 — SEMANTIC LAYER STACK DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RAW METRICS LAYER                              │
│  • synergy, harmony, stability, corruption, energy, clarity        │
│  • Written by CoreMetricsCalculator                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   AI INTERPRETATION LAYER                           │
│  • ArchetypeAscensionCurves_v1 (personality curves)                │
│  • MythicEvolutionFX_v1 (quality tiers)                             │
│  • LinkPersonalityStateMachine_v1 (link evolution)                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     SEMANTIC STATE LAYER                            │
│  node.userData.archetypeEvolution = {                               │
│    archetypeId, archetypeName, ascensionModified,                   │
│    ascensionMultiplier, tierBoost, nextTierProgress                │
│  }                                                                  │
│                                                                     │
│  node.userData.mythicEvolution = {                                   │
│    ascensionRaw, ascensionSmoothed, tier, ascensionModified        │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     ARCHETYPE ROLE LAYER                            │
│  • Sage, Warlock, Sentinel, Empath, Invoker, Mythic                │
│  • 6 archetype profiles with curve mappings                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      GLYPH ROLE LAYER                               │
│  • _SemanticGlyphAI (focus, idle, semantic rotation)               │
│  • _ProceduralMeaningEngine (procedural generation)                 │
│  • _RecursiveGlyphSignalSystem (messaging)                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
┌─────────────────────┐                   ┌─────────────────────────┐
│ STATE-BASED PATH    │                   │ DIRECT MUTATION PATH    │
│ (Clean Layered)     │                   │ (Coupled)               │
└─────────────────────┘                   └─────────────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────────┐                   ┌─────────────────────────┐
│ Visual Readers:    │                   │ Direct Material Writers: │
│ • ArchetypeColor    │                   │ • SemanticGlyphAI        │
│   PaletteSystem    │                   │ • ProceduralMeaning      │
│ • ArchetypeAura     │                   │   Engine                 │
│   Enhancement      │                   │ • RecursiveGlyph         │
│ • ArchetypeShader   │                   │   SignalSystem           │
│   Modes             │                   │ • LinkedGlyphMessaging   │
└─────────────────────┘                   └─────────────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────────┐                   ┌─────────────────────────┐
│ Shader Uniforms     │                   │ Material Properties:    │
│ • Color uniforms    │                   │ • opacity (5+ writers!)  │
│ • Emissive uniforms │                   │ • emissiveIntensity     │
└─────────────────────┘                   └─────────────────────────┘
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SHADER / MATERIAL                             │
│  • CoreHologramShader                                              │
│  • Aura shaders                                                     │
│  • Glyph materials                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SCREEN OUTPUT                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### AUTHORITY BREAKS HIGHLIGHTED

**❌ AUTHORITY BREAK - Direct Mutation Bypasses Semantic Layer:**
- SemanticGlyphAI → material.opacity (per-frame)
- ProceduralMeaningEngine → material.opacity (per-frame)
- RecursiveGlyphSignalSystem → material.opacity (per-frame)
- LinkedGlyphMessaging → material.opacity (per-frame)

**⚠️ MULTIPLE WRITERS - Conflict Risk:**
- `material.opacity` written by 5+ systems simultaneously
- No coordination or priority system

**✅ CLEAN LAYERED - State-Based Path:**
- Archetype systems → archetypeEvolution → Visual readers → Shader uniforms
- Mythic systems → mythicEvolution → Visual readers → Shader uniforms

---

## STEP 8 — COUPLING CLASSIFICATION

### CLASSIFICATION: **STATE-BASED BUT FRAGMENTED**

**JUSTIFICATION:**

**1. LAYERED SEMANTIC STATE (GOOD)**
- ✅ Clear semantic state structures (archetypeEvolution, mythicEvolution)
- ✅ Single writer per semantic state (ArchetypeAscensionCurves_v1, MythicEvolutionFX_v1)
- ✅ State-based coupling dominant in archetype/ritual systems
- ✅ No circular dependencies

**2. FRAGMENTED VISUAL AUTHORITY (PROBLEM)**
- ❌ Two parallel visual mutation paths (state-based vs direct)
- ❌ Direct material mutations bypass semantic layer
- ❌ Multiple systems write same material property (5+ writers to opacity)
- ❌ No central visual authority or priority system

**3. MIXED TIMING COUPLING (ACCEPTABLE)**
- ⚠️ Frame-based coupling for continuous glyph systems
- ✅ Event-based coupling for rare ritual systems
- ⚠️ No coordination between frame and event mutations

**4. CIRCULAR DEPENDENCY (SAFE)**
- ✅ No circular dependencies detected
- ✅ AI systems do not read visual state
- ✅ Visual systems do not write back to semantic state

### COUPLING SCORECARD

| Aspect | Score | Notes |
|--------|-------|-------|
| Semantic State Definition | 9/10 | Well-defined, single-writer state structures |
| State-Based Visual Coupling | 8/10 | Clean layered coupling for archetype/ritual systems |
| Direct Visual Mutation | 3/10 | Fragmented, multiple writers, no coordination |
| Visual Authority Centralization | 2/10 | No central authority, conflict risk |
| Circular Dependency Risk | 1/10 | Minimal risk, unidirectional flow |
| Event vs Frame Coupling | 7/10 | Appropriate mixing, but no coordination |
| Overall Coherence | 5/10 | Mixed: clean state layer, fragmented visual layer |

### RISK ASSESSMENT

**HIGH RISK:**
- Multiple writers to `material.opacity` without coordination
- Direct material mutations can overwrite each other unpredictably
- No visual authority lock system for material properties

**MEDIUM RISK:**
- Frame-based direct mutations bypass semantic layer
- Ritual visual mutations could conflict with glyph systems
- No priority system for conflicting visual updates

**LOW RISK:**
- Semantic state is well-protected (single writers)
- No circular dependencies
- Ritual systems are self-contained and restore state

---

## RECOMMENDATIONS (READ-ONLY NOTE)

This audit is read-only. Recommendations for future consideration:

1. **CENTRALIZE VISUAL AUTHORITY:**
   - Implement visual authority lock system for material properties
   - Establish priority system for conflicting visual updates
   - Consider migrating direct mutations to state-based pattern

2. **REDUCE MATERIAL CONFLICTS:**
   - Consolidate opacity writers or establish clear ownership
   - Separate visual layers with distinct material ownership
   - Add coordination between frame-based mutation systems

3. **STRENGTHEN SEMANTIC LAYER:**
   - Consider extending state-based pattern to all visual systems
   - Maintain single-writer principle for semantic state
   - Document authority boundaries clearly

4. **MAINTAIN UNIDIRECTIONAL FLOW:**
   - Preserve current no-circular-dependency architecture
   - Avoid AI systems reading visual state
   - Keep visual systems from writing back to semantic state

---

## APPENDICES

### APPENDIX A: KEY DATA STRUCTURES

**archetypeEvolution:**
```javascript
node.userData.archetypeEvolution = {
  archetypeId: "sage",              // Primary archetype
  archetypeName: "Sage",            // Human-readable name
  ascensionModified: 0.75,          // Curve-mapped ascension (0-1)
  ascensionMultiplier: 1.8,         // Visual intensity multiplier
  curveRaw: 0.7,                    // Raw curve evaluation
  curveSmoothed: 0.72,              // EMA-smoothed curve
  personalityInfluence: 0.8,         // How personality signals bias curve
  tierBoost: 1.4,                   // Tier-specific multiplier
  nextTierProgress: 0.6,             // Progress to next tier (0-1)
  lastUpdateTime: 12345.6           // Timestamp for hysteresis
}
```

**mythicEvolution:**
```javascript
node.userData.mythicEvolution = {
  ascensionRaw: 0.8,                // Raw computation from metrics
  ascensionSmoothed: 0.78,          // EMA-smoothed ascension
  tier: 2,                          // Current tier (0-4)
  ascensionModified: 0.75           // Final modified ascension
}
```

### APPENDIX B: ARCHETYPE SYSTEM INTEGRATION

**Archetypes:**
1. Sage (stability/clarity)
2. Warlock (chaos/entropy)
3. Sentinel (order-focused)
4. Empath (harmony/resonance)
5. Invoker (energy/focus)
6. Mythic (transcendent)

**Integration Points:**
- 15+ visual systems read archetypeEvolution
- ArchetypeAscensionCurves_v1 is single writer
- No direct archetype mutations outside this system

### APPENDIX C: RITUAL SYSTEM COUPLING

**Ritual Types:**
1. ASCENSION_RITUAL
2. QUANTUM_FISSURE
3. HARMONY_CONVERGENCE
4. CHAOS_RITUAL
5. MYTHIC_SIGNAL
6. ECHO_RITUAL

**Visual Mutation Pattern:**
- Event-based triggers (worldMood conditions)
- Temporary material mutations (restored on end)
- No permanent semantic state changes
- Self-contained visual effects

---

**AUDIT COMPLETE**  
**NO MODIFICATIONS MADE**  
**READ-ONLY ANALYSIS**