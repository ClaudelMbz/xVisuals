import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { FinanceAccount, BudgetFlow, MonthlySnapshot } from '../types/finance';

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
  console.error('Firestore Finance Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const financeService = {
  // === ACCOUNTS OPERATION ===
  async getAccounts(userId: string | undefined): Promise<FinanceAccount[]> {
    const localKey = userId ? `finance_accounts_${userId}` : 'finance_accounts_guest';
    const cached = localStorage.getItem(localKey);
    let fallbackList: FinanceAccount[] = cached ? JSON.parse(cached) : [];

    if (userId) {
      try {
        const q = query(collection(db, 'finance_accounts'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const list: FinanceAccount[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            balance: Number(data.balance) || 0,
            color: data.color || ''
          });
        });
        localStorage.setItem(localKey, JSON.stringify(list));
        return list.length > 0 ? list : fallbackList;
      } catch (err) {
        console.error('Failed to get accounts from Firestore, using fallback', err);
      }
    }
    return fallbackList;
  },

  async saveAccount(userId: string | undefined, account: FinanceAccount): Promise<void> {
    const localKey = userId ? `finance_accounts_${userId}` : 'finance_accounts_guest';
    const current = await this.getAccounts(userId);
    const index = current.findIndex(a => a.id === account.id);
    if (index >= 0) {
      current[index] = account;
    } else {
      current.push(account);
    }
    localStorage.setItem(localKey, JSON.stringify(current));

    if (userId) {
      const docPath = `finance_accounts/${account.id}`;
      try {
        await setDoc(doc(db, 'finance_accounts', account.id), {
          id: account.id,
          userId,
          name: account.name,
          balance: account.balance,
          color: account.color || '',
          updatedAt: new Date()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }
  },

  async deleteAccount(userId: string | undefined, accountId: string): Promise<void> {
    const localKey = userId ? `finance_accounts_${userId}` : 'finance_accounts_guest';
    const current = await this.getAccounts(userId);
    const updated = current.filter(a => a.id !== accountId);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (userId) {
      const docPath = `finance_accounts/${accountId}`;
      try {
        await deleteDoc(doc(db, 'finance_accounts', accountId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
  },

  // === BUDGET FLOW OPERATIONS ===
  async getBudgetFlows(userId: string | undefined): Promise<BudgetFlow[]> {
    const localKey = userId ? `finance_budget_${userId}` : 'finance_budget_guest';
    const cached = localStorage.getItem(localKey);
    let fallbackList: BudgetFlow[] = cached ? JSON.parse(cached) : [];

    if (userId) {
      try {
        const q = query(collection(db, 'finance_budget'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const list: BudgetFlow[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            amount: Number(data.amount) || 0,
            type: data.type as 'income' | 'expense'
          });
        });
        localStorage.setItem(localKey, JSON.stringify(list));
        return list.length > 0 ? list : fallbackList;
      } catch (err) {
        console.error('Failed to get budget flows from Firestore, using fallback', err);
      }
    }
    return fallbackList;
  },

  async saveBudgetFlow(userId: string | undefined, flow: BudgetFlow): Promise<void> {
    const localKey = userId ? `finance_budget_${userId}` : 'finance_budget_guest';
    const current = await this.getBudgetFlows(userId);
    const index = current.findIndex(f => f.id === flow.id);
    if (index >= 0) {
      current[index] = flow;
    } else {
      current.push(flow);
    }
    localStorage.setItem(localKey, JSON.stringify(current));

    if (userId) {
      const docPath = `finance_budget/${flow.id}`;
      try {
        await setDoc(doc(db, 'finance_budget', flow.id), {
          id: flow.id,
          userId,
          name: flow.name,
          amount: flow.amount,
          type: flow.type,
          updatedAt: new Date()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }
  },

  async deleteBudgetFlow(userId: string | undefined, flowId: string): Promise<void> {
    const localKey = userId ? `finance_budget_${userId}` : 'finance_budget_guest';
    const current = await this.getBudgetFlows(userId);
    const updated = current.filter(f => f.id !== flowId);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (userId) {
      const docPath = `finance_budget/${flowId}`;
      try {
        await deleteDoc(doc(db, 'finance_budget', flowId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
  },

  // === MONTHLY SNAPSHOTS OPERATIONS ===
  async getMonthlySnapshots(userId: string | undefined): Promise<MonthlySnapshot[]> {
    const localKey = userId ? `finance_snapshots_${userId}` : 'finance_snapshots_guest';
    const cached = localStorage.getItem(localKey);
    let fallbackList: MonthlySnapshot[] = cached ? JSON.parse(cached) : [];

    if (userId) {
      try {
        const q = query(collection(db, 'finance_snapshots'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const list: MonthlySnapshot[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            monthStr: data.monthStr || '',
            balance: Number(data.balance) || 0
          });
        });
        localStorage.setItem(localKey, JSON.stringify(list));
        return list.length > 0 ? list : fallbackList;
      } catch (err) {
        console.error('Failed to get snapshots from Firestore, using fallback', err);
      }
    }
    return fallbackList;
  },

  async saveMonthlySnapshot(userId: string | undefined, snapshot: MonthlySnapshot): Promise<void> {
    const localKey = userId ? `finance_snapshots_${userId}` : 'finance_snapshots_guest';
    const current = await this.getMonthlySnapshots(userId);
    const index = current.findIndex(s => s.monthStr === snapshot.monthStr);
    if (index >= 0) {
      current[index] = snapshot;
    } else {
      current.push(snapshot);
    }
    localStorage.setItem(localKey, JSON.stringify(current));

    if (userId) {
      const docId = `${userId}_${snapshot.monthStr}`;
      const docPath = `finance_snapshots/${docId}`;
      try {
        await setDoc(doc(db, 'finance_snapshots', docId), {
          id: docId,
          userId,
          monthStr: snapshot.monthStr,
          balance: snapshot.balance,
          updatedAt: new Date()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }
  },

  async deleteMonthlySnapshot(userId: string | undefined, snapshotId: string): Promise<void> {
    const localKey = userId ? `finance_snapshots_${userId}` : 'finance_snapshots_guest';
    const current = await this.getMonthlySnapshots(userId);
    const updated = current.filter(s => s.id !== snapshotId && s.monthStr !== snapshotId);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (userId) {
      // Find the document ID. It's usually userId_monthStr
      const docId = snapshotId.includes('_') ? snapshotId : `${userId}_${snapshotId}`;
      const docPath = `finance_snapshots/${docId}`;
      try {
        await deleteDoc(doc(db, 'finance_snapshots', docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
  }
};
