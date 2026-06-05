#!/bin/bash

# Hentikan script jika ada perintah yang gagal
set -e

# Kode warna untuk output terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}      START DEPLOYMENT: SOMERE APP       ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 1. Pull update terbaru dari Git
echo -e "\n${YELLOW}[1/6] Pulling code dari GitHub...${NC}"
git pull origin main

# 2. Install dependensi
echo -e "\n${YELLOW}[2/6] Memasang dependensi npm...${NC}"
npm install --include=dev

# 3. Generate Prisma Client
echo -e "\n${YELLOW}[3/6] Men-generate Prisma Client...${NC}"
npm run db:generate

# 4. Kompilasi & Build (Backend & Frontend)
echo -e "\n${YELLOW}[4/6] Melakukan build aplikasi...${NC}"
npm run build

# 5. Migrasi Skema Database (Production-Safe mode)
echo -e "\n${YELLOW}[5/6] Menjalankan migrasi database...${NC}"
cd backend
npx prisma migrate deploy
cd ..

# 6. Restart PM2 Process
echo -e "\n${YELLOW}[6/6] Menjalankan ulang backend PM2...${NC}"
if pm2 describe somere-backend-90001 > /dev/null 2>&1; then
    pm2 restart somere-backend-90001
else
    echo -e "${YELLOW}Proses PM2 'somere-backend-90001' tidak ditemukan, mencoba menjalankan baru...${NC}"
    cd backend
    pm2 start dist/index.js --name "somere-backend-90001"
    cd ..
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}      DEPLOY SELESAI DENGAN SUKSES!      ${NC}"
echo -e "${GREEN}=========================================${NC}"
