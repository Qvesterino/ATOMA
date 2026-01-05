# Node Integration Guide - SigmaNode & QuantumNode

## Overview

This guide shows how to integrate **SigmaNode** and **QuantumNode** special node types into the ATOMA game, along with the new **LinkLine shaders** and **VisualizationEngine** for clustering.

---

## 1. Update AINodes.js to Support Special Nodes

### Current Structure
AINodes.js already has support for special node types in `specialNodeTypes`:

```javascript
this.specialNodeTypes = ['sigma', 'quantum', 'emotional'];
```

### Enhanced createNode Method

Update the `createNode()` method in AINodes.js to handle sigma and quantum nodes:

```javascript
createNode(category, position, index, isSpecial = false) {
  let mesh;
  const scale = 1.0;
  
  // Create node mesh based on category
  if (category === 'sigma' && isSpecial) {
    // Use SigmaNode model
    mesh = this.createSigmaNode(position, scale);
  } else if (category === 'quantum' && isSpecial) {
    // Use QuantumNode model
    mesh = this.createQuantumNode(position, scale);
  } else {
    // Use standard node models
    mesh = EnhancedNodeModels.createNode(category, scale);
  }
  
  mesh.position.copy(position);
  this.scene.add(mesh);
  
  // Add physics/data
  const nodeData = {
    mesh,
    category,
    position,
    index,
    isSpecial,
    isActive: false,
    connections: [],
    frequency: Math.random(),
    behavior: this.getBehavior(category),
  };
  
  return nodeData;
}

/**
 * Create Sigma Node (obsidian hexagonal prism with fractal core)
 */
createSigmaNode(position, scale) {
  const group = new THREE.Group();
  
  // Obsidian prism base
  const geometry = new THREE.ConeGeometry(1.2 * scale, 2.0 * scale, 6);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,      // Neon green
    emissive: 0x00aa00,
    shininess: 100,
    wireframe: false,
  });
  
  const prism = new THREE.Mesh(geometry, material);
  group.add(prism);
  
  // Fractal core (recursive tetrahedra)
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    wireframe: true,
  });
  
  const coreGeometry = new THREE.TetrahedronGeometry(0.5 * scale, 2);
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.z = 0.3 * scale;
  core.scale.set(0.6, 0.6, 0.6);
  group.add(core);
  
  // Outer glow ring
  const ringGeometry = new THREE.TorusGeometry(1.5 * scale, 0.1 * scale, 16, 32);
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    shininess: 100,
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 4;
  group.add(ring);
  
  return group;
}

/**
 * Create Quantum Node (pulsing violet orb with holographic rings)
 */
createQuantumNode(position, scale) {
  const group = new THREE.Group();
  
  // Pulsing core sphere
  const coreGeometry = new THREE.IcosahedronGeometry(1.0 * scale, 4);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: 0x6633ff,      // Violet
    emissive: 0x6633ff,
    shininess: 100,
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  
  // Holographic rings (3 perpendicular rings)
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0x6633ff,
    emissive: 0x6633ff,
    wireframe: false,
    transparent: true,
    opacity: 0.6,
  });
  
  for (let i = 0; i < 3; i++) {
    const ringGeometry = new THREE.TorusGeometry(1.4 * scale, 0.05 * scale, 32, 64);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // Rotate perpendicular to each other
    if (i === 0) ring.rotation.x = 0;
    else if (i === 1) ring.rotation.y = Math.PI / 3;
    else ring.rotation.z = Math.PI / 6;
    
    group.add(ring);
  }
  
  return group;
}

/**
 * Get node behavior based on category
 */
getBehavior(category) {
  const behaviors = {
    input: 'stable',
    process: 'reactive',
    integration: 'stable',
    analytics: 'reactive',
    storage: 'stable',
    control: 'reactive',
    sigma: 'sigma',      // Special
    quantum: 'quantum',  // Special
  };
  
  return behaviors[category] || 'stable';
}
```

---

## 2. Update main.js to Use New Systems

### Add Imports

```javascript
import { TrafficEngine } from './TrafficEngine.ts';
import { SynergyEngine } from './SynergyEngine.ts';
import { VisualizationEngine } from './VisualizationEngine.ts';
```

### Initialize Engines in AtomaGame

