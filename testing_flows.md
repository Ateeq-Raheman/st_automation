# E2E UI Testing Flows - ST Automation

This document outlines the exact, step-by-step UI testing flows required to comprehensively verify the frontend of the ST Automation HR & Payroll application. 

**Target Environment:** `http://127.0.0.1:8000/frontend`
**Default Credentials:** Username: `Administrator` | Password: `admin123`

## 1. Authentication & Layout
1. **Navigate** to `http://127.0.0.1:8000/frontend`.
2. **Log in** using the default credentials if prompted.
3. **Verify Sidebar Navigation:** Click through all sidebar links (Dashboard, Recruitment, Payroll) and ensure the main content area updates without full page reloads.

## 2. Recruitment Dashboard
### A. Pipeline & Kanban Board
1. **Navigate** to the Recruitment Dashboard.
2. **Verify Kanban Rendering:** Ensure the pipeline stages (Open, Replied, Accepted, Hold, Rejected) render horizontally with candidate cards.
3. **Drag and Drop (Optional):** Try moving a candidate card from 'Open' to 'Replied' and verify the UI updates smoothly.

### B. View Candidate Details
1. **Action:** Click on any candidate card in the pipeline.
2. **Expected:** A detailed view/modal should open.
3. **Verify UI:**
   - Ensure the candidate's name, email, and phone number are visible.
   - Specifically verify that the text is **visible and legible** (checking for previous bugs where text was rendered invisible due to color classes).

### C. Quick Add Candidate
1. **Action:** Click the "Quick Add Candidate" (or "+ Add Candidate") button.
2. **Fill Form:** Enter dummy data (e.g., Name: UI Test Candidate, Email: uitest@example.com, Phone: 9999999999, Job Title: Tester).
3. **Submit:** Click the submit/save button.
4. **Verify UI:** The modal should close and the candidate should appear in the pipeline immediately. Verify no page crash or unhandled promise rejection occurs.

## 3. Interview Scheduling & Feedback
### A. Scheduling
1. **Action:** Open a candidate's details and click "Schedule Interview".
2. **Fill Form:** Select a date/time slot, assign an interviewer (e.g., Administrator), and submit.
3. **Verify UI:** A success message or toast notification should appear.

### B. Feedback Submission
1. **Action:** Navigate to the external/guest feedback link (this can be found in the Interview record).
2. **Fill Form:** Enter a rating and textual feedback.
3. **Verify UI:** Ensure the submission button is aligned properly and a "Thank you" or success state is shown after submission.

## 4. Payroll Operations
### A. Payroll Dashboard
1. **Navigate** to the Payroll module.
2. **Verify Metrics:** Check the top summary cards:
   - Total Gross Pay
   - Total Net Pay
   - Total Employees processed
   *Note: These should render numerical values (or ₹0) correctly without throwing React rendering errors.*

### B. Run Payroll Wizard
1. **Action:** Click "Run Payroll".
2. **Select Dates:** Choose September 1st, 2026 to September 30th, 2026.
3. **Generate Draft:** Proceed to generate the draft slips.
4. **Verify UI:** A summary of drafted slips should appear (e.g., "Generated X salary slips").

### C. Submit Payroll & Alignment Checks
1. **Action:** Proceed to submit the draft payroll officially.
2. **Verify UI Alignment (Critical):**
   - Check the **"Submitted Officially"** badge or button. Ensure the text is not wrapped awkwardly and the alignment is horizontally centered.
   - Verify that the **"View Salary Slips"** navigation button appears immediately after successful submission.
   - Click "View Salary Slips" and ensure it navigates correctly to the slips list.

