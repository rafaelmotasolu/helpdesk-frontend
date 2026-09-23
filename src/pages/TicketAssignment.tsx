import React, { useEffect, useState } from 'react';
import { ticketService } from '../api/ticketService';
import { userService } from '../api/userService';
import type { Ticket, User, Priority, Status } from '../types';
import {
  UserCheck,
  Search,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
} from 'lucide-react';

export const TicketAssignment: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, User>>({});
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'UNASSIGNED' | 'ALL'>('UNASSIGNED');
  const [loading, setLoading] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [assigningTicketId, setAssigningTicketId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [ticketList, userList] = await Promise.all([
          ticketService.getAll(),
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

        setSelectedTechId((prev) => {
          if (prev) return prev;
          return techList.length > 0 ? techList[0].id : null;
        });
      } catch (err) {
        console.error('Erro ao carregar dados de atribuição:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleAssign = async (ticketId: number, techId: number) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (targetTicket?.status === 'CLOSED') {
      alert('Não é permitido atribuir técnico a um chamado já encerrado.');
      return;
    }
    if (targetTicket?.customerId === techId) {
      alert('Um técnico não pode ser atribuído ao seu próprio chamado.');
      return;
    }
    setAssigningTicketId(ticketId);
    try {
      await ticketService.assignTechnician(ticketId, techId);
      const targetTech = technicians.find((t) => t.id === techId);
      setActionSuccessMessage(
        `Chamado #${ticketId} atribuído com sucesso para ${targetTech?.name || 'técnico'}!`
      );
      setTimeout(() => setActionSuccessMessage(null), 3500);
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      console.error('Erro ao atribuir técnico:', err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Não foi possível atribuir o técnico. Tente novamente.');
    } finally {
      setAssigningTicketId(null);
    }
  };

  const getTechWorkload = (techId: number) => {
    return tickets.filter(
      (t) => t.technicianId === techId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING')
    ).length;
  };

  const selectedTech = technicians.find((t) => t.id === selectedTechId);

  const filteredTickets = tickets.filter((t) => {
    if (t.ticketEnabled === false) return false;
    if (t.status === 'CLOSED') return false;
    if (filterMode === 'UNASSIGNED' && t.technicianId) return false;

    const customer = usersMap[t.customerId]?.name?.toLowerCase() || '';
    const tech = t.technicianId ? usersMap[t.technicianId]?.name?.toLowerCase() || '' : '';
    const title = t.title.toLowerCase();
    const desc = t.description.toLowerCase();
    const term = searchTerm.toLowerCase();

    return title.includes(term) || desc.includes(term) || customer.includes(term) || tech.includes(term);
  });

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

  const getStatusBadge = (status: Status) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
          <Briefcase size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Operações</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Atribuição de Técnicos</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Selecione um técnico da equipe para associá-lo aos chamados pendentes.
        </p>
      </div>

      {/* Feedback Toast */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2 shadow-xs transition">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* SEÇÃO 1: LISTAGEM DE TÉCNICOS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Técnicos Disponíveis
            </h2>
            <p className="text-xs text-slate-500">
              Clique em um técnico para definir como o destino padrão
            </p>
          </div>
          {selectedTech && (
            <div className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium flex items-center gap-1.5">
              <Check size={13} className="text-blue-600" />
              Selecionado: <strong>{selectedTech.name}</strong>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500">Carregando técnicos...</div>
        ) : technicians.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">Nenhum técnico cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {technicians.map((tech) => {
              const isSelected = selectedTechId === tech.id;
              const workload = getTechWorkload(tech.id);
              const initial = tech.name ? tech.name.charAt(0).toUpperCase() : 'T';

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-slate-900 truncate">{tech.name}</p>
                      <p className="text-xs text-slate-400 truncate">{tech.email}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded uppercase mt-0.5 inline-block bg-blue-50 text-blue-700">
                        Técnico
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Chamados ativos:</span>
                    <span className="font-semibold text-slate-800">{workload}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTechId(tech.id);
                    }}
                    className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Técnico Ativo ✓' : 'Escolher Técnico'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: CHAMADOS PARA DISTRIBUIÇÃO */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              Fila de Chamados
            </h2>
            <p className="text-xs text-slate-500">
              {filterMode === 'UNASSIGNED'
                ? 'Exibindo apenas chamados sem técnico'
                : 'Exibindo todos os chamados ativos'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Abas */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              <button
                onClick={() => setFilterMode('UNASSIGNED')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterMode === 'UNASSIGNED'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sem Técnico ({tickets.filter((t) => !t.technicianId && t.ticketEnabled !== false).length})
              </button>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterMode === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Ativos ({tickets.filter((t) => t.ticketEnabled !== false).length})
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Buscar chamado ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Lista de Chamados */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Carregando chamados...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 size={30} className="mx-auto text-emerald-500 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">Tudo em dia!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filterMode === 'UNASSIGNED'
                ? 'Nenhum chamado pendente de atribuição no momento.'
                : 'Nenhum chamado encontrado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const customer = usersMap[ticket.customerId];
              const currentTech = ticket.technicianId ? usersMap[ticket.technicianId] : null;
              const isAssigningThis = assigningTicketId === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-400">#{ticket.id}</span>
                      <h3 className="text-sm font-bold text-slate-900">{ticket.title}</h3>
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                      <span className="text-[11px] font-medium px-2 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {ticket.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{ticket.description}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span>
                        Solicitante:{' '}
                        <strong className="text-slate-700">
                          {customer?.name || `Cliente #${ticket.customerId}`}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Técnico Atual:{' '}
                        {currentTech ? (
                          <strong className="text-blue-700">{currentTech.name}</strong>
                        ) : (
                          <span className="text-amber-600 inline-flex items-center gap-1 font-medium">
                            <AlertCircle size={11} /> Não atribuído
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        Data: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Atribuição */}
                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {selectedTech ? (
                      <button
                        onClick={() => handleAssign(ticket.id, selectedTech.id)}
                        disabled={
                          isAssigningThis ||
                          ticket.technicianId === selectedTech.id ||
                          ticket.customerId === selectedTech.id
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                          ticket.customerId === selectedTech.id
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                            : ticket.technicianId === selectedTech.id
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isAssigningThis ? (
                          <Clock size={13} className="animate-spin" />
                        ) : (
                          <UserCheck size={14} />
                        )}
                        <span>
                          {ticket.customerId === selectedTech.id
                            ? 'Solicitante do chamado'
                            : ticket.technicianId === selectedTech.id
                            ? 'Já atribuído'
                            : `Atribuir a ${selectedTech.name}`}
                        </span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Selecione um técnico acima
                      </div>
                    )}

                    <select
                      aria-label="Escolher outro técnico"
                      value={ticket.technicianId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) handleAssign(ticket.id, Number(val));
                      }}
                      className="w-full sm:w-auto text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        Outro técnico...
                      </option>
                      {technicians.map((t) => {
                        const isRequester = t.id === ticket.customerId;
                        return (
                          <option key={t.id} value={t.id} disabled={isRequester}>
                            {t.name} ({getTechWorkload(t.id)}) {isRequester ? '- Solicitante' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
