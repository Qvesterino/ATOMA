/**
 * WAVE INTERFERENCE ENGINE v1.0 – INTEGRATION CODE SNIPPETS
 * 
 * Copy-paste ready examples for integrating WaveInterferenceEngine_v1
 * into your ATOMA project.
 */

// ============================================================================
// 1. BASIC INITIALIZATION
// ============================================================================

/**
 * Setup: Initialize wave engine during game init
 */
{
  import { WaveInterferenceEngine_v1 } from './WaveInterferenceEngine_v1.js';
  
  class AtomaGame {
    init() {
      // ... other setup ...
      
      // Initialize wave engine
      this.waveEngine = new WaveInterferenceEngine_v1({
        graph: this.nodeLinkingSystem,
        maxSources: 8,
        timeSource: { now: () => this.time.now() }
      });
      
      console.log('✓ Wave Interference Engine initialized');
    }
  }
}

// ============================================================================
// 2. BASIC WAVE TRIGGER
// ============================================================================

/**
 * Trigger a simple wave from a node
 */
{
  const sourceId = this.waveEngine.addWaveSource({
    type: 'NODE',
    nodeId: 'center-node',
    originPosition: centerNode.position.clone(),
    baseAmplitude: 0.8,
    baseFrequency: 2.0,
    decayRadius: 15,
    ttl: 5.0
  });
  
  console.log(`Wave ${sourceId} triggered`);
}

// ============================================================================
// 3. WAVE WITH SYNERGY MODULATION
// ============================================================================

/**
 * Trigger wave with synergy/resonance/corruption boosts
 */
{
  const sourceId = this.waveEngine.addWaveSource({
    type: 'NODE',
    nodeId: synergyCascadeNode.id,
    originPosition: synergyCascadeNode.position.clone(),
    baseAmplitude: 0.85,
    baseFrequency: 2.5,
    basePhase: Math.PI / 4,
    decayRadius: 18,
    profile: 'SYNERGY',
    synergyBoost: 0.8,         // Synergy from cascade
    resonanceBoost: 0.6,       // Resonance quality
    corruptionBoost: 0.0,      // No corruption
    ttl: 6.0
  });
}

// ============================================================================
// 4. MULTI-SOURCE CASCADE
// ============================================================================

/**
 * Emit multiple waves with different frequencies (harmonic cascade)
 */
{
  const frequencies = [1.0, 1.5, 2.0, 2.5];
  const sourceIds = [];
  
  for (let i = 0; i < frequencies.length; i++) {
    const sourceId = this.waveEngine.addWaveSource({
      type: 'NODE',
      nodeId: epicenterNode.id,
      originPosition: epicenterNode.position.clone(),
      baseFrequency: frequencies[i],
      baseAmplitude: 0.8 - i * 0.1,      // Decreasing
      decayRadius: 12 + i * 3,           // Increasing range
      synergyBoost: 0.5 + i * 0.1,
      ttl: 5.0
    });
    sourceIds.push(sourceId);
  }
  
  console.log(`Multi-source cascade: ${sourceIds.length} waves`);
}

// ============================================================================
// 5. CORRUPTION WAVE
// ============================================================================

/**
 * Emit a corruption/decay wave
 */
{
  const corruptionId = this.waveEngine.addWaveSource({
    type: 'EVENT',
    originPosition: corruptionOrigin.position.clone(),
    baseAmplitude: 0.9,
    baseFrequency: 1.5,
    decayRadius: 20,
    profile: 'CORRUPTION',
    synergyBoost: 0.0,         // No synergy
    resonanceBoost: 0.0,       // No resonance
    corruptionBoost: 1.0,      // Max corruption
    ttl: 8.0
  });
  
  console.log(`Corruption wave: ${corruptionId}`);
}

// ============================================================================
// 6. UPDATE LOOP INTEGRATION
// ============================================================================

/**
 * Call wave engine update in main animation loop
 */
{
  function animate(deltaTime) {
    // Update wave interference
    this.waveEngine?.update?.(deltaTime, {
      nodes: this.nodes,
      links: this.links
    });
    
    // Update materials with wave effects
    updateWaveVisuals();
    
    // Continue with other updates
    this.update?.(deltaTime);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(animate);
  }
}

// ============================================================================
// 7. APPLY WAVES TO NODE MATERIALS
// ============================================================================

