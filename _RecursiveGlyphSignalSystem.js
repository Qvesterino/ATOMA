/**
 * RECURSIVE GLYPH SIGNAL SYSTEM
 *
 * Event-driven SIGNAL layer for local, transient recursive glyph language.
 * This system stays silent by default and only speaks when attention or
 * meaningful events request a short-lived visual utterance.
 */

import * as THREE from 'three';

export class RecursiveGlyphSignalSystem {
  constructor(scene, {
    camera = null,
    semanticGlyphAI = null,
    frameScheduler = null
  } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.semanticGlyphAI = semanticGlyphAI;
    this.frameScheduler = frameScheduler;

    this.enabled = true;

    this.signalContainer = new THREE.Group();
    this.signalContainer.name = 'RecursiveGlyphSignalSystem_Container';
    this.signalContainer.userData.isRecursiveGlyphSignalSystem = true;
    this.scene.add(this.signalContainer);

    this.activeSignals = new Map(); // contextKey -> signal
    this.cooldowns = new Map(); // contextKey -> absolute time in seconds

    this.selectionCore = null;
    this.linkingSystem = null;
    this.semanticBus = null;
    this._semanticBusAttached = null;
    this._semanticLinkCreatedHandler = null;

    this.attachedSelectionCores = new WeakSet();
    this.attachedLinkingSystems = new WeakSet();

    this.isBurstActive = () => false;
    this.isFieldActive = () => false;

    this.schedulerJobId = 'glyph.recursive.signal';
    this.tickRegistered = false;
    this._boundTick = this.update.bind(this);

    this.time = 0;
    this.lastHoverNode = null;
    this.stats = {
      emitted: 0,
      suppressed: 0,
      active: 0,
      culledByClutter: 0
    };

    this.config = {
      globalCap: 9,
      signalCooldownSec: 1.0,
      hoverCooldownSec: 0.3,
      clutterCap: 7,
      hoverClutterBonus: 2,
      baseSize: 0.24,
      emergenceSec: 0.22,
      sustainSec: 0.55 * 1.5,
      decaySec: 0.42 * 1.5,
      shortSustainSec: 0.32 * 1.5,
      burstDecayMultiplier: 2.2,
      hoverLiftY: 0.82,
      selectLiftY: 1.02,
      residueLiftY: 0.65,
      driftStrength: 0.03,
      rotationSpeed: 0.9
    };

    this.sharedGeometry = {
      ring: new THREE.TorusGeometry(1.0, 0.06, 8, 28),
      core: new THREE.OctahedronGeometry(0.28, 0),
      tick: new THREE.PlaneGeometry(0.18, 0.05),
      micro: new THREE.SphereGeometry(0.06, 6, 6)
    };
  }

  init(config = {}) {
    if (config.semanticGlyphAI) this.semanticGlyphAI = config.semanticGlyphAI;
    if (config.frameScheduler) this.setFrameScheduler(config.frameScheduler);
    if (config.selectionCore) this.setSelectionCore(config.selectionCore);
    if (config.linkingSystem) this.setLinkingSystem(config.linkingSystem);
    if (config.semanticBus) this.semanticBus = config.semanticBus;
    if (config.isBurstActive || config.isFieldActive) {
      this.setDynamicsContext(config);
    }
    this._bindSemanticBus();
    return this;
  }

  setFrameScheduler(frameScheduler) {
    this.frameScheduler = frameScheduler;
    if (!frameScheduler) {
      this._unregisterTick();
    } else {
      this._ensureTickRegistered(true);
    }
  }

  setSemanticGlyphAI(semanticGlyphAI) {
    this.semanticGlyphAI = semanticGlyphAI;
  }

  setSelectionCore(selectionCore) {
    if (!selectionCore || this.attachedSelectionCores.has(selectionCore)) return;

    this.selectionCore = selectionCore;
    this.attachedSelectionCores.add(selectionCore);

    selectionCore.onNodeSelected((node) => {
      this.triggerAttentionSignal(node, 'selection');
    });

    selectionCore.onNodeDeselected((node) => {
      if (node) {
        this.requestSilenceForNode(node);
      }
      this.requestGlobalSilence();
    });
  }

