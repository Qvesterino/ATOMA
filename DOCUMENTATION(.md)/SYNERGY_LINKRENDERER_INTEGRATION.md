# SynergyEngine ↔ LinkRenderer Integration Guide

## Overview

This guide shows how to integrate **SynergyEngine** with your existing **LinkRenderer.ts** to create intelligent, synergy-aware link visualization.

---

## Architecture

```
LinkRenderer.tsx (React Three Fiber)
    ↓
evaluateLink() → SynergyEngine
    ↓
SynergyResult (type, score, energy, visual)
    ↓
LinkComponent (shader with synergy uniforms)
    ↓
Rendered: Color, pulse, warp, glitch, thickness
```

---

## Step 1: Import SynergyEngine

In your LinkRenderer or link rendering component:

```typescript
import { SynergyEngine, type SynergyResult } from './SynergyEngine';
import type { Link } from './LinkEngine';
```

---

## Step 2: Initialize Engine

### Option A: Standalone Component

```typescript
import { useRef, useMemo } from 'react';

function LinkRenderer({ nodes, links, selectedLink }) {
  const synergyEngineRef = useRef<SynergyEngine | null>(null);

  // Initialize engine
  useMemo(() => {
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    synergyEngineRef.current = new SynergyEngine(nodesMap);
    
    const linksMap = new Map(links.map(l => [l.id, l]));
    synergyEngineRef.current.setLinks(linksMap);
  }, [nodes, links]);

  // ... rest of component
}
```

### Option B: Global Context

```typescript
import { createContext, useContext, useMemo } from 'react';

const SynergyContext = createContext<SynergyEngine | null>(null);

export function SynergyProvider({ children, nodes, links }) {
  const engine = useMemo(() => {
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    const linksMap = new Map(links.map(l => [l.id, l]));
    
    const e = new SynergyEngine(nodesMap);
    e.setLinks(linksMap);
    return e;
  }, [nodes, links]);

  return (
    <SynergyContext.Provider value={engine}>
      {children}
    </SynergyContext.Provider>
  );
}

export function useSynergy() {
  const engine = useContext(SynergyContext);
  if (!engine) throw new Error('useSynergy must be inside SynergyProvider');
  return engine;
}
```

---

## Step 3: Evaluate Link Synergy

### For Single Link

```typescript
function LinkComponent({ link }: { link: Link }) {
  const engine = synergyEngineRef.current;
  
  const synergy = useMemo(() => {
    if (!engine) return null;
    return engine.evaluateLink(link);
  }, [link, engine]);

  if (!synergy) return null;

  return (
    <LinkVisual 
      link={link}
      synergy={synergy}
    />
  );
}
```

### For All Links (Batch)

```typescript
function AllLinksRenderer({ links }) {
  const engine = synergyEngineRef.current;
  
  const synergies = useMemo(() => {
    if (!engine) return new Map();
    
    const map = new Map<string, SynergyResult>();
    for (const link of links) {
      map.set(link.id, engine.evaluateLink(link));
    }
    return map;
  }, [links, engine]);

  return (
    <>
      {links.map(link => (
        <LinkVisual
          key={link.id}
          link={link}
          synergy={synergies.get(link.id)}
        />
      ))}
    </>
  );
}
```

---

## Step 4: Create Shader Uniforms

```typescript
function LinkVisual({ 
  link, 
  synergy 
}: { 
  link: Link
  synergy: SynergyResult 
}) {
  const visual = synergy.visual;

  const shaderUniforms = useMemo(() => ({
    // Synergy-based visual properties
    linkColor: { value: new THREE.Color(visual.color) },
    pulseSpeed: { value: visual.pulseSpeed },
    warpIntensity: { value: visual.warpIntensity },
    thickness: { value: visual.thickness },
    glitch: { value: visual.glitch },
    
    // Standard link properties
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    
    // Optional: synergy metadata
    synergyScore: { value: synergy.score },
    synergyEnergy: { value: synergy.energy },
  }), [visual, synergy]);

  return (
    <LinkMesh 
      link={link}
      uniforms={shaderUniforms}
    />
  );
}
```

