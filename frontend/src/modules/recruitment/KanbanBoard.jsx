import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Calendar, Clock, CheckCircle2, 
  XCircle, FileText, Send, UserCheck, Eye, Star, ChevronRight, UserPlus
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDateTime, formatDate } from '../../api/client';

export function KanbanBoard({ 
  pipelineData, 
  isLoading, 
  onRefresh, 
  onOpenApplicant, 
  onShortlist, 
  onQuickAdd,
  jobOpenings = [],
  selectedJob,
  setSelectedJob,
  searchQuery,
  setSearchQuery
}) {
  const [activeTabStage, setActiveTabStage] = useState('active'); // 'active' | 'completed'

  const stagesConfig = [
    { id: 'Applied', label: 'Applied', color: 'indigo', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10' },
    { id: 'Shortlisted', label: 'Shortlisted', color: 'cyan', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
    { id: 'Awaiting Slot Booking', label: 'Awaiting Slot', color: 'amber', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
    { id: 'Interview Scheduled', label: 'Scheduled', color: 'purple', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
    { id: 'Interview Completed', label: 'Feedback In', color: 'emerald', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  ];

  const decisionStages = [
    { id: 'Selected', label: 'Selected / Hired', color: 'emerald', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
    { id: 'On Bench', label: 'Talent Pool / Bench', color: 'amber', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
    { id: 'Rejected', label: 'Rejected', color: 'rose', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  ];

  const currentColumns = activeTabStage === 'active' ? stagesConfig : decisionStages;
  const stagesData = pipelineData?.stages || {};

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Candidate Pipeline</h2>
          <p className="text-sm text-slate-400">Streamlined 1-click candidate review, slot booking, and hiring decisions.</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Stage Filter Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTabStage('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabStage === 'active' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Pipeline
            </button>
            <button
              onClick={() => setActiveTabStage('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabStage === 'completed' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Decided & Archive
            </button>
          </div>

          {/* Job Filter */}
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Job Openings</option>
            {jobOpenings.map((job) => (
              <option key={job.name} value={job.job_title || job.name}>
                {job.job_title || job.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={UserPlus}
            onClick={onQuickAdd}
          >
            Quick Add
          </Button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {currentColumns.map((col) => {
          const items = stagesData[col.id] || [];

          return (
            <div
              key={col.id}
              className="flex flex-col min-w-[270px] bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.bg} border ${col.border}`} />
                  <span className="text-xs font-bold text-slate-200">{col.label}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400">No applicants</p>
                  </div>
                ) : (
                  items.map((applicant) => (
                    <div
                      key={applicant.name}
                      onClick={() => onOpenApplicant(applicant)}
                      className="glass-card glass-card-hover rounded-xl p-3.5 space-y-3 cursor-pointer group"
                    >
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {applicant.applicant_name}
                          </h4>
                          {applicant.resume_attachment && (
                            <span className="p-1 rounded-md bg-slate-800 text-indigo-400" title="Has Resume">
                              <FileText className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {applicant.job_title || 'General Applicant'}
                        </p>
                      </div>

                      {/* Status Details */}
                      {applicant.interview_rating_summary && (
                        <div className="bg-slate-950/60 p-2 rounded-lg text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 fill-amber-400" />
                          <span className="truncate">{applicant.interview_rating_summary}</span>
                        </div>
                      )}

                      {applicant.booked_slot_time && (
                        <div className="bg-purple-950/40 border border-purple-800/40 p-2 rounded-lg text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                          <span className="truncate">{formatDateTime(applicant.booked_slot_time)}</span>
                        </div>
                      )}

                      {/* Quick 1-Click Action Bar */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          {formatDate(applicant.creation)}
                        </span>

                        {col.id === 'Applied' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShortlist(applicant);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            <span>Shortlist</span>
                          </button>
                        )}

                        {col.id === 'Interview Completed' && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                            Decide <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
