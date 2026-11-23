import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento } from './pagamento.entity';
import { Venda } from '../vendas/venda.entity';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';

@Injectable()
export class PagamentosService {
  constructor(
    @InjectRepository(Pagamento)
    private readonly pagamentosRepository: Repository<Pagamento>,

    @InjectRepository(Venda)
    private readonly vendasRepository: Repository<Venda>,
  ) {}

  /*
   * Lista os pagamentos relacionados ao usuário autenticado.
   */
  async listarMeus(usuario: UsuarioAutenticado) {
    const query = this.pagamentosRepository
      .createQueryBuilder('pagamento')
      .innerJoin('pagamento.venda', 'venda')
      .leftJoin('venda.cliente', 'cliente')
      .leftJoin('cliente.usuario', 'clienteUsuario')
      .innerJoin('venda.artesao', 'artesao')
      .innerJoin('artesao.usuario', 'artesaoUsuario');

    if (usuario.tipo_usuario === TipoUsuario.CLIENTE) {
      query.where(
        'clienteUsuario.id_usuario = :idUsuario',
        { idUsuario: usuario.id_usuario },
      );
    } else if (usuario.tipo_usuario === TipoUsuario.ARTESAO) {
      query.where(
        'artesaoUsuario.id_usuario = :idUsuario',
        { idUsuario: usuario.id_usuario },
      );
    } else if (usuario.tipo_usuario !== TipoUsuario.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para consultar pagamentos.',
      );
    }

    return query
      .orderBy('pagamento.dataPagamento', 'DESC')
      .getMany();
  }

  /*
   * Lista os pagamentos de uma venda específica.
   */
  async listarPorVenda(
    idVenda: number,
    usuario: UsuarioAutenticado,
  ) {
    const venda = await this.vendasRepository.findOne({
      where: { idVenda },
      relations: {
        cliente: {
          usuario: true,
        },
        artesao: {
          usuario: true,
        },
      },
    });

    if (!venda) {
      throw new NotFoundException('Venda não encontrada.');
    }

    // Verifica se o usuário pode acessar a venda.
    if (usuario.tipo_usuario === TipoUsuario.CLIENTE) {
      if (
        venda.cliente?.usuario.id_usuario !== usuario.id_usuario
      ) {
        throw new ForbiddenException(
          'Você não tem permissão para consultar esses pagamentos.',
        );
      }
    } else if (usuario.tipo_usuario === TipoUsuario.ARTESAO) {
      if (
        venda.artesao.usuario.id_usuario !== usuario.id_usuario
      ) {
        throw new ForbiddenException(
          'Você não tem permissão para consultar esses pagamentos.',
        );
      }
    } else if (usuario.tipo_usuario !== TipoUsuario.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para consultar pagamentos.',
      );
    }

    return this.pagamentosRepository.find({
      where: { idVenda },
      order: {
        dataPagamento: 'DESC',
      },
    });
  }
}