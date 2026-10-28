import { useMemo, useState } from 'react'

const NOVA_OBRA = { nome: '', clienteId: '', clienteNome: '', orcamentoId: '', orcamentoNumero: '', endereco: '', tipo: 'Reforma geral', status: 'Planejada', inicio: '', previsao: '', valor: '', custo: '', observacoes: '' }

export default function Obras({ obras = [], setObras, clientes = [], orcamentos = [], mostrarNotificacao, temaEscuro, cardBg, border, formatarMoeda }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(NOVA_OBRA)

  const moeda = formatarMoeda || (v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
  const text = temaEscuro ? '#e5e7eb' : '#172033'
  const muted = temaEscuro ? '#9ca3af' : '#64748b'
  const borda = border || '#e2e8f0'
  const inputStyle = { width: '100%', padding: '11px 12px', border: `1px solid ${borda}`, borderRadius: 10, background: temaEscuro ? '#111827' : '#fff', color: text, boxSizing: 'border-box', font: 'inherit' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: muted, marginBottom: 6 }

  const obrasDoCliente = useMemo(() => {
    if (!form.clienteId) return []
    return obras.filter(o => o.clienteId === form.clienteId && o.id !== editando)
  }, [obras, form.clienteId, editando])

  const orcamentosDoCliente = useMemo(() => {
    if (!form.clienteId) return []
    return orcamentos.filter(o => o.clienteId === form.clienteId)
  }, [orcamentos, form.clienteId])

  const totais = useMemo(() => ({
    todas: obras.length,
    andamento: obras.filter(o => o.status === 'Em andamento').length,
    planejadas: obras.filter(o => o.status === 'Planejada').length,
    concluidas: obras.filter(o => o.status === 'Concluída').length,
    valor: obras.reduce((s, o) => s + Number(o.valor || 0), 0),
  }), [obras])

  const visiveis = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return obras.filter(o => {
      const bate = !termo || [o.nome, o.clienteNome, o.endereco, o.tipo, o.orcamentoNumero].some(v => String(v || '').toLowerCase().includes(termo))
      return bate && (filtro === 'Todas' || o.status === filtro)
    })
  }, [obras, busca, filtro])

  const abrirNova = () => { setEditando(null); setForm({ ...NOVA_OBRA }); setModal(true) }
  const abrirEdicao = obra => { setEditando(obra.id); setForm({ ...NOVA_OBRA, ...obra }); setModal(true) }

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId)
    const orcs = orcamentos.filter(o => o.clienteId === clienteId)
    const disponivel = orcs.find(o => !obras.some(ob => ob.orcamentoId === o.id)) || orcs[0]
    setForm(f => ({
      ...f,
      clienteId,
      clienteNome: cliente?.nome || '',
      orcamentoId: disponivel && !obras.some(ob => ob.orcamentoId === disponivel.id) ? disponivel.id : '',
      orcamentoNumero: disponivel?.numero || '',
      valor: disponivel && !obras.some(ob => ob.orcamentoId === disponivel.id) ? String(disponivel.valor || disponivel.total || '') : f.valor,
    }))
  }

  const handleOrcamentoChange = (orcamentoId) => {
    if (!orcamentoId) { setForm(f => ({ ...f, orcamentoId: '', orcamentoNumero: '' })); return }
    const orc = orcamentos.find(o => o.id === orcamentoId)
    setForm(f => ({
      ...f,
      orcamentoId,
      orcamentoNumero: orc?.numero || orc?.id || '',
      valor: String(orc?.valor || orc?.total || f.valor),
    }))
  }

  const salvar = e => {
    e.preventDefault()
    if (!form.nome.trim()) { mostrarNotificacao?.('Informe o nome da obra.'); return }
    const registro = { ...form, id: editando || `obra-${Date.now()}`, valor: Number(form.valor || 0), custo: Number(form.custo || 0), atualizadoEm: new Date().toISOString() }
    setObras(editando ? obras.map(o => o.id === editando ? registro : o) : [registro, ...obras])
    setModal(false)
    mostrarNotificacao?.(editando ? 'Obra atualizada!' : 'Obra cadastrada!')
  }

  const excluir = id => { if (window.confirm('Excluir esta obra?')) { setObras(obras.filter(o => o.id !== id)); mostrarNotificacao?.('Obra excluída.') } }

  const statusStyle = status => {
    if (status === 'Em andamento') return ['#dbeafe', '#1d4ed8']
    if (status === 'Concluída') return ['#dcfce7', '#166534']
    if (status === 'Pausada') return ['#fef3c7', '#92400e']
    return [temaEscuro ? '#263244' : '#f1f5f9', muted]
  }

  return (
    <div style={{ paddingBottom: 100, color: text }}>
      <style>{`
        .obras-lista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        @media(max-width:760px){.obras-lista{grid-template-columns:1fr}}
      `}</style>

      <section style={{ background: 'linear-gradient(120deg,#172033,#344860)', color: '#fff', borderRadius: 20, padding: '25px 26px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
        <div><div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, color: '#fdba9a', marginBottom: 8 }}>GESTÃO DE CAMPO</div><h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Obras e serviços</h1><p style={{ margin: 0, color: '#cbd5e1', fontSize: 12 }}>{totais.todas} obras • {totais.andamento} em andamento</p></div>
        <button onClick={abrirNova} style={{ padding: '12px 16px', border: 0, borderRadius: 11, background: '#f05a28', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>＋ Nova obra</button>
      </section>

      <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar obra, cliente, orçamento..." style={{ ...inputStyle, flex: '1 1 250px' }} />
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ ...inputStyle, flex: '0 1 190px' }}>{['Todas', 'Planejada', 'Em andamento', 'Pausada', 'Concluída'].map(s => <option key={s}>{s}</option>)}</select>
      </section>

      <div className="obras-lista">
        {visiveis.map(obra => {
          const [bg, color] = statusStyle(obra.status)
          const margem = Number(obra.valor || 0) - Number(obra.custo || 0)
          return (
            <article key={obra.id} style={{ background: cardBg || '#fff', border: `1px solid ${border || '#e8ecf2'}`, borderRadius: 18, padding: 19 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: muted, fontWeight: 800, textTransform: 'uppercase' }}>{obra.tipo}</div><h3 style={{ margin: '7px 0 5px', fontSize: 17 }}>{obra.nome}</h3><div style={{ fontSize: 12, color: muted }}>{obra.clienteNome}</div>{obra.orcamentoNumero && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 4 }}>Orç: {obra.orcamentoNumero}</div>}</div>
                <span style={{ background: bg, color, borderRadius: 20, padding: '5px 8px', fontSize: 10, fontWeight: 800 }}>{obra.status}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: muted }}>📍 {obra.endereco || 'Sem endereço'} • 📅 {obra.inicio || '—'} → {obra.previsao || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, padding: 12, borderRadius: 12, background: temaEscuro ? '#111827' : '#f8fafc' }}>
                <div><div style={{ fontSize: 10, color: muted }}>VALOR</div><strong>{moeda(obra.valor)}</strong></div>
                <div><div style={{ fontSize: 10, color: muted }}>SALDO</div><strong style={{ color: margem >= 0 ? '#16a34a' : '#dc2626' }}>{moeda(margem)}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => abrirEdicao(obra)} style={{ flex: 1, border: 0, borderRadius: 9, padding: 10, background: temaEscuro ? '#263244' : '#e9eef5', fontWeight: 700, cursor: 'pointer' }}>✎ Editar</button>
                <button onClick={() => excluir(obra.id)} style={{ border: 0, borderRadius: 9, padding: '10px 13px', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>Excluir</button>
              </div>
            </article>
          )
        })}
      </div>

      {modal && (
        <div onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(7,15,28,.65)', zIndex: 2000, padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <form onSubmit={salvar} style={{ background: cardBg || '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 720, margin: '22px 0' }}>
            <h2 style={{ margin: 0 }}>{editando ? 'Editar obra' : 'Nova obra'}</h2>
            {form.clienteId && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: temaEscuro ? '#111827' : '#f8fafc', fontSize: 12, color: muted }}>Cliente <b style={{ color: text }}>{form.clienteNome}</b> já tem <b>{obrasDoCliente.length}</b> obra(s) • {orcamentosDoCliente.length} orçamento(s) no total</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 16 }}>
              <div><label style={labelStyle}>Nome da obra *</label><input required autoFocus value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Reforma cozinha - Silva" style={inputStyle} /></div>
              <div><label style={labelStyle}>Tipo</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>{['Reforma geral', 'Drywall e gesso', 'Forro', 'Pintura', 'Elétrica', 'Hidráulica', 'Piso e revestimento', 'Construção', 'Outro'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label style={labelStyle}>Cliente</label><select value={form.clienteId} onChange={e => handleClienteChange(e.target.value)} style={inputStyle}><option value="">Selecione</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div><label style={labelStyle}>Orçamento (1 orçamento = 1 obra)</label><select value={form.orcamentoId} onChange={e => handleOrcamentoChange(e.target.value)} style={inputStyle}><option value="">Sem vínculo</option>{orcamentosDoCliente.map(o => { const usado = obras.find(ob => ob.orcamentoId === o.id && ob.id !== editando); return <option key={o.id} value={o.id} disabled={!!usado}>{o.numero || o.id.slice(0,8)} - {moeda(o.valor || o.total)} {usado ? `(já usado em: ${usado.nome})` : ''}</option> })}</select></div>
              <div><label style={labelStyle}>Endereço</label><input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>{['Planejada', 'Em andamento', 'Pausada', 'Concluída'].map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label style={labelStyle}>Valor (do orçamento)</label><input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} style={{ ...inputStyle, borderColor: form.orcamentoId ? '#16a34a' : borda }} /></div>
              <div><label style={labelStyle}>Custo estimado</label><input type="number" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 22 }}>
              <button type="button" onClick={() => setModal(false)} style={{ padding: '11px 15px', border: `1px solid ${borda}`, borderRadius: 10, background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" style={{ padding: '11px 18px', border: 0, borderRadius: 10, background: '#f05a28', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Salvar obra</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
