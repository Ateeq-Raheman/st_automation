import React from 'react';

export function Badge({ variant = 'default', children, className = '' }) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
    info: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
