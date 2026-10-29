import React, { useRef, useState } from 'react'

export default function Configuracoes({ empresa = {}, setEmpresa, temaEscuro, mostrarNotificacao, cardBg, border, produtos = [] }) {
  const arquivoRef = useRef(null)
  const [form, setForm] = useState(() => ({
    nome: empresa.nome || '',
    cnpj: empresa.cnpj || '',
    telefone: empresa.telefone || '',
    whatsapp: empresa.whatsapp || '',
    email: empresa.email || '',
    endereco: empresa.endereco || '',
    pix: empresa.pix || '',
    logo: empresa.logo || ''
  }))
  const [salvando, setSalvando] = useState(false)
  const fundo = cardBg || (temaEscuro ? '#1e293b' : '#fff')
  const linha = border || (temaEscuro ? '#334155' : '#e2e8f0')
  const cor = temaEscuro ? '#f1f5f9' : '#172033'
  const secundaria = temaEscuro ? '#cbd5e1' : '#64748b'
  const campo = {
    width: '100%', boxSizing: 'border-box', padding: '11px 12px', marginTop: 6,
    border: `1px solid ${linha}`, borderRadius: 10, background: temaEscuro ? '#0f172a' : '#fff',
    color: cor, fontSize: 14, outlineColor: '#F05A28'
  }
  const label = { display: 'block', color: cor, fontSize: 13, fontWeight: 700 }
  const alterar = (chave, valor) => setForm(atual => ({ ...atual, [chave]: valor }))

  const carregarLogo = (evento) => {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      mostrarNotificacao?.('Selecione um arquivo de imagem.')
      evento.target.value = ''
      return
    }
    if (arquivo.size > 1024 * 1024) {
      mostrarNotificacao?.('A imagem deve ter até 1 MB. Reduza o tamanho e tente novamente.')
      evento.target.value = ''
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => alterar('logo', String(leitor.result || ''))
    leitor.onerror = () => mostrarNotificacao?.('Não foi possível ler essa imagem.')
    leitor.readAsDataURL(arquivo)
  }

  const salvar = (evento) => {
    evento.preventDefault()
    setSalvando(true)
    try {
      const dados = { ...empresa, ...form, nome: form.nome.trim() || 'ObraFácil PRO' }
      setEmpresa(dados)
      try { localStorage.setItem('obrafacil_empresa', JSON.stringify(dados)) } catch (erro) {
        mostrarNotificacao?.('Não foi possível salvar. A imagem pode ser grande demais; escolha uma menor.')
        setSalvando(false)
        return
      }
      mostrarNotificacao?.('Configurações da empresa salvas!')
    } finally {
      setSalvando(false)
    }
  }

  const limparLogo = () => {
    alterar('logo', '')
    if (arquivoRef.current) arquivoRef.current.value = ''
  }

  return (
    <section style={{ padding: '8px 0 24px', color: cor }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.6px' }}>Configurações</h1>
        <p style={{ marginTop: 5, color: secundaria, fontSize: 14 }}>Cadastre os dados da sua empresa para aparecerem nos orçamentos.</p>

        <form onSubmit={salvar}>
          <div style={{ marginTop: 22, border: `1px solid ${linha}`, borderRadius: 16, background: fundo, padding: 20, boxShadow: '0 5px 18px rgba(15,23,42,.05)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Dados da empresa</h2>
            <p style={{ color: secundaria, fontSize: 13, marginTop: 4 }}>Essas informações serão usadas nos documentos e PDFs dos orçamentos.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16, marginTop: 18 }}>
              <label style={label}>Nome da empresa *
                <input required value={form.nome} onChange={e => alterar('nome', e.target.value)} placeholder="Ex.: Minha Empresa" style={campo} />
              </label>
              <label style={label}>CNPJ
                <input value={form.cnpj} onChange={e => alterar('cnpj', e.target.value)} placeholder="00.000.000/0000-00" style={campo} />
              </label>
              <label style={label}>Telefone
                <input value={form.telefone} onChange={e => alterar('telefone', e.target.value)} placeholder="(13) 3333-3333" style={campo} />
              </label>
              <label style={label}>WhatsApp
                <input value={form.whatsapp} onChange={e => alterar('whatsapp', e.target.value)} placeholder="(13) 99999-9999" style={campo} />
              </label>
              <label style={label}>E-mail
                <input type="email" value={form.email} onChange={e => alterar('email', e.target.value)} placeholder="contato@empresa.com.br" style={campo} />
              </label>
              <label style={label}>Endereço
                <input value={form.endereco} onChange={e => alterar('endereco', e.target.value)} placeholder="Rua, número, cidade - UF" style={campo} />
              </label>
              <label style={label}>Chave PIX (opcional)
                <input value={form.pix} onChange={e => alterar('pix', e.target.value)} placeholder="Sua chave PIX" style={campo} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 18, border: `1px solid ${linha}`, borderRadius: 16, background: fundo, padding: 20, boxShadow: '0 5px 18px rgba(15,23,42,.05)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Logotipo da empresa</h2>
            <p style={{ color: secundaria, fontSize: 13, marginTop: 4 }}>Escolha uma imagem JPG, PNG ou WEBP de até 1 MB.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ width: 112, height: 92, border: `1px dashed ${linha}`, borderRadius: 12, display: 'grid', placeItems: 'center', background: temaEscuro ? '#0f172a' : '#f8fafc', overflow: 'hidden' }}>
                {form.logo ? <img src={form.logo} alt="Prévia do logotipo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ color: secundaria, fontSize: 12 }}>Sem logotipo</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => arquivoRef.current?.click()} style={{ border: 0, borderRadius: 10, background: '#F05A28', color: '#fff', padding: '11px 15px', fontWeight: 800, cursor: 'pointer' }}>Escolher imagem</button>
                {form.logo && <button type="button" onClick={limparLogo} style={{ border: `1px solid ${linha}`, borderRadius: 10, background: 'transparent', color: cor, padding: '11px 15px', fontWeight: 700, cursor: 'pointer' }}>Remover logotipo</button>}
                <input ref={arquivoRef} type="file" accept="image/*" onChange={carregarLogo} style={{ display: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <p style={{ color: secundaria, fontSize: 12 }}>Catálogo atual: {produtos.length} produtos. Seus produtos e clientes não serão alterados.</p>
            <button type="submit" disabled={salvando} style={{ border: 0, borderRadius: 11, background: salvando ? '#9ca3af' : '#F05A28', color: '#fff', padding: '13px 22px', fontWeight: 800, fontSize: 14, cursor: salvando ? 'wait' : 'pointer' }}>{salvando ? 'Salvando…' : 'Salvar configurações'}</button>
          </div>
        </form>
      </div>
    </section>
  )
}
