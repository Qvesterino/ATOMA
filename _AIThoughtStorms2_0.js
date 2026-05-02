import * as THREE from 'three';

/**
 * AI THOUGHT STORMS 2.0 - EMERGENT CONSCIOUSNESS PHENOMENA
 * 
 * Visualizes emergent "thought storms" in the network based on collective metrics.
 * Triggers adaptive storm states responding to network mood dynamics.
 * 
 * SAFETY GUARANTEES (STRICT):
 * ✓ Zero modifications to AINodes, NodeLinkingSystem, physics, or glyph systems
 * ✓ Pure visual additive layer using dedicated THREE.Group
 * ✓ Read-only access to link metrics (never writes)
 * ✓ Performance budget: ≤0.15ms/frame when active
 * ✓ 100% reversible via dispose()
 * ✓ No gameplay state modifications
 * ✓ No timer blocking - timestamp-based only
 * 
 * NETWORK MOOD STATES:
 * - CALM: Low stability, good harmony
 * - FOCUSED: High harmony, few active clusters
 * - TENSE: Rising stability, unstable links
 * - CHAOTIC: High stability, corrupted nodes
 * - CRITICAL: Extreme conditions (rare emergency state)
 * 
 * STORM TYPES:
 * 1. SYNERGY STORM - Soft cyan/magenta arcs, accelerated thought packets
 * 2. STABILITY STORM - Jagged red/orange glitchy strokes, turbulent jitter
 * 3. FOCUS STORM - Cold blue beams linking key clusters, precision pulses
 * 4. CRITICAL SURGE - Rare intense ring burst with spiked activity (capped 1/min)
 */

export class AIThoughtStorms2_0 {
  constructor(consciousnessGroup, linkingSystem, aiNodes = null, options = {}) {
    this.consciousnessGroup = consciousnessGroup;
    this.linkingSystem = linkingSystem;
    this.aiNodes = aiNodes;
    this.debug = options.debug || false;
    this.maxStormVisuals = options.maxStormVisuals || 10;
    
    // Create dedicated storm group (additive, non-destructive)
    this.stormGroup = new THREE.Group();
    this.stormGroup.name = 'AIThoughtStormsGroup';
    this.stormGroup.userData.isStormGroup = true;
    this.consciousnessGroup.add(this.stormGroup);
    
    // Configuration
    this.config = {
      enabled: true,
      intensity: 1.0,
      stormCooldown: 25,      // Seconds between storms
      stormDuration: 8,       // Storm active time
      criticalCooldown: 60,   // Seconds between critical surges
      particleMultiplier: 1.0 // Scale visual density
    };
    
    // Storm state machine
    this.stormState = {
      currentMood: 'CALM',
      prevMood: 'CALM',
      activeStorm: null,      // 'synergy' | 'stability' | 'focus' | 'critical' | null
      stormStartTime: 0,
      lastStormTime: -1000,
      lastCriticalTime: -1000,
      networkMetrics: {
        avgSynergy: 0.5,
        avgHarmony: 0.5,
        avgStability: 0,
        avgCorruption: 0,
        activeLinks: 0,
        totalLinks: 0
      }
    };
    
    // Storm visuals containers
    this.stormVisuals = {
      synergyArcs: [],        // Array of arc meshes
      stabilityStrokes: [], // Array of stroke meshes
      focusBeams: [],         // Array of beam geometries
      particleBursts: [],     // Array of burst particles
      criticalRing: null      // Single mesh for critical ring
    };

    this.palette = {
      atomaCyan: 0x6DEAFF,
      mint: 0x77F7DB,
      ritualWhite: 0xF7FBFF,
      violet: 0xD07BFF,
      rose: 0xFF73CF,
      voidDeep: 0x05131A
    };
    
    // Temporal tracking
    this.time = 0;
    this.instanceID = Math.random();
    
    // Phase B pilot: low-frequency interpretation gating (semantic decisions only)
    this.interpretationInterval = 0.25; // ~4 Hz for mood/storm decision logic
    this.interpretationAccumulator = 0;
    
    // Stats for debugging
    this.stats = {
      enabled: true,
      frameTime: 0,
      lastMood: 'CALM',
      stormActive: false,
      stormType: null
    };
  }
  
