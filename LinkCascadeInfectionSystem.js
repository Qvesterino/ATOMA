/**
 * LinkCascadeInfectionSystem
 * --------------------------
 * Scheduler-driven link infection layer.
 *
 * Responsibilities:
 * - Maintain link.userData.cascadeInfection state
 * - Update infection growth/decay on the slow semantic tick
 * - Propagate to adjacent links when intensity exceeds threshold
 * - Emit cascade.hop events on propagation
 * - Expose infection intensity as link.userData.cascadeIntensity
 *
 * This module is intentionally isolated from rendering systems.
 */

export class LinkCascadeInfectionSystem {
  constructor(linkingSystem = null, options = {}) {
    this.linkingSystem = linkingSystem;
    this.semanticBus = options.semanticBus ?? globalThis?.semanticBus ?? null;
    this.enabled = options.enabled ?? true;

    this.growthRate = options.growthRate ?? 0.12;
    this.decayRate = options.decayRate ?? 0.08;
    this.propagationThreshold = options.propagationThreshold ?? 0.7;
    this.propagationBoost = options.propagationBoost ?? 0.35;
    this.propagationCooldownMs = options.propagationCooldownMs ?? 200;
    this.activityWindowMs = options.activityWindowMs ?? 450;
    this.minVisibleIntensity = options.minVisibleIntensity ?? 0.001;

    this.stats = {
      activeLinks: 0,
      propagatedLinks: 0,
      propagatedHops: 0
    };
  }

  init({ linkingSystem = null, semanticBus = null } = {}) {
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    if (semanticBus) {
      this.semanticBus = semanticBus;
    }
    return this;
  }

  rebind({ linkingSystem = this.linkingSystem, semanticBus = this.semanticBus } = {}) {
    if (linkingSystem) {
      this.linkingSystem = linkingSystem;
    }
    if (semanticBus) {
      this.semanticBus = semanticBus;
    }
    return this;
  }

  dispose() {
    this.enabled = false;
    this.linkingSystem = null;
    this.semanticBus = null;
  }

