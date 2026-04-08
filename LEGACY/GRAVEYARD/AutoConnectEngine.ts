/**
 * AutoConnectEngine.ts - Intelligent Auto-Connection System for ATOMA
 * 
 * Automatically creates intelligent connections between nodes based on:
 * - Distance proximity
 * - Layer compatibility
 * - Frequency synergy
 * - Node priorities
 * - Quantum/Sigma special rules
 * 
 * Features:
 * - Deterministic connection analysis (except quantum randomization)
 * - Duplicate prevention
 * - Circular loop detection
 * - Suggested vs auto-connect modes
 * - Detailed rejection reasons
 * - Network statistics
 */

import * as THREE from 'three';
import type { Node, Link } from './LinkEngine';
import { generateLinkId } from './LinkEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Node with additional metadata for auto-connect
 */
export interface AutoConnectNode extends Node {
  layer: string;              // input, process, integration, analytics, storage, control, quantum, sigma
  frequency: number;          // 0.0 - 1.0 (wave frequency or priority)
  priority?: number;          // 0.0 - 1.0 (optional, affects connection likelihood)
}

/**
 * Connection suggestion with reasoning
 */
export interface ConnectionSuggestion {
  from: string;
  to: string;
  synergyScore: number;
  reasons: string[];
}

/**
 * Rejected connection with reason
 */
export interface RejectedConnection {
  from: string;
  to: string;
  reason: string;
  synergyScore?: number;
}

/**
 * Auto-connect result batch
 */
export interface AutoConnectResult {
  created: Link[];
  suggested: ConnectionSuggestion[];
  ignored: RejectedConnection[];
  stats: {
    totalEvaluated: number;
    created: number;
    suggested: number;
    ignored: number;
    avgSynergyScore: number;
  };
}

/**
 * Layer pair compatibility entry
 */
export interface LayerCompatibilityMap {
  [key: string]: Set<string>;
}

/**
 * Auto-connect engine configuration
 */
export interface AutoConnectConfig {
  auto?: boolean;                    // Immediately create valid links
  maxConnections?: number;           // Max outgoing links per node
  distanceThreshold?: number;        // Max distance for consideration
  synergyThreshold?: number;         // Min synergy for creation
  suggestThreshold?: number;         // Min synergy for suggestion
  allowCircular?: boolean;           // Allow A→B→C→A cycles
  allowQuantumRandom?: boolean;      // Use quantum randomization
  layerCompatibilityMap?: LayerCompatibilityMap;
  frequencyTolerance?: number;       // Frequency difference tolerance
}

/**
 * Layer compatibility rules
 */
export type LayerType = 
  | 'input'
  | 'process'
  | 'integration'
  | 'analytics'
  | 'storage'
  | 'control'
  | 'quantum'
  | 'sigma';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<AutoConnectConfig> = {
  auto: false,
  maxConnections: 3,
  distanceThreshold: 10.0,
  synergyThreshold: 1.2,
  suggestThreshold: 0.8,
  allowCircular: false,
  allowQuantumRandom: true,
  layerCompatibilityMap: {},
  frequencyTolerance: 0.15
};

/**
 * Default layer compatibility rules
 * Maps each layer to compatible target layers
 */
const DEFAULT_LAYER_COMPATIBILITY: LayerCompatibilityMap = {
  input: new Set(['process']),
  process: new Set(['integration', 'control', 'quantum']),
  integration: new Set(['analytics', 'quantum']),
  analytics: new Set(['storage', 'control', 'quantum']),
  storage: new Set(['control', 'quantum']),
  control: new Set(['process', 'integration']),
  quantum: new Set(['input', 'process', 'integration', 'analytics', 'storage', 'control', 'sigma', 'quantum']),
  sigma: new Set(['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma'])
};

/**
 * Synergy modifiers for specific layer pairs
 */
