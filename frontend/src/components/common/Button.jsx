import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  isLoading = false, 
  disabled = false, 
  className = '', 
  ...props 
}) {
  const variantStyles = {
    primary: 'bg-brand-red hover:bg-red-500 text-white shadow-lg shadow-glow-red active:scale-[0.98] border border-brand-red/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-brand-black shadow-lg shadow-emerald-600/20 active:scale-[0.98] border border-emerald-500/30',
    danger: 'bg-rose-600 hover:bg-rose-500 text-brand-black shadow-lg shadow-rose-600/20 active:scale-[0.98] border border-rose-500/30',
    warning: 'bg-amber-600 hover:bg-amber-500 text-brand-black shadow-lg shadow-amber-600/20 active:scale-[0.98] border border-amber-500/30',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 active:scale-[0.98]',
    ghost: 'text-brand-grey hover:text-brand-black hover:bg-gray-100/60',
    outline: 'border border-gray-300 hover:border-slate-500 text-gray-700 hover:text-brand-black bg-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base font-bold rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
