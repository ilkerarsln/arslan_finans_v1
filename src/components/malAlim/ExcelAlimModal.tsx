import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  downloadPurchaseExcelTemplate,
  parsePurchaseExcel,
  ParsedPurchaseRow,
} from '../../utils/excelHelper';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Package,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelAlimModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { suppliers, createBulkPurchasesFromExcel } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPurchaseRow[]>([]);
  const [parseError, setParseError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError('');

    try {
      const rows = await parsePurchaseExcel(file, suppliers);
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Dosya okuma sırasında hata oluştu.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const totalImportAmount = validRows.reduce((sum, r) => sum + r.totalPrice, 0);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;
    createBulkPurchasesFromExcel(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Excel ile Toplu Mal Alımı & Cari Borçlandırma</h3>
              <p className="text-xs text-slate-400">
                Excel dosyanızdaki satırlar ilgili tedarikçilerin cari hesaplarına borç ve ürünlerin stoklarına otomatik işlenir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Info & Download Template Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" />
                <span>Hazır Excel Şablonunu İndirin</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Kolon sıralaması: Tedarikçi Adı/Kodu, Fatura No, Tarih, Ürün SKU, Ürün Adı, Kategori, Miktar, Birim Alış Fiyatı.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadPurchaseExcelTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Örnek Excel Şablonunu İndir (.xlsx)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-semibold text-white mb-1">
              {selectedFile ? selectedFile.name : 'Excel Dosyasını Buraya Sürükleyin veya Seçin'}
            </h5>
            <p className="text-xs text-slate-500">.xlsx, .xls veya .csv formatında dosyalar desteklenir</p>
          </div>

          {parseError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{parseError}</span>
            </div>
          )}

          {isParsing && (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Excel satırları ayrıştırılıyor ve ortak tedarikçiler ile eşleştiriliyor...</span>
            </div>
          )}

          {/* Parsed Results Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-slate-300">
                    Toplam Okunan: <strong>{parsedRows.length} Satır</strong>
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validRows.length} Geçerli Satır
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> {invalidRows.length} Hatalı Satır
                    </span>
                  )}
                </div>
                <div className="text-amber-400 font-bold text-sm">
                  Cari Borca İşlenecek Toplam: {formatCurrency(totalImportAmount)}
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Durum</th>
                      <th className="py-2.5 px-3">Tedarikçi</th>
                      <th className="py-2.5 px-3">Fatura No</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Ürün Adı</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Miktar</th>
                      <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-right">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`transition ${
                          r.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20 text-rose-300'
                        }`}
                      >
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hazır
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium"
                              title={r.errors.join(' | ')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Hata
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-white">
                          {r.matchedSupplier ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-amber-400" />
                              <span>{r.matchedSupplier.name}</span>
                            </div>
                          ) : (
                            <span className="text-rose-400 italic">Eşleşmedi ({r.supplierCodeOrName})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{r.invoiceNo}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{r.sku}</td>
                        <td className="py-2 px-3 text-white font-medium">{r.productName}</td>
                        <td className="py-2 px-3 text-slate-400">{r.category}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{formatNumber(r.quantity)}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{formatCurrency(r.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                          {formatCurrency(r.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invalidRows.length > 0 && (
                <p className="text-[11px] text-amber-400/90 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                  * Sistemde kayıtlı olmayan tedarikçi veya eksik ürün adı olan satırlar içe aktarılmaz. Yalnızca geçerli satırlar işlenecektir.
                </p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validRows.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>{validRows.length} Kalemi Onayla ve Cari Borçlara İşle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
