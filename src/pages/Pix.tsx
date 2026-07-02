import { motion } from 'motion/react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { CheckCircle2, Share2, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../services/api';

export default function Pix() {
  const navigate = useNavigate();
  const [pixValue, setPixValue] = useState('10.00');
  const [pixKey, setPixKey] = useState('bolao2026@email.com');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('getSettings')
      .then(data => {
        const settingsData = data.settings || data;
        if (settingsData.pix_value) setPixValue(settingsData.pix_value);
        if (settingsData.pix_key) setPixKey(settingsData.pix_key);
      })
      .catch(console.warn);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.origin;
    const text = encodeURIComponent(`Já fiz meu palpite no Bolão Copa 2026. Participe você também! ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-md w-full mx-auto pb-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-card neon-glow-green rounded-3xl p-8 text-center relative overflow-hidden"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-[#009739]/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
        >
          <div className="absolute inset-0 bg-[#009739]/20 blur-xl animate-pulse rounded-full" />
          <CheckCircle2 className="w-10 h-10 text-[#009739] z-10" />
        </motion.div>

        <h2 className="text-2xl title-display text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2">PALPITE<br/>SALVO</h2>
        <p className="text-white/70 mb-8 font-medium">
          Seu palpite só será validado após a confirmação do pagamento PIX abaixo.
        </p>

        <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
          <QRCode 
            value={pixKey} 
            size={192}
            level="M"
            className="rounded-lg"
          />
        </div>

        <div className="mb-8">
          <p className="text-[10px] text-white/50 mb-1 font-bold tracking-widest uppercase">Valor da Aposta</p>
          <p className="text-3xl font-black text-[#FFCD00]">R$ {pixValue}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between mb-8 gap-4">
          <div className="text-left overflow-hidden">
             <p className="text-[10px] text-[#009739] uppercase font-bold tracking-widest mb-1">Pix Copia e Cola</p>
             <p className="text-white font-medium truncate text-sm">{pixKey}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-[#009739] shrink-0"
          >
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <button 
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 neon-glow-green uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all mb-4"
        >
          <Share2 className="w-5 h-5" /> CHAMAR AMIGOS
        </button>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-white/10 text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center uppercase tracking-widest hover:bg-white/20 transition-all"
        >
          FECHAR
        </button>
      </motion.div>
    </div>
  );
}