---

## Step 5: Update Shader Material

In your link shader (GLSL):

```glsl
// Vertex Shader
uniform float thickness;
uniform float pulseSpeed;
varying vec3 vColor;

void main() {
  // Apply thickness
  vec3 offset = normal * thickness * 0.1;
  
  // Pulse animation
  float pulse = 1.0 + sin(time * pulseSpeed) * 0.3;
  offset *= pulse;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
  vColor = position; // For fragment shader
}
```

```glsl
// Fragment Shader
uniform vec3 linkColor;
uniform float warpIntensity;
uniform float glitch;
varying vec3 vColor;

void main() {
  // Base color
  vec3 color = linkColor;
  
  // Warp effect
  vec3 distortion = sin(vColor * 10.0 + time) * warpIntensity;
  color += distortion;
  
  // Glitch effect
  if (mod(vColor.y + time * 5.0, 1.0) < glitch) {
    color += vec3(rand(vColor));
  }
  
  gl_FragColor = vec4(color, 1.0);
}
```

---

## Step 6: Add Interactivity

### Highlight Synergy on Hover

```typescript
function LinkVisual({ link, synergy, isHovered, isSelected }) {
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  
  const effectiveHovered = isHovered || isLocalHovered;
  const effectiveSelected = isSelected;

  const shaderUniforms = useMemo(() => {
    let visual = synergy.visual;
    
    // Amplify visuals when hovered
    if (effectiveHovered) {
      visual = {
        ...visual,
        pulseSpeed: visual.pulseSpeed * 1.5,
        warpIntensity: Math.min(1.0, visual.warpIntensity * 1.5),
        thickness: visual.thickness * 1.2,
        glitch: Math.min(1.0, visual.glitch * 1.3),
      };
    }
    
    // Highlight when selected
    if (effectiveSelected) {
      visual = {
        ...visual,
        thickness: visual.thickness * 1.5,
        pulseSpeed: visual.pulseSpeed * 2,
      };
    }

    return {
      linkColor: { value: new THREE.Color(visual.color) },
      pulseSpeed: { value: visual.pulseSpeed },
      warpIntensity: { value: visual.warpIntensity },
      thickness: { value: visual.thickness },
      glitch: { value: visual.glitch },
    };
  }, [synergy, effectiveHovered, effectiveSelected]);

  return (
    <mesh
      onPointerEnter={() => setIsLocalHovered(true)}
      onPointerLeave={() => setIsLocalHovered(false)}
    >
      {/* Link geometry with uniforms */}
    </mesh>
  );
}
```

### Show Synergy Details on Selection

```typescript
function LinkInfoPanel({ selectedLink, engine }) {
  const synergy = useMemo(() => {
    if (!selectedLink || !engine) return null;
    return engine.evaluateLink(selectedLink);
  }, [selectedLink, engine]);

  if (!synergy) return null;

  return (
    <div className="link-info">
      <div>Type: <strong>{synergy.type}</strong></div>
      <div>Score: <strong>{synergy.score.toFixed(2)}</strong> / 3.0</div>
      <div>Energy: <strong>{(synergy.energy * 100).toFixed(1)}%</strong></div>
      <div>Color: <span style={{ color: synergy.visual.color }}>■</span> {synergy.visual.color}</div>
      
      <details>
        <summary>Details</summary>
        {synergy.details.map((detail, i) => (
          <div key={i} className="detail">→ {detail}</div>
        ))}
      </details>
    </div>
  );
}
```

---

## Step 7: Network-Wide Synergy Visualization

### Synergy Type Overlay

