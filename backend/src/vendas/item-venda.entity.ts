import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venda } from './venda.entity';
import { Produto } from '../produtos/produto.entity';

@Entity('item_venda')
export class ItemVenda {
  @PrimaryGeneratedColumn({ name: 'id_item_venda' })
  idItemVenda: number;

  @Column({ name: 'id_venda', type: 'int' })
  idVenda: number;

  @Column({ name: 'id_produto', type: 'int' })
  idProduto: number;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ name: 'preco_unitario', type: 'decimal', precision: 10, scale: 2 })
  precoUnitario: string;

  @Column({ name: 'percentual_comissao', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentualComissao: string | null;

  @Column({ name: 'valor_comissao', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorComissao: string | null;

  @Column({ name: 'valor_repasse', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorRepasse: string | null;

  // Relacionamentos
  @ManyToOne(() => Venda, (venda) => venda.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_venda' })
  venda: Venda;

  @ManyToOne(() => Produto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_produto' })
  produto: Produto;
}