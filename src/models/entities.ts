// ─── Domain entities ──────────────────────────────────────────────────────────
// Type khớp CHÍNH XÁC theo response model thật của BE (SEAL_Backend/Features/**/Models),
// không suy đoán từ FE cũ. Field/casing đối chiếu trực tiếp source C# — camelCase vì
// ASP.NET Core mặc định System.Text.Json camelCase, không có override trong Program.cs.
//
// Type CHỈ dùng riêng 1 feature (Team, SubmitResult, Score...) khai trong repository
// của feature đó khi wiring, không khai ở đây.

/** UserModel — hồ sơ đầy đủ (register, GET /Users/profile, student-profile responses). */
export interface User {
  id: string;
  schoolId: string;
  studentCode?: string | null;
  email: string;
  fullName: string;
  isStudent: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isFpt: boolean;
  isRejected: boolean;
  /** true = tài khoản tạm được MỜI (giám khảo/mentor), không phải thí sinh tự đăng ký. */
  isTemporary: boolean;
  photoStudentCardUrl?: string | null;
}

/**
 * LoginUserResponseModel/GoogleLogin — chỉ có 1 lần khi vừa đăng nhập, KHÔNG phải User
 * đầy đủ (thiếu isApproved/isFpt/schoolId...). authRepository tự gọi thêm GET
 * /Users/profile ngay sau login để trả về User thật — component không nên tự dùng
 * type này để hiển thị hồ sơ.
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  isStudent: boolean;
}
