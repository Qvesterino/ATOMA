function getFrozenSnapshot(material) {
    return {
        transparent: material.transparent,
        blending: material.blending,
        side: material.side,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        vertexColors: material.vertexColors,
        fog: material.fog
    };
}

export function freezeMaterialConfig(material) {
    if (!material) return;
    if (typeof window === "undefined") return;
    if (!(window.DEBUG_VISUAL_MODE === true || window.__ATOMA_SHADER_FREEZE === true)) return;
    if (material.__materialFreezeGuardInstalled) return;

    const frozen = getFrozenSnapshot(material);
    Object.defineProperty(material, "__frozenConfig", {
        value: frozen,
        writable: false,
        configurable: false
    });

    const check = () => {
        const f = material.__frozenConfig;
        if (!f) return;
        if (
            material.transparent !== f.transparent ||
            material.blending !== f.blending ||
            material.side !== f.side ||
            material.depthWrite !== f.depthWrite ||
            material.depthTest !== f.depthTest ||
            material.vertexColors !== f.vertexColors ||
            material.fog !== f.fog
        ) {
            console.error("[MaterialFreeze] Material config changed!", material);
            debugger;
        }
    };

    const previousOnBeforeRender = material.onBeforeRender;
    material.onBeforeRender = function (...args) {
        check();
        if (typeof previousOnBeforeRender === "function") {
            return previousOnBeforeRender.apply(this, args);
        }
    };

    Object.defineProperty(material, "__materialFreezeGuardInstalled", {
        value: true,
        writable: false,
        configurable: false
    });
}

export function freezeMaterialConfigIfNeeded(material) {
    freezeMaterialConfig(material);
}
