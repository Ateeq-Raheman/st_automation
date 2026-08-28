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
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employee || !formData.amount) return;
    onAddIncentive(
      formData.employee,
      formData.amount,
      formData.salary_component,
      formData.payroll_date,
      formData.notes
    );
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
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Employee *</label>
          <EmployeeSelect
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Incentive Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black font-bold focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Bonus Component</label>
            <select
              value={formData.salary_component}
              onChange={(e) => setFormData({ ...formData, salary_component: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
            >
              <option value="Incentive">Incentive</option>
              <option value="Performance Bonus">Performance Bonus</option>
              <option value="Commission">Sales Commission</option>
              <option value="Festival Bonus">Festival Bonus</option>
              <option value="Special Allowance">Special Allowance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Payroll Date</label>
          <input
            type="date"
            value={formData.payroll_date}
            onChange={(e) => setFormData({ ...formData, payroll_date: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason / Description</label>
          <input
            type="text"
            placeholder="e.g. Q3 Sales Target Achievement"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
