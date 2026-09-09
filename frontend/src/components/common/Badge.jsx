import React from 'react';

export function Badge({ variant = 'default', children, className = '' }) {
  // Every non-default variant used to be a dark-mode color pair
  // (`bg-*-950/80` + `text-*-300`, meant for a dark background) inside an
  // app that's actually light-themed throughout — that made every badge
  // using these variants render as low-contrast light-on-light text
  // wherever it appeared (interview status, loan status, etc.). Replaced
  // with the same light-surface pattern already used elsewhere in the app
  // (e.g. `bg-emerald-50 border-emerald-200 text-emerald-700`).
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-semibold border ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
