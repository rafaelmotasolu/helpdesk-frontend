import React, { useEffect, useState } from 'react';
import { ticketService } from '../api/ticketService';
import type { Ticket } from '../types';
import { MetricCard } from '../components/MetricCard';
import { AlertCircle, CheckCircle2, Clock, Layers, Flame } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketService.getAll()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  const total = tickets.length;
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  const criticalCount = tickets.filter(t => t.priority === 'CRITICAL').length;

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando métricas...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão Geral de Atendimento</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Chamados"
          value={total}
          colorClass="border-blue-200"
          icon={<Layers className="text-blue-600" size={24} />}
        />
        <MetricCard
          label="Abertos"
          value={openCount}
          colorClass="border-amber-200"
          icon={<AlertCircle className="text-amber-600" size={24} />}
        />
        <MetricCard
          label="Em Atendimento"
          value={inProgressCount}
          colorClass="border-indigo-200"
          icon={<Clock className="text-indigo-600" size={24} />}
        />
        <MetricCard
          label="Resolvidos"
          value={resolvedCount}
          colorClass="border-emerald-200"
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
        />
        <MetricCard
          label="Críticos"
          value={criticalCount}
          colorClass="border-rose-200"
          icon={<Flame className="text-rose-600" size={24} />}
        />
      </div>
    </div>
  );
};
