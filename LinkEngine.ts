/**
 * LinkEngine.ts - Node Linking System for ATOMA AI Simulation
 * 
 * Handles all logic for creating, managing, and validating directional links
 * between nodes in the 3D editor environment.
 * 
 * Features:
 * - Directional link creation with validation
 * - Duplicate link prevention
 * - Preview link rendering during link creation
 * - Bezier curve computation for visual rendering
 * - State management for linking workflow
 */

import * as THREE from 'three';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a node in the network
 */
export interface Node {
  id: string;
  position: THREE.Vector3;
  type?: string;
  data?: Record<string, any>;
}

/**
 * Represents a directional link between two nodes
 */
export interface Link {
  id: string;
  from: string;    // Source node ID
  to: string;      // Target node ID
  type?: string;
  data?: Record<string, any>;
  createdAt?: number;
}

/**
 * Represents a Bezier curve segment for link visualization
 */
export interface BezierSegment {
  p0: THREE.Vector3;  // Start point
  p1: THREE.Vector3;  // Control point 1
  p2: THREE.Vector3;  // Control point 2
  p3: THREE.Vector3;  // End point
}

/**
 * Link engine state
 */
export interface LinkEngineState {
  active: boolean;                    // True when in linking mode
  source: Node | null;                // Source node
  hoverTarget: Node | null;           // Currently hovered target node
  preview: THREE.Vector3 | null;      // Current preview mouse position
  links: Link[];                      // All active links
  selectedLinkId: string | null;      // Currently selected link ID
}

/**
 * Configuration options for LinkEngine
 */
export interface LinkEngineConfig {
  maxLinksPerNode?: number;           // Max outgoing links per node (0 = unlimited)
  allowSelfLinks?: boolean;           // Allow a node to link to itself
  lineCurvature?: number;             // Bezier curve control point offset
  previewResolution?: number;         // Points to sample for preview line
  bezierResolution?: number;          // Points to sample for Bezier curves
  enableValidation?: boolean;         // Perform link validation
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for links
 */
export function generateLinkId(): string {
  return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compute Bezier curve points between two positions
 * Uses cubic Bezier with control points offset vertically
 */
export function computeBezierCurve(
  from: THREE.Vector3,
  to: THREE.Vector3,
  resolution: number = 32,
  curvature: number = 0.5
): THREE.Vector3[] {
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  
  // Control points: offset perpendicular to connection line
  const p1 = new THREE.Vector3().copy(midpoint);
  p1.y += curvature;
  
  const p2 = new THREE.Vector3().copy(midpoint);
  p2.y -= curvature;
  
  // Sample cubic Bezier curve
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const point = new THREE.Vector3();
    
    // Cubic Bezier: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    point.copy(from).multiplyScalar(mt3);
    point.addScaledVector(p1, 3 * mt2 * t);
    point.addScaledVector(p2, 3 * mt * t2);
    point.addScaledVector(to, t3);
    
    points.push(point);
  }
  
  return points;
}

/**
 * Compute straight line from source to mouse position for preview
 */
export function computePreviewLine(
  source: THREE.Vector3,
  mousePos: THREE.Vector3
): THREE.Vector3[] {
  return [source.clone(), mousePos.clone()];
}

/**
 * Get Bezier segment data for a link
 */
export function getBezierSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  curvature: number = 0.5
): BezierSegment {
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  
  return {
    p0: from.clone(),
    p1: new THREE.Vector3().copy(midpoint).addScaledVector(new THREE.Vector3(0, 1, 0), curvature),
    p2: new THREE.Vector3().copy(midpoint).addScaledVector(new THREE.Vector3(0, -1, 0), curvature),
    p3: to.clone()
  };
}

// ============================================================================
// LINK ENGINE CLASS
// ============================================================================

/**
 * LinkEngine - Main linking system
 * 
 * Manages link creation, validation, and state during the linking workflow.
 * Provides preview rendering data and event callbacks.
 */
export class LinkEngine {
  private state: LinkEngineState;
  private config: Required<LinkEngineConfig>;
  private nodeMap: Map<string, Node> = new Map();
  
  // Event callbacks
  public onLinkCreated?: (link: Link) => void;
  public onLinkRemoved?: (linkId: string) => void;
  public onLinkingStarted?: (node: Node) => void;
  public onLinkingCancelled?: () => void;
  public onHoverTargetChanged?: (node: Node | null) => void;

