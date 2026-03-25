/**
 * MEGA GLYPH CONDUIT 1.0 — ORCHESTRATOR
 * 
 * Orchestrator pre všetky glyph systémy v ATOMA.
 * 
 * Spravuje 5 pod-systémov:
 * - AtomaGlyphSystem4_0 (core glyph renderer)
 * - LinkedGlyphMessaging3_0 (link messaging)
 * - _RecursiveGlyphMessaging4_0 (recursive chains)
 * - _RecursiveGlyphSignalSystem (transient signals)
 * - _SemanticGlyphAI (semantic interpreter)
 * 
 * ARCHITEKTÚRA (LinkRendererConduit štýl):
 * - Conduit orchestruje, systémy ostávajú nezávislé
 * - Žiadny code duplication
 * - Centralizuje update loop, cleanup, status reporting
 * - Deleguje všetky API volania na príslušné systémy
 * 
 * STRICT SAFETY RULES:
 * - DO NOT modify gameplay, physics, collisions, or createNode()
 * - Conduit je len wrapper/orchestrator
 * - Všetka logika zostáva v pod-systémoch
 */

import * as THREE from 'three';
import { AtomaGlyphSystem4_0 } from './_AtomaGlyphSystem4_0.js';
import { LinkedGlyphMessaging3_0 } from './_LinkedGlyphMessaging3_0.js';
import { _RecursiveGlyphMessaging4_0 } from './_RecursiveGlyphMessaging4_0.js';
import { _RecursiveGlyphSignalSystem } from './_RecursiveGlyphSignalSystem.js';
import { _SemanticGlyphAI } from './_SemanticGlyphAI.js';

// FÁZA 1: Core Visual Systems
import { MythicSeedGlyph } from './_MythicSeedGlyph.js';
import { GlyphLayer4_MultiFusion } from './_GlyphLayer4_MultiFusion.js';
import { GlyphFusionOverlay4_1 } from './_GlyphFusionOverlay4_1.js';

// FÁZA 2: Adaptive & Sync Systems
import { AdaptiveGlyphRendering1_0 } from './_AdaptiveGlyphRendering1_0.js';
import { LinkedGlyphSynchronization1_0 } from './_LinkedGlyphSynchronization1_0.js';
import { GlyphPurityMode5_1 } from './_GlyphPurityMode5_1.js';

// FÁZA 4: Experimental Systems (Procedural & Composite)
import { CompositeGlyphGenerator } from './CompositeGlyphGenerator.js';
import { CompositeGlyphResonanceFeedback } from './CompositeGlyphResonanceFeedback.js';
import { ProceduralHarmonicGlyphGenerator } from './ProceduralHarmonicGlyphGenerator.js';
import { GlyphFusionZone } from './GlyphFusionZone.js';

