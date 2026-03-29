# Aura Root TODO

## Ciel

Odpojit tieto aura systemy zo vsetkych suborov, kde sa importuju alebo inicializuju, vymazat stopy a presunut ich do LEGACY/aura. Ak sa kdekolvek nachadzaju importy, odstranit ich. V ziadnom pripade neprepisovat na novy path.

## Aktivne

- [ ] CorruptionDrivenAuraDesaturationSystem.js - Zapojeny priamo v main.js; tlmi aura vizualy podla corruption stavu.
- [ ] ArchetypeAuraEnhancement_v1.js - Zapojeny priamo v main.js; zosilnuje node/link aury podla archetypovych pravidiel.
- [ ] HarmonicHubAuraSystem_Session126.js - Zapojeny priamo v main.js; riadi harmonicke hub aura polia.
- [ ] NodeLinkedAuraSystem.js - Zapojeny priamo v main.js; generuje live node-linked aury okolo uzlov.

## Nepriame aktivne

- [ ] FresnelRimLightAuraShader.js - Zapojeny nepriamo cez NodeLinkedAuraSystem.js; dodava Fresnel/rim shader pre aura vizualy.
- [ ] FresnelAuraIntegrationPatch.js - Zapojeny nepriamo cez NodeLinkingSystem.js; patchuje linkovanie tak, aby pouzivalo Fresnel aury.
- [ ] FireLikeAuraConfig.js - Zapojeny nepriamo cez shaders/NodeAuraShader.js; drzi parametre pre ohenovity aura styl.
- [ ] HarmonyAuraShaderMaterial.js - Zapojeny nepriamo cez NodeLinkingSystem.js, src/vfx/VFXSystemRegistry.js a VisualTemplateResolver.js; vytvara harmonicke aura materialy.
- [ ] HarmonyAuraController.js - Zapojeny nepriamo cez HarmonyAuraIntegrationGuide.js a VisualTemplateResolver.js; riadi harmoniu jednej aury alebo batchu.
- [ ] LinkedAuraHarmonyBands.js - Zapojeny nepriamo cez NodeLinkedAuraSystem.js; mapuje harmony hodnoty na pasma pre linked aury.
- [ ] SynergyDrivenAuraColorSystem.js - Zapojeny nepriamo cez SynergyAuraColorIntegrationPatch.js; pocita farby aury zo synergy signalov.
- [ ] SynergyAuraColorIntegrationPatch.js - Zapojeny nepriamo cez SynergyAuraColorIntegrationExample.js; prepaja farby aury s node signalmi.

## Legacy / priklady

- [x] AuraModulationIntegration_v1.js - Presunute do LEGACY/aura
- [x] AuraBaselineInvalidationFix.js - Presunute do LEGACY/aura
- [x] AuraRefactorValidationHelper.js - Presunute do LEGACY/aura
- [x] FresnelAuraIntegrationExample.js - Presunute do LEGACY/aura
- [x] HarmonicHubAuraIntegrationPatch_Session126.js - Presunute do LEGACY/aura
- [x] HarmonyAuraIntegrationGuide.js - Presunute do LEGACY/aura
- [x] LINK_AURA_SHADER_VERIFICATION.js - Presunute do LEGACY/aura
- [x] NodeAuraParticleImpactBridge.js - Presunute do LEGACY/aura
- [x] NodeLinkedAuraSystem_Session123.js - Presunute do LEGACY/aura
- [x] NodeLinkedAuraIntegrationPatch_Session123.js - Presunute do LEGACY/aura
- [x] SynergyAuraColorIntegrationExample.js - Presunute do LEGACY/aura
