// ─── User & Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: 'active' | 'expired' | 'trial';
  trial_ends_at?: string;
  created_at: string;
}

export type SubscriptionPlan = 'free' | 'plus' | 'family' | 'premium';

// ─── Financial Profile ───────────────────────────────────────────────────────
export interface FinancialProfile {
  id: string;
  user_id: string;
  monthly_income: number;
  currency: string;
  income_sources: IncomeSource[];
  monthly_fixed_expenses: number;
  total_debt: number;
  has_emergency_fund: boolean;
  emergency_fund_months: number;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  financial_goals: string[];
  onboarding_completed: boolean;
}

export interface IncomeSource {
  name: string;
  amount: number;
  type: 'salary' | 'freelance' | 'business' | 'passive' | 'other';
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  user_id: string;
  family_id?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subcategory?: string;
  merchant_name?: string;
  description?: string;
  date: string;
  source: 'manual' | 'receipt' | 'statement' | 'telegram';
  receipt_id?: string;
  statement_id?: string;
  is_recurring: boolean;
  tags: string[];
  created_at: string;
}

export type ExpenseCategory =
  | 'food_delivery'
  | 'groceries'
  | 'transport'
  | 'taxi'
  | 'entertainment'
  | 'subscriptions'
  | 'cafe_restaurants'
  | 'health'
  | 'education'
  | 'shopping'
  | 'utilities'
  | 'housing'
  | 'debt_payment'
  | 'savings'
  | 'family'
  | 'other';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food_delivery: 'Доставка еды',
  groceries: 'Продукты',
  transport: 'Транспорт',
  taxi: 'Такси',
  entertainment: 'Развлечения',
  subscriptions: 'Подписки',
  cafe_restaurants: 'Кафе / рестораны',
  health: 'Здоровье',
  education: 'Образование',
  shopping: 'Покупки',
  utilities: 'ЖКХ / услуги',
  housing: 'Жильё',
  debt_payment: 'Платёж по кредиту',
  savings: 'Накопления',
  family: 'Семья',
  other: 'Прочее',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food_delivery: '#EF4444',
  groceries: '#22C55E',
  transport: '#4F8CFF',
  taxi: '#4F8CFF',
  entertainment: '#A855F7',
  subscriptions: '#F59E0B',
  cafe_restaurants: '#F97316',
  health: '#EC4899',
  education: '#06B6D4',
  shopping: '#8B5CF6',
  utilities: '#64748B',
  housing: '#334155',
  debt_payment: '#EF4444',
  savings: '#22C55E',
  family: '#10B981',
  other: '#94A3B8',
};

// ─── Receipt ─────────────────────────────────────────────────────────────────
export interface Receipt {
  id: string;
  user_id: string;
  storage_path: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  merchant_name?: string;
  date?: string;
  total_amount?: number;
  items: ReceiptItem[];
  raw_ocr_text?: string;
  ai_category?: ExpenseCategory;
  confirmed: boolean;
  expense_id?: string;
  created_at: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// ─── Statement ───────────────────────────────────────────────────────────────
export interface Statement {
  id: string;
  user_id: string;
  bank: KazakhstanBank;
  storage_path: string;
  file_type: 'pdf' | 'csv' | 'xlsx' | 'image';
  parse_status: 'pending' | 'processing' | 'completed' | 'failed';
  period_start?: string;
  period_end?: string;
  total_transactions?: number;
  confirmed_transactions?: number;
  created_at: string;
}

export type KazakhstanBank = 'kaspi' | 'halyk' | 'forte' | 'jusan' | 'freedom' | 'other';

export const BANK_LABELS: Record<KazakhstanBank, string> = {
  kaspi: 'Kaspi Bank',
  halyk: 'Halyk Bank',
  forte: 'Forte Bank',
  jusan: 'Jusan Bank',
  freedom: 'Freedom Bank',
  other: 'Другой банк',
};

// ─── Goals ───────────────────────────────────────────────────────────────────
export interface Goal {
  id: string;
  user_id: string;
  family_id?: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: GoalCategory;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  monthly_contribution?: number;
  created_at: string;
}

export type GoalCategory =
  | 'emergency_fund'
  | 'vacation'
  | 'real_estate'
  | 'education'
  | 'car'
  | 'business'
  | 'retirement'
  | 'other';

// ─── Budgets ─────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  user_id: string;
  family_id?: string;
  category: ExpenseCategory;
  limit_amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  spent_amount: number;
  alert_at_percent: number;
  active: boolean;
  created_at: string;
}

