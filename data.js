const STORE='lucia_jacinta_demo_v2';
const SEED=[{id:'demo1',name:'Kit Banheiro 3 Peças',category:'Banheiro',price:150,stock:5,description:'Kit artesanal demonstrativo com três peças.',photo:''},{id:'demo2',name:'Kit Cozinha 3 Peças',category:'Cozinha',price:150,stock:4,description:'Kit demonstrativo em crochê.',photo:''},{id:'demo3',name:'Passadeira Artesanal',category:'Passadeiras',price:95,stock:3,description:'Passadeira decorativa demonstrativa.',photo:''},{id:'demo4',name:'Sousplat de Crochê',category:'Mesa posta',price:35,stock:8,description:'Peça demonstrativa para mesa posta.',photo:''}];
function getProducts(){try{const value=localStorage.getItem(STORE);return value===null?SEED:JSON.parse(value)}catch{return SEED}}
function saveProducts(items){localStorage.setItem(STORE,JSON.stringify(items))}
function money(n){return Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function safePhoto(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch{return ''}}
