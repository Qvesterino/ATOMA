# Integration Node Visual Expansion (Session 110)

## Overview
Visual expansion for the **Integration** category (Green/Cyan) nodes, replacing previous static designs with kinetic "Knot" archetypes. These nodes represent the integration of systems, data flows, and logic streams through physical intertwining.

**Core Concept**: "AI-Grown Hardware" - Knots, weaves, and tangles.
**Archetype**: **Knots** (Intertwined structures).

## New Variants

### 1. Signal Knot (`INTEGRATION_SIGNAL_KNOT`)
*   **Visuals**: Three smooth data streams woven together in a balanced open weave. Cyan/Teal emissive flow lines.
*   **Motion**: "Signal Packets" travel visibly along the curvature of the strands, indicating active data throughput.
*   **Metaphor**: Precise, intentional integration of multiple smooth data streams.

### 2. Protocol Tangle (`INTEGRATION_PROTOCOL_TANGLE`)
*   **Visuals**: A chaotic, dense bundle of 5+ heterogeneous strands (varying thickness, roughness). Includes sharp "Friction Nodes" at intersections.
*   **Motion**: Strands vibrate/jitter with visual friction. Friction nodes rotate chaotically. Opacity pulses to simulate negotiation.
*   **Metaphor**: Complex, negotiated integration of incompatible protocols.

### 3. Continuity Binder (`INTEGRATION_CONTINUITY_BINDER`)
*   **Visuals**: Two elongated, thick loops interlocking in a stable "Reef knot" configuration. Central "Stability Anchor" ring.
*   **Motion**: Slow, reassuring breathing tension (loops pull apart and together slightly). Anchor rotates slowly.
*   **Metaphor**: Long-term stability and continuity.

## Technical Implementation

*   **File**: `IntegrationEnhancedVariants_Session110.js`
*   **Geometry**: Uses `THREE.CatmullRomCurve3` and `THREE.TubeGeometry` for organic, flowing strand shapes.
*   **Animation**: 
    *   **Signal Knot**: Uses `curve.getPoint(t)` in the animation loop to move packet meshes along the defined paths.
    *   **Protocol Tangle**: Uses `Math.sin/cos` noise functions to apply jitter to position/rotation.
    *   **Continuity Binder**: Uses scale oscillation to simulate tension.

## Integration
*   Updated `EnhancedNodeModels.js` to replace Session 82 integration variants with Session 110 variants.
*   Added custom animation blocks in `EnhancedNodeModels.animate()`.