export class MegaGlyphConduit {
  constructor(scene, camera, frameScheduler = null) {
    this.scene = scene;
    this.camera = camera;
    this.frameScheduler = frameScheduler;

    // ============================================================
    // INITIALIZE ALL SYSTEMS
    // ============================================================

    console.log('Initializing Mega Glyph Conduit systems...');

    // Core glyph renderer (node-bound glyphs)
    this.core = new AtomaGlyphSystem4_0(scene, camera);

    // Link messaging (basic glyph transport)
    this.messaging = new LinkedGlyphMessaging3_0(scene, scene, null);

    // Recursive messaging (complex meaning chains)
    this.recursiveMessaging = new _RecursiveGlyphMessaging4_0(scene, scene, null);

    // Transient signals (attention, residue)
    this.signals = new _RecursiveGlyphSignalSystem(scene, {
      camera,
      semanticGlyphAI: null,  // Will wire after semantic init
      frameScheduler
    });

    // Semantic interpreter (state → visual)
    this.semantic = new _SemanticGlyphAI(scene, scene, this.core, null);

    // ============================================================
    // FÁZA 1: CORE VISUAL SYSTEMS
    // ============================================================

    // Mythic Seed Glyph System (mythic node glyphs)
    this.mythicSeedGlyph = new MythicSeedGlyph(scene);

    // Glyph Layer 4.0 Multi-Fusion (multi-layer glyph rendering)
    this.glyphLayer4 = new GlyphLayer4_MultiFusion(
        scene,
        scene,  // enforcementGate
        null     // resonanceFeedback (will wire if available)
    );

    // Glyph Fusion Overlay 4.1 (semantic fusion layer)
    this.glyphFusionOverlay = new GlyphFusionOverlay4_1(
        scene,
        scene,        // worldRoot
        this.semantic, // semanticGlyphAI
        null           // semanticBus (will wire if available)
    );

    // ============================================================
    // FÁZA 2: ADAPTIVE & SYNC SYSTEMS
    // ============================================================

    // Adaptive Glyph Rendering 1.0 (intelligent visual responsiveness)
    this.adaptiveGlyphRendering = new AdaptiveGlyphRendering1_0(scene);

    // Linked Glyph Synchronization 1.0 (coordinated visual communication)
    this.linkedGlyphSync = new LinkedGlyphSynchronization1_0(scene);

    // Glyph Purity Mode 5.1 (minimal atmospheric glyphs)
    this.glyphPurityMode = new GlyphPurityMode5_1(scene);

    // ============================================================
    // FÁZA 4: EXPERIMENTAL SYSTEMS (Procedural & Composite)
    // ============================================================

    // Composite Glyph Generator (procedural fusion geometry)
    this.compositeGlyphGenerator = new CompositeGlyphGenerator();

    // Composite Glyph Resonance Feedback (visual feedback adapter)
    this.compositeResonanceFeedback = new CompositeGlyphResonanceFeedback(scene);

    // Procedural Harmonic Glyph Generator (emergent identity glyphs)
    this.proceduralHarmonicGlyphGenerator = new ProceduralHarmonicGlyphGenerator(scene);
    this.proceduralHarmonicGlyphGenerator.frameScheduler = this.frameScheduler;

    // Glyph Fusion Zone (zone-based procedural fusion)
    this.glyphFusionZone = new GlyphFusionZone(scene);

    // ============================================================
    // WIRE CROSS-SYSTEM DEPENDENCIES
    // ============================================================

    this.wireDependencies();

    // ============================================================
    // MASTER CONTROL
    // ============================================================

    this.enabled = true;
    this._lastFrameTime = 0;

    console.log('✓ Mega Glyph Conduit 1.0 initialized');
    console.log('  Systems:');
    console.log('    - Core: AtomaGlyphSystem4_0');
    console.log('    - Messaging: LinkedGlyphMessaging3_0');
    console.log('    - Recursive Messaging: _RecursiveGlyphMessaging4_0');
    console.log('    - Signals: _RecursiveGlyphSignalSystem');
    console.log('    - Semantic: _SemanticGlyphAI');
  }

  /**
   * Wire cross-system dependencies
   * Systémy potrebujú referencie na seba navzájom
   */
  wireDependencies() {
    console.log('Wiring cross-system dependencies...');

    // Messaging needs semantic AI for interpretation
    if (this.messaging) {
      this.messaging.semanticGlyphAI = this.semantic;
    }

    // Recursive messaging needs semantic AI
    if (this.recursiveMessaging) {
      this.recursiveMessaging.semanticGlyphAI = this.semantic;
    }

    // Signals needs semantic AI and frame scheduler
    if (this.signals) {
      this.signals.setSemanticGlyphAI(this.semantic);
    }

    // Semantic needs core (fusionRegistry already passed in constructor)
    // Nothing to wire here

    // FÁZA 1: Wire new core visual systems
    if (this.compositeResonanceFeedback && this.glyphLayer4) {
        this.glyphLayer4.resonanceFeedback = this.compositeResonanceFeedback;
    }

    // FÁZA 4: Wire experimental systems
    if (this.proceduralHarmonicGlyphGenerator && this.compositeGlyphGenerator) {
        this.proceduralHarmonicGlyphGenerator.compositeGenerator = this.compositeGlyphGenerator;
    }

    console.log('✓ Cross-system dependencies wired');
  }

  // ============================================================
  // MAIN UPDATE LOOP
  // ============================================================

  update(deltaTime, nodes, linkingSystem = null) {
    if (!this.enabled) return;

    const startTime = performance.now();

    // Update semantic interpreter (feeds other systems)
    if (this.semantic) {
      this.semantic.update(deltaTime, nodes);
    }

    // Update core glyph renderer (node-bound glyphs)
    if (this.core) {
      this.core.update(deltaTime, nodes);
    }

    // Update messaging systems (if linking system available)
    if (linkingSystem) {
      if (this.messaging) {
        this.messaging.update(deltaTime, nodes, linkingSystem);
      }

      if (this.recursiveMessaging) {
        this.recursiveMessaging.update(deltaTime, nodes, linkingSystem);
      }
    }

    // Update transient signals
    if (this.signals) {
      this.signals.update(deltaTime);
    }

    // FÁZA 1: Update core visual systems
    this.mythicSeedGlyph?.update?.(deltaTime, this.camera);
    this.glyphLayer4?.update?.(deltaTime);
    this.glyphFusionOverlay?.update?.(deltaTime);

    // FÁZA 2: Update adaptive & sync systems
    this.adaptiveGlyphRendering?.update?.(deltaTime, nodes);
    this.linkedGlyphSync?.updateSync?.(deltaTime);

    // FÁZA 4: Update experimental systems
    this.compositeResonanceFeedback?.update?.(deltaTime);
    this.proceduralHarmonicGlyphGenerator?.update?.(deltaTime, nodes);
    this.glyphFusionZone?.update?.(deltaTime, nodes);

    this._lastFrameTime = performance.now() - startTime;
  }

