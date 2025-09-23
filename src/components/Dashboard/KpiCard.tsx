import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  period: string;
  invertChangeColor?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, icon: Icon, period, invertChangeColor = false }) => {
  const isPositive = change >= 0;
  const changeColor = (isPositive && !invertChangeColor) || (!isPositive && invertChangeColor)
    ? 'text-green-500'
    : 'text-red-500';
  const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <Icon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <div className="flex items-center text-sm mt-2">
          <span className={`flex items-center font-semibold ${changeColor}`}>
            <ChangeIcon className="w-4 h-4 mr-1" />
            {Math.abs(change).toFixed(2)}%
          </span>
          <span className="ml-2 text-gray-500 dark:text-gray-400">{period}</span>
        </div>
      </div>
    </div>
  );
};
