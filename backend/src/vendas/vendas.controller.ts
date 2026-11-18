import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { VendasService } from './vendas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TipoUsuario } from '../usuarios/enums/tipo-usuario.enum';
import { CriarVendaVitrineDto } from './dto/criar-venda-vitrine.dto';
import { CriarVendaPresencialDto } from './dto/criar-venda-presencial.dto';
import { Request } from 'express';
import { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';

interface RequestAutenticado extends Request {
  user: UsuarioAutenticado;
}

@Controller('vendas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendasController {
  constructor(
    private readonly vendasService: VendasService,
  ) {}

  // Compra realizada pela vitrine.
  @Post('vitrine')
  @Roles(TipoUsuario.CLIENTE)
  criarPelaVitrine(
    @Body() dto: CriarVendaVitrineDto,
    @Req() req: RequestAutenticado,
  ) {
    return this.vendasService.criarPelaVitrine(
      dto,
      req.user,
    );
  }

  // Venda presencial registrada pelo artesão.
  @Post('presencial')
  @Roles(TipoUsuario.ARTESAO)
  criarPresencial(
    @Body() dto: CriarVendaPresencialDto,
    @Req() req: RequestAutenticado,
  ) {
    return this.vendasService.criarPresencial(
      dto,
      req.user,
    );
  }
}