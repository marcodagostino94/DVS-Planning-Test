// v41 TEST SAFARI 6 — experimental native zoom, whole words, fresh slot heights.
(() => {
  const ua = navigator.userAgent;
  if (!/Macintosh/.test(ua) || !/Version\/.*Safari\//.test(ua)
    || /Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)
    || navigator.maxTouchPoints > 1) return;
  const canvas = document.getElementById('planningCanvas');
  const grid = document.getElementById('planningGrid');
  if (!canvas || !grid) return;
  document.documentElement.classList.add('safari-planning-native');
  const ctx = document.createElement('canvas').getContext('2d');
  let timer = 0;
  const fields = [
    ['.shift-production',8,false],['.shift-time',12,false],
    ['.shift-film',10,true],['.shift-type',8,false],
    ['.shift-note',9,true],['.editor-name',11,false]
  ];

  function fitWholeWords() {
    if (!ctx) return;
    let pending = [];
    for (const [selector,base,wrap] of fields) {
      for (const element of grid.querySelectorAll(selector)) {
        const text = element.textContent.trim();
        element.style.fontSize = `${base}px`;
        if (text) pending.push({element,size:base,parts:wrap?text.split(/\s+/):[text]});
      }
    }
    // Batched read/write passes: no forced reflow for every 0.5px decrement.
    // Computed size is used because Safari may enlarge the requested font.
    for (let pass=0; pass<16 && pending.length; pass++) {
      const smaller = [];
      for (const item of pending) {
        const el = item.element, style = getComputedStyle(el);
        const available = el.clientWidth - (parseFloat(style.paddingLeft)||0) - (parseFloat(style.paddingRight)||0);
        if (available <= 0) continue;
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const spacing = parseFloat(style.letterSpacing)||0;
        const width = Math.max(...item.parts.map(word => ctx.measureText(word).width + Math.max(0,word.length-1)*spacing));
        if (width > available - 1 && item.size > 5) {
          item.size = Math.max(5,item.size-.5);
          smaller.push(item);
        }
      }
      for (const item of smaller) item.element.style.fontSize = `${item.size}px`;
      pending = smaller;
    }
  }

  function alignSlots() {
    const rooms = new Map();
    const slots = [...grid.querySelectorAll('.shift-time-slot')];
    grid.classList.add('native-measuring');
    for (const slot of slots) slot.style.height = 'auto';
    // Collect every natural card height after fitting text, including borders.
    for (const cell of grid.querySelectorAll('.planning-cell')) {
      const key = cell.dataset.room;
      if (!rooms.has(key)) rooms.set(key,{heights:[],slots:[],spans:[]});
      const room = rooms.get(key);
      for (const slot of cell.querySelectorAll('.shift-time-slot')) {
        const card = slot.querySelector('.shift-card, .room-block');
        const height = card ? card.offsetHeight : Number(slot.dataset.baseHeight||88);
        if (slot.classList.contains('spans-two')) room.spans.push({slot,height});
        else {
          const index = Number(slot.dataset.slotIndex||0);
          room.heights[index] = Math.max(room.heights[index]||88,height);
          room.slots.push({slot,index});
        }
      }
    }
    for (const room of rooms.values()) {
      if (room.spans.length) {
        room.heights[0] ||= 88; room.heights[1] ||= 88;
        const required = Math.max(...room.spans.map(s=>s.height));
        const extra = Math.max(0,required-room.heights[0]-room.heights[1]-5);
        room.heights[1] += extra;
      }
      for (const {slot,index} of room.slots) slot.style.height = `${Math.ceil(room.heights[index])}px`;
      for (const {slot} of room.spans) slot.style.height = `${Math.ceil(room.heights[0]+room.heights[1]+5)}px`;
    }
    grid.classList.remove('native-measuring');
  }
  function layout() {
    clearTimeout(timer); timer = 0;
    if (!grid.offsetWidth || !grid.offsetHeight || document.body.classList.contains('dvs-drag-active')) return;
    fitWholeWords();
    alignSlots();
  }
  window.DVSPlanningScale = {
    apply(value) {
      canvas.style.zoom = String(value);
      // Apply zoom immediately; batch recalculation until wheel/pinch settles.
      clearTimeout(timer);
      timer = setTimeout(layout,100);
    }
  };
  window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(layout,100);});
})();
