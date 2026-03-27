# ATOMA: Audit Efektov - Modifikácie Shadrov, Uniforms, Pozícií a Veľkostí Nodov

**Audit Date:** 2026-03-27
**Scope:** Systematický prieskum všetkých efektov, ktoré menia shadre, uniformy, pozície a veľkosti nodov v ATOMA

---

## Zhrnutie Nájdených Efektov

### Kategória 1: Modifikácie Shaderov (Uniforms)

#### 1.1 Archetypové Shadrové Systémy

**ArchetypeShaderModes_v1.js**
- Modifikuje: `uShaderModeId`, `uModeIntensity`, `uModeDistortion`, `uModeBloom`, `uModeHueShift`, `uModeNoiseShift`, `uModeGradientMix`
- Metóda: `material.onBeforeCompile()` patchovanie fragment shaderu
- Injektované uniformy: 7+ archetyp-specific uniformov

**ArchetypeNeuralLinkVis_v1.js**
- Modifikuje: `uCompatibility`, `uResonance`, `uEntropy`, `uAscension`, `uTime`, `uColorA`, `uColorB`
- Metóda: `onBeforeCompile()` s procedurálnym noise
- Vrstva: Fragment shader modification

**ArchetypeColorPaletteSystem_v1.js**
- Modifikuje: `uArchetypePrimaryColor`, `uArchetypeSecondaryColor`, `uArchetypeAccentColor`, `uArchetypeColorBlend`, `uArchetypeWarmShift`, `uArchetypeSaturation`, `uArchetypeAscensionGlow`
- Metóda: `onBeforeCompile()` patchovanie vertex a fragment shaderov
- Počet uniformov: 7 color-related uniformov

**ArchetypeAuraEnhancement_v1.js**
- Modifikuje: `uArchetypeIntensity`, `uArchetypeRadiusBoost`, `uArchetypeColorShift`, `uArchetypeBloomBoost`, `uArchetypeDistortionAmount`
- Metóda: `onBeforeCompile()` pre aura vylepšenia
- Vplyv: Aura radius boost, color shift, distortion

#### 1.2 Wave Shader Systémy

**WaveShaderMaterialPatch_v1.js**
- Modifikuje: `uWaveAmplitude`, `uWaveConstructive`, `uWaveInterference`, `uWaveStanding`, `uWavePhase`, `uWaveSourceCount`, `uWaveIntensity`, `uWaveProfile`, `uWaveProfileHigh`, `uTime`
- Metóda: `onBeforeCompile()` s wave physics patch
- Počet uniformov: 10+ wave-related uniformov

**WaveDynamicsShaderPack_v1.js**
- Modifikuje: `uWavePhase`, `uWaveIntensity`, `uWaveStanding`, `uWaveDestructive`, `uWaveConstructive`, `uWaveCenter`, `uWaveDynamicsBreathAmp`, `uWaveDynamicsBreathFreq`, `uWaveDynamicsRippleAmp`, `uWaveDynamicsRippleFreq`, `uWaveDynamicsChaosDrive`, `uWaveDynamicsDiffusionAmp`, `uWaveDynamicsTime`
- Metóda: Dynamic shader patching
- Features: Breathing, ripple, chaos, diffusion effects

**WaveTravelShaderPack_v1.js**
- Modifikuje: `uWavePhase`, `uWaveIntensity`, `uWaveInterference`, `uWaveConstructive`, `uWaveDestructive`, `uWaveStanding`, `uWaveTravelScale`, `uWaveTravelUVFlow`, `uWaveTravelColorGradient`, `uWaveTravelPulse`, `uWaveTravelFreqMix`, `uWaveTravelTime`
- Metóda: Travel wave shader patching
- Features: UV flow, gradient travel, pulse effects

#### 1.3 Personality Shadrové Efekty

**PersonalityShaderEffects_Pack_v1.js**
- Modifikuje: `uClarity`, `uEnergy`, `uQuality`, `uCorruption`, `uEntropy`, `uTime`, `uResonance`, `uFocus`, `uLinkGlow`, `uLinkQuality`
- Metóda: Multiple `onBeforeCompile()` hooks pre rôzne personalities
- Počet osobností: 6+ (clarity, energy, corruption, resonance, focus, link-focused)

**PersonalityShaderAdvancedFX_v1.js**
- Modifikuje: `uEntropy`, `uCorruption`, `uFocus`, `uEnergy`, `uResonance`, `uQuality`, `uTime`, `uLowFXMode`
- Metóda: Advanced shader injection s markerom `// ADVANCED_FX_INJECTED`
- Features: Low-FX mode, advanced fragment modulation

