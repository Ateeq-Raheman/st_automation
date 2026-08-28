# ST Automation — Session Context (Last Updated: 2026-08-29 04:29 PKT)

## 🔴 Resume From Here

This file is the single source of truth for resuming work on the `st_automation` Frappe app.
When revoked, read this file first before doing anything.

---

## ✅ What Is Fully Working

| Feature | Status | Notes |
|---|---|---|
| Candidate Pipeline (Kanban) | ✅ Working | Fixed syntax error in recruitment.py that was causing empty pipeline |
| Quick Add Candidate | ✅ Working | |
| Schedule Interview Round 1/2/3 | ✅ Working | Auto-creates Job Opening/Designation if needed |
| Interviewer Email with .ics invite | ✅ Working | Sends per-interviewer email with calendar attachment |
| Interviewer Feedback Email Link | ✅ Working | Each interviewer gets a unique token-based feedback URL in their email |
| Feedback Page (frontend) | ✅ Built | `/interview-feedback?token=X&interview=Y` → renders `InterviewFeedback.jsx` |
| `submit_interview_feedback` API | ✅ Built | `allow_guest=True`, validates token, records comment attributed to interviewer |
| `feedback_token` custom field | ✅ Added | Added to Interview doctype via `add_feedback_field.py` |
| Payroll 1-Click Run | ✅ Working | Draft resumption logic in place |
| Loan Disbursement | ✅ Working | |
| Sidebar label "My Interviews" | ✅ Renamed | Now shows "Scheduled Interviews" |
| Round 2/3 dropdown text | ✅ Fixed | Removed hardcoded "Default: Hamza Ali / Abdul Manan" text |
| Flame logo in Sidebar | ✅ Working | |

---

## 🔶 Pending / Incomplete Tasks

### 1. Auto-fill Default Interviewer on Round 2/3 Selection
- **What:** When HR selects Round 2 or Round 3 in the Interview scheduler, the "Assign Interviewers" field should auto-populate with a default employee.
- **Status:** The `useEffect` code is written in `ApplicantDetailModal.jsx` (lines ~32–57) using `window.frappe.call` to fetch an active employee. **NOT TESTED** — needs verification that the UI actually auto-fills.
- **File:** `/Users/ateeq/frappe-bench/apps/st_automation/frontend/src/modules/recruitment/ApplicantDetailModal.jsx`

### 2. Feedback Page — Not Connected to ERPNext Permissions Yet
- **What:** The feedback submission saves a Comment on the Interview doc. The Comment's `comment_by` field is set to the employee ID string, but ERPNext Comments require a `User` (not Employee). Need to map Employee → User.
- **Fix needed:** In `submit_interview_feedback()` in `recruitment.py`, after resolving `interviewer` (employee ID), do:
  ```python
  user_id = frappe.db.get_value("Employee", interviewer, "user_id") or frappe.session.user
  interview.add_comment('Comment', comment_text, comment_by=user_id)
  ```
- **File:** `/Users/ateeq/frappe-bench/apps/st_automation/st_automation/api/recruitment.py` (around line 434)

### 3. Permission Fixes (Mentioned but Not Done)
- **What:** User asked to "fix all permission issues everywhere." This was not fully addressed.
- **Known areas:** 
  - Interviewers need Read access to their own `Interview` records in ERPNext's Role Permission Manager.
  - `My Salary Slips` view should only show the logged-in user's own slips.
  - The feedback endpoint is `allow_guest=True` (token-validated), so no login is needed there.

### 4. Offer Letter Generation
- **What:** When a candidate is marked "Select / Offer", automatically generate and email an offer letter PDF.
- **Status:** NOT STARTED.

### 5. Resume Attachment on Quick Add
- **What:** Support uploading a candidate's CV/Resume file during the "Quick Add" candidate modal.
- **Status:** NOT STARTED.

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `st_automation/api/recruitment.py` | All recruitment APIs (pipeline, schedule, feedback, slot booking) |
| `st_automation/api/payroll.py` | Payroll run, salary slip, loan APIs |
| `st_automation/api/utils.py` | Shared utilities: `generate_secure_token`, `success_response`, `error_response` |
| `st_automation/api/add_feedback_field.py` | One-time script to add `feedback_token` custom field to Interview doctype |
| `frontend/src/App.jsx` | Main React app — routing logic for public pages (feedback, slot booking) |
| `frontend/src/modules/recruitment/ApplicantDetailModal.jsx` | Candidate profile modal with interview scheduling |
| `frontend/src/modules/recruitment/KanbanBoard.jsx` | Drag-and-drop Kanban pipeline view |
| `frontend/src/pages/InterviewFeedback.jsx` | NEW: Public feedback form for interviewers |
| `frontend/src/components/layout/Sidebar.jsx` | Navigation sidebar with Flame logo |

---

## 🔧 How to Build & Deploy Frontend

```bash
cd /Users/ateeq/frappe-bench/apps/st_automation/frontend
yarn build

# Then clear Frappe cache
cd /Users/ateeq/frappe-bench
bench --site standardtouch clear-cache
```

## 🗄️ DB Credentials (standardtouch site)

```
DB Name:     _e7cf2347b89074d9
DB Password: LaAmcjrwgUq3j4Ec
Site Name:   standardtouch
```

MySQL query example:
```bash
mysql -u _e7cf2347b89074d9 -pLaAmcjrwgUq3j4Ec _e7cf2347b89074d9 -e "SELECT name, applicant_name, status FROM \`tabJob Applicant\` LIMIT 20;"
```

## 🐛 Known Bugs / Gotchas

1. **Frappe `Interview.status`:** Only accepts `"Pending"` at creation. Using `"Scheduled"` causes a validation error.
2. **Interview Detail child table:** Takes `User` ID (email), NOT `Employee` ID. Always map `Employee → user_id` before appending.
3. **`window.frappe.call` vs `frappe.call`:** Inside the React app, always use `window.frappe.call` to access the globally injected Frappe client.
4. **Salary Structure:** Employees without an active Salary Structure Assignment will be silently skipped during payroll runs.
5. **Python tab/space mixing:** The `recruitment.py` file previously had mixed indentation. Always use TABS only in this file (Frappe convention).

---

## 📊 Workflow Diagrams

See `ST_Automation_Documentation.md` in the app root for full Mermaid flow diagrams.

---

## 🎨 Design System

- **Primary Red:** `#e63946` (brand-red)
- **Accent:** Emerald (`emerald-500`), Indigo (`indigo-600`), Amber (`amber-500`)
- **Background:** `gray-50`
- **Style:** "Gen-Z HR" — clean, vibrant, modern. No Frappe gray defaults.
- **Logo:** Animated Flame icon (`lucide-react`) in Sidebar.
