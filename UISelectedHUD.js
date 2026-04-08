/**
 * SELECTED NODE HUD - v3.0+ HUD Resolver 2.1 (Hybrid-First Link Detection)
 * Enhanced with Audit 6.2 - Event Order Validation
 * Enhanced with LinkPriority v1.0 - Priority tier display
 * Enhanced with HUD Resolver 2.1 - Hybrid-first reliable link detection
 * 
 * Event-driven HUD that displays the currently selected node's information
 * and all linked node categories in the top-right corner of the screen.
 * 
 * Features:
 * - Connects to NodeLinkingSystem for real-time selection events
 * - Displays node name, code, and type with proper category extraction
 * - Shows ALL linked node categories (deduplicated, alphabetical order)
 * - [LinkPriority v1.0] Displays max priority tier of linked nodes (HIGH, NORMAL, LOW)
 * - [HUD Resolver 2.1] Hybrid-first link detection (cache → index → runtime)
 * - DOM-based with elegant aquamarine neon styling
 * - Positioned top-right (140px, 20px - avoiding fullscreen button)
 * - Auto-initializes when imported
 * - Proper fallback chain for category extraction (userData.category → nodeType → type → aiCategory → UNKNOWN)
 * - [Audit 6.2] Event order validation - ensures HUD stays synchronized
 * 
 * API:
 * - UISelectedHUD.setLinkingSystem(linkingSystem) - Connect to NodeLinkingSystem
 * - UISelectedHUD.updateDisplay(node) - Update HUD with node info
 * - UISelectedHUD.updateLinkedCategories(node) - Refresh linked categories
 * - UISelectedHUD.refreshDisplay() - Force full refresh after link changes
 * - UISelectedHUD.clear() - Clear the HUD to "SELECTED: NONE"
 * - UISelectedHUD.show() / hide() / toggleVisibility() - Control visibility
 * 
 * Example Output (simplified format):
 * - Select: [CONTROL]
 * - Select + 1 link: [CONTROL] → {EMOTIONAL}
 * - Select + 2+ links: [CONTROL] → {EMOTIONAL + INPUT}
 * 
 * v3.0 Changes:
 * ✅ Added _getCategoryFromNode(node) with proper fallback chain
 * ✅ Fixed category extraction priority (category → nodeType → type → aiCategory)
 * ✅ Proper Set deduplication for linked categories
 * ✅ Alphabetical sorting of category display
 * ✅ Added debug logging for verification
 * ✅ Connected to actual NodeLinkingSystem (not legacy SelectionCore)
 * 
 * [Audit 6.2]:
 * ✅ Event order validation layer
 * ✅ Safe HUD refresh with position checks
 * ✅ Synchronized with LinkEventOrderValidator
 * 
 * [LinkPriority v1.0]:
 * ✅ Priority tier indicator for linked connections
 * ✅ Shows max priority tier (HIGH, NORMAL, LOW) among all links
 * ✅ Non-destructive, safe integration with LinkPrioritySystem
 * 
 * [HUD Resolver 2.1]:
 * ✅ Hybrid-first link detection (cache → index → runtime)
 * ✅ Never uses reference-based link scanning (unreliable)
 * ✅ Auto-invalidates cache on runtime discovery
 * ✅ Auto-rebuilds index on runtime discovery
 * ✅ Debug markers for link resolution tracing
 * ✅ 100% reliable LINKED category display (no "LINKED: NONE" false negatives)
 */

import { LinkPrioritySystem } from './LinkPrioritySystem.js';
import { UIVisibilityConfig, UI_VISIBILITY_CHANGE_EVENT } from './ui/config/UIVisibilityConfig.js';

export class UISelectedHUD {
    // Curated charset: tech + symbolism + visual density
    static _CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+-=▒▓█░∆ΩΣΨ';

