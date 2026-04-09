export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  // Handle ISO format or YYYY-MM-DD
  const date = new Date(dateStr);
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
  
  let result = `${month} ${day}${ordinal}, ${year} (${weekday}.)`;
  
  // Check if time was provided (not 00:00:00 or part of ISO string)
  if (dateStr.includes('T')) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    result += ` @ ${displayHours}:${displayMinutes} ${ampm}`;
  }
  
  return result;
}
