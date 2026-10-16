import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Cari } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  X,
  Phone,
  Mail,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  Layers,
  Trash2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const {
    transactions,
    openTransactionModal,
    openInstallmentModal,
    isAdmin,
    deleteCari,
    requestDeleteCari,
  } = useFinance();

  if (!cari) return null;

  const cariTransactions = transactions.filter(
    tx =>
      tx.cariId === cari.id ||
      (tx.isPosOffset && tx.supplierCariId === cari.id) ||
      (tx.cariName && tx.cariName.toLowerCase().includes(cari.name.toLowerCase())) ||
      (tx.isPosOffset && tx.supplierCariName && tx.supplierCariName.toLowerCase().includes(cari.name.toLowerCase()))
  );

  const totalIncomeFromCari = cariTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseToCari = cariTransactions
    .filter(t => t.type === 'Gider' || t.type === 'Mal Alımı')
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
      category: 'Mal / Stok Alımı',
      desc: `${cari.name} ödemesi`,
      amount: cari.balance < 0 ? Math.abs(cari.balance) : undefined,
    });
  };

  const handleExportStatementExcel = () => {
    if (cariTransactions.length === 0) {
      alert('Bu cari hesaba ait hareket kaydı bulunamadı.');
      return;
    }
    const workbook = XLSX.utils.book_new();
    const rows = cariTransactions.map(tx => ({
      'Tarih': tx.date,
      'İşlem Türü': tx.type,
      'Açıklama': tx.desc || tx.category,
      'Kategori': tx.category,
      'Belge No': tx.documentNo || '-',
      'Tutar (TL)': tx.amount,
      'Durum': tx.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cari Ekstre');
    XLSX.writeFile(workbook, `${cari.name.replace(/\s+/g, '_')}_ekstre_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const cleanPhone = cari.phone ? cari.phone.replace(/[^0-9]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? `90${cleanPhone.slice(1)}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
  const whatsappUrl = cleanPhone ? `https://wa.me/${waPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
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
            {isAdmin ? (
              <button
                onClick={() => {
                  if (window.confirm(`"${cari.name}" cari kartını silmek istediğinize emin misiniz?`)) {
                    deleteCari(cari.id);
                    onClose();
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-lg transition flex items-center gap-1"
                title="Cari Kartı Sil (Yönetici)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sil</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const reason = window.prompt(
                    `"${cari.name}" cari kartını silmek için Yönetici (Admin) onayına gerekçe iletiniz:`,
                    'Cari kapatıldı / mükerrer kayıt'
                  );
                  if (reason !== null && reason.trim()) {
                    requestDeleteCari(cari.id, reason.trim());
                    onClose();
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-lg transition flex items-center gap-1"
                title="Yönetici Onayına Silme Talebi Gönder"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Silme Talebi</span>
              </button>
            )}
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
              className={`text-xl font-bold font-mono mt-0.5 ${
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
            <div className="text-xs space-y-1 mt-1 font-mono">
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
              <Layers className="w-3.5 h-3.5" /> Taksit Planla
            </button>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 relative group">
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3" /> Telefon
            </span>
            <div className="flex items-center justify-between">
              <a
                href={cari.phone ? `tel:${cleanPhone}` : undefined}
                className="font-medium text-slate-800 dark:text-slate-200 hover:text-emerald-600 underline font-mono"
              >
                {cari.phone || '-'}
              </a>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp ile İletişime Geç"
                  className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
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

        {/* Statement Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Cari Hareket Ekstresi ({cariTransactions.length})
            </h4>
            <button
              onClick={handleExportStatementExcel}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekstreyi Excel İndir</span>
            </button>
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
                        {tx.desc || tx.category}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {tx.documentNo || '-'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                          tx.type === 'Gelir'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'Gelir' ? '+' : '-'}{formatCurrency(tx.amount)}
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
