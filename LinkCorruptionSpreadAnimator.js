import * as THREE from 'three';
import { LinkPointFXBase } from './LinkPointFXBase.js';

export class LinkCorruptionSpreadAnimator {
  constructor() {
    this.animationStates = new Map();
    
    this.corruptionColors = {
      clean: {
        'input': new THREE.Color(0x00ddff),
        'process': new THREE.Color(0xffaa00),
        'integration': new THREE.Color(0x00ff88),
        'analytics': new THREE.Color(0xaa00ff),
        'storage': new THREE.Color(0x88ccff),
        'control': new THREE.Color(0xff0088),
        'quantum': new THREE.Color(0x00ffff),
        'sigma': new THREE.Color(0x00ff00),
        'emotional': new THREE.Color(0xff8800),
        'default': new THREE.Color(0xcccccc)
      },
      tainted: new THREE.Color(0xff6633),
      corrupted: new THREE.Color(0xff0044)
    };

    this.pointFXBase = null;
    
    this.config = {
      spreadDuration: 2000,
      waveDuration: 800,
      maxCorruptionForSpread: 0.95,
      dustTravelSpeed: 0.42,
      dustParticleCount: 18,
      dustWaveWidth: 0.18,
      dustHeight: 0.16,
      dustLateralSpread: 0.06,
      waveSpeed: 0.8,
      minCorruptionForVisuals: 0.01
    };
  }

  _disposeDustState(state) {
    if (!state?.dust) return;

    const dust = state.dust;
    if (dust.points) {
      dust.points.parent?.remove(dust.points);
    }
    dust.geometry?.dispose?.();
    dust.material?.dispose?.();
    state.dust = null;
  }

  initializeLink(link) {
    if (link?.id === null || link?.id === undefined) return;
    
    this.animationStates.set(link.id, {
      wavePhase: 0,
      dustTravelPhase: 0,
      intensity: 0,
      time: 0,
      startTime: performance.now(),
      dust: null
    });
  }

