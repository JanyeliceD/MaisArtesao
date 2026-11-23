<template>
  <div>
    <Navbar />

    <v-container class="mt-6 p">
      <!-- Cabeçalho limpo com título da página -->
      <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
        <h1 class="text-h4 font-weight-bold">
          Painel do Artesão
        </h1>

        <v-btn
          color="success"
          prepend-icon="mdi-cash-register"
          @click="abrirModalVenda"
        >
          Registrar Venda
        </v-btn>
      </div>

      <!-- Abas limpas separando Estoque e Caixa/Vendas -->
      <v-tabs v-model="abaAtiva" color="primary" class="mb-6">
        <v-tab value="estoque" prepend-icon="mdi-package-variant">
          Meu Estoque
        </v-tab>
        <v-tab value="vendas" prepend-icon="mdi-receipt-text">
          Caixa e Vendas
          <v-badge
            v-if="vendas.length > 0"
            :content="vendas.length"
            color="primary"
            inline
            class="ml-2"
          />
        </v-tab>
      </v-tabs>

      <!-- Conteúdo das Abas -->
      <v-window v-model="abaAtiva">
        <!-- ABA 1: MEU ESTOQUE -->
        <v-window-item value="estoque">
          <v-row class="mb-4" align="center">
            <v-col>
              <h2 class="text-h6 font-weight-bold">Peças cadastradas</h2>
            </v-col>
            <v-col class="text-right">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirModalCadastro()">
                Nova Peça
              </v-btn>
            </v-col>
          </v-row>

          <v-card variant="outlined" rounded="xl">
            <v-data-table
              :headers="headersProdutos"
              :items="produtos"
              no-data-text="Nenhuma peça cadastrada ainda."
            >
              <template #item.foto="{ item }">
                <v-img :src="item.foto" width="50" height="50" cover class="rounded my-2" />
              </template>
              <template #item.preco="{ item }">
                {{ moeda(item.preco) }}
              </template>
              <template #item.quantidade_estoque="{ item }">
                <v-chip
                  size="small"
                  :color="(item.quantidade_estoque ?? 0) > 0 ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ item.quantidade_estoque ?? 0 }} un.
                </v-chip>
              </template>
              <template #item.acoes="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="abrirModalEdicao(item)"
                />
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- ABA 2: CAIXA E VENDAS -->
        <v-window-item value="vendas">
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-card class="pa-4" variant="outlined" rounded="lg">
                <div class="text-caption text-medium-emphasis">Faturamento Total</div>
                <div class="text-h6 font-weight-bold text-success mt-1">{{ moeda(faturamento) }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card class="pa-4" variant="outlined" rounded="lg">
                <div class="text-caption text-medium-emphasis">Total de Vendas</div>
                <div class="text-h6 font-weight-bold mt-1">{{ vendas.length }}</div>
              </v-card>
            </v-col>
          </v-row>

          <v-card variant="outlined" rounded="xl">
            <v-data-table
              :headers="headersVendas"
              :items="vendas"
              :items-per-page="8"
              no-data-text="Nenhuma venda registrada ainda."
            >
              <template #item.data="{ item }">
                {{ formatarData(item.data) }}
              </template>
              <template #item.origem="{ item }">
                <v-chip
                  size="small"
                  :color="item.origem === 'PRESENCIAL' || item.origem === 'MANUAL' ? 'orange' : 'blue'"
                  variant="tonal"
                >
                  {{ item.origem === 'PRESENCIAL' || item.origem === 'MANUAL' ? 'Presencial' : 'Vitrine' }}
                </v-chip>
              </template>
              <template #item.total="{ item }">
                <strong>{{ moeda(item.total) }}</strong>
              </template>
              <template #item.acoes="{ item }">
                <v-btn
                  icon="mdi-eye-outline"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="verDetalhesVenda(item)"
                />
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- MODAL: CADASTRO/EDIÇÃO DE PEÇA -->
      <ProductFormDialog
        v-model="dialogPeca"
        :initial-data="produtoSelecionado"
        :loading="salvandoPeca"
        @save="salvarProduto"
      />

      <!-- MODAL: REGISTRAR VENDA PRESENCIAL -->
      <v-dialog v-model="dialogVenda" max-width="500">
        <v-card rounded="lg">
          <v-card-title class="pa-4 text-h6 font-weight-bold">Registrar venda presencial</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="salvarVendaManual">
              <v-select
                v-model="formVenda.produtoId"
                :items="opcoesProdutos"
                item-title="title"
                item-value="value"
                label="Peça vendida"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model.number="formVenda.quantidade"
                label="Quantidade"
                type="number"
                min="1"
                :max="produtoVendaSelecionado?.quantidade_estoque ?? undefined"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />
              <v-select
                v-model="formVenda.forma_pagamento"
                :items="[
                  { title: 'PIX', value: 'PIX' },
                  { title: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
                  { title: 'Dinheiro', value: 'DINHEIRO' },
                ]"
                item-title="title"
                item-value="value"
                label="Forma de pagamento"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              />

              <v-alert v-if="produtoVendaSelecionado" type="info" variant="tonal" class="mb-4">
                Total: <strong>{{ moeda(produtoVendaSelecionado.preco * formVenda.quantidade) }}</strong>
              </v-alert>

              <div class="d-flex justify-end ga-2">
                <v-btn variant="text" @click="dialogVenda = false">Cancelar</v-btn>
                <v-btn
                  color="success"
                  type="submit"
                  :loading="salvandoVenda"
                  :disabled="!produtoVendaSelecionado || formVenda.quantidade < 1"
                >
                  Salvar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- MODAL: DETALHES DA VENDA -->
      <v-dialog v-model="dialogDetalhe" max-width="450">
        <v-card v-if="vendaSelecionada" rounded="lg">
          <v-card-title class="pa-4 text-h6 font-weight-bold">Detalhes da venda #{{ vendaSelecionada.id }}</v-card-title>
          <v-card-text>
            <p class="mb-1"><strong>Cliente:</strong> {{ vendaSelecionada.cliente }}</p>
            <p class="mb-1"><strong>Data:</strong> {{ formatarData(vendaSelecionada.data) }}</p>
            <p class="mb-1"><strong>Pagamento:</strong> {{ vendaSelecionada.pagamento }}</p>
            <v-divider class="my-3" />
            <div v-for="(item, idx) in vendaSelecionada.itens" :key="idx" class="d-flex justify-space-between mb-2">
              <span>{{ item.quantidade }}x {{ item.nome }}</span>
              <span>{{ moeda(item.quantidade * item.precoUnitario) }}</span>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between text-h6 font-weight-bold text-primary">
              <span>Total</span>
              <span>{{ moeda(vendaSelecionada.total) }}</span>
            </div>
          </v-card-text>
          <v-card-actions class="pa-3">
            <v-spacer />
            <v-btn color="primary" @click="dialogDetalhe = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- SNACKBAR -->
      <v-snackbar v-model="avisoAberto" color="success" timeout="2500">{{ aviso }}</v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import ProductFormDialog, { type ProductFormData } from '@/components/ProductFormDialog.vue'
import { api } from '@/services/api'

interface VendaItem {
  produtoId: number
  nome: string
  quantidade: number
  precoUnitario: number
}

interface Venda {
  id: number
  cliente: string
  origem: string
  pagamento: string
  total: number
  data: string
  itens: VendaItem[]
}

const abaAtiva = ref('estoque')
const dialogPeca = ref(false)
const dialogVenda = ref(false)
const dialogDetalhe = ref(false)
const salvandoPeca = ref(false)
const salvandoVenda = ref(false)
const avisoAberto = ref(false)
const aviso = ref('')

const produtos = ref<ProductFormData[]>([])
const vendas = ref<Venda[]>([])
const produtoSelecionado = ref<ProductFormData | null>(null)
const vendaSelecionada = ref<Venda | null>(null)

const formVenda = ref({
  produtoId: null as number | null,
  quantidade: 1,
  forma_pagamento: 'PIX',
})

const headersProdutos = [
  { title: 'Foto', key: 'foto', sortable: false },
  { title: 'Nome', key: 'nome' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Preço', key: 'preco' },
  { title: 'Estoque', key: 'quantidade_estoque' },
  { title: 'Ações', key: 'acoes', sortable: false },
]

const headersVendas = [
  { title: 'Data', key: 'data' },
  { title: 'Cliente', key: 'cliente' },
  { title: 'Origem', key: 'origem' },
  { title: 'Pagamento', key: 'pagamento' },
  { title: 'Total', key: 'total' },
  { title: 'Detalhes', key: 'acoes', sortable: false },
]

const faturamento = computed(() => vendas.value.reduce((s, v) => s + v.total, 0))
const opcoesProdutos = computed(() =>
  produtos.value.map(p => ({ title: `${p.nome} — ${moeda(p.preco)}`, value: p.id })),
)
const produtoVendaSelecionado = computed(() =>
  produtos.value.find(p => p.id === formVenda.value.produtoId),
)

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarData = (v: string) => new Date(v).toLocaleString('pt-BR')

const carregarProdutos = async () => {
  try {
    const response = await api.get('/produtos/me')
    produtos.value = response.data.map((produto: any) => ({
      id: produto.id_produto,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: Number(produto.preco),
      foto: produto.imagem_url || '',
      id_categoria: produto.categoria?.id_categoria ?? null,
      quantidade_estoque: produto.quantidade_estoque ?? 0,
    }))
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
  }
}
const carregarVendas = async () => {
  try {
    const { data: listaVendas } = await api.get('/vendas/artesao')
    vendas.value = (Array.isArray(listaVendas) ? listaVendas : []).map((v: any) => {
      const idCli = v.idCliente ?? v.id_cliente ?? v.cliente?.idCliente ?? null
      const primeiroPagamento = Array.isArray(v.pagamentos) ? v.pagamentos[0] : v.pagamento

      return {
        id: v.idVenda ?? v.id_venda ?? v.id,
        cliente:
          v.cliente?.usuario?.nome ||
          v.cliente?.nome ||
          (idCli ? `Cliente #${idCli}` : 'Cliente balcão'),
        origem: idCli ? 'VITRINE' : 'PRESENCIAL',
        pagamento:
          primeiroPagamento?.formaPagamento ??
          primeiroPagamento?.forma_pagamento ??
          'PIX',
        total: Number(v.valorTotal ?? v.valor_total ?? 0),
        data: v.dataVenda || v.data_venda || new Date().toISOString(),
        itens: (v.itens || []).map((i: any) => ({
          produtoId: i.idProduto ?? i.id_produto ?? i.produto?.id_produto,
          nome: i.produto?.nome || 'Peça artesanal',
          quantidade: Number(i.quantidade || 1),
          precoUnitario: Number(i.precoUnitario ?? i.preco_unitario ?? 0),
        })),
      }
    })
  } catch (error) {
    console.warn('Erro ao carregar vendas do artesão:', error)
  }
}

const abrirModalCadastro = () => {
  produtoSelecionado.value = null
  dialogPeca.value = true
}

const abrirModalEdicao = (item: ProductFormData) => {
  produtoSelecionado.value = { ...item }
  dialogPeca.value = true
}

const salvarProduto = async (dados: ProductFormData) => {
  salvandoPeca.value = true
  try {
    const dadosProduto = {
      nome: dados.nome,
      descricao: dados.descricao,
      preco: dados.preco,
      quantidade_estoque: dados.quantidade_estoque,
      imagem_url: dados.foto || undefined,
      id_categoria: dados.id_categoria,
    }

    if (dados.id) {
      await api.patch(`/produtos/${dados.id}`, dadosProduto)
    } else {
      await api.post('/produtos', dadosProduto)
    }

    await carregarProdutos()
    dialogPeca.value = false
    aviso.value = dados.id ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!'
    avisoAberto.value = true
  } catch (error: any) {
    console.error('Erro ao salvar produto:', error)
  } finally {
    salvandoPeca.value = false
  }
}

const abrirModalVenda = () => {
  formVenda.value = {
    produtoId: produtos.value[0]?.id ?? null,
    quantidade: 1,
    forma_pagamento: 'PIX',
  }
  dialogVenda.value = true
}

const salvarVendaManual = async () => {
  const p = produtoVendaSelecionado.value
  if (!p || !p.id) return
  salvandoVenda.value = true
  try {
    const payload = {
      forma_pagamento: formVenda.value.forma_pagamento,
      itens: [
        {
          id_produto: p.id,
          quantidade: formVenda.value.quantidade,
        },
      ],
    }
    await api.post('/vendas/presencial', payload)
    dialogVenda.value = false
    aviso.value = 'Venda registrada!'
    avisoAberto.value = true
    await Promise.all([carregarVendas(), carregarProdutos()])
  } catch (error: any) {
    console.error('Erro ao registrar venda:', error)
    const msg = error.response?.data?.message || error.message || 'Erro ao registrar venda'
    alert(Array.isArray(msg) ? msg.join('\n') : msg)
  } finally {
    salvandoVenda.value = false
  }
}

const verDetalhesVenda = (venda: Venda) => {
  vendaSelecionada.value = venda
  dialogDetalhe.value = true
}

onMounted(() => {
  carregarProdutos()
  carregarVendas()
})
</script>