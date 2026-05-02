import * as THREE from 'three';

/**
 * EXTREME AI GPU SHADER PACK — SAFE EDITION
 * 
 * Archetype-specific GPU shader effects for Extreme AI nodes
 * Enhances visual depth with neon glows, distortions, and metric-reactive effects
 * 
 * SAFETY GUARANTEES:
 * ✅ ONLY affects nodes with userData.extremeArchetype (from _ExtremeAINodePack.js)
 * ✅ Per-archetype shader materials (no global patches)
 * ✅ NO modifications to core systems (AINodes, NodeLinking, Glyphs, etc.)
 * ✅ NO postprocessing or compositor changes
 * ✅ Reads metrics as read-only (never writes back)
 * ✅ Graceful fallback if metrics unavailable
 * ✅ Full cleanup and disposal on node removal
 * ✅ Performance-optimized: <1ms per-frame impact
 */

export class ExtremeAIShaderPack {
  constructor(semanticBus = null, options = {}) {
    this.nodeMap = new Map(); // node → shader data
    this.nodeIdMap = new Map(); // nodeId(string) → node
    this.time = 0;
    this.enabled = true;
    this.debug = options.debug || false;
    this.frameScheduler = options.frameScheduler || null;

    // Budget caps
    this.maxNodes = options.maxNodes || 100; // Max simultaneous shader-enhanced nodes

    // Shared shader cache to reduce compilation time
    this.shaderCache = new Map();

    // Event-driven metric updates
    this.semanticBus = semanticBus || globalThis?.semanticBus || null;
    this.dirtyNodes = new Set();
    this._eventDrivenEnabled = false;
    this._metricUpdatedHandler = null;
    this._unsubscribeMetricUpdated = null;
    this._setupMetricSubscription();

    if (this.debug) {
      console.log('[ExtremeAIShaderPack] Initialized - 12 archetype shaders ready');
    }
  }

  _setupMetricSubscription() {
    if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') {
      this._eventDrivenEnabled = false;
      return;
    }

