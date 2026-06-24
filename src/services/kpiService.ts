import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { Task, DayData, TASK_WEIGHTS, TASK_STATUSES, Category } from '../types/kpi';

// Define Categories Palette of 10 modern colors
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-pro', name: 'Professionnel 💼', color: 'bg-blue-500', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { id: 'cat-perso', name: 'Personnel 🏠', color: 'bg-emerald-500', borderColor: 'border-emerald-200', textColor: 'text-emerald-700' },
  { id: 'cat-sante', name: 'Santé & Sport 🍏', color: 'bg-teal-500', borderColor: 'border-teal-200', textColor: 'text-teal-700' },
  { id: 'cat-etudes', name: 'Études & Veille 📚', color: 'bg-indigo-500', borderColor: 'border-indigo-200', textColor: 'text-indigo-700' },
  { id: 'cat-finance', name: 'Finance 💳', color: 'bg-amber-500', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
  { id: 'cat-loisirs', name: 'Loisirs 🎨', color: 'bg-rose-500', borderColor: 'border-rose-200', textColor: 'text-rose-700' },
  { id: 'cat-admin', name: 'Administratif 📄', color: 'bg-slate-500', borderColor: 'border-slate-200', textColor: 'text-slate-700' },
  { id: 'cat-social', name: 'Social & Famille 👥', color: 'bg-fuchsia-500', borderColor: 'border-fuchsia-200', textColor: 'text-fuchsia-700' },
  { id: 'cat-projets', name: 'Projet Side 🚀', color: 'bg-violet-500', borderColor: 'border-violet-200', textColor: 'text-violet-700' },
  { id: 'cat-divers', name: 'Divers 📌', color: 'bg-cyan-500', borderColor: 'border-cyan-200', textColor: 'text-cyan-700' }
];

/**
 * Calculates current actual score and maximum score for days to generate the actual KPI.
 */
export function calculateKpiScore(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) return 0;

  let totalMaxWeight = 0;
  let totalActualScore = 0;

  tasks.forEach((task) => {
    if (!task.subTasks || task.subTasks.length === 0) {
      // Scale based on pure task weight
      const weightVal = TASK_WEIGHTS[task.weight]?.value || 10;
      const coef = TASK_STATUSES[task.status]?.coef ?? 0;
      totalMaxWeight += weightVal;
      totalActualScore += weightVal * coef;
    } else {
      // Subtasks determine the weight
      task.subTasks.forEach((sub) => {
        const subWeightVal = TASK_WEIGHTS[sub.weight]?.value || 10;
        const subCoef = TASK_STATUSES[sub.status]?.coef ?? 0;
        totalMaxWeight += subWeightVal;
        totalActualScore += subWeightVal * subCoef;
      });
    }
  });

  if (totalMaxWeight === 0) return 0;
  return Math.round((totalActualScore / totalMaxWeight) * 100);
}

