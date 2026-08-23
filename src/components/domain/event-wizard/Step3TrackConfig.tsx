import React from "react";
import { RoundFormState, TrackFormState } from "@/viewModels/coordinator/useCreateEventWizardViewModel";
import { useGetTemplates } from "@/repositories/templatesRepository";
import { Target, Plus, Trash2, ArrowLeft, LayoutTemplate, ArrowRight, Save, Link as LinkIcon, Code, Video, Presentation, Layout, FileText } from "lucide-react";

export interface LinkRulesConfig {
  github: "required" | "optional" | "none";
  demo: "required" | "optional" | "none";
  slides: "required" | "optional" | "none";
  figma: "required" | "optional" | "none";
  docs: "required" | "optional" | "none";
}

export const DEFAULT_LINK_RULES: LinkRulesConfig = {
  github: "required",
  demo: "required",
  slides: "optional",
  figma: "none",
  docs: "none",
};

export function parseLinkRules(raw?: string | null): LinkRulesConfig {
  if (!raw) return { ...DEFAULT_LINK_RULES };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && ("github" in parsed || "demo" in parsed)) {
      return {
        github: parsed.github || "none",
        demo: parsed.demo || "none",
        slides: parsed.slides || "none",
        figma: parsed.figma || "none",
        docs: parsed.docs || "none",
      };
    }
  } catch {
    const text = raw.toLowerCase();
    return {
      github: text.includes("github") || text.includes("mã nguồn") || text.includes("code") ? "required" : "optional",
      demo: text.includes("demo") || text.includes("video") || text.includes("youtube") ? "required" : "optional",
      slides: text.includes("slide") || text.includes("thuyết trình") || text.includes("canva") ? "optional" : "none",
      figma: text.includes("figma") || text.includes("thiết kế") || text.includes("ui") ? "optional" : "none",
      docs: text.includes("báo cáo") || text.includes("tài liệu") || text.includes("pdf") ? "optional" : "none",
    };
  }
  return { ...DEFAULT_LINK_RULES };
}

const LINK_DELIVERABLE_TYPES = [
  { key: "github", label: "Mã Nguồn (GitHub / GitLab)", icon: <Code className="w-3.5 h-3.5 text-[#00d9ff]" /> },
  { key: "demo", label: "Video Demo (YouTube / Drive)", icon: <Video className="w-3.5 h-3.5 text-[#ef4444]" /> },
  { key: "slides", label: "Slide Thuyết Trình (Canva / Drive)", icon: <Presentation className="w-3.5 h-3.5 text-[#f59e0b]" /> },
  { key: "figma", label: "Thiết Kế UI/UX (Figma / XD)", icon: <Layout className="w-3.5 h-3.5 text-[#a855f7]" /> },
  { key: "docs", label: "Báo Cáo / Tài Liệu PDF", icon: <FileText className="w-3.5 h-3.5 text-[#10b981]" /> },
] as const;

interface Step3TrackConfigProps {
  rounds: RoundFormState[];
  tracks: TrackFormState[];
  onAddTrack: () => void;
  onRemoveTrack: (id: string) => void;
  onUpdateTrack: (id: string, field: keyof TrackFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft?: () => void;
  isReadOnly?: boolean;
}

export const Step3TrackConfig: React.FC<Step3TrackConfigProps> = ({
  tracks,
  onAddTrack,
  onRemoveTrack,
  onUpdateTrack,
  onNext,
  onPrev,
  onSaveDraft,
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
            Cấu hình các Hạng mục chuyên môn thuộc Sự kiện &amp; Quy định loại Link bài nộp đồng bộ cho thí sinh.
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
          tracks.map((track, index) => {
            const linkRules = parseLinkRules(track.submissionRuleDescription || track.description);

            const handleUpdateLinkStatus = (key: keyof LinkRulesConfig, status: "required" | "optional" | "none") => {
              const nextRules = { ...linkRules, [key]: status };
              onUpdateTrack(track.id, "submissionRuleDescription", JSON.stringify(nextRules));
            };

            return (
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
                      Mẫu tiêu chí chấm điểm
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
                    <label className="text-[11px] text-[#8a9ba8] uppercase">Mô tả định hướng hạng mục</label>
                    <input
                      type="text"
                      value={track.description}
                      onChange={(e) => onUpdateTrack(track.id, "description", e.target.value)}
                      placeholder="Phạm vi đề bài, giới hạn công nghệ áp dụng..."
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  {/* HUD Submission Deliverables Link Configurator */}
                  <div className="md:col-span-2 p-4 bg-[#070b0d] border border-[#263339] space-y-3">
                    <div className="flex flex-wrap items-center justify-between border-b border-[#263339] pb-2 gap-2">
                      <label className="text-[11px] text-[#00d9ff] uppercase font-bold flex items-center gap-1.5 font-mono">
                        <LinkIcon className="w-3.5 h-3.5 text-[#00d9ff]" />
                        CẤU HÌNH LOẠI LINK BÀI NỘP CHO THÍ SINH
                      </label>
                      <span className="text-[10px] text-[#8a9ba8] font-sans">
                        Tự động hiển thị ô nhập &amp; kiểm tra ở View Nộp bài
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {LINK_DELIVERABLE_TYPES.map((opt) => {
                        const statusVal = linkRules[opt.key as keyof LinkRulesConfig] || "none";

                        return (
                          <div key={opt.key} className="p-3 bg-[#0a0e10] border border-[#263339] space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#e1e7ec]">
                              {opt.icon}
                              <span>{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] font-mono pt-1">
                              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                                <input
                                  type="radio"
                                  name={`link_${track.id}_${opt.key}`}
                                  checked={statusVal === "required"}
                                  onChange={() => handleUpdateLinkStatus(opt.key as keyof LinkRulesConfig, "required")}
                                  disabled={isReadOnly}
                                  className="accent-[#ef4444]"
                                />
                                <span className={statusVal === "required" ? "text-[#ef4444] font-bold" : "text-[#8a9ba8]"}>
                                  Bắt buộc
                                </span>
                              </label>

                              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                                <input
                                  type="radio"
                                  name={`link_${track.id}_${opt.key}`}
                                  checked={statusVal === "optional"}
                                  onChange={() => handleUpdateLinkStatus(opt.key as keyof LinkRulesConfig, "optional")}
                                  disabled={isReadOnly}
                                  className="accent-[#38bdf8]"
                                />
                                <span className={statusVal === "optional" ? "text-[#38bdf8] font-bold" : "text-[#8a9ba8]"}>
                                  Tùy chọn
                                </span>
                              </label>

                              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                                <input
                                  type="radio"
                                  name={`link_${track.id}_${opt.key}`}
                                  checked={statusVal === "none"}
                                  onChange={() => handleUpdateLinkStatus(opt.key as keyof LinkRulesConfig, "none")}
                                  disabled={isReadOnly}
                                  className="accent-zinc-500"
                                />
                                <span className={statusVal === "none" ? "text-[#8a9ba8] font-bold" : "text-zinc-600"}>
                                  Không
                                </span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#263339] font-mono text-xs">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Bước 2: Vòng Thi</span>
        </button>

        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-4 py-2 bg-[#13191c] border border-[#263339] hover:border-[#8b5cf6] text-[#8a9ba8] hover:text-[#e1e7ec] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4 text-[#8b5cf6]" />
              <span>LƯU BẢN NHÁP</span>
            </button>
          )}

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
    </div>
  );
};
