import React from 'react'

const money = (n, formatarMoeda) => formatarMoeda ? formatarMoeda(Number(n) || 0) : (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const cardStyle = (dark, border) => ({ background: dark ? '#172235' : '#fff', border: `1px solid ${border || (dark ? '#2b3a50' : '#e6eaf0')}`, borderRadius: 18, boxShadow: dark ? 'none' : '0 5px 20px rgba(20,35,60,.045)' })

export default function Painel({ produtos = [], clientes = [], orcamentos = [], obras = [], formatarMoeda, temaEscuro, cardBg, border, setPagina }) {
  const dark = !!temaEscuro
  const text = dark ? '#e7edf7' : '#172033'
  const muted = dark ? '#9aa9bd' : '#778398'
  const panel = cardStyle(dark, border)
  const totalOrcamentos = orcamentos.reduce((s, o) => s + Number(o.total || (o.itens || []).reduce((a, i) => a + Number(i.subtotal || Number(i.quantidade || 0) * Number(i.preco || 0)), 0)), 0)
  const pendentes = orcamentos.filter(o => ['pendente', 'em análise', 'em analise'].includes(String(o.status || 'pendente').toLowerCase()))
  const aprovados = orcamentos.filter(o => String(o.status || '').toLowerCase().includes('aprov'))
  const valorPendente = pendentes.reduce((s, o) => s + Number(o.total || (o.itens || []).reduce((a, i) => a + Number(i.subtotal || Number(i.quantidade || 0) * Number(i.preco || 0)), 0)), 0)
  const shortcuts = [
    { id: 'orcamentos', icon: '🧾', title: 'Novo orçamento', desc: 'Monte uma proposta', color: '#f05a28' },
    { id: 'obras', icon: '🏗️', title: 'Gerenciar obras', desc: 'Acompanhe serviços', color: '#2563eb' },
    { id: 'produtos', icon: '📦', title: 'Cadastrar produto', desc: 'Atualize seu catálogo', color: '#0d9488' },
    { id: 'clientes', icon: '👥', title: 'Novo cliente', desc: 'Organize contatos', color: '#7c3aed' },
  ]
  const stats = [
    { label: 'Orçamentos cadastrados', value: orcamentos.length, icon: '🧾', tint: '#fff0e9', ink: '#e85b25', note: `${aprovados.length} aprovados` },
    { label: 'Valor em propostas', value: money(totalOrcamentos, formatarMoeda), icon: '💰', tint: '#e8f8ef', ink: '#16834a', note: 'Soma dos orçamentos' },
    { label: 'Aguardando retorno', value: pendentes.length, icon: '⏳', tint: '#fff5d9', ink: '#a66a00', note: `${money(valorPendente, formatarMoeda)} em aberto` },
    { label: 'Obras cadastradas', value: obras.length, icon: '🏗️', tint: '#eaf1ff', ink: '#2b60c5', note: `${clientes.length} clientes` },
  ]
  const btn = (id) => setPagina && setPagina(id)
  return <div style={{ color: text, paddingBottom: 92 }}>
    <style>{`@keyframes ofade { from { opacity:0; transform:translateY(7px) } to {opacity:1;transform:translateY(0)} } .of-card { transition:transform .18s, box-shadow .18s; } .of-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(20,35,60,.09)!important; } .of-action:hover { filter:brightness(.98); transform:translateY(-1px); } @media(max-width:560px){.of-hero{padding:22px!important}.of-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.of-shortcuts{grid-template-columns:repeat(2,minmax(0,1fr))!important}.of-stat-value{font-size:21px!important}}`}</style>
    <section className="of-hero" style={{ background: 'linear-gradient(120deg,#111c31 0%,#1c3150 65%,#f05a28 155%)', borderRadius: 24, padding: '30px 32px', color: '#fff', position: 'relative', overflow: 'hidden', marginBottom: 24, animation: 'ofade .35s ease-out' }}>
      <div style={{ position: 'absolute', right: -24, top: -50, width: 220, height: 220, borderRadius: '50%', border: '34px solid rgba(255,255,255,.045)' }} />
      <div style={{ position: 'absolute', right: 48, bottom: -80, width: 170, height: 170, borderRadius: '50%', background: 'rgba(240,90,40,.12)' }} />
      <div style={{ position: 'relative', maxWidth: 640 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#ffb18e', marginBottom: 12 }}>CENTRAL DE GESTÃO</div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 'clamp(24px,4vw,34px)', lineHeight: 1.18, margin: '0 0 10px', letterSpacing: '-1px' }}>Sua obra, seus números.<br/>Tudo sob controle.</h1>
        <p style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.7, color: '#d2dbea', maxWidth: 480 }}>Acompanhe seus orçamentos, clientes, produtos e obras em um só lugar.</p>
        <button onClick={() => btn('orcamentos')} className="of-action" style={{ border: 0, borderRadius: 11, padding: '12px 17px', background: '#f05a28', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 6px 18px rgba(240,90,40,.25)' }}>＋ Criar orçamento <span style={{ fontSize: 18 }}>↗</span></button>
      </div>
    </section>

    <div className="of-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 25 }}>
      {stats.map((s, i) => <div key={s.label} className="of-card" style={{ ...panel, padding: 18, minWidth: 0, animation: `ofade .35s ease-out ${i * 50}ms both` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 18 }}><span style={{ color: muted, fontSize: 12, lineHeight: 1.4, fontWeight: 700 }}>{s.label}</span><span style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: dark ? `${s.ink}22` : s.tint, fontSize: 18, flexShrink: 0 }}>{s.icon}</span></div>
        <div className="of-stat-value" style={{ fontFamily: "'Sora',sans-serif", fontSize: 25, letterSpacing: '-.8px', fontWeight: 800, overflowWrap: 'anywhere', marginBottom: 8 }}>{s.value}</div>
        <div style={{ color: muted, fontSize: 11 }}>{s.note}</div>
      </div>)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(260px,.85fr)', gap: 18, marginBottom: 20 }} className="of-main-grid">
      <section style={{ ...panel, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}><div><h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Acesso rápido</h2><p style={{ color: muted, fontSize: 12, margin: '5px 0 0' }}>O que você precisa fazer agora?</p></div><span style={{ fontSize: 22 }}>⚡</span></div>
        <div className="of-shortcuts" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
          {shortcuts.map(s => <button key={s.id} onClick={() => btn(s.id)} className="of-action" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: 12, padding: 14, minWidth: 0, borderRadius: 14, border: `1px solid ${dark ? '#2c3b51' : '#e8edf4'}`, background: dark ? '#1d2a3e' : '#fbfcfe', color: text, cursor: 'pointer', transition: 'all .18s' }}><span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 13, background: `${s.color}18`, fontSize: 21, flexShrink: 0 }}>{s.icon}</span><span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>{s.title}</strong><span style={{ display: 'block', color: muted, fontSize: 10, lineHeight: 1.4 }}>{s.desc}</span></span></button>)}
        </div>
      </section>
      <section style={{ ...panel, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}><div><h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Visão geral</h2><p style={{ color: muted, fontSize: 12, margin: '5px 0 0' }}>Resumo do seu cadastro</p></div><span style={{ fontSize: 22 }}>📈</span></div>
        {[{label:'Produtos no catálogo',n:produtos.length,total:Math.max(produtos.length,160),color:'#f05a28',id:'produtos'}, {label:'Clientes cadastrados',n:clientes.length,total:Math.max(clientes.length,10),color:'#7c3aed',id:'clientes'}, {label:'Orçamentos criados',n:orcamentos.length,total:Math.max(orcamentos.length,10),color:'#16834a',id:'orcamentos'}].map(x=><button key={x.label} onClick={()=>btn(x.id)} style={{ display:'block',width:'100%',padding:'10px 0',border:0,background:'transparent',color:text,textAlign:'left',cursor:'pointer' }}><div style={{ display:'flex',justifyContent:'space-between',gap:8,fontSize:12,marginBottom:8 }}><span>{x.label}</span><strong>{x.n}</strong></div><div style={{ height:7,background:dark?'#29374a':'#edf1f6',borderRadius:20,overflow:'hidden' }}><div style={{ height:'100%',width:`${Math.min(100,x.n/Math.max(x.total,1)*100)}%`,background:x.color,borderRadius:20,transition:'width .4s' }}/></div></button>)}
        <div style={{ borderTop:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}`,marginTop:8,paddingTop:15,color:muted,fontSize:11,lineHeight:1.6 }}>Dica: mantenha seus preços atualizados para montar propostas mais precisas.</div>
      </section>
    </div>

    <section style={{ ...panel, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}><div><h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Orçamentos recentes</h2><p style={{ color: muted, fontSize: 12, margin: '5px 0 0' }}>Acompanhe as últimas propostas cadastradas</p></div><button onClick={() => btn('orcamentos')} style={{ background: dark ? '#27364b' : '#fff2ec', border: 0, borderRadius: 10, color: '#e85b25', fontSize: 11, fontWeight: 800, padding: '10px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Ver todos →</button></div>
      {orcamentos.length === 0 ? <div style={{ padding: '22px 12px', textAlign: 'center', background: dark ? '#1d2a3e' : '#fafbfd', borderRadius: 14, border: `1px dashed ${border || (dark?'#34445b':'#dce3ec')}` }}><div style={{ fontSize: 28, marginBottom: 8 }}>🧾</div><strong style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Seus orçamentos aparecerão aqui</strong><span style={{ color: muted, fontSize: 12 }}>Crie sua primeira proposta para começar a acompanhar os valores.</span><div><button onClick={() => btn('orcamentos')} style={{ marginTop: 14, border: 0, borderRadius: 10, padding: '10px 14px', background: '#f05a28', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Criar primeiro orçamento</button></div></div> : <div style={{ overflowX: 'auto' }}><table style={{ width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:440 }}><thead><tr>{['Nº / Cliente','Data','Situação','Valor'].map(h=><th key={h} style={{ color:muted,textAlign:'left',fontSize:10,letterSpacing:.5,padding:'10px 9px',borderBottom:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}` }}>{h.toUpperCase()}</th>)}</tr></thead><tbody>{[...orcamentos].slice(-5).reverse().map((o,i)=>{const status=String(o.status||'Pendente');const ok=status.toLowerCase().includes('aprov');const total=Number(o.total||(o.itens||[]).reduce((a,x)=>a+Number(x.subtotal||Number(x.quantidade||0)*Number(x.preco||0)),0));return <tr key={o.id||i}><td style={{padding:'13px 9px',borderBottom:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}`}}><strong style={{display:'block',marginBottom:4}}>{o.numero?`#${o.numero}`:`Orçamento ${i+1}`}</strong><span style={{color:muted}}>{o.clienteNome||'Cliente não informado'}</span></td><td style={{padding:'13px 9px',color:muted,borderBottom:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}`}}>{o.data?new Date(`${o.data}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</td><td style={{padding:'13px 9px',borderBottom:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}`}}><span style={{display:'inline-block',padding:'5px 8px',borderRadius:20,fontSize:10,fontWeight:800,color:ok?'#16834a':status.toLowerCase().includes('rejeit')?'#c2410c':'#a66a00',background:ok?(dark?'#163b2b':'#e8f8ef'):status.toLowerCase().includes('rejeit')?(dark?'#48291f':'#fff0e9'):(dark?'#45391f':'#fff5d9')}}>{status}</span></td><td style={{padding:'13px 9px',fontWeight:800,whiteSpace:'nowrap',borderBottom:`1px solid ${border || (dark?'#2b3a50':'#e6eaf0')}`}}>{money(total,formatarMoeda)}</td></tr>})}</tbody></table></div>}
    </section>
    <style>{`@media(max-width:780px){.of-main-grid{grid-template-columns:1fr!important}}`}</style>
  </div>
}
