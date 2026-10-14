// v42. Visual scaling with browser-managed sticky header layers.
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
  function makeLayer(name) {
    const layer = document.createElement('div');
    layer.className = `safari-sticky-layer safari-${name}-layer`;
    layer.setAttribute('aria-hidden', 'true');
    extent.append(layer);
    return layer;
  }
  const days = makeLayer('days'), rooms = makeLayer('rooms'), corner = makeLayer('corner');
  let scale = 1, naturalWidth = 0, naturalHeight = 0, roomWidth = 0;
  let entries = [], dirty = true, frame = 0;

  function refreshHeaders() {
    days.replaceChildren(); rooms.replaceChildren(); corner.replaceChildren();
    entries = [];
    for (const source of grid.querySelectorAll(':scope > .corner, :scope > .day-head, :scope > .room-label, :scope > .group-row')) {
      const copy = source.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.add('safari-header-copy');
      const isCorner = source.classList.contains('corner');
      const isDay = source.classList.contains('day-head');
      (isCorner ? corner : isDay ? days : rooms).append(copy);
      entries.push({ source, copy, x:0, y:0, width:0, height:0, isCorner });
    }
    dirty = false;
  }
  function paint() {
    if (!naturalWidth || !naturalHeight) return;
    extent.style.width = `${Math.ceil(naturalWidth * scale)}px`;
    extent.style.height = `${Math.ceil(naturalHeight * scale)}px`;
    days.style.width = `${naturalWidth * scale}px`;
    rooms.style.width = corner.style.width = `${roomWidth * scale}px`;
    for (const e of entries) {
      Object.assign(e.copy.style, {
        left: `${e.x * Math.min(scale, 1)}px`, top: `${e.y * Math.min(scale, 1)}px`,
        width: `${e.width}px`, height: `${e.height}px`,
        minHeight: '0', zoom: String(Math.max(1, scale)),
        transform: scale < 1 ? `scale(${scale})` : 'none'
      });
    }
  }
  function measure() {
    frame = 0;
    if (!grid.offsetWidth || !grid.offsetHeight) return;
    if (dirty) refreshHeaders();
    naturalWidth = grid.offsetWidth; naturalHeight = grid.offsetHeight;
    // Read every natural coordinate before writing styles. No scroll listener.
    for (const e of entries) {
      e.x = e.source.offsetLeft; e.y = e.source.offsetTop;
      e.width = e.source.offsetWidth; e.height = e.source.offsetHeight;
      if (e.isCorner) roomWidth = e.width;
    }
    paint();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(measure);
  }
  window.DVSPlanningScale = {
    apply(value) {
      scale = Number.isFinite(value) && value > 0 ? value : 1;
      // Native enlargement redraws glyphs at the requested size instead of
      // stretching a 100% raster layer. Below 100%, preserve stable line wraps.
      canvas.style.zoom = String(Math.max(1, scale));
      canvas.style.transform = scale < 1 ? `scale(${scale})` : 'none';
      // Render replaces grid children before the mutation observer's microtask.
      if (!entries.length || entries[0].source.parentElement !== grid) dirty = true;
      measure();
    }
  };
  new ResizeObserver(schedule).observe(grid);
  // Also refresh same-sized months whose dates changed, without observing our clones.
  new MutationObserver(() => { dirty = true; schedule(); }).observe(grid, { childList:true });
})();
