import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

export default function GerenciarClientes({ temaEscuro, cardBg, border, mostrarNotificacao }) {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState('')
  const texto = temaEscuro ? '#e2e8f0' : '#1e293b'
  const carregar = useCallback(async () => {
    if (!supabaseConfigured) { setErro('Supabase não configurado.'); setCarregando(false); return }
    setCarregando(true)
    const { data, error } = await supabase.rpc('obrafacil_listar_clientes')
    if (error) setErro('Falha ao listar clientes. Confira o SQL no Supabase: ' + error.message)
    else { setClientes(data || []); setErro('') }
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])
  const ativo = c => c.status === 'ativo' && (!c.expira_em || new Date(c.expira_em) > new Date())
  const alterar = async (c, ligar) => {
    if (!window.confirm((ligar ? 'Liberar' : 'Cancelar') + ' o PRO de ' + c.email + '?')) return
    setProcessando(c.user_id)
    const { error } = await supabase.rpc('obrafacil_definir_licenca', { p_user_id: c.user_id, p_ativo: ligar })
    setProcessando('')
    if (error) { setErro(error.message); return }
    mostrarNotificacao(ligar ? 'PRO liberado com sucesso!' : 'PRO cancelado.')
    await carregar()
  }
  const lista = useMemo(() => clientes.filter(c => (c.email || '').toLowerCase().includes(busca.toLowerCase())), [clientes, busca])
  return <section style={{ display: 'grid', gap: 16, color: texto }}>
    <div><h2 style={{ margin: 0 }}>Gerenciar Clientes</h2><p>Confirme o pagamento e libere o acesso PRO.</p></div>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}><strong>Contas: {clientes.length}</strong><strong>PRO ativos: {clientes.filter(ativo).length}</strong></div>
    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pelo e-mail..." style={{ padding: 12, maxWidth: 440, border: '1px solid ' + border, borderRadius: 10, background: temaEscuro ? '#0f172a' : '#fff', color: texto }} />
    <button onClick={carregar} disabled={carregando}>Atualizar lista</button>
    {erro && <p role="alert" style={{ color: '#dc2626' }}>{erro}</p>}
    {carregando ? <p>Carregando clientes...</p> : lista.map(c => <article key={c.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 14, background: cardBg, border: '1px solid ' + border, borderRadius: 12 }}>
      <div><strong>{c.email}</strong><div style={{ fontSize: 12, opacity: .7, marginTop: 5 }}>{ativo(c) ? 'PRO ATIVO' : 'GRATUITO'} · Cadastro: {c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—'}</div></div>
      <button disabled={processando === c.user_id} onClick={() => alterar(c, !ativo(c))} style={{ padding: '10px 14px', border: 0, borderRadius: 9, color: '#fff', background: ativo(c) ? '#b91c1c' : '#16a34a' }}>{processando === c.user_id ? 'Aguarde...' : ativo(c) ? 'Cancelar PRO' : 'Liberar PRO'}</button>
    </article>)}
  </section>
}
