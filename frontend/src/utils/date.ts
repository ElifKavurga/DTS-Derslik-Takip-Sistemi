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

/**
 * Returns the Monday of the current week.
 */
export const getCurrentWeekStart = (): string => {
  return toDateValue(getWeekStart(toDateValue(new Date())));
};

/**
 * Shifts a given date string by a number of days.
 */
export const shiftDate = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateValue(date);
};

/**
 * Formats a week range (e.g. "17 - 23 Ağustos 2026")
 */
export const formatWeekRange = (startStr: string, endStr: string): string => {
  const start = new Date(`${startStr}T12:00:00`);
  const end = new Date(`${endStr}T12:00:00`);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = end.toLocaleDateString('tr-TR', { month: 'long' });
  const year = end.getFullYear();
  return `${startDay} - ${endDay} ${month} ${year}`;
};
