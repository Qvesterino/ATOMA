/**
 * VisualizationEngine.ts - 3D Node Clustering & Hierarchical Visualization
 * 
 * Organizes AI nodes into hierarchical clusters with collapsible groups,
 * automatic layout, and real-time cluster visualization.
 * 
 * Features:
 * - K-means clustering based on synergy and proximity
 * - Hierarchical node grouping
 * - Collapsible cluster visualization
 * - Dynamic camera framing
 * - Cluster force-directed layout
 * - Real-time cluster updates
 */

import * as THREE from 'three';
import type { Node } from './TrafficEngine';
import type { TrafficState } from './TrafficEngine';
import type { SynergyResult } from './SynergyEngine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Cluster containing related nodes
 */
export interface Cluster {
  id: string;
  label: string;
  nodes: Node[];
  centroid: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  isExpanded: boolean;
  parent?: string;
  children?: string[];
  metadata?: {
    layer?: string;
    avgFrequency?: number;
    avgLoad?: number;
    pulseCount?: number;
  };
}

/**
 * Hierarchical cluster structure
 */
export interface HierarchyNode {
  cluster: Cluster;
  children: HierarchyNode[];
  depth: number;
  parent?: HierarchyNode;
}

/**
 * Cluster visualization configuration
 */
export interface ClusterVisualizationConfig {
  clusterCount?: number;           // 3-10 clusters
  enableHierarchy?: boolean;       // Create parent clusters
  enableForceLayout?: boolean;     // Repulsive forces
  enableCollapse?: boolean;        // Allow collapsing
  visualRadius?: number;           // Cluster sphere radius
  forceStrength?: number;          // Layout force magnitude
  maxIterations?: number;          // Layout iterations
}

/**
 * Cluster visualization state
 */
export interface ClusterVisualizationState {
  clusters: Cluster[];
  hierarchy?: HierarchyNode;
  layout: Map<string, THREE.Vector3>;
  expandedClusters: Set<string>;
  selectedCluster?: string;
  metadata?: {
    layoutTime?: number;
    averageClusterSize?: number;
    maxClusterSize?: number;
  };
}

// ============================================================================
// VISUALIZATION ENGINE CLASS
// ============================================================================

export class VisualizationEngine {
  private nodes: Node[];
  private trafficStates: Map<string, TrafficState>;
  private synergies: Map<string, SynergyResult>;
  private config: Required<ClusterVisualizationConfig>;
  private state: ClusterVisualizationState;

  /**
   * Initialize the visualization engine
   */
  constructor(
    nodes: Node[],
    trafficStates?: Map<string, TrafficState>,
    synergies?: Map<string, SynergyResult>,
    config?: ClusterVisualizationConfig
  ) {
    this.nodes = nodes;
    this.trafficStates = trafficStates ?? new Map();
    this.synergies = synergies ?? new Map();
    this.config = this.normalizeConfig(config);
    this.state = {
      clusters: [],
      layout: new Map(),
      expandedClusters: new Set(),
    };

    // Generate initial clustering
    this.generateClusters();
  }

  /**
   * Normalize configuration
   */
  private normalizeConfig(config?: ClusterVisualizationConfig): Required<ClusterVisualizationConfig> {
    return {
      clusterCount: Math.max(3, Math.min(10, config?.clusterCount ?? 5)),
      enableHierarchy: config?.enableHierarchy ?? true,
      enableForceLayout: config?.enableForceLayout ?? true,
      enableCollapse: config?.enableCollapse ?? true,
      visualRadius: Math.max(0.5, config?.visualRadius ?? 2.0),
      forceStrength: Math.max(0.1, config?.forceStrength ?? 1.0),
      maxIterations: Math.max(10, config?.maxIterations ?? 50),
    };
  }

  // =========================================================================
  // CLUSTERING ALGORITHMS
  // =========================================================================

