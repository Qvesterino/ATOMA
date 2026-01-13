/**
 * NODE STATE MACHINE v1.0 - INTEGRATION EXAMPLES
 * 
 * Complete working examples demonstrating state machine setup,
 * custom states, transitions, and advanced patterns.
 */

import NodeStateMachine, { StateDefinition, PresetStates } from './NodeStateMachine_v1.js';
import * as THREE from 'three';

// ============================================================================
// EXAMPLE 1: BASIC SETUP - Idle/Active Toggle
// ============================================================================

export function exampleBasicSetup() {
  console.log('=== Example 1: Basic Setup ===');

  // Create state machine
  const stateMachine = new NodeStateMachine(true); // debug mode

  // Define states
  const idleState = PresetStates.idle();
  const activeState = PresetStates.active();

  stateMachine.defineStates([idleState, activeState]);

  // Usage
  const node = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhongMaterial({ color: 0x0088ff })
  );

  // Register with initial state
  stateMachine.registerNode(node, 'idle');

  // Toggle between states
  function updateExample() {
    stateMachine.update(0.016); // 60fps

    // Transition on user input (simulated)
    if (Math.random() > 0.995) {
      const current = stateMachine.getNodeController(node).currentStateName;
      const target = current === 'idle' ? 'active' : 'idle';
      stateMachine.transitionToState(node, target, 0.5);
    }
  }

  return { stateMachine, node, updateExample };
}

// ============================================================================
// EXAMPLE 2: MULTI-STATE SEQUENCE - Animation Chain
// ============================================================================

export function exampleAnimationSequence() {
  console.log('=== Example 2: Animation Sequence ===');

  const stateMachine = new NodeStateMachine(true);

  // Define a sequence: spawn → materialize → idle
  const states = [
    new StateDefinition('spawn', {
      onEnter: (node) => {
        node.scale.set(0.1, 0.1, 0.1);
        console.log('[spawn] Node appearing');
      },
      onUpdate: (node, elapsed) => {
        const t = elapsed / 2.0; // normalize to 2 seconds
        const scale = 0.1 + t * 0.9;
        node.scale.set(scale, scale, scale);
      },
      onExit: (node) => {
        node.scale.set(1, 1, 1);
      },
      autoProgress: true,
      duration: 2.0,
      nextState: 'materializing'
    }),

    new StateDefinition('materializing', {
      onEnter: (node) => {
        node.material.opacity = 0;
        console.log('[materializing] Fading in');
      },
      onUpdate: (node, elapsed) => {
        const t = elapsed / 1.5;
        node.material.opacity = Math.min(1, t);
      },
      autoProgress: true,
      duration: 1.5,
      nextState: 'idle'
    }),

    PresetStates.idle()
  ];

  stateMachine.defineStates(states);

  const node = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ 
      color: 0x00ff88,
      transparent: true
    })
  );

  // Register with initial state
  stateMachine.registerNode(node, 'spawn');

  // Auto-progression: spawn → materializing → idle
  function updateExample() {
    stateMachine.update(0.016);
    
    const controller = stateMachine.getNodeController(node);
    console.log(`Current state: ${controller.currentStateName}`);
  }

  return { stateMachine, node, updateExample };
}

// ============================================================================
// EXAMPLE 3: CONDITIONAL GUARDS - Health-Based Transitions
// ============================================================================

