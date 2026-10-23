(()=>{
'use strict';
const screen=document.getElementById('welcomeScreen');
if(!screen)return;
let closed=false;
const enter=()=>{
 if(closed)return;
 closed=true;
 screen.classList.add('welcome-hide');
 screen.style.pointerEvents='none';
 window.setTimeout(()=>{screen.remove();},650);
};
const skip=document.getElementById('welcomeSkip');
const sound=document.getElementById('welcomeSound');
skip?.addEventListener('click',enter);
function chime(){
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;
  const ctx=new AudioCtx();
  const resumed=ctx.resume();
  [523.25,659.25,783.99].forEach((hz,i)=>{
   const osc=ctx.createOscillator();
   const gain=ctx.createGain();
   const start=ctx.currentTime+.02+i*.17;
   osc.type='sine';osc.frequency.value=hz;
   gain.gain.setValueAtTime(.0001,start);
   gain.gain.exponentialRampToValueAtTime(.065,start+.025);
   gain.gain.exponentialRampToValueAtTime(.0001,start+.48);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(start);osc.stop(start+.5);
  });
  Promise.resolve(resumed).catch(()=>{});
  window.setTimeout(()=>ctx.close().catch(()=>{}),1500);
 }catch(e){/* som opcional: não impedir entrada */}
}
sound?.addEventListener('click',()=>{
 chime();
 window.setTimeout(enter,800);
});
/* Fail-safe: never keep visitors stuck on splash, even when scripts are delayed. */
window.setTimeout(enter,6500);
})();