```javascript
initializeEngines() {
  // Create synergy engine
  this.synergyEngine = new SynergyEngine(this.nodesMap);
  
  // Create traffic engine
  this.trafficEngine = new TrafficEngine(
    this.nodesMap,
    this.linksArray,
    this.synergyEngine,
    {
      maxPulseSpeed: 1.5,
      maxBandwidth: 1.0,
    }
  );
  
  // Create visualization engine for clustering
  this.visualizationEngine = new VisualizationEngine(
    Array.from(this.nodesMap.values()),
    undefined, // traffic states
    undefined, // synergies
    {
      clusterCount: 5,
      enableHierarchy: true,
      enableForceLayout: true,
    }
  );
}
```

### Update animate() Loop

```javascript
animate = () => {
  requestAnimationFrame(this.animate);
  
  const delta = this.clock.getDelta();
  this.time += delta;
  
  // Update traffic
  if (this.trafficEngine) {
    this.trafficEngine.update(delta);
  }
  
  // Update visualization with traffic data
  if (this.visualizationEngine && this.trafficEngine) {
    const allTraffic = new Map();
    this.trafficEngine.getAllTraffic().forEach(traffic => {
      allTraffic.set(traffic.linkId, traffic);
    });
    this.visualizationEngine.update(allTraffic);
  }
  
  // Update link materials with traffic data
  this.updateLinkMaterials(delta);
  
  // Update node animations
  this.updateNodeAnimations(delta);
  
  this.renderer.render(this.scene, this.camera);
};
```

---

## 3. Update Link Rendering with New Shaders

### Create LinkLine Material

```javascript
createLinkMaterial(traffic, synergyResult) {
  const vertexShader = `/* LinkLine.vertex.glsl content */`;
  const fragmentShader = `/* LinkLine.fragment.glsl content */`;
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      load: { value: traffic.load },
      speed: { value: traffic.speed },
      energy: { value: traffic.energy },
      baseColor: { value: new THREE.Color(synergyResult.visual.color) },
      warpIntensity: { value: synergyResult.visual.warpIntensity },
      glitch: { value: synergyResult.visual.glitch },
      thickness: { value: synergyResult.visual.thickness },
      synergyType: { value: this.synergyTypeToInt(synergyResult.type) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  
  return material;
}

/**
 * Convert synergy type to integer for shader
 */
synergyTypeToInt(type) {
  const typeMap = {
    linear: 0,
    complement: 1,
    fusion: 2,
    quantum: 3,
    sigma: 4,
    fractal: 5,
    none: 6,
  };
  return typeMap[type] ?? 6;
}

/**
 * Update link materials every frame
 */
updateLinkMaterials(delta) {
  for (const linkMesh of this.linkMeshes) {
    const traffic = this.trafficEngine.getTraffic(linkMesh.userData.linkId);
    
    if (traffic && linkMesh.material.uniforms) {
      // Update uniforms from traffic
      linkMesh.material.uniforms.time.value = this.time;
      linkMesh.material.uniforms.load.value = traffic.load;
      linkMesh.material.uniforms.speed.value = traffic.speed;
      linkMesh.material.uniforms.energy.value = traffic.energy;
      linkMesh.material.uniforms.glitch.value = traffic.metadata?.glitch ?? 0;
    }
  }
}
```

---

## 4. Node Data Structure

### Enhanced Node Interface

```typescript
interface NodeData {
  mesh: THREE.Object3D;
  category: string;              // input, process, ..., sigma, quantum
  position: THREE.Vector3;
  index: number;
  isSpecial: boolean;            // Sigma/Quantum flag
  isActive: boolean;
  connections: string[];         // Connected node IDs
  frequency: number;             // 0.0-1.0
  behavior: string;              // stable, reactive, quantum, sigma
  layer: string;                 // Match category
  id: string;                    // Node ID
}
```

---

## 5. Special Node Behaviors

### Sigma Node (Authority & Validation)
- **Visual:** Obsidian hexagonal prism with fractal core, neon green glow
- **Behavior:** Validates connections, regulates traffic
- **Load Effect:** Increases traffic validation (Sigma-type synergy)
- **Traffic Impact:** Lower speed (validation overhead), higher glitch (authority)

