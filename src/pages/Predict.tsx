import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, AlertTriangle, BarChart3, Trophy, User, Phone, Calendar, X, Lock } from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';

const MATCH_CACHE_KEY = 'bolao2026_match_';

/** Parseia data/hora — aceita ISO ou DD/MM/AAAA */
function parseMatchDate(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr) return null;
    if (dateStr.includes('T') || (dateStr.includes('-') && !dateStr.includes('/'))) {
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) return isoDate;
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const [y, mo, d] = parts.map(Number);
        const timeParts = (timeStr || '').replace('Z', '').split(':');
        return new Date(y, mo - 1, d, parseInt(timeParts[0], 10) || 0, parseInt(timeParts[1], 10) || 0);
      }
      return null;
    }
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3 || !timeStr) return null;
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) return null;
    return new Date(
      parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10),
      parseInt(timeParts[0], 10), parseInt(timeParts[1], 10)
    );
  } catch { return null; }
}

function formatDateDisplay(dateStr: string, timeStr: string): string {
  const d = parseMatchDate(dateStr, timeStr);
  if (!d) return `${dateStr} ${timeStr}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} às ${hh}:${mi}`;
}

function formatTimeDisplay(dateStr: string, timeStr: string): { date: string; time: string } {
  const d = parseMatchDate(dateStr, timeStr);
  if (!d) return { date: dateStr, time: timeStr };
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return { date: `${dd}/${mm}/${d.getFullYear()}`, time: `${hh}:${mi}` };
}

/** Retorna true se os palpites estão fechados (1h antes do jogo ou depois) */
function isPredictionLocked(dateStr: string, timeStr: string): boolean {
  try {
    const matchDate = parseMatchDate(dateStr, timeStr);
    if (!matchDate) return false;
    const cutoff = new Date(matchDate.getTime() - 60 * 60 * 1000);
    return new Date() >= cutoff;
  } catch { return false; }
}

