/**
 * NODE STATE MACHINE v1.0
 * 
 * Advanced state machine system for complex multi-phase node animations.
 * Enables nodes to transition through multiple named states with:
 * - Custom entry/exit/update callbacks
 * - State-specific visual effects and material modifications
 * - Automatic state progression based on time, events, or conditions
 * - Smooth transitions between states with easing
 * - State history tracking and debugging
 * - Performance optimization with batched updates
 * 
 * ARCHITECTURE:
 * 1. StateMachine: Core engine managing all node states
 * 2. StateDefinition: Blueprint for individual states (visuals, duration, callbacks)
 * 3. StateController: Per-node state management and animation blending
 * 4. StateTransition: Handles smooth interpolation between states
 * 5. EventSystem: Triggers state changes based on internal/external events
 * 
 * FEATURES:
 * - Hierarchical states (parent/child relationships)
 * - Parallel animations (multiple simultaneous effects)
 * - Conditional state transitions (guards)
 * - Auto-progression timers
 * - Visual FX synchronization
 * - THREE.js safe mode compatible
 * - Full debugging via console API
 */

// === THREE SAFE LOADER (v1.1) ===
let THREE_SAFE = null;
THREE_SAFE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  null;

if (!THREE_SAFE) {
  console.warn('[NodeStateMachine_v1] THREE not detected – enabling SAFE MODE.');
}

const THREE = THREE_SAFE;

/**
 * STATE DEFINITION
 * Blueprint for a single state
 */
export class StateDefinition {
  constructor(name, config = {}) {
    this.name = name;
    
    // Lifecycle callbacks
    this.onEnter = config.onEnter || null;
    this.onUpdate = config.onUpdate || null;
    this.onExit = config.onExit || null;
    
    // Visual properties
    this.visual = config.visual || {};
    this.material = config.material || {};
    this.animation = config.animation || {};
    
    // State duration & progression
    this.duration = config.duration || null; // null = manual progression
    this.autoProgress = config.autoProgress || false; // auto-transition after duration
    this.nextState = config.nextState || null; // if autoProgress = true
    
    // Conditions for state transitions
    this.guards = config.guards || []; // Array of { condition: fn, targetState: name }
    
    // Visual effects
    this.vfx = config.vfx || null; // FX to spawn on entry
    this.soundEffect = config.soundEffect || null; // Audio cue
    
    // Metadata
    this.tags = config.tags || []; // e.g., ['combat', 'movement', 'idle']
    this.priority = config.priority || 0; // Higher = more important
  }
}

/**
 * STATE TRANSITION
 * Handles smooth interpolation between visual states
 */
class StateTransition {
  constructor(fromState, toState, duration = 0.5, easingCurve = 'easeInOutQuad') {
    this.fromState = fromState;
    this.toState = toState;
    this.duration = duration;
    this.elapsed = 0;
    this.easingCurve = this.getEasingFunction(easingCurve);
    this.isActive = true;
  }

  getEasingFunction(curveName) {
    const curves = {
      'linear': (t) => t,
      'easeInOutQuad': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      'easeOutCubic': (t) => 1 + (--t) * t * t,
      'easeInCubic': (t) => t * t * t,
      'easeInOutCubic': (t) => t < 0.5 ? 4 * t * t * t : 1 + (--t) * (2 * (--t)) * (2 * t),
      'easeOutQuint': (t) => 1 + (--t) * t * t * t * t,
    };
    return curves[curveName] || curves['easeInOutQuad'];
  }

  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    this.elapsed += deltaTime;
    const t = Math.min(this.elapsed / this.duration, 1);
    const progress = this.easingCurve(t);
    
    if (t >= 1) {
      this.isActive = false;
    }
    
    return progress;
  }

  interpolate(fromValue, toValue, progress) {
    if (typeof fromValue === 'number') {
      return fromValue + (toValue - fromValue) * progress;
    }
    if (fromValue && typeof fromValue === 'object' && fromValue.clone) {
      // THREE.js Vector/Color
      const result = fromValue.clone();
      result.lerp(toValue, progress);
      return result;
    }
    return toValue;
  }
}

/**
 * STATE CONTROLLER
 * Per-node state management
 */