  /**
   * Generate clusters using K-means
   */
  private generateClusters(): void {
    if (this.nodes.length === 0) return;

    const k = Math.min(this.config.clusterCount, this.nodes.length);

    // Step 1: Initialize centroids (K-means++)
    const centroids = this.initializeCentroids(k);

    // Step 2: Iterative clustering
    let clusters = this.kMeansClustering(this.nodes, centroids, 10);

    // Step 3: Organize into clusters with metadata
    this.state.clusters = clusters.map((nodeIndices, i) => {
      const clusterNodes = nodeIndices.map(idx => this.nodes[idx]);
      const centroid = this.calculateCentroid(clusterNodes);

      return {
        id: `cluster-${i}`,
        label: this.generateClusterLabel(clusterNodes),
        nodes: clusterNodes,
        centroid,
        radius: this.calculateClusterRadius(clusterNodes, centroid),
        color: this.getClusterColor(clusterNodes),
        isExpanded: true,
        metadata: {
          layer: this.determineDominantLayer(clusterNodes),
          avgFrequency: clusterNodes.reduce((sum, n) => sum + n.frequency, 0) / clusterNodes.length,
          avgLoad: this.calculateAverageLoad(clusterNodes),
          pulseCount: this.calculateTotalPulses(clusterNodes),
        },
      };
    });

    // Step 4: Create hierarchy if enabled
    if (this.config.enableHierarchy) {
      this.createHierarchy();
    }

    // Step 5: Apply force-directed layout if enabled
    if (this.config.enableForceLayout) {
      this.applyForceLayout();
    }

    // Update expanded clusters
    this.state.expandedClusters.clear();
    this.state.clusters.forEach(c => this.state.expandedClusters.add(c.id));
  }

  /**
   * Initialize K-means++ centroids
   */
  private initializeCentroids(k: number): THREE.Vector3[] {
    const centroids: THREE.Vector3[] = [];

    // First centroid: random node
    const first = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    centroids.push(first.position ?? new THREE.Vector3());

    // Remaining centroids: farthest from existing ones
    for (let i = 1; i < k; i++) {
      let maxDist = -Infinity;
      let farthestNode = this.nodes[0];

      for (const node of this.nodes) {
        const pos = node.position ?? new THREE.Vector3();
        const minDist = Math.min(
          ...centroids.map(c => pos.distanceTo(c))
        );

        if (minDist > maxDist) {
          maxDist = minDist;
          farthestNode = node;
        }
      }

      centroids.push(farthestNode.position ?? new THREE.Vector3());
    }

    return centroids;
  }

  /**
   * K-means clustering
   */
  private kMeansClustering(
    nodes: Node[],
    initialCentroids: THREE.Vector3[],
    maxIterations: number
  ): number[][] {
    let centroids = initialCentroids.map(c => c.clone());
    let clusters: number[][] = [];

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign nodes to nearest centroid
      clusters = Array(centroids.length)
        .fill(null)
        .map(() => []);

      for (let i = 0; i < nodes.length; i++) {
        const pos = nodes[i].position ?? new THREE.Vector3();
        const distances = centroids.map(c => pos.distanceTo(c));
        const nearest = distances.indexOf(Math.min(...distances));
        clusters[nearest].push(i);
      }

      // Remove empty clusters
      clusters = clusters.filter(c => c.length > 0);

      // Update centroids
      const newCentroids = clusters.map(cluster => {
        const clusterNodes = cluster.map(i => nodes[i]);
        return this.calculateCentroid(clusterNodes);
      });

      // Check convergence
      const converged = newCentroids.every((c, i) =>
        c.distanceTo(centroids[i]) < 0.01
      );

      centroids = newCentroids;

      if (converged) break;
    }

