# NODE STATE MACHINE v1.0 - COMPREHENSIVE GUIDE

## Overview

The Node State Machine provides a sophisticated system for managing complex multi-phase animations on nodes. It enables:

- **Named States**: Define discrete behavioral phases (idle, active, transitioning, etc.)
- **State Lifecycle**: Enter/update/exit callbacks for precise control
- **Visual Effects**: Material morphing, color blending, opacity transitions
- **Auto-Progression**: Automatic state advancement based on timers or conditions
- **Smooth Transitions**: Easing curves and interpolation between states
- **Event Reactivity**: State changes triggered by conditions or external events
- **State History**: Track state changes for debugging and analytics
- **Multi-State Blending**: Parallel effects from multiple states simultaneously

## Quick Start

### 1. Initialize the State Machine

```javascript
import NodeStateMachine, { StateDefinition, PresetStates } from './NodeStateMachine_v1.js';

const stateMachine = new NodeStateMachine(true); // debug mode enabled

// Define your states
stateMachine.defineStates([
  PresetStates.idle(),
  PresetStates.active(),
  PresetStates.highlight()
]);
```

### 2. Register Nodes

```javascript
// Register a node with initial state
const controller = stateMachine.registerNode(nodeModel, 'idle');

// Or start without initial state
stateMachine.registerNode(nodeModel);
```

### 3. Update Every Frame

```javascript
// In your main update loop
function animate(deltaTime) {
  stateMachine.update(deltaTime);
  renderer.render(scene, camera);
}
```

### 4. Trigger Transitions

```javascript
// Simple transition with default easing
stateMachine.transitionToState(node, 'active');

// Custom duration and easing curve
stateMachine.transitionToState(node, 'highlight', 1.0, 'easeOutCubic');
```

## Creating Custom States

### Basic State Definition

```javascript
const myCustomState = new StateDefinition('myState', {
  // Lifecycle callbacks
  onEnter: (node) => {
    console.log('Entering myState');
    // Setup visuals, particles, etc.
  },

  onUpdate: (node, elapsedTime, deltaTime) => {
    // Animate properties over time
    node.rotation.y += deltaTime;
  },

  onExit: (node) => {
    console.log('Exiting myState');
    // Cleanup, reset to defaults
  },

  // Visual properties applied on entry
  visual: {
    color: new THREE.Color(0xff0000),
    scale: 1.2,
    rotation: { x: 0, y: 0, z: 0 }
  },

  // Material properties for smooth transitions
  material: {
    color: new THREE.Color(0xff0000),
    emissive: new THREE.Color(0x880000),
    opacity: 1.0
  },

  // Auto-progression configuration
  autoProgress: true,
  duration: 2.5,
  nextState: 'idle',

  // Conditional transitions (guards)
  guards: [
    {
      condition: (node) => node.userData.health <= 0,
      targetState: 'destroyed'
    },
    {
      condition: (node) => node.userData.isSelected === false,
      targetState: 'idle'
    }
  ],

  // Metadata
  tags: ['combat', 'animation'],
  priority: 10
});

stateMachine.defineState(myCustomState);
```

## Advanced Features

### 1. Guards & Conditional Transitions

Guards automatically transition nodes when conditions are met:

```javascript
const vigilantState = new StateDefinition('vigilant', {
  onEnter: (node) => { /* ... */ },
  
  guards: [
    // Exit if threat nearby
    {
      condition: (node) => {
        const threatNearby = node.userData.threatDistance < 5;
        return threatNearby;
      },
      targetState: 'combatReady'
    },
    
    // Exit if energy depleted
    {
      condition: (node) => node.userData.energy < 0.2,
      targetState: 'resting'
    }
  ]
});
```

### 2. State Events

React to global state machine events:

```javascript
// Listen for state transitions
stateMachine.on('stateEntered', (data) => {
  console.log(`Node entered state: ${data.stateName}`);
});

stateMachine.on('stateExited', (data) => {
  console.log(`Node exited state: ${data.stateName}`);
});

// Emit custom events
stateMachine.emit('nodeMilestone', { node, milestone: 'level_up' });
```

### 3. State Animation Interpolation

Leverage smooth transitions between visual states:

```javascript
const fadeInState = new StateDefinition('fadeIn', {
  material: {
    opacity: 1.0,
    emissive: new THREE.Color(0xffffff)
  }
});

const fadeOutState = new StateDefinition('fadeOut', {
  material: {
    opacity: 0.0,
    emissive: new THREE.Color(0x000000)
  }
});

// 2-second smooth fade transition
stateMachine.transitionToState(node, 'fadeOut', 2.0, 'easeInOutQuad');
```

### 4. Multi-State Blending

Combine effects from multiple states:

```javascript
const controller = stateMachine.getNodeController(node);

// Apply secondary state effects at reduced weight
controller.blendState(stateA, 0.7);
controller.blendState(stateB, 0.3);

// Clear blending when done
controller.clearBlending();
```

