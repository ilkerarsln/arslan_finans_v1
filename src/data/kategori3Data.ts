import {
  CategoryDefinition,
  SubCategoryDefinition,
  BrandDefinition,
  Supplier,
  Product,
  SaleItem,
  PurchaseOrder,
  PriceListItem,
} from '../types';

export const KATEGORI_3_RAW_LIST = [
  {
    category: 'BAMBİ',
    brand: 'BAMBİ',
    supplierId: 'sup-bambi',
    supplierName: 'Bambi Yatak & Baza San. A.Ş.',
    subCategories: [
      { name: 'BAMBİ BASLIK', prefix: 'BAS', cost: 3400, price: 5400, sampleNames: ['Royal Krem 160cm Başlık', 'Magnasand Terapi 150cm Başlık', 'Elegance Kapitone 180cm Başlık'] },
      { name: 'BAMBİ BAZA', prefix: 'BAZ', cost: 6800, price: 10800, sampleNames: ['Royal Sandıklı Çelik Baza 160x200', 'Magnasand Çift Kişilik Baza 150x200', 'Clima Naturel Tek Kişilik Baza 90x190'] },
      { name: 'BAMBİ BHC MOB', prefix: 'BHC', cost: 8500, price: 13500, sampleNames: ['Bahçe & Balkon Rattan Oturma Köşesi', 'Alüminyum İskelet Bahçe Masa Sandalye Seti', 'Salıncaklı Bahçe Dinlenme Koltuğu'] },
      { name: 'BAMBİ EV TEKS', prefix: 'TEK', cost: 950, price: 1750, sampleNames: ['Pamuk Saten Çift Kişilik Nevresim Takımı', 'Anti-Alerjik Microfiber Yorgan 195x215', 'Silikon Elyaf Ortopedik Yastık Çifti'] },
      { name: 'BAMBİ KOMODIN', prefix: 'KOM', cost: 1600, price: 2650, sampleNames: ['Royal 2 Çekmeceli Ceviz Komodin', 'Magnasand Antrasit Kumaş Kaplı Komodin', 'Modern Ahşap Ayaklı Beyaz Komodin'] },
      { name: 'BAMBİ OTEL BASLIK', prefix: 'OBAS', cost: 2800, price: 4500, sampleNames: ['Otel Serisi Yangına Dayanıklı Tekli Başlık 100cm', 'Otel Serisi Deri Kapitone Çiftli Başlık 160cm', 'Otel Lüks Süit Ahşap Panel Başlık 180cm'] },
      { name: 'BAMBİ OTEL BAZA', prefix: 'OBAZ', cost: 5200, price: 8200, sampleNames: ['Otel Serisi Sabit İskelet Baza 100x200', 'Otel Ağır Hizmet Çelik Baza 160x200', 'Otel Süit Baza Yanmaz Kumaş 180x200'] },
      { name: 'BAMBİ OTEL KOMODIN', prefix: 'OKOM', cost: 1400, price: 2300, sampleNames: ['Otel Standart Mini Bar Uyumlu Komodin', 'Otel Ahşap Şarj Üniteli Komodin', 'Otel Kompakt Duvara Monte Askılı Komodin'] },
      { name: 'BAMBİ OTEL YATAK', prefix: 'OYTK', cost: 6500, price: 10500, sampleNames: ['Otel Serisi Pocket Yaylı Yatak 100x200', 'Otel Lüks Full Ortopedik Yatak 160x200', 'Otel Kral Dairesi Visco Jel Yatak 180x200'] },
      { name: 'BAMBİ TV KLTK', prefix: 'TVK', cost: 7200, price: 11900, sampleNames: ['Mekanizmalı Baba Koltuğu Hakiki Kumaş', 'Motorlu Masajlı Recliner TV Koltuğu', 'Sallanır ve Döner Dinlenme Koltuğu'] },
      { name: 'BAMBİ YATAK', prefix: 'YTK', cost: 7900, price: 12800, sampleNames: ['Magnasand Therapy Manyetik Yatak 160x200', 'Clima Naturel Fresh Yatak 150x200', 'Borjen Bor Mineralli Ortopedik Yatak 160x200'] },
      { name: 'BAMBİ YATAK BEBE', prefix: 'BBY', cost: 1800, price: 3100, sampleNames: ['Baby Cotton Doğal Pamuk Bebek Yatağı 70x130', 'Lateks Destekli Nefes Alabilir Bebek Yatağı 60x120', 'Anti-Reflü Bebek Beşik Yatağı 80x140'] },
      { name: 'BAMBİ YTK AKS', prefix: 'YAKS', cost: 450, price: 890, sampleNames: ['Sıvı Geçirmez Fitted Yatak Alezi 160x200', 'Bambu Elyaf Yastık Koruyucu Kılıf Seti', 'Visco Destekli Boyun Yastığı'] },
    ],
  },
  {
    category: 'ALTUS',
    brand: 'ALTUS',
    supplierId: 'sup-altus',
    supplierName: 'Altus & Arçelik Pazarlama A.Ş.',
    subCategories: [
      { name: 'ALTUS ANKASTRE DAVLUMBAZLAR', prefix: 'DAVL', cost: 3800, price: 5900, sampleNames: ['ALA 142 B Siyah Eğimli Cam Davlumbaz 60cm', 'ALA 138 W Beyaz Piramit Davlumbaz 60cm', 'ALA 160 I Inox Duvar Tipi Dokunmatik Davlumbaz'] },
      { name: 'ALTUS ANKASTRE FIRINLAR', prefix: 'FIRN', cost: 6400, price: 9800, sampleNames: ['ALA 732 B Multifonksiyon Siyah Ankastre Fırın', 'ALA 720 W Turbo Beyaz Ankastre Fırın 65L', 'ALA 750 I Dokunmatik Dijital Inox Fırın'] },
      { name: 'ALTUS ANKASTRE OCAKLAR', prefix: 'OCAK', cost: 3900, price: 6200, sampleNames: ['ALA 540 B 4 Gözü Gazlı Siyah Cam Ocak', 'ALA 520 W Beyaz Gaz Emniyetli Cam Ocak', 'ALA 560 I Inox Wok Gözlü Ankastre Ocak'] },
      { name: 'ALTUS ASPİRATÖR', prefix: 'ASP', cost: 1600, price: 2700, sampleNames: ['ALA 101 B Çift Motorlu Sürgülü Aspiratör', 'ALA 102 W Beyaz Çift Filtreli Aspiratör', 'ALA 105 I Inox Teleskopik Aspiratör'] },
      { name: 'ALTUS BULAŞIK MAKİNELERİ', prefix: 'BUL', cost: 8900, price: 13900, sampleNames: ['AL 434 X 4 Programlı Inox Bulaşık Makinesi', 'AL 445 W 5 Programlı Beyaz Bulaşık Makinesi', 'AL 455 E HijyenMax 6 Programlı Gri Bulaşık Makinesi'] },
      { name: 'ALTUS ÇAMAŞIR MAKİNELERİ', prefix: 'CAM', cost: 10500, price: 16200, sampleNames: ['AL 9103 D 9 kg 1000 Devir Inverter Çamaşır Makinesi', 'AL 10123 X 10 kg 1200 Devir Gri Çamaşır Makinesi', 'AL 8100 8 kg Hızlı Yıkama Beyaz Çamaşır Makinesi'] },
      { name: 'ALTUS ÇEKMECELİ DERİN DONDURUCU', prefix: 'CDON', cost: 9200, price: 14200, sampleNames: ['AL 609 NF 6 Çekmeceli Statik Dondurucu Beyaz', 'AL 709 E 7 Çekmeceli Geniş Hacimli Dondurucu', 'AL 508 5 Çekmeceli Kompakt Dondurucu'] },
      { name: 'ALTUS ÇİFT KAPILI BUZDOLAPLARI', prefix: 'CKBZ', cost: 13500, price: 20500, sampleNames: ['AL 370 415L Çift Kapılı Statik Buzdolabı Beyaz', 'AL 380 X 430L Çift Kapılı Inox Buzdolabı', 'AL 360 W 380L Çift Kapılı Kompakt Buzdolabı'] },
      { name: 'ALTUS ÇİFT KAPILI NF BUZDOLAPLARI', prefix: 'CKNF', cost: 16800, price: 25400, sampleNames: ['AL 480 N 480L No-Frost Geniş Buzdolabı Beyaz', 'AL 490 NX 505L No-Frost Inox Çift Kapılı Dolap', 'AL 470 N 450L No-Frost Çift Kapılı Buzdolabı'] },
      { name: 'ALTUS ISI POMPALI KURUTMA MAKİNELERİ', prefix: 'IPKM', cost: 12800, price: 19400, sampleNames: ['AL 81 IC 8 kg Isı Pompalı A++ Kurutma Makinesi', 'AL 91 IC 9 kg Isı Pompalı Dijital Kurutma Makinesi', 'AL 101 IC 10 kg Geniş Tamburlu Isı Pompalı Kurutma'] },
      { name: 'ALTUS KLİMA', prefix: 'KLM', cost: 14500, price: 22800, sampleNames: ['AL 12000 BTU Inverter A++ Duvar Tipi Klima', 'AL 18000 BTU Hızlı Soğutma Inverter Klima', 'AL 24000 BTU Geniş Salon Inverter Klima R32'] },
      { name: 'ALTUS KOMBİ NF BUZDOLAPLARI', prefix: 'KMNF', cost: 18500, price: 27900, sampleNames: ['AL 525 KNF Alttan Donduruculu 450L Kombi No-Frost Dolap', 'AL 535 KNX Inox Kombi No-Frost Geniş Gövde', 'AL 515 KNF Beyaz Dokunmatik Kontrollü Kombi Dolap'] },
      { name: 'ALTUS NOFROST ÇEKMECELİ DERİN DONDURUCU', prefix: 'NFCD', cost: 11900, price: 17900, sampleNames: ['AL 710 NF No-Frost 7 Çekmeceli Beyaz Dondurucu', 'AL 810 NFX No-Frost 8 Bölmeli Inox Dondurucu', 'AL 610 NF No-Frost 6 Çekmeceli Hızlı Şoklama Dondurucu'] },
      { name: 'ALTUS SOLO SETÜSTÜ OCAKLAR', prefix: 'SSOC', cost: 2400, price: 3850, sampleNames: ['AL 204 B 4 Gözü Gazlı Beyaz Setüstü Ocak', 'AL 205 I 4 Gözü Doğalgazlı Inox Setüstü Ocak', 'AL 206 S Siyah Emaye Otomatik Ateşlemeli Ocak'] },
      { name: 'ALTUS TEK KAPILI BUZDOLAPLARI', prefix: 'TKBZ', cost: 7800, price: 12200, sampleNames: ['AL 1090 Büro Tipi Tezgah Altı Mini Buzdolabı 90L', 'AL 230 Tek Kapılı İçten Donduruculu Dolap 210L', 'AL 1100 Cam Kapaklı Ofis Tipi Soğutucu Dolap'] },
      { name: 'ALTUS TV', prefix: 'ATV', cost: 7200, price: 11500, sampleNames: ['AL 43 inç Full HD Smart LED TV Dahili Uydu', 'AL 50 inç 4K Ultra HD Android Smart TV', 'AL 32 inç HD Ready Mutfak Tipi LED TV'] },
      { name: 'ALTUS ÜSTTEN KAPAKLI DERİN DONDURUCU', prefix: 'UKDD', cost: 8900, price: 13900, sampleNames: ['AL 210 Sandık Tipi Yatay Derin Dondurucu 205L', 'AL 310 Geniş Hacimli Sandık Dondurucu 300L', 'AL 410 Çift Sepetli Süper Dondurma Sandık Tipi 400L'] },
      { name: 'ALTUS YOĞUŞMALI KURUTMA MAKİNELERİ', prefix: 'YKM', cost: 9800, price: 15200, sampleNames: ['AL 80 YK 8 kg B Sınıfı Yoğuşmalı Kurutma Makinesi', 'AL 90 YK 9 kg Kolay Ütü Programlı Kurutucu', 'AL 70 YK 7 kg Kompakt Yoğuşmalı Çamaşır Kurutma'] },
    ],
  },
  {
    category: 'BOSCH',
    brand: 'BOSCH',
    supplierId: 'sup-bosch',
    supplierName: 'Bosch Ev Aletleri San. Tic. A.Ş.',
    subCategories: [
      { name: 'BOSCH ANKASTRE DAVLUMBAZ', prefix: 'BDAV', cost: 7800, price: 12400, sampleNames: ['DWK67CM60 Siyah Eğimli Cam Davlumbaz 60cm', 'DWK65DK20 Serie 4 Beyaz Cam Eğimli Davlumbaz', 'DWB97IM50 Serie 6 Inox 90cm Ada/Duvar Davlumbaz'] },
      { name: 'BOSCH ANKASTRE FIRIN', prefix: 'BFIR', cost: 13500, price: 21500, sampleNames: ['HBA534EB0 Serie 4 3D HotAir Siyah Fırın', 'HBG633NB1 Serie 8 EcoClean Dokunmatik Ankastre Fırın', 'HBF514BS1T Serie 2 Inox Turbo Ankastre Fırın'] },
      { name: 'BOSCH ANKASTRE OCAK', prefix: 'BOC', cost: 8200, price: 13200, sampleNames: ['POP7C6O10O Serie 2 Siyah Sert Cam Ocak 60cm', 'PPQ7A6B20 Serie 6 5 Gözü Gazlı Woklu Cam Ocak', 'PSY6B6B20 Serie 4 Yarı İndüksiyonlu Hibrit Ocak'] },
      { name: 'BOSCH BULAŞIK MAKİNELERİ', prefix: 'BBUL', cost: 14800, price: 23600, sampleNames: ['SMS4IKW51T Serie 4 HomeConnect 5 Programlı Beyaz', 'SMS6ECI81T Serie 6 Zeolith Kurutmalı Inox Bulaşık Makinesi', 'SMS2ITI04T Serie 2 Silence Plus Sessiz Inox Bulaşık'] },
      { name: 'BOSCH ÇAMAŞIR MAKİNELERİ', prefix: 'BCAM', cost: 17200, price: 27500, sampleNames: ['WGA252X0TR Serie 4 10 kg 1200 Devir Inox Makine', 'WGA142XSTR Serie 4 9 kg Leke Çıkarma Fonksiyonlu Makine', 'WAX32MH0TR Serie 8 10 kg 1600 Devir HomeConnect Akıllı'] },
      { name: 'BOSCH BUZDOLAPLARI', prefix: 'BBUZ', cost: 24500, price: 38900, sampleNames: ['KGN56VWF0N Serie 4 No-Frost Geniş Buzdolabı 508L Beyaz', 'KGN76AI32N Serie 6 No-Frost Inox XL Genişlik 521L', 'KGN86AIEP Serie 6 VitaFresh Plus XXL No-Frost Inox'] },
      { name: 'BOSCH KURUTMA MAKİNELERİ', prefix: 'BKRM', cost: 16900, price: 26900, sampleNames: ['WQG24100TR Serie 6 9 kg Isı Pompalı SelfCleaning Condenser', 'WTH85207TR Serie 4 8 kg A++ Hassas Kurutma Makinesi', 'WTX87K80TR Serie 8 HomeConnect Buharlı Akıllı Kurutucu'] },
      { name: 'BOSCH KOMBİ BUZDOLABI', prefix: 'BKMB', cost: 26500, price: 42000, sampleNames: ['KGE49EICP Serie 6 Alttan Donduruculu LowFrost Inox 419L', 'KGV36VWEAS Serie 4 Kombi Tipi Beyaz Enerji Dostu Dolap', 'KGN49XLEA Serie 4 No-Frost Kolay Temizlenir Inox Kombi'] },
      { name: 'BOSCH SOLO OCAKLAR', prefix: 'BSOL', cost: 9500, price: 15400, sampleNames: ['HKA090150U Serie 2 60cm Solo Elektrikli Cam Seramik Fırın/Ocak', 'HXA090D20 Serie 4 Gazlı Solo Ocak Fırın Paslanmaz Çelik', 'HXA080D50 Beyaz Solo Gaz Emniyetli 4 Gözlü Fırın'] },
      { name: 'BOSCH TEK KAPILI BUZDOLABI', prefix: 'BTEK', cost: 11500, price: 18200, sampleNames: ['KSR38NWEG Serie 2 346L Tek Kapılı Solo Soğutucu Beyaz', 'KSV36NWEP Serie 4 FreshSense Tek Kapılı Geniş Dolap', 'KUL15A50 Tezgah Altı Entegre Mini Soğutucu'] },
      { name: 'BOSCH KÜÇÜK EV ALETLERİ', prefix: 'BKEA', cost: 2600, price: 4300, sampleNames: ['MFQ36460 ErgoMixx Mikser & Hazne Seti 450W', 'TKA6A043 ComfortLine Filtre Kahve Makinesi', 'BGS41POW1 Serie 6 ProPower Toz Torbasız Süpürge'] },
      { name: 'BOSCH KLİMA', prefix: 'BKLM', cost: 19800, price: 31500, sampleNames: ['Climate 3000i 12000 BTU Inverter A+++ Klima', 'Climate 5000i 18000 BTU Sessiz İyonizerli Klima', 'Climate 6000i 24000 BTU Akıllı Wi-Fi Salon Tipi Klima'] },
      { name: 'BOSCH ÇİFT KAPILI BUZDOLABI', prefix: 'BCKP', cost: 21800, price: 34500, sampleNames: ['KDN56NW22N Serie 2 No-Frost Çift Kapılı 505L Beyaz Dolap', 'KDN65VI20N Serie 4 Geniş Hacimli Inox Çift Kapılı Dolap', 'KDN55NWE0N MultiAirflow Çift Kapılı No-Frost Dolap'] },
      { name: 'BOSCH DERİN DONDURUCU', prefix: 'BDDN', cost: 15500, price: 24800, sampleNames: ['GSN36VWEP Serie 4 No-Frost 7 Çekmeceli Dondurucu 242L', 'GSN58AWDP Serie 6 XXL No-Frost 365L Geniş Dondurucu', 'GSD11NWE0N 3 Çekmeceli Kompakt Tezgah Tipi Dondurucu'] },
    ],
  },
  {
    category: 'HOOVER',
    brand: 'HOOVER',
    supplierId: 'sup-hoover',
    supplierName: 'Hoover Dayanıklı Tüketim Malları A.Ş.',
    subCategories: [
      { name: 'HOOVER BULAŞIK MAKİNESİ', prefix: 'HBUL', cost: 9200, price: 14500, sampleNames: ['HF 6C4F0W H-DISH 500 16 Kişilik Wi-Fi Bulaşık Makinesi', 'HF 3E7L0X Maxi Tub Geniş Sepetli Inox Bulaşık Makinesi', 'HF 4C7F0B Siyah Dokunmatik 14 Kişilik Bulaşık Makinesi'] },
      { name: 'HOOVER ÇAMAŞIR MAKİNESİ', prefix: 'HCAM', cost: 11400, price: 17800, sampleNames: ['H3W 4102DE 10 kg 1400 Devir One-Fi Akıllı Çamaşır Makinesi', 'H7W 49MBCR 9 kg H-WASH 700 A Enerji Sessiz Inverter Makine', 'H5W 6114X 11 kg XL Yıkama Kapasiteli Antrasit Çamaşır Makinesi'] },
      { name: 'HOOVER KURUTMA MAKİNESİ', prefix: 'HKRM', cost: 12200, price: 18900, sampleNames: ['NDP H9A2TCBEXS H-DRY 500 9 kg Isı Pompalı Kurutma', 'HLE H10A2TE 10 kg Wi-Fi Aquavision Kapak İçi Su Tanklı Kurutucu', 'ND4 H7A1TS 7 kg Slim Dar Alan Isı Pompalı Kurutma Makinesi'] },
      { name: 'HOOVER KURUTMALI ÇAMAŞIR MAKİNESİ', prefix: 'HKCM', cost: 14800, price: 23200, sampleNames: ['HDP 4149AMBC 14 kg Yıkama / 9 kg Kurutma Hepsi Bir Arada', 'H3D 4965DCE 9 kg Yıkama / 6 kg Kurutma Buharlı Makine', 'HD 4106AMBC 10 kg Yıkama / 6 kg Kurutma Inverter Makine'] },
    ],
  },
  {
    category: 'UĞUR',
    brand: 'UĞUR',
    supplierId: 'sup-ugur',
    supplierName: 'Uğur Soğutma Makinaları San. Tic. A.Ş.',
    subCategories: [
      { name: 'UGUR ANKASTRE DAVLUMBAZ', prefix: 'UDAV', cost: 3600, price: 5800, sampleNames: ['UAD 60 S Siyah Eğimli Cam Dokunmatik Davlumbaz', 'UAD 60 B Beyaz Piramit Filtreli Davlumbaz', 'UAD 90 I Paslanmaz Çelik 90cm Geniş Davlumbaz'] },
      { name: 'UGUR ANKASTRE FIRIN', prefix: 'UFIR', cost: 6200, price: 9700, sampleNames: ['UAF 608 S 8 Fonksiyonlu Dijital Siyah Cam Fırın', 'UAF 606 B Beyaz Turbo Rezistanslı Ankastre Fırın', 'UAF 610 I Inox Dokunmatik Pişirme Programlı Fırın'] },
      { name: 'UGUR ANKASTRE OCAK', prefix: 'UOC', cost: 3800, price: 6100, sampleNames: ['UAO 604 S 4 Gözü Gazlı Doğalgaz Uyumlu Siyah Cam Ocak', 'UAO 604 B Beyaz Gaz Kesme Emniyetli Cam Ocak', 'UAO 705 I Wok Gözlü 5 Bölmeli Inox Ankastre Ocak'] },
      { name: 'UGUR BUZDOLABI', prefix: 'UBUZ', cost: 12900, price: 19800, sampleNames: ['UB 450 NF No-Frost 450L İki Kapılı Buzdolabı Beyaz', 'UB 520 NFX Inox Geniş Aile No-Frost Buzdolabı', 'UB 310 Çift Kapılı Düşük Enerji Tüketimli Dolap'] },
      { name: 'UGUR CEKMECELİ DONDURUCU', prefix: 'UCD', cost: 8900, price: 13900, sampleNames: ['UED 6260 DTK 6 Çekmeceli Statik Dondurucu A++', 'UED 7266 DTK 7 Çekmeceli Geniş Dondurucu 260L', 'UED 5200 Kompakt 5 Çekmeceli Ofis & Ev Dondurucusu'] },
      { name: 'UGUR ÇAMAŞIR MAKİNESİ', prefix: 'UCAM', cost: 9800, price: 15400, sampleNames: ['UCM 9120 9 kg 1200 Devir Titreşim Önleyici Makine', 'UCM 10140 10 kg 1400 Devir Inverter Motor Çamaşır Makinesi', 'UCM 8100 8 kg Hızlı 15 Dk Programlı Beyaz Çamaşır Makinesi'] },
      { name: 'UGUR KURUTMA MAKİNESİ', prefix: 'UKRM', cost: 11500, price: 17900, sampleNames: ['UKM 810 IP 8 kg Isı Pompalı Sessiz Tamburlu Kurutma', 'UKM 910 IP 9 kg Kırışıklık Önleyici Geniş Kurutucu', 'UKM 800 YK 8 kg Yoğuşmalı Pratik Çamaşır Kurutma'] },
      { name: 'UGUR NF CEKMECELİ DONDURUCU', prefix: 'UNFC', cost: 11200, price: 17200, sampleNames: ['UED 7280 NF 7 Çekmeceli No-Frost Karlanmaz Dondurucu', 'UED 8290 NFX Inox 8 Çekmeceli No-Frost Dondurucu 290L', 'UED 6240 NF No-Frost Dijital Ekranlı Hızlı Şoklayıcı'] },
      { name: 'UGUR SETUSTU OCAK', prefix: 'USOC', cost: 2300, price: 3700, sampleNames: ['USO 401 B 4 Gözü Gazlı Emaye Beyaz Setüstü Ocak', 'USO 402 S Siyah Emaye Otomatik Çakmaklı Ocak', 'USO 405 I Paslanmaz Çelik Doğalgaz Uyumlu Ocak'] },
      { name: 'UGUR SU ARITMA', prefix: 'UARIT', cost: 3400, price: 5600, sampleNames: ['Uğur Akıllı Ters Osmoz 5 Aşamalı Pompalı Su Arıtma Cihazı', 'Uğur Mineral Filtreli Tezgah Altı Kompakt Su Arıtma', 'Uğur Paslanmaz Çelik Tanklı Alkali Su Filtreleme Sistemi'] },
      { name: 'UGUR ÜSTTEN KAPAKLI DONDURUCU', prefix: 'UUKD', cost: 8400, price: 13200, sampleNames: ['UED 3100 A++ 300L Sandık Tipi Yatay Derin Dondurucu', 'UED 4200 Blok Kapaklı 400L Çift Sepetli Dondurucu', 'UED 2100 Mini Sandık Tipi 200L Yazlık ve Ev Dondurucusu'] },
      { name: 'UGUR BULASIK MAKİNESİ', prefix: 'UBUL', cost: 8600, price: 13500, sampleNames: ['UBM 404 W 4 Programlı Yarım Yük Yıkamalı Bulaşık Makinesi', 'UBM 505 X 5 Programlı Gri Inox Hijyenik Yıkama Makinesi', 'UBM 606 B Siyah Dijital Dokunmatik 14 Kişilik Bulaşık Makinesi'] },
    ],
  },
  {
    category: 'MOBİLYA',
    brand: 'İnegöl & Ankara Ahşap',
    supplierId: 'sup-mobilya',
    supplierName: 'İnegöl & Ankara Mobilya Üreticileri Koop.',
    subCategories: [
      { name: 'AKABE', prefix: 'AKB', cost: 16500, price: 26000, sampleNames: ['Akabe Lüks Chester Köşe Koltuk Takımı', 'Akabe Yataklı Sandıklı Nubuk Kanepe Seti', 'Akabe Masif Gürgen İskelet Dinlenme Koltuğu'] },
      { name: 'ANKARA MOBİLYA', prefix: 'ANK', cost: 18500, price: 29500, sampleNames: ['Ankara Modern Yatak Odası Takımı Aynalı Dolaplı', 'Ankara Ceviz Kaplama 6 Kişilik Yemek Masası Takımı', 'Ankara Modüler TV Ünitesi & Kitaplık Kombini'] },
      { name: 'AYTASHOME', prefix: 'AYT', cost: 14200, price: 22800, sampleNames: ['Aytashome Country Salon Koltuk Takımı 3+3+1', 'Aytashome Kapitoneli Yatak Odası Gardırop Seti', 'Aytashome Genç Odası Takımı Çalışma Masalı'] },
      { name: 'BENİMODAM', prefix: 'BNM', cost: 12500, price: 19800, sampleNames: ['Benimodam Montessori Çocuk Karyolası Doğal Çam', 'Benimodam Fonksiyonel Çalışma Masası ve Kitaplık', 'Benimodam 3 Kapaklı Aynalı Genç Dolabı'] },
      { name: 'HALI', prefix: 'HLI', cost: 1800, price: 3400, sampleNames: ['Gaziantep Dokuma Lüks Salon Halısı 200x290 (6m²)', 'Modern İskandinav Geometrik Akrilik Halı 160x230', 'Leke Tutmaz Kaymaz Tabanlı Koridor Yolluğu 100x300'] },
      { name: 'İPEK', prefix: 'IPK', cost: 15800, price: 25200, sampleNames: ['İpek Mobilya Klasik Salon Oturma Grubu', 'İpek Soft Kumaş Bazalı Çift Kişilik Yatak Seti', 'İpek Açılır Mermer Desenli Yemek Masası Takımı'] },
      { name: 'LADİN', prefix: 'LDN', cost: 17400, price: 27800, sampleNames: ['Ladin Mobilya Berjerli Köşe Takımı Tay Tüyü', 'Ladin 6 Kapaklı Frenli Raylı Yatak Odası Dolabı', 'Ladin Aynalı Konsol & Konsol Masası'] },
      { name: 'ÖREN MOBİLYA', prefix: 'ORN', cost: 13900, price: 22400, sampleNames: ['Ören Doğal Meşe Kaplama TV Sehpası & Duvar Rafı', 'Ören 4 Sandalyeli Ahşap Mutfak Masa Takımı', 'Ören 2 Çekmeceli Yatak Başı Şifonyer'] },
      { name: 'SERHAT', prefix: 'SRH', cost: 16900, price: 26900, sampleNames: ['Serhat Mobilya Ortopedik Mekanizmalı Çekyat Koltuk', 'Serhat Delüks Yataklı Köşe Oturma Grubu', 'Serhat Sandıklı Çift Kişilik Baza Başlık Takımı'] },
    ],
  },
  {
    category: 'MASA',
    brand: 'BULUT AKSESUAR',
    supplierId: 'sup-masa',
    supplierName: 'Bulut Aksesuar & Masa Sandalye Fabrikası',
    subCategories: [
      { name: 'BULUT AKSESUAR', prefix: 'BLT', cost: 3500, price: 5900, sampleNames: ['Bulut Açılır Ortadan Büyüyen Cam Masa 80x130', 'Bulut Tel Sandalyeli Balkon & Mutfak Masa Seti', 'Bulut Mermer Görünümlü Metal Ayaklı Zigon Set'] },
      { name: 'MASA SANDALYE', prefix: 'MSS', cost: 4800, price: 7900, sampleNames: ['Gürgen Ayaklı 6 Kişilik Açılır Yemek Masası', 'Döşemeli Kadife Kumaş Yemek Sandalyesi (4 Adet)', 'Kütük Masa Doğal Kenar Ceviz Kaplama 90x180'] },
    ],
  },
  {
    category: 'AKSESUAR',
    brand: 'AKSESUAR DİZAYN',
    supplierId: 'sup-aksesuar',
    supplierName: 'Doğu Dekorasyon & Büro Sistemleri',
    subCategories: [
      { name: 'BÜRO', prefix: 'BRO', cost: 3200, price: 5400, sampleNames: ['Müdür Çalışma Masası L Modül Kablo Kanallı', 'Ergonomik Fileli Ortopedik Yönetici Koltuğu', '2 Çekmeceli Kilitli Ofis Kesonu'] },
      { name: 'SEHPA', prefix: 'SHP', cost: 1200, price: 2150, sampleNames: ['3\'lü C Sehpa Koltuk Yanı Ahşap Tabla', 'Doğal Ceviz Orta Sehpa Çift Katlı', 'Metal İskeletli Mermer Desenli Zigon Takımı'] },
      { name: 'ÜTÜ MASA KURUTMA', prefix: 'UTM', cost: 850, price: 1550, sampleNames: ['Buhar Geçirgen Geniş Yüzeyli Katlanır Ütü Masası', 'Kanatlı Çift Katlı Paslanmaz Çamaşır Kurutmalık', 'Isıya Dayanıklı Teflon Kılıflı Monoblok Ütü Masası'] },
      { name: 'DEKORASYON', prefix: 'DKR', cost: 950, price: 1750, sampleNames: ['Metal Çerçeveli Boy Aynası 60x170cm', 'Lambader Ahşap 3 Ayaklı Kumaş Şapkalı', 'Dekoratif Duvar Saati Romen Rakamlı 70cm'] },
    ],
  },
  {
    category: 'YATAK',
    brand: 'BEDLIFE & FİENTO',
    supplierId: 'sup-yatak',
    supplierName: 'Bedlife Cibo & Fiento Yatak San. Tic.',
    subCategories: [
      { name: 'BEDLIFE CIBO', prefix: 'CIB', cost: 6800, price: 11200, sampleNames: ['Bedlife Cibo Full Ortopedik Torba Yaylı Yatak 160x200', 'Bedlife Cibo Bamboo Doğal Kumaş Yatak 150x200', 'Bedlife Cibo Titanyum Yay Destekli Yatak 180x200'] },
      { name: 'FİENTO', prefix: 'FNT', cost: 7400, price: 12100, sampleNames: ['Fiento Visco Dynamic Akıllı Sünger Yatak 160x200', 'Fiento Organik Pamuk Örme Kumaş Yatak 150x200', 'Fiento Omurga Dostu Çift Çekirdekli Yatak 160x200'] },
    ],
  },
  {
    category: 'MEDİSA',
    brand: 'MEDİSA',
    supplierId: 'sup-medisa',
    supplierName: 'Medisa Mobilya & Yatak Odası Tasarım Ltd.',
    subCategories: [
      { name: 'MEDISA DELUKS', prefix: 'MDEL', cost: 22000, price: 34500, sampleNames: ['Medisa Delüks Aynalı Frenli Gardırop 240cm', 'Medisa Delüks Baza Başlık Takımı Led Işıklı', 'Medisa Delüks Kapitone Döşemeli Sandıklı Karyola'] },
      { name: 'MEDISA LUKS', prefix: 'MLUK', cost: 18500, price: 29000, sampleNames: ['Medisa Lüks Yatak Odası Şifonyer ve Aynası', 'Medisa Lüks 5 Kapaklı Ahşap Elbise Dolabı', 'Medisa Lüks Komodin Çifti Gizli Çekmeceli'] },
      { name: 'MEDISA MAKSİ', prefix: 'MMAX', cost: 16500, price: 26200, sampleNames: ['Medisa Maksi Geniş Hacimli Depolamalı Gardırop', 'Medisa Maksi Açılır Başlıklı Baza Seti', 'Medisa Maksi Çok Amaçlı Yatak Odası Boy Dolabı'] },
      { name: 'MEDISA PREMIUM', prefix: 'MPRM', cost: 26000, price: 41000, sampleNames: ['Medisa Premium İtalyan Tarzı Yatak Odası Koleksiyonu', 'Medisa Premium Füme Camlı Işıklı Gardırop', 'Medisa Premium Hakiki Deri Detaylı Karyola'] },
      { name: 'MEDISA TEKİL', prefix: 'MTEK', cost: 5800, price: 9400, sampleNames: ['Medisa Tekil 4 Çekmeceli Yüksek Şifonyer', 'Medisa Tekil Dresuar ve Oval Duvar Aynası', 'Medisa Tekil Makyaj Masası Işıklı Aynalı'] },
      { name: 'MEDISA YATAK ODASI', prefix: 'MYTK', cost: 24000, price: 38000, sampleNames: ['Medisa Komple Yatak Odası Takımı (Dolap+Baza+Başlık+2 Komodin)', 'Medisa Country Beyaz Masif Ahşap Yatak Odası', 'Medisa Antrasit Modern Çizgili Yatak Odası Grubu'] },
      { name: 'MEDISA YEMEK ODASI', prefix: 'MYMK', cost: 19500, price: 31000, sampleNames: ['Medisa Açılır Konsollu 6 Sandalyeli Yemek Odası', 'Medisa Masif Meşe Ayaklı Vitrinli Salon Yemek Grubu', 'Medisa Modern Mermer Desen Konsol & Ayna Takımı'] },
    ],
  },
  {
    category: 'KEA',
    brand: 'ALTUS / TEFAL / KARCHER',
    supplierId: 'sup-kea',
    supplierName: 'Tefal & Küçük Ev Aletleri Merkez Depo',
    subCategories: [
      { name: 'ALTUS KEA', prefix: 'AKEA', cost: 1200, price: 1950, sampleNames: ['Altus AL 795 Tost Makinesi Döküm Plakalı', 'Altus AL 728 Çay Makinesi Cam Demlikli', 'Altus AL 740 El Blender Seti 1000W Paslanmaz'] },
      { name: 'MUHTELİF KEA', prefix: 'MKEA', cost: 1650, price: 2750, sampleNames: ['Otomatik Türk Kahvesi Makinesi Közde Pişirme', 'Paslanmaz Çelik Su Isıtıcı Kettle 1.7L', 'Dijital Dokunmatik Yağsız Sıcak Hava Fritözü Airfryer'] },
      { name: 'TEFAL KARCHER', prefix: 'TKAR', cost: 3800, price: 6200, sampleNames: ['Tefal Actifry Genius Yağsız Fritöz 1.2 kg', 'Tefal OptiGrill Akıllı Izgara & Tost Makinesi', 'Kärcher SC 3 EasyFix Buharlı Temizlik Makinesi'] },
    ],
  },
  {
    category: 'TV',
    brand: 'SKYTECH',
    supplierId: 'sup-tv',
    supplierName: 'Skytech Elektronik & Görüntü Sistemleri A.Ş.',
    subCategories: [
      { name: 'SKYTECH', prefix: 'SKYT', cost: 6200, price: 9900, sampleNames: ['Skytech ST-4340 43 inç Full HD Android Smart LED TV', 'Skytech ST-5040 50 inç 4K Ultra HD WebOS Smart TV', 'Skytech ST-3230 32 inç HD Dahili Uydulu LED TV'] },
    ],
  },
];

