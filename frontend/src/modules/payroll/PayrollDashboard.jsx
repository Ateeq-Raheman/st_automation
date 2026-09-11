import React from 'react';
import { 
  DollarSign, Users, CreditCard, Gift, PlayCircle, 
  CheckCircle2, AlertTriangle, FileText, ArrowRight, ShieldCheck, TrendingUp
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../api/client';

export function PayrollDashboard({
  summary,
  isLoading,
  month,
  year,
  setMonth,
  setYear,
  onRunPayroll,
  onQuickIncentive,
  onBulkIncentive,
  onNewLoan,
  onViewSalarySlips,
  recentStructureAssignments = []
}) {
  const months = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' },
    { num: 3, name: 'March' }, { num: 4, name: 'April' },
    { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' },
    { num: 9, name: 'September' }, { num: 10, name: 'October' },
    { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const readinessScore = summary?.readiness_score || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Payroll Command Center</h2>
          <p className="text-sm text-brand-grey">At-a-glance monthly readiness, incentives, loan deductions, and 1-click execution.</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-lg">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-brand-black dark:text-slate-50 px-2 py-1 focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num} className="bg-white dark:bg-slate-800 text-brand-black dark:text-slate-50">
                {m.name}
              </option>
            ))}
          </select>

          <span className="text-slate-600 font-bold">/</span>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-brand-black dark:text-slate-50 px-2 py-1 focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-800 text-brand-black dark:text-slate-50">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Action Banner: Run Payroll */}
      <div className="glass-panel rounded-3xl p-6 border border-brand-red/30 bg-gradient-to-r from-red-50 via-white to-purple-50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-brand-red/30 text-brand-red text-sm font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Ready for {months.find(m => m.num === month)?.name} {year}</span>
          </div>
          <h3 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">
            {summary?.is_fully_processed ? 'Payroll Completed for this Period' : 'Ready to Run Monthly Payroll?'}
          </h3>
          <p className="text-sm text-gray-700 dark:text-slate-200">
            {summary?.is_fully_processed 
              ? `Generated and submitted ${summary?.processed_slips_count} salary slips. Total payout: ${formatCurrency(summary?.total_net_payout)}.`
              : 'Our 1-click runner creates salary slips, calculates loan deductions & bonuses, and submits for all active employees.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
          <Button
            size="lg"
            variant="primary"
            icon={PlayCircle}
            onClick={onRunPayroll}
            className="shadow-glow w-full sm:w-auto"
          >
            {summary?.is_fully_processed ? 'Re-Run / Review Payroll' : 'Run Payroll Now'}
          </Button>

          {summary?.processed_slips_count > 0 && (
            <Button
              size="lg"
              variant="secondary"
              icon={FileText}
              onClick={onViewSalarySlips}
              className="w-full sm:w-auto"
            >
              View Payslips
            </Button>
          )}
        </div>
      </div>

      {/* Command Center Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Employees"
          value={summary?.active_employees || 0}
          subtitle={`${summary?.assigned_structure_count || 0} assigned salary structures`}
          icon={Users}
          color="indigo"
        />

        <StatCard
          title="Readiness Score"
          value={`${readinessScore}%`}
          subtitle={summary?.missing_structure_count > 0 ? `${summary.missing_structure_count} employees missing structure` : 'All structures verified'}
          icon={readinessScore === 100 ? CheckCircle2 : AlertTriangle}
          color={readinessScore === 100 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Pending Incentives"
          value={formatCurrency(summary?.total_incentives_amount || 0)}
          subtitle={`${summary?.pending_incentives_count || 0} bonus entries queued`}
          icon={Gift}
          color="cyan"
          onClick={onQuickIncentive}
        />

        <StatCard
          title="Active Employee Loans"
          value={summary?.active_loans_count || 0}
          subtitle="Auto-deducting on next payroll"
          icon={CreditCard}
          color="amber"
          onClick={onNewLoan}
        />
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Incentive Card */}
        <div className="glass-panel rounded-2xl p-5 border space-y-3 hover:border-brand-red/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-brand-red border border-indigo-200 w-fit">
              <Gift className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-brand-black dark:text-slate-50">Quick Bonus / Incentive</h4>
            <p className="text-sm text-brand-grey">
              Add performance bonus or one-time incentive for an employee in 2 clicks.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" variant="primary" onClick={onQuickIncentive}>
              Add Incentive
            </Button>
            <Button size="sm" variant="outline" onClick={onBulkIncentive}>
              Bulk Upload
            </Button>
          </div>
        </div>

        {/* Loan Application Card */}
        <div className="glass-panel rounded-2xl p-5 border space-y-3 hover:border-brand-red/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 w-fit">
              <CreditCard className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-brand-black dark:text-slate-50">Loan & Advance</h4>
            <p className="text-sm text-brand-grey">
              Auto-calculated monthly EMI with guaranteed 0-moratorium setup and disbursement.
            </p>
          </div>
          <div className="pt-2">
            <Button size="sm" variant="warning" onClick={onNewLoan}>
              New Loan Application
            </Button>
          </div>
        </div>

        {/* Salary Slip Viewer Card */}
        <div className="glass-panel rounded-2xl p-5 border space-y-3 hover:border-brand-red/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-brand-black dark:text-slate-50">Salary Slips & Distribution</h4>
            <p className="text-sm text-brand-grey">
              Preview branded PDF payslips, batch download ZIP, or trigger email delivery.
            </p>
          </div>
          <div className="pt-2">
            <Button size="sm" variant="success" onClick={onViewSalarySlips}>
              Open Payslips Hub
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Salary Structure Assignments — there was a way to *assign*
          a structure (the modal, from here or Loans & Advances) but nothing
          anywhere showed what had actually been assigned, so there was no
          way to confirm one worked short of running payroll and hoping. */}
      {recentStructureAssignments.length > 0 && (
        <div className="glass-panel rounded-2xl border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60">
            <h3 className="text-sm font-bold text-brand-black dark:text-slate-50">Recent Salary Structure Assignments</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-brand-grey font-bold uppercase text-[13px]">
                <th className="py-2.5 px-5">Employee</th>
                <th className="py-2.5 px-5">Structure</th>
                <th className="py-2.5 px-5">Base Salary</th>
                <th className="py-2.5 px-5">From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentStructureAssignments.map((row) => (
                <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-5">
                    <div className="font-bold text-brand-black dark:text-slate-50">{row.employee_name}</div>
                    <div className="text-[13px] text-brand-grey">{row.employee}</div>
                  </td>
                  <td className="py-3 px-5 text-gray-700 dark:text-slate-200">{row.salary_structure}</td>
                  <td className="py-3 px-5 font-semibold text-emerald-600">{formatCurrency(row.base)}</td>
                  <td className="py-3 px-5 text-brand-grey">{formatDate(row.from_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
