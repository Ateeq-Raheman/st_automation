import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../api/client';
import { salaryStructureApi } from '../../api/salaryStructureApi';

const inputCls = 'w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red disabled:opacity-60';
const cellCls = 'w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-brand-red disabled:opacity-60';

const emptyRow = () => ({
  salary_component: '', amount_based_on_formula: 0, formula: '', amount: '',
  condition: '', depends_on_payment_days: 0, do_not_include_in_total: 0, statistical_component: 0,
});

const emptyForm = (company, currency) => ({
  structure_name: '',
  company: company || '',
  currency: currency || 'INR',
  is_active: 'Yes',
  is_default: 'No',
  payroll_frequency: 'Monthly',
  letter_head: '',
  mode_of_payment: '',
  salary_slip_based_on_timesheet: 0,
  leave_encashment_amount_per_day: '',
  max_benefits: '',
  earnings: [emptyRow()],
  deductions: [],
});

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-brand-black dark:text-slate-50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ComponentTable({ title, rows, components, onChange, locked }) {
  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const pickComponent = (i, name) => {
    // Pre-fill from the Salary Component master, as the ERPNext desk form does.
    const c = components.find((x) => x.name === name);
    update(i, c ? {
      salary_component: name,
      amount_based_on_formula: c.amount_based_on_formula ? 1 : 0,
      formula: c.formula || '',
      amount: c.amount || '',
      depends_on_payment_days: c.depends_on_payment_days ? 1 : 0,
      statistical_component: c.statistical_component ? 1 : 0,
      do_not_include_in_total: c.do_not_include_in_total ? 1 : 0,
    } : { salary_component: name });
  };
  const total = rows.reduce((t, r) => t + (r.amount_based_on_formula ? 0 : Number(r.amount) || 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wide text-brand-grey">{title}</h4>
        {!locked && (
          <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={() => onChange([...rows, emptyRow()])}>
            Add Row
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-brand-grey">No rows.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <select
                  disabled={locked}
                  value={row.salary_component}
                  onChange={(e) => pickComponent(i, e.target.value)}
                  className={`${cellCls} sm:col-span-5`}
                >
                  <option value="">Select component…</option>
                  {components.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                {row.amount_based_on_formula ? (
                  <input
                    disabled={locked}
                    placeholder="Formula, e.g. base * 0.4"
                    value={row.formula || ''}
                    onChange={(e) => update(i, { formula: e.target.value })}
                    className={`${cellCls} sm:col-span-6 font-mono`}
                  />
                ) : (
                  <input
                    disabled={locked}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => update(i, { amount: e.target.value })}
                    className={`${cellCls} sm:col-span-6`}
                  />
                )}
                {!locked && (
                  <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="sm:col-span-1 justify-self-end p-1.5 rounded-lg text-brand-grey hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-700 dark:text-slate-300">
                {[
                  ['amount_based_on_formula', 'Amount based on formula'],
                  ['depends_on_payment_days', 'Depends on payment days'],
                  ['statistical_component', 'Statistical'],
                  ['do_not_include_in_total', 'Not in total'],
                ].map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-1.5">
                    <input type="checkbox" disabled={locked} checked={!!row[key]} onChange={(e) => update(i, { [key]: e.target.checked ? 1 : 0 })} />
                    {label}
                  </label>
                ))}
              </div>
              <input
                disabled={locked}
                placeholder="Condition (optional), e.g. base > 20000"
                value={row.condition || ''}
                onChange={(e) => update(i, { condition: e.target.value })}
                className={`${cellCls} font-mono`}
              />
            </div>
          ))}
        </div>
      )}
      <p className="text-[13px] text-brand-grey text-right">Fixed amounts total: <strong>{formatCurrency(total)}</strong> (formula rows are computed from Base at assignment)</p>
    </div>
  );
}

