# Link Shaders Decision Table

Toto je rozhodovací audit pre shader a vizuálne vrstvy na linkoch.

## Základné pravidlo

- `LinkRendererConduit` je runtime owner toho, čo sa na linkoch skutočne renderuje v hre.
- Externé moduly sú shader alebo material layeri, ktoré pridávajú konkrétny vizuálny jazyk, nie gameplay.
- Preto neplatí "jeden shader systém = jeden look". Platí "conduit skladá look z viacerých vrstiev".
- Ak vrstva má vlastný update path alebo per-draw hook a reálne mení material/uniformy, je aktívna.
- Ak je iba initovaná bez update/draw cesty, je kandidát na legacy alebo consolidation.

## Rozhodovacia tabuľka

| Systém | Úloha v runtime | Aktualizačná cesta | Čo ovláda | Stav | Rozhodnutie |
|---|---|---|---|---|---|
| `LinkRendererConduit` | Hlavný orchestrátor link vizuálov | `NodeLinkingSystem.update()` -> `conduit.update()` / `updateAll()` | Kompozícia link looku, bootstrap vrstvy, material routing, cleanup | Aktívny | Ponechať ako jediného runtime ownera kompozície |
| `LinkVisualStateAdapter` | Adaptér pre braided strand vizuály | `LinkRendererConduit.update()` v časti Visual State Adaptation | `emissiveIntensity`, `opacity`, `color`, `uBaseColor`, `pulseRing`, `arcDischarges`, `skinMesh`, energia a korupcia | Aktívny | Ponechať |
| `LinkStateVisualLanguageIntegration` | Canonical skin shader layer | `NodeLinkingSystem.registerLink()` + `updateAnimationTime()` + `updateLinkMetrics()` + `onBeforeRender` material hook | `uNetworkStress`, `uLocalLoad`, `uCorruption`, `uSynergy`, `uHarmony`, `uTime` | Aktívny | Ponechať ako shader language layer; je to samostatný shader authority, nie dead code |
| `WaveTravelShaderPack_v1` | Shader patcher / infra pre travel motion | Registrácia materiálov v `LinkRendererConduit._registerLinkMaterialWithBridge()` + globálny tick v `main.js` | Travel shader injection, motion profiles, UV flow, color gradient, pulse bursts | Aktívny | Ponechať ako infra vrstvu |
| `VisualEchoTrails_v1` | Doplnkový echo overlay shader stack | `main.js` -> `echoTrailsIntegration.updateAllMaterials()` | Echo trail uniformy, synergy gating, reverse echo pri vysokom synergy | Aktívny | Ponechať ako samostatný overlay; kandidát na zjednotenie len ak vizuálne nepridáva hodnotu |

## Čo z toho vyplýva

### 1. Kto vlastní vizuál ako taký

`LinkRendererConduit` je vlastník výsledného vzhľadu linkov v hre.
On rozhoduje, ktoré vrstvy sa na link pripoja, v akom poradí, a kedy sa updateujú alebo čistia.

### 2. Kto vlastní shader jazyk

Shader jazyk nevlastní jeden monolit.
Vlastní ho kombinácia špecializovaných vrstiev:

- `LinkStateVisualLanguageIntegration` pre canonical link skin
- `WaveTravelShaderPack_v1` pre travel-motion shader patching
- `VisualEchoTrails_v1` pre echo overlay
- `LinkVisualStateAdapter` pre material-level adaptáciu stranov, ringov a flow prvkov

### 3. Kde je skutočný zdroj chaosu

Chaos nie je v tom, že máme veľa shaderov.
Chaos je v tom, že tie vrstvy sú roztrúsené medzi:

- conduit runtime
- NodeLinkingSystem callbacks
- main scheduler
- material patcher infra

To znamená, že look je skladaný správne, ale ownership je rozdelený tak, že sa ťažko číta.

## Odporúčanie bez bezhlavého mazania

### Ponechať

- `LinkRendererConduit` ako jediný runtime orchestrátor link vizuálov
- `LinkVisualStateAdapter` ako adaptér pre braid/flow look
- `LinkStateVisualLanguageIntegration` ako canonical skin shader layer
- `WaveTravelShaderPack_v1` ako infra patcher
- `VisualEchoTrails_v1` ako voliteľný overlay

### Zjednotiť neskôr, ak bude treba

- shader registráciu a hooky presunúť čo najviac pod `LinkRendererConduit`
- zredukovať duplicity medzi `main.js` a conduit-level update cestami
- vyčistiť naming tak, aby bolo jasné:
  - orchestrátor
  - shader language layer
  - infra patcher
  - overlay effect

### Presun do `LEGACY` iba ak sa potvrdí jedno z toho

- vrstva nemá reálny update path
- vrstva nemá viditeľný prínos oproti inej vrstve
- vrstva duplikuje rovnaký efekt bez jasnej vyššej kvality
- vrstva je už nahradená silnejšou canonical cestou

## Praktický záver

Ak chceš mať poriadok, nesnaž sa teraz zredukovať počet shaderov nasilu.
Najprv si ujasni ownership:

1. `LinkRendererConduit` skladá výsledný look.
2. Externé moduly definujú konkrétne vizuálne jazyky.
3. Legacy kandidáti sa mažú až vtedy, keď sa preukáže nulová alebo duplicitná hodnota.

Takto sa dá systém vyčistiť bez zničenia vizuálnej kvality.
