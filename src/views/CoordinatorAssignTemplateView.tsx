"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetTemplates } from "@/repositories/templatesRepository";
import { tracksRepository } from "@/repositories/tracksRepository";
import { AlertCircle, Lock, CheckCircle2, Info, Copy, FolderGit2, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export const CoordinatorAssignTemplateView: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const trackId = (params?.trackId as string) || "";

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: templatesList = [] } = useGetTemplates();

  useEffect(() => {
    if (Array.isArray(templatesList) && templatesList.length > 0 && !selectedTemplateId) {
      const firstId = (templatesList[0] as any)?.id || (templatesList[0] as any)?.Id || "";
      if (firstId) setSelectedTemplateId(firstId);
    }
  }, [templatesList, selectedTemplateId]);

  const selectedTemplate = (templatesList as any[]).find(
    (t: any) => (t.id || t.Id) === selectedTemplateId
  );
  const activeCriteriaList: any[] =
    (selectedTemplate as any)?.criterias ||
    (selectedTemplate as any)?.TemplateCriterias ||
    [];
  const runningTotalWeight = activeCriteriaList.reduce(
    (acc: number, c: any) => acc + (c.weight || c.Weight || 0),
    0
  );
  const missingAllocation = 100.0 - runningTotalWeight;
  const isWeightValid =
    activeCriteriaList.length > 0 && runningTotalWeight === 100.0;

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) {
      setErrorMessage("Vui lòng chọn một bộ tiêu chí!");
      return;
    }
    if (!isWeightValid) {
      setErrorMessage("TỔNG TRỌNG SỐ TIÊU CHÍ CỦA MẪU PHẢI ĐẠT ĐÚNG 100%!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await tracksRepository.assignTemplateToTrack(trackId, selectedTemplateId);
      setSuccessMessage("ĐÃ GÁN MẪU TIÊU CHÍ CHO HẠNG MỤC THÀNH CÔNG!");
      setTimeout(() => {
        router.push("/coordinator/staff");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(
        `Gán mẫu thất bại: ${err?.response?.data?.message || err?.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)] tracking-wider">
          <Link href="/coordinator/staff" className="text-[#a855f7] hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>QUAY LẠI QUẢN LÝ SỰ KIỆN &amp; TRACKS</span>
          </Link>
          <span>/</span>
          <span className="text-white font-bold">GÁN MẪU TIÊU CHÍ (RUBRIC)</span>
        </div>

        {/* Title */}
        <div className="border-b border-[var(--border-muted)] pb-4">
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider">
            GÁN MẪU TIÊU CHÍ CHẤM ĐIỂM CHO HẠNG MỤC
          </h1>
          <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
            Lựa chọn mẫu tiêu chí từ ngân hàng và kiểm tra tổng trọng số trước khi áp dụng cho Hạng mục.
          </p>
        </div>

        {/* Panel 1: TARGET TRACK IDENTIFICATION */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-5 space-y-3 font-mono text-xs rounded-lg">
          <div className="text-[var(--text-muted)] font-bold tracking-widest border-b border-[var(--border-muted)] pb-2 uppercase">
            HẠNG MỤC THI ĐƯỢC CHỌN (TARGET TRACK)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <div className="text-[var(--text-muted)] text-[11px]">MÃ HẠNG MỤC</div>
              <div className="text-[#c084fc] font-bold text-sm mt-0.5 truncate">{trackId || "Chưa chọn"}</div>
            </div>

            <div>
              <div className="text-[var(--text-muted)] text-[11px]">TÊN HẠNG MỤC</div>
              <div className="text-[var(--accent-primary)] font-bold text-sm mt-0.5 uppercase truncate">
                {trackId ? `HẠNG MỤC (${trackId.slice(0, 8)}...)` : "CHƯA CHỌN HẠNG MỤC"}
              </div>
            </div>

            <div>
              <div className="text-[var(--text-muted)] text-[11px]">TRẠNG THÁI TIÊU CHÍ</div>
              <div className="text-amber-400 font-bold text-sm mt-0.5 uppercase">
                {selectedTemplate ? "ĐÃ CHỌN MẪU TƯƠNG THÍCH" : "CHƯA CHỌN MẪU"}
              </div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {errorMessage && (
          <div className="p-4 bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs flex items-center gap-3 rounded">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-3 rounded">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2 Columns Below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: SOURCE SELECTION (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 space-y-6 flex flex-col justify-between rounded-lg">
            <div className="space-y-4">
              <div className="border-b border-[var(--border-muted)] pb-3 font-mono text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">
                CHỌN MẪU TIÊU CHÍ
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="text-[var(--text-muted)] tracking-wider block uppercase">
                  CHỌN MẪU TỪ NGÂN HÀNG ({templatesList.length} mẫu sẵn sàng)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[#c084fc] rounded cursor-pointer"
                >
                  {templatesList.length === 0 ? (
                    <option value="">Chưa có bộ tiêu chí nào trong hệ thống</option>
                  ) : (
                    templatesList.map((t: any) => {
                      const id = t.id || t.Id;
                      const name = t.templateName || t.TemplateName || "Bộ tiêu chí";
                      const crits = t.criterias || t.TemplateCriterias || [];
                      const totalW = crits.reduce(
                        (acc: number, c: any) => acc + (c.weight || c.Weight || 0),
                        0
                      );
                      return (
                        <option key={id} value={id}>
                          {name} ({totalW}% - {crits.length} tiêu chí)
                        </option>
                      );
                    })
                  )}
                </select>

                {/* LOI_04: Link to Clone & Customization in Templates View */}
                <Link href="/coordinator/templates">
                  <button
                    type="button"
                    className="w-full mt-2 py-2 px-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/20 text-[#c084fc] font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>TÙY BIẾN HOẶC NHÂN BẢN MẪU MỚI (CLONE)</span>
                  </button>
                </Link>
              </div>

              {/* TEMPLATE DETAILS Card */}
              <div className="bg-[var(--bg-base)] border border-[var(--border-muted)] p-4 space-y-3 font-mono text-xs rounded">
                <div className="text-[#c084fc] font-bold flex items-center gap-2 border-b border-[var(--border-muted)] pb-2 uppercase">
                  <Info className="w-4 h-4" />
                  <span>CHI TIẾT BỘ TIÊU CHÍ ĐANG CHỌN</span>
                </div>

                <div className="space-y-2 text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>Tên bộ tiêu chí:</span>
                    <span className="text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                      {selectedTemplate?.templateName || selectedTemplate?.TemplateName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng số tiêu chí:</span>
                    <span className="text-[var(--text-primary)] font-bold">{activeCriteriaList.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng trọng số:</span>
                    <span className={runningTotalWeight === 100 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {runningTotalWeight}% / 100%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mô tả:</span>
                    <span className="text-[var(--text-primary)] truncate max-w-[220px]">
                      {selectedTemplate?.description || selectedTemplate?.Description || "Tiêu chí chấm thi chuẩn."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: TEMPLATE PREVIEW & VALIDATION (7 cols) */}
          <div className="lg:col-span-7 bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 space-y-5 rounded-lg">
            <div className="border-b border-[var(--border-muted)] pb-3 font-mono text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase flex items-center justify-between">
              <span>XEM TRƯỚC TIÊU CHÍ THÀNH PHẦN ({activeCriteriaList.length})</span>
              {isWeightValid ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ĐỦ 100%
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  ⚠️ CHƯA ĐỦ 100%
                </span>
              )}
            </div>

            {/* RUNNING TOTAL WEIGHT Card */}
            <div className="bg-[var(--bg-base)] border border-[var(--border-muted)] p-4 flex items-center justify-between rounded">
              <div className="font-mono text-xs text-[var(--text-muted)] font-bold tracking-widest uppercase">
                TỔNG TRỌNG SỐ HIỆN TẠI
              </div>
              <div className="font-mono text-2xl font-bold flex items-center gap-2">
                <span className={runningTotalWeight === 100 ? "text-emerald-400" : "text-amber-400"}>
                  {runningTotalWeight.toFixed(1)}%
                </span>
                {!isWeightValid && <span className="text-xl">⚠️</span>}
              </div>
            </div>

            {/* OVERRIDE DENIED Callout Box */}
            {!isWeightValid && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 text-amber-300 font-mono text-xs space-y-1 rounded">
                <div className="font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>CẢNH BÁO: TỔNG TRỌNG SỐ PHẢI BẰNG ĐÚNG 100%</span>
                </div>
                <div className="text-[11px] text-amber-200/80">
                  {runningTotalWeight < 100
                    ? `Mẫu này đang thiếu ${missingAllocation.toFixed(1)}% trọng số. Vui lòng bấm Nhân bản để bổ sung tiêu chí.`
                    : `Mẫu này đang thừa ${(runningTotalWeight - 100).toFixed(1)}% trọng số. Vui lòng chỉnh lại.`}
                </div>
              </div>
            )}

            {/* Criteria Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] tracking-wider text-[11px]">
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">TÊN TIÊU CHÍ</th>
                    <th className="p-3 w-28 text-right">ĐIỂM TỐI ĐA</th>
                    <th className="p-3 w-28 text-right">TRỌNG SỐ %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]">
                  {activeCriteriaList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-[var(--text-muted)]">
                        Mẫu này chưa có tiêu chí nào.
                      </td>
                    </tr>
                  ) : (
                    activeCriteriaList.map((crit: any, idx: number) => (
                      <tr key={crit.id || idx} className="hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-3 text-[var(--text-muted)]">0{idx + 1}</td>
                        <td className="p-3 text-[var(--text-primary)] font-medium">
                          {crit.criterionName || crit.criteriaName || crit.name || "Tiêu chí"}
                        </td>
                        <td className="p-3 text-right text-amber-400 font-bold">
                          {(crit.maxScore || 10).toFixed(1)}
                        </td>
                        <td className="p-3 text-right text-cyan-400 font-bold">
                          {(crit.weight || 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg">
          <div className="flex items-center gap-3">
            {!isWeightValid && <Lock className="w-5 h-5 text-amber-400" />}
            <div>
              <div className={`font-mono text-xs font-bold uppercase tracking-wider ${isWeightValid ? "text-emerald-400" : "text-amber-400"}`}>
                {isWeightValid ? "SẴN SÀNG ÁP DỤNG" : "THAO TÁC ĐANG BỊ KHÓA"}
              </div>
              <div className="font-mono text-[11px] text-[var(--text-muted)]">
                {isWeightValid
                  ? "Mẫu tiêu chí đã đủ 100% trọng số, bạn có thể gán cho hạng mục."
                  : "Vui lòng chọn hoặc nhân bản mẫu tiêu chí có tổng trọng số đủ 100%."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link href="/coordinator/staff">
              <button
                type="button"
                className="px-6 py-2.5 border border-zinc-700 hover:border-white text-zinc-300 hover:text-white font-mono text-xs rounded transition-colors cursor-pointer"
              >
                HỦY BỎ
              </button>
            </Link>

            <button
              type="button"
              disabled={!isWeightValid || isSubmitting}
              onClick={handleAssignTemplate}
              className={`px-8 py-2.5 font-mono font-bold text-xs tracking-wider rounded transition-all cursor-pointer ${
                !isWeightValid || isSubmitting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                  : "bg-[#a855f7] text-white hover:bg-[#c084fc] shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              }`}
            >
              {isSubmitting ? "ĐANG GÁN MẪU..." : "XÁC NHẬN GÁN MẪU CHO TRACK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
