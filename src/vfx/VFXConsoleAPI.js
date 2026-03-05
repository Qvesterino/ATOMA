/**
 * Install VFX console helpers on window.vfx
 */
export function installVFXConsoleAPI(loader) {
  if (typeof window === 'undefined') return null;
  if (!loader) {
    console.warn('[VFXConsoleAPI] Loader missing, cannot install window.vfx');
    return null;
  }

  const pickIds = (predicate) =>
    loader.list().filter(predicate).map((def) => def.id);

  const api = {
    enable: (id, opts) => loader.enable(id, opts),
    disable: (id) => loader.disable(id),
    toggle: (id) => loader.toggle(id),
    enableMany: (ids) => loader.enableMany(ids),
    disableAll: () => loader.disableAll('console'),
    list: () => loader.list(),
    status: () => loader.status(),
    presets: {
      safePack: () => loader.enableMany(pickIds((d) => d.safeLevel === 'safe')),
      linkPack: () => loader.enableMany(pickIds((d) => d.tags?.includes('link'))),
      harmonicPack: () =>
        loader.enableMany(
          pickIds(
            (d) =>
              (d.domain === 'resonance' || d.domain === 'interference') &&
              (d.tags?.includes('data-only') || d.safeLevel === 'safe')
          )
        )
    }
  };

  window.vfx = api;
  console.info('[VFXConsoleAPI] window.vfx installed', api.list?.());
  return api;
}

export default installVFXConsoleAPI;
