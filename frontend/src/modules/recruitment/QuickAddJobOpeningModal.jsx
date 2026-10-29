import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export function QuickAddJobOpeningModal({ isOpen, onClose, onAdd, isSubmitting, departments = [], job = null }) {
  const isEdit = !!job;
  const blank = { job_title: '', department: '', vacancies: 1, publish: false, status: 'Open', description: '' };
  const [formData, setFormData] = useState(blank);

  // Prefill when editing an existing opening; reset to blank for a new one.
  useEffect(() => {
    if (!isOpen) return;
    setFormData(job ? {
      job_title: job.job_title || '',
      department: job.department || '',
      vacancies: job.vacancies || 1,
      publish: !!job.publish,
      status: job.status || 'Open',
      description: job.description || '',
    } : blank);
  }, [isOpen, job]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.job_title.trim()) return;
    onAdd(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Job Opening' : 'New Job Opening'}
      subtitle={isEdit ? job.name : "Post a role — a Designation is created automatically if it doesn't exist yet."}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Job Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior React Developer"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Department</label>
            <input
              type="text"
              list="department-options"
              placeholder="e.g. Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            />
            <datalist id="department-options">
              {departments.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Vacancies</label>
            <input
              type="number"
              min="1"
              value={formData.vacancies}
              onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {isEdit && (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.publish}
            onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-brand-red focus:ring-brand-red"
          />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{isEdit ? 'Published on career portal' : 'Publish on career portal right away'}</span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Briefcase}
            isLoading={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Create Job Opening'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
