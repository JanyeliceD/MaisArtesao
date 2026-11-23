import { api } from './api'

export interface CriarVendaVitrinePayload {
  forma_pagamento: string
  itens: {
    id_produto: number
    quantidade: number
  }[]
}

export const vendaService = {
  // Como o backend ainda não tem GET /vendas, retornamos vazio para evitar o 404
  async listar() {
  const { data } = await api.get('/vendas/minhas') // ou '/vendas', conforme a rota criada
  return data
},

  // Rota POST /vendas/vitrine (exatamente o que está no seu VendasController)
  async criarPelaVitrine(dados: CriarVendaVitrinePayload) {
    const response = await api.post('/vendas/vitrine', dados)
    return response.data
  },
}