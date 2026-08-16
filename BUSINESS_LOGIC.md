# SEAL — Tài liệu Nghiệp vụ Toàn dự án

> Tài liệu này mô tả **toàn bộ nghiệp vụ thật đang có trong code** (backend .NET, Clean Architecture/CQRS với MediatR) — không phải bản đặc tả lý tưởng. Mỗi mục ghi rõ: ai được thực hiện, điều kiện/ràng buộc thực tế đọc trực tiếp từ handler, kết quả/tác động lên DB, và file:line tham chiếu để tra cứu nhanh.
>
> **Biên soạn lại toàn bộ ngày 2026-08-16** bằng 5 agent đọc trực tiếp source code trên nhánh `main`, commit `306cf96` (không dựa vào bản BUSINESS_LOGIC.md cũ, không suy đoán). Bản trước đó đã lỗi thời do một đợt tái cấu trúc lớn: migration `RestructureTrackUnderEvent` đổi quan hệ `Track` từ thuộc `Round` sang thuộc thẳng `Event`, cộng thêm ~94 file thay đổi bổ sung nhiều tính năng mới (DisqualifyTeam, ExportScoresCsv, GetTrackCalibration, ResendEmailVerification, module Notifications, module AuditLogs, nộp bài 3 URL...).

## Mục lục

