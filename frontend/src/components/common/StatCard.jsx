import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', onClick }) {
  // Was `bg-*-950/40` + `text-*-400` on every variant — a dark-mode color
  // pair inside a light-themed app, rendering as low-contrast light-on-light
  // wherever a StatCard appeared (dashboards, recruitment overview, etc.).
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 border-indigo-200 text-brand-red',
      glow: 'hover:border-brand-red/50 hover:shadow-glow',
    },
    emerald: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      glow: 'hover:border-emerald-500/50 hover:shadow-glow-emerald',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      glow: 'hover:border-amber-500/50',
    },
    rose: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      glow: 'hover:border-rose-500/50',
    },
    cyan: {
      bg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
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
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-grey">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${currentTheme.bg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-heading font-bold text-brand-black tracking-tight">{value}</span>
        {trend && (
          <span className="text-sm font-semibold text-emerald-600">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-sm text-brand-grey truncate">{subtitle}</p>
      )}
    </div>
  );
}
