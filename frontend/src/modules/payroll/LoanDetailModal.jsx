import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ToastContext } from '../../components/common/Toast';
import { formatCurrency, formatDate, callApi } from '../../api/client';
import { payrollApi } from '../../api/payrollApi';
import { CreditCard, Calendar, User, FileText, CheckCircle2, DollarSign } from 'lucide-react';

export function LoanDetailModal({ loanId, onClose, onRefresh }) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId]);

  const handleDisburse = async () => {
    setIsDisbursing(true);
    try {
      await payrollApi.disburseLoan(loanId, new Date().toISOString().split('T')[0]);
      addToast(`Loan ${loanId} disbursed successfully!`, 'success');
      if (onRefresh) onRefresh();
      fetchLoanDetails(); // refresh details
    } catch (err) {
      addToast(err.message || 'Failed to disburse loan', 'error');
    } finally {
      setIsDisbursing(false);
    }
  };

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const res = await callApi('frappe.client.get', {
        doctype: 'Loan',
        name: loanId
      });
      setLoan(res.message);
    } catch (err) {
      console.error('Failed to fetch loan details:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_VARIANT = {
    'Disbursed': 'success',
    'Partially Disbursed': 'primary',
    'Sanctioned': 'default',
    'Loan Closure Requested': 'warning',
    'Closed': 'default',
  };

  if (!loanId) return null;

  return (
    <Modal
      isOpen={!!loanId}
      onClose={onClose}
      title="Loan Details"
      subtitle={loanId}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-brand-grey text-sm">
          Loading loan details...
        </div>
      ) : loan ? (
        <div className="space-y-8 pt-2">
          {/* Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1">Status</p>
                <Badge variant={STATUS_VARIANT[loan.status] || 'default'}>{loan.status}</Badge>
              </div>
              {loan.status === 'Sanctioned' && (
                <div className="mt-3">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0" 
                    icon={DollarSign}
                    isLoading={isDisbursing}
                    onClick={handleDisburse}
                  >
                    Disburse
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1">Loan Amount</p>
              <p className="font-bold text-brand-black dark:text-slate-50">{formatCurrency(loan.loan_amount)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1">Monthly EMI</p>
              <p className="font-bold text-brand-black dark:text-slate-50">{formatCurrency(loan.monthly_repayment_amount)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1">Total Paid</p>
              <p className="font-bold text-emerald-600">{formatCurrency(loan.total_amount_paid || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-brand-black dark:text-slate-50 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-red" />
                  Applicant Details
                </h4>
                <div className="space-y-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-grey">Employee</span>
                    <span className="text-sm font-semibold text-brand-black dark:text-slate-50">{loan.applicant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-grey">Employee ID</span>
                    <span className="text-sm font-semibold text-brand-black dark:text-slate-50">{loan.applicant}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-brand-black dark:text-slate-50 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-red" />
                  Timeline
                </h4>
                <div className="space-y-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-grey">Posting Date</span>
                    <span className="text-sm font-semibold text-brand-black dark:text-slate-50">{formatDate(loan.posting_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-grey">Disbursement Date</span>
                    <span className="text-sm font-semibold text-brand-black dark:text-slate-50">{loan.disbursement_date ? formatDate(loan.disbursement_date) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-brand-grey">Tenure</span>
                    <span className="text-sm font-semibold text-brand-black dark:text-slate-50">{loan.repayment_periods} months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h4 className="text-sm font-bold text-brand-black dark:text-slate-50 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-red" />
                Repayment Schedule
              </h4>
              <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-white/50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-md">
                      <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-[11px] font-bold uppercase tracking-wider text-brand-grey">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {loan.repayment_schedule && loan.repayment_schedule.map((row, idx) => (
                        <tr key={idx} className="text-sm">
                          <td className="px-4 py-2.5 font-medium text-brand-black dark:text-slate-50">{formatDate(row.payment_date)}</td>
                          <td className="px-4 py-2.5 text-brand-grey">{formatCurrency(row.total_payment)}</td>
                          <td className="px-4 py-2.5 text-right">
                            {row.is_paid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                            ) : (
                              <span className="text-xs text-brand-grey">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!loan.repayment_schedule || loan.repayment_schedule.length === 0) && (
                        <tr>
                          <td colSpan="3" className="px-4 py-6 text-center text-brand-grey text-sm">
                            No repayment schedule found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-red-500 text-sm font-medium">
          Error: Could not load loan details.
        </div>
      )}
    </Modal>
  );
}
