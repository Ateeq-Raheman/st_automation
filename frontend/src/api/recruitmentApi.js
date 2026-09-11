import { callApi } from './client';

export const recruitmentApi = {
  getOverview: () => callApi('st_automation.api.recruitment.get_recruitment_overview', {}, 'GET'),
  
  getPipeline: (jobOpening, search, company) =>
    callApi('st_automation.api.recruitment.get_pipeline', { job_opening: jobOpening, search, company }, 'GET'),
  
  shortlistAndNotify: (applicantId, notes) => 
    callApi('st_automation.api.recruitment.shortlist_and_notify', { applicant_id: applicantId, notes }),
  
  getAvailableSlots: (token) => 
    callApi('st_automation.api.recruitment.get_available_slots', { token }, 'GET'),
  
  bookSlot: (token, slotDatetime, interviewer) => 
    callApi('st_automation.api.recruitment.book_slot', { token, slot_datetime: slotDatetime, interviewer }),
  
  getMyInterviews: () => 
    callApi('st_automation.api.recruitment.get_my_interviews', {}, 'GET'),
  
  submitFeedback: (interviewId, rating, recommendation, comments, scorecard) => 
    callApi('st_automation.api.recruitment.submit_interview_feedback', {
      interview_id: interviewId,
      rating,
      recommendation,
      comments,
      scorecard
    }),
  
  recordDecision: (applicantId, decision, notes, salaryOffered, designation) => 
    callApi('st_automation.api.recruitment.record_decision', {
      applicant_id: applicantId,
      decision,
      notes,
      salary_offered: salaryOffered,
      designation
    }),
  
  quickAddApplicant: (data) => 
    callApi('st_automation.api.recruitment.quick_add_applicant', data),
  
  getJobOpenings: (company) =>
    callApi('st_automation.api.recruitment.get_job_openings', { company }, 'GET'),

  getApplicant: (applicant_id) =>
    callApi('st_automation.api.recruitment.get_applicant_details', { applicant_id }, 'GET'),

  getActiveCandidates: (company) =>
    callApi('st_automation.api.recruitment.get_active_candidates', { company }, 'GET'),

  getDepartments: (company) =>
    callApi('st_automation.api.recruitment.get_departments', { company }, 'GET'),

  createJobOpening: (jobTitle, company, department, vacancies, publish) =>
    callApi('st_automation.api.recruitment.create_job_opening', {
      job_title: jobTitle,
      company,
      department,
      vacancies,
      publish,
    }),
  
  toggleJobOpening: (jobOpeningId, publish) => 
    callApi('st_automation.api.recruitment.toggle_job_opening', { job_opening_id: jobOpeningId, publish }),

  onboardCandidate: (applicantId) => 
    callApi('st_automation.api.recruitment.onboard_candidate', { applicant_id: applicantId }),
};
