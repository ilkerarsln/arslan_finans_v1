export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('tr-TR').format(num);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatPercent = (value: number): string => {
  if (isNaN(value)) return '%0';
  return `%${value.toFixed(1).replace('.', ',')}`;
};
