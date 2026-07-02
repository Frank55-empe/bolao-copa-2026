import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '../services/api';

export default function Leaderboard() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('getRanking')
      .then(data => {
        setRanking(Array.isArray(data) ? data : (data.data || data.ranking || []));
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-[#FFCD00]/30 border-t-[#FFCD00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden p-6 text-white text-sm">
      <h2 className="text-xl font-bold uppercase tracking-widest text-[#FFCD00] mb-6 flex items-center justify-center gap-2">
        <Award className="w-5 h-5" /> Ranking Geral
      </h2>
      <div className="divide-y divide-white/10">
        {ranking.map((r, idx) => (
          <div key={idx} className={`py-4 flex items-center justify-between gap-4 ${idx === 0 ? 'bg-gradient-to-r from-[#FFCD00]/20 to-transparent p-4 rounded-xl border border-[#FFCD00]/30' : ''}`}>
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-black ${idx === 0 ? 'text-[#FFCD00]' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-white/30'}`}>#{idx + 1}</span>
              <div>
                <div className={`font-bold text-lg uppercase tracking-widest ${idx === 0 ? 'text-[#FFCD00]' : 'text-white'}`}>{r.name}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Pts: {r.totalPoints}</div>
              </div>
            </div>
          </div>
        ))}
        {ranking.length === 0 && (
          <p className="text-center text-white/50 py-4 uppercase font-bold tracking-widest text-xs">Nenhum palpite confirmado para o Ranking ainda.</p>
        )}
      </div>
    </div>
  );
}
