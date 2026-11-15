/**
 * Mobile Haptic Vibration feedback utilities
 * Respects iOS / Android web standards
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'double'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'double':
          navigator.vibrate([20, 50, 30]);
          break;
        case 'success':
          navigator.vibrate([30, 40, 50]);
          break;
        default:
          navigator.vibrate(25);
      }
    } catch {
      // Haptics not allowed or denied by browser policy
    }
  }
}
