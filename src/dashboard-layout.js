// Presentazione soltanto: mantiene la posizione originale su iPhone e schermi stretti.
(()=>{
 const view=document.getElementById('dashboardView');
 const header=view?.querySelector('.dashboard-header');
 const content=view?.querySelector('.dashboard-content');
 const cards=view?.querySelector('.dashboard-kpis');
 if(!header||!content||!cards)return;
 const wide=window.matchMedia('(min-width:901px)');
 function arrange(){
  const desktop=wide.matches&&!document.documentElement.classList.contains('is-iphone');
  if(desktop&&cards.parentElement!==header)header.append(cards);
  if(!desktop&&cards.parentElement!==content)content.prepend(cards);
 }
 wide.addEventListener('change',arrange);arrange();
})();

// Sagoma disegnata sulle dimensioni effettive delle due ali, senza ritagli rettangolari.
(()=>{
 const panel=document.querySelector('#dashboardView .room-overview');
 const left=panel?.querySelector('.overview-chinotto');
 const right=panel?.querySelector('.overview-carso');
 if(!panel||!left||!right)return;
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 svg.classList.add('overview-surface');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<defs><linearGradient id="overviewGlass" x1="0%" y1="0%" x2="70%" y2="100%"><stop offset="0" stop-color="white" stop-opacity=".075"/><stop offset="1" stop-color="white" stop-opacity=".022"/></linearGradient></defs><path fill="url(#overviewGlass)" stroke="rgba(255,255,255,.10)" stroke-width="1"/>';
 panel.prepend(svg);
 const path=svg.querySelector('path');
 let pending=false;
 function draw(){
  pending=false;
  const w=panel.clientWidth,h=panel.clientHeight,x=left.offsetWidth,y=right.offsetHeight;
  if(w<1||h<1||x<1||y<1)return;
  const a=.5,W=w-a,H=h-a,X=x-a,Y=y-a;
  const r=Math.min(22,X/3,Y/3,(W-X)/3,(H-Y)/3);
  if(r<=0)return;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  path.setAttribute('d',`M ${a+r} ${a} H ${W-r} Q ${W} ${a} ${W} ${a+r} V ${Y-r} Q ${W} ${Y} ${W-r} ${Y} H ${X+r} Q ${X} ${Y} ${X} ${Y+r} V ${H-r} Q ${X} ${H} ${X-r} ${H} H ${a+r} Q ${a} ${H} ${a} ${H-r} V ${a+r} Q ${a} ${a} ${a+r} ${a} Z`);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(draw);}}
 const observer=new ResizeObserver(schedule);[panel,left,right].forEach(e=>observer.observe(e));schedule();
})();
