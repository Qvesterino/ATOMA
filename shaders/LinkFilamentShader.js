/**
 * LinkFilamentShader.js
 * ============================================================================
 * GPU-driven strand filament shader for LinkRendererConduit.
 *
 * Replaces CPU-side vertex buffer updates with shader-based motion.
 * Per-filament seed data is baked into vertex attributes once at creation.
 * The vertex shader computes position, pulse, sway, bridge arcs, and color.
 *
 * Expected geometry: LineSegments with 4 vertices per filament sample
 *   vertex 0 = filament start
 *   vertex 1 = filament mid (line 1 end)
 *   vertex 2 = filament mid (line 2 start)
 *   vertex 3 = filament end
 */

import * as THREE from 'three';

const FILAMENT_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBezierP0;
  uniform vec3 uBezierP1;
  uniform vec3 uBezierP2;
  uniform float uStrandCount;
  uniform float uActiveRadius;
  uniform float uTwists;
  uniform float uTwistPhase;
  uniform float uLinkLength;

  uniform float uSynergy;
  uniform float uHarmony;
  uniform float uCorruption;
  uniform float uLoad;
  uniform float uStability;
  uniform float uStressBias;
  uniform float uStressTension;

  uniform vec3 uBaseColor;
  uniform vec3 uStressColor;
  uniform float uOpacity;

  attribute float aRootT;
  attribute float aPhase;
  attribute float aLengthScale;
  attribute float aStrandSlot;
  attribute float aDriftSign;
  attribute float aVariant;
  attribute float aBridgeForward;
  attribute float aBridgeTwist;
  attribute float aBridgeNeighborSign;
  attribute float aVertexIndex; // 0=start, 1=midA, 2=midB, 3=end

  varying vec3 vColor;
  varying float vOpacity;

  // ---- Simple seeded pseudo-random (deterministic from seed) ----
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  // ---- Quadratic Bezier ----
  vec3 bezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
    float mt = 1.0 - t;
    return mt * mt * p0 + 2.0 * mt * t * p1 + t * t * p2;
  }
  vec3 bezierTangent(vec3 p0, vec3 p1, vec3 p2, float t) {
    return 2.0 * (1.0 - t) * (p1 - p0) + 2.0 * t * (p2 - p1);
  }

  // ---- Build orthonormal basis from tangent ----
  void buildFrame(vec3 tangent, out vec3 normal, out vec3 binormal) {
    vec3 up = abs(tangent.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    binormal = normalize(cross(tangent, up));
    normal = cross(binormal, tangent);
  }

  void main() {
    float pressureDensity = clamp(uStressBias * 0.7 + uStressTension * 0.42, 0.0, 1.0);
    float travelSpeed = 0.18 + uSynergy * 0.08 + pressureDensity * 0.045;
    float advect = uTime * travelSpeed * aDriftSign;
    float tRaw = aRootT + advect;
    float tWrapped = fract(tRaw);
    float t = clamp(tWrapped, 0.015, 0.985);

    // Sample curve
    vec3 pointOnCurve = bezierPoint(uBezierP0, uBezierP1, uBezierP2, t);
    vec3 tangent = normalize(bezierTangent(uBezierP0, uBezierP1, uBezierP2, t));

    vec3 normal, binormal;
    buildFrame(tangent, normal, binormal);

    float strandIndex = aStrandSlot;
    float strandCount = max(1.0, uStrandCount);
    float angleOffset = (strandIndex / strandCount) * 6.2831853;
    float currentTwist = t * 6.2831853 * uTwists + uTwistPhase;
    float angle = angleOffset + currentTwist;

    float flare = 1.0 + pow(2.0 * (t - 0.5), 2.0) * 0.2;
    float radius = uActiveRadius * flare * (1.0 + pressureDensity * 0.06);
    float edgeFadeSpan = 0.05;
    float edgeDistance = min(t, 1.0 - t);
    if (edgeDistance < edgeFadeSpan) {
      float fade = 1.0 - (edgeDistance / edgeFadeSpan);
      radius *= (1.0 - fade * 0.55);
    }

    vec3 radial = normalize(normal * cos(angle) + binormal * sin(angle));
    float noiseBase = 0.0025;
    radius += sin(t * 40.0 + strandIndex * 10.0) * (noiseBase + pressureDensity * 0.0012);

    float pulse = 0.5 + 0.5 * sin(uTime * 1.8 + aPhase + t * 12.0);
    float flowWave = sin(uTime * 2.2 + aPhase * 1.4 + t * 20.0);
    float detachPulse = pow(max(0.0, sin(uTime * 3.5 + aPhase * 1.7 + t * 9.0)), 6.0);
    float detach = detachPulse * (0.35 + uCorruption * 0.95 + uLoad * 0.25 + pressureDensity * 0.42);

    float filamentLength = uActiveRadius * 1.6 * aLengthScale *
      (0.7 + uHarmony * 0.35 + uLoad * 0.45 + pressureDensity * 0.38) +
      detach * 2.5;

    float sway = (pulse - 0.5) * 0.35 * (1.0 + uStability * 0.6 + pressureDensity * 0.22);

    int variant = int(aVariant + 0.5);
    vec3 vStart, vMid, vEnd;

    float startSurfaceMul = (variant == 1 || variant == 2) ? 1.0 : 0.82;
    vStart = pointOnCurve + radial * (radius * startSurfaceMul);

    if (variant == 1 || variant == 2) {
      // Bridge or micro-jump
      float hopWave = sin(uTime * 2.0 + aPhase * 0.75 + t * 8.0);
      float hopDir = hopWave >= 0.0 ? aBridgeNeighborSign : -aBridgeNeighborSign;
      float targetStrandIndex = mod(strandIndex + hopDir + strandCount, strandCount);
      if (abs(targetStrandIndex - strandIndex) < 0.5 && strandCount > 1.0) {
        targetStrandIndex = mod(strandIndex + 1.0, strandCount);
      }
      float tBridge = clamp(t + aBridgeForward * aDriftSign + sin(uTime * 0.9 + aPhase) * 0.012, 0.01, 0.99);

      vec3 point2 = bezierPoint(uBezierP0, uBezierP1, uBezierP2, tBridge);
      vec3 tangent2 = normalize(bezierTangent(uBezierP0, uBezierP1, uBezierP2, tBridge));
      vec3 normal2, binormal2;
      buildFrame(tangent2, normal2, binormal2);

      float targetAngleOffset = (targetStrandIndex / strandCount) * 6.2831853;
      float targetTwist = tBridge * 6.2831853 * uTwists + uTwistPhase;
      float angle2 = targetAngleOffset + targetTwist + aBridgeTwist * (0.85 + 0.35 * sin(uTime * 1.35 + aPhase + t * 4.0));
      float flare2 = 1.0 + pow(2.0 * (tBridge - 0.5), 2.0) * 0.18;
      float radius2 = uActiveRadius * flare2 + sin(tBridge * 40.0 + targetStrandIndex * 10.0) * noiseBase;
      float edgeDistance2 = min(tBridge, 1.0 - tBridge);
      if (edgeDistance2 < edgeFadeSpan) {
        float fade2 = 1.0 - (edgeDistance2 / edgeFadeSpan);
        radius2 *= (1.0 - fade2 * 0.52);
      }
      vec3 radial2 = normalize(normal2 * cos(angle2) + binormal2 * sin(angle2));
      vEnd = point2 + radial2 * (radius2 * 0.78);

      // Keep this explicitly initialized for ANGLE / stricter GLSL compilers.
      // An uninitialized side vector here can produce an invalid program on
      // some drivers even if other browsers appear tolerant.
      vec3 sideVec = normalize(cross(tangent2, radial2));
      if (length(sideVec) < 0.001) {
        sideVec = binormal2;
      }
      if (variant == 2) {
        // Micro-jump
        float jumpPulse = sin(uTime * 4.0 + aPhase * 2.2 + t * 12.0);
        float jumpGate = clamp((jumpPulse - 0.62) * 4.2, 0.0, 1.0);
        vMid = mix(vStart, vEnd, 0.5);
        vMid += sideVec * filamentLength * sway * 0.36;
        vMid += radial * filamentLength * 0.55 * jumpGate;
        vMid += tangent2 * filamentLength * (0.03 + jumpGate * 0.08);
        if (jumpGate < 0.05) {
          vEnd = mix(vEnd, vStart, 1.0 - jumpGate * 20.0);
          vMid = mix(vStart, vEnd, 0.5);
        }
        vMid += sideVec * filamentLength * flowWave * 0.04;
      } else {
        // Bridge
        vMid = mix(vStart, vEnd, 0.5);
        vMid += radial * filamentLength * (0.35 * (0.6 + 0.4 * pulse));
        vMid += sideVec * filamentLength * sway * 0.55;
        vMid += tangent2 * filamentLength * (0.08 + uLoad * 0.1 + pressureDensity * 0.08);
        vMid += sideVec * filamentLength * flowWave * 0.18;
      }
    } else {
      // Standard flow hair
      float forwardLean = filamentLength * (0.22 + uLoad * 0.35 + uSynergy * 0.2 + pressureDensity * 0.22);
      float radialLean = filamentLength * (0.18 + uCorruption * 0.18 + pressureDensity * 0.16);
      vec3 sideVec = normalize(cross(tangent, radial));
      if (length(sideVec) < 0.001) sideVec = binormal;

      vEnd = vStart + tangent * forwardLean + radial * radialLean + sideVec * filamentLength * sway * 0.44 + tangent * detach * 0.2 * aDriftSign + sideVec * filamentLength * flowWave * 0.28;
      vMid = mix(vStart, vEnd, 0.52);
      vMid += sideVec * filamentLength * sway * 0.26;
      vMid += radial * filamentLength * 0.12;
      vMid += sideVec * filamentLength * flowWave * 0.16;
    }

    // Select output position based on vertex index
    int vIdx = int(aVertexIndex + 0.5);
    vec3 outPos;
    if (vIdx == 0) outPos = vStart;
    else if (vIdx == 1 || vIdx == 2) outPos = vMid;
    else outPos = vEnd;

    // ---- Color computation ----
    vec3 cBase = uBaseColor;
    cBase = mix(cBase, uStressColor, pressureDensity * 0.22);

    float isMicroJump = float(variant == 2);
    float isBridge = float(variant == 1);
    float jumpVisibility = (variant == 2) ? clamp((sin(uTime * 4.0 + aPhase * 2.2 + t * 12.0) - 0.62) * 4.2, 0.0, 1.0) : 1.0;

    float startGain = (isMicroJump > 0.5 ? (0.42 + jumpVisibility * 0.42) : (isBridge > 0.5 ? 0.68 : 0.78)) + uLoad * 0.40 + pulse * 0.22 + pressureDensity * 0.18;
    float midGain = (isMicroJump > 0.5 ? (0.50 + jumpVisibility * 0.40) : (isBridge > 0.5 ? 0.78 : 0.88)) + uHarmony * 0.28 + pulse * 0.18 + pressureDensity * 0.24;
    float tipGain = (isMicroJump > 0.5 ? (0.70 + jumpVisibility * 0.48) : (isBridge > 0.5 ? 0.98 : 1.15)) + uHarmony * 0.30 + detach * 1.05 + pressureDensity * 0.34;

    vec3 cTip = mix(cBase, vec3(1.0), clamp((isMicroJump > 0.5 ? (0.36 + jumpVisibility * 0.52) : (isBridge > 0.5 ? 0.56 : 0.78)) + detach * 0.68 + uCorruption * 0.28 + pressureDensity * 0.18, 0.0, 1.0));
    cTip = mix(cTip, uStressColor, pressureDensity * 0.18);
    vec3 cMid = mix(cBase, cTip, isMicroJump > 0.5 ? (0.40 + jumpVisibility * 0.38) : (isBridge > 0.5 ? 0.70 : 0.58));

    vec3 outColor;
    if (vIdx == 0) outColor = cBase * startGain;
    else if (vIdx == 1 || vIdx == 2) outColor = cMid * midGain;
    else outColor = cTip * tipGain;

    vColor = outColor;
    vOpacity = uOpacity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(outPos, 1.0);
  }
`;

const FILAMENT_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    gl_FragColor = vec4(vColor, vOpacity);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

/**
 * Create a GPU-driven filament ShaderMaterial.
 * @param {Object} uniforms - Initial uniform values
 * @returns {THREE.ShaderMaterial}
 */
export function createFilamentShaderMaterial(uniforms = {}) {
  const defaultUniforms = {
    uTime: { value: 0.0 },
    uBezierP0: { value: new THREE.Vector3(0, 0, 0) },
    uBezierP1: { value: new THREE.Vector3(0, 0, 0) },
    uBezierP2: { value: new THREE.Vector3(1, 0, 0) },
    uStrandCount: { value: 3.0 },
    uActiveRadius: { value: 0.06 },
    uTwists: { value: 1.0 },
    uTwistPhase: { value: 0.0 },
    uLinkLength: { value: 1.0 },
    uSynergy: { value: 0.0 },
    uHarmony: { value: 0.0 },
    uCorruption: { value: 0.0 },
    uLoad: { value: 0.0 },
    uStability: { value: 0.0 },
    uStressBias: { value: 0.0 },
    uStressTension: { value: 0.0 },
    uBaseColor: { value: new THREE.Color(0xffffff) },
    uStressColor: { value: new THREE.Color(0x7be6ff) },
    uOpacity: { value: 0.55 }
  };

  // Merge provided uniforms over defaults
  const merged = {};
  for (const key of Object.keys(defaultUniforms)) {
    merged[key] = uniforms[key] !== undefined ? uniforms[key] : defaultUniforms[key];
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: FILAMENT_VERTEX_SHADER,
    fragmentShader: FILAMENT_FRAGMENT_SHADER,
    uniforms: merged,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    linewidth: 1.6
  });
  material.toneMapped = false;
  return material;
}