**PersonalityShaderStabilizedFX_v1.js**
- Metóda: Stabilized shader patching s helper functions
- Vlastnosť: Udržiava original onBeforeCompile hooks
- Injected: Helper functions + vertex/fragment shader patches

#### 1.4 Link Shadrové Systémy

**LinkRendererConduit.js**
- Modifikuje: `uWaveDirection`, `uWaveLength`, `uWavePhaseOffset`
- Metóda: `onBeforeCompile()` pre link wave effects
- Injektuje: Wave uniforms do vertex shaderu

**SynergyResonanceShaderPack_v1.js**
- Modifikuje: Synergy resonance uniforms (konkrétne názvy nie sú explicitné v kóde, ale používajú `fragmentPatch`)
- Metóda: `onBeforeCompile()` s fragment shader patching
- Vplyv: Resonance effects v output fragment

**SynergyBonusFXLayer_v1.js**
- Modifikuje: Bonus FX uniforms
- Metóda: `onBeforeCompile()` s vertex a fragment patching
- Features: Layered bonus effects

**SynergyTravelingWaveFX_v1.js**
- Modifikuje: Travel wave uniforms (nešpecifikované presne v kóde)
- Metóda: `onBeforeCompile()` s vertex shader wave distance patching
- Features: `vWaveDistance` varying injection

#### 1.5 Iné Shader Systémy

**_ExtremeAIShaderPack.js**
- Modifikuje: `u_harmony`, `u_stability`
- Metóda: Direct shader mutation pre extreme AI states

**_SafeWorldFXPack.js**
- Modifikuje: `uOpacity`
- Metóda: Simple opacity modulation pre safe effects

**LinkPulseRing.js**
- Modifikuje: Internal shader uniforms pre pulse effects
- Metóda: `ShaderMaterial` s custom uniforms

**LinkRingArcDischarges.js**
- Modifikuje: Arc discharge uniforms
- Metóda: `LineBasicMaterial` s color modulation

**LinkHealingParticleSystem.js**
- Modifikuje: Healing particle uniforms
- Metóda: `ShaderMaterial` pre particle system

**CascadeParticleSystem_Session120.js**
- Modifikuje: Cascade particle uniforms
- Metóda: `ShaderMaterial` s extensive uniform system

**HealingParticleSystem_Session136.js**
- Modifikuje: Sparkle vertex/fragment shader uniforms
- Metóda: `ShaderMaterial` pre healing effects

---

### Kategória 2: Modifikácie Pozícií Nodov

#### 2.1 Stress Visuals

**CanonicalTemplate3_StressVisuals.js**
- Modifikuje: `node.position.x`, `node.position.y`, `node.position.z`
- Metóda: Jitter application pri high load pressure
- Mechanizmus:
  - Ukladá `originalPosition` do `node.userData.originalPosition`
  - Pri `loadPressure > 0.7` aplikuje jitter
  - Pri `loadPressure < 0.3` obnovuje original position
- Vplyv: Nody "tremblujú" pod stresom

#### 2.2 Corruption Effects

**CorruptionVisualFX_v1.js**
- Modifikuje: `nodeModel.position.set(basePos.x, basePos.y, basePos.z)`
- Metóda: Position reset po corruption cleanup
- Kontext: Corruption particle position tracking

#### 2.3 AI Consciousness Layer

**AIConsciousnessLayer.js**
- Modifikuje: `pulse.mesh.position.copy(pulse.position)` s oscillation
- Oscillation: `pulse.mesh.position.y += oscillation`
- Oscillation amplitude: `Math.sin(this.time * 3 + i) * 0.1`
- Particle positioning:
  - `particle.position.x = basePos.x + Math.cos(angle) * radius`
  - `particle.position.y = basePos.y + bobAmount`
  - `particle.position.z = basePos.z + Math.sin(angle) * radius`

#### 2.4 Particle Systems

**CascadeParticleSystem_Session120.js**
- Modifikuje: `p.position.add(p.pathOffset)`
- Marker positioning: `marker.position.copy(particle.position)`
- Source/destination positioning: `src.position.copy(sourcePos)`, `dst.position.copy(targetPos)`

**AnimatedLinkFlow.js**
- Modifikuje: `packet.mesh.position.copy(point)` - packet follows curve
- Offset pridanie pre vizuálny efekt

**CompositeGlyphGenerator.js**
- Orbital positioning: `mesh.position.x = Math.cos(angle) * orbitRadius`, `mesh.position.z = Math.sin(angle) * orbitRadius`
- Link state positioning: Vizuál kopíruje link position

**CompositeGlyphResonanceFeedback.js**
- Modifikuje: `this.position.copy(this.compositeGlyph.mesh.position)`
- Debug sphere positioning pre feedback vizualizáciu

#### 2.5 Evolution Effects

