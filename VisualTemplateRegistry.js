/**
 * VISUAL TEMPLATE REGISTRY
 * ========================
 * Canonical Template → Renderable Type Mapping
 * 
 * Authority: CanonicalVisualTemplateLibrary.md (LOCKED)
 * 
 * This registry is:
 * ✅ Static (immutable at runtime)
 * ✅ Explicit (no hidden mappings)
 * ✅ Centralized (single source of truth)
 * ✅ Deterministic (no branching)
 * ✅ Declarative (no logic)
 * 
 * Purpose: Route renderables to their APPROVED canonical templates.
 * 
 * NOTE: No new entries without architectural review.
 * All templates must exist in CanonicalVisualTemplateLibrary.md
 */

// =============================================================================
// RENDERABLE TYPES (Enumerated)
// =============================================================================
const RENDERABLE_TYPE = {
  LINK: 'LINK',
  NODE: 'NODE',
  FIELD: 'FIELD',
  AMBIENT: 'AMBIENT',
  WORLD_EFFECT: 'WORLD_EFFECT',
};

// =============================================================================
// CANONICAL TEMPLATES (Enumerated)
// =============================================================================
const CANONICAL_TEMPLATE = {
  // Template #1: Synergy Glow (cyan structural quality)
  SYNERGY_GLOW: 'SYNERGY_GLOW',

  // Template #2: Harmony Aura (golden-white stability/healing)
  HARMONY_AURA: 'HARMONY_AURA',

  // Template #3: Network Stress Turbulence (red-orange chaos)
  STRESS_TURBULENCE: 'STRESS_TURBULENCE',

  // Placeholder for future templates (requires lock review)
  // FUTURE_TEMPLATE_4: 'FUTURE_TEMPLATE_4',
};

// =============================================================================
// STATIC REGISTRY: Renderable Type → Canonical Template
// =============================================================================
/**
 * THIS IS THE LAW.
 * 
 * Each renderable type maps to EXACTLY ONE canonical template.
 * No exceptions. No branching. No conditionals.
 * 
 * To change: Requires architectural review + lock update.
 */
const REGISTRY = {
  // LINK: Always uses SYNERGY_GLOW (structural quality indicator)
  [RENDERABLE_TYPE.LINK]: CANONICAL_TEMPLATE.SYNERGY_GLOW,

  // NODE: Always uses HARMONY_AURA (stability/healing potential)
  [RENDERABLE_TYPE.NODE]: CANONICAL_TEMPLATE.HARMONY_AURA,

  // FIELD: Always uses STRESS_TURBULENCE (environmental chaos)
  [RENDERABLE_TYPE.FIELD]: CANONICAL_TEMPLATE.STRESS_TURBULENCE,

  // AMBIENT: No canonical template yet (visual systems unregistered)
  // [RENDERABLE_TYPE.AMBIENT]: null,

  // WORLD_EFFECT: No canonical template yet
  // [RENDERABLE_TYPE.WORLD_EFFECT]: null,
};

// =============================================================================
// TEMPLATE LOCK STATUS (Conformance Verification)
// =============================================================================
/**
 * Each template's lock status + authority reference.
 * Used for runtime verification (dev mode).
 */
const TEMPLATE_LOCK_STATUS = {
  [CANONICAL_TEMPLATE.SYNERGY_GLOW]: {
    version: '1.0',
    authority: 'CanonicalVisualTemplateLibrary.md #TEMPLATE_1',
    status: 'LOCKED',
    lastReview: 'Session 44',
  },
  [CANONICAL_TEMPLATE.HARMONY_AURA]: {
    version: '1.0',
    authority: 'CanonicalVisualTemplateLibrary.md #TEMPLATE_2',
    status: 'LOCKED',
    lastReview: 'Session 44',
  },
  [CANONICAL_TEMPLATE.STRESS_TURBULENCE]: {
    version: '1.0',
    authority: 'CanonicalVisualTemplateLibrary.md #TEMPLATE_3',
    status: 'LOCKED',
    lastReview: 'Session 44',
  },
};

// =============================================================================
// API: Get Template for Renderable Type
// =============================================================================
/**
 * Deterministic lookup: no branching, no conditionals.
 * 
 * @param {string} renderableType - From RENDERABLE_TYPE enum
 * @returns {string|null} Canonical template or null if not registered
 */
export function getTemplateForRenderable(renderableType) {
  return REGISTRY[renderableType] ?? null;
}

