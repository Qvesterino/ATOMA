CAMERA_AUTHORITY_CONTRACT

- Only FirstPersonCameraController may:
  - write camera.position
  - write camera.quaternion / rotation
  - call updateProjectionMatrix (except resize)

- All other systems:
  - may write ONLY to cameraIntent / registry
  - or perform event-based, one-shot transforms