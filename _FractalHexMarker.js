/**
 * FRACTAL HEX MARKER SYSTEM
 * 
 * Replaces legacy debug cones with elegant ATOMA-style fractal hexagon markers.
 * Pure visual overlay system - zero impact on gameplay, physics, or node data.
 * 
 * MARKER DESIGN:
 * - Fractal hexagon outline with 2-3 layered rings
 * - Subtle irregular "glitch gaps" in the outline
 * - Additive glow material (THREE.AdditiveBlending)
 * - Color based on node.categoryColor or default ATOMA cyan
 * - Dynamic rotation (0.15 rad/s around Y axis)
 * - Subtle pulsing scale (0.96 → 1.03)
 * - Tiny center spark (point light effect)
 * 
 * STRICT SAFETY RULES:
 * - Do NOT modify createNode(), updateNode(), AIModes.js, NodeEvolution, Rituals, or physics
 * - Only add/remove visual-only children under node.visualGroup
 * - No heavy shaders, no volumetrics, no gameplay changes
 * - Must be fully optional, non-destructive, and removable
 * - All code null-checked and safe
 * 
 * PERFORMANCE:
 * - Geometry: < 60 verts per marker
 * - No post-processing
 * - No particles exceeding 3 per marker
 * - Zero expensive shaders
 */

import * as THREE from 'three';

export class FractalHexMarker {
  constructor(scene) {
    this.scene = scene;
    
    // Registry: nodeId → marker data
    this.markerRegistry = new Map();
    
    // Default colors (ATOMA palette)
    this.defaultColors = {
      cyan: 0x00F2FF,
      mint: 0x84FFE6,
      magenta: 0xFF00FF,
      gold: 0xFFD700,
      violet: 0x6633CC
    };
    
    // Animation parameters
    this.rotationSpeed = 0.15; // rad/s around Y axis
    this.pulseSpeed = 1.5;     // Hz
    this.minScale = 0.96;
    this.maxScale = 1.03;
    
    console.log('✓ Fractal Hex Marker System initialized');
  }
  
  /**
   * Get category color for a node
   * @param {THREE.Object3D} node - Node object
   * @returns {number} THREE.js color value
   */
  getCategoryColor(node) {
    if (!node || !node.userData) return this.defaultColors.cyan;
    
    // Check for explicit categoryColor
    if (node.userData.categoryColor) {
      return node.userData.categoryColor;
    }
    
    // Map category to color
    const category = node.userData.category || 'input';
    const categoryColors = {
      input: 0x00F2FF,      // Cyan
      processor: 0x84FFE6,   // Mint
      output: 0xFF00FF,      // Magenta
      controller: 0xFFD700,  // Gold
      mythic: 0x00FF88       // Neon Green
    };
    
    return categoryColors[category] || this.defaultColors.cyan;
  }
  
  /**
   * Create hexagon vertices for a ring
   * @param {number} radius - Radius of hexagon
   * @param {number} irregularity - Irregularity factor (0-1)
   * @returns {Array<THREE.Vector3>} Hex vertices
   */
  createHexagonVertices(radius, irregularity = 0) {
    const vertices = [];
    const segments = 6; // Perfect hexagon
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Add slight irregularity (glitch effect)
      const noise = (Math.random() - 0.5) * irregularity * radius * 0.15;
      const r = radius + noise;
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      vertices.push(new THREE.Vector3(x, 0, z));
    }
    
