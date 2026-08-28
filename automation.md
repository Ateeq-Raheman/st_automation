# St Automation - Future Automation Plans & Workflow Guidelines

## Next Stage After Shortlisting (Implemented)
The user previously asked: "What is the next stage after shortlisting the flow is not complete".
**Resolution:** Shortlisted candidates (now listed under the 'Replied' or 'Interview Scheduled' stages depending on action) can be progressed via the **Applicant Detail Modal**.
- When clicking on an applicant, HR now sees a robust "Schedule Interview Round" section.
- HR can select Round 1, Round 2, or Round 3 and assign multi-select interviewers.
- Email invites with `.ics` files are dispatched instantly.

## Automation Goals & Future Work
1. **Google Calendar Real Integration:** 
   Currently, we are sending `.ics` files via email which provides an excellent native experience. However, the next true automation step is setting up the standard Frappe Google Calendar integration on the site.
   - Once configured, we will switch from sending raw emails to creating `Event` DocTypes in Frappe linked to the Google Calendar so that two-way sync is enabled.
2. **Post-Offer Automation:** 
   If HR clicks "Select / Offer", the system drafts a Job Offer. Next steps would include auto-sending the offer letter via DocuSign/SignDesk or standard Frappe Web Form for candidate e-signatures.
3. **Payroll Auto-Submission:**
   If a company decides they don't want Draft previews, we can add a setting in the HR config to skip the Draft review and automatically Submit Payroll Entries at the end of the month via a scheduled background job.