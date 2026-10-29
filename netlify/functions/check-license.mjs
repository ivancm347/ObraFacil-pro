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
  if ((event.headers.origin || event.headers.Origin) !== 'https://ivancm347.github.io') return reply(403, { error: 'Origem não autorizada.' })
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return reply(503, { error: 'Licenças ainda não configuradas.' })
  let email
  try { email = String(JSON.parse(event.body || '{}').email || '').trim().toLowerCase() } catch { return reply(400, { error: 'Dados inválidos.' }) }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { error: 'Informe um e-mail válido.' })
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/pro_licenses?email=eq.${encodeURIComponent(email)}&active=eq.true&select=email,active`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' }
    })
    if (!response.ok) return reply(502, { error: 'Não foi possível consultar a licença.' })
    const licenses = await response.json()
    return reply(200, { active: licenses.length > 0 })
  } catch {
    return reply(500, { error: 'Falha ao consultar a licença.' })
  }
}
