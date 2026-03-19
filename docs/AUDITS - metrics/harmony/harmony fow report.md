# HARMONY/FLOW DATA RENDER ANALYSIS

## KROK 1: KTO ČÍTA HARMONY/FLOW DATA

**Hlavný zdroje dát:**
- `link.metrics.harmony` / `link.userData.harmonyLevel`
- `link.userData.corruption` / `link.userData.corruptionLevel`
- `link.synergy`
- `link.traffic` / `link.loadPressure`
- `link.flowState.energy`

## KROK 2: REAL RENDERERS (posledný krok pipeline)

### PRIMARY RENDERER: **LinkRendererConduit.js**

**Kde číta:**
```javascript
// Line 2734-2806: _readLinkMetrics()
const harmony = readMetric(
    userData.harmony,
    userData.harmonyLevel,
    userMetrics.harmony,
    linkMetrics.harmony,
    link?.harmonyLevel,
    link?.harmony
);
```

**Kde RENDERUJE (data → shader/mesh):**

1. **Link Aura Skin Shader** (lines 2172-2244):
```javascript
material.uniforms.uHarmony.value = linkHarmony;
material.uniforms.uCorruption.value = linkCorruption;
material.uniforms.uSynergy.value = linkSynergy;
material.uniforms.uDesaturation.value = Math.min(1.0, linkCorruption * 1.2);
```

2. **Strand Shader Uniforms** (lines 2090-2115):
```javascript
mat.uniforms.uNetworkStress.value = metrics.loadPressure ?? 0;
mat.uniforms.uLocalLoad.value = metrics.traffic ?? 0;
mat.uniforms.uCorruption.value = metrics.corruption ?? 0;
```

3. **Visual State Adapter** (lines 2678-2690):
```javascript
state.visualStateAdapter.update(
    link.group,
    harmonyLevel,
    corruptionLevel,
    instability,
    visualDelta,
    synergyLevel,
    frameState
);
```

4. **Directional Streaks** (lines 2706-2745):
```javascript
this.directionalStreaks.update(
    link.group,
    mainCurve,
    visualDelta,
    synergyLevel,
    harmonyLevel,
    corruptionLevel,
    instability,
    sourceColor,
    targetColor
);
```

### SECONDARY RENDERERS:

5. **LinkVisualStateAdapter.js** - Mení mesh.opacity, mesh.scale
6. **LinkDirectionalStreaks.js** - Aktualizuje shader uniforms pre flow vizualizáciu
7. **LinkRingArcDischarges.js** - Aktualizuje arc.material.opacity
8. **ArcadeColorPaletteSystem_v1.js** - Aktualizuje archetype uniforms
9. **ArchetypeAuraEnhancement_v1.js** - Aktualizuje aura uniforms

## KROK 3: GHOST SYSTEMS (len výpočty, žiadny render)

Len výpočtové systémy:
- **HarmonicInfluencePropagationSystem_Session127.js** - Len číta a prepisuje data, žiadne scene.add()
- **HarmonicHubAuraSystem_Session126.js** - Len hub logika, renderuje iný systém
- **HarmonicResonanceCoupling_v1.js** - Len numerické výpočty
- **HarmonicTopologyLearningSystem.js** - Debug vizualizácia, nie produkčný render
- **HarmonicResonanceFeedbackSystem.js** - Len modifikácia userData

## VÝSLEDOK: KTO MÁ POSLEDNÉ SLOVO

**LinkRendererConduit.js** je konečný pipeline pre link vizuály:
1. Číta harmony/flow z link.metrics
2. Mapuje na shader uniforms (uHarmony, uCorruption, uSynergy)
3. Aktualizuje material.opacity/emissiveIntensity
4. Spouští subsystémy (streaks, arcs, impacts)

**Dátový tok:**
```
link.metrics.harmony 
  → _readLinkMetrics() 
    → LinkRendererConduit.update() 
      → skin.material.uniforms.uHarmony.value
      → strand.material.uniforms.uCorruption.value
      → visualStateAdapter.update()
      → directionalStreaks.update()
```

**Shadery ktoré konzumujú harmony:**
- `LinkAuraShader.js` - uHarmony, uCorruption, uSynergy
- `linkStateVertexShaderSimple` / `linkStateFragmentShaderSimple` - uLocalLoad, uCorruption
- Wave shader packy - uWaveAmplitude, uWaveConstructive, uWaveDestructive

**ZÁVER:** LinkRendererConduit.js je autoritatívny renderer - všetky ostatné systémy buď len počítajú, alebo sú volané z LinkRendererConduit.update().