export class UniqueSpawnRegistry {
  constructor() {
    this.activeByArchetypeKey = new Map(); // archetypeKey -> nodeId
    this.archetypeByNodeId = new Map(); // nodeId -> archetypeKey
    this.metadataByArchetypeKey = new Map(); // archetypeKey -> metadata
  }

  normalizeArchetypeKey(archetypeKey) {
    return String(archetypeKey || '').trim().toLowerCase();
  }

  isUniqueSpawnAllowed(archetypeKey) {
    const key = this.normalizeArchetypeKey(archetypeKey);
    if (!key) return true;
    return !this.activeByArchetypeKey.has(key);
  }

  registerUniqueSpawn(nodeId, archetypeKey, metadata = {}) {
    const key = this.normalizeArchetypeKey(archetypeKey);
    const id = String(nodeId || '').trim();
    if (!key || !id) return false;

    const existingNodeId = this.activeByArchetypeKey.get(key);
    if (existingNodeId && existingNodeId !== id) {
      this.archetypeByNodeId.delete(existingNodeId);
    }
    const previousKeyForNode = this.archetypeByNodeId.get(id);
    if (previousKeyForNode && previousKeyForNode !== key) {
      this.activeByArchetypeKey.delete(previousKeyForNode);
      this.metadataByArchetypeKey.delete(previousKeyForNode);
    }

    this.activeByArchetypeKey.set(key, id);
    this.archetypeByNodeId.set(id, key);
    this.metadataByArchetypeKey.set(key, {
      ...metadata,
      nodeId: id,
      archetypeKey: key,
      spawnedAt: metadata.spawnedAt || Date.now(),
    });
    return true;
  }

  releaseUniqueSpawnByNodeId(nodeId) {
    const id = String(nodeId || '').trim();
    if (!id) return false;
    const key = this.archetypeByNodeId.get(id);
    if (!key) return false;
    this.archetypeByNodeId.delete(id);
    this.activeByArchetypeKey.delete(key);
    this.metadataByArchetypeKey.delete(key);
    return true;
  }

  releaseUniqueSpawnByArchetypeKey(archetypeKey) {
    const key = this.normalizeArchetypeKey(archetypeKey);
    if (!key) return false;
    const nodeId = this.activeByArchetypeKey.get(key);
    if (nodeId) this.archetypeByNodeId.delete(nodeId);
    this.activeByArchetypeKey.delete(key);
    this.metadataByArchetypeKey.delete(key);
    return true;
  }

  getNodeId(archetypeKey) {
    const key = this.normalizeArchetypeKey(archetypeKey);
    return this.activeByArchetypeKey.get(key) || null;
  }

  getArchetypeKey(nodeId) {
    const id = String(nodeId || '').trim();
    return this.archetypeByNodeId.get(id) || null;
  }

  getMetadata(archetypeKey) {
    const key = this.normalizeArchetypeKey(archetypeKey);
    return this.metadataByArchetypeKey.get(key) || null;
  }

  clear() {
    this.activeByArchetypeKey.clear();
    this.archetypeByNodeId.clear();
    this.metadataByArchetypeKey.clear();
  }

  snapshot() {
    return {
      activeByArchetypeKey: new Map(this.activeByArchetypeKey),
      archetypeByNodeId: new Map(this.archetypeByNodeId),
      metadataByArchetypeKey: new Map(this.metadataByArchetypeKey),
    };
  }
}

export const uniqueSpawnRegistry = new UniqueSpawnRegistry();
