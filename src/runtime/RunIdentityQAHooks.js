import { isRunIdentityWorld } from '../../RunIdentityProfiles.js';

function normalizeWorld(world) {
  return String(world || '').trim().toLowerCase() || null;
}

export function buildRunIdentityOverlayQAState({
  world = null,
  director = null,
  preparedSelection = null,
  isPaused = false
} = {}) {
  const normalizedWorld = normalizeWorld(world);
  return {
    world: normalizedWorld,
    isVisible: director?.isOverlayVisible?.() === true,
    isReleaseWorld: isRunIdentityWorld(normalizedWorld),
    hasPreparedSelection: Boolean(preparedSelection),
    preparedPackageId: preparedSelection?.packageId || null,
    preparedWorldStateId: preparedSelection?.worldStateId || null,
    isPaused: isPaused === true
  };
}

export function commitPreparedRunIdentityForQA({
  world = null,
  director = null,
  preparedSelection = null,
  activeSelection = null,
  isPaused = false,
  lazyPrepare = null
} = {}) {
  const normalizedWorld = normalizeWorld(world);
  const overlayWasVisible = director?.isOverlayVisible?.() === true;
  const baseResult = {
    world: normalizedWorld,
    overlayWasVisible,
    resumed: isPaused !== true
  };

  if (!director?.commitSelection || !director?.getPreparedSelection) {
    return {
      ok: false,
      reason: 'run-identity-unavailable',
      packageId: null,
      worldStateId: null,
      ...baseResult
    };
  }

  if (!isRunIdentityWorld(normalizedWorld)) {
    return {
      ok: false,
      reason: 'world-not-supported',
      packageId: null,
      worldStateId: null,
      ...baseResult
    };
  }

  let nextPreparedSelection = preparedSelection || director.getPreparedSelection?.() || null;
  if (!nextPreparedSelection || nextPreparedSelection.world !== normalizedWorld) {
    nextPreparedSelection = typeof lazyPrepare === 'function'
      ? lazyPrepare(normalizedWorld)
      : null;
  }

  if (!nextPreparedSelection) {
    return {
      ok: false,
      reason: 'selection-unavailable',
      packageId: null,
      worldStateId: null,
      ...baseResult
    };
  }

  const resolvedActiveSelection = activeSelection || director.getActiveRuntimeSelection?.() || null;
  const matchesActiveSelection =
    resolvedActiveSelection?.world === nextPreparedSelection.world &&
    resolvedActiveSelection?.packageId === nextPreparedSelection.packageId &&
    resolvedActiveSelection?.worldStateId === nextPreparedSelection.worldStateId;

  if (matchesActiveSelection && overlayWasVisible !== true) {
    return {
      ok: false,
      reason: 'already-committed',
      packageId: nextPreparedSelection.packageId || null,
      worldStateId: nextPreparedSelection.worldStateId || null,
      ...baseResult
    };
  }

  const committedSelection = director.commitSelection(nextPreparedSelection);
  if (!committedSelection) {
    return {
      ok: false,
      reason: 'selection-unavailable',
      packageId: nextPreparedSelection.packageId || null,
      worldStateId: nextPreparedSelection.worldStateId || null,
      ...baseResult
    };
  }

  return {
    ok: true,
    reason: null,
    packageId: committedSelection.packageId || null,
    worldStateId: committedSelection.worldStateId || null,
    ...baseResult
  };
}
