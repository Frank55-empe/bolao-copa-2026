import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, ChevronRight, CheckCircle2, History, Trophy, X, Award, Lock } from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';

// ─── Tempo de fechamento ANTES do jogo (em minutos) ──────────────────────────
const MINUTES_BEFORE_CLOSE = 60; // 1 hora antes

// ─── Parse de data/hora no formato DD/MM/YYYY HH:MM ──────────────────────────
function parseMatchDate(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr || !timeStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hour, minute]     = timeStr.split(':').map(Number);
    if ([day, month, year, hour, minute].some(isNaN)) return null;
    return new Date(year, month - 1, day, hour, minute);
  } catch { return null; }
}

// ─── Retorna true se as apostas ainda estão abertas ──────────────────────────
function isBettingOpen(dateStr: string, timeStr: string): boolean {
  const matchDate = parseMatchDate(dateStr, timeStr);
  if (!matchDate) return true; // se não parsear, deixa aberto
  const closeAt = new Date(matchDate.getTime() - MINUTES_BEFORE_CLOSE * 60 * 1000);
  return new Date() < closeAt;
}

// ─── Retorna quanto tempo falta até o fechamento ──────────────────────────────
function timeUntilClose(dateStr: string, timeStr: string): number {
  const matchDate = parseMatchDate(dateStr, timeStr);
  if (!matchDate) return Infinity;
  const closeAt = new Date(matchDate.getTime() - MINUTES_BEFORE_CLOSE * 60 * 1000);
  return closeAt.getTime() - Date.now();
}

