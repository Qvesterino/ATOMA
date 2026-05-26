/**
 * DOCTRINE RUNTIME — Run-Shaper Edition
 * Runtime integration for DoctrineLayer with RunIdentity and Metrics
 *
 * Manages mid-run draft UI, crisis phase activation, and shaper config emission.
 */

import {
  DOCTRINE_VERSION,
  RUN_SHAPER_DEFINITIONS,
  WORLD_MUTATOR_DEFINITIONS,
  CRISIS_CARD_DEFINITIONS,
  getRunShaper,
  getWorldMutator,
  getAvailableShapers,
  getAvailableMutators,
  resolveCrisisTrigger,
  sanitizeDoctrineState,
  applyDraftToState,
  computeDoctrineModifiers,
  determineMilestoneDoctrineUnlocks
} from './DoctrineLayer.js';

const CRISIS_CHECK_INTERVAL = 2.0;
const CRISIS_TICK_INTERVAL = 0.1;

export class DoctrineRuntime {
  constructor({ game = null, metricsRuntime = null, runIdentityDirector = null, semanticBus = null } = {}) {
    this._game = game;
    this._metricsRuntime = metricsRuntime;
    this._runIdentityDirector = runIdentityDirector;
    this._semanticBus = semanticBus;

    this._state = sanitizeDoctrineState();
    this._world = null;
    this._activeShaper = null;
    this._activeMutator = null;
    this._unlockedDoctrines = [];

    this._crisisCheckAccumulator = 0;
    this._crisisTickAccumulator = 0;
    this._isDraftAvailable = false;
    this._draftPhase = 'none';
    this._overlayContainer = null;
    this._overlayCard = null;

    this._handleKeyDown = (event) => this._onKeyDown(event);
    this._disposers = [];

    this._crisisCallbacks = new Map();
  }

  bind({ game, metricsRuntime, runIdentityDirector, semanticBus } = {}) {
    if (game) this._game = game;
    if (metricsRuntime) this._metricsRuntime = metricsRuntime;
    if (runIdentityDirector) this._runIdentityDirector = runIdentityDirector;
    if (semanticBus) this._semanticBus = semanticBus;
  }

  initializeForWorld(world, unlockedDoctrines = []) {
    this._world = String(world || '').trim().toLowerCase();
    this._state = sanitizeDoctrineState();
    this._draftPhase = 'none';
    this._activeShaper = null;
    this._activeMutator = null;
    this._unlockedDoctrines = Array.isArray(unlockedDoctrines) ? unlockedDoctrines : [];

    const savedState = this._loadDoctrineState();
    if (savedState) {
      const loaded = sanitizeDoctrineState(savedState);
      // Migrate any legacy unlockedDoctrines from world-scoped storage into the
      // meta-persistent field, then keep only run-local state.
      if (loaded.unlockedDoctrines?.length) {
        this._unlockedDoctrines = loaded.unlockedDoctrines;
      }
      this._state = {
        version: loaded.version,
        activeShaper: loaded.activeShaper,
        activeMutators: loaded.activeMutators,
        activeCrisis: loaded.activeCrisis,
        draftHistory: loaded.draftHistory,
        draftCount: loaded.draftCount
      };
      if (this._state.activeShaper) {
        this._activeShaper = this._state.activeShaper;
        this._emitShaperActive();
      }
    }
    // Scrub mutators that do not apply to the current world
    if (this._state.activeMutators?.length) {
      this._state.activeMutators = this._state.activeMutators.filter(id => {
        const mutator = getWorldMutator(id);
        return mutator && mutator.appliesTo.includes(this._world);
      });
    }
  }

  isDraftAvailable() {
    return this._isDraftAvailable;
  }

  triggerMidrunDraft() {
    if (!this._world) return false;
    if (this._draftPhase !== 'none') return false;

    this._draftPhase = 'shaper_selection';
    this._showDraftOverlay();
    return true;
  }

  skipDraft() {
    this._draftPhase = 'none';
    this._isDraftAvailable = true;
    this._hideOverlay();
    this._emit('draft:skip', { world: this._world });
  }

