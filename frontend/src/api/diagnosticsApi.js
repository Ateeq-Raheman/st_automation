import { callApi } from './client';

export const diagnosticsApi = {
  checkHealth: (company) => 
    callApi('st_automation.api.diagnostics.check_system_health', { company }, 'GET'),
  
  autoFix: (issueId, company) => 
    callApi('st_automation.api.diagnostics.auto_fix_issue', { issue_id: issueId, company }),
  
  getUserProfile: () => 
    callApi('st_automation.api.auth.get_current_user_profile', {}, 'GET'),
};