class StateController {
  constructor(node, debugMode = false) {
    this.node = node;
    this.debugMode = debugMode;
    
    // Current state
    this.currentStateName = null;
    this.currentState = null;
    
    // State history
    this.stateHistory = [];
    this.maxHistorySize = 20;
    
    // Transitions
    this.activeTransition = null;
    this.transitionDuration = 0.5;
    
    // Timers
    this.stateElapsed = 0;
    this.stateTimer = null;
    
    // Event queue
    this.eventQueue = [];
    
    // Blending state (for multi-state effects)
    this.blendingStates = new Map(); // state -> weight
  }

  enterState(stateDef) {
    if (this.currentState) {
      this.logStateChange('exit', this.currentState.name);
      if (this.currentState.onExit) {
        this.currentState.onExit(this.node);
      }
    }

    this.currentState = stateDef;
    this.currentStateName = stateDef.name;
    this.stateElapsed = 0;
    
    // Add to history
    this.stateHistory.push({
      name: stateDef.name,
      timestamp: performance.now(),
      duration: 0
    });
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    this.logStateChange('enter', stateDef.name);
    
    // Invoke onEnter callback
    if (stateDef.onEnter) {
      stateDef.onEnter(this.node);
    }

    // Set auto-progression timer if configured
    if (stateDef.autoProgress && stateDef.duration) {
      this.stateTimer = stateDef.duration;
    }
  }

  logStateChange(type, stateName) {
    if (this.debugMode) {
      console.log(`%c[StateController] ${type.toUpperCase()}: ${stateName}`, 
        type === 'enter' ? 'color: #00ff88;' : 'color: #ff8800;');
    }
  }

  update(deltaTime) {
    if (!this.currentState) return;
if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Update elapsed time
    this.stateElapsed += deltaTime;
    
    // Update auto-progression timer
    if (this.stateTimer !== null) {
      this.stateTimer -= deltaTime;
      if (this.stateTimer <= 0) {
        this.stateTimer = null;
        // Auto-progression triggered
        return { autoProgress: true, nextState: this.currentState.nextState };
      }
    }

    // Invoke onUpdate callback
    if (this.currentState.onUpdate) {
      this.currentState.onUpdate(this.node, this.stateElapsed, deltaTime);
    }

    // Check guards for conditional transitions
    const guardedState = this.checkGuards();
    if (guardedState) {
      return { transition: true, targetState: guardedState };
    }

    return null;
  }

  checkGuards() {
    if (!this.currentState || !this.currentState.guards) return null;

    for (const guard of this.currentState.guards) {
      if (guard.condition && guard.condition(this.node)) {
        return guard.targetState;
      }
    }
    return null;
  }

  getHistory() {
    return [...this.stateHistory];
  }

  blendState(stateDef, weight) {
    this.blendingStates.set(stateDef.name, Math.max(0, Math.min(1, weight)));
  }

  clearBlending() {
    this.blendingStates.clear();
  }
}

/**
 * NODE STATE MACHINE
 * Core engine for managing all node states
 */
export class NodeStateMachine {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    
    // State registry
    this.stateDefinitions = new Map(); // name -> StateDefinition
    
    // Active controllers
    this.nodeControllers = new Map(); // node -> StateController
    
    // Event system
    this.globalEvents = new Map(); // eventName -> listeners[]
    this.nodeEvents = new Map(); // node -> events[]
    
    // Performance
    this.updateBatch = [];
    this.updateInterval = 1 / 60; // 60Hz
    this.lastUpdateTime = 0;
    
