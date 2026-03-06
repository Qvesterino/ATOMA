import * as THREE from "three";

export class NodeSegmentedOrbitRings {

constructor(scene, center, options={}){

this.scene = scene;
this.center = center;

this.segmentCount = options.segmentCount || 64;
this.radius = options.radius || 1.7;

this.clock = new THREE.Clock();

const geometry = new THREE.PlaneGeometry(0.35,0.12);

const material = new THREE.ShaderMaterial({
transparent:true,
depthWrite:false,
blending:THREE.AdditiveBlending,
uniforms:{
time:{value:0},
color:{value:new THREE.Color(0x7fdcff)}
},
vertexShader:`

attribute float angle;
attribute float ring;
attribute float seed;

uniform float time;

varying float vSeed;

void main(){

vSeed = seed;

float speed = ring < 0.5 ? 0.9 : -0.6;

float a = angle + time * speed;

float r = ${1.7};

vec3 pos = vec3(
cos(a)*r,
sin(a*0.6)*0.12,
sin(a)*r
);

vec3 center = vec3(${center.x},${center.y},${center.z});
pos += center;

vec4 mv = modelViewMatrix * vec4(pos,1.0);

gl_Position = projectionMatrix * mv;

}
`,
fragmentShader:`

uniform vec3 color;
varying float vSeed;

void main(){

vec2 uv = gl_PointCoord - vec2(0.5);

float dist = length(uv);

float glow = smoothstep(0.45,0.0,dist);

float flicker = 0.7 + 0.3*sin(vSeed*40.0);

vec3 c = color * flicker;

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

scene.add(this.mesh);

}

update(){

this.mesh.material.uniforms.time.value =
this.clock.getElapsedTime();

}

dispose(){

this.scene.remove(this.mesh);
this.mesh.geometry.dispose();
this.mesh.material.dispose();

}

}
