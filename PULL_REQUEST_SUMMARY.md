# 🚀 Pull Request Summary: Scoped Roles & Comprehensive Event Management

## 📌 Branch Information
- **Branch**: `feature/admin-role-and-event-actions`
- **Target Branch**: `dev`
- **Modules Impacted**: `seal-fe` (Frontend Next.js 16)

---

## 🎯 1. Mục Tiêu & Bối Cảnh (Context & Objectives)
1. **Phân Quyền Theo Phạm Vi Sự Kiện (Event-Scoped Roles)**:
   - Các vai trò như **Event Coordinator (EC), Giám Khảo (Judge), Cố Vấn (Mentor)** và **Thí Sinh (TeamLeader/Member)** được phân định rõ ràng theo từng sự kiện (`eventId`).
   - Khắc phục triệt để lỗi người dùng được gán EC/Judge ở Sự kiện A nhưng khi mở Sự kiện B vẫn bị hiển thị các nút điều hành đặc quyền (phải hiển thị là **"CHƯA THAM GIA SỰ KIỆN NÀY"**).
2. **Khắc phục quyền cấu hình sự kiện cho EC & Admin**:
   - Xử lý đồng bộ dữ liệu `roleName` (`EventCoordinator` <-> `Coordinator`) và gỡ cờ `IsAdmin: true` gán nhầm cho tài khoản mẫu EC (`ec_demo@yopmail.com`).
   - Cấp quyền cho EC truy cập và điều phối toàn bộ các phân hệ trong sự kiện được chỉ định.
3. **Hợp Nhất Chỉnh Sửa Toàn Diện & Tinh Gọn Trải Nghiệm Người Dùng (Unified Event Management Modal)**:
   - Thay thế việc phân mảnh cấu hình (trước đây phải bấm "Xem chi tiết" rồi bấm sửa từng Phase 1 -> 5 ở từng vòng thi) bằng **1 Modal Chỉnh Sửa Toàn Diện duy nhất (`ComprehensiveEventEditModal`)**.
   - Cho phép Admin và EC chỉnh sửa toàn bộ thông tin sự kiện, thời gian tuyển sinh (Phase 0), và tất cả các vòng thi với đầy đủ 5 Phase ngay từ Dashboard bên ngoài chỉ với 1 nút lưu duy nhất.
   - Tinh gọn triệt để các nút bấm thừa thãi trên Banner "Sự kiện của tôi" và thẻ vòng thi.

---

## 🛠️ 2. Chi Tiết Các Thay Đổi & File Sửa Đổi (Key Changes)

### 📁 A. Component Mới
- **[`src/components/domain/ComprehensiveEventEditModal.tsx`](src/components/domain/ComprehensiveEventEditModal.tsx)**:
  - **Tab 1 (Thông Tin Sự Kiện & Tuyển Sinh)**: Tên sự kiện, mùa giải, năm, số đội tối đa, ngày bắt đầu/kết thúc sự kiện, khung giờ mở/khóa nhận hồ sơ đăng ký đội thi (Phase 0), mô tả sự kiện.
  - **Tab 2 (Vòng Thi & Timeline Phase 1 → 5)**: CRUD các vòng thi (`rounds`), chỉnh sửa trực quan từng Phase:
    - *Phase 1 & 2*: Mở đề & Hạn chót nộp bài thi (Deadline).
    - *Phase 3*: Thời gian hội đồng giám khảo chấm điểm & đánh giá.
    - *Phase 4 & 5*: Mở bảng xếp hạng công khai & Khung giờ tiếp nhận phúc khảo.
  - Tích hợp nút **"💾 LƯU TOÀN BỘ THAY ĐỔI"** gọi song song API cập nhật sự kiện và vòng thi trong 1 thao tác.

