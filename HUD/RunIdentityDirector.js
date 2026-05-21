import {
  applySelectionToMeta,
  composeRunIdentitySelection,
  determineMilestoneUnlocks,
  getUnlockedRunPackages,
  getUnlockedWorldStates,
  isRunIdentityWorld,
  resolveInitialSelection,
  sanitizeMetaProgression
} from '../RunIdentityProfiles.js';
import { loadMenuProfile, saveMenuProfile } from '../MainMenu.js';

function resolveWorldKey(world) {
  return String(world || '').trim().toLowerCase();
}

function describeUnlock(unlock = {}) {
  if (unlock.id === 'pivot_covenant') {
    return {
      title: 'RUN PACKAGE UNLOCKED',
      detail: 'Pivot Covenant is now available. Hybrid pivots can convert dirty momentum into a cleaner hold.'
    };
  }
  if (unlock.id === 'lattice_keeper') {
    return {
      title: 'RUN PACKAGE UNLOCKED',
      detail: 'Lattice Keeper is now available. Patient stabilizer runs can now anchor your finish.'
    };
  }
  if (unlock.id === 'quantum_probability_dawn') {
    return {
      title: 'WORLD STATE UNLOCKED',
      detail: 'Probability Dawn is now available for Quantum Island.'
    };
  }
  if (unlock.id === 'desert_mirage_wake') {
    return {
      title: 'WORLD STATE UNLOCKED',
      detail: 'Mirage Wake is now available for Dream Desert.'
    };
  }
  return {
    title: 'NEW RUN IDENTITY',
    detail: 'A new run identity option is now available.'
  };
}

export class RunIdentityDirector {
  constructor({
    hud = null,
    onCommitSelection = null
  } = {}) {
    this._hud = hud || null;
    this._onCommitSelection = typeof onCommitSelection === 'function' ? onCommitSelection : null;
    this._container = null;
    this._overlayCard = null;
    this._unlockToastRoot = null;
    this._world = null;
    this._metaProgression = sanitizeMetaProgression();
    this._selection = null;
    this._activeRuntimeSelection = null;
    this._visible = false;
    this._createDOM();
  }

  bind({ hud } = {}) {
    if (hud) this._hud = hud;
    this._syncHudIdentity();
  }

  prepareWorld(world) {
    this._world = resolveWorldKey(world);
    const profile = loadMenuProfile();
    this._metaProgression = sanitizeMetaProgression(profile?.metaProgression);
    const selection = resolveInitialSelection(this._world, this._metaProgression);
    this._selection = composeRunIdentitySelection(this._world, selection);
    return this._selection;
  }

  getPreparedSelection() {
    return this._selection;
  }

  getActiveRuntimeSelection() {
    return this._activeRuntimeSelection || this._selection;
  }

  handleWorldLoad(world) {
    this._world = resolveWorldKey(world);
    if (!isRunIdentityWorld(this._world)) {
      this.hideOverlay();
      this._clearHudIdentity();
      return false;
    }

    if (!this._selection || this._selection.world !== this._world) {
      this.prepareWorld(this._world);
    }

    this.showOverlay();
    return true;
  }

  showOverlay() {
    if (!this._container || !this._overlayCard || !isRunIdentityWorld(this._world)) return false;
    this._renderOverlay();
    this._container.classList.add('visible');
    this._visible = true;
    return true;
  }

  hideOverlay() {
    if (!this._container) return;
    this._container.classList.remove('visible');
    this._visible = false;
  }

  isOverlayVisible() {
    return this._visible === true;
  }

  commitSelection(selection = this._selection) {
    if (!selection || !isRunIdentityWorld(selection.world)) return null;

    const profile = loadMenuProfile();
    const nextMeta = applySelectionToMeta(profile?.metaProgression, selection.world, selection);
    profile.metaProgression = nextMeta;
    saveMenuProfile(profile);
    this._metaProgression = nextMeta;
    this._selection = composeRunIdentitySelection(selection.world, selection);
    this._activeRuntimeSelection = this._selection;
    this._syncHudIdentity();
    this.hideOverlay();
    this._onCommitSelection?.(this._selection);
    return this._selection;
  }

  handleMilestone(milestone, world) {
    const profile = loadMenuProfile();
    const currentMeta = sanitizeMetaProgression(profile?.metaProgression);
    const result = determineMilestoneUnlocks(currentMeta, milestone, world);
    if (!result.unlocks.length) {
      return [];
    }

    const nextMeta = result.metaProgression;
    const seen = new Set(nextMeta.seenUnlocks || []);
    for (const unlock of result.unlocks) {
      if (!seen.has(unlock.id)) {
        seen.add(unlock.id);
        const copy = describeUnlock(unlock);
        this._showUnlockToast(copy.title, copy.detail);
      }
    }
    nextMeta.seenUnlocks = Array.from(seen);
    profile.metaProgression = nextMeta;
    saveMenuProfile(profile);
    this._metaProgression = nextMeta;
    return result.unlocks;
  }

