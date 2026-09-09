import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) {
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          className={`w-full ${maxWidth} max-h-[85vh] flex flex-col transform rounded-2xl bg-white border border-gray-200 text-left align-middle shadow-2xl transition-all animate-fade-in`}
        >
          {/* Header — stays put; only the content below scrolls. Previously
              the card relied on the page-level wrapper's own scroll to
              reveal content taller than the viewport, which on some mobile
              browsers left the bottom of a tall form (fields + submit
              button) simply unreachable. Capping the card's own height and
              scrolling its content internally is bulletproof regardless of
              the outer wrapper's scroll behavior. */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-200/80 shrink-0">
            <div>
              <h3 className="text-xl font-bold text-brand-black tracking-tight">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-brand-grey">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-brand-grey hover:bg-gray-100 hover:text-brand-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 pt-4 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
