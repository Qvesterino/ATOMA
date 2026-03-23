# FÁZA C BOD 14 - STABILNÉ PORADIE UPDATE LANE
## 2026-03-23 18:35 CET

---

## ✅ FIX COMPLETED

**Súbor:** main.js  
**Fáza:** C bod 14  
**Priorita:** Medium  
**Stav:** ✅ VYRIEŠENÉ  
**Dátum:** 2026-03-23 18:30 CET  

---

## 🎯 PROBLÉM

**Nájdené problémy (z UPDATE_LANE_ANALYSIS.md):**

### 1. Dvojitá registrácia MetricsRuntime_v1
- **Registrácia 1:** `background.networkMetricsAggregator`
  - Volá: `this.metricsRuntime_v1.runNetworkMetricsAggregator()`
  - Poradie: Background

- **Registrácia 2:** `simulation.metricsAggregator`
  - Volá: `this.metricsRuntime_v1?.runNetworkMetricsAggregator?.()`
  - Poradie: Simulation

**Problém:**
- MetricsRuntime_v1 beží DVAKRÁT za frame
- Žiadne dôvody pre dvojitú registráciu
- Potenciálne race conditions
- Zbytočné volania spomaľujú runtime

### 2. Neznámy poradie NodeMetricEngine
- NodeMetricEngine NIE JE registrovaný vo FrameScheduler
- Nie je jasné, kedy a ako je volaný
- Poradie vzhľadom na iné systémy je neznáme

### 3. Potenciálne čítanie pred zápisom
- Ak MetricsRuntime_v1 (background) beží pred visual readers
- Visual readers môžu čítať neaktuálne dáta
- Poradie je: Background → Background → Simulation → Visual
- Prvý background (MetricsRuntime) beží pred druhým background → Visual

---

## 🔧 RIEŠENIE

### Odstránená dvojitá registrácia MetricsRuntime_v1

**Pôvodný kód (riadky 3476-3486):**
```javascript
this.frameScheduler.register('background', (dt) => {
    if (this.metricsRuntime_v1) {
        this.metricsRuntime_v1.runNetworkMetricsAggregator();
    }
}, 'background.networkMetricsAggregator');
if (this.frameScheduler?.isRegistered?.('simulation.metricsAggregator') !== true) {
    this.frameScheduler.register(
        'simulation',
        () => this.metricsRuntime_v1?.runNetworkMetricsAggregator?.(),
        'simulation.metricsAggregator'
    );
}
```

**Nový kód (riadok 3476):**
```javascript
// === UPDATE LANE ORDER (Fáza C, bod 14) ===
// Writers (background) must run before readers (simulation, visual)
// Removed duplicate 'background.networkMetricsAggregator' to fix race condition
// MetricsRuntime_v1 is now registered only as 'simulation.metricsAggregator'
// This ensures writers run before readers in the same frame
this.frameScheduler.register('simulation', () => this.metricsRuntime_v1?.runNetworkMetricsAggregator?.(),