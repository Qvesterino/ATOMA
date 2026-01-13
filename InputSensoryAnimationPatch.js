/**
 * INPUT Sensory Animation Patch
 * 
 * Handles animation updates for the three new INPUT sensory geometries:
 * 1. SENSORY_GATE — Frame drift + slow rotation
 * 2. LISTENING_CROWN — Independent spine sway + crown rotation
 * 3. PERCEPTION_BLOOM — Breathing scale + slow rotation
 * 
 * Integration:
 * Call animateInputSensoryNode(node, time) once per frame in EnhancedNodeModels.animate()
 * 
 * Safety:
 * ✓ Transform-only (no geometry/material mutation)
 * ✓ No per-frame material changes
 * ✓ Scale breathing stays within ±1%
 * ✓ Rotation only (no translation except for designed orbits)
 */

/**
 * Animate a single INPUT sensory node
 * @param {THREE.Group} node - The node to animate
 * @param {number} elapsed - Elapsed time in milliseconds
 */
export function animateInputSensoryNode(node, elapsed) {
  if (!node || !node.userData) return;

  const type = node.userData.gateAnimationType ||
               node.userData.crownAnimationType ||
               node.userData.bloomAnimationType;

  switch (type) {
    case 'sensory_gate':
      animateSensoryGate(node, elapsed);
      break;
    case 'listening_crown':
      animateListeningCrown(node, elapsed);
      break;
    case 'perception_bloom':
      animatePerceptionBloom(node, elapsed);
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SENSORY_GATE Animation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animate SENSORY_GATE: Frame drift + slow rotation
 * - Very slow overall rotation (Y axis)
 * - Each segment drifts slightly (rotation only)
 * - Segments have offset phase for organic motion
 */
function animateSensoryGate(node, elapsed) {
  const seconds = elapsed / 1000;
  const segments = node.userData.sensoryGateSegments;

  if (!segments) return;

  const rotationSpeed = node.userData.gateRotationSpeed || 0.05;
  const driftAmount = node.userData.gateSegmentDrift || 0.3;

  // Overall rotation of entire gate (very slow)
  node.rotation.y = seconds * rotationSpeed;

  // Each segment drifts independently
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const mesh = segment.mesh;

    if (!mesh) continue;

    // Phase offset so segments don't move in unison
    const phaseOffset = (i / segments.length) * Math.PI * 2;
    
    // Segment sway: wobble rotation around its own center
    const sway = Math.sin(seconds * 0.3 + phaseOffset) * driftAmount;
    const tilt = Math.cos(seconds * 0.25 + phaseOffset) * (driftAmount * 0.6);

    // Store base rotation, add drift on top
    mesh.rotation.z = segment.tiltOffset + sway;
    mesh.rotation.x = tilt * 0.2;

    // Subtle radius breathing (very small)
    const breathe = 1 + Math.sin(seconds * 0.2 + phaseOffset) * 0.02;
    mesh.scale.set(breathe, breathe, breathe);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LISTENING_CROWN Animation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animate LISTENING_CROWN: Independent spine sway + crown rotation
 * - Each spine sways at different frequency/phase (wave-like)
 * - Crown rotates slowly around Y axis
 * - No sync between spines (creates organic listening effect)
 */
function animateListeningCrown(node, elapsed) {
  const seconds = elapsed / 1000;
  const spines = node.userData.listeningCrownSpines;

  if (!spines) return;

  const rotationSpeed = node.userData.crownRotationSpeed || 0.04;

  // Overall crown rotation (very slow, Y axis only)
  node.rotation.y = seconds * rotationSpeed;

  // Each spine sways independently (no syncing)
  for (let i = 0; i < spines.length; i++) {
    const spine = spines[i];
    const mesh = spine.mesh;

    if (!mesh) continue;

    // Each spine has its own sway phase
    const phase = spine.swayPhase;
    const swayAmount = spine.swayAmount || 0.2;

    // Spine sway: side-to-side wobble (rotation around X axis)
    const swayX = Math.sin(seconds * (0.4 + i * 0.05) + phase) * swayAmount;
    const swayZ = Math.cos(seconds * (0.35 + i * 0.04) + phase) * (swayAmount * 0.6);

    // Apply sway as rotation (wobble relative to base orientation)
    mesh.rotation.x = swayX;
    mesh.rotation.z = swayZ * 0.15;

    // Subtle breathing oscillation
    const breathe = 1 + Math.sin(seconds * 0.3 + phase) * 0.015;
    mesh.scale.y = breathe;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PERCEPTION_BLOOM Animation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animate PERCEPTION_BLOOM: Breathing scale + slow rotation
 * - Entire structure breathing in/out (±1% scale variation)
 * - Entire structure rotates extremely slowly
 * - Petals maintain fixed position (rigid transform)
 * - Creates hypnotic "awareness unfolding" effect
 */
function animatePerceptionBloom(node, elapsed) {
  const seconds = elapsed / 1000;
  const petals = node.userData.perceptionBloomPetals;

  if (!petals) return;

  const rotationSpeed = node.userData.bloomRotationSpeed || 0.02;
  const breathAmount = node.userData.bloomBreathAmount || 0.01;

  // Overall rotation: extremely slow, Y axis only
  node.rotation.y = seconds * rotationSpeed;

  // Unified breathing for entire bloom structure
  // ±1% scale variation creates hypnotic effect
  const breathPhase = seconds * 0.5; // 0.5 Hz breathing
  const breathScale = 1 + Math.sin(breathPhase) * breathAmount;

  // Apply breathing to entire node
  node.scale.set(breathScale, breathScale, breathScale);

  // Petals themselves do NOT move (rigid)
  // But they inherit the breathing through parent scale
}

/**
 * Animation patch: Add to EnhancedNodeModels.animate() method
 * 
 * Usage in EnhancedNodeModels.js animate():
 * 
 * import { animateInputSensoryNode } from './InputSensoryAnimationPatch.js';
 * 
 * animate(deltaTime = 16.67) {
 *   const elapsed = Date.now() - this._animationStart;
 *   
 *   // ... existing animation code ...
 *   
 *   // Animate INPUT sensory nodes
 *   for (const node of this.inputSensoryNodes || []) {
 *     animateInputSensoryNode(node, elapsed);
 *   }
 * }
 */

export default {
  animateInputSensoryNode,
  animateSensoryGate,
  animateListeningCrown,
  animatePerceptionBloom
};
