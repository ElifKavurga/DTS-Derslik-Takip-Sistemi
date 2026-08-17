/**
 * Formats a Date object into "YYYY-MM-DD" string format.
 */
export const toDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the Monday of the week that the given date falls into.
 * Assumes Monday is the first day of the week.
 */
export const getWeekStart = (dateString: string): Date => {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diff = day === 0 ? -6 : 1 - day; // Shift to Monday
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + diff);
  return weekStart;
};

/**
 * Returns the Sunday of the week that the given date falls into.
 * Assumes Sunday is the last day of the week.
 */
export const getWeekEnd = (dateString: string): Date => {
  const weekStart = getWeekStart(dateString);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};
