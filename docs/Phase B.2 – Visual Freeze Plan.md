🧊 Phase B.2 – Visual Freeze Plan

(MINI · CHECKLIST)

🎯 Cieľ

Zaručiť, že vizuály prestanú žiť vlastným životom a engine sa môže sústrediť na výkon.

✅ 1. GLOBAL FREEZE SWITCH

 Existuje 1 globálny flag: VISUAL_FROZEN

 Default: ON

 Runtime animácie rešpektujú flag

 Flag nikdy nemení shader / material

✅ 2. SHADER SAFETY

 Žiadny shader:

nemení defines po spawne

nemá #if viazaný na runtime stav

 uTime je read-only

 Žiadne noise() / random() v rozhodovaní

✅ 3. MATERIAL IMMUTABILITY

 Materiál sa nastaví len pri spawne

 Žiadne:

material.needsUpdate

material.transparent = …

material.blending = …

 Opacity len cez uniform

✅ 4. PER-FRAME BUDGET

 V animate():

len transform

len numerické uniformy

 0 rozhodnutí

 0 alokácií

 0 shader switchov

✅ 5. EVENT-ONLY VISUAL CHANGE

 Vizuál sa môže zmeniť len cez:

spawn

evolve

explicit event

 Event = destroy + create

 Event nie je interpolovaný

✅ 6. ARCHETYPE LOCK

 Archetype vyberá shader raz

 Archetype nemení vizuál počas života nodu

 Stav systému mení len:

farbu

intenzitu

scale

✅ 7. TRANSPARENCY RULE

 Transparentné materiály:

sú známe pri spawne

nikdy sa nemenia

 Žiadne runtime zapínanie blendingu

✅ 8. DEBUG ASSERTS

 Log, ak:

shader program count rastie

material sa zmení po spawne

 Možnosť dumpnúť:

počet programov

počet materiálov

 Jedno varovanie = stop

🧠 DONE DEFINITION

✔ FPS stabilnejší
✔ Žiadne vizuálne epilepsie
✔ Shader program count stabilný
✔ Žiadne „prečo sa toto hýbe“