**EvolutionRegistry.js**
- Glow positioning: `overlays.glowMesh.position.set(0, 0, 0)`
- Ring positioning: `ring.position.set(0, 0, 0)`
- Particle positioning: `particle.position.set(x, y, z)`
- Burst positioning: `burst.position.set(0, 0, 0)`

#### 2.6 Harmonic Effects

**HarmonicInfluencePropagationSystem_Session127.js**
- Mesh positioning: `mesh.position.copy(node.position)`
- Flow positioning: `mesh.position.copy(flowPos)`

**HarmonicNodeResonanceHalos.js**
- Halo positioning kopíruje node position (implicitne cez scale)

**HarmonicHubAuraSystem_Session126.js**
- Marker positioning: `marker.position.copy(hub.position)`

**HarmonicRecoveryVisualSystem_Session138.js**
- Scale-based positioning effects pre recovery vizualizáciu

#### 2.7 Environmental Effects

**ColonyVFXManager.js**
- Halo positioning: `halo.position.copy(center)`
- Ring positioning: `ring.position.copy(center)` s alternating orientation
- Crown positioning: `crown.position.copy(center)` s y-offset
- Burst/Collapse positioning: Center-based expansion/collapse

**EnvironmentalHazards.js**
- Aura positioning: `auraMesh.position.copy(position)`
- Field positioning: `mesh.position.copy(position)`
- Particle spiral: 
  - `particle.position.x = Math.cos(particle.angle) * distance`
  - `particle.position.y = Math.sin(particle.angle) * distance * 0.5`
  - `particle.position.z = Math.cos(particle.angle + particle.speed) * distance * 0.5`

#### 2.8 Node Hierarchy Visuals

**NodeHierarchyVisualFeedback_v1.js**
- Mesh positioning: `mesh.position.copy(node.position)`
- Effect positioning kopíruje node position

**NodeLinkingSystem.js**
- Halo positioning: `auraMesh.position.copy(node.position)`
- Highlight positioning: `highlight.position.copy(node.position)`
- Multi-select glow positioning

**NodeLinkedAuraSystem.js**
- Aura positioning kopíruje node position
- Scale-pulse effects sú v skutočnosti scale modifications, nie position

#### 2.9 Glyph Systems

**MegaGlyphSystem.js**
- Mesh positioning: Scale-based, nie explicit position modification
- Fold positioning: Fold elements sú relatívne ku kontajneru

**GlyphAnimationModulator.js**
- Mesh positioning: Scale-based modifikácie
- Resonance scale effects: `resonanceScale = 1.0 + resonanceStrength * 0.01`

#### 2.10 Node Geometry Creation

**CanonicalGeometryFamilies_v1.js**
- Extensive positioning pri geometry creation:
  - `base.position.y = -0.28`, `spine.position.y = 0.2`
  - `shard.position.set(x, y, z)` pre random positioning
  - `keystone.position.y = 0.75`
  - Všetky archetypy majú hardcoded pozície pre sub-meshes

**AINodes.js**
- Node positioning: `nodeModel.position.copy(position)`
- Light positioning: `light.position.set(0, 0, 0)` relatívne k nodu
- Particle orbital positioning:
  - `particle.position.x = Math.cos(pData.orbitAngle) * radius`
  - `particle.position.z = Math.sin(pData.orbitAngle) * radius`
  - `particle.position.y = Math.sin(pData.orbitAngle * 0.7) * 0.35`

**AINodeModel.js**
- Panel positioning: `panel.position.x = Math.cos(angle) * 0.7`, `panel.position.z = Math.sin(angle) * 0.7`
- Corner positioning: `corner.position.set(pos[0], pos[1], pos[2])`
- Plate positioning: `plate.position.x = Math.cos(angle) * 1.4`, `plate.position.y = Math.sin(angle * 2) * 0.3`

---

### Kategória 3: Modifikácie Veľkosti (Scale) Nodov

#### 3.1 Breathing/Pulse Effects

**NodePersonalitySystem2_0.js**
- Modifikuje: `node.scale.setScalar(breathScale * 0.9)`
- Breath amplitude: `0.02 * intensity`
- Pulse amplitude: `0.04 * intensity`
- Rôzne personalities používajú rozdielne frekvencie a amplitúdy
- Všetky personalities používajú base scale 0.9

**NodePersonality2_0.js**
- Modifikuje: `node.scale.copy(originals.originalScale)` pre reset
- Breath scale: `breathScale = 1.0 + Math.sin(state.breathPhase) * 0.02 * intensity`

**AIConsciousnessLayer.js**
- Pulse scaling: `pulse.mesh.scale.setScalar(scale)`
- Global field scaling: `this.globalFieldMesh.scale.setScalar(targetScale)`
- Target scale: `1 + avgStability * pulse * 0.3`
- Scale variation: `scaleVariation = 1 + Math.sin(packet.glow * 0.5) * 0.15`

