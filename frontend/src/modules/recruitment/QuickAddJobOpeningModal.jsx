import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export function QuickAddJobOpeningModal({ isOpen, onClose, onAdd, isSubmitting }) {
  const [formData, setFormData] = useState({
    job_title: '',
    department: '',
    vacancies: 1,
    publish: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.job_title.trim()) return;
    onAdd(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Job Opening"
      subtitle="Post a role — a Designation is created automatically if it doesn't exist yet."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Job Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior React Developer"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Department</label>
            <input
              type="text"
              placeholder="e.g. Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Vacancies</label>
            <input
              type="number"
              min="1"
              value={formData.vacancies}
              onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.publish}
            onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
          />
          <span className="text-sm font-semibold text-gray-700">Publish on career portal right away</span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Briefcase}
            isLoading={isSubmitting}
          >
            Create Job Opening
          </Button>
        </div>
      </form>
    </Modal>
  );
}
