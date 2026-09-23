import React, { useEffect, useState } from 'react';
import { ticketService } from '../api/ticketService';
import { userService } from '../api/userService';
import type { Ticket, Status, Priority, Category, User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  User as UserIcon,
  SlidersHorizontal,
} from 'lucide-react';

export const TicketList: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, User>>({});
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('');
  const [enabledFilter, setEnabledFilter] = useState<'ativados' | 'desativados' | 'todos'>('ativados');

  // Modais e Feedback
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [cancelModalTicket, setCancelModalTicket] = useState<Ticket | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulário de Criação
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('SOFTWARE');
  const [newPriority, setNewPriority] = useState<Priority>('LOW');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [ticketList, userList] = await Promise.all([
          ticketService.getAll({ enabledFilter }),
          userService.getAll().catch(() => [] as User[]),
        ]);
        if (!isMounted) return;
        setTickets(ticketList);

        const map: Record<number, User> = {};
        userList.forEach((u) => {
          map[u.id] = u;
        });
        setUsersMap(map);

        const techList = userList.filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN');
        setTechnicians(techList);
      } catch (err) {
        console.error('Erro ao carregar chamados:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [enabledFilter, reloadKey]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await ticketService.create({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        priority: newPriority,
        customerId: user.id,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      showNotification('Chamado criado com sucesso!');
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Erro ao criar chamado:', err);
      showNotification('Erro ao criar o chamado. Verifique os dados.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: number, status: Status) => {
    try {
      await ticketService.updateStatus(ticketId, status);
      showNotification(`Status do chamado #${ticketId} alterado para ${status}.`);
      setReloadKey((k) => k + 1);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error('Erro ao mudar status:', err);
      showNotification('Não foi possível alterar o status.', 'error');
    }
  };

  const handleAssign = async (ticketId: number, technicianId: number) => {
    try {
      await ticketService.assignTechnician(ticketId, technicianId);
      const targetTech = technicians.find((t) => t.id === technicianId);
      showNotification(
        `Chamado #${ticketId} atribuído a ${targetTech?.name || 'técnico'}.`
      );
      setReloadKey((k) => k + 1);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, technicianId, status: 'IN_PROGRESS' } : null
        );
      }
    } catch (err) {
      console.error('Erro ao atribuir técnico:', err);
      showNotification('Não foi possível atribuir o técnico.', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalTicket) return;
    try {
      await ticketService.cancel(cancelModalTicket.id);
      showNotification(`Chamado #${cancelModalTicket.id} cancelado com sucesso.`);
      setCancelModalTicket(null);
      if (selectedTicket?.id === cancelModalTicket.id) {
        setSelectedTicket(null);
      }
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Erro ao cancelar chamado:', err);
      showNotification('Não foi possível cancelar o chamado.', 'error');
    }
  };

  // Filtragem avançada com pesquisa por título, descrição, cliente e técnico
  const filteredTickets = tickets.filter((t) => {
    const term = searchTerm.toLowerCase();
    const customer = usersMap[t.customerId]?.name?.toLowerCase() || '';
    const technician = t.technicianId ? usersMap[t.technicianId]?.name?.toLowerCase() || '' : '';
    const title = t.title.toLowerCase();
    const desc = t.description.toLowerCase();

    const matchesSearch =
      title.includes(term) ||
      desc.includes(term) ||
      customer.includes(term) ||
      technician.includes(term);

    const matchesStatus = !selectedStatus || t.status === selectedStatus;
    const matchesPriority = !selectedPriority || t.priority === selectedPriority;
    const matchesCategory = !selectedCategory || t.category === selectedCategory;

    const matchesTech =
      !selectedTechFilter ||
      (selectedTechFilter === 'unassigned' && !t.technicianId) ||
      (t.technicianId !== undefined && t.technicianId !== null && t.technicianId === Number(selectedTechFilter));

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTech;
  });

  const getStatusBadge = (status: Status, enabled?: boolean) => {
    if (enabled === false) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <XCircle size={12} /> CANCELADO
        </span>
      );
    }
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            ABERTO
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            EM ATENDIMENTO
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            PENDENTE
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            RESOLVIDO
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            FECHADO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            CRÍTICO
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            ALTA
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            MÉDIA
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            BAIXA
          </span>
        );
    }
  };

  // Cores de destaque na borda do chamado
  const getTicketBorderClass = (status: Status, enabled?: boolean) => {
    if (enabled === false) return 'border-l-4 border-l-rose-400 bg-rose-50/20';
    switch (status) {
      case 'OPEN':
        return 'border-l-4 border-l-blue-500';
      case 'IN_PROGRESS':
        return 'border-l-4 border-l-amber-500';
      case 'WAITING':
        return 'border-l-4 border-l-purple-500';
      case 'RESOLVED':
        return 'border-l-4 border-l-emerald-500';
      case 'CLOSED':
        return 'border-l-4 border-l-slate-400';
      default:
        return 'border-l-4 border-l-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Central de Chamados</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie, filtre e acompanhe todas as solicitações de suporte em tempo real
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition"
        >
          <Plus size={18} /> Novo Chamado
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs border transition ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-blue-600" />
          <span>Filtros e Busca Avançada</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Campo de Busca Unificada */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Pesquisar título, descrição, cliente ou técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todos os Status</option>
            <option value="OPEN">ABERTO</option>
            <option value="IN_PROGRESS">EM ATENDIMENTO</option>
            <option value="WAITING">PENDENTE</option>
            <option value="RESOLVED">RESOLVIDO</option>
            <option value="CLOSED">FECHADO</option>
          </select>

          {/* Filtro Prioridade */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todas as Prioridades</option>
            <option value="LOW">BAIXA</option>
            <option value="MEDIUM">MÉDIA</option>
            <option value="HIGH">ALTA</option>
            <option value="CRITICAL">CRÍTICA</option>
          </select>

          {/* Filtro Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todas as Categorias</option>
            <option value="SOFTWARE">SOFTWARE</option>
            <option value="HARDWARE">HARDWARE</option>
            <option value="NETWORK">REDE</option>
          </select>

          {/* Filtro Técnico */}
          <select
            value={selectedTechFilter}
            onChange={(e) => setSelectedTechFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Qualquer Técnico</option>
            <option value="unassigned">Sem Técnico Atribuído</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Filtro Situação (Ativos vs Cancelados) */}
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value as 'ativados' | 'desativados' | 'todos')}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="ativados">Chamados Ativos</option>
            <option value="desativados">Chamados Cancelados</option>
            <option value="todos">Todos (Ativos + Cancelados)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Chamados Estilizada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Título & Descrição</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Técnico Responsável</th>
                <th className="px-5 py-3.5">Prioridade</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Carregando chamados...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const customer = usersMap[t.customerId];
                  const technician = t.technicianId ? usersMap[t.technicianId] : null;
                  const borderClass = getTicketBorderClass(t.status, t.ticketEnabled);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${borderClass}`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                        #{t.id}
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-slate-900 text-sm">{t.title}</div>
                        <div className="text-slate-500 text-xs truncate mt-0.5">{t.description}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          {t.category} • Criado em {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            <UserIcon size={12} />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 block">
                              {customer?.name || `ID #${t.customerId}`}
                            </span>
                            <span className="text-[10px] text-slate-400">{customer?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {technician ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {technician.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-blue-900">{technician.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                            <Clock size={11} /> Não atribuído
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">{getPriorityBadge(t.priority)}</td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(t.status, t.ticketEnabled)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          Detalhes
                        </button>

                        {t.ticketEnabled !== false && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelModalTicket(t);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Cancelar Chamado"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Novo Chamado de Suporte
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Chamado
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Falha ao inicializar serviço de impressão"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Problema
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva detalhadamente a situação e o comportamento observado..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="NETWORK">REDE (NETWORK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="LOW">BAIXA</option>
                    <option value="MEDIUM">MÉDIA</option>
                    <option value="HIGH">ALTA</option>
                    <option value="CRITICAL">CRÍTICA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes e Ações */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600">CHAMADO #{selectedTicket.id}</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedTicket.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</p>
              <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Solicitante:</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {usersMap[selectedTicket.customerId]?.name || `Cliente #${selectedTicket.customerId}`}
                </p>
                <p className="text-slate-500 text-[10px]">{usersMap[selectedTicket.customerId]?.email}</p>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Técnico Atribuído:</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedTicket.technicianId
                    ? usersMap[selectedTicket.technicianId]?.name || `Técnico #${selectedTicket.technicianId}`
                    : 'Não atribuído'}
                </p>
                <p className="text-slate-500 text-[10px]">
                  {selectedTicket.technicianId ? usersMap[selectedTicket.technicianId]?.email : 'Aguardando atribuição'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Categoria:</span>
                <p className="font-semibold text-slate-800">{selectedTicket.category}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Prioridade:</span>
                <div className="mt-0.5">{getPriorityBadge(selectedTicket.priority)}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Data de Abertura:</span>
                <p className="font-semibold text-slate-800">
                  {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Situação:</span>
                <div className="mt-0.5">{getStatusBadge(selectedTicket.status, selectedTicket.ticketEnabled)}</div>
              </div>
            </div>

            {/* Ações de Gestão de Técnico e Status */}
            {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && selectedTicket.ticketEnabled !== false && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  Gerenciamento do Atendimento
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alterar Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Status)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="OPEN">ABERTO</option>
                      <option value="IN_PROGRESS">EM ATENDIMENTO</option>
                      <option value="WAITING">PENDENTE</option>
                      <option value="RESOLVED">RESOLVIDO</option>
                      <option value="CLOSED">FECHADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atribuir Técnico</label>
                    <select
                      value={selectedTicket.technicianId || ''}
                      onChange={(e) => handleAssign(selectedTicket.id, Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Não atribuído</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {selectedTicket.ticketEnabled !== false ? (
                <button
                  onClick={() => setCancelModalTicket(selectedTicket)}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar Chamado
                </button>
              ) : (
                <span className="text-xs text-rose-600 font-medium italic">
                  Este chamado está cancelado no sistema.
                </span>
              )}

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {cancelModalTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancelar Chamado</h3>
                <p className="text-xs text-slate-500">Confirmação de desativação lógica</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja cancelar o chamado <strong>#{cancelModalTicket.id} - "{cancelModalTicket.title}"</strong>?
              O chamado será desativado no sistema.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCancelModalTicket(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Sim, Cancelar Chamado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};