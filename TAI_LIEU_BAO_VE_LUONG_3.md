# TÀI LIỆU HƯỚNG DẪN BẢO VỆ ĐỒ ÁN — LUỒNG 3 (SEAL WORKSPACE)
**Hệ Thống Quản Lý Cuộc Thi & Hackathon Toàn Diện (SEAL System)**
**Chủ đề:** *Luồng Quản Lý Đội Thi, Tuyển Thành Viên, Ghi Danh BTC, Nộp Bài, Chấm Điểm, Phúc Khảo & Trao Giải Thưởng*

---

## MỤC LỤC
1. [Tổng Quan Vị Trí & Vai Trò Của Luồng 3](#1-tổng-quan-vị-trí--vai-trò-của-luồng-3)
2. [Sơ Đồ Kịch Bản Luồng Nghiệp Vụ Hoàn Chỉnh](#2-sơ-đồ-kịch-bản-luồng-nghiệp-vụ-hoàn-chỉnh)
3. [Chi Tiết 5 Pha Nghiệp Vụ Trọng Tâm](#3-chi-tiết-5-pha-nghiệp-vụ-trọng-tâm)
   - [Pha 1: Khởi tạo đội & Chiêu mộ thành viên](#pha-1-khởi-tạo-đội--chiêu-mộ-thành-viên)
   - [Pha 2: Ghi danh & Ban Tổ Chức thẩm định hồ sơ](#pha-2-ghi-danh--ban-tổ-chức-thẩm-định-hồ-sơ)
   - [Pha 3: Nộp bài thi & Biên nhận điện tử](#pha-3-nộp-bài-thi--biên-nhận-điện-tử)
   - [Pha 4: Chấm điểm & Quy trình khiếu nại / Phúc khảo](#pha-4-chấm-điểm--quy-trình-khiếu-nại--phúc-khảo)
   - [Pha 5: Công bố kết quả chung cuộc & Thư chúc mừng trao giải](#pha-5-công-bố-kết-quả-chung-cuộc--thư-chúc-mừng-trao-giải)
4. [Hệ Thống Thông Báo Đa Kênh & Nhận Diện Huy Hiệu](#4-hệ-thống-thông-báo-đa-kênh--nhận-diện-huy-hiệu)
5. [Kiến Trúc Kỹ Thuật Frontend (React / Next.js / TanStack Query)](#5-kiến-trúc-kỹ-thuật-frontend)
6. [🔥 KIẾN TRÚC & MÃ NGUỒN BACKEND (C# .NET / EF Core / SQL Server)](#6--kiến-trúc--mã-nguồn-backend-c-net--ef-core--sql-server)
   - [6.1 Cấu trúc Controllers & Endpoints cốt lõi](#61-cấu-trúc-controllers--endpoints-cốt-lõi)
   - [6.2 Tầng Service & Business Logic xử lý nghiệp vụ](#62-tầng-service--business-logic-xử-lý-nghiệp-vụ)
   - [6.3 Mô hình Thực thể Database (EF Core Entities)](#63-mô-hình-thực-thể-database-ef-core-entities)
7. [🔥 Top 5 "Điểm Nóng" Trong Mã Nguồn Giám Khảo Thích Hỏi Nhất & Cách Chỉ Code](#7--top-5-điểm-nóng-trong-mã-nguồn-giám-khảo-thích-hỏi-nhất--cách-chỉ-code)
8. [Top 12 Câu Hỏi Phản Biện Cả FE & BE Giám Khảo Chắc Chắn Sẽ Hỏi](#8-top-12-câu-hỏi-phản-biện-cả-fe--be-giám-khảo-chắc-chắn-sẽ-hỏi)

---

## 1. TỔNG QUAN VỊ TRÍ & VAI TRÒ CỦA LUỒNG 3

Luồng 3 là **"Trái tim nghiệp vụ" (Core Business Flow)** của toàn bộ nền tảng SEAL, kết nối 4 vai trò người dùng:
1. **Thành viên đội (Team Member)**: Nhận lời mời, duyệt tham gia đội, nộp hồ sơ cá nhân.
2. **Đội trưởng (Team Leader)**: Quản lý thành viên, gửi lời mời, nộp hồ sơ ghi danh, nộp bài thi các vòng, gửi đơn phúc khảo.
3. **Cán bộ điều phối (Event Coordinator - BTC)**: Thẩm định hồ sơ, phê duyệt/trả hồ sơ, loại đội vi phạm kỷ luật, xử lý phúc khảo, công bố bảng vàng trao giải.
4. **Ban Giám Khảo (Judge)**: Đánh giá và chấm điểm bài nộp theo thang tiêu chí Rubric.

---

## 2. SƠ ĐỒ KỊCH BẢN LUỒNG NGHIỆP VỤ HOÀN CHỈNH

```
[ 1. LẬP ĐỘI (Forming) ]
  ├── Đội trưởng tạo đội (Gán quyền TeamLeader, TeamStatus = Forming)
  ├── Mời thành viên (Kiểm tra sĩ số 3–5, chống mời trùng)
  └── Thành viên chấp nhận lời mời (1-Click Join)
         │
         ▼
[ 2. GHI DANH VỚI BTC (PendingApproval) ]
  ├── Kiểm tra Checklist: Đủ 3–5 người + 100% đã nộp hồ sơ
  ├── Đội trưởng bấm "Gửi hồ sơ ghi danh" (POST /Teams/{id}/confirm-registration)
  └── BTC thẩm định:
        ├── [PHÊ DUYỆT] ──► Chuyển sang Registered (Mở cổng nộp bài)
        └── [TRẢ HỒ SƠ] ──► Kèm lý do bắt buộc (Đội cập nhật nộp lại)
         │
         ▼
[ 3. NỘP BÀI THI CÁC VÒNG (Submissions) ]
  ├── Kiểm tra thời hạn vòng thi (UTC Server Time <= Round.EndTime)
  ├── Đội trưởng nộp Link mã nguồn Repo, Slide, Video Demo
  └── Hệ thống xuất email biên nhận & thông báo chuông
         │
         ▼
[ 4. CHẤM ĐIỂM & PHÚC KHẢO (Scoring & Appeals) ]
  ├── Giám khảo chấm điểm Rubric ──► Công bố bảng điểm vòng thi
  └── Đội thi có quyền gửi "Đơn phúc khảo":
        ├── BTC Duyệt: Chấp nhận & Cập nhật điểm chính thức
        └── BTC Từ chối: Giữ nguyên điểm ban đầu kèm giải trình
         │
         ▼
[ 5. TỔNG KẾT & TRAO GIẢI (Final Awards & Public Leaderboard) ]
  ├── BTC nhấn "Công Bố Kết Quả Chung Cuộc" (PUT /FinalResults/round/{id}/publish-status)
  ├── Tự động mở Bảng Vàng Vinh Danh (Public Leaderboard)
  └── Gửi Email chúc mừng chính thức & Hướng dẫn nhận thưởng tới các đội đạt giải
```

---

## 3. CHI TIẾT 5 PHA NGHIỆP VỤ TRỌNG TÂM

### Pha 1: Khởi tạo đội & Chiêu mộ thành viên
* **Quy chuẩn sĩ số**: Đội thi phải có từ **3 đến 5 thành viên**.
* **Cơ chế gửi lời mời**:
  - Đội trưởng nhập email thí sinh cần mời.
  - Thẻ lời mời bố trí 3 tầng chống tràn chữ: Thời gian gửi + Huy hiệu `[ 🕒 Đang chờ ]` $\rightarrow$ Email đầy đủ + Họ tên $\rightarrow$ Hạn 24h + Nút `[ ✕ HỦY MỜI ]`.
* **Phía Thí sinh nhận lời mời**:
  - Khi đăng nhập, mục "Xem đội thi của tôi" tự động mở tab **[ LỜI MỜI NHẬN ĐƯỢC ]**.
  - Thao tác 1 chạm: Nhấn **`[ ✓ ĐỒNG Ý VÀO ĐỘI ]`** (hoặc `[ ✕ TỪ CHỐI ]`) để vào đội ngay.

### Pha 2: Ghi danh & Ban Tổ Chức thẩm định hồ sơ
* **Checklist xác thực trước khi gửi**:
  1. `[ ✓ ]` Sĩ số đạt chuẩn 3–5 thành viên.
  2. `[ ✓ ]` 100% thành viên trong đội đã hoàn tất nộp thông tin cá nhân (Thẻ sinh viên / Minh chứng trường đào tạo).
* **Xử lý phía Ban Tổ Chức (Coordinator)**:
  - **Phê duyệt**: Đội chuyển trạng thái sang `Registered`, cổng nộp bài thi được mở.
  - **Từ chối / Trả hồ sơ**: BTC **bắt buộc phải nhập lý do chi tiết** (ví dụ: *Thẻ sinh viên thành viên B bị mờ, sai mã sinh viên...*). Đội thi nhận được lý do này trên chuông và trang Đội thi để sửa đổi.
  - **Quy trình Loại đội (Disqualification)**: Áp dụng khi đội đã `Registered` vi phạm kỷ luật thi đấu $\rightarrow$ Chuyển trạng thái sang `Disqualified`, tước quyền nộp bài và xóa khỏi bảng xếp hạng.

### Pha 3: Nộp bài thi & Biên nhận điện tử
* **Điều kiện nộp**: Đội đã được duyệt (`Registered`) và Vòng thi đang mở nộp bài (đồng hồ đếm ngược thời gian thực).
* **Nội dung bài nộp**: Bắt buộc liên kết Repo GitHub/GitLab, Slide báo cáo (Google Drive/PDF), Video Demo sản phẩm.
* **Biên nhận**: Hệ thống tự động gửi **Biên nhận nộp bài điện tử** qua Email và Thông báo chuông với huy hiệu `[ BÀI THI ]`.

### Pha 4: Chấm điểm & Quy trình khiếu nại / Phúc khảo
* **Chấm điểm**: Ban Giám khảo chấm điểm theo thang rubric. Sau khi công bố điểm, thông báo `[ ĐIỂM THI ]` được gửi tới đội.
* **Gửi đơn phúc khảo**: Đội trưởng gửi đơn giải trình khiếu nại điểm thi.
* **Xét duyệt phúc khảo**:
  - **Chấp nhận**: BTC cập nhật lại điểm số chính thức $\rightarrow$ Thông báo `[ PHÚC KHẢO ]` (Màu xanh lục).
  - **Từ chối**: BTC giữ nguyên điểm và gửi văn bản phản hồi lý do $\rightarrow$ Thông báo `[ TỪ CHỐI ]` (Màu đỏ hoa hồng).

### Pha 5: Công bố kết quả chung cuộc & Thư chúc mừng trao giải
* **Công bố Bảng Vàng**: Coordinator chuyển trạng thái từ Bản nháp sang `[ ĐÃ CÔNG BỐ PUBLIC ]`.
* **Vinh danh & Trao giải**: Hệ thống tự động gửi **Email chúc mừng chính thức** tới toàn bộ thành viên của các đội đạt giải (Nhất, Nhì, Ba, Triển vọng...) kèm thông tin nhận giải thưởng và thông báo chuông `[ GIẢI THƯỞNG ]` (Màu vàng kim).

---

## 4. HỆ THỐNG THÔNG BÁO ĐA KÊNH & NHẬN DIỆN HUY HIỆU

| Huy Hiệu (Badge) | Màu Sắc | Nghiệp Vụ Kích Hoạt | Nội Dung Tiêu Biểu |
| :--- | :---: | :--- | :--- |
| **`[ LỜI MỜI ]`** | Xanh biển | Đội trưởng mời thí sinh vào đội | *"Đội trưởng đã mời bạn gia nhập đội. Nhấn 'Đồng ý' để vào đội ngay!"* |
| **`[ ĐANG THẨM ĐỊNH ]`** | Xanh da trời | Đội gửi hồ sơ ghi danh cho BTC | *"Hồ sơ đội đã gửi thành công. BTC đang tiến hành thẩm định."* |
| **`[ ĐÃ DUYỆT ĐỘI ]`** | Xanh lục neon | BTC duyệt hồ sơ tham gia giải đấu | *"Chúc mừng! Đội đã được duyệt chính thức. Cổng nộp bài đã mở."* |
| **`[ TRẢ HỒ SƠ ]`** | Đỏ hoa hồng | BTC từ chối/trả hồ sơ ghi danh | *"Hồ sơ chưa đạt yêu cầu kèm lý do chi tiết từ Ban Tổ Chức."* |
| **`[ BÀI THI ]`** | Xanh cyan | Đội nộp bài thi thành công | *"Biên nhận nộp bài thi: Hệ thống đã ghi nhận bài thi của đội bạn."* |
| **`[ ĐIỂM THI ]`** | Tím neon | Ban Giám khảo công bố điểm | *"Kết quả chấm điểm và nhận xét của BGK đã được công bố."* |
| **`[ PHÚC KHẢO ]`** | Vàng / Xanh | Gửi đơn hoặc Duyệt phúc khảo | *"Đã tiếp nhận đơn phúc khảo" / "Đã chấp nhận & cập nhật điểm số."* |
| **`[ BỊ LOẠI ]`** | Đỏ cảnh báo | BTC loại đội do vi phạm quy chế | *"Quyết định: Loại đội thi khỏi cuộc thi kèm lý do kỷ luật."* |
| **`[ GIẢI THƯỞNG ]`** | Vàng kim neon | Đạt giải thưởng chung cuộc | *"Chúc mừng! Đội của bạn đã xuất sắc giành giải thưởng chung cuộc!"* |

---

## 5. KIẾN TRÚC KỸ THUẬT FRONTEND

1. **Bảo Vệ Đa Tầng (Client-side Validation)**: Khóa nút, kiểm tra sĩ số, chặn trùng vai trò Judge/Mentor cùng Track, hiển thị thông báo tức thì giúp UX mượt mà.
2. **Quản Lý Trạng Thái Real-time & Cache Sync (TanStack Query)**: Tự động `invalidateQueries` khi có thao tác chấp nhận lời mời, duyệt đội, nộp bài $\rightarrow$ Dữ liệu trên toàn bộ giao diện cập nhật ngay lập tức mà không cần reload trang (`F5`).
3. **Thiết Kế Giao Diện HUD / Cyberpunk Chuyên Nghiệp**: Bố cục thẻ 3 tầng chống tràn chữ (Anti-overflow Layout) cho email dài, hệ thống Modal co giãn theo kích thước chuẩn (`sm`, `md`, `lg`, `xl`).

---

## 6. 🔥 KIẾN TRÚC & MÃ NGUỒN BACKEND (C# .NET / EF CORE / SQL SERVER)

Hệ thống Backend được xây dựng theo mô hình **Clean Architecture / 3-Layer Architecture**:

### 6.1 Cấu trúc Controllers & Endpoints cốt lõi
* **`TeamsController`**:
  - `POST /api/Teams`: Tạo đội mới $\rightarrow$ Gán `UserId` của người tạo làm `TeamLeader`, gán `TeamStatus = 0 (Forming)`.
  - `POST /api/Teams/{teamId}/invitations`: Mời thành viên $\rightarrow$ Validate sĩ số < 5, kiểm tra người được mời chưa ở trong đội nào trong sự kiện, kiểm tra chưa có active invitation.
  - `POST /api/Teams/invitations/{id}/respond`: Phản hồi lời mời $\rightarrow$ Kiểm tra `Status == PendingAccept`, thêm bản ghi vào `TeamMembers`, cập nhật trạng thái lời mời sang `Accepted`/`Declined`.
  - `POST /api/Teams/{teamId}/confirm-registration`: Gửi ghi danh $\rightarrow$ Kiểm tra đủ 3-5 người và 100% `HasStudentProfile == true`, chuyển `TeamStatus = 1 (PendingApproval)`.
  - `POST /api/Teams/{teamId}/approve-registration`: BTC duyệt $\rightarrow$ `TeamStatus = 2 (Registered)`.
  - `POST /api/Teams/{teamId}/reject-registration`: BTC trả hồ sơ $\rightarrow$ `TeamStatus = 0 (Forming)` kèm lưu `RejectReason`.
  - `POST /api/Teams/{teamId}/disqualify`: BTC loại đội $\rightarrow$ `TeamStatus = 3 (Disqualified)` kèm lưu `DisqualifyReason`, xóa điểm nháp.
* **`SubmitResultsController`**:
  - `POST /api/SubmitResults`: Nhận bài nộp $\rightarrow$ Kiểm tra `DateTime.UtcNow <= Round.EndTime`, kiểm tra `Team.Status == Registered`, kiểm tra `User == TeamLeader`.
* **`ScoresController`**:
  - `POST /api/Scores`: Giám khảo lưu điểm $\rightarrow$ Validate tổng điểm theo thang trọng số Rubric.
* **`AppealsController`**:
  - `POST /api/Appeals`: Đội trưởng gửi phúc khảo $\rightarrow$ Ghi nhận đơn khiếu nại.
  - `PUT /api/Appeals/{id}/respond`: Coordinator duyệt phúc khảo $\rightarrow$ Cập nhật lại điểm số chính thức và giải trình.
* **`FinalResultsController`**:
  - `PUT /api/FinalResults/round/{roundId}/publish-status`: Công bố kết quả $\rightarrow$ Kích hoạt `EmailService` gửi thư chúc mừng tới các đội đạt giải.

### 6.2 Tầng Service & Business Logic xử lý nghiệp vụ
* **`TeamService`**: Chứa toàn bộ nghiệp vụ kiểm tra logic:
  ```csharp
  // Ví dụ mã kiểm tra chống trùng đội trong sự kiện
  var isAlreadyInEvent = await _context.TeamMembers
      .AnyAsync(tm => tm.UserId == invitedUserId && tm.Team.EventId == eventId && tm.Team.Status != TeamStatus.Disqualified);
  if (isAlreadyInEvent)
      throw new ConflictException("Thí sinh này đã tham gia một đội thi khác trong cùng sự kiện.");
  ```
* **`SubmissionService`**: Kiểm tra deadline theo UTC server time:
  ```csharp
  if (DateTime.UtcNow > round.EndTime)
      throw new BadRequestException("Thời gian nộp bài của vòng thi này đã kết thúc.");
  ```
* **`EmailService` & `NotificationService`**: Gửi email qua SMTP (`System Seal Hackathon`) bất đồng bộ (Async Background Task) để không làm nghẽn API response.

### 6.3 Mô hình Thực thể Database (EF Core Entities)
* **`Teams`**: `Id`, `Name`, `EventId`, `Status` (Enum: 0-Forming, 1-PendingApproval, 2-Registered, 3-Disqualified), `Description`, `CreatedAt`, `CreatedBy`.
* **`TeamMembers`**: `TeamId`, `UserId`, `Role` (Enum: Leader, Member), `JoinedAt`. Khóa chính phức hợp (`Composite Key: TeamId + UserId`).
* **`TeamInvitations`**: `Id`, `TeamId`, `InvitedUserId`, `InvitedByUserId`, `Status` (Enum: PendingAccept, Accepted, Declined, Expired), `ExpiresAt`, `CreatedAt`.
* **`SubmitResults`**: `Id`, `TeamId`, `RoundId`, `RepoUrl`, `SlideUrl`, `VideoUrl`, `SubmittedAt`, `Status`.
* **`Appeals`**: `Id`, `SubmitResultId`, `RequestedByUserId`, `Reason`, `Status` (Pending, Approved, Rejected), `Response`, `RespondedByUserId`.
* **`Notifications`**: `Id`, `UserId`, `Title`, `Message`, `Type`, `IsRead`, `CreatedAt`.

---

## 7. 🔥 TOP 5 "ĐIỂM NÓNG" TRONG MÃ NGUỒN GIÁM KHẢO THÍCH HỎI NHẤT & CÁCH CHỈ CODE

### 📍 Điểm Nóng 1: Điều Kiện Ghi Danh & Kiểm Tra Thẻ Sinh Viên
* 📁 **Vị trí FE**: `src/components/domain/team/RegistrationChecklist.tsx` (Dòng 13–22)
* 📁 **Vị trí BE**: `TeamsController.cs` $\rightarrow$ Endpoint `confirm-registration`
* ❓ **Câu hỏi**: *"Em làm thế nào để đảm bảo đội đủ điều kiện mới gửi được hồ sơ cho BTC? Nếu 1 thành viên chưa nộp thẻ sinh viên thì hệ thống xử lý sao?"*
* 💡 **Trả lời**: *"Hệ thống kiểm tra ở 2 tầng: Ở FE, hàm `buildRequirements` kiểm tra `memberCount >= 3 && memberCount <= 5` và `membersWithoutProfile.length === 0`, nếu thiếu sẽ khóa nút gửi. Ở BE, API `confirm-registration` truy vấn DB kiểm tra toàn bộ thành viên trong đội có thẻ sinh viên hợp lệ mới cho chuyển sang trạng thái `PendingApproval`."*

---

### 📍 Điểm Nóng 2: Chống Trùng Lời Mời & Chống 1 Người Tham Gia 2 Đội
* 📁 **Vị trí FE**: `src/components/domain/team/InvitePanel.tsx` (Dòng 45–55)
* 📁 **Vị trí BE**: `TeamService.cs` $\rightarrow$ Hàm `InviteMemberAsync`
* ❓ **Câu hỏi**: *"Nếu 2 Đội trưởng cùng mời 1 thí sinh, hoặc 1 Đội trưởng bấm mời liên tục nhiều lần thì hệ thống chống xung đột thế nào?"*
* 💡 **Trả lời**: *"Ở FE, hệ thống tính `isPotentialFull` để khóa form khi tổng thành viên + lời mời pending đạt tối đa 5. Ở BE, `TeamService` kiểm tra `UserId` có đang trong đội khác cùng `EventId` hoặc đã có `TeamInvitation` ở trạng thái `PendingAccept` chưa. Nếu có, BE ném `ConflictException (409)`."*

---

### 📍 Điểm Nóng 3: Vòng Đời Trạng Thái Đội Thi (Pending vs Registered vs Disqualified)
* 📁 **Vị trí FE**: `src/views/CoordinatorTeamsView.tsx` (Dòng 115–143 & Dòng 605–640)
* 📁 **Vị trí BE**: `TeamsController.cs` $\rightarrow$ Các endpoint `approve-registration`, `reject-registration`, `disqualify`
* ❓ **Câu hỏi**: *"Phân biệt giữa 'Từ chối / Trả hồ sơ' và 'Loại đội (Disqualify)'? Tại sao thao tác này bắt buộc phải nhập lý do?"*
* 💡 **Trả lời**: 
  - *"**Trả hồ sơ** áp dụng cho đội `PendingApproval` khi hồ sơ chưa đạt. BTC ghi lý do để đội **sửa lại và nộp lại**."*
  - *"**Loại đội (Disqualify)** áp dụng cho đội `Registered` vi phạm kỷ luật. Khi bị loại, BE chuyển trạng thái sang `Disqualified`, **hủy kết quả chấm và tước quyền nộp bài**."*
  - *"Cả 2 modal đều có `disabled={!reason.trim()}` ở FE và validate `string.IsNullOrWhiteSpace(reason)` ở BE để đảm bảo tính minh bạch."*

---

### 📍 Điểm Nóng 4: Đồng Bộ Dữ Liệu Tức Thì Không Cần Reload F5 (React Query Cache Invalidation)
* 📁 **Vị trí FE**: `src/components/domain/NotificationBell.tsx` (Dòng 300–310)
* ❓ **Câu hỏi**: *"Khi thí sinh bấm 'Đồng ý vào đội' ngay tại Chuông thông báo, làm sao trang Đội thi cập nhật ngay mà người dùng không cần bấm F5?"*
* 💡 **Trả lời**: *"Em sử dụng cơ chế `queryClient.invalidateQueries` của TanStack Query với các key `['my-team']`, `['my-notifications']`. Ngay khi API trả kết quả 200 OK, React Query tự động kích hoạt refetch ngầm và cập nhật UI tức thì."*

---

### 📍 Điểm Nóng 5: Chống Gian Lận Giờ Nộp Bài (Deadline Enforcement)
* 📁 **Vị trí FE**: `src/views/NewSubmissionView.tsx`
* 📁 **Vị trí BE**: `SubmissionService.cs` $\rightarrow$ Hàm `CreateSubmissionAsync`
* ❓ **Câu hỏi**: *"Nếu thí sinh chỉnh lùi đồng hồ máy tính cá nhân để nộp bài sau khi hết hạn thì hệ thống có nhận bài không?"*
* 💡 **Trả lời**: *"Dạ không thể. Đồng hồ đếm ngược ở FE chỉ để hiển thị cho người dùng. Ở BE, `SubmissionService` luôn lấy thời gian thực của Server `DateTime.UtcNow` so sánh với `Round.EndTime`. Nếu server time đã vượt quá deadline, BE sẽ từ chối và trả về lỗi `400 Bad Request`."*

---

## 8. TOP 12 CÂU HỎI PHẢN BIỆN CẢ FE & BE GIÁM KHẢO CHẮC CHẮN SẼ HỎI

### 🎯 NHÓM 1: CÂU HỎI VỀ BACKEND & KIẾN TRÚC HỆ THỐNG

#### ❓ **Câu 1:** *"Code Backend của em tổ chức theo kiến trúc gì? Luồng xử lý một request đi qua những tầng nào?"*
> 💡 **Trả lời:**
> *"Dạ Backend nhóm em xây dựng theo mô hình **Clean Architecture / 3-Layer Architecture** gồm 3 tầng chính:
> 1. **Presentation Layer (Controllers)**: Tiếp nhận HTTP Request, validate định dạng DTO và phân quyền bằng JWT Authorization.
> 2. **Application / Business Logic Layer (Services)**: Thực thi logic nghiệp vụ (kiểm tra sĩ số, deadline, xung đột vai trò).
> 3. **Infrastructure / Data Access Layer (EF Core & DbContext)**: Tương tác với cơ sở dữ liệu SQL Server thông qua LINQ queries."*

---

#### ❓ **Câu 2:** *"Nếu 2 người cùng bấm thao tác 1 lúc (Race Condition), BE xử lý thế nào để không bị sai dữ liệu?"*
> 💡 **Trả lời:**
> *"Ở BE, bọn em áp dụng 2 cơ chế:
> 1. **Database Constraints**: Đặt Unique Index trên bảng `TeamMembers` cho cặp `(TeamId, UserId)` và `TeamInvitations` để ngăn chặn trùng lặp ở tầng DB.
> 2. **Database Transactions**: Sử dụng `using var transaction = await _context.Database.BeginTransactionAsync()` trong các nghiệp vụ gồm nhiều bước (như chấp nhận lời mời vừa thêm member vừa cập nhật invitation), đảm bảo tính toàn vẹn dữ liệu (ACID)."*

---

#### ❓ **Câu 3:** *"Phân quyền (Authorization) ở BE được thực hiện ra sao để ngăn thí sinh gọi trộm API của Ban Tổ Chức?"*
> 💡 **Trả lời:**
> *"BE sử dụng cơ chế **Role-based & Policy-based Authorization** kết hợp JWT Token. Trên mỗi Controller hoặc Action method, bọn em khai báo thuộc tính ví dụ `[Authorize(Roles = "EventCoordinator, Admin")]`. Khi request gửi lên, Middleware sẽ giải mã JWT claims, nếu role không thỏa mãn sẽ tự động trả về `403 Forbidden` trước khi vào được tầng Service."*

---

#### ❓ **Câu 4:** *"Quy trình gửi Email biên nhận và Email chúc mừng trao giải có làm chậm thời gian phản hồi của API không?"*
> 💡 **Trả lời:**
> *"Dạ không. Để tối ưu hiệu năng và tránh nghẽn request, tác vụ gửi email được tách riêng và thực thi bất đồng bộ thông qua **Background Tasks (Asynchronous Processing / Task.Run)**. API sau khi lưu dữ liệu vào database sẽ trả về kết quả 200 OK ngay lập tức cho client trong vài chục mili-giây, trong khi email được gửi ngầm."*

---

### 🎯 NHÓM 2: CÂU HỎI VỀ LOGIC NGHIỆP VỤ & TRƯỜNG HỢP NGOẠI LỆ (EDGE CASES)

#### ❓ **Câu 5:** *"Sự khác biệt giữa 'Từ chối / Trả hồ sơ' và 'Loại đội (Disqualify)' là gì?"*
> 💡 **Trả lời:**
> * **Trả hồ sơ (Reject)**: Áp dụng cho đội **đang chờ duyệt (`PendingApproval`)**. BTC bắt buộc ghi lý do (ví dụ: *thẻ sinh viên mờ, sai thông tin*) để đội **sửa lại hồ sơ và nộp lại**.
> * **Loại đội (Disqualify)**: Áp dụng cho đội **đã được duyệt (`Registered`) và đang thi đấu**. Khi đội vi phạm kỷ luật (ví dụ: *gian lận, đạo nhái bài thi*), BTC loại đội sẽ **tước quyền nộp bài vĩnh viễn, hủy kết quả chấm và gạch tên khỏi Bảng xếp hạng**.

---

#### ❓ **Câu 6:** *"Nếu đội có 3 thành viên nhưng 1 người chưa nộp thẻ sinh viên thì có gửi hồ sơ ghi danh cho BTC được không?"*
> 💡 **Trả lời:**
> *"Dạ **KHÔNG THỂ**. Hệ thống có Checklist tự động kiểm tra: Bắt buộc đủ 3–5 người **VÀ** 100% thành viên phải hoàn tất nộp thẻ sinh viên/hồ sơ thì nút 'Gửi hồ sơ ghi danh' mới được kích hoạt."*

---

#### ❓ **Câu 7:** *"Nếu 2 Đội trưởng cùng gửi lời mời tới 1 bạn sinh viên, bạn đó đồng ý đội A rồi thì lời mời của đội B xử lý ra sao?"*
> 💡 **Trả lời:**
> *"Khi sinh viên bấm 'Đồng ý' vào đội A, hệ thống cập nhật sinh viên đó vào đội A. Khi quay lại bấm lời mời đội B, Backend sẽ kiểm tra thấy sinh viên này đã thuộc về 1 đội trong sự kiện và **trả lỗi 409 Conflict**, đồng thời thông báo cho sinh viên biết họ đã có đội."*

---

#### ❓ **Câu 8:** *"Thí sinh có thể chỉnh lại đồng hồ trên máy tính để nộp bài sau khi hết hạn (Deadline) không?"*
> 💡 **Trả lời:**
> *"Dạ **KHÔNG THỂ**. Đồng hồ đếm ngược ở Frontend chỉ để hiển thị cho người dùng. Khi gửi bài, Backend luôn lấy thời gian thực của Server (`UTC / Server Time`) so sánh với thời hạn kết thúc vòng thi (`Round.EndTime`). Nếu quá hạn dù chỉ 1 giây, Backend sẽ từ chối nhận bài."*

---

### 🎯 NHÓM 3: CÂU HỎI VỀ PHÂN QUYỀN & THÔNG BÁO ĐA KÊNH

#### ❓ **Câu 9:** *"Trong đội, thành viên thường (Member) có quyền nộp bài thi hoặc gửi đơn phúc khảo không?"*
> 💡 **Trả lời:**
> *"Dạ **CHỈ CÓ ĐỘI TRƯỞNG (Team Leader)** mới có quyền đại diện đội nộp link bài thi, nộp hồ sơ ghi danh và gửi đơn phúc khảo. Thành viên thường chỉ có quyền xem trạng thái và nhận thông báo."*

---

#### ❓ **Câu 10:** *"Một Giảng viên có thể vừa làm Giám khảo (Judge) vừa làm Cố vấn (Mentor) cho cùng 1 Hạng mục (Track) không?"*
> 💡 **Trả lời:**
> *"Dạ **KHÔNG ĐƯỢC PHÉP**. Để đảm bảo tính công bằng và tránh xung đột lợi ích, hệ thống đã chặn xung đột chéo: Cùng 1 Track thi, 1 nhân sự chỉ được đảm nhiệm vai trò Giám khảo HOẶC Cố vấn, không thể cùng lúc giữ cả hai."*

---

#### ❓ **Câu 11:** *"Khi Ban Tổ Chức chấp nhận đơn phúc khảo và sửa điểm, Bảng xếp hạng có tự cập nhật không?"*
> 💡 **Trả lời:**
> *"Dạ có. Khi Coordinator xác nhận sửa điểm phúc khảo, hệ thống kích hoạt cơ chế `invalidateQueries` của React Query để làm mới lại dữ liệu điểm số, tự động tính lại thứ hạng và gửi thông báo chuông `[ PHÚC KHẢO ]` (màu xanh lục) tới đội thi."*

---

#### ❓ **Câu 12:** *"Khi có kết quả chung cuộc, các đội đạt giải nhận thông tin qua những kênh nào?"*
> 💡 **Trả lời:**
> *"Hệ thống thông báo đa kênh đồng thời:*
> 1. *Gửi **Email chúc mừng chính thức** tới toàn bộ thành viên trong đội đạt giải kèm hướng dẫn nhận thưởng.*
> 2. *Gửi **Thông báo chuông** với huy hiệu `[ GIẢI THƯỞNG ]` màu vàng kim.*
> 3. *Mở công khai **Bảng Vàng Danh Dự (Public Leaderboard)** trên trang chủ sự kiện cho toàn thể khán giả và thí sinh theo dõi."*

---
*Chúc bạn có một buổi bảo vệ đồ án thành công rực rỡ và đạt điểm A+ tuyệt đối!* 🚀
