Spravím to priamo ako čistý rozpad na tri skupiny, aby si videl, čo je duplicitné, čo sa má presunúť do conduit a čo má zostať ako samostatná FX vrstva.Zmazať

NeonLinkVisuals.js:904 a NeonLinkVisuals.js:1718, ak chceš mať jediného ownera link geometry v LinkRendererConduit.js:2528.
NeonLinkVisuals.js:419, ak sa má shader/material pipeline spravovať len v conduit layeri.
NeonLinkVisuals.js:1164 a NeonLinkVisuals.js:1072, ak chceš particle ownership presunúť do conduit.
NeonLinkVisuals.js:1914 a NeonLinkVisuals.js:755, ak už metrics-driven vizuály rieši conduit update path.
NeonLinkVisuals.js:1471, ak priority vizuály preberie conduit alebo link mood systém.
Presunúť do conduit

Vizuálne vytváranie linku a preview path z NeonLinkVisuals.js:904 a NeonLinkVisuals.js:1718 presunúť do LinkRendererConduit.js:2528.
Shared link shader/material konfiguráciu z NeonLinkVisuals.js:419 presunúť do conduit material setupu.
Metrics-driven farebné a degradované stavy z NeonLinkVisuals.js:1914 a NeonLinkVisuals.js:755 presunúť do conduit, lebo tam už žije canonical link state.
Particle/trail ownership z NeonLinkVisuals.js:1164 a NeonLinkVisuals.js:1072 presunúť do conduit, ak chceš eliminovať dvojité emitery.
Priority state application z NeonLinkVisuals.js:1471 presunúť do conduit, ak priority má byť iba jedna autorita.
Určite nechať

NeonLinkVisuals.js:695, lebo je to užitočná FX vrstva, ktorá len dolaďuje vizuálne uniformy bez vlastníctva geometrie.
NeonLinkVisuals.js:860, lebo je to dobrý fallback/debug path.
NeonLinkVisuals.js:1774, NeonLinkVisuals.js:1783 a NeonLinkVisuals.js:1797, ak chceš mať samostatnú overlay/state map vrstvu nad linkmi.
NeonLinkVisuals.js:1515, NeonLinkVisuals.js:1553, NeonLinkVisuals.js:1607, NeonLinkVisuals.js:1623, NeonLinkVisuals.js:1635 a NeonLinkVisuals.js:1683, lebo to sú špecifické feedback efekty, ktoré conduit nemusí nahrádzať.
NeonLinkVisuals.js:683, ak chceš, aby Neon ostal samostatná FX vrstva napojená na link mood/metric bus, nie len čistý renderer.