export default function Predict({ user }: { user: UserData }) {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [goalsA, setGoalsA] = useState<number>(0);
  const [goalsB, setGoalsB] = useState<number>(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [adminLocked, setAdminLocked] = useState(false);

  // Busca settings para verificar predictions_locked
  useEffect(() => {
    api.getSettings().then(s => {
      setAdminLocked(String(s.predictions_locked || 'false').trim() === 'true');
    }).catch(() => {});
  }, []);

  // Recupera match do state OU do sessionStorage OU busca na API
  useEffect(() => {
    const stateMatch = location.state as MatchData | null;
    if (stateMatch?.id) {
      // Salva no sessionStorage para sobreviver a reloads
      try { sessionStorage.setItem(MATCH_CACHE_KEY + stateMatch.id, JSON.stringify(stateMatch)); } catch { }
      setMatch(stateMatch);
      setMatchLoading(false);
      return;
    }

    // Tenta recuperar do sessionStorage (caso de reload / redirect SPA)
    if (matchId) {
      try {
        const cached = sessionStorage.getItem(MATCH_CACHE_KEY + matchId);
        if (cached) {
          setMatch(JSON.parse(cached));
          setMatchLoading(false);
          return;
        }
      } catch { }

      // Último recurso: busca todos os jogos na API
      api.getMatches().then(matches => {
        const found = matches.find(m => String(m.id).trim() === String(matchId).trim());
        if (found) {
          try { sessionStorage.setItem(MATCH_CACHE_KEY + matchId, JSON.stringify(found)); } catch { }
          setMatch(found);
          setMatchLoading(false);
        } else {
          // Match não encontrado na API — redireciona para /jogos
          setMatchLoading(false);
        }
      }).catch(() => {
        setMatchLoading(false);
      });
    } else {
      setMatchLoading(false);
    }
  }, [matchId, location.state]);

  useEffect(() => {
    if (matchId) {
      api.getPredictionStats(matchId)
        .then(data => setStats(data))
        .catch(console.error);
    }
  }, [matchId]);

  if (matchLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-[#009739]/30 border-t-[#009739] rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    // Auto-redirect para /jogos após 1.5s se o match não for encontrado
    setTimeout(() => navigate('/jogos', { replace: true }), 1500);
    return (
      <div className="max-w-xl mx-auto w-full text-center py-20">
        <p className="text-white/50 mb-4">Jogo não encontrado. Voltando aos jogos...</p>
        <button onClick={() => navigate('/jogos', { replace: true })} className="bg-[#009739] text-white font-bold py-3 px-8 rounded-xl">
          Voltar aos Jogos
        </button>
      </div>
    );
  }

  const locked = isPredictionLocked(match.date, match.time) || adminLocked;
  const { date: dateDisplay, time: timeDisplay } = formatTimeDisplay(match.date, match.time);

  if (locked) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <button onClick={() => navigate('/jogos')} className="flex items-center gap-2 text-[#009739] mb-8 font-bold hover:text-[#00702a] transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar aos jogos
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 text-center border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
        >
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/30">
            <Lock className="w-10 h-10 text-orange-400" />
          </div>
          {adminLocked ? (
            <>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-3">Bolão Pausado</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                O administrador <strong className="text-orange-400">pausou os palpites temporariamente</strong>.
              </p>
              <p className="text-white/40 text-xs leading-relaxed mb-8">
                Aguarde a reabertura do bolão para o próximo jogo.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-3">Palpites Encerrados</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                As apostas foram <strong className="text-orange-400">fechadas 1 hora antes da partida</strong>.
              </p>
              <p className="text-white/40 text-xs leading-relaxed mb-8">
                {match.teamA} vs {match.teamB} — {formatDateDisplay(match.date, match.time)}
              </p>
            </>
          )}
          <button onClick={() => navigate('/jogos')} className="bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold uppercase tracking-widest py-3 px-8 rounded-xl hover:scale-[1.02] active:scale-95 transition-all">
            Voltar aos Jogos
          </button>
        </motion.div>
      </div>
    );
  }

  const handleGoalChange = (setter: React.Dispatch<React.SetStateAction<number>>, diff: number) => {
    setter(prev => Math.max(0, prev + diff));
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const checkAndSubmit = async (skipDuplicateCheck: boolean = false) => {
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
          matchId,
          name: user.name,
          whatsapp: user.whatsapp,
          goalsA,
          goalsB
        });

        if (success) {
          navigate('/pix', {
            state: {
              name: user.name,
              whatsapp: user.whatsapp,
              match,
              goalsA,
              goalsB
            }
          });
        } else {
          alert('Erro ao salvar palpite. Tente novamente.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#009739] mb-8 font-bold hover:text-[#00702a] transition-colors">
        <ArrowLeft className="w-5 h-5" /> Voltar aos jogos
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#009739]/30 via-black/50 to-[#020D1F]/80 backdrop-blur-md z-0" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          
          <div className="relative z-10 p-6 md:p-8 flex flex-col items-center border border-white/10 rounded-3xl">
            <h2 className="text-[10px] font-black text-[#FFCD00] uppercase tracking-[0.3em] mb-6 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">{match.round}</h2>
            
            <div className="flex items-center justify-between w-full max-w-sm mb-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-sm rounded-full border-[3px] border-[#009739] shadow-[0_0_20px_rgba(0,151,57,0.4)] flex items-center justify-center overflow-hidden mb-3 p-2">
                  {match.teamAFlag.startsWith('http') ? (
                    <img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-6xl md:text-7xl drop-shadow-xl translate-y-1">{match.teamAFlag}</span>
                  )}
                </div>
                <span className="font-black text-xl md:text-2xl uppercase tracking-tighter text-white drop-shadow-md">{match.teamA}</span>
              </div>

              <div className="flex flex-col items-center justify-center px-4">
                <span className="text-4xl md:text-5xl font-black text-white/20 italic tracking-tighter mb-2">X</span>
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest text-center">
                  {dateDisplay}<br/>{timeDisplay}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-sm rounded-full border-[3px] border-[#FFCD00] shadow-[0_0_20px_rgba(255,205,0,0.4)] flex items-center justify-center overflow-hidden mb-3 p-2">
                  {match.teamBFlag.startsWith('http') ? (
                    <img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-6xl md:text-7xl drop-shadow-xl translate-y-1">{match.teamBFlag}</span>
                  )}
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
          <div className="flex justify-center items-center gap-6 bg-black/20 rounded-3xl p-6 border border-white/5 mb-8 max-w-sm mx-auto shadow-inner">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <button type="button" onClick={() => handleGoalChange(setGoalsA, -1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl font-bold hover:bg-red-500/20 transition-colors active:scale-90">-</button>
                <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-black text-white border-2 border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                  {goalsA}
                </div>
                <button type="button" onClick={() => handleGoalChange(setGoalsA, 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#009739]/20 text-[#009739] flex items-center justify-center text-2xl font-bold hover:bg-[#009739]/30 transition-colors active:scale-90">+</button>
              </div>
            </div>

            <div className="text-white/30 font-black text-xl">X</div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <button type="button" onClick={() => handleGoalChange(setGoalsB, -1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl font-bold hover:bg-red-500/20 transition-colors active:scale-90">-</button>
                <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-black text-white border-2 border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                  {goalsB}
                </div>
                <button type="button" onClick={() => handleGoalChange(setGoalsB, 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#009739]/20 text-[#009739] flex items-center justify-center text-2xl font-bold hover:bg-[#009739]/30 transition-colors active:scale-90">+</button>
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
              <h4 className="text-white/70 text-xs uppercase tracking-widest font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#FFCD00]" /> 
                Placares Mais Populares
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 neon-glow-green uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>SALVAR PALPITE <Check className="w-6 h-6" /></>
            )}
          </button>
        </form>
      </motion.div>

      {/* Modal de duplicatas */}
      <AnimatePresence>
        {showDuplicateWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card neon-glow-yellow rounded-3xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-[#FFCD00]/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8 text-[#FFCD00]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-2">
                {duplicatesCount >= 5 ? "Limite Atingido" : "Atenção!"}
              </h3>
              <p className="text-center text-white/70 mb-8 leading-relaxed font-medium">
                {duplicatesCount >= 5 ? (
                  <>O limite para esse palpite já foi atingido (<strong className="text-[#FFCD00]">5 participantes</strong> com esse mesmo placar).<br/><br/>Por favor, escolha outro resultado.</>
                ) : (
                  <>Já existem <strong className="text-[#FFCD00] text-lg">{duplicatesCount} participantes</strong> com esse mesmo palpite.<br/><br/>Deseja continuar mesmo assim? O prêmio será dividido.</>
                )}
              </p>
              <div className="space-y-3">
                {duplicatesCount < 5 && (
                  <button 
                    onClick={() => { setShowDuplicateWarning(false); checkAndSubmit(true); }}
                    disabled={loading}
                    className="w-full bg-[#FFCD00] text-[#041E42] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-yellow-400 transition-colors"
                  >
                    SIM, CONTINUAR
                  </button>
                )}
                <button 
                  onClick={() => setShowDuplicateWarning(false)}
                  className="w-full bg-white/5 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {duplicatesCount >= 5 ? "ESCOLHER NOVO PALPITE" : "ALTERAR PALPITE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass-card border-2 border-[#009739]/50 shadow-[0_0_40px_rgba(0,151,57,0.25)] rounded-3xl p-6 md:p-8 w-full max-w-md relative overflow-hidden"
            >
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#009739]/20 flex items-center justify-center border border-[#009739]/40">
                  <Trophy className="w-5 h-5 text-[#FFCD00]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold uppercase text-white tracking-widest">Confirmar Palpite</h3>
                  <p className="text-[9px] text-[#009739] uppercase font-black tracking-widest">Verifique suas escolhas</p>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6 shadow-inner">
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-black text-center mb-3">Confronto & Placar</p>
                <div className="flex items-center justify-around">
                  <div className="flex flex-col items-center gap-1.5 w-5/12">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden p-1">
                      {match.teamAFlag.startsWith('http') ? (
                        <img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-3xl">{match.teamAFlag}</span>
                      )}
                    </div>
                    <span className="text-xs font-black text-white uppercase text-center block tracking-tight truncate w-full">{match.teamA}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-[#FFCD00]">{goalsA}</span>
                    <span className="text-sm text-white/30 font-bold uppercase">x</span>
                    <span className="text-3xl font-black text-[#FFCD00]">{goalsB}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-5/12">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden p-1">
                      {match.teamBFlag.startsWith('http') ? (
                        <img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-3xl">{match.teamBFlag}</span>
                      )}
                    </div>
                    <span className="text-xs font-black text-white uppercase text-center block tracking-tight truncate w-full">{match.teamB}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#009739]" /> Participante
                  </span>
                  <span className="text-white font-bold">{user.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#009739]" /> WhatsApp
                  </span>
                  <span className="text-white font-mono">{user.whatsapp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#009739]" /> Fase/Rodada
                  </span>
                  <span className="text-white/80 font-bold">{match.round}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setShowConfirmModal(false); checkAndSubmit(false); }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>CONFIRMAR PALPITE ✓</>
                  )}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="w-full bg-white/5 text-white/70 hover:text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-white/10 transition-colors text-xs cursor-pointer"
                >
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
