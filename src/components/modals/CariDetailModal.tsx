import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Cari } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  Layers,
  Calendar,
} from 'lucide-react';

interface CariDetailModalProps {
  cari: Cari | null;
  onClose: () => void;
  onEdit: (cari: Cari) => void;
}

export const CariDetailModal: React.FC<CariDetailModalProps> = ({
  cari,
  onClose,
  onEdit,
}) => {
  const { transactions, upcomingDues, openTransactionModal, openInstallmentModal } = useFinance();

  if (!cari) return null;

  // Filter transactions for this Cari
  const cariTransactions = transactions.filter(
    tx =>
      tx.cariId === cari.id ||
      (tx.cariName && tx.cariName.toLowerCase().includes(cari.name.toLowerCase()))
  );

  // Filter upcoming dues for this Cari
  const cariUpcomingDues = upcomingDues.filter(
    d =>
      d.cariId === cari.id ||
      (d.cariName && d.cariName.toLowerCase().includes(cari.name.toLowerCase()))
  );

  const totalIncomeFromCari = cariTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseToCari = cariTransactions
    .filter(t => t.type === 'Gider')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCollect = () => {
    onClose();
    openTransactionModal({
      type: 'Gelir',
      cariId: cari.id,
      cariName: cari.name,
      category: 'Cari Hesap Tahsilatı',
      desc: `${cari.name} tahsilatı`,
      amount: cari.balance > 0 ? cari.balance : undefined,
    });
  };

  const handlePay = () => {
    onClose();
    openTransactionModal({
      type: 'Gider',
      cariId: cari.id,
      cariName: cari.name,
      category: 'Stok & Mal Alımı',
      desc: `${cari.name} ödemesi`,
      amount: cari.balance < 0 ? Math.abs(cari.balance) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                {cari.type}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500">{cari.city || 'Belirtilmedi'}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {cari.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(cari)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Düzenle
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance & Quick Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Güncel Bakiye Durumu
            </span>
            <div
              className={`text-xl font-bold font-mono-num mt-0.5 ${
                cari.balance > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : cari.balance < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {formatCurrency(cari.balance)}
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {cari.balance > 0
                ? 'Alacağımız Var'
                : cari.balance < 0
                ? 'Borcumuz Var'
                : 'Bakiye Kapalı (0.00)'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Toplam Tahsilat / Ödeme
            </span>
            <div className="text-xs space-y-1 mt-1 font-mono-num">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Alınan: +{formatCurrency(totalIncomeFromCari)}
              </div>
              <div className="text-rose-600 dark:text-rose-400 font-semibold">
                Ödenen: -{formatCurrency(totalExpenseToCari)}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1.5">
            <button
              onClick={handleCollect}
              className="w-full py-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Tahsilat Al (+)
            </button>
            <button
              onClick={handlePay}
              className="w-full py-1.5 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Ödeme Yap (-)
            </button>
            <button
              onClick={() => {
                onClose();
                openInstallmentModal({
                  cariId: cari.id,
                  cariName: cari.name,
                  type: cari.type === 'Müşteri' ? 'Gelir' : 'Gider',
                  totalAmount: cari.balance !== 0 ? Math.abs(cari.balance) : undefined,
                });
              }}
              className="w-full py-1.5 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" /> Taksit Planı Başlat
            </button>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3" /> Telefon
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {cari.phone || '-'}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Mail className="w-3 h-3" /> E-posta
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
              {cari.email || '-'}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Building className="w-3 h-3" /> Vergi Dairesi
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {cari.taxOffice || '-'}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Receipt className="w-3 h-3" /> Vergi / TCKN No
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
              {cari.taxNumber || '-'}
            </span>
          </div>
        </div>

        {cari.notes && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Not: </span>
            {cari.notes}
          </div>
        )}

        {/* Active Upcoming Dues / Installments preview for this Cari */}
        {cariUpcomingDues.length > 0 && (
          <div className="space-y-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Planlanan Vade & Taksit Takvimi ({cariUpcomingDues.length})
              </span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono-num font-semibold">
                Toplam: ₺{cariUpcomingDues.reduce((s, d) => s + d.amount, 0).toLocaleString('tr-TR')}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {cariUpcomingDues.map(due => (
                <div
                  key={due.id}
                  className="min-w-[170px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/60 shrink-0"
                >
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                      {due.title}
                    </span>
                    <span
                      className={`font-mono-num font-bold ${
                        due.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(due.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatDate(due.dueDate)}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-medium ${
                        due.isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {due.isCompleted ? 'Ödendi' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cari Ekstre (Transactions Statement Table) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Cari Hareket Ekstresi ({cariTransactions.length})
            </h4>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {cariTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Bu cari hesaba ait henüz işlem kaydı bulunmamaktadır.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Tür</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3">Durum</th>
                    <th className="py-2.5 px-3">Belge No</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cariTransactions.map(tx => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            tx.type === 'Gelir'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <span>{tx.desc || tx.category}</span>
                        {tx.installmentIndex && tx.totalInstallments && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {tx.installmentIndex}/{tx.totalInstallments}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            tx.status === 'Tamamlandı'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : tx.status === 'Beklemede'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {tx.documentNo || '-'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono-num font-bold whitespace-nowrap ${
                          tx.type === 'Gelir'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'Gelir' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
