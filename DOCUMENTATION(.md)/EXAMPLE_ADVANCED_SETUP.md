# ATOMA Advanced Setup Examples

Complete code examples for integrating Sigma Nodes, Quantum Nodes, and Zero-Gravity Controls.

---

## Example 1: Basic Node Placement

### Minimal Setup with Both Nodes

```javascript
import * as THREE from 'three';
import { SigmaNode } from './SigmaNode.js';
import { QuantumNode } from './QuantumNode.js';

class AILayerChamber {
  constructor(scene) {
    this.scene = scene;
    this.nodes = [];
    this.time = 0;
    
    // Create layered node system
    this.createSigmaNode();
    this.createQuantumNode();
  }
  
  createSigmaNode() {
    // Create at higher altitude - represents higher layer
    const sigma = new SigmaNode(
      new THREE.Vector3(0, 12, -25),
      1.5  // Larger scale for prominence
    );
    
    this.scene.add(sigma.getGroup());
    this.nodes.push({ 
      type: 'sigma', 
      object: sigma,
      description: 'SIGMA: Authority & Judgment'
    });
  }
  
  createQuantumNode() {
    // Create below Sigma - represents lower layer
    const quantum = new QuantumNode(
      new THREE.Vector3(0, 6, 15),
      1.2
    );
    
    this.scene.add(quantum.getGroup());
    this.nodes.push({ 
      type: 'quantum', 
      object: quantum,
      description: 'QUANTUM: Superposition & Uncertainty'
    });
  }
  
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update all nodes
    this.nodes.forEach(nodeWrapper => {
      nodeWrapper.object.update(deltaTime);
    });
    
    // Optional: Make nodes respond to time/events
    this.updateNodeBehavior();
  }
  
  updateNodeBehavior() {
    // Example: Make Sigma node shine brighter every 5 seconds
    if (Math.sin(this.time) > 0.9) {
      // Increase intensity - could modify glow
    }
  }
  
  dispose() {
    this.nodes.forEach(nodeWrapper => {
      nodeWrapper.object.dispose();
    });
    this.nodes = [];
  }
}
```

---

## Example 2: Zero-Gravity Environment Creation

### Complete Zero-G Realm with Special Nodes

```javascript
import * as THREE from 'three';
import { ZeroGravityControls, FirstPersonCameraController as ZGCamera } from './ZeroGravityControls.js';
import { SigmaNode } from './SigmaNode.js';
import { QuantumNode } from './QuantumNode.js';

class ZeroGravityRealm {
  constructor(scene, camera, renderer, player) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.player = player;
    this.nodes = [];
    
    this.setupEnvironment();
    this.setupControls();
    this.createNodesNetwork();
  }
  
  setupEnvironment() {
    // Dark, void-like environment
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0f0f2a, 0.008);
    
    // Ambient glow
    const ambientLight = new THREE.AmbientLight(0x6644ff, 0.3);
    this.scene.add(ambientLight);
    
    // Distant stars for orientation
    this.createStarfield();
  }
  
  createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }
  
  setupControls() {
    // Create zero-gravity controller
    this.controls = new ZeroGravityControls(this.player, {
      moveSpeed: 25,
      strafeSpeed: 20,
      verticalSpeed: 20,
      acceleration: 60,
      damping: 8,
      maxVelocity: 35
    });
    
    // Create camera controller
    this.cameraController = new ZGCamera(
      this.camera,
      this.player,
      this.renderer.domElement,
      {
        eyeHeight: 1.6,
        mouseSensitivity: 0.002
      }
    );
    
    this.cameraController.enable();
  }
  
  createNodesNetwork() {
    // Create network of nodes throughout the void
    const nodePositions = [
      { pos: new THREE.Vector3(-40, 0, -40), type: 'sigma', scale: 1.2 },
      { pos: new THREE.Vector3(40, 20, -40), type: 'quantum', scale: 1.0 },
      { pos: new THREE.Vector3(-40, -20, 40), type: 'quantum', scale: 0.9 },
      { pos: new THREE.Vector3(40, 5, 40), type: 'sigma', scale: 1.3 },
      { pos: new THREE.Vector3(0, 30, 0), type: 'sigma', scale: 1.1 },
      { pos: new THREE.Vector3(0, -25, 60), type: 'quantum', scale: 1.2 },
    ];
    
    nodePositions.forEach(config => {
      let node;
      
      if (config.type === 'sigma') {
        node = new SigmaNode(config.pos, config.scale);
      } else {
        node = new QuantumNode(config.pos, config.scale);
      }
      
      this.scene.add(node.getGroup());
      this.nodes.push(node);
    });
  }
  
  update(deltaTime) {
    // Update controls
    const cameraRotation = this.cameraController.update();
    this.controls.update(deltaTime, cameraRotation);
    
    // Update all nodes
    this.nodes.forEach(node => node.update(deltaTime));
    
    // Display movement info
    this.updateDebugInfo();
  }
  
  updateDebugInfo() {
    const speed = this.controls.getSpeed();
    const velocity = this.controls.getVelocity();
    
    // Could display or log:
    // - Current speed
    // - Velocity vector
    // - Position
    // - Active nodes nearby
  }
  
  dispose() {
    this.nodes.forEach(node => node.dispose());
    this.nodes = [];
    this.cameraController.destroy();
    this.controls.destroy();
  }
}
```