export function SalaryStructureFormModal({ isOpen, onClose, structureName, company, onSaved }) {
  const { addToast } = useToast();
  const [meta, setMeta] = useState({ components: [], companies: [], currencies: [], modes_of_payment: [], letter_heads: [], payroll_frequencies: [] });
  const [form, setForm] = useState(emptyForm(company));
  const [docstatus, setDocstatus] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = !!structureName;
  // ERPNext only lets is_active / is_default change once submitted.
  const locked = isEdit && docstatus === 1;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const metaRes = await salaryStructureApi.getFormMetadata(company);
        if (cancelled) return;
        setMeta(metaRes.data);
        if (isEdit) {
          const res = await salaryStructureApi.getStructure(structureName);
          if (cancelled) return;
          const d = res.data;
          setDocstatus(d.docstatus);
          setForm({ ...emptyForm(), ...d, structure_name: d.name, earnings: d.earnings || [], deductions: d.deductions || [] });
        } else {
          setDocstatus(0);
          setForm(emptyForm(company, metaRes.data.default_currency));
        }
      } catch (err) {
        addToast(err.message || 'Failed to load form', 'error');
        onClose();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, structureName, company]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (submit) => {
    if (!isEdit && !form.structure_name.trim()) return addToast('Structure name is required', 'error');
    if (!locked && form.earnings.filter((r) => r.salary_component).length === 0) {
      return addToast('Add at least one earning component', 'error');
    }
    setIsSaving(true);
    try {
      const res = await salaryStructureApi.saveStructure(form, isEdit ? structureName : null, submit);
      addToast(res.message || 'Saved', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to save Salary Structure', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Salary Structure: ${structureName}` : 'New Salary Structure'}
      subtitle={locked ? 'Submitted — only Active / Default can be changed.' : 'Fields mirror the ERPNext Salary Structure.'}
      maxWidth="max-w-4xl"
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-brand-grey">Loading…</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Structure Name *">
              <input required disabled={isEdit} value={form.structure_name} onChange={(e) => set({ structure_name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Company *">
              <select disabled={isEdit} value={form.company} onChange={(e) => set({ company: e.target.value })} className={inputCls}>
                <option value="">Select…</option>
                {meta.companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Currency *">
              <select disabled={locked} value={form.currency} onChange={(e) => set({ currency: e.target.value })} className={inputCls}>
                {meta.currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Payroll Frequency">
              <select disabled={locked} value={form.payroll_frequency} onChange={(e) => set({ payroll_frequency: e.target.value })} className={inputCls}>
                {meta.payroll_frequencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Is Active">
              <select value={form.is_active} onChange={(e) => set({ is_active: e.target.value })} className={inputCls}>
                <option>Yes</option><option>No</option>
              </select>
            </Field>
            <Field label="Is Default">
              <select value={form.is_default} onChange={(e) => set({ is_default: e.target.value })} className={inputCls}>
                <option>No</option><option>Yes</option>
              </select>
            </Field>
            <Field label="Letter Head">
              <select disabled={locked} value={form.letter_head || ''} onChange={(e) => set({ letter_head: e.target.value })} className={inputCls}>
                <option value="">None</option>
                {meta.letter_heads.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Mode of Payment">
              <select disabled={locked} value={form.mode_of_payment || ''} onChange={(e) => set({ mode_of_payment: e.target.value })} className={inputCls}>
                <option value="">None</option>
                {meta.modes_of_payment.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Leave Encashment Amount / Day">
              <input disabled={locked} type="number" min="0" value={form.leave_encashment_amount_per_day ?? ''} onChange={(e) => set({ leave_encashment_amount_per_day: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Max Benefits (Yearly)">
              <input disabled={locked} type="number" min="0" value={form.max_benefits ?? ''} onChange={(e) => set({ max_benefits: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <ComponentTable title="Earnings" rows={form.earnings} components={meta.components.filter((c) => c.type === 'Earning')} onChange={(rows) => set({ earnings: rows })} locked={locked} />
          <ComponentTable title="Deductions" rows={form.deductions} components={meta.components.filter((c) => c.type === 'Deduction')} onChange={(rows) => set({ deductions: rows })} locked={locked} />

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary" icon={Save} isLoading={isSaving}>
              {locked ? 'Update' : 'Save Draft'}
            </Button>
            {!locked && (
              <Button type="button" variant="primary" icon={Save} isLoading={isSaving} onClick={() => save(true)}>
                Save & Submit
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
