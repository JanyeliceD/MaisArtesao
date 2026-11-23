import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { PagamentosService } from './pagamentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';
import { Request } from 'express';

interface RequestAutenticado extends Request {
  user: UsuarioAutenticado;
}

@Controller('pagamentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagamentosController {
  constructor(
    private readonly pagamentosService: PagamentosService,
  ) {}

  /* Lista os pagamentos relacionados ao usuário autenticado.*/
  @Get('meus')
  @Roles(
    TipoUsuario.ADMIN,
    TipoUsuario.ARTESAO,
    TipoUsuario.CLIENTE,
  )
  listarMeus(@Req() req: RequestAutenticado) {
    return this.pagamentosService.listarMeus(req.user);
  }

  /* Lista os pagamentos de uma venda específica.*/
  @Get('venda/:idVenda')
  @Roles(
    TipoUsuario.ADMIN,
    TipoUsuario.ARTESAO,
    TipoUsuario.CLIENTE,
  )
  listarPorVenda(
    @Param('idVenda', ParseIntPipe) idVenda: number,
    @Req() req: RequestAutenticado,
  ) {
    return this.pagamentosService.listarPorVenda(
      idVenda,
      req.user,
    );
  }
}