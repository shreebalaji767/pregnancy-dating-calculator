/* Pure obstetric calendar calculations. All GA inputs are weeks + whole days, never decimal weeks. */
(function (global) {
  'use strict';
  const Dates = global.PregnancyDates;
  function fromUltrasound(scanDate, weeks, days) {
    const date = Dates.parseISO(scanDate);
    const totalDays = weeks * 7 + days;
    if (!date || !Number.isInteger(weeks) || weeks < 0 || weeks > 45 || !Number.isInteger(days) || days < 0 || days > 6) throw new Error('Enter a valid scan date, whole weeks, and 0–6 additional days.');
    const lmp = Dates.addDays(date, -totalDays);
    return result(lmp, date, totalDays, 'Estimated by subtracting the reported ultrasound gestational age', 'USG');
  }
  function fromLMP(lmpValue, referenceValue) {
    const lmp = Dates.parseISO(lmpValue), reference = Dates.parseISO(referenceValue);
    if (!lmp || !reference) throw new Error('Enter both the first day of LMP and a reference date.');
    const totalDays = Dates.diffDays(reference, lmp);
    if (totalDays < 0) throw new Error('The reference date cannot be before the LMP.');
    if (totalDays > 315) throw new Error('The interval exceeds 45 weeks. Please check the dates.');
    return result(lmp, reference, totalDays, 'Based on entered LMP', 'LMP');
  }
  function fromGestationalAge(referenceValue, weeks, days) {
    const reference = Dates.parseISO(referenceValue);
    if (!reference || !Number.isInteger(weeks) || weeks < 0 || weeks > 45 || !Number.isInteger(days) || days < 0 || days > 6) throw new Error('Enter a valid reference date, whole weeks, and 0–6 additional days.');
    const totalDays = weeks * 7 + days;
    return result(Dates.addDays(reference, -totalDays), reference, totalDays, 'Estimated from reference date and gestational age', 'GA');
  }
  function result(lmp, reference, totalDays, basis, method) {
    return Object.freeze({ lmp, edd: Dates.addDays(lmp, 280), reference, totalDays, basis, method });
  }
  global.PregnancyCalculator = Object.freeze({ fromUltrasound, fromLMP, fromGestationalAge });
})(window);