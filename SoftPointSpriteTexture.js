import * as THREE from 'three';

export function createSoftPointSpriteTexture(size = 128) {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size, size) : null);

  if (!canvas) {
    return null;
  }

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext?.('2d');
  if (!context) {
    return null;
  }

  const center = size * 0.5;
  const gradient = context.createRadialGradient(center, center, size * 0.04, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.52, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}