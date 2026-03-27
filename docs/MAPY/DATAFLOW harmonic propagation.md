Komplexné opravy vyrieš hotfixy:
:

Vysvetlivka závislostí systému ( data flow
┈────────────────────────────────│
HarmonicInfluencePropagation │ HarmonicHubAuraSystem │
 │
│ │ ↓▼
│ `InfluenceReflection.pressureZones` │
 StandingWaveTrap │  → StandingWaveRenderer │  → WaveInterference │
 → ResonanceRupture │
Data Flow:

HarmonicHubAuraSystem (Session 126) emituje influence pulses

HarmonicInfluencePropagation (session 127) reads from pulses, propagates influence through links

InfluenceReflection ( detects resistant nodes and creates pressure zones

StandingWaveTrap creates oscillation traps on links with active standing waves

StandingWaveRenderer renders antinodes ( trap zones, interference bands

ResonanceRupture visualizes rupture events on links

Yellow blob = WaveInterferencePatternSystem ( constructive interference zones)

Resistant nodes = nodes ktoré odolávajú harmonic influence. Sú to:

node.gated alebo node.resistant flag
node.userData.gated alebo node.userData.resistant flag
Majú vysokou instability ( node instability > 0.3
majú aktívne linky ( node je resistant
**Resistant nodes sú sú nodes ktoré odmietajú harmonic influence a ke ne preniká ale sa system nem nefaktív. Tiet prípad na. Teda sa influence reflection vizualizuje.

A - ResonanceRupture - vizualizes rupture events on links

    - Creates rupture scars ( scars) when wave escapes trap
    - Creates damped waves when trap collapses
    - Handles resolution animations ( damping, breakthrough, collapse)
    - **Spawn pipeline chain**: `HarmonicHubAuraSystem → HarmonicInfluencePropagation → InfluenceReflection → StandingWaveTrap → StandingWaveRenderer → WaveInterference → ResonanceRupture

---

## "Resistant" Nodes - čo sú to sú```

Nodes ktoré:
- majú vysokou instability
 - `node.gated` alebo `node.resistant` flag
- `node.userData.gated` alebo `node.userData.resistant` flag
- Sú in [`_updateResistantNodeMap()`](InfluenceReflectionBackPressureSystem_Session129.js:163) detekované

 aké sú majú vysokú instability, - node je resistant
- **Vysvetlivé**:**
- Resistant nodes sú nodes ktoré odolávajú harmonic influence ( súto ne, systém by nepridá.. Tiet. (harmony < corruption alebo high instability)
 - Sú v tom, zóny, kde influence can't propagate
- **High corruption** nodes create strong back-pressure (energy rebounds back)
- **Low harmony** nodes allow influence through (- **No influence** → no reflections, no pressure zones
- **Low instability** nodes create chaotic reflections
 - **Gated nodes** (node.gated || node.userData?.gated) create strong back-pressure
- **Resistant nodes** are `isResistant = if (isGated) return true;
        if (hasTopology) return true;
        return false;
    }
}
Files Modified:
StandingWaveVisualRenderer_Session131.js - visual fixes (materials, scaling

InfluenceReflectionBackPressureSystem_Session129.js - spawn pipeline fix ( fallback values

HarmonicInfluencePropagationSystem_Session127.js - fallback influence values

main.js - added rebind calls for standingWaveRenderer and waveInterference

ResonanceRuptureVisualSystem_Session133.js - already has rebind()

System Dependencies Expl Data Flow
HarmonicHubAuraSystem (Session 126)
        ↓↓
       ↓↓ (emits influence pulses)
       ↓↓
       ↓↓
    HarmonicInfluencePropagation (Session 127)
        ↓↓
       ↓↓ (provides link influence values)
       ↓↓
       ↓↓
    InfluenceReflection ( Session 129)
        ↓↓ ( detects resistant nodes)
       ↓↓
       ↓↓ ( creates pressure zones)
       ↓↓
       ↓↓
    StandingWaveTrap ( Session 130)
        ↓↓ ( creates oscillation traps)
       ↓↓
       ↓↓
    StandingWaveRenderer ( Session 131)
        ↓↓ ( renders antinodes & trap zones)
       ↓↓
       ↓↓
    WaveInterference ( Session 132)
        ↓↓ ( renders constructive/de destructive interference zones)
       ↓↓
       ↓↓
    ResonanceRupture ( Session 133)
        ↓↓ ( renders rupture scars on links)
       ↓↓
       ↓↓
Yellow blob = WaveInterferencePatternSystem ( constructive interference zones ( gold color 1.0, 0.8, 0.0))

The:

Antinodes - Blue glowing spheres at trap zones (rendered by StandingWaveVisualRenderer with MeshBasicMaterial + additive blending

Interference bands - Gold bands rendered by WaveInterferencePatternSystem

ResonanceRupture - Red/or dark rupture scars on links

Root group attachment - All systems have _ensureAttachRoot() which handles scene attachment properly.

World switch rebind - Added rebind() methods to both system

Resistant nodes - Nodes that reject harmonic influence. Detected by checking:

harmony < corruption
high instability
node.gated or node.userData?.gated flag
node.userData.resistant flag (- manually resistant
Low harmony nodes allow influence through (no reflections, no pressure zones)

Low instability nodes create chaotic reflections and back-pressure

Gated nodes (node.gated || node.userData?.gated) create strong back-pressure

Resistant nodes are isResistant if (isGated) return true;
if (hasTopology) return true;
return false;
}
}


**Root Cause identified:** Links lacked flow data → InfluenceReflection returns 0 because no waves are active.

- **HarmonicInfluencePropagation not running** → no influence values returned
- **World switch rebind** - Fixed for for all three visual systems

- **Resistant nodes** - Explained and detection logic added

 Now let me update the todo list and provide a summary: