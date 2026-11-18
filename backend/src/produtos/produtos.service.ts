import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource,Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Categoria } from '../categorias/categoria.entity';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';
import { MovimentacaoEstoque } from '../movimentacao-estoque/movimentacao-estoque.entity';
import { TipoMovimentacao } from '../movimentacao-estoque/enums/tipo-movimentacao.enum';

@Injectable()
export class ProdutosService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Produto)
    private readonly produtosRepository: Repository<Produto>,

    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,

    @InjectRepository(Categoria)
    private readonly categoriasRepository: Repository<Categoria>,
  ) {}

  /* Remove dados sensíveis do artesão antes de retornar um produto pela API. */
  private removerDadosSensiveis(produto: Produto) {
    if (!produto.artesao) {
      return produto;
    }

    const { senha_hash, ...artesaoSeguro } = produto.artesao;

    return {
      ...produto,
      artesao: artesaoSeguro,
    };
  }

  async criar(dto: CriarProdutoDto) {
    const artesao = await this.usuariosRepository.findOne({
      where: {
        id_usuario: dto.id_artesao,
      },
    });

    if (!artesao) {
      throw new NotFoundException('Artesão não encontrado');
    }

    if (artesao.tipo_usuario !== 'ARTESAO' || !artesao.ativo) {
      throw new BadRequestException(
        'O usuário informado não é um artesão ativo',
      );
    }

    const categoria = await this.categoriasRepository.findOne({
      where: {
        id_categoria: dto.id_categoria,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const produtoSalvo = await this.dataSource.transaction(
      async (manager) => {
        const produtosRepository = manager.getRepository(Produto);
        const movimentacoesRepository = manager.getRepository(
          MovimentacaoEstoque,
        );

        const produto = produtosRepository.create({
          nome: dto.nome,
          descricao: dto.descricao,
          preco: String(dto.preco),
          quantidade_estoque: dto.quantidade_estoque,
          imagem_url: dto.imagem_url,
          artesao,
          categoria,
        });

        const novoProduto = await produtosRepository.save(produto);

        // Registra o estoque inicial, caso a quantidade seja maior que zero.
        if (novoProduto.quantidade_estoque > 0) {
          const movimentacao = movimentacoesRepository.create({
            idProduto: novoProduto.id_produto,
            tipoMovimentacao: TipoMovimentacao.ENTRADA,
            quantidade: novoProduto.quantidade_estoque,
            motivo: 'Estoque inicial do cadastro do produto',
          });

          await movimentacoesRepository.save(movimentacao);
        }

        return novoProduto;
      },
    );

    return this.removerDadosSensiveis(produtoSalvo);
  }

  async listar() {
    const produtos = await this.produtosRepository.find({
      where: {
        status: 'ativo',
      },
      relations: {
        artesao: true,
        categoria: true,
      },
      order: {
        data_cadastro: 'DESC',
      },
    });

    return produtos.map((produto) =>
      this.removerDadosSensiveis(produto),
    );
  }

  async listarPorArtesao(id_usuario: number) {
    const produtos = await this.produtosRepository.find({
      where: {
        artesao: {
          id_usuario,
        },
        status: 'ativo',
      },
      relations: {
        artesao: true,
        categoria: true,
      },
      order: {
        data_cadastro: 'DESC',
      },
    });

    return produtos.map((produto) =>
      this.removerDadosSensiveis(produto),
    );
  }

  async buscarPorId(id: number) {
    const produto = await this.produtosRepository.findOne({
      where: {
        id_produto: id,
      },
      relations: {
        artesao: true,
        categoria: true,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.removerDadosSensiveis(produto);
  }

  async atualizar(id: number, dto: AtualizarProdutoDto) {
    const produto = await this.produtosRepository.findOne({
      where: {
        id_produto: id,
      },
      relations: {
        artesao: true,
        categoria: true,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (dto.id_artesao !== undefined) {
      const artesao = await this.usuariosRepository.findOne({
        where: {
          id_usuario: dto.id_artesao,
        },
      });

      if (!artesao) {
        throw new NotFoundException('Artesão não encontrado');
      }

      if (artesao.tipo_usuario !== 'ARTESAO' || !artesao.ativo) {
        throw new BadRequestException(
          'O usuário informado não é um artesão ativo',
        );
      }

      produto.artesao = artesao;
    }

    if (dto.id_categoria !== undefined) {
      const categoria = await this.categoriasRepository.findOne({
        where: {
          id_categoria: dto.id_categoria,
        },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada');
      }

      produto.categoria = categoria;
    }

    if (dto.nome !== undefined) {
      produto.nome = dto.nome;
    }

    if (dto.descricao !== undefined) {
      produto.descricao = dto.descricao;
    }

    if (dto.preco !== undefined) {
      produto.preco = String(dto.preco);
    }

    if (dto.imagem_url !== undefined) {
      produto.imagem_url = dto.imagem_url;
    }

    const produtoAtualizado =
      await this.produtosRepository.save(produto);

    return this.removerDadosSensiveis(produtoAtualizado);
  }

  async desativar(id: number) {
    const produto = await this.produtosRepository.findOne({
      where: {
        id_produto: id,
      },
      relations: {
        artesao: true,
        categoria: true,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    produto.status = 'inativo';

    const produtoDesativado =
      await this.produtosRepository.save(produto);

    return this.removerDadosSensiveis(produtoDesativado);
  }
}