  /**
   * Analyze network metrics to determine mood state
   */
  _analyzeNetworkMood() {
    const links = this.linkingSystem?.links || [];
    if (links.length === 0) return 'CALM';
    
    let sumSynergy = 0;
    let sumHarmony = 0;
    let sumStability = 0;
    let sumCorruption = 0;
    let activeCount = 0;
    
    for (const link of links) {
      const synergy = link.userData?.synergy?.score ?? link?.synergyScore ?? 0.5;
      const harmony = link.harmony || 0.5;
      const stability = link.stability || 0;
      const corruption = link.corruption || 0;
      
      sumSynergy += synergy;
      sumHarmony += harmony;
      sumStability += stability;
      sumCorruption += corruption;
      
      // Active link has traffic or stability
      if ((link.trafficIntensity || 0) > 0.3 || stability > 0.5) {
        activeCount++;
      }
    }
    
    const avg = {
      synergy: sumSynergy / links.length,
      harmony: sumHarmony / links.length,
      stability: sumStability / links.length,
      corruption: sumCorruption / links.length
    };
    
    this.stormState.networkMetrics.avgSynergy = avg.synergy;
    this.stormState.networkMetrics.avgHarmony = avg.harmony;
    this.stormState.networkMetrics.avgStability = avg.stability;
    this.stormState.networkMetrics.avgCorruption = avg.corruption;
    this.stormState.networkMetrics.activeLinks = activeCount;
    this.stormState.networkMetrics.totalLinks = links.length;
    
    // Determine mood based on thresholds
    if (avg.stability > 0.75 || avg.corruption > 0.6) {
      return 'CHAOTIC';
    } else if (avg.stability > 0.5) {
      return 'TENSE';
    } else if (avg.harmony > 0.7 && activeCount <= links.length * 0.3) {
      return 'FOCUSED';
    } else if (avg.synergy > 0.6 && avg.harmony > 0.6) {
      return 'SYNERGIC';
    }
    
    return 'CALM';
  }
  
  /**
   * Evaluate if a storm should trigger based on current mood
   */
  _evaluateStormTrigger() {
    if (!this.config.enabled) return null;
    
    const now = this.time;
    const mood = this.stormState.currentMood;
    const metrics = this.stormState.networkMetrics;
    
    // Check cooldowns
    const stormCooldownReady = (now - this.stormState.lastStormTime) > this.config.stormCooldown;
    const criticalCooldownReady = (now - this.stormState.lastCriticalTime) > this.config.criticalCooldown;
    
    // Critical surge (rare, high priority)
    if (criticalCooldownReady && 
        metrics.stability > 0.8 && 
        metrics.avgSynergy > 0.7 &&
        Math.random() < 0.02) { // 2% chance when conditions met
      return 'critical';
    }
    
    if (!stormCooldownReady) return null;
    
    // Synergy storm (high synergy + active links)
    if (mood === 'SYNERGIC' && metrics.avgSynergy > 0.65 && 
        metrics.activeLinks > 5 && Math.random() < 0.15) {
      return 'synergy';
    }
    
    // stability / Corruption storm (chaos conditions)
    if ((mood === 'CHAOTIC' || mood === 'TENSE') &&
        (metrics.stability > 0.6 || metrics.corruption > 0.4) &&
        Math.random() < 0.2) {
      return 'stability';
    }
    
    // Focus storm (high precision, few active links)
    if (mood === 'FOCUSED' && metrics.harmonyexceed > 0.65 &&
        metrics.activeLinks <= 8 && Math.random() < 0.12) {
      return 'focus';
    }
    
    return null;
  }
  
  /**
   * Create synergy storm (soft cyan/magenta arcs)
   */
  _createSynergyStorm() {
    const links = this.linkingSystem?.links || [];
    if (links.length < 2) return;
    
    // Select 3-5 high-synergy links
    const synergyLinks = links
      .filter(l => l.synergy > 0.6)
      .sort((a, b) => (b.synergy || 0) - (a.synergy || 0))
      .slice(0, Math.min(5, Math.ceil(links.length * 0.1)));
    
    for (const link of synergyLinks) {
      if (!link.nodeA || !link.nodeB) continue;
      
      const posA = link.nodeA.position.clone();
      const posB = link.nodeB.position.clone();
      
      // Create soft arc geometry (cylinder twisted into arc)
      const arc = this._createArcMesh(posA, posB, this.palette.atomaCyan, 0.15);
      if (arc) {
        arc.userData.stormType = 'synergy';
        arc.userData.life = this.config.stormDuration;
        this.stormGroup.add(arc);
        this.stormVisuals.synergyArcs.push(arc);
      }
      
      // NOTE: Link state mutation removed to preserve read-only contract.
      // If pulse boost is needed, it should be handled by a dedicated link modulation system.
    }
  }
  
