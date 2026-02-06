WaveInterferenceEngine - Burst Snapshot Contract (Phase BSR)

System role
- WaveInterferenceEngine is a burst-intent interpreter.
- It creates immutable burst snapshots on regime boundary crossings.
- It does not run a per-frame simulation loop.

Single entry points
- `waveInterferenceEngine.requestBurstIntent(intent)`
- `waveInterferenceEngine.requestUpdate(reason, context)` (compatibility adapter)

Allowed burst types
- `harmonic`
- `synergy`
- `corruption`

Critical crossing model
- Bursts trigger only on regime boundary entry.
- Remaining inside a critical regime does not retrigger.
- Rearm requires leaving to a reset regime before re-entry.
- Crossing logic is symbolic (regime labels), not numeric thresholds.

Arbitration model
- Default mode: non-coexistence.
- Active burst blocks new burst unless policy allows coexistence.
- Higher-priority burst may supersede active burst when enabled.

Output contract
- The engine publishes an immutable active snapshot via `getActiveSnapshot()`.
- Snapshot includes:
  - `type`
  - `spatial.center`
  - `spatial.scope`
  - `spatial.directionalBias`
  - `intensityEnvelope`
  - `decayProfile`
  - `regime` metadata
  - timeline (`startAt`, `peakAt`, `endAt`)

Read paths for visual systems
- `getWaveFieldForEntity(entity, isLink)`
- `getNodeWaveField(nodeId, nodeRef)`
- `getLinkWaveField(linkId, linkRef)`

Hard rules
- MUST NOT be called from RAF as a solver update loop.
- MUST NOT write `node.userData.*`.
- MUST NOT write `link.userData.*`.
- MUST NOT mutate shader values directly.
- MUST NOT perform global graph traversal during playback sampling.

Field suppression handshake
- During active burst, field suppression callback may apply authority lock.
- On burst end, suppression callback must release the lock.

Lifecycle observability
- Lifecycle states are emitted as:
  - `requested`
  - `accepted`
  - `started`
  - `rejected`
  - `ended`
- Main runtime can mirror lifecycle to semantic event bus.

Mental model
- WaveInterferenceEngine is a burst memory publisher, not a continuous simulator.
