🧠 P3.2 – Authority & Triggers
(Collapse Request Lifecycle · Design Only)

Cieľ: Zabrániť implicitným kaskádam a „náhodným“ kolapsom.
Princíp: Request → Gate → Execute (nikdy skratka).

1) KTO MÔŽE VYDAŤ COLLAPSE REQUEST
✅ Povolení Requesteri (Advisory → Request)

Len sémantické systémy môžu vydať collapse request:

Integrity System
Primárny autor. Ak integrity prejde do irrecoverable stavu, môže vydať request.

Degradation / Quality System
Môže navrhnúť request pri dlhodobej degradácii pod prah obnovy.

Corruption / Contagion System
Môže vydať request, ak korupcia prekročí hard cap a healing je zablokovaný.

Poznámka: „Môže“ ≠ „musí“. Vydanie requestu je aktívne rozhodnutie, nie automatika.

❌ Zakázaní Requesteri

Vizuálne systémy (VFX, HUD, shaders)

Interaction systémy (input, UI, tools)

Load / Stress / Tension systémy (len advisory)

AI/Agent systémy (môžu len eskalovať signály, nie request)

2) KEDY JE COLLAPSE REQUEST PLATNÝ
Povinné Preconditions (ALL must pass)

Collapse request je platný iba ak:

Integrity Gate = FAIL (irrecoverable)
Stav unstable nestačí.

Stability Cooldown Passed
Žiadne oscillácie (hysteresis aktívna).

Healing Lock
Žiadny aktívny alebo pending healing/reconstruction.

Priority Check (Read-only)
Vysoká priorita nesmie collapse zakázať, ale môže vyžadovať explicit confirmation.

Časové Obmedzenia

Debounce Window: viac requestov v krátkom čase sa zlučuje do jedného.

Expiration: neexekuovaný request expiruje, ak sa stav zlepší.

3) ČO JE COLLAPSE REQUEST (FORMÁT)
Collapse Request (Conceptual Shape)

Target: link | node | region

Reason: integrity | degradation | corruption

Severity: soft | hard (advisory label)

Timestamp / TTL

Audit Metadata: source system, thresholds crossed

Collapse request je dátový objekt / signál, nie akcia.

4) KTO SMIE EXEKUOVAŤ COLLAPSE
✅ Jediný Exekútor

Structural Linking System (Topology Owner)

Povolené Akcie Exekútora

Unlink (per-link, explicitne)

Region isolation (bez implicitnej kaskády)

Mark-for-removal (deferred execution)

❌ Zakázané Akcie

Automatická kaskáda na susedné linky

Exekúcia bez platného requestu

Exekúcia na základe vizuálneho stavu

5) AKO PREBIEHA EXEKUČNÝ TOK
Canonical Flow

Request Issued (semantic system)

Gate Evaluation (integrity + cooldown + locks)

Authorization Granted

Structural Execution

Post-Execution Hooks

Visual update

Metrics update

Audit log

Každý krok musí byť pozorovateľný a auditovateľný.

6) GLOBÁLNE ZÁKAZY (NON-NEGOTIABLE)

❌ Žiadny collapse bez requestu

❌ Žiadny request bez integrity gate

❌ Žiadna exekúcia z vizuálu alebo interakcie

❌ Žiadna skrytá kaskáda

❌ Žiadne „temporary bypass“ výnimky

7) EDGE CASES & FAIL-SAFES
🔁 Oscillation Protection

Rapid unstable↔collapsed prechody sú blokované cooldownom.

🧩 Partial Region Collapse

Region collapse neimplikuje unlink jednotlivých liniek bez samostatných requestov.

⏪ Recovery Race

Ak sa healing aktivuje pred exekúciou, request sa ruší.

🛑 Emergency Freeze

Globálny collapse freeze (debug/dev) má vyššiu prioritu než akýkoľvek request.

8) VZŤAH K P2 (PRIORITY)

Priority nikdy nespúšťa collapse

Priority nikdy neexekuuje collapse

Priority môže:

ovplyvniť timing

vyžadovať explicit confirmation

Priority je read-only input pre collapse rozhodovanie

🧭 ZÁVEREČNÝ VERDIKT

Po P3.2 má ATOMA:

Jasnú hierarchiu autority

Žiadne implicitné bočné efekty

Collapse ako vedomý, auditovateľný akt

Systém pripravený na emergenciu bez chaosu