Canonical Metric Meaning
synergy How well a node is connected to the network
harmony Stable, positive resonance
stability Resistance to chaos/failure
corruption Entropy, decay, toxicity
loadPressure Network pressure on a node

1️⃣ CANONICAL WRITE AUTHORITY (LOCKED)

Allowed writers:
- SafeMetricsDNAIntegration (SPAWN SNAPSHOT ONLY)
- NodeMetricEngine (EVENT IMPULSES ONLY)
- MetricsRuntime_v1 (FIXED 10Hz ONLY)
- Anything else = violation.

2️⃣ FORBIDDEN

- Per-frame writes to node.userData.metrics
- Manual overrides outside spawn
- Schema-mismatched writes (0–100 scale)

Legacy compatibility that overwrites existing canonical values

3️⃣ SPAWN ORDER (FINAL)

A tu spravíme poriadok.

Ja by som to upratal takto:

SafeMetricsDNAIntegration.attachMetrics
→ applyMetricCompatibility (only missing keys)
→ initNodeMetrics (only if missing)
→ onNodeSpawn (optional nudge, but only if NOT DNA-based archetype)


Node Metric Global Name
synergy --> networkSynergy
harmony --> harmonyFlow
stability --> network stress
corruption --> corruption level
load --> loadPressure

node.userData.metrics = {
synergy: count, // 0..1
harmony: count, // 0..1
stability: count, // 0..1
corruption: count, // 0..1
loadPressure: count // 0..1
}
Canonical metrics for individual nodes (true about games)

These metrics are true.
Every node has them or contributes to them.

Canonical truth:
- Node metrics: 0..1 float
- Global metrics: 0..1 floating point (derived)
- HUDs: never change meaning, only format

📌 Range: 0.0 – 1.0
📌 Storage: node.userData.metrics.*

✅ Float-only pipeline finally found
Node → adapter → show model → HUD
No % recalculations, no hidden reinterpretations. Pure 0..1.
✅ CoreMetricsHUD does exactly one thing
Displays numbers. Doesn't change meaning. Doesn't distort reality.
Bar = visual (×100), text = true (float). Luxury solution 👌

1️⃣ Synergy
Meaning:

Measures how well a node is meaningfully connected to the network.

high synergy = node other other

low synergy = node is isolated or redundant

it's not energy, it's the quality of relationships

➡️ arises from a combination of:

harmony

stability

load pressure (inverse)

corruption (reverse)

2️⃣ Harmony

Meaning:

Internal coherence of the node with the network.

high harmony = node "plays in tune" with the network

low harmony = node creates dissonance

➡️ harmony:

increases synergy

reduces the occurrence of corruption

acts as a protective factor

3️⃣ Stability

Meaning:

The ability of the node to maintain its state over time.

high stability = predictable behavior

low stability = fluctuation, instability

➡️ stability:

increases harmony

reduces corruption

reduces "noise" in the network

4️⃣ Corruption

Meaning:

The degree of violation of the integrity of the node.

high corruption = chaos, conflict states

low corruption = clean signal

➡️ corruption:

reduces harmony

reduces synergy

grows with:

high load pressure

low stability

long-term disharmony

5️⃣ Load pressure

Meaning:

The pressure exerted on a node by its role is a network.

high load pressure = ie

low load pressure = reserve

➡️ load pressure:

increases corruption

reduces harmony

reduces synergy
______________________________________________________
II. Canonical Metrics per Node

(Truth Layer Playability)

These metrics define the behavior of a node in the system.

🧩 1. synergy

Meaning:
The ability of a node to cooperate with other nodes in the network.

high synergy → stronger, more stable links

low synergy → weak, weak links

Relationships:

↑ harmony → ↑ synergy

↑ corruption → ↓ synergy

↑ load pressure → ↓ synergy

➡️ Synergy never exists by itself. It is a result.

🧩 2. harmony

Meaning:
The internal consistency and coherence of a node.

reflects the "mental state" of the node

affects visual clarity, smoothness of animations

Relationships:

↑ harmony → ↑ synergy

↑ harmony → ↓ corruption

↑ loadPressure → ↓ harmony

🧩 3. stability

Meaning:
The node's resistance to change, shocks and chaos.

high stability → predictable behavior

low stability → fluctuations, risk of collapse

Relationships:

↑ corruption → ↓ stability

↑ loadPressure → ↓ stability

🧩 4. corruption

Meaning:
The degree of entropy / disorder / chaos in the node.

corruption is not evil, it is a risk

Extremes, but it destabilizes the system

Relationships:

↑ corruption → ↓ harmony

↑ corruption → ↓ synergy

↑ loadPressure → ↑ damage

