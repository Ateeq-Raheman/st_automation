import React, { useState } from 'react';
import { exitApi } from '../../api/exitApi';
import { useToast } from '../../components/common/Toast';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, Lock, UserMinus, Send, Copy, LinkIcon, Link2Off, MessageSquarePlus, User, AlertTriangle, LogOut, Calendar } from 'lucide-react';

export function ExitPipelineView({ pipelineData, isLoading, onRefresh, onStartSeparation }) {
  const { addToast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [assignInputs, setAssignInputs] = useState({});
  const [markLeftDialog, setMarkLeftDialog] = useState(null); // { employee, employee_name }
  const [relievingDate, setRelievingDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCompleteStage = async (separation, taskName) => {
    setIsActionLoading(true);
    try {
      await exitApi.completeStage(separation, taskName);
      addToast('Task completed!', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to complete task', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResendLink = async (separation) => {
    setIsActionLoading(true);
    try {
      const res = await exitApi.resendStatusLink(separation);
      addToast(res.message || 'Link generated!', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to resend link', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevokeLink = async (separation) => {
    setIsActionLoading(true);
    try {
      await exitApi.revokeStatusLink(separation);
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
      await exitApi.assignTask(taskName, user);
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
      await exitApi.addTaskComment(taskName, comment);
      addToast('Note added!', 'success');
      setCommentInputs(prev => ({ ...prev, [taskName]: '' }));
    } catch (err) {
      addToast(err.message || 'Failed to add note', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkLeft = async () => {
    if (!markLeftDialog) return;
    setIsActionLoading(true);
    try {
      const res = await exitApi.markEmployeeLeft(markLeftDialog.employee, relievingDate);
      addToast(res.message || 'Employee marked as Left!', 'success');
      setMarkLeftDialog(null);
      onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to mark as left', 'error');
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

  const allSeparations = pipelineData?.separations || [];
  const separations = allSeparations.filter(sep => showCompleted ? sep.boarding_status === 'Completed' : sep.boarding_status !== 'Completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-poppins text-slate-900 dark:text-white">Exit Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">{separations.length} active separation{separations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
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
            onClick={onStartSeparation}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Initiate Separation
          </button>
        </div>
      </div>

      {/* Empty State */}
      {separations.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserMinus className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {showCompleted ? 'No Completed Separations' : 'No Active Separations'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {showCompleted ? 'Completed separations will appear here.' : 'Initiate a separation when an employee resigns or is released.'}
          </p>
          {!showCompleted && (
            <button onClick={onStartSeparation} className="px-5 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors">
              <Plus className="inline h-4 w-4 mr-1 -mt-0.5" /> Initiate Separation
            </button>
          )}
        </div>
      )}

      {/* Pipeline Cards */}
      <div className="space-y-4">
        {separations.map((sep) => {
          const isExpanded = expandedRow === sep.name;
          const allDone = sep.percent_complete >= 100;
          const isLeft = sep.employee_status === 'Left';

          return (
            <div key={sep.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-md">
              {/* Row Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpandedRow(isExpanded ? null : sep.name)}
              >
                <div className="flex items-center gap-4">
                  {sep.image ? (
                    <img src={sep.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {sep.employee_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {sep.employee_name}
                      {isLeft && <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Left</span>}
                    </div>
                    <div className="text-sm text-slate-500">{sep.employee} · {sep.designation || ''} {sep.department ? `· ${sep.department}` : ''}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {sep.resignation_letter_date && (
                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-slate-400 font-medium">Resigned</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">{sep.resignation_letter_date}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(sep.percent_complete, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[35px] text-right">{Math.round(sep.percent_complete)}%</span>
                  </div>

                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 animate-fade-in">
                  {/* Mark as Left Banner */}
                  {allDone && !isLeft && (
                    <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-800 dark:text-amber-200">All exit tasks completed</div>
                          <div className="text-sm text-amber-600 dark:text-amber-400">Mark the employee as Left to finalize the separation.</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setMarkLeftDialog({ employee: sep.employee, employee_name: sep.employee_name }); setRelievingDate(new Date().toISOString().split('T')[0]); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
                      >
                        <LogOut className="h-4 w-4" /> Mark as Left
                      </button>
                    </div>
                  )}

                  {/* Magic Link Section */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-500" /> Exit Checklist
                    </h4>
                    <div className="flex items-center gap-2">
                      {sep.token && (
                        <button onClick={() => copyToClipboard(sep.status_url)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </button>
                      )}
                      {sep.token && (
                        <button onClick={() => handleRevokeLink(sep.name)} disabled={isActionLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
                          <Link2Off className="h-3.5 w-3.5" /> Revoke
                        </button>
                      )}
                      <button onClick={() => handleResendLink(sep.name)} disabled={isActionLoading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">
                        <Send className="h-3.5 w-3.5" /> {sep.token ? 'Resend' : 'Generate'} Link
                      </button>
                    </div>
                  </div>

                  {sep.token && sep.status_url && (
                    <div className="mb-5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <a href={sep.status_url} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline truncate">{sep.status_url}</a>
                    </div>
                  )}

                  {/* Task List */}
                  <div className="space-y-3">
                    {sep.tasks?.map((task, idx) => {
                      const isCompleted = task.status === 'Completed';
                      const isCurrent = !isCompleted && (idx === 0 || sep.tasks[idx - 1].status === 'Completed');
                      const isLocked = !isCompleted && !isCurrent;

                      return (
                        <div
                          key={task.name}
                          className={`rounded-xl border transition-all ${
                            isCompleted ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-900/40' :
                            isCurrent ? 'bg-white dark:bg-slate-800 border-orange-400 shadow-sm ring-1 ring-orange-400/10' :
                            'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                isCurrent ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
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
                                    className="hidden lg:block w-40 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                  {assignInputs[task.name] && (
                                    <button onClick={() => handleAssignTask(task.name)} disabled={isActionLoading} className="px-2.5 py-1.5 text-xs font-medium text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50">
                                      Assign
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCompleteStage(sep.name, task.name)}
                                    disabled={isActionLoading}
                                    className="px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
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

                          {isCurrent && (
                            <div className="px-4 pb-4 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Add a note..."
                                value={commentInputs[task.name] || ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [task.name]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment(task.name)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              {commentInputs[task.name] && (
                                <button onClick={() => handleAddComment(task.name)} disabled={isActionLoading} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-500 rounded-lg transition-colors disabled:opacity-50">
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

      {/* Mark as Left Confirmation Dialog */}
      {markLeftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMarkLeftDialog(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mark Employee as Left</h3>
              <p className="text-slate-500 mb-6">
                This will mark <strong>{markLeftDialog.employee_name}</strong> as <strong>Left</strong> and deactivate their user account.
              </p>

              <div className="text-left mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" /> Relieving Date *
                </label>
                <input
                  type="date"
                  value={relievingDate}
                  onChange={e => setRelievingDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setMarkLeftDialog(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleMarkLeft}
                  disabled={isActionLoading || !relievingDate}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isActionLoading ? 'Processing...' : 'Confirm & Mark Left'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
