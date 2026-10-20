/* Browser-only calendar calculations. Gestational age is always weeks + whole days. */
(function (global) {
  'use strict';
  const Dates = global.PregnancyDates;

  function result(lmp, reference, totalDays, basis, method) {
    return Object.freeze({ lmp, edd: Dates.addDays(lmp, 280), reference, totalDays, basis, method });
  }
  function fromUltrasound(scanDate, weeks, days) {
    const date = Dates.parseISO(scanDate);
    const totalDays = weeks * 7 + days;
    if (!date || !Number.isInteger(weeks) || weeks < 0 || weeks > 45 || !Number.isInteger(days) || days < 0 || days > 6) throw new Error('Enter a valid scan date, whole weeks, and 0–6 additional days.');
    return result(Dates.addDays(date, -totalDays), date, totalDays, 'Estimated by subtracting the reported ultrasound gestational age', 'USG');
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
  // ACOG: EDD is 261 days after day-5 transfer, 263 days after day-3 transfer.
  function fromIVF(transferDate, embryoAge, referenceValue) {
    const transfer = Dates.parseISO(transferDate);
    const reference = Dates.parseISO(referenceValue || transferDate);
    if (!transfer || !reference || ![3, 5].includes(embryoAge)) throw new Error('Enter a valid embryo transfer date and select a day-3 or day-5 embryo.');
    if (Dates.diffDays(reference, transfer) < 0) throw new Error('The reference date cannot be before the embryo transfer date.');
    const totalDaysAtTransfer = 14 + embryoAge;
    const lmp = Dates.addDays(transfer, -totalDaysAtTransfer);
    const totalDays = Dates.diffDays(reference, lmp);
    if (totalDays > 315) throw new Error('The interval exceeds 45 weeks. Please confirm the dates with your fertility team.');
    return Object.freeze({
      lmp,
      edd: Dates.addDays(transfer, 280 - totalDaysAtTransfer),
      reference,
      totalDays,
      basis: 'Estimated from embryo transfer date and embryo age; confirm with the fertility team',
      method: 'IVF day-' + embryoAge
    });
  }
  function calculateBMI(weightKg, heightCm) {
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500 || !Number.isFinite(heightCm) || heightCm < 50 || heightCm > 250) {
      throw new Error('Enter a plausible weight in kg and height in cm.');
    }
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    let category = 'Obesity';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Healthy weight';
    else if (bmi < 30) category = 'Overweight';
    return Object.freeze({ bmi: Math.round(bmi * 10) / 10, category });
  }
  function dateInterval(startValue, endValue) {
    const start = Dates.parseISO(startValue), end = Dates.parseISO(endValue);
    if (!start || !end) throw new Error('Enter both valid dates.');
    if (Dates.diffDays(end, start) < 0) throw new Error('The end date must be on or after the start date.');
    return Dates.diffDays(end, start);
  }
  function milestoneDate(lmpValue, week, day) {
    const lmp = Dates.parseISO(lmpValue);
    if (!lmp || !Number.isInteger(week) || week < 0 || week > 45 || !Number.isInteger(day) || day < 0 || day > 6) throw new Error('Enter a valid LMP and gestational age.');
    return Dates.addDays(lmp, week * 7 + day);
  }
  global.PregnancyCalculator = Object.freeze({ fromUltrasound, fromLMP, fromGestationalAge, fromIVF, calculateBMI, dateInterval, milestoneDate });
})(window);
