🌍 worldRoot – Invariants Section

(Constitution Phase: Worlds)

1) Existencia

1.1 Presne jeden worldRoot

V každom čase musí platiť:

buď neexistuje žiadny worldRoot (počas teardown fázy),

alebo existuje presne jeden aktívny worldRoot pripojený k scene.

Invariant:

count(scene.children where name === "ATOMA_WorldRoot") ∈ {0, 1}


Nikdy nie 2.

2) Ownership Boundary

2.1 Všetky world environment objekty musia byť potomkami worldRoot.

Platí:

floor

walls

terrain

environment meshes

world particles

skyboxes

world-specific lights

decorative systems

Invariant:

for each worldEnvironmentObject:
    object.isDescendantOf(worldRoot) === true


2.2 Žiadny world objekt nesmie byť priamo pridaný do scene.

Zakázané:

scene.add(worldMesh)


Povolené:

worldRoot.add(worldMesh)

3) Isolation

3.1 worldRoot nesmie obsahovať:

nodes

links

raycast proxies

UI

debug helpers

global lights

player

Invariant:

for each child of worldRoot:
    child must belong to World domain


3.2 Iné systémy nesmú pridávať objekty do worldRoot.

Ownership je jednosmerné:

WorldManager + world module vytvára

WorldManager teardownuje

Nikto iný.

4) Lifecycle Integrity

4.1 Počas RUNNING:

worldRoot musí byť pripojený k scene

worldRoot nesmie byť null

activeWorld musí existovať

4.2 Počas SWITCHING_TEARDOWN:

worldRoot môže byť odpojený

po teardown musí byť worldRoot === null

4.3 Počas SWITCHING_INIT:

nový worldRoot musí byť vytvorený pred init worldu

init nesmie vytvárať objekty mimo worldRoot

5) Deterministický Teardown

Teardown worldRoot musí byť:

scene.remove(worldRoot)

disposeTree(worldRoot)

worldRoot = null

Zakázané:

scene.children = filter(...)

scene.traverse() ako primárny spôsob hľadania world objektov

selektívne mazanie podľa typu

Invariant:

Po teardown:

žiadny objekt z predchádzajúceho worldu nesmie byť potomkom scene

žiadna geometria alebo materiál worldu nesmie zostať ne-disponovaný

6) Memory Safety

Každý world modul je povinný:

evidovať všetky vytvorené geometrie

evidovať všetky materiály

v dispose() ich uvoľniť

Ak world vytvorí resource,
world ho musí aj zničiť.

Ownership ≠ remove only.

7) Debug Invariants

V debug móde musí byť možné overiť:

assert(scene.getObjectByName("ATOMA_WorldRoot") !== undefined)


Po switche:

assert(previousWorldRoot not in scene graph)

8) No Hidden Side Effects

worldRoot je jediný vstup do scény pre world doménu.

Zakázané:

world modul manipulujúci scene.children

world modul manipulujúci nodesRoot

world modul volajúci iné subsystem setup funkcie

World je izolovaná doména.