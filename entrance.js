/* A brief first-visit logo entrance. It never waits on network completion. */
(() => {
 'use strict';
 const root=document.documentElement;
 if(!root.classList.contains('arrival-active'))return;
 const surfaces=[...document.querySelectorAll('.site-header,main,.site-footer')];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let finished=false;
 surfaces.forEach(element=>element.inert=true);
 function finish(){if(finished)return;finished=true;root.classList.remove('arrival-active');surfaces.forEach(element=>element.inert=false);document.removeEventListener('keydown',onKey);motion.removeEventListener('change',finish)}
 function onKey(e){if(e.key==='Escape'||e.key==='Tab')finish()}
 document.addEventListener('keydown',onKey);
 motion.addEventListener('change',finish);
 setTimeout(finish,motion.matches?350:1650);
})();
