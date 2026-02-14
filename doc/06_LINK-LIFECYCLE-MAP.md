LINK-LIFECYCLE-MAP (FORENSIC ANALYSIS)
READ ONLY - NO CODE CHANGES EXECUTED
EXECUTIVE SUMMARY
1) Number of files touching links: 7 primary systems
NodeLinkingSystem.js (primary authority)
LinkBeadSystem.js (bead/trail effects)
LinkPriorityDecayEngine.js (priority decay)
DynamicLinkColorSystem.js (dynamic color changes)
LinkSynergyColorTransition.js (synergy-driven transitions)
AnimatedLinkFlow.js (data packet flow visualization)
LinkAuraSystem_v1.js (GPU-driven cylindrical auras)
2) Primary creation authority: NodeLinkingSystem.createLink()
Braided Conduit link creation (primary path)
createLinkLegacy() as fallback for extreme mode
3) Systems mutating links after creation: 7 active visual mutation systems
4) Potential conflicting authorities: HIGH RISK DETECTED
DETAILED LIFECYCLE MAP
PHASE 1: LINK CREATION
System/Function	File	Lifecycle Role
validateLink()	NodeLinkingSystem.js	Validation (self-link, duplicate, load pressure)
createLink()	NodeLinkingSystem.js	Creation (primary braided conduit path)
createLinkLegacy()	NodeLinkingSystem.js	Creation (fallback extreme mode path)
attemptLink()	NodeLinkingSystem.js	Selection → Toggle (create/remove)
LinkRendererConduit.createLinkVisuals()	LinkRendererConduit.js	Scene attachment & visual setup
this.scene.add(linkGroup)	NodeLinkingSystem.js	Scene attachment
this.links.push(link)	NodeLinkingSystem.js	Registration (main array)
_addLinkToIndex(link)	NodeLinkingSystem.js	Registration (persistent nodeId→links map)
nodeIdToLinks.set(nodeId, [...])	NodeLinkingSystem.js	Registration (internal map)
this.visuals.registerLink()	NodeLinkingSystem.js	Visual setup (NeonLinkVisuals)
this.thicknessSystem.registerLinkCurve()	NodeLinkingSystem.js	Visual setup (DynamicThicknessSystem)
LinkPrioritySystem.initializeLinkPriority()	NodeLinkingSystem.js	Metrics/gameplay logic (priority)
LinkEmissionPulsingSystem.initializeLinkEmissionPulsing()	NodeLinkingSystem.js	Visual setup (emission pulse)
NodeDepthAndHoloPreservationFix.enforceLinkDepthAuthority()	NodeLinkingSystem.js	Visual setup (depth properties)
ComputeSynergyScore2_0()	NodeLinkingSystem.js	Metrics/gameplay logic (synergy calculation)
updateLinkMetrics()	NodeLinkingSystem.js	Metrics/gameplay logic (apply metrics to visuals)
initializeLinkSynergyColor()	NodeLinkingSystem.js	Visual setup (initial synergy color)
initializeParticleSynergyColors()	NodeLinkingSystem.js	Visual setup (particle colors)
_fireLinkCreatedCallbacks()	NodeLinkingSystem.js	Event notification
onLinkCreated()	src/metrics/NodeMetricEngine.js	Canonical metrics hook
Fields Initialized at Creation:

