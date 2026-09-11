import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Building2, Save, ChevronDown, IndianRupee } from 'lucide-react';
import { callApi } from '../../api/client';
import { useToast } from '../../components/common/Toast';

export function AssignSalaryStructureModal({ isOpen, onClose, company, employee, onSuccess }) {
  const { addToast } = useToast();
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Default to 1st of the current month
  const firstDay = new Date();
  firstDay.setDate(1);
  const defaultDate = firstDay.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    employee: employee || '',
    salary_structure: '',
    base: '',
    from_date: defaultDate,
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (employee) {
        setFormData(prev => ({ ...prev, employee }));
      }
    }
  }, [isOpen, employee]);

  const loadData = async () => {
    try {
      // Fetch Salary Structures using our safe payroll API
      const ssRes = await callApi('st_automation.api.payroll.get_salary_structures', {
        company: company
      }, 'GET');
      setStructures(ssRes.data || []);

      // If no employee was passed, fetch active employees
      if (!employee) {
        const empRes = await callApi('st_automation.api.payroll.get_active_employees', {
          company: company
        }, 'GET');
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load modal data', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await callApi('st_automation.api.payroll.assign_salary_structure', {
        company,
        ...formData
      });
      // Previously this just closed silently on success — no confirmation
      // that anything actually happened, and a raw browser `alert()` (not
      // this app's own toast) on failure.
      addToast(res.message || 'Salary Structure assigned!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to assign salary structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Salary Structure"
      subtitle={`Assign a structure to enable payroll processing.`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {!employee && (
          <div>
            <label className="block text-sm font-bold text-brand-black dark:text-slate-50 mb-1.5">Employee</label>
            <select
              required
              value={formData.employee}
              onChange={(e) => setFormData(prev => ({ ...prev, employee: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.name} value={emp.name}>
                  {emp.employee_name} ({emp.name})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-brand-black dark:text-slate-50 mb-1.5">Salary Structure</label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
            <select
              required
              value={formData.salary_structure}
              onChange={(e) => setFormData(prev => ({ ...prev, salary_structure: e.target.value }))}
              className="w-full appearance-none bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="">Select Structure...</option>
              {structures.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
          </div>
        </div>

        <div>
          {/* Salary components in this system compute their formulas off
              this Base figure — an assignment created without one always
              ends up with base=0, so every payslip for that employee comes
              out to ₹0.00 (confirmed: every existing Salary Structure
              Assignment on this site has base=0.0, since this field never
              existed in this form before). Required here, not just at the
              DocType level, since silently defaulting to 0 is never a
              sensible value for a real salary. */}
          <label className="block text-sm font-bold text-brand-black dark:text-slate-50 mb-1.5">Base Salary (Monthly)</label>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
            <input
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 50000"
              value={formData.base}
              onChange={(e) => setFormData(prev => ({ ...prev, base: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-black dark:text-slate-50 mb-1.5">From Date</label>
          <input
            type="date"
            required
            value={formData.from_date}
            onChange={(e) => setFormData(prev => ({ ...prev, from_date: e.target.value }))}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            isLoading={loading}
          >
            Assign Structure
          </Button>
        </div>
      </form>
    </Modal>
  );
}
