import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  Min,
} from 'class-validator';

export class CriarItemVendaDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_produto: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;
}