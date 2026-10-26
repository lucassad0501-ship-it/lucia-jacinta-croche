const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function onRequestGet({request,env}){
 const id=new URL(request.url).searchParams.get("id")||"";
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return json({error:"Pedido inválido"},400);
 if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)return json({error:"Consulta indisponível"},503);
 const key=env.SUPABASE_SECRET_KEY;
 const headers={apikey:key};if(!key.startsWith("sb_secret_"))headers.Authorization="Bearer "+key;
 try{
  const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,"")+"/rest/v1/pedidos_v36?id=eq."+encodeURIComponent(id)+"&select=status",{headers});
  if(!r.ok)return json({error:"Não foi possível consultar o pedido"},502);
  const rows=await r.json();if(!rows.length)return json({error:"Pedido não encontrado"},404);
  const status=String(rows[0].status||"pending");
  return json({status:["approved","pending","rejected","cancelled","refunded"].includes(status)?status:"pending"});
 }catch{return json({error:"Consulta temporariamente indisponível"},503)}
}
