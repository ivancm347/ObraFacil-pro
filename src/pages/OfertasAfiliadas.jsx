import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'

const CHAVE = 'obrafacil_ofertas_afiliadas'

export default function OfertasAfiliadas({ temaEscuro, cardBg, border, mostrarNotificacao }) {
  const [ofertas, setOfertas] = useState([])
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', categoria: 'Ferramentas', imagem: '', link: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busca, setBusca] = useState('')
  const texto = temaEscuro ? '#e2e8f0' : '#1e293b'
  const campo = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: `1px solid ${border}`, borderRadius: 10, background: temaEscuro ? '#0f172a' : '#fff', color: texto, font: 'inherit' }
  const categorias = ['Ferramentas', 'Drywall', 'Elétrica', 'Hidráulica', 'Pintura', 'Segurança', 'Outros']

  useEffect(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE) || '[]')
      if (Array.isArray(salvas)) setOfertas(salvas)
    } catch { setOfertas([]) }
  }, [])

  const salvar = (lista) => {
    setOfertas(lista)
    localStorage.setItem(CHAVE, JSON.stringify(lista))
  }

  const adicionar = (e) => {
    e.preventDefault()
    if (!form.nome.trim() || !form.link.trim()) {
      mostrarNotificacao('Informe o nome do produto e o link de afiliado.')
      return
    }
    let url
    try { url = new URL(form.link.trim()) } catch {
      mostrarNotificacao('Digite um link válido começando com https://')
      return
    }
    if (!['https:', 'http:'].includes(url.protocol)) {
      mostrarNotificacao('Use um endereço web válido.')
      return
    }
    const oferta = { ...form, id: `oferta-${Date.now()}`, nome: form.nome.trim(), link: url.href, criadoEm: new Date().toISOString() }
    salvar([oferta, ...ofertas])
    setForm({ nome: '', descricao: '', preco: '', categoria: 'Ferramentas', imagem: '', link: '' })
    setMostrarForm(false)
    mostrarNotificacao('Produto de afiliado adicionado!')
  }

  const remover = (id) => {
    if (confirm('Remover este produto da vitrine?')) salvar(ofertas.filter(o => o.id !== id))
  }

  const filtradas = ofertas.filter(o => `${o.nome} ${o.descricao} ${o.categoria}`.toLowerCase().includes(busca.toLowerCase()))
  const moeda = (v) => v !== '' && Number.isFinite(Number(v)) ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: texto }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Ofertas e Afiliados</h2>
        <p style={{ margin: '6px 0 0', opacity: .7, fontSize: 13 }}>Divulgue ferramentas e materiais e ganhe comissão quando houver compra elegível.</p>
      </div>
      <button onClick={() => setMostrarForm(!mostrarForm)} style={{ border: 0, borderRadius: 11, padding: '12px 16px', background: '#F05A28', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
        {mostrarForm ? 'Cancelar' : '+ Adicionar produto'}
      </button>
    </div>

    <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12, background: temaEscuro ? '#1b293c' : '#fff7ed', fontSize: 12, lineHeight: 1.5 }}>
      <strong>Transparência:</strong> alguns links desta vitrine podem gerar comissão para o ObraFácil PRO, sem custo extra para quem compra. Cadastre apenas links de afiliado seus e ofertas que você tenha autorização para divulgar.
    </div>

    {mostrarForm && <form onSubmit={adicionar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Nome do produto *
        <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Nível a laser" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Preço (R$)
        <input type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="Ex.: 199,90" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Categoria
        <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ ...campo, marginTop: 6 }}>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Link de afiliado * (URL completa)
        <input required type="url" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Link da imagem (opcional)
        <input type="url" value={form.imagem} onChange={e => setForm({ ...form, imagem: e.target.value })} placeholder="https://.../imagem.jpg" style={{ ...campo, marginTop: 6 }} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 700 }}>Descrição curta
        <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Benefício principal do produto" style={{ ...campo, marginTop: 6 }} />
      </label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: '12px 18px', background: '#16a34a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Salvar produto</button>
      </div>
    </form>}

    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ofertas..." style={{ ...campo, maxWidth: 440 }} />

    {filtradas.length === 0 ? <div style={{ background: cardBg, border: `1px dashed ${border}`, borderRadius: 16, padding: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🛍️</div>
      <h3 style={{ margin: '0 0 8px' }}>{ofertas.length ? 'Nenhuma oferta encontrada' : 'Sua vitrine está pronta para receber produtos'}</h3>
      <p style={{ margin: 0, opacity: .7, fontSize: 13 }}>Clique em “Adicionar produto” e cole seu link de afiliado da Shopee, Mercado Livre ou outra plataforma em que você participe.</p>
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
          <button type="button" onClick={() => remover(o.id)} style={{ border: `1px solid ${border}`, background: 'transparent', color: texto, borderRadius: 9, padding: 8, cursor: 'pointer', fontSize: 11 }}>Remover da vitrine</button>
        </div>
      </article>)}
    </div>}
    <p style={{ fontSize: 11, opacity: .6, margin: 0 }}>Os produtos ficam salvos neste navegador. Para aparecerem em outro aparelho, será necessário cadastrar novamente ou implementar sincronização online. Confira sempre preço, estoque e regras do programa de afiliados.</p>
  </div>
}
