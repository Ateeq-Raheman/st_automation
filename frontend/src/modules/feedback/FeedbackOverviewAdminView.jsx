import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, AlertTriangle, ShieldCheck, 
  Smile, RefreshCw, ChevronRight, CheckCircle2, 
  Clock, Filter, Calendar, Star, Building, Users,
  Heart, MessageSquare, Briefcase
} from 'lucide-react';
import { feedbackApi } from '../../api/feedbackApi';
import { Button } from '../../components/common/Button';

export function FeedbackOverviewAdminView({ selectedCompany }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await feedbackApi.getFeedbackOverview(selectedCompany, days);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load feedback overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedCompany, days]);

  const handleStatusChange = async (feedbackId, newStatus) => {
    setUpdatingId(feedbackId);
    try {
      await feedbackApi.updateFeedbackStatus(feedbackId, newStatus);
      await fetchOverview();
      if (selectedItem && selectedItem.name === feedbackId) {
        setSelectedItem((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
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

  const categoryColors = [
    '#ED1D24', // Red
    '#F97316', // Orange
    '#8B5CF6', // Purple
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EC4899', // Pink
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
            Staff Feedback
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-black dark:text-slate-50 tracking-tight">
            Feedback Overview
          </h1>
          <p className="text-sm text-brand-grey dark:text-slate-400">
            Track employee sentiment and take actionable steps for a better workplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-brand-black dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-red/30 cursor-pointer"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last 1 Year</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={fetchOverview}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-700/80 shadow-soft">
          <div className="text-xs font-bold uppercase text-brand-grey">Total Feedback</div>
          <div className="text-3xl font-heading font-extrabold text-brand-black dark:text-slate-50 mt-2">
            {data?.total ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Submissions</span>
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-700/80 shadow-soft">
          <div className="text-xs font-bold uppercase text-brand-grey">Positive Experience</div>
          <div className="text-3xl font-heading font-extrabold text-emerald-600 mt-2">
            {data?.positive_percentage ?? 0}%
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
            <Smile className="w-3.5 h-3.5" />
            <span>Rating 4 & 5 stars</span>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-700/80 shadow-soft">
          <div className="text-xs font-bold uppercase text-brand-grey">Needs Attention</div>
          <div className="text-3xl font-heading font-extrabold text-rose-600 mt-2">
            {data?.needs_attention_percentage ?? 0}%
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Rating 1 & 2 stars</span>
          </div>
        </div>

        {/* Anonymous Percentage */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-700/80 shadow-soft">
          <div className="text-xs font-bold uppercase text-brand-grey">Anonymous Share</div>
          <div className="text-3xl font-heading font-extrabold text-brand-red mt-2">
            {data?.anonymous_percentage ?? 100}%
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-grey mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
            <span>Confidential submissions</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Category Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback by Category */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-200/80 dark:border-slate-700/80 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-brand-black dark:text-slate-100">
              Feedback by Category
            </h3>
            <span className="text-xs text-brand-grey">{data?.total || 0} Total</span>
          </div>

          {/* Category Progress Bars */}
          <div className="space-y-3.5">
            {data?.category_breakdown && data.category_breakdown.length > 0 ? (
              data.category_breakdown.map((cat, idx) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-brand-black dark:text-slate-200 flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}
                      />
                      {cat.category}
                    </span>
                    <span className="font-bold text-brand-grey">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: categoryColors[idx % categoryColors.length],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-grey py-6 text-center">No categories recorded yet.</p>
            )}
          </div>
        </div>

        {/* Feedback Trend (Visual SVG Sparkline / Bar Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-200/80 dark:border-slate-700/80 shadow-soft space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-brand-black dark:text-slate-100">
              Feedback Volume Trend
            </h3>
            <span className="text-xs text-brand-grey">Time series</span>
          </div>

          {data?.trend && data.trend.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-4 border-b border-gray-100 dark:border-slate-700/50">
              {data.trend.map((t, idx) => {
                const maxCount = Math.max(...data.trend.map(item => item.count), 1);
                const heightPercent = Math.max(Math.round((t.count / maxCount) * 100), 12);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-brand-red opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.count}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-brand-red to-rose-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-semibold text-brand-grey truncate max-w-[48px]">
                      {t.period}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-brand-grey">
              Trend data will appear as feedback arrives over time.
            </div>
          )}

          <div className="text-[11px] text-brand-grey flex items-center justify-between pt-2">
            <span>Aggregated by submission periods</span>
            <span className="text-brand-red font-semibold">Continuous Influx</span>
          </div>
        </div>
      </div>

      {/* Recent Feedback Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200/80 dark:border-slate-700/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-brand-black dark:text-slate-100">
            Recent Feedback Submissions
          </h3>
          <span className="text-xs text-brand-grey">Showing latest entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-brand-grey border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Summary / Feedback</th>
                <th className="px-6 py-3.5">Submitter</th>
                <th className="px-6 py-3.5">Rating</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {data?.recent_feedback && data.recent_feedback.length > 0 ? (
                data.recent_feedback.map((item) => (
                  <tr 
                    key={item.name} 
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-6 py-4 text-xs text-brand-grey whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-black dark:text-slate-200 whitespace-nowrap">
                      {item.feedback_type}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700 dark:text-slate-300 max-w-xs truncate">
                      {item.feedback}
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-grey whitespace-nowrap">
                      {item.is_anonymous ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Anonymous
                        </span>
                      ) : (
                        <span className="font-semibold text-brand-black dark:text-slate-200">
                          {item.employee_name || 'Staff Member'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{item.rating}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        disabled={updatingId === item.name}
                        onChange={(e) => handleStatusChange(item.name, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadge(item.status)}`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Review">In Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right text-xs whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-brand-grey">
                    No recent feedback records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
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
                  <div className="text-[11px] font-bold uppercase text-brand-grey">Submitter</div>
                  <div className="font-semibold text-brand-black dark:text-slate-200">
                    {selectedItem.is_anonymous ? 'Anonymous' : (selectedItem.employee_name || 'Staff')}
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
                    View Uploaded File
                  </a>
                </div>
              )}

              {/* Status Update Controls */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-slate-700">
                <span className="text-xs font-bold text-brand-grey">Update Status:</span>
                <div className="flex gap-2">
                  {['Open', 'In Review', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedItem.name, st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedItem.status === st
                          ? 'bg-brand-red text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-700 text-brand-grey hover:bg-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
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
