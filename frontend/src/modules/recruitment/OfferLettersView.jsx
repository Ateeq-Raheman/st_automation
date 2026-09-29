import React, { useState, useEffect } from 'react';
import { 
  FileText, Eye, Printer, Send, Plus, Search, 
  CheckCircle, Clock, AlertCircle, X, Download, UserCheck, Sparkles, Check, ChevronDown,
  BookmarkPlus, Trash2, Edit3, Save, Settings
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { offerLetterApi } from '../../api/offerLetterApi';

export function OfferLettersView({
  offers = [],
  isHR = false,
  isLoading = false,
  onRefresh,
  selectedCompany
}) {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form State for Generator
  const [formData, setFormData] = useState({
    candidate_name: '',
    email: '',
    designation: '',
    offer_date: new Date().toISOString().split('T')[0],
    training_duration: '6 months',
    training_stipend: 'INR 5,000/month',
    salary_range: 'INR 10,000 - 15,000/month',
    contract_duration: '24 Months + 6 months of Training',
    reporting_manager: 'Mr. Abdul Nasir Mauzam Ali',
    hr_signatory_name: 'Muzammil Siddiqui',
    responsibilities: `Analyzing business requirements and translating them into technical specifications for ERP systems
Designing and developing ERP modules or customizing existing modules to meet specific business needs
Creating and maintaining technical documentation related to ERP systems, such as user manuals, technical specifications, and test plans.
Testing and debugging ERP systems to ensure they are functioning correctly
Working with cross-functional teams to integrate ERP systems with other business systems, such as CRM and SCM systems
Providing technical support and troubleshooting for ERP systems to end-users`
  });

  const [presets, setPresets] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('ERP Developer / Engineer');
  const [isManagingPresets, setIsManagingPresets] = useState(false);
  const [newPresetRole, setNewPresetRole] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const fetchPresets = async () => {
    try {
      const res = await offerLetterApi.getResponsibilityPresets();
      if (res.data) {
        setPresets(res.data);
      }
    } catch (err) {
      console.error('Failed to load responsibility presets', err);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSelectPreset = (roleTitle) => {
    setSelectedPreset(roleTitle);
    const duties = presets[roleTitle];
    if (duties && Array.isArray(duties)) {
      setFormData(prev => ({
        ...prev,
        responsibilities: duties.join('\n')
      }));
    }
  };

  const handleSaveCurrentAsPreset = async () => {
    const roleNameToSave = (newPresetRole || selectedPreset || formData.designation || '').trim();
    if (!roleNameToSave) {
      addToast('Please enter a role title for this preset', 'error');
      return;
    }
    if (!formData.responsibilities.trim()) {
      addToast('Please enter at least one responsibility duty', 'error');
      return;
    }

    setIsSavingPreset(true);
    try {
      const res = await offerLetterApi.saveResponsibilityPreset(roleNameToSave, formData.responsibilities);
      addToast(res.message || `Preset '${roleNameToSave}' saved!`, 'success');
      if (res.data?.presets) {
        setPresets(res.data.presets);
      } else {
        fetchPresets();
      }
      setSelectedPreset(roleNameToSave);
      setNewPresetRole('');
      setIsManagingPresets(false);
    } catch (err) {
      addToast(err.message || 'Failed to save preset', 'error');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePreset = async (roleName) => {
    if (!confirm(`Are you sure you want to delete preset '${roleName}'?`)) return;
    try {
      const res = await offerLetterApi.deleteResponsibilityPreset(roleName);
      addToast(res.message || `Preset '${roleName}' deleted`, 'success');
      if (res.data?.presets) {
        setPresets(res.data.presets);
        const keys = Object.keys(res.data.presets);
        if (selectedPreset === roleName && keys.length > 0) {
          handleSelectPreset(keys[0]);
        }
      } else {
        fetchPresets();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete preset', 'error');
    }
  };

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const filteredOffers = offers.filter(o => {
    const query = searchQuery.toLowerCase();
    return (
      (o.applicant_name && o.applicant_name.toLowerCase().includes(query)) ||
      (o.designation && o.designation.toLowerCase().includes(query)) ||
      (o.applicant_email && o.applicant_email.toLowerCase().includes(query)) ||
      (o.name && o.name.toLowerCase().includes(query))
    );
  });

  const handleOpenPreview = async (offerName) => {
    setIsPreviewLoading(true);
    setSelectedOffer(offerName);
    try {
      const res = await offerLetterApi.getOfferLetterDetail(offerName);
      if (res.data?.html) {
        setPreviewHtml(res.data.html);
      } else {
        addToast('Failed to load offer letter preview', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error loading offer letter', 'error');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    if (!previewHtml) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleUpdateStatus = async (offerName, newStatus) => {
    try {
      const res = await offerLetterApi.updateOfferStatus(offerName, newStatus);
      addToast(res.message || `Status updated to ${newStatus}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSendOffer = async (offerName) => {
    if (!confirm('Are you sure you want to send this Offer Letter to the candidate? All HR Managers will be CC’d.')) return;
    setIsSending(true);
    try {
      const res = await offerLetterApi.sendOfferLetter(offerName);
      addToast(res.message || 'Offer letter sent successfully!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.message || 'Failed to send offer letter', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!formData.candidate_name || !formData.email || !formData.designation) {
      addToast('Please fill in candidate name, email, and designation', 'error');
      return;
    }
    setIsSubmittingForm(true);
    try {
      const res = await offerLetterApi.createOrUpdateOfferLetter(formData);
      addToast(res.message || 'Offer letter generated successfully!', 'success');
      setIsGenerateOpen(false);
      if (onRefresh) onRefresh();
      // Auto open preview of the newly generated offer
      if (res.data?.offer_name) {
        handleOpenPreview(res.data.offer_name);
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate offer letter', 'error');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-black dark:text-slate-50 tracking-tight">
            {isHR ? 'Employment Contracts & Offer Letters' : 'My Employment Contract'}
          </h2>
          <p className="text-sm text-brand-grey">
            {isHR 
              ? 'Generate, preview, print, and track standard 5-page employment proposals and contracts.'
              : 'Review your signed StandardTouch employment contract and terms.'}
          </p>
        </div>

        {isHR && (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsGenerateOpen(true)}
            >
              Generate Offer Letter
            </Button>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      {isHR && (
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by candidate name, designation, email, or offer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-brand-black dark:text-slate-50"
            />
          </div>
        </div>
      )}

      {/* Offers Table / Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mb-3"></div>
            <p>Loading offer letters...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-base font-semibold text-gray-700 dark:text-slate-300">No Offer Letters Found</p>
            <p className="text-sm text-gray-400 mt-1">
              {isHR 
                ? 'Click "Generate Offer Letter" above to create an employment proposal for a candidate.'
                : 'No employment contract is linked to your account yet.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    <th className="py-3.5 px-6">Offer ID / Date</th>
                    <th className="py-3.5 px-6">Candidate / Employee</th>
                    <th className="py-3.5 px-6">Designation</th>
                    <th className="py-3.5 px-6">Stipend / Salary Range</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                  {filteredOffers.map((offer) => (
                    <tr key={offer.name} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-brand-black dark:text-slate-50">{offer.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(offer.offer_date)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-brand-black dark:text-slate-50">{offer.applicant_name}</div>
                        <div className="text-xs text-gray-500">{offer.applicant_email || 'No email'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-brand-black dark:text-slate-50">{offer.designation || '-'}</div>
                        <div className="text-xs text-gray-400">Manager: {offer.reporting_manager || 'Not specified'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-medium text-gray-900 dark:text-slate-100">
                          Training: <span className="text-emerald-600 font-semibold">{offer.training_stipend || 'INR 5,000/mo'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Post: <span className="font-semibold text-gray-700 dark:text-slate-300">{offer.salary_range || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isHR ? (
                          <div className="relative inline-block">
                            <select
                              value={offer.status || 'Draft'}
                              onChange={(e) => handleUpdateStatus(offer.name, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all ${
                                offer.status === 'Accepted'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                  : offer.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              }`}
                            >
                              <option value="Awaiting Response">Awaiting Response</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            offer.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : offer.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {offer.status || 'Draft'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleOpenPreview(offer.name)}
                          >
                            Preview / Print
                          </Button>

                          {isHR && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Send}
                              isLoading={isSending && selectedOffer === offer.name}
                              onClick={() => {
                                setSelectedOffer(offer.name);
                                handleSendOffer(offer.name);
                              }}
                            >
                              Send Email
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View (screens < md) */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {filteredOffers.map((offer) => (
                <div key={offer.name} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-brand-black dark:text-slate-50 text-base">{offer.applicant_name}</h4>
                      <p className="text-xs text-gray-500">{offer.applicant_email || 'No email'}</p>
                    </div>
                    {isHR ? (
                      <select
                        value={offer.status || 'Draft'}
                        onChange={(e) => handleUpdateStatus(offer.name, e.target.value)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer outline-none ${
                          offer.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : offer.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        <option value="Awaiting Response">Awaiting Response</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        offer.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : offer.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {offer.status || 'Draft'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Position</span>
                      <span className="font-medium text-gray-800 dark:text-slate-200">{offer.designation || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Offer Date</span>
                      <span className="font-medium text-gray-800 dark:text-slate-200">{formatDate(offer.offer_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Training Stipend</span>
                      <span className="font-medium text-emerald-600">{offer.training_stipend || 'INR 5,000/mo'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Post Salary</span>
                      <span className="font-medium text-gray-800 dark:text-slate-200">{offer.salary_range || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      className="flex-1 justify-center"
                      onClick={() => handleOpenPreview(offer.name)}
                    >
                      Preview / PDF
                    </Button>
                    {isHR && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Send}
                        className="flex-1 justify-center"
                        isLoading={isSending && selectedOffer === offer.name}
                        onClick={() => {
                          setSelectedOffer(offer.name);
                          handleSendOffer(offer.name);
                        }}
                      >
                        Send Email
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offer Letter Document Preview & Print Modal */}
      {selectedOffer && previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-brand-red shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-brand-black dark:text-slate-50 truncate">
                    Offer Letter Preview
                  </h3>
                  <p className="text-xs text-gray-500 truncate">Document ID: {selectedOffer}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Printer}
                  onClick={handlePrint}
                >
                  Print / Save PDF
                </Button>
                {isHR && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    isLoading={isSending}
                    onClick={() => handleSendOffer(selectedOffer)}
                  >
                    Email CC HR
                  </Button>
                )}
                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    setPreviewHtml('');
                  }}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-8 bg-gray-100 dark:bg-slate-950 flex justify-center">
              <div className="bg-white shadow-xl max-w-[850px] w-full p-4 sm:p-12 min-h-full rounded border border-gray-200 overflow-x-auto">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generator Form Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-brand-red">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-brand-black dark:text-slate-50">
                    Generate StandardTouch Offer Letter
                  </h3>
                  <p className="text-xs text-gray-500">Fill in dynamic candidate and proposal terms</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Ameer Pasha"
                    value={formData.candidate_name}
                    onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Candidate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Position / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ERP Developer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Offer Letter Date
                  </label>
                  <input
                    type="date"
                    value={formData.offer_date}
                    onChange={(e) => setFormData({ ...formData, offer_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Salary Range (After Training)
                  </label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Travel / Training Allowance
                  </label>
                  <input
                    type="text"
                    value={formData.training_stipend}
                    onChange={(e) => setFormData({ ...formData, training_stipend: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Training Duration
                  </label>
                  <input
                    type="text"
                    value={formData.training_duration}
                    onChange={(e) => setFormData({ ...formData, training_duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Contract Commitment
                  </label>
                  <input
                    type="text"
                    value={formData.contract_duration}
                    onChange={(e) => setFormData({ ...formData, contract_duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={formData.reporting_manager}
                    onChange={(e) => setFormData({ ...formData, reporting_manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    HR Signatory Name
                  </label>
                  <input
                    type="text"
                    value={formData.hr_signatory_name}
                    onChange={(e) => setFormData({ ...formData, hr_signatory_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                    Key Responsibilities (One per line)
                  </label>
                  
                  {/* Preset Template Selector & Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-brand-red" />
                      Role Preset:
                    </span>
                    <select
                      value={selectedPreset}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-black dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-red cursor-pointer"
                    >
                      {Object.keys(presets).length > 0 ? (
                        Object.keys(presets).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))
                      ) : (
                        <option value="ERP Developer / Engineer">ERP Developer / Engineer</option>
                      )}
                    </select>

                    {/* Manage Presets Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsManagingPresets(!isManagingPresets)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                        isManagingPresets
                          ? 'bg-brand-red text-white border-brand-red'
                          : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50'
                      }`}
                      title="Create, save or manage presets"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      {isManagingPresets ? 'Close Tools' : 'Manage Presets'}
                    </button>
                  </div>
                </div>

                {/* In-place Preset Management Sub-bar */}
                {isManagingPresets && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl space-y-2.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Settings className="h-3.5 w-3.5 text-brand-red" />
                        Save current responsibilities as a new or updated Preset:
                      </span>
                      {selectedPreset && (
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(selectedPreset)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete "{selectedPreset}"
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        placeholder="Preset Role Title (e.g. AI / Python Intern, Sales Exec)..."
                        value={newPresetRole}
                        onChange={(e) => setNewPresetRole(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-red"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentAsPreset}
                        disabled={isSavingPreset}
                        className="px-3 py-1.5 bg-brand-red text-white text-xs font-semibold rounded-lg hover:bg-brand-red/90 flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {isSavingPreset ? 'Saving...' : 'Save Preset'}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                      Tip: Enter a role title and click "Save Preset" to save whatever is in the textarea below as a reusable preset template.
                    </p>
                  </div>
                )}

                {/* Quick Role Preset Pills */}
                {Object.keys(presets).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.keys(presets).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleSelectPreset(role)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                          selectedPreset === role
                            ? 'bg-brand-red text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={6}
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Enter or customize the job duties (each line will be numbered on Page 2)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-mono text-xs leading-relaxed"
                />
                <p className="text-[11px] text-gray-400">
                  Tip: Selecting a preset auto-fills standard responsibilities for the role. You can edit, add, or delete any point before generating.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsGenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmittingForm}
                >
                  Create & Preview Offer Letter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