### 5. Auto-Progression Sequences

Chain states automatically for animation sequences:

```javascript
// State 1: Spawn effect (2 seconds)
const spawnState = new StateDefinition('spawn', {
  onEnter: (node) => {
    node.scale.set(0, 0, 0);
  },
  onUpdate: (node, elapsed) => {
    const t = elapsed / 2; // normalize to 0-1
    node.scale.multiplyScalar(1 + t);
  },
  autoProgress: true,
  duration: 2.0,
  nextState: 'materializing'
});

// State 2: Materialize effect (1.5 seconds)
const materializeState = new StateDefinition('materializing', {
  onUpdate: (node, elapsed) => {
    if (node.material) {
      node.material.opacity = Math.min(1, elapsed / 1.5);
    }
  },
  autoProgress: true,
  duration: 1.5,
  nextState: 'idle'
});

// Chain automatically: spawn → materializing → idle
stateMachine.defineStates([spawnState, materializeState, PresetStates.idle()]);
stateMachine.registerNode(node, 'spawn');
```

## Easing Curves

Available easing functions for smooth transitions:

| Curve | Behavior | Use Case |
|-------|----------|----------|
| `linear` | Constant speed | Mechanical, steady effects |
| `easeInOutQuad` | Smooth acceleration/deceleration | Default, general purpose |
| `easeOutCubic` | Fast exit, slow end | Bouncy, responsive |
| `easeInCubic` | Slow start, fast exit | Delayed, building effects |
| `easeInOutCubic` | Smooth in and out | Polish, professional feel |
| `easeOutQuint` | Snappy conclusion | Sharp, impactful |

```javascript
// Example: Use snappy easing for emphasis
stateMachine.transitionToState(node, 'highlight', 0.3, 'easeOutQuint');

// Slow, deliberate fade
stateMachine.transitionToState(node, 'fadeOut', 3.0, 'easeInCubic');
```

## Preset States

The library includes ready-to-use states:

### `PresetStates.idle()`
Default resting state with subtle breathing effect.

```javascript
const idleState = PresetStates.idle();
// Features: Minimal emissive glow, breathing animation
```

### `PresetStates.active()`
High-intensity engagement state with scale and pulsing glow.

```javascript
const activeState = PresetStates.active();
// Features: 1.1x scale, pulsing emissive, auto-exits if energy < 0.3
```

### `PresetStates.highlight()`
Selection/focus state with bright glow.

```javascript
const highlightState = PresetStates.highlight();
// Features: Green glow (0x00ff88), sinusoidal intensity variation
```

### `PresetStates.transitioning()`
Temporary state for in-progress transitions.

```javascript
const transitioningState = PresetStates.transitioning();
// Features: Shimmer opacity, auto-progresses to idle after 1 second
```

### `PresetStates.error()`
Problem/warning indicator state.

```javascript
const errorState = PresetStates.error();
// Features: Red color, alert blinking at 10Hz
```

## State History & Debugging

### Inspect Node State

```javascript
const inspection = stateMachine.inspectNode(node);
console.log(inspection);
// Output:
// {
//   currentState: 'active',
//   elapsed: 1.234,
//   hasActiveTransition: true,
//   history: [
//     { name: 'idle', timestamp: 1000, duration: 5.2 },
//     { name: 'active', timestamp: 6200, duration: 1.234 }
//   ],
//   blendingStates: [['stateA', 0.7], ['stateB', 0.3]]
// }
```

### List All States

```javascript
const states = stateMachine.listStates();
console.log(states);
// ['idle', 'active', 'highlight', 'transitioning', 'error', ...]
```

### Get Statistics

```javascript
const stats = stateMachine.getStatistics();
console.log(stats);
// {
//   totalStates: 12,
//   activeNodes: 45,
//   nodesInTransition: 3
// }
```

### Console API

When debug mode enabled, access via `window.nodeStateMachine`:

```javascript
// Inspect a node
window.nodeStateMachine.inspect(node);

// List all states
window.nodeStateMachine.listStates();

// Get statistics
window.nodeStateMachine.stats();

// Trigger transition
window.nodeStateMachine.transition(node, 'highlight', 1.0);

// Emit event
window.nodeStateMachine.emit('customEvent', { data: 'value' });
```

## Performance Considerations

### Optimization Tips

1. **Batch Updates**: State machine updates all nodes in one pass (efficient)
2. **Guard Conditions**: Keep conditions lightweight (avoid expensive checks)
3. **Material Caching**: Reuse material instances where possible
4. **Callback Efficiency**: Minimize work in `onUpdate` callbacks
5. **State Lifecycle**: Use `onExit` to clean up resources

### Performance Targets

