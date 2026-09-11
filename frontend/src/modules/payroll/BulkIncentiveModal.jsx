import React, { useState } from 'react';
import { Plus, Trash2, Upload, FileSpreadsheet, Check } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import EmployeeSelect from '../../components/EmployeeSelect';

export function BulkIncentiveModal({ isOpen, onClose, onBulkSubmit, isSubmitting }) {
  const [rows, setRows] = useState([
    { employee: '', amount: '', component: 'Incentive', notes: '' },
    { employee: '', amount: '', component: 'Incentive', notes: '' },
    { employee: '', amount: '', component: 'Incentive', notes: '' },
  ]);

  const addRow = () => {
    setRows([...rows, { employee: '', amount: '', component: 'Incentive', notes: '' }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.employee.trim() && Number(r.amount) > 0);
    if (validRows.length === 0) return;
    onBulkSubmit(validRows);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Incentive & Bonus Grid"
      subtitle="Enter bonuses across multiple employees in seconds."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-brand-grey font-bold uppercase">
                <th className="pb-2">Employee *</th>
                <th className="pb-2">Amount (₹) *</th>
                <th className="pb-2">Component</th>
                <th className="pb-2">Notes</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="pr-3 pb-3">
                    <EmployeeSelect
                      value={row.employee}
                      onChange={(e) => updateRow(idx, 'employee', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="5000"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-brand-black dark:text-slate-50 font-bold focus:outline-none focus:border-brand-red"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={row.component}
                      onChange={(e) => updateRow(idx, 'component', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
                    >
                      <option value="Incentive">Incentive</option>
                      <option value="Performance Bonus">Bonus</option>
                      <option value="Commission">Commission</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      placeholder="Optional note"
                      value={row.notes}
                      onChange={(e) => updateRow(idx, 'notes', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
                    />
                  </td>
                  <td className="py-2 text-right">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-gray-500 dark:text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={addRow}
          >
            Add Another Row
          </Button>

          <span className="text-sm font-semibold text-brand-grey">
            {rows.filter(r => r.employee.trim() && Number(r.amount) > 0).length} valid entries
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={FileSpreadsheet}
            isLoading={isSubmitting}
          >
            Submit All Bonuses
          </Button>
        </div>
      </form>
    </Modal>
  );
}
