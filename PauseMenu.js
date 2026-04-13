import {
    ensureMenuStyles,
    getMenuMaps,
    getSettingsRows,
    isMenuAudioMuted,
    loadContinueSnapshot,
    loadMenuProfile,
    saveContinueSnapshot,
    saveMenuProfile,
    setMenuAudioMuted,
} from './MainMenu.js';
import {
    getDefaultLoreSectionId,
    getLoreEntriesBySection,
    getLoreSectionById,
    getLoreSections,
} from './LoreRegistry.js';

const PAUSE_BUILD_LABEL = 'v0.x';

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
}

function getMenuMapById(mapId) {
    const maps = getMenuMaps();
    return maps.find((map) => map.id === mapId) || maps[0] || {
        id: 'quantum',
        footerLabel: 'Quantum Island',
        label: 'QUANTUM ISLAND',
        description: 'Probabilistic terrain with unstable gradients and uncertain silhouettes.',
    };
}

function isInteractiveTarget(target) {
    const tagName = String(target?.tagName || '').toUpperCase();
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export class PauseMenu {
    constructor({ actions = {}, buildLabel = PAUSE_BUILD_LABEL } = {}) {
        ensureMenuStyles();

        this.actions = {
            resume: () => {},
            switchWorld: () => {},
            endGame: () => {},
            ...actions,
        };
        this.buildLabel = buildLabel;
        this.profile = saveMenuProfile(loadMenuProfile());
        this.state = {
            screen: 'MAIN',
            selectedIndex: 0,
            loreSectionId: getDefaultLoreSectionId(),
        };

        this._focusableRefs = [];
        this._entryAnimationState = new Map();
        this._screenEntries = [];
        this._rafId = 0;
        this._lastFrameTime = 0;
        this._isVisible = false;

        this._handleKeyDown = (event) => this._onKeyDown(event);
        this._handleKeyUp = (event) => this._onKeyUp(event);

        this._buildDom();
        this.refresh();
        this.hide();
    }

    isVisible() {
        return this._isVisible;
    }

    show() {
        this.profile = saveMenuProfile(loadMenuProfile());
        this.state.screen = 'MAIN';
        this.state.selectedIndex = 0;
        this.refresh();

        if (!this.root.isConnected) {
            document.body.appendChild(this.root);
        }

        if (typeof document.exitPointerLock === 'function') {
            document.exitPointerLock();
        }

        if (this._isVisible) {
            return;
        }

        this._isVisible = true;
        this.root.classList.remove('is-hidden');
        document.addEventListener('keydown', this._handleKeyDown, true);
        document.addEventListener('keyup', this._handleKeyUp, true);
        this._startAnimationLoop();
    }

    hide() {
        if (!this._isVisible) {
            this.root.classList.add('is-hidden');
            return;
        }

        this._isVisible = false;
        this.root.classList.add('is-hidden');
        document.removeEventListener('keydown', this._handleKeyDown, true);
        document.removeEventListener('keyup', this._handleKeyUp, true);

        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }
    }

    dispose() {
        this.hide();
        this.root.remove();
        this._focusableRefs = [];
        this._screenEntries = [];
        this._entryAnimationState.clear();
    }

    refresh() {
        this.profile.settings.audioMuted = isMenuAudioMuted();
        this.profile = saveMenuProfile(this.profile);
        this._screenEntries = this._buildScreenEntries();

        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
        } else {
            this.state.selectedIndex = this._findSelectableIndex(this.state.selectedIndex, 1);
        }

        this._renderScreen();
        this._renderFooter();
    }

    switchScreen(screen) {
        if (this.state.screen === screen) {
            return;
        }

        this.state.screen = screen;
        if (screen === 'MAP') {
            const maps = getMenuMaps();
            this.state.selectedIndex = maps.findIndex((map) => map.id === this.profile.selectedMapId);
            if (this.state.selectedIndex < 0) {
                this.state.selectedIndex = 0;
            }
        } else {
            this.state.selectedIndex = 0;
        }

        this.refresh();
    }

    setSelectedIndex(index, { refresh = true } = {}) {
        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
            return false;
        }

        const nextIndex = clamp(index, 0, this._screenEntries.length - 1);
        if (nextIndex === this.state.selectedIndex) {
            return false;
        }

        this.state.selectedIndex = nextIndex;
        if (refresh) {
            this.refresh();
        }
        return true;
    }

    activateSelected() {
        this._activateCurrentEntry();
    }

    _buildDom() {
        this.root = document.createElement('div');
        this.root.className = 'atoma-main-menu atoma-pause-menu is-hidden';

        this.overlay = document.createElement('div');
        this.overlay.className = 'atoma-main-menu__overlay';

        this.panel = document.createElement('div');
        this.panel.className = 'atoma-main-menu__panel';

        this.hero = document.createElement('div');
        this.hero.className = 'atoma-main-menu__hero';

        this.logo = document.createElement('div');
        this.logo.className = 'atoma-main-menu__logo';

        this.title = document.createElement('div');
        this.title.className = 'atoma-main-menu__title';
        this.title.textContent = 'ATOMA';

        this.subtitle = document.createElement('div');
        this.subtitle.className = 'atoma-main-menu__subtitle';

        this.divider = document.createElement('div');
        this.divider.className = 'atoma-main-menu__divider';

        this.screenTitle = document.createElement('div');
        this.screenTitle.className = 'atoma-main-menu__screen-title';

        this.content = document.createElement('div');
        this.content.className = 'atoma-main-menu__content';

        this.description = document.createElement('div');
        this.description.className = 'atoma-main-menu__description';

        this.hint = document.createElement('div');
        this.hint.className = 'atoma-main-menu__hint';

        this.status = document.createElement('div');
        this.status.className = 'atoma-main-menu__status';

        this.footer = document.createElement('div');
        this.footer.className = 'atoma-main-menu__footer';

        this.footerWorld = document.createElement('div');
        this.footerWorld.className = 'atoma-main-menu__footer-pill';

        this.footerBuild = document.createElement('div');
        this.footerBuild.className = 'atoma-main-menu__footer-pill';

        this.hero.append(this.logo, this.title, this.subtitle);
        this.panel.append(this.hero, this.divider, this.screenTitle, this.content, this.description, this.hint, this.status, this.footer);
        this.footer.append(this.footerWorld, this.footerBuild);
        this.overlay.appendChild(this.panel);
        this.root.appendChild(this.overlay);
    }

    _buildScreenEntries() {
        if (this.state.screen === 'MAP') {
            return getMenuMaps().map((map) => ({
                id: map.id,
                label: map.label,
                meta: map.description,
                type: 'map',
                selectable: true,
            }));
        }

        if (this.state.screen === 'SETTINGS') {
            return getSettingsRows(this.profile.settings).map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: row.description,
                type: row.type || 'setting',
                selectable: row.selectable !== false,
                action: row.action || null,
            }));
        }

        if (this.state.screen === 'LORE') {
            return [];
        }

        return [
            { id: 'resume', label: 'RESUME', type: 'main', selectable: true },
            { id: 'settings', label: 'SETTINGS', type: 'main', selectable: true },
            { id: 'lore', label: 'LORE', type: 'main', selectable: true },
            { id: 'map-selection', label: 'MAP SELECT', type: 'main', selectable: true },
            { id: 'end-game', label: 'END GAME', type: 'main', selectable: true },
        ];
    }

    _renderScreen() {
        this.content.textContent = '';
        this._focusableRefs = [];
        this.loreBody = null;

        if (this.state.screen === 'MAIN') {
            this.subtitle.textContent = 'Live scene remains visible beneath the pause overlay.';
            this.screenTitle.textContent = 'GAME FROZEN';
            this.description.textContent = 'Simulation updates are paused. Resume, adjust menu-owned settings, switch worlds, or end the current run.';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  ESC TO RESUME';
            this.status.textContent = 'The active game instance stays mounted. This overlay only pauses runtime updates.';
            this._renderEntryList(this._screenEntries);
            return;
        }

        if (this.state.screen === 'MAP') {
            const selectedMap = this._getSelectedEntry();
            this.subtitle.textContent = 'Select the world that should replace the current environment.';
            this.screenTitle.textContent = 'MAP SELECT';
            this.description.textContent = selectedMap ? selectedMap.meta : '';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO SWITCH  |  ESC TO BACK';
            this.status.textContent = 'World switching stays inside the current runtime. No full reboot is performed.';
            this._renderEntryList(this._screenEntries);
            return;
        }

        if (this.state.screen === 'LORE') {
            const activeSection = this._getLoreSection();
            this.subtitle.textContent = 'System Knowledge Interface. The paused world stays visible while the archive is observed.';
            this.screenTitle.textContent = 'LORE';
            this.description.textContent = activeSection?.description || 'A structured reading layer for the reality ATOMA exposes.';
            this.hint.textContent = 'LEFT / RIGHT TO CHANGE SECTION  |  UP / DOWN TO SCROLL  |  ESC TO BACK';
            this.status.textContent = 'Lore remains read-only. Pause continues to freeze runtime updates while this panel is open.';
            this._renderLore();
            return;
        }

        const selectedSetting = this._getSelectedEntry();
        this.subtitle.textContent = 'Shared menu-owned settings, including audio mute, carried across preboot and in-game overlays.';
        this.screenTitle.textContent = 'SETTINGS';
        this.description.textContent = selectedSetting ? selectedSetting.meta : 'Audio mute and UI visibility controls persist across reloads.';
        this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  LEFT / RIGHT FOR BASE SETTINGS  |  ESC TO BACK';
        this.status.textContent = 'Sound level and mute are stored for boot. Settings stay scoped to the menu layer.';
        this._renderEntryList(this._screenEntries);
    }

    _renderEntryList(entries) {
        const list = document.createElement('div');
        list.className = 'atoma-main-menu__list';

        entries.forEach((entry, index) => {
            if (entry.type === 'section') {
                const section = document.createElement('div');
                section.className = 'atoma-main-menu__section';
                section.textContent = entry.label;
                list.appendChild(section);
                return;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'atoma-main-menu__button';
            button.dataset.entryKey = `${this.state.screen}:${entry.id}`;
            button.dataset.entryIndex = String(index);

            if (entry.type === 'setting') {
                button.classList.add('atoma-main-menu__button--setting');
            }
            if (entry.type === 'visibility' || entry.type === 'toggle') {
                button.classList.add('atoma-main-menu__button--setting', 'atoma-main-menu__button--toggle');
            }
            if (entry.type === 'map') {
                button.classList.add('atoma-main-menu__button--map');
            }

            const marker = document.createElement('span');
            marker.className = 'atoma-main-menu__marker';
            marker.textContent = '▶';

            const label = document.createElement('span');
            label.className = 'atoma-main-menu__label';
            label.textContent = entry.label;

            button.append(marker, label);

            if (entry.type === 'setting' || entry.type === 'toggle') {
                const value = document.createElement('span');
                value.className = 'atoma-main-menu__value';
                value.textContent = entry.value;
                button.appendChild(value);
            }

            if (entry.type === 'map') {
                const meta = document.createElement('span');
                meta.className = 'atoma-main-menu__meta';
                meta.textContent = entry.meta;
                button.appendChild(meta);
            }

            button.addEventListener('mouseenter', () => {
                this.setSelectedIndex(index);
            });

            button.addEventListener('click', () => {
                this.setSelectedIndex(index);
                this.activateSelected();
            });

            list.appendChild(button);
            this._focusableRefs.push({
                key: button.dataset.entryKey,
                element: button,
                marker,
                entryIndex: index,
            });
        });

        this.content.appendChild(list);
    }

    _getLoreSection() {
        return getLoreSectionById(this.state.loreSectionId) || getLoreSectionById(getDefaultLoreSectionId());
    }

    _setLoreSection(sectionId, { refresh = true } = {}) {
        const nextSection = getLoreSectionById(sectionId);
        if (!nextSection || nextSection.id === this.state.loreSectionId) {
            return false;
        }

        this.state.loreSectionId = nextSection.id;
        if (refresh) {
            this.refresh();
        }
        return true;
    }

    _cycleLoreSection(delta) {
        const sections = getLoreSections();
        if (sections.length === 0) {
            return;
        }

        const currentIndex = Math.max(0, sections.findIndex((section) => section.id === this._getLoreSection()?.id));
        const nextIndex = (currentIndex + delta + sections.length) % sections.length;
        this._setLoreSection(sections[nextIndex].id);
    }

    _renderLore() {
        const activeSection = this._getLoreSection();
        const entries = getLoreEntriesBySection(activeSection?.id);
        const featuredEntry = entries[0] || null;
        const supportingEntries = entries.slice(1);

        const panel = document.createElement('div');
        panel.className = 'atoma-main-menu__lore-panel';

        const tabs = document.createElement('div');
        tabs.className = 'atoma-main-menu__lore-tabs';

        for (const section of getLoreSections()) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'atoma-main-menu__lore-tab';
            if (section.id === activeSection?.id) {
                button.classList.add('is-active');
            }
            button.textContent = section.label;
            button.addEventListener('click', () => {
                this._setLoreSection(section.id);
            });
            tabs.appendChild(button);
        }

        this.loreBody = document.createElement('div');
        this.loreBody.className = 'atoma-main-menu__lore-body';

        const sectionCopy = document.createElement('div');
        sectionCopy.className = 'atoma-main-menu__lore-section-copy';

        const kicker = document.createElement('div');
        kicker.className = 'atoma-main-menu__lore-kicker';
        kicker.textContent = activeSection?.label || 'Lore';

        const summary = document.createElement('div');
        summary.className = 'atoma-main-menu__lore-summary';
        summary.textContent = activeSection?.description || '';

        sectionCopy.append(kicker, summary);

        const featured = document.createElement('div');
        featured.className = 'atoma-main-menu__lore-featured';

        const featuredCopy = document.createElement('div');
        featuredCopy.className = 'atoma-main-menu__lore-featured-copy';

        const featuredLabel = document.createElement('div');
        featuredLabel.className = 'atoma-main-menu__lore-featured-label';
        featuredLabel.textContent = featuredEntry ? `Featured canon / ${activeSection?.label || 'Lore'}` : 'Featured canon';

        const featuredTitle = document.createElement('div');
        featuredTitle.className = 'atoma-main-menu__lore-featured-title';
        featuredTitle.textContent = featuredEntry?.title || 'No entry available';

        const featuredSubtitle = document.createElement('div');
        featuredSubtitle.className = 'atoma-main-menu__lore-featured-subtitle';
        featuredSubtitle.textContent = featuredEntry?.subtitle || '';

        const featuredOrder = document.createElement('div');
        featuredOrder.className = 'atoma-main-menu__lore-featured-order';
        featuredOrder.textContent = activeSection?.id === 'codex' && featuredEntry?.readingOrder
            ? `Reading order: ${featuredEntry.readingOrder}`
            : '';

        const featuredSummary = document.createElement('div');
        featuredSummary.className = 'atoma-main-menu__lore-featured-summary';
        featuredSummary.textContent = featuredEntry?.summary || featuredEntry?.body || '';

        const featuredCopyParts = [featuredLabel, featuredTitle, featuredSubtitle];
        if (featuredOrder.textContent) {
            featuredCopyParts.push(featuredOrder);
        }
        featuredCopyParts.push(featuredSummary);
        featuredCopy.append(...featuredCopyParts);

        const featuredMeta = document.createElement('div');
        featuredMeta.className = 'atoma-main-menu__lore-featured-meta';

        const featuredCanon = document.createElement('div');
        featuredCanon.className = 'atoma-main-menu__lore-featured-stat';
        const featuredCanonLabel = document.createElement('div');
        featuredCanonLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredCanonLabel.textContent = 'Canon';
        const featuredCanonValue = document.createElement('div');
        featuredCanonValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredCanonValue.textContent = featuredEntry?.canon || '';
        featuredCanon.append(featuredCanonLabel, featuredCanonValue);

        const featuredMeaning = document.createElement('div');
        featuredMeaning.className = 'atoma-main-menu__lore-featured-stat';
        const featuredMeaningLabel = document.createElement('div');
        featuredMeaningLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredMeaningLabel.textContent = 'Meaning';
        const featuredMeaningValue = document.createElement('div');
        featuredMeaningValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredMeaningValue.textContent = featuredEntry?.meaning || '';
        featuredMeaning.append(featuredMeaningLabel, featuredMeaningValue);

        const featuredRelevance = document.createElement('div');
        featuredRelevance.className = 'atoma-main-menu__lore-featured-stat';
        const featuredRelevanceLabel = document.createElement('div');
        featuredRelevanceLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredRelevanceLabel.textContent = 'Relevance';
        const featuredRelevanceValue = document.createElement('div');
        featuredRelevanceValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredRelevanceValue.textContent = featuredEntry?.relevance || '';
        featuredRelevance.append(featuredRelevanceLabel, featuredRelevanceValue);

        const featuredReadingOrder = document.createElement('div');
        featuredReadingOrder.className = 'atoma-main-menu__lore-featured-stat';
        const featuredReadingOrderLabel = document.createElement('div');
        featuredReadingOrderLabel.className = 'atoma-main-menu__lore-featured-stat-label';
        featuredReadingOrderLabel.textContent = 'Reading order';
        const featuredReadingOrderValue = document.createElement('div');
        featuredReadingOrderValue.className = 'atoma-main-menu__lore-featured-stat-value';
        featuredReadingOrderValue.textContent = activeSection?.id === 'codex' ? featuredEntry?.readingOrder || '' : '';
        if (featuredReadingOrderValue.textContent) {
            featuredReadingOrder.append(featuredReadingOrderLabel, featuredReadingOrderValue);
        }

        const featuredMetaParts = [featuredCanon, featuredMeaning];
        if (featuredReadingOrderValue.textContent) {
            featuredMetaParts.push(featuredReadingOrder);
        }
        featuredMetaParts.push(featuredRelevance);
        featuredMeta.append(...featuredMetaParts);
        featured.append(featuredCopy, featuredMeta);

        const archive = document.createElement('div');
        archive.className = 'atoma-main-menu__lore-grid';

        supportingEntries.forEach((entry) => {
            const card = document.createElement('article');
            card.className = 'atoma-main-menu__lore-card';

            const title = document.createElement('div');
            title.className = 'atoma-main-menu__lore-card-title';
            title.textContent = entry.title;

            const subtitle = document.createElement('div');
            subtitle.className = 'atoma-main-menu__lore-card-subtitle';
            subtitle.textContent = entry.subtitle || '';

            const order = document.createElement('div');
            order.className = 'atoma-main-menu__lore-card-order';
            order.textContent = activeSection?.id === 'codex' && entry.readingOrder
                ? entry.readingOrder
                : '';

            const summaryBlock = document.createElement('div');
            summaryBlock.className = 'atoma-main-menu__lore-card-summary';
            summaryBlock.textContent = entry.summary || entry.body || '';

            const cardParts = [title, subtitle];
            if (order.textContent) {
                cardParts.push(order);
            }
            cardParts.push(summaryBlock);
            card.append(...cardParts);
            archive.appendChild(card);
        });

        this.loreBody.append(sectionCopy, featured, archive);
        panel.append(tabs, this.loreBody);
        this.content.appendChild(panel);
    }

    _renderFooter() {
        const map = getMenuMapById(this.profile.selectedMapId);
        this.footerWorld.textContent = `WORLD: ${map.footerLabel}`;
        this.footerBuild.textContent = `BUILD: ${this.buildLabel}`;
    }

    _getSelectedEntry() {
        return this._screenEntries[this.state.selectedIndex] || null;
    }

    _isSelectableEntry(entry) {
        return !!entry && entry.selectable !== false;
    }

    _findSelectableIndex(index, direction = 1) {
        if (this._screenEntries.length === 0) {
            return 0;
        }

        const lastIndex = this._screenEntries.length - 1;
        const clampedIndex = clamp(index, 0, lastIndex);
        if (this._isSelectableEntry(this._screenEntries[clampedIndex])) {
            return clampedIndex;
        }

        const step = direction >= 0 ? 1 : -1;
        for (let offset = 1; offset <= lastIndex; offset += 1) {
            const nextIndex = clampedIndex + (offset * step);
            if (nextIndex >= 0 && nextIndex <= lastIndex && this._isSelectableEntry(this._screenEntries[nextIndex])) {
                return nextIndex;
            }
        }

        for (let offset = 1; offset <= lastIndex; offset += 1) {
            const nextIndex = clampedIndex - (offset * step);
            if (nextIndex >= 0 && nextIndex <= lastIndex && this._isSelectableEntry(this._screenEntries[nextIndex])) {
                return nextIndex;
            }
        }

        return 0;
    }

    _moveSelection(delta) {
        if (this._screenEntries.length === 0) {
            return;
        }

        const step = delta >= 0 ? 1 : -1;
        for (let offset = 1; offset <= this._screenEntries.length; offset += 1) {
            const candidate = this.state.selectedIndex + (offset * step);
            if (candidate < 0 || candidate >= this._screenEntries.length) {
                break;
            }
            if (this._isSelectableEntry(this._screenEntries[candidate])) {
                this.setSelectedIndex(candidate);
                return;
            }
        }
    }

    _activateCurrentEntry() {
        const entry = this._getSelectedEntry();
        if (!entry) {
            return;
        }

        if (this.state.screen === 'MAIN') {
            this._activateMainEntry(entry.id);
            return;
        }

        if (this.state.screen === 'MAP') {
            this.profile.selectedMapId = entry.id;
            this.profile = saveMenuProfile(this.profile);
            saveContinueSnapshot({
                worldId: entry.id,
                selectedMapId: entry.id,
                savedAt: Date.now(),
            });
            this.actions.switchWorld({
                worldId: entry.id,
                selectedMapId: entry.id,
                settings: { ...this.profile.settings },
            });
            return;
        }

        if (entry.type === 'visibility') {
            entry.action?.();
            this.refresh();
            return;
        }

        this._cycleSetting(entry.id, 1);
    }

    _activateMainEntry(entryId) {
        switch (entryId) {
            case 'resume':
                this.actions.resume({ settings: { ...this.profile.settings } });
                return;
            case 'settings':
                this.switchScreen('SETTINGS');
                return;
            case 'lore':
                this.switchScreen('LORE');
                return;
            case 'map-selection':
                this.switchScreen('MAP');
                return;
            case 'end-game':
                this.actions.endGame({
                    selectedMapId: this.profile.selectedMapId,
                    settings: { ...this.profile.settings },
                    snapshot: loadContinueSnapshot(),
                });
                return;
            default:
                return;
        }
    }

    _cycleSetting(settingId, direction) {
        const settings = { ...this.profile.settings };
        const soundLevels = [0, 20, 40, 60, 80, 100];
        const visualLevels = ['LOW', 'MEDIUM', 'HIGH'];

        if (settingId === 'sound') {
            const currentIndex = soundLevels.indexOf(settings.soundLevel);
            const nextIndex = clamp(currentIndex + direction, 0, soundLevels.length - 1);
            settings.soundLevel = soundLevels[nextIndex];
        } else if (settingId === 'audioMuted') {
            settings.audioMuted = !settings.audioMuted;
            setMenuAudioMuted(settings.audioMuted);
        } else if (settingId === 'visuals') {
            const currentIndex = visualLevels.indexOf(settings.visuals);
            const nextIndex = (currentIndex + direction + visualLevels.length) % visualLevels.length;
            settings.visuals = visualLevels[nextIndex];
        } else if (settingId === 'particles') {
            settings.particles = !settings.particles;
        } else if (settingId === 'postProcessing') {
            settings.postProcessing = !settings.postProcessing;
            if (typeof window !== 'undefined') {
                if (window.game?.setPostProcessingEnabled) {
                    window.game.setPostProcessingEnabled(settings.postProcessing);
                } else {
                    window.__ATOMA_POSTPROCESSING_PENDING__ = settings.postProcessing;
                }
            }
        } else if (settingId === 'semanticPictograms') {
            settings.semanticPictograms = !settings.semanticPictograms;
            if (typeof window !== 'undefined') {
                if (window.game?.setSemanticPictogramsEnabled) {
                    window.game.setSemanticPictogramsEnabled(settings.semanticPictograms);
                } else {
                    window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ = settings.semanticPictograms;
                }
            }
        } else if (settingId === 'environmentalHazards') {
            settings.environmentalHazards = !settings.environmentalHazards;
            if (typeof window !== 'undefined') {
                if (window.game?.setEnvironmentalHazardsEnabled) {
                    window.game.setEnvironmentalHazardsEnabled(settings.environmentalHazards);
                } else {
                    window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__ = settings.environmentalHazards;
                }
            }
        }

        this.profile.settings = settings;
        this.profile = saveMenuProfile(this.profile);
        this.refresh();
    }

    _scrollLore(delta) {
        if (!this.loreBody) {
            return;
        }

        this.loreBody.scrollTop += delta;
    }

    setSelectedIndex(index, { refresh = true } = {}) {
        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
            return false;
        }

        const nextIndex = this._findSelectableIndex(index, index >= this.state.selectedIndex ? 1 : -1);
        if (nextIndex === this.state.selectedIndex) {
            return false;
        }

        this.state.selectedIndex = nextIndex;
        if (refresh) {
            this.refresh();
        }
        return true;
    }

    _onKeyDown(event) {
        if (!this._isVisible) {
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target)) {
            return;
        }

        event.stopImmediatePropagation();

        if (this.state.screen === 'LORE') {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                this._cycleLoreSection(1);
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this._cycleLoreSection(-1);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this._scrollLore(48);
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                this._scrollLore(-48);
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                this.switchScreen('MAIN');
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this._moveSelection(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this._moveSelection(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            this.activateSelected();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            if (this.state.screen !== 'MAIN') {
                this.switchScreen('MAIN');
                return;
            }

            this.actions.resume({ settings: { ...this.profile.settings } });
            return;
        }

        if (this.state.screen === 'SETTINGS' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            const entry = this._getSelectedEntry();
            if (!entry) {
                return;
            }

            this._cycleSetting(entry.id, event.key === 'ArrowLeft' ? -1 : 1);
        }
    }

    _onKeyUp(event) {
        if (!this._isVisible) {
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target)) {
            return;
        }

        event.stopImmediatePropagation();
    }

    _startAnimationLoop() {
        if (!this._isVisible || this._rafId) {
            return;
        }

        this._lastFrameTime = performance.now();
        this._rafId = requestAnimationFrame((time) => this._onAnimationFrame(time));
    }

    _onAnimationFrame(time) {
        this._rafId = 0;
        if (!this._isVisible) {
            return;
        }

        this._lastFrameTime = time;
        const pulse = Math.sin(time * 0.0036);

        this._updateHeroVisual(pulse);
        this._updateFocusableVisuals(pulse);

        this._rafId = requestAnimationFrame((nextTime) => this._onAnimationFrame(nextTime));
    }

    _updateHeroVisual(pulse) {
        const logoScale = 1 + pulse * 0.035;
        this.logo.style.transform = `scale(${logoScale})`;
        this.logo.style.boxShadow = `0 0 ${24 + pulse * 8}px rgba(77, 238, 255, 0.14), inset 0 0 22px rgba(212, 253, 255, 0.08)`;
    }

    _updateFocusableVisuals(pulse) {
        this._focusableRefs.forEach((ref, index) => {
            const selected = ref.entryIndex === this.state.selectedIndex;
            const targetScale = selected ? 1.08 + (pulse * 0.018) : 1;
            const targetOpacity = selected ? 1 : 0.46;
            const targetGlow = selected ? 1 : 0;
            const state = this._entryAnimationState.get(ref.key) || {
                scale: 1,
                opacity: 0.46,
                glow: 0,
            };

            state.scale = lerp(state.scale, targetScale, 0.18);
            state.opacity = lerp(state.opacity, targetOpacity, 0.16);
            state.glow = lerp(state.glow, targetGlow, 0.20);
            this._entryAnimationState.set(ref.key, state);

            ref.element.style.transform = `scale(${state.scale})`;
            ref.element.style.opacity = String(state.opacity);
            ref.element.style.borderColor = `rgba(108, 234, 255, ${0.12 + (state.glow * 0.22)})`;
            ref.element.style.background = `rgba(10, 28, 40, ${0.10 + (state.glow * 0.22)})`;
            ref.element.style.boxShadow = `0 0 ${10 + (state.glow * 18)}px rgba(90, 236, 255, ${state.glow * 0.22})`;
            ref.marker.style.opacity = selected ? '1' : '0';
            ref.element.style.textShadow = selected
                ? '0 0 18px rgba(98, 238, 255, 0.28)'
                : 'none';
        });
    }
}
