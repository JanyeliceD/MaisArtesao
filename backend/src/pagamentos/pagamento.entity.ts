import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venda } from '../vendas/venda.entity';
import { FormaPagamento } from './enums/forma-pagamento.enum';
import { StatusPagamento } from './enums/status-pagamento.enum';

@Entity('pagamento')
export class Pagamento {
  @PrimaryGeneratedColumn({ name: 'id_pagamento' })
  idPagamento: number;

  @Column({ name: 'id_venda', type: 'int' })
  idVenda: number;

  @Column({ name: 'forma_pagamento', type: 'varchar', length: 30 })
  formaPagamento: FormaPagamento;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: string;

  @Column({
    name: 'data_pagamento',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dataPagamento: Date;

  @Column({ type: 'varchar', length: 20, default: 'APROVADO' })
  status: StatusPagamento;

  // Relacionamento com Venda
  @ManyToOne(() => Venda, (venda) => venda.pagamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_venda' })
  venda: Venda;
}