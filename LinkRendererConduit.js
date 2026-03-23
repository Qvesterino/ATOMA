import * as THREE from 'three';
import { debugWarn } from './Engine/Debug/DebugLog.js';
import { TransparentStateAuthority } from './TransparentStateAuthority.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';
import { LinkBeadVisualizer } from './LinkBeadSystem.js';
import { LinkSparkSystem } from './LinkSparkSystem.js';
import { LinkBeadTrailSystem } from './LinkBeadTrailSystem.js';
import { LinkEnergyRingSystem } from './LinkEnergyRingSystem.js';
import { LinkPulseRing } from './LinkPulseRing.js';
import { LinkPulseDustEmitter } from './LinkPulseDustEmitter.js';
import { LinkEnergyWave } from './LinkEnergyWave.js';
import { LinkRingArcDischarges } from './LinkRingArcDischarges.js';
import { LinkVisualStateAdapter } from './LinkVisualStateAdapter.js';
import { NodeInterferenceManager } from './NodeInterferenceManager.js';
import { NodeHarmonicManager } from './NodeHarmonicManager.js';
import { LinkDirectionalStreaks } from './LinkDirectionalStreaks.js';
import { LinkCorruptionSpreadAnimator } from './LinkCorruptionSpreadAnimator.js';
import { LinkCorruptionParticleSystem } from './LinkCorruptionParticleSystem.js';
import { LinkCorruptionMorphingSystem } from './LinkCorruptionMorphingSystem.js';
import { TIER4_CorruptionFeedbackVisuals } from './TIER4_CorruptionFeedbackVisuals_v1.js';
import { createLinkAuraMaterial, createLinkAuraGeometry } from './shaders/LinkAuraShader.js';
import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';
import { linkStateVertexShaderSimple, linkStateFragmentShaderSimple } from './shaders/LinkStateVisualLanguage.js';
import { LinkTrailParticleSystem, LinkTrailEmitter } from './LinkTrailParticleSystem.js';
import { LinkHealingParticleSystem, LinkHealingEmitter } from './LinkHealingParticleSystem.js';
import { LinkExtensionConfig } from './LinkExtensionConfig.js';
import { ImpactManagerCollection } from './NodeImpactManager.js';
import { WaveTravelShaderPack_v1 } from './WaveTravelShaderPack_v1.js';
import VisualTime from './src/time/VisualTime.js';
import { LinkSemanticPictogramSystem_Enhanced } from './LinkSemanticPictogramSystem_Enhanced.js';

if (typeof window !== 'undefined' && !window.__PicDiagConduitModuleLoaded__) {
    console.info('[PicDiag] LinkRendererConduit module loaded');
    window.__PicDiagConduitModuleLoaded__ = true;
}

function computeSegmentsFromLength(curve, density = 8, minSeg = 12, maxSeg = 200) {
    if (!curve?.getLength) return minSeg;
    const length = curve.getLength();
    const segments = Math.floor(length * density);
    return Math.max(minSeg, Math.min(maxSeg, segments));
}

// Utility helpers (no allocations)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const remap = (v, in0, in1, out0, out1) => {
    if (in1 === in0) return out0;
    const t = clamp01((v - in0) / (in1 - in0));
    return out0 + (out1 - out0) * t;
};
const FORCE_VISUAL_DEBUG = true;
const COLOR_WHITE = new THREE.Color(0xffffff);
const STRAND_FILAMENT_STYLE = {
    ENABLED: true,
    COUNT_PER_STRAND: 20,
    BASE_OPACITY: 0.28,
    RADIAL_PUSH: 1.1,
    LENGTH_SCALE: 1.55,
    SWAY_SPEED: 3.1,
    SWAY_AMOUNT: 0.58,
    TRAVEL_SPEED: 0.048,
    DETACH_SPEED: 2.2,
    DETACH_BOOST: 0.18,
    FLOW_LEAN: 1.18,
    RADIAL_LEAN: 0.38,
    BRIDGE_SHARE: 0.34,
    BRIDGE_FORWARD: 0.12,
    BRIDGE_TWIST: 1.18,
    BRIDGE_CLING: 1.0,
    BRIDGE_CURVE: 0.52,
    BRIDGE_HOP_SPEED: 1.35,
    MICRO_JUMP_SHARE: 0.12,
    MICRO_JUMP_CURVE: 0.74,
    MICRO_JUMP_SPEED: 4.6
};
const WAVE_SPARK_GLYPH = {
    SLIVER: 0,
    NOTCH: 1,
    RUNE: 2,
    EMBER: 3
};
const WAVE_SPARK_RATIOS = {
    default: [0.52, 0.22, 0.16, 0.10],
    tipDetach: [0.45, 0.10, 0.10, 0.35],
    microJump: [0.30, 0.25, 0.40, 0.05],
    bridgeContact: [0.25, 0.40, 0.30, 0.05]
};
const WAVE_SPARK_PROFILE = [
    { lifeMin: 0.18, lifeMax: 0.32, sizeMin: 7.0, sizeMax: 13.0, speedMin: 0.95, speedMax: 1.45, spinMin: -1.2, spinMax: 1.2, gainMin: 0.55, gainMax: 0.85, accentMix: 0.20, hotMix: 0.10 },
    { lifeMin: 0.22, lifeMax: 0.38, sizeMin: 8.0, sizeMax: 14.0, speedMin: 0.72, speedMax: 1.08, spinMin: -1.8, spinMax: 1.8, gainMin: 0.42, gainMax: 0.70, accentMix: 0.45, hotMix: 0.10 },
    { lifeMin: 0.14, lifeMax: 0.26, sizeMin: 9.0, sizeMax: 16.0, speedMin: 0.82, speedMax: 1.20, spinMin: -2.1, spinMax: 2.1, gainMin: 0.48, gainMax: 0.78, accentMix: 0.50, hotMix: 0.15 },
    { lifeMin: 0.09, lifeMax: 0.18, sizeMin: 6.0, sizeMax: 11.0, speedMin: 1.15, speedMax: 1.85, spinMin: -2.8, spinMax: 2.8, gainMin: 0.65, gainMax: 1.0, accentMix: 0.15, hotMix: 0.60 }
];
const weightedPickIndex = (weights) => {
    let total = 0;
    for (let i = 0; i < weights.length; i += 1) total += Math.max(0, weights[i] || 0);
    if (total <= 0) return 0;
    let cursor = Math.random() * total;
    for (let i = 0; i < weights.length; i += 1) {
        cursor -= Math.max(0, weights[i] || 0);
        if (cursor <= 0) return i;
    }
    return Math.max(0, weights.length - 1);
};
const randRange = (min, max) => min + Math.random() * (max - min);
const strandSparkVertexShader = `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aShape;
    attribute float aAngle;
    attribute float aSpin;
    attribute float aBirth;
    attribute float aDuration;
    attribute float aGain;

    uniform float uTime;
    uniform float uGlobalOpacity;

    varying vec3 vColor;
    varying float vShape;
    varying float vAge;
    varying float vAngle;
    varying float vGain;

    void main() {
        float duration = max(0.0001, aDuration);
        float age = (uTime - aBirth) / duration;
        vAge = age;
        vColor = aColor;
        vShape = aShape;
        vAngle = aAngle + (uTime - aBirth) * aSpin;
        vGain = aGain * uGlobalOpacity;

        if (age < 0.0 || age > 1.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            return;
        }

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        // Match LinkSparkSystem attenuation pattern exactly.
        gl_PointSize = aSize * (10.0 / -mvPosition.z);
    }
`;
const strandSparkFragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vShape;
    varying float vAge;
    varying float vAngle;
    varying float vGain;

    vec2 rot(vec2 p, float a) {
        float c = cos(a);
        float s = sin(a);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    }

    float shapeSliver(vec2 p) {
        float body = 1.0 - smoothstep(0.22, 0.48, abs(p.y) + abs(p.x) * 0.24);
        float core = 1.0 - smoothstep(0.06, 0.16, abs(p.y));
        return clamp(body * 0.75 + core * 0.25, 0.0, 1.0);
    }

    float shapeNotch(vec2 p) {
        float segA = 1.0 - smoothstep(0.10, 0.24, abs(p.y + 0.22));
        segA *= smoothstep(0.05, 0.44, abs(p.x));
        float segB = 1.0 - smoothstep(0.10, 0.24, abs(p.y - 0.18));
        segB *= smoothstep(0.05, 0.34, abs(p.x + 0.10));
        return clamp(max(segA, segB), 0.0, 1.0);
    }

    float shapeRune(vec2 p) {
        float r = length(p);
        float ringOuter = 1.0 - smoothstep(0.64, 0.84, r);
        float ringInner = smoothstep(0.32, 0.50, r);
        float ring = ringOuter * ringInner;
        float gap = smoothstep(-0.10, 0.24, p.x);
        float shard = 1.0 - smoothstep(0.12, 0.28, length(p - vec2(0.34, 0.0)));
        return clamp(ring * gap + shard * 0.5, 0.0, 1.0);
    }

    float shapeEmber(vec2 p) {
        float dia = 1.0 - smoothstep(0.52, 0.78, abs(p.x) + abs(p.y));
        float tail = 1.0 - smoothstep(0.10, 0.24, length(p - vec2(-0.24, 0.0)));
        return clamp(max(dia, tail * 0.75), 0.0, 1.0);
    }

    void main() {
        if (vAge < 0.0 || vAge > 1.0 || vGain <= 0.001) discard;

        vec2 p = gl_PointCoord * 2.0 - 1.0;
        p = rot(p, vAngle);

        float shape = 0.0;
        if (vShape < 0.5) {
            shape = shapeSliver(p);
        } else if (vShape < 1.5) {
            shape = shapeNotch(p);
        } else if (vShape < 2.5) {
            shape = shapeRune(p);
        } else {
            shape = shapeEmber(p);
        }

        float fadeIn = smoothstep(0.0, 0.09, vAge);
        float fadeOut = 1.0 - smoothstep(0.68, 1.0, vAge);
        float core = 1.0 - smoothstep(0.0, 0.62, length(p));
        float flicker = 0.88 + 0.12 * sin((1.0 - vAge) * 29.0 + vShape * 7.7 + p.x * 5.0);
        float alpha = shape * fadeIn * fadeOut * vGain * flicker;
        if (alpha < 0.01) discard;

        vec3 color = vColor + vec3(core * 0.32);
        gl_FragColor = vec4(color, alpha);
    }
