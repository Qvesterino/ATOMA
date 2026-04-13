# Node Metrics Rebalance Plan

## 1. Problem Analysis

After analyzing all 12 node categories in `NodeVisualRegistry.js`, I identified these critical issues:

### CRITICAL Issues

| Category | Problem | Current Worst Values |
|----------|---------|---------------------|
| **Prime (10xx)** | synergy = harmony = stability ALL identical, 0.900→0.980. Zero corruption. | 1008: all three at 0.980, corruption 0.030 |
| **Mythic (9xx)** | Three metrics all 0.780→0.850, corruption negligible 0.020→0.070 | 908: all three at 0.850, corruption 0.070 |
| **Quantum (7xx)** | synergy hits 0.950, loadPressure 0.920 — extreme outliers | 705: synergy 0.950, loadPressure 0.920 |

### HIGH Issues

| Category | Problem |
|----------|---------|
| **Control (6xx)** | harmony/stability capped at 0.850 for entries 606-620 creating a flat plateau; 621 jumps to 0.880/0.950 |
| **Sigma (8xx)** | synergy = harmony for ALL nodes — zero differentiation between two metrics |
| **Error (11xx)** | 1103 has corruption 0.300 while all others are 0.850+ — broken consistency |

### MEDIUM Issues

| Category | Problem |
|----------|---------|
| **Input (1xx)** | harmony = stability for all entries — no differentiation |
| **Integration (3xx)** | synergy capped at 0.850 for entries 312-316 — plateau |
| **Storage (5xx)** | stability reaches 0.880 — slightly too high |

---

## 2. Design Philosophy

### Core Principles

1. **Every category has a unique fingerprint** — a recognizable metric profile
2. **Trade-offs are mandatory** — no node can be excellent at everything
3. **Hard cap at 0.820** — no metric exceeds this except for a category's ONE defining trait which may reach 0.840
4. **No metric is exactly 0.000** — even error nodes have some synergy
5. **synergy ≠ harmony ≠ stability** — always, for every node
6. **Organic values** — non-round numbers like 0.635789
7. **Meaningful corruption** — every category has some, even if tiny

### Gameplay Implications

Metrics drive these systems:
- **synergy** → link quality, chain reactions, cooperative behavior
- **harmony** → visual smoothness, healing, stress reduction, calm behavior
- **stability** → fatigue resistance, corruption spread resistance, reliability
- **corruption** → visual degradation, stress, dangerous events, chaos
- **loadPressure** → activity level, energy, processing weight

### Power Budget Framework

"Positive power" = synergy + harmony + stability (theoretical max 3.0)

| Tier | Categories | Target Budget |
|------|-----------|---------------|
| Foundation | Input, Process | 1.35 — 1.70 |
| Mid | Integration, Analytics, Emotional | 1.40 — 1.80 |
| Specialist | Storage, Control | 1.65 — 2.10 |
| Premium | Sigma, Mythic | 1.65 — 2.00 |
| Top | Prime | 1.85 — 2.15 |
| Wildcard | Quantum | 0.95 — 1.25 |
| Danger | Error | 0.25 — 0.65 |

---

## 3. Category Fingerprints

Each category has a **metric priority order** defining its identity:

```
Input:       harmony > stability > synergy    — in-tune, reliable, not powerful
Process:     synergy > harmony > stability     — transformative, volatile
Integration: synergy >> harmony > stability    — connects well, fragile
Analytics:   synergy > harmony > stability     — insightful, unstable
Storage:     stability >> harmony > synergy    — rock-solid, isolated
Control:     stability > harmony > synergy     — firm authority, not cooperative
Quantum:     synergy > harmony > stability     — high risk/reward, chaotic
Sigma:       stability > harmony > synergy     — balanced excellence
Mythic:      harmony > synergy > stability     — meaningful, shifting
Prime:       stability > harmony > synergy     — pure, transcendent, isolated
Error:       corruption >> stability > synergy  — broken, dangerous
Emotional:   synergy > harmony > stability     — empathetic, volatile
```

