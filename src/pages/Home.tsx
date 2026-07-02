import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, ChevronRight, User, Phone } from 'lucide-react';
import { UserData } from '../App';

export default function Home({ onComplete }: { onComplete: (data: UserData) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

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
      onComplete({ name, whatsapp });
      navigate('/jogos');
    }
  };

  return (
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

      <div className="mb-4 bg-[#FFCD00]/20 border border-[#FFCD00] text-[#FFCD00] text-xs p-3 rounded-xl text-center">
        <b>Importante:</b> Para GitHub Pages, cole o código do arquivo <code>codigo-do-novo-apps-script.js</code> no seu Google Apps Script e atualize a URL no <code>api.ts</code>.
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

        <div className="pt-2 pb-2">
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 neon-glow-green uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            ENTRAR NO BOLÃO
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <button 
          onClick={() => navigate('/admin')}
          className="text-xs text-white/40 hover:text-white/80 uppercase tracking-widest transition-colors"
        >
          Área do Administrador
        </button>
      </div>
    </motion.div>
  );
}
