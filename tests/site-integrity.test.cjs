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
    assert.match(html, new RegExp('\\\\bid="' + id + '"'));
  }
  assert.match(appJs, /function updatePlanningOverview|const updatePlanningOverview =/);
  assert.match(appJs, /updatePlanningOverview\(\)/);
  assert.match(css, /#planning \.overview-stats/);
  assert.match(css, /#planning \.overview-track span/);
});
