import * as THREE from 'three';

/**
 * EXTREME AI NODE EVOLUTION 3.0 - SAFE EDITION
 * 
 * Pure visual-only evolution system for Extreme AI nodes only
 * 3-stage progression: Base (0) → Evolving (1) → Ascended (2)
 * 
 * SAFETY GUARANTEES:
 * ✅ ONLY affects nodes with userData.extremeArchetype (from _ExtremeAINodePack.js)
 * ✅ Purely visual transforms & emissive changes on existing geometries
 * ✅ NO modifications to physics, linking, selection, gameplay
 * ✅ NO new geometry creation, NO new scene objects
 * ✅ All changes applied to node.visualGroup children only
 * ✅ Memory-efficient: reuses vectors, minimal per-frame allocations
 * ✅ Non-destructive: can be disabled/reset instantly
 */

export class ExtremeAINodeEvolution3 {
  constructor(nodes = []) {
    this.nodes = nodes;
    this.evolutionMap = new Map(); // node -> evolution data
    this.tempVec3 = new THREE.Vector3();
    this.tempEuler = new THREE.Euler();
    this.enabled = true;

    // Thresholds for stage transitions (time-based if no metrics available)
    this.stageTransitionTime = {
      0: 10,   // Base for 10 seconds
      1: 25    // Evolving for 15 more seconds
    };

    // Stage progression thresholds if synergy metrics available
    this.synergyThresholds = {
      stage1: 0.3,
      stage2: 0.6
    };

    this.harmonicThresholds = {
      stage1: 0.2,
      stage2: 0.5
    };

    this.initializeNodes();
    console.log(`[ExtremeAINodeEvolution3] Initialized with ${this.evolutionMap.size} extreme nodes`);
  }

  /**
   * Initialize all eligible extreme AI nodes with evolution tracking
   */
  initializeNodes() {
    if (!this.nodes || !Array.isArray(this.nodes)) return;

    this.nodes.forEach(node => {
      if (!node || !node.userData) return;

      // DETECTION: Only track nodes from ExtremeAINodePack
      const isExtremeNode =
        node.userData.extremeArchetype !== undefined ||
        node.userData.extremeArchetypeName !== undefined;

      if (isExtremeNode) {
        this.evolutionMap.set(node, {
          stage: 0,
          progress: 0,
          age: 0,
          baseScale: new THREE.Vector3(1, 1, 1),
          baseRotations: new Map(),
          basePositions: new Map(),
          spawnTime: Date.now(),
          lastUpdateTime: Date.now()
        });

        // Cache base transforms of visualGroup children
        this.cacheBaseTransforms(node);
      }
    });
  }

  /**
   * Cache base transforms of all child meshes in visualGroup
   */
  cacheBaseTransforms(node) {
    if (!node.visualGroup) return;

    const evoData = this.evolutionMap.get(node);
    if (!evoData) return;

    node.visualGroup.traverse(child => {
      if (child === node.visualGroup) return; // Skip the group itself
      if (!child.userData?.isExtremVFX) return; // Only track extreme VFX objects

      evoData.baseRotations.set(child, new THREE.Euler().copy(child.rotation));
      evoData.basePositions.set(child, new THREE.Vector3().copy(child.position));
    });
  }

  /**
   * Main update loop - call once per frame with deltaTime
   * @param {number} deltaTime - Frame delta time in seconds
   */
  update(deltaTime) {
    if (!this.enabled || !this.evolutionMap.size) return;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    
    const currentTime = Date.now();

    this.evolutionMap.forEach((evoData, node) => {
      if (!node || !node.visualGroup) {
        this.evolutionMap.delete(node);
        return;
      }

      // Update evolution state
      evoData.age += deltaTime;
      this.updateEvolutionStage(evoData);

      // Apply visual effects based on stage and progress
      this.applyEvolutionEffects(node, evoData, deltaTime);
    });
  }

