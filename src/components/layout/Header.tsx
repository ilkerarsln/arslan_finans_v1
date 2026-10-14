import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, FileSpreadsheet, Shield, Calendar, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, navigateToPurchase, currentUser } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Finansal Genel Bakış', subtitle: 'Şirket nakit akışı, tedarikçi borçları ve kâr özeti' };
      case 'mal_alim_stok':
        return { title: 'Mal Alım & Stok Yönetimi', subtitle: 'Ortak tedarikçilerden mal alımları, cari borç ve envanter' };
      case 'detayli_stok':
        return { title: 'Detaylı Stok & Envanter Yönetimi', subtitle: 'Kategori, alt kategori, marka ve ortak tedarikçi alanlarıyla ürün yönetimi' };
      case 'kar_takip':
        return { title: 'Kâr Takip & Satış Analizi', subtitle: 'Satış şekli, senetli vade farkı maliyeti ve personel bazlı net kârlılık' };
      case 'cari_hesaplar':
        return { title: 'Cari Hesaplar (Ortak Veritabanı)', subtitle: 'Tedarikçi ve müşteri borç/alacak bakiyeleri ve ekstreler' };
      case 'kasa_banka':
        return { title: 'Kasa & Banka Hesapları', subtitle: 'Nakit kasa, ticari banka ve POS hesap hareketleri' };
      case 'masraflar':
        return { title: 'Gider & Masraf Takibi', subtitle: 'Kira, personel maaşı, lojistik ve genel işletme masrafları' };
      case 'aylik_takip':
        return { title: 'Aylık Takip & Finansal Tablo', subtitle: 'Aylık ciro, maliyet, brüt/net kâr ve gider dökümü' };
      case 'urun_eslestirme':
        return { title: 'Ürün Eşleştirme Mekanizması', subtitle: 'Satış ürünleri ile tedarikçi kodları & maliyet eşleştirme' };
      case 'tanimlamalar':
        return { title: 'Sistem Tanımlamaları', subtitle: 'Kategoriler, alt kategoriler, markalar ve aylık vade farkı oranları' };
      case 'raporlar':
        return { title: 'Raporlar & Analizler', subtitle: 'Kategori, ürün ve tedarikçi performans grafikleri' };
      case 'kullanicilar':
        return { title: 'Kullanıcılar & Yetkiler', subtitle: 'Yönetici hesabı üzerinden kullanıcı ekleme ve yetkilendirme' };
      default:
        return { title: 'Arslan Mobilya ERP', subtitle: 'Entegre Yönetim Sistemi' };
    }
  };

  const info = getTitle();
  const todayStr = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date());

  return (
    <header className="h-18 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-bold text-white tracking-tight">{info.title}</h1>
        <p className="text-xs text-slate-400">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{todayStr}</span>
        </div>

        {/* Global Action: Excel ile Mal Alımı */}
        <button
          onClick={() => navigateToPurchase('excel')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer active:scale-95"
          title="Toplu Excel ile Mal Alımı"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Excel Alımı</span>
        </button>

        {/* Global Action: Mal Alımı Yap (Highlighted Core Requirement) */}
        <button
          onClick={() => navigateToPurchase('manuel')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-semibold shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5 stroke-[2.3]" />
          <span>Mal Alımı Yap</span>
        </button>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <Shield className="w-3 h-3" />
            <span className="capitalize">{currentUser?.role === 'admin' ? 'Yönetici (Admin)' : 'Personel'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
