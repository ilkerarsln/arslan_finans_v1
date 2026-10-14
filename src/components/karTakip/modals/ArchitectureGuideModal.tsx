import React, { useState } from 'react';
import {
  X,
  Database,
  Layers,
  Server,
  Code2,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'database' | 'flow' | 'security'>('stack');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const postgresDDL = `-- 1. KULLANICILAR VE ROLLER (RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'SALES_REP')),
    sales_rep_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. TEDARİKÇİLER (SUPPLIERS)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    city VARCHAR(100),
    payment_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ÜRÜN & SKU KATALOĞU
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    primary_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AYLIK DÖNEMSEL TOPTAN LİSTE FİYATLARI
CREATE TABLE monthly_wholesale_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL,
    wholesale_cost NUMERIC(12, 2) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_period UNIQUE (product_sku, period_month)
);

-- 5. SATIŞ İŞLEM KAYITLARI
CREATE TABLE sales_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100),
    sales_rep_name VARCHAR(150) NOT NULL,
    sale_date DATE NOT NULL,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_sale_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    total_sale_price NUMERIC(12, 2) NOT NULL,
    customer_name VARCHAR(255),
    costing_method_used VARCHAR(50) DEFAULT 'CATALOG_PRICE',
    matched_wholesale_cost NUMERIC(12, 2),
    profit NUMERIC(12, 2),
    profit_margin_percent NUMERIC(5, 2),
    is_cost_missing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Sistem Mimarisi, Teknoloji Yığını ve Veritabanı Şeması
                </h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Mimari Rehberi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Excel satış & kâr takip sisteminin mimari tasarımı ve PostgreSQL şeması
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

        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'stack' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Teknoloji Yığını</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'database' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Veritabanı Şeması (DDL)</span>
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Kâr Hesaplama Algoritması</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rol & Güvenlik (RBAC)</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'stack' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ön Yüz (Frontend)</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li><strong>React 19 + TypeScript:</strong> Tip güvenliği ve reaktif hesaplamalar.</li>
                    <li><strong>Tailwind CSS v4:</strong> Hızlı, modern ve şık arayüz tasarımı.</li>
                    <li><strong>SheetJS (xlsx):</strong> İstemci tarafında hızlı .xlsx / .csv ayrıştırma ve şablon oluşturma.</li>
                    <li><strong>Lucide React:</strong> Kurumsal ve minimalist ikon seti.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Veritabanı & Senkronizasyon</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li><strong>Firebase Firestore:</strong> Gerçek zamanlı çoklu cihaz ve ofis senkronizasyonu.</li>
                    <li><strong>PostgreSQL Uyumluluğu:</strong> İsteğe bağlı Cloud SQL / Supabase bağlantısı.</li>
                    <li><strong>Local Caching:</strong> Çevrimdışı ve anlık tepki süresi.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  İlişkisel Veritabanı Şeması (PostgreSQL DDL)
                </h3>
                <button
                  onClick={() => copyToClipboard(postgresDDL, 'ddl')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'ddl' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>SQL Kopyala</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto font-mono text-[11px] text-emerald-300 leading-relaxed max-h-96">
                <pre>{postgresDDL}</pre>
              </div>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  1. Satış Tarihinden Dönem Çıkarımı
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Satış kaydının tarihi ayrıştırılarak geçerli dönem kodu (Örn: 2024-05) elde edilir.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  2. Dönemsel Toptan Fiyat Listesinde Arama
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Ürün kodu veya tanımlı ürün eşleştirme kuralları üzerinden o dönemin toptan maliyeti bulunur.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  3. Net Brüt Kâr & Marj Hesaplama
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Net Kâr = Toplam Satış - (Birim Maliyet × Adet)<br />
                  Kâr Marjı % = (Net Kâr / Toplam Satış) × 100
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 dark:bg-slate-950/60 border border-amber-200 dark:border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Yönetici (ADMIN) Yetkileri</span>
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>Tüm satış personellerinin cirolarını ve kârlarını görme.</li>
                  <li>Excel ile yeni satış raporları ve toptan listeler yükleme.</li>
                  <li>Eksik fiyatlı ürünler için tek tıkla maliyet belirleme.</li>
                  <li>Dönem kilitleme ve onay mekanizması yönetimi.</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50/50 dark:bg-slate-950/60 border border-blue-200 dark:border-cyan-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-cyan-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Satış Temsilcisi (SALES_REP) Yetkileri</span>
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>Yalnızca kendisine ait satış kayıtlarını ve kârını görme.</li>
                  <li>Diğer temsilcilerin satış veya müşteri bilgilerine erişememe.</li>
                  <li>Kendi satışlarında eksik toptan maliyet uyarılarını takip etme.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Arslan Finans & KarTakip Entegrasyon Spesifikasyonu
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