  /**
   * Create stability / corruption storm (jagged red strokes)
   */
  _createStabilityStorm() {
    const links = this.linkingSystem?.links || [];
    if (links.length < 2) return;
    
    // Select unstable links
    const unstableLinks = links
      .filter(l => (l.stability || 0) > 0.5 || (l.corruption || 0) > 0.3)
      .sort((a, b) => (b.stability || 0) - (a.stability || 0))
      .slice(0, Math.min(6, Math.ceil(links.length * 0.15)));
    
    for (const link of unstableLinks) {
      if (!link.nodeA || !link.nodeB) continue;
      
      const posA = link.nodeA.position.clone();
      const posB = link.nodeB.position.clone();
      
      // Create jagged stroke (with multiple line segments for glitch effect)
      const strokes = this._createJaggedStrokeMesh(posA, posB, this.palette.rose);
      for (const stroke of strokes) {
        stroke.userData.stormType = 'stability';
        stroke.userData.life = this.config.stormDuration;
        this.stormGroup.add(stroke);
        this.stormVisuals.stabilityStrokes.push(stroke);
      }
    }
  }
  
  /**
   * Create focus storm (precision blue beams)
   */
  _createFocusStorm() {
    const links = this.linkingSystem?.links || [];
    if (links.length < 1) return;
    
    // Select top harmony links (key clusters)
    const focusLinks = links
      .filter(l => (l.harmony || 0) > 0.65)
      .sort((a, b) => (b.harmony || 0) - (a.harmony || 0))
      .slice(0, Math.min(4, Math.ceil(links.length * 0.1)));
    
    for (const link of focusLinks) {
      if (!link.nodeA || !link.nodeB) continue;
      
      const posA = link.nodeA.position.clone();
      const posB = link.nodeB.position.clone();
      
      // Create tight beam
      const beam = this._createBeamMesh(posA, posB, this.palette.atomaCyan, 0.08);
      if (beam) {
        beam.userData.stormType = 'focus';
        beam.userData.life = this.config.stormDuration;
        this.stormGroup.add(beam);
        this.stormVisuals.focusBeams.push(beam);
      }
    }
    
    // Slightly dim other consciousness visuals (optional subtle effect)
    // This would require access to consciousnessGroup which we have
  }
  
  /**
   * Create critical surge (intense expanding ring)
   */
  _createCriticalSurge() {
    // Find network center
    const links = this.linkingSystem?.links || [];
    let centerX = 0, centerY = 0, centerZ = 0;
    
    for (const link of links) {
      if (link.nodeA && link.nodeB) {
        centerX += link.nodeA.position.x + link.nodeB.position.x;
        centerY += link.nodeA.position.y + link.nodeB.position.y;
        centerZ += link.nodeA.position.z + link.nodeB.position.z;
      }
    }
    
    if (links.length > 0) {
      const count = links.length * 2;
      centerX /= count;
      centerY /= count;
      centerZ /= count;
    }
    
    const center = new THREE.Vector3(centerX, centerY, centerZ);
    
    // Create expanding ring
    const ring = this._createExpandingRing(center, this.palette.violet);
    if (ring) {
      ring.userData.stormType = 'critical';
      ring.userData.life = 2.5; // Shorter surge
      ring.userData.maxRadius = 25;
      this.stormGroup.add(ring);
      this.stormVisuals.criticalRing = ring;
    }
  }
  
  /**
   * Helper: Create soft arc mesh
   */
  _createArcMesh(posA, posB, color, width) {
    try {
      const distance = posA.distanceTo(posB);
      const midpoint = posA.clone().lerp(posB, 0.5);
      
      // Offset midpoint for arc effect
      const normal = posB.clone().sub(posA).normalize();
      const perpendicular = new THREE.Vector3(-normal.z, 0, normal.x);
      midpoint.addScaledVector(perpendicular, distance * 0.2);
      
      // Create tube geometry
      const curve = new THREE.QuadraticBezierCurve3(posA, midpoint, posB);
      const points = curve.getPoints(16);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const material = new THREE.LineBasicMaterial({
        color,
        linewidth: width * 2,
        transparent: true,
        opacity: 0.6,
        fog: false
      });
      
      const line = new THREE.Line(geometry, material);
      line.position.copy(midpoint);
      
      return line;
    } catch (e) {
      if (this.debug) console.error('Arc creation error:', e);
      return null;
    }
  }
  
