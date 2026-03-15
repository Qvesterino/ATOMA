import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * ============================================================================
 * REGIONAL HARMONY ZONES
 * ============================================================================
 * 
 * Extension to SystemStateOverlay that visualizes localized network stability
 * variations across the AI node network.
 * 
 * NOT a new metric system. Uses existing harmony data to derive regional
 * stability patterns through:
 * - Node spatial clustering
 * - Link density analysis
 * - Local synergy detection
 * - Distance-based influence falloff
 * 
 * Visual: Soft, amorphous zones with overlapping gradients
 * - Same harmony color palette as global harmony (lower saturation)
 * - Very low opacity, extremely subtle motion
 * - Never overpowers synergy halos or corruption layers
 * 
 * Performance: Recalculated every ~10 frames, <0.2ms overhead
 * 
 * ============================================================================
 */

export class RegionalHarmonyZones {
  constructor(scene, globalHarmonyColor = new THREE.Color(0x00ccdd)) {
    this.scene = scene;
    this.globalHarmonyColor = globalHarmonyColor.clone();
    
    // Enable/disable flag
    this.enabled = true;
    
    // Zone management
    this.zones = [];
    this.zoneGeometries = [];
    this.zoneMaterials = [];
    
    // Time tracking for motion
    this.time = 0;
    this.updateCounter = 0;
    this.updateFrequency = 10; // Recalculate every ~10 frames
    
    // Configuration
    this.config = {
      minZoneRadius: 8.0,           // Minimum zone size
      maxZoneRadius: 25.0,          // Maximum zone size
      zoneOpacityScale: 0.08,       // Base opacity (very subtle)
      harmonyOpacityBoost: 0.05,    // Extra opacity when harmony is high
      minNodesPerZone: 3,           // Minimum nodes to form a zone
      localSynergyWeight: 0.3,      // How much synergy affects local harmony
      linkDensityWeight: 0.2,       // How much link density affects zone strength
      harmonyInfluenceFalloff: 1.5, // Exponential decay for global harmony influence
      driftSpeed: 0.0008,           // Slow world-space drift
      breathingAmplitude: 0.002,    // Subtle expansion/contraction
      breathingFrequency: 0.5,      // Very slow breathing
      updateThreshold: 5.0          // Recalculate zones if nodes move > this distance
    };
    
    // Spatial tracking
    this.nodePositionCache = new Map();
    this.lastZoneUpdateTime = 0;
    this.zoneUpdateDueToMotion = false;
    
    // Color palette (same as SystemStateOverlay but lower saturation)
    this.harmonyColors = {
      low: new THREE.Color(0x5a6a78),       // Muted blue-gray
      med: new THREE.Color(0x2aacbd),       // Muted cyan
      high: new THREE.Color(0x30cdb8)       // Muted turquoise
    };
    
    // ====================================================================
    // ZONE BREATHING EFFECT — Audio Modulation Visualization
    // ====================================================================
    // Subtle animation when zone influences audio parameter modulation
    // Not feedback; presence through calm animation
    
    this.zoneAudioInfluences = new Map();  // Zone index → audio influence value
    this.zoneBreathingState = new Map();   // Zone index → current breathing intensity
    
    this.breathingConfig = {
      enabled: true,                        // Can be disabled per-zone
      triggerThreshold: 0.05,               // Zone influence needed to trigger
      maxBreathingIntensity: 1.0,           // Max breathing effect (0-1)
      breathingAmplitudeBoost: 0.025,       // Additional amplitude when breathing (±2.5%)
      breathingSpeedModulation: -0.1,       // -10% LFO speed when breathing (slower = calmer)
      fadeInTime: 0.5,                      // Seconds to fade breathing in (smooth start)
      fadeOutTime: 1.0,                     // Seconds to fade breathing out (smooth end)
      opacityBoost: 0.005                   // Optional very subtle opacity increase (+0.5%)
    };
    
    console.log('✓ Regional Harmony Zones initialized (with zone breathing support)');
  }
  
