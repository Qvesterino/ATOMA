/**
 * MYTHIC SEED GLYPH SYSTEM
 * 
 * Replaces old yellow triangle debug markers with elegant ATOMA-style glyphs.
 * Pure visual overlay system - zero impact on gameplay, physics, or node data.
 * 
 * SAFETY RULES:
 * - Visual-only enhancement (no gameplay, physics, or node data modifications)
 * - Attaches glyphs as children of node.visualGroup (or node if no visualGroup)
 * - Fully optional and removable with graceful fade-out
 * - Zero impact on camera, movement, or world events
 * - No heavy shaders or volumetrics
 * - All animations internally null-checked and non-destructive
 * 
 * GLYPH DESIGN:
 * - Outer ring: Thin cyan ring (#00F2FF)
 * - Inner slash: Vertical slash rotated 35 degrees (#84FFE6 mint)
 * - Smooth pulsing scale (1.00 → 1.05 → 1.00)
 * - Gentle rotation (3 degrees/sec)
 * - Opacity pulse (0.45 → 0.85)
 * - Camera-facing (billboard effect)
 */

import * as THREE from 'three';
import { safeSetEmissive } from './_EmissiveUtils.js';

export class MythicSeedGlyph {
  constructor(scene) {
    this.scene = scene;
    
    // ⚠️ MYTHIC RITUALS DISABLED — Glyphs will not be generated
    this.enabled = typeof window !== 'undefined' ? !window.ATOMA_DISABLE_MYTHIC_RITUALS : false;
    
    // Registry: nodeId → glyph data
    this.glyphRegistry = new Map();
    
    // Colors (ATOMA style)
    this.colors = {
      outerRing: 0x00F2FF,     // Cyan
      innerSlash: 0x84FFE6,    // Mint
    };
    
    // Animation parameters
    this.pulseSpeed = 2.0;           // Full pulse cycle in 2 seconds
    this.rotationSpeed = 0.05235;    // 3 degrees per second (in radians)
    this.minOpacity = 0.45;
    this.maxOpacity = 0.85;
    this.minScale = 1.00;
    this.maxScale = 1.05;
    
    if (!this.enabled) {
      console.log('⚠️ [MythicSeedGlyph] Disabled (window.ATOMA_DISABLE_MYTHIC_RITUALS = true)');
    } else {
      console.log('✓ Mythic Seed Glyph System initialized');
    }
  }

  /**
   * MATERIAL SAFETY: Ensures material supports emissive properties
   */
  ensureEmissiveSafe(mat) {
    if (!mat || typeof mat !== 'object') return false;
    return (
      mat.isMeshStandardMaterial ||
      mat.isMeshLambertMaterial ||
      mat.isMeshPhongMaterial ||
      mat.isMeshToonMaterial
    );
  }
  
  /**
   * Create a mythic seed glyph for a node
   * @param {THREE.Object3D} node - Node object
   * @param {string} nodeId - Unique node identifier
   */
  createGlyph(node, nodeId) {
    // SAFETY: Do not generate glyphs if rituals disabled
    if (!this.enabled) return null;
    
    if (!node) {
      console.warn('MythicSeedGlyph: Cannot create glyph for null node');
      return;
    }
    
    // Check if glyph already exists
    if (this.glyphRegistry.has(nodeId)) {
      return; // Already has a glyph
    }
    
    // Create glyph container
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      isMythicSeedGlyph: true,
      isVFX: true,
      noEvolve: true
    };
    
