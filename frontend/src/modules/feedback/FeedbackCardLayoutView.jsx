import React, { useState } from 'react';
import { 
  Building, MessageSquare, Users, Briefcase, 
  TrendingUp, Heart, Star, ShieldCheck, Send, 
  UploadCloud, Paperclip, X, AlertCircle, Sparkles 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { feedbackApi } from '../../api/feedbackApi';
import { FEEDBACK_CATEGORIES } from './FeedbackLandingView';

export function FeedbackCardLayoutView({ selectedCompany, userProfile, onSuccess }) {
  const [selectedCategory, setSelectedCategory] = useState('Work Environment');
  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError('Please tell us what is on your mind');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await feedbackApi.submitFeedback({
        feedback_type: selectedCategory,
        feedback: feedbackText.trim(),
        rating,
        is_anonymous: isAnonymous,
        company: selectedCompany,
      });
      onSuccess();
    } catch (err) {
      console.error('Submit error', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Banner with Background Cover */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent z-10" />
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-20 max-w-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
            STAFF FEEDBACK
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
            Let's Build a Better Workplace Together
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Your feedback helps us improve our processes, people, and workplace culture.
          </p>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/80 p-6 sm:p-10 shadow-soft space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Category Selection Cards */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
              What type of feedback do you want to share?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {FEEDBACK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer ${
                      isSelected
                        ? 'border-brand-red bg-red-50/50 dark:bg-red-950/30 text-brand-red shadow-md shadow-glow-red/30'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-brand-grey hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-brand-red text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-brand-grey group-hover:text-brand-red'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold truncate max-w-full">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
              Rate your overall experience
            </label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-gray-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Feedback Text Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
                Your feedback
              </label>
              <span className="text-xs text-brand-grey dark:text-slate-400">
                {feedbackText.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-black dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all text-sm leading-relaxed"
              required
            />
          </div>

          {/* Step 4: Submit Anonymously and Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-brand-black dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded text-brand-red focus:ring-brand-red border-gray-300 dark:border-slate-600"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Submit anonymously
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              isLoading={isSubmitting}
              className="w-full sm:w-auto shadow-md shadow-glow-red"
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
