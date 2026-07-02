import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';
import Admin from './pages/Admin';
import VideoCarousel from './pages/VideoCarousel';
import mascotsBg from './assets/images/world_cup_mascots_background_1779791199132.png';

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
  isActive?: number;
  isClosed?: number;
  resultA?: number | null;
  resultB?: number | null;
};

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);

  // Decorative background with neon gradients
  return (
    <div className="min-h-screen bg-[#020D1F] text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${mascotsBg})` }}
      />
      <div className="atmosphere pointer-events-none" />
      <div className="stadium-mesh pointer-events-none" />
      
      {/* Main Content Router */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-8 pb-16 md:py-16 px-4 md:px-8">
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home onComplete={setUser} />} />
            <Route path="/jogos" element={user ? <Matches user={user} /> : <Navigate to="/" />} />
            <Route path="/palpite/:matchId" element={user ? <Predict user={user} /> : <Navigate to="/" />} />
            <Route path="/pix" element={<Pix />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/carousel" element={<VideoCarousel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </div>
    </div>
  );
}