---

## 4. Proposed Values Per Category

### Input (1xx) — "The First Breath"
**Identity**: Clean entry, harmonious, reliable. Not exciting but dependable.
**Fix**: Differentiate harmony from stability.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 101 | 0.382741 | 0.461283 | 0.423817 | 0.037142 | 0.218473 |
| 102 | 0.398627 | 0.475168 | 0.437294 | 0.040583 | 0.229381 |
| 103 | 0.414513 | 0.489054 | 0.450771 | 0.044025 | 0.240289 |
| 104 | 0.430399 | 0.502939 | 0.464248 | 0.047466 | 0.251197 |
| 105 | 0.446285 | 0.516825 | 0.477725 | 0.050908 | 0.262105 |
| 106 | 0.462171 | 0.530710 | 0.491202 | 0.054349 | 0.273013 |
| 107 | 0.478057 | 0.544596 | 0.504679 | 0.057791 | 0.283921 |
| 108 | 0.493943 | 0.558481 | 0.518156 | 0.061232 | 0.294829 |
| 110 | 0.509829 | 0.572367 | 0.531633 | 0.064674 | 0.305737 |
| 111 | 0.525715 | 0.586252 | 0.545110 | 0.068115 | 0.316645 |

**Fingerprint**: harmony is always highest, stability moderate, synergy lowest of the three. Clean and harmonious but not powerful.

---

### Process (2xx) — "Where Pressure Becomes Structure"
**Identity**: Transformative power, volatile processing. Good synergy but less stable.
**Fix**: Keep existing differentiation, adjust ranges to be less extreme.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 201 | 0.518473 | 0.412836 | 0.384721 | 0.091847 | 0.382174 |
| 202 | 0.536281 | 0.428174 | 0.398263 | 0.099382 | 0.397481 |
| 203 | 0.554089 | 0.443512 | 0.411805 | 0.106917 | 0.412788 |
| 204 | 0.571897 | 0.458850 | 0.425347 | 0.114452 | 0.428095 |
| 205 | 0.589705 | 0.474188 | 0.438889 | 0.121987 | 0.443402 |
| 206 | 0.607513 | 0.489526 | 0.452431 | 0.129522 | 0.458709 |
| 207 | 0.625321 | 0.504864 | 0.465973 | 0.137057 | 0.474016 |
| 208 | 0.643129 | 0.520202 | 0.479515 | 0.144592 | 0.489323 |
| 209 | 0.660937 | 0.535540 | 0.493057 | 0.152127 | 0.504630 |

**Fingerprint**: synergy leads, harmony moderate, stability lowest. Processing is powerful but volatile.

---

### Integration (3xx) — "Where Distinct Truths Become One"
**Identity**: Connection specialist. Excellent synergy, moderate harmony, fragile stability.
**Fix**: Remove synergy plateau at 0.850. Cap synergy at ~0.780.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 301 | 0.583721 | 0.438174 | 0.347289 | 0.047283 | 0.472839 |
| 302 | 0.594836 | 0.448261 | 0.355412 | 0.049817 | 0.482741 |
| 303 | 0.605951 | 0.458348 | 0.363535 | 0.052351 | 0.492643 |
| 304 | 0.617066 | 0.468435 | 0.371658 | 0.054885 | 0.502545 |
| 305 | 0.628181 | 0.478522 | 0.379781 | 0.057419 | 0.512447 |
| 306 | 0.639296 | 0.488609 | 0.387904 | 0.059953 | 0.522349 |
| 307 | 0.650411 | 0.498696 | 0.396027 | 0.062487 | 0.532251 |
| 308 | 0.661526 | 0.508783 | 0.404150 | 0.065021 | 0.542153 |
| 309 | 0.672641 | 0.518870 | 0.412273 | 0.067555 | 0.552055 |
| 310 | 0.683756 | 0.528957 | 0.420396 | 0.070089 | 0.561957 |
| 311 | 0.694871 | 0.539044 | 0.428519 | 0.072623 | 0.571859 |
| 312 | 0.705986 | 0.549131 | 0.436642 | 0.075157 | 0.581761 |
| 313 | 0.717101 | 0.559218 | 0.444765 | 0.077691 | 0.591663 |
| 314 | 0.728216 | 0.569305 | 0.452888 | 0.080225 | 0.601565 |
| 315 | 0.739331 | 0.579392 | 0.461011 | 0.082759 | 0.611467 |
| 316 | 0.750446 | 0.589479 | 0.469134 | 0.085293 | 0.621369 |

