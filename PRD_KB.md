# PRD Revision — Keuangan Bersama

## Simplified Role & Permission Model

### 1. Role

Keuangan Bersama hanya memiliki **2 role**:

```text
OWNER
MEMBER
```

Tidak ada:

```text
ADMIN
VIEWER
```

---

# 2. OWNER

Owner adalah user yang membuat Shared Finance.

Owner memiliki kontrol penuh terhadap Shared Finance.

### Permission

```text
VIEW
CREATE_TRANSACTION
EDIT_OWN_TRANSACTION
EDIT_ANY_TRANSACTION
DELETE_OWN_TRANSACTION
DELETE_ANY_TRANSACTION

MANAGE_MEMBERS
CHANGE_MEMBER_ROLE
MANAGE_ACCOUNTS
MANAGE_SETTINGS

VIEW_REPORT
EXPORT_REPORT

ARCHIVE_SHARED_FINANCE
DELETE_SHARED_FINANCE
TRANSFER_OWNERSHIP
```

---

# 3. MEMBER

Member adalah user yang bergabung ke Shared Finance melalui invitation/QR Code.

### Permission

```text
VIEW
CREATE_TRANSACTION
EDIT_OWN_TRANSACTION
DELETE_OWN_TRANSACTION

VIEW_REPORT
```

Member tidak dapat:

```text
CHANGE_MEMBER_ROLE
REMOVE_OTHER_MEMBER
MANAGE_SETTINGS
DELETE_SHARED_FINANCE
ARCHIVE_SHARED_FINANCE
TRANSFER_OWNERSHIP
EDIT_OTHER_MEMBER_TRANSACTION
DELETE_OTHER_MEMBER_TRANSACTION
```

---

# 4. Permission Matrix

| Action                 | OWNER | MEMBER |
| ---------------------- | ----: | -----: |
| View Shared Finance    |     ✓ |      ✓ |
| View Transactions      |     ✓ |      ✓ |
| Create Transaction     |     ✓ |      ✓ |
| Edit Own Transaction   |     ✓ |      ✓ |
| Edit Any Transaction   |     ✓ |      ✕ |
| Delete Own Transaction |     ✓ |      ✓ |
| Delete Any Transaction |     ✓ |      ✕ |
| Manage Members         |     ✓ |      ✕ |
| Change Member Role     |     ✓ |      ✕ |
| Remove Member          |     ✓ |      ✕ |
| Manage Accounts        |     ✓ |      ✕ |
| Manage Settings        |     ✓ |      ✕ |
| View Reports           |     ✓ |      ✓ |
| Export Reports         |     ✓ |      ✕ |
| Archive Shared Finance |     ✓ |      ✕ |
| Delete Shared Finance  |     ✓ |      ✕ |
| Transfer Ownership     |     ✓ |      ✕ |

---

# 5. Database Role

Field:

```sql
role VARCHAR(20) NOT NULL DEFAULT 'MEMBER'
```

Allowed values:

```text
OWNER
MEMBER
```

Recommended database constraint:

```sql
CHECK (role IN ('OWNER', 'MEMBER'))
```

---

# 6. Member Table

```sql
CREATE TABLE shared_finance_members (
    id UUID PRIMARY KEY,

    shared_finance_id UUID NOT NULL,

    user_id UUID NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    joined_at TIMESTAMP NOT NULL,

    left_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL,

    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT chk_shared_finance_member_role
        CHECK (role IN ('OWNER', 'MEMBER')),

    CONSTRAINT uq_shared_finance_member
        UNIQUE(shared_finance_id, user_id)
);
```

---

# 7. Owner Rules

Setiap Shared Finance harus memiliki **tepat satu Owner aktif**.

Saat Shared Finance dibuat:

```text
Create Shared Finance
        ↓
Create Owner Membership
        ↓
role = OWNER
        ↓
status = ACTIVE
```

Owner tidak boleh:

* dihapus sebagai member secara langsung
* memiliki role MEMBER tanpa transfer ownership
* memiliki lebih dari satu membership pada Shared Finance yang sama

---

# 8. Member Join Flow

User yang melakukan scan QR:

```text
Scan QR
   ↓
Validate Invitation
   ↓
Preview Shared Finance
   ↓
Join
   ↓
Create Membership
   ↓
role = MEMBER
   ↓
status = ACTIVE
```

Tidak ada pilihan role saat join.

User selalu masuk sebagai:

```text
MEMBER
```

---

# 9. Member Management

Owner melihat:

```text
Members

┌────────────────────────────┐
│ Fetra                      │
│ OWNER                      │
│ Owner                      │
├────────────────────────────┤
│ Nelly                      │
│ MEMBER                     │
│ Member                     │
└────────────────────────────┘
```

Action untuk Owner:

```text
Member
   ↓
Member Detail
   ↓
Remove Member
```

Untuk MVP, Owner **tidak perlu mengubah role Member menjadi Owner** melalui edit role.

Perubahan ownership menggunakan flow khusus:

```text
Transfer Ownership
```

---

# 10. Transfer Ownership

Jika diperlukan:

```text
Owner
 ↓
Members
 ↓
Select Member
 ↓
Transfer Ownership
 ↓
Confirmation
 ↓
Old Owner = MEMBER
New Owner = OWNER
```

Operasi harus dilakukan dalam **database transaction**.

Contoh:

```text
BEFORE

Fetra  = OWNER
Nelly  = MEMBER


AFTER

Fetra  = MEMBER
Nelly  = OWNER
```

Harus dipastikan tidak pernah terjadi kondisi:

```text
0 OWNER
```

atau:

```text
2 OWNER
```

---

# 11. Authorization

Backend hanya perlu melakukan evaluasi:

```text
OWNER
atau
MEMBER
```

Flow:

```text
Authenticated User
        ↓
Shared Finance Membership
        ↓
Is Active?
        ↓
Role
   ┌────┴────┐
OWNER      MEMBER
   │          │
Full       Limited
Access     Access
```

---

# 12. Simplified Authorization Logic

Conceptual:

```typescript
if (!membership) {
    throw ForbiddenError();
}

if (membership.status !== 'ACTIVE') {
    throw ForbiddenError();
}

if (requiredPermission === 'MANAGE_MEMBERS') {
    if (membership.role !== 'OWNER') {
        throw ForbiddenError();
    }
}
```

Untuk Member:

```text
VIEW → ALLOW
CREATE_TRANSACTION → ALLOW
EDIT_OWN_TRANSACTION → ALLOW
DELETE_OWN_TRANSACTION → ALLOW
VIEW_REPORT → ALLOW
```

Selain itu → `FORBIDDEN`.

---

# 13. Frontend Role Handling

React Native cukup mengenali:

```typescript
type SharedFinanceRole =
    | 'OWNER'
    | 'MEMBER';
```

Contoh:

```typescript
const isOwner = member.role === 'OWNER';
const isMember = member.role === 'MEMBER';
```

UI:

### Owner

Tampilkan:

```text
⋮
├── Manage Members
├── Manage Accounts
├── Settings
├── Transfer Ownership
└── Archive
```

### Member

Tidak menampilkan menu management.

---

# 14. Member Detail UI

### Owner melihat Member

```text
┌──────────────────────────┐
│ Nelly                    │
│ Member                   │
│                          │
│ Joined                   │
│ 29 Aug 2026              │
│                          │
│ [ Remove Member ]        │
└──────────────────────────┘
```

### Owner melihat dirinya sendiri

```text
┌──────────────────────────┐
│ Fetra                    │
│ Owner                    │
│                          │
│ [ Transfer Ownership ]   │
└──────────────────────────┘
```

---

# 15. API Changes

Tidak diperlukan endpoint generic:

```http
PUT /shared-finances/{id}/members/{memberId}
```

untuk mengubah role pada MVP.

Gunakan endpoint khusus:

```http
POST /shared-finances/{id}/transfer-ownership
```

Request:

```json
{
  "new_owner_user_id": "uuid"
}
```

Backend:

```text
Validate current user = OWNER
        ↓
Validate target = ACTIVE MEMBER
        ↓
Begin transaction
        ↓
Current OWNER → MEMBER
        ↓
Target MEMBER → OWNER
        ↓
Activity Log
        ↓
Commit
```

---

# 16. API Member

### List

```http
GET /shared-finances/{id}/members
```

### Remove

```http
DELETE /shared-finances/{id}/members/{memberId}
```

### Transfer Ownership

```http
POST /shared-finances/{id}/transfer-ownership
```

Tidak ada:

```http
PUT /members/{memberId}/role
```

untuk MVP.

---

# 17. Activity Log

Role-related activities:

```text
MEMBER_JOINED
MEMBER_REMOVED
OWNERSHIP_TRANSFERRED
```

Contoh:

```text
Fetra
transferred ownership
to Nelly
```

---

# 18. Updated Domain Model

```text
Shared Finance
      │
      ├── OWNER
      │     └── exactly 1 active owner
      │
      └── MEMBER
            ├── Member A
            ├── Member B
            └── Member C
```

Contoh:

```text
Keuangan Keluarga

Fetra
OWNER

Nelly
MEMBER
```

atau:

```text
Trip Bali

Fetra
OWNER

Nelly
MEMBER

Andi
MEMBER

Budi
MEMBER
```

---

# 19. Updated Core Principle

Untuk MVP:

> **One Shared Finance = One Owner + Multiple Members**

Setiap member mempunyai akses berdasarkan role:

```text
OWNER
→ Full management

MEMBER
→ Financial collaboration
```

Role dibuat sengaja sederhana agar UX mudah dipahami dan implementasi backend lebih mudah dipelihara.

Jika pada masa depan diperlukan granular permission, permission system dapat ditambahkan tanpa mengubah konsep dasar membership.

---

# 20. Claude Code Requirement

Claude Code MUST update seluruh implementasi Shared Finance agar hanya menggunakan:

```typescript
'OWNER' | 'MEMBER'
```

Search repository untuk seluruh referensi:

```text
ADMIN
VIEWER
```

yang berkaitan dengan Shared Finance dan hapus/refactor hanya bagian yang dibuat untuk fitur ini.

Jangan menghapus `ADMIN` atau `VIEWER` jika role tersebut digunakan oleh fitur lain di aplikasi.

Pastikan tidak ada Shared Finance logic yang masih mengasumsikan:

```text
ADMIN
VIEWER
```

sebagai role yang valid.

Final role model:

```text
OWNER
MEMBER
```

---

# 21. Final MVP Flow

```text
USER A
  │
  ▼
Create Shared Finance
  │
  ▼
OWNER
  │
  ├──────────────┐
  │              │
  ▼              ▼
Generate QR    Manage Finance
  │
  ▼
USER B
  │
  ▼
Scan QR
  │
  ▼
Preview
  │
  ▼
Join
  │
  ▼
MEMBER
  │
  ▼
Shared Transactions
  │
  ├── Income
  ├── Expense
  ├── Transfer
  ├── Split
  └── Settlement
```

**Tidak ada role ADMIN atau VIEWER pada fitur Keuangan Bersama MVP.**