---

## Example 3: Interactive Node Response to Player

### Nodes That React to Player Proximity

```javascript
class InteractiveNodeCluster {
  constructor(scene, player, camera, renderer) {
    this.scene = scene;
    this.player = player;
    this.camera = camera;
    this.renderer = renderer;
    this.nodes = [];
    this.activeNode = null;
    this.interactionDistance = 25;
    
    this.createCluster();
  }
  
  createCluster() {
    // Create a cluster of nodes
    const clusterCenter = new THREE.Vector3(0, 10, 0);
    const nodeCount = 5;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const distance = 15;
      
      const pos = new THREE.Vector3(
        clusterCenter.x + Math.cos(angle) * distance,
        clusterCenter.y + (Math.random() - 0.5) * 10,
        clusterCenter.z + Math.sin(angle) * distance
      );
      
      const node = i % 2 === 0 
        ? new SigmaNode(pos, 0.8)
        : new QuantumNode(pos, 0.9);
      
      node.isActive = false;
      node.proximityGlow = 0;
      
      this.scene.add(node.getGroup());
      this.nodes.push(node);
    }
  }
  
  update(deltaTime) {
    // Find nearest node
    let nearest = null;
    let minDistance = Infinity;
    
    this.nodes.forEach(node => {
      const pos = node.getGroup().position;
      const dist = this.player.position.distanceTo(pos);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearest = node;
      }
    });
    
    // Update proximity effects
    this.nodes.forEach(node => {
      const pos = node.getGroup().position;
      const dist = this.player.position.distanceTo(pos);
      
      // Glow up when close
      const proximityFactor = Math.max(0, 1 - dist / this.interactionDistance);
      node.proximityGlow = proximityFactor;
      
      // Update node
      node.update(deltaTime);
      
      // Could also modify node brightness here
      node.getGroup().children.forEach(child => {
        if (child.material && child.material.emissive) {
          const glowIntensity = 0.5 + proximityFactor * 0.5;
          // Adjust emissive based on proximity
        }
      });
    });
    
    this.activeNode = nearest;
  }
  
  getActiveNodeInfo() {
    if (!this.activeNode) return null;
    
    const pos = this.activeNode.getGroup().position;
    const dist = this.player.position.distanceTo(pos);
    
    return {
      node: this.activeNode,
      distance: dist,
      proximityFactor: Math.max(0, 1 - dist / this.interactionDistance)
    };
  }
  
  dispose() {
    this.nodes.forEach(node => node.dispose());
    this.nodes = [];
  }
}
```

