import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { resolveLinkCategoryColor } from './LinkCategoryColorContract.js';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

/**
 * GPU-Driven Particle Trail System for Beads
 * 
 * PURPOSE:
 * - Adds visual emphasis to high-value/speed beads (Medium & Large)
 * - Creates a "comet tail" effect
 * 
 * IMPLEMENTATION:
 * - Single BufferGeometry with pre-allocated attributes
 * - Ring buffer logic for cyclic emission
 * - Vertex shader handles animation (drift, fade, size)
 */

const TRAIL_VS = `
attribute vec3 aVelocity; // Drift velocity
attribute vec3 aColor;    // Particle color
attribute vec3 aInfo;     // x: birthTime, y: duration, z: baseSize
attribute vec3 aDir;      // forward direction (source -> target)

uniform float uTime;

varying vec3 vColor;
varying float vAlpha;
varying float vLife;

void main() {
    float age = uTime - aInfo.x;
    
    // Check if alive
    if (age < 0.0 || age > aInfo.y) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Clip space discard hack (out of view)
        vAlpha = 0.0;
        return;
    }
    
    float lifeProgress = age / aInfo.y;
    vLife = lifeProgress;
    
    // Physics: Position = Start (position attr) + Velocity * Age
    // Add slight gravity/drag? No, just linear drift is cleaner for space look.
    vec3 currentPos = position + aVelocity * age;
    
    // Temporal turbulence (very subtle)
    float n = sin(currentPos.x * 6.0 + uTime * 2.0) *
              sin(currentPos.y * 6.0 + uTime * 1.7) *
              sin(currentPos.z * 6.0 + uTime * 1.3);
    
    currentPos += normalize(aVelocity + vec3(0.01)) * n * 0.015;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    vec4 clipPosition = projectionMatrix * mvPosition;
    gl_Position = clipPosition;
    
    vColor = aColor;
    
    // Visuals
    // Size attenuates with distance and life
    gl_PointSize = aInfo.z * (1.0 - lifeProgress) * (40.0 / -mvPosition.z);
    
    // Alpha fades out linearly
    vAlpha = 0.76 * (1.0 - lifeProgress);
}
`;

const TRAIL_FS = `
varying vec3 vColor;
varying float vAlpha;
varying float vLife;

void main() {
    if (vAlpha <= 0.01) discard;

    // Fluid-like rounded "amoeba" smear (low directionality).
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float wobble = sin((p.x * 2.6 + p.y * 1.9 + vLife * 6.8) * 3.14159) * (0.09 * (1.0 - vLife));
    p.x += wobble;
    p.y += sin((p.x - p.y + vLife * 5.2) * 3.14159) * 0.05 * (1.0 - vLife);

    vec2 e0 = vec2(p.x * 1.02, p.y * 1.18);
    float core = 1.0 - smoothstep(0.18, 0.78, length(e0));

    float lobeA = 1.0 - smoothstep(0.10, 0.50, length(p - vec2(0.24, -0.08)));
    float lobeB = 1.0 - smoothstep(0.10, 0.52, length(p - vec2(-0.22, 0.10)));
    float membrane = 1.0 - smoothstep(0.36, 0.96, length(vec2(p.x * 1.25, p.y * 1.05)));

    float shape = max(core, max(lobeA * 0.62, lobeB * 0.55));
    shape = max(shape, membrane * 0.42);
    shape = smoothstep(0.03, 0.92, shape);
    if (shape < 0.01) discard;

    // Keep hue readable (avoid white washing).
    float innerGlow = 0.86 + core * 0.12;
    gl_FragColor = vec4(vColor * innerGlow, vAlpha * shape);
}
`;

let __trailMaterialBase;
function getTrailMaterialBase() {
    if (!__trailMaterialBase) {
        __trailMaterialBase = new THREE.ShaderMaterial({
            vertexShader: TRAIL_VS,
            fragmentShader: TRAIL_FS,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });
    }
    return __trailMaterialBase;
}

export class LinkBeadTrailSystem {
    constructor(scene, maxParticles = 600) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.writeIndex = 0;
        this.laneCursor = 0;
        this._prevBeadPos = new WeakMap();
        this._tmpDir = new THREE.Vector3();
        this._tmpLaneBase = new THREE.Vector3();
        this._tmpLaneTangent = new THREE.Vector3();
        this._tmpLaneNormal = new THREE.Vector3();
        this._tmpLaneBinormal = new THREE.Vector3();
        this._tmpLanePos = new THREE.Vector3();
        this._tmpColor = new THREE.Color();
        this._tmpSourceCategoryColor = new THREE.Color();
        this._tmpTargetCategoryColor = new THREE.Color();
        
        // Configuration
        this.config = {
            emissionRate: 96,  // bring trails back without turning them into a space plume
            lifetime: 0.42,    // readable trail length while still staying near the rope body
            sizeMultiplier: 1.15
        };
        
