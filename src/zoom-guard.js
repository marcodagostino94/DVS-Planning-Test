/* Planning DVS 51: cancel native zoom, never stop application events. */
(() => {
  'use strict';
  const cancelNative = event => {
    if (event.cancelable) event.preventDefault();
  };
  const options = { capture: true, passive: false };

  // Preserve dblclick propagation: the Planning uses it to open a shift.
  document.addEventListener('dblclick', cancelNative, options);
  // Safari pinch/smart gestures; Planning retains its own scale handler.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, cancelNative, options);
  }
  document.addEventListener('touchmove', event => {
    if (event.touches.length > 1) cancelNative(event);
  }, options);
  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) cancelNative(event);
  }, options);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && ['+', '=', '-', '0'].includes(event.key)) {
      cancelNative(event);
    }
  }, options);
})();
