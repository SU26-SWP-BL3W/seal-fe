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
├── repositories/            Model/data access — chia theo LUỒNG NGHIỆP VỤ (xem repositories/README.md)
│   ├── auth/                   Đăng nhập/đăng ký/hồ sơ danh tính
│   ├── events/                   Sự kiện/vòng/hạng mục/tiêu chí/mời nhân sự
│   ├── teams/                     Đội thi
│   ├── scoring/                     Nộp bài + chấm điểm ✅ đã ráp
│   ├── results/                       Kết quả cuối + giải thưởng + phúc khảo ✅ đã ráp
│   └── shared/                         Dùng chung nhiều luồng (thông báo, audit log)
├── models/                   Model/type dùng chung — entities.ts, apiClient.ts, types.ts
├── components/ui/             Design-system thuần, KHÔNG biết gì về nghiệp vụ
├── components/domain/          Component nghiệp vụ dùng lại nhiều feature
├── components/auth/             Guard theo quyền
├── providers/                    QueryProvider, AuthProvider
├── i18n/, styles/, lib/            Plumbing chung
```

Luồng 1 chiều: `app/` → `views/` → `viewModels/` → `repositories/` → `apiClient`. Không nhảy tầng
(view không tự gọi apiClient; repository không chứa state UI). `views/` và `viewModels/` nên đi
theo cùng cách chia thư mục con của `repositories/` khi bắt đầu build UI thật cho từng luồng.

## Quy tắc bắt buộc — rút từ audit repo cũ

Repo cũ (`SU26_SWP_BL3W_FE`) từng bị audit và lộ 2 khuôn lỗi lặp lại khắp nơi — khung này port
sạch để KHÔNG lặp lại:

1. **Mutation phải thành thật.** Không `.catch(console.warn)` nuốt lỗi rồi báo thành công. Lỗi
   phải throw thật để UI hiện `isError`, không tự ý điều hướng như thể đã xong.
2. **Cấm id giả / mock giả.** Không fallback `id || "res-1"`, không seed `MOCK_*` vào code chạy
   thật, không hardcode dữ liệu mẫu khi rỗng — rỗng thì hiện empty-state.
3. **Một nguồn sự thật.** Đừng để 1 khái niệm (tiêu chí, kết quả...) có 2-3 nơi định nghĩa khác
   nhau.

## Đã ráp

Field/route mọi repository dưới đây đối chiếu TRỰC TIẾP source C# của BE
(`SU26_SWP_BL3W_BE/backend/SEAL.Application/Features/**/Models`) — không suy đoán, không copy từ
FE cũ (FE cũ có bug lệch contract thật ở đúng việc này, xem ví dụ trong `repositories/README.md`).

**`repositories/auth/`** — 13 endpoint `AuthController` + `GET /Users/profile`.
- `LoginUserResponseModel` chỉ có field tối thiểu (không `isApproved`/`isFpt`/`schoolId`) → sau
  login/google-login, repository tự gọi thêm `/Users/profile` lấy `User` đầy đủ, không bịa field.
- Không expose hook refresh-token thủ công — `apiClient.ts` đã tự làm mới token khi 401
  (single-flight), thêm đường refresh thứ 2 dễ đua nhau.
- **Không** còn backdoor `loginWithRole` (mock-jwt-token) như bản cũ.
- **Chưa build**: trang Login/Register (`views/`) — mới có tầng data + session, chưa có UI.

**`repositories/scoring/`** — `SubmitResultsController` (5), `ScoresController` (9),
`ScoreDetailsController` (5), `StorageController` (2) — 21 endpoint.
- `useSaveScore` (API gộp `/Scores/save`) là đường chính để giám khảo lưu cả phiếu chấm nhiều tiêu
  chí 1 lần — `scoreDetailsRepository.ts` chỉ dùng khi cần sửa/xoá TỪNG điểm chi tiết riêng lẻ.
- `exportScoresCsv`/`downloadFile` dùng `responseType: "blob"` + tự soi `content-type` để phân
  biệt file thật vs JSON lỗi bị blob-hoá — 2 endpoint này KHÔNG trả `BaseResponse` khi thành công
  (trả file thô), khác mọi endpoint khác trong dự án.
- `StorageController` phát hiện KHÔNG theo convention `BaseResponse` khi lỗi (`BadRequest(string)`
  thô) — ghi rõ cảnh báo trong file để component không giả định `err.response.data.message`.
- **Chưa build**: UI nộp bài/chấm điểm (`views/`).

**`repositories/results/`** — `FinalResultsController` (11), `PrizesController` (4),
`AppealsController` (5) — 20 endpoint.
- ⚠️ **2 hành động dễ nhầm** trong `finalResultsRepository.ts`: `useUnpublishRoundResults` (DELETE)
  **XOÁ SẠCH** kết quả, phải tính lại từ đầu; `useSetRoundResultsPublishStatus` (PUT) chỉ đổi cờ
  công bố, **giữ nguyên** điểm đã tính, đảo 2 chiều thoải mái — dùng cái này cho nút "Công bố/Thu
  hồi", không phải `usePublishRoundResults` (chỉ 1 chiều, tự nó không thu hồi lại được).
- `PrizesController` dùng **route ngược**: GET/POST gắn dưới `/Events/{eventId}/Prizes`
  (`~` override trong C#), chỉ PUT/DELETE mới thật sự ở `/Prizes/{id}` — copy nhầm base route là
  lỗi 404 chắc chắn.
- `AppealStatus` (Pending/Approved/Rejected) serialize dạng **số** (0/1/2), không phải chuỗi —
  export sẵn `AppealStatus` const trong `appealsRepository.ts` để không ai tự hardcode số rời rạc.
- **Chưa build**: UI công bố kết quả/trao giải/xử phúc khảo (`views/`).

## Chưa port cố ý

- **`lib/permissions.ts`** — phụ thuộc entity/role đầy đủ (Team, EventRole...) chưa wiring; định
  nghĩa lại cùng lúc với các controller đó.

## Còn lại — 3 luồng của teammate (Gia Bảo & Phúc), 15/25 controller

Events, Rounds, Tracks, Templates, Criterias, EventRoles, EventCoordinators, Judges, Mentors
(→ `repositories/events/`) · Teams (→ `repositories/teams/`) · Users (ngoài `/profile`),
UserRejections, Schools, FptMock (→ `repositories/auth/`) · Notifications, AuditLogs, Demo
(→ `repositories/shared/`).

Cả 3 luồng của mình (Auth, Scoring, Results) đã ráp xong. Phần còn lại thuộc luồng
Event/Team — ráp theo đúng pattern đã dùng khi bắt đầu, đọc contract thật từ source C#, không
copy route/field từ FE cũ.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_API_URL trỏ BE thật
npm run dev
```

## CI

`.github/workflows/ci.yml` — lint (chặn, không `continue-on-error`) + build trên mọi
push/PR vào `main`/`dev`.

**⚠️ Đang bị chặn ở tài khoản, không phải ở workflow:** mọi run hiện fail sau 2s với annotation
*"account is locked due to a billing issue"*. Repo này **public** (Actions không tính phút cho
public repo) và trang billing của `h1e3su` xác nhận $0/không nợ gì — nên nhiều khả năng đây là
**anti-abuse hold** GitHub tự áp cho tài khoản mới/ít hoạt động (chặn CI để ngừa crypto-mining
qua Actions), không phải thật sự thiếu tiền. Build + lint local đã xanh
(`npm run build`, `npm run lint`). Cách gỡ: chủ tài khoản thêm 1 phương thức thanh toán ở
Settings → Billing (dù $0), hoặc gửi yêu cầu tại `support.github.com/contact` xin kích hoạt
GitHub Actions cho tài khoản.
