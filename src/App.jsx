// PDV BAR & RESTAURANTE - Sistema Completo
import { useState, useReducer, useContext, createContext, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, DollarSign, CreditCard,
  QrCode, Banknote, X, Check, AlertTriangle, Package, BarChart3,
  ChevronLeft, ChevronRight, Menu as MenuIcon, UtensilsCrossed,
  Warehouse, Calculator, FileText, LogOut, Clock, TrendingUp,
  ChevronDown, ChevronUp, Edit, Eye, EyeOff, ArrowUp, ArrowDown,
  Printer, Filter, Calendar, Star, Users, Receipt, CircleDollarSign,
  ArrowDownCircle, ArrowUpCircle, Info, Tag, Layers
} from 'lucide-react';

const gerarId = () => Math.random().toString(36).substring(2, 9);

const CATEGORIAS_INICIAIS = [
  { id: 'cat1', nome: 'Cervejas', ordem: 0 },
  { id: 'cat2', nome: 'Drinks', ordem: 1 },
  { id: 'cat3', nome: 'Águas', ordem: 2 },
  { id: 'cat4', nome: 'Petiscos', ordem: 3 },
  { id: 'cat5', nome: 'Lanches', ordem: 4 },
  { id: 'cat6', nome: 'Sobremesas', ordem: 5 },
];

const PRODUTOS_INICIAIS = [
  { id: 'p1', nome: 'Brahma 600ml', emoji: '🍺', preco: 12.00, categoriaId: 'cat1', ativo: true, estoque: 48, estoqueMinimo: 10, ordem: 0 },
  { id: 'p2', nome: 'Heineken Lata', emoji: '🍺', preco: 9.00, categoriaId: 'cat1', ativo: true, estoque: 36, estoqueMinimo: 10, ordem: 1 },
  { id: 'p3', nome: 'Skol Lata', emoji: '🍺', preco: 7.00, categoriaId: 'cat1', ativo: true, estoque: 60, estoqueMinimo: 15, ordem: 2 },
  { id: 'p4', nome: 'Água com Gás', emoji: '💧', preco: 5.00, categoriaId: 'cat3', ativo: true, estoque: 24, estoqueMinimo: 10, ordem: 0 },
  { id: 'p5', nome: 'Água sem Gás', emoji: '💧', preco: 4.00, categoriaId: 'cat3', ativo: true, estoque: 30, estoqueMinimo: 10, ordem: 1 },
  { id: 'p6', nome: 'Caipirinha', emoji: '🍹', preco: 18.00, categoriaId: 'cat2', ativo: true, estoque: 15, estoqueMinimo: 5, ordem: 0 },
  { id: 'p7', nome: 'Daiquiri', emoji: '🍹', preco: 22.00, categoriaId: 'cat2', ativo: true, estoque: 8, estoqueMinimo: 5, ordem: 1 },
  { id: 'p8', nome: 'Mojito', emoji: '🍹', preco: 20.00, categoriaId: 'cat2', ativo: true, estoque: 10, estoqueMinimo: 5, ordem: 2 },
  { id: 'p9', nome: 'Porção de Calabresa', emoji: '🥩', preco: 35.00, categoriaId: 'cat4', ativo: true, estoque: 12, estoqueMinimo: 5, ordem: 0 },
  { id: 'p10', nome: 'Frango Frito', emoji: '🍗', preco: 28.00, categoriaId: 'cat4', ativo: true, estoque: 10, estoqueMinimo: 5, ordem: 1 },
  { id: 'p11', nome: 'Batata Frita', emoji: '🍟', preco: 22.00, categoriaId: 'cat4', ativo: true, estoque: 18, estoqueMinimo: 8, ordem: 2 },
  { id: 'p12', nome: 'Misto Quente', emoji: '🥪', preco: 15.00, categoriaId: 'cat5', ativo: true, estoque: 20, estoqueMinimo: 8, ordem: 0 },
  { id: 'p13', nome: 'Pudim', emoji: '🍮', preco: 12.00, categoriaId: 'cat6', ativo: true, estoque: 6, estoqueMinimo: 5, ordem: 0 },
  { id: 'p14', nome: 'Sorvete', emoji: '🍨', preco: 10.00, categoriaId: 'cat6', ativo: true, estoque: 3, estoqueMinimo: 8, ordem: 1 },
];

const VENDAS_INICIAIS = [];
const MOVIMENTACOES_INICIAIS = [];
const TURNOS_INICIAIS = [];

const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

