   this.frameScheduler = new FrameScheduler();
        window.frameScheduler = this.frameScheduler;
        window.debugSchedulerStats = () => this.frameScheduler.getStats();
        window.debugSchedulerList = () => this.frameScheduler.listSystems();
        this.frameScheduler.register('background', () => EnhancedNodeModels.ensureRegistryReady?.(), 'registry-warmup');
        this.frameScheduler.register('background', (dt) => {
            if (this.harmonicTopology?.enabled) {
                this.harmonicTopology.update(
                    dt,
                    this.linkSemanticPictograms?.fusionZoneManager,
                    this.linkingSystem
                );
            }
        }, 'background.harmonicTopology');
        this.frameScheduler.register('visual', (dt) => {
            if (this.proceduralGlyphGenerator?.enabled) {
                this.proceduralGlyphGenerator.update(dt);
            }
        }, 'visual.proceduralGlyphGenerator');
        this.frameScheduler.register('background', (dt) => {
            if (this.harmonicCycleController?.enabled) {
                const harmonicNetworkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    stability: this.nodeDynamicMetrics?.avgStability || 0.5,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0
                };
                this.harmonicCycleController.update(dt, harmonicNetworkState);
            }
        }, 'background.harmonicCycleController');
        // === UPDATE LANE ORDER (Fáza C, bod 14) ===
        // FrameScheduler order is: realtime -> visual -> simulation -> background.
        // Keep metrics aggregator in SIMULATION lane (single source, no duplicates).
        // This guarantees deterministic ordering for simulation readers in the same lane
        // as long as this registration happens before their registration.
        if (this.frameScheduler?.isRegistered?.('background.networkMetricsAggregator') === true) {
            this.frameScheduler.unregister('background.networkMetricsAggregator');
        }
        if (this.frameScheduler?.isRegistered?.('simulation.metricsAggregator') === true) {
            this.frameScheduler.unregister('simulation.metricsAggregator');
        }
        this.frameScheduler.register(
            'simulation',
            () => this.metricsRuntime_v1?.runNetworkMetricsAggregator?.(),
            'simulation.metricsAggregator'
        );
        this.frameScheduler.register('background', (dt) => {
            this.narrativePatterns?.update?.(dt, this.aiNodes?.nodes, this.linkingSystem?.links, this.worldMetrics || {});
        }, 'background.narrativePatterns');
        this.frameScheduler.register('background', (dt) => {
            this.worldEvents?.update?.(dt, this.scene, this.camera, this.renderer);
        }, 'background.worldEvents');
        this.frameScheduler.register('background', (dt) => {
            this.weatherPack?.update?.(dt, this.scene, this.camera);
        }, 'background.weatherPack');
        this.frameScheduler.register('background', (dt) => {
            this.ambientEntityManager?.update?.(dt);
        }, 'background.ambientEntityManager');
        this.frameScheduler.register('background', (dt) => {
            this.consciousnessLayer?.update?.(dt);
        }, 'background.consciousnessLayer');
        this.frameScheduler.register('background', (dt) => {
            this.poetryEngine?.update?.(dt);
        }, 'background.poetryEngine');
        this.frameScheduler.register('background', (dt) => {
            this.emotionalFeed?.update?.(dt);
        }, 'background.emotionalFeed');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.fxPerformanceScaler) {
                this.fxPerformanceScaler.update(dt);
            }
        }, 'simulation.fxPerformanceScaler');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.adaptivePerformanceMonitor) {
                this.adaptivePerformanceMonitor.update(dt);
            }
        }, 'simulation.adaptivePerformanceMonitor');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.fxPerformanceTransition) {
                this.fxPerformanceTransition.update(dt);
            }
        }, 'simulation.fxPerformanceTransition');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticFatigueAdapter && this.aiNodes) {
                this.synapticFatigueAdapter.updateFatigue(
                    this.aiNodes.nodes || [],
                    this.synapticGatingAdapter?.nodeGateMap || new Map(),
                    dt,
                    this.time * 1000
                );
            }
        }, 'simulation.synapticFatigueAdapter');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticSpecializationAdapter && this.aiNodes) {
                this.synapticSpecializationAdapter.updateSpecialization(
                    this.aiNodes.nodes || [],
                    this.synapticGatingAdapter?.nodeGateMap || new Map(),
                    dt,
                    this.time * 1000
                );
            }
        }, 'simulation.synapticSpecializationAdapter');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.linkCorruptionTransmission) {
                this.linkCorruptionTransmission.updateTransmission(dt);
            }
        }, 'simulation.linkCorruptionTransmission');
        this.frameScheduler.register('simulation', (dt) => {
            // Lazy-init to avoid constructor when disabled
            if (!this.harmonyCascade) {
                this.harmonyCascade = new CascadingHarmonicResonanceAmplification();
            }

            // Build a fresh, lightweight view of the network each tick (10 Hz)
            const nodesArray = this.aiNodes?.nodes || [];
            const nodeMap = new Map();
            for (const node of nodesArray) {
                const id = node?.id ?? node?.userData?.nodeId;
                if (id !== undefined) nodeMap.set(id, node);
            }

            this.harmonyCascade.network = {
                nodes: nodeMap,
                links: this.linkingSystem?.links || [],
                _topologyGeneration: this.linkingSystem?._topologyGeneration || 0,
                waveEngine: this.waveInterferenceEngine || null
            };

            this.harmonyCascade.update(dt);
        }, 'simulation.harmonyCascade');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.harmonyStabilizationSystem) {
                safeTick(this.harmonyStabilizationSystem, dt);
            }
        }, 'simulation.harmonyStabilizationSystem');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.effectOrchestrator) {
                safeTick(this.effectOrchestrator, dt, this.time);
            }
        }, 'simulation.effectOrchestrator');
        
        // Disabled: renderer now reads only link.userData.metrics directly in link pipelines.
        this.linkRendererMetricsIntegration = null;
        this.coreMetricsCalculator = null;
        this.frameScheduler.register('simulation', (dt) => {
            if (this.nodeShellSizeAuthority) {
                this.nodeShellSizeAuthority.enforceShellSizes(null, this.nodeAuraSystem || null);
            }
        }, 'simulation.nodeShellSizeAuthority');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.linkPersonalityStateMachine && this.nodeLinking) {
                this.linkPersonalityStateMachine.update(dt, this.nodeLinking.links || []);
            }
        }, 'simulation.linkPersonalityStateMachine');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.synapticGatingAdapter && this.aiNodes) {
                this.synapticGatingAdapter.updateNodeGates(this.aiNodes.nodes || []);
            }
        }, 'simulation.synapticGatingAdapter');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.influenceAttenuationAbsorption) {
                this.influenceAttenuationAbsorption.update(dt, this.time);
            }
        }, 'simulation.influenceAttenuationAbsorption');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.influenceReflection) {
                this.influenceReflection.update(dt, this.time);
            }
        }, 'simulation.influenceReflection');
        this.frameScheduler.register('simulation', (dt) => {
            const trapSystem = this.standingWaveTrapSystem || this.standingWaveTrap;
            if (trapSystem) {
                trapSystem.update(dt, this.time);
            }
        }, 'simulation.waveStandingTraps');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.cascadeAccelSetup) {
                this.cascadeAccelSetup.update(dt, this.time);
            }
        }, 'simulation.cascadeAccelSetup');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.coreMetricsOverlay) {
                this.runCoreMetricsOverlayTick(dt);
            }
        }, 'simulation.coreMetricsOverlay');
        this.frameScheduler.register('simulation', () => {
            if (this.primaryNodeTopBar) {
                this.primaryNodeTopBar.update();
            }
        }, 'simulation.primaryNodeTopBar');
        this.frameScheduler.register('visual', (dt) => {
            this.worldRuntime_v1?.update?.(dt);
        }, 'visual.worldRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodeEditorRuntime_v1?.update?.(dt);
        }, 'simulation.nodeEditorRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.metricsRuntime_v1?.update?.(dt);
        }, 'simulation.metricsRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.networkStressAggregator?.update?.(dt);
        }, 'simulation.networkStress');
        this.frameScheduler.register('simulation', () => {
            const stress = this.networkStressAggregator?.getStress?.() ?? 0;
            // Feed network stress to CanonicalTemplate3_StressVisuals
            if (this.canonicalTemplate3_StressVisuals) {
                this.canonicalTemplate3_StressVisuals.updateNetworkStress(stress);
            }
            const emitEvent = (eventName, payload) => {
                if (this.semanticBus?.emit) {
                    this.semanticBus.emit(
                        eventName,
                        payload,
                        { priority: this.semanticBus.priority?.INTERACTIVE ?? this.semanticBus.priority?.NORMAL }
                    );
                }
                if (this.multiNetworkManager?.emitEvent) {
                    this.multiNetworkManager.emitEvent(eventName, payload);
                }
            };

            let tier = 0;
            let tierEvent = null;
            if (stress > 90) {
                tier = 3;
                tierEvent = 'cascade.high';
            } else if (stress > 75) {
                tier = 2;
                tierEvent = 'cascade.medium';
            } else if (stress > 60) {
                tier = 1;
                tierEvent = 'cascade.low';
            }

            const previousTier = this._networkStressCascadeTier ?? 0;
            this._networkStressCascadeTier = tier;
            if (tier <= 0 || tier === previousTier || !tierEvent) {
                return;
            }

            const payload = {
                stress,
                tier,
                source: 'networkStressAggregator',
                timestamp: Date.now()
            };

            emitEvent(tierEvent, payload);
            emitEvent('cascade.triggered', { ...payload, level: tierEvent });
        }, 'simulation.networkStressCascadeBridge');
        this.frameScheduler.register('simulation', (dt) => {
            this.personalityRuntime_v1?.update?.(dt);
        }, 'simulation.personalityRuntime_v1');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodePersonalitySystem?.update?.(dt, this.aiNodes?.nodes);
        }, 'simulation.nodePersonalitySystem');
        this.frameScheduler.register('simulation', (dt) => {
            this.worldPersonalityController?.update?.(dt, this.aiNodes?.nodes);
        }, 'simulation.worldPersonalityController');
        this.frameScheduler.register('simulation', (dt) => {
            this.phase5MultiNetworkOrchestrator?.update?.(dt);
        }, 'simulation.phase5MultiNetworkOrchestrator');
        this.frameScheduler.register('simulation', (dt) => {
            this.emergentThoughtStorms?.update?.(dt, this.aiNodes, this.linkingSystem);
        }, 'simulation.emergentThoughtStorms');
        this.frameScheduler.register('simulation', (dt) => {
            this.colonyManager?.update?.(dt);
        }, 'simulation.colonyManager');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodeEvolution?.update?.(dt, {}, this.linkingSystem);
        }, 'simulation.nodeEvolution');
        this.frameScheduler.register('simulation', (dt) => {
            this.nodePersonality?.update?.(dt, this.time);
        }, 'simulation.nodePersonality');
        this.frameScheduler.register('simulation', (dt) => {
            this.tier4GameplayIntegration?.update?.(dt);
        }, 'simulation.tier4GameplayIntegration');
        this.frameScheduler.register('simulation', (dt) => {
            this.networkRituals?.updateRituals?.(dt * 1000);
        }, 'simulation.networkRituals');

        this.frameScheduler.register('realtime', this.runCameraControllerTick.bind(this), 'realtime.cameraController');
        this.frameScheduler.register('realtime', this.runPlayerControllerTick.bind(this), 'realtime.playerController');
        this.frameScheduler.register('visual', (dt) => this.runRenderTick(dt), 'renderer.render');
        this.frameScheduler.register('visual', this.synergyChainReactionTick.bind(this), 'visual.synergyChainReaction');
        this.frameScheduler.register('visual', this.runNodeAuraSystemTick.bind(this), 'visual.nodeAuraSystem');
        this.frameScheduler.register('visual', (dt) => {
            this.corruptionAuraDesaturation?.update?.(dt);
        }, 'visual.corruptionAuraDesaturation');
        this.frameScheduler.register('visual', () => {
            this.corruptionDesaturation?.update?.();
        }, 'visual.corruptionDesaturation');
        this.frameScheduler.register('visual', (dt) => {
            if (this.metricsVisualFX && this.aiNodes && !this._runVisualSemanticPending) {
                this.metricsVisualFX.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.metricsVisualFX');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyBonusVisualization && this.nodeLinking) {
                this.synergyBonusVisualization.update(dt, this.nodeLinking.links || []);
            }
        }, 'visual.synergyBonusVisualization');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyBonusFXLayer && this.nodeLinking) {
                this.synergyBonusFXLayer.update(dt, this.nodeLinking.links || []);
            }
        }, 'visual.synergyBonusFXLayer');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyResonanceShaderPack && this.nodeLinking) {
                this.synergyResonanceShaderPack.update(dt, this.nodeLinking.links || []);
            }
        }, 'visual.synergyResonanceShaderPack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyCascadeFXBridge && this.aiNodes && this.nodeLinking) {
                this.synergyCascadeFXBridge.update(
                    dt,
                    this.aiNodes.nodes || [],
                    this.nodeLinking.links || []
                );
            }
        }, 'visual.synergyCascadeFXBridge');
        this.frameScheduler.register('visual', (dt) => this.fxRuntime_v1?.update?.(dt), 'visual.fxRuntime_v1');
        this.frameScheduler.register('visual', (dt) => this.personalityVisualAdapter?.update?.(dt), 'visual.personalityVisualAdapter');
        this.frameScheduler.register('visual', (dt) => this.personalityVFXLayer?.update?.(dt, this.time || this.elapsedTime), 'visual.personalityVFXLayer');
        this.frameScheduler.register('visual', (dt) => this.personalityShaderBridge?.update?.(dt), 'visual.personalityShaderBridge');
        this.frameScheduler.register('visual', (dt) => this.advancedShaderFX?.update?.(dt), 'visual.advancedShaderFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeCurves?.update?.(dt), 'visual.archetypeCurves');
        this.frameScheduler.register('visual', (dt) => this.archetypeAuraFX?.update?.(dt), 'visual.archetypeAuraFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeColorFX?.update?.(dt), 'visual.archetypeColorFX');
        this.frameScheduler.register('visual', (dt) => this.archetypeShaderModes?.update?.(dt), 'visual.archetypeShaderModes');
        this.frameScheduler.register('visual', (dt) => this.nodeShaderActivation?.update?.(dt), 'visual.nodeShaderActivation');
        this.frameScheduler.register('visual', (dt) => this.glyphLayer4?.update?.(dt), 'visual.glyphLayer4');
        this.frameScheduler.register('visual', () => this.updateHoverGlyphTarget?.(), 'visual.semanticHoverGlyph');
        this.frameScheduler.register('visual', (dt) => this.semanticGlyphAI?.update?.(dt, this.aiNodes?.nodes), 'visual.semanticGlyphAI');
        this.frameScheduler.register('visual', (dt) => this.glyphFusionOverlay?.update?.(dt), 'visual.glyphFusionOverlay');
        this.frameScheduler.register('visual', (dt) => this.linkedGlyphSync?.update?.(dt, this.aiNodes, this.linkingSystem), 'visual.linkedGlyphSync');
        this.frameScheduler.register('visual', (dt) => this.cascadePropagationVisuals?.update?.(dt), 'visual.cascadePropagation');
        this.frameScheduler.register('visual', () => this.cascadePropagationVisuals?.checkCascadeEvents?.(), 'visual.phase5CascadeEventCheck');
        this.frameScheduler.register('visual', (dt) => this.phase5CascadeVisualizationBridge?.update?.(dt), 'visual.phase5CascadeVisualizationBridge');
        this.frameScheduler.register('visual', (dt) => this.preCascadeVisualHint?.update?.(dt), 'visual.preCascadeVisualHint');
        this.frameScheduler.register('visual', (dt) => this.evolvingLinkFX?.update?.(dt, null, null), 'visual.evolvingLinkFX');
        this.frameScheduler.register('visual', (dt) => this.linkVisualMoodSystem?.update?.(dt), 'visual.linkVisualMoodSystem');
        this.frameScheduler.register('visual', () => { if (this.linkDebugMode?.enabled) this.linkDebugMode.updateDebugVisuals(); }, 'visual.linkDebugMode');
        this.frameScheduler.register('visual', (dt) => this.legendaryPack?.update?.(dt, this.scene, this.camera, this.renderer), 'visual.legendaryPack');
        this.frameScheduler.register('visual', (dt) => this.legendaryLinkFX?.update?.(dt, this.scene, this.camera, this.renderer), 'visual.legendaryLinkFX');
        this.frameScheduler.register('visual', (dt) => this.personalityFX?.update?.(dt, this.scene, this.camera), 'visual.personalityFX');
        this.frameScheduler.register('visual', (dt) => this.worldFXPack?.update?.(dt, this.scene, this.camera), 'visual.worldFXPack');
        this.frameScheduler.register('visual', (dt) => this.dreamDepthPack?.update?.(dt, this.dreamDepthWorldSystems), 'visual.dreamDepthPack');
        this.frameScheduler.register('visual', (dt) => this.dreamDepthEffects?.update?.(dt), 'visual.dreamDepthEffects');
        this.frameScheduler.register('visual', (dt) => this.mobilityPack?.update?.(dt), 'visual.mobilityPack');
        this.frameScheduler.register('visual', (dt) => this.nodeVisuals4?.update?.(dt), 'visual.nodeVisuals4');
        this.frameScheduler.register('visual', (dt) => this.extremeShaderTestSuite?.update?.(dt), 'visual.extremeShaderTestSuite');
        this.frameScheduler.register('visual', (dt) => this.newNodeCategories?.update?.(dt, this.time), 'visual.newNodeCategories');
        // this.frameScheduler.register('visual', (dt) => this.extremeLinkVisuals?.update?.(dt), 'visual.extremeLinkVisuals');
        // this.frameScheduler.register('visual', (dt) => this.extremeLinkVisuals4?.update?.(dt, this.camera), 'visual.extremeLinkVisuals4');
        this.frameScheduler.register('visual', (dt) => this.mythicRitualController?.update?.(dt, this.aiNodes?.nodes), 'visual.mythicRitualController');
        this.frameScheduler.register('visual', (dt) => this.phase8RitualOrchestration?.update?.(dt * 1000), 'visual.phase8RitualOrchestration');
        this.frameScheduler.register('visual', (dt) => this.mythicSeedGlyph?.update?.(dt, this.camera), 'visual.mythicSeedGlyph');
        // Infra/diagnostic: keep in visual for now to avoid sim cadence mismatch
        this.frameScheduler.register('visual', () => this.microImpulseAdapter?.update?.(), 'visual.microImpulseAdapter');
        // Safety net – low frequency; leave in visual until dedicated infra layer exists
        this.frameScheduler.register('visual', () => {
            if (this.hardInteractionAuthority && this.scene && (this.frameCount % 180 === 0)) {
                this.hardInteractionAuthority.safetyNet();
            }
        }, 'visual.hardInteractionAuthority');
        this.frameScheduler.register('visual', (dt) => this.nodeMicroEvents?.update?.(dt, this.aiNodes?.nodes), 'visual.nodeMicroEvents');
        this.frameScheduler.register('visual', (dt) => this.t2CorruptionVisualIntegration?.update?.(dt, this.linkingSystem?.links), 'visual.t2CorruptionVisualIntegration');
        this.frameScheduler.register('visual', (dt) => this.t2HarmonyVisualConsumer?.update?.(dt, this.aiNodes, this.harmonyStabilizationSystem), 'visual.t2HarmonyVisualConsumer');
        // Realtime systems
        this.frameScheduler.register('realtime', (dt) => this.nodeInteractionEngine?.update?.(dt), 'realtime.nodeInteraction');
        this.frameScheduler.register('realtime', (dt) => this.hitProxySystem?.update?.(dt), 'realtime.hitProxy');
        this.frameScheduler.register('realtime', () => {
            if (this._runElasticityPending) {
                this._runElasticityPending = false;
                this.visualNetworkTimeElasticityTick(this._pendingElasticityDt);
            }
        }, 'visualNetworkTimeElasticity.realtime');
        this.frameScheduler.register('realtime', () => {
            if (!VISUAL_SYSTEMS_ENABLED) return;
            if (this._runSynergyPulsePending) {
                this._runSynergyPulsePending = false;
                this.synergyPulseVisualsTick(this._pendingSynergyPulseDt);
            }
        }, 'synergyPulseVisuals.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runVisualSemanticPending) {
                this._runVisualSemanticPending = false;
                this.runVisualSemanticTick(this._pendingVisualSemanticDt, this._pendingMark);
            }
        }, 'semantic.visual30Hz');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicResonancePending) {
                this._runHarmonicResonancePending = false;
                this.harmonicResonanceCouplingTick(this._pendingHarmonicResonanceDt);
            }
        }, 'visual.harmonicResonanceCoupling');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicHubAuraPending) {
                this._runHarmonicHubAuraPending = false;
                this.harmonicHubAuraSystemTick(this._pendingHarmonicHubAuraDt);
            }
        }, 'visual.harmonicHubAuraSystem');
        this.frameScheduler.register('visual', () => {
            if (this._runHarmonicInfluencePending) {
                this._runHarmonicInfluencePending = false;
                this.harmonicInfluencePropagationTick(this._pendingHarmonicInfluenceDt);
            }
        }, 'visual.harmonicInfluencePropagation');
        this.frameScheduler.register('visual', (dt) => {
            const pulseWaveBridge = this.pulseWaveBridge || this.pulseWaveSystemBridge;
            if (pulseWaveBridge && this.waveInterferenceEngine && this.pulseIntersectionAdapter) {
                pulseWaveBridge.update(dt, {
                    waveEngine: this.waveInterferenceEngine,
                    links: this.nodeLinking?.links || [],
                    nodeDynamicMetrics: this.nodeDynamicMetrics,
                    pulseIntersectionAdapter: this.pulseIntersectionAdapter
                });
            }
        }, 'visual.pulseWaveBridge');
        this.frameScheduler.register('visual', () => {
            if (this.pulseBoundaryInteractionAdapter && this.aiNodes && this.nodeLinking) {
                this.pulseBoundaryInteractionAdapter.update({
                    links: this.nodeLinking?.links || [],
                    nodes: this.aiNodes?.nodes || [],
                    nodeDynamicMetrics: this.nodeDynamicMetrics,
                    aiNodes: this.aiNodes
                });
            }
        }, 'visual.pulseBoundaryInteractionAdapter');
        this.frameScheduler.register('visual', () => {
            if (this.pulseIntersectionAdapter) {
                this.pulseIntersectionAdapter.update();
            }
        }, 'visual.pulseIntersectionAdapter');
        this.frameScheduler.register('visual', (dt) => {
            if (this.resonanceFeedback && this.aiNodes && this.nodeLinking) {
                this.resonanceFeedback.update(
                    dt,
                    this.aiNodes.nodes || [],
                    this.nodeLinking.links || []
                );
            }
        }, 'visual.resonanceFeedback');
        this.frameScheduler.register('visual', (dt) => {
            if (this.resonanceRupture) {
                this.resonanceRupture.update(dt, this.time);
            }
        }, 'visual.resonanceRupture');
        this.frameScheduler.register('visual', (dt) => {
            const resonanceEchoTrailSystem = this.resonanceEchoTrailSystem || this.resonanceEchoTrails;
            if (resonanceEchoTrailSystem?.enabled) {
                resonanceEchoTrailSystem.update(
                    dt,
                    this.linkSemanticPictograms?.fusionZoneManager?.compositeGlyphs
                );
            }
        }, 'visual.resonanceEchoTrailSystem');
        this.frameScheduler.register('visual', (dt) => {
            if (this.compositeResonanceFeedback) {
                this.compositeResonanceFeedback.update(dt);
            }
        }, 'visual.compositeResonanceFeedback');
        this.frameScheduler.register('realtime', () => {
            if (this._runCascadeVisualizerPending) {
                this._runCascadeVisualizerPending = false;
                this.cascadeVisualizerTick(this._pendingCascadeVisualizerDt);
            }
        }, 'cascadeVisualizer.realtime');
        this.frameScheduler.register('realtime', () => {
            if (this._runSlowSemanticPending) {
                this._runSlowSemanticPending = false;
                this.runSlowSemanticTick(this._pendingSlowSemanticDt);
            }
        }, 'semantic.slow10Hz');
        this.frameScheduler.register('visual', (dt) => {
            if (this.glyphSystem) {
                this.glyphSystem.update(dt);
            }
        }, 'visual.glyphSystem');
        this.frameScheduler.register('visual', (dt) => {
            if (this.glyphSystem4 && this.aiNodes) {
                this.glyphSystem4.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.glyphSystem4');
        this.frameScheduler.register('visual', (dt) => {
            if (this.proceduralMeaningEngine && this.aiNodes && this.semanticGlyphAI) {
                this.proceduralMeaningEngine.update(dt, this.aiNodes.nodes, this.semanticGlyphAI);
            }
        }, 'visual.proceduralMeaningEngine');
        this.frameScheduler.register('visual', (dt) => {
            if (this.adaptiveGlyphRendering && this.aiNodes) {
                this.adaptiveGlyphRendering.update(dt, this.aiNodes.nodes);
            }
        }, 'visual.adaptiveGlyphRendering');
        this.frameScheduler.register('visual', (dt) => {
            if (!this._runSlowSemanticPending) return;
            if (this.glyphAnimationModulator?.enabled && this.proceduralGlyphGenerator?.glyphInstances) {
                const harmonicNetworkState = {
                    harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
                    corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
                    stability: this.nodeDynamicMetrics?.avgStability || 0.5,
                    synergy: this.nodeDynamicMetrics?.avgSynergy || 0
                };
                this.glyphAnimationModulator.update(
                    this.proceduralGlyphGenerator.glyphInstances,
                    harmonicNetworkState
                );
            }
        }, 'visual.glyphAnimationModulator');
        this.frameScheduler.register('visual', (dt) => {
            if (this.particleEmissionScaler) {
                this.particleEmissionScaler.update(dt);
            }
        }, 'visual.particleEmissionScaler');
        this.frameScheduler.register('visual', (dt) => {
            if (this.particleSemanticDensity) {
                this.particleSemanticDensity.update(dt, this.time);
            }
        }, 'visual.particleSemanticDensity');
        this.frameScheduler.register('visual', (dt) => {
            const boostSystem = this.cascadeParticleEmissionBoost;
            if (boostSystem) {
                const links = this.nodeLinking?.links;
                if (Array.isArray(links) && links.length > 0) {
                    const cascadeSystem = this.cascadeVisualizer || null;
                    boostSystem.update(dt, links, cascadeSystem);
                }
            }
        }, 'visual.cascadeParticleEmissionBoost');
        this.frameScheduler.register('visual', (dt) => {
            if (this.cascadeParticleColorTinting) {
                this.cascadeParticleColorTinting.update(
                    dt,
                    this.nodeLinking?.links || [],
                    this.cascadeVisualizer || this.harmonicCascadeAmplification || null,
                    this.conflictSystem || null
                );
            }
        }, 'visual.cascadeParticleColorTinting');
        this.frameScheduler.register('visual', (dt) => {
            if (this.cascadeParticleSystem) {
                this.cascadeParticleSystem.update(dt, this.time);
            }
        }, 'visual.cascadeParticleSystem');
        
        // NEW: Update particle trail system (SESSION 122)
        this.frameScheduler.register('visual', (dt) => {
            if (this.cascadeParticles) {
                updateParticleTrailSystem(
                    dt,
                    this,
                    this.cascadeParticles
                );
            }
        }, 'visual.particleTrailSystem');
        
        // NEW: Update cascade resonance wave visualization
        this.frameScheduler.register(
            'visual',
            (dt) => this.cascadeResonanceWaveVisualization?.update?.(dt),
            'visual.cascadeResonanceWaveVisualization'
        );
        
        // NEW: Update resonance cascade visualization
        this.frameScheduler.register('visual', (dt) => {
            const resonanceCascadeVisualization = this.resonanceCascadeVisualization || this.resonanceCascade;
            if (resonanceCascadeVisualization && resonanceCascadeVisualization.enabled !== false) {
                resonanceCascadeVisualization.update(dt, this.aiNodes?.nodes, this.linkingSystem?.links);
            }
        }, 'visual.resonanceCascadeVisualization');
        
        this.frameScheduler.register('visual', (dt) => {
            if (this.healingParticles) {
                this.healingParticles.update(dt, this.time, this.networkState || {}, this.camera);
            }
        }, 'visual.healingParticles');
        this.frameScheduler.register('visual', (dt) => {
            if (this.harmonicHealing) {
                this.harmonicHealing.update(dt, this.time, this.networkState || {});
            }
        }, 'visual.harmonicHealing');
        this.frameScheduler.register('visual', (dt) => {
            if (this.harmonicRecovery) {
                this.harmonicRecovery.update(dt, this.time, this.networkState || {});
            }
        }, 'visual.harmonicRecovery');
        this.frameScheduler.register('visual', (dt) => {
            if (this.linkTrailParticles) {
                this.linkTrailParticles.update(dt, this.time);
            }
        }, 'visual.linkTrailParticles');
        // LinkTrailEmitter update moved to LinkRendererConduit
        // See: LinkRendererConduit.update()
        // Eliminates race condition - conduit has direct curve access

        this.frameScheduler.register('visual', (dt) => {
            if (this.memoryTrails) {
                this.memoryTrails.update(dt);
            }
        }, 'visual.memoryTrails');
        this.frameScheduler.register('visual', (dt) => {
            if (this.visualSuperpack) {
                this.visualSuperpack.update(dt);
            }
        }, 'visual.visualSuperpack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.cinematicUpgrade) {
                this.cinematicUpgrade.update(dt);
            }
        }, 'visual.cinematicUpgrade');
        this.frameScheduler.register('visual', (dt) => {
            if (this.dynamicLinkColorSystem) {
                this.dynamicLinkColorSystem.update(dt);
            }
        }, 'visual.dynamicLinkColorSystem');
        this.frameScheduler.register('visual', (dt) => {
            this.aiNodes?.updateEdgeCageDistanceFade?.(dt, this.camera);
        }, 'visual.edgeCageDistanceFade');
        this.frameScheduler.register('visual', (deltaTime) => {
            if (this.waveShaderBridge) {
                const nodes =
                    this.aiNodes?.nodes ||
                    this.nodes ||
                    this.nodeList ||
                    [];
                const links =
                    this.linkingSystem?.links ||
                    this.nodeLinking?.links ||
                    this.links ||
                    this.linkList ||
                    [];
                this.waveShaderBridge.update(deltaTime, {
                    nodes,
                    links
                });
            }
        }, 'visual.waveShaderBridge');
        this.frameScheduler.register('visual', (dt) => {
            if (this.waveTravelShaderPack) {
                this.waveTravelShaderPack.update(dt);
            }
        }, 'visual.waveTravelShaderPack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.waveDynamicsShaderPack) {
                this.waveDynamicsShaderPack.update(dt);
            }
        }, 'visual.waveDynamicsShaderPack');
        this.frameScheduler.register('visual', (dt) => {
            if (this.synergyTravelingWaveFX) {
                this.synergyTravelingWaveFX.update(dt, this.time || 0);
            }
        }, 'visual.synergyTravelingWaveFX');
        this.frameScheduler.register('visual', (dt) => {
            if (!this.waveBurstRouter && this._initWaveBurstRouter) {
                this._initWaveBurstRouter();
            }
            if (this.waveBurstRouter) {
                this.waveBurstRouter.update(dt);
            }
        }, 'visual.waveBurstRouter');
        this.frameScheduler.register('simulation', (dt) => {
            if (this.waveInterferenceEngine) {
                this.waveInterferenceEngine.update(dt);
            }
        }, 'simulation.waveInterferenceEngine');
        this.frameScheduler.register('visual', (dt) => {
            if (this.standingWaveRenderer) {
                this.standingWaveRenderer.update(dt, this.time);
            }
        }, 'visual.waveStandingRenderer');
        this.frameScheduler.register('visual', (dt) => {
            const wavePatternSystem = this.wavePatternSystem || this.waveInterference;
            if (wavePatternSystem) {
                wavePatternSystem.update(dt, this.time);
            }
        }, 'visual.waveInterferencePatterns');
        this.frameScheduler.register('visual', (dt) => {
            // Harmonic resonance feedback fields (30 Hz visual cadence)
            const harmonicResonanceFeedbackSystem =
                this.harmonicResonanceFeedbackSystem || this.harmonicResonance;
            if (harmonicResonanceFeedbackSystem) {
                const pictogramSystem = this.linkSemanticPictograms || this.linkPictogramSystem;
                harmonicResonanceFeedbackSystem.update?.(
                    dt,
                    pictogramSystem?.fusionZoneManager,
                    pictogramSystem?.pictograms,
                    this.linkingSystem || this.nodeLinking || this.nodeLinkingSystem
                );
            }
        }, 'visual.harmonicResonanceFeedback');
        this.frameScheduler.register('visual', (dt) => {
            if (this.canonicalTemplate3_StressVisuals) {
                // Register all nodes for stress tracking
                const nodes = this.aiNodes?.nodes || [];
                for (const node of nodes) {
                    if (node && this.canonicalTemplate3_StressVisuals) {
                        this.canonicalTemplate3_StressVisuals.registerNode(node);
                    }
                }
                
                // Feed node load pressure data (computed from node metrics)
                for (const node of nodes) {
                    if (node && node.userData) {
                        // Compute load pressure based on actual node metrics
                        const linkCount = node.userData.linkCount || 0;
                        const activeLinks = node.userData.activeLinks || 0;
                        const corruptionLevel = node.userData.corruption || 0;
                        // Load pressure = (activeLinks / linkCount) + (corruptionLevel * 0.5)
                        const loadPressure = Math.min(1, (activeLinks / Math.max(1, linkCount)) + (corruptionLevel * 0.5));
                        this.canonicalTemplate3_StressVisuals.updateNodeLoadPressure(node, loadPressure);
                    }
                }
                this.canonicalTemplate3_StressVisuals.update(dt, this.time || 0);
            }
        }, 'visual.canonicalTemplate3_StressVisuals');
        this.frameScheduler.register('visual', (dt) => {
            if (this.stressVisualShaderSystem) {
                const nodes = this.aiNodes?.nodes || [];
                for (const node of nodes) {
                    if (node) {
                        this.stressVisualShaderSystem.registerNode(node);
                    }
                }
                this.stressVisualShaderSystem.update(dt, this.time, nodes);
            }
        }, 'visual.stressVisualShaderSystem');
        this.frameScheduler.register('visual', () => {
            if (this.harmonyDebugOverlay && this.harmonyDebugOverlay.enabled) {
                const nodes = this.aiNodes?.nodes || [];
                const links = this.nodeLinking?.links || [];
                this.harmonyDebugOverlay.update(nodes, links);
            }
        }, 'visual.harmonyDebugOverlay');
        // --- HUD bootstrap (required for realtime overlays) ---
