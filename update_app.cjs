const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Clean VENDAS_INICIAIS, MOVIMENTACOES_INICIAIS, TURNOS_INICIAIS
const salesRegex = /const VENDAS_INICIAIS = \[\s*[\s\S]*?\n\];/;
content = content.replace(salesRegex, 'const VENDAS_INICIAIS = [];');

const movsRegex = /const MOVIMENTACOES_INICIAIS = \[\s*[\s\S]*?\n\];/;
content = content.replace(movsRegex, 'const MOVIMENTACOES_INICIAIS = [];');

const turnosRegex = /const TURNOS_INICIAIS = \[\s*[\s\S]*?\n\];/;
content = content.replace(turnosRegex, 'const TURNOS_INICIAIS = [];');

// 2. Define MESAS_INICIAIS and modify estadoInicial and carregarEstado
const estadoInicialMatch = /const estadoInicial = \{[\s\S]*?\n\};/;
const newEstadoInicial = `const MESAS_INICIAIS = Array.from({ length: 20 }, (_, i) => ({
  numero: i + 1,
  status: 'Livre',
  carrinho: [],
  descontoPercent: 0
}));

const estadoInicial = {
  produtos: PRODUTOS_INICIAIS,
  categorias: CATEGORIAS_INICIAIS,
  carrinho: [],
  vendas: VENDAS_INICIAIS,
  movimentacoes: MOVIMENTACOES_INICIAIS,
  turnos: TURNOS_INICIAIS,
  turnoAtual: null,
  descontoPercent: 0,
  mesas: MESAS_INICIAIS,
  mesaSelecionada: null,
};`;
content = content.replace(estadoInicialMatch, newEstadoInicial);

const carregarEstadoMatch = /function carregarEstado\(\) \{[\s\S]*?\n\}/;
const newCarregarEstado = `function carregarEstado() {
  try {
    const salvo = localStorage.getItem('pdv_estado');
    if (salvo) {
      const parsed = JSON.parse(salvo);
      // Limpar dados mock do localStorage se existirem para garantir início limpo
      if (parsed.vendas) {
        parsed.vendas = parsed.vendas.filter(v => !['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'].includes(v.id));
      }
      if (parsed.turnos) {
        parsed.turnos = parsed.turnos.filter(t => !['t1', 't2'].includes(t.id));
      }
      if (parsed.movimentacoes) {
        parsed.movimentacoes = parsed.movimentacoes.filter(m => !['m1', 'm2', 'm3'].includes(m.id));
      }
      if (!parsed.mesas || parsed.mesas.length === 0) {
        parsed.mesas = MESAS_INICIAIS;
      }
      if (parsed.mesaSelecionada === undefined) {
        parsed.mesaSelecionada = null;
      }
      return { ...estadoInicial, ...parsed };
    }
  } catch (e) { /* ignorar */ }
  return estadoInicial;
}`;
content = content.replace(carregarEstadoMatch, newCarregarEstado);