  _createDOM() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('atoma-run-identity-styles')) {
      const style = document.createElement('style');
      style.id = 'atoma-run-identity-styles';
      style.textContent = `
        #atoma-run-identity-overlay {
          position: fixed;
          inset: 0;
          z-index: 2075;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 9, 16, 0.62);
          backdrop-filter: blur(14px) saturate(1.08);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }
        #atoma-run-identity-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .atoma-run-identity-card {
          width: min(760px, calc(100vw - 48px));
          background: linear-gradient(180deg, rgba(9, 14, 24, 0.95), rgba(6, 10, 18, 0.96));
          border: 1px solid rgba(94, 190, 255, 0.18);
          border-radius: 18px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.46), 0 0 24px rgba(0, 212, 255, 0.08);
          color: rgba(220, 236, 250, 0.96);
          padding: 22px 24px 20px;
        }
        .atoma-run-identity-eyebrow {
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(120, 210, 255, 0.58);
          margin-bottom: 8px;
        }
        .atoma-run-identity-title {
          font-size: 23px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #eef9ff;
          margin-bottom: 6px;
        }
        .atoma-run-identity-subtitle {
          font-size: 12px;
          letter-spacing: 0.05em;
          color: rgba(202, 222, 240, 0.72);
          margin-bottom: 18px;
          line-height: 1.5;
        }
        .atoma-run-identity-section {
          margin-top: 14px;
        }
        .atoma-run-identity-section-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(120, 210, 255, 0.5);
          margin-bottom: 10px;
        }
        .atoma-run-identity-options {
          display: grid;
          gap: 10px;
        }
        .atoma-run-identity-options.packages {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .atoma-run-identity-options.states {
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        }
        .atoma-run-identity-option {
          border: 1px solid rgba(120, 210, 255, 0.12);
          border-radius: 14px;
          background: rgba(14, 22, 34, 0.76);
          padding: 14px 14px 12px;
          cursor: pointer;
          transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }
        .atoma-run-identity-option:hover {
          border-color: rgba(120, 210, 255, 0.32);
          transform: translateY(-1px);
        }
        .atoma-run-identity-option.active {
          border-color: rgba(0, 212, 255, 0.58);
          background: rgba(10, 30, 46, 0.82);
          box-shadow: inset 0 0 0 1px rgba(0, 212, 255, 0.12), 0 0 18px rgba(0, 212, 255, 0.08);
        }
        .atoma-run-identity-option-title {
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f2fbff;
          margin-bottom: 6px;
        }
        .atoma-run-identity-option-copy {
          font-size: 11px;
          letter-spacing: 0.04em;
          line-height: 1.45;
          color: rgba(196, 214, 230, 0.72);
        }
        .atoma-run-identity-footer {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .atoma-run-identity-summary {
          font-size: 11px;
          line-height: 1.5;
          letter-spacing: 0.04em;
          color: rgba(208, 224, 240, 0.76);
          max-width: 520px;
        }
        .atoma-run-identity-confirm {
          border: 1px solid rgba(0, 212, 255, 0.42);
          border-radius: 999px;
          background: rgba(10, 28, 40, 0.96);
          color: #dff9ff;
          font: 700 12px/1 'Rajdhani', 'Segoe UI', sans-serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 12px 18px;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .atoma-run-identity-confirm:hover {
          transform: translateY(-1px);
          border-color: rgba(110, 236, 255, 0.68);
        }
        #atoma-run-identity-toast-root {
          position: fixed;
          top: 90px;
          right: 16px;
          z-index: 2080;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .atoma-run-identity-toast {
          min-width: 260px;
          max-width: 320px;
          background: rgba(10, 16, 26, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.22);
          border-radius: 12px;
          padding: 12px 14px;
          color: rgba(225, 240, 252, 0.94);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
          opacity: 0;
          transform: translateX(12px);
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .atoma-run-identity-toast.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .atoma-run-identity-toast-title {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(120, 210, 255, 0.62);
          margin-bottom: 4px;
        }
        .atoma-run-identity-toast-detail {
          font-size: 11px;
          line-height: 1.45;
          letter-spacing: 0.04em;
          color: rgba(212, 228, 242, 0.82);
        }
      `;
      document.head.appendChild(style);
    }

    this._container = document.createElement('div');
    this._container.id = 'atoma-run-identity-overlay';
    this._overlayCard = document.createElement('div');
    this._overlayCard.className = 'atoma-run-identity-card';
    this._container.appendChild(this._overlayCard);
    document.body.appendChild(this._container);

    this._unlockToastRoot = document.createElement('div');
    this._unlockToastRoot.id = 'atoma-run-identity-toast-root';
    document.body.appendChild(this._unlockToastRoot);
  }

  _renderOverlay() {
    if (!this._overlayCard || !this._selection) return;

    const packages = getUnlockedRunPackages(this._metaProgression);
    const states = getUnlockedWorldStates(this._world, this._metaProgression);
    const selection = this._selection;

    this._overlayCard.innerHTML = '';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'atoma-run-identity-eyebrow';
    eyebrow.textContent = 'Run Identity';

    const title = document.createElement('div');
    title.className = 'atoma-run-identity-title';
    title.textContent = this._world === 'desert' ? 'Shape the Dream Desert Run' : 'Shape the Quantum Island Run';

    const subtitle = document.createElement('div');
    subtitle.className = 'atoma-run-identity-subtitle';
    subtitle.textContent = this._world === 'desert'
      ? 'Choose how this stabilizer run will breathe before the dunes start answering your links.'
      : 'Choose how this stabilizer run will open before Quantum momentum starts pulling the lattice apart.';

    this._overlayCard.appendChild(eyebrow);
    this._overlayCard.appendChild(title);
    this._overlayCard.appendChild(subtitle);

    this._overlayCard.appendChild(this._buildOptionsSection('Run Package', 'packages', packages, selection.packageId, (id) => {
      this._selection = composeRunIdentitySelection(this._world, { packageId: id, worldStateId: this._selection?.worldStateId });
      this._renderOverlay();
    }));

    if (states.length > 1) {
      this._overlayCard.appendChild(this._buildOptionsSection('World State', 'states', states, selection.worldStateId, (id) => {
        this._selection = composeRunIdentitySelection(this._world, { packageId: this._selection?.packageId, worldStateId: id });
        this._renderOverlay();
      }));
    }

    const footer = document.createElement('div');
    footer.className = 'atoma-run-identity-footer';

    const summary = document.createElement('div');
    summary.className = 'atoma-run-identity-summary';
    summary.textContent = `${selection.runPackage.description} ${selection.worldState.description}`;

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'atoma-run-identity-confirm';
    confirm.textContent = 'Begin Run';
    confirm.addEventListener('click', () => {
      this.commitSelection(this._selection);
    });

    footer.appendChild(summary);
    footer.appendChild(confirm);
    this._overlayCard.appendChild(footer);
  }

  _buildOptionsSection(label, className, options, activeId, onSelect) {
    const section = document.createElement('div');
    section.className = 'atoma-run-identity-section';

    const heading = document.createElement('div');
    heading.className = 'atoma-run-identity-section-label';
    heading.textContent = label;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = `atoma-run-identity-options ${className}`;

    for (const option of options) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'atoma-run-identity-option';
      if (option.id === activeId) card.classList.add('active');

      const title = document.createElement('div');
      title.className = 'atoma-run-identity-option-title';
      title.textContent = option.label;

      const copy = document.createElement('div');
      copy.className = 'atoma-run-identity-option-copy';
      copy.textContent = option.description;

      card.appendChild(title);
      card.appendChild(copy);
      card.addEventListener('click', () => onSelect(option.id));
      grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
  }

  _showUnlockToast(title, detail) {
    if (!this._unlockToastRoot) return;

    const toast = document.createElement('div');
    toast.className = 'atoma-run-identity-toast';
    const toastTitle = document.createElement('div');
    toastTitle.className = 'atoma-run-identity-toast-title';
    toastTitle.textContent = title;
    const toastDetail = document.createElement('div');
    toastDetail.className = 'atoma-run-identity-toast-detail';
    toastDetail.textContent = detail;
    toast.appendChild(toastTitle);
    toast.appendChild(toastDetail);
    this._unlockToastRoot.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 320);
    }, 4200);
  }

  _syncHudIdentity() {
    if (!this._hud?.setRunIdentityTag) return;
    const active = this._activeRuntimeSelection || this._selection;
    if (!active) {
      this._clearHudIdentity();
      return;
    }
    this._hud.setRunIdentityTag({
      title: active.hudTitle,
      detail: active.hudDetail
    });
  }

  _clearHudIdentity() {
    this._hud?.clearRunIdentityTag?.();
  }
}
