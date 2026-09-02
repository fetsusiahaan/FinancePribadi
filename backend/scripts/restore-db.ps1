<#
.SYNOPSIS
  Restore dump hasil backup-db.ps1 ke database STANDBY.

.DESCRIPTION
  Pasangan dari backup-db.ps1. Ini yang mengisi database cadangan supaya
  failover berarti pulih, bukan pindah ke database kosong.

  Pasangan yang dipakai di project ini: Supabase (aktif) <-> Neon (standby).

  PERINGATAN: skrip ini MENGHAPUS SELURUH ISI schema public di database
  tujuan sebelum restore. Itu memang perlu -- restore ke database yang sudah
  berisi tabel akan gagal di CREATE TABLE -- tapi artinya salah memasukkan URL
  akan menghancurkan database yang salah.

  Tiga pengaman:
  1. -TargetUrl wajib diisi eksplisit. Tidak ada default, tidak membaca .env.
  2. Menolak jalan kalau URL tujuan sama dengan DATABASE_URL yang aktif.
  3. Butuh -Confirm. Tanpa itu cuma menampilkan rencana (dry run).

.PARAMETER TargetUrl
  Connection string database STANDBY. Bukan yang sedang dipakai produksi.

.PARAMETER DumpFile
  File .sql. Default: dump terbaru di _migration\.

.PARAMETER Confirm
  Tanpa ini, skrip berhenti setelah menampilkan rencana.

.EXAMPLE
  # 1. Lihat rencananya dulu
  .\restore-db.ps1 -TargetUrl "postgresql://..."
  # 2. Baru jalankan
  .\restore-db.ps1 -TargetUrl "postgresql://..." -Confirm
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$TargetUrl,
  [string]$DumpFile,
  [switch]$Confirm
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile     = Join-Path $projectRoot 'backend\.env'
$migDir      = Join-Path $projectRoot '_migration'

function Get-DbHost([string]$url) {
  if ($url -match '@([^/:?]+)') { return $Matches[1] }
  return '(tidak terbaca)'
}

# --- Pengaman: jangan timpa database yang sedang aktif ----------------------
# Perbandingan berbasis host, bukan string penuh: URL yang sama bisa ditulis
# berbeda (query param, urutan, sslmode) dan perbandingan string mentah akan
# lolos padahal menunjuk database yang sama.
if (Test-Path $envFile) {
  $envLines = Get-Content $envFile

  function Get-EnvValue([string]$key) {
    $line = $envLines |
      Where-Object { $_ -notmatch '^\s*#' -and $_ -match ('^\s*' + [regex]::Escape($key) + '\s*=') } |
      Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -replace ('^\s*' + [regex]::Escape($key) + '\s*=\s*'), '').Trim().Trim('"').Trim("'")
  }

  $slot = Get-EnvValue 'DATABASE_ACTIVE'
  if (-not $slot) { $slot = '1' }

  $activeUrl = Get-EnvValue "DATABASE_URL_$slot"
  if ($activeUrl -and (Get-DbHost $activeUrl) -eq (Get-DbHost $TargetUrl)) {
    throw "DITOLAK: -TargetUrl menunjuk host yang SAMA dengan slot AKTIF $slot ($(Get-DbHost $TargetUrl)). Restore akan menghapus database produksi."
  }

  # Slot non-aktif juga diperiksa, tapi cuma sebagai peringatan. Menimpa standby
  # memang tujuan skrip ini -- yang tidak boleh terjadi diam-diam adalah menimpa
  # standby yang salah, mis. mengira sedang mengisi slot 3 padahal URL-nya slot 2.
  foreach ($n in @('1', '2', '3')) {
    if ($n -eq $slot) { continue }
    $u = Get-EnvValue "DATABASE_URL_$n"
    if ($u -and (Get-DbHost $u) -eq (Get-DbHost $TargetUrl)) {
      Write-Host "Tujuan cocok dengan DATABASE_URL_$n (slot standby)." -ForegroundColor Cyan
    }
  }
}

# --- Pilih dump -------------------------------------------------------------
if (-not $DumpFile) {
  $latest = Get-ChildItem -Path $migDir -Filter 'backup-*.sql' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw "Tidak ada backup-*.sql di $migDir. Jalankan backup-db.ps1 dulu." }
  $DumpFile = $latest.FullName
}
if (-not (Test-Path $DumpFile)) { throw "Dump tidak ditemukan: $DumpFile" }

# --- Verifikasi ulang isi dump ---------------------------------------------
# backup-db.ps1 sudah memeriksa ini saat membuat, tapi diperiksa LAGI di sini:
# file bisa terpotong sejak itu, dan restore adalah titik terakhir sebelum
# database standby dianggap layak dipakai failover.
$required = @(
  'chk_shared_finance_member_role',
  'chk_shared_finance_member_status',
  'chk_shared_transaction_amount_positive',
  'uq_shared_finance_single_active_owner'
)
$missing = @($required | Where-Object { -not (Select-String -Path $DumpFile -Pattern $_ -Quiet) })
if ($missing.Count -gt 0) {
  throw "Dump tidak lengkap, objek hilang: $($missing -join ', '). JANGAN dipakai."
}

