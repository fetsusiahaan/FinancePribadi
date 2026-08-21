// Struktur menu sidebar admin. Data-driven supaya AppRoutes.jsx bisa generate
// <Route> untuk tiap item tanpa menulis satu-satu (lihat ADMIN_FLAT_ROUTES).
// Path "/admin/users" satu-satunya yang punya halaman nyata (User Management);
// sisanya dirender sebagai placeholder Coming Soon sampai fiturnya dibangun.
export const ADMIN_NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    items: [
      { label: "Overview", path: "/admin", icon: "dashboard" },
      { label: "Financial Overview", path: "/admin/financial-overview", icon: "account_balance" },
      { label: "AI Usage", path: "/admin/ai-usage-overview", icon: "smart_toy" },
      { label: "System Health", path: "/admin/system-health", icon: "monitor_heart" },
    ],
  },
  {
    id: "users",
    label: "User Management",
    icon: "group",
    items: [
      { label: "Users", path: "/admin/users", icon: "person" },
      { label: "Roles & Permissions", path: "/admin/users/roles", icon: "admin_panel_settings" },
      { label: "User Activity", path: "/admin/users/activity", icon: "history" },
      { label: "Login History", path: "/admin/users/login-history", icon: "login" },
      { label: "Suspended Users", path: "/admin/users/suspended", icon: "block" },
    ],
  },
  {
    id: "finance",
    label: "Finance Management",
    icon: "payments",
    items: [
      { label: "Transactions", path: "/admin/finance/transactions", icon: "receipt_long" },
      { label: "Categories", path: "/admin/finance/categories", icon: "category" },
      { label: "Accounts", path: "/admin/finance/accounts", icon: "account_balance_wallet" },
      { label: "Budgets", path: "/admin/finance/budgets", icon: "savings" },
      { label: "Financial Goals", path: "/admin/finance/goals", icon: "flag" },
      { label: "Recurring Transactions", path: "/admin/finance/recurring", icon: "autorenew" },
    ],
  },
  {
    id: "ai",
    label: "AI Management",
    icon: "smart_toy",
    items: [
      { label: "AI Dashboard", path: "/admin/ai", icon: "smart_toy" },
      { label: "AI Models", path: "/admin/ai/models", icon: "psychology" },
      { label: "AI Providers", path: "/admin/ai/providers", icon: "hub" },
      { label: "Prompt Management", path: "/admin/ai/prompts", icon: "edit_note" },
      { label: "AI Usage / Token", path: "/admin/ai/usage", icon: "token" },
      { label: "AI Cost", path: "/admin/ai/cost", icon: "payments" },
      { label: "AI Logs", path: "/admin/ai/logs", icon: "description" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Reports",
    icon: "monitoring",
    items: [
      { label: "User Analytics", path: "/admin/analytics/users", icon: "groups" },
      { label: "Financial Analytics", path: "/admin/analytics/finance", icon: "trending_up" },
      { label: "AI Analytics", path: "/admin/analytics/ai", icon: "insights" },
      { label: "Revenue / Subscription", path: "/admin/analytics/revenue", icon: "attach_money" },
      { label: "Custom Reports", path: "/admin/analytics/custom", icon: "summarize" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "notifications",
    items: [
      { label: "Notification Templates", path: "/admin/notifications/templates", icon: "edit_document" },
      { label: "Broadcast", path: "/admin/notifications/broadcast", icon: "campaign" },
      { label: "Email Notifications", path: "/admin/notifications/email", icon: "mail" },
      { label: "Push Notifications", path: "/admin/notifications/push", icon: "notifications_active" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "settings",
    items: [
      { label: "General Settings", path: "/admin/system/general", icon: "tune" },
      { label: "Finance Settings", path: "/admin/system/finance", icon: "account_balance" },
      { label: "AI Settings", path: "/admin/system/ai", icon: "smart_toy" },
      { label: "Currency", path: "/admin/system/currency", icon: "currency_exchange" },
      { label: "Categories", path: "/admin/system/categories", icon: "category" },
      { label: "Integrations", path: "/admin/system/integrations", icon: "extension" },
      { label: "Maintenance", path: "/admin/system/maintenance", icon: "build" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: "security",
    items: [
      { label: "Audit Logs", path: "/admin/security/audit-logs", icon: "fact_check" },
      { label: "Login Attempts", path: "/admin/security/login-attempts", icon: "lock_clock" },
      { label: "API Keys", path: "/admin/security/api-keys", icon: "key" },
      { label: "Sessions", path: "/admin/security/sessions", icon: "devices" },
      { label: "Security Settings", path: "/admin/security/settings", icon: "shield" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "extension",
    items: [
      { label: "AI Providers", path: "/admin/integrations/ai-providers", icon: "hub" },
      { label: "Payment Gateway", path: "/admin/integrations/payment-gateway", icon: "credit_card" },
      { label: "Email", path: "/admin/integrations/email", icon: "mail" },
      { label: "WhatsApp", path: "/admin/integrations/whatsapp", icon: "chat" },
      { label: "External APIs", path: "/admin/integrations/external-apis", icon: "api" },
    ],
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: "credit_card",
    items: [
      { label: "Plans", path: "/admin/subscription/plans", icon: "workspace_premium" },
      { label: "Subscriptions", path: "/admin/subscription/subscriptions", icon: "card_membership" },
      { label: "Payments", path: "/admin/subscription/payments", icon: "payments" },
      { label: "Coupons", path: "/admin/subscription/coupons", icon: "sell" },
      { label: "Billing History", path: "/admin/subscription/billing-history", icon: "receipt" },
    ],
  },
  {
    id: "logs",
    label: "Logs",
    icon: "description",
    items: [
      { label: "Application Logs", path: "/admin/logs/application", icon: "terminal" },
      { label: "API Logs", path: "/admin/logs/api", icon: "api" },
      { label: "AI Request Logs", path: "/admin/logs/ai-requests", icon: "smart_toy" },
      { label: "Error Logs", path: "/admin/logs/errors", icon: "error" },
      { label: "System Logs", path: "/admin/logs/system", icon: "dns" },
    ],
  },
];

// Flatten semua item + info grup induknya, dipakai AppRoutes.jsx buat generate
// <Route> dan AdminLayout.jsx buat lookup judul halaman aktif dari pathname.
export const ADMIN_FLAT_ROUTES = ADMIN_NAV.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupLabel: group.label }))
);
