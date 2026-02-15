🌍 worldRoot Plan

(Constitution Phase: Scene Ownership)

Cieľ:
Zaviesť jasnú, nemennú scénovú hierarchiu s pevnou autoritou a nulovým miešaním ownership.

Toto je plán, nie implementácia nodov.

1️⃣ Canonical Scene Hierarchy

Finálny cieľový stav:

scene
├── coreRoot            (engine-level, nikdy sa neresetuje)
│   ├── player
│   ├── lights
│   └── camera helpers
│
├── worldRoot           (100% resetované pri switchi)
│   └── world environment objects
│
├── nodesRoot           (mimo scope tohto chatu)
│
├── linksRoot           (mimo scope)
│
├── vfxRoot             (global VFX)
│
├── uiRoot              (HUD / overlay)
│
└── debugRoot           (debug only)

2️⃣ Ownership Rules (Hard)
worldRoot vlastní:

podlahy

steny

prostredie

dekorácie

environment particles

skyboxes

terrain

map-specific lights (ak existujú)

worldRoot NESMIE vlastniť:

nodes

links

raycast proxies

UI

debug helpers

global lights

player

3️⃣ Switch Behaviour Matrix
Root	Pri WorldSwitch
coreRoot	nikdy sa nemaže
worldRoot	vždy sa remove + dispose
nodesRoot	rieši nodes lifecycle
linksRoot	rieši links lifecycle
vfxRoot	môže byť globálny alebo world-scoped
uiRoot	nikdy sa nemaže
debugRoot	podľa configu
4️⃣ worldRoot Contract

Každý world module musí:

V konštruktore:

dostať worldRoot injektované

nikdy nepoužiť scene.add()

Povolené:
this.worldRoot.add(mesh)

Zakázané:
this.scene.add(mesh)

5️⃣ Teardown Model (deterministický)

Teardown worldRoot:

scene.remove(worldRoot)

worldRoot.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) disposeMaterial(obj.material)
})


Hotovo.

Žiadne filterovanie scény.
Žiadne hľadanie podľa typu.
Žiadne heuristiky.

6️⃣ Transition Safety

Počas SWITCHING:

worldRoot existuje len 0 alebo 1 krát

nikdy 2 súčasne

nikdy polovičný teardown

Invariant:

scene.children.filter(c => c.name === 'ATOMA_WorldRoot').length === 1

7️⃣ Naming Convention (Dôležité)
worldRoot.name = "ATOMA_WorldRoot"
nodesRoot.name = "ATOMA_NodesRoot"
linksRoot.name = "ATOMA_LinksRoot"
vfxRoot.name = "ATOMA_VFXRoot"


Prečo?

debug inspect

runtime sanity checks

audit jednoduchší

8️⃣ Migration Strategy (bez chaosu)

Nezačíname veľkým refactorom.

Step 1:

vytvoriť worldRoot

presmerovať World.js na worldRoot.add()

Step 2:

presmerovať ostatné world triedy

Step 3:

nahradiť brute force filter teardown za remove(worldRoot)

Step 4:

pridať disposal

9️⃣ Najdôležitejšia vec

Root architektúra rieši 4 veci naraz:

✔ deterministický teardown
✔ memory leak
✔ isolation boundary
✔ jednoduchší debugging

A to všetko bez zásahu do nodov.