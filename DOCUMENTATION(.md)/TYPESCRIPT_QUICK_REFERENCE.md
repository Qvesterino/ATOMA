# ATOMA TypeScript Systems - Quick Reference

Fast lookup for common tasks and API usage.

---

## LinkEngine Quick Start

### Initialize
```typescript
import { LinkEngine } from './LinkEngine';

const engine = new LinkEngine({
  allowSelfLinks: false,
  maxLinksPerNode: 0,
  lineCurvature: 0.5
});
```

### Register Nodes
```typescript
const node: Node = {
  id: 'node_1',
  position: new THREE.Vector3(0, 0, 0)
};

engine.registerNode(node);
```

### Create Link
```typescript
// User selects source node
engine.beginLink(sourceNode);

// User hovers target node
engine.updateHover(targetNode);

// User clicks to confirm
const success = engine.confirmLink();
```

### Get Links
```typescript
const allLinks = engine.getLinks();
const outgoing = engine.getLinksFrom('node_1');
const incoming = engine.getLinksTo('node_2');
```

### Events
```typescript
engine.onLinkCreated = (link) => console.log('Created:', link);
engine.onLinkRemoved = (linkId) => console.log('Removed:', linkId);
engine.onHoverTargetChanged = (node) => console.log('Hovering:', node?.id);
```

---

## LinkRenderer Quick Start

### Basic Usage
```typescript
import { LinkRenderer } from './LinkRenderer';

<Canvas>
  <LinkRenderer
    links={links}
    nodes={nodes}
    resolution={32}
    curvature={0.5}
  />
</Canvas>
```

### With Shader Material
```typescript
import { createLinkShaderMaterial } from './LinkRenderer';

const material = createLinkShaderMaterial();

<LinkRenderer
  links={links}
  nodes={nodes}
  material={material}
  animateShaderUniforms={true}
/>
```

### With Colors
```typescript
const colorMap = new Map([
  ['link_1', new THREE.Color(0xff6600)],
  ['link_2', new THREE.Color(0x00ddff)]
]);

<LinkRenderer
  links={links}
  nodes={nodes}
  colorMap={colorMap}
/>
```

### Selection Highlight
```typescript
<LinkRenderer
  links={links}
  nodes={nodes}
  selectedLinkId={selectedId}
  oneLinkHighlight={true}
/>
```

---

## NodeInteractionEngine Quick Start

### Initialize
```typescript
import { NodeInteractionEngine, usePointerTracker } from './NodeInteractionEngine';

const engine = useRef(new NodeInteractionEngine({
  dragConfig: {
    planeMode: 'XZ',
    snapToGrid: false
  }
}));

const { pointer, mouseDown } = usePointerTracker();
const { camera } = useThree();
```

### Register Nodes
```typescript
const mesh = new THREE.Mesh(geometry);
engine.current.registerNode(mesh, 'node_1', 1.0); // radius = 1.0
```

### Update Loop
```typescript
useFrame(() => {
  engine.current.tick(
    camera,
    pointer,
    mouseDown.left,
    mouseDown.right
  );
});
```

### Handle Events
```typescript
engine.onHoverStart = (nodeId) => highlight(nodeId);
engine.onHoverEnd = (nodeId) => unhighlight(nodeId);
engine.onSelect = (nodeId) => select(nodeId);
engine.onDrag = (nodeId, pos) => updatePosition(nodeId, pos);
engine.onDragEnd = (nodeId) => save(nodeId);
```

### Query State
```typescript
const hoveredId = engine.getHoveredNode();
const selectedId = engine.getSelectedNode();
const isDragging = engine.isDragging();
```

---

## Common Patterns

### Pattern 1: Click to Link
```typescript
nodeEngine.onSelect = (nodeId) => {
  if (!linkingStarted) {
    linkEngine.beginLink(nodes.get(nodeId));
    setLinking(true);
  } else {
    const target = nodes.get(nodeId);
    linkEngine.updateHover(target);
    linkEngine.confirmLink();
    setLinking(false);
  }
};
```

