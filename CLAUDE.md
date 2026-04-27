# Finance Advisor - Project Context

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS v3
- **Backend:** Node.js + Express (pending)
- **Database:** SQLite (MVP) / PostgreSQL (production)
- **Auth:** JWT (pending)
- **Charts:** Recharts (pending)
- **PWA:** vite-plugin-pwa

## Project Structure
```
finance-advisor/
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utils, API client
│   ├── stores/          # State management
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   └── middleware/       # Auth, validation
├── dist/                # Production build
└── public/              # Static assets
```

## Workflow Phases (from WORKFLOW.md)
1. Phase 1: Setup & Auth (Week 1-2) - CURRENT
2. Phase 2: Core Tracking (Week 3-6)
3. Phase 3: Dashboard & Suggestions (Week 7-10)
4. Phase 4: P1 Features (Week 11-14)
5. Phase 5: Polish & Launch (Week 15+)

## Current Status
- [x] Vite + React + TypeScript setup
- [x] Tailwind CSS v3 configured
- [x] PWA plugin configured
- [x] Auth system (JWT, register, login)
- [x] Protected routes
- [x] Recharts installed

## Phase 1 Complete ✅
- Backend: Express + JWT + bcrypt + SQLite
- Frontend: React Router + Zustand + Login/Register pages
- Commands: `npm run dev` (frontend), `npm run server` (backend)

## Phase 2 Complete ✅
- Backend: Income/Expense/Category CRUD API
- Frontend: IncomePage, ExpensePage, TransactionList pages
- Components: TransactionForm, TransactionCard, CategoryBadge

## Phase 3 Complete ✅
- Backend: Summary API (monthly totals, top categories, recent transactions)
- Backend: Suggestion Engine (rule-based financial advice)
- Frontend: Dashboard with summary cards, spending chart, suggestions
- Components: SpendingChart, SuggestionCard
- Routes: /api/summary, /api/suggestions

## Phase 4 Complete ✅
- Backend: Funds (multi-source), Budgets, Reports API
- Backend: Custom categories support
- Frontend: FundsPage, BudgetPage, ReportsPage
- Components: FundCard, BudgetProgress, ReportChart

## Phase 5 Complete ✅
- Backend: CSV export, change password, clear data
- Frontend: PWA install prompt, offline support, offline banner
- Frontend: ExportButton, Settings page, Toast notifications
- UI: LoadingSpinner, EmptyState, responsive polish

## Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run server   # Backend server
```