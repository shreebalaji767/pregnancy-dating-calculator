# Pregnancy Care Toolkit

A responsive, browser-only obstetric utility site for pregnancy dating, IVF transfer dating, milestone planning, pregnancy education, antenatal visit planning and additional date/BMI calculations. It is designed for static hosting such as GitHub Pages and has no backend or patient database.

## Features

- **Four dating methods:** ultrasound date + gestational age, LMP + reference date, reference date + gestational age, and IVF embryo transfer date + embryo age (day 3 or day 5).
- **Dating summary:** estimated LMP, estimated due date (EDD), gestational age on the reference date, trimester and a 40-week progress indicator.
- **Milestone calendar:** estimates dates for selected gestational-week markers and downloads a local .ics calendar file.
- **Week-by-week guide:** general educational information in English and Hindi. It is not a fetal-growth assessment or individualized medical advice.
- **Antenatal visit planner:** example planning windows only. It explicitly asks clinicians to adapt the plan to current local guidelines and the individual's needs.
- **Additional calculators:** adult BMI screening calculation, date interval and gestational age on a selected date.
- **Print / Save PDF:** uses the browser's print dialog; select Save as PDF where supported.
- **Privacy-minded:** all calculations and calendar generation run in the browser. No patient database, accounts, or server-side storage are implemented.
- **PWA support:** install prompt where supported, iOS installation instructions, offline caching and dark mode.
- **Accessibility:** skip link, labeled controls, keyboard-operated tabs, focus visibility, status/error announcements and reduced-motion support.
- **Planning tools:** hospital-bag checklist, pregnancy preparation checklist, birth-preferences draft, appointment tracker, and local text exports.
- **Session-only tracking tools:** contraction stopwatch with duration/interval log and text export, plus a movement-session counter with export. These do not store or upload session data. They are not diagnostic tools; follow maternity-team advice and seek prompt clinical guidance for reduced or changed fetal movements. Checklist state and saved notes remain in browser local storage on the device; they are not uploaded. Local storage is not encrypted, so avoid patient identifiers and shared-device use.
- **No alerts or reminders sent by a server:** the appointment tracker is a simple saved list only. It does not send notifications or contact a calendar service.
- **No build step or third-party runtime dependencies.**
- **No paid services or external integrations:** no paid/free APIs, AI services, analytics, ads, tracking, remote fonts, CDNs, external JavaScript libraries, accounts, or backend calls. The website contains no outbound clinical-reference links; source names are shown as plain text. Core calculations run locally in the browser; the service worker caches only this repository's own files. Clinical-reference URLs below are documentation links only and are not loaded by the app.
- **No usage fees from app features:** printing/PDF uses the browser's built-in print dialog, and calendar export is generated locally. GitHub Pages is the static hosting provider; hosting is separate from runtime APIs and any GitHub account/hosting terms still apply.

## Clinical calculation notes

- **LMP dating:** gestational age is elapsed calendar days from the first day of LMP; the calendar EDD is LMP + 280 days.
- **IVF dating:** follows ACOG's embryo-age and transfer-date method: EDD is 261 days after a day-5 transfer and 263 days after a day-3 transfer. Confirm the date with the treating fertility team.
- **BMI:** weight in kilograms divided by height in metres squared. Adult BMI categories are screening categories, not a diagnosis. They must not be used alone to interpret weight during pregnancy; pre-pregnancy BMI and individual clinical context matter.
- **Milestones and antenatal planner:** these are approximate planning markers, not a clinical protocol. Screening and visit schedules vary by country, facility and individual risk.

## Clinical references

- ACOG, Methods for Estimating the Due Date: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date
- CDC, About BMI: https://www.cdc.gov/bmi/about/
- NHS, Your antenatal care and appointments: https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-care-and-appointments/

## Use locally

Open index.html for basic calculator use. For PWA installation and service-worker testing, serve the project over HTTPS or from localhost, for example:

    npx serve .

## Run automated tests

Requires Node.js 22 or later:

    node --test

GitHub Actions runs the same checks on pushes to main, pull requests targeting main, and manual workflow dispatch. A commit being pushed does not itself mean that the workflow passed; check the Actions tab for the latest run.

## Publish with GitHub Pages

1. Open Settings → Pages in the repository.
2. Select Deploy from a branch.
3. Choose main and the root folder, then save.
4. Wait for the Pages deployment to finish.

Site URL: https://shreebalaji767.github.io/pregnancy-dating-calculator/

## Privacy and medical disclaimer

The website does not send entered dates to a database. Avoid entering identifiable patient details on a shared or public device. Browser history, device access, extensions and downloaded files are outside the site's control.

This tool provides estimates and general educational information only. It does not provide diagnosis or treatment advice and does not replace clinician assessment. Use the established obstetric EDD when available. Confirm dating, screening and antenatal plans with a qualified clinician using current local guidance. Do not alter a documented EDD without clinical review.

## Project structure

- index.html — interface, educational content and metadata
- assets/css/style.css — hospital-style responsive theme and print layout
- assets/js/date-utils.js — UTC-safe calendar date helpers
- assets/js/calculator.js — pure calculation functions
- assets/js/app.js — UI, English/Hindi toggle, milestone calendar, print/copy, BMI and PWA behavior
- manifest.webmanifest — PWA metadata
- service-worker.js — offline caching
- assets/icons/ — logo and favicon
- tests/calculator.test.cjs — built-in Node.js regression tests
- .github/workflows/test.yml — automated checks
