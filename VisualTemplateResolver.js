/**
 * VISUAL TEMPLATE RESOLVER
 * ========================
 * Canonical Template ID → Approved Controller + Material Factory
 * 
 * Authority: CanonicalVisualTemplateLibrary.md (LOCKED)
 * 
 * Responsibility:
 * ✅ Map template IDs to approved implementations
 * ✅ Lazy-load controller classes + material factories
 * ✅ No branching based on metrics/gameplay
 * ✅ No validation (caller must validate)
 * ✅ Pure deterministic mapping
 * 
 * Purpose: Decouple registry from implementation locations.
 * If a template moves or is renamed, update here only.
 */

// =============================================================================
// TEMPLATE SPECIFICATIONS (LOCKED)
// =============================================================================
/**
 * Each template maps to:
 * 
 * {
 *   templateId: string,
 *   controllerClass: (lazy-loaded),
 *   createMaterial: (lazy-loaded),
 *   schema: {
 *     inputSignal: string,      // metric signal name
 *     uniforms: [...],          // shader uniforms
 *     properties: {...}         // canonical properties
 *   }
 * }
 */

const TEMPLATE_SPECS = {
  HARMONY_AURA: {
    id: 'HARMONY_AURA',
    name: 'Harmony Aura',
    authority: 'CanonicalVisualTemplateLibrary.md #TEMPLATE_2',
    status: 'LOCKED',

    // Lazy-loaded (imported on first use)
    controllerClassName: 'HarmonyAuraController',
    controllerModule: './HarmonyAuraController.js',
    materialFactory: 'createHarmonyAuraMaterial',
    materialModule: './HarmonyAuraShaderMaterial.js',

    schema: {
      inputSignal: 'harmonyAuraStrength',
      signalRange: [0, 1],
      uniforms: {
        uTime: 'float',
        uAuraStrength: 'float',
        uAuraOpacity: 'float',
        uAuraRadius: 'float',
        uAuraPulse: 'float',
        uAuraColor: 'vec3',
      },
      canonical: {
        opacityFormula: 'smoothstep(0.2, 0.8, harmonyAuraStrength)',
        radiusFormula: 'lerp(1.0, 1.35, harmonyAuraStrength)',
        breathingFrequency: 'lerp(0.15, 0.45, harmonyAuraStrength) Hz',
        breathingDepth: '±3%',
        color: '#7fffd4', // aquamarine (soft cyan/mint)
      },
    },
  },

  STRESS_TURBULENCE: {
    id: 'STRESS_TURBULENCE',
    name: 'Network Stress Turbulence',
    authority: 'CanonicalVisualTemplateLibrary.md #TEMPLATE_3',
    status: 'LOCKED',

    // Lazy-loaded (imported on first use)
    controllerClassName: 'StressTurbulenceController',
    controllerModule: './StressTurbulenceController.js',
    materialFactory: 'createStressTurbulenceMaterial',
    materialModule: './StressTurbulenceShaderMaterial.js',

    schema: {
      inputSignal: 'stressVisualIntensity',
      signalRange: [0, 1],
      uniforms: {
        uTime: 'float',
        uStressIntensity: 'float',
        uTurbulence: 'float',
        uJitterAmplitude: 'float',
        uNoiseFrequency: 'float',
        uTimeScale: 'float',
        uStressColor: 'vec3',
      },
      canonical: {
        turbulenceFormula: 'pow(stressVisualIntensity, 1.4)',
        jitterFormula: 'lerp(0.0, 0.25, turbulence)',
        frequencyFormula: 'lerp(0.5, 2.5, stressVisualIntensity)',
        timeScaleFormula: 'lerp(0.4, 1.2, stressVisualIntensity)',
        color: '#ff6b35', // red-orange
      },
    },
  },
};

// =============================================================================
// MODULE CACHE (Lazy Loading)
// =============================================================================
/**
 * Cache for dynamically imported modules.
 * Modules loaded on first resolver call.
 */
const moduleCache = new Map();

/**
 * Lazy-load a module (import cache).
 * 
 * @param {string} modulePath - ESM module path
 * @returns {Promise<object>} Imported module
 */
async function loadModule(modulePath) {
  if (moduleCache.has(modulePath)) {
    return moduleCache.get(modulePath);
  }

  try {
    const module = await import(modulePath);
    moduleCache.set(modulePath, module);
    return module;
  } catch (err) {
    console.error(`VisualTemplateResolver: Failed to load ${modulePath}`, err);
    throw err;
  }
}

// =============================================================================
// RESOLVER API
// =============================================================================

/**
 * Get template specification (schema only, no loading).
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {object|null} Template spec or null
 */
export function getTemplateSpec(templateId) {
  return TEMPLATE_SPECS[templateId] ?? null;
}

/**
 * Get template schema (for validation + documentation).
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {object|null} Schema or null
 */
export function getTemplateSchema(templateId) {
  const spec = TEMPLATE_SPECS[templateId];
  return spec?.schema ?? null;
}

/**
 * Resolve template to controller class (lazy-loaded).
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {Promise<class>} Controller class
 */
