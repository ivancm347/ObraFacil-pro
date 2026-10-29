
import { useState, useEffect } from 'react'
import { CODIGO_ATIVACAO, CODIGO_MESTRE, LIMITE_GRATIS } from '../constants.js'
import Icon from '../components/Icon.jsx'

export default function Configuracoes({ empresa, setEmpresa, temaEscuro, mostrarNotificacao, cardBg, border, produtos }) {
  const [logoPreview, setLogoPreview] = useState(empresa.logo || '')
  const [codigoInput, setCodigoInput] = useState('')
  const [licenciado, setLicenciado] = useState(false)
  const [tentativas, setTentativas] = useState(0)

  useEffect(() => {
    const lic = localStorage.getItem('obrafacil_licenca')
    if (lic === 'ativo') {
      setLicenciado(true)
    }
    setLogoPreview(empresa.logo || '')
  }, [])

  const ativarLicenca = () => {
    const codigo = codigoInput.trim().toUpperCase()
    if (codigo === CODIGO_ATIVACAO || codigo === CODIGO_MESTRE) {
      localStorage.setItem('obrafacil_licenca', 'ativo')
      setLicenciado(true)
      mostrarNotificacao('✅ Licença ativada! Logo e nome liberados. Recarregando...')
      setCodigoInput('')
      setTimeout(()=>location.reload(), 1000)
    } else {
      setTentativas(t => t + 1)
      mostrarNotificacao('❌ Código inválido!')
      if (tentativas >= 2) {
        mostrarNotificacao('❌ Código incorreto. Contate o suporte.')
      }
    }
  }

  const bloquearNovamente = () => {
    if (confirm('Bloquear edição de logo e nome novamente?')) {
      localStorage.removeItem('obrafacil_licenca')
      setLicenciado(false)
      mostrarNotificacao('🔒 Bloqueado novamente')
    }
  }

  const handleLogo = (e) => {
    if (!licenciado) {
      mostrarNotificacao('🔒 Ative com código para alterar logo')
      return
    }
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 1024*1024) { mostrarNotificacao('Logo muito grande, max 1MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result
      setLogoPreview(base64)
      setEmpresa({ ...empresa, logo: base64 })
      mostrarNotificacao('Logo carregada!')
    }
    reader.readAsDataURL(file)
  }

  const removerLogo = () => {
    if (!licenciado) {
      mostrarNotificacao('🔒 Ative com código para remover logo')
      return
    }
    setLogoPreview('')
    setEmpresa({ ...empresa, logo: '' })
    mostrarNotificacao('Logo removida')
  }

  const exportarBackup = () => {
    const lerLista = (chave) => {
      try {
        const valor = JSON.parse(localStorage.getItem(chave) || '[]')
        return Array.isArray(valor) ? valor : []
      } catch {
        return []
      }
    }
    const dados = {
      produtos: lerLista('obrafacil_produtos'),
      clientes: lerLista('obrafacil_clientes'),
      obras: lerLista('obrafacil_obras'),
      orcamentos: lerLista('obrafacil_orcamentos'),
      empresa,
      licenca: localStorage.getItem('obrafacil_licenca') || 'inativo',
      data: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(dados, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-obrafacil-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    mostrarNotificacao('Backup exportado com produtos, clientes, obras e orçamentos!')
  }

  const importarBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      mostrarNotificacao('Arquivo muito grande. O limite é 10 MB.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result)
        const listas = ['produtos', 'clientes', 'obras', 'orcamentos']
        const backupValido = d && typeof d === 'object' &&
          listas.every(chave => Array.isArray(d[chave])) &&
          d.empresa && typeof d.empresa === 'object' && !Array.isArray(d.empresa)
        if (!backupValido) {
          mostrarNotificacao('Backup inválido ou incompleto. Nenhum dado foi alterado.')
          return
        }
        const resumo = listas.map(chave => `${chave}: ${d[chave].length}`).join(' • ')
        if (!confirm(`Restaurar este backup? Os dados atuais serão substituídos.\n\n${resumo}\n\nRecomendamos exportar um backup atual antes de continuar.`)) return
        localStorage.setItem('obrafacil_produtos', JSON.stringify(d.produtos))
        localStorage.setItem('obrafacil_clientes', JSON.stringify(d.clientes))
        localStorage.setItem('obrafacil_obras', JSON.stringify(d.obras))
        localStorage.setItem('obrafacil_orcamentos', JSON.stringify(d.orcamentos))
        localStorage.setItem('obrafacil_empresa', JSON.stringify(d.empresa))
        setEmpresa(d.empresa)
        setLogoPreview(d.empresa.logo || '')
        // A licença é específica deste navegador e nunca deve ser ativada por um arquivo de backup.
        mostrarNotificacao('Backup validado e restaurado. Recarregando...')
        setTimeout(() => location.reload(), 1200)
      } catch {
        mostrarNotificacao('Não foi possível ler o arquivo. Use um backup JSON válido.')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const limparTudo = () => {
    if (confirm('Apagar TODOS os dados? Isso nao pode ser desfeito!')) {
      const lic = localStorage.getItem('obrafacil_licenca')
      localStorage.clear()
      if (lic) localStorage.setItem('obrafacil_licenca', lic)
      mostrarNotificacao('Dados apagados! Recarregando...')
      setTimeout(()=>location.reload(), 800)
    }
  }

  const iSt = { width: '100%', padding: '12px', border: `1px solid ${border}`, borderRadius: 10, background: licenciado ? (temaEscuro?'#0f172a':'#fff') : (temaEscuro?'#1a1f2e':'#f1f5f9'), color: 'inherit', boxSizing: 'border-box', opacity: licenciado ? 1 : 0.6 }
  const label = { fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', marginBottom: 4, display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Configuracoes</h2>

      {/* BLOQUEIO POR CÓDIGO */}
      {!licenciado ? (
        <div style={{ background: `linear-gradient(135deg, #1e293b 0%, #334155 100%)`, borderRadius: 20, padding: 24, color: '#fff', border: '2px solid #F05A28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F05A28', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="settings" size={24} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Logo e Nome Bloqueados</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>Digite o código de ativação para liberar</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input 
              type="text" 
              value={codigoInput} 
              onChange={e=>setCodigoInput(e.target.value.toUpperCase())} 
              placeholder="Digite o código"
              style={{ flex: 1, padding: '14px', borderRadius: 12, border: '2px solid #F05A28', background: '#0f172a', color: '#fff', fontWeight: 700, letterSpacing: 2, textAlign: 'center' }}
              onKeyDown={e=> e.key==='Enter' && ativarLicenca()}
            />
            <button onClick={ativarLicenca} style={{ padding: '14px 24px', background: '#F05A28', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>ATIVAR</button>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
            🔒 Código protegido • Contate o administrador
          </div>
        </div>
      ) : (
        <div style={{ background: '#dcfce7', border: '1.5px solid #22c55e', borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>✅ Licenciado - Logo e nome liberados</div>
          <button onClick={bloquearNovamente} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #22c55e', borderRadius: 8, fontSize: 11, cursor: 'pointer', color: '#15803d' }}>Bloquear novamente</button>
        </div>
      )}

      {/* EMPRESA */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 24, opacity: licenciado ? 1 : 0.7, position: 'relative' }}>
        {!licenciado && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', borderRadius: 20, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>🔒 BLOQUEADO - ATIVE COM CÓDIGO</div></div>}
        
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Dados da Empresa</h3>
        <p style={{ fontSize: 12, opacity: 0.6, margin: '0 0 16px' }}>Esses dados aparecem no topo do PDF {licenciado ? '' : '(bloqueado)'}</p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ width: 120, height: 120, borderRadius: 16, border: `2px dashed ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: temaEscuro?'#0f172a':'#f8fafc' }}>
            {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, opacity: 0.5, textAlign: 'center' }}>Sem logo</span>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={label}>Logo da empresa (PNG/JPG até 1MB) {licenciado ? '' : '🔒'}</label>
            <input type="file" accept="image/*" onChange={handleLogo} disabled={!licenciado} style={{ width: '100%', padding: 10, border: `1px solid ${border}`, borderRadius: 10, background: temaEscuro?'#0f172a':'#fff', marginBottom: 8, opacity: licenciado ? 1 : 0.5 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={removerLogo} disabled={!licenciado} style={{ padding: '8px 12px', border: `1px solid ${border}`, background: 'transparent', borderRadius: 8, cursor: licenciado ? 'pointer' : 'not-allowed', fontSize: 12, opacity: licenciado ? 1 : 0.5 }}>Remover logo</button>
              <span style={{ fontSize: 11, opacity: 0.5, alignSelf: 'center' }}>{licenciado ? 'Aparece no PDF' : 'Bloqueado'}</span>
            </div>
          </div>
        </div>

        <label style={label}>Nome da empresa * {licenciado ? '' : '🔒'}</label>
        <input value={empresa.nome} onChange={e=> licenciado && setEmpresa({...empresa, nome: e.target.value})} disabled={!licenciado} placeholder="Ex: Ivan Gesso & Drywall" style={{ ...iSt, marginBottom: 12 }} />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>Telefone / WhatsApp</label>
            <input value={empresa.telefone} onChange={e=>setEmpresa({...empresa, telefone: e.target.value})} placeholder="(13) 99999-9999" style={{ ...iSt, marginBottom: 12, opacity: 1, background: temaEscuro?'#0f172a':'#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>CNPJ / CPF</label>
            <input value={empresa.cnpj} onChange={e=>setEmpresa({...empresa, cnpj: e.target.value})} placeholder="00.000.000/0001-00" style={{ ...iSt, marginBottom: 12, opacity: 1, background: temaEscuro?'#0f172a':'#fff' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>Chave PIX (aparece no PDF)</label>
            <input value={empresa.pix} onChange={e=>setEmpresa({...empresa, pix: e.target.value})} placeholder="CPF, celular ou chave aleatoria" style={{ ...iSt, marginBottom: 12, opacity: 1, background: temaEscuro?'#0f172a':'#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>Cidade / Endereco</label>
            <input value={empresa.endereco} onChange={e=>setEmpresa({...empresa, endereco: e.target.value})} placeholder="Itanhaem - SP" style={{ ...iSt, marginBottom: 12, opacity: 1, background: temaEscuro?'#0f172a':'#fff' }} />
          </div>
        </div>

        <div style={{ background: temaEscuro?'#0f172a':'#f0fdf4', border: `1px solid ${temaEscuro?'#1e3a2e':'#bbf7d0'}`, borderRadius: 12, padding: 12, marginTop: 8, fontSize: 12 }}>
          <strong>Preview do PDF:</strong> {empresa.nome} • {empresa.telefone} • {empresa.cnpj ? `CNPJ ${empresa.cnpj}` : ''} {empresa.pix ? `• PIX ${empresa.pix}` : ''}
        </div>
      </div>

      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 20 }}>
        <h3 style={{ margin: '0 0 12px' }}>Backup e Restauracao</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportarBackup} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Exportar Backup JSON</button>
          <label style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
            Importar Backup
            <input type="file" accept=".json" onChange={importarBackup} style={{ display: 'none' }} />
          </label>
          <button onClick={limparTudo} style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Apagar Tudo</button>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          Produtos: {produtos?.length || 0} • Licença: {licenciado ? 'Ativa' : 'Inativa'} • {licenciado ? 'Logo liberada' : 'Logo bloqueada'}
        </div>
      </div>
    </div>
  )
}