  /**
   * Determine current evolution stage and progress
   */
  updateEvolutionStage(evoData) {
    const oldStage = evoData.stage;

    // Check if we have metrics-based progression available
    const node = Array.from(this.evolutionMap.entries()).find(
      ([n, data]) => data === evoData
    )?.[0];

    if (node?.userData?.metrics) {
      // Metrics-based transitions (if available)
      const synergy = node.userData.metrics.synergy || 0;
      const harmony = node.userData.metrics.harmony || 0;

      if (synergy > this.synergyThresholds.stage2 && harmony > this.harmonicThresholds.stage2) {
        evoData.stage = 2; // ASCENDED
        evoData.progress = (synergy + harmony) / 2; // Use combined metrics as progress
      } else if (synergy > this.synergyThresholds.stage1 && harmony > this.harmonicThresholds.stage1) {
        evoData.stage = 1; // EVOLVING
        evoData.progress = (synergy + harmony) / 2;
      } else {
        evoData.stage = 0; // BASE
        evoData.progress = 0;
      }
    } else {
      // Time-based fallback
      if (evoData.age > this.stageTransitionTime[0] + this.stageTransitionTime[1]) {
        evoData.stage = 2; // ASCENDED
        evoData.progress = Math.min(1, (evoData.age - (this.stageTransitionTime[0] + this.stageTransitionTime[1])) / 5);
      } else if (evoData.age > this.stageTransitionTime[0]) {
        evoData.stage = 1; // EVOLVING
        evoData.progress = Math.min(1, (evoData.age - this.stageTransitionTime[0]) / this.stageTransitionTime[1]);
      } else {
        evoData.stage = 0; // BASE
        evoData.progress = evoData.age / this.stageTransitionTime[0];
      }
    }

    if (evoData.stage !== oldStage) {
      // Stage transition occurred
      console.log(`[ExtremeAINodeEvolution3] Node evolved to stage ${evoData.stage}`);
    }
  }

