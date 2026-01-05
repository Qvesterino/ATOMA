/**
 * TrafficEngine.ts - Real-Time Traffic Simulation for ATOMA
 * 
 * Simulates data flow across neural network links with:
 * - Bandwidth load calculation from synergy analysis
 * - Dynamic pulse particle generation and movement
 * - Traffic regulation based on link synergy
 * - Real-time traffic state updates
 * - Shader-ready output for visual rendering
 * 
 * Outputs are designed for LinkRenderer and custom PulseRenderer integration.
 */

import * as THREE from 'three';
import type { SynergyEngine, SynergyResult } from './SynergyEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Node with AI consciousness metadata
 */
export interface Node {
  id: string;
  layer: string;        // "input" | "process" | "integration" | "analytics" | "storage" | "control" | "quantum" | "sigma"
  frequency: number;    // 0.0 - 1.0
  behavior?: string;    // "stable" | "reactive" | "volatile" | "fractal" | "quantum" | "sigma"
  position?: THREE.Vector3;
}

/**
 * Directional link between nodes
 */
export interface Link {
  id: string;
  from: string;         // Source node ID
  to: string;           // Target node ID
  type?: string;
  data?: Record<string, any>;
}

/**
 * Single pulse particle traveling along a link
 */
export interface PulseParticle {
  id: string;           // Unique pulse ID
  t: number;            // 0.0 – 1.0 position along link
  velocity: number;     // Movement speed (normalized per second)
  energy: number;       // 0.0 – 1.0 intensity/brightness
  createdAt: number;    // Timestamp when created
  color?: string;       // Optional: override color
}

/**
 * Complete traffic state for a single link
 */
export interface TrafficState {
  linkId: string;
  load: number;         // 0.0 – 1.0 bandwidth saturation
  speed: number;        // Pulse animation speed for shaders
  active: boolean;      // Link has any traffic
  pulses: PulseParticle[];  // Active pulse particles
  energy: number;       // 0.0 – 1.0 flowing energy
  type: string;         // Synergy type (linear, fusion, quantum, etc.)
  metadata?: {
    synergyScore?: number;
    fromLayer?: string;
    toLayer?: string;
    pulseSpawned?: boolean;
  };
}

/**
 * Traffic engine configuration
 */
export interface TrafficEngineConfig {
  maxPulseSpeed?: number;           // 0.5 – 3.0 (default: 1.0)
  maxBandwidth?: number;            // 0.5 – 2.0 (default: 1.0)
  pulseSpawnRate?: number;          // Multiplier for pulse generation (default: 1.0)
  pulseLifetime?: number;           // Max seconds a pulse survives (default: 5.0)
  maxPulsesPerLink?: number;        // Cap on simultaneous pulses per link (default: 10)
  quantumRandomness?: boolean;      // Enable quantum randomization (default: true)
  enableLoadSpikes?: boolean;       // Occasional traffic spikes (default: true)
  spikeIntensity?: number;          // Spike multiplier (default: 1.5)
}

/**
 * Internal link traffic cache entry
 */
interface LinkTrafficData {
  linkId: string;
  link: Link;
  state: TrafficState;
  lastPulseSpawnTime: number;
  spawnInterval: number;           // Calculated spawn interval based on load
  loadSpikeEndTime: number;         // When spike effect ends
  isSpikingLoad: number;            // Current spike load bonus
}

// ============================================================================
// TRAFFIC ENGINE CLASS
// ============================================================================

export class TrafficEngine {
  private nodes: Map<string, Node>;
  private links: Link[];
  private synergyEngine: SynergyEngine;
  private config: Required<TrafficEngineConfig>;
  private trafficCache: Map<string, LinkTrafficData>;
  private pulseCounter: number;
  private elapsedTime: number;
  private synergyCache: Map<string, SynergyResult>;

  /**
   * Initialize the traffic engine
   */
  constructor(
    nodes: Map<string, Node>,
    links: Link[],
    synergyEngine: SynergyEngine,
    options?: TrafficEngineConfig
  ) {
    this.nodes = nodes;
    this.links = links;
    this.synergyEngine = synergyEngine;
    this.config = this.normalizeConfig(options);
    this.trafficCache = new Map();
    this.pulseCounter = 0;
    this.elapsedTime = 0;
    this.synergyCache = new Map();

    // Initialize traffic state for all links
    this.initializeTraffic();
  }