**Fingerprint**: synergy far above others, stability is the weakest link. Integration connects but is fragile.

---

### Analytics (4xx) — Observation, Insight
**Identity**: Analytical power through instability. Good synergy, lower stability.
**Fix**: Keep existing character, adjust ranges.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 401 | 0.538174 | 0.392847 | 0.318263 | 0.103847 | 0.402817 |
| 402 | 0.553826 | 0.406392 | 0.331748 | 0.111283 | 0.418473 |
| 403 | 0.569478 | 0.419937 | 0.345233 | 0.118719 | 0.434129 |
| 404 | 0.585130 | 0.433482 | 0.358718 | 0.126155 | 0.449785 |
| 405 | 0.600782 | 0.447027 | 0.372203 | 0.133591 | 0.465441 |
| 406 | 0.616434 | 0.460572 | 0.385688 | 0.141027 | 0.481097 |
| 407 | 0.632086 | 0.474117 | 0.399173 | 0.148463 | 0.496753 |
| 408 | 0.647738 | 0.487662 | 0.412658 | 0.155899 | 0.512409 |
| 409 | 0.663390 | 0.501207 | 0.426143 | 0.163335 | 0.528065 |
| 411 | 0.679042 | 0.514752 | 0.439628 | 0.170771 | 0.543721 |
| 412 | 0.694694 | 0.528297 | 0.453113 | 0.178207 | 0.559377 |

**Fingerprint**: synergy leads, stability is lowest. Analytics sees patterns but the process is unstable.

---

### Storage (5xx) — "Where Yesterday Becomes Tomorrow"
**Identity**: Rock-solid memory, isolated. Highest stability, lowest synergy.
**Fix**: Reduce stability cap from 0.880 to ~0.810.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 501 | 0.284731 | 0.418263 | 0.623847 | 0.021847 | 0.218473 |
| 502 | 0.294128 | 0.427481 | 0.632174 | 0.023926 | 0.224837 |
| 503 | 0.303525 | 0.436699 | 0.640501 | 0.026005 | 0.231201 |
| 504 | 0.312922 | 0.445917 | 0.648828 | 0.028084 | 0.237565 |
| 505 | 0.322319 | 0.455135 | 0.657155 | 0.030163 | 0.243929 |
| 506 | 0.331716 | 0.464353 | 0.665482 | 0.032242 | 0.250293 |
| 507 | 0.341113 | 0.473571 | 0.673809 | 0.034321 | 0.256657 |
| 508 | 0.350510 | 0.482789 | 0.682136 | 0.036400 | 0.263021 |
| 509 | 0.359907 | 0.492007 | 0.690463 | 0.038479 | 0.269385 |
| 510 | 0.369304 | 0.501225 | 0.698790 | 0.040558 | 0.275749 |
| 511 | 0.378701 | 0.510443 | 0.707117 | 0.042637 | 0.282113 |
| 512 | 0.388098 | 0.519661 | 0.715444 | 0.044716 | 0.288477 |
| 513 | 0.397495 | 0.528879 | 0.723771 | 0.046795 | 0.294841 |
| 515 | 0.406892 | 0.538097 | 0.732098 | 0.048874 | 0.301205 |
| 516 | 0.416289 | 0.547315 | 0.740425 | 0.050953 | 0.307569 |

