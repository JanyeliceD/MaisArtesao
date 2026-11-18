import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Venda } from './venda.entity';
import { ItemVenda } from './item-venda.entity';
import { Pagamento } from '../pagamentos/pagamento.entity';
import { Produto } from '../produtos/produto.entity';
import { Artesao } from '../artesaos/artesao.entity';
import { Cliente } from '../clientes/cliente.entity';
import { MovimentacaoEstoque } from '../movimentacao-estoque/movimentacao-estoque.entity';
import { TipoMovimentacao } from '../movimentacao-estoque/enums/tipo-movimentacao.enum';
import { CriarVendaVitrineDto } from './dto/criar-venda-vitrine.dto';
import { CriarVendaPresencialDto } from './dto/criar-venda-presencial.dto';

import { FormaPagamento } from '../pagamentos/enums/forma-pagamento.enum';
import { StatusPagamento } from '../pagamentos/enums/status-pagamento.enum';

type UsuarioAutenticado = {
  id_usuario: number;
  email: string;
  tipo_usuario: string;
};

type ItemSolicitado = {
  id_produto: number;
  quantidade: number;
};

@Injectable()
export class VendasService {
  // Percentual inicial de comissão: 10%.
  private readonly percentualComissao = 10;

  constructor(
    @InjectRepository(Venda)
    private readonly vendasRepository: Repository<Venda>,

    private readonly dataSource: DataSource,
  ) {}

  // Compra realizada por um cliente pela vitrine.
  async criarPelaVitrine(
    dto: CriarVendaVitrineDto,
    usuario: UsuarioAutenticado,
  ) {
    return this.criarVenda(
      dto.itens,
      dto.forma_pagamento,
      usuario,
      'VITRINE',
      undefined,
    );
  }

  // Venda registrada presencialmente pelo artesão.
  async criarPresencial(
    dto: CriarVendaPresencialDto,
    usuario: UsuarioAutenticado,
  ) {
    return this.criarVenda(
      dto.itens,
      dto.forma_pagamento,
      usuario,
      'PRESENCIAL',
      dto.id_cliente,
    );
  }