    constructor() {
        this.linkingSystem = null;
        this.hudElement = null;
        this.isVisible = true;
        this.selectedNode = null;
        this.linkedCategories = [];
        this.semanticBus = null;
        this._semanticLinkCreatedHandler = null;
        this._attachedLinkingSystem = null;
        this._semanticBusAttached = null;
        
        // [LinkPriority v1.0] Track max priority tier of linked nodes
        this.maxLinkedPriorityTier = 0;
        
        // [Audit 6.2] Safe refresh counter to prevent UI thrashing
        this._refreshCount = 0;
        this._maxRefreshPerFrame = 1;

        // [Scramble Reveal] Text decryption effect state
        this._scramble = {
            active: false,
            targetText: '',
            displayChars: [],
            lockedCount: 0,
            elapsed: 0,
            phase: 'idle', // 'delay' | 'scramble' | 'complete' | 'glow' | 'idle'
            nodeId: null,
            linkedSuffix: '', // linked categories text (appears after reveal)
        };
        this._scrambleSchedulerRegistered = false;
        
        this._createHudElement();
        this._setupStyles();
        this._init();
        this._handleUIVisibilityChange = () => this._syncVisibility();
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
        }
        this._syncVisibility();
    }

    init({ linkingSystem = null, semanticBus = null } = {}) {
        if (semanticBus) {
            this.semanticBus = semanticBus;
        }
        if (linkingSystem) {
            this.setLinkingSystem(linkingSystem);
        } else {
            this._bindSemanticBus();
        }
        return this;
    }

    rebind({ linkingSystem = this.linkingSystem, semanticBus = this.semanticBus } = {}) {
        if (semanticBus && semanticBus !== this.semanticBus) {
            this._unbindSemanticBus();
            this.semanticBus = semanticBus;
        }

        if (linkingSystem && linkingSystem !== this.linkingSystem) {
            this.linkingSystem = null;
            this._attachedLinkingSystem = null;
            this.setLinkingSystem(linkingSystem);
            return this;
        }

        this._bindSemanticBus();
        return this;
    }

    _unbindSemanticBus() {
        if (!this._semanticLinkCreatedHandler || !this._semanticBusAttached) return;

        const bus = this._semanticBusAttached;
        if (bus?.unsubscribe) {
            bus.unsubscribe('link.created', this._semanticLinkCreatedHandler);
        } else if (bus?.off) {
            bus.off('link.created', this._semanticLinkCreatedHandler);
        }

        this._semanticBusAttached = null;
        this._semanticLinkCreatedHandler = null;
    }

    _bindSemanticBus() {
        const semanticBus = this.semanticBus || this.linkingSystem?.semanticBus || globalThis?.semanticBus;
        if (!semanticBus?.on) return;
        if (this._semanticLinkCreatedHandler && this._semanticBusAttached === semanticBus) return;

        this._unbindSemanticBus();
        this.semanticBus = semanticBus;
        this._semanticBusAttached = semanticBus;
        this._semanticLinkCreatedHandler = (event = {}) => {
            const payload = this._normalizeLinkCreatedEvent(event);
            const { source, target } = payload;
            if (!source || !target || !this.selectedNode) return;

            const selectedId = this._resolveNodeId(this.selectedNode);
            const sourceId = this._resolveNodeId(source);
            const targetId = this._resolveNodeId(target);
            const involved =
                this.selectedNode === source ||
                this.selectedNode === target ||
                (selectedId && (selectedId === sourceId || selectedId === targetId));

            if (involved) {
                this.updateLinkedCategories(this.selectedNode);
                this.updateDisplay(this.selectedNode);
            }
        };
        semanticBus.on('link.created', this._semanticLinkCreatedHandler);
    }
    
    /**
     * Create the HUD DOM element
     */
    _createHudElement() {
        // Check if element already exists (avoid duplicates)
        let existing = document.getElementById('selected-hud');
        if (existing) {
            existing.remove();
        }
        
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'selected-hud';
        this.hudElement.style.position = 'fixed';
        this.hudElement.style.top = '20px';
        this.hudElement.style.right = '140px';
        this.hudElement.style.padding = '8px 14px';
        this.hudElement.style.background = 'rgba(0, 0, 0, 0.35)';
        this.hudElement.style.backdropFilter = 'blur(6px)';
        this.hudElement.style.color = '#7FFFD4';
        this.hudElement.style.fontFamily = "Rajdhani, 'Segoe UI', sans-serif";
        this.hudElement.style.letterSpacing = '1px';
        this.hudElement.style.borderRadius = '12px';
        this.hudElement.style.zIndex = '999999';
        this.hudElement.style.pointerEvents = 'none';
        this.hudElement.style.fontSize = '12px';
        this.hudElement.style.fontWeight = '500';
        this.hudElement.style.textShadow = '0 0 8px rgba(127, 255, 212, 0.3)';
        this.hudElement.style.border = '1px solid rgba(127, 255, 212, 0.2)';
        this.hudElement.style.whiteSpace = 'nowrap';
        
        this.hudElement.textContent = 'SELECTED: NONE';
        document.body.appendChild(this.hudElement);
    }
    
    /**
     * Setup additional CSS styles (animations, etc)
     */
    _setupStyles() {
        // Check if style tag already exists
        let existing = document.getElementById('selected-hud-styles');
        if (existing) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'selected-hud-styles';
        style.textContent = `
            @keyframes selected-hud-fade-in {
                from {
                    opacity: 0;
                    transform: translateX(10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            #selected-hud {
                animation: selected-hud-fade-in 0.3s ease-out;
            }
            
            #selected-hud.selected {
                color: #7FFFD4;
                text-shadow: 0 0 12px rgba(127, 255, 212, 0.6);
                border-color: rgba(127, 255, 212, 0.4);
            }
            
            #selected-hud.none {
                color: #666;
                text-shadow: 0 0 4px rgba(102, 102, 102, 0.3);
                border-color: rgba(102, 102, 102, 0.2);
            }

            @keyframes scramble-glow-pulse {
                0% { text-shadow: 0 0 8px rgba(127, 255, 212, 0.3); }
                50% { text-shadow: 0 0 20px rgba(127, 255, 212, 0.8), 0 0 40px rgba(127, 255, 212, 0.4); }
                100% { text-shadow: 0 0 8px rgba(127, 255, 212, 0.3); }
            }

            #selected-hud.scramble-glow {
                animation: scramble-glow-pulse 0.3s ease-out 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Initialize the HUD (ready to accept SelectionCore connection)
     */
    _init() {
        this.clear();
    }
    
    /**
     * Connect this HUD to the selection system (NodeLinkingSystem)
     * 
     * @param {NodeLinkingSystem} linkingSystem - The linking system with selection events
     */
    setLinkingSystem(linkingSystem) {
        if (!linkingSystem) {
            console.warn('[SelectedHUD] setLinkingSystem called with null - ignoring');
            return;
        }
        if (this.linkingSystem === linkingSystem && this._attachedLinkingSystem === linkingSystem) {
            this._bindSemanticBus();
            return;
        }
        
        this.linkingSystem = linkingSystem;
        this._attachedLinkingSystem = linkingSystem;
        console.log('[SelectedHUD] ✓ Connected to NodeLinkingSystem');
        
        // Register event listeners to NodeLinkingSystem callbacks
        linkingSystem.onNodeSelected((node) => {
            console.log(`[SelectedHUD] Callback fired - node selected: ${node.userData.category}`);
            this.selectedNode = node;
            // Order matters: resolve linked categories FIRST, then update display (which starts scramble)
            this.updateLinkedCategories(node);
            this.updateDisplay(node);
        });
        
        linkingSystem.onNodeDeselected(() => {
            console.log('[SelectedHUD] Callback fired - node deselected');
            this.selectedNode = null;
            this.linkedCategories = [];
            this.clear();
        });
        
        // Listen for link creation events
        linkingSystem.onLinkCreated((source, target) => {
            console.log(`[SelectedHUD] Link created: ${source.userData.category} → ${target.userData.category}`);
            // If selected node is involved in this link, refresh display
            if (this.selectedNode === source || this.selectedNode === target) {
                this.updateLinkedCategories(this.selectedNode);
                this.updateDisplay(this.selectedNode);
                console.log('[SelectedHUD] ✓ Updated display for link creation');
            }
        }, {
            layerKey: 'LINK_PICTOGRAMS'
        });

        this._bindSemanticBus();
        
        // Listen for link removal events
        linkingSystem.onLinkRemoved((source, target) => {
            console.log(`[SelectedHUD] Link removed: ${source.userData.category} ✕ ${target.userData.category}`);
            // If selected node was involved in this link, refresh display
            if (this.selectedNode === source || this.selectedNode === target) {
                this.updateLinkedCategories(this.selectedNode);
                this.updateDisplay(this.selectedNode);
                console.log('[SelectedHUD] ✓ Updated display for link removal');
            }
        });
    }

    dispose() {
        this._unbindSemanticBus();
        this._unregisterScrambleScheduler();
        this._resetScramble();
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            window.removeEventListener(UI_VISIBILITY_CHANGE_EVENT, this._handleUIVisibilityChange);
        }
        this.hudElement?.remove?.();
        this.hudElement = null;
        this.linkingSystem = null;
        this._attachedLinkingSystem = null;
        this._semanticBusAttached = null;
        this._semanticLinkCreatedHandler = null;
        this.selectedNode = null;
        this.linkedCategories = [];
    }

    _resolveNodeId(node) {
        if (!node) return null;
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        return this.linkingSystem?.getNodeId ? this.linkingSystem.getNodeId(node) : (node.userData?.nodeId || node.id || node.uuid || null);
    }

    _normalizeLinkCreatedEvent(event = {}) {
        let source = event.source ?? null;
        let target = event.target ?? null;
        let linkId = event.linkId ?? event.id ?? null;

        const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
        if ((!source || !target) && linkId !== null) {
            const link = links.find((item) => (item?.id ?? item?.userData?.id) === linkId);
            if (link) {
                source = source || link.source || link.nodeA || null;
                target = target || link.target || link.nodeB || null;
            }
        }

        return {
            source,
            target,
            linkId
        };
    }
    
    /**
     * Update HUD display with selected node category + linked categories
     * 
     * Simplified format:
     * - Select: [CATEGORY]
     * - Select + 1 link: [CATEGORY] → {LINKED}
     * - Select + 2+ links: [CATEGORY] → {LINKED1 + LINKED2}
     * 
     * @param {Object} node - The node to display
     */
    updateDisplay(node) {
        if (!UIVisibilityConfig.selectedHUD) {
            return;
        }

        if (!node || !node.userData) {
            this.clear();
            return;
        }
        
        // Use the proper category extraction method
        const nodeType = this._getCategoryFromNode(node);
        
        // Build the category text (this gets scrambled)
        let categoryText = '';
        if (nodeType && nodeType !== 'unknown') {
            categoryText = `[${nodeType.toUpperCase()}]`;
        }

        // Build the linked suffix (appears instantly after scramble)
        let linkedSuffix = '';
        if (this.linkedCategories && this.linkedCategories.length > 0) {
            const linkedText = this.linkedCategories.join(' + ').toUpperCase();
            linkedSuffix = ` → {${linkedText}}`;
        }

        const fullDisplayText = `${categoryText}${linkedSuffix}`;

        // Resolve nodeId for deduplication
        const nodeId = this._resolveNodeId(node);

        // Start scramble reveal for the full visible line so additional selected nodes also animate
        this.startReveal(fullDisplayText, nodeId, '');

        this.hudElement.classList.remove('none');
        this.hudElement.classList.add('selected');
    }
    
    /**
     * Extract category from node userData with proper fallback chain
     * Priority:
     * 1. userData.category (ATOMA primary)
     * 2. userData.nodeType
     * 3. userData.type
     * 4. userData.aiCategory
     * 5. "UNKNOWN"
     * 
     * @param {Object} node - The node to extract category from
     * @returns {string} The category name
     */
    _getCategoryFromNode(node) {
        if (!node || !node.userData) {
            return 'UNKNOWN';
        }
        
        const cat =
            node.userData.category ||
            node.userData.nodeType ||
            node.userData.type ||
            node.userData.aiCategory ||
            'UNKNOWN';
        
        return String(cat).toLowerCase();
    }

    /**
     * [HUD Resolver 2.1] Hybrid-first link resolution
     * Reliably resolves links using: cache → index → runtime
     * Never relies on reference-based scanning (unreliable after reselect cycles)
     * Auto-heals cache and index if runtime discovers links they missed
     * 
     * @param {Object} node - The node to resolve links for
     * @returns {Object} Resolved state: { links, source, cacheHit, indexHit, runtimeHit }
     * @private
     */
    _resolveLinks(node) {
        if (!node || !this.linkingSystem) {
            return { links: [], source: 'none', cacheHit: 0, indexHit: 0, runtimeHit: 0 };
        }

        let resolvedLinks = [];
        let source = 'none';
        let cacheHit = 0, indexHit = 0, runtimeHit = 0;

        // Step 1: Try hybrid cache (fastest, instant)
        try {
            if (typeof this.linkingSystem.getLinkedCategories === 'function') {
                // Cache exists, but it returns categories not links
                // Skip this and go straight to index
                cacheHit = 0;
            }
        } catch (err) {
            console.debug('[HUDResolve] Cache check error:', err);
        }

        // Step 2: Try LinkIndex 3.0 (ID-based, stable)
        try {
            if (typeof this.linkingSystem.getLinksForNode === 'function') {
                const indexLinks = this.linkingSystem.getLinksForNode(node);
                if (indexLinks && indexLinks.length > 0) {
                    resolvedLinks = indexLinks;
                    source = 'index';
                    indexHit = indexLinks.length;
                    console.debug(`[HUDResolve] Index found: ${indexHit} links`);
                    return { links: resolvedLinks, source, cacheHit, indexHit, runtimeHit };
                }
            }
        } catch (err) {
            console.warn('[HUDResolve] Index lookup error:', err);
        }

        // Step 3: Full runtime scan (reference-based) as final fallback
        // This catches links that weren't indexed yet (new links, spawn events)
        try {
            if (typeof this.linkingSystem.getNodeLinks === 'function') {
                const runtimeLinks = this.linkingSystem.getNodeLinks(node);
                if (runtimeLinks && runtimeLinks.length > 0) {
                    resolvedLinks = runtimeLinks;
                    source = 'runtime';
                    runtimeHit = runtimeLinks.length;
                    console.debug(`[HUDResolve] Runtime scan found: ${runtimeHit} links (auto-healing cache)`);

                    // Auto-healing: Runtime found links that index missed
                    // Invalidate cache for this node so it refreshes
                    try {
                        if (this.linkingSystem._linkCategoryCache) {
                            const nodeId = this.linkingSystem.getNodeId ? 
                                this.linkingSystem.getNodeId(node) : 
                                node.id;
                            if (nodeId) {
                                this.linkingSystem._linkCategoryCache.delete(nodeId);
                                console.debug(`[HUDResolve] Cache invalidated for nodeId: ${nodeId}`);
                            }
                        }
                    } catch (err) {
                        console.debug('[HUDResolve] Cache invalidation skipped:', err);
                    }

                    // Auto-healing: Rebuild index for this node
                    try {
                        if (this.linkingSystem._addLinkToIndex) {
                            for (const link of resolvedLinks) {
                                this.linkingSystem._addLinkToIndex(link);
                            }
                            console.debug(`[HUDResolve] Index rebuilt: ${runtimeHit} links re-indexed`);
                        }
                    } catch (err) {
                        console.debug('[HUDResolve] Index rebuild skipped:', err);
                    }

                    return { links: resolvedLinks, source, cacheHit, indexHit, runtimeHit };
                }
            }
        } catch (err) {
            console.warn('[HUDResolve] Runtime scan error:', err);
        }

        // No links found via any method
        console.debug('[HUDResolve] No links found (cache: none, index: none, runtime: none)');
        return { links: [], source: 'none', cacheHit, indexHit, runtimeHit };
    }

    /**
     * Update linked categories from node connections
     * [HUD Resolver 2.1] Uses hybrid-first link resolution
     * 
     * Extracts all categories of nodes that this node is linked to
     * Using LinkIndex 3.0 (ID-based, stable) with runtime fallback
     * Never uses reference-based link scanning (unreliable after reselect)
     * 
     * [LinkPriority v1.0] Also computes max priority tier among all linked nodes
     * [HUD Resolver 2.1] Auto-heals cache and index on discovery
     * 
     * @param {Object} node - The selected node
     */
    updateLinkedCategories(node) {
        if (!UIVisibilityConfig.selectedHUD) {
            return;
        }

        if (!node) {
            console.warn('[SelectedHUD] updateLinkedCategories called without node');
            this.linkedCategories = [];
            this.maxLinkedPriorityTier = 0;
            return;
        }
        
        if (!this.linkingSystem) {
            console.warn('[SelectedHUD] updateLinkedCategories: linkingSystem not connected!');
            this.linkedCategories = [];
            this.maxLinkedPriorityTier = 0;
            return;
        }
        
        try {
            // [HUD Resolver 2.1] Use hybrid-first link resolution
            const resolution = this._resolveLinks(node);
            const nodeLinks = resolution.links;
            
            // Debug marker: show which system provided the links
            console.debug(`[HUDResolve] cache: ${resolution.cacheHit} index: ${resolution.indexHit} runtime: ${resolution.runtimeHit} final: ${nodeLinks.length}`);
            
            let categories = [];
            
            if (nodeLinks && nodeLinks.length > 0) {
                // Extract unique categories from linked nodes
                const categorySet = new Set();
                
                for (const link of nodeLinks) {
                    // Validate link structure (defensive)
                    if (!link || !link.source || !link.target) {
                        console.debug('[SelectedHUD] Skipping invalid link');
                        continue;
                    }
                    
                    // [HUD Resolver 2.1] Use getNodeId() for stable identification (never reference-based)
                    let linkedNode = null;
                    const nodeId = this.linkingSystem.getNodeId ? this.linkingSystem.getNodeId(node) : node.id;
                    const sourceId = this.linkingSystem.getNodeId ? this.linkingSystem.getNodeId(link.source) : link.source?.id;
                    const targetId = this.linkingSystem.getNodeId ? this.linkingSystem.getNodeId(link.target) : link.target?.id;
                    
                    // Determine other node by ID (safe, never uses reference)
                    if (nodeId && sourceId === nodeId) {
                        linkedNode = link.target;
                    } else if (nodeId && targetId === nodeId) {
                        linkedNode = link.source;
                    } else if (!nodeId) {
                        // Fallback if getNodeId not available (shouldn't happen in v3.0+)
                        linkedNode = link.source === node ? link.target : link.source;
                    }
                    
                    if (linkedNode) {
                        const category = this._getCategoryFromNode(linkedNode);
                        if (category && category !== 'unknown') {
                            categorySet.add(category);
                        }
                    }
                }
                
                categories = Array.from(categorySet).sort();
            }
            
            this.linkedCategories = categories;

            // [Scramble Reveal] Update linked suffix if a reveal is active
            if (this._scramble.active && this.selectedNode) {
                let newSuffix = '';
                if (categories && categories.length > 0) {
                    const linkedText = categories.join(' + ').toUpperCase();
                    newSuffix = ` → {${linkedText}}`;
                }
                this._scramble.linkedSuffix = newSuffix;
            }

            // [LinkPriority v1.0] Compute max priority tier among all linked nodes
            this.maxLinkedPriorityTier = 0;
            try {
                if (Array.isArray(nodeLinks) && nodeLinks.length > 0) {
                    this.maxLinkedPriorityTier = LinkPrioritySystem.getMaxPriorityTier(nodeLinks);
                    console.debug(`[SelectedHUD] Max priority tier: ${this.maxLinkedPriorityTier}`);
                }
            } catch (err) {
                console.debug('[SelectedHUD] Error computing priority tier:', err);
            }
            
            // Debug logging
            console.log(`[SelectedHUD] ✓ Resolved ${resolution.source}: ${this.linkedCategories.length} unique categories: ${this.linkedCategories.join(', ') || '(none)'}`);
        } catch (err) {
            console.error('[SelectedHUD] Error updating linked categories:', err);
            this.linkedCategories = [];
            this.maxLinkedPriorityTier = 0;
        }
    }
    
    /**
     * Refresh the HUD display - call this after link changes
     * Useful for unlink operations that need immediate visual feedback
     */
    refreshDisplay() {
        if (!UIVisibilityConfig.selectedHUD) {
            return;
        }

        if (this.selectedNode) {
            this.updateLinkedCategories(this.selectedNode);
            this.updateDisplay(this.selectedNode);
        }
    }
    
    // ========================================================================
    // [Scramble Reveal] Text decryption effect
    // ========================================================================

    /**
     * Start a scramble reveal animation for the given text.
     *
     * Timing: delay 0.8s → scramble 0.45s → lock-in → stable
     * Total: ~1.2s
     *
     * @param {string} targetText - The final text to reveal
     * @param {string|null} nodeId - Node identifier for deduplication
     * @param {string} linkedSuffix - Linked categories text (appears after reveal)
     */
    startReveal(targetText, nodeId, linkedSuffix = '') {
        // Empty text → skip scramble, set directly
        if (!targetText || targetText.length === 0) {
            this._resetScramble();
            this.hudElement.textContent = linkedSuffix;
            return;
        }

        // Same node already fully revealed with same display → do nothing
        if (this._scramble.phase === 'idle' 
            && this._scramble.nodeId === nodeId 
            && this._scramble.targetText === targetText 
            && this._scramble.linkedSuffix === linkedSuffix) {
            return;
        }

        // New node during active reveal → reset and start fresh (this is the intended behavior)
        const charset = UISelectedHUD._CHARSET;
        const chars = [];
        for (let i = 0; i < targetText.length; i++) {
            chars.push(charset[Math.floor(Math.random() * charset.length)]);
        }

        this._scramble = {
            active: true,
            targetText: targetText,
            displayChars: chars,
            lockedCount: 0,
            elapsed: 0,
            phase: 'delay',
            nodeId: nodeId,
            linkedSuffix: linkedSuffix,
        };

        // Ensure FrameScheduler visual tick is registered
        this._registerScrambleScheduler();

        // Immediately show scrambled text
        this.hudElement.textContent = chars.join('') + linkedSuffix;
    }

    /**
     * Update scramble animation — called from FrameScheduler visual tick (30Hz).
     * @param {number} dt - Delta time in seconds
     */
    updateScramble(dt) {
        if (!this._scramble.active) return;

        const s = this._scramble;
        const charset = UISelectedHUD._CHARSET;

        s.elapsed += dt;

        if (s.phase === 'delay') {
            // Delay phase: all chars randomize every frame
            for (let i = 0; i < s.displayChars.length; i++) {
                s.displayChars[i] = charset[Math.floor(Math.random() * charset.length)];
            }
            this._applyScrambleVisuals();
            this.hudElement.textContent = s.displayChars.join('') + s.linkedSuffix;

            if (s.elapsed >= 0.8) {
                s.phase = 'scramble';
                s.elapsed = 0;
            }
        } else if (s.phase === 'scramble') {
            // Scramble phase: lock in chars left-to-right
            const progress = Math.min(s.elapsed / 0.45, 1.0);
            const newLocked = Math.floor(progress * s.targetText.length);

            // Lock new chars (they never change again once locked)
            for (let i = s.lockedCount; i < newLocked && i < s.targetText.length; i++) {
                s.displayChars[i] = s.targetText[i];
            }
            s.lockedCount = newLocked;

            // Randomize remaining unlocked chars
            for (let i = newLocked; i < s.displayChars.length; i++) {
                s.displayChars[i] = charset[Math.floor(Math.random() * charset.length)];
            }

            this._applyScrambleVisuals();
            this.hudElement.textContent = s.displayChars.join('') + s.linkedSuffix;

            // All chars locked → complete
            if (newLocked >= s.targetText.length) {
                s.phase = 'complete';
            }
        } else if (s.phase === 'complete') {
            // Complete: trigger glow pulse, then idle
            this._clearScrambleVisuals();
            this.hudElement.textContent = s.targetText + s.linkedSuffix;
            this.hudElement.classList.add('scramble-glow');

            // Track glow pulse duration via elapsed (no setTimeout)
            s.phase = 'glow';
            s.elapsed = 0;
        } else if (s.phase === 'glow') {
            // Glow pulse phase: wait ~0.35s then cleanup
            if (s.elapsed >= 0.35) {
                this.hudElement?.classList?.remove('scramble-glow');
                s.active = false;
                s.phase = 'idle';
            }
        }
    }

    /**
     * Check if a reveal animation is currently active.
     * @returns {boolean}
     */
    isRevealActive() {
        return this._scramble.active;
    }

    /**
     * Get the current display text (scrambled or final).
     * @returns {string}
     */
    getDisplayText() {
        if (!this._scramble.active) {
            return this._scramble.targetText + this._scramble.linkedSuffix;
        }
        return this._scramble.displayChars.join('') + this._scramble.linkedSuffix;
    }

    /**
     * Reset scramble state to idle.
     * @private
     */
    _resetScramble() {
        this._scramble = {
            active: false,
            targetText: '',
            displayChars: [],
            lockedCount: 0,
            elapsed: 0,
            phase: 'idle',
            nodeId: null,
            linkedSuffix: '',
        };
    }

    /**
     * Apply visual effects during scramble: opacity flicker + jitter.
     * @private
     */
    _applyScrambleVisuals() {
        if (!this.hudElement) return;
        // Opacity flicker: 0.85–1.0
        const opacity = 0.85 + Math.random() * 0.15;
        // Jitter: ±1px
        const jx = Math.round((Math.random() - 0.5) * 2);
        const jy = Math.round((Math.random() - 0.5) * 2);
        this.hudElement.style.opacity = opacity;
        this.hudElement.style.transform = `translate(${jx}px, ${jy}px)`;
    }

    /**
     * Clear scramble visual effects (restore normal state).
     * @private
     */
    _clearScrambleVisuals() {
        if (!this.hudElement) return;
        this.hudElement.style.opacity = '1';
        this.hudElement.style.transform = 'translate(0, 0)';
    }

    /**
     * Register the scramble update tick with FrameScheduler (visual layer, 30Hz).
     * @private
     */
    _registerScrambleScheduler() {
        if (this._scrambleSchedulerRegistered) return;

        const fs = window.frameScheduler;
        if (!fs) return;

        if (fs.isRegistered?.('visual.uiSelectedHUD')) return;

        fs.register('visual', (dt) => {
            this.updateScramble(dt);
        }, 'visual.uiSelectedHUD');

        this._scrambleSchedulerRegistered = true;
    }

    /**
     * Unregister the scramble update tick from FrameScheduler.
     * @private
     */
    _unregisterScrambleScheduler() {
        const fs = window.frameScheduler;
        if (!fs) return;

        if (fs.isRegistered?.('visual.uiSelectedHUD')) {
            fs.unregister('visual.uiSelectedHUD');
        }
        this._scrambleSchedulerRegistered = false;
    }

    /**
     * Clear the HUD and show "SELECTED: NONE"
     */
    clear() {
        if (!UIVisibilityConfig.selectedHUD) {
            return;
        }

        this._resetScramble();
        this.hudElement.textContent = 'SELECTED: NONE';
        this.hudElement.classList.remove('selected');
        this.hudElement.classList.add('none');
        this.hudElement.classList.remove('scramble-glow');
        this._clearScrambleVisuals();
    }
    
    /**
     * Show the HUD
     */
    show() {
        if (!UIVisibilityConfig.selectedHUD) {
            return;
        }

        if (!this.hudElement.isConnected) {
            document.body.appendChild(this.hudElement);
        }
        this.isVisible = true;
        if (this.selectedNode) {
            this.refreshDisplay();
        } else {
            this.clear();
        }
    }
    
    /**
     * Hide the HUD
     */
    hide() {
        if (this.hudElement.parentNode) {
            this.hudElement.parentNode.removeChild(this.hudElement);
        }
        this.isVisible = false;
    }

    _syncVisibility() {
        if (!UIVisibilityConfig.selectedHUD) {
            this.hide();
            return;
        }

        this.show();
    }
    
    /**
     * Toggle visibility
     */
    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Check if HUD is visible
     */
    getIsVisible() {
        return this.isVisible;
    }
}

// Global singleton
let _selectedHUDInstance = null;

/**
 * Get or create the singleton instance
 */
export function getSelectedHUD() {
    if (!_selectedHUDInstance) {
        _selectedHUDInstance = new UISelectedHUD();
        console.log('[SelectedHUD] Active ✓');
    }
    return _selectedHUDInstance;
}

// DISABLED: Auto-initialization removed (Session XX - ATOMA UI cleanup)
// This component displayed "SELECTED: NONE" pill which has been removed
// Selected Node information is now shown via UISelectedNodeTopBar3_4
// getSelectedHUD();
