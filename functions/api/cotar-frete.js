import {calculateShipping} from './checkout.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequestPost({request,env}){
 try{
  const body=await request.json();const a=body?.endereco||{};
  const clean=(v,n)=>typeof v==='string'&&v.trim().length<=n?v.trim():null;
  const address={cep:clean(a.cep,8),uf:clean(a.uf,2),cidade:clean(a.cidade,100),bairro:clean(a.bairro,100),logradouro:clean(a.logradouro,160),numero:clean(a.numero,20)};
  if(!/^\d{8}$/.test(address.cep||'')||!address.uf||!address.cidade||!address.bairro||!address.logradouro||!address.numero)return json({error:'Preencha CEP, rua, número, bairro, cidade e UF para calcular o frete.'},400);
  const result=await calculateShipping(env,address);
  if(!result.ok)return json({error:result.error},result.status||400);
  return json({cidade:result.cidade,uf:result.uf,frete_cents:result.frete_cents});
 }catch{return json({error:'Não foi possível calcular o frete.'},400)}
}
