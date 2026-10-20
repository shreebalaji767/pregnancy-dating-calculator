/* Date helpers use UTC calendar dates to avoid daylight-saving and timezone drift. */
(function (global) {
  'use strict';
  const DAY_MS = 86400000;
  function parseISO(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  function toISO(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }
  function addDays(date, days) { return new Date(date.getTime() + days * DAY_MS); }
  function diffDays(later, earlier) { return Math.round((later.getTime() - earlier.getTime()) / DAY_MS); }
  function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  function formatGA(days) { return `${Math.floor(days / 7)} weeks ${days % 7} days`; }
  global.PregnancyDates = Object.freeze({ parseISO, toISO, addDays, diffDays, formatDate, formatGA });
})(window);