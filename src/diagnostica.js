/* Misure solo su richiesta. Non legge configurazione, credenziali o dati del database. */
(()=>{
 const button=document.createElement('button');
 button.type='button';button.className='toolbar-btn';button.textContent='Diagnostica';button.id='layoutDiagnosticButton';
 document.getElementById('todayBtn').parentElement.append(button);
 const rounded=n=>Math.round(n*1000)/1000;
 function measure(el){
  if(!el)return null;
  const r=el.getBoundingClientRect(),s=getComputedStyle(el);
  const props=['display','position','boxSizing','width','height','minWidth','minHeight','maxHeight','padding','margin','gap','rowGap','columnGap','gridTemplateRows','gridTemplateColumns','alignItems','alignSelf','justifyContent','flex','flexShrink','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','whiteSpace','overflow','overflowX','overflowY','overflowWrap','wordBreak','zoom','transform','textSizeAdjust','webkitTextSizeAdjust'];
  return {rect:Object.fromEntries(['x','y','width','height','top','bottom','left','right'].map(k=>[k,rounded(r[k])])),client:[el.clientWidth,el.clientHeight],offset:[el.offsetWidth,el.offsetHeight],scroll:[el.scrollWidth,el.scrollHeight],inlineStyle:el.getAttribute('style'),computed:Object.fromEntries(props.map(k=>[k,s[k]||'']))};
 }
 function textMeasure(el){
  if(!el)return null;
  const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();
  return {element:measure(el),characters:el.textContent.length,textRect:{width:rounded(r.width),height:rounded(r.height)},lineRects:[...range.getClientRects()].slice(0,16).map(x=>({width:rounded(x.width),height:rounded(x.height)}))};
 }
 button.onclick=()=>{
  const scroller=document.getElementById('planningScroller'),grid=document.getElementById('planningGrid');
  const v=scroller.getBoundingClientRect();
  const cells=[...grid.querySelectorAll('.planning-cell')];
  const visible=el=>{const r=el.getBoundingClientRect();return r.right>v.left&&r.left<v.right&&r.bottom>v.top&&r.top<v.bottom;};
  // Coordinate sala/data per confrontare gli stessi elementi; nessun nome o nota esportato.
  const chosen=cells.filter(visible).slice(0,100);
  const report={build:'v41 TEST SAFARI 5',timestamp:new Date().toISOString(),userAgent:navigator.userAgent,platform:navigator.platform,devicePixelRatio,viewport:{width:innerWidth,height:innerHeight,scale:window.visualViewport?.scale,visualWidth:window.visualViewport?.width,visualHeight:window.visualViewport?.height},zoomSelected:document.getElementById('zoomSelect').value,effectiveZoom:planningZoom,scaleMode:window.DVSPlanningScale?(planningZoom<1?'transform-reduction':'native-enlargement'):'css-zoom',htmlClasses:document.documentElement.className,bodyClasses:document.body.className,fontsStatus:document.fonts?.status,scroll:{left:scroller.scrollLeft,top:scroller.scrollTop},scroller:measure(scroller),canvas:measure(document.getElementById('planningCanvas')),grid:measure(grid),stickyLayers:[...document.querySelectorAll('.safari-sticky-layer')].map(el=>({className:el.className,box:measure(el),samples:[...el.children].slice(0,3).map(measure)})),totalCells:cells.length,totalCards:grid.querySelectorAll('.shift-card').length,cells:chosen.map(cell=>({room:cell.dataset.room,date:cell.dataset.date,box:measure(cell),slots:[...cell.querySelectorAll('.shift-time-slot')].map(slot=>({index:slot.dataset.slotIndex,span:slot.dataset.spanSlots,baseHeight:slot.dataset.baseHeight,box:measure(slot),card:measure(slot.querySelector('.shift-card,.room-block')),main:measure(slot.querySelector('.shift-main')),footer:measure(slot.querySelector('.shift-editor')),texts:Object.fromEntries(['shift-production','shift-time','shift-film','shift-type','shift-note','editor-name'].map(c=>[c,textMeasure(slot.querySelector('.'+c))]))}))}))};
  const browser=/Chrome|Chromium|Edg/.test(navigator.userAgent)?'Chrome':/Safari/.test(navigator.userAgent)?'Safari':'Browser';
  const zoom=Math.round(planningZoom*100);
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`Planning_v41_${browser}_${zoom}percento_${Date.now()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 };
})();
