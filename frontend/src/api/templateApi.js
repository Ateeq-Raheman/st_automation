import { callApi } from './client';

export const templateApi = {
  getTemplates: (templateType) =>
    callApi('st_automation.api.template.get_templates', { template_type: templateType }, 'GET'),

  getTemplate: (templateType, name) =>
    callApi('st_automation.api.template.get_template', { template_type: templateType, name }, 'GET'),

  saveTemplate: (templateType, data) =>
    callApi('st_automation.api.template.save_template', { template_type: templateType, data: JSON.stringify(data) }),

  deleteTemplate: (templateType, name) =>
    callApi('st_automation.api.template.delete_template', { template_type: templateType, name }),

  getOptions: (company) =>
    callApi('st_automation.api.template.get_options_for_templates', { company }, 'GET')
};
