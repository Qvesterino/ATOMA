import * as THREE from "three";
import { checkMaterialCreation } from "../MaterialDebugGuard_v1.js";
// /src/rendering/materials/MaterialRegistry_v1.js

export class MaterialRegistry_v1 {
  constructor({ debug = false } = {}) {
    this.debug = debug;

    // Shared template materials (one per key)
    this._templates = new Map();

    // Optional pooled variants (key -> Map(variantKey -> material))
    this._variants = new Map();

    // Stats
    this._stats = this._createStats();
  }

  // ---------- Public: MeshStandard ----------
  getStandard(key, params = {}) {
    // For v1: pooled variants by a stable small key
    // (color, roughness, metalness, emissive, emissiveIntensity)
    const vKey = this._variantKey(params, [
      "color", "roughness", "metalness", "emissive", "emissiveIntensity",
      "transparent", "opacity", "side", "depthWrite", "depthTest", "fog", "wireframe"
    ]);

    return this._getOrCreateVariant(`std:${key}`, vKey, () => {
      const mat = new THREE.MeshStandardMaterial({
        color: params.color ?? 0xffffff,
        roughness: params.roughness ?? 0.6,
        metalness: params.metalness ?? 0.0,
        emissive: params.emissive ?? 0x000000,
        emissiveIntensity: params.emissiveIntensity ?? 0.0,
        transparent: params.transparent ?? false,
        opacity: params.opacity ?? 1.0,
        side: params.side ?? THREE.FrontSide,
        depthWrite: params.depthWrite ?? true,
        depthTest: params.depthTest ?? true,
        fog: params.fog,
        wireframe: params.wireframe,
      });

      // Optional: common flags
      mat.toneMapped = params.toneMapped ?? true;

      return mat;
    });
  }

  getBasic(key, params = {}) {
    const vKey = this._variantKey(params, ["color", "transparent", "opacity", "side", "depthWrite", "depthTest", "wireframe"]);
    return this._getOrCreateVariant(`basic:${key}`, vKey, () => {
      const mat = new THREE.MeshBasicMaterial({
        color: params.color ?? 0xffffff,
        transparent: params.transparent ?? false,
        opacity: params.opacity ?? 1.0,
        side: params.side ?? THREE.FrontSide,
        depthWrite: params.depthWrite ?? true,
        depthTest: params.depthTest ?? true,
        wireframe: params.wireframe ?? false,
      });
      mat.toneMapped = params.toneMapped ?? true;
      return mat;
    });
  }

  // ---------- Public: Shader ----------
  /**
   * Returns a SHARED ShaderMaterial template for a given key/variant.
   * No cloning in v1.
   */
  getShader(key, params = {}) {
    const variant = params.variant ?? "default";
    const templateKey = `shader:${key}:${variant}`;

    const existing = this._templates.get(templateKey);
    if (existing) {
      this._stats.hits++;
      return existing;
    }

    this._stats.misses++;

    // This expects you to define templates somewhere.
    const tpl = this._createShaderTemplate(key, variant, params);
    this._templates.set(templateKey, tpl);
    this._stats.templateCount++;
    this._stats.created++;

    return tpl;
  }

  /**
   * Apply uniforms to a ShaderMaterial instance safely.
   * IMPORTANT: this mutates the shared material's uniforms,
   * so only use this if you KNOW the material is per-mesh unique.
   *
   * For shared ShaderMaterial: prefer per-object uniforms via onBeforeRender hook
   * OR use a tiny pool of variants.
   */
  applyUniforms(material, uniformValues = {}) {
    if (!material || !material.uniforms) return;

    for (const [k, v] of Object.entries(uniformValues)) {
      if (!material.uniforms[k]) {
        // optionally create uniform
        material.uniforms[k] = { value: v };
      } else {
        material.uniforms[k].value = v;
      }
    }
  }

