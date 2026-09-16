import React, { useState, useEffect } from 'react';
import { templateApi } from '../../api/templateApi';
import { useToast } from '../../components/common/Toast';
import { Plus, Search, Edit2, Trash2, Building2, Briefcase, Users, LayoutTemplate } from 'lucide-react';

export function TemplateListPage({ onEdit, onCreate }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Onboarding');
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await templateApi.getTemplates(activeTab);
      setTemplates(res.data?.templates || []);
    } catch (err) {
      addToast(err.message || 'Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [activeTab]);

  const handleDelete = async (name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await templateApi.deleteTemplate(activeTab, name);
      addToast('Template deleted successfully', 'success');
      loadTemplates();
    } catch (err) {
      addToast(err.message || 'Failed to delete template', 'error');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Template Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Define standard task checklists for employee boarding.</p>
        </div>
        <button
          onClick={() => onCreate(activeTab)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
          {['Onboarding', 'Separation'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-brand-red shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab} Templates
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 h-24 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-4">
            <LayoutTemplate className="h-8 w-8 text-brand-red" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Templates Found</h3>
          <p className="text-slate-500 max-w-sm mb-6">Create your first {activeTab.toLowerCase()} template to standardize the process across your organization.</p>
          <button
            onClick={() => onCreate(activeTab)}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Create New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red/20 to-red-600/10 flex items-center justify-center">
                    <LayoutTemplate className="h-6 w-6 text-brand-red" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(activeTab, template.name)} className="p-2 text-slate-400 hover:text-brand-red bg-slate-50 dark:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(template.name)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-700 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate" title={template.title || template.name}>
                  {template.title || template.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mb-4">{template.name}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{template.company || 'All Companies'}</span>
                  </div>
                  {(template.department || template.designation) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="truncate">
                        {[template.department, template.designation].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeTab}</span>
                <button onClick={() => onEdit(activeTab, template.name)} className="text-sm font-semibold text-brand-red hover:text-red-700 flex items-center gap-1">
                  Manage tasks &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