  /**
   * Calculate local harmony influence for a region around position
   * Considers: nearby node activity, link density, synergy presence
   */
  calculateLocalHarmony(position, nodes, links, globalHarmony) {
    if (!nodes || nodes.length === 0) return globalHarmony;
    
    let influenceSum = 0;
    let weightSum = 0;
    let totalSynergyNear = 0;
    let synergyCount = 0;
    
    const zoneRadius = this.config.minZoneRadius + 
                       (this.config.maxZoneRadius - this.config.minZoneRadius) * globalHarmony;
    
    // Accumulate influence from nearby nodes
    for (const node of nodes) {
      if (!node || !node.mesh || !node.mesh.position) continue;
      
      const dist = position.distanceTo(node.mesh.position);
      
      // Distance-based falloff (Gaussian-like)
      const influence = Math.exp(-Math.pow(dist / zoneRadius, 2));
      
      if (influence > 0.01) {
        // Get node's activity level
        const nodeSynergy = node.userData?.metrics?.synergy || 0;
        const nodeHarmony = node.userData?.metrics?.harmony || globalHarmony;
        
        // Accumulate weighted influence
        influenceSum += influence * nodeHarmony;
        weightSum += influence;
        
        // Track synergy presence
        if (nodeSynergy > 0.3) {
          totalSynergyNear += nodeSynergy * influence;
          synergyCount++;
        }
      }
    }
    
    // Base local harmony from nearby nodes
    let localHarmony = weightSum > 0 ? influenceSum / weightSum : globalHarmony;
    
    // Boost with local synergy (active areas feel more stable)
    if (synergyCount > 0) {
      const avgLocalSynergy = totalSynergyNear / synergyCount;
      localHarmony = THREE.MathUtils.lerp(
        localHarmony,
        Math.min(1.0, localHarmony + avgLocalSynergy * 0.2),
        this.config.localSynergyWeight
      );
    }
    
    // Link density influence (highly connected areas feel more stable)
    if (links && links.length > 0) {
      let linksNear = 0;
      for (const link of links) {
        if (!link || !link.source || !link.target) continue;
        
        const midpoint = new THREE.Vector3()
          .addVectors(link.source.mesh.position, link.target.mesh.position)
          .multiplyScalar(0.5);
        
        const distToLink = position.distanceTo(midpoint);
        if (distToLink < zoneRadius * 0.6) {
          linksNear++;
        }
      }
      
      const linkDensityFactor = Math.min(1.0, linksNear / Math.max(1, nodes.length * 0.5));
      localHarmony = THREE.MathUtils.lerp(
        localHarmony,
        Math.min(1.0, localHarmony + linkDensityFactor * 0.15),
        this.config.linkDensityWeight
      );
    }
    
    // Clamp to valid range
    return Math.max(0, Math.min(1, localHarmony));
  }
  