// ─── Componente: Countdown geral até o jogo ───────────────────────────────────
function CountdownTimer({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number; isOver: boolean;
  } | null>(null);

  useEffect(() => {
    const target = parseMatchDate(dateStr, timeStr);
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        isOver:  false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr, timeStr]);

  if (!timeLeft) return null;

  if (timeLeft.isOver) {
    return (
      <div className="mt-2 inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-white/55">Partida Iniciada</span>
      </div>
    );
  }

  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${String(timeLeft.hours).padStart(2,'0')}h`);
  parts.push(`${String(timeLeft.minutes).padStart(2,'0')}m`);
  parts.push(`${String(timeLeft.seconds).padStart(2,'0')}s`);

  return (
    <div className="mt-2 inline-flex flex-col items-center">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#009739] font-black mb-0.5">
        <Clock className="w-2.5 h-2.5" /><span>Começa em</span>
      </div>
      <span className="text-xs font-mono font-bold text-white bg-black/30 border border-white/5 px-2.5 py-0.5 rounded-lg">
        {parts.join(' ')}
      </span>
    </div>
  );
}

// ─── Componente: Countdown até o FECHAMENTO das apostas ──────────────────────
function BettingCloseCountdown({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [msLeft, setMsLeft] = useState(() => timeUntilClose(dateStr, timeStr));

  useEffect(() => {
    const id = setInterval(() => setMsLeft(timeUntilClose(dateStr, timeStr)), 1000);
    return () => clearInterval(id);
  }, [dateStr, timeStr]);

  if (msLeft <= 0) return null; // fechou: BettingClosedBanner assume

  const totalSec = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  // Só mostra o aviso quando faltam ≤ 90 min para fechar
  if (msLeft > 90 * 60 * 1000) return null;

  const isUrgent = msLeft < 15 * 60 * 1000; // < 15 min: cor vermelha pulsante

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border text-center text-xs font-bold uppercase tracking-widest mt-3 ${
        isUrgent
          ? 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}
    >
      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        Apostas fecham em{' '}
        <span className="font-mono text-white">
          {h > 0 && `${String(h).padStart(2,'0')}h `}
          {String(m).padStart(2,'0')}m {String(s).padStart(2,'0')}s
        </span>
      </span>
    </motion.div>
  );
}

// ─── Componente: Banner de apostas encerradas ─────────────────────────────────
function BettingClosedBanner({ teamA, teamB, matchDate, matchTime }: {
  teamA: string; teamB: string; matchDate: string; matchTime: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 w-full"
    >
      <div className="bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30 border-2 border-red-500/40 rounded-2xl p-5 text-center shadow-lg shadow-red-900/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-red-300 font-black text-sm uppercase tracking-widest">Apostas Encerradas</span>
        </div>
        <p className="text-white/80 text-xs leading-relaxed">
          As apostas para <strong className="text-white">{teamA} x {teamB}</strong> foram encerradas
          <br />
          <span className="text-white/50">{MINUTES_BEFORE_CLOSE} minutos antes do início ({matchDate} às {matchTime})</span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Aguarde o resultado oficial
        </div>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Matches({ user }: { user: UserData }) {
  const navigate = useNavigate();

  const [activeMatch, setActiveMatch]       = useState<MatchData | null>(null);
  const [myPredictions, setMyPredictions]   = useState<any[]>([]);
  const [activeMatchId, setActiveMatchId]   = useState('');
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState<'jogos' | 'meus-palpites'>('jogos');
  const [rules, setRules]                   = useState('');
  const [showRegulamento, setShowRegulamento] = useState(false);
  const [pixValue, setPixValue]             = useState('30.00');
  const [accumulatedAmount, setAccumulatedAmount] = useState('0.00');

  // Re-check betting status every second (drives lock UI)
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getMatches(),
      api.getUserPredictions(user.whatsapp),
      api.getSettings(),
    ]).then(([matchesData, predictionsData, settingsData]) => {
      const activeId = String(settingsData.active_match_id || '').trim();
      setActiveMatchId(activeId);
      setMyPredictions(predictionsData);
      setRules(settingsData.regulamento || '');
      setPixValue(String(settingsData.pix_value || '30.00').trim());
      setAccumulatedAmount(String(settingsData.accumulated_amount || '0.00').trim());

      let found: MatchData | null = null;
      if (activeId) found = matchesData.find((m: MatchData) => String(m.id).trim() === activeId) || null;
      if (!found && matchesData.length > 0)
        found = matchesData.find((m: MatchData) => m.status !== 'FINISHED') || matchesData[0];
      setActiveMatch(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.whatsapp]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#009739]/30 border-t-[#009739] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Calcular estado de bloqueio do jogo ativo ──────────────────────────────
  const matchIsFinished = activeMatch?.status === 'FINISHED';
  const bettingOpen     = activeMatch ? isBettingOpen(activeMatch.date, activeMatch.time) : false;
  const canBet          = !matchIsFinished && bettingOpen;

  const handleMatchClick = () => {
    if (!activeMatch) return;
    if (!canBet) return; // bloqueia clique
    navigate(`/palpite/${activeMatch.id}`, { state: activeMatch });
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-4xl title-display text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Bolão do Dia</h2>
          <button onClick={() => setShowRegulamento(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 bg-black/30 hover:bg-black/50 hover:border-[#FFCD00]/50 text-[#FFCD00] text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-md">
            <Trophy className="w-3.5 h-3.5" /> Regulamento
          </button>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl mt-6">
          {(['jogos','meus-palpites'] as const).map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeTab === tab ? (i === 0 ? 'bg-[#009739] text-white shadow-lg' : 'bg-white/10 text-white shadow-lg') : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
              {i === 0 ? 'Jogo da Vez' : 'Meus Palpites'}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── ABA: JOGO DA VEZ ─────────────────────────────────────── */}
        {activeTab === 'jogos' && (
          <motion.div key="jogos" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">

            {/* Acumulado banner */}
            {parseFloat(accumulatedAmount) > 0 && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border-2 border-amber-500/30 p-5 rounded-3xl text-center shadow-lg shadow-amber-500/5 mb-6">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Trophy className="w-4 h-4 text-[#FFCD00] animate-bounce" />
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#FFCD00]">POOL ACUMULADO!</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-display text-white mb-1">
                  💰 + R$ {parseFloat(accumulatedAmount).toFixed(2)}
                </h3>
                <p className="text-[10.5px] text-white/75 max-w-sm mx-auto uppercase tracking-wider font-semibold leading-relaxed">
                  Ninguém acertou o placar anterior! O prêmio acumulou e engrossou o bolão de hoje!
                </p>
              </motion.div>
            )}

            {/* Sem jogo */}
            {!activeMatch ? (
              <div className="glass-card p-12 rounded-3xl text-center">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/50 font-bold mb-2">Nenhum jogo disponível no momento.</p>
                <p className="text-sm text-white/30">Aguarde o administrador definir o próximo jogo.</p>
              </div>
            ) : (
              <motion.div key={activeMatch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                {/* ── Card do jogo ─────────────────────────────────── */}
                <div
                  onClick={handleMatchClick}
                  className={`w-full glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all ${
                    matchIsFinished
                      ? 'border border-white/5 bg-black/25 opacity-70 cursor-default'
                      : !bettingOpen
                        ? 'border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] cursor-default'
                        : 'border-2 border-[#009739] shadow-[0_0_30px_rgba(0,151,57,0.3)] hover:border-[#009739]/80 cursor-pointer hover:scale-[1.005]'
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute top-0 right-0 p-4 flex gap-2 flex-wrap justify-end">
                    {matchIsFinished && (
                      <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Encerrado</span>
                    )}
                    {!matchIsFinished && !bettingOpen && (
                      <span className="text-[9px] font-black text-red-300 bg-red-500/20 border border-red-500/40 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Apostas Fechadas
                      </span>
                    )}
                    {!matchIsFinished && bettingOpen && (
                      <span className="text-[9px] font-black text-white bg-gradient-to-r from-[#009739] to-[#00702a] px-3 py-1 rounded-full uppercase tracking-widest shadow-md">🏆 Bolão do Dia</span>
                    )}
                    <span className="text-[10px] font-bold text-[#FFCD00] bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">{activeMatch.round}</span>
                  </div>

                  {/* Times */}
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                    {/* Time A */}
                    <div className="flex flex-col items-center gap-2 w-full md:w-32">
                      {activeMatch.teamAFlag?.startsWith('http') ? (
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 mb-1 ${!canBet ? 'border-white/10 grayscale' : 'border-white/20'}`}>
                          <img src={activeMatch.teamAFlag} alt={activeMatch.teamA} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className={`text-5xl md:text-6xl drop-shadow-xl ${!canBet ? 'grayscale opacity-70' : ''}`}>{activeMatch.teamAFlag}</span>
                      )}
                      <span className={`font-black uppercase tracking-tighter text-xl text-center ${activeMatch.teamA === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{activeMatch.teamA}</span>
                    </div>

                    {/* Centro */}
                    <div className="flex flex-col items-center gap-3">
                      {matchIsFinished ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-3 font-black text-3xl font-mono text-[#FFCD00] bg-[#FFCD00]/5 px-5 py-2 rounded-2xl border border-[#FFCD00]/20 shadow-md">
                            <span>{activeMatch.resultGoalsA}</span>
                            <span className="text-white/20 text-sm">x</span>
                            <span>{activeMatch.resultGoalsB}</span>
                          </div>
                          <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Resultado Oficial</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-white/20">X</span>
                          <div className="text-center flex flex-col items-center">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{activeMatch.stadium}</p>
                            <p className="text-xs font-black text-[#FFCD00]">{activeMatch.date} • {activeMatch.time}</p>
                            <CountdownTimer dateStr={activeMatch.date} timeStr={activeMatch.time} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Time B */}
                    <div className="flex flex-col items-center gap-2 w-full md:w-32">
                      {activeMatch.teamBFlag?.startsWith('http') ? (
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 mb-1 ${!canBet ? 'border-white/10 grayscale' : 'border-white/20'}`}>
                          <img src={activeMatch.teamBFlag} alt={activeMatch.teamB} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className={`text-5xl md:text-6xl drop-shadow-xl ${!canBet ? 'grayscale opacity-70' : ''}`}>{activeMatch.teamBFlag}</span>
                      )}
                      <span className={`font-black uppercase tracking-tighter text-xl text-center ${activeMatch.teamB === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{activeMatch.teamB}</span>
                    </div>
                  </div>

                  {/* Botão / Aviso */}
                  {!matchIsFinished && (
                    <div className="mt-6">
                      {bettingOpen ? (
                        <>
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-2 bg-[#009739]/20 border border-[#009739]/40 text-[#009739] font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full">
                              Toque para fazer seu palpite <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                          {/* Aviso quando está perto de fechar */}
                          <BettingCloseCountdown dateStr={activeMatch.date} timeStr={activeMatch.time} />
                        </>
                      ) : (
                        <BettingClosedBanner
                          teamA={activeMatch.teamA}
                          teamB={activeMatch.teamB}
                          matchDate={activeMatch.date}
                          matchTime={activeMatch.time}
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── ABA: MEUS PALPITES ───────────────────────────────────── */}
        {activeTab === 'meus-palpites' && (
          <motion.div key="meus-palpites" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {myPredictions.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center">
                <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/50 font-bold mb-6">Você ainda não tem palpites.</p>
                <button onClick={() => setActiveTab('jogos')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all">
                  Fazer primeiro palpite
                </button>
              </div>
            ) : (
              myPredictions.map((prediction, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                  className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">{prediction.date}</span>
                    {prediction.statusPix === 'PAID' ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#009739] bg-[#009739]/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> PIX CONFIRMADO
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#FFCD00] border border-[#FFCD00]/30 px-3 py-1.5 rounded-full">
                        <Clock className="w-3 h-3" /> AGUARDANDO APROVAÇÃO
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2">
                      {prediction.teamAFlag?.startsWith('http') ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1">
                          <img src={prediction.teamAFlag} alt={prediction.teamA} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-4xl drop-shadow-md">{prediction.teamAFlag}</span>
                      )}
                      <span className="font-black text-sm uppercase text-center">{prediction.teamA?.substring(0,3)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">{prediction.goalsA}</div>
                      <span className="text-xl font-black text-white/20">X</span>
                      <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">{prediction.goalsB}</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {prediction.teamBFlag?.startsWith('http') ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1">
                          <img src={prediction.teamBFlag} alt={prediction.teamB} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-4xl drop-shadow-md">{prediction.teamBFlag}</span>
                      )}
                      <span className="font-black text-sm uppercase text-center">{prediction.teamB?.substring(0,3)}</span>
                    </div>
                  </div>
                  {prediction.statusPix === 'PENDING' && (
                    <button onClick={() => navigate('/pix')}
                      className="w-full mt-6 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Efetuar Pagamento
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Modal Regulamento ─────────────────────────────────────── */}
      <AnimatePresence>
        {showRegulamento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRegulamento(false)}
              className="absolute inset-0 bg-[#020D1F]/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md glass-card rounded-3xl p-6 md:p-8 overflow-hidden border-2 border-white/25 shadow-2xl z-10 text-left">
              <button onClick={() => setShowRegulamento(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#FFCD00]/20 flex items-center justify-center border border-[#FFCD00]/40">
                  <Award className="w-5 h-5 text-[#FFCD00]" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold uppercase text-white tracking-wider">Regulamento</h3>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Bolão Brasil Copa 2026</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                {rules ? rules.split('\n').filter(l => l.trim()).map((rule, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="font-semibold text-white text-sm">{rule}</p>
                  </motion.div>
                )) : <p className="text-center text-white/50 italic py-4">Nenhum regulamento registrado.</p>}
              </div>
              <button onClick={() => setShowRegulamento(false)}
                className="w-full mt-6 bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg">
                FECHAR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
