/**
 * CascadeToWaveBridge_v1
 * ----------------------
 * Event-driven bridge from cascade propagation to wave burst intent.
 *
 * No renderer, no scheduler, no visual logic.
 * It only listens to cascade.hop and forwards burst intents.
 */

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
      if (!waveEngine?.requestBurstIntent) return;

      const intensity = Math.max(0, Math.min(1, Number(event.intensity ?? 0) || 0));
      const origin = this._resolveOrigin(event);

      waveEngine.requestBurstIntent({
        type: 'cascade',
        origin,
        intensity,
        regime: intensity > 0.7 ? 'chaotic' : 'harmonic'
      });
    };

    bus.on('cascade.hop', this._boundCascadeHopHandler);
  }

  _unbind() {
    if (!this._boundCascadeHopHandler || !this._semanticBusAttached) return;
    const bus = this._semanticBusAttached;
    if (bus?.unsubscribe) {
      bus.unsubscribe('cascade.hop', this._boundCascadeHopHandler);
    } else if (bus?.off) {
      bus.off('cascade.hop', this._boundCascadeHopHandler);
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
}

export default CascadeToWaveBridge_v1;
