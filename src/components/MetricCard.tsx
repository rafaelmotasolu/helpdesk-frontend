import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  colorClass?: string;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, colorClass = 'border-slate-200', icon }) => {
  return (
    <div
      className={`p-5 rounded-xl border bg-white shadow-xs flex items-center justify-between ${colorClass}`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
};