🧩 5. loadPressure

Meaning:

The pressure exerted on a node is the amount of:

the combination of

flows

of computational / system load

Relationships:

↑ loadPressure → ↑ damage

↑ loadPressure → ↓ harmony

↑ loadPressure → ↓ stability
_________________________________________________________

🌐 Network / global metrics (aggregated truth)

These metrics are an aggregation of node metrics.

1️⃣ Network Synergy

aggregate node.synergy

expresses "how well it works together"

2️⃣ Harmony Flow

aggregate node.harmony over time

dynamic flow metric

used for:

VFX

network rhythm

"feeling alive"

3️⃣ Network Stress

aggregate load pressure

shows the overall pressure on the network

4️⃣ Corruption Level

aggregate node.corruption

shows the level of system degradation

5️⃣ Load Pressure (global)

overall system pressure

can feed back to node load pressure

🔁 Allowed Interactions (explicitly approved)

✔️ high corruption → reduced synergy

✔️ high harmony → increased synergy

✔️ high load pressure → increased corruption & decreased harmony

_________________________________________________________________
IV. Network / Global Metrics

(Aggregate View Layer)

🔹 3. Network / Global Metrics (Derived)

These are NOT new metrics, just aggregations:

Global Metric Derived from

networkSynergy avg(node.synergy)
harmonyFlow avg(node.harmony)
networkStress avg(node.loadPressure)
corruptionLevel avg(node.corruption)
load Max. Pressure / Weighted Avg

V. Cross-Metric Rules (OFFICIAL)

These rules may be implemented later, but they are already valid in meaning:

high corruption → reduces synergy

high harmony → increases synergy

high loadPressure:

increases corruption

reduces harmony and stability

4. Interaction Rules (already existed – now official)

high corruption ↓ synergy

high harmony ↑ synergy

high loadPressure ↑ corruption ↓ harmony

_____________________________________________
🎛 K values ​​for each metric (raw → normalized)

We will use saturation:

norm(x,K)=1−e−x/K

K = “how much is too much” (half of the feeling happens roughly around K, the center of gravity of the curve is there).

Recommended K (v1)

Assumption: raw metrics grow with connections/activity and can go above 100.

Metric Character K (default) Why
synergy slow build 80 let synergy not be "free" after a few links
harmony medium sensitivity 60 sensitive, but not overly so
stability slow, robust 90 stability should be "hard" to break and build
corruption quickly escalates 40 corruption is aggressive when it starts
loadPressure very sensitive 30 system pressure let you feel it early, it's a "warning lamp"
Micro rule (super practical)

K smaller = metric saturates quickly (reacts sharply)

K larger = metric saturates slowly (takes a long time to build)

🔁 Interaction equations (corruption ↔ harmony + others)

Here's my suggestion: we'll make one common "interaction kernel" and the effects derived from it.
So that you don't have 50 ad-hoc hacks, but one logical "physics of the world".

Basic principle: everything happens through "gates"

First normalize:

H = norm(harmonyRaw, K_H) // 0..1
S = norm(synergyRaw, K_SY) // 0..1
T = norm(stabilityRaw, K_ST) // 0..1
C = norm(corruptionRaw, K_C) // 0..1
L = norm(loadRaw, K_L) // 0..1

And then make gates:

1) "Fragility gate" (when the system is vulnerable)

Corruption spreads more when:

stability is low

loadPressure is high

vulnerability = clamp01( (1 - T) * (0.6 + 0.4*L) );

2) “Coherence gate” (when harmony really helps)

Harmony helps more when:

there is at least some stability

there is no extreme load

coherence = clamp01( T * (1 - 0.7*L) );

These are the two most important levers. The rest is from them.

✅ Core equations (v1)
A) Corruption eats Harmony
dH = +aH * coherence
- bH * C * (0.5 + 0.5*vulnerability);

aH e.g. 0.02 * dt

bH e.g. 0.05 * dt

Interpretation:

Harmony regenerates, but only when the system is “coherent”

Corruption eats it up, especially when the system is vulnerable

B) Harmony suppresses Corruption
dC = +aC * vulnerability
- bC * H * coherence;

aC e.g. 0.03 * dt

bC e.g. 0.04 * dt

Interpretation:

Corruption grows when the system is vulnerable

Harmony can suppress it, but only if it has “something to lean on” (coherence)

🔁 Other interactions (logically beautiful and useful)
C) LoadPressure increases Corruption
dC += +kLC * L * (0.4 + 0.6*(1 - T));

Corruption grows more from load when stability is low.

D) High Harmony increases Synergy
dS = +kHS * H ​​* coherence
- kCS * C * vulnerability;