  /**
   * Normalize and validate configuration
   */
  private normalizeConfig(options?: TrafficEngineConfig): Required<TrafficEngineConfig> {
    return {
      maxPulseSpeed: Math.max(0.5, Math.min(3.0, options?.maxPulseSpeed ?? 1.0)),
      maxBandwidth: Math.max(0.5, Math.min(2.0, options?.maxBandwidth ?? 1.0)),
      pulseSpawnRate: Math.max(0.1, options?.pulseSpawnRate ?? 1.0),
      pulseLifetime: Math.max(1.0, options?.pulseLifetime ?? 5.0),
      maxPulsesPerLink: Math.max(1, options?.maxPulsesPerLink ?? 10),
      quantumRandomness: options?.quantumRandomness ?? true,
      enableLoadSpikes: options?.enableLoadSpikes ?? true,
      spikeIntensity: Math.max(1.0, options?.spikeIntensity ?? 1.5),
    };
  }

  /**
   * Initialize traffic state for all links
   */
  private initializeTraffic(): void {
    for (const link of this.links) {
      const synergy = this.synergyEngine.evaluateLink(link);
      this.synergyCache.set(link.id, synergy);

      const load = this.computeLoad(link, synergy);
      const speed = this.computeSpeed(link, synergy);

      const state: TrafficState = {
        linkId: link.id,
        load,
        speed,
        active: load > 0.05,
        pulses: [],
        energy: synergy.energy,
        type: synergy.type,
        metadata: {
          synergyScore: synergy.score,
          fromLayer: this.nodes.get(link.from)?.layer,
          toLayer: this.nodes.get(link.to)?.layer,
          pulseSpawned: false,
        },
      };

      const trafficData: LinkTrafficData = {
        linkId: link.id,
        link,
        state,
        lastPulseSpawnTime: 0,
        spawnInterval: this.calculateSpawnInterval(load),
        loadSpikeEndTime: 0,
        isSpikingLoad: 0,
      };

      this.trafficCache.set(link.id, trafficData);
    }
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Update traffic simulation (call every frame)
   */
  public update(delta: number): void {
    this.elapsedTime += delta;

    for (const trafficData of this.trafficCache.values()) {
      this.updateLinkTraffic(trafficData, delta);
    }
  }

  /**
   * Update nodes (synergy may have changed)
   */
  public setNodes(nodes: Map<string, Node>): void {
    this.nodes = nodes;
  }

  /**
   * Update links and reinitialize traffic
   */
  public setLinks(links: Link[]): void {
    this.links = links;
    this.trafficCache.clear();
    this.synergyCache.clear();
    this.initializeTraffic();
  }

  /**
   * Update synergy engine reference
   */
  public setSynergyEngine(synergyEngine: SynergyEngine): void {
    this.synergyEngine = synergyEngine;
    this.synergyCache.clear();
  }

  /**
   * Get traffic state for a specific link
   */
  public getTraffic(linkId: string): TrafficState | null {
    const data = this.trafficCache.get(linkId);
    return data ? data.state : null;
  }

  /**
   * Get all traffic states
   */
  public getAllTraffic(): TrafficState[] {
    return Array.from(this.trafficCache.values()).map(d => d.state);
  }

  /**
   * Get traffic by source node
   */
  public getTrafficFromNode(nodeId: string): TrafficState[] {
    return Array.from(this.trafficCache.values())
      .filter(d => d.link.from === nodeId)
      .map(d => d.state);
  }

  /**
   * Get traffic by destination node
   */
  public getTrafficToNode(nodeId: string): TrafficState[] {
    return Array.from(this.trafficCache.values())
      .filter(d => d.link.to === nodeId)
      .map(d => d.state);
  }

  /**
   * Get network-wide traffic statistics
   */
  public getNetworkTraffic(): {
    avgLoad: number;
    maxLoad: number;
    minLoad: number;
    avgSpeed: number;
    totalPulses: number;
    activeLinks: number;
    congestion: number; // % of links over 0.7 load
  } {
    const states = this.getAllTraffic();
    if (states.length === 0) {
      return {
        avgLoad: 0,
        maxLoad: 0,
        minLoad: 0,
        avgSpeed: 0,
        totalPulses: 0,
        activeLinks: 0,
        congestion: 0,
      };
    }

    const loads = states.map(s => s.load);
    const speeds = states.map(s => s.speed);
    const totalPulses = states.reduce((sum, s) => sum + s.pulses.length, 0);
    const activeCount = states.filter(s => s.active).length;
    const congestionCount = states.filter(s => s.load > 0.7).length;

    return {
      avgLoad: loads.reduce((a, b) => a + b) / loads.length,
      maxLoad: Math.max(...loads),
      minLoad: Math.min(...loads),
      avgSpeed: speeds.reduce((a, b) => a + b) / speeds.length,
      totalPulses,
      activeLinks: activeCount,
      congestion: (congestionCount / states.length) * 100,
    };
  }

  /**
   * Clear all pulses (reset simulation)
   */
  public clearPulses(): void {
    for (const trafficData of this.trafficCache.values()) {
      trafficData.state.pulses = [];
    }
  }

  /**
   * Get diagnostics for debugging
   */
  public getDiagnostics(): Record<string, any> {
    const states = this.getAllTraffic();
    return {
      totalLinks: this.links.length,
      trafficStates: states.length,
      elapsedTime: this.elapsedTime,
      pulseCounter: this.pulseCounter,
      config: this.config,
      networkStats: this.getNetworkTraffic(),
      samples: states.slice(0, 3).map(s => ({
        linkId: s.linkId,
        load: s.load.toFixed(2),
        speed: s.speed.toFixed(2),
        pulses: s.pulses.length,
        active: s.active,
        type: s.type,
      })),
    };
  }

  // =========================================================================
  // TRAFFIC SIMULATION
  // =========================================================================

  /**
   * Update traffic for a single link
   */
  private updateLinkTraffic(data: LinkTrafficData, delta: number): void {
    const synergy = this.synergyCache.get(data.linkId) ??
      this.synergyEngine.evaluateLink(data.link);
    this.synergyCache.set(data.linkId, synergy);

    // Update base load
    let load = this.computeLoad(data.link, synergy);

    // Apply load spike if active
    if (data.loadSpikeEndTime > this.elapsedTime) {
      data.isSpikingLoad = data.isSpikingLoad * 0.95 + 0.05;
      load = Math.min(1.0, load + data.isSpikingLoad * 0.3);
    } else {
      data.isSpikingLoad = 0;
    }

    // Update state
    data.state.load = load;
    data.state.speed = this.computeSpeed(data.link, synergy);
    data.state.active = load > 0.05;
    data.state.energy = synergy.energy;

    // Update spawn interval based on load
    data.spawnInterval = this.calculateSpawnInterval(load);

    // Spawn new pulses
    this.spawnPulses(data, delta);

    // Update existing pulses
    this.updatePulses(data, delta);

    // Occasionally trigger load spikes
    if (this.config.enableLoadSpikes && Math.random() < 0.001) {
      data.loadSpikeEndTime = this.elapsedTime + 0.5;
    }
  }

  /**
   * Spawn pulses based on load and time
   */
  private spawnPulses(data: LinkTrafficData, delta: number): void {
    if (data.state.pulses.length >= this.config.maxPulsesPerLink) {
      return; // At capacity
    }

    data.lastPulseSpawnTime += delta;

    const spawnCount = Math.floor(data.lastPulseSpawnTime / data.spawnInterval);

    for (let i = 0; i < spawnCount; i++) {
      if (data.state.pulses.length < this.config.maxPulsesPerLink) {
        const pulse = this.createPulse(data);
        data.state.pulses.push(pulse);
      }
    }

    data.lastPulseSpawnTime -= spawnCount * data.spawnInterval;
    data.state.metadata!.pulseSpawned = spawnCount > 0;
  }

  /**
   * Create a new pulse particle
   */
  private createPulse(data: LinkTrafficData): PulseParticle {
    const synergy = this.synergyCache.get(data.linkId);
    const baseVelocity = 0.3 + synergy?.score ?? 0.5 * 0.3;
    const velocity = baseVelocity * (0.8 + Math.random() * 0.4); // Slight randomness

    // Quantum gives variable energy
    let energy = 0.6 + Math.random() * 0.4;
    if (synergy?.type === 'quantum' && this.config.quantumRandomness) {
      energy = Math.random(); // Wild variation for quantum
    }

    return {
      id: `pulse-${this.pulseCounter++}`,
      t: 0,
      velocity,
      energy,
      createdAt: this.elapsedTime,
      color: undefined, // Can be set by synergy type
    };
  }

  /**
   * Update all pulses on a link
   */
  private updatePulses(data: LinkTrafficData, delta: number): void {
    const pulses = data.state.pulses;

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];

      // Move pulse along link
      pulse.t += pulse.velocity * delta;

      // Apply energy decay (slight fade)
      pulse.energy *= 0.99;

      // Remove if past end or lifetime exceeded
      const lifetime = this.elapsedTime - pulse.createdAt;
      if (pulse.t > 1.0 || lifetime > this.config.pulseLifetime || pulse.energy < 0.01) {
        pulses.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // LOAD & SPEED CALCULATION
  // =========================================================================

  /**
   * Compute bandwidth load for a link based on synergy
   */
  private computeLoad(link: Link, synergy: SynergyResult): number {
    let load = synergy.energy;

    // Synergy type bonuses
    switch (synergy.type) {
      case 'fusion':
        load += 0.2;
        break;
      case 'quantum':
        load += Math.random() * 0.3;
        break;
      case 'sigma':
        load *= 1.2;
        break;
      case 'fractal':
        load += 0.1;
        break;
      case 'complement':
        load += 0.05;
        break;
    }

    // Layer-specific adjustments
    const fromNode = this.nodes.get(link.from);
    const toNode = this.nodes.get(link.to);

    if (fromNode?.layer === 'quantum' || toNode?.layer === 'quantum') {
      load += 0.15;
    }

    if (fromNode?.layer === 'sigma' || toNode?.layer === 'sigma') {
      load *= 0.8; // Sigma regulates
    }

    // Clamp to valid range
    load = Math.max(0.0, Math.min(1.0, load * this.config.maxBandwidth));

    return load;
  }

  /**
   * Compute pulse speed based on synergy
   */
  private computeSpeed(link: Link, synergy: SynergyResult): number {
    // Base speed from synergy score
    let speed = 0.4 + synergy.score * 0.3;

    // Type modifiers
    switch (synergy.type) {
      case 'fusion':
        speed *= 1.3;
        break;
      case 'quantum':
        speed *= 0.8 + Math.random() * 0.4; // Erratic for quantum
        break;
      case 'sigma':
        speed *= 0.9;
        break;
      case 'linear':
        speed *= 0.8;
        break;
    }

    // Clamp and scale with maxPulseSpeed
    speed = Math.max(0.1, Math.min(3.0, speed)) * this.config.maxPulseSpeed;

    return speed;
  }

  /**
   * Calculate pulse spawn interval from load
   */
  private calculateSpawnInterval(load: number): number {
    const baseSpawnRate = 1.0 / this.config.pulseSpawnRate; // Seconds between spawns

    if (load >= 0.7) {
      // High load: 2-3 pulses per second (0.33-0.5s interval)
      return baseSpawnRate * (0.33 + (1.0 - load) * 0.17);
    } else if (load >= 0.3) {
      // Medium load: 1 pulse per second (1s interval)
      return baseSpawnRate * (1.0 + (0.3 - load) * 2.0);
    } else {
      // Low load: occasional pulses (3-5s interval)
      return baseSpawnRate * (3.0 + Math.random() * 2.0);
    }
  }

  // =========================================================================
  // UTILITY & ANALYSIS
  // =========================================================================

  /**
   * Get all pulses in the network
   */
  public getAllPulses(): Array<PulseParticle & { linkId: string }> {
    const allPulses: Array<PulseParticle & { linkId: string }> = [];

    for (const trafficData of this.trafficCache.values()) {
      for (const pulse of trafficData.state.pulses) {
        allPulses.push({
          ...pulse,
          linkId: trafficData.linkId,
        });
      }
    }

    return allPulses;
  }

  /**
   * Find hotspot links (high traffic)
   */
  public findHotspots(threshold: number = 0.7): TrafficState[] {
    return this.getAllTraffic()
      .filter(s => s.load >= threshold)
      .sort((a, b) => b.load - a.load);
  }

  /**
   * Find bottleneck links (lowest speed, high load)
   */
  public findBottlenecks(loadThreshold: number = 0.5, speedThreshold: number = 0.5): TrafficState[] {
    return this.getAllTraffic()
      .filter(s => s.load >= loadThreshold && s.speed < speedThreshold)
      .sort((a, b) => (b.load / (b.speed + 0.1)) - (a.load / (a.speed + 0.1)));
  }

  /**
   * Calculate average latency across network (inverse of speed)
   */
  public getAverageLatency(): number {
    const states = this.getAllTraffic();
    if (states.length === 0) return 0;

    const avgSpeed = states.reduce((sum, s) => sum + s.speed, 0) / states.length;
    return 1.0 / (avgSpeed + 0.1); // Rough latency estimate
  }

  /**
   * Get traffic pattern (predict next state)
   */
  public predictTrafficTrend(lookAhead: number = 1.0): {
    expectedLoad: number;
    expectedPulses: number;
    expectedCongestion: number;
  } {
    const states = this.getAllTraffic();
    const loads = states.map(s => s.load);
    const avgLoad = loads.reduce((a, b) => a + b) / loads.length;

    // Simple linear prediction
    const expectedLoad = Math.min(1.0, avgLoad * (1 + lookAhead * 0.1));
    const expectedPulses = Math.round(states.reduce((sum, s) => sum + s.pulses.length, 0) * (1 + lookAhead * 0.1));
    const expectedCongestion = (states.filter(s => s.load > expectedLoad).length / states.length) * 100;

    return {
      expectedLoad,
      expectedPulses,
      expectedCongestion,
    };
  }

  /**
   * Export traffic for visualization
   */
  public exportTrafficVisualization(): {
    links: Array<{
      id: string;
      from: string;
      to: string;
      load: number;
      speed: number;
      pulseCount: number;
    }>;
    pulses: Array<{
      id: string;
      linkId: string;
      position: number; // 0-1
      energy: number;
    }>;
    networkStats: ReturnType<TrafficEngine['getNetworkTraffic']>;
  } {
    const links = this.getAllTraffic().map(traffic => ({
      id: traffic.linkId,
      from: this.trafficCache.get(traffic.linkId)?.link.from ?? '',
      to: this.trafficCache.get(traffic.linkId)?.link.to ?? '',
      load: traffic.load,
      speed: traffic.speed,
      pulseCount: traffic.pulses.length,
    }));

    const pulses = this.getAllPulses().map(pulse => ({
      id: pulse.id,
      linkId: pulse.linkId,
      position: pulse.t,
      energy: pulse.energy,
    }));

    return {
      links,
      pulses,
      networkStats: this.getNetworkTraffic(),
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a TrafficEngine instance
 */
export function createTrafficEngine(
  nodes: Map<string, Node>,
  links: Link[],
  synergyEngine: SynergyEngine,
  config?: TrafficEngineConfig
): TrafficEngine {
  return new TrafficEngine(nodes, links, synergyEngine, config);
}

/**
 * Create default configuration
 */
export function createDefaultTrafficConfig(): Required<TrafficEngineConfig> {
  return {
    maxPulseSpeed: 1.0,
    maxBandwidth: 1.0,
    pulseSpawnRate: 1.0,
    pulseLifetime: 5.0,
    maxPulsesPerLink: 10,
    quantumRandomness: true,
    enableLoadSpikes: true,
    spikeIntensity: 1.5,
  };
}

/**
 * Create high-traffic configuration (for stress testing)
 */
export function createHighTrafficConfig(): Required<TrafficEngineConfig> {
  return {
    maxPulseSpeed: 2.0,
    maxBandwidth: 1.5,
    pulseSpawnRate: 2.0,
    pulseLifetime: 3.0,
    maxPulsesPerLink: 20,
    quantumRandomness: true,
    enableLoadSpikes: true,
    spikeIntensity: 2.0,
  };
}

/**
 * Create conservative configuration (minimal traffic)
 */
export function createConservativeTrafficConfig(): Required<TrafficEngineConfig> {
  return {
    maxPulseSpeed: 0.5,
    maxBandwidth: 0.5,
    pulseSpawnRate: 0.5,
    pulseLifetime: 8.0,
    maxPulsesPerLink: 5,
    quantumRandomness: false,
    enableLoadSpikes: false,
    spikeIntensity: 1.0,
  };
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Node,
  Link,
  PulseParticle,
  TrafficState,
  TrafficEngineConfig,
};
