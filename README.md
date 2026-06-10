# English Learning App

Ung dung web hoc tu vung tieng Anh theo chu de — xay dung theo **BA Design Document v1.1**.

**Stack:** Next.js 14 (App Router) · PostgreSQL 15 · Prisma · NextAuth.js v5 (Google OAuth + Email/Password) · Tailwind CSS

## Tinh nang

- 🏠 Trang chu: goi y chu de, tim kiem (debounce 300ms), loc theo level, infinite scroll
- 🃏 Flashcard: flip 3D, swipe trai/phai, phim tat, phat am TTS (Web Speech API), danh dau da hoc
- 🎯 Quiz: 10 cau trac nghiem 4 lua chon, sinh de va cham diem server-side, pass >= 80%
- ⭐ Glory Points (10/15/20 theo level, chi cong 1 lan khi pass dau tien) + Leaderboard
- 👤 Profile: lich su hoc, lien ket / huy lien ket tai khoan Google
- ⚙️ Admin Panel: CRUD chu de & tu vung, import CSV, preview flashcard, dashboard thong ke
- 🔐 Bao mat: bcrypt (saltRounds 12), rate limiting, Zod validation, middleware bao ve route, chong email enumeration & open redirect

## Cai dat & Chay (Development)

### 1. Cai dependencies

```bash
npm install
```

### 2. Chay PostgreSQL bang Docker

```bash
docker compose up -d
```

### 3. Cau hinh bien moi truong

```bash
cp .env.example .env
```

Sua `.env`:
- `NEXTAUTH_SECRET`: sinh bang `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: xem muc Google OAuth ben duoi
- `SMTP_*`: de trong khi dev — email reset/verify se duoc log ra console

### 4. Tao database schema + seed du lieu mau

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Seed tao san:
- Tai khoan admin: `admin@example.com` / `admin12345` (**doi mat khau ngay sau khi dang nhap**)
- 6 chu de da publish (2 moi level) × 12 tu vung

### 5. Chay app

```bash
npm run dev
```

Mo http://localhost:3000

## Cau hinh Google OAuth

1. Vao [console.cloud.google.com](https://console.cloud.google.com) → tao project
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID + Secret vao `.env`

> Chua co Google OAuth van chay duoc — dang nhap bang email/password.

## Tai khoan & Phan quyen

| Role | Quyen |
|------|-------|
| learner | Hoc flashcard, lam quiz, xem leaderboard |
| admin | Tat ca + `/admin` (CRUD chu de, tu vung, dashboard) |

Nang user len admin: `UPDATE users SET role = 'admin' WHERE email = '...';`

## Import CSV tu vung (Admin)

Header bat buoc: `word,definition,example,meaning_vi` (tuy chon: `pronunciation,part_of_speech`)

```csv
word,pronunciation,part_of_speech,definition,example,meaning_vi
hello,/həˈləʊ/,noun,"A greeting","She said hello.",xin chao
```

## Deploy Production (Vercel + Supabase/Railway)

1. Tao PostgreSQL tren Supabase hoac Railway → lay `DATABASE_URL`
2. Push code len GitHub → import vao Vercel
3. Khai bao env vars tren Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_*`
4. Them redirect URI production vao Google Cloud Console
5. Chay migration: `npx prisma migrate deploy`

## Ghi chu trien khai

- **bcryptjs** thay cho bcrypt (pure JS, khong can build native — cung API, saltRounds 12 theo dac ta)
- **Rate limiting** dang in-memory (du cho 1 instance). Khi scale ngang: thay `lib/rate-limit.ts` bang `@upstash/ratelimit` + Redis
- **Token xac minh email** dang HMAC stateless (khong can bang DB rieng); reset password dung bang `password_reset_tokens` dung dac ta
- **Quiz** sinh de va cham diem hoan toan server-side de chong gian lan leaderboard
- **Glory** cong trong Prisma transaction, kiem tra `glory_earned` de khong bao gio cong 2 lan

## Cau truc thu muc

```
app/
├── (main)/           # S01 Home, S02 My List, S07 Leaderboard, S08 Profile
├── topics/[id]/      # S03 Chi tiet, S04 /learn, S05 /quiz, S06 /quiz/result
├── admin/            # S10 Topics, S11 Words, S12 Dashboard
├── login|register|forgot-password|reset-password  # S09
└── api/              # 23 REST endpoints (auth, topics, words, user, leaderboard)
components/           # Navbar, TopicCard, badges
lib/                  # prisma, auth, validations, quiz-engine, rate-limit, email
prisma/               # schema.prisma (6 models), seed.ts
middleware.ts         # Bao ve route + /admin
```
