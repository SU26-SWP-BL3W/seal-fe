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

## Đã ráp — Auth (13 endpoint `AuthController` + 1 endpoint `UsersController`)

`repositories/authRepository.ts` + `providers/AuthProvider.tsx` xây lại sạch, field/route đối
chiếu trực tiếp source C# của BE (`SU26_SWP_BL3W_BE/backend/SEAL.Application/Features/Users/**`),
không suy đoán từ FE cũ — FE cũ có bug thật ở đúng chỗ này (gọi `/FptStudents/{code}` không tồn
tại; đọc `data.user`/`data.token` trong khi response thật là field phẳng
`accessToken`/`userId`/...).

- `LoginUserResponseModel` chỉ có field tối thiểu (không có `isApproved`/`isFpt`/`schoolId`) →
  sau login/google-login, repository tự gọi thêm `GET /Users/profile` để lấy `User` đầy đủ, không
  tự bịa giá trị mặc định cho field thiếu.
- Không expose hook refresh-token thủ công — `apiClient.ts` đã tự làm mới token khi 401
  (single-flight), thêm 1 đường refresh nữa dễ đua nhau.
- **Không** còn backdoor `loginWithRole` (mock-jwt-token cho nút demo) như bản cũ.
- **Chưa build**: trang Login/Register (`views/`) — mới có tầng data + session, chưa có UI.
- **Chưa ráp**: xác minh sinh viên FPT (`FptMockController`, route `api/fpt-mock/students/{code}`
  — khác controller, không phải Auth) — để lại cho đợt sau, tránh lẫn vào scope Auth.

## Chưa port cố ý

- **`lib/permissions.ts`** — phụ thuộc entity/role đầy đủ (Team, EventRole...) chưa wiring; định
  nghĩa lại cùng lúc với các controller đó.
- 23/24 controller còn lại (Events, Teams, Scores, Templates, Tracks, Rounds, FinalResults,
  Appeals, Users (ngoài `/profile`), EventRoles, Judges, Mentors, Prizes, Criterias,
  SubmitResults, ScoreDetails, Notifications, Schools, Storage, UserRejections,
  EventCoordinators, AuditLogs, Demo, FptMock) — ráp theo đúng pattern Auth khi bắt đầu từng flow,
  đọc contract thật từ source C#, không copy route/field từ FE cũ.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_API_URL trỏ BE thật
npm run dev
```

## CI

`.github/workflows/ci.yml` — lint (chặn, không `continue-on-error`) + build trên mọi
push/PR vào `main`/`dev`.
