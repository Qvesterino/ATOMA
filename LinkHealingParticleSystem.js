/**
 * LinkHealingParticleSystem.js
 * ---------------------------------------------------------------------------
 * Minimal GPU-friendly healing particle effect for links.
 * Visual: tiny knot sprites (4-armed), harmony-green with cyan rim,
 *          plus Bloom Petal sprites for variety (50/50 split),
 * micro-orbit → stabilizing → snap-into-link.
 * Implementation: single THREE.Points pool, ShaderMaterial using gl_PointCoord.
 *
 * Behavior:
 * - Spawns slightly off-link, orbits/helixes, spirals inward, flashes on absorb.
 * - Size tapers down, brightness rises toward absorption.
 * - Optional per-link arrival callback (read-only impact hook).
 *
 * No gameplay changes; visual-only.
 */

import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

const DEFAULT_POOL = 320;
const MIN_SIZE = 7.0;   // px
const MAX_SIZE = 16.0;  // px
const PER_LINK_CAP = 20;

function ensureUserData(obj) {
  if (!obj.userData) {
    Object.defineProperty(obj, 'userData', { value: {}, writable: true });
  }
  return obj.userData;
}

// Lightweight per-particle storage (arrays for cache-friendly updates)
class HealingPool {
  constructor(capacity) {
    this.capacity = capacity;
    this.active = new Array(capacity).fill(false);
    this.startTime = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.progress = new Float32Array(capacity);
    this.orbitPhase = new Float32Array(capacity);
    this.orbitSpeed = new Float32Array(capacity);
    this.orbitRadius = new Float32Array(capacity);
    this.driftSpeed = new Float32Array(capacity);
    this.anchorT = new Float32Array(capacity);
    this.seed = new Float32Array(capacity);
    this.arrived = new Array(capacity).fill(false);
    this.link = new Array(capacity).fill(null);
    this.curve = new Array(capacity).fill(null);
    this.normal = new Array(capacity).fill(null); // THREE.Vector3 per particle (reused)
    this.binormal = new Array(capacity).fill(null);
    // O(1) slot acquisition - maintain free list head
    this._freeHead = 0;
    this._nextSlot = new Uint16Array(capacity);
    for (let i = 0; i < capacity; i++) this._nextSlot[i] = i + 1;
    this._nextSlot[capacity - 1] = 0xFFFF; // sentinel
  }

  activate(index, opts) {
    this.active[index] = true;
    this.arrived[index] = false;
    this.startTime[index] = opts.startTime;
    this.life[index] = opts.life;
    this.progress[index] = 1.0;
    this.orbitPhase[index] = opts.orbitPhase;
    this.orbitSpeed[index] = opts.orbitSpeed;
    this.orbitRadius[index] = opts.orbitRadius;
    this.driftSpeed[index] = opts.driftSpeed;
    this.anchorT[index] = opts.anchorT;
    this.seed[index] = opts.seed;
    this.link[index] = opts.link;
    this.curve[index] = opts.curve;
    if (!this.normal[index]) this.normal[index] = new THREE.Vector3();
    if (!this.binormal[index]) this.binormal[index] = new THREE.Vector3();
    this.normal[index].copy(opts.normal);
    this.binormal[index].copy(opts.binormal);
  }

  deactivate(index) {
    this.active[index] = false;
    this.link[index] = null;
    this.curve[index] = null;
    // Return slot to free list O(1)
    this._nextSlot[index] = this._freeHead;
    this._freeHead = index;
  }
}

export class LinkHealingParticleSystem {
  constructor(scene, poolSize = DEFAULT_POOL) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.pool = new HealingPool(poolSize);
    this.onParticleArrival = null;
    this.pendingRequests = [];
    this._radialScratch = new THREE.Vector3();

