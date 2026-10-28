import { useState } from 'react'

export default function Clientes({ clientes, setClientes, mostrarNotificacao, temaEscuro, cardBg, border }) {
  const [modoModal, setModoModal] = useState(null)
  const [form, setForm] = useState({
    id: null,
    nome: '',
    telefone: '',
    endereco: ''
  })

  const abrirNovo = () => {
    setForm({ id: null, nome: '', telefone: '', endereco: '' })
    setModoModal('novo')
  }

  const abrirEditar = (cliente) => {
    setForm({ ...cliente })
    setModoModal('editar')
  }

  const salvar = () => {
    if (!form.nome.trim()) {
      mostrarNotificacao('⚠️ Nome é obrigatório!')
      return
    }

    if (modoModal === 'novo') {
      const novo = {
        id: `cli-${Date.now()}`,
        nome: form.nome,
        telefone: form.telefone,
        endereco: form.endereco
      }
      setClientes([novo, ...clientes])
      mostrarNotificacao('✅ Cliente cadastrado com sucesso!')
    } else {
      setClientes(clientes.map(c => c.id === form.id ? { ...form } : c))
      mostrarNotificacao('✅ Cliente atualizado com sucesso!')
    }

    setModoModal(null)
  }

  const excluir = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id))
      mostrarNotificacao('✅ Cliente excluído!')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>👤 Clientes ({clientes.length})</h2>

      <button
        onClick={abrirNovo}
        style={{
          padding: '12px 24px',
          background: '#F05A28',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ➕ Novo Cliente
      </button>

      {clientes.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          border: '2px dashed #cbd5e1',
          borderRadius: '18px',
          textAlign: 'center',
          opacity: 0.6
        }}>
          Nenhum cliente cadastrado ainda
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {clientes.map(cliente => (
            <div
              key={cliente.id}
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: cardBg || (temaEscuro ? '#1e293b' : '#fff'),
                border: `1.5px solid ${border || '#e6ebf2'}`
              }}
            >
              <h3 style={{ margin: '0 0 8px 0' }}>{cliente.nome}</h3>
              {cliente.telefone && (
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.7 }}>
                  📞 {cliente.telefone}
                </p>
              )}
              {cliente.endereco && (
                <p style={{ margin: '4px 0', fontSize: '14px', opacity: 0.7 }}>
                  📍 {cliente.endereco}
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => abrirEditar(cliente)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => excluir(cliente.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulário */}
      {modoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: temaEscuro ? '#1e293b' : '#fff',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {modoModal === 'novo' ? '➕ Novo Cliente' : '✏️ Editar Cliente'}
            </h3>

            <label style={{ display: 'block', marginTop: '14px', marginBottom: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
              Nome Completo
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome do cliente"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #d0d7e2',
                borderRadius: '12px',
                background: temaEscuro ? '#334155' : '#fff',
                color: 'inherit'
              }}
            />

            <label style={{ display: 'block', marginTop: '14px', marginBottom: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #d0d7e2',
                borderRadius: '12px',
                background: temaEscuro ? '#334155' : '#fff',
                color: 'inherit'
              }}
            />

            <label style={{ display: 'block', marginTop: '14px', marginBottom: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
              Endereço
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #d0d7e2',
                borderRadius: '12px',
                background: temaEscuro ? '#334155' : '#fff',
                color: 'inherit'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setModoModal(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1.5px solid #d0d7e2',
                  background: 'transparent',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: '#F05A28',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                💾 Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}