$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
  $fallback = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
  if (Test-Path $fallback) { $psql = $fallback }
  else { throw 'psql tidak ada di PATH. Pasang PostgreSQL client 17.' }
}

$sizeMb = [math]::Round((Get-Item $DumpFile).Length / 1MB, 2)

Write-Host ''
Write-Host 'RENCANA RESTORE' -ForegroundColor Yellow
Write-Host "  Dump    : $DumpFile ($sizeMb MB)"
Write-Host "  Tujuan  : $(Get-DbHost $TargetUrl)"
Write-Host ''
Write-Host '  Akan menghapus SELURUH ISI schema public di database tujuan,' -ForegroundColor Yellow
Write-Host '  lalu memuat ulang dari dump.' -ForegroundColor Yellow
Write-Host ''

if (-not $Confirm) {
  Write-Host 'Dry run. Tambahkan -Confirm untuk benar-benar menjalankan.' -ForegroundColor Cyan
  exit 0
}

# --- Kosongkan tujuan -------------------------------------------------------
# Dump dari pg_dump --schema=public memuat CREATE SCHEMA "public" sendiri.
# Kalau skrip ini ikut membuatnya, restore mati di baris itu ("schema public
# already exists") setelah DROP terlanjur jalan. Jadi schema-nya dibuat di sini
# HANYA kalau dump tidak membuatnya.
$dumpCreatesSchema = Select-String -Path $DumpFile -Pattern '^CREATE SCHEMA "?public"?;' -Quiet

Write-Host 'Mengosongkan schema public di tujuan...'
$dropSql = if ($dumpCreatesSchema) {
  'DROP SCHEMA IF EXISTS public CASCADE;'
} else {
  'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'
}
& $psql $TargetUrl -v ON_ERROR_STOP=1 -c $dropSql
if ($LASTEXITCODE -ne 0) { throw "Gagal mengosongkan schema (exit $LASTEXITCODE)." }
$schemaDropped = $true

# --- Restore ----------------------------------------------------------------
# --single-transaction + ON_ERROR_STOP=1: commit seluruhnya atau tidak sama
# sekali. Gagal di tengah tidak meninggalkan standby setengah jadi -- dan
# standby setengah jadi lebih berbahaya daripada tidak ada standby, karena
# terlihat siap padahal tidak.
$logFile = Join-Path $migDir "restore-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
Write-Host 'Restore berjalan...'
& $psql $TargetUrl -v ON_ERROR_STOP=1 --single-transaction -f $DumpFile -L $logFile
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Restore GAGAL (exit $LASTEXITCODE). Log: $logFile"
  Write-Warning '--single-transaction: tidak ada isi dump yang ter-commit sebagian.'
  if ($schemaDropped) {
    # Jangan dikaburkan: DROP SCHEMA berjalan SEBELUM transaksi restore dan
    # tidak ikut ter-rollback. Apa pun yang tadinya ada di schema public tujuan
    # SUDAH HILANG. Mengatakan "tujuan tidak berubah" di sini pernah salah dan
    # menyesatkan: menyarankan tidak ada yang perlu dipulihkan padahal ada.
    Write-Warning "TAPI schema public di tujuan ($(Get-DbHost $TargetUrl)) SUDAH TERLANJUR DIKOSONGKAN."
    Write-Warning 'Isi lamanya hilang dan tujuan sekarang kosong. Standby TIDAK siap.'
  }
  exit 1
}

# --- Verifikasi hasil -------------------------------------------------------
Write-Host ''
Write-Host 'Verifikasi hasil di database tujuan:'

$tables = & $psql $TargetUrl -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
$checks = & $psql $TargetUrl -t -A -c "SELECT count(*) FROM pg_constraint WHERE conname IN ('chk_shared_finance_member_role','chk_shared_finance_member_status','chk_shared_transaction_amount_positive')"
$uq     = & $psql $TargetUrl -t -A -c "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname='uq_shared_finance_single_active_owner'"
$mig    = & $psql $TargetUrl -t -A -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL"
$users  = & $psql $TargetUrl -t -A -c "SELECT count(*) FROM users"

Write-Host "  tabel                : $tables (harus 14)"
Write-Host "  CHECK constraint     : $checks (harus 3)"
Write-Host "  partial unique index : $uq (harus 1)"
Write-Host "  migrasi selesai      : $mig (harus 11)"
Write-Host "  baris users          : $users"

if ("$checks" -ne '3' -or "$uq" -ne '1') {
  Write-Warning 'Constraint tulisan-tangan TIDAK lengkap di tujuan. Standby tidak layak dipakai.'
  exit 1
}

Write-Host ''
Write-Host 'Standby siap.' -ForegroundColor Green
Write-Host 'Prosedur failover: backend\FAILOVER.md' -ForegroundColor Green
