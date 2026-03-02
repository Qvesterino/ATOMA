🧭 SPAWN 2.0 – Stabilizačno-evolučný plán

Spawn je teraz:

centralizovaný

diagnostikovateľný

deterministický

bez duplicít

To znamená, že môžeme začať robiť veci, ktoré predtým boli nebezpečné.

🥇 PHASE 7 — Spawn Observability Hardening

Teraz už máš:

_lastSpawnResult

spawnStats

spawnDiagnostics

Sprav z toho systém.

Cieľ:

Spawn ako “merateľný subsystém”.

Konkrétne:

Zaviesť:

spawnHealth = {
  successRate,
  avgAttemptsPerSuccess,
  lastFailureReason,
  blockedByCap,
  blockedByUniqueness
}

Aktualizovať to len po _processSpawnRequests().

Žiadna extra logika — len agregácia.

🟢 Výsledok:
Vieš, či spawn je zdravý bez čítania logov.

🥈 PHASE 8 — Hard Determinism Audit

Teraz keď je spawn čistý:

Skontrolovať:

Je pool selection 100% deterministický?

Je vizuál vyberaný iba z canonical registry?

Je fallback vždy rovnaký pre rovnaký input?

Ak nie:
Zaviesť deterministický seed pre spawn counter.

🟢 Výsledok:
Replay spawn pipeline bude identický.

🥉 PHASE 9 — Spawn Isolation Boundary

Cieľ:
Spawn nesmie mutovať nič mimo:

node registry

scene attach

postSpawnObservers

Audit:

Nezapisuje spawn priamo do metrics?

Nevolá AI priamo?

Neovplyvňuje link system implicitne?

Ak áno:
Presunúť tieto efekty do observer vrstvy.

🟢 Výsledok:
Spawn = čisto konštrukčný mechanizmus.

🟡 PHASE 10 — Link Growth Reactivation

Až teraz.

Keď spawn je stabilný, zapni:

ATOMA_LINK_SPAWN_ENABLED = true

Ale:

s cap limitom

s cooldown

s diag aktívnym prvé 2 testy

Sleduj spawnHealth.

🟢 Výsledok:
Organický rast bez chaosu.

🟠 PHASE 11 — Remove Last Redundancies

Až po link growth testoch:

audit LegacyNodeModelFilter

zistiť či fallback ešte má zmysel

ak nie → warning-only režim

Toto je posledný krok.

🔵 PHASE 12 — Spawn Contract Freeze

Keď všetko funguje:

Napísať malý interný kontrakt:

Spawn Contract:
- Single entry: requestSpawn
- 4 validation layers max
- No direct category remap outside validateSpawnRequest
- No metric mutation
- No AI side-effects

A hotovo.

Spawn zamrzne ako stabilný subsystém.