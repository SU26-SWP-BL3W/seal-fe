"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { tracksRepository } from "@/repositories/tracksRepository";
import { AlertCircle, Lock, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesModal } from "@/components/domain/UnsavedChangesModal";

export const CoordinatorAssignTemplateView: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const trackId = (params?.trackId as string) || "";

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const { showModal, confirmLeave, cancelStay } = useUnsavedChanges(isDirty);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: templatesList = [] } = useGetTemplates();

  const selectedTemplate = templatesList.find((t: any) => (t.id || t.Id) === selectedTemplateId);
  const activeCriteriaList: any[] = (selectedTemplate as any)?.criterias || (selectedTemplate as any)?.TemplateCriterias || [];
  const runningTotalWeight = activeCriteriaList.reduce((acc: number, c: any) => acc + (c.weight || c.Weight || 0), 0);
  const missingAllocation = 100.0 - runningTotalWeight;
  const isWeightValid = activeCriteriaList.length === 0 || runningTotalWeight === 100.0;

  const handleAssignTemplate = async () => {
    if (!isWeightValid) {
      setErrorMessage("TỔNG TRỌNG SỐ TIÊU CHÍ PHẢI ĐỦ 100%");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await tracksRepository.assignTemplateToTrack(trackId, selectedTemplateId);
      setSuccessMessage("ĐÃ GÁN MẪU TIÊU CHÍ CHO HẠNG MỤC THÀNH CÔNG!");
      setIsDirty(false);
    } catch (err: any) {
      setErrorMessage(`Gán mẫu thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1417] text-[#dde4e6] font-sans">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        
        {/* Title */}
        <div className="border-b border-[#3c494d] pb-4">
          <h1 className="font-mono font-bold text-3xl text-[#dde4e6] uppercase tracking-wider">
            GÁN MẪU TIÊU CHÍ CHẤM ĐIỂM CHO HẠNG MỤC
          </h1>
          <p className="font-sans text-xs text-[#bbc9ce] mt-1">
            Lựa chọn mẫu tiêu chí từ ngân hàng và kiểm tra tổng trọng số trước khi áp dụng.
          </p>
        </div>

        {/* Panel 1: TARGET TRACK IDENTIFICATION */}
        <div className="bg-[#161d1f] border border-[#3c494d] p-5 space-y-3 font-mono text-xs">
          <div className="text-[#bbc9ce] font-bold tracking-widest border-b border-[#3c494d] pb-2 uppercase">
            HẠNG MỤC THI ĐƯỢC CHỌN (TARGET TRACK)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <div className="text-[#bbc9ce] text-[11px]">MÃ HẠNG MỤC</div>
              <div className="text-[#a78bfa] font-bold text-sm mt-0.5">{trackId}</div>
            </div>

            <div>
              <div className="text-[#bbc9ce] text-[11px]">TÊN HẠNG MỤC</div>
              <div className="text-[#00d9ff] font-bold text-sm mt-0.5 uppercase">{trackId ? `HẠNG MỤC (${trackId})` : "CHƯA CHỌN HẠNG MỤC"}</div>
            </div>

            <div>
              <div className="text-[#bbc9ce] text-[11px]">TRẠNG THÁI HIỆN TẠI</div>
              <div className="text-[#febb29] font-bold text-sm mt-0.5 uppercase">CHƯA CÓ MẪU CHẤM</div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500 text-red-400 font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500 text-emerald-300 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2 Columns Below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: SOURCE SELECTION (5 cols) */}
          <div className="lg:col-span-5 bg-[#161d1f] border border-[#3c494d] p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[#3c494d] pb-3 font-mono text-xs font-bold text-[#bbc9ce] tracking-widest uppercase">
                CHỌN MẪU TIÊU CHÍ
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="text-[#bbc9ce] tracking-wider block uppercase">
                  CHỌN MẪU TỪ NGÂN HÀNG
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-3 bg-[#152238] border border-[#3c494d] text-[#dde4e6] font-mono text-xs focus:outline-none focus:border-[#00d9ff]"
                >
                  <option value="TPL-CLOUD-02">Cloud Architect Standard V2 (ID: TPL-CLOUD-02)</option>
                  <option value="TPL-DEVOPS-01">DevOps Security Master (ID: TPL-DEVOPS-01)</option>
                  <option value="TPL-AI-03">AI Innovation Benchmark (ID: TPL-AI-03)</option>
                </select>
              </div>

              {/* TEMPLATE DETAILS Card */}
              <div className="bg-[#0e1417] border border-[#3c494d] p-4 space-y-3 font-mono text-xs">
                <div className="text-[#00d9ff] font-bold flex items-center gap-2 border-b border-[#3c494d] pb-2 uppercase">
                  <Info className="w-4 h-4" />
                  <span>CHI TIẾT MẪU</span>
                </div>

                <div className="space-y-2 text-[#bbc9ce]">
                  <div className="flex justify-between">
                    <span>Tổng số tiêu chí:</span>
                    <span className="text-[#dde4e6] font-bold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thang điểm tối đa:</span>
                    <span className="text-[#dde4e6] font-bold">100.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tác giả:</span>
                    <span className="text-[#dde4e6]">SYS_ADMIN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: TEMPLATE PREVIEW & VALIDATION (7 cols) */}
          <div className="lg:col-span-7 bg-[#161d1f] border border-[#3c494d] p-6 space-y-5">
            <div className="border-b border-[#3c494d] pb-3 font-mono text-xs font-bold text-[#bbc9ce] tracking-widest uppercase flex items-center justify-between">
              <span>XEM TRƯỚC VÀ KIỂM TRA MẪU</span>
            </div>

            {/* RUNNING TOTAL WEIGHT Card */}
            <div className="bg-[#0e1417] border border-[#3c494d] p-4 flex items-center justify-between">
              <div className="font-mono text-xs text-[#bbc9ce] font-bold tracking-widest uppercase">
                TỔNG TRỌNG SỐ HIỆN TẠI
              </div>
              <div className="font-mono text-2xl font-bold text-[#febb29] flex items-center gap-2">
                <span>{runningTotalWeight.toFixed(1)}%</span>
                {!isWeightValid && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
              </div>
            </div>

            {/* OVERRIDE DENIED Callout Box */}
            {!isWeightValid && (
              <div className="p-4 bg-red-500/10 border border-[#ef4444] text-[#ef4444] font-mono text-xs space-y-1">
                <div className="font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                  <span>KHÔNG THỂ GÁN: TỔNG TRỌNG SỐ PHẢI BẰNG ĐÚNG 100%</span>
                </div>
                <div className="text-[11px] text-[#ef4444]/80">
                  Tổng hiện tại: 25+30+15+20 = 90.0%
                </div>
              </div>
            )}

            {/* Criteria Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#3c494d] text-[#bbc9ce] tracking-wider text-[11px]">
                    <th className="p-3 w-12">ID</th>
                    <th className="p-3">TÊN TIÊU CHÍ</th>
                    <th className="p-3 w-28 text-right">ĐIỂM TỐI ĐA</th>
                    <th className="p-3 w-28 text-right">TRỌNG SỐ %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {activeCriteriaList.map((crit: any, idx: number) => (
                    <tr key={crit.id || idx} className="hover:bg-[#1a2123]">
                      <td className="p-3 text-[#bbc9ce]">0{idx + 1}</td>
                      <td className="p-3 text-[#dde4e6]">{crit.criterionName || crit.name}</td>
                      <td className="p-3 text-right text-[#febb29] font-bold">{(crit.maxScore || 10).toFixed(1)}</td>
                      <td className="p-3 text-right text-[#00d9ff] font-bold">{(crit.weight || 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {!isWeightValid && (
                    <tr className="bg-red-500/5 font-bold text-[#ef4444]">
                      <td colSpan={3} className="p-3 tracking-wider">
                        TRỌNG SỐ THIẾU:
                      </td>
                      <td className="p-3 text-right">{missingAllocation.toFixed(1)}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Bottom Action Bar */}
        <div className="bg-[#161d1f] border border-[#3c494d] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isWeightValid && <Lock className="w-5 h-5 text-[#ef4444]" />}
            <div>
              <div className="font-mono text-xs font-bold text-[#ef4444] uppercase tracking-wider">
                THAO TÁC ĐANG BỊ KHÓA
              </div>
              <div className="font-mono text-[11px] text-[#bbc9ce]">
                Vui lòng điều chỉnh tổng trọng số mẫu tiêu chí đủ 100% để tiếp tục.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Link href="/coordinator/templates">
              <button
                type="button"
                className="px-6 py-2.5 border border-[#3c494d] text-[#dde4e6] font-mono text-xs hover:bg-[#3c494d]/30 transition-colors cursor-pointer"
              >
                HỦY BỎ
              </button>
            </Link>

            <button
              type="button"
              disabled={!isWeightValid || isSubmitting}
              onClick={handleAssignTemplate}
              className={`px-8 py-3 font-mono font-bold text-xs tracking-wider transition-all ${
                !isWeightValid || isSubmitting
                  ? "bg-[#3c494d] text-[#bbc9ce]/50 cursor-not-allowed"
                  : "bg-[#a78bfa] text-[#0e1417] hover:bg-purple-300 cursor-pointer shadow-[0_0_15px_rgba(167,139,250,0.3)]"
              }`}
              style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
            >
              {isSubmitting ? "ĐANG GÁN MẪU..." : "XÁC NHẬN GÁN MẪU"}
            </button>
          </div>
        </div>

      </div>
      <UnsavedChangesModal
        isOpen={showModal}
        onConfirmLeave={confirmLeave}
        onCancelStay={cancelStay}
      />
    </div>
  );
};
