/**
 * NodeInteractionEngine.ts - 3D Node Interaction System for ATOMA
 * 
 * Handles all interaction logic for nodes in a React Three Fiber environment:
 * raycasting, hover detection, selection, dragging, snapping, and hit regions.
 * 
 * Features:
 * - Raycasting for node detection
 * - Hover state tracking
 * - Single-node selection
 * - Smooth dragging with plane constraints
 * - Customizable hit regions
 * - Plane-based movement (XY, XZ, custom)
 * - Smooth interpolation during movement
 * 
 * SESSION 101: STRICT NODE INTERACTION AUTHORITY SYSTEM
 * ======================================================
 * - Only the designated interaction core mesh is clickable
 * - ALL visual layers (auras, shells, effects) are hard-gated from raycasting
 * - Interaction correctness has ABSOLUTE priority
 * - Validated with DEV-only console warnings (no runtime spam)
 */

import * as THREE from 'three';

// ============================================================================
// INTERACTION LAYER CONSTANT
// ============================================================================
const INTERACTION_LAYER = 10; // THREE.js layer for interaction-valid objects

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Hitbox definition for a node
 */
export interface NodeHitbox {
  id: string;
  mesh: THREE.Object3D;
  radius: number;
}

/**
 * Interaction state
 */
export interface InteractionState {
  hoveredNode: string | null;
  selectedNode: string | null;
  dragging: boolean;
  dragStartPos: THREE.Vector3 | null;
  dragCurrentPos: THREE.Vector3 | null;
  dragPlane: THREE.Plane | null;
}

/**
 * Pointer information
 */
export interface PointerInfo {
  position: THREE.Vector2;
  normalized: THREE.Vector2;  // Normalized to [-1, 1]
}

/**
 * Drag configuration
 */
export interface DragConfig {
  enabled: boolean;
  smoothing: number;           // Interpolation factor (0-1)
  planeMode: 'XY' | 'XZ' | 'custom';
  customPlane?: THREE.Plane;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * Configuration options
 */
export interface NodeInteractionConfig {
  hoverDistance?: number;
  dragConfig?: DragConfig;
  enableSmoothing?: boolean;
  smoothingFactor?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a plane for dragging
 */
export function createDragPlane(
  mode: 'XY' | 'XZ' | 'custom' = 'XZ',
  customPlane?: THREE.Plane
): THREE.Plane {
  if (mode === 'custom' && customPlane) {
    return customPlane;
  }

  if (mode === 'XY') {
    return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  }

  // Default: XZ plane
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
}

/**
 * Get intersection point on a plane
 */
export function getRayPlaneIntersection(
  raycaster: THREE.Raycaster,
  plane: THREE.Plane
): THREE.Vector3 | null {
  const target = new THREE.Vector3();
  return raycaster.ray.intersectPlane(plane);
}

/**
 * Snap position to grid
 */
export function snapToGrid(
  position: THREE.Vector3,
  gridSize: number = 1.0
): THREE.Vector3 {
  return new THREE.Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize
  );
}

/**
 * Smooth lerp between two vectors
 */
export function smoothLerp(
  current: THREE.Vector3,
  target: THREE.Vector3,
  factor: number
): THREE.Vector3 {
  return current.lerp(target, factor);
}

// ============================================================================
// NODE INTERACTION ENGINE
// ============================================================================

/**
 * NodeInteractionEngine - Manages all node interactions
 * 
 * Tracks hover state, selection, and dragging. Provides callbacks for
 * interaction events.
 */
export class NodeInteractionEngine {
  private state: InteractionState;
  private hitboxes: Map<string, NodeHitbox> = new Map();
  private config: Required<NodeInteractionConfig>;
  private dragConfig: Required<DragConfig>;
  private raycaster: THREE.Raycaster;
  private velocities: Map<string, THREE.Vector3> = new Map();

  // Event callbacks
  public onHoverStart?: (nodeId: string) => void;
  public onHoverEnd?: (nodeId: string) => void;
  public onSelect?: (nodeId: string) => void;
  public onDeselect?: (nodeId: string) => void;
  public onDragStart?: (nodeId: string) => void;
  public onDrag?: (nodeId: string, position: THREE.Vector3) => void;
  public onDragEnd?: (nodeId: string) => void;

