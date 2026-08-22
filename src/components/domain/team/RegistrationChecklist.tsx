"use client";

import { Check, X } from "lucide-react";
import type { MemberItem } from "@/viewModels/team/teamTypes";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

export interface RegistrationRequirements {
  memberCount: number;
  hasEnoughMembers: boolean;
  membersWithoutProfile: MemberItem[];
}

export function buildRequirements(members: MemberItem[]): RegistrationRequirements {
  const memberCount = members.length;
  return {
    memberCount,
    hasEnoughMembers: memberCount >= MIN_MEMBERS && memberCount <= MAX_MEMBERS,
    // BE chặn chốt đăng ký khi thành viên chưa nộp hồ sơ thí sinh, không phải khi
    // hồ sơ chưa được duyệt — checklist phải bám đúng điều kiện đó.
    membersWithoutProfile: members.filter((m) => !m.hasStudentProfile),
  };
}

// Dùng chung cho cả banner trên trang lẫn hộp thoại ghi danh để hai nơi không
// bao giờ mô tả điều kiện khác nhau.
export function RegistrationChecklist({ requirements }: { requirements: RegistrationRequirements }) {
  const { memberCount, hasEnoughMembers, membersWithoutProfile } = requirements;

  const items = [
    {
      ok: hasEnoughMembers,
      label: `Đủ ${MIN_MEMBERS}–${MAX_MEMBERS} thành viên`,
      detail: `Hiện có ${memberCount} người`,
    },
    {
      ok: membersWithoutProfile.length === 0,
      label: "Mọi thành viên đã nộp hồ sơ thí sinh",
      detail:
        membersWithoutProfile.length === 0
          ? "Tất cả đã nộp hồ sơ"
          : `Chưa nộp: ${membersWithoutProfile.map((m) => m.fullName).join(", ")}`,
    },
  ];

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 p-2.5 rounded bg-zinc-900/40 border border-zinc-800/80">
          {item.ok ? (
            <div className="p-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 shrink-0 mt-0.5">
              <Check className="size-4 text-emerald-400" aria-hidden="true" />
            </div>
          ) : (
            <div className="p-1 rounded-full bg-amber-950/60 border border-amber-500/40 shrink-0 mt-0.5">
              <X className="size-4 text-amber-400" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-wide">{item.label}</div>
            <div
              className={`text-xs mt-0.5 leading-relaxed ${
                item.ok ? "text-emerald-300/80" : "text-amber-300"
              }`}
            >
              {item.detail}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
