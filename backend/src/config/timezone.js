/**
 * Waktu Jakarta (WIB) di sisi database.
 *
 * KEPUTUSAN: kolom waktu di DB berisi jam Jakarta, bukan UTC. Alasannya
 * operasional -- membuka tabel di Supabase Studio atau psql harus langsung
 * terbaca sebagai jam dinding yang sama dengan yang dilihat user, tanpa
 * menghitung di kepala.
 *
 * KENAPA PERGESERANNYA DIKERJAKAN DI SINI, BUKAN DI POSTGRES:
 *
 * Cara yang lebih rapi adalah menyetel TimeZone sesi database ke Asia/Jakarta,
 * lalu membiarkan Postgres yang mengurus. Itu DICOBA dan TIDAK BISA: Supabase
 * memakai Supavisor sebagai pooler, dan `?options=-c timezone=Asia/Jakarta` di
 * connection string diabaikan diam-diam -- `current_setting('TimeZone')` tetap
 * mengembalikan `UTC`. Bukan error, jadi kalau tidak diuji akan terlihat
 * berhasil padahal tidak. `SET LOCAL TIME ZONE` per transaksi berhasil, tapi
 * hanya mencakup blok transaksi; mayoritas query di aplikasi ini di luar itu.
 *
 * Maka pergeserannya dikerjakan di lapisan Prisma, dan HARUS SIMETRIS:
 *
 *   tulis : Date UTC dari Node  ->  +7 jam  ->  disimpan sebagai jam WIB
 *   baca  : jam WIB dari kolom  ->  -7 jam  ->  Date UTC yang benar
 *
 * Simetri itu bukan kerapian, melainkan syarat kebenaran. Kolomnya bertipe
 * `timestamp without time zone` -- tidak menyimpan jejak zona sama sekali,
 * sehingga Prisma membaca "14:00" tersimpan sebagai 14:00 UTC. Tanpa
 * pergeseran balik saat baca, setiap nilai keluar 7 jam terlalu maju dan
 * layar menampilkan 21:00 untuk kejadian pukul 14:00. Kalau salah satu arah
 * dihapus, seluruh jam di aplikasi salah 7 jam -- diverifikasi, bukan dugaan.
 *
 * YANG SENGAJA TIDAK DIGESER: kolom `@db.Date` (DATE_ONLY_FIELDS). Kolom itu
 * tidak menyimpan jam sama sekali. Nilainya masuk dari user sebagai string
 * "YYYY-MM-DD", disimpan sebagai tengah malam UTC, dan dibaca balik dengan
 * .toISOString().slice(0,10) -- sudah simetris apa adanya. Menggesernya +7 jam
 * membuat tengah malam menjadi 07:00, dan .slice(0,10) yang membaca balik
 * tetap memotong bagian jamnya, sehingga tanggalnya bergeser satu hari untuk
 * separuh kasus. Jadi kolom ini dibiarkan persis seperti sebelumnya.
 */

// Offset WIB tetap +7. Indonesia tidak memakai DST dan tidak pernah
// memakainya, jadi angka tetap di sini benar sepanjang tahun -- tidak perlu
// pustaka zona waktu, dan tidak ada tanggal peralihan yang bisa meleset.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Field bertipe `@db.Date` per model, diambil dari prisma/schema.prisma.
 *
 * Ditulis manual, BUKAN dibaca dari Prisma.dmmf: pada @prisma/client 5.22
 * `field.nativeType` bernilai null di runtime, sehingga @db.Date tidak bisa
 * dibedakan dari timestamp biasa lewat DMMF. Sudah dicoba dan mengembalikan
 * daftar kosong -- yang berarti semua kolom akan ikut digeser, termasuk yang
 * seharusnya tidak.
 *
 * KONSEKUENSI: daftar ini harus ikut diperbarui setiap kali ada field
 * `@db.Date` baru di schema. Kalau terlewat, tanggal transaksi bergeser satu
 * hari untuk sebagian kasus tanpa error apa pun. Uji di test/timezone.test.js
 * membandingkan daftar ini dengan isi schema.prisma dan gagal kalau tidak
 * cocok, supaya kelalaian itu ketahuan saat build, bukan dari laporan user.
 */
