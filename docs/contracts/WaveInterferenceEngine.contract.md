📜 WaveInterferenceEngine – Event-Gate Contract (Phase D)
🎯 System Role

WaveInterferenceEngine is an offline orchestrator:

computes network interference fields

never runs per-frame

never directly modifies visuals or gameplay metrics

1️⃣ Single entry point (ENTRYPOINT)

waveInterferenceEngine.requestUpdate(reason, context?)

Allowed reason (ENUM)

NODE_SPAWN

LINK_CREATED

LINK_REMOVED

PHASE_CHANGED

MANUAL_DEBUG

👉 Other calls are illegal.

2️⃣ Execution rules (HARD RULES)

❌ MUST NOT be called from animate() / RAF

❌ MUST NOT be called per-frame

✅ MAY run:

once per event

or in burst

3️⃣ Throttle & Burst policy

Basic behavior

Multiple requestUpdate() in a short time → merge

The calculation is performed max 1× per T ms (e.g. 250–500 ms)

Burst rule

during the burst, the following is remembered:

lastReason

dirtyFlags (nodes / links / topology)

4️⃣ Output contract (READ-ONLY SNAPSHOT)

WaveInterferenceEngine DOES NOT WRITE:

node.userData.*

link.userData.*

shader values

Instead, it publishes:
waveInterferenceSnapshot = {
timestamp,
networkVersion,
fields: {
nodeId → waveFieldData,
linkId → waveFieldData
}
}

👉 snapshot is immutable
👉 visual systems only read it

5️⃣ Separation of Responsibilities
Layer Does
WaveInterferenceEngine computes
Visual systems render
Gameplay systems ignore
RAF / animate MUST NOT call
6️⃣ Allowed event-hooks
Event Calls requestUpdate
NodeFactory NODE_SPAWN
LinkManager LINK_CREATED, LINK_REMOVED
PhaseController PHASE_CHANGED
DevConsole MANUAL_DEBUG
7️⃣ Forbidden Behavior (ANTI-PATTERNS)

❌ direct .update() call

❌ writes to userData in the engine

❌ dependency on deltaTime

❌ implicit per-frame side-effects

8️⃣ Mental Model (1 sentence)

WaveInterferenceEngine is a network solver triggered by events, not animation.