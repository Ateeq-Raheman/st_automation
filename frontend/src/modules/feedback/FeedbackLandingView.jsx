import React, { useState } from 'react';
import { 
  MessageSquare, Building, Users, Briefcase, 
  TrendingUp, Heart, ArrowRight, ShieldCheck, 
  Sparkles, CheckCircle2, ChevronRight, Send,
  Star, UploadCloud, Paperclip, X
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const FEEDBACK_CATEGORIES = [
  {
    id: 'General Feedback',
    label: 'General Feedback',
    desc: 'Share your general thoughts and suggestions.',
    icon: MessageSquare,
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
  },
  {
    id: 'Work Environment',
    label: 'Work Environment',
    desc: 'Help us improve your workplace experience & facilities.',
    icon: Building,
    badgeColor: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
  },
  {
    id: 'Management',
    label: 'Management',
    desc: 'Share your views on leadership, culture, and support.',
    icon: Users,
    badgeColor: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800'
  },
  {
    id: 'Team & Collaboration',
    label: 'Team & Collaboration',
    desc: 'Suggestions for teamwork, cross-functional synergy & morale.',
    icon: Briefcase,
    badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
  },
  {
    id: 'Process Improvement',
    label: 'Process Improvement',
    desc: 'Help us streamline processes and remove bottlenecks.',
    icon: TrendingUp,
    badgeColor: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800'
  },
  {
    id: 'Appreciation',
    label: 'Appreciation',
    desc: 'Recognize and appreciate your colleagues or managers.',
    icon: Heart,
    badgeColor: 'text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-950/50 dark:border-pink-800'
  }
];

export function FeedbackLandingView({ onStartForm, onCategorySelect }) {
  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-red-50/30 to-rose-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border border-gray-200/80 dark:border-slate-700 p-8 sm:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Staff Feedback
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-brand-black dark:text-slate-50 tracking-tight leading-tight">
              Your Voice <span className="text-brand-red">Matters</span>
            </h1>

            <p className="text-base sm:text-lg text-brand-grey dark:text-slate-300 leading-relaxed">
              Help us build a better workplace. Share your thoughts, ideas, and suggestions — completely anonymously or with your name.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={Send}
                onClick={() => onStartForm()}
                className="shadow-lg shadow-glow-red"
              >
                Submit Feedback
              </Button>
            </div>
          </div>

          {/* Decorative Illustration / Hero Badge */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-brand-red/20 to-orange-400/20 flex items-center justify-center border border-brand-red/20 shadow-inner">
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-red flex items-center justify-center shadow-lg shadow-glow-red text-white">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <div className="font-bold text-sm text-brand-black dark:text-slate-50">100% Confidential</div>
                <div className="text-xs text-brand-grey dark:text-slate-400">Anonymous by default to ensure safe & open communication</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-black dark:text-slate-50">Choose a Feedback Topic</h2>
            <p className="text-sm text-brand-grey">Select a category below to quickly share targeted feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEEDBACK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200/90 dark:border-slate-700/80 shadow-soft hover:shadow-xl hover:border-brand-red/40 dark:hover:border-brand-red/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 flex items-center justify-center text-brand-red group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white transition-all duration-300 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <h3 className="font-bold text-lg text-brand-black dark:text-slate-50 mb-1.5 group-hover:text-brand-red transition-colors">
                    {cat.label}
                  </h3>
                  
                  <p className="text-sm text-brand-grey dark:text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-brand-grey group-hover:text-brand-red transition-colors">
                  <span>Start sharing</span>
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 group-hover:bg-brand-red group-hover:text-white flex items-center justify-center transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Quick & Easy Action Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent border border-red-200/80 dark:border-red-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red/15 text-brand-red flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-brand-black dark:text-slate-50">Quick & Easy</h4>
            <p className="text-sm text-brand-grey dark:text-slate-300">
              It only takes 60 seconds. Your feedback helps us create a better and more positive work environment for everyone.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Send}
          onClick={() => onStartForm()}
          className="shrink-0 w-full sm:w-auto"
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}
