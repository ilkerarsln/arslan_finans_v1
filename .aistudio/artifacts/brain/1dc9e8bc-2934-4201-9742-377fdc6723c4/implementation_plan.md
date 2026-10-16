# Sol Menü Düzeltmeleri ve Koyu Tema (Dark Mode) Görsel İyileştirme Planı

Bu plan, kullanıcının talepleri doğrultusunda sol menüdeki gereksiz kelimelerin ve etiketlerin temizlenmesi, rozetlerin kaldırılması ve Tanımlamalar başta olmak üzere tüm ekranların derin koyu tema (Slate-950) paletine tam uyumlu hale getirilmesini kapsar.

## Kullanıcı Tercihleri ve Doğrulamalar
- **Koyu Tema:** Derin koyu tema (Slate-950 taban, koyu cam efektli paneller, zümrüt ve indigo vurgular).
- **Menü Öğeleri:**
  - `Cari Hesaplar & Tedarikçiler` → **`Cari Hesaplar`**
  - `Tanımlamalar & 3 Seviyeli Kategori` → **`Tanımlamalar`**
- **Rozetler (Badges):** Menü elemanlarında görsel karmaşayı ve taşmayı önlemek için rozetler kaldırılacak; temiz ikon ve tek satır başlık yapısı uygulanacak.

---

## 1. Sol Menü (Sidebar) Sadeleştirme & Tipografi Hizalama
- **Dosya:** `src/components/layout/Sidebar.tsx`
- **Değişiklikler:**
  - `Cari Hesaplar & Tedarikçiler` başlığını `Cari Hesaplar` olarak güncelle.
  - `Tanımlamalar & 3 Seviyeli Kategori` başlığını `Tanımlamalar` olarak sadeleştir.
  - Menü maddelerindeki taşma riski oluşturan badge/rozet alanlarını kaldır.
  - İkon ile metin arasındaki dikey ve yatay hizalamayı (`flex items-center gap-3`) optimize et; aktif menü öğesinde `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20` veya `indigo` vurgulu zarif durum uygula.

## 2. Üst Bar (Header) ve Başlık Metinleri Uyumu
- **Dosya:** `src/components/layout/Header.tsx`
- **Değişiklikler:**
  - `TAB_TITLES` içindeki `currents` başlığını `"Cari Hesaplar"` ve alt başlığını `"Müşteri ve tedarikçi cari hesap ekstreleri, bakiye takibi"` olarak güncelle.
  - `definitions` başlığını `"Tanımlamalar & Kategori Yönetimi"` olarak netleştir.

## 3. Tanımlamalar Ekranı (DefinitionsTab) Koyu Tema Düzeltmesi
- **Dosya:** `src/components/tabs/DefinitionsTab.tsx`
- **Sorun:** Eski açık tema kalıntıları (`bg-white`, `bg-slate-100`, `text-slate-800`, `border-slate-200`) koyu temada renk çakışmalarına ve okunabilirlik bozukluklarına neden oluyordu.
- **Değişiklikler:**
  - Tüm panelleri tutarlı koyu palete geçir: `bg-slate-900/60`, `border-slate-800`, `text-slate-100/slate-300`.
  - Alt sekme butonlarını (Hiyerarşi, Fiyat Listeleri, Markalar, vb.) şık ve yüksek kontrastlı koyu butonlara dönüştür.
  - Akordeon ağaç (`FolderTree`) ve sağdaki veri tablosunda buton kontrastlarını güçlendir; silme (`hover:bg-rose-950/60 text-rose-400`) ve düzenleme butonlarını netleştir.

## 4. Doğrulama ve Test
- `lint_applet` ile TypeScript ve JSX sözdizim denetimi.
- `compile_applet` ile Vite derleme testi.
- Sol menü genişliği, responsive daraltma ve kontrast kontrolü.
