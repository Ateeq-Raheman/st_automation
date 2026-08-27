import { callApi } from './client';

export const recruitmentApi = {
  getOverview: () => callApi('st_automation.api.recruitment.get_recruitment_overview', {}, 'GET'),
  
  getPipeline: (jobOpening, search) => 
    callApi('st_automation.api.recruitment.get_pipeline', { job_opening: jobOpening, search }, 'GET'),
  
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
  
  getJobOpenings: () => 
    callApi('st_automation.api.recruitment.get_job_openings', {}, 'GET'),
  
  toggleJobOpening: (jobOpeningId, publish) => 
    callApi('st_automation.api.recruitment.toggle_job_opening', { job_opening_id: jobOpeningId, publish }),
};