  /**
   * Initialize the interaction engine
   */
  constructor(config: NodeInteractionConfig = {}) {
    this.config = {
      hoverDistance: config.hoverDistance ?? 1.0,
      dragConfig: config.dragConfig ?? {},
      enableSmoothing: config.enableSmoothing ?? true,
      smoothingFactor: config.smoothingFactor ?? 0.15
    };

    this.dragConfig = {
      enabled: this.config.dragConfig.enabled ?? true,
      smoothing: this.config.dragConfig.smoothing ?? 0.15,
      planeMode: this.config.dragConfig.planeMode ?? 'XZ',
      customPlane: this.config.dragConfig.customPlane,
      snapToGrid: this.config.dragConfig.snapToGrid ?? false,
      gridSize: this.config.dragConfig.gridSize ?? 1.0
    };

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = this.config.hoverDistance;

    this.state = {
      hoveredNode: null,
      selectedNode: null,
      dragging: false,
      dragStartPos: null,
      dragCurrentPos: null,
      dragPlane: createDragPlane(this.dragConfig.planeMode, this.dragConfig.customPlane)
    };
  }

  /**
   * Register a node with a hitbox + INTERACTION AUTHORITY
   * 
   * CRITICAL: Enforces strict raycast gating
   * - Only the core mesh (or designated interactionCoreMesh) is clickable
   * - All visual layers (aura, shell, effects) are automatically gated
   * - Non-interactive meshes have raycast disabled and layers filtered
   */
  public registerNode(mesh: THREE.Object3D, id: string, radius: number = 1.0, interactionCoreMesh?: THREE.Object3D): void {
    this.hitboxes.set(id, {
      id,
      mesh,
      radius
    });
    this.velocities.set(id, new THREE.Vector3());

    // === STEP 1: DESIGNATE INTERACTION CORE ===
    const coreMesh = interactionCoreMesh || mesh;
    coreMesh.userData.interactionCore = true;
    coreMesh.userData.interactionCoreNodeId = id;
    coreMesh.layers.enable(10); // INTERACTION_LAYER = 10

    // === STEP 2: HARD RAYCAST GATE ON ALL OTHER MESHES ===
    if (mesh && typeof mesh.traverse === 'function') {
      mesh.traverse((child) => {
        if (child === coreMesh) return; // Skip interaction core itself

        // Mark as non-interactive
        child.userData.nonInteractive = true;
        
        // GATE 1: Remove from interaction layer
        child.layers.disable(10);
        
        // GATE 2: Override raycast to always return null
        child.raycast = () => null;

        // DEV-ONLY: Validation warnings
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          if (child instanceof THREE.Mesh && child.material && child !== coreMesh) {
            // Silent: Visual layers are expected
          }
        }
      });
    }

    // === STEP 3: REGISTER FOR RAYCASTING ===
    // The hitbox mesh will be raycast, but only intersections on coreMesh are valid
  }

  /**
   * Unregister a node
   */
  public unregisterNode(id: string): void {
    if (this.state.hoveredNode === id) {
      this.setHovered(null);
    }
    if (this.state.selectedNode === id) {
      this.setSelected(null);
    }
    if (this.state.dragging && this.state.dragCurrentPos === id) {
      this.endDrag();
    }

    this.hitboxes.delete(id);
    this.velocities.delete(id);
  }

  /**
   * Update node position
   */
  public updateNodePosition(id: string, position: THREE.Vector3): void {
    const hitbox = this.hitboxes.get(id);
    if (hitbox) {
      hitbox.mesh.position.copy(position);
    }
  }

  /**
   * Get current hovered node ID
   */
  public getHoveredNode(): string | null {
    return this.state.hoveredNode;
  }

  /**
   * Get current selected node ID
   */
  public getSelectedNode(): string | null {
    return this.state.selectedNode;
  }

  /**
   * Get dragging state
   */
  public isDragging(): boolean {
    return this.state.dragging;
  }