// Generate Suppliers matching KATEGORI_3
export const KATEGORI_3_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-bambi',
    code: 'TED-BAM',
    name: 'Bambi Yatak & Baza San. A.Ş.',
    contactPerson: 'Mehmet Bambi',
    phone: '0 (232) 850 10 20',
    email: 'siparis@bambi.com.tr',
    city: 'İzmir / Torbalı',
    address: 'Pancar OSB 14. Sokak No:8 Torbalı/İzmir',
    taxNumber: '1450293847',
    taxOffice: 'Torbalı VD',
    type: 'tedarikci',
    currentBalance: 125000,
    totalPurchased: 580000,
    totalPaid: 455000,
    associatedProductsCount: 39,
    avgProfitMargin: 38.2,
    category: 'BAMBİ',
    notes: 'Bambi marka yatak, baza, başlık ve aksesuarlar yetkili bölge bayiliği.',
    createdAt: '2026-01-05',
  },
  {
    id: 'sup-altus',
    code: 'TED-ALT',
    name: 'Altus & Arçelik Pazarlama A.Ş.',
    contactPerson: 'Levent Demir',
    phone: '0 (216) 585 85 85',
    email: 'altus.bayi@arcelik.com',
    city: 'İstanbul / Çayırova',
    address: 'E-5 Yan Yol Üzeri Arçelik Dağıtım Merkezi',
    taxNumber: '0790012834',
    taxOffice: 'Büyük Mükellefler VD',
    type: 'tedarikci',
    currentBalance: 184000,
    totalPurchased: 890000,
    totalPaid: 706000,
    associatedProductsCount: 54,
    avgProfitMargin: 35.0,
    category: 'ALTUS',
    notes: 'Altus beyaz eşya, klima ve televizyon grubu ana distribütörü.',
    createdAt: '2026-01-08',
  },
  {
    id: 'sup-bosch',
    code: 'TED-BSH',
    name: 'Bosch Ev Aletleri San. Tic. A.Ş.',
    contactPerson: 'Ahmet Çelik',
    phone: '0 (216) 432 00 00',
    email: 'bsh.siparis@bshg.com',
    city: 'İstanbul / Ümraniye',
    address: 'Fatih Sultan Mehmet Mah. Balkan Cad. No:51 Ümraniye',
    taxNumber: '1910034567',
    taxOffice: 'Kozyatağı VD',
    type: 'tedarikci',
    currentBalance: 210000,
    totalPurchased: 1150000,
    totalPaid: 940000,
    associatedProductsCount: 42,
    avgProfitMargin: 36.5,
    category: 'BOSCH',
    notes: 'Bosch ankastre, beyaz eşya ve küçük ev aletleri fabrika satış temsilciliği.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sup-hoover',
    code: 'TED-HOV',
    name: 'Hoover Dayanıklı Tüketim Malları A.Ş.',
    contactPerson: 'Canan Güneş',
    phone: '0 (212) 345 67 89',
    email: 'siparis@hoover.com.tr',
    city: 'Eskişehir / OSB',
    address: 'Eskişehir Organize Sanayi Bölgesi 22. Cadde',
    taxNumber: '4630192847',
    taxOffice: 'Eskişehir VD',
    type: 'tedarikci',
    currentBalance: 68000,
    totalPurchased: 340000,
    totalPaid: 272000,
    associatedProductsCount: 12,
    avgProfitMargin: 36.0,
    category: 'HOOVER',
    notes: 'Hoover çamaşır, kurutma ve bulaşık makinesi grubu.',
    createdAt: '2026-01-15',
  },
  {
    id: 'sup-ugur',
    code: 'TED-UGR',
    name: 'Uğur Soğutma Makinaları San. Tic. A.Ş.',
    contactPerson: 'İsmail Şentürk',
    phone: '0 (256) 316 10 00',
    email: 'bayi@ugur.com.tr',
    city: 'Aydın / Nazilli',
    address: 'Yeni Sanayi Mah. Devlet Karayolu Cad. No:127 Nazilli',
    taxNumber: '8870023419',
    taxOffice: 'Nazilli VD',
    type: 'tedarikci',
    currentBalance: 98000,
    totalPurchased: 520000,
    totalPaid: 422000,
    associatedProductsCount: 36,
    avgProfitMargin: 37.8,
    category: 'UĞUR',
    notes: 'Uğur derin dondurucu, soğutma, ankastre ve su arıtma sistemleri.',
    createdAt: '2026-01-20',
  },
  {
    id: 'sup-mobilya',
    code: 'TED-MOB',
    name: 'İnegöl & Ankara Mobilya Üreticileri Koop.',
    contactPerson: 'Murat Karaca',
    phone: '0 (224) 714 88 90',
    email: 'siparis@inegolahsap.com',
    city: 'Bursa / İnegöl',
    address: 'Organize Sanayi Bölgesi 4. Cad. No:12 İnegöl/Bursa',
    taxNumber: '4780192834',
    taxOffice: 'İnegöl VD',
    type: 'tedarikci',
    currentBalance: 142000,
    totalPurchased: 760000,
    totalPaid: 618000,
    associatedProductsCount: 27,
    avgProfitMargin: 40.5,
    category: 'MOBİLYA',
    notes: 'Akabe, Ladin, Serhat, İpek, Ankara ve Ören Mobilya konsorsiyumu.',
    createdAt: '2026-01-25',
  },
  {
    id: 'sup-masa',
    code: 'TED-MAS',
    name: 'Bulut Aksesuar & Masa Sandalye Fabrikası',
    contactPerson: 'Bülent Bulut',
    phone: '0 (312) 395 10 20',
    email: 'satis@bulutmasa.com',
    city: 'Ankara / Siteler',
    address: 'Siteler Demirhendek Cad. No:84 Altındağ/Ankara',
    taxNumber: '1980345678',
    taxOffice: 'Siteler VD',
    type: 'tedarikci',
    currentBalance: 42000,
    totalPurchased: 210000,
    totalPaid: 168000,
    associatedProductsCount: 6,
    avgProfitMargin: 41.0,
    category: 'MASA',
    notes: 'Açılır cam masalar, kütük ahşap masalar ve sandalye takımları.',
    createdAt: '2026-02-01',
  },
  {
    id: 'sup-aksesuar',
    code: 'TED-AKS',
    name: 'Doğu Dekorasyon & Büro Sistemleri',
    contactPerson: 'Kemal Aksoy',
    phone: '0 (312) 395 44 20',
    email: 'satis@ankaramekanizma.com',
    city: 'Ankara',
    address: 'Ostim Sanayi Sitesi 1234. Sokak No:5 Yenimahalle/Ankara',
    taxNumber: '0710654329',
    taxOffice: 'Ostim VD',
    type: 'tedarikci',
    currentBalance: 29500,
    totalPurchased: 145000,
    totalPaid: 115500,
    associatedProductsCount: 12,
    avgProfitMargin: 44.0,
    category: 'AKSESUAR',
    notes: 'Zigon sehpa, orta sehpa, dresuar, ayna, büro ve kurutmalık aksesuarları.',
    createdAt: '2026-02-05',
  },
  {
    id: 'sup-yatak',
    code: 'TED-YTK',
    name: 'Bedlife Cibo & Fiento Yatak San. Tic.',
    contactPerson: 'Hasan Yılmaz',
    phone: '0 (352) 321 45 60',
    email: 'muhasebe@kayserisunger.com.tr',
    city: 'Kayseri',
    address: 'Mimarsinan OSB 18. Cad. No:6 Melikgazi/Kayseri',
    taxNumber: '5320981245',
    taxOffice: 'Kayseri VD',
    type: 'tedarikci',
    currentBalance: 61000,
    totalPurchased: 290000,
    totalPaid: 229000,
    associatedProductsCount: 6,
    avgProfitMargin: 41.5,
    category: 'YATAK',
    notes: 'Bedlife Cibo ve Fiento patentli ortopedik sünger ve yaylı yatak üreticisi.',
    createdAt: '2026-02-10',
  },
  {
    id: 'sup-medisa',
    code: 'TED-MED',
    name: 'Medisa Mobilya & Yatak Odası Tasarım Ltd.',
    contactPerson: 'Serdar Medisa',
    phone: '0 (224) 715 00 11',
    email: 'bilgi@medisamobilya.com',
    city: 'Bursa / İnegöl',
    address: 'Ağaç İşleri Sanayi Sitesi 12. Cad. İnegöl',
    taxNumber: '6140392817',
    taxOffice: 'İnegöl VD',
    type: 'tedarikci',
    currentBalance: 115000,
    totalPurchased: 560000,
    totalPaid: 445000,
    associatedProductsCount: 21,
    avgProfitMargin: 39.5,
    category: 'MEDİSA',
    notes: 'Medisa delüks, lüks, maksi ve premium yatak ve yemek odası takımları.',
    createdAt: '2026-02-15',
  },
  {
    id: 'sup-kea',
    code: 'TED-KEA',
    name: 'Tefal & Küçük Ev Aletleri Merkez Depo',
    contactPerson: 'Gökhan Yıldız',
    phone: '0 (212) 675 00 22',
    email: 'toptan@keadagitim.com',
    city: 'İstanbul / Başakşehir',
    address: 'İkitelli OSB Mutfakçılar Sanayi Sitesi',
    taxNumber: '3810293847',
    taxOffice: 'İkitelli VD',
    type: 'tedarikci',
    currentBalance: 38000,
    totalPurchased: 195000,
    totalPaid: 157000,
    associatedProductsCount: 9,
    avgProfitMargin: 40.0,
    category: 'KEA',
    notes: 'Tefal, Kärcher ve Altus küçük ev aletleri, airfryer ve süpürgeler.',
    createdAt: '2026-02-20',
  },
  {
    id: 'sup-tv',
    code: 'TED-TV',
    name: 'Skytech Elektronik & Görüntü Sistemleri A.Ş.',
    contactPerson: 'Fatih Gür',
    phone: '0 (212) 444 75 98',
    email: 'info@skytech.com.tr',
    city: 'İstanbul / Avcılar',
    address: 'Cihangir Mah. Petrol Ofisi Cad. No:14 Avcılar/İstanbul',
    taxNumber: '7720194857',
    taxOffice: 'Avcılar VD',
    type: 'tedarikci',
    currentBalance: 45000,
    totalPurchased: 240000,
    totalPaid: 195000,
    associatedProductsCount: 3,
    avgProfitMargin: 36.8,
    category: 'TV',
    notes: 'Skytech akıllı televizyon ve LED ekran sistemleri distribütörü.',
    createdAt: '2026-02-25',
  },
];

