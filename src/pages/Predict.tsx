import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, AlertTriangle, BarChart3, Clock } from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';

export default function Predict({ user }: { user: UserData }) {
  const { matchId } = useParams();
  const location = useLocation();
  const match = location.state as any;
  const navigate = useNavigate();

  const [goalsA, setGoalsA] = useState<number>(0);
  const [goalsB, setGoalsB] = useState<number>(0);
  const [modalState, setModalState] = useState<'closed' | 'confirm' | 'duplicate_warning' | 'duplicate_blocked' | 'saving' | 'success'>('closed');
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!match) return;
    const updateCountdown = () => {
      // Parse DD/MM/YYYY HH:mm
      if (!match.date || !match.time) return;
      const [day, month, year] = match.date.split('/');
      const [hours, minutes] = match.time.split(':');
      const matchDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      
      const now = new Date();
      const diff = matchDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setIsLocked(true);
        setTimeLeft('APOSTAS ENCERRADAS');
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft(`Faltam ${d}d ${h}h ${m}m para encerrar`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // 1 min
    return () => clearInterval(interval);
  }, [match]);

  useEffect(() => {
    if (matchId) {
      api.get('getPredictionStats', { matchId })
        .then(data => setStats(Array.isArray(data) ? data : (data.stats || [])))
        .catch(console.warn);
    }
  }, [matchId]);

  if (!match) {
    navigate('/jogos');
    return null;
  }

  const handleGoalChange = (setter: React.Dispatch<React.SetStateAction<number>>, diff: number) => {
    setter(prev => Math.max(0, prev + diff));
  };

  const handleInitialSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;
    setModalState('confirm');
  };

  const handleConfirm = async (bypassDuplicates = false) => {
    setModalState('saving');

    try {
      if (!bypassDuplicates) {
        // First, check duplicates
        let data: any;
        try {
           data = await api.post('checkDuplicates', { matchId, goalsA, goalsB });
        } catch (err) {
           console.warn("Duplicate check failed:", err);
           data = { count: 0 };
        }
        
        if (data.count >= 3) {
          setDuplicatesCount(data.count);
          setModalState('duplicate_blocked');
          return;
        }

        if (data.count > 0 && data.count < 3) {
          setDuplicatesCount(data.count);
          setModalState('duplicate_warning');
          return;
        }
      }

      // Final submit
      try {
        await api.post('savePrediction', {
          matchId,
          name: user.name,
          whatsapp: user.whatsapp,
          goalsA,
          goalsB,
          teamA: match.teamA,
          teamB: match.teamB
        });

        setModalState('success');
        setTimeout(() => {
          navigate('/pix');
        }, 2000);
      } catch (err) {
        console.warn("Erro ao enviar para Google Sheets:", err);
        setModalState('closed');
      }
    } catch(err) {
      console.warn(err);
      setModalState('closed');
    }
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
          {/* Banner decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#009739]/30 via-black/50 to-[#020D1F]/80 backdrop-blur-md z-0" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 MixBlendMode-overlay" />
          
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
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest text-center">{match.date}<br/>{match.time}</span>
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
          {timeLeft && (
            <div className={`mt-2 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 inline-block rounded-full border ${isLocked ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-[#FFCD00] border-[#FFCD00]/30 bg-[#FFCD00]/10'}`}>
              <Clock className="w-3 h-3 inline pb-0.5" /> {timeLeft}
            </div>
          )}
        </div>

        <form onSubmit={handleInitialSubmit}>
          <div className="flex justify-center items-center gap-6 bg-black/20 rounded-3xl p-6 border border-white/5 mb-8 max-w-sm mx-auto shadow-inner">
            {/* Team A Goals */}
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

            {/* Team B Goals */}
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
            disabled={loading || isLocked}
            className={`w-full font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all ${isLocked ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white/50' : 'bg-gradient-to-r from-[#009739] to-[#00702a] text-white neon-glow-green hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLocked ? (
              <>APOSTAS ENCERRADAS</>
            ) : (
              <>SALVAR PALPITE <Check className="w-6 h-6" /></>
            )}
          </button>
        </form>
      </motion.div>

      {/* Combined Confirm, Save & Warning Modal */}
      <AnimatePresence>
        {modalState !== 'closed' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`glass-card rounded-3xl p-6 w-full max-w-md relative overflow-hidden ${modalState === 'success' ? 'neon-glow-green border-[#009739]' : 'neon-glow-yellow'}`}
            >
              {modalState === 'saving' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-[#009739]/30 border-t-[#009739] rounded-full animate-spin mb-4" />
                  <p className="text-white font-bold tracking-widest uppercase">Processando...</p>
                </div>
              )}

              {modalState === 'confirm' && (
                <div className="flex flex-col items-center">
                  <h3 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-6">
                    Confirme seu palpite
                  </h3>
                  <div className="flex items-center justify-center gap-4 mb-8 bg-black/30 p-4 rounded-xl border border-white/10 w-full">
                    <span className="text-xl font-black text-white">{match.teamA.substring(0,3)}</span>
                    <span className="text-3xl font-black text-[#009739]">{goalsA}</span>
                    <span className="text-white/30 font-bold mx-2">X</span>
                    <span className="text-3xl font-black text-[#009739]">{goalsB}</span>
                    <span className="text-xl font-black text-white">{match.teamB.substring(0,3)}</span>
                  </div>
                  <div className="w-full space-y-3">
                    <button 
                      onClick={() => handleConfirm(false)}
                      className="w-full bg-[#009739] text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#00702a] transition-colors shadow-[0_0_15px_rgba(0,151,57,0.5)]"
                    >
                      CONFIRMAR PALPITE
                    </button>
                    <button 
                      onClick={() => setModalState('closed')}
                      className="w-full bg-white/5 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      VOLTAR E EDITAR
                    </button>
                  </div>
                </div>
              )}

              {modalState === 'duplicate_blocked' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#FFCD00]/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <AlertTriangle className="w-8 h-8 text-[#FFCD00]" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-2">
                    Limite Atingido
                  </h3>
                  <p className="text-center text-white/70 mb-8 leading-relaxed font-medium">
                    O limite para esse palpite já foi atingido (<strong className="text-[#FFCD00]">3 participantes</strong> com esse mesmo placar).<br/><br/>Por favor, escolha outro resultado.
                  </p>
                  <button 
                    onClick={() => setModalState('closed')}
                    className="w-full bg-white/5 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    ESCOLHER NOVO PALPITE
                  </button>
                </div>
              )}

              {modalState === 'duplicate_warning' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#FFCD00]/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <AlertTriangle className="w-8 h-8 text-[#FFCD00]" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest text-center text-white mb-2">
                    Atenção!
                  </h3>
                  <p className="text-center text-white/70 mb-8 leading-relaxed font-medium">
                    Já existem <strong className="text-[#FFCD00] text-lg">{duplicatesCount} participantes</strong> com esse mesmo palpite.<br/><br/>Deseja continuar mesmo assim? O prêmio será dividido.
                  </p>
                  <div className="w-full space-y-3">
                    <button 
                      onClick={() => handleConfirm(true)}
                      className="w-full bg-[#FFCD00] text-[#041E42] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-yellow-400 transition-colors"
                    >
                      SIM, CONTINUAR
                    </button>
                    <button 
                      onClick={() => setModalState('closed')}
                      className="w-full bg-white/5 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      ALTERAR PALPITE
                    </button>
                  </div>
                </div>
              )}

              {modalState === 'success' && (
                <div className="flex flex-col items-center py-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-[#009739] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,151,57,0.6)]"
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-center text-white mb-2">
                    Sucesso!
                  </h3>
                  <p className="text-center text-white/70 font-medium tracking-wide">
                    Palpite registrado. Redirecionando...
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
