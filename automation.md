# StandardTouch HR Ops — Custom App Specification

**Purpose of this document:** a build brief for an agentic AI coding tool to implement a custom HR operations app for Standard Touch e-Solutions. It covers two functional domains — **Recruitment** and **Payroll/Loans** — unified under one simplified interface for the HR team, sitting on top of an existing ERPNext/Frappe backend.

---

## 1. Vision & Core Problem

Standard Touch's HR team currently operates recruitment as a manual, WhatsApp-and-email-driven process, and payroll/loan management directly through raw ERPNext Desk forms. Both work, but both require too many clicks, too much Frappe-specific knowledge, and too much jumping between unrelated screens for a non-technical HR user to move fast.

**Goal:** a single custom web app, built on top of the existing ERPNext data (Job Applicant, Employee, Salary Slip, Loan, etc.), that lets an HR user complete each real-world task — "shortlist this candidate," "give this employee a ₹5,000 bonus this month," "check who's due for payroll" — in as few clicks as possible, without ever needing to understand Frappe's underlying doctype structure.

This is explicitly **not** a rebuild of ERPNext's data model. It's a purpose-built, opinionated frontend over the existing backend, with a thin custom API layer where standard REST calls aren't enough (e.g., multi-step actions that should feel like one click to the user but touch several doctypes underneath).

---

## 2. Users & Roles

| Role | Who | Primary needs |
|---|---|---|
| **Recruitment Manager** | Management staff who review applicants | See new applicants, shortlist/reject, view interview outcomes, make final hire/bench/reject decisions |
| **Interviewer** | Department leads assigned to interview | See their scheduled interviews, submit feedback |
| **HR / Payroll Admin** | Core HR team | Run payroll, manage loans, add incentives, view/download payslips |
| **Candidate** (external, unauthenticated) | Job applicants | Apply for a job, book an interview slot via a link — no login |

The custom app's primary audience is **Recruitment Manager** and **HR/Payroll Admin** — these two roles should get the most polished, click-minimized experience. Interviewer and Candidate views can be simpler/lighter.

---

## 3. Tech Stack

- **Frontend:** Separate React application (Next.js recommended for routing + API layer convenience), not Frappe's native Desk UI and not Frappe UI/Vue.
- **Backend:** Existing Frappe/ERPNext instance, accessed via:
  - Standard Frappe REST API (`/api/resource/<doctype>`) for straightforward CRUD
  - A **thin custom Frappe app** (Python) exposing `@frappe.whitelist()` methods for composite actions that should feel atomic to the user but span multiple doctypes (see Section 6 and 7 for the specific endpoints needed)
- **Auth:** Frappe session-based or API key/secret token auth — pick one consistently; session-based is simpler if the React app is served from a trusted domain, token-based is safer if it's fully decoupled. This is an open decision for the implementer (see Section 9, Q1).
- **Hosting:** the React app can be hosted separately from the Frappe site; only the Frappe REST/custom API endpoints need to be reachable from it (CORS configuration required).

---

## 4. Module A — Recruitment

### 4.1 Functional flow

```
Candidate applies (public job page)
  → Job Applicant created automatically
  → Management notified
  → Management shortlists → booking token generated → candidate emailed
  → Candidate opens token link (no login) → picks an available interview slot
  → Interview created → interviewer's Google Calendar blocked + invited
  → Interview happens
  → Interviewer submits feedback
  → (loop back to slot booking if more rounds needed for that department)
  → Final decision: Selected / On Bench / Rejected
  → Selected → Job Offer sent → accepted → Employee + User auto-created
```

### 4.2 Screens needed