```javascript
if (node.category === 'sigma') {
  // Sigma validation aura
  this.createValidationAura(node);
  
  // Validate nearby connections
  this.validateNearbyConnections(node);
}
```

### Quantum Node (Superposition & Uncertainty)
- **Visual:** Pulsing violet orb with holographic rings, unstable rotation
- **Behavior:** Creates superposition connections, erratic patterns
- **Load Effect:** Variable, unpredictable traffic patterns
- **Traffic Impact:** High speed variation, chromatic glitch effects

```javascript
if (node.category === 'quantum') {
  // Quantum pulse animation
  this.animateQuantumPulse(node);
  
  // Create random connection variations
  this.generateQuantumFluctuations(node);
}
```

---

## 6. Cluster Visualization Integration

### Display Clusters in Scene

```javascript
visualizeClusters() {
  const clusters = this.visualizationEngine.getClusters();
  
  for (const cluster of clusters) {
    // Create cluster visualization (transparent sphere)
    const geometry = new THREE.SphereGeometry(cluster.radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: cluster.color,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(cluster.centroid);
    mesh.userData.clusterId = cluster.id;
    
    this.scene.add(mesh);
    this.clusterMeshes.push(mesh);
  }
}

/**
 * Animate cluster expansion/collapse
 */
toggleClusterVisualization(clusterId) {
  this.visualizationEngine.toggleCluster(clusterId);
  
  // Update camera to frame selected cluster
  const frame = this.visualizationEngine.getCameraFrame(clusterId);
  if (frame) {
    this.animateCamera(frame.position, frame.target, 1.0);
  }
}
```

---

## 7. Complete Integration Example

```javascript
class AtomaGame {
  constructor() {
    this.clock = new THREE.Clock();
    this.init();
    this.setupEngines();
    this.createNodes();
    this.createLinks();
    this.animate();
  }
  
  setupEngines() {
    // Initialize all engines
    this.synergyEngine = new SynergyEngine(this.nodesMap);
    this.trafficEngine = new TrafficEngine(this.nodesMap, this.links, this.synergyEngine);
    this.visualizationEngine = new VisualizationEngine(Array.from(this.nodesMap.values()));
  }
  
  createNodes() {
    this.aiNodes.createNodes('chamber', 20);
    this.linkSigmaAndQuantumNodes();
  }
  
  linkSigmaAndQuantumNodes() {
    // Find sigma and quantum nodes
    const sigmaNodes = this.aiNodes.nodes.filter(n => n.category === 'sigma');
    const quantumNodes = this.aiNodes.nodes.filter(n => n.category === 'quantum');
    
    // Connect them with special link visuals
    for (const sigma of sigmaNodes) {
      for (const quantum of quantumNodes) {
        this.createLink(sigma, quantum, 'validation');
      }
    }
  }
  
  animate = () => {
    requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    // Update all systems
    this.trafficEngine.update(delta);
    this.visualizationEngine.update(this.trafficEngine.getAllTraffic());
    this.updateLinkMaterials(delta);
    
    this.renderer.render(this.scene, this.camera);
  };
}
```

---

## 8. Performance Optimization

### Tips for Integration
1. **Lazy Load:** Only update traffic/visualization on key frames
2. **Batching:** Group similar link materials
3. **Level of Detail:** Reduce cluster visualization at distance
4. **Caching:** Cache synergy calculations

```javascript
// Update only every Nth frame
let frameCounter = 0;
const UPDATE_FREQUENCY = 2; // Every 2 frames

animate = () => {
  frameCounter++;
  
  if (frameCounter % UPDATE_FREQUENCY === 0) {
    this.trafficEngine.update(delta);
    this.visualizationEngine.update(...);
  }
  
  // Always update rendering
  this.updateLinkMaterials(delta);
  
  requestAnimationFrame(this.animate);
};
```

---

## Summary

The integration brings together:

✅ **SigmaNode & QuantumNode** - Special node types with unique visuals and behaviors  
✅ **LinkLine Shaders** - Synergy-aware link rendering with procedural effects  
✅ **TrafficEngine** - Real-time data flow simulation  
✅ **SynergyEngine** - Intelligent connection analysis  
✅ **VisualizationEngine** - K-means clustering with hierarchical organization  

All systems work together to create a cohesive, dynamic AI consciousness visualization! 🧠✨
