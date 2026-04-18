import * as THREE from 'three';
import { RegionalHarmonyZones } from './RegionalHarmonyZones.js';

// PHASE OFF-1: disable select unbounded motion while keeping visuals rendered
const MOTION_OFF_PHASE1 = true;

/**
 * ============================================================================
 * SYSTEM STATE OVERLAY
 * ============================================================================
 * 
 * Non-intrusive visual representation of ATOMA's internal metrics.
 * NOT a HUD. Feels like part of the system's presence itself.
 * 
 * Four visual layers:
 * 1. Global Harmony Indicator (subtle vignette/ring)
 * 2. Regional Harmony Zones (soft clustering zones - NEW)
 * 3. Local Synergy Halos (soft glows around active nodes)
 * 4. Corruption Disturbance (spatial blur/drift in affected areas)
 * 
 * Read-only: only visualizes existing metrics, never modifies game state.
 * Toggleable via dev/advanced mode flag.
 * 
 * ============================================================================
 */

export class SystemStateOverlay {
  constructor(scene, renderer, camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    
    // Enable/disable flag (disabled by default)
    this.enabled = false;
    
    // Render order constants
    this.LAYER_HARMONY = 1;
    this.LAYER_SYNERGY = 2;
    this.LAYER_CORRUPTION = 3;
    
    // Color palette
    this.colors = {
      harmonyLow: new THREE.Color(0x4a5568),      // cool blue-gray
      harmonyMed: new THREE.Color(0x6f85bf),      // muted blue
      harmonyHigh: new THREE.Color(0x66508f),     // muted violet
      
      synergyBase: new THREE.Color(0x728096),     // steel
      synergyBright: new THREE.Color(0xdbe2ee),   // frost
      
      corruptionBase: new THREE.Color(0x6b5b95),  // muted purple
      corruptionMute: new THREE.Color(0x4a4a6a),  // neutral gray → purple
    };
    
    // Time tracking
    this.time = 0;
    
    // Cached metrics (updated each frame)
    this.metrics = {
      harmony: 0,
      synergy: 0,
      corruption: 0
    };
    
    // Layer objects
    this.layers = {
      harmony: null,
      synergyHalos: [],
      corruptionDrift: null
    };
    
    // Regional harmony zones (extension layer)
    this.regionalHarmonyZones = null;
    this.regionalHarmonyZonesEnabled = true; // Show by default with overlay
    
    // Initialize layers
    this.initHarmonyLayer();
    this.initCorruptionLayer();
    this.initRegionalHarmonyZones();
    
    console.log('✓ System State Overlay initialized (disabled by default)');
  }
  
  /**
   * Initialize Regional Harmony Zones extension
   */
  initRegionalHarmonyZones() {
    this.regionalHarmonyZones = new RegionalHarmonyZones(
      this.scene,
      this.colors.harmonyMed
    );
    this.regionalHarmonyZones.enabled = false; // Hidden when overlay is disabled
  }
  
  /**
   * Initialize the global harmony indicator (vignette/ring)
   */
  initHarmonyLayer() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Create a subtle ring/vignette around viewport
    // Ring: outer circle fades to transparency at edges
    const segments = 128;
    const radiusInner = 0.85;
    const radiusOuter = 1.0;
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      
      // Inner circle
      vertices.push(Math.cos(angle1) * radiusInner, Math.sin(angle1) * radiusInner, 0);
      vertices.push(Math.cos(angle2) * radiusInner, Math.sin(angle2) * radiusInner, 0);
      
      // Outer circle
      vertices.push(Math.cos(angle1) * radiusOuter, Math.sin(angle1) * radiusOuter, 0);
      vertices.push(Math.cos(angle2) * radiusOuter, Math.sin(angle2) * radiusOuter, 0);
      
      const base = i * 4;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    
    const material = new THREE.MeshBasicMaterial({
      color: this.colors.harmonyMed,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = this.LAYER_HARMONY;
    mesh.position.z = 0.1; // Very close to camera
    
    this.scene.add(mesh);
    this.layers.harmony = mesh;
  }
  
  /**
   * Initialize the corruption disturbance layer
   * Uses a simple plane with a shader that creates spatial uncertainty
   */
  initCorruptionLayer() {
    // Create a simple noise-based disturbance overlay
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with subtle purple noise
    ctx.fillStyle = 'rgba(107, 91, 149, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add perlin-like noise pattern (using sine waves for simplicity)
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01);
        const alpha = Math.abs(noise) * 0.15;
        ctx.fillStyle = `rgba(107, 91, 149, ${alpha})`;
        ctx.fillRect(x, y, 8, 8);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = this.LAYER_CORRUPTION;
    mesh.position.z = 0.15;
    
    this.scene.add(mesh);
    this.layers.corruptionDrift = mesh;
  }
  