| Screen | Who uses it | Key actions, minimized to 1–2 clicks each |
|---|---|---|
| **Applicant Pipeline** (kanban, by stage: Applied → Shortlisted → Interview Scheduled → Completed → Decided) | Recruitment Manager | Drag card to shortlist; one-click reject with optional reason; click card to open detail |
| **Applicant Detail** | Recruitment Manager | View CV/resume inline (not a download), see application answers, one-click "Shortlist & Send Booking Link," one-click "Reject" |
| **Interview Slot Booking** (public, token-based, no login) | Candidate | See 3–5 next available slots as clickable buttons, confirm in one click |
| **My Interviews** | Interviewer | List of upcoming interviews with candidate name/CV link; one-click "Submit Feedback" |
| **Feedback Form** | Interviewer | Structured rating (not free text only) + Pass/Fail/Hold radio, single submit |
| **Decision Screen** | Recruitment Manager | After feedback is in: three big buttons — Select / Bench / Reject — each triggers the full downstream flow (offer email, bench tag, rejection email) with zero further clicks |
| **Job Openings** | Recruitment Manager | Simple list/create; toggle "published on career page" |

### 4.3 Data model (existing doctypes to use — do not recreate)

- `Job Opening`, `Job Applicant`, `Interview`, `Interview Round`, `Interview Feedback`, `Job Offer`, `Employee Onboarding`, `Employee`, `User`
- **New custom fields needed on `Job Applicant`:** `booking_token` (Data, hidden), `booking_token_expiry` (Datetime)
- **New Workflow needed on `Job Applicant`:** states Applied → Shortlisted → Awaiting Slot Booking → Interview Scheduled → Interview Completed → Selected/On Bench/Rejected (standard 4-state field is insufficient — see prior discussion)

### 4.4 Custom backend endpoints required

| Endpoint | Purpose |
|---|---|
| `get_available_slots(token)` | Public, token-authenticated. Checks relevant interviewers' Google Calendar free/busy for the applicant's department, returns open slots. |
| `book_slot(token, datetime)` | Public, token-authenticated. Creates the Interview record + a synced Google Calendar Event in one call; invalidates the token. |
| `shortlist_and_notify(applicant_id)` | Generates booking token, moves workflow state, sends candidate email — one call instead of three separate UI steps. |
| `record_decision(applicant_id, decision, notes)` | Handles all three decision branches (offer creation / bench tagging / rejection email) behind one button. |

---

## 5. Module B — Payroll & Loans

### 5.1 Functional flow

**One-time setup** (done once per company, not per payroll run):
```
Employee master data → Salary Structure defined → Salary Structure Assignment per employee
Loan Product configured → Company-level Loan Settings (accrual frequency, collection offset sequence)
Branded Print Format designed
```

**Recurring monthly cycle:**
```
For each employee:
  Has an active loan? → Yes: Loan Disbursement/Repayment Schedule already active → installment auto-links to this period
                       → No: standard earnings only
  Has a one-time incentive this period? → Yes: Additional Salary entry created
                                          → No: fixed structure earnings only
→ Payroll Entry run for the period
→ Salary Slips auto-generated per employee
→ Basic + Incentive = Gross Pay; Loan Installment deducted automatically
→ Net Pay calculated
→ Branded Salary Slip PDF delivered to employee
```

### 5.2 Screens needed

| Screen | Who uses it | Key actions, minimized to 1–2 clicks each |
|---|---|---|
| **Payroll Dashboard** | HR/Payroll Admin | At-a-glance: employees due this cycle, who has active loans, who has pending incentive entries — a single view replacing multiple Desk list-views |
| **Quick Incentive Entry** | HR/Payroll Admin | Pick employee, type amount, one button — creates the Additional Salary record without exposing the raw Frappe form's extra fields (tax flags, recurring toggle only shown if relevant) |
| **Loan Application Wizard** | HR/Payroll Admin | A **guided 3-step wizard** collapsing what currently takes 6+ separate Frappe screens (Loan Product check → Loan creation → Moratorium/repayment config → Disbursement) into: (1) pick employee + amount + tenure, (2) confirm auto-calculated monthly installment, (3) confirm & disburse. Moratorium should default to 0 and be hidden behind an "advanced options" toggle, since it caused real confusion in the POC when left at a non-zero default. |
| **Run Payroll** | HR/Payroll Admin | Pick period → one button "Run Payroll" → shows a progress/result list (created / skipped / errored) instead of raw Payroll Entry doctype fields |
| **Salary Slip Viewer** | HR/Payroll Admin, Employee (self-service) | View/download the branded PDF; no need to open the underlying Frappe form |

### 5.3 Data model (existing doctypes to use — do not recreate)

