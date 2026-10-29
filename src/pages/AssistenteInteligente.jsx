import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'

const moeda = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const totalOrcamento = o => Math.max(0, Number(o.total || (o.itens || []).reduce((s, i) => s + Number(i.subtotal || Number(i.quantidade || 0) * Number(i.precoUnitario ?? i.preco ?? 0)), 0)) || 0)
const totalPago = o => Math.min(totalOrcamento(o), Math.max(0, Number(o.adiantamento) || 0) + (Array.isArray(o.pagamentos) ? o.pagamentos.reduce((s, p) => s + Math.max(0, Number(p.valor) || 0), 0) : 0))
const saldo = o => Math.max(0, totalOrcamento(o) - totalPago(o))

export default function AssistenteInteligente({ produtos = [], clientes = [], orcamentos = [], obras = [], temaEscuro, setPagina }) {
  const [pergunta, setPergunta] = useState('')
  const [conversa, setConversa] = useState([{ tipo: 'ia', texto: 'Olá! Sou o Assistente Inteligente do ObraFácil. Posso analisar os dados já cadastrados, apontar pendências, ajudar com produtos e preparar mensagens para clientes. Não preciso de internet nem de uma chave de API: meus recursos são locais e baseados nas regras do aplicativo.' }])
  const dark = !!temaEscuro
  const text = dark ? '#e7edf7' : '#172033'
  const muted = dark ? '#a0aec0' : '#667085'
  const panel = dark ? '#172235' : '#fff'
  const border = dark ? '#2b3a50' : '#e6eaf0'
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: '1px solid ' + border, background: dark ? '#101827' : '#fff', color: text, font: 'inherit', fontSize: 14 }

  const insights = useMemo(() => {
    const totalVendas = orcamentos.reduce((s, o) => s + totalOrcamento(o), 0)
    const receber = orcamentos.reduce((s, o) => s + saldo(o), 0)
    const pendentes = orcamentos.filter(o => !normalizar(o.status).includes('aprov') && !normalizar(o.status).includes('cancel'))
    const pagosParciais = orcamentos.filter(o => totalPago(o) > 0 && saldo(o) > 0.009)
    const semTelefone = clientes.filter(c => !String(c.telefone || '').trim())
    const semPreco = produtos.filter(p => !Number.isFinite(Number(p.preco)) || Number(p.preco) <= 0)
    const semCodigo = produtos.filter(p => !String(p.codigo || '').trim())
    const categorias = produtos.reduce((acc, p) => { const c = p.categoria || 'Sem categoria'; acc[c] = (acc[c] || 0) + 1; return acc }, {})
    const categoriaPrincipal = Object.entries(categorias).sort((a,b) => b[1] - a[1])[0]
    const obrasAndamento = obras.filter(o => normalizar(o.status).includes('andamento'))
    return { totalVendas, receber, pendentes, pagosParciais, semTelefone, semPreco, semCodigo, categoriaPrincipal, obrasAndamento }
  }, [produtos, clientes, orcamentos, obras])

  const responder = (texto) => {
    const q = String(texto || pergunta).trim()
    if (!q) return
    const nq = normalizar(q)
    let resposta = ''
    if (nq.includes('saldo') || nq.includes('receber') || nq.includes('inadimpl') || nq.includes('pagamento')) {
      const comSaldo = orcamentos.filter(o => saldo(o) > 0.009).sort((a,b) => saldo(b)-saldo(a))
      resposta = 'RESUMO DE VALORES A RECEBER\n\nSaldo total: ' + moeda(insights.receber) + '\nOrçamentos com saldo: ' + comSaldo.length + '\n\n'
      resposta += comSaldo.length ? comSaldo.slice(0,10).map(o => '• Orçamento ' + (o.numero || '—') + ' — ' + (o.clienteNome || 'Cliente não informado') + ': saldo de ' + moeda(saldo(o)) + (totalPago(o) > 0 ? ' (pagamento parcial)' : ' (sem pagamento registrado)')).join('\n') : 'Não há saldo pendente nos orçamentos cadastrados.'
    } else if (nq.includes('pendente') || nq.includes('sem resposta') || nq.includes('retorno') || nq.includes('acompanhar')) {
      resposta = 'ORÇAMENTOS PARA ACOMPANHAR\n\n' + (insights.pendentes.length ? insights.pendentes.slice(0,12).map(o => '• Nº ' + (o.numero || '—') + ' — ' + (o.clienteNome || 'Cliente não informado') + ' — ' + moeda(totalOrcamento(o)) + ' — situação comercial: ' + (o.status || 'Pendente')).join('\n') : 'Não encontrei orçamentos pendentes pela situação comercial registrada.')
      resposta += '\n\nDica: a situação comercial depende do status salvo no orçamento. Confirme antes de enviar uma cobrança ou alterar o status.'
    } else if (nq.includes('produto') || nq.includes('estoque') || nq.includes('catalogo') || nq.includes('preco') || nq.includes('preço')) {
      const termoBruto = nq.match(/(?:produto|estoque|catalogo|preco)\\s+(?:chamado\\s+|de\\s+)?(.+)$/)?.[1]?.trim() || ''
      const termo = /^(meu|meus|do|da|de|dos|das|cadastrado|cadastrados|catalogo|produtos|precos|geral|atual)$/.test(termoBruto) || termoBruto.startsWith('meu catalogo') || termoBruto.startsWith('meus produtos') || termoBruto.startsWith('meu estoque') ? '' : termoBruto
      const encontrados = produtos.filter(p => !termo || normalizar(p.nome + ' ' + p.codigo + ' ' + p.categoria).includes(termo)).slice(0,12)
      resposta = 'ANÁLISE DO CATÁLOGO\n\nProdutos cadastrados: ' + produtos.length + '\nCategoria com mais itens: ' + (insights.categoriaPrincipal ? insights.categoriaPrincipal[0] + ' (' + insights.categoriaPrincipal[1] + ')' : 'ainda não há categorias') + '\nProdutos com preço zerado/inválido: ' + insights.semPreco.length + '\nProdutos sem código: ' + insights.semCodigo.length + '\n\n'
      resposta += encontrados.length ? 'Itens encontrados:\n' + encontrados.map(p => '• ' + p.nome + ' — ' + moeda(p.preco) + ' / ' + (p.unidade || 'un') + (p.codigo ? ' — código ' + p.codigo : '')).join('\n') : (termo ? 'Não encontrei um produto com esse termo.' : 'O catálogo está vazio.')
      resposta += '\n\nImportante: o app não tem controle de quantidade em estoque nesta versão; esta análise verifica apenas o catálogo e os preços cadastrados.'
    } else if (nq.includes('cliente') || nq.includes('contato') || nq.includes('telefone')) {
      resposta = 'ANÁLISE DE CLIENTES\n\nClientes cadastrados: ' + clientes.length + '\nSem telefone/WhatsApp cadastrado: ' + insights.semTelefone.length + '\n\n'
      resposta += insights.semTelefone.length ? insights.semTelefone.slice(0,15).map(c => '• ' + c.nome + ' — falta telefone').join('\n') : 'Todos os clientes cadastrados têm telefone preenchido.'
    } else if (nq.includes('mensagem') || nq.includes('whatsapp') || nq.includes('cobrar') || nq.includes('follow')) {
      const o = orcamentos.find(x => saldo(x) > 0.009 && x.clienteNome)
      if (o) resposta = 'SUGESTÃO DE MENSAGEM — revise antes de enviar:\n\nOlá, ' + o.clienteNome + '! Tudo bem? Estou entrando em contato para saber se conseguiu avaliar o orçamento nº ' + (o.numero || '—') + ', no valor de ' + moeda(totalOrcamento(o)) + '. Consta um saldo em aberto de ' + moeda(saldo(o)) + '. Se tiver alguma dúvida ou quiser ajustar algum item, fico à disposição. Obrigado(a)!'
      else resposta = 'Não encontrei orçamento com saldo pendente e cliente identificado para usar como exemplo. Você pode pedir uma análise de orçamentos pendentes ou revisar os cadastros.'
    } else if (nq.includes('obra')) {
      resposta = 'RESUMO DAS OBRAS\n\nObras cadastradas: ' + obras.length + '\nEm andamento: ' + insights.obrasAndamento.length + '\n\n' + (obras.length ? obras.slice(0,12).map(o => '• ' + (o.nome || 'Obra sem nome') + ' — ' + (o.clienteNome || 'cliente não informado') + ' — ' + (o.status || 'sem status')).join('\n') : 'Nenhuma obra cadastrada ainda.')
    } else if (nq.includes('resumo') || nq.includes('situacao') || nq.includes('situação') || nq.includes('como estou') || nq.includes('analise geral') || nq.includes('análise geral')) {
      resposta = 'RESUMO GERAL DO OBRAFÁCIL\n\n• Produtos: ' + produtos.length + '\n• Clientes: ' + clientes.length + '\n• Orçamentos: ' + orcamentos.length + '\n• Obras: ' + obras.length + '\n• Valor total dos orçamentos: ' + moeda(insights.totalVendas) + '\n• Saldo a receber: ' + moeda(insights.receber) + '\n• Orçamentos aguardando acompanhamento: ' + insights.pendentes.length + '\n• Clientes sem telefone: ' + insights.semTelefone.length + '\n• Produtos com preço zerado/inválido: ' + insights.semPreco.length + '\n\nEsses números são calculados localmente com base nos registros atuais do app.'
    } else {
      resposta = 'Posso ajudar com uma análise local dos seus dados. Experimente uma destas perguntas:\n• Quanto tenho a receber?\n• Quais orçamentos estão pendentes?\n• Analise meu catálogo de produtos.\n• Quais clientes estão sem telefone?\n• Prepare uma mensagem para WhatsApp.\n• Faça um resumo geral.\n\nEste assistente usa regras locais, não um modelo generativo. Ele não altera seus dados automaticamente.'
    }
    setConversa(c => [...c, { tipo: 'voce', texto: q }, { tipo: 'ia', texto: resposta }])
    setPergunta('')
  }

  const copiar = async texto => {
    try { await navigator.clipboard.writeText(texto); alert('Texto copiado.') } catch { window.prompt('Copie o texto abaixo:', texto) }
  }
  const sugestoes = ['Faça um resumo geral', 'Quanto tenho a receber?', 'Quais orçamentos estão pendentes?', 'Analise meu catálogo de produtos', 'Quais clientes estão sem telefone?', 'Prepare uma mensagem para WhatsApp']

  return <div style={{ color: text, paddingBottom: 90 }}>
    <section style={{ background: 'linear-gradient(120deg,#172033,#344860)', color: '#fff', borderRadius: 20, padding: '24px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 15, background: '#f05a28' }}><Icon name="settings" size={25} /></div>
        <div><div style={{ color: '#fdba9a', fontSize: 10, fontWeight: 800, letterSpacing: 1.6 }}>FERRAMENTAS INTELIGENTES GRATUITAS</div><h1 style={{ fontSize: 26, margin: '5px 0' }}>Assistente ObraFácil</h1><div style={{ color: '#d5deeb', fontSize: 12 }}>Análise local dos seus produtos, clientes, orçamentos e obras.</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        {[['Produtos',produtos.length],['Clientes',clientes.length],['Orçamentos',orcamentos.length],['Obras',obras.length]].map(([label,n]) => <div key={label} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.13)', padding: '8px 11px', borderRadius: 10, fontSize: 12 }}>{label}: <strong>{n}</strong></div>)}
      </div>
    </section>
    <section style={{ background: panel, border: '1px solid ' + border, borderRadius: 18, padding: 18, marginBottom: 18 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>Pergunte ao assistente</h2>
      <p style={{ fontSize: 12, color: muted, margin: '0 0 14px', lineHeight: 1.5 }}>Escolha uma pergunta pronta ou escreva a sua. Os resultados usam somente os dados salvos neste navegador.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{sugestoes.map(s => <button key={s} onClick={() => responder(s)} style={{ background: dark ? '#243249' : '#fff5ef', border: '1px solid ' + (dark ? '#35445a' : '#ffddce'), color: text, borderRadius: 999, padding: '8px 11px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{s}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); responder() }} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input value={pergunta} onChange={e => setPergunta(e.target.value)} placeholder="Ex.: quanto tenho a receber?" style={{ ...inputStyle, flex: 1, minWidth: 0 }} aria-label="Pergunta para o assistente" />
        <button type="submit" style={{ border: 0, borderRadius: 12, background: '#f05a28', color: '#fff', padding: '0 17px', fontWeight: 800, cursor: 'pointer' }}>Analisar</button>
      </form>
    </section>
    <section style={{ background: panel, border: '1px solid ' + border, borderRadius: 18, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}><h2 style={{ fontSize: 16, margin: 0 }}>Conversa</h2><button onClick={() => setConversa([{ tipo: 'ia', texto: 'Conversa limpa. Pode escolher uma pergunta acima.' }])} style={{ border: '1px solid ' + border, background: 'transparent', color: muted, padding: '7px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 11 }}>Limpar</button></div>
      <div style={{ display: 'grid', gap: 12 }}>{conversa.map((m,i) => <div key={i} style={{ justifySelf: m.tipo === 'voce' ? 'end' : 'stretch', width: m.tipo === 'voce' ? 'fit-content' : '100%', maxWidth: m.tipo === 'voce' ? '85%' : '100%', background: m.tipo === 'voce' ? '#f05a28' : (dark ? '#101827' : '#f7f9fc'), color: m.tipo === 'voce' ? '#fff' : text, border: m.tipo === 'ia' ? '1px solid ' + border : '1px solid transparent', borderRadius: 14, padding: 13, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65, overflowWrap: 'anywhere' }}><div style={{ fontSize: 10, fontWeight: 800, opacity: .72, marginBottom: 5 }}>{m.tipo === 'voce' ? 'VOCÊ' : 'ASSISTENTE OBRAFÁCIL'}</div>{m.texto}{m.tipo === 'ia' && i > 0 && <div><button onClick={() => copiar(m.texto)} style={{ marginTop: 10, background: 'transparent', border: '1px solid ' + border, color: muted, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', fontSize: 11 }}>Copiar resposta</button></div>}</div>)}</div>
    </section>
    <p style={{ color: muted, fontSize: 11, lineHeight: 1.6, marginTop: 14 }}>Transparência: esta primeira versão é um assistente baseado em regras e cálculos locais, não uma IA generativa. Não envia dados para terceiros e não modifica produtos, clientes, pagamentos ou orçamentos automaticamente. Faça backup periódico dos seus dados.</p>
  </div>
}
