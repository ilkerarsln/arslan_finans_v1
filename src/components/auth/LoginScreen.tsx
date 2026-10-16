import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ShieldCheck,
  Lock,
  Building2,
  TrendingUp,
  Wallet,
  ArrowRight,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithUsername, isCloudSyncing } = useFinance();
  const [authMode, setAuthMode] = useState<'staff' | 'google'>('staff');
  const [username, setUsername] = useState('ilkerarslan78@gmail');
  const [password, setPassword] = useState('140514');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Lütfen kullanıcı adınızı girin.');
      return;
    }
    if (!password) {
      setErrorMessage('Lütfen şifrenizi girin.');
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithUsername(cleanUsername, password);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDemoAdmin = () => {
    setUsername('ilkerarslan78@gmail');
    setPassword('140514');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3">
            <TrendingUp className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Arslan Mobilya
          </h1>
          <p className="text-slate-400 text-sm">
            ERP, Kâr Takip ve Finans Yönetim Sistemi
          </p>
        </div>

        <div className="bg-slate-800/85 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-6 md:p-7 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <Lock className="w-4 h-4" />
              <span>Güvenli Oturum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                Admin & Personel
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono font-bold">
                V3.0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-900/70 rounded-xl border border-slate-700/60 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('staff');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                authMode === 'staff'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Personel Girişi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('google');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                authMode === 'google'
                  ? 'bg-slate-100 text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google ile Giriş</span>
            </button>
          </div>

          {authMode === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4" autoComplete="off">
              <div
                onClick={handleSetDemoAdmin}
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 cursor-pointer transition flex items-center justify-between text-xs"
                title="Yönetici bilgilerini otomatik doldur"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    Varsayılan Yönetici: <strong className="text-white">ilkerarslan78@gmail</strong>
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  140514
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="ilkerarslan78@gmail"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                    disabled={isSubmitting || isCloudSyncing}
                    autoCapitalize="none"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="140514"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                    disabled={isSubmitting || isCloudSyncing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCloudSyncing}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting || isCloudSyncing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sisteme Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {authMode === 'google' && (
            <div className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Şirket yöneticisi veya yetkilendirilmiş personel Google hesabınızla şifresiz, tek tıkla oturum açabilir.
              </p>
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={isCloudSyncing}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group cursor-pointer"
              >
                {isCloudSyncing ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium">Google ile Giriş Yap</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-700/60 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Yönetici: ilkerarslan78@gmail / Şifre: 140514</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
