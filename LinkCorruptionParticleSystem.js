/**
 * LinkCorruptionParticleSystem.js
 * ---------------------------------------------------------------------------
 * Minimal GPU-driven corruption particles for links.
 * Visual: fractured red shards that jitter, burst outward, and dissolve.
 * Implementation: single THREE.Points pool, shader sprite shard mask (gl_PointCoord).
 * No gameplay changes; visual-only.
 */

import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

const POOL_SIZE = 480;
const PER_LINK_CAP = 20;

function ensureUserData(obj) {
  if (!obj.userData) {
    Object.defineProperty(obj, 'userData', { value: {}, writable: true });
  }
  return obj.userData;
}

export class LinkCorruptionParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.pointFXBase = new LinkPointFXBase(this.scene, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'corruption',
      capacity: POOL_SIZE,
      textureKind: 'ember'
    });

    // Pool + per-link index map
    this.poolSize = POOL_SIZE;
    this.active = new Array(POOL_SIZE).fill(false);
    this.linkRefs = new Array(POOL_SIZE).fill(null);
    this.detaching = new Array(POOL_SIZE).fill(false);
    this.linkIndices = new Map(); // linkId -> array of pool indices
    this.linkByPair = new Map(); // `${a}|${b}` -> link reference
    this._semanticSubscriptions = [];
    this._eventBus = null;
    this._eventDisposers = [];

    // Attributes
    this.startPos = new Float32Array(POOL_SIZE * 3);
    this.velocity = new Float32Array(POOL_SIZE * 3);
    this.jitterDir = new Float32Array(POOL_SIZE * 3);
    this.lifeAttr = new Float32Array(POOL_SIZE * 2); // start, life
    this.seedAttr = new Float32Array(POOL_SIZE);
    this.scaleAttr = new Float32Array(POOL_SIZE);
    this.rotAttr = new Float32Array(POOL_SIZE); // rotation rate
    this.stretchAttr = new Float32Array(POOL_SIZE); // anisotropic stretch factor

    this.geometry = this.pointFXBase.createGeometry({
      aVelocity: { itemSize: 3 },
      aJitter: { itemSize: 3 },
      aLife: { itemSize: 2 },
      aSeed: { itemSize: 1 },
      aScale: { itemSize: 1 },
      aRot: { itemSize: 1 },
      aStretch: { itemSize: 1 }
    });
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.startPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocity, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aJitter', new THREE.BufferAttribute(this.jitterDir, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifeAttr, 2).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seedAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scaleAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aRot', new THREE.BufferAttribute(this.rotAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aStretch', new THREE.BufferAttribute(this.stretchAttr, 1).setUsage(THREE.DynamicDrawUsage));

    this.material = this.pointFXBase.createMaterial({
      preset: 'corruption',
      vertexShader: `
        attribute vec3 aVelocity;
        attribute vec3 aJitter;
        attribute vec2 aLife;
        attribute float aSeed;
        attribute float aScale;
        attribute float aRot;
        attribute float aStretch;
        uniform float uTime;
        uniform float uOpacity;
        uniform vec2 uSizeRange;
        varying float vT;
        varying float vSeed;
        varying float vDepth;
        void main() {
          float age = uTime - aLife.x;
          vT = clamp(age / aLife.y, 0.0, 1.0);
          vSeed = aSeed;
          float jitterAmp = (1.0 - vT) * 0.08;
          float jitter = sin(uTime * (6.0 + aSeed * 8.0)) * jitterAmp;
          vec3 pos = position;
          pos += aVelocity * age;
          pos += aJitter * jitter;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vDepth = -mvPosition.z;
          float sizeFade = mix(1.0, 0.7, vT);
          float size = mix(uSizeRange.x, uSizeRange.y, 1.0 - vT) * aScale * sizeFade;
          // Subtle breathing — unstable pulsing, unique per shard
          float breath = 1.0 + sin(age * 8.0 + aSeed * 6.28) * 0.05;
          size *= breath;
          gl_PointSize = size * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vT;
        varying float vSeed;
        varying float vDepth;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        uniform float uOpacity;
        uniform float uSoftNear;
        uniform float uSoftRange;

        float hash11(float p) {
          p = fract(p * 0.1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
        }

        float triMask(vec2 p, vec2 a, vec2 b, vec2 c) {
          vec2 v0 = c - a;
          vec2 v1 = b - a;
          vec2 v2 = p - a;
          float dot00 = dot(v0, v0);
          float dot01 = dot(v0, v1);
          float dot02 = dot(v0, v2);
          float dot11 = dot(v1, v1);
          float dot12 = dot(v1, v2);
          float invDenom = 1.0 / max(dot00 * dot11 - dot01 * dot01, 0.0001);
          float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
          float v = (dot00 * dot12 - dot01 * dot02) * invDenom;
          float inside = step(0.0, u) * step(0.0, v) * step(u + v, 1.0);
          return inside;
        }

        // Simplified shard: two main wedges + crack
        float shardMask(vec2 uv, float skew, float stretch) {
          vec2 p = uv * 2.0 - 1.0;
          p.x = p.x * (0.82 / stretch) + skew;
          p.y *= 1.08;

          float mainFrag = triMask(p, vec2(-0.62, -0.56), vec2(0.58, -0.18), vec2(-0.08, 0.82));
          float sideFrag = triMask(p, vec2(-0.18, -0.08), vec2(0.78, 0.16), vec2(0.08, 0.92));

          float fragment = max(mainFrag, sideFrag * 0.82);
          float crack = 1.0 - smoothstep(0.02, 0.08, abs(p.x * 0.82 + p.y * 0.36 - 0.08));
          float edgeSoft = 1.0 - smoothstep(0.78, 1.0, length(p));

          return clamp(fragment * edgeSoft + crack * 0.12, 0.0, 1.0);
        }

        void main() {
          vec2 uv = gl_PointCoord;
          float depthFade = smoothstep(uSoftNear, uSoftNear + uSoftRange, vDepth);
          float skew = (hash11(vSeed * 91.7) - 0.5) * 0.45;
          float stretch = 0.9 + hash11(vSeed * 57.3) * 0.9;
          float shape = shardMask(uv, skew, stretch);
          float lifeFade = smoothstep(0.0, 0.06, vT) * (1.0 - smoothstep(0.65, 1.0, vT));
          // Enhanced flash: wider range, brighter peak for corruption burnout
          float flash = smoothstep(0.82, 1.0, vT) * 0.9;
          float radial = clamp(1.0 - length(gl_PointCoord * 2.0 - 1.0), 0.0, 1.0);
          float streak = flash * radial;
          float alpha = shape * (lifeFade + flash + streak) * depthFade * uOpacity;
          if (alpha < 0.01) discard;

          // Ember glow: hot core with luminous depth
          vec2 p = uv * 2.0 - 1.0;
          float dist = length(p);
          float ember = 1.0 - smoothstep(0.0, 0.22, dist);
          float outerGlow = 1.0 - smoothstep(0.08, 0.45, dist);

          vec3 base = mix(uBaseColor, uEdgeColor, 0.35 + 0.25 * hash11(vSeed * 151.0));
          // Hot ember core shifts toward bright orange-yellow
          base += vec3(ember * 0.42, ember * 0.22, ember * 0.06);
          // Outer glow adds crimson depth
          base += outerGlow * vec3(0.12, 0.02, 0.0);
          // Color evolution: shift hotter as shard dies (ember burnout effect)
          base = mix(base, base + vec3(0.18, 0.10, 0.02), vT * 0.6);
          base += (flash + streak) * 0.35;
          // Subtle shimmer — unstable flicker
          float shimmer = 1.0 + sin(vT * 18.0 + dist * 15.0) * 0.03;
          base *= shimmer;

          gl_FragColor = vec4(base, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0xff1744) },
        uEdgeColor: { value: new THREE.Color(0xff5a36) },
        uOpacity: { value: 2.6 },
        uSizeRange: { value: new THREE.Vector2(5.5, 13.0) },
        uSoftNear: { value: 0.28 },
        uSoftRange: { value: 0.55 }
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      vertexColors: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = true;
    this.points.matrixAutoUpdate = false;
    this.points.updateMatrix();
    applyLinkRenderLayer(this.points, 'LINK_PARTICLES');
    ensureUserData(this.points).isCorruptionParticles = true;
    this.pointFXBase.ensureAttached(this.points);
    this._bindSemanticBus();
  }

  setEventBus(bus) {
    if (!bus || this._eventBus) return;
    this._eventBus = bus;

    const register = (tag, handler) => {
      if (typeof bus.subscribe === 'function') {
        const unsub = bus.subscribe(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => unsub?.());
      } else if (typeof bus.on === 'function') {
        bus.on(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => bus.off?.(tag, handler));
      }
    };

    // Canonical tiered corruption events → burst particle spawn
    register('link.corruption.high', (payload) => {
      const link = payload?.link || this._resolveLinkFromPayload(payload);
      if (link?.curve?.getPointAt) {
        this._spawn(link, 8, 0.9, 0.016);
        this._updateForLink(link, 0.016);
      }
    });

    register('link.corruption.mid', (payload) => {
      const link = payload?.link || this._resolveLinkFromPayload(payload);
      if (link?.curve?.getPointAt) {
        this._spawn(link, 4, 0.6, 0.016);
        this._updateForLink(link, 0.016);
      }
    });

    register('link.corruption.low', (payload) => {
      const link = payload?.link || this._resolveLinkFromPayload(payload);
      if (link?.curve?.getPointAt) {
        this._spawn(link, 2, 0.3, 0.016);
        this._updateForLink(link, 0.016);
      }
    });
  }

  _resolveLinkFromPayload(payload) {
    if (!payload) return null;
    const sourceId = payload.sourceId ?? payload.source?.id ?? payload.source;
    const targetId = payload.targetId ?? payload.target?.id ?? payload.target;
    if (sourceId && targetId) {
      const key = this._pairKey({ id: sourceId }, { id: targetId });
      return key ? this.linkByPair.get(key) : null;
    }
    return payload.link || null;
  }

  _getSemanticBus() {
    return this._eventBus || globalThis?.semanticBus || null;
  }

  _bindSemanticBus() {
    const bus = this._getSemanticBus();
    if (!bus) return;
    const on = bus.on?.bind(bus) || bus.subscribe?.bind(bus);
    if (!on) return;

    const handleSpread = (data = {}) => {
      this.triggerCorruptionTransmission(data.source, data.target);
    };

    on('link.corruption.spread', handleSpread, { priority: bus.priority?.NORMAL });
    this._semanticSubscriptions.push(['link.corruption.spread', handleSpread]);
  }

  updateLinkParticles(link, deltaTime, input = null) {
    if (!link?.id || !link.curve) return null;
    
    // LOD: Get distance level from input
    const lodLevel = input?.lodLevel ?? 0;
    if (lodLevel >= 3) return null;
    
    const nodeA = link.sourceNode || link.nodeA || link.source;
    const nodeB = link.targetNode || link.nodeB || link.target;
    const pairKey = this._pairKey(nodeA, nodeB);
    if (pairKey) {
      this.linkByPair.set(pairKey, link);
    }
    const endpointCorruption = Math.max(
      this._readNodeCorruption(nodeA),
      this._readNodeCorruption(nodeB)
    );
    const canonicalCorruption = Number.isFinite(input?.corruptionLevel)
      ? input.corruptionLevel
      : null;
    const corruption = Math.max(
      0,
      canonicalCorruption ??
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruptionLevel ??
      link?.userData?.corruption ??
      link.corruptionLevel ??
      link.corruption ??
      endpointCorruption ??
      0
    );
    const visualCorruption = THREE.MathUtils.clamp(corruption * 4.0, 0, 1);

    // LOD: Reduce particle count at distance
    const lodSpawnScale = lodLevel >= 2 ? 0.0 : lodLevel >= 1 ? 0.4 : 1.0;
    const desired = (corruption > 0.005)
      ? THREE.MathUtils.clamp(Math.floor(corruption * 10.0) * 2 * lodSpawnScale, 0, PER_LINK_CAP)
      : 0;
    const activeForLink = this.linkIndices.get(link.id)?.length || 0;

    if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
      const nowMs = performance.now();
      if (!this._debugLastLog || nowMs - this._debugLastLog > 1000) {
        console.debug('[CorruptionParticles][target]', {
          linkId: link.id,
          corruption: Number(corruption.toFixed(3)),
          visualCorruption: Number(visualCorruption.toFixed(3)),
          desired,
          activeForLink,
          hasCurve: !!link.curve
        });
        this._debugLastLog = nowMs;
      }
    }

    if (activeForLink > desired) {
      this._trimToTarget(link.id, desired);
    }

    const activeAfterTrim = this.linkIndices.get(link.id)?.length || 0;
    const missing = Math.max(0, desired - activeAfterTrim);
    if (missing > 0) {
      this._spawn(link, missing, visualCorruption, deltaTime);
    } else if (desired === 0 && typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
      const nowMs = performance.now();
      if (!this._debugLastZeroLog || nowMs - this._debugLastZeroLog > 1000) {
        console.debug('[CorruptionParticles][skip]', {
          linkId: link.id,
          corruption: Number(corruption.toFixed(3)),
          hasCurve: !!link.curve
        });
        this._debugLastZeroLog = nowMs;
      }
    }

    // Update only particles for this link
    this._updateForLink(link, deltaTime);
    return null;
  }

  dispose() {
    // Dispose canonical event subscriptions
    for (const dispose of this._eventDisposers) {
      try { dispose(); } catch (_e) {}
    }
    this._eventDisposers = [];
    this._eventBus = null;

    const bus = this._getSemanticBus();
    const off = bus?.off?.bind(bus) || bus?.unsubscribe?.bind(bus);
    if (off) {
      for (const [eventName, handler] of this._semanticSubscriptions) {
        off(eventName, handler);
      }
    }
    this._semanticSubscriptions = [];

    this.pointFXBase?.disposePointCloud?.(this.points);
    this.linkIndices.clear();
    this.linkByPair.clear();
  }

  clearLinkParticles(linkOrId) {
    const linkId = typeof linkOrId === 'string' ? linkOrId : linkOrId?.id;
    const list = linkId ? this.linkIndices.get(linkId) : null;
    const now = performance.now() * 0.001;
    if (list) {
      for (const idx of list) {
        this._detachParticle(idx, now);
        this.linkRefs[idx] = null;
      }
      this.linkIndices.delete(linkId);
    }

    const link = typeof linkOrId === 'object' ? linkOrId : null;
    const pairKey = this._pairKey(
      link?.sourceNode || link?.nodeA || link?.source,
      link?.targetNode || link?.nodeB || link?.target
    );
    if (pairKey) {
      this.linkByPair.delete(pairKey);
    }

    if (list) {
      this._flagUpdates();
      this.points.visible = true;
    }
  }

  _trimToTarget(linkId, targetCount) {
    const list = this.linkIndices.get(linkId);
    if (!list || list.length <= targetCount) return;
    const removeCount = list.length - targetCount;
    for (let i = 0; i < removeCount; i++) {
      const idx = list.pop();
      if (idx === undefined) break;
      this.active[idx] = false;
      this.detaching[idx] = false;
      this.linkRefs[idx] = null;
    }
    if (list.length === 0) {
      this.linkIndices.delete(linkId);
    } else {
      this.linkIndices.set(linkId, list);
    }
  }

  // -------------------------------------------------------------------------
  _spawn(link, count, corruption, deltaTime) {
    if (!count || count <= 0) return;
    const list = this.linkIndices.get(link.id) || [];
    const current = list.length;
    const available = Math.max(0, PER_LINK_CAP - current);
    if (available <= 0) {
      if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
        const nowMs = performance.now();
        if (!this._debugLastCapLog || nowMs - this._debugLastCapLog > 1000) {
          console.debug('[CorruptionParticles][cap]', {
            linkId: link.id,
            current,
            available
          });
          this._debugLastCapLog = nowMs;
        }
      }
      return;
    }
    const spawnCount = Math.min(count, available);

    for (let n = 0; n < spawnCount; n++) {
      const idx = this._acquire();
      if (idx === -1) break;
      list.push(idx);
      this.linkIndices.set(link.id, list);
      this.linkRefs[idx] = link;
      this.active[idx] = true;
      this.detaching[idx] = false;

      // Pick a point on the curve - bias toward higher corruption node
      let t = Math.random();
      const nodeA = link.sourceNode || link.nodeA || link.source;
      const nodeB = link.targetNode || link.nodeB || link.target;
      const corruptionA = this._readNodeCorruption(nodeA);
      const corruptionB = this._readNodeCorruption(nodeB);
      const totalNodeCorruption = corruptionA + corruptionB;

      if (totalNodeCorruption > 0.2 && Math.random() < 0.7) {
        // Bias toward the more corrupted node
        const bias = corruptionB / totalNodeCorruption; // 0 = toward A, 1 = toward B
        // Apply bias with some randomness
        t = THREE.MathUtils.lerp(t, bias, 0.6);
      }

      const pos = link.curve.getPointAt(t);
      const tangent = link.curve.getTangentAt(t).normalize();
      const normal = this._makeNormal(tangent, idx);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Ensure outward direction (never back to link): radial from link center
      const radial = normal.clone().addScaledVector(binormal, (Math.random() - 0.5) * 0.5).normalize();

      // Outward-only clamp: flip if pointing back along tangent
      if (radial.dot(tangent) < 0) {
        radial.negate();
      }

      const baseSpeed = THREE.MathUtils.lerp(1.6, 3.2, corruption);
      const speed = baseSpeed * (0.85 + Math.random() * 0.45);

      const startOffset = radial.clone().multiplyScalar(0.055 + Math.random() * 0.035);
      pos.add(startOffset);

      const jitterDir = radial.clone().multiplyScalar(0.35).addScaledVector(binormal, 0.12).normalize();

      const life = 0.30 + Math.random() * 0.20;
      const scale = 0.75 + Math.random() * 0.35;
      const stretch = THREE.MathUtils.lerp(1.0, 1.6, corruption);
      const rotRate = (Math.random() - 0.5) * 6.0;
      const seed = Math.random();

      const i3 = idx * 3;
      this.startPos[i3] = pos.x;
      this.startPos[i3 + 1] = pos.y;
      this.startPos[i3 + 2] = pos.z;

      this.velocity[i3] = radial.x * speed;
      this.velocity[i3 + 1] = radial.y * speed;
      this.velocity[i3 + 2] = radial.z * speed;

      this.jitterDir[i3] = jitterDir.x;
      this.jitterDir[i3 + 1] = jitterDir.y;
      this.jitterDir[i3 + 2] = jitterDir.z;

      this.lifeAttr[idx * 2] = performance.now() * 0.001;
      this.lifeAttr[idx * 2 + 1] = life;
      this.seedAttr[idx] = seed;
      this.scaleAttr[idx] = scale;
      this.stretchAttr[idx] = stretch;
      this.rotAttr[idx] = rotRate;
    }

    this._flagUpdates();
  }

  _updateForLink(link, deltaTime) {
    const list = this.linkIndices.get(link.id);
    if (!list || list.length === 0) return;
    const now = performance.now() * 0.001;

    // Clean dead particles
    for (let i = list.length - 1; i >= 0; i--) {
      const idx = list[i];
      if (!this.active[idx]) {
        list.splice(i, 1);
        continue;
      }

      const start = this.lifeAttr[idx * 2];
      const life = this.lifeAttr[idx * 2 + 1];
      const age = now - start;
      if (age >= life) {
        this.active[idx] = false;
        this.detaching[idx] = false;
        this.linkRefs[idx] = null;
        list.splice(i, 1);
      }
    }
    if (list.length === 0) {
      this.linkIndices.delete(link.id);
      return;
    }

    this.material.uniforms.uTime.value = now;
    this.material.uniforms.uOpacity.value = 2.6;
    this.material.uniforms.uSizeRange.value.set(5.5, 13.0);
    this.points.visible = true;
  }

  update(deltaTime = 0.016, time = null, lodLevel = 0) {
    const now = Number.isFinite(time) ? time * 0.001 : performance.now() * 0.001;
    this.material.uniforms.uTime.value = now;

    // LOD: Skip visibility at max distance
    if (lodLevel >= 3) {
        this.points.visible = false;
        return;
    }

    let activeCount = 0;
    for (let idx = 0; idx < this.poolSize; idx++) {
      if (!this.active[idx]) continue;

      const start = this.lifeAttr[idx * 2];
      const life = this.lifeAttr[idx * 2 + 1];
      const age = now - start;

      if (age >= life) {
        this.active[idx] = false;
        this.detaching[idx] = false;
        this.linkRefs[idx] = null;
        continue;
      }

      activeCount += 1;
    }

    this.points.visible = activeCount > 0;
  }

  /**
   * Set global LOD level for the entire system
   * @param {number} lodLevel - Distance level (0-3)
   */
  setLODLevel(lodLevel) {
    this._lodLevel = lodLevel;
  }

  _acquire() {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.active[i]) return i;
    }
    return -1;
  }

  _makeNormal(tangent, idx) {
    const n = new THREE.Vector3();
    if (Math.abs(tangent.y) < 0.9) {
      n.set(-tangent.z, 0, tangent.x).normalize();
    } else {
      n.set(0, tangent.z, -tangent.y).normalize();
    }
    return n;
  }

  _detachParticle(idx, now) {
    if (!this.active[idx]) return;

    const start = this.lifeAttr[idx * 2];
    const life = this.lifeAttr[idx * 2 + 1];
    const age = Math.max(0, now - start);
    const lifeT = life > 0 ? Math.min(1, age / life) : 1;
    const jitterAmp = (1.0 - lifeT) * 0.08;
    const jitterPhase = Math.sin(now * (6.0 + this.seedAttr[idx] * 8.0)) * jitterAmp;

    const i3 = idx * 3;
    const posX = this.startPos[i3] + this.velocity[i3] * age + this.jitterDir[i3] * jitterPhase;
    const posY = this.startPos[i3 + 1] + this.velocity[i3 + 1] * age + this.jitterDir[i3 + 1] * jitterPhase;
    const posZ = this.startPos[i3 + 2] + this.velocity[i3 + 2] * age + this.jitterDir[i3 + 2] * jitterPhase;

    this.startPos[i3] = posX;
    this.startPos[i3 + 1] = posY;
    this.startPos[i3 + 2] = posZ;
    this.velocity[i3] = 0;
    this.velocity[i3 + 1] = 0;
    this.velocity[i3 + 2] = 0;
    this.jitterDir[i3] = 0;
    this.jitterDir[i3 + 1] = 0;
    this.jitterDir[i3 + 2] = 0;
    this.lifeAttr[idx * 2] = now;
    this.lifeAttr[idx * 2 + 1] = 0.28 + Math.random() * 0.14;
    this.scaleAttr[idx] *= 0.92;
    this.detaching[idx] = true;
  }

  _readNodeCorruption(node) {
    return Math.max(
      0,
      node?.userData?.metrics?.corruption ??
      node?.userData?.corruptionLevel ??
      node?.userData?.corruption ??
      node?.corruptionLevel ??
      node?.corruption ??
      0
    );
  }

  _resolveNodeId(node) {
    if (!node) return null;
    const id = node?.id ?? node?.nodeId ?? node?.userData?.nodeId ?? node?.uuid;
    return id === undefined || id === null ? null : String(id);
  }

  _pairKey(nodeA, nodeB) {
    const a = this._resolveNodeId(nodeA);
    const b = this._resolveNodeId(nodeB);
    if (!a || !b) return null;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  triggerCorruptionTransmission(sourceNodeId, targetNodeId) {
    const key = this._pairKey(
      { id: sourceNodeId },
      { id: targetNodeId }
    );
    if (!key) return;
    const link = this.linkByPair.get(key);
    if (!link?.curve?.getPointAt) return;
    this._spawn(link, 4, 0.7, 0.016);
    this._updateForLink(link, 0.016);
  }

  _flagUpdates() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aVelocity.needsUpdate = true;
    this.geometry.attributes.aJitter.needsUpdate = true;
    this.geometry.attributes.aLife.needsUpdate = true;
    this.geometry.attributes.aSeed.needsUpdate = true;
    this.geometry.attributes.aScale.needsUpdate = true;
    this.geometry.attributes.aRot.needsUpdate = true;
    this.geometry.attributes.aStretch.needsUpdate = true;
  }
}
