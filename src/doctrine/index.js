/**
 * DOCTRINE INDEX
 * Public API surface for Doctrine Layer system
 */

export {
  DOCTRINE_VERSION,
  SCHOOL_OF_THOUGHT_DEFINITIONS,
  WORLD_MUTATOR_DEFINITIONS,
  CRISIS_CARD_DEFINITIONS
} from './DoctrineLayer.js';

export {
  getSchoolOfThought,
  getWorldMutator,
  getCrisisCard,
  getAvailableSchools,
  getAvailableMutators,
  resolveCrisisTrigger,
  sanitizeDoctrineState,
  applyDraftToState,
  computeDoctrineModifiers,
  determineMilestoneDoctrineUnlocks
} from './DoctrineLayer.js';

export { DoctrineRuntime } from './DoctrineRuntime.js';