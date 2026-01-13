# Session 120: Semantic Particle Encoding (Shape & Velocity)
## Quick Reference

### 🎯 Goal
Upgrade particles from generic visual effects to **semantic carriers of information**.
- **Shape** tells you *what kind* of conflict is happening.
- **Velocity** tells you *where* influence is flowing.

### 🔑 Key Features
- **Semantic Shapes**: 4 distinct particle shapes generated at runtime (Arc, Fork, Shard, Blob).
- **Semantic Velocity**: 3 flow types (Forward, Backflow, Oscillatory).
- **Zero Allocations**: Single `THREE.Points` system with reused pool.
- **Shader-Driven**: Shape switching via attribute `shapeIndex` and texture atlas.

### 🎨 Visual Language
| Conflict Type | Shape | Meaning |
|---|---|---|
| **Phase / Destructive** | **Arcs / Crescents** | "Out of sync, but compatible" |
| **Polarity / Drift** | **Forked / Split** | "Opposing intent" |
| **Corruption** | **Fractured Shards** | "Structural damage" |
| **Instability** | **Irregular Blobs** | "Unreliable environment" |

| Flow Type | Motion | Meaning |
|---|---|---|
| **Forward** | Fast, linear along link | Dominant propagation |
| **Backflow** | Reverse direction | Resistance / Absorption |
| **Oscillatory** | Wiggle / Figure-8 | Stalemate / Negotiation |

### 🛠️ Architecture
- **File**: `CascadeParticleSystem_Session120.js`
- **Class**: `CascadeParticleSystem_Session120`
- **Integration**:
  - Imported in `main.js`
  - Instantiated via `setupCascadeParticleSystem()`
  - Updated per-frame in `animate()`
  - Consumes `link.userData.cascadeConflictType` (from Session 119)

### 💻 Usage
```javascript
// In main.js
import { setupCascadeParticleSystem } from './CascadeParticleSystem_Session120.js';

// Setup
this.setupCascadeParticleSystem();

// Update
this.cascadeParticleSystem.update(deltaTime, links);
```

### 📊 Performance
- **Draw Calls**: 1 (Single Points mesh)
- **Geometry**: 3000 particles (static buffers, dynamic updates)
- **Texture**: 128x128 generated atlas (cached)
- **Cost**: <0.5ms per frame

### 🔮 Next Steps
- Add trail rendering for "Forward" flow to emphasize speed.
- Integrate with `ParticleStreamCascadeAcceleration` for depth-based speed scaling.
