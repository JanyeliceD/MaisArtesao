import { api } from './api'

export interface Categoria {
  id: number
  nome: string
}

export const categoriaService = {
  async listar(): Promise<Categoria[]> {
    const response = await api.get('/categorias')

    return response.data.map((item: any) => ({
      id: item.id_categoria ?? item.id,
      nome: item.nome || item.titulo,
    }))
  },
}