// 3. Replace reducer function
const reducerMatch = /function reducer\(state, action\) \{[\s\S]*?\n\}/;
const newReducer = `function reducer(state, action) {
  switch (action.type) {
    // ---- CARRINHO ----
    case 'ADICIONAR_AO_CARRINHO': {
      const produto = action.payload;
      const existente = state.carrinho.find(i => i.produtoId === produto.id);
      const produtoEstoque = state.produtos.find(p => p.id === produto.id);
      const qtdNoCarrinho = existente ? existente.qtd : 0;
      if (produtoEstoque.estoque <= qtdNoCarrinho) return state;
      let novoCarrinho;
      if (existente) {
        novoCarrinho = state.carrinho.map(i => i.produtoId === produto.id ? { ...i, qtd: i.qtd + 1 } : i);
      } else {
        novoCarrinho = [...state.carrinho, { produtoId: produto.id, nome: produto.nome, emoji: produto.emoji, preco: produto.preco, qtd: 1, categoriaId: produto.categoriaId }];
      }
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        carrinho: novoCarrinho,
        status: m.status === 'Livre' ? 'Ocupada' : m.status
      } : m);
      return {
        ...state,
        carrinho: novoCarrinho,
        mesas: novasMesas
      };
    }
    case 'ALTERAR_QTD_CARRINHO': {
      const { produtoId, delta } = action.payload;
      const item = state.carrinho.find(i => i.produtoId === produtoId);
      if (!item) return state;
      const novaQtd = item.qtd + delta;
      let novoCarrinho;
      if (novaQtd <= 0) {
        novoCarrinho = state.carrinho.filter(i => i.produtoId !== produtoId);
      } else {
        const produtoEstoque = state.produtos.find(p => p.id === produtoId);
        if (delta > 0 && produtoEstoque.estoque <= item.qtd) return state;
        novoCarrinho = state.carrinho.map(i => i.produtoId === produtoId ? { ...i, qtd: novaQtd } : i);
      }
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        carrinho: novoCarrinho,
        status: novoCarrinho.length === 0 ? 'Livre' : m.status
      } : m);
      return {
        ...state,
        carrinho: novoCarrinho,
        mesas: novasMesas
      };
    }
    case 'REMOVER_DO_CARRINHO': {
      const novoCarrinho = state.carrinho.filter(i => i.produtoId !== action.payload);
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        carrinho: novoCarrinho,
        status: novoCarrinho.length === 0 ? 'Livre' : m.status
      } : m);
      return {
        ...state,
        carrinho: novoCarrinho,
        mesas: novasMesas
      };
    }
    case 'LIMPAR_CARRINHO': {
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        carrinho: [],
        descontoPercent: 0,
        status: 'Livre'
      } : m);
      return {
        ...state,
        carrinho: [],
        descontoPercent: 0,
        mesas: novasMesas
      };
    }
    case 'SET_DESCONTO': {
      const novoDesconto = Math.min(100, Math.max(0, action.payload));
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        descontoPercent: novoDesconto
      } : m);
      return {
        ...state,
        descontoPercent: novoDesconto,
        mesas: novasMesas
      };
    }

    // ---- VENDAS ----
    case 'FINALIZAR_VENDA': {
      const { formaPagamento } = action.payload;
      const subtotal = state.carrinho.reduce((acc, i) => acc + i.preco * i.qtd, 0);
      const desconto = subtotal * (state.descontoPercent / 100);
      const total = subtotal - desconto;
      const venda = {
        id: gerarId(),
        data: new Date().toISOString().slice(0, 10),
        itens: state.carrinho.map(i => ({ produtoId: i.produtoId, nome: i.nome, qtd: i.qtd, preco: i.preco })),
        total,
        desconto: state.descontoPercent,
        formaPagamento,
        operador: state.turnoAtual?.operador || 'Sistema',
      };
      // Atualizar estoque
      const novosProdutos = state.produtos.map(p => {
        const itemCarrinho = state.carrinho.find(i => i.produtoId === p.id);
        if (itemCarrinho) {
          return { ...p, estoque: Math.max(0, p.estoque - itemCarrinho.qtd) };
        }
        return p;
      });
      // Registrar movimentações de saída
      const novasMovs = state.carrinho.map(i => ({
        id: gerarId(), produtoId: i.produtoId, tipo: 'saida', quantidade: i.qtd,
        fornecedor: 'Venda #' + venda.id + ' (Mesa ' + (state.mesaSelecionada || 'N/A') + ')', data: venda.data,
      }));
      // Atualizar turno se aberto
      let turnoAtualizado = state.turnoAtual;
      if (turnoAtualizado) {
        turnoAtualizado = {
          ...turnoAtualizado,
          vendas: [...turnoAtualizado.vendas, venda.id],
          totalVendas: (turnoAtualizado.totalVendas || 0) + total,
          totalDinheiro: (turnoAtualizado.totalDinheiro || 0) + (formaPagamento === 'dinheiro' ? total : 0),
          totalCredito: (turnoAtualizado.totalCredito || 0) + (formaPagamento === 'credito' ? total : 0),
          totalDebito: (turnoAtualizado.totalDebito || 0) + (formaPagamento === 'debito' ? total : 0),
          totalPix: (turnoAtualizado.totalPix || 0) + (formaPagamento === 'pix' ? total : 0),
        };
      }
      // Limpar mesa e restaurar Livre
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m,
        carrinho: [],
        descontoPercent: 0,
        status: 'Livre'
      } : m);
      return {
        ...state,
        produtos: novosProdutos,
        vendas: [...state.vendas, venda],
        movimentacoes: [...state.movimentacoes, ...novasMovs],
        carrinho: [],
        descontoPercent: 0,
        turnoAtual: turnoAtualizado,
        mesas: novasMesas,
      };
    }

    // ---- MESAS ----
    case 'SELECIONAR_MESA': {
      const novaMesa = action.payload; // number or null
      let novasMesas = state.mesas ? [...state.mesas] : [];
      
      // Save current cart and discount to the currently selected table (if any)
      if (state.mesaSelecionada) {
        novasMesas = novasMesas.map(m => m.numero === state.mesaSelecionada ? {
          ...m,
          carrinho: state.carrinho,
          descontoPercent: state.descontoPercent,
          status: state.carrinho.length > 0 
            ? (m.status === 'Livre' ? 'Ocupada' : m.status)
            : 'Livre'
        } : m);
      }
      
      // Load cart and discount from the newly selected table
      let novoCarrinho = [];
      let novoDesconto = 0;
      if (novaMesa) {
        const mesaInfo = novasMesas.find(m => m.numero === novaMesa);
        if (mesaInfo) {
          novoCarrinho = mesaInfo.carrinho || [];
          novoDesconto = mesaInfo.descontoPercent || 0;
        }
      }
      
      return {
        ...state,
        mesas: novasMesas,
        mesaSelecionada: novaMesa,
        carrinho: novoCarrinho,
        descontoPercent: novoDesconto
      };
    }
    case 'SET_STATUS_MESA': {
      const { numero, status } = action.payload;
      return {
        ...state,
        mesas: state.mesas.map(m => m.numero === numero ? { ...m, status } : m)
      };
    }

    // ---- PRODUTOS ----
    case 'ADICIONAR_PRODUTO':
      return { ...state, produtos: [...state.produtos, { ...action.payload, id: gerarId() }] };
    case 'EDITAR_PRODUTO':
      return { ...state, produtos: state.produtos.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'TOGGLE_PRODUTO':
      return { ...state, produtos: state.produtos.map(p => p.id === action.payload ? { ...p, ativo: !p.ativo } : p) };
    case 'REORDENAR_PRODUTO': {
      const { id, direcao } = action.payload;
      const prod = state.produtos.find(p => p.id === id);
      const mesmaCategoria = state.produtos.filter(p => p.categoriaId === prod.categoriaId).sort((a, b) => a.ordem - b.ordem);
      const idx = mesmaCategoria.findIndex(p => p.id === id);
      const novoIdx = direcao === 'up' ? idx - 1 : idx + 1;
      if (novoIdx < 0 || novoIdx >= mesmaCategoria.length) return state;
      const outro = mesmaCategoria[novoIdx];
      return {
        ...state,
        produtos: state.produtos.map(p => {
          if (p.id === id) return { ...p, ordem: outro.ordem };
          if (p.id === outro.id) return { ...p, ordem: prod.ordem };
          return p;
        }),
      };
    }

    // ---- CATEGORIAS ----
    case 'ADICIONAR_CATEGORIA':
      return { ...state, categorias: [...state.categorias, { id: gerarId(), nome: action.payload, ordem: state.categorias.length }] };
    case 'RENOMEAR_CATEGORIA':
      return { ...state, categorias: state.categorias.map(c => c.id === action.payload.id ? { ...c, nome: action.payload.nome } : c) };

    // ---- ESTOQUE ----
    case 'ENTRADA_ESTOQUE': {
      const { produtoId, fornecedor, data } = action.payload;
      const mov = { id: gerarId(), produtoId, tipo: 'entrada', quantidade: action.payload.quantidade, fornecedor, data };
      return {
        ...state,
        produtos: state.produtos.map(p => p.id === produtoId ? { ...p, estoque: p.estoque + action.payload.quantidade } : p),
        movimentacoes: [...state.movimentacoes, mov],
      };
    }

    // ---- CAIXA/TURNOS ----
    case 'ABRIR_TURNO': {
      const { operador, valorInicial } = action.payload;
      const turno = {
        id: gerarId(), operador, dataAbertura: new Date().toISOString(), dataFechamento: null,
        valorInicial, status: 'aberto', vendas: [], sangrias: [], suprimentos: [],
        totalVendas: 0, totalDinheiro: 0, totalCredito: 0, totalDebito: 0, totalPix: 0,
      };
      return { ...state, turnoAtual: turno };
    }
    case 'SANGRIA': {
      if (!state.turnoAtual) return state;
      return {
        ...state,
        turnoAtual: {
          ...state.turnoAtual,
          sangrias: [...state.turnoAtual.sangrias, { valor: action.payload.valor, motivo: action.payload.motivo }],
        },
      };
    }
    case 'SUPRIMENTO': {
      if (!state.turnoAtual) return state;
      return {
        ...state,
        turnoAtual: {
          ...state.turnoAtual,
          suprimentos: [...state.turnoAtual.suprimentos, { valor: action.payload.valor, motivo: action.payload.motivo }],
        },
      };
    }
    case 'FECHAR_TURNO': {
      if (!state.turnoAtual) return state;
      const turnoFechado = {
        ...state.turnoAtual,
        dataFechamento: new Date().toISOString(),
        status: 'fechado',
      };
      return {
        ...state,
        turnos: [...state.turnos, turnoFechado],
        turnoAtual: null,
      };
    }

    case 'RESET':
      return estadoInicial;

    default:
      return state;
  }
}`;
content = content.replace(reducerMatch, newReducer);

