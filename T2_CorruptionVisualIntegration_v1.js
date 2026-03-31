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
    this._semanticSubscriptions = [];
    this._tmpPullVector = new THREE.Vector3();
    this._tmpSourceWorldPos = new THREE.Vector3();
    this._tmpTargetWorldPos = new THREE.Vector3();
    this.particleRoot = new THREE.Group();
    this.particleRoot.name = 'T2_CorruptionParticlePool';

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

  _acquireParticleMesh(corruptionColor) {
    this._ensureParticleRoot();

    const mesh = this.particlePool.pop() || new THREE.Mesh(
      this._particleGeometry,
      new THREE.MeshLambertMaterial({
        color: corruptionColor,
        emissive: corruptionColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      })
    );

    if (!mesh.material) {
      mesh.material = new THREE.MeshLambertMaterial({
        color: corruptionColor,
        emissive: corruptionColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });
    }

    mesh.geometry = this._particleGeometry;
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 9999;
    mesh.material.color.copy(corruptionColor);
    mesh.material.emissive?.copy(corruptionColor);
    mesh.material.emissiveIntensity = 0.8;
    mesh.material.opacity = 0.9;
    return mesh;
  }

  _releaseParticleMesh(mesh) {
    if (!mesh) return;
    mesh.parent?.remove(mesh);
    mesh.visible = false;
    mesh.userData = {};

    if (this.particlePool.length < this.config.particlePoolSize) {
      this.particlePool.push(mesh);
      return;
    }

    mesh.material?.dispose?.();
  }

  _spawnPooledParticle({ position, corruptionLevel, direction = null, targetAnchor = null, isBurst = false, lifetime = null }) {
    if (!position) return null;

    const corruptionColor = this.getCorruptionColor(corruptionLevel);
    const mesh = this._acquireParticleMesh(corruptionColor);
    mesh.position.copy(position);

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
      mesh,
      velocity: driftDir.multiplyScalar(speed),
      lifetime: lifetime ?? (1.0 + Math.random() * 0.5),
      age: 0,
      createdAt: this.registry.time,
      baseScale: 1.0,
      seed,
      spin,
      targetAnchor: targetAnchor?.clone?.() ?? null,
      trailBuffer: [mesh.position.clone()],
      trailMax: 5,
      isBurstParticle: true,
      corruptionLevel
    };

    mesh.userData.particle = particle;
    this.particleRoot.add(mesh);
    this.registry.activeParticles.push(particle);
    return particle;
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
      const mesh = particle?.mesh;
      if (!mesh) {
        this.registry.activeParticles.splice(i, 1);
        continue;
      }

      if (this._getParticleLODLevel(mesh) >= 3) {
        this._releaseParticleMesh(mesh);
        this.registry.activeParticles.splice(i, 1);
        continue;
      }

      particle.age += dt;
      const life = Math.max(0.0001, particle.lifetime || 1.0);
      const t = Math.max(0, Math.min(1, particle.age / life));

      mesh.position.addScaledVector(particle.velocity, dt);

      if (particle.targetAnchor) {
        this._tmpPullVector.subVectors(particle.targetAnchor, mesh.position);
        const distSq = this._tmpPullVector.lengthSq();
        if (distSq > 1e-6) {
          const pullStrength = 2.2;
          this._tmpPullVector.normalize();
          particle.velocity.addScaledVector(this._tmpPullVector, pullStrength * dt);
        }
      }

      const trail = particle.trailBuffer;
      if (Array.isArray(trail)) {
        trail.push(mesh.position.clone());
        const trailMax = Math.max(1, particle.trailMax || 5);
        while (trail.length > trailMax) trail.shift();
      }

      const fade = Math.pow(1.0 - t, 2.5);
      mesh.material.opacity = 0.9 * fade;

      const pulse01 = Math.sin(this.registry.time * 6 + (particle.seed || 0)) * 0.5 + 0.5;
      const pulseScale = 0.8 + pulse01 * 0.3;
      mesh.scale.setScalar((particle.baseScale || 1.0) * pulseScale);

      if (mesh.material?.emissiveIntensity !== undefined) {
        const flicker01 = Math.sin(this.registry.time * 14 + (particle.seed || 0) * 1.7) * 0.5 + 0.5;
        const emissiveMult = 0.8 + flicker01 * 0.4;
        mesh.material.emissiveIntensity = 0.8 * emissiveMult;
      }

      mesh.rotation.x += (particle.spin?.x || 0) * dt;
      mesh.rotation.y += (particle.spin?.y || 0) * dt;
      mesh.rotation.z += (particle.spin?.z || 0) * dt;

      if (particle.age >= particle.lifetime) {
        this._releaseParticleMesh(mesh);
        this.registry.activeParticles.splice(i, 1);
      }
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
