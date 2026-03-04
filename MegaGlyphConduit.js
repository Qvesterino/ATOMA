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
