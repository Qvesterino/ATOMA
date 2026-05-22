import {
    canAccessMap,
    ensureMenuStyles,
    getMenuMaps,
    getSettingsRows,
    SETTING_FEEDBACK_STATE,
    isMenuDevMapUnlockEnabled,
    isMenuAudioMuted,
    loadContinueSnapshot,
    loadMenuProfile,
    resolvePublicSelectedMapId,
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
import { ATOMA_VERSION } from './src/config/version.js';

const PAUSE_BUILD_LABEL = ATOMA_VERSION;

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
        const profile = loadMenuProfile();
        const devUnlock = isMenuDevMapUnlockEnabled();

        this.actions = {
            resume: () => {},
            switchWorld: () => {},
            endGame: () => {},
            ...actions,
        };
        this.buildLabel = buildLabel;
        this.profile = saveMenuProfile({
            ...profile,
            selectedMapId: resolvePublicSelectedMapId(profile.selectedMapId, { devUnlock }),
        });
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
        this._transitionLocked = false;
        this._settingFeedback = new Map();
        this._settingFeedbackTimers = new Map();

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
        this._settingFeedbackTimers.forEach((handle) => clearTimeout(handle));
        this._settingFeedbackTimers.clear();
        this._settingFeedback.clear();
    }

    refresh() {
        const devUnlock = isMenuDevMapUnlockEnabled();
        this.profile.settings.audioMuted = isMenuAudioMuted();
        this.profile.selectedMapId = resolvePublicSelectedMapId(this.profile.selectedMapId, { devUnlock });
        this.profile = saveMenuProfile(this.profile);
        this._screenEntries = this._buildScreenEntries();

        if (this._screenEntries.length === 0) {
            this.state.selectedIndex = 0;
        } else {
            this.state.selectedIndex = this._findSelectableIndex(this.state.selectedIndex, 1);
        }

        this._renderScreen();
        this._scrollSelectedEntryIntoView();
        this._renderFooter();
    }

    _setSettingFeedback(settingId, state, detail = '', { persistMs = 0 } = {}) {
        if (!settingId) return;
        const existingTimer = this._settingFeedbackTimers.get(settingId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this._settingFeedbackTimers.delete(settingId);
        }

        this._settingFeedback.set(settingId, {
            state,
            detail: String(detail || '').trim(),
        });

        if (persistMs > 0) {
            const handle = setTimeout(() => {
                this._settingFeedback.delete(settingId);
                this._settingFeedbackTimers.delete(settingId);
                if (this.state.screen === 'SETTINGS') {
                    this.refresh();
                }
            }, persistMs);
            this._settingFeedbackTimers.set(settingId, handle);
        }
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

    async activateSelected() {
        if (this._transitionLocked) {
            return;
        }

        try {
            await this._activateCurrentEntry();
        } catch (error) {
            console.warn('[PauseMenu] activateSelected failed:', error);
        }
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

        // Pause badge
        this.pauseBadge = document.createElement('div');
        this.pauseBadge.className = 'atoma-main-menu__pause-badge';
        const pauseDot = document.createElement('span');
        pauseDot.className = 'atoma-main-menu__pause-badge-dot';
        this.pauseBadge.appendChild(pauseDot);
        this.pauseBadge.appendChild(document.createTextNode('SIMULATION PAUSED'));

        // Pause status bar
        this.pauseStatus = document.createElement('div');
        this.pauseStatus.className = 'atoma-main-menu__pause-status';
        const statusPaused = document.createElement('div');
        statusPaused.className = 'atoma-main-menu__pause-status-item';
        statusPaused.innerHTML = '<span class="atoma-main-menu__pause-status-dot atoma-main-menu__pause-status-dot--paused"></span><span style="color:rgba(255,130,175,0.80)">Simulation frozen</span>';
        const statusAlive = document.createElement('div');
        statusAlive.className = 'atoma-main-menu__pause-status-item';
        statusAlive.innerHTML = '<span class="atoma-main-menu__pause-status-dot atoma-main-menu__pause-status-dot--alive"></span><span style="color:rgba(0,229,160,0.80)">Visuals alive</span>';
        this.pauseStatus.append(statusPaused, statusAlive);

        this.hero.append(this.logo, this.title, this.subtitle);
        this.panel.append(this.pauseBadge, this.hero, this.divider, this.screenTitle, this.content, this.description, this.hint, this.status, this.pauseStatus, this.footer);
        this.footer.append(this.footerWorld, this.footerBuild);
        this.overlay.appendChild(this.panel);
        this.root.appendChild(this.overlay);
    }

    _buildScreenEntries() {
        if (this.state.screen === 'MAP') {
            const devUnlock = isMenuDevMapUnlockEnabled();
            return getMenuMaps().map((map) => ({
                id: map.id,
                label: map.label,
                meta: map.description,
                type: 'map',
                selectable: canAccessMap(map.id, { devUnlock }),
                releaseState: map.releaseState,
                releaseLabel: map.releaseLabel || '',
                publicLocked: map.releaseState === 'coming-soon',
                mapData: map,
            }));
        }

        if (this.state.screen === 'SETTINGS') {
            return getSettingsRows(this.profile.settings, this._settingFeedback).map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: row.description,
                feedbackLabel: row.feedbackLabel || '',
                feedbackTone: row.feedbackTone || '',
                feedbackDetail: row.feedbackDetail || '',
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
        this.content.classList.toggle('atoma-main-menu__content--scrollable', this.state.screen === 'SETTINGS');
        this._focusableRefs = [];
        this.loreBody = null;

        if (this.state.screen === 'MAIN') {
            this.subtitle.textContent = 'The field is paused, but the world is still visible. Step out only long enough to regain rhythm.';
            this.screenTitle.textContent = 'PAUSED';
            this.description.textContent = 'Resume the field, tune presentation, switch worlds, or end the current run without losing menu coherence.';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  ESC TO RESUME';
            this.status.textContent = 'ESC returns directly to the simulation. Submenus back out one layer at a time.';
            this._renderEntryList(this._screenEntries);
            return;
        }

        if (this.state.screen === 'MAP') {
            this.subtitle.textContent = 'Switch the active world without leaving the runtime.';
            this.screenTitle.textContent = 'SWITCH WORLD';
            this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO SWITCH  |  ESC TO BACK';
            this.status.textContent = isMenuDevMapUnlockEnabled()
                ? 'Dev unlock is active. Coming-soon worlds remain visible and can be switched into locally.'
                : 'Only released worlds can be switched into. Coming-soon worlds remain visible but public-locked.';
            this._renderWorldCards();
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
        this.subtitle.textContent = 'The same menu-owned settings layer follows you into the paused runtime.';
        this.screenTitle.textContent = 'SETTINGS';
        this.description.textContent = selectedSetting ? selectedSetting.meta : 'Audio mute and UI visibility controls persist across reloads.';
        this.hint.textContent = 'UP / DOWN TO SELECT  |  ENTER TO ACTIVATE  |  LEFT / RIGHT FOR BASE SETTINGS  |  ESC TO BACK';
        this.status.textContent = selectedSetting?.feedbackDetail
            ? `Setting status / ${selectedSetting.feedbackDetail}`
            : 'Settings show whether a change is live, pending, or still transitioning through the runtime.';
        this._renderEntryList(this._screenEntries);
    }

    _scrollSelectedEntryIntoView() {
        if (this.state.screen !== 'SETTINGS' || !this.content.classList.contains('atoma-main-menu__content--scrollable')) {
            return;
        }

        const selectedRef = this._focusableRefs.find((ref) => ref.entryIndex === this.state.selectedIndex);
        if (!selectedRef?.element?.scrollIntoView) {
            return;
        }

        try {
            selectedRef.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } catch {
            // Ignore scroll failures in non-standard DOM environments.
        }
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
            if (index === this.state.selectedIndex) {
                button.classList.add('is-selected');
            }

            const marker = document.createElement('span');
            marker.className = 'atoma-main-menu__marker';
            marker.textContent = '▶';

            const label = document.createElement('span');
            label.className = 'atoma-main-menu__label';
            label.textContent = entry.label;

            button.append(marker, label);

            if (entry.type === 'setting' || entry.type === 'toggle' || entry.type === 'visibility') {
                const value = document.createElement('span');
                value.className = 'atoma-main-menu__value';
                value.textContent = entry.value;
                button.appendChild(value);

                if (entry.feedbackLabel) {
                    const feedback = document.createElement('span');
                    feedback.className = `atoma-main-menu__setting-feedback atoma-main-menu__setting-feedback--${entry.feedbackTone || 'applied'}`;
                    feedback.textContent = entry.feedbackLabel;
                    button.appendChild(feedback);
                }
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
                void this.activateSelected();
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

    _renderWorldCards() {
        const RISK_LEVELS = { calm: 15, low: 30, moderate: 55, extreme: 90 };
        const PROSPERITY_LEVELS = { low: 25, moderate: 50, high: 75, extreme: 95 };

        const grid = document.createElement('div');
        grid.className = 'atoma-main-menu__world-cards';

        this._screenEntries.forEach((entry, index) => {
            const map = entry?.mapData;
            if (!map) return;
            const isSelected = index === this.state.selectedIndex;
            const card = document.createElement('div');
            card.className = 'atoma-main-menu__world-card';
            if (isSelected) {
                card.classList.add('is-selected');
            }
            if (!entry.selectable) {
                card.classList.add('is-locked');
                card.setAttribute('aria-disabled', 'true');
            }
            card.style.setProperty('--world-accent', `rgba(${map.accentRgb}, 0.6)`);
            card.dataset.entryKey = `MAP:${map.id}`;
            card.dataset.entryIndex = String(index);

            const header = document.createElement('div');
            header.className = 'atoma-main-menu__world-card-header';

            const name = document.createElement('div');
            name.className = 'atoma-main-menu__world-card-name';
            name.textContent = map.label;

            const badges = document.createElement('div');
            badges.className = 'atoma-main-menu__world-card-badges';

            const riskBadge = document.createElement('div');
            riskBadge.className = `atoma-main-menu__world-card-risk atoma-main-menu__world-card-risk--${map.risk}`;
            riskBadge.textContent = map.risk.toUpperCase();
            badges.appendChild(riskBadge);

            if (entry.publicLocked) {
                const releaseBadge = document.createElement('div');
                releaseBadge.className = 'atoma-main-menu__world-card-release atoma-main-menu__world-card-release--coming-soon';
                releaseBadge.textContent = map.releaseLabel || 'COMING SOON';
                badges.appendChild(releaseBadge);
            }

            header.append(name, badges);

            const tagline = document.createElement('div');
            tagline.className = 'atoma-main-menu__world-card-tagline';
            tagline.textContent = map.tagline;

            const fantasy = document.createElement('div');
            fantasy.className = 'atoma-main-menu__world-card-fantasy';
            fantasy.textContent = map.fantasy;

            const moodContainer = document.createElement('div');
            moodContainer.className = 'atoma-main-menu__world-card-mood';
            for (const mood of map.mood) {
                const tag = document.createElement('span');
                tag.className = 'atoma-main-menu__world-card-mood-tag';
                tag.textContent = mood;
                moodContainer.appendChild(tag);
            }

            const bars = document.createElement('div');
            bars.className = 'atoma-main-menu__world-card-bars';

            const riskGroup = document.createElement('div');
            riskGroup.className = 'atoma-main-menu__world-card-bar-group';
            const riskLabel = document.createElement('div');
            riskLabel.className = 'atoma-main-menu__world-card-bar-label';
            riskLabel.textContent = 'RISK';
            const riskTrack = document.createElement('div');
            riskTrack.className = 'atoma-main-menu__world-card-bar-track';
            const riskFill = document.createElement('div');
            riskFill.className = 'atoma-main-menu__world-card-bar-fill atoma-main-menu__world-card-bar-fill--risk';
            riskFill.style.width = `${RISK_LEVELS[map.risk] || 30}%`;
            riskTrack.appendChild(riskFill);
            riskGroup.append(riskLabel, riskTrack);

            const propGroup = document.createElement('div');
            propGroup.className = 'atoma-main-menu__world-card-bar-group';
            const propLabel = document.createElement('div');
            propLabel.className = 'atoma-main-menu__world-card-bar-label';
            propLabel.textContent = 'PROSPERITY';
            const propTrack = document.createElement('div');
            propTrack.className = 'atoma-main-menu__world-card-bar-track';
            const propFill = document.createElement('div');
            propFill.className = 'atoma-main-menu__world-card-bar-fill atoma-main-menu__world-card-bar-fill--prosperity';
            propFill.style.width = `${PROSPERITY_LEVELS[map.prosperity] || 50}%`;
            propTrack.appendChild(propFill);
            propGroup.append(propLabel, propTrack);

            bars.append(riskGroup, propGroup);
            card.append(header, tagline, fantasy, moodContainer, bars);

            if (entry.selectable) {
                card.addEventListener('mouseenter', () => {
                    this.setSelectedIndex(index);
                });
                card.addEventListener('click', () => {
                    this.setSelectedIndex(index);
                    void this.activateSelected();
                });
            }

            grid.appendChild(card);
            this._focusableRefs.push({
                key: card.dataset.entryKey,
                element: card,
                marker: { style: {} },
                entryIndex: index,
            });
        });

        const selectedEntry = this._getSelectedEntry();
        if (selectedEntry?.mapData) {
            const map = selectedEntry.mapData;
            const preview = document.createElement('div');
            preview.className = 'atoma-main-menu__map-preview';
            const previewTagline = document.createElement('div');
            previewTagline.className = 'atoma-main-menu__map-preview-tagline';
            previewTagline.textContent = map.tagline;
            const previewDesc = document.createElement('div');
            previewDesc.className = 'atoma-main-menu__map-preview-description';
            previewDesc.textContent = map.description;
            preview.append(previewTagline, previewDesc);
            this.description.textContent = '';
            this.content.append(grid, preview);
        } else {
            this.content.appendChild(grid);
        }
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

    async _activateCurrentEntry() {
        const entry = this._getSelectedEntry();
        if (!entry) {
            return;
        }

        if (this.state.screen === 'MAIN') {
            this._activateMainEntry(entry.id);
            return;
        }

        if (this.state.screen === 'MAP') {
            const nextWorldId = resolvePublicSelectedMapId(entry.id);
            if (!canAccessMap(entry.id)) {
                this.profile.selectedMapId = nextWorldId;
                this.profile = saveMenuProfile(this.profile);
                this.refresh();
                return;
            }

            this.profile.selectedMapId = nextWorldId;
            this.profile = saveMenuProfile(this.profile);
            saveContinueSnapshot({
                worldId: nextWorldId,
                selectedMapId: nextWorldId,
                savedAt: Date.now(),
            });
            this.actions.switchWorld({
                worldId: nextWorldId,
                selectedMapId: nextWorldId,
                settings: { ...this.profile.settings },
            });
            return;
        }

        if (entry.type === 'visibility') {
            entry.action?.();
            this.refresh();
            return;
        }

        await this._cycleSetting(entry.id, 1);
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

    async _cycleSetting(settingId, direction) {
        if (this._transitionLocked) {
            return;
        }

        const settings = { ...this.profile.settings };
        const soundLevels = [0, 20, 40, 60, 80, 100];
        const visualLevels = ['LOW', 'MEDIUM', 'HIGH'];
        let transitionPromise = null;

        if (settingId === 'sound') {
            const currentIndex = soundLevels.indexOf(settings.soundLevel);
            const nextIndex = clamp(currentIndex + direction, 0, soundLevels.length - 1);
            settings.soundLevel = soundLevels[nextIndex];
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, 'Stored for boot and future session starts.', { persistMs: 1600 });
        } else if (settingId === 'audioMuted') {
            settings.audioMuted = !settings.audioMuted;
            setMenuAudioMuted(settings.audioMuted);
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.audioMuted ? 'All ATOMA audio is muted now.' : 'All ATOMA audio is live again.', { persistMs: 1800 });
        } else if (settingId === 'visuals') {
            const currentIndex = visualLevels.indexOf(settings.visuals);
            const nextIndex = (currentIndex + direction + visualLevels.length) % visualLevels.length;
            settings.visuals = visualLevels[nextIndex];
            if (typeof window !== 'undefined') {
                if (window.game?.setVisualQuality) {
                    window.game.setVisualQuality(settings.visuals);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, `Live quality switched to ${settings.visuals}.`, { persistMs: 1600 });
                } else {
                    window.__ATOMA_VISUAL_QUALITY_PENDING__ = settings.visuals;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, `Queued ${settings.visuals} quality for the next active runtime.`);
                }
            }
        } else if (settingId === 'particles') {
            settings.particles = !settings.particles;
            this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.particles ? 'Ambient particles are active.' : 'Ambient particles are suppressed.', { persistMs: 1600 });
        } else if (settingId === 'postProcessing') {
            settings.postProcessing = !settings.postProcessing;
            if (typeof window !== 'undefined') {
                if (window.game?.setPostProcessingEnabled) {
                    transitionPromise = window.game.setPostProcessingEnabled(settings.postProcessing);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.TRANSITIONING, 'Applying the composite grading stack.');
                } else {
                    window.__ATOMA_POSTPROCESSING_PENDING__ = settings.postProcessing;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Post-processing preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'luminosityBloom') {
            settings.luminosityBloom = !settings.luminosityBloom;
            if (typeof window !== 'undefined') {
                if (window.game?.setLuminosityBloomEnabled) {
                    transitionPromise = window.game.setLuminosityBloomEnabled(settings.luminosityBloom);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.TRANSITIONING, 'Applying the luminosity bloom layer.');
                } else {
                    window.__ATOMA_LUMINOSITY_BLOOM_PENDING__ = settings.luminosityBloom;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Bloom preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'nodeRotations') {
            settings.nodeRotations = !settings.nodeRotations;
            if (typeof window !== 'undefined') {
                if (window.game?.setNodeRotationsEnabled) {
                    window.game.setNodeRotationsEnabled(settings.nodeRotations);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.nodeRotations ? 'Node motion is active.' : 'Node motion is restrained.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_NODE_ROTATIONS_PENDING__ = settings.nodeRotations;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Node motion preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'semanticPictograms') {
            settings.semanticPictograms = !settings.semanticPictograms;
            if (typeof window !== 'undefined') {
                if (window.game?.setSemanticPictogramsEnabled) {
                    window.game.setSemanticPictogramsEnabled(settings.semanticPictograms);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.semanticPictograms ? 'Semantic pictograms are visible.' : 'Semantic pictograms are hidden.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_SEMANTIC_PICTOGRAMS_PENDING__ = settings.semanticPictograms;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Semantic pictogram preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'environmentalHazards') {
            settings.environmentalHazards = !settings.environmentalHazards;
            if (typeof window !== 'undefined') {
                if (window.game?.setEnvironmentalHazardsEnabled) {
                    window.game.setEnvironmentalHazardsEnabled(settings.environmentalHazards);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.environmentalHazards ? 'Environmental hazard pressure is visible.' : 'Environmental hazard pressure is visually suppressed.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_ENVIRONMENTAL_HAZARDS_PENDING__ = settings.environmentalHazards;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Hazard preference stored for the next active runtime.');
                }
            }
        } else if (settingId === 'cinematicNodeShaders') {
            settings.cinematicNodeShaders = !settings.cinematicNodeShaders;
            if (typeof window !== 'undefined') {
                if (window.game?.setCinematicNodeShadersEnabled) {
                    window.game.setCinematicNodeShadersEnabled(settings.cinematicNodeShaders);
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, settings.cinematicNodeShaders ? 'Premium node shading is active.' : 'Premium node shading is restrained.', { persistMs: 1600 });
                } else {
                    window.__ATOMA_CINEMATIC_NODE_SHADERS_PENDING__ = settings.cinematicNodeShaders;
                    this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Node shader preference stored for the next active runtime.');
                }
            }
        }

        this.profile.settings = settings;
        this.profile = saveMenuProfile(this.profile);
        if (transitionPromise && typeof transitionPromise.then === 'function') {
            this._transitionLocked = true;
            this.refresh();
            try {
                await transitionPromise;
                this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.APPLIED, 'Live runtime confirmed the transition.', { persistMs: 1800 });
            } catch (error) {
                console.warn('[PauseMenu] setting transition failed:', error);
                this._setSettingFeedback(settingId, SETTING_FEEDBACK_STATE.PENDING, 'Runtime did not confirm the transition. Preference is still stored.');
            } finally {
                this._transitionLocked = false;
                this.refresh();
            }
            return;
        }

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

        if (this._transitionLocked) {
            event.preventDefault();
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
            void this.activateSelected();
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

            void this._cycleSetting(entry.id, event.key === 'ArrowLeft' ? -1 : 1);
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
            const isWorldCard = ref.element.classList.contains('atoma-main-menu__world-card');
            const targetScale = selected ? (isWorldCard ? 1.02 : 1.08 + (pulse * 0.018)) : 1;
            const targetOpacity = selected ? 1 : (isWorldCard ? 0.55 : 0.46);
            const targetGlow = selected ? 1 : 0;
            const state = this._entryAnimationState.get(ref.key) || {
                scale: 1,
                opacity: isWorldCard ? 0.55 : 0.46,
                glow: 0,
            };

            state.scale = lerp(state.scale, targetScale, 0.18);
            state.opacity = lerp(state.opacity, targetOpacity, 0.16);
            state.glow = lerp(state.glow, targetGlow, 0.20);
            this._entryAnimationState.set(ref.key, state);

            ref.element.style.transform = `scale(${state.scale})`;
            ref.element.style.opacity = String(state.opacity);

            if (isWorldCard) {
                if (selected) {
                    ref.element.classList.add('is-selected');
                } else {
                    ref.element.classList.remove('is-selected');
                }
            } else {
                ref.element.style.borderColor = `rgba(108, 234, 255, ${0.12 + (state.glow * 0.22)})`;
                ref.element.style.background = `rgba(10, 28, 40, ${0.10 + (state.glow * 0.22)})`;
                ref.element.style.boxShadow = `0 0 ${10 + (state.glow * 18)}px rgba(90, 236, 255, ${state.glow * 0.22})`;
                if (ref.marker?.style) {
                    ref.marker.style.opacity = selected ? '1' : '0';
                }
                ref.element.style.textShadow = selected
                    ? '0 0 18px rgba(98, 238, 255, 0.28)'
                    : 'none';
            }
        });
    }
}