```typescript
function SynergyLegend() {
  return (
    <div className="synergy-legend">
      <div className="legend-item">
        <span className="swatch" style={{ background: '#00dddd' }}></span>
        Linear
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: '#00ff88' }}></span>
        Complement
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: '#ff00ff' }}></span>
        Fusion
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: '#6633ff' }}></span>
        Quantum
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: '#00ff00' }}></span>
        Sigma
      </div>
      <div className="legend-item">
        <span className="swatch" style={{ background: '#00ffff' }}></span>
        Fractal
      </div>
    </div>
  );
}
```

### Network Health Indicator

```typescript
function NetworkHealthPanel({ engine }) {
  const stats = useMemo(() => {
    if (!engine) return null;
    return engine.getNetworkSynergyStats();
  }, [engine]);

  if (!stats) return null;

  const healthPercent = (stats.avgScore / 3.0) * 100;
  const healthColor = 
    healthPercent > 70 ? '#00ff00' :
    healthPercent > 40 ? '#ffff00' :
    '#ff0000';

  return (
    <div className="network-health">
      <h3>Network Health</h3>
      <div className="health-bar">
        <div 
          className="health-fill" 
          style={{ 
            width: `${healthPercent}%`,
            background: healthColor 
          }}
        />
      </div>
      <div className="stats">
        <div>Avg Score: {stats.avgScore.toFixed(2)}</div>
        <div>Total Energy: {(stats.avgEnergy * 100).toFixed(1)}%</div>
        <div>Total Links: {stats.totalLinks}</div>
      </div>
      
      <details>
        <summary>Type Distribution</summary>
        {Object.entries(stats.typeCounts).map(([type, count]) => (
          count > 0 && (
            <div key={type}>
              {type}: {count}
            </div>
          )
        ))}
      </details>
    </div>
  );
}
```

---

## Step 8: Performance Optimization

### Memoization Pattern

```typescript
const synergies = useMemo(() => {
  const map = new Map<string, SynergyResult>();
  if (!engine) return map;
  
  for (const link of links) {
    map.set(link.id, engine.evaluateLink(link));
  }
  return map;
}, [links, engine]); // Update only when links or engine changes
```

### Batch Rendering

```typescript
function BatchLinksRenderer({ links, engine }) {
  // Get visual style for entire group
  const groupVisual = useMemo(() => {
    if (!engine || links.length === 0) return null;
    return engine.getGroupVisual(links.map(l => l.id));
  }, [links, engine]);

  if (!groupVisual) return null;

  // Use single material for all links in group
  const material = useMemo(() => (
    new THREE.ShaderMaterial({
      uniforms: {
        linkColor: { value: new THREE.Color(groupVisual.color) },
        pulseSpeed: { value: groupVisual.pulseSpeed },
        warpIntensity: { value: groupVisual.warpIntensity },
        thickness: { value: groupVisual.thickness },
        glitch: { value: groupVisual.glitch },
      },
    })
  ), [groupVisual]);

  return (
    <>
      {links.map(link => (
        <LinkGeometry key={link.id} link={link} material={material} />
      ))}
    </>
  );
}
```

---

## Step 9: Real-Time Updates

### Update on Node Change

```typescript
function LinkRenderer({ nodes, links }) {
  const engineRef = useRef<SynergyEngine | null>(null);

  useEffect(() => {
    if (!engineRef.current) return;
    
    // Update nodes in engine
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    engineRef.current.setNodes(nodesMap);
  }, [nodes]);

  useEffect(() => {
    if (!engineRef.current) return;
    
    // Update links in engine
    const linksMap = new Map(links.map(l => [l.id, l]));
    engineRef.current.setLinks(linksMap);
  }, [links]);

  // ... render links
}
```

### Cache Management

```typescript
function handleNodeUpdate(nodeId: string, newData: Partial<Node>) {
  // Update node in state
  setNodes(nodes.map(n => 
    n.id === nodeId ? { ...n, ...newData } : n
  ));

  // Let useEffect handle engine update
  // SynergyEngine will automatically clear caches
}
```

---

## Step 10: Complete Integration Example