  selectShaper(shaperId) {
    const shaper = getRunShaper(shaperId);
    if (!shaper) return false;

    this._state = applyDraftToState(this._state, { shaperId }, this._world);
    this._activeShaper = shaperId;

    this._emitShaperActive();

    if (this._draftPhase === 'shaper_selection') {
      this._draftPhase = 'mutator_selection';
      this._renderDraftOverlay();
    }

    return true;
  }

  selectMutator(mutatorId) {
    const mutator = getWorldMutator(mutatorId);
    if (!mutator) return false;

    if (!this._world || !mutator.appliesTo.includes(this._world)) return false;

    this._state = applyDraftToState(this._state, { mutatorId }, this._world);
    this._activeMutator = mutatorId;

    this._draftPhase = 'none';
    this._isDraftAvailable = true;
    this._saveDoctrineState();
    this._hideOverlay();

    this._emit('draft:complete', {
      shaperId: this._activeShaper,
      mutatorId: this._activeMutator,
      world: this._world
    });

    return true;
  }

  forceMutatorSelection(mutatorId) {
    return this.selectMutator(mutatorId);
  }

  triggerCrisis(crisisId, duration = 15) {
    const crisis = CRISIS_CARD_DEFINITIONS[crisisId];
    if (!crisis) return false;

    this._state = {
      ...this._state,
      activeCrisis: {
        id: crisisId,
        startTime: Date.now(),
        duration
      }
    };

    this._emit('crisis:start', { crisisId, duration, crisis });

    return true;
  }

  endCrisis() {
    if (!this._state.activeCrisis) return false;

    const crisisId = this._state.activeCrisis.id;
    this._state = {
      ...this._state,
      activeCrisis: null
    };

    this._emit('crisis:end', { crisisId });

    return true;
  }

  isCrisisActive() {
    return this._state.activeCrisis !== null;
  }

  getActiveCrisis() {
    return this._state.activeCrisis ? CRISIS_CARD_DEFINITIONS[this._state.activeCrisis.id] : null;
  }

  getState() {
    return {
      ...this._state,
      unlockedDoctrines: this._unlockedDoctrines
    };
  }

  setUnlockedDoctrines(doctrines) {
    this._unlockedDoctrines = Array.isArray(doctrines) ? doctrines : [];
  }

  getModifiers() {
    return computeDoctrineModifiers(this._state);
  }

  getActiveShaper() {
    return this._activeShaper;
  }

  getActiveShaperConfig() {
    return this._activeShaper ? RUN_SHAPER_DEFINITIONS[this._activeShaper] : null;
  }

  applyModifiersToMetrics(rawMetrics = {}) {
    const modifiers = this.getModifiers();

    const applied = {
      synergy: rawMetrics.synergy * (modifiers.synergy.scale || 1),
      harmony: rawMetrics.harmony * (modifiers.harmony.scale || 1),
      stability: Math.min(rawMetrics.stability * (modifiers.stability.scale || 1), modifiers.stability.softCap || 1),
      corruption: rawMetrics.corruption * (modifiers.corruption.scale || 1),
      loadPressure: rawMetrics.loadPressure * (modifiers.loadPressure.scale || 1)
    };

    return applied;
  }

  onCrisis(callback) {
    const id = Symbol('crisis_cb');
    this._crisisCallbacks.set(id, callback);
    return () => this._crisisCallbacks.delete(id);
  }

  update(deltaTime) {
    if (!this._world) return;

    this._crisisCheckAccumulator += deltaTime;
    if (this._crisisCheckAccumulator >= CRISIS_CHECK_INTERVAL) {
      this._crisisCheckAccumulator = 0;
      this._checkCrisisTrigger();
    }

    if (this._state.activeCrisis) {
      this._crisisTickAccumulator += deltaTime;
      if (this._crisisTickAccumulator >= CRISIS_TICK_INTERVAL) {
        this._crisisTickAccumulator = 0;
        this._tickCrisis();
      }
    }
  }

  dispose() {
    this._hideOverlay();
    document.removeEventListener('keydown', this._handleKeyDown, true);
    this._crisisCallbacks.clear();
    this._disposers.forEach(fn => fn());
    this._disposers = [];
  }