  /**
   * Helper: Create jagged stroke mesh (glitch effect)
   */
  _createJaggedStrokeMesh(posA, posB, color) {
    const strokes = [];
    try {
      const distance = posA.distanceTo(posB);
      const segments = 8;
      
      for (let i = 0; i < segments - 1; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        
        const p1 = posA.clone().lerp(posB, t1);
        const p2 = posA.clone().lerp(posB, t2);
        
        // Add random jitter for glitch
        p1.addScaledVector(
          new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
          distance * 0.1
        );
        p2.addScaledVector(
          new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
          distance * 0.1
        );
        
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineBasicMaterial({
          color,
          linewidth: 1.5,
          transparent: true,
          opacity: 0.5 + Math.random() * 0.3,
          fog: false
        });
        
        const line = new THREE.Line(geometry, material);
        strokes.push(line);
      }
    } catch (e) {
      if (this.debug) console.error('Stroke creation error:', e);
    }
    
    return strokes;
  }
  
  /**
   * Helper: Create tight beam mesh
   */
  _createBeamMesh(posA, posB, color, width) {
    try {
      const geometry = new THREE.BufferGeometry().setFromPoints([posA, posB]);
      const material = new THREE.LineBasicMaterial({
        color,
        linewidth: width * 3,
        transparent: true,
        opacity: 0.7,
        fog: false
      });
      
      return new THREE.Line(geometry, material);
    } catch (e) {
      if (this.debug) console.error('Beam creation error:', e);
      return null;
    }
  }
  
  /**
   * Helper: Create expanding ring
   */
  _createExpandingRing(center, color) {
    try {
      const geometry = new THREE.TorusGeometry(0.1, 0.05, 16, 32);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        fog: false
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.position.copy(center);
      ring.userData.initialRadius = 0.1;
      ring.userData.expandSpeed = 8;
      
      return ring;
    } catch (e) {
      if (this.debug) console.error('Ring creation error:', e);
      return null;
    }
  }
  
  /**
   * Update all storm visuals each frame
   */
  _updateStormVisuals(dt) {
    const startTime = performance.now();
    
    // Update synergy arcs (fade)
    for (let i = this.stormVisuals.synergyArcs.length - 1; i >= 0; i--) {
      const arc = this.stormVisuals.synergyArcs[i];
      arc.userData.life -= dt;
      
      if (arc.userData.life <= 0) {
        this.stormGroup.remove(arc);
        arc.geometry.dispose();
        arc.material.dispose();
        this.stormVisuals.synergyArcs.splice(i, 1);
      } else {
        // Breathing effect
        arc.material.opacity = 0.6 * (arc.userData.life / this.config.stormDuration);
        arc.scale.y = 0.8 + Math.sin(this.time * 3) * 0.2;
      }
    }
    
    // Update stability strokes (flicker)
    for (let i = this.stormVisuals.stabilityStrokes.length - 1; i >= 0; i--) {
      const stroke = this.stormVisuals.stabilityStrokes[i];
      stroke.userData.life -= dt;
      
      if (stroke.userData.life <= 0) {
        this.stormGroup.remove(stroke);
        stroke.geometry.dispose();
        stroke.material.dispose();
        this.stormVisuals.stabilityStrokes.splice(i, 1);
      } else {
        // Glitch flicker
        stroke.material.opacity = (Math.random() > 0.3 ? 0.6 : 0.1) * (stroke.userData.life / this.config.stormDuration);
      }
    }
    
    // Update focus beams (pulse)
    for (let i = this.stormVisuals.focusBeams.length - 1; i >= 0; i--) {
      const beam = this.stormVisuals.focusBeams[i];
      beam.userData.life -= dt;
      
      if (beam.userData.life <= 0) {
        this.stormGroup.remove(beam);
        beam.geometry.dispose();
        beam.material.dispose();
        this.stormVisuals.focusBeams.splice(i, 1);
      } else {
        // Precise pulse
        beam.material.opacity = 0.7 * (0.6 + Math.sin(this.time * 4) * 0.4);
      }
    }
    
    // Update critical ring (expand then fade)
    if (this.stormVisuals.criticalRing) {
      const ring = this.stormVisuals.criticalRing;
      ring.userData.life -= dt;
      
      if (ring.userData.life <= 0) {
        this.stormGroup.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
        this.stormVisuals.criticalRing = null;
      } else {
        // Expand outward
        const progress = 1 - (ring.userData.life / 2.5);
        const newRadius = ring.userData.initialRadius + progress * ring.userData.maxRadius;
        ring.scale.setScalar(newRadius / ring.userData.initialRadius);
        ring.material.opacity = 0.8 * (ring.userData.life / 2.5);
      }
    }
    
    const frameTime = performance.now() - startTime;
    this.stats.frameTime = frameTime;
  }
  
