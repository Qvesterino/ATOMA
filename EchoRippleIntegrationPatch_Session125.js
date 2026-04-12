import { EchoRippleSystem_Session125 } from './EchoRippleSystem_Session125.js';

const DEFAULT_ECHO_CONFIG = {
  enabled: true,
  debugMode: false,
  maxRipplesPerNode: 6,
  maxTotalRipples: 96,
  maxPropagationDepth: 2,
  maxPropagationBranches: 3,
  minPropagationIntensity: 0.18,
  globalCooldownSeconds: 0.05,
  nodeCooldownSeconds: 0.24,
  linkCooldownSeconds: 0.32,
  propagationDelay: 0.16,
  propagationDecay: 0.72,
  rippleLifetime: 0.92,
  rippleStartRadius: 0.16,
  rippleMaxRadius: 2.8,
  rippleVerticalOffset: 0.055,
  auraDeformationStrength: 0.35,
  auraImpactDuration: 0.18
};

function resolveNodeAuraSystem(linkResonanceFlowSystem, explicitNodeAuraSystem = null) {
  return explicitNodeAuraSystem
    ?? linkResonanceFlowSystem?.nodeAuraSystem
    ?? linkResonanceFlowSystem?.world?.nodeAuraSystem
    ?? globalThis.game?.nodeAuraSystem
    ?? null;
}

function resolveScene(linkResonanceFlowSystem) {
  return linkResonanceFlowSystem?.scene
    ?? linkResonanceFlowSystem?.world?.scene
    ?? globalThis.game?.scene
    ?? null;
}

function resolveWorld(linkResonanceFlowSystem) {
  return linkResonanceFlowSystem?.world
    ?? globalThis.game?.world
    ?? null;
}

function ensureEchoIntegrationState(linkResonanceFlowSystem) {
  if (!linkResonanceFlowSystem.__echoRippleIntegrationState) {
    linkResonanceFlowSystem.__echoRippleIntegrationState = {
      applied: false,
      originalUpdate: null,
      originalDispose: null,
      originalClearLink: null,
      originalRebindScene: null,
      originalBeginPulseEcho: null,
      originalSpawnRippleOnWaveBurst: null,
      originalSpawnRippleOnCascadeHop: null,
      cascadeHopHandler: null,
      cascadeHopTarget: null
    };
  }

  return linkResonanceFlowSystem.__echoRippleIntegrationState;
}

export function integrateEchoRippleSystem(
  scene,
  world,
  linkResonanceSystem,
  nodeAuraSystem,
  config = {}
) {
  return new EchoRippleSystem_Session125(
    scene,
    world,
    linkResonanceSystem,
    nodeAuraSystem,
    {
      ...DEFAULT_ECHO_CONFIG,
      ...config
    }
  );
}

