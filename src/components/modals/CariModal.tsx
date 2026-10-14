import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Cari, CariType } from '../../types/finance';
import { X, Users, Check } from 'lucide-react';

interface CariModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCari: Cari | null;
}

export const CariModal: React.FC<CariModalProps> = ({
  isOpen,
  onClose,
  editingCari,
}) => {
  const { addCari, updateCari } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<CariType>('Müşteri');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [city, setCity] = useState('');
  const [balance, setBalance] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingCari) {
      setName(editingCari.name);
      setType(editingCari.type);
      setPhone(editingCari.phone || '');
      setEmail(editingCari.email || '');
      setTaxNumber(editingCari.taxNumber || '');
      setTaxOffice(editingCari.taxOffice || '');
      setCity(editingCari.city || '');
      setBalance(editingCari.balance.toString());
      setNotes(editingCari.notes || '');
    } else {
      setName('');
      setType('Müşteri');
      setPhone('');
      setEmail('');
      setTaxNumber('');
      setTaxOffice('');
      setCity('İstanbul');
      setBalance('0');
      setNotes('');
    }
  }, [editingCari, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance) || 0;
    if (editingCari) {
      updateCari({
        ...editingCari,
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        taxOffice: taxOffice.trim() || undefined,
        city: city.trim() || undefined,
        balance: numBalance,
        notes: notes.trim() || undefined,
      });
    } else {
      addCari({
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        taxOffice: taxOffice.trim() || undefined,
        city: city.trim() || undefined,
        balance: numBalance,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingCari ? 'Cari Kartı Düzenle' : 'Yeni Cari Hesap Oluştur'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cari Türü
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CariType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Müşteri">Müşteri (Alacaklı Olduğumuz)</option>
                <option value="Tedarikçi">Tedarikçi (Borçlu Olduğumuz)</option>
                <option value="Personel">Personel / Çalışan</option>
                <option value="Diğer">Diğer Ortak / Kurum</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Şehir
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="İstanbul, Ankara..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Firma / Unvan *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Örn: Anadolu Lojistik A.Ş. veya Ahmet Yılmaz"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefon Numarası
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="muhasebe@sirket.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vergi Dairesi
              </label>
              <input
                type="text"
                value={taxOffice}
                onChange={e => setTaxOffice(e.target.value)}
                placeholder="Kadıköy V.D."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vergi / TCKN No
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={e => setTaxNumber(e.target.value)}
                placeholder="10 Haneli VKN"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Devir / Başlangıç Bakiyesi (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono-num focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              * Pozitif değer alacağı (+), negatif değer firmaya borcumuzu (-) ifade eder.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Özel Notlar
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ödeme şartları, vade günleri veya özel anlaşmalar..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {editingCari ? 'Güncelle' : 'Cariyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
