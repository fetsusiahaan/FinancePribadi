# Spesifikasi API (API.md)
## AI Personal Finance - Express.js REST API

**Base URL:** `/api/v1`
**Content-Type:** `application/json`
**Authentication:** Bearer Token (JWT) diletakkan di Header `Authorization: Bearer <token>`

---

### 1. Authentication

#### `POST /auth/register`
Mendaftarkan pengguna baru.
*   **Request Body:**
    ```json
    {
      "name": "Fetra Suseno",
      "email": "admin@fetsu.id",
      "password": "rahasia123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "data": { "user_id": "uuid-1234", "token": "jwt.token.here" }
    }
    ```

#### `POST /auth/login`
Autentikasi pengguna dan mengembalikan JWT.

---

### 2. Dashboard

#### `GET /dashboard/summary`
Mengambil ringkasan keuangan bulan ini.
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `?month=2026-08`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "total_balance": 15000000,
        "monthly_income": 8000000,
        "monthly_expense": 4500000,
        "financial_score": 82,
        "ai_insight": "Pengeluaran transport Anda naik 18% bulan ini. Pertimbangkan untuk mengurangi layanan ride-hailing."
      }
    }
    ```

---

### 3. Transactions

#### `POST /transactions`
Menambahkan data pemasukan/pengeluaran baru.
*   **Request Body:**
    ```json
    {
      "amount": 50000,
      "date": "2026-08-07",
      "category_id": "uuid-food-cat",
      "description": "Makan siang Mie Gacoan",
      "type": "EXPENSE"
    }
    ```

#### `GET /transactions`
Melihat riwayat transaksi. Mendukung pagination dan filtering.
*   **Query Params:** `?page=1&limit=20&type=EXPENSE&category_id=...`

---

### 4. Budgets

#### `POST /budgets`
Membuat batas anggaran untuk kategori tertentu.
*   **Request Body:**
    ```json
    {
      "category_id": "uuid-transport",
      "amount_limit": 800000,
      "month_year": "2026-08-01"
    }
    ```

---

### 5. AI Financial Assistant

#### `POST /ai/chat`
Berkomunikasi dengan AI (Chatbot). Context transaksi pengguna otomatis disisipkan di sisi backend (RAG Pattern).
*   **Request Body:**
    ```json
    {
      "message": "Berapa sisa budget makan saya bulan ini, dan apakah saya masih bisa ngopi di kafe hari ini?"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "reply": "Sisa budget makan Anda bulan ini adalah Rp350.000. Mengingat tren pengeluaran harian Anda sebesar Rp50.000/hari, Anda masih bisa ngopi asalkan tidak lebih dari Rp30.000 hari ini agar aman sampai akhir bulan."
      }
    }
    ```

#### `POST /ai/analyze-receipt` (Multipart Form-Data)
Mengunggah struk/bukti bayar agar dibaca oleh AI (OCR) dan dikategorikan otomatis.
*   **Payload:** `file` (image/jpeg, image/png, application/pdf)
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "suggested_amount": 125000,
        "suggested_category_id": "uuid-shopping",
        "description": "Belanja Kebutuhan Harian"
      }
    }
    ```