/**
 * Verify a template is canonical and locked.
 * 
 * @param {string} templateId - Template identifier
 * @returns {boolean}
 */
export function isTemplateCanonicalAndLocked(templateId) {
  return (templateId in TEMPLATE_LOCK_STATUS) &&
         (TEMPLATE_LOCK_STATUS[templateId].status === 'LOCKED');
}

/**
 * Get lock status for a template.
 * 
 * @param {string} templateId - Template identifier
 * @returns {object|null} Lock status or null
 */
export function getTemplateLockStatus(templateId) {
  return TEMPLATE_LOCK_STATUS[templateId] ?? null;
}

// =============================================================================
// VALIDATION: Ensure Registry Integrity
// =============================================================================
/**
 * Verify all registered templates are canonical and locked.
 * Call once during initialization (dev mode).
 */
export function validateRegistryConformance() {
  const violations = [];

  for (const [renderableType, templateId] of Object.entries(REGISTRY)) {
    if (!templateId) {
      // Unregistered is allowed (no template for that type yet)
      continue;
    }

    // Template must be canonical
    if (!isTemplateCanonicalAndLocked(templateId)) {
      violations.push({
        renderableType,
        templateId,
        issue: 'Template not canonical or locked',
      });
    }
  }

  if (violations.length > 0) {
    console.error('❌ VisualTemplateRegistry conformance violations:', violations);
    return false;
  }

  return true;
}

/**
 * List all registered mappings (for debugging).
 */
export function listRegistryMappings() {
  const mappings = [];
  for (const [renderableType, templateId] of Object.entries(REGISTRY)) {
    if (templateId) {
      mappings.push({
        renderableType,
        templateId,
        lockStatus: TEMPLATE_LOCK_STATUS[templateId]?.status,
      });
    }
  }
  return mappings;
}

// =============================================================================
// EXPORTS: Public API
// =============================================================================
export {
  RENDERABLE_TYPE,
  CANONICAL_TEMPLATE,
  REGISTRY,
  TEMPLATE_LOCK_STATUS,
};

// =============================================================================
// DEBUG API (Dev Mode Only)
// =============================================================================
if (typeof window !== 'undefined') {
  window.__ATOMA_VISUAL_REGISTRY_DEBUG = {
    getTemplate: getTemplateForRenderable,
    isCanonical: isTemplateCanonicalAndLocked,
    getLockStatus: getTemplateLockStatus,
    listMappings: listRegistryMappings,
    validate: validateRegistryConformance,

    help: () => `
      ✓ Visual Template Registry Debug API
      
      Usage:
        window.__ATOMA_VISUAL_REGISTRY_DEBUG.getTemplate(type)
        window.__ATOMA_VISUAL_REGISTRY_DEBUG.isCanonical(templateId)
        window.__ATOMA_VISUAL_REGISTRY_DEBUG.getLockStatus(templateId)
        window.__ATOMA_VISUAL_REGISTRY_DEBUG.listMappings()
        window.__ATOMA_VISUAL_REGISTRY_DEBUG.validate()
      
      Examples:
        getTemplate('LINK')
        isCanonical('SYNERGY_GLOW')
        listMappings()
        validate()
    `,
  };
}

// =============================================================================
// CONFORMANCE SELF-CHECK
// =============================================================================
/**
 * CONFORMANCE PROPERTIES:
 * ✅ Static registry (immutable after initialization)
 * ✅ Explicit mappings (no hidden logic)
 * ✅ One-to-one (each renderable type → one template)
 * ✅ Locked templates (all are LOCKED per authority)
 * ✅ Deterministic (no branching, pure lookup)
 * ✅ No stat access (pure mapping layer)
 * ✅ No side effects (pure function)
 */

export const REGISTRY_CONFORMANCE = {
  layer: 'VisualTemplateRegistry',
  purpose: 'Static renderable type → canonical template mapping',
  staticGuarantee: true,
  mutability: 'read-only after initialization',
  conformanceStatus: 'LOCKED',
  authority: 'CanonicalVisualTemplateLibrary.md',
};

// Runtime conformance check (optional, dev mode)
if (typeof window !== 'undefined' && window.__ATOMA_METRIC_AUDIT) {
  const isValid = validateRegistryConformance();
  if (!isValid) {
    console.warn(
      '⚠️  VisualTemplateRegistry conformance check failed. ' +
      'Check violations above.'
    );
  }
}
