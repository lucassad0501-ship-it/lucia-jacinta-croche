const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequestPost({request,env}){
 try{
  if(env.ENABLE_ONLINE_PAYMENTS!=='true')return json({error:'Pagamento online em preparação. Por enquanto, faça seu pedido pelo WhatsApp.'},503);
  if(!env.MERCADOPAGO_ACCESS_TOKEN||!env.SUPABASE_SECRET_KEY||!env.SUPABASE_URL)return json({error:'Pagamento online ainda não configurado. Use o WhatsApp.'},503);
  const body=await request.json();if(!Array.isArray(body.items)||!body.items.length||body.items.length>30)return json({error:'Sacola inválida.'},400);
  const quantities=new Map();for(const item of body.items){const key=String(item.product_id);if(!/^\d+$/.test(key)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>50)return json({error:'Quantidade inválida.'},400);quantities.set(key,(quantities.get(key)||0)+item.quantity)}
  if([...quantities.values()].some(q=>q>50))return json({error:'Quantidade acima do permitido.'},400);
  const dbheaders={'apikey':env.SUPABASE_SECRET_KEY,'Authorization':'Bearer '+env.SUPABASE_SECRET_KEY};const ids=[...quantities.keys()];
  const r=await fetch(env.SUPABASE_URL+'/rest/v1/produtos?id=in.('+ids.join(',')+')&select=id,nome,preco,estoque,ativo',{headers:dbheaders});if(!r.ok)throw Error('Erro ao consultar produtos');const products=await r.json();if(products.length!==ids.length)return json({error:'Produto não encontrado.'},400);
  let total=0;const lines=[];for(const product of products){const quantity=quantities.get(String(product.id));const cents=Math.round(Number(product.preco)*100);if(product.ativo===false||!Number.isSafeInteger(cents)||cents<1||!Number.isInteger(Number(product.estoque))||Number(product.estoque)<quantity)return json({error:'Produto indisponível ou sem estoque: '+product.nome},409);total+=cents*quantity;lines.push({product_id:product.id,nome:product.nome,quantity,unit_price_cents:cents})}
  if(total>100000000)return json({error:'Valor excede o limite de compra.'},400);
  const orderId=crypto.randomUUID();const origin=new URL(request.url).origin;const insert=await fetch(env.SUPABASE_URL+'/rest/v1/pedidos_v36',{method:'POST',headers:{...dbheaders,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({id:orderId,status:'pending',total_cents:total,items:lines})});if(!insert.ok)throw Error('Não foi possível registrar o pedido. Confira a migração SQL.');
  const preference={items:lines.map(x=>({id:String(x.product_id),title:x.nome.slice(0,200),quantity:x.quantity,currency_id:'BRL',unit_price:x.unit_price_cents/100})),external_reference:orderId,notification_url:origin+'/api/mercadopago-webhook',back_urls:{success:origin+'/pagamento.html',failure:origin+'/pagamento.html',pending:origin+'/pagamento.html'},auto_return:'approved',statement_descriptor:'LUCIA JACINTA'};
  const mp=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:'Bearer '+env.MERCADOPAGO_ACCESS_TOKEN,'Content-Type':'application/json','X-Idempotency-Key':orderId},body:JSON.stringify(preference)});const result=await mp.json();if(!mp.ok||!result.init_point)throw Error('Não foi possível criar o checkout no Mercado Pago.');
  await fetch(env.SUPABASE_URL+'/rest/v1/pedidos_v36?id=eq.'+orderId,{method:'PATCH',headers:{...dbheaders,'Content-Type':'application/json'},body:JSON.stringify({preference_id:String(result.id)})});
  const checkoutUrl=env.MP_SANDBOX==='true'?result.sandbox_init_point:result.init_point;
  if(!checkoutUrl||!/^https:\/\/(?:www\.)?mercadopago\.com\.br\//.test(checkoutUrl))throw Error('URL de checkout inválida');
  return json({checkout_url:checkoutUrl,order_id:orderId});
 }catch(e){console.error('checkout',e);return json({error:'Falha ao iniciar pagamento. Tente novamente ou use o WhatsApp.'},500)}
}
