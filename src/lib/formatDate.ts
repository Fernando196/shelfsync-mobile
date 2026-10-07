// A proposito NO usa toLocaleDateString/toLocaleString/Intl: esos delegan en
// el Intl.DateTimeFormat del motor JS, y en builds de Hermes/Android sin
// ICU completo eso truena con un error interno tipo "Unsupported
// formatDataPart implementation". Formateo manual, sin locale, para no
// depender de eso.
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateEs(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTimeEs(date: Date): string {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 < 12 ? 'a.m.' : 'p.m.';
  return `${formatDateEs(date)} ${pad2(hours12)}:${pad2(date.getMinutes())} ${ampm}`;
}
