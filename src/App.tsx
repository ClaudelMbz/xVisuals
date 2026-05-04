import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileAudio, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Loader2, 
  History,
  Image as ImageIcon,
  Type,
  ChevronRight
} from 'lucide-react';
import { aiService, ImagePrompt } from './services/aiService';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'transcribing' | 'prompting' | 'results'>('upload');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processPipeline = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setStep('transcribing');
      
      const base64 = await fileToBase64(file);
      const text = await aiService.transcribeAudio(base64, file.type);
      setTranscription(text);
      
      setStep('prompting');
      const generatedPrompts = await aiService.generateImagePrompts(text);
      setPrompts(generatedPrompts);
      
      setStep('results');
    } catch (error) {
      console.error("Pipeline error:", error);
      alert("Something went wrong during processing. Please try again.");
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const reset = () => {
    setFile(null);
    setTranscription('');
    setPrompts([]);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] selection:bg-[#E2D1C3] selection:text-[#1A1A1A]">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#F2EDE7] rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[50%] bg-[#E8E1D9] rounded-full blur-[100px] opacity-40" />
      </div>

      <header className="relative border-b border-[#E8E1D9] px-6 py-8 md:px-12 md:py-12 flex justify-between items-end">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-[#8C8279] mb-4"
          >
            <Sparkles size={12} />
            <span>Sacred Vision Pipeline</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-light tracking-tight leading-[0.9]"
          >
            Aural to <br />
            Visual.
          </motion.h1>
        </div>
        
        {step !== 'upload' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={reset}
            className="text-[10px] uppercase tracking-[0.15em] border border-[#D9CFC7] rounded-full px-6 py-3 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300"
          >
            New Session
          </motion.button>
        )}
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group relative aspect-square md:aspect-video rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer p-8 overflow-hidden
                  ${file ? 'border-[#8C8279] bg-[#F7F3EF]' : 'border-[#D9CFC7] hover:border-[#1A1A1A] hover:bg-white'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white mb-6">
                      <FileAudio size={32} />
                    </div>
                    <h3 className="text-xl font-serif mb-2">{file.name}</h3>
                    <p className="text-sm text-[#8C8279] font-medium uppercase tracking-[0.1em]">Ready for processing</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 flex items-center justify-center mx-auto mb-6 text-[#8C8279] group-hover:scale-110 group-hover:text-[#1A1A1A] transition-all duration-300">
                      <Upload size={32} />
                    </div>
                    <p className="text-lg font-serif mb-1">Upload your audio file</p>
                    <p className="text-xs text-[#8C8279] uppercase tracking-[0.1em]">MP3, WAV, or AAC (approx. 1:30 min)</p>
                  </div>
                )}
                
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#D9CFC7]" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#D9CFC7]" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#D9CFC7]" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#D9CFC7]" />
              </div>

              {file && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={processPipeline}
                  disabled={isProcessing}
                  className="w-full mt-8 bg-[#1A1A1A] text-white rounded-2xl py-6 font-serif text-xl flex items-center justify-center gap-3 hover:bg-black transition-colors shadow-2xl shadow-black/10 group overflow-hidden relative"
                >
                  <span className="relative z-10">Begin Transcription</span>
                  <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </motion.button>
              )}
            </motion.div>
          )}

          {(step === 'transcribing' || step === 'prompting') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-32 h-32 mb-8">
                <Loader2 className="w-full h-full text-[#D9CFC7] animate-spin" strokeWidth={0.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-[#1A1A1A] animate-pulse" size={32} />
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#8C8279] font-semibold mb-2">
                {step === 'transcribing' ? 'Converting Sound to Text' : 'Conceptualizing Visuals'}
              </p>
              <h2 className="text-3xl font-serif italic text-center">
                {step === 'transcribing' ? 'Listening to the narrative...' : 'Painting with words...'}
              </h2>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-24"
            >
              {/* Transcription Section */}
              <section className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
                <div className="sticky top-12">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C8279] mb-4">
                    <Type size={14} />
                    <span>The Narrative</span>
                  </div>
                  <h2 className="text-4xl font-serif font-light leading-tight">
                    Recovered <br />Transcription
                  </h2>
                </div>
                <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-sm border border-[#F2EDE7] leading-relaxed text-xl md:text-2xl font-serif text-[#4A443F]">
                  "{transcription}"
                  <div className="w-12 h-[1px] bg-[#D9CFC7] mt-12" />
                </div>
              </section>

              {/* Prompts Section */}
              <section>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C8279] mb-4">
                      <ImageIcon size={14} />
                      <span>The Vision</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-light">Image Prompt Registry</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8C8279] italic mb-1">{prompts.length} Curated Variations</p>
                    <p className="inline-block px-3 py-1 bg-[#F2EDE7] rounded-full text-[10px] font-bold uppercase tracking-wider">High Fidelity Prompts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {prompts.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white p-8 rounded-3xl border border-[#F2EDE7] hover:border-[#D9CFC7] hover:shadow-xl hover:shadow-[#1A1A1A]/5 transition-all duration-500 flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-mono text-[#D9CFC7] font-bold tracking-widest">{String(idx + 1).padStart(2, '0')}</span>
                        <button 
                          onClick={() => copyToClipboard(p.prompt, p.id)}
                          className={`p-2 rounded-xl transition-all duration-300 ${copiedId === p.id ? 'bg-green-50 text-green-600' : 'text-[#8C8279] hover:bg-[#FDFCFB] hover:text-[#1A1A1A]'}`}
                        >
                          {copiedId === p.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-xs uppercase tracking-[0.1em] font-bold text-[#D9CFC7] mb-3">AI PROMPT</p>
                        <p className="text-lg font-serif leading-snug line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                          {p.prompt}
                        </p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-[#FDFCFB]">
                        <p className="text-[11px] text-[#8C8279] uppercase tracking-[0.05em] leading-relaxed">
                          <span className="font-bold text-[#B1A69D]">Concept:</span> {p.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
              
              <footer className="pt-20 pb-10 border-t border-[#E8E1D9] text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#D9CFC7] font-bold">End of Vision — Sacred Vision Pipeline</p>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Rail (Desktop Only) */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-12 border-r border-[#E8E1D9] items-center justify-center z-50">
        <p className="writing-vertical-rl rotate-180 text-[9px] uppercase tracking-[0.4em] font-bold text-[#D9CFC7]">
          Biblical Narrative Synthesis — 2026
        </p>
      </div>
    </div>
  );
}

// Add these styles to your index.css if they don't exist
// .writing-vertical-rl { writing-mode: vertical-rl; }
