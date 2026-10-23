const responder = (dados, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });

export async function onRequestPost({ request, env }) {
  const token = env.DIAGNOSTIC_TOKEN;
  const recebido = request.headers.get("x-diagnostic-token");

  if (!token || !recebido || recebido !== token) {
    return responder({ error: "Não autorizado" }, 401);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    return responder({ status: "erro", etapa: "configuracao" }, 503);
  }

  try {
    const url =
      env.SUPABASE_URL.replace(/\/+$/, "") +
      "/rest/v1/produtos?select=id&limit=1";

    const headers = { apikey: env.SUPABASE_SECRET_KEY };

    if (!env.SUPABASE_SECRET_KEY.startsWith("sb_secret_")) {
      headers.Authorization = "Bearer " + env.SUPABASE_SECRET_KEY;
    }

    const resposta = await fetch(url, { headers });

    if (!resposta.ok) {
      console.error("Diagnóstico Supabase: HTTP", resposta.status);
      return responder({ status: "erro", etapa: "supabase", http: resposta.status }, 502);
    }

    return responder({
      status: "ok",
      cloudflare: "funcionando",
      supabase: "conectado",
      consulta_produtos: "sucesso",
      pagamentos: "não testados"
    });
  } catch (erro) {
    console.error("Diagnóstico: falha de conexão");
    return responder({ status: "erro", etapa: "conexao" }, 500);
  }
}
