import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TipoUsuario } from '../../usuarios/enums/tipo-usuario.enum';

export default class MainSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const usuarioRepository = dataSource.getRepository('Usuario');
    const artesaoRepository = dataSource.getRepository('Artesao');
    const clienteRepository = dataSource.getRepository('Cliente');
    const categoriaRepository = dataSource.getRepository('Categoria');
    const produtoRepository = dataSource.getRepository('Produto');
    const movEstoqueRepository = dataSource.getRepository('MovimentacaoEstoque');
    const vendaRepository = dataSource.getRepository('Venda');
    const itemVendaRepository = dataSource.getRepository('ItemVenda');
    const pagamentoRepository = dataSource.getRepository('Pagamento');

    const senhaHash = await bcrypt.hash('123456', 10);

    // ==========================================
    // 1. CRIAR/ATUALIZAR USUÁRIOS
    // ==========================================
    const adminUser = await this.findOrCreateUser(usuarioRepository, {
      nome: 'Administrador Geral',
      email: 'admin@artesao.com',
      senha_hash: senhaHash,
      telefone: '(84) 99999-0000',
      tipo_usuario: TipoUsuario.ADMIN,
    });

    const artesaoUsers = [
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Ana Medeiros',
        email: 'anamedeiros@artesao.com',
        senha_hash: senhaHash,
        telefone: '(84) 99999-1111',
        tipo_usuario: TipoUsuario.ARTESAO,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'João de Barro',
        email: 'joaodebarro@artesao.com',
        senha_hash: senhaHash,
        telefone: '(84) 99999-2222',
        tipo_usuario: TipoUsuario.ARTESAO,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Maria Francisca',
        email: 'maria@artesao.com',
        senha_hash: senhaHash,
        telefone: '(84) 99999-3333',
        tipo_usuario: TipoUsuario.ARTESAO,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Severino Cordeiro',
        email: 'severino@artesao.com',
        senha_hash: senhaHash,
        telefone: '(84) 99999-4444',
        tipo_usuario: TipoUsuario.ARTESAO,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Luzia Artes',
        email: 'luzia@artesao.com',
        senha_hash: senhaHash,
        telefone: '(84) 99999-5555',
        tipo_usuario: TipoUsuario.ARTESAO,
      }),
    ];

    const clienteUsers = [
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'João da Silva',
        email: 'joao@cliente.com',
        senha_hash: senhaHash,
        telefone: '(84) 98888-1111',
        tipo_usuario: TipoUsuario.CLIENTE,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Carla Souza',
        email: 'carla@cliente.com',
        senha_hash: senhaHash,
        telefone: '(84) 98888-2222',
        tipo_usuario: TipoUsuario.CLIENTE,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Marcos Oliveira',
        email: 'marcos@cliente.com',
        senha_hash: senhaHash,
        telefone: '(84) 98888-3333',
        tipo_usuario: TipoUsuario.CLIENTE,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Beatriz Lima',
        email: 'beatriz@cliente.com',
        senha_hash: senhaHash,
        telefone: '(84) 98888-4444',
        tipo_usuario: TipoUsuario.CLIENTE,
      }),
      await this.findOrCreateUser(usuarioRepository, {
        nome: 'Lucas Mendes',
        email: 'lucas@cliente.com',
        senha_hash: senhaHash,
        telefone: '(84) 98888-5555',
        tipo_usuario: TipoUsuario.CLIENTE,
      }),
    ];

    // ==========================================
    // 2. CRIAR CATEGORIAS
    // ==========================================
    const categoriasData = [
      { nome: 'Bordados e Rendas', descricao: 'Peças feitas em tecido, ponto cruz e rendas tradicionais.' },
      { nome: 'Cerâmica e Barro', descricao: 'Utensílios e peças decorativas moldadas em argila.' },
      { nome: 'Trabalhos em Madeira', descricao: 'Esculturas, utensílios e móveis rústicos de madeira.' },
      { nome: 'Crochê e Tricô', descricao: 'Roupas, tapetes e acessórios confeccionados manualmente.' },
      { nome: 'Bijuterias e Acessórios', descricao: 'Acessórios artesanais com pedras, sementes e fios.' },
    ];

    const categoriasMap = new Map();
    for (const cat of categoriasData) {
      let categoria = await categoriaRepository.findOneBy({ nome: cat.nome });
      if (!categoria) {
        categoria = await categoriaRepository.save(cat);
      }
      categoriasMap.set(cat.nome, categoria);
    }

    // ==========================================
    // 3. CRIAR PERFIS DE ARTESÃO
    // ==========================================
    const especialidades = [
      'Bordados em ponto cruz e rendas',
      'Cerâmica utilitária e decorativa',
      'Esculturas em madeira de carnaúba',
      'Crochê criativo e vestuário',
      'Acessórios e biojoias regionais',
    ];

    const artesaos = [];
    for (let i = 0; i < artesaoUsers.length; i++) {
      let artesao = await artesaoRepository.findOne({
        where: { usuario: { id_usuario: artesaoUsers[i].id_usuario } },
      });
      if (!artesao) {
        artesao = await artesaoRepository.save({
          usuario: artesaoUsers[i],
          especialidade: especialidades[i],
        });
      }
      artesaos.push(artesao);
    }

    // ==========================================
    // 4. CRIAR PERFIS DE CLIENTE
    // ==========================================
    const enderecos = [
      'Rua Principal, 100 - Centro, Currais Novos/RN',
      'Av. Coronel José Bezerra, 204 - Centro, Currais Novos/RN',
      'Rua Epitácio Pessoa, 45 - JK, Currais Novos/RN',
      'Rua Severiano Melo, 310 - Paizinho Maria, Currais Novos/RN',
      'Sitio Riacho do Meio, Zona Rural, Currais Novos/RN',
    ];

    const cpfs = [
      '123.456.789-00',
      '234.567.890-11',
      '345.678.901-22',
      '456.789.012-33',
      '567.890.123-44',
    ];

    const clientes = [];
    for (let i = 0; i < clienteUsers.length; i++) {
      let cliente = await clienteRepository.findOne({
        where: { usuario: { id_usuario: clienteUsers[i].id_usuario } },
      });
      if (!cliente) {
        cliente = await clienteRepository.save({
          usuario: clienteUsers[i],
          cpf: cpfs[i],
          endereco: enderecos[i],
        });
      }
      clientes.push(cliente);
    }

    // ==========================================
    // 5. CRIAR PRODUTOS
    // ==========================================
    const produtosData = [
      {
        nome: 'Toalha de Mesa Bordada',
        descricao: 'Toalha de mesa em linho com detalhes em ponto cruz.',
        preco: 120.00,
        quantidade_estoque: 10,
        artesao: artesaos[0],
        categoria: categoriasMap.get('Bordados e Rendas'),
        imagem_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj-wCWCN7shTvN0lm8XwYLsa3GDNvNCBsew4bOplPdyA&s=10',
      },
      {
        nome: 'Panela de Barro Artesanal',
        descricao: 'Panela feita à mão ideal para culinária regional.',
        preco: 85.50,
        quantidade_estoque: 8,
        artesao: artesaos[1],
        categoria: categoriasMap.get('Cerâmica e Barro'),
        imagem_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmX5HPsnxI5qESUMHxd0AQrJWXa4p5cZy7l-LieSWiyA&s=10',
      },
      {
        nome: 'Porta-Retrato em Madeira Rústica',
        descricao: 'Porta-retrato esculpido em madeira reaproveitada.',
        preco: 45.00,
        quantidade_estoque: 15,
        artesao: artesaos[2],
        categoria: categoriasMap.get('Trabalhos em Madeira'),
        imagem_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNcrlDAFCp6d5AQll7ktCmJjNjafRKoSfqdHzD9Q_cFQ&s=10',
      },
      {
        nome: 'Tapete de Crochê Redondo',
        descricao: 'Tapete artesanal colorido em barbante de algodão.',
        preco: 95.00,
        quantidade_estoque: 6,
        artesao: artesaos[3],
        categoria: categoriasMap.get('Crochê e Tricô'),
        imagem_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0vyhE5nvyoUAlo4dX7QXAK2_-hKPFRkIwMqsLymIvEQ&s=10',
      },
      {
        nome: 'Colar Artesanal',
        descricao: 'Colar ecológico feito com pedras.',
        preco: 30.00,
        quantidade_estoque: 20,
        artesao: artesaos[4],
        categoria: categoriasMap.get('Bijuterias e Acessórios'),
        imagem_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKMIJocga86xWE9X3PRmfOoL1FimReSHTj_tDMemzJ0A&s=10',
      },
    ];

    const produtos = [];
    for (const pData of produtosData) {
      let produto = await produtoRepository.findOneBy({ nome: pData.nome });
      if (!produto) {
        produto = await produtoRepository.save(pData);
      }
      produtos.push(produto);
    }

    // ==========================================
    // 6. MOVIMENTAÇÃO DE ESTOQUE
    // ==========================================
    const totalMov = await movEstoqueRepository.count();
    if (totalMov === 0) {
      const movimentacoes = produtos.map((prod) => ({
        produto: prod,
        tipoMovimentacao: 'ENTRADA',
        quantidade: prod.quantidade_estoque,
        motivo: 'Carga inicial de estoque via seeder',
      }));
      await movEstoqueRepository.save(movimentacoes);
    }

    // ==========================================
    // 7. VENDAS, ITENS DE VENDA E PAGAMENTOS
    // ==========================================
    const totalVendas = await vendaRepository.count();
    if (totalVendas === 0) {
      const vendasSimuladas = [
        {
          cliente: clientes[0],
          artesao: artesaos[0],
          valorTotal: 120.00,
          status: 'CONCLUIDA',
          itens: [{ produto: produtos[0], quantidade: 1, precoUnitario: 120.00, comissao: 12.00, repasse: 108.00 }],
          pagamento: { formaPagamento: 'PIX', valor: 120.00, status: 'APROVADO' },
        },
        {
          cliente: clientes[1],
          artesao: artesaos[1],
          valorTotal: 171.00,
          status: 'CONCLUIDA',
          itens: [{ produto: produtos[1], quantidade: 2, precoUnitario: 85.50, comissao: 17.10, repasse: 153.90 }],
          pagamento: { formaPagamento: 'CARTAO_CREDITO', valor: 171.00, status: 'APROVADO' },
        },
        {
          cliente: clientes[2],
          artesao: artesaos[2],
          valorTotal: 45.00,
          status: 'CONCLUIDA',
          itens: [
            {
              produto: produtos[2],
              quantidade: 1,
              precoUnitario: 45.00,
              comissao: 4.50,
              repasse: 40.50,
            },
          ],
          pagamento: {
            formaPagamento: 'DINHEIRO',
            valor: 45.00,
            status: 'APROVADO',
          },
        },
      ];

      for (const vData of vendasSimuladas) {
        const venda = await vendaRepository.save({
          cliente: vData.cliente,
          artesao: vData.artesao,
          valorTotal: vData.valorTotal,
          status: vData.status,
        });

        for (const item of vData.itens) {
          await itemVendaRepository.save({
            venda,
            produto: item.produto,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            percentualComissao: 10.00,
            valorComissao: item.comissao,
            valorRepasse: item.repasse,
          });

          // Atualiza o saldo do produto após a venda.
          item.produto.quantidade_estoque -= item.quantidade;

          await produtoRepository.save(item.produto);

          // Registra a saída no histórico.
          await movEstoqueRepository.save({
            produto: item.produto,
            tipoMovimentacao: 'SAIDA',
            quantidade: item.quantidade,
            motivo: `Venda simulada`,
          });
        }

        await pagamentoRepository.save({
          venda,
          formaPagamento: vData.pagamento.formaPagamento,
          valor: vData.pagamento.valor,
          status: vData.pagamento.status,
        });
      }
      console.log('Massa de dados com 5 registros por entidade criada com sucesso!');
    }
  }

  private async findOrCreateUser(repo: any, userData: any) {
    let user = await repo.findOneBy({ email: userData.email });

    if (user) {
      // Atualiza somente credenciais e tipo dos usuários de demonstração.
      // Os demais dados do usuário existente são preservados.
      user.senha_hash = userData.senha_hash;
      user.tipo_usuario = userData.tipo_usuario;
      await repo.save(user);
    } else {
      user = await repo.save(userData);
    }

    return user;
  }
}