**AnimatedLinkFlow.js**
- Packet scaling: `packet.mesh.scale.setScalar(scaleVariation * (0.8 + flowState.synergy * 0.4))`
- Synergy factor: 0.4 bonus na scale

#### 3.2 Node Scale Authority Systems

**NodeShellSizeAuthority.js**
- Modifikuje: `aura.mesh.scale.setScalar(shellSize)`
- Udržiava static size pre shell
- Vplyv: Force static size, zabraňuje nekontrolovaným scale changes

**AINodes.js**
- Spawn scale: `nodeModel.scale.setScalar(spawnNodeScale)`
- Materialization animation: `node.scale.copy(stableRootScale)` s ease progress
- Breathing: `node.scale.setScalar(breathe)` pri stabilization
- Edge inflation: `edgeLines.scale.setScalar(edgeInflation)`

**NodeStateMachine_v1.js**
- Scale na spawn: `node.scale.setScalar(absoluteScale)`
- Spawn animation: `scale = 0.1 + t * 0.9`
- Reset scale: `node.scale.setScalar(node.userData.baseScale)`
- Personality override scale

#### 3.3 Archetypové Scale Effects

**ArchetypeVisualDifferentiationSystem_v1.js**
- Modifikuje: `overlayData.glowMesh.scale.set(scaleVal, scaleVal, scaleVal)`
- Glow scale based na archetype intensity

**ArchetypeVisualTransitionEngine_v2.js**
- Modifikuje: `node.userData.vfxGlow.scale.copy(originalScale)`
- Reset scale po transition

#### 3.4 Harmonic Scale Effects

**HarmonicResonanceCoupling_v1.js**
- Modifikuje: `coreNode.scale.setScalar(absoluteScale)`
- Resonance-based scale modulation

**HarmonicNodeResonanceHalos.js**
- Modifikuje: `haloData.haloMesh.scale.set(baseScale.x * finalScaleFactor, baseScale.y * finalScaleFactor, baseScale.z * finalScaleFactor)`
- Base scale copy: `haloData.haloMesh.scale.copy(baseScale)`
- Pulse scale: `mesh.scale.setScalar(pulse)` kde `pulse = 1.0 + Math.sin(bead.age * 8.0) * 0.15`

**HarmonicInfluencePropagationSystem_Session127.js**
- Modifikuje: `mesh.scale.setScalar(baseRadius)`
- Field radius-based scaling

**HarmonicHubAuraSystem_Session126.js**
- Marker scaling: `marker.scale.setScalar(Math.max(0.75, hub.fieldRadius * 0.22))`

**HarmonicRecoveryVisualSystem_Session138.js**
- Wave expansion: `scale = 2.0 + Math.sin(progress * Math.PI) * 0.5`
- Healing scale effects

#### 3.5 Aura Scale Systems

**NodeLinkedAuraSystem.js**
- Modifikuje: `auraData.mesh.scale.setScalar(this.visualParams.baseScale * node.scale.x * scalePulse)`
- Scale pulse: `scalePulse = 1.0 + Math.sin(this.globalTime * 1.5) * 0.08`
- Link strength modulation: `auraData.mesh.rotation.y += deltaTime * 0.5 * linkStrength`

**NodeAuraRefactor_ElegantRim.js**
- Modifikuje: `aura.mesh.scale.set(coreSc * this.rimWidthScale, coreSc * this.rimWidthScale, coreSc * this.rimWidthScale)`
- Core scale tracking: `coreSc = aura.node.scale.x || 1.0`

**NodeLinkingSystem.js**
- Aura scaling: `auraMesh.scale.copy(node.scale)`
- Highlight scaling: `highlight.scale.copy(node.scale)` s multi-select expansion
- Portal pulse: `portalCore.scale.setScalar(0.96 + flashPulse * 0.08)`
- Ring expansion: `ring.scale.setScalar(portalPulse + flashPulse * 0.06 + index * 0.01)`

**LinkBeadSystem.js**
- Breathing scale: `mesh.scale.set(breathe, breathe, breathe)` kde `breathe = 1 + Math.sin(seconds * 0.2 + phaseOffset) * 0.02`
- Pulse scale: `mesh.scale.setScalar(pulse)` kde `pulse = 1.0 + Math.sin(bead.age * 8.0) * 0.15`

**InputSensoryAnimationPatch.js**
- Breathing scale: `mesh.scale.set(breathe, breathe, breathe)`
- Breath amplitude: `0.015 * intensity`
- Node breath scale: `node.scale.set(breathScale, breathScale, breathScale)`

#### 3.6 Link Scale Effects

