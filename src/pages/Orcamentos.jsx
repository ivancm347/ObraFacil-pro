import { useState } from 'react'
import jsPDF from 'jspdf'
import { LIMITE_GRATIS } from '../constants.js'
const getLicenciado = () => {
  try { return localStorage.getItem('obrafacil_licenca') === 'ativo' } catch { return false }
}

export default function Orcamentos({
  orcamentos,
  setOrcamentos,
  produtos,
  clientes,
  mostrarNotificacao,
  formatarMoeda,
  temaEscuro,
  cardBg,
  border
}) {
  const [modoModal, setModoModal] = useState(null)
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null)
  const [form, setForm] = useState({
    id: null,
    numero: '',
    clienteId: '',
    clienteNome: '',
    data: new Date().toISOString().slice(0, 10),
    itens: [],
    observacoes: '',
    adiantamento: 0,
    status: 'pendente'
  })
  const [itemProdutoId, setItemProdutoId] = useState('')
  const [itemQuantidade, setItemQuantidade] = useState(1)

  const abrirNovo = () => {
    const lic = getLicenciado()
    if (!lic && orcamentos.length >= LIMITE_GRATIS) {
      mostrarNotificacao(`🔒 Limite de ${LIMITE_GRATIS} orçamentos atingido! Ative com código em Config para liberar ilimitado.`)
      return
    }
    const ultimoNum = orcamentos.length > 0
      ? Math.max(...orcamentos.map(o => parseInt(o.numero) || 0)) + 1
      : 1
    setForm({
      id: null,
      numero: String(ultimoNum).padStart(3, '0'),
      clienteId: '',
      clienteNome: '',
      data: new Date().toISOString().slice(0, 10),
      itens: [],
      observacoes: '',
      adiantamento: 0,
      status: 'pendente'
    })
    setModoModal('novo')
  }

  const abrirEditar = (orc) => {
    setForm({ ...orc, adiantamento: Number(orc.adiantamento) || 0, itens: [...orc.itens] })
    setModoModal('editar')
  }

  const abrirVer = (orc) => {
    setOrcamentoSelecionado(orc)
    setModoModal('ver')
  }

  const adicionarItem = () => {
    if (!itemProdutoId) { mostrarNotificacao('⚠️ Escolha um produto!'); return }
    const produto = produtos.find(p => p.id === itemProdutoId)
    if (!produto) return
    if (form.itens.find(i => i.produtoId === itemProdutoId)) {
      mostrarNotificacao('⚠️ Produto já adicionado! Altere a quantidade.')
      return
    }
    setForm({
      ...form,
      itens: [
        ...form.itens,
        {
          produtoId: produto.id,
          nome: produto.nome,
          codigo: produto.codigo,
          unidade: produto.unidade,
          precoUnitario: produto.preco,
          quantidade: Number(itemQuantidade) || 1,
          subtotal: produto.preco * (Number(itemQuantidade) || 1)
        }
      ]
    })
    setItemProdutoId('')
    setItemQuantidade(1)
  }

  const alterarQuantidadeItem = (index, novaQtd) => {
    const qtd = Math.max(0.1, Number(novaQtd) || 1)
    const novosItens = [...form.itens]
    novosItens[index].quantidade = qtd
    novosItens[index].subtotal = novosItens[index].precoUnitario * qtd
    setForm({ ...form, itens: novosItens })
  }

  const alterarPrecoItem = (index, novoPreco) => {
    const preco = Number(novoPreco) || 0
    const novosItens = [...form.itens]
    novosItens[index].precoUnitario = preco
    novosItens[index].subtotal = preco * novosItens[index].quantidade
    setForm({ ...form, itens: novosItens })
  }

  const removerItem = (index) => {
    setForm({ ...form, itens: form.itens.filter((_, i) => i !== index) })
  }

  const calcularTotal = (itens) => itens.reduce((s, i) => s + i.subtotal, 0)
  const calcularAdiantamento = (orc) => Math.min(Number(orc.total) || 0, Math.max(0, Number(orc.adiantamento) || 0))
  const calcularSaldo = (orc) => Math.max(0, (Number(orc.total) || 0) - calcularAdiantamento(orc))

  const salvar = () => {
    if (!form.numero.trim()) { mostrarNotificacao('⚠️ Número obrigatório!'); return }
    if (!form.clienteNome.trim()) { mostrarNotificacao('⚠️ Informe o cliente!'); return }
    if (form.itens.length === 0) { mostrarNotificacao('⚠️ Adicione pelo menos 1 item!'); return }

    const total = calcularTotal(form.itens)
    const adiantamento = Math.min(total, Math.max(0, Number(form.adiantamento) || 0))
    const dados = { ...form, total, adiantamento, saldoRestante: total - adiantamento }

    if (modoModal === 'novo') {
      dados.id = `orc-${Date.now()}`
      setOrcamentos([dados, ...orcamentos])
      mostrarNotificacao('✅ Orçamento criado!')
    } else {
      setOrcamentos(orcamentos.map(o => o.id === form.id ? dados : o))
      mostrarNotificacao('✅ Orçamento atualizado!')
    }
    setModoModal(null)
  }

  const excluir = (id) => {
    if (window.confirm('Excluir este orçamento?')) {
      setOrcamentos(orcamentos.filter(o => o.id !== id))
      mostrarNotificacao('🗑️ Orçamento excluído!')
    }
  }

  const compartilharWhatsApp = (orc) => {
    let texto = `*ORÇAMENTO Nº ${orc.numero}* - ObraFácil PRO%0A`
    texto += `Cliente: ${orc.clienteNome}%0AData: ${orc.data}%0A%0A*ITENS:*%0A`
    orc.itens.forEach((it, idx) => {
      texto += `${idx+1}. ${it.nome} - ${it.quantidade}${it.unidade} x ${formatarMoeda(it.precoUnitario)} = ${formatarMoeda(it.subtotal)}%0A`
    })
    texto += `%0A*TOTAL: ${formatarMoeda(orc.total)}*%0A`
    texto += `*VALOR ADIANTADO: ${formatarMoeda(calcularAdiantamento(orc))}*%0A`
    texto += `*SALDO RESTANTE: ${formatarMoeda(calcularSaldo(orc))}*%0A`
    if (orc.observacoes) texto += `%0AObs: ${orc.observacoes}%0A`
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const gerarPDF = (orc) => {
    const licenciado = getLicenciado()
    const empresa = (()=>{ try { return JSON.parse(localStorage.getItem('obrafacil_empresa')||'{}') } catch { return {} } })()
    const dataEmpresa = licenciado ? empresa : {}

    try {
      const win = window.open('', '_blank')
      if (!win) { alert('Permita pop-up para gerar PDF'); return }

      const logoHtml = licenciado && dataEmpresa.logo
        ? `<img src="${dataEmpresa.logo}" style="height:60px; max-width:140px; object-fit:contain;" />`
        : `<div style="width:60px;height:60px;background:#F05A28;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;border-radius:12px;">OB</div>`

      const empresaNome = licenciado && dataEmpresa.nome ? dataEmpresa.nome : 'ObraFácil PRO'
      const empresaTel = licenciado && dataEmpresa.telefone ? `Tel: ${dataEmpresa.telefone}` : 'Gestão de Orçamentos'
      const empresaEmail = licenciado && dataEmpresa.email ? dataEmpresa.email : ''

      const itensHtml = orc.itens.map((it,i)=>`
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i+1}. ${it.nome}</td>
          <td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb;">${it.quantidade}</td>
          <td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb;">${it.unidade}</td>
          <td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatarMoeda(it.precoUnitario)}</td>
          <td style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;font-weight:700;">${formatarMoeda(it.subtotal)}</td>
        </tr>
      `).join('')

      const marcaDagua = !licenciado ? `
        <div style="position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(240,90,40,0.08);font-weight:900;pointer-events:none;z-index:0;">VERSÃO GRÁTIS</div>
      ` : ''

      win.document.write(`
        <html>
        <head><title>Orçamento ${orc.numero}</title>
        <style>
          body{font-family:Arial,sans-serif;padding:20px;color:#111;position:relative;}
          .header{background:#F05A28;color:#fff;padding:16px 20px;border-radius:12px;display:flex;gap:16px;align-items:center;margin-bottom:20px;}
          .total{font-size:22px;font-weight:800;color:#F05A28;margin-top:16px;}
          @media print {.no-print{display:none;}}
        </style>
        </head>
        <body>
          ${marcaDagua}
          <div class="header">
            ${logoHtml}
            <div>
              <div style="font-size:18px;font-weight:800;">${empresaNome}</div>
              <div style="font-size:12px;opacity:0.9;">${empresaTel} ${empresaEmail ? ' • '+empresaEmail : ''}</div>
              ${!licenciado ? '<div style="font-size:10px;margin-top:4px;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:6px;display:inline-block;">VERSÃO GRÁTIS - Ative em Config com código</div>' : '<div style="font-size:10px;margin-top:4px;background:#22c55e;padding:2px 8px;border-radius:6px;display:inline-block;">✓ Licenciado</div>'}
            </div>
          </div>
          <h2 style="margin:0 0 8px;">ORÇAMENTO Nº ${orc.numero}</h2>
          <div style="font-size:13px;color:#555;margin-bottom:16px;">
            Cliente: <b>${orc.clienteNome}</b> • Data: ${orc.data} • Status: ${orc.status||'pendente'} • Itens: ${orc.itens.length}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px;">ITEM</th><th>QTD</th><th>UNID</th><th style="text-align:right;">UNIT.</th><th style="text-align:right;">SUBTOTAL</th></tr></thead>
            <tbody>${itensHtml}</tbody>
          </table>
          <div class="total">TOTAL: ${formatarMoeda(orc.total)}</div>
          <div style="margin-top:8px;font-size:14px;color:#166534;font-weight:700;">VALOR ADIANTADO: ${formatarMoeda(calcularAdiantamento(orc))}</div>
          <div style="margin-top:6px;font-size:17px;color:#111;font-weight:800;">SALDO RESTANTE: ${formatarMoeda(calcularSaldo(orc))}</div>
          ${orc.observacoes ? `<div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;"><b>Observações:</b><br/>${orc.observacoes}</div>` : ''}
          <div style="margin-top:24px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:8px;">
            Gerado por ObraFácil PRO - ${licenciado ? 'Versão Licenciada' : 'Versão Grátis - obrafacil-pro.netlify.app'} • ${new Date().toLocaleString('pt-BR')}
          </div>
          <div class="no-print" style="margin-top:20px;text-align:center;">
            <button onclick="window.print()" style="padding:12px 24px;background:#F05A28;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;">🖨️ Imprimir / Salvar como PDF</button>
            <button onclick="window.close()" style="padding:12px 24px;background:#e2e8f0;border:none;border-radius:10px;margin-left:8px;cursor:pointer;">Fechar</button>
            <div style="margin-top:12px;font-size:12px;color:#666;">Dica: No Chrome escolha "Salvar como PDF" na impressora para baixar o PDF com logo.</div>
          </div>
        </body>
        </html>
      `)
      win.document.close()
      setTimeout(()=>{ try { win.focus() } catch {} }, 600)
      mostrarNotificacao(licenciado ? '📄 PDF com logo aberto! Clique em Imprimir/Salvar como PDF' : '📄 PDF grátis aberto! Salve como PDF')
    } catch (err) {
      console.error('ERRO PDF', err)
      mostrarNotificacao('❌ Erro PDF: ' + (err.message||err))
      alert('Erro ao gerar PDF: ' + (err.message||err))
    }
  }

  const inputStyle = (extra={}) => ({
    width: '100%', padding: '12px 14px', border: '1.5px solid #d0d7e2', borderRadius: '12px',
    background: temaEscuro ? '#334155' : '#fff', color: 'inherit', boxSizing: 'border-box', ...extra
  })
  const labelStyle = { display: 'block', marginTop: '14px', marginBottom: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }

  return (
    <div>
      {!getLicenciado() && orcamentos.length >= LIMITE_GRATIS ? (
        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, color: '#dc2626' }}>🔒 Limite de {LIMITE_GRATIS} orçamentos atingido</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Versão grátis limitada a {LIMITE_GRATIS} orçamentos. Ative com código em Config para liberar ilimitado + logo no PDF.</div>
          </div>
          <button onClick={() => { mostrarNotificacao('Vá em Config > digite o código'); }} style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Ativar Agora</button>
        </div>
      ) : !getLicenciado() && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 12, padding: 10, marginBottom: 16, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📊 Versão grátis: {orcamentos.length}/{LIMITE_GRATIS} orçamentos usados</span>
          <span style={{ fontWeight: 700, color: '#d97706' }}>{LIMITE_GRATIS - orcamentos.length} restantes • PDF sem logo</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📋 Orçamentos ({orcamentos.length})</h2>
        <button onClick={abrirNovo} style={{ padding: '12px 24px', background: '#F05A28', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
          ➕ Novo Orçamento
        </button>
      </div>

      {orcamentos.length === 0 ? (
        <div style={{ padding: '40px 20px', border: '2px dashed #cbd5e1', borderRadius: '18px', textAlign: 'center', opacity: 0.6 }}>
          Nenhum orçamento criado ainda<br/><small>Clique em Novo Orçamento para começar</small>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orcamentos.map(orc => (
            <div key={orc.id} style={{ padding: '18px 20px', borderRadius: '16px', background: temaEscuro ? '#1e293b' : '#fff', border: '1.5px solid #e6ebf2', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: '70px' }}>
                <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: 700 }}>Nº</div>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>{orc.numero}</div>
                <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', background: orc.status==='aprovado'?'#dcfce7':'#fef3c7', color: orc.status==='aprovado'?'#166534':'#92400e', display: 'inline-block', marginTop: '4px', textTransform: 'uppercase' }}>{orc.status||'pendente'}</div>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: 700 }}>CLIENTE</div>
                <div style={{ fontWeight: 600 }}>{orc.clienteNome}</div>
                <div style={{ fontSize: '12px', opacity: 0.5 }}>{orc.data} • {orc.itens.length} itens</div>
              </div>
              <div style={{ minWidth: '150px', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: 700 }}>TOTAL</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: '#F05A28' }}>{formatarMoeda(orc.total)}</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '3px' }}>Adiantado: {formatarMoeda(calcularAdiantamento(orc))}</div>
                <div style={{ fontSize: '11px', opacity: 0.75 }}>Saldo: {formatarMoeda(calcularSaldo(orc))}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => abrirVer(orc)} title="Ver" style={{ padding: '9px 11px', border: 'none', borderRadius: '8px', background: '#e0f2fe', cursor: 'pointer' }}>👁️</button>
                <button onClick={() => gerarPDF(orc)} title={getLicenciado() ? 'PDF com logo' : 'PDF grátis (sem logo)'} style={{ padding: '9px 11px', border: 'none', borderRadius: '8px', background: getLicenciado() ? '#fde68a' : '#ffedd5', cursor: 'pointer', fontWeight: 700 }}>📄</button>
                <button onClick={() => compartilharWhatsApp(orc)} title="WhatsApp" style={{ padding: '9px 11px', border: 'none', borderRadius: '8px', background: '#dcfce7', cursor: 'pointer' }}>📲</button>
                <button onClick={() => abrirEditar(orc)} title="Editar" style={{ padding: '9px 11px', border: 'none', borderRadius: '8px', background: '#e2e8f0', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => excluir(orc.id)} title="Excluir" style={{ padding: '9px 11px', border: 'none', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modoModal === 'ver' && orcamentoSelecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: temaEscuro ? '#1e293b' : '#fff', borderRadius: '18px', padding: '22px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Orçamento Nº {orcamentoSelecionado.numero}</h3>
            <p><strong>Cliente:</strong> {orcamentoSelecionado.clienteNome} | <strong>Data:</strong> {orcamentoSelecionado.data}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '10px' }}>
              <thead><tr style={{ background: '#f1f5f9' }}><th style={{ padding: '8px', textAlign: 'left' }}>Item</th><th>Qtd</th><th>Un</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
              <tbody>
                {orcamentoSelecionado.itens.map((it,i)=>(
                  <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '8px' }}>{it.nome}</td><td style={{ textAlign: 'center' }}>{it.quantidade}</td><td style={{ textAlign: 'center' }}>{it.unidade}</td><td style={{ textAlign: 'right' }}>{formatarMoeda(it.subtotal)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} style={{ padding: '14px 8px 4px', textAlign: 'right', fontWeight: 800 }}>TOTAL</td><td style={{ padding: '14px 8px 4px', textAlign: 'right', fontWeight: 800, color: '#F05A28' }}>{formatarMoeda(orcamentoSelecionado.total)}</td></tr>
                <tr><td colSpan={3} style={{ padding: '4px 8px', textAlign: 'right', color: '#16a34a' }}>Adiantamento</td><td style={{ padding: '4px 8px', textAlign: 'right', color: '#16a34a' }}>{formatarMoeda(calcularAdiantamento(orcamentoSelecionado))}</td></tr>
                <tr><td colSpan={3} style={{ padding: '4px 8px 12px', textAlign: 'right', fontWeight: 800 }}>Saldo restante</td><td style={{ padding: '4px 8px 12px', textAlign: 'right', fontWeight: 800 }}>{formatarMoeda(calcularSaldo(orcamentoSelecionado))}</td></tr>
              </tfoot>
            </table>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => gerarPDF(orcamentoSelecionado)} style={{ flex: 1, padding: '12px', border: 'none', background: '#F05A28', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>📄 Gerar PDF {getLicenciado() ? 'com Logo' : '(Grátis)'}</button>
              <button onClick={() => compartilharWhatsApp(orcamentoSelecionado)} style={{ flex: 1, padding: '12px', border: 'none', background: '#22c55e', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>📲 WhatsApp</button>
              <button onClick={() => setModoModal(null)} style={{ flex: 1, padding: '12px', border: 'none', background: '#1e293b', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {(modoModal === 'novo' || modoModal === 'editar') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: temaEscuro ? '#1e293b' : '#fff', borderRadius: '20px', padding: '26px', maxWidth: '720px', width: '100%', margin: '20px 0' }}>
            <h3 style={{ marginTop: 0 }}>{modoModal === 'novo' ? '➕ Novo Orçamento' : '✏️ Editar Orçamento'}</h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '130px' }}><label style={labelStyle}>Número</label><input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} style={inputStyle()} /></div>
              <div style={{ flex: 1, minWidth: '150px' }}><label style={labelStyle}>Data</label><input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inputStyle()} /></div>
              <div style={{ flex: 1, minWidth: '130px' }}><label style={labelStyle}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle()}><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="enviado">Enviado</option><option value="recusado">Recusado</option></select></div>
            </div>

            <label style={labelStyle}>Cliente</label>
            <select value={form.clienteId} onChange={e => {
              const id = e.target.value
              const cli = clientes.find(c => c.id === id)
              setForm({ ...form, clienteId: id, clienteNome: cli ? cli.nome : form.clienteNome })
            }} style={inputStyle()}>
              <option value="">— Selecione —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input type="text" placeholder="Ou digite o nome do cliente" value={form.clienteNome} onChange={e => setForm({ ...form, clienteNome: e.target.value, clienteId: '' })} style={{ ...inputStyle(), marginTop: '8px' }} />

            <label style={{ ...labelStyle, marginTop: '22px' }}>Adicionar Produto / Serviço</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: temaEscuro ? '#0f172a' : '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <select value={itemProdutoId} onChange={e => setItemProdutoId(e.target.value)} style={inputStyle()}>
                <option value="">— Escolha o produto ou serviço —</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} — {formatarMoeda(p.preco)}/{p.unidade}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '90px' }}>
                  <label style={{ ...labelStyle, marginTop: 0, fontSize: '10px' }}>QTD</label>
                  <input type="number" min="0.1" step="0.1" value={itemQuantidade} onChange={e => setItemQuantidade(e.target.value)} placeholder="Ex: 10" style={inputStyle()} />
                </div>
                <div style={{ flex: '0.7', minWidth: '70px' }}>
                  <label style={{ ...labelStyle, marginTop: 0, fontSize: '10px' }}>UNIDADE</label>
                  <div style={{ ...inputStyle(), background: temaEscuro ? '#1e293b' : '#eef2f7', textAlign: 'center', fontWeight: 700 }}>
                    {itemProdutoId ? (produtos.find(p=>p.id===itemProdutoId)?.unidade || '-') : '-'}
                  </div>
                </div>
                <div style={{ flex: '1', minWidth: '100px' }}>
                  <label style={{ ...labelStyle, marginTop: 0, fontSize: '10px' }}>PREÇO UNIT.</label>
                  <div style={{ ...inputStyle(), background: temaEscuro ? '#1e293b' : '#eef2f7', fontWeight: 600 }}>
                    {itemProdutoId ? formatarMoeda(produtos.find(p=>p.id===itemProdutoId)?.preco || 0) : 'R$ 0,00'}
                  </div>
                </div>
                <button onClick={adicionarItem} style={{ padding: '12px 22px', border: 'none', background: '#10b981', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', height: '48px' }}>+ Adicionar</button>
              </div>
            </div>

            <div style={{ marginTop: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                <strong>Itens ({form.itens.length})</strong>
                <strong style={{ color: '#F05A28', fontSize: '18px' }}>{formatarMoeda(calcularTotal(form.itens))}</strong>
              </div>

              {form.itens.length === 0 ? <p style={{ opacity: 0.5, fontSize: '14px', marginTop: '8px' }}>Nenhum item ainda. Escolha um produto acima e clique em Adicionar.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.itens.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '12px', background: temaEscuro ? '#334155' : '#fff', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ flex: '2', minWidth: '140px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: '1.2' }}>{item.nome}</div>
                        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>{item.codigo} • Unidade: {item.unidade}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '75px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6, textAlign: 'center' }}>QTD</label>
                        <input type="number" value={item.quantidade} onChange={e => alterarQuantidadeItem(i, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #d0d7e2', textAlign: 'center', fontWeight: 700 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '60px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6, textAlign: 'center' }}>UNID.</label>
                        <div style={{ padding: '8px', borderRadius: '8px', background: temaEscuro ? '#1e293b' : '#f1f5f9', textAlign: 'center', fontWeight: 700, fontSize: '12px', border: '1.5px solid #e2e8f0' }}>{item.unidade}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '105px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6, textAlign: 'center' }}>PREÇO UNIT.</label>
                        <input type="number" value={item.precoUnitario} onChange={e => alterarPrecoItem(i, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #d0d7e2', textAlign: 'right' }} />
                      </div>
                      <div style={{ minWidth: '90px', textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>Subtotal</div>
                        <div style={{ fontWeight: 800, color: '#F05A28' }}>{formatarMoeda(item.subtotal)}</div>
                      </div>
                      <button onClick={() => removerItem(i)} title="Remover item" style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '18px', padding: '16px', borderRadius: '14px', background: temaEscuro ? '#0f172a' : '#f0fdf4', border: '1px solid #86efac' }}>
              <label style={{ ...labelStyle, marginTop: 0, opacity: 1, color: temaEscuro ? '#86efac' : '#166534' }}>💰 Valor adiantado / entrada (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.adiantamento ?? 0}
                onChange={e => setForm({ ...form, adiantamento: Math.max(0, Number(e.target.value) || 0) })}
                placeholder="0,00"
                style={inputStyle({ fontSize: '18px', fontWeight: 700 })}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '12px', fontSize: '13px' }}>
                <span>Total: <strong>{formatarMoeda(calcularTotal(form.itens))}</strong></span>
                <span style={{ color: '#16a34a' }}>Adiantado: <strong>{formatarMoeda(Math.min(calcularTotal(form.itens), Number(form.adiantamento) || 0))}</strong></span>
                <span style={{ color: '#F05A28' }}>Saldo restante: <strong>{formatarMoeda(Math.max(0, calcularTotal(form.itens) - (Number(form.adiantamento) || 0)))}</strong></span>
              </div>
              <small style={{ display: 'block', marginTop: '8px', opacity: 0.65 }}>O valor adiantado não pode ultrapassar o total do orçamento quando você salvar.</small>
            </div>

            <label style={labelStyle}>Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: Validade 7 dias, material incluso..."
              style={{ ...inputStyle(), minHeight: '80px', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => setModoModal(null)} style={{ flex: 1, padding: '13px', border: '1.5px solid #d0d7e2', background: 'transparent', borderRadius: '10px', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>Cancelar</button>
              <button onClick={salvar} style={{ flex: 1, padding: '13px', border: 'none', background: '#F05A28', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>💾 Salvar Orçamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
