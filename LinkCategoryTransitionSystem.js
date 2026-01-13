import * as THREE from 'three';

/**
 * Link Category Visual Transition System
 * 
 * Manages category-aware visual transitions and animations when nodes link together.
 * Creates beautiful, physically-informed animations that reflect the semantic meaning
 * of connecting different node categories.
 * 
 * Features:
 * - Category-pair specific transition effects
 * - Semantic color blending and morphing
 * - Particle flows that respect source→target categories
 * - Connection glow that adapts to category harmony
 * - Custom easing curves for each transition type
 * - State tracking for smooth animation choreography
 * 
 * Categories: INPUT, PROCESS, INTEGRATION, ANALYTICS, STORAGE, CONTROL
 * Special: QUANTUM, MYTHIC, PRIME, ERROR, EMOTIONAL
 */
export class LinkCategoryTransitionSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeTransitions = new Map(); // linkId → TransitionController
    this.categoryPalettes = this._buildCategoryPalettes();
    this.transitionPool = [];
    this.maxPoolSize = 32;
    
    // Configuration for different transition patterns
    this.transitionConfig = {
      // Duration in milliseconds
      duration: 600,
      // Ease functions
      eases: {
        smooth: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        elastic: (t) => {
          const c5 = (2 * Math.PI) / 4.5;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
        },
        bounce: (t) => {
          const n1 = 7.5625, d1 = 2.75;
          if (t < 1 / d1) return n1 * t * t;
          else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
          else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
          else return n1 * (t -= 2.625 / d1) * t + 0.984375;
        },
        power: (t) => t * t * t,
        momentum: (t) => t * (2 - t) // accelerate then decelerate
      },
      // Category pair harmony scores (0–1, higher = more harmonious)
      harmony: {
        'input-process': 0.95,    // Data flows naturally
        'process-integration': 0.90,
        'integration-analytics': 0.85,
        'analytics-storage': 0.80,
        'storage-control': 0.75,
        'control-input': 0.70,    // Feedback loop
        'process-process': 0.60,  // Self-loop
        'input-input': 0.50,      // Competing inputs
        'control-control': 0.55,  // Dueling authorities
      }
    };
  }

  /**
   * Build category color palettes for smooth blending
   * @private
   */
  _buildCategoryPalettes() {
    return {
      input: {
        primary: new THREE.Color(0x00ffff),    // Cyan
        secondary: new THREE.Color(0x00ccff),  // Light cyan
        accent: new THREE.Color(0x0099ff),     // Blue
        glow: 0x00ffff
      },
      process: {
        primary: new THREE.Color(0xffaa00),    // Amber
        secondary: new THREE.Color(0xffdd00),  // Gold
        accent: new THREE.Color(0xff8800),     // Orange
        glow: 0xffaa00
      },
      integration: {
        primary: new THREE.Color(0x00ff88),    // Green
        secondary: new THREE.Color(0x00dd88),  // Bright green
        accent: new THREE.Color(0x00cc99),     // Teal-green
        glow: 0x00ff88
      },
      analytics: {
        primary: new THREE.Color(0xaa00ff),    // Violet
        secondary: new THREE.Color(0xdd00ff),  // Magenta
        accent: new THREE.Color(0x9900ff),     // Purple
        glow: 0xaa00ff
      },
      storage: {
        primary: new THREE.Color(0xccccff),    // Silver
        secondary: new THREE.Color(0xddddff),  // Pale blue
        accent: new THREE.Color(0xaaaaff),     // Periwinkle
        glow: 0xccccff
      },
      control: {
        primary: new THREE.Color(0xff0055),    // Red
        secondary: new THREE.Color(0xff3366),  // Bright red
        accent: new THREE.Color(0xff0088),     // Magenta
        glow: 0xff0055
      },
      quantum: {
        primary: new THREE.Color(0x00ff00),    // Bright green
        secondary: new THREE.Color(0x00ffaa),  // Cyan-green
        accent: new THREE.Color(0x00dd00),     // Forest green
        glow: 0x00ff00
      },
      mythic: {
        primary: new THREE.Color(0xff00ff),    // Magenta
        secondary: new THREE.Color(0xff00aa),  // Purple-magenta
        accent: new THREE.Color(0xdd00ff),     // Violet
        glow: 0xff00ff
      },
      prime: {
        primary: new THREE.Color(0xffff00),    // Yellow
        secondary: new THREE.Color(0xffee00),  // Bright yellow
        accent: new THREE.Color(0xffdd00),     // Gold
        glow: 0xffff00
      },
      error: {
        primary: new THREE.Color(0xff3333),    // Bright red
        secondary: new THREE.Color(0xff6666),  // Light red
        accent: new THREE.Color(0xff0000),     // Pure red
        glow: 0xff3333
      },
      emotional: {
        primary: new THREE.Color(0xff69b4),    // Hot pink
        secondary: new THREE.Color(0xff1493),  // Deep pink
        accent: new THREE.Color(0xff00ff),     // Magenta
        glow: 0xff69b4
      }
    };
  }

  /**
   * Start a transition for a newly created link
   * @param {string} linkId - Unique link identifier
   * @param {THREE.Vector3} fromPos - Source node position
   * @param {THREE.Vector3} toPos - Target node position
   * @param {string} fromCategory - Source node category
   * @param {string} toCategory - Target node category
   * @param {Object} options - Additional configuration
   */
  startTransition(linkId, fromPos, toPos, fromCategory, toCategory, options = {}) {
    // Stop existing transition for this link
    if (this.activeTransitions.has(linkId)) {
      this.stopTransition(linkId);
    }

    // Create transition controller
    const controller = new TransitionController(
      linkId,
      fromPos,
      toPos,
      fromCategory,
      toCategory,
      this.categoryPalettes,
      this.transitionConfig,
      options
    );

    this.activeTransitions.set(linkId, controller);
    return controller;
  }

  /**
   * Update all active transitions (call once per frame)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    const completedTransitions = [];

    for (const [linkId, controller] of this.activeTransitions) {
      controller.update(deltaTime);

      if (controller.isComplete()) {
        completedTransitions.push(linkId);
      }
    }

    // Clean up completed transitions
    for (const linkId of completedTransitions) {
      this.stopTransition(linkId);
    }
  }

  /**
   * Stop and clean up a transition
   * @param {string} linkId - Link identifier
   */
  stopTransition(linkId) {
    const controller = this.activeTransitions.get(linkId);
    if (controller) {
      controller.dispose();
      this.activeTransitions.delete(linkId);
    }
  }

  /**
   * Stop all transitions (for cleanup)
   */
  dispose() {
    for (const [linkId, controller] of this.activeTransitions) {
      controller.dispose();
    }
    this.activeTransitions.clear();
  }

  /**
   * Get visual state at current transition progress
   * @param {string} linkId - Link identifier
   * @returns {Object} { color, opacity, glowIntensity, particleFlow }
   */
  getVisualState(linkId) {
    const controller = this.activeTransitions.get(linkId);
    if (!controller) return null;
    return controller.getVisualState();
  }

  /**
   * Get harmony score between two categories
   */
  getHarmonyScore(fromCategory, toCategory) {
    const key = `${fromCategory}-${toCategory}`;
    const reverse = `${toCategory}-${fromCategory}`;
    
    let score = this.transitionConfig.harmony[key] ||
                this.transitionConfig.harmony[reverse];
    
    // If not defined, compute based on category similarity
    if (score === undefined) {
      score = this._computeDefaultHarmony(fromCategory, toCategory);
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Compute default harmony based on category rules
   * @private
   */
  _computeDefaultHarmony(cat1, cat2) {
    if (cat1 === cat2) return 0.5; // Self-loops have moderate harmony
    
    // All categories have baseline compatibility
    const isSpecial = (cat) => ['quantum', 'mythic', 'prime', 'error', 'emotional'].includes(cat);
    
    // Special categories with each other: high harmony
    if (isSpecial(cat1) && isSpecial(cat2)) return 0.85;
    
    // Standard categories naturally flow in sequence
    const order = ['input', 'process', 'integration', 'analytics', 'storage', 'control'];
    const idx1 = order.indexOf(cat1);
    const idx2 = order.indexOf(cat2);
    
    if (idx1 !== -1 && idx2 !== -1) {
      const distance = Math.abs(idx2 - idx1);
      return 0.95 - (distance * 0.1); // Adjacent: 0.85, distant: lower
    }
    
    return 0.65; // Default baseline
  }
}

/**
 * Internal: Manages a single link transition animation
 * @private
 */
class TransitionController {
  constructor(linkId, fromPos, toPos, fromCategory, toCategory, palettes, config, options) {
    this.linkId = linkId;
    this.fromPos = fromPos.clone();
    this.toPos = toPos.clone();
    this.fromCategory = fromCategory.toLowerCase();
    this.toCategory = toCategory.toLowerCase();
    this.palettes = palettes;
    this.config = config;
    this.options = options;

    // Animation state
    this.startTime = Date.now();
    this.duration = options.duration || config.duration;
    this.progress = 0;
    this.isCompleted = false;

    // Get category palettes
    this.fromPalette = palettes[this.fromCategory] || palettes.input;
    this.toPalette = palettes[this.toCategory] || palettes.input;

    // Compute harmony for this pair
    this.harmonyScore = this._computeHarmony();

    // Select easing function based on harmony
    this.easeFunc = this._selectEaseFunction();

    // Initialize particle system
    this.particles = this._createParticles();

    // Visual state
    this.currentColor = this.fromPalette.primary.clone();
    this.opacity = 0.3;
    this.glowIntensity = 0.5;
    this.particleFlow = 0;
  }

  /**
   * Compute harmony between source and target categories
   * @private
   */
  _computeHarmony() {
    // Define natural flow relationships
    const flows = {
      'input-process': 0.95,
      'process-integration': 0.90,
      'integration-analytics': 0.85,
      'analytics-storage': 0.80,
      'storage-control': 0.75,
      'control-input': 0.70,
      'quantum-mythic': 0.88,
      'mythic-prime': 0.85,
      'prime-error': 0.50, // Disharmonious
      'error-emotional': 0.60, // Difficult
    };

    const key = `${this.fromCategory}-${this.toCategory}`;
    const reverse = `${this.toCategory}-${this.fromCategory}`;
    let score = flows[key] || flows[reverse];

    if (score === undefined) {
      // Default rules
      if (this.fromCategory === this.toCategory) {
        score = 0.5;
      } else {
        score = 0.65;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Select easing function based on harmony
   * @private
   */
  _selectEaseFunction() {
    if (this.harmonyScore >= 0.85) {
      return this.config.eases.smooth;
    } else if (this.harmonyScore >= 0.70) {
      return this.config.eases.momentum;
    } else if (this.harmonyScore >= 0.50) {
      return this.config.eases.bounce;
    } else {
      return this.config.eases.elastic;
    }
  }

  /**
   * Create transition particle system
   * @private
   */
  _createParticles() {
    const count = Math.round(10 + this.harmonyScore * 20); // 10-30 particles
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        position: this.fromPos.clone(),
        velocity: new THREE.Vector3(),
        age: 0,
        lifespan: 0.3 + Math.random() * 0.4,
        size: 0.04 + Math.random() * 0.08,
        color: this._getParticleColor(i / count)
      });
    }

    return particles;
  }

  /**
   * Get interpolated color for particle
   * @private
   */
  _getParticleColor(ratio) {
    const t = ratio;
    const startColor = this.fromPalette.primary.clone();
    const endColor = this.toPalette.primary.clone();
    
    const blended = new THREE.Color(
      startColor.r * (1 - t) + endColor.r * t,
      startColor.g * (1 - t) + endColor.g * t,
      startColor.b * (1 - t) + endColor.b * t
    );

    return blended;
  }

  /**
   * Update transition for current frame
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (this.isCompleted) return;

    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(1, elapsed / this.duration);

    if (this.progress >= 1) {
      this.isCompleted = true;
      this.progress = 1;
    }

    // Apply easing
    const easedProgress = this.easeFunc(this.progress);

    // Update color: blend from source to target
    this._updateColor(easedProgress);

    // Update opacity: fade in then out
    this._updateOpacity(easedProgress);

    // Update glow
    this._updateGlow(easedProgress);

    // Update particles
    this._updateParticles(deltaTime);
  }

  /**
   * Update current color based on progress
   * @private
   */
  _updateColor(easedProgress) {
    // Start at source primary, end at target primary
    this.currentColor.copy(this.fromPalette.primary);
    this.currentColor.lerp(this.toPalette.primary, easedProgress);
  }

  /**
   * Update opacity based on progress
   * @private
   */
  _updateOpacity(easedProgress) {
    // Fade in for first 30%, plateau, fade out in last 20%
    if (easedProgress < 0.3) {
      this.opacity = (easedProgress / 0.3) * 0.8;
    } else if (easedProgress < 0.8) {
      this.opacity = 0.8;
    } else {
      this.opacity = 0.8 * (1 - (easedProgress - 0.8) / 0.2);
    }
  }

  /**
   * Update glow intensity
   * @private
   */
  _updateGlow(easedProgress) {
    // Peak at center (0.5), fade out at edges
    this.glowIntensity = Math.sin(easedProgress * Math.PI) * this.harmonyScore;
  }

  /**
   * Update particle animation
   * @private
   */
  _updateParticles(deltaTime) {
    const direction = new THREE.Vector3().subVectors(this.toPos, this.fromPos);
    direction.normalize();

    for (const particle of this.particles) {
      particle.age += deltaTime;

      if (particle.age < particle.lifespan) {
        // Move particle along path
        const pathProgress = particle.age / particle.lifespan;
        particle.position.lerpVectors(
          this.fromPos,
          this.toPos,
          pathProgress
        );

        // Add some oscillation perpendicular to path
        const perpTime = particle.age * 3;
        const perpOffset = Math.sin(perpTime) * 0.1 * (1 - pathProgress);
        
        const perpDir = new THREE.Vector3(-direction.z, direction.y, direction.x);
        perpDir.normalize();
        perpDir.multiplyScalar(perpOffset);
        particle.position.add(perpDir);
      }
    }

    this.particleFlow = Math.sin(this.progress * Math.PI);
  }

  /**
   * Get current visual state for rendering
   */
  getVisualState() {
    return {
      color: this.currentColor,
      opacity: this.opacity,
      glowIntensity: this.glowIntensity,
      particleFlow: this.particleFlow,
      particles: this.particles,
      progress: this.progress,
      harmonyScore: this.harmonyScore
    };
  }

  /**
   * Check if transition is complete
   */
  isComplete() {
    return this.isCompleted;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.particles = [];
  }
}

export { TransitionController };