  /**
   * Create or update synergy halos for nodes with active synergy
   * This is called during update with node data
   */
  updateSynergyHalos(nodes, synergy) {
    // Remove old halos
    this.layers.synergyHalos.forEach(halo => {
      this.scene.remove(halo);
    });
    this.layers.synergyHalos = [];
    
    if (synergy < 0.1) return; // Don't show halos at very low synergy
    
    // Find clusters of nodes with high activity
    if (!nodes || nodes.length === 0) return;
    
    // Simple clustering: nodes close together and active form a halo
    const activeClusters = [];
    const processed = new Set();
    
    for (let i = 0; i < nodes.length; i++) {
      if (processed.has(i)) continue;
      
      const node = nodes[i];
      if (!node || !node.mesh) continue;
      
      const cluster = [node];
      processed.add(i);
      
      // Find nearby nodes
      for (let j = i + 1; j < nodes.length; j++) {
        if (processed.has(j)) continue;
        
        const otherNode = nodes[j];
        if (!otherNode || !otherNode.mesh) continue;
        
        const dist = node.mesh.position.distanceTo(otherNode.mesh.position);
        if (dist < 15) {
          cluster.push(otherNode);
          processed.add(j);
        }
      }
      
      // Only create halo for clusters of 3+ or single very active nodes
      if (cluster.length >= 3 || (cluster.length === 1 && synergy > 0.6)) {
        activeClusters.push(cluster);
      }
    }
    
    // Create halos for clusters
    activeClusters.forEach(cluster => {
      const haloGeometry = new THREE.BufferGeometry();
      
      // Calculate cluster center
      let centerX = 0, centerY = 0, centerZ = 0;
      cluster.forEach(node => {
        centerX += node.mesh.position.x;
        centerY += node.mesh.position.y;
        centerZ += node.mesh.position.z;
      });
      centerX /= cluster.length;
      centerY /= cluster.length;
      centerZ /= cluster.length;
      
      // Calculate cluster radius (distance to farthest node)
      let maxDist = 0;
      cluster.forEach(node => {
        const dx = node.mesh.position.x - centerX;
        const dy = node.mesh.position.y - centerY;
        const dz = node.mesh.position.z - centerZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        maxDist = Math.max(maxDist, dist);
      });
      
      // Create halo rings around cluster
      const ringSegments = 64;
      const ringRadius = maxDist * 1.3;
      
      const vertices = [];
      const indices = [];
      
      // Create expanding rings for glow effect
      for (let ring = 0; ring < 2; ring++) {
        const radius = ringRadius * (1 + ring * 0.15);
        const opacity = 1 - ring * 0.4;
        
        for (let i = 0; i < ringSegments; i++) {
          const angle = (i / ringSegments) * Math.PI * 2;
          vertices.push(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
            centerZ
          );
        }
        
        // Connect rings
        if (ring > 0) {
          const prevRing = (ring - 1) * ringSegments;
          const currRing = ring * ringSegments;
          
          for (let i = 0; i < ringSegments; i++) {
            const next = (i + 1) % ringSegments;
            indices.push(prevRing + i, currRing + i, prevRing + next);
            indices.push(currRing + i, currRing + next, prevRing + next);
          }
        }
      }
      
      if (vertices.length > 0) {
        haloGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        if (indices.length > 0) {
          haloGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        }
        
        // Color interpolation based on synergy strength
        const haloColor = this.colors.synergyBase.clone();
        haloColor.lerp(this.colors.synergyBright, synergy);
        
        const haloPulse = 0.4 + 0.3 * synergy;
        
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: haloColor,
          transparent: true,
          opacity: haloPulse * 0.12 * synergy,
          side: THREE.DoubleSide,
          depthWrite: false,
          depthTest: false,
        });
        
        const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
        haloMesh.renderOrder = this.LAYER_SYNERGY;
        haloMesh.userData.synergyValue = synergy;
        haloMesh.userData.centerPos = new THREE.Vector3(centerX, centerY, centerZ);
        
        this.scene.add(haloMesh);
        this.layers.synergyHalos.push(haloMesh);
      }
    });
  }
  
  /**
   * Update global harmony layer (vignette)
   */
  updateHarmonyLayer() {
    if (!this.layers.harmony) return;
    
    const harmonyMaterial = this.layers.harmony.material;
    
    // Color mapping based on harmony
    let targetColor;
    if (this.metrics.harmony < 0.33) {
      targetColor = this.colors.harmonyLow;
    } else if (this.metrics.harmony < 0.66) {
      targetColor = this.colors.harmonyMed;
    } else {
      targetColor = this.colors.harmonyHigh;
    }
    
    // Smooth color transition
    harmonyMaterial.color.lerp(targetColor, 0.05);
    
    // Breathing animation (more pronounced at low harmony)
    const breatheStrength = 1 - this.metrics.harmony;
    const breatheAmount = 0.02 + 0.04 * breatheStrength * Math.sin(this.time * 0.5);
    harmonyMaterial.opacity = 0.08 + breatheAmount;
  }
  
  /**
   * Update synergy halos (gentle pulsing)
   */
  updateSynergyLayers() {
    this.layers.synergyHalos.forEach(halo => {
      // Gentle pulsing based on synergy value
      const synergy = halo.userData.synergyValue;
      const pulseFreq = 1 + synergy * 1.5; // Faster pulse at higher synergy
      const pulseFade = 0.4 + 0.6 * synergy; // More opaque at high synergy
      
      const pulse = 0.5 + 0.5 * Math.sin(this.time * pulseFreq);
      halo.material.opacity = pulse * pulseFade * 0.12 * synergy;
      
    // Ensure halos remain anchored; no per-frame position adds
    if (!halo.userData.basePosition && halo.userData.centerPos) {
      halo.userData.basePosition = halo.userData.centerPos.clone();
    }
    if (halo.userData.basePosition) {
      const base = halo.userData.basePosition;
      halo.position.set(base.x, base.y, base.z);
    }
  });
}
  
  /**
   * Update corruption layer (slow drift, uncertain motion)
   */
  updateCorruptionLayer() {
    if (!this.layers.corruptionDrift) return;
    
    const corruptionMat = this.layers.corruptionDrift.material;
    
    // Base color is muted purple-gray
    corruptionMat.color.copy(this.colors.corruptionMute);
    
    // Opacity increases with corruption
    const corruptionOpacity = this.metrics.corruption * 0.15;
    corruptionMat.opacity = corruptionOpacity;
    
    // Keep corruption layer anchored (no drifting position adds)
    if (!this.layers.corruptionDrift.userData.basePosition) {
      this.layers.corruptionDrift.userData.basePosition = this.layers.corruptionDrift.position.clone();
    }
    const base = this.layers.corruptionDrift.userData.basePosition;
    this.layers.corruptionDrift.position.set(base.x, base.y, base.z);
    
    // Texture scrolling (slow)
    if (corruptionMat.map) {
      corruptionMat.map.offset.x += 0.0001;
      corruptionMat.map.offset.y += 0.00005;
    }
  }
  
  /**
   * Main update call (once per frame)
   * Pass current metrics from CoreMetricsOverlay
   */
  update(deltaTime, aiNodes, metrics) {
    if (!this.enabled) return;
    
    this.time += deltaTime;
    
    // Cache metrics
    this.metrics.harmony = Math.max(0, Math.min(1, metrics.harmony || 0));
    this.metrics.synergy = Math.max(0, Math.min(1, metrics.synergy || 0));
    this.metrics.corruption = Math.max(0, Math.min(1, metrics.corruption || 0));
    
    // Update each layer
    this.updateHarmonyLayer();
    this.updateRegionalHarmonyZones(aiNodes, metrics);
    this.updateSynergyLayers();
    this.updateCorruptionLayer();
    
    // Update synergy halos (less frequent)
    if (Math.floor(this.time * 30) % 5 === 0) { // Every ~5 frames
      this.updateSynergyHalos(aiNodes, this.metrics.synergy);
    }
  }
  
  /**
   * Update regional harmony zones
   */
  updateRegionalHarmonyZones(aiNodes, metrics) {
    if (!this.regionalHarmonyZones || !this.regionalHarmonyZonesEnabled) return;
    
    this.regionalHarmonyZones.update(
      0.016, // Assume ~60fps, deltaTime ~16ms
      aiNodes || [],
      [], // Links not directly needed for zone calculation
      metrics.harmony || 0.5
    );
  }
  
  /**
   * Toggle overlay visibility
   */
  toggle() {
    this.enabled = !this.enabled;
    console.log(`System State Overlay: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Show/hide all layers
    if (this.layers.harmony) {
      this.layers.harmony.visible = this.enabled;
    }
    if (this.layers.corruptionDrift) {
      this.layers.corruptionDrift.visible = this.enabled;
    }
    this.layers.synergyHalos.forEach(halo => {
      halo.visible = this.enabled;
    });
    
    // Update regional zones visibility
    if (this.regionalHarmonyZones) {
      this.regionalHarmonyZones.enabled = this.enabled;
    }
  }
  
  /**
   * Toggle regional harmony zones independently
   */
  toggleRegionalHarmonyZones() {
    this.regionalHarmonyZonesEnabled = !this.regionalHarmonyZonesEnabled;
    if (this.regionalHarmonyZones) {
      this.regionalHarmonyZones.enabled = this.regionalHarmonyZonesEnabled;
    }
    console.log(`Regional Harmony Zones: ${this.regionalHarmonyZonesEnabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  /**
   * Get current metrics being displayed
   */
  getMetrics() {
    return {
      harmony: this.metrics.harmony,
      synergy: this.metrics.synergy,
      corruption: this.metrics.corruption,
      enabled: this.enabled
    };
  }
  
  /**
   * Debug/status output
   */
  status() {
    console.log('=== SYSTEM STATE OVERLAY ===');
    console.log(`Status: ${this.enabled ? '✓ ACTIVE' : '✗ INACTIVE'}`);
    console.log(`Harmony: ${(this.metrics.harmony * 100).toFixed(1)}%`);
    console.log(`Synergy: ${(this.metrics.synergy * 100).toFixed(1)}%`);
    console.log(`Corruption: ${(this.metrics.corruption * 100).toFixed(1)}%`);
    console.log(`Active Synergy Halos: ${this.layers.synergyHalos.length}`);
    
    if (this.regionalHarmonyZones) {
      const zoneStatus = this.regionalHarmonyZones.getStatus();
      console.log('--- REGIONAL HARMONY ZONES ---');
      console.log(`Status: ${zoneStatus.enabled ? '✓ ACTIVE' : '✗ INACTIVE'}`);
      console.log(`Active Zones: ${zoneStatus.activeZones}`);
      console.log(`Update Frequency: every ${zoneStatus.updateFrequency} frames`);
    }
    
    console.log(`Time: ${this.time.toFixed(2)}s`);
  }
  
  /**
   * Cleanup and dispose of all overlay resources
   */
  dispose() {
    // Remove harmony layer
    if (this.layers.harmony) {
      this.scene.remove(this.layers.harmony);
      if (this.layers.harmony.geometry) this.layers.harmony.geometry.dispose();
      if (this.layers.harmony.material) this.layers.harmony.material.dispose();
    }
    
    // Remove corruption layer
    if (this.layers.corruptionDrift) {
      this.scene.remove(this.layers.corruptionDrift);
      if (this.layers.corruptionDrift.geometry) this.layers.corruptionDrift.geometry.dispose();
      if (this.layers.corruptionDrift.material) {
        if (this.layers.corruptionDrift.material.map) {
          this.layers.corruptionDrift.material.map.dispose();
        }
        this.layers.corruptionDrift.material.dispose();
      }
    }
    
    // Remove all synergy halos
    this.layers.synergyHalos.forEach(halo => {
      this.scene.remove(halo);
      if (halo.geometry) halo.geometry.dispose();
      if (halo.material) halo.material.dispose();
    });
    this.layers.synergyHalos = [];
    
    // Dispose regional harmony zones
    if (this.regionalHarmonyZones) {
      this.regionalHarmonyZones.dispose();
      this.regionalHarmonyZones = null;
    }
    
    // Clear layers object
    this.layers = {
      harmony: null,
      synergyHalos: [],
      corruptionDrift: null
    };
  }
}