  update(deltaTime = 0) {
    if (!this.enabled || !this.linkingSystem) return this.stats;

    const links = Array.isArray(this.linkingSystem.links) ? this.linkingSystem.links : [];
    if (!links.length) {
      this.stats.activeLinks = 0;
      this.stats.propagatedLinks = 0;
      this.stats.propagatedHops = 0;
      return this.stats;
    }

    const now = this._now();
    const dt = Math.max(0, Number(deltaTime) || 0);
    const snapshot = new Map();

    for (const link of links) {
      const state = this._ensureState(link, now);
      snapshot.set(link, {
        state,
        current: state.intensity,
        next: state.intensity
      });
    }

    // Phase 1: growth/decay update using a snapshot of the previous tick.
    for (const [link, entry] of snapshot.entries()) {
      const { state } = entry;
      const upstreamIntensity = this._readInputIntensity(link);

      if (upstreamIntensity > entry.current) {
        entry.current = upstreamIntensity;
        state.intensity = upstreamIntensity;
        state.lastActiveAt = now;
      }

      const recentlyActive = (now - (state.lastActiveAt ?? 0)) <= this.activityWindowMs;
      let nextIntensity = entry.current;

      if (recentlyActive) {
        const growth = this.growthRate * dt * (1 - nextIntensity);
        nextIntensity = Math.min(1, nextIntensity + growth);
      } else {
        const decay = this.decayRate * dt * nextIntensity;
        nextIntensity = Math.max(0, nextIntensity - decay);
      }

      if (nextIntensity < this.minVisibleIntensity) {
        nextIntensity = 0;
      }

      entry.next = nextIntensity;
      state.previousIntensity = entry.current;
      state.intensity = nextIntensity;
      state.active = nextIntensity > 0;

      if (state.active) {
        state.lastActiveAt = now;
        state.phase = (Number(state.phase) || 0) + (dt * 1.2);
      }
    }

    // Phase 2: propagation from strong links to neighbor links.
    const pairCooldown = new Set();
    let propagatedLinks = 0;
    let propagatedHops = 0;

    for (const [link, entry] of snapshot.entries()) {
      const sourceIntensity = entry.next;
      const state = entry.state;
      if (sourceIntensity <= this.propagationThreshold) continue;

      if ((now - (state.lastPropagationAt ?? 0)) < this.propagationCooldownMs) {
        continue;
      }

      const neighbors = this._getNeighborLinks(link);
      if (!neighbors.length) continue;

      let sourcePropagated = false;
      for (const neighbor of neighbors) {
        if (!neighbor || neighbor === link) continue;

        const neighborEntry = snapshot.get(neighbor) || null;
        const neighborState = neighborEntry?.state || this._ensureState(neighbor, now);
        const propagatedIntensity = Math.min(1, Math.max(
          neighborState.intensity ?? 0,
          sourceIntensity * this.propagationBoost
        ));

        if (propagatedIntensity <= (neighborState.intensity ?? 0)) continue;

        const pairKey = `${this._getLinkId(link)}->${this._getLinkId(neighbor)}`;
        if (pairCooldown.has(pairKey)) continue;
        pairCooldown.add(pairKey);

        neighborState.previousIntensity = neighborState.intensity ?? 0;
        neighborState.intensity = propagatedIntensity;
        neighborState.active = propagatedIntensity > 0;
        neighborState.phase = Number(state.phase) || 0;
        neighborState.lastActiveAt = now;
        neighborState.lastPropagationAt = now;

        this._writeCascadeIntensity(neighbor, propagatedIntensity);
        this._emitHop({
          linkId: this._getLinkId(link),
          fromId: this._getLinkId(link),
          toId: this._getLinkId(neighbor),
          intensity: propagatedIntensity
        });

        propagatedHops++;
        sourcePropagated = true;
      }

      if (sourcePropagated) {
        state.lastPropagationAt = now;
        propagatedLinks++;
      }
    }

    // Phase 3: publish canonical cascadeIntensity for visual systems.
    let activeLinks = 0;
    for (const [link, entry] of snapshot.entries()) {
      const intensity = entry.state.intensity ?? 0;
      if (intensity > 0) activeLinks++;
      this._writeCascadeIntensity(link, intensity);
      this._writeFallbackWaveField(link, entry.state);
    }

    this.stats.activeLinks = activeLinks;
    this.stats.propagatedLinks = propagatedLinks;
    this.stats.propagatedHops = propagatedHops;

    // DEBUG: Log infection data flow (enable with window.ATOMA_DEBUG_CASCADE = true)
    if (typeof window !== 'undefined' && window.ATOMA_DEBUG_CASCADE && activeLinks > 0) {
      const sample = snapshot.entries().next()?.value?.[0];
      if (sample?.userData?.waveField) {
        console.log('[LinkCascadeInfectionSystem] waveField sample:', {
          linkId: sample.id,
          infection: sample.userData.cascadeInfection?.intensity?.toFixed(3),
          waveFieldAmplitude: sample.userData.waveField.amplitude?.toFixed(3),
          propagatedHops: propagatedHops
        });
      }
    }

    return this.stats;
  }

  _ensureState(link, now = this._now()) {
    if (!link) {
      return {
        intensity: 0,
        previousIntensity: 0,
        active: false,
        lastActiveAt: now,
        lastPropagationAt: 0
      };
    }

    if (!link.userData) link.userData = {};
    const userData = link.userData;

    if (!userData.cascadeInfection || typeof userData.cascadeInfection !== 'object') {
      const seededIntensity = this._readInputIntensity(link);
      userData.cascadeInfection = {
        intensity: seededIntensity,
        previousIntensity: seededIntensity,
        active: seededIntensity > 0,
        phase: 0,
        lastActiveAt: seededIntensity > 0 ? now : 0,
        lastPropagationAt: 0
      };
    }

    const state = userData.cascadeInfection;
    if (typeof state.intensity !== 'number') state.intensity = 0;
    if (typeof state.previousIntensity !== 'number') state.previousIntensity = state.intensity;
    if (typeof state.phase !== 'number') state.phase = 0;
    if (typeof state.lastActiveAt !== 'number') state.lastActiveAt = state.intensity > 0 ? now : 0;
    if (typeof state.lastPropagationAt !== 'number') state.lastPropagationAt = 0;
    state.active = state.intensity > 0;
    return state;
  }

