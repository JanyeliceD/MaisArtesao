import {
  ArrayMinSize,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CriarItemVendaDto } from './criar-item-venda.dto';
import { FormaPagamento } from '../../pagamentos/enums/forma-pagamento.enum';

export class CriarVendaVitrineDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriarItemVendaDto)
  itens: CriarItemVendaDto[];

  @IsIn(['PIX', 'DINHEIRO', 'CARTAO_CREDITO'])
  forma_pagamento: FormaPagamento;
}