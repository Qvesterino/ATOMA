# HarmonicRecoveryVisualSystem Upgrade Plan

**Date**: 2026-04-21  
**Scope**: MEDIUM (1 subsystem, visual-only, no gameplay mutations)  
**Mode**: EVOLUTION_V2 — Controlled Innovation  

---

## Current State Analysis

**File**: `HarmonicRecoveryVisualSystem_Session138.js` (~1210 lines)

### Architecture
- Adapter-only system that monitors rupture state and triggers healing visuals
- 3 visual layers: Coherence Waves, Link Re-Stitching, Node Recovery Halos
- Object pools: 10 wave meshes, 20 halo meshes
- Dramaturgy modulation integration
- Event-driven via semanticBus (harmony.high, harmony.mid, stability.mid, stability.low)
- Managed beam cleanup with tracked `_activeBeams`

### Current Visuals
- **Coherence Wave Shader**: Multi-ring expansion (3 rings), hot core flash, energy shimmer, sparkle fringe, color evolution (warm gold → luminous cyan)
- **Recovery Halo Shader**: Expanding convergence rings (3 rings), rotating brightness pattern, hot center glow, energy shimmer
- **Re-stitching Beams**: Multi-point energy thread with sine wave displacement, stitch-point particles alternating gold/cyan
- **Colors**: Warm gold `vec3(1.0, 0.88, 0.5)`, luminous cyan `vec3(0.4, 1.0, 0.95)`, beam `0x88ffdd`, stitch gold `1.0, 0.85, 0.4` / cyan `0.5, 1.0, 0.9`

### Identified Upgrade Opportunities

#### 1. Coherence Wave Shader — Sacred Spectral Evolution
**Current**: Color evolves from warm gold → luminous cyan based on harmony  
**Upgrade**: Sacred spectral cycling — warm gold → celestial teal → mystic violet → ritual crimson shimmer

**Fragment shader changes** (line ~119):
```glsl
// Current:
vec3 warmGold = vec3(1.0, 0.88, 0.5);
vec3 luminousCyan = vec3(0.4, 1.0, 0.95);
vec3 evolvedColor = mix(warmGold, luminousCyan, uHarmony * 0.6 + uLife * 0.3);

// Upgrade:
vec3 sacredGold = vec3(1.0, 0.84, 0.0);
vec3 celestialTeal = vec3(0.25, 0.88, 0.82);
vec3 mysticViolet = vec3(0.58, 0.35, 0.92);
float sacredPhase = uHarmony * 0.5 + uLife * 0.4;
vec3 evolvedColor = mix(sacredGold, celestialTeal, smoothstep(0.0, 0.5, sacredPhase));
evolvedColor = mix(evolvedColor, mysticViolet, smoothstep(0.6, 1.0, sacredPhase) * 0.35);
```

**Sparkle fringe color** (line ~126):
```glsl
// Current:
finalColor += vec3(0.6, 0.9, 1.0) * fringeSparkle * 0.2;

// Upgrade: Sacred spectral fringe
finalColor += mix(vec3(1.0, 0.84, 0.4), vec3(0.25, 0.88, 0.82), sin(uTime * 0.5) * 0.5 + 0.5) * fringeSparkle * 0.25;
```

#### 2. Recovery Halo Shader — Sacred Convergence Rings
**Current**: Rings with rotating brightness, center glow, colored by `uColor` uniform  
**Upgrade**: Sacred spectral convergence — rings cycle through sacred hues during expansion

**Fragment shader changes** (line ~204):
```glsl
// Current:
vec3 coreColor = mix(vec3(1.0), uColor, 0.3);
vec3 finalColor = mix(coreColor, uColor, smoothstep(0.1, 0.4, dist));

// Upgrade: Sacred spectral ring tinting
vec3 sacredRingTint = mix(uColor, vec3(0.25, 0.88, 0.82), ring1 * 0.3);
vec3 coreColor = mix(vec3(1.0), sacredRingTint, 0.35);
vec3 finalColor = mix(coreColor, sacredRingTint, smoothstep(0.1, 0.4, dist));
```

#### 3. Material Base Colors — Sacred Palette
**Current**: Wave `0x00ffff` (cyan), Halo `0xffff33` (yellow)  
**Upgrade**: Wave → celestial teal `0x40E0D0`, Halo → sacred gold `0xFFD700`

**JS changes** (line ~268, ~284):
```javascript
// Wave material
uColor: { value: new THREE.Color(0x40E0D0) }  // was 0x00ffff

// Halo material
uColor: { value: new THREE.Color(0xFFD700) }   // was 0xffff33
```

#### 4. Re-stitching Beam — Sacred Thread
**Current**: Beam `0x88ffdd` (mint), stitch colors gold/cyan  
**Upgrade**: Sacred gold beam, celestial teal / sacred gold stitch alternation

**JS changes** (line ~736):
```javascript
// Beam material
color: new THREE.Color(0xFFD700)  // was 0x88ffdd

// Stitch colors
stitchColor.setRGB(1.0, 0.84, 0.0);   // Sacred gold (was 1.0, 0.85, 0.4)
stitchColor.setRGB(0.25, 0.88, 0.82);  // Celestial teal (was 0.5, 1.0, 0.9)
```

#### 5. HSL Color Computation — Sacred Spectrum Range
**Current**: `setHSL(0.08 + harmony * 0.42, 0.92, 0.62)` — orange to cyan  
**Upgrade**: `setHSL(0.12 + harmony * 0.38, 0.88, 0.58)` — sacred gold to celestial teal with sacred saturation

**JS changes** (lines ~1006, ~1105):
```javascript
// Wave color
this._tmpColor.setHSL(0.12 + harmony * 0.38, 0.88, 0.58);

// Halo color
this._tmpColor.setHSL(0.12 + nodeHarmony * 0.38, 0.88, 0.55);
```

#### 6. Config — Master Switch
Add `enableSacredRecovery: true` to config for instant rollback.

---

## Implementation Order

1. Config: Add master switch
2. Material base colors (wave + halo)
3. Coherence wave fragment shader (sacred spectral evolution + fringe)
4. Recovery halo fragment shader (sacred convergence tint)
5. Re-stitching beam + stitch colors
6. HSL color computation (wave + halo zones)
7. Test and verify

## Risk Assessment

- **LOW risk**: All changes are visual-only, no gameplay mutations
- **Master switch**: Instant rollback to legacy colors
- **Shader changes**: Same uniform interface, no API changes
- **Performance**: Zero additional cost — same instruction count, just different color values

## Visual Coherence

This upgrade aligns HarmonicRecoveryVisualSystem with the sacred spectral palette used across all 14 previously upgraded systems:
- Sacred gold `#FFD700` / `vec3(1.0, 0.84, 0.0)`
- Celestial teal `#40E0D0` / `vec3(0.25, 0.88, 0.82)`
- Mystic violet `#9466EB` / `vec3(0.58, 0.35, 0.92)`
- Ritual crimson `#CC0030` / `vec3(0.8, 0.0, 0.19)`
