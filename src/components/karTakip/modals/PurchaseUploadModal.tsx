import React, { useState, useRef } from 'react';
import { useKarTakip } from '../../../context/KarTakipContext';
import {
  X,
  ShoppingBag,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  ArrowRight
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  autoGuessPurchaseMapping,
  convertRowsToPurchases,
  downloadPurchasesTemplate,
  ParsedSheetData
} from '../../../utils/karTakipExcelParser';
import { PurchaseColumnMapping } from '../../../types/karTakip';

interface PurchaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseUploadModal: React.FC<PurchaseUploadModalProps> = ({ isOpen, onClose }) => {
  const { addPurchases } = useKarTakip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [periodMonth, setPeriodMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [mapping, setMapping] = useState<PurchaseColumnMapping>({
    purchaseDate: '',
    supplierName: '',
    productCode: '',
    productName: '',
    category: '',
    quantity: '',
    unitCost: '',
    invoiceNo: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await parseExcelOrCsvFile(file);
      setParsedData(data);
      const guessed = autoGuessPurchaseMapping(data.headers);
      setMapping(guessed);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Dosya işlenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeImport = () => {
    if (!parsedData) return;
    try {
      const converted = convertRowsToPurchases(parsedData.rows, mapping, periodMonth);
      if (converted.length === 0) {
        throw new Error('Aktarılacak geçerli mal alım satırı bulunamadı.');
      }
      addPurchases(converted);
      onClose();
      setStep('upload');
      setParsedData(null);
    } catch (err: any) {
      setError(err.message || 'Mal alım listesi aktarılırken hata oluştu.');
    }
  };

  const previewItems = parsedData
    ? convertRowsToPurchases(parsedData.rows.slice(0, 5), mapping, periodMonth)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Toplu Mal Alımı (Satın Alma) Excel Yükleme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tedarikçilerden gelen irsaliye ve alım partilerini Excel ile sisteme aktarın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-xs">
          <div className={`flex items-center gap-1.5 font-medium ${
            step === 'upload' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'upload' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span>Dönem & Dosya</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-1.5 font-medium ${
            step === 'mapping' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'mapping' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span>Sütun Eşleme</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-1.5 font-medium ${
            step === 'preview' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'preview' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span>Önizleme & Onay</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Alım Yapılan Ay / Dönem *
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={e => setPeriodMonth(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    Örn: 2024-05
                  </span>
                </div>
              </div>

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-950/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Mal Alım Excel Dosyasını Buraya Sürükleyin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-3">
                  Tedarikçi, ürün kodu, alınan adet ve alış birim maliyeti içeren .xlsx dosyasını seçin
                </p>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {loading ? 'Dosya Okunuyor...' : 'Dosya Seç'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
                <span className="text-slate-500">Örnek mal alım şablonunu indirmek ister misiniz?</span>
                <button
                  type="button"
                  onClick={downloadPurchasesTemplate}
                  className="flex items-center gap-1.5 text-purple-600 dark:text-purple-300 hover:underline font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Şablon İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Mal Alım Sütun Eşlemesi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dönem: <strong>{periodMonth}</strong> | {parsedData.rows.length} satır tespit edildi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alım Tarihi
                  </label>
                  <select
                    value={mapping.purchaseDate}
                    onChange={e => setMapping({ ...mapping, purchaseDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tedarikçi Firma Adı *
                  </label>
                  <select
                    value={mapping.supplierName}
                    onChange={e => setMapping({ ...mapping, supplierName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ürün Kodu (SKU) *
                  </label>
                  <select
                    value={mapping.productCode}
                    onChange={e => setMapping({ ...mapping, productCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ürün Adı *
                  </label>
                  <select
                    value={mapping.productName}
                    onChange={e => setMapping({ ...mapping, productName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alınan Adet *
                  </label>
                  <select
                    value={mapping.quantity}
                    onChange={e => setMapping({ ...mapping, quantity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Birim Alış Maliyeti (TL) *
                  </label>
                  <select
                    value={mapping.unitCost}
                    onChange={e => setMapping({ ...mapping, unitCost: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Önizleme ({periodMonth} Dönemi)
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Tarih</th>
                      <th className="p-2.5">Tedarikçi</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Ürün Adı</th>
                      <th className="p-2.5 text-right">Adet</th>
                      <th className="p-2.5 text-right">Birim Alış</th>
                      <th className="p-2.5 text-right">Toplam Fatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewItems.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-500">{p.purchaseDate}</td>
                        <td className="p-2.5 text-teal-600 dark:text-teal-300 font-medium">{p.supplierName}</td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{p.productCode}</td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium">{p.productName}</td>
                        <td className="p-2.5 text-right font-bold text-purple-600 dark:text-purple-300 font-mono-num">{p.quantity}</td>
                        <td className="p-2.5 text-right font-mono-num">{p.unitCost.toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white font-mono-num">{p.totalCost.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{parsedData?.rows.length}</strong> adet mal alım kaydı stoğa ve maliyet havuzuna eklenecektir.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={() => {
              if (step === 'mapping') setStep('upload');
              else if (step === 'preview') setStep('mapping');
              else onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            {step === 'upload' ? 'İptal' : 'Geri'}
          </button>

          {step === 'mapping' && (
            <button
              onClick={() => {
                if (!mapping.productCode || !mapping.quantity || !mapping.unitCost) {
                  setError('Lütfen en az Ürün Kodu, Alınan Adet ve Birim Alış Maliyeti sütunlarını eşleyin.');
                  return;
                }
                setError(null);
                setStep('preview');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Önizlemeye Geç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleFinalizeImport}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mal Alımlarını Stoğa Ekle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
