import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

const SPARK_RENDER_ORDER = VisualHierarchyRegistry.getRenderOrder('LINK_SPARKS');

const SPARK_VS = `
attribute float aSpawnTime;
attribute float aLifeTime;
attribute float aT;            // Position along curve (0.0 - 1.0)
attribute float aAngle;        // Radial angle around rope
attribute float aSpeed;        // Drift speed
attribute float aSize;         // Particle size

uniform float uTime;
uniform vec3 uStart;
uniform vec3 uMid;
uniform vec3 uEnd;
uniform float uThickness;      // Radius of the rope
uniform float uPulse;

varying float vAlpha;
varying float vLifeProgress;
varying float vSpeed;

// Quadratic Bezier Function
vec3 getBezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
    float oneMinusT = 1.0 - t;
    return oneMinusT * oneMinusT * p0 + 
           2.0 * oneMinusT * t * p1 + 
           t * t * p2;
}

// Derivative for Tangent
vec3 getBezierTangent(vec3 p0, vec3 p1, vec3 p2, float t) {
    return 2.0 * (1.0 - t) * (p1 - p0) + 2.0 * t * (p2 - p1);
}

void main() {
    float age = uTime - aSpawnTime;
    
    // Check if particle is alive
    if (age < 0.0 || age > aLifeTime) {
        gl_Position = vec4(0.0, 0.0, 0.0, 0.0); // Discard
        vAlpha = 0.0;
        return;
    }

    // Normalized life progress (0.0 to 1.0)
    vLifeProgress = age / aLifeTime;
    vSpeed = aSpeed;

    // 1. Calculate Base Position on Curve
    vec3 curvePos = getBezierPoint(uStart, uMid, uEnd, aT);
    vec3 tangent = normalize(getBezierTangent(uStart, uMid, uEnd, aT));

    // 2. Calculate Radial Offset (Rope Surface)
    // Arbitrary consistent axis for coordinate system
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(tangent, up));
    if (length(right) < 0.01) {
        right = normalize(cross(tangent, vec3(1.0, 0.0, 0.0)));
    }
    vec3 normal = cross(right, tangent);

    // Radial vector based on angle
    vec3 radialDir = normalize(right * cos(aAngle) + normal * sin(aAngle));
    
    // Start at rope surface
    vec3 startPos = curvePos + radialDir * uThickness;

    // 3. Apply Drift (Motion)
    // Drift outward from surface + slight upward float
    vec3 drift = radialDir * (aSpeed * age) + vec3(0.0, 0.1, 0.0) * (age * age);
    
    vec3 finalPos = startPos + drift;

    // 4. Output
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation (smaller as it fades)
    // Distance attenuation (no velocity stretch)
    gl_PointSize = aSize * (10.0 / -mvPosition.z);

    // Alpha Fade: Quick in, Slow out
    float fadeIn = smoothstep(0.0, 0.2, vLifeProgress);
    float fadeOut = 1.0 - smoothstep(0.5, 1.0, vLifeProgress);
    vAlpha = fadeIn * fadeOut;
}
`;
const SPARK_FS = `
uniform vec3 uColor;
uniform float uOpacity;

varying float vAlpha;
varying float vLifeProgress;
varying float vSpeed;

void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;

    // Rotate the star over its lifetime for subtle twinkle
    float a = vLifeProgress * 6.2831853;
    float s = sin(a);
    float c = cos(a);
    p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

    float r = length(p);

    float armX = 1.0 - abs(p.x);
    float armY = 1.0 - abs(p.y);

    float star = max(armX, armY);
    star = pow(star, 4.0);

    float core = 1.0 - r;
    star = max(star, core);

    star = smoothstep(0.2, 0.8, star);

    if (star <= 0.01) discard;

    gl_FragColor = vec4(uColor, star * vAlpha * uOpacity * (0.7 + vSpeed * 0.6));
}
`;