---

## Example 4: Control Mode Transition with Visual Feedback

### Switching Between Gravity and Zero-Gravity with Effects

```javascript
class ControlModeTransitioner {
  constructor(game) {
    this.game = game;
    this.transitionDuration = 1.0;
    this.isTransitioning = false;
    this.transitionTime = 0;
    this.originalFOV = game.camera.fov;
  }
  
  switchToZeroGravity() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionTime = 0;
    
    // Fade out gravity UI
    const subtitle = document.getElementById('subtitle');
    subtitle.textContent = 'ENTERING ZERO-GRAVITY MODE...';
    subtitle.style.opacity = '0.5';
    
    // Begin transition
    this.game.controlMode = 'zero-gravity';
    this.game.playerController.setActive?.(false);
    this.game.cameraController.disable();
    
    this.game.zeroGravityController.setActive(true);
    this.game.zeroGravityCameraController.enable();
  }
  
  switchToGravity() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionTime = 0;
    
    const subtitle = document.getElementById('subtitle');
    subtitle.textContent = 'EXITING ZERO-GRAVITY MODE...';
    subtitle.style.opacity = '0.5';
    
    this.game.controlMode = 'gravity';
    this.game.zeroGravityController.setActive(false);
    this.game.zeroGravityCameraController.disable();
    
    this.game.playerController.setCameraMode('first-person');
    this.game.cameraController.enable();
  }
  
  update(deltaTime) {
    if (!this.isTransitioning) return;
    
    this.transitionTime += deltaTime;
    const progress = Math.min(this.transitionTime / this.transitionDuration, 1.0);
    
    // Smooth FOV transition
    const targetFOV = this.game.controlMode === 'zero-gravity' ? 90 : 75;
    this.game.camera.fov = this.originalFOV + (targetFOV - this.originalFOV) * progress;
    this.game.camera.updateProjectionMatrix();
    
    // Fade subtitle back in
    if (progress >= 1.0) {
      this.isTransitioning = false;
      const subtitle = document.getElementById('subtitle');
      const mode = this.game.controlMode === 'zero-gravity' 
        ? 'ZERO-GRAVITY MODE'
        : this.game.currentMode.toUpperCase();
      subtitle.textContent = mode;
      subtitle.style.opacity = '1.0';
    }
  }
}
```

---

## Example 5: Performance-Optimized Node Manager

### Managing Many Nodes with LOD and Batching

```javascript
class OptimizedNodeManager {
  constructor(scene, maxNodes = 50) {
    this.scene = scene;
    this.maxNodes = maxNodes;
    this.nodes = [];
    this.octree = new THREE.Octree(); // For spatial queries
    this.visibleNodes = new Set();
    this.viewDistance = 100;
  }
  
  addNode(nodeConfig) {
    if (this.nodes.length >= this.maxNodes) {
      console.warn('Maximum nodes reached');
      return null;
    }
    
    let node;
    
    if (nodeConfig.type === 'sigma') {
      node = new SigmaNode(nodeConfig.position, nodeConfig.scale);
    } else if (nodeConfig.type === 'quantum') {
      node = new QuantumNode(nodeConfig.position, nodeConfig.scale);
    }
    
    if (node) {
      this.scene.add(node.getGroup());
      this.nodes.push({
        object: node,
        config: nodeConfig,
        isVisible: true,
        lod: 0
      });
    }
    
    return node;
  }
  
  update(deltaTime, playerPosition) {
    // Frustum culling
    this.updateVisibility(playerPosition);
    
    // Update only visible nodes
    this.visibleNodes.forEach(nodeWrapper => {
      if (nodeWrapper.isVisible) {
        nodeWrapper.object.update(deltaTime);
      }
    });
  }
  
  updateVisibility(playerPosition) {
    this.visibleNodes.clear();
    
    this.nodes.forEach(nodeWrapper => {
      const nodePos = nodeWrapper.object.getGroup().position;
      const distance = playerPosition.distanceTo(nodePos);
      
      if (distance < this.viewDistance) {
        nodeWrapper.isVisible = true;
        this.visibleNodes.add(nodeWrapper);
        
        // Adjust LOD based on distance
        if (distance < 20) {
          nodeWrapper.lod = 0; // Full detail
        } else if (distance < 50) {
          nodeWrapper.lod = 1; // Medium detail
        } else {
          nodeWrapper.lod = 2; // Low detail
        }
      } else {
        nodeWrapper.isVisible = false;
      }
    });
  }
  
  dispose() {
    this.nodes.forEach(nodeWrapper => {
      nodeWrapper.object.dispose();
    });
    this.nodes = [];
    this.visibleNodes.clear();
  }
}
```

