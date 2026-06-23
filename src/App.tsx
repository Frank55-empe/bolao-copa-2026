import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';
import Admin from './pages/Admin';
import mascotsBg from './assets/images/world_cup_mascots_background_1779791199132.png';
import { Settings } from 'lucide-react';

export type UserData = {
  name: string;
  whatsapp: string;
  notificationsOptIn?: boolean;
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

const SESSION_KEY = 'bolao2026_user';

// Calculado fora do componente: estável durante toda a vida da app
function detectBasename(): string {
  const path = window.location.pathname;
  if (path.startsWith('/bolao-copa-2026')) return '/bolao-copa-2026';
  return '/';
}
const BASENAME = detectBasename();

// Componente interno que tem acesso ao useNavigate (precisa estar dentro do BrowserRouter)
function AppRoutes() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // onComplete: salva no sessionStorage PRIMEIRO, atualiza o estado,
  // e delega o navigate para cá — garantindo que o user já está no state
  // quando a nova rota renderizar.
  const handleSetUser = (data: UserData) => {
    // 1. Persiste imediatamente no sessionStorage
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    // 2. Atualiza o estado React
    setUser(data);
    // 3. Navega para /jogos — o state já foi atualizado antes do próximo render
    navigate('/jogos');
  };

  return (
    <>
      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <Routes>
          {/* Home não recebe onComplete com navigate externo — o navigate é feito aqui dentro */}
          <Route path="/" element={<Home onComplete={handleSetUser} />} />
          <Route path="/jogos" element={user ? <Matches user={user} /> : <Navigate to="/" replace />} />
          <Route path="/palpite/:matchId" element={user ? <Predict user={user} /> : <Navigate to="/" replace />} />
          <Route path="/pix" element={<Pix />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <footer className="mt-12 text-center text-white/10 hover:text-white/30 transition-colors text-xs flex items-center justify-center gap-2 font-bold uppercase tracking-widest select-none">
        <span>© Bolão Copa 2026</span>
        <span className="text-white/5">•</span>
        <Link to="/admin" className="hover:text-[#FFCD00] flex items-center gap-1 transition-colors py-2">
          <Settings className="w-3 h-3 text-[#009739]" />
          Painel Admin
        </Link>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#020D1F] text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${mascotsBg})` }}
      />
      <div className="atmosphere pointer-events-none" />
      <div className="stadium-mesh pointer-events-none" />

      <div className="relative z-10 w-full min-h-screen flex flex-col pt-8 pb-16 md:py-16 px-4 md:px-8">
        <BrowserRouter basename={BASENAME}>
          <AppRoutes />
        </BrowserRouter>
      </div>
    </div>
  );
}
