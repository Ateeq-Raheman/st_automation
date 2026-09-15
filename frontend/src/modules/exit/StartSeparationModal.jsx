import React, { useState, useEffect } from 'react';
import { exitApi } from '../../api/exitApi';
import { useToast } from '../../components/common/Toast';
import { X, UserMinus, Search, Calendar } from 'lucide-react';

export function StartSeparationModal({ isOpen, onClose, company, onSuccess }) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [resignationDate, setResignationDate] = useState(new Date().toISOString().split('T')[0]);
  const [relievingDate, setRelievingDate] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setIsLoadingEmployees(true);
      Promise.all([
        exitApi.getEmployeesForSeparation(company),
        exitApi.getTemplates(company)
      ]).then(([empRes, tplRes]) => {
        const emps = empRes.data?.employees || [];
        setEmployees(emps);
        const tpls = tplRes.data?.templates || [];
        setTemplates(tpls);
        if (tpls.length === 1) setSelectedTemplate(tpls[0].name);
      }).finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen, company]);

  useEffect(() => {
    if (!isOpen) {
      setEmployeeQuery('');
      setFilteredEmployees([]);
      setSelectedEmployee(null);
      setSelectedTemplate('');
      setResignationDate(new Date().toISOString().split('T')[0]);
      setRelievingDate('');
    }
  }, [isOpen]);

  const searchEmployees = (query) => {
    setEmployeeQuery(query);
    if (query.length < 2) { setFilteredEmployees([]); return; }
    const lq = query.toLowerCase();
    setFilteredEmployees(employees.filter(e =>
      e.employee_name?.toLowerCase().includes(lq) || e.name?.toLowerCase().includes(lq)
    ).slice(0, 10));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) { addToast('Please select an employee', 'error'); return; }
    setIsSubmitting(true);
    try {
      const res = await exitApi.startSeparation(
        selectedEmployee.name,
        selectedTemplate || null,
        resignationDate,
        relievingDate || null
      );
      addToast(res.message || 'Separation initiated!', 'success');
      onClose();
      onSuccess?.();
    } catch (err) {
      addToast(err.message || 'Failed to initiate separation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <UserMinus className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Initiate Separation</h3>
              <p className="text-sm text-slate-500">Start the exit process for an employee</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Employee Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Employee *</label>
            {selectedEmployee ? (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div className="flex items-center gap-3">
                  {selectedEmployee.image ? (
                    <img src={selectedEmployee.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                      {selectedEmployee.employee_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.employee_name}</div>
                    <div className="text-xs text-slate-500">{selectedEmployee.name} · {selectedEmployee.designation}</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedEmployee(null); setEmployeeQuery(''); }} className="text-sm text-red-600 hover:text-red-700 font-medium">Change</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={employeeQuery}
                  onChange={(e) => searchEmployees(e.target.value)}
                  placeholder={isLoadingEmployees ? "Loading employees..." : "Search active employees..."}
                  disabled={isLoadingEmployees}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none disabled:opacity-50"
                />
                {filteredEmployees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredEmployees.map(emp => (
                      <button
                        key={emp.name}
                        onClick={() => { setSelectedEmployee(emp); setFilteredEmployees([]); setEmployeeQuery(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-600 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                          {emp.employee_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900 dark:text-white">{emp.employee_name}</div>
                          <div className="text-xs text-slate-500">{emp.name} · {emp.designation || emp.department || ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Separation Template</label>
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
            >
              <option value="">Auto-select for company</option>
              {templates.map(t => (
                <option key={t.name} value={t.name}>{t.title || t.name}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" /> Resignation Date *
              </label>
              <input
                type="date"
                value={resignationDate}
                onChange={e => setResignationDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" /> Relieving Date
              </label>
              <input
                type="date"
                value={relievingDate}
                onChange={e => setRelievingDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">Can be set later</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmployee}
            className="px-5 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Initiating...' : 'Initiate Separation'}
          </button>
        </div>
      </div>
    </div>
  );
}
