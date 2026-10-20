(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const modes = ['usg', 'lmp', 'ga', 'ivf'];
  const Dates = window.PregnancyDates;
  const Calc = window.PregnancyCalculator;
  const now = new Date();
  const todayISO = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  let currentResult = null;
  let language = 'en';
  try {
    if (localStorage.getItem('pregnancy-dating-theme') === 'dark') document.body.classList.add('dark');
    if (localStorage.getItem('pregnancy-dating-language') === 'hi') language = 'hi';
  } catch (_) { /* Storage is optional. */ }

  function t(en, hi) { return language === 'hi' ? hi : en; }
  function formatDate(date) {
    return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  function applyLanguage() {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    document.querySelectorAll('[data-en][data-hi]').forEach(el => { el.textContent = el.getAttribute(language === 'hi' ? 'data-hi' : 'data-en'); });
    $('language-toggle').textContent = language === 'hi' ? 'English' : 'हिंदी';
    $('language-toggle').setAttribute('aria-label', language === 'hi' ? 'Switch language to English' : 'भाषा हिंदी में बदलें');
    $('theme-toggle').textContent = document.body.classList.contains('dark') ? t('☀ Light mode', '☀ लाइट मोड') : t('☾ Dark mode', '☾ डार्क मोड');
    document.querySelectorAll('#usg-days option, #ga-days option').forEach(option => {
      const n = Number(option.value);
      option.textContent = language === 'hi' ? n + ' दिन' : n + (n === 1 ? ' day' : ' days');
    });
    if (currentResult) render(currentResult, false);
    updateGuide();
  }
  $('usg-date').value = todayISO;
  $('ga-date').value = todayISO;
  $('ref-date').value = todayISO;
  $('ga-check-date').value = todayISO;
  $('interval-start').value = todayISO;
  $('interval-end').value = todayISO;
  for (let week = 1; week <= 40; week++) {
    const option = document.createElement('option');
    option.value = String(week);
    option.textContent = (language === 'hi' ? 'सप्ताह ' : 'Week ') + week;
    $('guide-week').appendChild(option);
  }

  function trimesterFor(days) {
    if (days < 98) return [t('First trimester', 'पहली तिमाही'), t('Up to 13 weeks 6 days', '13 सप्ताह 6 दिन तक')];
    if (days < 196) return [t('Second trimester', 'दूसरी तिमाही'), t('14 weeks to 27 weeks 6 days', '14 से 27 सप्ताह 6 दिन')];
    return [t('Third trimester', 'तीसरी तिमाही'), t('28 weeks onward', '28 सप्ताह से आगे')];
  }
  function showError(mode, message) {
    $('err-' + mode).textContent = language === 'hi' ? 'जानकारी जाँचें: ' + message : message;
    $('results').classList.remove('visible');
  }
  function clearError(mode) { $('err-' + mode).textContent = ''; }
  function getGA(weeksId, daysId) {
    const raw = $(weeksId).value.trim(), weeks = Number(raw), days = Number($(daysId).value);
    if (raw === '' || !Number.isInteger(weeks) || weeks < 0 || weeks > 45 || !Number.isInteger(days) || days < 0 || days > 6) return null;
    return { weeks, days };
  }
  function render(result, scroll) {
    currentResult = result;
    const gaDays = result.totalDays;
    const remaining = Dates.diffDays(result.edd, result.reference);
    const tri = trimesterFor(gaDays);
    $('out-lmp').textContent = formatDate(result.lmp);
    $('out-edd').textContent = formatDate(result.edd);
    $('out-ga').textContent = Dates.formatGA(gaDays);
    $('out-lmp-note').textContent = result.basis;
    $('out-ga-note').textContent = t(gaDays + ' elapsed days from estimated LMP', 'अनुमानित LMP से ' + gaDays + ' दिन');
    $('out-trimester').textContent = tri[0];
    $('out-trimester-note').textContent = tri[1];
    $('out-remaining').textContent = remaining > 0 ? t(remaining + ' days', remaining + ' दिन') : remaining === 0 ? t('Today', 'आज') : t(Math.abs(remaining) + ' days past EDD', 'EDD से ' + Math.abs(remaining) + ' दिन बाद');
    $('out-remaining-note').textContent = remaining > 0 ? t('Estimated time until due date', 'अनुमानित प्रसव तारीख़ तक') : t('EDD is an estimate, not a deadline', 'EDD अनुमान है, अंतिम समय-सीमा नहीं');
    const progress = Math.max(0, Math.min(280, gaDays));
    $('progress-fill').style.width = (progress / 280 * 100) + '%';
    $('progress-track').setAttribute('aria-valuenow', String(progress));
    $('out-progress-label').textContent = Math.round(progress / 280 * 100) + '% ' + t('of 40 weeks', '40 सप्ताह में से');
    $('out-milestone').textContent = gaDays < 98 ? t('First trimester: early pregnancy.', 'पहली तिमाही: शुरुआती गर्भावस्था।') : gaDays < 196 ? t('Second trimester: middle pregnancy.', 'दूसरी तिमाही: मध्य गर्भावस्था।') : gaDays < 280 ? t('Third trimester: discuss upcoming care with your clinician.', 'तीसरी तिमाही: आगे की देखभाल पर चिकित्सक से चर्चा करें।') : t('Estimated due date reached or passed. Follow your clinician’s advice.', 'अनुमानित प्रसव तारीख़ आ गई है या बीत गई है। चिकित्सक की सलाह लें।');
    $('out-reference').textContent = t('Reference date: ', 'संदर्भ तारीख़: ') + formatDate(result.reference) + t('. Method: ', '। विधि: ') + result.method + t('. All dates are estimates.', '। सभी तारीख़ें अनुमान हैं।');
    $('copy-status').textContent = '';
    $('results').classList.add('visible');
    $('milestone-empty').classList.add('hidden');
    $('planner-empty').classList.add('hidden');
    $('download-calendar').disabled = false;
    $('use-current-week').disabled = false;
    $('calc-ga-check').disabled = false;
    $('ga-check-date').value = Dates.toISO(result.reference);
    buildMilestones(result);
    buildPlanner(result);
    updateGuide();
    if (scroll !== false) $('results').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  function calculate(mode) {
    clearError(mode);
    try {
      let result;
      if (mode === 'usg') {
        const ga = getGA('usg-weeks', 'usg-days');
        if (!ga) throw new Error('Enter valid whole weeks and 0–6 additional days.');
        result = Calc.fromUltrasound($('usg-date').value, ga.weeks, ga.days);
      } else if (mode === 'lmp') {
        result = Calc.fromLMP($('lmp-date').value, $('ref-date').value);
      } else if (mode === 'ga') {
        const ga = getGA('ga-weeks', 'ga-days');
        if (!ga) throw new Error('Enter valid whole weeks and 0–6 additional days.');
        result = Calc.fromGestationalAge($('ga-date').value, ga.weeks, ga.days);
      } else {
        result = Calc.fromIVF($('ivf-date').value, Number($('ivf-age').value), todayISO);
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
  ['usg', 'lmp', 'ga', 'ivf'].forEach(mode => $('calc-' + mode).addEventListener('click', () => calculate(mode)));
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.reset;
    clearError(mode); $('results').classList.remove('visible');
    if (mode === 'usg') { $('usg-date').value = todayISO; $('usg-weeks').value = ''; $('usg-days').value = '0'; }
    if (mode === 'ga') { $('ga-date').value = todayISO; $('ga-weeks').value = ''; $('ga-days').value = '0'; }
    if (mode === 'lmp') { $('lmp-date').value = ''; $('ref-date').value = todayISO; }
    if (mode === 'ivf') { $('ivf-date').value = ''; $('ivf-age').value = '5'; }
  }));
  document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    next.focus(); next.click();
  }));
  $('theme-toggle').setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
  $('theme-toggle').addEventListener('click', () => {
    const enabled = document.body.classList.toggle('dark');
    $('theme-toggle').setAttribute('aria-pressed', String(enabled));
    $('theme-toggle').textContent = enabled ? t('☀ Light mode', '☀ लाइट मोड') : t('☾ Dark mode', '☾ डार्क मोड');
    try { localStorage.setItem('pregnancy-dating-theme', enabled ? 'dark' : 'light'); } catch (_) {}
  });
  $('language-toggle').addEventListener('click', () => {
    language = language === 'en' ? 'hi' : 'en';
    try { localStorage.setItem('pregnancy-dating-language', language); } catch (_) {}
    applyLanguage();
  });
  $('print').addEventListener('click', () => window.print());
  $('copy-results').addEventListener('click', async () => {
    const summary = [
      t('Pregnancy Care Toolkit', 'गर्भावस्था देखभाल टूलकिट'),
      t('Estimated LMP: ', 'अनुमानित LMP: ') + $('out-lmp').textContent,
      t('Estimated due date (EDD): ', 'अनुमानित प्रसव तारीख़ (EDD): ') + $('out-edd').textContent,
      t('Gestational age: ', 'गर्भावधि: ') + $('out-ga').textContent,
      t('Trimester: ', 'तिमाही: ') + $('out-trimester').textContent,
      $('out-reference').textContent,
      t('Estimate only; confirm with a qualified clinician.', 'केवल अनुमान; योग्य चिकित्सक से पुष्टि करें।')
    ].join('\n');
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(summary);
      else {
        const area = document.createElement('textarea'); area.value = summary; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select();
        const ok = document.execCommand('copy'); area.remove(); if (!ok) throw new Error('Copy unavailable');
      }
      $('copy-status').textContent = t('Summary copied.', 'सारांश कॉपी हो गया।');
    } catch (_) { $('copy-status').textContent = t('Copy unavailable; use Print / Save PDF.', 'कॉपी उपलब्ध नहीं; प्रिंट / PDF सेव करें।'); }
  });

  const milestones = [
    { week: 8, title: ['Early prenatal care', 'शुरुआती प्रसवपूर्व देखभाल'], note: ['Discuss booking, medical history and locally recommended tests.', 'पहली मुलाक़ात, चिकित्सा इतिहास और स्थानीय रूप से सुझाई गई जाँच पर चर्चा करें।'] },
    { week: 12, title: ['First-trimester review', 'पहली तिमाही की समीक्षा'], note: ['Ask whether dating ultrasound or screening is indicated in your care pathway.', 'अपनी देखभाल योजना में डेटिंग अल्ट्रासाउंड या स्क्रीनिंग के बारे में पूछें।'] },
    { week: 20, title: ['Mid-pregnancy review', 'मध्य गर्भावस्था की समीक्षा'], note: ['An anatomy scan is commonly offered around 18–22 weeks in many care pathways.', 'कई देखभाल योजनाओं में लगभग 18–22 सप्ताह में एनाटॉमी स्कैन दिया जाता है।'] },
    { week: 28, title: ['Third-trimester planning', 'तीसरी तिमाही की योजना'], note: ['Review results, symptoms and any locally recommended screening with your clinician.', 'रिपोर्ट, लक्षण और स्थानीय रूप से सुझाई गई स्क्रीनिंग पर चिकित्सक से चर्चा करें।'] },
    { week: 32, title: ['Birth and support planning', 'प्रसव और सहायता की योजना'], note: ['Discuss birth preferences, transport and who to contact if concerns arise.', 'प्रसव की प्राथमिकताएँ, आने-जाने की व्यवस्था और चिंता होने पर संपर्क पर चर्चा करें।'] },
    { week: 36, title: ['Late-pregnancy review', 'अंतिम गर्भावस्था समीक्षा'], note: ['Confirm the follow-up plan and which symptoms need urgent assessment.', 'फॉलो-अप योजना और किन लक्षणों में तुरंत जाँच ज़रूरी है, पुष्टि करें।'] },
    { week: 40, title: ['Estimated due date', 'अनुमानित प्रसव तारीख़'], note: ['The EDD is an estimate, not a deadline. Follow your clinician’s plan if still pregnant.', 'EDD अनुमान है, अंतिम समय-सीमा नहीं। गर्भावस्था जारी हो तो चिकित्सक की योजना मानें।'] }
  ];
  function buildMilestones(result) {
    const list = $('milestone-list'); list.replaceChildren();
    milestones.forEach(item => {
      const date = Calc.milestoneDate(Dates.toISO(result.lmp), item.week, 0);
      const li = document.createElement('li'); li.className = 'timeline-item';
      const dot = document.createElement('span'); dot.className = 'timeline-dot'; dot.textContent = item.week;
      const body = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = item.title[language === 'hi' ? 1 : 0];
      const time = document.createElement('time'); time.dateTime = Dates.toISO(date); time.textContent = formatDate(date);
      const note = document.createElement('p'); note.textContent = item.note[language === 'hi' ? 1 : 0];
      body.append(title, time, note); li.append(dot, body); list.appendChild(li);
    });
  }
  function buildPlanner(result) {
    const list = $('planner-list'); list.replaceChildren();
    const items = [
      { week: '6–10', dateWeek: 8, title: ['Booking / first prenatal contact', 'पहली प्रसवपूर्व मुलाक़ात'], note: ['Discuss history, medications and the locally recommended care plan.', 'इतिहास, दवाओं और स्थानीय देखभाल योजना पर चर्चा करें।'] },
      { week: '11–14', dateWeek: 12, title: ['Dating and screening discussion', 'डेटिंग और स्क्रीनिंग पर चर्चा'], note: ['Ask which scans and screening options are appropriate for you.', 'अपने लिए उपयुक्त स्कैन और स्क्रीनिंग विकल्प पूछें।'] },
      { week: '18–22', dateWeek: 20, title: ['Mid-pregnancy ultrasound window', 'मध्य गर्भावस्था अल्ट्रासाउंड अवधि'], note: ['An anatomy scan is commonly offered in this window; local practice varies.', 'इस अवधि में अक्सर एनाटॉमी स्कैन दिया जाता है; स्थानीय अभ्यास अलग हो सकता है।'] },
      { week: '24–28', dateWeek: 26, title: ['Review and screening window', 'समीक्षा और स्क्रीनिंग अवधि'], note: ['Review blood pressure, symptoms and tests recommended by your clinician.', 'रक्तचाप, लक्षण और चिकित्सक द्वारा सुझाई गई जाँच की समीक्षा करें।'] },
      { week: '30–34', dateWeek: 32, title: ['Ongoing care and birth preparation', 'नियमित देखभाल और प्रसव तैयारी'], note: ['Discuss birth preferences, support and how to access care.', 'प्रसव प्राथमिकताओं, सहायता और देखभाल तक पहुँच पर चर्चा करें।'] },
      { week: '35–37', dateWeek: 36, title: ['Late-pregnancy planning', 'अंतिम गर्भावस्था योजना'], note: ['Confirm follow-up timing and any tests required by local guidance.', 'फॉलो-अप और स्थानीय दिशानिर्देशों के अनुसार ज़रूरी जाँच की पुष्टि करें।'] }
    ];
    items.forEach(item => {
      const date = Calc.milestoneDate(Dates.toISO(result.lmp), item.dateWeek, 0);
      const article = document.createElement('article'); article.className = 'planner-item';
      const window = document.createElement('span'); window.className = 'window'; window.textContent = t('Approx. weeks ' + item.week, 'लगभग सप्ताह ' + item.week);
      const title = document.createElement('strong'); title.textContent = item.title[language === 'hi' ? 1 : 0];
      const time = document.createElement('time'); time.dateTime = Dates.toISO(date); time.textContent = formatDate(date);
      const note = document.createElement('p'); note.textContent = item.note[language === 'hi' ? 1 : 0];
      article.append(window, title, time, note); list.appendChild(article);
    });
  }
  function guideContent(week) {
    const ranges = [
      { max: 4, en: 'Pregnancy dating is counted from the first day of the last menstrual period. In a typical cycle, ovulation and conception occur later; timing varies.', hi: 'गर्भावधि की गिनती अंतिम माहवारी के पहले दिन से होती है। सामान्य चक्र में अंडोत्सर्जन और गर्भधारण बाद में होते हैं; समय अलग हो सकता है।', careEn: 'If planning pregnancy, ask your clinician about preconception health and folic acid.', careHi: 'गर्भधारण की योजना हो तो गर्भधारण-पूर्व स्वास्थ्य और फोलिक एसिड के बारे में चिकित्सक से पूछें।' },
      { max: 8, en: 'Early pregnancy development is underway. Symptoms differ widely, and symptoms alone cannot confirm how a pregnancy is progressing.', hi: 'शुरुआती गर्भावस्था में विकास की प्रक्रिया चलती है। लक्षण अलग-अलग होते हैं और केवल लक्षणों से प्रगति की पुष्टि नहीं होती।', careEn: 'Arrange prenatal care and review medicines or supplements with a clinician.', careHi: 'प्रसवपूर्व देखभाल शुरू करें और दवाओं या सप्लीमेंट पर चिकित्सक से चर्चा करें।' },
      { max: 13, en: 'This is the first trimester. Your clinician may discuss dating, medical history and screening options based on local practice.', hi: 'यह पहली तिमाही है। चिकित्सक स्थानीय अभ्यास के अनुसार डेटिंग, चिकित्सा इतिहास और स्क्रीनिंग विकल्पों पर चर्चा कर सकते हैं।', careEn: 'Attend recommended appointments; not every test is appropriate for everyone.', careHi: 'सुझाई गई मुलाक़ातों में जाएँ; हर जाँच हर व्यक्ति के लिए उपयुक्त नहीं होती।' },
      { max: 17, en: 'The second trimester has begun. Changes and symptoms vary; a week number is not a measure of fetal growth.', hi: 'दूसरी तिमाही शुरू हो गई है। बदलाव और लक्षण अलग हो सकते हैं; सप्ताह संख्या भ्रूण की वृद्धि का माप नहीं है।', careEn: 'Keep scheduled visits and ask when your local pathway recommends an anatomy scan.', careHi: 'निर्धारित मुलाक़ातों में जाएँ और एनाटॉमी स्कैन के समय के बारे में पूछें।' },
      { max: 22, en: 'Mid-pregnancy care often includes a discussion of the fetal anatomy ultrasound, commonly offered around 18–22 weeks in many settings.', hi: 'मध्य गर्भावस्था की देखभाल में भ्रूण के एनाटॉमी अल्ट्रासाउंड पर चर्चा हो सकती है; कई जगह यह लगभग 18–22 सप्ताह में होता है।', careEn: 'Scan timing and screening choices depend on your local care pathway and personal circumstances.', careHi: 'स्कैन का समय और स्क्रीनिंग विकल्प स्थानीय योजना और आपकी स्थिति पर निर्भर करते हैं।' },
      { max: 27, en: 'Pregnancy continues to progress through the second trimester. Symptoms, movement patterns and care needs vary from person to person.', hi: 'दूसरी तिमाही में गर्भावस्था आगे बढ़ती है। लक्षण, हलचल के पैटर्न और देखभाल की ज़रूरत व्यक्ति के अनुसार अलग होती है।', careEn: 'Ask your clinician what changes or symptoms should prompt urgent assessment.', careHi: 'कौन-से बदलाव या लक्षण तुरंत जाँच की ज़रूरत बताते हैं, चिकित्सक से पूछें।' },
      { max: 31, en: 'The third trimester begins at 28 weeks in this calculator. Your care team may adjust follow-up based on your health and pregnancy history.', hi: 'इस कैलकुलेटर में तीसरी तिमाही 28 सप्ताह से शुरू होती है। स्वास्थ्य और गर्भावस्था इतिहास के अनुसार फॉलो-अप बदल सकता है।', careEn: 'Review test results and follow your clinician’s plan rather than a generic online schedule.', careHi: 'सामान्य ऑनलाइन योजना के बजाय रिपोर्ट और चिकित्सक की योजना का पालन करें।' },
      { max: 35, en: 'Late pregnancy is a time to keep follow-up appointments and discuss birth preferences, practical support and where to seek care.', hi: 'अंतिम गर्भावस्था में फॉलो-अप मुलाक़ातें जारी रखें और प्रसव प्राथमिकताओं, सहायता तथा देखभाल केंद्र पर चर्चा करें।', careEn: 'Ask your maternity team for a clear plan for urgent symptoms and after-hours contact.', careHi: 'तत्काल लक्षणों और समय के बाद संपर्क के लिए मातृत्व टीम से स्पष्ट योजना लें।' },
      { max: 40, en: 'The estimated due date is a point of reference, not an exact prediction. Some pregnancies continue beyond it and require an individualized plan.', hi: 'अनुमानित प्रसव तारीख़ केवल संदर्भ है, सटीक भविष्यवाणी नहीं। कुछ गर्भावस्थाएँ इसके बाद भी चलती हैं और व्यक्तिगत योजना चाहिए।', careEn: 'Follow your clinician’s advice for monitoring and next steps if the due date is near or passed.', careHi: 'EDD पास हो या बीत गई हो तो निगरानी और अगले कदम के लिए चिकित्सक की सलाह लें।' }
    ];
    return ranges.find(range => week <= range.max) || ranges[ranges.length - 1];
  }
  function updateGuide() {
    const week = Number($('guide-week').value || 1);
    const content = guideContent(week);
    $('guide-trimester').textContent = t('WEEK ' + week + ' · ' + trimesterFor(week * 7)[0].toUpperCase(), 'सप्ताह ' + week + ' · ' + trimesterFor(week * 7)[0]);
    $('guide-heading').textContent = t('Week ' + week + ' overview', 'सप्ताह ' + week + ' का सार');
    $('guide-copy').textContent = content[language === 'hi' ? 'hi' : 'en'];
    $('guide-care').textContent = content[language === 'hi' ? 'careHi' : 'careEn'];
  }
  $('guide-week').addEventListener('change', updateGuide);
  $('use-current-week').addEventListener('click', () => {
    if (!currentResult) return;
    const ga = Dates.diffDays(Dates.parseISO(todayISO), currentResult.lmp);
    if (ga < 0 || ga > 280) { $('guide-week').value = '40'; }
    else { $('guide-week').value = String(Math.max(1, Math.min(40, Math.floor(ga / 7) || 1))); }
    updateGuide();
    $('guide').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('calc-bmi').addEventListener('click', () => {
    try {
      const bmi = Calc.calculateBMI(Number($('bmi-weight').value), Number($('bmi-height').value));
      $('bmi-result').textContent = t('BMI ' + bmi.bmi + ' · ' + bmi.category, 'BMI ' + bmi.bmi + ' · ' + ({'Underweight':'कम वज़न','Healthy weight':'स्वस्थ वज़न','Overweight':'अधिक वज़न','Obesity':'मोटापा'}[bmi.category] || bmi.category));
    } catch (error) { $('bmi-result').textContent = error.message; }
  });
  $('calc-interval').addEventListener('click', () => {
    try {
      const days = Calc.dateInterval($('interval-start').value, $('interval-end').value);
      $('interval-result').textContent = t(days + ' elapsed calendar days', days + ' कैलेंडर दिन');
    } catch (error) { $('interval-result').textContent = error.message; }
  });
  $('calc-ga-check').addEventListener('click', () => {
    if (!currentResult) return;
    try {
      const result = Calc.fromLMP(Dates.toISO(currentResult.lmp), $('ga-check-date').value);
      $('ga-check-result').textContent = Dates.formatGA(result.totalDays);
    } catch (error) { $('ga-check-result').textContent = error.message; }
  });
  $('download-calendar').addEventListener('click', () => {
    if (!currentResult) return;
    const stamp = date => Dates.toISO(date).replace(/-/g, '');
    const escapeICS = value => value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    const events = milestones.map(item => {
      const date = Calc.milestoneDate(Dates.toISO(currentResult.lmp), item.week, 0);
      return 'BEGIN:VEVENT\r\nUID:pregnancy-week-' + item.week + '-' + stamp(date) + '@pregnancy-dating-calculator\r\nDTSTAMP:' + stamp(Dates.parseISO(todayISO)) + 'T090000Z\r\nDTSTART;VALUE=DATE:' + stamp(date) + '\r\nSUMMARY:' + escapeICS(t('Pregnancy week ' + item.week, 'गर्भावस्था सप्ताह ' + item.week)) + '\r\nDESCRIPTION:' + escapeICS(t('Estimated milestone only. Confirm care with your clinician.', 'केवल अनुमानित पड़ाव। देखभाल की पुष्टि चिकित्सक से करें।')) + '\r\nEND:VEVENT';
    }).join('\r\n');
    const calendar = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Pregnancy Care Toolkit//EN\r\nCALSCALE:GREGORIAN\r\n' + events + '\r\nEND:VCALENDAR\r\n';
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'pregnancy-milestones.ics'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  });

  // Progressive Web App installation remains optional and cannot block core tools.
  let deferredInstallPrompt = null;
  const installButton = $('install-app'), installStatus = $('install-status');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (installButton && installStatus) {
    if (isStandalone) { installButton.hidden = true; installStatus.textContent = t('App installed — open it from your home screen.', 'ऐप इंस्टॉल है — होम स्क्रीन से खोलें।'); }
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; installButton.hidden = false; });
    window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; installButton.hidden = true; installStatus.textContent = t('App installed successfully.', 'ऐप सफलतापूर्वक इंस्टॉल हुआ।'); });
    installButton.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        installStatus.textContent = choice.outcome === 'accepted' ? t('Installation started.', 'इंस्टॉलेशन शुरू हुआ।') : t('Installation cancelled. You can try again from the browser menu.', 'इंस्टॉलेशन रद्द हुआ। ब्राउज़र मेनू से फिर प्रयास करें।');
        deferredInstallPrompt = null; installButton.hidden = true;
      } else if (isIOS) installStatus.textContent = t('On iPhone/iPad: tap Share, then Add to Home Screen.', 'iPhone/iPad पर Share दबाएँ, फिर Add to Home Screen चुनें।');
      else installStatus.textContent = t('If available, choose Install app or Add to Home screen from your browser menu.', 'यदि उपलब्ध हो, ब्राउज़र मेनू में Install app या Add to Home screen चुनें।');
    });
    if (isIOS && !isStandalone) installButton.hidden = false;
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {
      if (installStatus) installStatus.textContent = t('Offline support could not be enabled in this browser.', 'इस ब्राउज़र में ऑफ़लाइन सुविधा शुरू नहीं हो सकी।');
    }));
  }
  applyLanguage();
})();