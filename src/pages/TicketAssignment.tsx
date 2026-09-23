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

        const techList = userList.filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN');
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
    setAssigningTicketId(ticketId);
    try {
      await ticketService.assignTechnician(ticketId, techId);
      const targetTech = technicians.find((t) => t.id === techId);
      setActionSuccessMessage(
        `Chamado #${ticketId} atribuído com sucesso para ${targetTech?.name || 'técnico'}!`
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Erro ao atribuir técnico:', err);
      alert('Não foi possível atribuir o técnico. Tente novamente.');
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
    // Apenas chamados ativos
    if (t.ticketEnabled === false) return false;

    // Filtro por modo: Não atribuídos vs Todos
    if (filterMode === 'UNASSIGNED' && t.technicianId) return false;

    // Busca textual
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
            CRÍTICO
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            ALTA
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            MÉDIA
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            BAIXA
          </span>
        );
    }
  };

  const getStatusBadge = (status: Status) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Briefcase size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">Gestão Operacional</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Atribuição de Técnicos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Selecione um técnico da lista para associá-lo rapidamente aos chamados que aguardam atendimento.
        </p>
      </div>

      {/* Notificação Toast de Sucesso */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs transition animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* SEÇÃO 1: LISTAGEM DE TÉCNICOS PARA ESCOLHA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Técnicos da Equipe
            </h2>
            <p className="text-xs text-slate-500">
              Clique em um técnico para selecioná-lo como o destino das atribuições
            </p>
          </div>
          {selectedTech && (
            <div className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold flex items-center gap-1.5">
              <Check size={14} className="text-blue-600" />
              Técnico Selecionado: <strong>{selectedTech.name}</strong>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Carregando técnicos...</div>
        ) : technicians.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Nenhum técnico cadastrado na base.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map((tech) => {
              const isSelected = selectedTechId === tech.id;
              const workload = getTechWorkload(tech.id);
              const initial = tech.name ? tech.name.charAt(0).toUpperCase() : 'T';

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`relative p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-slate-900 truncate">{tech.name}</p>
                      <p className="text-xs text-slate-500 truncate">{tech.email}</p>
                      <div className="mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                            tech.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {tech.role === 'ADMIN' ? 'Admin / Técnico' : 'Técnico'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Carga atual:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        workload > 3
                          ? 'bg-amber-100 text-amber-800'
                          : workload > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {workload} {workload === 1 ? 'chamado' : 'chamados'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTechId(tech.id);
                    }}
                    className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Técnico Ativo' : 'Escolher este Técnico'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: LISTAGEM DE CHAMADOS PARA ATRIBUIÇÃO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              Chamados para Distribuição
            </h2>
            <p className="text-xs text-slate-500">
              {filterMode === 'UNASSIGNED'
                ? 'Exibindo apenas chamados sem nenhum técnico associado'
                : 'Exibindo todos os chamados ativos'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Abas */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setFilterMode('UNASSIGNED')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterMode === 'UNASSIGNED'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sem Técnico ({tickets.filter((t) => !t.technicianId && t.ticketEnabled !== false).length})
              </button>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterMode === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Ativos ({tickets.filter((t) => t.ticketEnabled !== false).length})
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar chamado ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Lista de Chamados */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Carregando chamados...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tudo em dia!</p>
            <p className="text-xs text-slate-500 mt-1">
              {filterMode === 'UNASSIGNED'
                ? 'Nenhum chamado pendente de atribuição no momento.'
                : 'Nenhum chamado encontrado para a busca especificada.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const customer = usersMap[ticket.customerId];
              const currentTech = ticket.technicianId ? usersMap[ticket.technicianId] : null;
              const isAssigningThis = assigningTicketId === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/40 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                      <h3 className="text-sm font-bold text-slate-900">{ticket.title}</h3>
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {ticket.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
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
                          <strong className="text-blue-700 font-semibold">{currentTech.name}</strong>
                        ) : (
                          <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                            <AlertCircle size={12} /> Não atribuído
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        Criado em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Atribuição */}
                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {/* Atribuição direta com o técnico selecionado */}
                    {selectedTech ? (
                      <button
                        onClick={() => handleAssign(ticket.id, selectedTech.id)}
                        disabled={isAssigningThis || ticket.technicianId === selectedTech.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                          ticket.technicianId === selectedTech.id
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                        }`}
                      >
                        {isAssigningThis ? (
                          <Clock size={14} className="animate-spin" />
                        ) : (
                          <UserCheck size={15} />
                        )}
                        <span>
                          {ticket.technicianId === selectedTech.id
                            ? 'Já atribuído a este técnico'
                            : `Atribuir a ${selectedTech.name}`}
                        </span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Selecione um técnico acima para atribuir
                      </div>
                    )}

                    {/* Dropdown alternativo para atribuir qualquer técnico pontualmente */}
                    <div className="relative">
                      <select
                        aria-label="Escolher outro técnico"
                        value={ticket.technicianId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleAssign(ticket.id, Number(val));
                        }}
                        className="w-full sm:w-auto text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          Escolher outro técnico...
                        </option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({getTechWorkload(t.id)} chamados)
                          </option>
                        ))}
                      </select>
                    </div>
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
