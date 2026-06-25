import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  Calendar, 
  ArrowUpRight, 
  Sparkles,
  RefreshCw,
  Loader2,
  Info,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { FinanceAccount, BudgetFlow, MonthlySnapshot } from '../types/finance';
import { financeService } from '../services/financeService';

interface FinanceHubProps {
  user: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'];

export default function FinanceHub({ user }: FinanceHubProps) {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [budgetFlows, setBudgetFlows] = useState<BudgetFlow[]>([]);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states - Accounts
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  
  // State for editing accounts
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccBalance, setEditAccBalance] = useState('');
  const [editAccColor, setEditAccColor] = useState('');
  
  // Form states - Budget Flows
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowAmount, setNewFlowAmount] = useState('');
  const [newFlowType, setNewFlowType] = useState<'income' | 'expense'>('expense');

  // Form states - Snapshots
  const [newSnapMonth, setNewSnapMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newSnapBalance, setNewSnapBalance] = useState('');

  // State for modal deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'account' | 'flow' | 'snapshot';
    id: string;
    label: string;
  } | null>(null);

  const loadAllFinanceData = async () => {
    setLoading(true);
    try {
      const [accs, flows, snaps] = await Promise.all([
        financeService.getAccounts(user?.uid),
        financeService.getBudgetFlows(user?.uid),
        financeService.getMonthlySnapshots(user?.uid)
      ]);
      setAccounts(accs);
      setBudgetFlows(flows);
      
      // Sort snapshots chronologically YYYY-MM
      const sortedSnaps = snaps.sort((a, b) => a.monthStr.localeCompare(b.monthStr));
      setSnapshots(sortedSnaps);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinanceData();
  }, [user]);

  // Account handlers
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccBalance.trim()) return;

    const newAcc: FinanceAccount = {
      id: 'acc_' + Date.now(),
      name: newAccName.trim(),
      balance: parseFloat(newAccBalance) || 0
    };

    try {
      await financeService.saveAccount(user?.uid, newAcc);
      setNewAccName('');
      setNewAccBalance('');
      await loadAllFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteAccount = (id: string, name: string) => {
    setDeleteTarget({ type: 'account', id, label: name });
  };

  const startEditAccount = (acc: FinanceAccount, index: number) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccBalance(acc.balance.toString());
    setEditAccColor(acc.color || COLORS[index % COLORS.length]);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editAccName.trim() || !editAccBalance.trim()) return;

    const updatedAcc: FinanceAccount = {
      ...editingAccount,
      name: editAccName.trim(),
      balance: parseFloat(editAccBalance) || 0,
      color: editAccColor
    };

    try {
      await financeService.saveAccount(user?.uid, updatedAcc);
      setEditingAccount(null);
      await loadAllFinanceData();
    } catch (err) {
      console.error('Error updating account:', err);
    }
  };

  // Budget Flow handlers
  const handleAddFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim() || !newFlowAmount.trim()) return;

    const newFlow: BudgetFlow = {
      id: 'flow_' + Date.now(),
      name: newFlowName.trim(),
      amount: parseFloat(newFlowAmount) || 0,
      type: newFlowType
    };

    try {
      await financeService.saveBudgetFlow(user?.uid, newFlow);
      setNewFlowName('');
      setNewFlowAmount('');
      await loadAllFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteFlow = (id: string, name: string) => {
    setDeleteTarget({ type: 'flow', id, label: name });
  };

  // Snapshot handlers
  const handleAddSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapMonth || !newSnapBalance.trim()) return;

    const newSnap: MonthlySnapshot = {
      id: 'snap_' + newSnapMonth,
      monthStr: newSnapMonth,
      balance: parseFloat(newSnapBalance) || 0
    };

    try {
      await financeService.saveMonthlySnapshot(user?.uid, newSnap);
      setNewSnapBalance('');
      await loadAllFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteSnapshot = (monthStr: string) => {
    setDeleteTarget({ type: 'snapshot', id: monthStr, label: monthStr });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'account') {
        await financeService.deleteAccount(user?.uid, deleteTarget.id);
      } else if (deleteTarget.type === 'flow') {
        await financeService.deleteBudgetFlow(user?.uid, deleteTarget.id);
      } else if (deleteTarget.type === 'snapshot') {
        await financeService.deleteMonthlySnapshot(user?.uid, deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadAllFinanceData();
    } catch (err) {
      console.error('Error during deletion:', err);
    }
  };

  // Derived calculations
  const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalMonthlyIncome = budgetFlows
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalMonthlyExpenses = budgetFlows
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);

  const netMonthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  // Chart data formatting
  const accountsPieData = accounts.map((acc, index) => ({
    name: acc.name,
    value: acc.balance > 0 ? acc.balance : 0,
    color: acc.color || COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  const budgetBarData = [
    {
      name: 'Flux Budget',
      'Revenus Mensuels (€)': totalMonthlyIncome,
      'Dépenses Mensuelles (€)': totalMonthlyExpenses,
    }
  ];

  const snapshotHistoryData = snapshots.map(snap => {
    const [year, month] = snap.monthStr.split('-');
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const label = `${monthNames[parseInt(month) - 1]} ${year}`;
    return {
      monthStr: snap.monthStr,
      label,
      'Solde Total (€)': snap.balance
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-sans text-xs gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span>Synchronisation de votre espace financier sécurisé...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in" id="finance-hub-root">
      
      {/* SECTION 1: TOP METRIC BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Total Liquid Assets */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
            <Wallet size={22} />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Patrimoine Liquide Actuel</span>
            <h3 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
              {totalAssets.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">Réparti sur {accounts.length} comptes</p>
          </div>
        </div>

        {/* Metric 2: Monthly Recurring Budget Net Savings */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            netMonthlySavings >= 0 
              ? 'bg-emerald-50 border-emerald-100/50 text-emerald-600' 
              : 'bg-rose-50 border-rose-100/50 text-rose-600'
          }`}>
            <PiggyBank size={22} />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Capacité d'Épargne Mensuelle</span>
            <h3 className={`text-2xl font-black font-mono tracking-tight ${
              netMonthlySavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {netMonthlySavings >= 0 ? '+' : ''}
              {netMonthlySavings.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">
              Revenus: {totalMonthlyIncome}€ | Dépenses: {totalMonthlyExpenses}€
            </p>
          </div>
        </div>

        {/* Metric 3: Evolution Status */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Dynamique Long Terme</span>
            {snapshots.length >= 2 ? (
              (() => {
                const first = snapshots[0].balance;
                const last = snapshots[snapshots.length - 1].balance;
                const diff = last - first;
                const percent = first > 0 ? (diff / first) * 100 : 0;
                const isGrowth = diff >= 0;
                return (
                  <>
                    <h3 className={`text-2xl font-black font-mono tracking-tight ${isGrowth ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isGrowth ? '▲' : '▼'} {Math.abs(percent).toFixed(1)}%
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans">
                      {isGrowth ? 'Progression de' : 'Contraction de'} {Math.abs(diff).toLocaleString('fr-FR')}€ depuis le début
                    </p>
                  </>
                );
              })()
            ) : (
              <>
                <h3 className="text-xl font-bold font-mono text-slate-400 tracking-tight">Données requises</h3>
                <p className="text-[10px] text-slate-500 font-sans">Enregistrez au moins 2 points de situation</p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 2: ACCOUNTS LIST AND PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Account Saisie and List */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight">Comptes &amp; Actifs Actuels 💳</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              Déclarez la totalité de vos soldes bancaires ou portefeuilles de liquidités
            </p>
          </div>

          {/* Accounts Inline Form */}
          <form onSubmit={handleAddAccount} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Nom du Compte</label>
              <input
                type="text"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                placeholder="ex. Compte Courant, Livret A..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                required
              />
            </div>
            <div className="w-full sm:w-1/3 space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Solde (€)</label>
              <input
                type="number"
                step="any"
                value={newAccBalance}
                onChange={e => setNewAccBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15"
            >
              <Plus size={14} /> Ajouter
            </button>
          </form>

          {/* Accounts List Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-black">Nom du compte</th>
                  <th className="px-4 py-3 text-right font-black">Solde</th>
                  <th className="px-4 py-3 text-right font-black w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans text-xs">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 italic">
                      Aucun compte enregistré. Remplissez le formulaire ci-dessus pour initialiser.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc, index) => (
                    <tr key={acc.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color || COLORS[index % COLORS.length] }} />
                        {acc.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        {acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditAccount(acc, index)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                            title="Modifier ce compte"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteAccount(acc.id, acc.name)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Supprimer ce compte"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Pie Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Répartition de votre Trésorerie 📊</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              Visualisation graphique de la répartition de vos avoirs liquides
            </p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {accountsPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accountsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {accountsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} €`, 'Solde']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs italic">
                Enregistrez des comptes de solde positif pour afficher le diagramme.
              </div>
            )}
          </div>

          {accountsPieData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] font-mono font-bold text-slate-500">
              {accountsPieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {Math.round((item.value / totalAssets) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: MONTHLY BUDGET FLOWS & TARGET BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Budget list & Form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight">Revenus &amp; Dépenses Récurrentes 🔄</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              Maîtrisez votre budget en listant vos flux fixes mensuels (Loyer, Salaire, Abonnements...)
            </p>
          </div>

          {/* Budget Flow form */}
          <form onSubmit={handleAddFlow} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Libellé</label>
              <input
                type="text"
                value={newFlowName}
                onChange={e => setNewFlowName(e.target.value)}
                placeholder="ex. Loyer, Stage, Alternance..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                required
              />
            </div>
            <div className="w-full sm:w-1/4 space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Type</label>
              <select
                value={newFlowType}
                onChange={e => setNewFlowType(e.target.value as 'income' | 'expense')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
              >
                <option value="expense">Dépense 🔴</option>
                <option value="income">Revenu 🟢</option>
              </select>
            </div>
            <div className="w-full sm:w-1/4 space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Montant (€)</label>
              <input
                type="number"
                step="any"
                value={newFlowAmount}
                onChange={e => setNewFlowAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15"
            >
              <Plus size={14} /> Ajouter
            </button>
          </form>

          {/* Budget Flows Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-black">Libellé du flux</th>
                  <th className="px-4 py-3 text-center font-black w-24">Type</th>
                  <th className="px-4 py-3 text-right font-black">Montant mensuel</th>
                  <th className="px-4 py-3 text-right font-black w-16">Suppr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans text-xs">
                {budgetFlows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400 italic">
                      Aucun flux mensuel enregistré. Renseignez vos rentrées et sorties fixes.
                    </td>
                  </tr>
                ) : (
                  budgetFlows.map((flow) => (
                    <tr key={flow.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-800">{flow.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider ${
                          flow.type === 'income' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {flow.type === 'income' ? 'Revenu' : 'Dépense'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${
                        flow.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {flow.type === 'income' ? '+' : '-'} {flow.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => requestDeleteFlow(flow.id, flow.name)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Supprimer ce flux"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Bar Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rationnel Revenus vs Dépenses 📊</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              Analyse proportionnelle de votre reste à vivre mensuel
            </p>
          </div>

          <div className="h-56 mt-2 flex items-center justify-center">
            {totalMonthlyIncome > 0 || totalMonthlyExpenses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetBarData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} style={{ fontSize: '10px' }} stroke="#94a3b8" />
                  <YAxis tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                  <Tooltip formatter={(value) => [`${value} €`]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Revenus Mensuels (€)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Dépenses Mensuelles (€)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 font-sans italic">
                Enregistrez vos revenus ou dépenses mensuelles pour projeter le graphe.
              </p>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
              <strong>Pilotage d'Épargne :</strong> Vos charges fixes représentent{' '}
              <span className="font-bold text-slate-800">
                {totalMonthlyIncome > 0 ? Math.round((totalMonthlyExpenses / totalMonthlyIncome) * 100) : 0}%
              </span>{' '}
              de vos rentrées mensuelles. Votre capacité d'épargne nette est estimée à{' '}
              <span className="font-bold text-emerald-600 font-mono">
                {netMonthlySavings.toFixed(2)} €
              </span>{' '}
              par mois.
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: LONG-TERM EVOLUTION AREA CHART */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight">Courbe d'Évolution de votre Patrimoine 📈</h3>
            <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              Historique long terme des points de situation. Constatez si vous stagnez ou progressez
            </p>
          </div>

          {/* Form to log situation */}
          <form onSubmit={handleAddSnapshot} className="flex flex-wrap gap-2.5 items-end">
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Mois de situation</label>
              <input
                type="month"
                value={newSnapMonth}
                onChange={e => setNewSnapMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Solde Total (€)</label>
              <input
                type="number"
                step="any"
                value={newSnapBalance}
                onChange={e => setNewSnapBalance(e.target.value)}
                placeholder="ex. 6500"
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 w-28"
                required
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/15 flex items-center gap-1"
            >
              <Plus size={13} /> Enregistrer
            </button>
          </form>
        </div>

        {/* The Evolution Curve */}
        <div className="h-72 mt-2">
          {snapshots.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshotHistoryData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAssetsEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <YAxis tickLine={false} style={{ fontSize: '10px', fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px' }}
                  formatter={(value) => [`${value} €`, 'Trésorerie Globale']}
                />
                <Area type="monotone" dataKey="Solde Total (€)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAssetsEvolution)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Sparkles size={28} className="text-slate-300 animate-pulse mb-3" />
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Aucun historique de situation mensuel enregistré. Saisissez vos soldes pour les mois précédents et actuels (ex. Mars, Avril, Mai) pour observer l'évolution de votre situation financière !
              </p>
            </div>
          )}
        </div>

        {/* Snapshot deletion log */}
        {snapshots.length > 0 && (
          <div className="pt-4 border-t border-slate-50">
            <h4 className="font-mono text-[9px] text-slate-400 uppercase tracking-widest font-black mb-3">Points de Situation Enregistrés</h4>
            <div className="flex flex-wrap gap-2">
              {snapshots.map(snap => (
                <div key={snap.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-mono font-bold text-slate-700">
                  <span>{snap.monthStr} : <strong className="text-indigo-600">{snap.balance.toLocaleString('fr-FR')} €</strong></span>
                  <button
                    onClick={() => requestDeleteSnapshot(snap.monthStr)}
                    className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Supprimer ce point"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6 text-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 animate-pulse">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-md font-bold text-slate-900 tracking-tight">Supprimer cet élément ?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Êtes-vous sûr de vouloir supprimer <strong className="text-slate-800">"{deleteTarget.label}"</strong> ? Cette action est irréversible et supprimera définitivement cette donnée de votre espace.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/15 transition-all cursor-pointer"
                >
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAccount(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6 text-slate-800"
            >
              <div>
                <h3 className="text-md font-bold text-slate-900 tracking-tight">Modifier le compte 💳</h3>
                <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Ajustez le solde, la couleur ou le nom du compte
                </p>
              </div>

              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Nom du Compte</label>
                  <input
                    type="text"
                    value={editAccName}
                    onChange={e => setEditAccName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Solde (€)</label>
                  <input
                    type="number"
                    step="any"
                    value={editAccBalance}
                    onChange={e => setEditAccBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-950"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Couleur du compte</label>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditAccColor(c)}
                        className={`w-7 h-7 rounded-full transition-all border-2 cursor-pointer ${
                          editAccColor.toLowerCase() === c.toLowerCase() ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    
                    {/* Color picker */}
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:scale-105 transition-all shadow-xs" style={{ backgroundColor: editAccColor }}>
                      <input
                        type="color"
                        value={editAccColor.startsWith('#') && editAccColor.length === 7 ? editAccColor : '#3b82f6'}
                        onChange={(e) => setEditAccColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
                        title="Couleur personnalisée"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/15 transition-all cursor-pointer"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
