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
    const cloud = this.pointFXBase?.createPointCloud?.({
      capacity: count,
      preset: 'corruption',
      textureKind: 'corruptionDust',
      attributeSchema: {},
      materialOptions: {
        shareMaterial: true,
        pointsMaterialOptions: {
          color: 0xffefd6,
          transparent: true,
          opacity: 0.68,
          size: 0.11,
          alphaTest: 0.08,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending
        }
      },
      userData: {
        isCorruptionDustWave: true
      }
    }) || null;

    const geometry = cloud?.geometry || new THREE.BufferGeometry();
    if (!cloud) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    }

    const material = cloud?.material || new THREE.PointsMaterial({
      color: 0xffefd6,
      transparent: true,
      opacity: 0.0,
      size: 0.1,
      alphaTest: 0.08,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const points = cloud?.points || new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = true;
    if (!cloud && this.pointFXBase) {
      this.pointFXBase.ensureAttached(points);
    } else if (!cloud) {
      link.group.add(points);
    }

    const seeds = [];
    for (let i = 0; i < count; i++) {
      const tMin = 0.045;
      const tMax = 0.955;
      seeds.push({
        tOffset: tMin + (i / Math.max(1, count - 1)) * (tMax - tMin),
        lateral: (Math.random() - 0.5) * this.config.dustLateralSpread,
        vertical: Math.random() * this.config.dustHeight,
        phase: Math.random() * Math.PI * 2,
        sizeBias: 0.8 + Math.random() * 0.6
      });
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
    dust.material.opacity = Math.min(0.75, corruptionLevel * 0.9);

    const positions = dust.geometry.attributes.position.array;
    const basis = this._computeLinkBasis(link);
    const travelPhase = state.dustTravelPhase || 0;
    const wavePhase = state.wavePhase || 0;
    const width = this.config.dustWaveWidth;

    for (let i = 0; i < dust.seeds.length; i++) {
      const seed = dust.seeds[i];
      const waveOffset = Math.sin(wavePhase * Math.PI * 2 + seed.phase) * 0.15;
      const relative = seed.tOffset - travelPhase;
      const influence = Math.exp(-(relative * relative) / Math.max(0.0001, width * width));
      const sampleT = Math.max(0, Math.min(1, travelPhase + relative * 0.45 + waveOffset));
      const basePos = this._sampleLinkPosition(link, sampleT);
      const shimmer = Math.sin(state.time * 4.0 + seed.phase + sampleT * 9.0);

      basePos.addScaledVector(basis.up, this.config.dustHeight * (0.35 + influence * 0.85) + shimmer * 0.015);
      basePos.addScaledVector(
        basis.lateral,
        seed.lateral + shimmer * 0.012 + Math.sin(state.time + seed.phase) * 0.01
      );

      positions[i * 3 + 0] = basePos.x;
      positions[i * 3 + 1] = basePos.y;
      positions[i * 3 + 2] = basePos.z;
    }

    dust.geometry.attributes.position.needsUpdate = true;
    dust.points.scale.setScalar(0.92 + corruptionLevel * 0.42);
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
