
// === VFX PERFORMANCE PROFILER GLOBAL INJECTOR ===
// Add this to main.js or early in initialization

(function() {
    // Initialize profiler on window load
    window.addEventListener('load', () => {
        if (!window.__VFX_PERF_PROFILER) {
            console.log('[VFX Perf] Initializing performance profiler...');
            // Profiler will be initialized by instrumented systems
        }
    });

    // Expose profiler API globally
    window.__VFX_PERF_API = {
        getReport: () => window.__VFX_PERF_PROFILER?.getReport(),
        printReport: () => window.__VFX_PERF_PROFILER?.printReport(),
        reset: () => window.__VFX_PERF_PROFILER?.reset(),
        getSystemStats: (systemId) => window.__VFX_PERF_PROFILER?.systems[systemId]
    };

    // Keyboard shortcut: Ctrl+Shift+P to print report
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            console.log('[VFX Perf] Printing performance report...');
            window.__VFX_PERF_API.printReport();
        }
    });

    // Console command
    console.log('[VFX Perf] API available: window.__VFX_PERF_API');
    console.log('[VFX Perf] Keyboard shortcut: Ctrl+Shift+P for report');
})();
