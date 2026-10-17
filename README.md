<div align="center">

# 💸 OptiSpend — Family CFO AI

### Your family's AI CFO — find spending leaks, set smart limits, and get AI money advice.

[![React Native](https://img.shields.io/badge/React_Native-0.74-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Landing](https://img.shields.io/badge/Landing-Live-FF4088?style=for-the-badge&logo=github&logoColor=white)](https://baimukhanalan.github.io/Optispend-mobile-/)

</div>

---

## 📖 About

**OptiSpend (Family CFO AI)** is a personal and family finance app that acts like a financial director in your pocket. It ingests your expenses — typed in, scanned from receipts, or imported from bank statements — then surfaces where money quietly leaks away, helps you set realistic limits and goals, and turns the numbers into plain-language AI recommendations and periodic reports.

> ⚠️ **Early-stage project.** OptiSpend is an actively evolving MVP. Core flows work, several integrations require your own API keys, and some backend pieces (PDF export, bank APIs) are still being hardened. See the [Roadmap](#%EF%B8%8F-roadmap) for current status.

It ships with a built-in **MockDB demo mode**, so you can run and explore the full UI with realistic sample data — no Supabase project or API keys required.

## ✨ Features

- 🧾 **OCR receipts** — snap a photo of a receipt and let AI-assisted OCR extract, normalize, and categorize line items.
- 📂 **Statement import** — bring in PDF / CSV / XLSX bank statements and have transactions parsed and categorized automatically.
- 🔍 **Leak detection** — analyzes spending patterns to flag recurring charges, creeping subscriptions, and money that drains away unnoticed.
- 🎯 **Budgets & limits** — set per-category limits and savings goals, with progress rings and gentle (or firm) nudges.
- 🤖 **AI recommendations** — a structured, no-nonsense AI advisor that explains what to cut and why.
- 📊 **Reports** — weekly and monthly summaries with AI-written highlights, delivered in-app or by email.
- 🔔 **Notifications** — push alerts via Expo Notifications and a Telegram bot for quick expense logging and reminders.
- 👨‍👩‍👧 **Family plans** — shared household finances across multiple members (plan-gated).

## 📱 Screenshots

<!-- TODO: Add real screenshots here, e.g.:
<p align="center">
  <img src="assets/screens/dashboard.png" width="30%" />
  <img src="assets/screens/leaks.png" width="30%" />
  <img src="assets/screens/advisor.png" width="30%" />
</p>
-->

_Screenshots coming soon. Meanwhile, explore the live [landing page](https://baimukhanalan.github.io/Optispend-mobile-/)._

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.74 + Expo 51 (TypeScript) |
| Routing | Expo Router (file-based) |
| State | Zustand |
| Forms & validation | React Hook Form + Zod |
| Animations | Reanimated 3, Gesture Handler |
| Backend | Supabase (Auth, Postgres + RLS, Storage, Edge Functions) |
| AI | OpenAI GPT-4o / Gemini (via Edge Functions) |
| OCR | Google Cloud Vision (Mindee as alternative) |
| Email | Resend |
| Messaging | Telegram Bot API |
| Push | Expo Notifications |
| Subscriptions | RevenueCat |
| Monitoring & analytics | Sentry, PostHog |

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Expo CLI** / Expo Go app (`npx expo` is used, no global install needed)
- For native builds: **Xcode** (iOS) or **Android Studio** (Android)

### 1. Install dependencies

```bash
npm install
```

### 2. Run in demo mode (no backend required)

Thanks to the built-in **MockDB**, the app runs out of the box with realistic sample data when no Supabase URL is configured:

```bash
npx expo start
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go.

### 3. (Optional) Connect a real backend

Copy the environment template and fill in your own keys:

```bash
cp .env.example .env
```

Frontend variables (safe to expose):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

> As long as `EXPO_PUBLIC_SUPABASE_URL` is unset (or still a placeholder), the app stays in MockDB demo mode automatically.

Server-side keys (OpenAI, Google Cloud Vision, Resend, Telegram, RevenueCat, Sentry, PostHog) live **only** in Supabase Edge Function secrets — never in the frontend. To provision the backend, create a Supabase project, run the SQL in `supabase/migrations/`, create the Storage buckets (`receipts`, `statements`, `reports`, `avatars`), and deploy the functions in `supabase/functions/`.

### Useful scripts

```bash
npm run ios        # start + open iOS simulator
npm run android    # start + open Android
npm run web        # run in the browser
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## 🗺️ Roadmap

- [x] Core expense tracking, dashboard, and categories
- [x] MockDB demo mode (runs without Supabase)
- [x] OCR receipt scanning and statement import
- [x] AI leak detection and recommendations
- [x] Weekly / monthly reports
- [x] Push + Telegram notifications
- [ ] PDF report export (currently a stub)
- [ ] Direct bank integrations / Open Banking (file import only for now)
- [ ] Polished family invite flow
- [ ] Admin portal
- [ ] Automated test coverage

## 🔒 Security

- All third-party API keys live in Supabase Edge Function secrets, never in the client.
- Row-Level Security (RLS) is enabled on all tables; each user sees only their own data.
- Storage paths are isolated per `user_id`.

## ⚖️ Disclaimer

OptiSpend is not a licensed financial advisor. All AI-generated recommendations are for informational purposes only and do not constitute financial advice.

## 📄 License

No license has been specified yet. Until one is added, all rights are reserved by the author. Please open an issue if you'd like to use this project.
