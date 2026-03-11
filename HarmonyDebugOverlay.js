import * as THREE from 'three';

/**
 * HarmonyDebugOverlay
 * Visual-only debug helper that tints node/link materials based on harmony.
 * Mapping:
 *   0.0 -> red, 0.5 -> neutral gray, 1.0 -> cyan/gold blend
 * Brightness for links is applied via emissiveIntensity scaling.
 *
 * Gated via .enabled; safe to keep disabled in production.
 */
export class HarmonyDebugOverlay {
  constructor() {
    this.enabled = false;
    this.originals = new WeakMap(); // material -> {color, emissive, emissiveIntensity}
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    // restore originals
    this.originals.forEach((orig, mat) => {
      if (!mat) return;
      if (orig.color) mat.color.copy(orig.color);
      if (orig.emissive) mat.emissive.copy(orig.emissive);
      if (typeof orig.emissiveIntensity === 'number') {
        mat.emissiveIntensity = orig.emissiveIntensity;
      }
    });
    this.originals = new WeakMap();
  }

  update(nodes = [], links = []) {
    if (!this.enabled) return;
    this._tintNodes(nodes);
    this._tintLinks(links);
  }

  _tintNodes(nodes) {
    for (const node of nodes) {
      if (!node?.material) continue;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      const h = this._readHarmony(node);
      const color = this._mapHarmonyToColor(h);
      mats.forEach(mat => this._applyColor(mat, color, false));
    }
  }

  _tintLinks(links) {
    for (const link of links) {
      if (!link?.material) continue;
      const mats = Array.isArray(link.material) ? link.material : [link.material];
      const h = this._readHarmony(link);
      const color = this._mapHarmonyToColor(h);
      const intensity = THREE.MathUtils.lerp(0.6, 1.6, h);
      mats.forEach(mat => this._applyColor(mat, color, true, intensity));
    }
  }

  _readHarmony(obj) {
    return Math.max(
      0,
      Math.min(
        1,
        obj?.userData?.harmonyLevel ??
          obj?.userData?.metrics?.harmony ??
          obj?.harmony ??
          0.5
      )
    );
  }

  _mapHarmonyToColor(h) {
    // 0 -> red, 0.5 -> neutral gray, 1 -> cyan/gold blend
    const low = new THREE.Color(1, 0.15, 0.15);
    const mid = new THREE.Color(0.65, 0.65, 0.65);
    const high = new THREE.Color(0.35, 0.95, 0.85); // cyan with a hint of warm
    if (h <= 0.5) {
      return low.lerp(mid, h / 0.5);
    }
    return mid.lerp(high, (h - 0.5) / 0.5);
  }

  _applyColor(mat, color, adjustEmissive = false, emissiveIntensity = 1.0) {
    if (!mat) return;
    if (!this.originals.has(mat)) {
      this.originals.set(mat, {
        color: mat.color ? mat.color.clone() : null,
        emissive: mat.emissive ? mat.emissive.clone() : null,
        emissiveIntensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : undefined
      });
    }
    if (mat.color) mat.color.copy(color);
    if (adjustEmissive && mat.emissive) {
      mat.emissive.copy(color);
      if (typeof mat.emissiveIntensity === 'number') {
        mat.emissiveIntensity = emissiveIntensity;
      }
    }
  }
}

export default HarmonyDebugOverlay;