  // ============================================================
  // CORE GLYPH RENDERER API (delegated)
  // ============================================================

  createAIConsciousnessGlyph(node, nodeId) {
    return this.core?.createAIConsciousnessGlyph?.(node, nodeId);
  }

  createMythicSeedGlyph(node, nodeId) {
    return this.core?.createMythicSeedGlyph?.(node, nodeId);
  }

  createAscendedNodeGlyph(node, nodeId) {
    return this.core?.createAscendedNodeGlyph?.(node, nodeId);
  }

  createEvolutionStage1Glyph(node, nodeId) {
    return this.core?.createEvolutionStage1Glyph?.(node, nodeId);
  }

  createEvolutionStage2Glyph(node, nodeId) {
    return this.core?.createEvolutionStage2Glyph?.(node, nodeId);
  }

  createEvolutionStage3Glyph(node, nodeId) {
    return this.core?.createEvolutionStage3Glyph?.(node, nodeId);
  }

  createPersonalityHarmonyGlyph(node, nodeId) {
    return this.core?.createPersonalityHarmonyGlyph?.(node, nodeId);
  }

  createPersonalityStabilityGlyph(node, nodeId) {
    return this.core?.createPersonalityStabilityGlyph?.(node, nodeId);
  }

  createPersonalityCorruptionGlyph(node, nodeId) {
    return this.core?.createPersonalityCorruptionGlyph?.(node, nodeId);
  }

  createPersonalitySynergyGlyph(node, nodeId) {
    return this.core?.createPersonalitySynergyGlyph?.(node, nodeId);
  }

  createEventMythicRitualGlyph(node, nodeId) {
    return this.core?.createEventMythicRitualGlyph?.(node, nodeId);
  }

  createEventClusterSurgeGlyph(node, nodeId) {
    return this.core?.createEventClusterSurgeGlyph?.(node, nodeId);
  }

  createEventWorldEventGlyph(node, nodeId) {
    return this.core?.createEventWorldEventGlyph?.(node, nodeId);
  }

  removeGlyph(nodeId) {
    return this.core?.removeGlyph?.(nodeId);
  }

  updateNodeSynergy(nodeId, linkedSynergy) {
    return this.core?.updateNodeSynergy?.(nodeId, linkedSynergy);
  }

  setCorruptionDimmingConfig(config) {
    return this.core?.setCorruptionDimmingConfig?.(config);
  }

  getCorruptionDimmingConfig() {
    return this.core?.getCorruptionDimmingConfig?.();
  }

  removeLegacyHexGlyphs() {
    return this.core?.removeLegacyHexGlyphs?.();
  }

  // ============================================================
  // FÁZA 1: CORE VISUAL SYSTEMS API (delegated)
  // ============================================================

  // Mythic Seed Glyph
  createMythicSeedGlyph(node, nodeId) {
    return this.mythicSeedGlyph?.createGlyph?.(node, nodeId);
  }

  removeMythicSeedGlyph(nodeId) {
    return this.mythicSeedGlyph?.removeGlyph?.(nodeId);
  }

  scanAndApplyMythicSeedGlyphs(nodes) {
    return this.mythicSeedGlyph?.scanAndApplyGlyphs?.(nodes);
  }

  // Glyph Layer 4.0 Multi-Fusion
  createGlyphFusionsForNodes(nodes) {
    return this.glyphLayer4?.createGlyphFusionsForNodes?.(nodes);
  }

  removeGlyphLayer4Fusion(nodeId) {
    return this.glyphLayer4?.removeFusion?.(nodeId);
  }

  debugGlyphLayer4Fusion(nodeId) {
    return this.glyphLayer4?.debugGlyphFusion?.(nodeId);
  }

  // Glyph Fusion Overlay 4.1
  createFusionOverlay(node, nodeId, semanticState) {
    return this.glyphFusionOverlay?.createFusionOverlay?.(node, nodeId, semanticState);
  }

  removeFusionOverlay(nodeId) {
    return this.glyphFusionOverlay?.removeFusion?.(nodeId);
  }

