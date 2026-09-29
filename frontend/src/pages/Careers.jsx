import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Building2, ChevronRight, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { callApi } from '../api/client';
import { Button } from '../components/common/Button';


class CareersErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Careers Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 text-center text-red-500">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="text-left bg-gray-100 p-4 rounded overflow-auto text-sm">{this.state.error?.toString()}</pre>
          <pre className="text-left bg-gray-100 p-4 rounded overflow-auto text-sm mt-4">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

export function Careers() {
  return (
    <CareersErrorBoundary>
      <CareersContent />
    </CareersErrorBoundary>
  );
}

function CareersContent() {

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Application Form State
  const [formData, setFormData] = useState({
    applicant_name: '',
    email_id: '',
    phone_number: '',
    cover_letter: '',
    resume_base64: '',
    resume_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await callApi('st_automation.api.recruitment.get_active_jobs');
      if (response && response.data) {
        setJobs(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          resume_base64: reader.result,
          resume_name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.applicant_name || !formData.email_id) {
      setError('Please fill in your name and email.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await callApi('st_automation.api.recruitment.submit_job_application', {
        job_title: selectedJob.name,
        applicant_name: formData.applicant_name,
        email_id: formData.email_id,
        phone_number: formData.phone_number,
        cover_letter: formData.cover_letter,
        resume_base64: formData.resume_base64,
        resume_name: formData.resume_name
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-white font-bold text-xl">
              ST
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-brand-black dark:text-white">
              StandardTouch Careers
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        {submitted ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-700 shadow-xl max-w-xl mx-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-brand-black dark:text-white mb-4">
              Application Received!
            </h2>
            <p className="text-gray-600 dark:text-slate-300 mb-8">
              Thank you for applying to <strong>{selectedJob?.job_title}</strong>. Our talent team will review your profile and reach out to you shortly.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setSelectedJob(null);
                setFormData({ applicant_name: '', email_id: '', phone_number: '', cover_letter: '' });
              }}
            >
              Browse More Jobs
            </Button>
          </div>
        ) : selectedJob ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
              <button 
                onClick={() => setSelectedJob(null)}
                className="flex items-center gap-2 text-sm font-semibold text-brand-grey hover:text-brand-black dark:hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all jobs
              </button>
              <h1 className="text-3xl font-heading font-bold text-brand-black dark:text-white mb-4">
                {selectedJob.job_title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-brand-grey">
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {selectedJob.department || 'All Departments'}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Remote / On-site</span>
              </div>
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-lg font-bold text-brand-black dark:text-white mb-4">About the Role</h3>
                <div 
                  className="prose prose-sm dark:prose-invert text-gray-600 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedJob.description || 'No description provided.' }}
                />
              </div>

              <div>
                <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-brand-black dark:text-white mb-6">Submit Application</h3>
                  
                  {error && (
                    <div className="bg-red-50 text-brand-red p-3 rounded-lg text-sm font-medium mb-6">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1">Full Name <span className="text-brand-red">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.applicant_name}
                        onChange={e => setFormData({...formData, applicant_name: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-brand-black dark:text-white"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1">Email Address <span className="text-brand-red">*</span></label>
                      <input
                        type="email"
                        required
                        value={formData.email_id}
                        onChange={e => setFormData({...formData, email_id: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-brand-black dark:text-white"
                        placeholder="e.g. john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-brand-black dark:text-white"
                        placeholder="+1 234 567 890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1">Upload Resume / CV (PDF or Word)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-brand-black dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-brand-red hover:file:bg-red-100"
                      />
                      {formData.resume_name && <p className="text-xs text-emerald-600 mt-2 font-medium">Attached: {formData.resume_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-1">Cover Letter / Links</label>
                      <textarea
                        rows={4}
                        value={formData.cover_letter}
                        onChange={e => setFormData({...formData, cover_letter: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-brand-black dark:text-white resize-none"
                        placeholder="Link to your portfolio, LinkedIn, or a short cover letter..."
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-base mt-2"
                      disabled={isSubmitting}
                      icon={isSubmitting ? Loader2 : null}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-brand-black dark:text-white tracking-tight mb-4">
                Join our team.
              </h1>
              <p className="text-lg text-brand-grey max-w-xl mx-auto">
                Explore exciting opportunities to build the future of software with us. We are always looking for passionate people.
              </p>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center shadow-sm">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <h3 className="text-xl font-bold text-brand-black dark:text-white mb-2">No open positions</h3>
                <p className="text-brand-grey">Check back later! We frequently post new opportunities.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map(job => (
                  <div 
                    key={job.name} 
                    onClick={() => setSelectedJob(job)}
                    className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-red/30 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-brand-black dark:text-white mb-2 group-hover:text-brand-red transition-colors">
                        {job.job_title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm font-semibold text-brand-grey">
                        <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.department || 'All Departments'}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-brand-red transition-colors text-brand-grey">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
