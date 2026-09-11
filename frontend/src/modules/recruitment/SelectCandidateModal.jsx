import React, { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { recruitmentApi } from '../../api/recruitmentApi';

export function SelectCandidateModal({ isOpen, onClose, onSelect, company }) {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen, company]);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await recruitmentApi.getActiveCandidates(company);
      setCandidates(res.data?.candidates || []);
    } catch (err) {
      console.error("Failed to load active candidates", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.job_title && c.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Interview"
      subtitle="Select a shortlisted candidate to schedule an interview round for."
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search active candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>

        <div className="h-[300px] overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
              No active candidates found.
            </div>
          ) : (
            filteredCandidates.map(c => (
              <div 
                key={c.name} 
                onClick={() => onSelect(c.name)}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-red/40 hover:bg-red-50/10 cursor-pointer transition-all"
              >
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-slate-50">{c.applicant_name}</div>
                  <div className="text-[12px] font-medium text-brand-red mt-0.5">{c.job_title}</div>
                </div>
                <Button size="sm" variant="ghost">Select</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
