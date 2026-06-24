export type TaskWeight = 'très-haute' | 'haute' | 'moyenne' | 'assez-faible' | 'faible';

export const TASK_WEIGHTS: Record<TaskWeight, { label: string; value: number }> = {
  'très-haute': { label: 'Très Haute (40)', value: 40 },
  'haute': { label: 'Haute (30)', value: 30 },
  'moyenne': { label: 'Moyenne (15)', value: 15 },
  'assez-faible': { label: 'Assez Faible (10)', value: 10 },
  'faible': { label: 'Faible (5)', value: 5 }
};

export type TaskStatus = 'fait' | 'neutre' | 'pas-fait';

export const TASK_STATUSES: Record<TaskStatus, { label: string; coef: number; color: string }> = {
  'fait': { label: 'Fait', coef: 1.0, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  'neutre': { label: 'Neutre', coef: 0.25, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  'pas-fait': { label: 'Pas fait', coef: 0.0, color: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100' }
};

export interface SubTask {
  id: string;
  title: string;
  weight: TaskWeight;
  status: TaskStatus;
  estimatedTime?: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  weight: TaskWeight;
  status: TaskStatus;
  estimatedTime?: number; // in minutes
  notes?: string;
  subTasks: SubTask[];
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg color (e.g., 'bg-rose-500', 'bg-blue-500')
  borderColor: string;
  textColor: string;
}

export interface DayData {
  id: string; // YYYY-MM-DD
  userId?: string;
  dateStr: string; // YYYY-MM-DD
  targetKpi: number; // typically 0 to 100
  actualKpi: number; // calculated 0 to 100
  expense: number; // € journalières
  tasks: Task[];
  createdAt?: any;
}

export interface KPIStats {
  date: string; // YYYY-MM-DD
  actualKpi: number;
  targetKpi: number;
  expense: number;
  completionRate: number;
  tasksCount: number;
}
