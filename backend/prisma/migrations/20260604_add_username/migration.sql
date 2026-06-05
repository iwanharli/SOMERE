-- Tambah kolom username dengan default sementara dari email (sebelum titik)
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Isi username dari bagian depan email untuk user yang sudah ada
UPDATE "users" SET "username" = split_part(email, '@', 1);

-- Pastikan unik, jika ada duplikat tambahkan suffix
UPDATE "users" u1
SET "username" = u1."username" || '_' || substring(u1.id, 1, 4)
WHERE (
  SELECT COUNT(*) FROM "users" u2
  WHERE u2."username" = u1."username" AND u2.id <> u1.id
) > 0;

-- Set NOT NULL dan UNIQUE
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
