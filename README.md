# Family CFO AI

AI-финансовый директор для семьи. Находит утечки, ставит лимиты, генерирует отчёты, даёт жёсткие рекомендации.

---

## Стек

| Слой | Технология |
|------|-----------|
| Mobile | React Native + Expo (TypeScript) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Animations | Reanimated 3 |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | OpenAI GPT-4o / Gemini |
| OCR | Google Cloud Vision API |
| Email | Resend |
| Push | Expo Notifications |
| Telegram | Telegram Bot API |
| Subscriptions | RevenueCat |
| Monitoring | Sentry |
| Analytics | PostHog |

---

## Запуск

### 1. Клонировать / распаковать проект

```bash
cd "OptiSpend mobile"
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

```bash
cp .env.example .env
```

Заполните `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` — из Supabase Dashboard → Project Settings → API
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — оттуда же

### 4. Создать Supabase проект

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. В SQL Editor выполните файлы по порядку:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   ```
4. В Storage создайте private-бакеты: `receipts`, `statements`, `reports`
5. В публичном бакете создайте: `avatars`

### 5. Задеплоить Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Установить секреты
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GOOGLE_CLOUD_VISION_KEY=...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set TELEGRAM_BOT_TOKEN=bot...
supabase secrets set SENTRY_DSN=https://...

# Деплой всех функций
supabase functions deploy parse-receipt
supabase functions deploy parse-statement
supabase functions deploy detect-financial-leaks
supabase functions deploy generate-ai-advice
supabase functions deploy generate-weekly-report
supabase functions deploy generate-monthly-report
supabase functions deploy send-email-report
supabase functions deploy send-push-notification
supabase functions deploy telegram-webhook
supabase functions deploy sync-subscription-status
```

### 6. Настроить Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Скопируйте токен в `TELEGRAM_BOT_TOKEN`
3. Установите webhook:
```
POST https://api.telegram.org/bot{TOKEN}/setWebhook
{"url": "https://YOUR_PROJECT.supabase.co/functions/v1/telegram-webhook"}
```

### 7. Запустить приложение

```bash
npx expo start
```

Затем:
- iOS: нажмите `i` (нужен Xcode)
- Android: нажмите `a` (нужен Android Studio или устройство)
- Expo Go: сканируйте QR-код

---

## Структура проекта

```
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/             # Авторизация
│   ├── (tabs)/             # Основные вкладки
│   ├── _layout.tsx         # Root layout
│   └── index.tsx           # Entry + redirect logic
│
├── src/
│   ├── components/
│   │   ├── ui/             # Card, Button, ProgressRing, CountUp, Skeleton
│   │   └── shared/         # TransactionRow, LeakItem, etc.
│   ├── screens/            # Screen components (referenced by app/)
│   ├── store/              # Zustand stores (auth, expenses)
│   ├── lib/                # supabase.ts, theme.ts, format.ts
│   └── types/              # TypeScript типы
│
├── supabase/
│   ├── migrations/         # SQL схема + RLS политики
│   └── functions/          # Edge Functions (Deno)
│
├── .env.example            # Пример переменных окружения
├── app.config.ts           # Expo config
├── babel.config.js
└── tsconfig.json
```

---

## Edge Functions

| Функция | Описание |
|---------|---------|
| `parse-receipt` | OCR чека → нормализация AI → категоризация |
| `parse-statement` | Парсинг выписок PDF/CSV/XLSX → AI категоризация |
| `categorize-expense` | AI категоризация одной операции |
| `detect-financial-leaks` | Анализ расходов → выявление утечек |
| `generate-ai-advice` | Полный AI-анализ + структурированные рекомендации |
| `generate-weekly-report` | Недельный отчёт + AI summary |
| `generate-monthly-report` | Месячный deep report |
| `send-email-report` | Email отчёт через Resend |
| `send-push-notification` | Push через Expo + запись в DB |
| `telegram-webhook` | Telegram bot (быстрые расходы + команды) |
| `sync-subscription-status` | Синхронизация статуса RevenueCat |

---

## Тарифы

| План | Цена | Операций | OCR | AI | Семья |
|------|------|----------|-----|----|-------|
| Free | 0 ₸ | 20/мес | ✗ | ✗ | 1 |
| Plus | 2 990 ₸/мес | ∞ | ✓ | ✓ | 1 |
| Family | 5 990 ₸/мес | ∞ | ✓ | ✓ | 5 |
| Premium | 14 990 ₸/мес | ∞ | ✓ | ✓ | 5 |

---

## Ручные действия (список)

- [ ] Создать Supabase проект и получить ключи
- [ ] Выполнить SQL миграции (001 и 002)
- [ ] Создать Storage бакеты (receipts, statements, reports, avatars)
- [ ] Создать аккаунт OpenAI и получить API key
- [ ] Создать проект Google Cloud и включить Vision API
- [ ] Зарегистрироваться на Resend и добавить домен
- [ ] Создать Telegram бота через BotFather
- [ ] Зарегистрироваться в Sentry и создать проект
- [ ] Зарегистрироваться в RevenueCat и настроить продукты
- [ ] Задеплоить Edge Functions с секретами
- [ ] Установить webhook для Telegram бота
- [ ] Настроить Scheduled Job на generate-weekly-report (каждое воскресенье 20:00)
- [ ] Создать Expo аккаунт и получить project ID
- [ ] Добавить push-notification схему в app.config.ts

---

## Ограничения MVP

- Нет прямой банковской интеграции (Open Banking) — только импорт файлов
- Kaspi, Halyk, Forte — парсинг через AI (не официальное API)
- Export PDF — заглушка (нужна реализация через Puppeteer или PDFKit в Edge Function)
- RevenueCat — нужна настройка через App Store Connect / Google Play Console
- Семейные функции — требуют доп. тестирования invite flow
- Admin portal — не реализован (нужен отдельный Next.js проект или hidden screen)
- Debt Report — не реализован (логика в `generate-monthly-report`)

---

## Безопасность

- Все API keys только в Edge Functions (Supabase secrets)
- Frontend использует только `EXPO_PUBLIC_SUPABASE_URL` и `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- RLS включён на всех таблицах
- Каждый пользователь видит только свои данные
- Storage paths изолированы по user_id

---

## Дисклеймер

Приложение не является лицензированным финансовым советником. Все AI-рекомендации носят исключительно информационный характер и не являются финансовой консультацией.
