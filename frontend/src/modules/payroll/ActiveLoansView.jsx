import React, { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, DollarSign, Building2 } from 'lucide-react';
import { AssignSalaryStructureModal } from './AssignSalaryStructureModal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../api/client';

export function ActiveLoansView({ onLaunchLoanWizard, company }) {
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

      <div className="glass-panel rounded-2xl border p-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center mx-auto">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-brand-black">Active Loan Management</h3>
        <p className="text-xs text-brand-grey max-w-md mx-auto">
          Loans created here automatically link repayment schedules directly to monthly payroll runs.
        </p>
        <div className="pt-2">
          <Button size="sm" variant="warning" onClick={onLaunchLoanWizard}>
            New Loan Application
          </Button>
        </div>
      </div>

      <AssignSalaryStructureModal
        isOpen={isAssignStructureOpen}
        onClose={() => setIsAssignStructureOpen(false)}
        company={company}
      />
    </div>
  );
}
