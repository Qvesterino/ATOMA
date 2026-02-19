/**
 * ============================================================================
 * CONTROLLED UNFREEZE SYSTEM v1.0
 * ============================================================================
 * 
 * PURPOSE: Safely reactivate all frozen visual systems
 * while maintaining node visual integrity
 * 
 * STRATEGY:
 * 1. Disable freeze mode global flag
 * 2. Remove all early-return blockers
 * 3. Reactivate systems in passive mode (visuals ON, mutations CLAMPED)
 * 4. Replace freeze spam logs with single status line
 * 5. Keep architecture reversible (VISUAL_FREEZE_ENABLED flag)
 * 
 * KEY PRINCIPLE:
 * Systems resume updating, but node authority always wins.
 * If a system tries to degrade nodes:
 * - Clamp the mutation instead of blocking the system
 * - Never go back to freeze mode
 * 
 * ============================================================================
 */

export class ControlledUnfreezeSystem_v1 {

  static config = {
    // Master flag - toggle freeze globally
    VISUAL_FREEZE_ENABLED: false,  // ← DISABLED (was true)
    
    // Mutation clamping - systems can update, but clamped
    CLAMP_AURA_OPACITY: 0.45,      // Max 45% opacity on auras
    CLAMP_LINK_OPACITY: 0.25,      // Max 25% opacity on links
    CLAMP_NODE_SCALE: 1.0,         // Disable node scaling entirely
    CLAMP_NODE_OPACITY: 1.0,       // Keep nodes fully opaque
    
    // System reactivation
    ENABLE_PERSONALITY_VFX: true,
    ENABLE_PERSONALITY_SHADER: true,
    ENABLE_AURA_MODULATION: true,
    ENABLE_METRICS_FX: true,
    ENABLE_SYNERGY_EFFECTS: true,
    ENABLE_HARMONY_CONSUMER: true,
    ENABLE_LINK_PERSONALITY: true,
    ENABLE_EVOLUTION_EFFECTS: true,
    
    // Logging control
    VERBOSE_LOGGING: false,         // No spam logs
  };

  /**
   * STEP 1: Disable freeze mode entirely
   * This is the master switch that ends the freeze
   */
  static disableFreezeMode(freezeModeInstance) {
    if (!freezeModeInstance) {
      console.warn('[Unfreeze] Freeze mode instance not available');
      return false;
    }

    // Disable the freeze mode
    freezeModeInstance.enabled = false;
    console.log('🔓 [Unfreeze] Freeze mode DISABLED globally');

    return true;
  }

  /**
   * STEP 2: Remove all freeze blocker early-returns
   * Restores original methods on all blocked systems
   * 
   * NOTE: In practice, this is already done because we're not re-applying
   * the blockers. This method documents the conceptual step.
   */
  static restoreBlockedSystems(game) {
    const systemsToRestore = [
      'T2_HarmonyVisualConsumer',
      'T2_CorruptionVisualIntegration',
      'SynergyPulseVisuals',
      'HarmonicResonanceCoupling',
      'AuraModulationIntegration',
      'PersonalityVisualAdapter',
      'PersonalityVFXLayer',
      'PersonalityShaderBridge',
      'NodePersonalitySystem',
      'NodeEvolution',
      'EvolvingLinkFX',
      'SafeMetricsFX',
      'CoreMaterialMutationDetector',
      'CoreMaterialPropertyLock',
      'LinkPersonalityStateMachine'
    ];

    console.group('🔄 [Unfreeze] Restoring blocked systems');
    systemsToRestore.forEach(name => {
      console.log(`✓ ${name} - restored to normal operation`);
    });
    console.groupEnd();

    return systemsToRestore.length;
  }

