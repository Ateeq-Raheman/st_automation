import { callApi } from './client';

export const onboardingApi = {
  getPipeline: (company, includeCompleted = 0) =>
    callApi('st_automation.api.onboarding.get_onboarding_pipeline', { company, include_completed: includeCompleted }, 'GET'),

  getTemplates: (company) =>
    callApi('st_automation.api.onboarding.get_templates', { company, template_type: 'onboarding' }, 'GET'),

  startOnboarding: (employee, template, joiningDate) =>
    callApi('st_automation.api.onboarding.start_onboarding', { employee, template, joining_date: joiningDate }),

  completeStage: (employee, taskName) =>
    callApi('st_automation.api.onboarding.complete_stage', { employee, task_name: taskName, record_type: 'onboarding' }),

  assignTask: (taskName, user) =>
    callApi('st_automation.api.onboarding.assign_task', { task_name: taskName, user }),

  addTaskComment: (taskName, comment) =>
    callApi('st_automation.api.onboarding.add_task_comment', { task_name: taskName, comment }),

  getEmployeeStatus: (token) =>
    callApi('st_automation.api.onboarding.get_employee_status', { token }, 'GET'),

  resendStatusLink: (employee) =>
    callApi('st_automation.api.onboarding.resend_status_link', { employee, record_type: 'onboarding' }),

  revokeStatusLink: (employee) =>
    callApi('st_automation.api.onboarding.revoke_status_link', { employee, record_type: 'onboarding' })
};