- `Employee`, `Salary Structure`, `Salary Structure Assignment`, `Salary Component`, `Additional Salary`
- `Loan Product`, `Loan`, `Loan Disbursement`, `Loan Repayment Schedule`, `Payroll Entry`, `Salary Slip`
- Company-level fields: `Loan Accrual Frequency`, `Collection Offset Sequence for Standard Asset` (on `Company` → Loan tab)

### 5.4 Custom backend endpoints required

| Endpoint | Purpose |
|---|---|
| `get_payroll_dashboard_summary(period)` | Single call returning employee counts by status (loan active, incentive pending, structure missing) — avoids the frontend making 5+ separate REST calls |
| `create_loan_and_disburse(employee, amount, tenure, monthly_amount)` | Wraps Loan creation + Disbursement into one atomic action; enforces `moratorium_tenure = 0` unless explicitly overridden |
| `quick_add_incentive(employee, amount, period, component)` | Wraps Additional Salary creation with sane defaults pre-filled |
| `run_payroll_and_report(period)` | Wraps Payroll Entry's Get Employees → Create Salary Slips → Submit sequence, returns a clean success/failure report per employee |

---

## 6. UX Principles (apply to every screen)

1. **No raw Frappe Desk forms exposed to HR users.** Every field the HR user sees should be one they'd actually recognize from their manual process — not Frappe's internal field names.
2. **Multi-doctype actions collapse into one button.** If a task currently takes creating 3 linked Frappe documents (e.g., Loan → Loan Disbursement → confirm), the custom app should do it in one guided step, using the composite endpoints in Sections 4.4 and 5.4.
3. **Sensible defaults, hidden advanced options.** Fields like Moratorium Tenure, Repayment Schedule Type, or Interest Day-Count Convention should default correctly and stay hidden unless the user opts into "advanced" mode — these caused real confusion even for the technical team during the proof-of-concept.
4. **Dashboards over lists.** Wherever ERPNext would show a raw list view, the custom app should show a task-oriented dashboard (e.g., "3 candidates awaiting your decision" rather than a generic Job Applicant list).
5. **Conditional UI, not empty states.** If an employee has no loan, don't show an empty Loan section — omit it entirely (matches the conditional rendering logic already proven in the Salary Slip print format).
6. **Mobile-usable for at least the approval/decision actions** (shortlist, reject, select/bench/reject, quick incentive) since management may act on these away from a desktop.

---

## 7. Non-Functional Requirements

- **Permissions:** must respect Frappe's existing role-based permissions — a Recruitment Manager shouldn't be able to run payroll, and vice versa, even if the frontend doesn't render that UI for them (enforce server-side, not just by hiding buttons).
- **Notifications:** all candidate-facing and employee-facing emails (shortlist notification, interview confirmation, offer, rejection, payslip delivery) should continue to be sent from Frappe's existing Notification/Email Account configuration — the custom app triggers them, it doesn't reimplement email sending.
- **Auditability:** every composite backend action should still create real, standard Frappe documents (Loan, Interview, Salary Slip, etc.) — nothing should exist only in the custom app's own state. This keeps ERPNext's standard reporting, permissions, and audit trail intact.

---

## 8. Open Questions for the Implementer

These weren't fully settled in planning and need a decision during build:

1. **Auth strategy** — session cookie vs API key/secret token between the React app and Frappe. Pick based on whether the React app will be served from the same domain/subdomain as the Frappe site.
2. **Candidate booking page hosting** — should the public, unauthenticated slot-booking page live inside this same React app (separate unauthenticated route) or as a standalone micro-page? Recommend keeping it in the same app for shared component/styling reuse, just gated by token rather than login.
3. **Google Calendar sync setup** — each interviewer needs to individually connect their Google account under Frappe's Integrations before real-time free/busy checking works. The custom app should detect and surface "interviewer hasn't connected their calendar yet" rather than failing silently.
4. **Real employee rollout sequencing** — the payroll module should be tested against a small number of employees with no real email/personal data before being pointed at the full active employee list, to avoid accidentally triggering real payslip/notification emails during development. Recommend an explicit "test mode" company/employee flag during initial build.

