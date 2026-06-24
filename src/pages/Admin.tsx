import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Users, 
  Check, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  PlusCircle, 
  Award, 
  Coins, 
  Activity, 
  FileText,
  UserCheck,
  MapPin,
  Clock,
  ArrowRight,
  Phone
} from 'lucide-react';
import { api, Prediction } from '../services/api';

const COPA_TEAMS = [
  { name: 'Brasil', flag: '🇧🇷' },
  { name: 'Marrocos', flag: '🇲🇦' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'França', flag: '🇫🇷' },
  { name: 'Espanha', flag: '🇪🇸' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Alemanha', flag: '🇩🇪' },
  { name: 'Uruguai', flag: '🇺🇾' },
  { name: 'Haiti', flag: '🇭🇹' },
  { name: 'Escócia', flag: '🏴\u{200d}󠁳󠁣󠁴󠁿' },
  { name: 'Estados Unidos', flag: '🇺🇸' },
  { name: 'México', flag: '🇲🇽' },
  { name: 'Canadá', flag: '🇨🇦' },
  { name: 'Inglaterra', flag: '🏴\u{200d}󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Itália', flag: '🇮🇹' },
  { name: 'Senegal', flag: '🇸🇳' }
];

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [pixValue, setPixValue] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [regulamento, setRegulamento] = useState('');
  const [activeMatchId, setActiveMatchId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [accumulatedAmount, setAccumulatedAmount] = useState('0.00');
  const [goalsInputs, setGoalsInputs] = useState<Record<string, { goalsA: string; goalsB: string }>>({});
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'settings' | 'results'>('dashboard');

  // Match Form State
  const [newMatch, setNewMatch] = useState({
    teamA: '',
    teamAFlag: '',
    teamB: '',
    teamBFlag: '',
    date: '',
    time: '',
    stadium: '',
    round: ''
  });

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Frank' && password === 'mj691811') {
      setIsAuthenticated(true);
    } else {
      alert('Usuário ou senha incorretos.');
    }
  };

  const loadData = () => {
    Promise.all([
      api.getAllPredictions(),
      api.getMatches(),
      api.getSettings()
    ]).then(([predsData, matchesData, settingsData]) => {
      // Map predictions with match details to prevent empty names
      const mappedPreds = predsData.map(p => {
        const m: any = matchesData.find((match: any) => match.id === p.matchId) || {};
        return {
          ...p,
          teamA: m.teamA || "Carregando...",
          teamB: m.teamB || "Carregando...",
          teamAFlag: m.teamAFlag || "❔",
          teamBFlag: m.teamBFlag || "❔"
        };
      });
      setPredictions(mappedPreds);
      setMatches(matchesData);
      setPixValue(settingsData.pix_value || '');
      setPixKey(settingsData.pix_key || '');
      setRegulamento(settingsData.regulamento || '');
      setActiveMatchId(settingsData.active_match_id || '');
      setAdminPhone(settingsData.admin_phone || '');
      setAccumulatedAmount(settingsData.accumulated_amount || '0.00');
    }).catch(err => console.error("Erro ao carregar dados do admin:", err));
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const updateSettings = async () => {
    try {
      await api.saveSettings({ 
        pix_value: pixValue, 
        pix_key: pixKey, 
        regulamento: regulamento, 
        admin_phone: adminPhone,
        accumulated_amount: accumulatedAmount
      });
      alert('Configurações salvas com sucesso!');
      loadData();
    } catch (e) {
      alert('Erro ao salvar configurações.');
    }
  };

  const confirmPayment = async (id: number) => {
    try {
      const data = await api.confirmPayment(id);
      if (data.waLink) {
         window.open(data.waLink, '_blank', 'noopener,noreferrer');
      }
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao confirmar pagamento');
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.teamA || !newMatch.teamB) {
      alert('Preencha os nomes dos times.');
      return;
    }
    const matchId = Date.now().toString();
    await api.saveMatch({ ...newMatch, id: matchId });
    setNewMatch({ teamA: '', teamAFlag: '', teamB: '', teamBFlag: '', date: '', time: '', stadium: '', round: '' });
    alert('Jogo cadastrado com sucesso!');
    loadData();
  };

  const handleSetActiveMatch = async (matchId: string) => {
    await api.saveSettings({ active_match_id: matchId });
    alert('Bolão do Dia atualizado com sucesso!');
    loadData();
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm('Deseja realmente remover este bolão do dia?')) {
      await api.deleteMatch(id);
      loadData();
    }
  };

  const handleFinishMatch = async (matchId: string) => {
    const score = goalsInputs[matchId];
    if (!score || score.goalsA === '' || score.goalsB === '') {
      alert('Por favor, informe os gols de ambos os times para encerrar.');
      return;
    }
    const goalsA = parseInt(score.goalsA, 10);
    const goalsB = parseInt(score.goalsB, 10);
    if (isNaN(goalsA) || isNaN(goalsB)) {
      alert('Placar inválido.');
      return;
    }

    const matchToUpdate = matches.find(m => m.id === matchId);
    if (!matchToUpdate) return;

    if (!confirm(`Confirmar encerramento de ${matchToUpdate.teamA} x ${matchToUpdate.teamB} com o placar final de ${goalsA} x ${goalsB}?`)) {
      return;
    }

    try {
      const updatedMatch = { 
        ...matchToUpdate, 
        resultGoalsA: goalsA, 
        resultGoalsB: goalsB, 
        status: 'FINISHED' as const 
      };
      await api.saveMatch(updatedMatch);

      // Filter paid predictions
      const matchPreds = predictions.filter(p => p.matchId === matchId && p.statusPix === 'PAID');
      const totalCollected = matchPreds.length * parseFloat(pixValue || '30.00');
      const basePrize = totalCollected * 0.8;
      const currentAccumulated = parseFloat(accumulatedAmount || '0.00');
      const totalPrize = basePrize + currentAccumulated;

      // Filter correct guesses
      const correctGuesses = matchPreds.filter(p => p.goalsA === goalsA && p.goalsB === goalsB);

      if (correctGuesses.length > 0) {
        // We have winner(s)!
        const individualPrize = totalPrize / correctGuesses.length;
        alert(`🏆 Confronto encerrado com SUCESSO!\n\n⚽ Placar: ${matchToUpdate.teamA} ${goalsA} x ${goalsB} ${matchToUpdate.teamB}\n✅ Acertadores: ${correctGuesses.length} participante(s)\n💰 Prêmio Líquido Dividido: R$ ${totalPrize.toFixed(2)} (R$ ${individualPrize.toFixed(2)} para cada)\n\nO valor acumulado foi resetado pois houve ganhador(es).`);
        
        // Reset the accumulated amount
        await api.saveSettings({ accumulated_amount: '0.00' });
      } else {
        // No winners, let's roll over the prize
        const newAccumulated = (currentAccumulated + basePrize).toFixed(2);
        alert(`❌ Rodada encerrada SEM GANHADORES!\n\n⚽ Placar: ${matchToUpdate.teamA} ${goalsA} x ${goalsB} ${matchToUpdate.teamB}\n🚫 Nenhum participante acertou o placar correto.\n💎 O prêmio de R$ ${basePrize.toFixed(2)} acumulou!\n\n🔥 NOVO ACUMULADO PARA A PRÓXIMA RODADA: R$ ${newAccumulated}`);
        
        // Update setting in database
        await api.saveSettings({ accumulated_amount: newAccumulated });
      }
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao encerrar a rodada.');
    }
  };

  const handleReopenMatch = async (matchId: string) => {
    const matchToUpdate = matches.find(m => m.id === matchId);
    if (!matchToUpdate) return;

    if (!confirm(`Deseja reabrir o confronto ${matchToUpdate.teamA} x ${matchToUpdate.teamB}? O placar e status de finalizado serão cancelados.`)) {
      return;
    }

    try {
      const updatedMatch = { 
        ...matchToUpdate, 
        resultGoalsA: undefined, 
        resultGoalsB: undefined, 
        status: 'PENDING' as const 
      };
      await api.saveMatch(updatedMatch);
      alert('Confronto reaberto com sucesso!');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao reabrir confronto.');
    }
  };

  // Helper to quickly select quick team configuration
  const handleQuickSelectTeam = (side: 'A' | 'B', teamName: string, flag: string) => {
    if (side === 'A') {
      setNewMatch(prev => ({ ...prev, teamA: teamName, teamAFlag: flag }));
    } else {
      setNewMatch(prev => ({ ...prev, teamB: teamName, teamBFlag: flag }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md w-full mx-auto pb-8">
        <div className="text-center mb-6">
          <h1 className="title-display text-4xl text-white mb-2">BOLÃO COPA</h1>
          <p className="text-sm text-white/50 uppercase tracking-widest font-black">Área Restrita</p>
        </div>
        <form onSubmit={login} className="glass-card rounded-3xl p-8 border-2 border-white/20">
          <div className="w-16 h-16 rounded-full bg-[#009739]/20 border border-[#009739]/50 flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-[#009739] animate-spin-slow" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-6 font-display">Administração</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Login</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={e=>setUsername(e.target.value)}
                placeholder="Frank"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Senha de acesso</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white uppercase tracking-widest font-bold rounded-xl py-3.5 hover:scale-[1.02] active:scale-95 transition-all text-xs">
            ENTRAR NO PAINEL
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pb-8">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#009739] to-[#00702a] rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-medium text-white uppercase tracking-widest">Painel Gestor</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">Bolão Oficial Brasil Copa 2026</p>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl self-start md:self-auto border border-white/10 flex-wrap gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#009739] text-white shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Palpites & Stats
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'matches' ? 'bg-[#009739] text-white shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Criar Jogo
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-3 py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'results' ? 'bg-[#009739] text-white shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Resultados & Prêmios
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-[#009739] text-white shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Ajustes & Regras
          </button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">
              <Users className="w-4 h-4 text-[#FFCD00]" />
              Participações
            </div>
            <p className="text-3xl font-display font-black text-white">{predictions.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#FFCD00]" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#009739] mb-1 font-bold uppercase tracking-wider text-[10px]">
              <Coins className="w-4 h-4 text-[#009739]" />
              PIX Confirmados
            </div>
            <p className="text-3xl font-display font-black text-[#009739]">
              {predictions.filter(p => p.statusPix === 'PAID').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#009739]/10 flex items-center justify-center border border-[#009739]/20">
            <UserCheck className="w-5 h-5 text-[#009739]" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/50 mb-1 font-bold uppercase tracking-wider text-[10px]">
              <Calendar className="w-4 h-4 text-[#009739]" />
              Jogos Criados
            </div>
            <p className="text-3xl font-display font-black text-white">{matches.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: DASHBOARD & PALPITES LIST */}
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Predictions List Container */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Últimos Palpites Registrados</h2>
                  <p className="text-xs text-white/50">Confirme pagamentos e gere links do WhatsApp correspondentes.</p>
                </div>
                <button 
                  onClick={loadData}
                  className="px-4 py-2 border border-white/10 bg-black/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black/50 hover:border-[#FFCD00]/50 transition-all cursor-pointer"
                >
                  Atualizar Lista
                </button>
              </div>

              <div className="glass-card rounded-3xl overflow-hidden border border-white/15">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Data Registro</th>
                        <th className="px-6 py-4">Participante</th>
                        <th className="px-6 py-4 font-black">Confronto</th>
                        <th className="px-6 py-4">Palpite Enviado</th>
                        <th className="px-6 py-4">Status PIX</th>
                        <th className="px-6 py-4 text-center">Ações de Confirmação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {predictions.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 font-medium transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-white/40">
                            {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="px-6 py-4 text-white">
                            <span className="font-bold text-white block uppercase text-xs tracking-wider">{p.name}</span>
                            <span className="text-[10px] text-white/40 font-mono tracking-widest">{p.whatsapp}</span>
                          </td>
                          <td className="px-6 py-4 uppercase text-xs font-bold tracking-widest text-white">
                            <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                              <span>{p.teamAFlag}</span>
                              {p.teamA}
                              <span className="text-white/30 text-[9px]">x</span>
                              <span>{p.teamBFlag}</span>
                              {p.teamB}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-[#FFCD00] text-lg">
                            {p.goalsA} x {p.goalsB}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] tracking-widest uppercase font-black inline-block border ${
                              p.statusPix === 'PAID' 
                                ? 'bg-[#009739]/10 text-[#009739] border-[#009739]/30' 
                                : 'bg-[#FFCD00]/10 text-[#FFCD00] border-[#FFCD00]/30 animate-pulse'
                            }`}>
                              {p.statusPix === 'PAID' ? 'Pago & Validado' : 'Aguardando Pix'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {p.statusPix === 'PENDING' ? (
                              <button 
                                onClick={() => confirmPayment(p.id)} 
                                className="inline-flex items-center gap-2 bg-[#009739] hover:bg-[#00702a] text-white font-bold px-3 py-2 rounded-xl transition-all uppercase tracking-widest text-[9px]"
                                title="Confirmar pagamento e enviar link do Whatsapp"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmar Pagamento
                              </button>
                            ) : (
                              <span className="text-white/30 text-xs italic font-bold">Vaga Confirmada ✓</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {predictions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-white/30 font-bold uppercase tracking-widest text-xs">
                            Nenhum palpite registrado até o momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: REGISTER AND MANAGE MATCHES */}
        {activeTab === 'matches' && (
          <motion.div 
            key="matches"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-5 gap-8"
          >
            {/* Match Registration Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-[#FFCD00]" />
                  Cadastrar Jogo
                </h2>
                <p className="text-xs text-white/50 mb-6">Insira um novo confronto esportivo para o bolão da copa.</p>
                
                <form onSubmit={handleAddMatch} className="space-y-4">
                  {/* Team A Picker */}
                  <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-2 block">Selecione ou digite o Time A</span>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <input 
                          required 
                          value={newMatch.teamA} 
                          onChange={e=>setNewMatch({...newMatch, teamA: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" 
                          placeholder="Ex: Brasil" 
                        />
                      </div>
                      <div>
                        <input 
                          required 
                          value={newMatch.teamAFlag} 
                          onChange={e=>setNewMatch({...newMatch, teamAFlag: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-center outline-none focus:border-[#009739]" 
                          placeholder="Bandeira Emoji" 
                        />
                      </div>
                    </div>
                    {/* Quick presets for side A */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                      {COPA_TEAMS.map((t, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => handleQuickSelectTeam('A', t.name, t.flag)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{t.flag}</span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team B Picker */}
                  <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-2 block">Selecione ou digite o Time B</span>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <input 
                          required 
                          value={newMatch.teamB} 
                          onChange={e=>setNewMatch({...newMatch, teamB: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" 
                          placeholder="Ex: Marrocos" 
                        />
                      </div>
                      <div>
                        <input 
                          required 
                          value={newMatch.teamBFlag} 
                          onChange={e=>setNewMatch({...newMatch, teamBFlag: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-center outline-none focus:border-[#009739]" 
                          placeholder="Bandeira Emoji" 
                        />
                      </div>
                    </div>
                    {/* Quick presets for side B */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                      {COPA_TEAMS.map((t, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => handleQuickSelectTeam('B', t.name, t.flag)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{t.flag}</span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date, time, stadium, round */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Data do Jogo</label>
                      <input 
                        required 
                        value={newMatch.date} 
                        onChange={e=>setNewMatch({...newMatch, date: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#009739] text-white" 
                        placeholder="Ex: 18/06/2026" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Horário (UTC)</label>
                      <input 
                        required 
                        value={newMatch.time} 
                        onChange={e=>setNewMatch({...newMatch, time: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#009739] text-white" 
                        placeholder="Ex: 21:00" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Estádio / Arena</label>
                      <input 
                        required 
                        value={newMatch.stadium} 
                        onChange={e=>setNewMatch({...newMatch, stadium: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#009739] text-white" 
                        placeholder="Ex: Maracanã" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Fase do Torneio</label>
                      <input 
                        required 
                        value={newMatch.round} 
                        onChange={e=>setNewMatch({...newMatch, round: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#009739] text-white" 
                        placeholder="Ex: Grupo C" 
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3 px-4 rounded-xl mt-4 transition-all uppercase tracking-widest text-xs shadow-lg">
                    CADASTRAR CONFRONTO
                  </button>
                </form>
              </div>
            </div>

            {/* List Active Registered Matches */}
            <div className="md:col-span-3 space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">Confrontos Monitorados</h2>
                <p className="text-xs text-white/50 mb-6">Ative qual bolão aparecerá em destaque para receber palpites hoje.</p>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {matches.map(m => (
                    <div 
                      key={m.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        activeMatchId === m.id 
                          ? 'bg-gradient-to-r from-[#009739]/10 to-transparent border-[#009739]/50 shadow-md shadow-[#009739]/5' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <span className="text-[9px] uppercase font-black tracking-widest text-[#FFCD00] bg-[#FFCD00]/10 px-2 py-0.5 rounded border border-[#FFCD00]/20">
                          {m.round}
                        </span>
                        
                        <div className="flex items-center gap-1 text-white/40 text-xs font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#009739]" />
                          <span>{m.date} - {m.time}</span>
                        </div>
                      </div>

                      {/* Scoreboard visual style */}
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{m.teamAFlag}</span>
                          <span className="font-bold text-white uppercase text-sm tracking-wider">{m.teamA}</span>
                        </div>
                        <span className="text-xs text-white/20 font-black px-3 py-1 bg-white/5 rounded-lg border border-white/5">VS</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white uppercase text-sm tracking-wider">{m.teamB}</span>
                          <span className="text-2xl">{m.teamBFlag}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold">
                          <MapPin className="w-3 h-3 text-[#FFCD00]" />
                          {m.stadium}
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleDeleteMatch(m.id)}
                            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 bg-rose-500/5 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                            title="Remover Jogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {activeMatchId === m.id ? (
                            <span className="bg-[#009739]/20 text-[#009739] px-3.5 py-1.5 border border-[#009739]/40 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              Bolão do Dia Ativo
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleSetActiveMatch(m.id)} 
                              className="bg-[#009739]/10 hover:bg-[#009739] border border-[#009739]/30 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Destacar Bolão
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {matches.length === 0 && (
                    <p className="text-center text-white/30 italic py-12">Nenhum confronto esportivo cadastrado ainda.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SETTINGS (PIX & REGULAMENTO) */}
        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* PIX Management */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-[#FFCD00]" />
                Financeiro & Pix
              </h2>
              <p className="text-xs text-white/50">Configure o valor padrão cobrado por palpite e a chave pix para transferência.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Valor da Aposta (R$)</label>
                  <input 
                    value={pixValue} 
                    onChange={e=>setPixValue(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono" 
                    placeholder="Ex: 30.00"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Este valor será exibido para todos os participantes antes de enviar palpites.</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Chave Copia-e-Cola PIX ou Celular/Email</label>
                  <textarea 
                    value={pixKey} 
                    onChange={e=>setPixKey(e.target.value)} 
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-xs resize-none" 
                    placeholder="Chave Pix ou Código Copia e Cola"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Insira preferencialmente a chave copia e cola BRCode gerada pelo seu banco.</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">WhatsApp do Administrador (para receber comprovantes)</label>
                  <input 
                    value={adminPhone} 
                    onChange={e=>setAdminPhone(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-sm" 
                    placeholder="Ex: 35991717912"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Insira o número com DDD (apenas números). O sistema usará este telefone para receber comprovantes de palpites.</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Prêmio Acumulado de Rodadas Anteriores (R$)</label>
                  <input 
                    value={accumulatedAmount} 
                    onChange={e=>setAccumulatedAmount(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-sm" 
                    placeholder="Ex: 150.00"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Este valor acumulou de rodadas ou bolões anteriores sem vencimento e será adicionado automaticamente ao prêmio do bolão em destaque.</p>
                </div>
              </div>
            </div>

            {/* Rules editor config */}
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#009739]" />
                  Regulamento do Bolão
                </h2>
                <p className="text-xs text-white/50 mb-6">Insira as regras oficiais. Um parágrafo ou regra de cada vez facilita a visualização.</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] block">Instruções Legais do Bolão</label>
                      <button
                        type="button"
                        onClick={() => {
                          setRegulamento("1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação principal corresponderá a 80% do valor total arrecadado, sendo 20% destinados a despesas administrativas do bolão.\n4. O limite máximo de palpites idênticos (com o mesmo placar correto) é de 5 por partida. Após atingir este limite, o placar ficará indisponível.\n5. O prazo máximo para enviar ou mudar o palpite é de até 10 minutos antes do início de cada confronto.\n6. Em caso de empate e múltiplos acertadores do placar vencedor, os 80% do prêmio acumulado serão divididos entre eles em partes iguais.\n7. Caso não haja ganhadores na rodada (nenhum palpite acertar o placar final), o valor total do prêmio (80% da arrecadação) acumulará automaticamente para a próxima rodada.");
                        }}
                        className="text-[9px] uppercase font-black tracking-widest text-[#FFCD00] hover:text-white bg-white/5 hover:bg-[#FFCD00]/20 px-2.5 py-1 rounded-md transition-all cursor-pointer border border-[#FFCD00]/20"
                      >
                        Regras Padrão (80/20 & Limite 5)
                      </button>
                    </div>
                    <textarea 
                      value={regulamento} 
                      onChange={e=>setRegulamento(e.target.value)} 
                      rows={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white text-xs resize-none"
                      placeholder="Redija as regras uma por linha..."
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={updateSettings} 
                className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg mt-6"
              >
                SALVAR CONFIGURAÇÕES DO BOLÃO
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 4: RESULTS & ACCUMULATIONS */}
        {activeTab === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="glass-card p-6 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5 mb-2">
                <Award className="w-5 h-5 text-[#FFCD00]" />
                Encerramento de Rodadas & Acúmulos
              </h2>
              <p className="text-xs text-white/50">
                Selecione um confronto ativo para lançar o placar oficial, calcular ganhadores e ratear o prêmio. 
                <strong className="text-[#FFCD00] block mt-1">Caso não haja participantes com o palpite correto neste confronto, o prêmio de 80% do valor arrecadado ACUMULA AUTOMATICAMENTE para a próxima rodada!</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: List of matches for result entry */}
              <div className="md:col-span-3 space-y-4">
                {matches.map(m => {
                  const matchPreds = predictions.filter(p => p.matchId === m.id && p.statusPix === 'PAID');
                  const totalCollected = matchPreds.length * parseFloat(pixValue || '30.00');
                  const basePrize = totalCollected * 0.8;
                  const currentAccumulated = parseFloat(accumulatedAmount || '0.00');
                  const totalPrize = basePrize + currentAccumulated;
                  
                  const score = goalsInputs[m.id] || { goalsA: '', goalsB: '' };
                  const isFinished = m.status === 'FINISHED';
                  
                  // Winners
                  const correctGuesses = isFinished 
                    ? matchPreds.filter(p => p.goalsA === m.resultGoalsA && p.goalsB === m.resultGoalsB)
                    : [];

                  return (
                    <div 
                      key={m.id} 
                      className={`p-6 rounded-3xl border transition-all ${
                        isFinished 
                          ? 'bg-gradient-to-r from-emerald-950/20 to-black/35 border-emerald-500/20' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-white bg-black/40 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                            {m.round}
                          </span>
                          {isFinished ? (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded tracking-widest uppercase">
                              ✔ Rodada Encerrada
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-[#FFCD00] bg-[#FFCD00]/10 border border-[#FFCD00]/20 px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                              ⚽ Aguardando Placar
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-white/40">{m.date} às {m.time} • {m.stadium}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        {/* Score display or input */}
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-2.5 w-24">
                            <span className="text-xl">{m.teamAFlag}</span>
                            <span className="font-bold text-xs uppercase tracking-wider text-white truncate">{m.teamA}</span>
                          </div>

                          {isFinished ? (
                            <div className="flex items-center gap-3 font-black text-2xl text-emerald-400 font-mono">
                              <span>{m.resultGoalsA}</span>
                              <span className="text-white/20 text-sm">x</span>
                              <span>{m.resultGoalsB}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min={0}
                                placeholder="0"
                                value={score.goalsA}
                                onChange={e => setGoalsInputs({
                                  ...goalsInputs,
                                  [m.id]: { ...score, goalsA: e.target.value }
                                })}
                                className="w-10 h-10 bg-white/5 border border-white/15 rounded-lg text-center text-lg font-bold text-white outline-none focus:border-[#009739] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-white/30 text-xs font-bold">x</span>
                              <input 
                                type="number" 
                                min={0}
                                placeholder="0"
                                value={score.goalsB}
                                onChange={e => setGoalsInputs({
                                  ...goalsInputs,
                                  [m.id]: { ...score, goalsB: e.target.value }
                                })}
                                className="w-10 h-10 bg-white/5 border border-white/15 text-center text-lg font-bold text-white outline-none focus:border-[#009739] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2.5 w-24 justify-end text-right">
                            <span className="font-bold text-xs uppercase tracking-wider text-white truncate">{m.teamB}</span>
                            <span className="text-xl">{m.teamBFlag}</span>
                          </div>
                        </div>

                        {/* Finance values summary */}
                        <div className="flex flex-col justify-center text-center md:text-left md:pl-4">
                          <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Status Financeiro</p>
                          <div className="grid grid-cols-2 gap-x-4 text-xs font-semibold">
                            <span className="text-white/40 text-left">Palpites Pagos:</span>
                            <span className="text-white text-right">{matchPreds.length}</span>
                            
                            <span className="text-white/40 text-left">Arrecadação:</span>
                            <span className="text-white text-right font-mono">R$ {totalCollected.toFixed(2)}</span>

                            <span className="text-white/40 text-left">Prêmio Base (80%):</span>
                            <span className="text-emerald-400 text-right font-mono font-bold">R$ {basePrize.toFixed(2)}</span>

                            {currentAccumulated > 0 && (
                              <>
                                <span className="text-[#FFCD00] text-left">Acumulado Prévio:</span>
                                <span className="text-[#FFCD00] text-right font-mono font-bold">+ R$ {currentAccumulated.toFixed(2)}</span>
                              </>
                            )}

                            <span className="text-white font-bold border-t border-white/10 mt-1 pt-1 text-left">Prêmio Total:</span>
                            <span className="text-[#FFCD00] font-black text-right border-t border-white/10 mt-1 pt-1 font-mono text-sm shadow-[#FFCD00]/5">
                              R$ {totalPrize.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center justify-center gap-2">
                          {isFinished ? (
                            <button 
                              onClick={() => handleReopenMatch(m.id)}
                              className="w-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Reabrir Confronto
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleFinishMatch(m.id)}
                              className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                            >
                              Encerrar & Ratear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Winners breakdown container */}
                      {isFinished && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          {correctGuesses.length > 0 ? (
                            <div>
                              <p className="text-[10px] uppercase font-black text-[#FFCD00] tracking-widest mb-2 flex items-center gap-1">
                                🏆 Ganhadores Desta Rodada ({correctGuesses.length}) — Prêmio de R$ {(totalPrize / correctGuesses.length).toFixed(2)} cada:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {correctGuesses.map((p, pIdx) => (
                                  <div key={pIdx} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-xs text-white">
                                    <span className="font-extrabold block text-[#FFCD00] uppercase text-[10px]">{p.name}</span>
                                    <span className="text-[9px] font-mono text-white/50">{p.whatsapp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                              <p className="text-xs text-[#FFCD00] font-black uppercase tracking-wider">
                                ❌ Nenhum acertador nesta rodada!
                              </p>
                              <p className="text-[10px] text-white/60 mt-1">
                                O valor de <strong className="text-white font-bold font-mono text-sm text-center">R$ {basePrize.toFixed(2)}</strong> acumulou e foi somado ao acumulado do bolão para ser disputado no próximo jogo!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {matches.length === 0 && (
                  <p className="text-center text-white/30 italic py-12">Nenhum confronto esportivo disponível.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