export function exampleConditionalTransitions() {
  console.log('=== Example 3: Conditional Transitions ===');

  const stateMachine = new NodeStateMachine(true);

  const states = [
    new StateDefinition('healthy', {
      onEnter: (node) => {
        node.userData.currentState = 'healthy';
        if (node.material) {
          node.material.color.setHex(0x00ff00);
        }
      },
      guards: [
        {
          condition: (node) => node.userData.health <= 50,
          targetState: 'wounded'
        }
      ],
      tags: ['normal']
    }),

    new StateDefinition('wounded', {
      onEnter: (node) => {
        node.userData.currentState = 'wounded';
        if (node.material) {
          node.material.color.setHex(0xffaa00);
        }
      },
      onUpdate: (node, elapsed) => {
        // Alert blinking
        if (node.material) {
          const blink = Math.sin(elapsed * 8) > 0 ? 1.0 : 0.6;
          node.material.emissiveIntensity = blink;
        }
      },
      guards: [
        {
          condition: (node) => node.userData.health <= 0,
          targetState: 'defeated'
        },
        {
          condition: (node) => node.userData.health > 75,
          targetState: 'healthy'
        }
      ],
      tags: ['damage']
    }),

    new StateDefinition('defeated', {
      onEnter: (node) => {
        node.userData.currentState = 'defeated';
        if (node.material) {
          node.material.color.setHex(0x880000);
          node.material.opacity = 0.5;
        }
      },
      tags: ['death']
    })
  ];

  stateMachine.defineStates(states);

  const node = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      emissive: 0x00aa00
    })
  );

  node.userData.health = 100;

  stateMachine.registerNode(node, 'healthy');

  // Simulate damage
  function updateExample() {
    stateMachine.update(0.016);

    // Random damage
    if (Math.random() > 0.98) {
      node.userData.health -= Math.random() * 20;
      console.log(`Health: ${node.userData.health.toFixed(1)}`);
    }

    // Healing
    if (Math.random() > 0.995) {
      node.userData.health = Math.min(100, node.userData.health + 10);
    }
  }

  return { stateMachine, node, updateExample };
}

// ============================================================================
// EXAMPLE 4: SMOOTH MATERIAL TRANSITIONS - Color/Glow Blending
// ============================================================================

export function exampleMaterialTransitions() {
  console.log('=== Example 4: Material Transitions ===');

  const stateMachine = new NodeStateMachine(true);

  const states = [
    new StateDefinition('coolState', {
      material: {
        color: new THREE.Color(0x0088ff),
        emissive: new THREE.Color(0x004488),
        opacity: 1.0
      },
      onEnter: (node) => {
        if (node.material) {
          node.material.color.copy(new THREE.Color(0x0088ff));
          node.material.emissive.copy(new THREE.Color(0x004488));
        }
      },
      tags: ['visual']
    }),

    new StateDefinition('warmState', {
      material: {
        color: new THREE.Color(0xff8800),
        emissive: new THREE.Color(0x884400),
        opacity: 1.0
      },
      onEnter: (node) => {
        if (node.material) {
          node.material.color.copy(new THREE.Color(0xff8800));
          node.material.emissive.copy(new THREE.Color(0x884400));
        }
      },
      tags: ['visual']
    }),

    new StateDefinition('glowState', {
      material: {
        color: new THREE.Color(0xffffff),
        emissive: new THREE.Color(0xffff00),
        opacity: 0.8
      },
      onEnter: (node) => {
        if (node.material) {
          node.material.transparent = true;
        }
      },
      tags: ['visual']
    })
  ];

  stateMachine.defineStates(states);

  const node = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 4),
    new THREE.MeshPhongMaterial({ 
      color: 0x0088ff,
      emissive: 0x004488,
      transparent: true
    })
  );

  stateMachine.registerNode(node, 'coolState');

  let transitionCounter = 0;
  const stateSequence = ['coolState', 'warmState', 'glowState'];

  function updateExample() {
    stateMachine.update(0.016);

    // Cycle through states with smooth transitions
    transitionCounter += 0.016;
    if (transitionCounter > 3.0) {
      transitionCounter = 0;
      const nextIdx = (stateSequence.indexOf(
        stateMachine.getNodeController(node).currentStateName
      ) + 1) % stateSequence.length;
      
      // 1.5 second smooth transition
      stateMachine.transitionToState(
        node,
        stateSequence[nextIdx],
        1.5,
        'easeInOutCubic'
      );
    }
  }

  return { stateMachine, node, updateExample };
}

// ============================================================================
// EXAMPLE 5: COMPLEX BEHAVIOR - State-Based AI
// ============================================================================

