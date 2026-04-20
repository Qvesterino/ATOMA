/**
 * SPHERE CREATOR TRACE v1.0
 * 
 * Monkey-patches THREE.Object3D.prototype.add at runtime to trace
 * the exact source of primitive sphere mesh creation.
 * 
 * This is a TRACE-ONLY phase - no blocking, just detection and logging.
 */

/**
 * Install the sphere creator trace patch
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether tracing is enabled (default: true)
 * @param {boolean} options.verbose - Enable verbose logging (default: false)
 * @returns {Object} - Control object with enable/disable methods
 */
export function installSphereCreatorTrace(options = {}) {
    const {
        enabled = true,
        verbose = false
    } = options;

    if (!enabled) {
        console.log('[SphereCreatorTrace] Disabled - skipping patch installation');
        return { enable: () => {}, disable: () => {} };
    }

    // Runtime guard: Ensure THREE is fully initialized before proceeding
    if (!THREE || !THREE.Object3D || !THREE.Object3D.prototype) {
        console.warn('[SphereCreatorTrace] THREE not ready – skipping installation');
        return {
            enable: () => {},
            disable: () => {},
            isEnabled: () => false
        };
    }

    // Only patch once
    if (THREE.Object3D.prototype._sphereTracePatched) {
        console.warn('[SphereCreatorTrace] Already installed - skipping duplicate patch');
        return {
            enable: () => { THREE.Object3D.prototype._sphereTraceEnabled = true; },
            disable: () => { THREE.Object3D.prototype._sphereTraceEnabled = false; }
        };
    }

    console.log('[SphereCreatorTrace] Installing monkey patch on THREE.Object3D.prototype.add...');
    
    // Store original add method
    const originalAdd = THREE.Object3D.prototype.add;

    /**
     * Check if a geometry appears to be a primitive sphere
     */
    function isPrimitiveSphereLike(object) {
        if (!object || !object.isMesh) {
            return false;
        }

        const geometry = object.geometry;
        if (!geometry) {
            return false;
        }

        // Check 1: Explicit SphereGeometry
        if (geometry.type === 'SphereGeometry') {
            return true;
        }

        // Check 2: IcosahedronGeometry (often used for spheres)
        if (geometry.type === 'IcosahedronGeometry') {
            return true;
        }

        // Check 3: BufferGeometry with sphere-like vertex count
        if (geometry.type === 'BufferGeometry' && geometry.attributes) {
            const positionCount = geometry.attributes.position?.count || 0;
            
            // Typical sphere ranges: > 200 vertices and < 5000 vertices
            // (too few = simple shapes, too many = complex geometry)
            if (positionCount > 200 && positionCount < 5000) {
                // Check if vertices are roughly uniformly distributed (sphere characteristic)
                // For a sphere, vertices should be roughly at consistent radius
                const positions = geometry.attributes.position;
                const vertexCount = Math.min(positionCount.count, 1000); // Sample first 1000 vertices
                
                if (vertexCount < 3) return false;

                // Calculate distances from origin for sampled vertices
                const distances = [];
                for (let i = 0; i < vertexCount; i++) {
                    const x = positions.getX(i);
                    const y = positions.getY(i);
                    const z = positions.getZ(i);
                    const dist = Math.sqrt(x * x + y * y + z * z);
                    distances.push(dist);
                }

                // Calculate variance in distances (spheres have low variance)
                const avgDist = distances.reduce((sum, d) => sum + d, 0) / distances.length;
                const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
                const stdDev = Math.sqrt(variance);
                
                // If standard deviation is less than 20% of average distance, likely a sphere
                const varianceRatio = stdDev / avgDist;
                
                if (varianceRatio < 0.2) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Extract geometry type information
     */
    function getGeometryType(geometry) {
        if (!geometry) return 'unknown';
        if (geometry.type) return geometry.type;
        if (geometry.constructor && geometry.constructor.name) return geometry.constructor.name;
        return 'unknown';
    }

    /**
     * Patched add method with sphere detection
     */
    THREE.Object3D.prototype.add = function(object) {
        // Check if this is a sphere-like mesh
        if (isPrimitiveSphereLike(object)) {
            const geometryType = getGeometryType(object.geometry);
            const meshName = object.name || '<unnamed>';
            const parentName = this.name || '<unnamed>';
            const uuid = object.uuid;

            console.group('%c[SPHERE_CREATOR_TRACE] ⚠️ Primitive sphere detected via Object3D.add()', 'color: #ff6600; font-weight: bold;');
            console.log('geometryType:', geometryType);
            console.log('mesh.name:', meshName);
            console.log('parent.name:', parentName);
            console.log('uuid:', uuid);
            console.log('vertexCount:', object.geometry?.attributes?.position?.count || 'N/A');
            
            // Capture and log stack trace
            const error = new Error();
            const stackLines = error.stack.split('\n').slice(1); // Skip first line (the error message)
            console.log('%cstack trace:', 'color: #ff6600; font-weight: bold;');
            console.log(stackLines.join('\n'));
            
            if (verbose) {
                console.log('Full object:', object);
                console.log('Full geometry:', object.geometry);
            }
            
            console.groupEnd();
        }

        // Call original add (DO NOT BLOCK - just trace)
        return originalAdd.call(this, object);
    };

    // Mark as patched to prevent duplicate installation
    THREE.Object3D.prototype._sphereTracePatched = true;
    THREE.Object3D.prototype._sphereTraceEnabled = true;

    console.log('[SphereCreatorTrace] ✓ Monkey patch installed successfully');
    console.log('[SphereCreatorTrace] Will trace all primitive spheres added via scene.add()');

    // Return control object
    return {
        enable: () => {
            THREE.Object3D.prototype._sphereTraceEnabled = true;
            console.log('[SphereCreatorTrace] Tracing enabled');
        },
        disable: () => {
            THREE.Object3D.prototype._sphereTraceEnabled = false;
            console.log('[SphereCreatorTrace] Tracing disabled');
        },
        isEnabled: () => THREE.Object3D.prototype._sphereTraceEnabled === true
    };
}

/**
 * Get trace statistics (for future use)
 */
export function getSphereTraceStats() {
    return {
        patched: THREE.Object3D.prototype._sphereTracePatched === true,
        enabled: THREE.Object3D.prototype._sphereTraceEnabled === true
    };
}
