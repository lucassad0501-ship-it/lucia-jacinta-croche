(()=>{
'use strict';
const slides=[
 {eyebrow:'FEITO À MÃO COM AMOR',headline:'Delicadeza em cada ponto, <em>aconchego em cada lar.</em>',description:'Peças artesanais criadas com cuidado para deixar sua casa ainda mais bonita, acolhedora e cheia de personalidade.'},
 {eyebrow:'SEU LAR MERECE CARINHO',headline:'Um toque de crochê, <em>um mundo de encanto.</em>',description:'Conheça nossas peças e encontre detalhes especiais para decorar cada cantinho da sua casa.'},
 {eyebrow:'ENCOMENDAS ESPECIAIS',headline:'Sua ideia, nossas mãos, <em>uma peça única.</em>',description:'Quer conversar sobre cores, modelos ou encomendas? Fale com a Lúcia Jacinta pelo WhatsApp.'},
 {eyebrow:'CROCHÊ ARTESANAL',headline:'Pequenos detalhes, <em>grandes sentimentos.</em>',description:'Feito com dedicação, para presentear com carinho ou deixar seu lar ainda mais acolhedor.'}
];
const eyebrow=document.getElementById('heroEyebrow'),headline=document.getElementById('heroHeadline'),description=document.getElementById('heroDescription'),dots=document.getElementById('heroDots');
if(!eyebrow||!headline||!description||!dots)return;
const area=document.querySelector('.hero-announcement');
let current=0,timer=null,paused=false;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(index){
 current=(index+slides.length)%slides.length;
 const slide=slides[current];
 eyebrow.textContent=slide.eyebrow;
 headline.innerHTML=slide.headline;
 description.textContent=slide.description;
 if(area&&!reduced){area.classList.remove('hero-message-in');void area.offsetWidth;area.classList.add('hero-message-in')}
 dots.querySelectorAll('[data-slide]').forEach((button,i)=>{button.classList.toggle('active',i===current);if(i===current)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current')});
}
function stop(){if(timer){clearInterval(timer);timer=null}}
function start(){stop();if(!paused&&!reduced&&!document.hidden)timer=setInterval(()=>show(current+1),5500)}
dots.addEventListener('click',event=>{const button=event.target.closest('[data-slide]');if(!button)return;show(Number(button.dataset.slide));start()});
const hero=document.querySelector('.hero');
hero?.addEventListener('mouseenter',()=>{paused=true;stop()});
hero?.addEventListener('mouseleave',()=>{paused=false;start()});
hero?.addEventListener('focusin',()=>{paused=true;stop()});
hero?.addEventListener('focusout',event=>{if(!hero.contains(event.relatedTarget)){paused=false;start()}});
document.addEventListener('visibilitychange',start);
show(0);start();
})();