  updateFusionOverlayFade(nodeId, targetIntensity, dt) {
    return this.glyphFusionOverlay?.updateFusionFade?.(nodeId, targetIntensity, dt);
  }

  // ============================================================
  // FÁZA 2: ADAPTIVE & SYNC SYSTEMS API (delegated)
  // ============================================================

  // Adaptive Glyph Rendering 1.0
  initializeAdaptiveNodeState(nodeId) {
    return this.adaptiveGlyphRendering?.initializeNodeState?.(nodeId);
  }

  applyAdaptiveRendering(node, nodeId) {
    return this.adaptiveGlyphRendering?.applyAdaptiveRendering?.(node, nodeId);
  }

  setAdaptiveEnabled(enabled) {
    return this.adaptiveGlyphRendering?.setEnabled?.(enabled);
  }

  // Linked Glyph Synchronization 1.0
  registerSyncLink(linkId, linkData) {
    return this.linkedGlyphSync?.registerLink?.(linkId, linkData);
  }

  synchronizeGlyphs(linkId, linkedNodes) {
    return this.linkedGlyphSync?.synchronizeGlyphs?.(linkId, linkedNodes);
  }

  unregisterSyncLink(linkId) {
    return this.linkedGlyphSync?.unregisterLink?.(linkId);
  }

  setSyncEnabled(enabled) {
    return this.linkedGlyphSync?.setEnabled?.(enabled);
  }

  // Glyph Purity Mode 5.1
  setPurityLevel(level) {
    return this.glyphPurityMode?.setPurityLevel?.(level);
  }

  getPurityLevel() {
    return this.glyphPurityMode?.getPurityLevel?.();
  }

  checkGlyphPurity(node) {
    return this.glyphPurityMode?.checkGlyphPurity?.(node);
  }

  scanAndEnforcePurity(nodes) {
    return this.glyphPurityMode?.scanAndEnforcePurity?.(nodes);
  }

  setPurityEnabled(enabled) {
    return this.glyphPurityMode?.setEnabled?.(enabled);
  }

  // ============================================================
  // FÁZA 4: EXPERIMENTAL SYSTEMS API (delegated)
  // ============================================================

  // Composite Glyph Generator
  generateCompositeGlyph(sourceTypes, semanticContext) {
    return this.compositeGlyphGenerator?.generateComposite?.(sourceTypes, semanticContext);
  }

  buildCompositeGeometry(sourceTypes, semanticContext) {
    return this.compositeGlyphGenerator?.buildCompositeGeometry?.(sourceTypes, semanticContext);
  }

  // Composite Glyph Resonance Feedback
  applyResonanceFeedback(compositeGlyph, resonanceStrength) {
    return this.compositeResonanceFeedback?.applyResonanceFeedback?.(compositeGlyph, resonanceStrength);
  }

  updateSpatialCues() {
    return this.compositeResonanceFeedback?.updateSpatialCues?.();
  }

  // Procedural Harmonic Glyph Generator
  generateHarmonicGlyph(topologyData) {
    return this.proceduralHarmonicGlyphGenerator?.generateHarmonicGlyph?.(topologyData);
  }

  generateFromLearningHistory() {
    return this.proceduralHarmonicGlyphGenerator?.generateFromLearningHistory?.();
  }

  checkHarmonicGlyphs() {
    return this.proceduralHarmonicGlyphGenerator?.checkHarmonicGlyphs?.();
  }

  // Glyph Fusion Zone
  detectFusionZones(nodes) {
    return this.glyphFusionZone?.detectFusionZones?.(nodes);
  }

  processFusion(zoneData) {
    return this.glyphFusionZone?.processFusion?.(zoneData);
  }

  revertFusion(zoneId) {
    return this.glyphFusionZone?.revertFusion?.(zoneId);
  }

  // ============================================================
  // MESSAGING LAYER API (delegated)
  // ============================================================

  registerLink(link, linkId, sourceNode, targetNode) {
    this.messaging?.registerLink?.(link, linkId, sourceNode, targetNode);
    this.recursiveMessaging?.registerLink?.(linkId, sourceNode, targetNode);
  }

  unregisterLink(linkId) {
    this.messaging?.unregisterLink?.(linkId);
    // Recursive messaging doesn't have explicit unregister (handled via link tracking)
  }

  spawnMessage(link, linkId, sourceNode, targetNode) {
    return this.messaging?.spawnMessage?.(link, linkId, sourceNode, targetNode);
  }

  generateChainForLink(linkId, linkData) {
    return this.recursiveMessaging?.generateChainForLink?.(linkId, linkData);
  }

  clearAllMessages() {
    this.messaging?.clearAllMessages?.();
    this.recursiveMessaging?.clearAllChains?.();
  }

