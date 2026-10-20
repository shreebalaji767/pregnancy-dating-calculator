(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const modes = ['usg', 'lmp', 'ga'];
  const today = new Date();
  try {
    if (localStorage.getItem('pregnancy-dating-theme') === 'dark') document.body.classList.add('dark');
  } catch (_) { /* Storage can be unavailable in private browsing. */ }
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('usg-date').value = todayISO;
  $('ga-date').value = todayISO;
  $('ref-date').value = todayISO;

  function trimesterFor(days) {
    if (days < 98) return ['First trimester', 'Up to 13 weeks 6 days'];
    if (days < 196) return ['Second trimester', '14 weeks to 27 weeks 6 days'];
    return ['Third trimester', '28 weeks onward'];
  }
  function showError(mode, message) {
    $('err-' + mode).textContent = message;
    $('results').classList.remove('visible');
  }
  function clearError(mode) { $('err-' + mode).textContent = ''; }
  function getGA(weeksId, daysId) {
    const raw = $(weeksId).value.trim(), weeks = Number(raw), days = Number($(daysId).value);
    if (raw === '' || !Number.isInteger(weeks) || weeks < 0 || weeks > 45 || !Number.isInteger(days) || days < 0 || days > 6) return null;
    return { weeks, days };
  }
  function render(result) {
    const D = window.PregnancyDates, gaDays = result.totalDays;
    const remaining = D.diffDays(result.edd, result.reference);
    const [trimester, trimesterNote] = trimesterFor(gaDays);
    $('out-lmp').textContent = D.formatDate(result.lmp);
    $('out-edd').textContent = D.formatDate(result.edd);
    $('out-ga').textContent = D.formatGA(gaDays);
    $('out-lmp-note').textContent = result.basis;
    $('out-ga-note').textContent = `${gaDays} elapsed days from LMP estimate`;
    $('out-trimester').textContent = trimester;
    $('out-trimester-note').textContent = trimesterNote;
    $('out-remaining').textContent = remaining > 0 ? `${remaining} days` : remaining === 0 ? 'Today' : `${Math.abs(remaining)} days past EDD`;
    $('out-remaining-note').textContent = remaining > 0 ? 'Estimated time until due date' : 'EDD is an estimate, not a deadline';
    const progress = Math.max(0, Math.min(280, gaDays));
    $('progress-fill').style.width = `${progress / 280 * 100}%`;
    $('progress-track').setAttribute('aria-valuenow', String(progress));
    $('out-progress-label').textContent = `${Math.round(progress / 280 * 100)}% of 40 weeks`;
    $('out-milestone').textContent = gaDays < 98 ? 'First trimester: early pregnancy.' : gaDays < 196 ? 'Second trimester: middle pregnancy.' : gaDays < 280 ? 'Third trimester: final stage of pregnancy.' : 'Estimated due date reached or passed. Follow your clinician’s advice.';
    $('out-reference').textContent = `Reference date: ${D.formatDate(result.reference)}. Method: ${result.method}. All dates are estimates.`;
    $('copy-status').textContent = '';
    $('results').classList.add('visible');
    $('results').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  function calculate(mode) {
    clearError(mode);
    try {
      let result;
      if (mode === 'usg') {
        const ga = getGA('usg-weeks', 'usg-days');
        if (!ga) throw new Error('Enter a valid scan date, whole weeks, and 0–6 additional days.');
        result = window.PregnancyCalculator.fromUltrasound($('usg-date').value, ga.weeks, ga.days);
      } else if (mode === 'lmp') {
        result = window.PregnancyCalculator.fromLMP($('lmp-date').value, $('ref-date').value);
      } else {
        const ga = getGA('ga-weeks', 'ga-days');
        if (!ga) throw new Error('Enter a valid reference date, whole weeks, and 0–6 additional days.');
        result = window.PregnancyCalculator.fromGestationalAge($('ga-date').value, ga.weeks, ga.days);
      }
      render(result);
    } catch (error) { showError(mode, error.message || 'Unable to calculate. Please check your inputs.'); }
  }
  function activate(mode) {
    modes.forEach(item => {
      const active = item === mode;
      $('tab-' + item).setAttribute('aria-selected', String(active));
      $('tab-' + item).setAttribute('tabindex', active ? '0' : '-1');
      $('panel-' + item).classList.toggle('hidden', !active);
      clearError(item);
    });
    $('results').classList.remove('visible');
  }
  modes.forEach(mode => $('tab-' + mode).addEventListener('click', () => activate(mode)));
  $('calc-usg').addEventListener('click', () => calculate('usg'));
  $('calc-lmp').addEventListener('click', () => calculate('lmp'));
  $('calc-ga').addEventListener('click', () => calculate('ga'));
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.reset;
    clearError(mode); $('results').classList.remove('visible');
    if (mode === 'usg') { $('usg-date').value = ''; $('usg-weeks').value = ''; $('usg-days').value = '0'; }
    if (mode === 'ga') { $('ga-date').value = ''; $('ga-weeks').value = ''; $('ga-days').value = '0'; }
    if (mode === 'lmp') { $('lmp-date').value = ''; $('ref-date').value = todayISO; }
  }));
  $('print').addEventListener('click', () => window.print());
  $('theme-toggle').setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
  $('theme-toggle').textContent = document.body.classList.contains('dark') ? '☀ Light mode' : '☾ Dark mode';
  $('theme-toggle').addEventListener('click', () => {
    const enabled = document.body.classList.toggle('dark');
    $('theme-toggle').setAttribute('aria-pressed', String(enabled));
    $('theme-toggle').textContent = enabled ? '☀ Light mode' : '☾ Dark mode';
    try { localStorage.setItem('pregnancy-dating-theme', enabled ? 'dark' : 'light'); } catch (_) { /* Theme still works for this session. */ }
  });
  $('copy-results').addEventListener('click', async () => {
    const summary = [
      'Pregnancy Dating Calculator',
      'Estimated LMP: ' + $('out-lmp').textContent,
      'Estimated due date (EDD): ' + $('out-edd').textContent,
      'Gestational age: ' + $('out-ga').textContent,
      'Trimester: ' + $('out-trimester').textContent,
      'Time until EDD: ' + $('out-remaining').textContent,
      $('out-reference').textContent,
      'Estimates only; confirm with a qualified clinician.'
    ].join('\n');
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(summary);
      else {
        const area = document.createElement('textarea'); area.value = summary;
        area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select();
        const ok = document.execCommand('copy'); area.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      $('copy-status').textContent = 'Summary copied. You can paste it into your notes.';
    } catch (_) { $('copy-status').textContent = 'Copy was not available in this browser. You can print the results instead.'; }
  });

  // Progressive Web App installation and offline support.
  let deferredInstallPrompt = null;
  const installButton = $('install-app');
  const installStatus = $('install-status');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Installation UI is optional: a missing element must not stop the calculator.
  if (installButton && installStatus) {
    if (isStandalone) {
      installButton.hidden = true;
      installStatus.textContent = 'App installed — you can open it from your home screen.';
    }
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      installButton.hidden = false;
      installButton.textContent = '＋ Install app';
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      installButton.hidden = true;
      installStatus.textContent = 'App installed successfully.';
    });
    installButton.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        installStatus.textContent = choice.outcome === 'accepted' ? 'Installation started.' : 'Installation was cancelled. You can install it later from your browser menu.';
        deferredInstallPrompt = null;
        installButton.hidden = true;
      } else if (isIOS) {
        installStatus.textContent = 'To install on iPhone/iPad: tap Share, then “Add to Home Screen”.';
      } else {
        installStatus.textContent = 'If available, choose “Install app” or “Add to Home screen” from your browser menu.';
      }
    });
    if (isIOS && !isStandalone) installButton.hidden = false;
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {
        if (installStatus) installStatus.textContent = 'Offline support could not be enabled in this browser.';
      });
    });
  }

  document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    next.focus(); next.click();
  }));
})();