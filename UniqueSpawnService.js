import { uniqueSpawnRegistry } from './UniqueSpawnRegistry.js';

/**
 * UniqueSpawnService
 * Central authority for single-instance spawn enforcement.
 * Uses one canonical key and produces explicit decisions/reasons.
 */
export class UniqueSpawnService {
  constructor(registry = uniqueSpawnRegistry) {
    this.registry = registry;
    this.metaByNodeId = new Map();
  }

  /**
   * Canonical key builder.
   * Returns null for generic / non-unique requests.
   */
  makeKey({ category, archetype, forceArchetype, registryKeyMode } = {}) {
    const cleanCategory = (category || '').trim().toLowerCase();
    const rawArchetype = (forceArchetype || archetype || cleanCategory || '').trim().toLowerCase();

    // Fallback singleton uses a dedicated namespace
    if (registryKeyMode === 'fallback') {
      return `fallback:${cleanCategory || 'input'}`;
    }

    // Generic / non-unique cases (mirrors _getRegistryKey + NodeSpawnRegistry rules)
    if (!rawArchetype || rawArchetype === 'default' || rawArchetype === cleanCategory) {
      return null;
    }
    const categoryList = [
      'input','process','integration','analytics','storage',
      'control','quantum','sigma','mythic','prime','error','emotional'
    ];
    if (categoryList.includes(rawArchetype)) {
      return null;
    }

    // Unique category heuristics from NodeSpawnRegistry._isUniqueType
    if (['mythic','prime','sigma','quantum'].includes(cleanCategory)) {
      if (rawArchetype && rawArchetype !== 'default' && rawArchetype !== cleanCategory) {
        return `${cleanCategory}:${rawArchetype}`;
      }
    }

    if (rawArchetype.includes('-')) {
      return `${cleanCategory || 'generic'}:${rawArchetype}`;
    }

    // Default singleton key for named archetypes
    return `${cleanCategory || 'generic'}:${rawArchetype}`;
  }

  /**
   * Decide if a unique spawn is allowed.
   * Optional context lets us mirror legacy gates for deterministic reasons.
   */
  check({ key, nodes, nodeRegistry, fallbackNodeId } = {}) {
    if (!key) {
      return { allowed: true, existingNodeId: null, reason: 'GENERIC' };
    }

    // Fallback singleton reuse
    if (fallbackNodeId) {
      return { allowed: false, existingNodeId: fallbackNodeId, reason: 'FALLBACK_SINGLETON' };
    }

    // Legacy array guard parity
    if (Array.isArray(nodes)) {
      const match = nodes.find(
        (n) =>
          n?.userData?.uniqueArchetypeKey === key ||
          n?.userData?.archetypeKey === key
      );
      if (match) {
        const id = match.userData?.nodeId || match.userData?.id || match.uuid || null;
        return { allowed: false, existingNodeId: id, reason: 'EXISTS_NODES_ARRAY' };
      }
    }

    // Legacy nodeRegistry parity
    if (nodeRegistry && typeof nodeRegistry.get === 'function' && nodeRegistry.has(key)) {
      const existingNode = nodeRegistry.get(key);
      const id =
        existingNode?.userData?.nodeId ||
        existingNode?.userData?.id ||
        existingNode?.uuid ||
        null;
      return { allowed: false, existingNodeId: id, reason: 'EXISTS_NODE_REGISTRY' };
    }

    // UniqueSpawnRegistry parity
    const existingId = this.registry?.getNodeId?.(key) || null;
    if (existingId) {
      return { allowed: false, existingNodeId: existingId, reason: 'EXISTS_UNIQUE_REGISTRY' };
    }

    return { allowed: true, existingNodeId: null, reason: 'ALLOWED' };
  }

  register({ key, nodeId, meta = {} } = {}) {
    if (!key || !nodeId) return false;
    this.registry?.registerUniqueSpawn?.(nodeId, key, meta);
    this.metaByNodeId.set(String(nodeId), { key, ...meta });
    return true;
  }

  releaseByNodeId(nodeId) {
    if (!nodeId) return false;
    this.metaByNodeId.delete(String(nodeId));
    return this.registry?.releaseUniqueSpawnByNodeId?.(nodeId) || false;
  }

  releaseByKey(key) {
    if (!key) return false;
    const nodeId = this.registry?.getNodeId?.(key);
    if (nodeId) this.metaByNodeId.delete(String(nodeId));
    return this.registry?.releaseUniqueSpawnByArchetypeKey?.(key) || false;
  }

  snapshot() {
    return {
      registry: this.registry?.snapshot?.() || null,
      metaByNodeId: new Map(this.metaByNodeId),
    };
  }
}

export const uniqueSpawnService = new UniqueSpawnService();