// ─── Financial Leaks ─────────────────────────────────────────────────────────
export interface FinancialLeak {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  period_start: string;
  period_end: string;
  total_amount: number;
  transaction_count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimated_savings: number;
  recommendation: string;
  reason: string;
  status: 'detected' | 'acknowledged' | 'resolved';
  created_at: string;
}

// ─── AI Reports ──────────────────────────────────────────────────────────────
export interface DailySnapshot {
  id: string;
  user_id: string;
  date: string;
  income_today: number;
  spent_today: number;
  safe_to_spend: number;
  risk_level: 'safe' | 'warning' | 'critical';
  top_expense_category?: ExpenseCategory;
  ai_tip: string;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_income: number;
  total_expenses: number;
  savings_amount: number;
  savings_rate: number;
  top_categories: CategorySpend[];
  top_merchants: MerchantSpend[];
  main_leak?: FinancialLeak;
  limits_exceeded: Budget[];
  vs_previous_week: number;
  reduction_plan: string[];
  ai_summary: string;
  pdf_url?: string;
  created_at: string;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  month: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  debt_load: number;
  emergency_fund_progress: number;
  category_breakdown: CategorySpend[];
  recurring_payments: Expense[];
  subscriptions: Expense[];
  impulse_spending: number;
  biggest_leaks: FinancialLeak[];
  ai_action_plan: string[];
  pdf_url?: string;
  created_at: string;
}

export interface CategorySpend {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  transaction_count: number;
  vs_previous: number;
}

export interface MerchantSpend {
  merchant_name: string;
  amount: number;
  transaction_count: number;
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── AI Advisor ──────────────────────────────────────────────────────────────
export interface AIAdvice {
  id: string;
  user_id: string;
  main_conclusion: string;
  top_leaks: { category: ExpenseCategory; amount: number }[];
  what_to_cut_this_week: string;
  safe_to_save: number;
  debt_advice: string;
  can_invest: boolean;
  investment_advice?: string;
  forbidden_actions: string[];
  disclaimer: string;
  generated_at: string;
}

// ─── Family ──────────────────────────────────────────────────────────────────
export interface Family {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'member';
  monthly_limit?: number;
  can_see_all: boolean;
  joined_at: string;
}

// ─── Subscription ────────────────────────────────────────────────────────────
export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  revenuecat_id?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export const PLAN_LIMITS = {
  free: { expenses_per_month: 20, ocr: false, import: false, ai: false, family_members: 1 },
  plus: { expenses_per_month: Infinity, ocr: true, import: true, ai: true, family_members: 1 },
  family: { expenses_per_month: Infinity, ocr: true, import: true, ai: true, family_members: 5 },
  premium: { expenses_per_month: Infinity, ocr: true, import: true, ai: true, family_members: 5 },
} as const;

export const PLAN_PRICES: Record<Exclude<SubscriptionPlan, 'free'>, { monthly: number; label: string }> = {
  plus: { monthly: 2990, label: 'Plus' },
  family: { monthly: 5990, label: 'Family' },
  premium: { monthly: 14990, label: 'Premium' },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  sent_at: string;
}

export type NotificationType =
  | 'daily_limit_exceeded'
  | 'weekly_limit_exceeded'
  | 'large_leak_detected'
  | 'weekly_report_ready'
  | 'upload_statement_reminder'
  | 'goal_at_risk'
  | 'goal_achieved';

// ─── Navigation ──────────────────────────────────────────────────────────────
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'onboarding': undefined;
  'receipt-scanner': undefined;
  'statement-import': undefined;
  'statement-preview': { statementId: string };
  'add-expense': { receiptId?: string };
  'report-weekly': { reportId: string };
  'report-monthly': { reportId: string };
  'leak-detail': { leakId: string };
  'goal-detail': { goalId: string };
  'pricing': undefined;
  'family-invite': undefined;
};