## 5. Job Openings & Scheduled Interviews
### A. Job Openings
1. **Navigate** to the sidebar item **"Job Openings"** (under Recruitment).
2. **Verify Grid:** Job cards render in a 1/2/3-column responsive grid, each showing title, status badge, department, designation, vacancies, and applicant count.
3. **Action:** Click **"New Job Opening"** in the top-right.
4. **Fill Form:** Enter Job Title (e.g. "UI Test Role"), select Department, set Vacancies, toggle Publish.
5. **Submit** and **Verify UI:** Toast "Job Opening created!" appears, modal closes, new card appears in the grid.
6. **Action:** On any job card, click the **Published/Hidden** toggle pill (globe icon).
7. **Verify UI:** Pill switches between green "Published" (emerald) and grey "Hidden" style immediately; toast "Job visibility updated" appears.
8. **Verify Empty State:** If no openings exist, confirm the dashed placeholder card with "No Job Openings found in ERPNext" renders (not a blank/broken layout).

### B. My Scheduled Interviews
1. **Navigate** to the sidebar item **"Scheduled Interviews"** (visible to interviewers/recruiters/HR).
2. **Verify Cards:** Each interview card shows candidate name, job title, status badge (Scheduled/Completed), scheduled date/time, and a "View CV" link (or "No CV" text) when no resume is attached.
3. **Action:** Click **"View Candidate"** on a card.
4. **Verify UI:** Applicant detail modal opens with correct candidate loaded.
5. **Action:** Click **"Submit Feedback"** (or "Update Feedback" if already completed).
6. **Verify UI:** Feedback Scorecard modal opens (see Section 3B for feedback flow).
7. **Action (HR/System Manager only):** Click **"Schedule Interview"** button top-right to ad-hoc schedule a new interview via the **Select Candidate** modal; verify it lists candidates to pick from and opens the applicant detail modal in scheduling mode after selection.
8. **Verify Empty State:** With no interviews assigned, confirm the dashed placeholder "No scheduled interviews assigned" renders correctly.

## 6. Onboarding Pipeline
1. **Navigate** to the sidebar item **"Onboarding Pipeline"** (HR-only, under "Onboarding & Separation").
2. **Verify Header:** Active onboarding count shown; **Active / Completed** toggle pill switches list filter.
3. **Action:** Click **"Start Onboarding"**.
4. **Fill Form (StartOnboardingModal):**
   - Search and select an active Employee (type 2+ characters of an employee name).
   - Optionally pick an Onboarding Template from the dropdown (or leave "Auto-select for company").
   - Set Joining Date (defaults to today).
5. **Submit:** Click **"Start Onboarding"** in the modal footer.
6. **Verify UI:** Toast "Onboarding started!" appears, modal closes, a new pipeline card appears with 0% progress.
7. **Action:** Click a pipeline card row to expand it.
8. **Verify Checklist:** Task list renders in order; only the first incomplete task is unlocked (numbered), later tasks show a **Lock** icon and "Locked" pill, completed tasks show a green "Completed" pill.
9. **Action:** On the current (unlocked) task, type an email into "Assign to email..." and click **Assign** — verify toast "Task assigned!" and the task now shows "Waiting on Assignee" instead of a Mark Complete button.
10. **Action:** On an unassigned current task, click **"Mark Complete"**.
11. **Verify UI:** Toast "Task completed!", progress bar advances, next task unlocks.
12. **Action:** Type a note in "Add a note..." under the current task and click **Add**.
13. **Verify UI:** Toast "Note added!" appears.
14. **Action:** Click **"Generate Link"** (or "Resend" if a token already exists) in the Magic Link section.
15. **Verify UI:** Toast confirms link generation; a status URL appears with **Copy Link** and **Revoke** buttons.
16. **Action:** Click **Copy Link**, then open that URL in a new tab (public **Onboarding Portal**, `?onboarding_token=...`).
17. **Verify Public Page:** "Welcome to {company}, {employee}!" banner, progress bar, and the same checklist (read-only, no action buttons) render correctly outside the authenticated app shell.
18. **Action:** Back in the pipeline view, click **Revoke** on the link.
19. **Verify UI:** Toast "Link revoked!"; reopening the previously copied URL should now show the "Link Invalid" error state.
20. **Action:** Toggle to the **Completed** tab.
21. **Verify UI:** Fully-finished onboardings (100%) appear here instead of under Active.