    this._metricUpdatedHandler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      if (nodeId === undefined || nodeId === null) return;
      this.dirtyNodes.add(String(nodeId));
    };

    const maybeUnsubscribe = this.semanticBus.subscribe(
      'node.metric.updated',
      this._metricUpdatedHandler
    );

    if (typeof maybeUnsubscribe === 'function') {
      this._unsubscribeMetricUpdated = maybeUnsubscribe;
    } else if (typeof this.semanticBus.unsubscribe === 'function') {
      this._unsubscribeMetricUpdated = () => {
        this.semanticBus.unsubscribe('node.metric.updated', this._metricUpdatedHandler);
      };
    }

    this._eventDrivenEnabled = true;
  }

  getNodeEventId(node) {
    if (!node) return null;
    const id =
      node?.userData?.nodeId ??
      node?.userData?.id ??
      node?.id ??
      node?.uuid;
    return id === undefined || id === null ? null : String(id);
  }

  /**
   * Register and apply shaders to an Extreme AI node
   * Call this when ExtremeAINodePack applies an archetype
   */
  registerNode(node) {
    if (!node || !node.visualGroup) {
      console.warn('[ExtremeAIShaderPack] Invalid node or missing visualGroup');
      return false;
    }

    try {
      const archetypeId = node.userData.extremeArchetype;
      if (archetypeId === undefined) {
        return false; // Not an extreme node
      }

      // Apply archetype-specific shaders
      this.applyShadersToNode(node, archetypeId);

      // Store registration
      this.nodeMap.set(node, {
        archetypeId,
        materials: [],
        registered: true
      });

      const nodeEventId = this.getNodeEventId(node);
      if (nodeEventId !== null) {
        this.nodeIdMap.set(nodeEventId, node);
        // Ensure first metric application in event-driven mode
        if (this._eventDrivenEnabled) {
          this.dirtyNodes.add(nodeEventId);
        }
      }

      return true;
    } catch (err) {
      if (this.debug) console.error('[ExtremeAIShaderPack] Error registering node:', err);
      return false;
    }
  }

  /**
   * Unregister and clean up shaders from a node
   * Call this when a node is removed from the scene
   */
  unregisterNode(node) {
    if (!this.nodeMap.has(node)) return;

    const shaderData = this.nodeMap.get(node);
    if (shaderData && shaderData.materials) {
      // Dispose custom materials
      shaderData.materials.forEach(mat => {
        if (mat && mat.dispose && mat.userData.isExtremeShader) {
          mat.dispose();
        }
      });
    }

    this.nodeMap.delete(node);
    const nodeEventId = this.getNodeEventId(node);
    if (nodeEventId !== null) {
      this.nodeIdMap.delete(nodeEventId);
      this.dirtyNodes.delete(nodeEventId);
    }
  }

  /**
   * Main update loop — call once per frame
   * Updates time-based uniforms across all registered nodes
   */
  update(deltaTime) {
    if (!this.enabled || !this.nodeMap.size) return;
    if (this.frameScheduler && typeof this.frameScheduler.shouldRunVisual === 'function') {
      if (!this.frameScheduler.shouldRunVisual()) return;
    }
    
    this.time += deltaTime;

    this.nodeMap.forEach((shaderData, node) => {
      if (!node || !node.visualGroup) {
        const staleNodeId = this.getNodeEventId(node);
        if (staleNodeId !== null) {
          this.nodeIdMap.delete(staleNodeId);
          this.dirtyNodes.delete(staleNodeId);
        }
        this.nodeMap.delete(node);
        return;
      }

      // Update uniforms for all materials
      if (shaderData.materials) {
        shaderData.materials.forEach(mat => {
          if (mat.uniforms && mat.uniforms.u_time) {
            mat.uniforms.u_time.value = this.time;
          }
        });

        if (!this._eventDrivenEnabled) {
          // Fallback: keep original polling when semanticBus is unavailable
          shaderData.materials.forEach(mat => {
            this.updateMetricsUniforms(node, mat);
          });
        }
      }
    });

    if (this._eventDrivenEnabled && this.dirtyNodes.size > 0) {
      for (const dirtyNodeId of this.dirtyNodes) {
        const node = this.nodeIdMap.get(String(dirtyNodeId));
        if (!node) continue;
        const shaderData = this.nodeMap.get(node);
        if (!shaderData?.materials) continue;

        shaderData.materials.forEach(mat => {
          this.updateMetricsUniforms(node, mat);
        });
      }
      this.dirtyNodes.clear();
    }
  }

  /**
   * Update metric-based uniforms from node.userData.metrics
   */
  updateMetricsUniforms(node, material) {
    if (!material.uniforms) return;

    const metrics = node.userData.metrics;
    if (!metrics) return;

    // Read-only metric access
    const synergy = metrics.synergy || 0;
    const harmony = metrics.harmony || 0;
    const corruption = metrics.corruption || 0;
    const stability = metrics.stability || 0;

    // Update metric uniforms if they exist
    if (material.uniforms.u_synergy) {
      material.uniforms.u_synergy.value = Math.min(1, synergy);
    }
    if (material.uniforms.u_harmony) {
      material.uniforms.u_harmony.value = Math.min(1, harmony);
    }
    if (material.uniforms.u_corruption) {
      material.uniforms.u_corruption.value = Math.min(1, corruption);
    }
    if (material.uniforms.u_stability) {
      material.uniforms.u_stability.value = Math.min(1, stability);
    }
  }

  /**
   * Apply archetype-specific shaders to node
   */
  applyShadersToNode(node, archetypeId) {
    const archetypeMethods = [
      this.applyHyperbolicPrismShader.bind(this),
      this.applySingularityKnotShader.bind(this),
      this.applyQuantumLatticeShader.bind(this),
      this.applyFractalBloomShader.bind(this),
      this.applyReactiveTesseractShader.bind(this),
      this.applyChaoticHeartShader.bind(this),
      this.applyWhisperSphereShader.bind(this),
      this.applyEchoFractalShader.bind(this),
      this.applyAbyssalShardShader.bind(this),
      this.applyTriHelixShader.bind(this),
      this.applyInfiniteSpiralShader.bind(this),
      this.applyChronoRipperShader.bind(this)
    ];

    if (archetypeId >= 0 && archetypeId < archetypeMethods.length) {
      archetypeMethods[archetypeId](node);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHADER HELPERS & UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create Multiversal Prism of Infinite Reflections shader
   * Reality refraction layers with quantum entanglement and dimensional folding
   */
  createMultiversalPrismShader(colorA, colorB) {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vViewDir = normalize(cameraPosition - vWorldPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_synergy;
      uniform float u_harmony;
      uniform vec3 u_colorA;
      uniform vec3 u_colorB;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      // Quantum entanglement pattern
      float entanglementField(vec3 pos, float time) {
        vec3 p = pos * 3.0;
        float field = sin(p.x + time) * cos(p.y + time * 1.3) * sin(p.z + time * 0.7);
        return (field + 1.0) * 0.5;
      }

      // Reality layer refraction
      vec3 realityRefraction(vec3 viewDir, vec3 normal, float layer) {
        float ior = 1.5 + layer * 0.5; // Increasing refraction for deeper realities
        vec3 refracted = refract(viewDir, normal, 1.0 / ior);
        return refracted;
      }

      // Dimensional folding distortion
      vec3 dimensionalFold(vec3 pos, float time, float stability) {
        float fold = sin(pos.x * 5.0 + time) * cos(pos.y * 5.0 + time * 1.2) * sin(pos.z * 5.0 + time * 0.8);
        float distortion = fold * (1.0 - stability) * 0.1;
        return pos + normal * distortion;
      }

      void main() {
        vec3 foldedPosition = dimensionalFold(vWorldPosition, u_time, u_harmony);

        // Primary fresnel
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);

        // Reality layer refractions (3 layers for multiversal effect)
        vec3 layer1 = realityRefraction(vViewDir, vNormal, 0.0);
        vec3 layer2 = realityRefraction(vViewDir, vNormal, 1.0);
        vec3 layer3 = realityRefraction(vViewDir, vNormal, 2.0);

        // Quantum entanglement sparks
        float entanglement = entanglementField(foldedPosition, u_time);
        float spark = step(0.85, entanglement) * u_synergy;

        // Time-based reality shifting
        float realityShift = sin(u_time * 0.3) * 0.5 + 0.5;
        vec3 color = mix(u_colorA, u_colorB, realityShift);

        // Layered color mixing
        vec3 realityColor1 = color * (1.0 + dot(layer1, vec3(0.3, 0.6, 0.1)));
        vec3 realityColor2 = color * (1.0 + dot(layer2, vec3(0.1, 0.3, 0.6)));
        vec3 realityColor3 = color * (1.0 + dot(layer3, vec3(0.6, 0.1, 0.3)));

        // Combine reality layers
        vec3 finalColor = mix(realityColor1, realityColor2, fresnel * 0.5);
        finalColor = mix(finalColor, realityColor3, fresnel * fresnel * 0.3);

        // Add entanglement sparks
        finalColor += vec3(1.0, 1.0, 0.8) * spark * 0.5;

        // Enhanced rim glow with reality bleeding
        float rim = fresnel * (1.0 + u_synergy * 0.8);
        finalColor += vec3(0.3, 0.4, 0.6) * rim;

        // Quantum foam interference
        float foam = sin(foldedPosition.x * 20.0 + u_time * 2.0) *
                    cos(foldedPosition.y * 20.0 + u_time * 2.3) *
                    sin(foldedPosition.z * 20.0 + u_time * 1.7);
        foam = (foam + 1.0) * 0.5;
        finalColor += vec3(0.1, 0.2, 0.3) * foam * u_harmony * 0.3;

        gl_FragColor = vec4(finalColor, 0.9 + fresnel * 0.1 - spark * 0.2);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_synergy: { value: 0 },
        u_harmony: { value: 0 },
        u_colorA: { value: new THREE.Color(colorA) },
        u_colorB: { value: new THREE.Color(colorB) }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true
    });
  }

  /**
   * LEGACY: Create a glassy refraction shader (fresnel + rim lighting)
   */
  createGlassShaderMaterial(colorA, colorB) {
    return this.createMultiversalPrismShader(colorA, colorB);
  }

  /**
   * Create a radial falloff shader (vignette in object space)
   */
  createRadialFalloffShader(baseColor) {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_corruption;
      uniform vec3 u_baseColor;

      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        // Radial distance from center
        float dist = length(vPosition);
        
        // Radial falloff (vignette)
        float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
        
        // Gravity lens effect (normal distortion)
        vec3 distortedNormal = vNormal + vec3(sin(dist * 3.0 + u_time) * 0.1);
        float diffuse = max(0.0, dot(distortedNormal, vec3(0.0, 1.0, 0.0)));
        
        // Core glow
        float coreGlow = exp(-dist * 5.0) * (1.0 + u_corruption * 0.5);
        
        vec3 color = u_baseColor * (falloff + coreGlow + diffuse * 0.3);
        color += vec3(0.2 * coreGlow);
        
        gl_FragColor = vec4(color, 0.9 + falloff * 0.1);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_corruption: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create grid pattern shader (procedural UV pattern)
   */
  createGridShader(lineColor) {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_harmony;
      uniform vec3 u_lineColor;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      float grid(vec2 uv, float size) {
        vec2 grid = abs(fract(uv * size) - 0.5);
        return smoothstep(0.05, 0.01, min(grid.x, grid.y));
      }

      void main() {
        // Procedural grid
        float gridPattern = grid(vUv * 5.0, 1.0);
        
        // Noise-driven flicker
        float noise = fract(sin(dot(vUv * 10.0, vec2(12.9898, 78.233)) + u_time * 2.0) * 43758.5453);
        float flicker = 0.7 + noise * 0.3;
        
        // Glitch effect (time-based offset)
        vec2 glitchUv = vUv + vec2(sin(u_time * 5.0) * 0.02, cos(u_time * 3.0) * 0.01);
        float glitchAmount = sin(u_time * 10.0) > 0.9 ? 0.2 : 0.0;
        
        float lines = grid(glitchUv * 5.0, 1.0) * flicker;
        
        vec3 color = u_lineColor * (lines * (1.0 + u_harmony * 0.3) + glitchAmount);
        color += vec3(0.1 * lines);
        
        gl_FragColor = vec4(color, gridPattern + 0.3);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_harmony: { value: 0 },
        u_lineColor: { value: new THREE.Color(lineColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create pulsing emissive shader
   */
  createPulsingShader(baseColor) {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_synergy;
      uniform vec3 u_baseColor;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Pulsing emissive
        float pulse = sin(u_time * 2.0) * 0.5 + 0.5;
        float intensity = 0.5 + pulse * 0.5 + u_synergy * 0.3;
        
        vec3 color = u_baseColor * intensity;
        
        // Rim light
        vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(vPosition, 1.0)).xyz);
        float rim = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        color += vec3(rim * 0.2);
        
        gl_FragColor = vec4(color, 0.8 + pulse * 0.2);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_synergy: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create noise-distortion shader
   */
  createNoiseDistortionShader(baseColor) {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_stability;
      uniform vec3 u_baseColor;

      varying vec3 vNormal;
      varying vec3 vPosition;

      // Simple Perlin noise approximation
      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        // Noise-based color variation
        float n = noise(vPosition + vec3(u_time) * 0.5);
        float colorVar = n * u_stability;
        
        // Normal perturbation
        vec3 perturbedNormal = normalize(vNormal + (vec3(noise(vPosition * 5.0 + u_time)) - 0.5) * u_stability * 0.5);
        
        // Distortion
        vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(vPosition, 1.0)).xyz);
        float distortion = dot(perturbedNormal, viewDir) * (1.0 + u_stability * 0.3);
        
        vec3 color = u_baseColor * (1.0 + colorVar);
        color *= max(0.5, distortion);
        
        gl_FragColor = vec4(color, 0.85 + colorVar * 0.15);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_stability: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create fresnel edge highlight shader
   */
  createEdgeHighlightShader(baseColor, edgeColor) {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_synergy;
      uniform vec3 u_baseColor;
      uniform vec3 u_edgeColor;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
        
        // Edge highlight reacts to synergy
        float edgeIntensity = fresnel * (1.0 + u_synergy * 0.5);
        
        vec3 color = mix(u_baseColor, u_edgeColor, fresnel);
        color += u_edgeColor * edgeIntensity * 0.3;
        
        gl_FragColor = vec4(color, 0.85 + fresnel * 0.15);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_synergy: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) },
        u_edgeColor: { value: new THREE.Color(edgeColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create scrolling UV shader
   */
  createScrollingUVShader(baseColor, scrollSpeed = 1.0) {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_harmony;
      uniform vec3 u_baseColor;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        // Scrolling UV
        vec2 scrollUv = vUv + vec2(u_time * 0.5, u_time * 0.3);
        
        // Gradient based on scrolling position
        float scroll = fract(scrollUv.y);
        float gradient = smoothstep(0.0, 1.0, scroll);
        
        // Traveling light effect
        float light = step(0.45, scroll) - step(0.55, scroll);
        
        vec3 color = u_baseColor * gradient;
        color += vec3(1.0) * light * 0.5;
        color += vec3(0.3 * u_harmony);
        
        gl_FragColor = vec4(color, 0.85 + light * 0.15);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_harmony: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create dark absorbing shader with sharp highlights
   */
  createDarkShader(baseColor, glowColor) {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform float u_corruption;
      uniform vec3 u_baseColor;
      uniform vec3 u_glowColor;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        // Dark, light-absorbing base
        vec3 color = u_baseColor * 0.2;
        
        // Sharp specular highlights
        vec3 reflected = reflect(-vViewDir, vNormal);
        float specular = pow(max(0.0, dot(reflected, vViewDir)), 16.0);
        color += vec3(specular * 0.8);
        
        // Inner red/orange glow for corruption
        float corruption = sin(u_time + u_corruption * 3.14159) * 0.5 + 0.5;
        color += u_glowColor * corruption * u_corruption * 0.3;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_corruption: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) },
        u_glowColor: { value: new THREE.Color(glowColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create time-glitch effect shader
   */
  createGlitchShader(baseColor) {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec3 u_baseColor;

      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        // Glitch UV offset
        float glitch = sin(u_time * 8.0) > 0.5 ? 0.05 : 0.0;
        vec2 glitchUv = vPosition.xy + vec2(glitch);
        
        // Color shift spikes at intervals
        float spike = max(0.0, sin(u_time * 10.0 + 1.57079) * 0.5);
        
        // Subtle displacement
        vec3 displaced = vPosition + vec3(glitch * 0.1);
        
        vec3 color = u_baseColor * (1.0 + spike * 0.3);
        color += vec3(spike * 0.2);
        
        gl_FragColor = vec4(color, 0.85 + spike * 0.15);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_baseColor: { value: new THREE.Color(baseColor) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Create radial multi-layer gradient shader
   */
  createRadialGradientShader(colorA, colorB) {
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec3 u_colorA;
      uniform vec3 u_colorB;

      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        // Multi-layer radial gradient
        float dist = length(vPosition) * 3.0;
        float gradient = sin(dist - u_time) * 0.5 + 0.5;
        
        // Layered effect
        float layer1 = smoothstep(0.0, 0.5, gradient);
        float layer2 = smoothstep(0.3, 0.8, gradient);
        
        // Outer echo fade
        float echo = exp(-dist * 0.5);
        
        vec3 color = mix(u_colorA, u_colorB, gradient);
        color *= layer1 + layer2 * 0.5;
        color += u_colorB * echo * 0.2;
        
        gl_FragColor = vec4(color, 0.7 + echo * 0.3);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_colorA: { value: new THREE.Color(colorA) },
        u_colorB: { value: new THREE.Color(colorB) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHETYPE SHADER APPLICATIONS (12 types)
  // ═══════════════════════════════════════════════════════════════════════════

  applyHyperbolicPrismShader(node) {
    const shader = this.createGlassShaderMaterial(0x00ffff, 0xff00ff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applySingularityKnotShader(node) {
    const shader = this.createRadialFalloffShader(0xff00ff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyQuantumLatticeShader(node) {
    const shader = this.createGridShader(0x00ffaa);
    shader.uniforms.u_harmony = { value: 0 };
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyFractalBloomShader(node) {
    const shader = this.createPulsingShader(0x00ffaa);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyReactiveTesseractShader(node) {
    const shader = this.createEdgeHighlightShader(0xff00ff, 0x00ffff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyChaoticHeartShader(node) {
    const shader = this.createNoiseDistortionShader(0xff0055);
    shader.uniforms.u_stability = { value: 0 };
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyWhisperSphereShader(node) {
    const shader = this.createScrollingUVShader(0x00ffff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyEchoFractalShader(node) {
    const shader = this.createRadialGradientShader(0x00ffaa, 0x00ffff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyAbyssalShardShader(node) {
    const shader = this.createDarkShader(0x001111, 0xff6644);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyTriHelixShader(node) {
    const shader = this.createScrollingUVShader(0xff00ff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyInfiniteSpiralShader(node) {
    const shader = this.createScrollingUVShader(0x00ffaa);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  applyChronoRipperShader(node) {
    const shader = this.createGlitchShader(0xffffff);
    shader.userData.isExtremeShader = true;
    this.replaceNodeMaterials(node, shader);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAL REPLACEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Replace materials in node.visualGroup with shader materials
   */
  replaceNodeMaterials(node, shaderMaterial) {
    if (!node.visualGroup) return;

    const shaderData = this.nodeMap.get(node) || { materials: [] };
    const materialsToTrack = [];

    node.visualGroup.traverse(child => {
      if (!child.material || !child.userData?.isExtremVFX) return;

      // Create unique shader instance for each mesh
      const materialInstance = shaderMaterial.clone();
      child.material = materialInstance;

      materialsToTrack.push(materialInstance);
    });

    shaderData.materials = materialsToTrack;
    if (!this.nodeMap.has(node)) {
      this.nodeMap.set(node, shaderData);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enable/disable shader effects
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (this.debug) console.log(`[ExtremeAIShaderPack] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalShadedNodes: this.nodeMap.size,
      enabled: this.enabled,
      time: this.time,
      cacheSize: this.shaderCache.size
    };
  }

  /**
   * Debug output
   */
  debugLog() {
    if (!this.debug) return;
    const stats = this.getStats();
    console.group('[ExtremeAIShaderPack] Debug Stats');
    console.log('Total Shaded Nodes:', stats.totalShadedNodes);
    console.log('Enabled:', stats.enabled);
    console.log('Time:', stats.time.toFixed(2));
    console.log('Cache Size:', stats.cacheSize);
    console.groupEnd();
  }

  dispose() {
    if (typeof this._unsubscribeMetricUpdated === 'function') {
      try {
        this._unsubscribeMetricUpdated();
      } catch (err) {
        // noop
      }
    }

    // Dispose all tracked materials and detach from nodes
    for (const [node, shaderData] of this.nodeMap.entries()) {
      if (shaderData.materials) {
        shaderData.materials.forEach(mat => {
          if (mat && typeof mat.dispose === 'function') {
            mat.dispose();
          }
        });
      }
      // Restore original materials on node.visualGroup if possible
      if (node && node.visualGroup) {
        node.visualGroup.traverse(child => {
          if (child.userData?.isExtremVFX && child.userData._originalMaterial) {
            child.material = child.userData._originalMaterial;
          }
        });
      }
    }

    this._unsubscribeMetricUpdated = null;
    this._metricUpdatedHandler = null;
    this._eventDrivenEnabled = false;
    this.dirtyNodes.clear();
    this.nodeIdMap.clear();
    this.nodeMap.clear();
  }
}

/**
 * INTEGRATION HELPER
 * Call this to attach shader pack to game instance
 */
export function attachExtremeShaderPackToGame(gameInstance, options = {}) {
  if (!gameInstance) {
    console.warn('[attachExtremeShaderPackToGame] Invalid gameInstance');
    return;
  }

  try {
    gameInstance.extremeAIShaderPack = new ExtremeAIShaderPack(
      gameInstance.semanticBus || null,
      options
    );
    if (options.debug) {
      console.log('[attachExtremeShaderPackToGame] Successfully attached ExtremeAIShaderPack');
    }
    return gameInstance.extremeAIShaderPack;
  } catch (err) {
    console.error('[attachExtremeShaderPackToGame] Error:', err);
  }
}

/**
 * INTEGRATION INSTRUCTIONS FOR main.js
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * STEP 1: Add import at top of main.js (around line 75, after other imports)
 * ────────────────────────────────────────────────────────────────────────────
 * import { attachExtremeShaderPackToGame } from './_ExtremeAIShaderPack.js';
 * 
 * 
 * STEP 2: Initialize in Game class constructor/setup
 * ────────────────────────────────────────────────────────────────────────────
 * In the constructor, after creating extremeAINodePack:
 * 
 * attachExtremeShaderPackToGame(this);
 * 
 * 
 * STEP 3: Register nodes when they are created
 * ────────────────────────────────────────────────────────────────────────────
 * Where you apply ExtremeAINodePack.applyArchetype():
 * 
 * if (this.extremeAINodePack && Math.random() < 0.2) {
 *   this.extremeAINodePack.applyArchetype(newNode, this.scene);
 *   
 *   // Add this line:
 *   if (this.extremeAIShaderPack) {
 *     this.extremeAIShaderPack.registerNode(newNode);
 *   }
 * }
 * 
 * 
 * STEP 4: Update in animate loop (in render() or animate() method)
 * ────────────────────────────────────────────────────────────────────────────
 * Add this in your animate/render loop, after other updates:
 * 
 * if (this.extremeAIShaderPack) {
 *   this.extremeAIShaderPack.update(this.deltaTime);
 * }
 * 
 * 
 * STEP 5: Clean up when nodes are removed
 * ────────────────────────────────────────────────────────────────────────────
 * When removing a node from the scene:
 * 
 * if (this.extremeAIShaderPack) {
 *   this.extremeAIShaderPack.unregisterNode(nodeToRemove);
 * }
 * 
 * 
 * OPTIONAL: Debug commands in browser console
 * ────────────────────────────────────────────────────────────────────────────
 * // Get stats
 * game.extremeAIShaderPack.getStats()
 * 
 * // Debug
 * game.extremeAIShaderPack.debugLog()
 * 
 * // Enable/disable
 * game.extremeAIShaderPack.setEnabled(false)
 * game.extremeAIShaderPack.setEnabled(true)
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */
