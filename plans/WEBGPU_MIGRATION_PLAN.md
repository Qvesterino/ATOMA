# WebGPU Migration Plan for ATOMA

## Executive Summary

WebGPU migration will unlock next-generation browser graphics capabilities: compute shaders for particle systems, better GPU utilization, reduced CPU bottleneck, and future-proof rendering pipeline. This is a **HIGH** complexity, multi-phase project spanning 6-8 months.

---

## Current State Analysis

| Aspect | Current State | WebGPU Advantage |
|--------|---------------|------------------|
| Renderer | `THREE.WebGLRenderer` (Three.js r183.2) | `WebGPURenderer` with native GPU compute |
| Particles | CPU-based BufferGeometry updates | GPU compute shaders |
| Post-processing | ShaderPass chain (limited) | True GPU post-processing pipeline |
| Draw calls | Multi-pass WebGL | Batched GPU rendering |
| Memory | Manual GPU buffer management | Unified GPU memory model |
| Shader language | GLSL | WGSL (safer, more expressive) |

---

## Migration Phases

### Phase 1: Infrastructure & Hybrid Renderer (2-3 months)

**1.1 WebGPU Detection & Fallback**
```
TASK: Detect WebGPU support via navigator.gpu
- Create WebGPUAdapter wrapper with WebGL fallback
- Maintain single renderer interface (WebGPU OR WebGL)
- Performance benchmark comparison layer
```

**1.2 Three.js WebGPU Renderer Integration**
```
TASK: Replace WebGLRenderer with WebGPURenderer
- Three.js r183 has WebGPU renderer (experimental)
- Upgrade path: WebGPU → WebGL2 → WebGL1 fallback
- Shader translation layer (GLSL → WGSL via Three.js)
```

**1.3 Core Shader Porting**
```
TASK: Port critical shaders to WGSL
- Node aura shaders (HarmonyAuraShaderMaterial)
- Link shaders (AnimatedLinkFlow)
- Post-processing stack
- Validate visual parity with WebGL version
```

### Phase 2: Compute Shader Architecture (2 months)

**2.1 Particle System Compute Shaders**
```
TASK: Move particle simulation to GPU compute
- CascadeWaveParticles particle physics
- LinkPulseDustEmitter particle spawning
- Node emission particle systems
- Target: 10x particle count improvement
```

**2.2 Metrics Computation Offload**
```
TASK: Offload metric calculations to GPU
- Synergy score computation (ComputeSynergyScore2_0)
- Harmony heatmap generation
- Corruption propagation patterns
```

### Phase 3: Performance Optimization (1-2 months)

**3.1 Render Pipeline Redesign**
```
TASK: Optimize for WebGPU render architecture
- Bund资产管理 (bundle multiple draws)
- Compute pass scheduling
- Async texture streaming
- Unified material system
```

**3.2 Memory Management**
```
TASK: Implement GPU memory pools
- Texture atlases for node/archetype visuals
- Geometry buffer recycling
- Shader module caching
```

### Phase 4: Full Production Cutover (1 month)

**4.1 QA Validation**
```
TASK: Complete visual parity verification
- Side-by-side WebGPU vs WebGL comparison
- Performance regression testing
- Browser compatibility matrix (Chrome, Edge, Safari preview)
```

**4.2 Production Deployment**
```
TASK: Gradual rollout with user opt-in
- Feature flag for WebGPU mode
- Performance monitoring dashboard
- Rollback capability
```

---

## Technical Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WGSL shader porting effort | High | High | Use Three.js auto-translation, manual port critical paths only |
| Browser support gaps | Medium | Medium | Maintain WebGL2 fallback for 12-18 months |
| Performance regression | Low | High | Hybrid mode, incremental validation |
| Driver instability (WebGPU) | Medium | Medium | Detect adapter issues, graceful fallback |

---

## Resource Requirements

- **Primary developer**: GPU/graphics API expert (WebGPU spec knowledge)
- **Shader developer**: WGSL fluency, GLSL legacy porting
- **QA**: Browser matrix testing, performance benchmarking
- **Timeline**: 6-8 months estimated

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Particle throughput | ~50K CPU particles | ~500K GPU particles |
| Draw calls | 200-400 per frame | <50 per frame |
| Frame time (60fps budget) | ~12ms render | ~5ms render |
| Memory efficiency | Manual buffer mgmt | Unified GPU memory |

---

## Alternative Considerations

If WebGPU timeline is too long, consider these interim optimizations:

1. **WebGL2 improvements**: Instanced rendering, multiple render targets
2. **OffscreenCanvas + Worker**: Background thread rendering
3. **Enhanced LOD system**: Aggressive geometry simplification

---

## Next Actions

1. [ ] Set up WebGPU detection and benchmarking harness
2. [ ] Evaluate Three.js WebGPURenderer stability (r183)
3. [ ] Identify top 10 critical shaders for WGSL porting
4. [ ] Prototype particle system on compute shader
5. [ ] Define fallback strategy and feature flag system

---

*Created: 2026-04-21*
*Complexity: HIGH | Duration: 6-8 months | Type: Architecture Migration*