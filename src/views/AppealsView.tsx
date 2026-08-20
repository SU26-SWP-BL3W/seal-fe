"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useMySubmissions } from "@/repositories/submitResultsRepository";
import {
  useGetAppealsByTeam,
  useGetAppealsByEvent,
  useCreateAppeal,
  useRespondAppeal,
  readApiError,
  AppealStatus,
  type Appeal,
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
  ApiMissingDataBadge,
} from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Eye,
} from "lucide-react";

function pick(obj: unknown, ...keys: string[]): string {
  const rec = obj as Record<string, unknown> | null;
  if (!rec) return "";
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export function AppealsView() {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const [reason, setReason] = useState("");
  const [submitResultId, setSubmitResultId] = useState("");
  const [formError, setFormError] = useState("");

  const [detailModal, setDetailModal] = useState<Appeal | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondError, setRespondError] = useState("");

  const roleName = pick(activeRole, "roleName", "RoleName");
  const isLeader = roleName === "TeamLeader";
  const isEC = roleName === "EventCoordinator" || roleName === "Coordinator" || Boolean(user?.isAdmin || user?.IsAdmin);
  const eventIdFromRole = pick(activeRole, "eventId", "EventId");

  // Team members: đơn phúc khảo của đội mình. EC: toàn bộ đơn trong sự kiện (gộp mọi vòng thi).
  const { data: myTeam } = useMyTeam(eventIdFromRole || undefined);
  const teamId = pick(myTeam, "id", "Id", "TeamId");
  const { data: mySubmissions = [] } = useMySubmissions();

  const teamAppeals = useGetAppealsByTeam(!isEC ? teamId || undefined : undefined);
  const eventAppeals = useGetAppealsByEvent(isEC ? eventIdFromRole || undefined : undefined);

  const { data: appealsRaw, isLoading, refetch } = isEC ? eventAppeals : teamAppeals;
  const appeals: Appeal[] = Array.isArray(appealsRaw) ? appealsRaw : ((appealsRaw as any)?.data ?? []);

  const { mutateAsync: createAppeal, isPending: isSubmitting } = useCreateAppeal();
  const { mutateAsync: respondAppeal, isPending: isResponding } = useRespondAppeal();

  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!reason.trim() || !submitResultId) return;

    try {
      await createAppeal({ submitResultId, reason: reason.trim() });
      toast.success("🎉 Đã gửi đơn phúc khảo thành công! Ban Tổ Chức sẽ tiếp nhận và phản hồi kết quả qua email và thông báo chuông.");
      setReason("");
      setSubmitResultId("");
      refetch();
    } catch (err) {
      const errMsg = readApiError(err);
      setFormError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleRespond = async (status: typeof AppealStatus.Approved | typeof AppealStatus.Rejected) => {
    if (!detailModal || !responseText.trim()) return;
    setRespondError("");
    try {
      await respondAppeal({ id: detailModal.id, appealId: detailModal.id, status, response: responseText.trim(), payload: { status, response: responseText.trim() } } as any);
      if (status === AppealStatus.Approved) {
        toast.success("✅ Đã phê duyệt đơn phúc khảo. Điểm số bài thi đã được cập nhật và gửi thông báo tới đội thi.");
      } else {
        toast.info("Đã từ chối đơn phúc khảo. Lý do phản hồi đã được gửi qua thông báo và email tới đội thi.");
      }
      setDetailModal(null);
      setResponseText("");
      refetch();
    } catch (err) {
      const errMsg = readApiError(err);
      setRespondError(errMsg);
      toast.error(errMsg);
    }
  };

  const relatedSubmission = detailModal
    ? mySubmissions.find((s) => pick(s, "id", "Id") === detailModal.submitResultId)
    : undefined;

  return (
    <div className="p-[var(--space-xl)] max-w-[var(--container-max)] mx-auto hud-lattice min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[var(--border-muted)] pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#f59e0b] font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            <span>TRUNG TÂM PHÚC KHẢO VÀ PHẢN HỒI</span>
          </div>
          <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
            QUẢN LÝ ĐƠN PHÚC KHẢO BÀI NỘP
          </h1>
          <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
            {isEC
              ? "Tiếp nhận, kiểm tra và phản hồi các yêu cầu phúc khảo kết quả chấm điểm từ các đội thi."
              : "Tạo và theo dõi tiến độ xử lý đơn phúc khảo kết quả chấm điểm của đội thi trong các vòng đấu."}
          </p>
        </div>

        <Button variant="ghost" onClick={() => refetch()} className="text-xs font-mono shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {!isEC && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-2 flex items-center gap-2">
              <Send className="w-4 h-4 text-[var(--color-warning)]" />
              Gửi Đơn Phúc Khảo
            </h2>

            <Card className="p-6 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-4">
              <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                * Đơn phúc khảo chỉ được tạo bởi <strong>Trưởng nhóm</strong> và phải nộp <strong>trước khi</strong> kết quả vòng được công bố.
              </p>

              {isLeader ? (
                <form onSubmit={handleCreateAppeal} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      Bài nộp cần phúc khảo *
                    </label>
                    <select
                      value={submitResultId}
                      onChange={(e) => setSubmitResultId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-warning)]"
                    >
                      <option value="">-- Chọn bài nộp --</option>
                      {mySubmissions.map((s) => {
                        const id = pick(s, "id", "Id");
                        return (
                          <option key={id} value={id}>
                            {pick(s, "displayCode", "DisplayCode") || id}
                          </option>
                        );
                      })}
                    </select>
                    {mySubmissions.length === 0 && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">Đội chưa có bài nộp nào.</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      Lý do phúc khảo *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={4}
                      placeholder="Ghi rõ lý do khiếu nại..."
                      className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-xs font-mono focus:border-[var(--color-warning)] focus:outline-none text-[var(--text-primary)] resize-none"
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="font-mono text-xs text-[color:var(--color-danger)]">
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !reason.trim() || !submitResultId}
                    accent="team"
                    className="w-full justify-center"
                  >
                    {isSubmitting ? "// ĐANG GỬI..." : "[ GỬI ĐƠN PHÚC KHẢO ]"}
                  </Button>
                </form>
              ) : (
                <div className="p-4 border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 text-[var(--color-warning)] font-mono text-xs space-y-2">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    BẠN KHÔNG CÓ QUYỀN GỬI ĐƠN
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    Quyền tạo và gửi đơn khiếu nại điểm số thuộc về <strong>Trưởng nhóm</strong>. Bạn đang xem ở chế độ chỉ đọc.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        <div className={isEC ? "lg:col-span-3 flex flex-col gap-4" : "lg:col-span-2 flex flex-col gap-4"}>
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-2 flex items-center justify-between">
            <span>Danh sách đơn phúc khảo ({appeals.length})</span>
            {isEC && <Badge tone="coordinator">CHẾ ĐỘ XỬ LÝ (EC)</Badge>}
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">Đang tải danh sách đơn phúc khảo...</div>
          ) : appeals.length === 0 ? (
            <ApiMissingDataBadge
              title="CHƯA CÓ ĐƠN PHÚC KHẢO"
              message="Hiện chưa có đơn phúc khảo nào."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MÃ BÀI NỘP</TableHead>
                  <TableHead>LÝ DO KHIẾU NẠI</TableHead>
                  <TableHead>TRẠNG THÁI</TableHead>
                  <TableHead align="center">THAO TÁC</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {appeals.map((item) => {
                  const isPending = item.status === AppealStatus.Pending;
                  const isApproved = item.status === AppealStatus.Approved;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">#{item.submitResultId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-[var(--text-primary)] max-w-xs truncate">{item.reason}</span>
                          {item.response && (
                            <span className="text-[10px] font-mono text-[var(--accent-primary)] mt-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Phản hồi: {item.response}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={isPending ? "warning" : isApproved ? "success" : "danger"}>
                          {isPending ? "ĐANG CHỜ" : isApproved ? "CHẤP NHẬN" : "TỪ CHỐI"}
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setDetailModal(item);
                            setResponseText(item.response ?? "");
                            setRespondError("");
                          }}
                          className="text-[10px] font-mono text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10"
                        >
                          <Eye className="w-3.5 h-3.5" /> CHI TIẾT
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

      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-warning)] space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--color-warning)] font-bold tracking-widest uppercase">
                  // CHI TIẾT ĐƠN PHÚC KHẢO
                </span>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider mt-1">
                  Bài nộp #{detailModal.submitResultId}
                </h3>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-[var(--text-muted)] hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-[var(--bg-input)] border border-[var(--color-warning)]/40 hud-clipped space-y-1">
                <span className="text-[10px] text-[var(--color-warning)] font-bold uppercase block">Nội dung khiếu nại</span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-bold">&quot;{detailModal.reason}&quot;</p>
                <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                  Ngày gửi: {detailModal.createdTime ? new Date(detailModal.createdTime).toLocaleString("vi-VN") : "—"}
                </span>
              </div>

              {relatedSubmission ? (
                <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
                  <span className="text-[10px] text-[var(--accent-primary)] font-bold uppercase block">Bài nộp liên quan</span>
                  {pick(relatedSubmission, "repoUrl", "RepoUrl") && (
                    <div>
                      Repo:{" "}
                      <a
                        href={pick(relatedSubmission, "repoUrl", "RepoUrl")}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent-primary)] underline"
                      >
                        {pick(relatedSubmission, "repoUrl", "RepoUrl")}
                      </a>
                    </div>
                  )}
                  {pick(relatedSubmission, "demoUrl", "DemoUrl") && <div>Demo: {pick(relatedSubmission, "demoUrl", "DemoUrl")}</div>}
                </div>
              ) : (
                <p className="text-[10px] text-[var(--text-muted)]">
                  Không có thông tin bài nộp liên quan (chỉ hiển thị với bài nộp của đội bạn).
                </p>
              )}

              {isEC && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
                  <label className="text-xs font-mono text-[var(--accent-coordinator)] uppercase font-bold block">
                    Phản hồi từ Ban Tổ Chức *
                  </label>
                  <textarea
                    rows={3}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi hoặc kết quả điều chỉnh..."
                    className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent-coordinator)] resize-none"
                  />
                  {respondError && (
                    <p role="alert" className="font-mono text-xs text-[color:var(--color-danger)]">
                      {respondError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)] font-mono text-xs">
              <Button variant="ghost" onClick={() => setDetailModal(null)}>
                Đóng
              </Button>

              {isEC && detailModal.status === AppealStatus.Pending && (
                <div className="flex items-center gap-2">
                  <Button
                    disabled={!responseText.trim() || isResponding}
                    onClick={() => handleRespond(AppealStatus.Rejected)}
                    className="bg-[var(--color-danger)] text-white font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </Button>
                  <Button
                    disabled={!responseText.trim() || isResponding}
                    onClick={() => handleRespond(AppealStatus.Approved)}
                    className="bg-[var(--color-success)] text-white font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Chấp nhận
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
