import * as THREE from 'three';

let geometryAuditSingleton = null;

function isWarmupComplete() {
  if (typeof window === 'undefined') return false;
  return window.__ATOMA_WARMUP_COMPLETE === true || window.__shaderWarmupDone === true;
}

function readProgramCount(renderer) {
  if (!renderer?.info) return 0;
  return Array.isArray(renderer.info.programs)
    ? renderer.info.programs.length
    : (renderer.info.programs ?? 0);
}

function readMaterialRegistryStats(materialRegistry) {
  const stats = materialRegistry?.getStats?.();
  if (!stats) return null;

  return {
    created: stats.created ?? 0,
    variants: stats.variants ?? stats.variantCount ?? 0,
    templates: stats.templates ?? stats.templateCount ?? 0,
    hits: stats.hits ?? 0,
    misses: stats.misses ?? 0
  };
}

function countSceneMaterials(scene) {
  if (!scene?.traverse) {
    return {
      materials: 0,
      shaderMaterials: 0,
      meshes: 0,
      topMaterialTypes: []
    };
  }

  const uniqueMaterials = new Map();
  let meshCount = 0;
  let shaderMaterialCount = 0;

  scene.traverse((object) => {
    if (object?.isMesh) {
      meshCount += 1;
    }

    const materials = Array.isArray(object?.material)
      ? object.material
      : (object?.material ? [object.material] : null);

    if (!materials) return;

    for (const material of materials) {
      if (!material?.uuid || uniqueMaterials.has(material.uuid)) continue;
      uniqueMaterials.set(material.uuid, material.type || 'UnknownMaterial');
      if (material.isShaderMaterial || material.isRawShaderMaterial) {
        shaderMaterialCount += 1;
      }
    }
  });

  const topMaterialTypes = Array.from(uniqueMaterials.values())
    .reduce((acc, type) => {
      acc.set(type, (acc.get(type) || 0) + 1);
      return acc;
    }, new Map());

  return {
    materials: uniqueMaterials.size,
    shaderMaterials: shaderMaterialCount,
    meshes: meshCount,
    topMaterialTypes: Array.from(topMaterialTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([type, count]) => ({ type, count }))
  };
}

function normalizeGeometryStack(stack) {
  if (!stack) return [];
  return String(stack)
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes('GpuSanityPass.js'))
    .slice(0, 8);
}

