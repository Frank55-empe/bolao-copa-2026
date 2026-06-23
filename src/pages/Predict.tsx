import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Check, AlertTriangle, BarChart3, Trophy,
  User, Phone, Calendar, X, Lock, Clock
} from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';

// ── Constante central — altere aqui para ajustar o prazo ─────────────────────
const MINUTES_BEFORE_CLOSE = 60; // 1 hora antes do jogo

// ── Helpers de tempo ──────────────────────────────────────────────────────────
function parseMatchDate(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr || !timeStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hour, minute]     = timeStr.split(':').map(Number);
    if ([day, month, year, hour, minute].some(isNaN)) return null;
    return new Date(year, month - 1, day, hour, minute);
  } catch { return null; }
}

function isBettingOpen(dateStr: string, timeStr: string): boolean {
  const matchDate = parseMatchDate(dateStr, timeStr);
  if (!matchDate) return true;
  const closeAt = new Date(matchDate.getTime() - MINUTES_BEFORE_CLOSE * 60_000);
  return Date.now() < closeAt.getTime();
}

function msUntilClose(dateStr: string, timeStr: string): number {
  const matchDate = parseMatchDate(dateStr, timeStr);
  if (!matchDate) return Infinity;
  const closeAt = new Date(matchDate.getTime() - MINUTES_BEFORE_CLOSE * 60_000);
  return closeAt.getTime() - Date.now();
}