    return clusters;
  }

  /**
   * Create hierarchical clustering
   */
  private createHierarchy(): void {
    if (this.state.clusters.length < 2) return;

    // Group clusters by dominant layer
    const layerGroups = new Map<string, Cluster[]>();

    for (const cluster of this.state.clusters) {
      const layer = cluster.metadata?.layer ?? 'unknown';
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, []);
      }
      layerGroups.get(layer)!.push(cluster);
    }

    // Create parent clusters for each layer
    const parentClusters: Cluster[] = [];

    layerGroups.forEach((clusters, layer) => {
      const parentId = `parent-${layer}`;
      const nodes = clusters.flatMap(c => c.nodes);
      const centroid = this.calculateCentroid(nodes);

      const parentCluster: Cluster = {
        id: parentId,
        label: `${layer.toUpperCase()} Hub`,
        nodes,
        centroid,
        radius: clusters.reduce((max, c) => Math.max(max, c.radius), 0) * 1.5,
        color: this.getClusterColor(nodes),
        isExpanded: true,
        children: clusters.map(c => c.id),
        metadata: {
          layer,
          avgFrequency: nodes.reduce((sum, n) => sum + n.frequency, 0) / nodes.length,
        },
      };

      parentClusters.push(parentCluster);

      // Link children to parent
      clusters.forEach(c => {
        c.parent = parentId;
      });
    });

    // Add parent clusters
    this.state.clusters.push(...parentClusters);
  }

  /**
   * Apply force-directed layout
   */
  private applyForceLayout(): void {
    const positions = new Map<string, THREE.Vector3>();

    // Initialize positions from centroids
    for (const cluster of this.state.clusters) {
      positions.set(cluster.id, cluster.centroid.clone());
    }

    // Iterate force simulation
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      const forces = new Map<string, THREE.Vector3>();

      // Initialize forces
      for (const cluster of this.state.clusters) {
        forces.set(cluster.id, new THREE.Vector3());
      }

      // Apply repulsive forces between clusters
      const clusters = this.state.clusters;
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const pos1 = positions.get(clusters[i].id)!;
          const pos2 = positions.get(clusters[j].id)!;

          const diff = pos2.clone().sub(pos1);
          const dist = diff.length();
          const minDist = (clusters[i].radius + clusters[j].radius) * 2;

          if (dist > 0.01 && dist < minDist * 3) {
            // Repulsive force
            const force = diff.normalize().multiplyScalar(
              -this.config.forceStrength * (minDist - dist) / 100
            );

            forces.get(clusters[i].id)!.add(force);
            forces.get(clusters[j].id)!.sub(force);
          }
        }
      }

      // Apply attractive force to original centroid
      for (const cluster of clusters) {
        const pos = positions.get(cluster.id)!;
        const attraction = cluster.centroid.clone()
          .sub(pos)
          .multiplyScalar(0.1 * this.config.forceStrength);

        forces.get(cluster.id)!.add(attraction);
      }

      // Update positions
      for (const cluster of clusters) {
        const force = forces.get(cluster.id)!;
        const pos = positions.get(cluster.id)!;

        pos.add(force.multiplyScalar(0.1));
      }

      // Dampen oscillations
      if (iter % 5 === 0) {
        for (const pos of positions.values()) {
          pos.lerp(new THREE.Vector3(), 0.02);
        }
      }
    }

    // Update layout
    this.state.layout = positions;
  }

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  /**
   * Calculate centroid of nodes
   */
  private calculateCentroid(nodes: Node[]): THREE.Vector3 {
    if (nodes.length === 0) return new THREE.Vector3();

    const sum = new THREE.Vector3();
    for (const node of nodes) {
      sum.add(node.position ?? new THREE.Vector3());
    }

    return sum.divideScalar(nodes.length);
  }

  /**
   * Calculate cluster radius
   */
  private calculateClusterRadius(nodes: Node[], centroid: THREE.Vector3): number {
    let maxDist = 0;

    for (const node of nodes) {
      const pos = node.position ?? new THREE.Vector3();
      const dist = pos.distanceTo(centroid);
      maxDist = Math.max(maxDist, dist);
    }

    return Math.max(maxDist, this.config.visualRadius);
  }

  /**
   * Get cluster color based on nodes
   */
  private getClusterColor(nodes: Node[]): THREE.Color {
    const layerColors: Record<string, string> = {
      input: '#00ddff',
      process: '#ffaa00',
      integration: '#00ff88',
      analytics: '#aa00ff',
      storage: '#88ccff',
      control: '#ff0088',
      quantum: '#6633ff',
      sigma: '#00ff00',
    };

    if (nodes.length === 0) return new THREE.Color(0x888888);

    // Get dominant layer
    const layer = this.determineDominantLayer(nodes);
    const colorHex = layerColors[layer] ?? '#cccccc';

    return new THREE.Color(colorHex);
  }

  /**
   * Determine dominant layer
   */
  private determineDominantLayer(nodes: Node[]): string {
    const layerCounts = new Map<string, number>();

    for (const node of nodes) {
      const count = layerCounts.get(node.layer) ?? 0;
      layerCounts.set(node.layer, count + 1);
    }

    let dominant = 'unknown';
    let maxCount = 0;

    for (const [layer, count] of layerCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = layer;
      }
    }

    return dominant;
  }

  /**
   * Generate cluster label
   */
  private generateClusterLabel(nodes: Node[]): string {
    const layer = this.determineDominantLayer(nodes);
    const count = nodes.length;

    return `${layer} cluster (${count} nodes)`;
  }

  /**
   * Calculate average load for cluster
   */
  private calculateAverageLoad(nodes: Node[]): number {
    let totalLoad = 0;
    let count = 0;

    for (const node of nodes) {
      const traffic = this.trafficStates.get(node.id);
      if (traffic) {
        totalLoad += traffic.load;
        count++;
      }
    }

    return count > 0 ? totalLoad / count : 0;
  }

  /**
   * Calculate total pulses in cluster
   */
  private calculateTotalPulses(nodes: Node[]): number {
    let totalPulses = 0;

    for (const node of nodes) {
      const traffic = this.trafficStates.get(node.id);
      if (traffic) {
        totalPulses += traffic.pulses.length;
      }
    }

    return totalPulses;
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Get all clusters
   */
  public getClusters(): Cluster[] {
    return this.state.clusters;
  }

  /**
   * Get visualization state
   */
  public getState(): ClusterVisualizationState {
    return this.state;
  }

  /**
   * Toggle cluster expansion
   */
  public toggleCluster(clusterId: string): void {
    const cluster = this.state.clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    cluster.isExpanded = !cluster.isExpanded;

    if (cluster.isExpanded) {
      this.state.expandedClusters.add(clusterId);
    } else {
      this.state.expandedClusters.delete(clusterId);
    }
  }

  /**
   * Select cluster
   */
  public selectCluster(clusterId: string): void {
    this.state.selectedCluster = clusterId;
  }

  /**
   * Get camera frame for cluster
   */
  public getCameraFrame(clusterId: string): {
    position: THREE.Vector3;
    target: THREE.Vector3;
    distance: number;
  } | null {
    const cluster = this.state.clusters.find(c => c.id === clusterId);
    if (!cluster) return null;

    const target = this.state.layout.get(clusterId) ?? cluster.centroid;
    const distance = cluster.radius * 3;

    // Position camera above and to the side
    const angle = Math.atan2(target.z, target.x);
    const position = new THREE.Vector3(
      target.x + Math.cos(angle + 0.5) * distance,
      target.y + cluster.radius * 1.5,
      target.z + Math.sin(angle + 0.5) * distance
    );

    return { position, target, distance };
  }

  /**
   * Update with new traffic data
   */
  public update(trafficStates: Map<string, TrafficState>): void {
    this.trafficStates = trafficStates;

    // Recalculate metadata
    for (const cluster of this.state.clusters) {
      cluster.metadata = {
        layer: cluster.metadata?.layer,
        avgFrequency: cluster.nodes.reduce((sum, n) => sum + n.frequency, 0) / cluster.nodes.length,
        avgLoad: this.calculateAverageLoad(cluster.nodes),
        pulseCount: this.calculateTotalPulses(cluster.nodes),
      };
    }
  }

  /**
   * Export visualization data
   */
  public exportVisualization(): {
    clusters: Cluster[];
    layout: Record<string, { x: number; y: number; z: number }>;
    expandedClusters: string[];
    selectedCluster?: string;
  } {
    const layout: Record<string, { x: number; y: number; z: number }> = {};

    for (const [id, pos] of this.state.layout) {
      layout[id] = { x: pos.x, y: pos.y, z: pos.z };
    }

    return {
      clusters: this.state.clusters,
      layout,
      expandedClusters: Array.from(this.state.expandedClusters),
      selectedCluster: this.state.selectedCluster,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createVisualizationEngine(
  nodes: Node[],
  trafficStates?: Map<string, TrafficState>,
  synergies?: Map<string, SynergyResult>,
  config?: ClusterVisualizationConfig
): VisualizationEngine {
  return new VisualizationEngine(nodes, trafficStates, synergies, config);
}
