import React, { useState } from 'react';
import { Gift, DollarSign, User, Calendar, FileText } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import EmployeeSelect from '../../components/EmployeeSelect';

export function QuickIncentiveModal({ isOpen, onClose, onAddIncentive, isSubmitting }) {
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    salary_component: 'Incentive',
    payroll_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false,
    from_date: new Date().toISOString().split('T')[0],
    to_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employee || !formData.amount) return;
    if (formData.is_recurring && !formData.from_date) return;
    onAddIncentive(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Bonus / Incentive"
      subtitle="Record performance bonus or one-time incentive without raw ERPNext form fields."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Employee *</label>
          <EmployeeSelect
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Incentive Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 font-bold focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Bonus Component</label>
            <select
              value={formData.salary_component}
              onChange={(e) => setFormData({ ...formData, salary_component: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            >
              <option value="Incentive">Incentive</option>
              <option value="Performance Bonus">Performance Bonus</option>
              <option value="Commission">Sales Commission</option>
              <option value="Festival Bonus">Festival Bonus</option>
              <option value="Special Allowance">Special Allowance</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-brand-red focus:ring-brand-red"
          />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            Recurring — apply this every payroll run automatically (e.g. a monthly allowance), instead of a one-time bonus
          </span>
        </label>

        {formData.is_recurring ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Starts From *</label>
              <input
                type="date"
                required
                value={formData.from_date}
                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Ends On (leave blank to continue indefinitely)</label>
              <input
                type="date"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Payroll Date</label>
            <input
              type="date"
              value={formData.payroll_date}
              onChange={(e) => setFormData({ ...formData, payroll_date: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Reason / Description</label>
          <input
            type="text"
            placeholder="e.g. Q3 Sales Target Achievement"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Gift}
            isLoading={isSubmitting}
          >
            Add Incentive
          </Button>
        </div>
      </form>
    </Modal>
  );
}
