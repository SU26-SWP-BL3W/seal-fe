"use client";

import React from "react";
import { useCreateEventWizardViewModel } from "@/viewModels/useCreateEventWizardViewModel";
import { Step1EventBasicInfo } from "@/components/domain/event-wizard/Step1EventBasicInfo";
import { Step2RoundConfig } from "@/components/domain/event-wizard/Step2RoundConfig";
import { Step3TrackConfig } from "@/components/domain/event-wizard/Step3TrackConfig";
import { Step4TemplateCriteriaEditor } from "@/components/domain/event-wizard/Step4TemplateCriteriaEditor";
import { Step6EventConfirmation } from "@/components/domain/event-wizard/Step6EventConfirmation";
import { Shield, Layers, Target, Sliders, AlertCircle, ArrowLeft, CheckCircle2, Rocket } from "lucide-react";
import Link from "next/link";

import { useGetTemplates } from "@/repositories/templatesRepository";

export const CreateEventWizardView: React.FC = () => {
  const wizard = useCreateEventWizardViewModel();
  const { data: templates = [] } = useGetTemplates();

  // Streamlined 5-Step Event Config Wizard (Staff Assignment managed in dedicated view C8)
  const steps = [
    { number: 1, label: "Thông Tin", icon: Shield },
    { number: 2, label: "Vòng Thi", icon: Layers },
    { number: 3, label: "Hạng Mục", icon: Target },
    { number: 4, label: "Tiêu Chí", icon: Sliders },
    { number: 5, label: "Công Bố", icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans flex flex-col">
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263339] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#8a9ba8] mb-2">
              <Link href="/coordinator/dashboard" className="hover:text-[#8b5cf6] flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Bảng Điều Khiển Coordinator
              </Link>
              <span>/</span>
              <span className="text-[#8b5cf6] font-bold">Cấu Hình Sự Kiện Phụ Trách</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider flex items-center gap-3">
              <Shield className="w-7 h-7 text-[#8b5cf6]" />
              CẤU HÌNH NGHIỆP VỤ SỰ KIỆN PHỤ TRÁCH
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1">
              Hoàn tất cấu hình các Vòng thi, Hạng mục và Tiêu chí chấm điểm cho sự kiện.
            </p>
          </div>

          <div className="px-4 py-2 bg-[#13191c] border border-[#263339] font-mono text-xs">
            <span className="text-[#8a9ba8] block uppercase text-[10px]">Quyền Hạn Nghiệp Vụ:</span>
            <span className="text-[#8b5cf6] font-bold">CẤU HÌNH BAN TỔ CHỨC (COORDINATOR)</span>
          </div>
        </div>

        {/* HUD Step Indicator Bar (5 Steps) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 font-mono text-xs">
          {steps.map((step) => {
            const isActive = wizard.currentStep === step.number;
            const isCompleted = step.number < wizard.currentStep || (step.number === 5 && wizard.canPublishEvent);
            const isClickable = true;

            return (
              <button
                key={step.number}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) wizard.setCurrentStep(step.number);
                }}
                className={`p-3 border text-left transition-all duration-200 flex items-center gap-2.5 relative group ${
                  !isClickable
                    ? "opacity-40 cursor-not-allowed bg-[#13191c]/20 border-[#263339] text-[#8a9ba8]"
                    : isActive
                    ? "bg-[#8b5cf6]/15 border-2 border-[#8b5cf6] text-[#e1e7ec] scale-[1.02] z-10 cursor-pointer"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 cursor-pointer"
                    : "bg-[#13191c] border-[#263339] text-[#8a9ba8] hover:border-[#8b5cf6] hover:text-[#e1e7ec] cursor-pointer"
                }`}
              >
                {/* Status Icon / Number Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? "bg-[#8b5cf6] text-white font-black"
                      : isCompleted
                      ? "bg-emerald-500 text-black"
                      : "bg-[#0a0e10] text-[#8a9ba8] border border-[#263339]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest block text-[#8a9ba8]">
                      Bước {step.number}
                    </span>
                  </div>
                  <div className="font-bold truncate text-xs">{step.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {wizard.errorMessage && (
          <div className="p-4 bg-red-500/10 border border-[#ef4444]/30 text-[#ef4444] font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#ef4444]" />
            <span>{wizard.errorMessage}</span>
          </div>
        )}

        {/* Step Component View */}
        <div className="transition-all duration-300">
          {wizard.currentStep === 1 && (
            <Step1EventBasicInfo
              eventData={wizard.eventData}
              onNext={wizard.handleNextStep}
              isSubmitting={wizard.isSubmitting}
              isReadOnly={true}
            />
          )}

          {wizard.currentStep === 2 && (
            <Step2RoundConfig
              rounds={wizard.rounds}
              onAddRound={wizard.handleAddRound}
              onRemoveRound={wizard.handleRemoveRound}
              onUpdateRound={wizard.handleUpdateRound}
              onNext={wizard.handleNextStep}
              onPrev={wizard.handlePrevStep}
            />
          )}

          {wizard.currentStep === 3 && (
            <Step3TrackConfig
              rounds={wizard.rounds}
              tracks={wizard.tracks}
              onAddTrack={wizard.handleAddTrack}
              onRemoveTrack={wizard.handleRemoveTrack}
              onUpdateTrack={wizard.handleUpdateTrack}
              onNext={wizard.handleNextStep}
              onPrev={wizard.handlePrevStep}
            />
          )}

          {wizard.currentStep === 4 && (
            <Step4TemplateCriteriaEditor
              tracks={wizard.tracks}
              templates={templates}
              criteriasByTrack={wizard.criteriasByTrack}
              onUpdateTrackCriterias={wizard.setCriteriasForTrack}
              onApplyToAllTracks={wizard.applyCriteriasToAllTracks}
              templateName={wizard.templateName}
              onUpdateTemplateName={wizard.setTemplateName}
              criterias={wizard.criterias}
              totalWeight={wizard.totalWeight}
              isValidWeight100={wizard.isValidWeight100}
              onAddCriteria={wizard.handleAddCriteria}
              onRemoveCriteria={wizard.handleRemoveCriteria}
              onUpdateCriteria={wizard.handleUpdateCriteria}
              onNext={wizard.handleNextStep}
              onPrev={wizard.handlePrevStep}
            />
          )}

          {wizard.currentStep === 5 && (
            <Step6EventConfirmation
              eventId={(wizard.createdEvent as any)?.id || (wizard.createdEvent as any)?.Id}
              eventData={wizard.eventData}
              rounds={wizard.rounds}
              tracks={wizard.tracks}
              criterias={wizard.criterias}
              staffInvites={wizard.staffInvites}
              canPublishEvent={wizard.canPublishEvent}
              validationMissingItems={wizard.validationMissingItems}
              onPrev={wizard.handlePrevStep}
            />
          )}
        </div>
      </main>
    </div>
  );
};
