import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Mail, Loader2, AlertCircle, Download } from 'lucide-react';
import { exitApi } from '../../api/exitApi';

export default function ExitDocumentModal({ isOpen, onClose, separation, taskName, onComplete }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (isOpen && separation) {
      loadPreview();
    }
  }, [isOpen, separation]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await exitApi.previewExitDocuments(separation);
      setPreviewData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load document previews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!previewData?.personal_email) {
      setError('Employee does not have a personal email address set in their profile.');
      return;
    }

    setIsSending(true);
    setError('');
    try {
      await exitApi.sendExitDocuments(separation, taskName);
      onComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send documents');
      setIsSending(false);
    }
  };

  const handleDownload = () => {
    if (activeTab === 'relieving') {
      window.open(`/api/method/st_automation.api.exit.download_exit_document_pdf?separation=${encodeURIComponent(separation)}&letter_type=Relieving`, '_blank');
    } else if (activeTab === 'experience') {
      window.open(`/api/method/st_automation.api.exit.download_exit_document_pdf?separation=${encodeURIComponent(separation)}&letter_type=Experience`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Exit Documents Dispatch</h3>
              <p className="text-sm text-slate-500">Generate and email relieving documents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-slate-500">Generating document previews...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              {/* Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Email Dispatch Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Recipient (Personal Email)</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {previewData.personal_email || <span className="text-red-500 text-sm">Missing Personal Email</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Attachments to be Generated (PDF)</p>
                    <ul className="text-sm font-medium text-slate-700 dark:text-slate-300 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Relieving Letter</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Experience Letter</li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> 
                        {previewData.salary_slips?.length || 0} Salary Slips (Last 6 Months)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Document Previews */}
              <div>
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-4">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Salary Slips ({previewData.salary_slips?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('relieving')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'relieving' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Relieving Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'experience' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Experience Preview
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 h-96 overflow-y-auto">
                  {activeTab === 'summary' && (
                    <div className="space-y-2">
                      {previewData.salary_slips?.length > 0 ? (
                        previewData.salary_slips.map((slip, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{slip.name}</p>
                                <p className="text-xs text-slate-500">{slip.start_date} to {slip.end_date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">Net: {slip.net_pay}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-10">No salary slips found for this employee.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'relieving' && (
                    <div className="bg-white text-black p-8 rounded-lg shadow-sm" dangerouslySetInnerHTML={{ __html: previewData.relieving_html }} />
                  )}

                  {activeTab === 'experience' && (
                    <div className="bg-white text-black p-8 rounded-lg shadow-sm" dangerouslySetInnerHTML={{ __html: previewData.experience_html }} />
                  )}
                </div>
              </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          {(activeTab === 'relieving' || activeTab === 'experience') && (
            <button
              onClick={handleDownload}
              title="Download Current PDF"
              className="px-3 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={isSending || !previewData?.personal_email}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating & Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Approve & Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
