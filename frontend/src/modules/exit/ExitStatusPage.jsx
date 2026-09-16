import React, { useState, useEffect } from 'react';
import { exitApi } from '../../api/exitApi';

export function ExitStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('exit_token');
      
      if (!token) {
        setError('Invalid tracking link.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await exitApi.getEmployeeStatus(token);
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
        <div className="text-brand-red font-medium">Loading your separation status...</div>
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

  const { employee_name, designation, company, percent_complete, tasks, resignation_letter_date } = statusData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-montserrat">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-poppins font-bold text-xl text-brand-black flex items-center gap-2">
            <span className="text-brand-red text-2xl leading-none">&bull;</span>
            Standard Touch
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">Exit & Separation Portal</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-brand-black p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <h1 className="text-3xl sm:text-4xl font-bold font-poppins mb-2 relative z-10">Exit Tracking: {employee_name}</h1>
            <p className="text-slate-300 font-medium relative z-10 text-lg">{designation} at {company}</p>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Separation Progress</span>
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
              <h3 className="text-lg font-bold font-poppins text-slate-900">Your Exit Checklist</h3>
              
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                {tasks?.map((task, idx) => {
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div key={task.name} className={`relative pl-8 transition-opacity duration-300 ${!isCompleted ? 'opacity-75' : 'opacity-100'}`}>
                      <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-300'
                      }`} />
                      
                      <div className={`bg-white p-5 rounded-xl border transition-all ${
                        !isCompleted ? 'border-brand-red shadow-sm' : 
                        'border-slate-100 shadow-sm'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold ${isCompleted ? 'text-slate-700' : 'text-brand-red'}`}>
                            {task.subject}
                          </h4>
                          {isCompleted && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>}
                          {!isCompleted && <span className="text-xs font-bold text-brand-red bg-red-50 px-2 py-1 rounded">Pending</span>}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          {isCompleted 
                            ? 'This step has been completed.'
                            : 'This step is currently pending action.'}
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
