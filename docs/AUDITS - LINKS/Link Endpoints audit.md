
Link Endpoints Found

LinkRendererConduit.js – update(link, deltaTime, time)

const sourcePos = link.source.position.clone();
const targetPos = link.target.position.clone();
const sourceRadius = link.source.userData?.auraRadius ?? link.source.scale?.x ?? 1.0;
const targetRadius = link.target.userData?.auraRadius ?? link.target.scale?.x ?? 1.0;
const linkDir = new THREE.Vector3().subVectors(targetPos, sourcePos);
...
const sourceOffset = sourceRadius * LinkExtensionConfig.sourceOffsetWithPenetration;
const targetOffset = targetRadius * LinkExtensionConfig.targetOffsetWithPenetration;
start = sourcePos.clone().addScaledVector(linkDir, sourceOffset);
end   = targetPos.clone().addScaledVector(linkDir, -targetOffset);
Uses node.position plus auraRadius/scale (radius proxy) via LinkExtensionConfig.
Endpoints are offset to node surface (penetrating slightly inward), not centers.
NodeLinkingSystem.js – updateLinkCurve(link)

const start = link.source.position;
const end   = link.target.position;
const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
const points = curve.getPoints(pointCount);
Uses raw node.position; no radius/bounding sphere.
Endpoints at node centers.
LinkRenderer.ts (React Three Fiber) – inside LinkRenderer component setup

const points = computeBezierPoints(
  fromNode.position,
  toNode.position,
  resolution,
  curvature
);
Uses node.position; no radius/bounding sphere.
Endpoints at node centers.
_NeuralCurveLinkVisuals.js – initializeControlPoints(curveData)

const start = link.source.position.clone();
const end   = link.target.position.clone();
curveData.controlPoints = [start.clone(), end.clone()];
Uses node.position; no radius/bounding sphere.
Endpoints at node centers.
(Other requested identifiers like LinkGeometry, LinkMesh, LinkLine, LinkCurve, LinkSpline are not present as standalone classes/files in the repo.)