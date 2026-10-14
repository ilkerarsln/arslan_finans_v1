import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Receipt,
  User,
  Link2
} from 'lucide-react';
import { SaleRecord } from '../../types/karTakip';

interface SalesTableProps {
  onOpenProductMatch?: (item: {
    sourceProductCode: string;
    sourceProductName?: string;
    currentSalePrice?: number;
    periodMonth?: string;
    salesRep?: string;
    saleRecordId?: string;
  }) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ onOpenProductMatch }) => {
  const { filteredSales, deleteSale, updateSingleWholesalePrice, currentUser } = useKarTakip();
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickInputSaleId, setQuickInputSaleId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + pageSize);

  const handleSaveInlinePrice = (sale: SaleRecord) => {
    const val = parseFloat(quickPriceVal);
    if (!val || isNaN(val) || val <= 0) return;
    const period = sale.date ? sale.date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    updateSingleWholesalePrice(
      sale.productCode,
      period,
      val,
      sale.productName,
      sale.category
    );
    setQuickInputSaleId(null);
    setQuickPriceVal('');
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Satış Kayıtları & Kârlılık Matrisi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {filteredSales.length} Satır
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dönemsel toptan maliyetlerle dinamik olarak eşleştirilmiş satış ve marj analizi
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
          <span>Sayfa Başı:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3">Tarih & Fatura</th>
              <th className="py-3 px-3">Satış Personeli</th>
              <th className="py-3 px-3">Ürün & SKU</th>
              <th className="py-3 px-3 text-right">Adet</th>
              <th className="py-3 px-3 text-right">Birim Satış</th>
              <th className="py-3 px-3 text-right">Toplam Ciro</th>
              <th className="py-3 px-3 text-right">Toptan Maliyet</th>
              <th className="py-3 px-3 text-right">Net Kâr</th>
              <th className="py-3 px-3 text-right">Kâr Marjı</th>
              <th className="py-3 px-3 text-center">Durum</th>
              {isAdmin && <th className="py-3 px-2 text-center w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                  Arama ve filtre kriterlerinize uyan satış kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              paginatedSales.map(sale => {
                const isMissingPrice = !sale.hasWholesalePrice;
                const isNegativeProfit = sale.hasWholesalePrice && (sale.profit || 0) < 0;
                const isLowMargin = sale.hasWholesalePrice && (sale.profitMargin || 0) > 0 && (sale.profitMargin || 0) < 15;

                return (
                  <tr
                    key={sale.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isMissingPrice
                        ? 'bg-rose-50/50 dark:bg-rose-950/10'
                        : isNegativeProfit
                        ? 'bg-red-50/50 dark:bg-red-950/15'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{sale.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Receipt className="w-3 h-3 text-slate-400 inline" />
                        <span>{sale.invoiceNo || 'Faturasız'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700/60">
                        <User className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className="truncate max-w-[110px]">{sale.salesRep}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-white truncate" title={sale.productName}>
                          {sale.productName}
                        </span>
                        {sale.matchedViaAlias && (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shrink-0"
                            title={`Toptan katalogdaki ${sale.matchedTargetCode} ile eşleştirildi`}
                          >
                            <Link2 className="w-2.5 h-2.5 text-indigo-500" />
                            Eşleştirildi ({sale.matchedTargetCode})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {sale.productCode}
                        </span>
                        <span>•</span>
                        <span className="truncate">{sale.category}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-slate-200">
                      {sale.quantity}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-mono-num">
                      {formatCurrency(sale.unitSalePrice)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono-num">
                      {formatCurrency(sale.totalSalePrice)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {sale.hasWholesalePrice && sale.matchedWholesalePrice ? (
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-300 font-mono-num">
                            {formatCurrency(sale.matchedWholesalePrice * sale.quantity)}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] ml-auto">
                            ({formatCurrency(sale.matchedWholesalePrice)}/ad{sale.matchedSupplier ? ` • ${sale.matchedSupplier}` : ''})
                          </div>
                        </div>
                      ) : (
                        <div>
                          {quickInputSaleId === sale.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                placeholder="Birim Maliyet"
                                value={quickPriceVal}
                                onChange={e => setQuickPriceVal(e.target.value)}
                                className="w-20 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-1.5 py-1 rounded border border-emerald-500 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlinePrice(sale)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                title="Fiyatı Kaydet"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30">
                                Eksik!
                              </span>

                              {isAdmin && onOpenProductMatch && (
                                <button
                                  onClick={() =>
                                    onOpenProductMatch({
                                      sourceProductCode: sale.productCode,
                                      sourceProductName: sale.productName,
                                      currentSalePrice: sale.unitSalePrice,
                                      periodMonth: sale.date ? sale.date.slice(0, 7) : undefined,
                                      salesRep: sale.salesRep,
                                      saleRecordId: sale.id
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 hover:underline bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded transition-colors"
                                  title="Bu ürünü toptan liste ürünüyle eşleştir"
                                >
                                  <Link2 className="w-2.5 h-2.5 text-indigo-500" />
                                  <span>Eşleştir</span>
                                </button>
                              )}

                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setQuickInputSaleId(sale.id);
                                    setQuickPriceVal('');
                                  }}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                  title="Bu ürünün toptan alış maliyetini hızlıca girin"
                                >
                                  +Fiyat Gir
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-bold font-mono-num">
                      {sale.profit !== null && sale.profit !== undefined ? (
                        <span className={sale.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {formatCurrency(sale.profit)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-medium">
                      {sale.profitMargin !== null && sale.profitMargin !== undefined ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono-num ${
                            sale.profitMargin >= 25
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : sale.profitMargin >= 15
                              ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                              : sale.profitMargin > 0
                              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                              : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          }`}
                        >
                          %{sale.profitMargin.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isMissingPrice ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Toptan Eksik</span>
                        </span>
                      ) : isNegativeProfit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span>Zararına Satış</span>
                        </span>
                      ) : isLowMargin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          <span>Düşük Marj</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span>Kârlı</span>
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Bu satırı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/60">
          <div>
            Toplam {filteredSales.length} kayıttan {startIndex + 1} - {Math.min(startIndex + pageSize, filteredSales.length)} arası gösteriliyor
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-200">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
