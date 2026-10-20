# Pregnancy Dating Calculator

A responsive, browser-only pregnancy dating calculator with a rose-pink and lavender interface. It can be published as a static site with GitHub Pages and supports installation as a Progressive Web App (PWA) in compatible browsers.

## Features

- **Three dating methods:** ultrasound date + gestational age, LMP + reference date, or reference date + gestational age.
- **Estimated results:** LMP, estimated due date (EDD), gestational age, trimester, days until/past EDD, and a 40-week progress indicator.
- **Responsive UI:** phone, tablet, laptop, and desktop layouts.
- **PWA support:** install prompt where supported, home-screen instructions for iOS, and offline asset caching.
- **Privacy-minded:** calculations run locally in the browser; this project has no backend or database.
- **Accessibility:** labeled inputs, keyboard-operable calculator tabs, visible focus styles, status/error announcements, reduced-motion support, and print layout.
- **Dark mode:** user preference is saved locally when browser storage is available.
- **No build step or third-party runtime dependencies.**

## Use locally

Open `index.html` in a browser for basic calculator use. For PWA installation and service-worker testing, serve the project over HTTPS or from localhost. For example, with Node.js installed:

```sh
npx serve .
```

## Run tests

Requires Node.js 22 or later:

```sh
node --test
```

GitHub Actions runs the same checks on pushes to `main`, pull requests targeting `main`, and manual workflow dispatch.

## Publish with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Select **Deploy from a branch**.
3. Choose `main` and the `/(root)` folder, then save.
4. Wait for the Pages deployment to finish.

The site is expected at: https://shreebalaji767.github.io/pregnancy-dating-calculator/

## Clinical disclaimer

This tool provides calendar-based estimates only. It is not a diagnostic tool and does not replace clinical assessment or local obstetric guidance. Confirm pregnancy dating with a qualified clinician. Do not enter identifiable patient details on a shared device.

## Project structure

- `index.html` — app interface and metadata
- `assets/css/style.css` — responsive styles
- `assets/js/date-utils.js` — UTC-safe calendar date helpers
- `assets/js/calculator.js` — date calculation logic
- `assets/js/app.js` — UI, theme, copy/print, and PWA installation behavior
- `manifest.webmanifest` — PWA metadata
- `service-worker.js` — offline caching
- `assets/icons/` — logo and favicon
- `tests/` — built-in Node.js regression tests
- `.github/workflows/test.yml` — automated checks
