import { api } from './api'

export interface NovaVendaPayload {
  idCliente: string // ou id_cliente / id_usuario, conforme sua tabela 'vendas'
  forma_pagamento: string
  valor_total: number
  itens: {
    id_produto: number
    quantidade: number
    preco_unitario: number
  }[]
}

export const vendaService = {
  // Busca o histórico da tabela 'vendas' (junto com 'item_vendas')
  async listar() {
    const response = await api.get('/vendas')
    return response.data
  },

  // Grava na tabela 'vendas' e 'item_vendas'
  async criar(dados: NovaVendaPayload) {
    const response = await api.post('/vendas', dados)
    return response.data
  },
}