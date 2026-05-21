Tier 1:
1. Memoize activeLinkCount — Find all 14+ places where activeLinkCount is computed, create a shared getter that caches the result per frame.
2. De-duplicate synapticGatingAdapter.updateNodeGates() — Run it once in the first callback and pass the result to the other two.
3. Combine visualSuperpack + cinematicUpgrade — Merge the two scheduler callbacks into one that updates both systems.
4. Pre-compute active node snapshot — Create a _activeNodeSnapshot that's populated once at the top of the visual tick.
Tier 2:
5. CascadeParticleSystem: 3000 → 1500 — Change the config in main.js where it's created.
6. HealingParticleSystem: 5000 → 2500 — Change the config.
7. HarmonicResonanceFeedbackSystem: 8000 → 4000 — Change the maxParticles default in the constructor.
8. Throttle glyph/shader systems to 10Hz — Move some visual callbacks from 30Hz to 10Hz where appropriate.
Let me start reading the relevant sections of main.js to understand the patterns and find exact locations for all changes.
Actually, let me be smarter about this. Let me focus on the ones with the biggest impact first:
1. Particle pool reductions (Cascade 3000→1500, Healing 5000→2500, HarmonicResonance 8000→4000) — these are single-line changes
2. activeLinkCount memoization — needs to be a shared getter
3. synapticGatingAdapter de-duplication
4. visualSuperpack + cinematicUpgrade merge

___________

Performance Audit — Kľúčové čísla
151 aktívnych frame callbackov (88 visual 30Hz + 44 simulation 10Hz + 13 background + 5 realtime + 1 aiNodes). To je extrém.
Top 3 najťažšie systémy:
- 
NodeLinkingSystem/LinkRendererConduit — per-link per-frame, volá 7+ subsystémov
- 
CascadeParticleSystem — 4000 častíc, 3 vnorené slučky
- 
HarmonicResonanceFeedbackSystem — 8000 častíc — najväčší pool v celom projekte
Nájdené redundancie:
- 
activeLinkCount počítaný 14-krát nezávisle — každý callback si robí vlastný filter()
- 
synapticGatingAdapter.updateNodeGates() volaný 3-krát za tick s rovnakými dátami
- 
visualSuperpack + cinematicUpgrade — identický preamble pattern, dva separátne callbacky
Návrh — 3 tier-y podľa bezpečnosti
Tier 1 — Nulové riziko, garantovaný zisk
#	Optimalizácia	Dôvod	Očakávaný gain
1	Memoizovať activeLinkCount	14 nezávislých filter() callov za frame	~0.3-0.5ms
2	De-duplikovať synapticGatingAdapter.updateNodeGates()	3× volanie s rovnakými parametrami	~0.1-0.2ms
3	Spojiť visualSuperpack + cinematicUpgrade	Identický preamble, len rôzne targety	~0.05ms
4	Pre-compute active node snapshot 1× za frame	10+ systémov iteruje aiNodes.nodes nezávisle	~0.2-0.3ms
Tier 2 — Veľmi nízke riziko
#	Optimalizácia	Dôvod
5	CascadeParticleSystem: 3000 → 1500 max	Už konfigurovateľné, LOD limituje aj tak
6	HealingParticleSystem: 5000 → 2500 max	Rovnaká logika
7	HarmonicResonanceFeedbackSystem: 8000 → 4000	Najväčší pool, 4000 stále vyzerá husto
8	Throttlovať glyph/shader systémy na 10Hz	Continuous modulation nepotrebuje 30Hz
Tier 3 — Merateľné, treba testnúť
#	Optimalizácia	Dôvod
9	matrixAutoUpdate = false pre ďalšie statické VFX meshe	Už potvrdené že funguje (MythicRitualController)
10	Early-exit LOD guardy v particle update loopoch	Niektoré systémy iterujú všetky častice aj na diaľku
11	Aktivovať adaptívny scheduling — shouldRun*() gate-y, ktoré sú teraz vždy true	Skipnúť non-critical vizuály pri framerate drop