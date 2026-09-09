import { callApi } from './client';

export const payrollApi = {
  getSummary: (company, month, year) => 
    callApi('st_automation.api.payroll.get_payroll_dashboard_summary', { company, month, year }, 'GET'),
  
  quickAddIncentive: (formData) =>
    callApi('st_automation.api.payroll.quick_add_incentive', {
      employee: formData.employee,
      amount: formData.amount,
      salary_component: formData.salary_component,
      payroll_date: formData.payroll_date,
      notes: formData.notes,
      is_recurring: formData.is_recurring ? 1 : 0,
      from_date: formData.from_date,
      to_date: formData.to_date,
    }),
  
  bulkAddIncentives: (incentivesList) => 
    callApi('st_automation.api.payroll.bulk_add_incentives', { incentives: incentivesList }),
  
  getLoanPreview: (employee, amount, tenureMonths, loanProduct) => 
    callApi('st_automation.api.payroll.get_loan_preview', {
      employee,
      amount,
      tenure_months: tenureMonths,
      loan_product: loanProduct,
    }, 'GET'),
  
  createLoanAndDisburse: (employee, amount, tenureMonths, monthlyAmount, loanProduct, customMoratorium = 0, disbursementDate = null) =>
    callApi('st_automation.api.payroll.create_loan_and_disburse', {
      employee,
      amount,
      tenure_months: tenureMonths,
      monthly_repayment_amount: monthlyAmount,
      loan_product: loanProduct,
      custom_moratorium: customMoratorium,
      disbursement_date: disbursementDate,
    }),
  
  runPayrollAndReport: (company, startDate, endDate, costCenter) => 
    callApi('st_automation.api.payroll.run_payroll_and_report', {
      company,
      start_date: startDate,
      end_date: endDate,
      cost_center: costCenter,
    }),
  
  getSalarySlips: (company, month, year, employee) =>
    callApi('st_automation.api.payroll.get_salary_slips_summary', {
      company,
      month,
      year,
      employee,
    }, 'GET'),

  getActiveLoans: (company) =>
    callApi('st_automation.api.payroll.get_active_loans', { company }, 'GET'),

  getRecentSalaryStructureAssignments: (company) =>
    callApi('st_automation.api.payroll.get_recent_salary_structure_assignments', { company }, 'GET'),
};