const LAYER_PAIR_MODIFIERS: Map<string, number> = new Map([
  ['storage->analytics', 0.3],
  ['integration->analytics', 0.4],
  ['process->integration', 0.2],
  ['quantum->any', 0.5],
  ['sigma->any', -0.5]
]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compute Euclidean distance between two nodes
 */
export function computeDistance(a: AutoConnectNode, b: AutoConnectNode): number {
  return a.position.distanceTo(b.position);
}

/**
 * Create a new link between two nodes
 */
export function makeLink(from: string, to: string): Link {
  return {
    id: generateLinkId(),
    from,
    to,
    createdAt: Date.now()
  };
}

/**
 * Check if a link already exists in the array
 */
export function linkExists(
  from: string,
  to: string,
  existingLinks: Link[]
): boolean {
  return existingLinks.some(
    link => (link.from === from && link.to === to) ||
            (link.from === to && link.to === from)
  );
}

/**
 * Detect if adding a link would create a cycle
 * Uses DFS to find cycles
 */
export function wouldCreateCycle(
  from: string,
  to: string,
  existingLinks: Link[]
): boolean {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  
  for (const link of existingLinks) {
    if (!graph.has(link.from)) {
      graph.set(link.from, []);
    }
    graph.get(link.from)!.push(link.to);
  }

  // Check if path exists from target to source
  const visited = new Set<string>();
  const stack: string[] = [to];

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (current === from) {
      return true; // Cycle detected
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const neighbors = graph.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return false; // No cycle
}

/**
 * Get all neighbors of a node within distance threshold
 */
export function getNeighbors(
  node: AutoConnectNode,
  allNodes: Map<string, AutoConnectNode>,
  maxDistance: number
): AutoConnectNode[] {
  const neighbors: AutoConnectNode[] = [];

  for (const [id, otherNode] of allNodes.entries()) {
    if (id === node.id) continue;

    const distance = computeDistance(node, otherNode);
    if (distance <= maxDistance) {
      neighbors.push(otherNode);
    }
  }

  // Sort by distance (nearest first)
  neighbors.sort((a, b) => 
    computeDistance(node, a) - computeDistance(node, b)
  );

  return neighbors;
}

/**
 * Normalize frequency values to 0-1 range
 */
export function normalizeFrequency(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Check if frequencies are close
 */
export function frequenciesClose(
  freqA: number,
  freqB: number,
  tolerance: number
): boolean {
  const diff = Math.abs(freqA - freqB);
  return diff < tolerance;
}

// ============================================================================
// AUTO CONNECT ENGINE CLASS
// ============================================================================

/**
 * AutoConnectEngine - Intelligent automatic connection system
 * 
 * Analyzes node graphs and creates intelligent connections based on
 * compatibility, synergy, and network topology.
 */
export class AutoConnectEngine {
  private nodes: Map<string, AutoConnectNode>;
  private existingLinks: Link[];
  private config: Required<AutoConnectConfig>;
  private layerCompatibility: LayerCompatibilityMap;
  private createdLinks: Link[] = [];
  private suggestedLinks: ConnectionSuggestion[] = [];
  private rejectedConnections: RejectedConnection[] = [];

  /**
   * Initialize AutoConnectEngine
   */
  constructor(
    nodes: Map<string, AutoConnectNode>,
    existingLinks: Link[] = [],
    config: AutoConnectConfig = {}
  ) {
    this.nodes = new Map(nodes);
    this.existingLinks = [...existingLinks];
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.layerCompatibility = config.layerCompatibilityMap || DEFAULT_LAYER_COMPATIBILITY;

    // Validate node data
    this.validateNodes();
  }

  /**
   * Validate that all nodes have required fields
   */
  private validateNodes(): void {
    for (const [id, node] of this.nodes.entries()) {
      if (!node.layer) {
        console.warn(`Node ${id} missing layer property`);
      }
      if (node.frequency === undefined || node.frequency === null) {
        console.warn(`Node ${id} missing frequency property`);
        node.frequency = 0.5; // Default to middle
      }
      node.frequency = normalizeFrequency(node.frequency);
      if (!node.priority) {
        node.priority = 0.5; // Default priority
      }
    }
  }

  /**
   * Check if two layers are compatible for connection
   */
  private isLayerCompatible(fromLayer: string, toLayer: string): boolean {
    // Special cases: quantum and sigma connect to almost everything
    if (fromLayer === 'quantum' || fromLayer === 'sigma') {
      return true;
    }

    // Check compatibility map
    const compatibleTo = this.layerCompatibility[fromLayer];
    if (!compatibleTo) {
      return false;
    }

    return compatibleTo.has(toLayer);
  }

  /**
   * Compute synergy score between two nodes
   * 
   * Scoring factors:
   * - Base score: 1.0
   * - Compatible layers: +1.0
   * - Matching frequencies: +0.5
   * - Quantum involvement: +random(0, 1.0)
   * - Sigma involvement: -0.5 (strict check)
   * - Layer pair bonuses: +0.2 to +0.4
   */
  private computeSynergyScore(fromId: string, toId: string): number {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) {
      return 0;
    }

    let score = 1.0; // Base score

    // Layer compatibility bonus
    if (this.isLayerCompatible(fromNode.layer, toNode.layer)) {
      score += 1.0;
    } else {
      return -1; // Incompatible layers
    }

    // Frequency alignment bonus
    if (frequenciesClose(
      fromNode.frequency,
      toNode.frequency,
      this.config.frequencyTolerance
    )) {
      score += 0.5;
    }

    // Priority consideration
    const priorityDiff = Math.abs((fromNode.priority || 0.5) - (toNode.priority || 0.5));
    const priorityBonus = 1.0 - priorityDiff;
    score += priorityBonus * 0.3;

    // Quantum special handling
    if (fromNode.layer === 'quantum' || toNode.layer === 'quantum') {
      if (this.config.allowQuantumRandom) {
        const quantumBonus = Math.random();
        score += quantumBonus;
      }
    }

    // Sigma special handling (strict check)
    if (fromNode.layer === 'sigma' || toNode.layer === 'sigma') {
      score -= 0.5; // Sigma reduces synergy, must pass strict test
    }

    // Layer pair specific modifiers
    const pairKey = `${fromNode.layer}->${toNode.layer}`;
    const modifier = LAYER_PAIR_MODIFIERS.get(pairKey);
    if (modifier !== undefined) {
      score += modifier;
    }

    return Math.max(0, score);
  }

  /**
   * Check if a connection is valid
   */
  private isValidConnection(
    fromId: string,
    toId: string
  ): { valid: boolean; reason?: string } {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) {
      return { valid: false, reason: 'Node not found' };
    }

    // No self-links
    if (fromId === toId) {
      return { valid: false, reason: 'Self-link not allowed' };
    }

    // Check duplicate
    if (linkExists(fromId, toId, this.existingLinks)) {
      return { valid: false, reason: 'Duplicate link' };
    }

    // Check duplicate in created links
    if (this.createdLinks.some(l => l.from === fromId && l.to === toId)) {
      return { valid: false, reason: 'Link already created in this batch' };
    }

    // Check layer compatibility
    if (!this.isLayerCompatible(fromNode.layer, toNode.layer)) {
      return { valid: false, reason: 'Incompatible layers' };
    }

    // Check max connections
    const outgoingCount = this.existingLinks.filter(l => l.from === fromId).length +
                         this.createdLinks.filter(l => l.from === fromId).length;
    if (outgoingCount >= this.config.maxConnections) {
      return { valid: false, reason: `Max connections (${this.config.maxConnections}) reached` };
    }

    // Check circular loops
    if (!this.config.allowCircular) {
      const allLinks = [...this.existingLinks, ...this.createdLinks];
      if (wouldCreateCycle(fromId, toId, allLinks)) {
        return { valid: false, reason: 'Would create circular loop' };
      }
    }

    return { valid: true };
  }

  /**
   * Apply auto-connect analysis
   * 
   * Evaluates all possible connections and returns created/suggested/ignored lists
   */
  public applyAutoConnect(): AutoConnectResult {
    this.createdLinks = [];
    this.suggestedLinks = [];
    this.rejectedConnections = [];

    let totalEvaluated = 0;
    let totalSynergyScore = 0;

    // For each node
    for (const [fromId, fromNode] of this.nodes.entries()) {
      // Get neighbors within distance threshold
      const neighbors = getNeighbors(
        fromNode,
        this.nodes,
        this.config.distanceThreshold
      );

      // Evaluate each neighbor
      for (const toNode of neighbors) {
        totalEvaluated++;

        // Compute synergy
        const synergyScore = this.computeSynergyScore(fromId, toNode.id);
        totalSynergyScore += synergyScore;

        // Check validity
        const validity = this.isValidConnection(fromId, toNode.id);

        if (!validity.valid) {
          this.rejectedConnections.push({
            from: fromId,
            to: toNode.id,
            reason: validity.reason || 'Unknown reason',
            synergyScore
          });
          continue;
        }

        // Categorize based on synergy score
        const reasons = this.generateReasons(fromNode, toNode, synergyScore);

        if (synergyScore >= this.config.synergyThreshold) {
          // Auto-create
          if (this.config.auto) {
            const link = makeLink(fromId, toNode.id);
            this.createdLinks.push(link);
          } else {
            // Or suggest if not in auto mode
            this.suggestedLinks.push({
              from: fromId,
              to: toNode.id,
              synergyScore,
              reasons
            });
          }
        } else if (synergyScore >= this.config.suggestThreshold) {
          // Suggest
          this.suggestedLinks.push({
            from: fromId,
            to: toNode.id,
            synergyScore,
            reasons
          });
        } else {
          // Ignore (below suggestion threshold)
          this.rejectedConnections.push({
            from: fromId,
            to: toNode.id,
            reason: `Synergy too low (${synergyScore.toFixed(2)})`,
            synergyScore
          });
        }
      }
    }

    // Calculate statistics
    const avgSynergyScore = totalEvaluated > 0 
      ? totalSynergyScore / totalEvaluated 
      : 0;

    const result: AutoConnectResult = {
      created: this.createdLinks,
      suggested: this.suggestedLinks,
      ignored: this.rejectedConnections,
      stats: {
        totalEvaluated,
        created: this.createdLinks.length,
        suggested: this.suggestedLinks.length,
        ignored: this.rejectedConnections.length,
        avgSynergyScore
      }
    };

    return result;
  }

  /**
   * Generate human-readable reasons for a connection
   */
  private generateReasons(
    fromNode: AutoConnectNode,
    toNode: AutoConnectNode,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (this.isLayerCompatible(fromNode.layer, toNode.layer)) {
      reasons.push(`${fromNode.layer}→${toNode.layer} compatible`);
    }

    if (frequenciesClose(
      fromNode.frequency,
      toNode.frequency,
      this.config.frequencyTolerance
    )) {
      reasons.push('Frequencies aligned');
    }

    const distance = computeDistance(fromNode, toNode);
    reasons.push(`Distance: ${distance.toFixed(2)}`);

    if (fromNode.layer === 'quantum' || toNode.layer === 'quantum') {
      reasons.push('Quantum entanglement potential');
    }

    if (score >= this.config.synergyThreshold) {
      reasons.push(`High synergy (${score.toFixed(2)})`);
    }

    return reasons;
  }

  /**
   * Get all suggested links
   */
  public getSuggestedLinks(): ConnectionSuggestion[] {
    return [...this.suggestedLinks];
  }

  /**
   * Get all created links
   */
  public getCreatedLinks(): Link[] {
    return [...this.createdLinks];
  }

  /**
   * Get all rejected connections
   */
  public getRejectedConnections(): RejectedConnection[] {
    return [...this.rejectedConnections];
  }

  /**
   * Accept a suggested link and create it
   */
  public acceptSuggestion(from: string, to: string): Link | null {
    const suggestion = this.suggestedLinks.find(s => s.from === from && s.to === to);
    if (!suggestion) {
      return null;
    }

    const link = makeLink(from, to);
    this.createdLinks.push(link);
    
    // Remove from suggested
    this.suggestedLinks = this.suggestedLinks.filter(s => !(s.from === from && s.to === to));

    return link;
  }

  /**
   * Reject a suggested link
   */
  public rejectSuggestion(from: string, to: string): boolean {
    const index = this.suggestedLinks.findIndex(s => s.from === from && s.to === to);
    if (index === -1) {
      return false;
    }

    const removed = this.suggestedLinks.splice(index, 1)[0];
    this.rejectedConnections.push({
      from: removed.from,
      to: removed.to,
      reason: 'User rejected'
    });

    return true;
  }

  /**
   * Add a node to the engine
   */
  public addNode(node: AutoConnectNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Remove a node from the engine
   */
  public removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    
    // Remove associated links
    this.createdLinks = this.createdLinks.filter(
      l => l.from !== nodeId && l.to !== nodeId
    );
    this.suggestedLinks = this.suggestedLinks.filter(
      s => s.from !== nodeId && s.to !== nodeId
    );
  }

  /**
   * Update existing links
   */
  public updateExistingLinks(links: Link[]): void {
    this.existingLinks = [...links];
  }

  /**
   * Analyze specific node pair
   */
  public analyzePair(fromId: string, toId: string): {
    score: number;
    compatible: boolean;
    valid: boolean;
    reasons: string[];
  } {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) {
      return {
        score: 0,
        compatible: false,
        valid: false,
        reasons: ['Node not found']
      };
    }

    const score = this.computeSynergyScore(fromId, toId);
    const compatible = this.isLayerCompatible(fromNode.layer, toNode.layer);
    const validity = this.isValidConnection(fromId, toId);
    const reasons = this.generateReasons(fromNode, toNode, score);

    return {
      score,
      compatible,
      valid: validity.valid,
      reasons
    };
  }

  /**
   * Get network statistics
   */
  public getStatistics(): {
    totalNodes: number;
    totalExistingLinks: number;
    totalCreated: number;
    totalSuggested: number;
    totalRejected: number;
    avgNodeConnections: number;
    layerDistribution: Record<string, number>;
  } {
    const layerDistribution: Record<string, number> = {};
    let totalConnections = 0;

    for (const node of this.nodes.values()) {
      layerDistribution[node.layer] = (layerDistribution[node.layer] || 0) + 1;
      const connections = this.existingLinks.filter(l => l.from === node.id).length +
                         this.createdLinks.filter(l => l.from === node.id).length;
      totalConnections += connections;
    }

    const avgNodeConnections = this.nodes.size > 0 
      ? totalConnections / this.nodes.size 
      : 0;

    return {
      totalNodes: this.nodes.size,
      totalExistingLinks: this.existingLinks.length,
      totalCreated: this.createdLinks.length,
      totalSuggested: this.suggestedLinks.length,
      totalRejected: this.rejectedConnections.length,
      avgNodeConnections,
      layerDistribution
    };
  }

  /**
   * Export current state
   */
  public exportState(): {
    created: Link[];
    suggested: ConnectionSuggestion[];
    rejected: RejectedConnection[];
  } {
    return {
      created: [...this.createdLinks],
      suggested: [...this.suggestedLinks],
      rejected: [...this.rejectedConnections]
    };
  }

  /**
   * Clear all results
   */
  public clear(): void {
    this.createdLinks = [];
    this.suggestedLinks = [];
    this.rejectedConnections = [];
  }

  /**
   * Reset engine completely
   */
  public reset(): void {
    this.clear();
    this.nodes.clear();
    this.existingLinks = [];
  }

  /**
   * Get layer compatibility for debugging
   */
  public getLayerCompatibilityMatrix(): Record<string, string[]> {
    const matrix: Record<string, string[]> = {};
    
    for (const [layer, compatible] of Object.entries(this.layerCompatibility)) {
      matrix[layer] = Array.from(compatible as Set<string>);
    }

    return matrix;
  }
}