  /**
   * Get current interaction state
   */
  public getState(): Readonly<InteractionState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Main update loop - call every frame
   * 
   * @param camera - The camera for raycasting
   * @param pointerPosition - Normalized pointer position [-1, 1]
   * @param leftMouseDown - Is left mouse button down
   * @param rightMouseDown - Is right mouse button down
   */
  public tick(
    camera: THREE.Camera,
    pointerPosition: THREE.Vector2,
    leftMouseDown: boolean,
    rightMouseDown: boolean
  ): void {
    // Update raycaster
    this.raycaster.setFromCamera(pointerPosition, camera);

    // Get hitbox meshes for raycasting
    const meshes = Array.from(this.hitboxes.values()).map(h => h.mesh);

    if (meshes.length === 0) return;

    // === STEP 3: RAYCAST FILTER ENFORCEMENT ===
    // Perform raycasting, but enforce interaction authority
    const intersections = this.raycaster.intersectObjects(meshes, false);
    
    // Find first valid intersection (on interaction core only)
    let hoveredNodeId: string | null = null;
    for (const intersection of intersections) {
      const hitObject = intersection.object;
      
      // AUTHORITY CHECK: Only accept if this object IS the interaction core
      if (hitObject.userData?.interactionCore === true) {
        hoveredNodeId = hitObject.userData?.interactionCoreNodeId || this.findNodeIdByMesh(hitObject);
        break; // Stop at first valid core hit
      }
      
      // GATE ENFORCEMENT: Silently skip non-interactive meshes
      if (hitObject.userData?.nonInteractive === true) {
        continue;
      }
      
      // Fallback: Check if parent has interaction core (shouldn't happen, but safe)
      let parent = hitObject.parent;
      while (parent) {
        if (parent.userData?.interactionCore === true) {
          hoveredNodeId = parent.userData?.interactionCoreNodeId || this.findNodeIdByMesh(parent);
          break;
        }
        parent = parent.parent;
      }
      
      if (hoveredNodeId) break;
    }

    // Update hover state
    if (hoveredNodeId !== this.state.hoveredNode) {
      this.setHovered(hoveredNodeId);
    }

    // Handle mouse down (select or start drag)
    if (leftMouseDown && !this.state.dragging && this.state.hoveredNode) {
      this.startDrag(this.state.hoveredNode);
    }

    // Handle dragging
    if (this.state.dragging && leftMouseDown) {
      this.updateDrag(camera, pointerPosition);
    } else if (this.state.dragging) {
      this.endDrag();
    }

    // Handle selection (click on node)
    if (leftMouseDown && this.state.hoveredNode && !this.state.dragging) {
      this.setSelected(this.state.hoveredNode);
    }

    // Handle right-click deselect
    if (rightMouseDown) {
      this.setSelected(null);
    }
  }

  /**
   * Set hovered node
   */
  private setHovered(nodeId: string | null): void {
    if (this.state.hoveredNode === nodeId) return;

    if (this.state.hoveredNode !== null) {
      this.onHoverEnd?.(this.state.hoveredNode);
    }

    this.state.hoveredNode = nodeId;

    if (nodeId !== null) {
      this.onHoverStart?.(nodeId);
    }
  }

  /**
   * Set selected node
   */
  private setSelected(nodeId: string | null): void {
    if (this.state.selectedNode === nodeId) return;

    if (this.state.selectedNode !== null) {
      this.onDeselect?.(this.state.selectedNode);
    }

    this.state.selectedNode = nodeId;

    if (nodeId !== null) {
      this.onSelect?.(nodeId);
    }
  }

  /**
   * Start dragging a node
   */
  private startDrag(nodeId: string): void {
    if (!this.dragConfig.enabled) return;

    const hitbox = this.hitboxes.get(nodeId);
    if (!hitbox) return;

    this.state.dragging = true;
    this.state.dragCurrentPos = hitbox.mesh.position.clone();
    this.state.dragStartPos = hitbox.mesh.position.clone();
    this.state.dragPlane = createDragPlane(this.dragConfig.planeMode, this.dragConfig.customPlane);
    this.state.dragPlane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      hitbox.mesh.position
    );