## 7. Exit / Separation Pipeline
1. **Navigate** to the sidebar item **"Exit Pipeline"** (HR-only).
2. **Verify Header:** Active separation count; **Active / Completed** toggle.
3. **Action:** Click **"Initiate Separation"** (orange button).
4. **Fill Form (StartSeparationModal):**
   - Search and select an active Employee.
   - Optionally choose a Separation Template.
   - Set Resignation Date (required) and optional Relieving Date ("Can be set later").
5. **Submit:** Click **"Initiate Separation"**.
6. **Verify UI:** Toast "Separation initiated!", modal closes, new card appears in the pipeline with orange accent styling.
7. **Action:** Expand the card and work through the Exit Checklist exactly as in Onboarding (Assign, Mark Complete, Add note, Generate/Copy/Revoke link) — verify orange-themed buttons/borders render legibly (no white-on-white).
8. **Verify Public Exit Status Page:** Open the copied `?exit_token=...` link — confirm "Exit Tracking: {employee}" header and read-only checklist render.
9. **Action:** Once all tasks reach 100%, verify the amber **"All exit tasks completed"** banner appears with a **"Mark as Left"** button.
10. **Action:** Click **"Mark as Left"**.
11. **Fill Form:** Confirm/adjust the Relieving Date in the confirmation dialog.
12. **Submit:** Click **"Confirm & Mark Left"**.
13. **Verify UI:** Toast "Employee marked as Left!"; the employee's card now shows a red **"Left"** badge next to their name, and the employee's user account is deactivated per the dialog's warning text.

## 8. Template Management
1. **Navigate** to the sidebar item **"Template Management"** (under "System & Tools").
2. **Verify Tabs:** "Onboarding Templates" / "Separation Templates" pill toggle switches the listed templates; search box filters by title/name.
3. **Action:** Click **"Create Template"**.
4. **Fill Form (TemplateFormPage):**
   - Enter Template Title (e.g. "UI Test Onboarding Flow").
   - Optionally set Company, Department, Designation, Employee Grade filters.
   - For each Task Activity: Activity Name (required), Assign To (specific User or Role — for Onboarding only; Separation tasks auto-assign to HR Manager), Start Day offset, Duration, optional description.
5. **Action:** Click **"Add Another Task"** to add a second activity row; click the trash icon to remove a row.
6. **Submit:** Click **"Save Template"**.
7. **Verify UI:** Toast "Template saved successfully", navigates back to the list, new template card appears with correct company/department/designation summary.
8. **Action:** Hover a template card, click the **pencil (edit)** icon.
9. **Verify UI:** Form pre-fills with existing title/activities; edit and re-save works.
10. **Action:** Hover a template card, click the **trash (delete)** icon.
11. **Verify UI:** Browser `confirm()` dialog appears — confirm deletion, toast "Template deleted successfully", card is removed from the list.
   - ⚠️ Note: this uses a native `window.confirm()` popup, not a custom modal — flag if it looks out of place with the rest of the UI or if automation needs to handle a native dialog.

## 9. Loans & Advances
1. **Navigate** to the sidebar item **"Loans & Advances"**.
2. **Verify Table:** Active loans list shows Employee ID/Name, Loan Amount, Monthly EMI, Tenure, Disbursed date, and a status Badge (Sanctioned/Disbursed/Partially Disbursed/Loan Closure Requested/Closed).
3. **Action:** Click **"New Loan Application"** to launch the wizard.
   - ⚠️ Note: the modal title reads **"4-Step Loan Application Wizard"** while the sidebar badge says **"3-Step"** and the stepper header only shows 3 numbered steps (a 4th "Disburse" screen follows after step 3) — flag this label inconsistency during review.
