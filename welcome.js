(()=>{
'use strict';
const screen=document.getElementById('welcomeScreen');
if(!screen)return;
let closed=false;
const close=()=>{if(closed)return;closed=true;screen.classList.add('welcome-hide');window.setTimeout(()=>screen.remove(),650)};
document.getElementById('welcomeSkip')?.addEventListener('click',close);
document.getElementById('welcomeSound')?.addEventListener('click',()=>{
 try{
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)return;
  const ctx=new AudioContext();
  ctx.resume().then(()=>{
   [523.25,659.25,783.99].forEach((hz,i)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.value=hz;
    const start=ctx.currentTime+i*.16;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(.075,start+.035);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.5);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(start);osc.stop(start+.52);
   });
   window.setTimeout(()=>ctx.close().catch(()=>{}),1500);
  }).catch(()=>{});
 }catch(e){console.debug('Som indisponível',e)}
});
try{
 if(sessionStorage.getItem('lj-welcome-seen-v43')==='1'){screen.remove();return}
 sessionStorage.setItem('lj-welcome-seen-v43','1');
}catch(e){}
window.setTimeout(close,3800);
})();