# St Automation - Changes Log

## User Requests Addressed
1. **3-Round Interview Pipeline:** Transformed the single 'Schedule Interview' button into a structured 3-Round format.
   - Round 1 (Initial): Multi-select interviewers.
   - Round 2 (Technical): Defaults to 'Hamza Ali'.
   - Round 3 (Managerial): Defaults to 'Abdul Manan'.
   - Instead of complex Google API integrations upfront, we automatically generate standard `.ics` Calendar Invites and send them via Email to all assigned interviewers for a native experience.
2. **Draft Payroll Approval Workflow:** Adjusted the 1-Click Payroll Run so it stops at 'Draft' mode instead of immediately submitting. HR can preview all salary slips and click "Submit Official Payroll" when everything looks good.
3. **Payroll Validation:** Added strict duplicate checking. If a Payroll Entry already exists for the month, it will block duplicate runs and prevent the same person from being processed twice.
4. **Loan Repayment Bug:** Fixed a state leak in `LoansWizard.jsx`. When disbursing multiple loans back-to-back, the modal wouldn't reset. Now it resets its internal state (employee, amount, etc.) every time it opens or closes.
5. **UI Re-branding:** Entirely eliminated the dark mode "gray" styles across the Kanban board and modals. Restyled using vibrant Emerald, Indigo, and Amber accents on clean white/gray-50 backgrounds.
6. **Role-Based Salary Slips Access:** Updated the backend and `Sidebar.jsx` so that if a regular employee logs in, they can't access HR functions but *can* see and download their own personal Salary Slips securely.
7. **Sidebar Aesthetics:** Replaced the default sparkles logo with a Gen-Z themed Flame icon. Perfectly aligned the 'Standard Touch' typography and corrected the active tab hover state (white icon instead of black) for better contrast.
8. **Responsive Kanban Board & Cards:** Fixed a UI glitch where Kanban cards had a missing border and weird drop-shadow. Cards now have an explicit white background and clean shadows. The entire board is now horizontally scrollable on mobile (snap-x), and the search bar layout on mobile was fixed so it no longer gets cut off.
9. **Flexible Payroll Processing:** Re-engineered the Payroll validation. Instead of strictly blocking a new Payroll Run if *any* entry exists for the month, the system now intelligently counts how many active employees exist versus how many have actually received Salary Slips. It only blocks you if 100% of employees are fully processed, allowing you to run payroll in staggered batches (e.g., as missing structures are assigned).
10. **Refined Button Layouts:** Corrected an issue on the Command Center where the "Run Payroll Now" and "View Payslips" buttons would stack awkwardly on smaller screens leaving empty white space. They now adaptively scale to full-width (`w-full`) when stacked vertically, and sit side-by-side gracefully on wider screens.
11. **Clean Kanban Layout:** Removed the redundant "Quick Add" button from the Kanban board controls (since it's already available globally in the Topbar as "Add Candidate"). This cleanly fixes the layout issue where the controls were wrapping to multiple lines and cluttering the screen.

## Mistakes Made & Addressed
- *Mistake:* Overlooked `repayment_start_date` and `moratorium_tenure` defaults when automating the ERPNext Loan creation, causing validation failures.
- *Fix:* Hardcoded `moratorium_tenure = 0` and passed the current date to `repayment_start_date` to ensure the 1-click loan works seamlessly.
- *Mistake:* Recommending Frappe Events for Calendar integration without checking if Google Calendar OAuth was actually configured on the site.
- *Fix:* Pivoted to generating standard `.ics` (iCalendar) attachments within the email payload. This bypasses the need for OAuth but gives the exact same result (Interviewers click 'Add to Calendar' in their email).

## Counter Enhancements
- **Multi-Select Dropdowns:** Upgraded `EmployeeSelect.jsx` to natively support multi-select so HR can assign an entire panel to Round 1.
- **Safety Checks:** Automatically configured the `is_term_loan` flag dynamically on Loan Products so Salary deductions don't fail later.
- **Self-Healing Payroll Accounts:** If a company lacks a default "Payroll Payable Account", the system auto-creates one and sets it in the background rather than crashing the payroll run.
