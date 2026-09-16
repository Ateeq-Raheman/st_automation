import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';

// API
import { diagnosticsApi } from './api/diagnosticsApi';
import { recruitmentApi } from './api/recruitmentApi';
import { payrollApi } from './api/payrollApi';

// Recruitment Views & Modals
import { KanbanBoard } from './modules/recruitment/KanbanBoard';
import { JobOpeningsView } from './modules/recruitment/JobOpeningsView';
import { MyInterviewsView } from './modules/recruitment/MyInterviewsView';
import { ApplicantDetailModal } from './modules/recruitment/ApplicantDetailModal';
import { SelectCandidateModal } from './modules/recruitment/SelectCandidateModal';
import { QuickAddApplicantModal } from './modules/recruitment/QuickAddApplicantModal';
import { QuickAddJobOpeningModal } from './modules/recruitment/QuickAddJobOpeningModal';
import { FeedbackScorecardModal } from './modules/recruitment/FeedbackScorecardModal';

// Payroll Views & Modals
import { PayrollDashboard } from './modules/payroll/PayrollDashboard';
import { RunPayrollWizard } from './modules/payroll/RunPayrollWizard';
import { QuickIncentiveModal } from './modules/payroll/QuickIncentiveModal';
import { BulkIncentiveModal } from './modules/payroll/BulkIncentiveModal';
import { LoanApplicationWizard } from './modules/payroll/LoanApplicationWizard';
import { ActiveLoansView } from './modules/payroll/ActiveLoansView';
import { SalarySlipsView } from './modules/payroll/SalarySlipsView';

// Diagnostics & Public Candidate
import { DiagnosticsView } from './modules/diagnostics/DiagnosticsView';
import { CandidateSlotBooking } from './modules/candidate/CandidateSlotBooking';
import InterviewFeedback from './pages/InterviewFeedback';

