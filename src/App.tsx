import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, User, Phone, ChevronRight, Loader2 } from 'lucide-react';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';

// ─── Types (exportados para as páginas usarem) ────────────────────────────────
export type UserData = {
  name: string;
  whatsapp: string;
};

export type MatchData = {
  id: string;
  teamA: string;
  teamAFlag: string;
  teamB: string;
  teamBFlag: string;
  date: string;
  time: string;
  stadium: string;
  round: string;
  resultGoalsA?: number;
  resultGoalsB?: number;
  status?: 'PENDING' | 'FINISHED';
};

// ─── Tela de Login ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: UserData) => void }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = name.trim();
    const phoneDigits = whatsapp.replace(/\D/g, '');

    if (nameTrimmed.length < 2) {
      setError('Por favor, insira seu nome completo.');
      return;
    }
    if (phoneDigits.length < 10) {
      setError('Por favor, insira um número de WhatsApp válido.');
      return;
    }

    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user: UserData = { name: nameTrimmed, whatsapp: phoneDigits };
    sessionStorage.setItem('bolao_user', JSON.stringify(user));
    onLogin(user);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#009739]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFCD00]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-[#009739] to-[#00702a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,151,57,0.4)]"
          >
            <Trophy className="w-10 h-10 text-[#FFCD00]" />
          </motion.div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-1">
            Bolão
          </h1>
          <p className="text-[#FFCD00] font-black text-sm uppercase tracking-[0.3em]">
            Mundial 2026
          </p>
          <p className="text-white/40 text-xs mt-2 font-medium">
            Insira seus dados para participar
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#009739] mb-2">
                <User className="w-3 h-3 inline-block mr-1" />
                Seu Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-[#009739] focus:ring-1 focus:ring-[#009739]/50 transition-all"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#009739] mb-2">
                <Phone className="w-3 h-3 inline-block mr-1" />
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(formatPhone(e.target.value))}
                placeholder="(35) 99999-9999"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-[#009739] focus:ring-1 focus:ring-[#009739]/50 transition-all font-mono"
                inputMode="tel"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-red-400 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-[#009739]/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  PARTICIPAR
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-[10px] mt-6 font-medium">
          Seus dados são usados apenas para identificação no bolão.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Layout principal (header + conteúdo) ─────────────────────────────────────
function AppLayout({ user, onLogout }: { user: UserData; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFCD00]" />
            <span className="font-black text-white text-sm uppercase tracking-widest">
              Bolão <span className="text-[#009739]">2026</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Participante</p>
              <p className="text-xs font-bold text-white">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/jogos" replace />} />
          <Route path="/jogos" element={<Matches user={user} />} />
          <Route path="/palpite/:matchId" element={<Predict user={user} />} />
          <Route path="/pix" element={<Pix />} />
          <Route path="*" element={<Navigate to="/jogos" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('bolao_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem('bolao_user');
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('bolao_user');
    setUser(null);
  };

  return (
    <HashRouter>
      {/* ── Fundo responsivo ─────────────────────────────────────────────────
          Coloque as imagens em:
            src/assets/images/bg-desktop.jpg  (para computador)
            src/assets/images/bg-mobile.jpg   (para celular/tablet)
          As classes md:hidden / hidden md:block fazem a troca automática.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="bg-layer-mobile" aria-hidden="true" />
      <div className="bg-layer-desktop" aria-hidden="true" />

      <div className="min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginScreen onLogin={setUser} />
            </motion.div>
          ) : (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col">
              <AppLayout user={user} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HashRouter>
  );
}
