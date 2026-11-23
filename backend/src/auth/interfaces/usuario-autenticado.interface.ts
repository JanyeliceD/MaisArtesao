import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export interface UsuarioAutenticado {
  id_usuario: number;
  email: string;
  tipo_usuario: TipoUsuario;
}