/**
 * SessionVariantEngine
 * Deterministic per-category visualCode cycling (no randomness).
 */
export class SessionVariantEngine {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0; // kept only for potential future hashing; not used in selection
    this.counters = new Map(); // category -> { counter: number, signature: string, length: number }
  }

  getNext(category, poolSignature, poolArray) {
    const cat = (category || 'default').toLowerCase();
    const signature = poolSignature || poolArray.join(',');
    const length = poolArray.length;
    if (length === 0) return null;

    let entry = this.counters.get(cat);
    if (!entry || entry.signature !== signature || entry.length !== length) {
      entry = { counter: 0, signature, length };
      this.counters.set(cat, entry);
    }

    const idx = entry.counter % length;
    const visualCode = poolArray[idx];
    entry.counter += 1;
    return visualCode;
  }
}

// Debug helper (manual opt-in, non-mutating)
if (typeof window !== 'undefined') {
  window.debugVariantState = (engine) => {
    const e = engine || window.sessionVariantEngine;
    if (!e || !e.counters) {
      console.warn('No SessionVariantEngine available');
      return [];
    }
    const out = [];
    for (const [cat, entry] of e.counters.entries()) {
      out.push({
        category: cat,
        counter: entry.counter,
        signature: entry.signature,
        length: entry.length,
      });
    }
    console.table(out);
    return out;
  };
}
