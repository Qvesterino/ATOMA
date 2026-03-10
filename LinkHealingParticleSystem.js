/**
 * LinkHealingParticleSystem.js
 * ---------------------------------------------------------------------------
 * Minimal GPU-friendly healing particle effect for links.
 * Visual: tiny knot sprites (4-armed), harmony-green with cyan rim,
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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const DEFAULT_POOL = 320;
const MIN_SIZE = 2.0;   // px
const MAX_SIZE = 4.0;   // px
const PER_LINK_CAP = 12;

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
    this.seed = new Float32Array(capacity);
    this.arrived = new Array(capacity).fill(false);
    this.link = new Array(capacity).fill(null);
    this.curve = new Array(capacity).fill(null);
    this.normal = new Array(capacity).fill(null); // THREE.Vector3 per particle (reused)
    this.binormal = new Array(capacity).fill(null);
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
  }
}

export class LinkHealingParticleSystem {
  constructor(scene, poolSize = DEFAULT_POOL) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.pool = new HealingPool(poolSize);
    this.onParticleArrival = null;
    this.pendingRequests = [];

    // Geometry
    this.positions = new Float32Array(poolSize * 3);
    this.sizes = new Float32Array(poolSize);
    this.lifeAttr = new Float32Array(poolSize * 2); // start, life
    this.seedAttr = new Float32Array(poolSize);
    this.tints = new Float32Array(poolSize * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifeAttr, 2).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seedAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aTint', new THREE.BufferAttribute(this.tints, 3).setUsage(THREE.DynamicDrawUsage));

    // Shader material (point sprite)
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x66ff99) }, // harmony green
        uEdgeColor: { value: new THREE.Color(0x66e6ff) }, // cyan rim
        uSizeRange: { value: new THREE.Vector2(MIN_SIZE, MAX_SIZE) },
        uSofteningNear: { value: 0.3 },   // meters from camera to start fading
        uSofteningRange: { value: 0.6 }   // fade span
      },
      vertexShader: `
        attribute float aSize;
        attribute vec2 aLife;
        attribute float aSeed;
        attribute vec3 aTint;
        uniform float uTime;
        uniform vec2 uSizeRange;
        uniform float uSofteningNear;
        uniform float uSofteningRange;
        varying float vLifeT;
        varying float vSeed;
        varying vec3 vTint;
        varying float vDepth;
        void main() {
          float age = uTime - aLife.x;
          vLifeT = clamp(age / aLife.y, 0.0, 1.0);
          // size shrinks slightly, brightens near end
          float sizeFade = mix(1.0, 0.65, vLifeT);
          float size = mix(uSizeRange.x, uSizeRange.y, 1.0 - vLifeT) * sizeFade;
          vSeed = aSeed;
          vTint = aTint;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vLifeT;
        varying float vSeed;
        varying vec3 vTint;
        varying float vDepth;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        uniform float uSofteningNear;
        uniform float uSofteningRange;

        float hash11(float p) {
          p = fract(p * 0.1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
        }

        // 4-armed knot mask using polar repetition
        float knot(vec2 uv) {
          vec2 p = uv * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) return 0.0;
          float ang = atan(p.y, p.x);
          float arms = 4.0;
          float m = abs(cos(arms * ang)) * pow(1.0 - r, 1.0);
          float core = smoothstep(0.55, 0.2, r);
          return clamp(core * (0.35 + 0.75 * m), 0.0, 1.0);
        }

        void main() {
          vec2 uv = gl_PointCoord;
          float shape = knot(uv);

          // Afterimage (cheap): offset seed-based jitter, scaled by life
          float ghostLife = smoothstep(0.1, 0.6, vLifeT) * (1.0 - smoothstep(0.75, 1.0, vLifeT));
          float ghost = knot(uv + (vSeed - 0.5) * 0.02) * 0.35 * ghostLife;

          float lifeFade = smoothstep(0.0, 0.08, vLifeT) * (1.0 - smoothstep(0.8, 1.0, vLifeT));
          float depthFade = 1.0 - smoothstep(uSofteningNear, uSofteningNear + uSofteningRange, vDepth);
          float flash = smoothstep(0.92, 1.0, vLifeT) * 1.1;
          // Radial streak: angular jitter using seed, sharp near center
          float angJitter = hash11(vSeed * 97.3 + vLifeT * 37.1) * 2.0 - 1.0;
          float radial = clamp(1.0 - length(gl_PointCoord * 2.0 - 1.0), 0.0, 1.0);
          float streak = flash * radial * (0.6 + 0.4 * angJitter);

          vec3 base = mix(uBaseColor, vTint, 0.35);
          vec3 edge = mix(uEdgeColor, vTint, 0.2);
          float randTint = hash11(vSeed * 151.7 + vLifeT * 11.3);
          vec3 color = mix(base, edge, 0.35 + 0.25 * randTint);
          color += (flash + streak) * 0.35;

          float alpha = (shape + ghost) * (lifeFade + flash + streak) * depthFade;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    const order = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
    this.points.renderOrder = order;
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
      const binormal = new THREE.Vector3().crossVectors(tan, normal).normalize();

      const orbitPhase = burstPhase !== null ? burstPhase : Math.random() * Math.PI * 2.0;
      const orbitSpeed = 6.0 + Math.random() * 2.5; // stabilizes mid-life
      const orbitRadius = 0.08 + Math.random() * 0.04;
      const life = 0.55 + Math.random() * 0.25;
      const seed = Math.random();

      this.pool.activate(idx, {
        startTime: time,
        life,
        orbitPhase,
        orbitSpeed,
        orbitRadius,
        seed,
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
    this.geometry.attributes.aLife.needsUpdate = true;
    this.geometry.attributes.aSeed.needsUpdate = true;
    this.geometry.attributes.aTint.needsUpdate = true;
  }

  update(deltaTime, time) {
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

    this.material.uniforms.uTime.value = time;
    let anyActive = false;

    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool.active[i]) continue;
      anyActive = true;
      const life = this.pool.life[i];
      const age = time - this.pool.startTime[i];
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

      const posOnCurve = curve.getPointAt(Math.max(0, t));
      const tan = curve.getTangentAt(Math.max(0, t)).normalize();
      // refresh frame cheaply
      this.pool.normal[i] = this._makeNormal(tan, i, this.pool.normal[i]);
      this.pool.binormal[i].crossVectors(tan, this.pool.normal[i]).normalize();

      const ang = this.pool.orbitPhase[i] + this.pool.orbitSpeed[i] * age;
      const radius = this.pool.orbitRadius[i] * (0.4 + 0.6 * t); // shrink toward snap

      const offset = new THREE.Vector3()
        .copy(this.pool.normal[i]).multiplyScalar(Math.cos(ang) * radius)
        .addScaledVector(this.pool.binormal[i], Math.sin(ang) * radius);

      const i3 = i * 3;
      this.positions[i3] = posOnCurve.x + offset.x;
      this.positions[i3 + 1] = posOnCurve.y + offset.y;
      this.positions[i3 + 2] = posOnCurve.z + offset.z;

      // shrink size slightly
      this.sizes[i] = THREE.MathUtils.lerp(MAX_SIZE, MIN_SIZE, 1.0 - t);

      // arrival detection near source end
      if (!this.pool.arrived[i] && t <= 0.05 && this.onParticleArrival) {
        this.pool.arrived[i] = true;
        this.onParticleArrival({ index: i }, this.pool.link[i], time);
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
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }

  _acquireSlot() {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool.active[i]) return i;
    }
    return -1;
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
    this.harmonyThreshold = 0.6;
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

    let rate = this.baseEmissionRate;
    rate *= Math.pow((harmony - this.harmonyThreshold) / (1.0 - this.harmonyThreshold), 1.4);
    rate *= (1.0 - corruption * 0.6);
    rate = Math.max(0, rate);

    const crossedBurst = this.prevHarmony < this.burstThreshold && harmony >= this.burstThreshold;
    const burstPhase = crossedBurst ? Math.random() * Math.PI * 2.0 : null;
    const burstCount = crossedBurst ? this.burstCount : 0;

    // queue emission for central budgeting
    const count = Math.max(1, Math.floor(rate * Math.max(0.001, deltaTime))) + burstCount;
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
}
