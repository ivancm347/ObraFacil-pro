const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://ivancm347.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
}

const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) })

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Método não permitido.' })

  const origin = event.headers.origin || event.headers.Origin
  if (origin !== 'https://ivancm347.github.io') return reply(403, { error: 'Origem não autorizada.' })

  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!mpToken || !supabaseUrl || !serviceKey) return reply(503, { error: 'Pagamento ainda não configurado no servidor.' })

  let email
  try {
    const body = JSON.parse(event.body || '{}')
    email = String(body.email || '').trim().toLowerCase()
  } catch {
    return reply(400, { error: 'Dados inválidos.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return reply(400, { error: 'Informe um e-mail válido para vincular a licença.' })
  }

  try {
    const orderId = crypto.randomUUID()
    const insert = await fetch(`${supabaseUrl}/rest/v1/pro_orders`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id: orderId, email, status: 'pending', amount: 14.99, product: 'ObraFácil PRO vitalício' })
    })
    if (!insert.ok) throw new Error('Não foi possível registrar o pedido.')

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'obrafacil-pro-lifetime', title: 'ObraFácil PRO — Licença vitalícia', description: 'Pagamento único, sem mensalidade', quantity: 1, currency_id: 'BRL', unit_price: 14.99 }],
        payer: { email },
        external_reference: orderId,
        notification_url: `${process.env.URL}/.netlify/functions/payment-webhook`,
        back_urls: {
          success: 'https://ivancm347.github.io/ObraFacil-pro/?pagamento=retorno',
          pending: 'https://ivancm347.github.io/ObraFacil-pro/?pagamento=pendente',
          failure: 'https://ivancm347.github.io/ObraFacil-pro/?pagamento=falhou'
        },
        auto_return: 'approved',
        statement_descriptor: 'OBRAFACIL PRO'
      })
    })
    const preference = await response.json()
    if (!response.ok || !preference.init_point) {
      await fetch(`${supabaseUrl}/rest/v1/pro_orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'checkout_error' })
      })
      return reply(502, { error: 'O Mercado Pago não conseguiu criar o checkout. Tente novamente.' })
    }
    await fetch(`${supabaseUrl}/rest/v1/pro_orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference_id: preference.id })
    })
    return reply(200, { checkoutUrl: preference.init_point })
  } catch (error) {
    console.error('Falha ao criar checkout:', error.message)
    return reply(500, { error: 'Não foi possível iniciar o pagamento.' })
  }
}
