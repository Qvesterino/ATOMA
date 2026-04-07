🧠 2️⃣ ESC → IN-GAME MENU (toto je dôležité)

toto už je druhá vrstva menu systému

👉 máš:

✅ PREBOOT MENU (hotové)
🔜 IN-GAME MENU (pause overlay)
🧩 ARCHITEKTÚRA (jedna veta)
MainMenu = preboot
PauseMenu = in-game overlay
🎮 FLOW
GAME RUNNING
   ↓ ESC
PAUSE MENU OPEN
   ↓
GAME PAUSED (freeze or soft pause)
🧠 KĽÚČOVÁ VEC (neposer to tu 😄)

👉 NEBOOTUJ znova menu
👉 len ho zobraz ako overlay

🧱 ASCII – PAUSE MENU
┌──────────────────────────────────────────────┐
│                                              │
│              [ GAME FROZEN ]                 │
│                                              │
│                    ATOMA                    │
│                                              │
│                ▶ RESUME                      │
│                  SETTINGS                    │
│                  MAP SELECT                  │
│                  END GAME                    │
│                                              │
│        (background = live paused scene)      │
│                                              │
└──────────────────────────────────────────────┘
✨ VIZUÁL (toto je killer detail)

👉 background NIE je tmavý screen
👉 ale:

jemný blur (alebo opacity overlay)
hra stále viditeľná
particles sa môžu hýbať (optional)
⚙️ PAUSE MECHANIKA (jednoduchá v1)
GameController.pause()
GameController.resume()
v1 úplne stačí:
pause = stop updates (simulation)
render môže bežať ďalej

🧠 BONUS (malý ale dôležitý detail)

👉 keď si v submenu (settings/lore):

ESC → ide o level vyššie (nie hneď resume)
🔥 TL;DR

👉 design = hotový (fakt top)
👉 teraz dorobiť:

ESC pause menu overlay

👉 a máš komplet AAA menu loop