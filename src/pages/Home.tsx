import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronRight, User, Phone, X, Award, Bell } from 'lucide-react';
import { UserData } from '../App';
import { api } from '../services/api';

export default function Home({ onComplete }: { onComplete: (data: UserData) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notificationsOptIn, setNotificationsOptIn] = useState(true);
  const [rules, setRules] = useState('');
  const [showRegulamento, setShowRegulamento] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => {
      setRules(data.regulamento || '');
    }).catch(err => console.error(err));
  }, []);

  const formatWhatsapp = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ` + raw.slice(2);
    if (raw.length > 7) formatted = formatted.slice(0, 10) + '-' + raw.slice(7, 11);
    return formatted;
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsapp(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name, whatsapp, notificationsOptIn });
      navigate('/jogos');
    }
  };

  return (
    <div className="relative w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full mx-auto flex flex-col justify-center min-h-[80vh]"
      >
        <div className="text-center mb-10 text-shadow-strong">
          <h1 className="title-display text-[60px] md:text-[80px] mb-4 text-white leading-none">
            BOLÃO<br /><span className="text-[#FFCD00]">MUNDIAL</span><br />2026
          </h1>
          <p className="text-lg text-white font-medium px-4 max-w-sm mx-auto leading-relaxed">
            Palpite agora no jogo em destaque da Copa e mostre que você entende de futebol.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFCD00] pb-1 block drop-shadow-md">Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50">
                <User className="h-5 w-5" />
              </div>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/20 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#009739] focus:bg-black/60 shadow-inner transition-all font-medium placeholder:text-white/30"
                placeholder="Como você quer ser chamado?"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFCD00] pb-1 block drop-shadow-md">WhatsApp</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50">
                <Phone className="h-5 w-5" />
              </div>
              <input 
                type="tel" 
                required
                value={whatsapp}
                onChange={handleWhatsappChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full bg-black/40 border border-white/20 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#009739] focus:bg-black/60 shadow-inner transition-all font-medium placeholder:text-white/30"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 mt-2 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                checked={notificationsOptIn}
                onChange={(e) => setNotificationsOptIn(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${notificationsOptIn ? 'bg-[#009739] border-[#009739]' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                {notificationsOptIn && <Bell className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="text-xs text-white/70 leading-snug">
              Desejo receber alertas pelo WhatsApp sobre os próximos jogos e resultados do bolão.
            </div>
          </label>

          <div className="pt-2 pb-2">
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 neon-glow-green uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              PARTICIPAR AGORA
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setShowRegulamento(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/30 hover:bg-black/50 hover:border-[#FFCD00]/50 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-3.5 h-3.5 text-[#FFCD00]" />
            Ver Regulamento do Bolão
          </button>
        </div>
      </motion.div>

      {/* Modern High-Contrast Rules Modal */}
      <AnimatePresence>
        {showRegulamento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegulamento(false)}
              className="absolute inset-0 bg-[#020D1F]/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md glass-card rounded-3xl p-6 md:p-8 overflow-hidden border-2 border-white/25 shadow-2xl z-10"
            >
              <button 
                onClick={() => setShowRegulamento(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
              >
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

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-white/95 text-sm leading-relaxed scrollbar-thin">
                {rules ? (
                  rules.split('\n').filter(line => line.trim() !== '').map((rule, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="p-3 bg-white/5 border border-white/10 rounded-xl transition-all"
                    >
                      <p className="font-semibold text-white">{rule}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-white/50 italic py-4">Carregando regulamento oficial...</p>
                )}
              </div>

              <button 
                onClick={() => setShowRegulamento(false)}
                className="w-full mt-6 bg-[#009739] hover:bg-[#00702a] text-white font-bold py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg"
              >
                ENTENDI E ACEITO
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
