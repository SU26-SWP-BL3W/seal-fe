# SEAL FE

Khung MVVM cho FE SEAL (Next.js App Router). Dựng lại sạch từ `SU26_SWP_BL3W_FE` — port nguyên
phần plumbing đã chứng minh chạy tốt (API client, i18n, design tokens, UI primitives), **không**
port feature/mock-data đã bị audit phát hiện lỗi.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · next-intl (vi/en) · Tailwind v4 ·
TanStack Query · axios.

## Kiến trúc — MVVM

```
src/
├── app/[locale]/        Route MỎNG — chỉ render 1 View, không chứa logic
├── views/                 View — component trang, ghép UI + gọi viewModel
├── viewModels/             ViewModel — hook use<Feature>ViewModel, gọi repository + state UI cục bộ
├── repositories/            Model/data access — 1 file/nhóm entity, hook React Query bọc apiClient
├── models/                   Model/type — entities.ts (type dùng chung), apiClient.ts, types.ts
├── components/ui/             Design-system thuần, KHÔNG biết gì về nghiệp vụ
├── components/domain/          Component nghiệp vụ dùng lại nhiều feature
├── components/auth/             Guard theo quyền
├── providers/                    QueryProvider...
├── i18n/, styles/, lib/            Plumbing chung
```

Luồng 1 chiều: `app/` → `views/` → `viewModels/` → `repositories/` → `apiClient`. Không nhảy tầng
(view không tự gọi apiClient; repository không chứa state UI).

## Quy tắc bắt buộc — rút từ audit repo cũ

Repo cũ (`SU26_SWP_BL3W_FE`) từng bị audit và lộ 2 khuôn lỗi lặp lại khắp nơi — khung này port
sạch để KHÔNG lặp lại:

1. **Mutation phải thành thật.** Không `.catch(console.warn)` nuốt lỗi rồi báo thành công. Lỗi
   phải throw thật để UI hiện `isError`, không tự ý điều hướng như thể đã xong.
2. **Cấm id giả / mock giả.** Không fallback `id || "res-1"`, không seed `MOCK_*` vào code chạy
   thật, không hardcode dữ liệu mẫu khi rỗng — rỗng thì hiện empty-state.
3. **Một nguồn sự thật.** Đừng để 1 khái niệm (tiêu chí, kết quả...) có 2-3 nơi định nghĩa khác
   nhau.

## Chưa port cố ý

- **`AuthProvider`** — repo cũ có sẵn nhưng chứa 1 backdoor đã bị audit (`loginWithRole` tạo
  mock-jwt-token giả cho nút demo). Xây lại sạch làm feature đầu tiên, không copy nguyên.
- **`lib/permissions.ts`** — phụ thuộc `models/entities` (kho type feature); định nghĩa lại cùng
  lúc với entity/role model thật.
- Toàn bộ `views/`, `viewModels/`, `repositories/` feature cụ thể — xây theo pattern ở trên khi
  bắt đầu từng flow.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_API_URL trỏ BE thật
npm run dev
```

## CI

`.github/workflows/ci.yml` — lint (chặn, không `continue-on-error`) + build trên mọi
push/PR vào `main`/`dev`.
