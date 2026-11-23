import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { MovimentacaoEstoqueService } from './movimentacao-estoque.service';
import { CriarEntradaEstoqueDto } from './dto/criar-entrada-estoque.dto';
import { CriarSaidaEstoqueDto } from './dto/criar-saida-estoque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestAutenticado extends Request {
  user: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
}

@Controller('movimentacoes-estoque')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimentacaoEstoqueController {
  constructor(
    private readonly service: MovimentacaoEstoqueService,
  ) {}

  @Post('entrada')
  @Roles('ARTESAO', 'ADMIN')
  registrarEntrada(
    @Body() dto: CriarEntradaEstoqueDto,
    @Req() req: RequestAutenticado,
  ) {
    return this.service.registrarEntrada(dto, req.user);
  }

  @Post('saida')
  @Roles('ARTESAO', 'ADMIN')
  registrarSaida(
    @Body() dto: CriarSaidaEstoqueDto,
    @Req() req: RequestAutenticado,
  ) {
    return this.service.registrarSaida(dto, req.user);
  }

  @Get()
  @Roles('ADMIN')
  listarTodas() {
    return this.service.listarTodas();
  }

  @Get('minhas')
  @Roles('ARTESAO')
  listarMinhas(@Req() req: RequestAutenticado) {
    return this.service.listarMinhas(req.user.id_usuario);
  }

  @Get('produto/:id')
  @Roles('ARTESAO', 'ADMIN')
  listarPorProduto(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAutenticado,
  ) {
    return this.service.listarPorProduto(id, req.user);
  }
}