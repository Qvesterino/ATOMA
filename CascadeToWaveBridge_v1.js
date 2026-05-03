/**
 * CascadeToWaveBridge_v1
 * ----------------------
 * Event-driven bridge from cascade propagation to wave burst intent.
 *
 * No renderer, no scheduler, no visual logic.
 * It only listens to cascade.hop and forwards burst intents.
 */
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

function clamp01(value) {
  return Math.max(0, Math.min(1, value ?? 0));
}

function asVector3Like(value) {
  if (!value) return null;
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
    return { x: value.x, y: value.y, z: value.z };
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [x, y, z] = value;
    if ([x, y, z].every(Number.isFinite)) {
      return { x, y, z };
    }
  }
  return null;
}

export class CascadeToWaveBridge_v1 {
  constructor({ semanticBus = null, waveInterferenceEngine = null, linkingSystem = null } = {}) {
    this.semanticBus = semanticBus ?? globalThis?.semanticBus ?? null;
    this.waveInterferenceEngine = waveInterferenceEngine ?? null;
    this.linkingSystem = linkingSystem ?? null;

    this.enabled = true;
    this._semanticBusAttached = null;
    this._boundCascadeHopHandler = null;
  }

  init({ semanticBus = null, waveInterferenceEngine = null, linkingSystem = null } = {}) {
    if (semanticBus) this.semanticBus = semanticBus;
    if (waveInterferenceEngine) this.waveInterferenceEngine = waveInterferenceEngine;
    if (linkingSystem) this.linkingSystem = linkingSystem;
    this._bind();
    return this;
  }

  rebind({ semanticBus = this.semanticBus, waveInterferenceEngine = this.waveInterferenceEngine, linkingSystem = this.linkingSystem } = {}) {
    if (semanticBus && semanticBus !== this.semanticBus) {
      this._unbind();
      this.semanticBus = semanticBus;
    }
    if (waveInterferenceEngine) this.waveInterferenceEngine = waveInterferenceEngine;
    if (linkingSystem) this.linkingSystem = linkingSystem;
    this._bind();
    return this;
  }

  dispose() {
    this._unbind();
    this.enabled = false;
    this.waveInterferenceEngine = null;
    this.linkingSystem = null;
    this.semanticBus = null;
  }

  _bind() {
    const bus = this.semanticBus || globalThis?.semanticBus || null;
    if (!bus?.on) return;
    if (this._boundCascadeHopHandler && this._semanticBusAttached === bus) return;

    this._unbind();
    this.semanticBus = bus;
    this._semanticBusAttached = bus;

    this._boundCascadeHopHandler = (event = {}) => {
      if (!this.enabled) return;
      const waveEngine = this.waveInterferenceEngine;
      const intensity = Math.max(0, Math.min(1, Number(event.intensity ?? 0) || 0));

      // DEBUG: Log cascade.hop events (enable with window.ATOMA_DEBUG_CASCADE = true)
      if (typeof window !== 'undefined' && window.ATOMA_DEBUG_CASCADE) {
        console.log('[CascadeToWaveBridge] cascade.hop received:', {
          linkId: event.linkId,
          intensity: intensity.toFixed(3),
          hasWaveEngine: !!waveEngine?.requestBurstIntent
        });
      }

      // Primary path: send burst intent to wave engine
      if (waveEngine?.requestBurstIntent) {
        const origin = this._resolveOrigin(event);
        const link = this._resolveLink(event);
        const contract = this._resolveBurstContract(event, intensity, origin, link);

        waveEngine.requestBurstIntent({
          type: contract.type,
          reasonClass: 'semantic_event',
          sourceId: contract.sourceId,
          originPosition: origin,
          sourcePosition: origin,
          center: origin,
          fromRegime: contract.fromRegime,
          toRegime: contract.toRegime,
          intensity,
          strength: intensity,
          linkId: contract.linkId,
          link,
          sourceNode: contract.sourceNode,
          targetNode: contract.targetNode,
          travel: contract.travel,
          metadata: {
            sourceEvent: 'cascade.hop',
            sourceFamily: 'cascade',
            regime: contract.regime
          }
        });
        return;
      }

      // Fallback path: write waveField directly when wave engine is unavailable
      // This ensures visual systems always have data
      this._writeFallbackWaveField(event, intensity);
    };

    this._regDisposerCascadeHop = eventRegistrationRegistry.register(
      'CascadeToWaveBridge', 'cascade.hop', this._boundCascadeHopHandler, bus
    );
  }

  _unbind() {
    if (!this._boundCascadeHopHandler || !this._semanticBusAttached) return;
    if (typeof this._regDisposerCascadeHop === 'function') {
      this._regDisposerCascadeHop();
    } else {
      const bus = this._semanticBusAttached;
      if (bus?.unsubscribe) {
        bus.unsubscribe('cascade.hop', this._boundCascadeHopHandler);
      } else if (bus?.off) {
        bus.off('cascade.hop', this._boundCascadeHopHandler);
      }
    }
    this._semanticBusAttached = null;
    this._boundCascadeHopHandler = null;
  }

