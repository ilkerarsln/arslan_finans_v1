import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import { useFinance } from '../../context/FinanceContext';
import { KPICards } from '../karTakip/KPICards';
import { AnalyticsOverview } from '../karTakip/AnalyticsOverview';
import { FilterBar } from '../karTakip/FilterBar';
import { SalesTable } from '../karTakip/SalesTable';
import { MonthlyTrackingView } from '../karTakip/MonthlyTrackingView';
import { SuppliersView } from '../karTakip/SuppliersView';
import { PurchasesInventoryView } from '../karTakip/PurchasesInventoryView';
import { PersonnelAnalysis } from '../karTakip/PersonnelAnalysis';
import { WholesaleCatalogView } from '../karTakip/WholesaleCatalogView';
import { AlertsCenterModal } from '../karTakip/modals/AlertsCenterModal';
import { SalesUploadModal } from '../karTakip/modals/SalesUploadModal';
import { WholesaleUploadModal } from '../karTakip/modals/WholesaleUploadModal';
import { PurchaseUploadModal } from '../karTakip/modals/PurchaseUploadModal';
import { ProductMatchModal, ProductMatchTarget } from '../karTakip/modals/ProductMatchModal';
import { ArchitectureGuideModal } from '../karTakip/modals/ArchitectureGuideModal';
import {
  TrendingUp,
  Calendar,
  Building2,
  Package,
  Users,
  Layers,
  AlertTriangle,
  Upload,
  Link2,
  Code2,
  SlidersHorizontal,
  Plus
} from 'lucide-react';

export type KarTakipSubTab = 'sales' | 'monthly' | 'suppliers' | 'inventory' | 'personnel' | 'wholesale';

