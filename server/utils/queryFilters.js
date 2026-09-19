const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateValidationError(message) {
  const error = new Error(message);
  // The shared API error mapper uses this status to return a useful client
  // error instead of treating an invalid filter like a database outage.
  error.status = 400;
  return error;
}

function parseCalendarDate(value, endOfDay = false) {
  if (!value) return null;
  if (!DATE_PATTERN.test(value)) {
    throw dateValidationError("Dates must use YYYY-MM-DD format");
  }

  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const date = new Date(`${value}${suffix}`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw dateValidationError("Enter a valid calendar date");
  }
  return date;
}

// Quote History uses full UTC calendar days so the browser and server agree
// about inclusive From/To filters regardless of where the server is hosted.
export function createDateRangeFilter(from, to) {
  const start = parseCalendarDate(from);
  const end = parseCalendarDate(to, true);

  if (start && end && start > end) {
    throw dateValidationError("From date cannot be later than To date");
  }
  if (!start && !end) return null;

  return {
    ...(start ? { $gte: start } : {}),
    ...(end ? { $lte: end } : {}),
  };
}
