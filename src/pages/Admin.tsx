import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Users, Check, TrendingUp, Calendar, Trash2, PlusCircle,
  Award, Coins, Activity, FileText, UserCheck, MapPin, Clock,
  Phone, Filter, Edit2, X, Save, Send, RefreshCw, Download,
  ChevronDown, AlertCircle, Trophy, History, Search
} from 'lucide-react';
import { api, Prediction } from '../services/api';
import type { MatchData } from '../services/api';

// ─── Admin credentials (move to env for production) ───────────────────────
const ADMIN_USER = 'Frank';
const ADMIN_PASS = 'mj691811';

// ─── Teams list ────────────────────────────────────────────────────────────
const COPA_TEAMS = [
  { name: 'Brasil',         flag: 'https://flagcdn.com/w160/br.png' },
  { name: 'Argentina',      flag: 'https://flagcdn.com/w160/ar.png' },
  { name: 'França',         flag: 'https://flagcdn.com/w160/fr.png' },
  { name: 'Espanha',        flag: 'https://flagcdn.com/w160/es.png' },
  { name: 'Portugal',       flag: 'https://flagcdn.com/w160/pt.png' },
  { name: 'Alemanha',       flag: 'https://flagcdn.com/w160/de.png' },
  { name: 'Inglaterra',     flag: 'https://flagcdn.com/w160/gb-eng.png' },
  { name: 'Holanda',        flag: 'https://flagcdn.com/w160/nl.png' },
  { name: 'Bélgica',        flag: 'https://flagcdn.com/w160/be.png' },
  { name: 'Uruguai',        flag: 'https://flagcdn.com/w160/uy.png' },
  { name: 'Marrocos',       flag: 'https://flagcdn.com/w160/ma.png' },
  { name: 'Senegal',        flag: 'https://flagcdn.com/w160/sn.png' },
  { name: 'México',         flag: 'https://flagcdn.com/w160/mx.png' },
  { name: 'EUA',            flag: 'https://flagcdn.com/w160/us.png' },
  { name: 'Canadá',         flag: 'https://flagcdn.com/w160/ca.png' },
  { name: 'Japão',          flag: 'https://flagcdn.com/w160/jp.png' },
  { name: 'Coreia do Sul',  flag: 'https://flagcdn.com/w160/kr.png' },
  { name: 'Escócia',        flag: 'https://flagcdn.com/w160/gb-sct.png' },
  { name: 'Haiti',          flag: 'https://flagcdn.com/w160/ht.png' },
  { name: 'Croácia',        flag: 'https://flagcdn.com/w160/hr.png' },
  { name: 'Suíça',          flag: 'https://flagcdn.com/w160/ch.png' },
  { name: 'Egito',          flag: 'https://flagcdn.com/w160/eg.png' },
  { name: 'Arábia Saudita', flag: 'https://flagcdn.com/w160/sa.png' },
  { name: 'Catar',          flag: 'https://flagcdn.com/w160/qa.png' },
  { name: 'África do Sul',  flag: 'https://flagcdn.com/w160/za.png' },
  { name: 'Noruega',        flag: 'https://flagcdn.com/w160/no.png' },
  { name: 'Argélia',        flag: 'https://flagcdn.com/w160/dz.png' },
  { name: 'Equador',        flag: 'https://flagcdn.com/w160/ec.png' },
  { name: 'Paraguai',       flag: 'https://flagcdn.com/w160/py.png' },
  { name: 'Jordânia',       flag: 'https://flagcdn.com/w160/jo.png' },
];

const EMPTY_MATCH = {
  teamA: '', teamAFlag: '', teamB: '', teamBFlag: '',
  date: '', time: '', stadium: '', round: ''
};

// ─── Helper ────────────────────────────────────────────────────────────────
function formatDate(str: string) {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return str; }
}

