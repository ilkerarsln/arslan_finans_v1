import React, { useState, useRef } from 'react';
import { useKarTakip } from '../../../context/KarTakipContext';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  ArrowRight
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  autoGuessSalesMapping,
  convertRowsToSales,
  downloadSalesTemplate,
  ParsedSheetData
} from '../../../utils/karTakipExcelParser';
import { ColumnMapping } from '../../../types/karTakip';

interface SalesUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesUploadModal: React.FC<SalesUploadModalProps> = ({ isOpen, onClose }) => {
  const { addSales, productAliasMappings } = useKarTakip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    salesRep: '',
    date: '',
    productCode: '',
    productName: '',
    category: '',
    quantity: '',
    unitSalePrice: '',
    discountPercent: '',
    totalSalePrice: '',
    customerName: '',
    invoiceNo: ''
  });
  const [replaceExisting, setReplaceExisting] = useState(false);

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
      const guessed = autoGuessSalesMapping(data.headers);
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
      const convertedSales = convertRowsToSales(parsedData.rows, mapping, productAliasMappings);
      if (convertedSales.length === 0) {
        throw new Error('Aktarılacak geçerli satış satırı bulunamadı.');
      }
      addSales(convertedSales, replaceExisting);
      onClose();
      setStep('upload');
      setParsedData(null);
    } catch (err: any) {
      setError(err.message || 'Satış kayıtları aktarılırken hata oluştu.');
    }
  };

  const previewSales = parsedData ? convertRowsToSales(parsedData.rows.slice(0, 5), mapping, productAliasMappings) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Satış Raporu Yükleme (.xlsx, .xls, .csv)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Excel satış tablonuzu sisteme yükleyip sütunları eşleyerek kârlılık analizine dahil edin
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
            step === 'upload' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'upload' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span>Dosya Seç</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-1.5 font-medium ${
            step === 'mapping' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'mapping' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span>Sütun Eşleme</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-1.5 font-medium ${
            step === 'preview' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'preview' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
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
            <div className="space-y-6">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-950/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Excel veya CSV Dosyasını Buraya Sürükleyin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                  .xlsx, .xls veya .csv formatındaki satış listelerinizi doğrudan içeri aktarabilirsiniz
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {loading ? 'Dosya Okunuyor...' : 'Bilgisayardan Dosya Seç'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Formatı tam bilmiyor musunuz?</div>
                    <div className="text-[11px] text-slate-400">
                      Sistemin tanıdığı örnek sütun başlıklarını içeren hazır şablonu indirin.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSalesTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-emerald-600 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Örnek Şablon (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && parsedData && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Sütun Eşleme Sihirbazı
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dosyanızdaki sütun başlıkları sistemdeki alanlarla otomatik eşleştirildi.
                  </p>
                </div>
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                  {parsedData.rows.length} Satır Tespit Edildi
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Satış Temsilcisi / Personel Adı *
                  </label>
                  <select
                    value={mapping.salesRep}
                    onChange={e => setMapping({ ...mapping, salesRep: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Satış Tarihi *
                  </label>
                  <select
                    value={mapping.date}
                    onChange={e => setMapping({ ...mapping, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ürün Kodu (SKU / Barkod) *
                  </label>
                  <select
                    value={mapping.productCode}
                    onChange={e => setMapping({ ...mapping, productCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ürün Adı / Açıklama *
                  </label>
                  <select
                    value={mapping.productName}
                    onChange={e => setMapping({ ...mapping, productName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Miktar / Adet *
                  </label>
                  <select
                    value={mapping.quantity}
                    onChange={e => setMapping({ ...mapping, quantity: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Toplam Satış Tutarı / Ciro (TL) *
                  </label>
                  <select
                    value={mapping.totalSalePrice}
                    onChange={e => setMapping({ ...mapping, totalSalePrice: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sütun Seçin --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={e => setReplaceExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                  <span>
                    Mevcut satış kayıtlarını silip tamamen bu dosyayla değiştir
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  İçeri Aktarılacak Veri Önizlemesi (İlk 5 Satır)
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Temsilci</th>
                      <th className="p-2.5">Tarih</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Ürün</th>
                      <th className="p-2.5">Adet</th>
                      <th className="p-2.5">Birim Fiyat</th>
                      <th className="p-2.5">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewSales.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-cyan-600 dark:text-cyan-300 font-medium">{s.salesRep}</td>
                        <td className="p-2.5 text-slate-500">{s.date}</td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{s.productCode}</td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium">{s.productName}</td>
                        <td className="p-2.5">{s.quantity}</td>
                        <td className="p-2.5 font-mono-num">{s.unitSalePrice.toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono-num">{s.totalSalePrice.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Toplam <strong>{parsedData?.rows.length}</strong> satış kaydı sisteme aktarılmaya hazır.
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
                if (!mapping.salesRep || !mapping.productCode || !mapping.totalSalePrice) {
                  setError('Lütfen en az Satış Temsilcisi, Ürün Kodu ve Toplam Satış Tutarı sütunlarını eşleyin.');
                  return;
                }
                setError(null);
                setStep('preview');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Önizlemeye Geç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleFinalizeImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verileri Sisteme Aktar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