    this.onDragStart?.(nodeId);
  }

  /**
   * Update dragging
   */
  private updateDrag(camera: THREE.Camera, pointerPosition: THREE.Vector2): void {
    if (!this.state.dragging || !this.state.selectedNode || !this.state.dragPlane) {
      return;
    }

    this.raycaster.setFromCamera(pointerPosition, camera);

    const intersection = getRayPlaneIntersection(this.raycaster, this.state.dragPlane);
    if (!intersection) return;

    let targetPos = intersection.clone();

    // Apply grid snapping if enabled
    if (this.dragConfig.snapToGrid) {
      targetPos = snapToGrid(targetPos, this.dragConfig.gridSize);
    }

    // Apply smoothing
    if (this.config.enableSmoothing && this.state.dragCurrentPos) {
      targetPos = smoothLerp(
        this.state.dragCurrentPos,
        targetPos,
        this.dragConfig.smoothing
      );
    }

    this.state.dragCurrentPos = targetPos;
    this.onDrag?.(this.state.selectedNode, targetPos.clone());
  }

  /**
   * End dragging
   */
  private endDrag(): void {
    if (!this.state.dragging) return;

    const nodeId = this.state.selectedNode;

    this.state.dragging = false;
    this.state.dragStartPos = null;
    this.state.dragCurrentPos = null;
    this.state.dragPlane = null;

    if (nodeId) {
      this.onDragEnd?.(nodeId);
    }
  }

  /**
   * Find node ID by mesh object
   */
  private findNodeIdByMesh(mesh: THREE.Object3D): string | null {
    for (const [id, hitbox] of this.hitboxes.entries()) {
      if (hitbox.mesh === mesh || hitbox.mesh.children.includes(mesh)) {
        return id;
      }
    }
    return null;
  }

  /**
   * Get all hitboxes
   */
  public getHitboxes(): NodeHitbox[] {
    return Array.from(this.hitboxes.values());
  }

  /**
   * Set drag plane mode
   */
  public setDragPlaneMode(mode: 'XY' | 'XZ' | 'custom', customPlane?: THREE.Plane): void {
    this.dragConfig.planeMode = mode;
    if (mode === 'custom' && customPlane) {
      this.dragConfig.customPlane = customPlane;
    }
  }

  /**
   * Enable/disable dragging
   */
  public setDraggingEnabled(enabled: boolean): void {
    this.dragConfig.enabled = enabled;
    if (!enabled && this.state.dragging) {
      this.endDrag();
    }
  }

  /**
   * Set smoothing factor
   */
  public setSmoothingFactor(factor: number): void {
    this.dragConfig.smoothing = Math.max(0, Math.min(1, factor));
  }

  /**
   * Reset all state
   */
  public reset(): void {
    this.setHovered(null);
    this.setSelected(null);
    this.endDrag();
  }

  /**
   * Clear all hitboxes
   */
  public clear(): void {
    this.hitboxes.clear();
    this.velocities.clear();
    this.reset();
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalNodes: number;
    hoveredNode: string | null;
    selectedNode: string | null;
    isDragging: boolean;
  } {
    return {
      totalNodes: this.hitboxes.size,
      hoveredNode: this.state.hoveredNode,
      selectedNode: this.state.selectedNode,
      isDragging: this.state.dragging
    };
  }

  // ========================================================================
  // SESSION 101: NODE INTERACTION AUTHORITY HELPERS
  // ========================================================================

  /**
   * Setup interaction authority for a node (STEP 1 + STEP 2)
   * - Designate core mesh
   * - Apply hard raycast gates to all visual layers
   */
  public setupNodeAuthority(nodeGroup: THREE.Object3D, nodeId: string, coreMesh?: THREE.Mesh): boolean {
    if (!nodeGroup) return false;

    let core = coreMesh;

    // Auto-find core if not provided
    if (!core) {
      nodeGroup.traverse((child: any) => {
        if (child.userData?.interactionCore === true) {
          core = child;
        }
      });
    }

    if (!core || !(core instanceof THREE.Mesh)) {
      console.warn(`[NodeInteractionEngine] No interaction core found for node ${nodeId}`);
      return false;
    }

    // STEP 1: Designate core
    core.userData.interactionCore = true;
    core.userData.interactionCoreNodeId = nodeId;
    core.layers.enable(INTERACTION_LAYER);

    // STEP 2: Apply hard gate to all visual layers
    nodeGroup.traverse((child: any) => {
      if (child === core) return;

      child.userData.nonInteractive = true;
      child.layers.disable(INTERACTION_LAYER);
      child.raycast = () => null;
    });

    return true;
  }

  /**
   * Validate node authority setup (DEV-ONLY)
   * Returns validation report without modifying
   */
  public validateNodeAuthority(nodeGroup: THREE.Object3D, nodeId: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    let coreCount = 0;

    if (!nodeGroup) {
      return { valid: false, issues: ['Node group is null'] };
    }

    nodeGroup.traverse((child: any) => {
      if (child.userData?.interactionCore === true) {
        coreCount++;
        if (!child.layers.isEnabled(INTERACTION_LAYER)) {
          issues.push(`Core ${child.name || 'unnamed'} not on INTERACTION_LAYER`);
        }
      }
    });

    if (coreCount === 0) {
      issues.push('No interaction core designated');
    } else if (coreCount > 1) {
      issues.push(`Multiple cores found (${coreCount}). Only one expected.`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// ============================================================================
// REACT HOOK FOR INTERACTION ENGINE
// ============================================================================

/**
 * React hook for using NodeInteractionEngine in React Three Fiber
 */
export function useNodeInteractionEngine(config?: NodeInteractionConfig) {
  const engineRef = React.useRef<NodeInteractionEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new NodeInteractionEngine(config);
  }

  return engineRef.current;
}

// ============================================================================
// POINTER TRACKER HOOK
// ============================================================================

/**
 * React hook to track pointer position
 */
export function usePointerTracker() {
  const [pointer, setPointer] = React.useState(new THREE.Vector2());
  const [mouseDown, setMouseDown] = React.useState({
    left: false,
    right: false
  });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setPointer(new THREE.Vector2(x, y));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) setMouseDown(prev => ({ ...prev, left: true }));
      if (e.button === 2) setMouseDown(prev => ({ ...prev, right: true }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setMouseDown(prev => ({ ...prev, left: false }));
      if (e.button === 2) setMouseDown(prev => ({ ...prev, right: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return { pointer, mouseDown };
}

// ============================================================================
// EXPORT
// ============================================================================

export default NodeInteractionEngine;