export async function resolveControllerClass(templateId) {
  const spec = TEMPLATE_SPECS[templateId];
  if (!spec) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  const module = await loadModule(spec.controllerModule);
  const ControllerClass = module[spec.controllerClassName];

  if (!ControllerClass) {
    throw new Error(
      `${spec.controllerClassName} not found in ${spec.controllerModule}`
    );
  }

  return ControllerClass;
}

/**
 * Resolve template to material factory (lazy-loaded).
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {Promise<function>} Material factory function
 */
export async function resolveMaterialFactory(templateId) {
  const spec = TEMPLATE_SPECS[templateId];
  if (!spec) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  const module = await loadModule(spec.materialModule);
  const factory = module[spec.materialFactory];

  if (typeof factory !== 'function') {
    throw new Error(
      `${spec.materialFactory} not found in ${spec.materialModule}`
    );
  }

  return factory;
}

/**
 * Resolve BOTH controller + material for a template (atomic).
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {Promise<{ControllerClass, createMaterial}>} Resolved pair
 */
export async function resolveTemplate(templateId) {
  const [ControllerClass, createMaterial] = await Promise.all([
    resolveControllerClass(templateId),
    resolveMaterialFactory(templateId),
  ]);

  return { ControllerClass, createMaterial };
}

/**
 * List all templates (for debugging).
 * 
 * @returns {array} Array of template specs (without modules)
 */
export function listTemplates() {
  return Object.values(TEMPLATE_SPECS).map(spec => ({
    id: spec.id,
    name: spec.name,
    status: spec.status,
    authority: spec.authority,
    schema: spec.schema,
  }));
}

/**
 * Check if template exists and is locked.
 * 
 * @param {string} templateId - Canonical template ID
 * @returns {boolean}
 */
export function isTemplateLocked(templateId) {
  const spec = TEMPLATE_SPECS[templateId];
  return spec?.status === 'LOCKED' ?? false;
}

// =============================================================================
// VALIDATION (Dev Mode)
// =============================================================================

/**
 * Verify all template specifications are well-formed.
 * Call once during initialization.
 */
export function validateTemplateSpecs() {
  const violations = [];

  for (const [templateId, spec] of Object.entries(TEMPLATE_SPECS)) {
    // Must have required fields
    if (!spec.id || !spec.authority || !spec.status) {
      violations.push({
        templateId,
        issue: 'Missing required fields (id, authority, status)',
      });
    }

    // Must be LOCKED
    if (spec.status !== 'LOCKED') {
      violations.push({
        templateId,
        issue: `Template status is "${spec.status}", not LOCKED`,
      });
    }

    // Must have controller + material specs
    if (!spec.controllerModule || !spec.materialModule) {
      violations.push({
        templateId,
        issue: 'Missing module specifications',
      });
    }

    // Schema must have inputSignal + uniforms
    if (!spec.schema?.inputSignal || !spec.schema?.uniforms) {
      violations.push({
        templateId,
        issue: 'Incomplete schema (missing inputSignal or uniforms)',
      });
    }
  }

  if (violations.length > 0) {
    console.error('❌ VisualTemplateResolver spec violations:', violations);
    return false;
  }

  return true;
}

// =============================================================================
// EXPORTS
// =============================================================================
export {
  TEMPLATE_SPECS,
};

// =============================================================================
// DEBUG API (Dev Mode Only)
// =============================================================================
if (typeof window !== 'undefined') {
  window.__ATOMA_VISUAL_RESOLVER_DEBUG = {
    getSpec: getTemplateSpec,
    getSchema: getTemplateSchema,
    resolveControllerAsync: resolveControllerClass,
    resolveMaterialAsync: resolveMaterialFactory,
    resolveTemplateAsync: resolveTemplate,
    listTemplates,
    isLocked: isTemplateLocked,
    validate: validateTemplateSpecs,
    moduleCache: () => Array.from(moduleCache.keys()),

    help: () => `
      ✓ Visual Template Resolver Debug API
      
      Usage (sync):
        getSpec(templateId)
        getSchema(templateId)
        listTemplates()
        isLocked(templateId)
        validate()
      
      Usage (async):
        await resolveControllerAsync(templateId)
        await resolveMaterialAsync(templateId)
        await resolveTemplateAsync(templateId)
      
      Examples:
        getSpec('SYNERGY_GLOW')
        listTemplates()
        await resolveTemplateAsync('SYNERGY_GLOW')
        validate()
    `,
  };
}

// =============================================================================
// CONFORMANCE SELF-CHECK
// =============================================================================

export const RESOLVER_CONFORMANCE = {
  layer: 'VisualTemplateResolver',
  purpose: 'Template ID → controller + material factory resolution',
  deterministic: true,
  branching: false,
  allTemplatesLocked: true,
  conformanceStatus: 'LOCKED',
  authority: 'CanonicalVisualTemplateLibrary.md',
};

// Runtime conformance check (optional, dev mode)
if (typeof window !== 'undefined' && window.__ATOMA_METRIC_AUDIT) {
  const isValid = validateTemplateSpecs();
  if (!isValid) {
    console.warn(
      '⚠️  VisualTemplateResolver conformance check failed. ' +
      'Check violations above.'
    );
  }
}
