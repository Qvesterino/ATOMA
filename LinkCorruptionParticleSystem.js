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
        uBaseColor: { value: new THREE.Color(0xff1744) }, // debug neon red
        uEdgeColor: { value: new THREE.Color(0xff5a36) }, // debug neon red edge
        uOpacity: { value: 2.2 },
        uSizeRange: { value: new THREE.Vector2(6.0, 14.0) },
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

        // Broken asymmetric fragment built from three wedge shards.
        float shardMask(vec2 uv, float skew, float stretch) {
          vec2 p = uv * 2.0 - 1.0;
          p.x = p.x * (0.82 / stretch) + skew;
          p.y *= 1.08;

          float mainFrag = triMask(p, vec2(-0.62, -0.56), vec2(0.58, -0.18), vec2(-0.08, 0.82));
          float sideFrag = triMask(p, vec2(-0.18, -0.08), vec2(0.78, 0.16), vec2(0.08, 0.92));
          float chipFrag = triMask(p, vec2(-0.72, -0.06), vec2(-0.12, 0.18), vec2(-0.42, 0.74));

          float fragment = max(mainFrag, max(sideFrag * 0.82, chipFrag * 0.68));
          float crack = 1.0 - smoothstep(0.02, 0.08, abs(p.x * 0.82 + p.y * 0.36 - 0.08));
          float notch = 1.0 - smoothstep(0.0, 0.22, length(p - vec2(0.18, 0.06)));
          float edgeSoft = 1.0 - smoothstep(0.78, 1.0, length(p));

          return clamp(fragment * edgeSoft - notch * 0.55 + crack * 0.18, 0.0, 1.0);
        }

        void main() {
          vec2 uv = gl_PointCoord;
          float depthFade = smoothstep(uSoftNear, uSoftNear + uSoftRange, vDepth);
          float skew = (hash11(vSeed * 91.7) - 0.5) * 0.45;
          float stretch = 0.9 + hash11(vSeed * 57.3) * 0.9;
          float shape = shardMask(uv, skew, stretch);
          float ghostLife = smoothstep(0.1, 0.55, vT) * (1.0 - smoothstep(0.76, 1.0, vT));
          float ghost = shardMask(uv + vec2((vSeed - 0.5) * 0.03, -0.015), skew * -0.6, stretch * 1.08) * 0.28 * ghostLife;
          float lifeFade = smoothstep(0.0, 0.08, vT) * (1.0 - smoothstep(0.7, 1.0, vT));
          float flash = smoothstep(0.88, 1.0, vT) * 1.2;
          float radial = clamp(1.0 - length(gl_PointCoord * 2.0 - 1.0), 0.0, 1.0);
          float streak = flash * radial;
          float driftFade = 1.0 - smoothstep(0.68, 1.0, vT);
          float alpha = (shape + ghost) * (lifeFade + flash + streak) * depthFade * driftFade * uOpacity;
          if (alpha < 0.01) discard;

          vec3 base = mix(uBaseColor, uEdgeColor, 0.35 + 0.25 * hash11(vSeed * 151.0));
          base += (flash + streak) * 0.35;
          gl_FragColor = vec4(base, alpha);
        }
      `
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = true;
    applyLinkRenderLayer(this.points, 'LINK_PARTICLES');
    ensureUserData(this.points).isCorruptionParticles = true;
    this.scene.add(this.points);
  }

  updateLinkParticles(link, deltaTime) {
    if (!link?.id || !link.curve) return null;
    const nodeA = link.sourceNode || link.nodeA || link.source;
    const nodeB = link.targetNode || link.nodeB || link.target;
    const endpointCorruption = Math.max(
      this._readNodeCorruption(nodeA),
      this._readNodeCorruption(nodeB)
    );
    const corruption = Math.max(
      0,
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruptionLevel ??
      link?.userData?.corruption ??
      link.corruptionLevel ??
      link.corruption ??
      endpointCorruption ??
      0
    );
    const visualCorruption = THREE.MathUtils.clamp(corruption * 12.0, 0, 1);

    // Spawn
    if (corruption > 0.005) {
      // Visual-only amplification so low runtime corruption remains visible.
      // Exact visual mapping: 0.1 -> 2, 0.2 -> 4, ... 1.0 -> 20
      const desired = Math.max(0, Math.round(corruption * 20));
      if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
        const nowMs = performance.now();
        if (!this._debugLastLog || nowMs - this._debugLastLog > 1000) {
          const activeForLink = this.linkIndices.get(link.id)?.length || 0;
          console.debug('[CorruptionParticles][spawn]', {
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
      this._spawn(link, desired, visualCorruption, deltaTime);
    } else if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
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

      const life = 0.24 + Math.random() * 0.12;
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
        this.linkRefs[idx] = null;
        list.splice(i, 1);
      }
    }
    if (list.length === 0) {
      this.linkIndices.delete(link.id);
      return;
    }

    this.material.uniforms.uTime.value = now;
    this.material.uniforms.uOpacity.value = 2.2;
    this.material.uniforms.uSizeRange.value.set(6.0, 14.0);
    this.points.visible = true;
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
