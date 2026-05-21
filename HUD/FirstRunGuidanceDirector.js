import { SCORE_DIRECTION } from '../VisualNetworkTimeElasticity_v1.js';

export const GUIDED_FLOW_VERSION = 1;

const BEAT = Object.freeze({
  BOOT_PROMISE: 'BOOT_PROMISE',
  FIRST_BOND: 'FIRST_BOND',
  LOCAL_LATTICE: 'LOCAL_LATTICE',
  SURGE_BLOCKED: 'SURGE_BLOCKED',
  SURGE_ACTIVE: 'SURGE_ACTIVE',
  COMPLETE: 'COMPLETE'
});

const COMPLETION_HOLD_MS = 3600;

function resolveWorldKey(world) {
  return String(world || 'quantum').trim().toLowerCase();
}

function resolveGuidedStartHint(world) {
  const key = resolveWorldKey(world);
  if (key === 'desert') {
    return 'You are stabilizing a living network. In Dream Desert, patience builds the lattice before the surge can safely open.';
  }
  return 'You are stabilizing a living network. Quantum Island rewards bold links, but dirty momentum collapses unless you steady it fast.';
}

function resolveFirstBondHint(world) {
  const key = resolveWorldKey(world);
  if (key === 'desert') {
    return 'That bond gave the desert a spine. Keep spacing deliberate and build a small clean lattice before you chase momentum.';
  }
  return 'That bond woke the island. Relations are your instrument now: grow fast enough to matter, but clean enough to hold.';
}

function resolveLocalLatticeHint(world) {
  const key = resolveWorldKey(world);
  if (key === 'desert') {
    return 'Local lattice established. The desert is listening now — strengthen coherence and open the surge without rushing the hold.';
  }
  return 'Local lattice established. You have enough structure to tempt a surge, but Quantum will punish you if the hold stays dirty.';
}

function resolveSurgeBlockedHint(world, reason, buildStateLabel) {
  const key = resolveWorldKey(world);
  const posture = buildStateLabel === 'VOLATILE SURGE'
    ? 'Your surge posture is powerful, but unstable.'
    : buildStateLabel === 'FRAGILE EXPANSION'
      ? 'You are expanding faster than the lattice can cohere.'
      : buildStateLabel === 'COLLAPSE DRIFT'
        ? 'Collapse pressure is outrunning the lattice.'
        : 'The lattice needs a cleaner hold before the surge opens.';

  switch (reason) {
    case 'need-more-nodes':
      return `${posture} Add more anchors before you force the network higher.`;
    case 'need-more-links':
      return `${posture} The anchors exist, but the routes between them are still too thin.`;
    case 'quality-too-low':
      return key === 'desert'
        ? 'The desert is warning you: these bonds are too messy to hold the surge. Slow down and consolidate cleaner links.'
        : 'Quantum momentum is outrunning structure. Consolidate cleaner bonds before you push for the surge again.';
    case 'synergy-too-low':
      return key === 'desert'
        ? 'The lattice is calm but too quiet. Add a bolder connection to wake the surge without abandoning structure.'
        : 'The lattice is stable, but the island needs more charge. Risk one bolder relation to open the surge window.';
    default:
      return `${posture} Strengthen the lattice, then try the surge again.`;
  }
}

function resolveSurgeActiveHint(world) {
  const key = resolveWorldKey(world);
  if (key === 'desert') {
    return 'Stabilization surge active. The Dream Desert is holding — keep the lattice coherent and prevent collapse.';
  }
  return 'Stabilization surge active. Quantum Island is finally yielding — hold the lattice together and prevent collapse.';
}

function resolveHoldObjective(world) {
  const key = resolveWorldKey(world);
  if (key === 'desert') {
    return 'Keep the dunes coherent while pressure recedes.';
  }
  return 'Keep Quantum Island steady while collapse pressure rewinds.';
}

function meetsLocalLattice(scoreState) {
  if (!scoreState) return false;
  const connectedNodeCount = Number(scoreState.connectedNodeCount ?? 0);
  const activeLinkCount = Number(scoreState.activeLinkCount ?? 0);
  const avgLinkQuality = Number(scoreState.avgLinkQuality ?? 0);
  return connectedNodeCount >= 4 && activeLinkCount >= 3 && avgLinkQuality >= 0.5;
}

function resolveBondProgress(scoreState) {
  const connectedNodeCount = Math.max(0, Number(scoreState?.connectedNodeCount ?? 0));
  const activeLinkCount = Math.max(0, Number(scoreState?.activeLinkCount ?? 0));
  const anchors = Math.min(connectedNodeCount, 4);
  const bonds = Math.min(activeLinkCount, 3);
  return `Build a local lattice: ${bonds}/3 bonds · ${anchors}/4 anchors`;
}

