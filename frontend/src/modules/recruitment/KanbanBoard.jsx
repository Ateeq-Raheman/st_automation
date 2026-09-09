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
  onScheduleInterview,
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
    { id: 'Open', label: 'Applied', color: 'indigo', border: 'border-brand-red/40', bg: 'bg-red-500/10' },
    { id: 'Replied', label: 'Shortlisted', color: 'cyan', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  ];

  const decisionStages = [
    { id: 'Accepted', label: 'Selected / Hired', color: 'emerald', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
    { id: 'Hold', label: 'Talent Pool / Bench', color: 'amber', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
    { id: 'Rejected', label: 'Rejected', color: 'rose', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  ];

  const currentColumns = activeTabStage === 'active' ? stagesConfig : decisionStages;
  const stagesData = pipelineData?.stages || {};

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black tracking-tight">Candidate Pipeline</h2>
          <p className="text-sm text-brand-grey">Streamlined 1-click candidate review, slot booking, and hiring decisions.</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Stage Filter Switcher */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setActiveTabStage('active')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTabStage === 'active' 
                  ? 'bg-brand-red text-white shadow-md' 
                  : 'text-brand-grey hover:text-brand-black'
              }`}
            >
              Active Pipeline
            </button>
            <button
              onClick={() => setActiveTabStage('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTabStage === 'completed' 
                  ? 'bg-brand-red text-white shadow-md' 
                  : 'text-brand-grey hover:text-brand-black'
              }`}
            >
              Decided & Archive
            </button>
          </div>

          {/* Job Filter */}
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-brand-black focus:outline-none focus:border-brand-red"
          >
            <option value="all">All Job Openings</option>
            {jobOpenings.map((job) => (
              <option key={job.name} value={job.job_title || job.name}>
                {job.job_title || job.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm font-semibold text-brand-black placeholder-slate-400 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {currentColumns.map((col) => {
          const items = stagesData[col.id] || [];

          return (
            <div
              key={col.id}
              className="flex flex-col min-w-[280px] w-[280px] shrink-0 bg-white/60 rounded-2xl border border-gray-200/80 p-3 snap-start"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.bg} border ${col.border}`} />
                  <span className="text-sm font-bold text-gray-800">{col.label}</span>
                </div>
                <span className="text-sm font-bold text-brand-grey bg-gray-100 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] px-1 pb-2 pt-1 -mx-1 hide-scrollbar">
                {items.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-brand-grey">No applicants</p>
                  </div>
                ) : (
                  items.map((applicant) => (
                    <div
                      key={applicant.name}
                      onClick={() => onOpenApplicant(applicant)}
                      className="glass-card glass-card-hover rounded-xl p-3.5 space-y-3 cursor-pointer group border border-gray-100 hover:border-gray-200"
                    >
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-brand-black group-hover:text-brand-red transition-colors">
                            {applicant.applicant_name}
                          </h4>
                          {applicant.resume_attachment && (
                            <span className="p-1 rounded-md bg-gray-100 text-brand-red" title="Has Resume">
                              <FileText className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-grey truncate mt-0.5">
                          {applicant.job_title || 'General Applicant'}
                        </p>
                      </div>

                      {/* Status Details */}
                      {applicant.interview_rating_summary && (
                        <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[13px] text-emerald-700 font-medium flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 fill-amber-500" />
                          <span className="truncate">{applicant.interview_rating_summary}</span>
                        </div>
                      )}

                      {applicant.booked_slot_time && (
                        <div className="bg-purple-50 border border-purple-100 p-2 rounded-lg text-[13px] text-purple-700 font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                          <span className="truncate">{formatDateTime(applicant.booked_slot_time)}</span>
                        </div>
                      )}

                      {/* Quick 1-Click Action Bar */}
                      <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                        <span className="text-[12px] text-brand-grey">
                          {formatDate(applicant.creation)}
                        </span>

                        {col.id === 'Open' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShortlist(applicant);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold bg-brand-red hover:bg-red-500 text-white transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            <span>Shortlist</span>
                          </button>
                        )}

                        {col.id === 'Replied' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleInterview(applicant);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Schedule</span>
                          </button>
                        )}

                        {col.id === 'Hold' && (
                          <span className="text-[13px] font-bold text-amber-600 flex items-center gap-0.5">
                            Reconsider <ChevronRight className="h-3 w-3" />
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
