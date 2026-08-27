import { env } from "../config/env.js";

// Spec OpenAPI ditulis manual (bukan generate dari komentar JSDoc) supaya
// satu file ini jadi sumber tunggal daftar endpoint yang benar-benar ada.
// Kalau nambah route baru di src/routes, tambahkan juga entry-nya di sini.

const bearerAuth = [{ bearerAuth: [] }];

const successEnvelope = (dataSchema, extra = {}) => ({
  type: "object",
  properties: {
    status: { type: "string", example: "success" },
    ...(extra.message ? { message: { type: "string", example: extra.message } } : {}),
    ...(dataSchema ? { data: dataSchema } : {}),
    ...(extra.pagination ? { pagination: { $ref: "#/components/schemas/Pagination" } } : {}),
  },
});

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const jsonBody = (schema, required = true) => ({
  required,
  content: { "application/json": { schema } },
});

const okJson = (schema, description = "OK") => ({
  description,
  content: { "application/json": { schema } },
});

const commonResponses = {
  401: errorResponse("Token tidak ada / tidak valid"),
  422: errorResponse("Validasi gagal"),
  500: errorResponse("Internal server error"),
};

const adminResponses = {
  ...commonResponses,
  403: errorResponse("Bukan ADMIN"),
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Finetra AI — Finance Pribadi API",
    version: "1.0.0",
    description:
      "Daftar endpoint REST backend Finetra AI. Semua endpoint diawali prefix `/api/v1`.\n\n" +
      "Cara pakai di halaman ini:\n" +
      "1. Jalankan `POST /auth/login` untuk dapat `access_token`.\n" +
      "2. Klik tombol **Authorize** di kanan atas, tempel token-nya.\n" +
      "3. Endpoint bertanda gembok sudah bisa dicoba langsung.",
  },
  servers: [
    { url: `http://localhost:${env.port}/api/v1`, description: "Local development" },
    { url: "/api/v1", description: "Server saat ini (relative)" },
  ],
  tags: [
    { name: "Health", description: "Probe status backend" },
    { name: "Auth", description: "Registrasi, login, 2FA, refresh & logout token" },
    { name: "Dashboard", description: "Ringkasan dan grafik arus kas" },
    { name: "Categories", description: "Kategori pemasukan / pengeluaran" },
    { name: "Transactions", description: "CRUD transaksi" },
    { name: "Budgets", description: "CRUD anggaran per kategori per bulan" },
    { name: "Users", description: "Profil user yang sedang login" },
    { name: "Admin", description: "Khusus role ADMIN" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Isi dengan `access_token` hasil login (tanpa prefix `Bearer `).",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Invalid or expired token" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 137 },
          total_pages: { type: "integer", example: 7 },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          refresh_token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Fetsu" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          phone: { type: "string", nullable: true },
          profession: { type: "string", nullable: true },
          income_range: { type: "number", nullable: true },
          risk_profile: { type: "string", nullable: true },
          preferred_currency: { type: "string", enum: ["IDR", "USD"] },
          has_avatar: {
            type: "boolean",
            description: "Isi foto TIDAK ikut di sini — ambil lewat GET /users/me/avatar.",
          },
          avatar_updated_at: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Cache-buster: berubah tiap foto diganti.",
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Makan & Minum" },
          type: { type: "string", enum: ["INCOME", "EXPENSE"] },
          icon: { type: "string", nullable: true },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          amount: { type: "number", example: 50000 },
          date: { type: "string", format: "date", example: "2026-08-26" },
          description: { type: "string", nullable: true },
          is_recurring: { type: "boolean" },
          category: { $ref: "#/components/schemas/Category" },
        },
      },
      Budget: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          amount_limit: { type: "number", example: 1500000 },
          month_year: { type: "string", format: "date", example: "2026-08-01" },
          spent: { type: "number", example: 640000 },
          category: { $ref: "#/components/schemas/Category" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Cek backend hidup",
        description: "Publik, tanpa query ke database — dipakai mobile app untuk deteksi koneksi.",
        security: [],
        responses: {
          200: okJson({
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              uptime: { type: "number", example: 1234.56 },
            },
          }),
        },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Daftar user baru",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Fetsu" },
            email: { type: "string", format: "email", example: "fetsu@example.com" },
            password: { type: "string", minLength: 8, example: "rahasia123" },
          },
        }),
        responses: {
          201: okJson(successEnvelope({ $ref: "#/components/schemas/User" }, { message: "User registered successfully" }), "User dibuat"),
          409: errorResponse("Email sudah terpakai"),
          422: errorResponse("Validasi gagal"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login email + password",
        description:
          "Kalau akun mengaktifkan 2FA, respons berisi `challenge_token` dan belum berisi `access_token`. " +
          "Lanjutkan ke `/auth/login/2fa-verify`.",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/AuthTokens" }, { message: "Login successful" })),
          401: errorResponse("Email atau password salah"),
          403: errorResponse("Akun disuspend"),
          422: errorResponse("Validasi gagal"),
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Login / Register dengan Google ID Token",
        description:
          "Menerima `id_token` dari Google Sign-In SDK (Play Services). Server memverifikasi token ke Google.\n\n" +
          "- Email sudah terdaftar (via password maupun Google): langsung login, `status: \"ok\"`. " +
          "Akun password yang emailnya cocok otomatis ditautkan ke identitas Google.\n" +
          "- Email belum terdaftar: **tidak ada user yang dibuat**. Respons `status: \"signup_required\"` " +
          "berisi `signup_token` (JWT bertanda tangan, berlaku 15 menit) yang harus dikirim balik ke " +
          "`/auth/google/complete` bersama password. Membatalkan di tahap ini tidak meninggalkan data apa pun.",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["id_token"],
          properties: {
            id_token: { type: "string", description: "Google ID Token (JWT) dari client SDK" },
          },
        }),
        responses: {
          200: okJson(
            successEnvelope(
              {
                oneOf: [
                  {
                    type: "object",
                    title: "Login berhasil",
                    properties: {
                      status: { type: "string", example: "ok" },
                      user_id: { type: "string", format: "uuid" },
                      token: { type: "string" },
                      refresh_token: { type: "string" },
                    },
                  },
                  {
                    type: "object",
                    title: "Perlu menyelesaikan pendaftaran",
                    properties: {
                      status: { type: "string", example: "signup_required" },
                      signup_token: { type: "string", description: "Kirim ke /auth/google/complete" },
                      email: { type: "string", format: "email" },
                      name: { type: "string" },
                    },
                  },
                ],
              },
              { message: "Login successful" }
            )
          ),
          401: errorResponse("Google token invalid, expired, atau email belum terverifikasi"),
          403: errorResponse("Akun disuspend"),
          422: errorResponse("Validasi gagal"),
        },
      },
    },
    "/auth/google/complete": {
      post: {
        tags: ["Auth"],
        summary: "Selesaikan pendaftaran Google dengan password",
        description:
          "Menutup alur `status: \"signup_required\"` dari `/auth/google`. Ini satu-satunya jalur di mana " +
          "akun Google baru masuk ke tabel users — sebelum langkah ini tidak ada baris apa pun yang dibuat, " +
          "sehingga `password_hash` tidak pernah tersimpan NULL. Tidak butuh Bearer token: yang dipercaya " +
          "adalah `signup_token` bertanda tangan.",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["signup_token", "password"],
          properties: {
            signup_token: { type: "string", description: "Dari respons /auth/google" },
            password: { type: "string", minLength: 8 },
          },
        }),
        responses: {
          201: okJson(
            successEnvelope(
              {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  user_id: { type: "string", format: "uuid" },
                  token: { type: "string" },
                  refresh_token: { type: "string" },
                },
              },
              { message: "User registered successfully" }
            ),
            "Akun dibuat dan sesi diterbitkan"
          ),
          401: errorResponse("signup_token invalid atau kedaluwarsa"),
          422: errorResponse("Validasi gagal"),
        },
      },
    },
    "/auth/login/2fa-verify": {
      post: {
        tags: ["Auth"],
        summary: "Verifikasi kode 2FA saat login",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["challenge_token", "code"],
          properties: {
            challenge_token: { type: "string" },
            code: { type: "string", example: "123456", description: "6 digit dari authenticator app" },
          },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/AuthTokens" }, { message: "Login successful" })),
          401: errorResponse("Kode salah / challenge token kedaluwarsa"),
          422: errorResponse("Validasi gagal"),
        },
      },
    },
    "/auth/login/2fa-setup": {
      post: {
        tags: ["Auth"],
        summary: "Mulai pendaftaran 2FA (ambil QR + secret)",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["challenge_token"],
          properties: { challenge_token: { type: "string" } },
        }),
        responses: {
          200: okJson(
            successEnvelope(
              {
                type: "object",
                properties: {
                  secret: { type: "string" },
                  otpauth_url: { type: "string" },
                  qr_code: { type: "string", description: "Data URL PNG" },
                },
              },
              { message: "2FA setup initiated" }
            )
          ),
          401: errorResponse("Challenge token tidak valid"),
        },
      },
    },
    "/auth/login/2fa-setup/confirm": {
      post: {
        tags: ["Auth"],
        summary: "Konfirmasi kode dan aktifkan 2FA",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["challenge_token", "code"],
          properties: {
            challenge_token: { type: "string" },
            code: { type: "string", example: "123456" },
          },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/AuthTokens" }, { message: "2FA enabled" })),
          401: errorResponse("Kode salah"),
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Tukar refresh token jadi access token baru",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["refresh_token"],
          properties: { refresh_token: { type: "string" } },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/AuthTokens" }, { message: "Token refreshed" })),
          401: errorResponse("Refresh token tidak valid / sudah dipakai"),
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cabut refresh token",
        security: [],
        requestBody: jsonBody({
          type: "object",
          required: ["refresh_token"],
          properties: { refresh_token: { type: "string" } },
        }),
        responses: {
          204: { description: "Berhasil logout, tanpa body" },
          422: errorResponse("Validasi gagal"),
        },
      },
    },

    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Ringkasan bulan berjalan",
        security: bearerAuth,
        parameters: [
          {
            name: "month",
            in: "query",
            schema: { type: "string", example: "2026-08" },
            description: "Bulan yang diminta (YYYY-MM). Default bulan sekarang.",
          },
        ],
        responses: {
          200: okJson(
            successEnvelope({
              type: "object",
              properties: {
                total_income: { type: "number" },
                total_expense: { type: "number" },
                balance: { type: "number" },
              },
            })
          ),
          ...commonResponses,
        },
      },
    },
    "/dashboard/cashflow": {
      get: {
        tags: ["Dashboard"],
        summary: "Deret arus kas per bulan",
        security: bearerAuth,
        parameters: [
          {
            name: "months",
            in: "query",
            schema: { type: "integer", example: 6 },
            description: "Jumlah bulan ke belakang.",
          },
        ],
        responses: {
          200: okJson(successEnvelope({ type: "array", items: { type: "object" } })),
          ...commonResponses,
        },
      },
    },
    "/dashboard/cashflow/range": {
      get: {
        tags: ["Dashboard"],
        summary: "Arus kas berdasarkan rentang preset",
        description: "Beda dari `/dashboard/cashflow`: balikannya membawa `granularity` dan label sumbu.",
        security: bearerAuth,
        parameters: [
          {
            name: "range",
            in: "query",
            schema: { type: "string", example: "6m" },
            description: "Preset rentang waktu, mis. `7d`, `1m`, `6m`, `1y`.",
          },
        ],
        responses: {
          200: okJson(successEnvelope({ type: "object" })),
          ...commonResponses,
        },
      },
    },

    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List kategori",
        security: bearerAuth,
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["INCOME", "EXPENSE"] },
            description: "Filter opsional.",
          },
        ],
        responses: {
          200: okJson(successEnvelope({ type: "array", items: { $ref: "#/components/schemas/Category" } })),
          ...commonResponses,
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Buat kategori",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string", example: "Transportasi" },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            icon: { type: "string", nullable: true },
          },
        }),
        responses: {
          201: okJson(successEnvelope({ $ref: "#/components/schemas/Category" }, { message: "Category created" }), "Kategori dibuat"),
          ...commonResponses,
        },
      },
    },

    "/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "List transaksi (paginated)",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", example: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", example: 20 } },
          { name: "type", in: "query", schema: { type: "string", enum: ["INCOME", "EXPENSE"] } },
          { name: "category_id", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "month", in: "query", schema: { type: "string", example: "2026-08" } },
        ],
        responses: {
          200: okJson(
            successEnvelope({ type: "array", items: { $ref: "#/components/schemas/Transaction" } }, { pagination: true })
          ),
          ...commonResponses,
        },
      },
      post: {
        tags: ["Transactions"],
        summary: "Buat transaksi",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["amount", "date", "category_id"],
          properties: {
            amount: { type: "number", example: 50000, description: "Harus > 0" },
            date: { type: "string", format: "date", example: "2026-08-26" },
            category_id: { type: "string", format: "uuid" },
            description: { type: "string", nullable: true },
            is_recurring: { type: "boolean", default: false },
          },
        }),
        responses: {
          201: okJson(successEnvelope({ $ref: "#/components/schemas/Transaction" }, { message: "Transaction created" }), "Transaksi dibuat"),
          ...commonResponses,
        },
      },
    },
    "/transactions/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      put: {
        tags: ["Transactions"],
        summary: "Update transaksi",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          properties: {
            amount: { type: "number", example: 75000 },
            date: { type: "string", format: "date" },
            category_id: { type: "string", format: "uuid" },
            description: { type: "string", nullable: true },
            is_recurring: { type: "boolean" },
          },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/Transaction" }, { message: "Transaction updated" })),
          404: errorResponse("Transaksi tidak ditemukan"),
          ...commonResponses,
        },
      },
      delete: {
        tags: ["Transactions"],
        summary: "Hapus transaksi",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope(null, { message: "Transaction deleted" })),
          404: errorResponse("Transaksi tidak ditemukan"),
          ...commonResponses,
        },
      },
    },

    "/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "List anggaran",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ type: "array", items: { $ref: "#/components/schemas/Budget" } })),
          ...commonResponses,
        },
      },
      post: {
        tags: ["Budgets"],
        summary: "Buat anggaran",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["category_id", "amount_limit", "month_year"],
          properties: {
            category_id: { type: "string", format: "uuid" },
            amount_limit: { type: "number", example: 1500000 },
            month_year: { type: "string", format: "date", example: "2026-08-01" },
          },
        }),
        responses: {
          201: okJson(successEnvelope({ $ref: "#/components/schemas/Budget" }, { message: "Budget created" }), "Anggaran dibuat"),
          ...commonResponses,
        },
      },
    },
    "/budgets/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      put: {
        tags: ["Budgets"],
        summary: "Update limit anggaran",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["amount_limit"],
          properties: { amount_limit: { type: "number", example: 2000000 } },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/Budget" }, { message: "Budget updated" })),
          404: errorResponse("Anggaran tidak ditemukan"),
          ...commonResponses,
        },
      },
      delete: {
        tags: ["Budgets"],
        summary: "Hapus anggaran",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope(null, { message: "Budget deleted" })),
          404: errorResponse("Anggaran tidak ditemukan"),
          ...commonResponses,
        },
      },
    },

    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Profil user yang sedang login",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/User" })),
          ...commonResponses,
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update profil",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string", nullable: true },
            profession: { type: "string", nullable: true },
            income_range: { type: "number", nullable: true, minimum: 0 },
            risk_profile: { type: "string", nullable: true },
            preferred_currency: { type: "string", enum: ["IDR", "USD"] },
          },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/User" }, { message: "Profile updated" })),
          ...commonResponses,
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Hapus akun sendiri",
        description: "Permanen. Wajib kirim password sebagai konfirmasi.",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["password"],
          properties: { password: { type: "string" } },
        }),
        responses: {
          200: okJson(successEnvelope(null, { message: "Account deleted" })),
          401: errorResponse("Password salah / token tidak valid"),
          ...commonResponses,
        },
      },
    },
    "/users/me/avatar": {
      get: {
        tags: ["Users"],
        summary: "Ambil foto profil",
        description:
          "Dipisah dari `GET /users/me` karena isinya base64 tanpa kompresi (bisa megabyte-an) — " +
          "`/users/me` hanya mengembalikan penanda `has_avatar` dan `avatar_updated_at`, " +
          "dan client memanggil endpoint ini hanya kalau `has_avatar` bernilai true.",
        security: bearerAuth,
        responses: {
          200: okJson(
            successEnvelope({
              type: "object",
              properties: {
                avatar: { type: "string", description: "Data URI, mis. data:image/jpeg;base64,..." },
                updated_at: { type: "string", format: "date-time" },
              },
            })
          ),
          404: errorResponse("User tidak ditemukan atau belum punya foto profil"),
          ...commonResponses,
        },
      },
      put: {
        tags: ["Users"],
        summary: "Unggah / ganti foto profil",
        description:
          "Body harus data URI base64 (`data:<mime>;base64,<payload>`), bukan base64 telanjang. " +
          "Tipe yang diterima: JPEG, PNG, WebP. Batas payload 8MB — batas body parser Express " +
          "disetel 12MB agar penolakan datang dari validasi ini (pesannya jelas) alih-alih dari body parser.",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["avatar"],
          properties: {
            avatar: { type: "string", example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." },
          },
        }),
        responses: {
          200: okJson(
            successEnvelope({ $ref: "#/components/schemas/User" }, { message: "Foto profil diperbarui" })
          ),
          413: errorResponse("Ukuran foto melebihi 8MB"),
          422: errorResponse("Bukan data URI base64 yang sah, atau format bukan JPEG/PNG/WebP"),
          ...commonResponses,
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Hapus foto profil",
        security: bearerAuth,
        responses: {
          200: okJson(
            successEnvelope({ $ref: "#/components/schemas/User" }, { message: "Foto profil dihapus" })
          ),
          ...commonResponses,
        },
      },
    },
    "/users/me/password": {
      put: {
        tags: ["Users"],
        summary: "Ganti password",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["current_password", "new_password"],
          properties: {
            current_password: { type: "string" },
            new_password: { type: "string", minLength: 8 },
          },
        }),
        responses: {
          200: okJson(successEnvelope(null, { message: "Password updated" })),
          401: errorResponse("Password lama salah"),
          ...commonResponses,
        },
      },
    },
    "/users/me/export": {
      get: {
        tags: ["Users"],
        summary: "Export seluruh data user",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ type: "object" }), "Data user lengkap"),
          ...commonResponses,
        },
      },
    },

    "/admin/overview": {
      get: {
        tags: ["Admin"],
        summary: "Statistik ringkas seluruh sistem",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ type: "object" })),
          ...adminResponses,
        },
      },
    },
    "/admin/system-health": {
      get: {
        tags: ["Admin"],
        summary: "Kesehatan sistem (DB, uptime, metrik request)",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ type: "object" })),
          ...adminResponses,
        },
      },
    },
    "/admin/activity": {
      get: {
        tags: ["Admin"],
        summary: "Log aktivitas (paginated + filter)",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "page_size", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "user", in: "query", schema: { type: "string" }, description: "Cari berdasarkan nama/email." },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "module", in: "query", schema: { type: "string" } },
          { name: "ip", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          200: okJson(successEnvelope({ type: "object" })),
          ...adminResponses,
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List semua user",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "page_size", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: okJson(successEnvelope({ type: "object" })),
          ...adminResponses,
        },
      },
    },
    "/admin/users/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: {
        tags: ["Admin"],
        summary: "Detail satu user",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/User" })),
          404: errorResponse("User tidak ditemukan"),
          ...adminResponses,
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus user",
        description: "Permanen — data transaksi & anggaran user ikut terhapus.",
        security: bearerAuth,
        responses: {
          200: okJson(successEnvelope(null, { message: "User deleted" })),
          404: errorResponse("User tidak ditemukan"),
          ...adminResponses,
        },
      },
    },
    "/admin/users/{id}/role": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      patch: {
        tags: ["Admin"],
        summary: "Ubah role user",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["role"],
          properties: { role: { type: "string", enum: ["USER", "ADMIN"] } },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/User" }, { message: "Role updated" })),
          ...adminResponses,
        },
      },
    },
    "/admin/users/{id}/suspend": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      patch: {
        tags: ["Admin"],
        summary: "Suspend / aktifkan kembali user",
        security: bearerAuth,
        requestBody: jsonBody({
          type: "object",
          required: ["is_suspended"],
          properties: { is_suspended: { type: "boolean" } },
        }),
        responses: {
          200: okJson(successEnvelope({ $ref: "#/components/schemas/User" }, { message: "Suspend status updated" })),
          ...adminResponses,
        },
      },
    },
    "/admin/users/{id}/reset-password": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      post: {
        tags: ["Admin"],
        summary: "Reset password user",
        security: bearerAuth,
        responses: {
          200: okJson(
            successEnvelope(
              { type: "object", properties: { temporary_password: { type: "string" } } },
              { message: "Password reset" }
            )
          ),
          ...adminResponses,
        },
      },
    },
  },
};

export default openApiSpec;
