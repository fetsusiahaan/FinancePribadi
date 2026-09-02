import { PrismaClient } from "@prisma/client";
// WAJIB diimpor sebelum PrismaClient dibuat: modul ini yang memilih salah satu
// dari DATABASE_URL_1/2/3 dan menimpakannya ke process.env.DATABASE_URL.
// Prisma membaca variabel itu saat konstruktor dipanggil, jadi urutan impor di
// sini bukan gaya penulisan -- membaliknya membuat Prisma menyambung ke nilai
// DATABASE_URL lama di .env, bukan slot yang dipilih.
import { env, activeDbHost } from "./env.js";

// Host saja, tanpa kredensial. Dicetak supaya saat failover tidak perlu menebak
// database mana yang sebenarnya tersambung -- kekeliruan itu pernah terjadi dan
// gejalanya membingungkan: .env terlihat benar, query jatuh ke database lain.
console.log(`[db] slot ${env.databaseSlot} -> ${activeDbHost()}`);

// `log` dinyalakan bukan buat verbositas: tanpa ini kegagalan koneksi Prisma
// (kuota provider habis, password salah, host tidak terjangkau) cuma muncul
// sebagai error di jalur request yang kebetulan lagi jalan. Dengan "warn" +
// "error", sebabnya tercetak di log proses walau tidak ada yang memanggil API.
// "query" SENGAJA tidak diikutkan -- volumenya membanjiri log dan bisa memuat
// nilai kolom.
export const prisma = new PrismaClient({ log: ["warn", "error"] });
