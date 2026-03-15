# MAPA METRICKÉHO SYSTÉMU ATOMA

## Prehľad systémov
Analýza identifikovala 5 kľúčových systémov ovplyvňujúcich metriky:

### Tabuľka zmen metrík

| Metrika | Systém | Mechanismus | Runtime/Network |
|---------|---------|------------|-----------------|
| **synergy** | NodeMetricEngine.js | derivation (z harmony/stability/corruption/loadPressure) | runtime |
| **synergy** | LinkCorruptionTransmission_v1.js | feedback (defensive mastery pri blokovaní korupcie) | network |
| **synergy** | NetworkMetricsAggregator.js | network aggregation (priemer nodov+linkov) | network |
| **harmony** | NodeMetricEngine.js | cross-metric interaction, neighbor equalization, impulse (link events) | runtime |
| **harmony** | LinkCorruptionTransmission_v1.js | propagation (healing cascades), feedback | network |
| **harmony** | NetworkMetricsAggregator.js | network aggregation | network |
| **stability** | NodeMetricEngine.js | cross-metric interaction, neighbor equalization, impulse (overload) | runtime |
| **stability** | NetworkMetricsAggregator.js | network aggregation | network |
| **corruption** | NodeMetricEngine.js | cross-metric interaction, impulse (link/overload events) | runtime |
| **corruption** | LinkCorruptionTransmission_v1.js | propagation, contagion (infection), damping | network |
| **corruption** | NetworkMetricsAggregator.js | network aggregation | network |
| **loadPressure** | NodeMetricEngine.js | cross-metric interaction, impulse (link/overload events) | runtime |
| **loadPressure** | NetworkMetricsAggregator.js | network aggregation | network |

---

## Detailná dynamika jednotlivých metrík

### SYNERGY

**Povaha:** Read-only derived metric (vypočítavaná, nie priamo nastavovaná)

**Mechanizmy:**
1. **Derivation (NodeMetricEngine)** - Vypočítaná z:
   - `harmony^2` (harmonické pole)
   - `stability` (stabilizačné pole)
   - `(1 - corruption × 0.85)` (korupčné pole - vyššia korupcia = nižšia synergia)
   - `(1 - loadPressure × 0.65)` (tlakové pole - vyšší tlak = nižšia synergia)
   - Resonance bonus: keď harmony > 0.75 AND stability > 0.65

2. **Feedback Loop (LinkCorruptionTransmission)** - Defensive mastery:
   - Synergia rastie keď úspešne blokuje korupciu
   - Growth = blockedFraction × 8%
   - Extra bonus pri hard block (+12%)
   - Saturation damping: rast sa spomaľuje pri blížení k maximu (100)
   - Cooldown: 600ms (zrýchlený pri vysokej synergii)

3. **Network Aggregation** - Priemer všetkých nodových a linkových synergií

**Dynamika:** Synergia je emergentný indikátor systémovej kohézie - rastie v stabilných, harmonických, málo korumpovaných zónach.

---

### HARMONY

**Povaha:** Dynamic metric (mení sa priamo aj cez interakcie)

**Mechanizmy:**
1. **Cross-Metric Interaction (NodeMetricEngine)** - Komplexný systém:
   - Relaxácia: 5% za sekundu smerom k baseline
   - Gains: `coherence × 2.5%` kde `coherence = stability × (1 - loadPressure × 0.6)`
   - Losses: `corruption × vulnerability × 6%` kde `vulnerability = (1 - stability) × (0.5 + loadPressure × 0.7)`
   - Inertia: 85% (bráni osciláciám)

2. **Neighbor Equalization (NodeMetricEngine)** - Link-based averaging:
   - D = (harmonyB - harmonyA) × 2% × linkSynergy
   - Harmony sa vyrovnáva medzi prepojenými nodmi
   - Smer a rýchlosť závisí od kvality linku

3. **Impulse Events (NodeMetricEngine)**:
   - onLinkCreated: +2% harmony, -50% corruption
   - onLinkRemoved: -1% harmony
   - Cross-category links: +2% corruption (penalty)