// ── Countdown até o fechamento (usado dentro da página de palpite) ─────────────
function ClosingCountdown({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [ms, setMs] = useState(() => msUntilClose(dateStr, timeStr));

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilClose(dateStr, timeStr)), 1000);
    return () => clearInterval(id);
  }, [dateStr, timeStr]);

  if (ms <= 0 || ms > 90 * 60_000) return null; // só mostra nos últimos 90 min

  const s    = Math.max(0, Math.floor(ms / 1000));
  const hh   = Math.floor(s / 3600);
  const mm   = Math.floor((s % 3600) / 60);
  const ss   = s % 60;
  const isRed = ms < 15 * 60_000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-2xl border mb-6 ${
        isRed
          ? 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      }`}
    >
      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        Apostas fecham em{' '}
        <span className="font-mono text-white">
          {hh > 0 && `${String(hh).padStart(2,'0')}h `}
          {String(mm).padStart(2,'0')}m {String(ss).padStart(2,'0')}s
        </span>
      </span>
    </motion.div>
  );
}

// ── Tela de bloqueio exibida quando o prazo passou ────────────────────────────
function BettingLockedScreen({ match, onBack }: { match: MatchData; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto w-full"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-[#009739] mb-8 font-bold hover:text-[#00702a] transition-colors">
        <ArrowLeft className="w-5 h-5" /> Voltar aos jogos
      </button>

      <div className="glass-card rounded-3xl p-8 text-center border-2 border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.12)]">
        {/* Ícone animado */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-red-500/10 border-2 border-red-500/30 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <Lock className="w-9 h-9 text-red-400" />
          </div>
        </div>

        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">
          Apostas Encerradas
        </h2>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          As apostas para este confronto foram encerradas<br />
          <span className="text-white/30">{MINUTES_BEFORE_CLOSE} minutos antes do início da partida.</span>
        </p>

        {/* Confronto */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mb-3">Confronto Bloqueado</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              {match.teamAFlag?.startsWith('http') ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 grayscale opacity-60">
                  <img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-3xl grayscale opacity-60">{match.teamAFlag}</span>
              )}
              <span className="text-xs font-black text-white/60 uppercase">{match.teamA}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-300 font-black text-xs uppercase tracking-widest">Fechado</span>
              </div>
              <span className="text-[10px] text-white/30 font-mono">{match.date} • {match.time}</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              {match.teamBFlag?.startsWith('http') ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 grayscale opacity-60">
                  <img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-3xl grayscale opacity-60">{match.teamBFlag}</span>
              )}
              <span className="text-xs font-black text-white/60 uppercase">{match.teamB}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-bold uppercase tracking-widest mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Aguarde o resultado oficial para ver os ganhadores</span>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs"
        >
          ← Voltar aos Jogos
        </button>
      </div>
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Predict({ user }: { user: UserData }) {
  const { matchId }  = useParams();
  const location     = useLocation();
  const match        = location.state as MatchData;
  const navigate     = useNavigate();

  const [goalsA, setGoalsA] = useState<number>(0);
  const [goalsB, setGoalsB] = useState<number>(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showConfirmModal, setShowConfirmModal]         = useState(false);
  const [duplicatesCount, setDuplicatesCount]           = useState(0);
  const [loading, setLoading]                           = useState(false);
  const [stats, setStats]                               = useState<any[]>([]);

  // Reactivo: recalcula isBettingOpen a cada segundo
  const [open, setOpen] = useState(() => match ? isBettingOpen(match.date, match.time) : true);
  useEffect(() => {
    if (!match) return;
    const id = setInterval(() => setOpen(isBettingOpen(match.date, match.time)), 1000);
    return () => clearInterval(id);
  }, [match]);

  useEffect(() => {
    if (matchId) api.getPredictionStats(matchId).then(setStats).catch(console.error);
  }, [matchId]);

  // Se o tempo expirou enquanto o usuário estava na página, bloqueia imediatamente
  // (sem precisar recarregar)

  if (!match) { navigate('/jogos'); return null; }

  // ── Verificação dupla de segurança: jogo já finalizado ─────────────────────
  const matchIsFinished = match.status === 'FINISHED';

  // ── Exibe tela de bloqueio se não pode apostar ──────────────────────────────
  if (matchIsFinished || !open) {
    return <BettingLockedScreen match={match} onBack={() => navigate('/jogos')} />;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGoalChange = (setter: React.Dispatch<React.SetStateAction<number>>, diff: number) => {
    setter(prev => Math.max(0, prev + diff));
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    // Verificação de tempo no submit também
    if (!isBettingOpen(match.date, match.time)) {
      alert('⏰ As apostas para este jogo já foram encerradas!');
      navigate('/jogos');
      return;
    }
    setShowConfirmModal(true);
  };

  const checkAndSubmit = async (skipDuplicateCheck = false) => {
    // Última barreira de segurança no envio
    if (!isBettingOpen(match.date, match.time)) {
      alert('⏰ As apostas foram encerradas enquanto você preenchia. Tente no próximo jogo!');
      navigate('/jogos');
      return;
    }

    setLoading(true);
    try {
      if (!skipDuplicateCheck && matchId) {
        const count = await api.checkDuplicates(matchId, goalsA, goalsB);
        if (count > 0) {
          setDuplicatesCount(count);
          setShowDuplicateWarning(true);
          setLoading(false);
          return;
        }
      }
      if (matchId) {
        const { success } = await api.submitPrediction({
          matchId, name: user.name, whatsapp: user.whatsapp, goalsA, goalsB
        });
        if (success) {
          navigate('/pix', { state: { name: user.name, whatsapp: user.whatsapp, match, goalsA, goalsB } });
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#009739] mb-8 font-bold hover:text-[#00702a] transition-colors">
        <ArrowLeft className="w-5 h-5" /> Voltar aos jogos
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-3xl p-6 md:p-8">

        {/* Aviso de fechamento próximo */}
        <ClosingCountdown dateStr={match.date} timeStr={match.time} />

        {/* Banner do confronto */}
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#009739]/30 via-black/50 to-[#020D1F]/80 backdrop-blur-md z-0" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          <div className="relative z-10 p-6 md:p-8 flex flex-col items-center border border-white/10 rounded-3xl">
            <h2 className="text-[10px] font-black text-[#FFCD00] uppercase tracking-[0.3em] mb-6 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">{match.round}</h2>
            <div className="flex items-center justify-between w-full max-w-sm mb-4">
              {/* Time A */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-sm rounded-full border-[3px] border-[#009739] shadow-[0_0_20px_rgba(0,151,57,0.4)] flex items-center justify-center overflow-hidden mb-3 p-2">
                  {match.teamAFlag?.startsWith('http')
                    ? <img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover rounded-full" />
                    : <span className="text-6xl md:text-7xl drop-shadow-xl translate-y-1">{match.teamAFlag}</span>}
                </div>
                <span className="font-black text-xl md:text-2xl uppercase tracking-tighter text-white drop-shadow-md">{match.teamA}</span>
              </div>
              {/* Centro */}
              <div className="flex flex-col items-center justify-center px-4">
                <span className="text-4xl md:text-5xl font-black text-white/20 italic tracking-tighter mb-2">X</span>
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest text-center">{match.date}<br/>{match.time}</span>
              </div>
              {/* Time B */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-sm rounded-full border-[3px] border-[#FFCD00] shadow-[0_0_20px_rgba(255,205,0,0.4)] flex items-center justify-center overflow-hidden mb-3 p-2">
                  {match.teamBFlag?.startsWith('http')
                    ? <img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover rounded-full" />
                    : <span className="text-6xl md:text-7xl drop-shadow-xl translate-y-1">{match.teamBFlag}</span>}
                </div>
                <span className="font-black text-xl md:text-2xl uppercase tracking-tighter text-white drop-shadow-md">{match.teamB}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest bg-gradient-to-r from-transparent via-white/5 to-transparent py-2">Qual o seu palpite?</h3>
        </div>

        <form onSubmit={handleOpenConfirm}>
          {/* Placar */}
          <div className="flex justify-center items-center gap-6 bg-black/20 rounded-3xl p-6 border border-white/5 mb-8 max-w-sm mx-auto shadow-inner">
            {([
              [goalsA, setGoalsA],
              [goalsB, setGoalsB],
            ] as [number, React.Dispatch<React.SetStateAction<number>>][]).map(([ val, setter ], i) => (
              <React.Fragment key={i}>
                {i === 1 && <div className="text-white/30 font-black text-xl">X</div>}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 md:gap-3">
                    <button type="button" onClick={() => handleGoalChange(setter, -1)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl font-bold hover:bg-red-500/20 transition-colors active:scale-90">−</button>
                    <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-black text-white border-2 border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                      {val}
                    </div>
                    <button type="button" onClick={() => handleGoalChange(setter, 1)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#009739]/20 text-[#009739] flex items-center justify-center text-2xl font-bold hover:bg-[#009739]/30 transition-colors active:scale-90">+</button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
              <h4 className="text-white/70 text-xs uppercase tracking-widest font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#FFCD00]" /> Placares Mais Populares
              </h4>
              <div className="space-y-3">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/20 rounded-xl p-3 border border-white/5">
                    <span className="text-white font-black text-lg tracking-wider">
                      {match.teamA.substring(0,3)} <span className="text-[#009739] mx-1">{stat.goalsA}</span> x <span className="text-[#009739] mx-1">{stat.goalsB}</span> {match.teamB.substring(0,3)}
                    </span>
                    <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded-md uppercase tracking-wider">
                      {stat.count} {stat.count === 1 ? 'palpite' : 'palpites'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 neon-glow-green uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
            {loading
              ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>SALVAR PALPITE <Check className="w-6 h-6" /></>}
          </button>
        </form>
      </motion.div>

      {/* Modal: Palpite duplicado */}
      <AnimatePresence>
        {showDuplicateWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card neon-glow-yellow rounded-3xl p-6 w-full max-w-md relative overflow-hidden">
              <div className="w-16 h-16 bg-[#FFCD00]/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8 text-[#FFCD00]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-2">
                {duplicatesCount >= 5 ? 'Limite Atingido' : 'Atenção!'}
              </h3>
              <p className="text-center text-white/70 mb-8 leading-relaxed font-medium">
                {duplicatesCount >= 5 ? (
                  <>O limite para esse palpite foi atingido (<strong className="text-[#FFCD00]">5 participantes</strong> com esse placar).<br/><br/>Por favor, escolha outro resultado.</>
                ) : (
                  <>Já existem <strong className="text-[#FFCD00] text-lg">{duplicatesCount} participantes</strong> com esse mesmo palpite.<br/><br/>Deseja continuar? O prêmio será dividido.</>
                )}
              </p>
              <div className="space-y-3">
                {duplicatesCount < 5 && (
                  <button onClick={() => { setShowDuplicateWarning(false); checkAndSubmit(true); }} disabled={loading}
                    className="w-full bg-[#FFCD00] text-[#041E42] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-yellow-400 transition-colors">
                    SIM, CONTINUAR
                  </button>
                )}
                <button onClick={() => setShowDuplicateWarning(false)}
                  className="w-full bg-white/5 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-colors">
                  {duplicatesCount >= 5 ? 'ESCOLHER NOVO PALPITE' : 'ALTERAR PALPITE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Confirmação */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="glass-card border-2 border-[#009739]/50 shadow-[0_0_40px_rgba(0,151,57,0.25)] rounded-3xl p-6 md:p-8 w-full max-w-md relative overflow-hidden">
              <button onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#009739]/20 flex items-center justify-center border border-[#009739]/40">
                  <Trophy className="w-5 h-5 text-[#FFCD00]" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold uppercase text-white tracking-widest">Confirmar Palpite</h3>
                  <p className="text-[9px] text-[#009739] uppercase font-black tracking-widest">Verifique suas escolhas</p>
                </div>
              </div>

              {/* Placar resumo */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6 shadow-inner">
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-black text-center mb-3">Confronto & Placar</p>
                <div className="flex items-center justify-around">
                  {[
                    { flag: match.teamAFlag, name: match.teamA, goals: goalsA },
                    { flag: match.teamBFlag, name: match.teamB, goals: goalsB },
                  ].map((team, i) => (
                    <React.Fragment key={i}>
                      {i === 1 && (
                        <div className="flex items-center gap-2 font-display">
                          <span className="text-3xl font-black text-[#FFCD00]">{goalsA}</span>
                          <span className="text-sm text-white/30 font-bold uppercase">x</span>
                          <span className="text-3xl font-black text-[#FFCD00]">{goalsB}</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-1.5 w-5/12">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden p-1">
                          {team.flag?.startsWith('http')
                            ? <img src={team.flag} alt={team.name} className="w-full h-full object-cover rounded-full" />
                            : <span className="text-3xl">{team.flag}</span>}
                        </div>
                        <span className="text-xs font-black text-white uppercase text-center block tracking-tight truncate w-full">{team.name}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Dados do participante */}
              <div className="space-y-3 mb-6 sm:mb-8 text-xs">
                {[
                  { Icon: User,     label: 'Participante', value: user.name       },
                  { Icon: Phone,    label: 'WhatsApp',     value: user.whatsapp   },
                  { Icon: Calendar, label: 'Fase/Rodada',  value: match.round     },
                ].map(({ Icon, label, value }, i, arr) => (
                  <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-white/5 pb-2' : ''}`}>
                    <span className="text-white/40 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5 text-[#009739]" /> {label}
                    </span>
                    <span className={`text-white font-bold ${label === 'WhatsApp' ? 'font-mono' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button onClick={() => { setShowConfirmModal(false); checkAndSubmit(false); }} disabled={loading}
                  className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'CONFIRMAR PALPITE ✓'}
                </button>
                <button onClick={() => setShowConfirmModal(false)} disabled={loading}
                  className="w-full bg-white/5 text-white/70 hover:text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-white/10 transition-colors text-xs cursor-pointer">
                  ALTERAR PLACAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

