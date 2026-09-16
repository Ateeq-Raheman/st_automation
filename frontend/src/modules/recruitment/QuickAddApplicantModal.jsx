import React, { useState } from 'react';
import { UserPlus, Upload, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export function QuickAddApplicantModal({ isOpen, onClose, onAdd, jobOpenings = [], isSubmitting }) {
  const [formData, setFormData] = useState({
    applicant_name: '',
    email_id: '',
    phone_number: '',
    job_title: '',
    notes: '',
    resume_attachment: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.applicant_name || !formData.email_id) return;
    onAdd(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Candidate"
      subtitle="Add a candidate directly into the recruitment pipeline in 1 click."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Candidate Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Sarah Jenkins"
            value={formData.applicant_name}
            onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              placeholder="sarah@example.com"
              value={formData.email_id}
              onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Target Job Opening</label>
          <select
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          >
            <option value="">Select Job Opening (Optional)</option>
            {jobOpenings.map(job => (
              <option key={job.name} value={job.name}>
                {job.job_title || job.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Resume / CV</label>
          <div className="relative w-full border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl px-4 py-6 bg-gray-50 dark:bg-slate-900 text-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex flex-col items-center justify-center">
            <Upload className="h-6 w-6 text-brand-grey mb-2" />
            <span className="text-sm text-brand-grey font-medium">Click to upload or drag and drop</span>
            <span className="text-xs text-gray-400 mt-1">PDF, DOCX up to 5MB</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, resume_file: e.target.files[0] });
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          {formData.resume_file && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {formData.resume_file.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1.5">Optional Notes / Internal Comments</label>
          <textarea
            placeholder="e.g. Referred by Tech Lead, 4 years React experience..."
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm text-brand-black dark:text-slate-50 focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={UserPlus}
            isLoading={isSubmitting}
          >
            Add to Pipeline
          </Button>
        </div>
      </form>
    </Modal>
  );
}
