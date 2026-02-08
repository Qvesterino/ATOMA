export function debugLog(flag, ...args) {
    if (typeof window === 'undefined') return;
    if (!window.ATOMA_DEBUG) return;
    if (!flag) return;
    console.log(...args);
}

export function debugWarn(flag, ...args) {
    if (typeof window === 'undefined') return;
    if (!window.ATOMA_DEBUG) return;
    if (!flag) return;
    console.warn(...args);
}