---

## Appendix — Technical Gotchas from the Proof-of-Concept Build

These were real issues hit while building and testing the underlying ERPNext functionality this app sits on top of. Worth knowing before wiring the custom API layer, since they'll resurface if not accounted for.

### Loan / Lending module
- **Moratorium Tenure must default to 0.** Left at a non-zero value (e.g., inherited default of 20), it silently pushes the first real repayment out by that many periods with no error — the loan looks "broken" (no deduction ever appears on payroll) when it's actually just delayed. The Loan Application Wizard (Section 5.2) must default this to 0 and hide it behind an advanced toggle.
- **Loan Accrual Frequency must be set at Company level** (Company → Loan tab) before any Loan Repayment Schedule will actually populate real installment amounts — without it, every row in the schedule shows ₹0.00 with no accrual, and Salary Slip submission fails with "Loan Accrual Frequency not set."
- **Collection Offset Sequence for Standard Asset** (also Company → Loan tab) is a separate required field — Salary Slip submission fails with a distinct error until a `Loan Collection Offset Sequence` record exists and is linked here, even for a simple 0%-interest loan with no real charges/penalties to allocate.
- **`repayment_periods` on the `Loan` doctype and even on `Loan Repayment Schedule` can be stored as `0`/unset** when a loan is created through the quick-entry form rather than a full Loan Application — don't trust this field for "installment X of Y" display logic. Instead, derive the total and current installment number directly from the actual `repayment_schedule` child table rows (count total rows; match the row whose `payment_date` falls in the current period).
- **The `lending` app is a separate Frappe app from core Frappe HR**, and its GitHub branch may target a different core Frappe version than your site (e.g., `develop` branch requiring Frappe v17-dev while the site runs v15) — causes a Frappe Cloud deploy failure citing `pyproject.toml [tool.bench.frappe-dependencies]`. Check version compatibility before installing, or use a tagged release rather than the default branch.
- **"Repay From Salary" checkbox** on the Loan doctype was reportedly dropped in some intermediate v14 builds per historical GitHub issues, though it's present in current versions — if a Loan form is missing it, that's a known version-drift point to check for, not necessarily a UI bug.

### RestrictedPython / System Console constraints
If any custom backend logic runs through Frappe's System Console or Server Scripts (RestrictedPython sandbox) rather than a proper custom app's Python files, these are disallowed and will throw `AttributeError` or similar:
- `frappe.get_installed_apps()` — use `frappe.db.sql("select distinct app_name from \`tabModule Def\`")` instead
- `import` statements, `getattr()`, `.format()`, triple-quoted strings, variables prefixed with `_`
- `frappe.db.commit()`, `frappe.cache()`, `frappe.clear_cache()`
- DELETE/UPDATE raw SQL, `LIMIT` inside `IN` subqueries

*(This constraint list is specific to System Console/Server Scripts — a proper custom Frappe app's own Python files, which this project should use for the whitelisted API endpoints, are not subject to RestrictedPython and don't have these limits.)*

### Jinja print format gotchas (relevant if the custom app renders/links to the branded Salary Slip PDF)
- **Loop variable scoping:** `{% set x = ... %}` inside a `{% for %}` loop does not persist after `{% endfor %}` — this silently fails (renders nothing, no error) rather than crashing. Use Jinja's `namespace()` object to carry a value out of a loop.
- **`frappe.db.get_value()` can return date fields as plain strings**, not Python `date` objects, depending on context — wrap with `frappe.utils.getdate()` before doing `.year`/`.month` arithmetic, or you'll hit `'str object' has no attribute 'year'`.
- **Custom Jinja context variables (e.g., a hand-passed `logo_b64`) are not automatically available** in Print Format Jinja rendering unless explicitly registered via a context hook. Simpler and more reliable: upload the logo as a Frappe File and reference its `/files/...` URL directly in an `<img>` tag rather than trying to inject custom template variables.
- **External font imports (Google Fonts `@import` in `<style>`) often fail silently during server-side PDF generation** (wkhtmltopdf has unreliable internet access at render time) — use system fonts (Arial, Helvetica) for anything that must render consistently in the generated PDF.