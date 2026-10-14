import React from 'react';
import { Check, ArrowRight, HeartHandshake } from 'lucide-react';
import { Button } from '../../components/common/Button';

export function FeedbackThankYouView({ onHome, onNewFeedback }) {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-8 animate-fade-in">
      {/* Success Badge */}
      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-red-500/15 animate-ping opacity-75" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-brand-red to-rose-500 flex items-center justify-center text-white shadow-xl shadow-glow-red">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-heading font-extrabold text-brand-black dark:text-slate-50 tracking-tight">
          Thank You!
        </h1>
        <p className="text-base font-medium text-brand-grey dark:text-slate-300">
          Your feedback has been submitted successfully.
        </p>
        <p className="text-xs text-brand-grey dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Your contribution helps us build a better and stronger workplace for everyone.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onHome}
          className="w-full sm:w-auto shadow-lg shadow-glow-red"
        >
          Back to Home
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onNewFeedback}
          className="w-full sm:w-auto"
        >
          Submit Another
        </Button>
      </div>

      {/* Footer Tagline */}
      <div className="pt-10 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[11px] italic text-brand-grey dark:text-slate-400">
          "Better people. Better processes. A stronger StandardTouch."
        </p>
      </div>
    </div>
  );
}
