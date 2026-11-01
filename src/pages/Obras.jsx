import { useMemo, useState } from 'react'

const NOVA_OBRA = { nome: '', clienteId: '', clienteNome: '', orcamentoId: '', orcamentoNumero: '', endereco: '', tipo: 'Reforma geral', status: 'Planejada', inicio: '', previsao: '', valor: '', custo: '', adiantamento: 0, adiantamentos: [], pagamentos: [], despesas: [], observacoes: '' }

export default function Obras({ obras = [], setObras, setOrcamentos, clientes = [], orcamentos = [], mostrarNotificacao, temaEscuro, cardBg, border, formatarMoeda }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(NOVA_OBRA)
  const [financeiroObra, setFinanceiroObra] = useState(null)
  const [tipoLancamento, setTipoLancamento] = useState('adiantamento')
  const [lancamentoValor, setLancamentoValor] = useState('')
  const [lancamentoDescricao, setLancamentoDescricao] = useState('')
  const [lancamentoData, setLancamentoData] = useState(new Date().toISOString().slice(0, 10))
  const [categoriaDespesa, setCategoriaDespesa] = useState('Outros')
  const [colaborador, setColaborador] = useState('')
  const [diasTrabalhados, setDiasTrabalhados] = useState('1')
  const [valorDiaria, setValorDiaria] = useState('')
  const [observacaoDespesa, setObservacaoDespesa] = useState('')
  const [editandoDespesaId, setEditandoDespesaId] = useState(null)

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

  // A obra passa a ser a fonte oficial dos recebimentos.
  const orcamentoDaObra = obra => obra?.orcamentoId ? orcamentos.find(o => o.id === obra.orcamentoId) : null
  const pagamentosDaObra = obra => {
    const adiantamentos = Array.isArray(obra.adiantamentos) ? obra.adiantamentos : []
    const parcelas = Array.isArray(obra.pagamentos) ? obra.pagamentos : []
    const entradaLegada = Math.max(0, Number(obra.adiantamento || 0))
    const entrada = entradaLegada + adiantamentos.reduce((s, a) => s + Math.max(0, Number(a.valor || 0)), 0)
    return { adiantamento: entrada, adiantamentos, entradaLegada, pagamentos: parcelas, total: entrada + parcelas.reduce((s, p) => s + Math.max(0, Number(p.valor || 0)), 0), vinculado: !!obra.orcamentoId }
  }
  const sincronizarHistoricoOrcamento = obra => {
    if (!obra?.orcamentoId || !setOrcamentos) return
    const recebido = pagamentosDaObra(obra).total
    // Atualização funcional evita perder lançamentos por usar uma lista antiga
    // de orçamentos capturada antes do último recebimento.
    setOrcamentos(listaAtual => (Array.isArray(listaAtual) ? listaAtual : orcamentos).map(o =>
      String(o.id) === String(obra.orcamentoId)
        ? {
            ...o,
            adiantamento: Number(obra.adiantamento || 0),
            adiantamentos: Array.isArray(obra.adiantamentos) ? obra.adiantamentos : [],
            pagamentos: Array.isArray(obra.pagamentos) ? obra.pagamentos : [],
            saldoRestante: Math.max(0, Number(o.total ?? obra.valor ?? 0) - recebido)
          }
        : o
    ))
  }
  const recebidoObra = obra => pagamentosDaObra(obra).total
  const despesasObra = obra => Array.isArray(obra.despesas) ? obra.despesas.reduce((s, d) => s + Number(d.valor || 0), 0) : 0
  const saldoReceber = obra => Math.max(0, Number(obra.valor || 0) - recebidoObra(obra))

  const totais = useMemo(() => ({
    todas: obras.length,
    andamento: obras.filter(o => o.status === 'Em andamento').length,
    planejadas: obras.filter(o => o.status === 'Planejada').length,
    concluidas: obras.filter(o => o.status === 'Concluída').length,
    valor: obras.reduce((s, o) => s + Number(o.valor || 0), 0),
    custo: obras.reduce((s, o) => s + Number(o.custo || 0), 0),
    resultado: obras.reduce((s, o) => s + Number(o.valor || 0) - Number(o.custo || 0), 0),
    recebido: obras.reduce((s, o) => s + recebidoObra(o), 0),
    receber: obras.reduce((s, o) => s + saldoReceber(o), 0),
    despesas: obras.reduce((s, o) => s + despesasObra(o), 0),
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
    const orcamento = form.orcamentoId ? orcamentos.find(o => o.id === form.orcamentoId) : null
    const anterior = editando ? obras.find(o => o.id === editando) : null
    let pagamentos = Array.isArray(form.pagamentos) ? form.pagamentos : []
    let adiantamentos = Array.isArray(form.adiantamentos) ? form.adiantamentos : []
    let adiantamento = Number(form.adiantamento || 0)
    const migrado = anterior?.financeiroMigradoDeOrcamentoId === form.orcamentoId
    if (orcamento && !migrado && !pagamentos.length && !adiantamentos.length && !adiantamento) {
      pagamentos = Array.isArray(orcamento.pagamentos) ? [...orcamento.pagamentos] : []
      adiantamentos = Array.isArray(orcamento.adiantamentos) ? [...orcamento.adiantamentos] : []
      adiantamento = Math.max(0, Number(orcamento.adiantamento || 0))
    }
    const registro = { ...form, id: editando || `obra-${Date.now()}`, valor: Number(form.valor || 0), custo: Number(form.custo || 0), adiantamento, adiantamentos, pagamentos, ...(orcamento ? { financeiroMigradoDeOrcamentoId: form.orcamentoId } : {}), atualizadoEm: new Date().toISOString() }
    setObras(editando ? obras.map(o => o.id === editando ? registro : o) : [registro, ...obras])
    sincronizarHistoricoOrcamento(registro)
    setModal(false)
    mostrarNotificacao?.(editando ? 'Obra atualizada!' : 'Obra cadastrada!')
  }

  // Recupera somente registros antigos que tenham identificação explícita de adiantamento.
  const recuperarAdiantamentosLegados = obra => {
    const despesas = Array.isArray(obra?.despesas) ? obra.despesas : []
    const reconhecer = item => {
      const texto = [item?.tipo, item?.categoria, item?.descricao, item?.motivo, item?.observacao]
        .filter(Boolean).join(' ').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()
      return texto.includes('adiantamento')
    }
    const antigos = despesas.filter(reconhecer)
    if (!antigos.length) return obra
    const restantes = despesas.filter(item => !reconhecer(item))
    const atuais = Array.isArray(obra.adiantamentos) ? obra.adiantamentos : []
    const ids = new Set(atuais.map(item => String(item.id)))
    const migrados = antigos.filter(item => !ids.has(String(item.id))).map(item => ({
      ...item,
      id: item.id || `adiantamento-recuperado-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      motivo: item.motivo || 'Adiantamento recuperado',
      descricao: item.descricao || 'Adiantamento recebido'
    }))
    const atualizado = { ...obra, despesas: restantes, adiantamentos: [...atuais, ...migrados], atualizadoEm: new Date().toISOString() }
    setObras(lista => lista.map(item => item.id === atualizado.id ? atualizado : item))
    sincronizarHistoricoOrcamento(atualizado)
    setFinanceiroObra(atualizado)
    mostrarNotificacao?.(`${migrados.length} adiantamento(s) recuperado(s) do histórico.`)
    return atualizado
  }

  const iniciarEdicaoDespesa = item => {
    setTipoLancamento('despesa')
    setEditandoDespesaId(item.id)
    setCategoriaDespesa(item.categoria || 'Outros')
    setLancamentoDescricao(item.descricao || '')
    setLancamentoData(item.data || new Date().toISOString().slice(0, 10))
    setObservacaoDespesa(item.observacao || '')
    setColaborador(item.colaborador || '')
    setDiasTrabalhados(String(item.dias || 1))
    setValorDiaria(String(item.valorDiaria || ''))
    setLancamentoValor(String(item.valor || ''))
  }

  const limparFormularioLancamento = () => {
    setLancamentoValor('')
    setLancamentoDescricao('')
    setObservacaoDespesa('')
    setColaborador('')
    setDiasTrabalhados('1')
    setValorDiaria('')
    setEditandoDespesaId(null)
  }

  const registrarLancamento = e => {
    e.preventDefault()
    if (!financeiroObra) return
    const diaria = categoriaDespesa === 'Diária de colaborador' && tipoLancamento === 'despesa'
    const dias = Number(String(diasTrabalhados).replace(',', '.'))
    const taxaDiaria = Number(String(valorDiaria).replace(',', '.'))
    const valor = diaria ? dias * taxaDiaria : Number(String(lancamentoValor).replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) { mostrarNotificacao?.('Informe um valor maior que zero.'); return }
    const chave = tipoLancamento === 'adiantamento' ? 'adiantamentos' : tipoLancamento === 'quitacao' ? 'pagamentos' : 'despesas'
    const lista = Array.isArray(financeiroObra[chave]) ? financeiroObra[chave] : []
    if (diaria && (!colaborador.trim() || !Number.isFinite(dias) || dias <= 0 || !Number.isFinite(taxaDiaria) || taxaDiaria <= 0)) { mostrarNotificacao?.('Informe o colaborador, os dias e o valor da diária.'); return }
    const registroLancamento = {
      id: editandoDespesaId || `fin-${Date.now()}`,
      valor: Math.round(valor * 100) / 100,
      descricao: diaria ? `Diária — ${colaborador.trim()}` : (lancamentoDescricao.trim() || (tipoLancamento === 'adiantamento' ? 'Adiantamento recebido' : tipoLancamento === 'quitacao' ? 'Quitação da obra' : 'Despesa da obra')),
      data: lancamentoData || new Date().toISOString().slice(0, 10),
      ...(tipoLancamento === 'despesa' ? { categoria: categoriaDespesa, observacao: observacaoDespesa.trim(), ...(diaria ? { colaborador: colaborador.trim(), dias, valorDiaria: Math.round(taxaDiaria * 100) / 100 } : {}) } : tipoLancamento === 'adiantamento' ? { motivo: 'Adiantamento', observacao: lancamentoDescricao.trim() } : {})
    }
    const novaLista = editandoDespesaId && tipoLancamento === 'despesa' ? lista.map(item => item.id === editandoDespesaId ? registroLancamento : item) : [...lista, registroLancamento]
    const atualizado = { ...financeiroObra, [chave]: novaLista, atualizadoEm: new Date().toISOString() }
    setObras(obras.map(o => o.id === atualizado.id ? atualizado : o))
    if (tipoLancamento !== 'despesa') sincronizarHistoricoOrcamento(atualizado)
    setFinanceiroObra(atualizado)
    limparFormularioLancamento()
    mostrarNotificacao?.(tipoLancamento === 'adiantamento' ? 'Adiantamento registrado!' : tipoLancamento === 'quitacao' ? 'Quitação registrada!' : editandoDespesaId ? 'Despesa atualizada!' : 'Despesa registrada!')
  }

  const excluirLancamento = (tipo, id) => {
    if (!financeiroObra) return
    const chave = tipo === 'adiantamento' ? 'adiantamentos' : tipo === 'pagamento' ? 'pagamentos' : 'despesas'
    const atualizado = { ...financeiroObra, [chave]: (financeiroObra[chave] || []).filter(item => item.id !== id) }
    setObras(obras.map(o => o.id === atualizado.id ? atualizado : o))
    if (tipo !== 'despesa') sincronizarHistoricoOrcamento(atualizado)
    setFinanceiroObra(atualizado)
    if (editandoDespesaId === id) limparFormularioLancamento()
    mostrarNotificacao?.('Lançamento excluído.')
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

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, margin: '16px 0' }}>
        {[
          { label: 'Valor contratado', valor: totais.valor, cor: '#2563eb' },
          { label: 'Custo estimado', valor: totais.custo, cor: '#d97706' },
          { label: 'Resultado previsto', valor: totais.resultado, cor: totais.resultado >= 0 ? '#16a34a' : '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: cardBg || '#fff', border: `1px solid ${borda}`, borderRadius: 15, padding: 15 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: muted, textTransform: 'uppercase', letterSpacing: '.4px' }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 850, color: k.cor, marginTop: 7 }}>{moeda(k.valor)}</div>
            <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>Somatório de todas as obras</div>
          </div>
        ))}
      </section>

      <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar obra, cliente, orçamento..." style={{ ...inputStyle, flex: '1 1 250px' }} />
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ ...inputStyle, flex: '0 1 190px' }}>{['Todas', 'Planejada', 'Em andamento', 'Pausada', 'Concluída'].map(s => <option key={s}>{s}</option>)}</select>
      </section>

      <div className="obras-lista">
        {visiveis.map(obra => {
          const [bg, color] = statusStyle(obra.status)
          const margem = Number(obra.valor || 0) - Number(obra.custo || 0) - despesasObra(obra)
          const recebido = recebidoObra(obra)
          return (
            <article key={obra.id} style={{ background: cardBg || '#fff', border: `1px solid ${border || '#e8ecf2'}`, borderRadius: 18, padding: 19 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: muted, fontWeight: 800, textTransform: 'uppercase' }}>{obra.tipo}</div><h3 style={{ margin: '7px 0 5px', fontSize: 17 }}>{obra.nome}</h3><div style={{ fontSize: 12, color: muted }}>{obra.clienteNome}</div>{obra.orcamentoNumero && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 4 }}>Orç: {obra.orcamentoNumero}</div>}</div>
                <span style={{ background: bg, color, borderRadius: 20, padding: '5px 8px', fontSize: 10, fontWeight: 800 }}>{obra.status}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: muted }}>📍 {obra.endereco || 'Sem endereço'} • 📅 {obra.inicio || '—'} → {obra.previsao || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, padding: 12, borderRadius: 12, background: temaEscuro ? '#111827' : '#f8fafc' }}>
                <div><div style={{ fontSize: 10, color: muted }}>VALOR CONTRATADO</div><strong>{moeda(obra.valor)}</strong><div style={{ fontSize: 10, color: muted, marginTop: 5 }}>Custo: {moeda(obra.custo)}</div></div>
                <div><div style={{ fontSize: 10, color: muted }}>RESULTADO APÓS DESPESAS</div><strong style={{ color: margem >= 0 ? '#16a34a' : '#dc2626' }}>{moeda(margem)}</strong><div style={{ fontSize: 10, color: muted, marginTop: 5 }}>Recebido: {moeda(recebido)} • Falta: {moeda(saldoReceber(obra))}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { recuperarAdiantamentosLegados(obra); setTipoLancamento('adiantamento'); limparFormularioLancamento(); setCategoriaDespesa('Outros'); setLancamentoData(new Date().toISOString().slice(0, 10)) }} style={{ flex: 1, border: 0, borderRadius: 9, padding: 10, background: '#dcfce7', color: '#166534', fontWeight: 800, cursor: 'pointer' }}>💰 Financeiro</button>
                <button onClick={() => abrirEdicao(obra)} style={{ flex: 1, border: 0, borderRadius: 9, padding: 10, background: temaEscuro ? '#263244' : '#e9eef5', fontWeight: 700, cursor: 'pointer' }}>✎ Editar</button>
                <button onClick={() => excluir(obra.id)} style={{ border: 0, borderRadius: 9, padding: '10px 13px', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>Excluir</button>
              </div>
            </article>
          )
        })}
      </div>

      {financeiroObra && (
        <div onMouseDown={e => { if (e.target === e.currentTarget) setFinanceiroObra(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(7,15,28,.72)', zIndex: 2100, padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          <section style={{ background: cardBg || '#fff', color: text, borderRadius: 20, padding: 22, width: '100%', maxWidth: 680, margin: '20px 0' }}>
            <h2 style={{ margin: '0 0 4px' }}>Financeiro da obra</h2>
            <div style={{ color: muted, fontSize: 13, marginBottom: 16 }}>{financeiroObra.nome}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(135px,1fr))', gap: 10 }}>
              {[
                { label: 'Contratado', valor: Number(financeiroObra.valor || 0), cor: '#2563eb' },
                { label: 'Adiantamento', valor: pagamentosDaObra(financeiroObra).adiantamento, cor: '#7c3aed' },
                { label: 'Recebido total', valor: recebidoObra(financeiroObra), cor: '#16a34a' },
                { label: 'Falta receber', valor: saldoReceber(financeiroObra), cor: '#d97706' },
                { label: 'Despesas lançadas', valor: despesasObra(financeiroObra), cor: '#dc2626' },
                { label: 'Resultado líquido', valor: recebidoObra(financeiroObra) - despesasObra(financeiroObra), cor: recebidoObra(financeiroObra) - despesasObra(financeiroObra) >= 0 ? '#16a34a' : '#dc2626' },
              ].map(k => <div key={k.label} style={{ border: `1px solid ${borda}`, borderRadius: 12, padding: 12 }}><div style={{ color: muted, fontSize: 10, fontWeight: 800 }}>{k.label.toUpperCase()}</div><div style={{ color: k.cor, fontWeight: 850, fontSize: 17, marginTop: 6 }}>{moeda(k.valor)}</div></div>)}
            </div>
            {orcamentoDaObra(financeiroObra) && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: temaEscuro ? '#163b2b' : '#e8f8ef', color: temaEscuro ? '#bbf7d0' : '#166534', fontSize: 12 }}>Esta obra está vinculada ao orçamento #{orcamentoDaObra(financeiroObra).numero || ''}. Os recebimentos e o adiantamento são consultados automaticamente nele. Registre aqui os recebimentos e as despesas. O orçamento exibirá o histórico automaticamente.</div>}
            <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: temaEscuro ? '#111827' : '#f8fafc' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{editandoDespesaId ? 'Editar despesa' : 'Registrar lançamento'}</h3>
              <form onSubmit={registrarLancamento} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10 }}>
                <select value={tipoLancamento} onChange={e => { setTipoLancamento(e.target.value); setEditandoDespesaId(null) }} style={inputStyle}><option value="adiantamento">Adiantamento recebido</option><option value="quitacao">Quitação final da obra</option><option value="despesa">Despesa da obra</option></select>
                {tipoLancamento === 'despesa' && <select value={categoriaDespesa} onChange={e => setCategoriaDespesa(e.target.value)} style={inputStyle}>{['Combustível', 'Alimentação / almoço', 'Café', 'Transporte', 'Materiais extras', 'Diária de colaborador', 'Ferramentas', 'Outros'].map(v => <option key={v}>{v}</option>)}</select>}
                {tipoLancamento === 'despesa' && categoriaDespesa === 'Diária de colaborador' ? <>
                  <input required value={colaborador} onChange={e => setColaborador(e.target.value)} placeholder="Nome do colaborador" style={inputStyle} />
                  <input required type="number" min="0.5" step="0.5" value={diasTrabalhados} onChange={e => setDiasTrabalhados(e.target.value)} placeholder="Quantidade de dias" style={inputStyle} />
                  <input required type="number" min="0.01" step="0.01" value={valorDiaria} onChange={e => setValorDiaria(e.target.value)} placeholder="Valor por diária R$" style={inputStyle} />
                  <div style={{ padding: 11, borderRadius: 10, background: temaEscuro ? '#263244' : '#e8f8ef', fontWeight: 800, color: '#16a34a' }}>Total: {moeda((Number(diasTrabalhados) || 0) * (Number(valorDiaria) || 0))}</div>
                </> : <input required type="number" min="0.01" step="0.01" value={lancamentoValor} onChange={e => setLancamentoValor(e.target.value)} onFocus={e => e.currentTarget.select()} placeholder="Valor R$" style={inputStyle} />}
                <input type="date" value={lancamentoData} onChange={e => setLancamentoData(e.target.value)} style={inputStyle} />
                {tipoLancamento === 'despesa' && <input value={lancamentoDescricao} onChange={e => setLancamentoDescricao(e.target.value)} placeholder="Descrição / detalhe" style={inputStyle} />}
                {tipoLancamento === 'despesa' && <input value={observacaoDespesa} onChange={e => setObservacaoDespesa(e.target.value)} placeholder="Observação (opcional)" style={inputStyle} />}
                {tipoLancamento !== 'despesa' && <input value={lancamentoDescricao} onChange={e => setLancamentoDescricao(e.target.value)} placeholder={tipoLancamento === 'adiantamento' ? 'Observação do adiantamento (opcional)' : 'Detalhe da quitação (opcional)'} style={inputStyle} />}
                <button type="submit" style={{ border: 0, borderRadius: 10, background: '#f05a28', color: '#fff', fontWeight: 800, padding: 11, cursor: 'pointer' }}>{editandoDespesaId ? 'Salvar alteração' : '＋ Registrar'}</button>
                {editandoDespesaId && <button type="button" onClick={limparFormularioLancamento} style={{ border: `1px solid ${borda}`, borderRadius: 10, background: 'transparent', color: text, padding: 10, cursor: 'pointer' }}>Cancelar edição</button>}
              </form>
            </div>
            {(() => {
              const financeiro = pagamentosDaObra(financeiroObra)
              const listaPagamentos = [...(financeiro.pagamentos || []).map(p => ({ ...p, tipoLancamento: 'pagamento' })), ...(financeiro.entradaLegada > 0 ? [{ id: 'adiantamento-inicial', valor: financeiro.entradaLegada, descricao: 'Adiantamento anterior', data: '', tipoLancamento: 'adiantamento' }] : []), ...(financeiro.adiantamentos || []).map(a => ({ ...a, tipoLancamento: 'adiantamento', descricao: [a.motivo || 'Adiantamento', a.observacao].filter(Boolean).join(' — ') }))]
              return [{ tipo: 'pagamento', titulo: financeiro.vinculado ? 'Adiantamentos e quitação (sincronizados no orçamento)' : 'Adiantamentos e pagamentos recebidos', lista: listaPagamentos }, { tipo: 'despesa', titulo: 'Despesas da obra', lista: financeiroObra.despesas || [] }]
            })().map(grupo => (
              <div key={grupo.tipo} style={{ marginTop: 18 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{grupo.titulo}</h3>
                {grupo.lista.length === 0 ? <div style={{ color: muted, fontSize: 12 }}>Nenhum lançamento ainda.</div> : grupo.lista.map(item => <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${borda}` }}><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{item.categoria ? `${item.categoria} — ` : ''}{item.descricao}</div><div style={{ color: muted, fontSize: 11 }}>{item.data || 'Adiantamento cadastrado'}{item.dias ? ` • ${item.dias} dia(s) × ${moeda(item.valorDiaria)}` : ''}{item.observacao ? ` • ${item.observacao}` : ''}</div></div><strong style={{ color: grupo.tipo === 'pagamento' ? '#16a34a' : '#dc2626' }}>{moeda(item.valor)}</strong>{grupo.tipo === 'despesa' && <button type="button" onClick={() => iniciarEdicaoDespesa(item)} style={{ border: 0, borderRadius: 8, padding: 7, color: '#1d4ed8', background: '#dbeafe', cursor: 'pointer' }}>Editar</button>}{item.id !== 'adiantamento-inicial' && <button type="button" onClick={() => excluirLancamento(item.tipoLancamento || grupo.tipo, item.id)} style={{ border: 0, borderRadius: 8, padding: 7, color: '#b91c1c', background: '#fee2e2', cursor: 'pointer' }}>Excluir</button>}</div>)}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button type="button" onClick={() => setFinanceiroObra(null)} style={{ border: 0, borderRadius: 10, background: '#f05a28', color: '#fff', padding: '11px 18px', fontWeight: 800, cursor: 'pointer' }}>Fechar</button></div>
          </section>
        </div>
      )}

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
              <div><label style={labelStyle}>Valor (do orçamento)</label><input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} onFocus={e => e.currentTarget.select()} style={{ ...inputStyle, borderColor: form.orcamentoId ? '#16a34a' : borda }} /></div>
              <div><label style={labelStyle}>Custo estimado</label><input type="number" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} onFocus={e => e.currentTarget.select()} style={inputStyle} /></div>
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