function resolveSurgeObjective(world, reason, buildStateLabel) {
  if (!reason) {
    return resolveWorldKey(world) === 'desert'
      ? 'Raise coherence and let the lattice breathe before the surge.'
      : 'Raise coherence, then open the surge without letting Quantum run dirty.';
  }

  switch (reason) {
    case 'need-more-nodes':
      return 'Add more anchors before you push the network harder.';
    case 'need-more-links':
      return 'Connect the lattice more densely before you chase the surge.';
    case 'quality-too-low':
      return 'Consolidate cleaner bonds. Dirty holds cannot sustain the surge.';
    case 'synergy-too-low':
      return buildStateLabel === 'STABILIZED_LATTICE'
        ? 'Risk one bolder bond to wake the surge without losing coherence.'
        : 'Find one stronger relation to lift the lattice into surge range.';
    default:
      return 'Strengthen the lattice, then open the surge.';
  }
}

export class FirstRunGuidanceDirector {
  constructor({
    active = false,
    hintLayer = null,
    hud = null,
    loreFragmentEmitter = null,
    onComplete = null
  } = {}) {
    this._active = active === true;
    this._hintLayer = hintLayer || null;
    this._hud = hud || null;
    this._loreFragmentEmitter = loreFragmentEmitter || null;
    this._onComplete = typeof onComplete === 'function' ? onComplete : null;

    this._beat = BEAT.COMPLETE;
    this._world = 'quantum';
    this._seenFirstBond = false;
    this._localLatticeEstablished = false;
    this._blockedReason = null;
    this._completionPersisted = false;
    this._completeAfterAt = 0;
    this._lastScoreState = null;
    this._lastBuildState = null;
  }

  bind({ hintLayer, hud, loreFragmentEmitter } = {}) {
    if (hintLayer) this._hintLayer = hintLayer;
    if (hud) this._hud = hud;
    if (loreFragmentEmitter) this._loreFragmentEmitter = loreFragmentEmitter;
    this._applyLoreCuration();
    this._syncObjective();
  }

  isActive() {
    return this._active === true;
  }

  getBeat() {
    return this._beat;
  }

  handleWorldLoad({ world } = {}) {
    if (!this.isActive()) {
      this._clearOutputs();
      return false;
    }

    this._world = resolveWorldKey(world);
    this._beat = BEAT.BOOT_PROMISE;
    this._seenFirstBond = false;
    this._localLatticeEstablished = false;
    this._blockedReason = null;
    this._completeAfterAt = 0;
    this._lastScoreState = null;
    this._lastBuildState = null;
    this._applyLoreCuration();
    this._syncObjective();
    this._hintLayer?.show?.('guidedStart', { world: this._world });
    return true;
  }

  handleFirstBond(context = {}) {
    if (!this.isActive() || this._seenFirstBond) return false;
    this._world = resolveWorldKey(context.world || this._world);
    this._seenFirstBond = true;
    this._beat = BEAT.FIRST_BOND;
    this._syncObjective(context.scoreState || this._lastScoreState, context.buildState || this._lastBuildState);
    this._hintLayer?.show?.('guidedFirstBond', { world: this._world });
    this._applyLoreCuration();
    return true;
  }

  update({ world, scoreState, buildState } = {}) {
    if (!this.isActive()) return;

    this._world = resolveWorldKey(world || this._world);
    this._lastScoreState = scoreState || this._lastScoreState;
    this._lastBuildState = buildState || this._lastBuildState || this._hud?.getCurrentBuildState?.(scoreState) || null;

    if (this._completeAfterAt > 0 && performance.now() >= this._completeAfterAt) {
      this._finishCompletion();
      return;
    }

    if (this._beat === BEAT.SURGE_ACTIVE) {
      this._syncObjective(scoreState, this._lastBuildState);
      return;
    }

    if (!scoreState) {
      this._syncObjective();
      return;
    }

    if (scoreState.direction === SCORE_DIRECTION.REWIND) {
      this.handleRewindStart({ world: this._world, scoreState, buildState: this._lastBuildState });
      return;
    }

    if (!this._seenFirstBond && Number(scoreState.activeLinkCount ?? 0) > 0) {
      this.handleFirstBond({ world: this._world, scoreState, buildState: this._lastBuildState });
    }

    if (!this._localLatticeEstablished && meetsLocalLattice(scoreState)) {
      this._localLatticeEstablished = true;
      this._beat = BEAT.LOCAL_LATTICE;
      this._blockedReason = null;
      this._syncObjective(scoreState, this._lastBuildState);
      this._hintLayer?.show?.('guidedLocalLattice', { world: this._world });
      this._applyLoreCuration();
      return;
    }

    if (this._localLatticeEstablished && scoreState.rewindBlockReason) {
      const nextReason = String(scoreState.rewindBlockReason);
      if (this._blockedReason !== nextReason || this._beat !== BEAT.SURGE_BLOCKED) {
        this._beat = BEAT.SURGE_BLOCKED;
        this._blockedReason = nextReason;
        this._hintLayer?.show?.(
          'guidedSurgeBlocked',
          {
            world: this._world,
            reason: nextReason,
            buildState: this._lastBuildState?.label || null
          },
          { fingerprint: `guidedSurgeBlocked:${nextReason}` }
        );
      }
    } else if ((this._beat === BEAT.SURGE_BLOCKED || this._beat === BEAT.LOCAL_LATTICE) && !scoreState.rewindBlockReason) {
      this._beat = this._localLatticeEstablished ? BEAT.LOCAL_LATTICE : this._seenFirstBond ? BEAT.FIRST_BOND : BEAT.BOOT_PROMISE;
      this._blockedReason = null;
    }

    this._syncObjective(scoreState, this._lastBuildState);
  }