  setLinkingSystem(linkingSystem) {
    if (!linkingSystem || this.attachedLinkingSystems.has(linkingSystem)) {
      this.linkingSystem = linkingSystem || this.linkingSystem;
      this._bindSemanticBus();
      return;
    }

    this.linkingSystem = linkingSystem;
    this.attachedLinkingSystems.add(linkingSystem);

    if (typeof linkingSystem.onLinkCreated === 'function') {
      linkingSystem.onLinkCreated((source, target) => {
        this.triggerResidueSignal(source, target, 'resonance');
      });
    }

    if (typeof linkingSystem.onLinkRemoved === 'function') {
      linkingSystem.onLinkRemoved((source, target) => {
        this.triggerResidueSignal(source, target, 'tension');
      });
    }

    this._bindSemanticBus();
  }

  _unbindSemanticBus() {
    if (!this._semanticLinkCreatedHandler || !this._semanticBusAttached) return;
    const bus = this._semanticBusAttached;
    if (bus?.unsubscribe) {
      bus.unsubscribe('link.created', this._semanticLinkCreatedHandler);
    } else if (bus?.off) {
      bus.off('link.created', this._semanticLinkCreatedHandler);
    }
    this._semanticBusAttached = null;
    this._semanticLinkCreatedHandler = null;
  }

  _bindSemanticBus() {
    const semanticBus = this.semanticBus || this.linkingSystem?.semanticBus || globalThis?.semanticBus;
    if (!semanticBus?.on) return;
    if (this._semanticLinkCreatedHandler && this._semanticBusAttached === semanticBus) return;

    this._unbindSemanticBus();
    this.semanticBus = semanticBus;
    this._semanticBusAttached = semanticBus;
    this._semanticLinkCreatedHandler = (event = {}) => {
      const payload = this._normalizeLinkCreatedEvent(event);
      const { source, target } = payload;
      if (!source || !target) return;
      this.triggerResidueSignal(source, target, 'resonance');
    };
    semanticBus.on('link.created', this._semanticLinkCreatedHandler);
  }

  setDynamicsContext({ isBurstActive = null, isFieldActive = null } = {}) {
    if (typeof isBurstActive === 'function') {
      this.isBurstActive = isBurstActive;
    }
    if (typeof isFieldActive === 'function') {
      this.isFieldActive = isFieldActive;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.clearAllSignals();
      this._unregisterTick();
    }
  }

  triggerAttentionSignal(node, reason = 'selection') {
    console.log('ATTENTION SIGNAL', reason, node?.uuid);
    if (!this.enabled || !node?.position) return false;

    const contextKey = `node:${this._getNodeId(node)}`;
    if (this._isCooledDown(contextKey)) {
      this.stats.suppressed++;
      return false;
    }

    if (this.activeSignals.has(contextKey)) {
      return false;
    }

    if (this.isBurstActive() && reason !== 'selection') {
      this.stats.suppressed++;
      return false;
    }

    if (this._isCluttered(node, reason)) {
      this.stats.culledByClutter++;
      return false;
    }

    const semantic = this._getSemanticState(node);
    if (!this._isReadyToCommunicate(semantic, reason)) {
      this.stats.suppressed++;
      return false;
    }

    const meaning = this._deriveMeaning(semantic, reason, null);
    const radius =
      node.geometry?.boundingSphere?.radius ??
      node.userData?.boundingSphere?.radius ??
      0.6;
    const lift =
      (reason === 'selection' ? this.config.selectLiftY : this.config.hoverLiftY) +
      radius * 0.35;
    const anchorOffset = new THREE.Vector3(0, lift, 0);

    const signal = this._spawnSignal({
      contextKey,
      meaning,
      anchorNode: node,
      anchorOffset,
      shortMode: reason !== 'selection'
    });

    if (!signal) return false;
    signal.reason = reason;
    this.activeSignals.set(contextKey, signal);
    this.stats.emitted++;
    this._ensureTickRegistered();
    return true;
  }

  triggerResidueSignal(sourceNode, targetNode, residueKind = 'resonance') {
    if (!this.enabled || !sourceNode?.position || !targetNode?.position) return false;
    if (this.isBurstActive()) return false;

    const sourceId = this._getNodeId(sourceNode);
    const targetId = this._getNodeId(targetNode);
    const contextKey = `link:${sourceId}:${targetId}:${residueKind}`;

    if (this._isCooledDown(contextKey) || this.activeSignals.has(contextKey)) {
      return false;
    }

    const anchorPoint = new THREE.Vector3()
      .addVectors(sourceNode.position, targetNode.position)
      .multiplyScalar(0.5);
    anchorPoint.y += this.config.residueLiftY;

    const meaning = this._deriveMeaning(null, 'residue', residueKind);
    const signal = this._spawnSignal({
      contextKey,
      meaning,
      anchorNode: null,
      anchorOffset: new THREE.Vector3(),
      anchorPoint,
      shortMode: true
    });

    if (!signal) return false;
    this.activeSignals.set(contextKey, signal);
    this.stats.emitted++;
    this._ensureTickRegistered();
    return true;
  }

