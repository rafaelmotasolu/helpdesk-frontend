import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  colorClass: string;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, colorClass, icon }) => {
  return (
    <div className={`p-6 rounded-xl border bg-white shadow-sm flex items-center justify-between ${colorClass}`}>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className="p-3 rounded-lg bg-gray-50">{icon}</div>
    </div>
  );
};