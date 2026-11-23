Aqui está o código completo e integrado do componente `ClienteVitrine.vue`.

Ele já foi totalmente adaptado para conversar com o backend NestJS que você enviou: faz a listagem real dos produtos, gerencia o carrinho na gaveta lateral (drawer), valida o estoque em tempo real, permite filtrar por categorias, envia o payload no formato exato que a rota `/vendas/vitrine` espera (`forma_pagamento`, `itens` com `id_produto` e `quantidade`), e busca na aba **Meus Pedidos** o histórico de compras registrado no banco de dados.

```vue
<template>
  <div>
    <Navbar />

    <v-container class="mt-6">
      <!-- Cabeçalho com Título e Botão do Carrinho -->
      <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
        <h1 class="text-h4 font-weight-bold">
          Vitrine de Artesanato — Currais Novos
        </h1>

        <v-btn
          color="primary"
          prepend-icon="mdi-cart"
          size="large"
          @click="carrinhoAberto = true"
        >
          Carrinho ({{ quantidadeCarrinho }})
        </v-btn>
      </div>

      <!-- Abas: Vitrine e Meus Pedidos -->
      <v-tabs v-model="abaAtiva" color="primary" class="mb-6">
        <v-tab value="vitrine" prepend-icon="mdi-store">
          Vitrine
        </v-tab>
        <v-tab value="pedidos" prepend-icon="mdi-clipboard-text-clock">
          Meus Pedidos
          <v-badge
            v-if="meusPedidos.length > 0"
            :content="meusPedidos.length"
            color="primary"
            inline
            class="ml-2"
          />
        </v-tab>
      </v-tabs>

      <!-- Conteúdo das Abas -->
      <v-window v-model="abaAtiva">
        <!-- ABA 1: VITRINE -->
        <v-window-item value="vitrine">
          <!-- Filtro de Categoria -->
          <v-row class="mb-6">
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="categoriaSelecionada"
                :items="categoriasDisponiveis"
                item-title="nome"
                item-value="id"
                label="Filtrar por categoria"
                prepend-inner-icon="mdi-tag-outline"
                variant="outlined"
                clearable
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>

          <v-progress-linear
            v-if="carregando"
            indeterminate
            color="primary"
          />

          <v-alert
            v-else-if="erro"
            type="error"
            class="mb-4"
          >
            {{ erro }}
          </v-alert>

          <v-alert
            v-else-if="produtosFiltrados.length === 0"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            {{
              categoriaSelecionada
                ? 'Nenhum produto encontrado nessa categoria.'
                : 'Ainda não há peças disponíveis na vitrine.'
            }}
          </v-alert>

          <!-- Lista de Produtos -->
          <v-row v-else>
            <v-col
              v-for="produto in produtosFiltrados"
              :key="produto.id"
              cols="12"
              sm="6"
              md="4"
            >
              <ProductCard
                :nome="produto.nome"
                :descricao="produto.descricao"
                :preco="produto.preco"
                :foto="produto.foto"
                :show-action="produto.estoque === undefined || produto.estoque > 0"
                actionLabel="Adicionar ao carrinho"
                @action="adicionarAoCarrinho(produto)"
              />
              <div v-if="produto.estoque !== undefined" class="text-caption text-medium-emphasis mt-1">
                Estoque disponível: {{ produto.estoque }}
              </div>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- ABA 2: MEUS PEDIDOS (Histórico do Banco de Dados) -->
        <v-window-item value="pedidos">
          <v-progress-linear
            v-if="carregandoPedidos"
            indeterminate
            color="primary"
            class="mb-4"
          />

          <v-alert
            v-else-if="meusPedidos.length === 0"
            type="info"
            variant="tonal"
          >
            Você ainda não realizou nenhum pedido. Adicione peças ao carrinho para começar!
          </v-alert>

          <v-row v-else>
            <v-col
              v-for="pedido in meusPedidos"
              :key="pedido.id"
              cols="12"
              md="6"
            >
              <v-card variant="outlined" class="pa-4 rounded-xl">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">
                    Pedido #{{ pedido.id }}
                  </span>
                  <v-chip color="success" size="small" variant="tonal">
                    {{ pedido.status }}
                  </v-chip>
                </div>

                <div class="text-caption text-medium-emphasis mb-3">
                  Pagamento: <strong>{{ pedido.pagamento }}</strong> • Data: {{ pedido.data }}
                </div>

                <v-divider class="mb-3" />

                <div
                  v-for="(item, idx) in pedido.itens"
                  :key="idx"
                  class="d-flex justify-space-between text-body-2 mb-1"
                >
                  <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
                  <span>{{ moeda(item.precoUnitario * item.quantidade) }}</span>
                </div>

                <v-divider class="my-3" />

                <div class="d-flex justify-space-between font-weight-bold text-primary">
                  <span>Total do Pedido</span>
                  <span>{{ moeda(pedido.total) }}</span>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-container>

    <!-- GAVETA LATERAL DO CARRINHO -->
    <v-navigation-drawer v-model="carrinhoAberto" location="right" temporary width="400">
      <div class="pa-4 d-flex align-center justify-space-between">
        <h2 class="text-h6 font-weight-bold">Meu carrinho</h2>
        <v-btn icon="mdi-close" variant="text" @click="carrinhoAberto = false" />
      </div>
      <v-divider />

      <div v-if="carrinho.length" class="pa-4">
        <div v-for="item in carrinho" :key="item.produto.id" class="d-flex align-center ga-3 mb-4">
          <v-img :src="item.produto.foto" width="60" height="60" max-width="60" cover rounded="lg" />
          <div class="flex-grow-1">
            <div class="font-weight-medium">{{ item.produto.nome }}</div>
            <div class="text-primary font-weight-bold">{{ moeda(item.produto.preco) }}</div>
            <div class="d-flex align-center mt-1 ga-2">
              <v-btn icon="mdi-minus" size="x-small" variant="tonal" @click="alterarQuantidade(item.produto.id, -1)" />
              {{ item.quantidade }}
              <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="alterarQuantidade(item.produto.id, 1)" />
              <v-btn icon="mdi-delete-outline" size="x-small" color="error" variant="text" @click="removerDoCarrinho(item.produto.id)" />
            </div>
          </div>
        </div>

        <v-divider class="my-4" />

        <div class="d-flex justify-space-between text-h6 font-weight-bold mb-4">
          <span>Total</span>
          <span>{{ moeda(totalPedido) }}</span>
        </div>

        <v-select
          v-model="formaPagamentoSelecionada"
          :items="[
            { title: 'PIX', value: 'PIX' },
            { title: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
            { title: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
            { title: 'Dinheiro', value: 'DINHEIRO' }
          ]"
          item-title="title"
          item-value="value"
          label="Forma de pagamento"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />

        <v-btn
          block
          color="success"
          size="large"
          :loading="enviandoPedido"
          :disabled="!carrinho.length"
          @click="finalizarPedido"
        >
          Confirmar pedido
        </v-btn>
      </div>

      <div v-else class="pa-6 text-center">
        <v-icon icon="mdi-cart-outline" size="52" color="grey" />
        <p class="text-h6 mt-3">Carrinho vazio</p>
        <v-btn class="mt-3" color="primary" variant="tonal" @click="carrinhoAberto = false">
          Continuar comprando
        </v-btn>
      </div>
    </v-navigation-drawer>

    <!-- NOTIFICAÇÃO SNACKBAR -->
    <v-snackbar v-model="avisoAberto" color="success" timeout="2500">
      {{ aviso }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import ProductCard from '@/components/ProductCard.vue'
import { api } from '@/services/api'
import { categoriaService, type Categoria } from '@/services/categorias.service'
import { vendaService } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth.store'

interface Produto {
  id: number
  nome: string
  descricao: string
  preco: number
  foto: string
  categoriaId: number | null
  estoque?: number
}

interface ItemCarrinho {
  produto: Produto
  quantidade: number
}

interface PedidoRealizado {
  id: number
  pagamento: string
  status: string
  data: string
  total: number
  itens: {
    quantidade: number
    precoUnitario: number
    nomeProduto: string
  }[]
}

const auth = useAuthStore()

const abaAtiva = ref('vitrine')
const categoriaSelecionada = ref<number | null>(null)
const produtos = ref<Produto[]>([])
const categoriasDisponiveis = ref<Categoria[]>([])
const carrinho = ref<ItemCarrinho[]>([])
const meusPedidos = ref<PedidoRealizado[]>([])

const carrinhoAberto = ref(false)
const formaPagamentoSelecionada = ref('PIX')
const aviso = ref('')
const avisoAberto = ref(false)

const carregando = ref(false)
const carregandoPedidos = ref(false)
const enviandoPedido = ref(false)
const erro = ref('')

// Filtro por categoria
const produtosFiltrados = computed(() => {
  if (!categoriaSelecionada.value) return produtos.value
  return produtos.value.filter(
    (produto) => produto.categoriaId === categoriaSelecionada.value,
  )
})

const quantidadeCarrinho = computed(() => carrinho.value.reduce((s, i) => s + i.quantidade, 0))
const totalPedido = computed(() => carrinho.value.reduce((s, i) => s + i.produto.preco * i.quantidade, 0))
const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Carrega produtos e categorias da API
const carregarDados = async () => {
  carregando.value = true
  erro.value = ''

  try {
    const resProdutos = await api.get('/produtos')

    produtos.value = resProdutos.data.map((produto: any) => ({
      id: produto.id_produto,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: Number(produto.preco),
      foto: produto.imagem_url || '',
      estoque: produto.quantidade_estoque !== undefined ? Number(produto.quantidade_estoque) : Number(produto.estoque || 0),
      categoriaId:
        produto.id_categoria ??
        produto.categoria?.id_categoria ??
        produto.categoria?.id ??
        null,
    }))
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    erro.value = 'Não foi possível carregar os produtos. Tente novamente.'
  } finally {
    carregando.value = false
  }

  try {
    categoriasDisponiveis.value = await categoriaService.listar()
  } catch (error) {
    console.warn('Erro ao carregar categorias:', error)
  }
}

// Carrega o histórico real de pedidos do cliente logado
const carregarMeusPedidos = async () => {
  carregandoPedidos.value = true
  try {
    const listaVendas = await vendaService.listar()
    const idUsuarioLogado = Number(
      auth.user?.id_usuario ?? auth.user?.idUsuario ?? auth.user?.id,
    )

    const minhasVendasFiltradas = listaVendas.filter((v: any) => {
      const idUsuarioVenda =
        v.cliente?.idUsuario ??
        v.cliente?.id_usuario ??
        v.cliente?.usuario?.id_usuario

      // Se a venda trouxer o vínculo com usuário, compara com o usuário logado;
      // se o backend já tiver filtrado só para o usuário atual, mantém a venda.
      if (idUsuarioVenda !== undefined && idUsuarioVenda !== null && idUsuarioLogado) {
        return Number(idUsuarioVenda) === idUsuarioLogado
      }

      return true
    })

    meusPedidos.value = minhasVendasFiltradas.map((v: any) => ({
      id: v.id_venda ?? v.idVenda ?? v.id,
      pagamento: v.pagamento?.forma_pagamento || v.forma_pagamento || 'PIX',
      status: v.status || 'CONCLUIDA',
      data: new Date(v.data_venda || v.dataVenda || Date.now()).toLocaleDateString('pt-BR'),
      total: Number(v.valor_total ?? v.valorTotal ?? 0),
      itens: (v.itens || []).map((i: any) => ({
        quantidade: Number(i.quantidade),
        precoUnitario: Number(i.preco_unitario ?? i.precoUnitario ?? 0),
        nomeProduto: i.produto?.nome || 'Peça artesanal',
      })),
    }))
  } catch (error) {
    console.warn('Erro ao carregar histórico de pedidos:', error)
  } finally {
    carregandoPedidos.value = false
  }
}

function adicionarAoCarrinho(produto: Produto) {
  const item = carrinho.value.find(i => i.produto.id === produto.id)
  if (item) {
    if (produto.estoque !== undefined && item.quantidade >= produto.estoque) return
    item.quantidade++
  } else {
    carrinho.value.push({ produto, quantidade: 1 })
  }
  aviso.value = `"${produto.nome}" adicionado ao carrinho.`
  avisoAberto.value = true
}

function alterarQuantidade(id: number, delta: number) {
  const item = carrinho.value.find(i => i.produto.id === id)
  if (!item) return
  if (delta > 0 && item.produto.estoque !== undefined && item.quantidade >= item.produto.estoque) return
  item.quantidade += delta
  if (item.quantidade <= 0) removerDoCarrinho(id)
}

function removerDoCarrinho(id: number) {
  carrinho.value = carrinho.value.filter(i => i.produto.id !== id)
}
const finalizarPedido = async () => {
  if (!carrinho.value.length) return

  enviandoPedido.value = true

  try {
    const payload = {
      forma_pagamento: formaPagamentoSelecionada.value,
      itens: carrinho.value.map((item) => ({
        id_produto: item.produto.id,
        quantidade: item.quantidade,
      })),
    }

    console.log('Enviando payload para a vitrine:', payload) // <--- Ajuda a debugar

    const resposta = await vendaService.criarPelaVitrine(payload)
    console.log('Resposta da venda:', resposta)

    carrinho.value = []
    carrinhoAberto.value = false
    abaAtiva.value = 'pedidos'
    aviso.value = 'Pedido realizado com sucesso!'
    avisoAberto.value = true

    await Promise.all([carregarDados(), carregarMeusPedidos()])
  } catch (error: any) {
    console.error('Erro detalhado ao registrar venda:', error)
    
    // Pega a mensagem exata que veio do NestJS (ex: estoque insuficiente, token inválido, etc.)
    const mensagemErro = error.response?.data?.message || error.message || 'Erro desconhecido'
    alert(`Não foi possível registrar o pedido: ${mensagemErro}`)
  } finally {
    enviandoPedido.value = false
  }
}



onMounted(() => {
  carregarDados()
  carregarMeusPedidos()
})
</script>

```