**Fingerprint**: stability dominates, synergy is lowest. Storage is reliable but doesn't cooperate well.

---

### Control (6xx) — Command, Governance
**Identity**: Firm authority, orderly, stable. Commands rather than cooperates.
**Fix**: Remove 0.850 plateau. Differentiate metrics. Cap at ~0.810.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 601 | 0.392847 | 0.583721 | 0.674839 | 0.018472 | 0.318473 |
| 602 | 0.401263 | 0.591847 | 0.682174 | 0.019836 | 0.326841 |
| 603 | 0.409679 | 0.599973 | 0.689509 | 0.021200 | 0.335209 |
| 604 | 0.418095 | 0.608099 | 0.696844 | 0.022564 | 0.343577 |
| 605 | 0.426511 | 0.616225 | 0.704179 | 0.023928 | 0.351945 |
| 606 | 0.434927 | 0.624351 | 0.711514 | 0.025292 | 0.360313 |
| 607 | 0.443343 | 0.632477 | 0.718849 | 0.026656 | 0.368681 |
| 608 | 0.451759 | 0.640603 | 0.726184 | 0.028020 | 0.377049 |
| 609 | 0.460175 | 0.648729 | 0.733519 | 0.029384 | 0.385417 |
| 610 | 0.468591 | 0.656855 | 0.740854 | 0.030748 | 0.393785 |
| 611 | 0.477007 | 0.664981 | 0.748189 | 0.032112 | 0.402153 |
| 612 | 0.485423 | 0.673107 | 0.755524 | 0.033476 | 0.410521 |
| 613 | 0.493839 | 0.681233 | 0.762859 | 0.034840 | 0.418889 |
| 614 | 0.502255 | 0.689359 | 0.770194 | 0.036204 | 0.427257 |
| 615 | 0.510671 | 0.697485 | 0.777529 | 0.037568 | 0.435625 |
| 616 | 0.519087 | 0.705611 | 0.784864 | 0.038932 | 0.443993 |
| 618 | 0.527503 | 0.713737 | 0.792199 | 0.040296 | 0.452361 |
| 619 | 0.535919 | 0.721863 | 0.799534 | 0.041660 | 0.460729 |
| 620 | 0.544335 | 0.729989 | 0.806869 | 0.043024 | 0.469097 |
| 621 | 0.552751 | 0.738115 | 0.814204 | 0.044388 | 0.477465 |

**Fingerprint**: stability highest, harmony good, synergy lowest. Authority is firm but doesn't cooperate.

---

### Quantum (7xx) — "Where Possibility Becomes Reality"
**Identity**: High-risk/high-reward. Decent synergy potential, terrible everything else.
**Fix**: Bring synergy down from 0.950→~0.720. Reduce loadPressure from 0.920→~0.630.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 701 | 0.583742 | 0.194721 | 0.142836 | 0.284731 | 0.518473 |
| 702 | 0.618471 | 0.228394 | 0.168257 | 0.321584 | 0.551826 |
| 703 | 0.653200 | 0.262067 | 0.193678 | 0.358437 | 0.585179 |
| 705 | 0.687929 | 0.295740 | 0.219099 | 0.395290 | 0.618532 |

**Fingerprint**: synergy is the only decent positive metric. Everything else is terrible. Corruption and loadPressure are high. This is the "glass cannon" category.

---

### Sigma (8xx) — "Where Anomaly Becomes Law"
**Identity**: Balanced excellence with order. All metrics decent, none extreme.
**Fix**: Differentiate synergy from harmony. Reduce values from 0.840 range.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 804 | 0.524731 | 0.583612 | 0.642847 | 0.031842 | 0.347291 |
| 805 | 0.558174 | 0.614738 | 0.671923 | 0.042517 | 0.381634 |
| 806 | 0.591617 | 0.645864 | 0.700999 | 0.053192 | 0.415977 |
| 807 | 0.625060 | 0.676990 | 0.730075 | 0.063867 | 0.450320 |