  // ---------- “Best practice” for per-object shader values ----------
  /**
   * Attaches per-mesh uniform overrides WITHOUT cloning materials:
   * We store values on mesh.userData and push them into the shared shader
   * just before render. This is pragmatic and works for many cases.
   */
  attachPerMeshUniforms(mesh, uniformValues = {}) {
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.__matUniforms = { ...(mesh.userData.__matUniforms ?? {}), ...uniformValues };

    // Install once
    if (mesh.userData.__matUniformsHookInstalled) return;
    mesh.userData.__matUniformsHookInstalled = true;

    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const u = mesh.userData.__matUniforms;
      if (!u || !material || !material.uniforms) return;
      for (const [k, v] of Object.entries(u)) {
        if (!material.uniforms[k]) material.uniforms[k] = { value: v };
        else material.uniforms[k].value = v;
      }
    };
  }

  // ---------- Debug / stats ----------
  getStats() {
    const variantBuckets = Array.from(this._variants.values());
    const variantEntryCount = variantBuckets.reduce((a, m) => a + m.size, 0);
    return {
      ...this._stats,
      templates: this._templates.size,
      variants: variantEntryCount,
      keysCount: this._templates.size + this._variants.size,
    };
  }

  stats() {
    return this.getStats();
  }

  clear() {
    if (typeof window !== "undefined" && !window.DEBUG_VISUAL_MODE) {
      return false;
    }
    this._templates.clear();
    this._variants.clear();
    this._stats = this._createStats();
    return true;
  }

  printStats() {
    const s = this.getStats();
    console.table(s);
    return s;
  }

  // ---------- Internal ----------
  _getOrCreateVariant(baseKey, variantKey, factoryFn) {
    let bucket = this._variants.get(baseKey);
    if (!bucket) {
      bucket = new Map();
      this._variants.set(baseKey, bucket);
    }

    const fullKey = variantKey || "__default__";
    const existing = bucket.get(fullKey);

    if (existing) {
      this._stats.hits++;
      return existing;
    }

    this._stats.misses++;
    const mat = this._runInRegistryScope(factoryFn);
    bucket.set(fullKey, mat);
    this._stats.variantCount++;
    this._stats.created++;
    return mat;
  }

  // ---------- Public API v1 (stable names) ----------
  getStandardMaterial(params = {}) {
    return this.getStandard("default", params);
  }

  getBasicMaterial(params = {}) {
    return this.getBasic("default", params);
  }

  getShaderMaterial(key, shaderConfig = {}) {
    return this.getShader(key, shaderConfig);
  }

  _runInRegistryScope(fn) {
    if (typeof window === "undefined") return fn();
    const prev = window.__ATOMA_MATERIAL_REGISTRY_SCOPE__;
    window.__ATOMA_MATERIAL_REGISTRY_SCOPE__ = true;
    try {
      return fn();
    } finally {
      window.__ATOMA_MATERIAL_REGISTRY_SCOPE__ = prev;
    }
  }

  _variantKey(params, keys) {
    // Important: keep it small to avoid exploding variants
    const out = [];
    for (const k of keys) {
      const v = params[k];
      if (v === undefined) continue;
      out.push(`${k}=${this._stable(v)}`);
    }
    return out.length ? out.join("|") : "__default__";
  }

  _stable(v) {
    if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(4) : String(v);
    if (typeof v === "boolean") return v ? "1" : "0";
    if (typeof v === "string") return v;
    // THREE.Color or Vector-ish
    if (v && typeof v === "object") {
      if (v.isColor) return `${v.r.toFixed(4)},${v.g.toFixed(4)},${v.b.toFixed(4)}`;
      if (typeof v.x === "number" && typeof v.y === "number") {
        return `${v.x.toFixed(4)},${v.y.toFixed(4)},${(v.z ?? 0).toFixed(4)}`;
      }
    }
    return JSON.stringify(v);
  }

  _createStats() {
    return {
      templateCount: 0,
      variantCount: 0,
      hits: 0,
      misses: 0,
      created: 0,
      warnings: 0,
    };
  }

  _createShaderTemplate(key, variant, params) {
    // v1: hardcode templates here OR delegate to MaterialTemplates file.
    // Replace below with your real shader chunks.
    if (key === "link.neon") {
      return this._runInRegistryScope(
        () =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(params.color ?? 0x00ffff) },
              uGlow: { value: params.glow ?? 0.8 },
              uStress: { value: 0.0 },
            },
            vertexShader: params.vertexShader ?? /* glsl */`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: params.fragmentShader ?? /* glsl */`
              uniform vec3 uColor;
              uniform float uGlow;
              uniform float uStress;
              varying vec2 vUv;
              void main() {
                float a = uGlow;
                // stress can modulate alpha/intensity
                a *= (1.0 - uStress * 0.6);
                gl_FragColor = vec4(uColor, a);
              }
            `,
          })
      );
    }

    // Fallback: very visible warning material
    this._stats.warnings++;
    checkMaterialCreation(new Error().stack, "MeshBasicMaterial");
    const fallback = this._runInRegistryScope(
      () => new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    fallback.name = `MISSING_SHADER_TEMPLATE:${key}:${variant}`;
    return fallback;
  }
}

let __materialRegistrySingleton = null;

export function getMaterialRegistry(options = {}) {
  if (!__materialRegistrySingleton) {
    __materialRegistrySingleton = new MaterialRegistry_v1(options);
    if (typeof window !== "undefined") {
      window.materialRegistry = __materialRegistrySingleton;
    }
  }
  return __materialRegistrySingleton;
}

export const materialRegistry = getMaterialRegistry();