  attachScene(scene) {
    if (!scene) return;
    this.pointFXBase = new LinkPointFXBase(scene, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'corruption',
      capacity: 18,
      textureKind: 'corruptionDust'
    });
  }
  
  update(link, deltaTime, strands, options = {}) {
    if (link?.id === null || link?.id === undefined || !strands || strands.length === 0) return null;
    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    
    const corruptionLevel = Math.min(this.config.maxCorruptionForSpread, this._readCorruptionLevel(link, options));
    const nowMs = Number.isFinite(options?.nowMs) ? options.nowMs : ((performance?.now?.() ?? Date.now()));
    
    let state = this.animationStates.get(link.id);
    if (!state) {
      this.initializeLink(link);
      state = this.animationStates.get(link.id);
    }

    state.time = (state.time || 0) + safeDelta;
    
    if (corruptionLevel < this.config.minCorruptionForVisuals) {
      this._disposeDustState(state);
      state.wavePhase = 0;
      state.dustTravelPhase = 0;
      state.intensity = 0;
      return null;
    }

    state.wavePhase = ((state.wavePhase || 0) + safeDelta * this.config.waveSpeed) % 1.0;
    state.dustTravelPhase = ((state.dustTravelPhase || 0) + safeDelta * this.config.dustTravelSpeed) % 1.0;
    state.intensity = Math.min(1.0, corruptionLevel * 1.2);
    
    this._applyCorruptionGradient(strands, corruptionLevel, state.wavePhase, link);
    this._updateDustWave(link, state, corruptionLevel);
    
    return state;
  }

  _ensureDustState(link, state) {
    if (state.dust || !link?.group) return state.dust;

    const count = this.config.dustParticleCount;
    const geometry = new THREE.BufferGeometry();

    // GPU-side attributes (no CPU updates needed)
    const tOffsets = new Float32Array(count);
    const laterals = new Float32Array(count);
    const verticals = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizeBiases = new Float32Array(count);
    const initialPositions = new Float32Array(count * 3);

    const seeds = [];
    for (let i = 0; i < count; i++) {
      const tMin = 0.045;
      const tMax = 0.955;
      const tOffset = tMin + (i / Math.max(1, count - 1)) * (tMax - tMin);
      const lateral = (Math.random() - 0.5) * this.config.dustLateralSpread;
      const vertical = Math.random() * this.config.dustHeight;
      const phase = Math.random() * Math.PI * 2;
      const sizeBias = 0.8 + Math.random() * 0.6;

      tOffsets[i] = tOffset;
      laterals[i] = lateral;
      verticals[i] = vertical;
      phases[i] = phase;
      sizeBiases[i] = sizeBias;

      // Store seed data for reference (not used in GPU shader)
      seeds.push({ tOffset, lateral, vertical, phase, sizeBias });

      // Initial position (will be overridden by vertex shader)
      initialPositions[i * 3] = 0;
      initialPositions[i * 3 + 1] = 0;
      initialPositions[i * 3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    geometry.setAttribute('aTOffset', new THREE.BufferAttribute(tOffsets, 1));
    geometry.setAttribute('aLateral', new THREE.BufferAttribute(laterals, 1));
    geometry.setAttribute('aVertical', new THREE.BufferAttribute(verticals, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSizeBias', new THREE.BufferAttribute(sizeBiases, 1));

    // Custom GPU shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTravelPhase: { value: 0 },
        uWavePhase: { value: 0 },
        uStart: { value: new THREE.Vector3() },
        uEnd: { value: new THREE.Vector3() },
        uMid: { value: new THREE.Vector3() },
        uDustHeight: { value: this.config.dustHeight },
        uWaveWidth: { value: this.config.dustWaveWidth },
        uColor: { value: new THREE.Color(0xffefd6) },
        uOpacity: { value: 0.68 },
        uSize: { value: 0.11 }
      },
      vertexShader: `
        attribute float aTOffset;
        attribute float aLateral;
        attribute float aVertical;
        attribute float aPhase;
        attribute float aSizeBias;

        uniform float uTime;
        uniform float uTravelPhase;
        uniform float uWavePhase;
        uniform vec3 uStart;
        uniform vec3 uMid;
        uniform vec3 uEnd;
        uniform float uDustHeight;
        uniform float uWaveWidth;
        uniform float uSize;

        varying float vInfluence;

        // Quadratic Bezier
        vec3 getBezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
          float oneMinusT = 1.0 - t;
          return oneMinusT * oneMinusT * p0 + 
                 2.0 * oneMinusT * t * p1 + 
                 t * t * p2;
        }

        void main() {
          // Wave influence calculation (GPU-side)
          float waveOffset = sin(uWavePhase * 6.2831853 + aPhase) * 0.15;
          float relative = aTOffset - uTravelPhase;
          
          // Quad approximation of exp: e^(-x²) ≈ 1 - x² for |x| < 1
          float norm = relative / uWaveWidth;
          vInfluence = max(0.0, 1.0 - norm * norm);
          
          float sampleT = clamp(uTravelPhase + relative * 0.45 + waveOffset, 0.0, 1.0);
          vec3 basePos = getBezierPoint(uStart, uMid, uEnd, sampleT);

          // Shimmer effect
          float shimmer = sin(uTime * 4.0 + aPhase + sampleT * 9.0);

          // Calculate link basis (simplified, assumes mostly horizontal links)
          vec3 forward = normalize(uEnd - uStart);
          vec3 up = abs(dot(forward, vec3(0.0, 1.0, 0.0))) < 0.99 
            ? vec3(0.0, 1.0, 0.0) 
            : vec3(1.0, 0.0, 0.0);
          vec3 lateral = normalize(cross(forward, up));

          // Apply offsets
          basePos += up * (uDustHeight * (0.35 + vInfluence * 0.85) + shimmer * 0.015);
          basePos += lateral * (aLateral + shimmer * 0.012 + sin(uTime + aPhase) * 0.01);

          vec4 mvPosition = modelViewMatrix * vec4(basePos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uSize * aSizeBias * (10.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vInfluence;

        void main() {
          // Simple circular particle
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) discard;

          float alpha = (1.0 - smoothstep(0.5, 1.0, r)) * vInfluence * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = true;

    if (this.pointFXBase) {
      this.pointFXBase.ensureAttached(points);
    } else {
      link.group.add(points);
    }

    state.dust = { points, geometry, material, seeds };
    return state.dust;
  }

  _sampleLinkPosition(link, t) {
    if (link?.curve?.getPointAt) {
      return link.curve.getPointAt(Math.max(0, Math.min(1, t)));
    }

    const source = link?.source?.position;
    const target = link?.target?.position;
    if (source && target) {
      return new THREE.Vector3().lerpVectors(source, target, Math.max(0, Math.min(1, t)));
    }

    return new THREE.Vector3();
  }

  _computeLinkBasis(link) {
    const source = link?.source?.position;
    const target = link?.target?.position;
    const forward = new THREE.Vector3(1, 0, 0);
    if (source && target) {
      forward.subVectors(target, source);
      if (forward.lengthSq() > 1e-8) forward.normalize();
    }

    const up = new THREE.Vector3(0, 1, 0);
    const lateral = new THREE.Vector3().crossVectors(forward, up);
    if (lateral.lengthSq() <= 1e-8) {
      lateral.set(1, 0, 0);
    } else {
      lateral.normalize();
    }

    return { up, lateral };
  }

  _updateDustWave(link, state, corruptionLevel) {
    const dust = this._ensureDustState(link, state);
    if (!dust) return;

    dust.points.visible = true;
    
    // Update uniforms only (no CPU position updates)
    dust.material.uniforms.uTime.value = state.time || 0;
    dust.material.uniforms.uTravelPhase.value = state.dustTravelPhase || 0;
    dust.material.uniforms.uWavePhase.value = state.wavePhase || 0;
    dust.material.uniforms.uOpacity.value = Math.min(0.75, corruptionLevel * 0.9);
    dust.points.scale.setScalar(0.92 + corruptionLevel * 0.42);

    // Update curve control points
    if (link?.curve?.v0 && link?.curve?.v1 && link?.curve?.v2) {
      dust.material.uniforms.uStart.value.copy(link.curve.v0);
      dust.material.uniforms.uMid.value.copy(link.curve.v1);
      dust.material.uniforms.uEnd.value.copy(link.curve.v2);
    } else {
      // Fallback to linear interpolation
      const source = link?.source?.position || new THREE.Vector3();
      const target = link?.target?.position || new THREE.Vector3();
      const mid = new THREE.Vector3().lerpVectors(source, target, 0.5);
      dust.material.uniforms.uStart.value.copy(source);
      dust.material.uniforms.uMid.value.copy(mid);
      dust.material.uniforms.uEnd.value.copy(target);
    }
  }

  _readCorruptionLevel(link, options = {}) {
    const fromOptions = options?.corruptionLevel;
    if (Number.isFinite(fromOptions)) return Math.max(0, fromOptions);

    const value =
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruption ??
      link?.userData?.corruptionLevel;

    if (Number.isFinite(value)) {
      return Math.max(0, value);
    }

    return 0;
  }
  
  _applyCorruptionGradient(strands, corruptionLevel, wavePhase, link) {
    if (corruptionLevel < this.config.minCorruptionForVisuals) return;
    
    const sourceCategory = link.source?.userData?.category || 'default';
    const baseColor = this.corruptionColors.clean[sourceCategory] || this.corruptionColors.clean.default;
    
    let targetColor;
    if (corruptionLevel < 0.5) {
      const t = corruptionLevel / 0.5;
      targetColor = new THREE.Color().lerpColors(baseColor, this.corruptionColors.tainted, t);
    } else {
      const t = (corruptionLevel - 0.5) / 0.5;
      targetColor = new THREE.Color().lerpColors(this.corruptionColors.tainted, this.corruptionColors.corrupted, t);
    }
    
    strands.forEach((strand, strandIndex) => {
      if (!strand || !strand.material) return;
      const material = strand.material;
      
      const strandColor = new THREE.Color(baseColor);
      const waveInfluence = this._getWaveInfluenceAtStrand(strandIndex, wavePhase, strands.length);
      
      let blend = waveInfluence * corruptionLevel * 0.9;
      blend = Math.max(0, Math.min(1, blend));
      strandColor.lerp(targetColor, blend);
      
      material.userData = material.userData || {};
      
      if (material.uniforms?.uBaseColor?.value?.copy) {
        material.uniforms.uBaseColor.value.copy(strandColor);
      } else if (material.color) {
        material.color.copy(strandColor);
      }
      
      if (material.emissive) {
        const corruptionEmissive = new THREE.Color(targetColor).multiplyScalar(corruptionLevel * 0.6);
        material.emissive.copy(corruptionEmissive);
      }
      
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.6 + (corruptionLevel * 1.4);
      }
    });
  }
  
  _getWaveInfluenceAtStrand(strandIndex, wavePhase, strandCount) {
    const waveCenter = wavePhase;
    const strandPos = strandCount > 1 ? strandIndex / (strandCount - 1) : 0;
    const distFromWave = Math.abs(strandPos - waveCenter);
    const waveWidth = this.config.waveDuration / this.config.spreadDuration;
    const waveFalloff = Math.exp(-(distFromWave * distFromWave) / (waveWidth * waveWidth * 0.5));
    
    return Math.pow(waveFalloff, 2);
  }
  
  getCleanColor(category) {
    return this.corruptionColors.clean[category] || this.corruptionColors.clean.default;
  }
  
  disposeLinkAnimation(linkId) {
    const state = this.animationStates.get(linkId);
    if (state?.dust) {
      state.dust.points.parent?.remove(state.dust.points);
      state.dust.geometry.dispose();
      state.dust.material.dispose();
      state.dust = null;
    }
    this.animationStates.delete(linkId);
  }
  
  dispose() {
    this.pointFXBase = null;
    this.animationStates.clear();
  }
}
