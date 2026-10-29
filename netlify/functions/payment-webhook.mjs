const reply = (statusCode, body = 'ok') => ({ statusCode, headers: { 'Content-Type': 'text/plain' }, body })

export async function handler(event) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') return reply(405, 'method not allowed')
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!mpToken || !supabaseUrl || !serviceKey) return reply(503, 'not configured')

  try {
    const payload = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : event.queryStringParameters || {}
    const type = payload.type || payload.topic
    const paymentId = payload.data?.id || payload['data.id'] || payload.id
    if (type && !['payment', 'merchant_order'].includes(String(type))) return reply(200)
    if (!paymentId || !/^\d+$/.test(String(paymentId))) return reply(200)

    // Never trust the webhook body as proof of payment: re-fetch payment directly from Mercado Pago.
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${mpToken}` }
    })
    if (!paymentResponse.ok) return reply(200)
    const payment = await paymentResponse.json()
    if (payment.status !== 'approved' || payment.currency_id !== 'BRL' || Number(payment.transaction_amount) !== 14.99) return reply(200)
    const orderId = String(payment.external_reference || '')
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return reply(200)

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/pro_orders?id=eq.${encodeURIComponent(orderId)}&select=id,email,status,amount`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' }
    })
    if (!orderResponse.ok) return reply(200)
    const orders = await orderResponse.json()
    const order = orders[0]
    if (!order || Number(order.amount) !== 14.99) return reply(200)

    // Idempotent activation: repeated webhook deliveries update the same order/license.
    const update = await fetch(`${supabaseUrl}/rest/v1/pro_orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', payment_id: String(payment.id), paid_at: payment.date_approved || new Date().toISOString() })
    })
    if (!update.ok) return reply(500, 'order update failed')

    const licenseResponse = await fetch(`${supabaseUrl}/rest/v1/pro_licenses?email=eq.${encodeURIComponent(order.email)}&select=id,email`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' }
    })
    if (!licenseResponse.ok) return reply(500, 'license lookup failed')
    const licenses = await licenseResponse.json()
    if (licenses.length) {
      const updated = await fetch(`${supabaseUrl}/rest/v1/pro_licenses?id=eq.${encodeURIComponent(licenses[0].id)}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true, payment_id: String(payment.id), updated_at: new Date().toISOString() })
      })
      if (!updated.ok) return reply(500, 'license update failed')
    } else {
      const created = await fetch(`${supabaseUrl}/rest/v1/pro_licenses`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: order.email, active: true, payment_id: String(payment.id) })
      })
      if (!created.ok) return reply(500, 'license creation failed')
    }
    return reply(200)
  } catch (error) {
    console.error('Webhook processing failed:', error.message)
    return reply(500, 'processing error')
  }
}
