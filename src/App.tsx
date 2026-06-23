import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Link,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import React, { useState, createContext, useContext } from 'react';
import { flushSync } from 'react-dom';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Predict from './pages/Predict';
import Pix from './pages/Pix';
import Admin from './pages/Admin';
import mascotsBg from './assets/images/world_cup_mascots_background_1779791199132.png';
import { Settings } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
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

// ─── Session storage helpers ─────────────────────────────────────────────────
const SESSION_KEY = 'bolao2026_user';

export function readUser(): UserData | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function writeUser(data: UserData) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /**/ }
}

// ─── Context do user — disponível em qualquer componente ─────────────────────
type UserCtx = { user: UserData | null; setUser: (u: UserData) => void };
export const UserContext = createContext<UserCtx>({ user: null, setUser: () => {} });
export const useUser = () => useContext(UserContext);

// ─── Guard: bloqueia rota se não há user salvo ────────────────────────────────
function RequireUser({ children }: { children: React.ReactNode }) {
  // Lê direto do sessionStorage — sempre atualizado, não depende de re-render
  const user = readUser();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── Shell: layout com fundo e footer ────────────────────────────────────────
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

// ─── HomeWrapper: dentro do router, acessa useNavigate + UserContext ──────────
function HomeWrapper() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleComplete = (data: UserData) => {
    // flushSync: força o React a aplicar TODOS os setState de forma SÍNCRONA
    // antes de continuar para o navigate — elimina o bug de batching do React 18
    flushSync(() => {
      writeUser(data);   // persiste no sessionStorage
      setUser(data);     // atualiza o Context
    });
    // Aqui o sessionStorage já tem o user — RequireUser vai deixar passar
    navigate('/jogos');
  };

  return <Home onComplete={handleComplete} />;
}

// ─── Páginas protegidas leem user do Context ──────────────────────────────────
function MatchesPage() {
  const { user } = useUser();
  const u = user || readUser();   // fallback para sessionStorage se Context ainda não atualizou
  if (!u) return <Navigate to="/" replace />;
  return <Matches user={u} />;
}

function PredictPage() {
  const { user } = useUser();
  const u = user || readUser();
  if (!u) return <Navigate to="/" replace />;
  return <Predict user={u} />;
}

// ─── Basename detectado uma vez ───────────────────────────────────────────────
const BASENAME = window.location.pathname.startsWith('/bolao-copa-2026')
  ? '/bolao-copa-2026'
  : '/';

// ─── Router criado uma vez fora do componente ─────────────────────────────────
// Isso garante que o router nunca é recriado entre renders
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Shell />,
      children: [
        { index: true,          element: <HomeWrapper /> },
        { path: 'jogos',        element: <RequireUser><MatchesPage /></RequireUser> },
        { path: 'palpite/:matchId', element: <RequireUser><PredictPage /></RequireUser> },
        { path: 'pix',          element: <Pix /> },
        { path: 'admin',        element: <Admin /> },
        { path: '*',            element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: BASENAME }
);

// ─── App raiz ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<UserData | null>(readUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <RouterProvider router={router} />
    </UserContext.Provider>
  );
}
