# Dokumen Persyaratan Produk (PRD)
## AI Personal Finance - Smart Financial Assistant Powered by AI

**Version:** 1.0
**Status:** Draft
**Author:** Product Team

---

## Technology Stack

*   **Frontend:** React.js + Vite
*   **UI:** TailwindCSS + Shadcn UI
*   **Backend:** Express.js (Node.js)
*   **AI:** OpenAI GPT / Claude / Gemini
*   **Database:** PostgreSQL
*   **Cache:** Redis
*   **Authentication:** JWT + Refresh Token
*   **Storage:** S3 Compatible Storage
*   **Deployment:** Docker + Nginx

---

## 1. Overview

### Product Vision
Membantu pengguna mengelola keuangan pribadi menggunakan Artificial Intelligence sehingga pengguna dapat:
*   mengetahui kondisi finansial saat ini
*   mengatur budget
*   mencatat pemasukan dan pengeluaran
*   memperoleh insight otomatis
*   memperoleh rekomendasi investasi
*   mengetahui peluang mencapai target finansial
*   berdiskusi dengan AI layaknya Financial Advisor.

### Problem Statement
Sebagian besar orang:
*   tidak mencatat pengeluaran
*   tidak mengetahui cashflow
*   tidak mempunyai budgeting
*   tidak mengetahui penyebab uang cepat habis
*   sulit membuat rencana keuangan
*   bingung memilih investasi
*   tidak mengetahui kondisi finansial secara keseluruhan

### Solution
Website yang memiliki AI sebagai Financial Advisor.
AI mampu:
*   membaca transaksi
*   memahami pola pengeluaran
*   memberi saran
*   memprediksi kondisi keuangan
*   membuat budgeting otomatis
*   membuat target finansial
*   memberikan laporan.

### Target User
*   **Beginner:** Baru mulai mencatat keuangan.
*   **Employee:** Gaji bulanan.
*   **Freelancer:** Income tidak tetap.
*   **Entrepreneur:** Cashflow bisnis dan pribadi.
*   **Family:** Mengatur keuangan rumah tangga.

### Goal
Dalam satu dashboard user dapat melihat:
*   Total Asset
*   Cash Flow
*   Budget
*   Savings
*   Investment
*   Debt
*   Financial Score
*   AI Recommendation

### Success Metrics
*   Daily Active User
*   Monthly Active User
*   Transaction Recorded
*   Budget Created
*   AI Chat Usage
*   Savings Goal Completion
*   Monthly Retention
*   Premium Conversion

---

## Core Features

### 1. Dashboard
Menampilkan:
*   Total Balance, Total Asset, Monthly Income, Monthly Expense
*   Savings, Investments, Debt
*   Financial Health Score
*   Budget Progress
*   Recent Transactions
*   AI Summary

### 2. Income Management
User dapat menambahkan: Salary, Bonus, Freelance, Business, Gift, Other.
**Fields:** Amount, Date, Category, Description, Attachment.

### 3. Expense Management
**Kategori default:** Food, Transportation, Shopping, Bills, Education, Entertainment, Health, Insurance, Investment, Donation, Others.
**Support:** recurring expense, upload receipt, AI categorize.

### 4. Budget Planner
Budget bulanan (Misal: Food Rp2.000.000, Transport Rp800.000, Shopping Rp500.000).
AI akan memberi warning jika budget hampir habis.

### 5. Savings Goal
Contoh: Wedding (Target Rp150.000.000, Deadline 11 November 2028, Progress 68%).
AI menghitung: target bulanan, peluang berhasil, saran meningkatkan tabungan.

### 6. Debt Management
**Input:** Pinjaman, Cicilan, Kartu Kredit.
AI menghitung: total debt, debt ratio, payoff strategy.
**Metode:** Snowball, Avalanche.

### 7. Investment Portfolio
**Support:** Deposito, Saham, Reksa Dana, Crypto, Emas, Obligasi.
AI menjelaskan: Return, Risk, Allocation, Diversification.

### 8. Financial Calendar
Menampilkan: payday, due date, recurring payment, reminder, investment schedule.

### 9. AI Chat Financial Advisor
*   **Contoh User:** "Gaji saya 8 juta."
    *   **AI Menghitung:** budget, emergency fund, saving, debt ratio, investasi.
*   **Contoh lain User:** "Saya ingin menikah tahun 2028."
    *   **AI:** Membuat roadmap keuangan otomatis.

### 10. AI Transaction Analyzer
**Upload:** PDF, CSV, Bank Statement.
AI akan: membaca transaksi, membuat kategori, membuat grafik, mendeteksi pemborosan.

### 11. AI Spending Insight
Contoh: "Bulan ini Transport naik 18%, Makanan naik 42%, Subscription bertambah 3 layanan."
AI memberi rekomendasi berdasarkan pola ini.

### 12. Financial Health Score
**Score:** 0-100 (Poor, Fair, Good, Excellent).
**Parameter:** Income Stability, Debt Ratio, Emergency Fund, Investment, Budget Discipline, Savings Rate, Expense Control.

### 13. Reports
Generate PDF, Excel (Monthly, Yearly, Custom).

### 14. Notifications
Push Notification, Email, Reminder (Budget Warning, Goal Progress, Debt Due).

---

## AI Features & Flow

