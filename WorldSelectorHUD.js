export class WorldSelectorHUD {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.containerId = 'world-selector-hud';
    this.worlds = [
      { id: 'fractal', label: 'Fractal Valley' },
      { id: 'quantum', label: 'Quantum Island' },
      { id: 'desert', label: 'Dream Desert' },
      { id: 'chamber', label: 'Aether Dunes' },
      { id: 'sigma', label: 'Sigma Rift Chamber' },
      { id: 'memory', label: 'Memory Lane' }
    ];
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = this.containerId;
    container.style.position = 'fixed';
    container.style.left = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = '9999';
    container.style.background = 'rgba(0,0,0,0.6)';
    container.style.border = '1px solid #00d8ff';
    container.style.padding = '8px';
    container.style.fontSize = '11px';
    container.style.fontFamily = 'monospace';
    container.style.minWidth = '150px';
    container.style.pointerEvents = 'auto';

    this.container = container;
    return container;
  }

  createButton(label, worldId) {
    const button = document.createElement('button');
    button.textContent = label;
    button.type = 'button';
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.margin = '0 0 4px 0';
    button.style.padding = '4px 6px';
    button.style.background = 'rgba(8, 18, 24, 0.85)';
    button.style.border = '1px solid #00d8ff';
    button.style.color = '#d9fbff';
    button.style.fontSize = '11px';
    button.style.textAlign = 'left';
    button.style.cursor = 'pointer';

    button.onmouseenter = () => {
      button.style.background = 'rgba(0, 216, 255, 0.2)';
    };
    button.onmouseleave = () => {
      button.style.background = 'rgba(8, 18, 24, 0.85)';
    };
    button.onclick = () => {
      console.log('[WORLD_SELECT]', worldId);
      if (typeof this.game.switchWorld === 'function') {
        this.game.switchWorld(worldId);
      } else {
        this.game.loadWorld(worldId);
      }
    };

    return button;
  }

  attach() {
    const existing = document.getElementById(this.containerId);
    if (existing) {
      this.container = existing;
      return;
    }

    const container = this.container || this.createContainer();

    const title = document.createElement('div');
    title.textContent = 'WORLD';
    title.style.color = '#82f5ff';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    title.style.letterSpacing = '0.08em';
    container.appendChild(title);

    for (const world of this.worlds) {
      if (world.id === 'memory' && !this.game?.worldRegistry?.memory) {
        continue;
      }
      container.appendChild(this.createButton(world.label, world.id));
    }

    document.body.appendChild(container);
  }
}
