🧩 TODO: CLEAN CASCADE ACTIVATION (minimal, stabilné)
1️⃣ SOURCE OF TRUTH (cascadeIntensity)

👉 vytvor 1 jediný zdroj

 Pridať cascadeIntensity do LinkQualityCalculator (alebo Metrics bridge)

 Výpočet:

intensity = 1 - (quality.score / 100)
 clamp 0–1

 zapisovať:

link.userData.cascadeIntensity
link.userData.cascadeConflictType
link.userData.cascadeParticleColor

🎯 cieľ: každý link má vždy definovanú intensity

2️⃣ SCHEDULER HOOK (10Hz → 30Hz bridge)
 Uistiť sa že:
LinkQualityCalculator beží v simulation (10Hz)
 CascadeParticleSystem beží v visual (30Hz)

🎯 pipeline:

metrics (10Hz) → intensity → particles (30Hz)
3️⃣ EVENT EMITTER (cascade.hop)

👉 pridaj JEDNODUCHÝ emitter (žiadna filozofia)

 v LinkQualityCalculator alebo malý bridge:
if (intensity > 0.6 && prev < 0.6)
→ emit cascade.triggered

if (intensity > 0.3)
→ emit cascade.hop

payload minimal:

{ linkId, fromId, toId, intensity }

🎯 cieľ: rozbehnúť event-driven systémy

4️⃣ CASCADE PARTICLES (hlavný vizuál)
 Over:
cascadeIntensity > 0.1
system enabled
 Odstrániť všetky guardy čo blokujú spawn

 fallback:

if (!intensity) intensity = 0

🎯 cieľ: viditeľné častice okamžite

5️⃣ ENABLE RUPTURE (len ak chceš dramatiku)

 zapnúť:

game.cascadingRuptures.enable()
 alebo default enable v konštruktore

🎯 cieľ: reálny cascade propagation engine

6️⃣ EVENT BUS REBIND FIX

 všetky systémy čo robia:

semanticBus.on(...)

→ musia mať:

init()
dispose()
rebind pri world switch

🎯 cieľ: žiadne “po reloade nič nefunguje”

7️⃣ API ALIGNMENT (Conduit vs legacy)

 nahradiť:

link.material

za:

link.group / conduit materials

🎯 cieľ: shader systémy prestanú byť silent

8️⃣ KILL DEAD SYSTEMS (cleanup)

DOČASNE vypnúť:

 CascadeResonanceWaveVisualization (ghost)
 ResonanceCascadeVisualization
 všetky “computation-only” veci

🎯 cieľ: menej šumu, jasný výsledok

9️⃣ DEBUG CHECK (1 min test)
window.game.linkingSystem.links
  .filter(l => l.userData.cascadeIntensity > 0.2)
window.game.cascadeParticleSystem.activeCount

👉 musí byť > 0

🔥 RESULT (čo máš vidieť)
okamžite:
častice na linkoch
flow direction
farby podľa konfliktu
po zapnutí rupture:
cascade skáče medzi node-ami
dramatické propagation
🧠 GOLD RULE (zapamätaj si)

👉 najprv intensity → potom event → potom vizuál

nie opačne.