  requestSilenceForNode(node) {
    if (!node) return;
    const contextKey = `node:${this._getNodeId(node)}`;
    const signal = this.activeSignals.get(contextKey);
    if (!signal) return;
    signal.forceDecay = true;
  }

  requestGlobalSilence() {
    for (const signal of this.activeSignals.values()) {
      signal.forceDecay = true;
    }
  }

  update(deltaTime) {
    console.log('RGS UPDATE');
    if (!this.enabled) return;

    // Poll hover from crosshair state (canonical hover source)
    const hoverNode = (typeof window !== 'undefined' && window.__crosshairRaycastState)?.node || null;
    if (hoverNode !== this.lastHoverNode) {
      if (this.lastHoverNode) {
        this.requestSilenceForNode(this.lastHoverNode);
      }
      if (hoverNode) {
        this.triggerAttentionSignal(hoverNode, 'hover');
      }
      this.lastHoverNode = hoverNode;
    }

    const dt = Math.max(0, Number(deltaTime) || 0);
    this.time += dt;
    const burstActive = this.isBurstActive();
    const fieldActive = this.isFieldActive();

    const toRemove = [];
    for (const [key, signal] of this.activeSignals.entries()) {
      this._updateSignal(signal, dt, { burstActive, fieldActive });
      if (!signal.alive) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      const signal = this.activeSignals.get(key);
      this._despawnSignal(signal);
      this.activeSignals.delete(key);
      const cooldown =
        signal.reason === 'hover'
          ? this.config.hoverCooldownSec
          : this.config.signalCooldownSec;
      this.cooldowns.set(key, this.time + cooldown);
    }

    this.stats.active = this.activeSignals.size;
  }

  clearAllSignals() {
    for (const signal of this.activeSignals.values()) {
      this._despawnSignal(signal);
    }
    this.activeSignals.clear();
    this.cooldowns.clear();
    this.stats.active = 0;
  }

  cleanup() {
    this._unbindSemanticBus();

    this.clearAllSignals();
    this._unregisterTick();

    if (this.signalContainer?.parent) {
      this.signalContainer.parent.remove(this.signalContainer);
    }

    Object.values(this.sharedGeometry).forEach((geometry) => geometry?.dispose?.());
  }

  rebind(config = {}) {
    if (config.semanticBus && config.semanticBus !== this.semanticBus) {
      this._unbindSemanticBus();
      this.semanticBus = config.semanticBus;
    }
    if (config.frameScheduler) this.setFrameScheduler(config.frameScheduler);
    if (config.semanticGlyphAI) this.semanticGlyphAI = config.semanticGlyphAI;
    if (config.selectionCore) this.setSelectionCore(config.selectionCore);
    if (config.linkingSystem) this.setLinkingSystem(config.linkingSystem);
    this._bindSemanticBus();
    return this;
  }

  dispose() {
    this.cleanup();
  }

  _normalizeLinkCreatedEvent(event = {}) {
    let source = event.source ?? null;
    let target = event.target ?? null;
    let linkId = event.linkId ?? event.id ?? null;

    const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
    if ((!source || !target) && linkId !== null) {
      const link = links.find((item) => (item?.id ?? item?.userData?.id) === linkId);
      if (link) {
        source = source || link.source || link.nodeA || null;
        target = target || link.target || link.nodeB || null;
        linkId = linkId ?? link.id ?? link.userData?.id ?? null;
      }
    }

    return {
      source,
      target,
      linkId
    };
  }

  getStatus() {
    return {
      enabled: this.enabled,
      activeSignals: this.activeSignals.size,
      emitted: this.stats.emitted,
      suppressed: this.stats.suppressed,
      culledByClutter: this.stats.culledByClutter
    };
  }

  _ensureTickRegistered(force = false) {
    if (!this.frameScheduler || this.tickRegistered) return;
    const registered = this.frameScheduler.register('visual', this._boundTick, this.schedulerJobId);
    this.tickRegistered = Boolean(registered);
  }

  _unregisterTick() {
    if (!this.frameScheduler || !this.tickRegistered) return;
    this.frameScheduler.unregister(this.schedulerJobId);
    this.tickRegistered = false;
  }

  _isCooledDown(contextKey) {
    const cooldownUntil = this.cooldowns.get(contextKey);
    return cooldownUntil !== undefined && cooldownUntil > this.time;
  }