  _getNeighborLinks(link) {
    const linkingSystem = this.linkingSystem;
    if (!linkingSystem) return [];

    const neighbors = [];
    const seen = new Set();
    const addCandidates = (node) => {
      if (!node) return;
      const candidates = this._getLinksForNode(node);
      for (const candidate of candidates) {
        if (!candidate || candidate === link || seen.has(candidate)) continue;
        seen.add(candidate);
        neighbors.push(candidate);
      }
    };

    addCandidates(link?.source || link?.nodeA || link?.sourceNode || null);
    addCandidates(link?.target || link?.nodeB || link?.targetNode || null);
    return neighbors;
  }

  _getLinksForNode(node) {
    const linkingSystem = this.linkingSystem;
    if (!linkingSystem || !node) return [];

    if (typeof linkingSystem.getLinksForNode === 'function') {
      try {
        return linkingSystem.getLinksForNode(node) || [];
      } catch {
        return [];
      }
    }

    if (linkingSystem.linksByNode instanceof Map) {
      const id = this._getNodeId(node);
      if (id === null || id === undefined) return [];
      return linkingSystem.linksByNode.get(id) || [];
    }

    return Array.isArray(linkingSystem.links) ? linkingSystem.links : [];
  }

  _readInputIntensity(link) {
    const direct = Number(link?.userData?.cascadeIntensity);
    if (Number.isFinite(direct)) return Math.max(0, Math.min(1, direct));

    const flow = Number(link?.userData?.flowState?.intensity);
    if (Number.isFinite(flow)) return Math.max(0, Math.min(1, flow));

    const synergy = Number(link?.userData?.synergy?.score);
    if (Number.isFinite(synergy)) {
      return Math.max(0, Math.min(1, synergy / 100));
    }

    return 0;
  }

  _writeCascadeIntensity(link, infectionIntensity) {
    if (!link) return;
    if (!link.userData) link.userData = {};

    // Read baseline from LinkSemanticMetricsBridge (primary writer)
    const baseline = Number(link.userData.cascadeIntensity) || 0;

    // Infection can only BOOST the baseline, never replace or reduce it
    // This preserves the semantic baseline while allowing infection propagation
    const modulated = Math.max(baseline, Number(infectionIntensity) || 0);

    link.userData.cascadeIntensity = Math.max(0, Math.min(1, modulated));
  }

  _writeFallbackWaveField(link, infection) {
    if (!link?.userData || !infection?.active) return;

    const i = Math.max(0, Math.min(1, Number(infection.intensity) || 0));
    if (i <= 0) return;

    // Fallback only: preserve stronger values already authored by waveEngine.
    const existing = link.userData.waveField;
    const fallback = {
      amplitude: i,
      constructive: i * 0.6,
      destructive: i * 0.4,
      standing: i * 0.3,
      phase: infection.phase || 0
    };

    if (!existing || typeof existing !== 'object') {
      link.userData.waveField = fallback;
      return;
    }

    link.userData.waveField = {
      amplitude: Math.max(Number(existing.amplitude) || 0, fallback.amplitude),
      constructive: Math.max(Number(existing.constructive) || 0, fallback.constructive),
      destructive: Math.max(Number(existing.destructive) || 0, fallback.destructive),
      standing: Math.max(Number(existing.standing) || 0, fallback.standing),
      phase: Number.isFinite(existing.phase) ? existing.phase : fallback.phase
    };
  }

  _emitHop(payload) {
    if (!this.semanticBus?.emit) return;
    this.semanticBus.emit('cascade.hop', payload, {
      priority: this.semanticBus.priority?.NORMAL ?? this.semanticBus.priority?.INTERACTIVE
    });
  }

  _getLinkId(link) {
    return link?.id ?? link?.userData?.id ?? link?.userData?.linkId ?? null;
  }

  _getNodeId(node) {
    if (!node) return null;
    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.id ?? node?.uuid ?? null;
  }

  _now() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }
}

export default LinkCascadeInfectionSystem;
