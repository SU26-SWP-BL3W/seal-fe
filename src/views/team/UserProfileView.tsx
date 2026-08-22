"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { Button, Input, Card } from "@/components/ui";
import { useUserProfileViewModel } from "@/viewModels/team/useUserProfileViewModel";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export function UserProfileView() {
  const { state, data, refs, actions } = useUserProfileViewModel();

  const {
    user,
    isEditing,
    userRoles,
    staffRoles,
    studentRoles,
    roleInfo,
    isStaff,
    schoolChoice,
    schoolId,
    studentCode,
    fullName,
    customSchoolName,
    photoFile,
    photoPreview,
    fptCode,
    fptResult,
    fptError,
    isDragging,
    submitError,
    submitSuccess,
    requestUnblockSuccess,
    isUploadingPhoto,
    showPasswordCard,
    oldPassword,
    newPassword,
    confirmPassword,
    passwordError,
    passwordSuccess,
    rejections,
    isBlocked,
    schoolNameDisplay,
    isFptStudent,
    cardApprovalStatus,
    isUpdatingProfile,
    isVerifyingFpt,
    isChangingPassword,
  } = state;

  const {
    schools,
    eventsList,
    trackNameMap,
    eventNameMap,
    myTeam,
  } = data;

  const { fileInputRef } = refs;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-xs text-amber-400 mb-1 uppercase tracking-wider">
              [ HỒ SƠ TÀI KHOẢN HỆ THỐNG ]
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
              HỒ SƠ CÁ NHÂN &amp; PHÂN CÔNG
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Quản lý thông tin định danh, đơn vị công tác và bảo mật tài khoản.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => actions.setIsEditing(!isEditing)}
              className={`px-4 py-2 border font-bold uppercase transition-all cursor-pointer hud-clipped ${isEditing
                  ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-black shadow-sm"
                }`}
            >
              {isEditing ? "[ HỦY CHỈNH SỬA ]" : "[ CHỈNH SỬA HỒ SƠ ]"}
            </button>
          </div>
        </div>

        {/* Two-Strike Warning Banner for Students */}
        {!isStaff && isBlocked && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 hud-clipped flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase">[ TÀI KHOẢN BỊ KHÓA ĐĂNG KÝ THI ĐẤU ]</span>
              <p className="text-zinc-300">
                Hồ sơ sinh viên của bạn đã bị từ chối 2 lần. Vui lòng gửi yêu cầu mở khóa đến Quản trị viên.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  // Unblock action
                  actions.setRequestUnblockSuccess(true);
                } catch {}
              }}
              disabled={requestUnblockSuccess}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase hud-clipped shrink-0 transition-all cursor-pointer disabled:opacity-50"
            >
              {requestUnblockSuccess ? "[ ĐÃ GỬI YÊU CẦU ]" : "[ GỬI YÊU CẦU MỞ KHÓA ]"}
            </button>
          </div>
        )}

        {/* Main Layout: Left Identification & Right Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CỘT TRÁI: THẺ ĐỊNH DANH */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-6 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-zinc-800">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/40 rounded-full flex items-center justify-center font-display text-2xl font-extrabold text-amber-300 shadow-md">
                  {user?.fullName?.charAt(0).toUpperCase() || (user as any)?.FullName?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
                    {user?.fullName || (user as any)?.FullName || "Người dùng"}
                  </h3>
                  <p className="font-mono text-xs text-zinc-400">
                    {user?.email || "user@seal.vn"}
                  </p>
                  <p className="text-xs text-zinc-300 font-medium pt-0.5">
                    {isStaff
                      ? (schoolNameDisplay || "Chuyên gia Chuyên môn")
                      : `${schoolNameDisplay} ${user?.studentCode ? `• MSSV: ${user.studentCode}` : ""}`}
                  </p>
                </div>

                <div className="pt-1">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-bold uppercase hud-clipped border ${roleInfo.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dotClass}`} />
                    <span>{roleInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">ĐƠN VỊ / TRƯỜNG:</span>
                  <span className="font-bold text-white text-right max-w-[160px] truncate" title={schoolNameDisplay}>
                    {schoolNameDisplay}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">LOẠI TÀI KHOẢN:</span>
                  <span className="font-bold text-cyan-300">
                    {roleInfo.typeLabel}
                  </span>
                </div>

                {!isStaff && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">MSSV:</span>
                      <span className="font-bold text-amber-300">
                        {user?.studentCode || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">PHÂN LOẠI TRƯỜNG:</span>
                      <span className="font-bold text-zinc-300">
                        {isFptStudent ? "[ FPT EDU ]" : "[ TRƯỜNG NGOÀI ]"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">TRẠNG THÁI THẺ:</span>
                      <span className={`font-bold ${cardApprovalStatus.colorClass}`}>
                        {cardApprovalStatus.label}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">NGÀY THAM GIA:</span>
                  <span className="text-zinc-300">
                    {user?.createdTime ? new Date(user.createdTime).toLocaleDateString("vi-VN") : "Chưa rõ"}
                  </span>
                </div>
              </div>

              {!isStaff && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    ẢNH THẺ SINH VIÊN ĐÃ NỘP:
                  </span>
                  {photoPreview ? (
                    <div className="relative border border-zinc-800 bg-black/40 p-1 hud-clipped">
                      <img
                        src={photoPreview}
                        alt="Ảnh thẻ sinh viên"
                        className="w-full h-40 object-cover"
                      />
                      <div className="mt-1 font-mono text-[10px] text-center text-zinc-400">
                        [ BẢN ĐÃ NỘP ]
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-amber-500/30 bg-[#090e11] text-center font-mono text-[11px] text-amber-400/80 hud-clipped space-y-1">
                      <p className="font-bold uppercase">[ CHƯA CÓ ẢNH THẺ SINH VIÊN ]</p>
                      <p className="text-[10px] text-zinc-500 font-sans">
                        {isFptStudent
                          ? "Sinh viên FPT được miễn nộp ảnh thẻ."
                          : "Sinh viên trường ngoài cần nộp ảnh thẻ để được xét duyệt."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {!isStaff && rejections.length > 0 && (
              <Card className="p-5 bg-[#10171a] border border-red-500/30 hud-clipped space-y-3">
                <h4 className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                  [ LỊCH SỬ TỪ CHỐI THẺ ({rejections.length}) ]
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  {rejections.map((r: any, i: number) => (
                    <div key={r.id || i} className="p-3 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span className="text-red-400 font-bold">LẦN #{i + 1}</span>
                        <span>{r.createdTime ? new Date(r.createdTime).toLocaleDateString("vi-VN") : "Gần đây"}</span>
                      </div>
                      <p className="text-zinc-300">
                        Lý do: <span className="text-red-300">{r.reason || "Ảnh thẻ không hợp lệ"}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* CỘT PHẢI: FORM THÔNG TIN CHUẨN DATABASE */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="font-display font-bold text-base text-white uppercase">
                  {isStaff ? "THÔNG TIN ĐỊNH DANH & ĐƠN VỊ CÔNG TÁC" : "THÔNG TIN HỒ SƠ & THẺ SINH VIÊN"}
                </h3>
                <span className="font-mono text-[10px] px-2.5 py-1 bg-[#090e11] border border-zinc-800 text-zinc-400 uppercase hud-clipped">
                  {isEditing ? "[ ĐANG CHỈNH SỬA ]" : "[ CHẾ ĐỘ XEM ]"}
                </span>
              </div>

              {!isEditing ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">HỌ VÀ TÊN</span>
                      <span className="text-sm font-bold text-white block">{fullName || user?.fullName || "Chưa cập nhật"}</span>
                    </div>

                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">EMAIL TÀI KHOẢN</span>
                      <span className="text-sm font-bold text-zinc-300 block truncate">{user?.email || "N/A"}</span>
                    </div>

                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped sm:col-span-2">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                        {isStaff ? "ĐƠN VỊ CÔNG TÁC / TỔ CHỨC / TRƯỜNG HỌC" : "TRƯỜNG ĐẠI HỌC"}
                      </span>
                      <span className="text-sm font-bold text-amber-300 block">{schoolNameDisplay}</span>
                    </div>

                    {!isStaff && (
                      <>
                        <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                          <span className="text-[10px] text-zinc-500 uppercase block font-bold">MÃ SỐ SINH VIÊN (MSSV)</span>
                          <span className="text-sm font-bold text-cyan-300 block">{studentCode || "Chưa cập nhật"}</span>
                        </div>

                        <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                          <span className="text-[10px] text-zinc-500 uppercase block font-bold">PHÂN LOẠI TRƯỜNG</span>
                          <span className="text-sm font-bold text-zinc-300 block">
                            {isFptStudent ? "Sinh Viên FPT Edu" : "Sinh Viên Trường Ngoài"}
                          </span>
                        </div>

                        <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped sm:col-span-2">
                          <span className="text-[10px] text-zinc-500 uppercase block font-bold">TRẠNG THÁI XÉT DUYỆT THẺ & HỒ SƠ</span>
                          <span className={`text-sm font-bold block ${cardApprovalStatus.colorClass}`}>
                            {cardApprovalStatus.label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => actions.setIsEditing(true)}
                      className="px-4 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold uppercase text-xs transition-all cursor-pointer hud-clipped shadow-sm"
                    >
                      [ CHỈNH SỬA THÔNG TIN HỒ SƠ ]
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={actions.handleFormSubmit} className="space-y-5 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Họ và Tên *
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => actions.setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Email Tài Khoản (Không thể thay đổi)
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                    />
                  </div>

                  {isStaff ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                          Đơn Vị Công Tác / Tổ Chức / Trường Học *
                        </label>
                        <select
                          value={schoolId}
                          onChange={(e) => actions.setSchoolId(e.target.value)}
                          className="w-full p-2.5 bg-[#090e11] border border-zinc-800 text-zinc-200 font-mono text-xs hud-clipped focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Chọn đơn vị / trường học từ hệ thống --</option>
                          {schools.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.schoolName}
                            </option>
                          ))}
                          <option value="OTHER_CUSTOM">-- Đơn vị / Trường khác (Nhập tên bên dưới) --</option>
                        </select>
                      </div>

                      {schoolId === "OTHER_CUSTOM" && (
                        <div className="space-y-1.5 p-3 bg-amber-500/5 border border-amber-500/30 hud-clipped">
                          <label className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                            Nhập Tên Đơn Vị Công Tác / Tổ Chức Của Bạn *
                          </label>
                          <Input
                            type="text"
                            value={customSchoolName}
                            onChange={(e) => actions.setCustomSchoolName(e.target.value)}
                            placeholder="Ví dụ: Công ty FPT Software, Viện Nghiên Cứu, v.v..."
                            required
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                          Phân Loại Trường Học *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              actions.setSchoolChoice("FPT");
                              const fptSchool = schools.find(
                                (s: any) =>
                                  s.schoolName?.toLowerCase().includes("fpt") ||
                                  s.schoolName?.toLowerCase().includes("đại học fpt")
                              );
                              if (fptSchool?.id) actions.setSchoolId(fptSchool.id);
                            }}
                            className={`p-3 text-center font-bold uppercase transition-all hud-clipped cursor-pointer flex flex-col items-center gap-1 ${schoolChoice === "FPT"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 font-extrabold shadow-sm"
                                : "bg-[#090e11] text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                              }`}
                          >
                            <span className="text-xs">SINH VIÊN FPT EDU</span>
                            <span className="text-[10px] opacity-75 font-normal">Xác thực tự động qua MSSV FPT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.setSchoolChoice("OTHER")}
                            className={`p-3 text-center font-bold uppercase transition-all hud-clipped cursor-pointer flex flex-col items-center gap-1 ${schoolChoice === "OTHER"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 font-extrabold shadow-sm"
                                : "bg-[#090e11] text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                              }`}
                          >
                            <span className="text-xs">SINH VIÊN TRƯỜNG NGOÀI</span>
                            <span className="text-[10px] opacity-75 font-normal">Nộp ảnh thẻ sinh viên xét duyệt</span>
                          </button>
                        </div>
                      </div>

                      {schoolChoice === "FPT" ? (
                        <div className="space-y-4 p-4 bg-[#090e11] border border-amber-500/30 hud-clipped">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                              Trường Học
                            </label>
                            <div className="p-2.5 bg-black/40 border border-zinc-800 text-amber-300 font-bold hud-clipped">
                              Trường Đại học FPT (FPT University / FPT Edu)
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                              Mã Số Sinh Viên FPT *
                            </label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                value={fptCode || studentCode}
                                onChange={(e) => {
                                  actions.setFptCode(e.target.value);
                                  actions.setStudentCode(e.target.value);
                                }}
                                placeholder="Ví dụ: SE171234, SS160000..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="primary"
                                onClick={actions.handleVerifyFpt}
                                disabled={isVerifyingFpt}
                                className="shrink-0 text-xs uppercase whitespace-nowrap"
                              >
                                {isVerifyingFpt ? "[ ĐANG TRA CỨU... ]" : "[ XÁC MINH MSSV ]"}
                              </Button>
                            </div>
                            {fptError && <p className="text-red-400 text-[11px] font-bold">{fptError}</p>}
                            {fptResult && (
                              <p className="text-emerald-400 text-[11px] font-bold">
                                [HỆ THỐNG XÁC NHẬN]: {fptResult.fullName || (fptResult as any).FullName} - {fptResult.major || "FPT Edu"}
                              </p>
                            )}
                          </div>

                          <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] hud-clipped">
                            Sinh viên FPT được tra cứu và xác thực trực tiếp qua cơ sở dữ liệu FPT Edu, không cần nộp ảnh thẻ sinh viên.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4 bg-[#090e11] border border-zinc-800 hud-clipped">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                              Trường Đại Học / Cơ Sở Đào Tạo *
                            </label>
                            <select
                              value={schoolId}
                              onChange={(e) => actions.setSchoolId(e.target.value)}
                              className="w-full p-2.5 bg-black/60 border border-zinc-800 text-zinc-200 font-mono text-xs hud-clipped focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Chọn trường đại học của bạn --</option>
                              {schools.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.schoolName}
                                </option>
                              ))}
                              <option value="OTHER_CUSTOM">-- Trường khác (Nhập tên trường bên dưới) --</option>
                            </select>
                          </div>

                          {schoolId === "OTHER_CUSTOM" && (
                            <div className="space-y-1.5 p-3 bg-amber-500/5 border border-amber-500/30 hud-clipped">
                              <label className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                                Nhập Tên Trường Đại Học Của Bạn *
                              </label>
                              <Input
                                type="text"
                                value={customSchoolName}
                                onChange={(e) => actions.setCustomSchoolName(e.target.value)}
                                placeholder="Ví dụ: Trường Đại học Giao Thông Vận Tải, ĐH Y Dược..."
                                required
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                              Mã Số Sinh Viên (MSSV) *
                            </label>
                            <Input
                              type="text"
                              value={studentCode}
                              onChange={(e) => actions.setStudentCode(e.target.value)}
                              placeholder="Nhập mã số sinh viên của trường bạn..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                              Ảnh Thẻ Sinh Viên (Mặt Trước) *
                            </label>
                            {photoPreview ? (
                              <div className="relative border border-zinc-700 bg-black/60 p-3 hud-clipped flex flex-col items-center gap-2">
                                <img
                                  src={photoPreview}
                                  alt="Xem trước ảnh thẻ sinh viên"
                                  className="max-h-44 object-contain rounded border border-zinc-800"
                                />
                                <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold uppercase hud-clipped cursor-pointer transition-all"
                                  >
                                    [ Thay Đổi Ảnh Khác ]
                                  </button>
                                  {photoFile && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        actions.setPhotoFile(null);
                                        actions.setPhotoPreview(user?.photoStudentCardUrl || null);
                                      }}
                                      className="px-3 py-1 bg-zinc-800 text-zinc-300 hover:text-white text-[10px] uppercase hud-clipped cursor-pointer transition-all"
                                    >
                                      [ Khôi Phục Ảnh Cũ ]
                                    </button>
                                  )}
                                </div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => e.target.files?.[0] && actions.handleFileChange(e.target.files[0])}
                                  className="hidden"
                                />
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); actions.setIsDragging(true); }}
                                onDragLeave={() => actions.setIsDragging(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  actions.setIsDragging(false);
                                  if (e.dataTransfer.files?.[0]) actions.handleFileChange(e.dataTransfer.files[0]);
                                }}
                                className={`p-6 border-2 border-dashed text-center cursor-pointer transition-all hud-clipped ${isDragging
                                    ? "border-amber-400 bg-amber-500/10"
                                    : "border-zinc-800 hover:border-zinc-700 bg-[#090e11]"
                                  }`}
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => e.target.files?.[0] && actions.handleFileChange(e.target.files[0])}
                                  className="hidden"
                                />
                                <p className="text-zinc-300 font-bold uppercase text-[11px]">
                                  [ Kéo thả file ảnh thẻ vào đây hoặc Bấm để chọn ]
                                </p>
                                <span className="text-[10px] text-zinc-500 block mt-1">Dung lượng tối đa 5MB (JPG, PNG, WEBP)</span>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 text-amber-300 font-mono text-[11px] hud-clipped">
                            Sinh viên trường ngoài cần nộp ảnh thẻ sinh viên rõ nét để Ban Tổ Chức phê duyệt trước khi thi đấu.
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {submitError && <p className="text-red-400 font-bold">{submitError}</p>}
                  {submitSuccess && <p className="text-emerald-400 font-bold">[CẬP NHẬT HỒ SƠ THÀNH CÔNG]</p>}

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => actions.setIsEditing(false)}
                    >
                      HỦY
                    </Button>
                    <Button type="submit" variant="primary" disabled={isUploadingPhoto || isUpdatingProfile}>
                      {isUploadingPhoto ? "[ ĐANG TẢI ẢNH... ]" : "[ LƯU THAY ĐỔI ]"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* CARD ĐỘI THI CỦA TÔI */}
            {!isStaff && myTeam && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      ĐỘI THI ĐANG THAM GIA
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Đội thi của bạn trong sự kiện
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold hud-clipped">
                    {myTeam.name || "Đội thi của tôi"}
                  </span>
                </div>

                <div className="p-4 bg-[#090e11] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm uppercase">
                        {myTeam.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-300 hud-clipped">
                        {myTeam.status || "Forming"}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Sự kiện: <strong className="text-zinc-200">{myTeam.eventName || "Sự kiện hiện tại"}</strong>
                      {myTeam.members && ` • ${myTeam.members.length} thành viên`}
                    </p>
                  </div>

                  <Link href={`/my-team${myTeam.eventId ? `?eventId=${myTeam.eventId}` : ""}`}>
                    <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                      [ VÀO QUẢN TRỊ ĐỘI THI &gt; ]
                    </button>
                  </Link>
                </div>
              </Card>
            )}

            {/* BẢNG PHÂN CÔNG NHIỆM VỤ CHUYÊN MÔN */}
            {staffRoles.length > 0 && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      PHÂN CÔNG NHIỆM VỤ CHUYÊN MÔN
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Vai trò Giám khảo, Cố vấn và Ban tổ chức theo sự kiện
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold hud-clipped">
                    {staffRoles.length} PHÂN CÔNG
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {staffRoles.map((r: any, idx: number) => {
                    const rEventId = r.eventId || r.EventId;
                    const rEventObj = eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(rEventId));
                    const rEventName = rEventObj?.eventName || rEventObj?.EventName || eventNameMap.get(normalizeId(rEventId)) || "Sự kiện SEAL";
                    const rExpiredAt = r.expiredAt || r.ExpiredAt;
                    const isRoleExpired = rExpiredAt ? new Date(rExpiredAt).getTime() < Date.now() : false;
                    const isEnded = isRoleExpired || rEventObj?.status === false || (rEventObj?.endDate && new Date(rEventObj.endDate).getTime() < Date.now());
                    const rRoleName = r.roleName || r.RoleName || "Chuyên gia";
                    const rTrackId = r.trackId || r.TrackId;
                    const rTrackName = r.track?.trackName || r.Track?.TrackName || (rTrackId ? trackNameMap.get(normalizeId(rTrackId)) : null);

                    let targetUrl = `/events/${rEventId}`;
                    let actionLabel = "[ VÀO SỰ KIỆN > ]";

                    if (rRoleName === "Judge") {
                      targetUrl = rTrackId ? `/judge/scoring?trackId=${rTrackId}` : `/judge/events?eventId=${rEventId}`;
                      actionLabel = isEnded ? "[ XEM BÀI ĐÃ CHẤM > ]" : "[ BÀN CHẤM ĐIỂM > ]";
                    } else if (rRoleName === "Mentor") {
                      targetUrl = rTrackId ? `/mentor/teams?eventId=${rEventId}&trackId=${rTrackId}` : `/mentor?eventId=${rEventId}`;
                      actionLabel = isEnded ? "[ XEM DANH SÁCH ĐỘI > ]" : "[ KHÔNG GIAN CỐ VẤN > ]";
                    } else if (rRoleName === "EventCoordinator" || rRoleName === "Coordinator") {
                      targetUrl = `/coordinator/dashboard?eventId=${rEventId}`;
                      actionLabel = "[ BÀN ĐIỀU PHỐI > ]";
                    }

                    return (
                      <div
                        key={r.id || idx}
                        className="p-4 bg-[#090e11] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 font-bold uppercase text-[10px] hud-clipped ${rRoleName === "Judge"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : rRoleName === "Mentor"
                                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                  : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              }`}>
                              VAI TRÒ: {rRoleName.toUpperCase()}
                            </span>

                            {rTrackName ? (
                              <span className="px-2 py-0.5 bg-blue-950/40 text-blue-300 border border-blue-500/30 font-bold uppercase text-[10px] hud-clipped truncate max-w-xs">
                                HẠNG MỤC: {rTrackName}
                              </span>
                            ) : rTrackId ? (
                              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono text-[10px] hud-clipped">
                                TRACK: {String(rTrackId).substring(0, 8)}...
                              </span>
                            ) : (rRoleName === "EventCoordinator" || rRoleName === "Coordinator") ? (
                              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono text-[10px] hud-clipped">
                                PHẠM VI: TOÀN SỰ KIỆN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300/80 border border-amber-700/40 font-mono text-[10px] hud-clipped">
                                CHƯA GÁN HẠNG MỤC
                              </span>
                            )}

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 hud-clipped ${isEnded ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                              }`}>
                              {isEnded ? "[ ĐÃ ĐÓNG ]" : "[ ĐANG MỞ ]"}
                            </span>
                          </div>

                          <div className="font-display font-bold text-white text-sm truncate">
                            {rEventName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rEventId && (
                            <Link href={targetUrl}>
                              <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                                {actionLabel}
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* BẢNG LỊCH SỬ THAM GIA ĐỘI THI */}
            {studentRoles.length > 0 && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      LỊCH SỬ ĐỘI THI ĐÃ THAM GIA
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Các sự kiện bạn đã tham gia với tư cách Thí sinh
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold hud-clipped">
                    {studentRoles.length} SỰ KIỆN
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {studentRoles.map((r: any, idx: number) => {
                    const rEventId = r.eventId || r.EventId;
                    const rEventObj = eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(rEventId));
                    const rEventName = rEventObj?.eventName || rEventObj?.EventName || eventNameMap.get(normalizeId(rEventId)) || "Sự kiện SEAL";
                    const isEnded = rEventObj?.status === false || (rEventObj?.endDate && new Date(rEventObj.endDate).getTime() < Date.now());
                    const rRoleName = r.roleName || r.RoleName || "Thành viên";

                    return (
                      <div
                        key={r.id || idx}
                        className="p-4 bg-[#090e11] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 font-bold uppercase text-[10px] hud-clipped bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                              VAI TRÒ: {rRoleName === "TeamLeader" ? "TRƯỞNG ĐỘI" : "THÀNH VIÊN ĐỘI"}
                            </span>

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 hud-clipped ${isEnded ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                              }`}>
                              {isEnded ? "[ ĐÃ ĐÓNG ]" : "[ ĐANG MỞ ]"}
                            </span>
                          </div>

                          <div className="font-display font-bold text-white text-sm truncate">
                            {rEventName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rEventId && (
                            <Link href={`/my-team?eventId=${rEventId}`}>
                              <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                                [ ĐỘI THI CỦA TÔI &gt; ]
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* CARD ĐỔI MẬT KHẨU TÀI KHOẢN */}
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white uppercase">
                    BẢO MẬT &amp; MẬT KHẨU TÀI KHOẢN
                  </h3>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                    Đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => actions.setShowPasswordCard(!showPasswordCard)}
                  className="px-3.5 py-1.5 bg-[#141f23] border border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase hud-clipped transition-all cursor-pointer"
                >
                  {showPasswordCard ? "[ ĐÓNG FORM ]" : "[ THAY ĐỔI MẬT KHẨU ]"}
                </button>
              </div>

              {showPasswordCard && (
                <form onSubmit={actions.handleChangePassword} className="space-y-4 pt-2 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Mật Khẩu Hiện Tại *
                    </label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => actions.setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                        Mật Khẩu Mới *
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => actions.setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                        Xác Nhận Mật Khẩu Mới *
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => actions.setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                    </div>
                  </div>

                  {passwordError && <p className="text-red-400 font-bold">{passwordError}</p>}
                  {passwordSuccess && <p className="text-emerald-400 font-bold">[ĐỔI MẬT KHẨU THÀNH CÔNG]</p>}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" disabled={isChangingPassword}>
                      {isChangingPassword ? "[ ĐANG XỬ LÝ... ]" : "[ XÁC NHẬN ĐỔI MẬT KHẨU ]"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
