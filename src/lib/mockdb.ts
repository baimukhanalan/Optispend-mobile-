import { User, FinancialProfile, Expense } from '../types';

// ─── Flag ─────────────────────────────────────────────────────────────────────
// True when no real Supabase project is wired up yet
export const IS_MOCK =
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').includes('placeholder') ||
  !process.env.EXPO_PUBLIC_SUPABASE_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 16) + 8, Math.floor(Math.random() * 59), 0, 0);
  return d.toISOString();
};

const uid = () => Math.random().toString(36).slice(2);

// ─── Mock user ────────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'mock-user-001',
  email: 'demo@optispend.kz',
  full_name: 'Алан Баймуханов',
  subscription_plan: 'plus',
  subscription_status: 'trial',
  trial_ends_at: '2026-09-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

// ─── Mock financial profile ───────────────────────────────────────────────────
export const MOCK_PROFILE: FinancialProfile = {
  id: 'mock-profile-001',
  user_id: 'mock-user-001',
  monthly_income: 450_000,
  currency: 'KZT',
  income_sources: [
    { name: 'Зарплата', amount: 380_000, type: 'salary' },
    { name: 'Фриланс', amount: 70_000, type: 'freelance' },
  ],
  monthly_fixed_expenses: 130_000,
  total_debt: 0,
  has_emergency_fund: true,
  emergency_fund_months: 2,
  risk_tolerance: 'moderate',
  financial_goals: ['emergency_fund', 'vacation'],
  onboarding_completed: true,
};