// Firestore error handler conforming to standard skill specs
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous_or_context_fallback'
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Core DB operations
export const kpiService = {
  /**
   * Save a single day data (either to Firestore or LocalStorage as fallback)
   */
  async saveDayData(userId: string | undefined, dayData: DayData): Promise<void> {
    // 1. Calculate actual KPI
    const updatedDay = {
      ...dayData,
      actualKpi: calculateKpiScore(dayData.tasks)
    };

    // 2. LocalStorage caching
    const localKey = userId ? `kpi_${userId}_${dayData.dateStr}` : `kpi_guest_${dayData.dateStr}`;
    localStorage.setItem(localKey, JSON.stringify(updatedDay));

    // Also store key indexes list of days in localStorage to fetch easily without querying
    const indexKey = userId ? `kpi_index_${userId}` : `kpi_index_guest`;
    const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[];
    if (!existingIndex.includes(dayData.dateStr)) {
      existingIndex.push(dayData.dateStr);
      localStorage.setItem(indexKey, JSON.stringify(existingIndex));
    }

    // 3. Firestore Sync if logged in
    if (userId) {
      const docPath = `kpi_days/${userId}_${dayData.dateStr}`;
      try {
        const cleanPayload = JSON.parse(JSON.stringify({
          id: `${userId}_${dayData.dateStr}`,
          userId,
          dateStr: dayData.dateStr,
          targetKpi: updatedDay.targetKpi,
          actualKpi: updatedDay.actualKpi,
          expense: updatedDay.expense,
          tasks: updatedDay.tasks
        }));

        await setDoc(doc(db, 'kpi_days', `${userId}_${dayData.dateStr}`), {
          ...cleanPayload,
          createdAt: new Date()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }
  },

  /**
   * Fetch a single day data
   */
  async getDayData(userId: string | undefined, dateStr: string): Promise<DayData> {
    // Try from local storage cache first
    const localKey = userId ? `kpi_${userId}_${dateStr}` : `kpi_guest_${dateStr}`;
    const cached = localStorage.getItem(localKey);
    let dayDataFallback: DayData = {
      id: dateStr,
      dateStr,
      targetKpi: 80, // Default target is 80%
      actualKpi: 0,
      expense: 0,
      tasks: []
    };

    if (cached) {
      try {
        dayDataFallback = JSON.parse(cached);
      } catch (e) {
        console.warn('Stale cache for dayData', e);
      }
    }

    if (userId) {
      const docPath = `kpi_days/${userId}_${dateStr}`;
      try {
        const snap = await getDoc(doc(db, 'kpi_days', `${userId}_${dateStr}`));
        if (snap.exists()) {
          const data = snap.data();
          const dayLoaded: DayData = {
            id: dateStr,
            userId,
            dateStr,
            targetKpi: data.targetKpi ?? 80,
            actualKpi: data.actualKpi ?? 0,
            expense: data.expense ?? 0,
            tasks: data.tasks ?? []
          };
          // Sync localStorage
          localStorage.setItem(localKey, JSON.stringify(dayLoaded));
          return dayLoaded;
        }
      } catch (err) {
        // Fallback to cache silently while registering logging
        console.error('Firestore get failed, serving local fallback', err);
      }
    }

    return dayDataFallback;
  },

  /**
   * Fetch all historical days for the user (to feed Dashboard)
   */
  async getAllHistory(userId: string | undefined): Promise<DayData[]> {
    const list: DayData[] = [];

    // Guest or Offline fallback logic using index
    const indexKey = userId ? `kpi_index_${userId}` : `kpi_index_guest`;
    const localIndex = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[];
    
    // Attempt Firestore load
    if (userId) {
      const colPath = 'kpi_days';
      try {
        const q = query(
          collection(db, colPath),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.dateStr,
            userId,
            dateStr: data.dateStr,
            targetKpi: data.targetKpi ?? 80,
            actualKpi: data.actualKpi ?? 0,
            expense: data.expense ?? 0,
            tasks: data.tasks ?? []
          });
        });

        // Save loaded Firestore records in LocalStorage as local backup
        list.forEach(day => {
          const localKey = `kpi_${userId}_${day.dateStr}`;
          localStorage.setItem(localKey, JSON.stringify(day));
        });
        const indexList = list.map(d => d.dateStr);
        localStorage.setItem(indexKey, JSON.stringify(indexList));

        // Sort descending by date
        return list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
      } catch (err) {
        console.error('Firestore list query failed, using local caching list', err);
      }
    }

    // fallback load from LocalStorage
    localIndex.forEach((dateStr) => {
      const localKey = userId ? `kpi_${userId}_${dateStr}` : `kpi_guest_${dateStr}`;
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          list.push(JSON.parse(cached));
        } catch (e) {
          console.warn('Parsing error in indexing fallback', e);
        }
      }
    });

    // Sort descending by date
    return list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  },

  /**
   * Seed dynamic starter tasks when a user opens a brand-new day (disabled per user request)
   */
  getStarterTasksForNewDay(): Task[] {
    return [];
  }
};