function exportCSV(predictions: Prediction[]) {
  const header = ['ID','Jogo','Nome','WhatsApp','GolsA','GolsB','Status','Data'];
  const rows = predictions.map(p => [
    p.id, p.matchId, p.name, p.whatsapp, p.goalsA, p.goalsB, p.statusPix, p.createdAt
  ]);
  const csv = [header, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'palpites-bolao.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════
export default function Admin() {
  // ── Auth ──────────────────────────────────────────────────────────────
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Data ──────────────────────────────────────────────────────────────
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [pixValue, setPixValue] = useState('30.00');
  const [pixKey, setPixKey] = useState('');
  const [regulamento, setRegulamento] = useState('');
  const [activeMatchId, setActiveMatchId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [accumulatedAmount, setAccumulatedAmount] = useState('0.00');
  const [predictionsLocked, setPredictionsLocked] = useState(false);
  const [savingLock, setSavingLock] = useState(false);

  // ── UI State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard'|'matches'|'results'|'settings'|'history'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Dashboard filters
  const [filterStatus, setFilterStatus] = useState<'ALL'|'PENDING'|'PAID'>('ALL');
  const [filterMatch, setFilterMatch] = useState('ALL');
  const [searchName, setSearchName] = useState('');

  // Match form
  const [matchForm, setMatchForm] = useState(EMPTY_MATCH);
  const [editingMatchId, setEditingMatchId] = useState<string|null>(null);
  const [showTeamPickerA, setShowTeamPickerA] = useState(false);
  const [showTeamPickerB, setShowTeamPickerB] = useState(false);

  // Results
  const [goalsInputs, setGoalsInputs] = useState<Record<string, { goalsA: string; goalsB: string }>>({});

  // History
  const [history, setHistory] = useState<any[]>([]);

  // ── Load ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [predsData, matchesData, settingsData] = await Promise.all([
        api.getAllPredictions(),
        api.getMatches(),
        api.getSettings()
      ]);
      const mapped = predsData.map(p => {
        const m: any = matchesData.find((mx: any) => mx.id === p.matchId) || {};
        return { ...p, teamA: m.teamA || p.teamA || '—', teamB: m.teamB || p.teamB || '—',
                 teamAFlag: m.teamAFlag || p.teamAFlag || '', teamBFlag: m.teamBFlag || p.teamBFlag || '' };
      });
      setPredictions(mapped);
      setMatches(matchesData);
      setPixValue(settingsData.pix_value || '30.00');
      setPixKey(settingsData.pix_key || '');
      setRegulamento(settingsData.regulamento || '');
      setActiveMatchId(String(settingsData.active_match_id || ''));
      setAdminPhone(settingsData.admin_phone || '');
      setAccumulatedAmount(settingsData.accumulated_amount || '0.00');
      setPredictionsLocked(String(settingsData.predictions_locked || 'false').trim() === 'true');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAuth) loadData(); }, [isAuth]);

  // ── Filtered predictions ───────────────────────────────────────────────
  const filtered = useMemo(() => predictions.filter(p => {
    if (filterStatus !== 'ALL' && p.statusPix !== filterStatus) return false;
    if (filterMatch !== 'ALL' && p.matchId !== filterMatch) return false;
    if (searchName && !p.name.toLowerCase().includes(searchName.toLowerCase()) &&
        !p.whatsapp.includes(searchName)) return false;
    return true;
  }), [predictions, filterStatus, filterMatch, searchName]);

  const pendingCount = predictions.filter(p => p.statusPix === 'PENDING' || p.statusPix === 'PENDENTE').length;
  const paidCount    = predictions.filter(p => p.statusPix === 'PAID'    || p.statusPix === 'PAGO').length;

  // ── Actions ───────────────────────────────────────────────────────────
  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuth(true); setLoginError('');
    } else { setLoginError('Usuário ou senha incorretos.'); }
  };

  const confirmPayment = async (id: number) => {
    try {
      const data = await api.confirmPayment(id);
      if (data.waLink) window.open(data.waLink, '_blank', 'noopener,noreferrer');
      await loadData();
    } catch { alert('Erro ao confirmar pagamento'); }
  };

  const notifyAllWinners = (winners: Prediction[], prize: number) => {
    winners.forEach((p, i) => {
      setTimeout(() => {
        const msg = `🏆 Parabéns ${p.name}! Você ACERTOU o placar e ganhou R$ ${prize.toFixed(2)} no Bolão Copa 2026! Entre em contato para receber seu prêmio. ⚽`;
        const fone = p.whatsapp.replace(/\D/g, '');
        window.open(`https://api.whatsapp.com/send?phone=55${fone}&text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      }, i * 800);
    });
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.teamA || !matchForm.teamB) { alert('Preencha os nomes dos times.'); return; }
    const id = editingMatchId || Date.now().toString();
    await api.saveMatch({ ...matchForm, id });
    setMatchForm(EMPTY_MATCH);
    setEditingMatchId(null);
    await loadData();
    alert(editingMatchId ? 'Jogo atualizado!' : 'Jogo cadastrado!');
  };

  const startEditMatch = (m: MatchData) => {
    setMatchForm({ teamA: m.teamA, teamAFlag: m.teamAFlag, teamB: m.teamB, teamBFlag: m.teamBFlag,
                   date: m.date, time: m.time, stadium: m.stadium, round: m.round });
    setEditingMatchId(m.id);
    setActiveTab('matches');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Remover este jogo?')) return;
    await api.deleteMatch(id);
    await loadData();
  };

  const handleSetActive = async (id: string) => {
    await api.saveSettings({ active_match_id: id });
    setActiveMatchId(id);
    await loadData();
  };

  const handleFinishMatch = async (matchId: string) => {
    const score = goalsInputs[matchId];
    if (!score || score.goalsA === '' || score.goalsB === '') {
      alert('Informe o placar dos dois times.'); return;
    }
    const gA = parseInt(score.goalsA, 10);
    const gB = parseInt(score.goalsB, 10);
    if (isNaN(gA) || isNaN(gB)) { alert('Placar inválido.'); return; }

    const m = matches.find(mx => mx.id === matchId);
    if (!m) return;
    if (!confirm(`Encerrar ${m.teamA} x ${m.teamB} com placar ${gA} x ${gB}?`)) return;

    await api.saveMatch({ ...m, resultGoalsA: gA, resultGoalsB: gB, status: 'FINISHED' });

    const paid = predictions.filter(p => p.matchId === matchId && (p.statusPix === 'PAID' || p.statusPix === 'PAGO'));
    const totalCollected = paid.length * parseFloat(pixValue || '30');
    const basePrize = totalCollected * 0.8;
    const accumulated = parseFloat(accumulatedAmount || '0');
    const totalPrize = basePrize + accumulated;
    const winners = paid.filter(p => Number(p.goalsA) === gA && Number(p.goalsB) === gB);

    // Save to history
    const round = { matchId, teamA: m.teamA, teamB: m.teamB, goalsA: gA, goalsB: gB,
                    date: m.date, totalPrize, winners: winners.length,
                    closedAt: new Date().toISOString() };
    const hist = JSON.parse(localStorage.getItem('bolao_history') || '[]');
    hist.unshift(round);
    localStorage.setItem('bolao_history', JSON.stringify(hist.slice(0, 20)));
    setHistory(hist.slice(0, 20));

    if (winners.length > 0) {
      const each = totalPrize / winners.length;
      await api.saveSettings({ accumulated_amount: '0.00' });
      alert(`🏆 ${winners.length} ganhador(es)!\nPrêmio: R$ ${each.toFixed(2)} cada\n\nDeseja notificar todos pelo WhatsApp?`);
      if (confirm('Notificar ganhadores no WhatsApp agora?')) notifyAllWinners(winners, each);
    } else {
      const newAcc = (accumulated + basePrize).toFixed(2);
      await api.saveSettings({ accumulated_amount: newAcc });
      alert(`❌ Sem acertadores!\nR$ ${basePrize.toFixed(2)} acumulou.\nNovo acumulado: R$ ${newAcc}`);
    }
    await loadData();
  };

  const handleReopenMatch = async (matchId: string) => {
    const m = matches.find(mx => mx.id === matchId);
    if (!m || !confirm(`Reabrir ${m.teamA} x ${m.teamB}?`)) return;
    await api.saveMatch({ ...m, resultGoalsA: undefined, resultGoalsB: undefined, status: 'PENDING' });
    await loadData();
  };

  const togglePredictionsLock = async () => {
    setSavingLock(true);
    const newVal = !predictionsLocked;
    try {
      await api.saveSettings({ predictions_locked: newVal ? 'true' : 'false' });
      setPredictionsLocked(newVal);
    } catch { alert('Erro ao alterar bloqueio.'); }
    setSavingLock(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.saveSettings({ pix_value: pixValue, pix_key: pixKey, regulamento,
                                admin_phone: adminPhone, accumulated_amount: accumulatedAmount,
                                predictions_locked: predictionsLocked ? 'true' : 'false' });
      alert('Configurações salvas!');
    } catch { alert('Erro ao salvar.'); }
    setSavingSettings(false);
  };

  useEffect(() => {
    const hist = JSON.parse(localStorage.getItem('bolao_history') || '[]');
    setHistory(hist);
  }, []);

  // ══════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════
  if (!isAuth) return (
    <div className="max-w-md w-full mx-auto pb-8">
      <div className="text-center mb-6">
        <h1 className="title-display text-4xl text-white mb-2">BOLÃO COPA</h1>
        <p className="text-sm text-white/50 uppercase tracking-widest font-black">Área Restrita</p>
      </div>
      <form onSubmit={login} className="glass-card rounded-3xl p-8 border-2 border-white/20">
        <div className="w-16 h-16 rounded-full bg-[#009739]/20 border border-[#009739]/50 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-[#009739]" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-6">Administração</h2>
        {loginError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {loginError}
          </div>
        )}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Login</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Usuário" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all placeholder:text-white/20" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:border-[#009739] outline-none transition-all" />
          </div>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white uppercase tracking-widest font-bold rounded-xl py-3.5 hover:scale-[1.02] active:scale-95 transition-all text-xs">
          ENTRAR NO PAINEL
        </button>
      </form>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════
  // MAIN PANEL
  // ══════════════════════════════════════════════════════════════════════
  const tabs = [
    { id: 'dashboard', label: 'Palpites',   icon: Users },
    { id: 'matches',   label: 'Jogos',      icon: Calendar },
    { id: 'results',   label: 'Resultados', icon: Award },
    { id: 'settings',  label: 'Config',     icon: Settings },
    { id: 'history',   label: 'Histórico',  icon: History },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto w-full pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#009739] to-[#00702a] rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest">Painel Admin</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Bolão Copa 2026</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black/50 transition-all cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Palpites', value: predictions.length, icon: Users, color: 'text-white' },
          { label: 'Aguardando PIX', value: pendingCount, icon: Clock, color: 'text-[#FFCD00]' },
          { label: 'PIX Confirmados', value: paidCount, icon: UserCheck, color: 'text-[#009739]' },
          { label: 'Jogos Cadastrados', value: matches.length, icon: Calendar, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
            <s.icon className={`w-6 h-6 ${s.color} opacity-50`} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10 overflow-x-auto gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id ? 'bg-[#009739] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'dashboard' && pendingCount > 0 && (
              <span className="bg-[#FFCD00] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ━━━━ TAB: DASHBOARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Filters */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 mb-4 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={searchName} onChange={e => setSearchName(e.target.value)}
                  placeholder="Buscar nome ou WhatsApp..."
                  className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-[#009739] placeholder:text-white/20" />
              </div>

              {/* Status filter */}
              <div className="flex gap-1">
                {(['ALL','PENDING','PAID'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      filterStatus === s ? 'bg-[#009739] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}>
                    {s === 'ALL' ? 'Todos' : s === 'PENDING' ? '⏳ Pendentes' : '✅ Pagos'}
                  </button>
                ))}
              </div>

              {/* Match filter */}
              <select value={filterMatch} onChange={e => setFilterMatch(e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-[#009739] cursor-pointer">
                <option value="ALL">Todos os jogos</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.teamA} x {m.teamB}</option>
                ))}
              </select>

              {/* Export CSV */}
              <button onClick={() => exportCSV(filtered)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </button>
            </div>

            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-bold">
              Exibindo {filtered.length} de {predictions.length} palpites
            </p>

            {/* Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-white/15">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                  <thead className="bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#FFCD00] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Participante</th>
                      <th className="px-4 py-3">Jogo</th>
                      <th className="px-4 py-3">Palpite</th>
                      <th className="px-4 py-3">Status PIX</th>
                      <th className="px-4 py-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[10px] text-white/40 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block text-xs uppercase tracking-wide">{p.name}</span>
                          <a href={`https://wa.me/55${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-emerald-400 font-mono hover:underline">{p.whatsapp}</a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/5 text-[10px] font-bold text-white uppercase">
                            {p.teamA} x {p.teamB}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-[#FFCD00] text-base">{p.goalsA} x {p.goalsB}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] tracking-widest uppercase font-black border ${
                            (p.statusPix === 'PAID' || p.statusPix === 'PAGO')
                              ? 'bg-[#009739]/10 text-[#009739] border-[#009739]/30'
                              : 'bg-[#FFCD00]/10 text-[#FFCD00] border-[#FFCD00]/30 animate-pulse'
                          }`}>
                            {(p.statusPix === 'PAID' || p.statusPix === 'PAGO') ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(p.statusPix !== 'PAID' && p.statusPix !== 'PAGO') ? (
                            <button onClick={() => confirmPayment(p.id)}
                              className="inline-flex items-center gap-1.5 bg-[#009739] hover:bg-[#00702a] text-white font-bold px-3 py-2 rounded-xl transition-all uppercase tracking-widest text-[9px] cursor-pointer">
                              <Check className="w-3 h-3" /> Confirmar PIX
                            </button>
                          ) : (
                            <span className="text-white/20 text-xs font-bold">Confirmado ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-white/30 font-bold uppercase tracking-widest text-xs">
                          {predictions.length === 0 ? 'Nenhum palpite registrado.' : 'Nenhum resultado para os filtros aplicados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ━━━━ TAB: JOGOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'matches' && (
          <motion.div key="matches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-5 gap-6">

            {/* Form */}
            <div className="md:col-span-2">
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                  {editingMatchId ? <Edit2 className="w-4 h-4 text-[#FFCD00]" /> : <PlusCircle className="w-4 h-4 text-[#FFCD00]" />}
                  {editingMatchId ? 'Editar Jogo' : 'Cadastrar Jogo'}
                </h2>
                {editingMatchId && (
                  <button onClick={() => { setMatchForm(EMPTY_MATCH); setEditingMatchId(null); }}
                    className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 mb-4 cursor-pointer">
                    <X className="w-3 h-3" /> Cancelar edição
                  </button>
                )}

                <form onSubmit={handleSaveMatch} className="space-y-4 mt-4">
                  {/* Team A */}
                  <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-2 block">Time A</span>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input required value={matchForm.teamA} onChange={e => setMatchForm(p => ({...p, teamA: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="Nome do time" />
                      <input value={matchForm.teamAFlag} onChange={e => setMatchForm(p => ({...p, teamAFlag: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="URL da bandeira" />
                    </div>
                    <button type="button" onClick={() => setShowTeamPickerA(v => !v)}
                      className="text-[9px] text-[#FFCD00]/70 hover:text-[#FFCD00] flex items-center gap-1 cursor-pointer">
                      <ChevronDown className="w-3 h-3" /> Seleção rápida
                    </button>
                    {showTeamPickerA && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-y-auto">
                        {COPA_TEAMS.map((t, i) => (
                          <button key={i} type="button"
                            onClick={() => { setMatchForm(p => ({...p, teamA: t.name, teamAFlag: t.flag})); setShowTeamPickerA(false); }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/5 rounded-lg text-[10px] text-white transition-all cursor-pointer flex items-center gap-1">
                            <img src={t.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                            {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-2 block">Time B</span>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input required value={matchForm.teamB} onChange={e => setMatchForm(p => ({...p, teamB: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="Nome do time" />
                      <input value={matchForm.teamBFlag} onChange={e => setMatchForm(p => ({...p, teamBFlag: e.target.value}))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="URL da bandeira" />
                    </div>
                    <button type="button" onClick={() => setShowTeamPickerB(v => !v)}
                      className="text-[9px] text-[#FFCD00]/70 hover:text-[#FFCD00] flex items-center gap-1 cursor-pointer">
                      <ChevronDown className="w-3 h-3" /> Seleção rápida
                    </button>
                    {showTeamPickerB && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-y-auto">
                        {COPA_TEAMS.map((t, i) => (
                          <button key={i} type="button"
                            onClick={() => { setMatchForm(p => ({...p, teamB: t.name, teamBFlag: t.flag})); setShowTeamPickerB(false); }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/5 rounded-lg text-[10px] text-white transition-all cursor-pointer flex items-center gap-1">
                            <img src={t.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                            {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Data</label>
                      <input required value={matchForm.date} onChange={e => setMatchForm(p => ({...p, date: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="DD/MM/AAAA" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Horário</label>
                      <input required value={matchForm.time} onChange={e => setMatchForm(p => ({...p, time: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="HH:MM" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Estádio</label>
                      <input required value={matchForm.stadium} onChange={e => setMatchForm(p => ({...p, stadium: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="Ex: Maracanã" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1 block">Fase</label>
                      <input required value={matchForm.round} onChange={e => setMatchForm(p => ({...p, round: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#009739] text-white" placeholder="Ex: Grupo C" />
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4" />
                    {editingMatchId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR JOGO'}
                  </button>
                </form>
              </div>
            </div>

            {/* Match list */}
            <div className="md:col-span-3 space-y-3">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white">Jogos Cadastrados ({matches.length})</h2>
              {matches.length === 0 && (
                <div className="glass-card p-12 rounded-3xl border border-white/10 text-center">
                  <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Nenhum jogo cadastrado. Crie o primeiro acima!</p>
                </div>
              )}
              {matches.map(m => (
                <div key={m.id} className={`p-4 rounded-2xl border transition-all ${
                  activeMatchId === m.id
                    ? 'bg-[#009739]/10 border-[#009739]/40 shadow shadow-[#009739]/10'
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black text-[#FFCD00] bg-[#FFCD00]/10 border border-[#FFCD00]/20 px-2 py-0.5 rounded uppercase tracking-widest">{m.round}</span>
                      {activeMatchId === m.id && (
                        <span className="text-[9px] font-black text-[#009739] bg-[#009739]/10 border border-[#009739]/20 px-2 py-0.5 rounded uppercase tracking-widest">⚡ Bolão Ativo</span>
                      )}
                      {m.status === 'FINISHED' && (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">✔ Encerrado</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{m.date} {m.time}</span>
                  </div>

                  <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2">
                      {m.teamAFlag && <img src={m.teamAFlag} alt="" className="w-7 h-5 object-cover rounded-sm" />}
                      <span className="font-bold text-white text-sm">{m.teamA}</span>
                    </div>
                    <span className="text-white/20 text-xs font-black">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{m.teamB}</span>
                      {m.teamBFlag && <img src={m.teamBFlag} alt="" className="w-7 h-5 object-cover rounded-sm" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {m.stadium}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditMatch(m)}
                        className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 bg-blue-500/5 rounded-xl border border-blue-500/20 transition-all cursor-pointer" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteMatch(m.id)}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 bg-rose-500/5 rounded-xl border border-rose-500/20 transition-all cursor-pointer" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {activeMatchId === m.id ? (
                        <span className="bg-[#009739]/20 text-[#009739] px-3 py-1.5 border border-[#009739]/40 rounded-xl text-[9px] font-black uppercase tracking-widest">Ativo</span>
                      ) : (
                        <button onClick={() => handleSetActive(m.id)}
                          className="bg-white/5 hover:bg-[#009739] border border-white/20 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
                          Ativar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ━━━━ TAB: RESULTADOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-[#FFCD00]" /> Encerramento de Rodadas
              </h2>
              <p className="text-xs text-white/40">Lance o placar oficial. Se não houver acertadores, o prêmio acumula automaticamente.</p>
            </div>

            {matches.map(m => {
              const paid = predictions.filter(p => p.matchId === m.id && (p.statusPix === 'PAID' || p.statusPix === 'PAGO'));
              const total = paid.length * parseFloat(pixValue || '30');
              const base  = total * 0.8;
              const acc   = parseFloat(accumulatedAmount || '0');
              const prize = base + acc;
              const score = goalsInputs[m.id] || { goalsA: '', goalsB: '' };
              const done  = m.status === 'FINISHED';
              const winners = done ? paid.filter(p => Number(p.goalsA) === Number(m.resultGoalsA) && Number(p.goalsB) === Number(m.resultGoalsB)) : [];

              return (
                <div key={m.id} className={`p-5 rounded-2xl border ${done ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[9px] font-bold text-white bg-black/30 border border-white/10 px-2.5 py-1 rounded-full uppercase">{m.round}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${done ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[#FFCD00] bg-[#FFCD00]/10 border-[#FFCD00]/20 animate-pulse'}`}>
                      {done ? '✔ Encerrado' : '⚽ Em aberto'}
                    </span>
                    <span className="text-[10px] text-white/30 ml-auto">{m.date} • {m.stadium}</span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 items-center">
                    {/* Placar */}
                    <div className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        {m.teamAFlag && <img src={m.teamAFlag} alt="" className="w-8 h-6 object-cover rounded" />}
                        <span className="font-bold text-white text-sm">{m.teamA}</span>
                      </div>
                      {done ? (
                        <span className="font-black text-2xl text-emerald-400 font-mono px-3">{m.resultGoalsA} x {m.resultGoalsB}</span>
                      ) : (
                        <div className="flex items-center gap-2 px-2">
                          <input type="number" min={0} placeholder="0" value={score.goalsA}
                            onChange={e => setGoalsInputs(g => ({...g, [m.id]: {...score, goalsA: e.target.value}}))}
                            className="w-10 h-10 bg-white/5 border border-white/15 rounded-lg text-center text-lg font-bold text-white outline-none focus:border-[#009739] font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                          <span className="text-white/30 text-xs">x</span>
                          <input type="number" min={0} placeholder="0" value={score.goalsB}
                            onChange={e => setGoalsInputs(g => ({...g, [m.id]: {...score, goalsB: e.target.value}}))}
                            className="w-10 h-10 bg-white/5 border border-white/15 rounded-lg text-center text-lg font-bold text-white outline-none focus:border-[#009739] font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{m.teamB}</span>
                        {m.teamBFlag && <img src={m.teamBFlag} alt="" className="w-8 h-6 object-cover rounded" />}
                      </div>
                    </div>

                    {/* Financeiro */}
                    <div className="text-xs space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between"><span className="text-white/40">Palpites pagos</span><span className="text-white font-bold">{paid.length}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Arrecadação</span><span className="text-white font-mono">R$ {total.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Prêmio (80%)</span><span className="text-emerald-400 font-bold font-mono">R$ {base.toFixed(2)}</span></div>
                      {acc > 0 && <div className="flex justify-between"><span className="text-[#FFCD00]">Acumulado</span><span className="text-[#FFCD00] font-bold font-mono">+ R$ {acc.toFixed(2)}</span></div>}
                      <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
                        <span className="text-white font-bold">Total</span>
                        <span className="text-[#FFCD00] font-black font-mono">R$ {prize.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Ação */}
                    <div className="flex flex-col gap-2">
                      {done ? (
                        <>
                          <button onClick={() => handleReopenMatch(m.id)}
                            className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer">
                            Reabrir Confronto
                          </button>
                          {winners.length > 0 && (
                            <button onClick={() => notifyAllWinners(winners, prize / winners.length)}
                              className="w-full bg-[#FFCD00]/10 hover:bg-[#FFCD00]/20 text-[#FFCD00] border border-[#FFCD00]/30 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2">
                              <Send className="w-3.5 h-3.5" /> Notificar {winners.length} Ganhador(es)
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => handleFinishMatch(m.id)}
                          className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" /> Encerrar & Calcular
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ganhadores */}
                  {done && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      {winners.length > 0 ? (
                        <>
                          <p className="text-[9px] uppercase font-black text-[#FFCD00] tracking-widest mb-2">
                            🏆 {winners.length} ganhador(es) — R$ {(prize / winners.length).toFixed(2)} cada:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {winners.map((w, i) => (
                              <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-xs">
                                <span className="font-extrabold block text-[#FFCD00] uppercase text-[10px]">{w.name}</span>
                                <span className="text-[9px] font-mono text-white/40">{w.whatsapp}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                          <p className="text-xs text-[#FFCD00] font-black uppercase">❌ Sem acertadores — R$ {base.toFixed(2)} acumulou!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {matches.length === 0 && (
              <div className="glass-card p-12 rounded-3xl border border-white/10 text-center">
                <p className="text-white/30 text-sm">Nenhum jogo cadastrado ainda.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ━━━━ TAB: CONFIGURAÇÕES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* ─── CONTROLE DE BLOQUEIO ─── */}
            <div className={`glass-card p-6 rounded-3xl border-2 ${predictionsLocked ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'border-[#009739]/40 shadow-[0_0_20px_rgba(0,151,57,0.1)]'} transition-all`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${predictionsLocked ? 'bg-orange-500/20 border-orange-500/40' : 'bg-[#009739]/20 border-[#009739]/40'}`}>
                    <span className="text-2xl">{predictionsLocked ? '🔒' : '🟢'}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest text-white">
                      {predictionsLocked ? 'Bolão Bloqueado' : 'Bolão Aberto'}
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      {predictionsLocked
                        ? 'Novos palpites estão desabilitados. Clique para reabrir.'
                        : 'Palpites habilitados. Clique para bloquear manualmente.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePredictionsLock}
                  disabled={savingLock}
                  className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all cursor-pointer disabled:opacity-50 ${
                    predictionsLocked
                      ? 'bg-[#009739] hover:bg-[#00702a] text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {savingLock ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : predictionsLocked ? (
                    <><span>🔓</span> Reabrir Bolão</>
                  ) : (
                    <><span>🔒</span> Bloquear Bolão</>
                  )}
                </button>
              </div>
              {predictionsLocked && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300 font-medium">
                  ⚠️ Atenção: nenhum participante consegue fazer novos palpites enquanto o bolão estiver bloqueado. Use após encerrar um jogo e antes de configurar o próximo.
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#FFCD00]" /> Financeiro & PIX
              </h2>
              {[
                { label: 'Valor da Aposta (R$)', key: 'pixValue', val: pixValue, set: setPixValue, placeholder: '30.00', mono: true },
                { label: 'WhatsApp do Admin', key: 'adminPhone', val: adminPhone, set: setAdminPhone, placeholder: '35991717912', mono: true },
                { label: 'Prêmio Acumulado (R$)', key: 'accumulatedAmount', val: accumulatedAmount, set: setAccumulatedAmount, placeholder: '0.00', mono: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white ${f.mono ? 'font-mono' : ''}`}
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-[#FFCD00] mb-1.5 block">Chave PIX (Copia e Cola)</label>
                <textarea value={pixKey} onChange={e => setPixKey(e.target.value)} rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white font-mono text-xs resize-none"
                  placeholder="Cole aqui o código PIX copia e cola ou sua chave pix" />
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#009739]" /> Regulamento
                </h2>
                <button type="button" onClick={() => setRegulamento('1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação corresponde a 80% do valor arrecadado.\n4. Limite de 5 palpites idênticos por partida.\n5. Prazo máximo: 10 minutos antes do jogo.\n6. Prêmio dividido entre acertadores.\n7. Sem acertadores, o prêmio acumula para a próxima rodada.')}
                  className="text-[9px] text-[#FFCD00] hover:text-white bg-white/5 hover:bg-[#FFCD00]/20 px-2.5 py-1 rounded-lg border border-[#FFCD00]/20 transition-all cursor-pointer font-black uppercase tracking-widest">
                  Padrão
                </button>
              </div>
              <textarea value={regulamento} onChange={e => setRegulamento(e.target.value)} rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#009739] text-white text-xs resize-none flex-1"
                placeholder="Uma regra por linha..." />
              <button onClick={saveSettings} disabled={savingSettings}
                className="w-full bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer mt-auto">
                <Save className="w-4 h-4" />
                {savingSettings ? 'Salvando...' : 'SALVAR CONFIGURAÇÕES'}
              </button>
            </div>
            </div>{/* fecha grid md:grid-cols-2 */}
          </motion.div>
        )}

        {/* ━━━━ TAB: HISTÓRICO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#FFCD00]" /> Histórico de Rodadas
              </h2>
              <p className="text-xs text-white/40 mt-1">Registro das últimas 20 rodadas encerradas (salvo localmente).</p>
            </div>
            {history.length === 0 && (
              <div className="glass-card p-12 rounded-3xl border border-white/10 text-center">
                <History className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Nenhuma rodada encerrada ainda.</p>
              </div>
            )}
            {history.map((h: any, i: number) => (
              <div key={i} className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">{formatDate(h.closedAt)}</p>
                  <p className="font-black text-white text-sm uppercase tracking-wide">{h.teamA} <span className="text-[#FFCD00]">{h.goalsA} x {h.goalsB}</span> {h.teamB}</p>
                  <p className="text-[10px] text-white/40 mt-1">{h.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#FFCD00] font-black text-lg font-mono">R$ {parseFloat(h.totalPrize || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    {h.winners > 0 ? `🏆 ${h.winners} ganhador(es)` : '❌ Sem acertadores — acumulou'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
