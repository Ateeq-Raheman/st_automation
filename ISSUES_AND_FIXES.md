# ST Automation — Issues Found & Fix Status

Compiled from a full E2E UI testing pass on 2026-09-17/18, covering both the `develop` branch and Ateeq's own `ateeq` branch (commits `4bab6d1`, `b074439`, `ff7a78e`). Step-by-step test scripts are in `testing_flows.md`. **All issues below have now been fixed and re-verified live in-browser and/or via direct backend round-trip tests** on the `ateeq` branch (uncommitted — ready for review/commit).

Legend: ✅ Fixed and verified · ⚠️ Fixed, minor residual polish item noted

---

## Already fixed by Ateeq's earlier commits (verified working, no changes made)

| Issue | Where | Verified how |
|---|---|---|
| ✅ Assign Salary Structure modal used to crash | `AssignSalaryStructureModal.jsx` + `get_salary_structures` API | Assigned structures to multiple employees across two branches — no crash, correct validation errors, success toasts. |
| ✅ Zero-net-payout payroll submissions previously allowed silently | `payroll.py` / `RunPayrollWizard.jsx` | Ran payroll with no eligible employees — clear amber "Submission is blocked" banner instead of a silent/incorrect submit. |

---

## Fixed in this pass

### 🔴 Critical

**1. ✅ Loan sanctioning crashed the entire app — `FileText is not defined`**
- File: `frontend/src/modules/payroll/LoanApplicationWizard.jsx`
- **Fix:** added `FileText` to the `lucide-react` import list.
- **Found a second, identical bug while verifying the first fix:** Step 4 ("Loan Sanctioned Successfully!") also crashed with `ReferenceError: CheckCircle is not defined` — same root cause, different icon (`CheckCircle` used but only `CheckCircle2` was imported). Fixed by adding `CheckCircle` to the same import.
- **Verified:** ran the full 4-step wizard twice live in-browser, end to end — Step 3 and Step 4 both render correctly now, loan created, disbursed, no crash.

**2. ✅ Loan Detail Modal failed to load for every loan — "Error: Could not load loan details."**
- Root cause found via live network inspection: `frontend/src/api/client.js`'s `callApi` used a too-loose heuristic (`'status' in data.message`) to detect this app's own `{status, message, data}` response envelope — but the raw `Loan` doctype *also* has its own unrelated `status` field (e.g. "Disbursed"), so a plain `frappe.client.get` response was misdetected as the envelope, and `LoanDetailModal.jsx`'s `setLoan(res.message)` silently got `undefined`.
- **Fix:** tightened the `callApi` check to require both `status` *and* `data` keys (this app's real envelope always has both; a raw doctype record won't have a `data` field). Updated `LoanDetailModal.jsx` to read `res.data` accordingly, plus a small fallback (`loan.applicant_name || loan.applicant`) for loans where the name field itself is unpopulated.
- **Verified:** clicked into multiple loans live — full detail (status, amounts, applicant, timeline) now renders correctly.

**3. ✅ Interview Feedback public link was completely non-functional — now works end-to-end**
- Three compounding bugs, all fixed:
  - Emailed link pointed to `/interview-feedback` (unregistered route, 404). **Fix:** point it at `/hr-ops?token=...&interview=...` instead — the same pattern already used successfully by the onboarding/exit public links.
  - `submit_interview_feedback` was a plain `@frappe.whitelist()` with no way for a true guest to call it. **Fix:** added `allow_guest=True` **plus real token validation** — the token is checked against the per-interviewer token map stored on the Interview doc (not just "any guest can call this"), and is consumed (deleted from the map) on first successful use so the link genuinely becomes single-use as the page tells the interviewer.
  - Frontend posted mismatched field names via raw `FormData`/`fetch` with no CSRF handling. **Fix:** rewrote `InterviewFeedback.jsx` to use the shared `callApi` client (correct field names, proper CSRF token attachment for interviewers who happen to also be logged in).
- **Two more bugs surfaced only by testing the live, fixed flow**, both fixed:
  - The token-consumption update was being silently overwritten by a later `interview.save()` of the same in-memory (stale) document. **Fix:** set `interview.feedback_token` on the in-memory object instead of a separate direct DB write, so both changes persist together.
  - `Job Applicant.interview_rating_summary` is capped at 140 characters — any moderately detailed feedback comment blew past that and threw a validation error, confusingly surfaced to the interviewer as "Invalid Link". **Fix:** truncate the stored summary to fit; the full, untruncated text still goes into the applicant's comment log, which has no such limit.
- **Verified, live, end-to-end, as a true `Guest` session (not just the frontend UI):** scheduled a fresh interview round → generated token → submitted feedback as Guest → succeeded → immediately retried with the same token → correctly rejected as "already been used" → fresh token → full live browser submission through the actual public page → "Feedback Submitted!" success screen.

