const bandRange = (low, high) => Object.freeze({ low, high });

function readBandRange(range, legacyMinKey, legacyMaxKey) {
  if (!range) return { min: 0, max: 0 };

  const nestedMin = Number(range.low);
  const nestedMax = Number(range.high);
  if (Number.isFinite(nestedMin) && Number.isFinite(nestedMax)) {
    return { min: nestedMin, max: nestedMax };
  }

  const legacyMin = Number(range[legacyMinKey]);
  const legacyMax = Number(range[legacyMaxKey]);
  return {
    min: Number.isFinite(legacyMin) ? legacyMin : 0,
    max: Number.isFinite(legacyMax) ? legacyMax : 0
  };
}

export const DEFAULT_LINKED_AURA_HARMONY_BANDS = Object.freeze({
  low: Object.freeze({ max: 0.35, opacity: bandRange(0.70, 0.84), desaturation: bandRange(0.78, 0.62) }),
  mid: Object.freeze({ max: 0.65, opacity: bandRange(0.90, 1.06), desaturation: bandRange(0.46, 0.30) }),
  high: Object.freeze({ max: 1.0, opacity: bandRange(1.10, 1.28), desaturation: bandRange(0.18, 0.06) })
});

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function resolveLinkedAuraHarmonyValue(node) {
  const candidates = [node?.userData?.metrics?.harmony, node?.userData?.harmony, node?.harmony];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return clamp01(numeric);
  }

  return 0.5;
}

export function resolveLinkedAuraHarmonyBand(harmony, bands = DEFAULT_LINKED_AURA_HARMONY_BANDS) {
  const value = clamp01(harmony);

  if (value <= bands.low.max) {
    const t = bands.low.max > 0 ? value / bands.low.max : 0;
    const opacityRange = readBandRange(bands.low.opacity ?? bands.low, 'opacityMin', 'opacityMax');
    const desaturationRange = readBandRange(bands.low.desaturation ?? bands.low, 'desaturationMin', 'desaturationMax');
    return {
      name: 'low',
      opacityMultiplier: opacityRange.min + (opacityRange.max - opacityRange.min) * t,
      desaturation: desaturationRange.min + (desaturationRange.max - desaturationRange.min) * t
    };
  }

  if (value <= bands.mid.max) {
    const t = (value - bands.low.max) / Math.max(0.0001, bands.mid.max - bands.low.max);
    const opacityRange = readBandRange(bands.mid.opacity ?? bands.mid, 'opacityMin', 'opacityMax');
    const desaturationRange = readBandRange(bands.mid.desaturation ?? bands.mid, 'desaturationMin', 'desaturationMax');
    return {
      name: 'mid',
      opacityMultiplier: opacityRange.min + (opacityRange.max - opacityRange.min) * t,
      desaturation: desaturationRange.min + (desaturationRange.max - desaturationRange.min) * t
    };
  }

  const t = (value - bands.mid.max) / Math.max(0.0001, 1.0 - bands.mid.max);
  const opacityRange = readBandRange(bands.high.opacity ?? bands.high, 'opacityMin', 'opacityMax');
  const desaturationRange = readBandRange(bands.high.desaturation ?? bands.high, 'desaturationMin', 'desaturationMax');
  return {
    name: 'high',
    opacityMultiplier: opacityRange.min + (opacityRange.max - opacityRange.min) * t,
    desaturation: desaturationRange.min + (desaturationRange.max - desaturationRange.min) * t
  };
}