import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';
import Admin from './pages/Admin';
import mascotsBg from './assets/images/world_cup_mascots_background_1779791199132.png';
import mascotsBgMobile from './assets/images/0c60a34f-9070-46d7-8979-72c6ae4487e9_1%20(1).png'; // ← adicione esta linha
import { Settings } from 'lucide-react';

export type UserData = {
  name: string;
  whatsapp: string;
  notificationsOptIn?: boolean;
};

export type MatchData = {
  id: string;
  teamA: string; teamAFlag: string;
  teamB: string; teamBFlag: string;
  date: string; time: string;
  stadium: string; round: string;
  resultGoalsA?: number; resultGoalsB?: number;
  status?: 'PENDING' | 'FINISHED';
};

// Lê user do sessionStorage para sobreviver a re-renders
function readUser(): UserData | null {
  try {
    const s = sessionStorage.getItem('bolao_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(readUser);

  const handleSetUser = (data: UserData) => {
    setUser(data);
    try { sessionStorage.setItem('bolao_user', JSON.stringify(data)); } catch {}
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
        <HashRouter>
          <div className="flex-grow w-full flex flex-col items-center justify-center">
            <Routes>
              <Route path="/"              element={<Home onComplete={handleSetUser} />} />
              <Route path="/jogos"         element={user ? <Matches user={user} /> : <Navigate to="/" />} />
              <Route path="/palpite/:matchId" element={user ? <Predict user={user} /> : <Navigate to="/" />} />
              <Route path="/pix"           element={<Pix />} />
              <Route path="/admin"         element={<Admin />} />
              <Route path="*"              element={<Navigate to="/" />} />
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
        </HashRouter>
      </div>
    </div>
  );
}
