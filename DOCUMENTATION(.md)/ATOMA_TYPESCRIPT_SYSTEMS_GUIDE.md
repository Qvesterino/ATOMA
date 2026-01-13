# ATOMA TypeScript Systems Guide

Complete reference for the three core TypeScript systems for the ATOMA AI simulation game.

---

## Table of Contents

1. [LinkEngine.ts](#linkengine)
2. [LinkRenderer.ts](#linkrenderer)
3. [NodeInteractionEngine.ts](#nodeinteractionengine)
4. [Integration Example](#integration-example)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)

---

## LinkEngine

### Overview

The **LinkEngine** manages all logic for creating, validating, and managing directional links between nodes. It handles the complete linking workflow from selection through confirmation.

### Key Features

- ✅ Directional link creation (A → B)
- ✅ Duplicate link prevention
- ✅ Validation system (customizable)
- ✅ Preview link rendering data
- ✅ Bezier curve computation
- ✅ Link serialization/export
- ✅ Network statistics

### Basic Usage

```typescript
import { LinkEngine, Node } from './LinkEngine';
import * as THREE from 'three';

// Create engine
const engine = new LinkEngine({
  allowSelfLinks: false,
  maxLinksPerNode: 0,
  lineCurvature: 0.5,
  bezierResolution: 32
});

// Register nodes
const nodeA: Node = {
  id: 'node_1',
  position: new THREE.Vector3(0, 0, 0)
};

const nodeB: Node = {
  id: 'node_2',
  position: new THREE.Vector3(5, 0, 0)
};

engine.registerNode(nodeA);
engine.registerNode(nodeB);

// Begin linking from node A
engine.beginLink(nodeA);

// Update preview as mouse moves
engine.updatePreview(new THREE.Vector3(2.5, 0, 0));

// Hover over target node
engine.updateHover(nodeB);

// Confirm link
const success = engine.confirmLink();  // true if link created

// Check result
const links = engine.getLinks();
console.log(links); // [{ id: 'link_...', from: 'node_1', to: 'node_2' }]
```

### Linking Workflow

```
1. beginLink(nodeA)      → Enter linking mode
   ↓
2. updatePreview(pos)    → Show preview line
   ↓
3. updateHover(nodeB)    → Snap preview to target
   ↓
4. confirmLink()         → Create link (if valid)
   ↓
5. Link created or cancelLink() → Exit linking mode
```

### Validation Rules

LinkEngine validates links based on configuration:

```typescript
const engine = new LinkEngine({
  allowSelfLinks: false,      // Prevent A → A
  maxLinksPerNode: 5,         // Max 5 outgoing links
  enableValidation: true      // Perform all checks
});

// These would fail:
engine.confirmLink();  // A → A (self-link)
engine.confirmLink();  // Duplicate link already exists
engine.confirmLink();  // Max links reached
```

### Event Callbacks

```typescript
engine.onLinkCreated = (link) => {
  console.log(`Link created: ${link.from} → ${link.to}`);
};

engine.onLinkRemoved = (linkId) => {
  console.log(`Link removed: ${linkId}`);
};

engine.onLinkingStarted = (node) => {
  console.log(`Linking started from: ${node.id}`);
};

engine.onLinkingCancelled = () => {
  console.log('Linking cancelled');
};

engine.onHoverTargetChanged = (node) => {
  console.log(`Hover target: ${node?.id ?? 'none'}`);
};
```

### Advanced Operations

```typescript
// Get links from/to specific nodes
const outgoing = engine.getLinksFrom('node_1');
const incoming = engine.getLinksTo('node_2');

// Check if link exists
const isDuplicate = engine.isDuplicateLink('node_1', 'node_2');

// Remove a link
engine.removeLink('link_123');

// Get Bezier curve points for rendering
const points = engine.getBezierCurvePoints(link);

// Get network statistics
const stats = engine.getStats();
// {
//   totalLinks: 10,
//   totalNodes: 5,
//   maxOutgoing: 3,
//   maxIncoming: 2,
//   avgDegree: 4
// }

// Serialize/deserialize
const exported = engine.exportState();
engine.importState(exported);
```

---

## LinkRenderer

### Overview

The **LinkRenderer** is a React Three Fiber component that renders Bezier-curved links between nodes with custom shader materials and real-time animation.

### Key Features

- ✅ Bezier curve rendering
- ✅ Custom shader support
- ✅ Real-time animation
- ✅ Geometry caching
- ✅ Instanced rendering (optional)
- ✅ Dynamic color mapping
- ✅ Link selection highlighting

### Basic Usage

```typescript
import { LinkRenderer } from './LinkRenderer';
import { Canvas } from '@react-three-fiber/web';

function MyScene() {
  const [links, setLinks] = useState<Link[]>([]);
  const [nodes, setNodes] = useState<Map<string, Node>>(new Map());

  return (
    <Canvas>
      <LinkRenderer
        links={links}
        nodes={nodes}
        resolution={32}
        curvature={0.5}
        animateShaderUniforms={true}
      />
    </Canvas>
  );
}
```

### With Custom Shader Material

```typescript
import { createLinkShaderMaterial } from './LinkRenderer';

function MyScene() {
  const shaderMaterial = useMemo(() => createLinkShaderMaterial(), []);

  return (
    <Canvas>
      <LinkRenderer
        links={links}
        nodes={nodes}
        material={shaderMaterial}
        animateShaderUniforms={true}
      />
    </Canvas>
  );
}
```

### With Color Mapping

```typescript
const colorMap = useMemo(() => {
  const map = new Map<string, THREE.Color>();
  
  links.forEach(link => {
    const color = link.type === 'fusion' 
      ? new THREE.Color(0xff6600)
      : new THREE.Color(0x00ddff);
    map.set(link.id, color);
  });
  
  return map;
}, [links]);

return (
  <LinkRenderer
    links={links}
    nodes={nodes}
    colorMap={colorMap}
  />
);
```

### With Selection Highlighting

```typescript
const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

return (
  <LinkRenderer
    links={links}
    nodes={nodes}
    selectedLinkId={selectedLinkId}
    oneLinkHighlight={true}
  />
);
```

### Shader Uniforms

LinkRenderer automatically animates these uniforms each frame:

```glsl
uniform float time;           // Elapsed time (in seconds)
uniform float energy;         // Energy/intensity (0-1)
uniform float intensity;      // Visual intensity (0-1)
uniform float linkType;       // Link type identifier
uniform float selected;       // Selection state (0 or 1)
uniform vec3 color;           // Link color
```

Example custom fragment shader:

```glsl
void main() {
  // Pulse effect
  float pulse = sin(time * 2.0) * 0.5 + 0.5;
  
  // Selection glow
  float glow = selected > 0.5 ? 1.5 : 1.0;
  
  // Final color
  vec3 finalColor = color * intensity * glow;
  float alpha = pulse * energy;
  
  gl_FragColor = vec4(finalColor, alpha);
}
```

### Optimized Batch Rendering

For scenes with many links (100+):

```typescript
<LinkBatchRenderer
  links={links}
  nodes={nodes}
  material={material}
  resolution={16}              // Lower resolution for performance
  batchSize={100}
  useInstancing={true}         // Use GPU instancing
/>
```

---

## NodeInteractionEngine

### Overview

The **NodeInteractionEngine** handles all interaction logic for 3D nodes: raycasting, hover detection, selection, and smooth dragging with plane constraints.

### Key Features

- ✅ Raycasting-based detection
- ✅ Hover state tracking
- ✅ Single-node selection
- ✅ Smooth dragging
- ✅ Plane-based constraints (XY, XZ, custom)
- ✅ Grid snapping
- ✅ Customizable hit regions
- ✅ Event callbacks

### Basic Usage

```typescript
import { NodeInteractionEngine } from './NodeInteractionEngine';
import { useThree } from '@react-three-fiber/web';

function MyScene() {
  const { camera } = useThree();
  const engine = useRef(new NodeInteractionEngine());
  const [pointer, setPointer] = useState(new THREE.Vector2());

  // Register nodes
  useEffect(() => {
    meshRef.current.forEach((mesh, id) => {
      engine.current.registerNode(mesh, id, 1.0); // radius = 1.0
    });
  }, []);

  // Track pointer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setPointer(new THREE.Vector2(x, y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update engine each frame
  useFrame(() => {
    engine.current.tick(camera, pointer, leftMouseDown, rightMouseDown);
  });

  return <></>;
}
```

### Using usePointerTracker Hook

```typescript
import { usePointerTracker } from './NodeInteractionEngine';

function MyScene() {
  const { pointer, mouseDown } = usePointerTracker();
  const { camera } = useThree();
  const engine = useRef(new NodeInteractionEngine());

  useFrame(() => {
    engine.current.tick(
      camera,
      pointer,
      mouseDown.left,
      mouseDown.right
    );
  });
}
```

### Event Callbacks

```typescript
const engine = new NodeInteractionEngine();

// Hover events
engine.onHoverStart = (nodeId) => {
  console.log(`Hovering over: ${nodeId}`);
  highlightNode(nodeId);
};

engine.onHoverEnd = (nodeId) => {
  console.log(`No longer hovering: ${nodeId}`);
  unhighlightNode(nodeId);
};

// Selection events
engine.onSelect = (nodeId) => {
  console.log(`Selected: ${nodeId}`);
};

engine.onDeselect = (nodeId) => {
  console.log(`Deselected: ${nodeId}`);
};

// Drag events
engine.onDragStart = (nodeId) => {
  console.log(`Started dragging: ${nodeId}`);
};

engine.onDrag = (nodeId, position) => {
  // Update node position in real-time
  updateNodePosition(nodeId, position);
};

engine.onDragEnd = (nodeId) => {
  console.log(`Stopped dragging: ${nodeId}`);
  // Save position, finalize movement, etc.
};
```

### Drag Configuration

```typescript
const engine = new NodeInteractionEngine({
  dragConfig: {
    enabled: true,
    smoothing: 0.15,           // Lower = more responsive
    planeMode: 'XZ',           // XY, XZ, or custom
    snapToGrid: true,
    gridSize: 0.5
  },
  enableSmoothing: true,
  smoothingFactor: 0.15
});

// Change at runtime
engine.setDragPlaneMode('XY');
engine.setSmoothingFactor(0.25);
engine.setDraggingEnabled(false);
```

### Plane Modes

```typescript
// XZ Plane (default) - horizontal dragging
engine.setDragPlaneMode('XZ');

// XY Plane - vertical dragging
engine.setDragPlaneMode('XY');

// Custom Plane
const customPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
engine.setDragPlaneMode('custom', customPlane);
```

### Node Registration

```typescript
// Register a node with hitbox
const geometry = new THREE.SphereGeometry(1);
const mesh = new THREE.Mesh(geometry);
scene.add(mesh);

engine.registerNode(mesh, 'node_1', 1.5); // radius for hit detection

// Unregister
engine.unregisterNode('node_1');

// Update position
engine.updateNodePosition('node_1', new THREE.Vector3(5, 0, 0));
```

### Query State

```typescript
// Get current state
const hoveredId = engine.getHoveredNode();
const selectedId = engine.getSelectedNode();
const isDragging = engine.isDragging();
const state = engine.getState();

// Get statistics
const stats = engine.getStats();
// {
//   totalNodes: 10,
//   hoveredNode: 'node_5' or null,
//   selectedNode: 'node_3' or null,
//   isDragging: false
// }
```

---

## Integration Example

### Complete Scene with All Three Systems

```typescript
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three-fiber/web';
import { LinkEngine, Node } from './LinkEngine';
import { LinkRenderer } from './LinkRenderer';
import { NodeInteractionEngine, usePointerTracker } from './NodeInteractionEngine';
import * as THREE from 'three';

function AINodeScene() {
  const { camera } = useThree();
  const linkEngineRef = useRef(new LinkEngine());
  const nodeEngineRef = useRef(new NodeInteractionEngine());
  const { pointer, mouseDown } = usePointerTracker();

  const [nodes, setNodes] = useState<Map<string, Node>>(new Map());
  const [links, setLinks] = useState<Link[]>([]);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Initialize nodes
  useEffect(() => {
    const newNodes = new Map<string, Node>();
    const nodePositions = [
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, -3, 0)
    ];

    nodePositions.forEach((pos, i) => {
      const node: Node = {
        id: `node_${i}`,
        position: pos,
        type: i % 2 === 0 ? 'input' : 'process'
      };
      newNodes.set(node.id, node);
      linkEngineRef.current.registerNode(node);
    });

    setNodes(newNodes);
  }, []);

  // Setup interaction engine callbacks
  useEffect(() => {
    const engine = nodeEngineRef.current;

    engine.onHoverStart = (nodeId) => {
      const mesh = nodeMeshesRef.current.get(nodeId);
      if (mesh && mesh.material instanceof THREE.Material) {
        mesh.material.color.set(0xff6600);
      }
    };

    engine.onHoverEnd = (nodeId) => {
      const mesh = nodeMeshesRef.current.get(nodeId);
      if (mesh && mesh.material instanceof THREE.Material) {
        mesh.material.color.set(0x00ddff);
      }
    };

    engine.onSelect = (nodeId) => {
      linkEngineRef.current.beginLink(nodes.get(nodeId)!);
    };

    engine.onDrag = (nodeId, position) => {
      const node = nodes.get(nodeId);
      if (node) {
        node.position.copy(position);
        const mesh = nodeMeshesRef.current.get(nodeId);
        if (mesh) mesh.position.copy(position);
      }
    };

    return () => {
      engine.onHoverStart = undefined;
      engine.onHoverEnd = undefined;
      engine.onSelect = undefined;
      engine.onDrag = undefined;
    };
  }, [nodes]);

  // Setup link engine callbacks
  useEffect(() => {
    const engine = linkEngineRef.current;

    engine.onLinkCreated = (link) => {
      setLinks(prev => [...prev, link]);
    };

    engine.onLinkRemoved = (linkId) => {
      setLinks(prev => prev.filter(l => l.id !== linkId));
    };

    engine.onHoverTargetChanged = (node) => {
      if (node && nodeEngineRef.current.getHoveredNode() === node.id) {
        const mesh = nodeMeshesRef.current.get(node.id);
        if (mesh && mesh.material instanceof THREE.Material) {
          mesh.material.color.set(0xffff00);
        }
      }
    };
  }, []);

  // Main update loop
  useFrame(() => {
    nodeEngineRef.current.tick(
      camera,
      pointer,
      mouseDown.left,
      mouseDown.right
    );

    // Update preview link if linking
    const linkState = linkEngineRef.current.getState();
    if (linkState.active) {
      linkEngineRef.current.updateHover(
        nodes.get(nodeEngineRef.current.getHoveredNode() ?? '') ?? null
      );
    }
  });

  // Render nodes
  const nodeElements = useMemo(
    () =>
      Array.from(nodes.values()).map(node => (
        <mesh
          key={node.id}
          position={node.position}
          ref={(ref) => {
            if (ref) {
              nodeMeshesRef.current.set(node.id, ref);
              nodeEngineRef.current.registerNode(ref, node.id, 1);
            }
          }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={0x00ddff} />
        </mesh>
      )),
    [nodes]
  );

  return (
    <>
      {nodeElements}
      <LinkRenderer
        links={links}
        nodes={nodes}
        resolution={32}
        curvature={0.5}
        animateShaderUniforms={true}
      />
    </>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <AINodeScene />
    </Canvas>
  );
}
```

---

## API Reference

### LinkEngine

#### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `registerNode` | `(node: Node) => void` | - |
| `beginLink` | `(node: Node) => void` | - |
| `updateHover` | `(target: Node \| null) => void` | - |
| `updatePreview` | `(position: Vector3) => void` | - |
| `confirmLink` | `() => boolean` | Success |
| `cancelLink` | `() => void` | - |
| `removeLink` | `(linkId: string) => boolean` | Success |
| `getLinks` | `() => Link[]` | All links |
| `getLinksFrom` | `(nodeId: string) => Link[]` | Outgoing links |
| `getLinksTo` | `(nodeId: string) => Link[]` | Incoming links |
| `getNode` | `(nodeId: string) => Node \| undefined` | Node or undefined |
| `getState` | `() => LinkEngineState` | Current state |
| `getBezierCurvePoints` | `(link: Link, res?: number) => Vector3[]` | Curve points |
| `getPreviewLinePoints` | `() => Vector3[]` | Preview points |

#### Callbacks

```typescript
onLinkCreated?: (link: Link) => void
onLinkRemoved?: (linkId: string) => void
onLinkingStarted?: (node: Node) => void
onLinkingCancelled?: () => void
onHoverTargetChanged?: (node: Node | null) => void
```

### NodeInteractionEngine

#### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `registerNode` | `(mesh: Object3D, id: string, radius: number) => void` | - |
| `unregisterNode` | `(id: string) => void` | - |
| `tick` | `(camera, pointer, leftDown, rightDown) => void` | - |
| `getHoveredNode` | `() => string \| null` | Node ID |
| `getSelectedNode` | `() => string \| null` | Node ID |
| `isDragging` | `() => boolean` | Dragging state |
| `getState` | `() => InteractionState` | State |
| `setDragPlaneMode` | `(mode, plane?) => void` | - |
| `setSmoothingFactor` | `(factor: number) => void` | - |

#### Callbacks

```typescript
onHoverStart?: (nodeId: string) => void
onHoverEnd?: (nodeId: string) => void
onSelect?: (nodeId: string) => void
onDeselect?: (nodeId: string) => void
onDragStart?: (nodeId: string) => void
onDrag?: (nodeId: string, position: Vector3) => void
onDragEnd?: (nodeId: string) => void
```

---

## Best Practices

### 1. Memory Management

```typescript
// ✅ Good: Clean up references
useEffect(() => {
  const engine = new NodeInteractionEngine();
  return () => engine.clear();
}, []);

// ❌ Bad: Leave hanging references
const engine = new NodeInteractionEngine();
```

### 2. Event Handling

```typescript
// ✅ Good: Debounce updates
const debouncedUpdate = useMemo(
  () => debounce((pos) => updateNode(pos), 16),
  []
);

engine.onDrag = (id, pos) => debouncedUpdate(pos);

// ❌ Bad: Update every frame without throttling
engine.onDrag = (id, pos) => updateNode(pos);
```

### 3. Performance

```typescript
// ✅ Good: Memoize expensive computations
const colorMap = useMemo(() => {
  const map = new Map();
  // ... build map
  return map;
}, [links]);

// ❌ Bad: Recreate on every render
const colorMap = buildColorMap(); // Called every render
```

### 4. State Synchronization

```typescript
// ✅ Good: Keep engine and React state in sync
engine.onLinkCreated = (link) => {
  setLinks(prev => [...prev, link]);
};

// ❌ Bad: Out of sync states
setLinks([...]); // Updates UI
// But engine still has old data
```

### 5. Error Handling

```typescript
// ✅ Good: Validate before operations
if (engine.isDuplicateLink(from, to)) {
  console.warn('Link already exists');
  return;
}

// ❌ Bad: Silent failures
engine.confirmLink(); // May fail silently
```

---

## Type Definitions Quick Reference

```typescript
// Node
interface Node {
  id: string;
  position: Vector3;
  type?: string;
  data?: Record<string, any>;
}

// Link
interface Link {
  id: string;
  from: string;
  to: string;
  type?: string;
  data?: Record<string, any>;
  createdAt?: number;
}

// Interaction State
interface InteractionState {
  hoveredNode: string | null;
  selectedNode: string | null;
  dragging: boolean;
  dragStartPos: Vector3 | null;
  dragCurrentPos: Vector3 | null;
  dragPlane: Plane | null;
}

// Link State
interface LinkEngineState {
  active: boolean;
  source: Node | null;
  hoverTarget: Node | null;
  preview: Vector3 | null;
  links: Link[];
  selectedLinkId: string | null;
}
```

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
