import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'cyan' }) => {
  const variantMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantMap[variant]}`}
    >
      {label}
    </span>
  );
};
