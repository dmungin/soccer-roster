export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';

  // Format from input type=date is usually YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;

  // Use UTC to avoid timezone shifts for pure date strings
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  if (isNaN(date.getTime())) return dateStr;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const weekday = days[date.getDay()];

  let ordinal = 'th';
  if (day % 10 === 1 && day !== 11) ordinal = 'st';
  else if (day % 10 === 2 && day !== 12) ordinal = 'nd';
  else if (day % 10 === 3 && day !== 13) ordinal = 'rd';

  return `${month} ${day}${ordinal}, ${year} (${weekday}.)`;
}
