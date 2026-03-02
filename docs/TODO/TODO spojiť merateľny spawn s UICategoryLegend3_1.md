🎯 CIEĽ

Keď sa spawnú nody:

CONTROL × 3 → CONTROL III

INPUT × 4 → INPUT IIII

STORAGE × 2 → STORAGE II

Ale:

✔ bez per-frame skenovania
✔ bez počítania zo scene
✔ bez traversal

Len cez spawn pipeline.

🧠 ARCHITEKTÚRA NAPOJENIA

Spawn už má:

_lastSpawnResult

spawnStats

centralizovaný entry point

Takže pridáme:

🟢 Spawn Category Counter

V AINodes.js:

spawnCategoryCounts = {
  INPUT: 0,
  PROCESS: 0,
  STORAGE: 0,
  ANALYTICS: 0,
  INTEGRATION: 0,
  CONTROL: 0,
  PRIME: 0,
  ERROR: 0,
  MYTHIC: 0,
  SIGMA: 0,
  QUANTUM: 0,
  EMOTIONAL: 0
}

Incrementovať iba po úspešnom finalIntegrityCheck().

Nie pred.
Nie počas validation.
Až keď node reálne existuje.

🟡 Spawn Event Hook

Po úspechu:

this._emitSpawnEvent({
  category,
  totalForCategory,
  totalGlobal
})

Ale pozor:

Žiadny direct call do UI.

Spawn nesmie poznať UI.

Použi:

observer pattern

event bus

alebo jednoduchý callback registry

🟣 UI Layer (_UICategoryLegend3_1)

UI si:

subscribne na spawn event

drží si vlastný stav

nerobí traversal

onSpawn(event) {
  legendCounts[event.category] = event.totalForCategory
}
🔥 RÍMSKE ČÍSLICE

Rímske číslovanie je len prezentácia.

Interný stav nech je integer.

UI si to renderuje:

function toRoman(n) {
  return "I".repeat(n)
}

(Pre 20+ to môžeš neskôr spraviť klasickú roman konverziu.)

⚠️ DÔLEŽITÉ

Nech UI nikdy:

nečíta scene

nepočíta registry

nepočíta nodes array

To je starý chaos model.

Spawn je source of truth.

🧬 BONUS (evolučná myšlienka)

Keď to bude fungovať, môžeš:

farebne pulzovať kategóriu, keď sa spawnne nový node

animovať increment

zobraziť +1 efekt

Legend sa stane živou.

🧭 IMPLEMENTAČNÉ PORADIE

1️⃣ Pridať spawnCategoryCounts
2️⃣ Emitovať spawn event
3️⃣ UI subscribe
4️⃣ UI render integer → roman

Hotovo.