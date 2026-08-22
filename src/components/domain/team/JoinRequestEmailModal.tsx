"use client";

import { useState } from "react";
import { Button, Card, SkeletonRows } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTeamById } from "@/repositories/teamsRepository";

interface Props {
  open: boolean;
  team: {
    id?: string;
    name?: string;
    description?: string;
    trackName?: string;
    eventName?: string;
    leaderName?: string;
    leaderEmail?: string;
    memberCount?: number;
  } | null;
  onClose: () => void;
}

export function JoinRequestEmailModal({ open, team, onClose }: Props) {
  const { user } = useAuth();
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const teamId = team?.id;
  const { data: teamDetail, isLoading: isLoadingTeamDetail } = useGetTeamById(teamId);

  if (!open || !team) return null;

  const detailLeader = (teamDetail?.members ?? (teamDetail as any)?.Members ?? [])?.find(
    (m: any) => (m.roleName || m.RoleName) === "TeamLeader"
  );

  const teamName = teamDetail?.name || (teamDetail as any)?.Name || team.name || "Đội thi";
  const eventName = team.eventName || "Sự kiện Hackathon SEAL";
  const trackName = team.trackName || "Hạng mục chung";
  const leaderName =
    detailLeader?.fullName ||
    detailLeader?.FullName ||
    team.leaderName ||
    "Đội trưởng";
  const leaderEmail =
    detailLeader?.email ||
    detailLeader?.Email ||
    team.leaderEmail ||
    "Chưa có email đội trưởng";

  const userFullName = user?.fullName || (user as any)?.FullName || "Thí sinh";
  const userEmail = user?.email || (user as any)?.Email || "";
  const userCode = user?.studentCode || (user as any)?.StudentCode || "";
  const schoolName = user?.schoolName || (user as any)?.SchoolName || "";

  const emailSubject = `[SEAL Hackathon] Đề nghị gia nhập đội ${teamName} - ${userFullName}`;

  const emailBody = `Kính gửi Bạn ${leaderName} (Đội trưởng đội ${teamName}),

Tôi là ${userFullName}${userCode ? ` (MSSV: ${userCode})` : ""}${schoolName ? `, sinh viên ${schoolName}` : ""}.
Tôi được biết đội "${teamName}" hiện đang tham gia sự kiện "${eventName}" tại hạng mục "${trackName}" và vẫn còn vị trí tuyển thành viên.

Tôi rất mong muốn được ứng tuyển và đồng hành cùng đội trong cuộc thi. Dưới đây là thông tin sơ lược về tôi:
- Kỹ năng / Thế mạnh: [Frontend / Backend / Fullstack / AI & Data / UI-UX / Pitching...]
- Kinh nghiệm / Đồ án đã thực hiện: ...
- Email tài khoản SEAL: ${userEmail}
- Kênh liên hệ trực tiếp (SĐT / Zalo): ...

Nếu phù hợp với định hướng của đội, rất mong bạn có thể gửi Lời Mời chính thức cho tôi qua hệ thống SEAL (với email: ${userEmail}) để tôi xác nhận tham gia.

Xin chân thành cảm ơn bạn và chúc đội thi gặt hái kết quả xuất sắc!

Trân trọng,
${userFullName}`;

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(`Tiêu đề: ${emailSubject}\n\n${emailBody}`);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyEmail = async () => {
    if (!leaderEmail) return;
    try {
      await navigator.clipboard.writeText(leaderEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(leaderEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-cyan-500/40 bg-[#0c1417] p-6 shadow-2xl hud-clipped font-mono">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase"
          aria-label="Đóng"
        >
          Đóng
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 border-b border-zinc-800 pb-4">
          <div className="min-w-0 pr-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              [ ĐỀ NGHỊ GIA NHẬP ĐỘI QUA EMAIL ]
            </span>
            <h2 className="font-display text-lg font-bold uppercase text-white truncate">
              {teamName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
              <span className="text-cyan-300 font-bold">{trackName}</span>
              <span>•</span>
              <span>Đội trưởng: <strong className="text-white">{leaderName}</strong></span>
            </div>
          </div>
        </div>

        {/* Recipient Info Strip */}
        <div className="my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-400">Gửi tới Đội trưởng:</span>
            <span className="font-bold text-white truncate" title={leaderEmail}>
              {leaderEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] transition-colors cursor-pointer shrink-0"
          >
            <span>{copiedEmail ? "Đã chép email" : "Chép email"}</span>
          </button>
        </div>

        {/* Email Preview Area */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
              Mẫu Email Đề Nghị Tham Gia Đã Soạn Sẵn:
            </label>
            <span className="text-[10px] text-cyan-400">
              Tự động điền theo hồ sơ của bạn
            </span>
          </div>

          <div className="border border-zinc-700 bg-black/60 p-4 rounded space-y-2 font-mono text-[11px] text-zinc-300 leading-relaxed max-h-64 overflow-y-auto">
            <div className="border-b border-zinc-800 pb-2 text-zinc-400">
              <strong className="text-white">Tiêu đề:</strong> {emailSubject}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs pt-1">{emailBody}</pre>
          </div>
        </div>

        {/* Next Step Guideline */}
        <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded text-[11px] text-cyan-200/90 font-sans leading-relaxed">
          <strong>Quy trình sau khi gửi email:</strong> Đội trưởng sẽ liên hệ lại với bạn và gửi lời mời chính thức vào đội qua hệ thống SEAL. Bạn chỉ cần vào mục <strong>Lời Mời Của Tôi</strong> để nhấn <em>Chấp Nhận</em>.
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopyBody}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white"
          >
            <span>{copiedBody ? "Đã Sao Chép Email" : "Sao Chép Nội Dung Email"}</span>
          </Button>
          <Button
            type="button"
            accent="team"
            onClick={handleOpenMailto}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 font-bold"
          >
            <span>Mở Ứng Dụng Email (Gửi Ngay)</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
