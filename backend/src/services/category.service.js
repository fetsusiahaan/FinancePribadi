import { categoryRepository } from "../repositories/category.repository.js";
import { prisma } from "../config/db.js";

// Cache in-memory untuk KATEGORI GLOBAL saja (categories.user_id IS NULL).
//
// Isinya 17 baris hasil seed yang praktis tidak pernah berubah, tapi dibaca di
// hampir tiap layar. Ini kandidat cache paling jelas di aplikasi ini.
//
// Tiga batasan yang membuatnya aman:
// 1. HANYA yang global. Kategori pribadi (user_id != null) tidak pernah masuk
//    sini -- nilainya kecil dan risikonya bocor antar-user.
// 2. Proses tunggal, jadi Map biasa sudah cukup; tidak perlu Redis.
// 3. Bertenggat. Kalau baris global diubah langsung di DB (mis. lewat SQL
//    manual), perubahannya tetap masuk paling lama setelah TTL.
const GLOBAL_TTL_MS = 10 * 60 * 1000;
let globalCache = null; // { at: number, rows: Category[] }

async function getGlobalCategories() {
  const now = Date.now();
  if (globalCache && now - globalCache.at < GLOBAL_TTL_MS) return globalCache.rows;

  const rows = await prisma.category.findMany({
    where: { userId: null },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  globalCache = { at: now, rows };
  return rows;
}

/** Dipanggil kalau kelak ada jalur yang mengubah kategori global (admin/seed). */
export function invalidateGlobalCategoryCache() {
  globalCache = null;
}

function toDto(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    is_default: category.userId === null,
  };
}

// Urutan HARUS sama persis dengan orderBy di repository ([type asc, name asc]):
// hasil gabungan cache + query pribadi tidak boleh terlihat berbeda dari
// sebelumnya di sisi client.
function byTypeThenName(a, b) {
  if (a.type !== b.type) return a.type < b.type ? -1 : 1;
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

export async function list(userId, type) {
  // Dipecah jadi dua: yang global dari cache, yang pribadi selalu dari DB.
  // Query pribadi jauh lebih kecil (mayoritas user punya 0 kategori sendiri),
  // jadi yang hilang dari DB adalah bagian yang justru paling sering dibaca.
  const [globals, own] = await Promise.all([
    getGlobalCategories(),
    categoryRepository.listOwn(userId, type),
  ]);

  const filteredGlobals = type ? globals.filter((c) => c.type === type) : globals;
  return [...filteredGlobals, ...own].sort(byTypeThenName).map(toDto);
}

export async function create(userId, { name, type, icon }) {
  // Tidak menyentuh cache: yang dibuat di sini selalu punya userId, jadi
  // menurut definisi bukan kategori global.
  const category = await categoryRepository.create({ userId, name, type, icon: icon || null });
  return toDto(category);
}

/** Dipakai modul Keuangan Bersama -- hanya kategori global, lewat cache yang sama. */
export async function listGlobalCached(type) {
  const rows = await getGlobalCategories();
  return type ? rows.filter((c) => c.type === type) : rows;
}
