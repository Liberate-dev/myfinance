import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
  source?: string;
}

interface TransactionState {
  transactions: Transaction[];
  lastSynced: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => void;
  removeTransaction: (id: number) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      lastSynced: null,

      setTransactions: (transactions) => {
        set({
          transactions,
          lastSynced: new Date().toISOString()
        });
      },

      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
          lastSynced: new Date().toISOString()
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          lastSynced: new Date().toISOString()
        }));
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          lastSynced: new Date().toISOString()
        }));
      },

      clearTransactions: () => {
        set({ transactions: [], lastSynced: null });
      }
    }),
    {
      name: 'transaction-storage'
    }
  )
);