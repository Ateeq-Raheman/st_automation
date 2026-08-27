# Standard Touch HR Operations (st_automation) - Progress & Changes Log

## Current Status
- **Phase**: Installation and Environment Setup
- **Current Step**: Successfully installed `erpnext`, `hrms`, and `st_automation` on the `standardtouch` site! All required backend configurations and custom fields have been migrated correctly.

## Progress and Steps Taken
1. **Backend Infrastructure Built**: Implemented core API modules for Recruitment (`recruitment.py`), Payroll (`payroll.py`), and Diagnostics (`diagnostics.py`).
2. **Hooks & Setup Configured**: Configured `setup.py` and `hooks.py` for automatic custom field provisioning and app routing.
3. **Frontend Application**: Built a modern React + Vite + Tailwind interface. It has been successfully bundled and placed in `st_automation/public/frontend/`.
4. **Fixtures Created**: Configured `custom_field.json` to ensure persistence of custom fields via `bench migrate`.
5. **App Dependencies Fetched**: Ran `bench get-app hrms` to download the Frappe HR app and its JavaScript dependencies to the local bench.

## Issues Encountered & Resolved
1. **Missing `doctype` Error during Installation**: 
   - **Issue**: When trying to install `st_automation` initially, Frappe threw a `builtins.KeyError: 'doctype'` error. This was because the `st_automation/fixtures/custom_field.json` file contained fields but lacked the `"doctype": "Custom Field"` and `"name"` properties required for Frappe to properly import them.
   - **Resolution**: Updated `custom_field.json` to include `"doctype": "Custom Field"` and `"name"` fields for each JSON object in the fixtures.

2. **HRMS App Branch Mismatch**:
   - **Issue**: During the installation of `erpnext`, `hrms`, and `st_automation` on `standardtouch`, Frappe threw an `ImportError` because `hrms` was trying to import `is_half_holiday` from `erpnext`. This happened because `bench get-app hrms` fetched the `develop` branch of HRMS by default, whereas `erpnext` and `frappe` are on `version-15`.
   - **Resolution**: Removed the `develop` branch of `hrms` and re-fetched the correct branch using `bench get-app --branch version-15 hrms`.

3. **Duplicate `HR` Module Def Error**:
   - **Issue**: Because the initial HRMS installation failed halfway through due to the version mismatch, trying to reinstall it resulted in a `DuplicateEntryError` for the `HR` Module Def, which was already partially written to the database.
   - **Resolution**: Ran `bench --site standardtouch install-app --force hrms` to safely overwrite the duplicate module definitions and continue the installation.

## User Feedback & Requirements
- **Goal**: Create a custom HR operations app for recruitment and payroll processing.
- **Design Priority**: Highly responsive, beautiful UI, and extremely simple for non-technical HR users to use (minimize the number of clicks).
- **Automation**: Automatic creation of custom doctypes/fields on app installation (handled via `setup.py` and `custom_field.json`).
- **Target Site**: `standardtouch`.
- **Documentation**: All progress, issues, feedback, and steps must be logged in this `Changes.md` file.