**Fingerprint**: stability > harmony > synergy. Balanced but not exceptional. Sigma brings order from chaos.

---

### Mythic (9xx) — "Where Pattern Becomes Meaning"
**Identity**: Deep meaning and harmony. NOT raw power. Meaning can shift.
**Fix**: Bring all metrics down from 0.850→~0.730 max. Add meaningful corruption.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 901 | 0.523847 | 0.618432 | 0.482163 | 0.067124 | 0.384721 |
| 902 | 0.543191 | 0.637816 | 0.498527 | 0.073258 | 0.398154 |
| 903 | 0.562535 | 0.657201 | 0.514891 | 0.079392 | 0.411587 |
| 904 | 0.581879 | 0.676585 | 0.531255 | 0.085527 | 0.425020 |
| 905 | 0.601223 | 0.695970 | 0.547619 | 0.091661 | 0.438453 |
| 906 | 0.620567 | 0.715354 | 0.563983 | 0.097795 | 0.451886 |
| 908 | 0.639911 | 0.734739 | 0.580347 | 0.103929 | 0.465319 |

**Fingerprint**: harmony leads, synergy moderate, stability lowest. Mythic is about meaning and harmony, not raw power or stability. Corruption is noticeable — even myths carry some darkness.

---

### Prime (10xx) — "Where Origin Becomes Transcendence"
**Identity**: Pure, transcendent, stable. Transcendence is isolated — not the most synergistic.
**Fix**: Break synergy=harmony=stability. Cap at ~0.820. Add non-zero corruption.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 1001 | 0.483721 | 0.641583 | 0.738214 | 0.014728 | 0.392847 |
| 1002 | 0.501683 | 0.657421 | 0.751836 | 0.017394 | 0.408631 |
| 1003 | 0.519645 | 0.673259 | 0.765458 | 0.020061 | 0.424415 |
| 1004 | 0.537607 | 0.689097 | 0.779080 | 0.022727 | 0.440199 |
| 1005 | 0.555569 | 0.704935 | 0.792702 | 0.025394 | 0.455983 |
| 1006 | 0.573531 | 0.720773 | 0.806324 | 0.028060 | 0.471767 |
| 1008 | 0.591493 | 0.736611 | 0.819946 | 0.030727 | 0.487551 |

**Fingerprint**: stability highest (transcendence is stable), harmony good (purity), synergy moderate-low (transcendence is isolated). Corruption is very low but NOT zero — even purity has a tiny shadow. Prime is "lonely perfection."

---

### Error (11xx) — Broken, Corrupted
**Identity**: Dangerous failure. Everything positive is low, corruption dominates.
**Fix**: Fix 1103 corruption inconsistency. Differentiate synergy from harmony slightly. Cap corruption at ~0.840.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 1101 | 0.062847 | 0.054721 | 0.148263 | 0.723841 | 0.514728 |
| 1102 | 0.082174 | 0.073283 | 0.167391 | 0.738217 | 0.538461 |
| 1103 | 0.101502 | 0.091845 | 0.186519 | 0.752593 | 0.562194 |
| 1104 | 0.120829 | 0.110407 | 0.205647 | 0.766969 | 0.585927 |
| 1105 | 0.140157 | 0.128969 | 0.224775 | 0.781345 | 0.609660 |
| 1106 | 0.159484 | 0.147531 | 0.243903 | 0.795721 | 0.633393 |
| 1108 | 0.178812 | 0.166093 | 0.263031 | 0.810097 | 0.657126 |

**Fingerprint**: corruption dominates, stability is the "best" positive metric (broken things still have some structure), synergy and harmony are very low but slightly different. loadPressure is moderate-high (errors still process).

---

### Emotional (12xx) — "Feeling, Intuition"
**Identity**: Empathetic connection, volatile emotions. Good synergy, low stability.
**Fix**: Reduce synergy from 0.820→~0.680. Keep the volatile character.

