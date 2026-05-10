/**
 * SessionVariantEngine
 * Run-scoped deterministic shuffled selection for node visual freshness.
 */
export class SessionVariantEngine {
  constructor(seed = Date.now()) {
    this.resetRun(seed);
  }

  resetRun(seed = Date.now()) {
    this.seed = seed >>> 0;
    this.stateByCategory = new Map();
    this.shuffleState = new Map();
    return this.seed;
  }

  _hashString(input) {
    let hash = 2166136261;
    const text = String(input ?? '');
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  _createRng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  _normalizeCategory(category) {
    return (category || 'default').toLowerCase();
  }

  _shuffleWithSeed(values, seedKey, cycle = 0) {
    const next = Array.isArray(values) ? values.slice() : [];
    const rng = this._createRng(
      (this.seed ^ this._hashString(`${seedKey}|${cycle}|${next.join(',')}`)) >>> 0
    );

    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  _ensureCategoryState(category, poolSignature, poolArray) {
    const cat = this._normalizeCategory(category);
    const signature = poolSignature || poolArray.join(',');
    const length = Array.isArray(poolArray) ? poolArray.length : 0;
    if (length === 0) return null;

    let entry = this.stateByCategory.get(cat);
    if (!entry || entry.signature !== signature || entry.length !== length) {
      entry = {
        category: cat,
        signature,
        length,
        cycle: 0,
        bag: this._shuffleWithSeed(poolArray, `bag:${cat}:${signature}`, 0),
        index: 0,
      };
      this.stateByCategory.set(cat, entry);
      return entry;
    }

    if (entry.index >= entry.bag.length) {
      entry.cycle += 1;
      entry.bag = this._shuffleWithSeed(poolArray, `bag:${cat}:${signature}`, entry.cycle);
      entry.index = 0;
    }

    return entry;
  }

  _takeFromBag(entry, poolArray, predicate) {
    for (let refillPass = 0; refillPass < 2; refillPass++) {
      for (let i = entry.index; i < entry.bag.length; i++) {
        const candidate = entry.bag[i];
        if (!predicate(candidate)) continue;
        [entry.bag[entry.index], entry.bag[i]] = [entry.bag[i], entry.bag[entry.index]];
        const value = entry.bag[entry.index];
        entry.index += 1;
        return value;
      }

      entry.cycle += 1;
      entry.bag = this._shuffleWithSeed(
        poolArray,
        `bag:${entry.category}:${entry.signature}`,
        entry.cycle
      );
      entry.index = 0;
    }

    return null;
  }

  getNext(category, poolSignature, poolArray, options = {}) {
    const pool = Array.isArray(poolArray) ? poolArray.filter((value) => value != null) : [];
    if (pool.length === 0) return null;

    const entry = this._ensureCategoryState(category, poolSignature, pool);
    if (!entry) return null;

    const excludeSet = options.excludeSet instanceof Set ? options.excludeSet : null;
    const hasAvailable = excludeSet ? pool.some((value) => !excludeSet.has(value)) : true;

    if (excludeSet && hasAvailable) {
      const uniqueValue = this._takeFromBag(entry, pool, (value) => !excludeSet.has(value));
      if (uniqueValue != null) {
        return uniqueValue;
      }
    }

    return this._takeFromBag(entry, pool, () => true);
  }

  shuffleValues(key, values) {
    const list = Array.isArray(values) ? values.filter((value) => value != null) : [];
    if (list.length <= 1) return list.slice();

    const shuffleKey = String(key || 'default');
    const cycle = this.shuffleState.get(shuffleKey) || 0;
    this.shuffleState.set(shuffleKey, cycle + 1);
    return this._shuffleWithSeed(list, `shuffle:${shuffleKey}`, cycle);
  }

  getStatus() {
    const categories = [];
    const remainingBagSizes = {};
    for (const [category, entry] of this.stateByCategory.entries()) {
      const remainingInBag = Math.max(0, entry.bag.length - entry.index);
      remainingBagSizes[category] = remainingInBag;
      categories.push({
        category,
        signature: entry.signature,
        cycle: entry.cycle,
        length: entry.length,
        remainingInBag,
      });
    }

    return {
      seed: this.seed,
      categories,
      remainingBagSizes,
    };
  }
}

// Debug helper (manual opt-in, non-mutating)
if (typeof window !== 'undefined') {
  window.debugVariantState = (engine) => {
    const e = engine || window.sessionVariantEngine;
    if (!e || !e.getStatus) {
      console.warn('No SessionVariantEngine available');
      return [];
    }
    const out = e.getStatus().categories;
    console.table(out);
    return out;
  };
}
