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
 * Check if geometry has finite normal values
 * Returns false if any non-finite values (NaN or Infinity) found in normal attribute
 * 
 * This is critical for edge geometry offset operations which rely on normals.
 * Some primitive geometries (TorusGeometry, ConeGeometry) may have NaN normals.
 * 
 * PERFORMANCE: Samples up to 100 vertices (300 values - 3 components per normal)
 * 
 * @param {THREE.BufferGeometry} geometry - Geometry to check
 * @returns {boolean} True if all sampled normals are finite
 */
export function hasFiniteNormals(geometry) {
  const normalAttr = geometry?.attributes?.normal;
  if (!normalAttr || !normalAttr.array) return false;

  const arr = normalAttr.array;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return false;
  }
  return true;
}

/**
 * Build offset source geometry for edge extraction by moving vertices slightly
 * along normals. If any required attribute is invalid, returns original geometry.
 *
 * @param {THREE.BufferGeometry} sourceGeometry
 * @param {number} normalOffset
 * @returns {THREE.BufferGeometry}
 */
function buildOffsetEdgeSourceGeometry(sourceGeometry, normalOffset = 0.002) {
  const posAttr = sourceGeometry?.attributes?.position;
  const normalAttr = sourceGeometry?.attributes?.normal;
  if (!posAttr || !normalAttr || !posAttr.array || !normalAttr.array) {
    return sourceGeometry;
  }

  const offsetGeometry = sourceGeometry.clone();
  const offsetPosAttr = offsetGeometry.attributes?.position;
  const offsetNormals = normalAttr.array;
  const offsetPositions = offsetPosAttr?.array;
  if (!offsetPosAttr || !offsetPositions || !offsetNormals) {
    return sourceGeometry;
  }

  const limit = Math.min(offsetPositions.length, offsetNormals.length);
  for (let i = 0; i < limit; i += 3) {
    offsetPositions[i] += offsetNormals[i] * normalOffset;
    offsetPositions[i + 1] += offsetNormals[i + 1] * normalOffset;
    offsetPositions[i + 2] += offsetNormals[i + 2] * normalOffset;
  }
  offsetPosAttr.needsUpdate = true;
  return offsetGeometry;
}

/**
 * Validate that geometry has finite position data for at least one triangle.
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {boolean}
 */
function hasValidPositions(geometry) {
  const pos = geometry?.attributes?.position?.array;
  if (!pos || pos.length < 9) return false; // fewer than 3 vertices

  for (let i = 0; i < pos.length; i++) {
    if (!Number.isFinite(pos[i])) return false;
  }

  return true;
}

/**
 * Validate index buffer shape for indexed geometry.
 * Non-indexed geometry is treated as valid.
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {boolean}
 */
function hasValidIndex(geometry) {
  if (!geometry?.index) return true;
  const arr = geometry.index.array;
  return !!arr && arr.length >= 3;
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
 * Safe EdgesGeometry creation with normal validation
 * NEVER aborts spawn pipeline - always returns valid geometry or fallback
 * 
 * EdgesGeometry inherits NaN from malformed source geometries, particularly
 * when source has invalid normals. This function:
 * 1. Validates source geometry bounds
 * 2. Checks for finite normals (critical for edge operations)
 * 3. Creates EdgesGeometry and validates result
 * 4. Falls back to sanitized geometry if needed
 * 
 * @param {THREE.BufferGeometry} sourceGeometry - Source geometry to extract edges from
 * @param {number} thresholdAngle - Angle threshold for edge detection (default: 1)
 * @returns {THREE.EdgesGeometry} Always returns valid EdgesGeometry (never null)
 */
export function safeCreateEdgesGeometry(sourceGeometry, thresholdAngle = 1, normalOffset = 0.002) {
  if (!sourceGeometry) {
    console.warn('[safeCreateEdgesGeometry] null source → creating minimal fallback');
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  }

  if (!hasValidPositions(sourceGeometry) || !hasValidIndex(sourceGeometry)) {
    console.warn('[EdgesGeometry SKIP] empty or degenerate geometry');
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(0.2, 0.2, 0.2));
  }

  // 1. Ensure source is sane
  const sourceResult = safeComputeBounds(sourceGeometry);
  if (!sourceResult.ok) {
    console.warn('[safeCreateEdgesGeometry] Invalid source bounds → creating fallback');
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  }

  // 2. Build edge source with safe normal handling (never abort on normal issues)
  let edgeSource;
  if (hasFiniteNormals(sourceGeometry)) {
    edgeSource = buildOffsetEdgeSourceGeometry(sourceGeometry, normalOffset);
  } else {
    console.warn('[EdgesGeometry] invalid normals → using raw geometry');
    edgeSource = sourceGeometry;
  }
  
  // 3. Attempt to create EdgesGeometry
  try {
    let edges = new THREE.EdgesGeometry(edgeSource, thresholdAngle);
    
    // 4. Validate edges geometry
    const pos = edges.attributes?.position?.array;
    let hasNaN = false;
    
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          hasNaN = true;
          console.warn('[safeCreateEdgesGeometry] NaN detected in EdgesGeometry → using sanitized source');
          break;
        }
      }
    }

    if (hasNaN) {
      // 5. Fallback: sanitize source and try again
      forceFinitePositions(sourceGeometry);
      const edgesSanitized = new THREE.EdgesGeometry(sourceGeometry, thresholdAngle);
      
      // 🔴 CRITICAL: normalize drawRange on EDGES geometry
      normalizeDrawRange(edgesSanitized);
      
      return edgesSanitized;
    }

    // 6. 🔴 CRITICAL: normalize drawRange on EDGES geometry
    normalizeDrawRange(edges);

    // 7. Optional: validate edges bounds (non-critical)
    const edgesResult = safeComputeBounds(edges);
    if (!edgesResult.ok) {
      console.warn('[safeCreateEdgesGeometry] EdgesGeometry bounds validation failed, but returning anyway');
    }

    return edges;
  } catch (e) {
    console.error('[safeCreateEdgesGeometry] EdgesGeometry creation failed:', e);
    console.warn('[safeCreateEdgesGeometry] Returning fallback geometry to keep spawn pipeline alive');
    
    // Final fallback - minimal edges geometry
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(0.1, 0.1, 0.1));
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