**LinkRendererConduit.js**
- Halo scaling: `haloOuter.scale.set(1.0, 0.88, 1.0)`, `haloInner.scale.set(1.0, 0.82, 1.0)`
- Field pulse: `fieldRoot.scale.setScalar(pulse)` kde `pulse = 1.0 + Math.sin(time * 2.6) * 0.06 + flowBoost * 0.025`
- Trail scaling: `trail.scale.set(1.35, 1.35, 0.45)`
- Spawn scale: `group.scale.setScalar(0.01 * jitterScale)` pre fade-in

**LinkTrailParticleSystem.js**
- Combined scale: `combinedScale = this.scale * this.thicknessModulation * this.trailVisibility`
- Scale modulation: `this.mesh.scale.setScalar(combinedScale)`
- Hidden state: `this.mesh.scale.setScalar(0)`

**LinkPulseRing.js**
- Ribbon scaling: `this.ribbonMesh.scale.set(0.9, 0.9, 0.9)`
- Pulse base scale: `this.mesh.scale.set(baseScale * 1.1, baseScale, baseScale * 1.1)`
- Compression scaling: `trail.scale.set(dynamicScale * scaleSide, dynamicScale * compression, dynamicScale * scaleSide)`
- Ribbon modulation: `this.ribbonMesh.scale.set(ribbonScale, ribbonScale, ribbonScale)`

**LinkEnergyRingSystem.js**
- Ring scaling: `mesh.scale.setScalar(currentScale)` pre expansion/collapse
- Ring size: `instance.mesh.scale.set(instance.radius, length, instance.radius)`

**LinkSemanticPictogramSystem.js**
- Base scale: `this.mesh.scale.setScalar(size)`
- Enhanced scaling: `this.mesh.scale.setScalar(size * VISIBILITY_SCALE * CONFIG.ORBITAL_SCALE_FACTOR)`
- Cluster pulse: `cluster.scale.setScalar(s)` kde `s = cluster.userData.baseScale * pulse * (1 + synergyBoost * 0.5)`
- Spark pulse: `spark.scale.setScalar(pulse)` kde `pulse = 1 + Math.sin(this.age * 4) * 0.15`

#### 3.7 Particle System Scaling

**ColonyVFXManager.js**
- Halo flattening: `halo.scale.z = 0.3`
- Child pulse: `child.scale.setScalar(pulse)` kde `pulse = Math.sin(time * 2) * 0.15 + 1`
- Scale modifier: `child.scale.setScalar(scaleModifier)` kde `scaleModifier = 0.9 + Math.sin(userData.pulsePhase) * 0.2`
- Burst start: `burst.scale.setScalar(0.1)`
- Expansion: `child.scale.setScalar(0.1 + progress * userData.expandSpeed)`
- Collapse: `child.scale.setScalar(1.0 - progress * userData.collapseSpeed)`

**CascadeParticleSystem_Session120.js**
- Marker scaling: `marker.scale.setScalar(Math.max(0.25, this.config.baseSize * 0.001))`

**HealingParticleSystem_Session136.js**
- Particle scaling pre healing effects

**LinkHealingParticleSystem.js**
- Ring scaling pre healing vizualizácie

**LinkCorruptionParticleSystem.js**
- Particle scaling pre corruption spread

**LinkMicroImpulseAdapter_v1.js**
- Scale: `visual.scale.setScalar(scale)` pre impulse vizualizáciu

**LinkMicroImpulseAdapter.js**
- Progressive scaling: `currentScale = data.baseScale + (data.maxScale - data.baseScale) * easeProgress`

**LinkRingArcDischarges.js**
- Ring expansion: `r.mesh.scale.setScalar(scale)` kde `scale` interpolates
- Pulse scaling: `pulse.scale.setScalar(1 + progress * 0.3)`

#### 3.8 Mega Glyph Scaling

**MegaGlyphSystem.js**
- Mesh scaling: `mesh.scale.setScalar(glyph.scale * 0.3)`
- Breathing: `mesh.scale.setScalar(mesh.userData.glyphData.scale * 0.3 * breathScale)` kde `breathScale = 1.0 + Math.sin(phase) * this.messagingConfig.glyphBreathingAmplitude`
- Signal scaling: `signal.group.scale.setScalar(baseSize + drift * alpha)`
- Fold scaling: `fold.scale.setScalar(0.85 + alpha * 0.15)`
- Core pulse: `core.scale.setScalar(pulseAmount)`

**GlyphAnimationModulator.js**
- Applied scale: `mesh.scale.set(this.appliedScale, this.appliedScale, this.appliedScale)`
- Resonance scale: `resonanceScale = 1.0 + resonanceStrength * 0.01` (±1% modulation)

#### 3.9 Enhanced Node Model Scaling

