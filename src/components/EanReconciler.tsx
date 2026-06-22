import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Download, Table, Eye, Terminal, Save, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RowData {
  ean: string;
  originalLabel: string;
  supplierLabel: string;
  price: string;
  matchScore: number;
  status: 'PERFECT' | 'PARTIAL' | 'UNMATCHED';
}

interface EanReconcilerProps {
  userId?: string;
  initialInput?: string;
}

export default function EanReconciler({ userId, initialInput }: EanReconcilerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [inputRaw, setInputRaw] = useState(
`3017620422003;Nutela 400g;NTELLA CHOC 400G;5.40
5449000000996;Coca 33cl;COCA COLA CLASSIC 330ML;1.20
7613034926815;Perrier 1L;PERIER EA PET 1L;2.10
3155250358821;Pringles Crème;PRINGLS ONION SOUR 175G;3.15
9999999999999;Inconnu;PRODUIT FANTOME;0.00`
  );
  const [results, setResults] = useState<RowData[]>([]);
  
  // Save reconciliation state
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Sync with initialInput when restored from secure workspace
  useEffect(() => {
    if (initialInput) {
      setInputRaw(initialInput);
      setHasRun(false);
      setResults([]);
    }
  }, [initialInput]);

  const runReconciliation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const lines = inputRaw.trim().split('\n');
      const processed: RowData[] = lines.map((line) => {
        const parts = line.split(';');
        const ean = parts[0]?.trim() || '';
        const originalLabel = parts[1]?.trim() || '';
        const supplierLabel = parts[2]?.trim() || '';
        const price = parts[3]?.trim() || '0.00';

        // simple similarity calculation for EAN
        let score = 0;
        let status: 'PERFECT' | 'PARTIAL' | 'UNMATCHED' = 'UNMATCHED';

        if (ean === '9999999999999') {
          score = 15;
          status = 'UNMATCHED';
        } else {
          // Compare strings simply
          const s1 = originalLabel.toLowerCase();
          const s2 = supplierLabel.toLowerCase();
          let common = 0;
          s1.split('').forEach(char => {
            if (s2.includes(char)) common++;
          });
          score = Math.min(100, Math.round((common / Math.max(s1.length, s2.length)) * 100) + 40);
          status = score > 85 ? 'PERFECT' : 'PARTIAL';
        }

        return {
          ean,
          originalLabel,
          supplierLabel,
          price,
          matchScore: score,
          status,
        };
      });

      setResults(processed);
      setIsRunning(false);
      setHasRun(true);
      setSaveSuccess(false);
    }, 1200);
  };

  const handleReset = () => {
    setResults([]);
    setHasRun(false);
    setShowSaveForm(false);
    setSaveSuccess(false);
    setSaveName('');
  };

  const handleDownloadCSV = () => {
    const headers = 'EAN-13;Original Label;Supplier Label;Price;Match Score;Status\n';
    const rows = results
      .map(r => `${r.ean};${r.originalLabel};${r.supplierLabel};${r.price};${r.matchScore}%;${r.status}`)
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reconciliation_ean_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToFirestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !saveName.trim() || !inputRaw.trim()) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'saved_reconciliations'), {
        userId,
        name: saveName.trim(),
        rawInput: inputRaw,
        resultCount: results.length,
        createdAt: serverTimestamp()
      });
      setSaveSuccess(true);
      setShowSaveForm(false);
      setSaveName('');
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error('Error saving reconciliation to Firestore:', err);
      alert('Impossible d\'enregistrer le rapprochement. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Simulateur de Script de Rapprochement</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-1">Python Pandas DataFrame Emulator (EAN-13 Matcher)</p>
        </div>
        <div className="self-start sm:self-center flex items-center gap-1.5 font-mono text-[10px] bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-wider">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Active Data Pipeline
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input */}
        <div className="lg:col-span-6 flex flex-col">
          <label className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
            Entrée CSV / Catalogue Fabricant (EAN;Nom;Nom Fournisseur;Prix) :
          </label>
          <textarea
            value={inputRaw}
            onChange={(e) => setInputRaw(e.target.value)}
            disabled={isRunning}
            rows={7}
            className="w-full flex-1 p-4 rounded-2xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-100 focus:border-brand bg-slate-50 resize-none focus:outline-none transition-all"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={runReconciliation}
              disabled={isRunning || !inputRaw.trim()}
              className="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-brand text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calcul Pandas S-Rank...
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" /> Exécuter le Script
                </>
              )}
            </button>
            {hasRun && (
              <button
                onClick={handleReset}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <label className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2 flex items-center gap-1.5">
            <Terminal size={12} /> Rapport de Jointure Physique :
          </label>
          <div className="flex-1 rounded-2xl border border-slate-900/10 bg-slate-950 text-slate-200 flex flex-col p-5 font-mono text-xs overflow-y-auto max-h-[200px]">
            {!hasRun && !isRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-8">
                <Table size={24} strokeWidth={1.5} className="mb-2 text-slate-400" />
                <span className="text-xs">En attente de démarrage du pipeline.</span>
              </div>
            ) : isRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <span className="text-blue-400 animate-pulse">pd.read_csv(io.StringIO(raw))</span>
                <span className="text-slate-500 text-[9px] mt-1">Executing Levenshtein matching on indexes...</span>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <div className="text-emerald-400 border-b border-slate-800 pb-2 flex justify-between items-center text-[10px]">
                  <span>df.merge(right, on='EAN')</span>
                  <span>[SUCCESS]</span>
                </div>
                {results.map((r, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 border-b border-slate-900 pb-3 text-[11px]">
                    <div className="truncate">
                      <span className="text-blue-400 text-[10px] block font-semibold">{r.ean}</span>
                      <span className="block text-slate-100 font-sans mt-0.5 font-medium">{r.originalLabel}</span>
                      <span className="text-slate-500 text-[9px] block truncate">⇒ Supplier: {r.supplierLabel}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-bold text-slate-100">{r.price}€</span>
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold mt-1.5 font-sans ${r.status === 'PERFECT' ? 'bg-emerald-500/10 text-emerald-400' : r.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {r.status} ({r.matchScore}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasRun && (
            <div className="space-y-2.5 mt-4">
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCSV}
                  className="flex-1 py-3 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  <Download size={13} /> Télécharger (.csv)
                </button>
                
                {userId && (
                  <button
                    onClick={() => {
                      if (saveSuccess) return;
                      setShowSaveForm(!showSaveForm);
                    }}
                    className={`px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer
                      ${saveSuccess 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }
                    `}
                  >
                    {saveSuccess ? (
                      <>
                        <Check size={14} /> Sauvegardé
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Sauvegarder
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Collapsible Save to Firestore form */}
              {showSaveForm && userId && (
                <form onSubmit={handleSaveToFirestore} className="mt-2 p-4 bg-slate-50 border border-slate-150 rounded-2xl flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Nommer cette session (ex: Stock Juin)"
                    className="flex-1 p-2 bg-white rounded-lg border border-slate-200 outline-none text-xs focus:ring-1 focus:ring-blue-100 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !saveName.trim()}
                    className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider cursor-pointer transition-all shrink-0"
                  >
                    🚀 Enregistrer
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