export function exampleComplexBehavior() {
  console.log('=== Example 5: Complex Behavior ===');

  const stateMachine = new NodeStateMachine(true);

  const states = [
    new StateDefinition('patrolling', {
      onEnter: (node) => {
        node.userData.speed = 0.5;
        console.log('[patrol] Began patrolling');
      },
      onUpdate: (node, elapsed) => {
        node.position.x += Math.sin(elapsed) * 0.01;
        
        // Check for threats
        if (node.userData.threatDetected) {
          console.log('[patrol] Threat detected!');
          stateMachine.transitionToState(node, 'investigating', 0.5);
        }
      },
      tags: ['ai', 'movement']
    }),

    new StateDefinition('investigating', {
      onEnter: (node) => {
        node.userData.speed = 1.0;
        if (node.material) {
          node.material.color.setHex(0xffaa00);
        }
      },
      onUpdate: (node, elapsed) => {
        // Move toward threat
        if (node.userData.threatPosition) {
          const direction = node.userData.threatPosition
            .clone()
            .sub(node.position)
            .normalize();
          node.position.add(direction.multiplyScalar(0.02));
        }
      },
      guards: [
        {
          condition: (node) => node.userData.threatDistance < 2,
          targetState: 'attacking'
        },
        {
          condition: (node) => !node.userData.threatDetected,
          targetState: 'patrolling'
        }
      ],
      tags: ['ai', 'investigation']
    }),

    new StateDefinition('attacking', {
      onEnter: (node) => {
        node.userData.speed = 2.0;
        if (node.material) {
          node.material.color.setHex(0xff0000);
          node.material.emissive.setHex(0x880000);
        }
        console.log('[attack] ENGAGED!');
      },
      onUpdate: (node, elapsed) => {
        // Rapid rotation during attack
        node.rotation.z += elapsed * 5;

        // Deal damage
        if (node.userData.target && Math.random() > 0.9) {
          node.userData.target.userData.health -= 10;
        }
      },
      guards: [
        {
          condition: (node) => 
            !node.userData.target || 
            node.userData.target.userData.health <= 0,
          targetState: 'patrolling'
        }
      ],
      tags: ['ai', 'combat']
    })
  ];

  stateMachine.defineStates(states);

  const node = new THREE.Mesh(
    new THREE.OctahedronGeometry(1),
    new THREE.MeshPhongMaterial({ 
      color: 0x0088ff,
      emissive: 0x004488
    })
  );

  node.userData.threatDetected = false;
  node.userData.speed = 0.5;

  stateMachine.registerNode(node, 'patrolling');

  function updateExample() {
    stateMachine.update(0.016);

    // Simulate threat detection
    if (Math.random() > 0.99) {
      node.userData.threatDetected = true;
      node.userData.threatPosition = new THREE.Vector3(
        Math.random() * 10 - 5,
        0,
        Math.random() * 10 - 5
      );
      node.userData.threatDistance = node.position.distanceTo(
        node.userData.threatPosition
      );
    }
  }

  return { stateMachine, node, updateExample };
}

// ============================================================================
// EXAMPLE 6: MULTI-NODE MANAGEMENT - Batch State Updates
// ============================================================================

export function exampleMultiNodeManagement() {
  console.log('=== Example 6: Multi-Node Management ===');

  const stateMachine = new NodeStateMachine(true);

  // Define shared states
  stateMachine.defineStates([
    PresetStates.idle(),
    PresetStates.active(),
    PresetStates.highlight()
  ]);

  // Create multiple nodes
  const nodes = [];
  const nodeCount = 10;

  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(i / nodeCount, 1, 0.5)
      })
    );

    node.position.x = (i - nodeCount / 2) * 2;

    stateMachine.registerNode(node, 'idle');
    nodes.push(node);
  }

  function updateExample() {
    // Batch update all nodes
    stateMachine.update(0.016);

    // Randomly transition some nodes
    nodes.forEach((node, idx) => {
      if (Math.random() > 0.99) {
        const controller = stateMachine.getNodeController(node);
        const current = controller.currentStateName;
        
        const states = ['idle', 'active', 'highlight'];
        const nextIdx = (states.indexOf(current) + 1) % states.length;
        
        stateMachine.transitionToState(node, states[nextIdx], 0.5);
      }
    });

    // Get statistics
    const stats = stateMachine.getStatistics();
    console.log(`Active: ${stats.activeNodes}, Transitioning: ${stats.nodesInTransition}`);
  }

  return { stateMachine, nodes, updateExample };
}

