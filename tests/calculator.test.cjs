'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const load = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {}, Intl, Date };
vm.runInNewContext(load('assets/js/date-utils.js'), context);
vm.runInNewContext(load('assets/js/calculator.js'), context);
const Dates = context.window.PregnancyDates;
const Calculator = context.window.PregnancyCalculator;

test('date parsing rejects impossible calendar dates', () => {
  assert.equal(Dates.parseISO('2024-02-29')?.toISOString(), '2024-02-29T00:00:00.000Z');
  assert.equal(Dates.parseISO('2025-02-29'), null);
  assert.equal(Dates.parseISO('2025-13-01'), null);
  assert.equal(Dates.parseISO('not-a-date'), null);
});

test('calendar helpers add and diff days without timezone drift', () => {
  const start = Dates.parseISO('2024-02-28');
  assert.equal(Dates.toISO(Dates.addDays(start, 1)), '2024-02-29');
  assert.equal(Dates.diffDays(Dates.parseISO('2024-03-01'), start), 2);
});

test('ultrasound dating calculates LMP and EDD from weeks plus days', () => {
  const result = Calculator.fromUltrasound('2026-10-20', 12, 3);
  assert.equal(Dates.toISO(result.lmp), '2026-07-25');
  assert.equal(Dates.toISO(result.edd), '2027-05-01');
  assert.equal(result.totalDays, 87);
});

test('LMP dating calculates gestational age on the reference date', () => {
  const result = Calculator.fromLMP('2026-01-01', '2026-01-15');
  assert.equal(result.totalDays, 14);
  assert.equal(Dates.formatGA(result.totalDays), '2 weeks 0 days');
  assert.equal(Dates.toISO(result.edd), '2026-10-08');
});

test('reference-date dating calculates the estimated LMP', () => {
  const result = Calculator.fromGestationalAge('2026-10-20', 37, 6);
  assert.equal(Dates.toISO(result.lmp), '2026-01-28');
  assert.equal(Dates.toISO(result.edd), '2026-11-04');
  assert.equal(result.totalDays, 265);
});

test('IVF dating uses embryo age and transfer date per ACOG formula', () => {
  const day5 = Calculator.fromIVF('2026-10-20', 5, '2026-10-20');
  assert.equal(Dates.toISO(day5.edd), '2027-07-08');
  assert.equal(Dates.toISO(day5.lmp), '2026-10-01');
  assert.equal(day5.totalDays, 19);
  const day3 = Calculator.fromIVF('2026-10-20', 3, '2026-10-20');
  assert.equal(Dates.toISO(day3.edd), '2027-07-10');
  assert.equal(Dates.toISO(day3.lmp), '2026-10-03');
  assert.equal(day3.totalDays, 17);
});

test('IVF dating calculates gestational age on a later reference date and rejects impossible inputs', () => {
  const result = Calculator.fromIVF('2026-10-20', 5, '2026-10-27');
  assert.equal(result.totalDays, 26);
  assert.equal(Dates.formatGA(result.totalDays), '3 weeks 5 days');
  assert.throws(() => Calculator.fromIVF('2026-10-20', 4, '2026-10-20'), /day-3 or day-5/);
  assert.throws(() => Calculator.fromIVF('2026-10-20', 5, '2026-10-19'), /cannot be before/);
});

test('BMI calculator uses kg divided by metres squared and adult screening bands', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(Calculator.calculateBMI(64, 160))), { bmi: 25, category: 'Overweight' });
  assert.equal(Calculator.calculateBMI(50, 160).category, 'Healthy weight');
  assert.throws(() => Calculator.calculateBMI(0, 160), /plausible weight/);
  assert.throws(() => Calculator.calculateBMI(60, 0), /plausible weight/);
});

test('date interval and milestone helpers return UTC-safe calendar dates', () => {
  assert.equal(Calculator.dateInterval('2024-02-28', '2024-03-01'), 2);
  assert.throws(() => Calculator.dateInterval('2026-01-02', '2026-01-01'), /end date/);
  assert.equal(Dates.toISO(Calculator.milestoneDate('2026-01-01', 20, 0)), '2026-05-21');
  assert.throws(() => Calculator.milestoneDate('2026-01-01', 46, 0), /valid LMP/);
});

test('calculator rejects invalid dates, reversed dates, and invalid gestational ages', () => {
  assert.throws(() => Calculator.fromUltrasound('2026-02-30', 10, 0), /valid scan date/);
  assert.throws(() => Calculator.fromUltrasound('2026-01-01', 10, 7), /valid scan date/);
  assert.throws(() => Calculator.fromLMP('2026-01-15', '2026-01-01'), /cannot be before/);
  assert.throws(() => Calculator.fromLMP('2025-01-01', '2026-01-01'), /exceeds 45 weeks/);
  assert.throws(() => Calculator.fromGestationalAge('', 10, 0), /valid reference date/);
});