Synergy increases when Harmony + coherence, and falls when corruption dominates.

E) Corruption erodes Stability
dT = +kHT * H * 0.5
- kCT * C * (0.3 + 0.7*vulnerability);

Stability can be "healed" by harmony (slowly), but corruption can erode it faster.

🎚 Recommended coefficients (v1 default)

To get you started right away, I'm giving you a "starter pack":

Coefficient Value
aH 0.020
bH 0.050
aC 0.030
bC 0.040
kLC 0.025
kHS 0.030
kCS 0.020
kHT 0.010
kCT 0.030

Use * dt (deltaTime in seconds) or fix tick.

🧠 My Atoma improvement (optional, but very good)
1) "Tipping point" for corruption

Corruption is most interesting when it has phases:

below threshold: latent

above threshold: spreading

Make a simple multiplier:

corruptionPhase = smoothstep(0.55, 0.75, C); // 0..1
C_aggression = 1 + 1.5 * corruptionPhase;

And then use C * C_aggression in dC and in damage.

Result:
high corruption behaves “like fire” 🔥, not like a linear slider.

2) “Harmony resonance” (synergy boost in stable system)

Let harmony give synergy boost only when stability is high:

resonance = smoothstep(0.6, 0.9, T) * H;
dS += +0.02 * resonance;

That is extreme “Atoma”: stability will allow harmony to resonate into synergy.

1️⃣ Delta Time (dt) – “how much time has passed”

Delta time is just a number:

“how much real time has passed since the last update”

Example:

60 FPS → dt ≈ 0.016 s

30 FPS → dt ≈ 0.033 s

lag → dt ≈ 0.1 s

When you write:

value += rate * dt;

➡️ you are saying:

“It doesn’t matter how fast the game runs, the change per second should be the same.”

✅ Advantage

Physically correct

Independent of FPS

❌ Disadvantage

Things can "shoot out" at large dt (lag spike)

You need clamp / max dt

2️⃣ Fixed Tick – "heartbeat of the system"

Fixed tick means:

The system always updates after the same time step

Example:

10 Hz → every 100 ms

5 Hz → every 200 ms

Pseudo:

ACC += realDt;
while (ACC >= FIXED_DT) {
updateMetrics(FIXED_DT);
ACC -= FIXED_DT;
}

🧠 Mental Model

render can run at 144 FPS

metrics are beating like a heart: boom… boom… boom…

✅ Pros

extreme stability

coefficients never change

ideal for system metrics

❌ Cons

not exactly “smooth”, but we don’t mind

slight lag (100–200 ms)

➡️ For metrics, it’s a win, not a problem.

3️⃣ Event-Driven – “the world reacts when something happens”

Event-driven means:

metrics change immediately when events occur

Examples:

node connects → +loadPressure

link breaks → −synergy

corruption event → +corruption spike

onLinkCreated(node) {
node.metrics.loadPressure += 5;

🧠 IDEAL COMBINATION FOR ATOM (my verdict)

Event-driven pulses + Fixed Relax Tick

That’s exactly what you intuitively suggested ❤️

🧬 How it looks in practice

🔹 1. Event-Driven (pulses)

instant changes in raw metrics

jumps, spikes, reactions

onNodeLinked() {
loadPressure += 8;
synergy += 4;
}

🔹 2. Relax Tick (stabilization)

Runs e.g. 5–10x per second:

updateMetrics(FIXED_DT) {
applyInteractions(FIXED_DT);
relaxTowardsBaseline(FIXED_DT);
}

Relax does:

damping extremes

returning to balance

slow changes (harmony, stability)

4️⃣ Why it's performance-friendly (even with 50+ nodes)
❗ Critical fact

Metrics:

don't have to run per frame

don't have to run for every shader

don't have to respond to every pixel

If you have:

50 nodes

relax tick 10 Hz

➡️ you're doing 500 update steps per second
That's nothing.

Even 200 nodes × 10 Hz = 2000 simple calculations
JS doesn't even break a sweat 💨

5️⃣ How to keep coefficients stable at 50 nodes
🔑 Golden rule

Coefficients always express "change per second"

Therefore:

dC = rate * dt;

No:

dC = rate; // ❌ FPS dependent

🔹 Recommended FIXED_DT
Type Value Usage
Relax tick 0.1 s default
Fineer 0.05 s sensitive systems
Coarser 0.2 s slow, "organic"

👉 I would start with 0.1 s (10 Hz).

6️⃣ Safety precautions (recommended)
A) Clamp on delta
dt = Math.min(dt, 0.25);

B) Clamp on raw metrics (only against negative ones)
metric = Math.max(metric, 0);