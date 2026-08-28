import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Building2, Save } from 'lucide-react';
import { callApi } from '../../api/client';

export function AssignSalaryStructureModal({ isOpen, onClose, company, employee, onSuccess }) {
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
      await callApi('st_automation.api.payroll.assign_salary_structure', {
        company,
        ...formData
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to assign salary structure');
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
            <label className="block text-xs font-bold text-brand-black mb-1.5">Employee</label>
            <select
              required
              value={formData.employee}
              onChange={(e) => setFormData(prev => ({ ...prev, employee: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
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
          <label className="block text-xs font-bold text-brand-black mb-1.5">Salary Structure</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
            <select
              required
              value={formData.salary_structure}
              onChange={(e) => setFormData(prev => ({ ...prev, salary_structure: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="">Select Structure...</option>
              {structures.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-black mb-1.5">From Date</label>
          <input
            type="date"
            required
            value={formData.from_date}
            onChange={(e) => setFormData(prev => ({ ...prev, from_date: e.target.value }))}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
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
