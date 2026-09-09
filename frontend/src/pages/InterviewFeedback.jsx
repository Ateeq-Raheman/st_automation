import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader, Star, Send } from 'lucide-react';

/**
 * Public-facing Interview Feedback page.
 * URL: /interview-feedback?token=<token>&interview=<interview_name>
 *
 * The interviewer receives a link in their email after being assigned.
 * No login required — token validates their identity.
 */
export default function InterviewFeedback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const interviewName = params.get('interview');

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!token || !interviewName) {
      setStatus('error');
      setErrorMsg('Invalid feedback link. Please check the link in your email.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      alert('Please enter your feedback before submitting.');
      return;
    }

    setStatus('loading');
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('interview', interviewName);
      formData.append('feedback', feedback);
      formData.append('rating', rating);

      const response = await fetch('/api/method/st_automation.api.recruitment.submit_interview_feedback', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.message && !data.exception) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.exception || 'Failed to submit feedback. This link may have already been used or expired.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Please try again or contact HR.');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h1>
          <p className="text-gray-500">Thank you. Your feedback has been recorded in the HR system and attributed to your name.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-9 w-9 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">{errorMsg}</p>
          <p className="text-sm text-gray-400 mt-4">If you believe this is an error, please contact the HR team directly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <span className="text-sm font-semibold text-indigo-200 uppercase tracking-wide">Standard Touch HR</span>
          </div>
          <h1 className="text-2xl font-bold mt-3">Interview Feedback</h1>
          <p className="text-indigo-200 text-sm mt-1">Your feedback helps us make the right hiring decisions. It will be recorded against your name in the HR system.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Overall Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-gray-600">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your honest assessment of the candidate — communication skills, technical ability, cultural fit, red flags, or anything else relevant..."
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400"
              required
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Recommendation</label>
            <div className="grid grid-cols-3 gap-3">
              {['Strongly Recommend', 'Neutral', 'Do Not Recommend'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFeedback((prev) => `[${option}]\n\n${prev.replace(/^\[.*?\]\n\n/, '')}`)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    feedback.startsWith(`[${option}]`)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            This link is unique to you and can only be used once. Your submission will be attributed to your employee profile.
          </p>
        </form>
      </div>
    </div>
  );
}