// ============================================================================
// EXAMPLE 7: DEBUGGING & INSPECTION
// ============================================================================

export function exampleDebugging() {
  console.log('=== Example 7: Debugging & Inspection ===');

  const stateMachine = new NodeStateMachine(true); // debug mode

  stateMachine.defineStates([
    PresetStates.idle(),
    PresetStates.active(),
    new StateDefinition('special', {
      onEnter: (node) => console.log('Entered special state'),
      onExit: (node) => console.log('Exited special state'),
      duration: 2.0,
      autoProgress: true,
      nextState: 'idle'
    })
  ]);

  const node = new THREE.Mesh(
    new THREE.TetrahedronGeometry(1),
    new THREE.MeshPhongMaterial({ color: 0x00ff88 })
  );

  stateMachine.registerNode(node, 'idle');

  // List all available states
  console.log('Available states:', stateMachine.listStates());

  // Get statistics
  console.log('Statistics:', stateMachine.getStatistics());

  // Inspect specific node
  function inspectNode() {
    const info = stateMachine.inspectNode(node);
    console.log('Node inspection:', info);
    console.log(
      `State: ${info.currentState}, ` +
      `Elapsed: ${info.elapsed.toFixed(2)}s, ` +
      `Transitioning: ${info.hasActiveTransition}`
    );
  }

  function updateExample() {
    stateMachine.update(0.016);

    // Transition after 2 seconds
    const controller = stateMachine.getNodeController(node);
    if (controller.stateElapsed > 2 && controller.currentStateName === 'idle') {
      stateMachine.transitionToState(node, 'special');
    }

    // Inspect every half second
    if (Math.random() > 0.97) {
      inspectNode();
    }
  }

  // Console API access (when debug mode on)
  console.log('Access debug API: window.nodeStateMachine');

  return { stateMachine, node, updateExample, inspectNode };
}

// ============================================================================
// EXAMPLE 8: EVENT SYSTEM - State Change Reactions
// ============================================================================

export function exampleEventSystem() {
  console.log('=== Example 8: Event System ===');

  const stateMachine = new NodeStateMachine(true);

  // Register event listeners
  stateMachine.on('stateChanged', (data) => {
    console.log(`Event: State changed to ${data.newState}`);
  });

  stateMachine.on('transitionStarted', (data) => {
    console.log(`Event: Transition started (${data.duration}s)`);
  });

  stateMachine.on('customTrigger', (data) => {
    console.log('Custom event received:', data);
  });

  stateMachine.defineStates([
    new StateDefinition('stateA', {
      onEnter: (node) => {
        stateMachine.emit('stateChanged', { newState: 'stateA' });
      }
    }),

    new StateDefinition('stateB', {
      onEnter: (node) => {
        stateMachine.emit('stateChanged', { newState: 'stateB' });
      }
    })
  ]);

  const node = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x0088ff })
  );

  stateMachine.registerNode(node, 'stateA');

  function updateExample() {
    stateMachine.update(0.016);

    if (Math.random() > 0.98) {
      const current = stateMachine.getNodeController(node).currentStateName;
      const next = current === 'stateA' ? 'stateB' : 'stateA';
      
      stateMachine.emit('transitionStarted', { duration: 0.5 });
      stateMachine.transitionToState(node, next, 0.5);
    }

    // Emit custom event
    if (Math.random() > 0.995) {
      stateMachine.emit('customTrigger', { 
        milestone: 'achievement_unlocked',
        value: Math.random() * 100
      });
    }
  }

  return { stateMachine, node, updateExample };
}

export default {
  exampleBasicSetup,
  exampleAnimationSequence,
  exampleConditionalTransitions,
  exampleMaterialTransitions,
  exampleComplexBehavior,
  exampleMultiNodeManagement,
  exampleDebugging,
  exampleEventSystem
};
