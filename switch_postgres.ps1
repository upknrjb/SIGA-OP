# Periksa apakah dijalankan sebagai Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Harap jalankan script ini di PowerShell yang dibuka sebagai Administrator (Run as Administrator)!"
    Exit
}

Write-Host "1. Menghentikan layanan PostgreSQL 16..." -ForegroundColor Yellow
Stop-Service -Name "postgresql-x64-16" -Force -ErrorAction SilentlyContinue

Write-Host "2. Mengubah tipe startup PostgreSQL 16 menjadi Manual (agar tidak bentrok saat komputer dinyalakan)..." -ForegroundColor Yellow
Set-Service -Name "postgresql-x64-16" -StartupType Manual -ErrorAction SilentlyContinue

Write-Host "3. Mengubah tipe startup PostgreSQL 18 menjadi Otomatis..." -ForegroundColor Yellow
Set-Service -Name "postgresql-x64-18" -StartupType Automatic -ErrorAction SilentlyContinue

Write-Host "4. Memulai layanan PostgreSQL 18 yang memiliki ekstensi PostGIS..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue

Write-Host "Selesai! Sekarang PostgreSQL 18 telah aktif pada port 5432." -ForegroundColor Green
