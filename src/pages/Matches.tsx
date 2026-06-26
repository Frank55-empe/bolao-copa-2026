import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, ChevronRight, CheckCircle2, History, Trophy, X, Award } from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';

// ── Countdown até o jogo ──────────────────────────────────────────────────────
function parseDate(d: string, t: string): Date | null {
  try {
    const [day, mon, yr] = d.split('/').map(Number);
    const [h, m]         = t.split(':').map(Number);
    if ([day,mon,yr,h,m].some(isNaN)) return null;
    return new Date(yr, mon - 1, day, h, m);
  } catch { return null; }
}

function CountdownTimer({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [left, setLeft] = useState<{d:number;h:number;m:number;s:number;over:boolean}|null>(null);

  useEffect(() => {
    const target = parseDate(dateStr, timeStr);
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setLeft({ d:0,h:0,m:0,s:0,over:true }); return; }
      setLeft({ d:Math.floor(diff/86400000), h:Math.floor(diff%86400000/3600000),
                m:Math.floor(diff%3600000/60000), s:Math.floor(diff%60000/1000), over:false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr, timeStr]);

  if (!left) return null;
  if (left.over) return (
    <div className="mt-2 inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      <span className="text-[9px] uppercase tracking-wider font-extrabold text-white/55">Partida Iniciada</span>
    </div>
  );

  const parts = [];
  if (left.d > 0) parts.push(`${left.d}d`);
  parts.push(`${String(left.h).padStart(2,'0')}h`);
  parts.push(`${String(left.m).padStart(2,'0')}m`);
  parts.push(`${String(left.s).padStart(2,'0')}s`);

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

// ── Componente principal ──────────────────────────────────────────────────────
export default function Matches({ user }: { user: UserData }) {
  const navigate = useNavigate();

  const [activeMatch,      setActiveMatch]      = useState<MatchData | null>(null);
  const [myPredictions,    setMyPredictions]    = useState<any[]>([]);
  const [activeMatchId,    setActiveMatchId]    = useState('');
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setActiveTab]        = useState<'jogos'|'meus-palpites'>('jogos');
  const [rules,            setRules]            = useState('');
  const [showRegulamento,  setShowRegulamento]  = useState(false);
  const [pixValue,         setPixValue]         = useState('30.00');
  const [accumulatedAmount,setAccumulatedAmount]= useState('0.00');
  const [error,            setError]            = useState('');

  useEffect(() => {
    Promise.all([
      api.getMatches(),
      api.getUserPredictions(user.whatsapp),
      api.getSettings(),
    ])
    .then(([matchesData, predictionsData, settingsData]) => {
      // Normaliza active_match_id (remove espaços, compatível com qualquer retorno)
      const activeId = String(settingsData.active_match_id || '').trim();
      setActiveMatchId(activeId);
      setMyPredictions(predictionsData);
      setRules(settingsData.regulamento || '');
      setPixValue(String(settingsData.pix_value || '30.00').trim());
      setAccumulatedAmount(String(settingsData.accumulated_amount || '0.00').trim());

      // Estratégia de seleção do jogo ativo:
      // 1. ID exato da planilha
      // 2. Primeiro jogo PENDING (se planilha não respondeu ou ID inválido)
      // 3. Primeiro da lista (último recurso)
      let found: MatchData | null = null;

      if (activeId) {
        found = matchesData.find((m: MatchData) =>
          String(m.id).trim() === activeId
        ) ?? null;
      }

      if (!found) {
        found = matchesData.find((m: MatchData) =>
          m.status !== 'FINISHED'
        ) ?? null;
      }

      if (!found && matchesData.length > 0) {
        found = matchesData[0];
      }

      setActiveMatch(found);
      setLoading(false);
    })
    .catch(err => {
      console.error('[Matches] Erro ao carregar:', err);
      setError('Erro ao conectar. Verifique sua internet e tente novamente.');
      setLoading(false);
    });
  }, [user.whatsapp]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#009739]/30 border-t-[#009739] rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Carregando jogos...</p>
      </div>
    );
  }

  // ── Erro de rede ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 min-h-[50vh] text-center px-4">
        <Trophy className="w-12 h-12 text-white/20" />
        <p className="text-white/60 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#009739] text-white font-bold py-3 px-6 rounded-xl uppercase tracking-widest text-xs"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto w-full pb-8">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-8 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-4xl title-display text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Bolão do Dia
          </h2>
          <button
            onClick={() => setShowRegulamento(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 bg-black/30 hover:bg-black/50 hover:border-[#FFCD00]/50 text-[#FFCD00] text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-3.5 h-3.5" /> Regulamento
          </button>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl mt-6">
          {(['jogos','meus-palpites'] as const).map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeTab === tab
                  ? (i === 0 ? 'bg-[#009739] text-white shadow-lg' : 'bg-white/10 text-white shadow-lg')
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
              {i === 0 ? 'Jogo da Vez' : 'Meus Palpites'}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── ABA: JOGO DA VEZ ──────────────────────────────────────── */}
        {activeTab === 'jogos' && (
          <motion.div key="jogos" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} className="space-y-4">

            {/* Acumulado */}
            {parseFloat(accumulatedAmount) > 0 && (
              <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
                className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border-2 border-amber-500/30 p-5 rounded-3xl text-center shadow-lg mb-6">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Trophy className="w-4 h-4 text-[#FFCD00] animate-bounce" />
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#FFCD00]">POOL ACUMULADO!</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-display text-white mb-1">
                  💰 + R$ {parseFloat(accumulatedAmount).toFixed(2)}
                </h3>
                <p className="text-[10.5px] text-white/75 max-w-sm mx-auto uppercase tracking-wider font-semibold leading-relaxed">
                  Ninguém acertou o placar anterior! O prêmio acumulou!
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
              <motion.div key={activeMatch.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
                {(() => {
                  const match = activeMatch;
                  const isFinished = match.status === 'FINISHED';
                  return (
                    <div
                      onClick={() => { if (!isFinished) navigate(`/palpite/${match.id}`, { state: match }); }}
                      className={`w-full glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all ${
                        isFinished
                          ? 'border border-white/5 bg-black/25 opacity-70 cursor-default'
                          : 'border-2 border-[#009739] shadow-[0_0_30px_rgba(0,151,57,0.3)] hover:border-[#009739]/80 cursor-pointer hover:scale-[1.005]'
                      }`}
                    >
                      {/* Badges */}
                      <div className="absolute top-0 right-0 p-4 flex gap-2">
                        {isFinished
                          ? <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Encerrado</span>
                          : <span className="text-[9px] font-black text-white bg-gradient-to-r from-[#009739] to-[#00702a] px-3 py-1 rounded-full uppercase tracking-widest shadow-md">🏆 Bolão do Dia</span>}
                        <span className="text-[10px] font-bold text-[#FFCD00] bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">{match.round}</span>
                      </div>

                      {/* Times */}
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-4">

                        {/* Time A */}
                        <div className="flex flex-col items-center gap-2 w-full md:w-32">
                          {match.teamAFlag?.startsWith('http')
                            ? <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1"><img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover" /></div>
                            : <span className="text-5xl md:text-6xl drop-shadow-xl">{match.teamAFlag}</span>}
                          <span className={`font-black uppercase tracking-tighter text-xl text-center ${match.teamA === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{match.teamA}</span>
                        </div>

                        {/* Centro */}
                        <div className="flex flex-col items-center gap-3">
                          {isFinished ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-3 font-black text-3xl font-mono text-[#FFCD00] bg-[#FFCD00]/5 px-5 py-2 rounded-2xl border border-[#FFCD00]/20 shadow-md">
                                <span>{match.resultGoalsA}</span>
                                <span className="text-white/20 text-sm">x</span>
                                <span>{match.resultGoalsB}</span>
                              </div>
                              <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Resultado Oficial</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-3xl font-black text-white/20">X</span>
                              <div className="text-center flex flex-col items-center">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{match.stadium}</p>
                                <p className="text-xs font-black text-[#FFCD00]">{match.date} • {match.time}</p>
                                <CountdownTimer dateStr={match.date} timeStr={match.time} />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Time B */}
                        <div className="flex flex-col items-center gap-2 w-full md:w-32">
                          {match.teamBFlag?.startsWith('http')
                            ? <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1"><img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover" /></div>
                            : <span className="text-5xl md:text-6xl drop-shadow-xl">{match.teamBFlag}</span>}
                          <span className={`font-black uppercase tracking-tighter text-xl text-center ${match.teamB === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{match.teamB}</span>
                        </div>
                      </div>

                      {!isFinished && (
                        <div className="mt-6 flex justify-center">
                          <span className="inline-flex items-center gap-2 bg-[#009739]/20 border border-[#009739]/40 text-[#009739] font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full">
                            Toque para fazer seu palpite <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── ABA: MEUS PALPITES ───────────────────────────────────── */}
        {activeTab === 'meus-palpites' && (
          <motion.div key="meus-palpites" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
            {myPredictions.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center">
                <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/50 font-bold mb-6">Você ainda não tem palpites.</p>
                <button onClick={() => setActiveTab('jogos')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all">
                  Fazer primeiro palpite
                </button>
              </div>
            ) : (
              myPredictions.map((p, idx) => (
                <motion.div key={idx} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.08 }}
                  className="glass-card p-6 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs text-white/40 uppercase font-bold tracking-widest">{p.date}</span>
                    {p.statusPix === 'PAID'
                      ? <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#009739] bg-[#009739]/10 px-3 py-1.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> PIX CONFIRMADO</div>
                      : <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#FFCD00] border border-[#FFCD00]/30 px-3 py-1.5 rounded-full"><Clock className="w-3 h-3" /> AGUARDANDO APROVAÇÃO</div>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2">
                      {p.teamAFlag?.startsWith('http')
                        ? <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1"><img src={p.teamAFlag} alt={p.teamA} className="w-full h-full object-cover" /></div>
                        : <span className="text-4xl drop-shadow-md">{p.teamAFlag}</span>}
                      <span className="font-black text-sm uppercase text-center">{p.teamA?.substring(0,3)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">{p.goalsA}</div>
                      <span className="text-xl font-black text-white/20">X</span>
                      <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">{p.goalsB}</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {p.teamBFlag?.startsWith('http')
                        ? <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1"><img src={p.teamBFlag} alt={p.teamB} className="w-full h-full object-cover" /></div>
                        : <span className="text-4xl drop-shadow-md">{p.teamBFlag}</span>}
                      <span className="font-black text-sm uppercase text-center">{p.teamB?.substring(0,3)}</span>
                    </div>
                  </div>
                  {p.statusPix === 'PENDING' && (
                    <button onClick={() => navigate('/pix')} className="w-full mt-6 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Efetuar Pagamento
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Regulamento */}
      <AnimatePresence>
        {showRegulamento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowRegulamento(false)}
              className="absolute inset-0 bg-[#020D1F]/90 backdrop-blur-md" />
            <motion.div initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.9, opacity:0, y:20 }}
              transition={{ type:'spring', duration:0.5 }}
              className="relative w-full max-w-md glass-card rounded-3xl p-6 md:p-8 overflow-hidden border-2 border-white/25 shadow-2xl z-10 text-left">
              <button onClick={() => setShowRegulamento(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">
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
                {rules
                  ? rules.split('\n').filter(l => l.trim()).map((rule, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.04 }}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <p className="font-semibold text-white text-sm">{rule}</p>
                    </motion.div>
                  ))
                  : <p className="text-center text-white/50 italic py-4">Nenhum regulamento registrado ainda.</p>}
              </div>
              <button onClick={() => setShowRegulamento(false)} className="w-full mt-6 bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg">
                FECHAR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