// Generate Categories for KATEGORI_3
export const KATEGORI_3_CATEGORIES: CategoryDefinition[] = KATEGORI_3_RAW_LIST.map((c, idx) => ({
  id: `cat-k3-${idx + 1}`,
  name: c.category,
  subCategories: c.subCategories.map((s) => s.name),
}));

// Generate SubCategories Definitions
export const KATEGORI_3_SUBCATEGORIES: SubCategoryDefinition[] = KATEGORI_3_RAW_LIST.flatMap((c) =>
  c.subCategories.map((s, sIdx) => ({
    id: `sub-k3-${c.category.toLowerCase().replace(/[^a-z0-9]/g, '')}-${sIdx + 1}`,
    categoryName: c.category,
    name: s.name,
    description: `${c.category} kategorisine ait ${s.name} alt ürün grubu`,
  }))
);

// Generate Brands for KATEGORI_3
export const KATEGORI_3_BRANDS: BrandDefinition[] = [
  { id: 'br-1', name: 'BAMBİ', country: 'Türkiye' },
  { id: 'br-2', name: 'ALTUS', country: 'Türkiye' },
  { id: 'br-3', name: 'BOSCH', country: 'Almanya' },
  { id: 'br-4', name: 'HOOVER', country: 'İtalya' },
  { id: 'br-5', name: 'UĞUR', country: 'Türkiye' },
  { id: 'br-6', name: 'MEDİSA', country: 'Türkiye' },
  { id: 'br-7', name: 'SKYTECH', country: 'Türkiye' },
  { id: 'br-8', name: 'AKABE', country: 'Türkiye' },
  { id: 'br-9', name: 'ANKARA MOBİLYA', country: 'Türkiye' },
  { id: 'br-10', name: 'AYTASHOME', country: 'Türkiye' },
  { id: 'br-11', name: 'BENİMODAM', country: 'Türkiye' },
  { id: 'br-12', name: 'HALI', country: 'Türkiye' },
  { id: 'br-13', name: 'İPEK', country: 'Türkiye' },
  { id: 'br-14', name: 'LADİN', country: 'Türkiye' },
  { id: 'br-15', name: 'ÖREN MOBİLYA', country: 'Türkiye' },
  { id: 'br-16', name: 'SERHAT', country: 'Türkiye' },
  { id: 'br-17', name: 'BULUT AKSESUAR', country: 'Türkiye' },
  { id: 'br-18', name: 'BEDLIFE CIBO', country: 'Türkiye' },
  { id: 'br-19', name: 'FİENTO', country: 'Türkiye' },
  { id: 'br-20', name: 'TEFAL', country: 'Fransa' },
  { id: 'br-21', name: 'KARCHER', country: 'Almanya' },
];