**EnhancedNodeModels.js**
- Extensive scale manipulation pri geometry creation:
  - `vortexMesh.scale.set(1 + seed * 0.3, ...)`
  - `echoKnot.scale.copy(vortexMesh.scale).multiplyScalar(1.05)`
  - `plate.scale.setScalar(0.8 + rng() * 0.4)`
  - `cageEdges.scale.set(1.08, 1.0, 0.9)`
  - `frame.scale.set(1.15, 0.75, 1)`
  - `core.scale.set(1.0, 1.1, 1.0)`
  - Disk scaling: `disk.scale.setScalar(1.15)`
  - Echo scaling: `echo.scale.setScalar(1.04)`
  - Shard scaling: `shard.scale.set(0.9 + rng() * 0.5, 1.2 + rng() * 0.4, 0.8 + rng() * 0.3)`
  - Memory shell: `memoryShell.scale.setScalar(1.15)`
  - Inner core: `innerCore.scale.setScalar(0.6)`
  - Breathing: `group.scale.setScalar(base * breath)` kde `breath = 1 + Math.sin(t * 0.85) * 0.02`
  - Dais/Pyramid: `slab.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2])`
  - Control core: `core.scale.set(1.12, 1.34, 0.92)`
  - Inner kernel: `innerKernel.scale.set(0.88, 1.2, 0.82)`
  - Sigil: `sigil.scale.set(0.8 + rng() * 0.45, 1.3 + rng() * 0.25, 0.8 + rng() * 0.35)`
  - Authority core: `core.scale.setScalar(1.05)`
  - Command cage: `cage.scale.setScalar(1.1)`
  - Energy barrier: `barrier.scale.setScalar(1.05)`
  - Primary/Secondary scaling: `primary.scale.set(1.0, 0.95, 1.08)`
  - Ghost scaling: `ghostA.scale.setScalar(1.03)`, `ghostB.scale.setScalar(0.98)`, `ghostC.scale.set(1.06, 1.0, 1.08)`
  - Sigma inner core: `innerCore.scale.set(0.82, 0.56, 0.94)`
  - Sigma cage: `cage.scale.set(1.2, 1.05, 1.16)`
  - Mythic shells: `shell1.scale.setScalar(1.10)`, `shell2.scale.setScalar(1.18)`
  - Prime shells: `shell1.scale.setScalar(1.08)`, `shell2.scale.setScalar(1.14)`
  - Prime root: `primeRoot.scale.setScalar(0.75)`
  - Impossible core: `core.scale.set(1.0, 0.85, 1.1)`
  - Ring scaling: `ring.scale.set(1.05, 0.92, 1.0)`
  - Cage scaling: `cage.scale.set(1.2, 1.05, 1.15)`
  - Inner void: `innerVoid.scale.setScalar(0.3)`
  - Intersecting cores: `coreB.scale.set(0.88, 1.02, 0.82)`
  - Folded impossible: `core.scale.set(1.12, 0.62, 1.02)`
  - Corrupted manifold: `core.scale.set(0.92, 1.08, 0.86)`
  - Blood: `blood.scale.set(1.18, 0.72, 1.36)`
  - Anti-solid: `antiSolid.scale.set(0.96, 1.24, 0.78)`
  - Singularity: `singularity.scale.set(1.0, 0.72, 1.35)`
  - Anti-core: `antiCore.scale.set(1.06, 0.84, 1.2)`
  - Amputation idol: `core.scale.set(1.08, 0.76, 1.22)`
  - Seam: `seam.scale.set(1.0, 0.66, 1.28)`
  - Cavity: `cavity.scale.set(0.84, 1.22, 0.72)`
  - Apostate manifold: `manifold.scale.set(1.06, 0.9, 1.2)`
  - Parasite: `parasite.scale.set(0.9 + i * 0.08, 0.74 + i * 0.06, 1.02 - i * 0.04)`
  - Distorted core: `core.scale.set(1.0, 0.82, 1.15)`
  - Emotion shells: `shellA.scale.setScalar(1.25)`, `shellB.scale.setScalar(1.4)`
  - Control V2 breathing: `spire.scale.y = base * (1 + Math.sin(time * speed) * amp)`

**EnhancedNodeModelLinkState.js**
- Reset scale: `mut.scale.set(original.scaleX, original.scaleY, original.scaleZ)`
- Base scale tracking

#### 3.10 VFX Scaling

**EnergyOrb.js**
- Collapse scaling: `this.mesh.scale.setScalar(1 - progress * 0.9)`
- Aura scaling: `auraMesh.scale.set(1.5, 1.5, 1.5)`

**FractalValley.js**
- Mountain breathing: `mountain.scale.y = 1 + breath`

