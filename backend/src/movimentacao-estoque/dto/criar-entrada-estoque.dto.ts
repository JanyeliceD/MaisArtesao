import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarEntradaEstoqueDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idProduto: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo?: string;
}