    // Geometry
    this.positions = new Float32Array(poolSize * 3);
    this.sizes = new Float32Array(poolSize);
    this.lifeAttr = new Float32Array(poolSize * 2); // start, life
    this.seedAttr = new Float32Array(poolSize);
    this.variantAttr = new Float32Array(poolSize);
    this.tints = new Float32Array(poolSize * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifeAttr, 2).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seedAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aVariant', new THREE.BufferAttribute(this.variantAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aTint', new THREE.BufferAttribute(this.tints, 3).setUsage(THREE.DynamicDrawUsage));

    // Shader material (point sprite)
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x39ff14) }, // harmony neon green
        uEdgeColor: { value: new THREE.Color(0x7fff4d) }, // harmony neon green edge
        uSizeRange: { value: new THREE.Vector2(MIN_SIZE, MAX_SIZE) },
        uOpacity: { value: 2.8 },
        uSofteningNear: { value: 0.3 },   // meters from camera to start fading
        uSofteningRange: { value: 0.6 }   // fade span
      },
      vertexShader: `
        attribute float aSize;
        attribute vec2 aLife;
        attribute float aSeed;
        attribute float aVariant;
        attribute vec3 aTint;
        uniform float uTime;
        uniform vec2 uSizeRange;
        uniform float uOpacity;
        uniform float uSofteningNear;
        uniform float uSofteningRange;
        varying float vLifeT;
        varying float vSeed;
        varying float vVariant;
        varying vec3 vTint;
        varying float vDepth;
        varying float vRot;
        void main() {
          float age = uTime - aLife.x;
          vLifeT = clamp(age / aLife.y, 0.0, 1.0);
          // size shrinks slightly, brightens near end
          float sizeFade = mix(1.0, 0.65, vLifeT);
          float size = mix(uSizeRange.x, uSizeRange.y, 1.0 - vLifeT) * sizeFade;
          // Subtle breathing pulse — each particle has unique phase
          float breath = 1.0 + sin(age * 5.0 + aSeed * 6.2831853) * 0.04;
          size *= breath;
          vSeed = aSeed;
          vVariant = aVariant;
          vTint = aTint;
          // Medium-speed rotation over flight, stable per particle by seed.
          vRot = age * 2.4 + aSeed * 6.2831853;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          gl_PointSize = size * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vLifeT;
        varying float vSeed;
        varying float vVariant;
        varying vec3 vTint;
        varying float vDepth;
        varying float vRot;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        uniform float uOpacity;
        uniform float uSofteningNear;
        uniform float uSofteningRange;

        float hash11(float p) {
          // Cheaper hash: 3 muls vs original 5
          p = fract(p * 0.1031);
          p *= p + 33.33;
          return fract(p + p * p * 0.267);
        }

        // Sharper six-petal rosette for readability.
        float knot(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) return 0.0;
          float ang = atan(p.y, p.x);
          float petals = abs(cos(3.0 * ang));
          // Optimized: pow(petals, 1.4) → quad approximation
          float petalRadius = 0.24 + 0.56 * petals * petals;
          float petalMask = 1.0 - smoothstep(petalRadius - 0.07, petalRadius + 0.03, r);
          float centerCut = smoothstep(0.05, 0.18, r);
          float core = 1.0 - smoothstep(0.0, 0.11, r);
          return clamp(petalMask * centerCut + core * 0.55, 0.0, 1.0);
        }

        // Soft Bloom Petal for a more organic healing read.
        float bloomPetal(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) return 0.0;

          float ang = atan(p.y, p.x);
          float petals = abs(cos(4.0 * ang));
          // Optimized: pow(petals, 1.15) → smoother lerp
          float petalRadius = 0.18 + 0.62 * smoothstep(0.0, 1.0, petals);
          float bloom = 1.0 - smoothstep(petalRadius - 0.12, petalRadius + 0.04, r);
          float core = 1.0 - smoothstep(0.0, 0.14, r);
          float rim = smoothstep(0.58, 0.96, petals) * (1.0 - smoothstep(0.82, 1.0, r));
          return clamp(bloom * 0.92 + core * 0.62 + rim * 0.22, 0.0, 1.0);
        }

        void main() {
          vec2 uv = gl_PointCoord;
          vec2 p = uv - vec2(0.5);
          float cs = cos(vRot);
          float sn = sin(vRot);
          p = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);
          uv = p + vec2(0.5);
          float useBloom = step(0.5, vVariant);
          float shape = mix(knot(uv), bloomPetal(uv), useBloom);

          float lifeFade = smoothstep(0.0, 0.06, vLifeT) * (1.0 - smoothstep(0.62, 1.0, vLifeT));
          // Match spark-style visibility: only soften when particles get too close to the camera.
          float depthFade = smoothstep(uSofteningNear, uSofteningNear + uSofteningRange, vDepth);
          // Enhanced flash: wider range, brighter peak for luminous absorption
          float flash = smoothstep(0.85, 1.0, vLifeT) * 1.4;
          
          // Unified hash for all randomization
          float h = hash11(vSeed + vLifeT * 13.7);
          float randTint = fract(h * 17.3);
          float angJitter = h * 2.0 - 1.0;
          
          float radial = clamp(1.0 - length(gl_PointCoord * 2.0 - 1.0), 0.0, 1.0);
          float streak = flash * radial * (0.6 + 0.4 * angJitter);

          // Luminous hot core — particles glow from within
          float dist = length(p);
          float core = 1.0 - smoothstep(0.0, 0.18, dist);
          float innerGlow = 1.0 - smoothstep(0.05, 0.35, dist);
          // Subtle shimmer
          float shimmer = 1.0 + sin(vLifeT * 15.7 + dist * 12.0) * 0.04;

          vec3 base = mix(uBaseColor, vec3(0.84, 1.0, 0.92), useBloom * 0.48);
          vec3 edge = mix(uEdgeColor, vec3(0.72, 1.0, 0.98), useBloom * 0.56);
          vec3 color = mix(base, edge, 0.35 + 0.25 * randTint);
          // Hot core shifts toward luminous white-cyan
          color += vec3(core * 0.28, core * 0.38, core * 0.32);
          // Inner glow adds ethereal depth
          color += innerGlow * vec3(0.06, 0.12, 0.10);
          color += (flash + streak) * mix(0.38, 0.48, useBloom);
          color += useBloom * 0.10;
          color *= shimmer;

          float driftFade = 1.0 - smoothstep(0.60, 1.0, vLifeT);
          float alpha = shape * (lifeFade + flash + streak) * depthFade * driftFade * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      customProgramCacheKey: () => 'ATOMA_HEALING_v2'
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = true;
    applyLinkRenderLayer(this.points, 'LINK_PARTICLES');
    ensureUserData(this.points).isHealingParticles = true;
    this.scene.add(this.points);
  }

  queueEmission(request) {
    // request: {link, curve, linkDirection, count, time, harmony, corruption, burstPhase, tintColor}
    if (!request?.link || !request?.curve || request.count <= 0) return;
    this.pendingRequests.push(request);
  }

  setArrivalCallback(cb) {
    this.onParticleArrival = cb;
  }

  emitBackwardsAlongLink(link, curve, linkDirection, emissionRate, time, harmony = 0.8, _corruption = 0, burstPhase = null, burstCount = 0, tintColor = null, countOverride = null) {
    if (!curve || !link) return;
    const dt = 0.016; // fallback frame step if countOverride not provided
    let count = countOverride ?? Math.max(1, Math.floor(emissionRate * dt));
    if (burstCount > 0) {
      count += burstCount;
    }

    for (let n = 0; n < count; n++) {
      const idx = this._acquireSlot();
      if (idx === -1) break;

      const progress = Math.random(); // start somewhere along link (will travel backward)
      const pos = curve.getPointAt(progress);
      const tan = curve.getTangentAt(progress).normalize();
      const normal = this._makeNormal(tan, idx);
      const binormal = this.pool.binormal[idx];
      binormal.crossVectors(tan, normal).normalize();

      const orbitPhase = burstPhase !== null ? burstPhase : Math.random() * Math.PI * 2.0;
      const orbitSpeed = 0.45 + Math.random() * 0.25;
      const orbitRadius = 0.06 + Math.random() * 0.04;
      const driftSpeed = 0.045 + Math.random() * 0.03;
      const life = 0.85 + Math.random() * 0.25;
      const seed = Math.random();
      const variant = Math.random() < 0.5 ? 0.0 : 1.0;

      this.pool.activate(idx, {
        startTime: time,
        life,
        orbitPhase,
        orbitSpeed,
        orbitRadius,
        driftSpeed,
        anchorT: progress,
        seed,
        variant,
        link,
        curve,
        normal,
        binormal
      });

      // Set initial attributes
      const i3 = idx * 3;
      this.positions[i3] = pos.x;
      this.positions[i3 + 1] = pos.y;
      this.positions[i3 + 2] = pos.z;
      this.sizes[idx] = MAX_SIZE;
      this.lifeAttr[idx * 2] = time;
      this.lifeAttr[idx * 2 + 1] = life;
      this.seedAttr[idx] = seed;
      this.variantAttr[idx] = variant;

      const tint = tintColor || link?.userData?.baseColorObj || null;
      if (tint && tint.isColor) {
        this.tints[i3] = tint.r;
        this.tints[i3 + 1] = tint.g;
        this.tints[i3 + 2] = tint.b;
      } else {
        this.tints[i3] = this.material.uniforms.uBaseColor.value.r;
        this.tints[i3 + 1] = this.material.uniforms.uBaseColor.value.g;
        this.tints[i3 + 2] = this.material.uniforms.uBaseColor.value.b;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    // Static attributes only set once on emit - don't flag per-frame
    // aLife, aSeed, aVariant, aTint are set only during emitBackwardsAlongLink
  }

  update(deltaTime, time) {
    const safeTime = Number.isFinite(time) ? time : ((performance?.now?.() ?? Date.now()) * 0.001);
    // Process queued emissions with per-link cap
    if (this.pendingRequests.length) {
      // Build current active per link
      const activePerLink = new Map();
      let freeSlots = 0;
      for (let i = 0; i < this.poolSize; i++) {
        if (this.pool.active[i]) {
          const id = this.pool.link[i]?.id;
          if (id !== undefined) {
            activePerLink.set(id, (activePerLink.get(id) || 0) + 1);
          }
        } else {
          freeSlots++;
        }
      }

      // Sort requests by harmony descending (higher surplus first)
      this.pendingRequests.sort((a, b) => (b.harmony ?? 0) - (a.harmony ?? 0));

      for (const req of this.pendingRequests) {
        if (freeSlots <= 0) break;
        const linkId = req.link.id;
        const current = activePerLink.get(linkId) || 0;
        const available = Math.max(0, PER_LINK_CAP - current);
        if (available <= 0) continue;
        const toEmit = Math.min(req.count, available, freeSlots);
        if (toEmit <= 0) continue;

        this.emitBackwardsAlongLink(
          req.link,
          req.curve,
          req.linkDirection,
          0,
          req.time,
          req.harmony,
          req.corruption,
          req.burstPhase,
          req.burstPhase ? 0 : 0,
          req.tintColor,
          toEmit
        );

        activePerLink.set(linkId, current + toEmit);
        freeSlots -= toEmit;
      }
      this.pendingRequests.length = 0;
    }

    this.material.uniforms.uTime.value = safeTime;
    this.material.uniforms.uOpacity.value = 2.8;
    this.points.visible = true;
    let anyActive = false;

    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool.active[i]) continue;
      anyActive = true;
      const life = this.pool.life[i];
      const age = safeTime - this.pool.startTime[i];
      if (age >= life) {
        this.pool.deactivate(i);
        continue;
      }

      const t = 1.0 - age / life; // 1 → 0 (toward source)
      this.pool.progress[i] = t;

      const curve = this.pool.curve[i];
      if (!curve) {
        this.pool.deactivate(i);
        continue;
      }

      const anchorT = this.pool.anchorT[i];
      const curveT = THREE.MathUtils.lerp(anchorT, Math.max(0, t), 0.12);
      const posOnCurve = curve.getPointAt(curveT);
      const tan = curve.getTangentAt(curveT).normalize();
      // refresh frame cheaply
      this.pool.normal[i] = this._makeNormal(tan, i, this.pool.normal[i]);
      this.pool.binormal[i].crossVectors(tan, this.pool.normal[i]).normalize();

      const ang = this.pool.orbitPhase[i] + this.pool.orbitSpeed[i] * age;
      const radialDir = this._radialScratch
        .copy(this.pool.normal[i]).multiplyScalar(Math.cos(ang))
        .addScaledVector(this.pool.binormal[i], Math.sin(ang))
        .normalize();
      const surfaceOffset = this.pool.orbitRadius[i];
      const driftDistance = this.pool.driftSpeed[i] * age;
      const liftDistance = age * age * 0.02;

      const offset = radialDir.multiplyScalar(surfaceOffset + driftDistance)
        .addScaledVector(this.pool.binormal[i], liftDistance);

      const i3 = i * 3;
      this.positions[i3] = posOnCurve.x + offset.x;
      this.positions[i3 + 1] = posOnCurve.y + offset.y;
      this.positions[i3 + 2] = posOnCurve.z + offset.z;

      // shrink size slightly
      this.sizes[i] = THREE.MathUtils.lerp(MAX_SIZE, MIN_SIZE, 1.0 - t);

      // arrival detection near source end
      if (!this.pool.arrived[i] && t <= 0.05 && this.onParticleArrival) {
        this.pool.arrived[i] = true;
        this.onParticleArrival({ index: i }, this.pool.link[i], safeTime);
      }
    }

    if (anyActive) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.aSize.needsUpdate = true;
    }
  }

  clearLink(linkId) {
    for (let i = 0; i < this.poolSize; i++) {
      if (this.pool.active[i] && this.pool.link[i]?.id === linkId) {
        this.pool.deactivate(i);
      }
    }
  }

  dispose() {
    this.scene?.remove?.(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }

  _acquireSlot() {
    if (this.pool._freeHead === 0xFFFF) return -1;
    const idx = this.pool._freeHead;
    this.pool._freeHead = this.pool._nextSlot[idx];
    return idx;
  }

  _makeNormal(tangent, idx, reuse) {
    const n = reuse || new THREE.Vector3();
    // Build any stable perpendicular
    if (Math.abs(tangent.y) < 0.99) {
      n.set(-tangent.z, 0, tangent.x).normalize();
    } else {
      n.set(0, tangent.z, -tangent.y).normalize();
    }
    return n;
  }
}

/**
 * LinkHealingEmitter — remains compatible with existing conduit logic.
 */
export class LinkHealingEmitter {
  constructor(link, particleSystem) {
    this.link = link;
    this.particleSystem = particleSystem;
    this.harmonyThreshold = 0.05;
    this.baseEmissionRate = 18;
    this.enabled = true;
    this.harmonyInfluence = 1.2;
    this.corruptionInhibition = 1.0;

    // Sync burst control
    this.burstThreshold = 0.9;
    this.burstCount = 8;
    this.prevHarmony = 0;
  }

  update(deltaTime, time, curve, linkDirection, harmony = 0.5, corruption = 0.2, tintColor = null) {
    if (!this.enabled || !curve || harmony < this.harmonyThreshold) return;

    // Exact visual mapping: 0.1 -> 2, 0.2 -> 4, ... 1.0 -> 20
    const countScaled = Math.max(0, Math.round(harmony * 20));

    const crossedBurst = this.prevHarmony < this.burstThreshold && harmony >= this.burstThreshold;
    const burstPhase = crossedBurst ? Math.random() * Math.PI * 2.0 : null;
    const burstCount = crossedBurst ? this.burstCount : 0;

    // queue emission for central budgeting
    const count = Math.max(0, countScaled) + burstCount;
    this.particleSystem.queueEmission({
      link: this.link,
      curve,
      linkDirection,
      count,
      time,
      harmony,
      corruption,
      burstPhase,
      tintColor
    });

    this.prevHarmony = harmony;
  }

  setHarmonyThreshold(threshold) {
    this.harmonyThreshold = THREE.MathUtils.clamp(threshold, 0, 1);
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