{
  // Connection data
  source: sourceNode,
  target: targetNode,
  sourceNodeId: string,
  targetNodeId: string,
  
  // Visual container
  group: THREE.Group,  // Added to scene
  active: true,
  
  // Traffic simulation
  traffic: {
    load: number,        // 0.1-1.0, fluctuates
    throughput: number,  // 0.5-1.0, based on load
    priority: number,    // 0.2-1.0, affects visual emphasis
    bottleneck: boolean  // High load + low throughput
  },
  
  // Animation state
  animation: {
    pulsePhase: number,  // Random initial phase
    glowIntensity: number,
    veinPhase: number,
    bloomPhase: number,
    edgePulse: number,
    hoverBoost: number
  },
  
  // Identity
  id: `link-${counter}`,
  createdAt: timestamp,
  
  // Compatibility flags
  vfxEnabled: true,
  extremeMode: false,
  
  // Visual state
  visualState: 'pending' | 'ready',
  
  // Metrics
  synergyScore: number,
  corruptionLevel: number,
  harmonyScore: number,
  
  // Conduit state (braided links)
  group.userData.conduitState: {
    strands: THREE.Line[],
    baseColor: number
  }
}
PHASE 2: RUNTIME MUTATION (PER-FRAME)
System/Function	File	Mutates	Trigger
conduitRenderer.update()	NodeLinkingSystem.js	geometry.position	Per frame
LinkEmissionPulsingSystem.updateLinkEmissionPulsing()	NodeLinkingSystem.js	emissiveIntensity	Per frame (traffic-based)
updateLinkCurve()	NodeLinkingSystem.js	geometry.position	Per frame (node movement)
updateLinkColorTransition()	LinkSynergyColorTransition.js	material.color, material.emissive	Per frame (synergy change)
updateParticleColorTransition()	LinkSynergyColorTransition.js	material.color, material.emissive, material.opacity	Per frame (synergy change)
thicknessSystem.updateLinkThickness()	NodeLinkingSystem.js	material.linewidth	Per frame (traffic load)
visuals.updateLinkState()	NodeLinkingSystem.js	material.color, opacity	Per frame (metrics)
LinkPrioritySystem.applyTrafficDecay()	NodeLinkingSystem.js	priority field	Every 500ms
flowSystem.animate()	AnimatedLinkFlow.js	material.color, emissiveIntensity, mesh.scale, mesh.opacity	Per frame
auraSystem.update()	LinkAuraSystem_v1.js	mesh.position, mesh.scale, material.uniforms	Per frame
updateLinkAnimations()	NodeLinkingSystem.js	material.opacity, material.color, mesh.scale	Per frame (10 VFX effects)
updateLinkVFXEffects()	NodeLinkingSystem.js	material.opacity, material.color, mesh.position, mesh.scale	Per frame (effects 1-10)
PHASE 3: DIRECT VISUAL MUTATIONS
Property	Mutating Systems	Mutation Type
link.coreLine.material.opacity	updateLinkAnimations(), updateLinkVFXEffects()	Per-frame traffic pulse
link.coreLine.material.color	updateLinkAnimations(), LinkSynergyColorTransition	Traffic bottleneck, synergy changes
link.midGlowLine.material.opacity	updateLinkAnimations(), updateLinkVFXEffects()	Per-frame halo pulse
link.midGlowLine.material.color	updateLinkAnimations(), LinkSynergyColorTransition	Bottleneck, synergy
link.haloLine.material.opacity	updateLinkAnimations(), updateLinkVFXEffects()	Per-frame halo pulse
link.haloLine.material.color	updateLinkAnimations(), LinkSynergyColorTransition	Bottleneck, synergy
link.bloomAuraLine.material.opacity	updateLinkAnimations()	Bloom pulse
link.edgeLine.material.opacity	updateLinkAnimations(), updateLinkVFXEffects()	Edge shimmer
link.group.userData.conduitState.strands[].material.color	LinkSynergyColorTransition	Synergy-driven color
link.group.userData.conduitState.strands[].material.emissive	LinkSynergyColorTransition	Synergy-driven emissive
link.particles[].material.opacity	updateLinkAnimations(), updateLinkVFXEffects(), LinkSynergyColorTransition	Fade in/out, traffic load
link.particles[].material.color	LinkSynergyColorTransition	Synergy-driven color
link.particles[].material.emissive	LinkSynergyColorTransition	Synergy-driven emissive
link.particles[].material.emissiveIntensity	LinkSynergyColorTransition, updateLinkAnimations()	Synergy, node proximity
link.particles[].scale	updateLinkAnimations()	Traffic priority, node proximity
link.particles[].position	updateLinkAnimations()	Curve traversal (along link)
link.particleStream.userData.particles	LinkSynergyColorTransition	Same as above (alternative path)
PHASE 4: LINK REMOVAL / DISPOSAL
System/Function	File	Lifecycle Role
removeLink(link)	NodeLinkingSystem.js	Initiate removal (sets active=false)
flowSystem.removeLinkFlow(linkId)	NodeLinkingSystem.js	Remove flow visualization
visuals.unregisterLink()	NodeLinkingSystem.js	Unregister from visual system
thicknessSystem.unregisterLinkCurve()	NodeLinkingSystem.js	Unregister from thickness system
this.scene.remove(link.group)	NodeLinkingSystem.js	Scene detachment
link.group.traverse(dispose)	NodeLinkingSystem.js	Dispose geometries, materials
conduitRenderer.disposeLinkVisuals()	NodeLinkingSystem.js	Dispose conduit visual resources
_removeLinkFromIndex(link)	NodeLinkingSystem.js	Remove from persistent index
this.links = this.links.filter(l !== link)	NodeLinkingSystem.js	Remove from main array
nodeIdToLinks.set(nodeId, filtered)	NodeLinkingSystem.js	Remove from internal map
_fireLinkRemovedCallbacks()	NodeLinkingSystem.js	Event notification
onLinkRemoved()	src/metrics/NodeMetricEngine.js	Canonical metrics hook
RISK DETECTION
HIGH RISK: Multiple creation paths
Risk: createLink() and createLinkLegacy() both create links with different visual structures
Impact: Inconsistent link visual properties depending on which path is taken
Mitigation: deferLinkVisuals flag and pendingLinkVisualsQueue for deferred processing
HIGH RISK: Per-frame visual mutation from multiple systems
Risk: 7+ systems mutate link materials per-frame

