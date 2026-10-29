import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../api/client';
import { salaryStructureApi } from '../../api/salaryStructureApi';
import { SalaryStructureFormModal } from './SalaryStructureFormModal';
import { AssignSalaryStructureModal } from './AssignSalaryStructureModal';

const DOC_STATUS = { 0: ['Draft', 'warning'], 1: ['Submitted', 'success'], 2: ['Cancelled', 'danger'] };

export function SalaryStructureView({ company, onChanged }) {
  const { addToast } = useToast();
  const [tab, setTab] = useState('structures');
  const [structures, setStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState({ open: false, name: null });
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, a] = await Promise.all([
        salaryStructureApi.listStructures(company),
        salaryStructureApi.listAssignments(company),
      ]);
      setStructures(s.data || []);
      setAssignments(a.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load salary structures', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { load(); onChanged?.(); };

  const removeStructure = async (name) => {
    if (!window.confirm(`Delete Salary Structure "${name}"? Submitted structures are cancelled first.`)) return;
    try {
      const res = await salaryStructureApi.deleteStructure(name);
      addToast(res.message, 'success');
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const removeAssignment = async (name) => {
    if (!window.confirm(`Remove assignment ${name}? It will be cancelled and deleted.`)) return;
    try {
      const res = await salaryStructureApi.deleteAssignment(name);
      addToast(res.message, 'success');
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const q = search.trim().toLowerCase();
  const shownStructures = structures.filter((s) => !q || `${s.name} ${s.company}`.toLowerCase().includes(q));
  const shownAssignments = assignments.filter((a) =>
    !q || `${a.employee} ${a.employee_name} ${a.salary_structure}`.toLowerCase().includes(q));

  return (
    <div className="space-y-6" id="salary-structure-section">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">Salary Structures</h2>
          <p className="text-sm text-brand-grey">Create structures and see every assignment, synced live with ERPNext.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Building2} onClick={() => setIsAssignOpen(true)}>Assign Structure</Button>
          <Button variant="primary" icon={Plus} onClick={() => setFormState({ open: true, name: null })}>New Structure</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 p-1 bg-gray-50 dark:bg-slate-900/60">
          {[['structures', `Structures (${structures.length})`], ['assignments', `Assignments (${assignments.length})`]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-brand-red text-white' : 'text-brand-grey hover:text-brand-black dark:hover:text-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'structures' ? 'Filter structures…' : 'Filter by employee or structure…'}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-2xl border p-6 text-center text-sm text-brand-grey">Loading…</div>
      ) : tab === 'structures' ? (
        shownStructures.length === 0 ? (
          <div className="glass-panel rounded-2xl border p-8 text-center space-y-3">
            <Layers className="h-8 w-8 mx-auto text-brand-grey" />
            <p className="text-sm text-brand-grey">No salary structures yet.</p>
            <Button size="sm" icon={Plus} onClick={() => setFormState({ open: true, name: null })}>Create one</Button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-[13px] font-bold uppercase tracking-wide text-brand-grey">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Active</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {shownStructures.map((s) => (
                  <tr key={s.name} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-brand-black dark:text-slate-50">{s.name}</td>
                    <td className="px-4 py-3 text-brand-grey">{s.company}</td>
                    <td className="px-4 py-3 text-brand-grey">{s.payroll_frequency}</td>
                    <td className="px-4 py-3"><Badge variant={s.is_active === 'Yes' ? 'success' : 'default'}>{s.is_active}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={DOC_STATUS[s.docstatus][1]}>{DOC_STATUS[s.docstatus][0]}</Badge></td>
                    <td className="px-4 py-3 text-brand-grey">{s.assignments} employee{s.assignments === 1 ? '' : 's'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title="Open" onClick={() => setFormState({ open: true, name: s.name })} className="p-1.5 rounded-lg text-brand-grey hover:text-brand-red hover:bg-red-50"><Pencil className="h-4 w-4" /></button>
                        <button title="Delete" onClick={() => removeStructure(s.name)} className="p-1.5 rounded-lg text-brand-grey hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : shownAssignments.length === 0 ? (
        <div className="glass-panel rounded-2xl border p-8 text-center text-sm text-brand-grey">No assignments found.</div>
      ) : (
        <div className="glass-panel rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-[13px] font-bold uppercase tracking-wide text-brand-grey">
                <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Designation</th><th className="px-4 py-3">Salary Structure</th>
                <th className="px-4 py-3">Base</th><th className="px-4 py-3">From</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shownAssignments.map((a) => (
                <tr key={a.name} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-brand-black dark:text-slate-50">{a.employee_name}</div>
                    <div className="text-[13px] text-brand-grey">{a.employee}</div>
                  </td>
                  <td className="px-4 py-3 text-brand-grey">{a.designation || '-'}</td>
                  <td className="px-4 py-3 text-brand-black dark:text-slate-50 font-medium">{a.salary_structure}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(a.base)}</td>
                  <td className="px-4 py-3 text-brand-grey">{formatDate(a.from_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <button title="Remove assignment" onClick={() => removeAssignment(a.name)} className="p-1.5 rounded-lg text-brand-grey hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SalaryStructureFormModal
        isOpen={formState.open}
        structureName={formState.name}
        company={company}
        onClose={() => setFormState({ open: false, name: null })}
        onSaved={refresh}
      />
      <AssignSalaryStructureModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        company={company}
        onSuccess={refresh}
      />
    </div>
  );
}