  // ============================================================
  // SIGNAL LAYER API (delegated)
  // ============================================================

  triggerAttentionSignal(node, reason = 'selection') {
    return this.signals?.triggerAttentionSignal?.(node, reason);
  }

  triggerResidueSignal(sourceNode, targetNode, residueKind = 'resonance') {
    return this.signals?.triggerResidueSignal?.(sourceNode, targetNode, residueKind);
  }

  requestSilenceForNode(node) {
    return this.signals?.requestSilenceForNode?.(node);
  }

  requestGlobalSilence() {
    return this.signals?.requestGlobalSilence?.();
  }

  setSignalCallbacks(callbacks) {
    return this.signals?.setDynamicsContext?.(callbacks);
  }

  clearAllSignals() {
    return this.signals?.clearAllSignals?.();
  }

  // ============================================================
  // SEMANTIC INTERPRETER API (delegated)
  // ============================================================

  recordLinkCreated(nodeId) {
    return this.semantic?.recordLinkCreated?.(nodeId);
  }

  recordRitualCompleted(nodeId) {
    return this.semantic?.recordRitualCompleted?.(nodeId);
  }

  recordAscended(nodeId) {
    return this.semantic?.recordAscended?.(nodeId);
  }

  recordClusterSync(clusterMemberIds) {
    return this.semantic?.recordClusterSync?.(clusterMemberIds);
  }

  setHoverTarget(node) {
    return this.semantic?.setHoverTarget?.(node);
  }

  getSemanticState(nodeId) {
    return this.semantic?.semanticState?.get(nodeId);
  }

  generateResponseAtNode(node) {
    return this.semantic?.generateResponseAtNode?.(node);
  }

  // ============================================================
  // MASTER CONTROL
  // ============================================================

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    // Propagate to all systems
    this.core?.setEnabled?.(enabled);
    this.messaging?.setEnabled?.(enabled);
    this.recursiveMessaging?.setEnabled?.(enabled);
    this.signals?.setEnabled?.(enabled);

    if (enabled) {
      this.semantic?.enable?.();
    } else {
      this.semantic?.disable?.();
    }