  _emitShaperActive() {
    const shaperConfig = this.getActiveShaperConfig();
    if (!shaperConfig) return;

    // Emit on internal callbacks (for DoctrineRuntime consumers)
    this._emit('shaperActive', {
      shaperId: this._activeShaper,
      shaperConfig,
      world: this._world
    });

    // Emit on semantic bus (for CrisisPhaseDirector, NetworkTensionRuntime, etc.)
    if (this._semanticBus && typeof this._semanticBus.emit === 'function') {
      this._semanticBus.emit('doctrine.shaperActive', {
        shaperId: this._activeShaper,
        shaperConfig,
        world: this._world
      }, { priority: this._semanticBus.priority?.NORMAL ?? 2 });
    }
  }

  _checkCrisisTrigger() {
    if (this._state.activeCrisis) return;

    const metrics = this._getCurrentMetrics();
    const trigger = resolveCrisisTrigger(metrics);

    if (trigger) {
      const crisis = CRISIS_CARD_DEFINITIONS[trigger.crisis];
      if (crisis) {
        this.triggerCrisis(trigger.crisis, crisis.duration);
      }
    }
  }

  _tickCrisis() {
    if (!this._state.activeCrisis) return;

    const elapsed = (Date.now() - this._state.activeCrisis.startTime) / 1000;
    const remaining = this._state.activeCrisis.duration - elapsed;

    if (remaining <= 0) {
      this.endCrisis();
      return;
    }

    const crisis = CRISIS_CARD_DEFINITIONS[this._state.activeCrisis.id];
    if (crisis) {
      this._emit('crisis:tick', {
        crisisId: crisis.id,
        remaining,
        crisis
      });
    }
  }

  _getCurrentMetrics() {
    if (!this._metricsRuntime) return { synergy: 0, harmony: 0, stability: 0, corruption: 0, loadPressure: 0 };

    const live = this._metricsRuntime.getLiveMetrics?.() || this._metricsRuntime._liveMetrics || {};
    return {
      synergy: live.networkSynergy || 0,
      harmony: live.harmonyFlow || 0,
      stability: 1 - (live.networkStress || 0),
      corruption: live.corruptionLevel || 0,
      loadPressure: live.loadPressure || 0
    };
  }

  _emit(event, data) {
    this._crisisCallbacks.forEach(cb => {
      try { cb(event, data); } catch (e) { console.warn('[DoctrineRuntime] crisis callback error:', e); }
    });
  }

  _showDraftOverlay() {
    if (typeof document === 'undefined') return;

    if (!this._overlayContainer) {
      this._createOverlayDOM();
    }

    this._renderDraftOverlay();
    this._overlayContainer.classList.add('visible');
    document.addEventListener('keydown', this._handleKeyDown, true);
  }

  _hideOverlay() {
    if (!this._overlayContainer) return;
    this._overlayContainer.classList.remove('visible');
    document.removeEventListener('keydown', this._handleKeyDown, true);
  }

  _renderDraftOverlay() {
    if (!this._overlayCard) return;

    this._overlayCard.innerHTML = '';

    if (this._draftPhase === 'shaper_selection') {
      this._renderShaperSelection();
    } else if (this._draftPhase === 'mutator_selection') {
      this._renderMutatorSelection();
    }
  }