### Pattern 2: Drag to Create Link
```typescript
nodeEngine.onDragStart = (nodeId) => {
  linkEngine.beginLink(nodes.get(nodeId));
};

nodeEngine.onDrag = (nodeId, pos) => {
  linkEngine.updatePreview(pos);
  // Check if hovering target node
  const hovering = findNodeAt(pos);
  linkEngine.updateHover(hovering);
};

nodeEngine.onDragEnd = (nodeId) => {
  linkEngine.confirmLink();
};
```

### Pattern 3: Right-Click Menu
```typescript
document.addEventListener('contextmenu', (e) => {
  const hoveredId = nodeEngine.getHoveredNode();
  if (hoveredId) {
    e.preventDefault();
    showContextMenu(hoveredId);
  }
});
```

### Pattern 4: Save/Load
```typescript
// Save
const state = linkEngine.exportState();
localStorage.setItem('graph', JSON.stringify(state));

// Load
const saved = JSON.parse(localStorage.getItem('graph'));
linkEngine.importState(saved);
```

---

## Configuration Quick Guide

### LinkEngine Config
```typescript
{
  maxLinksPerNode: 5,      // 0 = unlimited
  allowSelfLinks: false,   // true = allow A→A
  lineCurvature: 0.5,      // 0-1, higher = more curved
  bezierResolution: 32,    // Points per Bezier curve
  enableValidation: true   // Validate links
}
```

### NodeInteractionEngine Config
```typescript
{
  hoverDistance: 1.0,
  dragConfig: {
    enabled: true,
    smoothing: 0.15,          // 0-1, lower = responsive
    planeMode: 'XZ',          // 'XY', 'XZ', 'custom'
    snapToGrid: false,
    gridSize: 1.0
  },
  enableSmoothing: true,
  smoothingFactor: 0.15
}
```

### LinkRenderer Props
```typescript
{
  links: Link[],
  nodes: Map<string, Node>,
  material?: ShaderMaterial,
  resolution: 32,              // Bezier samples
  curvature: 0.5,              // Control point offset
  animateShaderUniforms: true,
  colorMap?: Map<string, Color>,
  selectedLinkId?: string,
  oneLinkHighlight: false
}
```

---

## Type Definitions

### Node
```typescript
interface Node {
  id: string;
  position: Vector3;
  type?: string;
  data?: Record<string, any>;
}
```

### Link
```typescript
interface Link {
  id: string;
  from: string;
  to: string;
  type?: string;
  data?: Record<string, any>;
  createdAt?: number;
}
```

### Interaction State
```typescript
interface InteractionState {
  hoveredNode: string | null;
  selectedNode: string | null;
  dragging: boolean;
  dragStartPos: Vector3 | null;
  dragCurrentPos: Vector3 | null;
  dragPlane: Plane | null;
}
```

---

## Common Methods

### LinkEngine
| Method | Purpose |
|--------|---------|
| `registerNode(node)` | Add node to engine |
| `beginLink(node)` | Start linking from node |
| `confirmLink()` | Create link if valid |
| `getLinks()` | Get all links |
| `removeLink(id)` | Delete a link |
| `isDuplicateLink(a,b)` | Check if link exists |
| `getBezierCurvePoints(link)` | Get rendering points |
| `exportState()` | Serialize state |

### NodeInteractionEngine
| Method | Purpose |
|--------|---------|
| `registerNode(mesh, id, radius)` | Add node hitbox |
| `tick(camera, pointer, left, right)` | Main update |
| `getHoveredNode()` | Get hover ID |
| `getSelectedNode()` | Get select ID |
| `isDragging()` | Check drag state |
| `setDragPlaneMode(mode)` | Change drag plane |
| `setSmoothingFactor(f)` | Change smoothing |

### LinkRenderer
| Prop | Purpose |
|-----|---------|
| `links` | Links to render |
| `nodes` | Node positions map |
| `material` | Custom shader material |
| `resolution` | Bezier curve detail |
| `colorMap` | Link colors |
| `selectedLinkId` | Highlight link |

---

## Event Callbacks

