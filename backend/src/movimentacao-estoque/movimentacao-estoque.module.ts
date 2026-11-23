import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimentacaoEstoque } from './movimentacao-estoque.entity';
import { Produto } from '../produtos/produto.entity';
import { MovimentacaoEstoqueController } from './movimentacao-estoque.controller';
import { MovimentacaoEstoqueService } from './movimentacao-estoque.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovimentacaoEstoque,
      Produto,
    ]),
  ],
  controllers: [MovimentacaoEstoqueController],
  providers: [MovimentacaoEstoqueService],
  exports: [MovimentacaoEstoqueService],
})
export class MovimentacaoEstoqueModule {}