(()=>{
'use strict';
let slides=[
 {eyebrow:'FEITO À MÃO COM AMOR',headline:'Delicadeza em cada ponto, <em>aconchego em cada lar.</em>',description:'Peças artesanais criadas com cuidado para deixar sua casa ainda mais bonita, acolhedora e cheia de personalidade.'},
 {eyebrow:'SEU LAR MERECE CARINHO',headline:'Um toque de crochê, <em>um mundo de encanto.</em>',description:'Conheça nossas peças e encontre detalhes especiais para decorar cada cantinho da sua casa.'},
 {eyebrow:'ENCOMENDAS ESPECIAIS',headline:'Sua ideia, nossas mãos, <em>uma peça única.</em>',description:'Quer conversar sobre cores, modelos ou encomendas? Fale com a Lúcia Jacinta pelo WhatsApp.'},
 {eyebrow:'CROCHÊ ARTESANAL',headline:'Pequenos detalhes, <em>grandes sentimentos.</em>',description:'Feito com dedicação, para presentear com carinho ou deixar seu lar ainda mais acolhedor.'}
];
const eyebrow=document.getElementById('heroEyebrow'),headline=document.getElementById('heroHeadline'),description=document.getElementById('heroDescription'),dots=document.getElementById('heroDots');
if(!eyebrow||!headline||!description||!dots)return;
const area=document.querySelector('.hero-announcement');const banner=document.getElementById('heroBannerImage');const bannerPhoto=document.getElementById('heroBannerPhoto');
let current=0,timer=null,paused=false;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(index){
 current=(index+slides.length)%slides.length;
 const slide=slides[current];
 eyebrow.textContent=slide.eyebrow;
 headline.replaceChildren();const parts=slide.headline.split(/(<em>|<\/em>)/);let emphasis=false;for(const part of parts){if(part==='<em>'){emphasis=true;continue}if(part==='</em>'){emphasis=false;continue}if(emphasis){const em=document.createElement('em');em.textContent=part;headline.append(em)}else headline.append(document.createTextNode(part))}
 description.textContent=slide.description;if(banner&&bannerPhoto){if(slide.image){bannerPhoto.src=slide.image;bannerPhoto.alt='Imagem do anúncio '+(current+1);banner.hidden=false;banner.classList.remove('hero-banner-enter');void banner.offsetWidth;banner.classList.add('hero-banner-enter')}else{banner.hidden=true;bannerPhoto.removeAttribute('src')}}
 if(area&&!reduced){area.classList.remove('hero-message-in');void area.offsetWidth;area.classList.add('hero-message-in')}
 dots.innerHTML=slides.map((_,i)=>`<button type="button" data-slide="${i}" aria-label="Anúncio ${i+1}"></button>`).join('');
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
(async()=>{try{const client=window.supabase?.createClient?.(window.LUCIA_SUPABASE_URL,window.LUCIA_SUPABASE_ANON_KEY);if(!client)return;const {data,error}=await client.from('anuncios_home').select('id,chamada,titulo,destaque,descricao,imagem_url').eq('ativo',true).order('id');if(error||!data?.length)return;slides=data.map(a=>({eyebrow:a.chamada,headline:a.titulo+(a.destaque?' <em>'+a.destaque+'</em>':''),description:a.descricao,image:a.imagem_url}));current=0;show(0);start()}catch(e){console.warn('Anúncios padrão em uso')}})();
})();