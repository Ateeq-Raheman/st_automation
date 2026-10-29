import React from 'react';
import { Menu, Plus, UserPlus, Gift, Building2, Search } from 'lucide-react';
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
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-brand-grey hover:bg-gray-100 dark:bg-slate-800 hover:text-brand-black dark:text-slate-50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Company Badge / Selector */}
        {userProfile?.companies && userProfile.companies.length > 1 ? (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Building2 className="h-4 w-4 text-brand-red" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-sm font-semibold text-brand-black dark:text-slate-50 focus:outline-none cursor-pointer"
            >
              {userProfile.companies.map((c) => (
                <option key={c.name} value={c.name} className="bg-white dark:bg-slate-800 text-brand-black dark:text-slate-50">
                  {c.company_name || c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-brand-grey">
            <Building2 className="h-4 w-4 text-brand-red" />
            <span>{selectedCompany || 'Standard Touch'}</span>
          </div>
        )}
      </div>

      {/* Quick Actions Bar. Icon-only below `sm` — at narrow widths (this
          row doesn't wrap) full labels for both buttons plus the company
          selector didn't fit, and the row overflowed past the viewport,
          making the *whole page* horizontally scrollable rather than just
          this bar. `title` keeps the action discoverable without the
          visible label. */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('st:open-command-palette'))}
          title="Search (Ctrl+K)"
          className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-2.5 sm:px-3 py-1.5 text-sm text-brand-grey hover:border-brand-red transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="hidden md:inline text-[11px] font-bold border border-gray-300 dark:border-slate-600 rounded px-1.5 py-0.5">Ctrl K</kbd>
        </button>
        {isRecruiter && (
          <Button
            size="sm"
            variant="outline"
            icon={UserPlus}
            onClick={onQuickAddCandidate}
            className="text-sm px-2.5 sm:px-3"
            title="Add Candidate"
          >
            <span className="hidden sm:inline">Add Candidate</span>
          </Button>
        )}

        {isHR && (
          <Button
            size="sm"
            variant="primary"
            icon={Gift}
            onClick={onQuickAddIncentive}
            className="text-sm px-2.5 sm:px-3"
            title="Quick Incentive"
          >
            <span className="hidden sm:inline">Quick Incentive</span>
          </Button>
        )}
      </div>
    </header>
  );
}
