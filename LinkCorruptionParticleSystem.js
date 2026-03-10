/**
 * LinkCorruptionParticleSystem.js
 * ---------------------------------------------------------------------------
 * Minimal GPU-driven corruption particles for links.
 * Visual: fractured red shards that jitter, burst outward, and dissolve.
 * Implementation: single THREE.Points pool, shader sprite shard mask (gl_PointCoord).
 * No gameplay changes; visual-only.
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const POOL_SIZE = 480;
const PER_LINK_CAP = 18;

function ensureUserData(obj) {
  if (!obj.userData) {
    Object.defineProperty(obj, 'userData', { value: {}, writable: true });
  }
  return obj.userData;
}

export class LinkCorruptionParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Pool + per-link index map
    this.poolSize = POOL_SIZE;
    this.active = new Array(POOL_SIZE).fill(false);
    this.linkRefs = new Array(POOL_SIZE).fill(null);
    this.linkIndices = new Map(); // linkId -> array of pool indices

    // Attributes
    this.startPos = new Float32Array(POOL_SIZE * 3);
    this.velocity = new Float32Array(POOL_SIZE * 3);
    this.jitterDir = new Float32Array(POOL_SIZE * 3);
    this.lifeAttr = new Float32Array(POOL_SIZE * 2); // start, life
    this.seedAttr = new Float32Array(POOL_SIZE);
    this.scaleAttr = new Float32Array(POOL_SIZE);
    this.rotAttr = new Float32Array(POOL_SIZE); // rotation rate
    this.stretchAttr = new Float32Array(POOL_SIZE); // anisotropic stretch factor

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.startPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocity, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aJitter', new THREE.BufferAttribute(this.jitterDir, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifeAttr, 2).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seedAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scaleAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aRot', new THREE.BufferAttribute(this.rotAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aStretch', new THREE.BufferAttribute(this.stretchAttr, 1).setUsage(THREE.DynamicDrawUsage));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0xff2244) },
        uEdgeColor: { value: new THREE.Color(0xff5577) },
        uSoftNear: { value: 0.28 },
        uSoftRange: { value: 0.55 }
      },
      vertexShader: `
        attribute vec3 aVelocity;
        attribute vec3 aJitter;
        attribute vec2 aLife;
        attribute float aSeed;
        attribute float aScale;
        attribute float aRot;
        attribute float aStretch;
        uniform float uTime;
        varying float vT;
        varying float vSeed;
        varying float vDepth;
        varying float vRot;
        varying float vStretch;
        void main() {
          float age = uTime - aLife.x;
          vT = clamp(age / aLife.y, 0.0, 1.0);
          vSeed = aSeed;
          vStretch = aStretch;
          float jitterAmp = (1.0 - vT) * 0.08;
          float jitter = sin(uTime * (6.0 + aSeed * 8.0)) * jitterAmp;
          vec3 pos = position;
          pos += aVelocity * age;
          pos += aJitter * jitter;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vDepth = -mvPosition.z;
          vRot = aRot;
          float size = mix(6.0, 2.0, vT) * aScale;
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vT;
        varying float vSeed;
        varying float vDepth;
        varying float vRot;
        varying float vStretch;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        uniform float uSoftNear;
        uniform float uSoftRange;

        float hash11(float p) {
          p = fract(p * 0.1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
        }

        // Shard mask: rotated triangle with soft edges
        float shardMask(vec2 uv, float ang) {
          vec2 p = uv * 2.0 - 1.0;
          float c = cos(ang), s = sin(ang);
          mat2 r = mat2(c, -s, s, c);
          p = r * p;
          // Apply anisotropic stretch
          p.x /= vStretch;
          // Skew to get asymmetric shard
          p.x += 0.1;
          float tri = clamp(min(p.y + 0.7, min(-p.x + 0.7, p.x + 0.7)), 0.0, 1.0);
          float edge = smoothstep(0.0, 0.25, tri) * (1.0 - smoothstep(0.55, 0.8, tri));
          return edge;
        }

        void main() {
          vec2 uv = gl_PointCoord;
          float depthFade = 1.0 - smoothstep(uSoftNear, uSoftNear + uSoftRange, vDepth);
          float ang = vRot * (0.5 + hash11(vSeed * 71.7 + vT * 19.1));
          float mask = shardMask(uv, ang);

          // Ghost speck at absorption (end of life)
          float ghostT = smoothstep(0.75, 0.95, vT);
          float ghostAng = -vRot * (0.5 + hash11(vSeed * 91.3 + vT * 23.7)); // opposite rotation
          float ghostMask = shardMask(uv, ghostAng) * 0.4; // smaller alpha
          mask = max(mask, ghostMask * ghostT);

          // Flicker
          float flicker = 0.8 + 0.2 * hash11(vSeed * 311.0 + vT * 97.0);
          float alpha = mask * depthFade * flicker * (1.0 - smoothstep(0.85, 1.0, vT));
          if (alpha < 0.01) discard;

          vec3 base = mix(uBaseColor, uEdgeColor, 0.3 + 0.4 * hash11(vSeed * 151.0));
          gl_FragColor = vec4(base, alpha);
        }
      `
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    const order = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
    this.points.renderOrder = order;
    ensureUserData(this.points).isCorruptionParticles = true;
    this.scene.add(this.points);
  }

  updateLinkParticles(link, deltaTime) {
    if (!link?.id || !link.curve) return null;
    const corruption = Math.max(0, link.corruptionLevel ?? link.corruption ?? 0);

    // Spawn
    if (corruption > 0.1) {
      const desired = Math.floor(corruption * 24 * deltaTime);
      this._spawn(link, desired, corruption, deltaTime);
    }

    // Update only particles for this link
    this._updateForLink(link, deltaTime);
    return null;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.linkIndices.clear();
  }

  clearLinkParticles(linkId) {
    const list = this.linkIndices.get(linkId);
    if (!list) return;
    for (const idx of list) {
      this.active[idx] = false;
      this.linkRefs[idx] = null;
    }
    this.linkIndices.delete(linkId);
  }

  // -------------------------------------------------------------------------
  _spawn(link, count, corruption, deltaTime) {
    if (!count || count <= 0) return;
    const list = this.linkIndices.get(link.id) || [];
    const current = list.length;
    const available = Math.max(0, PER_LINK_CAP - current);
    if (available <= 0) return;
    const spawnCount = Math.min(count, available);

    for (let n = 0; n < spawnCount; n++) {
      const idx = this._acquire();
      if (idx === -1) break;
      list.push(idx);
      this.linkIndices.set(link.id, list);
      this.linkRefs[idx] = link;
      this.active[idx] = true;

      // Pick a point on the curve - bias toward higher corruption node
      let t = Math.random();
      const nodeA = link.sourceNode || link.nodeA;
      const nodeB = link.targetNode || link.nodeB;
      const corruptionA = nodeA?.corruptionLevel ?? nodeA?.corruption ?? 0;
      const corruptionB = nodeB?.corruptionLevel ?? nodeB?.corruption ?? 0;
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

      const baseSpeed = THREE.MathUtils.lerp(1.2, 3.5, corruption);
      const speed = baseSpeed * (0.8 + Math.random() * 0.6);

      const startOffset = radial.clone().multiplyScalar(0.03);
      pos.add(startOffset);

      const jitterDir = radial.clone().multiplyScalar(0.5).addScaledVector(tangent, 0.2).normalize();

      const life = 0.5 + Math.random() * 0.35;
      const scale = 0.9 + Math.random() * 0.4;
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
        this.linkRefs[idx] = null;
        list.splice(i, 1);
      }
    }
    if (list.length === 0) {
      this.linkIndices.delete(link.id);
      return;
    }

    this.material.uniforms.uTime.value = now;
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
