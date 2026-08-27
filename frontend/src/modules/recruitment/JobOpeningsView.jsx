import React from 'react';
import { Briefcase, Globe, Users, Plus, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export function JobOpeningsView({ jobOpenings = [], onTogglePublish, isLoading }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Job Openings</h2>
          <p className="text-sm text-slate-400">Manage open roles and career portal visibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobOpenings.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Briefcase className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No Job Openings found in ERPNext</p>
          </div>
        ) : (
          jobOpenings.map((job) => (
            <div
              key={job.name}
              className="glass-panel rounded-2xl p-5 border space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{job.job_title || job.name}</h3>
                  <Badge variant={job.status === 'Open' ? 'success' : 'default'}>
                    {job.status || 'Active'}
                  </Badge>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  {job.department && <p>Department: <span className="text-slate-200">{job.department}</span></p>}
                  {job.designation && <p>Designation: <span className="text-slate-200">{job.designation}</span></p>}
                  {job.no_of_vacancies > 0 && <p>Vacancies: <span className="text-slate-200">{job.no_of_vacancies}</span></p>}
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                  <Users className="h-4 w-4" />
                  <span>{job.applicant_count || 0} Candidates</span>
                </div>

                <button
                  onClick={() => onTogglePublish(job.name, !job.publish_on_website)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    job.publish_on_website
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{job.publish_on_website ? 'Published' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
