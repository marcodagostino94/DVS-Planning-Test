// Solo presentazione: larghezza della pagina indipendente dall'apertura in sovraimpressione.
(()=>{
 const root=document.documentElement,sidebar=document.querySelector('.sidebar');
 if(!sidebar)return;
 const wide=matchMedia('(min-width:901px)');
 let current=document.querySelector('.main-area>.app-view.active')?.id.replace(/View$/,'')||'dashboard';
 let inside=sidebar.matches(':hover'),closeTimer;
 const enabled=()=>wide.matches&&!root.classList.contains('is-iphone');
 function expand(open){root.classList.toggle('sidebar-peek',enabled()&&current!=='dashboard'&&open);}
 function closeLater(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!inside&&!sidebar.querySelector(':focus-visible'))expand(false);},180);}
 window.updateSlimSidebar=function(view){
  current=view;clearTimeout(closeTimer);
  root.classList.toggle('sidebar-slim',enabled()&&current!=='dashboard');
  expand(inside||!!sidebar.querySelector(':focus-visible'));
 };
 sidebar.querySelectorAll('button').forEach(button=>{
  if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',button.textContent.trim());
 });
 sidebar.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;inside=true;clearTimeout(closeTimer);expand(true);});
 sidebar.addEventListener('pointerleave',()=>{inside=false;closeLater();});
 sidebar.addEventListener('focusin',()=>{if(sidebar.querySelector(':focus-visible'))expand(true);});
 sidebar.addEventListener('focusout',closeLater);
 sidebar.addEventListener('keydown',e=>{if(e.key==='Escape'){expand(false);if(sidebar.contains(document.activeElement))document.activeElement.blur();}});
 // Il primo tocco sulle sole icone apre le etichette; il secondo attiva il comando.
 sidebar.addEventListener('click',e=>{
  if(enabled()&&current!=='dashboard'&&!root.classList.contains('sidebar-peek')&&e.pointerType==='touch'){
   e.preventDefault();e.stopImmediatePropagation();expand(true);
  }
 },true);
 document.addEventListener('pointerdown',e=>{if(!sidebar.contains(e.target)){inside=false;expand(false);}});
 wide.addEventListener('change',()=>window.updateSlimSidebar(current));
 window.updateSlimSidebar(current);
})();