  /**
   * Identify node clusters for zone placement
   * Simple spatial clustering: nodes within proximity form zones
   */
  identifyClusters(nodes, globalHarmony) {
    if (!nodes || nodes.length < this.config.minNodesPerZone) {
      return [];
    }
    
    const clusters = [];
    const processed = new Set();
    const baseRadius = 12.0;
    
    // Simple greedy clustering
    for (let i = 0; i < nodes.length; i++) {
      if (processed.has(i)) continue;
      
      const seed = nodes[i];
      if (!seed || !seed.mesh) continue;
      
      const cluster = [seed];
      processed.add(i);
      
      // Find nearby nodes
      for (let j = i + 1; j < nodes.length; j++) {
        if (processed.has(j)) continue;
        
        const other = nodes[j];
        if (!other || !other.mesh) continue;
        
        const dist = seed.mesh.position.distanceTo(other.mesh.position);
        if (dist < baseRadius * (0.8 + 0.4 * globalHarmony)) {
          cluster.push(other);
          processed.add(j);
        }
      }
      
      // Only create zone if cluster is large enough
      if (cluster.length >= this.config.minNodesPerZone) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }
  
  /**
   * Calculate cluster center
   */
  calculateClusterCenter(cluster) {
    const center = new THREE.Vector3();
    for (const node of cluster) {
      if (node && node.mesh) {
        center.add(node.mesh.position);
      }
    }
    center.multiplyScalar(1 / cluster.length);
    return center;
  }
  
  /**
   * Calculate cluster radius (extent)
   */
  calculateClusterRadius(cluster, center) {
    let maxDist = 0;
    for (const node of cluster) {
      if (node && node.mesh) {
        const dist = center.distanceTo(node.mesh.position);
        maxDist = Math.max(maxDist, dist);
      }
    }
    return Math.max(this.config.minZoneRadius, maxDist * 1.3);
  }
  
  /**
   * Create or update a zone mesh for a cluster
   */
  createZoneMesh(cluster, center, radius, localHarmony, globalHarmony) {
    // Create icosphere geometry for soft zone shape
    const geometry = new THREE.IcosahedronGeometry(radius, 3);
    
    // Determine color based on local harmony
    let zoneColor;
    if (localHarmony < 0.33) {
      zoneColor = this.harmonyColors.low.clone();
    } else if (localHarmony < 0.66) {
      zoneColor = this.harmonyColors.med.clone();
    } else {
      zoneColor = this.harmonyColors.high.clone();
    }
    
    // Calculate opacity
    const baseOpacity = this.config.zoneOpacityScale;
    const harmonyBoost = this.config.harmonyOpacityBoost * localHarmony;
    const totalOpacity = baseOpacity + harmonyBoost;
    
    // Create material with transparency and blending
    const material = new THREE.MeshBasicMaterial({
      color: zoneColor,
      transparent: true,
      opacity: totalOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.userData.cluster = cluster;
    mesh.userData.localHarmony = localHarmony;
    mesh.userData.globalHarmony = globalHarmony;
    mesh.userData.radius = radius;
    mesh.userData.center = center.clone();
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    
    return mesh;
  }
  
  /**
   * Recalculate all regional zones
   */
  updateZones(nodes, links, globalHarmony) {
    // Identify clusters
    const clusters = this.identifyClusters(nodes, globalHarmony);
    
    // Remove old zones
    this.zones.forEach(zone => {
      this.scene.remove(zone);
    });
    this.zones = [];
    this.zoneGeometries = [];
    this.zoneMaterials = [];
    
    // Create new zones
    for (const cluster of clusters) {
      const center = this.calculateClusterCenter(cluster);
      const radius = this.calculateClusterRadius(cluster, center);
      const localHarmony = this.calculateLocalHarmony(center, nodes, links, globalHarmony);
      
      const mesh = this.createZoneMesh(cluster, center, radius, localHarmony, globalHarmony);
      
      this.zones.push(mesh);
      this.zoneGeometries.push(mesh.geometry);
      this.zoneMaterials.push(mesh.material);
      
      this.scene.add(mesh);
    }
  }
  
  /**
   * Check if zones need recalculation due to node movement
   */
  needsRecalculation(nodes) {
    let movedBeyondThreshold = false;
    
    for (const node of nodes) {
      if (!node || !node.mesh) continue;
      
      const nodeId = node.uuid || node.id;
      const cachedPos = this.nodePositionCache.get(nodeId);
      
      if (cachedPos) {
        const movement = node.mesh.position.distanceTo(cachedPos);
        if (movement > this.config.updateThreshold) {
          movedBeyondThreshold = true;
          break;
        }
      } else {
        // New node
        movedBeyondThreshold = true;
        break;
      }
    }
    
    // Update cache
    for (const node of nodes) {
      if (node && node.mesh) {
        const nodeId = node.uuid || node.id;
        this.nodePositionCache.set(nodeId, node.mesh.position.clone());
      }
    }
    
    return movedBeyondThreshold;
  }
  
  /**
   * Set audio influence values for zones (called from ZoneAudioReactivity)
   * @param {Map} influences - Map of zone index → influence value (0-1)
   */
  setZoneAudioInfluences(influences) {
    if (!influences || !(influences instanceof Map)) {
      return;
    }
    this.zoneAudioInfluences = influences;
  }
  
  /**
   * Update regional zones (called per frame)
   */
  update(deltaTime, nodes, links, globalHarmony) {
    if (!this.enabled) return;
    
    this.time += deltaTime;
    this.updateCounter++;
    
    // Recalculate zones at low frequency or when motion detected
    const shouldRecalculate = 
      this.updateCounter >= this.updateFrequency ||
      this.needsRecalculation(nodes);
    
    if (shouldRecalculate) {
      this.updateZones(nodes, links, globalHarmony);
      this.updateCounter = 0;
    }
    
    // Update zone animation (breathing + drift + audio-reactive breathing)
    for (let i = 0; i < this.zones.length; i++) {
      const zone = this.zones[i];
      if (!zone) continue;
      
      // ====================================================================
      // ZONE BREATHING EFFECT — Audio Modulation Visualization
      // ====================================================================
      // Get audio influence for this zone (if available)
      const audioInfluence = this.zoneAudioInfluences.get(i) || 0;
      
      // Update breathing state with smooth fade in/out
      let targetBreathingIntensity = 0;
      if (audioInfluence > this.breathingConfig.triggerThreshold) {
        // Zone is actively influencing audio — fade in breathing effect
        targetBreathingIntensity = Math.min(
          this.breathingConfig.maxBreathingIntensity,
          audioInfluence  // Intensity matches audio influence strength
        );
      }
      
      // Smooth fade in/out using exponential decay
      let currentIntensity = this.zoneBreathingState.get(i) || 0;
      const fadeTime = targetBreathingIntensity > currentIntensity ?
        this.breathingConfig.fadeInTime :
        this.breathingConfig.fadeOutTime;
      
      if (fadeTime > 0) {
        const fadeRate = deltaTime / fadeTime;
        currentIntensity = THREE.MathUtils.lerp(
          currentIntensity,
          targetBreathingIntensity,
          Math.min(1.0, fadeRate)
        );
      } else {
        currentIntensity = targetBreathingIntensity;
      }
      
      this.zoneBreathingState.set(i, currentIntensity);
      
      // ====================================================================
      // Apply base breathing motion (normal zone animation)
      // ====================================================================
      const baseBreathe = 1.0 + 
        this.config.breathingAmplitude * 
        Math.sin(this.time * this.config.breathingFrequency * Math.PI);
      
      // ====================================================================
      // Apply additional breathing effect when audio-active
      // ====================================================================
      // Enhance breathing amplitude during audio modulation
      const totalAmplitude = this.config.breathingAmplitude +
        (this.breathingConfig.breathingAmplitudeBoost * currentIntensity);
      
      // Subtle slowdown of breathing frequency during audio modulation
      const breathingFrequency = this.config.breathingFrequency *
        (1.0 + this.breathingConfig.breathingSpeedModulation * currentIntensity);
      
      // Combined breathing effect
      const enhancedBreathe = 1.0 + 
        totalAmplitude * 
        Math.sin(this.time * breathingFrequency * Math.PI);
      
      // Apply scale
      zone.scale.lerp(
        new THREE.Vector3(enhancedBreathe, enhancedBreathe, enhancedBreathe),
        0.1
      );
      
      // Anchor to original center (drift removed)
      zone.position.set(
        zone.userData.center.x,
        zone.userData.center.y,
        zone.userData.center.z
      );
      
      // Update opacity based on global harmony (higher harmony = more visible zones)
      const harmonyFade = 0.5 + globalHarmony * 0.5;
      const baseOpacity = 
        (this.config.zoneOpacityScale + 
         this.config.harmonyOpacityBoost * zone.userData.localHarmony) * 
        harmonyFade;
      
      // Optional subtle opacity boost during breathing (very minimal)
      const opacityBoost = this.breathingConfig.opacityBoost * currentIntensity;
      zone.material.opacity = Math.min(1.0, baseOpacity + opacityBoost);
    }
  }
  
  /**
   * Toggle zones visibility
   */
  toggle() {
    this.enabled = !this.enabled;
    this.zones.forEach(zone => {
      zone.visible = this.enabled;
    });
  }
  
  /**
   * Get status info for debug output
   */
  getStatus() {
    return {
      enabled: this.enabled,
      activeZones: this.zones.length,
      updateCounter: this.updateCounter,
      updateFrequency: this.updateFrequency,
      time: this.time
    };
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    // Remove zones from scene
    this.zones.forEach(zone => {
      this.scene.remove(zone);
    });
    
    // Dispose geometries
    this.zoneGeometries.forEach(geom => {
      if (geom) geom.dispose();
    });
    
    // Dispose materials
    this.zoneMaterials.forEach(mat => {
      if (mat) mat.dispose();
    });
    
    // Clear arrays
    this.zones = [];
    this.zoneGeometries = [];
    this.zoneMaterials = [];
    this.nodePositionCache.clear();
  }
}