this.wakeHud('coreMetrics');
this.wakeHud('nodeInspect');
this.setHudDirty('coreMetrics');
this.setHudDirty('nodeInspect');

        this.semanticBus.subscribe('camera.motion', () => {
            this.wakeHud('camera-motion');
            this.setHudDirty('coreMetrics');
        });
        this.semanticBus.subscribe('node.selection', () => {
            this.wakeHud('selection');
        });

        // Audio routing is bound after audio system construction.
        
        // Phase B Console API
        window.scheduler = {
            // Register a system to a layer (with optional ID for management)
            register: (layer, fn, id) => this.frameScheduler.register(layer, fn, id),
            
            // Unregister a system by ID
            unregister: (id) => this.frameScheduler.unregister(id),
            
            // Check if system is registered
            isRegistered: (id) => this.frameScheduler.isRegistered(id),
            
            // Get stats
            stats: () => this.frameScheduler.getStats(),
            
            // List all systems by layer
            listSystems: () => this.frameScheduler.listSystems(),
            
            // Clear all registrations
            clear: () => this.frameScheduler.clear(),
            
            // Test registration (example system for Phase B verification)
            registerTestSystems: () => {
                console.group('%c[FrameScheduler] PHASE B TEST REGISTRATION', 'color: #00ff00; font-weight: bold;');
                console.log('No test systems currently registered.');
                console.log('To add test systems, register them via frameScheduler.register()');
                console.groupEnd();
            }
        };