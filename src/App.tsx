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
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-brand selection:text-white">
      {/* Navigation Detail (Desktop Only) */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-12 border-r-2 border-ink items-center justify-center z-50 bg-paper">
        <p className="writing-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] font-bold text-ink/40">
          Sacred Script AI Systems // Pipeline 4.2.0
        </p>
      </div>

      <header className="relative border-b-2 border-ink px-6 py-10 md:px-24 md:py-16 flex flex-col md:flex-row justify-between items-end gap-6 bg-paper ml-0 lg:ml-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter uppercase leading-[0.85]">
            Audio <br /> Visionary.
          </h1>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">
            Project: {file ? file.name : 'Unknown Narrative'} // Status: {step === 'results' ? 'Output Ready' : 'Processing'}
          </p>
        </motion.div>
        
        <div className="flex flex-col items-end gap-4">
          {step !== 'upload' && !isProcessing && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={reset}
              className="text-[10px] uppercase tracking-[0.2em] font-bold border-2 border-ink px-8 py-3 hover:bg-ink hover:text-paper transition-all duration-300 rounded-full"
            >
              Reset Session
            </motion.button>
          )}
          <div className="inline-block px-4 py-1 border-2 border-brand text-[10px] font-bold uppercase tracking-widest text-brand">
            Live Stream Active
          </div>
        </div>
      </header>

      <main className="relative ml-0 lg:ml-12 px-6 py-12 md:px-24 md:py-20">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group relative aspect-video border-2 border-ink transition-all duration-500 cursor-pointer p-12 flex flex-col items-center justify-center
                  ${file ? 'bg-canvas' : 'bg-white hover:bg-canvas/50'}
                `}
              >
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-brand border-2 border-ink" />
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
                
                {file ? (
                  <div className="text-center">
                    <FileAudio size={48} strokeWidth={1} className="mx-auto mb-6" />
                    <h3 className="text-2xl font-serif italic mb-2">{file.name}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Audio Source Identified</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={48} strokeWidth={1} className="mx-auto mb-8 text-ink/20 group-hover:text-ink transition-colors" />
                    <p className="text-3xl font-serif italic mb-2">Ingest Narrative Source</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">Drop audio file or click to browse</p>
                  </div>
                )}
              </div>

              {file && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={processPipeline}
                  disabled={isProcessing}
                  className="w-full mt-12 bg-ink text-paper py-8 font-serif text-2xl italic flex items-center justify-center gap-4 hover:bg-brand transition-colors duration-500 shadow-[20px_20px_0px_#D4A37320]"
                >
                  Generate Vision Matrix
                  <ChevronRight size={24} />
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
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="flex gap-2 mb-12 h-20 items-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [20, 60, 20],
                      backgroundColor: i % 3 === 0 ? '#D4A373' : '#2C2C2C'
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1, 
                      delay: i * 0.1 
                    }}
                    className="w-1.5"
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink/50 mb-4">
                {step === 'transcribing' ? 'Neural Transcription Engine' : 'Diffusion Prompt Synthesis'}
              </p>
              <h2 className="text-4xl font-serif italic">
                {step === 'transcribing' ? 'Decoding auditory signals...' : 'Mapping semantic structures...'}
              </h2>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-12"
            >
              {/* Left Column: Data Source */}
              <div className="md:col-span-4 flex flex-col gap-12">
                <div className="bg-canvas p-10 border-2 border-ink relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand border-2 border-ink" />
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-6 text-ink/60">
                    <History size={12} />
                    <span>Source Data</span>
                  </div>
                  <h2 className="text-2xl font-serif italic mb-6">Recovered Script</h2>
                  <div className="text-lg leading-relaxed text-ink/80 italic font-serif">
                    "{transcription}"
                  </div>
                  <div className="mt-10 pt-6 border-t border-ink/10 flex justify-between items-center font-mono text-[9px] uppercase tracking-widest text-ink/40">
                    <span>MD5: 7A2B9C...</span>
                    <span>Tokens: {transcription.split(' ').length}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Prompts */}
              <div className="md:col-span-8">
                <div className="flex justify-between items-center mb-12 border-b-2 border-ink pb-6">
                  <h2 className="text-4xl font-serif">Prompt Matrix</h2>
                  <span className="font-mono text-xs text-ink/40">[{prompts.length} CURATED OUTPUTS]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {prompts.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group aspect-square p-8 border-2 border-ink bg-white hover:bg-brand hover:text-white transition-all duration-500 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-40">Prompt #{String(idx + 1).padStart(2, '0')}</span>
                        <button 
                          onClick={() => copyToClipboard(p.prompt, p.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 border border-white hover:bg-white hover:text-brand"
                        >
                          {copiedId === p.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      
                      <p className="text-lg font-serif leading-tight">
                        {p.prompt}
                      </p>

                      <div className="space-y-4">
                        <div className={`h-1 w-full bg-ink/10 group-hover:bg-white/20`} />
                        <p className="font-mono text-[9px] uppercase tracking-[0.05em] opacity-60 leading-tight">
                          {p.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <footer className="col-span-full mt-24 pt-8 border-t-2 border-ink flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase font-mono tracking-[0.3em] text-ink/40">
                <span>Sacred Script AI Systems // 2026</span>
                <span className="hidden md:block">Process Complete: {new Date().toLocaleTimeString()}</span>
                <span>Version 4.2.0-Alpha</span>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Add these styles to your index.css if they don't exist
// .writing-vertical-rl { writing-mode: vertical-rl; }