// Generate exactly 3 high-fidelity realistic products for EACH of the 89 subcategories (89 * 3 = 267 products)
export const KATEGORI_3_PRODUCTS: Product[] = KATEGORI_3_RAW_LIST.flatMap((catData) =>
  catData.subCategories.flatMap((sub, subIdx) => {
    return sub.sampleNames.map((pName, pIdx) => {
      const prodNum = pIdx + 1;
      const sku = `${sub.prefix}-${String(subIdx + 1).padStart(2, '0')}${String(prodNum).padStart(2, '0')}`;
      const costVariance = [0.95, 1.0, 1.08][pIdx % 3];
      const priceVariance = [0.96, 1.0, 1.1][pIdx % 3];
      const costPrice = Math.round((sub.cost * costVariance) / 50) * 50;
      const salePrice = Math.round((sub.price * priceVariance) / 50) * 50;
      const stockQty = [12, 8, 5, 14, 7, 9, 6][(subIdx + pIdx) % 7];

      let brand = catData.brand;
      if (catData.category === 'MOBİLYA') {
        brand = sub.name;
      } else if (catData.category === 'YATAK') {
        brand = sub.name.includes('CIBO') ? 'BEDLIFE CIBO' : 'FİENTO';
      } else if (catData.category === 'KEA') {
        if (sub.name.includes('TEFAL')) brand = pIdx === 2 ? 'KARCHER' : 'TEFAL';
        else if (sub.name.includes('ALTUS')) brand = 'ALTUS';
        else brand = 'MUHTELİF KEA';
      }

      return {
        id: `prod-k3-${catData.category.toLowerCase().replace(/[^a-z0-9]/g, '')}-${sub.prefix.toLowerCase()}-${prodNum}`,
        sku,
        name: `${sub.name} - ${pName}`,
        category: catData.category,
        subCategory: sub.name,
        brand,
        supplierId: catData.supplierId,
        supplierName: catData.supplierName,
        stockQty,
        unit: 'Adet',
        costPrice,
        salePrice,
        minStockAlert: 2,
        lastPurchaseDate: `2026-0${(pIdx % 3) + 7}-1${(subIdx % 8) + 1}`,
        notes: `KATEGORİ_3 Excel listesi kapsamında otomatik oluşturulan örnek ürün.`,
      };
    });
  })
);