// ============================================================================
// BATCH CONNECTION APPLICATOR
// ============================================================================

/**
 * Apply auto-connect results to a link engine
 */
export function applyAutoConnectResults(
  result: AutoConnectResult,
  linkEngine: any // LinkEngine type
): void {
  // Create all generated links
  for (const link of result.created) {
    linkEngine.registerNodeLink?.(link) || linkEngine.addLink?.(link);
  }
}

/**
 * Generate connection report
 */
export function generateConnectionReport(result: AutoConnectResult): string {
  const { stats } = result;
  
  const lines = [
    '=== AUTO-CONNECT REPORT ===',
    `Total Evaluated: ${stats.totalEvaluated}`,
    `Created: ${stats.created}`,
    `Suggested: ${stats.suggested}`,
    `Ignored: ${stats.ignored}`,
    `Average Synergy: ${stats.avgSynergyScore.toFixed(3)}`,
    ''
  ];

  if (result.created.length > 0) {
    lines.push('CREATED LINKS:');
    result.created.forEach(link => {
      lines.push(`  ${link.from} → ${link.to}`);
    });
    lines.push('');
  }

  if (result.suggested.length > 0) {
    lines.push('SUGGESTED LINKS:');
    result.suggested.forEach(suggestion => {
      lines.push(`  ${suggestion.from} → ${suggestion.to} (score: ${suggestion.synergyScore.toFixed(2)})`);
      suggestion.reasons.forEach(reason => {
        lines.push(`    - ${reason}`);
      });
    });
    lines.push('');
  }

  if (result.ignored.length > 0) {
    lines.push('IGNORED CONNECTIONS:');
    result.ignored.slice(0, 5).forEach(ignored => {
      lines.push(`  ${ignored.from} → ${ignored.to}: ${ignored.reason}`);
    });
    if (result.ignored.length > 5) {
      lines.push(`  ... and ${result.ignored.length - 5} more`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORT
// ============================================================================

export default AutoConnectEngine;
