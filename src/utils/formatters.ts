export function formatCurrency(amount: number, currency: 'TRY' | 'USD' | 'EUR' = 'TRY'): string {
  const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€';
  const formatted = Math.abs(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatCompactCurrency(amount: number, currency: 'TRY' | 'USD' | 'EUR' = 'TRY'): string {
  const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${amount < 0 ? '-' : ''}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${amount < 0 ? '-' : ''}${symbol}${(abs / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}.${month}.${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(dateStr: string): { days: number; text: string; status: 'overdue' | 'today' | 'upcoming' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), text: `${Math.abs(diffDays)} gün gecikti`, status: 'overdue' };
  } else if (diffDays === 0) {
    return { days: 0, text: 'Bugün', status: 'today' };
  } else if (diffDays === 1) {
    return { days: 1, text: 'Yarın', status: 'upcoming' };
  } else {
    return { days: diffDays, text: `${diffDays} gün kaldı`, status: 'upcoming' };
  }
}

export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateInstallmentDate(firstDueDate: string, installmentIndex: number): string {
  return addDays(firstDueDate, installmentIndex * 30);
}

export interface InstallmentScheduleItem {
  index: number;
  title: string;
  dueDate: string;
  amount: number;
  daysRemaining: { days: number; text: string; status: 'overdue' | 'today' | 'upcoming' };
}

export function calculateInstallmentSchedule(
  totalAmount: number,
  installmentsCount: number,
  firstDueDate: string,
  firmName = ''
): InstallmentScheduleItem[] {
  const count = Math.max(1, Math.floor(installmentsCount));
  const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
  const remainder = Math.round((totalAmount - baseAmount * count) * 100) / 100;
  const schedule: InstallmentScheduleItem[] = [];
  const displayName = firmName.trim() || 'Taksit';

  for (let i = 1; i <= count; i++) {
    const dueDate = calculateInstallmentDate(firstDueDate, i - 1);
    const amount = i === count ? +(baseAmount + remainder).toFixed(2) : baseAmount;
    const title = `${displayName} - ${i}/${count} Taksit`;
    schedule.push({
      index: i,
      title,
      dueDate,
      amount,
      daysRemaining: getDaysRemaining(dueDate),
    });
  }
  return schedule;
}