  _renderShaperSelection() {
    const shapers = getAvailableShapers(this._world, this._unlockedDoctrines);

    const eyebrow = document.createElement('div');
    eyebrow.className = 'doctrine-overlay-eyebrow';
    eyebrow.textContent = 'MIDRUN DOCTRINE';

    const title = document.createElement('div');
    title.className = 'doctrine-overlay-title';
    title.textContent = 'Choose Your Run-Shaper';

    const subtitle = document.createElement('div');
    subtitle.className = 'doctrine-overlay-subtitle';
    subtitle.textContent = 'This shapes the type of decisions you make for the rest of this run.';

    this._overlayCard.appendChild(eyebrow);
    this._overlayCard.appendChild(title);
    this._overlayCard.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.className = 'doctrine-overlay-grid';

    for (const shaper of shapers) {
      if (!RUN_SHAPER_DEFINITIONS[shaper.id]) continue;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'doctrine-option-card';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'doctrine-option-title';
      cardTitle.textContent = shaper.label;

      const cardDesc = document.createElement('div');
      cardDesc.className = 'doctrine-option-desc';
      cardDesc.textContent = shaper.description;

      const modTags = document.createElement('div');
      modTags.className = 'doctrine-option-mods';

      // Decision-type tag
      const decisionTag = document.createElement('span');
      decisionTag.className = 'doctrine-mod-tag decision';
      decisionTag.textContent = shaper.decisionType.toUpperCase();
      modTags.appendChild(decisionTag);

      // Crisis pattern tag
      const crisisTag = document.createElement('span');
      crisisTag.className = 'doctrine-mod-tag crisis';
      const peakScale = shaper.crisisPattern.peakDurationScale;
      crisisTag.textContent = peakScale < 1 ? 'SHORT PEAK' : peakScale > 1 ? 'LONG PEAK' : 'BALANCED';
      modTags.appendChild(crisisTag);

      // Counterplay tag
      const cp = shaper.counterplayPayoff;
      const counterplayTag = document.createElement('span');
      counterplayTag.className = 'doctrine-mod-tag counterplay';
      if (cp.reinforceDurationScale > 1.2) {
        counterplayTag.textContent = 'REINFORCE+';
      } else if (cp.rerouteReliefScale > 1.2) {
        counterplayTag.textContent = 'REROUTE+';
      } else if (cp.abandonStabilityBonus > 0) {
        counterplayTag.textContent = 'ABANDON+';
      } else {
        counterplayTag.textContent = 'REWIND+';
      }
      modTags.appendChild(counterplayTag);

      card.appendChild(cardTitle);
      card.appendChild(cardDesc);
      card.appendChild(modTags);

      card.addEventListener('click', () => this.selectShaper(shaper.id));
      grid.appendChild(card);
    }

    this._overlayCard.appendChild(grid);

    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'doctrine-skip-btn';
    skip.textContent = 'Skip Doctrine (Neutral Run)';
    skip.addEventListener('click', () => this.skipDraft());
    this._overlayCard.appendChild(skip);
  }

  _renderMutatorSelection() {
    const unlocked = new Set(this._unlockedDoctrines);
    const shaper = this._state.activeShaper;
    // Only show mutators if a shaper is already chosen; filter by unlock state
    if (!shaper) {
      this.skipDraft();
      return;
    }
    const mutators = getAvailableMutators(this._world).filter(m => unlocked.has(m.id));

    const eyebrow = document.createElement('div');
    eyebrow.className = 'doctrine-overlay-eyebrow';
    eyebrow.textContent = 'MIDRUN DOCTRINE';

    const title = document.createElement('div');
    title.className = 'doctrine-overlay-title';
    title.textContent = 'Choose World Mutator';

    const subtitle = document.createElement('div');
    subtitle.className = 'doctrine-overlay-subtitle';
    subtitle.textContent = 'How does this world respond to your doctrine?';

    this._overlayCard.appendChild(eyebrow);
    this._overlayCard.appendChild(title);
    this._overlayCard.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.className = 'doctrine-overlay-grid';

    for (const mutator of mutators) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'doctrine-option-card';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'doctrine-option-title';
      cardTitle.textContent = mutator.label;

      const cardDesc = document.createElement('div');
      cardDesc.className = 'doctrine-option-desc';
      cardDesc.textContent = mutator.description;

      card.appendChild(cardTitle);
      card.appendChild(cardDesc);

      card.addEventListener('click', () => this.selectMutator(mutator.id));
      grid.appendChild(card);
    }