  /**
   * Initialize LinkEngine with configuration
   */
  constructor(config: LinkEngineConfig = {}) {
    this.config = {
      maxLinksPerNode: config.maxLinksPerNode ?? 0,
      allowSelfLinks: config.allowSelfLinks ?? false,
      lineCurvature: config.lineCurvature ?? 0.5,
      previewResolution: config.previewResolution ?? 32,
      bezierResolution: config.bezierResolution ?? 32,
      enableValidation: config.enableValidation ?? true
    };

    this.state = {
      active: false,
      source: null,
      hoverTarget: null,
      preview: null,
      links: [],
      selectedLinkId: null
    };
  }

  /**
   * Register a node in the engine
   */
  public registerNode(node: Node): void {
    this.nodeMap.set(node.id, node);
  }

  /**
   * Unregister a node
   */
  public unregisterNode(nodeId: string): void {
    this.nodeMap.delete(nodeId);
    
    // Remove all links associated with this node
    const linksToRemove = this.state.links.filter(
      link => link.from === nodeId || link.to === nodeId
    );
    linksToRemove.forEach(link => this.removeLink(link.id));
  }

  /**
   * Update node position
   */
  public updateNodePosition(nodeId: string, position: THREE.Vector3): void {
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.position.copy(position);
    }
  }

  /**
   * Begin linking mode from a source node
   */
  public beginLink(node: Node): void {
    if (this.state.active) {
      this.cancelLink();
    }

    this.state.active = true;
    this.state.source = node;
    this.state.hoverTarget = null;
    this.state.preview = node.position.clone();

    this.onLinkingStarted?.(node);
  }

  /**
   * Update hover target based on raycast
   */
  public updateHover(targetNode: Node | null): void {
    if (!this.state.active) return;

    const oldTarget = this.state.hoverTarget;

    // Don't hover self
    if (targetNode && this.state.source && targetNode.id === this.state.source.id) {
      targetNode = null;
    }

    this.state.hoverTarget = targetNode;

    if (oldTarget !== targetNode) {
      this.onHoverTargetChanged?.(targetNode);
    }
  }

  /**
   * Update preview position (mouse raycast result)
   */
  public updatePreview(position: THREE.Vector3): void {
    if (!this.state.active || !this.state.source) return;
    this.state.preview = position.clone();
  }

  /**
   * Confirm the link if conditions are valid
   */
  public confirmLink(): boolean {
    if (!this.state.active || !this.state.source || !this.state.hoverTarget) {
      return false;
    }

    const source = this.state.source;
    const target = this.state.hoverTarget;

    // Validation
    if (this.config.enableValidation) {
      // Check self-linking
      if (!this.config.allowSelfLinks && source.id === target.id) {
        console.warn('LinkEngine: Self-linking not allowed');
        return false;
      }

      // Check duplicate
      if (this.isDuplicateLink(source.id, target.id)) {
        console.warn('LinkEngine: Duplicate link already exists');
        return false;
      }

      // Check max links per node
      if (this.config.maxLinksPerNode > 0) {
        const outgoingCount = this.state.links.filter(l => l.from === source.id).length;
        if (outgoingCount >= this.config.maxLinksPerNode) {
          console.warn(`LinkEngine: Max links per node (${this.config.maxLinksPerNode}) reached`);
          return false;
        }
      }
    }

    // Create link
    const link: Link = {
      id: generateLinkId(),
      from: source.id,
      to: target.id,
      createdAt: Date.now()
    };

    this.state.links.push(link);
    this.onLinkCreated?.(link);

    this.cancelLink();
    return true;
  }

  /**
   * Cancel the current linking session
   */
  public cancelLink(): void {
    if (!this.state.active) return;

    this.state.active = false;
    this.state.source = null;
    this.state.hoverTarget = null;
    this.state.preview = null;

    this.onLinkingCancelled?.();
  }

  /**
   * Check if a link already exists (in either direction)
   */
  public isDuplicateLink(fromId: string, toId: string): boolean {
    return this.state.links.some(
      link => (link.from === fromId && link.to === toId) ||
              (link.from === toId && link.to === fromId)
    );
  }

  /**
   * Remove a link by ID
   */
  public removeLink(linkId: string): boolean {
    const index = this.state.links.findIndex(link => link.id === linkId);
    if (index !== -1) {
      this.state.links.splice(index, 1);
      this.onLinkRemoved?.(linkId);
      return true;
    }
    return false;
  }

  /**
   * Get all links
   */
  public getLinks(): Link[] {
    return [...this.state.links];
  }

  /**
   * Get links from a specific node
   */
  public getLinksFrom(nodeId: string): Link[] {
    return this.state.links.filter(link => link.from === nodeId);
  }

  /**
   * Get links to a specific node
   */
  public getLinksTo(nodeId: string): Link[] {
    return this.state.links.filter(link => link.to === nodeId);
  }

  /**
   * Select a link
   */
  public selectLink(linkId: string): void {
    this.state.selectedLinkId = linkId;
  }

  /**
   * Deselect current link
   */
  public deselectLink(): void {
    this.state.selectedLinkId = null;
  }

  /**
   * Get selected link
   */
  public getSelectedLink(): Link | null {
    if (!this.state.selectedLinkId) return null;
    return this.state.links.find(link => link.id === this.state.selectedLinkId) || null;
  }

  /**
   * Get current engine state
   */
  public getState(): Readonly<LinkEngineState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Get a node by ID
   */
  public getNode(nodeId: string): Node | undefined {
    return this.nodeMap.get(nodeId);
  }

  /**
   * Get all registered nodes
   */
  public getNodes(): Node[] {
    return Array.from(this.nodeMap.values());
  }

  /**
   * Compute preview line geometry (straight line from source to mouse)
   */
  public getPreviewLinePoints(): THREE.Vector3[] {
    if (!this.state.active || !this.state.source || !this.state.preview) {
      return [];
    }

    return computePreviewLine(this.state.source.position, this.state.preview);
  }

  /**
   * Compute Bezier curve points for a link
   */
  public getBezierCurvePoints(link: Link, resolution?: number): THREE.Vector3[] {
    const fromNode = this.nodeMap.get(link.from);
    const toNode = this.nodeMap.get(link.to);

    if (!fromNode || !toNode) {
      return [];
    }

    return computeBezierCurve(
      fromNode.position,
      toNode.position,
      resolution ?? this.config.bezierResolution,
      this.config.lineCurvature
    );
  }

  /**
   * Update all link positions (call when nodes move)
   */
  public updateLinkPositions(nodePositions: Map<string, THREE.Vector3>): void {
    for (const [nodeId, position] of nodePositions) {
      this.updateNodePosition(nodeId, position);
    }
  }

  /**
   * Validate all links (remove invalid ones)
   */
  public validateLinks(): void {
    this.state.links = this.state.links.filter(link => {
      const fromExists = this.nodeMap.has(link.from);
      const toExists = this.nodeMap.has(link.to);
      
      if (!fromExists || !toExists) {
        this.onLinkRemoved?.(link.id);
        return false;
      }
      
      return true;
    });
  }

  /**
   * Clear all links
   */
  public clearLinks(): void {
    const linkIds = this.state.links.map(link => link.id);
    this.state.links = [];
    linkIds.forEach(id => this.onLinkRemoved?.(id));
  }

  /**
   * Clear all state (hard reset)
   */
  public reset(): void {
    this.cancelLink();
    this.clearLinks();
    this.nodeMap.clear();
    this.state.selectedLinkId = null;
  }

  /**
   * Export state for serialization
   */
  public exportState(): { links: Link[]; nodes: Node[] } {
    return {
      links: [...this.state.links],
      nodes: Array.from(this.nodeMap.values())
    };
  }

  /**
   * Import state from serialization
   */
  public importState(data: { links: Link[]; nodes: Node[] }): void {
    this.reset();
    
    data.nodes.forEach(node => this.registerNode(node));
    this.state.links = [...data.links];
  }

  /**
   * Get statistics about the link network
   */
  public getStats(): {
    totalLinks: number;
    totalNodes: number;
    maxOutgoing: number;
    maxIncoming: number;
    avgDegree: number;
  } {
    const nodes = Array.from(this.nodeMap.values());
    
    let maxOutgoing = 0;
    let maxIncoming = 0;
    
    nodes.forEach(node => {
      const outgoing = this.getLinksFrom(node.id).length;
      const incoming = this.getLinksTo(node.id).length;
      maxOutgoing = Math.max(maxOutgoing, outgoing);
      maxIncoming = Math.max(maxIncoming, incoming);
    });
    
    const avgDegree = nodes.length > 0
      ? (this.state.links.length * 2) / nodes.length
      : 0;

    return {
      totalLinks: this.state.links.length,
      totalNodes: nodes.length,
      maxOutgoing,
      maxIncoming,
      avgDegree
    };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default LinkEngine;
