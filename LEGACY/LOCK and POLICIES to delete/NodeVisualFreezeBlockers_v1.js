/**
 * NODE VISUAL FREEZE BLOCKERS v1.0
 * ================================
 * 
 * Patches all node-reactive systems to early-exit when freeze mode is active
 * Pattern: Check frozen flag, return immediately if set
 * 
 * Blocks:
 * - Link-reactive node visuals
 * - Harmony/synergy node pulses
 * - Corruption/stress overlays
 * - Personality-based changes
 * - All dynamic node color/scale/opacity changes
 */

/**
 * Install visual freeze blockers on all reactive systems
 * Call after all systems are initialized
 */
export function installNodeVisualFreezeBlockers(game) {
  if (!game.__nodeVisualFreezeMode__) {
    console.warn('[Blockers] Freeze mode not active - blockers will not install');
    return;
  }

  const freezeMode = game.__nodeVisualFreezeMode__;

  // =========================================================================
  // BLOCKER 1: Harmony Visual Consumer (harmony-driven node effects)
  // =========================================================================
  if (game.t2HarmonyVisualConsumer) {
    const original_t2Update = game.t2HarmonyVisualConsumer.update;
    game.t2HarmonyVisualConsumer.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('T2_HarmonyVisualConsumer');
        return; // BLOCKED
      }
      return original_t2Update?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ T2_HarmonyVisualConsumer blocked');
  }

  // =========================================================================
  // BLOCKER 2: Corruption Visual Integration (corruption-driven node effects)
  // =========================================================================
  if (game.t2CorruptionVisualIntegration) {
    const original_t2CorUpdate = game.t2CorruptionVisualIntegration.update;
    game.t2CorruptionVisualIntegration.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('T2_CorruptionVisualIntegration');
        return; // BLOCKED
      }
      return original_t2CorUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ T2_CorruptionVisualIntegration blocked');
  }

  // =========================================================================
  // BLOCKER 3: Synergy Pulse Visuals (synergy-driven node pulses)
  // =========================================================================
  if (game.synergyPulseVisuals) {
    const original_synergyUpdate = game.synergyPulseVisuals.update;
    game.synergyPulseVisuals.update = function(deltaTime, time) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('SynergyPulseVisuals');
        return; // BLOCKED
      }
      return original_synergyUpdate?.call(this, deltaTime, time);
    };
    console.log('[Blockers] ✓ SynergyPulseVisuals blocked');
  }

  // =========================================================================
  // BLOCKER 4: Harmonic Resonance Coupling (synergy-driven resonance)
  // =========================================================================
  if (game.harmonicResonanceCoupling) {
    const original_harmonicUpdate = game.harmonicResonanceCoupling.update;
    game.harmonicResonanceCoupling.update = function(deltaTime, avgSynergy) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('HarmonicResonanceCoupling');
        return; // BLOCKED
      }
      return original_harmonicUpdate?.call(this, deltaTime, avgSynergy);
    };
    console.log('[Blockers] ✓ HarmonicResonanceCoupling blocked');
  }

  // =========================================================================
  // BLOCKER 5: Aura Modulation System (event-driven node aura changes)
  // =========================================================================
  if (game.auraModulationIntegration) {
    const original_auraUpdate = game.auraModulationIntegration.update;
    game.auraModulationIntegration.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('AuraModulationIntegration');
        return; // BLOCKED
      }
      return original_auraUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ AuraModulationIntegration blocked');
  }

  // =========================================================================
  // BLOCKER 6: Personality Visual Adapter (personality-driven node changes)
  // =========================================================================
  if (game.personalityVisualAdapter) {
    const original_persoUpdate = game.personalityVisualAdapter.update;
    game.personalityVisualAdapter.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('PersonalityVisualAdapter');
        return; // BLOCKED
      }
      return original_persoUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ PersonalityVisualAdapter blocked');
  }

  // =========================================================================
  // BLOCKER 7: Personality VFX Layer (personality-driven effects)
  // =========================================================================
  if (game.personalityVFXLayer) {
    const original_vfxUpdate = game.personalityVFXLayer.update;
    game.personalityVFXLayer.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('PersonalityVFXLayer');
        return; // BLOCKED
      }
      return original_vfxUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ PersonalityVFXLayer blocked');
  }

  // =========================================================================
  // BLOCKER 8: Personality Shader Bridge (personality GPU effects)
  // =========================================================================
  if (game.personalityShaderBridge) {
    const original_shaderUpdate = game.personalityShaderBridge.update;
    game.personalityShaderBridge.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('PersonalityShaderBridge');
        return; // BLOCKED
      }
      return original_shaderUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ PersonalityShaderBridge blocked');
  }

  // =========================================================================
  // BLOCKER 9: Node Personality System (node personality reactions)
  // =========================================================================
  if (game.nodePersonalitySystem) {
    const original_nodePersUpdate = game.nodePersonalitySystem.update;
    game.nodePersonalitySystem.update = function(deltaTime, nodes) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('NodePersonalitySystem');
        return; // BLOCKED
      }
      return original_nodePersUpdate?.call(this, deltaTime, nodes);
    };
    console.log('[Blockers] ✓ NodePersonalitySystem blocked');
  }

  // =========================================================================
  // BLOCKER 10: Node Evolution (evolution-based node visual changes)
  // =========================================================================
  if (game.nodeEvolution) {
    const original_evoUpdate = game.nodeEvolution.update;
    game.nodeEvolution.update = function(deltaTime, metricsData, linkingSystem) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('NodeEvolution');
        return; // BLOCKED
      }
      return original_evoUpdate?.call(this, deltaTime, metricsData, linkingSystem);
    };
    console.log('[Blockers] ✓ NodeEvolution blocked');
  }

  // =========================================================================
  // BLOCKER 11: Evolving Link FX (link-visual driven)
  // Note: This affects links, not nodes, so it's lower priority
  // But we block it to prevent any cascading effects
  // =========================================================================
  if (game.evolvingLinkFX) {
    const original_linkEvUpdate = game.evolvingLinkFX.update;
    game.evolvingLinkFX.update = function(deltaTime, metricsData, linkingSystem) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('EvolvingLinkFX');
        return; // BLOCKED
      }
      return original_linkEvUpdate?.call(this, deltaTime, metricsData, linkingSystem);
    };
    console.log('[Blockers] ✓ EvolvingLinkFX blocked');
  }

  // =========================================================================
  // BLOCKER 12: Safe Metrics FX (metric-driven node visual effects)
  // =========================================================================
  if (game.metricsVisualFX) {
    const original_metricsUpdate = game.metricsVisualFX.update;
    game.metricsVisualFX.update = function(deltaTime) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('SafeMetricsFX');
        return; // BLOCKED
      }
      return original_metricsUpdate?.call(this, deltaTime);
    };
    console.log('[Blockers] ✓ SafeMetricsFX blocked');
  }

  // =========================================================================
  // BLOCKER 13: Core Material Mutation Detector (auto-repair of mutations)
  // Note: We disable this to prevent it from "fixing" frozen nodes
  // =========================================================================
  if (game.coreMaterialMutationDetector) {
    const original_mutationCheck = game.coreMaterialMutationDetector.checkAllCores;
    game.coreMaterialMutationDetector.checkAllCores = function() {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('CoreMaterialMutationDetector');
        return 0; // Return no violations - we're handling it
      }
      return original_mutationCheck?.call(this);
    };
    console.log('[Blockers] ✓ CoreMaterialMutationDetector blocked');
  }

  // =========================================================================
  // BLOCKER 14: Core Material Property Lock (frame-by-frame enforcement)
  // Note: We disable this as freeze mode handles it better
  // =========================================================================
  if (game.coreMaterialPropertyLock) {
    const original_lockEnforce = game.coreMaterialPropertyLock.enforceFrame;
    game.coreMaterialPropertyLock.enforceFrame = function() {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('CoreMaterialPropertyLock');
        return 0; // Return no violations
      }
      return original_lockEnforce?.call(this);
    };
    console.log('[Blockers] ✓ CoreMaterialPropertyLock blocked');
  }

  // =========================================================================
  // BLOCKER 15: Link Personality State Machine (link-visual reactions)
  // =========================================================================
  if (game.linkPersonalityStateMachine) {
    const original_linkPersUpdate = game.linkPersonalityStateMachine.update;
    game.linkPersonalityStateMachine.update = function(deltaTime, links) {
      if (freezeMode.enabled) {
        freezeMode.blockNodeVisualSystem('LinkPersonalityStateMachine');
        return; // BLOCKED
      }
      return original_linkPersUpdate?.call(this, deltaTime, links);
    };
    console.log('[Blockers] ✓ LinkPersonalityStateMachine blocked');
  }

  console.log('[Blockers] ✅ All visual freeze blockers installed');
  console.log('[Blockers] Node visuals are now IMMUTABLE');
}

export default installNodeVisualFreezeBlockers;