    return vertices;
  }
  
  /**
   * Create fractal hexagon marker geometry
   * Combines 3 hex rings with glitch gaps
   * @returns {THREE.BufferGeometry}
   */
  createFractalHexGeometry() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    
    // Ring 1 (outer): Large hex
    const ring1Verts = this.createHexagonVertices(0.6, 0.15);
    const ring1Start = positions.length / 3;
    ring1Verts.forEach(v => positions.push(v.x, v.y, v.z));
    
    // Ring 2 (middle): Medium hex, rotated
    const ring2Verts = this.createHexagonVertices(0.4, 0.1);
    const ring2Start = positions.length / 3;
    // Rotate second ring by 30 degrees
    ring2Verts.forEach(v => {
      const angle = Math.PI / 6; // 30 degrees
      const x = v.x * Math.cos(angle) - v.z * Math.sin(angle);
      const z = v.x * Math.sin(angle) + v.z * Math.cos(angle);
      positions.push(x, v.y, z);
    });
    
    // Ring 3 (inner): Small hex
    const ring3Verts = this.createHexagonVertices(0.2, 0.05);
    const ring3Start = positions.length / 3;
    ring3Verts.forEach(v => positions.push(v.x, v.y, v.z));
    
    // Create line segments between rings with glitch gaps
    // Ring 1 outline
    for (let i = 0; i < ring1Verts.length - 1; i++) {
      indices.push(ring1Start + i, ring1Start + i + 1);
    }
    
    // Ring 2 outline
    for (let i = 0; i < ring2Verts.length - 1; i++) {
      indices.push(ring2Start + i, ring2Start + i + 1);
    }
    
    // Ring 3 outline
    for (let i = 0; i < ring3Verts.length - 1; i++) {
      indices.push(ring3Start + i, ring3Start + i + 1);
    }
    
    // Radial connections (sparse for glitch effect)
    for (let i = 0; i < 6; i++) {
      // Connect Ring 1 to Ring 2 (skip every other for glitch gaps)
      if (i % 2 === 0) {
        indices.push(ring1Start + i, ring2Start + i);
      }
      
      // Connect Ring 2 to Ring 3 (skip every other)
      if (i % 2 === 1) {
        indices.push(ring2Start + i, ring3Start + i);
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(positions),
      3
    ));
    geometry.setIndex(new THREE.BufferAttribute(
      new Uint16Array(indices),
      1
    ));
    
    return geometry;
  }
  
  /**
   * Create a fractal hex marker for a node
   * @param {THREE.Object3D} node - Node object
   * @param {string} nodeId - Unique node identifier
   * @returns {boolean} True if marker was created
   */
  createMarker(node, nodeId) {
    if (!node) {
      console.warn('FractalHexMarker: Cannot create marker for null node');
      return false;
    }
    
    // Check if marker already exists
    if (this.markerRegistry.has(nodeId)) {
      return false; // Already has marker
    }
    
    try {
      // Find or create visualGroup
      let visualGroup = null;
      if (node.children) {
        visualGroup = node.children.find(child => 
          child.userData?.isVisualGroup || child.name === 'visualGroup'
        );
      }
      
      // Create visualGroup if it doesn't exist
      if (!visualGroup) {
        visualGroup = new THREE.Group();
        visualGroup.userData.isVisualGroup = true;
        visualGroup.name = 'visualGroup';
        node.add(visualGroup);
      }
      
      // Create marker group
      const markerGroup = new THREE.Group();
      markerGroup.userData = {
        isFractalHexMarker: true,
        isVFX: true,
        noEvolve: true,
        noCleanup: true
      };
      markerGroup.name = 'fractalHexMarker';
      
      // Get marker color from node
      const markerColor = this.getCategoryColor(node);
      
      // Create hexagon line geometry
      const hexGeometry = this.createFractalHexGeometry();
      
      // Create additive glow material
      const hexMaterial = new THREE.LineBasicMaterial({
        color: markerColor,
        transparent: true,
        opacity: 0.7,
        fog: false,
        linewidth: 2
      });
      
      // Create hex marker mesh (lines)
      const hexMarker = new THREE.LineSegments(hexGeometry, hexMaterial);
      hexMarker.userData = {
        vfxType: 'fractalHex',
        isVFX: true
      };
      markerGroup.add(hexMarker);
      
      // Create tiny center spark (small glow point)
      const sparkGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const sparkMaterial = new THREE.MeshBasicMaterial({
        color: markerColor,
        transparent: true,
        opacity: 0.8,
        emissive: markerColor,
        emissiveIntensity: 0.6,
        fog: false
      });
      
      const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      spark.userData = {
        vfxType: 'fractalSpark',
        isVFX: true
      };
      markerGroup.add(spark);
      
      // Position marker above node
      markerGroup.position.y = 0.8;
      
      // Add to visualGroup
      visualGroup.add(markerGroup);
      
      // Register marker
      this.markerRegistry.set(nodeId, {
        node,
        visualGroup,
        markerGroup,
        hexMarker,
        spark,
        markerColor,
        rotationAngle: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        hexMaterial,
        sparkMaterial
      });
      
      console.log(`✓ Fractal Hex Marker created for node ${nodeId}`);
      return true;
    } catch (error) {
      console.warn('FractalHexMarker: Error creating marker', error);
      return false;
    }
  }
  
  /**
   * Remove marker from a node with graceful fade-out
   * @param {string} nodeId - Unique node identifier
   */
  removeMarker(nodeId) {
    const markerData = this.markerRegistry.get(nodeId);
    if (!markerData) return;
    
    const { markerGroup, hexMaterial, sparkMaterial } = markerData;
    
    // Graceful fade-out animation (0.5s)
    const fadeOutDuration = 0.5;
    let elapsed = 0;
    
    const animateOut = () => {
      elapsed += 0.016; // ~60 FPS
      const progress = Math.min(elapsed / fadeOutDuration, 1.0);
      
      if (markerGroup && markerGroup.parent) {
        // Fade opacity
        const opacity = 0.7 * (1 - progress);
        if (hexMaterial) hexMaterial.opacity = opacity;
        if (sparkMaterial) sparkMaterial.opacity = opacity;
        
        // Scale down
        const scale = 1.0 - (progress * 0.3);
        markerGroup.scale.set(scale, scale, scale);
      }
      
      if (progress < 1.0) {
        requestAnimationFrame(animateOut);
      } else {
        this.disposeMarker(nodeId);
      }
    };
    
    animateOut();
  }
  
  /**
   * Dispose marker completely (internal use)
   * @param {string} nodeId - Unique node identifier
   */
  disposeMarker(nodeId) {
    const markerData = this.markerRegistry.get(nodeId);
    if (!markerData) return;
    
    const { markerGroup, hexMarker, spark, hexMaterial, sparkMaterial } = markerData;
    
    // Remove from parent
    if (markerGroup && markerGroup.parent) {
      markerGroup.parent.remove(markerGroup);
    }
    
    // Dispose materials
    if (hexMaterial && hexMaterial.dispose) {
      hexMaterial.dispose();
    }
    if (sparkMaterial && sparkMaterial.dispose) {
      sparkMaterial.dispose();
    }
    
    // Dispose geometries
    if (hexMarker && hexMarker.geometry) {
      hexMarker.geometry.dispose();
    }
    if (spark && spark.geometry) {
      spark.geometry.dispose();
    }
    
    // Remove from registry
    this.markerRegistry.delete(nodeId);
    
    console.log(`✓ Fractal Hex Marker disposed for node ${nodeId}`);
  }
  
  /**
   * Detect and replace legacy debug cones with fractal markers
   * @param {Array} nodes - Array of node objects
   */
  detectAndReplaceDebugCones(nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    let replacedCount = 0;
    
    nodes.forEach((node, index) => {
      if (!node) return;
      
      const nodeId = node.uuid || `node-${index}`;
      
      // Search for legacy debug cones in visualGroup or node children
      const visualGroup = node.children?.find(child => 
        child.userData?.isVisualGroup || child.name === 'visualGroup'
      );
      
      const searchTargets = [node];
      if (visualGroup) searchTargets.push(visualGroup);
      if (node.mesh) searchTargets.push(node.mesh);
      
      const conesMeshes = [];
      
      // Traverse each target looking for legacy cones
      for (const target of searchTargets) {
        if (!target) continue;
        
        target.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          
          const geometry = child.geometry;
          if (!geometry) return;
          
          // Check for ConeGeometry
          let isCone = false;
          if (geometry.type === 'ConeGeometry') {
            const params = geometry.parameters || {};
            const radius = params.radius || params.radiusBottom || 1;
            const height = params.height || 1;
            
            // Legacy debug cones are small
            if (radius < 1.2 && height < 2.0) {
              isCone = true;
            }
          }
          
          // Check for gold/yellow materials (fallback detection)
          let isGoldMesh = false;
          if (!isCone && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of materials) {
              if (mat && mat.color && this.isGoldOrYellow(mat.color)) {
                isGoldMesh = true;
                break;
              }
            }
          }
          
          if (isCone || isGoldMesh) {
            conesMeshes.push(child);
          }
        });
      }
      
      // Replace each found cone with a marker
      for (const coneMesh of conesMeshes) {
        try {
          // Remove cone safely
          if (coneMesh.parent) {
            coneMesh.parent.remove(coneMesh);
          }
          
          // Dispose cone materials and geometry
          if (coneMesh.material) {
            if (Array.isArray(coneMesh.material)) {
              coneMesh.material.forEach(mat => {
                if (mat && mat.dispose) mat.dispose();
              });
            } else if (coneMesh.material.dispose) {
              coneMesh.material.dispose();
            }
          }
          
          if (coneMesh.geometry && coneMesh.geometry.dispose) {
            coneMesh.geometry.dispose();
          }
          
          replacedCount++;
        } catch (error) {
          console.warn('FractalHexMarker: Error removing legacy cone', error);
        }
      }
      
      // Create marker if cones were found and marker doesn't exist
      if (replacedCount > 0 && !this.markerRegistry.has(nodeId)) {
        this.createMarker(node, nodeId);
      }
    });
    
    if (replacedCount > 0) {
      console.log(`✓ Detected and replaced ${replacedCount} legacy debug cones with fractal markers`);
    }
  }
  
  /**
   * Check if a color is close to gold/yellow
   * @param {THREE.Color} color - Color to check
   * @returns {boolean}
   */
  isGoldOrYellow(color) {
    if (!color || !color.r) return false;
    
    const tolerance = 0.2;
    
    // Check distance to gold (#FFD700: r=1, g=0.843, b=0)
    const distToGold = Math.sqrt(
      Math.pow(color.r - 1.0, 2) +
      Math.pow(color.g - 0.843, 2) +
      Math.pow(color.b - 0.0, 2)
    );
    
    // Check distance to yellow (#FFFF00: r=1, g=1, b=0)
    const distToYellow = Math.sqrt(
      Math.pow(color.r - 1.0, 2) +
      Math.pow(color.g - 1.0, 2) +
      Math.pow(color.b - 0.0, 2)
    );
    
    return distToGold < tolerance || distToYellow < tolerance;
  }
  
  /**
   * Update all markers (animations, billboard effect)
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  update(deltaTime) {
    for (const [nodeId, markerData] of this.markerRegistry) {
      const { node, markerGroup, hexMarker, sparkMaterial } = markerData;
      
      // Safety checks
      if (!node || !markerGroup || !markerGroup.parent) {
        // Node was removed, clean up
        this.disposeMarker(nodeId);
        continue;
      }
      
      // Update rotation (slow spin around Y axis)
      markerData.rotationAngle += this.rotationSpeed * deltaTime;
      markerGroup.rotation.y = markerData.rotationAngle;
      
      // Update pulse phase
      markerData.pulsePhase += deltaTime * this.pulseSpeed;
      const pulseFactor = (Math.sin(markerData.pulsePhase) + 1.0) * 0.5; // 0 to 1
      
      // Update scale (subtle pulse)
      const scale = this.minScale + (pulseFactor * (this.maxScale - this.minScale));
      markerGroup.scale.set(scale, scale, scale);
      
      // Update spark opacity tied to pulse
      if (sparkMaterial) {
        const sparkOpacity = 0.4 + (pulseFactor * 0.4);
        sparkMaterial.opacity = sparkOpacity;
      }
    }
  }
  
  /**
   * Get status report
   */
  getStatus() {
    return {
      activeMarkers: this.markerRegistry.size,
      markerIds: Array.from(this.markerRegistry.keys())
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    const status = this.getStatus();
    console.group('✨ Fractal Hex Marker System Status');
    console.log(`Active Markers: ${status.activeMarkers}`);
    if (status.activeMarkers > 0) {
      console.log('Marker IDs:', status.markerIds);
    }
    console.groupEnd();
  }
  
  /**
   * Cleanup all markers
   */
  cleanup() {
    for (const nodeId of this.markerRegistry.keys()) {
      this.disposeMarker(nodeId);
    }
    
    console.log('✓ Fractal Hex Marker System cleaned up');
  }
}
