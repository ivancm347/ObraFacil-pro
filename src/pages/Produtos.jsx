import { useState } from 'react'

export default function Produtos({ produtos, setProdutos, mostrarNotificacao, formatarMoeda, temaEscuro, cardBg, border }) {
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [modoModal, setModoModal] = useState(null)
  const [form, setForm] = useState({ id: null, nome: '', categoria: '', unidade: 'un', codigo: '', preco: '' })

  const categorias = ['Todas', ...new Set(produtos.map(p => p.categoria).filter(Boolean))]

  const filtrados = produtos.filter(p => {
    const termo = busca.trim().toLowerCase()
    const matchBusca = String(p.nome || '').toLowerCase().includes(termo) || String(p.codigo || '').toLowerCase().includes(termo)
    const matchCat = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro
    return matchBusca && matchCat
  })

  const abrirNovo = () => {
    setForm({ id: null, nome: '', categoria: '', unidade: 'un', codigo: `COD-${String(produtos.length + 1).padStart(4, '0')}`, preco: '' })
    setModoModal('novo')
  }

  const abrirEditar = (produto) => {
    setForm({ ...produto, preco: String(produto.preco) })
    setModoModal('editar')
  }

  const salvar = () => {
    if (!form.nome.trim()) { mostrarNotificacao('⚠️ Nome é obrigatório!'); return }
    if (form.preco === '' || !Number.isFinite(Number(form.preco)) || Number(form.preco) < 0) { mostrarNotificacao('⚠️ Informe um preço válido, igual ou maior que zero.'); return }

    const codigoInformado = form.codigo.trim().toLowerCase()
    if (codigoInformado && produtos.some(p => String(p.codigo || '').trim().toLowerCase() === codigoInformado && p.id !== form.id)) {
      mostrarNotificacao('⚠️ Já existe um produto com esse código. Use outro código.'); return
    }

    const dados = {
      id: form.id || `prod-${Date.now()}`,
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || 'Geral',
      unidade: form.unidade.trim() || 'un',
      codigo: form.codigo.trim() || `COD-${Date.now()}`,
      preco: Number(form.preco)
    }

    if (modoModal === 'novo') {
      setProdutos([dados, ...produtos])
      mostrarNotificacao('✅ Produto cadastrado!')
    } else {
      setProdutos(produtos.map(p => p.id === form.id ? dados : p))
      mostrarNotificacao('✅ Produto atualizado!')
    }
    setModoModal(null)
  }

  const exportarCSV = () => {
    if (!produtos.length) { mostrarNotificacao('⚠️ Não há produtos para exportar.'); return }
    const colunas = ['codigo', 'nome', 'categoria', 'unidade', 'preco']
    const escapar = valor => {
      const texto = String(valor ?? '')
      return '"' + texto.replace(/"/g, '""') + '"'
    }
    const linhas = [
      ['Código', 'Nome', 'Categoria', 'Unidade', 'Preço (R$)'].map(escapar).join(';'),
      ...produtos.map(p => colunas.map(chave => escapar(p[chave])).join(';'))
    ]
    const arquivo = new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = 'obrafacil-produtos.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    mostrarNotificacao('✅ Catálogo exportado para CSV!')
  }

  const baixarModeloCSV = () => {
    const linhas = [
      ['Código', 'Nome', 'Categoria', 'Unidade', 'Preço (R$)'],
      ['EX-001', 'Placa Drywall ST 1,20x1,80m', 'Drywall', 'un', '28,90'],
      ['EX-002', 'Instalação de forro', 'Serviços', 'm²', '45,00']
    ]
    const escapar = valor => '"' + String(valor ?? '').replace(/"/g, '""') + '"'
    const csv = '\uFEFF' + linhas.map(l => l.map(escapar).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo-obrafacil-produtos.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    mostrarNotificacao('✅ Modelo CSV baixado. Substitua os exemplos pelos seus produtos.')
  }

  const importarCSV = async (evento) => {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return

    try {
      let texto = (await arquivo.text()).replace(/^\uFEFF/, '')
      // Detecta o separador no cabeçalho, ignorando separadores dentro de aspas.
      const detectarSeparador = (entrada) => {
        let aspas = false, pontoVirgula = 0, virgula = 0
        for (let i = 0; i < entrada.length; i++) {
          const c = entrada[i]
          if (c === '"' && aspas && entrada[i + 1] === '"') i++
          else if (c === '"') aspas = !aspas
          else if (!aspas && (c === '\n' || c === '\r')) break
          else if (!aspas && c === ';') pontoVirgula++
          else if (!aspas && c === ',') virgula++
        }
        return pontoVirgula >= virgula ? ';' : ','
      }
      const sep = detectarSeparador(texto)
      const dividirCSV = (entrada, separador) => {
        const linhas = []
        let linha = [], campo = '', aspas = false
        for (let i = 0; i < entrada.length; i++) {
          const c = entrada[i]
          if (c === '"' && aspas && entrada[i + 1] === '"') { campo += '"'; i++ }
          else if (c === '"') aspas = !aspas
          else if (c === separador && !aspas) { linha.push(campo); campo = '' }
          else if ((c === '\n' || c === '\r') && !aspas) {
            if (c === '\r' && entrada[i + 1] === '\n') i++
            linha.push(campo)
            if (linha.some(v => v.trim() !== '')) linhas.push(linha)
            linha = []
            campo = ''
          } else campo += c
        }
        if (campo.length || linha.length) {
          linha.push(campo)
          if (linha.some(v => v.trim() !== '')) linhas.push(linha)
        }
        return linhas
      }
      const tabela = dividirCSV(texto, sep)
      if (tabela.length < 2) { mostrarNotificacao('⚠️ O CSV não contém produtos.'); return }
      const normalizar = v => String(v || '').replace(/^\uFEFF/, '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
      const cab = tabela[0].map(normalizar)
      const localizar = nomes => cab.findIndex(c => nomes.includes(c))
      const ix = {
        codigo: localizar(['codigo', 'code', 'sku']),
        nome: localizar(['nome', 'produto', 'nomedoproduto', 'name']),
        categoria: localizar(['categoria', 'category']),
        unidade: localizar(['unidade', 'un', 'unit']),
        preco: localizar(['preco', 'precors', 'valor', 'price'])
      }
      if (ix.nome < 0 || ix.preco < 0) {
        mostrarNotificacao('⚠️ Cabeçalho inválido. Use Código;Nome;Categoria;Unidade;Preço (R$).')
        return
      }
      const erros = []
      const codigosArquivo = new Set()
      const existentes = new Set(produtos.map(p => String(p.codigo || '').trim().toLowerCase()).filter(Boolean))
      const novos = []
      for (let i = 1; i < tabela.length; i++) {
        const campos = tabela[i]
        if (campos.every(v => !String(v || '').trim())) continue
        const nome = String(campos[ix.nome] || '').trim()
        const codigo = ix.codigo >= 0 ? String(campos[ix.codigo] || '').trim() : ''
        const categoria = ix.categoria >= 0 ? String(campos[ix.categoria] || '').trim() : ''
        const unidade = ix.unidade >= 0 ? String(campos[ix.unidade] || '').trim() : ''
        let precoTexto = String(campos[ix.preco] || '').trim().replace(/R\$\s?/gi, '').replace(/\s/g, '')
        if (precoTexto.includes(',')) precoTexto = precoTexto.replace(/\./g, '').replace(',', '.')
        const preco = Number(precoTexto)
        const codigoNormal = codigo.toLowerCase()
        if (!nome) erros.push('Linha ' + (i + 1) + ': nome vazio.')
        else if (campos[ix.preco] == null || precoTexto === '' || !Number.isFinite(preco) || preco < 0) erros.push('Linha ' + (i + 1) + ': preço inválido.')
        else if (codigoNormal && (existentes.has(codigoNormal) || codigosArquivo.has(codigoNormal))) erros.push('Linha ' + (i + 1) + ': código duplicado ' + codigo + '.')
        else {
          if (codigoNormal) codigosArquivo.add(codigoNormal)
          novos.push({ id: 'prod-import-' + Date.now() + '-' + i, codigo: codigo || 'IMP-' + Date.now() + '-' + i, nome, categoria: categoria || 'Geral', unidade: unidade || 'un', preco })
        }
      }
      if (erros.length) {
        const resumo = erros.slice(0, 4).join(' ')
        mostrarNotificacao('⚠️ Importação cancelada: ' + erros.length + ' erro(s). ' + resumo + (erros.length > 4 ? ' Confira o arquivo e tente novamente.' : ''))
        return
      }
      if (!novos.length) { mostrarNotificacao('⚠️ Nenhum produto novo válido foi encontrado.'); return }
      setProdutos([...novos, ...produtos])
      mostrarNotificacao('✅ ' + novos.length + ' produto(s) importado(s)!')
    } catch {
      mostrarNotificacao('⚠️ Não foi possível ler esse arquivo. Salve como CSV UTF-8 e tente novamente.')
    }
  }

  const excluir = (id) => {
    if (window.confirm('Excluir este produto? Ele será removido dos orçamentos futuros.')) {
      setProdutos(produtos.filter(p => p.id !== id))
      mostrarNotificacao('🗑️ Produto excluído!')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📦 Produtos ({filtrados.length}/{produtos.length})</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={baixarModeloCSV}
            style={{ padding: '12px 16px', background: temaEscuro ? '#334155' : '#eef2f7', color: 'inherit', border: '1px solid #d0d7e2', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
            📄 Modelo CSV
          </button>
          <button onClick={() => document.getElementById('importar-csv-produtos')?.click()}
            style={{ padding: '12px 16px', background: temaEscuro ? '#334155' : '#eef2f7', color: 'inherit', border: '1px solid #d0d7e2', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
            ⬆️ Importar CSV
          </button>
          <input id="importar-csv-produtos" type="file" accept=".csv,text/csv" onChange={importarCSV} style={{ display: 'none' }} />
          <button onClick={exportarCSV}
            style={{ padding: '12px 16px', background: temaEscuro ? '#334155' : '#eef2f7', color: 'inherit', border: '1px solid #d0d7e2', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
            ⬇️ Exportar CSV
          </button>
          <button onClick={abrirNovo}
            style={{ padding: '12px 24px', background: '#F05A28', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
            ➕ Novo Produto
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Buscar por nome ou código..."
          value={busca} onChange={e => setBusca(e.target.value)}
          style={{ flex: 2, minWidth: '200px', padding: '12px 14px', border: '1.5px solid #d0d7e2', borderRadius: '12px', background: temaEscuro ? '#334155' : '#fff', color: 'inherit' }} />
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          style={{ flex: 1, minWidth: '140px', padding: '12px 14px', border: '1.5px solid #d0d7e2', borderRadius: '12px', background: temaEscuro ? '#334155' : '#fff', color: 'inherit' }}>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div style={{ padding: '40px 20px', border: '2px dashed #cbd5e1', borderRadius: '18px', textAlign: 'center', opacity: 0.6 }}>
          Nenhum produto encontrado
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {filtrados.map(p => (
            <div key={p.id} style={{ padding: '18px', borderRadius: '16px', background: temaEscuro ? '#1e293b' : '#fff', border: '1.5px solid #e6ebf2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>{p.categoria}</span>
                  <span style={{ fontSize: '11px', opacity: 0.5 }}>{p.codigo}</span>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', lineHeight: '1.3' }}>{p.nome}</h3>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>{p.unidade} • {formatarMoeda(p.preco)}</div>
                <div style={{ fontWeight: 800, fontSize: '20px', color: '#F05A28', marginTop: '8px' }}>{formatarMoeda(p.preco)}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => abrirEditar(p)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#e2e8f0', cursor: 'pointer' }}>✏️ Editar</button>
                <button onClick={() => excluir(p.id)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: temaEscuro ? '#1e293b' : '#fff', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0 }}>{modoModal === 'novo' ? '➕ Novo Produto' : '✏️ Editar Produto'}</h3>

            <label style={labelStyle}>Nome do produto / serviço *</label>
            <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Placa Drywall ST 12.5mm"
              style={inputStyle(temaEscuro)} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Categoria</label>
                <input type="text" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Drywall, Tintas..."
                  style={inputStyle(temaEscuro)} list="categorias-list" />
                <datalist id="categorias-list">{categorias.filter(c=>c!=='Todas').map(c=><option key={c} value={c} />)}</datalist>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unidade</label>
                <select value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} style={inputStyle(temaEscuro)}>
                  <option value="un">un</option><option value="m²">m²</option><option value="m³">m³</option><option value="m">m</option><option value="kg">kg</option><option value="diária">diária</option><option value="sc">sc</option><option value="cx">cx</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Código</label>
                <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} style={inputStyle(temaEscuro)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Preço (R$) *</label>
                <input type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="0,00" style={inputStyle(temaEscuro)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setModoModal(null)} style={{ flex: 1, padding: '12px', border: '1.5px solid #d0d7e2', background: 'transparent', borderRadius: '10px', cursor: 'pointer', color: 'inherit' }}>Cancelar</button>
              <button onClick={salvar} style={{ flex: 1, padding: '12px', border: 'none', background: '#F05A28', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>💾 Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', marginTop: '14px', marginBottom: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }
const inputStyle = (temaEscuro) => ({ width: '100%', padding: '12px 14px', border: '1.5px solid #d0d7e2', borderRadius: '12px', background: temaEscuro ? '#334155' : '#fff', color: 'inherit', boxSizing: 'border-box' })
