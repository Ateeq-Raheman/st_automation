import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function SlideOver({ isOpen, onClose, title, subtitle, children, width = 'max-w-3xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div 
          className={`w-screen ${width} transform bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out animate-fade-in`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold text-brand-black tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-brand-grey mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-brand-grey hover:bg-gray-100 hover:text-brand-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