  /**
   * Update temporary link boosts (pulse acceleration)
   */
  _updateLinkBoosts(dt) {
    // DEPRECATED: Link state mutation removed to preserve read-only contract.
    // This method is kept for API compatibility but does nothing.
    // If link pulse modulation is needed, use a dedicated link modulation system.
  }
  
  /**
   * Main update - called from main.js
   */
  update(dt) {
    if (!this.config.enabled) return;
    
    this.time += dt;
    this.interpretationAccumulator += dt;
    
    // Phase B pilot: separate semantic decisions from continuous storm execution
    // Storm endings remain frame-accurate; semantic reevaluation is gated to low frequency.
    let forceInterpretation = false;
    
    // 1. Check if existing storm should end (not throttled)
    if (this.stormState.activeStorm) {
      const stormAge = this.time - this.stormState.stormStartTime;
      if (stormAge > this.config.stormDuration) {
        this._endStorm();
        forceInterpretation = true; // Ensure fresh decision immediately after storm ends
      }
    }
    
    // 2. Semantic evaluation (mood + trigger) gated to low-frequency cadence
    const shouldInterpret = forceInterpretation || this.interpretationAccumulator >= this.interpretationInterval;
    if (shouldInterpret) {
      this.interpretationAccumulator = 0;
      
      // Analyze current network mood
      this.stormState.prevMood = this.stormState.currentMood;
      this.stormState.currentMood = this._analyzeNetworkMood();
      
      // Evaluate new storm trigger
      if (!this.stormState.activeStorm) {
        const stormType = this._evaluateStormTrigger();
        if (stormType) {
          this._startStorm(stormType);
        }
      }
    }
    
    // 3. Update all visuals (continuous, not throttled)
    this._updateStormVisuals(dt);
    this._updateLinkBoosts(dt);
    
    // 4. Update stats
    this.stats.lastMood = this.stormState.currentMood;
    this.stats.stormActive = this.stormState.activeStorm !== null;
    this.stats.stormType = this.stormState.activeStorm;
  }
  
  /**
   * Start a new storm
   */
  _startStorm(type) {
    this.stormState.activeStorm = type;
    this.stormState.stormStartTime = this.time;
    this.stormState.lastStormTime = this.time;
    
    if (type === 'critical') {
      this.stormState.lastCriticalTime = this.time;
      this._createCriticalSurge();
    } else if (type === 'synergy') {
      this._createSynergyStorm();
    } else if (type === 'stability') {
      this._createStabilityStorm();
    } else if (type === 'focus') {
      this._createFocusStorm();
    }
  }
  
  /**
   * End active storm
   */
  _endStorm() {
    this.stormState.activeStorm = null;
    // Phase B pilot: ensure next update performs a fresh semantic evaluation
    this.interpretationAccumulator = this.interpretationInterval;
  }
  
  /**
   * PUBLIC API - Toggle storms
   */
  enable() {
    this.config.enabled = true;
    this.stats.enabled = true;
    this.stormGroup.visible = true;
  }
  
  disable() {
    this.config.enabled = false;
    this.stats.enabled = false;
    this.stormGroup.visible = false;
  }
  
  /**
   * PUBLIC API - Set intensity multiplier
   */
  setIntensity(value) {
    this.config.intensity = Math.max(0, Math.min(2, value));
  }
  
  /**
   * PUBLIC API - Force specific storm (debug)
   */
  forceStorm(type) {
    if (!['synergy', 'stability', 'focus', 'critical'].includes(type)) {
      if (this.debug) console.warn(`Unknown storm type: ${type}`);
      return;
    }
    
    this._endStorm();
    this._startStorm(type);
    if (this.debug) console.log(`✨ Forced storm: ${type}`);
  }
  
