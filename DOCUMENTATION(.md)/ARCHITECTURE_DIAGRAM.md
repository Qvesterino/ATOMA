# NODE SURFACE PROTECTION ARCHITECTURE

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ATOMA Game Engine                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scene Setup (createAINodes)                         │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  1. Create AI nodes (15+ nodes)                      │   │
│  │  2. Initialize Defensive Hardening (renderOrder)    │   │
│  │  3. Initialize Node Surface Protection (NEW)        │   │
│  │     ↓                                                │   │
│  │     setupNodeSurfaceProtection(game)                │   │
│  │     - Scan all nodes                                │   │
│  │     - Create anchors for transparent cores          │   │
│  │     - Hook node spawn events                        │   │
│  │     - Hook link creation events                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node Protection Flow                                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  Node = { userData: { requiresDepthAnchor: ? } }   │   │
│  │    ↓                                                │   │
│  │    protectNode(node)                               │   │
│  │    ├─ Check flag: requiresDepthAnchor?            │   │
│  │    ├─ If false → return (skip)                    │   │
│  │    ├─ If true → continue                          │   │
│  │    ├─ Find core mesh                              │   │
│  │    ├─ Create depth anchor                         │   │
│  │    │  {                                            │   │
│  │    │    geometry: coreGeometry.clone()            │   │
│  │    │    material: {                               │   │
│  │    │      depthWrite: true    ← KEY              │   │
│  │    │      opacity: 0.001                          │   │
│  │    │    }                                          │   │
│  │    │    renderOrder: 100                          │   │
│  │    │  }                                            │   │
│  │    ├─ Add anchor to node                          │   │
│  │    └─ Mark protected (WeakSet)                    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Rendering Pipeline (Post-Link)                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  1. Aura (renderOrder 10)                          │   │
│  │     • depthWrite: false                            │   │
│  │     • opacity: 0.25                                │   │
│  │     • Writes to color buffer ONLY                  │   │
│  │     → Aura color added to framebuffer              │   │
│  │                                                      │   │
│  │  2. Depth Anchor (renderOrder 100)                 │   │
│  │     • depthWrite: true  ← Writes depth!           │   │
│  │     • opacity: 0.001                               │   │
│  │     • Invisible but reserves core area             │   │
│  │     → Depth buffer updated (protects core area)    │   │
│  │                                                      │   │
│  │  3. Core (renderOrder 100)                         │   │
│  │     • depthWrite: true                             │   │
│  │     • transparent/holographic shader               │   │
│  │     • Renders LAST                                 │   │
│  │     → Core visible on top, never occluded          │   │
│  │                                                      │   │
│  │  Visual Stack:                                     │   │
│  │  ┌─────────────────────┐                          │   │
│  │  │  Core (visible)     │ ← renderOrder 100         │   │
│  │  ├─────────────────────┤                          │   │
│  │  │ Depth Anchor(inv)   │ ← renderOrder 100 (+0.01)│   │
│  │  ├─────────────────────┤                          │   │
│  │  │ Aura (context)      │ ← renderOrder 10         │   │
│  │  ├─────────────────────┤                          │   │
│  │  │ Background          │                          │   │
│  │  └─────────────────────┘                          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Event Hooks                                         │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  Node Spawn Hook:                                  │   │
│  │  ├─ AINodes.spawnNode() called                    │   │
│  │  ├─ New node created                              │   │
│  │  └─ Auto-call: protectNode(newNode)               │   │
│  │                                                      │   │
│  │  Link Creation Hook:                               │   │
│  │  ├─ LinkingSystem.createLink() called             │   │
│  │  ├─ Link observer fires: onLinkCreated()          │   │
│  │  ├─ Auto-call: protectNode(link.nodes[0])         │   │
│  │  └─ Auto-call: protectNode(link.nodes[1])         │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Control Flow

```
Game Initialization
  │
  ├─ createAINodes()
  │  ├─ Create 15 nodes
  │  │
  │  ├─ applyAllDefensivePatches()  [Session 24]
  │  │  └─ Set renderOrder hierarchy (core 100 > aura 10)
  │  │
  │  └─ setupNodeSurfaceProtection()  [NEW]
  │     ├─ For each node:
  │     │  ├─ Check flag: node.userData.requiresDepthAnchor
  │     │  ├─ If false → skip
  │     │  ├─ If true:
  │     │  │  ├─ Check material is transparent
  │     │  │  ├─ Create depth anchor
  │     │  │  └─ Add to node
  │     │  └─ Mark protected (prevent duplicates)
  │     │
  │     ├─ Hook node spawn:
  │     │  └─ protectNode() called on new nodes
  │     │
  │     └─ Hook link events:
  │        └─ protectNode() called on linked nodes
  │
  └─ animate() loop (per-frame)
     ├─ Update AI nodes, camera, etc.
     ├─ Render scene (renderOrder governs order)
     └─ NO per-frame protection logic
```