**SynergyCascadeVisualizer.js**
- Ring scaling: `ring.scale.set(1 + Math.sin(progress * Math.PI) * 0.5)`
- Pulse scaling: `pulse.scale.setScalar(scale)`

**NeonLinkVisuals.js**
- Stretch effect: `child.scale.y = 1.3`
- Particle scaling: `mesh.scale.setScalar(glyph.scale * 0.3)`

**LEGACY/_ExtremeLinkVisualPack3.js**
- Visual layer scaling: `visualData.layers.core.scale.set(breatheScale, 1, breatheScale)`
- Glow scaling: `visualData.layers.glow.scale.set(breatheScale * 1.1, 1, breatheScale * 1.1)`
- Bloom scaling: `visualData.layers.bloom.scale.set(breatheScale * 1.2, 1, breatheScale * 1.2)`

**LEGACY/aura/AuraModulationSystem.js**
- Scale copying: `aura.scale.copy(baseline.scale).multiplyScalar(targetScale)`

**LinkDebugMode_v1.js**
- Label scaling: `sprite.scale.set(2, 0.5, 1)`

**NodeHierarchyVisualFeedback_v1.js**
- Scale reset: `effect.nodeMesh.scale.copy(effect.originalScale)`

---

## Kľúčové Poznatky

### 1. Shader Modification Architecture

**Primárna metóda:** `material.onBeforeCompile()`
- Väčšina shader modifications používa tento Three.js callback
- Patches sú aplikované na `vertexShader` a `fragmentShader`
- Uniforms sú injectované cez string replacement

**Patterny:**
1. Store original `onBeforeCompile` hook
2. Inject new shader code
3. Call original hook ak existuje
4. Inject uniforms do shader object

**Dôležité systémy:**
- Archetype shaders (4+ varianty)
- Wave shaders (3+ varianty)
- Personality shaders (6+ varianty)
- Link shaders (5+ varianty)

### 2. Position Modification Patterns

**Explicit position changes:**
1. **Stress jitter** - `CanonicalTemplate3_StressVisuals.js`
2. **Orbital positioning** - Particle systems, glyph systems
3. **Path following** - `AnimatedLinkFlow.js`, cascade particles
4. **Environmental** - `ColonyVFXManager.js`, `EnvironmentalHazards.js`

**Position restoration:**
- Väčšina systémov uchováva `originalPosition` v `userData`
- Cleanup resetuje position na original

**Position vs Scale:**
- Väčšina "pulzovacích" efektov sú scale-based, nie position-based
- Position changes sú obvykle pre: movement, jitter, orbital motion

### 3. Scale Modification Hierarchy

**Autorita scale:**
1. `NodeShellSizeAuthority.js` - Force static shell size
2. `NodeStateMachine_v1.js` - Personality-based scale control
3. `NodePersonalitySystem2_0.js` - Breathing/pulse modulation
4. Individual effect systems

**Base scale tracking:**
- `node.userData.baseScale` - Často používané
- `node.userData.originalScale` - Pre backup/restore
- `effect.originalScale` - Pre local reset

**Scale operation types:**
1. **Breathing** - Sinusoidal modulation (0.02-0.04 amplitude)
2. **Pulse** - Quick scale spikes (0.15-0.30 amplitude)
3. **Reaction** - Scale na events (spawn, death, corruption)
4. **Static** - Geometry creation scale (EnhancedNodeModels)
5. **Relative** - Child scale relative k parent

### 4. Cross-Subsystem Dependencies

**Shader → Scale:**
- Niektoré shadrové efekty spúšťajú scale changes
- Resonance shaders často modulujú scale

**Metrics → Visual:**
- `loadPressure` → stress jitter
- `corruption` → position reset, scale changes
- `synergy` → link scale modulation
- `stability` → pulse amplitude

**Node → Aura:**
- Aura scale sleduje node scale
- Aura position kopíruje node position
- Aura opacity modulated by node state

### 5. Potential Conflicts

**Scale conflicts:**
- Multiple systems môžu modifikovať rovnaký node scale
- Breathing vs Pulse vs Reaction
- Vyriešené: Priority systems (NodeShellSizeAuthority)

**Shader conflicts:**
- Multiple `onBeforeCompile` hooks môžu byť chained
- Vyriešené: Store original hook, call it first

**Position conflicts:**
- Stress jitter vs Original position restoration
- Vyriešené: Threshold-based (loadPressure > 0.7)

---

## Doporčenia

### Pre vývoj nových efektov:

1. **Respektuj scale authority:**
   - Použi `NodeShellSizeAuthority` pre shell effects
   - Skontroluj `node.userData.baseScale` pred modification

2. **Position modifications:**
   - Vždy ukladaj `originalPosition`
   - Poskytn cleanup/restore mechanism
   - Použi threshold-based activation