| Code | synergy | harmony | stability | corruption | loadPressure |
|------|---------|---------|-----------|------------|--------------|
| 1201 | 0.523847 | 0.342163 | 0.298471 | 0.094728 | 0.362847 |
| 1202 | 0.548263 | 0.364721 | 0.318394 | 0.105382 | 0.384721 |
| 1203 | 0.572679 | 0.387279 | 0.338317 | 0.116036 | 0.406595 |
| 1204 | 0.597095 | 0.409837 | 0.358240 | 0.126690 | 0.428469 |
| 1205 | 0.621511 | 0.432395 | 0.378163 | 0.137344 | 0.450343 |
| 1206 | 0.645927 | 0.454953 | 0.398086 | 0.147998 | 0.472217 |
| 1207 | 0.670343 | 0.477511 | 0.418009 | 0.158652 | 0.494091 |

**Fingerprint**: synergy leads (empathy), harmony moderate (emotional tension), stability low (volatile). Corruption is noticeable (emotional distortion).

---

## 5. Visual Comparison: Before vs After

### Power Budget Summary (synergy + harmony + stability)

| Category | Before Range | After Range | Change |
|----------|-------------|-------------|--------|
| Input | 1.50 — 2.00 | 1.27 — 1.66 | ↓ slightly weaker |
| Process | 1.56 — 2.00 | 1.32 — 1.69 | ↓ slightly weaker |
| Integration | 1.64 — 2.21 | 1.37 — 1.81 | ↓ less OP |
| Analytics | 1.50 — 2.00 | 1.25 — 1.68 | ↓ slightly weaker |
| Storage | 1.56 — 2.08 | 1.33 — 1.70 | ↓ less OP |
| Control | 2.06 — 2.55 | 1.65 — 2.11 | ↓ significantly nerfed |
| Quantum | 1.32 — 1.89 | 0.92 — 1.20 | ↓ significantly nerfed |
| Sigma | 2.08 — 2.53 | 1.75 — 2.03 | ↓ nerfed |
| Mythic | 2.24 — 2.55 | 1.62 — 1.96 | ↓ significantly nerfed |
| Prime | 2.70 — 2.94 | 1.86 — 2.15 | ↓ massively nerfed |
| Error | 0.28 — 0.80 | 0.27 — 0.71 | ~ same |
| Emotional | 1.28 — 2.04 | 1.16 — 1.57 | ↓ nerfed |

### Key Improvements

1. **Prime** went from 2.94 max budget → 2.15. Still the strongest but no longer absurd.
2. **Mythic** went from 2.55 → 1.96. Meaningful but not overpowered.
3. **Quantum** went from 1.89 → 1.20. True high-risk/high-reward.
4. **Control** removed the 0.850 plateau — smooth progression.
5. **Sigma** now has synergy ≠ harmony.
6. **Error** fixed the 1103 corruption inconsistency.
7. **Input** now has harmony ≠ stability.

---

## 6. Implementation Notes

### Files to modify
- `NodeVisualRegistry.js` — the primary target, all metric values

### Files that reference these values (read-only, no changes needed)
- `MetricsRuntime_v1.js` — reads metrics at runtime
- `SafeMetricsDNAIntegration1_0.js` — copies to archetypeMetrics
- `CoreMetricsOverlay.js` — displays metrics
- `tests/MetricsAuthority.test.js` — has hardcoded expected values that need updating

### Test Updates Required
- `tests/MetricsAuthority.test.js` line 208-212 — expects specific error node values
- `tests/MetricsAuthority.test.js` line 176-178 — expects specific stability/corruption values

### Risk Assessment
- **Scope**: MEDIUM — single file change with test updates
- **Impact**: Visual and gameplay behavior changes across all node categories
- **Compatibility**: Metrics API unchanged, only values change
- **Approach**: STRUCTURED FLOW — single targeted change with test verification
