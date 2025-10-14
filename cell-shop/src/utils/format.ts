export function formatCurrency(amount: number, currency: string = 'USD', locales: string | string[] = 'en-US'): string {
  return new Intl.NumberFormat(locales, { style: 'currency', currency }).format(amount);
}
