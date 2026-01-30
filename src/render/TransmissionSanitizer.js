/**
 * One-time transmission sanitizer to prevent three.js RenderTransmissionPass.
 * Sets MeshPhysicalMaterial.transmission to 0 while storing original values for reversal.
 */
export function sanitizeTransmission(scene, { dryRun = false, log = true } = {}) {
  if (!scene) return [];

  const offenders = [];

  const maybeAdd = (mesh, material) => {
    if (!material?.isMeshPhysicalMaterial) return;
    if (!(material.transmission > 0)) return;

    offenders.push({ mesh, material });

    if (dryRun) return;

    material.userData = material.userData || {};
    if (material.userData.__origTransmission === undefined) {
      material.userData.__origTransmission = material.transmission;
    }
    if (material.userData.__origThickness === undefined && material.thickness !== undefined) {
      material.userData.__origThickness = material.thickness;
    }
    if (
      material.userData.__origAttenuationDistance === undefined &&
      material.attenuationDistance !== undefined
    ) {
      material.userData.__origAttenuationDistance = material.attenuationDistance;
    }

    material.transmission = 0;
    if (material.thickness > 0) material.thickness = 0;
    if (material.attenuationDistance > 0) material.attenuationDistance = 0;
    material.needsUpdate = true;
  };

  scene.traverse((obj) => {
    if (!obj.isMesh && !obj.isLine && !obj.isPoints) return;
    const mat = obj.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => maybeAdd(obj, m));
    } else if (mat) {
      maybeAdd(obj, mat);
    }
  });

  if (log) {
    const samples = offenders.slice(0, 10).map((o, idx) => {
      const name = o.mesh?.name || '(unnamed)';
      const src = o.material?.userData?.sourceHint || o.mesh?.userData?.sourceHint;
      const orig =
        o.material?.userData?.__origTransmission !== undefined
          ? o.material.userData.__origTransmission
          : o.material?.transmission;
      return `${idx + 1}) ${name} tx=${orig}${src ? ` source=${src}` : ''}`;
    });
    console.log(
      `[B.3.A] Transmission sanitized: ${offenders.length} materials${dryRun ? ' (dry run)' : ''}${
        samples.length ? ' | ' + samples.join(', ') : ''
      }`
    );
  }

  return offenders;
}

export function findTransmissionMaterials(scene) {
  return sanitizeTransmission(scene, { dryRun: true, log: false });
}
