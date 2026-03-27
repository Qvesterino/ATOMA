import * as THREE from 'three';

export const LINK_CATEGORY_PALETTE = Object.freeze({
  input: 0x00ddff,
  process: 0xffaa00,
  integration: 0x00ff88,
  analytics: 0xaa00ff,
  storage: 0x88ccff,
  control: 0xff0088,
  quantum: 0x00ffff,
  sigma: 0x00ff00,
  emotional: 0xff8800,
  mythic: 0x9933ff,
  prime: 0xffd700,
  error: 0xffffff
});

export function getLinkCategoryHex(category, fallbackHex = 0xcccccc) {
  const key = String(category || '').toLowerCase();
  return LINK_CATEGORY_PALETTE[key] ?? fallbackHex;
}

export function resolveLinkCategoryColor(category, fallbackColor = null, outColor = new THREE.Color()) {
  const hex = getLinkCategoryHex(category, null);
  if (hex !== null) {
    return outColor.setHex(hex);
  }
  if (fallbackColor?.isColor) {
    return outColor.copy(fallbackColor);
  }
  if (Number.isFinite(fallbackColor)) {
    return outColor.setHex(fallbackColor);
  }
  return outColor.setHex(0xcccccc);
}
