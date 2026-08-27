import React, { useState } from 'react';
import { UserPlus, Upload } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export function QuickAddApplicantModal({ isOpen, onClose, onAdd, jobOpenings = [], isSubmitting }) {
  const [formData, setFormData] = useState({
    applicant_name: '',
    email_id: '',
    phone_number: '',
    job_title: '',
    notes: '',
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
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Candidate Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Sarah Jenkins"
            value={formData.applicant_name}
            onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              placeholder="sarah@example.com"
              value={formData.email_id}
              onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Job Opening</label>
          <select
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select Job Opening (Optional)</option>
            {jobOpenings.map((job) => (
              <option key={job.name} value={job.job_title || job.name}>
                {job.job_title || job.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Notes / Sourcing Source</label>
          <textarea
            placeholder="e.g. Referred by Tech Lead, 4 years React experience..."
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