    this._overlayCard.appendChild(grid);
  }

  _createOverlayDOM() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('doctrine-overlay-styles')) {
      const style = document.createElement('style');
      style.id = 'doctrine-overlay-styles';
      style.textContent = `
        #doctrine-overlay {
          position: fixed;
          inset: 0;
          z-index: 12200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 9, 16, 0.72);
          backdrop-filter: blur(16px) saturate(1.1);
          -webkit-backdrop-filter: blur(16px) saturate(1.1);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }
        #doctrine-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .doctrine-card {
          width: min(860px, calc(100vw - 48px));
          background: linear-gradient(180deg, rgba(9, 14, 24, 0.95), rgba(6, 10, 18, 0.96));
          border: 1px solid rgba(140, 180, 255, 0.2);
          border-radius: 20px;
          box-shadow: 0 28px 56px rgba(0, 0, 0, 0.5), 0 0 32px rgba(80, 140, 255, 0.08);
          color: rgba(220, 236, 250, 0.96);
          padding: 26px 28px 24px;
        }
        .doctrine-overlay-eyebrow {
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(140, 180, 255, 0.6);
          margin-bottom: 8px;
        }
        .doctrine-overlay-title {
          font-size: 26px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #eef9ff;
          margin-bottom: 6px;
        }
        .doctrine-overlay-subtitle {
          font-size: 13px;
          letter-spacing: 0.04em;
          color: rgba(202, 222, 240, 0.7);
          margin-bottom: 22px;
          line-height: 1.5;
        }
        .doctrine-overlay-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .doctrine-option-card {
          border: 1px solid rgba(120, 180, 255, 0.14);
          border-radius: 16px;
          background: rgba(14, 22, 34, 0.8);
          padding: 16px 16px 14px;
          cursor: pointer;
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          text-align: left;
        }
        .doctrine-option-card:hover {
          border-color: rgba(120, 180, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        .doctrine-option-title {
          font-size: 16px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f2fbff;
          margin-bottom: 6px;
        }
        .doctrine-option-desc {
          font-size: 11.5px;
          line-height: 1.45;
          letter-spacing: 0.03em;
          color: rgba(196, 214, 230, 0.72);
          margin-bottom: 10px;
        }
        .doctrine-option-mods {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .doctrine-mod-tag {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(100, 160, 255, 0.12);
          color: rgba(180, 220, 255, 0.88);
        }
        .doctrine-mod-tag.decision { background: rgba(255, 160, 80, 0.15); color: rgba(255, 200, 140, 0.9); }
        .doctrine-mod-tag.crisis { background: rgba(255, 100, 160, 0.15); color: rgba(255, 140, 180, 0.9); }
        .doctrine-mod-tag.counterplay { background: rgba(0, 212, 255, 0.15); color: rgba(100, 240, 255, 0.9); }
        .doctrine-skip-btn {
          display: block;
          margin: 18px auto 0;
          border: 1px solid rgba(120, 180, 255, 0.18);
          border-radius: 999px;
          background: rgba(11, 18, 28, 0.92);
          color: rgba(196, 214, 230, 0.72);
          font: 600 12px/1 'Rajdhani', 'Segoe UI', sans-serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 10px 20px;
          cursor: pointer;
          transition: border-color 0.18s ease;
        }
        .doctrine-skip-btn:hover {
          border-color: rgba(120, 180, 255, 0.3);
        }
      `;
      document.head.appendChild(style);
    }

    this._overlayContainer = document.createElement('div');
    this._overlayContainer.id = 'doctrine-overlay';

    this._overlayCard = document.createElement('div');
    this._overlayCard.className = 'doctrine-card';

    this._overlayContainer.appendChild(this._overlayCard);
    document.body.appendChild(this._overlayContainer);
  }

  _onKeyDown(event) {
    if (!this._overlayContainer?.classList.contains('visible')) return;
    if (event.defaultPrevented) return;

    if (event.code === 'Escape') {
      event.preventDefault();
      this.skipDraft();
    }
  }

  _storageKey() {
    return `atoma_doctrine_state_${this._world || 'global'}`;
  }

  _loadDoctrineState() {
    try {
      const saved = localStorage.getItem(this._storageKey());
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }

  _saveDoctrineState() {
    try {
      const runLocal = {
        version: this._state.version,
        activeShaper: this._state.activeShaper,
        activeMutators: this._state.activeMutators,
        activeCrisis: this._state.activeCrisis,
        draftHistory: this._state.draftHistory,
        draftCount: this._state.draftCount
      };
      localStorage.setItem(this._storageKey(), JSON.stringify(runLocal));
    } catch { }
  }
}

export default DoctrineRuntime;
