import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Settings, Users, Check, TrendingUp, DollarSign, ListOrdered, Calendar, ShieldCheck, X, Search, Home, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { initAuth, googleSignIn, getAccessToken, logout } from '../services/googleAuth';
import { syncDataToSheets } from '../services/sheets';

type Prediction = {
  id: number;
  name: string;
  whatsapp: string;
  goalsA: number;
  goalsB: number;
  teamA: string;
  teamB: string;
  statusPix: string;
  createdAt: string;
  matchId: string;
  points: number;
};

type Match = {
  id: string;
  teamA: string;
  teamAFlag: string;
  teamB: string;
  teamBFlag: string;
  date: string;
  time: string;
  stadium: string;
  round: string;
  isActive: number;
  isClosed: number;
  resultA: number | null;
  resultB: number | null;
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'JOGOS' | 'PARTICIPANTES' | 'CONFIG' | 'PLANILHA'>('DASHBOARD');
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [resultModal, setResultModal] = useState<{ matchId: string; teamA: string; teamB: string } | null>(null);
  const [resultA, setResultA] = useState('');
  const [resultB, setResultB] = useState('');

  // Google Sheets state
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Match Form State
  const navigate = useNavigate();
  const [newMatch, setNewMatch] = useState({
    teamA: '', teamAFlag: '', teamB: '', teamBFlag: '', date: '', time: '', stadium: '', round: ''
  });

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (username === 'Frank' && password === 'mj691811') {
      setIsAuthenticated(true);
    } else {
      setLoginError('Acesso negado: Somente o administrador pode ter acesso.');
    }
  };

  const loadData = () => {
    api.get('getAdminPredictions').then(data => setPredictions(Array.isArray(data) ? data : data.predictions || [])).catch(console.warn);
    api.get('getMatches').then(data => setMatches(Array.isArray(data) ? data : data.matches || [])).catch(console.warn);
    api.get('getSettings').then(data => setSettings(data.settings || data)).catch(console.warn);
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      initAuth(
        () => setNeedsAuth(false),
        () => setNeedsAuth(true)
      );
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) setNeedsAuth(false);
    } catch (err) {
      console.warn('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!settings.spreadsheetId) {
      alert('Por favor, defina o ID da planilha na aba de PLANILHA antes de sincronizar.');
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      alert('Não autorizado. Por favor faça o login com o Google.');
      setNeedsAuth(true);
      return;
    }
    setIsSyncing(true);
    try {
      await syncDataToSheets(settings.spreadsheetId, token, matches, predictions, settings);
      alert('Sincronização com o Google Sheets finalizada com sucesso!');
    } catch(err: any) {
      console.warn(err);
      alert('Falha ao sincronizar: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await api.post('updateSettings', settings);
       alert('Configurações salvas com sucesso!');
    } catch(err) {
       console.warn(err);
       alert('Erro ao salvar as configurações.');
    }
  };

  const confirmPayment = async (id: number) => {
    try {
      const data = await api.post('confirmPayment', { id });
      if (data.waLink) {
         window.open(data.waLink, '_blank', 'noopener,noreferrer');
      }
      loadData();
    } catch (e) {
      console.warn(e);
      alert('Erro ao confirmar pagamento');
    }
  };

  const cancelPrediction = async (id: number) => {
    setConfirmModal({
      message: 'Tem certeza que deseja cancelar (excluir) este palpite?',
      onConfirm: async () => {
        try {
           await api.post('cancelPrediction', { id });
           loadData();
        } catch(err) {
           console.warn(err);
           alert('Erro ao cancelar o palpite');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await api.post('addMatch', newMatch);
       setNewMatch({ teamA: '', teamAFlag: '', teamB: '', teamBFlag: '', date: '', time: '', stadium: '', round: '' });
       loadData();
    } catch(err) {
       console.warn(err);
       alert('Erro ao adicionar o jogo');
    }
  };

  const handleToggleMatch = async (matchId: string, isActive: boolean) => {
    try {
       await api.post('toggleMatch', { matchId, isActive });
       loadData();
    } catch(err) {
       console.warn(err);
       alert('Erro ao alternar status do jogo');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    setConfirmModal({
      message: 'Deseja realmente remover este jogo?',
      onConfirm: async () => {
        try {
          await api.post('deleteMatch', { id });
          loadData();
        } catch(err) {
          console.warn(err);
          alert('Erro ao deletar o jogo');
        }
        setConfirmModal(null);
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md w-full mx-auto pb-8 pt-10">
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Home className="w-4 h-4" /> Voltar ao Início
        </button>
        <form onSubmit={login} className="glass-card rounded-3xl p-8">
          <ShieldCheck className="w-16 h-16 text-[#FFCD00] mx-auto mb-6" />
          <h2 className="text-2xl font-bold uppercase tracking-widest text-center text-white mb-6">Administração</h2>
          {loginError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-500 text-sm font-bold p-3 rounded-xl mb-4 text-center">
              {loginError}
            </div>
          )}
          <input 
            type="text" 
            value={username}
            onChange={e=>setUsername(e.target.value)}
            placeholder="Usuário"
            className="w-full bg-black/40 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFCD00] mb-4"
          />
          <input 
            type="password" 
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Senha de acesso"
            className="w-full bg-black/40 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFCD00] mb-6"
          />
          <button type="submit" className="w-full bg-gradient-to-r from-[#FFCD00] to-[#E5A800] text-black uppercase tracking-widest font-black rounded-xl py-4 hover:scale-[1.02] active:scale-95 transition-all">
            ENTRAR
          </button>
        </form>
      </div>
    );
  }

  const revenue = predictions.filter(p => p.statusPix === 'PAID').length * parseFloat(settings.pix_value || "30");
  const pending = predictions.filter(p => p.statusPix === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto w-full pb-8">
      <button 
        onClick={() => navigate('/')} 
        className="mb-8 p-3 glass-card inline-flex items-center gap-2 text-white/80 hover:text-[#FFCD00] hover:border-[#FFCD00]/50 transition-all text-xs font-bold uppercase tracking-widest rounded-xl"
      >
        <Home className="w-4 h-4" /> Voltar ao App
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-[#FFCD00]" />
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-widest">Painel Gestor</h1>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl overflow-x-auto">
          {['DASHBOARD', 'JOGOS', 'PARTICIPANTES', 'CONFIG', 'PLANILHA'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-[#FFCD00] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'DASHBOARD' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-5 rounded-2xl border-l-4 border-[#009739]">
              <div className="text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"><Users className="w-4 h-4"/> Participantes</div>
              <p className="text-3xl font-display font-black text-white">{predictions.length}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border-l-4 border-blue-500">
              <div className="text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"><Calendar className="w-4 h-4"/> Jogos Ativos</div>
              <p className="text-3xl font-display font-black text-white">{matches.filter(m => m.isActive === 1).length}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border-l-4 border-[#FFCD00]">
              <div className="text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"><DollarSign className="w-4 h-4"/> Arrecadado</div>
              <p className="text-3xl font-display font-black text-[#FFCD00]">R$ {revenue.toFixed(2)}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border-l-4 border-red-500">
              <div className="text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"><Settings className="w-4 h-4"/> Pendentes</div>
              <p className="text-3xl font-display font-black text-red-500">{pending}</p>
            </div>
          </div>
          
          {/* ESTATISTICAS */}
          <div className="glass-card p-6 rounded-3xl mb-8">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#FFCD00]" /> Estatísticas & Prêmios</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Total Arrecadado (Bruto)</p>
                <p className="text-xl font-black text-white mb-4">R$ {revenue.toFixed(2)}</p>

                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Taxa de Administração ({settings.admin_fee_percent || '20'}%)</p>
                <p className="text-xl font-black text-red-400 mb-4">- R$ {(revenue * (parseFloat(settings.admin_fee_percent || '20') / 100)).toFixed(2)}</p>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <p className="text-xs font-bold text-[#009739] uppercase tracking-widest mb-1">Prêmio Disponível</p>
                  <p className="text-3xl font-black text-[#009739]">R$ {(revenue * (1 - parseFloat(settings.admin_fee_percent || '20') / 100)).toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Placares mais frequentes</p>
                <div className="space-y-2">
                  {Object.entries(
                    predictions.reduce((acc, p) => {
                      const score = `${p.goalsA}x${p.goalsB}`;
                      acc[score] = (acc[score] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([score, count]: any) => (
                    <div key={score} className="flex justify-between items-center text-sm">
                      <span className="font-bold bg-white/10 px-2 py-1 rounded text-white">{score}</span>
                      <span className="text-white/50">{count} aposta(s)</span>
                    </div>
                  ))}
                  {predictions.length === 0 && <span className="text-white/30 text-xs text-center block">Nenhum palpite registrado.</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'CONFIG' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-3xl">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Configurações PIX</h2>
            <form onSubmit={updateSettings} className="space-y-4 text-sm">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Recebedor</label>
                <input value={settings.pix_receiver || ''} onChange={e=>setSettings({...settings, pix_receiver: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#FFCD00] text-white transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Cidade do Recebedor</label>
                <input value={settings.pix_city || ''} onChange={e=>setSettings({...settings, pix_city: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#FFCD00] text-white transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Chave PIX</label>
                <input value={settings.pix_key || ''} onChange={e=>setSettings({...settings, pix_key: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#FFCD00] text-white transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Valor da Aposta (R$)</label>
                <input value={settings.pix_value || ''} onChange={e=>setSettings({...settings, pix_value: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#FFCD00] text-white transition-colors" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#FFCD00] to-[#E5A800] text-black font-black py-3 rounded-xl mt-4 hover:scale-[1.02] transition-colors uppercase tracking-widest text-sm">SALVAR CONFIGS</button>
            </form>
          </div>

          <div className="grid gap-8">
            <div className="glass-card p-6 rounded-3xl">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Regras do Bolão</h2>
              <form onSubmit={updateSettings} className="space-y-4 text-sm">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Limite máximo de palpites iguais</label>
                  <input type="number" min="1" value={settings.max_duplicates || '5'} onChange={e=>setSettings({...settings, max_duplicates: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white transition-colors" />
                  <p className="text-[10px] text-white/40 mt-1">Bloqueia um palpite após N pessoas escolherem o mesmo placar num jogo.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">% Despesa ADMIN</label>
                    <input type="number" min="0" max="100" value={settings.admin_fee_percent || '20'} onChange={e=>setSettings({...settings, admin_fee_percent: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-[#009739] text-white transition-colors" />
                    <p className="text-[10px] text-white/40 mt-1">Porcentagem da arrecadação retida para a administração.</p>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-black py-3 rounded-xl mt-4 hover:scale-[1.02] transition-colors uppercase tracking-widest text-sm">SALVAR REGRAS</button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'JOGOS' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <div className="glass-card p-6 rounded-3xl mb-8">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Cadastrar Jogo</h2>
             <form onSubmit={handleAddMatch} className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Time A</label>
                  <input required value={newMatch.teamA} onChange={e=>setNewMatch({...newMatch, teamA: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="Ex: Brasil" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Bandeira A Emoji</label>
                  <input required value={newMatch.teamAFlag} onChange={e=>setNewMatch({...newMatch, teamAFlag: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="🇧🇷" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Time B</label>
                  <input required value={newMatch.teamB} onChange={e=>setNewMatch({...newMatch, teamB: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="Ex: Marrocos" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Bandeira B Emoji</label>
                  <input required value={newMatch.teamBFlag} onChange={e=>setNewMatch({...newMatch, teamBFlag: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="🇲🇦" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Data</label>
                  <input required type="date" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Horário</label>
                  <input required type="time" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Estádio</label>
                  <input required value={newMatch.stadium} onChange={e=>setNewMatch({...newMatch, stadium: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="Estádio Nacional" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">Rodada</label>
                  <input required value={newMatch.round} onChange={e=>setNewMatch({...newMatch, round: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#009739]" placeholder="Oitavas" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#009739] text-white font-black py-3 rounded-xl mt-2 hover:bg-[#00702a] transition-colors uppercase tracking-widest text-sm">CADASTRAR JOGO NA BASE</button>
            </form>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden p-6 text-white text-sm">
             <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Jogos do Bolão</h2>
             <div className="divide-y divide-white/10">
               {matches.map(m => (
                  <div key={m.id} className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                         {new Date(m.date).toLocaleDateString('pt-BR') !== 'Invalid Date' ? new Date(m.date).toLocaleDateString('pt-BR') : m.date} - 
                         {m.time && m.time.includes('T') ? new Date(m.time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : m.time} • {m.stadium}
                       </div>
                       <div className="font-display font-medium text-lg flex items-center gap-2">
                         <span>{m.teamAFlag}</span> {m.teamA} <span className="text-white/30 text-xs px-2">X</span> <span>{m.teamBFlag}</span> {m.teamB}
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                        {m.isClosed === 1 ? (
                          <div className="text-xs uppercase font-bold tracking-widest text-[#009739] px-3 py-2 bg-[#009739]/10 rounded-xl">
                            Resultado: {m.resultA} x {m.resultB}
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setResultA('');
                              setResultB('');
                              setResultModal({ matchId: m.id, teamA: m.teamA, teamB: m.teamB });
                            }}
                            className="bg-[#009739] text-white hover:bg-[#00702a] px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Finalizar Jogo
                          </button>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                          <input 
                            type="checkbox" 
                            className="accent-[#FFCD00] w-4 h-4 cursor-pointer"
                            checked={Number(m.isActive) === 1}
                            onChange={(e) => handleToggleMatch(m.id, e.target.checked)}
                          />
                          <span className="text-xs uppercase font-bold tracking-widest text-[#FFCD00]">No Bolão</span>
                        </label>
                        <button onClick={() => handleDeleteMatch(m.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                          <X className="w-4 h-4" /> Remover
                        </button>
                     </div>
                  </div>
               ))}
             </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'PARTICIPANTES' && (() => {
        const displayed = predictions.filter(p => {
          const matchesFilter = filter === 'ALL' ? true : p.statusPix === filter;
          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                p.whatsapp.includes(searchQuery);
          return matchesFilter && matchesSearch;
        });
        
        return (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
           <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between md:items-center">
             <div className="flex gap-2">
               <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${filter === 'ALL' ? 'bg-[#FFCD00] text-black' : 'bg-white/10 text-white/50'}`}>Todos</button>
               <button onClick={() => setFilter('PAID')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${filter === 'PAID' ? 'bg-[#009739] text-white' : 'bg-white/10 text-white/50'}`}>Pagos</button>
               <button onClick={() => setFilter('PENDING')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${filter === 'PENDING' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'}`}>Pendentes</button>
             </div>
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Pesquisar participante..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full md:w-64 bg-black/40 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-[#FFCD00] transition-colors"
               />
               <Search className="w-4 h-4 text-white/50 absolute left-3 top-2.5" />
             </div>
           </div>
           <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/70">
                <thead className="bg-[#FFCD00] text-[10px] uppercase font-bold tracking-widest text-black">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Participante</th>
                    <th className="px-6 py-4">Jogo</th>
                    <th className="px-6 py-4">Palpite</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayed.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 font-medium transition-colors">
                       <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-bold ${p.statusPix === 'PAID' ? 'bg-[#009739]/20 text-[#009739]' : 'bg-red-500/20 text-red-500'}`}>
                          {p.statusPix}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-white font-bold">{p.name}<br/><span className="text-[10px] text-white/50 tracking-widest uppercase font-normal">{p.whatsapp}</span></td>
                      <td className="px-6 py-4 uppercase text-xs font-bold tracking-widest">{p.teamA} x {p.teamB}</td>
                      <td className="px-6 py-4 font-black flex items-center gap-2">
                        <div className="bg-black/50 px-2 flex items-center justify-center rounded text-white">{p.goalsA}</div>
                        <span className="text-white/30 text-xs">x</span>
                        <div className="bg-black/50 px-2 flex items-center justify-center rounded text-white">{p.goalsB}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {p.statusPix === 'PENDING' && (
                            <button onClick={() => confirmPayment(p.id)} className="bg-[#009739] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-transform hover:scale-105 shadow-lg" title="Confirmar Pagamento">
                              Confirmar
                            </button>
                          )}
                          <button onClick={() => cancelPrediction(p.id)} className="bg-red-500 text-white p-1.5 rounded-lg text-xs uppercase hover:bg-red-600 transition-colors" title="Cancelar.">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-white/30 font-bold uppercase tracking-widest text-xs">Nenhum participante encontrado neste filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      );})()}

      {activeTab === 'PLANILHA' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid gap-8">
          <div className="glass-card p-6 rounded-3xl">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#009739]" />
              Sincronização Google Sheets
            </h2>

            <div className="mb-6 space-y-4 text-sm text-white/80">
              <p>Essa ferramenta exporta e sincroniza automaticamente seus palpites, jogos e configurações atuais diretamente com sua conta no Google Sheets.</p>
              
              <div className="bg-black/30 border border-white/10 p-4 rounded-xl">
                <h3 className="font-bold text-[#FFCD00] mb-2 uppercase tracking-widest text-xs">Atenção - Como configurar</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Crie uma planilha em branco no seu Google Sheets.</li>
                  <li>Copie o ID da Planilha que fica na URL (Ex: https://docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit).</li>
                  <li>Cole o ID no campo abaixo e salve as configurações.</li>
                  <li>Dê a devida permissão no botão do Google para continuar.</li>
                  <li>Clique em Sincronizar!</li>
                </ol>
              </div>
            </div>

            <form onSubmit={updateSettings} className="space-y-4 mb-8 max-w-lg">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#009739] mb-1 block">ID da Planilha</label>
                <input 
                  value={settings.spreadsheetId || ''} 
                  onChange={e=>setSettings({...settings, spreadsheetId: e.target.value})} 
                  placeholder="EX: 1v1_T5fA..."
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white transition-colors" 
                />
              </div>
              <button type="submit" className="w-full bg-white/10 text-white font-bold py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-colors uppercase tracking-widest text-xs">
                Salvar ID da Planilha
              </button>
            </form>

            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center gap-4">
              {needsAuth ? (
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper p-3 px-4 bg-white text-black font-medium rounded shadow flex items-center gap-3 hover:bg-gray-100 transition-colors">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">{isLoggingIn ? 'Conectando...' : 'Fazer login com o Google'}</span>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                   <div className="flex items-center gap-2 text-[#009739] text-xs font-bold bg-[#009739]/10 px-4 py-3 rounded-xl border border-[#009739]/30">
                     <Check className="w-4 h-4" /> Conectado ao Google
                   </div>
                   
                   <button 
                     onClick={handleSyncSheets}
                     disabled={isSyncing}
                     className="bg-gradient-to-r from-[#009739] to-[#00702a] text-white flex items-center gap-2 font-black px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform uppercase tracking-widest text-sm shadow-xl disabled:opacity-50"
                   >
                     <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                     {isSyncing ? 'Sincronizando...' : 'Sincronizar Planilha Agora'}
                   </button>
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      )}
      
      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
             <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest">Confirmação</h3>
             <p className="text-white/70 text-sm mb-6">{confirmModal.message}</p>
             <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmModal(null)} className="px-4 py-2 rounded-xl text-white/50 text-xs font-bold uppercase hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-500 rounded-xl text-white text-xs font-bold uppercase shadow hover:bg-red-600 transition-colors">Confirmar</button>
             </div>
          </div>
        </div>
      )}

      {/* Set Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
             <h3 className="text-lg font-bold text-[#FFCD00] mb-4 uppercase tracking-widest">Finalizar Jogo</h3>
             <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-6">Insira o resultado final da partida para calcular os pontos de todos os participantes.</p>
             
             <div className="flex items-center justify-center gap-4 mb-8">
               <div className="text-center">
                 <div className="text-white font-bold mb-2 uppercase text-xs tracking-widest">{resultModal.teamA}</div>
                 <input type="number" min="0" value={resultA} onChange={e => setResultA(e.target.value)} className="w-16 h-16 text-center text-3xl font-black bg-black/50 border border-white/20 rounded-xl text-white outline-none focus:border-[#FFCD00]" />
               </div>
               <span className="text-white/50 font-black mt-6 px-2">X</span>
               <div className="text-center">
                 <div className="text-white font-bold mb-2 uppercase text-xs tracking-widest">{resultModal.teamB}</div>
                 <input type="number" min="0" value={resultB} onChange={e => setResultB(e.target.value)} className="w-16 h-16 text-center text-3xl font-black bg-black/50 border border-white/20 rounded-xl text-white outline-none focus:border-[#FFCD00]" />
               </div>
             </div>

             <div className="flex justify-end gap-3">
                <button onClick={() => setResultModal(null)} className="px-4 py-2 rounded-xl text-white/50 text-xs font-bold uppercase hover:bg-white/5 transition-colors">Cancelar</button>
                <button 
                  onClick={async () => {
                     try {
                        await api.post('setResult', { matchId: resultModal.matchId, resultA, resultB });
                        loadData();
                        setResultModal(null);
                     } catch (err) {
                        console.warn(err);
                        alert('Erro ao finalizar o jogo');
                     }
                  }}
                  disabled={!resultA || !resultB} 
                  className="px-4 py-2 bg-[#009739] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase shadow hover:bg-[#00702a] transition-colors"
                >
                  Salvar Resultado
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
