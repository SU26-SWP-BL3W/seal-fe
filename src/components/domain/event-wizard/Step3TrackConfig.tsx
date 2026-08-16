"use client";

import React from "react";
import { RoundFormState, TrackFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { useGetTemplates } from "@/repositories/templatesRepository";
import { Target, Plus, Trash2, ArrowLeft, LayoutTemplate, ArrowRight } from "lucide-react";

interface Step3TrackConfigProps {
  rounds: RoundFormState[];
  tracks: TrackFormState[];
  onAddTrack: () => void;
  onRemoveTrack: (id: string) => void;
  onUpdateTrack: (id: string, field: keyof TrackFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isReadOnly?: boolean;
}

export const Step3TrackConfig: React.FC<Step3TrackConfigProps> = ({
  tracks,
  onAddTrack,
  onRemoveTrack,
  onUpdateTrack,
  onNext,
  onPrev,
  isReadOnly = false,
}) => {
  const { data: templates = [] } = useGetTemplates();

  return (
    <div className="bg-[#13191c] border border-[#263339] p-6 space-y-6 text-[#e1e7ec]">
      <div className="flex items-center justify-between border-b border-[#263339] pb-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-[#8b5cf6]" />
            Bước 3: Tạo Hạng Mục Thi (Tracks)
          </h3>
          <p className="text-xs font-mono text-[#8a9ba8] mt-1">
            Cấu hình các Hạng mục chuyên môn thuộc Sự kiện (ví dụ: AI &amp; Machine Learning, Web &amp; Product, Cloud Architecture...).
          </p>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={onAddTrack}
            className="px-3 py-1.5 bg-[#0a0e10] border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>THÊM HẠNG MỤC</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {tracks.length === 0 ? (
          <div className="p-8 bg-[#0a0e10] border border-[#263339] text-center text-[#8a9ba8] font-mono text-xs space-y-2">
            <p className="font-semibold text-sm">Chưa có Hạng mục thi nào được tạo</p>
            <p className="text-xs text-[#8a9ba8]/70">Nhấn nút "THÊM HẠNG MỤC" góc trên bên phải để bắt đầu thêm cấu hình cho sự kiện.</p>
          </div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.id}
              className="p-5 bg-[#0a0e10] border border-[#263339] space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#263339] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 text-xs font-bold flex items-center justify-center">
                    T{index + 1}
                  </span>
                  <h4 className="font-sans font-bold text-sm text-[#e1e7ec]">
                    {track.trackName || `Hạng mục ${index + 1}`}
                  </h4>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveTrack(track.id)}
                    className="text-xs text-[#ef4444] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Gỡ Hạng Mục
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên Hạng Mục */}
                <div className="space-y-1">
                  <label className="text-[11px] text-[#8a9ba8] uppercase">Tên hạng mục *</label>
                  <input
                    type="text"
                    value={track.trackName}
                    onChange={(e) => onUpdateTrack(track.id, "trackName", e.target.value)}
                    placeholder="Ví dụ: AI & Machine Learning"
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-sm focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Mẫu tiêu chí TemplateId */}
                <div className="space-y-1">
                  <label className="text-[11px] text-[#8a9ba8] uppercase flex items-center gap-1">
                    <LayoutTemplate className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    Mẫu tiêu chí chấm điểm RBL
                  </label>
                  <select
                    value={track.templateId}
                    onChange={(e) => onUpdateTrack(track.id, "templateId", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="">— Chọn mẫu tiêu chí từ Ngân Hàng Hệ Thống —</option>
                    {templates.map((t: any) => (
                      <option key={t.id || t.Id || t.templateId} value={t.id || t.Id || t.templateId}>
                        {t.templateName || t.TemplateName}
                      </option>
                    ))}
                    <option value="__custom__">Soạn bộ tiêu chí riêng cho Hạng mục này ở Bước 4</option>
                  </select>
                </div>

                {/* Mô tả hạng mục */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] text-[#8a9ba8] uppercase">Mô tả &amp; Quy định nộp bài</label>
                  <input
                    type="text"
                    value={track.description}
                    onChange={(e) => onUpdateTrack(track.id, "description", e.target.value)}
                    placeholder="Phạm vi đề bài, giới hạn công nghệ áp dụng..."
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#263339] font-mono text-xs">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> &lt; Bước 2: Vòng Thi
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors uppercase"
        >
          <span>TIẾP TỤC BƯỚC 4: TIÊU CHÍ CHẤM</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