/**
 * Update node materials with wave field data
 */
{
  function updateNodeWaves() {
    for (const node of this.nodes) {
      try {
        const field = this.waveEngine?.getNodeWaveField?.(node.id);
        
        if (field && field.totalAmplitude > 0.01) {
          // Glow based on total amplitude
          if (node.material?.emissiveIntensity !== undefined) {
            node.material.emissiveIntensity = 
              1 + field.totalAmplitude * 2;
          }
          
          // Color based on interference type
          if (node.material?.emissive) {
            if (field.constructivePower > field.destructivePower) {
              // Harmonic (constructive) – green
              node.material.emissive.setHSL(0.33, 1, 0.5);
            } else {
              // Corrupted (destructive) – red
              node.material.emissive.setHSL(0, 1, 0.5);
            }
          }
          
          // Scale pulsation based on standing wave
          const scale = 1 + field.standingWaveFactor * 0.2;
          node.scale.set(scale, scale, scale);
        } else if (node.scale.x !== 1) {
          // Reset to normal
          node.scale.set(1, 1, 1);
          if (node.material?.emissiveIntensity !== undefined) {
            node.material.emissiveIntensity = 0;
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
  }
}

// ============================================================================
// 8. APPLY WAVES TO LINK MATERIALS
// ============================================================================

/**
 * Update link materials with wave field data
 */
{
  function updateLinkWaves() {
    for (const link of this.links) {
      try {
        const field = this.waveEngine?.getLinkWaveField?.(link.id);
        
        if (field && field.totalAmplitude > 0.01) {
          // Ripple amplitude
          if (link.material?.uniforms?.uRippleAmplitude) {
            link.material.uniforms.uRippleAmplitude.value = 
              field.totalAmplitude * 2;
          }
          
          // Wave color
          if (link.material?.uniforms?.uWaveColor) {
            const color = new THREE.Color();
            if (field.constructivePower > field.destructivePower) {
              color.setHSL(0.33, 1, 0.5);  // Green
            } else {
              color.setHSL(0, 1, 0.5);     // Red
            }
            link.material.uniforms.uWaveColor.value = color;
          }
          
          // Phase animation
          if (link.material?.uniforms?.uWavePhase) {
            link.material.uniforms.uWavePhase.value = 
              field.travelPhase * Math.PI * 2;
          }
          
          // Standing wave indicator
          if (link.material?.uniforms?.uStandingWave) {
            link.material.uniforms.uStandingWave.value = 
              field.standingWaveFactor;
          }
        }
      } catch (e) {
        // Continue on error
      }
    }
  }
}

// ============================================================================
// 9. QUERY WAVE FIELD FOR DEBUGGING
// ============================================================================

/**
 * Debug: Log wave field information
 */
{
  function debugWaveField(targetId, targetType = 'NODE') {
    const field = targetType === 'NODE' ?
      this.waveEngine.getNodeWaveField(targetId) :
      this.waveEngine.getLinkWaveField(targetId);
    
    if (field) {
      console.log(`${targetType} ${targetId}:`);
      console.log(`  Total amplitude: ${field.totalAmplitude.toFixed(2)}`);
      console.log(`  Constructive: ${field.constructivePower.toFixed(2)}`);
      console.log(`  Destructive: ${field.destructivePower.toFixed(2)}`);
      console.log(`  Standing wave: ${field.standingWaveFactor.toFixed(2)}`);
      console.log(`  Travel phase: ${field.travelPhase.toFixed(2)}`);
      console.log(`  Source count: ${field.sourceCount}`);
    } else {
      console.log(`No wave field at ${targetId}`);
    }
  }
}

// ============================================================================
// 10. MONITOR ACTIVE SOURCES
// ============================================================================

/**
 * Debug: List all active wave sources
 */
{
  function debugActiveSources() {
    const sources = this.waveEngine?.getActiveSources?.() || [];
    
    console.log(`${sources.length} active wave sources:`);
    
    for (const source of sources) {
      console.log(`
        ID: ${source.id}
        Type: ${source.type}
        Age: ${source.age.toFixed(1)}s / ${source.ttl}s
        Amplitude: ${source.currentAmplitude.toFixed(2)}
        Frequency: ${source.baseFrequency.toFixed(1)} Hz
        Decay Radius: ${source.decayRadius}
      `);
    }
  }
}

// ============================================================================
// 11. PERFORMANCE MONITORING
// ============================================================================

/**
 * Debug: Log performance metrics
 */
{
  function debugMetrics() {
    const metrics = this.waveEngine?.getMetrics?.();
    
    if (metrics) {
      console.log(`─ WAVE ENGINE METRICS ─`);
      console.log(`Sources: ${metrics.activeSources}/${metrics.maxSources}`);
      console.log(`Target fields: ${metrics.targetFieldsCount}`);
      console.log(`Updates: ${metrics.updateCount}`);
      console.log(`Cache size: ${metrics.cacheSize}`);
    }
  }
}

// ============================================================================
// 12. INTEGRATION WITH SYNERGY CASCADE
// ============================================================================

/**
 * Connect wave engine to SynergyChainReaction_v1
 */
{
  // When cascade fires, emit wave
  this.synergyChainReaction.on?.('cascadeFired', (cascade) => {
    const sourceId = this.waveEngine.addWaveSource({
      type: 'NODE',
      nodeId: cascade.sourceNode.id,
      originPosition: cascade.sourceNode.position.clone(),
      baseAmplitude: Math.min(1, cascade.intensity * 1.2),
      baseFrequency: 2.0 + cascade.resonance,
      decayRadius: 12 + cascade.resonance * 8,
      profile: 'SYNERGY',
      synergyBoost: cascade.resonance,
      resonanceBoost: cascade.harmonyFactor,
      corruptionBoost: 0,
      ttl: 3 + cascade.duration
    });
  });
}

// ============================================================================
// 13. COMBINE WITH CASCADE PROPAGATION
// ============================================================================

/**
 * Blend wave interference with cascade ripples
 */
{
  function updateCombinedEffects() {
    for (const link of this.links) {
      const cascadeState = this.cascadeFX?.getLinkCascadeState?.(link);
      const waveField = this.waveEngine?.getLinkWaveField?.(link.id);
      
      if (!cascadeState && !waveField) {
        link.material.uniforms.uIntensity.value = 0;
        continue;
      }
      
      const cascadeIntensity = cascadeState?.totalIntensity ?? 0;
      const waveIntensity = waveField?.totalAmplitude ?? 0;
      
      // Blend: 60% cascade, 40% waves
      const combined = cascadeIntensity * 0.6 + waveIntensity * 0.4;
      
      link.material.uniforms.uIntensity.value = combined;
      
      // Color mixing
      if (cascadeState) {
        link.material.uniforms.uColor.value.copy(cascadeState.effectiveColor);
      } else if (waveField?.constructivePower > waveField?.destructivePower) {
        link.material.uniforms.uColor.value.setHSL(0.33, 1, 0.5);  // Green
      }
    }
  }
}

// ============================================================================
// 14. CLEANUP / DISPOSAL
// ============================================================================

/**
 * Proper cleanup on game shutdown
 */
{
  class AtomaGame {
    dispose() {
      // Stop all waves
      this.waveEngine?.clear?.();
      
      // Cleanup engine
      this.waveEngine?.dispose?.();
      this.waveEngine = null;
      
      // ... other cleanup ...
      
      console.log('✓ Wave Interference Engine disposed');
    }
  }
}

// ============================================================================
// 15. REAL-TIME WAVE VISUALIZATION HUD
// ============================================================================

/**
 * Display wave engine state in HUD
 */
{
  class WaveEngineHUD {
    constructor(waveEngine) {
      this.engine = waveEngine;
      this.updateInterval = 1000; // ms
      this.lastUpdate = 0;
    }
    
    update(currentTime) {
      if (currentTime - this.lastUpdate < this.updateInterval) {
        return;
      }
      this.lastUpdate = currentTime;
      
      const metrics = this.engine.getMetrics();
      const sources = this.engine.getActiveSources();
      
      document.getElementById('wave-hud').innerHTML = `
        <div style="font-family: monospace; background: rgba(0,0,0,0.7); padding: 10px;">
          <div>WAVE ENGINE</div>
          <div>Active: ${metrics.activeSources}/${metrics.maxSources}</div>
          <div>Targets: ${metrics.targetFieldsCount}</div>
          <div>Updates: ${metrics.updateCount}</div>
          <div style="margin-top: 5px; font-size: 0.8em;">
            ${sources.map(s => 
              `${s.type.charAt(0)} age=${s.age.toFixed(1)}s amp=${s.currentAmplitude.toFixed(2)}`
            ).join('<br/>')}
          </div>
        </div>
      `;
    }
  }
}

// ============================================================================
// 16. INTEGRATION WITH SHADER UNIFORMS
// ============================================================================

/**
 * Bind wave data to custom shader uniforms
 */
{
  function setupWaveShaders() {
    // For each node with custom shader
    for (const node of this.nodes) {
      if (!node.material?.uniforms?.uWaveData) continue;
      
      const field = this.waveEngine.getNodeWaveField(node.id);
      
      if (field) {
        // Pack wave data into uniform
        node.material.uniforms.uWaveData.value = new THREE.Vector4(
          field.totalAmplitude,
          field.standingWaveFactor,
          field.travelPhase,
          field.interferenceIndex
        );
      }
    }
  }
}

// ============================================================================
// 17. WORLD EVENT WAVE
// ============================================================================

/**
 * Emit wave from world event (not tied to specific node)
 */
{
  function triggerWorldEvent(eventName, position) {
    const sourceId = this.waveEngine.addWaveSource({
      type: 'WORLD',
      originPosition: position.clone(),
      baseAmplitude: 0.8,
      baseFrequency: 2.0,
      decayRadius: 25,
      profile: eventName,
      synergyBoost: 0.4,
      ttl: 7.0
    });
    
    console.log(`World event wave: ${sourceId}`);
  }
}

// ============================================================================
// 18. RESONANCE DETECTION
// ============================================================================

/**
 * Find nodes with strong standing waves (resonance)
 */
{
  function findResonantNodes(threshold = 0.7) {
    const resonant = [];
    
    for (const node of this.nodes) {
      const field = this.waveEngine.getNodeWaveField(node.id);
      
      if (field?.standingWaveFactor > threshold) {
        resonant.push({
          nodeId: node.id,
          resonance: field.standingWaveFactor,
          amplitude: field.totalAmplitude
        });
      }
    }
    
    return resonant;
  }
}

// ============================================================================
// 19. FREQUENCY SWEEP
// ============================================================================

/**
 * Emit waves across frequency range (sweep)
 */
{
  function frequencySweep(startFreq, endFreq, steps, position) {
    const sourceIds = [];
    
    for (let i = 0; i < steps; i++) {
      const freq = startFreq + (endFreq - startFreq) * (i / steps);
      const amplitude = 0.8 - (i / steps) * 0.3;
      
      const sourceId = this.waveEngine.addWaveSource({
        type: 'EVENT',
        originPosition: position.clone(),
        baseFrequency: freq,
        baseAmplitude: amplitude,
        decayRadius: 15,
        ttl: 5.0
      });
      
      sourceIds.push(sourceId);
    }
    
    return sourceIds;
  }
}

// ============================================================================
// 20. COMPLETE INTEGRATION EXAMPLE
// ============================================================================

/**
 * Full example: Game with wave engine integrated
 */
{
  class AtomaGameWithWaves {
    init() {
      this.waveEngine = new WaveInterferenceEngine_v1({
        graph: this.nodeLinkingSystem,
        maxSources: 8
      });
    }
    
    update(deltaTime) {
      // Update waves
      this.waveEngine.update(deltaTime, {
        nodes: this.nodes,
        links: this.links
      });
      
      // Update visuals
      this.updateWaveVisuals();
    }
    
    updateWaveVisuals() {
      // Update nodes
      for (const node of this.nodes) {
        const field = this.waveEngine.getNodeWaveField(node.id);
        if (field) {
          node.material.emissiveIntensity = 1 + field.totalAmplitude * 2;
          node.material.emissive.setHSL(
            field.constructivePower > field.destructivePower ? 0.33 : 0,
            1,
            0.5
          );
        }
      }
      
      // Update links
      for (const link of this.links) {
        const field = this.waveEngine.getLinkWaveField(link.id);
        if (field) {
          link.material.uniforms.uIntensity.value = field.totalAmplitude;
          link.material.uniforms.uPhase.value = field.travelPhase;
        }
      }
    }
    
    dispose() {
      this.waveEngine?.dispose?.();
    }
  }
}

// ============================================================================
// END OF SNIPPETS
// ============================================================================

export const WAVE_INTERFERENCE_SNIPPETS = {
  description: 'Integration examples for WaveInterferenceEngine_v1'
};
