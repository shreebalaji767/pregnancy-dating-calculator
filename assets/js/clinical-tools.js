(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  const t = (en, hi) => document.documentElement.lang === 'hi' ? hi : en;
  const number = id => {
    const el = $(id);
    if (!el || el.value.trim() === '') return NaN;
    return Number(el.value);
  };
  function setResult(id, en, hi, error) {
    const el = $(id);
    if (el) el.textContent = error ? t('Check the entered values. ', 'दर्ज मान जाँचें। ') + t(en, hi) : t(en, hi);
  }
  on('calc-map', () => {
    const sbp = number('map-sbp'), dbp = number('map-dbp');
    if (!Number.isFinite(sbp) || !Number.isFinite(dbp) || sbp < 40 || sbp > 300 || dbp < 20 || dbp > 200 || sbp <= dbp) {
      setResult('map-result', 'Enter valid BP values with systolic greater than diastolic.', 'सही BP मान दर्ज करें; सिस्टोलिक डायस्टोलिक से अधिक होना चाहिए।', true); return;
    }
    const map = Math.round(((sbp + 2 * dbp) / 3) * 10) / 10;
    const severe = sbp >= 160 || dbp >= 110;
    const message = 'MAP: ' + map + ' mmHg' + (severe ? ' — urgent clinical assessment for severe-range BP.' : ' — interpret with clinical context.');
    const hiMessage = 'MAP: ' + map + ' mmHg' + (severe ? ' — गंभीर BP के कारण तुरंत चिकित्सकीय मूल्यांकन लें।' : ' — क्लिनिकल संदर्भ के साथ मूल्यांकन करें।');
    setResult('map-result', message, hiMessage);
  });
  on('calc-apgar', () => {
    const ids = ['apgar-appearance','apgar-pulse','apgar-grimace','apgar-activity','apgar-respiration'];
    const vals = ids.map(number);
    if (vals.some(v => !Number.isInteger(v) || v < 0 || v > 2)) {
      setResult('apgar-result', 'Select a valid score for every component.', 'हर घटक के लिए सही स्कोर चुनें।', true); return;
    }
    const total = vals.reduce((sum, v) => sum + v, 0);
    const time = $('apgar-time').value;
    const en = 'APGAR at ' + time + ' minute(s): ' + total + '/10. Record each component and follow neonatal care protocol.';
    const hi = 'APGAR ' + time + ' मिनट पर: ' + total + '/10। प्रत्येक घटक दर्ज करें और नवजात देखभाल प्रोटोकॉल का पालन करें।';
    setResult('apgar-result', en, hi);
  });
  on('reset-apgar', () => {
    ['apgar-appearance','apgar-pulse','apgar-grimace','apgar-activity','apgar-respiration'].forEach(id => { if ($(id)) $(id).value = '0'; });
    if ($('apgar-time')) $('apgar-time').value = '1';
    if ($('apgar-result')) $('apgar-result').textContent = '';
  });
  on('calc-bishop', () => {
    const ids = ['bishop-dilation','bishop-effacement','bishop-station','bishop-consistency','bishop-position'];
    const vals = ids.map(number);
    const limits = [3,3,3,2,2];
    if (vals.some((v,i) => !Number.isInteger(v) || v < 0 || v > limits[i])) {
      setResult('bishop-result', 'Select valid examination findings for every category.', 'हर श्रेणी के लिए सही जाँच निष्कर्ष चुनें।', true); return;
    }
    const total = vals.reduce((sum, v) => sum + v, 0);
    const interpretation = total <= 5 ? 'lower score; discuss the full clinical picture and local protocol' : total <= 7 ? 'intermediate score; interpret with the full clinical picture and local protocol' : 'higher score; this score alone does not determine management';
    const hiInterpretation = total <= 5 ? 'कम स्कोर; पूरी क्लिनिकल स्थिति और स्थानीय प्रोटोकॉल के साथ मूल्यांकन करें' : total <= 7 ? 'मध्यम स्कोर; पूरी क्लिनिकल स्थिति और स्थानीय प्रोटोकॉल के साथ मूल्यांकन करें' : 'अधिक स्कोर; केवल यह स्कोर प्रबंधन तय नहीं करता';
    setResult('bishop-result', 'Bishop score: ' + total + '/13 — ' + interpretation + '.', 'बिशप स्कोर: ' + total + '/13 — ' + hiInterpretation + '।');
  });
  on('reset-bishop', () => {
    ['bishop-dilation','bishop-effacement','bishop-station','bishop-consistency','bishop-position'].forEach(id => { if ($(id)) $(id).value = '0'; });
    if ($('bishop-result')) $('bishop-result').textContent = '';
  });
  on('calc-gtpal', () => {
    const ids = ['gtpal-g','gtpal-t','gtpal-p','gtpal-a','gtpal-l'];
    const vals = ids.map(number);
    if (vals.some(v => !Number.isInteger(v) || v < 0 || v > 99)) {
      setResult('gtpal-result', 'Enter whole-number counts from 0 to 99.', '0 से 99 तक पूर्ण संख्या दर्ज करें।', true); return;
    }
    const [g,tCount,p,a,l] = vals;
    const en = 'G' + g + ' T' + tCount + ' P' + p + ' A' + a + ' L' + l + ' — verify against the complete documented history.';
    const hi = 'G' + g + ' T' + tCount + ' P' + p + ' A' + a + ' L' + l + ' — पूर्ण दर्ज इतिहास से पुष्टि करें।';
    setResult('gtpal-result', en, hi);
  });
  on('reset-gtpal', () => {
    const defaults = {'gtpal-g':'1','gtpal-t':'0','gtpal-p':'0','gtpal-a':'0','gtpal-l':'0'};
    Object.entries(defaults).forEach(([id,v]) => { if ($(id)) $(id).value = v; });
    if ($('gtpal-result')) $('gtpal-result').textContent = '';
  });
})();