4. **Healing Feedback (LinkCorruptionTransmission)** - Self-reinforcing loop:
   - Harmony rastie keď úspešne lieči korupciu
   - Growth = healedAmount × 2%
   - Saturation damping: (1 - harmony/max)
   - Cooldown: 500ms (zrýchlený pri vysokej synergii)
   - Only v unstable zone (integrity 8-15%) poskytuje stabilizáciu

5. **Healing Cascade (LinkCorruptionTransmission)** - Multi-hop propagation:
   - Spustí sa keď harmony >= 0.85 AND link má korupciu
   - Propaguje s decay 50% per hop (resonance-weighted)
   - Max depth: 3 hops
   - Healing cascade feedback je 50% weaker než local

**Dynamika:** Harmony je adaptívna stabilizačná sila - rastie v koherentných zónach, lieči korupciu, vytvára pozitívne feedback loopy.

---

### STABILITY

**Povaha:** Core stability metric (odráža systémovú odolnosť)

**Mechanizmy:**
1. **Cross-Metric Interaction (NodeMetricEngine)**:
   - Relaxácia: 4% za sekundu smerom k baseline
   - Gains: `harmony × 1.5%`
   - Losses: `corruption × 4%` + `loadPressure × 2%`
   - Inertia: 85%

2. **Neighbor Equalization (NodeMetricEngine)**:
   - D = (stabilityB - stabilityA) × 1.5% × linkSynergy
   - Stability difunduje medzi prepojenými nodmi

3. **Impulse Events (NodeMetricEngine)**:
   - onOverload: `-overloadAmount × 2%` stability loss
   - Overload zároveň zvyšuje loadPressure a corruption

**Dynamika:** Stability je fundamentálna odolnosť - klesá s korupciou a zaťažením, rastie s harmóniou, difunduje cez sieť.

---

### CORRUPTION

**Povaha:** Destructive metric (šíri sa a poškodzuje systém)

**Mechanizmy:**
1. **Cross-Metric Interaction (NodeMetricEngine)**:
   - Natural decay: `-4%` per second
   - Growth: `vulnerability × 3.5%` - `harmony × coherence × 4.5%` + `loadPressure × 2%`
   - Vulnerability = (1 - stability) × (0.5 + loadPressure × 0.7)
   - Inertia: 85%

2. **Impulse Events (NodeMetricEngine)**:
   - onLinkCreated: `-1%` (cross-category: +2% penalty)
   - onOverload: `+overloadAmount × 5%`

3. **Propagation (LinkCorruptionTransmission)** - Complex transmission system:
   - Transmission rate závisí od:
     - Archetype compatibility (prime/sigma = 0.3x, chaos/error = 2.0x)
     - Link synergy (>=85: hard block, 60-85: soft damping)
     - Harmony resistance (harmony 0.0→100%, 1.0→50% transmission)
     - Category multipliers (input→input: 1.3x, storage→storage: 0.5x)
     - Resonance amplification (dense networks: +5-15% blocking strength)
   - Cascade thresholds: 0.45 (distortion), 0.65 (particles), 0.85 (full cascade)

4. **Contagion (LinkCorruptionTransmission)** - Infection mechanisms:
   - Infection begins at corruption 0.60
   - Target node infection: +0.2 (attenuated by synergy stabilization)
   - Outbound link cascade: +0.15 boost
   - Threat cascade: corruption >= 0.5 propagates pressure through network

5. **Damping (LinkCorruptionTransmission)** - Defensive systems:
   - Synergy blocking: reduces transmission rate
   - Harmony blocking: >=0.8 hard block, 0.4-0.8 soft damping
   - Synergy-driven cascade softening: probabilistic suppression based on synergy
   - Barriers: reduce stress accumulation (not corruption values)

6. **Healing (LinkCorruptionTransmission)** - Corruption reversal:
   - Base healing rate: 5% per second (slow)
   - Harmony multiplier: direct strength
   - Resonance boost: amplification in coherent networks
   - Synergy recovery acceleration: `1 + min(synergy × 0.5, 0.5)` → 100-150% speed
   - Healing adds integrity in unstable zone (2% per 1% corruption)

**Dynamika:** Corruption je infekčný deštruktor - šíri sa cez slabé linky, blokovaný harmóniou a synergiou, liečený healing cascades.

---

### LOAD PRESSURE

