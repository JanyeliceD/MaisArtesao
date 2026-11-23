import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';

import { Venda } from './venda.entity';
import { ItemVenda } from '../vendas/item-venda.entity';
import { Pagamento } from '../pagamentos/pagamento.entity';
import { Produto } from '../produtos/produto.entity';
import { Artesao } from '../artesaos/artesao.entity';
import { Cliente } from '../clientes/cliente.entity';
import { MovimentacaoEstoque } from '../movimentacao-estoque/movimentacao-estoque.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venda,
      ItemVenda,
      Pagamento,
      Produto,
      Artesao,
      Cliente,
      MovimentacaoEstoque,
      Usuario,
    ]),
  ],
  controllers: [VendasController],
  providers: [VendasService],
  exports: [VendasService],
})
export class VendasModule {}