  _getNodeId(node) {
    // Canonical identity: userData.nodeId; fallback to id, then uuid
    return node?.userData?.nodeId ?? node?.userData?.id ?? node?.uuid ?? 'unknown';
  }

  _getSemanticState(node) {
    const nodeId = this._getNodeId(node);
    const map = this.semanticGlyphAI?.semanticState;
    if (!map || typeof map.get !== 'function') return null;
    return map.get(nodeId) || null;
  }

  _isReadyToCommunicate(semanticState, reason) {
    if (reason === 'selection' || reason === 'hover') return true;
    if (!semanticState || !semanticState.type) return false;
    return semanticState.type !== 'neutral';
  }

  _isCluttered(node, reason = 'hover') {
    const root = node?.visualGroup || node;
    if (!root || typeof root.traverse !== 'function') return false;

    let overlayCount = 0;
    root.traverse((child) => {
      if (!child?.userData) return;
      if (
        child.userData.isGlyphLayer4 ||
        child.userData.isProceduralGlyph ||
        child.userData.isSemanticHelper ||
        child.userData.isRecursiveGlyphSignal ||
        child.userData.isRecursiveGlyphSignalSystem
      ) {
        overlayCount++;
      }
    });

    const cap =
      reason === 'hover'
        ? this.config.clutterCap + this.config.hoverClutterBonus
        : this.config.clutterCap;
    return overlayCount >= cap;
  }

  _deriveMeaning(semanticState, reason, residueKind) {
    const stateType = semanticState?.type || 'neutral';
    let channel = 'alignment';
    let color = new THREE.Color(0x55d8ff);
    let recursionLayers = 2;

    if (residueKind === 'tension') {
      channel = 'tension';
      color = new THREE.Color(0xff8a66);
      recursionLayers = 1;
    } else if (residueKind === 'resonance') {
      channel = 'resonance';
      color = new THREE.Color(0xffd36b);
    } else if (stateType === 'conflict' || stateType === 'stressed') {
      channel = 'tension';
      color = new THREE.Color(0xff7b7b);
    } else if (stateType === 'corruption') {
      channel = 'caution';
      color = new THREE.Color(0xd17cff);
      recursionLayers = 1;
    } else if (stateType === 'exploring') {
      channel = 'curiosity';
      color = new THREE.Color(0x7dffca);
    } else if (stateType === 'cluster-sync' || stateType === 'leader') {
      channel = 'resonance';
      color = new THREE.Color(0xffcf7a);
    }

    if (reason === 'hover') {
      recursionLayers = Math.min(recursionLayers, 1);
    }

    return { channel, color, recursionLayers };
  }

  _spawnSignal({
    contextKey,
    meaning,
    anchorNode,
    anchorOffset,
    anchorPoint = null,
    shortMode = false
  }) {
    if (this.activeSignals.size >= this.config.globalCap) {
      this.stats.suppressed++;
      return null;
    }

    const group = new THREE.Group();
    group.userData.isRecursiveGlyphSignal = true;
    group.name = `RecursiveGlyphSignal_${contextKey}`;

    const rootRing = this._createMesh(this.sharedGeometry.ring, meaning.color, 0.52);
    const innerRing = this._createMesh(this.sharedGeometry.ring, meaning.color, 0.38);
    innerRing.scale.setScalar(0.62);
    innerRing.rotation.x = Math.PI * 0.5;

    const coreGlyph = this._createMesh(this.sharedGeometry.core, meaning.color, 0.72);
    coreGlyph.scale.setScalar(0.46);

    const ticks = [];
    for (let i = 0; i < 4; i++) {
      const tick = this._createMesh(this.sharedGeometry.tick, meaning.color, 0.45);
      tick.position.set(0.58, 0, 0);
      tick.rotation.z = (Math.PI * 2 * i) / 4;
      ticks.push(tick);
      group.add(tick);
    }

    const folds = [];
    const foldCount = this.isFieldActive() ? 1 : meaning.recursionLayers;
    for (let i = 0; i < foldCount; i++) {
      const fold = new THREE.Group();
      const foldRing = this._createMesh(this.sharedGeometry.ring, meaning.color, 0.36);
      const foldCore = this._createMesh(this.sharedGeometry.micro, meaning.color, 0.5);
      foldCore.scale.setScalar(0.8);
      foldRing.scale.setScalar(0.44 - i * 0.08);
      foldCore.position.x = 0.15 + i * 0.06;
      fold.add(foldRing);
      fold.add(foldCore);
      fold.visible = false;
      fold.userData.revealAt = 0.36 + i * 0.18;
      folds.push(fold);
      group.add(fold);
    }

    group.add(rootRing);
    group.add(innerRing);
    group.add(coreGlyph);

    group.scale.setScalar(this.config.baseSize);
    this.signalContainer.add(group);

    const sustainSec = shortMode ? this.config.shortSustainSec : this.config.sustainSec;
    return {
      key: contextKey,
      group,
      rootRing,
      innerRing,
      coreGlyph,
      ticks,
      folds,
      meaning,
      anchorNode,
      anchorOffset,
      anchorPoint: anchorPoint ? anchorPoint.clone() : null,
      age: 0,
      emergenceSec: this.config.emergenceSec,
      sustainSec,
      decaySec: this.config.decaySec,
      forceDecay: false,
      alive: true,
      seed: Math.random() * Math.PI * 2
    };
  }

