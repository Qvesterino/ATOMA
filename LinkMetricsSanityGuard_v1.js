/**
 * Link metrics sanity guard (0-1 normalized semantic fields).
 */

const NEUTRAL_VALUE = 0.5;

function sanitize01(value) {
  if (!Number.isFinite(value)) return NEUTRAL_VALUE;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export class LinkMetricsSanityGuard_v1 {
  constructor(linkingSystem = null) {
    this.linkingSystem = linkingSystem;
  }

  setLinkingSystem(linkingSystem) {
    this.linkingSystem = linkingSystem;
  }

  update() {
    const linkingSystem = this.linkingSystem;
    if (!linkingSystem) return 0;

    const links = linkingSystem.links;
    if (!links || links.length === 0) return 0;

    let touched = 0;

    for (let i = 0, n = links.length; i < n; i++) {
      const link = links[i];
      if (!link) continue;

      let userData = link.userData;
      if (!userData) {
        userData = {};
        const ud = (link && typeof link.userData === 'object' && link.userData) ? link.userData : (() => { try { Object.defineProperty(link, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return link.userData || {}; })();
        Object.assign(ud, userData);
      }

      const synergy = sanitize01(userData.synergy);
      const harmony = sanitize01(userData.harmony);
      const corruption = sanitize01(userData.corruption);

      if (userData.synergy !== synergy) {
        userData.synergy = synergy;
        touched++;
      }
      if (userData.harmony !== harmony) {
        userData.harmony = harmony;
        touched++;
      }
      if (userData.corruption !== corruption) {
        userData.corruption = corruption;
        touched++;
      }
    }

    return touched;
  }
}

