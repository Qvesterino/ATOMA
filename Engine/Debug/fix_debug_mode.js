/**
 * FIX DEBUG MODE - Enable Visuals
 *
 * Tento script prepíše DEBUG_VISUAL_MODE pred spustením ATOMA
 * aby sa vizuálne systémy načítali správne.
 */

// 1. Nastav DEBUG_VISUAL_MODE na false
window.DEBUG_VISUAL_MODE = false;

// 2. Nastav ďalšie flagy, ktoré môžu brániť vizuálom
window.ATOMA_FLAGS = window.ATOMA_FLAGS || {};
window.ATOMA_FLAGS.safety = window.ATOMA_FLAGS.safety || {};
window.ATOMA_FLAGS.safety.disableParasiticHUDs = false;
window.ATOMA_FLAGS.safety.hardKillParasiticDOM = false;
window.ATOMA_FLAGS.safety.hardOffLanguageEngine = false;
window.ATOMA_FLAGS.safety.disableMythicRituals = false;

// 3. Log
console.log('✅ DEBUG_MODE_FIX: Flags reset to enable visuals');
console.log('   DEBUG_VISUAL_MODE = false');
console.log('   Visuals will now initialize correctly');

// 4. (Voliteľné) Auto-reload po 1 sekunde
// setTimeout(() => location.reload(), 1000);
