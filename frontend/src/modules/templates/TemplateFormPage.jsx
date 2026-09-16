import React, { useState, useEffect } from 'react';
import { templateApi } from '../../api/templateApi';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';

export function TemplateFormPage({ templateType, templateName, onBack }) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [options, setOptions] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    department: '',
    designation: '',
    employee_grade: '',
    activities: []
  });

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const opts = await templateApi.getOptions();
        setOptions(opts.data);
        
        if (templateName) {
          const res = await templateApi.getTemplate(templateType, templateName);
          setFormData(res.data);
        } else {
          // Initialize with one empty activity
          setFormData(prev => ({
            ...prev,
            title: `New ${templateType} Template`,
            activities: [{ id: Date.now(), activity_name: '', user: '', role: '', begin_on: 0, duration: 1, task_weight: 1, required_for_employee_creation: 0, description: '' }]
          }));
        }
      } catch (err) {
        addToast(err.message || 'Failed to initialize', 'error');
        onBack();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [templateType, templateName]);

  const handleSave = async () => {
    if (!formData.title) {
      addToast('Title is required', 'error');
      return;
    }
    const hasEmptyActivity = formData.activities.some(a => !a.activity_name);
    if (hasEmptyActivity) {
      addToast('All activities must have a name', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      await templateApi.saveTemplate(templateType, formData);
      addToast('Template saved successfully', 'success');
      onBack();
    } catch (err) {
      addToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { id: Date.now(), activity_name: '', user: '', role: '', begin_on: 0, duration: 1, task_weight: 1, required_for_employee_creation: 0, description: '' }]
    }));
  };

  const updateActivity = (index, field, value) => {
    setFormData(prev => {
      const newActivities = [...prev.activities];
      newActivities[index] = { ...newActivities[index], [field]: value };
      
      // Clear the other assignee field if one is set
      if (field === 'user' && value) newActivities[index].role = '';
      if (field === 'role' && value) newActivities[index].user = '';
      
      return { ...prev, activities: newActivities };
    });
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  if (isLoading || !options) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {templateName ? 'Edit Template' : 'New Template'}
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{templateType} • {templateName || 'Unsaved'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Meta Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Template Configuration</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Template Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Standard Software Engineer Onboarding"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-slate-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company</label>
            <select
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red text-slate-900 dark:text-white"
            >
              <option value="">All Companies (Global)</option>
              {options.companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <select
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red text-slate-900 dark:text-white"
            >
              <option value="">Any Department</option>
              {options.departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Designation</label>
            <select
              value={formData.designation}
              onChange={e => setFormData({...formData, designation: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red text-slate-900 dark:text-white"
            >
              <option value="">Any Designation</option>
              {options.designations.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Employee Grade</label>
            <select
              value={formData.employee_grade}
              onChange={e => setFormData({...formData, employee_grade: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red text-slate-900 dark:text-white"
            >
              <option value="">Any Grade</option>
              {options.employee_grades.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Activities Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Task Activities</h2>
          <span className="text-sm text-slate-500 font-medium">{formData.activities.length} tasks defined</span>
        </div>
        
        {formData.activities.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl py-12 flex flex-col items-center justify-center">
            <p className="text-slate-500 mb-4 font-medium">No activities added yet.</p>
            <button onClick={addActivity} className="px-5 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-semibold rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50">
              Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.activities.map((act, index) => (
              <div key={act.id || index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start group">
                <div className="p-4 cursor-grab text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 mt-2">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-1 p-4 pl-0 grid grid-cols-12 gap-4">
                  {/* Row 1 */}
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Activity Name *</label>
                    <input
                      type="text"
                      value={act.activity_name}
                      onChange={e => updateActivity(index, 'activity_name', e.target.value)}
                      placeholder="e.g. Issue Laptop"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                  
                  <div className="col-span-6 md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assign To (User / Role)</label>
                    <div className="flex gap-2">
                      <select
                        value={act.user}
                        onChange={e => updateActivity(index, 'user', e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                      >
                        <option value="">Specific User...</option>
                        {options.users.map(u => <option key={u.name} value={u.name}>{u.full_name || u.name}</option>)}
                      </select>
                      <select
                        value={act.role}
                        onChange={e => updateActivity(index, 'role', e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                      >
                        <option value="">Or Role...</option>
                        {options.roles.map(r => <option key={r.name} value={r.name}>{r.role_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3 flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Start Day</label>
                      <input
                        type="number"
                        value={act.begin_on}
                        onChange={e => updateActivity(index, 'begin_on', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                        title="Offset from joining/exit date"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Duration</label>
                      <input
                        type="number"
                        value={act.duration}
                        onChange={e => updateActivity(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                        title="Days to complete"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-12">
                    <input
                      type="text"
                      value={act.description || ''}
                      onChange={e => updateActivity(index, 'description', e.target.value)}
                      placeholder="Optional detailed description or instructions for this task..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                </div>
                
                <div className="p-4 pl-0">
                  <button onClick={() => removeActivity(index)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors mt-6">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={addActivity}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Another Task
        </button>
      </div>
    </div>
  );
}
