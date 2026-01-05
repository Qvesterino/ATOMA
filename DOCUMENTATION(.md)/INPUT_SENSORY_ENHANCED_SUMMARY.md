# Input Category Kinetic Sensory Expansion (Session 111)

## Overview
Comprehensive upgrade of the **Input** category (Cyan) nodes with kinetic sensory geometries. These nodes represent the sensory organs of the AI network, actively perceiving and receiving environmental signals.

**Core Concept**: "Sensory Perception Engines" - Active, kinetic reception.
**Archetype**: **Kinetic Receptors** (Active sensory perception).

## New Variants

### 1. Tactile Sensor (`INPUT_TACTILE_SENSOR`)
*   **Visuals**: Central sensory bulb with 14 radiating bristle-like antennae. Each bristle has unique angle and taper.
*   **Motion**: 
    *   Bristles wave independently with sine-wave oscillations.
    *   Wave motion travels down each bristle at unique frequency.
    *   Scale modulation simulates bending/flexing.
    *   Independent rotation per bristle.
*   **Metaphor**: Tactile/touch sensing - sensitive to physical contact and vibration.

### 2. Echo Detector (`INPUT_ECHO_DETECTOR`)
*   **Visuals**: 5 nested, slightly rippled spheroidal shells. Central bright "echo chamber" core.
*   **Motion**:
    *   Each shell pulses at different frequency (creating interference pattern).
    *   Shells expand/contract as if breathing to detect waves.
    *   Central chamber pulses at faster frequency.
    *   Subtle independent rotation per layer.
*   **Metaphor**: Acoustic/echo sensing - detects environmental vibrations and reflections.

### 3. Neural Receptor (`INPUT_NEURAL_RECEPTOR`)
*   **Visuals**: Central "soma" (neural cell body) with 3-level recursive dendritic branching tree. Glowing signal particles flowing along dendrites.
*   **Motion**:
    *   Signal particles travel along dendritic curves.
    *   Particles pulse with emissive glow.
    *   Soft rotation of soma.
    *   Dendrites remain static (representing structural connectivity).
*   **Metaphor**: Neural-inspired signal processing - signals cascade down the dendritic tree.

## Technical Implementation

*   **File**: `InputSensoryEnhanced_Session111.js`
*   **Geometry**:
    *   **TactileSensor**: IcosahedronGeometry (bulb) + TubeGeometry (bristles via CatmullRomCurve3).
    *   **EchoDetector**: IcosahedronGeometry (shells with asymmetric deformation) + OctahedronGeometry (chamber).
    *   **NeuralReceptor**: TetrahedronGeometry (soma) + Recursive TubeGeometry branches via CatmullRomCurve3.

*   **Materials**: 
    *   High emissive intensity (0.4-0.8) to convey active sensing.
    *   Semi-translucent (0.8-0.95 opacity).
    *   Physically-based rendering with transmission for organic feel.

*   **Animation**:
    *   **TactileSensor**: Uses `Math.sin/cos` for bristle bending waves. Scale modulation simulates flex.
    *   **EchoDetector**: Uses `Math.sin` oscillations for shell pulsing. Independent phase per layer.
    *   **NeuralReceptor**: Uses `curve.getPoint(t)` to move signal particles along dendritic paths.

## Integration

*   Updated `EnhancedNodeModels.js`:
    *   Added import for `InputSensoryEnhanced`.
    *   Updated `createInputNode()` to include 3 new sensory variants in the 11-variant rotation.
    *   Added custom animation blocks in `animate()` for kinetic motion.

## Visual Hierarchy

All nodes use:
- Semi-translucent cyan materials
- Emissive glow to indicate active sensing
- Organic, asymmetric geometry (never perfect symmetry)
- Continuous, smooth motion suggesting active perception

## Gameplay Meaning

- **Tactile Sensor**: "I feel what touches me."
- **Echo Detector**: "I hear what resonates."
- **Neural Receptor**: "I process what flows through me."

Together, these three variants complete a sensory trinity for the Input category: Touch, Sound, and Neural Processing.
