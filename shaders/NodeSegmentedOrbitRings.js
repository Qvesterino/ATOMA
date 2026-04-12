import * as THREE from "three";

export class NodeSegmentedOrbitRings {

constructor(scene, center, options={}){


this.scene = scene;
this.center = center;

this.segmentCount = options.segmentCount || 64;
this.radius = options.radius || 1.7;

this.clock = new THREE.Clock();
this.energy = 0.5; // Default energy level (0-1)

// ATOMA_ORBIT_v2: Larger segments for more visual presence
const geometry = new THREE.PlaneGeometry(0.72, 0.42);

const material = new THREE.ShaderMaterial({
transparent:true,
depthWrite:false,
depthTest:true,
side: THREE.DoubleSide,
blending:THREE.AdditiveBlending,
toneMapped: false,
uniforms:{
time:{value:0},
color:{value:new THREE.Color(0x7fdcff)},
speedMult:{value:1.0},
radius:{value:this.radius}
},
customProgramCacheKey: () => 'ATOMA_ORBIT_v2',
vertexShader:`

attribute float angle;
attribute float ring;
attribute float seed;

uniform float time;
uniform float speedMult;
uniform float radius;

varying float vSeed;
varying vec2 vUv;
varying float vHot;
varying float vArcPhase;
varying float vTrailDir;

mat3 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}

mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}

void main(){

vSeed = seed;
vUv = uv;
vHot = step(0.84, seed);

// Base speed modulated by energy (low=0.3, high=2.5)
float baseSpeed = ring < 0.5 ? 0.9 : -0.6;
float speed = baseSpeed * speedMult;
vTrailDir = sign(speed == 0.0 ? 1.0 : speed);

float a = angle + time * speed;
float ringMix = step(0.5, ring);
float ringSign = mix(-1.0, 1.0, ringMix);
float tilt = mix(0.82, -0.82, ringMix);
float precession = time * 0.14 + seed * 1.7 + ringSign * 0.6;
float wobble = sin(time * 1.1 + seed * 9.0 + angle * 2.3) * 0.022;
float r = radius + ringSign * 0.035 + wobble;
vArcPhase = a;

vec3 orbitCenter = vec3(
cos(a) * r,
sin(a * 2.0 + vSeed * 6.2831 + time * 0.8) * 0.012,
sin(a) * r
);

vec3 radial = normalize(vec3(cos(a), 0.0, sin(a)));
vec3 tangent = normalize(vec3(-sin(a), 0.0, cos(a)));
vec3 vertical = vec3(0.0, 1.0, 0.0);

mat3 ringRotation = rotateY(ringSign * 0.22 + sin(precession * 0.7) * 0.08) * rotateX(tilt + cos(precession) * 0.06);
orbitCenter = ringRotation * orbitCenter;
radial = normalize(ringRotation * radial);
tangent = normalize(ringRotation * tangent);
vertical = normalize(ringRotation * vertical);

// ATOMA_ORBIT_v2: Breathing scale — segments pulse subtly with time
float breathe = 1.0 + 0.06 * sin(time * 2.2 + seed * 6.28);

// Use the plane's local quad vertices so each segment has real area.
float lengthScale = mix(0.68, 1.24, seed);
lengthScale += vHot * 0.28;
float widthScale = mix(0.92, 1.08, fract(seed * 11.73));
vec3 localOffset =
    tangent * (position.x * lengthScale * breathe) +
    vertical * (position.y * widthScale * breathe);

// Broaden the segment silhouette and separate the two ring lanes.
localOffset += radial * (ringSign * 0.03);
localOffset += vertical * (sin(a * 3.0 + vSeed * 9.0 + time * 1.2) * (0.007 + vHot * 0.004));
localOffset += vertical * (sin(time * 1.9 + angle * 1.7 + seed * 15.0) * 0.008 * smoothstep(0.15, 0.85, abs(position.x)));

vec3 pos = orbitCenter + localOffset;

vec4 mv = modelViewMatrix * vec4(pos,1.0);

gl_Position = projectionMatrix * mv;

}
`,
fragmentShader:`

varying vec2 vUv;

uniform vec3 color;
uniform float speedMult;
uniform float time;
varying float vSeed;
varying float vHot;
varying float vArcPhase;
varying float vTrailDir;

float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main(){
    vec2 uv = vUv * 2.0 - 1.0;
    float gapJitter = fract(vSeed * 17.31);
    float visibleSpan = mix(0.58, 0.92, gapJitter) + vHot * 0.18;
    float edgeTrim = smoothstep(visibleSpan, visibleSpan - 0.09, abs(uv.x));
    float asymmetry = mix(0.88, 1.12, fract(vSeed * 31.7));
    float phasePulse = 0.7 + 0.3 * sin(vArcPhase * 2.0 + time * 0.9 + vSeed * 19.0);
    float segmentMask = edgeTrim * phasePulse;
    float baseRing = pow(max(0.0, 1.0 - abs(uv.y) * 7.5), 2.8);
    float baseTrail = baseRing * (0.2 + 0.8 * smoothstep(0.98, 0.15, abs(uv.x)));

    float segmentCore = 1.0 - smoothstep(-0.03, 0.07, roundedBoxSDF(uv, vec2(0.52, 0.18), 0.15));
    float segmentGlow = 1.0 - smoothstep(0.12, 0.85, roundedBoxSDF(uv, vec2(0.72, 0.33), 0.28));
    float trailCoord = -uv.x * vTrailDir;
    float trailLength = mix(0.55, 1.05, gapJitter) + vHot * 0.2;
    float trailBody = smoothstep(-0.08, 0.24, trailCoord) * (1.0 - smoothstep(trailLength, trailLength + 0.36, trailCoord));
    float trailSoft = pow(max(0.0, 1.0 - abs(uv.y) * 3.8), 1.6);
    float capsuleTrail = trailBody * trailSoft * (0.45 + segmentGlow * 0.55);

    float spine = pow(max(0.0, 1.0 - abs(uv.y) * 5.5), 2.4);
    float sideFilamentA = pow(max(0.0, 1.0 - abs(uv.y - 0.34) * 18.0), 1.7);
    float sideFilamentB = pow(max(0.0, 1.0 - abs(uv.y + 0.34) * 18.0), 1.7);

    float scanA = pow(max(0.0, sin(vUv.x * (18.0 + gapJitter * 8.0) - time * 8.0 + vSeed * 13.0)), 8.0);
    float scanB = pow(max(0.0, sin(vUv.x * (25.0 + asymmetry * 6.0) + time * 11.0 + vSeed * 7.0)), 7.0);
    float movingEnergy = (scanA * 0.22 + scanB * 0.12) * (spine + sideFilamentA * 0.2 + sideFilamentB * 0.2);

    // ATOMA_ORBIT_v2: Enhanced end bloom — brighter, wider
    float endBloom = pow(max(0.0, 1.0 - abs(abs(uv.x) - 0.92) * 5.5), 2.8) * (0.45 + spine * 0.75);
    
    float flicker = 0.84 + 0.16 * sin(time * 7.0 + vSeed * 41.0);
    float energyFlicker = 0.65 + speedMult * 0.22;
    float hotBoost = 1.0 + vHot * 0.6;

    // === ATOMA_ORBIT_v2: HOT CORE GLOW ===
    // White-hot center line that pulses with energy
    float hotCoreLine = pow(max(0.0, 1.0 - abs(uv.y) * 14.0), 3.5);
    float corePulse = 0.8 + 0.2 * sin(time * 5.0 + vArcPhase * 3.0);
    float hotCore = hotCoreLine * corePulse * segmentMask;

    // === ATOMA_ORBIT_v2: ENERGY PULSE WAVE ===
    // Bright pulse traveling around the ring
    float pulseWave = pow(max(0.0, sin(vArcPhase * 1.0 - time * 3.0)), 12.0);
    float pulseGlow = pulseWave * spine * 0.4;

    // === ATOMA_ORBIT_v2: IRIDESCENT COLOR SHIFT ===
    // Color shifts based on arc position (angle around ring)
    float iridShift = sin(vArcPhase * 2.0 + time * 0.5) * 0.5 + 0.5;
    vec3 iridColor = mix(
        vec3(0.4, 0.85, 1.0),   // Cool cyan
        vec3(0.7, 0.5, 1.0),    // Soft violet
        iridShift * 0.25         // Subtle shift
    );

    // === ATOMA_ORBIT_v2: ENHANCED COLOR PALETTE ===
    vec3 coreColor = mix(color, vec3(1.0), 0.75);  // Whiter core (was 0.68)
    vec3 glowColor = mix(color * iridColor, vec3(0.82, 0.92, 1.0), 0.45);
    vec3 hotColor = vec3(0.95, 0.98, 1.0);  // Near-white hot

    vec3 finalColor =
        glowColor * baseTrail * 0.25 +
        glowColor * capsuleTrail * 0.22 +
        glowColor * segmentGlow * 0.50 * segmentMask +
        coreColor * segmentCore * segmentMask * (1.15 + movingEnergy + endBloom * 0.9) * hotBoost +
        hotColor * hotCore * 1.2 +
        hotColor * pulseGlow * hotBoost +
        vec3(0.95, 0.98, 1.0) * movingEnergy * 0.40 * hotBoost;

    float alpha =
        baseTrail * 0.20 +
        capsuleTrail * 0.16 +
        segmentGlow * 0.25 * segmentMask +
        segmentCore * 0.75 * segmentMask +
        movingEnergy * 0.48 * segmentMask +
        endBloom * 0.32 * segmentMask +
        hotCore * 0.5 +
        pulseGlow * 0.3;

    finalColor *= flicker * energyFlicker;
    alpha *= flicker;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, min(alpha, 1.0));

}
`
});

this.mesh = new THREE.InstancedMesh(
geometry,
material,
this.segmentCount
);

const angles = new Float32Array(this.segmentCount);
const rings = new Float32Array(this.segmentCount);
const seeds = new Float32Array(this.segmentCount);

for(let i=0;i<this.segmentCount;i++){

angles[i] = (i/this.segmentCount)*Math.PI*2;

rings[i] = i%2;

seeds[i] = Math.random();

}

this.mesh.geometry.setAttribute(
"angle",
new THREE.InstancedBufferAttribute(angles,1)
);

this.mesh.geometry.setAttribute(
"ring",
new THREE.InstancedBufferAttribute(rings,1)
);

this.mesh.geometry.setAttribute(
"seed",
new THREE.InstancedBufferAttribute(seeds,1)
);

// Don't add to scene - caller will add as child of aura mesh
// scene.add(this.mesh);

// Initialize instance matrices
const dummy = new THREE.Object3D();
for (let i = 0; i < this.segmentCount; i++) {
    dummy.position.set(0, 0, 0);
    dummy.updateMatrix();
    this.mesh.setMatrixAt(i, dummy.matrix);
}
this.mesh.instanceMatrix.needsUpdate = true;

// Disable frustum culling for instanced shader
this.mesh.frustumCulled = false;

}

update(){

this.mesh.material.uniforms.time.value =
this.clock.getElapsedTime();

}

/**
 * Set energy level (0-1) to modulate orbit speed
 * low synergy → slow orbit
 * high synergy → fast reactor
 */
setEnergy(energyLevel){
    this.energy = Math.max(0, Math.min(1, energyLevel));
    // Map energy 0-1 to speed multiplier 0.3-2.5
    const speedMult = 0.3 + this.energy * 2.2;
    this.mesh.material.uniforms.speedMult.value = speedMult;
}

/**
 * Update center position (call when node moves)
 */
setCenter(x, y, z){
    this.mesh.position.set(x, y, z);
}

dispose(){

this.scene.remove(this.mesh);
this.mesh.geometry.dispose();
this.mesh.material.dispose();

}

}