  _createMesh(geometry, color, opacity) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isRecursiveGlyphSignal = true;
    return mesh;
  }

  _updateSignal(signal, dt, { burstActive, fieldActive }) {
    if (!signal?.alive) return;

    signal.age += dt;
    let emergenceSec = signal.emergenceSec;
    let sustainSec = signal.sustainSec;
    let decaySec = signal.decaySec;

    if (fieldActive) {
      sustainSec *= 0.8;
    }

    if (signal.forceDecay || burstActive) {
      sustainSec = 0;
      decaySec /= this.config.burstDecayMultiplier;
    }

    const totalSec = emergenceSec + sustainSec + decaySec;
    if (signal.age >= totalSec) {
      signal.alive = false;
      return;
    }

    let alpha = 0;
    if (signal.age <= emergenceSec) {
      alpha = this._easeOut(signal.age / emergenceSec);
    } else if (signal.age <= emergenceSec + sustainSec) {
      alpha = 1.0;
    } else {
      const fadeT = (signal.age - emergenceSec - sustainSec) / decaySec;
      alpha = 1.0 - this._easeIn(fadeT);
    }

    const anchor = this._resolveAnchorPosition(signal);
    if (!anchor) {
      signal.alive = false;
      return;
    }

    signal.group.position.lerp(anchor, 0.35);
    signal.group.rotation.y += dt * this.config.rotationSpeed;
    signal.group.rotation.x = Math.sin(signal.age * 1.8 + signal.seed) * 0.06;

    const drift = Math.sin(signal.age * 2.1 + signal.seed) * this.config.driftStrength;
    const baseScale = this.config.baseSize * (0.9 + 0.1 * alpha);
    signal.group.scale.setScalar(baseScale + drift * alpha);

    this._setOpacity(signal.rootRing, alpha * 0.45);
    this._setOpacity(signal.innerRing, alpha * 0.34);
    this._setOpacity(signal.coreGlyph, alpha * 0.8);

    signal.coreGlyph.rotation.x += dt * 1.1;
    signal.coreGlyph.rotation.z += dt * 0.8;

    signal.ticks.forEach((tick, index) => {
      const wobble = Math.sin(signal.age * 2.4 + index * 0.7 + signal.seed) * 0.08;
      tick.position.x = 0.58 + wobble;
      tick.rotation.y += dt * 0.7;
      this._setOpacity(tick, alpha * 0.3);
    });

    signal.folds.forEach((fold, index) => {
      const revealAt = fold.userData.revealAt;
      if (alpha >= revealAt) {
        fold.visible = true;
      }
      if (!fold.visible) return;

      fold.rotation.y += dt * (0.35 + index * 0.2);
      fold.rotation.z -= dt * (0.18 + index * 0.1);
      fold.scale.setScalar(0.85 + alpha * 0.15);
      fold.traverse((child) => {
        if (child?.material) {
          child.material.opacity = alpha * 0.26;
        }
      });
    });
  }

  _resolveAnchorPosition(signal) {
    if (signal.anchorNode?.position) {
      return new THREE.Vector3()
        .copy(signal.anchorNode.position)
        .add(signal.anchorOffset || new THREE.Vector3());
    }
    if (signal.anchorPoint) {
      return signal.anchorPoint;
    }
    return null;
  }

  _despawnSignal(signal) {
    if (!signal?.group) return;

    if (signal.group.parent) {
      signal.group.parent.remove(signal.group);
    }

    signal.group.traverse((child) => {
      if (child?.material) {
        child.material.dispose();
      }
    });
  }

  _setOpacity(mesh, value) {
    if (mesh?.material) {
      mesh.material.opacity = Math.max(0, value);
    }
  }

  _easeOut(t) {
    const x = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - x, 2);
  }

  _easeIn(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x;
  }
}

