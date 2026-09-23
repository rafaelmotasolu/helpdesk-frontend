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
  Headphones,
  Users,
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
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Cancelado
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

  const getPriorityBadge = (priority: string) => {
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

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrador'
      : user?.role === 'TECHNICIAN'
      ? 'Técnico'
      : 'Cliente';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Banner de Boas-Vindas Amigável e Limpo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Olá, {user?.name || 'Usuário'}! 👋
            </h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {roleLabel}
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            Bem-vindo à central do Helpdesk. Acompanhe os chamados, gerencie as solicitações e distribua atendimentos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/tickets')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
          >
            <TicketIcon size={16} />
            Ver Chamados
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/assign')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <UserCheck size={16} />
              Atribuições
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/users')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <Users size={16} />
              Usuários
            </button>
          )}
        </div>
      </div>

      {/* Grade de Indicadores Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Chamados</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : totalTickets}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TicketIcon size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abertos</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{loading ? '...' : openTickets}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Atendimento</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{loading ? '...' : inProgressTickets}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolvidos</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : resolvedTickets}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">Atalhos da Plataforma</h2>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            user?.role === 'ADMIN' ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-3'
          } gap-4`}
        >
          <div
            onClick={() => navigate('/tickets')}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <TicketIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Central de Chamados</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Consulte, filtre e gerencie solicitações com busca por clientes e técnicos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
              <span>Acessar</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </div>

          {user?.role === 'ADMIN' && (
            <div
              onClick={() => navigate('/assign')}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <UserCheck size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Atribuição de Técnicos</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Distribua os chamados abertos entre os técnicos disponíveis da equipe.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
                <span>Gerenciar</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <div
              onClick={() => navigate('/users')}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Gestão de Usuários</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cadastre novos usuários, altere permissões, redefina senhas e inative contas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
                <span>Gerenciar</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          )}

          <div
            onClick={() => navigate('/dashboard')}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Métricas & Dashboard</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Acompanhe indicadores de volume, categorias e proporções de chamados.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-sky-600">
              <span>Visualizar</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/tickets')}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <PlusCircle size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Novo Chamado</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Registre uma nova ocorrência técnica definindo prioridade e categoria.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
              <span>Criar Chamado</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Chamados Recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Chamados Recentes</h2>
            <p className="text-xs text-slate-500">Últimas solicitações registradas no sistema</p>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
          >
            Ver todos ({totalTickets})
            <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-slate-500">Carregando chamados...</div>
        ) : recentTickets.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">Nenhum chamado encontrado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => {
              const customer = usersMap[ticket.customerId];
              const technician = ticket.technicianId ? usersMap[ticket.technicianId] : null;

              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate('/tickets')}
                  className="px-5 py-3.5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                      <Headphones size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400">#{ticket.id}</span>
                        <h4 className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition">
                          {ticket.title}
                        </h4>
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status, ticket.ticketEnabled)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
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
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 mt-0.5 inline-flex items-center gap-0.5">
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