### LinkEngine Events
```typescript
onLinkCreated?: (link) => void       // Link created
onLinkRemoved?: (linkId) => void     // Link removed
onLinkingStarted?: (node) => void    // Begin link mode
onLinkingCancelled?: () => void      // Cancel link mode
onHoverTargetChanged?: (node) => void // Hover target changed
```

### NodeInteractionEngine Events
```typescript
onHoverStart?: (nodeId) => void      // Mouse enter
onHoverEnd?: (nodeId) => void        // Mouse leave
onSelect?: (nodeId) => void          // Node selected
onDeselect?: (nodeId) => void        // Node deselected
onDragStart?: (nodeId) => void       // Drag began
onDrag?: (nodeId, pos) => void       // Dragging
onDragEnd?: (nodeId) => void         // Drag ended
```

---

## Shader Uniforms

LinkRenderer automatically updates these uniforms each frame:

```glsl
uniform float time;           // Elapsed time (seconds)
uniform float energy;         // 0-1, activity level
uniform float intensity;      // Visual intensity
uniform float linkType;       // Link type ID
uniform float selected;       // 1 if selected, 0 otherwise
uniform vec3 color;           // Link color
```

Example usage in shader:
```glsl
void main() {
  float pulse = sin(time * 2.0) * 0.5 + 0.5;
  float alpha = intensity * energy * pulse;
  if (selected > 0.5) alpha *= 1.5;
  gl_FragColor = vec4(color, alpha);
}
```

---

## Performance Tips

### For Many Links (100+)
```typescript
// Use batch renderer with instancing
<LinkBatchRenderer
  links={links}
  nodes={nodes}
  resolution={16}    // Lower resolution
  useInstancing={true}
/>
```

### For Smooth Dragging
```typescript
{
  dragConfig: {
    smoothing: 0.2,  // Higher = smoother
    snapToGrid: false
  }
}
```

### For Responsive UI
```typescript
{
  dragConfig: {
    smoothing: 0.05,  // Lower = responsive
  }
}
```

---

## Debugging

### Check Link State
```typescript
const state = linkEngine.getState();
console.log({
  active: state.active,
  source: state.source?.id,
  target: state.hoverTarget?.id,
  preview: state.preview
});
```

### Check Interaction State
```typescript
const stats = nodeEngine.getStats();
console.log({
  totalNodes: stats.totalNodes,
  hovered: stats.hoveredNode,
  selected: stats.selectedNode,
  dragging: stats.isDragging
});
```

### Validate Links
```typescript
linkEngine.validateLinks();
const links = linkEngine.getLinks();
console.log(`Valid links: ${links.length}`);
```

---

## Integration Checklist

- [ ] Import three TypeScript files
- [ ] Initialize LinkEngine
- [ ] Initialize NodeInteractionEngine
- [ ] Register nodes with both systems
- [ ] Setup event callbacks
- [ ] Add LinkRenderer component
- [ ] Add update loop (useFrame)
- [ ] Test linking workflow
- [ ] Test interaction workflow
- [ ] Test rendering
- [ ] Optimize performance if needed

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Links not rendering | Check nodes Map has correct positions |
| Dragging feels sluggish | Increase `smoothing`, decrease `damping` |
| Duplicate links created | Enable validation: `enableValidation: true` |
| Nodes hard to select | Increase hitbox `radius` parameter |
| Memory growing | Call `engine.clear()` on cleanup |
| Links snapping wrong | Check `planeMode` configuration |

---

## React Three Fiber Hooks

```typescript
// Use interaction engine
const engine = useNodeInteractionEngine(config);

// Track pointer
const { pointer, mouseDown } = usePointerTracker();

// Get camera
const { camera } = useThree();

// Animation frame
useFrame((state, delta) => {
  engine.tick(camera, pointer, mouseDown.left, mouseDown.right);
});
```

---

## Export/Import

### Save Graph
```typescript
const data = linkEngine.exportState();
const json = JSON.stringify(data);
localStorage.setItem('myGraph', json);
```

### Load Graph
```typescript
const json = localStorage.getItem('myGraph');
const data = JSON.parse(json);
linkEngine.importState(data);
```

---

**Version**: 1.0  
**Quick Reference for Production Use**