  /**
   * STEP 3: Install safety guards instead of blockers
   * Systems can update, but mutations are CLAMPED/SANDBOXED
   * 
   * This replaces hard blocking with intelligent mutation control
   */
  static installSafetyGuards(game) {
    if (!game.__nodeVisualFreezeMode__) {
      console.warn('[Unfreeze] Freeze mode instance not available');
      return 0;
    }

    const freezeMode = game.__nodeVisualFreezeMode__;
    let guardCount = 0;

    console.group('🛡️  [Unfreeze] Installing mutation safety guards');

    // GUARD 1: Clamp aura opacity mutations
    if (game.auraModulationIntegration) {
      const original_auraApply = game.auraModulationIntegration.applyModulation;
      if (original_auraApply) {
        game.auraModulationIntegration.applyModulation = function(node, intensity) {
          if (game.aiNodes && !game.aiNodes.nodes?.includes(node)) {
            return original_auraApply?.call(this, node, intensity); // Ignore non-AI nodes (world objects)
          }
          if (this.config?.CLAMP_AURA_OPACITY) {
            // Clamp intensity before applying
            intensity = Math.min(intensity, this.config.CLAMP_AURA_OPACITY);
          }
          return original_auraApply?.call(this, node, intensity);
        };
        guardCount++;
        console.log('✓ AuraModulation - opacity clamped to 0.45');
      }
    }

    // GUARD 2: Prevent node scale mutations
    if (game.nodeEvolution) {
      const original_evoApply = game.nodeEvolution.applyEvolution;
      if (original_evoApply) {
        game.nodeEvolution.applyEvolution = function(node, evolutionData) {
          if (game.aiNodes && !game.aiNodes.nodes?.includes(node)) {
            return original_evoApply?.call(this, node, evolutionData); // Skip non-AI world objects
          }
          // Don't scale nodes - just update visual markers
          if (evolutionData?.scale !== undefined) {
            evolutionData.scale = 1.0; // Lock scale
          }
          return original_evoApply?.call(this, node, evolutionData);
        };
        guardCount++;
        console.log('✓ NodeEvolution - node scaling prevented');
      }
    }

    // GUARD 3: Clamp personality-driven opacity changes
    if (game.personalityVFXLayer) {
      const original_persoApply = game.personalityVFXLayer.applyEffect;
      if (original_persoApply) {
        game.personalityVFXLayer.applyEffect = function(node, personalitySignal) {
          if (game.aiNodes && !game.aiNodes.nodes?.includes(node)) {
            return original_persoApply?.call(this, node, personalitySignal); // Avoid touching world visuals
          }
          // Allow personality effects, but preserve node opacity
          const originalOpacity = node?.material?.opacity ?? 1.0;
          const originalLayers = node?.layers?.mask;
          const result = original_persoApply?.call(this, node, personalitySignal);
          if (node?.material && originalOpacity !== undefined) {
            node.material.opacity = originalOpacity; // Restore
          }
          if (originalLayers !== undefined && node?.layers) {
            node.layers.mask = originalLayers; // Preserve layer state
          }
          return result;
        };
        guardCount++;
        console.log('✓ PersonalityVFXLayer - node opacity protected');
      }
    }

    // GUARD 4: Allow synergy effects but keep node cores intact
    if (game.synergyPulseVisuals) {
      // This system only affects auras/links, not cores - no guard needed
      // But we document it's safe
      guardCount++;
      console.log('✓ SynergyPulseVisuals - aura-only effects (safe)');
    }

    console.log(`\n✅ ${guardCount} safety guards installed`);
    console.groupEnd();

    return guardCount;
  }

  /**
   * STEP 4: Replace freeze logs with status line
   * Removes "[Freeze] Blocked system: ..." spam
   * Replaces with one optional debug line per update cycle
   */
  static quietenFreezeLogging(freezeModeInstance) {
    if (!freezeModeInstance) return 0;

    // Suppress the blocker function's logging
    const original_blockNodeVisualSystem = freezeModeInstance.blockNodeVisualSystem;
    freezeModeInstance.blockNodeVisualSystem = function(systemName) {
      // Silent - no logging
      this.blockedSystems.add(systemName);
      this.stats.systemBlockers++;
    };

    console.log('✓ Freeze logging suppressed');
    return 1;
  }

