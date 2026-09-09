import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Calendar, Briefcase, FileText, Send, 
  CheckCircle, Clock, Copy, Check, Star, AlertCircle, 
  ExternalLink, UserCheck, ShieldAlert, Users, Video, RefreshCcw
} from 'lucide-react';
import { SlideOver } from '../../components/common/SlideOver';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate, formatDateTime, callApi, uploadFile } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import EmployeeSelect from '../../components/EmployeeSelect';

export function ApplicantDetailModal({
  isOpen,
  onClose,
  applicant,
  onShortlist,
  onDecision,
  isActionLoading,
  initialSchedulingOpen = false
}) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);

  // 3-Round Interview State. `initialSchedulingOpen` lets the Kanban card's
  // "Schedule Interview" button (Replied column) jump straight into the
  // scheduling form instead of landing on the general profile first —
  // previously the only way to reach this was open profile -> find
  // "Schedule Now" -> click it, a two-step detour for the single most
  // common action on a shortlisted candidate.
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(initialSchedulingOpen);
  useEffect(() => {
    if (isOpen) setIsSchedulingOpen(initialSchedulingOpen);
  }, [isOpen, applicant?.name, initialSchedulingOpen]);
  const [interviewRound, setInterviewRound] = useState(1);
  const [selectedInterviewers, setSelectedInterviewers] = useState([]);
  const [interviewTime, setInterviewTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Auto-set a default interviewer when changing to Round 2 or 3
  useEffect(() => {
    if (interviewRound === 2 || interviewRound === 3) {
      // Fetch any active employee to act as a default if none is selected
      if (selectedInterviewers.length === 0) {
        window.frappe.call({
          method: 'frappe.client.get_list',
          args: {
            doctype: 'Employee',
            filters: { status: 'Active' },
            limit_page_length: 1
          },
          callback: (r) => {
            if (r.message && r.message.length > 0) {
              setSelectedInterviewers([r.message[0].name]);
            }
          }
        });
      }
    } else {
      setSelectedInterviewers([]); // Clear for Round 1
    }
  }, [interviewRound]);

  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);

  useEffect(() => {
    if (applicant?.name) {
      loadInterviews();
    }
  }, [applicant?.name]);

  const loadInterviews = async () => {
    setIsLoadingInterviews(true);
    try {
      const res = await callApi('st_automation.api.recruitment.get_applicant_interviews', { applicant_id: applicant.name }, 'GET');
      setScheduledInterviews(res.data || []);
    } catch (err) {
      console.error('Failed to load interviews', err);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  // Offer letter: HR uploads the actual file from their machine — nothing
  // is auto-generated or sent without a file being picked first. These
  // MUST stay above the `if (!applicant) return null` guard below — React
  // requires every hook to run on every render, in the same order. Having
  // them after an early return meant this component called a different
  // number of hooks depending on whether `applicant` was set, which is
  // exactly when it's non-null (i.e. the moment a candidate is actually
  // clicked) — a real, confirmed crash, not a hypothetical one.
  const [isOfferLetterOpen, setIsOfferLetterOpen] = useState(false);
  const [offerLetterFile, setOfferLetterFile] = useState(null);
  const [isSendingOffer, setIsSendingOffer] = useState(false);

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

  const handleSendOfferLetter = async () => {
    if (!offerLetterFile) return;
    setIsSendingOffer(true);
    try {
      const uploaded = await uploadFile(offerLetterFile, {
        isPrivate: true,
        doctype: 'Job Applicant',
        docname: applicant.name,
      });
      const res = await callApi('st_automation.api.recruitment.send_offer_letter', {
        applicant_id: applicant.name,
        file_url: uploaded.file_url,
      });
      addToast(res.message, 'success');
      setIsOfferLetterOpen(false);
      setOfferLetterFile(null);
    } catch (err) {
      addToast(err.message || 'Failed to send offer letter', 'error');
    } finally {
      setIsSendingOffer(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedInterviewers.length || !interviewTime) {
      addToast('Please select at least one interviewer and a time.', 'error');
      return;
    }
    
    setIsScheduling(true);
    try {
      const res = await callApi('st_automation.api.recruitment.schedule_interview_round', {
        applicant_id: applicant.name,
        round_number: interviewRound,
        interviewers: JSON.stringify(selectedInterviewers),
        scheduled_time: interviewTime
      });
      addToast(res.message || 'Interview scheduled and calendar invites sent!', 'success');
      setIsSchedulingOpen(false);
      loadInterviews();
    } catch (err) {
      addToast(err.message || 'Failed to schedule interview', 'error');
    } finally {
      setIsScheduling(false);
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
      <div className="space-y-6 pb-24">
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-gray-500 block">Email Address</span>
              <span className="text-sm font-bold text-gray-900 truncate block">{applicant.email_id || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-gray-500 block">Phone</span>
              <span className="text-sm font-bold text-gray-900 truncate block">{applicant.phone_number || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-gray-500 block">Current Stage</span>
              <Badge variant="primary">{applicant.stage || applicant.status}</Badge>
            </div>
          </div>
        </div>

        {/* Existing Scheduled Interviews */}
        {scheduledInterviews.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-brand-red" />
              Scheduled Interviews
            </h3>
            <div className="space-y-3">
              {scheduledInterviews.map((iv) => (
                <div key={iv.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{iv.name}</span>
                    <span className="text-[13px] text-gray-500 mt-0.5 block flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(iv.scheduled_on)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[12px] uppercase font-bold text-gray-400 block mb-0.5">Interviewers</span>
                      <div className="flex -space-x-2">
                        {iv.interviewers?.map((emp, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center text-[12px] font-bold border-2 border-white ring-1 ring-gray-100" title={emp}>
                            {emp.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Badge variant={['Scheduled', 'Pending'].includes(iv.status) ? 'primary' : iv.status === 'Completed' ? 'success' : 'default'}>
                      {iv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule 3-Round Interview Section (Shows if Shortlisted/Replied) */}
        {applicant.stage === 'Replied' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Video className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Schedule Interview Round</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSchedulingOpen(!isSchedulingOpen)}
              >
                {isSchedulingOpen ? 'Cancel Scheduling' : 'Schedule Now'}
              </Button>
            </div>

            {isSchedulingOpen && (
              <div className="space-y-4 animate-fade-in bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Interview Round</label>
                    <select
                      value={interviewRound}
                      onChange={(e) => setInterviewRound(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:border-brand-red focus:ring-brand-red outline-none"
                    >
                      <option value={1}>Round 1 (Initial Interview)</option>
                      <option value={2}>Round 2 (Technical Interview)</option>
                      <option value={3}>Round 3 (Managerial Interview)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:border-brand-red focus:ring-brand-red outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign Interviewers * <span className="font-normal text-gray-400">(Hold Ctrl/Cmd to select multiple)</span></label>
                  <EmployeeSelect 
                    value={selectedInterviewers}
                    onChange={setSelectedInterviewers}
                    multiple={true}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:border-brand-red h-32"
                  />
                  <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Calendar invites (.ics) will be automatically emailed to all selected interviewers.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    variant="primary" 
                    icon={Calendar} 
                    isLoading={isScheduling}
                    onClick={handleScheduleInterview}
                  >
                    Confirm & Send Invites
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Candidate Slot Booking Token Banner */}
        {applicant.booking_url && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-bold text-amber-800">Candidate Slot Booking Link Active</h4>
              </div>
              <p className="text-sm text-amber-700/80 mt-1">
                Candidate was emailed the booking link. You can also share it directly:
              </p>
            </div>

            <button
              onClick={copyBookingLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-bold transition-colors shrink-0 shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}

        {/* Feedback / Scorecard Summary */}
        {applicant.interview_rating_summary && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Interviewer Feedback Summary</span>
            </div>
            <p className="text-sm text-gray-800 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              {applicant.interview_rating_summary}
            </p>
          </div>
        )}

        {/* Inline CV / Resume Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-red" />
              <span>Resume / CV Document</span>
            </h4>
            {applicant.resume_attachment && (
              <a
                href={applicant.resume_attachment}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-red hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <span>Open in new tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {applicant.resume_attachment ? (
            <div className="h-[480px] w-full rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden shadow-inner flex flex-col">
              <iframe
                src={applicant.resume_attachment}
                title="Candidate Resume"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">No resume attached to this application</p>
            </div>
          )}
        </div>

        {/* 1-Click Action Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {/* If Fresh Applied */}
          {applicant.stage === 'Open' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="primary"
                icon={Send}
                isLoading={isActionLoading}
                onClick={() => onShortlist(applicant)}
              >
                Shortlist & Move to Pipeline
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
          {applicant.stage === 'Replied' && (
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

          {/* If Candidate is Selected/Accepted. Send Offer Letter opens a
              small dialog where HR uploads the actual offer letter file
              from their machine — nothing is auto-generated or sent without
              a file being picked first. The email is threaded via Job
              Offer's reference_doctype/reference_name so the candidate's
              Gmail reply syncs back into ERPNext automatically through the
              already-configured "ST HR" Email Account (incoming + outgoing
              both enabled — no new credentials needed). Onboard as Employee
              stays a separate, deliberate step HR takes once the candidate
              has actually confirmed acceptance. */}
          {applicant.stage === 'Accepted' && (
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="secondary"
                icon={Send}
                onClick={() => setIsOfferLetterOpen(true)}
              >
                Send Offer Letter
              </Button>

              {/* `applicant.employee` comes from get_pipeline's batched
                  Employee-by-email lookup. Previously this button showed
                  unconditionally even after onboarding already succeeded,
                  so re-clicking just threw "Employee EMP-XXXXXX already
                  exists with this email" instead of not being offered at all. */}
              {applicant.employee ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <UserCheck className="h-4 w-4" />
                  Onboarded as {applicant.employee}
                </span>
              ) : (
                <Button
                  variant="primary"
                  icon={UserCheck}
                  isLoading={isActionLoading}
                  onClick={async () => {
                    try {
                      const res = await callApi('st_automation.api.recruitment.onboard_candidate', { applicant_id: applicant.name });
                      addToast(res.message, 'success');
                      onClose();
                    } catch (err) {
                      addToast(err.message || 'Failed to onboard candidate', 'error');
                    }
                  }}
                >
                  Onboard as Employee
                </Button>
              )}
            </div>
          )}

          {/* If Candidate is on the Bench / Talent Pool — previously a dead
              end with no way forward. Reconsider sends them back into the
              active pipeline (Replied stage) for a fresh decision; Reject
              lets HR formally close out a bench candidate who's no longer
              relevant instead of leaving them on the bench indefinitely. */}
          {applicant.stage === 'Hold' && (
            <div className="flex items-center gap-2.5 w-full justify-end">
              <Button
                variant="primary"
                icon={RefreshCcw}
                isLoading={isActionLoading}
                onClick={() => handleTriggerDecision('Reconsider')}
              >
                Reconsider for New Role
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Confirm Hiring Decision: {selectedDecision}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedDecision === 'Select' && 'This will mark candidate as Selected and auto-draft a Job Offer.'}
              {selectedDecision === 'Bench' && 'This will move candidate to Talent Pool / Bench and send them a polite "keeping you in mind" email.'}
              {selectedDecision === 'Reconsider' && 'This will move the candidate back into the active pipeline so you can make a fresh Select / Bench / Reject decision for a new role.'}
              {selectedDecision === 'Reject' && 'This will mark candidate as Rejected and trigger a polite notification email.'}
            </p>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Optional Notes / Reason</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Add any internal decision notes..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsDecisionOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={
                  selectedDecision === 'Select'
                    ? 'success'
                    : selectedDecision === 'Bench'
                      ? 'warning'
                      : selectedDecision === 'Reconsider'
                        ? 'primary'
                        : 'danger'
                }
                isLoading={isActionLoading}
                onClick={confirmDecision}
              >
                Confirm {selectedDecision}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Offer Letter — requires an actual file upload, nothing is
          auto-generated. The uploaded file is attached to the email
          exactly as HR provided it. */}
      {isOfferLetterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Send Offer Letter</h3>
            <p className="text-sm text-gray-500">
              Upload the offer letter file to email to {applicant.applicant_name}. The exact file you upload here is what gets attached and sent.
            </p>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Offer Letter File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setOfferLetterFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              {offerLetterFile && (
                <p className="mt-1.5 text-[13px] text-gray-500">Selected: {offerLetterFile.name}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOfferLetterOpen(false);
                  setOfferLetterFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Send}
                isLoading={isSendingOffer}
                disabled={!offerLetterFile}
                onClick={handleSendOfferLetter}
              >
                Send Offer Letter
              </Button>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
