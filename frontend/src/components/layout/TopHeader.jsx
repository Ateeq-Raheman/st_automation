import React from 'react';
import { Menu, Plus, UserPlus, Gift, Building2 } from 'lucide-react';
import { Button } from '../common/Button';

export function TopHeader({ 
  userProfile, 
  setIsMobileOpen, 
  onQuickAddCandidate, 
  onQuickAddIncentive,
  selectedCompany,
  setSelectedCompany
}) {
  const isHR = userProfile?.is_hr_admin || userProfile?.is_system_manager;
  const isRecruiter = userProfile?.is_recruiter || isHR;

  return (
    <header className="h-16 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Company Badge / Selector */}
        {userProfile?.companies && userProfile.companies.length > 1 ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {userProfile.companies.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                  {c.company_name || c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>{selectedCompany || 'Standard Touch'}</span>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2.5">
        {isRecruiter && (
          <Button
            size="sm"
            variant="outline"
            icon={UserPlus}
            onClick={onQuickAddCandidate}
            className="text-xs"
          >
            <span className="hidden sm:inline">Add</span> Candidate
          </Button>
        )}

        {isHR && (
          <Button
            size="sm"
            variant="primary"
            icon={Gift}
            onClick={onQuickAddIncentive}
            className="text-xs"
          >
            <span className="hidden sm:inline">Quick</span> Incentive
          </Button>
        )}
      </div>
    </header>
  );
}
