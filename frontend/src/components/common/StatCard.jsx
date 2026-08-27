import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', onClick }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-950/40 border-indigo-800/40 text-indigo-400',
      glow: 'hover:border-indigo-500/50 hover:shadow-glow',
    },
    emerald: {
      bg: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400',
      glow: 'hover:border-emerald-500/50 hover:shadow-glow-emerald',
    },
    amber: {
      bg: 'bg-amber-950/40 border-amber-800/40 text-amber-400',
      glow: 'hover:border-amber-500/50',
    },
    rose: {
      bg: 'bg-rose-950/40 border-rose-800/40 text-rose-400',
      glow: 'hover:border-rose-500/50',
    },
    cyan: {
      bg: 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400',
      glow: 'hover:border-cyan-500/50',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 border transition-all duration-200 ${currentTheme.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${currentTheme.bg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
}
