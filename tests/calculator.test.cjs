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
  assert.equal(Dates.toISO(result.lmp), '2026-01-30');
  assert.equal(Dates.toISO(result.edd), '2026-11-06');
  assert.equal(result.totalDays, 265);
});

test('calculator rejects invalid dates, reversed dates, and invalid gestational ages', () => {
  assert.throws(() => Calculator.fromUltrasound('2026-02-30', 10, 0), /valid scan date/);
  assert.throws(() => Calculator.fromUltrasound('2026-01-01', 10, 7), /valid scan date/);
  assert.throws(() => Calculator.fromLMP('2026-01-15', '2026-01-01'), /cannot be before/);
  assert.throws(() => Calculator.fromLMP('2025-01-01', '2026-01-01'), /exceeds 45 weeks/);
  assert.throws(() => Calculator.fromGestationalAge('', 10, 0), /valid reference date/);
});

test('site markup, manifest, and offline assets are wired correctly', () => {
  const html = load('index.html');
  assert.match(html, /id="install-app" type="button">/);
  assert.doesNotMatch(html, /type="button>/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /assets\/icons\/favicon\.svg/);
  const manifest = JSON.parse(load('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.length > 0);
  for (const asset of [
    'assets/css/style.css',
    'assets/js/date-utils.js',
    'assets/js/calculator.js',
    'assets/js/app.js',
    'assets/icons/logo.svg',
    'assets/icons/favicon.svg',
    'manifest.webmanifest',
    'service-worker.js'
  ]) assert.ok(fs.existsSync(path.join(root, asset)), 'Missing asset: ' + asset);
});
