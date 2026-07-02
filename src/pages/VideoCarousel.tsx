import React, { useState } from 'react';
import { Upload, Link2, Download, Copy, RefreshCw, ChevronLeft, ChevronRight, Play, Edit2, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API (Make sure to use server-side for production to protect key)
// In this MVP, we mock the server-side generation using a simulated delay
const generateCarouselContent = async (videoSource: string | File) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, text: "GANCHO IMPERDÍVEL: Como transformar 1 hora de vídeo em 1 semana de conteúdo para o Instagram 🚀", isHook: true },
        { id: 2, text: "O maior erro dos criadores de conteúdo é achar que precisam gravar vídeos novos todos os dias. A verdade é que a reciclagem inteligente é o segredo do crescimento.", isHook: false },
        { id: 3, text: "Passo 1: Extraia os melhores 'nuggets' do seu vídeo longo. Procure por momentos onde você revelou um dado impactante ou um tutorial rápido.", isHook: false },
        { id: 4, text: "Passo 2: Use Inteligência Artificial para resumir o raciocínio. Menos é mais num carrossel. Vá direto ao ponto e mantenha as frases curtas e digeríveis.", isHook: false },
        { id: 5, text: "Pronto para escalar sua produção de conteúdo? Salve este post e aplique esse funil na sua próxima estratégia! 🔥", isHook: false, isCTA: true },
      ]);
    }, 2500);
  });
};

