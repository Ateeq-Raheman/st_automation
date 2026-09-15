import { callApi } from './client';

export const exitApi = {
  getPipeline: (company, includeCompleted = 0) =>
    callApi('st_automation.api.exit.get_exit_pipeline', { company, include_completed: includeCompleted }, 'GET'),

  getTemplates: (company) =>
    callApi('st_automation.api.exit.get_templates', { company }, 'GET'),

  getEmployeesForSeparation: (company) =>
    callApi('st_automation.api.exit.get_employees_for_separation', { company }, 'GET'),

  startSeparation: (employee, template, resignationDate, relievingDate) =>
    callApi('st_automation.api.exit.start_separation', {
      employee, template, resignation_date: resignationDate, relieving_date: relievingDate
    }),

  completeStage: (separation, taskName) =>
    callApi('st_automation.api.exit.complete_stage', { separation, task_name: taskName, record_type: 'exit' }),

  assignTask: (taskName, user) =>
    callApi('st_automation.api.exit.assign_task', { task_name: taskName, user }),

  addTaskComment: (taskName, comment) =>
    callApi('st_automation.api.exit.add_task_comment', { task_name: taskName, comment }),

  markEmployeeLeft: (employee, relievingDate) =>
    callApi('st_automation.api.exit.mark_employee_left', { employee, relieving_date: relievingDate }),

  getEmployeeStatus: (token) =>
    callApi('st_automation.api.exit.get_employee_status', { token }, 'GET'),

  resendStatusLink: (separation) =>
    callApi('st_automation.api.exit.resend_status_link', { separation, record_type: 'exit' }),

  revokeStatusLink: (separation) =>
    callApi('st_automation.api.exit.revoke_status_link', { separation, record_type: 'exit' })
};
