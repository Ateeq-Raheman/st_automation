import React, { useState } from 'react';
import { 
  Mail, Phone, Calendar, Briefcase, FileText, Send, 
  CheckCircle, Clock, Copy, Check, Star, AlertCircle, 
  ExternalLink, UserCheck, ShieldAlert
} from 'lucide-react';
import { SlideOver } from '../../components/common/SlideOver';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate, formatDateTime } from '../../api/client';

export function ApplicantDetailModal({ 
  isOpen, 
  onClose, 
  applicant, 
  onShortlist, 
  onDecision,
  isActionLoading 
}) {
  const [copied, setCopied] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);

  if (!applicant) return null;

  const copyBookingLink = () => {
    if (applicant.booking_url) {
      navigator.clipboard.writeText(applicant.booking_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTriggerDecision = (type) => {
    setSelectedDecision(type);
    setIsDecisionOpen(true);
  };

  const confirmDecision = () => {
    if (selectedDecision) {
      onDecision(applicant.name, selectedDecision, decisionNotes);
      setIsDecisionOpen(false);
      setDecisionNotes('');
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={applicant.applicant_name}
      subtitle={applicant.job_title || 'Applicant Profile'}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Email Address</span>
              <span className="text-xs font-bold text-white truncate block">{applicant.email_id || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Phone</span>
              <span className="text-xs font-bold text-white truncate block">{applicant.phone_number || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block">Current Stage</span>
              <Badge variant="primary">{applicant.stage || applicant.status}</Badge>
            </div>
          </div>
        </div>

        {/* Candidate Slot Booking Token Banner */}
        {applicant.booking_url && (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300">Candidate Slot Booking Link Active</h4>
              </div>
              <p className="text-xs text-amber-200/70 mt-1">
                Candidate was emailed the booking link. You can also share it directly:
              </p>
            </div>

            <button
              onClick={copyBookingLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}

        {/* Feedback / Scorecard Summary */}
        {applicant.interview_rating_summary && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>Interviewer Feedback Summary</span>
            </div>
            <p className="text-sm text-slate-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {applicant.interview_rating_summary}
            </p>
          </div>
        )}

        {/* Inline CV / Resume Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Resume / CV Document</span>
            </h4>
            {applicant.resume_attachment && (
              <a
                href={applicant.resume_attachment}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Open in new tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {applicant.resume_attachment ? (
            <div className="h-[480px] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col">
              <iframe
                src={applicant.resume_attachment}
                title="Candidate Resume"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">No resume attached to this application</p>
            </div>
          )}
        </div>

        {/* 1-Click Action Footer Bar */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* If Fresh Applied */}
          {applicant.stage === 'Applied' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="primary"
                icon={Send}
                isLoading={isActionLoading}
                onClick={() => onShortlist(applicant)}
              >
                Shortlist & Send Booking Link
              </Button>
              <Button
                variant="danger"
                isLoading={isActionLoading}
                onClick={() => handleTriggerDecision('Reject')}
              >
                Reject
              </Button>
            </div>
          )}

          {/* If Interview Completed or Ready for Decision */}
          {(applicant.stage === 'Interview Completed' || applicant.stage === 'Interview Scheduled' || applicant.stage === 'Shortlisted') && (
            <div className="flex items-center gap-2.5 w-full justify-end">
              <Button
                variant="success"
                icon={UserCheck}
                isLoading={isActionLoading}
                onClick={() => handleTriggerDecision('Select')}
              >
                Select / Offer
              </Button>
              <Button
                variant="warning"
                isLoading={isActionLoading}
                onClick={() => handleTriggerDecision('Bench')}
              >
                Talent Pool / Bench
              </Button>
              <Button
                variant="danger"
                isLoading={isActionLoading}
                onClick={() => handleTriggerDecision('Reject')}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      {isDecisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              Confirm Hiring Decision: {selectedDecision}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedDecision === 'Select' && 'This will mark candidate as Selected and auto-draft a Job Offer.'}
              {selectedDecision === 'Bench' && 'This will move candidate to Talent Pool / Bench for future open roles.'}
              {selectedDecision === 'Reject' && 'This will mark candidate as Rejected and trigger a polite notification email.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Optional Notes / Reason</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Add any internal decision notes..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsDecisionOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={selectedDecision === 'Select' ? 'success' : selectedDecision === 'Bench' ? 'warning' : 'danger'}
                isLoading={isActionLoading}
                onClick={confirmDecision}
              >
                Confirm {selectedDecision}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
