export function formatItemCode(code: number) {
  return `BOD-${String(code).padStart(6, '0')}`;
}