test('site exposes new tools, Hindi content, accessibility labels and PDF printing', () => {
  const html = load('index.html');
  assert.match(html, /id="install-app" type="button">/);
  assert.doesNotMatch(html, /type="button>/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="mobile-web-app-capable" content="yes"/);
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /data-hi="गर्भावस्था देखभाल टूलकिट"/);
  for (const id of ['panel-ivf', 'milestones', 'guide', 'planner', 'calc-bmi', 'calc-interval', 'print', 'download-calendar', 'privacy']) assert.match(html, new RegExp('id="' + id + '"'));
  const app = load('assets/js/app.js');
  assert.match(app, /fromIVF/);
  assert.match(app, /pregnancy-dating-language/);
  assert.match(app, /text\/calendar/);
  assert.match(app, /installButton && installStatus/);
});

test('event binding is null-safe and the offline cache is versioned for the fix', () => {
  const app = load('assets/js/app.js');
  const html = load('index.html');
  const serviceWorker = load('service-worker.js');
  assert.match(app, /const on = \(id, eventName, handler, options\) => \{/);
  assert.match(app, /if \(element\) element\.addEventListener\(eventName, handler, options\)/);
  assert.doesNotMatch(app, /\$\('[^']+'\)\.addEventListener\(/);
  assert.match(html, /name="mobile-web-app-capable" content="yes"/);
  assert.match(serviceWorker, /CACHE_NAME = CACHE_PREFIX \+ 'v24'/);
});

test('manifest and offline assets are wired correctly', () => {
  const manifest = JSON.parse(load('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.length > 0);
  for (const asset of [
    'assets/css/style.css', 'assets/js/date-utils.js', 'assets/js/calculator.js',
    'assets/js/app.js', 'assets/icons/logo.svg', 'assets/icons/favicon.svg',
    'manifest.webmanifest', 'service-worker.js'
  ]) assert.ok(fs.existsSync(path.join(root, asset)), 'Missing asset: ' + asset);
});

test('free planning tools are local-only and have export controls', () => {
  const html = load('index.html');
  const app = load('assets/js/app.js');
  assert.match(html, /id="planning"/);
  assert.match(html, /id="bag-checklist"/);
  assert.match(html, /id="prep-checklist"/);
  assert.match(html, /id="save-birth"/);
  assert.match(html, /id="download-birth"/);
  assert.match(html, /id="add-appt"/);
  assert.match(html, /id="export-planning"/);
  assert.match(html, /id="clear-planning-data"/);
  assert.match(html, /id="contraction-toggle"/);
  assert.match(html, /id="clear-contractions"/);
  assert.match(html, /id="movement-add"/);
  assert.match(html, /id="movement-reset"/);
  assert.match(app, /const elapsedLabel =/);
  assert.match(app, /contractionRows/);
  assert.match(app, /movementCount/);
  assert.match(html, /contact your maternity unit immediately/i);
  assert.match(app, /pregnancy-toolkit-planning-v1/);
  assert.match(app, /function downloadText\(/);
  assert.match(app, /function initializePlanningTools\(/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:\/\/[^"']+["'][^>]+rel=["']stylesheet["']/i);
});


test('obstetric clinical utility tools are wired, local-only and syntax-safe', () => {
  const html = load('index.html');
  const clinical = load('assets/js/clinical-tools.js');
  const sw = load('service-worker.js');
  for (const id of [
    'clinical-tools', 'map-sbp', 'map-dbp', 'calc-map', 'map-result',
    'apgar-time', 'apgar-appearance', 'apgar-pulse', 'apgar-grimace',
    'apgar-activity', 'apgar-respiration', 'calc-apgar', 'apgar-result',
    'bishop-dilation', 'bishop-effacement', 'bishop-station',
    'bishop-consistency', 'bishop-position', 'calc-bishop', 'bishop-result',
    'gtpal-g', 'gtpal-t', 'gtpal-p', 'gtpal-a', 'gtpal-l', 'calc-gtpal', 'gtpal-result'
  ]) assert.match(html, new RegExp('id="' + id + '"'), 'Missing clinical tool element: ' + id);
  assert.match(html, /assets\/js\/clinical-tools\.js/);
  assert.match(sw, /'\.\/assets\/js\/clinical-tools\.js'/);
  assert.match(clinical, /\(sbp \+ 2 \* dbp\) \/ 3/);
  assert.match(clinical, /Bishop score:/);
  assert.match(clinical, /APGAR at /);
  assert.match(clinical, /G' \+ g \+ ' T'/);
  assert.doesNotMatch(clinical, /fetch\s*\(|XMLHttpRequest|https?:\/\//i);
  assert.match(html, /no patient data is uploaded/i);
});
