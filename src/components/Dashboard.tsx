import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { DayData, KPIStats, Category } from '../types/kpi';
import { kpiService, DEFAULT_CATEGORIES } from '../services/kpiService';

interface DashboardProps {
  user: any;
  onSelectDate: (dateStr: string) => void;
}

export default function Dashboard({ user, onSelectDate }: DashboardProps) {
  const [history, setHistory] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getAllHistory(user?.uid);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load kpi history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-sans text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        <span>Calcul et agrégation des analyses historiques...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm max-w-lg mx-auto p-8 space-y-4">
        <Layers className="mx-auto text-slate-300 w-12 h-12" />
        <h3 className="text-md font-bold text-slate-900 font-sans">Pas encore de données historiques</h3>
        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          Enregistrez des tâches à faire lors des jours précédents pour dresser un bilan complet de vos progrès et indicateurs de performance.
        </p>
        <button 
          onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider"
        >
          Créer ma première journée
        </button>
      </div>
    );
  }

  // Reverse chronological list for charts to go left to right (oldest to newest)
  const chartData = [...history].reverse().map(day => {
    const totalT = day.tasks.length;
    const completedT = day.tasks.filter(t => {
      if (t.subTasks && t.subTasks.length > 0) {
        return t.subTasks.every(s => s.status === 'fait');
      }
      return t.status === 'fait';
    }).length;

    const rate = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

    return {
      date: day.dateStr,
      'KPI Actuel': day.actualKpi,
      'Cible': day.targetKpi,
      'Dépenses €': day.expense,
      'Complétion %': rate,
      'Tâches': totalT
    };
  });

  // Calculate statistics metrics
  const totalDays = history.length;
  
  const avgKpi = Math.round(
    history.reduce((acc, curr) => acc + curr.actualKpi, 0) / totalDays
  );

  const avgTarget = Math.round(
    history.reduce((acc, curr) => acc + curr.targetKpi, 0) / totalDays
  );

  const totalExpense = history.reduce((acc, curr) => acc + curr.expense, 0);

  // Success target achievement rate
  const targetAchievedCount = history.filter(d => d.actualKpi >= d.targetKpi).length;
  const successRatio = Math.round((targetAchievedCount / totalDays) * 100);

  // Category distribution analysis
  const categoryChartData = DEFAULT_CATEGORIES.map(cat => {
    let occurrences = 0;
    let accomplished = 0;

    history.forEach(day => {
      day.tasks.forEach(task => {
        if (task.categoryId === cat.id) {
          occurrences++;
          const finished = task.subTasks && task.subTasks.length > 0
            ? task.subTasks.every(s => s.status === 'fait')
            : task.status === 'fait';
          if (finished) accomplished++;
        }
      });
    });

    return {
      name: cat.name.split(' ')[0], // clear label, keep short text
      fullName: cat.name,
      'Total': occurrences,
      'Réalisé': accomplished,
      color: cat.color
    };
  }).filter(c => c.Total > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest block">KPI Moyen</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900">{avgKpi}%</h3>
            <p className="text-[10px] text-slate-500 font-sans">Objectif moyen fixé à {avgTarget}%</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest block">Succès Cible</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900">{successRatio}%</h3>
            <p className="text-[10px] text-slate-500 font-sans">{targetAchievedCount} jours sur {totalDays} au-dessus de l'objectif</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest block">Dépenses engagées</span>
            <DollarSign size={16} className="text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900">{totalExpense.toFixed(2)} €</h3>
            <p className="text-[10px] text-slate-500 font-sans">Moyenne de {(totalExpense / totalDays).toFixed(2)} € par jour</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest block">Enregistrements</span>
            <Layers size={16} className="text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900">{totalDays} Jours</h3>
            <p className="text-[10px] text-slate-500 font-sans">Historique des données enregistrées</p>
          </div>
        </div>

      </div>

      {/* Main Charts bento container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: KPI progression curve */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Courbe d'évolution du KPI Journalier</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Performance réelle (KPI) comparée à la ligne d'objectif</p>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorKpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px', fontFamily: 'sans-serif' }} 
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="KPI Actuel" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKpi)" />
                <Area type="monotone" dataKey="Cible" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Distribution */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Répartition par Catégories</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Tâches totales créées et accomplies par catégorie d'actions</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} style={{ fontSize: '9px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'sans-serif' }} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Total" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="Réalisé" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 font-sans italic">Aucune catégorie répertoriée</p>
            )}
          </div>
        </div>

      </div>

      {/* Grid: Financial Flow tracking & Detailed History Days Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Expenses timeline */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Suivi des Coûts Journaliers</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Visualisation des dépenses (€) engagées jour par jour</p>
          </div>

          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: '9px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <YAxis tickLine={false} style={{ fontSize: '9px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px' }}
                  formatter={(value) => [`${value} €`, 'Dépense']}
                />
                <Bar dataKey="Dépenses €" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-by-day table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Journal des Enregistrements</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Historique détaillé chaque jour. Cliquez sur l'oeil pour charger la saisie</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 font-bold">Date</th>
                  <th className="py-2.5 font-bold text-center">Score KPI</th>
                  <th className="py-2.5 font-bold text-center">Objectif</th>
                  <th className="py-2.5 font-bold text-center">Toutes les Tâches</th>
                  <th className="py-2.5 font-bold text-right">Dépenses</th>
                  <th className="py-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.slice(0, 5).map((day) => {
                  const targetReached = day.actualKpi >= day.targetKpi;
                  return (
                    <tr key={day.dateStr} className="text-xs group hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-slate-900">{day.dateStr}</td>
                      <td className="py-3 text-center">
                        <span className={`font-mono font-black ${targetReached ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {day.actualKpi}%
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{day.targetKpi}%</td>
                      <td className="py-3 text-center text-slate-600 font-sans font-medium">{day.tasks.length} tâches</td>
                      <td className="py-3 text-right font-mono font-bold text-rose-500">{day.expense.toFixed(2)} €</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectDate(day.dateStr)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 border border-transparent hover:border-emerald-200"
                        >
                          <Eye size={10} /> Examiner
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {history.length > 5 && (
            <p className="text-[10px] text-slate-400 font-sans italic text-right mt-2">
              Affichage des 5 derniers enregistrements (sur {totalDays} jours au total)
            </p>
          )}

        </div>

      </div>
    </div>
  );
}