// 4. Replace FrenteDeCaixa function
const frenteDeCaixaMatch = /function FrenteDeCaixa\(\) \{[\s\S]*?\n\n\/\/ ============================================================[\s\S]*?\/\/ MÓDULO 2/;
const newFrenteDeCaixa = `function FrenteDeCaixa() {
  const { state, dispatch, addToast } = useContext(AppContext);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [visualizacao, setVisualizacao] = useState('produtos'); // 'produtos' | 'mesas'

  const produtosFiltrados = state.produtos
    .filter(p => p.ativo)
    .filter(p => categoriaFiltro === 'todas' || p.categoriaId === categoriaFiltro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.ordem - b.ordem);

  const subtotal = state.carrinho.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const desconto = subtotal * (state.descontoPercent / 100);
  const total = subtotal - desconto;
  const totalItens = state.carrinho.reduce((acc, i) => acc + i.qtd, 0);

  const troco = formaPagamento === 'dinheiro' && valorPago ? Math.max(0, parseFloat(valorPago.replace(',', '.')) - total) : 0;

  const finalizarVenda = () => {
    if (state.carrinho.length === 0) {
      addToast('Carrinho vazio!', 'aviso');
      return;
    }
    if (!state.turnoAtual) {
      addToast('Abra um turno antes de vender!', 'aviso');
      return;
    }
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago.replace(',', '.'));
      if (isNaN(pago) || pago < total) {
        addToast('Valor pago insuficiente!', 'erro');
        return;
      }
    }
    dispatch({ type: 'FINALIZAR_VENDA', payload: { formaPagamento } });
    setModalPagamento(false);
    setFormaPagamento('');
    setValorPago('');
    addToast('Venda de ' + formatarMoeda(total) + ' finalizada com sucesso! Mesa livre.', 'sucesso');
  };

  const selecionarMesaPainel = (numero) => {
    dispatch({ type: 'SELECIONAR_MESA', payload: numero });
    setVisualizacao('produtos');
  };

  return (
    <div className="flex h-[calc(100vh-60px)] gap-0">
      {/* Área de Produtos ou Mesas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toggle de Visualização */}
        <div className="flex border-b border-slate-700/50 bg-slate-900/40 p-2 gap-2">
          <button
            onClick={() => setVisualizacao('produtos')}
            className={'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 ' +
              (visualizacao === 'produtos' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}
          >
            <UtensilsCrossed size={16} /> Cardápio / Produtos
          </button>
          <button
            onClick={() => setVisualizacao('mesas')}
            className={'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 relative ' +
              (visualizacao === 'mesas' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}
          >
            <Users size={16} /> Painel de Mesas
            {state.mesas?.filter(m => m.status !== 'Livre').length > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {state.mesas.filter(m => m.status !== 'Livre').length}
              </span>
            )}
          </button>
        </div>

        {visualizacao === 'produtos' ? (
          <>
            {/* Busca e Categorias */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Buscar produto..."
                  value={busca} onChange={e => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition text-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button onClick={() => setCategoriaFiltro('todas')}
                  className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ' +
                    (categoriaFiltro === 'todas' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}>
                  Todos
                </button>
                {state.categorias.sort((a, b) => a.ordem - b.ordem).map(cat => (
                  <button key={cat.id} onClick={() => setCategoriaFiltro(cat.id)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ' +
                      (categoriaFiltro === cat.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}>
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {produtosFiltrados.map(produto => {
                  const estoqueStatus = produto.estoque <= 0 ? 'esgotado' :
                    produto.estoque <= produto.estoqueMinimo * 0.25 ? 'critico' :
                    produto.estoque <= produto.estoqueMinimo ? 'baixo' : 'ok';
                  return (
                    <button key={produto.id}
                      onClick={() => {
                        if (!state.mesaSelecionada) {
                          addToast('Selecione uma mesa antes de registrar itens!', 'aviso');
                          return;
                        }
                        if (produto.estoque <= 0) { addToast(produto.nome + ' sem estoque!', 'erro'); return; }
                        dispatch({ type: 'ADICIONAR_AO_CARRINHO', payload: produto });
                      }}
                      disabled={produto.estoque <= 0}
                      className={'product-card bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-left cursor-pointer relative ' +
                        (produto.estoque <= 0 ? 'opacity-40 cursor-not-allowed' : '')}
                    >
                      <div className="text-3xl mb-2">{produto.emoji}</div>
                      <p className="text-sm font-semibold text-white truncate">{produto.nome}</p>
                      <p className="text-orange-400 font-bold text-sm mt-1">{formatarMoeda(produto.preco)}</p>
                      {estoqueStatus !== 'ok' && (
                        <span className={'absolute top-2 right-2 w-2.5 h-2.5 rounded-full ' +
                          (estoqueStatus === 'esgotado' ? 'bg-red-500' : estoqueStatus === 'critico' ? 'bg-red-400 animate-pulse' : 'bg-yellow-400')}
                        />
                      )}
                      <p className="text-[10px] text-slate-500 mt-1">Estoque: {produto.estoque}</p>
                    </button>
                  );
                })}
              </div>
              {produtosFiltrados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Package size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Painel de Mesas */
          <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {state.mesas?.map(m => {
                const isSelected = state.mesaSelecionada === m.numero;
                const totalMesa = m.carrinho?.reduce((acc, item) => acc + item.preco * item.qtd, 0) || 0;
                const descontoMesa = totalMesa * ((m.descontoPercent || 0) / 100);
                const totalMesaFinal = totalMesa - descontoMesa;
                const totalItensMesa = m.carrinho?.reduce((acc, item) => acc + item.qtd, 0) || 0;

                return (
                  <button
                    key={m.numero}
                    onClick={() => selecionarMesaPainel(m.numero)}
                    className={'p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between h-[120px] relative ' +
                      (isSelected ? 'border-orange-500 bg-slate-800 shadow-lg shadow-orange-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500') + ' ' +
                      (m.status === 'Livre' ? 'hover:shadow-green-500/5' : m.status === 'Ocupada' ? 'hover:shadow-orange-500/5' : 'hover:shadow-red-500/5')}
                  >
                    {/* Status Dot */}
                    <span className={'absolute top-3 right-3 w-3 h-3 rounded-full ' +
                      (m.status === 'Livre' ? 'bg-green-500 shadow-lg shadow-green-500/30' : m.status === 'Ocupada' ? 'bg-orange-500 shadow-lg shadow-orange-500/30 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse')}
                    />

                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mesa</p>
                      <h4 className="text-2xl font-black text-white">{String(m.numero).padStart(2, '0')}</h4>
                    </div>

                    <div className="mt-2">
                      {totalItensMesa > 0 ? (
                        <div>
                          <p className="text-xs font-bold text-orange-400">{formatarMoeda(totalMesaFinal)}</p>
                          <p className="text-[10px] text-slate-400">{totalItensMesa} {totalItensMesa === 1 ? 'item' : 'itens'}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-semibold italic">Livre</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Carrinho Lateral */}
      <div className="w-[340px] bg-slate-900 border-l border-slate-700/50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart size={18} className="text-orange-400" />
              Comanda
            </h2>
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {/* Seletor de Mesa */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mesa</label>
            <select
              value={state.mesaSelecionada || ''}
              onChange={e => {
                const num = e.target.value ? Number(e.target.value) : null;
                dispatch({ type: 'SELECIONAR_MESA', payload: num });
              }}
              className="flex-1 max-w-[180px] bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">Selecione a Mesa</option>
              {state.mesas?.map(m => {
                let statusLabel = '';
                if (m.status === 'Ocupada') statusLabel = ' (Ocupada)';
                if (m.status === 'Conta pedida') statusLabel = ' (Conta)';
                return (
                  <option key={m.numero} value={m.numero}>
                    Mesa {m.numero}{statusLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {state.mesaSelecionada && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-800 animate-fade-in">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              <div className="flex gap-1">
                {[
                  { id: 'Livre', label: 'Livre', corBg: 'bg-green-500/10 text-green-400 border-green-500/20', activeBg: 'bg-green-500 text-white border-green-500' },
                  { id: 'Ocupada', label: 'Ocupada', corBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', activeBg: 'bg-orange-500 text-white border-orange-500' },
                  { id: 'Conta pedida', label: 'Conta Pedida', corBg: 'bg-red-500/10 text-red-400 border-red-500/20', activeBg: 'bg-red-500 text-white border-red-500' },
                ].map(st => {
                  const active = (state.mesas?.find(m => m.numero === state.mesaSelecionada)?.status || 'Livre') === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => dispatch({ type: 'SET_STATUS_MESA', payload: { numero: state.mesaSelecionada, status: st.id } })}
                      className={'px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ' +
                        (active ? st.activeBg : st.corBg + ' hover:bg-slate-800')}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Itens do carrinho */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!state.mesaSelecionada ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Users size={40} className="mb-2 opacity-20 text-orange-400 animate-pulse" />
              <p className="text-sm font-semibold">Selecione uma mesa</p>
              <p className="text-xs text-slate-500 mt-1">Selecione no topo ou no painel</p>
            </div>
          ) : state.carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ShoppingCart size={40} className="mb-2 opacity-20" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            state.carrinho.map(item => (
              <div key={item.produtoId} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3 animate-slide-up">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.nome}</p>
                  <p className="text-xs text-slate-400">{formatarMoeda(item.preco)} un.</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => dispatch({ type: 'ALTERAR_QTD_CARRINHO', payload: { produtoId: item.produtoId, delta: -1 } })}
                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white cursor-pointer transition">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{item.qtd}</span>
                  <button onClick={() => dispatch({ type: 'ALTERAR_QTD_CARRINHO', payload: { produtoId: item.produtoId, delta: 1 } })}
                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white cursor-pointer transition">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-sm font-bold text-orange-400 w-20 text-right">{formatarMoeda(item.preco * item.qtd)}</p>
                <button onClick={() => dispatch({ type: 'REMOVER_DO_CARRINHO', payload: item.produtoId })}
                  className="text-red-400 hover:text-red-300 cursor-pointer transition">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Resumo e Pagamento */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          {/* Desconto */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Desconto %</label>
            <input type="number" min={0} max={100} value={state.descontoPercent}
              onChange={e => dispatch({ type: 'SET_DESCONTO', payload: Number(e.target.value) })}
              className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-orange-500"
              disabled={!state.mesaSelecionada}
            />
            {desconto > 0 && <span className="text-xs text-green-400">-{formatarMoeda(desconto)}</span>}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span><span>{formatarMoeda(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto ({state.descontoPercent}%)</span><span>-{formatarMoeda(desconto)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-white pt-1 border-t border-slate-700">
              <span>Total</span><span className="text-orange-400">{formatarMoeda(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => dispatch({ type: 'LIMPAR_CARRINHO' })}
              disabled={!state.mesaSelecionada}
              className="py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={14} /> Limpar
            </button>
            <button onClick={() => { if (state.carrinho.length > 0) setModalPagamento(true); else addToast('Carrinho vazio!', 'aviso'); }}
              disabled={!state.mesaSelecionada || state.carrinho.length === 0}
              className="py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
              <DollarSign size={14} /> Pagar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={() => setModalPagamento(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Pagamento - Mesa {state.mesaSelecionada}</h3>
              <button onClick={() => setModalPagamento(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={24} /></button>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-slate-400">Total a pagar</p>
              <p className="text-3xl font-extrabold text-orange-400">{formatarMoeda(total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, cor: 'green' },
                { id: 'credito', label: 'Crédito', icon: CreditCard, cor: 'blue' },
                { id: 'debito', label: 'Débito', icon: CreditCard, cor: 'purple' },
                { id: 'pix', label: 'PIX', icon: QrCode, cor: 'cyan' },
              ].map(fp => {
                const Icon = fp.icon;
                return (
                  <button key={fp.id} onClick={() => setFormaPagamento(fp.id)}
                    className={'p-4 rounded-xl border-2 transition cursor-pointer flex flex-col items-center gap-2 ' +
                      (formaPagamento === fp.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500')}>
                    <Icon size={28} />
                    <span className="text-sm font-semibold">{fp.label}</span>
                  </button>
                );
              })}
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="mb-4 space-y-3 animate-fade-in">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Valor recebido</label>
                  <input type="text" value={valorPago} onChange={e => setValorPago(e.target.value)}
                    placeholder="0,00" autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-lg font-bold text-center focus:outline-none focus:border-orange-500" />
                </div>
                {valorPago && parseFloat(valorPago.replace(',', '.')) >= total && (
                  <div className="text-center p-3 rounded-xl bg-green-900/30 border border-green-700/50">
                    <p className="text-sm text-green-400">Troco</p>
                    <p className="text-2xl font-bold text-green-300">{formatarMoeda(troco)}</p>
                  </div>
                )}
              </div>
            )}

            <button onClick={finalizarVenda} disabled={!formaPagamento}
              className={'w-full py-3 rounded-xl font-bold text-lg transition cursor-pointer flex items-center justify-center gap-2 ' +
                (formaPagamento ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed')}
            >
              <Check size={20} /> Finalizar Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MÓDULO 2`;
content = content.replace(frenteDeCaixaMatch, newFrenteDeCaixa);

fs.writeFileSync(appPath, content, 'utf8');
console.log("Successfully refactored App.jsx!");