// Helper to generate sample sales for Kategori 3 products across 2026
export const generateSampleSalesForKategori3 = (productsList: Product[]): SaleItem[] => {
  const staffList = [
    'Ahmet Karadeniz (Satış Sorumlusu)',
    'Fatma Şahin (Müşteri İlişkileri)',
    'Mustafa Yıldız (Salon Satış)',
    'İlker Arslan (Yönetici)',
  ];

  const customersList = [
    'Yavuz Konut & Mimarlık Ltd.',
    'Gözde Residence Sitesi',
    'Bireysel Perakende Müşterileri',
    'Karabük Konut Kooperatifi',
    'Safranbolu Butik Otel İşletmesi',
    'Özgür Yılmaz (Perakende Müşteri)',
    'Ayşe Çelik (Perakende Müşteri)',
    'Emre Aydın (Perakende Müşteri)',
  ];

  // Pick representative products across categories
  const targetProds = productsList.filter((_, idx) => idx % 6 === 0).slice(0, 36);

  const sales: SaleItem[] = [];

  targetProds.forEach((prod, sIdx) => {
    const month = String((sIdx % 10) + 1).padStart(2, '0');
    const day = String((sIdx % 27) + 1).padStart(2, '0');
    const date = `2026-${month}-${day}`;
    const qty = (sIdx % 3) + 1;
    const paymentMethods: Array<'pesin' | 'kredi_karti' | 'senetli'> = [
      'pesin',
      'kredi_karti',
      'senetli',
    ];
    const paymentMethod = paymentMethods[sIdx % 3];
    const installmentCount = paymentMethod === 'senetli' ? ((sIdx % 4) + 1) * 3 : undefined; // 3, 6, 9, 12 taksit
    const monthlyInterestRate = paymentMethod === 'senetli' ? 2.8 : undefined;
    const baseCost = prod.costPrice * qty;
    const interestCost =
      paymentMethod === 'senetli' && installmentCount
        ? Math.round((baseCost * (2.8 / 100) * (installmentCount / 2)) * 100) / 100
        : 0;

    const totalCost = baseCost + interestCost;
    const totalSalePrice = prod.salePrice * qty;
    const grossProfit = totalSalePrice - totalCost;
    const profitMarginPercent = totalSalePrice > 0 ? (grossProfit / totalSalePrice) * 100 : 0;

    sales.push({
      id: `sale-k3-${sIdx + 1}`,
      saleId: `S-2026-${String(sIdx + 1).padStart(4, '0')}`,
      date,
      customerName: customersList[sIdx % customersList.length],
      productName: prod.name,
      matchedSku: prod.sku,
      matchedSupplierId: prod.supplierId,
      matchedSupplierName: prod.supplierName,
      category: prod.category,
      quantity: qty,
      unitSalePrice: prod.salePrice,
      totalSalePrice,
      unitCost: prod.costPrice,
      baseCost,
      interestCost,
      totalCost,
      grossProfit,
      profitMarginPercent,
      paymentMethod,
      installmentCount,
      monthlyInterestRate,
      salesperson: staffList[sIdx % staffList.length],
      status: 'tamamlandi',
    });
  });

  return sales;
};

