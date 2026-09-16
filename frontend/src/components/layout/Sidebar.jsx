import React from 'react';
import { 
  Users, Briefcase, CalendarCheck, 
  DollarSign, PlayCircle, Gift, CreditCard, 
  FileText, Activity, ExternalLink, Users2,
  UserPlus, UserMinus
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, userProfile, isMobileOpen, setIsMobileOpen }) {
  const isHR = userProfile?.is_hr_admin || userProfile?.is_system_manager;
  const isRecruiter = userProfile?.is_recruiter || isHR;
  const isInterviewer = userProfile?.is_interviewer || isRecruiter;
  const isEmployee = userProfile?.is_employee;

  const navSections = [
    {
      title: 'Recruitment',
      visible: isRecruiter || isInterviewer,
      items: [
        { id: 'recruitment-pipeline', label: 'Candidate Pipeline', icon: Users, visible: isRecruiter },
        { id: 'job-openings', label: 'Job Openings', icon: Briefcase, visible: isRecruiter },
        { id: 'my-interviews', label: 'Scheduled Interviews', icon: CalendarCheck, visible: isInterviewer },
      ]
    },
    {
      title: 'Onboarding & Separation',
      visible: isHR,
      items: [
        { id: 'onboarding-pipeline', label: 'Onboarding Pipeline', icon: UserPlus, visible: isHR },
        { id: 'exit-pipeline', label: 'Exit Pipeline', icon: UserMinus, visible: isHR },
      ]
    },
    {
      title: 'Payroll & Finance',
      visible: isHR || isEmployee,
      items: [
        { id: 'payroll-command', label: 'Payroll Overview', icon: DollarSign, visible: isHR },
        { id: 'run-payroll', label: 'Run Monthly Payroll', icon: PlayCircle, visible: isHR, badge: 'Wizard' },
        { id: 'loans', label: 'Loans & Advances', icon: CreditCard, visible: isHR, badge: '3-Step' },
        { id: 'salary-slips', label: 'My Salary Slips', icon: FileText, visible: isHR || isEmployee },
      ]
    },
    {
      title: 'System & Tools',
      visible: true,
      items: [
        { id: 'templates', label: 'Template Management', icon: FileText, visible: isHR },
        { id: 'diagnostics', label: 'System Readiness', icon: Activity, visible: isHR },
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
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-slate-700/80 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-slate-700/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-red to-red-700 flex items-center justify-center shadow-lg shadow-glow-red hover:from-orange-500 hover:to-brand-red transition-all duration-300">
            <Users2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <h1 className="font-bold text-brand-black dark:text-slate-50 tracking-tight leading-none text-[16px]">Standard Touch</h1>
            <span className="text-[11px] font-bold text-brand-red uppercase tracking-widest leading-none">HR Operations</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.filter(s => s.visible).map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[12px] font-bold uppercase tracking-wider text-brand-grey mb-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer text-left ${
                      isActive 
                        ? 'bg-brand-red text-white shadow-lg shadow-glow-red' 
                        : 'text-brand-grey hover:text-brand-black dark:text-slate-50 hover:bg-white dark:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-brand-grey group-hover:text-brand-red'
                      }`} />
                      <span className="font-semibold tracking-wide text-[15px] truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Info Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 flex items-center justify-center font-bold text-sm text-brand-red">
              {userProfile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-black dark:text-slate-50 truncate">{userProfile?.full_name || 'HR Team'}</p>
              <p className="text-xs text-brand-grey truncate">{userProfile?.email || 'Logged in'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
