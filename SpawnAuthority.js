/**
 * SpawnAuthority
 * Central choke point for node spawning. Wraps aiNodes.spawnNode().
 */
export class SpawnAuthority {
  spawn(aiNodes, ...args) {
    if (!aiNodes || typeof aiNodes.spawnNode !== 'function') {
      return null;
    }
    return aiNodes.spawnNode(...args);
  }
}

export const spawnAuthority = new SpawnAuthority();
