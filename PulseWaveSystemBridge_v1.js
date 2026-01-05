/**
 * PulseWaveSystemBridge_v1.js
 * ============================================================================
 * Bridge: Wave Propagation → Pulse Position Updates
 * 
 * Converts wave field data from WaveInterferenceEngine into pulse positions
 * on links, triggering neural firing in PulseIntersectionImpulseAdapter.
 * 
 * ARCHITECTURE:
 * - WaveInterferenceEngine tracks waves propagating through network
 * - Wave fields stored in link.userData.waveField with 7 metrics
 * - Bridge extracts wave amplitude + phase → pulse position (0-1)
 * - Calls pulseIntersectionAdapter.updatePulsePosition() per link per frame
 * - Result: Neural firing appears to follow energy wave propagation
 * 
 * NO GAMEPLAY CHANGES, NO NEW PARTICLES, NO ALLOCATIONS
 * Pure visual translation of existing physics data
 */

export class PulseWaveSystemBridge_v1 {
  constructor(config = {}) {
    this.enabled = config.enabled ?? true;
    this.debugMode = config.debugMode ?? false;
    
    // Configuration
    this.pulseWidthFactor = config.pulseWidthFactor ?? 0.12;      // How wide pulse appears
    this.pulseSpeedFactor = config.pulseSpeedFactor ?? 0.8;       // How fast it moves (0-1)
    this.minAmplitudeToFire = config.minAmplitudeToFire ?? 0.15;  // Threshold to trigger impulses
    
    // Active tracking
    this.activeLinkWaves = new Map();  // linkId → { phase, amplitude, ... }
    
    // Console API
    this.setupConsoleAPI();
    
    console.log('[PulseWaveSystemBridge] Initialized ✓');
  }

  /**
   * Update: Call once per frame from animate loop
   * Reads wave fields from links and updates pulse positions
   */
  update(deltaTime, context = {}) {
    if (!this.enabled) return;
    
    const {
      waveEngine,
      links = [],
      nodeDynamicMetrics,
      pulseIntersectionAdapter
    } = context;
    
    if (!waveEngine || !links || !pulseIntersectionAdapter) {
      return;
    }
    
    try {
      // Process each link for wave-driven pulse updates
      for (const link of links) {
        if (!link || !link.userData) continue;
        
        const linkId = link.id || link.uuid || link.name;
        if (!linkId) continue;
        
        // Get wave field data from link
        const waveField = link.userData.waveField;
        if (!waveField) continue;
        
        // Extract wave metrics
        const amplitude = waveField.amplitude ?? 0;
        const phase = waveField.phase ?? 0;
        const harmonicLevel = waveField.harmonicLevel ?? 0;
        const destructiveInterference = waveField.destructiveInterference ?? 0;
        
        // Skip low-amplitude waves
        if (amplitude < this.minAmplitudeToFire) {
          this.activeLinkWaves.delete(linkId);
          continue;
        }
        
        // Convert phase to pulse position (0-1)
        const normalizedPhase = (phase + Math.PI) / (Math.PI * 2);
        const pulsePosition = (normalizedPhase * this.pulseSpeedFactor) % 1.0;
        
        // Pulse width modulated by amplitude
        const pulseWidth = this.pulseWidthFactor * Math.max(0.5, amplitude);
        
        // Extract link state metrics
        const harmony = Math.max(0, 1 - destructiveInterference);
        const synergy = Math.max(0, harmonicLevel);
        const corruption = Math.max(0, destructiveInterference);
        
        // Store for next frame
        this.activeLinkWaves.set(linkId, {
          amplitude,
          phase,
          pulsePosition,
          pulseWidth,
          lastUpdate: Date.now()
        });
        
        // Calculate network instability
        const instability = (nodeDynamicMetrics?.avgInstability ?? 0);
        
        // Call pulse intersection adapter with wave-derived position
        pulseIntersectionAdapter.updatePulsePosition(
          linkId,
          pulsePosition,
          {
            isActive: amplitude > this.minAmplitudeToFire,
            duration: 1.0,
            width: pulseWidth,
            harmony: harmony,
            synergy: synergy,
            corruption: corruption,
            instability: instability
          }
        );
      }
      
      // Clean up stale entries
      const now = Date.now();
      for (const [linkId, data] of this.activeLinkWaves) {
        if (now - data.lastUpdate > 1000) {
          this.activeLinkWaves.delete(linkId);
        }
      }
      
    } catch (err) {
      console.warn('[PulseWaveSystemBridge] update error:', err);
    }
  }

  /**
   * Setup console API for real-time tuning
   */
  setupConsoleAPI() {
    window.pulseWaveBridge = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Pulse Wave Bridge enabled');
      },
      disable: () => {
        this.enabled = false;
        console.log('✓ Pulse Wave Bridge disabled');
      },
      setDebugMode: (mode) => {
        this.debugMode = mode;
        console.log(`✓ Pulse Wave Bridge debug: ${mode ? 'ON' : 'OFF'}`);
      },
      setPulseWidth: (factor) => {
        this.pulseWidthFactor = Math.max(0.05, Math.min(0.3, factor));
        console.log(`✓ Pulse width set to ${factor.toFixed(2)}`);
      },
      setPulseSpeed: (factor) => {
        this.pulseSpeedFactor = Math.max(0.1, Math.min(1.0, factor));
        console.log(`✓ Pulse speed set to ${factor.toFixed(2)}`);
      },
      setMinAmplitude: (threshold) => {
        this.minAmplitudeToFire = Math.max(0, Math.min(1.0, threshold));
        console.log(`✓ Min amplitude set to ${threshold.toFixed(2)}`);
      },
      getStatus: () => {
        console.log(`
Pulse Wave Bridge Status:
  Enabled: ${this.enabled}
  Debug: ${this.debugMode}
  Pulse Width Factor: ${this.pulseWidthFactor.toFixed(2)}
  Pulse Speed Factor: ${this.pulseSpeedFactor.toFixed(2)}
  Min Amplitude: ${this.minAmplitudeToFire.toFixed(2)}
  Active Links: ${this.activeLinkWaves.size}
        `);
      },
      help: () => {
        console.log(`
Pulse Wave Bridge Console API:
  pulseWaveBridge.enable()              - Enable bridge
  pulseWaveBridge.disable()             - Disable bridge
  pulseWaveBridge.setDebugMode(bool)    - Toggle debug logging
  pulseWaveBridge.setPulseWidth(0-0.3)  - Adjust pulse width
  pulseWaveBridge.setPulseSpeed(0-1)    - Adjust pulse speed
  pulseWaveBridge.setMinAmplitude(0-1)  - Set amplitude threshold
  pulseWaveBridge.getStatus()           - Show current settings
  pulseWaveBridge.help()                - Show this help
        `);
      }
    };
  }
}

/**
 * Setup hook: Integrates bridge into main.js animate loop
 */
export function setupPulseWaveSystemBridgeIntegration(game) {
  try {
    const bridge = new PulseWaveSystemBridge_v1({
      enabled: true,
      debugMode: false,
      pulseWidthFactor: 0.12,
      pulseSpeedFactor: 0.8,
      minAmplitudeToFire: 0.15
    });
    
    game.pulseWaveSystemBridge = bridge;
    console.log('[main.js] PulseWaveSystemBridge initialized ✓');
    return bridge;
  } catch (err) {
    console.warn('[main.js] PulseWaveSystemBridge initialization error:', err);
    return null;
  }
}
