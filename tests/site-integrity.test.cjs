'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('assets/css/style.css');
const appJs = read('assets/js/app.js');

test('all local scripts, stylesheets, icons and manifest referenced by the page exist', () => {
  const refs = [
    ...Array.from(html.matchAll(/\b(?:src|href)="([^"]+)"/g), match => match[1])
  ].filter(ref => !/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref));

  for (const ref of refs) {
    const localPath = decodeURIComponent(ref.split(/[?#]/, 1)[0]);
    assert.ok(fs.existsSync(path.join(root, localPath)), 'Missing local page asset: ' + ref);
  }
});

test('every in-page navigation and label target exists', () => {
  const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]));
  const fragments = Array.from(html.matchAll(/\bhref="#([^"]+)"/g), match => match[1]);
  for (const fragment of fragments) {
    assert.ok(ids.has(fragment), 'Missing in-page target: #' + fragment);
  }
  for (const match of html.matchAll(/\bfor="([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), 'Label points to missing control: ' + match[1]);
  }
});

test('HTML element IDs are unique', () => {
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], [], 'Duplicate IDs: ' + [...new Set(duplicates)].join(', '));
});

test('responsive styles include narrow mobile, tablet and desktop layouts', () => {
  assert.match(css, /@media\s*\(max-width:\s*380px\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(min-width:\s*1000px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('planning overview exposes progress elements and live update hooks', () => {
  for (const id of ['bag-progress-label', 'bag-progress', 'bag-progress-bar', 'prep-progress-label', 'prep-progress', 'prep-progress-bar', 'appointment-count']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing planning overview element: ' + id);
  }
  assert.match(appJs, /function updatePlanningOverview|const updatePlanningOverview =/);
  assert.match(appJs, /updatePlanningOverview\(\)/);
  assert.match(css, /#planning \.overview-stats/);
  assert.match(css, /#planning \.overview-track span/);
});

test('page metadata supports sharing and describes the browser-only privacy model', () => {
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta property="og:description"/);
  assert.match(html, /Browser-based|browser-based/i);
  assert.match(html, /Version 2\.4/);
});

test('section navigation has an accessible active-state implementation', () => {
  assert.match(html, /class="section-nav"/);
  assert.match(appJs, /IntersectionObserver/);
  assert.match(appJs, /aria-current', 'location'/);
});

test('service worker cache version is bumped and all core scripts are precached', () => {
  const worker = read('service-worker.js');
  assert.match(worker, /CACHE_NAME = CACHE_PREFIX \+ 'v21'/);
  for (const asset of ['./assets/css/style.css', './assets/js/date-utils.js', './assets/js/calculator.js', './assets/js/app.js', './assets/js/clinical-tools.js', './assets/js/expanded-toolkit.js']) {
    assert.ok(worker.includes(asset), 'Missing core precache asset: ' + asset);
  }
});

test('expanded toolkit exposes real calculator, tracker, checklist, guide, timer and counter behavior', () => {
  const toolkit = read('assets/js/expanded-toolkit.js');
  for (const feature of ['function calculator(', 'function checklistItems(', 'function trackerPlaceholder(', 'function guideIntro(', 'function guideActions(', 'Start timer', 'Pause timer', 'Add one', 'function save()']) {
    assert.ok(toolkit.includes(feature), 'Missing functional toolkit behavior: ' + feature);
  }
  assert.match(toolkit, /localStorage\.setItem\(KEY/);
  assert.match(toolkit, /function download\(/);
  assert.match(toolkit, /contraction frequency/);
});
test('installed app manifest uses the current toolkit name and local entry point', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'Pregnancy Care Toolkit');
  assert.equal(manifest.short_name, 'Pregnancy Care');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(manifest.description.includes('browser-based'));
});