export function AppContent() {
  const { addToast } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState('recruitment-pipeline');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPublicCandidateMode, setIsPublicCandidateMode] = useState(false);
  const [isInterviewFeedbackMode, setIsInterviewFeedbackMode] = useState(false);

  // User & Company Context
  const [userProfile, setUserProfile] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Date/Period State for Payroll
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // Recruitment Data
  const [pipelineData, setPipelineData] = useState(null);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecruitmentLoading, setIsRecruitmentLoading] = useState(false);

  // Payroll Data
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [salarySlips, setSalarySlips] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [recentStructureAssignments, setRecentStructureAssignments] = useState([]);
  const [isPayrollLoading, setIsPayrollLoading] = useState(false);

  // Diagnostics Data
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  // Modal States
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [openInSchedulingMode, setOpenInSchedulingMode] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNewJobOpeningOpen, setIsNewJobOpeningOpen] = useState(false);
  const [isSelectCandidateOpen, setIsSelectCandidateOpen] = useState(false);
  const [isQuickIncentiveOpen, setIsQuickIncentiveOpen] = useState(false);
  const [isBulkIncentiveOpen, setIsBulkIncentiveOpen] = useState(false);
  const [isLoanWizardOpen, setIsLoanWizardOpen] = useState(false);
  const [activeInterviewForFeedback, setActiveInterviewForFeedback] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Detect Public Candidate Route or Interview Feedback Route
  useEffect(() => {
    const checkRoute = () => {
      const isBooking = window.location.hash.includes('book-slot') || window.location.pathname.includes('book-slot');
      const isFeedback = window.location.pathname.includes('interview-feedback') || window.location.search.includes('token=');
      setIsPublicCandidateMode(isBooking);
      setIsInterviewFeedbackMode(isFeedback);
    };
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  // Initial Load: User profile & default company
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await diagnosticsApi.getUserProfile();
        setUserProfile(res.data);
        if (res.data?.default_company) {
          setSelectedCompany(res.data.default_company);
        }
        
        // Default tab logic based on roles
        if (res.data && !res.data.is_recruiter && !res.data.is_interviewer && res.data.is_employee && !res.data.is_hr_admin) {
          setActiveTab('salary-slips');
        } else if (activeTab === 'salary-slips' && !res.data.is_hr_admin && !res.data.is_employee) {
          // Fallback if somehow invalid tab
          setActiveTab('recruitment-pipeline');
        }
      } catch (e) {
        console.error('Failed to load user profile', e);
      }
    };
    loadProfile();
  }, []);

  // Load Recruitment Data
  const loadRecruitment = useCallback(async () => {
    setIsRecruitmentLoading(true);
    try {
      const [pipeRes, jobsRes, intRes, deptRes] = await Promise.all([
        recruitmentApi.getPipeline(selectedJob, searchQuery, selectedCompany),
        recruitmentApi.getJobOpenings(selectedCompany),
        recruitmentApi.getMyInterviews(),
        recruitmentApi.getDepartments(selectedCompany),
      ]);
      setPipelineData(pipeRes.data);
      setJobOpenings(jobsRes.data?.job_openings || []);
      setDepartments(deptRes.data?.departments || []);
      setMyInterviews(intRes.data?.interviews || []);
    } catch (err) {
      console.error('Error loading recruitment data', err);
    } finally {
      setIsRecruitmentLoading(false);
    }
  }, [selectedJob, searchQuery, selectedCompany]);

  // Load Payroll Data
  const loadPayroll = useCallback(async () => {
    setIsPayrollLoading(true);
    try {
      const [sumRes, slipsRes, loansRes, structuresRes] = await Promise.all([
        payrollApi.getSummary(selectedCompany, month, year),
        payrollApi.getSalarySlips(selectedCompany, month, year),
        payrollApi.getActiveLoans(selectedCompany),
        payrollApi.getRecentSalaryStructureAssignments(selectedCompany),
      ]);
      setPayrollSummary(sumRes.data);
      setSalarySlips(slipsRes.data?.slips || []);
      setActiveLoans(loansRes.data || []);
      setRecentStructureAssignments(structuresRes.data || []);
    } catch (err) {
      console.error('Error loading payroll data', err);
    } finally {
      setIsPayrollLoading(false);
    }
  }, [selectedCompany, month, year]);

  // Load Diagnostics
  const loadDiagnostics = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const res = await diagnosticsApi.checkHealth(selectedCompany);
      setHealthData(res.data);
    } catch (err) {
      console.error('Error loading diagnostics', err);
    } finally {
      setIsHealthLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (!isPublicCandidateMode) {
      loadRecruitment();
      loadPayroll();
      loadDiagnostics();
    }
  }, [isPublicCandidateMode, loadRecruitment, loadPayroll, loadDiagnostics]);

  // 1-Click Handlers: Recruitment
  const handleShortlist = async (applicant) => {
    setIsActionLoading(true);
    try {
      const res = await recruitmentApi.shortlistAndNotify(applicant.name);
      addToast(res.message || 'Candidate shortlisted and booking link generated!', 'success');
      loadRecruitment();
      if (activeApplicant?.name === applicant.name) {
        setActiveApplicant(null);
      }
    } catch (err) {
      addToast(err.message || 'Failed to shortlist candidate', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecision = async (applicantId, decision, notes) => {
    setIsActionLoading(true);
    try {
      const res = await recruitmentApi.recordDecision(applicantId, decision, notes);
      addToast(res.message || `Decision recorded: ${decision}`, 'success');
      loadRecruitment();
      setActiveApplicant(null);
    } catch (err) {
      addToast(err.message || 'Failed to record decision', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleQuickAddApplicant = async (formData) => {
    setIsActionLoading(true);
    try {
      const res = await recruitmentApi.quickAddApplicant(formData);
      addToast(res.message || 'Candidate added to pipeline!', 'success');
      setIsQuickAddOpen(false);
      loadRecruitment();
    } catch (err) {
      addToast(err.message || 'Failed to add candidate', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateJobOpening = async (formData) => {
    setIsActionLoading(true);
    try {
      const res = await recruitmentApi.createJobOpening(
        formData.job_title,
        selectedCompany,
        formData.department,
        formData.vacancies,
        formData.publish ? 1 : 0
      );
      addToast(res.message || 'Job Opening created!', 'success');
      setIsNewJobOpeningOpen(false);
      loadRecruitment();
    } catch (err) {
      addToast(err.message || 'Failed to create job opening', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitScorecard = async (interviewId, rating, recommendation, comments, scorecard) => {
    setIsActionLoading(true);
    try {
      const res = await recruitmentApi.submitFeedback(interviewId, rating, recommendation, comments, scorecard);
      addToast(res.message || 'Interview feedback saved!', 'success');
      setActiveInterviewForFeedback(null);
      loadRecruitment();
    } catch (err) {
      addToast(err.message || 'Failed to save feedback', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleJob = async (jobId, publish) => {
    try {
      await recruitmentApi.toggleJobOpening(jobId, publish);
      addToast('Job visibility updated', 'info');
      loadRecruitment();
    } catch (err) {
      addToast('Failed to update job opening', 'error');
    }
  };

  // 1-Click Handlers: Payroll
  const handleQuickAddIncentive = async (formData) => {
    setIsActionLoading(true);
    try {
      const res = await payrollApi.quickAddIncentive(formData);
      addToast(res.message || 'Incentive added!', 'success');
      setIsQuickIncentiveOpen(false);
      loadPayroll();
    } catch (err) {
      addToast(err.message || 'Failed to add incentive', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkIncentives = async (incentivesList) => {
    setIsActionLoading(true);
    try {
      const res = await payrollApi.bulkAddIncentives(incentivesList);
      addToast(res.message || 'Bulk incentives created!', 'success');
      setIsBulkIncentiveOpen(false);
      loadPayroll();
    } catch (err) {
      addToast(err.message || 'Failed to submit bulk incentives', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateLoan = async (emp, amt, tenure, monthlyAmt, product, moratorium, disbursementDate) => {
    setIsActionLoading(true);
    try {
      const res = await payrollApi.createLoan(emp, amt, tenure, monthlyAmt, product, moratorium, disbursementDate, 0);
      addToast(res.message || 'Loan sanctioned successfully!', 'success');
      loadPayroll();
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to sanction loan', 'error');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisburseOnly = async (loanName, disbursementDate) => {
    setIsActionLoading(true);
    try {
      const res = await payrollApi.disburseLoan(loanName, disbursementDate);
      addToast(res.message || 'Loan disbursed successfully!', 'success');
      loadPayroll();
      return res;
    } catch (err) {
      addToast(err.message || 'Failed to disburse loan', 'error');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecutePayroll = async (comp, sDate, eDate) => {
    try {
      const res = await payrollApi.runPayrollAndReport(comp, sDate, eDate);
      addToast(res.message || 'Payroll completed!', 'success');
      loadPayroll();
      return res.data;
    } catch (err) {
      addToast(err.message || 'Payroll run failed', 'error');
      throw err;
    }
  };

  const handleAutoFix = async (issueId) => {
    setIsFixing(true);
    try {
      const res = await diagnosticsApi.autoFix(issueId, selectedCompany);
      addToast(res.message || 'Fixed successfully!', 'success');
      loadDiagnostics();
      loadPayroll();
    } catch (err) {
      addToast(err.message || 'Auto-fix failed', 'error');
    } finally {
      setIsFixing(false);
    }
  };

  // If candidate opens slot booking link
  if (isPublicCandidateMode || activeTab === 'public-booking-demo') {
    return <CandidateSlotBooking />;
  }

  // If interviewer clicks their feedback link (token in URL)
  if (isInterviewFeedbackMode) {
    return <InterviewFeedback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-brand-black dark:text-slate-50 flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main App Canvas */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          userProfile={userProfile}
          setIsMobileOpen={setIsMobileOpen}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          onQuickAddCandidate={() => setIsQuickAddOpen(true)}
          onQuickAddIncentive={() => setIsQuickIncentiveOpen(true)}
        />

        {/* View Canvas */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {/* Recruitment Views */}
          {activeTab === 'recruitment-pipeline' && (
            <KanbanBoard
              pipelineData={pipelineData}
              isLoading={isRecruitmentLoading}
              onRefresh={loadRecruitment}
              onOpenApplicant={(app) => setActiveApplicant(app)}
              onScheduleInterview={(app) => {
                setOpenInSchedulingMode(true);
                setActiveApplicant(app);
              }}
              onShortlist={handleShortlist}
              onQuickAdd={() => setIsQuickAddOpen(true)}
              jobOpenings={jobOpenings}
              selectedJob={selectedJob}
              setSelectedJob={setSelectedJob}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeTab === 'job-openings' && (
            <JobOpeningsView
              jobOpenings={jobOpenings}
              onTogglePublish={handleToggleJob}
              isLoading={isRecruitmentLoading}
              onNewJobOpening={() => setIsNewJobOpeningOpen(true)}
            />
          )}

          {activeTab === 'my-interviews' && (
            <MyInterviewsView
              interviews={myInterviews}
              onOpenFeedback={(item) => setActiveInterviewForFeedback(item)}
              onOpenCandidate={async (applicant_id) => {
                try {
                  const res = await recruitmentApi.getApplicant(applicant_id);
                  if (res.data) {
                    setActiveApplicant(res.data);
                    setOpenInSchedulingMode(true);
                  }
                } catch (err) {
                  console.error('Failed to load candidate', err);
                  addToast('Failed to load candidate profile', 'error');
                }
              }}
              onScheduleAdHoc={
                (userProfile?.is_hr_admin || userProfile?.is_system_manager)
                  ? () => setIsSelectCandidateOpen(true)
                  : undefined
              }
              isLoading={isRecruitmentLoading}
            />
          )}

          {/* Payroll Views */}
          {activeTab === 'payroll-command' && (
            <PayrollDashboard
              summary={payrollSummary}
              isLoading={isPayrollLoading}
              month={month}
              year={year}
              setMonth={setMonth}
              setYear={setYear}
              onRunPayroll={() => setActiveTab('run-payroll')}
              onQuickIncentive={() => setIsQuickIncentiveOpen(true)}
              onBulkIncentive={() => setIsBulkIncentiveOpen(true)}
              onNewLoan={() => setIsLoanWizardOpen(true)}
              onViewSalarySlips={() => setActiveTab('salary-slips')}
              recentStructureAssignments={recentStructureAssignments}
            />
          )}

          {activeTab === 'run-payroll' && (
            <RunPayrollWizard
              company={selectedCompany}
              month={month}
              year={year}
              onExecutePayroll={handleExecutePayroll}
              onViewSalarySlips={() => setActiveTab('salary-slips')}
              onRefresh={loadPayroll}
            />
          )}

          {activeTab === 'loans' && (
            <ActiveLoansView
              onLaunchLoanWizard={() => setIsLoanWizardOpen(true)}
              company={selectedCompany}
              loans={activeLoans}
              isLoading={isPayrollLoading}
              onRefresh={loadPayroll}
            />
          )}

          {activeTab === 'salary-slips' && (
            <SalarySlipsView
              slips={salarySlips}
              isLoading={isPayrollLoading}
              month={month}
              year={year}
              onRefresh={loadPayroll}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsView
              healthData={healthData}
              isLoading={isHealthLoading}
              onRefresh={loadDiagnostics}
              onAutoFix={handleAutoFix}
              isFixing={isFixing}
            />
          )}
        </main>
      </div>

      {/* Modals & Slide-overs */}
      <ApplicantDetailModal
        isOpen={!!activeApplicant}
        onClose={() => {
          setActiveApplicant(null);
          setOpenInSchedulingMode(false);
        }}
        applicant={activeApplicant}
        onShortlist={handleShortlist}
        onDecision={handleDecision}
        isActionLoading={isActionLoading}
        initialSchedulingOpen={openInSchedulingMode}
      />

      <SelectCandidateModal
        isOpen={isSelectCandidateOpen}
        onClose={() => setIsSelectCandidateOpen(false)}
        company={selectedCompany}
        onSelect={async (applicant_id) => {
          setIsSelectCandidateOpen(false);
          try {
            const res = await recruitmentApi.getApplicant(applicant_id);
            if (res.data) {
              setActiveApplicant(res.data);
              setOpenInSchedulingMode(true);
            }
          } catch (err) {
            console.error('Failed to load candidate', err);
            addToast('Failed to load candidate profile', 'error');
          }
        }}
      />

      <QuickAddApplicantModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleQuickAddApplicant}
        jobOpenings={jobOpenings}
        isSubmitting={isActionLoading}
      />

      <QuickAddJobOpeningModal
        isOpen={isNewJobOpeningOpen}
        onClose={() => setIsNewJobOpeningOpen(false)}
        onAdd={handleCreateJobOpening}
        isSubmitting={isActionLoading}
        departments={departments}
      />

      <FeedbackScorecardModal
        isOpen={!!activeInterviewForFeedback}
        onClose={() => setActiveInterviewForFeedback(null)}
        interview={activeInterviewForFeedback}
        onSubmitFeedback={handleSubmitScorecard}
        isSubmitting={isActionLoading}
      />

      <QuickIncentiveModal
        isOpen={isQuickIncentiveOpen}
        onClose={() => setIsQuickIncentiveOpen(false)}
        onAddIncentive={handleQuickAddIncentive}
        isSubmitting={isActionLoading}
      />

      <BulkIncentiveModal
        isOpen={isBulkIncentiveOpen}
        onClose={() => setIsBulkIncentiveOpen(false)}
        onBulkSubmit={handleBulkIncentives}
        isSubmitting={isActionLoading}
      />

      <LoanApplicationWizard
        isOpen={isLoanWizardOpen}
        onClose={() => setIsLoanWizardOpen(false)}
        onCreateLoan={handleCreateLoan}
        onDisburseLoan={handleDisburseOnly}
        isSubmitting={isActionLoading}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
