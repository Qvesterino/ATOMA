/**
 * LinkBufferSafetyAudit
 * ============================================================================
 * Utilities for safe BufferGeometry operations in link visual effects.
 * 
 * Ensures all buffer updates use TypedArrays and proper GPU-safe methods.
 * Prevents "Unsupported buffer data format" THREE.WebGLAttributes errors.
 */

import * as THREE from 'three';

export class LinkBufferSafetyAudit {
    /**
     * Create a safe BufferAttribute from various input types
     * @param {Array|Float32Array|Uint16Array|Object} data - Input data
     * @param {number} itemSize - Items per vertex (1, 2, 3, 4, etc.)
     * @param {boolean} normalized - Whether attribute is normalized
     * @returns {THREE.BufferAttribute}
     */
    static createSafeAttribute(data, itemSize, normalized = false) {
        let typedArray;

        // Case 1: Already a TypedArray - use directly
        if (data instanceof Float32Array || data instanceof Uint16Array || 
            data instanceof Uint32Array || data instanceof Int16Array || 
            data instanceof Int32Array) {
            typedArray = data;
        }
        // Case 2: Regular array - convert to Float32Array
        else if (Array.isArray(data)) {
            typedArray = new Float32Array(data);
        }
        // Case 3: Object or unsupported type - error
        else {
            console.error('LinkBufferSafetyAudit: Cannot create attribute from', typeof data, data);
            // Fallback: create empty attribute
            typedArray = new Float32Array(itemSize);
        }

        return new THREE.BufferAttribute(typedArray, itemSize, normalized);
    }

    /**
     * Safely update a BufferAttribute's data
     * @param {THREE.BufferAttribute} attribute - Attribute to update
     * @param {Array|Float32Array} data - New data values
     * @param {number} offset - Offset in attribute array (default 0)
     */
    static updateAttributeSafely(attribute, data, offset = 0) {
        if (!attribute || !attribute.array) return;

        // Ensure data is a TypedArray
        let typedArray = data;
        if (Array.isArray(data)) {
            typedArray = new Float32Array(data);
        }

        // Use .set() method for GPU-safe updates
        if (typedArray instanceof Float32Array || 
            typedArray instanceof Uint16Array || 
            typedArray instanceof Uint32Array) {
            try {
                attribute.array.set(typedArray, offset);
                attribute.needsUpdate = true;
            } catch (e) {
                console.error('LinkBufferSafetyAudit: Failed to update attribute:', e);
            }
        } else {
            console.error('LinkBufferSafetyAudit: Data is not a supported TypedArray');
        }
    }

    /**
     * Safely copy Vector3 components into a TypedArray
     * @param {THREE.Vector3[]} vectors - Array of Vector3 objects
     * @param {Float32Array} targetArray - Target TypedArray
     * @param {number} itemSize - Components per vector (should be 3)
     * @param {number} offset - Offset in target array
     */
    static copyVectorsToArray(vectors, targetArray, itemSize = 3, offset = 0) {
        if (!vectors || !Array.isArray(vectors)) {
            console.error('LinkBufferSafetyAudit: vectors must be an array');
            return;
        }

        if (!(targetArray instanceof Float32Array)) {
            console.error('LinkBufferSafetyAudit: targetArray must be Float32Array');
            return;
        }

        let idx = offset;
        for (let i = 0; i < vectors.length; i++) {
            const v = vectors[i];
            if (v && v.x !== undefined) {
                targetArray[idx++] = v.x;
                if (itemSize > 1) targetArray[idx++] = v.y;
                if (itemSize > 2) targetArray[idx++] = v.z;
                if (itemSize > 3) targetArray[idx++] = v.w || 1.0;
            }
        }
    }

    /**
     * Create a LineGeometry safely from points
     * @param {THREE.Vector3[]} points - Array of Vector3 points
     * @returns {THREE.BufferGeometry}
     */
    static createLineGeometry(points) {
        const geometry = new THREE.BufferGeometry();

        if (!points || points.length === 0) {
            return geometry;
        }

        // Create position array from Vector3 points
        const positions = new Float32Array(points.length * 3);
        LinkBufferSafetyAudit.copyVectorsToArray(points, positions, 3, 0);

        // Create attribute safely
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        return geometry;
    }

    /**
     * Verify a geometry's attributes are safe
     * @param {THREE.BufferGeometry} geometry - Geometry to verify
     * @returns {boolean} - True if all attributes are TypedArrays
     */
    static verifyGeometrySafety(geometry) {
        if (!geometry || !geometry.attributes) {
            return true; // Empty geometry is safe
        }

        for (const attrName in geometry.attributes) {
            const attr = geometry.attributes[attrName];
            if (!(attr.array instanceof Float32Array || 
                  attr.array instanceof Uint16Array ||
                  attr.array instanceof Uint32Array ||
                  attr.array instanceof Int16Array ||
                  attr.array instanceof Int32Array)) {
                console.warn(`LinkBufferSafetyAudit: Attribute '${attrName}' has unsafe array type:`, typeof attr.array);
                return false;
            }
        }

        return true;
    }
}
