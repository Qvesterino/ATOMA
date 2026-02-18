/**
 * SessionVariantEngine
 * Deterministic per-category variant sequencing with seeded shuffle-bags.
 */
export class SessionVariantEngine {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
    this.bags = new Map(); // category -> { bag: number[], cursor: number, signature: string, seed: number }
  }

  _hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  _rng(state) {
    const newState = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return { state: newState, value: newState / 0x100000000 };
  }

  _shuffleInPlace(arr, seed) {
    let s = seed >>> 0;
    for (let i = arr.length - 1; i > 0; i--) {
      const { state, value } = this._rng(s);
      s = state;
      const j = Math.floor(value * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return s;
  }

  getNext(category, poolSignature, poolArray) {
    const cat = (category || 'default').toLowerCase();
    const signature = poolSignature || poolArray.join(',');
    let entry = this.bags.get(cat);

    const needsRebuild =
      !entry ||
      entry.signature !== signature ||
      entry.bag.length !== poolArray.length;

    if (needsRebuild) {
      const bag = poolArray.slice();
      const baseSeed = this._hash(`${cat}:${this.seed}:${signature}`);
      const nextSeed = this._shuffleInPlace(bag, baseSeed);
      entry = { bag, cursor: 0, signature, seed: nextSeed };
      this.bags.set(cat, entry);
    }

    if (entry.bag.length === 0) return 0;

    const pick = entry.bag[entry.cursor++];
    if (entry.cursor >= entry.bag.length) {
      entry.seed = this._shuffleInPlace(entry.bag, entry.seed);
      entry.cursor = 0;
    }
    return pick;
  }
}

// Debug helper (manual opt-in)
if (typeof window !== 'undefined') {
  window.debugVariantState = (engine) => {
    const e = engine || window.sessionVariantEngine;
    if (!e) {
      console.warn('No sessionVariantEngine available');
      return [];
    }
    const out = [];
    for (const [cat, entry] of e.bags.entries()) {
      out.push({
        category: cat,
        bag: entry.bag.slice(),
        cursor: entry.cursor,
        poolLength: entry.bag.length,
        signature: entry.signature
      });
    }
    console.table(out);
    return out;
  };
}
