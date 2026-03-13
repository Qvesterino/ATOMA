# ATOMA Cleanup Plan - Versioned Files

## Dátum: 2026-03-13
## Stav: READY FOR EXECUTION

---

## Zoznam súborov na presun do LEGACY/

### DORMANT - Presunúť do LEGACY/dormant/

| Súbor | Dôvod | Verzia |
|-------|-------|--------|
| `ComputeSynergyScore2_1.js` | Nepoužívaná, 2_0 je aktívna | 2_1 |
| `DreamDesert2.js` | Nepoužívaná, DreamDesert.js je aktívna | 2 |
| `LinkAutomationMonitor2_0.js` | Nepoužívaná v main.js | 2_0 |
| `LinkAutomationMonitor3_0.js` | Nepoužívaná v main.js | 3_0 |
| `LinkAutomationMonitorHUD2_0.js` | Nepoužívaná v main.js | 2_0 |
| `LinkGlowSynergyEngine1_0.js` | Nepoužívaná v main.js | 1_0 |
| `LinkGlowSynergyEngine_v2.js` | Nepoužívaná v main.js | v2 |

---

## Aktívne verzie (NEPRESÚVAŤ)

### Potvrdené aktívne v main.js:
- `ComputeSynergyScore2_0.js` ✓
- `DreamDesert.js` ✓
- `LinkAutomationEngine1_0.js` ✓ (related but different system)

---

## Execution Plan

### Fáza 1: Príprava
1. Vytvoriť `LEGACY/dormant/` priečinok
2. Vytvoriť `LEGACY/dormant/README.md` s vysvetlením

### Fáza 2: Presun súborov
```bash
# Presun dormant súborov
move ComputeSynergyScore2_1.js LEGACY/dormant/
move DreamDesert2.js LEGACY/dormant/
move LinkAutomationMonitor2_0.js LEGACY/dormant/
move LinkAutomationMonitor3_0.js LEGACY/dormant/
move LinkAutomationMonitorHUD2_0.js LEGACY/dormant/
move LinkGlowSynergyEngine1_0.js LEGACY/dormant/
move LinkGlowSynergyEngine_v2.js LEGACY/dormant/
```

### Fáza 3: Verifikácia
1. Skontrolovať, či main.js stále funguje
2. Overiť, že žiadne importy nesmerujú na presunuté súbory

---

## Riziká
- **Nízke:** Tieto súbory nie sú importované v main.js
- **Overenie:** Grepnúť importy pred presunom

---

## Ďalšie kroky po cleanup
1. Štandardizovať naming convention
2. Vytvoriť guidelines pre verzionovanie
3. Dokumentovať aktívne systémy

---

*Plán vytvorený: 2026-03-13*
*Stav: Čaká na vykonanie*

## Dátum: 2026-03-13
## Stav: READY FOR EXECUTION

---

## Zoznam súborov na presun do LEGACY/

### DORMANT - Presunúť do LEGACY/dormant/

| Súbor | Dôvod | Verzia |
|-------|-------|--------|
| `ComputeSynergyScore2_1.js` | Nepoužívaná, 2_0 je aktívna | 2_1 |
| `DreamDesert2.js` | Nepoužívaná, DreamDesert.js je aktívna | 2 |
| `LinkAutomationMonitor2_0.js` | Nepoužívaná v main.js | 2_0 |
| `LinkAutomationMonitor3_0.js` | Nepoužívaná v main.js | 3_0 |
| `LinkAutomationMonitorHUD2_0.js` | Nepoužívaná v main.js | 2_0 |
| `LinkGlowSynergyEngine1_0.js` | Nepoužívaná v main.js | 1_0 |
| `LinkGlowSynergyEngine_v2.js` | Nepoužívaná v main.js | v2 |

---

## Aktívne verzie (NEPRESÚVAŤ)

### Potvrdené aktívne v main.js:
- `ComputeSynergyScore2_0.js` ✓
- `DreamDesert.js` ✓
- `LinkAutomationEngine1_0.js` ✓ (related but different system)

---

## Execution Plan

### Fáza 1: Príprava
1. Vytvoriť `LEGACY/dormant/` priečinok
2. Vytvoriť `LEGACY/dormant/README.md` s vysvetlením

### Fáza 2: Presun súborov
```bash
# Presun dormant súborov
move ComputeSynergyScore2_1.js LEGACY/dormant/
move DreamDesert2.js LEGACY/dormant/
move LinkAutomationMonitor2_0.js LEGACY/dormant/
move LinkAutomationMonitor3_0.js LEGACY/dormant/
move LinkAutomationMonitorHUD2_0.js LEGACY/dormant/
move LinkGlowSynergyEngine1_0.js LEGACY/dormant/
move LinkGlowSynergyEngine_v2.js LEGACY/dormant/
```

### Fáza 3: Verifikácia
1. Skontrolovať, či main.js stále funguje
2. Overiť, že žiadne importy nesmerujú na presunuté súbory

---

## Riziká
- **Nízke:** Tieto súbory nie sú importované v main.js
- **Overenie:** Grepnúť importy pred presunom

---

## Ďalšie kroky po cleanup
1. Štandardizovať naming convention
2. Vytvoriť guidelines pre verzionovanie
3. Dokumentovať aktívne systémy

---

*Plán vytvorený: 2026-03-13*
*Stav: Čaká na vykonanie*

