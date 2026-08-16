"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import {
  useAppeals,
  useCreateAppeal,
  type AppealDTO,
} from "@/repositories/appealsRepository";
import { useMySubmissions, readApiError } from "@/repositories/submitResultsRepository";
import {
  Scale,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";

export function AppealsView() {
  const searchParams = useSearchParams();
  const prefillSubId = searchParams.get("subId") || "";

  const { user } = useAuth();
  const { data: teamResponse } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;
  const teamId = team?.id || team?.Id || "";

  const { data: submissions = [] } = useMySubmissions();
  const { data: appeals = [], isLoading: loadingAppeals, refetch } = useAppeals(teamId || undefined);

  // Form State
  const [selectedSubmitResultId, setSelectedSubmitResultId] = useState(prefillSubId);
  const [reason, setReason] = useState("");
  const [proposedScore, setProposedScore] = useState<number | undefined>(undefined);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const createAppealMutation = useCreateAppeal();

  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      setSubmitError("Bạn chưa có đội thi để thực hiện quyền phúc khảo.");
      return;
    }
    const targetSubId = selectedSubmitResultId || submissions[0]?.id || submissions[0]?.Id;
    if (!targetSubId) {
      setSubmitError("Vui lòng chọn một bài nộp để gửi đơn phúc khảo.");
      return;
    }
    if (!reason.trim()) {
      setSubmitError("Vui lòng nhập rõ lý do và căn cứ khiếu nại điểm số.");
      return;
    }

    setSubmitError("");

    const payload = {
      SubmissionId: targetSubId,
      Reason: proposedScore !== undefined ? `[Điểm đề xuất: ${proposedScore}/10] ${reason.trim()}` : reason.trim(),
    };

    try {
      await createAppealMutation.mutateAsync(payload);
      setSubmitSuccess(true);
      setReason("");
      setProposedScore(undefined);
      refetch();
    } catch (err) {
      setSubmitError(readApiError(err));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[#bbc9ce]">
        Vui lòng đăng nhập để truy cập Trung tâm Phúc khảo.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#febb29] selection:text-[#271900]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Panel (Stitch T8) */}
        <div className="bg-[#1a2123] relative p-6 border-t-2 border-[#febb29] shadow-[inset_0_0_20px_rgba(254,187,41,0.05)] border border-white/5 glow-box">
          <div className="corner-accent-tl" />
          <div className="corner-accent-br" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] text-[#859398] mb-1 uppercase tracking-wider">
                MODULE // APPEALS_COMMISSION
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
                <Scale className="w-8 h-8 text-[#febb29]" />
                Trung Tâm Phúc Khảo &amp; Khiếu Nại Điểm
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="font-mono text-xs text-[#bbc9ce] hover:text-[#febb29] border border-[#3c494d] bg-[#080f11] px-3 py-2 flex items-center gap-1.5 transition-colors uppercase"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#3c494d]/40 font-mono text-xs">
            <div className="bg-[#0e1417] border border-[#3c494d] px-3.5 py-1.5 flex items-center gap-2">
              <span className="text-[#859398]">ĐỘI THI:</span>
              <span className="text-[#38bdf8] font-bold">{team?.name || team?.Name || "Chưa có đội"}</span>
            </div>
            <div className="bg-[#0e1417] border border-[#3c494d] px-3.5 py-1.5 flex items-center gap-2">
              <span className="text-[#859398]">QUY CHUẨN:</span>
              <span className="text-[#febb29] font-bold">Hội đồng BTC xem xét độc lập</span>
            </div>
          </div>
        </div>

        {/* Content Grid (Stitch T8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-white/10 border border-white/10 glow-box">
          {/* Left Column: Create Appeal Form (5 cols) */}
          <div className="lg:col-span-5 bg-[#1a2123] p-6 flex flex-col gap-4">
            <div className="bg-[#febb29]/10 h-7 -mx-6 -mt-6 mb-2 flex items-center px-6 border-b border-[#febb29]/20 font-mono text-[11px] text-[#febb29] font-bold uppercase tracking-widest">
              GỬI ĐƠN PHÚC KHẢO MỚI
            </div>

            {submitSuccess && (
              <div className="p-4 bg-[#34d399]/10 border border-[#34d399] text-[#34d399] font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Đơn phúc khảo đã được chuyển thành công tới Ban Tổ Chức!</span>
              </div>
            )}

            <form onSubmit={handleCreateAppeal} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-white uppercase mb-1.5 font-bold">
                  Chọn Bài Nộp Cần Phúc Khảo *
                </label>
                <select
                  value={selectedSubmitResultId}
                  onChange={(e) => setSelectedSubmitResultId(e.target.value)}
                  className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#febb29]"
                >
                  {submissions.length === 0 ? (
                    <option value="">Chưa có bài nộp nào</option>
                  ) : (
                    submissions.map((sub, idx) => (
                      <option key={sub.id || sub.Id || idx} value={sub.id || sub.Id}>
                        {(sub as any).roundName || (sub as any).RoundName || `Vòng ${idx + 1}`} - ID: {(sub.id || sub.Id || "").slice(0, 8)}...
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-white uppercase mb-1.5 font-bold">
                  Lý Do &amp; Căn Cứ Khiếu Nại (Reason &amp; Justification) *
                </label>
                <textarea
                  required
                  rows={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Trình bày chi tiết lý do bạn cho rằng điểm số chưa chính xác theo tiêu chí nào..."
                  className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#febb29]"
                />
              </div>

              <div>
                <label className="block text-[#859398] uppercase mb-1.5">
                  Điểm Số Đề Xuất (Thang 10 - Tùy chọn)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={proposedScore ?? ""}
                  onChange={(e) => setProposedScore(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="VD: 8.5"
                  className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#febb29]"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createAppealMutation.isPending || submissions.length === 0}
                  className="w-full bg-[#febb29] text-[#271900] font-display text-sm font-bold py-3.5 px-6 rounded-[12px] rounded-br-none hover:bg-white transition-all flex items-center justify-center gap-2 uppercase shadow-[0_0_15px_rgba(254,187,41,0.3)]"
                >
                  <Send className="w-4 h-4" />
                  {createAppealMutation.isPending ? "Đang gửi đơn..." : "// GỬI ĐƠN PHÚC KHẢO (TRANSMIT_APPEAL) >"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Appeals History Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#1a2123] flex flex-col">
            <div className="h-8 bg-[#38bdf8]/10 border-b border-[#38bdf8]/30 flex items-center px-4 justify-between font-mono text-xs">
              <span className="text-[#38bdf8] font-bold tracking-widest">[ APPEALS_HISTORY_LOG ]</span>
              <span className="text-[#38bdf8]/70 text-[10px]">TỔNG: {appeals.length} ĐƠN</span>
            </div>

            {loadingAppeals ? (
              <div className="p-12 text-center font-mono text-xs text-[#febb29] animate-pulse">
                [ SYSTEM_LOG: LOADING_APPEALS... ]
              </div>
            ) : appeals.length === 0 ? (
              <div className="p-12 text-center font-mono text-xs text-[#859398] space-y-2">
                <Scale className="w-10 h-10 text-[#859398]/40 mx-auto" />
                <p>Đội của bạn chưa có đơn phúc khảo nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#3c494d]/60 bg-[#0e1417]/80 text-[#859398]">
                      <th className="py-3 px-3 uppercase">MÃ ĐƠN</th>
                      <th className="py-3 px-3 uppercase">LÝ DO</th>
                      <th className="py-3 px-3 uppercase">TRẠNG THÁI</th>
                      <th className="py-3 px-3 uppercase">PHẢN HỒI BTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3c494d]/40">
                    {appeals.map((item) => {
                      const id = item.AppealId;
                      const status = item.Status;
                      const reasonText = item.Reason;
                      const responseText = item.ResponseReason || "Chờ BTC xem xét";

                      return (
                        <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            #{id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-3 text-[#bbc9ce] max-w-xs truncate" title={reasonText}>
                            {reasonText}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {status === "Approved" ? (
                              <span className="px-2 py-0.5 border border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399] text-[10px] font-bold uppercase">
                                ✓ CHẤP THUẬN
                              </span>
                            ) : status === "Rejected" ? (
                              <span className="px-2 py-0.5 border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase">
                                ✗ TỪ CHỐI
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 border border-[#febb29]/40 bg-[#febb29]/10 text-[#febb29] text-[10px] font-bold uppercase">
                                ⏳ ĐANG XỬ LÝ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#859398] text-[11px] max-w-xs truncate">
                            {responseText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