export const DATE_ONLY_FIELDS = {
  Transaction: ["date"],
  Budget: ["monthYear"],
  SavingsGoal: ["deadline"],
  Debt: ["dueDate"],
  SharedTransaction: ["date"],
};

/**
 * Field yang nilainya TIDAK diisi oleh kode aplikasi: `@default(now())` diisi
 * Postgres lewat DEFAULT CURRENT_TIMESTAMP, dan `@updatedAt` diisi query
 * engine Prisma sendiri.
 *
 * Keduanya adalah lubang di extension ini, dan lubangnya berbahaya karena
 * SETENGAH bekerja: nilainya tidak pernah muncul di `args` sehingga tidak ikut
 * digeser saat menulis, TAPI hasil bacanya tetap digeser -7 jam seperti kolom
 * lain. Hasilnya kolom-kolom ini -- termasuk seluruh created_at -- akan
 * terbaca 7 jam terlalu mundur, tanpa error apa pun. Sudah diverifikasi:
 * `"createdAt" in args.data` bernilai false pada operasi create.
 *
 * Jalan keluarnya: nilainya diisikan sendiri di sini sebelum args digeser,
 * sehingga DEFAULT di database tidak pernah terpakai dan `@updatedAt` selalu
 * kalah dari nilai eksplisit. Setelah itu jalur tulis dan jalur baca kembali
 * simetris.
 *
 * Alternatif yang ditolak: mengubah DEFAULT-nya di database menjadi
 * `CURRENT_TIMESTAMP + interval '7 hours'`. Itu menaruh separuh aturan zona
 * waktu di migrasi dan separuh lagi di sini, dan yang di migrasi tidak
 * kelihatan saat membaca kode aplikasi.
 */
const NOW_FIELDS = {
  User: ["createdAt"],
  DeviceToken: ["lastSeenAt", "createdAt"],
  RefreshToken: ["createdAt"],
  ActivityLog: ["createdAt"],
  SharedFinance: ["createdAt"],
  SharedFinanceMember: ["joinedAt", "createdAt"],
  SharedFinanceInvitation: ["createdAt"],
  SharedTransaction: ["createdAt"],
  // startsAt di kedua model ini biasanya diisi eksplisit oleh setTier(), tapi
  // tetap didaftar: fillImplicit hanya mengisi yang undefined, jadi nilai
  // eksplisit tidak tersentuh sementara pemanggil lain tetap terlindungi.
  UserPlan: ["startsAt"],
  PlanGrant: ["startsAt", "createdAt"],
};

const UPDATED_AT_FIELDS = {
  User: ["updatedAt"],
  SharedFinance: ["updatedAt"],
  SharedFinanceMember: ["updatedAt"],
  SharedTransaction: ["updatedAt"],
  UserPlan: ["updatedAt"],
};

const isDate = (v) => v instanceof Date && !Number.isNaN(v.getTime());

const shift = (value, ms) => new Date(value.getTime() + ms);

/**
 * Geser setiap Date di dalam struktur, kecuali field yang terdaftar sebagai
 * date-only untuk model bersangkutan.
 *
 * Rekursif karena Date bisa berada di kedalaman mana pun: nilai kolom biasa,
 * di dalam operator filter (`{ gte: ... }`), di dalam `AND`/`OR` yang berupa
 * array, atau di dalam relasi yang di-include.
 *
 * `skip` diteruskan apa adanya ke kedalaman berikut, bukan dihitung ulang per
 * level. Nama field date-only di project ini (date, monthYear, deadline,
 * dueDate) tidak dipakai sebagai kolom timestamp di model mana pun -- sudah
 * diperiksa, tidak ada yang bentrok -- jadi menyamakan cakupannya aman dan
 * membuat filter bersarang ikut terlindungi.
 */