  private async criarVenda(
    itensSolicitados: ItemSolicitado[],
    formaPagamento: FormaPagamento,
    usuario: UsuarioAutenticado,
    origem: 'VITRINE' | 'PRESENCIAL',
    idCliente?: number,
  ) {
    if (!itensSolicitados?.length) {
      throw new BadRequestException(
        'A venda precisa possuir pelo menos um item.',
      );
    }

    // Não permite repetir o mesmo produto na lista.
    const idsProdutos = itensSolicitados.map(
      (item) => item.id_produto,
    );

    if (new Set(idsProdutos).size !== idsProdutos.length) {
      throw new BadRequestException(
        'Não informe o mesmo produto mais de uma vez.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const produtosRepository = manager.getRepository(Produto);
      const artesoesRepository = manager.getRepository(Artesao);
      const clientesRepository = manager.getRepository(Cliente);
      const vendasRepository = manager.getRepository(Venda);
      const itensRepository = manager.getRepository(ItemVenda);
      const pagamentosRepository = manager.getRepository(Pagamento);
      const movimentacoesRepository =
        manager.getRepository(MovimentacaoEstoque);

      // 1. Identifica o cliente, quando aplicável.
      let cliente: Cliente | null = null;

      if (origem === 'VITRINE') {
        cliente = await clientesRepository.findOne({
          where: {
            usuario: {
              id_usuario: usuario.id_usuario,
            },
          },
          relations: {
            usuario: true,
          },
        });

        if (!cliente) {
          throw new NotFoundException(
            'Perfil de cliente não encontrado.',
          );
        }
      } else if (idCliente !== undefined) {
        cliente = await clientesRepository.findOne({
          where: {
            idCliente: idCliente,
          },
        });

        if (!cliente) {
          throw new NotFoundException('Cliente não encontrado.');
        }
      }

      // 2. Na venda presencial, identifica o artesão pelo JWT.
      let artesaoAutenticado: Artesao | null = null;

      if (origem === 'PRESENCIAL') {
        artesaoAutenticado = await artesoesRepository.findOne({
          where: {
            usuario: {
              id_usuario: usuario.id_usuario,
            },
          },
          relations: {
            usuario: true,
          },
        });

        if (!artesaoAutenticado) {
          throw new NotFoundException(
            'Perfil de artesão não encontrado.',
          );
        }

        if (!artesaoAutenticado.usuario.ativo) {
          throw new ForbiddenException(
            'O perfil do artesão está inativo.',
          );
        }
      }

      // 3. Busca e bloqueia os produtos em ordem de ID.
      // Isso evita alterações simultâneas no mesmo estoque.
      const produtos = new Map<number, Produto>();

      const idsOrdenados = [...idsProdutos].sort(
        (a, b) => a - b,
      );

      for (const idProduto of idsOrdenados) {
        const produto = await produtosRepository
          .createQueryBuilder('produto')
          .leftJoinAndSelect('produto.artesao', 'artesao')
          .where('produto.id_produto = :idProduto', {
            idProduto,
          })
          .setLock('pessimistic_write', undefined, ['produto'])
          .getOne();

        if (!produto) {
          throw new NotFoundException(
            `Produto ${idProduto} não encontrado.`,
          );
        }

        if (produto.status !== 'ativo') {
          throw new BadRequestException(
            `O produto "${produto.nome}" está inativo.`,
          );
        }

        if (!produto.artesao?.ativo) {
          throw new BadRequestException(
            `O artesão do produto "${produto.nome}" está inativo.`,
          );
        }

        produtos.set(idProduto, produto);
      }

      // 4. Confirma que todos os produtos pertencem ao mesmo artesão.
      const idsUsuariosArtesoes = new Set(
        [...produtos.values()].map(
          (produto) => produto.artesao.id_usuario,
        ),
      );

      if (idsUsuariosArtesoes.size !== 1) {
        throw new BadRequestException(
          'Uma venda deve conter produtos de apenas um artesão.',
        );
      }

      const idUsuarioArtesao = [...idsUsuariosArtesoes][0];

      // 5. Verifica se o artesão autenticado é proprietário dos produtos.
      if (
        origem === 'PRESENCIAL' &&
        idUsuarioArtesao !== usuario.id_usuario
      ) {
        throw new ForbiddenException(
          'Você só pode registrar vendas dos seus próprios produtos.',
        );
      }

      // 6. Localiza o perfil de artesão responsável pela venda.
      const artesao =
        origem === 'PRESENCIAL'
          ? artesaoAutenticado
          : await artesoesRepository.findOne({
              where: {
                usuario: {
                  id_usuario: idUsuarioArtesao,
                },
              },
              relations: {
                usuario: true,
              },
            });

      if (!artesao) {
        throw new NotFoundException(
          'Perfil do artesão responsável pela venda não encontrado.',
        );
      }

      if (!artesao.usuario.ativo) {
        throw new BadRequestException(
          'O artesão responsável pela venda está inativo.',
        );
      }

      // 7. Valida estoque e calcula os valores.
      let totalCentavos = 0;

      const itensCalculados = itensSolicitados.map((item) => {
        const produto = produtos.get(item.id_produto)!;

        if (
          !Number.isInteger(item.quantidade) ||
          item.quantidade <= 0
        ) {
          throw new BadRequestException(
            'A quantidade dos itens deve ser maior que zero.',
          );
        }

        if (produto.quantidade_estoque < item.quantidade) {
          throw new BadRequestException(
            `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade_estoque}.`,
          );
        }

        // Converte o preço para centavos para evitar erros
        // comuns de arredondamento em operações com dinheiro.
        const precoCentavos = Math.round(
          Number(produto.preco) * 100,
        );

        const subtotalCentavos =
          precoCentavos * item.quantidade;

        const comissaoCentavos = Math.round(
          subtotalCentavos * this.percentualComissao / 100,
        );

        const repasseCentavos =
          subtotalCentavos - comissaoCentavos;

        totalCentavos += subtotalCentavos;

        return {
          produto,
          quantidade: item.quantidade,
          precoUnitario: (precoCentavos / 100).toFixed(2),
          subtotal: (subtotalCentavos / 100).toFixed(2),
          percentualComissao: this.percentualComissao.toFixed(2),
          valorComissao: (comissaoCentavos / 100).toFixed(2),
          valorRepasse: (repasseCentavos / 100).toFixed(2),
        };
      });

      // 8. Cria a venda.
      const venda = vendasRepository.create({
        cliente,
        idCliente: cliente?.idCliente ?? null,
        artesao,
        idArtesao: artesao.id_artesao,
        valorTotal: (totalCentavos / 100).toFixed(2),
        status: 'CONCLUIDA',
      });

      const vendaSalva = await vendasRepository.save(venda);

      // 9. Cria os itens e registra as saídas de estoque.
      const itensSalvos: ItemVenda[] = [];

      for (const item of itensCalculados) {
        const produto = item.produto;

        const itemVenda = itensRepository.create({
          venda: vendaSalva,
          idVenda: vendaSalva.idVenda,
          produto,
          idProduto: produto.id_produto,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          percentualComissao: item.percentualComissao,
          valorComissao: item.valorComissao,
          valorRepasse: item.valorRepasse,
        });

        itensSalvos.push(
          await itensRepository.save(itemVenda),
        );

        produto.quantidade_estoque -= item.quantidade;

        await produtosRepository.save(produto);

        const movimentacao = movimentacoesRepository.create({
          produto,
          idProduto: produto.id_produto,
          tipoMovimentacao: TipoMovimentacao.SAIDA,
          quantidade: item.quantidade,
          motivo: `Venda #${vendaSalva.idVenda}`,
        });

        await movimentacoesRepository.save(movimentacao);
      }

      // 10. Registra o pagamento da venda.
      const pagamento = pagamentosRepository.create({
        venda: vendaSalva,
        idVenda: vendaSalva.idVenda,
        formaPagamento,
        valor: (totalCentavos / 100).toFixed(2),
        status: StatusPagamento.APROVADO,
      });

      const pagamentoSalvo =
        await pagamentosRepository.save(pagamento);

      // 11. Retorna somente os dados necessários.
      return {
        mensagem: 'Venda registrada com sucesso.',
        venda: {
          id_venda: vendaSalva.idVenda,
          origem,
          idCliente: cliente?.idCliente ?? null,
          id_artesao: artesao.id_artesao,
          data_venda: vendaSalva.dataVenda,
          valor_total: (totalCentavos / 100).toFixed(2),
          status: vendaSalva.status,
          itens: itensSalvos.map((item) => ({
            id_item_venda: item.idItemVenda,
            id_produto: item.idProduto,
            quantidade: item.quantidade,
            preco_unitario: item.precoUnitario,
            percentual_comissao: item.percentualComissao,
            valor_comissao: item.valorComissao,
            valor_repasse: item.valorRepasse,
          })),
          pagamento: {
            id_pagamento: pagamentoSalvo.idPagamento,
            forma_pagamento: pagamentoSalvo.formaPagamento,
            valor: pagamentoSalvo.valor,
            status: pagamentoSalvo.status,
          },
        },
        estoque_atualizado: itensCalculados.map((item) => ({
            id_produto: item.produto.id_produto,
            nome: item.produto.nome,
            quantidade_estoque: item.produto.quantidade_estoque,
        })),
      };
    });
  }
}