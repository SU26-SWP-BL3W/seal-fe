"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, Button, Input, Badge } from "@/components/ui";
import {
  FileCode2,
  Video,
  Presentation,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  MessageSquareQuote,
  Users2,
  Trophy,
} from "lucide-react";
import { useState } from "react";

export function HomeView() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/h1e3su/seal-ai-solution");
  const [demoUrl, setDemoUrl] = useState("https://youtu.be/demo-seal-hackathon");
  const [slideUrl, setSlideUrl] = useState("");

  return (
    <DashboardShell>
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="team" dot>
              Đội thi: SEAL Innovators
            </Badge>
            <span className="text-xs text-slate-400 font-medium">• Hạng mục: Trí tuệ nhân tạo (AI & BigData)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Không Gian Làm Việc & Nộp Bài Thi
          </h1>
          <p className="text-sm text-slate-400">
            Hackathon Khởi Nghiệp Công Nghệ Toàn Quốc 2026 — Vòng Sơ Loại (Round 1)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md">
            Xem thể lệ
          </Button>
          <Button variant="primary" size="md">
            <Sparkles className="h-4 w-4 mr-1" /> Cập nhật hồ sơ
          </Button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Thời gian còn lại</p>
            <p className="text-lg font-bold text-white font-mono">18h : 45m : 20s</p>
            <p className="text-[11px] text-cyan-400">Đóng cổng lúc 23:59 hôm nay</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Tiến độ nộp bài</p>
            <p className="text-lg font-bold text-white font-mono">2 / 3 Đường dẫn</p>
            <p className="text-[11px] text-emerald-400">Đã lưu Repo & Video</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Trạng thái chấm thi</p>
            <p className="text-lg font-bold text-white font-mono">Chờ mở chấm</p>
            <p className="text-[11px] text-purple-400">Sau khi đóng cổng nộp</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Submission Workspace (Left) & Team + Mentor Guidance (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submission 3 URLs Card */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-cyan-400" /> Nộp Giải Pháp Kỹ Thuật (3 URLs)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Điền đầy đủ các liên kết sản phẩm. Hệ thống sẽ tự động quét thông tin commit và sao lưu.
              </p>
            </div>
            <Badge tone="warning">Đang mở nộp</Badge>
          </div>

          <div className="space-y-4">
            {/* Field 1: GitHub / Repo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="h-4 w-4 text-cyan-400" />
                  Mã nguồn (GitHub / GitLab Repository) <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Đã kết nối
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                />
                <Button variant="secondary" size="md" className="px-3">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Field 2: Demo Video / App URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-amber-400" />
                  Video Demo / Bản chạy thử (YouTube / Web Live) <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Hợp lệ
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://youtu.be/video-id hoặc https://app.domain.com"
                />
                <Button variant="secondary" size="md" className="px-3">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Field 3: Slide Deck URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Presentation className="h-4 w-4 text-purple-400" />
                  Slide Thuyết Trình (Canva / Google Slides / PDF)
                </span>
                <span className="text-[11px] text-slate-500">Tùy chọn</span>
              </label>
              <Input
                value={slideUrl}
                onChange={(e) => setSlideUrl(e.target.value)}
                placeholder="https://canva.com/design/... hoặc link Google Drive"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-500">
              Lần cập nhật cuối: <span className="font-mono text-slate-400">10 phút trước</span>
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="md">
                Hủy thay đổi
              </Button>
              <Button variant="primary" size="md">
                🚀 Xác nhận & Nộp bài
              </Button>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: Team Roster & Mentor Guidance */}
        <div className="space-y-6">
          {/* Team Members Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users2 className="h-4 w-4 text-sky-400" /> Thành Viên Đội (4/5)
              </h3>
              <Badge tone="team">Team Leader</Badge>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                    NL
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Nguyễn Văn Lộc</p>
                    <p className="text-[10px] text-slate-400">Trưởng nhóm (Leader)</p>
                  </div>
                </div>
                <Badge tone="success">Đã xác minh</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                    TP
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Trương Hoàng Phúc</p>
                    <p className="text-[10px] text-slate-400">Thành viên (AI Dev)</p>
                  </div>
                </div>
                <Badge tone="success">Đã xác minh</Badge>
              </div>
            </div>

            <Button variant="secondary" size="sm" className="w-full text-xs">
              + Mời thêm thành viên
            </Button>
          </Card>

          {/* Mentor Feedback Preview Card */}
          <Card className="space-y-3 bg-gradient-to-b from-slate-900/90 to-teal-950/20 border-teal-500/30">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <MessageSquareQuote className="h-4 w-4" /> Nhận Xét Của Cố Vấn (Mentor)
              </h3>
              <span className="text-[10px] text-slate-400">1 giờ trước</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-teal-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">ThS. Trần Minh Đức</span>
                <Badge tone="mentor">AI Mentor</Badge>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "Thuật toán xử lý ngôn ngữ của đội bạn rất tốt. Nên bổ sung thêm biểu đồ so sánh độ chính xác trong Slide để gây ấn tượng mạnh với Ban Giám Khảo nhé!"
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
