import React from 'react';
import { 
  Activity, CheckCircle2, AlertTriangle, AlertCircle, 
  Wrench, RefreshCw, ShieldCheck, Sparkles, Database
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export function DiagnosticsView({ healthData, isLoading, onRefresh, onAutoFix, isFixing }) {
  const checks = healthData?.checks || [];
  const isHealthy = healthData?.overall_status === 'healthy';

  // Was `bg-*-950` (dark) + `text-*-400` (light) on every status — a
  // dark-mode pair inside this light-themed app, rendering low-contrast.
  const statusIcons = {
    pass: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    action_required: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    info: { icon: Activity, color: 'text-brand-red', bg: 'bg-indigo-50 border-indigo-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">System Readiness & Setup</h2>
          <p className="text-sm text-brand-grey">
            Pre-flight checks and 1-click self-healing for ERPNext configuration prerequisites.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={isLoading}
          onClick={onRefresh}
        >
          Re-Check Diagnostics
        </Button>
      </div>

      {/* Overall Health Banner */}
      <div className={`glass-panel rounded-3xl p-6 border ${
        isHealthy ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      } flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${isHealthy ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isHealthy ? <ShieldCheck className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-black dark:text-slate-50">
              {isHealthy ? 'All Systems Verified & Ready!' : 'Setup Action Items Detected'}
            </h3>
            <p className="text-sm text-gray-700 dark:text-slate-200 mt-0.5">
              {isHealthy 
                ? 'Recruitment pipelines, loan self-healing, and payroll processors are fully configured.' 
                : 'Some ERPNext settings require attention before running full payroll.'}
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-3">
        {checks.map((check) => {
          const cfg = statusIcons[check.status] || statusIcons.info;
          const Icon = cfg.icon;

          return (
            <div
              key={check.id}
              className="glass-panel rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gray-300 dark:border-slate-600 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2 rounded-xl border mt-0.5 ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-brand-black dark:text-slate-50">{check.title}</h4>
                    <Badge variant={check.status === 'pass' ? 'success' : check.status === 'warning' ? 'warning' : 'danger'}>
                      {check.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-brand-grey">{check.message}</p>
                </div>
              </div>

              {check.can_auto_fix && check.status !== 'pass' && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Wrench}
                  isLoading={isFixing}
                  onClick={() => onAutoFix(check.id)}
                  className="shrink-0"
                >
                  Auto-Fix Issue
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
