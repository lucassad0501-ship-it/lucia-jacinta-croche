const reply=(status=200)=>new Response('OK',{status});
const hex=buffer=>Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function onRequestPost({request,env}){
 try{
  if(!env.MP_WEBHOOK_SECRET||!env.MERCADOPAGO_ACCESS_TOKEN||!env.SUPABASE_SECRET_KEY||!env.SUPABASE_URL)return reply(503);
  const url=new URL(request.url);const body=await request.json().catch(()=>({}));const dataId=String(url.searchParams.get('data.id')||body.data?.id||'');if(!/^\d+$/.test(dataId))return reply();
  const signature=request.headers.get('x-signature')||'';const requestId=request.headers.get('x-request-id')||'';const ts=signature.match(/(?:^|,)\s*ts=([^,]+)/)?.[1];const v1=signature.match(/(?:^|,)\s*v1=([a-fA-F0-9]+)/)?.[1];if(!ts||!v1||!requestId||!/^\d+$/.test(ts)||Math.abs(Date.now()-Number(ts)*1000)>10*60*1000)return reply(401);
  const manifest=`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.MP_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(manifest)));if(expected.length!==v1.length||!([...expected].every((c,i)=>c===v1.toLowerCase()[i])))return reply(401);
  const payment=await fetch('https://api.mercadopago.com/v1/payments/'+dataId,{headers:{Authorization:'Bearer '+env.MERCADOPAGO_ACCESS_TOKEN}});if(!payment.ok)return reply(502);const details=await payment.json();const orderId=String(details.external_reference||'');if(!/^[0-9a-f-]{36}$/i.test(orderId))return reply();
  const dbheaders={'apikey':env.SUPABASE_SECRET_KEY,'Authorization':'Bearer '+env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'};
  const rpc=await fetch(env.SUPABASE_URL+'/rest/v1/rpc/confirmar_pagamento_mp',{method:'POST',headers:dbheaders,body:JSON.stringify({p_order_id:orderId,p_payment_id:String(details.id),p_status:String(details.status),p_amount_cents:Math.round(Number(details.transaction_amount)*100),p_currency:String(details.currency_id||'')})});if(!rpc.ok){console.error('RPC payment failed',await rpc.text());return reply(500)}return reply();
 }catch(e){console.error('webhook',e);return reply(500)}
}
