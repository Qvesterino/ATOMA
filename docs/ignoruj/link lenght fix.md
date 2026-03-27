AUDIT REPORT: Link Length/Size Modification Effects
I've completed a comprehensive audit of the ATOMA codebase for effects that modify link length or size. Here are my findings:

📋 SUMMARY
NO system directly shortens links. However, I found 5 effects that could make links appear shorter than the actual node-to-node distance:

🔍 KEY FINDINGS
1. NODE SURFACE ANCHORING (LinkRendererConduit.js, lines ~4320-4340)

const RADIUS_SCALE = 0.26;  // ← CRITICAL: Only 26% of node radius
const start = sourceCenter.clone().addScaledVector(linkDir, sourceRadius * RADIUS_SCALE);
const end = targetCenter.clone().addScaledVector(linkDir, -targetRadius * RADIUS_SCALE);
Effect: Links start/end at node SURFACES (not centers), reducing apparent length by ~74% of node radii at each endpoint.

2. SLIGHT ARC EFFECT (LinkRendererConduit.js, line ~4360)

const arcHeight = Math.min(1.5, dist * 0.1);  // 10% of distance as arc height
const mid = this._vec3.lerpVectors(start, end, 0.5);
mid.y += arcHeight;
Effect: Links follow a curved path (sagging rope effect). The arc is ~10% of distance, which could make the link appear shorter than a straight line.

3. LINK AURA VERTEX DISPLACEMENT (shaders/LinkAuraShader.js)

vec3 displaced = position + normalize(normal) * (noiseTotal + ...) * displacementFactor;
Effect: Displaces vertices along the NORMAL direction (perpendicular to surface). This makes the aura thicker/thinner, but does NOT change link length.

4. CORRUPTION BRAID MORPHING (LinkCorruptionMorphingSystem.js)

link.userData.braid_compression = 1.0 - (1.0 - braid) * 0.3;  // 0.7-1.0 range
Effect: Compresses strands tighter as corruption increases (70-100% of normal). This affects visual density but NOT geometry length.

5. LINK THICKNESS SCALING (LinkThicknessScaling_v1.js)

material.linewidth = material._baseLinewidth;  // 1x to 3x based on load
Effect: Changes link THICKNESS (width) based on network load, NOT length.

⚠️ MOST LIKELY CAUSE OF YOUR ISSUE
The node surface anchoring with RADIUS_SCALE = 0.26 is the primary reason links appear shorter.

Explanation:

If nodes have radius = 5.0 units
Link only attaches at 5.0 * 0.26 = 1.3 units from each center
Visually: Link appears 8.6 units shorter than the full center-to-center distance
To verify this is the cause:

Check if the gap is visible between the link endpoints and node surfaces
The link should appear to "float" slightly above the visible node mesh surface
🔧 SOLUTION OPTIONS
If you want links to appear longer or reach closer to actual node surfaces:

Option 1: Increase RADIUS_SCALE


// In LinkRendererConduit.js, line ~4326
const RADIUS_SCALE = 0.5;  // Or 0.65 for closer to surface
Option 2: Reduce Arc Height


// In LinkRendererConduit.js, line ~4360
const arcHeight = Math.min(1.5, dist * 0.05);  // Reduced from 0.1 to 0.05
Option 3: Use Center-to-Center (No Surface Docking) Change the anchoring logic to use node centers instead of surface points.

📊 QUICK REFERENCE
System	Modifies Length?	What It Actually Changes
Node Surface Anchoring	⚠️ YES (apparent)	Shortens visible link length
Arc Effect	⚠️ YES (apparent)	Curves path, adds sag
Aura Vertex Displacement	❌ NO	Aura thickness only
Corruption Morphing	❌ NO	Strand tightness, visual style
Thickness Scaling	❌ NO	Link width/linewidth
Resonance Scars	❌ NO	Overlay mesh scaling only
🎯 RECOMMENDATION
Start with RADIUS_SCALE adjustment. This is the most direct control over how much of the actual node-to-node distance is visually represented by the link geometry.

Try increasing RADIUS_SCALE from 0.26 to 0.4 or 0.5 and observe if the link length matches your expectations better.