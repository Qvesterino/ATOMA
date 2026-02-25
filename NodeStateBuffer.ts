// NodeStateBuffer.ts
export class NodeStateBuffer {
  readonly maxNodes: number;
  readonly count: number = 0;

  // --- core data buffers (SoA = structure of arrays) ---
  positions: Float32Array;   // [x0, y0, z0, x1, y1, z1, ...]
  synergy: Float32Array;     // [s0, s1, s2, ...]
  harmony: Float32Array;
  corruption: Float32Array;
  stress: Float32Array;

  constructor(maxNodes: number) {
    this.maxNodes = maxNodes;

    this.positions = new Float32Array(maxNodes * 3);
    this.synergy   = new Float32Array(maxNodes);
    this.harmony   = new Float32Array(maxNodes);
    this.corruption= new Float32Array(maxNodes);
    this.stress    = new Float32Array(maxNodes);
  }

  /** Register a node and return its index */
  addNode(x = 0, y = 0, z = 0): number {
    const i = this.count++;

    this.positions[i * 3 + 0] = x;
    this.positions[i * 3 + 1] = y;
    this.positions[i * 3 + 2] = z;

    this.synergy[i] = 0;
    this.harmony[i] = 0;
    this.corruption[i] = 0;
    this.stress[i] = 0;

    return i;
  }

  /** Update position only (CPU today, GPU tomorrow) */
  setPosition(i: number, x: number, y: number, z: number) {
    const o = i * 3;
    this.positions[o]     = x;
    this.positions[o + 1] = y;
    this.positions[o + 2] = z;
  }
}