`;
const hashString32 = (value = '') => {
    const text = String(value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};
const seededNoise = (seed) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

// Lightweight dock spray system (per-link, instanced points)
function createDockSpraySystem(scene, renderOrder = 0, maxParticles = 48) {
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const life = new Float32Array(maxParticles * 2); // birth, duration

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(life, 2));
    geometry.attributes.position.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aVelocity.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aLife.usage = THREE.DynamicDrawUsage;

    const vertexShader = `
        attribute vec3 aVelocity;
        attribute vec2 aLife;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            float age = uTime - aLife.x;
            if (age < 0.0 || age > aLife.y) {
                vAlpha = 0.0;
                gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                return;
            }
            float t = age / aLife.y;
            vec3 pos = position + aVelocity * age;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // True perspective attenuation: no minimum screen-space floor.
            gl_PointSize = clamp(80.0 * (1.0 - t) / -mvPosition.z, 1.0, 20.0);
            vColor = uColor;
            vAlpha = 0.8 * (1.0 - t);
        }
    `;

    const fragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            if (vAlpha <= 0.01) discard;
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.3, 0.5, d);
            gl_FragColor = vec4(vColor, vAlpha * glow);
        }
    `;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffffff) }
        }
    });

    const mesh = new THREE.Points(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;

    const randRange = (min, max) => min + Math.random() * (max - min);
    const randomUnit = () => {
        const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (v.lengthSq() < 1e-4) v.set(0, 0, 1);
        return v.normalize();
    };

    let writeIndex = 0;

    function spawnBurst(origin, surfaceDir, color, time = 0) {
        // Sync time so freshly spawned particles start at age 0
        material.uniforms.uTime.value = time;
        const count = Math.min(40, maxParticles);
        if (color) material.uniforms.uColor.value.copy(color);
        for (let i = 0; i < count; i++) {
            const idx = writeIndex;
            const i3 = idx * 3;
            // Spawn with slight positional jitter to widen spray footprint
            const jitterDir = randomUnit();
            const jitterMag = randRange(0, 0.12);
            positions[i3] = origin.x + jitterDir.x * jitterMag;
            positions[i3 + 1] = origin.y + jitterDir.y * jitterMag;
            positions[i3 + 2] = origin.z + jitterDir.z * jitterMag;

            const dir = randomUnit().lerp(surfaceDir, 0.6).normalize();
            const speed = randRange(0.6, 1.4);
            velocities[i3] = dir.x * speed;
            velocities[i3 + 1] = dir.y * speed;
            velocities[i3 + 2] = dir.z * speed;

            const i2 = idx * 2;
            life[i2] = material.uniforms.uTime.value;
            life[i2 + 1] = 0.45;

            writeIndex = (writeIndex + 1) % maxParticles;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aVelocity.needsUpdate = true;
        geometry.attributes.aLife.needsUpdate = true;
    }

    function update(time) {
        material.uniforms.uTime.value = time;
    }

    function dispose() {
        if (mesh.parent) mesh.parent.remove(mesh);
        geometry.dispose();
        material.dispose();
    }

    return { mesh, spawnBurst, update, dispose };
}

function createSourceInjectionSystem(scene, renderOrder = 0, maxParticles = 28) {
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const radialBasis = new Float32Array(maxParticles * 3);
    const swirlBasis = new Float32Array(maxParticles * 3);
    const params = new Float32Array(maxParticles * 4); // startRadius, endRadius, angularSpeed, phase
    const life = new Float32Array(maxParticles * 2); // birth, duration

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aRadialBasis', new THREE.BufferAttribute(radialBasis, 3));
    geometry.setAttribute('aSwirlBasis', new THREE.BufferAttribute(swirlBasis, 3));
    geometry.setAttribute('aParams', new THREE.BufferAttribute(params, 4));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(life, 2));
    geometry.attributes.position.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aVelocity.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aRadialBasis.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aSwirlBasis.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aParams.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aLife.usage = THREE.DynamicDrawUsage;

    const vertexShader = `
        attribute vec3 aVelocity;
        attribute vec3 aRadialBasis;
        attribute vec3 aSwirlBasis;
        attribute vec4 aParams;
        attribute vec2 aLife;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            float age = uTime - aLife.x;
            if (age < 0.0 || age > aLife.y) {
                vAlpha = 0.0;
                gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                return;
            }
            float t = age / aLife.y;
            float radius = mix(aParams.x, aParams.y, t);
            float theta = aParams.w + aParams.z * age;
            float intakeFade = smoothstep(aParams.y + 0.006, aParams.y + 0.065, radius);
            vec3 orbitDir = normalize(
                aRadialBasis * cos(theta) +
                aSwirlBasis * sin(theta)
            );
            vec3 pos = position + aVelocity * age + orbitDir * radius;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = clamp(72.0 * (1.0 - t * 0.58) / -mvPosition.z, 1.2, 14.0);
            vColor = uColor;
            vAlpha = 0.65 * (1.0 - t) * mix(0.12, 1.0, intakeFade);
        }
    `;

    const fragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            if (vAlpha <= 0.01) discard;
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.12, 0.5, d);
            gl_FragColor = vec4(vColor, vAlpha * glow);
        }
    `;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffffff) }
        }
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = renderOrder;

    const vortex = new THREE.Group();
    vortex.renderOrder = renderOrder;
    const fieldRoot = new THREE.Group();
    vortex.add(fieldRoot);

    const haloOuterMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const haloInnerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.095,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const vaneMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.075,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const fieldMaterials = [haloOuterMaterial, haloInnerMaterial, vaneMaterial];

    const haloOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.26, 0.30, 20, 1, true),
        haloOuterMaterial
    );
    haloOuter.rotation.x = Math.PI * 0.5;
    haloOuter.position.z = -0.025;
    haloOuter.scale.set(1.0, 0.88, 1.0);
    fieldRoot.add(haloOuter);

    const haloInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.19, 0.22, 18, 1, true),
        haloInnerMaterial
    );
    haloInner.rotation.x = Math.PI * 0.5;
    haloInner.position.z = 0.02;
    haloInner.scale.set(1.0, 0.82, 1.0);
    fieldRoot.add(haloInner);

    const haloRing = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.19, 28),
        haloOuterMaterial.clone()
    );
    haloRing.material.opacity = 0.032;
    haloRing.position.z = -0.01;
    fieldMaterials.push(haloRing.material);
    fieldRoot.add(haloRing);

    const vanePivots = [];
    for (let i = 0; i < 4; i++) {
        const pivot = new THREE.Group();
        pivot.userData.baseAngle = (i / 4) * Math.PI * 2;
        pivot.rotation.z = pivot.userData.baseAngle;
        const vane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.028, 0.18, 1, 1),
            vaneMaterial
        );
        vane.position.x = 0.11;
        vane.position.z = 0.03;
        vane.rotation.y = Math.PI * 0.5;
        vane.rotation.z = 0.22;
        vane.scale.set(1.0, 1.0 - i * 0.08, 1.0);
        pivot.add(vane);
        vanePivots.push(pivot);
        fieldRoot.add(pivot);
    }

    const randRange = (min, max) => min + Math.random() * (max - min);
    const tangent = new THREE.Vector3();
    const bitangent = new THREE.Vector3();
    const radialDir = new THREE.Vector3();
    const swirlDir = new THREE.Vector3();
    let writeIndex = 0;

    function spawnBurst(origin, forward, color, time = 0) {
        material.uniforms.uTime.value = time;
        if (color) {
            material.uniforms.uColor.value.copy(color);
            fieldMaterials.forEach((mat) => mat.color.copy(color));
        }

        const dir = forward.clone().normalize();
        const upSeed = Math.abs(dir.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        tangent.crossVectors(dir, upSeed).normalize();
        bitangent.crossVectors(dir, tangent).normalize();

        const endRadius = 0.014;
        const count = Math.min(18, maxParticles);
        for (let i = 0; i < count; i++) {
            const idx = writeIndex;
            const i3 = idx * 3;
            const i4 = idx * 4;
            const angle = (i / count) * Math.PI * 2 + randRange(-0.26, 0.26);
            const startRadius = randRange(0.11, 0.24);
            const axialOffset = randRange(-0.12, 0.02);
            const lifetime = randRange(0.22, 0.34);
            const forwardSpeed = randRange(1.0, 1.75);
            const angularSpeed = randRange(10.0, 18.0) * (Math.random() < 0.5 ? -1 : 1);

            radialDir.copy(tangent).multiplyScalar(Math.cos(angle));
            radialDir.addScaledVector(bitangent, Math.sin(angle)).normalize();
            swirlDir.crossVectors(dir, radialDir).normalize();

            positions[i3] = origin.x + dir.x * axialOffset;
            positions[i3 + 1] = origin.y + dir.y * axialOffset;
            positions[i3 + 2] = origin.z + dir.z * axialOffset;

            velocities[i3] = dir.x * forwardSpeed;
            velocities[i3 + 1] = dir.y * forwardSpeed;
            velocities[i3 + 2] = dir.z * forwardSpeed;

            radialBasis[i3] = radialDir.x;
            radialBasis[i3 + 1] = radialDir.y;
            radialBasis[i3 + 2] = radialDir.z;

            swirlBasis[i3] = swirlDir.x;
            swirlBasis[i3 + 1] = swirlDir.y;
            swirlBasis[i3 + 2] = swirlDir.z;

            params[i4] = startRadius;
            params[i4 + 1] = endRadius;
            params[i4 + 2] = angularSpeed;
            params[i4 + 3] = angle;

            const i2 = idx * 2;
            life[i2] = time;
            life[i2 + 1] = lifetime;

            writeIndex = (writeIndex + 1) % maxParticles;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aVelocity.needsUpdate = true;
        geometry.attributes.aRadialBasis.needsUpdate = true;
        geometry.attributes.aSwirlBasis.needsUpdate = true;
        geometry.attributes.aParams.needsUpdate = true;
        geometry.attributes.aLife.needsUpdate = true;
    }

    function update(time, origin = null, forward = null, flow = 0) {
        material.uniforms.uTime.value = time;
        const flowBoost = THREE.MathUtils.clamp(flow, 0, 1);
        const pulse = 1.0 + Math.sin(time * 2.6) * 0.06 + flowBoost * 0.025;
        fieldRoot.scale.setScalar(pulse);
        fieldRoot.rotation.set(0, 0, time * (0.55 + flowBoost * 0.08));
        const flowOpacity = 0.9 + flowBoost * 0.28;
        haloOuter.material.opacity = (0.042 + (Math.sin(time * 2.1) * 0.5 + 0.5) * 0.022) * flowOpacity;
        haloInner.material.opacity = (0.068 + (Math.sin(time * 2.8 + 0.9) * 0.5 + 0.5) * 0.03) * flowOpacity;
        haloRing.material.opacity = (0.02 + (Math.sin(time * 2.3 + 1.4) * 0.5 + 0.5) * 0.014) * flowOpacity;
        vanePivots.forEach((pivot, index) => {
            pivot.rotation.z = pivot.userData.baseAngle + Math.sin(time * 1.8 + index * 0.7) * 0.07;
        });
        if (origin) vortex.position.copy(origin);
        if (forward) {
            const dir = forward.clone().normalize();
            if (dir.lengthSq() > 0) {
                vortex.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
            }
        }
    }

    function dispose() {
        if (points.parent) points.parent.remove(points);
        if (vortex.parent) vortex.parent.remove(vortex);
        geometry.dispose();
        material.dispose();
        const geoSet = new Set();
        const materialSet = new Set();
        vortex.traverse((obj) => {
            if (obj?.geometry) geoSet.add(obj.geometry);
            if (obj?.material) materialSet.add(obj.material);
        });
        geoSet.forEach((geo) => geo?.dispose?.());
        materialSet.forEach((mat) => mat?.dispose?.());
    }

    return { points, vortex, spawnBurst, update, dispose };
}

const makeDebugId = (prefix = 'pic') => {
    const rand = Math.random().toString(36).slice(2, 6);
    const ts = Date.now().toString(36);
    return `${prefix}-${rand}-${ts}`;
};

const waveTravelPack = new WaveTravelShaderPack_v1({
    enableDebug: false,
    enableWarnings: true
});

// Merge and apply material patch in deterministic order
function applyMaterialPatch(material, patch = {}) {
    if (!material) return;
    const ownerTag = patch.owner || 'conduit';
    const ensureOwner = (prop) => {
        material.userData = material.userData || {};
        material.userData._propOwner = material.userData._propOwner || {};
        const current = material.userData._propOwner[prop];
        if (current && current !== ownerTag) {
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_MATERIAL_OWNER__ === true) {
                console.warn('[LinkMaterialOwner]', prop, 'current:', current, 'new:', ownerTag, material.uuid);
            }
        }
        material.userData._propOwner[prop] = material.userData._propOwner[prop] || ownerTag;
    };

    if (patch.color instanceof THREE.Color && material.color) {
        ensureOwner('color');
        material.color.copy(patch.color);
    }
    if (patch.emissive instanceof THREE.Color && material.emissive) {
        ensureOwner('emissive');
        material.emissive.copy(patch.emissive);
    }
    if (typeof patch.opacity === 'number' && material.opacity !== patch.opacity) {
        ensureOwner('opacity');
        material.opacity = patch.opacity;
    }
    if (typeof patch.emissiveIntensity === 'number' && material.emissiveIntensity !== undefined) {
        ensureOwner('emissiveIntensity');
        material.emissiveIntensity = patch.emissiveIntensity;
    }
    if (typeof patch.linewidth === 'number' && material.linewidth !== undefined) {
        ensureOwner('linewidth');
        material.linewidth = patch.linewidth;
    }
}

// Merge patches (last wins) for a mesh
function mergePatch(map, mesh, patch) {
    if (!mesh) return;
    const existing = map.get(mesh) || {};
    const merged = { ...existing, ...patch };
    map.set(mesh, merged);
}

const strandDetailOverlayVertexShader = `
    uniform float uNetworkStress;
    uniform float uLocalLoad;
    uniform float uCorruption;
    uniform float uTime;
    uniform vec3 uBaseColor;

    varying vec2 vUv;
    varying float vPulsePhase;
    varying float vCorruption;
    varying float vLocalLoad;
    varying vec3 vBaseColor;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vCorruption = uCorruption;
        vLocalLoad = uLocalLoad;
        vBaseColor = uBaseColor;
        vNormal = normalize(normalMatrix * normal);

        float freq = 2.0 + uLocalLoad * 6.0;
        vPulsePhase = sin(uTime * freq) * 0.5 + 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const strandDetailOverlayFragmentShader = `
    precision highp float;

    varying vec2 vUv;
    varying float vPulsePhase;
    varying float vCorruption;
    varying float vLocalLoad;
    varying vec3 vBaseColor;
    varying vec3 vNormal;
    uniform float uSegmentCount;

    void main() {
        float segmentCount = max(1.0, uSegmentCount);
        float seg = fract(vUv.x * segmentCount);
        float body = smoothstep(0.25, 0.45, seg) - smoothstep(0.55, 0.75, seg);
        float edgeGlow = smoothstep(0.20, 0.25, seg) - smoothstep(0.75, 0.80, seg);
        float capsule = body + edgeGlow * 0.6;

        // Keep capsules narrow and rounded across strand circumference.
        float y = abs(vUv.y - 0.5);
        float laneMask = 1.0 - smoothstep(0.16, 0.34, y);
        float rounded = 1.0 - smoothstep(0.10, 0.34, length(vec2((seg - 0.5) * 1.9, (vUv.y - 0.5) * 1.45)));
        capsule = clamp(capsule * laneMask + edgeGlow * rounded * 0.35, 0.0, 1.0);

        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vec3(0.3, 0.7, 0.6)))), 2.0);
        float pulse = 0.55 + vPulsePhase * 0.45;
        float metricBoost = 0.45 + vLocalLoad * 0.35 + vCorruption * 0.25;
        float overlayIntensity = pulse * metricBoost * (0.15 + rim * 0.10);
        float alpha = capsule * overlayIntensity;

        vec3 segColor = vec3(1.0);
        vec3 color = mix(vBaseColor * 0.78, segColor, 0.20 + vPulsePhase * 0.16);
        color += segColor * edgeGlow * 0.18;
        color += vec3(rim * 0.08);

        if (alpha < 0.01) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;

// Safe userData helper (avoids reassigning potentially frozen descriptor)
const ensureUserData = (obj) => {
    if (!obj) return {};
    if (!obj.userData) {
        Object.defineProperty(obj, 'userData', { value: {}, writable: true, configurable: true });
    }
    return obj.userData;
};

const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'blending',
    'depthWrite',
    'depthTest',
    'alphaTest'
];

const variantDebugEnabled = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_VARIANT_LOCK === true);

function isCoreNodeMesh(mesh) {
    return mesh?.userData?.isNodeCore === true ||
           mesh?.userData?.nodeId !== undefined;
}

function freezeMaterialFlags(material, owner = 'LinkRenderer') {
    if (!material) return;
    const ud = ensureUserData(material);
    ud.__frozenVariantProps = ud.__frozenVariantProps || new Set();
    ud.__warnedVariantProp = ud.__warnedVariantProp || new Set();

    VARIANT_CRITICAL_PROPS.forEach((prop) => {
        if (ud.__frozenVariantProps.has(prop)) return;

        const desc = Object.getOwnPropertyDescriptor(material, prop);
        if (desc && desc.configurable === false) {
            if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Prop already locked, skip redefine', prop, material.uuid);
                ud.__warnedVariantProp.add(prop);
            }
            ud.__frozenVariantProps.add(prop);
            return;
        }

        const cachedValue = material[prop];
        try {
            Object.defineProperty(material, prop, {
                configurable: true,
                enumerable: true,
                get() {
                    return cachedValue;
                },
                set(value) {
                    if (cachedValue === value) return;
                    if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                        console.error('[VariantLock]', prop, 'modified after lock');
                        ud.__warnedVariantProp.add(prop);
                    }
                }
            });
            ud.__frozenVariantProps.add(prop);
        } catch (err) {
            if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Failed to lock prop', prop, material.uuid, err?.message);
                ud.__warnedVariantProp.add(prop);
            }
        }
    });

    ud.__owner = ud.__owner || owner;
    ud.__flagsFrozen = true;
    material.__variantLocked = true; // backwards compatibility with existing checks
}

/**
 * BRAIDED SYNERGY ROPE LINK RENDERER
 * ============================================================================
 * Enforces a unified visual contract:
 * 1. Braided Rope Base (3-5 strands)
 * 2. Flow Carrier Effect (Pulse Ring)
 * 3. Unified Visual Consistency (No fallbacks)
 *
 * // Phase B.2: render state delegated to TransparentStateAuthority
 */
export class LinkRendererConduit {
    constructor(scene, linkingSystem = null, camera = null, parentGroup = null, frameScheduler = null) {
        this.scene = scene;
        this.linkSystem = linkingSystem;
        this.camera = camera;
        this.frameScheduler = frameScheduler;
        this.travelingWaveFX = null; // optional synergy traveling-wave shader patcher
        this.waveTravelShaderPack = waveTravelPack;
        this.waveSystem = this.waveTravelShaderPack;
        this.conduitRoot = new THREE.Group();
        this.conduitRoot.name = 'LinkRendererConduitRoot';
        (parentGroup || this.scene)?.add(this.conduitRoot);
        this._picDiagCount = 0;
        if (typeof window !== 'undefined') {
            console.info('[PicDiag] Conduit constructed');
            window.__ConduitRenderer__ = this;
        }
        this._nodeMetricCache = new Map();
        this._metricSubscriptionDisposer = null;
        this._hasMetricSubscription = false;
        this._initMetricSubscription();

        this.config = {
            baseRadius: 0.06,
            strandRadius: 0.034,
            twistSpacing: 2.0, // Units per full twist (normalized to link length)
            segments: 45,
 // +++++++ REPLACE
            radialSegments: 5,
            colorVariation: 0.15,
            breathingSpeed: 0.8,
            twistSpeed: 0.2,

            // Glow Skin (Ghostly Envelope)
            skinOpacity: 0.05,
            skinRadiusScale: 1.5
        };
 // +++++++ REPLACE

        // Central toggles for visual modules
        this.modules = {
            thickness: true,
            flow: true,
            beads: true,
            sparks: true,
            trails: true,
            corruptionFX: true,
            healingFX: true,
            streaks: true,
            aura: true,
            dissolve: true
        };

        // Reusable texture
        this.flowTexture = this.generateFlowTexture();

        // Math cache to reduce allocations
        this._vec3 = new THREE.Vector3();
        this._pulseDustWorldPos = new THREE.Vector3();

        // Node interference management (visual only)
        this.nodeInterferenceManager = new NodeInterferenceManager(scene);

        // Harmonic synchronization management (visual only)
        this.nodeHarmonicManager = new NodeHarmonicManager(scene);
        this.harmonicManager = this.nodeHarmonicManager;

        // Directional energy streaks system (visual only)
        this.directionalStreaks = new LinkDirectionalStreaks(scene);

        // Corruption spread animation system (visual only)
        this.corruptionSpreadAnimator = new LinkCorruptionSpreadAnimator();
        this.corruptionAnimator = this.corruptionSpreadAnimator; // backward compat

        // Corruption particle system (visual only)
        this.corruptionParticleSystem = new LinkCorruptionParticleSystem(scene);
        this.corruptionParticles = this.corruptionParticleSystem; // backward compat

        // Corruption morphing system (visual deformation)
        this.corruptionMorphing = new LinkCorruptionMorphingSystem();
        this.morphSystem = this.corruptionMorphing;

        // Tier 4 corruption feedback visuals (idle until events wired)
        this.corruptionFeedbackVisuals = new TIER4_CorruptionFeedbackVisuals(scene, {
            enableDebug: false
        });
        this.corruptionFeedbackVisuals.frameScheduler = this.frameScheduler;
        // 10 Hz threshold-trigger state (link + node crossings)
        this._corruptionFeedbackLinkState = new Map();
        this._corruptionFeedbackNodeState = new Map();
        this._corruptionFeedbackThresholds = {
            linkSeed: 0.22,
            linkSeedReset: 0.14,
            linkCascade: 0.5,
            linkCascadeReset: 0.36,
            linkRecovery: 0.12,
            linkRecoveryFrom: 0.24,
            nodeSeed: 0.35,
            nodeSeedReset: 0.24,
            nodeCascade: 0.62,
            nodeCascadeReset: 0.45,
            nodeRecovery: 0.2,
            nodeRecoveryFrom: 0.32,
            pulseCooldownMs: 900
        };

        // Trail particle system (visual only) - uses same noise as aura systems
        this.trailParticles = new LinkTrailParticleSystem(scene, 300);
        this.trailParticles.registerTrailSource?.('corruption', {
            emissionScale: 1.0,
            lifetime: 1.25,
            maxActive: 170
        });
        this.trailParticles.registerTrailSource?.('healing', {
            emissionScale: 0.8,
            lifetime: 1.05,
            maxActive: 95
        });
        this.trailParticles.registerTrailSource?.('spark', {
            emissionScale: 0.55,
            lifetime: 0.75,
            maxActive: 70
        });
        this.sharedTrailRates = {
            corruption: 22,
            healing: 16,
            spark: 14
        };

        // Trail emitters per link
        this.trailEmitters = new Map();

        // Healing particle system (visual only) - reverse flow, harmony-driven
        this.healingParticles = new LinkHealingParticleSystem(scene, 250);
        this.linkHealingParticles = this.healingParticles; // alias for clarity

        // Healing emitters per link
        this.healingEmitters = new Map();

        // Particle impact manager (for visual feedback when particles reach nodes)
        this.impactManager = new ImpactManagerCollection();

        // Cadence accumulators and LOD settings
        this._acc30 = 0; // ~30 Hz bucket
        this._acc10 = 0; // ~10 Hz bucket
        this.maxHeavyLinks = 8;
        this.heavyDistance = 60;

        // Semantic pictograms (global pool, attached to conduit root)
        this.pictogramSystem = new LinkSemanticPictogramSystem_Enhanced(
            scene,
            this.linkSystem,
            this.camera,
            this.conduitRoot
        );
        // Ensure pictograms stay enabled when driven by FrameScheduler
        this.pictogramSystem.enable?.();
        this.pictogramSystem.__debugId = this.pictogramSystem.__debugId || makeDebugId('pictos');
        // Ensure pictogram system always uses live linkSystem (in case linkSystem is swapped later)
        this.pictogramSystem.linkingSystem = this.linkSystem;

        if (typeof window !== 'undefined') {
            if (window.__PIC_SYSTEM__ && window.__PIC_SYSTEM__ !== this.pictogramSystem) {
                if (!window.__PIC_SYSTEM_OVERWRITE_WARNED__) {
                    console.warn('[PicDiag] __PIC_SYSTEM__ overwritten (new conduit instance)');
                    window.__PIC_SYSTEM_OVERWRITE_WARNED__ = true;
                }
            }
            window.__PIC_SYSTEM__ = this.pictogramSystem;
            window.__CONDUIT__ = this;
        }

        // Dissolve effects (link removal bursts)
        this._dissolveEffects = [];

        // Setup particle arrival callbacks
        this._setupParticleCallbacks();

        // Optional synergy traveling-wave shader adapter (set externally)
        this.travelingWaveFX = this.travelingWaveFX || null;

        // Cached VFX input (reused each frame)
        this._vfxInput = {
            baseIntensity: 0.2,
            beadsIntensity: 0.1,
            sparksIntensity: 0.05,
            widthMul: 1.0,
            speedMul: 1.0,
            colorBias: 0.0
        };
        this._lastVfxDebugTime = 0;

        // Impact material pool (colorHex -> stack of materials)
        this._impactMaterialPool = new Map();
        this._impactPoolMaxSize = 20;

        // Link State Visual Language Integration
        this.linkStateVisualLanguage = null;
    }

    _beginStrandOwnershipFrame(state, metrics, visualTime) {
        const ownerState = state.__strandOwnerState || (state.__strandOwnerState = {
            frame: 0,
            claims: { colorEmissive: null, opacity: null, uLocalLoad: null },
            trace: { colorEmissive: 'none', opacity: 'none', uLocalLoad: 'none' },
            previousCorruption: 0,
            corruptionOverrideUntil: 0,
            corruptionOverrideActive: false,
            corruptionDampen: 1.0
        });

        ownerState.frame += 1;
        ownerState.claims.colorEmissive = null;
        ownerState.claims.opacity = null;
        ownerState.claims.uLocalLoad = null;
        ownerState.trace.colorEmissive = 'none';
        ownerState.trace.opacity = 'none';
        ownerState.trace.uLocalLoad = 'none';

        const corruption = Math.max(0, Math.min(1, metrics?.corruption ?? 0));
        const prev = Number.isFinite(ownerState.previousCorruption) ? ownerState.previousCorruption : corruption;
        const delta = corruption - prev;
        const threshold = 0.04;
        const overrideWindowSec = 0.45;

        if (delta > threshold) {
            ownerState.corruptionOverrideUntil = visualTime + overrideWindowSec;
        }
        ownerState.previousCorruption = corruption;
        ownerState.corruptionOverrideActive = visualTime < (ownerState.corruptionOverrideUntil || 0);
        ownerState.corruptionDampen = ownerState.corruptionOverrideActive ? 0.5 : 1.0;

        // Reset per-frame corruption color lock; animator can assert it again this frame.
        if (Array.isArray(state.strands)) {
            for (const strand of state.strands) {
                const mat = strand?.material;
                if (!mat) continue;
                mat.userData = mat.userData || {};
                mat.userData.__colorLockedByCorruption = false;
            }
        }

        return ownerState;
    }

    _disposeStrandFilaments(state) {
        if (!state?.strandFilaments) return;
        const filamentState = state.strandFilaments;
        if (filamentState.mesh?.parent) {
            filamentState.mesh.parent.remove(filamentState.mesh);
        }
        if (filamentState.sparkMesh?.parent) {
            filamentState.sparkMesh.parent.remove(filamentState.sparkMesh);
        }
        filamentState.geometry?.dispose?.();
        filamentState.material?.dispose?.();
        filamentState.sparkGeometry?.dispose?.();
        filamentState.sparkMaterial?.dispose?.();
        state.strandFilaments = null;
    }

    _ensureStrandFilaments(link, state) {
        if (!STRAND_FILAMENT_STYLE.ENABLED || !state) return null;
        const strands = Array.isArray(state.strands) ? state.strands : [];
        if (!strands.length) return null;

        const strandCount = Math.max(1, state.strandCount || strands.length || 1);
        const countPerStrand = Math.max(4, STRAND_FILAMENT_STYLE.COUNT_PER_STRAND | 0);
        const sampleCount = strandCount * countPerStrand;

        if (state.strandFilaments && state.strandFilaments.sampleCount !== sampleCount) {
            this._disposeStrandFilaments(state);
        }
        if (state.strandFilaments) {
            return state.strandFilaments;
        }

        // Two line segments per filament (start->mid, mid->end) to fake curved bridges.
        const positions = new Float32Array(sampleCount * 12);
        const colors = new Float32Array(sampleCount * 12);
        const rootT = new Float32Array(sampleCount);
        const phase = new Float32Array(sampleCount);
        const lengthScale = new Float32Array(sampleCount);
        const strandSlot = new Uint8Array(sampleCount);
        const driftSign = new Float32Array(sampleCount);
        const filamentVariant = new Uint8Array(sampleCount); // 0=flow hair, 1=surface bridge, 2=micro jump
        const bridgeForward = new Float32Array(sampleCount);
        const bridgeTwist = new Float32Array(sampleCount);
        const bridgeNeighborSign = new Int8Array(sampleCount);

        const seedBase = hashString32(link?.id || link?.uuid || `link-filaments-${sampleCount}`);
        let cursor = 0;
        for (let strandIndex = 0; strandIndex < strandCount; strandIndex += 1) {
            for (let j = 0; j < countPerStrand; j += 1) {
                const seed = seedBase + strandIndex * 131 + j * 17;
                rootT[cursor] = clamp01((j + seededNoise(seed * 0.13)) / countPerStrand);
                phase[cursor] = seededNoise(seed * 0.31) * Math.PI * 2.0;
                lengthScale[cursor] = 0.55 + seededNoise(seed * 0.71) * 0.95;
                strandSlot[cursor] = strandIndex;
                driftSign[cursor] = seededNoise(seed * 1.13) > 0.5 ? 1.0 : -1.0;
                const variantSeed = seededNoise(seed * 1.47);
                if (variantSeed < STRAND_FILAMENT_STYLE.BRIDGE_SHARE) {
                    filamentVariant[cursor] = 1;
                } else if (variantSeed < STRAND_FILAMENT_STYLE.BRIDGE_SHARE + STRAND_FILAMENT_STYLE.MICRO_JUMP_SHARE) {
                    filamentVariant[cursor] = 2;
                } else {
                    filamentVariant[cursor] = 0;
                }
                bridgeForward[cursor] = 0.018 + seededNoise(seed * 1.81) * STRAND_FILAMENT_STYLE.BRIDGE_FORWARD;
                bridgeTwist[cursor] = (0.22 + seededNoise(seed * 2.07) * STRAND_FILAMENT_STYLE.BRIDGE_TWIST) *
                    (seededNoise(seed * 2.51) > 0.5 ? 1.0 : -1.0);
                bridgeNeighborSign[cursor] = seededNoise(seed * 2.83) > 0.5 ? 1 : -1;
                cursor += 1;
            }
        }

        const geometry = new THREE.BufferGeometry();
        const positionAttr = new THREE.BufferAttribute(positions, 3);
        const colorAttr = new THREE.BufferAttribute(colors, 3);
        positionAttr.setUsage(THREE.DynamicDrawUsage);
        colorAttr.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', positionAttr);
        geometry.setAttribute('color', colorAttr);
        geometry.computeBoundingSphere();

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: STRAND_FILAMENT_STYLE.BASE_OPACITY,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });
        material.toneMapped = false;
        const filamentMesh = new THREE.LineSegments(geometry, material);
        filamentMesh.frustumCulled = false;
        filamentMesh.raycast = () => null;
        applyLinkRenderLayer(filamentMesh, 'LINK_STRANDS');
        Object.assign(ensureUserData(filamentMesh), { isStrandFilaments: true });

        const parent = link?.group || strands[0]?.parent || null;
        if (parent) {
            parent.add(filamentMesh);
        }

        const sparkMax = Math.max(18, Math.min(96, sampleCount));
        const sparkPositions = new Float32Array(sparkMax * 3);
        const sparkOrigin = new Float32Array(sparkMax * 3);
        const sparkVelocity = new Float32Array(sparkMax * 3);
        const sparkDrift = new Float32Array(sparkMax * 3);
        const sparkBirth = new Float32Array(sparkMax);
        const sparkDuration = new Float32Array(sparkMax);
        const sparkShape = new Float32Array(sparkMax);
        const sparkSize = new Float32Array(sparkMax);
        const sparkAngle = new Float32Array(sparkMax);
        const sparkSpin = new Float32Array(sparkMax);
        const sparkGain = new Float32Array(sparkMax);
        const sparkColor = new Float32Array(sparkMax * 3);
        const sparkPhase = new Float32Array(sparkMax);
        sparkBirth.fill(-1);
        for (let i = 0; i < sparkMax; i += 1) {
            const s = i * 3;
            sparkPositions[s] = 1e6;
            sparkPositions[s + 1] = 1e6;
            sparkPositions[s + 2] = 1e6;
            sparkShape[i] = WAVE_SPARK_GLYPH.SLIVER;
            sparkSize[i] = 0.0;
            sparkGain[i] = 0.0;
            sparkDuration[i] = 0.001;
            sparkColor[s] = 1.0;
            sparkColor[s + 1] = 1.0;
            sparkColor[s + 2] = 1.0;
        }

        const sparkGeometry = new THREE.BufferGeometry();
        const sparkPositionAttr = new THREE.BufferAttribute(sparkPositions, 3);
        const sparkColorAttr = new THREE.BufferAttribute(sparkColor, 3);
        const sparkShapeAttr = new THREE.BufferAttribute(sparkShape, 1);
        const sparkSizeAttr = new THREE.BufferAttribute(sparkSize, 1);
        const sparkAngleAttr = new THREE.BufferAttribute(sparkAngle, 1);
        const sparkSpinAttr = new THREE.BufferAttribute(sparkSpin, 1);
        const sparkBirthAttr = new THREE.BufferAttribute(sparkBirth, 1);
        const sparkDurationAttr = new THREE.BufferAttribute(sparkDuration, 1);
        const sparkGainAttr = new THREE.BufferAttribute(sparkGain, 1);
        sparkPositionAttr.setUsage(THREE.DynamicDrawUsage);
        sparkColorAttr.setUsage(THREE.DynamicDrawUsage);
        sparkShapeAttr.setUsage(THREE.DynamicDrawUsage);
        sparkSizeAttr.setUsage(THREE.DynamicDrawUsage);
        sparkAngleAttr.setUsage(THREE.DynamicDrawUsage);
        sparkSpinAttr.setUsage(THREE.DynamicDrawUsage);
        sparkBirthAttr.setUsage(THREE.DynamicDrawUsage);
        sparkDurationAttr.setUsage(THREE.DynamicDrawUsage);
        sparkGainAttr.setUsage(THREE.DynamicDrawUsage);
        sparkGeometry.setAttribute('position', sparkPositionAttr);
        sparkGeometry.setAttribute('aColor', sparkColorAttr);
        sparkGeometry.setAttribute('aShape', sparkShapeAttr);
        sparkGeometry.setAttribute('aSize', sparkSizeAttr);
        sparkGeometry.setAttribute('aAngle', sparkAngleAttr);
        sparkGeometry.setAttribute('aSpin', sparkSpinAttr);
        sparkGeometry.setAttribute('aBirth', sparkBirthAttr);
        sparkGeometry.setAttribute('aDuration', sparkDurationAttr);
        sparkGeometry.setAttribute('aGain', sparkGainAttr);
        sparkGeometry.computeBoundingSphere();

        const sparkMaterial = new THREE.ShaderMaterial({
            vertexShader: strandSparkVertexShader,
            fragmentShader: strandSparkFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            uniforms: {
                uTime: { value: 0 },
                uGlobalOpacity: { value: 0.0 }
            }
        });
        sparkMaterial.toneMapped = false;
        const sparkMesh = new THREE.Points(sparkGeometry, sparkMaterial);
        sparkMesh.frustumCulled = false;
        sparkMesh.raycast = () => null;
        applyLinkRenderLayer(sparkMesh, 'LINK_STRANDS');
        Object.assign(ensureUserData(sparkMesh), { isStrandTipSparkOverlay: true });
        if (parent) {
            parent.add(sparkMesh);
        }

        state.strandFilaments = {
            mesh: filamentMesh,
            geometry,
            material,
            sparkMesh,
            sparkGeometry,
            sparkMaterial,
            sparkPositions,
            sparkOrigin,
            sparkVelocity,
            sparkDrift,
            sparkBirth,
            sparkDuration,
            sparkShape,
            sparkSize,
            sparkAngle,
            sparkSpin,
            sparkGain,
            sparkColor,
            sparkPhase,
            sparkCursor: 0,
            sparkMax,
            positions,
            colors,
            rootT,
            phase,
            lengthScale,
            strandSlot,
            driftSign,
            filamentVariant,
            bridgeForward,
            bridgeTwist,
            bridgeNeighborSign,
            sampleCount,
            vPoint: new THREE.Vector3(),
            vPoint2: new THREE.Vector3(),
            vStart: new THREE.Vector3(),
            vMid: new THREE.Vector3(),
            vEnd: new THREE.Vector3(),
            vTangent: new THREE.Vector3(),
            vTangent2: new THREE.Vector3(),
            vNormal: new THREE.Vector3(),
            vBinormal: new THREE.Vector3(),
            vRadial: new THREE.Vector3(),
            vNormal2: new THREE.Vector3(),
            vBinormal2: new THREE.Vector3(),
            vRadial2: new THREE.Vector3(),
            vSide: new THREE.Vector3(),
            cBase: new THREE.Color(),
            cMid: new THREE.Color(),
            cTip: new THREE.Color(),
            cSparkBase: new THREE.Color(),
            cSparkAccent: new THREE.Color(),
            cSparkOut: new THREE.Color()
        };
        return state.strandFilaments;
    }

    _spawnStrandTipSpark(filamentState, origin, direction, visualTime, energy = 1, options = {}) {
        if (!filamentState || !origin || !direction) return;
        const {
            sparkOrigin,
            sparkVelocity,
            sparkDrift,
            sparkBirth,
            sparkDuration,
            sparkShape,
            sparkSize,
            sparkAngle,
            sparkSpin,
            sparkGain,
            sparkColor,
            sparkPhase,
            sparkMax
        } = filamentState;
        if (
            !sparkOrigin || !sparkVelocity || !sparkDrift || !sparkBirth || !sparkDuration || !sparkMax ||
            !sparkShape || !sparkSize || !sparkAngle || !sparkSpin || !sparkGain || !sparkColor || !sparkPhase
        ) return;

        const idx = filamentState.sparkCursor % sparkMax;
        filamentState.sparkCursor = (filamentState.sparkCursor + 1) % sparkMax;
        const s = idx * 3;

        const mode = options.mode || 'default';
        const ratios = WAVE_SPARK_RATIOS[mode] || WAVE_SPARK_RATIOS.default;
        const shapeIndex = weightedPickIndex(ratios);
        const profile = WAVE_SPARK_PROFILE[shapeIndex] || WAVE_SPARK_PROFILE[WAVE_SPARK_GLYPH.SLIVER];
        const energyClamped = clamp01(energy);

        const speedMul = randRange(profile.speedMin, profile.speedMax);
        const speed = 0.18 + speedMul * (0.5 + energyClamped * 1.2);
        sparkOrigin[s] = origin.x;
        sparkOrigin[s + 1] = origin.y;
        sparkOrigin[s + 2] = origin.z;
        sparkVelocity[s] = direction.x * speed;
        sparkVelocity[s + 1] = direction.y * speed;
        sparkVelocity[s + 2] = direction.z * speed;
        sparkDrift[s] = (-direction.y + (Math.random() - 0.5) * 0.3) * 0.15;
        sparkDrift[s + 1] = (direction.x + (Math.random() - 0.5) * 0.3) * 0.15;
        sparkDrift[s + 2] = ((Math.random() - 0.5) * 0.45) * 0.15;
        sparkPhase[idx] = Math.random() * Math.PI * 2.0;

        sparkShape[idx] = shapeIndex;
        sparkSize[idx] = randRange(profile.sizeMin, profile.sizeMax) * (0.85 + energyClamped * 0.35);
        sparkAngle[idx] = Math.random() * Math.PI * 2.0;
        sparkSpin[idx] = randRange(profile.spinMin, profile.spinMax);
        sparkGain[idx] = randRange(profile.gainMin, profile.gainMax);

        const baseColor = options.baseColor?.isColor ? options.baseColor : COLOR_WHITE;
        const accentColor = options.accentColor?.isColor ? options.accentColor : baseColor;
        const harmony = clamp01(options.harmony ?? 0);
        const corruption = clamp01(options.corruption ?? 0);
        const load = clamp01(options.load ?? 0);
        const hotBoost = clamp01(options.hotBoost ?? 0);

        filamentState.cSparkBase.copy(baseColor);
        filamentState.cSparkAccent.copy(accentColor);
        filamentState.cSparkOut.copy(filamentState.cSparkBase)
            .lerp(filamentState.cSparkAccent, clamp01(profile.accentMix + corruption * 0.08))
            .lerp(COLOR_WHITE, clamp01(profile.hotMix + hotBoost + load * 0.08 + harmony * 0.04));
        sparkColor[s] = filamentState.cSparkOut.r;
        sparkColor[s + 1] = filamentState.cSparkOut.g;
        sparkColor[s + 2] = filamentState.cSparkOut.b;

        sparkBirth[idx] = visualTime;
        sparkDuration[idx] = randRange(profile.lifeMin, profile.lifeMax) * (0.85 + energyClamped * 0.35);
        const attrs = filamentState.sparkGeometry?.attributes;
        if (attrs) {
            attrs.position.needsUpdate = true;
            attrs.aColor.needsUpdate = true;
            attrs.aShape.needsUpdate = true;
            attrs.aSize.needsUpdate = true;
            attrs.aAngle.needsUpdate = true;
            attrs.aSpin.needsUpdate = true;
            attrs.aBirth.needsUpdate = true;
            attrs.aDuration.needsUpdate = true;
            attrs.aGain.needsUpdate = true;
        }
    }

    _updateStrandTipSparks(filamentState, visualTime) {
        if (!filamentState?.sparkGeometry) return;
        const {
            sparkPositions,
            sparkOrigin,
            sparkVelocity,
            sparkDrift,
            sparkBirth,
            sparkDuration,
            sparkPhase,
            sparkMax
        } = filamentState;
        let hasLive = false;
        for (let i = 0; i < sparkMax; i += 1) {
            const born = sparkBirth[i];
            const s = i * 3;
            if (!(born >= 0)) {
                sparkPositions[s] = 1e6;
                sparkPositions[s + 1] = 1e6;
                sparkPositions[s + 2] = 1e6;
                continue;
            }
            const age = visualTime - born;
            const duration = sparkDuration[i] || 0.25;
            if (age >= duration) {
                sparkBirth[i] = -1;
                sparkPositions[s] = 1e6;
                sparkPositions[s + 1] = 1e6;
                sparkPositions[s + 2] = 1e6;
                continue;
            }
            hasLive = true;
            const ageNorm = clamp01(age / duration);
            const drag = 1.0 - ageNorm * 0.35;
            const wobble = Math.sin(age * 24.0 + sparkPhase[i]) * (0.12 * (1.0 - ageNorm));
            sparkPositions[s] = sparkOrigin[s] + sparkVelocity[s] * age * drag + sparkDrift[s] * wobble;
            sparkPositions[s + 1] = sparkOrigin[s + 1] + sparkVelocity[s + 1] * age * drag + sparkDrift[s + 1] * wobble;
            sparkPositions[s + 2] = sparkOrigin[s + 2] + sparkVelocity[s + 2] * age * drag + sparkDrift[s + 2] * wobble;
        }
        if (filamentState.sparkMaterial?.uniforms?.uTime) {
            filamentState.sparkMaterial.uniforms.uTime.value = visualTime;
        }
        if (filamentState.sparkMaterial?.uniforms?.uGlobalOpacity) {
            filamentState.sparkMaterial.uniforms.uGlobalOpacity.value = hasLive ? 1.0 : 0.0;
        }
        const attrs = filamentState.sparkGeometry.attributes;
        attrs.position.needsUpdate = true;
        attrs.aBirth.needsUpdate = true;
    }

    _updateStrandFilaments(link, state, ctx = {}) {
        if (!STRAND_FILAMENT_STYLE.ENABLED || !state) return;
        const strands = Array.isArray(state.strands) ? state.strands : [];
        if (!strands.length) return;

        const filamentState = this._ensureStrandFilaments(link, state);
        if (!filamentState) return;
        const mesh = filamentState.mesh;
        const material = filamentState.material;
        const geometry = filamentState.geometry;
        if (!mesh || !material || !geometry) return;

        if (!mesh.parent) {
            const parent = link?.group || strands[0]?.parent || null;
            if (parent) parent.add(mesh);
        }
        if (filamentState.sparkMesh && !filamentState.sparkMesh.parent) {
            const parent = link?.group || strands[0]?.parent || null;
            if (parent) parent.add(filamentState.sparkMesh);
        }

        const metrics = ctx.metrics || link?.userData?.metrics || {};
        const synergy = clamp01(metrics.synergy ?? 0);
        const harmony = clamp01(metrics.harmony ?? 0);
        const corruption = clamp01(metrics.corruption ?? 0);
        const load = clamp01(metrics.loadPressure ?? 0);
        const instability = clamp01(1.0 - (metrics.stability ?? 1));
        material.opacity = THREE.MathUtils.clamp(
            STRAND_FILAMENT_STYLE.BASE_OPACITY + load * 0.18 + corruption * 0.22 + synergy * 0.08,
            0.18,
            0.92
        );
        this._updateStrandTipSparks(filamentState, Number.isFinite(ctx.visualTime) ? ctx.visualTime : 0);

        if (!ctx.geometryTick || !ctx.mainCurve || !ctx.frames) return;

        const mainCurve = ctx.mainCurve;
        const frames = ctx.frames;
        const segments = Math.max(1, ctx.segments || state.strandSegments || 1);
        const strandCount = Math.max(1, state.strandCount || strands.length || 1);
        const activeRadius = Math.max(0.0001, ctx.activeRadius || this.config.baseRadius || 0.06);
        const twistPhase = Number.isFinite(ctx.twistPhase) ? ctx.twistPhase : 0;
        const linkLength = Math.max(0.0001, ctx.linkDist || state.linkLength || state.waveLength || 1.0);
        const twists = linkLength / Math.max(0.01, this.config.twistSpacing || 2.0);
        const visualTime = Number.isFinite(ctx.visualTime) ? ctx.visualTime : 0;
        const noiseBase = Number.isFinite(ctx.noiseBase) ? ctx.noiseBase : 0.0025;

        const {
            positions, colors, rootT, phase, lengthScale, strandSlot, driftSign,
            filamentVariant, bridgeForward, bridgeTwist, bridgeNeighborSign, sampleCount,
            vPoint, vPoint2, vStart, vMid, vEnd, vTangent, vTangent2, vNormal, vBinormal, vRadial,
            vNormal2, vBinormal2, vRadial2, vSide, cBase, cMid, cTip
        } = filamentState;

        const edgeFadeSpan = 0.05;
        for (let idx = 0; idx < sampleCount; idx += 1) {
            const strandIndex = Math.min(strandCount - 1, strandSlot[idx] || 0);
            const advect = visualTime * (STRAND_FILAMENT_STYLE.TRAVEL_SPEED + synergy * 0.08) * driftSign[idx];
            const tRaw = rootT[idx] + advect;
            const tWrapped = ((tRaw % 1) + 1) % 1;
            const t = THREE.MathUtils.clamp(tWrapped, 0.015, 0.985);

            mainCurve.getPointAt(t, vPoint);

            const framePos = t * segments;
            const i0 = Math.min(segments, Math.max(0, Math.floor(framePos)));
            const i1 = Math.min(segments, i0 + 1);
            const frameLerp = framePos - i0;
            const n0 = frames.normals[i0] || frames.normals[frames.normals.length - 1];
            const n1 = frames.normals[i1] || n0;
            const b0 = frames.binormals[i0] || frames.binormals[frames.binormals.length - 1];
            const b1 = frames.binormals[i1] || b0;
            if (!n0 || !b0) continue;

            vNormal.copy(n0).lerp(n1, frameLerp).normalize();
            vBinormal.copy(b0).lerp(b1, frameLerp).normalize();

            const angleOffset = (strandIndex / strandCount) * Math.PI * 2.0;
            const currentTwist = t * Math.PI * 2.0 * twists + twistPhase;
            const angle = angleOffset + currentTwist;
            const variant = filamentVariant[idx] || 0;
            const isBridge = variant === 1;
            const isMicroJump = variant === 2;

            const flare = 1.0 + Math.pow(2.0 * (t - 0.5), 2) * 0.2;
            let radius = activeRadius * flare + Math.sin(t * 40.0 + strandIndex * 10.0) * noiseBase;
            const edgeDistance = Math.min(t, 1.0 - t);
            if (edgeDistance < edgeFadeSpan) {
                const fade = 1.0 - (edgeDistance / edgeFadeSpan);
                radius *= (1.0 - fade * 0.55);
            }

            vRadial.copy(vNormal).multiplyScalar(Math.cos(angle));
            vRadial.addScaledVector(vBinormal, Math.sin(angle)).normalize();
            const startSurfaceMul = (isBridge || isMicroJump) ? 1.0 : STRAND_FILAMENT_STYLE.RADIAL_PUSH;
            vStart.copy(vPoint).addScaledVector(vRadial, radius * startSurfaceMul);

            mainCurve.getTangentAt(t, vTangent).normalize();
            vSide.crossVectors(vTangent, vRadial);
            if (vSide.lengthSq() < 1e-6) {
                vSide.copy(vBinormal);
            } else {
                vSide.normalize();
            }

            const pulse = 0.5 + 0.5 * Math.sin(
                visualTime * STRAND_FILAMENT_STYLE.SWAY_SPEED + phase[idx] + t * 12.0
            );
            const detachPulse = Math.pow(
                Math.max(0.0, Math.sin(visualTime * STRAND_FILAMENT_STYLE.DETACH_SPEED + phase[idx] * 1.7 + t * 9.0)),
                6.0
            );
            const detach = detachPulse * (0.35 + corruption * 0.95 + load * 0.25);
            const filamentLength =
                activeRadius *
                STRAND_FILAMENT_STYLE.LENGTH_SCALE *
                lengthScale[idx] *
                (0.7 + harmony * 0.35 + load * 0.45) +
                detach * STRAND_FILAMENT_STYLE.DETACH_BOOST;
            const sway = (pulse - 0.5) * STRAND_FILAMENT_STYLE.SWAY_AMOUNT * (1.0 + instability * 0.6);
            let jumpVisibility = 1.0;

            if (isBridge || isMicroJump) {
                const hopWave = Math.sin(
                    visualTime * STRAND_FILAMENT_STYLE.BRIDGE_HOP_SPEED +
                    phase[idx] * 0.75 +
                    t * 8.0
                );
                const hopDir = hopWave >= 0 ? bridgeNeighborSign[idx] : -bridgeNeighborSign[idx];
                let targetStrandIndex = (strandIndex + hopDir + strandCount) % strandCount;
                if (targetStrandIndex === strandIndex && strandCount > 1) {
                    targetStrandIndex = (strandIndex + 1) % strandCount;
                }
                const tBridge = THREE.MathUtils.clamp(
                    t + bridgeForward[idx] * driftSign[idx] + Math.sin(visualTime * 0.9 + phase[idx]) * 0.012,
                    0.01,
                    0.99
                );

                mainCurve.getPointAt(tBridge, vPoint2);
                const framePos2 = tBridge * segments;
                const j0 = Math.min(segments, Math.max(0, Math.floor(framePos2)));
                const j1 = Math.min(segments, j0 + 1);
                const frameLerp2 = framePos2 - j0;
                const n2a = frames.normals[j0] || frames.normals[frames.normals.length - 1];
                const n2b = frames.normals[j1] || n2a;
                const b2a = frames.binormals[j0] || frames.binormals[frames.binormals.length - 1];
                const b2b = frames.binormals[j1] || b2a;
                if (!n2a || !b2a) continue;

                vNormal2.copy(n2a).lerp(n2b, frameLerp2).normalize();
                vBinormal2.copy(b2a).lerp(b2b, frameLerp2).normalize();
                mainCurve.getTangentAt(tBridge, vTangent2).normalize();

                const targetAngleOffset = (targetStrandIndex / strandCount) * Math.PI * 2.0;
                const targetTwist = tBridge * Math.PI * 2.0 * twists + twistPhase;
                const angle2 =
                    targetAngleOffset + targetTwist +
                    bridgeTwist[idx] * (0.85 + 0.35 * Math.sin(visualTime * 1.35 + phase[idx] + t * 4.0));
                const flare2 = 1.0 + Math.pow(2.0 * (tBridge - 0.5), 2) * 0.18;
                let radius2 = activeRadius * flare2 + Math.sin(tBridge * 40.0 + targetStrandIndex * 10.0) * noiseBase;
                const edgeDistance2 = Math.min(tBridge, 1.0 - tBridge);
                if (edgeDistance2 < edgeFadeSpan) {
                    const fade2 = 1.0 - (edgeDistance2 / edgeFadeSpan);
                    radius2 *= (1.0 - fade2 * 0.52);
                }

                vRadial2.copy(vNormal2).multiplyScalar(Math.cos(angle2));
                vRadial2.addScaledVector(vBinormal2, Math.sin(angle2)).normalize();
                vSide.crossVectors(vTangent2, vRadial2);
                if (vSide.lengthSq() < 1e-6) {
                    vSide.copy(vBinormal2);
                } else {
                    vSide.normalize();
                }

                // Endpoint is clamped to the target strand surface for visible strand-to-strand contact.
                vEnd.copy(vPoint2).addScaledVector(vRadial2, radius2 * STRAND_FILAMENT_STYLE.BRIDGE_CLING);

                if (isMicroJump) {
                    const jumpPulse = Math.sin(
                        visualTime * STRAND_FILAMENT_STYLE.MICRO_JUMP_SPEED +
                        phase[idx] * 2.2 +
                        t * 12.0
                    );
                    const jumpGate = THREE.MathUtils.clamp((jumpPulse - 0.62) * 4.2, 0.0, 1.0);
                    jumpVisibility = jumpGate;
                    vMid.lerpVectors(vStart, vEnd, 0.5)
                        .addScaledVector(vSide, filamentLength * sway * 0.36)
                        .addScaledVector(vRadial, filamentLength * (STRAND_FILAMENT_STYLE.MICRO_JUMP_CURVE * jumpGate))
                        .addScaledVector(vTangent2, filamentLength * (0.03 + jumpGate * 0.08));
                    if (jumpGate < 0.05) {
                        vEnd.lerp(vStart, 1.0 - jumpGate * 20.0);
                        vMid.lerpVectors(vStart, vEnd, 0.5);
                    }
                } else {
                    vMid.lerpVectors(vStart, vEnd, 0.5)
                        .addScaledVector(vRadial, filamentLength * (STRAND_FILAMENT_STYLE.BRIDGE_CURVE * (0.6 + 0.4 * pulse)))
                        .addScaledVector(vSide, filamentLength * sway * 0.55)
                        .addScaledVector(vTangent2, filamentLength * (0.08 + load * 0.1));
                }
            } else {
                const forwardLean = filamentLength * (STRAND_FILAMENT_STYLE.FLOW_LEAN + load * 0.35 + synergy * 0.2);
                const radialLean = filamentLength * (STRAND_FILAMENT_STYLE.RADIAL_LEAN + corruption * 0.18);

                vEnd.copy(vStart)
                    .addScaledVector(vTangent, forwardLean)
                    .addScaledVector(vRadial, radialLean)
                    .addScaledVector(vSide, filamentLength * sway * 0.44)
                    .addScaledVector(vTangent, detach * 0.2 * driftSign[idx]);

                vMid.lerpVectors(vStart, vEnd, 0.52)
                    .addScaledVector(vSide, filamentLength * sway * 0.26)
                    .addScaledVector(vRadial, filamentLength * 0.12);
            }

            const p = idx * 12;
            positions[p] = vStart.x;
            positions[p + 1] = vStart.y;
            positions[p + 2] = vStart.z;
            positions[p + 3] = vMid.x;
            positions[p + 4] = vMid.y;
            positions[p + 5] = vMid.z;
            positions[p + 6] = vMid.x;
            positions[p + 7] = vMid.y;
            positions[p + 8] = vMid.z;
            positions[p + 9] = vEnd.x;
            positions[p + 10] = vEnd.y;
            positions[p + 11] = vEnd.z;

            const strandBaseColor = strands[strandIndex]?.material?.uniforms?.uBaseColor?.value;
            if (strandBaseColor?.isColor) {
                cBase.copy(strandBaseColor);
            } else if (state.baseColorObj?.isColor) {
                cBase.copy(state.baseColorObj);
            } else {
                cBase.set(0xffffff);
            }

            const startGain = (isMicroJump ? (0.34 + jumpVisibility * 0.36) : (isBridge ? 0.56 : 0.62)) + load * 0.4 + pulse * 0.22;
            const midGain = (isMicroJump ? (0.4 + jumpVisibility * 0.34) : (isBridge ? 0.66 : 0.72)) + harmony * 0.26 + pulse * 0.16;
            const tipGain = (isMicroJump ? (0.48 + jumpVisibility * 0.36) : (isBridge ? 0.74 : 0.84)) + harmony * 0.28 + detach * 0.62;
            cTip.copy(cBase).lerp(
                COLOR_WHITE,
                THREE.MathUtils.clamp((isMicroJump ? (0.25 + jumpVisibility * 0.5) : (isBridge ? 0.42 : 0.58)) + detach * 0.55 + corruption * 0.25, 0.0, 1.0)
            );
            cMid.copy(cBase).lerp(cTip, isMicroJump ? (0.32 + jumpVisibility * 0.38) : (isBridge ? 0.62 : 0.48));

            colors[p] = cBase.r * startGain;
            colors[p + 1] = cBase.g * startGain;
            colors[p + 2] = cBase.b * startGain;
            colors[p + 3] = cMid.r * midGain;
            colors[p + 4] = cMid.g * midGain;
            colors[p + 5] = cMid.b * midGain;
            colors[p + 6] = cMid.r * midGain;
            colors[p + 7] = cMid.g * midGain;
            colors[p + 8] = cMid.b * midGain;
            colors[p + 9] = cTip.r * tipGain;
            colors[p + 10] = cTip.g * tipGain;
            colors[p + 11] = cTip.b * tipGain;

            // Detached sparks from filament tips (rare, burst-like).
            const sparkPulse = Math.sin(visualTime * 7.4 + phase[idx] * 2.7 + idx * 0.37);
            const sparkChanceGate = isMicroJump ? (0.93 + (1.0 - jumpVisibility) * 0.04) : 0.978;
            const sparkAccent = (strandIndex % 2 === 0 ? state.colorB : state.colorA) || cBase;
            if ((detach > 0.14 || (isMicroJump && jumpVisibility > 0.82)) && sparkPulse > sparkChanceGate) {
                if (isBridge || isMicroJump) {
                    vSide.copy(vTangent2)
                        .addScaledVector(vRadial2, 0.65 + detach * 0.85 + jumpVisibility * 0.2)
                        .addScaledVector(vBinormal2, driftSign[idx] * 0.18)
                        .normalize();
                } else {
                    vSide.copy(vTangent)
                        .addScaledVector(vRadial, 0.5 + detach * 0.7)
                        .normalize();
                }
                this._spawnStrandTipSpark(
                    filamentState,
                    vEnd,
                    vSide,
                    visualTime,
                    0.4 + detach * 0.9 + jumpVisibility * 0.4,
                    {
                        mode: isMicroJump ? 'microJump' : 'tipDetach',
                        baseColor: cBase,
                        accentColor: sparkAccent,
                        harmony,
                        corruption,
                        load,
                        hotBoost: isMicroJump ? 0.16 : 0.10
                    }
                );
            }

            // Occasional bridge contact pulses: short glyph arcs at strand-to-strand touch moments.
            if (isBridge && pulse > 0.972 && Math.sin(visualTime * 5.7 + phase[idx] * 1.9) > 0.82) {
                vSide.copy(vTangent2)
                    .addScaledVector(vRadial2, 0.75 + load * 0.25)
                    .normalize();
                this._spawnStrandTipSpark(
                    filamentState,
                    vMid,
                    vSide,
                    visualTime,
                    0.34 + harmony * 0.35 + load * 0.2,
                    {
                        mode: 'bridgeContact',
                        baseColor: cBase,
                        accentColor: sparkAccent,
                        harmony,
                        corruption,
                        load,
                        hotBoost: 0.08
                    }
                );
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
    }

    setTravelingWaveFX(travelingWaveFX) {
        this.travelingWaveFX = travelingWaveFX || null;
    }

    _shouldRegisterForTravelPack(material) {
        if (!material) return false;

        // Register only link-body ShaderMaterial variants.
        if (!(material instanceof THREE.ShaderMaterial)) return false;
        if (material.userData?.isFX === true) return false;

        // Skip additive particle-like materials.
        if (material.transparent === true && material.blending === THREE.AdditiveBlending) {
            return false;
        }

        if (material.userData?.travelRelevant === true) return true;
        return material.userData?.isLinkCore === true;
    }

    _registerLinkMaterialWithBridge(material) {
        if (!material) return;
        const bridge = this.waveShaderBridge || window.game?.waveShaderBridge;
        const travelPack = this.waveTravelShaderPack || window.game?.waveTravelShaderPack;
        const waveShaderMaterialPatch = window.game?.waveShaderMaterialPatch;
        const registerOne = (mat) => {
            if (!mat) return;
            if (bridge?.registerLinkMaterial) {
                bridge.registerLinkMaterial(mat, 'DEFAULT');
            }
            if (waveShaderMaterialPatch?.patch) {
                waveShaderMaterialPatch.patch(mat, 'SYNERGY');
            }
            if (travelPack?.register && this._shouldRegisterForTravelPack(mat)) {
                travelPack.register(mat, 'TRAVEL_INTERFERENCE');
            }
        };
        if (Array.isArray(material)) {
            material.forEach(registerOne);
            return;
        }
        registerOne(material);
    }

    _attachWaveDirectionUniform(material, direction, waveLength = 1.0, wavePhaseOffset = 0.0) {
        if (!material || !direction) return;
        ensureUserData(material);
        material.userData.waveDirection = direction;
        material.userData.waveLength = Number.isFinite(waveLength) ? waveLength : 1.0;
        material.userData.wavePhaseOffset = Number.isFinite(wavePhaseOffset) ? wavePhaseOffset : 0.0;
        if (material.uniforms && !material.uniforms.uWaveDirection) {
            material.uniforms.uWaveDirection = { value: direction };
        }
        if (material.uniforms && !material.uniforms.uWaveLength) {
            material.uniforms.uWaveLength = { value: material.userData.waveLength };
        }
        if (material.uniforms && !material.uniforms.uWavePhaseOffset) {
            material.uniforms.uWavePhaseOffset = { value: material.userData.wavePhaseOffset };
        }
        const previousOnBeforeCompile = material.onBeforeCompile;
        if (material.userData.__waveDirectionHooked) {
            return;
        }
        material.onBeforeCompile = (shader) => {
            if (typeof previousOnBeforeCompile === 'function') {
                previousOnBeforeCompile.call(material, shader);
            }
            if (!shader.uniforms.uWaveDirection) {
                shader.uniforms.uWaveDirection = { value: direction };
            } else {
                shader.uniforms.uWaveDirection.value = direction;
            }
            if (!shader.uniforms.uWaveLength) {
                shader.uniforms.uWaveLength = { value: material.userData.waveLength || 1.0 };
            } else {
                shader.uniforms.uWaveLength.value = material.userData.waveLength || 1.0;
            }
            if (!shader.uniforms.uWavePhaseOffset) {
                shader.uniforms.uWavePhaseOffset = { value: material.userData.wavePhaseOffset || 0.0 };
            } else {
                shader.uniforms.uWavePhaseOffset.value = material.userData.wavePhaseOffset || 0.0;
            }

            if (typeof shader.vertexShader === 'string') {
                if (!shader.vertexShader.includes('uniform float uWaveLength;')) {
                    shader.vertexShader = shader.vertexShader.replace(
                        'void main() {',
                        'uniform float uWaveLength;\nuniform float uWavePhaseOffset;\nvoid main() {'
                    );
                }
                shader.vertexShader = shader.vertexShader.replace(
                    'float travelPhase = uWavePhase * 6.28318;',
                    'float travelPhase = (uWavePhase + uWavePhaseOffset) * 6.28318;\n    float lengthFactor = clamp(uWaveLength * 0.2, 0.5, 4.0);\n    travelPhase *= lengthFactor;'
                );
            }
        };
        material.userData.__waveDirectionHooked = true;
        material.needsUpdate = true;
        if (typeof window !== 'undefined' && window.__DEBUG_WAVE_NEEDSUPDATE_SOURCE_TRACE__ === true) {
            const key = 'LinkRendererConduit.js:942 material.needsUpdate=true';
            const bucket = window.__WAVE_NEEDSUPDATE_SOURCE_TRACE__ || (window.__WAVE_NEEDSUPDATE_SOURCE_TRACE__ = {});
            bucket[key] = (bucket[key] || 0) + 1;
        }
    }

    /**
     * Canonical writer for link wave metrics (called once per frame for all links)
     * Ensures waveDirection, waveLength, wavePhaseOffset are always defined
     * on active links before any readers access them.
     *
     * This is the single authoritative source for these metrics - DO NOT write
     * them elsewhere.
     */
    _canonicalWriteLinkWaveMetrics(link) {
        if (!link) return;

        const sourceNode = link?.source || link?.sourceNode;
        const targetNode = link?.target || link?.targetNode;

        if (!sourceNode?.position || !targetNode?.position) {
            // If nodes aren't available, keep existing values (don't delete)
            return;
        }

        const sourcePos = sourceNode.position.clone();
        const targetPos = targetNode.position.clone();
        const linkVec = new THREE.Vector3().subVectors(targetPos, sourcePos);
        const linkDist = linkVec.length();

        // Calculate wave metrics
        const waveDirection = linkDist > 0.0001 ? linkVec.clone().normalize() : new THREE.Vector3(1, 0, 0);
        const waveLength = Math.max(0.0001, linkDist || 1.0);
        const wavePhaseOffset = waveLength * 0.25;

        // Write to link.userData (canonical storage)
        const linkUD = ensureUserData(link);
        linkUD.waveDirection = waveDirection;
        linkUD.waveLength = waveLength;
        linkUD.wavePhaseOffset = wavePhaseOffset;

        // Stamp canonical writes for wave fields
        linkUD.__canonicalWriteAt = linkUD.__canonicalWriteAt || {};
        linkUD.__canonicalWriteAt.waveDirection = Date.now();
        linkUD.__canonicalWriteAt.waveLength = Date.now();
        linkUD.__canonicalWriteAt.wavePhaseOffset = Date.now();

        // Write to conduit state if available
        const state = link?.group?.userData?.conduitState;
        if (state) {
            state.waveDirection = waveDirection;
            state.waveLength = waveLength;
            state.wavePhaseOffset = wavePhaseOffset;
        }

        // Register with wave shader bridge if available
        const waveShaderBridge = this.waveShaderBridge || window.game?.waveShaderBridge;
        if (waveShaderBridge?.registerLinkDirection) {
            waveShaderBridge.registerLinkDirection(link?.id, waveDirection);
        }
    }

    /**
     * Update all links (canonical list) - ensures beads/sparks tick every frame
     */
    updateAll(links, deltaTime, time) {
        if (FORCE_VISUAL_DEBUG) {
            console.warn('[DEBUG MODE ACTIVE] Visual systems are overridden');
        }
        if (this._picDiagCount < 3) {
            console.log('[PicDiag] updateAll tick', this._picDiagCount + 1);
            this._picDiagCount += 1;
        }

        const list = links
            || this.linkSystem?.links
            || this.links
            || [];

        // Canonical write: ensure wave metrics exist for all active links
        for (const link of list) {
            this._canonicalWriteLinkWaveMetrics(link);
        }

        this.waveSystem?.update?.(deltaTime);

        if (this.morphSystem?.update) {
            this.morphSystem.update(deltaTime, list);
        }

        let frameHarmony = 0.5;
        let frameCorruption = 0;
        let frameInstability = 0;
        if (this.harmonicManager?.update || this.nodeInterferenceManager?.update) {
            let sumHarmony = 0;
            let sumCorruption = 0;
            let sumInstability = 0;
            let count = 0;
            for (const link of list) {
                if (!link) continue;
                const m = this._readLinkMetrics(link);
                sumHarmony += (m?.harmony ?? 0.5);
                sumCorruption += (m?.corruption ?? 0);
                sumInstability += (m?.instability ?? (1 - (m?.stability ?? 1)));
                count += 1;
            }
            const inv = count > 0 ? (1 / count) : 0;
            frameHarmony = count > 0 ? sumHarmony * inv : 0.5;
            frameCorruption = count > 0 ? sumCorruption * inv : 0;
            frameInstability = count > 0 ? sumInstability * inv : 0;
        }

        if (this.harmonicManager?.update) {
            this.harmonicManager.update(
                list,
                frameHarmony,
                frameCorruption,
                frameInstability,
                VisualTime.delta
            );
        }

        if (this.nodeInterferenceManager?.update) {
            this.nodeInterferenceManager.update(
                list,
                frameHarmony,
                frameCorruption,
                frameInstability
            );
        }

        // Cadence gating
        this._acc30 += deltaTime;
        this._acc10 += deltaTime;
        let run30 = this._acc30 >= (1 / 30);
        if (run30) this._acc30 -= (1 / 30);
        let run10 = this._acc10 >= 0.1;
        if (run10) this._acc10 -= 0.1;

        // Heavy link selection (LOD)
        const heavyAllowed = this._selectHeavyLinks(list, this.camera, this.heavyDistance, this.maxHeavyLinks);
        const heavyLinks = heavyAllowed ? list.filter(l => heavyAllowed.has(l?.id)) : list;

        // Ensure pictograms stay enabled when we have links to render
        if (this.pictogramSystem && !this.pictogramSystem.enabled && list.length > 0) {
            this.pictogramSystem.enable?.();
        }

        // Garbage collect orphaned trail emitters (links removed without dispose)
        if (this.trailEmitters?.size && this.trailParticles) {
            const liveIds = new Set();
            for (const l of list) {
                if (l?.id !== undefined) liveIds.add(l.id);
            }
            for (const [id, emitter] of this.trailEmitters) {
                if (!liveIds.has(id)) {
                    emitter?.disable?.();
                    this.trailEmitters.delete(id);
                    this.trailParticles.clearLink?.(id);
                }
            }
        }

        if (!list.length && typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            console.warn('[LinkRendererConduit] updateAll called with empty link list');
        }

        // Feed pictogram system with heavy/near links (LOD)
        if (this.pictogramSystem) {
            this.pictogramSystem._externalLinks = heavyLinks;
        }

        // Debug heartbeat: log once per second to confirm animator runs
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            const now = performance.now();
            if (!this._dbgLastLog || now - this._dbgLastLog > 1000) {
                console.debug('[ConduitUpdate]', 'links:', list.length, 'dt:', deltaTime.toFixed(4));
                this._dbgLastLog = now;
            }
        }

        // Reset per-frame healing activity counter (for debug logging)
        this._healingActiveCount = 0;

        const frameTime = {
            visualTime: VisualTime.now,
            visualDelta: VisualTime.delta * (run30 ? 2 : 1), // keep travel speed when ticking slower
            deltaTime
        };
        let runHeavyCorruptionUpdate = run30 && (((this._corruptionFrameCounter = (this._corruptionFrameCounter ?? 0) + 1), this._corruptionFrameCounter % 2 === 0));

        for (const link of list) {
            this.update(link, deltaTime, time, {
                time: frameTime,
                flags: {
                    heavyTick: run30,
                    runHeavyCorruptionUpdate,
                    geometryTick: run10
                }
            });
        }

        if (!this._picDiagLogged) {
            if (!this.pictogramSystem) {
                console.warn('[PicDiag] pictogramSystem missing');
                this._picDiagLogged = true;
            } else if (!this.pictogramSystem.enabled) {
                console.warn('[PicDiag] pictogramSystem disabled');
                this._picDiagLogged = true;
            }
        }
        if (run30 && this.pictogramSystem?.enabled) {
            if (!this._picDiagLogged) {
                const ps = this.pictogramSystem;
                const pictos = ps?.pictograms || [];
                const active = pictos.filter(p => p.active).length;
                const firstActive = pictos.find(p => p.active);
                console.log('[PicDiag] links:', list.length,
                    'pool:', pictos.length,
                    'active:', active,
                    'containerChildren:', ps?.container?.children?.length,
                    'spiralRadius:', firstActive?.spiralRadius,
                    'envelope:', firstActive?.link?.visualEnvelopeRadius);
                this._picDiagLogged = true;
            }
            this.pictogramSystem.update(deltaTime, time, this.camera);
        }

        // Shared healing particle system update
        if (run30) this.updateHealingParticles(deltaTime, time);

        // PATCH 2: Update corruption particle systems
        if (run30 && this.corruptionParticleSystem?.update) {
            this.corruptionParticleSystem.update(deltaTime, time);
        }
        // Spread animator is updated per-link in update(); global call removed
        // because its signature is link-based and this call path was a no-op.

        // Local corruption threshold detector (10 Hz cadence)
        if (run10) {
            this._updateCorruptionFeedbackTriggers(list);
            if (this.corruptionFeedbackVisuals?.update) {
                this.corruptionFeedbackVisuals.update(deltaTime);
            }
        }

        // Debug log (throttled) for healing activity
        if (this._healingActiveCount > 0) {
            const now = performance.now();
            if (!this._healingDebugLast || now - this._healingDebugLast > 1000) {
                console.log('[HealingParticles] active links:', this._healingActiveCount);
                this._healingDebugLast = now;
            }
        }
    }

    _resolveLinkForRuntimeReport(linkId = null) {
        const list = this.linkSystem?.links || this.links || [];
        if (!Array.isArray(list) || list.length === 0) return null;
        if (linkId === null || linkId === undefined) return list[0] || null;
        return list.find((link) => link?.id === linkId || link?.uuid === linkId) || null;
    }

    getLinkRuntimeReport(linkId = null) {
        const link = this._resolveLinkForRuntimeReport(linkId);
        if (!link) {
            return { ok: false, reason: 'no-link-found', linkId };
        }

        const state = link?.group?.userData?.conduitState;
        if (!state) {
            return { ok: false, reason: 'missing-conduit-state', linkId: link.id || link.uuid || linkId };
        }

        const runtime = state.__runtime || {};
        const metrics = state.metrics || this._readLinkMetrics(link) || {};
        const trailEmitter = link.id ? this.trailEmitters?.get(link.id) : null;
        const healingEmitter = link.id ? this.healingEmitters?.get(link.id) : null;
        const spreadState = link.id ? this.corruptionSpreadAnimator?.animationStates?.get(link.id) : null;
        const strands = Array.isArray(state.strands) ? state.strands : [];
        const strandDiagnostics = strands.reduce((acc, strand) => {
            const mat = strand?.material;
            if (!mat) return acc;
            acc.total += 1;
            if (mat.uniforms?.uLocalLoad) acc.waveUniformTargets += 1;
            if (mat.uniforms?.uBaseColor) acc.baseColorUniformTargets += 1;
            if (mat.uniforms?.braid_tightness) acc.morphBraidTargets += 1;
            if (mat.uniforms?.emissive_intensity) acc.morphEmissionTargets += 1;
            if (mat.uniforms?.emission_pulse) acc.morphPulseTargets += 1;
            if (mat.emissive) acc.emissivePropertyTargets += 1;
            return acc;
        }, {
            total: 0,
            waveUniformTargets: 0,
            baseColorUniformTargets: 0,
            morphBraidTargets: 0,
            morphEmissionTargets: 0,
            morphPulseTargets: 0,
            emissivePropertyTargets: 0
        });

        const spreadAnimating = !!spreadState?.isAnimating;
        const hasWaveTargets = strandDiagnostics.waveUniformTargets > 0;
        const hasMorphTargets =
            strandDiagnostics.morphBraidTargets > 0 ||
            strandDiagnostics.morphEmissionTargets > 0 ||
            strandDiagnostics.morphPulseTargets > 0 ||
            strandDiagnostics.emissivePropertyTargets > 0;
        const trailActuallyEmitting =
            (runtime.trailEmitterTicks || 0) > 0 &&
            ((runtime.trailSharedCorruptionEmits || 0) > 0 || (runtime.healingEmitterTicks || 0) > 0);

        const statuses = {
            energyWave: (this.modules.flow && state.energyWave && (runtime.energyWaveTicks || 0) > 0)
                ? (hasWaveTargets ? 'visibly-active' : 'ticking-no-wave-target')
                : 'dormant',
            trailEmitter: (this.modules.trails && trailEmitter && (runtime.trailEmitterTicks || 0) > 0)
                ? (trailActuallyEmitting ? 'visibly-active' : 'ticking-low-emission')
                : 'dormant',
            corruptionSpread: (this.modules.corruptionFX && this.corruptionSpreadAnimator && (runtime.corruptionSpreadTicks || 0) > 0)
                ? (spreadAnimating ? 'visibly-active' : 'ticking-idle')
                : 'dormant',
            corruptionMorph: (this.modules.corruptionFX && this.corruptionMorphing && (runtime.corruptionMorphTicks || 0) > 0)
                ? (hasMorphTargets ? 'visibly-active' : 'ticking-no-morph-target')
                : 'dormant',
            corruptionParticles: (this.modules.corruptionFX && this.corruptionParticleSystem && (runtime.corruptionParticleTicks || 0) > 0)
                ? 'visibly-active'
                : 'dormant',
            tier4Feedback: this.corruptionFeedbackVisuals?.getStats?.()?.activeEffects > 0 ? 'active' : 'dormant'
        };

        return {
            ok: true,
            linkId: link.id || link.uuid || null,
            statuses,
            modules: { ...this.modules },
            runtime: {
                updateCalls: runtime.updateCalls || 0,
                lastVisualTime: runtime.lastVisualTime || 0,
                lastCorruption: runtime.lastCorruption ?? metrics.corruption ?? 0,
                lastHarmony: runtime.lastHarmony ?? metrics.harmony ?? 0,
                lastSynergy: runtime.lastSynergy ?? metrics.synergy ?? 0,
                lastTraffic: runtime.lastTraffic ?? metrics.loadPressure ?? 0,
                energyWaveTicks: runtime.energyWaveTicks || 0,
                trailEmitterTicks: runtime.trailEmitterTicks || 0,
                trailSharedCorruptionEmits: runtime.trailSharedCorruptionEmits || 0,
                healingEmitterTicks: runtime.healingEmitterTicks || 0,
                corruptionSpreadTicks: runtime.corruptionSpreadTicks || 0,
                corruptionMorphTicks: runtime.corruptionMorphTicks || 0,
                corruptionParticleTicks: runtime.corruptionParticleTicks || 0
            },
            triggerContext: {
                corruption: metrics.corruption ?? 0,
                spreadThreshold: 0.35,
                spreadDeltaThreshold: this.corruptionSpreadAnimator?.config?.triggerDeltaThreshold ?? null,
                spreadAnimating,
                spreadWavePhase: spreadState?.wavePhase ?? null,
                runHeavyCorruptionUpdateCadence: 'updateAll: run30 && every 2nd heavy frame'
            },
            resources: {
                strands: state.strands?.length || 0,
                hasEnergyWave: !!state.energyWave,
                hasTrailEmitter: !!trailEmitter,
                trailEmitterEnabled: trailEmitter?.enabled ?? null,
                hasHealingEmitter: !!healingEmitter,
                healingEmitterEnabled: healingEmitter?.enabled ?? null
            },
            strandDiagnostics
        };
    }

    resetLinkRuntimeReport(linkId = null) {
        const link = this._resolveLinkForRuntimeReport(linkId);
        if (!link?.group?.userData?.conduitState) return false;
        const state = link.group.userData.conduitState;
        state.__runtime = {
            updateCalls: 0,
            lastVisualTime: 0,
            lastCorruption: 0,
            lastHarmony: 0,
            lastSynergy: 0,
            lastTraffic: 0,
            corruptionSpreadTicks: 0,
            corruptionMorphTicks: 0,
            corruptionParticleTicks: 0,
            trailEmitterTicks: 0,
            trailSharedCorruptionEmits: 0,
            healingEmitterTicks: 0,
            energyWaveTicks: 0
        };
        return true;
    }

    /**
     * Setup callbacks for when particles arrive at destination nodes
     */
    _setupParticleCallbacks() {
      // Trail particles (corruption) arrive at target nodes
      this.trailParticles.setArrivalCallback((particle, link, _time) => {
        if (link?.target?.userData?.nodeId !== undefined) {
          const targetNodeId = link.target.userData.nodeId;

          // Calculate incoming direction (source → target)
          // This biases the aura deformation toward the incoming link
          const incomingDir = new THREE.Vector3()
            .subVectors(link.target.position, link.source.position)
            .normalize();

          // Trigger corruption impact at target
          this.impactManager.triggerImpact(
            targetNodeId,
            'corruption',
            VisualTime.now, // Time source: VisualTime (canonical)
            0.8,    // Intensity: 80% strength
            0.18,   // Duration: 180ms (polished timing)
            incomingDir  // ← Pass incoming direction for bias
          );
        }
      });

      // Healing particles (harmony) arrive at source nodes
      this.healingParticles.setArrivalCallback((particle, link, _time) => {
        if (link?.source?.userData?.nodeId !== undefined) {
          const sourceNodeId = link.source.userData.nodeId;

          // Calculate incoming direction (target → source, reversed)
          // Healing flows backward, so reverse the direction
          const incomingDir = new THREE.Vector3()
            .subVectors(link.source.position, link.target.position)
            .normalize();

          // Trigger harmony impact at source
          this.impactManager.triggerImpact(
            sourceNodeId,
            'harmony',
            VisualTime.now, // Time source: VisualTime (canonical)
            0.75,   // Intensity: 75% strength
            0.19,   // Duration: 190ms (polished timing)
            incomingDir  // ← Pass incoming direction for bias
          );
        }
      });
    }

    /**
     * Emit a pulse wave from a node into all connected links
     * Called by application when a node should emit energy pulses
     *
     * @param {Object} sourceNode - Source node
     * @param {Array} connectedLinks - Links connected to this node
     * @param {number} time - Current time
     */
    emitNodePulse(sourceNode, connectedLinks, _time = 0) {
        if (this.directionalStreaks) {
            // Get hub controller if this node is a harmonic hub
            const hubController = this.nodeHarmonicManager?.nodeControllers.get(sourceNode);

            this.directionalStreaks.pulseInjector.injectNodePulse(
                sourceNode,
                connectedLinks,
                VisualTime.now, // Time source: VisualTime (canonical)
                hubController,
                this.nodeHarmonicManager?.nodeControllers
            );
        }
    }

    /**
     * Register a harmonic hub for pulse phase synchronization
     * Called when a node becomes a harmonic hub
     *
     * @param {Object} node - Hub node
     * @param {Object} hubController - NodeHarmonicSyncController
     * @param {Array} connectedLinks - Links connected to hub
     */
    registerHarmonicHub(node, hubController, connectedLinks = []) {
        if (this.directionalStreaks) {
            this.directionalStreaks.pulseInjector.phaseSync.registerHubNode(node, hubController, connectedLinks);
        }
    }

    /**
     * Unregister a harmonic hub
     * Called when a node stops being a harmonic hub
     *
     * @param {Object} node - Former hub node
     * @param {Array} connectedLinks - Links that were connected
     */
    unregisterHarmonicHub(node, connectedLinks = []) {
        if (this.directionalStreaks) {
            this.directionalStreaks.pulseInjector.phaseSync.unregisterHubNode(node, connectedLinks);
        }
    }

    /**
     * Build cascade network for pulse propagation
     * Called when hub configuration changes
     */
    buildCascadeNetwork() {
        if (this.directionalStreaks && this.nodeHarmonicManager) {
            this.directionalStreaks.pulseInjector.buildCascadeNetwork(
                this.nodeHarmonicManager.nodeControllers
            );
        }
    }

    /**
     * Update cascade pulse propagation
     * Called from main update loop (after all link updates)
     *
     * @param {number} deltaTime - Frame delta
     * @param {number} time - Current time
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} instability - Instability level (0-1)
     * @param {number} synergy - Synergy level (0-1)
     * @param {Array} links - All links
     */
    updateCascadePropagation(deltaTime, time, harmony = 1.0, corruption = 0.0, instability = 0.0, synergy = 0.5, links = []) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.directionalStreaks && this.nodeHarmonicManager) {
            this.directionalStreaks.pulseInjector.updateCascadePropagation(
                visualDelta,
                visualNow,
                harmony,
                corruption,
                instability,
                synergy,
                this.nodeHarmonicManager.nodeControllers,
                links
            );
        }
    }

    /**
     * Get the node interference manager
     * Used by the application to register nodes and links with the interference system
     */
    getNodeInterferenceManager() {
        return this.nodeInterferenceManager;
    }

    /**
     * Get the node harmonic manager
     * Used by the application to register nodes and links with the harmonic sync system
     */
    getNodeHarmonicManager() {
        return this.nodeHarmonicManager;
    }

    /**
     * Update all interference effects
     * Call this from the main render loop after all individual link updates
     */
    updateNodeInterference(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        this.nodeInterferenceManager.update(links, harmony, corruption, instability);
    }

    /**
     * Update all harmonic sync effects
     * Call this from the main render loop after all individual link updates
     */
    updateNodeHarmonySync(links, harmony = 1.0, corruption = 0.0, instability = 0.0, deltaTime = 0.016) {
        this.nodeHarmonicManager.update(links, harmony, corruption, instability, deltaTime);
    }

    /**
     * Update all trail particles
     * Call this from the main render loop after all individual link updates
     */
    updateTrailParticles(deltaTime, time) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.trailParticles) {
            this.trailParticles.update(visualDelta, visualNow);
        }
    }

    /**
     * Update all healing particles
     * Call this from the main render loop after all individual link updates
     */
    updateHealingParticles(deltaTime, time) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.healingParticles) {
            this.healingParticles.update(visualDelta, visualNow);
        }
    }

    /**
     * Generate procedural gradient texture
     */
    generateFlowTexture() {
        if (typeof document === 'undefined') return null;

        const width = 256;
        const height = 1;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        return texture;
    }

    /**
     * Create the unified link visual group
     */
    createLinkVisuals(link) {
        const group = new THREE.Group();
        Object.assign(ensureUserData(group), { isLinkVisual: true });
        const conduitState = group.userData.conduitState || (group.userData.conduitState = {});
        const sourceNode = link?.source || link?.sourceNode;
        const targetNode = link?.target || link?.targetNode;
        const directionVec = new THREE.Vector3(1, 0, 0);
        if (sourceNode?.position && targetNode?.position) {
            directionVec.subVectors(targetNode.position, sourceNode.position);
            if (directionVec.lengthSq() > 1e-8) {
                directionVec.normalize();
            } else {
                directionVec.set(1, 0, 0);
            }
        }
        const linkLength = (sourceNode?.position && targetNode?.position)
            ? sourceNode.position.distanceTo(targetNode.position)
            : 1.0;
        const wavePhaseOffset = linkLength * 0.25;
        const linkUserData = ensureUserData(link);
        linkUserData.waveDirection = directionVec;
        linkUserData.waveLength = linkLength;
        linkUserData.wavePhaseOffset = wavePhaseOffset;
        const waveShaderBridge = this.waveShaderBridge || window.game?.waveShaderBridge;
        if (waveShaderBridge?.registerLinkDirection) {
            waveShaderBridge.registerLinkDirection(link?.id, directionVec);
        }
        const sourceCat = link.source.userData.category || 'input';
        const targetCat = link.target.userData.category || 'input';
        const baseColor = this.getCategoryColor(sourceCat);
        const baseColorObj = new THREE.Color(baseColor);
        const colorA = new THREE.Color(this.getCategoryColor(sourceCat));
        const colorB = new THREE.Color(this.getCategoryColor(targetCat));

        // Determine structure (stable randomization): 3-5 strands per link.
        const linkIdChar = (link.id || 'a').charCodeAt(0);
        const strandCount = 3 + (linkIdChar % 3);

        // Frame 0: core shell + skin mesh (requested bootstrap ordering).
        const skinMaterial = createLinkAuraMaterial({
            baseDisplacement: 0.15,
            noiseScale: 2.0,
            timeScale: 0.5,
            baseOpacity: 0.12,
            harmonyInfluence: 0.8,
            corruptionInfluence: 0.9,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const skinGeometry = createLinkAuraGeometry(0.4, 16);
        const skinMesh = new THREE.Mesh(skinGeometry, skinMaterial);
        skinMesh.frustumCulled = false;
        skinGeometry.computeBoundingSphere();
        skinGeometry.computeBoundingBox();
        ensureUserData(skinMaterial);
        skinMaterial.userData.__owner = 'LinkRenderer';
        skinMaterial.userData.__domain = 'link';
        skinMaterial.userData.isLinkCore = true;
        skinMaterial.userData.travelRelevant = true;
        skinMaterial.userData.waveDirection = directionVec;
        skinMaterial.userData.waveLength = linkLength;
        skinMaterial.userData.wavePhaseOffset = wavePhaseOffset;
        this._attachWaveDirectionUniform(skinMaterial, directionVec, linkLength, wavePhaseOffset);
        // Freeze variant properties immediately after material creation
        freezeMaterialFlags(skinMaterial, 'LinkRenderer');
        applyLinkRenderLayer(skinMesh, 'LINK_SKIN');
        ensureUserData(skinMesh);
        skinMesh.userData.__depthAuthorityLocked = true;
        group.add(skinMesh);

        Object.assign(conduitState, {
            strands: [],
            strandCount: strandCount,
            strandDepthPasses: [],
            strandOverlays: [],
            strandFilaments: null,
            skinMesh: skinMesh,
            beads: null,
            sparks: null,
            trails: null,
            rings: null,
            pulseRing: null,
            pulseDust: null,
            energyWave: null,
            arcDischarges: null,
            visualStateAdapter: null,
            directionalStreaks: null,
            directionalStreaksManager: null,
            mainCurve: null,
            phaseOffset: Math.random() * Math.PI * 2,
            baseColor: baseColor,
            baseColorObj: baseColorObj,
            colorA,
            colorB,
            waveDirection: directionVec,
            waveLength: linkLength,
            wavePhaseOffset: wavePhaseOffset,
            impacts: [],
            __dynamicGeometryInitialized: false,
            bootstrap: {
                phase: 0,
                maxPhase: 9,
                complete: false
            }
        });

        return group;
    }

    _advanceLinkBootstrap(link, state) {
        const bootstrap = state?.bootstrap;
        if (!bootstrap || bootstrap.complete) return;
        const nextPhase = bootstrap.phase + 1;
        this._runBootstrapPhase(link, state, nextPhase);
        bootstrap.phase = nextPhase;
        if (nextPhase >= bootstrap.maxPhase) {
            bootstrap.complete = true;
        }
    }

    _runBootstrapPhase(link, state, phase) {
        const group = link?.group;
        if (!group || !state) return;

        switch (phase) {
            case 1: { // Frame 1: strand geometry + strand shader
                if (state.strands?.length) break;
                const strandCount = state.strandCount || 3;
                for (let i = 0; i < strandCount; i++) {
                    const categoryColor = (i % 2 === 0) ? state.colorA : state.colorB;
                    const accentColor = (i % 2 === 0) ? state.colorB : state.colorA;
                    const material = new THREE.ShaderMaterial({
                        vertexShader: linkStateVertexShaderSimple,
                        fragmentShader: linkStateFragmentShaderSimple,
                        transparent: true,
                        depthWrite: false,
                        depthTest: true,
                        side: THREE.DoubleSide,
                        uniforms: {
                            uNetworkStress: { value: 0.0 },
                            uLocalLoad: { value: 0.0 },
                            uCorruption: { value: 0.0 },
                            uTime: { value: 0.0 },
                            uSegmentCount: { value: 44.0 },
                            uBaseColor: { value: categoryColor.clone() },
                            uAccentColor: { value: accentColor.clone() },
                            uStrandIndex: { value: i },
                            uStrandCount: { value: strandCount }
                        }
                    });
                    ensureUserData(material);
                    material.userData.__owner = 'LinkRenderer';
                    material.userData.__domain = 'link';
                    material.userData.isLinkCore = true;
                    material.userData.travelRelevant = true;
                    material.userData.__flagsFrozen = material.userData.__flagsFrozen || false;
                    const directionVec =
                        link?.userData?.waveDirection ||
                        state?.waveDirection ||
                        new THREE.Vector3(1, 0, 0);
                    const waveLength = link?.userData?.waveLength ?? state?.waveLength ?? 1.0;
                    const wavePhaseOffset = link?.userData?.wavePhaseOffset ?? state?.wavePhaseOffset ?? 0.0;
                    material.userData.waveDirection = directionVec;
                    material.userData.waveLength = waveLength;
                    material.userData.wavePhaseOffset = wavePhaseOffset;

                    this._registerLinkMaterialWithBridge(material);
                    if (this.waveDynamicsShaderPack?.applyToMaterial) this.waveDynamicsShaderPack.applyToMaterial(material);
                    if (this.travelingWaveFX?.registerMaterial) this.travelingWaveFX.registerMaterial(material, { type: 'link-strand', polarity: 'resonance' });
                    this._attachWaveDirectionUniform(material, directionVec, waveLength, wavePhaseOffset);

                    const geometry = new THREE.BufferGeometry();
                    const depthMaterial = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: false,
                        depthWrite: true,
                        depthTest: true,
                        colorWrite: false,
                        side: THREE.DoubleSide
                    });
                    this._registerLinkMaterialWithBridge(depthMaterial);
                    const depthMesh = new THREE.Mesh(geometry, depthMaterial);
                    Object.assign(ensureUserData(depthMesh), { strandIndex: i, strandDepthPrepass: true });
                    depthMesh.frustumCulled = false;
                    applyLinkRenderLayer(depthMesh, 'LINK_CORE', {
                        materialOverrides: { colorWrite: false, side: THREE.DoubleSide }
                    });
                    depthMesh.raycast = () => null;
                    group.add(depthMesh);
                    state.strandDepthPasses.push(depthMesh);

                    const mesh = new THREE.Mesh(geometry, material);
                    Object.assign(ensureUserData(mesh), { strandIndex: i });
                    mesh.frustumCulled = false;
                    geometry.computeBoundingSphere();
                    geometry.computeBoundingBox();
                    applyLinkRenderLayer(mesh, 'LINK_STRANDS');
                    freezeMaterialFlags(material, 'LinkRenderer');
                    material.userData.__flagsFrozen = true;
                    ensureUserData(mesh);
                    mesh.userData.__depthAuthorityLocked = true;
                    mesh.raycast = () => null;
                    group.add(mesh);
                    state.strands.push(mesh);
                }
                state.__dynamicGeometryInitialized = false;
                break;
            }
            case 2: { // Frame 2: pulseRing + ring trails
                if (state.pulseRing) break;
                if (LinkPulseRing) {
                    state.pulseRing = new LinkPulseRing(this.scene);
                    group.add(state.pulseRing.getMesh());
                    if (state.pulseRing.getTrailMeshes) {
                        const trailMeshes = state.pulseRing.getTrailMeshes();
                        if (Array.isArray(trailMeshes)) {
                            trailMeshes.forEach(mesh => group.add(mesh));
                        }
                    }
                }
                break;
            }
            case 3: { // Frame 3: energyWave + pulseDustEmitter
                if (!state.energyWave && LinkEnergyWave) state.energyWave = new LinkEnergyWave();
                if (!state.pulseDust && LinkPulseDustEmitter) {
                    state.pulseDust = new LinkPulseDustEmitter(160);
                    this.conduitRoot.add(state.pulseDust.getObject3D());
                }
                break;
            }
            case 4: { // Frame 4: directionalStreaks
                if (state.directionalStreaks || !LinkDirectionalStreaks || !this.directionalStreaks) break;
                const linkIdHash = (link.id || link.uuid || 'link-unknown')
                    .split('')
                    .reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
                const sourceController = this.nodeHarmonicManager?.nodeControllers.get(link.source);
                const hubController = sourceController?.isActive ? sourceController : null;
                this.directionalStreaks.initialize(group, linkIdHash, link, link.source, link.target, hubController);
                state.directionalStreaks = group.userData?.conduitState?.directionalStreaks || null;
                state.directionalStreaksManager = this.directionalStreaks;
                break;
            }
            case 5: { // Frame 5: arcDischarges
                if (state.arcDischarges || !LinkRingArcDischarges) break;
                state.arcDischarges = new LinkRingArcDischarges(this.scene);
                group.add(state.arcDischarges.getGroup());
                if (state.pulseRing?.setArcSystem) state.pulseRing.setArcSystem(state.arcDischarges);
                break;
            }
            case 6: { // Frame 6: beads
                if (!state.rings && LinkEnergyRingSystem) state.rings = new LinkEnergyRingSystem(this.scene);
                if (!state.beads && LinkBeadVisualizer) {
                    state.beads = new LinkBeadVisualizer(link, this.scene);
                    group.add(state.beads.getGroup());
                }
                break;
            }
            case 7: { // Frame 7: bead trails
                if (!state.trails && LinkBeadTrailSystem) {
                    state.trails = new LinkBeadTrailSystem(this.scene);
                    group.add(state.trails.getMesh());
                }
                break;
            }
            case 8: { // Frame 8: sparks
                if (!state.sparks && LinkSparkSystem) {
                    state.sparks = new LinkSparkSystem(this.scene);
                    group.add(state.sparks.getMesh());
                }
                break;
            }
            case 9: { // Frame 9: corruption/healing emitters + adapters
                if (!state.visualStateAdapter && LinkVisualStateAdapter) {
                    state.visualStateAdapter = new LinkVisualStateAdapter();
                }
                if (this.corruptionAnimator && link.id) {
                    this.corruptionAnimator.initializeLink(link);
                }
                if (this.trailParticles && link.id && !this.trailEmitters.has(link.id)) {
                    const emitter = new LinkTrailEmitter(link, this.trailParticles, 'corruption');
                    this.trailEmitters.set(link.id, emitter);
                }
                if (this.healingParticles && link.id && !this.healingEmitters.has(link.id)) {
                    const emitter = new LinkHealingEmitter(link, this.healingParticles);
                    this.healingEmitters.set(link.id, emitter);
                }
                break;
            }
            default:
                break;
        }
    }

    /**
     * Update the geometry and materials of the link
     */
    update(link, deltaTime, time, frameStateOverride = null) {
        // Canonical wave metrics must be refreshed every link tick because
        // runtime often uses update(link, ...) path instead of updateAll(...).
        this._canonicalWriteLinkWaveMetrics(link);
        if (!link.group || !link.group.userData.conduitState) return;

        // Canonical RAF time source (behavior-preserving Phase 2A)
        const visualTime = frameStateOverride?.time?.visualTime ?? VisualTime.now;
        const visualDelta = frameStateOverride?.time?.visualDelta ?? VisualTime.delta;
        const heavyTick = frameStateOverride?.flags?.heavyTick ?? true;
        let metrics = frameStateOverride?.metrics ?? this._readLinkMetrics(link);
        const frameState = frameStateOverride || {
            time: { visualTime, visualDelta, deltaTime, time },
            metrics
        };

        // Corruption FX throttling is decided once per frame in updateAll(),
        // otherwise per-link alternation creates odd/even link-count artifacts.
        const runHeavyCorruptionUpdate = frameStateOverride?.flags?.runHeavyCorruptionUpdate ?? heavyTick;

        const state = link.group.userData.conduitState;
        if (!state) {
            // If conduit state missing, rebuild visuals inline
            const rebuilt = this.createLinkVisuals(link);
            link.group = rebuilt;
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                console.warn('[ConduitUpdate] Missing conduitState; rebuilt visuals for', link.id);
            }
            return;
        }

        this._advanceLinkBootstrap(link, state);
        state.metrics = metrics;
        const strandOwnerState = this._beginStrandOwnershipFrame(state, metrics, visualTime);
        const runtime = state.__runtime || (state.__runtime = {
            updateCalls: 0,
            lastVisualTime: 0,
            lastCorruption: 0,
            lastHarmony: 0,
            lastSynergy: 0,
            lastTraffic: 0,
            corruptionSpreadTicks: 0,
            corruptionMorphTicks: 0,
            corruptionParticleTicks: 0,
            trailEmitterTicks: 0,
            trailSharedCorruptionEmits: 0,
            healingEmitterTicks: 0,
            energyWaveTicks: 0
        });
        runtime.updateCalls += 1;
        runtime.lastVisualTime = visualTime;
        runtime.lastCorruption = metrics?.corruption ?? 0;
        runtime.lastHarmony = metrics?.harmony ?? 0;

        // Harmonic sync update (links + aggregated metrics)
        if (this.nodeHarmonicManager) {
            const instabilityMetric = metrics?.instability;
            const stabilityMetric = metrics?.stability;
            const instabilityValue = (typeof instabilityMetric === 'number')
                ? instabilityMetric
                : (typeof stabilityMetric === 'number' ? 1 - stabilityMetric : 0.0);
            this.nodeHarmonicManager.update(
                [link],
                metrics?.harmony ?? 1.0,
                metrics?.corruption ?? 0.0,
                instabilityValue,
                visualDelta
            );
        }

        // Corruption VFX updates (spread + particles)
        if (this.modules.corruptionFX) {
            if (heavyTick && this.corruptionSpreadAnimator && state.strands) {
                const spreadState = this.corruptionSpreadAnimator.update(link, visualDelta, state.strands, {
                    corruptionLevel: metrics?.corruption ?? 0,
                    nowMs: performance.now()
                });
                if (spreadState?.isAnimating) {
                    strandOwnerState.corruptionOverrideActive = true;
                    strandOwnerState.corruptionDampen = 0.5;
                    strandOwnerState.corruptionOverrideUntil = Math.max(
                        strandOwnerState.corruptionOverrideUntil || 0,
                        visualTime + 0.25
                    );
                }
                runtime.corruptionSpreadTicks += 1;
            }
            if (runHeavyCorruptionUpdate && this.corruptionMorphing && state.strands) {
                this.corruptionMorphing.update(
                    visualDelta,
                    link
                );
                runtime.corruptionMorphTicks += 1;
            }
            if (runHeavyCorruptionUpdate && this.corruptionParticleSystem) {
                // Prefer canonical updater; fall back if alias differs
                const updater = this.corruptionParticleSystem.updateLinkParticles
                    ? this.corruptionParticleSystem.updateLinkParticles.bind(this.corruptionParticleSystem)
                    : this.corruptionParticleSystem.update?.bind(this.corruptionParticleSystem);
                if (updater) {
                    updater(link, visualDelta, {
                        corruptionLevel: metrics?.corruption ?? 0
                    });
                    runtime.corruptionParticleTicks += 1;
                }
            }
        }

        // --- LINK ANCHORING FIX ---
        // Compute anchored start/end points at node surfaces (not centers)
        const sourceCenter = link.source.position.clone();
        const targetCenter = link.target.position.clone();

        // Direction from source → target
        const linkVec = new THREE.Vector3().subVectors(targetCenter, sourceCenter);
        const linkDist = linkVec.length();
        const linkDir = linkDist > 0.0001 ? linkVec.clone().normalize() : new THREE.Vector3(1, 0, 0);

        // Surface radii (prefer cached boundingSphere)
        const sourceRadius =
          link.source.userData?.boundingSphere?.radius ??
          link.source.geometry?.boundingSphere?.radius ??
          1.0;
        const targetRadius =
          link.target.userData?.boundingSphere?.radius ??
          link.target.geometry?.boundingSphere?.radius ??
          1.0;

        // Dock start/end on node surfaces with scaled radii (bounding spheres are often larger than visible mesh)
        const RADIUS_SCALE = 0.26;
        const start = sourceCenter.clone().addScaledVector(linkDir, sourceRadius * RADIUS_SCALE);
        const end = targetCenter.clone().addScaledVector(linkDir, -targetRadius * RADIUS_SCALE);
        const sourcePortPos = sourceCenter.clone().addScaledVector(linkDir, sourceRadius * 0.18);
        const sourceInjectionOrigin = sourceCenter.clone().addScaledVector(linkDir, sourceRadius * 0.06);

        frameState.geometry = { start: start.clone(), end: end.clone(), linkDir: linkDir.clone(), linkDist };

         // --- Dock ring pulse (visual cue when link reaches node surface) ---
        const dockPos = end.clone();
        const distToTarget = dockPos.distanceTo(targetCenter);
        const dockThreshold = targetRadius * 1.1;

        if (distToTarget < dockThreshold) {
            const surfaceDir = end.clone().sub(targetCenter).normalize();
            const dockOffset = targetCenter.clone().addScaledVector(
                surfaceDir,
                targetRadius * 0.35
            );
            if (!state.dockRing) {
                const sourceColor = new THREE.Color(state.baseColor || 0xffffff);
                const targetColor = new THREE.Color(this.getCategoryColor(link.target.userData?.category));
                const ringColor = sourceColor.lerp(targetColor, 0.5);
                const ring = new THREE.Group();
                ring.position.copy(dockOffset);
                const forward = new THREE.Vector3(0, 0, 1);
                const dir = linkDir.clone().normalize();
                if (dir.lengthSq() === 0) dir.set(0, 0, 1);
                ring.quaternion.setFromUnitVectors(forward, dir);
               // ring.scale.setScalar(0.8);
                const linkThickness = Math.max(
                    link.userData?.visualThickness ??
                    frameState?.linkThickness ??
                    0.12,
                    0.02
                );
                const baseRadius = THREE.MathUtils.clamp(linkThickness * 6.0, 0.25, 1.2) * 0.5;
                const radiusStep = baseRadius * 0.25;
                const layerRadii = [
                    baseRadius + radiusStep * 2,
                    baseRadius + radiusStep,
                    baseRadius * 0.7
                ];
                const layerSpeed = [0.20, -0.30, 0.45];
                const layerOpacity = [0.14, 0.17, 0.2];
                const baseTubeRadius = Math.max(linkThickness * 0.28, 0.028);
                const layerGroups = [];

                for (let layerIndex = 0; layerIndex < layerRadii.length; layerIndex++) {
                    const layerGroup = new THREE.Group();
                    const layerRadius = layerRadii[layerIndex];
                    const segmentCount = 7;
                    const shellSpacing = linkThickness * 1.2;
                    layerGroup.position.set(
                        0,
                        0,
                        (layerRadii.length - 1 - layerIndex) * shellSpacing
                    );
                    layerGroup.userData.baseZ = (layerRadii.length - 1 - layerIndex) * shellSpacing;
                    layerGroup.rotation.z = layerIndex * 0.08;
                    const mat = new THREE.MeshBasicMaterial({
                        color: ringColor,
                        transparent: true,
                        opacity: layerOpacity[layerIndex] ?? 0.5,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });
                    this._registerLinkMaterialWithBridge(mat);
                    layerGroup.userData.baseOpacity = layerOpacity[layerIndex] ?? 0.5;
                    const shellTilt = 0.16 + layerIndex * 0.06;
                    const shellLift = baseTubeRadius * (0.7 + layerIndex * 0.2);

                    for (let i = 0; i < segmentCount; i++) {
                        const startAngle = (i / segmentCount) * Math.PI * 2;
                        const arcLength = (Math.PI * 2) / segmentCount * 0.75;
                        const geo = new THREE.TorusGeometry(
                            layerRadius,
                            baseTubeRadius,
                            8,
                            24,
                            arcLength
                        );
                        const segmentPivot = new THREE.Group();
                        segmentPivot.rotation.z = startAngle;
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.position.y = shellLift;
                        mesh.rotation.x = shellTilt;
                        mesh.scale.set(1.6, 1.6, 0.35);
                        segmentPivot.add(mesh);
                        layerGroup.add(segmentPivot);
                    }

                    const trailMat = new THREE.MeshBasicMaterial({
                        color: ringColor,
                        transparent: true,
                        opacity: (layerOpacity[layerIndex] ?? 0.5) * 0.32,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });
                    this._registerLinkMaterialWithBridge(trailMat);
                    const trailGeo = new THREE.TorusGeometry(
                        layerRadius * (1.0 + layerIndex * 0.015),
                        baseTubeRadius * 0.42,
                        6,
                        20,
                        Math.PI * 0.68
                    );
                    for (let i = 0; i < 3; i++) {
                        const trailPivot = new THREE.Group();
                        trailPivot.rotation.z = (i / 3) * Math.PI * 2 + layerIndex * 0.18;
                        const trail = new THREE.Mesh(trailGeo, trailMat);
                        trail.position.y = shellLift * 0.72;
                        trail.rotation.x = shellTilt * 0.85;
                        trail.scale.set(1.35, 1.35, 0.45);
                        trail.userData.isDockTrailPath = true;
                        trailPivot.add(trail);
                        layerGroup.add(trailPivot);
                    }

                    ring.add(layerGroup);
                    layerGroups.push(layerGroup);
                }

                ring.userData.layerGroups = layerGroups;
                ring.userData.layerSpeed = layerSpeed;
                ring.userData.sprayInterval = 0.12;
                ring.userData.nextSprayTime = visualTime;
                ring.userData.sprayPayload = {
                    origin: dockPos.clone().lerp(dockOffset, 0.24),
                    direction: surfaceDir.clone().negate(),
                    color: ringColor.clone()
                };
                ensureUserData(ring).__linkOwnerId = this._getLinkOwnerId(link);
                this.scene?.add(ring);
                state.dockRing = ring;
                state.dockRingColor = ringColor.clone();
                state.dockRingRadii = layerRadii.slice();
                state.dockRingSpeeds = layerSpeed.slice();
                state.dockRingThickness = linkThickness;
                state.dockGhostPending = {
                    time: visualTime + 0.08,
                    color: ringColor.clone(),
                    layerRadii: layerRadii.slice(),
                    layerSpeed: layerSpeed.map(s => s * 0.8),
                    thickness: linkThickness
                };

                // Spawn a light spray burst at dock point
                if (!state.dockSpray) {
                    const sprayOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
                    state.dockSpray = createDockSpraySystem(this.scene, sprayOrder, 48);
                    if (state.dockSpray?.mesh) {
                        ensureUserData(state.dockSpray.mesh).__linkOwnerId = this._getLinkOwnerId(link);
                    }
                    this.scene?.add(state.dockSpray.mesh);
                }
            }
        }

        // Spawn ghost ring when pending
        if (state.dockGhostPending && visualTime >= state.dockGhostPending.time && !state.dockGhost) {
            const pg = state.dockGhostPending;
            const ringColor = pg.color.clone();
            const ring = new THREE.Group();
            ring.position.copy(dockPos);
            const forward = new THREE.Vector3(0, 0, 1);
            const dir = linkDir.clone().normalize();
            if (dir.lengthSq() === 0) dir.set(0, 0, 1);
            ring.quaternion.setFromUnitVectors(forward, dir);
            const layerGroups = [];
            const layerOpacity = [0.05, 0.07, 0.09];
            const baseTubeRadius = Math.max(pg.thickness * 0.28, 0.024);
            for (let layerIndex = 0; layerIndex < pg.layerRadii.length; layerIndex++) {
                const layerGroup = new THREE.Group();
                const layerRadius = pg.layerRadii[layerIndex] * 1.15;
                const segmentCount = 7;
                const shellSpacing = pg.thickness * 1.2;
                layerGroup.position.set(
                    0,
                    0,
                    (pg.layerRadii.length - 1 - layerIndex) * shellSpacing
                );
                layerGroup.userData.baseZ = (pg.layerRadii.length - 1 - layerIndex) * shellSpacing;
                layerGroup.rotation.z = layerIndex * 0.08;
                const mat = new THREE.MeshBasicMaterial({
                    color: ringColor,
                    transparent: true,
                    opacity: layerOpacity[layerIndex] ?? (0.5 * 0.35),
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                this._registerLinkMaterialWithBridge(mat);
                layerGroup.userData.baseOpacity = layerOpacity[layerIndex] ?? (0.5 * 0.35);
                const shellTilt = 0.16 + layerIndex * 0.06;
                const shellLift = baseTubeRadius * (0.65 + layerIndex * 0.18);

                for (let i = 0; i < segmentCount; i++) {
                    const startAngle = (i / segmentCount) * Math.PI * 2;
                    const arcLength = (Math.PI * 2) / segmentCount * 0.75;
                    const geo = new THREE.TorusGeometry(
                        layerRadius,
                        baseTubeRadius,
                        8,
                        24,
                        arcLength
                    );
                    const segmentPivot = new THREE.Group();
                    segmentPivot.rotation.z = startAngle;
                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.y = shellLift;
                    mesh.rotation.x = shellTilt;
                    mesh.scale.set(1.35, 1.35, 0.45);
                    segmentPivot.add(mesh);
                    layerGroup.add(segmentPivot);
                }

                const trailMat = new THREE.MeshBasicMaterial({
                    color: ringColor,
                    transparent: true,
                    opacity: (layerOpacity[layerIndex] ?? 0.12) * 0.22,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                this._registerLinkMaterialWithBridge(trailMat);
                const trailGeo = new THREE.TorusGeometry(
                    layerRadius * 1.02,
                    baseTubeRadius * 0.36,
                    6,
                    16,
                    Math.PI * 0.58
                );
                for (let i = 0; i < 2; i++) {
                    const trailPivot = new THREE.Group();
                    trailPivot.rotation.z = (i * Math.PI) + layerIndex * 0.24;
                    const trail = new THREE.Mesh(trailGeo, trailMat);
                    trail.position.y = shellLift * 0.72;
                    trail.rotation.x = shellTilt * 0.85;
                    trail.scale.set(1.35, 1.35, 0.45);
                    trail.userData.isDockTrailPath = true;
                    trailPivot.add(trail);
                    layerGroup.add(trailPivot);
                }

                ring.add(layerGroup);
                layerGroups.push(layerGroup);
            }
            ring.userData.layerGroups = layerGroups;
            ring.userData.layerSpeed = pg.layerSpeed;
            ensureUserData(ring).__linkOwnerId = this._getLinkOwnerId(link);
            this.scene?.add(ring);
            state.dockGhost = ring;
            state.dockGhostPending = null;
        }

        const updateDockRing = (ring) => {
            if (!ring) return false;
            if (ring.userData.layerGroups && ring.userData.layerSpeed) {
                for (let i = 0; i < ring.userData.layerGroups.length; i++) {
                    const layerGroup = ring.userData.layerGroups[i];
                    const speed = ring.userData.layerSpeed[i] || 0;
                    const baseZ = layerGroup.userData?.baseZ ?? 0;
                    layerGroup.rotation.z += speed * visualDelta;
                    layerGroup.position.set(0, 0, baseZ);
                }
            }
            return false;
        };

        const cleanupRing = (ringRefName) => {
            const ring = state[ringRefName];
            if (!ring) return;
            this.scene?.remove(ring);
            const geometrySet = new Set();
            const materialSet = new Set();
            ring.traverse((obj) => {
                if (obj?.geometry) geometrySet.add(obj.geometry);
                if (obj?.material) materialSet.add(obj.material);
            });
            geometrySet.forEach((geo) => geo?.dispose?.());
            materialSet.forEach((material) => material?.dispose?.());
            state[ringRefName] = null;
        };

        if (distToTarget >= dockThreshold) {
            cleanupRing('dockRing');
            cleanupRing('dockGhost');
            state.dockGhostPending = null;
            if (state.dockSpray) {
                state.dockSpray.dispose();
                state.dockSpray = null;
            }
        }

        if (!state.sourceInjection) {
            const sourceOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
            state.sourceInjection = createSourceInjectionSystem(this.scene, sourceOrder, 28);
            if (state.sourceInjection?.points) {
                ensureUserData(state.sourceInjection.points).__linkOwnerId = this._getLinkOwnerId(link);
            }
            if (state.sourceInjection?.vortex) {
                ensureUserData(state.sourceInjection.vortex).__linkOwnerId = this._getLinkOwnerId(link);
            }
            this.scene?.add(state.sourceInjection.points);
            this.scene?.add(state.sourceInjection.vortex);
            state.sourceInjectionNextTime = visualTime;
            state.sourceInjectionInterval = 0.075;
        }

        if (heavyTick) {
            if (state.dockRing) {
                updateDockRing(state.dockRing);
                if (state.dockSpray) {
                    state.dockSpray.update(visualTime);
                    const sprayInterval = state.dockRing.userData.sprayInterval ?? 0.12;
                    const nextSprayTime = state.dockRing.userData.nextSprayTime ?? visualTime;
                    if (visualTime >= nextSprayTime) {
                        const payload = state.dockRing.userData.sprayPayload;
                        if (payload) {
                            state.dockSpray.spawnBurst(payload.origin, payload.direction, payload.color, visualTime);
                        }
                        state.dockRing.userData.nextSprayTime = visualTime + sprayInterval;
                    }
                }
            }

            if (state.dockGhost) {
                updateDockRing(state.dockGhost);
            }

            if (state.sourceInjection) {
                const sourceColor = new THREE.Color(state.baseColor || 0xffffff);
                const injectionAnchor = sourcePortPos.clone();
                const injectionOrigin = sourceInjectionOrigin.clone().lerp(injectionAnchor, 0.35);
                const injectionFlow = THREE.MathUtils.clamp(metrics.loadPressure ?? 0, 0, 1);
                state.sourceInjection.update(visualTime, injectionAnchor, linkDir, injectionFlow);
                const nextInjectionTime = state.sourceInjectionNextTime ?? visualTime;
                const injectionInterval = state.sourceInjectionInterval ?? 0.075;
                if (visualTime >= nextInjectionTime) {
                    state.sourceInjection.spawnBurst(injectionOrigin, linkDir, sourceColor, visualTime);
                    state.sourceInjectionNextTime = visualTime + injectionInterval;
                }
            }
        }
        // --- 1. Curve Calculation ---
        const dist = start.distanceTo(end);

        // Slight arc for rope slack effect
        const arcHeight = Math.min(1.5, dist * 0.1);
        const mid = this._vec3.lerpVectors(start, end, 0.5); // Use cache
        mid.y += arcHeight;

        // Reusing curve object would be ideal but QuadraticBezierCurve3 is light
        const mainCurve = new THREE.QuadraticBezierCurve3(start.clone(), mid.clone(), end.clone());

        link.curve = mainCurve;
        frameState.geometry.curve = mainCurve;

        // Store link direction for aura modulation later
        const linkUD = ensureUserData(link);
        linkUD.linkDirection = linkDir.clone();

        // Read canonical wave metrics (written by _canonicalWriteLinkWaveMetrics)
        // These are guaranteed to exist from the updateAll() canonical pass
        const waveDirection = linkUD.waveDirection instanceof THREE.Vector3
            ? linkUD.waveDirection
            : new THREE.Vector3(1, 0, 0);
        const waveLength = typeof linkUD.waveLength === 'number'
            ? Math.max(0.0001, linkUD.waveLength)
            : Math.max(0.0001, linkDist || 1.0);
        const wavePhaseOffset = typeof linkUD.wavePhaseOffset === 'number'
            ? linkUD.wavePhaseOffset
            : waveLength * 0.25;

        // Sync conduit state from canonical values
        state.waveDirection = waveDirection;
        state.waveLength = waveLength;
        state.wavePhaseOffset = wavePhaseOffset;

        const geometryTick = (frameStateOverride?.flags?.geometryTick ?? heavyTick) || state.__dynamicGeometryInitialized !== true;
        const segments = geometryTick
            ? computeSegmentsFromLength(mainCurve)
            : (state.strandSegments || computeSegmentsFromLength(mainCurve));
        const frames = geometryTick ? mainCurve.computeFrenetFrames(segments, false) : null;
        frameState.geometry.frames = frames;

        // --- 2. Dynamic Parameters ---
        const synergy = metrics.synergy;
        const trafficLoad = metrics.loadPressure ?? 0;

        // Collect per-link material patches to apply once per frame (last-wins per property)
        const materialPatches = {
            skin: {},
            strands: new Map() // mesh -> patch
        };

        // Compute normalized VFX inputs (always on; no gating)
        const vfx = this.computeLinkVfxInput(frameState);

        const breathing = Math.sin(visualTime * this.config.breathingSpeed + state.phaseOffset) * 0.05 + 1.0;
        const twistPhase = visualTime * this.config.twistSpeed;

        const activeRadius = this.config.baseRadius * breathing * (1.0 - synergy * 0.2 + trafficLoad * 0.2) * vfx.widthMul;

        // Cache geometry params for downstream systems (directional streaks)
        state.linkLength = linkDist || 10.0;
        state.linkTwists = state.linkLength / this.config.twistSpacing;
        state.twistPhase = twistPhase;
        state.strandSegments = segments;
        state.activeRadius = activeRadius;
        linkUD.visualEnvelopeRadius = activeRadius;

        // --- 3. Strand Update (The Braid) ---
        // Optimization: Pre-calculate loop invariants
        const flowSpeed = (0.2 + (synergy * 1.2)) * vfx.speedMul;
        const noiseBase = 0.005 * (1.0 - synergy);
        // Denser strand marks with length-scaled count to avoid sparse long links.
        const overlaySegmentCount = THREE.MathUtils.clamp(24.0 + (linkDist * 1.2), 28.0, 88.0);

        state.strands.forEach((mesh, i) => {
            if (isCoreNodeMesh(mesh)) {
                // Phase LRC-SAFE-CORE
                // Do NOT modify core node material
                return;
            }
            // Shader uniforms (simple link state shader)
            const mat = mesh.material;
            if (mat) {
                mat.userData = mat.userData || {};
                mat.userData.__strandOwnerStateRef = strandOwnerState;
                mat.userData.__strandOwnerLinkId = link?.id || link?.uuid || 'link-unknown';
            }
            if (mat?.uniforms) {
                mat.uniforms.uTime.value = visualTime;
                const m = link?.userData?.metrics;
                if (!m) return;

                if (mat.uniforms.uSynergy) mat.uniforms.uSynergy.value = m.synergy ?? 0;
                if (mat.uniforms.uHarmony) mat.uniforms.uHarmony.value = m.harmony ?? 0;
                if (mat.uniforms.uStress) mat.uniforms.uStress.value = 1.0 - (m.stability ?? 1);
                if (mat.uniforms.uCorruption) mat.uniforms.uCorruption.value = m.corruption ?? 0;
                if (mat.uniforms.uLoad) mat.uniforms.uLoad.value = m.loadPressure ?? 0;
                if (mat.uniforms.uNetworkStress) mat.uniforms.uNetworkStress.value = 1.0 - (m.stability ?? 1);
                if (mat.uniforms.uLocalLoad && !mat.userData?.__uLocalLoadOwnedByEnergyWave) {
                    mat.uniforms.uLocalLoad.value = m.loadPressure ?? 0;
                }

                if (Math.random() < 0.01) {
                    console.log('[LINK METRICS → SHADER]', m);
                }
                if (mat.uniforms.uWaveDirection?.value?.copy) {
                    mat.uniforms.uWaveDirection.value.copy(waveDirection);
                } else if (mat.uniforms.uWaveDirection) {
                    mat.uniforms.uWaveDirection.value = waveDirection;
                }
                if (mat.uniforms.uWaveLength) {
                    mat.uniforms.uWaveLength.value = waveLength;
                }
                if (mat.uniforms.uWavePhaseOffset) {
                    mat.uniforms.uWavePhaseOffset.value = wavePhaseOffset;
                }
                if (mat.uniforms.uSegmentCount) {
                    mat.uniforms.uSegmentCount.value = overlaySegmentCount;
                }
            }
            if (mat?.userData) {
                mat.userData.waveDirection = waveDirection;
                mat.userData.waveLength = waveLength;
                mat.userData.wavePhaseOffset = wavePhaseOffset;
            }
            // Flow texture
            if (mesh.material && mesh.material.emissiveMap) {
                mesh.material.emissiveMap.offset.x -= flowSpeed * visualDelta * 0.5;
                const pulse = Math.sin(visualTime * 2.0 + i) * 0.2 + 0.8;
                const emissiveIntensity = 0.5 * pulse * (1 + trafficLoad) * (0.6 + vfx.baseIntensity);
                mergePatch(materialPatches.strands, mesh, { opacity: mesh.material.opacity, emissiveIntensity, owner: 'opacityStage' });
            }

            if (!geometryTick) {
                // Runtime cost guard: avoid per-frame TubeGeometry rebuild churn.
                if (mesh.material && mesh.material.linewidth !== undefined) {
                    mergePatch(materialPatches.strands, mesh, { linewidth: mesh.material.linewidth, owner: 'thicknessStage' });
                }
                return;
            }

            // Generate helical path
            const points = [];
            const angleOffset = (i / state.strandCount) * Math.PI * 2;

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const pointOnMain = mainCurve.getPointAt(t);
                const N = frames.normals[j] || frames.normals[frames.normals.length - 1];
                const B = frames.binormals[j] || frames.binormals[frames.binormals.length - 1];

                // Guard against invalid Frenet frames
                if (!N || !B) continue;

                // Calculate normalized twists based on link length
                const linkLength = linkDist || 10.0;
                const twists = linkLength / this.config.twistSpacing;
                const currentTwist = t * Math.PI * 2 * twists + twistPhase;
                const angle = angleOffset + currentTwist;
  // +++++++ REPLACE

                const flare = 1.0 + Math.pow(2.0 * (t - 0.5), 2) * 0.2;
                const noise = Math.sin(t * 40 + i * 10) * noiseBase;
                let r = (activeRadius * flare) + noise;

                // Gentle symmetric taper near both docking ends
                const taperStart = 0.95;
                const edgeDistance = Math.min(t, 1 - t);
                if (edgeDistance < (1 - taperStart)) {
                    const fade = 1.0 - (edgeDistance / (1 - taperStart));
                    r *= (1.0 - fade * 0.6);
                }

                const offsetX = Math.cos(angle) * r;
                const offsetY = Math.sin(angle) * r;

                const pos = pointOnMain.clone(); // Clone to avoid mutation issues in curve gen
                pos.addScaledVector(N, offsetX);
                pos.addScaledVector(B, offsetY);

                // Guard against NaN/Infinity in position
                if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
                    continue;
                }

                points.push(pos);
            }

            // Dispose & Recreate Geometry
            // Note: Efficient buffer updates for TubeGeometry are complex.
            // We accept reallocation to ensure visual correctness of the braid.
            if (mesh.geometry) mesh.geometry.dispose();
            mesh.geometry = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(points),
                segments,
                this.config.strandRadius,
                this.config.radialSegments,
                false
            );
            if (state.strandOverlays && state.strandOverlays[i]) {
                state.strandOverlays[i].geometry = mesh.geometry;
                const overlayMat = state.strandOverlays[i].material;
                if (overlayMat?.uniforms?.uSegmentCount) {
                    overlayMat.uniforms.uSegmentCount.value = overlaySegmentCount;
                }
            }

            // Linewidth (if supported by material type)
            if (mesh.material && mesh.material.linewidth !== undefined) {
                mergePatch(materialPatches.strands, mesh, { linewidth: mesh.material.linewidth, owner: 'thicknessStage' });
            }
        });

        this._updateStrandFilaments(link, state, {
            mainCurve,
            frames,
            segments,
            geometryTick,
            metrics,
            visualTime,
            activeRadius,
            twistPhase,
            noiseBase,
            linkDist
        });

        // --- 4. Aura Skin Update (Unified Shader Material) ---
        if (state.skinMesh && this.modules.aura) {
             if (isCoreNodeMesh(state.skinMesh)) {
                 // Phase LRC-SAFE-CORE
                 // Do NOT modify core node material
                 return;
             }
             const skin = state.skinMesh;
             if (geometryTick) {
                 if (skin.geometry) skin.geometry.dispose();
                 skin.geometry = new THREE.TubeGeometry(
                     mainCurve,
                     segments,
                     activeRadius * this.config.skinRadiusScale,
                     8,
                     false
                 );
             }

             // Update shader material uniforms for node state (30 Hz cadence)
             if (heavyTick && skin.material && skin.material.uniforms) {
        const material = skin.material;

                 // Time-sync with node aura
                 material.uniforms.uTime.value = visualTime;

                // Link direction for directional noise bias
                if (linkDir) {
                    material.uniforms.uLinkDirection.value.copy(waveDirection);
                }
                if (material.uniforms.uWaveDirection?.value?.copy) {
                    material.uniforms.uWaveDirection.value.copy(waveDirection);
                } else if (material.uniforms.uWaveDirection) {
                    material.uniforms.uWaveDirection.value = waveDirection;
                }
                if (material.uniforms.uWaveLength) {
                    material.uniforms.uWaveLength.value = waveLength;
                }
                if (material.uniforms.uWavePhaseOffset) {
                    material.uniforms.uWavePhaseOffset.value = wavePhaseOffset;
                }

                const m = link?.userData?.metrics;
                if (m) {
                    const linkHarmony = m.harmony ?? 0;
                    const linkCorruption = m.corruption ?? 0;
                    const linkSynergy = Math.max(0, Math.min(1, m.synergy ?? 0));
                    if (material.uniforms.uHarmony) material.uniforms.uHarmony.value = linkHarmony;
                    if (material.uniforms.uCorruption) material.uniforms.uCorruption.value = linkCorruption;
                    if (material.uniforms.uSynergy) material.uniforms.uSynergy.value = linkSynergy;
                    if (material.uniforms.uStress) material.uniforms.uStress.value = 1.0 - (m.stability ?? 1);
                    if (material.uniforms.uLoad) material.uniforms.uLoad.value = m.loadPressure ?? 0;

                    // Desaturation (if link is corrupted)
                    const desaturation = Math.min(1.0, linkCorruption * 1.2);
                    material.uniforms.uDesaturation.value = desaturation;

                    if (Math.random() < 0.01) {
                        console.log('[LINK METRICS → SHADER]', m);
                    }
                }

                 // Link birth/removal effects (synced with node aura)
                 // Birth: ramp up to 1.0, then decay over ~400ms
                 if (link.justLinked) {
                     const currentBirth = material.uniforms.uLinkBirthIntensity.value || 0.0;
                     const targetBirth = Math.min(1.0, currentBirth + visualDelta * 4.0); // Ramp up
                     material.uniforms.uLinkBirthIntensity.value = targetBirth;
                 } else {
                     // Decay when flag is cleared
                     const currentBirth = material.uniforms.uLinkBirthIntensity.value || 0.0;
                     material.uniforms.uLinkBirthIntensity.value = Math.max(0.0, currentBirth - visualDelta * 3.0);
                 }

                 // Removal: similar to birth but opposite effect
                 if (link.justUnlinked) {
                     const currentRemoval = material.uniforms.uLinkRemovalIntensity.value || 0.0;
                     const targetRemoval = Math.min(1.0, currentRemoval + visualDelta * 4.0); // Ramp up
                     material.uniforms.uLinkRemovalIntensity.value = targetRemoval;
                 } else {
                     // Decay when flag is cleared
                     const currentRemoval = material.uniforms.uLinkRemovalIntensity.value || 0.0;
                     material.uniforms.uLinkRemovalIntensity.value = Math.max(0.0, currentRemoval - visualDelta * 3.0);
                 }

                // Stage opacity patch (deterministic write once)
                materialPatches.skin.opacity = material.opacity;
                materialPatches.skin.owner = 'opacityStage';
            }
       }
        if (geometryTick) {
            state.__dynamicGeometryInitialized = true;
        }

        state.mainCurve = mainCurve;

        // --- 4.5. TRAIL PARTICLE EFFECTS ---
        // Emit organic trail particles using same noise as aura systems
        if (this.trailParticles && this.trailEmitters && link.id && this.modules.trails) {
            const emitter = this.trailEmitters.get(link.id);
            if (heavyTick && emitter) {
                const linkHarmony = metrics.harmony ?? 0.5;
                const linkCorruption = metrics.corruption ?? 0.2;

                emitter.update(
                    visualDelta,
                    visualTime,
                    mainCurve,
                    linkDir,
                    linkHarmony,
                    linkCorruption
                );
                runtime.trailEmitterTicks += 1;
            }

            // Shared pool mapping: LinkCorruptionParticleSystem -> corruption trail source.
            if (this.modules.corruptionFX && this.corruptionParticleSystem && runHeavyCorruptionUpdate) {
                const corruptionLevel = Math.max(0, Math.min(1, metrics.corruption ?? 0));
                if (corruptionLevel > 0.08) {
                    this.trailParticles.emitFromSource?.({
                        type: 'corruption',
                        link,
                        curve: mainCurve,
                        linkDirection: linkDir,
                        emissionRate: this.sharedTrailRates.corruption * (0.35 + corruptionLevel * 1.05),
                        time: visualTime,
                        harmony: metrics.harmony ?? 0.5,
                        corruption: corruptionLevel
                    });
                    runtime.trailSharedCorruptionEmits += 1;
                }
            }
        }

        // --- 4.8. HEALING PARTICLE EFFECTS ---
        // Emit healing particles flowing backwards (target → source) when harmony is high
        if (this.healingParticles && this.healingEmitters && link.id && this.modules.healingFX) {
                const emitter = this.healingEmitters.get(link.id);
                if (emitter) {
                    const linkHarmony = metrics.harmony ?? 0.5;
                    const linkCorruption = metrics.corruption ?? 0.2;
                    const tintColor = state.baseColorObj || (state.strands?.[0]?.material?.color);

                    if (linkHarmony > linkCorruption) {
                        emitter.update(
                            visualDelta,
                            visualTime,
                            mainCurve,
                            linkDir,
                            linkHarmony,
                            linkCorruption,
                            tintColor
                        );
                        runtime.healingEmitterTicks += 1;
                        // Shared pool mapping: LinkHealingParticleSystem -> healing trail source.
                        this.trailParticles?.emitFromSource?.({
                            type: 'healing',
                            link,
                            curve: mainCurve,
                            linkDirection: linkDir.clone().negate(),
                            emissionRate: this.sharedTrailRates.healing * (0.4 + (linkHarmony - linkCorruption)),
                            time: visualTime,
                            harmony: linkHarmony,
                            corruption: linkCorruption
                        });
                        this._healingActiveCount = (this._healingActiveCount || 0) + 1;
                    }
                }
            }

        // --- 5. Subsystems Update ---
        this._beadsUpdateCalls = (this._beadsUpdateCalls || 0) + (state.beads ? 1 : 0);
        if (heavyTick && state.beads && this.modules.beads) {
            // Re-assert render state to bypass global depth clamps
            if (state.beads.forceRenderState) {
                state.beads.forceRenderState();
            }
            if (state.beads.setIntensity) {
                state.beads.setIntensity(vfx.beadsIntensity);
            }
            this._beadsUpdateCalls = (this._beadsUpdateCalls || 0) + 1;
            state.beads.update(visualDelta, (bead) => {
                this.triggerNodeImpact(state, link.target, bead);
                if (bead.size === 'large' && state.rings) {
                    const targetColor = this.getCategoryColor(link.target.userData?.category);
                    state.rings.emitRing(link.target.position, new THREE.Color(targetColor), visualTime);
                }
            });
            if (heavyTick && state.trails) state.trails.update(visualTime, visualDelta, state.beads.beadToMesh, mainCurve);
        }

        if (state.rings) state.rings.update(visualTime);

        if (heavyTick && state.sparks && this.modules.sparks) {
            const baseCol = (state.strands[0]?.material?.color) || state.baseColor || 0xffffff;
            const currentColor = baseCol.isColor ? baseCol : new THREE.Color(baseCol);
            this._sparksUpdateCalls = (this._sparksUpdateCalls || 0) + 1;

            // [DEBUG] Log sparks update for visibility debugging
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                console.log('[LinkRendererConduit] Sparks update:', {
                    linkId: link.id,
                    sparksIntensity: vfx.sparksIntensity,
                    synergy,
                    trafficLoad
                });
            }

            state.sparks.update(visualTime, visualDelta, mainCurve, { synergy, traffic: trafficLoad, intensity: vfx.sparksIntensity }, currentColor);
            state.sparks.uniforms.uThickness.value = activeRadius * 2 * vfx.widthMul;

            // Shared pool mapping: LinkSparkSystem -> spark trail source.
            this.trailParticles?.emitFromSource?.({
                type: 'spark',
                link,
                curve: mainCurve,
                linkDirection: linkDir,
                emissionRate: this.sharedTrailRates.spark * (0.45 + vfx.sparksIntensity),
                time: visualTime,
                harmony: metrics.harmony ?? 0.5,
                corruption: metrics.corruption ?? 0,
                color: currentColor
            });
        }

        // Update LinkTrailEmitter (if available)
        if (heavyTick && state.trails && state.beads && state.beads.beadToMesh) {
            state.trails.update(visualTime, visualDelta, state.beads.beadToMesh, mainCurve);
        }

        if (heavyTick && state.pulseRing && this.modules.flow) {
            const targetCat = link.target.userData?.category || 'input';
            const targetColor = new THREE.Color(this.getCategoryColor(targetCat));
            const sourceColor = new THREE.Color(state.baseColor);

            state.pulseRing.update(
                mainCurve,
                synergy,
                trafficLoad,
                visualDelta,
                sourceColor,
                targetColor
            );

            if (state.pulseDust) {
                state.pulseRing.mesh.getWorldPosition(this._pulseDustWorldPos);
                state.pulseDust.update({
                    position: this._pulseDustWorldPos,
                    tangent: state.pulseRing.currentTangent,
                    ringScale: state.pulseRing.mesh.scale.x,
                    splitGap: state.pulseRing.currentSplitGap,
                    pulsePhase: state.pulseRing.currentPulsePhase,
                    spinAngle: state.pulseRing.currentSpinAngle,
                    progress: state.pulseRing.progress,
                    dt: visualDelta,
                    sourceColor,
                    targetColor
                });
            }
        }

        // --- 6. Energy Wave Update (Unified Wave Through Strands) ---
        // NOTE:
        // We intentionally run LinkEnergyWave AFTER staged material patches (end of update)
        // so its emissive modulation is not overwritten by earlier patch owners.

        // --- 7. Arc Discharge Update (Ring-triggered Electric Sparks) ---
        if (heavyTick && state.arcDischarges && state.pulseRing && this.modules.flow) {
                const targetCat = link.target.userData?.category || 'input';
                const targetColor = new THREE.Color(this.getCategoryColor(targetCat));
                const ringColor = new THREE.Color(state.baseColor).lerp(targetColor, state.pulseRing.progress);

            // Ring scale from pulse ring oscillation
            const ringScale = state.pulseRing.mesh.scale.x;

            state.arcDischarges.update(
                mainCurve,
                state.pulseRing.progress,
                synergy,
                trafficLoad,
                visualDelta,
                ringColor,
                ringScale,
                frameState,
                metrics?.harmony ?? 1.0,
                metrics?.corruption ?? 0.0
            );
        }

        // --- 8. Visual State Adaptation (Harmony/Corruption/Instability/Synergy Bridge) ---
        if (heavyTick && state.visualStateAdapter) {
            // Extract harmony/corruption/instability/synergy from pre-read metrics
            const harmonyLevel = metrics.harmony ?? 0.5;
            const corruptionLevel = metrics.corruption ?? 0.0;
            const instability = metrics.instability ?? 0.0;
            const synergyLevel = metrics.synergy ?? 0.5;

            state.visualStateAdapter.update(
                link.group,
                harmonyLevel,
                corruptionLevel,
                instability,
                visualDelta,
                synergyLevel,
                frameState
            );
        }

        // Throttled aggregate update-call metrics (1/sec) under audit flag
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_CURVE_AUDIT__ === true) {
            const now = Date.now();
            if (now - (this._conduitUpdateLastLog || 0) >= 1000) {
                const beadsCalls = this._beadsUpdateCalls || 0;
                const sparksCalls = this._sparksUpdateCalls || 0;
                console.log(`[ConduitUpdate] beadsCalls=${beadsCalls} sparksCalls=${sparksCalls}`);
                this._beadsUpdateCalls = 0;
                this._sparksUpdateCalls = 0;
                this._conduitUpdateLastLog = now;
            }
        }

        // --- 9. Directional Energy Streaks (Synergy-driven flow visualization) ---
        if (heavyTick && state.directionalStreaks && this.directionalStreaks && this.modules.streaks) {
            const harmonyLevel = metrics.harmony ?? 0.5;
            const corruptionLevel = metrics.corruption ?? 0.0;
            const instability = metrics.instability ?? 0.0;
            const synergyLevel = metrics.synergy ?? 0.5;

            const sourceColor = new THREE.Color(state.baseColor);
            const targetCat = link.target.userData?.category || 'input';
            const targetColor = new THREE.Color(this.getCategoryColor(targetCat));

            try {
                this.directionalStreaks.update(
                    link.group,
                    mainCurve,
                    visualDelta, // Phase 2A: canonical VisualTime delta
                    synergyLevel,
                    harmonyLevel,
                    corruptionLevel,
                    instability,
                    sourceColor,
                    targetColor,
                    link,
                    visualTime,  // Time source: VisualTime (canonical)
                    frameState
                );
                if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                    console.debug('[StreaksTick]', link.id, 'synergy:', synergyLevel, 'harmony:', harmonyLevel, 'corruption:', corruptionLevel, 'instability:', instability);
                }
            } catch (err) {
                if (typeof window !== 'undefined') {
                    console.error('[DirectionalStreaks][EXCEPTION]', err);
                }
            }
        } else {
            if (typeof window !== 'undefined') {
                console.warn('[DirectionalStreaks] NOT UPDATING - state:', !!state.directionalStreaks, 'manager:', !!this.directionalStreaks, 'link:', link.id);
            }
        }

        // Debug hook: log one sample link per second when enabled
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            if (!this._lastVfxDebugTime || (visualTime - this._lastVfxDebugTime) > 1.0) {
                const beadStats = state.beads?.getStats ? state.beads.getStats() : null;
                const sparkStats = state.sparks?.getDebugStats ? state.sparks.getDebugStats() : null;
                console.log('[LinkParticles]', {
                    linkId: link.id || link.uuid,
                    beadsIntensity: vfx.beadsIntensity,
                    sparksIntensity: vfx.sparksIntensity,
                    beadsActive: beadStats?.active,
                    beadsActivity: beadStats?.activity,
                    sparksSpawned: sparkStats?.spawned
                });
                this._lastVfxDebugTime = visualTime;
            }
        }

        this.updateImpacts(state, visualDelta);

        // Update dissolve particles (if any)
        this.updateDissolves(visualDelta);

        // Apply accumulated material patches deterministically (once per frame)
        if (state.skinMesh?.material) {
            applyMaterialPatch(state.skinMesh.material, materialPatches.skin);
        }
        for (const [strandMesh, patch] of materialPatches.strands.entries()) {
            applyMaterialPatch(strandMesh.material, patch);
        }

        // Final-pass wave modulation (single authoritative per-link flow path).
        if (!state.energyWave && LinkEnergyWave) {
            state.energyWave = new LinkEnergyWave();
        }
        if (state.energyWave && this.modules.flow) {
            const baseEmissiveIntensity = state.strands[0]?.material?.emissiveIntensity || 1.2;
            state.energyWave.update(
                state.strands,
                visualDelta,
                synergy,
                trafficLoad,
                baseEmissiveIntensity
            );
            runtime.energyWaveTicks += 1;
        }
        runtime.lastSynergy = synergy;
        runtime.lastTraffic = trafficLoad;

        if (typeof window !== 'undefined' && window.__ATOMA_STRAND_OWNER_TRACE === true) {
            const trace = strandOwnerState?.trace || {};
            console.log('[StrandOwnerTrace]', {
                linkId: link?.id || link?.uuid || 'unknown-link',
                frame: strandOwnerState?.frame || 0,
                colorEmissive: trace.colorEmissive || 'none',
                opacity: trace.opacity || 'none',
                uLocalLoad: trace.uLocalLoad || 'none',
                corruptionOverrideActive: !!strandOwnerState?.corruptionOverrideActive
            });
        }
    }

    /**
     * Compute normalized VFX inputs with baseline minimums (no gating)
     */
    computeLinkVfxInput(frameState) {
        const metrics = frameState?.metrics || {};
        const synergy = metrics.synergy ?? 0.5;
        const harmony = metrics.harmony ?? 0.5;
        const corruption = metrics.corruption ?? 0.0;
        const load = metrics.loadPressure ?? 0.0;

        const out = this._vfxInput;
        // Raise baselines so VFX stay visible even at low activity
        out.baseIntensity = Math.max(0.25,
            0.35 * synergy +
            0.25 * harmony +
            0.15 * (1 - corruption) +
            0.15 * load);

        out.beadsIntensity = Math.max(0.20,
            0.5 * synergy +
            0.2 * harmony +
            0.2 * load +
            0.1 * corruption);

        const corrLoad = Math.max(corruption, load);
        out.sparksIntensity = Math.max(0.3,
            0.4 * corrLoad +
            0.2 * (synergy || 0.15)); // [FIX] Minimum 0.15 synergy for new links to show sparks

        out.widthMul = remap(out.baseIntensity, 0.15, 1.0, 0.9, 1.3);
        out.speedMul = remap(out.baseIntensity, 0.15, 1.0, 0.8, 1.4);
        out.colorBias = clamp01(corruption * 0.8);

        return out;
    }

    /**
     * Spawn dissolve particle burst on link removal.
     */
    _spawnDissolveEffect(link, state) {
        const curve = link.curve;
        if (!curve || !this.scene) return;

        const pointCount = 48;
        const positions = new Float32Array(pointCount * 3);
        const velocities = new Float32Array(pointCount * 3);
        for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const p = curve.getPoint(t);
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
            // Velocity: along tangent + random spread
            const dir = curve.getTangent(t);
            dir.normalize().multiplyScalar(0.6);
            dir.x += (Math.random() - 0.5) * 0.6;
            dir.y += (Math.random() - 0.5) * 0.6;
            dir.z += (Math.random() - 0.5) * 0.6;
            velocities[i * 3] = dir.x;
            velocities[i * 3 + 1] = dir.y;
            velocities[i * 3 + 2] = dir.z;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const color = new THREE.Color(state?.baseColor || 0x00ffcc);
        const mat = new THREE.PointsMaterial({
            color,
            size: 0.05,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        this._registerLinkMaterialWithBridge(mat);

        const points = new THREE.Points(geom, mat);
        points.userData = {
            velocities,
            age: 0,
            maxAge: 0.6
        };

        this.conduitRoot.add(points);
        this._dissolveEffects.push(points);
    }

    /**
     * Update dissolve particle bursts.
     */
    updateDissolves(dt) {
        if (!this._dissolveEffects.length) return;
        const toRemove = [];
        for (const pts of this._dissolveEffects) {
            const ud = pts.userData || {};
            ud.age += dt;
            const positions = pts.geometry.attributes.position.array;
            const velocities = ud.velocities;
            const lifeT = Math.min(1, ud.age / ud.maxAge);
            const fade = 1 - lifeT;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * dt;
                positions[i + 1] += velocities[i + 1] * dt;
                positions[i + 2] += velocities[i + 2] * dt;
            }
            pts.geometry.attributes.position.needsUpdate = true;
            pts.material.opacity = 0.85 * fade;
            pts.material.size = 0.05 * (0.5 + fade);
            if (ud.age >= ud.maxAge) {
                toRemove.push(pts);
            }
        }
        for (const pts of toRemove) {
            this.scene.remove(pts);
            pts.geometry.dispose();
            pts.material.dispose();
        }
        this._dissolveEffects = this._dissolveEffects.filter(p => !toRemove.includes(p));
    }

    /**
     * Read link metrics once per frame into a canonical structure.
     * Returns safe defaults if fields are missing.
     */
     _readLinkMetrics(link) {
        const m = link?.userData?.metrics;
        if (!m) {
            return {
                synergy: 0,
                harmony: 0,
                corruption: 0,
                stability: 1,
                instability: 0,
                loadPressure: 0
            };
        }

        return {
            synergy: m.synergy ?? 0,
            harmony: m.harmony ?? 0,
            corruption: m.corruption ?? 0,
            stability: m.stability ?? 1,
            instability: 1 - (m.stability ?? 1),
            loadPressure: m.loadPressure ?? 0
        };
    }

    getCategoryColor(category) {
        const colors = {
            'input': 0x00ddff, 'process': 0xffaa00, 'integration': 0x00ff88,
            'analytics': 0xaa00ff, 'storage': 0x88ccff, 'control': 0xff0088,
            'quantum': 0x00ffff, 'sigma': 0x00ff00, 'emotional': 0xff8800,
            'mythic': 0x9933ff, 'prime': 0xffd700, 'error': 0xffffff
        };
        return colors[category] || 0xcccccc;
    }

    _getNodeId(node) {
        return node?.userData?.nodeId ?? node?.id ?? node?.uuid ?? null;
    }

    _initMetricSubscription() {
        const semanticBus = globalThis.semanticBus;
        const subscribe = semanticBus?.subscribe;
        if (typeof subscribe !== 'function') {
            return;
        }

        const handler = (payload = {}) => {
            const nodeId = payload?.nodeId;
            const metric = payload?.metric;
            const value = payload?.value;
            if (nodeId === undefined || nodeId === null || typeof metric !== 'string') {
                return;
            }

            const normalized = this._sanitizeMetricValue(metric, value);
            if (normalized === null) {
                return;
            }

            const key = String(nodeId);
            const cached = this._nodeMetricCache.get(key) || {};
            cached[metric] = normalized;
            this._nodeMetricCache.set(key, cached);
        };

        this._metricSubscriptionDisposer = subscribe.call(semanticBus, 'metric.node.updated', handler);
        this._hasMetricSubscription = true;
    }

    _sanitizeMetricValue(metric, value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return null;
        }
        switch (metric) {
            case 'synergy':
            case 'harmony':
            case 'stability':
            case 'corruption':
            case 'loadPressure':
                return Math.max(0, Math.min(1, value));
            default:
                return null;
        }
    }

    _readNodeCorruption(node) {
        const readMetric = (...values) => {
            for (const value of values) {
                if (typeof value === 'number' && Number.isFinite(value)) {
                    return Math.max(0, Math.min(1, value));
                }
            }
            return 0;
        };

        const nodeId = this._getNodeId(node);
        const cached = nodeId !== null ? this._nodeMetricCache.get(String(nodeId)) : null;

        return readMetric(
            node?.userData?.metrics?.corruption,
            node?.userData?.corruption,
            cached?.corruption
        );
    }

    _getLinkFeedbackNode(link) {
        return link?.target || link?.targetNode || link?.to || link?.source || link?.sourceNode || link?.from || null;
    }

    _updateCorruptionFeedbackTriggers(links) {
        if (!this.corruptionFeedbackVisuals || !Array.isArray(links) || links.length === 0) return;

        const nowMs = performance.now();
        const thresholds = this._corruptionFeedbackThresholds;
        const seenNodeIds = new Set();
        const liveLinkIds = new Set();

        for (const link of links) {
            if (!link || !link.id) continue;
            liveLinkIds.add(link.id);

            const metrics = link?.group?.userData?.conduitState?.metrics || this._readLinkMetrics(link);
            const corruption = Math.max(0, Math.min(1, metrics?.corruption ?? 0));
            const anchorNode = this._getLinkFeedbackNode(link);

            const linkState = this._corruptionFeedbackLinkState.get(link.id) || {
                lastCorruption: 0,
                seedLatched: false,
                cascadeLatched: false,
                lastPulseTime: -Infinity
            };

            // Rising seed crossing
            if (!linkState.seedLatched &&
                linkState.lastCorruption < thresholds.linkSeed &&
                corruption >= thresholds.linkSeed) {
                this.corruptionFeedbackVisuals.displayCorruptionSeed?.(anchorNode);
                linkState.seedLatched = true;
            }
            // Rising cascade crossing
            if (!linkState.cascadeLatched &&
                linkState.lastCorruption < thresholds.linkCascade &&
                corruption >= thresholds.linkCascade) {
                this.corruptionFeedbackVisuals.displayCascadeWarning?.(anchorNode);
                linkState.cascadeLatched = true;
            }
            // Downward recovery crossing
            if (linkState.lastCorruption >= thresholds.linkRecoveryFrom &&
                corruption <= thresholds.linkRecovery &&
                nowMs - linkState.lastPulseTime >= thresholds.pulseCooldownMs) {
                this.corruptionFeedbackVisuals.displayHarmonyPulse?.(anchorNode);
                linkState.lastPulseTime = nowMs;
            }

            if (linkState.seedLatched && corruption <= thresholds.linkSeedReset) {
                linkState.seedLatched = false;
            }
            if (linkState.cascadeLatched && corruption <= thresholds.linkCascadeReset) {
                linkState.cascadeLatched = false;
            }

            linkState.lastCorruption = corruption;
            this._corruptionFeedbackLinkState.set(link.id, linkState);

            // Node-level crossing detector (source + target), deduplicated per tick.
            const candidates = [
                link?.source || link?.sourceNode || link?.from || null,
                link?.target || link?.targetNode || link?.to || null
            ];
            for (const node of candidates) {
                const nodeId = this._getNodeId(node);
                if (!node || nodeId === null || seenNodeIds.has(nodeId)) continue;
                seenNodeIds.add(nodeId);

                const nodeCorruption = this._readNodeCorruption(node);
                const nodeState = this._corruptionFeedbackNodeState.get(nodeId) || {
                    lastCorruption: 0,
                    seedLatched: false,
                    cascadeLatched: false,
                    lastPulseTime: -Infinity
                };

                if (!nodeState.seedLatched &&
                    nodeState.lastCorruption < thresholds.nodeSeed &&
                    nodeCorruption >= thresholds.nodeSeed) {
                    this.corruptionFeedbackVisuals.displayCorruptionSeed?.(node);
                    nodeState.seedLatched = true;
                }
                if (!nodeState.cascadeLatched &&
                    nodeState.lastCorruption < thresholds.nodeCascade &&
                    nodeCorruption >= thresholds.nodeCascade) {
                    this.corruptionFeedbackVisuals.displayCascadeWarning?.(node);
                    nodeState.cascadeLatched = true;
                }
                if (nodeState.lastCorruption >= thresholds.nodeRecoveryFrom &&
                    nodeCorruption <= thresholds.nodeRecovery &&
                    nowMs - nodeState.lastPulseTime >= thresholds.pulseCooldownMs) {
                    this.corruptionFeedbackVisuals.displayHarmonyPulse?.(node);
                    nodeState.lastPulseTime = nowMs;
                }

                if (nodeState.seedLatched && nodeCorruption <= thresholds.nodeSeedReset) {
                    nodeState.seedLatched = false;
                }
                if (nodeState.cascadeLatched && nodeCorruption <= thresholds.nodeCascadeReset) {
                    nodeState.cascadeLatched = false;
                }

                nodeState.lastCorruption = nodeCorruption;
                this._corruptionFeedbackNodeState.set(nodeId, nodeState);
            }
        }

        // Cleanup stale link detector state.
        for (const linkId of this._corruptionFeedbackLinkState.keys()) {
            if (!liveLinkIds.has(linkId)) this._corruptionFeedbackLinkState.delete(linkId);
        }
    }

    _getImpactMaterial(colorHex) {
        const key = colorHex >>> 0;
        const stack = this._impactMaterialPool.get(key);
        if (stack && stack.length > 0) {
            const mat = stack.pop();
            mat.opacity = 0.0; // start fully transparent; animated in updateImpacts
            return mat;
        }

        const mat = new THREE.MeshBasicMaterial({
            color: key,
            opacity: 0.0,
            wireframe: true,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });
        this._registerLinkMaterialWithBridge(mat);
        ensureUserData(mat);
        mat.userData.__owner = 'LinkRenderer';
        mat.userData.__domain = 'link';
        freezeMaterialFlags(mat, 'LinkRenderer');
        return mat;
    }

    _returnImpactMaterial(mat) {
        if (!mat) return;
        const key = mat.color?.getHex ? mat.color.getHex() >>> 0 : 0;
        if (!this._impactMaterialPool.has(key)) {
            this._impactMaterialPool.set(key, []);
        }
        const stack = this._impactMaterialPool.get(key);
        if (stack.length < this._impactPoolMaxSize) {
            mat.opacity = 0.0;
            stack.push(mat);
        } else {
            mat.dispose();
        }
    }

    triggerNodeImpact(state, node, bead) {
        if (!node) return;
        const category = node.userData?.category || 'input';
        const color = this.getCategoryColor(category);
        const beadSize = bead?.size || 'medium';
        const variantRand = Math.random();
        const jitterRand = Math.random();

        // Create impact geometry based on category
        const group = new THREE.Group();
        let geometry;

        const chooseVariant = (variants, r) => variants[Math.floor(r * variants.length) % variants.length];
        const makeCrateredSphere = () => {
            const g = new THREE.IcosahedronGeometry(0.5, 1);
            const pos = g.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const amp = 0.08 * (Math.random() - 0.5);
                pos.setXYZ(
                    i,
                    pos.getX(i) * (1 + amp),
                    pos.getY(i) * (1 + amp),
                    pos.getZ(i) * (1 + amp)
                );
            }
            pos.needsUpdate = true;
            g.computeVertexNormals();
            return g;
        };
        const makeSpikedHalo = () => {
            const g = new THREE.IcosahedronGeometry(0.45, 1);
            const pos = g.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const amp = 0.12 * (0.5 + Math.random());
                pos.setXYZ(
                    i,
                    pos.getX(i) * (1 + amp),
                    pos.getY(i) * (1 + amp),
                    pos.getZ(i) * (1 + amp)
                );
            }
            pos.needsUpdate = true;
            g.computeVertexNormals();
            return g;
        };
        const makeWaveSlice = () => {
            const g = new THREE.PlaneGeometry(1.1, 1.1, 10, 4);
            const pos = g.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const z = pos.getZ(i);
                const y = Math.sin((x + z) * 4.0) * 0.08;
                pos.setY(i, y);
            }
            pos.needsUpdate = true;
            g.computeVertexNormals();
            return g;
        };
        const makeLemniscate = () => {
            const pts = [];
            const a = 0.38;
            for (let i = 0; i <= 40; i++) {
                const t = (i / 40) * Math.PI * 2;
                const x = a * Math.sin(t);
                const z = a * Math.sin(t) * Math.cos(t);
                pts.push(new THREE.Vector3(x, 0, z));
            }
            const curve = new THREE.CatmullRomCurve3(pts, true);
            return new THREE.TubeGeometry(curve, 40, 0.045, 6, true);
        };
        const makeTwistedRibbon = () => {
            const pts = [];
            const r = 0.4;
            for (let i = 0; i <= 32; i++) {
                const t = (i / 32) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
            }
            const curve = new THREE.CatmullRomCurve3(pts, true);
            return new THREE.TubeGeometry(curve, 32, 0.05, 5, true);
        };
        const makeStarPrism = () => {
            const g = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 6, 1, true);
            g.rotateY(Math.PI / 12);
            return g;
        };
        const makeGyroideDisk = () => new THREE.CylinderGeometry(0.55, 0.35, 0.12, 12, 1, true);
        const makeDoubleDiscs = () => new THREE.CylinderGeometry(0.55, 0.45, 0.1, 14, 1, true);
        const makeHexFrame = () => new THREE.CylinderGeometry(0.5, 0.5, 0.08, 6, 1, true);

        switch (category) {
            case 'input':
                geometry = chooseVariant([
                    new THREE.RingGeometry(0.35, 0.5, 24),
                    new THREE.TorusKnotGeometry(0.34, 0.06, 46, 7, 3, 2), // triquetra/pretzel
                    new THREE.DodecahedronGeometry(0.45, 0),
                    makeWaveSlice()
                ], variantRand);
                break;
            case 'process':
                geometry = chooseVariant([
                    makeStarPrism(),
                    makeWaveSlice(),
                    new THREE.TorusKnotGeometry(0.32, 0.08, 40, 7)
                ], variantRand);
                break;
            case 'control':
                geometry = chooseVariant([
                    new THREE.OctahedronGeometry(0.6, 0),
                    new THREE.TetrahedronGeometry(0.65, 0),
                    new THREE.DodecahedronGeometry(0.55, 0),
                    makeLemniscate()
                ], variantRand);
                break;
            case 'storage':
                geometry = chooseVariant([
                    makeGyroideDisk(),
                    makeDoubleDiscs(),
                    new THREE.CapsuleGeometry(0.32, 0.22, 6, 10)
                ], variantRand);
                break;
            case 'analytics':
                geometry = chooseVariant([
                    new THREE.RingGeometry(0.32, 0.5, 18),
                    new THREE.IcosahedronGeometry(0.5, 0),
                    makeHexFrame()
                ], variantRand);
                break;
            case 'integration':
                geometry = chooseVariant([
                    makeTwistedRibbon(),
                    new THREE.TorusKnotGeometry(0.28, 0.07, 40, 6),
                    new THREE.DodecahedronGeometry(0.5, 1)
                ], variantRand);
                break;
            case 'emotional':
                geometry = chooseVariant([
                    new THREE.OctahedronGeometry(0.55, 1),
                    makeLemniscate(),
                    new THREE.TorusKnotGeometry(0.28, 0.08, 48, 6)
                ], variantRand);
                break;
            case 'sigma':
                geometry = chooseVariant([
                    new THREE.OctahedronGeometry(0.55, 1),
                    makeSpikedHalo(),
                    new THREE.CapsuleGeometry(0.38, 0.18, 6, 8)
                ], variantRand);
                break;
            case 'quantum':
                geometry = chooseVariant([
                    makeCrateredSphere(),
                    new THREE.OctahedronGeometry(0.5, 1),
                    new THREE.IcosahedronGeometry(0.45, 1)
                ], variantRand);
                break;
            case 'prime':
                geometry = chooseVariant([
                    new THREE.DodecahedronGeometry(0.55, 0),
                    new THREE.TorusKnotGeometry(0.32, 0.09, 40, 5)
                ], variantRand);
                break;
            case 'error':
                geometry = chooseVariant([
                    new THREE.IcosahedronGeometry(0.55, 0),
                    new THREE.TetrahedronGeometry(0.6, 1),
                    makeCrateredSphere()
                ], variantRand);
                break;
            case 'mythic':
                geometry = chooseVariant([
                    new THREE.TorusKnotGeometry(0.35, 0.08, 48, 6),
                    new THREE.IcosahedronGeometry(0.6, 1)
                ], variantRand);
                break;
            default:
                geometry = chooseVariant([
                    new THREE.IcosahedronGeometry(0.6, 1),
                    new THREE.SphereGeometry(0.55, 14, 10),
                    new THREE.TorusKnotGeometry(0.32, 0.08, 48, 6)
                ], variantRand);
        }

        // PHASE S-5: Variant properties set at creation time, then frozen
        // NO runtime mutations to transparent, depthWrite, depthTest, side, blending allowed
        const meshMaterial = this._getImpactMaterial(color);
        const mesh = new THREE.Mesh(geometry, meshMaterial);
        mesh.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const impactOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
        TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: impactOrder });
        ensureUserData(mesh);
        mesh.userData.__depthAuthorityLocked = true;

        group.add(mesh);
        group.position.copy(node.position);

        const scaleMult = beadSize === 'large' ? 1.5 : (beadSize === 'small' ? 0.5 : 1.0);
        const jitterScale = 0.9 + jitterRand * 0.2; // ±10%
        group.scale.setScalar(0.01 * jitterScale); // Start near-zero so center stays visually quiet at spawn

        // Subtle rotation jitter for variation
        group.rotation.set(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );

        Object.assign(ensureUserData(group), { age: 0, duration: 0.5, maxScale: 2.0 * scaleMult, mesh: mesh });

        this.conduitRoot.add(group);
        state.impacts.push(group);
    }

    updateImpacts(state, dt) {
        if (!state.impacts) return;
        for (let i = state.impacts.length - 1; i >= 0; i--) {
            const grp = state.impacts[i];
            const data = grp.userData;
            data.age += dt;
            const p = data.age / data.duration;

            if (p >= 1) {
                if (grp.parent) grp.parent.remove(grp);
                grp.traverse(o => {
                    if(o.geometry) o.geometry.dispose();
                    if(o.material) this._returnImpactMaterial(o.material);
                });
                state.impacts.splice(i, 1);
            } else {
                const ease = 1 - Math.pow(1 - p, 3);
                grp.scale.setScalar(data.maxScale * ease);
                if (data.mesh) {
                    // Fade-in then fade-out: transparent at start/end, visible only during active pulse
                    const pulseAlpha = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
                    data.mesh.material.opacity = 0.55 * pulseAlpha;
                }
                grp.rotation.z += dt * 2;
                grp.rotation.y += dt;
            }
        }
    }

    /**
     * Select a limited set of links for heavy effects based on camera distance.
     */
    _selectHeavyLinks(links, camera, maxDist = 60, maxCount = 8) {
        if (!Array.isArray(links) || links.length === 0) return null;
        if (!camera?.position) return new Set(links.map(l => l?.id));
        const camPos = camera.position;
        const scored = [];
        for (const link of links) {
            if (!link) continue;
            const gid = link.id ?? link.userData?.id;
            if (gid === undefined) continue;
            const pos = link.group?.position || link.target?.position || link.source?.position;
            if (!pos) {
                scored.push({ id: gid, dist: 0 });
                continue;
            }
            const dist = pos.distanceTo(camPos);
            scored.push({ id: gid, dist });
        }
        scored.sort((a, b) => a.dist - b.dist);
        const allowed = new Set();
        for (const s of scored) {
            if (allowed.size >= maxCount) break;
            if (s.dist <= maxDist) {
                allowed.add(s.id);
            }
        }
        return allowed.size ? allowed : new Set(scored.slice(0, maxCount).map(s => s.id));
    }

    _getLinkOwnerId(linkOrId) {
        if (linkOrId === undefined || linkOrId === null) return null;
        if (typeof linkOrId === 'string' || typeof linkOrId === 'number') return linkOrId;
        return (
            linkOrId.id ??
            linkOrId.uuid ??
            linkOrId.userData?.id ??
            linkOrId.userData?.linkId ??
            null
        );
    }

    _disposeObjectTree(root) {
        if (!root) return;
        root.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose?.();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
                else obj.material.dispose?.();
            }
        });
    }

    clearLinkAuxVisuals(linkOrId) {
        const ownerId = this._getLinkOwnerId(linkOrId);
        if (ownerId === null || ownerId === undefined) return 0;

        let removed = 0;
        const roots = [this.scene, this.conduitRoot].filter(Boolean);
        roots.forEach((root) => {
            const toRemove = [];
            root.traverse((obj) => {
                if (obj?.userData?.__linkOwnerId === ownerId) {
                    toRemove.push(obj);
                }
            });
            toRemove.forEach((obj) => {
                obj.parent?.remove?.(obj);
                this._disposeObjectTree(obj);
                removed += 1;
            });
        });

        return removed;
    }

    disposeLinkVisuals(linkGroup, link = null) {
        const state = linkGroup?.userData?.conduitState;

        // Spawn dissolve burst before tearing down
        if (state && this.modules.dissolve && link && link.curve) {
            this._spawnDissolveEffect(link, state);
        }

        // Unregister from interference manager if link provided
        if (link && this.nodeInterferenceManager) {
            this.nodeInterferenceManager.unregisterLinkFromNodes(link, link.source, link.target);
        }

        // Dispose corruption animation state
        if (link && this.corruptionAnimator && link.id) {
            this.corruptionAnimator.disposeLinkAnimation(link.id);
        }

        // Clear corruption particles for this link
        if (link && this.corruptionParticles && link.id) {
            this.corruptionParticles.clearLinkParticles(link.id);
        }

        // Dispose trail particle emitter for this link
        if (link && this.trailEmitters && link.id) {
            const emitter = this.trailEmitters.get(link.id);
            if (emitter) {
                emitter.disable();
            }
            this.trailEmitters.delete(link.id);
        }
        // Clear trail particles still in the shared system
        if (link && this.trailParticles && link.id) {
            this.trailParticles.clearLink(link.id);
        }

        // Clear semantic pictograms for this link immediately on unlink
        if (link && this.pictogramSystem?.clearLink) {
            this.pictogramSystem.clearLink(link);
        }

        // Dispose healing particle emitter for this link
        if (link && this.healingEmitters && link.id) {
            const emitter = this.healingEmitters.get(link.id);
            if (emitter) {
                emitter.disable();
            }
            this.healingEmitters.delete(link.id);
        }

        if (state) {
            this._disposeStrandFilaments(state);
            state.strands.forEach(m => {
                if(m.geometry) m.geometry.dispose();
                if(m.material) m.material.dispose();
            });

            if (state.skinMesh) {
                if(state.skinMesh.geometry) state.skinMesh.geometry.dispose();
                if(state.skinMesh.material) state.skinMesh.material.dispose();
            }

            if (state.beads) state.beads.dispose();
            if (state.sparks) state.sparks.dispose();
            if (state.trails) state.trails.dispose();
            if (state.rings) state.rings.dispose();

            if (state.pulseRing) state.pulseRing.dispose();
            if (state.pulseDust) state.pulseDust.dispose();
            if (state.energyWave) state.energyWave = null;
            if (state.arcDischarges) state.arcDischarges.dispose();
            if (state.visualStateAdapter) state.visualStateAdapter.dispose();
            if (state.dockSpray) state.dockSpray.dispose();
            if (state.sourceInjection) state.sourceInjection.dispose();

            if (state.directionalStreaks && this.directionalStreaks) {
                this.directionalStreaks.dispose(state.directionalStreaks);
            }

            state.impacts.forEach(g => {
                if (g.parent) g.parent.remove(g);
                g.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) this._returnImpactMaterial(o.material); });
            });
            state.impacts = [];
        }

        // Final cleanup: remove the link group from scene graph and dispose remaining geometries/materials
        if (linkGroup?.parent) {
            linkGroup.parent.remove(linkGroup);
        }
        if (linkGroup) {
            this._disposeObjectTree(linkGroup);
        }

        // Defensive orphan cleanup for effects attached directly to scene
        if (link) {
            this.clearLinkAuxVisuals(link);
        }
    }

    /**
     * Global pictogram tick (once per frame, outside per-link loop)
     */
    updatePictograms(deltaTime, time) {
        if (this.pictogramSystem?.enabled) {
            if (!this._picDiagTicked) {
                console.error('[PicDiag] updatePictograms entry');
                this._picDiagTicked = true;
            }
            try {
                this.pictogramSystem.update(deltaTime || 0.016, time || performance.now(), this.camera);
            } catch (err) {
                console.error('[PicDiag] pictogram update error', err);
            }
        }
    }

    /**
     * Dispose and cleanup the renderer
     */
    dispose() {
        if (typeof this._metricSubscriptionDisposer === 'function') {
            this._metricSubscriptionDisposer();
        }
        this._metricSubscriptionDisposer = null;
        this._nodeMetricCache.clear();
        if (this.nodeInterferenceManager) {
            this.nodeInterferenceManager.dispose();
        }
        if (this.nodeHarmonicManager) {
            this.nodeHarmonicManager.dispose();
        }
        if (this.corruptionSpreadAnimator) {
            this.corruptionSpreadAnimator.dispose();
        }
        if (this.corruptionParticleSystem) {
            this.corruptionParticleSystem.dispose();
        }
        if (this.corruptionMorphing?.dispose) {
            this.corruptionMorphing.dispose();
        }
        if (this.trailParticles) {
            this.trailParticles.dispose();
        }
        if (this.trailEmitters) {
            this.trailEmitters.clear();
        }
        if (this.healingParticles) {
            this.healingParticles.dispose();
        }
        if (this.healingEmitters) {
            this.healingEmitters.clear();
        }
        if (this.flowTexture) {
            this.flowTexture.dispose();
        }
        if (this.pictogramSystem) {
            this.pictogramSystem.dispose?.();
        }
        if (this.conduitRoot?.parent) {
            this.conduitRoot.parent.remove(this.conduitRoot);
        }
    }

    /**
   * Rebind system references after world switch
   * Updates linkSystem and frameScheduler to prevent stale references
   */
    rebind({ linkSystem, frameScheduler }) {
        if (linkSystem !== undefined) {
            this.linkSystem = linkSystem;
        }
        if (frameScheduler !== undefined) {
            this.frameScheduler = frameScheduler;
        }
        // scene and camera are not updated during rebind as they typically don't change on world switch
        // Other internal systems (waveTravelShaderPack, etc.) are not rebindable and assume stable references
    }
}
