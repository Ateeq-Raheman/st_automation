import React, { useState, useEffect, useRef } from 'react';
import { callApi } from '../api/client';
import { Check, ChevronDown, X } from 'lucide-react';

export default function EmployeeSelect({ value, onChange, className, multiple = false }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await callApi('st_automation.api.payroll.get_active_employees', {});
        const data = res.data || [];
        setEmployees(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (empId) => {
    if (!multiple) {
      onChange({ target: { value: empId } });
      setIsOpen(false);
      return;
    }

    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(empId)
      ? currentValues.filter(id => id !== empId)
      : [...currentValues, empId];
    
    // Pass the array directly for our custom multi-select
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (loading) return 'Loading employees...';
    if (!multiple) {
      const selected = employees.find(e => e.name === value);
      return selected ? selected.employee_name : 'Select an Employee';
    }
    const currentValues = Array.isArray(value) ? value : [];
    if (currentValues.length === 0) return 'Select interviewers...';
    if (currentValues.length === 1) {
      const selected = employees.find(e => e.name === currentValues[0]);
      return selected ? selected.employee_name : '1 selected';
    }
    return `${currentValues.length} interviewers selected`;
  };

  const removeValue = (e, empId) => {
    e.stopPropagation();
    if (!multiple) return;
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.filter(id => id !== empId);
    onChange(newValues);
  };

  if (!multiple) {
    return (
      <select
        value={value}
        onChange={onChange}
        required={!multiple}
        className={className || "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading employees...' : 'Select an Employee'}</option>
        {employees.map((emp) => (
          <option key={emp.name} value={emp.name}>
            {emp.employee_name} ({emp.name})
          </option>
        ))}
      </select>
    );
  }

  // Custom Multiple Select UI
  const currentValues = Array.isArray(value) ? value : [];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full min-h-[46px] bg-white border ${isOpen ? 'border-brand-red ring-1 ring-brand-red' : 'border-gray-200'} rounded-xl px-3 py-2 text-sm text-brand-black cursor-pointer flex items-center justify-between transition-all`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 pr-2">
          {currentValues.length === 0 && (
            <span className="text-gray-400 font-normal select-none my-1 ml-1">{getDisplayText()}</span>
          )}
          {currentValues.map(empId => {
            const emp = employees.find(e => e.name === empId);
            if (!emp) return null;
            return (
              <span key={empId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-700">
                {emp.employee_name}
                <button 
                  onClick={(e) => removeValue(e, empId)}
                  className="hover:bg-gray-200 rounded-full p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in py-1">
          {employees.map(emp => {
            const isSelected = currentValues.includes(emp.name);
            return (
              <div 
                key={emp.name}
                onClick={() => handleToggleOption(emp.name)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-gray-300 bg-white'}`}>
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {emp.employee_name}
                  </span>
                  <span className="text-[12px] text-gray-500 font-normal">
                    {emp.name}
                  </span>
                </div>
              </div>
            );
          })}
          {employees.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No active employees found</div>
          )}
        </div>
      )}
    </div>
  );
}
