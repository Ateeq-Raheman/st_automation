import React, { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, DollarSign, Building2 } from 'lucide-react';
import { AssignSalaryStructureModal } from './AssignSalaryStructureModal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../api/client';

const LOAN_STATUS_VARIANT = {
  'Disbursed': 'success',
  'Partially Disbursed': 'primary',
  'Sanctioned': 'default',
  'Loan Closure Requested': 'warning',
  'Closed': 'default',
};

export function ActiveLoansView({ onLaunchLoanWizard, company, loans = [], isLoading = false, onRefresh }) {
  const [isAssignStructureOpen, setIsAssignStructureOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black tracking-tight">Loans & Advances</h2>
          <p className="text-sm text-brand-grey">
            Track active employee salary advances and automated payroll installments.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Building2}
            onClick={() => setIsAssignStructureOpen(true)}
          >
            Assign Structure
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={onLaunchLoanWizard}
          >
            New Loan Application
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-2xl border p-6 text-center text-sm text-brand-grey">
          Loading loans…
        </div>
      ) : loans.length === 0 ? (
        <div className="glass-panel rounded-2xl border p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-brand-black">Active Loan Management</h3>
          <p className="text-sm text-brand-grey max-w-md mx-auto">
            Loans created here automatically link repayment schedules directly to monthly payroll runs.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="warning" onClick={onLaunchLoanWizard}>
              New Loan Application
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[13px] font-bold uppercase tracking-wide text-brand-grey">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Loan Amount</th>
                <th className="px-4 py-3">Monthly EMI</th>
                <th className="px-4 py-3">Tenure</th>
                <th className="px-4 py-3">Disbursed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.name} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-bold text-brand-black">{loan.applicant_name || loan.applicant}</div>
                    <div className="text-[13px] text-brand-grey">{loan.name}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-black">{formatCurrency(loan.loan_amount)}</td>
                  <td className="px-4 py-3 text-brand-grey">{formatCurrency(loan.monthly_repayment_amount)} / mo</td>
                  <td className="px-4 py-3 text-brand-grey">{loan.repayment_periods} months</td>
                  <td className="px-4 py-3 text-brand-grey">{formatDate(loan.disbursement_date || loan.posting_date)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={LOAN_STATUS_VARIANT[loan.status] || 'default'}>{loan.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