export function applyEchoRippleIntegration(linkResonanceFlowSystem, cascadeSystem = null, nodeAuraSystem = null) {
  if (!linkResonanceFlowSystem) {
    console.error('[EchoRippleIntegration] linkResonanceFlowSystem parameter is required');
    return null;
  }

  const state = ensureEchoIntegrationState(linkResonanceFlowSystem);
  if (state.applied && linkResonanceFlowSystem.echoRippleSystem) {
    if (nodeAuraSystem) {
      linkResonanceFlowSystem.echoRippleSystem.attachNodeAuraSystem(nodeAuraSystem);
    }
    return linkResonanceFlowSystem;
  }

  const scene = resolveScene(linkResonanceFlowSystem);
  const world = resolveWorld(linkResonanceFlowSystem);
  const resolvedNodeAuraSystem = resolveNodeAuraSystem(linkResonanceFlowSystem, nodeAuraSystem);

  const echoRippleSystem = new EchoRippleSystem_Session125(
    scene,
    world,
    linkResonanceFlowSystem,
    resolvedNodeAuraSystem,
    DEFAULT_ECHO_CONFIG
  );

  linkResonanceFlowSystem.echoRippleSystem = echoRippleSystem;
  linkResonanceFlowSystem.cascadeSystem = cascadeSystem;

  state.originalUpdate = state.originalUpdate || linkResonanceFlowSystem.update?.bind(linkResonanceFlowSystem) || null;
  state.originalDispose = state.originalDispose || linkResonanceFlowSystem.dispose?.bind(linkResonanceFlowSystem) || null;
  state.originalClearLink = state.originalClearLink || linkResonanceFlowSystem.clearLink?.bind(linkResonanceFlowSystem) || null;
  state.originalRebindScene = state.originalRebindScene || linkResonanceFlowSystem.rebindScene?.bind(linkResonanceFlowSystem) || null;
  state.originalBeginPulseEcho = state.originalBeginPulseEcho || linkResonanceFlowSystem._beginPulseEcho?.bind(linkResonanceFlowSystem) || null;
  state.originalSpawnRippleOnWaveBurst = state.originalSpawnRippleOnWaveBurst || linkResonanceFlowSystem.spawnRippleOnWaveBurst?.bind(linkResonanceFlowSystem) || null;
  state.originalSpawnRippleOnCascadeHop = state.originalSpawnRippleOnCascadeHop || linkResonanceFlowSystem.spawnRippleOnCascadeHop?.bind(linkResonanceFlowSystem) || null;

  linkResonanceFlowSystem.update = function(deltaTime, links, camera) {
    const result = state.originalUpdate ? state.originalUpdate(deltaTime, links, camera) : undefined;
    if (this.echoRippleSystem) {
      if (this.echoRippleSystem.scene !== this.scene) {
        this.echoRippleSystem.rebindScene(this.scene);
      }
      this.echoRippleSystem.update(deltaTime, links, camera);
    }
    return result;
  };

  linkResonanceFlowSystem.dispose = function(...args) {
    if (this.echoRippleSystem) {
      this.echoRippleSystem.dispose();
      this.echoRippleSystem = null;
    }

    if (state.cascadeHopTarget?.removeEventListener && state.cascadeHopHandler) {
      state.cascadeHopTarget.removeEventListener('cascadeHop', state.cascadeHopHandler);
      state.cascadeHopTarget = null;
      state.cascadeHopHandler = null;
    }

    return state.originalDispose ? state.originalDispose(...args) : undefined;
  };

  linkResonanceFlowSystem.clearLink = function(linkOrId, sourceNode = null, targetNode = null) {
    if (this.echoRippleSystem) {
      this.echoRippleSystem.clearLink(linkOrId, sourceNode, targetNode);
    }
    return state.originalClearLink ? state.originalClearLink(linkOrId, sourceNode, targetNode) : 0;
  };

  if (typeof linkResonanceFlowSystem.rebindScene === 'function') {
    linkResonanceFlowSystem.rebindScene = function(scene) {
      const result = state.originalRebindScene ? state.originalRebindScene(scene) : undefined;
      if (this.echoRippleSystem) {
        this.echoRippleSystem.rebindScene(scene);
      }
      return result;
    };
  }

  if (typeof linkResonanceFlowSystem._beginPulseEcho === 'function') {
    linkResonanceFlowSystem._beginPulseEcho = function(pulse, step = null) {
      const result = state.originalBeginPulseEcho ? state.originalBeginPulseEcho(pulse, step) : pulse;
      if (result && this.echoRippleSystem && result.phaseState === 'echo') {
        this.echoRippleSystem.spawnRippleOnWaveBurst(result.link ?? pulse?.link ?? null, result);
      }
      return result;
    };
  }

  linkResonanceFlowSystem.spawnRippleOnWaveBurst = function(link, pulse = null) {
    if (this.echoRippleSystem) {
      return this.echoRippleSystem.spawnRippleOnWaveBurst(link, pulse);
    }

    return state.originalSpawnRippleOnWaveBurst ? state.originalSpawnRippleOnWaveBurst(link, pulse) : null;
  };

  linkResonanceFlowSystem.spawnRippleOnCascadeHop = function(node, intensity = 0.6, context = {}) {
    if (this.echoRippleSystem) {
      return this.echoRippleSystem.spawnRippleOnCascadeHop(node, intensity, context);
    }

    return state.originalSpawnRippleOnCascadeHop ? state.originalSpawnRippleOnCascadeHop(node, intensity, context) : null;
  };

  if (cascadeSystem?.addEventListener) {
    const cascadeHopHandler = (event = {}) => {
      if (linkResonanceFlowSystem.spawnRippleOnCascadeHop) {
        linkResonanceFlowSystem.spawnRippleOnCascadeHop(
          event.node ?? event.position ?? event.link?.target ?? null,
          event.intensity ?? 0.6,
          event
        );
      }
    };

    cascadeSystem.addEventListener('cascadeHop', cascadeHopHandler);
    state.cascadeHopTarget = cascadeSystem;
    state.cascadeHopHandler = cascadeHopHandler;
  }

  state.applied = true;
  return linkResonanceFlowSystem;
}

export default applyEchoRippleIntegration;
