# CANONICAL TEMPLATE #3: QUICK START
## Network Stress & Load Pressure Visuals

**Installation Time:** ~10 minutes  
**Integration Complexity:** Low  
**Breaking Changes:** None

---

## 1. ADD IMPORT (main.js top)

```javascript
import { CanonicalTemplate3_StressVisuals } from './CanonicalTemplate3_StressVisuals.js';
```

---

## 2. ADD PROPERTY (AtomaGame constructor)

```javascript
this.stressVisuals = null;
```

---

## 3. INITIALIZE (setupPrimaryNodeSystem or constructor section)

```javascript
this.stressVisuals = new CanonicalTemplate3_StressVisuals(this.scene, {
  debugMode: false
});
```

---

## 4. UPDATE EACH FRAME (in animate() loop)

```javascript
// Read network stress from corruption system
const networkStress = this.linkCorruptionTransmission?.computeNetworkStress() ?? 0;
this.stressVisuals.updateNetworkStress(networkStress);

// Update per-node load pressure
if (this.aiNodes?.nodes) {
  for (const node of this.aiNodes.nodes) {
    // Simple option: count corrupted links
    const links = node.userData?.links || [];
    const corrupted = links.filter(l => (l.userData?.corruption ?? 0) > 0.3).length;
    const loadPressure = Math.min(1, corrupted / Math.max(1, links.length));
    
    this.stressVisuals.updateNodeLoadPressure(node, loadPressure);
  }
}

// Update visual effects
this.stressVisuals.update(deltaTime, this.time);
```

---

## 5. RUN & VERIFY

```javascript
// In browser console:
window.atoma.stressVisuals.debugPrintStress()

// You should see:
// [CanonicalTemplate3] NETWORK STRESS DEBUG
// Global Network Stress: 0.345
// Tracked Nodes: 12
//   abc1234... load=0.200
//   def5678... load=0.800
```

---

## WHAT YOU'LL SEE

### Low Stress
- Scene fog: light, cool blue tint
- Nodes: stable, no vibration
- Feeling: calm, healthy network

### Medium Stress  
- Scene fog: warming, orange tint
- Nodes: subtle jitter starting
- Feeling: caution, pay attention

### High Stress
- Scene fog: dark red, heavy
- Nodes: aggressive vibration, fast pulse
- Feeling: urgent, action needed

---

## DEBUG COMMANDS

```javascript
// Toggle debug mode
atoma.stressVisuals.debugMode = true;

// Get current network stress
atoma.stressVisuals.getNetworkStress();  // Returns 0–1

// Get specific node load
atoma.stressVisuals.getNodeLoadPressure(someNode);  // Returns 0–1

// Print all tracked nodes
atoma.stressVisuals.debugPrintStress();
```

---

## THAT'S IT!

You're done. The visualization system is live and producing ambient + node-local stress effects.

For advanced options, see `CanonicalTemplate3_IntegrationGuide.md`

