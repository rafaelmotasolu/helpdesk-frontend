import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Inbox,
  UserCheck,
  RefreshCw,
  Ticket,
  ChevronRight,
  Clock,
  Loader2,
  BellRing,
} from 'lucide-react';
import { notificationService, type NotificationItem } from '../api/notificationService';
import { useAuth } from '../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoading(true);
    try {
      const data = await notificationService.getNotifications(0, 30);
      setNotifications(data.content || []);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Polling a cada 20 segundos para notificações em tempo real
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      await handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    navigate('/tickets');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const getEventBadge = (eventType: string, recipientRole: string | null) => {
    if (eventType === 'TICKET_CREATED_UNASSIGNED' || recipientRole === 'TECHNICIAN') {
      return {
        label: 'Disponível',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <Inbox size={14} className="text-amber-600" />,
      };
    }
    if (eventType === 'TICKET_ASSIGNED' || eventType === 'TICKET_ASSIGNED_TECH') {
      return {
        label: 'Atribuição',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <UserCheck size={14} className="text-blue-600" />,
      };
    }
    if (eventType === 'TICKET_STATUS_CHANGED') {
      return {
        label: 'Status',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <RefreshCw size={14} className="text-purple-600" />,
      };
    }
    return {
      label: 'Novo Chamado',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <Ticket size={14} className="text-emerald-600" />,
    };
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `Há ${diffDays} dias`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={handleToggle}
        className={`relative p-2 rounded-lg border transition shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-blue-50 border-blue-200 text-blue-600'
            : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200'
        }`}
        title="Notificações do Sistema"
      >
        {unreadCount > 0 ? (
          <BellRing size={16} className="text-blue-600 animate-wiggle" />
        ) : (
          <Bell size={16} />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bell size={13} />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={13} />
                <span>Marcar lidas</span>
              </button>
            )}
          </div>

          {/* Abas / Filtro rápido */}
          <div className="flex border-b border-slate-100 px-3 pt-2 gap-2 text-xs bg-white">
            <button
              onClick={() => setActiveFilter('all')}
              className={`pb-2 px-1 font-medium transition border-b-2 cursor-pointer ${
                activeFilter === 'all'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`pb-2 px-1 font-medium transition border-b-2 cursor-pointer ${
                activeFilter === 'unread'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Não lidas ({unreadCount})
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span>Carregando notificações...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Inbox size={20} />
                </div>
                <span className="font-medium text-slate-600">
                  {activeFilter === 'unread'
                    ? 'Nenhuma notificação não lida'
                    : 'Nenhuma notificação no momento'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Eventos de chamados aparecerão aqui em tempo real.
                </span>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const badge = getEventBadge(item.eventType, item.recipientRole);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                      item.read
                        ? 'bg-white hover:bg-slate-50/80 text-slate-700'
                        : 'bg-blue-50/30 hover:bg-blue-50/60 text-slate-900'
                    }`}
                  >
                    {/* Ícone de Categoria */}
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 border border-slate-200 transition shadow-2xs">
                      {badge.icon}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-900 truncate">
                            {item.title}
                          </span>
                        </div>
                        {!item.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                            title="Não lida"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {formatRelativeTime(item.createdAt)}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          Ver chamado <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tickets');
                }}
                className="text-[11px] text-slate-600 hover:text-blue-700 font-medium transition cursor-pointer"
              >
                Gerenciar todos os chamados
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
