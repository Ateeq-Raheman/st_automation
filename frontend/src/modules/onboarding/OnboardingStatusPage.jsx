import React, { useState, useEffect } from 'react';
import { onboardingApi } from '../../api/onboardingApi';

export function OnboardingStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('onboarding_token');
      
      if (!token) {
        setError('Invalid tracking link.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await onboardingApi.getEmployeeStatus(token);
        if (res.data) {
          setStatusData(res.data);
        } else {
          setError(res.message || 'Failed to load status.');
        }
      } catch (err) {
        setError(err.message || 'An error occurred. The link may have expired.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-brand-red font-medium">Loading your onboarding status...</div>
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link Invalid</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <p className="text-sm text-slate-500">Please contact HR for a new tracking link.</p>
        </div>
      </div>
    );
  }

  const { employee_name, designation, company, percent_complete, tasks } = statusData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-montserrat">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-poppins font-bold text-xl text-brand-black flex items-center gap-2">
            <span className="text-brand-red text-2xl leading-none">&bull;</span>
            Standard Touch
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">Onboarding Portal</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-brand-black p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins mb-2 relative z-10">Welcome to {company}, {employee_name}!</h1>
            <p className="text-slate-300 font-medium relative z-10 text-lg">{designation}</p>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Onboarding Progress</span>
                <span className="text-brand-red font-bold">{Math.round(percent_complete)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-red transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${percent_complete}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold font-poppins text-slate-900">Your Setup Checklist</h3>
              
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                {tasks?.map((task, idx) => {
                  const isCompleted = task.status === 'Completed';
                  // Task is active if it's the first uncompleted task
                  const isActive = !isCompleted && (idx === 0 || tasks[idx - 1].status === 'Completed');

                  return (
                    <div key={task.name} className={`relative pl-8 transition-opacity duration-300 ${!isCompleted && !isActive ? 'opacity-50' : 'opacity-100'}`}>
                      <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white ${
                        isCompleted ? 'bg-green-500' : 
                        isActive ? 'bg-brand-red shadow-[0_0_0_4px_rgba(237,29,36,0.1)]' : 
                        'bg-slate-300'
                      }`} />
                      
                      <div className={`bg-white p-5 rounded-xl border transition-all ${
                        isActive ? 'border-brand-red shadow-md transform -translate-y-1' : 
                        'border-slate-100 shadow-sm'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold ${isCompleted ? 'text-slate-700' : isActive ? 'text-brand-red' : 'text-slate-500'}`}>
                            {task.subject}
                          </h4>
                          {isCompleted && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>}
                          {isActive && <span className="text-xs font-bold text-brand-red bg-red-50 px-2 py-1 rounded animate-pulse">In Progress</span>}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          {isCompleted 
                            ? 'This step has been completed.'
                            : isActive 
                              ? 'Our HR team is currently working on this.'
                              : 'This step will begin once prior steps are completed.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-slate-500">
          <p>Need help? Contact the HR team.</p>
        </div>
      </main>
    </div>
  );
}
