"use client";

import React from "react";
import { useCreateEventWizardViewModel } from "@/viewModels/useCreateEventWizardViewModel";
import { Step1EventBasicInfo } from "@/components/domain/event-wizard/Step1EventBasicInfo";
import { Step2RoundConfig } from "@/components/domain/event-wizard/Step2RoundConfig";
import { Step3TrackConfig } from "@/components/domain/event-wizard/Step3TrackConfig";
import { Step4TemplateCriteriaEditor } from "@/components/domain/event-wizard/Step4TemplateCriteriaEditor";
import { Step5StaffAssignment } from "@/components/domain/event-wizard/Step5StaffAssignment";
import { Step6EventConfirmation } from "@/components/domain/event-wizard/Step6EventConfirmation";
import { Shield, Layers, Target, Sliders, Users, AlertCircle, ArrowLeft, CheckCircle2, Check, Lock, Rocket } from "lucide-react";
import Link from "next/link";

import { useGetTemplates } from "@/repositories/templatesRepository";

export const CreateEventWizardView: React.FC = () => {
  const wizard = useCreateEventWizardViewModel();
  const { data: templates = [] } = useGetTemplates();

  const steps = [
    { number: 1, label: "Tạo Event", icon: Shield },
    { number: 2, label: "Vòng Thi", icon: Layers },
    { number: 3, label: "Hạng Mục", icon: Target },
    { number: 4, label: "Tiêu Chí", icon: Sliders },
    { number: 5, label: "Nhân Sự", icon: Users },
    { number: 6, label: "Công Bố", icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] mb-2">
              <Link href="/coordinator/dashboard" className="hover:text-[var(--accent-primary)] flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Coordinator Control Center
              </Link>
              <span>/</span>
              <span className="text-[var(--accent-primary)] font-bold">Cấu Hình Chi Tiết Sự Kiện</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-3">
              <Shield className="w-8 h-8 text-[var(--accent-primary)]" />
              Thiết Lập Vòng Thi, Bảng Đấu & Tiêu Chí Chấm
            </h1>
          </div>

          <div className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped font-mono text-xs">
            <span className="text-[var(--text-muted)] block uppercase text-[10px]">Trạng Thái Nghiệp Vụ:</span>
            <span className="text-[var(--accent-primary)] font-bold">CẤU HÌNH BAN TỔ CHỨC</span>
          </div>
        </div>

        {/* HUD Step Indicator Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {steps.map((step) => {
            const isActive = wizard.currentStep === step.number;
            const isCompleted = step.number === 6 ? wizard.canPublishEvent : Boolean(wizard.stepDoneMap[step.number]);
            const isClickable = step.number <= wizard.currentStep || Boolean(wizard.stepDoneMap[step.number - 1]);

            return (
              <button
                key={step.number}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) wizard.setCurrentStep(step.number);
                }}
                className={`p-3 border text-left transition-all duration-200 hud-clipped flex items-center gap-2.5 relative group ${
                  !isClickable
                    ? "opacity-40 cursor-not-allowed bg-[var(--bg-panel)]/20 border-[var(--border-muted)]/50 text-[var(--text-muted)]"
                    : isActive
                    ? "bg-[rgba(6,182,212,0.15)] border-2 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] text-cyan-300 scale-[1.02] z-10 cursor-pointer"
                    : isCompleted
                    ? "bg-[rgba(16,185,129,0.1)] border-[var(--color-success)] text-[var(--color-success)] hover:bg-[rgba(16,185,129,0.2)] cursor-pointer"
                    : "bg-[var(--bg-panel)]/40 border-[var(--border-muted)] text-[var(--text-muted)] hover:border-slate-500 hover:text-[var(--text-primary)] cursor-pointer"
                }`}
              >
                {/* Status Icon / Number Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? "bg-cyan-400 text-black shadow-[0_0_8px_#22d3ee] font-black"
                      : isCompleted
                      ? "bg-[var(--color-success)] text-black"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-muted)]"
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
                    <span className="font-mono text-[9px] uppercase tracking-widest block text-[var(--text-muted)]">
                      Bước {step.number}
                    </span>

                    {/* Step Status Badge */}
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 animate-pulse"
                          : isCompleted
                          ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isActive ? "⚡ Đang làm" : isCompleted ? "✓ Xong" : "Chờ"}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs truncate block mt-0.5 ${
                      isActive ? "text-cyan-200" : isCompleted ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {wizard.errorMessage && (
          <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)] text-[var(--color-danger)] font-mono text-xs hud-clipped flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
            <span>{wizard.errorMessage}</span>
          </div>
        )}

        {/* Step Component View */}
        <div className="transition-all duration-300">
          {wizard.currentStep === 1 && (
            <Step1EventBasicInfo
              eventData={wizard.eventData}
              onUpdateField={wizard.handleUpdateEventField}
              onNext={wizard.handleNextStep}
              isSubmitting={wizard.isSubmitting}
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
            <Step5StaffAssignment
              tracks={wizard.tracks}
              staffInvites={wizard.staffInvites}
              onAddStaffInvite={wizard.handleAddStaffInvite}
              onRemoveStaffInvite={wizard.handleRemoveStaffInvite}
              onFinish={wizard.handleNextStep}
              onPrev={wizard.handlePrevStep}
              isSubmitting={wizard.isSubmitting}
              successMessage={wizard.successMessage}
            />
          )}

          {wizard.currentStep === 6 && (
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