  _resolveOrigin(event = {}) {
    const direct = asVector3Like(event.position);
    if (direct) return direct;

    const link = this._resolveLink(event);
    const source = link?.source || link?.nodeA || link?.sourceNode || null;
    const target = link?.target || link?.nodeB || link?.targetNode || null;
    const sourcePos = asVector3Like(source?.position);
    const targetPos = asVector3Like(target?.position);

    if (sourcePos && targetPos) {
      return {
        x: (sourcePos.x + targetPos.x) * 0.5,
        y: (sourcePos.y + targetPos.y) * 0.5,
        z: (sourcePos.z + targetPos.z) * 0.5
      };
    }

    return sourcePos || targetPos || { x: 0, y: 0, z: 0 };
  }

  _resolveBurstContract(event = {}, intensity = 0, origin = { x: 0, y: 0, z: 0 }, link = null) {
    const sourceNode = link?.source || link?.nodeA || link?.sourceNode || null;
    const targetNode = link?.target || link?.nodeB || link?.targetNode || null;
    const linkId = event.linkId ?? event.id ?? link?.id ?? link?.userData?.id ?? null;
    const sourceId = event.fromId ?? sourceNode?.userData?.nodeId ?? sourceNode?.userData?.id ?? sourceNode?.id ?? event.sourceId ?? linkId ?? 'cascade:semantic';
    const regime = intensity > 0.7 ? 'chaotic' : 'harmonic';

    if (regime === 'chaotic') {
      return {
        type: 'corruption',
        regime,
        sourceId: `${sourceId}`,
        linkId,
        sourceNode,
        targetNode,
        travel: true,
        fromRegime: 'baseline',
        toRegime: 'rupture'
      };
    }

    return {
      type: 'synergy',
      regime,
      sourceId: `${sourceId}`,
      linkId,
      sourceNode,
      targetNode,
      travel: !!linkId,
      fromRegime: 'baseline',
      toRegime: 'collaborative'
    };
  }

  _resolveLink(event = {}) {
    const linkId = event.linkId ?? event.id ?? null;
    const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];

    if (linkId !== null && linkId !== undefined) {
      const byId = links.find((link) => (link?.id ?? link?.userData?.id) === linkId);
      if (byId) return byId;
    }

    const fromId = event.fromId ?? null;
    const toId = event.toId ?? null;
    if (fromId === null && toId === null) return null;

    return links.find((link) => {
      const sourceId = link?.source?.userData?.nodeId ?? link?.source?.userData?.id ?? link?.source?.id ?? link?.sourceNodeId ?? null;
      const targetId = link?.target?.userData?.nodeId ?? link?.target?.userData?.id ?? link?.target?.id ?? link?.targetNodeId ?? null;
      return (fromId === null || sourceId === fromId) && (toId === null || targetId === toId);
    }) || null;
  }

  /**
   * Fallback waveField writer when WaveInterferenceEngine is unavailable.
   * Writes directly to link.userData.waveField so visual systems have data.
   */
  _writeFallbackWaveField(event = {}, intensity = 0) {
    const link = this._resolveLink(event);
    if (!link) return;

    if (!link.userData) link.userData = {};

    const existing = link.userData.waveField || {};
    const phase = (Date.now() * 0.001) % (Math.PI * 2);

    // Use MAX to preserve any existing stronger values while keeping a compact public shape.
    link.userData.waveField = {
      amplitude: clamp01(Math.max(Number(existing.amplitude) || 0, intensity)),
      standing: clamp01(Math.max(Number(existing.standing) || 0, intensity * 0.5)),
      phase: Number.isFinite(existing.phase) ? existing.phase : phase,
      sourceCount: Math.max(1, Number(existing.sourceCount) || 1)
    };

    // Also write to source/target nodes if available
    const sourceNode = link?.source || link?.nodeA || link?.sourceNode || null;
    const targetNode = link?.target || link?.nodeB || link?.targetNode || null;

    [sourceNode, targetNode].forEach((node) => {
      if (!node?.userData) return;
      const nodeExisting = node.userData.waveField || {};
      node.userData.waveField = {
        amplitude: clamp01(Math.max(Number(nodeExisting.amplitude) || 0, intensity * 0.6)),
        standing: clamp01(Math.max(Number(nodeExisting.standing) || 0, intensity * 0.4)),
        phase: Number.isFinite(nodeExisting.phase) ? nodeExisting.phase : phase,
        sourceCount: Math.max(1, Number(nodeExisting.sourceCount) || 1)
      };
    });
  }
}

export default CascadeToWaveBridge_v1;