function walk(value, ms, skip) {
  if (value === null || value === undefined) return value;
  if (isDate(value)) return shift(value, ms);

  // Date tidak pernah muncul di dalam tipe khusus ini, dan menelusurinya
  // hanya menghabiskan waktu -- Buffer bisa berukuran megabyte.
  if (Buffer.isBuffer(value) || value instanceof RegExp) return value;

  if (Array.isArray(value)) return value.map((v) => walk(v, ms, skip));

  // Hanya object polos yang ditelusuri. Decimal.js (dipakai kolom amount),
  // instance kelas, dan objek eksotis lain dibiarkan utuh: menyalinnya lewat
  // spread akan menghilangkan prototipe dan merusak nilainya.
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = skip.has(key) ? val : walk(val, ms, skip);
  }
  return out;
}

/**
 * Prisma extension yang memasang pergeseran dua arah.
 *
 * Dipasang lewat $extends, bukan middleware ($use): middleware sudah usang di
 * Prisma 5 dan tidak melihat hasil query, hanya argumennya -- padahal jalur
 * baca justru yang paling menentukan di sini.
 *
 * CATATAN PENTING: $queryRaw dan $executeRaw TIDAK melewati extension ini.
 * Lima pemakaian raw ada di systemHealth.service.js dan semuanya menghitung
 * jumlah baris / memeriksa koneksi, tidak membaca maupun menulis kolom waktu,
 * jadi tidak terpengaruh. Raw SQL baru yang menyentuh kolom waktu harus
 * mengurus pergeserannya sendiri.
 */
// Operasi yang membuat baris baru. createMany dipisah karena `data`-nya bisa
// berupa array, dan tiap elemen perlu diisi sendiri.
const CREATE_OPS = new Set(["create", "createMany", "upsert"]);
const UPDATE_OPS = new Set(["update", "updateMany", "upsert"]);

// Isikan nilai yang biasanya diserahkan ke database/engine, HANYA kalau
// pemanggil belum menuliskannya sendiri. Nilai eksplisit dari kode aplikasi
// selalu menang -- kalau tidak, upsert yang sengaja menulis createdAt tertentu
// akan diam-diam ditimpa.
function fillImplicit(target, fields, now) {
  if (!target || typeof target !== "object") return target;
  if (Array.isArray(target)) return target.map((row) => fillImplicit(row, fields, now));
  const out = { ...target };
  for (const f of fields) {
    if (out[f] === undefined) out[f] = now;
  }
  return out;
}

export function withJakartaTime(client) {
  return client.$extends({
    name: "jakarta-time",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const skip = new Set(DATE_ONLY_FIELDS[model] ?? []);

          // Satu `now` untuk seluruh operasi: createdAt dan updatedAt pada
          // baris yang sama harus persis sama, bukan berbeda satu milidetik.
          const now = new Date();
          let next = args;

          const nowFields = NOW_FIELDS[model] ?? [];
          const updFields = UPDATED_AT_FIELDS[model] ?? [];

          if (nowFields.length || updFields.length) {
            // upsert punya dua sisi: `create` mendapat keduanya, `update`
            // hanya updatedAt -- persis seperti perilaku Prisma sendiri.
            if (operation === "upsert") {
              next = {
                ...next,
                create: fillImplicit(next?.create, [...nowFields, ...updFields], now),
                update: fillImplicit(next?.update, updFields, now),
              };
            } else if (CREATE_OPS.has(operation)) {
              next = { ...next, data: fillImplicit(next?.data, [...nowFields, ...updFields], now) };
            } else if (UPDATE_OPS.has(operation)) {
              next = { ...next, data: fillImplicit(next?.data, updFields, now) };
            }
          }

          const result = await query(walk(next, WIB_OFFSET_MS, skip));
          return walk(result, -WIB_OFFSET_MS, skip);
        },
      },
    },
  });
}

/**
 * Waktu sekarang dalam bentuk yang siap ditulis ke kolom. Dipakai oleh SQL
 * mentah dan oleh `DEFAULT CURRENT_TIMESTAMP` yang tidak bisa dicegat
 * extension -- lihat catatan di migrasi.
 */
export const nowForDb = () => new Date(Date.now() + WIB_OFFSET_MS);

export { WIB_OFFSET_MS };