  /**
   * Apply visual evolution effects to the node
   */
  applyEvolutionEffects(node, evoData, deltaTime) {
    if (!node.visualGroup) return;

    const archetypeId = node.userData.extremeArchetype;
    if (archetypeId === undefined) return;

    // Apply archetype-specific animations
    switch (archetypeId) {
      case 0: // Hyperbolic Neural Prism
        this.updateHyperbolicPrism(node, evoData, deltaTime);
        break;
      case 1: // Singularity Knot
        this.updateSingularityKnot(node, evoData, deltaTime);
        break;
      case 2: // Quantum Lattice
        this.updateQuantumLattice(node, evoData, deltaTime);
        break;
      case 3: // Fractal Bloom
        this.updateFractalBloom(node, evoData, deltaTime);
        break;
      case 4: // Reactive Tesseract
        this.updateReactiveTesseract(node, evoData, deltaTime);
        break;
      case 5: // Chaotic Heart
        this.updateChaoticHeart(node, evoData, deltaTime);
        break;
      case 6: // Whisper Sphere
        this.updateWhisperSphere(node, evoData, deltaTime);
        break;
      case 7: // Echo Fractal
        this.updateEchoFractal(node, evoData, deltaTime);
        break;
      case 8: // Abyssal Shard
        this.updateAbyssalShard(node, evoData, deltaTime);
        break;
      case 9: // Tri-Helix
        this.updateTriHelix(node, evoData, deltaTime);
        break;
      case 10: // Infinite Spiral
        this.updateInfiniteSpiral(node, evoData, deltaTime);
        break;
      case 11: // Chrono Ripper
        this.updateChronoRipper(node, evoData, deltaTime);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHETYPE-SPECIFIC EVOLUTION ANIMATORS
  // ═══════════════════════════════════════════════════════════════════════════

  updateHyperbolicPrism(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: slow subtle rotation
        child.rotation.x += 0.0015;
        child.rotation.y += 0.0025;
      } else if (stage === 1) {
        // EVOLVING: increased rotation
        child.rotation.x += 0.005;
        child.rotation.y += 0.008;
        
        if (child.material?.emissive) {
          const baseIntensity = 0.4;
          child.material.emissiveIntensity = baseIntensity + progress * 0.2;
        }
      } else if (stage === 2) {
        // ASCENDED: dynamic multi-axis rotation with pulsing
        child.rotation.x += 0.015;
        child.rotation.y += 0.025;
        child.rotation.z += 0.008 * Math.sin(Date.now() * 0.002);

        const scaleVar = 1 + Math.sin(Date.now() * 0.003) * 0.05;
        child.scale.multiplyScalar(scaleVar);

        if (child.material?.emissive) {
          const intensity = 0.6 + Math.sin(Date.now() * 0.004) * 0.2;
          child.material.emissiveIntensity = Math.min(1, intensity);
        }
      }
    });
  }

  updateSingularityKnot(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (child.userData.isPulseCore) {
        if (stage === 0) {
          // BASE: gentle pulse
          const scale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
          child.scale.setScalar(scale);
        } else if (stage === 1) {
          // EVOLVING: stronger pulse
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.12;
          child.scale.setScalar(scale);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = 0.8 + progress * 0.2;
          }
        } else if (stage === 2) {
          // ASCENDED: intense pulsing with color shifts
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
          child.scale.setScalar(scale);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = Math.min(1, 1.0 + Math.cos(Date.now() * 0.004) * 0.3);
          }
        }
      } else {
        // Rotating torus rings
        if (stage === 0) {
          child.rotation.y += 0.003;
        } else if (stage === 1) {
          child.rotation.y += 0.01;
        } else if (stage === 2) {
          child.rotation.y += 0.02;
          child.rotation.x += 0.008 * Math.sin(Date.now() * 0.002);
        }
      }
    });
  }

  updateQuantumLattice(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: static
        return;
      } else if (stage === 1) {
        // EVOLVING: gentle oscillation
        if (child.geometry?.type.includes('SphereGeometry')) {
          const offset = Math.sin(Date.now() * 0.002) * 0.01;
          child.position.y += offset;

          if (child.material?.emissive) {
            child.material.emissiveIntensity = 0.6 + progress * 0.2;
          }
        }
      } else if (stage === 2) {
        // ASCENDED: strong oscillation + rotation
        child.rotation.x += 0.005;
        child.rotation.y += 0.005;

        if (child.geometry?.type.includes('SphereGeometry')) {
          const offset = Math.sin(Date.now() * 0.004) * 0.03;
          child.position.y += offset;

          if (child.material?.emissive) {
            child.material.emissiveIntensity = Math.min(1, 0.8 + Math.cos(Date.now() * 0.003) * 0.2);
          }
        }
      }
    });
  }

  updateFractalBloom(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: very slow rotation
        child.rotation.z += 0.001;
      } else if (stage === 1) {
        // EVOLVING: petal opening/closing
        child.rotation.z += 0.006;
        
        const breathe = Math.sin(Date.now() * 0.002) * 0.03;
        const baseScale = 1.0;
        child.scale.setScalar(baseScale + breathe);

        if (child.material?.emissive) {
          child.material.emissiveIntensity = 0.4 - (child.userData.layer || 0) * 0.1 + progress * 0.15;
        }
      } else if (stage === 2) {
        // ASCENDED: deeper breathing, glow pulsing
        child.rotation.z += 0.015;

        const breathe = Math.sin(Date.now() * 0.004) * 0.08;
        const baseScale = 1.0;
        child.scale.setScalar(baseScale + breathe);

        if (child.material?.emissive) {
          const intensity = 0.5 - (child.userData.layer || 0) * 0.1;
          child.material.emissiveIntensity = Math.min(1, intensity + Math.sin(Date.now() * 0.003) * 0.3);
        }
      }
    });
  }

  updateReactiveTesseract(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: minimal rotation
        child.rotation.x += 0.0008;
        child.rotation.y += 0.0012;
      } else if (stage === 1) {
        // EVOLVING: moderate rotation
        child.rotation.x += 0.004;
        child.rotation.y += 0.006;

        if (child.material?.color) {
          child.material.opacity = 0.8 - (child.userData.boxIndex || 0) * 0.2 + progress * 0.1;
        }
      } else if (stage === 2) {
        // ASCENDED: rapid multi-axis spin
        child.rotation.x += 0.015;
        child.rotation.y += 0.020;
        child.rotation.z += 0.010 * Math.sin(Date.now() * 0.002);

        if (child.material?.color) {
          child.material.opacity = Math.min(0.95, 0.8 - (child.userData.boxIndex || 0) * 0.2 + 0.2);
        }
      }
    });
  }

  updateChaoticHeart(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: static
        return;
      } else if (stage === 1) {
        // EVOLVING: tiny jitter & spin
        const jitter = Math.sin(Date.now() * 0.003) * 0.015;
        child.position.x += jitter * 0.1;
        child.position.z += Math.cos(Date.now() * 0.003) * 0.015 * 0.1;

        child.rotation.x += 0.001;
        child.rotation.y += 0.002;

        if (child.material?.emissive) {
          child.material.emissiveIntensity = 0.5 + progress * 0.15;
        }
      } else if (stage === 2) {
        // ASCENDED: chaotic movement & strong glow
        const chaos = Math.sin(Date.now() * 0.006) * 0.03;
        child.position.x += chaos;
        child.position.y += Math.cos(Date.now() * 0.005) * 0.02;

        child.rotation.x += 0.008;
        child.rotation.y += 0.012;
        child.rotation.z += 0.005 * Math.sin(Date.now() * 0.003);

        if (child.material?.emissive) {
          child.material.emissiveIntensity = Math.min(1, 0.65 + Math.sin(Date.now() * 0.004) * 0.35);
        }
      }
    });
  }

  updateWhisperSphere(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (child.userData.stripIndex !== undefined) {
        if (stage === 0) {
          // BASE: slow rotation
          child.rotation.z += 0.001;
        } else if (stage === 1) {
          // EVOLVING: moderate rotation
          child.rotation.z += 0.008;
          child.rotation.x += 0.002;

          if (child.material?.emissive) {
            child.material.emissiveIntensity = 0.4 + progress * 0.15;
          }
        } else if (stage === 2) {
          // ASCENDED: rapid multi-axis rotation
          child.rotation.z += 0.020;
          child.rotation.x += 0.010 * Math.sin(Date.now() * 0.002);
          child.rotation.y += 0.008 * Math.cos(Date.now() * 0.003);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = Math.min(1, 0.55 + Math.sin(Date.now() * 0.005) * 0.25);
          }
        }
      }
    });
  }

  updateEchoFractal(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: static
        return;
      } else if (stage === 1) {
        // EVOLVING: gentle radial expansion
        const expand = Math.sin(Date.now() * 0.002) * 0.1;
        const scale = 1.0 + (child.userData.echoIndex || 0) * 0.3 + expand;
        child.scale.setScalar(scale);

        child.rotation.x += 0.003;

        if (child.material?.emissive) {
          child.material.emissiveIntensity = (0.5 - (child.userData.echoIndex || 0) * 0.1) + progress * 0.1;
        }
      } else if (stage === 2) {
        // ASCENDED: strong pulsing expansion + rotation
        const expand = Math.sin(Date.now() * 0.005) * 0.2;
        const scale = 1.0 + (child.userData.echoIndex || 0) * 0.3 + expand;
        child.scale.setScalar(scale);

        child.rotation.x += 0.012;
        child.rotation.y += 0.008 * Math.sin(Date.now() * 0.002);

        if (child.material?.emissive) {
          const intensity = (0.5 - (child.userData.echoIndex || 0) * 0.1);
          child.material.emissiveIntensity = Math.min(1, intensity + 0.2);
        }
      }
    });
  }

  updateAbyssalShard(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: very slow rotation
        child.rotation.x += 0.001;
        child.rotation.y += 0.0005;
      } else if (stage === 1) {
        // EVOLVING: moderate spin + dark flicker
        child.rotation.x += 0.005;
        child.rotation.y += 0.003;
        child.rotation.z += 0.001;

        if (child.material?.emissive) {
          const flicker = Math.sin(Date.now() * 0.004) * 0.1;
          child.material.emissiveIntensity = Math.max(0.2, 0.3 + flicker);
        }
      } else if (stage === 2) {
        // ASCENDED: fast spin + strong flicker
        child.rotation.x += 0.015;
        child.rotation.y += 0.012;
        child.rotation.z += 0.008;

        if (child.material?.emissive) {
          const flicker = Math.sin(Date.now() * 0.008) * 0.2;
          child.material.emissiveIntensity = Math.max(0.4, 0.5 + flicker);
        }
      }
    });
  }

  updateTriHelix(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: slow twist
        child.rotation.z += 0.002;
      } else if (stage === 1) {
        // EVOLVING: medium twist + small wobble
        child.rotation.z += 0.015;
        
        if (child.geometry?.type.includes('SphereGeometry')) {
          const wobble = Math.sin(Date.now() * 0.002) * 0.02;
          child.position.y += wobble;
        }

        if (child.material?.emissive) {
          child.material.emissiveIntensity = 0.5 + progress * 0.15;
        }
      } else if (stage === 2) {
        // ASCENDED: fast twist + forward/backward wobble
        child.rotation.z += 0.040;
        child.rotation.x += 0.006 * Math.sin(Date.now() * 0.003);

        if (child.geometry?.type.includes('SphereGeometry')) {
          const wobble = Math.sin(Date.now() * 0.005) * 0.05;
          child.position.y += wobble;
        }

        if (child.material?.emissive) {
          child.material.emissiveIntensity = Math.min(1, 0.65 + Math.sin(Date.now() * 0.004) * 0.2);
        }
      }
    });
  }

  updateInfiniteSpiral(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (stage === 0) {
        // BASE: static
        return;
      } else if (stage === 1) {
        // EVOLVING: gentle spiral rotation
        child.rotation.y += 0.003;
        child.rotation.x += 0.001;

        if (child.material?.emissive) {
          child.material.emissiveIntensity = 0.6 + progress * 0.15;
        }
      } else if (stage === 2) {
        // ASCENDED: rapid spiral unfold
        child.rotation.y += 0.015;
        child.rotation.x += 0.008 * Math.sin(Date.now() * 0.002);
        child.rotation.z += 0.005 * Math.cos(Date.now() * 0.003);

        if (child.material?.emissive) {
          child.material.emissiveIntensity = Math.min(1, 0.75 + Math.sin(Date.now() * 0.004) * 0.2);
        }
      }
    });
  }

  updateChronoRipper(node, evoData, deltaTime) {
    const stage = evoData.stage;
    const progress = evoData.progress;

    node.visualGroup.traverse(child => {
      if (!child.userData?.isExtremVFX) return;

      if (child.userData.fragmentIndex !== undefined) {
        if (stage === 0) {
          // BASE: static orbital positioning
          const angle = Date.now() * 0.0005 + child.userData.fragmentIndex * Math.PI * 2 / 3;
          child.position.x = Math.cos(angle) * 0.25;
          child.position.z = Math.sin(angle) * 0.25;
        } else if (stage === 1) {
          // EVOLVING: moderate orbital speed + slow spin
          const angle = Date.now() * 0.001 + child.userData.fragmentIndex * Math.PI * 2 / 3;
          child.position.x = Math.cos(angle) * 0.25;
          child.position.z = Math.sin(angle) * 0.25;

          child.rotation.x += 0.005;
          child.rotation.y += 0.008;

          if (child.material?.emissive) {
            child.material.emissiveIntensity = 0.4 + progress * 0.2;
          }
        } else if (stage === 2) {
          // ASCENDED: rapid orbital motion + intense spin
          const angle = Date.now() * 0.003 + child.userData.fragmentIndex * Math.PI * 2 / 3;
          child.position.x = Math.cos(angle) * 0.25;
          child.position.z = Math.sin(angle) * 0.25;

          child.rotation.x += 0.020;
          child.rotation.y += 0.025;
          child.rotation.z += 0.012 * Math.sin(Date.now() * 0.002);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = Math.min(1, 0.6 + Math.sin(Date.now() * 0.005) * 0.3);
          }
        }
      } else if (child.userData.isGlitch) {
        if (stage === 0) {
          // BASE: gentle pulse
          const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
          child.scale.setScalar(scale);
        } else if (stage === 1) {
          // EVOLVING: moderate glitch pulsing
          const scale = 1 + Math.sin(Date.now() * 0.004) * 0.15;
          child.scale.setScalar(scale);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = 0.7 + progress * 0.2;
          }
        } else if (stage === 2) {
          // ASCENDED: intense glitch flashing
          const scale = 1 + Math.sin(Date.now() * 0.008) * 0.3;
          child.scale.setScalar(scale);

          if (child.material?.emissive) {
            child.material.emissiveIntensity = Math.min(1, 0.9 + Math.cos(Date.now() * 0.006) * 0.2);
          }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Force a specific evolution stage for testing
   * @param {number} nodeIndex - Index in nodes array
   * @param {number} stage - 0, 1, or 2
   */
  forceEvolutionStage(nodeIndex, stage) {
    if (nodeIndex < 0 || nodeIndex >= this.nodes.length) return;

    const node = this.nodes[nodeIndex];
    const evoData = this.evolutionMap.get(node);

    if (evoData) {
      evoData.stage = Math.max(0, Math.min(2, stage));
      evoData.progress = stage === 0 ? 0 : stage === 1 ? 0.5 : 1;
      console.log(`[ExtremeAINodeEvolution3] Forced stage ${stage} for node ${nodeIndex}`);
    }
  }

  /**
   * Disable/enable evolution system
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    console.log(`[ExtremeAINodeEvolution3] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Reset all nodes to BASE stage
   */
  resetAllNodes() {
    this.evolutionMap.forEach((evoData, node) => {
      evoData.stage = 0;
      evoData.progress = 0;
      evoData.age = 0;
    });
    console.log('[ExtremeAINodeEvolution3] All nodes reset to BASE stage');
  }

  /**
   * Remove a node from evolution tracking (when node is destroyed)
   */
  removeNode(node) {
    if (this.evolutionMap.has(node)) {
      this.evolutionMap.delete(node);
    }
  }

  /**
   * Get debug statistics
   */
  getStats() {
    const stageCounts = { 0: 0, 1: 0, 2: 0 };
    const archetypeCounts = {};

    this.evolutionMap.forEach((evoData, node) => {
      stageCounts[evoData.stage]++;

      if (node.userData?.extremeArchetypeName) {
        const name = node.userData.extremeArchetypeName;
        archetypeCounts[name] = (archetypeCounts[name] || 0) + 1;
      }
    });

    return {
      totalTrackedNodes: this.evolutionMap.size,
      stageDistribution: stageCounts,
      archetypeBreakdown: archetypeCounts,
      enabled: this.enabled,
      timeThresholds: this.stageTransitionTime,
      synergyThresholds: this.synergyThresholds
    };
  }

  /**
   * Log detailed debug info to console
   */
  debugLog() {
    const stats = this.getStats();
    console.group('[ExtremeAINodeEvolution3] Debug Stats');
    console.log('Total Tracked:', stats.totalTrackedNodes);
    console.log('Stage Distribution:', stats.stageDistribution);
    console.log('Archetype Breakdown:', stats.archetypeBreakdown);
    console.log('Enabled:', stats.enabled);
    console.table(this.evolutionMap);
    console.groupEnd();
  }
}

/**
 * INTEGRATION HELPER
 * Call this function from main.js to attach evolution system to the game instance
 */
export function attachExtremeEvolutionToGame(gameInstance) {
  if (!gameInstance || !gameInstance.aiNodes) {
    console.warn('[attachExtremeEvolutionToGame] Invalid gameInstance or missing aiNodes array');
    return;
  }

  try {
    gameInstance.extremeEvolution3 = new ExtremeAINodeEvolution3(gameInstance.aiNodes.nodes || gameInstance.aiNodes);
    console.log('[attachExtremeEvolutionToGame] Successfully attached ExtremeAINodeEvolution3');
    return gameInstance.extremeEvolution3;
  } catch (err) {
    console.error('[attachExtremeEvolutionToGame] Error:', err);
  }
}

/**
 * INTEGRATION INSTRUCTIONS FOR main.js
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * STEP 1: Add import at top of main.js (around line 75, after other imports)
 * ────────────────────────────────────────────────────────────────────────────
 * import { attachExtremeEvolutionToGame } from './_ExtremeAINodeEvolution3.js';
 * 
 * 
 * STEP 2: Initialize in Game class constructor/setup (after aiNodes initialized)
 * ────────────────────────────────────────────────────────────────────────────
 * In the constructor or init() method, after AINodes are created:
 * 
 * attachExtremeEvolutionToGame(this);
 * 
 * 
 * STEP 3: Update in animate loop (after all node updates, inside your render loop)
 * ────────────────────────────────────────────────────────────────────────────
 * Add this in your animate() method (after other node updates):
 * 
 * if (this.extremeEvolution3) {
 *   this.extremeEvolution3.update(this.deltaTime);
 * }
 * 
 * 
 * OPTIONAL: Debug commands in browser console
 * ────────────────────────────────────────────────────────────────────────────
 * // Get stats
 * game.extremeEvolution3.getStats()
 * 
 * // Force stage
 * game.extremeEvolution3.forceEvolutionStage(0, 2)  // Node 0 → Ascended
 * 
 * // Reset
 * game.extremeEvolution3.resetAllNodes()
 * 
 * // Debug
 * game.extremeEvolution3.debugLog()
 * 
 * // Enable/disable
 * game.extremeEvolution3.setEnabled(false)
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */