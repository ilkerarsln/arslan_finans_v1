import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  ShoppingBag,
  TrendingUp,
  Boxes,
  Layers,
  FileSpreadsheet,
  Building2,
  Users,
  CalendarDays,
  FileBarChart2,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  Coins,
  ArrowRight,
  Command,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PaletteItem {
  id: string;
  category: 'Hızlı Eylemler' | 'Modüllere Git' | 'Cari Hesaplar' | 'Stok Ürünleri' | 'Bankalar & Kasalar';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    openTransactionModal,
    openInstallmentModal,
    openCurrencyConverter,
    setActiveTab,
    exportDataToExcel,
    toggleDarkMode,
    isDarkMode,
    caris,
    stockItems,
    accounts,
  } = useFinance();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Global key listener for Ctrl+K, Cmd+K, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          // open command palette
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, closeCommandPalette]);

  // Items definition
  const allItems: PaletteItem[] = useMemo(() => {
    const actions: PaletteItem[] = [
      {
        id: 'act-income',
        category: 'Hızlı Eylemler',
        title: 'Yeni Gelir / Tahsilat Ekle',
        subtitle: 'Kasaya veya bankaya para girişi kaydet',
        icon: <ArrowDownRight className="w-4 h-4 text-emerald-500" />,
        action: () => {
          closeCommandPalette();
          openTransactionModal({ type: 'Gelir' });
        },
      },
      {
        id: 'act-expense',
        category: 'Hızlı Eylemler',
        title: 'Yeni Gider / Masraf Ekle',
        subtitle: 'Faaliyet, fatura veya tedarikçi harcaması',
        icon: <ArrowUpRight className="w-4 h-4 text-rose-500" />,
        action: () => {
          closeCommandPalette();
          openTransactionModal({ type: 'Gider' });
        },
      },
      {
        id: 'act-purchase',
        category: 'Hızlı Eylemler',
        title: 'Yeni Mal Alımı (Stok & Tedarikçi Borcu)',
        subtitle: 'Kasadan düşmeden vadeli tedarikçi borçlandırması',
        icon: <ShoppingBag className="w-4 h-4 text-amber-500" />,
        action: () => {
          closeCommandPalette();
          openTransactionModal({ type: 'Mal Alımı' });
        },
      },
      {
        id: 'act-sale',
        category: 'Hızlı Eylemler',
        title: 'Yeni Satış & Kâr Takibi',
        subtitle: 'Peşin, kredi kartı veya senetli taksitli satış',
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
        action: () => {
          closeCommandPalette();
          setActiveTab('profit');
        },
      },
      {
        id: 'act-installment',
        category: 'Hızlı Eylemler',
        title: 'Taksitlendir & Vade Planla (30 Günlük Periyot)',
        subtitle: 'Otomatik taksit takvimi oluştur',
        icon: <Layers className="w-4 h-4 text-indigo-500" />,
        action: () => {
          closeCommandPalette();
          openInstallmentModal();
        },
      },
      {
        id: 'act-transfer',
        category: 'Hızlı Eylemler',
        title: 'Hesaplar Arası Virman / Transfer Yap',
        subtitle: 'Kasa ve bankalar arasında bakiye aktar',
        icon: <ArrowRightLeft className="w-4 h-4 text-blue-500" />,
        action: () => {
          closeCommandPalette();
          setActiveTab('accounts');
        },
      },
      {
        id: 'act-fx',
        category: 'Hızlı Eylemler',
        title: 'Canlı Döviz Çevirici & Hesaplayıcı (USD/EUR)',
        subtitle: 'Tedarikçi ve ithalat maliyeti TL karşılığı hesaplama',
        icon: <Coins className="w-4 h-4 text-amber-500" />,
        action: () => {
          closeCommandPalette();
          openCurrencyConverter();
        },
      },
      {
        id: 'act-excel',
        category: 'Hızlı Eylemler',
        title: 'Tüm Mali Raporları Excel İndir (.xlsx)',
        subtitle: '4 sekmeli resmi muhasebe Excel tablosu',
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
        action: () => {
          closeCommandPalette();
          exportDataToExcel();
        },
      },
      {
        id: 'act-theme',
        category: 'Hızlı Eylemler',
        title: isDarkMode ? 'Açık Temaya Geç (Light Mode)' : 'Koyu Temaya Geç (Dark Mode)',
        subtitle: 'Arayüz tema renk modunu değiştir',
        icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />,
        action: () => {
          toggleDarkMode();
          closeCommandPalette();
        },
      },
    ];

    const navigation: PaletteItem[] = [
      {
        id: 'nav-dashboard',
        category: 'Modüllere Git',
        title: 'Genel Bakış (Özet & KPI)',
        icon: <Building2 className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('dashboard');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-profit',
        category: 'Modüllere Git',
        title: 'Kâr Takip (Satışlar & Kârlılık)',
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        action: () => {
          setActiveTab('profit');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-stock',
        category: 'Modüllere Git',
        title: 'Mal Alımı & Stok Yönetimi',
        icon: <Boxes className="w-4 h-4 text-sky-400" />,
        action: () => {
          setActiveTab('stock');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-tx',
        category: 'Modüllere Git',
        title: 'Gelir / Gider Hareketleri (Kasa)',
        icon: <ArrowRightLeft className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('transactions');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-accounts',
        category: 'Modüllere Git',
        title: 'Bankalar & Kasalar & Kredi Kartları',
        icon: <Building2 className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('accounts');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-currents',
        category: 'Modüllere Git',
        title: 'Cari Hesaplar (Müşteri & Tedarikçi)',
        icon: <Users className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('currents');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-upcoming',
        category: 'Modüllere Git',
        title: 'Vade & Ödeme Takvimi',
        icon: <CalendarDays className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('upcoming');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-reports',
        category: 'Modüllere Git',
        title: 'Mali Raporlar & Kategori Dağılımı',
        icon: <FileBarChart2 className="w-4 h-4 text-slate-400" />,
        action: () => {
          setActiveTab('reports');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-definitions',
        category: 'Modüllere Git',
        title: 'Tanımlamalar (Kategori, Marka, Vade Oranları)',
        icon: <SlidersHorizontal className="w-4 h-4 text-amber-400" />,
        action: () => {
          setActiveTab('definitions');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-audit',
        category: 'Modüllere Git',
        title: 'İşlem Denetim Raporu & Onaylar',
        icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
        action: () => {
          setActiveTab('audit');
          closeCommandPalette();
        },
      },
      {
        id: 'nav-users',
        category: 'Modüllere Git',
        title: 'Personel & Rol Yönetimi',
        icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
        action: () => {
          setActiveTab('users');
          closeCommandPalette();
        },
      },
    ];

    const cariItems: PaletteItem[] = caris.map(c => ({
      id: `cari-${c.id}`,
      category: 'Cari Hesaplar',
      title: c.name,
      subtitle: `${c.type} · ${c.city || 'Şehir yok'} · Bakiye: ${formatCurrency(c.balance)}`,
      icon: <Users className="w-4 h-4 text-blue-500" />,
      action: () => {
        setActiveTab('currents');
        closeCommandPalette();
      },
    }));

    const stockList: PaletteItem[] = stockItems.map(s => ({
      id: `stock-${s.id}`,
      category: 'Stok Ürünleri',
      title: s.name,
      subtitle: `${s.category} · ${s.brand || 'Genel'} · Stok: ${s.quantity} Adet · Satış: ${formatCurrency(s.salePrice)}`,
      icon: <Boxes className="w-4 h-4 text-sky-500" />,
      action: () => {
        setActiveTab('stock');
        closeCommandPalette();
      },
    }));

    const accountList: PaletteItem[] = accounts.map(a => ({
      id: `acc-${a.id}`,
      category: 'Bankalar & Kasalar',
      title: a.name,
      subtitle: `${a.type} · Bakiye: ${formatCurrency(a.balance, a.currency)}`,
      icon: <Building2 className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setActiveTab('accounts');
        closeCommandPalette();
      },
    }));

    return [...actions, ...navigation, ...cariItems, ...stockList, ...accountList];
  }, [
    caris,
    stockItems,
    accounts,
    isDarkMode,
    closeCommandPalette,
    openTransactionModal,
    openInstallmentModal,
    openCurrencyConverter,
    setActiveTab,
    exportDataToExcel,
    toggleDarkMode,
  ]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems.filter(i => i.category === 'Hızlı Eylemler' || i.category === 'Modüllere Git');
    }
    const q = query.toLowerCase();
    return allItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allItems, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={closeCommandPalette}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Bir işlem, modül, cari veya ürün arayın... (Örn: Gelir, Bosch, Ahmet, Virman)"
            className="w-full bg-transparent text-sm font-medium placeholder-slate-400 outline-none text-slate-900 dark:text-white"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              "{query}" ile eşleşen işlem veya kayıt bulunamadı.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-900/60'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ ile gezin</span>
            <span>↵ ile seç</span>
          </div>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Hızlı Komut Paleti
          </span>
        </div>
      </div>
    </div>
  );
};
