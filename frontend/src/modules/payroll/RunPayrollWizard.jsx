import React, { useState } from 'react';
import { 
  PlayCircle, CheckCircle2, AlertCircle, Users, DollarSign, 
  FileText, ArrowRight, ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { AssignSalaryStructureModal } from './AssignSalaryStructureModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate, callApi } from '../../api/client';
import { useToast } from '../../components/common/Toast';

export function RunPayrollWizard({
  company,
  month,
  year,
  onExecutePayroll,
  onViewSalarySlips,
  onRefresh
}) {
  const { addToast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [step, setStep] = useState(1); // 1: Ready to run, 2: Running, 3: Completed Report
  const [result, setResult] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('success');
  const [isAssignStructureOpen, setIsAssignStructureOpen] = useState(false);
  const [isSubmittingOfficial, setIsSubmittingOfficial] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleStartPayroll = async () => {
    setIsExecuting(true);
    setStep(2);
    try {
      const response = await onExecutePayroll(company, startDate, endDate);
      setResult(response);
      setStep(3);
      setIsSubmitted(false);
    } catch (err) {
      setStep(1);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitOfficial = async () => {
    if (!result?.payroll_entry) return;
    setIsSubmittingOfficial(true);
    try {
      const res = await callApi('st_automation.api.payroll.submit_payroll', {
        payroll_entry_id: result.payroll_entry
      });
      addToast(res.message || 'Payroll submitted officially!', 'success');
      setIsSubmitted(true);
    } catch (err) {
      addToast(err.message || 'Failed to submit payroll', 'error');
    } finally {
      setIsSubmittingOfficial(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Run Monthly Payroll</h2>
          <p className="text-sm text-brand-grey">
            Execute automated salary slip generation, loan installment deductions, and bonus disbursements.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAssignStructureOpen(true)}
        >
          Assign Structure
        </Button>
      </div>

      {/* Step 1: Pre-run Verification */}
      {step === 1 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-700 pb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-brand-red border border-indigo-200">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-black dark:text-slate-50">
                Period: {monthNames[month]} {year}
              </h3>
              <p className="text-sm text-brand-grey">
                Company: <span className="text-gray-800 dark:text-slate-100 font-semibold">{company || 'Default'}</span> | Dates: <span className="text-gray-800 dark:text-slate-100 font-semibold">{startDate} to {endDate}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-grey">
              What will happen in 1 click:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-slate-200">Fetches all active employees in {company || 'company'}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-slate-200">Auto-links active loan repayment installments</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-slate-200">Adds pending performance incentives & bonuses</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-slate-200">Generates and submits official Salary Slips</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end">
            <Button
              size="lg"
              variant="primary"
              icon={PlayCircle}
              onClick={handleStartPayroll}
            >
              Start Payroll Processing
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Processing Live Loader */}
      {step === 2 && (
        <div className="glass-panel rounded-3xl p-12 border text-center space-y-6 max-w-2xl mx-auto">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-brand-red/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full border-4 border-brand-red border-t-transparent animate-spin flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-brand-red animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brand-black dark:text-slate-50">Executing Payroll for {monthNames[month]} {year}...</h3>
            <p className="text-sm text-brand-grey">
              Generating salary slips, calculating earnings & deductions, and submitting records...
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Complete Report */}
      {step === 3 && result && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-200 bg-emerald-50 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-brand-black dark:text-slate-50">Draft Payroll Generated!</h3>
                  <p className="text-sm text-emerald-600">
                    {result.total_processed} Salary Slips drafted for {monthNames[month]} {year}. Please review before submitting.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  icon={FileText}
                  onClick={onViewSalarySlips}
                >
                  View Drafts
                </Button>
                {!isSubmitted ? (
                  result.total_net_payout > 0 ? (
                    <Button
                      variant="primary"
                      icon={CheckCircle2}
                      isLoading={isSubmittingOfficial}
                      onClick={handleSubmitOfficial}
                    >
                      Submit Official Payroll
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-400 dark:text-slate-500 text-sm font-bold cursor-not-allowed"
                        title="Cannot submit — all salary slips are ₹0.00. Assign salary structures first."
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Submit Official Payroll
                      </button>
                    </div>
                  )
                ) : (
                  <Badge variant="success">Submitted Officially</Badge>
                )}
              </div>
            </div>

            {/* Metric Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700">
                <span className="text-sm font-bold text-brand-grey block uppercase">Total Gross Earnings</span>
                <span className="text-xl font-heading font-bold text-brand-black dark:text-slate-50 mt-1 block">
                  {formatCurrency(result.total_gross)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700">
                <span className="text-sm font-bold text-brand-grey block uppercase">Total Deductions & Loans</span>
                <span className="text-xl font-heading font-bold text-rose-600 mt-1 block">
                  {formatCurrency(result.total_deductions)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700">
                <span className="text-sm font-bold text-brand-grey block uppercase">Net Payout Amount</span>
                <span className="text-xl font-heading font-bold text-emerald-600 mt-1 block">
                  {formatCurrency(result.total_net_payout)}
                </span>
              </div>
            </div>
          </div>

          {/* Zero Payout Warning Banner */}
          {result.total_net_payout === 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-2xl">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">All salary slips are ₹0.00 — Submission is blocked</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your employees do not have a <strong>Salary Structure</strong> assigned, so there is nothing to pay.
                  Click <strong>"Assign Structure"</strong> at the top right, assign a structure, then re-run payroll.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Employee Table */}
          <div className="glass-panel rounded-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveReportTab('success')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    activeReportTab === 'success' ? 'bg-brand-red text-white' : 'text-brand-grey hover:text-brand-black dark:text-slate-50'
                  }`}
                >
                  Succeeded ({result.successful?.length || 0})
                </button>
                {result.failed?.length > 0 && (
                  <button
                    onClick={() => setActiveReportTab('failed')}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                      activeReportTab === 'failed' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:text-brand-black dark:text-slate-50'
                    }`}
                  >
                    Action Needed ({result.failed.length})
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-brand-grey uppercase font-bold">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Gross Pay</th>
                    <th className="pb-3">Deductions</th>
                    <th className="pb-3">Net Payout</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {activeReportTab === 'success' ? (
                    result.successful?.map((row) => (
                      <tr key={row.salary_slip} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:bg-slate-900">
                        <td className="py-3 text-brand-black dark:text-slate-50 font-bold">{row.employee_name} ({row.employee})</td>
                        <td className="py-3 text-gray-700 dark:text-slate-200">{formatCurrency(row.gross_pay)}</td>
                        <td className="py-3 text-rose-600">{formatCurrency(row.total_deduction)}</td>
                        <td className="py-3 text-emerald-600 font-bold">{formatCurrency(row.net_pay)}</td>
                        <td className="py-3 text-right">
                          <Badge variant={isSubmitted ? "success" : "warning"}>
                            {isSubmitted ? "Submitted" : "Draft"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    result.failed?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:bg-slate-900">
                        <td className="py-3 text-brand-black dark:text-slate-50 font-bold">{row.employee_name || row.employee}</td>
                        <td colSpan={3} className="py-3 text-rose-600">{row.error}</td>
                        <td className="py-3 text-right">
                          <Badge variant="danger">Error</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AssignSalaryStructureModal
        isOpen={isAssignStructureOpen}
        onClose={() => setIsAssignStructureOpen(false)}
        company={company}
        onSuccess={onRefresh}
      />
    </div>
  );
}