export default function VideoCarousel() {
  const [inputType, setInputType] = useState<'upload' | 'link'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [theme, setTheme] = useState({ bg: 'bg-[#0F172A]', text: 'text-white', accent: 'text-purple-500' });
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleGenerate = async () => {
    if (inputType === 'link' && !videoLink) return alert('Insira um link válido');
    if (inputType === 'upload' && !videoFile) return alert('Faça upload de um vídeo');

    setIsProcessing(true);
    try {
      const generated = await generateCarouselContent(inputType === 'link' ? videoLink : videoFile as File);
      setSlides(generated as any[]);
      setCurrentSlide(0);
    } catch (error) {
      alert('Erro na geração');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = (id: number) => {
    setSlides(slides.map(s => s.id === id ? { ...s, text: editingContent } : s));
    setEditingSlideId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            Video2Carousel AI
          </h1>
          <p className="text-gray-400">Transforme vídeos em carrosséis virais em segundos.</p>
        </div>

        {/* Input Region */}
        {!slides.length && !isProcessing && (
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl space-y-6">
            <div className="flex gap-4 p-1 bg-gray-900 rounded-lg w-max mx-auto">
              <button 
                onClick={() => setInputType('link')}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${inputType === 'link' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                Colar Link
              </button>
              <button 
                onClick={() => setInputType('upload')}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${inputType === 'upload' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                Upload MP4
              </button>
            </div>

            {inputType === 'link' ? (
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="url" 
                  value={videoLink}
                  onChange={e => setVideoLink(e.target.value)}
                  placeholder="Cole o link do YouTube aqui..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-purple-500 transition-colors cursor-pointer group">
                <Upload className="mx-auto w-10 h-10 text-gray-500 group-hover:text-purple-500 mb-4 transition-colors" />
                <p className="text-sm text-gray-400 mb-1">Arraste seu vídeo mp4 aqui ou clique para selecionar</p>
                <input 
                  type="file" 
                  accept="video/mp4"
                  onChange={e => e.target.files && setVideoFile(e.target.files[0])}
                  className="hidden" 
                  id="file-upload" 
                />
                <label htmlFor="file-upload" className="text-purple-400 font-medium cursor-pointer hover:underline">
                  {videoFile ? videoFile.name : 'Procurar arquivos'}
                </label>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Gerar Carrossel com IA
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center p-20 space-y-6">
            <RefreshCw className="w-12 h-12 text-purple-500 animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-white">Analisando conteúdo...</h3>
              <p className="text-gray-400 text-sm max-w-sm">A IA está processando a transcrição, identificando o gancho principal e estruturando os pontos chave. Isso leva alguns segundos.</p>
            </div>
            {/* Skeleton blocks */}
            <div className="flex gap-4 animate-pulse pt-8 w-full max-w-sm justify-center">
               <div className="w-16 h-20 bg-gray-800 rounded"></div>
               <div className="w-16 h-20 bg-gray-800 rounded"></div>
               <div className="w-16 h-20 bg-gray-800 rounded"></div>
            </div>
          </div>
        )}

        {/* Editor Preview */}
        {slides.length > 0 && !isProcessing && (
          <div className="grid md:grid-cols-12 gap-8">
            {/* Settings Sidebar */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Aparência</h3>
                <div className="space-y-3">
                  <button onClick={() => setTheme({bg: 'bg-white', text: 'text-gray-900', accent: 'text-purple-600'})} className="w-full h-10 bg-white rounded-lg border border-gray-700 hover:ring-2 ring-purple-500 transition-all"></button>
                  <button onClick={() => setTheme({bg: 'bg-[#0F172A]', text: 'text-white', accent: 'text-purple-500'})} className="w-full h-10 bg-[#0F172A] rounded-lg border border-gray-700 hover:ring-2 ring-purple-500 transition-all"></button>
                  <button onClick={() => setTheme({bg: 'bg-zinc-950', text: 'text-zinc-100', accent: 'text-yellow-400'})} className="w-full h-10 bg-zinc-950 rounded-lg border border-gray-600 hover:ring-2 ring-yellow-500 transition-all"></button>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Baixar Slides (PNG)
                </button>
                <button onClick={() => alert('Texto copiado com sucesso!')} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl border border-gray-700 hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors">
                  <Copy className="w-4 h-4" /> Copiar Textos
                </button>
                <button onClick={() => { setSlides([]); setVideoLink(''); setVideoFile(null); }} className="w-full text-xs text-gray-500 hover:text-white py-2">
                  Gerar novo conteúdo
                </button>
              </div>
            </div>

            {/* Slide Preview */}
            <div className="md:col-span-9">
              <div className="relative aspect-[4/5] max-w-sm mx-auto shadow-2xl overflow-hidden rounded-md group">
                <div className={`absolute inset-0 p-8 flex flex-col justify-center items-center text-center transition-colors ${theme.bg} ${theme.text}`}>
                  {editingSlideId === slides[currentSlide].id ? (
                     <div className="w-full z-10 flex flex-col gap-3">
                       <textarea 
                         value={editingContent}
                         onChange={(e) => setEditingContent(e.target.value)}
                         className={`w-full h-40 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-black/50 text-white border-white/20`}
                       />
                       <button onClick={() => handleSaveEdit(slides[currentSlide].id)} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                         <Check className="w-4 h-4" /> Salvar Textos
                       </button>
                     </div>
                  ) : (
                    <>
                      {slides[currentSlide].isHook && (
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border ${theme.text === 'text-white' ? 'border-white/20 bg-white/10' : 'border-black/20 bg-black/5'}`}>
                          Gancho
                        </div>
                      )}
                      {slides[currentSlide].isCTA && (
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border ${theme.text === 'text-white' ? 'border-white/20 bg-white/10' : 'border-black/20 bg-black/5'}`}>
                          Chamada de Ação
                        </div>
                      )}
                      
                      <h2 className={`${slides[currentSlide].isHook ? 'text-2xl font-black' : 'text-lg font-medium'} leading-snug break-words whitespace-pre-wrap`}>
                        {slides[currentSlide].text}
                      </h2>

                      {/* Edit overlay */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setEditingSlideId(slides[currentSlide].id); setEditingContent(slides[currentSlide].text); }}
                           className={`p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 text-white`}
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                      </div>
                    </>
                  )}
                  
                  {/* Paginator dots */}
                  <div className="absolute bottom-6 flex gap-2">
                    {slides.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${currentSlide === i ? `w-6 bg-current ${theme.accent.replace('text-', 'bg-')}` : 'w-1.5 bg-current opacity-30'}`} />
                    ))}
                  </div>
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                  disabled={currentSlide === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-black/20 text-white disabled:opacity-0 hover:bg-black/40 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-md bg-black/20 text-white disabled:opacity-0 hover:bg-black/40 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Slide thumbnails */}
              <div className="max-w-sm mx-auto mt-6 flex gap-2 overflow-x-auto pb-2">
                 {slides.map((s, i) => (
                   <button 
                     key={s.id}
                     onClick={() => setCurrentSlide(i)}
                     className={`flex-shrink-0 w-12 h-16 rounded overflow-hidden border-2 transition-all ${currentSlide === i ? 'border-purple-500 scale-110' : 'border-gray-700 opacity-50 hover:opacity-100'}`}
                   >
                     <div className={`w-full h-full ${theme.bg} text-[6px] p-1 overflow-hidden leading-tight ${theme.text}`}>
                       {s.text}
                     </div>
                   </button>
                 ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
