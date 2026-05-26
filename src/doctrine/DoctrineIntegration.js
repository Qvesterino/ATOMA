/**
 * DOCTRINE INTEGRATION
 * Bridge between DoctrineLayer and RunIdentityProfiles
 * 
 * Unifies milestone unlock logic for both run identity and doctrine.
 * Handles meta-progression persistence and cross-system coordination.
 */

import {
  DOCTRINE_VERSION,
  determineMilestoneDoctrineUnlocks,
  SCHOOL_OF_THOUGHT_DEFINITIONS,
  WORLD_MUTATOR_DEFINITIONS
} from './DoctrineLayer.js';

export function integrateMilestoneUnlocks(metaProgression = {}, milestone = {}, world = null, existingUnlocks = []) {
  const runUnlocks = existingUnlocks;
  
  const doctrineUnlocks = determineMilestoneDoctrineUnlocks(metaProgression, milestone, world);
  const persisted = metaProgression.unlockedDoctrines || [];
  for (const unlock of doctrineUnlocks) {
    const id = unlock.type === 'school' ? unlock.id : unlock.id;
    if (!runUnlocks.some(u => u.id === id)) {
      runUnlocks.push({ type: 'doctrine', doctrineType: unlock.type, ...unlock });
    }
    if (!persisted.includes(id)) {
      persisted.push(id);
    }
  }
  metaProgression.unlockedDoctrines = persisted;
  
  return runUnlocks;
}

export function composeMetaProgressionWithDoctrine(profile = {}, doctrineState = {}) {
  const meta = profile?.metaProgression || {};
  
  const merged = {
    ...meta,
    doctrineVersion: DOCTRINE_VERSION,
    unlockedDoctrines: doctrineState.unlockedDoctrines || [],
    doctrineDraftHistory: doctrineState.draftHistory || []
  };
  
  return merged;
}

export function extractDoctrineFromMetaProgression(metaProgression = {}) {
  return {
    unlockedDoctrines: metaProgression.unlockedDoctrines || [],
    doctrineDraftHistory: metaProgression.doctrineDraftHistory || [],
    doctrineVersion: metaProgression.doctrineVersion
  };
}

export function describeDoctrineUnlock(unlock = {}) {
  const { id, type } = unlock;
  
  if (type === 'school' || SCHOOL_OF_THOUGHT_DEFINITIONS[id]) {
    const school = SCHOOL_OF_THOUGHT_DEFINITIONS[id];
    if (school) {
      return {
        title: 'DOCTRINE UNLOCKED',
        detail: `${school.label} — ${school.description}`
      };
    }
  }
  
  if (type === 'mutator' || WORLD_MUTATOR_DEFINITIONS[id]) {
    const mutator = WORLD_MUTATOR_DEFINITIONS[id];
    if (mutator) {
      return {
        title: 'WORLD MUTATOR UNLOCKED',
        detail: `${mutator.label} — ${mutator.description}`
      };
    }
  }
  
  return {
    title: 'NEW DOCTRINE',
    detail: 'A new doctrine option is now available in mid-run drafts.'
  };
}

export function isDoctrineUnlocked(metaProgression = {}, doctrineId = '') {
  const doctrineIdKey = String(doctrineId || '').trim().toLowerCase();
  
  const unlocked = metaProgression?.unlockedDoctrines || [];
  return unlocked.includes(doctrineIdKey);
}

export default {
  integrateMilestoneUnlocks,
  composeMetaProgressionWithDoctrine,
  extractDoctrineFromMetaProgression,
  describeDoctrineUnlock,
  isDoctrineUnlocked
};