    // 1) OUTER RING
    const ringGeometry = new THREE.RingGeometry(0.28, 0.32, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.outerRing,
      transparent: true,
      opacity: this.minOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    });
    
    const outerRing = new THREE.Mesh(ringGeometry, ringMaterial);
    outerRing.userData = {
      vfxType: 'mythicGlyphRing',
      isVFX: true
    };
    glyphGroup.add(outerRing);
    
    // 2) INNER SLASH (rotated 35 degrees)
    const slashGeometry = new THREE.PlaneGeometry(0.04, 0.45);
    const slashMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.innerSlash,
      transparent: true,
      opacity: this.minOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    });
    
    const innerSlash = new THREE.Mesh(slashGeometry, slashMaterial);
    innerSlash.rotation.z = (35 * Math.PI) / 180; // 35 degrees
    innerSlash.userData = {
      vfxType: 'mythicGlyphSlash',
      isVFX: true
    };
    glyphGroup.add(innerSlash);
    
    // Position glyph above node
    glyphGroup.position.y = 1.2;
    
    // Attach to node (check for visualGroup or use node directly)
    let attachmentPoint = node;
    if (node.children && node.children.length > 0) {
      // Try to find visualGroup in children
      const visualGroup = node.children.find(child => 
        child.userData?.isVisualGroup || child.name === 'visualGroup'
      );
      if (visualGroup) {
        attachmentPoint = visualGroup;
      }
    }
    
    if (attachmentPoint && attachmentPoint.add) {
      attachmentPoint.add(glyphGroup);
    } else {
      console.warn('MythicSeedGlyph: Invalid attachment point for node', nodeId);
      return;
    }
    
    // Register glyph
    this.glyphRegistry.set(nodeId, {
      node,
      glyphGroup,
      outerRing,
      innerSlash,
      pulsePhase: Math.random() * Math.PI * 2, // Random start phase
      rotationAngle: 0,
      attachmentPoint
    });
    
    console.log(`✓ Mythic Seed Glyph created for node ${nodeId}`);
  }
  
  /**
   * Remove glyph from a node with graceful fade-out
   * @param {string} nodeId - Unique node identifier
   */
  removeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;
    
    const { glyphGroup, outerRing, innerSlash, attachmentPoint } = glyphData;
    
    // Graceful fade-out animation (0.6s)
    const fadeOutDuration = 0.6; // seconds
    const scaleUpFactor = 1.12; // 12% scale up during fade
    
    let elapsed = 0;
    const animateOut = () => {
      elapsed += 0.016; // ~60 FPS
      const progress = Math.min(elapsed / fadeOutDuration, 1.0);
      
      if (glyphGroup && glyphGroup.parent) {
        // Fade opacity
        const opacity = this.minOpacity * (1 - progress);
        if (outerRing && outerRing.material) {
          outerRing.material.opacity = opacity;
        }
        if (innerSlash && innerSlash.material) {
          innerSlash.material.opacity = opacity;
        }
        
        // Scale up slightly
        const scale = 1.0 + (progress * (scaleUpFactor - 1.0));
        glyphGroup.scale.set(scale, scale, scale);
      }
      
      if (progress < 1.0) {
        requestAnimationFrame(animateOut);
      } else {
        // Cleanup
        this.disposeGlyph(nodeId);
      }
    };
    
    animateOut();
  }
  
  /**
   * Dispose glyph completely (internal use)
   * @param {string} nodeId - Unique node identifier
   */
  disposeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;
    
    const { glyphGroup, outerRing, innerSlash, attachmentPoint } = glyphData;
    
    // Remove from parent
    if (glyphGroup && glyphGroup.parent) {
      glyphGroup.parent.remove(glyphGroup);
    }
    
    // Dispose materials
    if (outerRing && outerRing.material) {
      outerRing.material.dispose();
    }
    if (innerSlash && innerSlash.material) {
      innerSlash.material.dispose();
    }
    
    // Dispose geometries
    if (outerRing && outerRing.geometry) {
      outerRing.geometry.dispose();
    }
    if (innerSlash && innerSlash.geometry) {
      innerSlash.geometry.dispose();
    }
    
    // Remove from registry
    this.glyphRegistry.delete(nodeId);
    
    console.log(`✓ Mythic Seed Glyph disposed for node ${nodeId}`);
  }
  
  /**
   * Remove all old markers from nodes (yellow triangles, debug markers, etc.)
   */
  removeOldMarkers() {
    let removalCount = 0;
    
    this.scene.traverse((child) => {
      if (!child.parent || !child.userData) return;
      
      // LUCY MEGA PATCH 1.0: Type guards with return (not continue in traverse callback)
      if (!child.isMesh) return;
      if (!child.material) return;
      if (!child.material.isMeshStandardMaterial) return;

      // Check for old marker names
      const isOldMarker = 
        child.name === 'debugMarker' ||
        child.name === 'ascendMarker' ||
        child.name === 'seedGlyph' ||
        child.name === 'triangle' ||
        child.name === 'yellowMarker' ||
        child.userData.isDebugMarker ||
        child.userData.isAscendMarker;
      
      // Check for yellow materials (0xFFFF00 or close to it)
      const hasYellowMaterial = child.material && 
        (child.material.color && this.isCloseToYellow(child.material.color)) ||
        (child.material.emissive && this.isCloseToYellow(child.material.emissive));
      
      if (isOldMarker || hasYellowMaterial) {
        // Dispose material and geometry
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        // Remove from parent
        child.parent.remove(child);
        removalCount++;
      }
    });
    
    if (removalCount > 0) {
      console.log(`✓ Removed ${removalCount} old debug markers/triangles`);
    }
  }
  
  /**
   * Check if a color is close to yellow (0xFFFF00)
   * @param {THREE.Color} color - Color to check
   * @returns {boolean}
   */
  isCloseToYellow(color) {
    if (!color || !color.r) return false;
    
    // Yellow is (r=1, g=1, b=0)
    // Check if color is close to yellow within tolerance
    const tolerance = 0.15;
    return (
      Math.abs(color.r - 1.0) < tolerance &&
      Math.abs(color.g - 1.0) < tolerance &&
      color.b < tolerance
    );
  }
  
  /**
   * Update all glyphs (animations, billboard effect)
   * @param {number} deltaTime - Time since last frame (seconds)
   * @param {THREE.Camera} camera - Main camera for billboard effect
   */
  update(deltaTime, camera) {
    if (!camera) return;
    
    for (const [nodeId, glyphData] of this.glyphRegistry) {
      const { node, glyphGroup, outerRing, innerSlash } = glyphData;
      
      // Safety checks
      if (!node || !glyphGroup || !glyphGroup.parent) {
        // Node was removed, clean up
        this.disposeGlyph(nodeId);
        continue;
      }
      
      // Update pulse phase
      glyphData.pulsePhase += deltaTime * this.pulseSpeed;
      const pulseFactor = (Math.sin(glyphData.pulsePhase) + 1.0) * 0.5; // 0 to 1
      
      // Update scale (subtle pulse)
      const scale = this.minScale + (pulseFactor * (this.maxScale - this.minScale));
      glyphGroup.scale.set(scale, scale, scale);
      
      // Update opacity (tied to pulse)
      const opacity = this.minOpacity + (pulseFactor * (this.maxOpacity - this.minOpacity));
      if (outerRing && outerRing.material) {
        outerRing.material.opacity = opacity;
      }
      if (innerSlash && innerSlash.material) {
        innerSlash.material.opacity = opacity;
      }
      
      // Update rotation (slow spin)
      glyphData.rotationAngle += this.rotationSpeed * deltaTime;
      glyphGroup.rotation.z = glyphData.rotationAngle;
      
      // Billboard effect (face camera)
      if (glyphGroup.lookAt) {
        try {
          glyphGroup.lookAt(camera.position);
        } catch (e) {
          // Ignore lookAt errors (rare edge case)
        }
      }
    }
  }
  
  /**
   * Scan nodes and auto-apply glyphs to mythic/seeded nodes
   * @param {Array} nodes - Array of node objects to scan
   */
  scanAndApplyGlyphs(nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    nodes.forEach((node, index) => {
      if (!node || !node.userData) return;
      
      const nodeId = node.uuid || `node-${index}`;
      
      // Check if node should have a glyph
      const shouldHaveGlyph = 
        node.userData.isMythic ||
        node.userData.mythicSeeded ||
        node.userData.category === 'mythic' ||
        (node.userData.personality && node.userData.personality.type === 'MYTHIC_ARCHETYPE');
      
      if (shouldHaveGlyph && !this.glyphRegistry.has(nodeId)) {
        // Node needs a glyph but doesn't have one - create it
        this.createGlyph(node, nodeId);
      } else if (!shouldHaveGlyph && this.glyphRegistry.has(nodeId)) {
        // Node has a glyph but shouldn't - remove it
        this.removeGlyph(nodeId);
      }
    });
  }
  
  /**
   * Get status report
   */
  getStatus() {
    return {
      activeGlyphs: this.glyphRegistry.size,
      glyphIds: Array.from(this.glyphRegistry.keys())
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    const status = this.getStatus();
    console.group('🌟 Mythic Seed Glyph System Status');
    console.log(`Active Glyphs: ${status.activeGlyphs}`);
    if (status.activeGlyphs > 0) {
      console.log('Glyph IDs:', status.glyphIds);
    }
    console.groupEnd();
  }
  
  /**
   * Cleanup all glyphs
   */
  cleanup() {
    for (const nodeId of this.glyphRegistry.keys()) {
      this.disposeGlyph(nodeId);
    }
    
    console.log('✓ Mythic Seed Glyph System cleaned up');
  }
}
