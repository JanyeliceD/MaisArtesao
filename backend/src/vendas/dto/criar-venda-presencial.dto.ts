import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CriarItemVendaDto } from './criar-item-venda.dto';
import { FormaPagamento } from '../../pagamentos/enums/forma-pagamento.enum';

export class CriarVendaPresencialDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_cliente?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriarItemVendaDto)
  itens: CriarItemVendaDto[];

  @IsIn(['PIX', 'DINHEIRO', 'CARTAO_CREDITO'])
  forma_pagamento: FormaPagamento;
}