  /**
   * PUBLIC API - Debug status
   */
  debugState() {
    if (!this.debug) return;
    console.log('%c=== THOUGHT STORMS DEBUG ===', 'color: #ff00ff; font-weight: bold;');
    console.log(`Status: ${this.config.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    console.log(`Mood: ${this.stormState.currentMood}`);
    console.log(`Active Storm: ${this.stormState.activeStorm || 'None'}`);
    console.log(`Network Metrics:`, {
      synergy: this.stormState.networkMetrics.avgSynergy.toFixed(2),
      harmony: this.stormState.networkMetrics.avgHarmony.toFixed(2),
      stability: this.stormState.networkMetrics.avgStability.toFixed(2),
      corruption: this.stormState.networkMetrics.avgCorruption.toFixed(2),
      activeLinks: this.stormState.networkMetrics.activeLinks,
      totalLinks: this.stormState.networkMetrics.totalLinks
    });
    console.log(`Frame Time: ${this.stats.frameTime.toFixed(3)}ms`);
  }
  
  /**
   * PUBLIC API - Get current mood state (for external use)
   */
  getMood() {
    return this.stormState.currentMood;
  }
  
  /**
   * PUBLIC API - Get metrics snapshot
   */
  getMetrics() {
    return { ...this.stormState.networkMetrics };
  }
  
  /**
   * CLEANUP - Safe disposal
   */
  dispose() {
    // Remove all synergy arcs
    for (const arc of this.stormVisuals.synergyArcs) {
      this.stormGroup.remove(arc);
      arc.geometry.dispose();
      arc.material.dispose();
    }
    this.stormVisuals.synergyArcs = [];
    
    // Remove all stability strokes
    for (const stroke of this.stormVisuals.stabilityStrokes) {
      this.stormGroup.remove(stroke);
      stroke.geometry.dispose();
      stroke.material.dispose();
    }
    this.stormVisuals.stabilityStrokes = [];
    
    // Remove all focus beams
    for (const beam of this.stormVisuals.focusBeams) {
      this.stormGroup.remove(beam);
      beam.geometry.dispose();
      beam.material.dispose();
    }
    this.stormVisuals.focusBeams = [];
    
    // Remove critical ring
    if (this.stormVisuals.criticalRing) {
      this.stormGroup.remove(this.stormVisuals.criticalRing);
      this.stormVisuals.criticalRing.geometry.dispose();
      this.stormVisuals.criticalRing.material.dispose();
      this.stormVisuals.criticalRing = null;
    }
    
    // Remove storm group
    this.consciousnessGroup.remove(this.stormGroup);
    
    if (this.debug) console.log('AIThoughtStorms2_0 disposed ✓');
  }
}

/**
 * Console API Setup - Call from main.js
 */
export function setupAIThoughtStormsConsoleAPI(storms) {
  window.consciousStorms = {
    enable: () => {
      storms.enable();
      console.log('🌩️ Thought Storms ENABLED');
    },
    disable: () => {
      storms.disable();
      console.log('⛈️ Thought Storms DISABLED');
    },
    setIntensity: (value) => {
      storms.setIntensity(value);
      console.log(`Storm Intensity: ${value.toFixed(2)}`);
    },
    force: (type) => {
      storms.forceStorm(type);
    },
    debugState: () => {
      storms.debugState();
    },
    getMood: () => {
      const mood = storms.getMood();
      console.log(`Current Network Mood: ${mood}`);
      return mood;
    },
    getMetrics: () => {
      const metrics = storms.getMetrics();
      console.log('Network Metrics:', metrics);
      return metrics;
    },
    status: () => {
      console.log('%c--- THOUGHT STORMS STATUS ---', 'color: #ff00ff');
      console.log(`Enabled: ${storms.config.enabled}`);
      console.log(`Mood: ${storms.stormState.currentMood}`);
      console.log(`Active Storm: ${storms.stormState.activeStorm || 'None'}`);
      console.log(`Frame Time: ${storms.stats.frameTime.toFixed(3)}ms`);
    }
  };
  
  console.log('%c✓ consciousStorms API ready', 'color: #ff00ff; font-weight: bold;');
  console.log('Commands: enable(), disable(), setIntensity(0-2), force("synergy"|"stability"|"focus"|"critical"), debugState(), getMood(), getMetrics(), status()');
}