```typescript
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SynergyEngine } from './SynergyEngine';
import type { Link } from './LinkEngine';
import type { Node } from './SynergyEngine';

function LinkRenderer({ 
  nodes, 
  links, 
  selectedLink, 
  onSelectLink 
}: {
  nodes: Node[]
  links: Link[]
  selectedLink: Link | null
  onSelectLink: (link: Link | null) => void
}) {
  // Engine setup
  const engineRef = useRef<SynergyEngine | null>(null);
  const [synergies, setSynergies] = useState<Map<string, SynergyResult>>(new Map());

  // Initialize engine
  useMemo(() => {
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    engineRef.current = new SynergyEngine(nodesMap);
    
    const linksMap = new Map(links.map(l => [l.id, l]));
    engineRef.current.setLinks(linksMap);
  }, [nodes, links]);

  // Evaluate all links
  useMemo(() => {
    if (!engineRef.current) return;
    
    const map = new Map<string, SynergyResult>();
    for (const link of links) {
      map.set(link.id, engineRef.current.evaluateLink(link));
    }
    setSynergies(map);
  }, [links]);

  return (
    <group>
      {/* Render all links with synergy visuals */}
      {links.map(link => {
        const synergy = synergies.get(link.id);
        if (!synergy) return null;

        return (
          <LinkVisual
            key={link.id}
            link={link}
            synergy={synergy}
            isSelected={selectedLink?.id === link.id}
            onSelect={() => onSelectLink(link)}
          />
        );
      })}

      {/* Info panel */}
      {selectedLink && engineRef.current && (
        <LinkInfoPanel
          selectedLink={selectedLink}
          synergy={synergies.get(selectedLink.id)}
          engine={engineRef.current}
        />
      )}
    </group>
  );
}

function LinkVisual({ 
  link, 
  synergy, 
  isSelected,
  onSelect 
}: {
  link: Link
  synergy: SynergyResult
  isSelected: boolean
  onSelect: () => void
}) {
  const visual = isSelected 
    ? {
        ...synergy.visual,
        thickness: synergy.visual.thickness * 1.5,
        pulseSpeed: synergy.visual.pulseSpeed * 1.5,
      }
    : synergy.visual;

  const uniforms = useMemo(() => ({
    linkColor: { value: new THREE.Color(visual.color) },
    pulseSpeed: { value: visual.pulseSpeed },
    warpIntensity: { value: visual.warpIntensity },
    thickness: { value: visual.thickness },
    glitch: { value: visual.glitch },
  }), [visual]);

  return (
    <mesh onClick={onSelect}>
      {/* Your link geometry here */}
    </mesh>
  );
}

export default LinkRenderer;
```

---

## CSS Styling

```css
.link-info {
  position: fixed;
  bottom: 30px;
  left: 30px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid #00dddd;
  padding: 15px;
  border-radius: 8px;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
  max-width: 300px;
}

.link-info div {
  margin: 5px 0;
}

.link-info strong {
  color: #00ffff;
}

.synergy-legend {
  position: fixed;
  top: 200px;
  right: 30px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid #6633ff;
  padding: 15px;
  border-radius: 8px;
  color: #00ddff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.network-health {
  position: fixed;
  top: 500px;
  right: 30px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid #00ff00;
  padding: 15px;
  border-radius: 8px;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  min-width: 200px;
}

.health-bar {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
}

.health-fill {
  height: 100%;
  transition: all 0.3s ease;
}
```

---

## Summary

The integration pattern is:

1. **Initialize** SynergyEngine with nodes/links
2. **Evaluate** links to get SynergyResult
3. **Extract** visual properties (color, pulse, warp, glitch, thickness)
4. **Create** shader uniforms from visual
5. **Render** links with synergy-based materials
6. **Update** engine when nodes/links change
7. **Display** synergy info in UI

Result: **Intelligent, visually distinct links** that reflect the emergent behavior of node connections! 🚀

