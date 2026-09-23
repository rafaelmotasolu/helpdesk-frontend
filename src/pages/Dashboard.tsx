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
    return <div className="p-8 text-center text-slate-500">Carregando métricas da plataforma...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <PieChart size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">Painel Executivo</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Métricas & Indicadores</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhamento analítico da volumetria de suporte e distribuição das demandas
        </p>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Chamados"
          value={total}
          colorClass="border-slate-200"
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
          colorClass="border-blue-200"
          icon={<Clock className="text-blue-600" size={24} />}
        />
        <MetricCard
          label="Resolvidos"
          value={resolvedCount}
          colorClass="border-emerald-200"
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
        />
        <MetricCard
          label="Incidentes Críticos"
          value={criticalCount}
          colorClass="border-rose-200"
          icon={<Flame className="text-rose-600" size={24} />}
        />
      </div>

      {/* Distribuição por Categoria e Criticidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Distribuição por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            Distribuição por Categoria
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Code size={14} className="text-blue-600" />
                  Software ({softwareCount})
                </span>
                <span className="text-slate-500">{getPercentage(softwareCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(softwareCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <HardDrive size={14} className="text-indigo-600" />
                  Hardware ({hardwareCount})
                </span>
                <span className="text-slate-500">{getPercentage(hardwareCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(hardwareCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Wifi size={14} className="text-sky-600" />
                  Rede / Network ({networkCount})
                </span>
                <span className="text-slate-500">{getPercentage(networkCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(networkCount)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Distribuição por Prioridade */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame size={18} className="text-rose-600" />
            Nível de Severidade & Prioridade
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-rose-700 font-bold">Crítica ({criticalCount})</span>
                <span className="text-slate-500">{getPercentage(criticalCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(criticalCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-orange-700 font-semibold">Alta ({highCount})</span>
                <span className="text-slate-500">{getPercentage(highCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(highCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-amber-700 font-medium">Média ({mediumCount})</span>
                <span className="text-slate-500">{getPercentage(mediumCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(mediumCount)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-sky-700 font-medium">Baixa ({lowCount})</span>
                <span className="text-slate-500">{getPercentage(lowCount)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-sky-400 h-2 rounded-full transition-all duration-500"
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
