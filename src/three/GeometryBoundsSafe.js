/**
 * GEOMETRY BOUNDS SAFETY MODULE
 * ============================================================================
 * Centralized firewall for THREE.BufferGeometry NaN/Inf protection
 * 
 * Provides safe functions to:
 * - Check for non-finite position values
 * - Sanitize NaN/Infinity in geometry buffers
 * - Compute bounding spheres and boxes with fallbacks
 * - Create safe EdgesGeometry instances
 * 
 * DESIGN PRINCIPLES:
 * - Lightweight: Sample-check up to 100 vertices, not entire arrays
 * - Safe: Always returns valid results or fallbacks
 * - Low-noise: Log warnings once per geometry UUID
 * - Behavior-preserving: Only sanitize when NaN/Inf detected
 * 
 * @author ATOMA Engine — Bounds Safety Layer
 * @version 1.0.0
 */

import * as THREE from 'three';

// Set to track which geometries have already logged NaN errors (prevent spam)
const _loggedNaNWarnings = new Set();

/**
 * Sample-check position array for finite numbers
 * Returns false if any non-finite values (NaN or Infinity) found
 * 
 * PERFORMANCE: Samples up to 100 vertices (300 values) to avoid scanning
 * entire large arrays. This is sufficient to detect corruption patterns.
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to check
 * @returns {boolean} True if all sampled positions are finite
 */
export function hasFinitePositions(geometry) {
  const posAttr = geometry?.attributes?.position;
  if (!posAttr) return false;
  
  const positions = posAttr.array;
  const count = Math.min(positions.length, 300); // Sample up to 100 vertices (3 values each)
  
  for (let i = 0; i < count; i++) {
    if (!Number.isFinite(positions[i])) return false;
  }
  return true;
}

/**
 * Replace non-finite position values with 0
 * Returns number of values sanitized
 * 
 * This is a last-resort fix when geometry has NaN/Infinity values.
 * It preserves the geometry's structure while making it safe for bounds computation.
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to sanitize
 * @returns {number} Number of values replaced with 0
 */
export function forceFinitePositions(geometry) {
  const posAttr = geometry?.attributes?.position;
  if (!posAttr) return 0;
  
  const positions = posAttr.array;
  let sanitizedCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) {
      positions[i] = 0;
      sanitizedCount++;
    }
  }
  
  if (sanitizedCount > 0) {
    posAttr.needsUpdate = true;
  }
  
  return sanitizedCount;
}

/**
 * Normalize drawRange.count if it's Infinity or NaN
 * Sets drawRange.count to position.count (or 0 if no positions)
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to fix
 * @returns {number} The normalized count value
 */
export function normalizeDrawRange(geometry) {
  if (!Number.isFinite(geometry.drawRange.count)) {
    const posCount = geometry.attributes?.position?.count ?? 0;
    geometry.setDrawRange(geometry.drawRange.start, posCount);
    
    // Log once per geometry
    const uuid = geometry.uuid;
    if (!_loggedNaNWarnings.has(uuid)) {
      console.warn(`[GeometryBoundsSafe] Normalized infinite drawRange to ${posCount} for geometry ${uuid}`);
      _loggedNaNWarnings.add(uuid);
    }
    
    return posCount;
  }
  return geometry.drawRange.count;
}

/**
 * Safe bounds computation with NaN protection
 * Returns { ok: boolean, boundingSphere?: THREE.Sphere, boundingBox?: THREE.Box3 }
 * 
 * This function ensures that geometry bounds are always computable by:
 * 1. Normalizing infinite drawRange values
 * 2. Sanitizing non-finite position values
 * 3. Computing bounding box and sphere with error handling
 * 4. Validating results are finite
 * 
 * If any step fails, returns { ok: false } and logs a warning (once per geometry).
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to compute bounds for
 * @returns {{ok: boolean, boundingSphere?: THREE.Sphere, boundingBox?: THREE.Box3}}
 */
