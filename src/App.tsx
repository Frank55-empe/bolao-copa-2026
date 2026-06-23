import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

export default function App() {
  const [user, setUser] = useState<UserData | null>(() => {
    // Recupera user do sessionStorage ao recarregar (resolve perda de state no GitHub Pages SPA)
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetUser = (data: UserData) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
    setUser(data);
  };

  // Detecta o basename correto baseado no pathname atual
  // Permite funcionar tanto no GitHub Pages (/bolao-copa-2026) quanto em outros paths
  const getBasename = () => {
    // Se estiver rodando localmente ou em root, usa '/'
    const path = window.location.pathname;
    if (path.startsWith('/bolao-copa-2026')) {
      return '/bolao-copa-2026';
    }
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#020D1F] text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${mascotsBg})` }}
      />
      <div className="atmosphere pointer-events-none" />
      <div className="stadium-mesh pointer-events-none" />
      
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-8 pb-16 md:py-16 px-4 md:px-8">
        <BrowserRouter basename={getBasename()}>
          <div className="flex-grow w-full flex flex-col items-center justify-center">
            <Routes>
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
        </BrowserRouter>
      </div>
    </div>
  );
}
