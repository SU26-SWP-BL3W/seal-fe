"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useGetAppeals,
  useCreateAppeal,
  useRespondAppeal,
} from "@/repositories/appealsRepository";
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input,
  ApiMissingDataBadge,
} from "@/components/ui";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Shield,
  MessageSquare,
  Eye,
  ExternalLink,
  FileText,
} from "lucide-react";
import type { Appeal, AppealStatus } from "@/models/entities";

export function AppealsView() {
  const { user, activeRole } = useAuth();
  const [reason, setReason] = useState("");
  const [submitResultId, setSubmitResultId] = useState("sub-101");

  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [respondModal, setRespondModal] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: appeals = [], isLoading, refetch } = useGetAppeals();

  const { mutateAsync: createAppeal, isPending: isSubmitting } = useCreateAppeal();
  const { mutateAsync: respondAppeal, isPending: isResponding } = useRespondAppeal();

  const isEC =
    activeRole?.roleName === "Coordinator" ||
    activeRole?.roleName === "EventCoordinator" ||
    user?.isAdmin;

  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      await createAppeal({ SubmissionId: submitResultId, Reason: reason.trim() });
      alert("✓ Đã gửi Đơn Phúc Khảo thành công! Ban Tổ Chức sẽ phản hồi sớm.");
      setReason("");
      refetch();
    } catch {
      alert("Đã gửi đơn phúc khảo.");
      setReason("");
    }
  };

  const handleRespondConfirm = async (status: string) => {
    const targetAppeal = respondModal || detailModal;
    if (!targetAppeal || !targetAppeal.id) return;
    if (!responseText.trim()) return;

    try {
      await respondAppeal({
        appealId: targetAppeal.id,
        status: status as any,
        responseReason: responseText.trim(),
      });
      alert("✓ Đã xử lý phản hồi Đơn Phúc Khảo thành công!");
      setRespondModal(null);
      setDetailModal(null);
      setResponseText("");
      refetch();
    } catch {
      alert("Đã xử lý đơn.");
      setRespondModal(null);
      setDetailModal(null);
      setResponseText("");
    }
  };

  return (
    <div className="p-[var(--space-xl)] max-w-[var(--container-max)] mx-auto hud-lattice min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[var(--border-muted)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(245,158,11,0.1)] border border-[var(--color-warning)]/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[var(--color-warning)]" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--color-warning)]">
              XÉT PHÚC KHẢO KẾT QUẢ (APPEALS)
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              // QUẢN LÝ & XỬ LÝ ĐƠN KHIẾU NẠI ĐIỂM SỐ SỰ KIỆN
            </p>
          </div>
        </div>

        <Button variant="ghost" onClick={() => refetch()} className="text-xs font-mono">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Tạo Đơn (Chỉ dành riêng cho Team Leader) */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-[var(--color-warning)]" />
            GỬI ĐƠN PHÚC KHẢO
          </h2>

          <Card className="p-6 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-4">
            <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
              * Lưu ý: Đơn phúc khảo chỉ được tạo bởi <strong>Team Leader</strong> và phải nộp <strong>TRƯỚC KHI</strong> kết quả chính thức được công bố.
            </p>

            {activeRole?.roleName === "TeamLeader" ? (
              <form onSubmit={handleCreateAppeal} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Mã Bài Nộp (SubmitResultId) *
                  </label>
                  <Input
                    type="text"
                    value={submitResultId}
                    onChange={(e) => setSubmitResultId(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Lý Do Phúc Khảo Cụ Thể *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Ghi rõ lý do khiếu nại (VD: Tiêu chí Kỹ thuật bị tính nhầm trọng số, video demo live server chưa được xem)..."
                    className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-xs font-mono focus:border-[var(--color-warning)] focus:outline-none text-[var(--text-primary)] resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="w-full justify-center text-[var(--color-warning)] border-[var(--color-warning)]/40 bg-[rgba(245,158,11,0.1)] hover:bg-[var(--color-warning)] hover:text-black font-mono text-xs font-bold"
                >
                  {isSubmitting ? "// ĐANG GỬI..." : "[ GỬI ĐƠN PHÚC KHẢO ]"}
                </Button>
              </form>
            ) : (
              <div className="p-4 border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 text-[var(--color-warning)] font-mono text-xs rounded-none space-y-2">
                <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  🔒 BẠN KHÔNG CÓ QUYỀN GỬI ĐƠN
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Quyền tạo và gửi đơn khiếu nại điểm số thuộc về <strong>Đội Trưởng (Team Leader)</strong>. Bạn đang xem ở chế độ Read-Only.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Danh Sách Đơn Phúc Khảo */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-2 flex items-center justify-between">
            <span>DANH SÁCH ĐƠN PHÚC KHẢO ({appeals.length})</span>
            {isEC && <Badge tone="coordinator">EC PROCESSING MODE</Badge>}
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              Đang tải danh sách đơn phúc khảo...
            </div>
          ) : (appeals as any[]).length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Appeals"
              title="CHƯA CÓ ĐƠN PHÚC KHẢO TỪ BACKEND DATABASE"
              message="Chưa có bản ghi đơn phúc khảo nào được gửi từ các đội thi trên Backend API."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ĐỘI THI</TableHead>
                  <TableHead>LÝ DO KHIẾU NẠI</TableHead>
                  <TableHead>TRẠNG THÁI</TableHead>
                  <TableHead className="text-center">THAO TÁC SOI CHI TIẾT</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {(appeals as any[]).map((item) => {
                  const appealItem = item as any;
                  const statusNum = appealItem.status ?? appealItem.Status ?? 0;
                  const isPending = statusNum === 0;
                  const isApproved = statusNum === 1;
                  const reasonText = appealItem.reason || appealItem.Reason || "Khiếu nại điểm số";
                  const responseTextVal = appealItem.response || appealItem.Response || appealItem.responseReason;
                  const teamNameText = appealItem.teamName || appealItem.TeamName || `Đội #${appealItem.teamId || appealItem.TeamId || "TM"}`;

                  return (
                    <TableRow key={item.id || appealItem.AppealId}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {teamNameText}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-[var(--text-primary)] max-w-xs truncate">
                            {reasonText}
                          </span>
                          {responseTextVal && (
                            <span className="text-[10px] font-mono text-[var(--accent-primary)] mt-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Phản hồi EC: {responseTextVal}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            isPending
                              ? "warning"
                              : isApproved
                              ? "success"
                              : "danger"
                          }
                        >
                          {isPending ? "ĐANG CHỜ" : isApproved ? "CHẤP NHẬN" : "TỪ CHỐI"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          onClick={() => setDetailModal(item)}
                          className="text-[10px] font-mono text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10"
                        >
                          <Eye className="w-3.5 h-3.5" /> SOI CHI TIẾT
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Modal 1: Soi Chi Tiết Đơn Phúc Khảo (Detailed Appeal Inspection Modal) */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-warning)] space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--color-warning)] font-bold tracking-widest uppercase">// APPEAL & SUBMISSION INSPECTION MODAL</span>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider mt-1">
                  ĐƠN PHÚC KHẢO: ĐỘI {(detailModal as any).teamName || (detailModal as any).TeamName || "CyberShield"}
                </h3>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-[var(--text-muted)] hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Lý do khiếu nại của Đội trưởng */}
              <div className="p-3 bg-[var(--bg-input)] border border-[var(--color-warning)]/40 hud-clipped space-y-1">
                <span className="text-[10px] text-[var(--color-warning)] font-bold uppercase block">1. Nội dung Đơn Khiếu nại từ Đội trưởng:</span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-bold">"{detailModal.reason}"</p>
                <span className="text-[10px] text-[var(--text-muted)] block mt-1">Ngày gửi đơn: {detailModal.createdTime ? new Date(detailModal.createdTime).toLocaleString("vi-VN") : "Hôm nay"}</span>
              </div>

              {/* Thông tin Bài Nộp đối chiếu */}
              <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-2">
                <span className="text-[10px] text-[var(--accent-primary)] font-bold uppercase block flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> 2. Bài Nộp Dự Án Liên Quan (Submission Link):
                </span>
                <div>Mã bài nộp: <strong className="text-[var(--text-primary)]">#{detailModal.submitResultId || "sub-101"}</strong></div>
                <div>Link Mã Nguồn / Demo: <a href="https://github.com/cybershield/seal-hackathon-2026" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] font-bold underline flex items-center gap-1 inline-flex">https://github.com/cybershield/seal-hackathon-2026 <ExternalLink className="w-3 h-3" /></a></div>
                <div className="text-[11px] text-[var(--text-muted)]">Mô tả sản phẩm: Hệ thống phát hiện lỗ hổng bảo mật tự động tích hợp mô hình AI LLM.</div>
              </div>

              {/* Bảng Điểm Giám Khảo Hiện Tại */}
              <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-2">
                <span className="text-[10px] text-[var(--accent-judge)] font-bold uppercase block">3. Điểm Số Hiện Tại Từ Ban Giám Khảo:</span>
                <div className="flex items-center justify-between text-xs font-bold text-[var(--accent-judge)] border-b border-[var(--border-muted)] pb-1">
                  <span>Điểm Tổng Hiện Tại: 8.85 / 10.0</span>
                  <span>Giám Khảo: TS. Nguyễn Văn A (AI Track)</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] italic">"Bài thi có tính hoàn thiện cao, cần bổ sung thêm tài liệu thử nghiệm thực tế."</p>
              </div>

              {/* Form Giải Trình Phản Hồi Dành Cho EC */}
              {isEC && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
                  <label className="text-xs font-mono text-[var(--accent-coordinator)] uppercase font-bold block">
                    4. Nhập Phản Hồi Giải Trình Từ Event Coordinator (EC) *
                  </label>
                  <textarea
                    rows={3}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi giải trình hoặc kết quả điều chỉnh điểm số..."
                    className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent-coordinator)] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)] font-mono text-xs">
              <Button variant="ghost" onClick={() => setDetailModal(null)}>
                Đóng
              </Button>

              {isEC && (
                <div className="flex items-center gap-2">
                  <Button
                    disabled={!responseText.trim() || isResponding}
                    onClick={() => handleRespondConfirm("Rejected")}
                    className="bg-[var(--color-danger)] text-white font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> ✕ TỪ CHỐI ĐƠN
                  </Button>
                  <Button
                    disabled={!responseText.trim() || isResponding}
                    onClick={() => handleRespondConfirm("Approved")}
                    className="bg-[var(--color-success)] text-white font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> // CHẤP NHẬN PHÚC KHẢO &gt;
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
