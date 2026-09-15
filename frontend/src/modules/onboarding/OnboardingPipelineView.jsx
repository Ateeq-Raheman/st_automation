import React, { useState } from 'react';
import { onboardingApi } from '../../api/onboardingApi';
import { useToast } from '../../components/common/Toast';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, Lock, UserPlus, Send, Copy, LinkIcon, Link2Off, MessageSquarePlus, User } from 'lucide-react';

export function OnboardingPipelineView({ pipelineData, isLoading, onRefresh, onStartOnboarding }) {
  const { addToast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [assignInputs, setAssignInputs] = useState({});

  const handleCompleteStage = async (employee, taskName) => {
    setIsActionLoading(true);
    try {
      await onboardingApi.completeStage(employee, taskName);
      addToast('Task completed!', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to complete task', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResendLink = async (employee) => {
    setIsActionLoading(true);
    try {
      const res = await onboardingApi.resendStatusLink(employee);
      addToast(res.message || 'Link generated!', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to resend link', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevokeLink = async (employee) => {
    setIsActionLoading(true);
    try {
      await onboardingApi.revokeStatusLink(employee);
      addToast('Link revoked!', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to revoke link', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignTask = async (taskName) => {
    const user = assignInputs[taskName];
    if (!user) return;
    setIsActionLoading(true);
    try {
      await onboardingApi.assignTask(taskName, user);
      addToast('Task assigned!', 'success');
      setAssignInputs(prev => ({ ...prev, [taskName]: '' }));
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to assign task', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddComment = async (taskName) => {
    const comment = commentInputs[taskName];
    if (!comment?.trim()) return;
    setIsActionLoading(true);
    try {
      await onboardingApi.addTaskComment(taskName, comment);
      addToast('Note added!', 'success');
      setCommentInputs(prev => ({ ...prev, [taskName]: '' }));
    } catch (err) {
      addToast(err.message || 'Failed to add note', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => addToast('Link copied!', 'info'));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl h-20 animate-pulse border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    );
  }

  const allOnboardings = pipelineData?.onboardings || [];
  const onboardings = allOnboardings.filter(ob => showCompleted ? ob.boarding_status === 'Completed' : ob.boarding_status !== 'Completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-poppins text-slate-900 dark:text-white">Onboarding Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">{onboardings.length} active onboarding{onboardings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active / Completed Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => setShowCompleted(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${!showCompleted ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >Active</button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${showCompleted ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >Completed</button>
          </div>
          <button
            onClick={onStartOnboarding}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-red rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Start Onboarding
          </button>
        </div>
      </div>

      {/* Empty State */}
      {onboardings.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {showCompleted ? 'No Completed Onboardings' : 'No Active Onboardings'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {showCompleted ? 'Completed onboardings will appear here.' : 'Start a new onboarding or onboard a candidate from the recruitment pipeline.'}
          </p>
          {!showCompleted && (
            <button onClick={onStartOnboarding} className="px-5 py-2.5 text-sm font-bold text-white bg-brand-red rounded-xl hover:bg-red-700 transition-colors">
              <Plus className="inline h-4 w-4 mr-1 -mt-0.5" /> Start Onboarding
            </button>
          )}
        </div>
      )}

      {/* Pipeline Cards */}
      <div className="space-y-4">
        {onboardings.map((ob) => {
          const isExpanded = expandedRow === ob.name;
          const statusColor = ob.boarding_status === 'Completed' ? 'green' : ob.boarding_status === 'In Process' ? 'blue' : 'amber';

          return (
            <div key={ob.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-md">
              {/* Row Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpandedRow(isExpanded ? null : ob.name)}
              >
                <div className="flex items-center gap-4">
                  {ob.image ? (
                    <img src={ob.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-lg">
                      {ob.employee_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{ob.employee_name}</div>
                    <div className="text-sm text-slate-500">{ob.employee} · {ob.designation || ''} {ob.department ? `· ${ob.department}` : ''}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {ob.date_of_joining && (
                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-slate-400 font-medium">Joining</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">{ob.date_of_joining}</div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${ob.percent_complete >= 100 ? 'bg-green-500' : 'bg-brand-red'}`}
                        style={{ width: `${Math.min(ob.percent_complete, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[35px] text-right">{Math.round(ob.percent_complete)}%</span>
                  </div>

                  {/* Status Badge */}
                  <span className={`hidden sm:inline-flex px-3 py-1 text-xs font-bold rounded-full bg-${statusColor}-100 text-${statusColor}-700 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400`}>
                    {ob.boarding_status}
                  </span>

                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 animate-fade-in">
                  {/* Magic Link Section */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-brand-red" /> Onboarding Checklist
                    </h4>
                    <div className="flex items-center gap-2">
                      {ob.token && (
                        <button onClick={() => copyToClipboard(ob.status_url)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </button>
                      )}
                      {ob.token && (
                        <button onClick={() => handleRevokeLink(ob.employee)} disabled={isActionLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
                          <Link2Off className="h-3.5 w-3.5" /> Revoke
                        </button>
                      )}
                      <button onClick={() => handleResendLink(ob.employee)} disabled={isActionLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-red rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                        <Send className="h-3.5 w-3.5" /> {ob.token ? 'Resend' : 'Generate'} Link
                      </button>
                    </div>
                  </div>

                  {ob.token && ob.status_url && (
                    <div className="mb-5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <a href={ob.status_url} target="_blank" rel="noreferrer" className="text-brand-red hover:underline truncate">{ob.status_url}</a>
                    </div>
                  )}

                  {/* Task List */}
                  <div className="space-y-3">
                    {ob.tasks?.map((task, idx) => {
                      const isCompleted = task.status === 'Completed';
                      const isCurrent = !isCompleted && (idx === 0 || ob.tasks[idx - 1].status === 'Completed');
                      const isLocked = !isCompleted && !isCurrent;

                      return (
                        <div
                          key={task.name}
                          className={`rounded-xl border transition-all ${
                            isCompleted ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-900/40' :
                            isCurrent ? 'bg-white dark:bg-slate-800 border-brand-red shadow-sm ring-1 ring-brand-red/10' :
                            'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                isCurrent ? 'bg-red-100 text-brand-red dark:bg-red-900/30' :
                                'bg-slate-200 text-slate-400 dark:bg-slate-700'
                              }`}>
                                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`font-semibold truncate ${isCompleted ? 'text-slate-600 dark:text-slate-400' : isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                  {task.subject}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                  {task.assigned_to?.length > 0 && (
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {task.assigned_to[0].split('@')[0]}{task.assigned_to.length > 1 ? ` +${task.assigned_to.length - 1}` : ''}</span>
                                  )}
                                  {task.completed_by && <span>Done by {task.completed_by.split('@')[0]}</span>}
                                  {task.completed_on && <span>on {task.completed_on}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              {isCurrent && (
                                <>
                                  <input
                                    type="email"
                                    placeholder="Assign to email..."
                                    value={assignInputs[task.name] || ''}
                                    onChange={e => setAssignInputs(prev => ({ ...prev, [task.name]: e.target.value }))}
                                    onClick={e => e.stopPropagation()}
                                    className="hidden lg:block w-40 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-red"
                                  />
                                  {assignInputs[task.name] && (
                                    <button onClick={() => handleAssignTask(task.name)} disabled={isActionLoading} className="px-2.5 py-1.5 text-xs font-medium text-brand-red border border-brand-red rounded-lg hover:bg-brand-red hover:text-white transition-colors disabled:opacity-50">
                                      Assign
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCompleteStage(ob.employee, task.name)}
                                    disabled={isActionLoading}
                                    className="px-4 py-2 text-sm font-bold text-white bg-brand-red rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    Mark Complete
                                  </button>
                                </>
                              )}
                              {isCompleted && (
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">Completed</span>
                              )}
                              {isLocked && (
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg">Locked</span>
                              )}
                            </div>
                          </div>

                          {/* Inline comment input for current task */}
                          {isCurrent && (
                            <div className="px-4 pb-4 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Add a note..."
                                value={commentInputs[task.name] || ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [task.name]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(task.name)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-red"
                              />
                              {commentInputs[task.name] && (
                                <button onClick={() => handleAddComment(task.name)} disabled={isActionLoading} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-brand-red hover:bg-brand-red hover:text-white border border-brand-red rounded-lg transition-colors disabled:opacity-50">
                                  <MessageSquarePlus className="h-3.5 w-3.5" /> Add
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