    if (this.debugMode) {
      console.log('%c[NodeStateMachine_v1] Initialized', 'color: #ff9900; font-weight: bold;');
      this.setupConsoleAPI();
    }
  }

  /**
   * REGISTRY MANAGEMENT
   */
  defineState(stateDef) {
    if (!stateDef || !stateDef.name) {
      console.error('[NodeStateMachine] Invalid state definition');
      return;
    }
    
    this.stateDefinitions.set(stateDef.name, stateDef);
    
    if (this.debugMode) {
      console.log(`%c[StateRegistry] Registered: ${stateDef.name}`, 'color: #00ff88;');
    }
  }

  defineStates(stateArray) {
    stateArray.forEach(stateDef => this.defineState(stateDef));
  }

  getState(name) {
    return this.stateDefinitions.get(name);
  }

  /**
   * NODE CONTROLLER MANAGEMENT
   */
  registerNode(node, initialStateName = null) {
    if (!node || !node.userData) {
      console.error('[NodeStateMachine] Invalid node for registration');
      return null;
    }

    const controller = new StateController(node, this.debugMode);
    this.nodeControllers.set(node, controller);
    
    if (initialStateName) {
      const initialState = this.getState(initialStateName);
      if (initialState) {
        controller.enterState(initialState);
      }
    }

    node.userData.stateController = controller;
    return controller;
  }

  unregisterNode(node) {
    const controller = this.nodeControllers.get(node);
    if (controller && controller.currentState && controller.currentState.onExit) {
      controller.currentState.onExit(node);
    }
    this.nodeControllers.delete(node);
    if (node.userData) {
      delete node.userData.stateController;
    }
  }

  getNodeController(node) {
    return this.nodeControllers.get(node);
  }

  /**
   * STATE TRANSITION API
   */
  transitionToState(node, targetStateName, duration = 0.5, easingCurve = 'easeInOutQuad') {
    const controller = this.nodeControllers.get(node);
    if (!controller) {
      console.warn('[NodeStateMachine] Node not registered');
      return;
    }

    const targetState = this.getState(targetStateName);
    if (!targetState) {
      console.error(`[NodeStateMachine] Unknown target state: ${targetStateName}`);
      return;
    }

    // Create transition
    if (controller.currentState) {
      controller.activeTransition = new StateTransition(
        controller.currentState,
        targetState,
        duration,
        easingCurve
      );
    }

    // Enter new state
    controller.enterState(targetState);

    if (this.debugMode) {
      console.log(`%c[Transition] ${controller.currentState?.name || 'START'} → ${targetStateName}`,
        'color: #0088ff; font-weight: bold;');
    }
  }

  /**
   * UPDATE LOOP
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    // Batch update all active controllers
    for (const [node, controller] of this.nodeControllers.entries()) {
      const result = controller.update(deltaTime);
      
      if (result && result.autoProgress) {
        this.transitionToState(node, result.nextState);
      } else if (result && result.transition) {
        this.transitionToState(node, result.targetState);
      }

      // Update transition if active
      if (controller.activeTransition && controller.activeTransition.isActive) {
        const progress = controller.activeTransition.update(deltaTime);
        this.applyTransitionBlend(node, controller, progress);
      }
    }
  }

  applyTransitionBlend(node, controller, progress) {
    if (!THREE) return; // SAFE MODE

    // Interpolate material properties
    if (controller.currentState?.material) {
      const material = node.material;
      if (material) {
        const fromMat = controller.activeTransition.fromState.material;
        const toMat = controller.activeTransition.toState.material;

        // Color blending
        if (fromMat.color && toMat.color) {
          if (material.color) {
            material.color.lerpHSL(fromMat.color, toMat.color, progress);
          }
        }

        // Emissive blending
        if (fromMat.emissive && toMat.emissive) {
          if (material.emissive) {
            material.emissive.lerpHSL(fromMat.emissive, toMat.emissive, progress);
          }
        }

        // Opacity blending
        if (typeof fromMat.opacity !== 'undefined' && typeof toMat.opacity !== 'undefined') {
          material.opacity = fromMat.opacity + (toMat.opacity - fromMat.opacity) * progress;
        }
      }
    }
  }

  /**
   * EVENT SYSTEM
   */
  on(eventName, callback) {
    if (!this.globalEvents.has(eventName)) {
      this.globalEvents.set(eventName, []);
    }
    this.globalEvents.get(eventName).push(callback);
  }

  off(eventName, callback) {
    const listeners = this.globalEvents.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(eventName, eventData = {}) {
    const listeners = this.globalEvents.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(eventData));
    }
  }

  /**
   * VISUAL EFFECTS INTEGRATION
   */
  applyStateVisuals(node, stateDef) {
    if (!THREE || !node.material) return;

    const { visual } = stateDef;
    if (!visual) return;

    // Apply material modifications
    if (visual.color && node.material.color) {
      node.material.color.copy(visual.color);
    }

    if (visual.emissive && node.material.emissive) {
      node.material.emissive.copy(visual.emissive);
    }

    if (typeof visual.opacity !== 'undefined') {
      node.material.opacity = visual.opacity;
    }

    if (typeof visual.scale !== 'undefined') {
      node.scale.multiplyScalar(visual.scale);
    }

    // Apply rotation
    if (visual.rotation) {
      node.rotation.x += visual.rotation.x || 0;
      node.rotation.y += visual.rotation.y || 0;
      node.rotation.z += visual.rotation.z || 0;
    }
  }

  /**
   * DEBUGGING & INSPECTION
   */
  inspectNode(node) {
    const controller = this.nodeControllers.get(node);
    if (!controller) {
      return { error: 'Node not registered' };
    }

    return {
      currentState: controller.currentStateName,
      elapsed: controller.stateElapsed,
      hasActiveTransition: controller.activeTransition?.isActive,
      history: controller.getHistory(),
      blendingStates: Array.from(controller.blendingStates.entries())
    };
  }

  listStates() {
    return Array.from(this.stateDefinitions.keys());
  }

  getStatistics() {
    return {
      totalStates: this.stateDefinitions.size,
      activeNodes: this.nodeControllers.size,
      nodesInTransition: Array.from(this.nodeControllers.values())
        .filter(c => c.activeTransition?.isActive).length
    };
  }

  setupConsoleAPI() {
    window.nodeStateMachine = {
      inspect: (node) => this.inspectNode(node),
      listStates: () => this.listStates(),
      stats: () => this.getStatistics(),
      transition: (node, targetState, duration = 0.5) => 
        this.transitionToState(node, targetState, duration),
      emit: (eventName, data) => this.emit(eventName, data)
    };
    
    console.log('%c[NodeStateMachine] Console API available: window.nodeStateMachine', 
      'color: #ff9900; font-weight: bold;');
  }
}

