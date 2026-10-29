import { callApi } from './client';

const BASE = 'st_automation.api.salary_structure';

export const salaryStructureApi = {
  getFormMetadata: (company) =>
    callApi(`${BASE}.get_form_metadata`, { company }, 'GET'),

  listStructures: (company) =>
    callApi(`${BASE}.list_salary_structures`, { company }, 'GET'),

  getStructure: (name) =>
    callApi(`${BASE}.get_salary_structure`, { name }, 'GET'),

  saveStructure: (data, name = null, submit = false) =>
    callApi(`${BASE}.save_salary_structure`, { data, name, submit: submit ? 1 : 0 }),

  deleteStructure: (name) =>
    callApi(`${BASE}.delete_salary_structure`, { name }),

  listAssignments: (company, salaryStructure, search) =>
    callApi(`${BASE}.list_salary_structure_assignments`, {
      company,
      salary_structure: salaryStructure,
      search,
    }, 'GET'),

  deleteAssignment: (name) =>
    callApi(`${BASE}.delete_salary_structure_assignment`, { name }),
};
