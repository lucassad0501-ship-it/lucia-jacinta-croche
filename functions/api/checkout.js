
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });

function supabaseHeaders(secret, extra = {}) {
  const headers = {
    apikey: secret,
    ...extra
  };

  if (!secret.startsWith("sb_secret_")) {
    headers.Authorization = "Bearer " + secret;
  }

  return headers;
}

export function onRequestGet({ env }) {
  return json({ enabled: env.ENABLE_ONLINE_PAYMENTS === "true" && !!env.MERCADOPAGO_ACCESS_TOKEN && !!env.SUPABASE_SECRET_KEY && !!env.SUPABASE_URL });
}

export async function onRequestPost({ request, env }) {
  try {
    if (env.ENABLE_ONLINE_PAYMENTS !== "true") {
      return json({
        error:
          "Pagamento online em preparação. Por enquanto, faça seu pedido pelo WhatsApp."
      }, 503);
    }

    if (
      !env.MERCADOPAGO_ACCESS_TOKEN ||
      !env.SUPABASE_SECRET_KEY ||
      !env.SUPABASE_URL
    ) {
      console.error("Checkout: configuração incompleta.");
      return json({
        error: "Pagamento online ainda não configurado."
      }, 503);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Dados inválidos." }, 400);
    }

    if (
      !Array.isArray(body?.items) ||
      body.items.length === 0 ||
      body.items.length > 30
    ) {
      return json({ error: "Sacola inválida." }, 400);
    }

    const cliente = body?.cliente || {}; const endereco = body?.endereco || {}; const str=(x,max)=>typeof x==='string'&&x.trim().length<=max?x.trim():null;
    const nome=str(cliente.nome,120), telefone=str(cliente.telefone,20), email=str(cliente.email||'',180);
    const cep=str(endereco.cep,8), uf=str(endereco.uf,2), cidade=str(endereco.cidade,100), bairro=str(endereco.bairro,100), logradouro=str(endereco.logradouro,160), numero=str(endereco.numero,20), complemento=str(endereco.complemento||'',120), observacoes=str(endereco.observacoes||'',400);
    if(!nome||nome.length<3||!telefone||telefone.replace(/\D/g,'').length<10||email===null||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||!cep||!/^\d{8}$/.test(cep)||!uf||!/^[A-Z]{2}$/.test(uf)||!cidade||!bairro||!logradouro||!numero||complemento===null||observacoes===null)return json({error:'Preencha os dados do cliente e o endereço completo.'},400);
    const quantities = new Map();

    for (const item of body.items) {
      const productId = String(item?.product_id ?? "");
      const quantity = item?.quantity;

      if (
        !/^\d+$/.test(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 50
      ) {
        return json({ error: "Produto ou quantidade inválida." }, 400);
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    if ([...quantities.values()].some((q) => q > 50)) {
      return json({
        error: "Quantidade acima do permitido."
      }, 400);
    }

    const supabaseUrl =
      env.SUPABASE_URL.replace(/\/+$/, "");

    const dbHeaders = supabaseHeaders(
      env.SUPABASE_SECRET_KEY
    );

    const ids = [...quantities.keys()];

    const productUrl =
      supabaseUrl +
      "/rest/v1/produtos?id=in.(" +
      ids.join(",") +
      ")&select=id,nome,preco,estoque,ativo";

    const productResponse = await fetch(productUrl, {
      headers: dbHeaders
    });

    if (!productResponse.ok) {
      console.error(
        "Checkout: erro ao consultar produtos.",
        productResponse.status
      );

      return json({
        error: "Não foi possível consultar os produtos."
      }, 502);
    }

    const products = await productResponse.json();

    if (products.length !== ids.length) {
      return json({
        error: "Produto não encontrado."
      }, 400);
    }

    let total = 0;
    const lines = [];

    for (const product of products) {
      const quantity = quantities.get(String(product.id));
      const cents = Math.round(Number(product.preco) * 100);
      const stock = Number(product.estoque);

      if (
        product.ativo !== true ||
        !Number.isSafeInteger(cents) ||
        cents < 1 ||
        !Number.isSafeInteger(stock) ||
        stock < quantity
      ) {
        return json({
          error:
            "Produto indisponível ou sem estoque: " +
            product.nome
        }, 409);
      }

      total += cents * quantity;

      lines.push({
        product_id: product.id,
        nome: String(product.nome),
        quantity,
        unit_price_cents: cents
      });
    }

    if (
      !Number.isSafeInteger(total) ||
      total <= 0 ||
      total > 100000000
    ) {
      return json({
        error: "Valor do pedido inválido."
      }, 400);
    }

    const orderId = crypto.randomUUID();
    const origin = new URL(request.url).origin;

    const insertResponse = await fetch(
      supabaseUrl + "/rest/v1/pedidos_v36",
      {
        method: "POST",
        headers: supabaseHeaders(
          env.SUPABASE_SECRET_KEY,
          {
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          }
        ),
        body: JSON.stringify({
          id: orderId,
          status: "pending",
          total_cents: total,
          items: lines,
          cliente_nome: nome,
          cliente_email: email || null,
          cliente_telefone: telefone,
          entrega_endereco: {cep,uf,cidade,bairro,logradouro,numero,complemento,observacoes}
        })
      }
    );

    if (!insertResponse.ok) {
      console.error(
        "Checkout: erro ao criar pedido.",
        insertResponse.status
      );

      return json({
        error: "Não foi possível registrar o pedido."
      }, 500);
    }

    const preference = {
      items: lines.map((item) => ({
        id: String(item.product_id),
        title: item.nome.slice(0, 200),
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.unit_price_cents / 100
      })),
      external_reference: orderId,
      notification_url:
        origin + "/api/mercadopago-webhook",
      back_urls: {
        success: origin + "/pagamento.html?order_id=" + encodeURIComponent(orderId),
        failure: origin + "/pagamento.html?order_id=" + encodeURIComponent(orderId),
        pending: origin + "/pagamento.html?order_id=" + encodeURIComponent(orderId)
      },
      auto_return: "approved",
      statement_descriptor: "LUCIA JACINTA"
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + env.MERCADOPAGO_ACCESS_TOKEN,
          "Content-Type": "application/json",
          "X-Idempotency-Key": orderId
        },
        body: JSON.stringify(preference)
      }
    );

    if (!mpResponse.ok) {
      console.error(
        "Checkout: erro ao criar preferência Mercado Pago.",
        mpResponse.status
      );

      return json({
        error: "Não foi possível iniciar o Mercado Pago."
      }, 502);
    }

    const result = await mpResponse.json();

    const checkoutUrl =
      env.MP_SANDBOX === "true"
        ? result.sandbox_init_point
        : result.init_point;

    if (
      !result.id ||
      !checkoutUrl ||
      !/^https:\/\/(?:www\.)?mercadopago\.com\.br\//.test(
        checkoutUrl
      )
    ) {
      console.error(
        "Checkout: resposta de preferência incompleta."
      );

      return json({
        error: "Link de pagamento indisponível."
      }, 502);
    }

    const updateResponse = await fetch(
      supabaseUrl +
        "/rest/v1/pedidos_v36?id=eq." +
        encodeURIComponent(orderId),
      {
        method: "PATCH",
        headers: supabaseHeaders(
          env.SUPABASE_SECRET_KEY,
          {
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          }
        ),
        body: JSON.stringify({
          preference_id: String(result.id)
        })
      }
    );

    if (!updateResponse.ok) {
      console.error(
        "Checkout: erro ao salvar preferência.",
        updateResponse.status
      );

      return json({
        error: "Não foi possível finalizar a criação do pedido."
      }, 500);
    }

    console.info("Checkout: pedido criado com sucesso.");

    return json({
      checkout_url: checkoutUrl,
      order_id: orderId
    });

  } catch (error) {
    console.error("Checkout: erro inesperado (detalhes omitidos por privacidade).");

    return json({
      error:
        "Falha ao iniciar pagamento. Tente novamente ou use o WhatsApp."
    }, 500);
  }
}