1. [Định danh & Phân quyền](#1-định-danh--phân-quyền) — Auth, Users, EventRoles, mời EC/Judge/Mentor, UserRejections
2. [Cấu trúc Sự kiện & Cấu hình chấm điểm](#2-cấu-trúc-sự-kiện--cấu-hình-chấm-điểm) — Events, Rounds, Tracks, Templates, Criterias, Schools
3. [Quản lý Đội thi](#3-quản-lý-đội-thi-teams) — Teams
4. [Nộp bài, Chấm điểm & Phúc khảo](#4-nộp-bài-chấm-điểm--phúc-khảo) — SubmitResults, Scores, ScoreDetails, Appeals
5. [Kết quả & Giải thưởng](#5-kết-quả--giải-thưởng) — FinalResults, Prizes, Demo
6. [Thông báo & Nhật ký hệ thống](#6-thông-báo--nhật-ký-hệ-thống-module-mới) — Notifications, AuditLogs (2 module hoàn toàn mới)
7. [Tổng hợp các vấn đề phát hiện được](#7-tổng-hợp-các-vấn-đề-phát-hiện-được) — toàn dự án, xếp theo mức độ nghiêm trọng

## Kiến trúc dữ liệu tổng quan (đã cập nhật theo migration RestructureTrackUnderEvent)

```
Event (1) ──< Round (N, thuộc thẳng Event)
  │
  ├──< Track (N, thuộc THẲNG Event — KHÔNG còn thuộc Round) ──> Template (0..1) ──< TemplateCriteria >── Criteria
  │
  ├──< Team (N, có TrackId — đội đăng ký 1 hạng mục cố định)
  │       └──< EventRole (N — TeamLeader/TeamMember/EventCoordinator/Judge/Mentor, gắn User + tùy chọn Team/Track)
  │
  ├──< Prize (N) ──> gán vào FinalResult.PrizeId
  │
  └──< SubmitResult (N — mang CẢ TrackId LẪN RoundId tường minh, vì quan hệ Track↔Round không còn ngầm định)
           ├──< Score (N, 1/giám khảo) ──< ScoreDetail (N, 1/tiêu chí)
           ├──< Appeal (đơn phúc khảo)
           └── (kết quả tính theo Round) ──> FinalResult (N, 1/đội/Round/Track)
```

**⚠️ Cảnh báo kiến trúc quan trọng nhất:** `Round.Tracks` (navigation property) là một **shadow FK "ma"** — không property C# nào set giá trị này, nên `GET /api/Events/{id}` trả về `Rounds[].Tracks[]` **luôn rỗng** cho mọi Track tạo sau migration. Muốn lấy danh sách Track của 1 Event, luôn dùng `GET /api/Tracks/event?EventId=...`, không dùng cấu trúc lồng trong Event. Xem chi tiết mục 2, phần 0 và mục 7.1.

Ghi chú xuyên suốt:
- Toàn bộ thao tác `DeleteAsync` trong `GenericRepository` là **xóa cứng** (`_dbSet.Remove`), dù một số XML-doc còn ghi nhầm "(Soft Delete)".
- `EventRoleChecker.HasRoleAsync` có **bypass toàn cục cho Admin** trước khi xét bất kỳ role nào, và cache kết quả 60 giây theo `(userId, eventId)` — sau khi tạo/hủy vai trò ở luồng phản hồi lời mời, code chủ động `InvalidateCache` để có hiệu lực ngay.
- Công thức tính điểm áp dụng thống nhất toàn hệ thống: `TotalScore = Σ (Value / MaxScore × Weight/100) × 10`, làm tròn 2 chữ số `AwayFromZero` — dùng chung bởi `SaveScore`, `CreateScore`, và toàn bộ `ScoreDetail` CRUD.
- **Có một nhánh fix quan trọng CHƯA MERGE vào `main`**: `fix/be-business-logic-bugs` (worktree `E:\SEASON 5\SWP391\SU26_SWP_BL3W_fix_worktree`, commit `453b938`) sửa: (a) `DeleteRoundCommandHandler` thêm guard chặn xóa Round đã có bài nộp/kết quả, (b) `UpdateCriteriaCommandHandler` chặn sửa khi đã dùng chấm điểm, (c) FPT Mock route/DTO lệch, (d) `AssignPrizeCommandHandler` chặn gán giải cho kết quả nháp. **Tài liệu này mô tả đúng hành vi hiện tại trên `main` (tức là CHƯA có các fix này)** — xem mục 7 để biết chính xác chỗ nào cần merge.

---

## 1. Định danh & Phân quyền

### 1.1. Xác thực (Authentication) — `AuthController` + `Features/Users`

#### 1.1.1. Đăng ký tài khoản — RegisterUser
- **Route:** `POST /api/Auth/register` — `[AllowAnonymous]`
- **Ai được thực hiện:** Bất kỳ ai.
- **Điều kiện/ràng buộc:**
  - Nếu email đã tồn tại và không phải tài khoản tạm chưa xác thực → báo trùng email.
  - Nếu email trùng với một **tài khoản tạm** (được mời vào đội/vai trò trước đó, `IsTemporary && !IsEmailVerified`) → cho phép "nhận lại" chính tài khoản đó, giữ nguyên `Id`.
  - Không cho tự đăng ký làm Admin (`IsAdmin=false` cứng); `IsApproved=false`, `IsEmailVerified=false`.
  - Token xác thực hết hạn sau **24 giờ** (`ACTIVATION_EXPIRY_HOURS`).
- **Kết quả:** Tạo/cập nhật `User`; gửi email kích hoạt `{FrontendUrl}/auth/verify-email?token=...`.
- **⚠️ Không bọc try/catch khi gửi email** — khác mọi luồng email khác trong cùng feature; nếu SMTP lỗi, cả API fail dù User đã ghi vào DB.
- **File:** `SEAL.Application/Features/Users/Commands/RegisterUser/RegisterUserCommandHandler.cs:48-117`

#### 1.1.2. Đăng nhập — LoginUser
- **Route:** `POST /api/Auth/login` — `[AllowAnonymous]`
- **Điều kiện theo thứ tự:** email tồn tại + mật khẩu đúng (báo lỗi chung, không lộ email nào sai) → nếu không phải Admin/tài khoản tạm và `IsEmailVerified=false` → chặn → nếu là tài khoản tạm, phải có EventRole còn hạn **hoặc** lời mời (Team/EventRole) còn hạn.
- **Kết quả:** Sinh access/refresh token, lưu vào DB.
- **File:** `LoginUserCommandHandler.cs:34-101`

#### 1.1.3. Đăng nhập Google — GoogleLogin
- **Route:** `POST /api/Auth/google-login` — `[AllowAnonymous]`
- **Điều kiện:** thiếu `GoogleAuth:ClientId` → **fail-closed** (chặn hẳn, không bao giờ bỏ qua audience check); validate chữ ký + audience qua `GoogleJsonWebSignature.ValidateAsync`.
- **Kết quả:** User mới → `IsEmailVerified=true`, `IsStudent=true`, `IsApproved=false`; gửi email chào mừng/cảnh báo (best-effort). Chỉ `Update()` khi KHÔNG phải user mới (tránh `DbUpdateConcurrencyException` trên entity vừa Add).
- **File:** `GoogleLoginCommandHandler.cs:50-162`

#### 1.1.4. Xác thực email — VerifyEmail
- **Route:** `GET /api/Auth/verify-email?token=...` — `[AllowAnonymous]`
- **Điều kiện:** token khớp, chưa hết hạn.
- **Kết quả:** `IsEmailVerified=true`; nếu là tài khoản tạm → tự `IsApproved=true` + cấp mật khẩu tạm ngẫu nhiên, gửi email chứa mật khẩu (nội dung khác nhau tùy có đang có lời mời vào đội hay không).
- **File:** `VerifyEmailCommandHandler.cs:31-100`

#### 1.1.5. 🆕 Gửi lại email xác thực — ResendEmailVerification
- **Route:** `POST /api/Auth/resend-verification` — `[AllowAnonymous]`
- **Xác nhận: đã hoạt động đầy đủ, đúng end-to-end** (audit cũ từng ghi nhận "missing" — nay đã có).
- **Điều kiện:** user không tồn tại hoặc đã verify → trả `true` im lặng (chống dò email).
- **Kết quả:** sinh token mới + hạn 24h (đồng bộ `ACTIVATION_EXPIRY_HOURS`), ghi đè token cũ, gửi lại email (nuốt lỗi SMTP).
- **⚠️ Thiếu cooldown chống spam** — khác `ForgotPassword` (5 phút) và `RequestUnblock` (24h) đều có `IMemoryCache` cooldown, endpoint này thì không — có thể bị lạm dụng spam email người khác.
- **File:** `ResendEmailVerificationCommandHandler.cs:39-64`

#### 1.1.6. Làm mới token — RefreshToken
- **Route:** `POST /api/Auth/refresh-token` — `[AllowAnonymous]`
- **Điều kiện:** RefreshToken khớp, chưa hết hạn, (Admin hoặc đã verify hoặc tài khoản tạm).
- **Kết quả:** Rotate access/refresh token.
- **File:** `RefreshTokenCommandHandler.cs:34-60`

#### 1.1.7. Đăng xuất — Logout
- **Route:** `POST /api/Auth/logout` — `[Authorize]`. Xóa RefreshToken.
- **File:** `LogoutCommandHandler.cs:29-33`

#### 1.1.8. Đổi mật khẩu — ChangePassword
- **Route:** `PUT /api/Auth/change-password` — `[Authorize]`
- **Điều kiện:** mật khẩu cũ đúng hash; mật khẩu mới ≥ 6 ký tự.
- **⚠️ Không thu hồi RefreshToken cũ** — bất nhất với ResetPassword (mục dưới) có thu hồi.
- **File:** `ChangePasswordCommandHandler.cs:31-34`

#### 1.1.9. Quên mật khẩu — ForgotPassword
- **Route:** `POST /api/Auth/forgot-password` — `[AllowAnonymous]`
- **Điều kiện:** luôn trả thông báo chung (chống dò email); chỉ xử lý nếu `IsEmailVerified=true`; cooldown **5 phút**/tài khoản (`IMemoryCache`).
- **Kết quả:** tái sử dụng field `EmailVerificationToken/Expiry` (hạn 24h), gửi link `{FrontendUrl}/auth/reset-password?token=...`.
- **File:** `ForgotPasswordCommandHandler.cs:42-96`

#### 1.1.10. Đặt lại mật khẩu — ResetPassword
- **Route:** `POST /api/Auth/reset-password` — `[AllowAnonymous]`
- **Kết quả:** đổi `PasswordHash`, set `IsEmailVerified=true`, **xóa RefreshToken** (thu hồi mọi phiên cũ — chống chiếm tài khoản), gửi email cảnh báo.
- **File:** `ResetPasswordCommandHandler.cs:27-67`

#### 1.1.11. Yêu cầu gỡ khóa — RequestUnblock
- **Route:** `POST /api/Auth/request-unblock` — `[AllowAnonymous]`
- **Điều kiện:** chỉ xử lý khi số `UserRejection` ≥ 2 (`RejectionLockThreshold`); cooldown 24h.
- **Kết quả:** không đổi DB, chỉ gửi email cho `SupportEmail` + user. Gỡ khóa thật qua mục 1.4.3 (xóa `UserRejection`).
- **File:** `RequestUnblockCommandHandler.cs:50-108`

#### 1.1.12. Nộp/cập nhật hồ sơ sinh viên — UpdateStudentProfile
- **Route:** `POST` hoặc `PUT /api/Auth/student-profiles` — cùng 1 Command, `[Authorize]`
- **Điều kiện theo thứ tự:** chặn Admin nộp hồ sơ → nếu tổng `UserRejection` (không lọc `IsActive`) ≥ 2 → chặn → SchoolId bắt buộc; StudentCode bắt buộc nếu FPT; PhotoStudentCardUrl bắt buộc nếu không FPT → nếu FPT: gọi FPT Mock API xác thực StudentCode + đối chiếu email (chuẩn hóa lowercase+trim).
- **Kết quả:** `IsApproved = IsFpt` (tự duyệt SV FPT); `IsTemporary=false`; vô hiệu hóa mọi `UserRejection` active cũ (nhưng **count** vẫn giữ cho ngưỡng khóa vì check không lọc `IsActive`).
- **File:** `UpdateStudentProfileCommandHandler.cs:47-177`

### 1.2. Quản lý Users — `UsersController`

#### 1.2.1. Tạo người dùng — CreateUser
- **Route:** `POST /api/Users` — `[AdminAuthorize]`, chỉ Admin.
- **Kết quả:** `IsApproved=true`, `IsEmailVerified=true` (Admin tạo trực tiếp bỏ qua luồng duyệt).
- **File:** `CreateUserCommandHandler.cs:26-57`

#### 1.2.2. Cập nhật người dùng — UpdateUser
- **Route:** `PUT /api/Users/{id}` — `[AdminAuthorize]`.
- **⚠️ Bất nhất filter/handler:** route gắn `[AdminAuthorize]` (chặn non-admin ngay tại controller) nhưng handler còn logic "Admin hoặc EventCoordinator" — nhánh EC **thực chất chết**, không bao giờ chạy tới vì đã 403 trước đó ở filter.
- **Điều kiện (guard chống tự khóa/mất admin cuối):** không tự vô hiệu hóa chính mình; không tự gỡ quyền admin của mình; không gỡ/khóa **admin đang hoạt động cuối cùng** của hệ thống.
- **File:** `UsersController.cs:113`, `UpdateUserCommandHandler.cs:35-87`

#### 1.2.3. Xóa người dùng — DeleteUser
- **Route:** `DELETE /api/Users/{id}` — `[AdminAuthorize]`. Không tự xóa chính mình.
- **⚠️ Không kiểm tra ràng buộc dữ liệu liên quan** (EventRole, Score, Team...) — phụ thuộc hoàn toàn FK cascade/restrict ở DB.
- **File:** `DeleteUserCommandHandler.cs:32-56`

#### 1.2.4. Duyệt hồ sơ — ApproveUser
- **Route:** `POST /api/Users/{id}/approve` — chỉ `[Authorize]` class-level, quyền chốt trong handler: Admin hoặc EC của ≥1 sự kiện mà người bị duyệt có vai trò thí sinh.
- **Kết quả:** `IsApproved=true` (không tự động duyệt Team — tách riêng qua `ApproveTeamRegistration`).
- **File:** `ApproveUserCommandHandler.cs:52-88`

#### 1.2.5. Từ chối hồ sơ — RejectUser
- **Route:** `POST /api/Users/{id}/reject` — quyền giống ApproveUser. `Reason` bắt buộc.
- **Kết quả:** `IsApproved=false`; tạo `UserRejection`; hạ mọi Team `Registered`/`IsActive` của người này về `Forming`, `IsActive=false`; gửi email cảnh báo "từ chối quá 2 lần sẽ khóa".
- **File:** `RejectUserCommandHandler.cs:59-166`

#### 1.2.6–1.2.9. Truy vấn Users
- `GetAllUsers`: Admin/EC hiệu lực; luôn loại Admin khỏi kết quả; filter `HasSubmittedProfile = IsStudent && SchoolId != null`.
- `GetUserById`: chính chủ, Admin, hoặc EC hiệu lực.
- `GetUserProfile`: chính chủ.
- `GetMyInvitations`: gộp `TeamInvitation` (Pending/TransferPending còn hạn) + `EventRoleInvitation` (Pending còn hạn), cộng lịch sử phản hồi 7 ngày.

### 1.3. Vai trò sự kiện (EventRoles) — `EventRolesController`

#### 1.3.0. Ma trận xung đột vai trò dùng chung — `EventRoleValidationHelper`
1. Trùng chính xác cùng vai trò trên cùng Track → lỗi.
2. TeamLeader/TeamMember không kiêm EC/Judge/Mentor (và ngược lại).
3. EventCoordinator không kiêm Judge/Mentor (và ngược lại).
4. Judge và Mentor loại trừ nhau **trong cùng 1 Track** (1 người vẫn có thể Judge track A + Mentor track B cùng sự kiện).
- **File:** `EventRoleValidationHelper.cs:37-91`

#### 1.3.1. Gán vai trò trực tiếp — AssignEventRole
- **Route:** `POST /api/EventRoles/assign` — `[EventRoleAuthorize(EventCoordinator)]`.
- Gán `EventCoordinator` chỉ Admin được làm (validator). TeamLeader/TeamMember áp quy tắc 1 user/1 team/1 event.
- **Kết quả:** `ExpiredAt = request ?? Event.EndDate`.
- **File:** `AssignEventRoleCommandHandler.cs:26-106`

#### 1.3.2. Mời vai trò qua email — InviteEventRole
- **Route:** `POST /api/EventRoles/invitations` — `[EventRoleAuthorize(EventCoordinator)]`.
- Chỉ mời được Judge/Mentor/EventCoordinator; **không tự tạo tài khoản tạm** (khác 3 handler mục 1.4, người được mời phải đã có tài khoản); hết hạn 24h.
- **File:** `InviteEventRoleCommandHandler.cs:51-207`

#### 1.3.3. Phản hồi lời mời — RespondEventRoleInvitation
- **Route:** `POST /api/EventRoles/invitations/{id}/respond` — `[Authorize]`.
- Chỉ chính người được mời; lazy-expire; re-validate xung đột **tại thời điểm chấp nhận**; idempotent nếu EventRole đã tồn tại.
- **Kết quả:** tạo `EventRole`; `InvalidateCache` ngay để có hiệu lực tức thì.
- **File:** `RespondEventRoleInvitationCommandHandler.cs:40-166`

#### 1.3.4. Từ chối qua link công khai — DeclineEventRoleInvitation
- **Route:** `POST /api/EventRoles/invitations/{id}/decline` — `[AllowAnonymous]`. An toàn vì chỉ Reject/Expire, không bao giờ tạo EventRole. Idempotent.
- **File:** `DeclineEventRoleInvitationCommandHandler.cs:37-54`

#### 1.3.5. Cập nhật vai trò — UpdateEventRole
- **Route:** `PUT /api/EventRoles/{id}` — `[EventRoleAuthorize(EventCoordinator)]`.
- Không cho đổi sang/khỏi vai trò thành viên đội qua đây; không đổi Role/Track nếu đã có Score gắn; re-check ma trận xung đột nếu đổi Role/Track.
- **File:** `UpdateEventRoleCommandHandler.cs:26-97`

#### 1.3.6. Thu hồi vai trò — RemoveEventRole
- **Route:** `DELETE /api/EventRoles/{id}` — `[EventRoleAuthorize(EventCoordinator)]`.
- Không xóa được TeamLeader/TeamMember qua đây; không xóa được nếu đã gắn Score; chỉ Admin xóa được vai trò EventCoordinator.
- **File:** `RemoveEventRoleCommandHandler.cs:29-52`

#### 1.3.7. Truy vấn EventRoles
- `GetEventRolesByEventId`, `GetEventRolesByUserId`, `GetUserRoleInEvent`, `GetUsersByRoleInEvent`, `CheckUserHasRoleInEvent` — **chỉ yêu cầu đăng nhập, KHÔNG giới hạn quyền xem thêm** — bất kỳ user đăng nhập nào cũng đọc được vai trò của người khác trong bất kỳ sự kiện nào.

### 1.4. Mời vai trò chuyên biệt kèm tự tạo tài khoản tạm

Ba handler dùng chung khuôn mẫu: nhập email → tự tạo `User` tạm nếu chưa có → tạo `EventRoleInvitation` (accept mới tạo EventRole thật). Cả 3 chỉ kiểm tra `track.EventId == request.EventId` — **hoàn toàn không còn tham chiếu `RoundId`** ở bất kỳ đâu, khớp đúng migration restructure.

- **1.4.1 InviteEventCoordinator** — `POST /api/EventCoordinators/invite`, không gắn TrackId (EC cấp Event). File: `InviteEventCoordinatorCommandHandler.cs:52-166`
- **1.4.2 InviteJudgeToTrack** — `POST /api/Judges/invite`, gắn TrackId, chỉ kiểm `track.EventId`. File: `InviteJudgeToTrackCommandHandler.cs:52-174`
- **1.4.3 InviteMentorToTrack** — `POST /api/Mentors/invite`, đối xứng hoàn toàn với Judge. File: `InviteMentorToTrackCommandHandler.cs:52-132`

> Tài khoản tạm được tạo **trước khi** biết người được mời có chấp nhận hay không — không có cơ chế dọn dẹp tài khoản tạm "treo" vĩnh viễn nếu không ai chấp nhận.

### 1.5. Lịch sử từ chối hồ sơ (UserRejections) — `UserRejectionsController`

#### 1.5.1. Tạo bản ghi — CreateUserRejection
- **Route:** `POST /api/UserRejections` — chỉ `[Authorize]` class-level.
- **Ai:** Chỉ Admin — lấy `currentUserId` từ token, **không tin field `RejectedBy` client gửi** (fix bảo mật cho lỗ hổng giả mạo admin trước đó).
- **⚠️ Validator vẫn bắt buộc `Model.RejectedBy` NotEmpty nhưng handler bỏ qua giá trị này** — field dư thừa, gây hiểu nhầm.
- **File:** `CreateUserRejectionCommandHandler.cs:25-60`

#### 1.5.2. Cập nhật lý do — UpdateUserRejection
- Admin hoặc chính người tạo bản ghi (`isOwner`).
- **File:** `UpdateUserRejectionCommandHandler.cs:33-47`

#### 1.5.3. Xóa bản ghi — cơ chế gỡ khóa thật — DeleteUserRejection
- Admin hoặc owner. Xóa cứng; nếu không còn `IsActive=true` nào khác → reset `IsApproved=false`.
- **File:** `DeleteUserRejectionCommandHandler.cs:32-66`

#### 1.5.4–1.5.5. Truy vấn — GetAllUserRejections / GetUserRejectionsByUserId
- **⚠️ HOÀN TOÀN KHÔNG kiểm tra quyền** — bất kỳ user đăng nhập nào (kể cả sinh viên thường) đọc được toàn bộ lịch sử từ chối của mọi người, gồm lý do + ai từ chối. **Đây là lỗ hổng rò rỉ thông tin rõ ràng nhất trong Flow 1, nên vá sớm.**
- **File:** `GetAllUserRejectionsQueryHandler.cs:24-56`, `GetUserRejectionsByUserIdQueryHandler.cs:22-45`

---

## 2. Cấu trúc Sự kiện & Cấu hình chấm điểm

### 2.0. ⚠️ Thay đổi kiến trúc quan trọng nhất: Track tách khỏi Round

Migration `RestructureTrackUnderEvent` (`SEAL.Infrastructure/Migrations/20260814070627_RestructureTrackUnderEvent.cs:13-135`):
- **Track** (`Track.cs:8`) chỉ còn `EventId` — **không còn `RoundId`**. Track không gắn với Round cụ thể nào, dùng chung được cho mọi Round trong Event.
- **Round** (`Round.cs:9`) chỉ còn `EventId`; không còn quan hệ code-level tới Track.
- **SubmitResult** giờ có **cả `TrackId` lẫn `RoundId`** tường minh (cả 2 đều bắt buộc, cascade delete) — vì quan hệ Track↔Round không còn ngầm định.
- **Team** có thêm `TrackId` (nullable) — đội đăng ký 1 hạng mục cố định.

**🔴 Bug nghiêm trọng phát hiện được: `Round.Tracks` là navigation "ma".** `Round.cs:30` vẫn khai báo `ICollection<Track> Tracks`, nhưng vì Track không còn property `RoundId`, EF Core tự tạo **shadow FK `RoundId` (nullable, không map property C# nào)** để thỏa navigation (xác nhận tại `DatabaseContextModelSnapshot.cs:1501-1503`). Không handler nào set giá trị cột ẩn này. Hệ quả: **`GET /api/Events/{id}` trả `Rounds[].Tracks[]` LUÔN RỖNG** cho mọi Track tạo sau migration (`GetEventByIdQueryHandler.cs:27-28`). Client phải luôn dùng `GET /api/Tracks/event?EventId=...` để lấy danh sách Track, không dùng cấu trúc lồng.

**`CreateEvent` vẫn nhận payload lồng Round→Track nhưng không lưu vết "Track này thuộc Round nào"** — Track tạo qua CreateEvent (lồng) và Track tạo qua `POST /api/Tracks` (độc lập) giờ **hoàn toàn tương đương**, chỉ gắn Event. Nếu FE gửi 2 Track cùng tên lồng dưới 2 Round khác nhau, backend tạo **2 bản ghi trùng tên** (validator chỉ check trùng tên trong cùng 1 Round trong payload, không so giữa các Round).

### 2.1. Sự kiện (Event) — `EventsController`

#### 2.1.1. Tạo sự kiện (kèm cây Round→Track lồng nhau) — CreateEvent
- **Route:** `POST /api/Events` — `[Authorize]`; validator chặn: chỉ Admin hoặc user đã là EventCoordinator của Event bất kỳ từ trước.
- **Điều kiện:** `EventName+Year` không trùng; `StartDate<EndDate`; đăng ký (nếu có) nằm trong khung event; ≥1 Round bắt buộc, mỗi Round ≥1 Track; `AdvancementRule` khớp regex `^(top|percent|minScore)\s*:\s*\d+(\.\d+)?$`; Track tên duy nhất **trong cùng Round** (không so giữa các Round); mọi Template được Track tham chiếu phải tổng trọng số = 100% (check ở handler, không phải validator).
- **Kết quả:** toàn bộ trong 1 transaction; tự gán EventCoordinator cho người tạo.
- **File:** `CreateEventCommandHandler.cs:44-231`, `CreateEventCommandValidator.cs`

#### 2.1.2. Cập nhật sự kiện — UpdateEvent
- **Route:** `PUT /api/Events/{eventId}` — `[EventRoleAuthorize(EventCoordinator)]` theo đúng event.
- Thu hẹp thời gian Event không được làm Round nào "lọt ra ngoài"; giảm `MaxTeams` không được thấp hơn số đội `IsActive` hiện tại; set `Status=true` (công khai) đòi hỏi ≥1 Round có `ScoringEndDate` hợp lệ + ≥1 Track.
- **File:** `UpdateEventCommandHandler.cs:34-101`

#### 2.1.3. Xóa sự kiện — DeleteEvent
- **Route:** `DELETE /api/Events/{eventId}` — Admin, Owner (CreatedBy), hoặc EC (kiểm tra kép).
- Đã có Team đăng ký → chặn; `Status=true` → phải ẩn trước mới xóa được. Hard-delete, cascade Round/Track/Prize theo FK.
- **File:** `DeleteEventCommandHandler.cs`, `DeleteEventValidation.cs:19-29`

#### 2.1.4. Truy vấn — GetAllEvents/GetEventById/GetMyEvents/GetUpcomingEvents
- Tất cả public trừ `GetMyEvents` (`[Authorize]`, theo EventRole chưa hết hạn). `GetUpcomingEvents`: chỉ `StartDate>now && Status=true`.

### 2.2. Vòng thi (Round) — `RoundsController`

#### 2.2.1. Tạo vòng thi — CreateRound
- **Route:** `POST /api/Rounds` — `[EventRoleAuthorize(EventCoordinator)]`.
- `Start<End`, nằm trong khung Event; `ScoringStart/EndDate` không vượt `Event.EndDate`; tên & số thứ tự không trùng trong Event; `AdvancementRule` khớp regex. **Không tạo Track kèm theo** (khác luồng cũ) — Track tạo độc lập.
- **File:** `CreateRoundCommandHandler.cs:34-73`

#### 2.2.2. Cập nhật vòng thi — khóa dần theo dữ liệu đã phát sinh — UpdateRound
- **Route:** `PUT /api/Rounds/{id}`. Không đổi `EventId`.
- **Mức khóa tăng dần:** đã publish (`FinalResult`) → không đổi giờ/số thứ tự/giờ chấm. Đã có `Score` → không đổi giờ diễn ra/giờ chấm. Đã có bài nộp → không đổi số thứ tự; chỉ được **mở rộng** cửa sổ thời gian, không thu hẹp.
- **File:** `UpdateRoundCommandHandler.cs:37-124`

#### 2.2.3. Xóa vòng thi — DeleteRound
- **Route:** `DELETE /api/Rounds/{id}`.
- **🔴 KHÔNG có guard chặn xóa khi Round đã có bài nộp/kết quả** (trên `main` hiện tại) — chỉ kiểm tra quyền sở hữu rồi hard-delete ngay. Comment code còn ghi sai *"Cascade delete các Track liên quan sẽ tự động chạy"* (đã lỗi thời — Track không còn cascade theo Round). Hậu quả thực tế: Round có `SubmitResult` → **cascade xóa âm thầm** (mất bài nộp, không cảnh báo); Round có `FinalResult` → FK Restrict → **exception FK thô 500** thay vì lỗi nghiệp vụ rõ ràng.
- **Fix có sẵn nhưng CHƯA MERGE** — xem nhánh `fix/be-business-logic-bugs`.
- **File:** `DeleteRoundCommandHandler.cs:26-63`

#### 2.2.4–2.2.5. Truy vấn — GetRoundById / GetRoundsByEventId
- Public. `Round.AppealStartDate/AppealEndDate` nhận giá trị lúc tạo nhưng **không có trong Response/Update model** — ghi được nhưng không đọc/sửa lại được qua API.

### 2.3. Hạng mục thi (Track) — `TracksController`

#### 2.3.1. Tạo hạng mục — CreateTrack
- **Route:** `POST /api/Tracks` — `[EventRoleAuthorize(EventCoordinator)]`.
- Nằm trong khung Event (so với Event, không phải Round — vì Track không còn thuộc Round); tên duy nhất trong Round... **thực chất duy nhất trong Event** (không còn khái niệm Round ở Track); Template (nếu có) phải tồn tại + tổng trọng số = 100%.
- **File:** `CreateTrackCommandHandler.cs:31-83`

#### 2.3.2. Cập nhật hạng mục — UpdateTrack
- Đổi Event: đã có bài nộp → chặn hoàn toàn. Đổi Template: đã có Score → chặn hoàn toàn. Partial update — chỉ field FE gửi mới bị ghi đè.
- **File:** `UpdateTrackCommandHandler.cs:40-129`

#### 2.3.3. Xóa hạng mục — DeleteTrack
- Đã có bài nộp → chặn (tránh vỡ FK/cascade âm thầm). **Guard này CÓ ĐẦY ĐỦ trên main** (khác Round).
- **File:** `DeleteTrackCommandHandler.cs:58-64`

#### 2.3.4. Gán Template cho Track — AssignTemplateToTrack
- Kiểm tra tổng trọng số = 100%; nếu Track đã có Score và đổi TemplateId khác → chặn.
- **Kết quả:** cập nhật `Track.TemplateId`, ghi AuditLog (`AssignTemplateToTrack`).
- **File:** `AssignTemplateToTrackCommandHandler.cs:40-73`

#### 2.3.5–2.3.6. Truy vấn — GetTrackById / GetTracksByEventId
- Public, kèm Judges/Mentors (lọc từ EventRoles). ⚠️ `GetAllowedSortFields()` còn liệt kê `"RoundId"` — field không còn tồn tại, sort theo field này âm thầm không hoạt động (exception bị nuốt).

### 2.4. Mẫu tiêu chí chấm điểm (Template) — `TemplatesController`

**Quyền chung nhóm này:** `[AdminOrCoordinatorAuthorize]` — Admin **hoặc** EC ở **bất kỳ** event nào (check toàn cục, không giới hạn event cụ thể).

#### 2.4.1–2.4.2. CRUD cơ bản
- Create/Update chỉ ràng buộc tên duy nhất.
- **Delete: bất nhất phân quyền** — Controller cho Admin/EC bất kỳ, nhưng **handler tự siết còn `Admin || CreatedBy`** — một EC không phải người tạo Template sẽ bị 403 dù filter đã cho qua. Chặn nếu đang gán Track hoặc đã có ScoreDetail dùng.
- **File:** `DeleteTemplateCommandHandler.cs:38-62`

#### 2.4.3. Thêm tiêu chí — AddCriteriaToTemplate
- Chặn hoàn toàn nếu Template đã dùng chấm điểm hoặc đang gán Track (phải gỡ khỏi Track trước). Chỉ chặn khi tổng > 100% — cho phép build dần dưới 100%.

#### 2.4.4. Cập nhật Weight/MaxScore — UpdateTemplateCriteriaConfig
- Chặn hoàn toàn nếu đã dùng chấm điểm. Nếu đang gán Track: vẫn cho sửa nhưng tổng sau khi đổi **bắt buộc đúng 100%**.

#### 2.4.5. Gỡ tiêu chí — RemoveCriteriaFromTemplate
- Chặn hoàn toàn nếu đã dùng chấm điểm hoặc đang gán Track.

> **Tóm lại về ràng buộc 100%:** điểm chốt bắt buộc = 100% luôn là **thời điểm Template được gắn vào 1 Track** (qua CreateEvent lồng, CreateTrack, UpdateTrack, hoặc AssignTemplateToTrack). Sau khi gắn, cơ cấu Criteria (Add/Remove) bị khóa hoàn toàn; chỉ Update Weight/MaxScore từng tiêu chí vẫn được phép, miễn giữ tổng 100%.

### 2.5. Tiêu chí đơn lẻ (Criteria) — `CriteriasController`

- **Create:** chỉ ràng buộc trùng tên.
- **🔴 Update: KHÔNG kiểm tra Criteria đã dùng chấm điểm hay chưa** (trên `main` hiện tại) — tự do đổi tên/mô tả/IsActive dù đã có ScoreDetail tham chiếu, ảnh hưởng ngữ cảnh hiển thị của phiếu chấm lịch sử. Bất nhất với `UpdateTemplateCriteriaConfig` (đã có check). **Fix có sẵn nhưng chưa merge** (nhánh `fix/be-business-logic-bugs`).
- **Delete:** cùng bất nhất phân quyền như Template (Controller cho EC bất kỳ, handler siết `Admin || CreatedBy`); chặn nếu đang nằm trong Template nào.
- **ToggleCriteriaStatus:** đảo `IsActive` vô điều kiện, **không check ownership trong handler** (khác Delete), không ảnh hưởng Template/Track đang dùng.
- **File:** `UpdateCriteriaCommandHandler.cs:23-59`, `DeleteCriteriaCommandHandler.cs:39-56`

### 2.6. Trường học (School) — `SchoolsController`

- Không có `[Authorize]` class-level — mọi Query đều **public hoàn toàn**.
- **CreateSchool/UpdateSchool/DeleteSchool:** `[AdminAuthorize]` — chỉ Admin (chặt hơn Template/Criteria, không có khái niệm EC ở đây).
- **DeleteSchool:** chặn nếu còn User thuộc trường.
- **File:** `SEAL.Application/Features/Schools/Commands/*/*.cs`

---

## 3. Quản lý Đội thi (Teams)

### 3.0. Entity & Enum

`Team.cs:10-31`: `EventId`, `TrackId` (nullable — đội đăng ký 1 hạng mục), `Name`, `Description`, `IsActive`, `Status`, `LastRejectReason`. **Không có bảng thành viên riêng** — thành viên suy ra từ `EventRole` có `TeamId` khớp và `RoleName` là TeamLeader/TeamMember.

`TeamStatus` (`Enums/TeamStatus.cs:9-25`, giá trị int cố định, không được đổi thứ tự):
```
Forming = 0, Registered = 1, Disqualified = 2, PendingApproval = 3, Rejected = 4
```
**`Rejected(4)` là dead enum value** — khai báo nhưng không handler nào gán (đã grep toàn repo xác nhận); `RejectTeamRegistration` thực chất set `Forming`, không phải `Rejected`. Ngược lại **`Disqualified(2)` đã kích hoạt đầy đủ** bởi `DisqualifyTeam` (mục 3.5.4, mới thêm) và được nhiều handler khác chặn (CreateSubmitResult, SaveScore, GetTrackCalibration...).

### Sơ đồ trạng thái (đã cập nhật có Disqualify)

```
                 CreateTeam
                     │
                     ▼
   ┌────────────► Forming ◄────────────┐
   │                 │                  │
   │   ConfirmTeamRegistration    RejectTeamRegistration
   │   (3-5 người + đủ hồ sơ)     (Reason bắt buộc → LastRejectReason,
   │                 │              về lại Forming, KHÔNG dùng state Rejected)
   │                 ▼                  │
   │           PendingApproval ─────────┘
   │                 │
   │      ApproveTeamRegistration
   │                 ▼
   └────────────  Registered
                     │
              DisqualifyTeam (EC/Admin, Reason bắt buộc)
              → IsActive=false, xóa FinalResult nháp, audit log, email leader
                     ▼
              Disqualified  ◄── TERMINAL, không có transition đi ra
```

Roster (thành viên) **chỉ sửa được khi `Status == Forming`** — từ PendingApproval trở đi, muốn đổi người phải để EC Reject đưa đội về Forming trước.

### 3.1. Vòng đời tạo/sửa/xóa đội

#### 3.1.1. CreateTeam
- **Route:** `POST /api/Teams` — `[Authorize]`.
- Event đang trong hạn đăng ký; user `IsApproved`; không giữ vai trò EC/Judge/Mentor; chưa thuộc đội khác trong event; tên đội không trùng; số đội active < `MaxTeams`; **`TrackId` bắt buộc** (đội đăng ký 1 hạng mục ngay lúc tạo).
- **Kết quả:** tạo Team (`Status=Forming`) + tự gán EventRole(TeamLeader) cho người tạo.
- **⚠️ `CreateTeamRequestModel.LeaderId` là field chết** — handler không đọc, leader luôn = currentUserId.
- **File:** `CreateTeamCommandHandler.cs:31-133`

#### 3.1.2. UpdateTeam
- TeamLeader hoặc EC. Đội không `Forming` → chỉ EC sửa được; đổi `IsActive` chỉ EC; đổi `TrackId` chỉ khi `Forming` và chưa có SubmitResult.
- **File:** `UpdateTeamCommandHandler.cs:36-108`

#### 3.1.3. DeleteTeam
- Admin/Leader/EC. Không `Forming` → chỉ Admin/EC xóa được; đã có SubmitResult → chặn. **Trước khi xóa Team, tự xóa cứng EventRole liên quan** (FK `EventRoles.TeamId` là NO ACTION, không tự cascade — nếu bỏ bước này sẽ lỗi 500 FK).
- **File:** `DeleteTeamCommandHandler.cs:36-85`; không có Validator riêng (khác đa số Command khác trong feature).

### 3.2. Thành viên & Lời mời

#### 3.2.1. AddTeamMember (thêm trực tiếp)
- `MAX_TEAM_SIZE=5`. `Status==Forming`; user được thêm `IsApproved`, còn hạn ĐK, không giữ vai trò tổ chức, chưa ở đội khác; tổng thành viên < 5.
- **Race-guard CÓ:** đếm lại sau save, giữ 5 người theo `CreatedTime`→`Id`, người vào sau tự rút.
- **File:** `AddTeamMemberCommandHandler.cs:47-183`

#### 3.2.2. RemoveTeamMember
- Không xóa được TeamLeader qua đây; `Status==Forming`. Không gửi thông báo/email nào.
- **File:** `RemoveTeamMemberCommandHandler.cs:42-96`

#### 3.2.3. LeaveTeam
- `Status==Forming` (chặn cả PendingApproval, tránh đội tụt quân số lúc EC đang duyệt); TeamLeader không được tự rời.
- **File:** `LeaveTeamCommandHandler.cs:37-65`

#### 3.2.4. InviteTeamMember
- `INVITATION_EXPIRY_HOURS=24`. Nhánh chưa có tài khoản → tự tạo tài khoản tạm + TeamInvitation trong cùng SaveChanges; nhánh đã có tài khoản → check đủ 5 điều kiện xung đột/đầy đội.
- **File:** `InviteTeamMemberCommandHandler.cs:68-264`

#### 3.2.5. CancelTeamInvitation (đúng route "cancel invitation")
- **Route:** `DELETE /api/Teams/{teamId}/invitations/{invitationId}`. TeamLeader/EC/Admin. Chỉ hủy được `PendingAccept`/`TransferPending`. Không notify.
- **File:** `CancelTeamInvitationCommandHandler.cs:36-79`

#### 3.2.6. RespondTeamInvitation
- **Route:** `POST /api/Teams/invitations/{id}/respond?isAccepted=`. Chỉ chính người được mời; lazy-expire.
- **Nhánh Decline:** set `Declined`, in-app notify leader.
- **Nhánh Accept+TransferPending:** hoán vai Leader↔Member, `InvalidateCache` cho cả 2 người.
- **Nhánh Accept+PendingAccept:** đủ 6 điều kiện (Forming, còn hạn ĐK **tại thời điểm accept**, `IsApproved`, đủ hồ sơ SV — Decline thì không cần hồ sơ, chưa ở đội khác, chưa đầy).
- **Race-guard CÓ, đối xứng với AddTeamMember** — đếm lại sau save, người vào sau bị rút, invitation → `Expired`.
- **File:** `RespondTeamInvitationCommandHandler.cs:56-298`

#### 3.2.7. TransferTeamLeader
- Chỉ khởi tạo `TransferPending` (hoán vai thật xảy ra ở 3.2.6). Người nhận phải đang là TeamMember đúng đội. Hủy mọi `TransferPending` khác của đội trước khi tạo mới.
- **⚠️ Không gửi bất kỳ thông báo nào** (không email, không in-app) cho người được đề cử.
- **⚠️ Kết hợp bug ở 3.3.2 (GetMyTeamInvitation không trả về TransferPending)** — người được đề cử **không có cách nào qua API phát hiện** mình vừa được đề cử.
- **File:** `TransferTeamLeaderCommandHandler.cs:46-120`

### 3.3. Truy vấn

#### 3.3.1. GetTeamById
- Bảo vệ PII: chỉ Admin/thành viên/EC thấy Email/StudentCode; người ngoài chỉ thấy FullName+RoleName.

#### 3.3.2. GetMyTeamInvitation
- **🔴 Chỉ lọc `Status==PendingAccept`, KHÔNG bao gồm `TransferPending`** — bất nhất với `RespondTeamInvitation` xử lý được cả 2 loại. Có tính `effectiveStatus` lazy-expire (chỉ ở tầng đọc, không ghi ngược DB).
- **File:** `GetMyTeamInvitationQueryHandler.cs:38-55`

#### 3.3.3. GetTeamInvitations
- `[EventRoleAuthorize(EC, TeamLeader)]`. `StatusLabel` switch thiếu case cho `Cancelled`/`TransferPending` — rơi default trả tiếng Anh, không nhất quán nhãn Việt hóa.

#### 3.3.4. GetMyTeam
- Trả `Members[].HasStudentProfile` đúng điều kiện mà ConfirmTeamRegistration sẽ kiểm tra.

#### 3.3.5. GetTeamsList
- Filter `Status` nhận enum trực tiếp — dùng `status=PendingApproval` thay cho 1 endpoint "GetPendingTeams" riêng (**không tồn tại** như 1 query độc lập).

#### 3.3.6. GetMySubmissions
- Chỉ tính EventRole còn hiệu lực khi xác định đội của user.

### 3.4. Duyệt / Từ chối / Loại đội (workflow EC)

#### 3.4.1. ConfirmTeamRegistration
- `MIN=3, MAX=5`. Forming→PendingApproval; đủ 3-5 người + đủ hồ sơ SV (**đã bỏ** yêu cầu `IsApproved` từng người — chuyển sang duyệt cấp đội).
- **Kết quả:** xóa `LastRejectReason` cũ; **in-app notify** toàn đội + mọi EC của event.
- **File:** `ConfirmTeamRegistrationCommandHandler.cs:58-158`

#### 3.4.2. ApproveTeamRegistration
- Chỉ EC/Admin. PendingApproval→Registered; in-app notify + email từng thành viên.
- **File:** `ApproveTeamRegistrationCommandHandler.cs:71-114`

#### 3.4.3. RejectTeamRegistration
- Chỉ EC/Admin. `Reason` bắt buộc. PendingApproval→**Forming** (không phải Rejected); lưu `LastRejectReason`; in-app notify + email leader (HTML-encoded chống XSS).
- **File:** `RejectTeamRegistrationCommandHandler.cs:72-117`

#### 3.4.4. 🆕 DisqualifyTeam (handler hoàn toàn mới)
- **Route:** `POST /api/Teams/{teamId}/disqualify` — Admin hoặc EC của đúng event.
- **Điều kiện:** **chỉ loại được đội đang `Registered`** — Forming/PendingApproval/đã Disqualified đều bị chặn 400. `Reason` bắt buộc, tối đa 1000 ký tự.
- **Kết quả:** `Status=Disqualified`, `IsActive=false`, `LastRejectReason=Reason` (tái dùng field, phân biệt bằng Status); **xóa mọi FinalResult NHÁP** (`IsPublished=false`) của đội (không đụng SubmitResult gốc); ghi AuditLog (`DisqualifyTeam`); gửi **email** (không phải in-app) cho TeamLeader.
- **Hiệu ứng lan tỏa đã sẵn sàng ở các module khác:** CreateSubmitResult/UpdateSubmitResult/SaveScore/CreateScore/GetTrackCalibration đều đã chặn đội Disqualified.
- **⚠️ Không in-app notify** (bất nhất với Approve/Reject/Confirm). Là **state cuối** — không có "un-disqualify".
- **File:** `DisqualifyTeamCommandHandler.cs:42-111`

---

## 4. Nộp bài, Chấm điểm & Phúc khảo

### 4.0. Thay đổi cấu trúc dữ liệu quan trọng

**a) `SubmitResult` giờ có 3 URL riêng biệt** (`SubmitResult.cs:10-29`): `RepoUrl`, `DemoUrl`, `SlideUrl` — cả 3 **bắt buộc lúc Create** (validator). `SubmissionUrl` (field cũ) **vẫn giữ lại ở tầng DB** (bắt buộc NOT NULL) và luôn được đồng bộ = `RepoUrl` để tương thích ngược — không phải bug, là field legacy có chủ đích.

**b) `SubmitResult` có `RoundId` tường minh** bên cạnh `TrackId` (do Track không còn ngầm định thuộc 1 Round).

**c) Có `IGitHostingService`** — soi `RepoUrl` qua GitHub/GitLab API lúc nộp bài, lưu thêm `RepoHost/RepoFullName/RepoStars/RepoLastPush`; nếu API trả 404 (repo không tồn tại/riêng tư) → **từ chối nộp bài**; lỗi mạng/host khác → best-effort, không chặn.

### 4.1. Nộp bài dự thi (SubmitResults) — `SubmitResultsController`

#### 4.1.1. Tạo bài nộp — CreateSubmitResult
- **Route:** `POST /api/SubmitResults` — `[EventRoleAuthorize(EC, TeamLeader)]`.
- **Điều kiện đầy đủ theo thứ tự:** Team tồn tại → **không Disqualified** → `Status==Registered` → `TrackId` request phải trùng `team.TrackId` (đội chỉ nộp đúng Track đã đăng ký) → `RoundId` bắt buộc, Track/Round tồn tại, cùng `EventId` với Team → **cửa sổ nộp = `Round.StartDate/EndDate`** (KHÔNG dùng Track.EndDate — comment code giải thích rõ: Track.EndDate là deadline cả event, không dùng chặn từng vòng) → Round chưa có FinalResult nào → nếu có vòng trước, đội phải `IsAdvanced=true` ở vòng đó cùng Track → chống nộp trùng theo `(TeamId, TrackId, RoundId)` → soi GitHub/GitLab API.
- **🔴 Không có unique index DB chống race-condition** trên `(TeamId, TrackId, RoundId)` — khác `Score` có unique index + try/catch. Hai request đồng thời có thể tạo 2 SubmitResult trùng.
- **File:** `CreateSubmitResultCommandHandler.cs:37-201`

#### 4.1.2. Cập nhật bài nộp — UpdateSubmitResult
- Không sửa được nếu đã có Score; cửa sổ sửa = `Track.Start/End ?? Round.Start/End` (**có fallback Track**, khác Create); khóa nếu Round có FinalResult; đổi `IsActive` chỉ EC.
- **⚠️ `UpdateSubmitResultResponseModel` thiếu field `RoundId`** so với response của Create — không đối xứng shape.
- **File:** `UpdateSubmitResultCommandHandler.cs:35-178`

#### 4.1.3. Xóa bài nộp — DeleteSubmitResult
- Không xóa được nếu đã chấm điểm; hạn xóa theo **Round (không fallback Track)**; khóa nếu Round có FinalResult. Cho phép cả Admin (ngoài EC/Leader).
- **File:** `DeleteSubmitResultCommandHandler.cs:54-99`

#### 4.1.4. GetSubmitResultById
- **`[EventRoleAuthorize(EC, Judge, Mentor)]` — TeamLeader/TeamMember KHÔNG gọi được** (chỉ GetAll). Nếu người gọi là Judge thuần → **ẩn danh đội** (`teamName="Bài nộp ẩn danh"`, `teamId=""`).

#### 4.1.5. GetSubmitResultsList
- Phạm vi theo vai trò: Admin thấy hết; EC/Judge-Mentor cấp event thấy theo filter; **Judge/Mentor gắn Track chỉ thấy Track mình, VÀ bị ẩn danh đội** (`TeamId="", TeamName="T"+n`); còn lại chỉ thấy bài của đội mình.

### 4.2. Chấm điểm (Scores) — `ScoresController`

**Công thức chung:** `TotalScore = Σ(Value/MaxScore×Weight/100)×10`, làm tròn 2 chữ số AwayFromZero (`ScoreTotalCalculator.cs:15-31`).

#### 4.2.1. Tạo phiếu chấm — CreateScore
- EventRole phải là Judge; ownership (chủ role hoặc EC); Team không Disqualified; Judge gắn Track chỉ chấm đúng Track; chống xung đột lợi ích (không chấm đội mình); **chỉ tạo được sau khi Round kết thúc**; khóa nếu Round có FinalResult; chống trùng `(EventRoleId, SubmitResultId)`.
- **⚠️ Không có try/catch cho race-condition** (khác SaveScore).
- **File:** `CreateScoreCommandHandler.cs:27-146`

#### 4.2.2. Lưu phiếu chấm gộp — SaveScore
- **Ai:** chính Judge sở hữu hoặc EC.
- **Điều kiện đầy đủ:** EventRole phải Judge → Track phải có TemplateId → Judge gắn Track chỉ chấm đúng Track → chống xung đột lợi ích → nếu phiếu đã `IsSubmitted=true` **và không phải trường hợp phúc khảo được giao** → khóa hoàn toàn → **nếu KHÔNG phải phúc khảo được giao**, áp đủ 3 lớp khóa thời gian theo thứ tự: (a) Track/Round đã kết thúc nộp bài chưa, (b) trong cửa sổ `ScoringStart/EndDate` chưa (ưu tiên Track, fallback Round), (c) Round chưa có FinalResult → **nếu LÀ phúc khảo được giao (`Appeal.Approved` + `AssignedJudgeId` khớp) thì BỎ QUA cả 3 lớp khóa trên** → bắt buộc chấm đủ & đúng tiêu chí, mỗi giá trị ≤ MaxScore.
- **Chống double-submit:** unique index `(EventRoleId, SubmitResultId)` + try/catch `DbUpdateException`.
- Ghi AuditLog (`SaveScoreSubmitted`) **chỉ khi `IsSubmitted=true`**.
- **File:** `SaveScoreCommandHandler.cs:43-334`; index: `ScoreConfiguration.cs:20`

#### 4.2.3. UpdateScore
- Không cho đổi `SubmitResultId` (phải dùng Save). **⚠️ Lỏng hơn SaveScore đáng kể: không kiểm tra `IsSubmitted`, không kiểm tra cửa sổ ScoringStart/EndDate, không có ngoại lệ phúc khảo** — chỉ chặn theo FinalResult tồn tại. Có thể là "cửa sau" ít ràng buộc hơn.
- **File:** `UpdateScoreCommandHandler.cs:41-115`

#### 4.2.4. DeleteScore
- Admin, chủ role, hoặc EC. Khóa nếu FinalResult tồn tại. Không kiểm tra `IsSubmitted`.

#### 4.2.5. GetScoreById / GetScoreDetail / GetScoresByEventRoleId
- **⚠️ Không kiểm tra ownership trong handler** — chỉ dựa `EventRoleAuthorize(EC, Judge)` cấp Event. 1 Judge có thể xem phiếu của Judge khác trong cùng sự kiện nếu biết Id.

#### 4.2.6. GetTeamScoreBreakdown
- `[Authorize]`, permission trong handler: Admin, thành viên đội, EC, hoặc **Mentor còn hiệu lực** (gắn Track thì chỉ đội có bài trong Track đó). **Judge bị cố ý cấm** (tránh lộ điểm đồng nghiệp) — Judge chỉ xem phiếu của chính mình.
- Response: cây `TeamId → Submissions[] → JudgeScores[] → Criteria[]`, có cờ `RoundPublished`.
- **File:** `GetTeamScoreBreakdownQueryHandler.cs:16-197`

#### 4.2.7. 🆕 GetTrackCalibration (hoàn toàn mới — audit cũ từng ghi "chưa có")
- **Route:** `GET /api/Scores/track/{trackId}/calibration` — chỉ Admin/EC của Event chứa Track.
- **Tính toán:** ma trận đầy đủ (Judge × SubmitResult), kể cả ô chưa chấm; `CriteriaStats` (Mean/StdDev dân số/Min/Max) tính trên **toàn bộ ScoreDetail** (không lọc IsSubmitted); `JudgeStats` **chỉ tính trên Score có `IsSubmitted=true`** — ⚠️ 2 khối thống kê trong cùng response dùng tập dữ liệu khác nhau, cần lưu ý khi đọc.
- Phục vụ Rubric-based-Leveling (RBL): phát hiện giám khảo chấm lệch hoặc tiêu chí gây nhiễu.
- **File:** `GetTrackCalibrationQueryHandler.cs:19-178`

#### 4.2.8. 🆕 ExportScoresCsv (hoàn toàn mới — audit cũ từng ghi "chưa có")
- **Route:** `GET /api/Scores/export/{eventId}?anonymize=true|false` — Admin/EC. Trả file CSV thô (không bọc BaseResponse), UTF-8 BOM (Excel mở tiếng Việt không lỗi font).
- Mặc định `anonymize=true`: alias `TeamAlias="T1"...`, `JudgeAlias="J1"...`. Mỗi dòng = 1 (Score × ScoreDetail).
- **⚠️ Không lọc Team Disqualified** — khác `GetTrackCalibration` có lọc — 2 tính năng RBL mới không đồng nhất.
- **File:** `ExportScoresCsvQueryHandler.cs:20-179`

### 4.3. Điểm chi tiết (ScoreDetails) — `ScoreDetailsController`

Cả 3 CRUD (Create/Update/Delete) đều tự tính lại `Score.TotalScore` bằng đúng công thức chung ngay sau khi thay đổi. Khóa nếu Round có FinalResult (không kiểm tra `IsSubmitted`/cửa sổ thời gian như SaveScore). Query (GetById/GetByScoreId) không kiểm tra ownership.

### 4.4. Phúc khảo (Appeals) — `AppealsController`

Chỉ `[Authorize]` class-level — toàn bộ RBAC nằm trong handler, không dùng `EventRoleAuthorize`.

#### 4.4.1. Gửi đơn — CreateAppeal
- Chỉ TeamLeader của đội sở hữu bài. Trong khung `Round.Start/EndDate` (không fallback Track). **✅ Chặn nếu `FinalResult.IsPublished=true`** — đây là handler **DUY NHẤT** trong cả 2 module (SubmitResults/Scores lẫn Appeals) dùng đúng cờ `IsPublished` để khóa, thay vì chỉ `AnyAsync` không lọc publish như mọi handler khác. Chống gửi trùng khi đang có đơn Pending.
- **File:** `CreateAppealCommandHandler.cs:27-101`

#### 4.4.2. Duyệt/từ chối — RespondAppeal
- Admin hoặc EC của event chứa bài nộp. Chỉ phản hồi đơn Pending. Approved → gán `AssignedJudgeId` — chính field này mở khóa cho `SaveScore` (mục 4.2.2).
- **⚠️ Validator không bắt buộc `AssignedJudgeId` khi Approved** — có thể tạo đơn "Approved" nhưng không giám khảo nào được mở khóa, và không sửa lại được vì handler chặn re-respond đơn không còn Pending.
- **File:** `RespondAppealCommandHandler.cs:50-87`

#### 4.4.3–4.4.5. Truy vấn
- `GetAppealsByTeam`: Admin/EC/chính thành viên đội.
- `GetAppealsByRound`: Admin/EC/Judge-Mentor cấp event xem hết; gắn Track chỉ xem Track mình.
- `GetAssignedAppeals`: chính chủ EventRoleId hoặc EC.

### 4.5. Bảng tổng hợp cơ chế khóa theo mốc thời gian

| Mốc / trạng thái | Nộp bài | Chấm điểm | Phúc khảo |
|---|---|---|---|
| Trước `Round.StartDate` | Chặn nộp | — | Chặn gửi đơn |
| Trong `[Round.Start, Round.End]` | Create: được nộp. Update: `Track?？Round`. Delete: chỉ Round | Chặn chấm | Được gửi (nếu chưa Pending khác & chưa publish) |
| Sau `effectiveEnd` (`Track.End ?? Round.End`), trước ScoringStart | Hết hạn sửa/xóa | Chặn "chưa tới giờ chấm" | Theo khung Round riêng |
| Trong `[ScoringStart, ScoringEnd]` | — | Được chấm (nếu chưa IsSubmitted, hoặc phúc khảo được giao) | — |
| Sau ScoringEnd | — | Chặn, trừ phúc khảo được giao | — |
| `FinalResult` tồn tại cho Round (**bất kể IsPublished**) | Khóa hoàn toàn Create/Update/Delete | Khóa toàn bộ CRUD Score/ScoreDetail (trừ phúc khảo được giao trong SaveScore) | — |
| `FinalResult.IsPublished=true` | — | — | Chặn gửi đơn mới (duy nhất dùng đúng cờ IsPublished) |
| `Appeal.Approved` + `AssignedJudgeId` khớp | — | SaveScore bỏ qua mọi khóa thời gian/FinalResult cho đúng giám khảo & bài đó | Hiện trong GetAssignedAppeals |

**⚠️ Lưu ý quan trọng:** mọi khóa "Round đã có kết quả" trong SubmitResults/Scores/ScoreDetails đều dùng `FinalResult.AnyAsync(RoundId==...)` **không lọc `IsPublished`** — chỉ cần EC bấm "Tính kết quả" (tạo FinalResult nháp) là đã khóa cứng toàn bộ nộp/sửa/xóa bài và chấm/sửa/xóa điểm, kể cả khi kết quả **chưa công bố ra ngoài**. Appeals lại dùng đúng `IsPublished`. Đây là 2 ngữ nghĩa khác nhau của cùng khái niệm "khóa sau kết quả" — cần team xác nhận có phải chủ đích hay không.

---

## 5. Kết quả & Giải thưởng

### 5.1. FinalResults — `FinalResultsController`

#### 5.1.1. Tạo kết quả thủ công — CreateFinalResult
- `[EventRoleAuthorize(EC)]`. Đúng MỘT trong 3 phạm vi (RoundId|EventId|TrackId); upsert theo `(TeamId,RoundId,EventId,TrackId)`.
- **⚠️ Không kiểm tra `IsPublished`** — EC có thể tạo/ghi đè FinalResult ngay cả khi round đã công bố chính thức.
- **File:** `CreateFinalResultCommandHandler.cs:21-93`

#### 5.1.2. Cập nhật — UpdateFinalResult
- Không chuyển kết quả sang vòng của event khác; chặn trùng `(TeamId,RoundId)`.
- **⚠️ Request model chỉ hỗ trợ sửa kiểu RoundId-scope** dù Create cho phép 3 kiểu phạm vi. Không kiểm tra `IsPublished`.
- **File:** `UpdateFinalResultCommandHandler.cs:21-84`

#### 5.1.3. Xóa — DeleteFinalResult
- Admin, Owner (CreatedBy), hoặc EC (qua `RoundId`).
- **⚠️ Nếu FinalResult không có RoundId (loại Event/Track-scope)** → `isCoordinator` luôn `false` → chỉ Admin/Owner xóa được, EC thường bị khóa. Liên quan cùng gốc với bug `EventMetadataResolver` ở mục 5.4.
- **File:** `DeleteFinalResultCommandHandler.cs:26-68`

#### 5.1.4. Tính kết quả tự động — CalculateRoundResults (viết lại hoàn toàn)
- **Route:** `POST /api/FinalResults/calculate/{roundId}?topN=`. Comment đầu file: *"Xếp hạng Top N theo từng hạng mục (Track), không trung bình chéo Track."*
- **Điều kiện:** Round tồn tại & đã kết thúc (`now>EndDate`) & chưa publish → **vòng sau chưa vận hành** (không có SubmitResult/FinalResult ở Round có RoundNumber lớn hơn) → Event có ≥1 Track.
- **Thuật toán (theo từng Track độc lập):**
  - Chỉ tính team đã `Registered`, có bài nộp active trong track & round.
  - Judge hợp lệ = có `EventRole(Judge)` gắn đúng Track, còn hiệu lực.
  - Chỉ tính điểm từ Score **đã chốt** (`IsSubmitted=true`).
  - **Nếu track không có judge nào, hoặc bất kỳ submission nào còn thiếu ≥1 phiếu chấm từ judge hợp lệ → BỎ QUA TOÀN BỘ TRACK** (quy tắc "tất cả hoặc không gì"), ghi vào `skipped`.
  - Đội không nộp bài ở track vẫn được tính (`FinalScore=0`) miễn track đã đủ phiếu cho các submission tồn tại.
  - `FinalScore` = **trung bình cộng** TotalScore các phiếu đã chốt cho submission đó.
  - Xếp hạng kiểu **"1-2-2-4" (standard competition ranking)**: đồng điểm đồng hạng, hạng tiếp theo nhảy đúng số người đã đứng trước.
  - `IsAdvanced` = `Rank<=cutoffRank` (rule `top`/`percent`) hoặc `FinalScore>=minScore` (rule `minscore`).
  - Xóa **các FinalResult cũ CHƯA publish** của đúng track/round trước khi ghi mới (giữ nguyên track khác chưa sẵn sàng từ lần tính trước).
- Không có bước tính kết quả **cấp Event** (chỉ theo Track trong 1 Round) — muốn có kết quả Event-scope phải tạo thủ công qua CreateFinalResult.
- Ghi AuditLog (`CalculateRoundResults`) kèm `{count, skipped}`.
- **File:** `CalculateRoundResultsCommandHandler.cs` (toàn bộ handler, ~260 dòng)

#### 5.1.5–5.1.7. Công bố / Hủy công bố / Đặt trạng thái — 3 handler cùng tồn tại song song, KHÔNG cái nào là dead code

| Route | Handler | Hành vi |
|---|---|---|
| `POST /api/FinalResults/publish/{roundId}` | `PublishRoundResultsCommandHandler` | 1 chiều (nháp→công bố), yêu cầu đã có FinalResult, ghi AuditLog |
| `PUT /api/FinalResults/round/{roundId}/publish-status` | `SetRoundResultsPublishStatusCommandHandler` | **2 chiều**, giữ nguyên Rank/Score, đảo qua đảo lại thoải mái, **⚠️ KHÔNG ghi AuditLog** |
| `DELETE /api/FinalResults/round/{roundId}` | `UnpublishRoundResultsCommandHandler` | **Xóa cứng toàn bộ** FinalResult của round (không phải chỉ tắt cờ); có guard "vòng sau chưa vận hành"; ghi AuditLog **trước** khi xóa |

**Khác biệt bản chất:** `Unpublish` (DELETE) xóa sạch dữ liệu, buộc phải Calculate lại từ đầu; `SetPublishStatus(false)` chỉ ẩn, giữ nguyên Rank/Score, không guard vòng sau (an toàn hơn vì không hủy dữ liệu).

#### 5.1.8. Gán/gỡ giải thưởng — AssignPrize
- **Điều kiện thực tế trong code hiện tại:** Prize tồn tại; **EventId phải khớp** (resolve qua RoundId→Round.EventId hoặc TrackId→Track.EventId nếu FinalResult không có EventId trực tiếp); giới hạn `Quantity` khi đổi sang prize khác.
- **🔴 KHÔNG có điều kiện `IsPublished=true`** — đã grep toàn thư mục AssignPrize, không tìm thấy tham chiếu `IsPublished` nào. EC **có thể gán giải cho kết quả còn NHÁP**. (Có 1 fix cho việc này trên nhánh `fix/be-business-logic-bugs`, commit `453b938` — **chưa merge vào main**; nếu tài liệu cũ hơn ghi khác, đã lỗi thời so với `main` hiện tại.)
- **File:** `AssignPrizeCommandHandler.cs:20-58`, resolve EventId: `:61-81`

#### 5.1.9–5.1.11. Truy vấn
- `GetFinalResultById`: EC/Admin xem cả nháp, người khác chỉ `IsPublished=true` (404 nếu không đủ quyền xem nháp).
- `GetFinalResultsByRoundId`: tương tự, có filter `trackId`.
- `GetFinalResultsByTeamId`: **chỉ Admin** xem được nháp (không có khái niệm "EC của event này" vì lịch sử trải nhiều event).

### 5.2. Prizes — `PrizesController`

**⚠️ Phân quyền lỏng hơn FinalResults:** `[AdminOrCoordinatorAuthorize]` chỉ kiểm tra Admin hoặc **là EC ở bất kỳ event nào** — không ràng buộc theo `eventId` trên route. Một EC của Event A hoàn toàn `POST/PUT/DELETE` được giải thưởng của Event B.

- **GetPrizesByEventId:** chỉ Admin/EC xem được — **không có endpoint public** để thí sinh/giám khảo xem danh sách giải, dù `FinalResultModel.PrizeId` được trả public sau khi publish (client không map được PrizeId sang tên/giá trị nếu không phải Admin/EC).
- **CreatePrize:** chỉ check Event tồn tại.
- **UpdatePrize:** nếu hạ `Quantity` xuống dưới số đã gán hiện tại → chặn.
- **DeletePrize:** đang có FinalResult tham chiếu → chặn xóa.

### 5.3. Demo — `DemoController` (`[AdminAuthorize]`, chỉ Admin)

- **SetupDemoEvents:** dọn Event cũ tên `"[DEMO]"`, tạo Event 1 (Nộp bài) + Event 2 (Chấm điểm, 2 round với AdvancementRule `percent:50`/`top:1`), user demo cố định, team/submission mẫu.
- **SetupDemoAppealEvent:** dọn Event cũ tên `"[DEMO] Sự kiện Phúc Khảo"` (tiền tố riêng, không đụng SetupDemoEvents), tạo Event 3 (Phúc khảo) kèm 2 Score có sẵn điểm + 1 Appeal Pending mẫu.

### 5.4. Vấn đề nền tảng ảnh hưởng nhiều endpoint: `EventMetadataResolver`

`EventMetadataResolver.ResolveFromEntityAsync("FinalResults", id)` chỉ resolve `EventId` qua `finalResult.Round?.EventId` — **bỏ sót trường hợp FinalResult loại EventId/TrackId-scope** (khi không có RoundId). Hệ quả: các endpoint dùng `[EventRoleAuthorize]` với route `{id}` là FinalResultId (Update/Delete/AssignPrize) — nếu FinalResult đó là Event-scope hoặc Track-scope, filter **không resolve được `eventId` → trả lỗi 400 "EventId is required for this operation"** ngay cả với EC hợp lệ. Cần backend fix hoặc ít nhất ghi chú rõ giới hạn này khi dùng.
- **File:** `SEAL.Application/Services/EventMetadataResolver.cs:101-107`

---

## 6. Thông báo & Nhật ký hệ thống (module mới)

Hai module hoàn toàn mới, bổ sung cùng đợt với DisqualifyTeam/ExportScoresCsv/GetTrackCalibration. Cả 2 dùng chung pattern: service **không tự `SaveChangesAsync`** — phụ thuộc handler nghiệp vụ gọi sau trong cùng Unit of Work (đã kiểm tra toàn bộ điểm gọi hiện có đều làm đúng).

### 6.1. Notifications (thông báo trong app) — `NotificationsController`

**Entity `AppNotification`:** `UserId, Title (≤200 ký tự), Message (≤1000 ký tự), Type (default "info"), IsRead, LinkUrl`.

**`INotificationService`:** `NotifyAsync(userId, ...)` (bỏ qua im lặng nếu userId rỗng) và `NotifyManyAsync(userIds, ...)` (loại rỗng + Distinct rồi gọi lặp `NotifyAsync`).

#### 6.1.1. GetMyNotifications
- **Route:** `GET /api/Notifications/my-notifications` — `[Authorize]`. Trả tối đa **50** thông báo mới nhất, không phân trang, không lọc `IsRead`.

#### 6.1.2. MarkNotificationRead
- **Route:** `PUT /api/Notifications/{id}/read` — phải đúng chủ sở hữu (cố tình không phân biệt 404/403 để tránh lộ thông tin). **Không có API "mark all read" hay xóa thông báo.**

#### 6.1.3. Nơi phát sinh notification (đã grep toàn repo)
Chỉ 5 điểm gọi, **toàn bộ đều thuộc luồng Teams** — chưa có nơi nào trong FinalResults/Prizes gọi:

| Handler | Trigger | Người nhận |
|---|---|---|
| `RejectTeamRegistrationCommandHandler` | EC từ chối đội | TeamLeader |
| `RespondTeamInvitationCommandHandler` (decline) | Member từ chối lời mời | TeamLeader |
| `RespondTeamInvitationCommandHandler` (accept thường) | Member gia nhập | TeamLeader |
| `ConfirmTeamRegistrationCommandHandler` | Đội chốt danh sách | Toàn đội + mọi EC của event |
| `ApproveTeamRegistrationCommandHandler` | EC duyệt đội | Toàn đội |

**⚠️ Kết luận:** công bố kết quả, gán giải thưởng, loại đội (chỉ gửi email) đều **KHÔNG tạo thông báo in-app** cho đội thi dù hạ tầng đã sẵn sàng.

### 6.2. AuditLogs (nhật ký kiểm tra) — `AuditLogsController`

**Entity `AuditLog`:** `EventId? (nullable), ActorUserId, Action, EntityType, EntityId, Summary? (≤500 ký tự), PayloadJson? (≤4000 ký tự, camelCase)`. Comment: *"Chỉ ghi append-only: Unpublish/tính lại xóa FinalResult nên cần dấu vết riêng."*

**`AuditActions` hằng định nghĩa sẵn:** `DisqualifyTeam, CalculateRoundResults, PublishRoundResults, UnpublishRoundResults, SaveScoreSubmitted, AssignTemplateToTrack`.

#### 6.2.1. GetAuditLogs
- **Route:** `GET /api/AuditLogs?eventId=...` — `[EventRoleAuthorize(EC)]`, `eventId` **bắt buộc**; double-check quyền trong handler (defense-in-depth). Join thêm `ActorName` (1 query IN, tránh N+1).

#### 6.2.2. Nơi phát sinh audit log (đã grep toàn repo) — đúng 6 điểm

| Handler | Action | EntityType | Khi nào |
|---|---|---|---|
| CalculateRoundResults | `CalculateRoundResults` | Round | Sau khi tính xong, kèm `{count, skipped}` |
| PublishRoundResults | `PublishRoundResults` | Round | Sau khi publish, kèm `{count}` |
| UnpublishRoundResults | `UnpublishRoundResults` | Round | **Trước** khi xóa, kèm `{count, publishedCount}` |
| AssignTemplateToTrack | `AssignTemplateToTrack` | Track | Sau khi gán, kèm `{previousTemplateId, newTemplateId}` |
| DisqualifyTeam | `DisqualifyTeam` | Team | Sau khi loại, kèm `{reason}` |
| SaveScore | `SaveScoreSubmitted` | Score | **Chỉ khi** `IsSubmitted=true`, kèm `{TeamId, TrackId, TotalScore}` |

**⚠️ `SetRoundResultsPublishStatus` (API 2 chiều mới) KHÔNG ghi audit log** — thiếu nhất quán với 2 API "song sinh" (Publish/Unpublish) đều ghi. Toàn bộ Create/Update/Delete/AssignPrize của FinalResults và toàn bộ Prizes cũng không ghi audit log.

---

## 7. Tổng hợp các vấn đề phát hiện được

> Xếp theo mức độ nghiêm trọng giảm dần. Toàn bộ đã xác nhận bằng cách đọc trực tiếp code hiện tại (`main`, commit `306cf96`) hoặc đối chiếu với nhánh fix chưa merge — không suy đoán.

### 🔴 Nghiêm trọng — bug thật hoặc lỗ hổng bảo mật

| # | Vấn đề | File |
|---|---|---|
| 1 | **`Round.Tracks` là navigation "ma"** — shadow FK không property nào set khiến `GET /api/Events/{id}` trả `Rounds[].Tracks[]` LUÔN RỖNG cho mọi Track tạo sau migration restructure. Client phải dùng `GET /api/Tracks/event` thay vì đọc cấu trúc lồng. | `GetEventByIdQueryHandler.cs:27-28`, `DatabaseContextModelSnapshot.cs:1501-1503` |
| 2 | **`DeleteRoundCommandHandler` không guard chặn xóa Round đã có bài nộp/kết quả** trên `main` — hard-delete vô điều kiện, cascade xóa âm thầm SubmitResult hoặc ném lỗi FK thô 500. **Fix có sẵn, chưa merge** (nhánh `fix/be-business-logic-bugs`, commit `453b938`). | `DeleteRoundCommandHandler.cs:26-63` |
| 3 | **`UpdateCriteriaCommandHandler` không chặn sửa khi Criteria đã dùng chấm điểm** trên `main` — bất nhất với `UpdateTemplateCriteriaConfig`. **Fix có sẵn, chưa merge.** | `UpdateCriteriaCommandHandler.cs:23-59` |
| 4 | **`AssignPrizeCommandHandler` không kiểm tra `IsPublished`** trên `main` — có thể gán giải cho kết quả còn nháp. **Fix có sẵn, chưa merge.** | `AssignPrizeCommandHandler.cs:20-58` |
| 5 | **`GetAllUserRejections`/`GetUserRejectionsByUserId` hoàn toàn không kiểm tra quyền** — bất kỳ user đăng nhập nào đọc được toàn bộ lịch sử từ chối (lý do + danh tính người từ chối) của mọi người dùng. | `GetAllUserRejectionsQueryHandler.cs:24-56`, `GetUserRejectionsByUserIdQueryHandler.cs:22-45` |
| 6 | **Không có unique index chống race-condition nộp bài trùng** trên `SubmitResult(TeamId,TrackId,RoundId)` — khác Score đã có unique index + xử lý exception. | `SubmitResultConfiguration.cs` |
| 7 | **`PrizesController` không ràng buộc theo `eventId`** — EC của Event A sửa/xóa được giải thưởng của Event B. | `AdminOrCoordinatorAuthorizationFilter.cs:39-43` |
| 8 | **`EventMetadataResolver` bỏ sót FinalResult loại Event/Track-scope** — EC hợp lệ bị 400 "EventId is required" khi Update/Delete/AssignPrize trên các FinalResult không có RoundId. | `EventMetadataResolver.cs:101-107` |
| 9 | **`GetScoreById`/`GetScoreDetail`/`GetScoresByEventRoleId`/`GetScoreDetailById`/`GetScoreDetailsByScoreId` không kiểm tra ownership** — 1 Judge xem được phiếu/điểm chi tiết của Judge khác trong cùng sự kiện. | Các file `Get*QueryHandler.cs` tương ứng trong `Scores`/`ScoreDetails` |
| 10 | **`GetEventRolesBy*`, `CheckUserHasRoleInEvent`, `GetUserRoleInEvent`, `GetUsersByRoleInEvent` không giới hạn quyền xem** — bất kỳ user đăng nhập nào xem được vai trò người khác ở bất kỳ event nào. | `SEAL.Application/Features/EventRoles/Queries/**` |

### 🟡 Trung bình — bất đối xứng logic / thiếu ràng buộc / UX

| # | Vấn đề | File |
|---|---|---|
| 11 | **`UpdateScoreCommandHandler` lỏng hơn `SaveScore` đáng kể** — không kiểm tra `IsSubmitted`, không kiểm tra cửa sổ chấm điểm, không có ngoại lệ phúc khảo. | `UpdateScoreCommandHandler.cs:107-115` |
| 12 | **Mọi khóa "Round đã có kết quả" (SubmitResults/Scores) dùng `AnyAsync` không lọc `IsPublished`** — chỉ cần Calculate (tạo FinalResult nháp) là khóa cứng toàn bộ, kể cả khi chưa công bố. Appeals lại dùng đúng `IsPublished`. Cần xác nhận có phải chủ đích. | Nhiều handler SubmitResults/Scores |
| 13 | **`CreateFinalResult`/`UpdateFinalResult`/`DeleteFinalResult` không kiểm tra `IsPublished`** — EC sửa/xóa/tạo đè kết quả đã công bố chính thức bằng CRUD thủ công, phá vỡ bất biến mà Calculate/Unpublish đang bảo vệ nghiêm ngặt. | `CreateFinalResultCommandHandler.cs`, `UpdateFinalResultCommandHandler.cs`, `DeleteFinalResultCommandHandler.cs` |
| 14 | **`SetRoundResultsPublishStatus` không ghi AuditLog** — thiếu nhất quán với Publish/Unpublish "song sinh". | `SetRoundResultsPublishStatusCommandHandler.cs` |
| 15 | **`GetMyTeamInvitation` không trả về `TransferPending`**, chỉ `PendingAccept` — người được đề cử làm leader mới không phát hiện được lời mời qua endpoint "của tôi". Kết hợp với #16 thành gap kép. | `GetMyTeamInvitationQueryHandler.cs:38-55` |
| 16 | **`TransferTeamLeaderCommandHandler` không gửi bất kỳ thông báo nào** (không email, không in-app) cho người được đề cử. | `TransferTeamLeaderCommandHandler.cs` |
| 17 | **`DisqualifyTeam` chỉ gửi email, không in-app notify** — bất nhất với Approve/Reject/Confirm đều dùng in-app. | `DisqualifyTeamCommandHandler.cs` |
| 18 | **Notifications chưa nối vào luồng FinalResults/Prizes** — công bố kết quả/gán giải không tạo thông báo in-app cho đội thi dù hạ tầng đã sẵn sàng. | — |
| 19 | **`ResendEmailVerification` không có cooldown chống spam** — khác ForgotPassword (5 phút)/RequestUnblock (24h). | `ResendEmailVerificationCommandHandler.cs` |
| 20 | **`ChangePassword` không thu hồi RefreshToken cũ** — bất nhất với `ResetPassword` có thu hồi. | `ChangePasswordCommandHandler.cs` |
| 21 | **`UsersController.UpdateUser` gắn `[AdminAuthorize]` nhưng handler còn nhánh chết cho EventCoordinator** — code thừa gây hiểu nhầm khi đọc. | `UsersController.cs:113`, `UpdateUserCommandHandler.cs:35-43` |
| 22 | **Bất nhất phân quyền Delete Template/Criteria** — Controller cho phép EC bất kỳ, handler tự siết `Admin || CreatedBy`. | `DeleteTemplateCommandHandler.cs:38-45`, `DeleteCriteriaCommandHandler.cs:39-46` |
| 23 | **`RespondAppealCommandValidator` không bắt buộc `AssignedJudgeId` khi duyệt** — có thể tạo đơn "Approved" mà không ai được mở khóa sửa điểm, không sửa lại được. | `RespondAppealCommandValidator.cs` |
| 24 | **`ExportScoresCsv` không lọc Team Disqualified, `GetTrackCalibration` có lọc** — 2 tính năng RBL mới không đồng nhất dữ liệu. | `ExportScoresCsvQueryHandler.cs` vs `GetTrackCalibrationQueryHandler.cs` |
| 25 | **`GetTrackCalibration`: `JudgeStats` lọc `IsSubmitted`, `CriteriaStats` thì không** — 2 khối thống kê cùng response dùng tập dữ liệu khác nhau. | `GetTrackCalibrationQueryHandler.cs:116-163` |
| 26 | **Không có endpoint public xem danh sách Prize** dù `FinalResultModel.PrizeId` trả public sau publish — client không map được PrizeId sang tên/giá trị giải. | `PrizesController.cs` |
| 27 | **`CreateEvent` tạo Track lồng trong Round không lưu vết Round nào** — có thể tạo Track trùng tên nếu FE gửi trùng ở 2 Round khác nhau (validator chỉ so trong cùng 1 Round). | `CreateEventCommandHandler.cs:138-154` |
| 28 | **`DeleteFinalResult` khóa xóa EC thường với FinalResult không có RoundId** (Event/Track-scope) — chỉ Admin/Owner xóa được. | `DeleteFinalResultCommandHandler.cs:26-68` |

### 🟢 Nhẹ — dead code / field thừa / thiếu field / lệch nhãn

| # | Vấn đề | File |
|---|---|---|
| 29 | `TeamStatus.Rejected` là dead enum value — không handler nào gán; RejectTeamRegistration dùng `Forming`. | `TeamStatus.cs` |
| 30 | `CreateTeamRequestModel.LeaderId` không được handler đọc — leader luôn = currentUserId. | `CreateTeamRequestModel.cs:14` |
| 31 | `CreateUserRejectionCommandValidator` bắt buộc `RejectedBy` nhưng handler bỏ qua giá trị này. | `CreateUserRejectionCommandValidator.cs` |
| 32 | `GetTeamInvitationsQueryHandler.StatusLabel` thiếu case `Cancelled`/`TransferPending` — rơi default tiếng Anh. | `GetTeamInvitationsQueryHandler.cs:70-77` |
| 33 | `UpdateSubmitResultResponseModel` thiếu field `RoundId` so với Create — response shape không đối xứng. | `UpdateSubmitResultResponseModel.cs` |
| 34 | `Round.AppealStartDate/EndDate` ghi được lúc tạo nhưng không có trong Response/Update model — không đọc/sửa lại được qua API. | `CreateRoundCommandHandler.cs:86-87` |
| 35 | `GetTracksByEventIdQuery.GetAllowedSortFields()` còn liệt kê `"RoundId"` — field không tồn tại, sort âm thầm không hoạt động. | `GetTracksByEventIdQuery.cs:17` |
| 36 | `ToggleCriteriaStatusCommandHandler` không check ownership trong handler (khác Delete). | `ToggleCriteriaStatusCommandHandler.cs` |
| 37 | `DeleteTeamCommand` không có class Validator riêng — khác đa số Command khác cùng feature. | — |
| 38 | Comment lỗi thời trong `DeleteRoundCommandHandler` nói Track cascade theo Round — không còn đúng sau migration. | `DeleteRoundCommandHandler.cs:57` |
| 39 | Vài chuỗi lỗi bị mojibake (lỗi encoding tiếng Việt) trong `GetSubmitResultByIdQueryHandler`. | `GetSubmitResultByIdQueryHandler.cs:31,37,52,63` |
| 40 | `VerifyEmailCommandHandler.cs:40` còn sót comment nháp dạng câu hỏi, không ảnh hưởng hành vi. | — |

### ✅ Xác nhận tích cực — đã hoạt động đúng (audit cũ từng ghi "thiếu/lỗi", nay đã khắc phục)

- `ResendEmailVerification` hoạt động đầy đủ, đúng logic token/expiry 24h đồng bộ RegisterUser/VerifyEmail.
- Toàn bộ luồng mời Judge/Mentor/EC đã chuyển hẳn sang scope `Track.EventId`, không còn tham chiếu `RoundId` nào — khớp đúng migration restructure.
- Race-guard chống đầy đội đã **đối xứng** ở cả `AddTeamMember` và `RespondTeamInvitation` (trước đây có thể lệch).
- `DisqualifyTeam`, `GetTrackCalibration`, `ExportScoresCsv` — 3 tính năng từng bị audit cũ ghi "hoàn toàn chưa có" nay đã được code đầy đủ, có ràng buộc nghiệp vụ hợp lý.
- `DeleteTrackCommandHandler` **có đầy đủ** guard chặn xóa khi đã có bài nộp (khác Round, mục #2).