**4. ✅ Payroll run silently did real work while reporting "0 slips, blocked" — and duplicated draft Payroll Entries instead of resuming them**
- Root cause: the "resume existing draft" check picked an *arbitrary* one of potentially many draft Payroll Entries for a period and only counted slips linked to *that specific* entry, ignoring real slips linked to *other* draft entries accumulated from earlier runs.
- **Fix:** rewrote the resume logic in `run_payroll_and_report` to aggregate **all** non-cancelled Salary Slips for the period/company directly, regardless of which Payroll Entry (if any) they're linked to — removing the "which one is the real one" ambiguity entirely.
- **A second bug found while verifying the fix:** even with correct data, clicking "Submit Official Payroll" showed "Submitted Officially" and flipped every row to "Submitted" — but the *parent* Payroll Entry itself silently stayed in Draft forever. Root cause: `payroll_entry.submit()` calls ERPNext's own `validate_existing_salary_slips()`, which throws "Salary Slip already exists" for the entry's *own* just-submitted slips — a fundamental conflict between this app's "create drafts first, submit slips individually" flow and ERPNext's assumption that a Payroll Entry creates its own slips on submit. **Fix:** since this app already fully owns slip creation/submission by that point, mark the Payroll Entry's own `docstatus`/`status` directly instead of replaying the incompatible standard submit flow.
- Cleaned up 20 stale draft Payroll Entries / 14 draft Salary Slips / 5 orphaned-submitted slips left over from testing (per your instruction) to get a clean baseline, then re-verified from scratch.
- **Verified, live, end-to-end twice** (once via the actual "Run Monthly Payroll" UI for September 2026 — 6 real employees, ₹2,11,000 gross, correctly resumed identically on a second click, then correctly and fully submitted with the Payroll Entry itself flipping to Submitted; once via a from-scratch October 2026 run through the fixed code path directly, confirming 8 slips + the parent entry all end up consistently `docstatus=1`).

### 🟠 Medium

**5. ✅ Loans & Advances table — "Employee Name" column always showed "-"**
- Root cause: the `Loan` doctype's own `applicant_name` field is a denormalized cache that isn't always populated (confirmed `null` on existing records).
- **Fix:** `get_active_loans` now resolves any missing name live from `Employee` instead of trusting the stale cached field.
- **Verified:** table now shows real names (Imran, Ateeq-Ur-Raheman, Abdul Mannan, Furqan Khan, etc.) for both old and newly-created loans.

**6. ✅ Job Opening visibility toggle — label stuck on "Hidden" regardless of actual state**
- Root cause: the pill's background color read `job.publish` (correct, and already wired to the toggle handler); its label text read a *different*, always-falsy field, `job.publish_on_website`.
- **Fix:** label now reads `job.publish`, matching the color and the toggle logic.
- **Verified:** toggled "UI Test Role" live — label and color now flip together correctly both ways.

**7. ✅ Scheduled interview times were consistently wrong (timezone-shaped bug)**
- Root cause: `scheduled_on` on the core HRMS `Interview` doctype is a **Date-only** field — every write path assigned a full datetime string to it, silently discarding the time entirely; every read path then displayed the resulting date-only value as if it were a UTC-midnight timestamp, which a browser in IST renders as a fixed, wrong time (explains why *every* interview, regardless of the time actually picked, always showed the same offset time).
- **Fix:** added `split_datetime`/`combine_date_time` helpers; both write paths (`book_slot`, `schedule_interview_round`) now also populate the doctype's separate `from_time`/`to_time` Time fields, and all three read paths (`get_my_interviews`, `get_applicant_interviews`, plus the dashboard's `get_recruitment_overview`) now return a combined date+time ISO string instead of the bare date.
- **Verified via direct backend round-trip** (bypassing the finicky native `datetime-local` picker for precision): scheduled an interview for `2026-12-25T14:00` → both `get_applicant_interviews` and `get_my_interviews` return exactly `2026-12-25T14:00:00`, no drift.

---

## Still open (not fixed this pass — low priority / out of scope)

- Interviewer Feedback Summary panel: dark green heading text on medium-gray background, borderline low contrast (cosmetic).
- Separation Template's title field placeholder still reads "e.g. Standard Software Engineer **Onboarding**" (copy-paste leftover, cosmetic).
- Onboarding/Exit pipeline header text says "N active" even while viewing the Completed tab (cosmetic).
- The public feedback page's error screen is always titled "Invalid Link" even for non-link errors (e.g. the now-fixed 140-char validation error) — the *body text* does show the real error message, so this is a heading-accuracy nit, not a functional issue.
- Doc inaccuracies already corrected in `testing_flows.md`: real entry point is `http://localhost:8000/hr-ops`, not `127.0.0.1:8000/frontend`; `Administrator`/`admin123` is not a valid login on this instance.

## Branch-scope note

The `ateeq` branch (diverged from `develop` before Ameer's onboarding/exit/template work was merged) does not contain the Onboarding Pipeline, Exit Pipeline, or Template Management features at all — expected, not a bug, and untouched by this fix pass. Every fix above was made in files confirmed byte-identical between `develop` and `ateeq` before this pass began (except the payroll/feedback logic, which is `ateeq`-specific), so these fixes apply equally to both branches once merged.
