import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

const TMP_COLOR = new THREE.Color();
const TMP_DIRECTION = new THREE.Vector3();
const TMP_NORMAL = new THREE.Vector3();
const TMP_BINORMAL = new THREE.Vector3();
const TMP_OFFSET = new THREE.Vector3();
const TMP_EMIT_POS = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const SEGMENT_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

const DUST_VS = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute vec3 aInfo;   // x: birthTime, y: duration, z: baseSize

uniform float uTime;

varying vec3 vColor;
varying float vAlpha;

void main() {
    float age = uTime - aInfo.x;

    if (age < 0.0 || age > aInfo.y) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        vAlpha = 0.0;
        return;
    }

    float lifeProgress = age / aInfo.y;
    vec3 currentPos = position + aVelocity * age;

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float fadeIn = min(1.0, age / 0.08);
    float fadeOut = 1.0 - lifeProgress;
    float size = aInfo.z * mix(1.0, 2.2, lifeProgress);

    gl_PointSize = min(16.0, size * (70.0 / max(1.0, -mvPosition.z)));

    vColor = aColor;
    vAlpha = 0.42 * fadeIn * fadeOut;
}
`;

const DUST_FS = `
varying vec3 vColor;
varying float vAlpha;

void main() {
    if (vAlpha <= 0.002) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float fog = 1.0 - smoothstep(0.02, 0.5, dist);
    gl_FragColor = vec4(vColor, vAlpha * fog);
}
`;

let __dustMaterialBase;
function getDustMaterialBase() {
    if (!__dustMaterialBase) {
        __dustMaterialBase = new THREE.ShaderMaterial({
            vertexShader: DUST_VS,
            fragmentShader: DUST_FS,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            vertexColors: true
        });
    }
    return __dustMaterialBase;
}

function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

export class LinkPulseDustEmitter {
    constructor(maxParticles = 160) {
        this.maxParticles = Math.max(24, maxParticles | 0);
        this.enabled = true;
        this.visible = true;
        this.time = 0;
        this.writeIndex = 0;
        this.spawnAccumulator = 0;

        this.positions = new Float32Array(this.maxParticles * 3);
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.infos = new Float32Array(this.maxParticles * 3);

        for (let i = 0; i < this.maxParticles; i++) {
            this.infos[i * 3] = -100.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocities, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
        geometry.setAttribute('aInfo', new THREE.BufferAttribute(this.infos, 3));

        geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aVelocity.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aColor.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aInfo.usage = THREE.DynamicDrawUsage;

        const material = getDustMaterialBase().clone();
        material.uniforms = { uTime: { value: 0 } };

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.frustumCulled = false;
        applyLinkRenderLayer(this.mesh, 'LINK_RING');
        Object.assign(this.mesh.userData || (this.mesh.userData = {}), {
            isLinkPulseDust: true
        });
    }

    getObject3D() {
        return this.mesh;
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        this.mesh.visible = this.enabled && this.visible;
    }

    setVisible(visible) {
        this.visible = !!visible;
        this.mesh.visible = this.enabled && this.visible;
    }

    reset() {
        this.time = 0;
        this.spawnAccumulator = 0;
        this.writeIndex = 0;
        for (let i = 0; i < this.maxParticles; i++) {
            this.infos[i * 3] = -100.0;
        }
        this.mesh.geometry.attributes.aInfo.needsUpdate = true;
    }

    update({
        position,
        tangent,
        ringScale = 0.14,
        splitGap = 0.0,
        pulsePhase = 0.0,
        spinAngle = 0.0,
        progress = 0.0,
        dt = 0.016,
        sourceColor,
        targetColor
    } = {}) {
        if (!this.enabled || !position || !tangent) {
            this.mesh.visible = false;
            return;
        }

        this.mesh.visible = this.visible;
        this.time += dt;
        this.mesh.material.uniforms.uTime.value = this.time;

        TMP_DIRECTION.copy(tangent);
        if (TMP_DIRECTION.lengthSq() < 1e-6) return;
        TMP_DIRECTION.normalize();

        this._buildFrame(TMP_DIRECTION, TMP_NORMAL, TMP_BINORMAL);

        const openAmount = clamp01(splitGap / 0.8);
        const pulseBoost = 0.25 + openAmount * 0.95 + clamp01(pulsePhase) * 0.2;
        const emissionRate = lerp(28, 82, pulseBoost);
        this.spawnAccumulator += emissionRate * dt;

        let touched = false;
        while (this.spawnAccumulator >= 1.0) {
            this.spawnAccumulator -= 1.0;
            this._spawnParticle(
                position,
                TMP_DIRECTION,
                TMP_NORMAL,
                TMP_BINORMAL,
                ringScale,
                splitGap,
                spinAngle,
                progress,
                sourceColor,
                targetColor
            );
            touched = true;
        }

        if (touched) {
            this.mesh.geometry.attributes.position.needsUpdate = true;
            this.mesh.geometry.attributes.aVelocity.needsUpdate = true;
            this.mesh.geometry.attributes.aColor.needsUpdate = true;
            this.mesh.geometry.attributes.aInfo.needsUpdate = true;
        }
    }

    _spawnParticle(position, tangent, normal, binormal, ringScale, splitGap, spinAngle, progress, sourceColor, targetColor) {
        const idx = this.writeIndex;
        const i3 = idx * 3;

        const segmentIndex = Math.floor(Math.random() * SEGMENT_ANGLES.length);
        const angle = SEGMENT_ANGLES[segmentIndex] + spinAngle;
        const ringRadius = Math.max(0.06, ringScale * 0.8);
        const gapRadius = splitGap * 0.32;
        const radialRadius = ringRadius + gapRadius;

        TMP_OFFSET.copy(normal).multiplyScalar(Math.cos(angle) * radialRadius);
        TMP_OFFSET.addScaledVector(binormal, Math.sin(angle) * radialRadius);
        TMP_EMIT_POS.copy(position).add(TMP_OFFSET);
        TMP_EMIT_POS.addScaledVector(tangent, -(0.08 + Math.random() * 0.12));

        this.positions[i3] = TMP_EMIT_POS.x;
        this.positions[i3 + 1] = TMP_EMIT_POS.y;
        this.positions[i3 + 2] = TMP_EMIT_POS.z;

        const backwardSpeed = 0.18 + Math.random() * 0.16;
        const outwardSpeed = 0.03 + Math.random() * 0.06;
        const swirl = (Math.random() - 0.5) * 0.04;

        this.velocities[i3] =
            -tangent.x * backwardSpeed +
            TMP_OFFSET.x * outwardSpeed +
            binormal.x * swirl;
        this.velocities[i3 + 1] =
            -tangent.y * backwardSpeed +
            TMP_OFFSET.y * outwardSpeed +
            binormal.y * swirl;
        this.velocities[i3 + 2] =
            -tangent.z * backwardSpeed +
            TMP_OFFSET.z * outwardSpeed +
            binormal.z * swirl;

        TMP_COLOR.copy(sourceColor || 0xffffff);
        if (targetColor) {
            TMP_COLOR.lerp(targetColor, clamp01(progress));
        }
        TMP_COLOR.offsetHSL(0.0, -0.22, 0.08);

        this.colors[i3] = TMP_COLOR.r;
        this.colors[i3 + 1] = TMP_COLOR.g;
        this.colors[i3 + 2] = TMP_COLOR.b;

        this.infos[i3] = this.time;
        this.infos[i3 + 1] = 0.9 + Math.random() * 0.4;
        this.infos[i3 + 2] = 5.0 + Math.random() * 4.0;

        this.writeIndex = (this.writeIndex + 1) % this.maxParticles;
    }

    _buildFrame(direction, normal, binormal) {
        normal.copy(WORLD_UP);
        if (Math.abs(direction.dot(normal)) > 0.92) {
            normal.copy(WORLD_RIGHT);
        }

        binormal.crossVectors(direction, normal).normalize();
        normal.crossVectors(binormal, direction).normalize();
    }

    dispose() {
        if (this.mesh?.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        this.mesh?.geometry?.dispose?.();
        this.mesh?.material?.dispose?.();
    }
}