function installGeometryAudit(threeNamespace, options = {}) {
  if (!threeNamespace || typeof threeNamespace !== 'object') {
    return null;
  }

  if (geometryAuditSingleton) {
    return geometryAuditSingleton;
  }

  const geometryEvents = [];
  const totals = {
    attachments: 0,
    postWarmupAttachments: 0,
    byType: Object.create(null),
    postWarmupByType: Object.create(null)
  };
  const maxEvents = Math.max(20, options.maxGeometryEvents ?? 120);
  let enabled = true;
  let captureStacks = true;
  let warnOnGeometryCreation = false;
  const seenGeometryIds = new Set();
  const originalAdd = threeNamespace.Object3D?.prototype?.add;

  if (typeof originalAdd !== 'function') {
    return null;
  }

  const pushEvent = (event) => {
    geometryEvents.push(event);
    if (geometryEvents.length > maxEvents) {
      geometryEvents.shift();
    }
  };

  const recordGeometryAttachment = (payload) => {
    const postWarmup = isWarmupComplete();
    const stack = captureStacks ? normalizeGeometryStack(new Error().stack) : [];
    const event = {
      time: performance.now(),
      ...payload,
      postWarmup,
      stack
    };

    totals.attachments += 1;
    totals.byType[payload.geometryType] = (totals.byType[payload.geometryType] || 0) + 1;
    if (postWarmup) {
      totals.postWarmupAttachments += 1;
      totals.postWarmupByType[payload.geometryType] = (totals.postWarmupByType[payload.geometryType] || 0) + 1;
      pushEvent(event);
      if (warnOnGeometryCreation) {
        console.warn('[gpuSanity] late geometry attachment detected', event);
      }
    }
  };

  const inspectObject = (object, parent) => {
    if (!object || typeof object !== 'object') return;

    if (object.__gpuSanityIgnore || object.userData?.__gpuSanityIgnore) {
      return;
    }

    const geometry = object.geometry;
    if (enabled && geometry?.uuid && !seenGeometryIds.has(geometry.uuid)) {
      seenGeometryIds.add(geometry.uuid);
      recordGeometryAttachment({
        objectType: object.type || 'Object3D',
        objectName: object.name || '',
        parentType: parent?.type || 'Object3D',
        parentName: parent?.name || '',
        geometryType: geometry.type || 'UnknownGeometry',
        geometryId: geometry.uuid,
        materialType: Array.isArray(object.material)
          ? object.material.map((material) => material?.type || 'UnknownMaterial')
          : (object.material?.type || null)
      });
    }

    if (Array.isArray(object.children) && object.children.length > 0) {
      for (const child of object.children) {
        inspectObject(child, object);
      }
    }
  };

  const patchedAdd = function (...objects) {
    const result = originalAdd.apply(this, objects);
    for (const object of objects) {
      inspectObject(object, this);
    }
    return result;
  };
  threeNamespace.Object3D.prototype.add = patchedAdd;

  const api = {
    enable() {
      enabled = true;
      return this;
    },
    disable() {
      enabled = false;
      return this;
    },
    setCaptureStacks(next = true) {
      captureStacks = !!next;
      return this;
    },
    setWarnOnGeometryCreation(next = true) {
      warnOnGeometryCreation = !!next;
      return this;
    },
    clear() {
      geometryEvents.length = 0;
      totals.postWarmupAttachments = 0;
      totals.postWarmupByType = Object.create(null);
      return this;
    },
    getRecent(limit = 20) {
      const safeLimit = Math.max(1, Math.min(maxEvents, limit | 0 || 20));
      return geometryEvents.slice(-safeLimit);
    },
    getStats() {
      return {
        enabled,
        captureStacks,
        warnOnGeometryCreation,
        hooked: true,
        totals: {
          attachments: totals.attachments,
          postWarmupAttachments: totals.postWarmupAttachments,
          seenGeometryIds: seenGeometryIds.size
        },
        recentCount: geometryEvents.length,
        postWarmupByType: Object.entries(totals.postWarmupByType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({ type, count }))
      };
    },
    restore() {
      if (threeNamespace.Object3D?.prototype?.add === patchedAdd) {
        threeNamespace.Object3D.prototype.add = originalAdd;
      }
      geometryAuditSingleton = null;
    }
  };

  geometryAuditSingleton = api;
  return geometryAuditSingleton;
}

/**
 * Lightweight GPU instrumentation (disabled by default).
 * Attach via setupGpuSanity(renderer) and use window.gpuSanity.* API.
 */
