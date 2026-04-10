const allowPatterns = [/MaterialRegistry_v1/];

export function installMaterialDebugGuard() {
  if (typeof window === "undefined") return;
  if (!window.DEBUG_VISUAL_MODE) return;
  window.__ATOMA_MATERIAL_GUARD_INSTALLED__ = true;
  window.__ATOMA_MATERIAL_CREATION_DETECTOR__ = materialCreationDetector;
  console.log("[MaterialGuard] Dev-only material guard armed (warn-only).");
}

export function checkMaterialCreation(stack, label = "UnknownMaterial") {
  if (typeof window === "undefined") return;
  if (!window.DEBUG_VISUAL_MODE) return;
  if (window.__ATOMA_MATERIAL_REGISTRY_SCOPE__) return;

  const trace = stack || new Error().stack || "";
  const allowed = allowPatterns.some((re) => re.test(trace));
  if (allowed) return;

  console.warn(
    `[MaterialGuard] ${label} constructed outside MaterialRegistry_v1. Route materials through the registry to avoid GPU/material bloat.`,
    trace
  );
}

function isWarmupComplete() {
  if (typeof window === "undefined") return false;
  return window.__ATOMA_WARMUP_COMPLETE === true || window.__shaderWarmupDone === true;
}

export function checkLateMaterialCreation(stack, label = "UnknownMaterial") {
  if (typeof window === "undefined") return;
  if (!isWarmupComplete()) return;

  const trace = stack || new Error().stack || "";
  console.warn(
    `[MaterialGuard] Late ${label} constructed after shader warmup. Prefer shared materials or cached variants to avoid post-warmup GPU churn.`,
    trace
  );
}

/**
 * Lightweight dev-only detector you can call around ad-hoc material creation.
 * ESM-safe: does not patch THREE; simply inspects the current stack.
 */
export function materialCreationDetector(label = "UnknownMaterial") {
  if (typeof window === "undefined") return;
  if (!window.DEBUG_VISUAL_MODE) return;
  if (window.__ATOMA_MATERIAL_REGISTRY_SCOPE__) return;
  const trace = new Error().stack || "";
  const allowed = allowPatterns.some((re) => re.test(trace));
  if (allowed) return;
  console.warn(
    `[MaterialGuard] ${label} constructed outside MaterialRegistry_v1. Route materials through the registry to avoid GPU/material bloat.`,
    trace
  );
}