4. **Step 1 (Employee & Amount):** Select an Employee, enter Loan Amount (e.g. 50000), Repayment Tenure (months), Loan Start/Disbursement Date (cannot be in the future), optionally expand "Show Advanced Options" to set a Moratorium tenure. Click **"Calculate EMI Schedule"**.
5. **Step 2 (EMI & Schedule):** Verify Principal, Monthly EMI, and Tenure preview cards render with correct values and legible contrast (indigo EMI card). Click **"Proceed to Sanction"**.
6. **Step 3 (Confirm & Disburse):** Review summary, click **"Sanction Loan"**.
7. **Verify UI:** Toast "Loan sanctioned successfully!"; wizard advances to Step 4 with a green checkmark and "Loan Sanctioned Successfully!" message.
8. **Step 4:** Click **"Disburse Now"** (or "Skip for Later" to leave it Sanctioned).
9. **Verify UI:** If disbursed, toast "Loan disbursed successfully!"; new loan appears in the Loans table with the correct status.
10. **Action:** Click on any row in the Loans table (not just newly created ones).
11. **Verify Loan Detail Modal:** Status, Loan Amount, Monthly EMI, Total Paid stat cards; Applicant Details and Timeline panels; Repayment Schedule table with per-installment Paid/Pending indicators.
12. **Action (if status is "Sanctioned"):** Click **"Disburse"** inside the detail modal and verify it updates status/toast without needing to reopen the wizard.
13. **Action:** Click **"Assign Structure"** button next to "New Loan Application".
14. **Verify UI:** Assign Salary Structure modal opens; complete assignment and confirm it appears under "Recent Structure Assignments" back on the Payroll Overview dashboard.

## 10. Diagnostics / System Readiness
1. **Navigate** to the sidebar item **"System Readiness"** (under "System & Tools").
2. **Verify Overall Health Banner:** Green "All Systems Verified & Ready!" (emerald) when healthy, or amber "Setup Action Items Detected" banner when checks fail — confirm text contrast is legible in both states and in dark mode.
3. **Verify Checks List:** Each check row shows an icon (pass=emerald check, warning=amber triangle, action_required=rose alert, info=indigo activity), title, category badge, and message.
4. **Action:** For any check with an **"Auto-Fix Issue"** button, click it.
5. **Verify UI:** Button shows loading state, toast "Fixed successfully!" (or the specific message) appears, the check re-evaluates and its status/icon updates; Payroll data also silently refreshes in the background.
6. **Action:** Click **"Re-Check Diagnostics"** in the top-right.
7. **Verify UI:** List refreshes with a loading state and no layout shift/crash.

## 11. Visual Theme & Styling
- The application uses a "GenZ HR style" with Emerald/Indigo/Amber accents and a `gray-50` background.
- Throughout all flows, watch for any elements that feel out of place, misaligned, or inaccessible (e.g., white text on white backgrounds). Report any such anomalies.
- Pay particular attention to modules with heavy conditional color classes (Diagnostics status rows, Onboarding vs. Exit red/orange theming, Loan status badges) since these are most prone to low-contrast dark-mode/light-mode mismatches.

## 12. Missing Coverage Notes
Items found in the codebase that are not cleanly reachable via a single linear UI test flow, or that need explicit tester judgment:
- **Public token pages** (`OnboardingStatusPage`, `ExitStatusPage`, `CandidateSlotBooking`, `InterviewFeedback`) cannot be navigated to directly by URL guessing — the token must be copied from an actual pipeline record's generated link during the test session (see Sections 6/7 and Section 3B).
- **Permission-gated views:** Sidebar sections (Recruitment, Onboarding & Separation, Payroll & Finance) are conditionally visible based on `is_hr_admin` / `is_recruiter` / `is_interviewer` / `is_employee` roles on the logged-in user's profile. Testing as `Administrator` should expose everything, but a full role-matrix test (e.g. logging in as a plain Employee or Interviewer-only user) is out of scope here and would need separate test users.
- **Drag-and-drop Kanban reordering** (Section 2A.3) is marked optional in the existing doc and depends on a working DnD library — verify it doesn't silently no-op.
- **Error/failure states** are not exercised by this pass: e.g. submitting the loan/onboarding/separation forms with invalid data, network failures mid-payroll-run, or an expired/revoked token page. Consider a follow-up negative-testing pass.
- **Native `window.confirm()`** used for template deletion (Section 8.11) bypasses the app's own Modal/Toast system — worth a design consistency callout.
- **Bulk Incentive / Quick Incentive modals** are reachable from the Payroll Overview dashboard buttons already implied in Section 4 but not explicitly scripted — add explicit steps there if a future revision wants dedicated coverage.
