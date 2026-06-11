# CI/CD: GitHub Actions → Google Cloud Run + Supabase (PostgreSQL)

Mỗi lần push lên `main`, workflow [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) sẽ:

1. Build Docker image (Next.js standalone) và push lên **Artifact Registry**
2. Chạy `prisma migrate deploy` trực tiếp vào **Supabase**
3. Deploy lên **Cloud Run** ([service.yaml](service.yaml))

Database dùng **Supabase free tier** (500MB — dư cho app từ vựng), app kết nối
trực tiếp qua `DATABASE_URL` nên không cần sidecar proxy. Chi phí ~$0–5/tháng
cho 1.000 người dùng (Cloud Run nằm trong free tier, Supabase miễn phí).

## Bước 1 — Tạo database trên Supabase

1. Tạo project tại [supabase.com](https://supabase.com) (chọn region **Singapore** cho gần `asia-southeast1`)
2. Vào **Project Settings → Database → Connection string**, chọn tab **Session pooler** (URI dạng):

   ```
   postgresql://postgres.xxxx:MAT_KHAU@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

   ⚠️ Dùng **Session pooler (port 5432)**, KHÔNG dùng:
   - *Direct connection* — chỉ có IPv6, GitHub Actions và Cloud Run không kết nối được
   - *Transaction pooler (port 6543)* — không tương thích `prisma migrate`

## Bước 2 — Thiết lập một lần trên GCP

Thay `PROJECT_ID`, chọn region (ví dụ `asia-southeast1` — Singapore):

```bash
gcloud config set project PROJECT_ID
REGION=asia-southeast1

# 1. Bật API
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# 2. Artifact Registry repo chua Docker image
gcloud artifacts repositories create english-voca \
  --repository-format=docker --location=$REGION

# 3. Service Account cho GitHub Actions
gcloud iam service-accounts create github-deployer
SA=github-deployer@PROJECT_ID.iam.gserviceaccount.com
for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:$SA" --role="$ROLE"
done
gcloud iam service-accounts keys create gcp-sa-key.json --iam-account=$SA
```

## Bước 3 — GitHub Secrets

Vào **Settings → Secrets and variables → Actions** của repo, tạo:

| Secret | Giá trị |
| --- | --- |
| `GCP_PROJECT_ID` | Project ID |
| `GCP_REGION` | ví dụ `asia-southeast1` |
| `GCP_SA_KEY` | toàn bộ nội dung file `gcp-sa-key.json` |
| `DATABASE_URL` | Session pooler URI của Supabase (bước 1) |
| `NEXTAUTH_URL` | URL Cloud Run (điền sau lần deploy đầu, ví dụ `https://english-voca-xxxx.a.run.app`) |
| `NEXTAUTH_SECRET` | chuỗi ngẫu nhiên (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (để trống nếu chưa dùng) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | SMTP (để trống nếu chưa dùng) |

## Lần deploy đầu tiên

1. Tạo đủ secrets ở trên (`NEXTAUTH_URL` tạm để `https://example.com`)
2. Push lên `main` (hoặc bấm **Run workflow** trong tab Actions)
3. Lấy URL service in ở bước cuối workflow → cập nhật secret `NEXTAUTH_URL`
4. (Nếu dùng Google OAuth) thêm `https://URL/api/auth/callback/google` vào Authorized redirect URIs
5. Chạy lại workflow để áp `NEXTAUTH_URL` mới

## Seed dữ liệu (tùy chọn, chạy từ máy local)

```powershell
$env:DATABASE_URL = "postgresql://postgres.xxxx:MAT_KHAU@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
npm run db:seed
```

## Lưu ý vận hành

- **Supabase free tier tự pause project sau 7 ngày không hoạt động** — vào dashboard
  bấm Restore, hoặc nâng lên gói Pro ($25/tháng) khi app có người dùng thật.
- Cloud Run đang đặt `minScale: 0` ([service.yaml](service.yaml)) — request đầu sau
  khoảng lặng chịu cold start ~3–5s. Đổi thành `"1"` để loại bỏ (~$10–15/tháng).
- Prisma + Session pooler hoạt động bình thường; nếu sau này chuyển sang Transaction
  pooler (port 6543) thì phải thêm `?pgbouncer=true` vào URL và migrate sẽ cần URL riêng.
