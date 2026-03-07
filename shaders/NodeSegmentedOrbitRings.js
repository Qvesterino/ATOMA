import * as THREE from "three";

export class NodeSegmentedOrbitRings {

constructor(scene, center, options={}){

console.log("ORBIT CREATED");

this.scene = scene;
this.center = center;

this.segmentCount = options.segmentCount || 96;
this.radius = options.radius || 1.7;

this.clock = new THREE.Clock();
this.energy = 0.5; // Default energy level (0-1)

const geometry = new THREE.PlaneGeometry(0.35,0.12);

const material = new THREE.ShaderMaterial({
transparent:true,
depthWrite:false,
depthTest:true,
side: THREE.DoubleSide,
blending:THREE.AdditiveBlending,
uniforms:{
time:{value:0},
color:{value:new THREE.Color(0x7fdcff)},
speedMult:{value:1.0},
radius:{value:this.radius}
},
vertexShader:`

attribute float angle;
attribute float ring;
attribute float seed;

uniform float time;
uniform float speedMult;
uniform float radius;

varying float vSeed;
varying vec2 vUv;

void main(){

vSeed = seed;
vUv = uv;

// Base speed modulated by energy (low=0.3, high=2.5)
float baseSpeed = ring < 0.5 ? 0.9 : -0.6;
float speed = baseSpeed * speedMult;

float a = angle + time * speed;

float r = radius;

vec3 orbitCenter = vec3(
cos(a)*r,
sin(a*0.6)*0.12,
sin(a)*r
);

vec3 radial = normalize(vec3(cos(a), 0.0, sin(a)));
vec3 tangent = normalize(vec3(-sin(a), 0.0, cos(a)));
vec3 vertical = vec3(0.0, 1.0, 0.0);

// Use the plane's local quad vertices so each segment has real area.
vec3 localOffset =
    tangent * position.x +
    vertical * position.y;

// Alternate rings with a subtle radial separation.
localOffset += radial * ((ring * 2.0 - 1.0) * 0.06);

vec3 pos = orbitCenter + localOffset;

vec4 mv = modelViewMatrix * vec4(pos,1.0);

gl_Position = projectionMatrix * mv;

}
`,
fragmentShader:`

varying vec2 vUv;

uniform vec3 color;
uniform float speedMult;
varying float vSeed;

void main(){


    
    vec2 uv = vUv - vec2(0.5);

    float dist = length(uv);

    float glow = smoothstep(0.45,0.0,dist);

    // Flicker increases with energy
    float flicker = 0.7 + 0.3*sin(vSeed*40.0);
    float energyFlicker = 0.5 + speedMult * 0.3;

    vec3 c = color * flicker * energyFlicker;

    gl_FragColor = vec4(c,glow);

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