// ─── Mock expenses (last 30 days) ─────────────────────────────────────────────
export const MOCK_EXPENSES: Expense[] = [
  // Today
  { id: uid(), user_id: 'mock-user-001', amount: 4_200,  currency: 'KZT', category: 'cafe_restaurants', merchant_name: 'Кофемания',      date: daysAgo(0),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(0) },
  { id: uid(), user_id: 'mock-user-001', amount: 1_800,  currency: 'KZT', category: 'transport',        merchant_name: 'Яндекс Go',       date: daysAgo(0),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(0) },

  // Yesterday
  { id: uid(), user_id: 'mock-user-001', amount: 12_500, currency: 'KZT', category: 'groceries',        merchant_name: 'Small',           date: daysAgo(1),  source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(1) },
  { id: uid(), user_id: 'mock-user-001', amount: 2_990,  currency: 'KZT', category: 'subscriptions',    merchant_name: 'Spotify',         date: daysAgo(1),  source: 'statement', is_recurring: true,  tags: ['subscriptions'], created_at: daysAgo(1) },
  { id: uid(), user_id: 'mock-user-001', amount: 6_800,  currency: 'KZT', category: 'food_delivery',    merchant_name: 'Glovo',           date: daysAgo(1),  source: 'receipt',   is_recurring: false, tags: [], created_at: daysAgo(1) },

  // 2–3 days ago
  { id: uid(), user_id: 'mock-user-001', amount: 3_200,  currency: 'KZT', category: 'cafe_restaurants', merchant_name: 'Zest',            date: daysAgo(2),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(2) },
  { id: uid(), user_id: 'mock-user-001', amount: 7_100,  currency: 'KZT', category: 'shopping',         merchant_name: 'Kaspi Магазин',   date: daysAgo(2),  source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(2) },
  { id: uid(), user_id: 'mock-user-001', amount: 1_500,  currency: 'KZT', category: 'transport',        merchant_name: 'inDrive',         date: daysAgo(3),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(3) },
  { id: uid(), user_id: 'mock-user-001', amount: 8_900,  currency: 'KZT', category: 'groceries',        merchant_name: 'Magnum',          date: daysAgo(3),  source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(3) },

  // This week
  { id: uid(), user_id: 'mock-user-001', amount: 5_500,  currency: 'KZT', category: 'food_delivery',    merchant_name: 'Wolt',            date: daysAgo(4),  source: 'receipt',   is_recurring: false, tags: [], created_at: daysAgo(4) },
  { id: uid(), user_id: 'mock-user-001', amount: 1_990,  currency: 'KZT', category: 'subscriptions',    merchant_name: 'Netflix',         date: daysAgo(5),  source: 'statement', is_recurring: true,  tags: ['subscriptions'], created_at: daysAgo(5) },
  { id: uid(), user_id: 'mock-user-001', amount: 15_000, currency: 'KZT', category: 'health',           merchant_name: 'Инвитро',         date: daysAgo(5),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(5) },
  { id: uid(), user_id: 'mock-user-001', amount: 4_600,  currency: 'KZT', category: 'cafe_restaurants', merchant_name: 'Burger King',     date: daysAgo(6),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(6) },

  // 1–2 weeks ago
  { id: uid(), user_id: 'mock-user-001', amount: 22_000, currency: 'KZT', category: 'shopping',         merchant_name: 'H&M',             date: daysAgo(8),  source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(8) },
  { id: uid(), user_id: 'mock-user-001', amount: 18_500, currency: 'KZT', category: 'groceries',        merchant_name: 'Small',           date: daysAgo(9),  source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(9) },
  { id: uid(), user_id: 'mock-user-001', amount: 9_800,  currency: 'KZT', category: 'food_delivery',    merchant_name: 'Glovo',           date: daysAgo(10), source: 'receipt',   is_recurring: false, tags: [], created_at: daysAgo(10) },
  { id: uid(), user_id: 'mock-user-001', amount: 3_600,  currency: 'KZT', category: 'transport',        merchant_name: 'Яндекс Go',       date: daysAgo(11), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(11) },
  { id: uid(), user_id: 'mock-user-001', amount: 5_990,  currency: 'KZT', category: 'subscriptions',    merchant_name: 'YouTube Premium', date: daysAgo(12), source: 'statement', is_recurring: true,  tags: ['subscriptions'], created_at: daysAgo(12) },
  { id: uid(), user_id: 'mock-user-001', amount: 11_200, currency: 'KZT', category: 'cafe_restaurants', merchant_name: 'Сool Café',       date: daysAgo(13), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(13) },
  { id: uid(), user_id: 'mock-user-001', amount: 7_400,  currency: 'KZT', category: 'entertainment',    merchant_name: 'Chaplin Cinema',  date: daysAgo(14), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(14) },

  // 2–3 weeks ago
  { id: uid(), user_id: 'mock-user-001', amount: 130_000,currency: 'KZT', category: 'housing',          merchant_name: 'Аренда квартиры', date: daysAgo(15), source: 'statement', is_recurring: true,  tags: ['fixed'], created_at: daysAgo(15) },
  { id: uid(), user_id: 'mock-user-001', amount: 6_200,  currency: 'KZT', category: 'food_delivery',    merchant_name: 'Wolt',            date: daysAgo(17), source: 'receipt',   is_recurring: false, tags: [], created_at: daysAgo(17) },
  { id: uid(), user_id: 'mock-user-001', amount: 14_000, currency: 'KZT', category: 'groceries',        merchant_name: 'Magnum',          date: daysAgo(18), source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(18) },
  { id: uid(), user_id: 'mock-user-001', amount: 2_200,  currency: 'KZT', category: 'transport',        merchant_name: 'inDrive',         date: daysAgo(20), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(20) },
  { id: uid(), user_id: 'mock-user-001', amount: 35_000, currency: 'KZT', category: 'shopping',         merchant_name: 'ZARA',            date: daysAgo(21), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(21) },

  // 3–4 weeks ago
  { id: uid(), user_id: 'mock-user-001', amount: 8_100,  currency: 'KZT', category: 'food_delivery',    merchant_name: 'Glovo',           date: daysAgo(22), source: 'receipt',   is_recurring: false, tags: [], created_at: daysAgo(22) },
  { id: uid(), user_id: 'mock-user-001', amount: 4_500,  currency: 'KZT', category: 'cafe_restaurants', merchant_name: 'Paul Bakery',     date: daysAgo(24), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(24) },
  { id: uid(), user_id: 'mock-user-001', amount: 21_000, currency: 'KZT', category: 'groceries',        merchant_name: 'Small',           date: daysAgo(25), source: 'statement', is_recurring: false, tags: [], created_at: daysAgo(25) },
  { id: uid(), user_id: 'mock-user-001', amount: 12_000, currency: 'KZT', category: 'health',           merchant_name: 'Фитнес клуб',     date: daysAgo(27), source: 'manual',    is_recurring: true,  tags: [], created_at: daysAgo(27) },
  { id: uid(), user_id: 'mock-user-001', amount: 5_800,  currency: 'KZT', category: 'entertainment',    merchant_name: 'Megatainment',    date: daysAgo(29), source: 'manual',    is_recurring: false, tags: [], created_at: daysAgo(29) },
];
