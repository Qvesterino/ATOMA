/**
 * T2-002: CORRUPTION VISUAL INTEGRATION v1.0
 *
 * Particle-only corruption feedback layer.
 * Keeps corruption visuals limited to pooled chaos particles and link burst handling.
 */

import * as THREE from 'three';

export class T2_CorruptionVisualIntegration_v1 {
  constructor(scene, linkingSystem, corruptionVisualFX, aiNodes = null) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.corruptionVisualFX = corruptionVisualFX;
    this.aiNodes = aiNodes;

    this.enabled = true;
    this.config = {
      cascadeThresholds: [0.3, 0.65, 0.85],
      particleBurstIntensity: {
        mild: 1.0,
        moderate: 2.0,
        strong: 3.0,
        severe: 4.0
      },
      particlePoolSize: 256,
      pulseParticleCount: 4
    };

    this.registry = {
      linkCorruptionData: new Map(),
      activeLinkVisuals: new Map(),
      activeParticles: [],
      time: 0,
      framesProcessed: 0,
      lastCascadeTriggerTime: {}
    };

    this.particlePool = [];
    this._particleGeometry = new THREE.TetrahedronGeometry(0.1, 0);
    this._particleMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    this._semanticSubscriptions = [];
    this._tmpPullVector = new THREE.Vector3();
    this._tmpSourceWorldPos = new THREE.Vector3();
    this._tmpTargetWorldPos = new THREE.Vector3();
    this.particleRoot = new THREE.Group();
    this.particleRoot.name = 'T2_CorruptionParticlePool';

    this.instancedMesh = new THREE.InstancedMesh(this._particleGeometry, this._particleMaterial, this.config.particlePoolSize);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;
    this.instancedMesh.visible = true;
    this.particleRoot.add(this.instancedMesh);

    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.instancedAuraMesh = new THREE.InstancedMesh(this._particleGeometry, auraMaterial, this.config.particlePoolSize);
    this.instancedAuraMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedAuraMesh.frustumCulled = false;
    this.instancedAuraMesh.visible = true;
    this.particleRoot.add(this.instancedAuraMesh);

    this.availableIndices = Array.from({length: this.config.particlePoolSize}, (_, i) => i).reverse();

    if (this.scene && typeof this.scene.add === 'function') {
      this.scene.add(this.particleRoot);
    }

