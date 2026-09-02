<#
.SYNOPSIS
  Dump database aktif (DATABASE_URL di backend\.env) ke file .sql bertanggal.

.DESCRIPTION
  Ini bagian A1 dari rencana anti-down. Tanpa dump terjadwal, database cadangan
  cuma alamat kosong -- failover ke sana berarti pindah ke nol, bukan pulih.

  Hasilnya bisa direstore ke provider lain (Neon <-> Supabase) sebagai standby
  dingin. Lihat backend\FAILOVER.md untuk prosedur lengkapnya.

  KONSEKUENSI YANG HARUS DIPEGANG JUJUR: tidak ada replikasi antar-provider di
  free tier. Failover berarti kehilangan seluruh data yang masuk SETELAH dump
  terakhir. Frekuensi dump = batas atas kehilangan data.

.PARAMETER OutDir
  Folder tujuan. Default: _migration\ di root project (sudah di-.gitignore).

.PARAMETER Keep
  Jumlah dump terbaru yang dipertahankan. Sisanya dihapus. Default 7.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File backend\scripts\backup-db.ps1
#>

[CmdletBinding()]
param(
  [string]$OutDir,
  [int]$Keep = 7
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile     = Join-Path $projectRoot 'backend\.env'
if (-not $OutDir) { $OutDir = Join-Path $projectRoot '_migration' }

if (-not (Test-Path $envFile)) { throw "Tidak menemukan $envFile" }

# --- Ambil URL slot aktif dari .env -----------------------------------------
# Dibaca lewat DATABASE_ACTIVE + DATABASE_URL_<n>, sama seperti yang dilakukan
# src/config/env.js. BUKAN lewat baris DATABASE_URL biasa: baris itu masih ada
# untuk Prisma CLI dan bisa tertinggal menunjuk slot lama setelah failover.
# Mem-backup dari sana berarti mendump database yang tidak sedang dipakai --
# kegagalan yang senyap, karena filenya tetap terbentuk dan tetap lolos
# verifikasi constraint.
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
if ($slot -notin @('1', '2', '3')) { throw "DATABASE_ACTIVE='$slot' tidak valid (harus 1, 2, atau 3)." }

$dbUrl = Get-EnvValue "DATABASE_URL_$slot"
if (-not $dbUrl) { throw "DATABASE_ACTIVE=$slot tapi DATABASE_URL_$slot kosong di $envFile" }

# --- pg_dump ----------------------------------------------------------------
$pgDump = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
if (-not $pgDump) {
  $fallback = 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe'
  if (Test-Path $fallback) { $pgDump = $fallback }
  else { throw 'pg_dump tidak ada di PATH. Pasang PostgreSQL client 17 atau tambahkan bin-nya ke PATH.' }
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $OutDir "backup-$stamp.sql"

# Host saja yang dicetak, TIDAK PERNAH URL lengkapnya: di dalamnya ada password.
$dbHost = if ($dbUrl -match '@([^/:?]+)') { $Matches[1] } else { '(tidak terbaca)' }
Write-Host "Slot aktif    : $slot (DATABASE_ACTIVE)"
Write-Host "Dump dari host: $dbHost"
Write-Host "Tujuan        : $outFile"

# --file= WAJIB, jangan '> file'. PowerShell 5.1 menulis UTF-16LE dan psql
# menolak file hasil redirect saat restore.
#
# --schema=public   : jangan sentuh schema bawaan Supabase (auth, storage, ...)
# --no-owner/-privs : role provider asal tidak ada di provider tujuan
# --quote-all-...   : nama enum CamelCase ("CategoryType") aman dari case folding
& $pgDump $dbUrl `
  --schema=public `
  --no-owner `
  --no-privileges `
  --quote-all-identifiers `
  --format=plain `
  "--file=$outFile"

if ($LASTEXITCODE -ne 0) { throw "pg_dump gagal (exit $LASTEXITCODE)." }

# --- Verifikasi isi ---------------------------------------------------------
# Empat objek ini ditulis TANGAN di migration.sql dan tidak terlihat oleh
# introspeksi Prisma. Kalau hilang dari dump, kegagalannya senyap: transfer
# kepemilikan bisa menghasilkan dua OWNER aktif dan tidak ada yang tahu.
# Dump yang kehilangan salah satunya TIDAK boleh dipakai sebagai cadangan.
$required = @(
  'chk_shared_finance_member_role',
  'chk_shared_finance_member_status',
  'chk_shared_transaction_amount_positive',
  'uq_shared_finance_single_active_owner'
)

$missing = @()
foreach ($obj in $required) {
  if (-not (Select-String -Path $outFile -Pattern $obj -Quiet)) { $missing += $obj }
}
if ((Select-String -Path $outFile -Pattern 'CREATE TYPE' -Quiet) -eq $false) {
  $missing += 'CREATE TYPE (enum CategoryType/UserRole)'
}

$sizeMb = [math]::Round((Get-Item $outFile).Length / 1MB, 2)

if ($missing.Count -gt 0) {
  Write-Warning "Dump TIDAK LENGKAP. Objek hilang: $($missing -join ', ')"
  Write-Warning 'JANGAN pakai file ini sebagai cadangan.'
  exit 1
}

Write-Host "OK. $sizeMb MB, 4 constraint tulisan-tangan + enum lengkap."

# --- Rotasi -----------------------------------------------------------------
$old = Get-ChildItem -Path $OutDir -Filter 'backup-*.sql' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $Keep

foreach ($f in $old) {
  Remove-Item $f.FullName -Force
  Write-Host "Dump lama dihapus: $($f.Name)"
}
