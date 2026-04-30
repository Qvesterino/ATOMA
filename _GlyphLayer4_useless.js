/**
 * ATOMA GLYPH LAYER 4.0 - USELESS GLYPHS (DISABLED LAYERS)
 * 
 * This file contains glyph layers that were NEVER functional:
 * - Layer 1: Core Glyph (intentionally disabled - returns null)
 * - Layer 3: Personality Glyph (requires personalityMetrics which never set)
 * - Layer 4: State Glyph (requires flags: consciousness/ascended/mythicSeedActive/ritualInfluence/clusterEvent)
 * - Fallback: Neural Point Dot (generic fallback)
 * 
 * KEPT FOR REFERENCE ONLY - NOT USED IN RUNTIME
 * 
 * The only functional glyph is Evolution Glyph (Layer 2) - see _GlyphLayer4_MultiFusion.js
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class GlyphLayer4_Useless {
  constructor() {
    this.colors = {
      cyan: 0x00F2FF,
      mint: 0x84FFE6,
      magenta: 0xFF00FF,
      violet: 0x9933FF,
      gold: 0xFFD700,
      white: 0xFFFFFF,
      blue: 0x0099FF,
      green: 0x00FF88,
      red: 0xFF3333,
      dark: 0x0a0a14,
      orange: 0xFF8800,
      pink: 0xFF66FF
    };
  }

  // ============================================================
  // LAYER 1: CORE GLYPH (Category-Based)
  // ============================================================
  
  createCoreGlyph(node, nodeId) {
    return null;
  }
  
  updateCoreGlyph(coreGroup, deltaTime) {
    if (!coreGroup) return;
    coreGroup.rotation.y += coreGroup.userData.rotationSpeed * deltaTime;
    coreGroup.rotation.x += coreGroup.userData.rotationSpeed * 0.3 * deltaTime;
    coreGroup.userData.bobPhase += deltaTime * 2;
    const bob = Math.sin(coreGroup.userData.bobPhase) * 0.02;
    coreGroup.position.y = 0.08 + bob;
  }

  // ============================================================
  // LAYER 3: PERSONALITY GLYPH (Synergy/Harmony/etc)
  // ============================================================
  
  getDominantPersonality(node) {
    const metrics = node.userData?.personalityMetrics || {};
    const personalities = [
      { name: 'synergy', value: metrics.synergy || 0 },
      { name: 'harmony', value: metrics.harmony || 0 },
      { name: 'stability', value: metrics.stability || 0 },
      { name: 'corruption', value: metrics.corruption || 0 },
      { name: 'clarity', value: metrics.stability || 0 }
    ];
    const dominant = personalities.reduce((max, p) => p.value > max.value ? p : max);
    return dominant.value > 0.3 ? dominant.name : null;
  }
  
  createPersonalityGlyph(node, nodeId) {
    const personality = this.getDominantPersonality(node);
    if (!personality) return null;
    
    const persGroup = new THREE.Group();
    persGroup.userData = {
      glyphLayer: 'personality',
      personality,
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    persGroup.name = `glyph_pers_${nodeId}`;
    persGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    const personalityConfigs = {
      'synergy': {
        geometry: () => new THREE.TorusGeometry(0.105, 0.012, 8, 28),
        color: this.colors.cyan,
        emissive: this.colors.cyan,
        emissiveIntensity: 0.3,
        opacity: 0.45
      },
      'harmony': {
        geometry: () => new THREE.TorusGeometry(0.11, 0.01, 8, 28),
        color: this.colors.green,
        emissive: this.colors.green,
        emissiveIntensity: 0.25,
        opacity: 0.4
      },
      'stability': {
        geometry: () => new THREE.TorusGeometry(0.095, 0.013, 8, 24),
        color: this.colors.red,
        emissive: this.colors.red,
        emissiveIntensity: 0.3,
        opacity: 0.5
      },
      'corruption': {
        geometry: () => new THREE.TorusGeometry(0.1, 0.03, 8, 12),
        color: this.colors.magenta,
        emissive: this.colors.magenta,
        emissiveIntensity: 0.25,
        opacity: 0.45
      },
      'clarity': {
        geometry: () => new THREE.TorusGeometry(0.1, 0.01, 8, 30),
        color: this.colors.white,
        emissive: this.colors.white,
        emissiveIntensity: 0.2,
        opacity: 0.4
      }
    };
    
    const config = personalityConfigs[personality] || personalityConfigs['harmony'];
    const geo = config.geometry();
    const mat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      fog: false
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { glyphComponent: 'personalityMarker' };
    persGroup.add(mesh);
    
    persGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    persGroup.userData.rotationSpeed = 0.3;
    
    return persGroup;
  }
  
  updatePersonalityGlyph(persGroup, deltaTime) {
    if (!persGroup) return;
    persGroup.rotation.y += persGroup.userData.rotationSpeed * deltaTime;
    persGroup.userData.pulsePhase += deltaTime * 1.5;
    const pulse = (Math.sin(persGroup.userData.pulsePhase) + 1) * 0.5;
    persGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.3 + pulse * 0.2;
      }
    });
  }

  // ============================================================
  // LAYER 4: STATE GLYPH (Consciousness/Ascended/Mythic/etc)
  // ============================================================
  
  createStateGlyph(node, nodeId) {
    if (node.userData?.consciousness === true) {
      return this.createConsciousnessStateGlyph(node, nodeId);
    }
    if (node.userData?.ascended === true) {
      return this.createAscendedStateGlyph(node, nodeId);
    }
    if (node.userData?.mythicSeedActive === true) {
      return this.createMythicStateGlyph(node, nodeId);
    }
    if (node.userData?.ritualInfluence === true) {
      return this.createRitualStateGlyph(node, nodeId);
    }
    if (node.userData?.clusterEvent === true) {
      return this.createClusterStateGlyph(node, nodeId);
    }
    return null;
  }
  
  createConsciousnessStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'consciousness',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_consciousness_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    const hexGeometry = this.createHexagonGeometry(0.18, 0.12, 0.06);
    const hexMat = new THREE.LineBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    
    const hex = new THREE.LineSegments(hexGeometry, hexMat);
    hex.userData = { glyphComponent: 'consciousnessHex' };
    stateGroup.add(hex);
    
    const coreGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.5,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.4,
      fog: false
    });
    
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { glyphComponent: 'consciousnessCore' };
    stateGroup.add(core);
    
    stateGroup.userData.rotationSpeed = 0.15;
    stateGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.8;
    
    return stateGroup;
  }
  
  createAscendedStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'ascended',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_ascended_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    const radii = [0.16, 0.22, 0.28];
    const colors = [this.colors.white, this.colors.blue, this.colors.cyan];
    const speeds = [0.3, -0.2, 0.25];
    
    radii.forEach((radius, idx) => {
      const ringPoints = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const mat = new THREE.LineBasicMaterial({
        color: colors[idx],
        transparent: true,
        opacity: 0.6 - idx * 0.1,
        fog: false
      });
      const ring = new THREE.LineLoop(ringGeometry, mat);
      ring.userData = {
        glyphComponent: 'ascendedRing',
        ringIndex: idx,
        rotationSpeed: speeds[idx]
      };
      stateGroup.add(ring);
    });
    
    stateGroup.userData.ringPhases = [0, 0, 0];
    stateGroup.position.y = 0.85;
    
    return stateGroup;
  }
  
  createMythicStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'mythic',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_mythic_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    for (let i = 0; i < 3; i++) {
      const triGeo = new THREE.ConeGeometry(0.07, 0.14, 3);
      const triMat = new THREE.MeshBasicMaterial({
        color: this.colors.violet,
        transparent: true,
        opacity: 0.65,
        emissive: this.colors.magenta,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const tri = new THREE.Mesh(triGeo, triMat);
      tri.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.2;
      tri.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.2;
      tri.rotation.x = Math.PI / 2;
      tri.userData = {
        glyphComponent: 'mythicTri',
        triIndex: i,
        orbitRadius: 0.2
      };
      stateGroup.add(tri);
    }
    
    stateGroup.userData.orbitSpeed = 1.0;
    stateGroup.userData.breathPhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.75;
    
    return stateGroup;
  }
  
  createRitualStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'ritual',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_ritual_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      positions.push(Math.cos(angle) * 0.1, 0, Math.sin(angle) * 0.1);
    }
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      positions.push(Math.cos(angle) * 0.1 + 0.07, 0, Math.sin(angle) * 0.1);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    
    const mat = new THREE.LineBasicMaterial({
      color: this.colors.gold,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    
    const lines = new THREE.LineSegments(geometry, mat);
    lines.userData = { glyphComponent: 'ritualEclipse' };
    stateGroup.add(lines);
    
    stateGroup.userData.rotationSpeed = 1.2;
    stateGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.7;
    
    return stateGroup;
  }
  
  createClusterStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'cluster',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    stateGroup.name = `glyph_state_cluster_${nodeId}`;
    
    const geometry = new THREE.IcosahedronGeometry(0.13, 1);
    const mat = new THREE.LineBasicMaterial({
      color: this.colors.pink,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    
    const web = new THREE.LineSegments(geometry, mat);
    web.userData = { glyphComponent: 'clusterWeb' };
    stateGroup.add(web);
    
    stateGroup.userData.rotationSpeed = 0.4;
    stateGroup.userData.expandPhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.8;
    
    return stateGroup;
  }
  
  updateStateGlyph(stateGroup, deltaTime) {
    if (!stateGroup) return;
    
    const stateType = stateGroup.userData.stateType;
    
    if (stateType === 'consciousness') {
      stateGroup.rotation.y += stateGroup.userData.rotationSpeed * deltaTime;
      stateGroup.userData.pulsePhase += deltaTime * 1.5;
      const pulse = (Math.sin(stateGroup.userData.pulsePhase) + 1) * 0.5;
      stateGroup.children.forEach(child => {
        if (child.userData?.glyphComponent === 'consciousnessCore' && child.material) {
          child.material.opacity = 0.3 + pulse * 0.3;
        }
      });
    } else if (stateType === 'ascended') {
      stateGroup.children.forEach((child, idx) => {
        if (child.userData?.glyphComponent === 'ascendedRing') {
          const speed = child.userData.rotationSpeed;
          stateGroup.userData.ringPhases[idx] = (stateGroup.userData.ringPhases[idx] + speed * deltaTime) % (Math.PI * 2);
          child.rotation.y = stateGroup.userData.ringPhases[idx];
        }
      });
    } else if (stateType === 'mythic') {
      stateGroup.userData.orbitSpeed += deltaTime;
      stateGroup.children.forEach((child, idx) => {
        if (child.userData?.glyphComponent === 'mythicTri') {
          const orbitAngle = stateGroup.userData.orbitSpeed * 2 + (idx / 3) * Math.PI * 2;
          child.position.x = Math.cos(orbitAngle) * 0.2;
          child.position.z = Math.sin(orbitAngle) * 0.2;
          child.rotation.y = orbitAngle;
        }
      });
      stateGroup.userData.breathPhase += deltaTime;
      const breath = (Math.sin(stateGroup.userData.breathPhase) + 1) * 0.5;
      stateGroup.scale.set(1 + breath * 0.05, 1 + breath * 0.05, 1 + breath * 0.05);
    } else if (stateType === 'ritual') {
      stateGroup.rotation.z += stateGroup.userData.rotationSpeed * deltaTime;
      stateGroup.userData.pulsePhase += deltaTime * 2;
      const pulse = (Math.sin(stateGroup.userData.pulsePhase) + 1) * 0.5;
      stateGroup.children.forEach(child => {
        if (child.material) {
          child.material.opacity = 0.5 + pulse * 0.2;
        }
      });
    } else if (stateType === 'cluster') {
      stateGroup.rotation.x += stateGroup.userData.rotationSpeed * deltaTime;
      stateGroup.rotation.y += stateGroup.userData.rotationSpeed * 0.7 * deltaTime;
      stateGroup.userData.expandPhase += deltaTime;
      const expand = (Math.sin(stateGroup.userData.expandPhase) + 1) * 0.5;
      stateGroup.scale.set(1 + expand * 0.08, 1 + expand * 0.08, 1 + expand * 0.08);
    }
  }

  // ============================================================
  // FALLBACK GLYPH (Neural Point Dot)
  // ============================================================
  
  createFallbackGlyph(node, nodeId) {
    const fallbackGroup = new THREE.Group();
    fallbackGroup.userData = {
      glyphLayer: 'fallback',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    fallbackGroup.name = `glyph_fallback_${nodeId}`;
    fallbackGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    const dotGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const dotMat = new THREE.MeshBasicMaterial({
      color: this.colors.white,
      transparent: true,
      opacity: 0.3,
      emissive: this.colors.white,
      emissiveIntensity: 0.1,
      fog: false
    });
    
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.userData = { glyphComponent: 'neuralPoint' };
    fallbackGroup.add(dot);
    
    fallbackGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    fallbackGroup.position.y = 0.5;
    
    return fallbackGroup;
  }
  
  updateFallbackGlyph(fallbackGroup, deltaTime) {
    if (!fallbackGroup) return;
    fallbackGroup.userData.pulsePhase += deltaTime * 0.6;
    const pulse = (Math.sin(fallbackGroup.userData.pulsePhase) + 1) * 0.5;
    fallbackGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.15 + pulse * 0.15;
      }
    });
  }

  // ============================================================
  // UTILITY: Hexagon Geometry (for state glyphs)
  // ============================================================
  
  createHexagonGeometry(outerRadius, innerRadius, gap) {
    const shape = new THREE.Shape();
    const points = 6;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }
}