3. **Shader patches:**
   - Vždy chain original `onBeforeCompile`
   - Inject uniforms, nahrádzaj celé shadre
   - Použi marker strings pre detection

4. **Uniform naming:**
   - Použi konzistentné prefixes (`uArchetype*`, `uWave*`, etc.)
   - Dodržuj existing naming conventions

### Pre debugging efektov:

1. **Scale issues:**
   - Check: `node.scale.x/y/z`
   - Check: `node.userData.baseScale`
   - Check: `node.userData.originalScale`

2. **Position issues:**
   - Check: `node.userData.originalPosition`
   - Check: Stress jitter threshold
   - Check: Particle path offset

3. **Shader issues:**
   - Check: `material.onBeforeCompile` chain
   - Check: Uniform existence
   - Check: Shader injection markers

---

## Zoznam Súborov s Modification Activities

### Shader Uniforms (15+ files)
- ArchetypeShaderModes_v1.js
- ArchetypeNeuralLinkVis_v1.js
- ArchetypeColorPaletteSystem_v1.js
- ArchetypeAuraEnhancement_v1.js
- WaveShaderMaterialPatch_v1.js
- WaveDynamicsShaderPack_v1.js
- WaveTravelShaderPack_v1.js
- PersonalityShaderEffects_Pack_v1.js
- PersonalityShaderAdvancedFX_v1.js
- PersonalityShaderStabilizedFX_v1.js
- LinkRendererConduit.js
- SynergyResonanceShaderPack_v1.js
- SynergyBonusFXLayer_v1.js
- SynergyTravelingWaveFX_v1.js
- _ExtremeAIShaderPack.js
- _SafeWorldFXPack.js

### Position Modifications (20+ files)
- CanonicalTemplate3_StressVisuals.js
- CorruptionVisualFX_v1.js
- AIConsciousnessLayer.js
- CascadeParticleSystem_Session120.js
- AnimatedLinkFlow.js
- CompositeGlyphGenerator.js
- CompositeGlyphResonanceFeedback.js
- EvolutionRegistry.js
- HarmonicInfluencePropagationSystem_Session127.js
- HarmonicNodeResonanceHalos.js
- HarmonicHubAuraSystem_Session126.js
- HarmonicRecoveryVisualSystem_Session138.js
- ColonyVFXManager.js
- EnvironmentalHazards.js
- NodeHierarchyVisualFeedback_v1.js
- NodeLinkingSystem.js
- MegaGlyphSystem.js
- CanonicalGeometryFamilies_v1.js
- AINodes.js
- AINodeModel.js

### Scale Modifications (30+ files)
- NodePersonalitySystem2_0.js
- NodePersonality2_0.js
- AIConsciousnessLayer.js
- AnimatedLinkFlow.js
- NodeShellSizeAuthority.js
- AINodes.js
- NodeStateMachine_v1.js
- ArchetypeVisualDifferentiationSystem_v1.js
- ArchetypeVisualTransitionEngine_v2.js
- HarmonicResonanceCoupling_v1.js
- HarmonicNodeResonanceHalos.js
- HarmonicInfluencePropagationSystem_Session127.js
- HarmonicHubAuraSystem_Session126.js
- HarmonicRecoveryVisualSystem_Session138.js
- NodeLinkedAuraSystem.js
- NodeAuraRefactor_ElegantRim.js
- NodeLinkingSystem.js
- LinkBeadSystem.js
- InputSensoryAnimationPatch.js
- LinkRendererConduit.js
- LinkTrailParticleSystem.js
- LinkPulseRing.js
- LinkEnergyRingSystem.js
- LinkSemanticPictogramSystem.js
- ColonyVFXManager.js
- CascadeParticleSystem_Session120.js
- HealingParticleSystem_Session136.js
- LinkHealingParticleSystem.js
- LinkCorruptionParticleSystem.js
- LinkMicroImpulseAdapter_v1.js
- LinkMicroImpulseAdapter.js
- LinkRingArcDischarges.js
- MegaGlyphSystem.js
- GlyphAnimationModulator.js
- EnhancedNodeModels.js
- EnhancedNodeModelLinkState.js
- EnergyOrb.js
- FractalValley.js
- SynergyCascadeVisualizer.js
- NeonLinkVisuals.js
- LEGACY/_ExtremeLinkVisualPack3.js
- LEGACY/aura/AuraModulationSystem.js
- LinkDebugMode_v1.js
- NodeHierarchyVisualFeedback_v1.js

---

**Audit Completed:** 2026-03-27
**Total Files Analyzed:** 50+ effect systems
**Total Uniforms Identified:** 100+
**Position Modifications:** 20+ systems
**Scale Modifications:** 30+ systems