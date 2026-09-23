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
  UserCheck,
  User as UserIcon,
  SlidersHorizontal,
  Clock,
  Lock,
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

        const techList = userList.filter((u) => u.role === 'TECHNICIAN');
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
    setTimeout(() => setFeedbackMessage(null), 3500);
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
    } catch (err: unknown) {
      console.error('Erro ao criar chamado:', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Erro ao criar o chamado. Verifique os dados.';
      showNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: number, status: Status) => {
    if (selectedTicket?.status === 'CLOSED') {
      showNotification('Não é permitido alterar o status de um chamado já fechado.', 'error');
      return;
    }
    try {
      await ticketService.updateStatus(ticketId, status);
      showNotification(`Status do chamado #${ticketId} alterado para ${status}.`);
      setReloadKey((k) => k + 1);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: unknown) {
      console.error('Erro ao mudar status:', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Não foi possível alterar o status.';
      showNotification(msg, 'error');
    }
  };

  const handleAssign = async (ticketId: number, technicianId: number) => {
    if (selectedTicket?.status === 'CLOSED') {
      showNotification('Não é permitido atribuir técnico a um chamado já encerrado.', 'error');
      return;
    }
    if (selectedTicket?.customerId === technicianId) {
      showNotification('Um técnico não pode ser atribuído ao seu próprio chamado.', 'error');
      return;
    }
    try {
      await ticketService.assignTechnician(ticketId, technicianId);
      const targetTech = technicians.find((t) => t.id === technicianId);
      showNotification(
        `Chamado #${ticketId} atribuído a ${targetTech?.name || 'técnico'}.`
      );
      setReloadKey((k) => k + 1);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, technicianId, status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status } : null
        );
      }
    } catch (err: unknown) {
      console.error('Erro ao atribuir técnico:', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Não foi possível atribuir o técnico.';
      showNotification(msg, 'error');
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={11} /> Cancelado
        </span>
      );
    }
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Aberto
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Em Atendimento
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Pendente
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolvido
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Fechado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Crítico
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Média
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Baixa
          </span>
        );
    }
  };

  const getTicketBorderClass = (status: Status, enabled?: boolean) => {
    if (enabled === false) return 'border-l-3 border-l-rose-400 bg-rose-50/15';
    switch (status) {
      case 'OPEN':
        return 'border-l-3 border-l-blue-500';
      case 'IN_PROGRESS':
        return 'border-l-3 border-l-amber-500';
      case 'WAITING':
        return 'border-l-3 border-l-purple-500';
      case 'RESOLVED':
        return 'border-l-3 border-l-emerald-500';
      case 'CLOSED':
        return 'border-l-3 border-l-slate-400';
      default:
        return 'border-l-3 border-l-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Central de Chamados</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie, filtre e acompanhe todas as solicitações de suporte
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition text-sm"
        >
          <Plus size={16} /> Novo Chamado
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-sm font-medium flex items-center gap-2 border transition ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold uppercase tracking-wider">
          <SlidersHorizontal size={13} className="text-blue-600" />
          <span>Filtros de Pesquisa</span>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            user?.role === 'ADMIN'
              ? 'lg:grid-cols-7'
              : user?.role === 'TECHNICIAN'
              ? 'lg:grid-cols-5'
              : 'lg:grid-cols-6'
          } gap-2.5`}
        >
          {/* Campo de Busca Unificada */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={user?.role === 'CLIENT' ? "Pesquisar título ou técnico..." : "Pesquisar título, cliente ou técnico..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todos os Status</option>
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em Atendimento</option>
            <option value="WAITING">Pendente</option>
            <option value="RESOLVED">Resolvido</option>
            <option value="CLOSED">Fechado</option>
          </select>

          {/* Filtro Prioridade */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todas as Prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>

          {/* Filtro Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="">Todas as Categorias</option>
            <option value="SOFTWARE">Software</option>
            <option value="HARDWARE">Hardware</option>
            <option value="NETWORK">Rede</option>
          </select>

          {/* Filtro Técnico (Admin e Cliente) */}
          {user?.role !== 'TECHNICIAN' && (
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="">Qualquer Técnico</option>
              <option value="unassigned">Sem Técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {/* Filtro Situação (Apenas ADMIN) */}
          {user?.role === 'ADMIN' && (
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value as 'ativados' | 'desativados' | 'todos')}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="ativados">Ativos</option>
              <option value="desativados">Cancelados</option>
              <option value="todos">Todos</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabela de Chamados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Título & Descrição</th>
                {user?.role !== 'CLIENT' && <th className="px-4 py-3">Cliente</th>}
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={user?.role === 'CLIENT' ? 6 : 7} className="px-4 py-8 text-center text-slate-400">
                    Carregando chamados...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'CLIENT' ? 6 : 7} className="px-4 py-8 text-center text-slate-400">
                    Nenhum chamado encontrado.
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
                      className={`hover:bg-slate-50/70 transition cursor-pointer ${borderClass}`}
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        #{t.id}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 text-sm">{t.title}</div>
                        <div className="text-slate-500 text-xs truncate mt-0.5">{t.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {t.category} • {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {user?.role !== 'CLIENT' && (
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
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
                      )}

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {technician ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {technician.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{technician.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200 inline-flex items-center gap-1">
                            <Clock size={11} /> Não atribuído
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">{getPriorityBadge(t.priority)}</td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(t.status, t.ticketEnabled)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                        >
                          Ver
                        </button>

                        {user?.role === 'ADMIN' && t.ticketEnabled !== false && t.status !== 'CLOSED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelModalTicket(t);
                            }}
                            className="px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition"
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
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Novo Chamado
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  placeholder="Ex: Falha ao inicializar serviço de impressão (mínimo 5 caracteres)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={3}
                  placeholder="Descreva a ocorrência detalhadamente (mínimo 10 caracteres)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="HARDWARE">Hardware</option>
                    <option value="NETWORK">Rede</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-lg space-y-4 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-xs font-bold text-blue-600">CHAMADO #{selectedTicket.id}</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedTicket.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</p>
              <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Solicitante:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {usersMap[selectedTicket.customerId]?.name || `Cliente #${selectedTicket.customerId}`}
                </p>
                <p className="text-slate-400 text-[10px]">{usersMap[selectedTicket.customerId]?.email}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Técnico:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedTicket.technicianId
                    ? usersMap[selectedTicket.technicianId]?.name || `Técnico #${selectedTicket.technicianId}`
                    : 'Não atribuído'}
                </p>
                <p className="text-slate-400 text-[10px]">
                  {selectedTicket.technicianId ? usersMap[selectedTicket.technicianId]?.email : 'Pendente'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Categoria:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedTicket.category}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Prioridade:</span>
                <div className="mt-0.5">{getPriorityBadge(selectedTicket.priority)}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Data de Abertura:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Situação:</span>
                <div className="mt-0.5">{getStatusBadge(selectedTicket.status, selectedTicket.ticketEnabled)}</div>
              </div>
            </div>

            {/* Ações de Gestão de Técnico e Status */}
            {selectedTicket.ticketEnabled !== false &&
              (user?.role === 'ADMIN' ||
                (user?.role === 'TECHNICIAN' && selectedTicket.technicianId === user?.id)) && (
              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <h3 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  Atualizar Atendimento
                </h3>

                {selectedTicket.status === 'CLOSED' ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 text-xs text-slate-600">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                      <Lock size={14} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">Chamado Fechado</span>
                      <span className="text-[11px] text-slate-500">
                        Este chamado foi encerrado definitivamente e não permite novas alterações de status ou técnico.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`grid ${user?.role === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Status)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="OPEN">Aberto</option>
                        <option value="IN_PROGRESS">Em Atendimento</option>
                        <option value="WAITING">Pendente</option>
                        <option value="RESOLVED">Resolvido</option>
                        <option value="CLOSED">Fechado</option>
                      </select>
                    </div>

                    {user?.role === 'ADMIN' && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Atribuir Técnico</label>
                        <select
                          value={selectedTicket.technicianId || ''}
                          onChange={(e) => handleAssign(selectedTicket.id, Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Não atribuído</option>
                          {technicians.map((tech) => {
                            const isRequester = tech.id === selectedTicket.customerId;
                            return (
                              <option key={tech.id} value={tech.id} disabled={isRequester}>
                                {tech.name} {isRequester ? '(Solicitante do chamado)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {user?.role === 'ADMIN' && selectedTicket.ticketEnabled !== false && selectedTicket.status !== 'CLOSED' ? (
                <button
                  onClick={() => setCancelModalTicket(selectedTicket)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-medium transition"
                >
                  Cancelar Chamado
                </button>
              ) : selectedTicket.ticketEnabled === false ? (
                <span className="text-xs text-rose-600 font-medium italic">
                  Chamado cancelado no sistema.
                </span>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {cancelModalTicket && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-slate-200 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Cancelar Chamado</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente cancelar o chamado <strong>#{cancelModalTicket.id}</strong>? Ele será marcado como inativo no sistema.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCancelModalTicket(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};