export function safeComputeBounds(geometry) {
  if (!geometry) {
    return { ok: false };
  }
  
  // 1. Normalize drawRange.count if not finite
  normalizeDrawRange(geometry);
  
  // 2. Check position finiteness
  if (!hasFinitePositions(geometry)) {
    // Attempt to sanitize
    const sanitized = forceFinitePositions(geometry);
    
    // Log once per geometry
    const uuid = geometry.uuid;
    if (!_loggedNaNWarnings.has(uuid)) {
      console.warn(`[GeometryBoundsSafe] Sanitized ${sanitized} non-finite position values in geometry ${uuid}`);
      _loggedNaNWarnings.add(uuid);
    }
    
    // If still not finite, give up
    if (!hasFinitePositions(geometry)) {
      return { ok: false };
    }
  }
  
  // 3. Compute bounding box
  try {
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    // Validate bounding box min/max are finite
    if (!geometry.boundingBox || 
        !Number.isFinite(geometry.boundingBox.min.x) || 
        !Number.isFinite(geometry.boundingBox.min.y) || 
        !Number.isFinite(geometry.boundingBox.min.z) ||
        !Number.isFinite(geometry.boundingBox.max.x) || 
        !Number.isFinite(geometry.boundingBox.max.y) || 
        !Number.isFinite(geometry.boundingBox.max.z)) {
      return { ok: false };
    }
  } catch (e) {
    console.error('[GeometryBoundsSafe] Bounding box computation failed:', e);
    return { ok: false };
  }
  
  // 4. Compute bounding sphere
  try {
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    
    // Validate sphere radius is finite
    if (!geometry.boundingSphere || !Number.isFinite(geometry.boundingSphere.radius)) {
      return { ok: false };
    }
  } catch (e) {
    console.error('[GeometryBoundsSafe] Bounding sphere computation failed:', e);
    return { ok: false };
  }
  
  return { 
    ok: true, 
    boundingSphere: geometry.boundingSphere,
    boundingBox: geometry.boundingBox
  };
}

/**
 * Get safe bounding sphere with fallback
 * Returns a minimal sphere at fallbackPosition if computation fails
 * 
 * This is a convenience wrapper for safeComputeBounds that always returns
 * a valid sphere, useful for raycasting and collision detection where a
 * fallback is better than a crash.
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to get sphere from
 * @param {THREE.Vector3} fallbackPosition - Position for fallback sphere (default: origin)
 * @returns {THREE.Sphere} Always returns a valid sphere
 */
export function getSafeBoundingSphere(geometry, fallbackPosition = new THREE.Vector3(0, 0, 0)) {
  const result = safeComputeBounds(geometry);
  
  if (result.ok && result.boundingSphere) {
    return result.boundingSphere;
  }
  
  // Return minimal fallback sphere
  return new THREE.Sphere(fallbackPosition, 0.001);
}

/**
 * Get safe bounding box with fallback
 * Returns a minimal box at fallbackPosition if computation fails
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to get box from
 * @param {THREE.Vector3} fallbackPosition - Position for fallback box (default: origin)
 * @returns {THREE.Box3} Always returns a valid box
 */
export function getSafeBoundingBox(geometry, fallbackPosition = new THREE.Vector3(0, 0, 0)) {
  const result = safeComputeBounds(geometry);
  
  if (result.ok && result.boundingBox) {
    return result.boundingBox;
  }
  
  // Return minimal fallback box
  const min = fallbackPosition.clone();
  const max = fallbackPosition.clone();
  min.addScalar(-0.001);
  max.addScalar(0.001);
  return new THREE.Box3(min, max);
}

/**
 * Safe EdgesGeometry creation
 * Returns null if source geometry is invalid
 * 
 * EdgesGeometry inherits NaN from malformed source geometries. This function
 * ensures the source has valid bounds before creating the EdgesGeometry.
 * 
 * @param {THREE.BufferGeometry} sourceGeometry - Source geometry to extract edges from
 * @param {number} thresholdAngle - Angle threshold for edge detection (default: 1)
 * @returns {THREE.EdgesGeometry|null} EdgesGeometry or null if invalid
 */
export function safeCreateEdgesGeometry(sourceGeometry, thresholdAngle = 1) {
  if (!sourceGeometry) return null;
  
  // Ensure source has valid bounds
  const result = safeComputeBounds(sourceGeometry);
  if (!result.ok) {
    console.warn('[GeometryBoundsSafe] Cannot create EdgesGeometry from invalid geometry');
    return null;
  }
  
  try {
    return new THREE.EdgesGeometry(sourceGeometry, thresholdAngle);
  } catch (e) {
    console.error('[GeometryBoundsSafe] EdgesGeometry creation failed:', e);
    return null;
  }
}

/**
 * Clear the logged warnings set (useful for testing or reset)
 */
export function clearWarningLog() {
  _loggedNaNWarnings.clear();
}

/**
 * Get the count of unique geometries that have logged warnings
 * @returns {number}
 */
export function getWarningCount() {
  return _loggedNaNWarnings.size;
}