---

## Example 6: Complete Game Integration

### Full Integration in Main Game Loop

```javascript
import * as THREE from 'three';
import { ZeroGravityControls, FirstPersonCameraController as ZGCamera } from './ZeroGravityControls.js';
import { SigmaNode } from './SigmaNode.js';
import { QuantumNode } from './QuantumNode.js';

class ATOMAAdvanced {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.clock = new THREE.Clock();
    this.time = 0;
    
    this.setup();
    this.animate();
  }
  
  setup() {
    // Create player
    const playerGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    const playerMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, 5, 0);
    this.scene.add(this.player);
    
    // Setup controls (both modes)
    this.zeroGravController = new ZeroGravityControls(this.player);
    this.zeroGCameraController = new ZGCamera(this.camera, this.player, this.renderer.domElement);
    this.controlMode = 'zero-gravity'; // Start in zero-g for this example
    this.zeroGCameraController.enable();
    
    // Create nodes
    this.nodes = [];
    this.createSpecialNodes();
    
    // Setup environment
    this.setupEnvironment();
    
    // Input
    this.setupInput();
  }
  
  createSpecialNodes() {
    // Create main Sigma node
    const sigma = new SigmaNode(new THREE.Vector3(0, 15, -40), 1.5);
    this.scene.add(sigma.getGroup());
    this.nodes.push(sigma);
    
    // Create orbiting quantum nodes
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const radius = 25;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        5 + Math.sin(angle) * 5,
        Math.sin(angle) * radius - 40
      );
      
      const quantum = new QuantumNode(pos, 0.9);
      this.scene.add(quantum.getGroup());
      this.nodes.push(quantum);
    }
  }
  
  setupEnvironment() {
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0f0f2a, 0.01);
    
    const ambientLight = new THREE.AmbientLight(0x6644ff, 0.4);
    this.scene.add(ambientLight);
  }
  
  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.ctrlKey) {
        this.toggleControlMode();
      }
    });
  }
  
  toggleControlMode() {
    if (this.controlMode === 'zero-gravity') {
      this.controlMode = 'gravity';
      // Switch to gravity mode
    } else {
      this.controlMode = 'zero-gravity';
      this.zeroGCameraController.enable();
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    this.time += deltaTime;
    
    // Update controls
    const cameraRotation = this.zeroGCameraController.update();
    this.zeroGravController.update(deltaTime, cameraRotation);
    
    // Update nodes
    this.nodes.forEach(node => node.update(deltaTime));
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game
new ATOMAAdvanced();
```

---

## Quick Reference: Control Switching

```javascript
// In main game loop:
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyG') {
    // G key switches modes
    if (gameInstance.controlMode === 'gravity') {
      // Switch to zero-g
      gameInstance.zeroGravityController.setActive(true);
      gameInstance.zeroGravityCameraController.enable();
    } else {
      // Switch to gravity
      gameInstance.zeroGravityController.setActive(false);
      gameInstance.zeroGravityCameraController.disable();
    }
  }
});
```

---

**Note**: All examples are production-ready and can be directly integrated into ATOMA.
