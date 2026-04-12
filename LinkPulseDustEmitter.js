import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const TMP_COLOR = new THREE.Color();
const TMP_DIRECTION = new THREE.Vector3();
const TMP_NORMAL = new THREE.Vector3();
const TMP_BINORMAL = new THREE.Vector3();
const TMP_OFFSET = new THREE.Vector3();
const TMP_EMIT_POS = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const SEGMENT_ANGLES = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];

const DUST_VS = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute vec3 aInfo;   // x: birthTime, y: duration, z: baseSize

uniform float uTime;

varying vec3 vColor;
varying float vAlpha;
varying float vLifeProgress;

void main() {
    float age = uTime - aInfo.x;

    if (age < 0.0 || age > aInfo.y) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        vAlpha = 0.0;
        return;
    }

    float lifeProgress = age / aInfo.y;
    vLifeProgress = lifeProgress;

    // Gentle drift with deceleration over lifetime
    float drift = age * (1.0 - lifeProgress * 0.25);
    vec3 currentPos = position + aVelocity * drift;

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Bell curve size: small birth → peak at ~35% → gentle shrink
    float sizeCurve = sin(lifeProgress * 3.14159) * 0.82 + 0.18;
    float size = aInfo.z * mix(1.0, 2.5, sizeCurve);

    // Subtle breathing pulse — unique phase per particle from birthTime
    float breath = 1.0 + sin(age * 7.5 + aInfo.x * 6.28) * 0.055;

    // Match LinkSparkSystem attenuation pattern exactly.
    gl_PointSize = size * breath * (10.0 / -mvPosition.z);

    // Richer fade: quick bright birth → sustained glow → graceful death
    float fadeIn = smoothstep(0.0, 0.055, age);
    float sustain = 1.0 - smoothstep(0.25, 0.85, lifeProgress);
    float fadeOut = smoothstep(1.0, 0.6, lifeProgress);

    vColor = aColor;
    // Evolve toward warmer luminous tones as particle ages
    vColor = mix(vColor, vColor + vec3(0.14, 0.09, 0.03), lifeProgress * 0.55);

    vAlpha = 0.88 * fadeIn * (0.35 + sustain * 0.65) * fadeOut;
}
`;

const DUST_FS = `
varying vec3 vColor;
varying float vAlpha;
varying float vLifeProgress;

void main() {
    if (vAlpha <= 0.002) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist2 = dot(coord, coord);
    if (dist2 > 0.25) discard;

    float dist = sqrt(dist2);

    // Multi-lobe glow: hot core + soft membrane + ethereal halo
    float core     = 1.0 - smoothstep(0.0,  0.10, dist);
    float membrane = 1.0 - smoothstep(0.04, 0.30, dist);
    float halo     = 1.0 - smoothstep(0.08, 0.50, dist);

    float glow = core * 0.52 + membrane * 0.32 + halo * 0.16;

    // Hot center shifts toward luminous white
    vec3 hotColor = vColor + vec3(core * 0.38, core * 0.30, core * 0.18);

    // Subtle shimmer — brightness micro-variation
    float shimmer = 1.0 + sin(vLifeProgress * 12.56 + dist * 20.0) * 0.035;

    gl_FragColor = vec4(hotColor * shimmer, vAlpha * glow);
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
            vertexColors: true,
            customProgramCacheKey: () => 'ATOMA_DUST_v2'
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
    constructor(maxParticles = 192) {
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
        this.mesh.matrixAutoUpdate = false;
        this.mesh.updateMatrix();
        this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PARTICLES');
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
        targetColor,
        spawnEnabled = true
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
        const emissionRate = lerp(64, 155, pulseBoost);
        this.spawnAccumulator += emissionRate * dt;

        let touched = false;
        while (spawnEnabled && this.spawnAccumulator >= 1.0) {
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

        const isHero = Math.random() < 0.12;
        const speedMul = isHero ? 1.45 : 1.0;
        const backwardSpeed = (0.14 + Math.random() * 0.16) * speedMul;
        const outwardSpeed = (0.05 + Math.random() * 0.12) * speedMul;
        const swirl = (Math.random() - 0.5) * 0.08;

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
        TMP_COLOR.offsetHSL(
            (Math.random() - 0.5) * 0.04,
            -0.22 + (Math.random() - 0.5) * 0.06,
            0.08 + Math.random() * 0.06
        );

        this.colors[i3] = TMP_COLOR.r;
        this.colors[i3 + 1] = TMP_COLOR.g;
        this.colors[i3 + 2] = TMP_COLOR.b;

        this.infos[i3] = this.time;
        this.infos[i3 + 1] = (isHero ? 1.5 : 1.0) * (1.2 + Math.random() * 0.6);
        this.infos[i3 + 2] = (isHero ? 1.5 : 1.0) * (7.2 + Math.random() * 6.8);

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
