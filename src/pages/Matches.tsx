import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, ChevronRight, CheckCircle2, History, Trophy, Award } from 'lucide-react';
import { MatchData, UserData } from '../App';
import { api } from '../services/api';
import Leaderboard from '../components/Leaderboard';

export default function Matches({ user }: { user: UserData }) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [myPredictions, setMyPredictions] = useState<any[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jogos' | 'meus-palpites' | 'ranking'>('jogos');

  useEffect(() => {
    Promise.all([
      api.get('getMatches').catch(() => []),
      api.get('getUserPredictions', { whatsapp: user.whatsapp }).catch(() => []),
      api.get('getSettings').catch(() => ({}))
    ]).then(([matchesData, predictionsData, settingsData]) => {
      setMatches(Array.isArray(matchesData) ? matchesData : (matchesData.data || matchesData.matches || []));
      setMyPredictions(Array.isArray(predictionsData) ? predictionsData : (predictionsData.data || []));
      setActiveMatchId(settingsData.active_match_id || '');
      setLoading(false);
    });
  }, [user.whatsapp]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#009739]/30 border-t-[#009739] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 mt-4"
      >
        <h2 className="text-4xl title-display mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Jogos da Copa</h2>
        
        <div className="flex bg-white/5 p-1 rounded-xl mt-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('jogos')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'jogos' 
                ? 'bg-[#009739] text-white shadow-lg' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            Próximos
          </button>
          <button 
            onClick={() => setActiveTab('meus-palpites')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'meus-palpites' 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            Seus Palpites
          </button>
          <button 
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'ranking' 
                ? 'bg-[#FFCD00] text-black shadow-lg' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" /> Ranking
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'jogos' && (
          <motion.div 
            key="jogos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {matches.filter(m => m.isActive === 1 && m.isClosed !== 1).length === 0 ? (
               <div className="glass-card p-12 rounded-3xl text-center">
                 <p className="text-lg text-white/50 font-bold mb-2">Nenhum bolão disponível no momento.</p>
               </div>
            ) : (
                matches.filter(m => m.isActive === 1 && m.isClosed !== 1).map((match, idx) => {
                  const isFeatured = idx === 0; // Just styling the first active match as featured
                  return (
                  <motion.button
                    onClick={() => navigate(`/palpite/${match.id}`, { state: match })}
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`w-full glass-card p-6 md:p-8 rounded-3xl transition-all group active:scale-[0.98] text-left relative overflow-hidden ${isFeatured ? 'border-2 border-[#009739] shadow-[0_0_30px_rgba(0,151,57,0.3)] mb-6' : 'border border-white/10 mb-4 opacity-80 hover:opacity-100'}`}
                  >
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                       {isFeatured && (
                         <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#009739] to-[#00702a] px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                           🏆 Bolão do Dia
                         </span>
                       )}
                       <span className="text-[10px] font-bold text-[#FFCD00] bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                         {match.round}
                       </span>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                      <div className="flex flex-col items-center gap-2 w-full md:w-32">
                        {match.teamAFlag.startsWith('http') ? (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1">
                            <img src={match.teamAFlag} alt={match.teamA} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-5xl md:text-6xl drop-shadow-xl">{match.teamAFlag}</span>
                        )}
                        <span className={`font-black uppercase tracking-tighter text-xl text-center ${match.teamA === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{match.teamA}</span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-3xl font-black text-white/20">X</span>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{match.stadium}</p>
                          <p className="text-xs font-black text-[#FFCD00]">{match.date} • {match.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 w-full md:w-32">
                        {match.teamBFlag.startsWith('http') ? (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 mb-1">
                            <img src={match.teamBFlag} alt={match.teamB} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-5xl md:text-6xl drop-shadow-xl">{match.teamBFlag}</span>
                        )}
                        <span className={`font-black uppercase tracking-tighter text-xl text-center ${match.teamB === 'Brasil' ? 'text-[#FFCD00]' : 'text-white'}`}>{match.teamB}</span>
                      </div>
                    </div>
                  </motion.button>
                  );
                })
            )}
          </motion.div>
        )}
        
        {activeTab === 'meus-palpites' && (
          <motion.div 
            key="meus-palpites"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {myPredictions.length === 0 ? (
               <div className="glass-card p-12 rounded-3xl text-center">
                 <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                 <p className="text-lg text-white/50 font-bold mb-6">Você ainda não tem palpites.</p>
                 <button 
                   onClick={() => setActiveTab('jogos')}
                   className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all"
                 >
                   Fazer primeiro palpite
                 </button>
               </div>
            ) : (
               myPredictions.map((prediction, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   className="glass-card p-6 rounded-2xl relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
                        {prediction.date}
                      </span>
                      {prediction.statusPix === 'PAID' ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#009739] bg-[#009739]/10 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> PIX CONFIRMADO
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#FFCD00] border border-[#FFCD00]/30 px-3 py-1.5 rounded-full">
                            <Clock className="w-3 h-3" /> AGUARDANDO APROVAÇÃO
                          </div>
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
                        <span className="font-black text-sm uppercase text-center">{prediction.teamA.substring(0, 3)}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">
                          {prediction.goalsA}
                        </div>
                        <span className="text-xl font-black text-white/20">X</span>
                         <div className="w-12 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl font-black border border-white/20">
                          {prediction.goalsB}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        {prediction.teamBFlag?.startsWith('http') ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1">
                            <img src={prediction.teamBFlag} alt={prediction.teamB} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-4xl drop-shadow-md">{prediction.teamBFlag}</span>
                        )}
                        <span className="font-black text-sm uppercase text-center">{prediction.teamB.substring(0, 3)}</span>
                      </div>
                    </div>

                    {prediction.statusPix === 'PENDING' && prediction.isClosed !== 1 && (
                        <button 
                          onClick={() => navigate('/pix')}
                          className="w-full mt-6 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                        >
                          Efetuar Pagamento
                        </button>
                    )}

                    {prediction.isClosed === 1 && prediction.statusPix === 'PAID' && (
                      <div className="mt-6 pt-4 border-t border-white/10 text-center flex flex-col items-center">
                        <div className="mb-3 flex items-center justify-center gap-2">
                           <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Placar Oficial:</span>
                           <span className="text-sm font-black text-white px-2 py-1 bg-white/10 rounded-md">
                             {prediction.resultA ?? '-'} x {prediction.resultB ?? '-'}
                           </span>
                        </div>
                        <div className="bg-gradient-to-r from-[#FFCD00]/20 to-[#FFCD00]/5 text-[#FFCD00] rounded-xl px-4 py-3 inline-flex items-center gap-2 font-bold text-xs uppercase tracking-widest border border-[#FFCD00]/30 shadow-lg">
                          <Trophy className="w-4 h-4" />
                          +{prediction.points || 0} Pontos
                        </div>
                      </div>
                    )}
                    
                    {prediction.isClosed === 1 && prediction.statusPix === 'PENDING' && (
                      <div className="mt-6 pt-4 border-t border-white/10 text-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30">
                          Palpite Cancelado / Não Pago
                        </span>
                      </div>
                    )}
                 </motion.div>
               ))
            )}
          </motion.div>
        )}
        
        {activeTab === 'ranking' && (
          <motion.div 
            key="ranking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Leaderboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
