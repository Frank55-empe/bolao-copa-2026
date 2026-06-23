import { motion } from 'motion/react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { CheckCircle2, Share2, Copy, Trophy, Send, ArrowRight, MessageSquare, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const PIX_STATE_KEY = 'bolao2026_pix_state';

export default function Pix() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recupera state do navigate OU do localStorage (SPA redirect no GitHub Pages perde location.state)
  const predictionState = (() => {
    if (location.state) {
      try { localStorage.setItem(PIX_STATE_KEY, JSON.stringify(location.state)); } catch {}
      return location.state as {
        name: string; whatsapp: string;
        match: { teamA: string; teamAFlag: string; teamB: string; teamBFlag: string; date: string; time: string; round: string; };
        goalsA: number; goalsB: number;
      };
    }
    try {
      const saved = localStorage.getItem(PIX_STATE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  const [pixValue, setPixValue] = useState('30.00');
  const [pixKey, setPixKey] = useState('bolao2026@email.com');
  const [copied, setCopied] = useState(false);
  const [adminPhone, setAdminPhone] = useState('35991717912');
  const [customWhatsapp, setCustomWhatsapp] = useState(predictionState?.whatsapp || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [ticketCopied, setTicketCopied] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(data => {
        if (data.pix_value) setPixValue(data.pix_value);
        if (data.pix_key) setPixKey(data.pix_key);
        if (data.admin_phone) setAdminPhone(data.admin_phone);
      });
  }, []);

  const formatWhatsAppNumber = (phoneStr: string) => {
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `55${cleaned}`;
    }
    return cleaned;
  };

  const getWhatsAppLink = (recipientPhone: string, isAdmin: boolean) => {
    if (!predictionState) return '';
    const { name, match, goalsA, goalsB } = predictionState;
    const cleanRecipient = formatWhatsAppNumber(recipientPhone);

    const message = `🏆 *BOLÃO MUNDIAL 2026* 🏆\n` +
      `-----------------------------------\n` +
      `*COMPROVANTE DE PALPITE*\n\n` +
      `👤 *Participante:* ${name}\n` +
      `📱 *WhatsApp:* ${customWhatsapp}\n\n` +
      `⚽ *Jogo:* _${match.teamA}_ *${goalsA} x ${goalsB}* _${match.teamB}_\n` +
      `🏆 *Fase:* ${match.round}\n` +
      `📅 *Data/Hora:* ${match.date} às ${match.time}\n\n` +
      `💵 *Valor do Palpite:* R$ ${pixValue}\n` +
      `🔑 *Chave Pix:* ${pixKey}\n\n` +
      `${isAdmin 
        ? `👉 *Ação Requerida:* Olá admin, este é o comprovante do meu palpite! Efetuei o pagamento via Pix. Aguardo liberação no painel do Bolão. ⚽` 
        : `✅ *Pix enviado!* Aguardando confirmação do administrador para validar meu palpite. Guardo este comprovante!`}`;

    return `https://api.whatsapp.com/send?phone=${cleanRecipient}&text=${encodeURIComponent(message)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.origin;
    const text = encodeURIComponent(`Participe do Bolão Mundial 2026! Faça seus palpites nos maiores jogos da Copa e dispute prêmios em cada rodada. Acesse agora: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const openUserWhatsApp = () => {
    if (!predictionState) return;
    const userPhone = formatWhatsAppNumber(customWhatsapp);
    window.open(getWhatsAppLink(userPhone, false), '_blank', 'noopener,noreferrer');
  };

  const openAdminWhatsApp = () => {
    if (!predictionState) return;
    window.open(getWhatsAppLink(adminPhone, true), '_blank', 'noopener,noreferrer');
  };

  const handleCopyTicket = () => {
    if (!predictionState) return;
    const { name, match, goalsA, goalsB } = predictionState;
    const textMessage = `🏆 *BOLÃO MUNDIAL 2026* 🏆\n` +
      `-----------------------------------\n` +
      `*COMPROVANTE DE PALPITE*\n\n` +
      `👤 *Participante:* ${name}\n` +
      `📱 *WhatsApp:* ${customWhatsapp}\n\n` +
      `⚽ *Jogo:* ${match.teamA} ${goalsA} x ${goalsB} ${match.teamB}\n` +
      `🏆 *Fase:* ${match.round}\n` +
      `📅 *Data/Hora:* ${match.date} às ${match.time}\n\n` +
      `💵 *Valor do Palpite:* R$ ${pixValue}\n` +
      `🔑 *Chave Pix:* ${pixKey}`;
      
    navigator.clipboard.writeText(textMessage);
    setTicketCopied(true);
    setTimeout(() => setTicketCopied(false), 2000);
  };

  const handleConfirmPix = () => {
    setPixConfirmed(true);
    // Automaticamente abre WhatsApp do usuário ao confirmar pagamento
    if (predictionState) {
      const userPhone = formatWhatsAppNumber(customWhatsapp);
      window.open(getWhatsAppLink(userPhone, false), '_blank', 'noopener,noreferrer');
    }
  };

  // Tela de confirmação final após clicar em "Confirmei o Pix"
  if (pixConfirmed) {
    return (
      <div className="max-w-md w-full mx-auto pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card border-2 border-[#009739]/50 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(0,151,57,0.2)]"
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

          <h2 className="text-2xl font-display font-black tracking-widest text-[#FFCD00] mb-2">PALPITE REGISTRADO!</h2>
          <p className="text-white/60 text-sm mb-6 px-4 leading-relaxed">
            Seu palpite foi enviado e estamos aguardando a confirmação do pagamento pelo administrador. Você receberá um aviso pelo WhatsApp quando for aprovado!
          </p>

          {predictionState && (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 text-sm">
              <p className="text-[9px] text-[#009739] uppercase font-bold tracking-widest mb-3">Seu Palpite</p>
              <div className="flex items-center justify-center gap-4 font-black text-white text-lg mb-2">
                <span>{predictionState.match.teamA}</span>
                <span className="text-[#FFCD00] text-2xl">{predictionState.goalsA} x {predictionState.goalsB}</span>
                <span>{predictionState.match.teamB}</span>
              </div>
              <p className="text-white/40 text-xs">{predictionState.match.date} • {predictionState.match.time}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={openAdminWhatsApp}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
            >
              <Send className="w-4 h-4" /> ENVIAR COMPROVANTE AO ADMIN 🚀
            </button>
            <button
              onClick={() => navigate('/jogos')}
              className="w-full bg-[#009739] text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-widest hover:bg-[#00702a] transition-all cursor-pointer"
            >
              Ver Meus Jogos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto pb-8 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-card border-2 border-[#009739]/30 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,151,57,0.15)]"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 bg-[#009739]/20 rounded-full flex items-center justify-center mx-auto mb-4 relative"
        >
          <div className="absolute inset-0 bg-[#009739]/20 blur-xl animate-pulse rounded-full" />
          <CheckCircle2 className="w-8 h-8 text-[#009739] z-10" />
        </motion.div>

        <h2 className="text-xl md:text-2xl font-display font-black tracking-widest text-[#FFCD00] mb-1">PALPITE SALVO!</h2>
        <p className="text-white/60 text-xs mb-6 font-medium px-4">
          Agora realize o pagamento via Pix abaixo para confirmar sua participação no bolão!
        </p>

        {/* Ticket de palpite */}
        {predictionState && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-black/40 border border-white/10 rounded-2xl p-4 mb-6 text-left shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(45deg,transparent_33.3%,rgba(255,255,255,0.05)_33.3%,rgba(255,255,255,0.05)_66.6%,transparent_66.6%)] bg-[length:12px_6px]" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
              <span className="text-[9px] uppercase tracking-widest font-black text-[#FFCD00] flex items-center gap-1">
                <Ticket className="w-3 h-3 text-[#009739]" /> COMPROVANTE DE PALPITE
              </span>
              <span className="text-[9px] uppercase tracking-widest font-mono text-white/40">{predictionState.match.round}</span>
            </div>

            <div className="flex items-center justify-between bg-black/20 rounded-xl p-3 mb-3 border border-white/5">
              <span className="text-white/60 text-xs font-bold truncate max-w-[120px]">{predictionState.match.teamA}</span>
              <span className="text-lg font-black text-[#FFCD00] px-3 bg-white/5 rounded-md border border-white/10">{predictionState.goalsA} x {predictionState.goalsB}</span>
              <span className="text-white/60 text-xs font-bold truncate max-w-[120px] text-right">{predictionState.match.teamB}</span>
            </div>

            <div className="space-y-1.5 text-[10px] text-white/50">
              <div className="flex justify-between"><span className="uppercase tracking-wider">Apostador:</span><span className="text-white font-extrabold">{predictionState.name}</span></div>
              <div className="flex justify-between items-center h-5">
                <span className="uppercase tracking-wider">WhatsApp:</span>
                {isEditingPhone ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={customWhatsapp} 
                      onChange={(e) => setCustomWhatsapp(e.target.value)}
                      className="bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-white text-[10px] font-mono outline-none focus:border-[#009739] w-28 text-right"
                      placeholder="Ex: 35999999999"
                      autoFocus
                    />
                    <button 
                      onClick={() => setIsEditingPhone(false)}
                      className="bg-[#009739] text-white font-bold text-[8px] px-1.5 py-0.5 rounded cursor-pointer uppercase"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-mono">{customWhatsapp || '(Sem WhatsApp)'}</span>
                    <button 
                      onClick={() => setIsEditingPhone(true)}
                      className="text-[#FFCD00] hover:text-white transition-colors text-[8px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      [Editar]
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between"><span className="uppercase tracking-wider">Data do Jogo:</span><span className="text-white/70">{predictionState.match.date} • {predictionState.match.time}</span></div>
            </div>
            
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a1128] rounded-full border-r border-white/10" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0a1128] rounded-full border-l border-white/10" />
          </motion.div>
        )}

        {/* QR Code PIX */}
        <div className="bg-white p-3 md:p-4 rounded-2xl mx-auto w-fit mb-4 border-2 border-[#009739]/50 shadow-md">
          <QRCode 
            value={pixKey} 
            size={144}
            level="M"
            className="rounded-lg"
          />
        </div>

        <div className="mb-6">
          <p className="text-[9px] text-white/40 mb-0.5 font-bold tracking-widest uppercase">Valor da Aposta</p>
          <p className="text-2xl font-black text-[#FFCD00]">R$ {pixValue}</p>
        </div>

        {/* Copiar chave Pix */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between mb-4 gap-3">
          <div className="text-left overflow-hidden w-full">
            <p className="text-[8px] text-[#009739] uppercase font-bold tracking-widest">Código Pix Copia e Cola</p>
            <p className="text-white/80 font-mono text-xs truncate">{pixKey}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-[#FFCD00] shrink-0 border border-white/10 cursor-pointer"
            title="Copiar Chave Pix"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Botões de comprovante */}
        {predictionState && (
          <div className="space-y-2 mb-6 text-xs">
            <button 
              onClick={openUserWhatsApp}
              className="w-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-[10px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> VER MEU COMPROVANTE NO WHATSAPP 💬
            </button>

            <div className="pt-1 text-center">
              <button 
                onClick={handleCopyTicket}
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[10px] text-white/80 px-4 py-2 rounded-xl transition-all font-bold tracking-wider uppercase cursor-pointer"
              >
                {ticketCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> COPIADO! ✓
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#FFCD00]" /> COPIAR COMPROVANTE 📋
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* BOTÃO PRINCIPAL: Confirmar que pagou o Pix */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirmPix}
          className="w-full bg-gradient-to-r from-[#009739] to-[#00702a] text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all cursor-pointer mb-3"
        >
          <CheckCircle2 className="w-5 h-5" /> JÁ FIZ O PIX ✓
        </motion.button>

        <p className="text-[9px] text-white/30 text-center mb-4 uppercase tracking-wider">
          Clique após realizar o pagamento para confirmar
        </p>

        {/* Compartilhar */}
        <div className="pt-3 border-t border-white/5">
          <button 
            onClick={handleShare}
            className="w-full bg-white/5 text-white/55 hover:text-white border border-white/10 font-bold text-[10px] py-3 rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#009739]" /> Convidar Amigos para o Bolão
          </button>
        </div>
      </motion.div>
    </div>
  );
}
