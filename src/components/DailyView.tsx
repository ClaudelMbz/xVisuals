import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar, 
  Heart, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  TrendingUp, 
  Briefcase,
  DollarSign, 
  Activity, 
  FileText,
  User,
  Coffee,
  X,
  Target
} from 'lucide-react';
import { Task, SubTask, DayData, Category, TaskWeight, TaskStatus, TASK_WEIGHTS, TASK_STATUSES } from '../types/kpi';
import { kpiService, DEFAULT_CATEGORIES } from '../services/kpiService';

interface DailyViewProps {
  user: any;
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
}

export default function DailyView({ user, currentDateStr, onDateChange }: DailyViewProps) {
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New task form state
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [taskWeight, setTaskWeight] = useState<TaskWeight>('moyenne');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskEstimatedTime, setTaskEstimatedTime] = useState(30);

  // Subtask creation state per-task ID
  const [addingSubtaskId, setAddingSubtaskId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskWeight, setSubtaskWeight] = useState<TaskWeight>('moyenne');

  // Local input states for target KPI and expense to prevent typing lag and async race conditions
  const [localTargetKpi, setLocalTargetKpi] = useState<string>('');
  const [localExpense, setLocalExpense] = useState<string>('');

  // Load day data on date change or user change
  const loadDayData = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getDayData(user?.uid, currentDateStr);
      if (!data.tasks) {
        data.tasks = [];
      }
      setDayData(data);
      setLocalTargetKpi(String(data.targetKpi ?? 80));
      setLocalExpense(String(data.expense ?? 0));
    } catch (err) {
      console.error('Failed to load daily tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDayData();
  }, [currentDateStr, user]);

  // Sync inputs with state when dayData changes, unless currently being typed into
  useEffect(() => {
    if (dayData) {
      if (document.activeElement?.id !== 'target-kpi-input') {
        setLocalTargetKpi(String(dayData.targetKpi));
      }
      if (document.activeElement?.id !== 'expense-input') {
        setLocalExpense(String(dayData.expense));
      }
    }
  }, [dayData]);

  const saveChanges = async (updatedData: DayData) => {
    setSaving(true);
    try {
      await kpiService.saveDayData(user?.uid, updatedData);
      setDayData({ ...updatedData });
    } catch (err) {
      console.error('Failed to save daily changes:', err);
    } finally {
      setSaving(false);
    }
  };

  // Navigate date offset
  const shiftDate = (offset: number) => {
    const current = new Date(currentDateStr);
    current.setDate(current.getDate() + offset);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    onDateChange(`${yyyy}-${mm}-${dd}`);
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !dayData) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      categoryId: taskCategory,
      weight: taskWeight,
      status: 'pas-fait',
      notes: taskNotes.trim() || undefined,
      estimatedTime: taskEstimatedTime || undefined,
      subTasks: []
    };

    const updated = {
      ...dayData,
      tasks: [...dayData.tasks, newTask]
    };
    
    await saveChanges(updated);
    
    // Clear form
    setTaskTitle('');
    setTaskNotes('');
    setTaskEstimatedTime(30);
    setShowAddTask(false);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      tasks: dayData.tasks.filter(t => t.id !== taskId)
    };
    await saveChanges(updated);
  };

  // Update Task fields (Status, Weight, etc.)
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      tasks: dayData.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    };
    await saveChanges(updated);
  };

  const handleUpdateTaskWeight = async (taskId: string, weight: TaskWeight) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      tasks: dayData.tasks.map(t => t.id === taskId ? { ...t, weight } : t)
    };
    await saveChanges(updated);
  };

  // Add Subtask
  const handleAddSubTask = async (taskId: string) => {
    if (!subtaskTitle.trim() || !dayData) return;

    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      title: subtaskTitle.trim(),
      weight: subtaskWeight,
      status: 'pas-fait'
    };

    const updated = {
      ...dayData,
      tasks: dayData.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subTasks: [...t.subTasks, newSub]
          };
        }
        return t;
      })
    };

    await saveChanges(updated);
    setSubtaskTitle('');
    setAddingSubtaskId(null);
  };

  // Delete Subtask
  const handleDeleteSubTask = async (taskId: string, subId: string) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      tasks: dayData.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subTasks: t.subTasks.filter(s => s.id !== subId)
          };
        }
        return t;
      })
    };
    await saveChanges(updated);
  };

  // Update Subtask Status
  const handleUpdateSubStatus = async (taskId: string, subId: string, status: TaskStatus) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      tasks: dayData.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subTasks: t.subTasks.map(s => s.id === subId ? { ...s, status } : s)
          };
        }
        return t;
      })
    };
    await saveChanges(updated);
  };

  // Update overall Day metrics: targetKpi & daily expense
  const handleUpdateDayMeta = async (fields: Partial<Pick<DayData, 'targetKpi' | 'expense'>>) => {
    if (!dayData) return;
    const updated = {
      ...dayData,
      ...fields
    };
    await saveChanges(updated);
  };

  const handleTargetKpiBlur = async () => {
    if (!dayData) return;
    const val = parseInt(localTargetKpi, 10);
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 80 : val));
    setLocalTargetKpi(String(clamped));
    if (clamped !== dayData.targetKpi) {
      await handleUpdateDayMeta({ targetKpi: clamped });
    }
  };

  const handleTargetKpiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleExpenseBlur = async () => {
    if (!dayData) return;
    const val = parseFloat(localExpense);
    const safe = Math.max(0, isNaN(val) ? 0 : val);
    const refTwoDecimals = parseFloat(safe.toFixed(2));
    setLocalExpense(String(refTwoDecimals));
    if (refTwoDecimals !== dayData.expense) {
      await handleUpdateDayMeta({ expense: refTwoDecimals });
    }
  };

  const handleExpenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-sans text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        <span>Calcul et synchronisation de vos scores KPI...</span>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs font-sans">
        Impossible de charger les données du jour.
      </div>
    );
  }

  // Live KPI scoring breakdown for UI
  const currentKpi = dayData.actualKpi;
  const isTargetAchieved = currentKpi >= dayData.targetKpi;

  // Let's compute statistics for this specific day
  const totalTasks = dayData.tasks.length;
  const finishedTasks = dayData.tasks.filter(t => {
    if (t.subTasks && t.subTasks.length > 0) {
      return t.subTasks.every(s => s.status === 'fait');
    }
    return t.status === 'fait';
  }).length;

  const totalTime = dayData.tasks.reduce((acc, t) => {
    let tTime = t.estimatedTime || 0;
    if (t.subTasks && t.subTasks.length > 0) {
      tTime += t.subTasks.reduce((sAcc, s) => sAcc + (s.estimatedTime || 0), 0);
    }
    return acc + tTime;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Date Navigator Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => shiftDate(-1)}
            className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl border border-slate-100 text-slate-600 transition-all cursor-pointer"
            title="Jour Précédent"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="relative flex items-center gap-2">
            <Calendar size={15} className="text-emerald-500 shrink-0" />
            <input 
              type="date"
              value={currentDateStr}
              onChange={(e) => onDateChange(e.target.value)}
              className="font-mono text-sm font-bold text-slate-950 outline-none hover:text-emerald-600 transition-all cursor-pointer bg-transparent border-0 focus:ring-0 p-0"
            />
          </div>

          <button 
            onClick={() => shiftDate(1)}
            className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl border border-slate-100 text-slate-600 transition-all cursor-pointer"
            title="Jour Suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Real-time Scoring Indicator Panel */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Score KPI :</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${isTargetAchieved ? 'text-emerald-600' : 'text-amber-500'}`}>
                {currentKpi}%
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {dayData.targetKpi}% (cible)</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-100 hidden md:block"></div>

          {/* Quick interactive parameters of the day */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5" title="Modifier l'objectif KPI du jour">
              <Target size={14} className="text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-600">Cible:</span>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-sm">
                <button 
                  onClick={async () => {
                    if (!dayData) return;
                    const nextVal = Math.max(0, dayData.targetKpi - 1);
                    setLocalTargetKpi(String(nextVal));
                    await handleUpdateDayMeta({ targetKpi: nextVal });
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 active:scale-95 text-slate-600 rounded-lg border border-slate-100 font-bold transition-all text-xs cursor-pointer select-none"
                  title="Diminuer de 1%"
                >
                  -
                </button>
                <input 
                  id="target-kpi-input"
                  type="text"
                  value={localTargetKpi}
                  onChange={(e) => setLocalTargetKpi(e.target.value)}
                  onBlur={handleTargetKpiBlur}
                  onKeyDown={handleTargetKpiKeyDown}
                  className="w-10 text-center font-mono text-xs font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 outline-none"
                />
                <button 
                  onClick={async () => {
                    if (!dayData) return;
                    const nextVal = Math.min(100, dayData.targetKpi + 1);
                    setLocalTargetKpi(String(nextVal));
                    await handleUpdateDayMeta({ targetKpi: nextVal });
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 active:scale-95 text-slate-600 rounded-lg border border-slate-100 font-bold transition-all text-xs cursor-pointer select-none"
                  title="Augmenter de 1%"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-400 font-mono">%</span>
            </div>

            <div className="flex items-center gap-1.5" title="Modifier les dépenses / budget engagé (€)">
              <DollarSign size={14} className="text-slate-400" />
              <span className="text-xs font-mono font-medium text-slate-600">Dépenses:</span>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-sm">
                <button 
                  onClick={async () => {
                    if (!dayData) return;
                    const nextVal = Math.max(0, parseFloat((dayData.expense - 1).toFixed(2)));
                    setLocalExpense(String(nextVal));
                    await handleUpdateDayMeta({ expense: nextVal });
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 active:scale-95 text-slate-600 rounded-lg border border-slate-100 font-bold transition-all text-xs cursor-pointer select-none"
                  title="Diminuer de 1€"
                >
                  -
                </button>
                <input 
                  id="expense-input"
                  type="text"
                  value={localExpense}
                  onChange={(e) => setLocalExpense(e.target.value)}
                  onBlur={handleExpenseBlur}
                  onKeyDown={handleExpenseKeyDown}
                  className="w-14 text-center font-mono text-xs font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 outline-none"
                />
                <button 
                  onClick={async () => {
                    if (!dayData) return;
                    const nextVal = Math.max(0, parseFloat((dayData.expense + 1).toFixed(2)));
                    setLocalExpense(String(nextVal));
                    await handleUpdateDayMeta({ expense: nextVal });
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 active:scale-95 text-slate-600 rounded-lg border border-slate-100 font-bold transition-all text-xs cursor-pointer select-none"
                  title="Augmenter de 1€"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-400 font-mono">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Circular Gauge & Fast Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Gauge Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                strokeWidth="8"
                stroke="#f1f5f9"
                fill="transparent"
              />
              {/* Foreground circle */}
              <circle
                cx="56"
                cy="56"
                r="46"
                strokeWidth="8"
                stroke={isTargetAchieved ? "#10b981" : "#f59e0b"}
                fill="transparent"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - currentKpi / 100)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute text-center flex flex-col">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {currentKpi}%
              </span>
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                KPI atteint
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            {isTargetAchieved ? (
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">
                <CheckCircle2 size={10} /> Objectif Atteint
              </span>
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full font-extrabold flex items-center gap-1 animate-pulse">
                <AlertCircle size={10} /> Sous la cible
              </span>
            )}
          </div>
        </div>

        {/* Quick analytics counters */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Tâches Complétées</span>
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {finishedTasks} <span className="text-sm text-slate-300 font-medium font-sans">sur {totalTasks}</span>
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${totalTasks > 0 ? (finishedTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Temps Estimé global</span>
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-1">
              {totalTime} <span className="text-xs text-slate-400 font-bold uppercase font-mono">min</span>
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-2">Somme cumulée des tâches et sous-tâches</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Finances & Coût journalier</span>
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight text-rose-500">
              {dayData.expense.toFixed(2)}<span className="text-sm font-semibold ml-0.5">€</span>
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-2">Dépenses enregistrées pour cette journée</p>
          </div>
        </div>
      </div>

      {/* Main Task list & Add Form block */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">📋 Tâches Journalières Pondérées</h2>
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
              Le calcul du KPI s'établit lors du changement de statut d'un élément
            </p>
          </div>

          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {showAddTask ? <X size={12} /> : <Plus size={12} />}
            <span>{showAddTask ? 'Fermer' : 'Ajouter une tâche'}</span>
          </button>
        </div>

        {/* Task Adding Panel (collapsible/animated-like) */}
        {showAddTask && (
          <form onSubmit={handleAddTask} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Intitulé de la tâche principale</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="ex: Révision semestrielle de la chaîne logistique"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Catégorie</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-mono font-bold"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Poids KPI</label>
                  <select
                    value={taskWeight}
                    onChange={(e) => setTaskWeight(e.target.value as TaskWeight)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-mono font-bold"
                  >
                    {Object.entries(TASK_WEIGHTS).map(([key, item]) => (
                      <option key={key} value={key}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Commentaires / Instructions (optionnel)</label>
                <input 
                  type="text" 
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Notes importantes, jalons ou liens..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Temps estimé (minutes)</label>
                <input 
                  type="number" 
                  value={taskEstimatedTime}
                  onChange={(e) => setTaskEstimatedTime(Math.max(1, Number(e.target.value) || 0))}
                  min={1}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {saving ? 'Sauvegarde...' : 'Ajuster & Créer la tâche'}
              </button>
            </div>
          </form>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {dayData.tasks.map((task) => {
            const category = DEFAULT_CATEGORIES.find(c => c.id === task.categoryId) || DEFAULT_CATEGORIES[0];
            const hasSub = task.subTasks && task.subTasks.length > 0;

            // Calculate Task Local Scoring Weight or finished percent
            let taskActualScore = 0;
            let taskMaxScore = 0;
            if (!hasSub) {
              taskMaxScore = TASK_WEIGHTS[task.weight]?.value || 10;
              taskActualScore = taskMaxScore * (TASK_STATUSES[task.status]?.coef ?? 0);
            } else {
              task.subTasks.forEach(sub => {
                const subW = TASK_WEIGHTS[sub.weight]?.value || 10;
                taskMaxScore += subW;
                taskActualScore += subW * (TASK_STATUSES[sub.status]?.coef ?? 0);
              });
            }
            
            const taskProgressPct = taskMaxScore > 0 ? Math.round((taskActualScore / taskMaxScore) * 100) : 0;

            return (
              <div 
                key={task.id} 
                className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-md hover:border-slate-200/80 transition-all duration-300 relative group"
              >
                {/* Horizontal Category Pill color accent on side */}
                <span className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${category.color}`}></span>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${category.borderColor} ${category.textColor}`}>
                        {category.name}
                      </span>
                      
                      <span className="font-mono text-[8px] bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase font-bold">
                        Poids : {TASK_WEIGHTS[task.weight]?.label}
                      </span>

                      {(task.estimatedTime || hasSub) && (
                        <span className="font-mono text-[8px] bg-slate-50 border border-slate-100 text-slate-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <Clock size={10} /> {task.estimatedTime || task.subTasks.reduce((acc, s) => acc + (s.estimatedTime || 0), 0)} min
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm md:text-base text-slate-900 font-sans tracking-tight leading-snug">
                      {task.title}
                    </h3>
                    
                    {task.notes && (
                      <p className="text-xs text-slate-500 font-sans leading-relaxed italic border-l border-slate-200 pl-3">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Task Statut Panel Controls */}
                  <div className="flex flex-col items-end gap-3 self-start md:self-center">
                    {!hasSub ? (
                      /* Single Task Inline Statut Picker */
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {(Object.keys(TASK_STATUSES) as TaskStatus[]).map((statusKey) => {
                          const statusItem = TASK_STATUSES[statusKey];
                          const isActive = task.status === statusKey;
                          return (
                            <button
                              key={statusKey}
                              onClick={() => handleUpdateTaskStatus(task.id, statusKey)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase font-black transition-all cursor-pointer border ${
                                isActive 
                                  ? `${statusItem.color} shadow-sm border-slate-200` 
                                  : 'border-transparent text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {statusItem.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* If has nested subtasks, represent progress bar instead */
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          PROGRESSION DES SOUS-TÂCHES
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-700">
                            {taskProgressPct}%
                          </span>
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
                            <div 
                              className={`h-full transition-all duration-300 ${taskProgressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${taskProgressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick helper controls like deletion */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold uppercase"
                      title="Supprimer la tâche globale"
                    >
                      <Trash2 size={13} /> Retirer
                    </button>
                  </div>
                </div>

                {/* NESTED SUBTASKS EXPANDER / BUILDER */}
                <div className="mt-5 pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      ⛓️ Sous-tâches imbriquées ({task.subTasks.length})
                    </span>

                    {addingSubtaskId !== task.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSubtaskId(task.id);
                          setSubtaskTitle('');
                        }}
                        className="px-2.5 py-1 hover:bg-emerald-50 text-emerald-600 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border border-dashed border-emerald-200"
                      >
                        <Plus size={11} /> Associer une sous-tâche
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingSubtaskId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Annuler
                      </button>
                    )}
                  </div>

                  {/* Add Subtask Form Panel */}
                  {addingSubtaskId === task.id && (
                    <div className="bg-slate-50/50 p-4 border border-dashed border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                      <input 
                        type="text"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        placeholder="Intitulé de la sous-tâche..."
                        className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                        required
                      />
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">Poids:</span>
                          <select
                            value={subtaskWeight}
                            onChange={(e) => setSubtaskWeight(e.target.value as TaskWeight)}
                            className="p-1.5 border border-slate-200 bg-white rounded-xl text-[10px] font-mono font-bold"
                          >
                            {Object.entries(TASK_WEIGHTS).map(([key, item]) => (
                              <option key={key} value={key}>{item.label}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSubTask(task.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-[9px] font-black uppercase"
                        >
                          Lier
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtasks listing */}
                  {task.subTasks.length > 0 && (
                    <div className="space-y-2 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
                      {task.subTasks.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100/50 last:border-0 group/sub"
                        >
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-emerald-500 font-bold text-xs select-none shrink-0">•</span>
                            <div>
                              <span className="text-xs text-slate-800 font-medium font-sans leading-relaxed">
                                {sub.title}
                              </span>
                              <span className="font-mono text-[8px] bg-white border border-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-bold ml-2">
                                Poids: {TASK_WEIGHTS[sub.weight]?.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Subtask Status picker */}
                            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-100 shadow-sm">
                              {(Object.keys(TASK_STATUSES) as TaskStatus[]).map((st) => {
                                const stItem = TASK_STATUSES[st];
                                const isSubActive = sub.status === st;
                                return (
                                  <button
                                    key={st}
                                    onClick={() => handleUpdateSubStatus(task.id, sub.id, st)}
                                    className={`px-2 py-1 rounded-md font-mono text-[8px] uppercase font-bold transition-all cursor-pointer border ${
                                      isSubActive 
                                        ? `${stItem.color} border-slate-200` 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    {stItem.label}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubTask(task.id, sub.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer"
                              title="Retirer la sous-tâche"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {dayData.tasks.length === 0 && (
            <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-sans text-xs italic space-y-2">
              <p>Rien d'inscrit à l'ordre du jour.</p>
              <button
                onClick={() => handleAddTask({ preventDefault: () => {} } as any)}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-mono text-[9px] font-bold uppercase transition-all"
              >
                  Recréer des modèles guidés
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
