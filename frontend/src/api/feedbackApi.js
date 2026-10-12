import { callApi, uploadFile } from './client';

export const feedbackApi = {
  submitFeedback: async ({ feedback_type, feedback, rating, title, is_anonymous, attachment, company }) => {
    return callApi('st_automation.api.feedback.submit_feedback', {
      feedback_type,
      feedback,
      rating,
      title,
      is_anonymous: is_anonymous ? 1 : 0,
      attachment,
      company,
    });
  },

  getMyFeedback: async (status) => {
    return callApi('st_automation.api.feedback.get_my_feedback', { status }, 'GET');
  },

  getFeedbackOverview: async (company, days = 30) => {
    return callApi('st_automation.api.feedback.get_feedback_overview', { company, days }, 'GET');
  },

  updateFeedbackStatus: async (feedbackId, status) => {
    return callApi('st_automation.api.feedback.update_feedback_status', {
      feedback_id: feedbackId,
      status,
    });
  },

  uploadAttachment: async (file) => {
    return uploadFile(file, { isPrivate: false, doctype: 'Staff Feedback' });
  },
};
