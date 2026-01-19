// TEMP HARD DISABLE – renderer.render ownership belongs exclusively to FrameScheduler
export function setupVisualLockFrameHook() {
  console.warn('[VisualLockFrameHook] HARD DISABLED');
  return {};
}

export const VisualLockFrameHook = {
  setupVisualLockFrameHook
};
