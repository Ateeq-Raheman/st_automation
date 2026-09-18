import React from 'react';
import { Briefcase, Globe, Users, Plus, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export function JobOpeningsView({ jobOpenings = [], onTogglePublish, isLoading, onNewJobOpening }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Job Openings</h2>
          <p className="text-sm text-brand-grey">Manage open roles and career portal visibility.</p>
        </div>

        <Button variant="primary" icon={Plus} onClick={onNewJobOpening}>
          New Job Opening
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobOpenings.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/40">
            <Briefcase className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-brand-grey">No Job Openings found in ERPNext</p>
          </div>
        ) : (
          jobOpenings.map((job) => (
            <div
              key={job.name}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm shadow-gray-200/50 space-y-4 hover:shadow-md hover:border-brand-red/40 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-brand-black dark:text-slate-50 tracking-tight">{job.job_title || job.name}</h3>
                  <Badge variant={job.status === 'Open' ? 'success' : 'default'}>
                    {job.status || 'Active'}
                  </Badge>
                </div>

                <div className="text-sm text-brand-grey space-y-1">
                  {job.department && <p>Department: <span className="text-gray-800 dark:text-slate-100">{job.department}</span></p>}
                  {job.designation && <p>Designation: <span className="text-gray-800 dark:text-slate-100">{job.designation}</span></p>}
                  {job.vacancies > 0 && <p>Vacancies: <span className="text-gray-800 dark:text-slate-100">{job.vacancies}</span></p>}
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-red">
                  <Users className="h-4 w-4" />
                  <span>{job.applicant_count || 0} Candidates</span>
                </div>

                <button
                  onClick={() => onTogglePublish(job.name, !job.publish)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    job.publish
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 dark:bg-slate-800 text-brand-grey hover:bg-gray-200 hover:text-brand-black dark:text-slate-50'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{job.publish ? 'Published' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