    this._bindSemanticBus();
    console.log('[T2_CorruptionVisualIntegration_v1] Initialized (particle-only corruption wiring)');
  }

  _getSemanticBus() {
    return globalThis?.semanticBus || null;
  }

  _bindSemanticBus() {
    const bus = this._getSemanticBus();
    if (!bus) return;

    const handleCorruptionSpike = (data = {}) => {
      this.triggerCorruptionPulse(data.nodeId, data.corruption);
    };

    if (typeof bus.on === 'function') {
      bus.on('metric.corruption.spike', handleCorruptionSpike, { priority: bus.priority?.NORMAL });
      this._semanticSubscriptions.push(() => bus.off?.('metric.corruption.spike', handleCorruptionSpike));
      return;
    }

    if (typeof bus.subscribe === 'function') {
      const unsubscribe = bus.subscribe('metric.corruption.spike', handleCorruptionSpike);
      if (typeof unsubscribe === 'function') {
        this._semanticSubscriptions.push(unsubscribe);
      }
    }
  }

  attachScene(scene) {
    if (!scene || typeof scene.add !== 'function') return false;
    this.scene = scene;
    if (this.particleRoot.parent !== scene) {
      this.particleRoot.parent?.remove(this.particleRoot);
      scene.add(this.particleRoot);
    }
    return true;
  }

  _getDistanceLODController() {
    return globalThis?.window?.ATOMA_DISTANCE_LOD || null;
  }

  _getLODLevelAtPosition(position) {
    const controller = this._getDistanceLODController();
    if (!controller || !position) return 0;
    const level = controller.getLODLevel(position);
    return Number.isFinite(level) ? level : 0;
  }

  _getLinkLODLevel(link) {
    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourceWorldPos = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetWorldPos = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourceWorldPos || !targetWorldPos) return 0;
    this._tmpPullVector.copy(sourceWorldPos).add(targetWorldPos).multiplyScalar(0.5);
    return this._getLODLevelAtPosition(this._tmpPullVector);
  }

  _getParticleLODLevel(particle) {
    return particle?.position ? this._getLODLevelAtPosition(particle.position) : 0;
  }

  _getLODScale(lodLevel) {
    if (lodLevel >= 3) return 0;
    if (lodLevel >= 2) return 0.3;
    if (lodLevel >= 1) return 0.6;
    return 1.0;
  }

  _resolveNodeById(nodeId) {
    if (nodeId === undefined || nodeId === null) return null;
    const idToken = String(nodeId);

    const candidates = [];
    if (Array.isArray(this.aiNodes?.nodes)) candidates.push(...this.aiNodes.nodes);
    else if (this.aiNodes?.nodes instanceof Map) candidates.push(...this.aiNodes.nodes.values());
    else if (this.aiNodes instanceof Map) candidates.push(...this.aiNodes.values());
    else if (Array.isArray(this.aiNodes)) candidates.push(...this.aiNodes);

    for (const node of candidates) {
      if (!node) continue;
      const nid = node?.nodeId ?? node?.id ?? node?.uuid ?? node?.userData?.nodeId;
      if (nid !== undefined && String(nid) === idToken) return node;
    }

    return null;
  }

  _resolveWorldPosition(node, outVec) {
    if (!node) return null;
    if (typeof node.getWorldPosition === 'function') {
      const worldPos = node.getWorldPosition(outVec || new THREE.Vector3());
      return Number.isFinite(worldPos.x) && Number.isFinite(worldPos.y) && Number.isFinite(worldPos.z) ? worldPos : null;
    }

    const position = node?.position ?? node?.mesh?.position ?? null;
    if (!position) return null;
    const pos = position.clone ? position.clone() : new THREE.Vector3(position.x, position.y, position.z);
    return Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z) ? pos : null;
  }

  _ensureParticleRoot() {
    if (!this.particleRoot) {
      this.particleRoot = new THREE.Group();
      this.particleRoot.name = 'T2_CorruptionParticlePool';
    }

    if (this.scene && typeof this.scene.add === 'function' && this.particleRoot.parent !== this.scene) {
      this.attachScene(this.scene);
    }
  }

  _acquireParticleInstance(corruptionColor) {
    this._ensureParticleRoot();
    if (this.availableIndices.length === 0) return null;

    const index = this.availableIndices.pop();
    this._updateInstanceMatrixAt(index, new THREE.Vector3(0,0,0), 0.001, 0, corruptionColor, true);

    return index;
  }

  _releaseParticleInstance(instanceId) {
    if (instanceId === null || instanceId === undefined) return;
    if (this.availableIndices.includes(instanceId)) return;
    this.availableIndices.push(instanceId);
  }

  _spawnPooledParticle({ position, corruptionLevel, direction = null, targetAnchor = null, isBurst = false, lifetime = null }) {
    if (!position) return null;

    const corruptionColor = this.getCorruptionColor(corruptionLevel);
    const instanceId = this._acquireParticleInstance(corruptionColor);
    if (instanceId === null) return null;

    const baseDir = direction && typeof direction.lengthSq === 'function' && direction.lengthSq() > 1e-6
      ? direction.clone()
      : new THREE.Vector3(1, 0, 0);
    const jitter = isBurst ? 0.35 : 0.2;
    const driftDir = baseDir.add(new THREE.Vector3(
      (Math.random() * 2 - 1) * jitter,
      (Math.random() * 2 - 1) * jitter,
      (Math.random() * 2 - 1) * jitter
    )).normalize();
    const speed = (isBurst ? 10 : 6) + Math.random() * (isBurst ? 10 : 4);
    const seed = Math.random() * Math.PI * 2;
    const spin = new THREE.Vector3(
      (Math.random() * 2 - 1) * 4,
      (Math.random() * 2 - 1) * 4,
      (Math.random() * 2 - 1) * 4
    );

    const particle = {
      instanceId,
      position: position.clone(),
      velocity: driftDir.multiplyScalar(speed),
      lifetime: lifetime ?? 0.6, // faster decay
      age: 0,
      createdAt: this.registry.time,
      baseScale: 1.0,
      seed,
      spin,
      targetAnchor: targetAnchor?.clone?.() ?? null,
      trailBuffer: [position.clone()],
      trailMax: 5,
      isBurstParticle: true,
      corruptionLevel
    };

    this.registry.activeParticles.push(particle);
    this._updateInstanceMatrix(particle);
    return particle;
  }

  _updateInstanceMatrixAt(instanceId, position, scaleFactor, timeShift, color, isInitial = false) {
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);
    const scale = scaleFactor;
    dummy.scale.setScalar(scale);
    dummy.rotation.set((timeShift * 0.8) % (Math.PI*2), (timeShift * 0.6) % (Math.PI*2), (timeShift * 0.4) % (Math.PI*2));
    dummy.updateMatrix();

    this.instancedMesh.setMatrixAt(instanceId, dummy.matrix);
    if (this.instancedAuraMesh) {
      const auraDummy = new THREE.Object3D();
      auraDummy.position.copy(position);
      auraDummy.scale.setScalar(scale * 1.35); // slightly larger aura
      auraDummy.rotation.copy(dummy.rotation);
      auraDummy.updateMatrix();
      this.instancedAuraMesh.setMatrixAt(instanceId, auraDummy.matrix);
    }

    if (this.instancedMesh.instanceColor && color) {
      this.instancedMesh.setColorAt(instanceId, color);
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedAuraMesh) this.instancedAuraMesh.instanceMatrix.needsUpdate = true;
  }

  _updateInstanceMatrix(particle) {
    const scale = particle.baseScale * (0.8 + Math.sin(this.registry.time * 6 + (particle.seed || 0)) * 0.3);
    this._updateInstanceMatrixAt(particle.instanceId, particle.position, scale, this.registry.time, this.getCorruptionColor(particle.corruptionLevel));
  }
  triggerCorruptionPulse(nodeId, corruptionLevel = null) {
    const node = this._resolveNodeById(nodeId);
    if (!node) return false;

    const sourceWorldPos = this._resolveWorldPosition(node);
    if (!sourceWorldPos) return false;

    const level = Math.max(
      0.65,
      Math.min(
        1,
        corruptionLevel ?? node?.userData?.metrics?.corruption ?? node?.userData?.corruption ?? 0.7
      )
    );

    const pulseCount = Math.max(1, this.config.pulseParticleCount);
    for (let i = 0; i < pulseCount; i++) {
      this._spawnPooledParticle({
        position: sourceWorldPos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25
        )),
        corruptionLevel: level,
        isBurst: true,
        lifetime: 0.75 + Math.random() * 0.4,
        targetAnchor: sourceWorldPos
      });
    }

    return true;
  }

  getCorruptionColor(corruptionLevel) {
    const level = Math.max(0, Math.min(1, Number(corruptionLevel) || 0));
    const stops = [
      { at: 0.0, color: new THREE.Color(0x00ffff) },
      { at: 0.3, color: new THREE.Color(0xff8800) },
      { at: 0.65, color: new THREE.Color(0xff0055) },
      { at: 0.85, color: new THREE.Color(0xff0000) },
      { at: 1.0, color: new THREE.Color(0x550055) }
    ];

    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (level >= stops[i].at && level <= stops[i + 1].at) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    const t = upper.at === lower.at ? 0 : (level - lower.at) / (upper.at - lower.at);
    return lower.color.clone().lerp(upper.color, Math.max(0, Math.min(1, t)));
  }

  registerLink(link) {
    if (!link || this.registry.linkCorruptionData.has(link.id || link.uuid)) return;

    this.registry.linkCorruptionData.set(link.id || link.uuid, {
      link,
      level: 0,
      lastVisualState: 'healthy',
      cascadeBurstTriggered: false,
      lastBurstTime: -Infinity
    });
  }

  checkCascadeThreshold(corruptionLevel, linkKey) {
    const BURST_COOLDOWN = 1.0;
    const now = this.registry.time;

    let triggered = false;
    let burstIntensity = 0;

    if (corruptionLevel >= 0.85 && (!this.registry.lastCascadeTriggerTime[linkKey] || now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.severe;
    } else if (corruptionLevel >= 0.65 && (!this.registry.lastCascadeTriggerTime[linkKey] || now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.strong;
    } else if (corruptionLevel >= 0.3 && (!this.registry.lastCascadeTriggerTime[linkKey] || now - this.registry.lastCascadeTriggerTime[linkKey] > BURST_COOLDOWN)) {
      triggered = true;
      burstIntensity = this.config.particleBurstIntensity.moderate;
    }

    if (triggered) {
      this.registry.lastCascadeTriggerTime[linkKey] = now;
    }

    return { triggered, burstIntensity };
  }

  applyCorruptionVisuals(link, corruptionLevel) {
    if (!link || !this.enabled) return;

    const linkKey = link.id || link.uuid;
    this.registerLink(link);

    const linkData = this.registry.linkCorruptionData.get(linkKey);
    if (!linkData) return;

    const lodLevel = this._getLinkLODLevel(link);
    if (lodLevel >= 3) return;

    if (lodLevel < 2) {
      const { triggered, burstIntensity } = this.checkCascadeThreshold(corruptionLevel, linkKey);
      if (triggered) {
        this.triggerParticleBurst(link, burstIntensity, corruptionLevel);
      }
    }

    linkData.level = corruptionLevel;
  }

  triggerParticleBurst(link, intensity, corruptionLevel) {
    if (!link || !this.scene) return;
    if (this._getLinkLODLevel(link) >= 2) return;

    const burstJitter = 0.7 + Math.random() * 0.6;
    const burstCount = Math.max(1, Math.ceil(intensity * 5 * burstJitter));
    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourceWorldPos = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetWorldPos = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourceWorldPos || !targetWorldPos) return;

    const direction = new THREE.Vector3().subVectors(targetWorldPos, sourceWorldPos);
    if (direction.lengthSq() < 1e-6) return;
    direction.normalize();

    for (let i = 0; i < burstCount; i++) {
      const spawnFromTarget = Math.random() < 0.7;
      const spawnPosition = spawnFromTarget ? targetWorldPos : sourceWorldPos;
      this._spawnPooledParticle({
        position: spawnPosition.clone(),
        corruptionLevel,
        direction,
        targetAnchor: targetWorldPos,
        isBurst: true
      });
    }
  }

  createBurstParticle(position, corruptionLevel, direction = null, targetAnchor = null) {
    const particle = this._spawnPooledParticle({
      position,
      corruptionLevel,
      direction,
      targetAnchor,
      isBurst: true
    });
    return particle?.mesh ?? null;
  }

  update(deltaTime, links) {
    if (!this.enabled || !links) return;

    this.registry.time += deltaTime;
    this.registry.framesProcessed++;

    for (const link of links) {
      if (!link) continue;

      const corruptionLevel =
        link?.group?.userData?.conduitState?.metrics?.corruption ??
        link?.userData?.metrics?.corruption ??
        link?.userData?.corruption ??
        link?.userData?.corruptionLevel ??
        link?.corruption ??
        link?.corruptionLevel ??
        0;

      if (corruptionLevel > 0.01) {
        this.applyCorruptionVisuals(link, corruptionLevel, deltaTime);
      }
    }

    this.updateParticles(deltaTime);
  }

  updateParticles(deltaTime) {
    if (!this.registry.activeParticles.length) return;

    const dt = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0;
    for (let i = this.registry.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.registry.activeParticles[i];
      if (!particle) {
        this.registry.activeParticles.splice(i, 1);
        continue;
      }

      const lodLevel = this._getParticleLODLevel({ position: particle.position });
      if (lodLevel >= 3) {
        this._releaseParticleInstance(particle.instanceId);
        this.registry.activeParticles.splice(i, 1);
        continue;
      }

      particle.age += dt;
      const life = Math.max(0.0001, particle.lifetime || 1.0);
      const t = Math.max(0, Math.min(1, particle.age / life));

      particle.position.addScaledVector(particle.velocity, dt);

      if (particle.targetAnchor) {
        this._tmpPullVector.subVectors(particle.targetAnchor, particle.position);
        const distSq = this._tmpPullVector.lengthSq();
        if (distSq > 1e-6) {
          const pullStrength = 2.2;
          this._tmpPullVector.normalize();
          particle.velocity.addScaledVector(this._tmpPullVector, pullStrength * dt);
        }
      }

      const trail = particle.trailBuffer;
      if (Array.isArray(trail)) {
        trail.push(particle.position.clone());
        const trailMax = Math.max(1, particle.trailMax || 5);
        while (trail.length > trailMax) trail.shift();
      }

      if (particle.age >= particle.lifetime) {
        this._releaseParticleInstance(particle.instanceId);
        this.registry.activeParticles.splice(i, 1);
        continue;
      }

      this._updateInstanceMatrix(particle);
    }
  }

  applyCorruptionEffects(nodeModel) {
    if (!nodeModel) return;
    this.restoreNodeVisualBaseline(nodeModel);
  }

  restoreNodeVisualBaseline(nodeModel) {
    if (!nodeModel?.traverse) return;
    nodeModel.traverse((child) => {
      if (!child?.isMesh || !child.material) return;
    });
  }

  renderCorruptionParticles(scene) {
    if (scene) {
      this.attachScene(scene);
    }
    this.updateParticles(0);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      registeredLinks: this.registry.linkCorruptionData.size,
      framesProcessed: this.registry.framesProcessed,
      time: this.registry.time.toFixed(2),
      activeParticles: this.registry.activeParticles.length
    };
  }

  dispose() {
    const bus = this._getSemanticBus();
    if (bus) {
      for (const unsubscribe of this._semanticSubscriptions) {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }
    }
    this._semanticSubscriptions = [];

    for (const particle of this.registry.activeParticles) {
      this._releaseParticleMesh(particle?.mesh);
    }
    this.registry.activeParticles.length = 0;

    while (this.particlePool.length) {
      const mesh = this.particlePool.pop();
      mesh?.material?.dispose?.();
    }

    this.particleRoot?.parent?.remove(this.particleRoot);
    this._particleGeometry?.dispose?.();
  }
}

export default T2_CorruptionVisualIntegration_v1;
