# Standard Touch HR Operations (st_automation)

A click-minimized, responsive, modern HR operations web app built on top of ERPNext / Frappe. It covers two core functional domains — **Recruitment** and **Payroll/Loans** — unified under a single simplified interface for non-technical HR users.

---

## Key Features

### Module A — Recruitment & Hiring
- **Kanban Candidate Pipeline**: Visual stages (*Applied → Shortlisted → Awaiting Slot Booking → Interview Scheduled → Interview Completed → Selected / On Bench / Rejected*) with drag & drop and 1-click stage advancement.
- **Inline Resume / CV Viewer**: Review candidate CVs directly inside the app in a side-by-side slide-over without downloading files.
- **Automated Candidate Slot Booking**: Generates unique, secure, token-based links allowing candidates to pick their interview slot in 1 click from their mobile or browser.
- **Interviewer Scorecards**: Clean 1-click rating interface (1-5 stars, technical & communication ratings, structured notes, hiring recommendation).
- **1-Click Decision Engine**:
  - `Select`: Auto-creates draft Job Offer and updates pipeline.
  - `Talent Pool / Bench`: Tags candidate for future hiring needs.
  - `Reject`: Standardized polite rejection notification with 1 click.
- **Quick Add Candidate**: 1-click fast intake form.

### Module B — Payroll & Loans
- **Payroll Command Center**: Live metrics for readiness score (%), active loans, pending incentives, missing salary structure alerts, and processed payout totals.
- **1-Click Run Payroll Wizard**: Step-by-step runner that creates and submits monthly salary slips, applies bonus entries, and deducts active loan installments with a comprehensive payout report.
- **Quick Bonus / Incentive**: 2-click bonus creation without navigating raw Frappe forms.
- **Bulk Spreadsheet Bonus Entry**: Multi-row grid for adding month-end bonuses across multiple employees in seconds.
- **3-Step Guided Loan Wizard**:
  - Step 1: Pick Employee, Amount, and Tenure.
  - Step 2: Auto-calculated monthly EMI and repayment schedule with **guaranteed 0-moratorium setup**.
  - Step 3: 1-Click Approve & Disburse.
- **Salary Slips Hub**: Branded salary slip viewer with inline PDF preview and download.

### System Readiness & Self-Healing Diagnostics
- Pre-flight checker for ERPNext prerequisites:
  - Custom fields status
  - Company Loan Accrual Frequency configuration
  - Outgoing email account status
  - Salary structure assignment coverage
  - Standard Loan Products availability
- Includes **1-Click Auto-Fix** actions for common setup gotchas.

---

## Installation & Setup

### 1. Install app to your Frappe site
```bash
bench --site <your-site-name> install-app st_automation
bench --site <your-site-name> migrate
```

*All custom fields on `Job Applicant`, `Job Opening`, and default company settings are automatically installed via `after_install` and `after_migrate` hooks!*

### 2. Accessing the App
- In Frappe Desk: Click the App Switcher icon (top-left) and select **HR Operations**.
- Or navigate directly to: `https://<your-site>/hr-ops`
- Candidate booking link format: `https://<your-site>/hr-ops#/book-slot?token=<token>`

### 3. Frontend Development (Optional)
```bash
cd apps/st_automation/frontend
npm install
npm run dev   # Starts Vite dev server with proxy to Frappe at http://localhost:5173
npm run build # Builds production bundle directly to ../st_automation/public/frontend/
```

---

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Vite
- **Backend API**: Frappe / ERPNext Python whitelisted endpoints (`st_automation.api.recruitment`, `st_automation.api.payroll`, `st_automation.api.diagnostics`)
- **Security & Permissions**: Respects standard Frappe user session authentication, CSRF tokens, and role-based permissions.
