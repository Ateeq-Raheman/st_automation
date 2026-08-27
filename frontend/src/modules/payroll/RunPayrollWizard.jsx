import React, { useState } from 'react';
import { 
  PlayCircle, CheckCircle2, AlertCircle, Users, DollarSign, 
  FileText, ArrowRight, ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../api/client';

export function RunPayrollWizard({ 
  company, 
  month, 
  year, 
  onExecutePayroll, 
  onViewSalarySlips 
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [step, setStep] = useState(1); // 1: Ready to run, 2: Running, 3: Completed Report
  const [result, setResult] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('success');

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
    } catch (err) {
      setStep(1);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Run Monthly Payroll</h2>
          <p className="text-sm text-slate-400">
            Execute automated salary slip generation, loan installment deductions, and bonus disbursements.
          </p>
        </div>
      </div>

      {/* Step 1: Pre-run Verification */}
      {step === 1 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-6 max-w-3xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Period: {monthNames[month]} {year}
              </h3>
              <p className="text-xs text-slate-400">
                Company: <span className="text-slate-200 font-semibold">{company || 'Default'}</span> | Dates: <span className="text-slate-200 font-semibold">{startDate} to {endDate}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              What will happen in 1 click:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">Fetches all active employees in {company || 'company'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">Auto-links active loan repayment installments</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">Adds pending performance incentives & bonuses</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">Generates and submits official Salary Slips</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
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
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Executing Payroll for {monthNames[month]} {year}...</h3>
            <p className="text-xs text-slate-400">
              Generating salary slips, calculating earnings & deductions, and submitting records...
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Complete Report */}
      {step === 3 && result && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 bg-emerald-950/20 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Payroll Completed Successfully!</h3>
                  <p className="text-xs text-emerald-300">
                    {result.total_processed} Salary Slips processed for {monthNames[month]} {year}.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                icon={FileText}
                onClick={onViewSalarySlips}
              >
                View Generated Payslips
              </Button>
            </div>

            {/* Metric Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 block uppercase">Total Gross Earnings</span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  {formatCurrency(result.total_gross)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 block uppercase">Total Deductions & Loans</span>
                <span className="text-xl font-extrabold text-rose-400 mt-1 block">
                  {formatCurrency(result.total_deductions)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 block uppercase">Net Payout Amount</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                  {formatCurrency(result.total_net_payout)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Employee Table */}
          <div className="glass-panel rounded-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveReportTab('success')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeReportTab === 'success' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Succeeded ({result.successful?.length || 0})
                </button>
                {result.failed?.length > 0 && (
                  <button
                    onClick={() => setActiveReportTab('failed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeReportTab === 'failed' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-white'
                    }`}
                  >
                    Action Needed ({result.failed.length})
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Gross Pay</th>
                    <th className="pb-3">Deductions</th>
                    <th className="pb-3">Net Payout</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {activeReportTab === 'success' ? (
                    result.successful?.map((row) => (
                      <tr key={row.salary_slip} className="hover:bg-slate-900/60">
                        <td className="py-3 text-white font-bold">{row.employee_name} ({row.employee})</td>
                        <td className="py-3 text-slate-300">{formatCurrency(row.gross_pay)}</td>
                        <td className="py-3 text-rose-400">{formatCurrency(row.total_deduction)}</td>
                        <td className="py-3 text-emerald-400 font-bold">{formatCurrency(row.net_pay)}</td>
                        <td className="py-3 text-right">
                          <Badge variant="success">Submitted</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    result.failed?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-3 text-white font-bold">{row.employee_name || row.employee}</td>
                        <td colSpan={3} className="py-3 text-rose-400">{row.error}</td>
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
    </div>
  );
}
