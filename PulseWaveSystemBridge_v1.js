/**
 * PulseWaveSystemBridge_v1.js
 * ============================================================================
 * Bridge: Wave Propagation → Pulse Position Updates
 * 
 * Converts wave field data from WaveInterferenceEngine into pulse positions
 * on links, triggering neural firing in PulseIntersectionImpulseAdapter.
 * 
 * ARCHITECTURE:
 * - WaveInterferenceEngine publishes burst snapshots
 * - Bridge reads active burst snapshot from engine
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
    this.world = config.world || null;
    this.waveEngine = config.waveEngine || this.world?.waveInterferenceEngine || null;
    
    // Configuration
    this.pulseWidthFactor = config.pulseWidthFactor ?? 0.12;      // How wide pulse appears
    this.pulseSpeedFactor = config.pulseSpeedFactor ?? 0.8;       // How fast it moves (0-1)
    this.minAmplitudeToFire = config.minAmplitudeToFire ?? 0.15;  // Threshold to trigger impulses
    
    // Active tracking
    this.activeLinkWaves = new Map();  // linkId → { phase, amplitude, ... }
    this._linkCursor = 0;
    this._timeBudgetMs = config.timeBudgetMs ?? 3.5;

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
      waveEngine = this.waveEngine,
      links = [],
      nodeDynamicMetrics,
      pulseIntersectionAdapter
    } = context;
    
    if (!waveEngine || !links || !pulseIntersectionAdapter) {
      return;
    }
    
    try {
      const snapshot = waveEngine?.getActiveSnapshot?.() || null;
      if (!snapshot?.timeline) {
        this.activeLinkWaves.clear();
        return;
      }

      const nowSec = performance.now() * 0.001;
      const startAt = Number(snapshot.timeline.startAt);
      const peakAt = Number(snapshot.timeline.peakAt);
      const endAt = Number(snapshot.timeline.endAt);
      if (!Number.isFinite(startAt) || !Number.isFinite(peakAt) || !Number.isFinite(endAt)) {
        return;
      }
      if (nowSec < startAt || nowSec > endAt) {
        this.activeLinkWaves.clear();
        return;
      }

      const riseDuration = Math.max(0.0001, peakAt - startAt);
      const decayDuration = Math.max(0.0001, endAt - peakAt);
      let envelope = 0;
      if (nowSec <= peakAt) envelope = Math.max(0, Math.min(1, (nowSec - startAt) / riseDuration));
      else envelope = Math.max(0, Math.min(1, 1 - ((nowSec - peakAt) / decayDuration)));

      const totalDuration = Math.max(0.0001, endAt - startAt);
      const phase01 = Math.max(0, Math.min(1, (nowSec - startAt) / totalDuration));
      const phase = phase01 * Math.PI * 2;
      const burstType = `${snapshot.type || ''}`.toLowerCase();
      const constructiveBase = burstType === 'corruption' ? envelope * 0.2 : burstType === 'synergy' ? envelope * 0.85 : envelope;
      const destructiveBase = burstType === 'corruption' ? envelope * 0.95 : burstType === 'synergy' ? envelope * 0.12 : envelope * 0.05;
      const amplitudeBase = envelope;

      const startTime = performance.now();
      const totalLinks = links.length;
      if (totalLinks === 0) return;
      this._linkCursor = this._linkCursor % totalLinks;
      let processed = 0;
      
      // Process each link for wave-driven pulse updates
      while (processed < totalLinks) {
        const idx = (this._linkCursor + processed) % totalLinks;
        const link = links[idx];
        if (!link) {
          processed += 1;
          continue;
        }
        
        const linkId = link.id || link.uuid || link.name;
        if (!linkId) {
          processed += 1;
          continue;
        }
        
        let radialAttenuation = 1.0;
        const center = snapshot?.spatial?.center || null;
        const radius = Number(snapshot?.spatial?.scope?.radius || 0);
        const src = link?.source || link?.sourceNode || null;
        const dst = link?.target || link?.targetNode || null;
        if (center && radius > 0 && src?.position && dst?.position) {
          const mx = (src.position.x + dst.position.x) * 0.5;
          const my = (src.position.y + dst.position.y) * 0.5;
          const mz = (src.position.z + dst.position.z) * 0.5;
          const dx = mx - center.x;
          const dy = my - center.y;
          const dz = mz - center.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          radialAttenuation = Math.max(0, Math.min(1, 1 - (distance / radius)));
        }

        const amplitude = Math.max(0, Math.min(1, amplitudeBase * radialAttenuation));
        const harmonicLevel = Math.max(0, Math.min(1, constructiveBase * radialAttenuation));
        const destructiveInterference = Math.max(0, Math.min(1, destructiveBase * radialAttenuation));
        
        // Skip low-amplitude waves
        if (amplitude < this.minAmplitudeToFire) {
          this.activeLinkWaves.delete(linkId);
          processed += 1;
          continue;
        }
        
        // Convert phase to pulse position (0-1)
        const normalizedPhase = phase01;
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
        
        processed += 1;
        if (performance.now() - startTime > this._timeBudgetMs) {
          this._linkCursor = (idx + 1) % totalLinks;
          return;
        }
      }
      
      this._linkCursor = (this._linkCursor + processed) % totalLinks;
      
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
      world: game,
      waveEngine: game.waveInterferenceEngine || null,
      eventBus: game.semanticBus || null,
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
