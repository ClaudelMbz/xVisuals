export interface FinanceAccount {
  id: string;
  name: string;
  balance: number;
  color?: string;
}

export interface BudgetFlow {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface MonthlySnapshot {
  id: string; // format "YYYY-MM"
  monthStr: string; // format "YYYY-MM"
  balance: number;
}