### AI Modules
*   **Budget AI:** Membuat budget otomatis.
*   **Saving AI:** Menghitung target tabungan.
*   **Debt AI:** Membuat strategi pelunasan.
*   **Investment AI:** Memberi rekomendasi.
*   **Expense AI:** Mengelompokkan transaksi otomatis.
*   **Forecast AI:** Prediksi kondisi keuangan.
*   **Financial Coach:** Chat AI.

### AI Prompt Flow
Input → Transaction → Categorization → Analysis → Recommendation → Financial Score → Dashboard

---

## User Journey
Login → Complete Profile → Input Income → Input Expense → AI Analysis → Dashboard → Chat AI → Improve Financial Score

---

## Technical Details

### Authentication & User Profile
*   **Auth:** Email, Google Login, GitHub Login, Microsoft Login.
*   **Profile:** Nama, Tanggal Lahir, Pekerjaan (termasuk status Karyawan Swasta), Status, Pendapatan, Target Finansial, Risk Profile.
*   **Financial Goals:** Wedding, House, Car, Vacation, Education, Retirement, Emergency Fund.

### Dashboard Layout
*   **Cards:** Current Balance, Income, Expense, Saving, Investment, Debt, Financial Score.
*   **Charts:** Line Chart (Cash Flow), Pie Chart (Expense Category), Bar Chart (Monthly Income), Area Chart (Savings).
*   **Responsive:** Desktop, Tablet, Mobile.

### Detailed Tech Stack
**Frontend**
*   React.js, Vite, TypeScript, TailwindCSS, Shadcn UI, TanStack Query, React Hook Form, Zod, Framer Motion, React Router, Axios, Chart.js, React Table.

**Backend (Express.js)**
*   Express.js (Node.js)
*   Clean Architecture / MVC
*   Prisma ORM atau Sequelize
*   JWT Authentication
*   Socket.io (untuk real-time features jika diperlukan)
*   Swagger (API Docs)
*   Joi / Express Validator

**Database & AI**
*   PostgreSQL, Redis
*   OpenAI GPT, LangChain, Embeddings, Vector Database, RAG.

### Folder Structure (Frontend & Backend Concept)
```text
src/
  ├── components/
  ├── pages/
  ├── layouts/
  ├── hooks/
  ├── services/
  ├── contexts/
  ├── routes/
  ├── utils/
  ├── types/
  ├── assets/
  ├── styles/
  ├── constants/
  ├── ai/
  ├── dashboard/
  ├── finance/
  ├── chat/
  ├── reports/
```

### API Modules
Authentication, Users, Transactions, Budgets, Savings, Goals, Debts, Investments, Reports, AI Chat, AI Analysis, Notification, Dashboard.

### Security
JWT, Refresh Token, Rate Limiter, HTTPS, Encryption, 2FA, Audit Log, CSRF, XSS Protection.

---

## Business & Roadmap

### Future Features
Open Banking, OCR Receipt, WhatsApp Bot, Telegram Bot, Voice AI, Investment Marketplace, Insurance Recommendation, Tax Calculator, Family Sharing, Couple Finance, AI Negotiation Debt.

### Monetization
*   **Free:** Basic Transaction, Dashboard, AI Chat Limited.
*   **Premium:** Unlimited AI, Forecast, Investment Advisor, Unlimited Reports, OCR, Financial Coach, Priority Support.

### UI Theme
*   **Primary:** Blue
*   **Secondary:** Emerald
*   **Accent:** Purple
*   **Mode:** Dark Mode Supported, Glassmorphism, Minimal, Modern Finance Dashboard Style.

### Roadmap
*   **Phase 1 (MVP):** Authentication, Dashboard, Income, Expense, Budget, AI Chat, Financial Score.
*   **Phase 2:** Savings Goal, Debt Planner, Reports, Notifications, Investment.
*   **Phase 3:** OCR, Open Banking, AI Forecast, AI Coach, Mobile PWA.

### Estimasi Pengembangan
| Sprint | Fokus | Durasi |
| :--- | :--- | :--- |
| Sprint 1 | UI Foundation, Authentication, Design System | 2 minggu |
| Sprint 2 | Dashboard, Income, Expense, Budget | 2 minggu |
| Sprint 3 | AI Chat, AI Transaction Analysis, Financial Score | 2 minggu |
| Sprint 4 | Savings Goals, Debt Planner, Investment Portfolio | 2 minggu |
| Sprint 5 | Reports, Notifications, Testing, Security Hardening | 2 minggu |
| Sprint 6 | Performance Optimization, Deployment, Beta Release | 2 minggu |

---

## Nilai Pembeda (Unique Selling Proposition)
*   **AI Financial Twin:** AI membangun profil finansial pengguna dan memberikan simulasi keputusan.
*   **What-if Scenario Simulator:** Simulasi perubahan gaji, pengeluaran, investasi, atau utang beserta dampaknya terhadap target finansial.
*   **AI Weekly & Monthly Review:** Ringkasan otomatis berisi pencapaian, kebiasaan belanja, area pemborosan, dan rekomendasi aksi berikutnya.
*   **Smart Financial Roadmap:** AI menyusun roadmap menuju target seperti menikah, membeli rumah, dana darurat, atau pensiun berdasarkan kondisi keuangan pengguna.
*   **Predictive Cashflow:** Prediksi saldo harian, mingguan, dan bulanan berdasarkan pola transaksi historis.
*   **AI Financial Risk Alert:** Deteksi dini ketika pola pengeluaran, rasio utang, atau arus kas menunjukkan potensi masalah sebelum benar-benar terjadi.
