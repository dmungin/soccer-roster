export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${month}-${day}-${year}`;
}