// Generate sample purchase orders matching Kategori 3
export const generateSamplePurchasesForKategori3 = (
  productsList: Product[],
  suppliersList: Supplier[]
): PurchaseOrder[] => {
  const orders: PurchaseOrder[] = [];

  suppliersList.forEach((sup, sIdx) => {
    const supProds = productsList.filter((p) => p.supplierId === sup.id).slice(0, 3);
    if (supProds.length === 0) return;

    const month = String((sIdx % 9) + 1).padStart(2, '0');
    const date = `2026-${month}-12`;
    const items = supProds.map((p, pIdx) => {
      const quantity = (pIdx + 1) * 5;
      const unitPrice = p.costPrice;
      const totalPrice = quantity * unitPrice;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const paidAmount = Math.round(totalAmount * 0.7);

    orders.push({
      id: `po-k3-${sIdx + 1}`,
      orderNumber: `PO-2026-${String(sIdx + 1).padStart(3, '0')}`,
      invoiceNumber: `FAT-2026-${String(8000 + sIdx * 12)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      date,
      items,
      totalAmount,
      paymentStatus: 'kismi',
      paidAmount,
      dueDate: `2026-${String((sIdx % 9) + 2).padStart(2, '0')}-15`,
      source: 'excel',
      notes: `${sup.name} için KATEGORİ_3 parti mal alım faturası.`,
      createdAt: `${date} 10:00`,
    });
  });

  return orders;
};

// Generate price lists for Kategori 3
export const generatePriceListForKategori3 = (productsList: Product[]): PriceListItem[] => {
  return productsList.slice(0, 60).map((prod, idx) => ({
    id: `pl-k3-${idx + 1}`,
    productId: prod.id,
    productSku: prod.sku,
    productName: prod.name,
    category: prod.category,
    subCategory: prod.subCategory,
    brand: prod.brand,
    monthCode: '2026-10',
    costPrice: prod.costPrice,
    cashSalePrice: prod.salePrice,
    cardSalePrice: Math.round((prod.salePrice * 1.05) / 50) * 50,
    installment12Price: Math.round((prod.salePrice * 1.22) / 50) * 50,
    lastUpdated: '2026-10-01',
  }));
};

