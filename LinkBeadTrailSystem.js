import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

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
varying vec2 vDir;

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
    vec4 mvForward = modelViewMatrix * vec4(currentPos + aDir * 0.14, 1.0);
    vec4 clipForward = projectionMatrix * mvForward;
    vec2 ndcA = clipPosition.xy / max(clipPosition.w, 1e-4);
    vec2 ndcB = clipForward.xy / max(clipForward.w, 1e-4);
    vec2 screenDir = ndcB - ndcA;
    float dirLen = length(screenDir);
    if (dirLen <= 1e-5) {
        vec2 fallbackDir = (modelViewMatrix * vec4(aDir, 0.0)).xy;
        float fallbackLen = length(fallbackDir);
        vDir = (fallbackLen > 1e-5) ? (fallbackDir / fallbackLen) : vec2(0.0, 1.0);
    } else {
        vDir = screenDir / dirLen;
    }
}
`;

const TRAIL_FS = `
varying vec3 vColor;
varying float vAlpha;
varying float vLife;
varying vec2 vDir;

void main() {
    if (vAlpha <= 0.01) discard;
    
    // Teardrop sprite aligned to travel direction:
    // +Y points to target (head), -Y points to source (tail).
    vec2 raw = gl_PointCoord * 2.0 - 1.0;
    vec2 perp = vec2(-vDir.y, vDir.x);
    vec2 p = vec2(dot(raw, perp), dot(raw, vDir));
    p.y *= 1.05;

    float head = 1.0 - smoothstep(0.26, 0.86, length(vec2(p.x * 1.15, (p.y - 0.34) * 0.92)));
    float tailWidth = mix(0.14, 0.55, clamp((p.y + 1.0) * 0.5, 0.0, 1.0));
    float tail = 1.0 - smoothstep(0.0, 1.0, max(abs(p.x) / max(tailWidth, 0.001), -(p.y + 0.86)));
    tail *= 1.0 - smoothstep(0.08, 1.0, vLife);

    float shape = max(head, tail * 0.84);
    shape = smoothstep(0.02, 0.9, shape);
    if (shape < 0.01) discard;

    float glow = 0.58 + (1.0 - abs(p.y)) * 0.26;
    gl_FragColor = vec4(vColor, vAlpha * shape * glow);
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
        this._prevBeadPos = new WeakMap();
        
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
    update(time, deltaTime, beadToMesh, curve = null) {
        this.mesh.material.uniforms.uTime.value = time;
        
        // Guard: ensure beadToMesh is valid and iterable
        if (!beadToMesh || typeof beadToMesh[Symbol.iterator] !== 'function') {
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
            const beadColor = mesh.material.color;
            const previous = this._prevBeadPos.get(bead) || beadPos.clone();
            const dir = new THREE.Vector3();
            if (curve && typeof bead?.t === 'number' && curve.getTangentAt) {
                dir.copy(curve.getTangentAt(Math.max(0.0, Math.min(1.0, bead.t))));
            } else {
                dir.copy(beadPos).sub(previous);
            }
            if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
            dir.normalize();
            this._prevBeadPos.set(bead, beadPos.clone());
            
            // Spawn particles
            for (let k = 0; k < count; k++) {
                const idx = this.writeIndex;
                const i3 = idx * 3;
                
                // Position: Bead Position + Random jitter
                const jitter = 0.012 * bead.radius; // Slightly wider origin so the trail reads inside the braid
                this.positions[i3] = beadPos.x + (Math.random()-0.5)*jitter;
                this.positions[i3+1] = beadPos.y + (Math.random()-0.5)*jitter;
                this.positions[i3+2] = beadPos.z + (Math.random()-0.5)*jitter;
                
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
                
                // Color: Inherit from bead
                this.colors[i3] = beadColor.r;
                this.colors[i3+1] = beadColor.g;
                this.colors[i3+2] = beadColor.b;
                
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
