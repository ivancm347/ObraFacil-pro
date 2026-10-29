import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

export default function OfertasAfiliadas({ temaEscuro, cardBg, border, mostrarNotificacao }) {
  const [ofertas, setOfertas] = useState([])
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', categoria: 'Ferramentas', imagem: '', link: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const texto = temaEscuro ? '#e2e8f0' : '#1e293b'
  const campo = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: `1px solid ${border}`, borderRadius: 10, background: temaEscuro ? '#0f172a' : '#fff', color: texto, font: 'inherit' }
  const categorias = ['Ferramentas', 'Drywall', 'Elétrica', 'Hidráulica', 'Pintura', 'Segurança', 'Outros']

  const carregarOfertas = async () => {
    if (!supabaseConfigured) { setCarregando(false); return }
    const { data, error: e } = await supabase.from('ofertas').select('*').order('created_at', { ascending: false })
    if (e) setErro('Não foi possível carregar as ofertas: ' + e.message)
    else setOfertas((data || []).map(o => ({ ...o, id: o.id, nome: o.nome, descricao: o.descricao_curta || '', preco: o.preco ?? '', categoria: o.categoria || 'Outros', imagem: o.link_imagem || '', link: o.link_afiliado || '' })))
    setCarregando(false)
  }

  const verificarAdmin = async (user) => {
    setUsuario(user || null)
    if (!user) { setAdmin(false); return }
    const { data, error: e } = await supabase.rpc('obrafacil_e_admin')
    setAdmin(!e && data === true)
    if (e) setErro('Não foi possível verificar o administrador. Confira as políticas no Supabase.')
    else if (data !== true) setErro('Esta conta não está autorizada como administradora.')
  }

  useEffect(() => {
    if (!supabaseConfigured) { setCarregando(false); return }
    let ativo = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return
      await verificarAdmin(data.session?.user || null)
      await carregarOfertas()
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return
      setErro('')
      verificarAdmin(session?.user || null)
      carregarOfertas()
    })
    return () => { ativo = false; listener.subscription.unsubscribe() }
  }, [])

  const entrar = async (e) => {
    e.preventDefault()
    setErro('')
    const { data, error: eLogin } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (eLogin) { setErro('Não foi possível entrar: confira e-mail, senha e confirmação do e-mail.'); return }
    await verificarAdmin(data.user)
    setSenha('')
    await carregarOfertas()
  }

  const sair = async () => { await supabase.auth.signOut(); setUsuario(null); setAdmin(false); setMostrarForm(false) }

  const salvar = async (e) => {
    e.preventDefault()
    if (!admin) { setErro('Somente o administrador pode publicar ofertas.'); return }
    if (!form.nome.trim() || !form.link.trim()) { mostrarNotificacao('Informe o nome do produto e o link de afiliado.'); return }
    let url
    try { url = new URL(form.link.trim()) } catch { mostrarNotificacao('Digite um link válido começando com https://'); return }
    if (!['https:', 'http:'].includes(url.protocol)) { mostrarNotificacao('Use um endereço web válido.'); return }
    setErro('')
    const registro = { nome: form.nome.trim(), descricao_curta: form.descricao.trim() || null, preco: form.preco === '' ? null : Number(form.preco), categoria: form.categoria, link_imagem: form.imagem.trim() || null, link_afiliado: url.href, publicada: true }
    const { error: eSalvar } = await supabase.from('ofertas').insert(registro)
    if (eSalvar) { setErro('Não foi possível publicar: ' + eSalvar.message); return }
    setForm({ nome: '', descricao: '', preco: '', categoria: 'Ferramentas', imagem: '', link: '' })
    setMostrarForm(false)
    mostrarNotificacao('Oferta publicada para todos os clientes!')
    await carregarOfertas()
  }

  const remover = async (id) => {
    if (!admin) return
    if (!confirm('Remover esta oferta da vitrine de todos os clientes?')) return
    const { error: eRemover } = await supabase.from('ofertas').delete().eq('id', id)
    if (eRemover) { setErro('Não foi possível remover: ' + eRemover.message); return }
    mostrarNotificacao('Oferta removida da vitrine.')
    await carregarOfertas()
  }

  const filtradas = ofertas.filter(o => `${o.nome} ${o.descricao} ${o.categoria}`.toLowerCase().includes(busca.toLowerCase()))
  const moeda = (v) => v !== '' && v != null && Number.isFinite(Number(v)) ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: texto }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Ofertas e Afiliados</h2>
        <p style={{ margin: '6px 0 0', opacity: .7, fontSize: 13 }}>Ofertas publicadas aqui ficam disponíveis para todos os clientes.</p>
      </div>
      {admin && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 800 }}>Administrador</span>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ border: 0, borderRadius: 11, padding: '12px 16px', background: '#F05A28', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{mostrarForm ? 'Cancelar' : '+ Adicionar oferta'}</button>
        <button onClick={sair} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px', background: 'transparent', color: texto, cursor: 'pointer' }}>Sair</button>
      </div>}
    </div>

    <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12, background: temaEscuro ? '#1b293c' : '#fff7ed', fontSize: 12, lineHeight: 1.5 }}>
      <strong>Transparência:</strong> alguns links desta vitrine podem gerar comissão, sem custo extra para quem compra.
    </div>

    {!supabaseConfigured && <div style={{ padding: 16, border: '1px solid #f59e0b', borderRadius: 12, background: temaEscuro ? '#422006' : '#fffbeb' }}>
      <strong>Falta configurar a conexão com o banco.</strong>
      <p style={{ marginBottom: 0 }}>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de build do GitHub Actions e publique novamente.</p>
    </div>}

    {supabaseConfigured && !usuario && <form onSubmit={entrar} style={{ display: 'grid', gap: 10, maxWidth: 430, background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 16 }}>
      <strong>Área administrativa</strong>
      <span style={{ fontSize: 12, opacity: .75 }}>Entre com o e-mail e a senha da conta autorizada no Supabase. Os clientes não precisam entrar para ver as ofertas.</span>
      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" autoComplete="username" style={campo} />
      <input required type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" autoComplete="current-password" style={campo} />
      <button type="submit" style={{ border: 0, borderRadius: 10, padding: 12, background: '#334155', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Entrar como administrador</button>
    </form>}

    {erro && <div role="alert" style={{ padding: 12, borderRadius: 10, background: temaEscuro ? '#451a1a' : '#fef2f2', color: temaEscuro ? '#fecaca' : '#991b1b', fontSize: 13 }}>{erro}</div>}

    {mostrarForm && admin && <form onSubmit={salvar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Nome do produto *
        <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Nível a laser" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Preço (R$)
        <input type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="199.90" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Categoria
        <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ ...campo, marginTop: 6 }}>{categorias.map(c => <option key={c}>{c}</option>)}</select>
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Link de afiliado *
        <input required type="url" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Link da imagem (opcional)
        <input type="url" value={form.imagem} onChange={e => setForm({ ...form, imagem: e.target.value })} placeholder="https://.../imagem.jpg" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Descrição curta
        <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Benefício principal" style={{ ...campo, marginTop: 6 }} />
      </label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: '12px 18px', background: '#16a34a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Publicar oferta</button>
      </div>
    </form>}

    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ofertas..." style={{ ...campo, maxWidth: 440 }} />
    {carregando ? <p>Carregando ofertas...</p> : filtradas.length === 0 ? <div style={{ background: cardBg, border: `1px dashed ${border}`, borderRadius: 16, padding: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🛍️</div>
      <h3 style={{ margin: '0 0 8px' }}>{busca ? 'Nenhuma oferta encontrada' : 'Ainda não há ofertas publicadas'}</h3>
      <p style={{ margin: 0, opacity: .7, fontSize: 13 }}>{admin ? 'Use “Adicionar oferta” para publicar o primeiro produto.' : 'As novas ofertas aparecerão aqui assim que forem publicadas.'}</p>
    </div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
      {filtradas.map(o => <article key={o.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 155, background: temaEscuro ? '#0f172a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {o.imagem ? <img src={o.imagem} alt={o.nome} loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none' }} /> : <span style={{ fontSize: 44 }}>🧰</span>}
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .6, color: '#F05A28', fontWeight: 800 }}>{o.categoria}</span>
          <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.35 }}>{o.nome}</h3>
          {o.descricao && <p style={{ margin: 0, fontSize: 12, opacity: .7 }}>{o.descricao}</p>}
          {moeda(o.preco) && <strong style={{ fontSize: 18 }}>{moeda(o.preco)}</strong>}
          <a href={o.link} target="_blank" rel="sponsored nofollow noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#F05A28', color: '#fff', borderRadius: 10, padding: '11px 10px', fontWeight: 800, fontSize: 13, marginTop: 'auto' }}>Ver oferta ↗</a>
          {admin && <button type="button" onClick={() => remover(o.id)} style={{ border: `1px solid ${border}`, background: 'transparent', color: texto, borderRadius: 9, padding: 8, cursor: 'pointer', fontSize: 11 }}>Remover da vitrine</button>}
        </div>
      </article>)}
    </div>}
  </div>
}
