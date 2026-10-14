// v41 TEST SAFARI 2. Natural-size layout, visual-only scaling on desktop Safari.
(() => {
  const ua = navigator.userAgent;
  const isDesktopSafari = /Macintosh/.test(ua) && /Version\/.*Safari\//.test(ua)
    && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)
    && !(navigator.maxTouchPoints > 1);
  if (!isDesktopSafari) return;

  const canvas = document.getElementById('planningCanvas');
  const grid = document.getElementById('planningGrid');
  const scroller = document.getElementById('planningScroller');
  if (!canvas || !grid || !scroller) return;

  const extent = document.createElement('div');
  extent.className = 'safari-planning-extent';
  canvas.before(extent);
  extent.append(canvas);
  document.documentElement.classList.add('safari-planning-scale');
  let scale = 1;
  let naturalWidth = 0;
  let naturalHeight = 0;

  function pinHeaders() {
    // These translations are in unscaled layout pixels. No per-cell measurements.
    canvas.style.setProperty('--safari-scroll-x', `${scroller.scrollLeft / scale}px`);
    canvas.style.setProperty('--safari-scroll-y', `${scroller.scrollTop / scale}px`);
  }

  function updateExtent() {
    if (!naturalWidth || !naturalHeight) return;
    extent.style.width = `${Math.ceil(naturalWidth * scale)}px`;
    extent.style.height = `${Math.ceil(naturalHeight * scale)}px`;
    pinHeaders();
  }

  function measure() {
    // A hidden view reports zero. Keep the last valid extent until it reopens.
    const width = grid.offsetWidth;
    const height = grid.offsetHeight;
    if (width && height) {
      naturalWidth = width;
      naturalHeight = height;
    }
    updateExtent();
  }

  window.DVSPlanningScale = {
    apply(value) {
      scale = Number.isFinite(value) && value > 0 ? value : 1;
      canvas.style.zoom = '1';
      canvas.style.transform = `scale(${scale})`;
      // Layout remains at 100%: zoom changes never rewrap or refit the text.
      measure();
    }
  };
  scroller.addEventListener('scroll', pinHeaders, { passive: true });
  // Content edits, month changes and font loading can change the natural height.
  // The observer watches the grid, not the extent it writes, avoiding feedback.
  const observer = new ResizeObserver(measure);
  observer.observe(grid);
})();