export function setupGpuSanity(renderer, options = {}) {
  if (typeof window === 'undefined') return null;
  if (!renderer || !renderer.info) return null;

  let materialRegistry = options.materialRegistry ?? null;
  const geometryAudit = options.enableGeometryAudit === true
    ? installGeometryAudit(THREE, options)
    : null;
  let includeSceneStats = options.includeSceneStats === true;

  // Reuse a single snapshot object to avoid per-frame allocations
  const snapshotCache = {
    time: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    tag: null
  };

  const peaks = { ...snapshotCache };
  let intervalId = null;
  let enabled = false;
  let renderAuditEnabled = true;
  let warnOnRenderChurn = false;
  let activeRenderAudit = null;
  const recentRenderChurn = [];
  const churnTotals = {
    detected: 0,
    programEvents: 0,
    materialEvents: 0,
    geometryEvents: 0,
    textureEvents: 0,
    lastEvent: null
  };

  const readSnapshot = () => {
    const info = renderer.info;
    const render = info.render || {};
    const memory = info.memory || {};

    snapshotCache.time = performance.now();
    snapshotCache.calls = render.calls ?? 0;
    snapshotCache.triangles = render.triangles ?? 0;
    snapshotCache.points = render.points ?? 0;
    snapshotCache.lines = render.lines ?? 0;
    snapshotCache.geometries = memory.geometries ?? 0;
    snapshotCache.textures = memory.textures ?? 0;
    snapshotCache.programs = readProgramCount(renderer);

    // Update peaks
    peaks.calls = Math.max(peaks.calls, snapshotCache.calls);
    peaks.triangles = Math.max(peaks.triangles, snapshotCache.triangles);
    peaks.points = Math.max(peaks.points, snapshotCache.points);
    peaks.lines = Math.max(peaks.lines, snapshotCache.lines);
    peaks.geometries = Math.max(peaks.geometries, snapshotCache.geometries);
    peaks.textures = Math.max(peaks.textures, snapshotCache.textures);
    peaks.programs = Math.max(peaks.programs, snapshotCache.programs);

    return { ...snapshotCache };
  };

  const logSnapshot = () => {
    if (!enabled) return;
    const snap = readSnapshot();
    console.info(
      '[gpuSanity]',
      `calls=${snap.calls}`,
      `tri=${snap.triangles}`,
      `lines=${snap.lines}`,
      `pts=${snap.points}`,
      `geo=${snap.geometries}`,
      `tex=${snap.textures}`,
      `prog=${snap.programs}`,
      snap.tag ? `tag=${snap.tag}` : ''
    );
  };

  const beginRenderAudit = (context = {}) => {
    if (!renderAuditEnabled) return null;

    activeRenderAudit = {
      context: { ...context },
      before: readSnapshot(),
      registryBefore: readMaterialRegistryStats(materialRegistry),
      startedAt: performance.now()
    };

    return activeRenderAudit;
  };

  const endRenderAudit = (context = {}) => {
    if (!renderAuditEnabled || !activeRenderAudit) return null;

    const audit = activeRenderAudit;
    activeRenderAudit = null;

    const after = readSnapshot();
    const registryAfter = readMaterialRegistryStats(context.materialRegistry ?? materialRegistry);
    const mergedContext = { ...audit.context, ...context };

    if (!isWarmupComplete()) {
      return {
        skipped: true,
        reason: 'warmup-incomplete',
        context: mergedContext
      };
    }

    const registryBefore = audit.registryBefore || {
      created: 0,
      variants: 0,
      templates: 0,
      hits: 0,
      misses: 0
    };
    const registryNow = registryAfter || registryBefore;

    const delta = {
      programs: after.programs - audit.before.programs,
      geometries: after.geometries - audit.before.geometries,
      textures: after.textures - audit.before.textures,
      registryCreated: registryNow.created - registryBefore.created,
      registryVariants: registryNow.variants - registryBefore.variants,
      registryTemplates: registryNow.templates - registryBefore.templates,
      registryMisses: registryNow.misses - registryBefore.misses
    };

    const hasChurn =
      delta.programs > 0 ||
      delta.geometries > 0 ||
      delta.textures > 0 ||
      delta.registryCreated > 0 ||
      delta.registryVariants > 0 ||
      delta.registryTemplates > 0;

    if (!hasChurn) {
      return {
        skipped: false,
        changed: false,
        context: mergedContext,
        delta
      };
    }

    const event = {
      time: performance.now(),
      frameId: mergedContext.frameId ?? null,
      mode: mergedContext.mode ?? 'render',
      status: mergedContext.status ?? 'ok',
      durationMs: performance.now() - audit.startedAt,
      before: {
        programs: audit.before.programs,
        geometries: audit.before.geometries,
        textures: audit.before.textures
      },
      after: {
        programs: after.programs,
        geometries: after.geometries,
        textures: after.textures,
        calls: after.calls,
        triangles: after.triangles
      },
      delta,
      materialRegistry: registryNow,
      scene: includeSceneStats ? countSceneMaterials(mergedContext.scene) : null
    };

    recentRenderChurn.push(event);
    if (recentRenderChurn.length > 40) {
      recentRenderChurn.shift();
    }

    churnTotals.detected += 1;
    if (delta.programs > 0) churnTotals.programEvents += 1;
    if (delta.registryCreated > 0 || delta.registryVariants > 0 || delta.registryTemplates > 0) churnTotals.materialEvents += 1;
    if (delta.geometries > 0) churnTotals.geometryEvents += 1;
    if (delta.textures > 0) churnTotals.textureEvents += 1;
    churnTotals.lastEvent = event.time;

    if (warnOnRenderChurn) {
      console.warn('[gpuSanity] post-warmup render churn detected', event);
    }

    return event;
  };

  const api = {
    enable() { enabled = true; return this; },
    disable() { enabled = false; return this; },
    snapshot() { return readSnapshot(); },
    setMaterialRegistry(nextRegistry) {
      materialRegistry = nextRegistry ?? null;
      return this;
    },
    setIncludeSceneStats(enabledFlag = true) {
      includeSceneStats = !!enabledFlag;
      return this;
    },
    geometryAudit() {
      return geometryAudit;
    },
    start(intervalMs = 2000) {
      this.enable();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(logSnapshot, intervalMs);
      return this;
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return this;
    },
    resetPeaks() {
      for (const k of Object.keys(peaks)) {
        peaks[k] = 0;
      }
      return this;
    },
    peaks() {
      return { ...peaks };
    },
    enableRenderAudit() {
      renderAuditEnabled = true;
      return this;
    },
    disableRenderAudit() {
      renderAuditEnabled = false;
      activeRenderAudit = null;
      return this;
    },
    beginRenderAudit(context = {}) {
      return beginRenderAudit(context);
    },
    endRenderAudit(context = {}) {
      return endRenderAudit(context);
    },
    setWarnOnRenderChurn(enabledFlag = true) {
      warnOnRenderChurn = !!enabledFlag;
      return this;
    },
    getRenderChurnStats() {
      return {
        enabled: renderAuditEnabled,
        warnOnRenderChurn,
        totals: { ...churnTotals },
        recentCount: recentRenderChurn.length,
        lastEvent: recentRenderChurn.length > 0 ? recentRenderChurn[recentRenderChurn.length - 1] : null
      };
    },
    getRecentRenderChurn(limit = 20) {
      const safeLimit = Math.max(1, Math.min(40, limit | 0 || 20));
      return recentRenderChurn.slice(-safeLimit);
    },
    clearRenderChurn() {
      recentRenderChurn.length = 0;
      churnTotals.detected = 0;
      churnTotals.programEvents = 0;
      churnTotals.materialEvents = 0;
      churnTotals.geometryEvents = 0;
      churnTotals.textureEvents = 0;
      churnTotals.lastEvent = null;
      return this;
    },
    getGeometryAuditStats() {
      return geometryAudit?.getStats?.() ?? null;
    },
    getRecentGeometryCreations(limit = 20) {
      return geometryAudit?.getRecent?.(limit) ?? [];
    },
    clearGeometryAudit() {
      geometryAudit?.clear?.();
      return this;
    },
    setWarnOnGeometryCreation(enabledFlag = true) {
      geometryAudit?.setWarnOnGeometryCreation?.(enabledFlag);
      return this;
    },
    annotate(tag) {
      snapshotCache.tag = tag;
      return this;
    },
    setLinkFXEnabled(enabledFlag) {
      if (window.linkFXSystem?.setEnabled) {
        window.linkFXSystem.setEnabled(!!enabledFlag);
      } else if (window.linkFXConfig && 'enabled' in window.linkFXConfig) {
        window.linkFXConfig.enabled = !!enabledFlag;
      }
      return this;
    },
    setLinkFXUpdateHz(hz) {
      if (window.linkFXSystem?.setUpdateHz) {
        window.linkFXSystem.setUpdateHz(hz);
      } else if (window.linkFXConfig && 'updateHz' in window.linkFXConfig) {
        window.linkFXConfig.updateHz = hz;
      }
      return this;
    }
  };

  window.gpuSanity = window.gpuSanity || api;
  return window.gpuSanity;
}
