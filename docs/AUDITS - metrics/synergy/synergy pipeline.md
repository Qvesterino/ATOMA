## SYNERGY PIPELINE AUDIT - ROOT CAUSE IDENTIFIED

### Pipeline Flow Analysis

**Current Flow:**
```
NodeLinkingSystem → link.userData.synergy = { score, synergyNorm }
                    ↓
                    [MISSING WRITER]
                    ↓
                  link.userData.synergy = { score, synergyNorm } ← CANONICAL INPUT
                    ↓
                  SynergyBonusVisualization_v1 reads link.userData.synergy.{score, synergyNorm}
                    ↓
                    Falls back to 0 (line 159: ?? 0)
                    ↓
                    All synergyBonus tiers = 0 (NONE)
                    ↓
                    VFX consumers receive zeros
```

### Root Cause

**`LinkGlowSynergyEngine_v2` is DORMANT and NEVER initialized.**

- `SynergyBonusVisualization_v1.js` (line 159) reads canonical `link.userData?.synergy?.synergyNorm ?? link['synergyScore'] ?? link.userData?.synergy?.score ?? 0`
- `NodeLinkingSystem.js` is the active writer for `link.userData.synergy`
- `LinkGlowSynergyEngine_v2` is not required for the current canonical path
- `SynergyBonusVisualization_v1` receives the canonical synergy norm
- All synergy bonus tiers compute as 0 (NONE)
- VFX systems reading `synergyBonus` get all zeros

### Evidence

1. **NodeLinkingSystem.js** (active) writes:
   - `link.userData.synergy = { score, synergyNorm }` ✓
   - `link['synergyScore'] = score` ✓

2. **LinkGlowSynergyEngine_v2.js** (dormant) would write:
   - `link.userData.visualGlow = { glowIntensity, synergyNorm, qualityNorm, corruptionPulse }` ✗

3. **SynergyBonusVisualization_v1.js** (active) reads:
   - `link.userData?.synergy?.synergyNorm ?? link['synergyScore'] ?? link.userData?.synergy?.score ?? 0` ← **CANONICAL HERE**

4. **main.js** initialization:
   - ✗ No import of `LinkGlowSynergyEngine_v2`
   - ✗ No initialization of `LinkGlowSynergyEngine_v2`
   - ✓ `SynergyBonusVisualization_v1` IS initialized (line ~7684)

### Minimal Fix (3 lines)

**File:** `SynergyBonusVisualization_v1.js`  
**Line:** ~159

```javascript
// REPLACE:
const glowIntensity = link.userData?.visualGlow?.glowIntensity ?? 0;

// WITH:
const glowIntensity = 
    link.userData?.synergy?.synergyNorm ?? 
    link['synergyScore'] ?? 
    link.userData?.synergy?.score ?? 
    0;
```

This fix:
- ✓ Reads from existing source (`link.userData.synergy.synergyNorm`)
- ✓ Falls back to legacy `link['synergyScore']`
- ✓ Maintains backward compatibility
- ✓ Requires NO new initialization
- ✓ Restores synergy bonus tiers > 0
- ✓ Enables VFX consumers to receive real values