const formatarData = (dataStr) => {
  if (!dataStr) return '';
  const d = new Date(dataStr + (dataStr.includes('T') ? '' : 'T12:00:00'));
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatarDataHora = (dataStr) => {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const getHojeStr = () => new Date().toISOString().slice(0, 10);

const AppContext = createContext();

const MESAS_INICIAIS = Array.from({ length: 20 }, (_, i) => ({
  numero: i + 1,
  nome: null, // null = usa nome padrão "Mesa XX"
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
};

function carregarEstado() {
  try {
    const salvo = localStorage.getItem('pdv_estado');
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (parsed.vendas) {
        parsed.vendas = parsed.vendas.filter(v => !['v1','v2','v3','v4','v5','v6','v7','v8'].includes(v.id));
      }
      if (parsed.turnos) {
        parsed.turnos = parsed.turnos.filter(t => !['t1','t2'].includes(t.id));
      }
      if (parsed.movimentacoes) {
        parsed.movimentacoes = parsed.movimentacoes.filter(m => !['m1','m2','m3'].includes(m.id));
      }
      if (!parsed.mesas || parsed.mesas.length === 0) parsed.mesas = MESAS_INICIAIS;
      if (parsed.mesaSelecionada === undefined) parsed.mesaSelecionada = null;
      return { ...estadoInicial, ...parsed };
    }
  } catch (e) {}
  return estadoInicial;
}

function reducer(state, action) {
  switch (action.type) {
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
        ...m, carrinho: novoCarrinho, status: m.status === 'Livre' ? 'Ocupada' : m.status
      } : m);
      return { ...state, carrinho: novoCarrinho, mesas: novasMesas };
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
        ...m, carrinho: novoCarrinho, status: novoCarrinho.length === 0 ? 'Livre' : m.status
      } : m);
      return { ...state, carrinho: novoCarrinho, mesas: novasMesas };
    }
    case 'REMOVER_DO_CARRINHO': {
      const novoCarrinho = state.carrinho.filter(i => i.produtoId !== action.payload);
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m, carrinho: novoCarrinho, status: novoCarrinho.length === 0 ? 'Livre' : m.status
      } : m);
      return { ...state, carrinho: novoCarrinho, mesas: novasMesas };
    }
    case 'LIMPAR_CARRINHO': {
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m, carrinho: [], descontoPercent: 0, status: 'Livre'
      } : m);
      return { ...state, carrinho: [], descontoPercent: 0, mesas: novasMesas };
    }
    case 'SET_DESCONTO': {
      const novoDesconto = Math.min(100, Math.max(0, action.payload));
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? { ...m, descontoPercent: novoDesconto } : m);
      return { ...state, descontoPercent: novoDesconto, mesas: novasMesas };
    }
    case 'FINALIZAR_VENDA': {
      const { formaPagamento } = action.payload;
      const subtotal = state.carrinho.reduce((acc, i) => acc + i.preco * i.qtd, 0);
      const desconto = subtotal * (state.descontoPercent / 100);
      const total = subtotal - desconto;
      const venda = {
        id: gerarId(), data: new Date().toISOString().slice(0, 10),
        itens: state.carrinho.map(i => ({ produtoId: i.produtoId, nome: i.nome, qtd: i.qtd, preco: i.preco })),
        total, desconto: state.descontoPercent, formaPagamento,
        operador: state.turnoAtual?.operador || 'Sistema',
      };
      const novosProdutos = state.produtos.map(p => {
        const itemCarrinho = state.carrinho.find(i => i.produtoId === p.id);
        if (itemCarrinho) return { ...p, estoque: Math.max(0, p.estoque - itemCarrinho.qtd) };
        return p;
      });
      const novasMovs = state.carrinho.map(i => ({
        id: gerarId(), produtoId: i.produtoId, tipo: 'saida', quantidade: i.qtd,
        fornecedor: `Venda #${venda.id} (Mesa ${state.mesaSelecionada || 'N/A'})`, data: venda.data,
      }));
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
      const novasMesas = state.mesas.map(m => m.numero === state.mesaSelecionada ? {
        ...m, carrinho: [], descontoPercent: 0, status: 'Livre', nome: null
      } : m);
      return {
        ...state, produtos: novosProdutos,
        vendas: [...state.vendas, venda],
        movimentacoes: [...state.movimentacoes, ...novasMovs],
        carrinho: [], descontoPercent: 0, turnoAtual: turnoAtualizado, mesas: novasMesas,
      };
    }
    case 'SELECIONAR_MESA': {
      const novaMesa = action.payload;
      let novasMesas = state.mesas ? [...state.mesas] : [];
      if (state.mesaSelecionada) {
        novasMesas = novasMesas.map(m => m.numero === state.mesaSelecionada ? {
          ...m, carrinho: state.carrinho, descontoPercent: state.descontoPercent,
          status: state.carrinho.length > 0 ? (m.status === 'Livre' ? 'Ocupada' : m.status) : 'Livre'
        } : m);
      }
      let novoCarrinho = [];
      let novoDesconto = 0;
      if (novaMesa) {
        const mesaInfo = novasMesas.find(m => m.numero === novaMesa);
        if (mesaInfo) { novoCarrinho = mesaInfo.carrinho || []; novoDesconto = mesaInfo.descontoPercent || 0; }
      }
      return { ...state, mesas: novasMesas, mesaSelecionada: novaMesa, carrinho: novoCarrinho, descontoPercent: novoDesconto };
    }
    case 'SET_STATUS_MESA': {
      const { numero, status } = action.payload;
      return { ...state, mesas: state.mesas.map(m => m.numero === numero ? { ...m, status } : m) };
    }
    case 'RENOMEAR_MESA': {
      const { numero, nome } = action.payload;
      return { ...state, mesas: state.mesas.map(m => m.numero === numero ? { ...m, nome: nome.trim() || null } : m) };
    }
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
    case 'ADICIONAR_CATEGORIA':
      return { ...state, categorias: [...state.categorias, { id: gerarId(), nome: action.payload, ordem: state.categorias.length }] };
    case 'RENOMEAR_CATEGORIA':
      return { ...state, categorias: state.categorias.map(c => c.id === action.payload.id ? { ...c, nome: action.payload.nome } : c) };
    case 'ENTRADA_ESTOQUE': {
      const { produtoId, quantidade, fornecedor, data } = action.payload;
      const mov = { id: gerarId(), produtoId, tipo: 'entrada', quantidade, fornecedor, data };
      return {
        ...state,
        produtos: state.produtos.map(p => p.id === produtoId ? { ...p, estoque: p.estoque + quantidade } : p),
        movimentacoes: [...state.movimentacoes, mov],
      };
    }
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
      return { ...state, turnoAtual: { ...state.turnoAtual, sangrias: [...state.turnoAtual.sangrias, { valor: action.payload.valor, motivo: action.payload.motivo }] } };
    }
    case 'SUPRIMENTO': {
      if (!state.turnoAtual) return state;
      return { ...state, turnoAtual: { ...state.turnoAtual, suprimentos: [...state.turnoAtual.suprimentos, { valor: action.payload.valor, motivo: action.payload.motivo }] } };
    }
    case 'FECHAR_TURNO': {
      if (!state.turnoAtual) return state;
      const turnoFechado = { ...state.turnoAtual, dataFechamento: new Date().toISOString(), status: 'fechado' };
      return { ...state, turnos: [...state.turnos, turnoFechado], turnoAtual: null };
    }
    case 'RESET':
      return estadoInicial;
    default:
      return state;
  }
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[280px] max-w-[400px]
            ${t.tipo === 'sucesso' ? 'bg-green-900/90 border-green-700 text-green-100' :
              t.tipo === 'erro' ? 'bg-red-900/90 border-red-700 text-red-100' :
              t.tipo === 'aviso' ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100' :
              'bg-slate-800/90 border-slate-600 text-slate-100'}`}
        >
          {t.tipo === 'sucesso' && <Check size={18} />}
          {t.tipo === 'erro' && <X size={18} />}
          {t.tipo === 'aviso' && <AlertTriangle size={18} />}
          {t.tipo === 'info' && <Info size={18} />}
          <span className="text-sm font-medium flex-1">{t.mensagem}</span>
          <button onClick={() => removeToast(t.id)} className="hover:opacity-70 cursor-pointer"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function ModalConfirmacao({ aberto, titulo, mensagem, onConfirmar, onCancelar }) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancelar}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-orange-500/20">
            <AlertTriangle size={24} className="text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{titulo}</h3>
        </div>
        <p className="text-slate-300 mb-6">{mensagem}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancelar} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition cursor-pointer">Cancelar</button>
          <button onClick={onConfirmar} className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition font-semibold cursor-pointer">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ paginaAtual, setPagina, sidebarAberta, setSidebarAberta }) {
  const itens = [
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'cardapio', label: 'Cardápio', icon: UtensilsCrossed },
    { id: 'estoque', label: 'Estoque', icon: Warehouse },
    { id: 'caixa', label: 'Caixa', icon: Calculator },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];
  const { state } = useContext(AppContext);
  const alertas = state.produtos.filter(p => p.ativo && p.estoque <= p.estoqueMinimo).length;

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700/50 z-40 transition-all duration-300 flex flex-col ${sidebarAberta ? 'w-56' : 'w-16'}`}>
      <div className="p-3 border-b border-slate-700/50 flex items-center gap-2 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Receipt size={20} className="text-white" />
        </div>
        {sidebarAberta && (
          <div>
            <h1 className="font-extrabold text-sm text-orange-400 whitespace-nowrap">PDV BAR</h1>
            <p className="text-[10px] text-slate-500 whitespace-nowrap">& Restaurante</p>
          </div>
        )}
      </div>
      <nav className="flex-1 py-2">
        {itens.map(item => {
          const Icon = item.icon;
          const ativo = paginaAtual === item.id;
          return (
            <button key={item.id} onClick={() => setPagina(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer relative transition
                ${ativo ? 'text-orange-400 bg-orange-500/10 border-r-2 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <Icon size={20} className="flex-shrink-0" />
              {sidebarAberta && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              {item.id === 'estoque' && alertas > 0 && (
                <span className="absolute top-1 left-8 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">{alertas}</span>
              )}
            </button>
          );
        })}
      </nav>
      <button onClick={() => setSidebarAberta(!sidebarAberta)}
        className="p-3 border-t border-slate-700/50 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center">
        {sidebarAberta ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </aside>
  );
}

function Topbar({ turnoAtual, totalVendasHoje }) {
  return (
    <header className="h-[60px] bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-slate-400" />
          <span className="text-slate-300 font-medium">{turnoAtual ? turnoAtual.operador : 'Sem turno aberto'}</span>
        </div>
        {turnoAtual && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">Turno Aberto</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vendas Hoje</p>
          <p className="text-sm font-bold text-white">{formatarMoeda(totalVendasHoje)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data</p>
          <p className="text-sm font-medium text-slate-300">{formatarData(getHojeStr())}</p>
        </div>
      </div>
    </header>
  );
}

// MÓDULO 1: FRENTE DE CAIXA (PDV)
function FrenteDeCaixa() {
  const { state, dispatch, addToast } = useContext(AppContext);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [visualizacao, setVisualizacao] = useState('produtos');

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
    if (state.carrinho.length === 0) { addToast('Carrinho vazio!', 'aviso'); return; }
    if (!state.turnoAtual) { addToast('Abra um turno antes de vender!', 'aviso'); return; }
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago.replace(',', '.'));
      if (isNaN(pago) || pago < total) { addToast('Valor pago insuficiente!', 'erro'); return; }
    }
    dispatch({ type: 'FINALIZAR_VENDA', payload: { formaPagamento } });
    setModalPagamento(false);
    setFormaPagamento('');
    setValorPago('');
    addToast(`Venda de ${formatarMoeda(total)} finalizada! Mesa livre.`, 'sucesso');
  };

  return (
    <div className="flex h-[calc(100vh-60px)] gap-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex border-b border-slate-700/50 bg-slate-900/40 p-2 gap-2">
          <button onClick={() => setVisualizacao('produtos')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2
              ${visualizacao === 'produtos' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            <UtensilsCrossed size={16} /> Cardápio
          </button>
          <button onClick={() => setVisualizacao('mesas')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 relative
              ${visualizacao === 'mesas' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            <Users size={16} /> Painel de Mesas
            {state.mesas?.filter(m => m.status !== 'Livre').length > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {state.mesas.filter(m => m.status !== 'Livre').length}
              </span>
            )}
          </button>
        </div>

        {visualizacao === 'produtos' ? (
          <>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setCategoriaFiltro('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer
                    ${categoriaFiltro === 'todas' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                  Todos
                </button>
                {state.categorias.sort((a, b) => a.ordem - b.ordem).map(cat => (
                  <button key={cat.id} onClick={() => setCategoriaFiltro(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer
                      ${categoriaFiltro === cat.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {produtosFiltrados.map(produto => {
                  const estoqueStatus = produto.estoque <= 0 ? 'esgotado' :
                    produto.estoque <= produto.estoqueMinimo * 0.25 ? 'critico' :
                    produto.estoque <= produto.estoqueMinimo ? 'baixo' : 'ok';
                  return (
                    <button key={produto.id}
                      onClick={() => {
                        if (!state.mesaSelecionada) { addToast('Selecione uma mesa!', 'aviso'); return; }
                        if (produto.estoque <= 0) { addToast(`${produto.nome} sem estoque!`, 'erro'); return; }
                        dispatch({ type: 'ADICIONAR_AO_CARRINHO', payload: produto });
                      }}
                      disabled={produto.estoque <= 0}
                      className={`bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-left cursor-pointer relative hover:border-orange-500/50 transition
                        ${produto.estoque <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div className="text-3xl mb-2">{produto.emoji}</div>
                      <p className="text-sm font-semibold text-white truncate">{produto.nome}</p>
                      <p className="text-orange-400 font-bold text-sm mt-1">{formatarMoeda(produto.preco)}</p>
                      {estoqueStatus !== 'ok' && (
                        <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full
                          ${estoqueStatus === 'esgotado' ? 'bg-red-500' : estoqueStatus === 'critico' ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'}`} />
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
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs text-slate-500 mb-3 text-center">Clique para selecionar · Duplo clique para renomear</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {state.mesas?.map(m => {
                const isSelected = state.mesaSelecionada === m.numero;
                const totalMesa = m.carrinho?.reduce((acc, item) => acc + item.preco * item.qtd, 0) || 0;
                const totalItensMesa = m.carrinho?.reduce((acc, item) => acc + item.qtd, 0) || 0;
                const nomeMesa = m.nome || `Mesa ${String(m.numero).padStart(2, '0')}`;
                return (
                  <div key={m.numero} className="relative group">
                    <button
                      onClick={() => { dispatch({ type: 'SELECIONAR_MESA', payload: m.numero }); setVisualizacao('produtos'); }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const novoNome = window.prompt('Renomear mesa:', m.nome || `Mesa ${String(m.numero).padStart(2, '0')}`);
                        if (novoNome !== null) {
                          dispatch({ type: 'RENOMEAR_MESA', payload: { numero: m.numero, nome: novoNome } });
                        }
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between h-[130px] relative
                        ${isSelected ? 'border-orange-500 bg-slate-800' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}>
                      <span className={`absolute top-3 right-3 w-3 h-3 rounded-full
                        ${m.status === 'Livre' ? 'bg-green-500' : m.status === 'Ocupada' ? 'bg-orange-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">#{String(m.numero).padStart(2, '0')}</p>
                        <h4 className="text-base font-black text-white leading-tight mt-0.5 pr-4">{nomeMesa}</h4>
                      </div>
                      <div>
                        {totalItensMesa > 0 ? (
                          <div>
                            <p className="text-xs font-bold text-orange-400">{formatarMoeda(totalMesa)}</p>
                            <p className="text-[10px] text-slate-400">{totalItensMesa} {totalItensMesa === 1 ? 'item' : 'itens'}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 font-semibold italic">{m.status}</p>
                        )}
                      </div>
                    </button>
                    {/* Botão de renomear visível no hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const novoNome = window.prompt('Renomear mesa:', m.nome || `Mesa ${String(m.numero).padStart(2, '0')}`);
                        if (novoNome !== null) {
                          dispatch({ type: 'RENOMEAR_MESA', payload: { numero: m.numero, nome: novoNome } });
                        }
                      }}
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition w-6 h-6 rounded-md bg-slate-700 hover:bg-orange-500 flex items-center justify-center"
                      title="Renomear mesa">
                      <Edit size={12} className="text-slate-300" />
                    </button>
                  </div>
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
              <ShoppingCart size={18} className="text-orange-400" /> Comanda
            </h2>
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mesa</label>
            <select value={state.mesaSelecionada || ''}
              onChange={e => dispatch({ type: 'SELECIONAR_MESA', payload: e.target.value ? Number(e.target.value) : null })}
              className="flex-1 max-w-[180px] bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-500 cursor-pointer">
              <option value="">Selecione a Mesa</option>
              {state.mesas?.map(m => {
                const nomeMesa = m.nome || `Mesa ${String(m.numero).padStart(2, '0')}`;
                const statusLabel = m.status === 'Ocupada' ? ' (Ocupada)' : m.status === 'Conta pedida' ? ' (Conta)' : '';
                return (
                  <option key={m.numero} value={m.numero}>{nomeMesa}{statusLabel}</option>
                );
              })}
            </select>
          </div>
          {state.mesaSelecionada && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              <div className="flex gap-1">
                {[
                  { id: 'Livre', label: 'Livre', active: 'bg-green-500 text-white', inactive: 'bg-green-500/10 text-green-400 border border-green-500/20' },
                  { id: 'Ocupada', label: 'Ocupada', active: 'bg-orange-500 text-white', inactive: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
                  { id: 'Conta pedida', label: 'Conta', active: 'bg-red-500 text-white', inactive: 'bg-red-500/10 text-red-400 border border-red-500/20' },
                ].map(st => {
                  const isActive = (state.mesas?.find(m => m.numero === state.mesaSelecionada)?.status || 'Livre') === st.id;
                  return (
                    <button key={st.id}
                      onClick={() => dispatch({ type: 'SET_STATUS_MESA', payload: { numero: state.mesaSelecionada, status: st.id } })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${isActive ? st.active : st.inactive}`}>
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!state.mesaSelecionada ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Users size={40} className="mb-2 opacity-20 text-orange-400" />
              <p className="text-sm font-semibold">Selecione uma mesa</p>
            </div>
          ) : state.carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ShoppingCart size={40} className="mb-2 opacity-20" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            state.carrinho.map(item => (
              <div key={item.produtoId} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
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

        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Desconto %</label>
            <input type="number" min={0} max={100} value={state.descontoPercent}
              onChange={e => dispatch({ type: 'SET_DESCONTO', payload: Number(e.target.value) })}
              className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-orange-500"
              disabled={!state.mesaSelecionada} />
            {desconto > 0 && <span className="text-xs text-green-400">-{formatarMoeda(desconto)}</span>}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatarMoeda(subtotal)}</span></div>
            {desconto > 0 && <div className="flex justify-between text-green-400"><span>Desconto ({state.descontoPercent}%)</span><span>-{formatarMoeda(desconto)}</span></div>}
            <div className="flex justify-between text-lg font-extrabold text-white pt-1 border-t border-slate-700">
              <span>Total</span><span className="text-orange-400">{formatarMoeda(total)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => dispatch({ type: 'LIMPAR_CARRINHO' })} disabled={!state.mesaSelecionada}
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

      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalPagamento(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Pagamento - {state.mesas?.find(m => m.numero === state.mesaSelecionada)?.nome || `Mesa ${String(state.mesaSelecionada).padStart(2, '0')}`}</h3>
              <button onClick={() => setModalPagamento(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={24} /></button>
            </div>
            <div className="text-center mb-6">
              <p className="text-sm text-slate-400">Total a pagar</p>
              <p className="text-3xl font-extrabold text-orange-400">{formatarMoeda(total)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { id: 'credito', label: 'Crédito', icon: CreditCard },
                { id: 'debito', label: 'Débito', icon: CreditCard },
                { id: 'pix', label: 'PIX', icon: QrCode },
              ].map(fp => {
                const Icon = fp.icon;
                return (
                  <button key={fp.id} onClick={() => setFormaPagamento(fp.id)}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col items-center gap-2
                      ${formaPagamento === fp.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>
                    <Icon size={28} />
                    <span className="text-sm font-semibold">{fp.label}</span>
                  </button>
                );
              })}
            </div>
            {formaPagamento === 'dinheiro' && (
              <div className="mb-4 space-y-3">
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
              className={`w-full py-3 rounded-xl font-bold text-lg transition cursor-pointer flex items-center justify-center gap-2
                ${formaPagamento ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
              <Check size={20} /> Finalizar Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// MÓDULO 2: CARDÁPIO EDITÁVEL
function CardapioEditavel() {
  const { state, dispatch, addToast } = useContext(AppContext);
  const [modalProduto, setModalProduto] = useState(null);
  const [form, setForm] = useState({ nome: '', emoji: '🍽️', preco: '', categoriaId: '', ativo: true });
  const [novaCategoria, setNovaCategoria] = useState('');
  const [editandoCat, setEditandoCat] = useState(null);
  const [nomeCatEdit, setNomeCatEdit] = useState('');
  const [abaCardapio, setAbaCardapio] = useState('produtos');

  const abrirNovoProduto = () => {
    setForm({ nome: '', emoji: '🍽️', preco: '', categoriaId: state.categorias[0]?.id || '', ativo: true });
    setModalProduto('novo');
  };

  const abrirEditarProduto = (produto) => {
    setForm({ nome: produto.nome, emoji: produto.emoji, preco: String(produto.preco), categoriaId: produto.categoriaId, ativo: produto.ativo });
    setModalProduto(produto);
  };

  const salvarProduto = () => {
    if (!form.nome || !form.preco || !form.categoriaId) { addToast('Preencha todos os campos!', 'aviso'); return; }
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) { addToast('Preço inválido!', 'erro'); return; }
    if (modalProduto === 'novo') {
      dispatch({ type: 'ADICIONAR_PRODUTO', payload: { ...form, preco, estoque: 0, estoqueMinimo: 5, ordem: state.produtos.filter(p => p.categoriaId === form.categoriaId).length } });
      addToast(`Produto "${form.nome}" adicionado!`, 'sucesso');
    } else {
      dispatch({ type: 'EDITAR_PRODUTO', payload: { id: modalProduto.id, ...form, preco } });
      addToast(`Produto "${form.nome}" atualizado!`, 'sucesso');
    }
    setModalProduto(null);
  };

  const adicionarCategoria = () => {
    if (!novaCategoria.trim()) return;
    dispatch({ type: 'ADICIONAR_CATEGORIA', payload: novaCategoria.trim() });
    addToast(`Categoria "${novaCategoria}" criada!`, 'sucesso');
    setNovaCategoria('');
  };

  const salvarCategoriaEdit = () => {
    if (!nomeCatEdit.trim()) return;
    dispatch({ type: 'RENOMEAR_CATEGORIA', payload: { id: editandoCat, nome: nomeCatEdit.trim() } });
    addToast('Categoria renomeada!', 'sucesso');
    setEditandoCat(null);
  };

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-orange-400" /> Cardápio
          </h2>
          <div className="flex gap-2">
            {['produtos', 'categorias'].map(aba => (
              <button key={aba} onClick={() => setAbaCardapio(aba)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize
                  ${abaCardapio === aba ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {aba}
              </button>
            ))}
          </div>
        </div>

        {abaCardapio === 'produtos' ? (
          <>
            <button onClick={abrirNovoProduto}
              className="mb-4 px-4 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-semibold text-sm transition cursor-pointer flex items-center gap-2">
              <Plus size={16} /> Novo Produto
            </button>
            <div className="space-y-2">
              {state.categorias.sort((a, b) => a.ordem - b.ordem).map(cat => {
                const prods = state.produtos.filter(p => p.categoriaId === cat.id).sort((a, b) => a.ordem - b.ordem);
                if (prods.length === 0) return null;
                return (
                  <div key={cat.id} className="mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Tag size={14} /> {cat.nome} ({prods.length})
                    </h3>
                    <div className="space-y-1">
                      {prods.map((produto, idx) => (
                        <div key={produto.id}
                          className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 transition ${!produto.ativo ? 'opacity-50' : ''}`}>
                          <span className="text-2xl">{produto.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{produto.nome}</p>
                            <p className="text-xs text-slate-400">{formatarMoeda(produto.preco)} · Estoque: {produto.estoque}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => dispatch({ type: 'REORDENAR_PRODUTO', payload: { id: produto.id, direcao: 'up' } })} disabled={idx === 0}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 cursor-pointer disabled:opacity-30 transition">
                              <ArrowUp size={14} />
                            </button>
                            <button onClick={() => dispatch({ type: 'REORDENAR_PRODUTO', payload: { id: produto.id, direcao: 'down' } })} disabled={idx === prods.length - 1}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 cursor-pointer disabled:opacity-30 transition">
                              <ArrowDown size={14} />
                            </button>
                            <button onClick={() => dispatch({ type: 'TOGGLE_PRODUTO', payload: produto.id })}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition ${produto.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {produto.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button onClick={() => abrirEditarProduto(produto)}
                              className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center cursor-pointer transition">
                              <Edit size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                placeholder="Nome da nova categoria" onKeyDown={e => e.key === 'Enter' && adicionarCategoria()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              <button onClick={adicionarCategoria}
                className="px-4 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-semibold text-sm cursor-pointer transition flex items-center gap-1">
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {state.categorias.sort((a, b) => a.ordem - b.ordem).map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700/50">
                  {editandoCat === cat.id ? (
                    <>
                      <input type="text" value={nomeCatEdit} onChange={e => setNomeCatEdit(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && salvarCategoriaEdit()}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-orange-500" autoFocus />
                      <button onClick={salvarCategoriaEdit} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={18} /></button>
                      <button onClick={() => setEditandoCat(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <Layers size={16} className="text-orange-400" />
                      <span className="flex-1 text-white font-medium text-sm">{cat.nome}</span>
                      <span className="text-xs text-slate-500">{state.produtos.filter(p => p.categoriaId === cat.id).length} produtos</span>
                      <button onClick={() => { setEditandoCat(cat.id); setNomeCatEdit(cat.nome); }}
                        className="text-blue-400 hover:text-blue-300 cursor-pointer"><Edit size={16} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalProduto(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{modalProduto === 'novo' ? 'Novo Produto' : 'Editar Produto'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Emoji</label>
                <input type="text" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}
                  className="w-16 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-2xl text-center focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome</label>
                <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do produto"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Preço (R$)</label>
                <input type="text" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} placeholder="0,00"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-orange-500 text-sm">
                  <option value="">Selecione...</option>
                  {state.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalProduto(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold text-sm cursor-pointer transition">Cancelar</button>
              <button onClick={salvarProduto}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold text-sm cursor-pointer transition">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MÓDULO 3: CONTROLE DE ESTOQUE
function ControleEstoque() {
  const { state, dispatch, addToast } = useContext(AppContext);
  const [modalEntrada, setModalEntrada] = useState(null);
  const [entradaForm, setEntradaForm] = useState({ quantidade: '', fornecedor: '', data: getHojeStr() });
  const [filtroEstoque, setFiltroEstoque] = useState('todos');
  const [abaEstoque, setAbaEstoque] = useState('lista');

  const alertas = state.produtos.filter(p => p.ativo && p.estoque <= p.estoqueMinimo);

  const produtosFiltrados = state.produtos.filter(p => {
    if (filtroEstoque === 'baixo') return p.estoque <= p.estoqueMinimo && p.estoque > p.estoqueMinimo * 0.25;
    if (filtroEstoque === 'critico') return p.estoque <= p.estoqueMinimo * 0.25;
    if (filtroEstoque === 'ok') return p.estoque > p.estoqueMinimo;
    return true;
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  const darEntrada = () => {
    const qtd = parseInt(entradaForm.quantidade);
    if (isNaN(qtd) || qtd <= 0) { addToast('Quantidade inválida!', 'erro'); return; }
    if (!entradaForm.fornecedor.trim()) { addToast('Informe o fornecedor!', 'aviso'); return; }
    dispatch({ type: 'ENTRADA_ESTOQUE', payload: { produtoId: modalEntrada.id, quantidade: qtd, fornecedor: entradaForm.fornecedor, data: entradaForm.data } });
    addToast(`+${qtd} unidades de ${modalEntrada.nome} adicionadas!`, 'sucesso');
    setModalEntrada(null);
    setEntradaForm({ quantidade: '', fornecedor: '', data: getHojeStr() });
  };

  const getStatusEstoque = (produto) => {
    if (produto.estoque <= produto.estoqueMinimo * 0.25) return { label: 'Crítico', cor: 'text-red-400 bg-red-500/15 border-red-500/30' };
    if (produto.estoque <= produto.estoqueMinimo) return { label: 'Baixo', cor: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' };
    return { label: 'OK', cor: 'text-green-400 bg-green-500/15 border-green-500/30' };
  };

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Warehouse size={24} className="text-orange-400" /> Estoque
          </h2>
          <div className="flex gap-2">
            {['lista', 'historico'].map(aba => (
              <button key={aba} onClick={() => setAbaEstoque(aba)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize
                  ${abaEstoque === aba ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {aba === 'historico' ? 'Histórico' : 'Lista'}
              </button>
            ))}
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm font-bold text-red-400">{alertas.length} produto(s) com estoque baixo!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.map(p => (
                <span key={p.id} className="px-2 py-1 rounded-lg bg-red-900/40 text-red-300 text-xs font-medium">
                  {p.emoji} {p.nome}: {p.estoque}/{p.estoqueMinimo}
                </span>
              ))}
            </div>
          </div>
        )}

        {abaEstoque === 'lista' ? (
          <>
            <div className="flex gap-2 mb-4">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'ok', label: '🟢 OK' },
                { id: 'baixo', label: '🟡 Baixo' },
                { id: 'critico', label: '🔴 Crítico' },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroEstoque(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer
                    ${filtroEstoque === f.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700/50">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left p-3 text-xs text-slate-400 font-semibold uppercase">Produto</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-semibold uppercase">Estoque</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-semibold uppercase">Mínimo</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-semibold uppercase">Status</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-semibold uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map(produto => {
                    const status = getStatusEstoque(produto);
                    const pct = produto.estoqueMinimo > 0 ? Math.min(100, (produto.estoque / (produto.estoqueMinimo * 2)) * 100) : 100;
                    return (
                      <tr key={produto.id} className="border-t border-slate-700/30 hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{produto.emoji}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{produto.nome}</p>
                              <p className="text-xs text-slate-500">{state.categorias.find(c => c.id === produto.categoriaId)?.nome}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-white font-bold text-sm">{produto.estoque}</span>
                          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full transition-all ${pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="p-3 text-center text-sm text-slate-400">{produto.estoqueMinimo}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${status.cor}`}>{status.label}</span>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => { setModalEntrada(produto); setEntradaForm({ quantidade: '', fornecedor: '', data: getHojeStr() }); }}
                            className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs font-semibold cursor-pointer transition flex items-center gap-1 mx-auto">
                            <Plus size={12} /> Entrada
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {state.movimentacoes.sort((a, b) => b.data.localeCompare(a.data)).map(mov => {
              const produto = state.produtos.find(p => p.id === mov.produtoId);
              return (
                <div key={mov.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mov.tipo === 'entrada' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {mov.tipo === 'entrada' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{produto?.emoji} {produto?.nome || 'Desconhecido'}</p>
                    <p className="text-xs text-slate-400">{mov.fornecedor} · {formatarData(mov.data)}</p>
                  </div>
                  <span className={`font-bold text-sm ${mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                  </span>
                </div>
              );
            })}
            {state.movimentacoes.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma movimentação registrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modalEntrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalEntrada(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">Entrada de Estoque</h3>
            <p className="text-sm text-slate-400 mb-4">{modalEntrada.emoji} {modalEntrada.nome} (Atual: {modalEntrada.estoque})</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantidade</label>
                <input type="number" min={1} value={entradaForm.quantidade} onChange={e => setEntradaForm({ ...entradaForm, quantidade: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-orange-500 text-sm" autoFocus />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fornecedor</label>
                <input type="text" value={entradaForm.fornecedor} onChange={e => setEntradaForm({ ...entradaForm, fornecedor: e.target.value })}
                  placeholder="Nome do fornecedor"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Data</label>
                <input type="date" value={entradaForm.data} onChange={e => setEntradaForm({ ...entradaForm, data: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-orange-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalEntrada(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold text-sm cursor-pointer transition">Cancelar</button>
              <button onClick={darEntrada}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold text-sm cursor-pointer transition">Confirmar Entrada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MÓDULO 4: CONTROLE DE CAIXA
function ControleDeCaixa() {
  const { state, dispatch, addToast, confirmar } = useContext(AppContext);
  const [abaCaixa, setAbaCaixa] = useState('resumo');
  const [formAbertura, setFormAbertura] = useState({ operador: '', valorInicial: '' });
  const [formSangria, setFormSangria] = useState({ valor: '', motivo: '' });
  const [formSuprimento, setFormSuprimento] = useState({ valor: '', motivo: '' });

  const turno = state.turnoAtual;

  const abrirTurno = () => {
    if (!formAbertura.operador.trim()) { addToast('Informe o operador!', 'aviso'); return; }
    const val = parseFloat(formAbertura.valorInicial.replace(',', '.')) || 0;
    dispatch({ type: 'ABRIR_TURNO', payload: { operador: formAbertura.operador.trim(), valorInicial: val } });
    addToast(`Turno aberto por ${formAbertura.operador}!`, 'sucesso');
    setFormAbertura({ operador: '', valorInicial: '' });
  };

  const registrarSangria = () => {
    const val = parseFloat(formSangria.valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) { addToast('Valor inválido!', 'erro'); return; }
    if (!formSangria.motivo.trim()) { addToast('Informe o motivo!', 'aviso'); return; }
    dispatch({ type: 'SANGRIA', payload: { valor: val, motivo: formSangria.motivo.trim() } });
    addToast(`Sangria de ${formatarMoeda(val)} registrada!`, 'sucesso');
    setFormSangria({ valor: '', motivo: '' });
  };

  const registrarSuprimento = () => {
    const val = parseFloat(formSuprimento.valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) { addToast('Valor inválido!', 'erro'); return; }
    if (!formSuprimento.motivo.trim()) { addToast('Informe o motivo!', 'aviso'); return; }
    dispatch({ type: 'SUPRIMENTO', payload: { valor: val, motivo: formSuprimento.motivo.trim() } });
    addToast(`Suprimento de ${formatarMoeda(val)} registrado!`, 'sucesso');
    setFormSuprimento({ valor: '', motivo: '' });
  };

  const fecharTurno = async () => {
    const ok = await confirmar('Fechar Turno?', 'Deseja realmente fechar o turno atual?');
    if (!ok) return;
    dispatch({ type: 'FECHAR_TURNO' });
    addToast('Turno fechado com sucesso!', 'sucesso');
  };

  const totalSangrias = turno ? turno.sangrias.reduce((a, s) => a + s.valor, 0) : 0;
  const totalSuprimentos = turno ? turno.suprimentos.reduce((a, s) => a + s.valor, 0) : 0;
  const saldoFinal = turno ? turno.valorInicial + (turno.totalDinheiro || 0) - totalSangrias + totalSuprimentos : 0;
  const vendasDoTurno = turno ? state.vendas.filter(v => turno.vendas.includes(v.id)) : [];
  const vendasPorCategoria = {};
  vendasDoTurno.forEach(v => {
    v.itens.forEach(item => {
      const prod = state.produtos.find(p => p.id === item.produtoId);
      const cat = prod ? state.categorias.find(c => c.id === prod.categoriaId)?.nome || 'Outros' : 'Outros';
      vendasPorCategoria[cat] = (vendasPorCategoria[cat] || 0) + item.preco * item.qtd;
    });
  });
  const ticketMedio = vendasDoTurno.length > 0 ? (turno?.totalVendas || 0) / vendasDoTurno.length : 0;

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Calculator size={24} className="text-orange-400" /> Controle de Caixa
          </h2>
          {turno && (
            <div className="flex gap-2">
              {['resumo', 'sangria', 'historico'].map(aba => (
                <button key={aba} onClick={() => setAbaCaixa(aba)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize
                    ${abaCaixa === aba ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {aba === 'sangria' ? 'Movimentações' : aba === 'historico' ? 'Histórico' : 'Resumo'}
                </button>
              ))}
            </div>
          )}
        </div>

        {!turno ? (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Abrir Turno</h3>
              <p className="text-sm text-slate-400 mb-6">Inicie um novo turno para registrar vendas</p>
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Operador</label>
                  <input type="text" value={formAbertura.operador} onChange={e => setFormAbertura({ ...formAbertura, operador: e.target.value })}
                    placeholder="Nome do operador"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Valor inicial (R$)</label>
                  <input type="text" value={formAbertura.valorInicial} onChange={e => setFormAbertura({ ...formAbertura, valorInicial: e.target.value })}
                    placeholder="200,00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                </div>
              </div>
              <button onClick={abrirTurno}
                className="w-full mt-6 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold text-sm cursor-pointer transition flex items-center justify-center gap-2">
                <Clock size={18} /> Abrir Turno
              </button>
            </div>
            {state.turnos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Turnos Anteriores</h3>
                <div className="space-y-2">
                  {state.turnos.slice().reverse().map(t => (
                    <div key={t.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{t.operador}</span>
                        <span className="text-xs text-slate-500">{formatarDataHora(t.dataAbertura)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-slate-400">Total vendas: <span className="text-white font-bold">{formatarMoeda(t.totalVendas || 0)}</span></div>
                        <div className="text-slate-400">Atendimentos: <span className="text-white font-bold">{t.vendas.length}</span></div>
                        <div className="text-slate-400">Dinheiro: <span className="text-green-400">{formatarMoeda(t.totalDinheiro || 0)}</span></div>
                        <div className="text-slate-400">Crédito: <span className="text-blue-400">{formatarMoeda(t.totalCredito || 0)}</span></div>
                        <div className="text-slate-400">Débito: <span className="text-purple-400">{formatarMoeda(t.totalDebito || 0)}</span></div>
                        <div className="text-slate-400">PIX: <span className="text-cyan-400">{formatarMoeda(t.totalPix || 0)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {abaCaixa === 'resumo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Vendas', valor: turno.totalVendas || 0, cor: 'text-orange-400', icon: TrendingUp },
                    { label: 'Dinheiro', valor: turno.totalDinheiro || 0, cor: 'text-green-400', icon: Banknote },
                    { label: 'Crédito', valor: turno.totalCredito || 0, cor: 'text-blue-400', icon: CreditCard },
                    { label: 'PIX', valor: turno.totalPix || 0, cor: 'text-cyan-400', icon: QrCode },
                  ].map(card => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={16} className={card.cor} />
                          <span className="text-xs text-slate-400">{card.label}</span>
                        </div>
                        <p className={`text-xl font-extrabold ${card.cor}`}>{formatarMoeda(card.valor)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
                    <h4 className="font-bold text-white mb-3">Resumo do Turno</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Operador</span><span className="text-white font-medium">{turno.operador}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Abertura</span><span className="text-white">{formatarDataHora(turno.dataAbertura)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Valor Inicial</span><span className="text-white">{formatarMoeda(turno.valorInicial)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Sangrias</span><span className="text-red-400">-{formatarMoeda(totalSangrias)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Suprimentos</span><span className="text-green-400">+{formatarMoeda(totalSuprimentos)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Débito</span><span className="text-purple-400">{formatarMoeda(turno.totalDebito || 0)}</span></div>
                      <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-300 font-bold">Saldo em Caixa</span><span className="text-orange-400 font-extrabold">{formatarMoeda(saldoFinal)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Atendimentos</span><span className="text-white font-bold">{vendasDoTurno.length}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Ticket Médio</span><span className="text-white font-bold">{formatarMoeda(ticketMedio)}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
                    <h4 className="font-bold text-white mb-3">Vendas por Categoria</h4>
                    {Object.keys(vendasPorCategoria).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(vendasPorCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                          <div key={cat} className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 w-24 truncate">{cat}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div className="h-2 rounded-full bg-orange-500" style={{ width: `${(val / (turno.totalVendas || 1)) * 100}%` }} />
                            </div>
                            <span className="text-sm text-white font-bold w-24 text-right">{formatarMoeda(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">Nenhuma venda neste turno</p>}
                  </div>
                </div>
                <button onClick={fecharTurno}
                  className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 font-bold text-sm cursor-pointer transition flex items-center justify-center gap-2">
                  <LogOut size={18} /> Fechar Turno
                </button>
              </div>
            )}
            {abaCaixa === 'sangria' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2"><ArrowUpCircle size={18} className="text-red-400" /> Sangria (Retirada)</h4>
                  <div className="flex gap-2">
                    <input type="text" value={formSangria.valor} onChange={e => setFormSangria({ ...formSangria, valor: e.target.value })}
                      placeholder="Valor" className="w-28 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                    <input type="text" value={formSangria.motivo} onChange={e => setFormSangria({ ...formSangria, motivo: e.target.value })}
                      placeholder="Motivo" className="flex-1 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                    <button onClick={registrarSangria} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold text-sm cursor-pointer transition">Registrar</button>
                  </div>
                  {turno.sangrias.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {turno.sangrias.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-slate-700/50">
                          <span className="text-slate-400">{s.motivo}</span>
                          <span className="text-red-400 font-bold">-{formatarMoeda(s.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2"><ArrowDownCircle size={18} className="text-green-400" /> Suprimento (Reforço)</h4>
                  <div className="flex gap-2">
                    <input type="text" value={formSuprimento.valor} onChange={e => setFormSuprimento({ ...formSuprimento, valor: e.target.value })}
                      placeholder="Valor" className="w-28 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                    <input type="text" value={formSuprimento.motivo} onChange={e => setFormSuprimento({ ...formSuprimento, motivo: e.target.value })}
                      placeholder="Motivo" className="flex-1 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm" />
                    <button onClick={registrarSuprimento} className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 font-semibold text-sm cursor-pointer transition">Registrar</button>
                  </div>
                  {turno.suprimentos.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {turno.suprimentos.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-slate-700/50">
                          <span className="text-slate-400">{s.motivo}</span>
                          <span className="text-green-400 font-bold">+{formatarMoeda(s.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {abaCaixa === 'historico' && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white mb-3">Turnos Anteriores</h3>
                {state.turnos.slice().reverse().map(t => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{t.operador}</span>
                      <span className="text-xs text-slate-500">{formatarDataHora(t.dataAbertura)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-slate-400">Total: <span className="text-orange-400 font-bold">{formatarMoeda(t.totalVendas || 0)}</span></div>
                      <div className="text-slate-400">Atendimentos: <span className="text-white font-bold">{t.vendas.length}</span></div>
                      <div className="text-slate-400">Ticket Médio: <span className="text-white font-bold">{formatarMoeda(t.vendas.length > 0 ? (t.totalVendas || 0) / t.vendas.length : 0)}</span></div>
                    </div>
                  </div>
                ))}
                {state.turnos.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Nenhum turno anterior</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// MÓDULO 5: RELATÓRIOS
function Relatorios() {
  const { state } = useContext(AppContext);
  const [filtroData, setFiltroData] = useState('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [abaRelatorio, setAbaRelatorio] = useState('vendas');

  const hojeStr = getHojeStr();
  const getDatasFiltro = () => {
    const hoje = new Date();
    if (filtroData === 'hoje') return { inicio: hojeStr, fim: hojeStr };
    if (filtroData === 'semana') {
      const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - 7);
      return { inicio: inicio.toISOString().slice(0, 10), fim: hojeStr };
    }
    if (filtroData === 'mes') {
      const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - 30);
      return { inicio: inicio.toISOString().slice(0, 10), fim: hojeStr };
    }
    return { inicio: dataInicio || '2020-01-01', fim: dataFim || hojeStr };
  };

  const { inicio, fim } = getDatasFiltro();
  const vendasFiltradas = state.vendas.filter(v => v.data >= inicio && v.data <= fim).sort((a, b) => b.data.localeCompare(a.data));

  const totalPeriodo = vendasFiltradas.reduce((a, v) => a + v.total, 0);
  const totalDinheiro = vendasFiltradas.filter(v => v.formaPagamento === 'dinheiro').reduce((a, v) => a + v.total, 0);
  const totalCredito = vendasFiltradas.filter(v => v.formaPagamento === 'credito').reduce((a, v) => a + v.total, 0);
  const totalDebito = vendasFiltradas.filter(v => v.formaPagamento === 'debito').reduce((a, v) => a + v.total, 0);
  const totalPix = vendasFiltradas.filter(v => v.formaPagamento === 'pix').reduce((a, v) => a + v.total, 0);
  const ticketMedio = vendasFiltradas.length > 0 ? totalPeriodo / vendasFiltradas.length : 0;

  const contaProdutos = {};
  vendasFiltradas.forEach(v => v.itens.forEach(i => { contaProdutos[i.nome] = (contaProdutos[i.nome] || 0) + i.qtd; }));
  const maisVendido = Object.entries(contaProdutos).sort((a, b) => b[1] - a[1])[0];

  const faturamentoPorDia = {};
  vendasFiltradas.forEach(v => { faturamentoPorDia[v.data] = (faturamentoPorDia[v.data] || 0) + v.total; });
  const diasOrdenados = Object.entries(faturamentoPorDia).sort((a, b) => a[0].localeCompare(b[0]));
  const maxFaturamento = Math.max(...diasOrdenados.map(d => d[1]), 1);

  const formaLabel = { dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', pix: 'PIX' };
  const formaCor = { dinheiro: 'bg-green-500', credito: 'bg-blue-500', debito: 'bg-purple-500', pix: 'bg-cyan-500' };

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-orange-400" /> Relatórios
          </h2>
          <div className="flex gap-2 items-center flex-wrap">
            {['hoje', 'semana', 'mes', 'custom'].map(f => (
              <button key={f} onClick={() => setFiltroData(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer
                  ${filtroData === f ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                {f === 'custom' ? 'Período' : f === 'mes' ? 'Mês' : f === 'hoje' ? 'Hoje' : 'Semana'}
              </button>
            ))}
            {filtroData === 'custom' && (
              <div className="flex gap-2 items-center">
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs" />
                <span className="text-slate-500 text-xs">até</span>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs" />
              </div>
            )}
            <button onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs">
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {['vendas', 'grafico', 'resumo'].map(aba => (
            <button key={aba} onClick={() => setAbaRelatorio(aba)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer capitalize
                ${abaRelatorio === aba ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {aba === 'grafico' ? 'Gráfico' : aba === 'vendas' ? 'Vendas' : 'Resumo'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Faturamento', valor: formatarMoeda(totalPeriodo), cor: 'text-orange-400' },
            { label: 'Vendas', valor: vendasFiltradas.length, cor: 'text-white' },
            { label: 'Ticket Médio', valor: formatarMoeda(ticketMedio), cor: 'text-cyan-400' },
            { label: 'Mais Vendido', valor: maisVendido ? `${maisVendido[0]} (${maisVendido[1]}x)` : '-', cor: 'text-yellow-400' },
            { label: 'Período', valor: `${formatarData(inicio)} - ${formatarData(fim)}`, cor: 'text-slate-300' },
          ].map(card => (
            <div key={card.label} className="bg-slate-800 rounded-xl border border-slate-700/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-sm font-extrabold ${card.cor} truncate`}>{card.valor}</p>
            </div>
          ))}
        </div>

        {abaRelatorio === 'vendas' && (
          <div className="space-y-2">
            {vendasFiltradas.map(venda => (
              <div key={venda.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-orange-400" />
                    <span className="text-sm font-bold text-white">{formatarMoeda(venda.total)}</span>
                    {venda.desconto > 0 && <span className="text-xs text-green-400">-{venda.desconto}%</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${formaCor[venda.formaPagamento]} text-white`}>
                      {formaLabel[venda.formaPagamento]}
                    </span>
                    <span className="text-xs text-slate-500">{formatarData(venda.data)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {venda.itens.map((item, i) => (
                    <span key={i} className="text-xs bg-slate-700/50 px-2 py-1 rounded-lg text-slate-300">{item.qtd}x {item.nome}</span>
                  ))}
                </div>
                <div className="mt-1 text-xs text-slate-500">Operador: {venda.operador}</div>
              </div>
            ))}
            {vendasFiltradas.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma venda encontrada no período</p>
              </div>
            )}
          </div>
        )}

        {abaRelatorio === 'grafico' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
            <h4 className="font-bold text-white mb-4">Faturamento por Dia</h4>
            {diasOrdenados.length > 0 ? (
              <div className="flex items-end gap-2 h-64 overflow-x-auto pb-2">
                {diasOrdenados.map(([dia, valor]) => (
                  <div key={dia} className="flex flex-col items-center gap-1 min-w-[48px] flex-1">
                    <span className="text-[10px] text-orange-400 font-bold">{formatarMoeda(valor)}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div className="w-full max-w-[40px] rounded-t-lg bg-orange-500 hover:bg-orange-400 cursor-pointer"
                        style={{ height: `${(valor / maxFaturamento) * 100}%`, minHeight: '4px' }}
                        title={`${formatarData(dia)}: ${formatarMoeda(valor)}`} />
                    </div>
                    <span className="text-[10px] text-slate-500">{formatarData(dia).slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500 text-center py-8">Sem dados para o período</p>}
          </div>
        )}

        {abaRelatorio === 'resumo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
              <h4 className="font-bold text-white mb-4">Por Forma de Pagamento</h4>
              <div className="space-y-3">
                {[
                  { label: 'Dinheiro', valor: totalDinheiro, cor: 'bg-green-500', corTexto: 'text-green-400' },
                  { label: 'Crédito', valor: totalCredito, cor: 'bg-blue-500', corTexto: 'text-blue-400' },
                  { label: 'Débito', valor: totalDebito, cor: 'bg-purple-500', corTexto: 'text-purple-400' },
                  { label: 'PIX', valor: totalPix, cor: 'bg-cyan-500', corTexto: 'text-cyan-400' },
                ].map(fp => (
                  <div key={fp.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{fp.label}</span>
                      <span className={`font-bold ${fp.corTexto}`}>{formatarMoeda(fp.valor)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${fp.cor}`} style={{ width: `${totalPeriodo > 0 ? (fp.valor / totalPeriodo) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
              <h4 className="font-bold text-white mb-4">Produtos Mais Vendidos</h4>
              <div className="space-y-2">
                {Object.entries(contaProdutos).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nome, qtd], i) => (
                  <div key={nome} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-yellow-500 text-yellow-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-orange-700 text-orange-100' : 'bg-slate-700 text-slate-400'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-white flex-1">{nome}</span>
                    <span className="text-sm font-bold text-orange-400">{qtd}x</span>
                  </div>
                ))}
                {Object.keys(contaProdutos).length === 0 && <p className="text-sm text-slate-500">Sem dados para o período</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// APP PRINCIPAL
export default function App() {
  const [state, dispatch] = useReducer(reducer, null, carregarEstado);
  const [pagina, setPagina] = useState('pdv');
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmacao, setConfirmacao] = useState(null);
  const resolverConfirmacao = useRef(null);

  useEffect(() => {
    localStorage.setItem('pdv_estado', JSON.stringify(state));
  }, [state]);

  const addToast = useCallback((mensagem, tipo = 'info') => {
    const id = gerarId();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirmar = useCallback((titulo, mensagem) => {
    return new Promise(resolve => {
      resolverConfirmacao.current = resolve;
      setConfirmacao({ titulo, mensagem });
    });
  }, []);

  const handleConfirmar = () => { resolverConfirmacao.current?.(true); setConfirmacao(null); };
  const handleCancelar = () => { resolverConfirmacao.current?.(false); setConfirmacao(null); };

  const totalVendasHoje = state.vendas.filter(v => v.data === getHojeStr()).reduce((a, v) => a + v.total, 0);
  const contextValue = { state, dispatch, addToast, confirmar };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-screen flex bg-slate-950 overflow-hidden">
        <Sidebar paginaAtual={pagina} setPagina={setPagina} sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarAberta ? 'ml-56' : 'ml-16'}`}>
          <Topbar turnoAtual={state.turnoAtual} totalVendasHoje={totalVendasHoje} />
          <main className="flex-1 overflow-hidden">
            {pagina === 'pdv' && <FrenteDeCaixa />}
            {pagina === 'cardapio' && <CardapioEditavel />}
            {pagina === 'estoque' && <ControleEstoque />}
            {pagina === 'caixa' && <ControleDeCaixa />}
            {pagina === 'relatorios' && <Relatorios />}
          </main>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <ModalConfirmacao aberto={!!confirmacao} titulo={confirmacao?.titulo || ''} mensagem={confirmacao?.mensagem || ''} onConfirmar={handleConfirmar} onCancelar={handleCancelar} />
      </div>
    </AppContext.Provider>
  );
}
