# LINK STATE VISUAL LANGUAGE: QUICK REFERENCE
## Five Visual Channels, One Purpose: Readability

---

## THE 5 CHANNELS AT A GLANCE

| Channel | Metric | Visual | Meaning |
|---------|--------|--------|---------|
| **1** | Network Stress | Color: blue → orange → red | Network mood |
| **2** | Load Pressure | Pulse speed + thickness | Path congestion |
| **3** | Corruption | Edge noise + breakup | Link health |
| **4** | Synergy | Smoothness + shimmer | Connection quality |
| **5** | Harmony | Damping effect | Protected zone |

---

## WHAT THE PLAYER READS

```
BLUE LINK + SMOOTH + NO PULSE
↓
"This path is healthy and uncongested"

RED LINK + FRAYED EDGES + FAST PULSE
↓
"This path is critical and overloaded"

ORANGE LINK + DAMPED EFFECTS + CALM PULSE
↓
"This path is stressed but protected by harmony"
```

---

## SHADER INPUTS (Read-Only)

```glsl
uNetworkStress    // 0–1 (global)
uLocalLoad        // 0–1 (per-link)
uCorruption       // 0–1 (per-link)
uSynergy          // 0–100 (per-link)
uHarmony          // 0–1 (per-link)
uTime             // Animation clock
```

All read-only. Never written to.

---

## COMPOSITION RULE

✅ Layer perceptually (add effects)  
❌ Don't multiply stats together  
❌ Harmony never amplifies  
✅ Each channel independent

---

## INTEGRATION (3 LINES)

```javascript
import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';

const linkVisuals = new LinkStateVisualLanguageIntegration(linkingSystem);

// Each frame:
linkVisuals.updateNetworkStress(networkStress);
for (const link of allLinks) {
  linkVisuals.updateLinkMetrics(link, corruption, synergy);
}
linkVisuals.updateAnimationTime(this.time);
```

---

## DEBUG

```javascript
window.atoma.linkVisuals.debugPrintLinkStates();

// Output: All links with their visual interpretation
// Network Stress: 0.345
// Link: corruption=0.20, synergy=75, harmony=0.60, load=0.15
//   → Warming orange | Clean edges | High coherence | Stabilized
```

---

## DESIGN PHILOSOPHY

> "The player should feel what is happening"
> "Without reading numbers"

---