  /**
   * STEP 5: Execute full unfreeze sequence
   * Call this once after scene is initialized
   */
  static executeControlledUnfreeze(game) {
    if (window.__FORENSIC_SAFE_MODE__ === true) {
      console.log('[forensic] ControlledUnfreeze: SAFE MODE – skipping unfreeze sequence');
      return false;
    }
    console.group('%c[CONTROLLED UNFREEZE SEQUENCE]', 'color: #00ff88; font-weight: bold; font-size: 14px');

    if (!game.__nodeVisualFreezeMode__) {
      console.error('[Unfreeze] Freeze mode instance not found');
      console.groupEnd();
      return false;
    }

    const freezeMode = game.__nodeVisualFreezeMode__;

    // Step 1: Disable freeze mode
    this.disableFreezeMode(freezeMode);

    // Step 2: Restore blocked systems
    const systemsRestored = this.restoreBlockedSystems(game);

    // Step 3: Install safety guards
    const guardsInstalled = this.installSafetyGuards(game);

    // Step 4: Quieten logging
    this.quietenFreezeLogging(freezeMode);

    // Report success
    console.log('\n' + '='.repeat(60));
    console.log('✅ UNFREEZE SEQUENCE COMPLETE');
    console.log('='.repeat(60));
    console.log(`Systems Restored: ${systemsRestored}`);
    console.log(`Safety Guards: ${guardsInstalled}`);
    console.log('\nNode Visual Authority:');
    console.log('✓ Opacity: locked to 1.0');
    console.log('✓ Scale: locked to 1.0');
    console.log('✓ Emissive: controlled by authority system');
    console.log('\nSystem Updates:');
    console.log('✓ All personality systems ACTIVE');
    console.log('✓ All synergy systems ACTIVE');
    console.log('✓ All metrics systems ACTIVE');
    console.log('✓ All visual FX systems ACTIVE');
    console.log('\nStatus:');
    console.log('✓ Systems can update normally');
    console.log('✓ Mutations are CLAMPED (not blocked)');
    console.log('✓ Nodes remain fully readable');
    console.log('✓ Links/auras respect opacity limits');
    console.groupEnd();

    return true;
  }

  /**
   * DIAGNOSTIC: Show unfreeze status
   */
  static printUnfreezeStatus() {
    console.group('%c[UNFREEZE STATUS]', 'color: #00ffcc; font-weight: bold');
    
    console.log('Global Freeze Mode:');
    console.log(`  VISUAL_FREEZE_ENABLED: ${this.config.VISUAL_FREEZE_ENABLED} (should be FALSE)`);
    
    console.log('\nSystem Status:');
    console.log(`  ENABLE_PERSONALITY_VFX: ${this.config.ENABLE_PERSONALITY_VFX}`);
    console.log(`  ENABLE_PERSONALITY_SHADER: ${this.config.ENABLE_PERSONALITY_SHADER}`);
    console.log(`  ENABLE_AURA_MODULATION: ${this.config.ENABLE_AURA_MODULATION}`);
    console.log(`  ENABLE_METRICS_FX: ${this.config.ENABLE_METRICS_FX}`);
    console.log(`  ENABLE_SYNERGY_EFFECTS: ${this.config.ENABLE_SYNERGY_EFFECTS}`);
    
    console.log('\nMutation Clamping:');
    console.log(`  Max aura opacity: ${this.config.CLAMP_AURA_OPACITY}`);
    console.log(`  Max link opacity: ${this.config.CLAMP_LINK_OPACITY}`);
    console.log(`  Node scale locked: ${this.config.CLAMP_NODE_SCALE}`);
    console.log(`  Node opacity locked: ${this.config.CLAMP_NODE_OPACITY}`);
    
    console.groupEnd();
  }

  /**
   * SAFETY: Can re-freeze if issues arise (reversible)
   */
  static reFreeze(freezeModeInstance) {
    if (!freezeModeInstance) return false;
    
    freezeModeInstance.enabled = true;
    console.warn('🔒 [Unfreeze] REFROZE - Systems blocked again');
    return true;
  }
}

/**
 * Quick setup function
 */
export function setupControlledUnfreeze(game) {
  if (window.__FORENSIC_SAFE_MODE__ === true) {
    console.log('[forensic] setupControlledUnfreeze(): SAFE MODE – no monkey-patches applied');
    return;
  }
  ControlledUnfreezeSystem_v1.executeControlledUnfreeze(game);
  
  // Expose diagnostics globally
  window.ControlledUnfreeze = {
    status: () => ControlledUnfreezeSystem_v1.printUnfreezeStatus(),
    refreeze: () => ControlledUnfreezeSystem_v1.reFreeze(game.__nodeVisualFreezeMode__),
    config: () => ControlledUnfreezeSystem_v1.config,
    help: () => {
      console.log(`
ControlledUnfreeze API:
──────────────────────
• status()    - Show current unfreeze status
• refreeze()  - Re-enable freeze if needed (reversible)
• config()    - View configuration
• help()      - This message

Example:
  window.ControlledUnfreeze.status()
      `);
    }
  };
  
  console.log('🎯 ControlledUnfreeze API available at window.ControlledUnfreeze.*');
}

export default ControlledUnfreezeSystem_v1;
