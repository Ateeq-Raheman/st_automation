import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Star, ShieldCheck, UploadCloud, 
  Paperclip, X, CheckCircle2, AlertCircle, Send, Sparkles 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { feedbackApi } from '../../api/feedbackApi';
import { FEEDBACK_CATEGORIES } from './FeedbackLandingView';

export function FeedbackFormView({ 
  initialCategory, 
  onBack, 
  onSuccess, 
  selectedCompany,
  userProfile 
}) {
  const [feedbackType, setFeedbackType] = useState(initialCategory || 'General Feedback');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const res = await feedbackApi.uploadAttachment(file);
      setAttachment({
        name: file.name,
        file_url: res.file_url || res,
      });
    } catch (err) {
      console.error('File upload error', err);
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError('Please provide your feedback details');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await feedbackApi.submitFeedback({
        feedback_type: feedbackType,
        feedback: feedbackText.trim(),
        rating,
        is_anonymous: isAnonymous,
        attachment: attachment?.file_url || null,
        company: selectedCompany,
      });
      onSuccess();
    } catch (err) {
      console.error('Submit feedback error', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-grey hover:text-brand-black dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </button>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/80 p-6 sm:p-10 shadow-soft space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-black dark:text-slate-50 tracking-tight">
            Share Your Feedback
          </h1>
          <p className="text-sm text-brand-grey dark:text-slate-400 mt-1">
            Your feedback helps us create a better workplace. All submissions are treated with utmost confidentiality.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
              Feedback Type <span className="text-brand-red">*</span>
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-black dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all text-sm font-medium"
              required
            >
              {FEEDBACK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Overall Experience Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
              Overall Experience Rating <span className="text-brand-red">*</span>
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
              <span className="ml-3 text-xs font-semibold text-brand-grey dark:text-slate-400">
                {rating === 5 ? '5/5 Excellent' : rating === 4 ? '4/5 Good' : rating === 3 ? '3/5 Average' : rating === 2 ? '2/5 Needs Improvement' : '1/5 Poor'}
              </span>
            </div>
            <p className="text-xs text-brand-grey dark:text-slate-400">
              How would you rate your overall experience at {selectedCompany || 'Standard Touch'}?
            </p>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
                Your Feedback <span className="text-brand-red">*</span>
              </label>
              <span className="text-xs text-brand-grey dark:text-slate-400">
                {feedbackText.length}/1000
              </span>
            </div>
            <textarea
              rows={5}
              maxLength={1000}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Please share your thoughts, suggestions, or ideas..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-black dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all text-sm leading-relaxed"
              required
            />
          </div>

          {/* Attachment Upload (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black dark:text-slate-200">
              Would you like to add an attachment? <span className="font-normal text-xs text-brand-grey">(Optional)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />

            {attachment ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5 truncate">
                  <Paperclip className="w-4 h-4 text-brand-red shrink-0" />
                  <span className="text-xs font-semibold text-brand-black dark:text-slate-200 truncate">
                    {attachment.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-brand-red/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-slate-900/40 hover:bg-red-50/30"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-brand-grey dark:text-slate-400 mb-2">
                  <UploadCloud className="w-5 h-5 text-brand-red" />
                </div>
                <p className="text-xs font-bold text-brand-black dark:text-slate-200">
                  {isUploading ? 'Uploading attachment...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-[11px] text-brand-grey mt-0.5">
                  Images, PDF or Docs (Max size: 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Anonymity Switch */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-start gap-3.5">
            <input
              type="checkbox"
              id="is_anonymous_check"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-brand-red focus:ring-brand-red border-gray-300 dark:border-slate-600 cursor-pointer"
            />
            <label htmlFor="is_anonymous_check" className="flex-1 cursor-pointer select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-black dark:text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                This feedback is anonymous
              </div>
              <p className="text-[11px] text-brand-grey dark:text-slate-400 mt-0.5">
                {isAnonymous
                  ? "Your identity will not be shared with anyone. Your submission is 100% confidential."
                  : `Submitting as ${userProfile?.full_name || 'Logged-in user'} (${userProfile?.email || ''}).`}
              </p>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              isLoading={isSubmitting}
              className="shadow-md shadow-glow-red"
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
