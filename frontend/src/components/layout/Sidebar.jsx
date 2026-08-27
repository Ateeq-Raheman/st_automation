import React from 'react';
import { 
  Users, Briefcase, CalendarCheck, 
  DollarSign, PlayCircle, Gift, CreditCard, 
  FileText, Activity, ExternalLink, Sparkles
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, userProfile, isMobileOpen, setIsMobileOpen }) {
  const isHR = userProfile?.is_hr_admin || userProfile?.is_system_manager;
  const isRecruiter = userProfile?.is_recruiter || isHR;
  const isInterviewer = userProfile?.is_interviewer || isRecruiter;

  const navSections = [
    {
      title: 'Recruitment',
      visible: isRecruiter || isInterviewer,
      items: [
        { id: 'recruitment-pipeline', label: 'Candidate Pipeline', icon: Users, visible: isRecruiter },
        { id: 'job-openings', label: 'Job Openings', icon: Briefcase, visible: isRecruiter },
        { id: 'my-interviews', label: 'My Interviews', icon: CalendarCheck, visible: isInterviewer },
      ]
    },
    {
      title: 'Payroll & Finance',
      visible: isHR,
      items: [
        { id: 'payroll-command', label: 'Payroll Overview', icon: DollarSign, visible: isHR },
        { id: 'run-payroll', label: 'Run Monthly Payroll', icon: PlayCircle, visible: isHR, badge: 'Wizard' },
        { id: 'incentives', label: 'Incentives & Bonuses', icon: Gift, visible: isHR },
        { id: 'loans', label: 'Loans & Advances', icon: CreditCard, visible: isHR, badge: '3-Step' },
        { id: 'salary-slips', label: 'Salary Slips Hub', icon: FileText, visible: isHR },
      ]
    },
    {
      title: 'System & Tools',
      visible: true,
      items: [
        { id: 'diagnostics', label: 'System Readiness', icon: Activity, visible: isHR },
        { id: 'public-booking-demo', label: 'Candidate Slot Booking', icon: ExternalLink, visible: true, isExternal: true },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight leading-none text-base">Standard Touch</h1>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">HR Operations</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.filter(s => s.visible).map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </div>

              {section.items.filter(i => i.visible).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Info Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
              {userProfile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userProfile?.full_name || 'HR Team'}</p>
              <p className="text-xs text-slate-400 truncate">{userProfile?.email || 'Logged in'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