    console.log(`Mega Glyph Conduit ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  setCoreEnabled(enabled) {
    this.core?.setEnabled?.(enabled);
  }

  setMessagingEnabled(enabled) {
    this.messaging?.setEnabled?.(enabled);
    this.recursiveMessaging?.setEnabled?.(enabled);
  }

  setSignalEnabled(enabled) {
    this.signals?.setEnabled?.(enabled);
  }

  setSemanticEnabled(enabled) {
    if (enabled) {
      this.semantic?.enable?.();
    } else {
      this.semantic?.disable?.();
    }
  }

  // ============================================================
  // FRAME SCHEDULER INTEGRATION
  // ============================================================

  setFrameScheduler(frameScheduler) {
    this.frameScheduler = frameScheduler;
    this.signals?.setFrameScheduler?.(frameScheduler);
  }

  // ============================================================
  // SELECTION CORE INTEGRATION
  // ============================================================

  setSelectionCore(selectionCore) {
    this.signals?.setSelectionCore?.(selectionCore);
  }

  // ============================================================
  // LINKING SYSTEM INTEGRATION
  // ============================================================

  setLinkingSystem(linkingSystem) {
    this.signals?.setLinkingSystem?.(linkingSystem);
  }

  // ============================================================
  // STATUS REPORTING
  // ============================================================

  getStatus() {
    return {
      enabled: this.enabled,
      lastFrameMs: this._lastFrameTime?.toFixed(2) || '0.00',
      systems: {
        core: {
          enabled: this.core?.isEnabled?.() ?? true,
          activeGlyphs: this.core?.stats?.activeGlyphs || 0,
          totalCreated: this.core?.stats?.totalGlyphsCreated || 0,
          byType: this.core?.stats?.byType || {},
          lastUpdateMs: this.core?.stats?.lastUpdateTime?.toFixed?.(2) || '0.00'
        },
        messaging: {
          enabled: this.messaging?.enabled ?? true,
          messagesActive: this.messaging?.stats?.messagesActive || 0,
          messagesSpawned: this.messaging?.stats?.messagesSpawned || 0,
          messagesCompleted: this.messaging?.stats?.messagesCompleted || 0,
          responsesGenerated: this.messaging?.stats?.responsesGenerated || 0,
          linksActive: this.messaging?.stats?.linksActive || 0,
          lastFrameMs: this.messaging?.stats?.lastFrameTime?.toFixed?.(2) || '0.00'
        },
        recursiveMessaging: {
          enabled: this.recursiveMessaging?.enabled ?? true,
          activeChains: this.recursiveMessaging?.stats?.activeChainsCount || 0,
          sentenceCount: this.recursiveMessaging?.stats?.sentenceCount || 0,
          glyphCount: this.recursiveMessaging?.stats?.glyphCount || 0,
          frameTime: this.recursiveMessaging?.stats?.frameTime?.toFixed?.(2) || '0.00'
        },
        signals: {
          enabled: this.signals?.isEnabled?.() ?? true,
          activeSignals: this.signals?.activeSignals?.size || 0,
          emitted: this.signals?.stats?.emitted || 0,
          suppressed: this.signals?.stats?.suppressed || 0,
          culledByClutter: this.signals?.stats?.culledByClutter || 0
        },
        semantic: {
          enabled: this.semantic?.enabled ?? true,
          nodesProcessed: this.semantic?.stats?.nodesProcessed || 0,
          statesApplied: this.semantic?.stats?.statesApplied || 0,
          helperMeshesActive: this.semantic?.stats?.helperMeshesActive || 0,
          frameTime: this.semantic?.stats?.frameTime?.toFixed?.(2) || '0.00'
        },
        mythicSeed: {
          enabled: this.mythicSeedGlyph?.enabled ?? true,
          activeGlyphs: this.mythicSeedGlyph?.getStatus?.()?.activeGlyphs || 0
        },
        glyphLayer4: {
          enabled: this.glyphLayer4?.enabled ?? true,
          totalFusions: this.glyphLayer4?.stats?.totalFusions || 0,
          activeFusions: this.glyphLayer4?.stats?.activeFusions || 0,
          byLayer: this.glyphLayer4?.stats?.byLayer || {}
        },
        glyphFusionOverlay: {
          enabled: this.glyphFusionOverlay?.enabled ?? true,
          totalFusionGlyphs: this.glyphFusionOverlay?.stats?.totalFusionGlyphs || 0,
          activeFusionGlyphs: this.glyphFusionOverlay?.stats?.activeFusionGlyphs || 0
        },
        adaptiveGlyphRendering: {
          enabled: this.adaptiveGlyphRendering?.enabled ?? true,
          nodesProcessed: this.adaptiveGlyphRendering?.stats?.nodesProcessed || 0,
          activeAdaptations: this.adaptiveGlyphRendering?.stats?.activeAdaptations || 0
        },
        linkedGlyphSync: {
          enabled: this.linkedGlyphSync?.enabled ?? true,
          linksProcessed: this.linkedGlyphSync?.stats?.linksProcessed || 0,
          syncedPairs: this.linkedGlyphSync?.stats?.syncedPairs || 0,
          perfectSyncCount: this.linkedGlyphSync?.stats?.perfectSyncCount || 0,
          mediumSyncCount: this.linkedGlyphSync?.stats?.mediumSyncCount || 0,
          looseSyncCount: this.linkedGlyphSync?.stats?.looseSyncCount || 0
        },
        glyphPurityMode: {
          enabled: this.glyphPurityMode?.enabled ?? true,
          purityLevel: this.glyphPurityMode?.getPurityLevel?.() ?? 1,
          fallbacksDetected: this.glyphPurityMode?.stats?.fallbacksDetected || 0,
          fallbacksRemoved: this.glyphPurityMode?.stats?.fallbacksRemoved || 0
        },
        compositeGlyphGenerator: {
          cacheSize: this.compositeGlyphGenerator?.cache?.size || 0
        },
        compositeResonanceFeedback: {
          activeResonances: this.compositeResonanceFeedback?.stats?.activeResonances || 0
        },
        proceduralHarmonicGlyphGenerator: {
          enabled: this.proceduralHarmonicGlyphGenerator?.enabled ?? true,
          activeGlyphs: this.proceduralHarmonicGlyphGenerator?.stats?.activeGlyphs || 0,
          totalGenerated: this.proceduralHarmonicGlyphGenerator?.stats?.totalGenerated || 0
        },
        glyphFusionZone: {
          enabled: this.glyphFusionZone?.enabled ?? true,
          activeZones: this.glyphFusionZone?.stats?.activeZones || 0,
          fusionsProcessed: this.glyphFusionZone?.stats?.fusionsProcessed || 0
        }
      }
    };
  }

  printStatus() {
    const status = this.getStatus();
    console.group('🌈 Mega Glyph Conduit 1.0 Status');
    console.log(`Overall: ${status.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`Frame Time: ${status.lastFrameMs}ms`);
    console.log('');
    console.log('SYSTEMS:');
    console.log('');
    console.log('📦 CORE GLYPH RENDERER (AtomaGlyphSystem4_0):');
    console.log(`  Status: ${status.systems.core.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Glyphs: ${status.systems.core.activeGlyphs}`);
    console.log(`  Total Created: ${status.systems.core.totalCreated}`);
    console.log(`  By Type:`, status.systems.core.byType);
    console.log(`  Last Update: ${status.systems.core.lastUpdateMs}ms`);
    console.log('');
    console.log('📨 LINKED MESSAGING (LinkedGlyphMessaging3_0):');
    console.log(`  Status: ${status.systems.messaging.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Messages Active: ${status.systems.messaging.messagesActive}`);
    console.log(`  Messages Spawned: ${status.systems.messaging.messagesSpawned}`);
    console.log(`  Messages Completed: ${status.systems.messaging.messagesCompleted}`);
    console.log(`  Responses Generated: ${status.systems.messaging.responsesGenerated}`);
    console.log(`  Active Links: ${status.systems.messaging.linksActive}`);
    console.log(`  Frame Time: ${status.systems.messaging.lastFrameMs}ms`);
    console.log('');
    console.log('🔁 RECURSIVE MESSAGING (_RecursiveGlyphMessaging4_0):');
    console.log(`  Status: ${status.systems.recursiveMessaging.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Chains: ${status.systems.recursiveMessaging.activeChains}`);
    console.log(`  Sentence Count: ${status.systems.recursiveMessaging.sentenceCount}`);
    console.log(`  Glyph Count: ${status.systems.recursiveMessaging.glyphCount}`);
    console.log(`  Frame Time: ${status.systems.recursiveMessaging.frameTime}ms`);
    console.log('');
    console.log('📡 TRANSIENT SIGNALS (_RecursiveGlyphSignalSystem):');
    console.log(`  Status: ${status.systems.signals.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Signals: ${status.systems.signals.activeSignals}`);
    console.log(`  Emitted: ${status.systems.signals.emitted}`);
    console.log(`  Suppressed: ${status.systems.signals.suppressed}`);
    console.log(`  Culled by Clutter: ${status.systems.signals.culledByClutter}`);
    console.log('');
    console.log('🧠 SEMANTIC INTERPRETER (_SemanticGlyphAI):');
    console.log(`  Status: ${status.systems.semantic.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Nodes Processed: ${status.systems.semantic.nodesProcessed}`);
    console.log(`  States Applied: ${status.systems.semantic.statesApplied}`);
    console.log(`  Helper Meshes Active: ${status.systems.semantic.helperMeshesActive}`);
    console.log(`  Frame Time: ${status.systems.semantic.frameTime}ms`);
    console.log('');
    console.log('🌟 FÁZA 1 - CORE VISUAL SYSTEMS:');
    console.log('');
    console.log('🔮 MYTHIC SEED GLYPH (_MythicSeedGlyph):');
    console.log(`  Status: ${status.systems.mythicSeed.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Glyphs: ${status.systems.mythicSeed.activeGlyphs}`);
    console.log('');
    console.log('🔷 GLYPH LAYER 4.0 MULTI-FUSION (_GlyphLayer4_MultiFusion):');
    console.log(`  Status: ${status.systems.glyphLayer4.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Total Fusions: ${status.systems.glyphLayer4.totalFusions}`);
    console.log(`  Active Fusions: ${status.systems.glyphLayer4.activeFusions}`);
    console.log(`  By Layer:`, status.systems.glyphLayer4.byLayer);
    console.log('');
    console.log('🔶 GLYPH FUSION OVERLAY 4.1 (_GlyphFusionOverlay4_1):');
    console.log(`  Status: ${status.systems.glyphFusionOverlay.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Total Fusion Glyphs: ${status.systems.glyphFusionOverlay.totalFusionGlyphs}`);
    console.log(`  Active Fusion Glyphs: ${status.systems.glyphFusionOverlay.activeFusionGlyphs}`);
    console.log('');
    console.log('🌊 FÁZA 2 - ADAPTIVE & SYNC SYSTEMS:');
    console.log('');
    console.log('🎨 ADAPTIVE GLYPH RENDERING (_AdaptiveGlyphRendering1_0):');
    console.log(`  Status: ${status.systems.adaptiveGlyphRendering.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Nodes Processed: ${status.systems.adaptiveGlyphRendering.nodesProcessed}`);
    console.log(`  Active Adaptations: ${status.systems.adaptiveGlyphRendering.activeAdaptations}`);
    console.log('');
    console.log('🔗 LINKED GLYPH SYNCHRONIZATION (_LinkedGlyphSynchronization1_0):');
    console.log(`  Status: ${status.systems.linkedGlyphSync.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Links Processed: ${status.systems.linkedGlyphSync.linksProcessed}`);
    console.log(`  Synced Pairs: ${status.systems.linkedGlyphSync.syncedPairs}`);
    console.log(`  Perfect Sync: ${status.systems.linkedGlyphSync.perfectSyncCount}`);
    console.log(`  Medium Sync: ${status.systems.linkedGlyphSync.mediumSyncCount}`);
    console.log(`  Loose Sync: ${status.systems.linkedGlyphSync.looseSyncCount}`);
    console.log('');
    console.log('🧹 GLYPH PURITY MODE 5.1 (_GlyphPurityMode5_1):');
    console.log(`  Status: ${status.systems.glyphPurityMode.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Purity Level: ${status.systems.glyphPurityMode.purityLevel}`);
    console.log(`  Fallbacks Detected: ${status.systems.glyphPurityMode.fallbacksDetected}`);
    console.log(`  Fallbacks Removed: ${status.systems.glyphPurityMode.fallbacksRemoved}`);
    console.log('');
    console.log('🔮 FÁZA 4 - EXPERIMENTAL SYSTEMS:');
    console.log('');
    console.log('🔷 COMPOSITE GLYPH GENERATOR (CompositeGlyphGenerator):');
    console.log(`  Cache Size: ${status.systems.compositeGlyphGenerator.cacheSize}`);
    console.log('');
    console.log('🔷 COMPOSITE GLYPH RESONANCE FEEDBACK (CompositeGlyphResonanceFeedback):');
    console.log(`  Active Resonances: ${status.systems.compositeResonanceFeedback.activeResonances}`);
    console.log('');
    console.log('🔷 PROCEDURAL HARMONIC GLYPH GENERATOR (ProceduralHarmonicGlyphGenerator):');
    console.log(`  Status: ${status.systems.proceduralHarmonicGlyphGenerator.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Glyphs: ${status.systems.proceduralHarmonicGlyphGenerator.activeGlyphs}`);
    console.log(`  Total Generated: ${status.systems.proceduralHarmonicGlyphGenerator.totalGenerated}`);
    console.log('');
    console.log('🔶 GLYPH FUSION ZONE (GlyphFusionZone):');
    console.log(`  Status: ${status.systems.glyphFusionZone.enabled ? '● ACTIVE' : '○ DISABLED'}`);
    console.log(`  Active Zones: ${status.systems.glyphFusionZone.activeZones}`);
    console.log(`  Fusions Processed: ${status.systems.glyphFusionZone.fusionsProcessed}`);
    console.groupEnd();
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  cleanup() {
    console.log('Cleaning up Mega Glyph Conduit...');

    // Cleanup all systems
    this.core?.cleanup?.();
    this.messaging?.cleanup?.();
    this.recursiveMessaging?.dispose?.();
    this.signals?.cleanup?.();
    this.semantic?.dispose?.();

    // FÁZA 1: Cleanup core visual systems
    this.mythicSeedGlyph?.cleanup?.();
    this.glyphLayer4?.cleanup?.();
    this.glyphFusionOverlay?.cleanup?.();

    // FÁZA 2: Cleanup adaptive & sync systems
    this.adaptiveGlyphRendering?.cleanup?.();
    this.linkedGlyphSync?.cleanup?.();
    this.glyphPurityMode?.cleanup?.();

    // FÁZA 4: Cleanup experimental systems
    this.compositeResonanceFeedback?.cleanup?.();
    this.proceduralHarmonicGlyphGenerator?.cleanup?.();
    this.glyphFusionZone?.cleanup?.();

    this.enabled = false;
    this._lastFrameTime = 0;

    console.log('✓ Mega Glyph Conduit cleaned up');
  }

  // ============================================================
  // DEBUG HELPERS
  // ============================================================

  debugCore() {
    this.core?.printStatus?.();
  }

  debugMessaging() {
    this.messaging?.printStatusReport?.();
  }

  debugRecursiveMessaging() {
    this.recursiveMessaging?.printStatusReport?.();
  }

  debugSignals() {
    const status = this.signals?.getStatus?.();
    if (status) {
      console.log('Signals Status:', status);
    }
  }

  debugSemantic() {
    const status = this.semantic?.getStatus?.();
    if (status) {
      console.log('Semantic Status:', status);
    }
  }

  debugAll() {
    this.printStatus();
  }

  forceRefresh() {
    console.log('Forcing refresh of all glyph systems...');

    this.messaging?.forceRefresh?.();
    this.recursiveMessaging?.clearAllChains?.();
    this.signals?.clearAllSignals?.();
    this.core?.cleanup?.();

    console.log('✓ All glyph systems refreshed');
  }
}