**Povaha:** Load metric (odráža systémové zaťaženie)

**Mechanizmy:**
1. **Cross-Metric Interaction (NodeMetricEngine)**:
   - Relaxácia: 7% za sekundu smerom k baseline
   - Priamo nemanipulovaný v cross-metric (len relaxuje)
   - Ovplyvňuje iné metriky (corruption, stability)

2. **Impulse Events (NodeMetricEngine)**:
   - onLinkCreated: `+1%`
   - onLinkRemoved: `-1.5%`
   - onOverload: `+overloadAmount × 10%`

3. **Stress Dampening (LinkCorruptionTransmission)** - Preventative barriers:
   - Barriers reduce stress accumulation: 15% per barrier
   - Max total dampening: 40%
   - Affects: stress accumulation only (not corruption/integrity/healing)
   - Deployment costs: 0.1 harmony + 5 synergy per barrier
   - Upkeep: 2% harmony every 30s
   - Cost scaling: +25% per nearby barrier within 2 hops

**Dynamika:** Load pressure akumuluje pri vytváraní liniek a overloadoch, relaxuje priamo, je brzdený barierami.

---

## Mechanismy - definície

| Mechanismus | Popis | Príklad |
|------------|--------|---------|
| **neighbor equalization** | Vyrovnávanie hodnôt medzi prepojenými nodmi | Harmony difunduje medzi linky (2% × synergy) |
| **impulse** | Okamžité +/- zmeny pri eventoch | onLinkCreated: +2% harmony, onOverload: -X% stability |
| **propagation** | Kaskádovité šírenie cez sieť | Healing cascade: 50% decay per hop, max 3 hops |
| **contagion** | Infekčné šírenie s prahmi | Corruption: infection at 0.6, cascade at 0.85 |
| **network aggregation** | Priemernovanie nodov/linkov na network level | NetworkMetricsAggregator: compute() averages |
| **damping** | Spomaľovanie/zmierňovanie zmien | Harmony blocking >=0.8 = 0% corruption transmission |

---

## Architektonické poznámky

### Runtime vs Network
- **Runtime (NodeMetricEngine)**: Per-node, per-tick dynamics, cross-metric interactions
- **Network (LinkCorruptionTransmission)**: Link-level propagation, cascades, network-wide effects
- **Aggregation (NetworkMetricsAggregator)**: Read-only computation from runtime/network state

### Feedback Loops
1. **Harmony Healing Loop**: Healing → Harmony↑ → Better healing (positive, bounded)
2. **Synergy Defense Loop**: Blocking → Synergy↑ → Better blocking (positive, bounded)
3. **Corruption Vulnerability Loop**: Instability → Corruption↑ → Instability↓ (negative, self-limiting)

### Saturation Damping
Všetky feedback loopy používajú saturation damping:
- Formula: `feedback × (1 - value/max)`
- Efekt: Rast sa spomaľuje pri blížení k maximu, zabraňuje runaway

### Cooldowns
- Harmony feedback: 500ms (zrýchlený pri vysokej synergii)
- Synergy feedback: 600ms (zrýchlený pri vysokej synergii)
- Zabraňujú spam a oscilácie

### Safety Bounds
- Všetky metriky: clamped to [0, 1]
- Impulses: max ±0.25
- Write guards: len ALLOWED_WRITERS môžu zapisovať
- Synergy: read-only derived (blocked direct writes)

---

## Záver

ATOMA metric system je komplexný, viacúrovňový systém s:

1. **Silnou separáciou záujmov**: Runtime (per-node), Network (link propagation), Aggregation (read-only)
2. **Emerentným správaním**: Synergia vzniká z interakcie ostatných metrík
3. **Viacerými feedback loops**: Harmónia a Synergia seba-reinforcujú, Korupcia je seba-obmedzujúca
4. **Defenzívnymi mechanizmami**: Harmony blocking, Synergy blocking, Barriers, Healing cascades
5. **Dynamickým správaním**: Category multipliers, Resonance amplification, Saturation damping

Systém je navrhnutý tak, aby vytváral stabilné, koherentné siete s inherentnou odolnosťou voči deštrukcii, pričom umožňuje emergentné správanie a dramatické zmeny pri prekročení prahov.