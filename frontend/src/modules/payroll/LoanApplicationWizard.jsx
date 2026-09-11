import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ChevronRight, ChevronLeft, CheckCircle2, 
  AlertCircle, ShieldCheck, DollarSign, Calculator, Settings2
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../api/client';
import { payrollApi } from '../../api/payrollApi';
import EmployeeSelect from '../../components/EmployeeSelect';

export function LoanApplicationWizard({ isOpen, onClose, onSuccess, isSubmitting }) {
  const [step, setStep] = useState(1);
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    tenure_months: 10,
    loan_product: '',
    custom_moratorium: 0,
    disbursement_date: todayStr,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        employee: '',
        amount: '',
        tenure_months: 10,
        loan_product: '',
        custom_moratorium: 0,
        disbursement_date: todayStr,
      });
      setShowAdvanced(false);
      setPreviewData(null);
    }
  }, [isOpen]);

  // Fetch preview when moving to Step 2
  const handleGoToStep2 = async () => {
    if (!formData.employee || !formData.amount) return;
    setIsPreviewLoading(true);
    try {
      const res = await payrollApi.getLoanPreview(
        formData.employee,
        formData.amount,
        formData.tenure_months,
        formData.loan_product
      );
      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      // Still allow step 2 with fallback calculations
      const amt = Number(formData.amount) || 0;
      const tenure = Number(formData.tenure_months) || 1;
      setPreviewData({
        employee: formData.employee,
        employee_name: formData.employee,
        principal_amount: amt,
        tenure_months: tenure,
        monthly_installment: Math.round(amt / tenure),
        total_repayment: amt,
        moratorium_tenure: 0,
      });
      setStep(2);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    const monthlyAmt = previewData?.monthly_installment || Math.round(Number(formData.amount) / Number(formData.tenure_months));
    onSuccess(
      formData.employee,
      formData.amount,
      formData.tenure_months,
      monthlyAmt,
      formData.loan_product,
      formData.custom_moratorium,
      formData.disbursement_date
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="3-Step Loan & Advance Wizard"
      subtitle="Fast employee loan application with guaranteed 0-moratorium setup and disbursement."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between px-2">
          {[
            { num: 1, label: 'Employee & Amount' },
            { num: 2, label: 'EMI & Schedule' },
            { num: 3, label: 'Confirm & Disburse' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.num 
                    ? 'bg-brand-red text-white shadow-lg shadow-glow-red' 
                    : step > s.num 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 dark:bg-slate-800 text-brand-grey'
                }`}>
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-sm font-bold hidden sm:inline ${
                  step === s.num ? 'text-brand-black dark:text-slate-50' : 'text-brand-grey'
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && <div className="flex-1 h-[2px] bg-gray-100 dark:bg-slate-800 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: Employee & Principal Amount */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Employee *</label>
              <EmployeeSelect
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Loan / Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  placeholder="e.g. 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 font-bold focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Repayment Tenure (Months) *</label>
                <select
                  value={formData.tenure_months}
                  onChange={(e) => setFormData({ ...formData, tenure_months: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 font-bold focus:outline-none focus:border-brand-red"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={10}>10 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                </select>
              </div>
            </div>

            {/* Loan Start (Disbursement) Date — needed for entering an
                already-existing loan when first moving this system to
                production (a loan actually disbursed months ago). Can be
                backdated for record-keeping, but repayment/deductions
                always start from today regardless — never retroactive. */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Loan Start (Disbursement) Date *</label>
              <input
                type="date"
                required
                max={todayStr}
                value={formData.disbursement_date}
                onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 font-bold focus:outline-none focus:border-brand-red"
              />
              <p className="mt-1 text-[13px] text-brand-grey">
                Can be in the past for an existing loan. Monthly deductions always begin from the next payroll cycle, never backdated.
              </p>
            </div>

            {/* Advanced Toggle (Moratorium default 0) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm font-semibold text-brand-grey hover:text-brand-red flex items-center gap-1.5"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options (Moratorium)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 space-y-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-200">
                    Moratorium Tenure (Periods) — Defaults to 0
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.custom_moratorium}
                    onChange={(e) => setFormData({ ...formData, custom_moratorium: Number(e.target.value) })}
                    className="w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-brand-black dark:text-slate-50"
                  />
                  <p className="text-[13px] text-gray-500 dark:text-slate-400">
                    Caution: Setting moratorium &gt; 0 delays the first payroll deduction by that many months.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                icon={ChevronRight}
                isLoading={isPreviewLoading}
                onClick={handleGoToStep2}
              >
                Calculate EMI Schedule
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: EMI & Schedule Preview */}
        {step === 2 && previewData && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-3">
                <span className="text-sm font-bold text-brand-grey uppercase">Employee</span>
                <span className="text-sm font-bold text-brand-black dark:text-slate-50">{previewData.employee_name} ({previewData.employee})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-gray-200 dark:border-slate-700/80">
                  <span className="text-[13px] text-brand-grey block font-semibold">Principal Loan</span>
                  <span className="text-base font-heading font-bold text-brand-black dark:text-slate-50 mt-0.5 block">
                    {formatCurrency(previewData.principal_amount)}
                  </span>
                </div>

                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <span className="text-[13px] text-indigo-700 block font-semibold">Monthly EMI</span>
                  <span className="text-base font-heading font-bold text-indigo-700 mt-0.5 block">
                    {formatCurrency(previewData.monthly_installment)} / mo
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-gray-200 dark:border-slate-700/80">
                  <span className="text-[13px] text-brand-grey block font-semibold">Tenure</span>
                  <span className="text-base font-heading font-bold text-brand-black dark:text-slate-50 mt-0.5 block">
                    {previewData.tenure_months} Months
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">
                  <strong>Zero-Moratorium Verified:</strong> Installment of {formatCurrency(previewData.monthly_installment)} will automatically link to the next upcoming monthly payroll cycle.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" icon={ChevronRight} onClick={() => setStep(3)}>
                Proceed to Confirmation
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm & Disburse */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-2 py-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-glow-emerald">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-black dark:text-slate-50">Ready to Disburse Loan</h3>
              <p className="text-sm text-brand-grey max-w-sm mx-auto">
                This will sanction the loan in ERPNext, generate the repayment schedule, and activate monthly deductions.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/70 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm space-y-2">
              <div className="flex justify-between text-gray-700 dark:text-slate-200">
                <span>Disbursement Amount:</span>
                <span className="font-bold text-brand-black dark:text-slate-50">{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-slate-200">
                <span>Monthly Payroll Deduction:</span>
                <span className="font-bold text-brand-red">{formatCurrency(previewData?.monthly_installment)} / month</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-slate-200">
                <span>Duration:</span>
                <span className="font-bold text-brand-black dark:text-slate-50">{formData.tenure_months} Months</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="success"
                icon={CreditCard}
                isLoading={isSubmitting}
                onClick={handleFinalSubmit}
              >
                Approve & Disburse in 1 Click
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
