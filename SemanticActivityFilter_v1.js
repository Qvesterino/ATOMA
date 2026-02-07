/**
 * Semantic activity filter helper for link-level visual significance checks.
 */

const BASE_THRESHOLD = 0.35;
const THRESHOLD_SPAN = 0.25;
const LINK_COUNT_NORMALIZER = 200;
const NEUTRAL_VALUE = 0.5;

function clamp01(value) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function normalizeMetric(value) {
  if (!Number.isFinite(value)) return NEUTRAL_VALUE;
  return clamp01(value);
}

export class SemanticActivityFilter_v1 {
  constructor(linkingSystem = null) {
    this.linkingSystem = linkingSystem;
    this.threshold = BASE_THRESHOLD;
  }

  setLinkingSystem(linkingSystem) {
    this.linkingSystem = linkingSystem;
  }

  update() {
    const links = this.linkingSystem?.links;
    const linkCount = links ? links.length : 0;
    const linkFactor = clamp01(linkCount / LINK_COUNT_NORMALIZER);
    this.threshold = BASE_THRESHOLD + linkFactor * THRESHOLD_SPAN;
    return this.threshold;
  }

  isActive(link) {
    if (!link) return false;

    const userData = link.userData;
    if (!userData) return false;

    const synergy = normalizeMetric(userData.synergy);
    const harmony = normalizeMetric(userData.harmony);
    const corruption = normalizeMetric(userData.corruption);

    const activity = (synergy * 0.5) + (harmony * 0.3) + (corruption * 0.2);
    return activity >= this.threshold;
  }
}

