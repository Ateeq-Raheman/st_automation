import React from 'react';
import { Calendar, Clock, FileText, CheckCircle2, Star, UserCheck, MessageSquare } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDateTime } from '../../api/client';

export function MyInterviewsView({ interviews = [], onOpenFeedback, isLoading }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">My Scheduled Interviews</h2>
        <p className="text-sm text-slate-400">View upcoming candidates, review resumes inline, and submit 1-click scorecards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviews.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No scheduled interviews assigned</p>
          </div>
        ) : (
          interviews.map((item) => (
            <div
              key={item.interview_id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{item.applicant_name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5">{item.job_title}</p>
                </div>
                <Badge variant={item.status === 'Completed' ? 'success' : 'primary'}>
                  {item.status || 'Scheduled'}
                </Badge>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
                <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="font-semibold">{formatDateTime(item.scheduled_on)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {item.resume_attachment ? (
                  <a
                    href={item.resume_attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View CV</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No CV</span>
                )}

                <Button
                  size="sm"
                  variant={item.status === 'Completed' ? 'secondary' : 'primary'}
                  icon={MessageSquare}
                  onClick={() => onOpenFeedback(item)}
                >
                  {item.status === 'Completed' ? 'Update Feedback' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
