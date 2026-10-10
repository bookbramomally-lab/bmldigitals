/* BML Optical Atelier. A demand-driven lens over authentic project media. */
(() => {
 'use strict';
 const states=new Map(),clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const controllers=[];
 function geometry(width,height,sourceWidth,sourceHeight,x,y,zoom,radius){
  const scale=Math.min(width/sourceWidth,height/sourceHeight),dw=sourceWidth*scale,dh=sourceHeight*scale;
  const ox=(width-dw)/2,oy=(height-dh)/2;
  const cx=clamp(x*width,ox+Math.min(radius,dw/2),ox+dw-Math.min(radius,dw/2));
  const cy=clamp(y*height,oy+Math.min(radius,dh/2),oy+dh-Math.min(radius,dh/2));
  return {cx,cy,dx:cx-(cx-ox)*zoom,dy:cy-(cy-oy)*zoom,dw:dw*zoom,dh:dh*zoom};
 }
 document.querySelectorAll('[data-optic]').forEach(shell=>{
  const frame=shell.querySelector('.optic-frame'),video=shell.querySelector('video'),canvas=shell.querySelector('canvas');
  const toggle=shell.querySelector('.optic-toggle'),panel=shell.querySelector('.optic-panel'),zoom=shell.querySelector('.optic-zoom'),scrub=shell.querySelector('.optic-scrub'),status=shell.querySelector('.optic-status');
  const context=canvas.getContext?.('2d');
  let active=false,x=.5,y=.5,magnification=2.5,pending=false,poster=null,drag=null,target=null,lastWidth=0,lastHeight=0;
  if(context)shell.classList.add('has-optic-canvas');
  const state={isActive:()=>active,draw:queue,close:()=>close(shell.contains(document.activeElement))};states.set(video,state);controllers.push({shell,state});
  function queue(){if(!active||pending||document.hidden)return;pending=true;requestAnimationFrame(draw)}
  function draw(){pending=false;if(!active||document.hidden||!context)return;
   const r=frame.getBoundingClientRect(),w=r.width,h=r.height;if(w<1||h<1)return;
   // Limit backing resolution on high density mobile displays. No idle render loop.
   const ratio=Math.min(window.devicePixelRatio||1,2);
   if(lastWidth!==w||lastHeight!==h||canvas.width!==Math.round(w*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);lastWidth=w;lastHeight=h}
   context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,w,h);
   const source=video.readyState>=2&&video.videoWidth?video:poster?.complete&&poster.naturalWidth?poster:null;
   if(!source)return;
   const sw=source===video?video.videoWidth:source.naturalWidth,sh=source===video?video.videoHeight:source.naturalHeight;
   const radius=Math.min(w*.26,h*.3,140),g=geometry(w,h,sw,sh,x,y,magnification,radius);
   context.save();context.beginPath();context.arc(g.cx,g.cy,radius,0,Math.PI*2);context.clip();context.fillStyle='#eeeae2';context.fillRect(0,0,w,h);
   try{context.drawImage(source,g.dx,g.dy,g.dw,g.dh)}catch{/* Keep the actual video and poster as the usable baseline. */}
   context.restore();context.beginPath();context.arc(g.cx,g.cy,radius,0,Math.PI*2);context.strokeStyle='#eeeae2';context.lineWidth=2;context.stroke();
   context.beginPath();context.arc(g.cx,g.cy,radius+5,0,Math.PI*2);context.strokeStyle='#19384a';context.lineWidth=1;context.stroke();
  }
  function seek(){if(target===null||!Number.isFinite(video.duration)||video.seeking)return;const time=target*Math.max(0,video.duration-.05);if(Math.abs(time-video.currentTime)>.04)try{video.currentTime=time}catch{}queue()}
  function open(){active=true;frame.tabIndex=context?0:-1;shell.classList.add('is-focusing');panel.hidden=false;canvas.hidden=!context;toggle.setAttribute('aria-expanded','true');toggle.textContent='Return to full view';
   if(!poster){poster=new Image();poster.addEventListener('load',queue);poster.src=video.poster||video.getAttribute('poster')}
   video.preload='auto';if(video.readyState<1)video.load();scrub.value=String(Number.isFinite(video.duration)?Math.round(video.currentTime/Math.max(.01,video.duration-.05)*100):0);target=null;(context?frame:scrub).focus({preventScroll:true});queue();
  }
  function close(focus){if(!active)return;active=false;target=null;drag=null;frame.tabIndex=-1;panel.hidden=true;canvas.hidden=true;shell.classList.remove('is-focusing');toggle.setAttribute('aria-expanded','false');toggle.textContent=context?'Explore detail':'Explore preview';canvas.width=canvas.height=0;lastWidth=lastHeight=0;if(focus)toggle.focus({preventScroll:true});window.dispatchEvent(new Event('scroll'))}
  toggle.addEventListener('click',()=>active?close(true):open());
  zoom.addEventListener('change',()=>{magnification=clamp(Number(zoom.value),1.5,3);queue()});
  scrub.addEventListener('input',()=>{target=clamp(Number(scrub.value)/100);seek()});
  function point(e){const r=frame.getBoundingClientRect();x=clamp((e.clientX-r.left)/Math.max(1,r.width));y=clamp((e.clientY-r.top)/Math.max(1,r.height));queue()}
  frame.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;drag=e.pointerId;frame.setPointerCapture?.(drag);point(e)});
  frame.addEventListener('pointermove',e=>{if(active&&(e.pointerType==='mouse'||drag===e.pointerId))point(e)});
  function release(e){if(drag===e.pointerId)drag=null}
  frame.addEventListener('pointerup',release);frame.addEventListener('pointercancel',release);frame.addEventListener('lostpointercapture',release);
  shell.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();close(true);return}if(e.target!==frame)return;
   const moves={ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]};if(moves[e.key]){e.preventDefault();x=clamp(x+moves[e.key][0]);y=clamp(y+moves[e.key][1]);status.textContent=`Focus ${Math.round(x*100)} percent across, ${Math.round(y*100)} percent down`;queue()}else if(e.key==='Home'){e.preventDefault();x=y=.5;status.textContent='Focus at centre';queue()}
  });
  video.addEventListener('loadedmetadata',()=>{seek();queue()});video.addEventListener('loadeddata',queue);video.addEventListener('seeked',()=>{seek();queue()});
  if(!context){zoom.disabled=true;toggle.textContent='Explore preview';frame.setAttribute('aria-label','Project preview');shell.querySelector('.optic-help').textContent='Use the preview position control to explore the film.'}
  if('ResizeObserver'in window){const observer=new ResizeObserver(queue);observer.observe(frame)}
 });
 if(controllers.length)document.documentElement.classList.add('optics-ready');
 window.BMLOptics={isInspecting:video=>states.get(video)?.isActive()||false,closeWithin:element=>controllers.forEach(c=>{if(element.contains(c.shell))c.state.close()})};
 addEventListener('resize',()=>controllers.forEach(c=>c.state.draw()),{passive:true});
 document.addEventListener('visibilitychange',()=>controllers.forEach(c=>c.state.draw()));
 preference.addEventListener('change',()=>controllers.forEach(c=>c.state.close()));
})();
