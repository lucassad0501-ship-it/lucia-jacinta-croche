(()=>{
'use strict';
let slides=[
 {eyebrow:'ENCOMENDAS PERSONALIZADAS',headline:'Encomende seu tapete <em>do seu jeito!</em>',description:'Escolha o modelo, as cores e o tamanho. Faça seu orçamento pelo WhatsApp.',image:'https://wakhlrraspesozjlzxbs.supabase.co/storage/v1/object/public/produtos/98c9b757-740c-495e-bcc4-c380db4fe806/anuncios/962b977c-b3fe-4b64-a89c-f46316a8ee2c.png'},
 {eyebrow:'ACOMPANHE NOSSAS NOVIDADES',headline:'Siga nossas redes sociais <em>e fique por dentro!</em>',description:'Novos modelos, lançamentos e inspirações. Instagram: @ljcro_che.',image:'https://wakhlrraspesozjlzxbs.supabase.co/storage/v1/object/public/produtos/98c9b757-740c-495e-bcc4-c380db4fe806/anuncios/4c0ee68c-ead1-4d2b-8421-1d6e344c02c8.png'},
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
(async()=>{try{const url=window.LUCIA_SUPABASE_URL,key=window.LUCIA_SUPABASE_ANON_KEY;if(!/^https:\/\//.test(url||'')||!key)return;let data=null;const client=window.supabase?.createClient?.(url,key);if(client){const result=await client.from('anuncios_home').select('id,chamada,titulo,destaque,descricao,imagem_url').eq('ativo',true).order('id');if(!result.error)data=result.data;else console.warn('Falha ao consultar anúncios',result.error.message)}if(!data){const response=await fetch(url+'/rest/v1/anuncios_home?select=id,chamada,titulo,destaque,descricao,imagem_url&ativo=eq.true&order=id.asc',{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});if(!response.ok)throw Error('Anúncios indisponíveis: HTTP '+response.status);data=await response.json()}if(!data?.length)return;slides=data.map(a=>({eyebrow:a.chamada||'',headline:(a.titulo||'')+(a.destaque?' <em>'+a.destaque+'</em>':''),description:a.descricao||'',image:a.imagem_url||null}));current=0;show(0);start()}catch(e){console.warn('Anúncios padrão em uso',e)}})();
})();