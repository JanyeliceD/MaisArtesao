import { Get,
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
import { Usuario } from '../usuarios/usuario.entity';

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
  @Roles(TipoUsuario.CLIENTE, TipoUsuario.ARTESAO, TipoUsuario.ADMIN)
  criarPelaVitrine(
    @Body() dto: CriarVendaVitrineDto,
    @Req() req: RequestAutenticado,
  ) {
    return this.vendasService.criarPelaVitrine(
      dto,
      req.user,
    );
  }

@Get('minhas')
@UseGuards(JwtAuthGuard) // use o mesmo guard que você já usa na rota de criar venda pela vitrine
async listarMinhasVendas(@Req() req: any) {
  const idUsuario = Number(
    req.user?.id_usuario ?? req.user?.idUsuario ?? req.user?.sub ?? req.user?.id,
  );
  return this.vendasService.listarMinhasVendas(idUsuario);
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

  @Get('artesao')
  @Roles(TipoUsuario.ARTESAO)
  listarVendasDoArtesao(@Req() req: RequestAutenticado) {
    return this.vendasService.listarVendasDoArtesao(req.user.id_usuario);
  }
}