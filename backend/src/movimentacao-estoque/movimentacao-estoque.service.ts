import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MovimentacaoEstoque } from './movimentacao-estoque.entity';
import { TipoMovimentacao } from './enums/tipo-movimentacao.enum';
import { Produto } from '../produtos/produto.entity';
import { CriarEntradaEstoqueDto } from './dto/criar-entrada-estoque.dto';
import { CriarSaidaEstoqueDto } from './dto/criar-saida-estoque.dto';

@Injectable()
export class MovimentacaoEstoqueService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(MovimentacaoEstoque)
    private readonly movimentacoesRepository: Repository<MovimentacaoEstoque>,

    @InjectRepository(Produto)
    private readonly produtosRepository: Repository<Produto>,
  ) {}

  /**
   * Registra uma entrada de estoque.
   */
  async registrarEntrada(
    dto: CriarEntradaEstoqueDto,
    usuario: { id_usuario: number; tipo_usuario: string },
  ) {
    return this.registrarMovimentacao(
      dto.idProduto,
      dto.quantidade,
      TipoMovimentacao.ENTRADA,
      dto.motivo,
      usuario,
    );
  }

  /**
   * Registra uma saída de estoque.
   */
  async registrarSaida(
    dto: CriarSaidaEstoqueDto,
    usuario: { id_usuario: number; tipo_usuario: string },
  ) {
    return this.registrarMovimentacao(
      dto.idProduto,
      dto.quantidade,
      TipoMovimentacao.SAIDA,
      dto.motivo,
      usuario,
    );
  }

  /**
   * Executa a movimentação e atualiza o saldo
   * dentro de uma única transação.
   */
  private async registrarMovimentacao(
    idProduto: number,
    quantidade: number,
    tipo: TipoMovimentacao,
    motivo: string | undefined,
    usuario: { id_usuario: number; tipo_usuario: string },
    ) {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        throw new BadRequestException(
        'A quantidade deve ser um número inteiro maior que zero.',
        );
    }

    return this.dataSource.transaction(async (manager) => {
        const produtoRepository = manager.getRepository(Produto);
        const movimentacaoRepository =
        manager.getRepository(MovimentacaoEstoque);

        // Bloqueia somente a linha do produto.
        const produto = await produtoRepository
        .createQueryBuilder('produto')
        .leftJoinAndSelect('produto.artesao', 'artesao')
        .where('produto.id_produto = :idProduto', { idProduto })
        .setLock('pessimistic_write', undefined, ['produto'])
        .getOne();

        if (!produto) {
        throw new NotFoundException('Produto não encontrado.');
        }

        if (produto.status !== 'ativo') {
        throw new BadRequestException(
            'Não é possível movimentar um produto inativo.',
        );
        }

        // Artesãos só podem movimentar os próprios produtos.
        if (
        usuario.tipo_usuario === 'ARTESAO' &&
        produto.artesao.id_usuario !== usuario.id_usuario
        ) {
        throw new ForbiddenException(
            'Você não tem permissão para movimentar este produto.',
        );
        }

        let novoEstoque: number;

        if (tipo === TipoMovimentacao.ENTRADA) {
        novoEstoque = produto.quantidade_estoque + quantidade;
        } else {
        if (produto.quantidade_estoque < quantidade) {
            throw new BadRequestException(
            `Estoque insuficiente. Disponível: ${produto.quantidade_estoque}.`,
            );
        }

        novoEstoque = produto.quantidade_estoque - quantidade;
        }

        produto.quantidade_estoque = novoEstoque;

        await produtoRepository.save(produto);

        const movimentacao = movimentacaoRepository.create({
        idProduto: produto.id_produto,
        produto,
        tipoMovimentacao: tipo,
        quantidade,
        motivo:
            motivo ||
            (tipo === TipoMovimentacao.ENTRADA
            ? 'Entrada de estoque'
            : 'Saída de estoque'),
        });

        const movimentacaoSalva =
        await movimentacaoRepository.save(movimentacao);

        return {
        mensagem: 'Movimentação registrada com sucesso.',
        movimentacao: movimentacaoSalva,
        estoque_atual: novoEstoque,
        };
    });
    }

  /**
   * Lista todas as movimentações.
   * Uso administrativo.
   */
  async listarTodas() {
    const movimentacoes = await this.movimentacoesRepository.find({
        relations: {
        produto: {
            artesao: true,
        },
        },
        order: {
        dataMovimentacao: 'DESC',
        },
    });

    return movimentacoes.map((movimentacao) => ({
        idMovimentacao: movimentacao.idMovimentacao,
        idProduto: movimentacao.idProduto,
        tipoMovimentacao: movimentacao.tipoMovimentacao,
        quantidade: movimentacao.quantidade,
        dataMovimentacao: movimentacao.dataMovimentacao,
        motivo: movimentacao.motivo,
        produto: {
        id_produto: movimentacao.produto.id_produto,
        nome: movimentacao.produto.nome,
        artesao: {
            id_usuario: movimentacao.produto.artesao.id_usuario,
            nome: movimentacao.produto.artesao.nome,
        },
        },
    }));
    }

  /**
   * Lista movimentações dos produtos de um artesão.
   */
  async listarMinhas(idUsuario: number) {
    return this.movimentacoesRepository.find({
      where: {
        produto: {
          artesao: {
            id_usuario: idUsuario,
          },
        },
      },
      relations: {
        produto: true,
      },
      order: {
        dataMovimentacao: 'DESC',
      },
    });
  }

  /**
   * Lista o histórico de um produto.
   */
  async listarPorProduto(
    idProduto: number,
    usuario: { id_usuario: number; tipo_usuario: string },
  ) {
    const produto = await this.produtosRepository.findOne({
      where: { id_produto: idProduto },
      relations: { artesao: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    if (
      usuario.tipo_usuario === 'ARTESAO' &&
      produto.artesao.id_usuario !== usuario.id_usuario
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para consultar este produto.',
      );
    }

    return this.movimentacoesRepository.find({
      where: { idProduto },
      relations: { produto: true },
      order: { dataMovimentacao: 'DESC' },
    });
  }
}