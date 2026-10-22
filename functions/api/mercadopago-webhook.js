
const reply = (status = 200) =>
  new Response("OK", {
    status,
    headers: { "Cache-Control": "no-store" }
  });

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

export async function onRequestPost({ request, env }) {
  try {
    const webhookSecret = env.MP_WEBHOOK_SECRET;

    if (
      !webhookSecret ||
      !env.MERCADOPAGO_ACCESS_TOKEN ||
      !env.SUPABASE_SECRET_KEY ||
      !env.SUPABASE_URL
    ) {
      console.error("Variáveis de ambiente ausentes.");
      return reply(503);
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const eventType =
      url.searchParams.get("type") ||
      body.type ||
      "";

    if (eventType && eventType !== "payment") {
      return reply(200);
    }

    const dataId = String(
      url.searchParams.get("data.id") ||
      body.data?.id ||
      ""
    );

    if (!/^\d+$/.test(dataId)) {
      return reply(200);
    }

    const signature = request.headers.get("x-signature") || "";
    const requestId = request.headers.get("x-request-id") || "";

    const ts = signature.match(
      /(?:^|,)\s*ts=([^,]+)/
    )?.[1];

    const v1 = signature.match(
      /(?:^|,)\s*v1=([a-fA-F0-9]+)/
    )?.[1];

    if (!ts || !v1 || !requestId || !/^\d+$/.test(ts)) {
      return reply(401);
    }

    if (
      Math.abs(Date.now() - Number(ts) * 1000) >
      10 * 60 * 1000
    ) {
      return reply(401);
    }

    const manifest =
      `id:${dataId.toLowerCase()};` +
      `request-id:${requestId};` +
      `ts:${ts};`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expected = toHex(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(manifest)
      )
    );

    const received = v1.toLowerCase();

    if (
      expected.length !== received.length ||
      ![...expected].every(
        (character, index) => character === received[index]
      )
    ) {
      console.error("Assinatura do webhook inválida.");
      return reply(401);
    }

    const paymentResponse = await fetch(
      "https://api.mercadopago.com/v1/payments/" + dataId,
      {
        headers: {
          Authorization:
            "Bearer " + env.MERCADOPAGO_ACCESS_TOKEN
        }
      }
    );

    if (!paymentResponse.ok) {
      console.error("Falha ao consultar pagamento.");
      return reply(502);
    }

    const payment = await paymentResponse.json();

    const orderId = String(
      payment.external_reference || ""
    );

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      )
    ) {
      return reply(200);
    }

    const amount = Number(payment.transaction_amount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return reply(500);
    }

    const dbHeaders = {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization:
        "Bearer " + env.SUPABASE_SECRET_KEY,
      "Content-Type": "application/json"
    };

    const rpcResponse = await fetch(
      env.SUPABASE_URL +
        "/rest/v1/rpc/confirmar_pagamento_mp",
      {
        method: "POST",
        headers: dbHeaders,
        body: JSON.stringify({
          p_order_id: orderId,
          p_payment_id: String(payment.id),
          p_status: String(payment.status),
          p_amount_cents: Math.round(amount * 100),
          p_currency: String(payment.currency_id || "")
        })
      }
    );

    if (!rpcResponse.ok) {
      console.error(
        "Erro ao confirmar pagamento:",
        await rpcResponse.text()
      );

      return reply(500);
    }

    return reply(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    return reply(500);
  }
}