  handleRewindStart({ world, scoreState, buildState } = {}) {
    if (!this.isActive()) return false;

    this._world = resolveWorldKey(world || this._world);
    this._lastScoreState = scoreState || this._lastScoreState;
    this._lastBuildState = buildState || this._lastBuildState || this._hud?.getCurrentBuildState?.(scoreState) || null;
    this._beat = BEAT.SURGE_ACTIVE;
    this._blockedReason = null;
    this._hintLayer?.show?.('guidedSurgeActive', { world: this._world });
    this._syncObjective(this._lastScoreState, this._lastBuildState);
    this._persistCompletion();
    this._completeAfterAt = performance.now() + COMPLETION_HOLD_MS;
    this._applyLoreCuration();
    return true;
  }

  handleWin({ world, scoreState, buildState } = {}) {
    if (!this.isActive()) return false;
    this._world = resolveWorldKey(world || this._world);
    this._lastScoreState = scoreState || this._lastScoreState;
    this._lastBuildState = buildState || this._lastBuildState || this._hud?.getCurrentBuildState?.(scoreState) || null;
    this._beat = BEAT.SURGE_ACTIVE;
    this._blockedReason = null;
    this._persistCompletion();
    this._completeAfterAt = performance.now() + 1200;
    this._syncObjective(this._lastScoreState, this._lastBuildState);
    this._applyLoreCuration();
    return true;
  }

  dispose() {
    this._clearOutputs();
    this._active = false;
    this._hintLayer = null;
    this._hud = null;
    this._loreFragmentEmitter = null;
  }

  _persistCompletion() {
    if (this._completionPersisted) return;
    this._completionPersisted = true;
    this._onComplete?.({
      guidedFlowVersion: GUIDED_FLOW_VERSION,
      firstRunCompleted: true
    });
  }

  _finishCompletion() {
    this._beat = BEAT.COMPLETE;
    this._active = false;
    this._completeAfterAt = 0;
    this._clearOutputs();
  }

  _clearOutputs() {
    this._hud?.clearOnboardingObjective?.();
    this._loreFragmentEmitter?.setPresentationFilter?.(null);
  }

  _applyLoreCuration() {
    if (!this._loreFragmentEmitter?.setPresentationFilter) return;

    if (!this.isActive() || this._beat === BEAT.SURGE_ACTIVE || this._beat === BEAT.COMPLETE) {
      this._loreFragmentEmitter.setPresentationFilter(null);
      return;
    }

    this._loreFragmentEmitter.setPresentationFilter(({ trigger }) => {
      return trigger === 'world.loaded' || trigger === 'link.created';
    });
  }

  _syncObjective(scoreState = this._lastScoreState, buildState = this._lastBuildState) {
    if (!this._hud?.setOnboardingObjective) return;

    if (!this.isActive()) {
      this._hud.clearOnboardingObjective?.();
      return;
    }

    const label = buildState?.label || null;
    switch (this._beat) {
      case BEAT.BOOT_PROMISE:
        this._hud.setOnboardingObjective({
          title: 'BUILD THE LATTICE',
          detail: 'Forge your first bond'
        });
        break;
      case BEAT.FIRST_BOND:
        this._hud.setOnboardingObjective({
          title: 'BUILD THE LATTICE',
          detail: resolveBondProgress(scoreState)
        });
        break;
      case BEAT.LOCAL_LATTICE:
      case BEAT.SURGE_BLOCKED:
        this._hud.setOnboardingObjective({
          title: 'OPEN THE SURGE',
          detail: resolveSurgeObjective(this._world, this._blockedReason, label)
        });
        break;
      case BEAT.SURGE_ACTIVE:
        this._hud.setOnboardingObjective({
          title: 'PREVENT COLLAPSE',
          detail: resolveHoldObjective(this._world)
        });
        break;
      default:
        this._hud.clearOnboardingObjective?.();
        break;
    }
  }
}

export const FIRST_RUN_GUIDANCE_COPY = Object.freeze({
  guidedStart: resolveGuidedStartHint,
  guidedFirstBond: resolveFirstBondHint,
  guidedLocalLattice: resolveLocalLatticeHint,
  guidedSurgeBlocked: ({ world, reason, buildState } = {}) => resolveSurgeBlockedHint(world, reason, buildState),
  guidedSurgeActive: resolveSurgeActiveHint
});
