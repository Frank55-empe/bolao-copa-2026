import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Users, Check, TrendingUp, Calendar, Trash2, PlusCircle,
  Award, Coins, Activity, FileText, UserCheck, MapPin, Clock,
  Phone, Edit2, X, Search, Filter, Download, History, Bell,
  ChevronDown, RefreshCw, AlertCircle
} from 'lucide-react';
import { api, Prediction } from '../services/api';

const COPA_TEAMS = [
  { name: 'Brasil', flag: '🇧🇷' }, { name: 'Argentina', flag: '🇦🇷' },
  { name: 'França', flag: '🇫🇷' }, { name: 'Espanha', flag: '🇪🇸' },
  { name: 'Portugal', flag: '🇵🇹' }, { name: 'Alemanha', flag: '🇩🇪' },
  { name: 'Uruguai', flag: '🇺🇾' }, { name: 'Marrocos', flag: '🇲🇦' },
  { name: 'Haiti', flag: '🇭🇹' }, { name: 'Estados Unidos', flag: '🇺🇸' },
  { name: 'México', flag: '🇲🇽' }, { name: 'Canadá', flag: '🇨🇦' },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { name: 'Itália', flag: '🇮🇹' },
  { name: 'Senegal', flag: '🇸🇳' }, { name: 'Holanda', flag: '🇳🇱' },
  { name: 'Bélgica', flag: '🇧🇪' }, { name: 'Japão', flag: '🇯🇵' },
  { name: 'Coreia do Sul', flag: '🇰🇷' }, { name: 'Austrália', flag: '🇦🇺' },
  { name: 'Egito', flag: '🇪🇬' }, { name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
];

const EMPTY_MATCH = {
  teamA: '', teamAFlag: '', teamB: '', teamBFlag: '',
  date: '', time: '', stadium: '', round: ''
};

type HistoryEntry = {
  matchId: string; teamA: string; teamB: string;
  resultGoalsA: number; resultGoalsB: number;
  winners: { name: string; whatsapp: string }[];
  prize: number; date: string;
};

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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'settings' | 'results' | 'history'>('dashboard');

  // Dashboard filters
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [filterMatch, setFilterMatch] = useState('ALL');
  const [searchName, setSearchName] = useState('');

  // Match form
  const [newMatch, setNewMatch] = useState(EMPTY_MATCH);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Notification
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Auth ── */
  const login = (e: React.FormEvent) => {
    e.preventDefault();
    // Credenciais verificadas — ideal: mover para variável de ambiente
    if (username === 'Frank' && password === 'mj691811') {
      setIsAuthenticated(true);
    } else {
      showToast('Usuário ou senha incorretos.', 'err');
    }
  };

  /* ── Load ── */
  const loadData = async () => {
    try {
      const [predsData, matchesData, settingsData] = await Promise.all([
        api.getAllPredictions(), api.getMatches(), api.getSettings()
      ]);
      const mapped = predsData.map((p: Prediction) => {
        const m: any = matchesData.find((mx: any) => mx.id === p.matchId) || {};
        return { ...p, teamA: m.teamA || '?', teamB: m.teamB || '?', teamAFlag: m.teamAFlag || '❔', teamBFlag: m.teamBFlag || '❔' };
      });
      setPredictions(mapped);
      setMatches(matchesData);
      setPixValue(settingsData.pix_value || '');
      setPixKey(settingsData.pix_key || '');
      setRegulamento(settingsData.regulamento || '');
      setActiveMatchId(settingsData.active_match_id || '');
      setAdminPhone(settingsData.admin_phone || '');
      setAccumulatedAmount(settingsData.accumulated_amount || '0.00');

      // Carregar histórico do localStorage
      const savedHistory = localStorage.getItem('bolao_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Erro ao carregar dados da planilha.', 'err');
    }
  };

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  /* ── Filtered predictions ── */
  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const statusOk = filterStatus === 'ALL' ||
        (filterStatus === 'PAID' && p.statusPix === 'PAID') ||
        (filterStatus === 'PENDING' && p.statusPix !== 'PAID');
      const matchOk = filterMatch === 'ALL' || p.matchId === filterMatch;
      const nameOk = !searchName || p.name.toLowerCase().includes(searchName.toLowerCase()) || p.whatsapp.includes(searchName);
      return statusOk && matchOk && nameOk;
    });
  }, [predictions, filterStatus, filterMatch, searchName]);

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [['Data', 'Nome', 'WhatsApp', 'Jogo', 'Palpite', 'Status']];
    filteredPredictions.forEach(p => {
      rows.push([
        new Date(p.createdAt).toLocaleString(),
        p.name, p.whatsapp,
        `${p.teamA} x ${p.teamB}`,
        `${p.goalsA} x ${p.goalsB}`,
        p.statusPix === 'PAID' ? 'Pago' : 'Pendente'
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'palpites.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Notify all winners ── */
  const notifyAllWinners = (winners: { name: string; whatsapp: string }[], matchLabel: string, prize: number, individual: number) => {
    winners.forEach(w => {
      const msg = `🏆 Parabéns, ${w.name}! Você acertou o placar de ${matchLabel} no Bolão Copa 2026! Seu prêmio é R$ ${individual.toFixed(2)} (de R$ ${prize.toFixed(2)} total dividido entre ${winners.length}). Em breve entraremos em contato para o pagamento!`;
      const phone = w.whatsapp.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    });
    showToast(`WhatsApp aberto para ${winners.length} ganhador(es)!`);
  };

  /* ── Confirm payment ── */
  const confirmPayment = async (id: number) => {
    try {
      const data = await api.confirmPayment(id);
      if (data.waLink) window.open(data.waLink, '_blank', 'noopener,noreferrer');
      showToast('Pagamento confirmado!');
      loadData();
    } catch (e) { showToast('Erro ao confirmar pagamento', 'err'); }
  };

  /* ── Bulk confirm (all pending of a match) ── */
  const bulkConfirm = async (matchId: string) => {
    const pending = predictions.filter(p => p.matchId === matchId && p.statusPix !== 'PAID');
    if (!pending.length) { showToast('Nenhum pendente neste jogo.', 'err'); return; }
    if (!confirm(`Confirmar ${pending.length} pagamento(s) pendentes deste jogo?`)) return;
    for (const p of pending) await api.confirmPayment(p.id);
    showToast(`${pending.length} pagamento(s) confirmados!`);
    loadData();
  };

  /* ── Match CRUD ── */
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingMatch || newMatch;
    if (!data.teamA || !data.teamB) { showToast('Preencha os times.', 'err'); return; }
    const matchId = editingMatch?.id || Date.now().toString();
    await api.saveMatch({ ...data, id: matchId });
    setNewMatch(EMPTY_MATCH);
    setEditingMatch(null);
    showToast(editingMatch ? 'Jogo atualizado!' : 'Jogo cadastrado!');
    loadData();
  };

  const handleSetActiveMatch = async (matchId: string) => {
    await api.saveSettings({ active_match_id: matchId });
    showToast('Bolão do Dia atualizado!');
    loadData();
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Remover este jogo permanentemente?')) return;
    await api.deleteMatch(id);
    showToast('Jogo removido.');
    loadData();
  };

  /* ── Finish match ── */
  const handleFinishMatch = async (matchId: string) => {
    const score = goalsInputs[matchId];
    if (!score || score.goalsA === '' || score.goalsB === '') {
      showToast('Informe o placar de ambos os times.', 'err'); return;
    }
    const goalsA = parseInt(score.goalsA, 10);
    const goalsB = parseInt(score.goalsB, 10);
    if (isNaN(goalsA) || isNaN(goalsB)) { showToast('Placar inválido.', 'err'); return; }

    const matchToUpdate = matches.find(m => m.id === matchId);
    if (!matchToUpdate) return;
    if (!confirm(`Confirmar encerramento: ${matchToUpdate.teamA} ${goalsA} x ${goalsB} ${matchToUpdate.teamB}?`)) return;

    try {
      await api.saveMatch({ ...matchToUpdate, resultGoalsA: goalsA, resultGoalsB: goalsB, status: 'FINISHED' });

      const matchPreds = predictions.filter(p => p.matchId === matchId && p.statusPix === 'PAID');
      const totalCollected = matchPreds.length * parseFloat(pixValue || '30.00');
      const basePrize = totalCollected * 0.8;
      const currentAccumulated = parseFloat(accumulatedAmount || '0.00');
      const totalPrize = basePrize + currentAccumulated;
      const correctGuesses = matchPreds.filter(p => p.goalsA === goalsA && p.goalsB === goalsB);

      // Save to history
      const entry: HistoryEntry = {
        matchId, teamA: matchToUpdate.teamA, teamB: matchToUpdate.teamB,
        resultGoalsA: goalsA, resultGoalsB: goalsB,
        winners: correctGuesses.map(p => ({ name: p.name, whatsapp: p.whatsapp })),
        prize: totalPrize, date: new Date().toLocaleString()
      };
      const newHistory = [entry, ...history];
      setHistory(newHistory);
      localStorage.setItem('bolao_history', JSON.stringify(newHistory));

      if (correctGuesses.length > 0) {
        const individual = totalPrize / correctGuesses.length;
        const wantNotify = confirm(`🏆 ${correctGuesses.length} ganhador(es)! Prêmio R$ ${totalPrize.toFixed(2)} (R$ ${individual.toFixed(2)} cada).\n\nDeseja abrir WhatsApp para TODOS os ganhadores agora?`);
        if (wantNotify) notifyAllWinners(correctGuesses, `${matchToUpdate.teamA} x ${matchToUpdate.teamB}`, totalPrize, individual);
        await api.saveSettings({ accumulated_amount: '0.00' });
      } else {
        const newAcc = (currentAccumulated + basePrize).toFixed(2);
        alert(`❌ Sem ganhadores!\n\nR$ ${basePrize.toFixed(2)} acumulou.\nNovo acumulado: R$ ${newAcc}`);
        await api.saveSettings({ accumulated_amount: newAcc });
      }
      showToast('Rodada encerrada!');
      loadData();
    } catch (e) { showToast('Erro ao encerrar rodada.', 'err'); }
  };

  const handleReopenMatch = async (matchId: string) => {
    const m = matches.find(mx => mx.id === matchId);
    if (!m || !confirm(`Reabrir ${m.teamA} x ${m.teamB}?`)) return;
    try {
      await api.saveMatch({ ...m, resultGoalsA: undefined, resultGoalsB: undefined, status: 'PENDING' });
      showToast('Confronto reaberto!');
      loadData();
    } catch { showToast('Erro ao reabrir.', 'err'); }
  };

  /* ── Settings ── */
  const updateSettings = async () => {
    try {
      await api.saveSettings({ pix_value: pixValue, pix_key: pixKey, regulamento, admin_phone: adminPhone, accumulated_amount: accumulatedAmount });
      showToast('Configurações salvas!');
      loadData();
    } catch { showToast('Erro ao salvar configurações.', 'err'); }
  };

  /* ── Stats ── */
  const paidCount = predictions.filter(p => p.statusPix === 'PAID').length;
  const pendingCount = predictions.filter(p => p.statusPix !== 'PAID').length;

  /* ═══════════════════════════════ LOGIN ═══════════════════════════════ */
  if (!isAuthenticated) return (
    <div className="max-w-md w-full mx-auto pb-8">
      <div className="text-center mb-6">
        <h1 className="title-display text-4xl text-white mb-2">BOLÃO COPA</h1>
        <p className="text-sm text-white/50 uppercase tracking-widest font-black">Área Restrita</p>
      </div>
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold text-center ${toast.type === 'ok' ? 'bg-green-700/50 text-green-200' : 'bg-red-700/50 text-red-200'}`}>
          {toast.msg}
        </div>
      )}
      <div className="glass-card rounded-3xl p-8 border-2 border-white/20">
        <div className="w-16 h-16 rounded-full bg-[#009739]/20 border border-[#009739]/50 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-[#009739] animate-spin-slow" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-6 font-display">Administração</h2>
        <div onSubmit={(e) => { e.preventDefault(); login(e); }} className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Login</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Frank"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="******"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all" />
          </div>
        </div>
        <button onClick={login} className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white uppercase tracking-widest font-bold rounded-xl py-3.5 hover:scale-[1.02] active:scale-95 transition-all text-xs">
          ENTRAR NO PAINEL
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════ PAINEL ═══════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto w-full pb-8">

      {/* Toast global */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl border ${toast.type === 'ok' ? 'bg-[#009739] border-[#009739]/50 text-white' : 'bg-red-600 border-red-500/50 text-white'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
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

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl self-start md:self-auto border border-white/10 flex-wrap gap-1">
          {([
            ['dashboard', 'Palpites'],
            ['matches', 'Jogos'],
            ['results', 'Resultados'],
            ['history', 'Histórico'],
            ['settings', 'Ajustes'],
          ] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab ? 'bg-[#009739] text-white shadow-md' : 'text-white/60 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Palpites', value: predictions.length, icon: <Users className="w-4 h-4 text-[#FFCD00]" />, color: 'text-white' },
          { label: 'PIX Confirmados', value: paidCount, icon: <UserCheck className="w-4 h-4 text-[#009739]" />, color: 'text-[#009739]' },
          { label: 'Aguardando PIX', value: pendingCount, icon: <Clock className="w-4 h-4 text-orange-400" />, color: 'text-orange-400' },
          { label: 'Jogos Criados', value: matches.length, icon: <Calendar className="w-4 h-4 text-[#009739]" />, color: 'text-white' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-white/40 mb-1 font-bold uppercase tracking-wider text-[9px]">{s.icon}{s.label}</div>
              <p className={`text-2xl font-display font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ TAB: DASHBOARD ═══ */}
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">

            {/* Filter bar */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Buscar nome ou WhatsApp..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#009739] placeholder:text-white/20" />
              </div>

              {/* Status filter */}
              <div className="flex gap-1.5">
                {(['ALL', 'PENDING', 'PAID'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${filterStatus === s
                      ? s === 'PAID' ? 'bg-[#009739] border-[#009739] text-white' : s === 'PENDING' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}>
                    {s === 'ALL' ? 'Todos' : s === 'PAID' ? '✅ Pagos' : '⏳ Pendentes'}
                    {s !== 'ALL' && <span className="ml-1 opacity-70">
                      ({s === 'PAID' ? paidCount : pendingCount})
                    </span>}
                  </button>
                ))}
              </div>

              {/* Match filter */}
              <select value={filterMatch} onChange={e => setFilterMatch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#009739] cursor-pointer">
                <option value="ALL">Todos os jogos</option>
                {matches.map(m => <option key={m.id} value={m.id}>{m.teamA} x {m.teamB}</option>)}
              </select>

              {/* Actions */}
              <button onClick={loadData} className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer" title="Atualizar">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-[#FFCD00] transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                <Download className="w-3 h-3" /> Exportar CSV
              </button>
            </div>

            {/* Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-white/15">
              <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <p className="text-xs text-white/50 font-bold">{filteredPredictions.length} resultado(s)</p>
                {filterMatch !== 'ALL' && (
                  <button onClick={() => bulkConfirm(filterMatch)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#FFCD00] hover:text-white bg-[#FFCD00]/10 hover:bg-[#FFCD00]/20 px-3 py-1.5 rounded-lg border border-[#FFCD00]/20 transition-all cursor-pointer">
                    ⚡ Confirmar todos pendentes deste jogo
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                  <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3">Data</th>
                      <th className="px-5 py-3">Participante</th>
                      <th className="px-5 py-3">Jogo</th>
                      <th className="px-5 py-3">Palpite</th>
                      <th className="px-5 py-3">Status PIX</th>
                      <th className="px-5 py-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPredictions.map(p => (
                      <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.statusPix !== 'PAID' ? 'border-l-2 border-orange-500/50' : ''}`}>
                        <td className="px-5 py-3 whitespace-nowrap text-[10px] text-white/40">
                          {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-white block text-xs uppercase tracking-wider">{p.name}</span>
                          <span className="text-[10px] text-white/40 font-mono">{p.whatsapp}</span>
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-white uppercase tracking-wide">
                          <span className="inline-flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/5 text-[10px]">
                            {p.teamAFlag} {p.teamA} <span className="text-white/20">×</span> {p.teamBFlag} {p.teamB}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-black text-[#FFCD00] text-lg">{p.goalsA} × {p.goalsB}</td>
                        <td className="px-5 py-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] tracking-widest uppercase font-black inline-block border ${p.statusPix === 'PAID'
                            ? 'bg-[#009739]/10 text-[#009739] border-[#009739]/30'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse'}`}>
                            {p.statusPix === 'PAID' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {p.statusPix !== 'PAID' ? (
                            <button onClick={() => confirmPayment(p.id)}
                              className="inline-flex items-center gap-1.5 bg-[#009739] hover:bg-[#00702a] text-white font-bold px-3 py-1.5 rounded-xl transition-all text-[9px] uppercase tracking-widest cursor-pointer">
                              <Check className="w-3 h-3" /> Confirmar
                            </button>
                          ) : (
                            <span className="text-white/20 text-[10px] italic">Confirmado ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredPredictions.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-16 text-center text-white/30 font-bold uppercase tracking-widest text-xs">
                        Nenhum resultado encontrado.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: JOGOS ═══ */}
        {activeTab === 'matches' && (
          <motion.div key="matches" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid md:grid-cols-5 gap-8">

            {/* Form */}
            <div className="md:col-span-2">
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                  {editingMatch ? <Edit2 className="w-4 h-4 text-[#FFCD00]" /> : <PlusCircle className="w-4 h-4 text-[#FFCD00]" />}
                  {editingMatch ? 'Editar Jogo' : 'Cadastrar Jogo'}
                </h2>
                {editingMatch && (
                  <p className="text-[10px] text-orange-400 mb-4 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Editando: {editingMatch.teamA} x {editingMatch.teamB}
                  </p>
                )}
                <p className="text-xs text-white/40 mb-5">{editingMatch ? 'Altere os dados e salve.' : 'Cadastre um novo confronto.'}</p>

                <div className="space-y-4">
                  {(['A', 'B'] as const).map(side => {
                    const data = editingMatch || newMatch;
                    const setData = editingMatch ? setEditingMatch : setNewMatch;
                    const teamKey = `team${side}` as 'teamA' | 'teamB';
                    const flagKey = `team${side}Flag` as 'teamAFlag' | 'teamBFlag';
                    return (
                      <div key={side} className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-2 block">Time {side}</span>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input required value={data[teamKey]} onChange={e => setData({ ...data, [teamKey]: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="Nome do time" />
                          <input required value={data[flagKey]} onChange={e => setData({ ...data, [flagKey]: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-center outline-none focus:border-[#009739] text-white" placeholder="🏳️ Emoji" />
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {COPA_TEAMS.map((t, i) => (
                            <button key={i} type="button" onClick={() => setData({ ...data, [teamKey]: t.name, [flagKey]: t.flag })}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/5 rounded-lg text-[9px] text-white transition-all cursor-pointer">
                              {t.flag} {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Data', key: 'date', placeholder: '18/06/2026' },
                      { label: 'Horário', key: 'time', placeholder: '21:00' },
                      { label: 'Estádio', key: 'stadium', placeholder: 'Maracanã' },
                      { label: 'Fase', key: 'round', placeholder: 'Grupo C' },
                    ].map(f => {
                      const data = editingMatch || newMatch;
                      const setData = editingMatch ? setEditingMatch : setNewMatch;
                      return (
                        <div key={f.key}>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">{f.label}</label>
                          <input required value={(data as any)[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder={f.placeholder} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveMatch}
                      className="flex-1 bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg cursor-pointer">
                      {editingMatch ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR JOGO'}
                    </button>
                    {editingMatch && (
                      <button onClick={() => setEditingMatch(null)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="md:col-span-3">
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-1">Jogos Cadastrados</h2>
                <p className="text-xs text-white/40 mb-5">Ative, edite ou remova confrontos.</p>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {matches.map(m => (
                    <div key={m.id} className={`p-4 rounded-2xl border transition-all ${activeMatchId === m.id ? 'bg-[#009739]/10 border-[#009739]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#FFCD00] bg-[#FFCD00]/10 px-2 py-0.5 rounded border border-[#FFCD00]/20">{m.round}</span>
                        <span className="text-[10px] font-mono text-white/30">{m.date} {m.time}</span>
                      </div>
                      <div className="flex items-center justify-between bg-black/30 px-4 py-3 rounded-xl border border-white/5 mb-3">
                        <span className="font-bold text-white text-sm">{m.teamAFlag} {m.teamA}</span>
                        <span className="text-white/20 text-xs font-black">VS</span>
                        <span className="font-bold text-white text-sm">{m.teamB} {m.teamBFlag}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FFCD00]" />{m.stadium}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditingMatch({ ...m }); setActiveTab('matches'); }}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 bg-blue-500/5 rounded-lg border border-blue-500/20 transition-all cursor-pointer" title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteMatch(m.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/20 bg-rose-500/5 rounded-lg border border-rose-500/20 transition-all cursor-pointer" title="Remover">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {activeMatchId === m.id ? (
                            <span className="bg-[#009739]/20 text-[#009739] px-2.5 py-1 border border-[#009739]/40 rounded-lg text-[9px] font-black uppercase">
                              ✅ Ativo
                            </span>
                          ) : (
                            <button onClick={() => handleSetActiveMatch(m.id)}
                              className="bg-[#009739]/10 hover:bg-[#009739] border border-[#009739]/30 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-colors cursor-pointer">
                              Destacar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {matches.length === 0 && <p className="text-center text-white/30 italic py-12 text-sm">Nenhum jogo cadastrado.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: RESULTADOS ═══ */}
        {activeTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-[#FFCD00]" /> Encerramento de Rodadas
              </h2>
              <p className="text-xs text-white/50">Lance o placar final. Se não houver ganhadores, o prêmio acumula automaticamente.</p>
            </div>

            {matches.map(m => {
              const matchPreds = predictions.filter(p => p.matchId === m.id && p.statusPix === 'PAID');
              const totalCollected = matchPreds.length * parseFloat(pixValue || '30.00');
              const basePrize = totalCollected * 0.8;
              const currentAccumulated = parseFloat(accumulatedAmount || '0.00');
              const totalPrize = basePrize + currentAccumulated;
              const score = goalsInputs[m.id] || { goalsA: '', goalsB: '' };
              const isFinished = m.status === 'FINISHED';
              const correctGuesses = isFinished ? matchPreds.filter(p => p.goalsA === m.resultGoalsA && p.goalsB === m.resultGoalsB) : [];

              return (
                <div key={m.id} className={`p-6 rounded-3xl border transition-all ${isFinished ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-black/40 border border-white/10 px-2.5 py-1 rounded-full text-white">{m.round}</span>
                      {isFinished
                        ? <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">✔ Encerrada</span>
                        : <span className="text-[9px] font-black text-[#FFCD00] bg-[#FFCD00]/10 border border-[#FFCD00]/20 px-2 py-0.5 rounded animate-pulse">⚽ Aguardando</span>}
                    </div>
                    <span className="text-[10px] font-mono text-white/30">{m.date} • {m.stadium}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Score */}
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 w-24">
                        <span className="text-xl">{m.teamAFlag}</span>
                        <span className="font-bold text-xs uppercase text-white truncate">{m.teamA}</span>
                      </div>
                      {isFinished ? (
                        <span className="font-black text-2xl text-emerald-400 font-mono">{m.resultGoalsA} × {m.resultGoalsB}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {['A', 'B'].map((s, idx) => (
                            <React.Fragment key={s}>
                              {idx === 1 && <span className="text-white/20 text-xs font-bold">×</span>}
                              <input type="number" min={0} placeholder="0"
                                value={s === 'A' ? score.goalsA : score.goalsB}
                                onChange={e => setGoalsInputs({ ...goalsInputs, [m.id]: { ...score, [`goals${s}`]: e.target.value } })}
                                className="w-10 h-10 bg-white/5 border border-white/15 rounded-lg text-center text-lg font-bold text-white outline-none focus:border-[#009739] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 w-24 justify-end">
                        <span className="font-bold text-xs uppercase text-white truncate">{m.teamB}</span>
                        <span className="text-xl">{m.teamBFlag}</span>
                      </div>
                    </div>

                    {/* Finance */}
                    <div className="text-xs space-y-1">
                      <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Financeiro</p>
                      {[
                        ['Palpites pagos', matchPreds.length, 'text-white'],
                        ['Arrecadado', `R$ ${totalCollected.toFixed(2)}`, 'text-white'],
                        ['Prêmio (80%)', `R$ ${basePrize.toFixed(2)}`, 'text-emerald-400'],
                        ...(currentAccumulated > 0 ? [['Acumulado', `+ R$ ${currentAccumulated.toFixed(2)}`, 'text-[#FFCD00]']] : []),
                        ['Total', `R$ ${totalPrize.toFixed(2)}`, 'text-[#FFCD00] font-black'],
                      ].map(([l, v, c], i) => (
                        <div key={i} className={`flex justify-between ${i === (currentAccumulated > 0 ? 4 : 3) ? 'border-t border-white/10 pt-1 mt-1' : ''}`}>
                          <span className="text-white/40">{l}</span>
                          <span className={c as string}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    <div className="flex flex-col gap-2">
                      {isFinished ? (
                        <>
                          <button onClick={() => handleReopenMatch(m.id)}
                            className="w-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer">
                            Reabrir Confronto
                          </button>
                          {correctGuesses.length > 0 && (
                            <button onClick={() => notifyAllWinners(correctGuesses, `${m.teamA} x ${m.teamB}`, totalPrize, totalPrize / correctGuesses.length)}
                              className="w-full bg-[#FFCD00]/10 hover:bg-[#FFCD00]/20 text-[#FFCD00] border border-[#FFCD00]/30 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2">
                              <Bell className="w-3.5 h-3.5" /> Notificar Ganhadores
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => handleFinishMatch(m.id)}
                          className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.02] shadow-md">
                          Encerrar & Ratear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Winners */}
                  {isFinished && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      {correctGuesses.length > 0 ? (
                        <div>
                          <p className="text-[10px] uppercase font-black text-[#FFCD00] tracking-widest mb-2">
                            🏆 {correctGuesses.length} ganhador(es) — R$ {(totalPrize / correctGuesses.length).toFixed(2)} cada:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {correctGuesses.map((p, i) => (
                              <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
                                <span className="font-extrabold block text-[#FFCD00] uppercase text-[10px]">{p.name}</span>
                                <span className="text-[9px] font-mono text-white/50">{p.whatsapp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                          <p className="text-xs text-[#FFCD00] font-black uppercase">❌ Sem acertadores — R$ {basePrize.toFixed(2)} acumulou!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {matches.length === 0 && <p className="text-center text-white/30 italic py-12">Nenhum confronto disponível.</p>}
          </motion.div>
        )}

        {/* ═══ TAB: HISTÓRICO ═══ */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-[#FFCD00]" /> Histórico de Rodadas
                </h2>
                <p className="text-xs text-white/40 mt-0.5">Rodadas encerradas com seus respectivos ganhadores e prêmios.</p>
              </div>
              {history.length > 0 && (
                <button onClick={() => { if (confirm('Limpar todo o histórico?')) { setHistory([]); localStorage.removeItem('bolao_history'); } }}
                  className="text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all cursor-pointer">
                  Limpar
                </button>
              )}
            </div>

            {history.length === 0 && (
              <div className="glass-card p-12 rounded-3xl border border-white/10 text-center">
                <History className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 font-bold uppercase tracking-widest text-sm">Nenhuma rodada encerrada ainda.</p>
                <p className="text-white/20 text-xs mt-1">O histórico aparece aqui após encerrar rodadas na aba Resultados.</p>
              </div>
            )}

            {history.map((entry, idx) => (
              <div key={idx} className="glass-card p-5 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-white">{entry.teamA}</span>
                    <span className="font-black text-[#FFCD00] text-xl font-mono">{entry.resultGoalsA} × {entry.resultGoalsB}</span>
                    <span className="text-2xl font-black text-white">{entry.teamB}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-white/30 font-mono">{entry.date}</p>
                    <p className="text-[10px] font-black text-emerald-400">Prêmio R$ {entry.prize.toFixed(2)}</p>
                  </div>
                </div>
                {entry.winners.length > 0 ? (
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-[#FFCD00] mb-2">
                      🏆 {entry.winners.length} ganhador(es) — R$ {(entry.prize / entry.winners.length).toFixed(2)} cada:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.winners.map((w, wi) => (
                        <span key={wi} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white">
                          {w.name} <span className="text-white/30 font-mono">{w.whatsapp}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-orange-400 font-bold">❌ Sem ganhadores — prêmio acumulou</p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ═══ TAB: AJUSTES ═══ */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#FFCD00]" /> Financeiro & PIX
              </h2>
              {[
                { label: 'Valor da Aposta (R$)', key: 'pixValue', val: pixValue, set: setPixValue, placeholder: '30.00', hint: 'Exibido para todos os participantes.' },
                { label: 'Chave / Código PIX', key: 'pixKey', val: pixKey, set: setPixKey, placeholder: 'Cole o BRCode aqui', hint: 'Prefira o código copia-e-cola gerado pelo banco.', textarea: true, rows: 4 },
                { label: 'WhatsApp Admin (DDD + número)', key: 'adminPhone', val: adminPhone, set: setAdminPhone, placeholder: '35991717912', hint: 'Recebe comprovantes dos participantes.' },
                { label: 'Prêmio Acumulado (R$)', key: 'accumulated', val: accumulatedAmount, set: setAccumulatedAmount, placeholder: '0.00', hint: 'Soma de rodadas anteriores sem ganhadores.' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">{f.label}</label>
                  {f.textarea ? (
                    <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={f.rows}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-xs resize-none" placeholder={f.placeholder} />
                  ) : (
                    <input value={f.val} onChange={e => f.set(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-sm" placeholder={f.placeholder} />
                  )}
                  {f.hint && <p className="text-[9px] text-white/30 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col gap-5">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#009739]" /> Regulamento
              </h2>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00]">Regras do Bolão</label>
                  <button type="button" onClick={() => setRegulamento(
                    '1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação principal corresponde a 80% do valor arrecadado; 20% cobrem despesas administrativas.\n4. O limite de palpites idênticos é 5 por partida.\n5. Prazo máximo para palpite: 10 minutos antes do início do jogo.\n6. Com múltiplos acertadores, o prêmio é dividido em partes iguais.\n7. Sem ganhadores, o prêmio de 80% acumula para a próxima rodada.'
                  )} className="text-[9px] uppercase font-black text-[#FFCD00] hover:text-white bg-white/5 hover:bg-[#FFCD00]/20 px-2.5 py-1 rounded-md border border-[#FFCD00]/20 transition-all cursor-pointer">
                    Regras Padrão
                  </button>
                </div>
                <textarea value={regulamento} onChange={e => setRegulamento(e.target.value)} rows={12}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white text-xs resize-none" placeholder="Uma regra por linha..." />
              </div>
              <button onClick={updateSettings}
                className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg cursor-pointer">
                SALVAR CONFIGURAÇÕES
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
