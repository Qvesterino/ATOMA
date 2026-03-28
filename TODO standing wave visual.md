# TODO: Standing Wave Visual

Short note for the next pass on the standing-wave trap renderer.

## Why revisit it
- The previous fragmented torus idea was visually interesting, but it became too expensive and too close to a full layered effect stack.
- The current simplified version is acceptable, but the visual language could still be cleaner if we ever decide to spend more budget on it.

## If we return to this
- Start from the cheapest possible torus / ring base first.
- Keep the trap zone readable with minimal mesh count and minimal animation work.
- Avoid adding extra shells, shard pools, or glint layers unless the performance budget is clearly available.
- If we want a stronger identity later, try a controlled Broken Möbius / segmented-loop design, but only if it can stay cheap.

## Current rule of thumb
- Prefer stable runtime cost over visual complexity for this effect.
- Do not let the trap visual become 5x more expensive than the geometry it represents.
