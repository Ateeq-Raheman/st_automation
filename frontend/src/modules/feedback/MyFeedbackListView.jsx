import React, { useState, useEffect } from 'react';
import { 
  Building, MessageSquare, Users, Briefcase, 
  TrendingUp, Heart, ChevronRight, Star, Clock, 
  ShieldCheck, RefreshCw, Paperclip, CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { feedbackApi } from '../../api/feedbackApi';
import { Button } from '../../components/common/Button';
import { FEEDBACK_CATEGORIES } from './FeedbackLandingView';

export function MyFeedbackListView({ onNewFeedback }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchFeedbacks = async (status = selectedStatus) => {
    setIsLoading(true);
    try {
      const res = await feedbackApi.getMyFeedback(status === 'All' ? null : status);
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error('Failed to load my feedback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(selectedStatus);
  }, [selectedStatus]);

  const getCategoryIcon = (category) => {
    const found = FEEDBACK_CATEGORIES.find((c) => c.id === category);
    if (!found) return MessageSquare;
    return found.icon;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800';
      case 'In Review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filterTabs = ['All', 'Open', 'In Review', 'Resolved'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
            My Submissions
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-black dark:text-slate-50 tracking-tight">
            My Feedback
          </h1>
          <p className="text-sm text-brand-grey dark:text-slate-400">
            View your feedback submissions, history, and their current review status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={() => fetchFeedbacks(selectedStatus)}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewFeedback}
          >
            + New Feedback
          </Button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const count = tab === 'All' 
            ? feedbacks.length 
            : feedbacks.filter(f => f.status === tab).length;
          const isActive = selectedStatus === tab;

          return (
            <button
              key={tab}
              onClick={() => setSelectedStatus(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-brand-red text-white shadow-md shadow-glow-red'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-brand-grey hover:text-brand-black dark:hover:text-white'
              }`}
            >
              <span>{tab}</span>
              {tab !== 'All' && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-brand-grey'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Items List */}
      {feedbacks.length === 0 && !isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-brand-grey">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-brand-black dark:text-slate-100">
            No feedback found
          </h3>
          <p className="text-sm text-brand-grey max-w-sm mx-auto">
            You haven't submitted any feedback in this category yet. Your insights are always welcome!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((item) => {
            const Icon = getCategoryIcon(item.feedback_type);
            return (
              <div
                key={item.name}
                onClick={() => setSelectedItem(item)}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 p-5 hover:border-brand-red/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 flex items-center justify-center text-brand-red shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-brand-black dark:text-slate-100 truncate">
                        {item.title || item.feedback_type}
                      </h3>
                      {item.is_anonymous ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Anonymous
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-brand-grey dark:text-slate-400 line-clamp-2">
                      {item.feedback}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-brand-grey">
                      <span className="font-medium text-brand-red">{item.feedback_type}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.rating}/5</span>
                      </div>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-brand-grey group-hover:bg-brand-red group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
                <h2 className="text-xl font-bold text-brand-black dark:text-slate-50 mt-2">
                  {selectedItem.title || selectedItem.feedback_type}
                </h2>
                <div className="text-xs text-brand-grey mt-1">
                  Submitted on {selectedItem.date}
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700">
                <div>
                  <div className="text-[11px] font-bold uppercase text-brand-grey">Category</div>
                  <div className="font-semibold text-brand-black dark:text-slate-200">{selectedItem.feedback_type}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-brand-grey">Rating</div>
                  <div className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{selectedItem.rating} / 5</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase text-brand-grey mb-1.5">Feedback Content</div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700/60 text-brand-black dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.feedback}
                </div>
              </div>

              {selectedItem.attachment && (
                <div>
                  <div className="text-xs font-bold uppercase text-brand-grey mb-1">Attachment</div>
                  <a
                    href={selectedItem.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-red hover:underline"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    View Uploaded File
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
