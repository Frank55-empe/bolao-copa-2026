import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Link,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import React, { useState, useMemo, createContext, useContext } from 'react';
import { flushSync } from 'react-dom';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';
import Admin from './pages/Admin';
import mascotsBg from './assets/images/world_cup_mascots_background_1779791199132.png';
import { Settings } from 'lucide-react';

// ─── Tipos públicos ───────────────────────────────────────────────────────────
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

// ─── sessionStorage helpers ───────────────────────────────────────────────────
const SESSION_KEY = 'bolao2026_user';

export function readUser(): UserData | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? (JSON.parse(s) as UserData) : null;
  } catch {
    return null;
  }
}

function writeUser(data: UserData) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────
type UserCtx = { user: UserData | null; setUser: (u: UserData) => void };
export const UserContext = createContext<UserCtx>({ user: null, setUser: () => {} });
export const useUser = () => useContext(UserContext);

// ─── Basename (calculado uma única vez) ───────────────────────────────────────
const BASENAME = window.location.pathname.startsWith('/bolao-copa-2026')
  ? '/bolao-copa-2026'
  : '/';

// ─── Layout shell ─────────────────────────────────────────────────────────────
function Shell() {
  return (
    <div className="min-h-screen bg-[#020D1F] text-white font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(${mascotsBg})` }}
      />
      <div className="atmosphere pointer-events-none" />
      <div className="stadium-mesh pointer-events-none" />
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-8 pb-16 md:py-16 px-4 md:px-8">
        <div className="flex-grow w-full flex flex-col items-center justify-center">
          <Outlet />
        </div>
        <footer className="mt-12 text-center text-white/10 hover:text-white/30 transition-colors text-xs flex items-center justify-center gap-2 font-bold uppercase tracking-widest select-none">
          <span>© Bolão Copa 2026</span>
          <span className="text-white/5">•</span>
          <Link to="/admin" className="hover:text-[#FFCD00] flex items-center gap-1 transition-colors py-2">
            <Settings className="w-3 h-3 text-[#009739]" />
            Painel Admin
          </Link>
        </footer>
      </div>
    </div>
  );
}

// ─── HomeWrapper ─────────────────────────────────────────────────────────────
// Componente separado para poder usar useNavigate (só funciona dentro do RouterProvider)
function HomeWrapper() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleComplete = (data: UserData) => {
    // flushSync força o React a aplicar setUser ANTES de sair desta função.
    // Sem isso, o React 18 faz batching e a rota /jogos renderiza antes
    // de user estar disponível, causando o redirect de volta para /.
    flushSync(() => {
      writeUser(data);
      setUser(data);
    });
    navigate('/jogos');
  };

  return <Home onComplete={handleComplete} />;
}

// ─── Páginas protegidas ────────────────────────────────────────────────────────
function MatchesPage() {
  const { user } = useUser();
  const u = user ?? readUser();
  if (!u) return <Navigate to="/" replace />;
  return <Matches user={u} />;
}

function PredictPage() {
  const { user } = useUser();
  const u = user ?? readUser();
  if (!u) return <Navigate to="/" replace />;
  return <Predict user={u} />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<UserData | null>(readUser);

  // useMemo garante que o router só é criado uma vez (não a cada render),
  // mas DENTRO do componente para que os elementos JSX tenham acesso ao Context.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const router = useMemo(() => createBrowserRouter(
    [
      {
        path: '/',
        element: <Shell />,
        children: [
          { index: true,              element: <HomeWrapper /> },
          { path: 'jogos',            element: <MatchesPage /> },
          { path: 'palpite/:matchId', element: <PredictPage /> },
          { path: 'pix',              element: <Pix /> },
          { path: 'admin',            element: <Admin /> },
          { path: '*',                element: <Navigate to="/" replace /> },
        ],
      },
    ],
    { basename: BASENAME }
  ), []); // [] = cria uma única vez

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <RouterProvider router={router} />
    </UserContext.Provider>
  );
}
