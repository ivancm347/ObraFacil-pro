import React from 'react'

export default function Configuracoes() {
  return (
    <section className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie as preferências do ObraFácil PRO.
        </p>
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Preferências do aplicativo</h2>
          <p className="mt-2 text-sm text-gray-600">
            As configurações disponíveis serão exibidas aqui conforme forem ativadas no aplicativo.
          </p>
        </div>
      </div>
    </section>
  )
}
