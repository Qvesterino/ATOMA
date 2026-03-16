import { CorruptionDesaturationController } from './LEGACY/aura/CorruptionDrivenAuraDesaturationSystem.js';

const CASCADE_CORRUPTION_THRESHOLD = 0.35;

export class CorruptionDrivenAuraDesaturationSystem {
  constructor(aiNodes) {
    this.aiNodes = aiNodes;
    this.controllers = new Map(); // nodeId -> CorruptionDesaturationController
    this.time = 0;
  }

  update(deltaTime = 0) {
    const game = globalThis?.game || null;
    const auraSystem = game?.nodeAuraSystem || null;
    const auraMap = auraSystem?.nodeAuras;
    if (!(auraMap instanceof Map) || auraMap.size === 0) return;

    this.time += Math.max(0, deltaTime);

    for (const [node, auraData] of auraMap.entries()) {
      const auraMesh = auraData?.mesh;
      if (!node || !auraMesh) continue;

      const nodeId = node?.userData?.nodeId || node?.id || node?.uuid;
      if (nodeId === undefined || nodeId === null) continue;

      let controller = this.controllers.get(nodeId);
      if (!controller) {
        controller = new CorruptionDesaturationController(auraMesh, node);
        this.controllers.set(nodeId, controller);
      }

      const nodeLinks =
        node?.userData?.links ||
        game?.linkingSystem?.getNodeLinks?.(node) ||
        [];
      const hasCascadeCorruptionLink = Array.isArray(nodeLinks) && nodeLinks.some((link) => (
        (link?.userData?.corruptionLevel ?? 0) > CASCADE_CORRUPTION_THRESHOLD
      ));
      if (!hasCascadeCorruptionLink) {
        continue;
      }

      const corruption =
        node?.userData?.metrics?.corruption ??
        node?.userData?.corruption ??
        0;
      controller.updateDesaturation(corruption, this.time);
    }
  }
}

export default CorruptionDrivenAuraDesaturationSystem;