export const KarTakipTab: React.FC = () => {
  const { alerts, costingMethod, setCostingMethod, setFilters, productAliasMappings } = useKarTakip();
  const { isAdmin } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<KarTakipSubTab>('sales');

  // Modals state
  const [showSalesUpload, setShowSalesUpload] = useState(false);
  const [showWholesaleUpload, setShowWholesaleUpload] = useState(false);
  const [showPurchaseUpload, setShowPurchaseUpload] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showProductMatch, setShowProductMatch] = useState(false);
  const [productMatchTarget, setProductMatchTarget] = useState<ProductMatchTarget | null>(null);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const handleOpenProductMatch = (item: ProductMatchTarget) => {
    setProductMatchTarget(item);
    setShowProductMatch(true);
  };

  const handleSelectRepFromPersonnel = (repName: string) => {
    setFilters({ selectedSalesRep: repName });
    setActiveSubTab('sales');
  };

  const subNavItems: { id: KarTakipSubTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'sales', label: 'Satış & Kâr Analizi', icon: TrendingUp },
    { id: 'monthly', label: 'Aylık Takip & Kapanış', icon: Calendar },
    { id: 'suppliers', label: 'Tedarikçiler', icon: Building2 },
    { id: 'inventory', label: 'Mal Alım & Stok', icon: Package },
    { id: 'personnel', label: 'Personel Performansı', icon: Users },
    { id: 'wholesale', label: 'Toptan Liste Arşivi', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/90 border border-slate-700/80 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Arslan Finans • Kâr & Satış Portalı
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
            Satış Raporları, Kâr Marjı ve Toptan Fiyat Yönetimi
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Excel satış listelerini yükleyin, dönemsel toptan alış maliyetleriyle otomatik eşleyin, eksik fiyat ve zararına satış uyarılarını anında tespit edin.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Costing Engine Selector */}
          <button
            onClick={() =>
              setCostingMethod(
                costingMethod === 'CATALOG_PRICE' ? 'PURCHASE_AVG' : 'CATALOG_PRICE'
              )
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              costingMethod === 'PURCHASE_AVG'
                ? 'bg-purple-950/60 border-purple-600 text-purple-200'
                : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
            title="Kârlılık hesaplama yöntemini değiştirin"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {costingMethod === 'PURCHASE_AVG' ? 'Yöntem: Fiili Alım (WAC)' : 'Yöntem: Liste Fiyatı'}
            </span>
          </button>

          {/* Alert Center Trigger */}
          <button
            onClick={() => setShowAlerts(true)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              criticalCount > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40 animate-pulse'
                : alerts.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Kritik Fiyat Uyarıları ve Eksik Toptan Fiyatlar"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Uyarılar</span>
            {alerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-slate-900 font-bold">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Upload and Tools */}
          {isAdmin && (
            <>
              <button
                onClick={() => setShowSalesUpload(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Satış Yükle (Excel)</span>
              </button>

              <button
                onClick={() => handleOpenProductMatch({ sourceProductCode: '', sourceProductName: '' })}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="Satış raporundaki ürünleri toptan liste ürünleriyle kalıcı eşleştirin"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Ürün Eşleştir</span>
                {productAliasMappings.length > 0 && (
                  <span className="text-[10px] bg-indigo-800 text-indigo-200 px-1.5 py-0.2 rounded-full">
                    {productAliasMappings.length}
                  </span>
                )}
              </button>
            </>
          )}

          <button
            onClick={() => setShowArchitecture(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Mimari Tasarım & PostgreSQL Şeması"
          >
            <Code2 className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {subNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: Satış & Kâr Analizi */}
      {activeSubTab === 'sales' && (
        <div className="space-y-4">
          <KPICards onOpenAlerts={() => setShowAlerts(true)} />
          <AnalyticsOverview onOpenAlerts={() => setShowAlerts(true)} />
          <FilterBar />
          <SalesTable onOpenProductMatch={handleOpenProductMatch} />
        </div>
      )}

      {/* SUB-VIEW 2: Aylık Takip & Kapanış */}
      {activeSubTab === 'monthly' && (
        <div>
          <MonthlyTrackingView onOpenPeriodUpload={() => setShowSalesUpload(true)} />
        </div>
      )}

      {/* SUB-VIEW 3: Tedarikçiler & Alışlar */}
      {activeSubTab === 'suppliers' && (
        <div>
          <SuppliersView
            onOpenWholesaleUpload={() => setShowWholesaleUpload(true)}
            onOpenPurchaseModal={() => setShowPurchaseUpload(true)}
          />
        </div>
      )}

      {/* SUB-VIEW 4: Mal Alım & Stok */}
      {activeSubTab === 'inventory' && (
        <div>
          <PurchasesInventoryView onOpenPurchaseUpload={() => setShowPurchaseUpload(true)} />
        </div>
      )}

      {/* SUB-VIEW 5: Personel Performansı */}
      {activeSubTab === 'personnel' && (
        <div className="space-y-6">
          <PersonnelAnalysis onSelectRep={handleSelectRepFromPersonnel} />
          <div className="pt-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Personel Satış Hareketleri Detayı
            </h3>
            <FilterBar />
            <SalesTable onOpenProductMatch={handleOpenProductMatch} />
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: Toptan Liste Arşivi */}
      {activeSubTab === 'wholesale' && (
        <div>
          <WholesaleCatalogView onOpenUpload={() => setShowWholesaleUpload(true)} />
        </div>
      )}

      {/* KarTakip Modals */}
      <SalesUploadModal
        isOpen={showSalesUpload}
        onClose={() => setShowSalesUpload(false)}
      />

      <WholesaleUploadModal
        isOpen={showWholesaleUpload}
        onClose={() => setShowWholesaleUpload(false)}
      />

      <PurchaseUploadModal
        isOpen={showPurchaseUpload}
        onClose={() => setShowPurchaseUpload(false)}
      />

      <AlertsCenterModal
        isOpen={showAlerts}
        onClose={() => setShowAlerts(false)}
        onOpenProductMatch={handleOpenProductMatch}
      />

      <ProductMatchModal
        isOpen={showProductMatch}
        onClose={() => setShowProductMatch(false)}
        targetItem={productMatchTarget}
      />

      <ArchitectureGuideModal
        isOpen={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />
    </div>
  );
};