/**
 * PRESET STATE LIBRARY
 * Common state definitions for quick setup
 */
export const PresetStates = {
  /**
   * IDLE STATE - Default resting state
   */
  idle: () => new StateDefinition('idle', {
    onEnter: (node) => {
      if (node.material) {
        node.material.emissive.setHex(0x111111);
      }
    },
    onUpdate: (node, elapsed) => {
      // Subtle breathing effect
      if (node.material) {
        const breathe = 0.5 + 0.5 * Math.sin(elapsed * 2);
        node.material.emissive.copy(node.material.color).multiplyScalar(breathe * 0.1);
      }
    },
    duration: null,
    tags: ['idle']
  }),

  /**
   * ACTIVE STATE - High intensity engagement
   */
  active: () => new StateDefinition('active', {
    onEnter: (node) => {
      if (node.scale) {
        node.scale.multiplyScalar(1.1);
      }
    },
    onUpdate: (node, elapsed) => {
      // Pulsing glow
      if (node.material) {
        const pulse = 0.5 + 0.5 * Math.cos(elapsed * 6);
        node.material.emissive.setScalar(pulse);
      }
    },
    onExit: (node) => {
      if (node.scale) {
        node.scale.multiplyScalar(1 / 1.1);
      }
    },
    guards: [
      {
        condition: (node) => {
          // Example: exit if energy drops below threshold
          return node.userData?.energy < 0.3;
        },
        targetState: 'idle'
      }
    ],
    duration: null,
    tags: ['active', 'engagement']
  }),

  /**
   * HIGHLIGHT STATE - Selected/focused
   */
  highlight: () => new StateDefinition('highlight', {
    visual: {
      color: new (THREE || {}).Color(0x00ff88)
    },
    onEnter: (node) => {
      if (node.material) {
        node.material.emissive.setHex(0x00ff88);
      }
    },
    onUpdate: (node, elapsed) => {
      if (node.material) {
        const intensity = 0.7 + 0.3 * Math.sin(elapsed * 4);
        node.material.emissiveIntensity = intensity;
      }
    },
    duration: null,
    tags: ['highlight', 'selection']
  }),

  /**
   * TRANSITIONING STATE - In-progress transition
   */
  transitioning: () => new StateDefinition('transitioning', {
    onUpdate: (node, elapsed) => {
      if (node.material) {
        const shimmer = Math.sin(elapsed * 8) * 0.5 + 0.5;
        node.material.opacity = shimmer;
      }
    },
    autoProgress: true,
    duration: 1.0,
    nextState: 'idle',
    tags: ['transition', 'temporary']
  }),

  /**
   * ERROR STATE - Problem/warning state
   */
  error: () => new StateDefinition('error', {
    onEnter: (node) => {
      if (node.material) {
        node.material.color.setHex(0xff0000);
        node.material.emissive.setHex(0x880000);
      }
    },
    onUpdate: (node, elapsed) => {
      if (node.material) {
        const alert = Math.sin(elapsed * 10) > 0 ? 1 : 0.5;
        node.material.emissiveIntensity = alert;
      }
    },
    duration: null,
    tags: ['error', 'warning']
  })
};

export default NodeStateMachine;
