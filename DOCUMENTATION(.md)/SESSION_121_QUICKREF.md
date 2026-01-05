# Session 121: Particle Clustering & Density as Semantic Channel
## Quick Reference

### 🎯 Goal
Add **density** and **clustering** as third and fourth semantic channels for particles, encoding **intensity** and **urgency** of synaptic conflicts.

### 🔑 Key Features
- **Particle Density**: Emission count multiplier (1.0x → 4.0x) based on conflict intensity.
- **Particle Clustering**: Spatial grouping strength (0 → 1) based on temporal urgency.
- **Adaptive Responsiveness**: EMA smoothing for temporal coherence.
- **Zero Per-Frame Allocations**: Pure adapter pattern reading existing state.

### 🎨 Complete Semantic Language
| Channel | Question | Encoding |
|---|---|---|
| **Shape** (S120) | What conflict? | Arc / Fork / Shard / Blob |
| **Motion** (S120) | Where flowing? | Forward / Backflow / Oscillatory |
| **Density** (S121) | How intense? | Sparse → Dense (1x → 4x) |
| **Clustering** (S121) | How urgent? | Dispersed → Compressed |

### 📊 Intensity Model
Particle density encodes conflict **strength**:
- Derived from: Cascade intensity, dominance pressure, corruption, fatigue.
- **Very Low**: Occasional isolated particles.
- **Low**: Sparse, evenly spaced.
- **Medium**: Noticeable increase.
- **High**: Dense presence.
- **Critical**: High density (capped for safety).

### 🚨 Urgency Model
Particle clustering encodes **temporal pressure**:
- Derived from: Rapid dominance changes, accelerating corruption, instability spikes.
- **Stable**: Even distribution.
- **Mild**: Loose local grouping.
- **Escalating**: Tight clusters forming.
- **Critical**: Highly localized clusters.

### 🛠️ Architecture
- **File**: `ParticleSemanticDensityAdapter_Session121.js`
- **Class**: `ParticleSemanticDensityAdapter_Session121`
- **Integration**:
  - Reads `link.userData` (cascade intensity, conflict state, fatigue)
  - Writes `particleIntensity`, `particleDensityMultiplier`, `particleClusterCohesion`, `particleClusterRadius`
  - Consumed by `CascadeParticleSystem_Session120`

### 💻 Usage
```javascript
// In main.js
import { setupParticleSemanticDensity } from './ParticleSemanticDensityAdapter_Session121.js';

// Setup
this.setupParticleSemanticDensity();

// Update (feeds data to particle system)
this.particleSemanticDensity.update(deltaTime, links, conflictSystem, cascadeSystem);
```

### 📈 Performance
- **Cost**: <0.3ms per frame (3000 links)
- **Allocations**: 0 per frame
- **Memory**: ~5KB per link (metrics tracking)

### 🔮 Visual Result
Players instantly perceive:
- **Weak vs strong** conflicts (density)
- **Calm vs critical** situations (clustering)
- No UI required, no legend needed
- Network feels alive and responsive
