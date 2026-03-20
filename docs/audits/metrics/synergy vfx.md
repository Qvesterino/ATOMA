Prehľadal som codebase a vytvoril kompletný zoznam všetkých synergy VFX efektov s ich trigger eventmi a wiring pripojením.

**Hlavné nájdené systémy:**

1. **SynergyVFX1_0.js** - Core VFX engine s burst efekty
2. **SynergyCascadeFXBridge_v1.js** - Bridge pre cascade eventy
3. **SynergyChainReaction_v1.js** - Reťazové reakcie s recursive propagation
4. **SynergyTravelingWaveFX_v1.js** - Cestovateľné vlnové efekty
5. **SynergyHighways1_0.js** + **SynergyHighwayVisuals3D_1_0.js** - 3D vizualizácia highways
6. **SynergyBonusFXLayer_v1.js** - GPU-based synergy flares
7. **SynergyAuraColorIntegrationPatch.js** - Aura color tracking system
8. **SynergyCascadeVisualizer.js** - Cascade vizualizér s event handling

**Key wiring patterns:**
- Event bus: `cascade.start/hop/end` events
- Material registration: `registerMaterial()` pre shader effects
- Link/Node registration: `registerLink()` / `registerNode()` lifecycle
- Console API: `window.game.synergyVFX.triggerBurst()` pre manual testovanie

Všetky systémy sú integrované cez semantic event bus a material registry.