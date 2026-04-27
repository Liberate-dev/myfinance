import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import incomeRoutes from './routes/income.js';
import expenseRoutes from './routes/expense.js';
import categoryRoutes from './routes/category.js';
import summaryRoutes from './routes/summary.js';
import suggestionRoutes from './routes/suggestion.js';
import fundRoutes from './routes/fund.js';
import budgetRoutes from './routes/budget.js';
import reportRoutes from './routes/report.js';
import exportRoutes from './routes/export.js';
import transferRoutes from './routes/transfer.js';
import recurringRoutes from './routes/recurring.js';
import alertRoutes from './routes/alert.js';
import balanceHistoryRoutes from './routes/balanceHistory.js';
import { initializeUserTable } from './models/User.js';
import { initializeIncomeTable } from './models/Income.js';
import { initializeExpenseTable } from './models/Expense.js';
import { initializeCategoryTable } from './models/Category.js';
import { initializeFundTable } from './models/Fund.js';
import { initializeBudgetTable } from './models/Budget.js';
import { initializeTransferTable } from './models/Transfer.js';
import { initializeRecurringTransactionTable } from './models/RecurringTransaction.js';
import { initializeBalanceHistoryTable } from './models/BalanceHistory.js';
import { initializeAlertTable } from './models/Alert.js';

// Initialize database and tables
async function initApp() {
  initializeUserTable();
  initializeIncomeTable();
  initializeExpenseTable();
  initializeCategoryTable();
  initializeFundTable();
  initializeBudgetTable();
  initializeTransferTable();
  initializeRecurringTransactionTable();
  initializeBalanceHistoryTable();
  initializeAlertTable();

  // Create Express app
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/incomes', incomeRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/summary', summaryRoutes);
  app.use('/api/suggestions', suggestionRoutes);
  app.use('/api/funds', fundRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/transfers', transferRoutes);
  app.use('/api/recurring', recurringRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/balance-history', balanceHistoryRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`Income endpoints: http://localhost:${PORT}/api/incomes`);
    console.log(`Expense endpoints: http://localhost:${PORT}/api/expenses`);
    console.log(`Category endpoints: http://localhost:${PORT}/api/categories`);
    console.log(`Summary endpoints: http://localhost:${PORT}/api/summary`);
    console.log(`Suggestion endpoints: http://localhost:${PORT}/api/suggestions`);
    console.log(`Fund endpoints: http://localhost:${PORT}/api/funds`);
    console.log(`Budget endpoints: http://localhost:${PORT}/api/budgets`);
    console.log(`Report endpoints: http://localhost:${PORT}/api/reports`);
    console.log(`Transfer endpoints: http://localhost:${PORT}/api/transfers`);
    console.log(`Recurring endpoints: http://localhost:${PORT}/api/recurring`);
    console.log(`Alert endpoints: http://localhost:${PORT}/api/alerts`);
    console.log(`Balance history endpoints: http://localhost:${PORT}/api/balance-history`);
  });
}

initApp().catch(console.error);