let __sparkMaterialBase;
const DEBUG_SPARKS = false;

function getSparkMaterialBase() {
    if (!__sparkMaterialBase) {
        __sparkMaterialBase = new THREE.ShaderMaterial({
            vertexShader: SPARK_VS,
            fragmentShader: SPARK_FS,
            // Per-instance uniforms are injected after clone
            uniforms: {},
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });
    }
    return __sparkMaterialBase;
}

export class LinkSparkSystem {
    constructor(scene, maxSparks = 60) {
        if (DEBUG_SPARKS) console.log("SPARK SYSTEM CONSTRUCTED");
        this.scene = scene;
        this.maxSparks = maxSparks;
        this.pointFXBase = new LinkPointFXBase(this.scene, {
            renderLayer: 'LINK_SPARKS',
            preset: 'spark',
            capacity: this.maxSparks,
            textureKind: 'spark'
        });
        this.spawnIndex = 0;
        this._debugSpawned = 0;

        // Configuration
        this.config = {
            baseColor: new THREE.Color(0xffaa00),
            baseOpacity: 0.0, // Default off
            thickness: 0.05
        };

        // Initialize
        this.initSystem();
    }

    initSystem() {
        // Attributes
        const spawnTimes = new Float32Array(this.maxSparks); // When it was born
        const lifeTimes = new Float32Array(this.maxSparks);  // How long it lives
        const tValues = new Float32Array(this.maxSparks);    // Where on curve
        const angles = new Float32Array(this.maxSparks);     // Angle around rope
        const speeds = new Float32Array(this.maxSparks);     // Drift speed
        const sizes = new Float32Array(this.maxSparks);      // Particle size

        // Init with negative spawn times (inactive)
        for(let i=0; i<this.maxSparks; i++) {
            spawnTimes[i] = -100.0;
        }

        const geometry = this.pointFXBase.createGeometry({
            aSpawnTime: { itemSize: 1 },
            aLifeTime: { itemSize: 1 },
            aT: { itemSize: 1 },
            aAngle: { itemSize: 1 },
            aSpeed: { itemSize: 1 },
            aSize: { itemSize: 1 }
        });

        geometry.setAttribute('aSpawnTime', new THREE.BufferAttribute(spawnTimes, 1));
        geometry.setAttribute('aLifeTime', new THREE.BufferAttribute(lifeTimes, 1));
        geometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1));
        geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
        geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        this.geometry = geometry;
        
        if (DEBUG_SPARKS) console.log("SPARK GEOM", geometry.attributes.position.count);

        // Uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uStart: { value: new THREE.Vector3() },
            uMid: { value: new THREE.Vector3() },
            uEnd: { value: new THREE.Vector3() },
            uThickness: { value: 0.6 },
            uPulse: { value: 0 },
            uColor: { value: new THREE.Color(0xffffff) },
            uOpacity: { value: 0.75 }
        };

        // Restore shader material for sparks
        const material = this.pointFXBase.createMaterial({
            uniforms: this.uniforms,
            vertexShader: SPARK_VS,
            fragmentShader: SPARK_FS,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            toneMapped: false,
            vertexColors: false
        });

        this.points = new THREE.Points(geometry, material);
        this.points.frustumCulled = false; // Always render
        this.points.matrixAutoUpdate = false;
        this.points.updateMatrix();
        this.points.renderOrder = SPARK_RENDER_ORDER;
        applyLinkRenderLayer(this.points, 'LINK_SPARKS');
        const ud = this.points.userData || (Object.defineProperty(this.points, 'userData', { value: {}, writable: true, configurable: true }), this.points.userData);
        Object.assign(ud, { isSparkSystem: true });
        if (DEBUG_SPARKS) console.log('SPARK MESH', this.points);
        
        // Add to scene
        this.pointFXBase.ensureAttached(this.points);
    }

    getMesh() {
        return this.points;
    }

    /**
     * Update system state
     * @param {number} time - Global time
     * @param {number} deltaTime - Frame delta
     * @param {Object} curve - QuadraticBezierCurve3
     * @param {Object} stats - { synergy, traffic, load }
     * @param {THREE.Color} color - Base link color
     * @param {boolean|number} spawnEnabled - Enable spawning (or LOD level: 0=full, 1=medium, 2=low, 3=skip)
     * @param {number} lodLevel - Distance LOD level (0-3)
     */
    update(time, deltaTime, curve, stats, color, spawnEnabled = true, lodLevel = 0) {
        // Active particle estimate for debugging
        const geo = this.points?.geometry || this.geometry;
        if (!geo || !geo.attributes?.aSpawnTime || !geo.attributes?.aLifeTime) {
            console.warn('SPARK UPDATE skipped: geometry missing');
            return;
        }
        const posAttr = geo.attributes.position;
        if (DEBUG_SPARKS && posAttr?.array) {
            console.log('SPARK POS SAMPLE', Array.from(posAttr.array.slice(0, 12)));
        }
        const spawnTimes = geo.attributes.aSpawnTime.array;
        const lifeTimes = geo.attributes.aLifeTime.array;
        let active = 0;
        for (let i = 0; i < this.maxSparks; i++) {
            if (time - spawnTimes[i] < lifeTimes[i] && spawnTimes[i] >= 0) {
                active++;
            }
        }
        this.activeCount = active;
        this._logAccum = (this._logAccum || 0) + deltaTime;
        if (DEBUG_SPARKS && this._logAccum >= 10) {
            console.log('SPARK UPDATE', this.activeCount);
            this._logAccum = 0;
        }

        // 1. Update Uniforms
        this.uniforms.uTime.value = time;
        
        // Update Curve Control Points
        // We assume curve is QuadraticBezierCurve3
        if (curve && curve.v0 && curve.v1 && curve.v2) {
            this.uniforms.uStart.value.copy(curve.v0);
            this.uniforms.uMid.value.copy(curve.v1);
            this.uniforms.uEnd.value.copy(curve.v2);
        }

        // Color Handling
        // Desaturate the input color slightly for sparks
        const sparkColor = color.clone();
        const hsl = {};
        sparkColor.getHSL(hsl);
        sparkColor.setHSL(hsl.h, hsl.s * 0.7, Math.min(1.0, hsl.l * 1.5)); // Brighter, less saturated
        // color jitter
        sparkColor.offsetHSL(
        (Math.random() - 0.5) * 0.08,
         0,
        (Math.random() - 0.5) * 0.1
         );
        this.uniforms.uColor.value.copy(sparkColor);

        // 2. Spawn Logic
        // Combined activity metric (0.0 - 1.0)
        const synergy = stats.synergy || 0;
        const traffic = stats.traffic || 0;
        const intensity = stats.intensity !== undefined ? stats.intensity : 0.25;
        const activity = Math.max(intensity, synergy, traffic);

        // LOD: Adjust activity based on distance level
        const lodProfile = this.pointFXBase?.getDistanceLODProfile
            ? this.pointFXBase.getDistanceLODProfile(lodLevel)
            : null;
        const lodActivity = typeof lodLevel === 'number'
            ? activity * (lodProfile?.particleScale ?? (lodLevel >= 2 ? 0.0 : lodLevel >= 1 ? 0.4 : 1.0))
            : activity;

        // Controlled spawn: only when active enough
        const minActivity = 0.08;
        const spawnCount = lodActivity > minActivity ? Math.max(1, Math.floor(lodActivity * 1.8)) : 0;

        // Burst check (Echo wave or bead arrival simulation)
        if (spawnEnabled && spawnCount > 0) {
            this.spawnBurst(spawnCount, time, lodActivity);
        }

        // Subtle opacity scaling (no hard debug glow)
        const opacityScale = lodProfile?.visualScale ?? 1.0;
        this.uniforms.uOpacity.value = Math.max(0.35, Math.min(0.9, (0.5 + lodActivity * 0.35) * opacityScale));
        
        // LOD: Adjust visibility based on distance
        this.points.visible = lodProfile ? lodProfile.lodLevel < 3 && lodProfile.particleScale > 0 : lodLevel < 3;

        if (DEBUG_SPARKS) {
            this._debugAcc = (this._debugAcc || 0) + deltaTime;
            if (this._debugAcc >= 1.0) {
                console.log('[Sparks] dt:', deltaTime.toFixed(4), 'spawned:', this._debugSpawned || 0);
                this._debugSpawned = 0;
                this._debugAcc = 0;
            }
        }
    }

    /**
     * Spawn a burst of particles
     */
    spawnBurst(count, time, intensity) {
        this._spawnAccum = (this._spawnAccum || 0) + (1/60); // approximate per-call
        if (DEBUG_SPARKS && this._spawnAccum >= 10) {
            console.log('SPARK SPAWN', { count, time, intensity });
            this._spawnAccum = 0;
        }
        const geo = this.points.geometry;
        const aSpawnTime = geo.attributes.aSpawnTime;
        const aLifeTime = geo.attributes.aLifeTime;
        const aT = geo.attributes.aT;
        const aAngle = geo.attributes.aAngle;
        const aSpeed = geo.attributes.aSpeed;
        const aSize = geo.attributes.aSize;

        for(let i=0; i<count; i++) {
            const idx = this.spawnIndex;
            
            // Activate
            aSpawnTime.setX(idx, time);
            
            // TEMP: longer lifetime for visibility
            aLifeTime.setX(idx, 0.35 + Math.random() * 0.15);

            // Random Position on Curve
            // Bias towards ends slightly? No, random is fine for "friction"
            aT.setX(idx, Math.random());

            // Random Angle
            aAngle.setX(idx, Math.random() * Math.PI * 2);

            // Speed (scaled by activity/intensity) drives stretch & opacity in shader
            const speed = 0.2 + Math.max(0, intensity) * 1.0;
            aSpeed.setX(idx, speed);

            // Size
            aSize.setX(idx, 1.2 + Math.random() * 2.2);

            // DEBUG: approximate position on curve to verify non-zero coords
            const t = aT.getX(idx);
            const p0 = this.uniforms.uStart.value;
            const p1 = this.uniforms.uMid.value;
            const p2 = this.uniforms.uEnd.value;
            const oneMinusT = 1 - t;
            const curvePos = new THREE.Vector3()
                .addScaledVector(p0, oneMinusT * oneMinusT)
                .addScaledVector(p1, 2 * oneMinusT * t)
                .addScaledVector(p2, t * t);
            if (DEBUG_SPARKS) console.log('SPARK POS', idx, curvePos.x, curvePos.y, curvePos.z);

            // Cycle index
            this.spawnIndex = (this.spawnIndex + 1) % this.maxSparks;
        }
        // We update the whole buffer because we're writing round-robin
        // Optimization: utilize addUpdateRange if performance becomes an issue
        // For 60 particles, full update is negligible
        aSpawnTime.needsUpdate = true;
        aLifeTime.needsUpdate = true;
        aT.needsUpdate = true;
        aAngle.needsUpdate = true;
        aSpeed.needsUpdate = true;
        aSize.needsUpdate = true;
        
        // Force GPU upload of position buffer
        geo.attributes.position.needsUpdate = true;

        // Debug spawn counter
        this._debugSpawned = (this._debugSpawned || 0) + count;
    }

    dispose() {
        if (this.points) {
            this.pointFXBase?.disposePointCloud?.(this.points);
        }
    }

    getDebugStats() {
        const spawned = this._debugSpawned || 0;
        this._debugSpawned = 0;
        return { spawned };
    }
}
