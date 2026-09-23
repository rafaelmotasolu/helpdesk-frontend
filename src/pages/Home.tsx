import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../api/ticketService';
import { userService } from '../api/userService';
import type { Ticket, User } from '../types';
import {
  Ticket as TicketIcon,
  UserCheck,
  BarChart3,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Headphones,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketList, userList] = await Promise.all([
          ticketService.getAll(),
          userService.getAll().catch(() => [] as User[]),
        ]);
        setTickets(ticketList);
        const map: Record<number, User> = {};
        userList.forEach((u) => {
          map[u.id] = u;
        });
        setUsersMap(map);
      } catch (err) {
        console.error('Erro ao carregar dados da Home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const recentTickets = [...tickets].slice(0, 5);

  const getStatusBadge = (status: string, enabled?: boolean) => {
    if (enabled === false) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          CANCELADO
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

  const getPriorityBadge = (priority: string) => {
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

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrador'
      : user?.role === 'TECHNICIAN'
      ? 'Técnico Especialista'
      : 'Cliente Solicitante';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner de Boas-Vindas */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-400/30 text-blue-100 text-xs font-medium mb-3">
            <ShieldCheck size={14} className="text-blue-300" />
            <span>Perfil: {roleLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Olá, {user?.name || 'Usuário'}! 👋
          </h1>
          <p className="text-blue-100 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
            Bem-vindo à central HelpDesk PRO. Acompanhe a saúde operacional dos chamados, gerencie atendimentos e atribua demandas para a equipe.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 text-sm"
          >
            <TicketIcon size={18} />
            Ver Chamados
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
            <button
              onClick={() => navigate('/assign')}
              className="bg-blue-800/80 hover:bg-blue-800 text-white font-medium px-4 py-2.5 rounded-xl border border-blue-400/40 shadow-xs transition flex items-center gap-2 text-sm"
            >
              <UserCheck size={18} />
              Atribuir Técnicos
            </button>
          )}
        </div>
      </div>

      {/* Indicadores Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Chamados</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : totalTickets}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <TicketIcon size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abertos / Pendentes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{loading ? '...' : openTickets}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Atendimento</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{loading ? '...' : inProgressTickets}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolvidos / Concluídos</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : resolvedTickets}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Cartões de Acesso Rápido */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Acesso Rápido aos Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Chamados */}
          <div
            onClick={() => navigate('/tickets')}
            className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white transition flex items-center justify-center mb-4">
                <TicketIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                Central de Chamados
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Navegue pela lista de chamados, filtre por status, prioridade ou pesquise por clientes e técnicos.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition duration-200">
              <span>Ir para Chamados</span>
              <ArrowRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Card 2: Atribuição de Técnicos */}
          <div
            onClick={() => navigate('/assign')}
            className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white transition flex items-center justify-center mb-4">
                <UserCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                Atribuição de Técnicos
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Selecione os especialistas disponíveis e distribua os chamados pendentes para agilizar o suporte.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition duration-200">
              <span>Gerenciar Atribuições</span>
              <ArrowRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Card 3: Métricas */}
          <div
            onClick={() => navigate('/dashboard')}
            className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 group-hover:bg-sky-600 text-sky-600 group-hover:text-white transition flex items-center justify-center mb-4">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                Métricas & Dashboard
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Analise os indicadores de desempenho, volume de incidentes e proporções críticas em tempo real.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-semibold text-sky-600 group-hover:translate-x-1 transition duration-200">
              <span>Visualizar Métricas</span>
              <ArrowRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Card 4: Novo Chamado */}
          <div
            onClick={() => navigate('/tickets')}
            className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white transition flex items-center justify-center mb-4">
                <PlusCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
                Abertura de Chamado
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Cadastre novas ocorrências técnicas definindo categoria, descrição detalhada e criticidade.
              </p>
            </div>
            <div className="mt-5 flex items-center text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition duration-200">
              <span>Novo Chamado</span>
              <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Chamados Recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chamados Recentes</h2>
            <p className="text-xs text-slate-500">Últimas solicitações registradas na plataforma</p>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
          >
            Ver todos ({totalTickets})
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Carregando chamados recentes...</div>
        ) : recentTickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Nenhum chamado cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => {
              const customer = usersMap[ticket.customerId];
              const technician = ticket.technicianId ? usersMap[ticket.technicianId] : null;

              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate('/tickets')}
                  className="px-6 py-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Headphones size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                        <h4 className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition">
                          {ticket.title}
                        </h4>
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status, ticket.ticketEnabled)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>
                          Solicitante:{' '}
                          <strong className="text-slate-700">{customer?.name || `ID #${ticket.customerId}`}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Técnico:{' '}
                          <strong className="text-slate-700">
                            {technician?.name || 'Não atribuído'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs font-medium text-blue-600 mt-1 inline-flex items-center gap-0.5">
                      Detalhes <ArrowRight size={12} />
                    </span>
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

