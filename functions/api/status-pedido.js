const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function onRequestGet({request,env}){
 const params=new URL(request.url).searchParams;const id=params.get("id")||"";const tracking=params.get("tracking")==="1";const phone=String(params.get("phone")||"").replace(/\D/g,"").replace(/^55(?=\d{10,11}$)/,"");if(tracking&&!/^\d{10,11}$/.test(phone))return json({error:"Informe o WhatsApp com DDD."},400);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return json({error:"Pedido inválido"},400);
 if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)return json({error:"Consulta indisponível"},503);
 const key=env.SUPABASE_SECRET_KEY;
 const headers={apikey:key};if(!key.startsWith("sb_secret_"))headers.Authorization="Bearer "+key;
 try{
  const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,"")+"/rest/v1/pedidos_v36?id=eq."+encodeURIComponent(id)+"&select="+(tracking?"status,cliente_telefone,criado_em,entrega_endereco":"status"),{headers});
  if(!r.ok)return json({error:"Não foi possível consultar o pedido"},502);
  const rows=await r.json();if(!rows.length)return json({error:"Pedido não encontrado"},404);
  if(tracking){const stored=String(rows[0].cliente_telefone||"").replace(/\D/g,"").replace(/^55(?=\d{10,11}$)/,"");if(stored!==phone)return json({error:"Código ou WhatsApp não conferem."},404);const stage=rows[0].entrega_endereco?.andamento||"recebido";return json({status:String(rows[0].status||"pending"),andamento:["recebido","producao","pronto","enviado","entregue"].includes(stage)?stage:"recebido",criado_em:rows[0].criado_em})}const status=String(rows[0].status||"pending");
  return json({status:["approved","pending","rejected","cancelled","refunded"].includes(status)?status:"pending"});
 }catch{return json({error:"Consulta temporariamente indisponível"},503)}
}