### 📁 B. Tối Ưu Phân Quyền & UI Workspaces
- **[`src/views/EventDetailView.tsx`](src/views/EventDetailView.tsx)**:
  - Phân quyền động theo `eventId`: Xác định chính xác quyền hạn của user đối với sự kiện đang xem (`Coordinator`, `Judge`, `Mentor`, `TeamLeader`, `TeamMember`, `Guest`).
  - Thanh Role Action Strip điều hướng chính xác vào Workspace tương ứng (`Control Center BTC`, `Bàn Chấm Giám Khảo`, `Đội Thi Của Tôi`).
  - Gỡ bỏ các nút lặp lại `[ ⚙ Sửa Phase 1 -> 5 ]` ở từng thẻ vòng thi.
  - Bổ sung nút tập trung `[ ⚙️ Chỉnh Sửa Sự Kiện & Lộ Trình ]` cho Admin & EC.
- **[`src/views/EventsDiscoveryView.tsx`](src/views/EventsDiscoveryView.tsx)**:
  - Tinh gọn Banner "⭐ SỰ KIỆN CỦA TÔI": gỡ bỏ nút xem phụ, giữ lại 1 nút hành động chính duy nhất (`🎯 CONTROL CENTER BTC ➔`, `⚖ VÀO BÀN CHẤM ➔`, `👥 ĐỘI THI CỦA TÔI ➔`).
  - Bổ sung huy hiệu phân vai trò trên từng card sự kiện: `👑 BAN TỔ CHỨC`, `⚖ GIÁM KHẢO`, `💼 CỐ VẤN`, `👥 ĐÃ THAM GIA`.
- **[`src/views/AdminDashboardView.tsx`](src/views/AdminDashboardView.tsx)**:
  - Tích hợp `ComprehensiveEventEditModal` vào nút `✏️ Sửa` trong bảng danh sách sự kiện.
- **[`src/components/domain/NavigationBar.tsx`](src/components/domain/NavigationBar.tsx) & [`src/providers/AuthProvider.tsx`](src/providers/AuthProvider.tsx)**:
  - Chuẩn hóa đồng bộ `roleName` và cập nhật quyền hiển thị menu điều hướng.

---

## 🧪 3. Báo Cáo Kiểm Thử CI/CD & Build Sanity

| Hạng mục kiểm tra | Kết quả | Ghi chú |
| :--- | :---: | :--- |
| **TypeScript Compilation (`tsc --noEmit`)** | ✅ **PASSED (0 errors)** | Tất cả types, props và ViewModel đều hợp lệ 100% |
| **Next.js Production Build (`npm run build`)** | ✅ **PASSED (0 errors)** | Tạo bundle tĩnh và dynamic routes thành công |
| **Kiểm tra Xung đột Git (Merge/Conflict Check)** | ✅ **SẴN SÀNG** | Sẵn sàng tích hợp mượt mà vào nhánh `dev` |
| **E2E Visual & UX Sanity** | ✅ **PASSED** | Đăng nhập EC/Admin/Judge, banner và modal hoạt động chuẩn xác |

---

## 👥 4. Hướng Dẫn Reviewer Test Nhanh
1. Đăng nhập với tài khoản EC: `ec_demo@yopmail.com` (mật khẩu test: `Bl3w@2026`).
2. Mở `/vi/events`:
   - Xem banner "Sự kiện của tôi" chỉ có 1 nút `🎯 CONTROL CENTER BTC ➔`.
   - Các sự kiện khác có huy hiệu phù hợp và không có quyền can thiệp nếu không được phân công.
3. Mở `/vi/admin/dashboard` hoặc `/vi/events/[id]`:
   - Bấm nút **`Chỉnh Sửa Sự Kiện & Lộ Trình`**.
   - Thử thay đổi thông tin sự kiện hoặc cập nhật mốc thời gian của Vòng 1 / Vòng 2 -> Bấm **`Lưu toàn bộ thay đổi`** và kiểm tra dữ liệu được cập nhật ngay lập tức.
