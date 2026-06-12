import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Expense, ExpenseCategory, DailySnapshot } from '../types';
import { getWeekRange, getMonthRange } from '../lib/format';

interface ExpensesState {
  expenses: Expense[];
  todayExpenses: Expense[];
  weekExpenses: Expense[];
  monthExpenses: Expense[];
  dailySnapshot: DailySnapshot | null;
  loading: boolean;
  error: string | null;
  fetchExpenses: (userId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  fetchDailySnapshot: (userId: string) => Promise<void>;
  getTotalByCategory: (category: ExpenseCategory) => number;
  getWeeklyTotal: () => number;
  getMonthlyTotal: () => number;
  getSafeToSpend: (monthlyIncome: number, monthlyFixed: number) => number;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  todayExpenses: [],
  weekExpenses: [],
  monthExpenses: [],
  dailySnapshot: null,
  loading: false,
  error: null,

  fetchExpenses: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { start: weekStart } = getWeekRange();
      const { start: monthStart } = getMonthRange();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('date', monthStart.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;

      const allExpenses = data as Expense[];
      set({
        expenses: allExpenses,
        monthExpenses: allExpenses,
        weekExpenses: allExpenses.filter((e) => new Date(e.date) >= weekStart),
        todayExpenses: allExpenses.filter((e) => new Date(e.date) >= today),
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки расходов' });
    } finally {
      set({ loading: false });
    }
  },

  addExpense: async (expense) => {
    const { data, error } = await supabase.from('expenses').insert(expense).select().single();
    if (error) throw error;
    set((state) => ({
      expenses: [data as Expense, ...state.expenses],
    }));
  },

  deleteExpense: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  fetchDailySnapshot: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    if (data) set({ dailySnapshot: data as DailySnapshot });
  },

  getTotalByCategory: (category) => {
    return get().monthExpenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getWeeklyTotal: () => {
    return get().weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  },

  getMonthlyTotal: () => {
    return get().monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  },

  getSafeToSpend: (monthlyIncome, monthlyFixed) => {
    const remaining = monthlyIncome - monthlyFixed - get().getMonthlyTotal();
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysLeft = daysInMonth - dayOfMonth + 1;
    return Math.max(0, (remaining / daysLeft) - get().todayExpenses.reduce((s, e) => s + e.amount, 0));
  },
}));
