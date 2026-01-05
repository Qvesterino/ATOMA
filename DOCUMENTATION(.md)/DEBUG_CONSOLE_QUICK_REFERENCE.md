# DEBUG CONSOLE QUICK REFERENCE

## Debug Mode Control

### Enable Debug Mode (All visuals disabled)
```javascript
window.DEBUG_VISUAL_MODE = true;
```

### Disable Debug Mode (Restore all visuals)
```javascript
window.DEBUG_VISUAL_MODE = false;
```

### Check Current Status
```javascript
console.log('DEBUG_VISUAL_MODE:', window.DEBUG_VISUAL_MODE);
```

---

## Node Interaction Testing

### Get all nodes
```javascript
const nodes = window.game.aiNodes.nodes;
console.log('Total nodes:', nodes.length);
```

### Get a specific node
```javascript
const node = window.game.aiNodes.nodes[0];
console.log('Node:', node);
console.log('Position:', node.position);
console.log('Name:', node.userData?.name);
```

### Check node visibility
```javascript
window.game.aiNodes.nodes.forEach((node, i) => {
  console.log(`Node ${i}: visible=${node.visible}, opacity=${node.material?.opacity}`);
});
```

### Force all nodes visible
```javascript
window.game.aiNodes.nodes.forEach(node => {
  node.visible = true;
  if (node.material) node.material.opacity = 1.0;
});
```

---

## Link Testing

### Get all links
```javascript
const links = window.game.linkingSystem.links;
console.log('Total links:', links.length);
```

### Get a specific link
```javascript
const link = window.game.linkingSystem.links[0];
console.log('Link:', link);
console.log('Source:', link.sourceNode);
console.log('Target:', link.targetNode);
```

### Create a test link (between first two nodes)
```javascript
if (window.game.aiNodes.nodes.length >= 2) {
  window.game.linkingSystem.createLink(
    window.game.aiNodes.nodes[0],
    window.game.aiNodes.nodes[1]
  );
  console.log('Test link created');
}
```

### Delete all links
```javascript
const links = [...window.game.linkingSystem.links];
links.forEach(link => {
  window.game.linkingSystem.removeLink(link);
});
console.log('All links deleted');
```

---

## Performance Profiling

### Check frame time (Chrome DevTools)
```
1. Press F12
2. Go to Performance tab
3. Press Record
4. Wait 5 seconds
5. Stop recording
6. Look for average frame time
```

### Check memory usage
```javascript
if (performance.memory) {
  console.log('Memory Usage:');
  console.log('Used:', (performance.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
  console.log('Total:', (performance.memory.totalJSHeapSize / 1048576).toFixed(2), 'MB');
  console.log('Limit:', (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2), 'MB');
}
```

---

## Scene Inspection

### Get scene statistics
```javascript
const scene = window.game.scene;
console.log('Scene children:', scene.children.length);
console.log('Meshes:', scene.children.filter(c => c.isMesh).length);
console.log('Groups:', scene.children.filter(c => c.isGroup).length);
```

### Get renderer info
```javascript
const renderer = window.game.renderer;
const info = renderer.info;
console.log('Render Info:');
console.log('Triangles:', info.render.triangles);
console.log('Calls:', info.render.calls);
console.log('Materials:', info.memory.materials);
console.log('Textures:', info.memory.textures);
```

---

## Interaction Testing

### Test node raycast
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);  // Center of screen

raycaster.setFromCamera(mouse, window.game.camera);
const intersects = raycaster.intersectObjects(window.game.scene.children, true);
console.log('Intersections:', intersects.length);
intersects.slice(0, 5).forEach((hit, i) => {
  console.log(`Hit ${i}:`, hit.object.name, hit.distance.toFixed(2));
});
```

### Manually click a node
```javascript
const node = window.game.aiNodes.nodes[0];
const event = { object: node };
window.game.linkingSystem.onNodeClicked(event);
console.log('Node clicked programmatically');
```

---

## Visual System Status

### Check which visual systems are running
```javascript
console.log({
  'NodePersonalitySystem': !!window.game.nodePersonalitySystem,
  'NodeMicroEvents': !!window.game.nodeMicroEvents,
  'SafeMetricsFX': !!window.game.metricsVisualFX,
  'NeonLinkVisuals': !!window.game.linkingSystem?.renderer,
  'DEBUG_MODE': window.DEBUG_VISUAL_MODE
});
```

### Check node personality system state
```javascript
if (window.game.nodePersonalitySystem) {
  const personalities = window.game.nodePersonalitySystem.nodePersonalities;
  console.log(`Registered personalities: ${personalities.size}`);
  personalities.forEach((data, uuid) => {
    console.log(`${uuid}: ${data.personality.type}`);
  });
}
```

---

## Common Issues & Solutions

### Issue: Nodes not clickable
**Solution:**
```javascript
window.DEBUG_VISUAL_MODE = true;
// Refresh page or wait for next scene update
```

### Issue: Links not visible
**Solution:**
```javascript
// Check link count
console.log('Links:', window.game.linkingSystem.links.length);

// Create test link
window.game.linkingSystem.createLink(
  window.game.aiNodes.nodes[0],
  window.game.aiNodes.nodes[1]
);
```

### Issue: Frame rate dropping
**Solution:**
```javascript
// Enable debug mode to disable visual updates
window.DEBUG_VISUAL_MODE = true;

// Check render info
console.log(window.game.renderer.info);

// Profile in Chrome DevTools
```

### Issue: Unstable scene
**Solution:**
```javascript
// Reset to debug mode
window.DEBUG_VISUAL_MODE = true;

// Clear and recreate nodes
window.game.aiNodes.nodes = [];
window.game.scene.clear();
window.game.createAINodes();
```

---

## Useful Console One-Liners

### Disable all animations
```javascript
window.DEBUG_VISUAL_MODE = true;
```

### Count all meshes
```javascript
console.log(window.game.scene.children.reduce((c, o) => c + (o.isMesh ? 1 : 0), 0));
```

### List all materials
```javascript
const mats = new Set();
window.game.scene.traverse(o => { if (o.material) mats.add(o.material.type); });
console.log([...mats]);
```

### Dump node data to CSV
```javascript
window.game.aiNodes.nodes.forEach(n => {
  console.log(`${n.userData.name || 'unnamed'},${n.position.x.toFixed(2)},${n.position.y.toFixed(2)},${n.position.z.toFixed(2)}`);
});
```

---

**Last Updated**: Session 103  
**Status**: Ready for Testing