- **Single Node**: < 0.1ms per frame (state machine overhead)
- **100 Nodes**: < 5ms per frame (including callbacks)
- **Memory**: ~2KB per node controller

### Scaling Guidelines

| Node Count | Recommended Action |
|-----------|-------------------|
| < 50 | Use all features freely |
| 50-200 | Monitor callback performance |
| 200-1000 | Use simplified callbacks, batch guards |
| 1000+ | Consider state pooling, reduced update frequency |

## Integration with Existing Systems

### With ArchetypeVisualTransitionEngine_v2

```javascript
// Combine state machine with archetype transitions
import ArchetypeVisualTransitionEngine_v2 from './ArchetypeVisualTransitionEngine_v2.js';

const archetypeEngine = new ArchetypeVisualTransitionEngine_v2();
const stateMachine = new NodeStateMachine();

// State that changes archetype
const mythicActivation = new StateDefinition('mythicActivation', {
  onEnter: (node) => {
    // Switch archetype while transitioning state
    archetypeEngine.startTransition(
      node,
      node.userData.currentArchetype,
      'ASCENDED_MYTHIC',
      1.5,
      'easeOutCubic'
    );
  },
  autoProgress: true,
  duration: 1.5,
  nextState: 'active'
});
```

### With NodeMicroEvents

```javascript
// Trigger micro-events during state transitions
const activeState = new StateDefinition('active', {
  onEnter: (node) => {
    // Trigger visual micro-events
    nodeEvents.triggerEvent(node, 'energy_surge');
  },
  onUpdate: (node, elapsed) => {
    // Spawn particles during active state
    if (elapsed > 0.5 && elapsed < 1.0) {
      particleSystem.spawn(node, 5);
    }
  }
});
```

## Example: Complete Animation Sequence

```javascript
// Define a complex combat sequence with multiple states
const combatSequence = [
  // State 1: Preparation
  new StateDefinition('preparing', {
    onEnter: (node) => {
      node.userData.isActive = true;
      if (node.material) {
        node.material.color.setHex(0xffaa00);
      }
    },
    onUpdate: (node, elapsed) => {
      node.rotation.z += elapsed * 0.5;
    },
    autoProgress: true,
    duration: 1.0,
    nextState: 'attacking'
  }),

  // State 2: Attack
  new StateDefinition('attacking', {
    onEnter: (node) => {
      if (node.material) {
        node.material.emissive.setHex(0xff0000);
      }
    },
    onUpdate: (node, elapsed) => {
      const power = Math.sin(elapsed * 10) * 0.5 + 0.5;
      if (node.material) {
        node.material.emissiveIntensity = power;
      }
    },
    guards: [
      {
        condition: (node) => node.userData.targetHealth <= 0,
        targetState: 'idle'
      }
    ],
    duration: 2.0,
    nextState: 'recovering'
  }),

  // State 3: Recovery
  new StateDefinition('recovering', {
    onUpdate: (node, elapsed) => {
      if (node.material) {
        node.material.emissive.multiplyScalar(1 - elapsed);
      }
    },
    autoProgress: true,
    duration: 1.5,
    nextState: 'idle'
  })
];

// Setup
stateMachine.defineStates(combatSequence);
stateMachine.registerNode(combatNode, 'preparing');

// Automatically progresses: preparing → attacking → recovering → idle
// (unless guard condition triggers earlier)
```

## Troubleshooting

### State Not Transitioning

- Check state name is registered: `stateMachine.listStates()`
- Verify guards aren't blocking transition: `inspectNode(node)`
- Ensure node is registered: `stateMachine.getNodeController(node)`

### Visuals Not Applying

- Verify node has `material` property
- Check material has required properties (color, emissive, opacity)
- Confirm THREE.js is loaded (SAFE MODE active?)

### Performance Issues

- Profile callback overhead with `performance.mark()`
- Reduce guard check frequency
- Simplify `onUpdate` animations
- Consider using fixed update intervals

### Animation Jitter

- Ensure deltaTime is consistent
- Use frame rate independent calculations
- Verify easing curves produce smooth output

## Best Practices

1. **Organize States**: Group related states using tags
2. **Guard Efficiency**: Cache condition results when possible
3. **Lifecycle Cleanup**: Always use `onExit` for resource cleanup
4. **Material Reuse**: Share materials between similar states
5. **Testing**: Use debug mode and console API during development
6. **Documentation**: Comment complex state transitions for team clarity
7. **Incremental**: Start simple, add complexity gradually

## API Reference

See NodeStateMachine_v1.js for complete JSDoc documentation.

Key classes and methods:
- `NodeStateMachine`: Core engine
- `StateDefinition`: State blueprint
- `StateController`: Per-node manager
- `StateTransition`: Visual interpolation

---

**Status**: Production Ready ✓
**Performance**: Optimized ✓  
**THREE.js Safe Mode**: Supported ✓
**Documentation**: Complete ✓