Conflicting authorities detected:

LinkSynergyColorTransition vs updateLinkAnimations() - Both mutate material.color
LinkSynergyColorTransition vs AnimatedLinkFlow - Both mutate material.emissive
LinkSynergyColorTransition vs updateLinkAnimations() - Both mutate material.opacity
updateLinkVFXEffects() vs updateLinkAnimations() - Both mutate same properties
Mutation hotspots:

material.color mutated by: LinkSynergyColorTransition, updateLinkAnimations (bottleneck), AnimatedLinkFlow
material.opacity mutated by: updateLinkAnimations, updateLinkVFXEffects (10 effects), LinkSynergyColorTransition
material.emissive mutated by: LinkSynergyColorTransition, AnimatedLinkFlow, updateLinkAnimations
mesh.scale mutated by: updateLinkAnimations, updateLinkVFXEffects, AnimatedLinkFlow
mesh.position mutated by: updateLinkAnimations (particles), updateLinkVFXEffects
MEDIUM RISK: Systems modifying links without ownership
LinkBeadSystem: Mutates link.userData for bead/trail tracking
DynamicLinkColorSystem: Direct material color mutations (may conflict with LinkSynergyColorTransition)
LinkPriorityDecayEngine: Mutates link.priority directly (no authority lock detected)
LOW RISK: Disposal not fully centralized
Risk: Some VFX systems may hold references to disposed links
Impact: Potential memory leaks if proper cleanup isn't performed
Mitigation: dispose() method in NodeLinkingSystem appears comprehensive
SYSTEMS PER-FRAME UPDATE SUMMARY
System	Update Frequency	Target Properties
NodeLinkingSystem.update()	Every frame	All links, all properties
AnimatedLinkFlow.animate()	Every frame	Flow packets, beam opacity
LinkAuraSystem_v1.update()	Every frame	Aura mesh position, scale, uniforms
DynamicLinkColorSystem.update()	Not clearly defined (may be event-driven)	Material color
LinkPrioritySystem.applyTrafficDecay()	Every 500ms	link.priority
LinkSynergyColorTransition.updateLinkColorTransition()	Every frame (when active)	material.color, emissive
updateParticleColorTransition()	Every frame (when active)	particle material color, emissive, opacity
VISUAL AUTHORITY CHAIN
Creation: NodeLinkingSystem → LinkRendererConduit → Scene
Depth Authority: NodeDepthAndHoloPreservationFix.enforceLinkDepthAuthority()
Per-Frame Updates (in order of execution):
ConduitRenderer.update()
LinkEmissionPulsingSystem.update()
updateLinkCurve()
updateLinkAnimations() (10 VFX effects)
updateLinkVFXEffects()
LinkSynergyColorTransition (color transitions)
AnimatedLinkFlow.animate()
LinkAuraSystem.update()
CONCLUSION
The ATOMA link system exhibits high fragmentation with 7+ independent systems mutating link visuals per-frame. While NodeLinkingSystem maintains clear ownership of creation and removal, the runtime mutation landscape is decentralized and potentially conflicting.

Recommendations for future refactoring (READ ONLY, NOT EXECUTED):

Establish a visual authority lock for link mutations
Centralize material property mutations through a single coordinator
Implement mutation request queue with conflict resolution
Define clear priority order for visual updates
END OF FORENSIC ANALYSIS