---

## File Structure

```
/main.js
  ├─ Line 98: import setupNodeSurfaceProtection
  └─ Lines 1586–1595: Initialize in createAINodes()

/NodeSurfaceProtection_DepthAnchor.js
  ├─ NodeSurfaceProtection_DepthAnchor class
  │  ├─ config: {debugEnabled, anchorOpacity, anchorScale}
  │  ├─ protectedNodes: WeakSet (track protected nodes)
  │  ├─ protectNode(node) — Main method
  │  ├─ _createDepthAnchor() — Create invisible anchor
  │  ├─ _checkNeedsDepthAnchor() — Check if needs protection
  │  ├─ forceProtectNode() — Override flag
  │  ├─ isProtected() — Check status
  │  └─ printStatus() — Debug logging
  │
  └─ setupNodeSurfaceProtection(game) — Helper
     ├─ Create protection instance
     ├─ Protect all nodes
     ├─ Hook node spawn
     ├─ Hook link events
     └─ Return instance

/DefensiveHardeningPatch_v1.js [Prerequisite]
  ├─ applyNodeSurfaceDominanceLayer() — renderOrder setup
  ├─ correctPostLinkLayering() — Post-link correction
  └─ applyAllDefensivePatches() — Initialization
```

---

## Opt-In Flag Usage

```
Option 1: Code-Time Flag (Recommended)
┌─────────────────────────────────────────────────────────┐
│ In EnhancedNodeModels.js:                              │
│                                                         │
│ static createInputNode1(group, color) {                │
│   // ... create sphere, rings, etc ...                 │
│   group.userData.requiresDepthAnchor = true;  ← ADD   │
│   return group;                                        │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Option 2: Runtime Flag (Testing)
┌─────────────────────────────────────────────────────────┐
│ In browser console:                                     │
│                                                         │
│ game.aiNodes.nodes[5].userData.requiresDepthAnchor = true;
│ game.nodeSurfaceDepthAnchor.protectNode(               │
│   game.aiNodes.nodes[5]                                │
│ );                                                      │
└─────────────────────────────────────────────────────────┘

Option 3: visualProfile Flag
┌─────────────────────────────────────────────────────────┐
│ In node creation:                                       │
│                                                         │
│ node.visualProfile.requiresDepthAnchor = true;         │
│                                                         │
│ System checks both userData and visualProfile          │
└─────────────────────────────────────────────────────────┘
```

---

## Before vs After Rendering

### BEFORE (Problem)
```
Framebuffer:
  Background (black)
  ↓ Aura renders (NO depth write)
  Aura color + Background = Medium green
  ↓ Transparent core renders (NO depth write)
  Core color blends with aura
  Final: Dark blue-green mix
  RESULT: Core invisible/faded
```

### AFTER (Fixed)
```
Framebuffer + DepthBuffer:
  Background (black) + depth[0]
  ↓ Aura renders (NO depth write)
  Aura color written, depth unchanged
  ↓ Depth Anchor renders (YES depth write)
  Nearly invisible (0.001 opacity), depth written
  ↓ Core renders (YES depth write)
  Core color renders, depth written
  RESULT: Core visible on top, aura at edges
```

---

## Key Insight: Why Depth Buffer Matters

```
Without Depth Anchor:
  Core material: transparent: true, depthWrite: false
  ↓ Doesn't write to depth buffer
  ↓ Can't reserve space in framebuffer
  ↓ Aura renders, overwrites core area
  ↓ Core just blends on top of aura
  Result: Transparency + layering = occlusion

With Depth Anchor:
  Anchor material: transparent: true, depthWrite: true
  ↓ Writes to depth buffer (reserves space)
  ↓ Aura sees depth barrier, doesn't write there
  ↓ Core renders in protected area
  ↓ Core visible despite aura
  Result: Transparency + depth = protection
```

---

**Architecture: Clean, minimal, surgical. No system modifications.**