        this.initSystem();
    }
    
    initSystem() {
        // Buffers
        this.positions = new Float32Array(this.maxParticles * 3);
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.directions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.infos = new Float32Array(this.maxParticles * 3); // birth, duration, size
        
        // Init off-screen / inactive
        for(let i=0; i<this.maxParticles; i++) {
            this.infos[i*3] = -100.0; // Very old birth time
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocities, 3));
        geometry.setAttribute('aDir', new THREE.BufferAttribute(this.directions, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
        geometry.setAttribute('aInfo', new THREE.BufferAttribute(this.infos, 3));
        
        // Dynamic draw usage for frequent updates
        geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aVelocity.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aDir.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aColor.usage = THREE.DynamicDrawUsage;
        geometry.attributes.aInfo.usage = THREE.DynamicDrawUsage;
        
        const material = getTrailMaterialBase().clone();
        // Per-instance uniform object to avoid shared state
        material.uniforms = { uTime: { value: 0 } };

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_BEAD_TRAILS');
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
        this.mesh.updateMatrix();
        applyLinkRenderLayer(this.mesh, 'LINK_BEAD_TRAILS');
        const ud = (this.mesh && typeof this.mesh.userData === 'object' && this.mesh.userData) ? this.mesh.userData : (() => { try { Object.defineProperty(this.mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.mesh.userData || {}; })();
        Object.assign(ud, { isTrailSystem: true });
    }
    
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Update trails and spawn new particles from active beads
     * @param {number} time - Global time
     * @param {number} deltaTime - Frame delta
     * @param {Map} beadToMesh - Map of active beads to meshes
     */
    update(time, deltaTime, beadToMesh, curve = null, spawnEnabled = true) {
        this.mesh.material.uniforms.uTime.value = time;
        
        // Guard: ensure beadToMesh is valid and iterable
        if (!beadToMesh || typeof beadToMesh[Symbol.iterator] !== 'function') {
            return;
        }
        
        if (!spawnEnabled) {
            return;
        }

        // Accumulate emission count
        // We want constant emission density regardless of framerate
        // particles_to_spawn = emissionRate * dt
        // Since we have multiple beads, we do probability check per bead per frame
        // Or just deterministic spawn count
        
        const emissionChance = this.config.emissionRate * deltaTime; 
        // If 60 * 0.016 ~= 1 particle per frame per bead
        
        let updateStart = -1;
        let updateEnd = -1;
        
        const hasCurve = !!(curve && typeof curve.getPointAt === 'function' && typeof curve.getTangentAt === 'function');
        const curveLength = hasCurve && typeof curve.getLength === 'function' ? curve.getLength() : null;
        const twists = curveLength ? Math.max(1.5, curveLength / 4.2) : 2.2;

        // Iterate beads
        for (const [bead, mesh] of beadToMesh) {
            // Filter: Only trails for Medium and Large beads
            if (!bead.isActive || bead.size === 'small') continue;
            
            // Determine how many to spawn
            // Integer part + fractional chance
            let count = Math.floor(emissionChance);
            if (Math.random() < (emissionChance % 1)) count++;
            
            if (count === 0) continue;
            
            // Get bead position (world space)
            const beadPos = mesh.position;
            const beadColor = mesh.material?.color;
            const beadEmissive = mesh.material?.emissive;
            const beadLink = bead?.link || mesh.userData?.link || null;
            const sourceCategory = beadLink?.source?.userData?.category || beadLink?.sourceNode?.userData?.category || null;
            const targetCategory = beadLink?.target?.userData?.category || beadLink?.targetNode?.userData?.category || sourceCategory;
            const previous = this._prevBeadPos.get(bead) || beadPos.clone();
            const dir = this._tmpDir;
            if (hasCurve && typeof bead?.t === 'number') {
                dir.copy(curve.getTangentAt(Math.max(0.0, Math.min(1.0, bead.t))));
            } else {
                dir.copy(beadPos).sub(previous);
            }
            if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
            dir.normalize();
            this._prevBeadPos.set(bead, beadPos.clone());

            if (sourceCategory || targetCategory) {
                const srcColor = resolveLinkCategoryColor(sourceCategory, beadColor, this._tmpSourceCategoryColor);
                const dstColor = resolveLinkCategoryColor(targetCategory, srcColor, this._tmpTargetCategoryColor);
                const beadT = hasCurve && typeof bead?.t === 'number' ? Math.max(0.0, Math.min(1.0, bead.t)) : 0.5;
                this._tmpColor.copy(srcColor).lerp(dstColor, beadT);
            } else if (beadColor?.isColor) {
                this._tmpColor.copy(beadColor);
                if (beadEmissive?.isColor) {
                    this._tmpColor.lerp(beadEmissive, 0.22);
                }
            } else {
                this._tmpColor.set(0xffffff);
            }
            
            // Spawn particles
            for (let k = 0; k < count; k++) {
                const idx = this.writeIndex;
                const i3 = idx * 3;
                
                // Position: cycle particles through strand lanes for readable lane flow.
                if (hasCurve && typeof bead?.t === 'number') {
                    const t = Math.max(0.0, Math.min(1.0, bead.t));
                    curve.getPointAt(t, this._tmpLaneBase);
                    curve.getTangentAt(t, this._tmpLaneTangent).normalize();
                    this._buildLaneFrame(this._tmpLaneTangent, this._tmpLaneNormal, this._tmpLaneBinormal);

                    const laneCount = Math.max(3, Math.min(5, bead.laneCount || 3));
                    const laneIndex = this.laneCursor % laneCount;
                    this.laneCursor = (this.laneCursor + 1) % 4096;
                    const lanePhase = (laneIndex / laneCount) * Math.PI * 2.0 + Math.PI * 0.5;
                    const helixAngle = t * Math.PI * 2.0 * twists + lanePhase;
                    const envelope = 0.14;
                    const laneRadius = (bead.size === 'medium')
                        ? Math.max(bead.radius * 0.34, envelope * 0.28)
                        : Math.max(bead.radius * 0.40, envelope * 0.34);

                    this._tmpLanePos.copy(this._tmpLaneBase);
                    this._tmpLanePos.addScaledVector(this._tmpLaneNormal, Math.cos(helixAngle) * laneRadius);
                    this._tmpLanePos.addScaledVector(this._tmpLaneBinormal, Math.sin(helixAngle) * laneRadius);

                    const jitter = 0.004 + bead.radius * 0.02;
                    this.positions[i3] = this._tmpLanePos.x + (Math.random() - 0.5) * jitter;
                    this.positions[i3 + 1] = this._tmpLanePos.y + (Math.random() - 0.5) * jitter;
                    this.positions[i3 + 2] = this._tmpLanePos.z + (Math.random() - 0.5) * jitter;
                } else {
                    const jitter = 0.012 * bead.radius;
                    this.positions[i3] = beadPos.x + (Math.random() - 0.5) * jitter;
                    this.positions[i3 + 1] = beadPos.y + (Math.random() - 0.5) * jitter;
                    this.positions[i3 + 2] = beadPos.z + (Math.random() - 0.5) * jitter;
                }
                
                // Tail drifts backward (toward source) while head points toward target direction.
                const backSpeed = (bead.size === 'large')
                  ? (0.090 + Math.random() * 0.035)
                  : (0.070 + Math.random() * 0.025);
                const driftJitter = (bead.size === 'large') ? 0.010 : 0.006;
                this.velocities[i3] = -dir.x * backSpeed + (Math.random()-0.5)*driftJitter;
                this.velocities[i3+1] = -dir.y * backSpeed + (Math.random()-0.5)*driftJitter;
                this.velocities[i3+2] = -dir.z * backSpeed + (Math.random()-0.5)*driftJitter;
                this.directions[i3] = dir.x;
                this.directions[i3+1] = dir.y;
                this.directions[i3+2] = dir.z;
                
                // Color: inherit bead gradient (source->target) and keep saturation readable.
                this.colors[i3] = this._tmpColor.r;
                this.colors[i3+1] = this._tmpColor.g;
                this.colors[i3+2] = this._tmpColor.b;
                
                // Info: BirthTime, Duration, Size
                this.infos[i3] = time;
                
                // Duration varies by size (scaled by config lifetime)
                const duration = (bead.size === 'large')
                  ? this.config.lifetime * 1.35
                  : this.config.lifetime * 1.15;
                this.infos[i3+1] = duration;
                
                // Size (scaled by config multiplier)
                const baseSize = (bead.size === 'large') ? 5.0 : 3.0;
                this.infos[i3+2] = baseSize * this.config.sizeMultiplier;
                
                // Update range tracking
                if (updateStart === -1 || idx < updateStart) updateStart = idx;
                if (updateEnd === -1 || idx > updateEnd) updateEnd = idx;
                
                // Increment ring buffer
                this.writeIndex = (this.writeIndex + 1) % this.maxParticles;
                
                // Handle wrap-around for update range?
                // If we wrap, we technically have two ranges or just update all
                // For simplicity, if we wrap, we'll just set range to full or handle next frame
                // Actually, threejs addUpdateRange doesn't handle wrap. 
                // We'll optimistically update the touched region. If wrapped, updateEnd < updateStart is bad.
                // If wrapped, we update [start...max] and [0...end].
                // But simplified: Just mark needsUpdate = true and let Three.js upload buffer. 
                // For 600 points, it's trivial.
            }
        }
        
        // Upload if we wrote anything
        if (updateStart !== -1) {
            this.mesh.geometry.attributes.position.needsUpdate = true;
            this.mesh.geometry.attributes.aVelocity.needsUpdate = true;
            this.mesh.geometry.attributes.aDir.needsUpdate = true;
            this.mesh.geometry.attributes.aColor.needsUpdate = true;
            this.mesh.geometry.attributes.aInfo.needsUpdate = true;
        }
    }

    _buildLaneFrame(tangent, normal, binormal) {
        normal.set(0, 1, 0);
        if (Math.abs(tangent.dot(normal)) > 0.92) {
            normal.set(1, 0, 0);
        }
        binormal.crossVectors(tangent, normal).normalize();
        normal.crossVectors(binormal, tangent).normalize();
    }
    
    dispose() {
        if (this.mesh) {
            // Remove from scene if attached
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            } else if (this.scene) {
                this.scene.remove(this.mesh);
            }
            
            // Dispose resources
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
