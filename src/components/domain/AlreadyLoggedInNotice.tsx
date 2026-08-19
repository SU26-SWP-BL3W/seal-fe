"use client";

import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Link, useRouter } from "@/i18n/routing";
import { LogOut, ArrowLeft, ShieldAlert, User } from "lucide-react";

export const AlreadyLoggedInNotice: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const emailLower = (user.email || "").toLowerCase();
  const isAdm = !!user.isAdmin || !!user.IsAdmin || emailLower.includes("admin");
  const isCoord = emailLower.includes("ec.") || emailLower.includes("coordinator");
  const isJudge = emailLower.includes("judge");
  const isMentor = emailLower.includes("mentor");

  let destination = "/";
  let roleTitle = "Thí sinh";
  if (isAdm) {
    destination = "/admin/dashboard";
    roleTitle = "Quản trị viên (Admin)";
  } else if (isCoord) {
    destination = "/coordinator/dashboard";
    roleTitle = "Ban Tổ Chức (Coordinator)";
  } else if (isJudge) {
    destination = "/judge/scoring";
    roleTitle = "Giám Khảo (Judge)";
  } else if (isMentor) {
    destination = "/mentor/tracks";
    roleTitle = "Cố Vấn (Mentor)";
  }

  const fullName = user.fullName || user.FullName || user.email || "Người dùng";
  const userEmail = user.email || "";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0d1317] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-7 h-7 stroke-[1.8]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white tracking-wide">
            XÁC NHẬN ĐĂNG NHẬP (CONFIRM)
          </h2>
          <span className="font-mono text-[11px] text-amber-400 font-bold uppercase block">
            TÀI KHOẢN ĐANG HOẠT ĐỘNG
          </span>
        </div>

        {/* Message Box */}
        <div className="bg-[#121b20] border border-zinc-800 p-4 rounded-xl space-y-2 text-left">
          <div className="flex items-center gap-2 text-zinc-300 font-mono text-xs font-bold border-b border-zinc-800 pb-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-sans">{fullName}</span>
            <span className="text-[10px] text-zinc-400 font-normal">({roleTitle})</span>
          </div>

          <p className="font-sans text-xs text-zinc-300 leading-relaxed pt-1">
            Bạn đã đăng nhập hệ thống với tài khoản <strong className="text-cyan-300">{userEmail}</strong>. Vui lòng <strong>đăng xuất</strong> nếu bạn muốn đăng nhập hoặc đăng ký tài khoản khác.
          </p>
          <p className="font-mono text-[11px] text-zinc-400 italic">
            (You are already logged in as {fullName}, you need to log out before logging in as a different user).
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 font-mono text-xs pt-2">
          <button
            type="button"
            onClick={() => router.push(destination)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#162127] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Về ({isAdm || isCoord || isJudge || isMentor ? "Dashboard" : "Trang Chủ"})</span>
          </button>
          
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg shadow-lg shadow-rose-950/50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất (Log Out)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
