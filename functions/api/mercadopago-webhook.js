
const reply = (status = 200) =>
  new Response("OK", {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

function parseTimestamp(raw) {
  if (!/^\d+$/.test(raw || "")) return null;

  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return null;

  // Aceita timestamps em segundos ou milissegundos.
  return value < 100000000000 ? value * 1000 : value;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

export async function onRequestPost({ request, env }) {
  try {
    const webhookSecret =
      env.MP_WEBHOOK_SECRET ||
      env.MERCADOPAGO_WEBHOOK_SECRET;

    if (
      !webhookSecret ||
      !env.MERCADOPAGO_ACCESS_TOKEN ||
      !env.SUPABASE_SECRET_KEY ||
      !env.SUPABASE_URL
    ) {
      console.error("Webhook: variáveis de ambiente ausentes.");
      return reply(503);
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const eventType = String(
      url.searchParams.get("type") ||
      body.type ||
      ""
    ).toLowerCase();

    if (eventType && eventType !== "payment") {
      return reply(200);
    }

    const dataId = String(
      url.searchParams.get("data.id") ||
      body.data?.id ||
      ""
    );

    if (!/^\d+$/.test(dataId)) {
      console.warn("Webhook: ID de pagamento ausente ou inválido.");
      return reply(200);
    }

    const signature =
      request.headers.get("x-signature") || "";

    const requestId =
      request.headers.get("x-request-id") || "";

    const ts =
      signature.match(/(?:^|,)\s*ts=([^,]+)/)?.[1];

    const v1 =
      signature.match(/(?:^|,)\s*v1=([a-fA-F0-9]+)/)?.[1];

    if (
      !ts ||
      !v1 ||
      !requestId ||
      !/^[a-fA-F0-9]{64}$/.test(v1)
    ) {
      console.error("Webhook: assinatura incompleta.");
      return reply(401);
    }

    const timestampMs = parseTimestamp(ts);

    if (
      timestampMs === null ||
      Math.abs(Date.now() - timestampMs) > 10 * 60 * 1000
    ) {
      console.error("Webhook: timestamp inválido ou expirado.");
      return reply(401);
    }

    const manifest =
      `id:${dataId.toLowerCase()};` +
      `request-id:${requestId};` +
      `ts:${ts};`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
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

    if (!safeEqual(expected, v1.toLowerCase())) {
      console.error("Webhook: assinatura inválida.");
      return reply(401);
    }

    // Consulta o pagamento diretamente no Mercado Pago.
    // Nunca confia no status informado pelo webhook.
    const paymentResponse = await fetch(
      "https://api.mercadopago.com/v1/payments/" +
        encodeURIComponent(dataId),
      {
        method: "GET",
        headers: {
          Authorization:
            "Bearer " + env.MERCADOPAGO_ACCESS_TOKEN
        }
      }
    );

    if (!paymentResponse.ok) {
      console.error(
        "Webhook: falha na consulta ao Mercado Pago.",
        "HTTP:",
        paymentResponse.status,
        "ID:",
        dataId
      );

      // Um ID inexistente não é confirmação de pagamento.
      // Retornamos erro para permitir nova tentativa e
      // investigação, sem aprovar qualquer pedido.
      if (paymentResponse.status === 404) {
        return reply(404);
      }

      return reply(502);
    }

    const payment = await paymentResponse.json();

    if (String(payment.id) !== dataId) {
      console.error("Webhook: ID de pagamento divergente.");
      return reply(500);
    }

    const orderId = String(
      payment.external_reference || ""
    );

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(orderId)) {
      console.warn(
        "Webhook: pagamento sem referência de pedido válida."
      );
      return reply(200);
    }

    const amount = Number(payment.transaction_amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(Math.round(amount * 100))
    ) {
      console.error("Webhook: valor de pagamento inválido.");
      return reply(500);
    }

    const paymentStatus = String(payment.status || "");

    // Somente pagamentos aprovados devem alterar o pedido.
    if (paymentStatus !== "approved") {
      console.info(
        "Webhook: pagamento ainda não aprovado.",
        paymentStatus
      );
      return reply(200);
    }

    const supabaseUrl =
      String(env.SUPABASE_URL).replace(/\/+$/, "");

    const supabaseKey = env.SUPABASE_SECRET_KEY;

    const dbHeaders = {
      apikey: supabaseKey,
      "Content-Type": "application/json"
    };

    // Chaves JWT legadas usam Authorization: Bearer.
    // Chaves modernas sb_secret_ são usadas via apikey.
    if (!supabaseKey.startsWith("sb_secret_")) {
      dbHeaders.Authorization = "Bearer " + supabaseKey;
    }

    const rpcResponse = await fetch(
      supabaseUrl + "/rest/v1/rpc/confirmar_pagamento_mp",
      {
        method: "POST",
        headers: dbHeaders,
        body: JSON.stringify({
          p_order_id: orderId,
          p_payment_id: String(payment.id),
          p_status: paymentStatus,
          p_amount_cents: Math.round(amount * 100),
          p_currency: String(payment.currency_id || "")
        })
      }
    );

    if (!rpcResponse.ok) {
      console.error(
        "Webhook: falha ao confirmar pagamento no Supabase.",
        "HTTP:",
        rpcResponse.status,
        await rpcResponse.text()
      );

      return reply(500);
    }

    console.info(
      "Webhook: pagamento aprovado e pedido processado.",
      orderId
    );

    return reply(200);
  } catch (error) {
    console.error("Webhook: erro inesperado.", error);
    return reply(500);
  }
}
