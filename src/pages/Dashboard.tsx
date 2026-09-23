import React, { useEffect, useState } from 'react';
import { ticketService } from '../api/ticketService';
import type { Ticket } from '../types';
import { MetricCard } from '../components/MetricCard';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  PieChart,
  HardDrive,
  Code,
  Wifi,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketService
      .getAll()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL').length;

  const softwareCount = tickets.filter((t) => t.category === 'SOFTWARE').length;
  const hardwareCount = tickets.filter((t) => t.category === 'HARDWARE').length;
  const networkCount = tickets.filter((t) => t.category === 'NETWORK').length;

  const highCount = tickets.filter((t) => t.priority === 'HIGH').length;
  const mediumCount = tickets.filter((t) => t.priority === 'MEDIUM').length;
  const lowCount = tickets.filter((t) => t.priority === 'LOW').length;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Carregando métricas...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
          <PieChart size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Painel de Métricas</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral de Atendimento</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Estatísticas e proporções dos chamados registrados na plataforma
        </p>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Chamados"
          value={total}
          colorClass="border-slate-200"
          icon={<Layers className="text-blue-600" size={20} />}
        />
        <MetricCard
          label="Abertos"
          value={openCount}
          colorClass="border-amber-200"
          icon={<AlertCircle className="text-amber-600" size={20} />}
        />
        <MetricCard
          label="Em Atendimento"
          value={inProgressCount}
          colorClass="border-blue-200"
          icon={<Clock className="text-blue-600" size={20} />}
        />
        <MetricCard
          label="Resolvidos"
          value={resolvedCount}
          colorClass="border-emerald-200"
          icon={<CheckCircle2 className="text-emerald-600" size={20} />}
        />
        <MetricCard
          label="Críticos"
          value={criticalCount}
          colorClass="border-rose-200"
          icon={<Flame className="text-rose-600" size={20} />}
        />
      </div>

      {/* Distribuição por Categoria e Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card: Categoria */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            Distribuição por Categoria
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Code size={14} className="text-blue-600" />
                  Software ({softwareCount})
                </span>
                <span className="text-slate-500 font-semibold">{getPercentage(softwareCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${getPercentage(softwareCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <HardDrive size={14} className="text-indigo-600" />
                  Hardware ({hardwareCount})
                </span>
                <span className="text-slate-500 font-semibold">{getPercentage(hardwareCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${getPercentage(hardwareCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Wifi size={14} className="text-sky-600" />
                  Rede ({networkCount})
                </span>
                <span className="text-slate-500 font-semibold">{getPercentage(networkCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(networkCount)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Prioridade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Flame size={16} className="text-rose-600" />
            Nível de Severidade & Prioridade
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-rose-700 font-semibold">Crítica ({criticalCount})</span>
                <span className="text-slate-500 font-semibold">{getPercentage(criticalCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-600 h-2 rounded-full"
                  style={{ width: `${getPercentage(criticalCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-orange-700 font-semibold">Alta ({highCount})</span>
                <span className="text-slate-500 font-semibold">{getPercentage(highCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(highCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-amber-700 font-semibold">Média ({mediumCount})</span>
                <span className="text-slate-500 font-semibold">{getPercentage(mediumCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${getPercentage(mediumCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-sky-700 font-semibold">Baixa ({lowCount})</span>
                <span className="text-slate-500 font-semibold">{getPercentage(lowCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-2 rounded-full"
                  style={{ width: `${getPercentage(lowCount)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
