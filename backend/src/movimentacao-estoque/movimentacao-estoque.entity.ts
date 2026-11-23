import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Produto } from '../produtos/produto.entity';
import { TipoMovimentacao } from './enums/tipo-movimentacao.enum';

@Entity('movimentacao_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn({ name: 'id_movimentacao' })
  idMovimentacao: number;

  @Column({ name: 'id_produto', type: 'int' })
  idProduto: number;

  @Column({ name: 'tipo_movimentacao', type: 'varchar', length: 20 })
  tipoMovimentacao: TipoMovimentacao;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({
    name: 'data_movimentacao',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataMovimentacao: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo: string;

  // Relacionamento com Produto
  @ManyToOne(() => Produto, (produto) => produto.movimentacoesEstoque, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_produto' })
  produto: Produto;
}